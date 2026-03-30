import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
       return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
    }

    const { id: targetUserId } = await context.params
    
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    })
    
    const settings = await prisma.setting.findMany({
      where: { userId: targetUserId }
    })

    const bots = await prisma.bot.findMany({ 
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' }
    })
    
    const botIds = bots.map(b => b.id)
    const groups = await prisma.group.findMany({
      where: { botId: { in: botIds } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ user, bots, groups, settings })
  } catch (error) {
    console.error('Resources GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
