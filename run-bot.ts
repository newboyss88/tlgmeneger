import TelegramBot from 'node-telegram-bot-api';
import prisma from './src/lib/prisma';

async function start() {
  const bots = await prisma.bot.findMany({ where: { isActive: true } });
  if (bots.length === 0) {
    console.log("❌ Aktiv bot topilmadi ma'lumotlar bazasida. Oldin Admin paneldan bot ulang.");
    return;
  }
  
  console.log(`🚀 Polling tizimi faollashtirildi. Jami aktiv botlar soni: ${bots.length}`);

  bots.forEach((bot: any) => {
    console.log(`🤖 Bot ishga tushmoqda: ${bot.name} (@${bot.username})`);
    
    // Har bir bot uchun alohida polling instansiyasi
    const tgBot = new TelegramBot(bot.token, { polling: true });
    
    tgBot.on('message', async (msg) => {
      if (!msg.text) return;
      console.log(`\n📨 [${bot.name}] Yangi xabar keldi: "${msg.text}"`);
      
      try {
        // Asl Telegram Webhook payloadiga o'xshatib yuboramiz. Lekin URL da botId keladi.
        const res = await fetch(`http://127.0.0.1:3000/api/telegram/webhook?botId=${bot.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: msg })
        });
        
        if (res.ok) {
          console.log(`✅ [${bot.name}] Webhook'ga tushdi.`);
        } else {
          console.error(`❌ [${bot.name}] Webhook xatosi: ${res.status}`);
        }
      } catch (e: any) {
        console.error(`❌ [${bot.name}] Ulanib bo'lmadi. (npm run dev ishlayaptimi?)`);
      }
    });

    tgBot.on('polling_error', (error) => {
      console.error(`[Polling Error - ${bot.name}]`, error.message);
    });
  });

  console.log("✅ Barcha botlar xabarlarni kutyapti...\n(To'xtatish uchun Ctrl+C bosing)");
}

start();
