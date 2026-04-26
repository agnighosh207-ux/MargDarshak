import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Sparkles, Loader2, Save } from 'lucide-react'
import { startOfWeek, addDays, addWeeks, format, isSameDay } from 'date-fns'

import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { askGroq } from '../../lib/groq'
import { useToast } from '../../components/ui/Toast'
import { Button } from '../../components/ui/Button'
import { MagneticButton } from '../../components/ui/MagneticButton'
import { StaggerContainer, StaggerItem } from '../../components/ui/StaggerReveal'
import { cn } from '../../lib/utils'

export function StudyPlannerPage() {
  const { profile, awardXP } = useProfile()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual')

  // --- TAB 1: MANUAL PLANNER STATE ---
  const [weekOffset, setWeekOffset] = useState(0)
  const [plans, setPlans] = useState<any[]>([])

  // Add block state
  const [isAddOpen, setIsAddOpen] = useState<{ isOpen: boolean, date: Date | null }>({ isOpen: false, date: null })
  const [addSubject, setAddSubject] = useState('')
  const [addChapter, setAddChapter] = useState('')
  const [addDuration, setAddDuration] = useState(60)
  const [addTime, setAddTime] = useState('09:00')
  const [examSubjects, setExamSubjects] = useState<string[]>([])

  // Mobile swipe state
  const [mobileDayIdx, setMobileDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  // --- TAB 2: AI PLANNER STATE ---
  const [aiExam, setAiExam] = useState('')
  const [aiDate, setAiDate] = useState('')
  const [aiHours, setAiHours] = useState(4.5)
  const [aiWeak, setAiWeak] = useState<string[]>([])
  const [aiStrong, setAiStrong] = useState<string[]>([])
  const [aiNotes, setAiNotes] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [genPhase, setGenPhase] = useState(0)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({})

  // Initialize Data
  useEffect(() => {
    if (profile?.target_exams && profile.target_exams.length > 0) {
      setAiExam(profile.target_exams[0])
    }
  }, [profile])

  useEffect(() => {
    async function loadSubjs() {
      if (!profile || profile.target_exams.length === 0) return
      const { data } = await supabase.from('exams').select('subjects').in('code', profile.target_exams)
      if (data) {
        const subjs = new Set<string>()
        data.forEach(d => d.subjects?.forEach((s: string) => subjs.add(s)))
        setExamSubjects(Array.from(subjs))
        if (subjs.size > 0) setAddSubject(Array.from(subjs)[0])
      }
    }
    loadSubjs()
  }, [profile])

  // Fetch Plans for week
  const currentMonday = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentMonday, i))
  const weekStartStr = format(weekDays[0], 'yyyy-MM-dd')
  const weekEndStr = format(weekDays[6], 'yyyy-MM-dd')

  const fetchPlans = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('study_plan')
      .select('*')
      .eq('user_id', profile.id)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)
      .order('start_time', { ascending: true })
    setPlans(data || [])
  }

  useEffect(() => {
    if (activeTab === 'manual') fetchPlans()
  }, [weekOffset, profile, activeTab])

  // Manual Handlers
  const handleAddBlock = async () => {
    if (!profile || !isAddOpen.date || !addSubject || !addChapter || !addTime) return
    const { error } = await supabase.from('study_plan').insert({
      user_id: profile.id,
      date: format(isAddOpen.date, 'yyyy-MM-dd'),
      start_time: addTime,
      subject: addSubject,
      chapter: addChapter,
      duration_minutes: addDuration,
      completed: false
    })
    if (!error) {
      toast({ type: 'success', title: 'Block added' })
      setIsAddOpen({ isOpen: false, date: null })
      setAddChapter('')
      fetchPlans()
    } else {
      toast({ type: 'error', title: 'Failed to add block' })
    }
  }

  const toggleComplete = async (id: string, current: boolean) => {
    await supabase.from('study_plan').update({ completed: !current }).eq('id', id)
    setPlans(prev => prev.map(p => p.id === id ? { ...p, completed: !current } : p))
    
    if (!current && awardXP) {
      await awardXP(15)
      toast({ type: 'success', title: 'Task completed! +15 XP' })
    }
  }

  const deleteBlock = async (id: string) => {
    await supabase.from('study_plan').delete().eq('id', id)
    setPlans(prev => prev.filter(p => p.id !== id))
    toast({ type: 'success', title: 'Block deleted' })
  }

  // AI Generation Handlers
  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenPhase(0)
    setGeneratedPlan(null)

    const interval = setInterval(() => setGenPhase(p => (p + 1) % 4), 1500)

    try {
      const sysPrompt = `You are an expert exam strategist for Indian competitive exams. 
Create a detailed 4-week study plan. Return ONLY valid JSON, no markdown:
{
  "plan_title": "string",
  "weekly_hours": number,
  "strategy": "2 sentence overall strategy",
  "weeks": [
    {
      "week_number": 1,
      "theme": "Foundation Building",
      "focus_subjects": ["Physics","Chemistry"],
      "days": [
        {
          "day": "Monday",
          "sessions": [
            { "subject": "Physics", "chapter": "Kinematics", "duration_minutes": 90, "priority": "high", "tip": "Focus on graphs" }
          ]
        }
      ]
    }
  ]
}`
      const userPrompt = `Exam: ${aiExam}. Exam Date: ${aiDate}. Hours/day: ${aiHours}. Weak: ${aiWeak.join(',')}. Strong: ${aiStrong.join(',')}. Notes: ${aiNotes}`
      
      const res = await askGroq([{ role: 'user', content: userPrompt }], sysPrompt)
      const cleanJson = res.replace(/```json\n?|```\n?/g, '').trim()
      const plan = JSON.parse(cleanJson)
      setGeneratedPlan(plan)
      toast({ type: 'success', title: 'Plan Generated Successfully!' })
      setExpandedWeeks({ 1: true }) // Auto expand week 1
    } catch (err) {
      toast({ type: 'error', title: 'Failed to generate plan' })
    } finally {
      clearInterval(interval)
      setIsGenerating(false)
    }
  }

  const handleSaveAiPlan = async () => {
    if (!profile || !generatedPlan) return
    const inserts: any[] = []
    const baseDate = new Date()

    generatedPlan.weeks.forEach((week: any, wIdx: number) => {
      week.days.forEach((dayObj: any) => {
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        const dayTarget = dayNames.indexOf(dayObj.day)
        
        // Find the specific date for this day in the offset week
        let targetDate = startOfWeek(addWeeks(baseDate, wIdx), { weekStartsOn: 1 })
        while(targetDate.getDay() !== dayTarget) {
          targetDate = addDays(targetDate, 1)
        }

        let currHour = 9 // start at 9am
        dayObj.sessions.forEach((s: any) => {
          inserts.push({
            user_id: profile.id,
            date: format(targetDate, 'yyyy-MM-dd'),
            start_time: `${currHour.toString().padStart(2,'0')}:00`,
            subject: s.subject,
            chapter: s.chapter,
            duration_minutes: s.duration_minutes,
            completed: false
          })
          currHour += Math.ceil(s.duration_minutes / 60)
        })
      })
    })

    const { error } = await supabase.from('study_plan').insert(inserts)
    if (!error) {
      toast({ type: 'success', title: 'Plan saved for 4 weeks! 🎉' })
      setActiveTab('manual')
      setWeekOffset(0)
      fetchPlans()
    } else {
      toast({ type: 'error', title: 'Failed to save plan' })
    }
  }

  // Helpers
  const getSubjColor = (sub: string) => {
    const s = sub.toLowerCase()
    if (s.includes('phy')) return 'border-indigo-500'
    if (s.includes('chem')) return 'border-emerald-500'
    if (s.includes('math')) return 'border-amber-500'
    if (s.includes('bio')) return 'border-pink-500'
    return 'border-accent'
  }

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (diff > 50) setMobileDayIdx(p => Math.min(6, p + 1))
    if (diff < -50) setMobileDayIdx(p => Math.max(0, p - 1))
    setTouchStart(null)
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Study Planner</h1>
        <div className="flex bg-surface-2 p-1 rounded-full border border-border w-fit relative">
          {['manual', 'ai'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn("relative px-6 py-2 rounded-full text-sm font-semibold transition-all outline-none", activeTab === tab ? "text-black" : "text-muted hover:text-white")}
            >
              {activeTab === tab && (
                <motion.div layoutId="planner-tab" className="absolute inset-0 bg-primary rounded-full z-0" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10">{tab === 'manual' ? 'Manual Plan' : 'AI Generate Plan'}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'manual' && (
        <div className="space-y-6">
          {/* Week Nav */}
          <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-4">
            <Button variant="ghost" onClick={() => setWeekOffset(p => p - 1)}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Prev Week
            </Button>
            <div className="font-semibold text-white">
              Week of {format(weekDays[0], 'MMM dd')} - {format(weekDays[6], 'MMM dd')}
            </div>
            <Button variant="ghost" onClick={() => setWeekOffset(p => p + 1)}>
              Next Week <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Desktop Grid */}
          <div className="hidden lg:grid grid-cols-7 gap-4">
            {weekDays.map(date => {
              const dStr = format(date, 'yyyy-MM-dd')
              const dayPlans = plans.filter(p => p.date === dStr)
              const isToday = isSameDay(date, new Date())
              const isAddThis = isAddOpen.isOpen && isAddOpen.date?.getTime() === date.getTime()

              return (
                <div key={dStr} className="bg-surface border border-border rounded-2xl p-4 flex flex-col h-full min-h-[500px]">
                  <div className="text-center mb-4 pb-4 border-b border-white/5">
                    <div className="text-sm font-semibold text-muted uppercase tracking-wider">{format(date, 'EEE')}</div>
                    <div className={cn("text-2xl font-bold mt-1", isToday ? "text-primary" : "text-white")}>{format(date, 'dd')}</div>
                    {isToday && <div className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wider">Today</div>}
                  </div>

                  <Button variant="outline" className="w-full mb-4 border-dashed border-white/20 text-muted hover:text-white" onClick={() => setIsAddOpen({ isOpen: true, date })}>
                    <Plus className="w-4 h-4" />
                  </Button>

                  {isAddThis && (
                    <div className="bg-surface-2 p-3 rounded-xl border border-primary/30 mb-4 space-y-3 animate-in slide-in-from-top-2">
                      <select value={addSubject} onChange={e => setAddSubject(e.target.value)} className="w-full bg-[#0a0c14] border border-border rounded text-xs px-2 py-1.5 text-white">
                        {examSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input type="text" placeholder="Chapter" value={addChapter} onChange={e => setAddChapter(e.target.value)} className="w-full bg-[#0a0c14] border border-border rounded text-xs px-2 py-1.5 text-white" />
                      <input type="time" value={addTime} onChange={e => setAddTime(e.target.value)} className="w-full bg-[#0a0c14] border border-border rounded text-xs px-2 py-1.5 text-white [color-scheme:dark]" />
                      <div className="flex gap-1">
                        {[30, 60, 90, 120].map(m => (
                          <button key={m} onClick={() => setAddDuration(m)} className={cn("flex-1 text-[10px] py-1 rounded transition-colors", addDuration === m ? "bg-primary text-black font-bold" : "bg-[#0a0c14] border border-border text-muted")}>{m}m</button>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="ghost" className="flex-1 h-6 text-xs" onClick={() => setIsAddOpen({ isOpen: false, date: null })}>Cancel</Button>
                        <Button className="flex-1 h-6 text-xs" onClick={handleAddBlock}>Save</Button>
                      </div>
                    </div>
                  )}

                  <StaggerContainer className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {dayPlans.map(p => (
                      <StaggerItem key={p.id} className={cn("group relative p-3 rounded-xl border-l-4 bg-surface-2 transition-all", getSubjColor(p.subject), p.completed && "opacity-60")}>
                        <button onClick={() => deleteBlock(p.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-danger hover:text-danger/80 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-start gap-2">
                          <button onClick={() => toggleComplete(p.id, p.completed)} className={cn("shrink-0 w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-colors", p.completed ? "bg-success border-success text-black" : "border-muted hover:border-primary")}>
                            {p.completed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-3 h-3" /></motion.div>}
                          </button>
                          <div className={cn("flex-1 min-w-0", p.completed && "line-through")}>
                            <div className="text-xs font-semibold text-muted mb-0.5">{p.start_time.substring(0,5)} <span className="opacity-50">({p.duration_minutes}m)</span></div>
                            <div className="font-bold text-sm text-white truncate">{p.subject}</div>
                            <div className="text-xs text-muted truncate">{p.chapter}</div>
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
              )
            })}
          </div>

          {/* Mobile View */}
          <div className="lg:hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="flex justify-between items-center bg-surface border border-border p-3 rounded-xl mb-4">
              <Button variant="ghost" onClick={() => setMobileDayIdx(p => Math.max(0, p - 1))} disabled={mobileDayIdx === 0} className="px-2"><ChevronLeft className="w-5 h-5"/></Button>
              <div className="text-center">
                <div className="text-xs font-bold text-muted uppercase">{format(weekDays[mobileDayIdx], 'EEEE')}</div>
                <div className="text-lg font-bold text-white">{format(weekDays[mobileDayIdx], 'MMM dd')}</div>
              </div>
              <Button variant="ghost" onClick={() => setMobileDayIdx(p => Math.min(6, p + 1))} disabled={mobileDayIdx === 6} className="px-2"><ChevronRight className="w-5 h-5"/></Button>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 min-h-[500px]">
              {/* Mobile Add block simplified */}
              <Button variant="outline" className="w-full mb-6 border-dashed border-white/20" onClick={() => setIsAddOpen({ isOpen: true, date: weekDays[mobileDayIdx] })}>
                <Plus className="w-5 h-5 mr-2" /> Add Study Block
              </Button>

              {isAddOpen.isOpen && isAddOpen.date?.getTime() === weekDays[mobileDayIdx].getTime() && (
                <div className="bg-surface-2 p-4 rounded-xl border border-primary/30 mb-6 space-y-4">
                  <select value={addSubject} onChange={e => setAddSubject(e.target.value)} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white">
                    {examSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="text" placeholder="Chapter" value={addChapter} onChange={e => setAddChapter(e.target.value)} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="time" value={addTime} onChange={e => setAddTime(e.target.value)} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white [color-scheme:dark]" />
                    <select value={addDuration} onChange={e => setAddDuration(Number(e.target.value))} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white">
                      {[30, 60, 90, 120].map(m => <option key={m} value={m}>{m} mins</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="ghost" className="flex-1" onClick={() => setIsAddOpen({ isOpen: false, date: null })}>Cancel</Button>
                    <Button className="flex-1" onClick={handleAddBlock}>Save</Button>
                  </div>
                </div>
              )}

              <StaggerContainer className="space-y-4">
                {plans.filter(p => p.date === format(weekDays[mobileDayIdx], 'yyyy-MM-dd')).map(p => (
                  <StaggerItem key={p.id} className={cn("relative p-4 rounded-xl border-l-4 bg-surface-2 transition-all", getSubjColor(p.subject), p.completed && "opacity-60")}>
                    <button onClick={() => deleteBlock(p.id)} className="absolute top-4 right-4 text-danger hover:text-danger/80 p-1 bg-danger/10 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-start gap-4 pr-8">
                      <button onClick={() => toggleComplete(p.id, p.completed)} className={cn("shrink-0 w-6 h-6 rounded flex items-center justify-center border transition-colors mt-0.5", p.completed ? "bg-success border-success text-black" : "border-muted")}>
                        {p.completed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-4 h-4" /></motion.div>}
                      </button>
                      <div className={cn("flex-1 min-w-0", p.completed && "line-through")}>
                        <div className="font-bold text-lg text-white mb-1">{p.subject}</div>
                        <div className="text-sm text-muted mb-2">{p.chapter}</div>
                        <div className="text-xs font-semibold text-primary bg-primary/10 w-fit px-2 py-1 rounded">{p.start_time.substring(0,5)} • {p.duration_minutes}m</div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && !generatedPlan && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-surface border border-border rounded-2xl p-6 lg:p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">AI Strategy Builder</h2>
            <p className="text-muted mt-2">Generate a personalized 4-week hyper-optimized schedule.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Target Exam</label>
                <select value={aiExam} onChange={e => setAiExam(e.target.value)} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow">
                  {profile?.target_exams?.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Exam Date</label>
                <input type="date" value={aiDate} onChange={e => setAiDate(e.target.value)} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow [color-scheme:dark]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2 flex justify-between">
                <span>Daily Study Hours</span>
                <span className="text-primary font-bold">{aiHours} hrs/day</span>
              </label>
              <input type="range" min="2" max="12" step="0.5" value={aiHours} onChange={e => setAiHours(Number(e.target.value))} className="w-full accent-primary h-2 bg-surface-2 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Weak Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {examSubjects.map(s => (
                    <button key={s} onClick={() => setAiWeak(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all", aiWeak.includes(s) ? "bg-danger/10 text-danger border-danger/30" : "bg-surface-2 text-muted border-transparent hover:border-white/20")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Strong Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {examSubjects.map(s => (
                    <button key={s} onClick={() => setAiStrong(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all", aiStrong.includes(s) ? "bg-success/10 text-success border-success/30" : "bg-surface-2 text-muted border-transparent hover:border-white/20")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">Special Constraints / Notes</label>
              <textarea value={aiNotes} onChange={e => setAiNotes(e.target.value)} placeholder="e.g. School till 3pm on weekdays, free Sunday..." rows={3} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow resize-none" />
            </div>

            <div className="pt-6">
              <MagneticButton className="w-full block">
                <Button onClick={handleGenerate} disabled={isGenerating || !aiExam || !aiDate} className="w-full py-4 shadow-[0_0_30px_rgba(245,158,11,0.25)] bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black border-none text-lg">
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {["📚 Analyzing your weak areas...", "🧠 Building optimal schedule...", "📅 Organizing weeks...", "✅ Almost ready..."][genPhase]}
                    </div>
                  ) : "✨ Generate My Study Plan"}
                </Button>
              </MagneticButton>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'ai' && generatedPlan && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
            <h2 className="text-3xl font-bold text-white mb-4 relative z-10">{generatedPlan.plan_title}</h2>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold mb-6 relative z-10">
              {generatedPlan.weekly_hours} hours per week
            </div>
            <div className="bg-surface-2 border-l-4 border-primary p-4 rounded-r-xl text-left">
              <p className="text-white/90 leading-relaxed font-medium">{generatedPlan.strategy}</p>
            </div>
          </div>

          <div className="space-y-4">
            {generatedPlan.weeks.map((week: any) => (
              <div key={week.week_number} className="bg-surface border border-border rounded-xl overflow-hidden">
                <button 
                  onClick={() => setExpandedWeeks(p => ({ ...p, [week.week_number]: !p[week.week_number] }))}
                  className="w-full p-4 flex items-center justify-between hover:bg-surface-2 transition-colors outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary font-bold flex items-center justify-center border border-primary/30">
                      W{week.week_number}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">{week.theme}</div>
                      <div className="text-xs text-muted flex gap-2 mt-1">
                        Focus: {week.focus_subjects.map((s: string) => <span key={s} className="px-1.5 py-0.5 rounded bg-white/5">{s}</span>)}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={cn("w-5 h-5 text-muted transition-transform", expandedWeeks[week.week_number] && "rotate-90")} />
                </button>

                <AnimatePresence>
                  {expandedWeeks[week.week_number] && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-white/5 overflow-hidden">
                      <div className="p-4 space-y-6 bg-[#0a0c14]/50">
                        {week.days.map((day: any) => (
                          <div key={day.day}>
                            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" /> {day.day}
                            </h4>
                            <div className="space-y-2 pl-4 border-l border-white/10 ml-1">
                              {day.sessions.map((s: any, idx: number) => (
                                <div key={idx} className="bg-surface-2 border border-[rgba(255,255,255,0.05)] p-3 rounded-lg flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 relative overflow-hidden group">
                                  <div className={cn("absolute left-0 top-0 bottom-0 w-1", getSubjColor(s.subject))} />
                                  <div className="w-24 shrink-0 font-bold text-white pl-2">{s.subject}</div>
                                  <div className="flex-1 text-sm text-muted">{s.chapter}</div>
                                  <div className="text-xs font-semibold bg-white/5 px-2 py-1 rounded w-fit">{s.duration_minutes}m</div>
                                  {s.tip && <div className="text-xs italic text-amber-500/80 w-full sm:w-1/3 mt-2 sm:mt-0">💡 {s.tip}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="sticky bottom-6 pt-6">
            <MagneticButton className="w-full">
              <Button onClick={handleSaveAiPlan} className="w-full py-4 text-lg shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <Save className="w-5 h-5 mr-2" /> Save to Planner
              </Button>
            </MagneticButton>
          </div>
        </motion.div>
      )}

    </div>
  )
}
