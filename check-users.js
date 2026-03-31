const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true } })
  console.log('--- USER LIST ---')
  console.log(JSON.stringify(users, null, 2))
  console.log('-----------------')
}

main().catch(console.error).finally(() => prisma.$disconnect())
