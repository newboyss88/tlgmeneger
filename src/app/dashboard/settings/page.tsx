'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Language } from '@/lib/i18n/translations'
import {
  Globe, Bell, Shield, Palette, Key, Save, Loader2, CheckCircle, Settings as SettingsIcon, Mail
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useSettings } from '@/lib/SettingsContext'
import { toast } from 'react-hot-toast'

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
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
  })
  const [loading, setLoading] = useState(false)

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
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        toast.success(t('saved_success'))
        await refreshSettings()
      } else {
        toast.error(t('profil_error'))
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast.error(t('network_error'))
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
          
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} /> {t('smtp_settings')}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>{t('smtp_settings_desc')}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="input-group">
                <label>{t('smtp_host')}</label>
                <input type="text" className="input" placeholder="smtp.gmail.com" value={settings.smtpHost || ''}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })} />
              </div>
              <div className="input-group">
                <label>{t('smtp_port')}</label>
                <input type="text" className="input" placeholder="587" value={settings.smtpPort || ''}
                  onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })} />
              </div>
              <div className="input-group">
                <label>{t('smtp_user')}</label>
                <input type="text" className="input" placeholder="user@gmail.com" value={settings.smtpUser || ''}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })} />
              </div>
              <div className="input-group">
                <label>{t('smtp_pass')}</label>
                <input type="password" className="input" placeholder="••••••••" value={settings.smtpPass || ''}
                  onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })} />
              </div>
              <div className="input-group">
                <label>{t('smtp_from')}</label>
                <input type="text" className="input" placeholder="noreply@domain.com" value={settings.smtpFrom || ''}
                  onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })} />
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(124, 58, 237, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary-500)' }}>
               <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>{t('smtp_test')}</p>
               <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="email" 
                    className="input" 
                    placeholder={t('email_placeholder')}
                    style={{ maxWidth: '250px' }}
                    id="testEmailInput"
                  />
                  <button 
                    className="btn btn-outline" 
                    onClick={async () => {
                      const email = (document.getElementById('testEmailInput') as HTMLInputElement).value;
                      if (!email) return toast.error(t('fill_all_fields'));
                      
                      toast.loading(t('sending'));
                      try {
                        const res = await fetch('/api/settings/test-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, smtp: {
                            host: settings.smtpHost,
                            port: settings.smtpPort,
                            user: settings.smtpUser,
                            pass: settings.smtpPass,
                            from: settings.smtpFrom,
                          }})
                        });
                        toast.dismiss();
                        if(res.ok) toast.success(t('test_email_sent'));
                        else {
                          const data = await res.json();
                          toast.error(data.error || t('error'));
                        }
                      } catch (err) {
                        toast.dismiss();
                        toast.error(t('network_error'));
                      }
                    }}
                  >
                    {t('send_test_email')}
                  </button>
               </div>
            </div>
          </div>

          <button className="btn" style={{ marginTop: '24px', background: 'var(--accent-rose)', color: 'white', borderColor: 'transparent', width: '100%' }} onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {t('save')}
          </button>
        </motion.div>
      )}
    </div>
  )
}
