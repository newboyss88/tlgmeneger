import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const groups = await prisma.group.findMany({
      where: { bot: { userId: (session.user as any).id } },
      include: { bot: { select: { token: true, name: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Group GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { chatId, botId, language } = await request.json()

    if (!chatId || !botId) {
      return NextResponse.json({ error: 'Chat ID va bot tanlang' }, { status: 400 })
    }

    // Get bot token
    const bot = await prisma.bot.findUnique({ where: { id: botId } })
    if (!bot) return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 })

    // Verify group with Telegram API
    const chatRes = await fetch(`https://api.telegram.org/bot${bot.token}/getChat?chat_id=${chatId}`)
    const chatData = await chatRes.json()

    if (!chatData.ok) {
      return NextResponse.json({ error: 'Guruh topilmadi. Chat ID ni tekshiring va bot guruhga admin sifatida qo\'shilganligini tekshiring.' }, { status: 400 })
    }

    const title = chatData.result.title || 'Guruh'
    const chatType = chatData.result.type || 'supergroup'

    // Check if group already exists
    const existing = await prisma.group.findFirst({
      where: { chatId: chatId.toString() },
    })

    if (existing) {
      // Update existing
      const group = await (prisma.group as any).update({
        where: { id: existing.id },
        data: { title, type: chatType, isActive: true, language: language || 'uz' },
      })
      return NextResponse.json(group)
    }

    const group = await (prisma.group as any).create({
      data: {
        chatId: chatId.toString(),
        title,
        type: chatType,
        isActive: true,
        autoReply: true,
        botId,
        language: language || 'uz',
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Group',
        entityId: group.id,
        details: JSON.stringify({ chatId, title }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Group POST error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, autoReply, title, description, avatar, language } = await request.json()
    if (!id) return NextResponse.json({ error: 'Group ID kerak' }, { status: 400 })

    const group = await prisma.group.findUnique({ where: { id }, include: { bot: true } })
    if (!group) return NextResponse.json({ error: 'Group topilmadi' }, { status: 404 })

    const botToken = group.bot.token
    const chatId = group.chatId

    if (title && title !== group.title) {
       await fetch(`https://api.telegram.org/bot${botToken}/setChatTitle`, {
           method: 'POST', headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ chat_id: chatId, title })
       })
    }
    if (description !== undefined) {
       await fetch(`https://api.telegram.org/bot${botToken}/setChatDescription`, {
           method: 'POST', headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ chat_id: chatId, description })
       })
    }
    if (avatar && avatar.startsWith('data:image')) {
       try {
         const base64Data = avatar.split(',')[1]
         const mimeType = avatar.split(',')[0].match(/:([^;]+);/)?.[1] || 'image/jpeg'
         const buffer = Buffer.from(base64Data, 'base64')
         
         // Note: Use File for better Node.js FormData compatibility
         const file = new File([buffer], 'photo.jpg', { type: mimeType })
         const formData = new FormData()
         formData.append('chat_id', chatId)
         formData.append('photo', file)
         
         const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/setChatPhoto`, {
             method: 'POST',
             body: formData
         })
         const pData = await photoRes.json()
         if (!pData.ok) {
           console.error('Group Avatar setChatPhoto failed:', pData.error_code, pData.description)
         } else {
           console.log('Group Avatar setChatPhoto success')
         }
       } catch (err) {
         console.error('Group Avatar update error:', err)
       }
    }

    const updatedGroup = await (prisma.group as any).update({
      where: { id },
      data: {
        ...(autoReply !== undefined && { autoReply }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(avatar !== undefined && { avatar }),
        ...(language !== undefined && { language }),
      },
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Group PUT error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Group ID kerak' }, { status: 400 })

    await prisma.group.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Group',
        entityId: id,
        details: '{}',
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Group DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
