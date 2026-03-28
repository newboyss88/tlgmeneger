'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import {
  MessageSquare, Settings, Power, Users, Hash, Plus, Trash2,
  CheckCircle, Save, Loader2, Edit2, X
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function GroupPage() {
  const { t } = useLanguage()
  
  // States for list view
  const [bots, setBots] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)

  // Create state
  const [newChatId, setNewChatId] = useState('')
  const [selectedBotId, setSelectedBotId] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  // Edit state
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [groupTitle, setGroupTitle] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [autoReply, setAutoReply] = useState(true)
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null)
  const [groupLanguage, setGroupLanguage] = useState('uz')
  const [isSaving, setIsSaving] = useState(false)

  // Members state
  const [members, setMembers] = useState<any[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [membersLoading, setMembersLoading] = useState(false)
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [botRes, groupRes] = await Promise.all([
        fetch('/api/bot'),
        fetch('/api/group')
      ])

      if (botRes.ok) setBots(await botRes.json())
      if (groupRes.ok) setGroups(await groupRes.json())
    } catch (err) {
      toast.error(t('load_users_error'))
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async (group: any) => {
    setSelectedGroupForMembers(group)
    setIsMembersModalOpen(true)
    setMembersLoading(true)
    try {
      const res = await fetch(`/api/group/members?groupId=${group.id}`)
      if (res.ok) {
        const data = await res.json()
        const admins = data.members || []
        const dbM = data.dbMembers || []

        const merged = [...admins]
        dbM.forEach((m: any) => {
           if (!merged.find(a => String(a.id) === String(m.telegramId))) {
              merged.push({
                 id: m.telegramId,
                 dbId: m.id,
                 firstName: m.firstName || '',
                 lastName: m.lastName || '',
                 username: m.username || '',
                 isBot: false,
                 status: 'member'
              })
           }
        })

        setMembers(merged)
        setTotalMembers(data.totalCount || merged.length)
      }
    } catch (err) {
      toast.error(t('load_users_error'))
    } finally {
      setMembersLoading(false)
    }
  }


  const handleConnect = async () => {
    if (!newChatId || !selectedBotId) {
      toast.error(t('select_bot_chatid_error'))
      return
    }
    
    setIsConnecting(true)
    try {
      const res = await fetch('/api/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: newChatId, botId: selectedBotId }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(t('group_connected_success'))
        setIsConnectModalOpen(false)
        setNewChatId('')
        setSelectedBotId('')
        loadData()
      } else {
        toast.error(data.error || t('group_connect_error'))
      }
    } catch {
      toast.error(t('network_error'))
    } finally {
      setIsConnecting(false)
    }
  }

  const openEditModal = (group: any) => {
    setEditingGroup(group)
    setGroupTitle(group.title)
    setGroupDescription(group.description || '')
    setAutoReply(group.autoReply)
    setGroupAvatar(group.avatar || null)
    setGroupLanguage(group.language || 'uz')
    setIsEditModalOpen(true)
  }

  const handleSaveSettings = async () => {
    if (!editingGroup) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/group', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingGroup.id, 
          autoReply, 
          title: groupTitle,
          description: groupDescription,
          avatar: groupAvatar,
          language: groupLanguage
        }),
      })

      if (res.ok) {
        toast.success(t('saved_success_msg'))
        setIsEditModalOpen(false)
        loadData()
      } else {
        const data = await res.json()
        toast.error(data.error || t('edit_error'))
      }
    } catch {
      toast.error(t('network_error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
         setGroupAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleKick = async (dbId: string) => {
     if (!confirm(t('kick_confirm'))) return
     try {
        const res = await fetch(`/api/bot/members/${dbId}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ groupId: selectedGroupForMembers?.id })
        })
        if (res.ok) {
           toast.success(t('kick_success'))
           loadMembers(selectedGroupForMembers)
        } else {
           const d = await res.json()
           toast.error(d.error || t('action_error'))
        }
     } catch (e) {
        toast.error(t('network_error'))
     }
  }

  // Future expansion: Delete Group API wrapper
  const handleDeleteGroup = async (group: any) => {
    if (!confirm(`"${group.title}" ${t('delete_group_confirm')}`)) return
    try {
      // Assuming a DELETE /api/group?id=... will be implemented or exist
      toast.error(t('delete_group_api_error'))
    } catch {}
  }

  const getRoleLabel = (status: string) => {
    if (status === 'creator') return t('creator_label')
    if (status === 'administrator') return t('admin_label')
    return t('member_label')
  }

  const getRoleBadge = (status: string) => {
    if (status === 'creator') return 'badge-error'
    if (status === 'administrator') return 'badge-primary'
    return 'badge-info'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>{t('group_page_title') || 'Telegram Guruhlar'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('group_page_desc')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsConnectModalOpen(true)}>
          <Plus size={18} /> {t('group_connect')}
        </button>
      </div>

      {/* Grid of Groups */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary-500)" style={{ margin: '0 auto' }}/>
        </div>
      ) : groups.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-secondary)' }}>
          <Hash size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{t('groups_not_found')}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>{t('groups_not_found_desc')}</p>
          <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => setIsConnectModalOpen(true)}>
            <Plus size={18} /> {t('connect_new_group_btn')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {groups.map((group, index) => (
            <motion.div 
              key={group.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.1 }}
              className="card" 
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '12px',
                  background: group.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Hash size={24} color={group.isActive ? 'var(--success)' : 'var(--error)'} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {group.title}
                    {group.isActive && <CheckCircle size={14} color="var(--success)" />}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {group.chatId}
                  </p>
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('connected_bot_label')}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-400)' }}>
                    {group.bot ? `@${group.bot.username}` : t('not_available')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('status_label')}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: group.autoReply ? 'var(--success)' : 'var(--warning)' }}>
                    {group.autoReply ? t('auto_reply_on') : t('auto_reply_off')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '0 8px', fontSize: '13px' }} onClick={() => openEditModal(group)}>
                  <Settings size={14} /> {t('settings')}
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '0 8px', fontSize: '13px' }} onClick={() => loadMembers(group)}>
                  <Users size={14} /> {t('members_btn')}
                </button>
                <button className="btn btn-icon" style={{ color: 'var(--error)', background: 'transparent' }} onClick={() => handleDeleteGroup(group)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Connect New Group Modal */}
      <AnimatePresence>
        {isConnectModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content"
              style={{ maxWidth: '500px', width: '100%' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{t('add_new_group')}</h2>
                <button className="btn btn-icon" onClick={() => setIsConnectModalOpen(false)}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {bots.length === 0 ? (
                  <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '14px' }}>
                    {t('no_bots')}
                  </div>
                ) : (
                  <div className="input-group">
                    <label>{t('connect_bot_label')}</label>
                    <select 
                      className="input" 
                      value={selectedBotId} 
                      onChange={(e) => setSelectedBotId(e.target.value)}
                      style={{ appearance: 'auto' }}
                    >
                      <option value="" disabled>{t('select_bot_placeholder')}</option>
                      {bots.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.username})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="input-group">
                  <label>{t('group_chat_id')}</label>
                  <input
                    type="text" className="input"
                    placeholder={t('chat_id_placeholder')}
                    value={newChatId} onChange={(e) => setNewChatId(e.target.value)}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {t('group_admin_hint')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => setIsConnectModalOpen(false)}>{t('cancel')}</button>
                  <button className="btn btn-primary" onClick={handleConnect} disabled={isConnecting || !newChatId || !selectedBotId}>
                    {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Power size={18} />}
                    {t('connect_save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Group Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingGroup && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content"
              style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{t('group_settings_title')}</h2>
                <button className="btn btn-icon" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Avatar Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <input type="file" id="group-avatar" onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
                  <div 
                     onClick={() => document.getElementById('group-avatar')?.click()}
                     style={{ 
                       width: '80px', height: '80px', borderRadius: '50%', 
                       background: groupAvatar ? `url(${groupAvatar}) center/cover` : 'var(--bg-input)',
                       border: '2px dashed var(--border-primary)', display: 'flex', alignItems: 'center', 
                       justifyContent: 'center', cursor: 'pointer', overflow: 'hidden'
                     }}
                  >
                    {!groupAvatar && <i className="lucide-image text-gray-400" />}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>{t('group_avatar')}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', maxWidth: '300px' }}>
                      {t('bot_avatar_desc')}
                    </p>
                  </div>
                </div>

                <div className="input-group">
                  <label>{t('group_name')}</label>
                  <input type="text" className="input" value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} />
                </div>

                <div className="input-group">
                  <label>{t('group_desc')}</label>
                  <textarea className="input textarea" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} rows={3} />
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600' }}>{t('auto_reply')}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('tg_notif_desc')}</p>
                  </div>
                  <button onClick={() => setAutoReply(!autoReply)} style={{
                    width: '48px', height: '26px', borderRadius: '13px',
                    background: autoReply ? 'var(--primary-600)' : 'var(--gray-600)',
                    position: 'relative', transition: 'all var(--transition-fast)', cursor: 'pointer',
                    border: 'none', outline: 'none'
                  }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                      position: 'absolute', top: '2px',
                      left: autoReply ? '24px' : '2px',
                      transition: 'left var(--transition-fast)',
                    }} />
                  </button>
                </div>

                <div className="input-group">
                  <label>Muloqot tili (Group Language)</label>
                  <select 
                    className="input" 
                    value={groupLanguage} 
                    onChange={(e) => setGroupLanguage(e.target.value)}
                  >
                    <option value="uz">O'zbekcha (O'zbek)</option>
                    <option value="ru">Русский (Russian)</option>
                    <option value="en">English (English)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>{t('cancel')}</button>
                  <button className="btn btn-primary" onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {t('save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Members Modal */}
      <AnimatePresence>
        {isMembersModalOpen && selectedGroupForMembers && (
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
                  <Users size={20} /> "{selectedGroupForMembers.title}" {t('members_btn')}
                </h2>
                <button className="btn btn-icon" onClick={() => setIsMembersModalOpen(false)}><X size={20} /></button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {t('total_count')}: {totalMembers}
              </p>

              {membersLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <Loader2 size={24} className="animate-spin" color="var(--primary-400)" />
                </div>
              ) : members.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('user')}</th>
                        <th>Username</th>
                        <th>{t('role')}</th>
                        <th>{t('type')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member: any) => (
                        <tr key={member.id}>
                          <td style={{ fontWeight: '500' }}>
                            {member.firstName} {member.lastName}
                          </td>
                          <td style={{ color: 'var(--primary-400)' }}>
                            {member.username ? `@${member.username}` : '—'}
                          </td>
                          <td>
                            <span className={`badge ${getRoleBadge(member.status)}`}>
                              {getRoleLabel(member.status)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${member.isBot ? 'badge-warning' : 'badge-info'}`}>
                              {member.isBot ? `🤖 Bot` : `👤 ${t('user')}`}
                            </span>
                          </td>
                          <td>
                            {member.status === 'member' && member.dbId ? (
                              <button className="btn btn-icon btn-sm" onClick={() => handleKick(member.dbId)} title={t('kick_user')} style={{ color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)', borderRadius: 'var(--radius-sm)', width: '32px', height: '32px' }}>
                                <Power size={14} />
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('restricted')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <div className="empty-state-text">{t('no_users_found')}</div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
