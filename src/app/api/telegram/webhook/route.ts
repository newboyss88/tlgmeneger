import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Telegram Webhook Endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = body.message || body.edited_message

    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = message.text || ''
    const chatType = message.chat.type // 'private', 'group', 'supergroup'

    const { searchParams } = new URL(request.url)
    const urlBotId = searchParams.get('botId')

    let botQuery: any = { isActive: true }
    if (urlBotId) {
      botQuery = { id: urlBotId, isActive: true }
    }

    // Find bot by checking all active bots' webhooks (prioritizing urlBotId)
    const bots = await prisma.bot.findMany({
      where: botQuery,
      include: {
        warehouses: {
          include: { products: true }
        },
        groups: true,
      },
    })

    if (bots.length === 0) {
      console.error(`[WEBHOOK] Bot topilmadi! URL botId: ${urlBotId}`)
      return NextResponse.json({ ok: true })
    }

    const bot = bots[0] // Use the found bot
    const botToken = bot.token

    // --- UPSERT TELEGRAM USER & CHECK BAN ---
    const fromUser = message.from
    if (fromUser && !fromUser.is_bot) {
      const tgIdStr = fromUser.id.toString()
      const tgUser = await prisma.telegramUser.upsert({
        where: { botId_telegramId: { botId: bot.id, telegramId: tgIdStr } },
        update: {
          username: fromUser.username || null,
          firstName: fromUser.first_name || null,
          lastName: fromUser.last_name || null,
          source: chatType === 'private' ? 'BOT' : 'GROUP',
        },
        create: {
          telegramId: tgIdStr,
          username: fromUser.username || null,
          firstName: fromUser.first_name || null,
          lastName: fromUser.last_name || null,
          source: chatType === 'private' ? 'BOT' : 'GROUP',
          botId: bot.id
        }
      })

      if (tgUser.isBanned) {
        // Ignor banned users completely
        if (chatType === 'private') {
           await sendTelegramMessage(botToken, chatId, '⛔ Siz botdan foydalanishdan bloklangansiz.')
        }
        return NextResponse.json({ ok: true })
      }
    }
    // ----------------------------------------

    // LINGUISTIC SETTINGS
    const setting = await prisma.setting.findFirst({
      where: { userId: bot.userId, key: 'language' }
    });
    const lng = (setting?.value as 'uz' | 'ru' | 'en') || 'uz';
    
    const dict = {
      uz: {
        autoDeduct: 'Avto-chiqim', product: 'Mahsulot', deduct: 'Chiqim', newBalance: 'Yangi qoldiq',
        statusLow: 'Yana kam qoldi!', statusOk: 'Yetarli', needQtyMsg: 'Skladdan ayirish uchun sonini ham yozing (Masalan: "{name} 1ta")',
        price: 'Narx', balance: 'Qoldiq'
      },
      ru: {
        autoDeduct: 'Авто-списание', product: 'Товар', deduct: 'Списание', newBalance: 'Новый остаток',
        statusLow: 'Мало в наличии!', statusOk: 'Достаточно', needQtyMsg: 'Для списания укажите количество (Например: "{name} 1шт")',
        price: 'Цена', balance: 'Остаток'
      },
      en: {
        autoDeduct: 'Auto-deduction', product: 'Product', deduct: 'Deducted', newBalance: 'New balance',
        statusLow: 'Running low!', statusOk: 'In stock', needQtyMsg: 'To deduct, please specify the quantity (E.g: "{name} 1pcs")',
        price: 'Price', balance: 'Balance'
      }
    };
    const t = dict[lng] || dict['uz'];

    // Handle /start command
    if (text === '/start') {
      await sendTelegramMessage(botToken, chatId, bot.welcomeMessage)
      return NextResponse.json({ ok: true })
    }

    // Handle /sklad command - show all warehouses
    if (text === '/sklad') {
      let response = '📦 *Skladlar ro\'yxati:*\n\n'
      for (const warehouse of bot.warehouses) {
        const totalProducts = warehouse.products.length
        const totalQuantity = warehouse.products.reduce((sum: number, p: any) => sum + p.quantity, 0)
        response += `🏢 *${warehouse.name}*\n`
        response += `   📊 Mahsulotlar: ${totalProducts}\n`
        response += `   📦 Jami birlik: ${totalQuantity}\n\n`
      }
      if (bot.warehouses.length === 0) {
        response = '📦 Hozircha sklad yo\'q. Admin paneldan sklad yarating.'
      }
      await sendTelegramMessage(botToken, chatId, response, 'Markdown')
      return NextResponse.json({ ok: true })
    }

    // Handle /mahsulot command - search product
    if (text.startsWith('/mahsulot')) {
      const query = text.replace('/mahsulot', '').trim()
      if (!query) {
        await sendTelegramMessage(botToken, chatId, '🔍 Mahsulot nomi kiriting.\n\nMisol: `/mahsulot iPhone`', 'Markdown')
        return NextResponse.json({ ok: true })
      }

      const allProducts = bot.warehouses.flatMap((w: any) =>
        w.products.map((p: any) => ({ ...p, warehouseName: w.name }))
      )

      const found = allProducts.filter((p: any) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )

      if (found.length === 0) {
        await sendTelegramMessage(botToken, chatId, `❌ "${query}" bo'yicha mahsulot topilmadi.`)
        return NextResponse.json({ ok: true })
      }

      let response = `🔍 *"${query}" bo'yicha natijalar:*\n\n`
      for (const product of found) {
        const status = product.quantity <= product.minQuantity ? '🔴 Kam' : '🟢 Yetarli'
        response += `📱 *${product.name}*\n`
        response += `   📦 Miqdor: ${product.quantity} ${product.unit}\n`
        response += `   💰 Narx: ${new Intl.NumberFormat('uz-UZ').format(product.price)} so'm\n`
        response += `   🏢 Sklad: ${product.warehouseName}\n`
        response += `   ${status}\n\n`
      }
      await sendTelegramMessage(botToken, chatId, response, 'Markdown')
      return NextResponse.json({ ok: true })
    }

    // Handle /qoldiq command - check remaining stock
    if (text.startsWith('/qoldiq')) {
      const query = text.replace('/qoldiq', '').trim()
      const allProducts = bot.warehouses.flatMap((w: any) =>
        w.products.map((p: any) => ({ ...p, warehouseName: w.name }))
      )

      let products = allProducts
      if (query) {
        products = products.filter((p: any) => p.name.toLowerCase().includes(query.toLowerCase()))
      }

      if (products.length === 0) {
        await sendTelegramMessage(botToken, chatId, '📦 Mahsulot topilmadi.')
        return NextResponse.json({ ok: true })
      }

      let response = '📊 *Mahsulot qoldiqlari:*\n\n'
      for (const p of products) {
        const emoji = p.quantity <= p.minQuantity ? '🔴' : p.quantity <= p.minQuantity * 2 ? '🟡' : '🟢'
        response += `${emoji} ${p.name}: *${p.quantity}* ${p.unit}\n`
      }
      await sendTelegramMessage(botToken, chatId, response, 'Markdown')
      return NextResponse.json({ ok: true })
    }

    // Handle /yordam command
    if (text === '/yordam') {
      const helpText = `🤖 *Bot buyruqlari:*\n\n` +
        `/start — Botni ishga tushirish\n` +
        `/sklad — Skladlar ro'yxati\n` +
        `/mahsulot [nom] — Mahsulot izlash\n` +
        `/qoldiq [nom] — Qoldiqni tekshirish\n` +
        `/yordam — Yordam\n\n` +
        `📝 Guruhda ham ishlaydi!`
      await sendTelegramMessage(botToken, chatId, helpText, 'Markdown')
      return NextResponse.json({ ok: true })
    }

    // Auto-reply and Auto-subtract in groups
    if (chatType === 'group' || chatType === 'supergroup') {
      const group = bot.groups.find((g: any) => String(g.chatId) === String(chatId))
      console.log(`[WEBHOOK] Chat ID: ${chatId}, Found Group: ${!!group}, AutoReply: ${group?.autoReply}, Groups in DB: ${bot.groups.map((g: any) => g.chatId).join(',')}`)

      if (group) {
        const allProducts = bot.warehouses.flatMap((w: any) =>
          w.products.map((p: any) => ({ ...p, warehouseName: w.name }))
        )
        
        console.log(`[WEBHOOK] All Products count: ${allProducts.length}, Text: "${text}"`)
        
        // Check if message mentions products — extremely loose matching
        const qtyRegex = /(\d+)\s*(ta|sht|шт|dona|d|pcs|штук|штуки)/i
        let qtyToSubtract = 0
        const qtyMatch = text.match(qtyRegex)
        
        if (qtyMatch && qtyMatch[1]) {
           qtyToSubtract = parseInt(qtyMatch[1], 10)
        }
        
        console.log(`[WEBHOOK] Found quantity: ${qtyToSubtract}`)

        let subtractedSomething = false

        for (const product of allProducts) {
          const textLower = text.toLowerCase()
          const nameMatch = textLower.includes(product.name.toLowerCase())
          const skuMatch = product.sku && textLower.includes(product.sku.toLowerCase())

          if (nameMatch || skuMatch) {
            console.log(`[WEBHOOK] Product matched: ${product.name}, qty: ${qtyToSubtract}`)
            
            if (qtyToSubtract > 0) {
              // Avto-chiqim qoidalari bajarildi (nomi va soni ko'rsatilgan)
              let actualDeduct = qtyToSubtract
              
              const newQuantity = Math.max(0, product.quantity - actualDeduct)

              // DB Update
              await prisma.product.update({
                where: { id: product.id },
                data: { quantity: newQuantity }
              })

              // Transaction add
              await prisma.transaction.create({
                data: {
                  type: 'OUT',
                  quantity: actualDeduct,
                  note: `Telegram guruhdan avto-chiqim. Xabar: "${text}"`,
                  source: 'GROUP',
                  productId: product.id,
                  userId: bot.userId,
                }
              })

              const status = newQuantity <= product.minQuantity ? `🔴 ${t.statusLow}` : `🟢 ${t.statusOk}`
              const msg = `✅ *${t.autoDeduct}:*\n📱 ${t.product}: *${product.name}*\n📦 ${t.deduct}: *${actualDeduct}* ${product.unit}\n📉 ${t.newBalance}: *${newQuantity}* ${product.unit}\n${status}`
              await sendTelegramMessage(botToken, chatId, msg, 'Markdown')
              
              subtractedSomething = true
            } else if (!subtractedSomething && group.autoReply) {
              // Shunchaki nomini yozgan bo'lsa va autoReply yoniq bo'lsa, ma'lumot beramiz
              const status = product.quantity <= product.minQuantity ? `🔴 ${t.statusLow}` : `🟢 ${t.statusOk}`
              const msg = `📱 *${product.name}*\n📦 ${t.balance}: *${product.quantity}* ${product.unit}\n💰 ${t.price}: ${new Intl.NumberFormat('uz-UZ').format(product.price)}\n${status}\n\n_💡 ${t.needQtyMsg.replace('{name}', product.name)}_`
              await sendTelegramMessage(botToken, chatId, msg, 'Markdown')
              subtractedSomething = true
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    require('fs').appendFileSync('webhook-error.log', new Date().toISOString() + '\\n' + error.stack + '\\n\\n')
    return NextResponse.json({ ok: true, error: error.message })
  }
}


// ...
async function sendTelegramMessage(token: string, chatId: number, text: string, parseMode?: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text || "Noma'lum xato, matn yo'q.",
        parse_mode: parseMode,
      }),
    })
    const data = await res.json()
    if (!data.ok) {
       console.error(`[WEBHOOK] Telegram sendMessage error for chat ${chatId}:`, data)
    }
    return data
  } catch (error) {
    console.error(`[WEBHOOK] Failed to send message to ${chatId}:`, error)
  }
}

