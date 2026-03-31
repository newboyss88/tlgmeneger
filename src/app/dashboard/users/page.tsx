'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Shield, Ban, Trash2, Edit2, X,
  Save, Mail, Phone, MoreHorizontal, UserCheck, UserX, MessageSquare, Loader2, Eye, Bot, Hash, Key, Settings, Plus, RefreshCw, AlertCircle
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
  telegramUsername: string | null
  twoFactorEnabled: boolean
  language: string
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
  
  // Full Control Panel State
  const [monitoringUser, setMonitoringUser] = useState<UserItem | null>(null)
  const [userResources, setUserResources] = useState<{bots: any[], groups: any[]}>({ bots: [], groups: [] })
  const [resLoading, setResLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'bots' | 'groups' | 'settings'>('overview')
  const [userSettings, setUserSettings] = useState<any[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Edit Sub-resources
  const [editingBot, setEditingBot] = useState<any | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Message Sending State
  const [messageModal, setMessageModal] = useState<UserItem | null>(null)
  const [messageText, setMessageText] = useState('')

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

  // EDIT USER PROFILE
  const handleSaveProfile = async (targetUser: any) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetUser.name,
          phone: targetUser.phone,
          role: targetUser.role,
          telegramId: targetUser.telegramId,
          language: targetUser.language,
          twoFactorEnabled: targetUser.twoFactorEnabled
        })
      })
      if (res.ok) {
        toast.success(t('save_success'))
        setUsers(users.map(u => u.id === targetUser.id ? { ...u, ...targetUser } : u))
        setMonitoringUser({ ...monitoringUser, ...targetUser })
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

  // ADMIN RESOURCE HANDLERS
  const handleUpdateBot = async (botData: any) => {
    if (!monitoringUser) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${monitoringUser.id}/bots/${botData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botData)
      })
      if (res.ok) {
        toast.success(t('save_success'))
        setUserResources({
          ...userResources,
          bots: userResources.bots.map(b => b.id === botData.id ? { ...b, ...botData } : b)
        })
        setEditingBot(null)
      } else {
        toast.error(t('action_error'))
      }
    } catch (e) {
      toast.error(t('server_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBot = async (botId: string) => {
    if (!monitoringUser || !confirm(t('delete_confirm_bot'))) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${monitoringUser.id}/bots/${botId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(t('delete_success'))
        setUserResources({
          ...userResources,
          bots: userResources.bots.filter(b => b.id !== botId)
        })
      } else {
        toast.error(t('action_error'))
      }
    } catch (e) {
      toast.error(t('server_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!monitoringUser || !confirm(t('delete_confirm_group'))) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${monitoringUser.id}/groups/${groupId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(t('delete_success'))
        setUserResources({
          ...userResources,
          groups: userResources.groups.filter(g => g.id !== groupId)
        })
      } else {
        toast.error(t('action_error'))
      }
    } catch (e) {
      toast.error(t('server_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveSetting = async (key: string, value: string) => {
    if (!monitoringUser) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${monitoringUser.id}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })
      if (res.ok) {
        toast.success(t('save_success'))
        const existing = userSettings.find(s => s.key === key)
        if (existing) {
          setUserSettings(userSettings.map(s => s.key === key ? { ...s, value } : s))
        } else {
          setUserSettings([...userSettings, { key, value }])
        }
      } else {
        toast.error(t('action_error'))
      }
    } catch (e) {
      toast.error(t('server_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSetting = async (key: string) => {
    if (!monitoringUser || !confirm(t('delete_confirm_setting'))) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${monitoringUser.id}/settings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })
      if (res.ok) {
        toast.success(t('delete_success'))
        setUserSettings(userSettings.filter(s => s.key !== key))
      } else {
        toast.error(t('action_error'))
      }
    } catch (e) {
      toast.error(t('server_error'))
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
    if (!messageModal || !messageText.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTelegramId: messageModal.telegramId || messageModal.telegramUsername,
          messageText
        })
      })
      if (res.ok) {
        toast.success(t('msg_sent_success') || 'Xabar yuborildi')
        setMessageModal(null)
        setMessageText('')
      } else {
        const data = await res.json()
        toast.error(data.error || t('msg_send_error'))
      }
    } catch (e) {
      toast.error(t('action_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // FETCH RESOURCES (FULL CONTROL)
  const handleMonitorUser = async (user: UserItem, editMode: boolean = false) => {
    setMonitoringUser(user)
    setIsEditMode(editMode)
    setActiveTab('overview')
    setUserResources({ bots: [], groups: [] })
    setUserSettings([])
    setResLoading(true)
    try {
      const res = await fetch(`/api/users/${user.id}/resources`)
      if (res.ok) {
        const data = await res.json()
        setUserResources({ bots: data.bots, groups: data.groups })
        setUserSettings(data.settings)
        if (data.user) setMonitoringUser({ ...user, ...data.user })
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
                    {user.telegramUsername || user.telegramId ? (
                      <div 
                        onClick={() => setMessageModal(user)}
                        style={{ 
                          fontSize: '13px', 
                          color: 'var(--primary-400)', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                        className="hover-underline"
                      >
                        <MessageSquare size={14} />
                        {user.telegramUsername 
                          ? (user.telegramUsername.startsWith('@') ? user.telegramUsername : `@${user.telegramUsername}`)
                          : (user.telegramId?.startsWith('@') ? user.telegramId : `@${user.telegramId}`)
                        }
                      </div>
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
                          className="btn btn-icon btn-sm" onClick={() => handleMonitorUser(user, false)}
                          style={{ width: '32px', height: '32px', color: 'var(--primary-500)', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-sm)' }} title={t('monitoring')}
                        ><Eye size={14} /></button>
                      )}
                      
                      <button
                        className="btn btn-icon btn-sm" onClick={() => handleMonitorUser(user, true)}
                        style={{ width: '32px', height: '32px', color: 'var(--primary-400)', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-sm)' }} title={t('edit')}
                      ><Edit2 size={14} /></button>
                      
                      <button
                        className="btn btn-icon btn-sm" onClick={() => toggleBlock(user)}
                        style={{ width: '32px', height: '32px', color: user.isBlocked ? 'var(--success)' : 'var(--warning)', background: user.isBlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)' }} title={user.isBlocked ? t('unblock') : t('block')}
                      >{user.isBlocked ? <UserCheck size={14} /> : <Ban size={14} />}</button>
                      
                      {isSuperAdmin && (
                        <button
                          className="btn btn-icon btn-sm" onClick={() => setUserToDelete(user)}
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

      {/* Full User Control Panel (Monitoring + Editing) */}
      <AnimatePresence>
        {monitoringUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => !isSubmitting && setMonitoringUser(null)}>
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} 
              className="modal" style={{ maxWidth: '800px', width: '95%' }} onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: isEditMode ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isEditMode ? 'white' : 'var(--text-tertiary)' }}>
                    {isEditMode ? <Edit2 size={20} /> : <Eye size={20} />}
                  </div>
                  <div>
                    <h3 className="modal-title" style={{ margin: 0 }}>
                      {isEditMode ? `${t('edit')}: ${monitoringUser.name}` : `${t('monitoring')}: ${monitoringUser.name}`}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>{monitoringUser.email}</p>
                  </div>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => setMonitoringUser(null)}><X size={20} /></button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--divider)', paddingBottom: '2px' }}>
                {[
                  { id: 'overview', label: t('overview'), icon: Users },
                  { id: 'bots', label: t('bots'), icon: Bot },
                  { id: 'groups', label: t('groups'), icon: Hash },
                  { id: 'settings', label: t('settings'), icon: Settings },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: '600',
                      color: activeTab === tab.id ? 'var(--primary-400)' : 'var(--text-tertiary)',
                      borderBottom: activeTab === tab.id ? '2px solid var(--primary-400)' : '2px solid transparent',
                      background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ minHeight: '400px', maxHeight: '65vh', overflowY: 'auto', padding: '4px' }}>
                {resLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
                    <Loader2 className="animate-spin" size={32} color="var(--primary-400)" />
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>{t('loading_resources')}</p>
                  </div>
                ) : (
                  <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    {activeTab === 'overview' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="input-group">
                            <label>{t('name_label')}</label>
                            {isEditMode ? (
                              <input type="text" className="input" value={monitoringUser.name} onChange={(e) => setMonitoringUser({ ...monitoringUser, name: e.target.value })} />
                            ) : (
                              <div className="card" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', fontSize: '14px' }}>{monitoringUser.name}</div>
                            )}
                          </div>
                          <div className="input-group">
                            <label>{t('phone_label')}</label>
                            {isEditMode ? (
                              <input type="text" className="input" value={monitoringUser.phone || ''} onChange={(e) => setMonitoringUser({ ...monitoringUser, phone: e.target.value })} />
                            ) : (
                              <div className="card" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', fontSize: '14px' }}>{monitoringUser.phone || t('not_provided')}</div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="input-group">
                            <label>{t('role')}</label>
                            {isEditMode ? (
                              <select className="input" value={monitoringUser.role} onChange={(e) => setMonitoringUser({ ...monitoringUser, role: e.target.value })}>
                                <option value="SUPER_ADMIN">Super Admin</option>
                                <option value="ADMIN">Admin</option>
                                <option value="MANAGER">Manager</option>
                                <option value="VIEWER">Viewer</option>
                              </select>
                            ) : (
                              <div style={{ display: 'flex' }}><span className={`badge ${roleColors[monitoringUser.role]}`}>{roleLabels[monitoringUser.role]}</span></div>
                            )}
                          </div>
                          <div className="input-group">
                            <label>Telegram Username / ID</label>
                            {isEditMode ? (
                              <input type="text" className="input" value={monitoringUser.telegramUsername || monitoringUser.telegramId || ''} onChange={(e) => setMonitoringUser({ ...monitoringUser, telegramUsername: e.target.value })} />
                            ) : (
                              <div 
                                onClick={() => {
                                  setMessageModal(monitoringUser)
                                  setMonitoringUser(null)
                                }}
                                className="card" 
                                style={{ 
                                  padding: '10px 14px', 
                                  background: 'rgba(255,255,255,0.03)', 
                                  fontSize: '14px', 
                                  color: 'var(--primary-400)',
                                  cursor: 'pointer'
                                }}
                              >
                                {monitoringUser.telegramUsername 
                                  ? `@${monitoringUser.telegramUsername.replace('@', '')}` 
                                  : monitoringUser.telegramId 
                                    ? `@${monitoringUser.telegramId.replace('@', '')}`
                                    : t('not_available')
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="input-group">
                            <label>{t('language')}</label>
                            {isEditMode ? (
                              <select className="input" value={monitoringUser.language} onChange={(e) => setMonitoringUser({ ...monitoringUser, language: e.target.value })}>
                                <option value="uz">O'zbekcha</option>
                                <option value="ru">Русский</option>
                                <option value="en">English</option>
                              </select>
                            ) : (
                              <div className="card" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', fontSize: '14px' }}>
                                {monitoringUser.language === 'uz' ? "O'zbekcha" : monitoringUser.language === 'ru' ? 'Русский' : 'English'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: monitoringUser.twoFactorEnabled ? '1px solid var(--accent-green)33' : '1px solid transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: monitoringUser.twoFactorEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Shield size={20} color={monitoringUser.twoFactorEnabled ? 'var(--accent-green)' : 'var(--text-tertiary)'} />
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '14px' }}>{t('two_factor_auth')}</div>
                              <div style={{ fontSize: '12px', color: monitoringUser.twoFactorEnabled ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
                                {monitoringUser.twoFactorEnabled ? t('enabled') : t('disabled')}
                              </div>
                            </div>
                          </div>
                          
                          {isEditMode && (
                            <button 
                              onClick={() => setMonitoringUser({ ...monitoringUser, twoFactorEnabled: !monitoringUser.twoFactorEnabled })}
                              style={{ 
                                padding: '6px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer',
                                background: monitoringUser.twoFactorEnabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: monitoringUser.twoFactorEnabled ? 'var(--accent-rose)' : 'var(--accent-green)',
                                border: 'none', transition: 'all 0.2s'
                              }}
                            >
                              {monitoringUser.twoFactorEnabled ? t('disable') : t('enable')}
                            </button>
                          )}
                        </div>

                        {isEditMode && (
                          <button className="btn btn-primary" onClick={() => handleSaveProfile(monitoringUser)} disabled={isSubmitting} style={{ marginTop: '10px' }}>
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {t('save_profile')}
                          </button>
                        )}
                      </div>
                    )}

                    {activeTab === 'bots' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {userResources.bots.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>{t('no_bots_found')}</div>
                        ) : (
                          userResources.bots.map((bot) => (
                            <div key={bot.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Bot size={20} color="var(--primary-400)" />
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600' }}>{bot.name}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--primary-400)' }}>@{bot.username}</div>
                                </div>
                              </div>
                               <div style={{ display: 'flex', gap: '8px' }}>
                                {isEditMode && (
                                  <>
                                    <button className="btn btn-icon btn-sm" onClick={() => setEditingBot(bot)} title={t('edit')}><Edit2 size={14} /></button>
                                    <button className="btn btn-icon btn-sm" onClick={() => handleUpdateBot({ ...bot, isActive: !bot.isActive })} title={bot.isActive ? t('suspend') : t('activate')}>
                                      <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} color={bot.isActive ? 'var(--accent-green)' : 'var(--text-tertiary)'} />
                                    </button>
                                    <button className="btn btn-icon btn-sm" onClick={() => handleDeleteBot(bot.id)} style={{ color: 'var(--accent-rose)' }} title={t('delete')}><Trash2 size={14} /></button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'groups' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {userResources.groups.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>{t('no_groups_found')}</div>
                        ) : (
                          userResources.groups.map((group) => (
                            <div key={group.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Hash size={20} color="var(--primary-300)" />
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600' }}>{group.title}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>ID: {group.chatId}</div>
                                </div>
                              </div>
                               {isEditMode && (
                                <button className="btn btn-icon btn-sm" onClick={() => handleDeleteGroup(group.id)} style={{ color: 'var(--accent-rose)' }} title={t('delete')}><Trash2 size={14} /></button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'settings' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {isEditMode && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input id="new-setting-key" type="text" className="input" placeholder="Key" style={{ flex: 1 }} />
                            <input id="new-setting-val" type="text" className="input" placeholder="Value" style={{ flex: 1 }} />
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '0 16px' }}
                              onClick={() => {
                                const k = (document.getElementById('new-setting-key') as HTMLInputElement).value;
                                const v = (document.getElementById('new-setting-val') as HTMLInputElement).value;
                                if (k && v) handleSaveSetting(k, v);
                              }}
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {userSettings.map((s) => (
                            <div key={s.id} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Settings size={14} color="var(--primary-300)" />
                                <span style={{ fontWeight: '600', fontSize: '14px', minWidth: '120px' }}>{s.key}</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{s.value}</span>
                              </div>
                               <div style={{ display: 'flex', gap: '8px' }}>
                                {isEditMode && (
                                  <>
                                    <button className="btn btn-icon btn-xs" onClick={() => {
                                       const val = prompt(`Change value for ${s.key}:`, s.value);
                                       if (val !== null) handleSaveSetting(s.key, val);
                                    }}><Edit2 size={12} /></button>
                                    <button className="btn btn-icon btn-xs" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDeleteSetting(s.key)}><Trash2 size={12} /></button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bot Edit Sub-Modal */}
      <AnimatePresence>
        {editingBot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ zIndex: 1001 }} onClick={() => setEditingBot(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 className="modal-title" style={{ margin: 0 }}>{t('edit_bot')}</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingBot(null)}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label>{t('bot_name')}</label>
                  <input type="text" className="input" value={editingBot.name} onChange={(e) => setEditingBot({ ...editingBot, name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>{t('bot_username')}</label>
                  <input type="text" className="input" value={editingBot.username} onChange={(e) => setEditingBot({ ...editingBot, username: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>{t('bot_token')}</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input type="text" className="input" style={{ paddingLeft: '36px' }} value={editingBot.token} onChange={(e) => setEditingBot({ ...editingBot, token: e.target.value })} />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => handleUpdateBot(editingBot)} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation (External) */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ zIndex: 1002 }} onClick={() => !isDeleting && setUserToDelete(null)}>
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
      {/* Message Sending Modal */}
      <AnimatePresence>
        {messageModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ zIndex: 1003 }} onClick={() => !isSubmitting && setMessageModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={20} color="var(--primary-400)" />
                  </div>
                  <div>
                    <h3 className="modal-title" style={{ margin: 0 }}>{t('send_telegram_msg') || 'Xabar yuborish'}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                       {messageModal.name} (@{messageModal.telegramUsername || messageModal.telegramId})
                    </p>
                  </div>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => setMessageModal(null)}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-group">
                  <label>{t('message_label') || 'Xabar matni'}</label>
                  <textarea 
                    className="input" 
                    style={{ minHeight: '120px', padding: '12px', resize: 'none', background: 'rgba(255,255,255,0.02)' }}
                    placeholder={t('message_placeholder') || 'Xabar matnini yuboring...'}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSendMessage} 
                    disabled={isSubmitting || !messageText.trim()}
                    style={{ width: '100%' }}
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
                    {isSubmitting ? (t('sending') || 'Yuborilmoqda...') : (t('send') || 'Yuborish')}
                  </button>

                  <a 
                    href={messageModal.telegramUsername 
                      ? `https://t.me/${messageModal.telegramUsername.replace('@', '')}` 
                      : `https://t.me/${messageModal.telegramId?.replace('@', '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      textAlign: 'center', 
                      fontSize: '13px', 
                      color: 'var(--text-tertiary)', 
                      textDecoration: 'none',
                      marginTop: '8px'
                    }}
                    className="hover-underline"
                  >
                    {t('open_telegram_direct') || 'Telegram ilovasida ochish'}
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
