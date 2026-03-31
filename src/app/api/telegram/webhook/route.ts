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
    let tgUserId: string | null = null;
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
           await sendTelegramMessage(botToken, chatId, '⛔ Siz bloklangansiz.', undefined, undefined, bot.id, tgUserId);
        }
        return NextResponse.json({ ok: true })
      }
    }

    // LINGUISTIC SETTINGS
    let lng: 'uz' | 'ru' | 'en' = (bot.language as 'uz' | 'ru' | 'en') || 'uz';
    if (chatType === 'group' || chatType === 'supergroup') {
       const group = bot.groups.find((g: any) => String(g.chatId) === String(chatId));
       if (group && group.language) {
          lng = group.language as 'uz' | 'ru' | 'en';
       }
    }
    
    const dict = {
      uz: {
        newBalance: 'Yangi qoldiq', statusLow: 'Yana kam qoldi!', statusOk: 'Yetarli',
        needQtyMsg: 'Chiqim uchun aniq nom va sonni yozing. Masalan: "{name} 1ta"',
        price: 'Narx', balance: 'Qoldiq', product: 'Mahsulot',
        product_not_found: '❌ Bunday mahsulot (yoki SKU) omborda topilmadi.',
        multiple_products_found: '🤔 Quyidagi mahsulotlardan qaysi birini nazarda tutdingiz?',
        select_warehouse: '🏢 Qaysi ombordan amaliyot bajaramiz?',
        select_product: '📦 Qaysi mahsulotni tanlaysiz?',
        select_period: '📅 Hisobot davrini tanlang:',
        select_quantity: 'Nechta chiqim (yoki kirim) qilasiz?',
        back: '⬅️ Ortga', cancel: 'Bekor qilish',
        help_text: '🤖 *Yordam va kontaktlar:*',
        admin_email: '📧 Pochta:', admin_tg: '📡 Telegram:',
        report_title: '📋 *Sklad Hisoboti*',
        report_empty: '📭 Ushbu davr uchun amaliyotlar topilmadi.',
        period_1: '1 oylik', period_2: '2 oylik', period_3: '3 oylik',
        units: { dona: 'dona', kg: 'kg', metr: 'm', litr: 'l' },
        deduct: 'Chiqim', income: 'Kirim', operation_success: 'Muvaffaqiyatli',
        who_to_prompt: 'Kimga qilinayotganini yozing:', who_to: 'Kimga', code: 'Kod', autoDeduct: 'Avto-chiqim', also_found: 'Yana {count} ta topildi'
      },
      ru: {
        newBalance: 'Новый остаток', statusLow: 'Мало в наличии!', statusOk: 'Достаточно',
        needQtyMsg: 'Для списания укажите название и кол-во. Например: "{name} 1шт"',
        price: 'Цена', balance: 'Остаток', product: 'Товар',
        product_not_found: '❌ Такой товар не найден.',
        multiple_products_found: '🤔 Какой именно из этих товаров вы имели в виду?',
        select_warehouse: '🏢 С каким складом будем работать?',
        select_product: '📦 Какой продукт выберите?',
        select_period: '📅 Выберите период отчета:',
        select_quantity: 'Укажите количество для операции:',
        back: '⬅️ Назад', cancel: 'Отмена',
        help_text: '🤖 *Помощь и контакты:*',
        admin_email: '📧 Почта:', admin_tg: '📡 Телеграм:',
        report_title: '📋 *Отчет по Складу*',
        report_empty: '📭 Операций за этот период не найдено.',
        period_1: '1 месяц', period_2: '2 месяца', period_3: '3 месяца',
        units: { dona: 'шт.', kg: 'кг', metr: 'м', litr: 'л' },
        deduct: 'Списание', income: 'Приход', operation_success: 'Успешно',
        who_to_prompt: 'Напишите кому:', who_to: 'Кому', code: 'Код', autoDeduct: 'Авто-списание', also_found: 'Найдено еще {count}'
      },
      en: {
        newBalance: 'New balance', statusLow: 'Running low!', statusOk: 'In stock',
        needQtyMsg: 'To deduct, specify name and quantity. E.g: "{name} 1pcs"',
        price: 'Price', balance: 'Balance', product: 'Product',
        product_not_found: '❌ Product not found.',
        multiple_products_found: '🤔 Which product did you mean?',
        select_warehouse: '🏢 Which warehouse to operate in?',
        select_product: '📦 Which product to select?',
        select_period: '📅 Select report period:',
        select_quantity: 'Specify the quantity:',
        back: '⬅️ Back', cancel: 'Cancel',
        help_text: '🤖 *Help & Contacts:*',
        admin_email: '📧 Email:', admin_tg: '📡 Telegram:',
        report_title: '📋 *Warehouse Report*',
        report_empty: '📭 No operations found for this period.',
        period_1: '1 month', period_2: '2 months', period_3: '3 months',
        units: { dona: 'pcs', kg: 'kg', metr: 'm', litr: 'l' },
        deduct: 'Deduction', income: 'Income', operation_success: 'Success',
        who_to_prompt: 'Write to whom:', who_to: 'To', code: 'Code', autoDeduct: 'Auto-deduction', also_found: '{count} more found'
      }
    };
    const t = dict[lng] || dict['uz'];

    const allProducts = bot.warehouses.flatMap((w: any) =>
      w.products.map((p: any) => ({ ...p, warehouseName: w.name, warehouseId: w.id }))
    );
    
    const fUnit = (unit: string) => (t as any).units?.[unit] || unit;

    // ==========================================
    // 1. CALLBACK QUERY
    // ==========================================
    if (callbackQuery) {
      const data = callbackQuery.data;
      
      if (data === 'menu') {
        const buttons = bot.warehouses.map((w: any) => [{ text: `🏢 ${w.name}`, callback_data: `wh_${w.id}` }]);
        await sendTelegramMessage(botToken, chatId, `*${t.select_warehouse}*`, 'Markdown', { inline_keyboard: buttons }, bot.id, tgUserId || undefined);
        return NextResponse.json({ ok: true })
      }

      if (data.startsWith('rpt_wh_')) {
        const whId = data.replace('rpt_wh_', '');
        const buttons = [
          [{ text: `📅 ${t.period_1}`, callback_data: `rpt_pd_1_${whId}` }],
          [{ text: `📅 ${t.period_2}`, callback_data: `rpt_pd_2_${whId}` }],
          [{ text: `📅 ${t.period_3}`, callback_data: `rpt_pd_3_${whId}` }],
          [{ text: t.back, callback_data: 'rpt_menu' }]
        ];
        await sendTelegramMessage(botToken, chatId, `*${t.select_period}*`, 'Markdown', { inline_keyboard: buttons }, bot.id, tgUserId || undefined);
        return NextResponse.json({ ok: true });
      }

      if (data === 'rpt_menu') {
          const buttons = bot.warehouses.map((w: any) => [{ text: `🏢 ${w.name}`, callback_data: `rpt_wh_${w.id}` }]);
          await sendTelegramMessage(botToken, chatId, `*${t.select_warehouse}*`, 'Markdown', { inline_keyboard: buttons }, bot.id, tgUserId || undefined);
          return NextResponse.json({ ok: true });
      }

      if (data.startsWith('rpt_pd_')) {
        const parts = data.split('_');
        const months = parseInt(parts[2]);
        const whId = parts[3];
        
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const wh = bot.warehouses.find((w: any) => w.id === whId);
        const productIds = wh ? wh.products.map((p: any) => p.id) : [];

        const transactions = await prisma.transaction.findMany({
          where: {
            productId: { in: productIds },
            createdAt: { gte: startDate }
          },
          include: { 
            product: true,
            telegramUser: true
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        });

        if (transactions.length === 0) {
           await sendTelegramMessage(botToken, chatId, t.report_empty, 'Markdown', undefined, bot.id, tgUserId || undefined);
        } else {
           let report = `${t.report_title} (${wh?.name})\n\n`;
           transactions.forEach(tr => {
              const date = new Date(tr.createdAt).toLocaleDateString('en-US');
              const typeChar = tr.type === 'IN' ? '📈' : '📉';
              const userName = tr.telegramUser ? (tr.telegramUser.firstName || tr.telegramUser.username || 'User') : 'User';
              const cleanNote = tr.note ? tr.note.replace('KIMGA: ', '').replace('Telegram xabardan avto-chiqim. ', '').replace(/\"/g, '') : '';
              
              report += `• ${date} | ${userName} | ${tr.product.name} | ${tr.product.sku || '-'} | ${typeChar} ${tr.quantity} ${fUnit(tr.product.unit)} | ${cleanNote}\n`;
           });
           await sendTelegramMessage(botToken, chatId, report, 'Markdown', undefined, bot.id, tgUserId || undefined);
        }

        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('wh_')) {
        const wId = data.replace('wh_', '');
        const wh = bot.warehouses.find((w: any) => w.id === wId);
        if (wh) {
            const buttons = wh.products.slice(0, 50).map((p: any) => [
              { text: `📦 ${p.name}${p.sku ? ` - ${p.sku}` : ''} (${p.quantity} ${fUnit(p.unit)})`, callback_data: `pr_${p.id}` }
            ]);
            buttons.push([{ text: t.back, callback_data: 'menu' }]);
            await sendTelegramMessage(botToken, chatId, `*${wh.name}*\n\n${t.select_product}`, 'Markdown', { inline_keyboard: buttons }, bot.id, tgUserId || undefined);
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
                { text: `📉 -2`, callback_data: `act_out_2_${pr.id}` },
                { text: `📉 -3`, callback_data: `act_out_3_${pr.id}` }
              ],
              [
                { text: `📈 +1`, callback_data: `act_in_1_${pr.id}` },
                { text: `📈 +2`, callback_data: `act_in_2_${pr.id}` },
                { text: `📈 +3`, callback_data: `act_in_3_${pr.id}` }
              ],
              [{ text: t.back, callback_data: `wh_${pr.warehouseId}` }]
            ];
            const msg = `📱 *${pr.name}*\n🏢 ${pr.warehouseName}\n📦 ${t.balance}: *${pr.quantity}* ${fUnit(pr.unit)}\n\n${t.select_quantity}`;
            await sendTelegramMessage(botToken, chatId, msg, 'Markdown', { inline_keyboard: buttons }, bot.id, tgUserId || undefined);
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
            
            if (type === 'OUT') {
               const replyMsg = `📉 ${t.deduct}: *${actualQty}* ${fUnit(pr.unit)}\n📦 ${t.product}: *${pr.name}*\n\n👇 ${t.who_to_prompt}\n\n💬 ${t.code}: OUT-${actualQty}-${pr.id}`;
               await sendTelegramMessage(botToken, chatId, replyMsg, 'Markdown', { force_reply: true }, bot.id, tgUserId || undefined);
               return NextResponse.json({ ok: true });
            }

            const newQuantity = pr.quantity + actualQty; // IN only

            await prisma.product.update({ where: { id: pr.id }, data: { quantity: newQuantity } });
            await prisma.transaction.create({
              data: {
                type: 'IN',
                quantity: actualQty,
                note: `Telegram Menyu orqali amaliyot.`,
                source: chatType === 'private' ? 'BOT' : 'GROUP',
                productId: pr.id,
                userId: bot.userId,
                // @ts-ignore
                telegramUserId: tgUserId,
                groupId: bot.groups.find((g: any) => String(g.chatId) === String(chatId))?.id
              }
            });

            const status = newQuantity <= pr.minQuantity ? `🔴 ${t.statusLow}` : `🟢 ${t.statusOk}`;
            const msg = `✅ ${t.operation_success}\n📱 ${t.product}: *${pr.name}*\n📈 ${t.income}: *${actualQty}* ${fUnit(pr.unit)}\n📦 ${t.newBalance}: *${newQuantity}* ${fUnit(pr.unit)}\n${status}`;
            await sendTelegramMessage(botToken, chatId, msg, 'Markdown', undefined, bot.id, tgUserId || undefined);
        }
        return NextResponse.json({ ok: true })
      }
    }

    // ==========================================
    // 2. TEXT COMMANDS
    // ==========================================
    if (message.reply_to_message && message.reply_to_message.text && message.reply_to_message.text.includes('OUT-')) {
        const replyText = message.reply_to_message.text;
        const match = replyText.match(/OUT\-(\d+)\-([A-Za-z0-9\-]+)/);
        if (match && text) {
            const qty = parseInt(match[1]);
            const prId = match[2];
            const noteText = text.trim();
            const pr = allProducts.find((p: any) => p.id === prId);
            if (pr) {
                const newQuantity = pr.quantity - qty;
                await prisma.product.update({ where: { id: pr.id }, data: { quantity: newQuantity } });
                await prisma.transaction.create({
                  data: {
                    type: 'OUT', quantity: qty, note: `KIMGA: ${noteText}`,
                    source: chatType === 'private' ? 'BOT' : 'GROUP',
                    productId: pr.id, userId: bot.userId,
                    // @ts-ignore
                    telegramUserId: tgUserId,
                    groupId: bot.groups.find((g: any) => String(g.chatId) === String(chatId))?.id
                  }
                });
                const status = newQuantity <= pr.minQuantity ? `🔴 ${t.statusLow}` : `🟢 ${t.statusOk}`;
                const msg = `✅ ${t.operation_success}\n📱 ${t.product}: *${pr.name}*\n📉 ${t.deduct}: *${qty}* ${fUnit(pr.unit)}\n👤 ${t.who_to}: *${noteText}*\n📦 ${t.newBalance}: *${newQuantity}* ${fUnit(pr.unit)}\n${status}`;
                await sendTelegramMessage(botToken, chatId, msg, 'Markdown', undefined, bot.id, tgUserId || undefined);
            }
            return NextResponse.json({ ok: true });
        }
    }

    if (!text) return NextResponse.json({ ok: true });

    if (text === '/start' || text === '/help' || text === '/cheking' || text === '/sklad' || text.startsWith('/')) {
      // DELETE THE USER OVERLAY COMMAND MESSAGE TO CLEAN UP
      await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: message.message_id }),
      }).catch(() => {});

      const commandName = text.replace('/', '').split('@')[0];

      
      if (commandName === 'cheking') {
          const buttons = bot.warehouses.map((w: any) => [{ text: `🏢 ${w.name}`, callback_data: `rpt_wh_${w.id}` }]);
          await sendTelegramMessage(botToken, chatId, `*${t.select_warehouse}*`, 'Markdown', { inline_keyboard: buttons }, bot.id, tgUserId || undefined);
          return NextResponse.json({ ok: true });
      }

      if (commandName === 'help') {
          const superAdmin = await prisma.user.findFirst({ 
            where: { role: 'SUPER_ADMIN' },
            include: { settings: true }
          });
          const adminEmail = superAdmin?.email || 'admin@example.com';
          const tgSetting = superAdmin?.settings.find(s => s.key === 'telegramUsername');
          const adminTg = tgSetting ? (tgSetting.value.startsWith('@') ? tgSetting.value : `@${tgSetting.value}`) : '@admin';
          
          const helpMsg = `${t.help_text}\n\n${t.admin_email} ${adminEmail}\n${t.admin_tg} ${adminTg}`;
          await sendTelegramMessage(botToken, chatId, helpMsg, 'Markdown', undefined, bot.id, tgUserId || undefined);
          return NextResponse.json({ ok: true });
      }

      if (bot.settings) {
         try {
            const settings = JSON.parse(bot.settings);
            const commands = settings.commands || [];
            const customCmd = commands.find((c: any) => c.command === commandName);
            
            if (customCmd) {
               const cmdType = customCmd.type || 'text';
               const response = customCmd.response;

               if (cmdType === 'text' && response && commandName !== 'start') {
                  await sendTelegramMessage(botToken, chatId, response, 'Markdown', undefined, bot.id, tgUserId || undefined);
                  return NextResponse.json({ ok: true });
               }

               if (cmdType === 'link' && response) {
                  const label = customCmd.description || 'Link';
                  const buttons = [[{ text: `🌐 ${label}`, url: response.startsWith('http') ? response : `https://tlgmeneger.vercel.app${response}` }]];
                  await sendTelegramMessage(botToken, chatId, `*${label}*`, 'Markdown', { inline_keyboard: buttons }, bot.id, tgUserId || undefined);
                  return NextResponse.json({ ok: true });
               }

               if (cmdType === 'action' && response) {
                  if (response === 'menu' || response === 'sklad') {
                     const buttons = bot.warehouses.map((w: any) => [{ text: `🏢 ${w.name}`, callback_data: `wh_${w.id}` }]);
                     await sendTelegramMessage(botToken, chatId, `*${t.select_warehouse}*`, 'Markdown', { inline_keyboard: buttons }, bot.id, tgUserId || undefined);
                     return NextResponse.json({ ok: true });
                  }
                  if (response === 'help') {
                     const superAdmin = await prisma.user.findFirst({ 
                        where: { role: 'SUPER_ADMIN' },
                        include: { settings: true }
                     });
                     const adminEmail = superAdmin?.email || 'admin@example.com';
                     const tgSetting = superAdmin?.settings.find(s => s.key === 'telegramUsername');
                     const adminTg = tgSetting ? (tgSetting.value.startsWith('@') ? tgSetting.value : `@${tgSetting.value}`) : '@admin';
                     const helpMsg = `${t.help_text}\n\n${t.admin_email} ${adminEmail}\n${t.admin_tg} ${adminTg}`;
                     await sendTelegramMessage(botToken, chatId, helpMsg, 'Markdown', undefined, bot.id, tgUserId || undefined);
                     return NextResponse.json({ ok: true });
                  }
               }
            }
         } catch(e) {}
      }

      if (text === '/start') {
        const welcome = bot.welcomeMessage || 'Xush kelibsiz!';
        await sendTelegramMessage(botToken, chatId, welcome, 'Markdown', undefined, bot.id, tgUserId || undefined);
        return NextResponse.json({ ok: true });
      }
    }

    if (text === '/menu' || text === '/sklad') {
       const buttons = bot.warehouses.map((w: any) => [{ text: `🏢 ${w.name}`, callback_data: `wh_${w.id}` }]);
       await sendTelegramMessage(botToken, chatId, `*${t.select_warehouse}*`, 'Markdown', { inline_keyboard: buttons }, bot.id, tgUserId || undefined);
       return NextResponse.json({ ok: true })
    }

    let canProcessText = false;
    let matchedGroup: any = null;
    if (chatType === 'private') {
       canProcessText = true;
    } else {
       matchedGroup = bot.groups.find((g: any) => String(g.chatId) === String(chatId));
       if (matchedGroup && matchedGroup.autoReply) canProcessText = true;
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
               await sendTelegramMessage(botToken, chatId, t.product_not_found, undefined, undefined, bot.id, tgUserId || undefined);
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
                   telegramUserId: tgUserId,
                   groupId: matchedGroup?.id
                 }
               });

               const status = newQuantity <= product.minQuantity ? `🔴 ${t.statusLow}` : `🟢 ${t.statusOk}`;
               const msg = `✅ *${t.autoDeduct}:*\n📱 ${t.product}: *${product.name}*\n📉 ${t.deduct}: *${actualDeduct}* ${product.unit}\n📦 ${t.newBalance}: *${newQuantity}* ${product.unit}\n${status}`;
               await sendTelegramMessage(botToken, chatId, msg, 'Markdown', undefined, bot.id, tgUserId || undefined);
            } else if (found.length > 1 && qtyToSubtract > 0) {
               const buttons = found.slice(0, 8).map((p: any) => [{ text: `${p.name} (${t.balance}: ${p.quantity})`, callback_data: `act_out_${qtyToSubtract}_${p.id}` }]);
               await sendTelegramMessage(botToken, chatId, `*${t.multiple_products_found}*`, 'Markdown', { inline_keyboard: buttons }, bot.id, tgUserId || undefined);
            } else if (found.length > 0 && qtyToSubtract === 0) {
               const product = found[0];
               const status = product.quantity <= product.minQuantity ? `🔴 ${t.statusLow}` : `🟢 ${t.statusOk}`;
               let msg = `📱 *${product.name}*\n📦 ${t.balance}: *${product.quantity}* ${product.unit}\n💰 ${t.price}: ${new Intl.NumberFormat('uz-UZ').format(product.price)}\n${status}`;
               msg += `\n\n_💡 ${t.needQtyMsg.replace('{name}', product.name)}_`;
               await sendTelegramMessage(botToken, chatId, msg, 'Markdown', undefined, bot.id, tgUserId || undefined);
            }
        }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true, error: error.message })
  }
}

async function sendTelegramMessage(token: string, chatId: number, text: string, parseMode?: string, replyMarkup?: any, botId?: string, tgUserId?: string) {
  try {
    if (botId && tgUserId) {
       const user = await prisma.telegramUser.findUnique({ where: { id: tgUserId } });
       if (user?.sessionData) {
          try {
             const session = JSON.parse(user.sessionData);
             if (session.lastMessageId) {
                await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: chatId, message_id: session.lastMessageId }),
                }).catch(() => {});
             }
          } catch(e) {}
       }
    }

    const payload: any = { chat_id: chatId, text: text || "Xatolik..." };
    if (parseMode) payload.parse_mode = parseMode;
    if (replyMarkup) payload.reply_markup = replyMarkup;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json();
    
    if (data.ok && data.result?.message_id && botId && tgUserId) {
       const user = await prisma.telegramUser.findUnique({ where: { id: tgUserId } });
       let session = {};
       try { session = JSON.parse(user?.sessionData || '{}'); } catch(e) {}
       (session as any).lastMessageId = data.result.message_id;
       await prisma.telegramUser.update({
         where: { id: tgUserId },
         data: { sessionData: JSON.stringify(session) }
       });
    }

    return data;
  } catch (error) {
    console.error(`[WEBHOOK] Failed:`, error)
  }
}
