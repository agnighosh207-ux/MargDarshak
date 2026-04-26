import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'
import { supabase } from '../../lib/supabase'
import { Loader2, TrendingDown, Target, Activity } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '../../components/ui/StaggerReveal'

export function TestAnalytics() {
  const [loading, setLoading] = useState(true)
  
  const [topTopics, setTopTopics] = useState<any[]>([])
  const [avgAccuracy, setAvgAccuracy] = useState<any[]>([])
  const [dailyVolume, setDailyVolume] = useState<any[]>([])
  const [strugglingUsers, setStrugglingUsers] = useState<any[]>([])

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      
      // 1. Top Generated Topics (Simulated aggregation via count queries since no direct RPC)
      // For a real app, this would be an RPC. Here we'll mock some data based on typical structures
      setTopTopics([
        { topic: 'Kinematics', count: 145 },
        { topic: 'Thermodynamics', count: 120 },
        { topic: 'Organic Chemistry', count: 98 },
        { topic: 'Calculus', count: 85 },
        { topic: 'Optics', count: 72 },
      ])

      // 2. Average Accuracy by Subject
      setAvgAccuracy([
        { exam: 'JEE Main', subject: 'Physics', accuracy: 68, tests: 450 },
        { exam: 'JEE Main', subject: 'Chemistry', accuracy: 74, tests: 480 },
        { exam: 'JEE Main', subject: 'Math', accuracy: 52, tests: 410 },
        { exam: 'NEET UG', subject: 'Biology', accuracy: 81, tests: 620 },
        { exam: 'NEET UG', subject: 'Physics', accuracy: 48, tests: 390 },
      ])

      // 3. Daily Test Volume (Last 30 days mock)
      const volumeData = Array.from({length: 30}).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (29 - i))
        return {
          date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          tests: Math.floor(Math.random() * 100) + 20,
          users: Math.floor(Math.random() * 50) + 10
        }
      })
      setDailyVolume(volumeData)

      // 4. Struggling Users (Fetch from mock_tests where score < 40)
      const { data } = await supabase.from('mock_tests')
        .select('user_id, score')
        .lt('score', 40)
        .order('taken_at', { ascending: false })
        .limit(20)
        
      // De-duplicate users manually for demo
      if (data) {
        const unique = Array.from(new Set(data.map(d => d.user_id))).slice(0, 5)
        const usersInfo = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', unique)
        if (usersInfo.data) {
          const combined = usersInfo.data.map(u => ({
            ...u, 
            avgAccuracy: Math.floor(Math.random() * 20) + 20 // Simulated avg
          }))
          setStrugglingUsers(combined)
        }
      }

      setLoading(false)
    }
    
    fetchAnalytics()
  }, [])

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: Top Topics */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-primary" /> Top Generated Topics
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTopics} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" hide />
                <YAxis dataKey="topic" type="category" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} width={120} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{ backgroundColor: '#0a0c14', borderColor: '#27272a', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 2: Daily Test Volume */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-indigo-500" /> Daily Test Volume
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0c14', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="tests" stroke="#6366f1" strokeWidth={3} dot={false} name="Total Tests" />
                <Line type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} dot={false} name="Unique Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 3: Avg Accuracy by Subject */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Platform Accuracy by Subject</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0a0c14] text-muted uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Exam</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Tests Taken</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Avg Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {avgAccuracy.map((item, i) => (
                  <tr key={i} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{item.exam}</td>
                    <td className="px-4 py-3 text-muted">{item.subject}</td>
                    <td className="px-4 py-3 text-muted font-mono">{item.tests}</td>
                    <td className="px-4 py-3 text-right font-black">
                      <span className={item.accuracy > 70 ? 'text-success' : item.accuracy > 50 ? 'text-primary' : 'text-danger'}>
                        {item.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: Struggling Users */}
        <div className="bg-[#1a0f14] border border-danger/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-danger/10 blur-[50px] pointer-events-none" />
          <h2 className="text-lg font-bold text-danger flex items-center gap-2 mb-6 relative z-10">
            <TrendingDown className="w-5 h-5" /> Struggling Users (&lt; 40% Accuracy)
          </h2>
          
          <StaggerContainer className="space-y-3 relative z-10">
            {strugglingUsers.length === 0 ? <p className="text-sm text-muted">No struggling users found this week.</p> : 
             strugglingUsers.map(user => (
               <StaggerItem key={user.id} className="bg-[#0a0c14]/80 border border-danger/20 p-3 rounded-xl flex items-center justify-between group hover:border-danger/50 transition-colors">
                 <div className="flex items-center gap-3">
                   <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=random`} alt="" className="w-8 h-8 rounded-full border border-danger/30" />
                   <div>
                     <div className="font-bold text-white text-sm">{user.full_name}</div>
                     <div className="text-xs text-danger font-semibold">{user.avgAccuracy}% Avg Accuracy</div>
                   </div>
                 </div>
                 <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-danger bg-danger/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger hover:text-white border border-danger/20">
                   Reach Out
                 </button>
               </StaggerItem>
             ))
            }
          </StaggerContainer>
        </div>

      </div>
    </div>
  )
}
