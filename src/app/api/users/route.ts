import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
       return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        telegramId: true,
        settings: {
          where: { key: 'telegramUsername' },
          select: { value: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const transformedUsers = users.map(u => ({
      ...u,
      telegramUsername: u.settings[0]?.value || null,
      settings: undefined
    }))

    return NextResponse.json(transformedUsers)
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
