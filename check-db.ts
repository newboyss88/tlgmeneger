import prisma from './src/lib/prisma'

async function check() {
  const bots = await prisma.bot.findMany({
    include: {
      groups: true,
      warehouses: { include: { products: true } }
    }
  })
  
  console.log("=== BOTS ===")
  for (const bot of bots) {
    console.log(`Bot ID: ${bot.id}`)
    console.log(`Name: ${bot.name}`)
    console.log(`Username: ${bot.username}`)
    console.log(`Token: ${bot.token.substring(0, 15)}...`)
    console.log(`IsActive: ${bot.isActive}`)
    
    console.log("\n  --- Groups ---")
    for (const g of bot.groups) {
      console.log(`  Group: ${g.title} | ChatId: ${g.chatId} | AutoReply: ${g.autoReply}`)
    }
    
    console.log("\n  --- Products ---")
    for (const w of bot.warehouses) {
      for (const p of w.products) {
        console.log(`  Product: ${p.name} | SKU: ${p.sku} | Qty: ${p.quantity}`)
      }
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect())
