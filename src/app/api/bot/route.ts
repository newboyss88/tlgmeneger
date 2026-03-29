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

    const { token, name, username, description, welcomeMessage, language } = await request.json()

    if (!token) return NextResponse.json({ error: 'Token kiriting' }, { status: 400 })

    const bot = await (prisma.bot as any).create({
      data: {
        token,
        username: username || '',
        name: name || 'Bot',
        description: description || '',
        welcomeMessage: welcomeMessage || 'Assalomu alaykum! Botga xush kelibsiz! 🤖',
        language: language || 'uz',
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

    let telegramSyncSuccess = false
    let telegramError = null
    // 0. Auto setWebhook and Avatar Sync BEFORE main DB update or alongside
    const botTokenToUse = (token || existing?.token)?.trim()
    if (botTokenToUse) {
        const origin = new URL(request.url).origin
        fetch(`https://api.telegram.org/bot${botTokenToUse}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `${origin}/api/telegram/webhook?botId=${id}` })
        }).catch(err => console.error('Bot webhook error:', err))

        // Update Avatar on Telegram if provided
        if (avatar && avatar.startsWith('data:image')) {
          try {
            console.log(`[API BOT] Syncing avatar to Telegram for Bot ID: ${id}`)
            const base64Data = avatar.split(',')[1]
            const mimeType = avatar.split(',')[0].match(/:([^;]+);/)?.[1] || 'image/jpeg'
            const buffer = Buffer.from(base64Data, 'base64')
            
            // Use node-telegram-bot-api internal _request for robust file uploading
            // as setMyProfilePhoto might be missing from the high-level API in some versions
            const TelegramBot = require('node-telegram-bot-api')
            const tg = new TelegramBot(botTokenToUse)
            
            // TELEGRAM API CHEKLOVI: Botlar o'zlarining rasmini HTTP API orqali o'zgartira olmaydi!
            // Faqat guruhlar yoki kanallar rasmini (setChatPhoto) o'zgartirish mumkin.
            // Bot rasmi faqat @BotFather orqali o'zgartirilishi shart.
            // Shuning uchun bu yerda Telegram'ga rasm yuborishga urinmaymiz, faqat sayt bazasida saqlaymiz.
            console.log('[API BOT] Bot avatarini Telegramga sinxronlash imkonsiz (API ruxsat bermaydi). Faqat DB ga saqlanadi.')
          } catch(e) { 
            console.error('[API BOT] Bot avatar sync EXCEPTION:', e) 
          }
        }
    }

    try {
      const bot = await (prisma.bot as any).update({
        where: { id },
        data: updateData,
      })
      
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Bot',
          entityId: bot.id,
          details: JSON.stringify({ updated: Object.keys(updateData) }),
          userId: (session.user as any).id,
        },
      })
      
      // If only avatar changed and we skip telegram, users might think it failed.
      // We explicitly allow avatar sync to ONLY be DB-side if it's a bot.
      if (avatar && !telegramSyncSuccess) {
         return NextResponse.json({ 
           ...bot, 
           warning: 'Dashboard-da bot rasmi o\'zgardi, lekin Telegram API cheklovi buni @BotFather orqali qilishni talab qilishi mumkin.'
         })
      }

      return NextResponse.json(bot)
    } catch (dbError) {
      console.error('[API BOT] Database update failed:', dbError)
      if (telegramSyncSuccess) {
        return NextResponse.json({ 
          message: 'Telegram-da bot rasmi o\'zgardi, lekin ichki bazaga saqlashda xato yuz berdi (rasm hajmi juda katta bo\'lishi mumkin).', 
          success: true 
        })
      }
      throw dbError
    }
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

