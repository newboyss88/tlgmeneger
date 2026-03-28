async function start() {
  console.log(`
====================================================================
🔴 DIQQAT: LOKAL "run-bot.ts" SCRIPT ASOSIY MUAMMO MANBAYI! 🔴
====================================================================

Telegram tarmog'ining qat'iy qoidasi:
1 ta Bot Tokeni BIR VAQTDA faqat 1 ta joydan xabar ololadi. 

Qachonki siz "npx tsx run-bot.ts" ni yurgizsangiz, Telegram avtomatik
ravishda Vercel-dagi Webhook ulanishini BUZADI va O'CHIRADI. Natijada
sizning jonli platformangiz xabarlarsiz "ko'r" bo'lib qoladi.

✅ TO'G'RI ISHLASH TARTIBI (Sinxron tizim):
Sizga umuman bu skriptni yurgizish kerak emas! Nega?
1) Vercel-dagi Webhook 24/7 ishlab turibdi. Xabar kelsa Turso DB ni yangilaydi.
2) Siz "localhost:3000" (npm run dev) qilib o'z kompyuteringizdan saytga kirsangiz,
   u ham ushbu Turso DB dan ma'lumot o'qiydi.
3) Demak, Telegram xabar kelsa, Vercel uni bazaga yozadi -> sizning Local saytingiz
   sodda qilib sahifani yangilaganda o'sha o'zgarishni ko'radi!

Barcha tizim 100% sinxron ishlashi uchun bitta qoida: LOKAL BOTNI O'CHIRING.
Sizga hozil faqat "npm run dev" kerak xolos. Tizim o'zi ishlayveradi.

Shu sababli, ishlab turgan tizim buzilmasligi uchun ushbu "run-bot.ts" 
kodi atayin bloklandi.
====================================================================
  `);
  process.exit(1);
}

start();
