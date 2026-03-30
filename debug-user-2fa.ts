
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const email = 'aralovbotir88@gmail.com'
  const user = await prisma.user.findUnique({
    where: { email },
    include: { settings: true }
  })
  
  console.log('--- USER RECORD ---')
  console.log(JSON.stringify(user, null, 2))
  
  if (user) {
    const tgUsers = await prisma.telegramUser.findMany({
      where: {
        OR: [
          { telegramId: user.telegramId || 'none' },
          { username: 'wwuzbww' },
          { username: '@wwuzbww' }
        ]
      },
      include: { bot: true }
    })
    console.log('\n--- MATCHING TELEGRAM USERS ---')
    console.log(JSON.stringify(tgUsers, null, 2))
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
