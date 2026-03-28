import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { hash } from 'bcryptjs'

const TEST_BOT_TOKEN = '8611142801:AAEgLNVRM5e0Ee4m8CT0r-tc3FrHh_rP9a8'
const TEST_GROUP_ID = '-1003832325862'
const ADMIN_PHONE = '+998901234567'

async function setupAndTest() {
  console.log('🔄 Boshlanmoqda...')
  const adapter = new PrismaLibSql({ url: 'file:./prisma/dev.db' })
  const prisma = new PrismaClient({ adapter } as any)

  try {
    // 1. Create or get admin user
    const password = await hash('admin123', 12)
    const user = await prisma.user.upsert({
      where: { email: 'admin@telegrammanager.uz' },
      update: { phone: ADMIN_PHONE },
      create: {
        email: 'admin@telegrammanager.uz',
        phone: ADMIN_PHONE,
        name: 'Super Admin',
        password,
        role: 'SUPER_ADMIN',
      },
    })
    console.log(`✅ Foydalanuvchi: ${user.name} (${user.phone})`)

    // 2. Fetch Bot Info from Telegram
    console.log('📡 Telegram API dan bot ma\'lumotlari olinmoqda...')
    const botRes = await fetch(`https://api.telegram.org/bot${TEST_BOT_TOKEN}/getMe`)
    const botData = await botRes.json()

    if (!botData.ok) {
      throw new Error('Bot token xato yoki Telegram API ishlamayapti')
    }

    console.log(`✅ Bot ulandi: @${botData.result.username} (${botData.result.first_name})`)

    // 3. Save Bot to DB
    const bot = await prisma.bot.create({
      data: {
        token: TEST_BOT_TOKEN,
        username: botData.result.username,
        name: botData.result.first_name,
        welcomeMessage: 'Assalomu alaykum!',
        isActive: true,
        userId: user.id,
      },
    })
    console.log(`✅ Bot bazaga saqlandi. ID: ${bot.id}`)

    // 4. Fetch Group Info from Telegram
    console.log('📡 Telegram API dan guruh ma\'lumotlari olinmoqda...')
    const groupRes = await fetch(`https://api.telegram.org/bot${TEST_BOT_TOKEN}/getChat?chat_id=${TEST_GROUP_ID}`)
    const groupData = await groupRes.json()

    if (!groupData.ok) {
      console.error('❌ Guruh topilmadi! Bot guruhga admin qilinmagan bo\'lishi mumkin.')
      console.log('Xato detali:', groupData)
    } else {
      console.log(`✅ Guruh topildi: ${groupData.result.title} (${groupData.result.type})`)

      // 5. Save Group to DB
      const group = await prisma.group.create({
        data: {
          chatId: TEST_GROUP_ID,
          title: groupData.result.title,
          type: groupData.result.type,
          isActive: true,
          botId: bot.id,
        },
      })
      console.log(`✅ Guruh bazaga saqlandi. ID: ${group.id}`)

      // 6. Fetch Group Members (Admins)
      const membersRes = await fetch(`https://api.telegram.org/bot${TEST_BOT_TOKEN}/getChatAdministrators?chat_id=${TEST_GROUP_ID}`)
      const membersData = await membersRes.json()

      if (membersData.ok) {
        console.log(`✅ Guruh adminlari olingan: ${membersData.result.length} ta odam/bot`)
        membersData.result.forEach((m: any) => {
          console.log(`   - ${m.status}: ${m.user.first_name} ${m.user.username ? '(@' + m.user.username + ')' : ''}`)
        })
      }
    }

    console.log('\n🎉 Barcha testlar muvaffaqiyatli yakunlandi!')

  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAndTest()
