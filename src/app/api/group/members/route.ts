import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Get group members from Telegram API
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    if (!groupId) return NextResponse.json({ error: 'Group ID kerak' }, { status: 400 })

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { bot: true },
    })

    if (!group) return NextResponse.json({ error: 'Guruh topilmadi' }, { status: 404 })

    // Get admins from Telegram API
    const adminsRes = await fetch(
      `https://api.telegram.org/bot${group.bot.token}/getChatAdministrators?chat_id=${group.chatId}`
    )
    const adminsData = await adminsRes.json()

    if (!adminsData.ok) {
      return NextResponse.json({ error: 'Guruh a\'zolarini olishda xatolik' }, { status: 400 })
    }

    // Get member count
    const countRes = await fetch(
      `https://api.telegram.org/bot${group.bot.token}/getChatMemberCount?chat_id=${group.chatId}`
    )
    const countData = await countRes.json()

    const members = adminsData.result.map((admin: any) => ({
      id: admin.user.id,
      firstName: admin.user.first_name || '',
      lastName: admin.user.last_name || '',
      username: admin.user.username || '',
      isBot: admin.user.is_bot,
      status: admin.status, // 'creator', 'administrator'
    }))

    const dbMembers = await prisma.telegramUser.findMany({
      where: { source: 'GROUP', botId: group.botId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      members,
      dbMembers,
      totalCount: countData.ok ? countData.result : members.length,
    })
  } catch (error) {
    console.error('Group members error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
