import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
       return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
    }

    const { id: userId, botId } = await context.params
    const body = await request.json()
    const { name, username, token, isActive } = body

    const updatedBot = await prisma.bot.update({
      where: { id: botId, userId },
      data: {
        name,
        username,
        token,
        isActive
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_UPDATE_BOT',
        entity: 'Bot',
        entityId: botId,
        details: JSON.stringify({ userId, ...body }),
        userId: (session.user as any).id,
      }
    })

    return NextResponse.json(updatedBot)
  } catch (error) {
    console.error('Admin Update Bot error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
       return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
    }

    const { id: userId, botId } = await context.params

    await prisma.bot.delete({
      where: { id: botId, userId }
    })

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_DELETE_BOT',
        entity: 'Bot',
        entityId: botId,
        details: JSON.stringify({ userId }),
        userId: (session.user as any).id,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin Delete Bot error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
