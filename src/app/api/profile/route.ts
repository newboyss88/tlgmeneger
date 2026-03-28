import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        telegramId: true,
        role: true,
        avatar: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile GET api error:', error)
    return NextResponse.json({ error: 'Serverda xatolik yuz berdi' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 })
    }

    const { name, email, phone, telegramId, currentPassword, newPassword } = await request.json()
    const userId = (session.user as any).id

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 })
    }

    // Check email uniqueness if changing email
    if (email !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        return NextResponse.json({ error: 'Bu email band qilingan' }, { status: 400 })
      }
    }

    // Format telegram username
    let cleanTelegramId = telegramId ? telegramId.trim() : null
    if (cleanTelegramId && cleanTelegramId.startsWith('@')) {
      cleanTelegramId = cleanTelegramId.slice(1)
    }

    const updateData: any = {
      name,
      email,
      phone,
      telegramId: cleanTelegramId
    }

    // Handle password change if requested
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak' }, { status: 400 })
      }
      const isPasswordValid = await compare(currentPassword, user.password)
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Joriy parol noto\'g\'ri' }, { status: 400 })
      }
      updateData.password = await hash(newPassword, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        telegramId: true,
        role: true,
      }
    })

    // Log the change
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_PROFILE',
        entity: 'User',
        entityId: userId,
        details: JSON.stringify({ updatedSettings: true }),
        userId: userId,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Profile PUT api error:', error)
    return NextResponse.json({ error: 'Serverda xatolik yuz berdi' }, { status: 500 })
  }
}
