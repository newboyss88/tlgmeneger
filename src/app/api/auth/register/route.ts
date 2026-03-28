import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, email, phone, password, telegramId } = await request.json()

    if (!name || !email || !phone || !password || !telegramId) {
      return NextResponse.json(
        { error: 'Barcha maydonlarni to\'ldiring (ism, email, telefon, parol, telegram username)' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      )
    }

    // Validate phone
    if (!phone.startsWith('+') || phone.length < 10) {
      return NextResponse.json(
        { error: 'Telefon raqamni to\'g\'ri kiriting (masalan: +998901234567)' },
        { status: 400 }
      )
    }

    let cleanTelegramId = telegramId.trim()
    if (cleanTelegramId.startsWith('@')) {
      cleanTelegramId = cleanTelegramId.slice(1)
    }
    
    if (cleanTelegramId.length < 3) {
      return NextResponse.json(
        { error: 'Telegram username noto\'g\'ri' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email allaqachon ro\'yxatdan o\'tgan' },
        { status: 400 }
      )
    }

    // Check phone uniqueness
    const existingPhone = await prisma.user.findFirst({
      where: { phone },
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        telegramId: cleanTelegramId,
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    return NextResponse.json(
      {
        message: 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz!',
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Serverda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
