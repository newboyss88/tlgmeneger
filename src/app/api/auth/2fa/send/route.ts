import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { sendMail } from '@/lib/mail'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email va parol kiritilishi shart' }, { status: 400 })
    }

    // Foydalanuvchini topish
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        settings: true
      }
    })

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
    await sendMail({
      to: user.email,
      subject: `Tasdiqlash kodi - ${appName}`,
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
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} ${appName}. Barcha huquqlar himoyalangan.
          </p>
        </div>
      `
    })

    return NextResponse.json({ success: true, twoFactorEnabled: true })
  } catch (error: any) {
    console.error('2FA Send Error:', error)
    return NextResponse.json({ error: 'Xatolik yuz berdi' }, { status: 500 })
  }
}
