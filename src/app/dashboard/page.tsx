'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bot, Users, Warehouse, MessageSquare, Package, TrendingUp,
  TrendingDown, ArrowUpRight, Activity, ShoppingCart, Loader2, Zap, Globe, Calendar
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const pieColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ fontSize: '13px', color: entry.color, fontWeight: '600' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const activityIcons: Record<string, any> = {
  user: Users,
  product: Package,
  bot: Bot,
  transaction: ShoppingCart,
  group: MessageSquare,
}

const activityColors: Record<string, string> = {
  user: '#3b82f6',
  product: '#10b981',
  bot: '#8b5cf6',
  transaction: '#f59e0b',
  group: '#06b6d4',
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary-400)" />
      </div>
    )
  }

  const statCards = [
    { icon: Bot, label: t('active_bots'), value: stats?.activeBots ?? 0, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    { icon: Users, label: t('total_users'), value: stats?.totalTelegramUsers ?? 0, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { icon: Package, label: t('products'), value: stats?.totalProducts ?? 0, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { icon: ShoppingCart, label: t('today_transactions'), value: stats?.todayTransactions ?? 0, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  ]

  const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']
  const formatTimeAgo = (date: string | Date) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    if (mins < 1) return t('just_now')
    if (mins < 60) return `${mins} ${t('mins_ago')}`
    if (mins < 1440) return `${Math.floor(mins / 60)} ${t('hours_ago')}`
    return `${Math.floor(mins / 1440)} ${t('days_ago')}`
  }

  const chartData = (stats?.chartData || []).map((d: any) => ({
    ...d,
    name: t(monthKeys[d.month] as any)
  }))
  const warehouseData = stats?.warehouseData || []
  const recentActivity = stats?.recentActivity || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>{t('dashboard')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {t('recent_activity')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
          <Calendar size={14} />
          {new Date().toLocaleDateString(t('language') === 'ru' ? 'ru-RU' : t('language') === 'en' ? 'en-US' : 'uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px',
      }}>
        {statCards.map((stat, i) => (
          <motion.div
            key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="stat-card"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {/* Glow effect */}
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px',
              borderRadius: '50%', background: stat.bg, filter: 'blur(25px)', opacity: 0.5
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
              <div className="stat-icon" style={{ background: stat.bg }}>
                <stat.icon size={22} color={stat.color} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', color: stat.color, fontWeight: '600',
                padding: '3px 8px', borderRadius: '20px', background: stat.bg,
              }}>
                <Zap size={10} /> Live
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '32px', letterSpacing: '-1px' }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--primary-400)" /> {t('growth_dynamics')}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', background: 'var(--bg-input)', padding: '4px 10px', borderRadius: '20px' }}>{t('last_7_months')}</span>
          </div>
          <div style={{ height: '280px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="users" name={t('total_users')} stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="transactions" name={t('today_transactions')} stroke="#3b82f6" fillOpacity={1} fill="url(#colorTransactions)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                {t('no_data_yet')}
              </div>
            )}
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={18} color="var(--primary-400)" /> {t('warehouse_distribution')}
          </h3>
          <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {warehouseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={warehouseData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={5} dataKey="value">
                    {warehouseData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', fontSize: '14px', flexDirection: 'column', gap: '8px' }}>
                <Warehouse size={32} style={{ opacity: 0.3 }} />
                {t('no_warehouses_yet')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
            {warehouseData.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: pieColors[i % pieColors.length] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--primary-400)" /> {t('recent_activity')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {recentActivity.length > 0 ? recentActivity.map((item: any, i: number) => {
            const Icon = activityIcons[item.type] || Activity
            const color = activityColors[item.type] || '#8b5cf6'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                    background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={14} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.action}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.user}</div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{formatTimeAgo(item.time)}</span>
              </div>
            )
          }) : (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
              {t('no_activity_yet')}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
