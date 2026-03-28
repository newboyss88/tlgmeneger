import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const warehouses = await prisma.warehouse.findMany({
      where: {
        bot: { userId: (session.user as any).id }
      },
      include: {
        products: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        bot: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(warehouses)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, location, botId: reqBotId } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Nom ko\'rsatilishi shart' }, { status: 400 })
    }

    let botId = reqBotId
    const userId = (session.user as any).id

    if (!botId) {
      const firstBot = await prisma.bot.findFirst({ where: { userId } })
      if (!firstBot) {
        return NextResponse.json({ error: 'Sklad yaratish uchun avval bot ulashingiz kerak' }, { status: 400 })
      }
      botId = firstBot.id
    }

    const warehouse = await prisma.warehouse.create({
      data: { name, description, location, botId },
      include: {
        products: true,
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Warehouse',
        entityId: warehouse.id,
        details: JSON.stringify({ name }),
        userId,
      },
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    console.error('Error creating warehouse:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
