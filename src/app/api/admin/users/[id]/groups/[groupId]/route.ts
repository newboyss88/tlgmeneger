import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
       return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
    }

    const { id: userId, groupId } = await context.params

    // Guruhing botini tekshirish (userId bilan bog'liq)
    const userBots = await prisma.bot.findMany({ where: { userId } })
    const botIds = userBots.map(b => b.id)

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group || !botIds.includes(group.botId)) {
        return NextResponse.json({ error: 'Guruh topilmadi yoki ruxsat yo\'q' }, { status: 404 })
    }

    await prisma.group.delete({
      where: { id: groupId }
    })

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_DELETE_GROUP',
        entity: 'Group',
        entityId: groupId,
        details: JSON.stringify({ userId, botId: group.botId }),
        userId: (session.user as any).id,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin Delete Group error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
