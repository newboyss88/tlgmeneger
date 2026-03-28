'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bot, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Phone } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const credential = loginType === 'email' ? email : phone
      const result = await signIn('credentials', {
        email: credential,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
      }
    } catch {
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
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Xush kelibsiz!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Hisobingizga kiring</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
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
              <Phone size={14} /> Telefon
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
                <label>Telefon raqam</label>
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
              <label>Parol</label>
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
                Parolni unutdingizmi?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', fontSize: '15px' }}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>Kirish <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Hisobingiz yo'qmi?{' '}
          <Link href="/register" style={{ color: 'var(--primary-400)', fontWeight: '600' }}>Ro'yxatdan o'ting</Link>
        </p>
      </motion.div>
    </div>
  )
}
