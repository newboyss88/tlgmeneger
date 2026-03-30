import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
       return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
    }
    const { id } = await context.params
    const body = await request.json()
    const { role, isBlocked, phone, name, telegramId, language, twoFactorEnabled } = body

    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked
    if (phone !== undefined) updateData.phone = phone
    if (name !== undefined) updateData.name = name
    if (telegramId !== undefined) updateData.telegramId = telegramId
    if (language !== undefined) updateData.language = language
    if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: updatedUser.id,
        details: JSON.stringify(body),
        userId: (session.user as any).id,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Update User error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
       return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 })
    }

    const { id } = await context.params

    if (id === (session.user as any).id) {
       return NextResponse.json({ error: 'O\'zingizni o\'chira olmaysiz' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id }
    })

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_USER',
        entity: 'User',
        entityId: id,
        details: JSON.stringify({ deletedUserId: id }),
        userId: (session.user as any).id,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete User error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
