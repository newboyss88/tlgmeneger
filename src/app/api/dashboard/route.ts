import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).id

    // Get all bots for this user
    const userBots = await prisma.bot.findMany({
      where: { userId },
      select: { id: true, isActive: true }
    })
    const botIds = userBots.map(b => b.id)
    const activeBots = userBots.filter(b => b.isActive).length

    // Count telegram users (bot members)
    const totalTelegramUsers = await prisma.telegramUser.count({
      where: { botId: { in: botIds } }
    })

    // Get all warehouses for these bots
    const userWarehouses = await prisma.warehouse.findMany({
      where: { botId: { in: botIds } },
      include: { products: true }
    })
    const warehouseIds = userWarehouses.map(w => w.id)
    const allProductIds = userWarehouses.flatMap(w => w.products.map(p => p.id))

    // Count products
    const totalProducts = allProductIds.length

    // Count today's transactions
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayTransactions = await prisma.transaction.count({
      where: {
        productId: { in: allProductIds },
        createdAt: { gte: todayStart }
      }
    })

    // Warehouse data for pie chart
    const warehouseData = userWarehouses.map(w => ({
      name: w.name,
      value: w.products.reduce((sum: number, p: any) => sum + p.quantity, 0)
    }))

    // Chart data (last 7 months)
    const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
    const chartData = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const txCount = await prisma.transaction.count({
        where: {
          productId: { in: allProductIds },
          createdAt: { gte: date, lt: nextMonth }
        }
      })
      
      const userCount = await prisma.telegramUser.count({
        where: {
          botId: { in: botIds },
          createdAt: { lt: nextMonth }
        }
      })
      
      chartData.push({
        month: date.getMonth(),
        users: userCount,
        transactions: txCount
      })
    }

    // Recent activity from audit logs
    const recentLogs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true } } }
    })

    const recentActivity = recentLogs.map((log: any) => {
      let type = 'user'
      if (log.entity === 'Bot') type = 'bot'
      else if (log.entity === 'Product' || log.entity === 'Warehouse') type = 'product'
      else if (log.entity === 'Transaction') type = 'transaction'
      else if (log.entity === 'Group') type = 'group'

      return {
        action: `${log.action} — ${log.entity}`,
        user: log.user.name,
        time: log.createdAt,
        type
      }
    })

    return NextResponse.json({
      activeBots,
      totalTelegramUsers,
      totalProducts,
      todayTransactions,
      warehouseData,
      chartData,
      recentActivity,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
