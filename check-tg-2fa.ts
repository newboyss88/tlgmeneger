
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'aralovbotir88@gmail.com' },
    select: { id: true, email: true, telegramId: true, telegramUsername: true, role: true }
  })
  
  console.log('--- User Info ---')
  console.log(JSON.stringify(user, null, 2))

  if (user?.telegramId) {
    const tgUser = await prisma.telegramUser.findFirst({
        where: { telegramId: user.telegramId }
    })
    console.log('--- TelegramUser Info ---')
    console.log(JSON.stringify(tgUser, null, 2))
  } else {
    console.log('User has NO telegramId linked.')
    
    // Check if there are any TelegramUsers with similar usernames
    const allTgUsers = await prisma.telegramUser.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    })
    console.log('--- Recent TelegramUsers ---')
    console.log(JSON.stringify(allTgUsers, null, 2))
  }
  
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    include: { bots: { where: { isActive: true }, take: 1 } }
  })
  console.log('--- Super Admin Bot Info ---')
  console.log(JSON.stringify({ 
    id: superAdmin?.id, 
    hasBot: !!superAdmin?.bots?.[0], 
    botTokenLength: superAdmin?.bots?.[0]?.token?.length || 0 
  }, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
