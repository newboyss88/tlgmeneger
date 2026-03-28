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
    const text = (message.text || '').trim()
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
           await sendTelegramMessage(botToken, chatId, '⛔ Siz bloklangansiz.')
        }
        return NextResponse.json({ ok: true })
      }
    }

    // LINGUISTIC SETTINGS - Priority: Group Config > Bot Config > User TG Language
    let lng = bot.language as 'uz' | 'ru' | 'en' || 'uz';
    
    if (chatType === 'group' || chatType === 'supergroup') {
       const group = bot.groups.find((g: any) => String(g.chatId) === String(chatId));
       if (group && group.language) {
          lng = group.language as 'uz' | 'ru' | 'en';
       }
    } else {
       const userLang = fromUser?.language_code;
       if (userLang && ['uz', 'ru', 'en'].includes(userLang)) {
          // If we want to strictly follow user's TG language, uncomment:
          // lng = userLang as 'uz' | 'ru' | 'en';
       }
    }
    
    const dict = {
      uz: {
        autoDeduct: 'Avto-chiqim', product: 'Mahsulot', deduct: 'Chiqim', income: 'Kirim', newBalance: 'Yangi qoldiq',
        statusLow: 'Yana kam qoldi!', statusOk: 'Yetarli', needQtyMsg: 'Skladdan amaliyot uchun sonni kiriting. Masalan: "{name} 1ta"',
        price: 'Narx', balance: 'Qoldiq',
        product_not_found: '❌ Bunday mahsulot (yoki SKU) omborda topilmadi. Nomini yoki SKU kodini tekshirib qaytadan urinib ko\'ring.',
        multiple_products_found: '🤔 Quyidagi mahsulotlardan qaysi birini nazarda tutdingiz?',
        select_warehouse: '🏢 Qaysi ombordan amaliyot bajaramiz?',
        select_product: '📦 Qaysi mahsulotni tanlaysiz?',
        select_quantity: 'Nechta chiqim (yoki kirim) qilasiz?',
        back: '◀️ Ortga', cancel: 'Bekor qilish',
        also_found: 'Xuddi shunday yana {count} ta mahsulot bor. Aniq nomini yozing.'
      },
      ru: {
        autoDeduct: 'Авто-списание', product: 'Товар', deduct: 'Списание', income: 'Приход', newBalance: 'Новый остаток',
        statusLow: 'Мало в наличии!', statusOk: 'Достаточно', needQtyMsg: 'Для списания укажите количество. Например: "{name} 1шт"',
        price: 'Цена', balance: 'Остаток',
        product_not_found: '❌ Такой товар (или артикул) не найден на складе. Проверьте правильность написания.',
        multiple_products_found: '🤔 Какой именно из этих товаров вы имели в виду?',
        select_warehouse: '🏢 С каким складом будем работать?',
        select_product: '📦 Какой продукт выберите?',
        select_quantity: 'Укажите количество для операции:',
        back: '◀️ Назад', cancel: 'Отмена',
        also_found: 'Также найдено ещё {count} товар(ов). Укажите точное название.'
      },
      en: {
        autoDeduct: 'Auto-deduction', product: 'Product', deduct: 'Deducted', income: 'Added', newBalance: 'New balance',
        statusLow: 'Running low!', statusOk: 'In stock', needQtyMsg: 'To deduct, please specify the quantity. E.g: "{name} 1pcs"',
        price: 'Price', balance: 'Balance',
        product_not_found: '❌ Such a product (or SKU) was not found in the warehouse. Please check the spelling.',
        multiple_products_found: '🤔 Which of the following products did you mean?',
        select_warehouse: '🏢 Which warehouse would you like to operate in?',
        select_product: '📦 Which product do you want to select?',
        select_quantity: 'Please specify the quantity:',
        back: '◀️ Back', cancel: 'Cancel',
        also_found: 'There are also {count} more product(s) found. Please specify the exact name.'
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
        const buttons = bot.warehouses.map((w: any) => [{ text: `🏢 ${w.name}`, callback_data: `wh_${w.id}` }]);
        await sendTelegramMessage(botToken, chatId, `*${t.select_warehouse}*`, 'Markdown', { inline_keyboard: buttons });
        return NextResponse.json({ ok: true })
      }

      if (data.startsWith('wh_')) {
        const wId = data.replace('wh_', '');
        const wh = bot.warehouses.find((w: any) => w.id === wId);
        if (wh) {
            const buttons = wh.products.slice(0, 50).map((p: any) => [{ text: `📦 ${p.name} (${p.quantity} ${p.unit})`, callback_data: `pr_${p.id}` }]);
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
                { text: `📉 -1`, callback_data: `act_out_1_${pr.id}` },
                { text: `📉 -5`, callback_data: `act_out_5_${pr.id}` },
                { text: `📉 -10`, callback_data: `act_out_10_${pr.id}` }
              ],
              [
                { text: `📈 +1`, callback_data: `act_in_1_${pr.id}` },
                { text: `📈 +5`, callback_data: `act_in_5_${pr.id}` },
                { text: `📈 +10`, callback_data: `act_in_10_${pr.id}` }
              ],
              [{ text: t.back, callback_data: `wh_${pr.warehouseId}` }]
            ];
            const msg = `📱 *${pr.name}*\n🏢 ${pr.warehouseName}\n📦 ${t.balance}: *${pr.quantity}* ${pr.unit}\n\n${t.select_quantity}`;
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

            const status = newQuantity <= pr.minQuantity ? `🔴 ${t.statusLow}` : `🟢 ${t.statusOk}`;
            const pType = type === 'OUT' ? `📉 ${t.deduct}` : `📈 ${t.income}`;
            const msg = `✅ *Operatsiya muvaffaqiyatli:*\n📱 ${t.product}: *${pr.name}*\n${pType}: *${actualQty}* ${pr.unit}\n📦 ${t.newBalance}: *${newQuantity}* ${pr.unit}\n${status}`;
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
      const helpText = `🤖 *Bot buyruqlari:*\n\n` +
        `/menu — 🕹 Interaktiv boshqaruv pulti\n` +
        `/sklad — 🏢 Skladlar ro'yxati\n` +
        `/mahsulot [nom] — 🔍 Mahsulot izlash\n` +
        `/qoldiq [nom] — 📊 Qoldiqni tekshirish\n\n` +
        `📝 Guruhda qisqacha nom bilan sписание ham ishlaydi (Masalan: 'Toner 1 шт')!`;
      await sendTelegramMessage(botToken, chatId, helpText, 'Markdown')
      return NextResponse.json({ ok: true })
    }

    if (text === '/menu' || text === '/sklad') {
       const buttons = bot.warehouses.map((w: any) => [{ text: `🏢 ${w.name}`, callback_data: `wh_${w.id}` }]);
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
        const nameQuery = text.replace(/\d+/g, '').replace(/(ta|sht|шт|dona|d|pcs|штуки|штук)/gi, '').replace(/[?!.,\-]/g, ' ').trim().toLowerCase();

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

               const status = newQuantity <= product.minQuantity ? `🔴 ${t.statusLow}` : `🟢 ${t.statusOk}`;
               const msg = `✅ *${t.autoDeduct}:*\n📱 ${t.product}: *${product.name}*\n📦 ${t.deduct}: *${actualDeduct}* ${product.unit}\n📉 ${t.newBalance}: *${newQuantity}* ${product.unit}\n${status}`;
               await sendTelegramMessage(botToken, chatId, msg, 'Markdown');
            } else if (found.length > 1 && qtyToSubtract > 0) {
               const buttons = found.slice(0, 8).map((p: any) => [{ text: `${p.name} (Qoldiq: ${p.quantity})`, callback_data: `act_out_${qtyToSubtract}_${p.id}` }]);
               await sendTelegramMessage(botToken, chatId, `*${t.multiple_products_found}*`, 'Markdown', { inline_keyboard: buttons });
            } else if (found.length > 0 && qtyToSubtract === 0) {
               const product = found[0];
               const status = product.quantity <= product.minQuantity ? `🔴 ${t.statusLow}` : `🟢 ${t.statusOk}`;
               let msg = `📱 *${product.name}*\n📦 ${t.balance}: *${product.quantity}* ${product.unit}\n💰 ${t.price}: ${new Intl.NumberFormat('uz-UZ').format(product.price)}\n${status}`;
               if (found.length > 1) msg += `\n\n_(${t.also_found.replace('{count}', String(found.length - 1))})_`;
               msg += `\n\n_💡 ${t.needQtyMsg.replace('{name}', product.name)}_`;
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
