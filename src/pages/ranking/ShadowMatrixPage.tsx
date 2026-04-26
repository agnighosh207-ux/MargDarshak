import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Users, Target, TrendingUp, Zap, Sparkles, ChevronRight, Loader2, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { cn } from '../../lib/utils'
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts'

export function ShadowMatrixPage() {
  const { profile } = useProfile()
  
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'GLOBAL' | 'EXAM'>('GLOBAL')
  const [selectedExam, setSelectedExam] = useState('')

  useEffect(() => {
    if (profile?.target_exams?.[0]) {
      setSelectedExam(profile.target_exams[0])
    }
  }, [profile])

  useEffect(() => {
    fetchLeaderboard()
  }, [filter, selectedExam])

  const fetchLeaderboard = async () => {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('id, full_name, total_xp, target_exams, avatar_url, role')
      .order('total_xp', { ascending: false })
      .limit(50)

    if (filter === 'EXAM' && selectedExam) {
      query = query.contains('target_exams', [selectedExam])
    }

    const { data, error } = await query
    
    if (!error) setLeaderboard(data || [])
    setLoading(false)
  }

  // Calculate stats for the current user
  const userRank = useMemo(() => {
    if (!profile) return 0
    return leaderboard.findIndex(u => u.id === profile.id) + 1
  }, [leaderboard, profile])

  const matrixData = useMemo(() => {
    // Simulate some matrix data based on leaderboard for visualization
    return leaderboard.map((u) => ({
      name: u.full_name,
      xp: u.total_xp,
      accuracy: 60 + Math.random() * 35, // Simulated for the matrix
      size: u.id === profile?.id ? 100 : 40,
      isUser: u.id === profile?.id
    }))
  }, [leaderboard, profile])

  const getRankTitle = (xp: number) => {
    if (xp > 10000) return 'Brahmastra Legend'
    if (xp > 5000) return 'Dronacharya Elite'
    if (xp > 2000) return 'Arjuna Warrior'
    return 'Eklavya Novice'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-primary" />
            Shadow Matrix
          </h1>
          <p className="text-muted font-medium text-lg">Real-time competitive positioning and global leaderboard.</p>
        </div>

        <div className="flex items-center gap-1 bg-[#0f1220] border border-white/5 p-1 rounded-2xl">
          <button 
            onClick={() => setFilter('GLOBAL')}
            className={cn("px-6 py-2.5 rounded-xl text-sm font-black transition-all", filter === 'GLOBAL' ? "bg-primary text-black" : "text-muted hover:text-white")}
          >
            <div className="w-4 h-4 inline-block mr-2" /> Global
          </button>
          <button 
            onClick={() => setFilter('EXAM')}
            className={cn("px-6 py-2.5 rounded-xl text-sm font-black transition-all", filter === 'EXAM' ? "bg-primary text-black" : "text-muted hover:text-white")}
          >
            <Target className="w-4 h-4 inline-block mr-2" /> {selectedExam || 'Exam'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Matrix */}
        <div className="lg:col-span-2 space-y-8">
          {/* User Rank Card */}
          <div className="bg-gradient-to-br from-primary/20 to-amber-600/5 border border-primary/30 rounded-[40px] p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Your Status</div>
                <div className="text-3xl font-black text-white">{getRankTitle(profile?.total_xp || 0)}</div>
                <div className="flex items-center gap-2 text-muted text-sm font-bold">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Top 5% Globally
                </div>
              </div>

              <div className="text-center md:border-x border-white/10 px-8">
                <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Total Shadow XP</div>
                <div className="text-5xl font-black text-white tracking-tighter">
                  {profile?.total_xp || 0}
                </div>
              </div>

              <div className="text-right flex flex-col justify-center">
                <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Matrix Rank</div>
                <div className="text-4xl font-black text-white">#{userRank || '—'}</div>
              </div>
            </div>
          </div>

          {/* Matrix Visualization */}
          <div className="bg-[#0f1220] border border-white/5 rounded-[40px] p-8 md:p-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" /> Performance Matrix
              </h3>
              <div className="text-xs text-muted font-bold uppercase tracking-widest">Accuracy vs Consistency</div>
            </div>

            <div className="w-full h-[400px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis 
                    type="number" 
                    dataKey="xp" 
                    name="XP" 
                    hide 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="accuracy" 
                    name="Accuracy" 
                    domain={[0, 100]}
                    hide
                  />
                  <ZAxis type="number" dataKey="size" range={[50, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0a0c14] border border-white/10 p-4 rounded-2xl shadow-2xl">
                            <div className="text-sm font-black text-white mb-1">{data.name}</div>
                            <div className="text-xs font-bold text-primary">{data.xp} XP</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Users" data={matrixData}>
                    {matrixData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isUser ? '#f59e0b' : 'rgba(255,255,255,0.1)'} 
                        stroke={entry.isUser ? '#f59e0b' : 'rgba(255,255,255,0.05)'}
                        strokeWidth={entry.isUser ? 4 : 1}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              
              {/* Labels for Matrix */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none border border-white/5 rounded-xl">
                <div className="absolute top-4 left-4 text-[10px] font-black text-muted uppercase tracking-widest">High Accuracy</div>
                <div className="absolute bottom-4 left-4 text-[10px] font-black text-muted uppercase tracking-widest">Low Consistency</div>
                <div className="absolute bottom-4 right-4 text-[10px] font-black text-muted uppercase tracking-widest">High Consistency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="lg:col-span-1 bg-[#0f1220] border border-white/5 rounded-[40px] overflow-hidden flex flex-col h-full max-h-[900px]">
          <div className="p-8 border-b border-white/5 bg-white/2 flex items-center justify-between">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-500" /> Leaderboard
            </h3>
            <Users className="w-5 h-5 text-muted" />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-20 text-center text-muted">No data found.</div>
            ) : (
              leaderboard.map((u, i) => {
                const isUser = u.id === profile?.id
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all border",
                      isUser ? "bg-primary/10 border-primary/30" : "bg-white/2 border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                      i === 0 ? "bg-amber-500 text-black" : 
                      i === 1 ? "bg-slate-300 text-black" : 
                      i === 2 ? "bg-amber-700 text-white" : "text-muted"
                    )}>
                      {i + 1}
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-surface-2 border border-white/5 flex items-center justify-center text-sm font-black text-white overflow-hidden">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        u.full_name?.charAt(0) || 'U'
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-white truncate flex items-center gap-2">
                        {u.full_name}
                        {u.role === 'admin' && <Sparkles className="w-3 h-3 text-primary" />}
                      </div>
                      <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{getRankTitle(u.total_xp)}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-white">{u.total_xp}</div>
                      <div className="text-[10px] font-bold text-muted uppercase tracking-widest">XP</div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>

          <div className="p-6 bg-primary/5 border-t border-white/5 text-center">
            <button className="text-xs font-black text-primary uppercase tracking-[0.2em] hover:underline flex items-center justify-center gap-2 mx-auto">
              View Your Full History <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
