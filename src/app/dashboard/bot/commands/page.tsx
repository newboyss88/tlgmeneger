'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { 
  Bot, Menu, Plus, Trash2, Save, 
  Settings2, HelpCircle, LayoutGrid, 
  Loader2, CheckCircle2, AlertCircle,
  ChevronRight, ExternalLink
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
      toast.error('Botlarni yuklashda xatolik!')
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
         // Default sample commands if none exist
         setCommands([
           { command: 'start', description: 'Botni boshlash / Bosh sahifa' },
           { command: 'menu', description: 'Interaktiv boshqaruv pulti' },
           { command: 'sklad', description: 'Omborxonalar ro\'yxati' },
           { command: 'yordam', description: 'Botdan foydalanish bo\'yicha yordam' }
         ])
      }
    } catch (e) {
      toast.error('Buyruqlarni yuklashda xatolik!')
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
    // Commands must be lowercase letters, numbers and underscores only
    const cleanVal = field === 'command' ? val.toLowerCase().replace(/[^a-z0-9_]/g, '') : val
    updated[idx][field] = cleanVal
    setCommands(updated)
  }

  const handleSave = async () => {
    if (!selectedBotId) return
    
    // Validation: commands must not be empty
    const invalid = commands.some(c => !c.command.trim() || !c.description.trim())
    if (invalid) {
       toast.error('Barcha buyruq va tavsiflarni to\'ldiring!')
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
        toast.success('Telegram menyusi muvaffaqiyatli yangilandi!')
      } else {
        toast.error(data.error || 'Yangilashda xato!')
      }
    } catch (e) {
      toast.error('Tarmoq xatosi!')
    } finally {
      setSaving(false)
    }
  }

  if (loading && bots.length === 0) {
     return (
       <div className="flex flex-col items-center justify-center p-24 space-y-4">
         <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
         <p className="text-white/50">Bot ma'lumotlari yuklanmoqda...</p>
       </div>
     )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Buyruqlar va Menyular
          </h1>
          <p className="text-white/50 text-sm flex items-center gap-2">
            <Menu size={16} />
            Telegram botingizdagi ko'k 'Menu' tugmasini va buyruqlarni boshqarish
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-[var(--card)] p-2 rounded-2xl border border-white/5">
           <span className="text-xs font-bold text-white/30 uppercase pl-3">Bot:</span>
           <select 
              className="bg-transparent border-none outline-none text-sm font-bold text-[var(--primary)] cursor-pointer pr-4"
              value={selectedBotId}
              onChange={(e) => {
                setSelectedBotId(e.target.value)
                fetchCommands(e.target.value)
              }}
           >
              {bots.map((b: any) => (
                <option key={b.id} value={b.id} className="bg-[var(--bg)]">{b.name} (@{b.username})</option>
              ))}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Helper Info */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-gradient-to-br from-indigo-500/10 to-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                 <HelpCircle size={120} />
              </div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-400">
                 <Settings2 size={20} />
                 Qanday ishlaydi?
              </h3>
              <ul className="space-y-4 text-sm text-white/60">
                 <li className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">1</div>
                    Ro'yxatdagidek buyruqlar (/start kabi) Telegram botingizda alohida menyu bo'lib ko'rinadi.
                 </li>
                 <li className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">2</div>
                    Buyruq nomida faqat kichik harf va chiziqlar bo'lishi shart (Masalan: `my_sklad`).
                 </li>
                 <li className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">3</div>
                    'Saqlash' tugmasini bosganingizdan so'ng Telegramda 1 daqiqa ichida o'zgaradi.
                 </li>
              </ul>
              <div className="mt-8 pt-8 border-t border-white/5">
                 <a href="https://core.telegram.org/bots/api#setmycommands" target="_blank" className="text-[10px] uppercase font-bold text-white/30 hover:text-white flex items-center gap-2 transition-colors">
                    Official API Docs <ExternalLink size={12} />
                 </a>
              </div>
           </div>

           <div className="bg-[var(--card)] border border-white/5 rounded-[2rem] p-8 overflow-hidden relative">
               <div className="absolute -bottom-6 -left-6 opacity-[0.03] scale-150">
                  <Bot size={150} />
               </div>
               <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Bot Status: Online</span>
               </div>
               <p className="text-xs text-white/40 leading-relaxed">
                  Barcha buyruqlar real vaqt rejimida Telegram platformasi bilan sinxronizatsiya qilinadi.
               </p>
           </div>
        </div>

        {/* Commands List */}
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-[var(--card)] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold">Bot Buyruqlari</h2>
                 <button 
                   onClick={handleAddCommand}
                   className="btn bg-white/5 border border-white/10 hover:bg-white/10 p-2 rounded-xl text-[var(--primary)]"
                 >
                   <Plus size={20} />
                 </button>
              </div>

              <div className="space-y-4">
                 <AnimatePresence mode="popLayout">
                    {commands.map((cmd, idx) => (
                      <motion.div 
                        key={idx}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex flex-col md:flex-row gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-[var(--primary)]/30 transition-all relative"
                      >
                         <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black uppercase text-white/20 pl-1">Buyruq (Slash-siz)</label>
                            <div className="flex items-center gap-2 bg-black/20 rounded-xl px-3 border border-white/5 group-focus-within:border-[var(--primary)]/50 transition-all">
                               <span className="text-white/30 font-bold">/</span>
                               <input 
                                 type="text" 
                                 className="bg-transparent border-none outline-none py-2 text-sm text-[var(--primary)] font-bold w-full"
                                 placeholder="start"
                                 value={cmd.command}
                                 onChange={(e) => handleCommandChange(idx, 'command', e.target.value)}
                               />
                            </div>
                         </div>
                         <div className="flex-[2] space-y-1">
                            <label className="text-[10px] font-black uppercase text-white/20 pl-1">Tavsif (Description)</label>
                            <input 
                              type="text" 
                              className="bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm text-white/70 w-full outline-none focus:border-[var(--primary)]/50 transition-all"
                              placeholder="Botni ishga tushirish..."
                              value={cmd.description}
                              onChange={(e) => handleCommandChange(idx, 'description', e.target.value)}
                            />
                         </div>
                         <div className="flex items-end justify-end">
                            <button 
                              onClick={() => handleRemoveCommand(idx)}
                              className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                            >
                               <Trash2 size={20} />
                            </button>
                         </div>
                      </motion.div>
                    ))}
                 </AnimatePresence>

                 {commands.length === 0 && (
                   <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
                      <AlertCircle className="w-10 h-10 text-white/10 mx-auto mb-4" />
                      <p className="text-white/30 italic">Hali buyruqlar yo'q. Birinchisini qo'shing!</p>
                   </div>
                 )}
              </div>

              <div className="pt-6 border-t border-white/5 mt-8 flex justify-end">
                 <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="btn bg-[var(--primary)] text-white border-none px-8 py-3 rounded-2xl shadow-xl shadow-[var(--primary)]/20 active:scale-95 transition-all text-base font-bold"
                 >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Telegram menyusini yangilash
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
