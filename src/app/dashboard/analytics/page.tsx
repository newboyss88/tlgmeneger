'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { 
  DownloadCloud, FileText, UserSquare2, 
  ArrowDownCircle, ArrowUpCircle, Trash2, 
  RefreshCcw, Clock, AlertTriangle, Loader2,
  CheckCircle2, Search, Activity, TrendingDown,
  TrendingUp, Users, Package, BarChart3, Sparkles
} from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/analytics')
      const d = await res.json()
      setData(d)
    } catch (e) {
      toast.error(t('load_error') || 'Xatolik yuklashda!')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleClearHistory = async () => {
    setClearing(true)
    try {
      const res = await fetch('/api/analytics', { method: 'DELETE' })
      if (res.ok) {
        toast.success(t('history_cleared') || 'Tarix tozalandi!')
        fetchData()
        setShowClearConfirm(false)
      } else {
        toast.error(t('error') || 'Xatolik!')
      }
    } catch (err) {
      toast.error(t('network_error') || 'Tarmoq xatosi!')
    } finally {
      setClearing(false)
    }
  }

  const exportPDF = async () => {
    if (!data || !data.rawTransactions) return;
    try {
      const { jsPDF } = await import('jspdf')
      const autoTableModule = await import('jspdf-autotable')
      const autoTable = autoTableModule.default || autoTableModule
      
      const doc = new jsPDF()
      doc.setFontSize(20)
      doc.text("Analytics Report", 14, 20)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      
      const tableData = data.rawTransactions.map((t: any) => [
        new Date(t.createdAt).toLocaleString(),
        t.user,
        t.productName,
        t.productSku || '-',
        t.type === 'OUT' ? `-${t.quantity}` : `+${t.quantity}`,
        t.source
      ])

      // @ts-ignore
      if (typeof autoTable === 'function') {
        autoTable(doc, {
          startY: 35,
          head: [['Date', 'User', 'Product', 'SKU', 'Qty', 'Source']],
          body: tableData,
          theme: 'striped',
          styles: { font: 'helvetica', fontSize: 9 }
        })
      } else {
        // @ts-ignore
        doc.autoTable({
          startY: 35,
          head: [['Date', 'User', 'Product', 'SKU', 'Qty', 'Source']],
          body: tableData,
          theme: 'striped',
          styles: { font: 'helvetica', fontSize: 9 }
        })
      }

      doc.save(`Analytics_${new Date().getTime()}.pdf`)
      toast.success('PDF Exported! 📑')
    } catch (err) {
      console.error('PDF Export error:', err)
      toast.error('PDF export xatosi!')
    }
  }

  const exportExcel = () => {
    if (!data || !data.rawTransactions) return;
    
    const detailedData = data.rawTransactions.map((tx: any) => ({
      [t('date') || 'Sana']: new Date(tx.createdAt).toLocaleString(),
      [t('employee') || 'Xodim']: tx.user,
      [t('product') || 'Mahsulot']: tx.productName,
      'SKU': tx.productSku || '',
      [t('type') || 'Turi']: tx.type === 'OUT' ? (t('deduct') || 'Chiqim') : (t('income') || 'Kirim'),
      [t('quantity') || 'Miqdor']: tx.quantity,
      [t('source') || 'Manba']: tx.source,
      [t('note') || 'Izoh']: tx.note || ''
    }))

    const ws = XLSX.utils.json_to_sheet(detailedData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Transactions")
    
    const summaryData = [
      { 'Metric': t('total_operations') || 'Jami amaliyotlar', 'Value': data.totalTransactions },
      { 'Metric': t('total_deductions') || 'Jami chiqim', 'Value': data.totalDeductions },
      { 'Metric': t('total_incomes') || 'Jami kirim', 'Value': data.totalIncomes },
    ]
    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

    XLSX.writeFile(wb, `Report_${new Date().getTime()}.xlsx`)
    toast.success('Excel Exported! 📊')
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '120px 20px', gap: '16px'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={28} style={{ color: 'var(--primary-500)', animation: 'spin 1s linear infinite' }} />
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
          {t('loading') || 'Ma\'lumotlar yuklanmoqda...'}
        </p>
      </div>
    )
  }

  const filteredLogs = data?.rawTransactions?.filter((t: any) => 
    t.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.user.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Stats cards data
  const statsCards = [
    { 
      label: t('total_operations') || 'Jami amaliyot', 
      val: data?.totalTransactions || 0, 
      icon: <Activity size={22} />, 
      gradient: 'linear-gradient(135deg, #3B82F6, #6366F1)',
      shadowColor: 'rgba(59,130,246,0.2)',
      bgLight: 'rgba(59,130,246,0.06)'
    },
    { 
      label: t('total_deductions') || 'Chiqimlar', 
      val: data?.totalDeductions || 0, 
      icon: <TrendingDown size={22} />, 
      gradient: 'linear-gradient(135deg, #F43F5E, #E11D48)',
      shadowColor: 'rgba(244,63,94,0.2)',
      bgLight: 'rgba(244,63,94,0.06)'
    },
    { 
      label: t('total_incomes') || 'Kirimlar', 
      val: data?.totalIncomes || 0, 
      icon: <TrendingUp size={22} />, 
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      shadowColor: 'rgba(16,185,129,0.2)',
      bgLight: 'rgba(16,185,129,0.06)'
    },
    { 
      label: t('active_employees') || 'Faol Xodimlar', 
      val: data?.topContributors?.length || 0, 
      icon: <Users size={22} />, 
      gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
      shadowColor: 'rgba(168,85,247,0.2)',
      bgLight: 'rgba(168,85,247,0.06)'
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>
      
      {/* ============ HEADER ============ */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124,58,237,0.3)'
            }}>
              <BarChart3 size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                {t('group_analytics') || 'Analitika'}
              </h1>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                {t('analytics_desc') || 'Sklad amaliyotlarining jonli monitoringi'}
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={fetchData} 
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
              cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s'
            }}
            title={t('refresh') || 'Yangilash'}
          >
            <RefreshCcw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button 
            onClick={exportExcel} 
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
              borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              background: 'rgba(16,185,129,0.08)', color: '#10B981',
              border: '1px solid rgba(16,185,129,0.15)', transition: 'all 0.2s'
            }}
          >
            <FileText size={15} /> Excel
          </button>
          <button 
            onClick={exportPDF} 
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
              borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              background: 'rgba(244,63,94,0.08)', color: '#F43F5E',
              border: '1px solid rgba(244,63,94,0.15)', transition: 'all 0.2s'
            }}
          >
            <DownloadCloud size={15} /> PDF
          </button>
          <button 
            onClick={() => setShowClearConfirm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
              borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              background: 'rgba(245,158,11,0.08)', color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.15)', transition: 'all 0.2s'
            }}
          >
            <Trash2 size={15} /> {t('clear_history') || 'Tozalash'}
          </button>
        </div>
      </div>

      {/* ============ STATS CARDS ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {statsCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              padding: '24px', borderRadius: '20px',
              background: s.bgLight, border: '1px solid rgba(255,255,255,0.04)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '44px', height: '44px', borderRadius: '14px',
              background: s.gradient, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${s.shadowColor}`,
              color: 'white'
            }}>
              {s.icon}
            </div>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {s.label}
            </p>
            <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-1px' }}>
              {s.val}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        
        {/* Live Log */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                animation: 'pulse 2s infinite'
              }} />
              {t('live_log') || 'Jonli Log'}
              <span style={{
                padding: '2px 8px', borderRadius: '8px', fontSize: '11px',
                fontWeight: '700', background: 'rgba(16,185,129,0.1)', color: '#10B981'
              }}>
                {filteredLogs.length}
              </span>
            </h2>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                placeholder={t('search') || 'Qidirish...'}
                style={{
                  padding: '8px 12px 8px 32px', borderRadius: '10px', fontSize: '12px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                  color: 'var(--text-primary)', outline: 'none', width: '200px'
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '20px',
            border: '1px solid var(--border-secondary)', overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                    {[t('time') || 'Vaqt', t('employee') || 'Xodim', t('product') || 'Mahsulot', t('action') || 'Harakat', t('source') || 'Manba'].map(h => (
                      <th key={h} style={{
                        padding: '14px 18px', fontSize: '11px', fontWeight: '700',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        color: 'var(--text-tertiary)'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log: any, idx: number) => (
                    <tr key={log.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.15s' }}>
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {log.user}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{log.productName}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{log.productSku || ''}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                          background: log.type === 'OUT' ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)',
                          color: log.type === 'OUT' ? '#F43F5E' : '#10B981'
                        }}>
                          {log.type === 'OUT' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                          {log.type === 'OUT' ? '-' : '+'}{log.quantity}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '10px',
                          fontWeight: '600', textTransform: 'uppercase',
                          background: 'rgba(255,255,255,0.04)', color: 'var(--text-tertiary)',
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                          {log.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '48px 18px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                        {t('no_data') || 'Ma\'lumot topilmadi'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Contributors */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '20px', padding: '24px',
            border: '1px solid var(--border-secondary)'
          }}>
            <h2 style={{
              fontSize: '14px', fontWeight: '700', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px'
              }}>
                🏆
              </div>
              {t('top_contributors') || 'Faol Xodimlar'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data?.topContributors?.slice(0, 8).map((c: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '12px',
                  background: i === 0 ? 'rgba(245,158,11,0.06)' : 'transparent',
                  border: i === 0 ? '1px solid rgba(245,158,11,0.1)' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '8px',
                      background: i < 3 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: '800',
                      color: i < 3 ? '#F59E0B' : 'var(--text-tertiary)'
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: '600' }}>{c.name}</h4>
                      <p style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        {c.outCount + c.inCount} {t('operations') || 'amaliyot'}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>{c.totalQty}</div>
                    <div style={{ fontSize: '9px', color: '#F43F5E', fontWeight: '600', textTransform: 'uppercase' }}>
                      {t('deduct') || 'Chiqim'}
                    </div>
                  </div>
                </div>
              ))}
              {(!data?.topContributors || data.topContributors.length === 0) && (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  {t('no_activity') || 'Hozircha faollik yo\'q'}
                </p>
              )}
            </div>
          </div>

          {/* System Status */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.08))',
            borderRadius: '20px', padding: '24px', border: '1px solid rgba(124,58,237,0.12)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.06 }}>
              <Sparkles size={100} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>
              {t('system_status') || 'Tizim holati'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: '1.5' }}>
              {t('system_status_desc') || 'Barcha xizmatlar barqaror ishlayapti.'}
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '12px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.12)'
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)'
              }} />
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#10B981' }}>
                Live Monitoring
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ CLEAR CONFIRM MODAL ============ */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="modal-overlay" 
            onClick={() => !clearing && setShowClearConfirm(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} 
              className="modal" onClick={e => e.stopPropagation()} 
              style={{ maxWidth: '420px' }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '20px',
                  background: 'rgba(245,158,11,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <AlertTriangle size={28} style={{ color: '#F59E0B' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                  {t('clear_history_title') || 'Tarixni tozalash?'}
                </h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>
                  {t('clear_history_desc') || 'Barcha amaliyotlar tarixi butunlay o\'chiriladi. Bu amalni ortga qaytarib bo\'lmaydi.'}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn btn-secondary" style={{ flex: 1 }} 
                    onClick={() => setShowClearConfirm(false)}
                    disabled={clearing}
                  >
                    {t('cancel') || 'Bekor'}
                  </button>
                  <button 
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
                      background: '#F43F5E', color: 'white', border: 'none', cursor: 'pointer'
                    }}
                    onClick={handleClearHistory}
                    disabled={clearing}
                  >
                    {clearing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                    {t('clear') || 'Tozalash'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
