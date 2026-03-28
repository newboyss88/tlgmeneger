'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  User, Camera, Mail, Phone, Shield, Key, Save, Loader2, CheckCircle, MessageCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function ProfilePage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [name, setName] = useState(session?.user?.name || '')
  const [email, setEmail] = useState(session?.user?.email || '')
  const [phone, setPhone] = useState('')
  const [telegramId, setTelegramId] = useState('')
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setName(data.name || '')
          setEmail(data.email || '')
          setPhone(data.phone || '')
          setTelegramId(data.telegramId || '')
        }
      })
  }, [])

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, telegramId })
      })
      
      const data = await res.json()
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        toast.success(t('profil_saved'))
      } else {
        toast.error(data.error || t('profil_error'))
      }
    } catch {
      toast.error(t('network_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error(t('fill_all_fields'))
    }
    if (newPassword !== confirmPassword) {
      return toast.error(t('passwords_dont_match'))
    }
    if (newPassword.length < 6) {
      return toast.error(t('password_too_short'))
    }

    setPwdLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success(t('password_changed'))
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.error || t('network_error'))
      }
    } catch {
      toast.error(t('network_error'))
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>{t('profile')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('profile_desc')}</p>
      </div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '36px', fontWeight: '800', color: 'white',
              boxShadow: '0 0 30px rgba(124, 58, 237, 0.3)',
            }}>
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
            <button style={{
              position: 'absolute', bottom: '-4px', right: '-4px',
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'var(--bg-secondary)', border: '2px solid var(--primary-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--primary-400)',
            }}>
              <Camera size={14} />
            </button>
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>{name}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{email}</p>
            <span className="badge badge-primary" style={{ marginTop: '8px' }}>
              <Shield size={12} style={{ marginRight: '4px' }} />
              {(session?.user as any)?.role || 'ADMIN'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Profile Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} /> {t('personal_info')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div className="input-group">
            <label>{t('name_label')}</label>
            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>{t('email_label')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '40px' }} />
            </div>
          </div>
          <div className="input-group">
            <label>{t('phone')}</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ paddingLeft: '40px' }} />
            </div>
          </div>
          <div className="input-group">
            <label>{t('tg_username')}</label>
            <div style={{ position: 'relative' }}>
              <MessageCircle size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="text" className="input" placeholder="username" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} style={{ paddingLeft: '40px' }} />
            </div>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleSaveProfile} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : saved ? <><CheckCircle size={18} /> {t('saved_exclamation')}</> : <><Save size={18} /> {t('save')}</>}
        </button>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} /> {t('change_password')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <div className="input-group">
            <label>{t('current_password')}</label>
            <input type="password" className="input" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="input-group">
            <label>{t('new_password')}</label>
            <input type="password" className="input" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="input-group">
            <label>{t('confirm_new_password')}</label>
            <input type="password" className="input" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={handleChangePassword} disabled={pwdLoading}>
            {pwdLoading ? <Loader2 size={18} className="animate-spin" /> : <><Key size={18} /> {t('change_password')}</>}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
