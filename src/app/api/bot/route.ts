import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized or Session ID missing' }, { status: 401 })
    }

    const userId = (session.user as any).id
    console.log('[API BOT] Fetching bots for user:', userId)

    const bots = await prisma.bot.findMany({
      where: { userId: userId },
      include: {
        groups: true,
        warehouses: { include: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bots)
  } catch (error: any) {
    console.error('Bot GET error:', error)
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { token, name, username, description, welcomeMessage } = await request.json()

    if (!token) return NextResponse.json({ error: 'Token kiriting' }, { status: 400 })

    const bot = await prisma.bot.create({
      data: {
        token,
        username: username || '',
        name: name || 'Bot',
        description: description || '',
        welcomeMessage: welcomeMessage || 'Assalomu alaykum! Botga xush kelibsiz! 🤖',
        isActive: true,
        userId: (session.user as any).id,
      },
    })

    // Auto setWebhook
    const origin = new URL(request.url).origin
    await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `${origin}/api/telegram/webhook?botId=${bot.id}` })
    }).catch(console.error)

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Bot',
        entityId: bot.id,
        details: JSON.stringify({ botUsername: bot.username }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(bot, { status: 201 })
  } catch (error) {
    console.error('Bot POST error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, token, name, username, description, welcomeMessage, avatar, language } = await request.json()

    if (!id) return NextResponse.json({ error: 'Bot ID kerak' }, { status: 400 })

    const existing = await prisma.bot.findUnique({ where: { id } })

    const updateData: any = {}
    if (token) updateData.token = token
    if (name) updateData.name = name
    if (username) updateData.username = username
    if (description !== undefined) updateData.description = description
    if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage
    if (avatar !== undefined) updateData.avatar = avatar
    if (language !== undefined) updateData.language = language

    const bot = await prisma.bot.update({
      where: { id },
      data: updateData,
    })

    // Auto setWebhook
    const botTokenToUse = token || existing?.token
    if (botTokenToUse) {
       const origin = new URL(request.url).origin
       await fetch(`https://api.telegram.org/bot${botTokenToUse}/setWebhook`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ url: `${origin}/api/telegram/webhook?botId=${bot.id}` })
       }).catch(console.error)
    }

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Bot',
        entityId: bot.id,
        details: JSON.stringify({ updated: Object.keys(updateData) }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(bot)
  } catch (error) {
    console.error('Bot PUT error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Bot ID kerak' }, { status: 400 })

    await prisma.bot.delete({
      where: { id, userId: (session.user as any).id },
    })

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Bot',
        entityId: id,
        details: '{}',
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bot DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

