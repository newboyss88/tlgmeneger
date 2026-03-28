import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')
    const userId = (session.user as any).id

    let members
    if (botId) {
      members = await prisma.telegramUser.findMany({
        where: { botId },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Avval foydalanuvchining barcha botlarini topamiz
      const userBots = await prisma.bot.findMany({
        where: { userId },
        select: { id: true }
      })
      const botIds = userBots.map(b => b.id)
      
      members = await prisma.telegramUser.findMany({
        where: { botId: { in: botIds } },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json(members)
  } catch (error) {
    console.error('Members GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
