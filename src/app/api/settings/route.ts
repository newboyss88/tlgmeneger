import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settings = await prisma.setting.findMany({
      where: { userId: (session.user as any).id },
    })

    // Convert to key-value object
    const settingsObj: Record<string, string> = {}
    settings.forEach((s: any) => { settingsObj[s.key] = s.value })

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
