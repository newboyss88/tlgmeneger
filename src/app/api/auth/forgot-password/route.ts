import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendMail } from '@/lib/mail'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email kiritilishi shart' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // For security reasons, don't reveal if user exists, but here we can return success
      return NextResponse.json({ message: 'Agar ushbu email ro\'yxatdan o\'tgan bo\'lsa, unga xat yuboriladi.' })
    }

    // Generate a reset token (expires in 1 hour)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.NEXTAUTH_SECRET || 'secret',
      { expiresIn: '1h' }
    )

    const appURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${appURL}/reset-password?token=${token}`
    
    // Platforma nomini bazadan olish
    const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
    const appNameSetting = await prisma.setting.findUnique({
      where: { userId_key: { userId: superAdmin?.id || '', key: 'appName' } }
    })
    const appName = appNameSetting?.value || process.env.NEXT_PUBLIC_APP_NAME || 'Platform'
    const lang = ((user as any).language as 'uz' | 'ru' | 'en') || 'uz'
    const { translations } = require('@/lib/i18n/translations')
    const t = translations[lang]

    const mailResult = await sendMail({
      to: email,
      subject: `${t.email_reset_subject} - ${appName}`,
      text: `${t.email_reset_body}\n${resetUrl}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #7c3aed; margin-bottom: 16px;">${t.email_reset_title}</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            ${t.email_reset_body}
          </p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 24px 0;">
            ${t.email_reset_button}
          </a>
          <p style="color: #64748b; font-size: 14px;">
            ${t.email_reset_footer}
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} ${appName}. Barcha huquqlar himoyalangan.
          </p>
        </div>
      `
    })

    if (!mailResult.success) {
      return NextResponse.json({ error: 'Email yuborishda xatolik yuz berdi' }, { status: 500 })
    }

    return NextResponse.json({ message: t.api_error_reset_email_info })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
