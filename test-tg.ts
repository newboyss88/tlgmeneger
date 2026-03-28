import prisma from './src/lib/prisma'

async function run() {
  const bot = await prisma.bot.findFirst()
  console.log('Sending message to Telegram with token:', bot.token.substring(0, 10))
  
  try {
    const res = await fetch(`https://api.telegram.org/bot${bot.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: -1003832325862,
        text: 'Test directly from NextJS environment',
      }),
    })
    
    console.log('Status:', res.status)
    const data = await res.json()
    console.log('Data:', data)
  } catch (err) {
    console.error('Fetch error:', err)
  }
}

run().catch(console.error).finally(() => prisma.$disconnect())
