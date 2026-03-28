'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Language } from '@/lib/i18n/translations'
import {
  Globe, Bell, Shield, Palette, Key, Save, Loader2, CheckCircle, Settings as SettingsIcon
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useSettings } from '@/lib/SettingsContext'

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage()
  const { data: session } = useSession()
  const { refreshSettings } = useSettings()
  const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN'

  const [settings, setSettings] = useState({
    language: 'uz',
    timezone: 'Asia/Tashkent',
    emailNotifications: true,
    telegramNotifications: true,
    lowStockAlert: true,
    newUserAlert: true,
    darkMode: true,
    twoFactorAuth: false,
    apiEnabled: false,
    appName: 'TelegramManager',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data).map(([k, v]) => [
              k,
              v === 'true' ? true : v === 'false' ? false : v,
            ])
          ),
        }))
        if (data.language) {
          setLanguage(data.language as Language)
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setSaved(true)
        await refreshSettings()
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language
    setSettings({ ...settings, language: newLang })
    setLanguage(newLang) // global context update
  }

  const Toggle = ({ value, onChange, label, description }: { value: boolean, onChange: () => void, label: string, description: string }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
    }}>
      <div>
        <p style={{ fontSize: '14px', fontWeight: '600' }}>{label}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{description}</p>
      </div>
      <button onClick={onChange} style={{
        width: '48px', height: '26px', borderRadius: '13px',
        background: value ? 'var(--primary-600)' : 'var(--gray-600)',
        position: 'relative', transition: 'all var(--transition-fast)', cursor: 'pointer',
      }}>
        <div style={{
          width: '22px', height: '22px', borderRadius: '50%', background: 'white',
          position: 'absolute', top: '2px',
          left: value ? '24px' : '2px',
          transition: 'left var(--transition-fast)',
        }} />
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>{t('settings')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('platform_settings')}</p>
      </div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
          padding: '14px 20px', borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--success)', fontSize: '14px', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <CheckCircle size={18} /> {t('saved_success')}
        </motion.div>
      )}

      {/* General Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} /> {t('general')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div className="input-group">
            <label>{t('language')}</label>
            <select className="input" value={language} onChange={handleLanguageChange}>
              <option value="uz">O'zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="input-group">
            <label>{t('timezone')}</label>
            <select className="input" value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}>
              <option value="Asia/Tashkent">Tashkent (UTC+5)</option>
              <option value="Asia/Samarkand">Samarkand (UTC+5)</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {t('save')}
        </button>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} /> {t('security')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Toggle
            label={t('two_factor')}
            description={t('two_factor_desc')}
            value={!!settings.twoFactorAuth}
            onChange={() => setSettings({ ...settings, twoFactorAuth: !settings.twoFactorAuth })}
          />
        </div>
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {t('save')}
        </button>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} /> {t('notifications')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Toggle
            label={t('email_notif')}
            description={t('email_notif_desc')}
            value={!!settings.emailNotifications}
            onChange={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
          />
          <Toggle
            label={t('tg_notif')}
            description={t('tg_notif_desc')}
            value={!!settings.telegramNotifications}
            onChange={() => setSettings({ ...settings, telegramNotifications: !settings.telegramNotifications })}
          />
        </div>
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {t('save')}
        </button>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={18} /> {t('appearance')}
        </h3>
        <Toggle
          label={t('dark_mode')}
          description={t('dark_mode_desc')}
          value={!!settings.darkMode}
          onChange={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
        />
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {t('save')}
        </button>
      </motion.div>

      {/* Super Admin: Server Settings */}
      {isSuperAdmin && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card" style={{ border: '1px solid var(--accent-rose)', boxShadow: '0 4px 20px rgba(244, 63, 94, 0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
            <SettingsIcon size={18} /> {t('site_settings')} <span className="badge badge-error" style={{ fontSize: '10px', marginLeft: 'auto' }}>Super Admin</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="input-group">
              <label>{t('app_name')}</label>
              <input type="text" className="input" value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })} />
            </div>
          </div>
          <button className="btn" style={{ marginTop: '20px', background: 'var(--accent-rose)', color: 'white', borderColor: 'transparent' }} onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {t('save')}
          </button>
        </motion.div>
      )}
    </div>
  )
}
