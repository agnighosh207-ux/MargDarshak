import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Brain, Calendar, Clock, CheckCircle2, Sparkles, Zap, Loader2, Play, Info } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { cn } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

export function RevisionHubPage() {
  const { profile } = useProfile()
  const navigate = useNavigate()
  
  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['chapter_performance', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from('chapter_performance')
        .select('*')
        .eq('user_id', profile.id)
        .order('next_revision_at', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id
  })

  const { dueNow, upcoming, strong } = useMemo(() => {
    const now = new Date()
    return {
      dueNow: chapters.filter(c => new Date(c.next_revision_at) <= now),
      upcoming: chapters.filter(c => new Date(c.next_revision_at) > now && c.srs_level < 5),
      strong: chapters.filter(c => c.srs_level >= 5)
    }
  }, [chapters])

  const getMemoryStrength = (level: number) => {
    if (level === 0) return { label: 'Fading Fast', color: 'text-danger', bg: 'bg-danger/10' }
    if (level <= 2) return { label: 'Weakening', color: 'text-amber-500', bg: 'bg-amber-500/10' }
    if (level <= 4) return { label: 'Strong', color: 'text-primary', bg: 'bg-primary/10' }
    return { label: 'Mastered', color: 'text-success', bg: 'bg-success/10' }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Brain className="w-10 h-10 text-primary" />
            Revision Hub
          </h1>
          <p className="text-muted font-medium text-lg">Beat the forgetting curve. Revise what you're about to forget.</p>
        </div>

        <div className="flex items-center gap-4 p-4 bg-[#0f1220] border border-white/5 rounded-3xl">
          <div className="px-4 border-r border-white/10">
            <div className="text-2xl font-black text-white">{dueNow.length}</div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Due Today</div>
          </div>
          <div className="px-4">
            <div className="text-2xl font-black text-success">{strong.length}</div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Mastered</div>
          </div>
        </div>
      </div>

      {/* Due Today Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-500" /> Daily Revision Dose
          </h2>
          <div className="text-xs font-bold text-muted uppercase tracking-widest">Scientific Priority</div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : dueNow.length === 0 ? (
          <div className="py-16 text-center bg-[#0f1220] border-2 border-dashed border-white/5 rounded-[40px] space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Sab kuch yaad hai!</h3>
            <p className="text-muted max-w-sm mx-auto font-medium">Aaj koi revision due nahi hai. Naye topics padhne ka time hai! 🚀</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dueNow.map((c, i) => {
              const strength = getMemoryStrength(c.srs_level)
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-[#0f1220] border border-white/5 rounded-[32px] p-8 flex flex-col hover:border-primary/30 transition-all hover:shadow-[0_0_40px_rgba(245,158,11,0.05)]"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", strength.bg, strength.color, `border-${strength.color.split('-')[1]}/20`)}>
                      {strength.label}
                    </div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due Now
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="text-[10px] font-black text-muted uppercase tracking-widest">{c.subject}</div>
                    <h3 className="text-xl font-black text-white leading-tight group-hover:text-primary transition-colors">{c.chapter}</h3>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(c.srs_level / 5) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-white">{Math.round((c.srs_level / 5) * 100)}%</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/tests/new?chapter=${encodeURIComponent(c.chapter)}&subject=${encodeURIComponent(c.subject)}`)}
                    className="mt-8 w-full py-4 bg-white/5 rounded-2xl flex items-center justify-center gap-3 text-sm font-black text-white hover:bg-primary hover:text-black transition-all group/btn"
                  >
                    Start Revision Test <Play className="w-4 h-4 fill-current group-hover/btn:scale-110 transition-transform" />
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Revisions */}
        <div className="bg-[#0f1220] border border-white/5 rounded-[40px] p-8 md:p-10 space-y-8">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" /> Upcoming Schedule
          </h3>

          <div className="space-y-4">
            {upcoming.length === 0 ? (
              <p className="text-muted text-sm italic">Koi upcoming revision nahi hai.</p>
            ) : (
              upcoming.slice(0, 5).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-transparent hover:border-white/5 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted font-black text-xs">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white truncate">{c.chapter}</div>
                      <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{c.subject}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest">In {Math.ceil((new Date(c.next_revision_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Lv. {c.srs_level}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {upcoming.length > 5 && (
            <button className="w-full text-xs font-black text-muted uppercase tracking-[0.2em] hover:text-white transition-colors">
              View All {upcoming.length} Future Revisions
            </button>
          )}
        </div>

        {/* Mastered / Strong */}
        <div className="bg-[#0f1220] border border-white/5 rounded-[40px] p-8 md:p-10 space-y-8">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-success" /> Mastered Concepts
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {strong.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted text-sm font-medium">Bhai thoda padh lo, abhi tak ek bhi topic master nahi kiya!</p>
              </div>
            ) : (
              strong.map(c => (
                <div key={c.id} className="flex items-center gap-4 p-5 bg-success/5 border border-success/20 rounded-[28px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-full blur-2xl pointer-events-none group-hover:bg-success/20 transition-all" />
                  <div className="w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center text-success border border-success/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-white truncate">{c.chapter}</h4>
                    <p className="text-[10px] font-bold text-success uppercase tracking-widest">Locked into Long-Term Memory</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-white">Next Check</div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{new Date(c.next_revision_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 rounded-3xl bg-[#0a0c14] border border-white/5">
            <div className="flex items-start gap-3">
              <span className="text-primary shrink-0"><Info className="w-5 h-5" /></span>
              <p className="text-xs text-muted font-medium leading-relaxed">
                <span className="text-white font-bold">How it works:</span> Based on your test accuracy, our AI calculates the <span className="text-white">optimal interval</span> for revision to ensure maximum retention with minimum effort.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
