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

    // Email jo'natish
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'TelegramManager'
    
    // 1. Email yuborish
    const mailResult = await sendMail({
      to: user.email,
      subject: `Tasdiqlash kodi - ${appName}`,
      text: `Sizning tasdiqlash kodingiz: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #7c3aed; margin-bottom: 16px;">Tizimga kirishni tasdiqlang</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            Sizning hisobingizga kirish uchun ikki bosqichli tasdiqlash kodi:
          </p>
          <div style="background: #f8fafc; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e293b;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Ushbu kod 10 daqiqa davomida amal qiladi. Agar buni siz so'ramagan bo'lsangiz, iltimos parolingizni o'zgartiring.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
            Siz ushbu kodni Telegram botimiz orqali ham olishingiz mumkin (agar ulangan bo'lsa).
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} ${appName}. Barcha huquqlar himoyalangan.
          </p>
        </div>
      `
    })

    // 1.5 Aktiv bot ma'lumotlarini olish (SUI/UX uchun)
    const activeBot = await prisma.bot.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    const botUsername = activeBot?.username || null;

    // 2. Telegram yuborish (agar telegramId bo'lsa)
    let tgResult: { success: boolean; error?: any; code?: number } = { success: false, error: 'Telegram not linked' }
    let telegramId = user.telegramId;

    // Self-healing: Agar telegramId bo'lmasa, telegramUsername orqali qidirib ko'rish
    if (!telegramId) {
      const usernameSetting = await prisma.setting.findFirst({
        where: { userId: user.id, key: 'telegramUsername' }
      });
      
      if (usernameSetting?.value) {
        let username = usernameSetting.value.trim().toLowerCase();
        if (username.startsWith('@')) username = username.substring(1);
        
        const tgUser = await prisma.telegramUser.findFirst({
          where: { username: { equals: username } },
          orderBy: { createdAt: 'desc' }
        });
        
        if (tgUser) {
          telegramId = tgUser.telegramId;
          // Bazadagi foydalanuvchini ham yangilab qo'yamiz (keyingi safar tezroq ishlashi uchun)
          await prisma.user.update({
            where: { id: user.id },
            data: { telegramId: telegramId }
          });
        }
      }
    }

    if (telegramId) {
       const tgMsg = `🔐 *${appName}* 2FA Tasdiqlash Kodi\n\nSizning kirish kodingiz: \`${code}\`\n\n_Ushbu kod 10 daqiqa yaroqli._`
       const res = await sendTelegramMessage(telegramId, tgMsg, 'Markdown')
       
       // Telegram API xatolarini tahlil qilish
       let errorType = res.error;
       if (res.error?.includes('chat not found')) {
         errorType = 'chat_not_found';
       }
       
       tgResult = { 
         success: res.success, 
         error: errorType,
         code: res.success ? 200 : 400
       }
    }

    // Agar ikkalasi ham xato bo'lsa, xabar berish. 
    // Lekin bittasi o'tsa ham login sahifasiga o'tkazaveramiz (foydalanuvchi qaysidir yo'l bilan olishi uchun)
    if (!mailResult.success && !tgResult.success) {
      const errorMsg = `Kod yuborib bo'lmadi. Email: ${mailResult.error || 'Nomalum'}, Telegram: ${tgResult.error || 'Nomalum'}`
      throw new Error(errorMsg)
    }

    return NextResponse.json({ 
      success: true, 
      twoFactorEnabled: true,
      botUsername,
      channels: {
        email: mailResult.success,
        telegram: tgResult.success,
        tgError: tgResult.error
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
