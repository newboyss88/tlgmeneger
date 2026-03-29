'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot as BotIcon, Settings, Power, Upload, Plus, Trash2,
  MessageSquare, Key, CheckCircle, Save, Loader2, Users, Ban, X
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { toast } from 'react-hot-toast'

export default function BotPage() {
  const { t } = useLanguage()
  
  // State for list of bots
  const [bots, setBots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // State for modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null)
  
  // State for editing/adding bot
  const [selectedBot, setSelectedBot] = useState<any>(null)
  const [botToken, setBotToken] = useState('')
  const [botName, setBotName] = useState('')
  const [botUsername, setBotUsername] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState(t('welcome_msg_default'))
  const [botDescription, setBotDescription] = useState('')
  const [botAvatar, setBotAvatar] = useState<string | null>(null)
  const [botLanguage, setBotLanguage] = useState('uz')

  const [isSaving, setIsSaving] = useState(false)
  
  // State for members
  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadBots()
  }, [])

  const loadBots = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bot')
      if (res.ok) {
        setBots(await res.json())
      }
    } catch (err) {
      toast.error(t('load_bots_error'))
    } finally {
      setLoading(false)
    }
  }


  const openNewBotModal = () => {
    setSelectedBot(null)
    setBotToken('')
    setBotName('')
    setBotUsername('')
    setWelcomeMessage(t('welcome_msg_default'))
    setBotDescription('')
    setBotAvatar(null)
    setBotLanguage('uz')

    setIsModalOpen(true)
  }

  const openEditBotModal = (bot: any) => {
    setSelectedBot(bot)
    setBotToken(bot.token)
    setBotName(bot.name)
    setBotUsername(bot.username)
    setWelcomeMessage(bot.welcomeMessage || '')
    setBotDescription(bot.description || '')
    setBotAvatar(bot.avatar || null)
    setBotLanguage(bot.language || 'uz')

    setIsModalOpen(true)
  }
  
  const openMembersModal = async (bot: any) => {
    setSelectedBot(bot)
    setIsMembersModalOpen(true)
    setMembersLoading(true)
    try {
      const res = await fetch(`/api/bot/members?botId=${bot.id}`)
      if (res.ok) {
        setMembers(await res.json())
      }
    } catch {
      toast.error(t('load_members_error'))
    } finally {
      setMembersLoading(false)
    }
  }

  const handleDeleteBot = async () => {
    if (!deleteConfirm) return
    const botId = deleteConfirm.id
    try {
      const res = await fetch(`/api/bot?id=${botId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(t('deleted_success'))
        setDeleteConfirm(null)
        loadBots()
      } else {
        toast.error(t('delete_error'))
      }
    } catch {
      toast.error(t('network_error'))
    }
  }

  const handleConnectAndSave = async () => {
    if (!botToken) return
    setIsSaving(true)

    try {
      // 1. Verify token with Telegram API
      const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
      const telegramData = await telegramRes.json()

      if (!telegramData.ok) {
        toast.error(t('invalid_token_error'))
        setIsSaving(false)
        return
      }

      const tgName = botName || telegramData.result.first_name
      const tgUsername = telegramData.result.username

      // 2. Save/Update to DB
      const res = await fetch('/api/bot', {
        method: selectedBot ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBot?.id,
          token: botToken,
          name: tgName,
          username: tgUsername,
          description: botDescription,
          welcomeMessage,
          avatar: botAvatar,
          language: botLanguage,

        }),
      })

      if (res.ok) {
        const savedBotData = await res.json()
        
        // Webhook and Description are now handled by the backend API route directly

        if (savedBotData.warning) {
          toast.error(savedBotData.warning, { duration: 6000 })
        } else {
          toast.success(`✅ @${tgUsername} ${t('bot_connected_success')}`)
        }
        setIsModalOpen(false)
        loadBots()
      } else {
        const data = await res.json()
        toast.error(data.error || t('profil_error'))
      }
    } catch (err) {
      toast.error(t('network_error'))
    } finally {
      setIsSaving(false)
    }
  }

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64
      img.onload = () => {
        const canvas = document.createElement('canvas')
        // Oson bazaga yozish uchun kuchaytirilgan kompressiya
        const MAX_SIZE = 256
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height
            height = MAX_SIZE
          }
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        // Set quality to 0.6 for space efficiency
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
    })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = async () => {
         const base64 = reader.result as string
         // Compress image to 512x512 before sending to server
         const compressed = await compressImage(base64)
         console.log(`[DEBUG] Compressed Image Size: ${(compressed.length / 1024).toFixed(2)} KB`)
         setBotAvatar(compressed)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleBan = async (m: any) => {
    try {
      const res = await fetch(`/api/bot/members/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !m.isBanned })
      })
      if (res.ok) {
        setMembers(members.map(x => x.id === m.id ? { ...x, isBanned: !x.isBanned } : x))
      }
    } catch {
      toast.error(t('network_error'))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>{t('bot_page_title') || 'Telegram Botlar'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('bot_page_desc')}</p>
        </div>
        <button className="btn btn-primary" onClick={openNewBotModal}>
          <Plus size={18} /> {t('add_new_bot')}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary-500)" style={{ margin: '0 auto' }}/>
        </div>
      ) : bots.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-secondary)' }}>
          <BotIcon size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{t('no_bots')}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>{t('connect_first_bot_desc')}</p>
          <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={openNewBotModal}>
            <Plus size={18} /> {t('create_connection')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {bots.map((bot, index) => (
            <motion.div 
              key={bot.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.1 }}
              className="card" 
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: bot.avatar ? `url(${bot.avatar}) center/cover` : 'var(--bg-input)',
                  border: '2px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {!bot.avatar && <BotIcon size={28} color="var(--primary-400)" />}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {bot.name}
                    {bot.isActive && <CheckCircle size={14} color="var(--success)" />}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--primary-400)' }}>@{bot.username}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('users_count')}</p>
                  <p style={{ fontSize: '16px', fontWeight: '700' }}>{bot.telegramUsers?.length || 0}</p>
                </div>
                <div style={{ width: '1px', background: 'var(--border-secondary)' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('groups_count')}</p>
                  <p style={{ fontSize: '16px', fontWeight: '700' }}>{bot.groups?.length || 0}</p>
                </div>
                <div style={{ width: '1px', background: 'var(--border-secondary)' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('warehouses_count')}</p>
                  <p style={{ fontSize: '16px', fontWeight: '700' }}>{bot.warehouses?.length || 0}</p>
                </div>
              </div>

              <div className="premium-card-actions">
                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    flex: 1, 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    backdropFilter: 'blur(10px)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }} 
                  onClick={() => openEditBotModal(bot)}
                >
                  <Settings size={14} className="icon-glow" /> {t('settings')}
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    flex: 1, 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    backdropFilter: 'blur(10px)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }} 
                  onClick={() => openMembersModal(bot)}
                >
                  <Users size={14} className="icon-glow" /> {t('members')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ 
                    padding: '0 12px', 
                    color: 'var(--error)', 
                    background: 'rgba(244, 63, 94, 0.05)', 
                    backdropFilter: 'blur(10px)', 
                    border: '1px solid rgba(244, 63, 94, 0.1)',
                  }} 
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: bot.id, name: bot.name }); }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Bot Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content"
              style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{selectedBot ? t('bot_settings_modal') : t('new_bot_connection')}</h2>
                <button className="btn btn-icon" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-group">
                  <label>{t('bot_token_label')}</label>
                  <input
                    type="password" className="input"
                    placeholder={t('bot_token_placeholder')}
                    value={botToken} onChange={(e) => setBotToken(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
                  <div 
                     onClick={() => fileInputRef.current?.click()}
                     style={{ 
                       width: '70px', height: '70px', borderRadius: '50%', 
                       background: botAvatar ? `url(${botAvatar}) center/cover` : 'var(--bg-secondary)',
                       border: '2px dashed var(--border-primary)', display: 'flex', alignItems: 'center', 
                       justifyContent: 'center', cursor: 'pointer', overflow: 'hidden'
                     }}
                  >
                    {!botAvatar && <Upload size={20} color="var(--primary-400)" />}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>{t('bot_avatar_label')}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('bot_avatar_desc')}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label>{t('bot_name')}</label>
                    <input type="text" className="input" value={botName} onChange={(e) => setBotName(e.target.value)} placeholder={t('auto_detect')} />
                  </div>
                  <div className="input-group">
                    <label>{t('bot_username')}</label>
                    <input type="text" className="input" value={botUsername ? `@${botUsername}` : ''} disabled style={{ opacity: 0.7 }} placeholder={t('auto_detect')} />
                  </div>
                </div>

                <div className="input-group">
                  <label>{t('language')}</label>
                  <select 
                    className="input" 
                    value={botLanguage} 
                    onChange={(e) => setBotLanguage(e.target.value)}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="uz">O'zbekcha</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>



                <div className="input-group">
                  <label>{t('about_bot')}</label>
                  <textarea className="input textarea" value={botDescription} onChange={(e) => setBotDescription(e.target.value)} rows={2} placeholder={t('bot_description_placeholder')} />
                </div>

                <div className="input-group">
                  <label>{t('welcome_msg')}</label>
                  <textarea className="input textarea" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={4} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
                  <button className="btn btn-primary" onClick={handleConnectAndSave} disabled={isSaving || !botToken}>
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {selectedBot ? t('save_and_update') : t('connect_save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Members Modal */}
      <AnimatePresence>
        {isMembersModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content"
              style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} /> @{selectedBot?.username} {t('bot_members_title')} ({members.length})
                </h2>
                <button className="btn btn-icon" onClick={() => setIsMembersModalOpen(false)}><X size={20} /></button>
              </div>

              {membersLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary-500)" style={{ margin: '0 auto' }}/></div>
              ) : members.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  {t('no_bot_members')}
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>{t('user')}</th><th>{t('id')}</th><th>{t('date')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr></thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {m.firstName} {m.lastName} {m.username ? <span style={{ color: 'var(--primary-400)', fontWeight: '400' }}>@{m.username}</span> : ''}
                            </div>
                          </td>
                          <td style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{m.telegramId}</td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${m.isBanned ? 'badge-error' : 'badge-success'}`}>
                              {m.isBanned ? t('banned') : t('active')}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-icon btn-sm"
                              onClick={() => toggleBan(m)}
                              style={{ width: '32px', height: '32px', color: m.isBanned ? 'var(--success)' : 'var(--warning)', background: m.isBanned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)' }}
                              title={m.isBanned ? t('unban') : t('ban')}
                            >
                              {m.isBanned ? <CheckCircle size={14} /> : <Ban size={14} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteConfirm && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content" style={{ maxWidth: '400px' }}>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Trash2 size={30} color="var(--accent-rose)" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>{t('delete_bot_confirm')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
                  <strong>{deleteConfirm.name}</strong> {t('delete_user_warning')}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                  <button className="btn" style={{ flex: 1, background: 'var(--accent-rose)', color: 'white' }} onClick={handleDeleteBot}>
                    {t('delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
