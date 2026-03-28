import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { botId, commands } = await request.json()

    if (!botId || !commands) {
      return NextResponse.json({ error: 'Bot ID va buyruqlar kerak' }, { status: 400 })
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId, userId: (session.user as any).id }
    })

    if (!bot) {
      return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 })
    }

    // Telegram API setMyCommands
    // commands: [{ command: 'start', description: 'Boshlash' }, ...]
    const res = await fetch(`https://api.telegram.org/bot${bot.token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands })
    })

    const data = await res.json()

    if (!data.ok) {
       return NextResponse.json({ error: data.description || 'Telegram xatosi' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Menyu yangilandi!' })
  } catch (error: any) {
    console.error('Bot Commands error:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')

    if (!botId) return NextResponse.json({ error: 'Bot ID kerak' }, { status: 400 })

    const bot = await prisma.bot.findUnique({
      where: { id: botId, userId: (session.user as any).id }
    })

    if (!bot) return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 })

    const res = await fetch(`https://api.telegram.org/bot${bot.token}/getMyCommands`)
    const data = await res.json()

    return NextResponse.json(data.result || [])
  } catch (error) {
    return NextResponse.json({ error: 'Xatolik' }, { status: 500 })
  }
}
