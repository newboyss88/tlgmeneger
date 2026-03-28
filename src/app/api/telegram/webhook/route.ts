import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = body.message || body.edited_message || body.callback_query?.message
    const callbackQuery = body.callback_query

    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const rawText = (message.text || '').trim()
    const cleanText = rawText.match(/^\/[a-zA-Z0-9_]+(@[a-zA-Z0-9_]+)?$/) 
      ? rawText.split('@')[0] 
      : rawText
    
    const text = cleanText.toLowerCase()
    const chatType = message.chat.type

    const { searchParams } = new URL(request.url)
    const urlBotId = searchParams.get('botId')

    if (!urlBotId) {
      return NextResponse.json({ ok: true })
    }

    const bots = await prisma.bot.findMany({
      where: { id: urlBotId, isActive: true },
      include: {
        warehouses: {
          include: { products: true }
        },
        groups: true,
      },
    })

    if (bots.length === 0) {
      return NextResponse.json({ ok: true })
    }

    const bot = bots[0] as any
    const botToken = bot.token

    // --- UPSERT TELEGRAM USER ---
    const fromUser = callbackQuery?.from || message.from
    let tgUserId = null;
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
      
      tgUserId = tgUser.id;

      if (tgUser.isBanned) {
        if (chatType === 'private' && !callbackQuery) {
           await sendTelegramMessage(botToken, chatId, '\u26d4 Siz bloklangansiz.')
        }
        return NextResponse.json({ ok: true })
      }
    }

    // LINGUISTIC SETTINGS - Priority: Group Config > Bot Config > Default
    let lng: 'uz' | 'ru' | 'en' = (bot.language as 'uz' | 'ru' | 'en') || 'uz';
    
    if (chatType === 'group' || chatType === 'supergroup') {
       const group = bot.groups.find((g: any) => String(g.chatId) === String(chatId));
       if (group && group.language) {
          lng = group.language as 'uz' | 'ru' | 'en';
       }
    }
    
    const dict = {
      uz: {
        autoDeduct: 'Avto-chiqim', product: 'Mahsulot', deduct: 'Chiqim', income: 'Kirim', newBalance: 'Yangi qoldiq',
        statusLow: 'Yana kam qoldi!', statusOk: 'Yetarli', needQtyMsg: 'Chiqim uchun aniq nom va sonni yozing. Masalan: "{name} 1ta"',
        price: 'Narx', balance: 'Qoldiq',
        product_not_found: '\u274c Bunday mahsulot (yoki SKU) omborda topilmadi. Nomini yoki SKU kodini tekshirib qaytadan urinib ko\'ring.',
        multiple_products_found: '\ud83e\udd14 Quyidagi mahsulotlardan qaysi birini nazarda tutdingiz?',
        select_warehouse: '\ud83c\udfe2 Qaysi ombordan amaliyot bajaramiz?',
        select_product: '\ud83d\udce6 Qaysi mahsulotni tanlaysiz?',
        select_quantity: 'Nechta chiqim (yoki kirim) qilasiz?',
        back: '\u25c0\ufe0f Ortga', cancel: 'Bekor qilish',
        also_found: 'Xuddi shunday yana {count} ta mahsulot bor. Aniq ismini yozing.',
        help_text: '\ud83e\udd16 *Bot buyruqlari:*\n\n/menu \u2014 \ud83d\udd79 Interaktiv boshqaruv menyusi\n/sklad \u2014 \ud83c\udfe2 Omborxonalar ro\'yxati\n\n\ud83d\udcdd Guruhda aniq mahsulot nomi yoki SKU bilan chiqim qiling.\nMasalan: "HP-CF217A 1ta"',
        operation_success: '\u2705 Operatsiya muvaffaqiyatli:'
      },
      ru: {
        autoDeduct: '\u0410\u0432\u0442\u043e-\u0441\u043f\u0438\u0441\u0430\u043d\u0438\u0435', product: '\u0422\u043e\u0432\u0430\u0440', deduct: '\u0421\u043f\u0438\u0441\u0430\u043d\u0438\u0435', income: '\u041f\u0440\u0438\u0445\u043e\u0434', newBalance: '\u041d\u043e\u0432\u044b\u0439 \u043e\u0441\u0442\u0430\u0442\u043e\u043a',
        statusLow: '\u041c\u0430\u043b\u043e \u0432 \u043d\u0430\u043b\u0438\u0447\u0438\u0438!', statusOk: '\u0414\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e', needQtyMsg: '\u0414\u043b\u044f \u0441\u043f\u0438\u0441\u0430\u043d\u0438\u044f \u0443\u043a\u0430\u0436\u0438\u0442\u0435 \u0442\u043e\u0447\u043d\u043e\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438 \u043a\u043e\u043b-\u0432\u043e. \u041d\u0430\u043f\u0440\u0438\u043c\u0435\u0440: "{name} 1\u0448\u0442"',
        price: '\u0426\u0435\u043d\u0430', balance: '\u041e\u0441\u0442\u0430\u0442\u043e\u043a',
        product_not_found: '\u274c \u0422\u0430\u043a\u043e\u0439 \u0442\u043e\u0432\u0430\u0440 (\u0438\u043b\u0438 \u0430\u0440\u0442\u0438\u043a\u0443\u043b) \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d \u043d\u0430 \u0441\u043a\u043b\u0430\u0434\u0435. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u043d\u0430\u043f\u0438\u0441\u0430\u043d\u0438\u044f.',
        multiple_products_found: '\ud83e\udd14 \u041a\u0430\u043a\u043e\u0439 \u0438\u043c\u0435\u043d\u043d\u043e \u0438\u0437 \u044d\u0442\u0438\u0445 \u0442\u043e\u0432\u0430\u0440\u043e\u0432 \u0432\u044b \u0438\u043c\u0435\u043b\u0438 \u0432 \u0432\u0438\u0434\u0443?',
        select_warehouse: '\ud83c\udfe2 \u0421 \u043a\u0430\u043a\u0438\u043c \u0441\u043a\u043b\u0430\u0434\u043e\u043c \u0431\u0443\u0434\u0435\u043c \u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c?',
        select_product: '\ud83d\udce6 \u041a\u0430\u043a\u043e\u0439 \u043f\u0440\u043e\u0434\u0443\u043a\u0442 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435?',
        select_quantity: '\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0434\u043b\u044f \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438:',
        back: '\u25c0\ufe0f \u041d\u0430\u0437\u0430\u0434', cancel: '\u041e\u0442\u043c\u0435\u043d\u0430',
        also_found: '\u0422\u0430\u043a\u0436\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e \u0435\u0449\u0451 {count} \u0442\u043e\u0432\u0430\u0440(\u043e\u0432). \u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0442\u043e\u0447\u043d\u043e\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435.',
        help_text: '\ud83e\udd16 *\u041a\u043e\u043c\u0430\u043d\u0434\u044b \u0431\u043e\u0442\u0430:*\n\n/menu \u2014 \ud83d\udd79 \u0418\u043d\u0442\u0435\u0440\u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0435 \u043c\u0435\u043d\u044e \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f\n/sklad \u2014 \ud83c\udfe2 \u0421\u043f\u0438\u0441\u043e\u043a \u0441\u043a\u043b\u0430\u0434\u043e\u0432\n\n\ud83d\udcdd \u0414\u043b\u044f \u0441\u043f\u0438\u0441\u0430\u043d\u0438\u044f \u0443\u043a\u0430\u0436\u0438\u0442\u0435 \u0442\u043e\u0447\u043d\u043e\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438\u043b\u0438 \u0430\u0440\u0442\u0438\u043a\u0443\u043b \u0442\u043e\u0432\u0430\u0440\u0430.\n\u041f\u0440\u0438\u043c\u0435\u0440: "HP-CF217A 1\u0448\u0442"',
        operation_success: '\u2705 \u041e\u043f\u0435\u0440\u0430\u0446\u0438\u044f \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0430:'
      },
      en: {
        autoDeduct: 'Auto-deduction', product: 'Product', deduct: 'Deducted', income: 'Added', newBalance: 'New balance',
        statusLow: 'Running low!', statusOk: 'In stock', needQtyMsg: 'To deduct, specify the exact name and quantity. E.g: "{name} 1pcs"',
        price: 'Price', balance: 'Balance',
        product_not_found: '\u274c Such a product (or SKU) was not found in the warehouse. Please check the spelling.',
        multiple_products_found: '\ud83e\udd14 Which of the following products did you mean?',
        select_warehouse: '\ud83c\udfe2 Which warehouse would you like to operate in?',
        select_product: '\ud83d\udce6 Which product do you want to select?',
        select_quantity: 'Please specify the quantity:',
        back: '\u25c0\ufe0f Back', cancel: 'Cancel',
        also_found: 'There are also {count} more product(s) found. Please specify the exact name.',
        help_text: '\ud83e\udd16 *Bot commands:*\n\n/menu \u2014 \ud83d\udd79 Interactive control menu\n/sklad \u2014 \ud83c\udfe2 Warehouse list\n\n\ud83d\udcdd To deduct, type the exact product name or SKU with quantity.\nExample: "HP-CF217A 1pcs"',
        operation_success: '\u2705 Operation completed:'
      }
    };
    const t = dict[lng] || dict['uz'];

    const allProducts = bot.warehouses.flatMap((w: any) =>
      w.products.map((p: any) => ({ ...p, warehouseName: w.name, warehouseId: w.id }))
    );

    // ==========================================
    // 1. CALLBACK QUERY
    // ==========================================
    if (callbackQuery) {
      const data = callbackQuery.data;
      
      if (data === 'menu') {
        const buttons = bot.warehouses.map((w: any) => [{ text: `\ud83c\udfe2 ${w.name}`, callback_data: `wh_${w.id}` }]);
        await sendTelegramMessage(botToken, chatId, `*${t.select_warehouse}*`, 'Markdown', { inline_keyboard: buttons });
        return NextResponse.json({ ok: true })
      }

      if (data.startsWith('wh_')) {
        const wId = data.replace('wh_', '');
        const wh = bot.warehouses.find((w: any) => w.id === wId);
        if (wh) {
            const buttons = wh.products.slice(0, 50).map((p: any) => [{ text: `\ud83d\udce6 ${p.name} (${p.quantity} ${p.unit})`, callback_data: `pr_${p.id}` }]);
            buttons.push([{ text: t.back, callback_data: 'menu' }]);
            await sendTelegramMessage(botToken, chatId, `*${wh.name}*\n\n${t.select_product}`, 'Markdown', { inline_keyboard: buttons });
        }
        return NextResponse.json({ ok: true })
      }

      if (data.startsWith('pr_')) {
        const prId = data.replace('pr_', '');
        const pr = allProducts.find((p: any) => p.id === prId);
        if (pr) {
            const buttons = [
              [
                { text: `\ud83d\udcc9 -1`, callback_data: `act_out_1_${pr.id}` },
                { text: `\ud83d\udcc9 -5`, callback_data: `act_out_5_${pr.id}` },
                { text: `\ud83d\udcc9 -10`, callback_data: `act_out_10_${pr.id}` }
              ],
              [
                { text: `\ud83d\udcc8 +1`, callback_data: `act_in_1_${pr.id}` },
                { text: `\ud83d\udcc8 +5`, callback_data: `act_in_5_${pr.id}` },
                { text: `\ud83d\udcc8 +10`, callback_data: `act_in_10_${pr.id}` }
              ],
              [{ text: t.back, callback_data: `wh_${pr.warehouseId}` }]
            ];
            const msg = `\ud83d\udcf1 *${pr.name}*\n\ud83c\udfe2 ${pr.warehouseName}\n\ud83d\udce6 ${t.balance}: *${pr.quantity}* ${pr.unit}\n\n${t.select_quantity}`;
            await sendTelegramMessage(botToken, chatId, msg, 'Markdown', { inline_keyboard: buttons });
        }
        return NextResponse.json({ ok: true })
      }

      if (data.startsWith('act_')) {
        const parts = data.split('_');
        const type = parts[1].toUpperCase(); 
        const qty = parseInt(parts[2]);
        const prId = parts.slice(3).join('_');

        const pr = allProducts.find((p: any) => p.id === prId);
        if (pr) {
            const actualQty = type === 'OUT' ? Math.min(pr.quantity, qty) : qty;
            const newQuantity = type === 'OUT' ? pr.quantity - actualQty : pr.quantity + actualQty;

            await prisma.product.update({ where: { id: pr.id }, data: { quantity: newQuantity } });
            await prisma.transaction.create({
              data: {
                type: type as 'IN' | 'OUT',
                quantity: actualQty,
                note: `Telegram Menyu orqali amaliyot.`,
                source: chatType === 'private' ? 'BOT' : 'GROUP',
                productId: pr.id,
                userId: bot.userId,
                // @ts-ignore
                telegramUserId: tgUserId
              }
            });

            const status = newQuantity <= pr.minQuantity ? `\ud83d\udd34 ${t.statusLow}` : `\ud83d\udfe2 ${t.statusOk}`;
            const pType = type === 'OUT' ? `\ud83d\udcc9 ${t.deduct}` : `\ud83d\udcc8 ${t.income}`;
            const msg = `${t.operation_success}\n\ud83d\udcf1 ${t.product}: *${pr.name}*\n${pType}: *${actualQty}* ${pr.unit}\n\ud83d\udce6 ${t.newBalance}: *${newQuantity}* ${pr.unit}\n${status}`;
            await sendTelegramMessage(botToken, chatId, msg, 'Markdown');
        }
        return NextResponse.json({ ok: true })
      }
    }

    // ==========================================
    // 2. TEXT COMMANDS
    // ==========================================
    if (!text) return NextResponse.json({ ok: true });

    if (text === '/start' || text === '/yordam' || text === '/help') {
      await sendTelegramMessage(botToken, chatId, t.help_text, 'Markdown')
      return NextResponse.json({ ok: true })
    }

    if (text === '/menu' || text === '/sklad') {
       const buttons = bot.warehouses.map((w: any) => [{ text: `\ud83c\udfe2 ${w.name}`, callback_data: `wh_${w.id}` }]);
       await sendTelegramMessage(botToken, chatId, `*${t.select_warehouse}*`, 'Markdown', { inline_keyboard: buttons });
       return NextResponse.json({ ok: true })
    }

    let canProcessText = false;
    if (chatType === 'private') {
       canProcessText = true;
    } else {
       const group = bot.groups.find((g: any) => String(g.chatId) === String(chatId));
       if (group && group.autoReply) canProcessText = true;
    }

    if (canProcessText && !text.startsWith('/')) {
        const numMatch = text.match(/(\d+)/);
        const qtyToSubtract = numMatch ? parseInt(numMatch[1], 10) : 0;
        const nameQuery = text.replace(/\d+/g, '').replace(/(ta|sht|\u0448\u0442|dona|d|pcs|\u0448\u0442\u0443\u043a\u0438|\u0448\u0442\u0443\u043a)/gi, '').replace(/[?!.,\-]/g, ' ').trim().toLowerCase();

        if (nameQuery.length > 2) {
            const found = allProducts.filter((p: any) => 
               p.name.toLowerCase().includes(nameQuery) || 
               (p.sku && p.sku.toLowerCase() === nameQuery)
            );

            if (found.length === 0 && qtyToSubtract > 0) {
               await sendTelegramMessage(botToken, chatId, t.product_not_found);
            } else if (found.length === 1 && qtyToSubtract > 0) {
               const product = found[0];
               const actualDeduct = qtyToSubtract;
               const newQuantity = Math.max(0, product.quantity - actualDeduct);

               await prisma.product.update({ where: { id: product.id }, data: { quantity: newQuantity } });
               await prisma.transaction.create({
                 data: {
                   type: 'OUT',
                   quantity: actualDeduct,
                   note: `Telegram xabardan avto-chiqim. "${text}"`,
                   source: chatType === 'private' ? 'BOT' : 'GROUP',
                   productId: product.id,
                   userId: bot.userId,
                   // @ts-ignore
                   telegramUserId: tgUserId
                 }
               });

               const status = newQuantity <= product.minQuantity ? `\ud83d\udd34 ${t.statusLow}` : `\ud83d\udfe2 ${t.statusOk}`;
               const msg = `\u2705 *${t.autoDeduct}:*\n\ud83d\udcf1 ${t.product}: *${product.name}*\n\ud83d\udce6 ${t.deduct}: *${actualDeduct}* ${product.unit}\n\ud83d\udcc9 ${t.newBalance}: *${newQuantity}* ${product.unit}\n${status}`;
               await sendTelegramMessage(botToken, chatId, msg, 'Markdown');
            } else if (found.length > 1 && qtyToSubtract > 0) {
               const buttons = found.slice(0, 8).map((p: any) => [{ text: `${p.name} (${t.balance}: ${p.quantity})`, callback_data: `act_out_${qtyToSubtract}_${p.id}` }]);
               await sendTelegramMessage(botToken, chatId, `*${t.multiple_products_found}*`, 'Markdown', { inline_keyboard: buttons });
            } else if (found.length > 0 && qtyToSubtract === 0) {
               const product = found[0];
               const status = product.quantity <= product.minQuantity ? `\ud83d\udd34 ${t.statusLow}` : `\ud83d\udfe2 ${t.statusOk}`;
               let msg = `\ud83d\udcf1 *${product.name}*\n\ud83d\udce6 ${t.balance}: *${product.quantity}* ${product.unit}\n\ud83d\udcb0 ${t.price}: ${new Intl.NumberFormat('uz-UZ').format(product.price)}\n${status}`;
               if (found.length > 1) msg += `\n\n_(${t.also_found.replace('{count}', String(found.length - 1))})_`;
               msg += `\n\n_\ud83d\udca1 ${t.needQtyMsg.replace('{name}', product.name)}_`;
               await sendTelegramMessage(botToken, chatId, msg, 'Markdown');
            }
        }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true, error: error.message })
  }
}

async function sendTelegramMessage(token: string, chatId: number, text: string, parseMode?: string, replyMarkup?: any) {
  try {
    const payload: any = { chat_id: chatId, text: text || "Noma'lum xato..." };
    if (parseMode) payload.parse_mode = parseMode;
    if (replyMarkup) payload.reply_markup = replyMarkup;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return await res.json()
  } catch (error) {
    console.error(`[WEBHOOK] Failed to send message:`, error)
  }
}
