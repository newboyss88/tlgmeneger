'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { 
  Bot, Menu, Plus, Trash2, Save, 
  Settings2, HelpCircle, Zap,
  Loader2, CheckCircle2, AlertCircle,
  ExternalLink, GripVertical, Terminal,
  Sparkles, Command, Hash
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function BotCommandsPage() {
  const { t } = useLanguage()
  const [bots, setBots] = useState<any[]>([])
  const [selectedBotId, setSelectedBotId] = useState<string>('')
  const [commands, setCommands] = useState<{ command: string, description: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchBots = async () => {
    try {
      const res = await fetch('/api/bot')
      const data = await res.json()
      setBots(data)
      if (data.length > 0) {
        setSelectedBotId(data[0].id)
        fetchCommands(data[0].id)
      } else {
        setLoading(false)
      }
    } catch (e) {
      toast.error(t('load_bots_error') || 'Botlarni yuklashda xatolik!')
      setLoading(false)
    }
  }

  const fetchCommands = async (botId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bot/commands?botId=${botId}`)
      const data = await res.json()
      if (data.length > 0) {
         setCommands(data)
      } else {
         setCommands([
           { command: 'start', description: 'Botni boshlash' },
           { command: 'menu', description: 'Interaktiv boshqaruv menyusi' },
           { command: 'sklad', description: 'Omborxonalar ro\'yxati' },
           { command: 'yordam', description: 'Yordam va qo\'llanma' }
         ])
      }
    } catch (e) {
      toast.error(t('load_error') || 'Buyruqlarni yuklashda xatolik!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBots()
  }, [])

  const handleAddCommand = () => {
    setCommands([...commands, { command: '', description: '' }])
  }

  const handleRemoveCommand = (idx: number) => {
    setCommands(commands.filter((_, i) => i !== idx))
  }

  const handleCommandChange = (idx: number, field: 'command' | 'description', val: string) => {
    const updated = [...commands]
    const cleanVal = field === 'command' ? val.toLowerCase().replace(/[^a-z0-9_]/g, '') : val
    updated[idx][field] = cleanVal
    setCommands(updated)
  }

  const handleSave = async () => {
    if (!selectedBotId) return
    
    const invalid = commands.some(c => !c.command.trim() || !c.description.trim())
    if (invalid) {
       toast.error(t('fill_all_fields') || 'Barcha maydonlarni to\'ldiring!')
       return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/bot/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: selectedBotId, commands })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(t('menu_updated') || 'Telegram menyusi yangilandi! ✨')
      } else {
        toast.error(data.error || t('save_error') || 'Xatolik!')
      }
    } catch (e) {
      toast.error(t('network_error') || 'Tarmoq xatosi!')
    } finally {
      setSaving(false)
    }
  }

  const selectedBot = bots.find(b => b.id === selectedBotId)

  if (loading && bots.length === 0) {
     return (
       <div style={{
         display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
         padding: '120px 20px', gap: '16px'
       }}>
         <div style={{
           width: '64px', height: '64px', borderRadius: '20px',
           background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))',
           display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
           <Loader2 size={28} style={{ color: 'var(--primary-500)', animation: 'spin 1s linear infinite' }} />
         </div>
         <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
           {t('loading') || 'Yuklanmoqda...'}
         </p>
       </div>
     )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* ============ HERO HEADER ============ */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(79,70,229,0.04) 50%, rgba(16,185,129,0.06) 100%)',
        borderRadius: '24px', padding: '32px 36px', border: '1px solid rgba(124,58,237,0.12)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.04 }}>
          <Command size={200} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(124,58,237,0.3)'
            }}>
              <Terminal size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                {t('bot_commands_title') || 'Bot Buyruqlari'}
              </h1>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '2px' }}>
                {t('bot_commands_desc') || 'Telegram botingizdagi menyu buyruqlarini sozlang'}
              </p>
            </div>
          </div>
        </div>

        {/* Bot Selector */}
        {bots.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px',
            padding: '10px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.06)', maxWidth: 'fit-content'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(16,185,129,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={16} style={{ color: 'var(--success)' }} />
            </div>
            <select 
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)',
                cursor: 'pointer', paddingRight: '8px'
              }}
              value={selectedBotId}
              onChange={(e) => {
                setSelectedBotId(e.target.value)
                fetchCommands(e.target.value)
              }}
            >
              {bots.map((b: any) => (
                <option key={b.id} value={b.id} style={{ background: 'var(--bg-primary)' }}>
                  {b.name} (@{b.username})
                </option>
              ))}
            </select>
            <div style={{
              padding: '3px 10px', borderRadius: '8px', fontSize: '10px',
              fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
              background: 'rgba(16,185,129,0.1)', color: 'var(--success)'
            }}>
              Online
            </div>
          </div>
        )}
      </div>

      {/* ============ EMPTY STATE ============ */}
      {!selectedBotId && bots.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '80px 32px', textAlign: 'center', borderRadius: '24px',
            background: 'var(--bg-secondary)', border: '1px dashed var(--border-secondary)'
          }}
        >
          <Bot size={56} style={{ color: 'var(--text-tertiary)', opacity: 0.3, margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            {t('no_bots') || 'Bot topilmadi'}
          </h2>
          <p style={{ color: 'var(--text-tertiary)', maxWidth: '400px', margin: '0 auto', fontSize: '14px' }}>
            {t('connect_first_bot_desc') || 'Avval Telegram Bot bo\'limidan botni ulang, keyin menyularini sozlashingiz mumkin.'}
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          
          {/* ============ COMMANDS EDITOR ============ */}
          <div>
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: '24px',
              border: '1px solid var(--border-secondary)', overflow: 'hidden'
            }}>
              {/* Editor Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid var(--border-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Hash size={18} style={{ color: 'var(--primary-400)' }} />
                  <h2 style={{ fontSize: '16px', fontWeight: '700' }}>
                    {t('command_list') || 'Buyruqlar ro\'yxati'}
                  </h2>
                  <span style={{
                    padding: '2px 8px', borderRadius: '8px', fontSize: '11px',
                    fontWeight: '700', background: 'rgba(124,58,237,0.1)', color: 'var(--primary-400)'
                  }}>
                    {commands.length}
                  </span>
                </div>
                <button 
                  onClick={handleAddCommand}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '12px', fontSize: '13px',
                    fontWeight: '600', background: 'rgba(124,58,237,0.1)',
                    color: 'var(--primary-400)', border: '1px solid rgba(124,58,237,0.15)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Plus size={16} />
                  {t('add_command') || 'Qo\'shish'}
                </button>
              </div>

              {/* Commands */}
              <div style={{ padding: '16px' }}>
                <AnimatePresence mode="popLayout">
                  {commands.map((cmd, idx) => (
                    <motion.div 
                      key={idx}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 16px', borderRadius: '16px', marginBottom: '8px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-secondary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {/* Number */}
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '10px', minWidth: '28px',
                        background: 'rgba(124,58,237,0.08)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: '800', color: 'var(--primary-400)'
                      }}>
                        {idx + 1}
                      </div>

                      {/* Command input */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '2px',
                        background: 'var(--bg-input)', borderRadius: '10px',
                        padding: '0 10px', border: '1px solid var(--border-secondary)',
                        minWidth: '140px', flex: '0 0 160px'
                      }}>
                        <span style={{ color: 'var(--primary-400)', fontWeight: '700', fontSize: '14px' }}>/</span>
                        <input 
                          type="text" 
                          style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            padding: '10px 4px', fontSize: '13px', fontWeight: '600',
                            color: 'var(--text-primary)', width: '100%', fontFamily: 'monospace'
                          }}
                          placeholder="start"
                          value={cmd.command}
                          onChange={(e) => handleCommandChange(idx, 'command', e.target.value)}
                        />
                      </div>

                      {/* Description input */}
                      <input 
                        type="text" 
                        style={{
                          flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
                          borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
                          color: 'var(--text-secondary)', outline: 'none'
                        }}
                        placeholder={t('cmd_description') || 'Tavsif yozing...'}
                        value={cmd.description}
                        onChange={(e) => handleCommandChange(idx, 'description', e.target.value)}
                      />

                      {/* Delete */}
                      <button 
                        onClick={() => handleRemoveCommand(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '32px', height: '32px', minWidth: '32px', borderRadius: '10px',
                          color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.06)',
                          border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {commands.length === 0 && (
                  <div style={{
                    textAlign: 'center', padding: '48px 20px',
                    border: '2px dashed var(--border-secondary)', borderRadius: '16px'
                  }}>
                    <AlertCircle size={28} style={{ color: 'var(--text-tertiary)', opacity: 0.3, margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                      {t('no_commands') || 'Buyruqlar yo\'q. Birinchisini qo\'shing!'}
                    </p>
                  </div>
                )}
              </div>

              {/* Save Button Section */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid var(--border-secondary)',
                display: 'flex', justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 28px', borderRadius: '14px', fontSize: '14px',
                    fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                    color: 'white', border: 'none', transition: 'all 0.2s',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.25)',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
                  {t('sync_menu') || 'Telegram bilan sinxronlash'}
                </button>
              </div>
            </div>
          </div>

          {/* ============ INFO SIDEBAR ============ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* How it Works */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(124,58,237,0.04))',
              borderRadius: '20px', padding: '24px', border: '1px solid rgba(99,102,241,0.1)',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.04 }}>
                <HelpCircle size={100} />
              </div>
              <h3 style={{
                fontSize: '14px', fontWeight: '700', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-400)'
              }}>
                <Settings2 size={16} />
                {t('how_it_works') || 'Qanday ishlaydi?'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  t('cmd_help_1') || 'Buyruqlar Telegramda "Menu" tugmasi orqali ko\'rinadi.',
                  t('cmd_help_2') || 'Faqat kichik harflar va chiziqlar ishlatiladi.',
                  t('cmd_help_3') || 'Saqlash tugmasini bosgach 1 daqiqada yangilanadi.'
                ].map((text, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '8px', minWidth: '22px',
                      background: 'rgba(99,102,241,0.12)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: '800', color: 'var(--primary-400)'
                    }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: '20px', padding: '24px',
              border: '1px solid var(--border-secondary)'
            }}>
              <h3 style={{
                fontSize: '13px', fontWeight: '700', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '8px',
                textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)'
              }}>
                <Menu size={14} />
                {t('preview') || 'Ko\'rinish'}
              </h3>
              <div style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '12px',
                border: '1px solid rgba(255,255,255,0.04)'
              }}>
                {commands.slice(0, 5).map((cmd, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                    borderRadius: '8px', marginBottom: i < commands.length - 1 ? '2px' : 0,
                    fontSize: '12px'
                  }}>
                    <span style={{ color: '#58a6ff', fontWeight: '600', fontFamily: 'monospace' }}>/{cmd.command || '...'}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>— {cmd.description || '...'}</span>
                  </div>
                ))}
                {commands.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px' }}>
                    {t('empty') || 'Bo\'sh'}
                  </p>
                )}
              </div>
            </div>

            {/* API Docs Link */}
            <a 
              href="https://core.telegram.org/bots/api#setmycommands" 
              target="_blank"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px', borderRadius: '14px', fontSize: '11px', fontWeight: '600',
                color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-secondary)',
                textDecoration: 'none', transition: 'all 0.2s'
              }}
            >
              Telegram API Docs <ExternalLink size={12} />
            </a>
          </div>

        </div>
      )}
    </div>
  )
}
