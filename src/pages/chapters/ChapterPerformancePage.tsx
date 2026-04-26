import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BookOpen, Target, Sparkles, PlayCircle, Bot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, subDays } from 'date-fns'

import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonChart } from '../../components/ui/Skeleton'
import { cn } from '../../lib/utils'

export function ChapterPerformancePage() {
  const { profile } = useProfile()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState<string>('')
  
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (profile?.target_exams && profile.target_exams.length > 0) {
      setSelectedExam(profile.target_exams[0])
    }
  }, [profile])

  useEffect(() => {
    async function loadData() {
      if (!profile) return
      setLoading(true)
      const { data: chapData, error } = await supabase
        .from('chapter_performance')
        .select('*')
        .eq('user_id', profile.id)
      
      if (!error && chapData) {
        setData(chapData)
      }
      setLoading(false)
    }
    loadData()
  }, [profile])

  const currentData = useMemo(() => {
    return data.filter(d => d.exam_code === selectedExam)
  }, [data, selectedExam])

  const stats = useMemo(() => {
    if (currentData.length === 0) return null

    let totalAttempts = 0
    let totalCorrect = 0
    
    const subjectStats: Record<string, { attempts: number, correct: number }> = {}

    let mostImproved: any = null
    const recentDate = subDays(new Date(), 7)

    currentData.forEach(c => {
      totalAttempts += c.attempts || 0
      totalCorrect += c.correct || 0

      if (!subjectStats[c.subject]) {
        subjectStats[c.subject] = { attempts: 0, correct: 0 }
      }
      subjectStats[c.subject].attempts += c.attempts || 0
      subjectStats[c.subject].correct += c.correct || 0

      if (c.last_attempted && parseISO(c.last_attempted) > recentDate) {
        if (!mostImproved || Number(c.accuracy) > Number(mostImproved.accuracy)) {
          mostImproved = c
        }
      }
    })

    const avgAcc = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0
    
    let weakestSubject = { name: '-', acc: 100 }
    Object.entries(subjectStats).forEach(([subj, st]) => {
      const avg = st.attempts > 0 ? (st.correct / st.attempts) * 100 : 0
      if (avg < weakestSubject.acc && st.attempts > 0) {
        weakestSubject = { name: subj, acc: avg }
      }
    })

    return {
      trackedCount: currentData.length,
      avgAccuracy: avgAcc,
      weakestSubject: weakestSubject.name !== '-' ? weakestSubject : null,
      mostImproved
    }
  }, [currentData])

  const groupedBySubject = useMemo(() => {
    const groups: Record<string, any[]> = {}
    currentData.forEach(c => {
      if (!groups[c.subject]) groups[c.subject] = []
      groups[c.subject].push(c)
    })
    
    // Sort each group by accuracy ascending (weakest first)
    Object.keys(groups).forEach(subj => {
      groups[subj].sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0))
    })
    return groups
  }, [currentData])

  const toggleSubject = (subj: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subj]: prev[subj] === undefined ? false : !prev[subj] }))
  }

  // Set default expanded states to true for first render
  useEffect(() => {
    if (Object.keys(groupedBySubject).length > 0 && Object.keys(expandedSubjects).length === 0) {
      const initial: Record<string, boolean> = {}
      Object.keys(groupedBySubject).forEach(s => initial[s] = true)
      setExpandedSubjects(initial)
    }
  }, [groupedBySubject, expandedSubjects])

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <h1 className="text-3xl font-bold text-white">Weak Chapters Analysis</h1>
        <SkeletonChart className="h-32" />
        <SkeletonChart className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" /> Weak Chapters
          </h1>
          <p className="text-muted mt-2">Identify your Achilles' heel and turn it into your strength.</p>
        </div>

        <div className="flex gap-2 bg-surface-2 p-1 border border-border rounded-xl">
          {profile?.target_exams?.map(ex => (
            <button
              key={ex}
              onClick={() => setSelectedExam(ex)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all outline-none",
                selectedExam === ex ? "bg-primary text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "text-muted hover:text-white"
              )}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {currentData.length === 0 ? (
        <EmptyState 
          icon={Target} 
          title="No Data Available" 
          description="Abhi koi test nahi diya — pehle test do, phir weak chapters dikhaenge! 😅"
          actionLabel="Take a Mock Test"
          onAction={() => navigate('/tests')}
        />
      ) : (
        <>
          {/* STATS ROW */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Chapters Tracked</div>
                <div className="text-3xl font-black text-white">{stats.trackedCount}</div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Global Accuracy</div>
                <div className={cn("text-3xl font-black", stats.avgAccuracy > 70 ? "text-success" : stats.avgAccuracy > 40 ? "text-amber-500" : "text-danger")}>
                  {stats.avgAccuracy.toFixed(1)}%
                </div>
              </div>
              <div className="bg-surface border border-danger/30 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-danger/10 rounded-tl-full blur-xl" />
                <div className="text-danger text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Target className="w-3 h-3"/> Weakest Subject</div>
                <div className="text-xl font-bold text-white truncate">{stats.weakestSubject ? stats.weakestSubject.name : 'N/A'}</div>
                {stats.weakestSubject && <div className="text-sm text-danger mt-1">{stats.weakestSubject.acc.toFixed(0)}% avg</div>}
              </div>
              <div className="bg-surface border border-success/30 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-success/10 rounded-tl-full blur-xl" />
                <div className="text-success text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Most Improved</div>
                <div className="text-lg font-bold text-white truncate">{stats.mostImproved ? stats.mostImproved.chapter : 'Keep Practicing!'}</div>
                {stats.mostImproved && <div className="text-sm text-success mt-1">{Number(stats.mostImproved.accuracy).toFixed(0)}% latest</div>}
              </div>
            </div>
          )}

          {/* SUBJECT ACCORDIONS */}
          <div className="space-y-4">
            {Object.entries(groupedBySubject).map(([subject, chapters]) => {
              const isExpanded = expandedSubjects[subject] !== false
              
              // Calculate subject avg for header
              const totalAtt = chapters.reduce((s, c) => s + (c.attempts || 0), 0)
              const totalCorr = chapters.reduce((s, c) => s + (c.correct || 0), 0)
              const subjAvg = totalAtt > 0 ? (totalCorr / totalAtt) * 100 : 0

              return (
                <div key={subject} className="bg-surface border border-border rounded-2xl overflow-hidden transition-all">
                  <button
                    onClick={() => toggleSubject(subject)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 bg-surface hover:bg-surface-2 transition-colors outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-xl font-bold text-white">{subject}</h2>
                        <div className="text-sm text-muted mt-0.5">{chapters.length} chapters tracked</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:block text-right">
                        <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Subj. Avg</div>
                        <div className={cn("font-bold", subjAvg > 70 ? "text-success" : subjAvg > 40 ? "text-amber-500" : "text-danger")}>
                          {subjAvg.toFixed(1)}%
                        </div>
                      </div>
                      <ChevronDown className={cn("w-6 h-6 text-muted transition-transform", isExpanded && "rotate-180")} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="border-t border-border overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-surface-2/50 text-muted text-xs font-semibold uppercase tracking-wider border-b border-border">
                                <th className="py-4 pl-6">Chapter</th>
                                <th className="py-4 text-center">Attempts</th>
                                <th className="py-4 text-center">Correct</th>
                                <th className="py-4 text-center">Accuracy</th>
                                <th className="py-4 text-center">Last Attempted</th>
                                <th className="py-4 text-right pr-6">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {chapters.map((c) => {
                                const acc = Number(c.accuracy || 0)
                                const colorCls = acc > 70 ? "text-success bg-success/10 border-success/20" : 
                                                 acc >= 40 ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : 
                                                 "text-danger bg-danger/10 border-danger/20"
                                
                                return (
                                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-4 pl-6">
                                      <div className="font-bold text-white text-sm">{c.chapter}</div>
                                      {acc < 40 && c.attempts > 0 && <span className="inline-flex mt-1 items-center gap-1 text-[10px] uppercase font-bold text-danger bg-danger/10 px-2 py-0.5 rounded border border-danger/20">Critical Weakness</span>}
                                    </td>
                                    <td className="py-4 text-center text-muted font-medium">{c.attempts}</td>
                                    <td className="py-4 text-center text-muted font-medium">{c.correct}</td>
                                    <td className="py-4 text-center">
                                      {c.attempts > 0 ? (
                                        <span className={cn("inline-block px-2 py-1 rounded-md text-xs font-bold border", colorCls)}>
                                          {acc.toFixed(0)}%
                                        </span>
                                      ) : (
                                        <span className="text-muted text-xs italic">N/A</span>
                                      )}
                                    </td>
                                    <td className="py-4 text-center text-muted text-sm">
                                      {c.last_attempted ? format(parseISO(c.last_attempted), 'MMM dd, yyyy') : '--'}
                                    </td>
                                    <td className="py-4 text-right pr-6">
                                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => navigate(`/doubts?chapter=${encodeURIComponent(c.chapter)}&subject=${encodeURIComponent(c.subject)}`)}
                                          className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"
                                          title="AI se samjho"
                                        >
                                          <Bot className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => navigate(`/tests/new?exam=${selectedExam}&subject=${encodeURIComponent(c.subject)}&topic=${encodeURIComponent(c.chapter)}`)}
                                          className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
                                          title="Practice Now"
                                        >
                                          <PlayCircle className="w-4 h-4" />
                                          <span className="hidden lg:inline">Practice</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
