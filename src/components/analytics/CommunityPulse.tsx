import { useState, useEffect } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { supabase } from '../../lib/supabase'
import { Globe } from 'lucide-react'
import { cn } from '../../lib/utils'

export function CommunityPulse() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const { data: pulse } = await supabase.from('v_community_pulse').select('*')
    if (pulse) {
      // Map to difficulty score (failure / total)
      const formatted = pulse.map(p => ({
        name: p.test_name,
        difficulty: (p.high_failure_count / (p.total_attempts || 1)) * 100,
        success: (p.high_success_count / (p.total_attempts || 1)) * 100,
        total: p.total_attempts
      })).sort((a, b) => b.difficulty - a.difficulty)
      setData(formatted)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && data.length === 0) return null

  return (
    <div className="bg-[#0f1220] border border-white/5 rounded-[40px] p-8 lg:p-10 relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" /> Community Pulse
          </h2>
          <p className="text-xs font-black text-muted uppercase tracking-[0.2em]">National Difficulty Heatmap (Last 60 Mins)</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444] shadow-[0_0_10px_#ef4444]" />
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">High Failure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#06b6d4] shadow-[0_0_10px_#06b6d4]" />
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">High Success</span>
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 900 }}
              width={120}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a0c14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            />
            <Bar dataKey="difficulty" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.difficulty > 50 ? '#ef4444' : entry.difficulty > 20 ? '#f59e0b' : '#06b6d4'}
                  style={{ filter: `drop-shadow(0 0 8px ${entry.difficulty > 50 ? '#ef444488' : '#06b6d488'})` }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.slice(0, 4).map((test, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
            <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1 truncate">{test.name}</div>
            <div className={cn("text-xl font-black", test.difficulty > 50 ? "text-danger" : "text-primary")}>
              {test.total} Attempts
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
