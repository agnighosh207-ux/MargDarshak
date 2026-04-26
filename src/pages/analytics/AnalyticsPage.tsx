import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveContainer, ComposedChart, Bar, Line, Scatter, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import { subDays, format, startOfDay, parseISO, eachDayOfInterval } from 'date-fns'
import { ChevronDown, Loader2, Sparkles, X, Target, Printer } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { askGroq } from '../../lib/groq'
import { StaggerContainer, StaggerItem } from '../../components/ui/StaggerReveal'
import { SkeletonChart } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { cn } from '../../lib/utils'
import { EMPTY_STATE_MESSAGES } from '../../lib/hinglish'

type TimeRange = '7D' | '30D' | '3M' | 'All'

export function AnalyticsPage() {
  const { profile } = useProfile()
  const navigate = useNavigate()
  
  const [timeRange, setTimeRange] = useState<TimeRange>('30D')
  const [loading, setLoading] = useState(true)
  const [roastMode, setRoastMode] = useState(() => localStorage.getItem('roast_mode') === 'true')

  useEffect(() => {
    localStorage.setItem('roast_mode', roastMode.toString())
  }, [roastMode])

  // Data State
  const [sessions, setSessions] = useState<any[]>([])
  const [tests, setTests] = useState<any[]>([])
  const [chapterPerf, setChapterPerf] = useState<any[]>([])
  
  // UI State
  const [selectedExamTab, setSelectedExamTab] = useState<string>('')
  const [chapterModal, setChapterModal] = useState<{ isOpen: boolean, chapter: any }>({ isOpen: false, chapter: null })
  const [showOnlyWeak, setShowOnlyWeak] = useState(false)
  
  // AI Cache state
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({})
  const [loadingSummaries, setLoadingSummaries] = useState<Record<string, boolean>>({})
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.target_exams && profile.target_exams.length > 0) {
      setSelectedExamTab(profile.target_exams[0])
    }
  }, [profile])

  useEffect(() => {
    async function fetchData() {
      if (!profile) return
      setLoading(true)

      let startDate = new Date(0) // All
      if (timeRange === '7D') startDate = subDays(new Date(), 7)
      if (timeRange === '30D') startDate = subDays(new Date(), 30)
      if (timeRange === '3M') startDate = subDays(new Date(), 90)

      const startIso = startDate.toISOString()

      const [sessRes, testsRes, chapRes] = await Promise.all([
        supabase.from('study_sessions').select('*').eq('user_id', profile.id).gte('session_date', startIso),
        supabase.from('mock_tests').select('*').eq('user_id', profile.id).gte('taken_at', startIso),
        supabase.from('chapter_performance').select('*').eq('user_id', profile.id)
      ])

      setSessions(sessRes.data || [])
      setTests(testsRes.data || [])
      setChapterPerf(chapRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [profile, timeRange])

  // ==============================
  // SECTION 1: Performance Over Time
  // ==============================
  const trendData = useMemo(() => {
    const dataMap: Record<string, { date: string, minutes: number, totalAcc: number, testCount: number, avgAcc: number }> = {}
    
    // Process sessions
    sessions.forEach(s => {
      const d = s.session_date
      if (!dataMap[d]) dataMap[d] = { date: format(parseISO(d), 'MMM dd'), minutes: 0, totalAcc: 0, testCount: 0, avgAcc: 0 }
      dataMap[d].minutes += (s.duration_minutes || 0)
    })

    // Process tests
    tests.forEach(t => {
      const d = t.taken_at.split('T')[0]
      if (!dataMap[d]) dataMap[d] = { date: format(parseISO(d), 'MMM dd'), minutes: 0, totalAcc: 0, testCount: 0, avgAcc: 0 }
      dataMap[d].totalAcc += Number(t.accuracy || 0)
      dataMap[d].testCount += 1
    })

    const result = Object.values(dataMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    result.forEach(r => {
      r.avgAcc = r.testCount > 0 ? r.totalAcc / r.testCount : 0
    })
    return result
  }, [sessions, tests])

  // ==============================
  // SECTION 2: Subject Breakdown
  // ==============================
  const subjectData = useMemo(() => {
    const sMap: Record<string, { subject: string, totalMinutes: number, testCount: number, totalAcc: number, avgAcc: number }> = {}
    
    sessions.forEach(s => {
      if (!s.subject) return
      if (!sMap[s.subject]) sMap[s.subject] = { subject: s.subject, totalMinutes: 0, testCount: 0, totalAcc: 0, avgAcc: 0 }
      sMap[s.subject].totalMinutes += (s.duration_minutes || 0)
    })

    tests.forEach(t => {
      if (!t.subject) return
      if (!sMap[t.subject]) sMap[t.subject] = { subject: t.subject, totalMinutes: 0, testCount: 0, totalAcc: 0, avgAcc: 0 }
      sMap[t.subject].totalAcc += Number(t.accuracy || 0)
      sMap[t.subject].testCount += 1
    })

    const maxMins = Math.max(...Object.values(sMap).map(x => x.totalMinutes), 1)

    const list = Object.values(sMap).map(s => {
      const accuracy = s.testCount > 0 ? s.totalAcc / s.testCount : 0
      const timeNormalized = (s.totalMinutes / maxMins) * 100 // 0 to 100 scale for radar
      return {
        ...s,
        avgAcc: accuracy,
        timeNormalized,
        fullSubject: s.subject,
        subject: s.subject.substring(0, 10) + (s.subject.length > 10 ? '.' : '') // Short name for radar
      }
    })
    return list.sort((a, b) => a.avgAcc - b.avgAcc)
  }, [sessions, tests])

  // ==============================
  // SECTION 3: Chapter Heatmap
  // ==============================
  const chapterGroups = useMemo(() => {
    let chaps = chapterPerf.filter(c => c.exam_code === selectedExamTab)
    if (showOnlyWeak) {
      chaps = chaps.filter(c => Number(c.accuracy) < 60)
    }
    
    const groups: Record<string, any[]> = {}
    chaps.forEach(c => {
      if (!groups[c.subject]) groups[c.subject] = []
      groups[c.subject].push(c)
    })
    return groups
  }, [chapterPerf, selectedExamTab, showOnlyWeak])

  // ==============================
  // SECTION 4: Weak Chapters & Scatter Data
  // ==============================
  const weakChapters = useMemo(() => {
    return chapterPerf.filter(c => Number(c.accuracy) < 60 && c.attempts > 0).sort((a, b) => Number(a.accuracy) - Number(b.accuracy))
  }, [chapterPerf])

  const scatterData = useMemo(() => {
    const map: Record<string, { mins: number, acc: number, count: number }> = {}
    sessions.forEach(s => {
      const d = s.session_date
      if (!map[d]) map[d] = { mins: 0, acc: 0, count: 0 }
      map[d].mins += s.duration_minutes || 0
    })
    tests.forEach(t => {
      const d = t.taken_at.split('T')[0]
      if (!map[d]) map[d] = { mins: 0, acc: 0, count: 0 }
      map[d].acc += Number(t.accuracy || 0)
      map[d].count += 1
    })
    
    const pts = Object.values(map)
      .filter(m => m.mins > 0 && m.count > 0)
      .map(m => ({ x: m.mins, y: m.acc / m.count }))
      
    if (pts.length < 2) return { points: pts, trend: [] }

    const n = pts.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    pts.forEach(p => { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumX2 += p.x * p.x })
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0
    const b = (sumY - m * sumX) / n

    const minX = Math.min(...pts.map(p => p.x))
    const maxX = Math.max(...pts.map(p => p.x))
    
    const trend = [
      { x: minX, y: m * minX + b },
      { x: maxX, y: m * maxX + b }
    ]
    return { points: pts, trend }
  }, [sessions, tests])

  const handleAiSummary = async (chap: any) => {
    const key = `${chap.subject}-${chap.chapter}`
    if (expandedSummary === key) {
      setExpandedSummary(null)
      return
    }
    setExpandedSummary(key)

    if (aiSummaries[key]) return // cached

    setLoadingSummaries(prev => ({ ...prev, [key]: true }))
    try {
      const sysPrompt = roastMode 
        ? "You are a brutal, sarcastic Hinglish exam coach. Roast the student for their terrible performance, but also sneak in actual useful advice."
        : "You are a concise exam coach for Indian competitive exams."
      
      const userPrompt = roastMode
        ? `Roast me in Hinglish. I scored ${Number(chap.accuracy).toFixed(0)}% accuracy in '${chap.chapter}' (${chap.subject}) after ${chap.attempts} attempts. Give me a 3-point sarcastic roast that also highlights what I'm doing wrong conceptually.`
        : `Give a 5-point revision summary for '${chap.chapter}' in '${chap.subject}' for ${chap.exam_code}. Format: numbered list, focus on key formulas, common mistakes, and high-yield concepts.`
        
      const res = await askGroq([{ role: 'user', content: userPrompt }], sysPrompt)
      setAiSummaries(prev => ({ ...prev, [key]: res }))
    } catch (err) {
      setAiSummaries(prev => ({ ...prev, [key]: 'Failed to load summary. Try again.' }))
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [key]: false }))
    }
  }

  // ==============================
  // SECTION 5: GitHub Heatmap
  // ==============================
  const heatmapData = useMemo(() => {
    const end = startOfDay(new Date())
    const start = subDays(end, 83) // 12 weeks * 7 days - 1
    const days = eachDayOfInterval({ start, end })
    
    const countMap: Record<string, number> = {}
    sessions.forEach(s => {
      const d = s.session_date
      countMap[d] = (countMap[d] || 0) + (s.duration_minutes || 0)
    })

    const grid: { date: string, mins: number }[][] = Array.from({ length: 12 }, () => [])
    days.forEach((day, i) => {
      const dStr = format(day, 'yyyy-MM-dd')
      const weekIdx = Math.floor(i / 7)
      if (weekIdx < 12) {
        grid[weekIdx].push({ date: dStr, mins: countMap[dStr] || 0 })
      }
    })
    return grid
  }, [sessions])

  const getColorClass = (mins: number) => {
    if (mins === 0) return 'bg-surface-2 border border-[rgba(255,255,255,0.02)]'
    if (mins <= 30) return 'bg-amber-500/30'
    if (mins <= 60) return 'bg-amber-500/60'
    return 'bg-amber-500'
  }

  return (
    <div className="space-y-8 pb-12 print:bg-white print:text-black print:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* ROAST MODE TOGGLE */}
          <Button 
            variant="ghost" 
            onClick={() => setRoastMode(!roastMode)}
            className={cn("px-4 py-2 border font-bold", roastMode ? "border-amber-500 text-amber-500 bg-amber-500/10" : "border-border text-muted hover:border-amber-500/50 hover:text-amber-500")}
          >
            🔥 Roast Mode {roastMode ? 'ON' : 'OFF'}
          </Button>

          {/* EXPORT PDF */}
          <Button 
            variant="ghost"
            onClick={() => window.print()}
            className="px-4 py-2 border border-border text-muted hover:text-white"
          >
            <Printer className="w-4 h-4 mr-2" /> Export PDF
          </Button>

          {/* TIME RANGE SELECTOR */}
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-full border border-border">
            {(['7D', '30D', '3M', 'All'] as TimeRange[]).map(tr => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors outline-none",
                  timeRange === tr ? "bg-primary text-black" : "text-muted hover:text-white"
                )}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: TRENDS */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">📈 Study & Performance Trends</h2>
        {loading ? (
          <SkeletonChart className="h-[200px] lg:h-[280px]" />
        ) : trendData.length === 0 ? (
          <EmptyState icon={Target} title="No data available" description={EMPTY_STATE_MESSAGES.no_analytics} />
        ) : (
          <div className="w-full h-[200px] lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141828', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar yAxisId="left" name="Study Mins" dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Line yAxisId="right" name="Avg Accuracy %" type="monotone" dataKey="avgAcc" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} animationDuration={1000} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SECTION 2: SUBJECT BREAKDOWN */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/3 bg-surface border border-border rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-2">Radar Analysis</h2>
          <p className="text-sm text-muted mb-4">Accuracy vs Time Spent</p>
          {loading ? (
            <SkeletonChart className="h-[280px]" />
          ) : subjectData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted">No subject data</div>
          ) : (
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={subjectData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Accuracy" dataKey="avgAcc" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} animationDuration={1000} />
                  <Radar name="Time (Norm)" dataKey="timeNormalized" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} animationDuration={1000} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="w-full lg:w-2/3 bg-surface border border-border rounded-2xl p-6 overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Subject Performance</h2>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5 text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Subject</th>
                  <th className="pb-3 text-center">Tests</th>
                  <th className="pb-3 text-center">Study Hrs</th>
                  <th className="pb-3 text-center">Avg Acc</th>
                  <th className="pb-3 text-right pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {subjectData.length === 0 && !loading && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted">No data available</td></tr>
                )}
                {subjectData.map((s, i) => {
                  const status = s.avgAcc > 70 ? 'Strong' : s.avgAcc < 50 ? 'Needs Work' : 'Okay'
                  const statusColor = status === 'Strong' ? 'bg-success/10 text-success border-success/20' : 
                                      status === 'Needs Work' ? 'bg-danger/10 text-danger border-danger/20' : 
                                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-surface-2 transition-colors">
                      <td className="py-4 pl-2 font-medium text-white">{s.fullSubject}</td>
                      <td className="py-4 text-center text-muted">{s.testCount}</td>
                      <td className="py-4 text-center text-muted">{(s.totalMinutes / 60).toFixed(1)}h</td>
                      <td className="py-4 text-center font-bold text-white">{s.avgAcc.toFixed(0)}%</td>
                      <td className="py-4 text-right pr-2">
                        <span className={cn("px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border", statusColor)}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2.5: TIME VS SCORE CORRELATION */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">🎯 Study Time vs Test Score Correlation</h2>
        {loading ? (
          <SkeletonChart className="h-[280px]" />
        ) : scatterData.points.length < 2 ? (
          <EmptyState icon={Target} title="More data needed" description="Complete more study sessions and tests on the same days to see correlation." />
        ) : (
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Study Minutes" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  label={{ value: 'Study Minutes', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Score (%)" 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#141828', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any, name: any) => [Number(value).toFixed(1), name === 'x' ? 'Minutes' : 'Score %']}
                />
                <Scatter name="Days" data={scatterData.points} fill="#6366f1" />
                <Line name="Trend" data={scatterData.trend} dataKey="y" type="monotone" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={false} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SECTION 5: GITHUB HEATMAP */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">🔥 Study Consistency</h2>
        <div className="w-full overflow-x-auto custom-scrollbar pb-2">
          <div className="flex gap-[3px] min-w-max">
            {heatmapData.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[3px]">
                {week.map((day, dIdx) => (
                  <motion.div
                    key={`${wIdx}-${dIdx}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: wIdx * 0.02, duration: 0.3 }}
                    className={cn("w-3 h-3 rounded-[2px] transition-colors hover:ring-1 hover:ring-white/50 cursor-pointer", getColorClass(day.mins))}
                    title={`${format(parseISO(day.date), 'MMM dd, yyyy')} — ${day.mins} mins studied`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted font-medium">
          <span>Less</span>
          <div className="flex gap-[3px]">
            {[0, 20, 45, 90].map((v, i) => <div key={i} className={cn("w-3 h-3 rounded-[2px]", getColorClass(v))} />)}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* SECTION 3: CHAPTER HEATMAP */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-white">🗺️ Chapter Performance Map</h2>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted hover:text-white cursor-pointer">
              <input type="checkbox" checked={showOnlyWeak} onChange={(e) => setShowOnlyWeak(e.target.checked)} className="rounded border-border bg-surface text-primary focus:ring-primary" />
              Show only weak chapters (&lt; 60%)
            </label>

            <div className="flex gap-2">
              {profile?.target_exams?.map(ex => (
                <button
                  key={ex}
                  onClick={() => setSelectedExamTab(ex)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors outline-none border",
                    selectedExamTab === ex ? "bg-primary/10 text-primary border-primary/30" : "bg-transparent text-muted border-transparent hover:text-white hover:bg-surface-2"
                  )}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {Object.keys(chapterGroups).length === 0 ? (
          <div className="py-8 text-center text-sm text-muted bg-surface-2 rounded-xl border border-dashed border-border">
            {showOnlyWeak ? "No weak chapters found! You are doing great." : `No chapter data recorded for ${selectedExamTab} yet.`}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(chapterGroups).map(([subject, chaps]) => (
              <div key={subject} className="space-y-3">
                <h3 className="text-sm font-bold text-muted uppercase tracking-wider pl-1 border-l-2 border-primary">{subject}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {chaps.map(c => {
                    const acc = Number(c.accuracy || 0)
                    const colorCls = c.attempts === 0 ? 'bg-surface-2 text-muted border-border' :
                                     acc > 70 ? 'bg-success/10 text-success border-success/30 hover:bg-success/20' :
                                     acc >= 40 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20' :
                                     'bg-danger/10 text-danger border-danger/30 hover:bg-danger/20'
                    return (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/doubts?chapter=${encodeURIComponent(c.chapter)}&subject=${encodeURIComponent(c.subject)}`)}
                        className={cn("px-3 py-2 rounded-lg border text-left flex flex-col justify-between h-20 transition-all outline-none group cursor-pointer relative overflow-hidden", colorCls)}
                        title={`Accuracy: ${acc.toFixed(0)}% | Attempts: ${c.attempts}. Click to ask a doubt.`}
                      >
                        <div className="text-xs font-bold truncate w-full z-10">{c.chapter}</div>
                        <div className="flex justify-between items-end w-full z-10 mt-2">
                          <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Doubts ↗</span>
                          {c.attempts > 0 ? (
                            <span className="text-sm font-black">{acc.toFixed(0)}%</span>
                          ) : (
                            <span className="text-xs italic opacity-60">Untested</span>
                          )}
                        </div>
                        {c.attempts > 0 && (
                          <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20" style={{ width: `${acc}%` }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: WEAK CHAPTERS DEEP DIVE */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">🔴 Chapters Needing Attention</h2>
        
        {weakChapters.length === 0 ? (
          <EmptyState icon={Sparkles} title="All chapters looking strong!" description="You don't have any chapters below 60% accuracy right now." />
        ) : (
          <StaggerContainer className="space-y-4">
            {weakChapters.map(c => {
              const key = `${c.subject}-${c.chapter}`
              const isExp = expandedSummary === key
              return (
                <StaggerItem key={c.id} className="bg-surface-2 border border-[rgba(255,255,255,0.05)] rounded-xl overflow-hidden card-hover">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-white mb-1">{c.chapter}</h3>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-muted px-2 py-0.5 rounded">{c.exam_code}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">{c.subject}</span>
                        </div>
                      </div>
                      <div className="w-full sm:w-48 text-right shrink-0">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-muted">{c.attempts} attempts</span>
                          <span className="text-danger">{Number(c.accuracy).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-danger/20 rounded-full overflow-hidden">
                          <div className="h-full bg-danger" style={{ width: `${c.accuracy}%` }} />
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      onClick={() => handleAiSummary(c)} 
                      className="w-full sm:w-auto h-8 px-4 text-xs border border-primary/20 text-primary hover:bg-primary/10"
                    >
                      AI Summary <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform", isExp && "rotate-180")} />
                    </Button>
                  </div>
                  
                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border bg-[#0a0c14]/50">
                        <div className="p-5 text-sm text-white/90 prose prose-invert max-w-none prose-p:leading-relaxed prose-li:marker:text-primary">
                          {loadingSummaries[key] ? (
                            <div className="flex items-center gap-2 text-primary"><Loader2 className="w-4 h-4 animate-spin"/> Generating strategic summary...</div>
                          ) : (
                            <ReactMarkdown>{aiSummaries[key]}</ReactMarkdown>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        )}
      </div>

      {/* Chapter Detail Modal */}
      <Modal isOpen={chapterModal.isOpen} onClose={() => setChapterModal({ isOpen: false, chapter: null })} className="w-full max-w-md p-6">
        {chapterModal.chapter && (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{chapterModal.chapter.chapter}</h3>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted bg-surface-2 px-2 py-1 rounded">{chapterModal.chapter.subject}</span>
              </div>
              <button onClick={() => setChapterModal({ isOpen: false, chapter: null })} className="text-muted hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-surface-2 p-4 rounded-xl border border-border text-center">
                <div className="text-2xl font-bold text-primary">{Number(chapterModal.chapter.accuracy || 0).toFixed(0)}%</div>
                <div className="text-xs text-muted uppercase font-semibold mt-1">Accuracy</div>
              </div>
              <div className="bg-surface-2 p-4 rounded-xl border border-border text-center">
                <div className="text-2xl font-bold text-white">{chapterModal.chapter.attempts}</div>
                <div className="text-xs text-muted uppercase font-semibold mt-1">Questions Done</div>
              </div>
            </div>

            <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex justify-between items-center text-success mb-2">
              <span className="text-sm font-semibold">Correct Answers</span>
              <span className="text-xl font-bold">{chapterModal.chapter.correct}</span>
            </div>
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex justify-between items-center text-danger">
              <span className="text-sm font-semibold">Incorrect Answers</span>
              <span className="text-xl font-bold">{chapterModal.chapter.attempts - chapterModal.chapter.correct}</span>
            </div>
          </>
        )}
      </Modal>

    </div>
  )
}
