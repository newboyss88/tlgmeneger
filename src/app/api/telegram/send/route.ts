import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 })
    }

    const { targetTelegramId, messageText } = await request.json()

    if (!targetTelegramId || !messageText) {
      return NextResponse.json({ error: 'Telegram ID va xabar matni kiritilishi shart' }, { status: 400 })
    }

    // Botni topamiz — avval joriy foydalanuvchining o'z botini, keyin boshqa faol botlarni
    let bot = await prisma.bot.findFirst({
      where: { userId: (session.user as any).id, isActive: true }
    })

    if (!bot) {
      // Agar joriy foydalanuvchida bot bo'lmasa, boshqa faol botni qidirish
      bot = await prisma.bot.findFirst({
        where: { isActive: true }
      })
    }

    if (!bot) {
      return NextResponse.json({ error: 'Faol bot topilmadi. Avval bot ulang.' }, { status: 400 })
    }

    // targetTelegramId ni tekshirish — 
    // Agar u raqam bo'lsa, to'g'ridan-to'g'ri yuboramiz.
    // Agar u username bo'lsa (@wwuzbww kabi), TelegramUser jadvalidigan raqamli ID ni qidiramiz.
    let chatId: string = String(targetTelegramId).trim()
    
    // @ belgisini olib tashlash
    if (chatId.startsWith('@')) {
      chatId = chatId.slice(1)
    }

    // Raqam emasligini tekshirish
    if (isNaN(Number(chatId))) {
      // Username bo'lsa — bazadan raqamli telegramId ni qidiramiz
      const tgUser = await prisma.telegramUser.findFirst({
        where: {
          username: chatId,
          botId: bot.id,
        }
      })

      if (tgUser) {
        chatId = tgUser.telegramId // Bu raqamli ID (masalan "123456789")
      } else {
        // Agar TelegramUser da ham topilmasa, @username sifatida yuborishga harakat qilamiz
        chatId = '@' + chatId
      }
    }

    // Telegramga jo'natamiz
    const res = await fetch(`https://api.telegram.org/bot${bot.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
      }),
    })

    const data = await res.json()

    const adminUser = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
    const lang = (adminUser as any)?.language || 'uz'
    const { translations } = require('@/lib/i18n/translations')
    const t = translations[lang]

    if (!data.ok) {
      console.error('Telegram send error:', data)
      
      let errorMsg = t.api_error_tg_send_failed || 'Xabar yuborishda xatolik yuz berdi'
      if (data.description?.includes('chat not found')) {
        errorMsg = t.api_error_tg_not_found
      } else if (data.description?.includes('bot was blocked')) {
        errorMsg = t.api_error_tg_blocked
      } else if (data.description?.includes('user is deactivated')) {
        errorMsg = t.api_error_tg_deactivated
      }
      
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: t.api_success_msg_sent })

  } catch (error) {
    console.error('Telegram send message error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
