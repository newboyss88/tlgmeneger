import { createClient } from '@libsql/client';

const url = 'libsql://tgmanager-newboyss.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ2Nzc1NzEsImlkIjoiMDE5ZDMzMDMtMTAwMS03Y2I2LTlmMWMtZDZhZWM3OGQ5MmJkIiwicmlkIjoiOTIzYmU4NWQtN2M3NS00Yjc3LWE3ZmItNjkwMGEwNWFjYzdiIn0.I1qPFhnxTqAgxgOE9fqoa9ABlMdS2IQ5Smj4wY8gZk5G37-t2DqyCVCnMgVxdM_gizH3nm74qr6Yibzb0YGDDw';
const client = createClient({ url, authToken });

const WEBHOOK_URL = 'https://tlgmeneger.vercel.app/api/telegram/webhook';

async function setupWebhooks() {
  try {
    const res = await client.execute('SELECT token, name FROM Bot WHERE isActive = 1');
    const bots = res.rows;
    
    console.log(`Topilgan aktiv botlar soni: ${bots.length}`);
    
    for (const bot of bots) {
      const token = bot[0] as string;
      const name = bot[1] as string;
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: WEBHOOK_URL })
        });
        const data = await response.json();
        console.log(`✅ [${name}] webhook o'rnatildi:`, data.description);
      } catch (err: any) {
        console.error(`❌ [${name}] webhook o'rnatishda xatolik:`, err.message);
      }
    }
  } catch (error) {
    console.error('Baza bilan xatolik:', error);
  }
}

setupWebhooks();
