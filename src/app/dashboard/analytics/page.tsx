'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { DownloadCloud, FileText, UserSquare2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import toast from 'react-hot-toast'

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        toast.error('Guruh statistikasini yuklashda xatolik!')
        setLoading(false)
      })
  }, [])

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    
    // Add font for Cyrillic support correctly or just fallback to simple english for title if not embedded.
    // jsPDF standard fonts don't support full utf-8 by default unless a true-type font is added.
    // For now we will use basic ASCII or romanized title to be safe, but jspdf-autotable takes care of tables.
    
    doc.setFontSize(22);
    doc.text(t('group_analytics') || 'Group Analytics', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`${t('total_deductions') || 'Total Deductions'}: ${data.totalTransactions}`, 14, 30);
    
    // @ts-ignore
    doc.autoTable({
      startY: 40,
      head: [['Имя участника', 'Списано раз', 'Приход раз', 'Всего штук (Списано)']],
      body: data.topContributors.map((c: any) => [c.name, c.outCount, c.inCount, c.totalQty]),
      theme: 'grid',
      styles: { font: 'helvetica' }
    });

    doc.save('Analytics_Report.pdf');
    toast.success('PDF yuklandi!');
  }

  const exportExcel = () => {
    if (!data) return;
    const ws_contributors = XLSX.utils.json_to_sheet(data.topContributors.map((c: any) => ({
      'Ishtirokchi (User)': c.name,
      'Chiqim Soni (Times)': c.outCount,
      'Kirim Soni (Times)': c.inCount,
      'Jami Mahsulot (Qty)': c.totalQty
    })));

    const ws_products = XLSX.utils.json_to_sheet(data.topProducts.map((p: any) => ({
      'Mahsulot (Product)': p.name,
      'Jami chiqim qilingan (Deducted Qty)': p.qty
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws_contributors, "Top Ishtirokchilar");
    XLSX.utils.book_append_sheet(wb, ws_products, "Faol Mahsulotlar");
    
    XLSX.writeFile(wb, "Analytics_Report.xlsx");
    toast.success('Excel yuklandi!');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {t('group_analytics') || 'Analytics'}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {t('analytics_desc') || 'Warehouse transaction stats'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <button onClick={exportExcel} className="btn bg-[var(--card)] border border-white/10 hover:border-white/20 text-[var(--accent)] hover:text-white transition-all shadow-sm">
                <FileText size={18} className="text-green-400" />
                {t('export_excel') || 'Export Excel'}
            </button>
            <button onClick={exportPDF} className="btn bg-[var(--card)] border border-white/10 hover:border-white/20 text-[var(--accent)] hover:text-white transition-all shadow-sm">
                <DownloadCloud size={18} className="text-red-400" />
                {t('export_pdf') || 'Export PDF'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <UserSquare2 size={24} className="text-[var(--primary)]" />, title: 'Amaliyotlar soni', val: data?.totalTransactions || 0, trend: '+12%' },
          { icon: <ArrowDownCircle size={24} className="text-red-400" />, title: 'Chiqim amaliyot', val: data?.totalDeductions || 0, trend: 'Ko\'p' },
          { icon: <ArrowUpCircle size={24} className="text-green-400" />, title: 'Kirim amaliyot', val: data?.totalIncomes || 0, trend: 'O\'rtacha' },
        ].map((stat, i) => (
          <motion.div
             key={i}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-[var(--card)] border border-white/5 p-6 rounded-2xl flex items-start justify-between group hover:border-[var(--primary)]/30 transition-colors"
          >
              <div>
                  <p className="text-white/50 text-sm mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold">{stat.val}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[var(--bg)] flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                  {stat.icon}
              </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--card)] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <UserSquare2 className="text-[var(--primary)]" size={20} />
                {t('top_contributors') || 'Faol Xodimlar'}
            </h2>
            <div className="space-y-4">
                {data?.topContributors?.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-purple-500/20 flex items-center justify-center text-white/80 font-bold border border-white/10">
                                {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-[var(--text-primary)]">{c.name}</h4>
                                <span className="text-xs text-[var(--error)] flex items-center gap-1">
                                    📉 {c.totalQty} ta chiqim qilgan
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                           <div className="text-xs text-white/50">{c.outCount} xabar orqali</div>
                           <div className="text-xs text-green-400 mt-1">{c.inCount} marta kirim</div>
                        </div>
                    </div>
                ))}
                {data?.topContributors?.length === 0 && (
                    <p className="text-white/40 text-sm text-center py-4">Hozircha guruhda amaliyot qilingani yo'q.</p>
                )}
            </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[var(--card)] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <FileText className="text-[var(--primary)]" size={20} />
                Ko'p tushirilgan mahsulotlar
            </h2>
            <div className="space-y-4">
                {data?.topProducts?.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-white/5 flex items-center justify-center text-[var(--text-secondary)]">
                                #{i + 1}
                            </div>
                            <h4 className="font-medium text-sm text-white/90">{p.name}</h4>
                        </div>
                        <div className="text-sm font-bold text-[var(--error)]">
                            - {p.qty}
                        </div>
                    </div>
                ))}
                {data?.topProducts?.length === 0 && (
                     <p className="text-white/40 text-sm text-center py-4">Hech bir mahsulot sotilmagan.</p>
                )}
            </div>
        </motion.div>
      </div>

    </div>
  )
}
