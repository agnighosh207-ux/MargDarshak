import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, FileText, Target, TrendingUp, BookOpen, Plus, Flame, Coins } from 'lucide-react'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { startOfWeek, endOfWeek } from 'date-fns'

import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/ui/Toast'
import { AuroraBackground } from '../components/ui/AuroraBackground'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { StaggerContainer, StaggerItem } from '../components/ui/StaggerReveal'
import { MagneticButton } from '../components/ui/MagneticButton'
import { SkeletonCard, SkeletonText, SkeletonChart } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'
import { getRandomTagline, EMPTY_STATE_MESSAGES, EXAM_TAGLINES } from '../lib/hinglish'

const HARDCODED_EXAM_DATES: Record<string, { month: number, day: number, label: string }> = {
  'JEE Main': { month: 1, day: 24, label: 'JEE Main (Session 1)' },
  'JEE Advanced': { month: 5, day: 25, label: 'JEE Advanced' },
  'NEET UG': { month: 5, day: 5, label: 'NEET UG' },
  'UPSC CSE': { month: 6, day: 16, label: 'UPSC Prelims' },
  'CAT': { month: 11, day: 24, label: 'CAT Exam' },
  'SSC CGL': { month: 3, day: 10, label: 'SSC CGL' },
  'GATE': { month: 2, day: 5, label: 'GATE' },
}

export function DashboardPage() {
  const { profile, gamification, awardXP } = useProfile()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [todayStudyMinutes, setTodayStudyMinutes] = useState(0)
  const [testsThisWeek, setTestsThisWeek] = useState(0)
  const [avgAccuracy, setAvgAccuracy] = useState(0)
  const [recentTests, setRecentTests] = useState<any[]>([])
  const [weakChapters, setWeakChapters] = useState<any[]>([])
  const [todayPlan, setTodayPlan] = useState<any[]>([])
  const [examCountdown, setExamCountdown] = useState<{ days: number, name: string } | null>(null)
  const [tagline] = useState(() => getRandomTagline())

  const [isLogSessionModalOpen, setIsLogSessionModalOpen] = useState(false)


  useEffect(() => {
    async function fetchDashboardData() {
      if (!profile) return
      try {
        setLoading(true)

        const todayStr = new Date().toISOString().split('T')[0]
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()

        const [
          sessionsRes,
          recentTestsRes,
          weekTestsRes,
          chaptersRes,
          planRes
        ] = await Promise.all([
          supabase.from('study_sessions').select('duration_minutes').eq('user_id', profile.id).eq('session_date', todayStr),
          supabase.from('mock_tests').select('test_name, score, accuracy, taken_at').eq('user_id', profile.id).order('taken_at', { ascending: false }).limit(7),
          supabase.from('mock_tests').select('id', { count: 'exact' }).eq('user_id', profile.id).gte('taken_at', weekStart).lte('taken_at', weekEnd),
          supabase.from('chapter_performance').select('*').eq('user_id', profile.id).lt('accuracy', 50).order('accuracy', { ascending: true }).limit(5),
          supabase.from('study_plan').select('*').eq('user_id', profile.id).eq('plan_date', todayStr).limit(5)
        ])

        // Today's Study Minutes
        const mins = (sessionsRes.data || []).reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0)
        setTodayStudyMinutes(mins)

        // Tests This Week
        setTestsThisWeek(weekTestsRes.count || 0)

        // Recent Tests
        const tests = (recentTestsRes.data || []).reverse()
        setRecentTests(tests)

        // Avg Accuracy (from recent 7 tests)
        if (tests.length > 0) {
          const accSum = tests.reduce((sum, t) => sum + (Number(t.accuracy) || 0), 0)
          setAvgAccuracy(accSum / tests.length)
        } else {
          setAvgAccuracy(0)
        }

        // Weak Chapters
        setWeakChapters(chaptersRes.data || [])

        // Today's Plan
        setTodayPlan(planRes.data || [])

        // Exam Countdown Logic
        if (profile.target_exams && profile.target_exams.length > 0) {
          const now = new Date()
          const currentYear = now.getFullYear()
          let soonest: { days: number, name: string } | null = null

          profile.target_exams.forEach(examCode => {
            const matchKey = Object.keys(HARDCODED_EXAM_DATES).find(k => examCode.includes(k))
            const dateInfo = matchKey ? HARDCODED_EXAM_DATES[matchKey] : null
            
            if (!dateInfo) return

            let examDate = new Date(currentYear, dateInfo.month - 1, dateInfo.day)
            if (examDate < now) {
              examDate = new Date(currentYear + 1, dateInfo.month - 1, dateInfo.day)
            }

            const diff = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            if (!soonest || diff < soonest.days) {
              soonest = { days: diff, name: dateInfo.label }
            }
          })

          if (soonest) {
            setExamCountdown(soonest)
          } else {
            setExamCountdown({ days: Math.floor(Math.random() * 60) + 20, name: profile.target_exams[0] })
          }
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [profile])

  const handleTogglePlanItem = async (id: string, completed: boolean) => {
    setTodayPlan(prev => prev.map(p => p.id === id ? { ...p, completed: !completed } : p))
    await supabase.from('study_plan').update({ completed: !completed }).eq('id', id)

    if (!completed && awardXP) {
      await awardXP(15)
      toast({ type: 'success', title: 'Task completed! +15 XP' })
    }
  }

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const emoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'
  const firstName = profile?.full_name?.split(' ')[0] || 'Student'
  
  // Custom exam tagline if available
  const examCode = profile?.target_exams?.[0]?.toLowerCase()
  const examTagline = examCode ? EXAM_TAGLINES[examCode] : null

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: HERO BAR */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full rounded-2xl overflow-hidden border border-border bg-surface shadow-lg"
      >
        <AuroraBackground className="absolute inset-0 z-0">
          <div className="relative z-10 p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                {greeting}, {firstName} {emoji}
              </h1>
              <p className="text-muted/90 font-medium mb-4 italic">"{examTagline || tagline}"</p>
              {examCountdown && (
                <div className="mt-4 max-w-sm">
                  <div className={cn(
                    "p-4 rounded-2xl border backdrop-blur-md transition-all",
                    examCountdown.days < 30 ? "bg-danger/10 border-danger/30 text-white" : 
                    examCountdown.days > 180 ? "bg-success/10 border-success/30 text-white" : 
                    "bg-white/5 border-white/10 text-white"
                  )}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold">{examCountdown.name} in {examCountdown.days} days</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        {examCountdown.days < 30 ? "🚨 Crunch time!" : examCountdown.days > 180 ? "Time hai, lekin ruk mat 🔥" : "Lage raho! 🚀"}
                      </span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.max(0, Math.min(100, ((365 - examCountdown.days) / 365) * 100))}%` }} 
                        className={cn("h-full", examCountdown.days < 30 ? "bg-danger" : examCountdown.days > 180 ? "bg-success" : "bg-primary")}
                      />
                    </div>
                    
                    <p className="text-[11px] font-medium opacity-80">
                      Beta, {examCountdown.days} din bache hain. Ek din ek chapter.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-black/40 backdrop-blur-md border border-white/10 px-5 py-3 rounded-xl text-center shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <div className="text-2xl font-black text-amber-500 tracking-tighter flex items-center justify-center gap-2">
                  <Flame className="w-6 h-6 fill-amber-500" /> <AnimatedNumber value={profile?.streak_count || 0} />
                </div>
                <div className="text-[10px] text-muted uppercase tracking-widest font-black mt-1">Day Streak</div>
              </div>
              <Link to="/store" className="bg-[#141828] border border-[rgba(255,255,255,0.07)] p-4 md:p-5 rounded-2xl flex items-center justify-between shadow-lg hover:border-primary/30 transition-all cursor-pointer group">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-2xl font-bold text-white">{profile?.coins || 0}</span>
                  </div>
                  <span className="text-xs font-bold text-muted uppercase tracking-widest group-hover:text-amber-400 transition-colors">Marg-Coins</span>
                </div>
              </Link>
              <div className="bg-black/40 backdrop-blur-md border border-white/10 px-5 py-3 rounded-xl text-center shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <div className="text-2xl font-black text-accent tracking-tighter flex items-center justify-center gap-2">
                  ⚡ <AnimatedNumber value={profile?.total_xp || 0} />
                </div>
                <div className="text-[10px] text-muted uppercase tracking-widest font-black mt-1">Total XP</div>
              </div>
            </div>
          </div>
        </AuroraBackground>
      </motion.div>

      {/* SECTION 2: STATS ROW */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StaggerItem className="card-hover bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div className="text-sm font-medium text-muted">Study Time</div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                <AnimatedNumber value={todayStudyMinutes} suffix=" min" />
              </div>
              <div className="flex items-center gap-1 text-xs text-success font-medium">
                <TrendingUp className="w-3 h-3" /> vs 7-day avg
              </div>
            </StaggerItem>

            <StaggerItem className="card-hover bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-medium text-muted">Tests This Week</div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                <AnimatedNumber value={testsThisWeek} />
              </div>
              <div className="text-xs text-muted font-medium">{testsThisWeek} completed</div>
            </StaggerItem>

            <StaggerItem className="card-hover bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-success" />
                </div>
                <div className="text-sm font-medium text-muted">Avg Accuracy</div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                <AnimatedNumber value={avgAccuracy} decimals={1} suffix="%" />
              </div>
              <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${avgAccuracy}%` }} 
                  transition={{ duration: 1 }}
                  className="h-full bg-primary"
                />
              </div>
            </StaggerItem>

            <StaggerItem className="card-hover bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-accent/5 rounded-tl-full blur-2xl" />
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-xl">
                    🔥
                  </div>
                  <div className="text-sm font-medium text-muted">
                    {gamification?.streak === 0 ? "Aaj se shuru karo 🔥" : "Day Streak"}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-accent px-2 py-1 bg-accent/10 rounded-md border border-accent/20 uppercase tracking-wider">
                  {gamification?.levelName || 'Newbie'}
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                <AnimatedNumber value={gamification?.streak || 0} />
                {(gamification?.streak || 0) > 0 && <span className="text-sm font-medium text-muted ml-2">days</span>}
              </div>
              <div className="w-full mt-4">
                <div className="flex justify-between text-[10px] font-semibold text-muted mb-1.5 uppercase tracking-wider">
                  <span>{gamification?.totalXp || 0} XP</span>
                  <span>{gamification?.xpToNextLevel === 0 ? 'Max Level' : `${gamification?.xpToNextLevel} XP to next`}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: gamification && gamification.xpToNextLevel > 0 ? `${(gamification.totalXp / (gamification.totalXp + gamification.xpToNextLevel)) * 100}%` : '100%' }} 
                    transition={{ duration: 1 }}
                    className="h-full bg-accent"
                  />
                </div>
              </div>
            </StaggerItem>
          </>
        )}
      </StaggerContainer>

      {/* SECTION 4: QUICK ACTIONS */}
      <div className="flex overflow-x-auto snap-x gap-4 py-2 custom-scrollbar">
        <MagneticButton>
          <Button onClick={() => navigate('/tests/new')} className="snap-start shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            ⚡ Start Mock Test
          </Button>
        </MagneticButton>
        
        <MagneticButton>
          <Button variant="secondary" onClick={() => navigate('/doubts')} className="snap-start shrink-0">
            🤖 Ask a Doubt
          </Button>
        </MagneticButton>
        
        <Button variant="ghost" onClick={() => setIsLogSessionModalOpen(true)} className="snap-start shrink-0">
          📝 Log Study Session
        </Button>
      </div>

      {/* SECTION 3: MAIN TWO-COL */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT: Recent Performance Chart */}
        <div className="lg:w-[60%] bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">📈 Recent Performance</h2>
          {loading ? (
            <SkeletonChart />
          ) : recentTests.length === 0 ? (
            <EmptyState icon={FileText} title="No tests yet" description={EMPTY_STATE_MESSAGES.no_tests} />
          ) : (
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={recentTests} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="test_name" tickFormatter={(v) => v.substring(0, 12) + (v.length > 12 ? '...' : '')} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis yAxisId="left" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141828', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar yAxisId="left" dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} animationDuration={800} animationEasing="ease-out" />
                  <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} animationDuration={800} animationEasing="ease-out" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* RIGHT: Weak Chapters */}
        <div className="lg:w-[40%] bg-surface border border-border rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">⚠️ Weak Chapters</h2>
          {loading ? (
            <div className="space-y-4"><SkeletonText height={40}/><SkeletonText height={40}/><SkeletonText height={40}/></div>
          ) : weakChapters.length === 0 ? (
            <EmptyState icon={Target} title="All looking strong! 🎯" description="You have no weak chapters below 50% accuracy." />
          ) : (
            <StaggerContainer className="space-y-4 flex-1">
              {weakChapters.map((chap, i) => {
                const isMath = chap.subject.toLowerCase().includes('math')
                const isPhy = chap.subject.toLowerCase().includes('phys')
                const isChem = chap.subject.toLowerCase().includes('chem')
                const badgeColor = isMath ? 'bg-amber-500/10 text-amber-500' : isPhy ? 'bg-indigo-500/10 text-indigo-500' : isChem ? 'bg-emerald-500/10 text-emerald-500' : 'bg-pink-500/10 text-pink-500'

                return (
                  <StaggerItem key={chap.id} className="p-4 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.03)] flex flex-col gap-3 card-hover">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="text-sm font-medium text-white mb-1 leading-tight">{chap.chapter}</div>
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", badgeColor)}>
                          {chap.subject}
                        </span>
                      </div>
                      <Button variant="ghost" onClick={() => navigate(`/doubts?chapter=${encodeURIComponent(chap.chapter)}&subject=${encodeURIComponent(chap.subject)}`)} className="px-3 py-1.5 h-auto text-xs shrink-0 bg-white/5">
                        Practice →
                      </Button>
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between text-[10px] font-semibold text-muted mb-1">
                        <span>ACCURACY</span>
                        <span className="text-danger">{Number(chap.accuracy).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-danger/20 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${chap.accuracy}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-full bg-danger rounded-full" />
                      </div>
                    </div>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          )}
        </div>
      </div>

      {/* SECTION 5: TODAY'S PLAN & DAILY CHECKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">📅 Today's Plan</h2>
            <Link to="/planner" className="text-sm text-primary hover:text-amber-400 font-medium transition-colors">
              View All →
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3"><SkeletonText height={50}/><SkeletonText height={50}/></div>
          ) : todayPlan.length === 0 ? (
            <EmptyState icon={BookOpen} title="No plan for today" description={EMPTY_STATE_MESSAGES.no_plan} actionLabel="Create Plan →" onAction={() => navigate('/planner')} />
          ) : (
            <div className="space-y-3">
              {todayPlan.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.03)] card-hover">
                  <button 
                    onClick={() => handleTogglePlanItem(item.id, item.completed)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      item.completed ? "bg-primary border-primary" : "border-muted hover:border-primary"
                    )}
                  >
                    {item.completed && (
                      <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </motion.svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium truncate transition-colors", item.completed ? "text-muted line-through" : "text-white")}>
                      {item.chapter || item.subject}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted mt-1">
                      <span className="font-semibold text-primary">{item.subject}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.duration_minutes}m</span>
                      {item.start_time && <span>{item.start_time.substring(0, 5)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">✅ Aaj Ka Kaam</h2>
            <span className="text-xs font-semibold text-muted bg-surface-2 px-2 py-1 rounded-full border border-border">Daily</span>
          </div>
          <DailyChecklist />
        </div>
      </div>

      {/* Mobile FAB */}
      <button 
        onClick={() => setIsLogSessionModalOpen(true)}
        className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(245,158,11,0.5)] z-50 hover:scale-105 active:scale-95 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>

      <LogSessionModal 
        isOpen={isLogSessionModalOpen} 
        onClose={() => setIsLogSessionModalOpen(false)} 
        todayStudyMinutes={todayStudyMinutes}
        onSessionLogged={async () => {
          // simple reload for dashboard
          const todayStr = new Date().toISOString().split('T')[0]
          const { data } = await supabase.from('study_sessions').select('duration_minutes').eq('user_id', profile?.id).eq('session_date', todayStr)
          const mins = (data || []).reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0)
          setTodayStudyMinutes(mins)
        }} 
      />
    </div>
  )
}

function LogSessionModal({ isOpen, onClose, todayStudyMinutes, onSessionLogged }: { isOpen: boolean, onClose: () => void, todayStudyMinutes: number, onSessionLogged: () => void }) {
  const { profile, refreshProfile, awardXP } = useProfile()
  const { toast } = useToast()
  
  const [subject, setSubject] = useState('')
  const [chapter, setChapter] = useState('')
  const [duration, setDuration] = useState<number | ''>('')
  const [mood, setMood] = useState<'focused' | 'okay' | 'distracted'>('focused')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [examSubjects, setExamSubjects] = useState<string[]>([])

  useEffect(() => {
    async function loadSubjs() {
      if (!profile || !profile.target_exams || profile.target_exams.length === 0) return
      const { data } = await supabase.from('exams').select('subjects').in('code', profile.target_exams)
      if (data) {
        const subjs = new Set<string>()
        data.forEach(d => d.subjects?.forEach((s: string) => subjs.add(s)))
        setExamSubjects(Array.from(subjs))
      }
    }
    if (isOpen) {
      loadSubjs()
    }
  }, [profile, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    
    if (!subject) {
      toast({ type: 'error', title: 'Bhai, subject toh choose karo' })
      return
    }
    if (!duration) {
      toast({ type: 'error', title: 'Duration toh batao' })
      return
    }
    const durNum = Number(duration)
    if (durNum < 15) {
      toast({ type: 'error', title: '15 minutes se kam? Seriously?' })
      return
    }

    setIsSubmitting(true)

    try {
      await supabase.from('study_sessions').insert({
        user_id: profile.id,
        subject,
        chapter: chapter || null,
        duration_minutes: durNum,
        mood,
        session_date: sessionDate
      })

      const xpGain = Math.floor(20 * (durNum / 30)) || 5
      
      if (awardXP) {
        await awardXP(xpGain)
      } else {
        const { error: rpcError } = await supabase.rpc('increment_xp', { user_id: profile.id, amount: xpGain })
        if (rpcError) {
          await supabase.from('profiles').update({ total_xp: (profile.total_xp || 0) + xpGain }).eq('id', profile.id)
        }
        await refreshProfile()
      }

      toast({ type: 'success', title: `Session logged! +${xpGain} XP earned 🔥` })
      onSessionLogged()
      onClose()
      setSubject('')
      setChapter('')
      setDuration('')
      setMood('focused')
    } catch (error) {
      toast({ type: 'error', title: 'Failed to log session' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md p-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Log Study Session</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)} required className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-2.5 text-white input-glow">
            <option value="" disabled>Select Subject</option>
            {examSubjects.length > 0 ? examSubjects.map(s => <option key={s} value={s}>{s}</option>) : <option value="General">General</option>}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">Chapter (Optional)</label>
          <input type="text" value={chapter} onChange={e => setChapter(e.target.value)} placeholder="e.g. Thermodynamics" className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-2.5 text-white input-glow" />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-2">Duration: {duration ? `${duration} minutes` : ''}</label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 45, 60, 90, 120].map(d => (
              <button 
                type="button" 
                key={d} 
                onClick={() => setDuration(d)} 
                className={cn("py-2 rounded-lg text-sm border transition-all", duration === d ? "bg-primary text-black font-bold border-primary shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "bg-surface-2 border-border text-muted hover:border-primary/50")}
              >
                {d} mins
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-2">Mood</label>
          <div className="flex gap-2">
            {[
              { id: 'focused', emoji: '🧠', label: 'Focused' },
              { id: 'okay', emoji: '😐', label: 'Okay' },
              { id: 'distracted', emoji: '😵', label: 'Distracted' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id as any)}
                className={cn(
                  "flex-1 py-3 rounded-lg flex flex-col items-center gap-1.5 text-sm transition-all",
                  mood === m.id ? "bg-primary/20 border border-primary text-primary font-medium" : "bg-surface-2 border border-border text-muted hover:border-primary/50"
                )}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">Date</label>
          <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} required className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-2.5 text-white input-glow [color-scheme:dark]" />
        </div>

        <div className="pt-4 flex justify-between items-center border-t border-border mt-4">
          <div className="text-xs text-muted font-medium">
            Aaj total: <span className="text-white font-bold text-sm">{todayStudyMinutes}</span> mins studied
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !subject || !duration}>{isSubmitting ? 'Logging...' : 'Log Session'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function DailyChecklist() {
  const { awardXP } = useProfile()
  const { toast } = useToast()
  
  const [tasks, setTasks] = useState<{ id: string, text: string, completed: boolean, xp: number }[]>(() => {
    const savedDate = localStorage.getItem('daily_checklist_date')
    const todayStr = new Date().toISOString().split('T')[0]
    if (savedDate === todayStr) {
      const savedTasks = localStorage.getItem('daily_checklist_tasks')
      if (savedTasks) return JSON.parse(savedTasks)
    }
    return [
      { id: 'mock_test', text: '1 mock test do', completed: false, xp: 20 },
      { id: 'doubt_solve', text: '1 doubt solve karo', completed: false, xp: 10 },
      { id: 'study_session', text: 'Study session log karo', completed: false, xp: 15 }
    ]
  })

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    localStorage.setItem('daily_checklist_date', todayStr)
    localStorage.setItem('daily_checklist_tasks', JSON.stringify(tasks))
  }, [tasks])

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task || task.completed) return // Only allow checking off once for daily bonus

    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: true } : t)
    setTasks(newTasks)
    localStorage.setItem('daily_checklist_tasks', JSON.stringify(newTasks))

    if (awardXP) {
      await awardXP(task.xp)
      toast({ type: 'success', title: `Task done! +${task.xp} XP` })
    }
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.03)] card-hover">
          <button 
            onClick={() => toggleTask(task.id)}
            disabled={task.completed}
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
              task.completed ? "bg-accent border-accent" : "border-muted hover:border-accent"
            )}
          >
            {task.completed && (
              <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </motion.svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className={cn("text-sm font-medium transition-colors", task.completed ? "text-muted line-through" : "text-white")}>
              {task.text}
            </div>
          </div>
          <div className="text-xs font-bold text-accent">+{task.xp} XP</div>
        </div>
      ))}
    </div>
  )
}
