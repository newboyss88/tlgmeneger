import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

async function seed() {
  const adapter = new PrismaLibSql({ url: 'file:prisma/dev.db' })
  const prisma = new PrismaClient({ adapter } as any)

  const password = await hash('admin123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'admin@telegrammanager.uz' },
    update: {},
    create: {
      email: 'admin@telegrammanager.uz',
      password,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  })

  console.log('✅ Admin foydalanuvchi yaratildi:')
  console.log('   📧 Email: admin@telegrammanager.uz')
  console.log('   🔑 Parol: admin123')
  console.log('   👤 Rol: SUPER_ADMIN')

  await prisma.$disconnect()
}

seed().catch(console.error)
