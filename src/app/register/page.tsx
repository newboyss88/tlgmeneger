'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bot, User, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Phone } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('+998')
  const [telegramId, setTelegramId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Parollar mos kelmadi')
      return
    }

    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
      return
    }

    if (!phone.startsWith('+') || phone.length < 10) {
      setError('Telefon raqamni to\'g\'ri kiriting (masalan: +998901234567)')
      return
    }
    
    if (telegramId.length < 3) {
      setError('Telegram username noto\'g\'ri')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, telegramId, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      router.push('/login?registered=true')
    } catch {
      setError('Serverda xatolik yuz berdi')
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
        top: '30%', left: '20%', width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ display: 'inline-flex', marginBottom: '24px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: '0 0 30px rgba(124, 58, 237, 0.4)',
            }}>
              <Bot size={26} color="white" />
            </div>
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Ro'yxatdan o'tish</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Yangi hisob yarating</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--error)', fontSize: '14px',
              }}>
                {error}
              </motion.div>
            )}

            <div className="input-group">
              <label>Ismingiz *</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input type="text" className="input" placeholder="Ismingizni kiriting" value={name} onChange={(e) => setName(e.target.value)} required style={{ paddingLeft: '42px' }} />
              </div>
            </div>

            <div className="input-group">
              <label>Email *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input type="email" className="input" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: '42px' }} />
              </div>
            </div>

            <div className="input-group">
              <label>Telefon raqam *</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input type="tel" className="input" placeholder="+998901234567" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ paddingLeft: '42px' }} />
              </div>
            </div>

            <div className="input-group">
              <label>Telegram Username *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontWeight: '600' }}>@</span>
                <input type="text" className="input" placeholder="username" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} required style={{ paddingLeft: '42px' }} />
              </div>
            </div>

            <div className="input-group">
              <label>Parol *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input type={showPassword ? 'text' : 'password'} className="input" placeholder="Parol kiriting" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingLeft: '42px', paddingRight: '42px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer',
                }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Parolni tasdiqlang *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input type="password" className="input" placeholder="Parolni qayta kiriting" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ paddingLeft: '42px' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', fontSize: '15px' }}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>Ro'yxatdan o'tish <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Hisobingiz bormi?{' '}
          <Link href="/login" style={{ color: 'var(--primary-400)', fontWeight: '600' }}>Kirish</Link>
        </p>
      </motion.div>
    </div>
  )
}
