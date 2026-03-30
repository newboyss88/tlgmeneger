
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Find settings for the user
  const settings = await prisma.setting.findMany({
    where: { key: 'telegramUsername' }
  })
  console.log('--- Telegram Username Settings ---')
  console.log(JSON.stringify(settings, null, 2))

  const users = await prisma.user.findMany({
    where: { telegramId: { not: null } },
    select: { email: true, telegramId: true, telegramUsername: true }
  })
  console.log('--- Users with linked TG ---')
  console.log(JSON.stringify(users, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
