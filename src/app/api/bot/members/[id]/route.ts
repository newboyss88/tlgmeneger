import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const { isBanned } = await request.json()
    const userId = (session.user as any).id

    // Avval foydalanuvchining botlarini topamiz
    const userBots = await prisma.bot.findMany({
      where: { userId },
      select: { id: true }
    })
    const botIds = userBots.map(b => b.id)

    // Faqat o'z botiga tegishli a'zolarni tahrirlay oladi
    const member = await prisma.telegramUser.findFirst({
      where: { id, botId: { in: botIds } }
    })

    if (!member) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 })
    }

    const updated = await prisma.telegramUser.update({
      where: { id },
      data: { isBanned }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Member PUT error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request, context: any) {
   // ACTION: KICK from specific group
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const { groupId } = await request.json()
    if (!groupId) return NextResponse.json({ error: 'Guruh ID kerak' }, { status: 400 })

    const userId = (session.user as any).id
    const userBots = await prisma.bot.findMany({
      where: { userId },
      select: { id: true }
    })
    const botIds = userBots.map(b => b.id)

    const member = await prisma.telegramUser.findFirst({
      where: { id, botId: { in: botIds } },
      include: { bot: true }
    })

    if (!member) {
      return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    }

    const group = await prisma.group.findFirst({
      where: { id: groupId, botId: member.botId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })
    }

    // Call Telegram API banChatMember
    const res = await fetch(`https://api.telegram.org/bot${member.bot.token}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         chat_id: group.chatId,
         user_id: member.telegramId
      })
    })
    
    const data = await res.json()
    if (!data.ok) {
       return NextResponse.json({ error: data.description || 'Guruhdan chiqarishda xatolik' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Member KICK error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
