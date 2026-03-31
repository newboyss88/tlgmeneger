'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { 
  Bot, Menu, Plus, Trash2, Save, 
  Settings2, HelpCircle, Zap,
  Loader2, CheckCircle2, AlertCircle,
  ExternalLink, GripVertical, Terminal,
  Sparkles, Command, Hash, Type, Link as LinkIcon,
  MessageSquare, Search, ArrowRight, Info
} from 'lucide-react'
import toast from 'react-hot-toast'

interface BotCommand {
  command: string
  description: string
  type: 'text' | 'link' | 'action'
  response?: string
}

export default function BotCommandsPage() {
  const { t } = useLanguage()
  const [bots, setBots] = useState<any[]>([])
  const [selectedBotId, setSelectedBotId] = useState<string>('')
  const [commands, setCommands] = useState<BotCommand[]>([])
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
         setCommands(data.map((c: any) => ({
           ...c,
           type: c.type || (c.command === 'sklad' || c.command === 'menu' ? 'action' : 'text')
         })))
      } else {
         setCommands([
            { command: 'start', description: 'Botni boshlash', type: 'text', response: '' },
            { command: 'menu', description: 'Interaktiv boshqaruv menyusi', type: 'action', response: 'menu' },
            { command: 'sklad', description: 'Omborxonalar ro\'yxati', type: 'action', response: 'sklad' },
            { command: 'yordam', description: 'Yordam va qo\'llanma', type: 'text', response: '' }
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
    setCommands([...commands, { command: '', description: '', type: 'text', response: '' }])
  }

  const handleRemoveCommand = (idx: number) => {
    setCommands(commands.filter((_, i) => i !== idx))
  }

  const handleCommandChange = (idx: number, field: keyof BotCommand, val: string) => {
    const updated = [...commands]
    if (field === 'command') {
      updated[idx][field] = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    } else {
      (updated[idx] as any)[field] = val
    }
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
        background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(79,70,229,0.05) 50%, rgba(16,185,129,0.08) 100%)',
        borderRadius: '28px', padding: '36px 40px', border: '1px solid rgba(124,58,237,0.15)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', opacity: 0.05 }}>
          <Sparkles size={240} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(124,58,237,0.4)'
            }}>
              <Terminal size={26} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.7px', marginBottom: '4px' }}>
                {t('bot_commands_title') || 'Bot Buyruqlari'}
              </h1>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                {t('bot_commands_desc') || 'Telegram botingizdagi menyu buyruqlarini mukammal sozlang'}
              </p>
            </div>
          </div>
        </div>

        {/* Bot Selector */}
        {bots.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px', marginTop: '32px',
            padding: '12px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)', maxWidth: 'fit-content',
            backdropFilter: 'blur(10px)'
          }}>
            <Bot size={18} style={{ color: 'var(--success)' }} />
            <select 
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)',
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
        <>
          {/* ============ MAIN CONTENT ============ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
        
        {/* Editor Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '28px',
            border: '1px solid var(--border-secondary)', overflow: 'hidden',
            boxShadow: '0 4px 30px rgba(0,0,0,0.1)'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '24px 28px', borderBottom: '1px solid var(--border-secondary)',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'rgba(124,58,237,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <Menu size={18} style={{ color: 'var(--primary-400)' }} />
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: '700' }}>
                  {t('command_list') || 'Buyruqlar ro\'yxati'}
                </h2>
                <div style={{
                  padding: '2px 10px', borderRadius: '20px', fontSize: '12px',
                  fontWeight: '800', background: 'var(--primary-500)', color: 'white'
                }}>
                  {commands.length}
                </div>
              </div>
              <button 
                onClick={handleAddCommand}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px', borderRadius: '14px', fontSize: '14px',
                  fontWeight: '700', background: 'var(--primary-500)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(124,58,237,0.2)'
                }}
              >
                <Plus size={18} />
                {t('add_command') || 'Yangi buyruq'}
              </button>
            </div>

            {/* List */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence mode="popLayout">
                {commands.map((cmd, idx) => (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-secondary)',
                      borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Command & Description */}
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 40px', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '2px',
                        background: 'var(--bg-input)', borderRadius: '12px',
                        padding: '0 12px', border: '1px solid var(--border-secondary)'
                      }}>
                        <span style={{ color: 'var(--primary-400)', fontWeight: '800', fontSize: '16px' }}>/</span>
                        <input 
                          type="text" 
                          style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            padding: '12px 4px', fontSize: '14px', fontWeight: '700',
                            color: 'var(--text-primary)', width: '100%', fontFamily: 'monospace'
                          }}
                          placeholder="start"
                          value={cmd.command}
                          onChange={(e) => handleCommandChange(idx, 'command', e.target.value)}
                        />
                      </div>

                      <input 
                        type="text" 
                        style={{
                          background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
                          borderRadius: '12px', padding: '12px 16px', fontSize: '14px',
                          color: 'var(--text-secondary)', outline: 'none'
                        }}
                        placeholder={t('cmd_description') || 'Tavsif yozing...'}
                        value={cmd.description}
                        onChange={(e) => handleCommandChange(idx, 'description', e.target.value)}
                      />

                      <button 
                        onClick={() => handleRemoveCommand(idx)}
                        style={{
                          width: '40px', height: '40px', borderRadius: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(244,63,94,0.08)', color: '#F43F5E',
                          border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Bottom Row: Type Selector & Content */}
                    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                          {t('command_type') || 'Javob turi'}
                        </label>
                        <div style={{
                          display: 'flex', background: 'var(--bg-input)', borderRadius: '12px', padding: '4px',
                          border: '1px solid var(--border-secondary)', gap: '4px'
                        }}>
                          {[
                            { id: 'text', icon: <MessageSquare size={14} />, label: t('type_text') },
                            { id: 'link', icon: <LinkIcon size={14} />, label: t('type_link') },
                            { id: 'action', icon: <Zap size={14} />, label: t('type_action') }
                          ].map(type => (
                            <button
                              key={type.id}
                              onClick={() => handleCommandChange(idx, 'type', type.id as any)}
                              style={{
                                flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                                background: cmd.type === type.id ? 'var(--primary-500)' : 'transparent',
                                color: cmd.type === type.id ? 'white' : 'var(--text-tertiary)',
                                cursor: 'pointer', transition: 'all 0.2s', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: '700'
                              }}
                              title={type.label}
                            >
                              {type.icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                          {cmd.type === 'text' ? (t('cmd_response_label') || 'Xabar matni') : cmd.type === 'link' ? (t('cmd_link_label') || 'Sayt havolasi') : (t('cmd_action_label') || 'Tanlangan amal')}
                        </label>
                        
                        {cmd.type === 'text' ? (
                          <textarea 
                            style={{
                              width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
                              borderRadius: '12px', padding: '12px 16px', fontSize: '14px',
                              color: 'var(--text-primary)', outline: 'none', resize: 'none', minHeight: '44px'
                            }}
                            placeholder={t('cmd_response_placeholder')}
                            value={cmd.response || ''}
                            onChange={(e) => handleCommandChange(idx, 'response', e.target.value)}
                            rows={1}
                            disabled={cmd.command === 'start'}
                          />
                        ) : cmd.type === 'link' ? (
                          <div style={{ position: 'relative' }}>
                            <LinkIcon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-400)' }} />
                            <input 
                              type="text" 
                              style={{
                                width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
                                borderRadius: '12px', padding: '12px 16px 12px 42px', fontSize: '14px',
                                color: 'var(--primary-400)', outline: 'none', fontWeight: '600'
                              }}
                              placeholder={t('link_placeholder') || '/dashboard/analytics'}
                              value={cmd.response || ''}
                              onChange={(e) => handleCommandChange(idx, 'response', e.target.value)}
                            />
                          </div>
                        ) : (
                          <select 
                            style={{
                              width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
                              borderRadius: '12px', padding: '12px 16px', fontSize: '14px',
                              color: 'var(--text-primary)', outline: 'none', fontWeight: '600', cursor: 'pointer'
                            }}
                            value={cmd.response || ''}
                            onChange={(e) => handleCommandChange(idx, 'response', e.target.value)}
                          >
                            <option value="">{t('cmd_select_action') || 'Amalni tanlang...'}</option>
                            <option value="menu">🏠 Interaktiv Menyu</option>
                            <option value="sklad">📦 Omborlar ro'yxati (Qidiruv)</option>
                            <option value="help">❓ Yordam bo'limi</option>
                          </select>
                        )}

                        {cmd.command === 'start' && (
                          <div style={{
                            position: 'absolute', top: '24px', left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.05)', borderRadius: '12px', zIndex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)'
                          }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700' }}>
                              {t('cmd_start_note')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {commands.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '80px 20px',
                  border: '2px dashed var(--border-secondary)', borderRadius: '24px'
                }}>
                  <AlertCircle size={40} style={{ color: 'var(--text-tertiary)', opacity: 0.2, margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', fontWeight: '600' }}>
                    {t('no_commands') || 'Buyruqlar mavjud emas'}
                  </p>
                </div>
              )}
            </div>

            {/* Save Action */}
            <div style={{
              padding: '24px 28px', borderTop: '1px solid var(--border-secondary)',
              background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'flex-end'
            }}>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '14px 32px', borderRadius: '16px', fontSize: '15px',
                  fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                  color: 'white', border: 'none', transition: 'all 0.2s',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={20} />}
                {t('sync_menu') || 'Telegram bilan sinxronlash'}
              </button>
            </div>
          </div>
        </div>

        {/* ============ WOW SIDEBAR ============ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Detailed Guide */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(99,102,241,0.05))',
            borderRadius: '28px', padding: '28px', border: '1px solid rgba(124,58,237,0.15)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
              <HelpCircle size={120} />
            </div>
            
            <h3 style={{
              fontSize: '15px', fontWeight: '800', marginBottom: '24px',
              display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-400)'
            }}>
              <Info size={18} />
              {t('how_it_works_detailed') || 'Bot buyruqlari siri?'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                { title: t('step_1_title'), desc: t('step_1_desc'), icon: <Terminal size={14} /> },
                { title: t('step_2_title'), desc: t('step_2_desc'), icon: <Settings2 size={14} /> },
                { title: t('step_3_title'), desc: t('step_3_desc'), icon: <Zap size={14} /> }
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                  {i < 2 && (
                    <div style={{
                      position: 'absolute', left: '13px', top: '30px', bottom: '-15px',
                      width: '2px', background: 'rgba(124,58,237,0.1)'
                    }} />
                  )}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '10px', minWidth: '28px',
                    background: 'var(--primary-500)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'white',
                    boxShadow: '0 4px 10px rgba(124,58,237,0.3)', zIndex: 1
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      {step.title}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '28px', padding: '24px',
            border: '1px solid var(--border-secondary)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              fontSize: '12px', fontWeight: '800', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '8px',
              textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)'
            }}>
              <Menu size={14} />
              PREVIEW (LIVE)
            </h3>

            <div style={{
              background: '#0f172a', borderRadius: '20px', padding: '16px',
              border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
              {commands.slice(0, 6).map((cmd, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#38bdf8', fontWeight: '800', fontFamily: 'monospace' }}>/{cmd.command || '...'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>— {cmd.description || '...'}</span>
                  </div>
                  {cmd.type === 'link' && <LinkIcon size={12} style={{ color: 'var(--primary-400)' }} />}
                  {cmd.type === 'action' && <Zap size={12} style={{ color: '#F59E0B' }} />}
                </div>
              ))}
              {commands.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                  Choose a command...
                </div>
              )}
            </div>
          </div>
          
          <a 
            href="https://core.telegram.org/bots/api#setmycommands" 
            target="_blank"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '16px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
              color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-secondary)',
              textDecoration: 'none', transition: 'all 0.2s', marginTop: '10px'
            }}
          >
            Telegram Official API <ExternalLink size={12} />
          </a>
        </div>
      </div>
      </>
      )}
    </div>
  )
}
