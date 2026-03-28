'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Shield, Ban, Trash2, Edit2, X,
  Save, Mail, Phone, MoreHorizontal, UserCheck, UserX, MessageSquare, Loader2, Eye, Bot, Hash
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useSession } from 'next-auth/react'

interface UserItem {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  isBlocked: boolean
  createdAt: string
  telegramId: string | null
}

const roleColors: Record<string, string> = {
  'SUPER_ADMIN': 'badge-error',
  'ADMIN': 'badge-primary',
  'MANAGER': 'badge-info',
  'VIEWER': 'badge-warning',
}

const roleLabels: Record<string, string> = {
  'SUPER_ADMIN': 'Super Admin',
  'ADMIN': 'Admin',
  'MANAGER': 'Manager',
  'VIEWER': 'Viewer',
}

export default function UsersPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN'

  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [messagingUser, setMessagingUser] = useState<UserItem | null>(null)
  
  // Monitoring User
  const [monitoringUser, setMonitoringUser] = useState<UserItem | null>(null)
  const [userResources, setUserResources] = useState<{bots: any[], groups: any[]}>({ bots: [], groups: [] })
  const [resLoading, setResLoading] = useState(false)

  const [messageText, setMessageText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      toast.error(t('load_users_error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.phone && u.phone.includes(searchQuery))
    const matchRole = filterRole === 'ALL' || u.role === filterRole
    return matchSearch && matchRole
  })

  // EDIT USER
  const handleEditSave = async () => {
    if (!editingUser) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          phone: editingUser.phone,
          role: editingUser.role,
          telegramId: editingUser.telegramId
        })
      })
      if (res.ok) {
        toast.success(t('save_success'))
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u))
        setEditingUser(null)
      } else {
        const data = await res.json()
        toast.error(data.error || t('edit_error'))
      }
    } catch (e) {
      toast.error(t('action_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleBlock = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !user.isBlocked })
      })
      if (res.ok) {
        toast.success(user.isBlocked ? t('unbanned_msg') : t('banned_msg'))
        setUsers(users.map(u => u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u))
      } else {
        const data = await res.json()
        toast.error(data.error || t('action_error'))
      }
    } catch (e) {
      toast.error(t('action_error'))
    }
  }

  // DELETE USER
  const deleteUser = (user: UserItem) => {
    setUserToDelete(user)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(t('delete_success'))
        setUsers(users.filter(u => u.id !== userToDelete.id))
        setUserToDelete(null)
      } else {
        const data = await res.json()
        toast.error(data.error || t('action_error'))
      }
    } catch (e) {
      toast.error(t('action_error'))
    } finally {
      setIsDeleting(false)
    }
  }

  // SEND TELEGRAM MESSAGE
  const handleSendMessage = async () => {
    if (!messagingUser?.telegramId || !messageText.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTelegramId: messagingUser.telegramId,
          messageText
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(t('tg_msg_sent'))
        setMessageText('')
        setMessagingUser(null)
      } else {
        toast.error(data.error || t('tg_msg_error'))
      }
    } catch (e) {
      toast.error(t('server_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // FETCH RESOURCES (MONITORING)
  const handleMonitorUser = async (user: UserItem) => {
    setMonitoringUser(user)
    setUserResources({ bots: [], groups: [] }) // Reset previous
    setResLoading(true)
    try {
      const res = await fetch(`/api/users/${user.id}/resources`)
      if (res.ok) {
        const data = await res.json()
        setUserResources(data)
      } else {
        toast.error(t('load_error'))
      }
    } catch (e) {
      toast.error(t('server_error'))
    } finally {
      setResLoading(false)
    }
  }

  if (loading) {
     return <div style={{ display: 'flex', justifyContent: 'center', height: '50vh', alignItems: 'center' }}>
       <Loader2 className="animate-spin" size={32} color="var(--primary-500)" />
     </div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>{t('users')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('users_page_desc')}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: t('total_count'), value: users.length, icon: Users, color: '#8b5cf6' },
          { label: t('active_count'), value: users.filter(u => !u.isBlocked).length, icon: UserCheck, color: '#10b981' },
          { label: t('banned_count'), value: users.filter(u => u.isBlocked).length, icon: UserX, color: '#ef4444' },
        ].map((stat, i) => (
          <motion.div
            key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="stat-card" style={{ padding: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={18} color={stat.color} />
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text" className="input" placeholder={t('search_users_placeholder')}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '42px' }}
          />
        </div>
        <select className="input" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ width: '180px', height: '42px' }}>
          <option value="ALL">{t('all_roles')}</option>
          <option value="SUPER_ADMIN">{t('role_super_admin')}</option>
          <option value="ADMIN">{t('role_admin')}</option>
          <option value="MANAGER">{t('role_manager')}</option>
          <option value="VIEWER">{t('role_viewer')}</option>
        </select>
      </div>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('user')}</th>
                <th>{t('phone')}</th>
                <th>{t('telegram')}</th>
                <th>{t('role')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px' }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {user.phone || <em style={{opacity:0.5}}>{t('not_provided')}</em>}
                  </td>
                  <td>
                    {user.telegramId ? (
                      <span 
                        onClick={() => setMessagingUser(user)}
                        style={{ 
                          fontSize: '13px', 
                          color: 'var(--primary-400)', 
                          cursor: 'pointer', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px'
                        }}
                      >
                        <MessageSquare size={14} />
                        {user.telegramId.startsWith('@') ? user.telegramId : `@${user.telegramId}`}
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{t('not_available')}</span>
                    )}
                  </td>
                  <td><span className={`badge ${roleColors[user.role] || 'badge-secondary'}`}>{roleLabels[user.role] || user.role}</span></td>
                  <td>
                    <span className={`badge ${user.isBlocked ? 'badge-error' : 'badge-success'}`}>
                      {user.isBlocked ? t('banned') : t('active')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {isSuperAdmin && (
                        <button
                          className="btn btn-icon btn-sm" onClick={() => handleMonitorUser(user)}
                          style={{ width: '32px', height: '32px', color: 'var(--primary-500)', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-sm)' }} title={t('monitoring')}
                        ><Eye size={14} /></button>
                      )}
                      
                      <button
                        className="btn btn-icon btn-sm" onClick={() => setEditingUser(user)}
                        style={{ width: '32px', height: '32px', color: 'var(--primary-400)', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-sm)' }} title={t('edit')}
                      ><Edit2 size={14} /></button>
                      
                      <button
                        className="btn btn-icon btn-sm" onClick={() => toggleBlock(user)}
                        style={{ width: '32px', height: '32px', color: user.isBlocked ? 'var(--success)' : 'var(--warning)', background: user.isBlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)' }} title={user.isBlocked ? t('unblock') : t('block')}
                      >{user.isBlocked ? <UserCheck size={14} /> : <Ban size={14} />}</button>
                      
                      {isSuperAdmin && (
                        <button
                          className="btn btn-icon btn-sm" onClick={() => deleteUser(user)}
                          style={{ width: '32px', height: '32px', color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)', borderRadius: 'var(--radius-sm)' }} title={t('delete')}
                        ><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                 <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                       Foydalanuvchilar topilmadi
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setEditingUser(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 className="modal-title" style={{ margin: 0 }}>{t('edit_user')}</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingUser(null)}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label>{t('name_label')}</label>
                  <input type="text" className="input" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} disabled={isSubmitting} />
                </div>
                <div className="input-group">
                  <label>{t('phone_label')}</label>
                  <input type="text" className="input" value={editingUser.phone || ''} onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} placeholder="+998901234567" disabled={isSubmitting} />
                </div>
                <div className="input-group">
                  <label>{t('tg_username_or_id')}</label>
                  <input type="text" className="input" value={editingUser.telegramId || ''} onChange={(e) => setEditingUser({...editingUser, telegramId: e.target.value})} placeholder={t('tg_username_placeholder')} disabled={isSubmitting} />
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('tg_username_hint')}</span>
                </div>
                <div className="input-group">
                  <label>{t('role')}</label>
                  <select className="input" value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} disabled={isSubmitting}>
                    <option value="SUPER_ADMIN">{t('role_super_admin')}</option>
                    <option value="ADMIN">{t('role_admin')}</option>
                    <option value="MANAGER">{t('role_manager')}</option>
                    <option value="VIEWER">{t('role_viewer')}</option>
                  </select>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleEditSave} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Message Modal */}
      <AnimatePresence>
        {messagingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setMessagingUser(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={20} color="var(--primary-400)" />
                  {t('send_message')}
                </h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setMessagingUser(null)}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {t('bot_send_msg_to')} <span style={{ fontWeight: '600', color: 'white' }}>{messagingUser.name} ({messagingUser.telegramId})</span>
                </div>
                <div className="input-group">
                  <label>{t('message_text')}</label>
                  <textarea 
                    className="input textarea" 
                    placeholder={t('hello_placeholder')}
                    value={messageText} 
                    onChange={(e) => setMessageText(e.target.value)} 
                    disabled={isSubmitting} 
                    style={{ minHeight: '120px' }}
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSendMessage} disabled={isSubmitting || !messageText.trim()}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />} {t('send')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monitoring Modal */}
      <AnimatePresence>
        {monitoringUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setMonitoringUser(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={20} color="var(--primary-400)" />
                  {t('monitoring_title')} {monitoringUser.name}
                </h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setMonitoringUser(null)}><X size={20} /></button>
              </div>
              
              {resLoading ? (
                 <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={24} /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Bots List */}
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <Bot size={16} color="var(--primary-400)" />
                       {t('connected_bots')} ({userResources.bots.length})
                    </h4>
                    {userResources.bots.length === 0 ? (
                       <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>{t('no_bots_connected')}</div>
                    ) : (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         {userResources.bots.map((b: any) => (
                           <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontWeight: '600', fontSize: '14px' }}>{b.name}</span>
                               <span style={{ fontSize: '12px', color: 'var(--primary-400)' }}>@{b.username}</span>
                             </div>
                             <span className={`badge ${b.isActive ? 'badge-success' : 'badge-secondary'}`}>{b.isActive ? t('active') : t('inactive')}</span>
                           </div>
                         ))}
                       </div>
                    )}
                  </div>

                  {/* Groups List */}
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <Hash size={16} color="var(--primary-400)" />
                       {t('connected_groups')} ({userResources.groups.length})
                    </h4>
                    {userResources.groups.length === 0 ? (
                       <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>{t('no_groups_connected')}</div>
                    ) : (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         {userResources.groups.map((g: any) => (
                           <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontWeight: '600', fontSize: '14px' }}>{g.title}</span>
                               <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>ID: {g.chatId}</span>
                             </div>
                             <span className="badge badge-info">{g.type}</span>
                           </div>
                         ))}
                       </div>
                    )}
                  </div>

                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => !isDeleting && setUserToDelete(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <UserX size={32} color="var(--error)" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>{t('delete_confirm_user')}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                {userToDelete.name} ({userToDelete.email}) {t('delete_user_warning') || 'ushbu foydalanuvchini platformadan butunlay o\'chirib tashlaysizmi?'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setUserToDelete(null)} disabled={isDeleting}>
                  {t('cancel')}
                </button>
                <button className="btn btn-primary" style={{ background: 'var(--error)' }} onClick={handleConfirmDelete} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />} {t('delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
