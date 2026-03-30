'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bot, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Phone } from 'lucide-react'

import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [is2faRequired, setIs2faRequired] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState({ 
    email: false, 
    telegram: false, 
    tgError: null as string | null,
    botUsername: null as string | null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const credential = loginType === 'email' ? email : phone
      const result = await signIn('credentials', {
        email: credential,
        password,
        code: twoFactorCode,
        redirect: false,
      })

      if (result?.error === '2FA_REQUIRED') {
        // 2FA talab qilinadi, kod yuborish
        const sendRes = await fetch('/api/auth/2fa/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: credential, password }),
        })
        const sendData = await sendRes.json()
        
        if (sendData.success) {
          setDeliveryStatus({
            email: !!sendData.channels?.email,
            telegram: !!sendData.channels?.telegram,
            tgError: sendData.channels?.tgError || null,
            botUsername: sendData.botUsername || null
          })
          setIs2faRequired(true)
        } else {
          setError(sendData.error || 'Tasdiqlash kodini yuborishda xatolik')
        }
      } else if (result?.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '20%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '30%',
        right: '20%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: '0 0 30px rgba(124, 58, 237, 0.4)',
            }}>
              <Bot size={26} color="white" />
            </div>
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>{t('hero_title').split(' ')[0]}!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{t('login')}</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {!is2faRequired ? (
            <>
              {/* Login Type Tabs */}
              <div style={{
                display: 'flex',
                gap: '4px',
                padding: '4px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
              }}>
                <button
                  onClick={() => setLoginType('email')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: loginType === 'email' ? 'var(--gradient-primary)' : 'transparent',
                    color: loginType === 'email' ? 'white' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Mail size={14} /> Email
                </button>
                <button
                  onClick={() => setLoginType('phone')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: loginType === 'phone' ? 'var(--gradient-primary)' : 'transparent',
                    color: loginType === 'phone' ? 'white' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Phone size={14} /> {t('phone')}
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '12px 16px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: 'var(--error)', fontSize: '14px',
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {loginType === 'email' ? (
                  <div className="input-group">
                    <label>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                      }} />
                      <input
                        type="email" className="input" placeholder="email@example.com"
                        value={email} onChange={(e) => setEmail(e.target.value)} required
                        style={{ paddingLeft: '42px' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="input-group">
                    <label>{t('phone_label')}</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={18} style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                      }} />
                      <input
                        type="tel" className="input" placeholder="+998901234567"
                        value={phone} onChange={(e) => setPhone(e.target.value)} required
                        style={{ paddingLeft: '42px' }}
                      />
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>{t('current_password')}</label>
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

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary-400)', fontWeight: '500' }}>
                    {t('forgot_password_title')}?
                  </Link>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', fontSize: '15px' }}>
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <>{t('login')} <ArrowRight size={18} /></>}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  color: 'var(--primary-500)',
                }}>
                  <Lock size={28} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{t('verify_2fa')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {t('verify_2fa_desc')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: deliveryStatus.email ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: deliveryStatus.email ? 'var(--accent-green)' : 'var(--text-tertiary)' }} />
                    {t('code_sent_email')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: deliveryStatus.telegram ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: deliveryStatus.telegram ? 'var(--accent-green)' : 'var(--accent-rose)' }} />
                    {deliveryStatus.telegram ? t('code_sent_tg') : t('code_not_sent_tg')}
                  </div>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--error)', fontSize: '14px', textAlign: 'center',
                }}>
                  {error}
                </div>
              )}

              <div className="input-group">
                <input
                  type="text" className="input" placeholder={t('code_placeholder')} maxLength={6}
                  value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} required
                  style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', height: '60px' }}
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', fontSize: '15px' }}>
                {loading ? <Loader2 size={20} className="animate-spin" /> : <>{t('verify')} <ArrowRight size={18} /></>}
              </button>

              <button
                type="button"
                onClick={() => setIs2faRequired(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                }}
              >
                {t('cancel')}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {t('no_bots')}?{' '}
          <Link href="/register" style={{ color: 'var(--primary-400)', fontWeight: '600' }}>{t('register')}</Link>
        </p>
      </motion.div>
    </div>
  )
}
