import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const bots = await prisma.bot.findMany({
      include: { groups: true, warehouses: true }
    })
    console.log('Bots count:', bots.length)
    if (bots.length > 0) {
      console.log('First bot language:', (bots[0] as any).language)
    }
  } catch (err) {
    console.error('Test DB error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
