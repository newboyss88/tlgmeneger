import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('--- Starting Manual Turso Schema Sync ---')
  try {
    // 1. Add 'language' to Bot
    try {
      await (prisma as any).$executeRawUnsafe('ALTER TABLE Bot ADD COLUMN language TEXT DEFAULT "uz"')
      console.log('✅ Added "language" column to Bot table')
    } catch (e: any) {
      if (e.message.includes('duplicate column name')) {
        console.log('ℹ️ "language" column already exists in Bot table')
      } else {
        console.error('❌ Error adding column to Bot:', e.message)
      }
    }

    // 2. Add 'language' to Group
    try {
      await (prisma as any).$executeRawUnsafe('ALTER TABLE `Group` ADD COLUMN language TEXT DEFAULT "uz"')
      console.log('✅ Added "language" column to Group table')
    } catch (e: any) {
      if (e.message.includes('duplicate column name')) {
        console.log('ℹ️ "language" column already exists in Group table')
      } else {
        console.error('❌ Error adding column to Group:', e.message)
      }
    }

    console.log('--- Sync Completed ---')
  } catch (err: any) {
    console.error('Fatal Sync Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
