import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // 1. Super Adminni topish
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true }
    })

    const userId = session ? (session.user as any).id : superAdmin?.id

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settings = await prisma.setting.findMany({
      where: { userId },
    })

    // Convert to key-value object
    const settingsObj: Record<string, any> = {}
    settings.forEach((s: any) => { settingsObj[s.key] = s.value })

    // User modelidan qo'shimcha ma'lumotlarni qo'shish
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, twoFactorEnabled: true }
    })

    if (user) {
      settingsObj.telegramId = user.telegramId
      settingsObj.twoFactorAuth = user.twoFactorEnabled
    }

    return NextResponse.json(settingsObj)
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const userId = (session.user as any).id

    // Save each setting
    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: {
          userId_key: { userId, key },
        },
        update: { value: String(value) },
        create: { userId, key, value: String(value) },
      })

      // User modelidagi twoFactorEnabled fieldini ham yangilash
      if (key === 'twoFactorAuth') {
        await prisma.user.update({
          where: { id: userId },
          data: { twoFactorEnabled: value === true || value === 'true' }
        })
      }

      // Telegram username kiritilganda IDni qidirish va bog'lash
      if (key === 'telegramUsername' && value) {
        let username = String(value).trim().toLowerCase()
        if (username.startsWith('@')) username = username.substring(1)
        
        // TelegramUser jadvalidan ushbu username-li foydalanuvchini qidiramiz
        const tgUser = await prisma.telegramUser.findFirst({
          where: { 
            username: { equals: username } // Bizda hozircha db darajasida insensitive emas, lekin normalizatsiya qildik
          },
          orderBy: { createdAt: 'desc' }
        })

        if (tgUser) {
          await prisma.user.update({
            where: { id: userId },
            data: { telegramId: tgUser.telegramId }
          })
        }
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Settings',
        entityId: userId,
        details: JSON.stringify({ updated: Object.keys(body) }),
        userId,
      },
    })

    return NextResponse.json({ message: 'Sozlamalar saqlandi!' })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
