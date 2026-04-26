import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Clock, Target, Volume2, VolumeX, Shield, Sparkles, ChevronLeft, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'

export function FocusModePage() {
  const { profile, refreshProfile, awardXP } = useProfile()
  const { toast } = useToast()

  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 mins default
  const [initialTime, setInitialTime] = useState(25 * 60)
  const [subject, setSubject] = useState('')
  const [isSoundOn, setIsSoundOn] = useState(false)
  const [todayMinutes, setTodayMinutes] = useState(0)

  const timerRef = useRef<any>(null)

  useEffect(() => {
    fetchTodayStats()
  }, [profile])

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleComplete()
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isActive, timeLeft])

  const fetchTodayStats = async () => {
    if (!profile) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('study_sessions')
      .select('duration_minutes')
      .eq('user_id', profile.id)
      .eq('session_date', today)
    
    const total = (data || []).reduce((acc, curr) => acc + curr.duration_minutes, 0)
    setTodayMinutes(total)
  }

  const handleStart = () => {
    if (!subject) {
      toast({ type: 'error', title: 'Subject select karo pehle!', description: 'Bina goal ke focus kahan karoge?' })
      return
    }

    // Check limit for free users
    if (profile?.plan === 'eklavya' && todayMinutes >= 120) {
      toast({ 
        type: 'error', 
        title: 'Daily Limit Reached! 🚨', 
        description: 'Free users ke liye 2 ghante ka limit hai. Upgrade kar lo unlimited focus ke liye!' 
      })
      return
    }

    setIsActive(true)
  }

  const handleComplete = async () => {
    setIsActive(false)
    const minutesStudied = Math.floor((initialTime - timeLeft) / 60)
    
    if (minutesStudied < 1) {
      toast({ type: 'info', title: 'Session Short', description: 'At least 1 minute toh padho bhai!' })
      return
    }

    try {
      await supabase.from('study_sessions').insert({
        user_id: profile?.id,
        subject,
        duration_minutes: minutesStudied,
        mood: 'focused',
        session_date: new Date().toISOString().split('T')[0]
      })

      const xp = Math.floor(minutesStudied * 0.5) + 5
      if (awardXP) await awardXP(xp)
      
      toast({ 
        type: 'success', 
        title: 'Focus Session Complete! 🎯', 
        description: `Shabash! Aapne ${minutesStudied} mins focus kiya. +${xp} XP earned.` 
      })
      
      fetchTodayStats()
      refreshProfile()
      setTimeLeft(initialTime)
    } catch (err) {
      console.error(err)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const progress = ((initialTime - timeLeft) / initialTime) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            Focus Engine
          </h1>
          <p className="text-muted mt-2 text-lg font-medium">Distractions band, focus shuru. Zero background noise mode.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#0f1220] border border-white/5 rounded-2xl p-4">
          <div className="text-right">
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">Today's Focus</div>
            <div className="text-xl font-black text-white">{todayMinutes} <span className="text-xs text-muted">/ 120m</span></div>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timer View */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-[#0f1220] border border-white/5 rounded-[40px] p-12 md:p-20 relative overflow-hidden group">
          {/* Animated Background Pulse */}
          {isActive && (
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0 bg-primary/20 rounded-full blur-[120px] pointer-events-none"
            />
          )}

          <div className="relative z-10 flex flex-col items-center space-y-12">
            {/* Circular Timer */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="48%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <motion.circle 
                  cx="50%" cy="50%" r="48%" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  className="text-primary"
                  strokeDasharray="100"
                  strokeDashoffset={100 - progress}
                  style={{ pathLength: progress / 100 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl md:text-8xl font-black text-white tracking-tighter tabular-nums">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs font-black text-muted uppercase tracking-[0.2em] mt-2">
                  {isActive ? 'Deep Focus' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => { setIsActive(false); setTimeLeft(initialTime); }}
                className="p-4 bg-white/5 rounded-2xl text-muted hover:text-white hover:bg-white/10 transition-all"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
              <button 
                onClick={() => isActive ? setIsActive(false) : handleStart()}
                className="w-24 h-24 bg-primary text-black rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all"
              >
                {isActive ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current" />}
              </button>
              <button 
                onClick={() => setIsSoundOn(!isSoundOn)}
                className={cn(
                  "p-4 rounded-2xl transition-all",
                  isSoundOn ? "bg-primary/20 text-primary" : "bg-white/5 text-muted hover:text-white"
                )}
              >
                {isSoundOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="bg-[#0f1220] border border-white/5 rounded-3xl p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-black text-muted uppercase tracking-widest px-1">Session Goal</label>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="text" 
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  disabled={isActive}
                  placeholder="Kya padhna hai?" 
                  className="w-full bg-[#0a0c14] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-muted uppercase tracking-widest px-1">Timer Duration</label>
              <div className="grid grid-cols-2 gap-3">
                {[25, 45, 60, 90].map(m => (
                  <button
                    key={m}
                    onClick={() => { setInitialTime(m * 60); setTimeLeft(m * 60); }}
                    disabled={isActive}
                    className={cn(
                      "py-3 rounded-xl text-sm font-bold border transition-all",
                      initialTime === m * 60 ? "bg-primary border-primary text-black" : "bg-[#0a0c14] border-white/5 text-muted hover:border-white/20"
                    )}
                  >
                    {m} mins
                  </button>
                ))}
              </div>
            </div>

            {profile?.plan === 'eklavya' && (
              <div className="pt-6 border-t border-white/5">
                <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-widest mb-2">
                    <Sparkles className="w-3 h-3" /> Go Unlimited
                  </div>
                  <p className="text-xs text-muted font-medium leading-relaxed mb-4">
                    Upgrade to Arjuna to unlock 12+ hours focus sessions and high-quality ambient sounds.
                  </p>
                  <Link to="/billing" className="text-xs font-black text-white hover:underline flex items-center gap-1">
                    Upgrade Now <ChevronLeft className="w-3 h-3 rotate-180" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#0f1220] border border-white/5 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black text-muted uppercase tracking-widest">Active Streak</div>
              <div className="text-sm font-black text-white">{profile?.streak_days || 0} Days Running 🔥</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
