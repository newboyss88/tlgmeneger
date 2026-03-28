'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { 
  DownloadCloud, FileText, UserSquare2, 
  ArrowDownCircle, ArrowUpCircle, Trash2, 
  RefreshCcw, Clock, AlertTriangle, Loader2,
  CheckCircle2, Search, Filter
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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
        toast.error('Xatolik yuz berdi!')
      }
    } catch (err) {
      toast.error('Tarmoq xatosi!')
    } finally {
      setClearing(false)
    }
  }

  const exportPDF = () => {
    if (!data || !data.rawTransactions) return;
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(22)
      doc.text("Analytics Report", 14, 20)
      
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
      
      const tableData = data.rawTransactions.map((t: any) => [
        new Date(t.createdAt).toLocaleString(),
        t.user,
        t.productName,
        t.productSku || '-',
        t.type === 'OUT' ? `-${t.quantity}` : `+${t.quantity}`,
        t.source
      ])

      autoTable(doc, {
        startY: 40,
        head: [['Date', 'User', 'Product', 'SKU', 'Qty', 'Source']],
        body: tableData,
        theme: 'striped',
        styles: { font: 'helvetica' }
      })

      doc.save(`Analytics_${new Date().getTime()}.pdf`)
      toast.success('PDF Exported!')
    } catch (err) {
      console.error('PDF Export error:', err)
      toast.error('PDF export xatosi!')
    }
  }

  const exportExcel = () => {
    if (!data || !data.rawTransactions) return;
    
    // Detailed data for Excel
    const detailedData = data.rawTransactions.map((t: any) => ({
      'Sana (Date)': new Date(t.createdAt).toLocaleString(),
      'Xodim (User)': t.user,
      'Mahsulot (Product)': t.productName,
      'SKU (Barcode)': t.productSku || '',
      'Turi (Type)': t.type === 'OUT' ? 'Chiqim' : 'Kirim',
      'Miqdor (Qty)': t.quantity,
      'Manba (Source)': t.source,
      'Izoh (Note)': t.note || ''
    }))

    const ws = XLSX.utils.json_to_sheet(detailedData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Transactions")
    
    // Add Summary sheet
    const summaryData = [
      { 'Metric': 'Jami amaliyotlar', 'Value': data.totalTransactions },
      { 'Metric': 'Jami chiqim', 'Value': data.totalDeductions },
      { 'Metric': 'Jami kirim', 'Value': data.totalIncomes },
    ]
    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

    XLSX.writeFile(wb, `Report_${new Date().getTime()}.xlsx`)
    toast.success('Excel Exported!')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
        <p className="text-white/50 animate-pulse">Ma'lumotlar yuklanmoqda...</p>
      </div>
    )
  }

  const filteredLogs = data?.rawTransactions?.filter((t: any) => 
    t.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.user.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tight">
            {t('group_analytics') || 'Analitika va Hisobotlar'}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-white/50 text-sm">
            <Clock size={16} />
            {t('analytics_desc') || 'Sklad amaliyotlarining jonli monitoringi'}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={fetchData} 
              disabled={refreshing}
              className="btn bg-white/5 border border-white/10 hover:bg-white/10 transition-all p-2 rounded-xl"
              title="Yangilash"
            >
              <RefreshCcw size={20} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button onClick={exportExcel} className="btn bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-lg shadow-emerald-500/5">
                <FileText size={18} />
                {t('export_excel') || 'Excel'}
            </button>
            <button onClick={exportPDF} className="btn bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all shadow-lg shadow-rose-500/5">
                <DownloadCloud size={18} />
                {t('export_pdf') || 'PDF'}
            </button>
            <button 
              onClick={() => setShowClearConfirm(true)} 
              className="btn bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all"
            >
              <Trash2 size={18} />
              {t('clear_history') || 'Tozalash'}
            </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Jami amaliyot', val: data?.totalTransactions, icon: <Clock className="text-blue-400" />, bg: 'bg-blue-400/5' },
          { label: 'Chiqimlar', val: data?.totalDeductions, icon: <ArrowDownCircle className="text-rose-400" />, bg: 'bg-rose-400/5' },
          { label: 'Kirimlar', val: data?.totalIncomes, icon: <ArrowUpCircle className="text-emerald-400" />, bg: 'bg-emerald-400/5' },
          { label: 'Faol Xodimlar', val: data?.topContributors?.length || 0, icon: <UserSquare2 className="text-purple-400" />, bg: 'bg-purple-400/5' },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`p-6 rounded-[2rem] border border-white/5 ${s.bg} relative overflow-hidden group`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               {s.icon}
            </div>
            <p className="text-white/40 text-sm font-medium mb-1">{s.label}</p>
            <h3 className="text-4xl font-black text-white">{s.val}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Live History Log (2/3 width) */}
        <div className="xl:col-span-2 space-y-4">
           <div className="flex items-center justify-between px-2">
             <h2 className="text-xl font-bold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Jonli Amaliyotlar Logi
             </h2>
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Qidirish..." 
                  className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm focus:border-[var(--primary)] outline-none transition-all w-48 md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
           </div>

           <div className="bg-[var(--card)] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-widest border-b border-white/5">
                        <th className="px-6 py-4 font-bold">Vaqt</th>
                        <th className="px-6 py-4 font-bold">Xodim</th>
                        <th className="px-6 py-4 font-bold">Mahsulot</th>
                        <th className="px-6 py-4 font-bold">Harakat</th>
                        <th className="px-6 py-4 font-bold">Manba</th>
                      </tr>
                   </thead>
                   <tbody className="text-sm">
                      {filteredLogs.map((log: any, idx: number) => (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-white/50">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-6 py-4 font-semibold">{log.user}</td>
                          <td className="px-6 py-4">
                             <div className="font-medium text-white/90">{log.productName}</div>
                             <div className="text-[10px] text-white/30 truncate max-w-[120px]">{log.productSku || 'SKU yo\'q'}</div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded-lg font-bold text-xs ${log.type === 'OUT' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {log.type === 'OUT' ? '-' : '+'}{log.quantity}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-[10px] border border-white/10 px-2 py-0.5 rounded-full uppercase text-white/40">
                                {log.source}
                             </span>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-6 py-12 text-center text-white/30 italic">Ma'lumot topilmadi</td>
                        </tr>
                      )}
                   </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Top Contributors Sidebar (1/3 width) */}
        <div className="space-y-6">
           <div className="bg-[var(--card)] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <UserSquare2 size={100} />
              </div>
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white">
                    🏆
                 </div>
                 {t('top_contributors') || 'Faol Xodimlar'}
              </h2>
              <div className="space-y-4">
                  {data?.topContributors?.slice(0, 10).map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                             <div className="text-lg font-black text-white/10 group-hover:text-[var(--primary)] transition-colors italic w-6">
                                {i + 1}
                             </div>
                             <div>
                                <h4 className="font-bold text-white/90">{c.name}</h4>
                                <p className="text-[10px] text-white/30 uppercase tracking-tighter">{c.outCount + c.inCount} amaliyot bajarilgan</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="text-sm font-black text-white">{c.totalQty} ta</div>
                             <div className="text-[9px] text-rose-400 font-bold uppercase">Chiqim</div>
                          </div>
                      </div>
                  ))}
                  {data?.topContributors?.length === 0 && (
                     <p className="text-center py-8 text-white/20">Hozircha faollik yo'q</p>
                  )}
              </div>
           </div>

           <div className="bg-gradient-to-br from-[var(--primary)] to-purple-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-purple-500/10 relative overflow-hidden">
               <div className="absolute -bottom-4 -right-4 opacity-20 rotate-12">
                  <CheckCircle2 size={120} />
               </div>
               <h3 className="text-xl font-bold mb-2">Tizim holati</h3>
               <p className="text-white/70 text-sm mb-6">Barcha guruhlar va botlar stabil holatda xabarlarni qabul qilmoqda.</p>
               <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <span className="text-xs font-bold uppercase tracking-widest">Live Monitoring On</span>
               </div>
           </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => !clearing && setShowClearConfirm(false)}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
               <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                     <AlertTriangle size={32} className="text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Tarixni tozalash?</h3>
                  <p className="text-white/50 text-sm mb-8">
                     Diqqat! Barcha amaliyotlar (Transactions) tarixi butunlay o'chiriladi. Ushbu amalni ortga qaytarib bo'lmaydi.
                  </p>
                  <div className="flex gap-4">
                     <button 
                        className="btn btn-secondary flex-1" 
                        onClick={() => setShowClearConfirm(false)}
                        disabled={clearing}
                     >
                        Bekor qilish
                     </button>
                     <button 
                        className="btn bg-rose-500 text-white border-none flex-1" 
                        onClick={handleClearHistory}
                        disabled={clearing}
                     >
                        {clearing ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        Tozalash
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
