import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const txs = await prisma.transaction.findMany({
      where: {
        userId: 'some-id',
        OR: [
          { product: { warehouse: { botId: { in: ['abc'] } } } },
          { groupId: { in: ['xyz'] } }
        ]
      }
    })
    console.log("Success! Count:", txs.length)
  } catch (e) {
    console.error("Prisma Error:", e)
  } finally {
    await prisma.$disconnect()
  }
}
main()
