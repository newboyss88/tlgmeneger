import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const { name, description, location, botId } = await request.json()
    if (!name) return NextResponse.json({ error: 'Nom ko\'rsatilishi shart' }, { status: 400 })

    const dataToUpdate: any = { name, description, location }
    if (botId) dataToUpdate.botId = botId

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: dataToUpdate,
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Warehouse',
        entityId: warehouse.id,
        details: JSON.stringify({ name }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Warehouse PUT error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    
    await prisma.warehouse.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Warehouse',
        entityId: id,
        details: '{}',
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Warehouse DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

