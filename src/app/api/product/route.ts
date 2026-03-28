import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { name, sku, quantity, price, unit, minQuantity, warehouseId } = data

    if (!name || !warehouseId) {
      return NextResponse.json({ error: 'Mahsulot nomi va Sklad ko\'rsatilishi shart' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        quantity: quantity || 0,
        price: price || 0,
        unit: unit || 'dona',
        minQuantity: minQuantity || 0,
        warehouseId,
      },
    })

    // Agar boshlang'ich miqdor bo'lsa tranzaksiya yozamiz
    if (quantity > 0) {
      await prisma.transaction.create({
        data: {
          type: 'IN',
          quantity,
          note: 'Boshlang\'ich qoldiq null',
          source: 'MANUAL',
          productId: product.id,
          userId: (session.user as any).id,
        }
      })
    }

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Product',
        entityId: product.id,
        details: JSON.stringify({ name, quantity }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
