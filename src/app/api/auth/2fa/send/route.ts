import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { sendMail } from '@/lib/mail'
import { sendTelegramMessage } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    const input = email?.trim()

    if (!input || !password) {
      return NextResponse.json({ error: 'Email/telefon va parol kiritilishi shart' }, { status: 400 })
    }

    // Foydalanuvchini topish (email yoki telefon orqali)
    let user
    if (input.startsWith('+') || /^\d{9,}$/.test(input)) {
       user = await prisma.user.findFirst({ where: { phone: input } })
    } else {
       user = await prisma.user.findUnique({ where: { email: input } })
    }

    if (!user) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 })
    }

    // Parolni tekshirish
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Parol noto\'g\'ri' }, { status: 401 })
    }

    // 2FA yoqilganmi?
    if (!user.twoFactorEnabled) {
      return NextResponse.json({ success: true, twoFactorEnabled: false })
    }

    // 6 xonali kod yaratish
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 daqiqa yaroqli

    // Eski kodlarni o'chirish va yangisini saqlash
    await prisma.twoFactorCode.deleteMany({
      where: { userId: user.id }
    })

    await prisma.twoFactorCode.create({
      data: {
        code,
        userId: user.id,
        expiresAt
      }
    })

    // Email jo\'natish
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'TelegramManager'
    const lang = (user.language as 'uz' | 'ru' | 'en') || 'uz'
    const { translations } = require('@/lib/i18n/translations')
    const t = translations[lang]

    // 1. Email yuborish
    const mailResult = await sendMail({
      to: user.email,
      subject: `${t.email_2fa_subject} - ${appName}`,
      text: `${t.email_2fa_body} ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #7c3aed; margin-bottom: 16px;">${t.email_2fa_title}</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            ${t.email_2fa_body}
          </p>
          <div style="background: #f8fafc; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e293b;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            ${t.email_2fa_footer}
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} ${appName}. Barcha huquqlar himoyalangan.
          </p>
        </div>
      `
    })

    // 2. Telegram yuborish
    let tgResult: { success: boolean; error?: any } = { success: false, error: 'Telegram not linked' }
    let telegramId = user.telegramId;
    let botToken: string | undefined = undefined;

    // Telegram foydalanuvchisini qidirish (username va ID'larni yig'ish)
    const clues = new Set<string>();
    if (telegramId) clues.add(telegramId.toLowerCase().replace(/^@/, ''));
    
    const usernameSetting = await prisma.setting.findFirst({
      where: { userId: user.id, key: 'telegramUsername' }
    });
    if (usernameSetting?.value) {
      let u = usernameSetting.value.trim().toLowerCase();
      if (u.startsWith('@')) u = u.substring(1);
      clues.add(u);
    }

    const cluesList = Array.from(clues);

    // TelegramUser jadvalidan har qanday belgi (clue) bo'yicha qidirish
    const tgUser = await prisma.telegramUser.findFirst({
      where: { 
        OR: [
          { telegramId: { in: cluesList } },
          { username: { in: cluesList } }
        ]
      },
      include: { bot: true },
      orderBy: { updatedAt: 'desc' }
    });

    if (tgUser) {
      telegramId = tgUser.telegramId;
      botToken = tgUser.bot?.token;
      
      // Bazadagi telegramId ni yangilab qo'yamiz
      if (user.telegramId !== telegramId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramId }
        });
      }
    }

    if (telegramId) {
       const tgMsg = t.tg_2fa_message.replace('${code}', code)
       const res = await sendTelegramMessage(telegramId, tgMsg, 'Markdown', botToken)
       tgResult = { success: res.success, error: res.error }
    }

    // Agar ikkalasi ham xato bo'lsa, xabar berish. 
    if (!mailResult.success && !tgResult.success) {
      const errorMsg = `Kod yuborib bo'lmadi. Email: ${mailResult.error || 'Nomalum'}, Telegram: ${tgResult.error || 'Nomalum'}`
      throw new Error(errorMsg)
    }

    return NextResponse.json({ 
      success: true, 
      twoFactorEnabled: true,
      channels: {
        email: mailResult.success,
        telegram: tgResult.success
      }
    })
  } catch (error: any) {
    console.error('2FA Send Error:', error)
    const errorMessage = error.message || 'Xatolik yuz berdi'
    return NextResponse.json({ 
      error: `Kod yuborishda xatolik: ${errorMessage}. Iltimos, SMTP yoki Telegram bot sozlamalarini tekshiring.` 
    }, { status: 500 })
  }
}
