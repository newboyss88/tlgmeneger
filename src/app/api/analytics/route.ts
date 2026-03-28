import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const userId = (session.user as any).id

    // Fetch transactions
    const rawTransactions = (await prisma.transaction.findMany({
      where: { userId },
      include: {
        product: true,
        telegramUser: true
      },
      orderBy: { createdAt: 'desc' }
    })) as any[]

    // Compute basic analytics
    const totalTransactions = rawTransactions.length
    const totalDeductions = rawTransactions.filter(t => t.type === 'OUT').length
    const totalIncomes = rawTransactions.filter(t => t.type === 'IN').length
    
    const topContributorsMap: Record<string, {tgId: string, name: string, outCount: number, inCount: number, totalQty: number}> = {};
    const groupTransactions = rawTransactions.filter(t => t.source === 'GROUP' && t.telegramUserId);

    for (const t of groupTransactions) {
        if (!t.telegramUserId) continue;
        const tgName = t.telegramUser?.firstName || t.telegramUser?.username || 'Berkitilgan profil';
        
        if (!topContributorsMap[t.telegramUserId]) {
           topContributorsMap[t.telegramUserId] = { tgId: t.telegramUserId, name: tgName, outCount: 0, inCount: 0, totalQty: 0 };
        }
        
        if (t.type === 'OUT') {
           topContributorsMap[t.telegramUserId].outCount += 1;
           topContributorsMap[t.telegramUserId].totalQty += t.quantity;
        } else {
           topContributorsMap[t.telegramUserId].inCount += 1;
        }
    }

    const topContributors = Object.values(topContributorsMap).sort((a, b) => b.outCount - a.outCount)
    
    // Most deducted products
    const topProductsMap: Record<string, {name: string, qty: number}> = {};
    rawTransactions.filter(t => t.type === 'OUT').forEach(t => {
       if (!topProductsMap[t.productId]) topProductsMap[t.productId] = { name: t.product.name, qty: 0 };
       topProductsMap[t.productId].qty += t.quantity;
    });
    const topProducts = Object.values(topProductsMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    return NextResponse.json({
        totalTransactions,
        totalDeductions,
        totalIncomes,
        topContributors,
        topProducts,
        rawTransactions: rawTransactions.map(t => ({
          id: t.id,
          type: t.type,
          quantity: t.quantity,
          createdAt: t.createdAt,
          note: t.note,
          source: t.source,
          productName: t.product.name,
          productSku: t.product.sku,
          user: t.telegramUser ? (t.telegramUser.firstName || t.telegramUser.username || 'User') : (t.user?.name || 'Admin')
        })).slice(0, 100)
    })
  } catch (error) {
    console.error('Analytics GET xato:', error)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const userId = (session.user as any).id

    // Foydalanuvchiga tegishli barcha tranzaksiyalar (tarix) o'chiriladi
    await prisma.transaction.deleteMany({
      where: { userId }
    })

    return NextResponse.json({ success: true, message: 'Tarix muvaffaqiyatli tozalandi.' })
  } catch (error) {
    console.error('Analytics DELETE xato:', error)
    return NextResponse.json({ error: 'Xatolik yuz berdi' }, { status: 500 })
  }
}
