'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Language } from '@/lib/i18n/translations'
import { useSession } from 'next-auth/react'
import { useSettings } from '@/lib/SettingsContext'
import {
  Bot, Users, Warehouse, Shield, BarChart3, Send,
  ChevronRight, Zap, Globe, ArrowRight, MessageSquare, Package, Menu, X, ChevronDown
} from 'lucide-react'

// We will define `features` inside the component so it has access to `t()` 


const stats = [
  { value: '10K+', key: 'total_users' },
  { value: '500+', key: 'active_bots' },
  { value: '99.9%', key: 'server_uptime' },
  { value: '24/7', key: 'groups' },
]

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage()
  const { data: session, status } = useSession()
  const { settings } = useSettings()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  const features = [
    {
      icon: Bot,
      title: t('feat_bot_title'),
      description: t('feat_bot_desc'),
      color: '#8b5cf6'
    },
    {
      icon: MessageSquare,
      title: t('feat_group_title'),
      description: t('feat_group_desc'),
      color: '#3b82f6'
    },
    {
      icon: Package,
      title: t('feat_wh_title'),
      description: t('feat_wh_desc'),
      color: '#10b981'
    },
    {
      icon: Users,
      title: t('feat_users_title'),
      description: t('feat_users_desc'),
      color: '#f59e0b'
    },
    {
      icon: BarChart3,
      title: t('feat_analytics_title'),
      description: t('feat_analytics_desc'),
      color: '#06b6d4'
    },
    {
      icon: Shield,
      title: t('feat_sec_title'),
      description: t('feat_sec_desc'),
      color: '#f43f5e'
    },
  ]

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const langNames = { uz: "O'zbek", ru: "Русский", en: "English" }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px', height: '70px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(10, 10, 26, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-secondary)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)',
          }}>
            <Bot size={22} color="white" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', background: 'var(--gradient-secondary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {settings.appName || 'TelegramManager'}
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="hide-mobile">
          <Link href="#features" className="btn btn-ghost">{t('features')}</Link>
          <Link href="#stats" className="btn btn-ghost">{t('statistics')}</Link>
          
          {/* Language Switcher */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-ghost" 
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Globe size={16} /> {langNames[language]} <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {langMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-secondary)',
                    borderRadius: 'var(--radius-md)', padding: '8px', display: 'flex', flexDirection: 'column',
                    gap: '4px', minWidth: '120px', boxShadow: 'var(--shadow-lg)'
                  }}
                >
                  {(Object.keys(langNames) as Language[]).map(l => (
                    <button
                      key={l}
                      onClick={() => { setLanguage(l); setLangMenuOpen(false); }}
                      style={{
                        padding: '8px 12px', textAlign: 'left', borderRadius: 'var(--radius-sm)',
                        background: language === l ? 'var(--gradient-primary)' : 'transparent',
                        color: language === l ? 'white' : 'var(--text-primary)',
                        fontSize: '14px', transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={e => { if (language !== l) e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)' }}
                      onMouseLeave={e => { if (language !== l) e.currentTarget.style.background = 'transparent' }}
                    >
                      {langNames[l]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {status === 'authenticated' ? (
            <Link href="/dashboard" className="btn btn-primary">{t('dashboard')}</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary">{t('login')}</Link>
              <Link href="/register" className="btn btn-primary">
                {t('register')} <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        <button className="btn btn-icon btn-secondary hide-tablet" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ display: 'none' }}>
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Gradients */}
        <div style={{
          position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '10%', width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ maxWidth: '800px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.h1 
            key={language} // force re-animation on language change if desired
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: '900', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-0.02em' }}
          >
            {t('hero_title')}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.7' }}>
            {t('hero_desc')}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={status === 'authenticated' ? "/dashboard" : "/register"} className="btn btn-primary btn-lg" style={{ fontSize: '16px' }}>
              <Send size={18} /> {status === 'authenticated' ? t('dashboard') : t('get_started')}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section id="stats" style={{ padding: '60px 24px', borderTop: '1px solid var(--border-secondary)', borderBottom: '1px solid var(--border-secondary)', background: 'rgba(17, 17, 40, 0.4)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', textAlign: 'center' }}>
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
              <div style={{ fontSize: '40px', fontWeight: '900', background: 'var(--gradient-secondary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>
                {t(stat.key as any)}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', marginBottom: '16px' }}>
            {t('features_title')} <span style={{ background: 'var(--gradient-secondary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('features_title_highlight' as any) || t('features_title_highlight')}</span>
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            {t('features_subtitle')}
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {features.map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="card" style={{ cursor: 'default' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: `${feature.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <feature.icon size={24} color={feature.color} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{feature.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', marginBottom: '16px' }}>
            {t('cta_title')}
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 32px' }}>
            {t('cta_desc')}
          </p>
          <Link href={status === 'authenticated' ? "/dashboard" : "/register"} className="btn btn-primary btn-lg" style={{ fontSize: '16px' }}>
            <Send size={18} /> {status === 'authenticated' ? t('dashboard') : t('free_register')} <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
          © 2024 TelegramManager.
        </p>
      </footer>
    </div>
  )
}
