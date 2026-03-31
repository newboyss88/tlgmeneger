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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Filters & Export State
  const [bots, setBots] = useState<any[]>([])
  const [selectedBots, setSelectedBots] = useState<string[]>([])
  const [exportModal, setExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'excel'|'pdf'>('excel')
  const [exportLang, setExportLang] = useState<'uz'|'ru'|'en'>('uz')

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const q = new URLSearchParams()
      if (selectedBots.length) q.set('bots', selectedBots.join(','))
      if (selectedDate) q.set('date', selectedDate)
      
      const res = await fetch('/api/analytics?' + q.toString())
      const d = await res.json()
      
      if (!res.ok || d.error) {
         toast.error(d.details || d.error || 'Server API Error', { duration: 6000 })
         setData(null)
      } else {
         setData(d)
      }
    } catch (e: any) {
      toast.error(t('load_error') || 'Xatolik yuklashda!')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetch('/api/bot')
       .then(r => r.json())
       .then(d => { if (Array.isArray(d)) setBots(d) })
       .catch(console.error)
       
    fetchData()
  }, []) 
  
  useEffect(() => {
    if (!loading) fetchData()
  }, [selectedBots, selectedDate])

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

  const tDict = {
     uz: { report: 'Hisobot', kirim: 'Kirim', chiqim: 'Chiqim', jami: 'Jami', date: 'Sana', user: 'Xodim', product: 'Mahsulot', qty: 'Miqdor', source: 'Manba', sum_ops: 'Jami amaliyotlar', sum_ded: 'Jami chiqim', sum_inc: 'Jami kirim', metric: 'Ko\'rsatkich', val: 'Qiymat', who_to: 'Kimga / Qayerga' },
     ru: { report: 'Отчет', kirim: 'Приход', chiqim: 'Расход', jami: 'Итого', date: 'Дата', user: 'Сотрудник', product: 'Товар', qty: 'Кол-во', source: 'Источник', sum_ops: 'Всего операций', sum_ded: 'Всего расход', sum_inc: 'Всего приход', metric: 'Метрика', val: 'Значение', who_to: 'Кому / Куда' },
     en: { report: 'Report', kirim: 'Income', chiqim: 'Expense', jami: 'Summary', date: 'Date', user: 'Employee', product: 'Product', qty: 'Quantity', source: 'Source', sum_ops: 'Total Operations', sum_ded: 'Total Expense', sum_inc: 'Total Income', metric: 'Metric', val: 'Value', who_to: 'To Whom / Where' }
  }

  const executeExport = async () => {
    if (!data || !data.rawTransactions) return;
    const dict = tDict[exportLang]
    
    const inTxs = data.rawTransactions.filter((t: any) => t.type === 'IN')
    const outTxs = data.rawTransactions.filter((t: any) => t.type === 'OUT')

    if (exportFormat === 'excel') {
      const formatData = (txs: any[]) => txs.map(tx => ({
        [dict.date]: new Date(tx.createdAt).toLocaleString('ru-RU'),
        [dict.user]: tx.user,
        [dict.product]: tx.productName,
        'SKU': tx.productSku || '',
        [dict.qty]: tx.quantity,
        [dict.who_to]: tx.note?.replace('KIMGA: ', '') || '-',
        [dict.source]: tx.source
      }))

      const wsIn = XLSX.utils.json_to_sheet(formatData(inTxs))
      const wsOut = XLSX.utils.json_to_sheet(formatData(outTxs))
      const wsSum = XLSX.utils.json_to_sheet([
        { [dict.metric]: dict.sum_ops, [dict.val]: data.totalTransactions },
        { [dict.metric]: dict.sum_ded, [dict.val]: data.totalDeductions },
        { [dict.metric]: dict.sum_inc, [dict.val]: data.totalIncomes },
      ])

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, wsOut, dict.chiqim)
      XLSX.utils.book_append_sheet(wb, wsIn, dict.kirim)
      XLSX.utils.book_append_sheet(wb, wsSum, dict.jami)
      
      XLSX.writeFile(wb, `${dict.report}_${new Date().getTime()}.xlsx`)
      toast.success(`Excel ${t('saved_success_msg') || 'Saqlandi!'}`)
    } else {
      const { jsPDF } = await import('jspdf')
      const autoTableModule = await import('jspdf-autotable')
      const autoTable = autoTableModule.default || autoTableModule
      
      const doc = new jsPDF()
      let fontName = 'helvetica'
      
      try {
        const fontRes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf')
        const buffer = await fontRes.arrayBuffer()
        const fontBase64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''))
        doc.addFileToVFS('Roboto-Regular.ttf', fontBase64)
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
        fontName = 'Roboto'
        doc.setFont('Roboto')
      } catch (e) {
        console.warn("Could not load cyrillic font", e)
      }

      const head = [[dict.date, dict.user, dict.product, 'SKU', dict.qty, dict.who_to, dict.source]]
      
      const getBody = (txs: any[]) => txs.map(t => [
        new Date(t.createdAt).toLocaleString('ru-RU'),
        t.user, t.productName, t.productSku || '-', t.quantity.toString(),
        t.note?.replace('KIMGA: ', '') || '-',
        t.source
      ])

      doc.setFontSize(18)
      doc.text(`${dict.report} - ${dict.chiqim}`, 14, 20)
      
      autoTable(doc, {
        startY: 30, head, body: getBody(outTxs), theme: 'striped',
        styles: { font: fontName, fontSize: 9 }, headStyles: { fillColor: [244, 63, 94], fontStyle: 'normal' }
      })

      doc.addPage()
      doc.setFontSize(18)
      doc.text(`${dict.report} - ${dict.kirim}`, 14, 20)
      autoTable(doc, {
        startY: 30, head, body: getBody(inTxs), theme: 'striped',
        styles: { font: fontName, fontSize: 9 }, headStyles: { fillColor: [16, 185, 129], fontStyle: 'normal' }
      })

      doc.addPage()
      doc.setFontSize(18)
      doc.text(`${dict.report} - ${dict.jami}`, 14, 20)
      autoTable(doc, {
        startY: 30,
        head: [[dict.metric, dict.val]],
        body: [
          [dict.sum_ops, data.totalTransactions.toString()],
          [dict.sum_ded, data.totalDeductions.toString()],
          [dict.sum_inc, data.totalIncomes.toString()]
        ],
        theme: 'grid', styles: { font: fontName, fontSize: 12 }, headStyles: { fontStyle: 'normal' }
      })

      doc.save(`${dict.report}_${new Date().getTime()}.pdf`)
      toast.success(`PDF ${t('saved_success_msg') || 'Saqlandi!'}`)
    }
    setExportModal(false)
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
            onClick={() => setExportModal(true)} 
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
              borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              background: 'rgba(16,185,129,0.08)', color: '#10B981',
              border: '1px solid rgba(16,185,129,0.15)', transition: 'all 0.2s'
            }}
          >
            <DownloadCloud size={15} /> Hisobotni Yuklash
          </button>
          <button 
            onClick={() => setShowClearConfirm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
              borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              background: 'rgba(244,63,94,0.08)', color: '#F43F5E',
              border: '1px solid rgba(244,63,94,0.15)', transition: 'all 0.2s'
            }}
          >
            <Trash2 size={15} /> {t('clear_history') || 'Tozalash'}
          </button>
        </div>
      </div>

      {/* ============ FILTERS ============ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-secondary)' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
           <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600 }}>Botlar</p>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {bots.map(b => (
                 <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={selectedBots.includes(b.id)} onChange={(e) => {
                       if(e.target.checked) setSelectedBots(p => [...p, b.id])
                       else setSelectedBots(p => p.filter(id => id !== b.id))
                    }} />
                    {b.name || 'Bot'}
                 </label>
              ))}
           </div>
        </div>
        <div style={{ minWidth: '180px' }}>
           <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600 }}>Sana boyicha</p>
           <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '6px 12px' }}
           />
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
                marginLeft: '12px', padding: '2px 8px', borderRadius: '8px', fontSize: '11px',
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
                    {[t('time') || 'Vaqt', t('employee') || 'Xodim', t('product') || 'Mahsulot', t('action') || 'Harakat', 'Kimga / Qayerga', t('source') || 'Manba'].map(h => (
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
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                           {log.note?.replace('KIMGA: ', '') || '-'}
                        </div>
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
                      <td colSpan={6} style={{ padding: '48px 18px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
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
            style={{
              position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
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

      {/* ============ EXPORT MODAL ============ */}
      <AnimatePresence>
        {exportModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={() => setExportModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} 
              className="modal" onClick={e => e.stopPropagation()} 
              style={{ maxWidth: '400px', width: '100%' }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
                Hisobotni Yuklash
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('select_date') || 'Sanani tanlang'}</label>
                <input 
                  type="date" 
                  value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Format</label>
                <select 
                  value={exportFormat} onChange={e => setExportFormat(e.target.value as any)}
                  className="input-field"
                >
                  <option value="excel">Excel (.xlsx) - Varaqli</option>
                  <option value="pdf">PDF (.pdf) - Sahifali</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Til</label>
                <select 
                  value={exportLang} onChange={e => setExportLang(e.target.value as any)}
                  className="input-field"
                >
                  <option value="uz">O'zbekcha</option>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-secondary" style={{ flex: 1 }} 
                  onClick={() => setExportModal(false)}
                >
                  Bekor qilish
                </button>
                <button 
                  style={{
                    flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
                    background: 'var(--primary-500)', color: 'white', border: 'none', cursor: 'pointer'
                  }}
                  onClick={executeExport}
                >
                  Yuklab olish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
