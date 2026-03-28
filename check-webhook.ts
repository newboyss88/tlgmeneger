const BOT_TOKEN = '8611142801:AAEgLNVRM5e0Ee4m8CT0r-tc3FrHh_rP9a8';
const BOT_ID = 'faf1aaeb-ba96-431b-beb0-e85136d2a159';
const VERCEL_URL = 'https://tlgmeneger.vercel.app';

async function setup() {
  const webhookUrl = `${VERCEL_URL}/api/telegram/webhook?botId=${BOT_ID}`;
  
  console.log('Webhook o\'rnatilmoqda:', webhookUrl);
  
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl })
  });
  const data = await res.json();
  console.log('Natija:', JSON.stringify(data, null, 2));
  
  // Verify
  const info = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const infoData = await info.json();
  console.log('Webhook Info:', JSON.stringify(infoData, null, 2));
  
  process.exit(0);
}

setup();
