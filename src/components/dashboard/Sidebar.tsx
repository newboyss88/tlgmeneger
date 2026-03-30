'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useSettings } from '@/lib/SettingsContext'
import {
  Bot, LayoutDashboard, MessageSquare, Warehouse, Users,
  Settings, User, LogOut, ChevronLeft, ChevronRight, PieChart, ListMusic
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { settings } = useSettings()

  const getMenuItems = () => [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/dashboard/bot', icon: Bot, label: t('bot_settings') },
    { href: '/dashboard/bot/commands', icon: ListMusic, label: t('bot_commands') },
    { href: '/dashboard/group', icon: MessageSquare, label: t('group_settings') },
    { href: '/dashboard/warehouse', icon: Warehouse, label: t('warehouse') },
    { href: '/dashboard/analytics', icon: PieChart, label: t('group_analytics') || 'Analitika' },
    { href: '/dashboard/users', icon: Users, label: t('users') },
    { href: '/dashboard/settings', icon: Settings, label: t('settings') },
    { href: '/dashboard/profile', icon: User, label: t('profile') },
  ]

  const menuItems = getMenuItems()

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 80 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-secondary)',
        zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px', display: 'flex', alignItems: 'center', gap: '12px',
        minHeight: '70px', borderBottom: '1px solid var(--border-secondary)',
      }}>
        <div style={{
          width: '40px', height: '40px', minWidth: '40px', borderRadius: 'var(--radius-md)',
          background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)',
        }}>
          <Bot size={22} color="white" />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              style={{
                fontSize: '18px', fontWeight: '800', background: 'var(--gradient-secondary)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
            >
              {settings.appName || 'TelegramManager'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {menuItems.map((item) => {
          // Eng aniq (eng uzun) mos keluvchini topamiz
          const activeItem = menuItems
            .filter(i => pathname === i.href || pathname.startsWith(i.href + '/'))
            .sort((a, b) => b.href.length - a.href.length)[0]
          
          const isActive = activeItem?.href === item.href

          return (
            <Link
              key={item.href} href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: isOpen ? '12px 16px' : '12px', borderRadius: 'var(--radius-md)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive ? 'var(--gradient-primary)' : 'transparent',
                boxShadow: isActive ? '0 0 20px rgba(124, 58, 237, 0.3)' : 'none',
                transition: 'all var(--transition-fast)', fontSize: '14px',
                fontWeight: isActive ? '600' : '500', justifyContent: isOpen ? 'flex-start' : 'center',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <item.icon size={20} style={{ minWidth: '20px' }} />
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                    style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Logout & Toggle */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-secondary)' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: isOpen ? '12px 16px' : '12px', borderRadius: 'var(--radius-md)',
            color: 'var(--accent-rose)', width: '100%', fontSize: '14px',
            fontWeight: '500', justifyContent: isOpen ? 'flex-start' : 'center',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={20} style={{ minWidth: '20px' }} />
          <AnimatePresence>
            {isOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ whiteSpace: 'nowrap' }}>
                {t('logout')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: '10px', borderRadius: 'var(--radius-md)',
            color: 'var(--text-tertiary)', marginTop: '4px', transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-tertiary)'
          }}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </motion.aside>
  )
}
