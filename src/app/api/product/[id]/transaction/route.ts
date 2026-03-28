import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, quantity, note } = await request.json()
    const productId = params.id

    if (!type || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Noto\'g\'ri parametrlar' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Mahsulot topilmadi' }, { status: 404 })
    }

    let newQuantity = product.quantity
    if (type === 'IN') {
      newQuantity += quantity
    } else if (type === 'OUT') {
      newQuantity = Math.max(0, product.quantity - quantity)
    }

    // Update product quantity
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    })

    // Create transaction log
    await prisma.transaction.create({
      data: {
        type,
        quantity,
        note,
        source: 'MANUAL',
        productId,
        userId: (session.user as any).id,
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error in product transaction:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
