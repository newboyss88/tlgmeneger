import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  if (!superAdmin) {
    console.log('No Super Admin found')
    process.exit(1)
  }

  const settings = await prisma.setting.findMany({
    where: { userId: superAdmin.id }
  })

  console.log('Super Admin ID:', superAdmin.id)
  console.log('SMTP Settings:')
  settings.forEach(s => {
    if (s.key.startsWith('smtp')) {
      console.log(`- ${s.key}: ${s.value}`)
    }
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
