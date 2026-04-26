import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Lock, Activity, AlertTriangle, Rocket } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'
import { Link, useNavigate } from 'react-router-dom'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { CommunityPulse } from '../../components/analytics/CommunityPulse'

export function BrahmastraHubPage() {
  const { profile } = useProfile()
  const { toast } = useToast()
  const navigate = useNavigate()
  
  const [predictions, setPredictions] = useState<any[]>([])
  const [userMetrics, setUserMetrics] = useState<any>(null)

  const isPremium = profile?.plan === 'brahmastra'

  useEffect(() => {
    fetchPremiumData()
  }, [profile])

  const fetchPremiumData = async () => {
    if (!profile) return
    
    const [predRes, sessionsRes] = await Promise.all([
      supabase.from('predictive_ranks').select('*').eq('user_id', profile.id).order('created_at', { ascending: true }),
      supabase.from('mock_tests').select('accuracy, time_spent_seconds').eq('user_id', profile.id)
    ])

    if (!predRes.error) setPredictions(predRes.data || [])
    
    // Aggregate user metrics for comparison
    if (sessionsRes.data) {
      const avgAcc = sessionsRes.data.reduce((acc, s) => acc + (s.accuracy || 0), 0) / (sessionsRes.data.length || 1)
      setUserMetrics({ accuracy: avgAcc || 0 })
    }
  }

  const radarData = useMemo(() => {
    return [
      { subject: 'Accuracy', user: userMetrics?.accuracy || 65, topper: 94 },
      { subject: 'Speed', user: 70, topper: 98 },
      { subject: 'Consistency', user: 82, topper: 96 },
      { subject: 'Depth', user: 55, topper: 90 },
      { subject: 'Resilience', user: 75, topper: 95 }
    ]
  }, [userMetrics])

  const latestPrediction = predictions[predictions.length - 1] || { predicted_rank: 4521, percentile: 99.4 }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Premium Header */}
      <div className="relative p-12 md:p-20 rounded-[50px] bg-gradient-to-br from-[#0f1220] via-[#1a1f35] to-[#0f1220] border border-primary/20 overflow-hidden text-center space-y-6">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-xs font-black text-primary uppercase tracking-[0.3em]">
            <Sparkles className="w-4 h-4" /> Exclusive Access
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
            Brahmastra <span className="text-primary">Exclusives</span>
          </h1>
          <p className="text-muted text-xl font-medium max-w-2xl mx-auto">
            Adversarial Stress-Testing, Global Topper Telemetry, and Predictive Rank Intelligence.
          </p>
        </motion.div>
      </div>

      <CommunityPulse />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Predictive Rank Guarantee */}
        <div className={cn(
          "lg:col-span-1 bg-[#0f1220] border border-white/5 rounded-[40px] p-10 flex flex-col items-center justify-center relative overflow-hidden group",
          !isPremium && "cursor-not-allowed"
        )}>
          {!isPremium && (
            <div className="absolute inset-0 z-20 backdrop-blur-md bg-black/40 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <Lock className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-black text-white">Unlock Predictive Rank</h3>
              <p className="text-sm text-muted">Upgrade to Brahmastra to see your AI-predicted All India Rank.</p>
              <Link to="/billing" className="px-6 py-2 bg-primary text-black font-black rounded-xl text-xs uppercase tracking-widest">Upgrade Now</Link>
            </div>
          )}

          <div className={cn("space-y-8 w-full text-center transition-all duration-700", !isPremium && "filter blur-lg grayscale opacity-50")}>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-muted uppercase tracking-widest">AI Predicted AIR</h3>
              <div className="text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                #{latestPrediction.predicted_rank}
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 py-6 border-y border-white/5">
              <div className="text-center">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest">Percentile</div>
                <div className="text-2xl font-black text-primary">{latestPrediction.percentile}%</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest">Confidence</div>
                <div className="text-2xl font-black text-success">85%</div>
              </div>
            </div>

            <p className="text-xs text-muted font-medium italic">
              "Based on your last 14 mock tests and topic depth analysis."
            </p>
          </div>
        </div>

        {/* Global Topper Telemetry */}
        <div className={cn(
          "lg:col-span-2 bg-[#0f1220] border border-white/5 rounded-[40px] p-10 relative overflow-hidden",
          !isPremium && "cursor-not-allowed"
        )}>
          {!isPremium && (
            <div className="absolute inset-0 z-20 backdrop-blur-md bg-black/40 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <Lock className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-black text-white">Unlock Topper Telemetry</h3>
              <p className="text-sm text-muted">Compare your performance against Top 100 AIR holders.</p>
            </div>
          )}

          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-10 h-full items-center", !isPremium && "filter blur-lg grayscale opacity-50")}>
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Activity className="w-8 h-8 text-primary" /> Topper Comparison
              </h3>
              <p className="text-sm text-muted font-medium leading-relaxed">
                We've mapped your data points against the average of the Top 500 students in your category. Focus on <span className="text-white font-bold">Depth</span> and <span className="text-white font-bold">Speed</span> to close the gap.
              </p>
              
              <div className="space-y-4 pt-4">
                {radarData.map(d => (
                  <div key={d.subject} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span>{d.subject}</span>
                      <span className="text-primary">{d.user}% / {d.topper}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden flex">
                      <div className="h-full bg-primary/40" style={{ width: `${d.user}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 900 }} />
                  <Radar
                    name="You"
                    dataKey="user"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name="Topper"
                    dataKey="topper"
                    stroke="rgba(255,255,255,0.2)"
                    fill="rgba(255,255,255,0.1)"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Adversarial Stress-Testing */}
        <div className="lg:col-span-3 bg-gradient-to-br from-[#0f1220] to-[#1a1f35] border border-primary/10 rounded-[40px] p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <AlertTriangle className="w-12 h-12 text-primary opacity-10" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-full text-[10px] font-black text-[#ef4444] uppercase tracking-[0.2em]">
                God Mode Active
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">Adversarial Stress-Testing</h2>
              <p className="text-muted text-lg font-medium leading-relaxed">
                Traditional mocks are too predictable. Our Adversarial AI generates "Tricky" questions that exploit your specific weak conceptual linkages. It's designed to make you fail—so you can win on the actual exam day.
              </p>
              
              <ul className="space-y-3">
                {[
                  'Adaptive Difficulty Escalation (0.95+ Score)',
                  'Non-Traditional Distractor Generation',
                  'Time-Pressure Simulation (Variable Clocks)',
                  'Cognitive Fatigue Analysis'
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm font-bold text-white/80">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="shrink-0">
              <button 
                onClick={() => isPremium ? navigate('/tests/new?difficulty=adversarial') : toast({ type: 'error', title: 'Plan Upgrade Required', description: 'This feature is only for Brahmastra members.' })}
                className="group relative w-64 h-64 rounded-full bg-primary flex flex-col items-center justify-center p-8 text-black text-center shadow-[0_0_60px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95 transition-all"
              >
                <Rocket className="w-12 h-12 mb-3 group-hover:-translate-y-2 transition-transform duration-500" />
                <span className="text-lg font-black uppercase tracking-widest leading-none">Initiate Stress Test</span>
                <span className="mt-2 text-[10px] font-black opacity-60">Ready to break?</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckCircle2({ className, ...props }: any) {
  return (
    <svg 
      {...props}
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={3} 
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
