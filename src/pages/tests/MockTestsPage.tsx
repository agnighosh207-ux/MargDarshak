import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Clock, Play, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { MagneticButton } from '../../components/ui/MagneticButton'
import { Button } from '../../components/ui/Button'
import { StaggerContainer, StaggerItem } from '../../components/ui/StaggerReveal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ScoreGauge } from '../../components/ui/ScoreGauge'
import { cn } from '../../lib/utils'
import { EMPTY_STATE_MESSAGES } from '../../lib/hinglish'

export function MockTestsPage() {
  const { profile } = useProfile()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<any[]>([])
  const [filter, setFilter] = useState<'All' | 'Completed' | 'In Progress' | 'Pending'>('All')

  useEffect(() => {
    async function fetchTests() {
      if (!profile) return
      setLoading(true)
      const { data, error } = await supabase
        .from('mock_tests')
        .select('*')
        .eq('user_id', profile.id)
        .order('taken_at', { ascending: false })
      
      if (!error && data) {
        setTests(data)
      }
      setLoading(false)
    }
    fetchTests()
  }, [profile])

  const filteredTests = tests.filter(t => {
    if (filter === 'All') return true
    if (filter === 'Completed') return t.status === 'completed'
    if (filter === 'In Progress') return t.status === 'in_progress'
    if (filter === 'Pending') return t.status === 'pending'
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Mock Tests</h1>
        <MagneticButton>
          <Button onClick={() => navigate('/tests/new')} className="shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            ⚡ Generate Test
          </Button>
        </MagneticButton>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {['All', 'Completed', 'In Progress', 'Pending'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "relative px-5 py-2 rounded-full text-sm font-medium transition-all outline-none",
              filter === f ? "text-primary" : "text-muted hover:text-white bg-surface-2"
            )}
          >
            {filter === f && (
              <motion.div
                layoutId="test-filter-tab"
                className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{f}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StaggerItem><SkeletonCard /></StaggerItem>
          <StaggerItem><SkeletonCard /></StaggerItem>
          <StaggerItem><SkeletonCard /></StaggerItem>
        </StaggerContainer>
      ) : filteredTests.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title="No tests found" 
          description={filter === 'All' ? EMPTY_STATE_MESSAGES.no_tests : `No tests in ${filter} state.`} 
          actionLabel={filter === 'All' ? "Generate First Test" : undefined}
          onAction={filter === 'All' ? () => navigate('/tests/new') : undefined}
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTests.map((test) => (
              <StaggerItem key={test.id} className="bg-surface border border-border rounded-xl p-5 card-hover flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                    {test.exam_code}
                  </span>
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border",
                    test.status === 'completed' ? "bg-success/10 text-success border-success/20" :
                    test.status === 'in_progress' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    "bg-muted/10 text-muted border-border"
                  )}>
                    {test.status.replace('_', ' ')}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1" title={test.test_name}>{test.test_name}</h3>
                <p className="text-sm text-muted mb-4 line-clamp-1">{test.subject} • {test.topic}</p>

                <div className="flex-1" />

                {test.status === 'completed' ? (
                  <div className="flex items-center gap-4 mb-4 bg-surface-2 rounded-xl p-3 border border-white/5">
                    <div className="w-10 h-10 flex-shrink-0">
                      <ScoreGauge score={Number(test.score || 0)} size={40} label="" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-medium text-muted mb-1">
                        <span>Accuracy</span>
                        <span>{Number(test.accuracy || 0).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full", test.accuracy > 75 ? "bg-success" : test.accuracy > 50 ? "bg-primary" : "bg-danger")} 
                          style={{ width: `${test.accuracy}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 mb-4 text-xs font-medium text-muted">
                    <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {test.questions.length} Qs</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {test.questions.length * 2.5} mins</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[rgba(255,255,255,0.05)]">
                  <span className="text-xs text-muted">
                    {formatDistanceToNow(new Date(test.taken_at), { addSuffix: true })}
                  </span>
                  
                  {test.status === 'completed' ? (
                    <Button variant="outline" className="h-8 px-4 text-xs" onClick={() => navigate(`/tests/${test.id}/result`)}>
                      Review <RotateCcw className="w-3 h-3 ml-1" />
                    </Button>
                  ) : test.status === 'in_progress' ? (
                    <Button variant="primary" className="h-8 px-4 text-xs" onClick={() => navigate(`/tests/${test.id}`)}>
                      Continue <Play className="w-3 h-3 ml-1" />
                    </Button>
                  ) : (
                    <Button variant="primary" className="h-8 px-4 text-xs" onClick={() => navigate(`/tests/${test.id}`)}>
                      Start <Play className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </StaggerItem>
            ))}
          </AnimatePresence>
        </StaggerContainer>
      )}
    </div>
  )
}
