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

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`

    const mailResult = await sendMail({
      to: email,
      subject: 'Parolni tiklash - TelegramManager',
      text: `Parolingizni tiklash uchun ushbu havolaga bosing: ${resetUrl}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Parolni tiklash</h2>
          <p>Siz TelegramManager hisobingiz uchun parolni tiklashni so'radingiz.</p>
          <p>Parolni o'zgartirish uchun quyidagi tugmani bosing:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Parolni tiklash</a>
          <p>Ushbu havola 1 soat davomida amal qiladi.</p>
          <p>Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatga e'tibor bermang.</p>
        </div>
      `
    })

    if (!mailResult.success) {
      return NextResponse.json({ error: 'Email yuborishda xatolik yuz berdi' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Email muvaffaqiyatli yuborildi' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
