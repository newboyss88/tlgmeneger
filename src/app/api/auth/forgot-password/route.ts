import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendMail } from '@/lib/mail'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { email, lang: providedLang } = await request.json()
    const { translations } = require('@/lib/i18n/translations')
    
    // Normalize email
    const normalizedEmail = email?.trim().toLowerCase()

    if (!normalizedEmail) {
      return NextResponse.json({ error: translations[providedLang || 'uz'].api_error_email_required }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (!user) {
      return NextResponse.json({ error: translations[providedLang || 'uz'].email_not_found }, { status: 404 })
    }

    const lang = providedLang || ((user as any).language as 'uz' | 'ru' | 'en') || 'uz'
    const t = translations[lang]

    // Generate a reset token (expires in 1 hour)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.NEXTAUTH_SECRET || 'secret',
      { expiresIn: '1h' }
    )

    // Dinamik URL: Origin headeridan olish yoki muhit o'zgaruvchisidan
    const origin = request.headers.get('origin')
    const appURL = process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:3000'
    const resetUrl = `${appURL}/reset-password?token=${token}`
    
    // Platforma nomini bazadan olish
    const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
    const appNameSetting = await prisma.setting.findUnique({
      where: { userId_key: { userId: superAdmin?.id || '', key: 'appName' } }
    })
    const appName = appNameSetting?.value || process.env.NEXT_PUBLIC_APP_NAME || 'Platform'

    const mailResult = await sendMail({
      to: normalizedEmail,
      subject: `${t.email_reset_subject} - ${appName}`,
      text: `${t.email_reset_body}\n${resetUrl}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #7c3aed; margin-bottom: 16px;">${t.email_reset_title}</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            ${t.email_reset_body}
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #7c3aed; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);">
              ${t.email_reset_button}
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 20px;">
            ${t.email_reset_footer}
          </p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} ${appName}. ${t.all_rights_reserved}
          </p>
        </div>
      `
    })

    if (!mailResult.success) {
      console.error('Email send failed:', mailResult.error)
      return NextResponse.json({ error: t.api_error_email_sent_fail }, { status: 500 })
    }

    return NextResponse.json({ message: t.api_error_reset_email_info })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
