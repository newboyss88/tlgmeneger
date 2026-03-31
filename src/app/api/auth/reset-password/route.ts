import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token va yangi parol kiritilishi shart' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' }, { status: 400 })
    }

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'secret')
    } catch (err) {
      return NextResponse.json({ error: 'Token yaroqsiz yoki muddati o\'tgan' }, { status: 401 })
    }

    const userId = decoded.userId
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const lang = (user as any)?.language || 'uz'
    const { translations } = require('@/lib/i18n/translations')
    const t = translations[lang]

    // Hash new password
    const hashedPassword = await hash(password, 12)

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'User',
        entityId: userId,
        details: JSON.stringify({ action: 'Password Reset' }),
        userId: userId,
      }
    })

    return NextResponse.json({ message: t.reset_success || 'Parol muvaffaqiyatli yangilandi' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
