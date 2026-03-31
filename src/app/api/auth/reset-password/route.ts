import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { token, password, lang: providedLang } = await request.json()
    const { translations } = require('@/lib/i18n/translations')
    const lang = providedLang || 'uz'
    const t = translations[lang]

    if (!token || !password) {
      return NextResponse.json({ error: t.api_error_token_invalid || 'Token va yangi parol kiritilishi shart' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: t.password_too_short }, { status: 400 })
    }

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'secret')
    } catch (err) {
      return NextResponse.json({ error: t.api_error_token_invalid || 'Token yaroqsiz yoki muddati o\'tgan' }, { status: 401 })
    }

    const userId = decoded.userId
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const userLang = providedLang || (user as any)?.language || 'uz'
    const ut = translations[userLang]

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

    return NextResponse.json({ message: ut.reset_success || 'Parol muvaffaqiyatli yangilandi' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
