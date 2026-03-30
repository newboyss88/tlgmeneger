'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bot, Lock, ArrowRight, Loader2, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { t } = useLanguage()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError(t('invalid_token'))
    }
  }, [token, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('passwords_dont_match'))
      return
    }

    if (password.length < 6) {
      setError(t('password_too_short'))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
      } else {
        setError(data.error || t('server_error'))
      }
    } catch {
      setError(t('network_error'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <CheckCircle size={40} color="var(--success)" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>{t('reset_success')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {t('redirecting_login')}
        </p>
        <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
          {t('login')}
        </Link>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '32px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 16px', borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--error)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        <div className="input-group">
          <label>{t('new_password_label')}</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }} />
            <input
              type={showPassword ? 'text' : 'password'} className="input" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ paddingLeft: '42px', paddingRight: '42px' }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="input-group">
          <label>{t('confirm_password_label')}</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }} />
            <input
              type={showPassword ? 'text' : 'password'} className="input" placeholder="••••••••"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              style={{ paddingLeft: '42px' }}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !token} style={{ width: '100%' }}>
          {loading ? <Loader2 size={20} className="animate-spin" /> : <>{t('reset_btn')} <ArrowRight size={18} /></>}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  const { t } = useLanguage()
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '30%', left: '20%', width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '24px', display: 'inline-block' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: '0 0 30px rgba(124, 58, 237, 0.4)',
            }}>
              <Bot size={26} color="white" />
            </div>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>{t('reset_password_page_title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{t('reset_password_page_desc')}</p>
        </div>

        <Suspense fallback={<div className="card" style={{ padding: '32px', textAlign: 'center' }}><Loader2 className="animate-spin mx-auto" /></div>}>
          <ResetPasswordContent />
        </Suspense>
      </motion.div>
    </div>
  )
}
