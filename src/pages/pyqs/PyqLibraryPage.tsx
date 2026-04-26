import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Download, FileText, Calendar, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { useToast } from '../../components/ui/Toast'

export function PyqLibraryPage() {
  const { profile } = useProfile()
  const { toast } = useToast()
  const [pyqs, setPyqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedExam, setSelectedExam] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState('ALL')

  const EXAMS = ['ALL', 'JEE_MAIN', 'JEE_ADV', 'NEET_UG', 'UPSC_CSE', 'CAT', 'GATE', 'SSC_CGL']
  const YEARS = ['ALL', '2024', '2023', '2022', '2021', '2020']

  useEffect(() => {
    fetchPyqs()
  }, [])

  const fetchPyqs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pyqs')
      .select('*')
      .order('year', { ascending: false })
    
    if (!error) setPyqs(data || [])
    setLoading(false)
  }

  const filteredPyqs = pyqs.filter(p => {
    const matchesSearch = p.paper_name.toLowerCase().includes(search.toLowerCase()) || 
                          p.subject?.toLowerCase().includes(search.toLowerCase())
    const matchesExam = selectedExam === 'ALL' || p.exam_code === selectedExam
    const matchesYear = selectedYear === 'ALL' || p.year.toString() === selectedYear
    return matchesSearch && matchesExam && matchesYear
  })

  const handleDownload = async (p: any) => {
    if (p.is_premium && profile?.plan === 'eklavya') {
      toast({
        type: 'error',
        title: 'Premium Required! 💎',
        description: 'Bhai, ye paper sirf premium users ke liye hai. Upgrade kar lo!'
      })
      return
    }

    // Simulate download
    toast({
      type: 'success',
      title: 'Downloading...',
      description: `${p.paper_name} is being downloaded.`
    })
    
    // In real app, window.open(p.file_url)
    setTimeout(() => {
      window.open(p.file_url, '_blank')
    }, 1000)
    
    // Update download count
    await supabase.rpc('increment_pyq_download', { row_id: p.id })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <FileText className="w-10 h-10 text-primary" />
            PYQ Library
          </h1>
          <p className="text-muted font-medium text-lg">Browse and download authentic Previous Year Questions with solutions.</p>
        </div>

        <div className="flex items-center gap-4 p-2 bg-surface-2 border border-white/5 rounded-2xl">
          <div className="px-4 py-2 text-center border-r border-white/5">
            <div className="text-2xl font-black text-white">{pyqs.length}</div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Total Papers</div>
          </div>
          <div className="px-4 py-2 text-center">
            <div className="text-2xl font-black text-primary">100%</div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Verified</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0f1220] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search papers, subjects..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0a0c14] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Exam Filter */}
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <select 
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="w-full bg-[#0a0c14] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              {EXAMS.map(ex => <option key={ex} value={ex}>{ex.replace('_', ' ')}</option>)}
            </select>
          </div>

          {/* Year Filter */}
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <select 
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full bg-[#0a0c14] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* PYQ Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted font-bold animate-pulse">Bhai papers dhund raha hoon...</p>
        </div>
      ) : filteredPyqs.length === 0 ? (
        <div className="py-20 text-center bg-surface-2 border-2 border-dashed border-white/5 rounded-[40px]">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-muted">
            <Search className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-white">No papers found!</h3>
          <p className="text-muted mt-2 max-w-md mx-auto">Try different keywords or filters. Hum jald hi naye papers add karenge!</p>
          <button 
            onClick={() => {setSearch(''); setSelectedExam('ALL'); setSelectedYear('ALL')}}
            className="mt-8 text-primary font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPyqs.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-[#0f1220] border border-white/5 rounded-[32px] p-6 flex flex-col hover:border-primary/30 transition-all hover:shadow-[0_0_40px_rgba(245,158,11,0.05)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  {p.is_premium && (
                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Premium
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                    {p.exam_code.replace('_', ' ')} • {p.year}
                  </div>
                  <h3 className="text-lg font-black text-white leading-tight group-hover:text-primary transition-colors">
                    {p.paper_name}
                  </h3>
                  <div className="text-xs text-muted font-medium">Subject: <span className="text-white">{p.subject || 'General'}</span></div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    {p.download_count || 0} Downloads
                  </div>
                  <button 
                    onClick={() => handleDownload(p)}
                    className="p-3 bg-white/5 rounded-xl hover:bg-primary hover:text-black transition-all active:scale-95 flex items-center gap-2 text-xs font-bold"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Request Paper Card */}
      <div className="bg-gradient-to-br from-primary/10 to-amber-600/5 border border-primary/20 rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h3 className="text-3xl font-black text-white">Specific paper nahi mila?</h3>
          <p className="text-muted font-medium text-lg">Batayein humein, hum 24 ghante mein update kar denge!</p>
        </div>
        <button 
          onClick={() => toast({ type: 'info', title: 'Feature Coming Soon', description: 'Request system development mein hai!' })}
          className="px-10 py-4 bg-primary text-black font-black rounded-2xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(245,158,11,0.2)] flex items-center gap-3"
        >
          Request Now <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
