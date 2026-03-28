import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, sku, price, unit, minQuantity } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Nom ko\'rsatilishi shart' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: { name, sku, price: Number(price), unit, minQuantity: Number(minQuantity) },
    })

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Product',
        entityId: product.id,
        details: JSON.stringify({ name }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product PUT error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.product.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Product',
        entityId: id,
        details: '{}',
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
