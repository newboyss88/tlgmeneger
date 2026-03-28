'use client'

import { useSession } from 'next-auth/react'
import { Bell, Menu, Search } from 'lucide-react'
import { useState } from 'react'

interface DashboardHeaderProps {
  onMenuToggle: () => void
}

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      right: 0,
      left: 0,
      height: 'var(--header-height)',
      background: 'rgba(10, 10, 26, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onMenuToggle}
          className="btn btn-icon btn-ghost"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu size={20} />
        </button>

        <div style={{
          position: 'relative',
          width: '300px',
        }}
        className="hide-mobile"
        >
          <Search size={16} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
          }} />
          <input
            type="text"
            className="input"
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '40px',
              height: '40px',
              fontSize: '13px',
              background: 'var(--bg-secondary)',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="btn btn-icon btn-ghost"
          style={{ position: 'relative', color: 'var(--text-secondary)' }}
        >
          <Bell size={20} />
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent-rose)',
            boxShadow: '0 0 8px rgba(244, 63, 94, 0.5)',
          }} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid var(--border-secondary)',
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '13px',
          }}>
            {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="hide-mobile">
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{session?.user?.name || 'Admin'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{(session?.user as any)?.role || 'Admin'}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
