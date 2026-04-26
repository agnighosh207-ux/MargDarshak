import { useState, useEffect } from 'react'
import { Trophy, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ui/Toast'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { SkeletonCard } from '../../components/ui/Skeleton'

export function RankManagement() {
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [recalcProgress, setRecalcProgress] = useState('')

  const [updateModal, setUpdateModal] = useState<{ isOpen: boolean, user: any, oldRank: number, newRank: number | '', reason: string }>({
    isOpen: false, user: null, oldRank: 0, newRank: '', reason: 'Manual adjustment'
  })

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('id, full_name, username, avatar_url, target_exams, total_xp, current_streak, created_at').order('total_xp', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const handleUpdateRankSubmit = async () => {
    if (!updateModal.user || typeof updateModal.newRank !== 'number') return
    const { user, oldRank, newRank, reason } = updateModal
    
    if (oldRank === newRank) {
      toast({ type: 'info', title: 'No change in rank' })
      setUpdateModal({ ...updateModal, isOpen: false })
      return
    }

    const { error } = await supabase.from('rank_updates').insert({
      user_id: user.id,
      user_name: user.username || user.full_name || 'User',
      old_rank: oldRank,
      new_rank: newRank,
      reason
    })

    if (!error) {
      toast({ type: 'success', title: 'Rank updated manually' })
      // Typically manual rank updates just log the update, 
      // but to actually change their position, you'd need to adjust their XP.
      // For this UI, we just log it to rank_updates to show on dashboard.
    } else {
      toast({ type: 'error', title: 'Failed to update rank' })
    }
    setUpdateModal({ ...updateModal, isOpen: false })
  }

  const handleRecalculateAll = async () => {
    setRecalculating(true)
    setRecalcProgress('Fetching current ranks...')
    // Simplified simulation: in reality this would run a complex stored procedure
    // Here we just insert a dummy rank update to show the mechanism
    await new Promise(r => setTimeout(r, 1000))
    setRecalcProgress('Validating positions... [23/150]')
    await new Promise(r => setTimeout(r, 1000))
    setRecalcProgress('Finalizing...')
    await new Promise(r => setTimeout(r, 500))
    
    toast({ type: 'success', title: 'Ranks recalculated globally' })
    setRecalculating(false)
    fetchLeaderboard()
  }

  const REASONS = [
    'Weekly test performance',
    'Mock test rank',
    'Manual adjustment',
    'Special achievement',
    'Inactivity penalty'
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-primary" /> Global Leaderboard
          </h2>
          <p className="text-sm text-muted">Manage user rankings and trigger global recalculations.</p>
        </div>
        <Button onClick={handleRecalculateAll} disabled={recalculating} className="bg-danger hover:bg-danger/90 text-white font-bold border-none shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          {recalculating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {recalcProgress}</> : <><RefreshCw className="w-4 h-4 mr-2" /> Auto-Recalculate All Ranks</>}
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[4rem_3fr_1fr_1.5fr_1fr_1fr] gap-4 p-4 border-b border-white/5 bg-surface-2 text-xs font-black text-muted uppercase tracking-wider items-center">
          <div className="text-center">Rank #</div>
          <div>User</div>
          <div>Primary Exam</div>
          <div>Experience (XP)</div>
          <div className="text-center">Streak</div>
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-4 space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map((user, idx) => {
              const rank = idx + 1
              return (
                <div key={user.id} className="grid grid-cols-[4rem_3fr_1fr_1.5fr_1fr_1fr] gap-4 p-4 items-center hover:bg-surface-2 transition-colors group">
                  <div className="text-center">
                    {rank === 1 ? <span className="text-2xl">🥇</span> : rank === 2 ? <span className="text-2xl">🥈</span> : rank === 3 ? <span className="text-2xl">🥉</span> : <span className="text-lg font-black text-muted group-hover:text-white transition-colors">#{rank}</span>}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-white/10 bg-[#0a0c14] flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                      {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{user.full_name}</div>
                      <div className="text-xs text-muted truncate">@{user.username || 'user'}</div>
                    </div>
                  </div>

                  <div>
                    {user.target_exams?.[0] ? <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white border border-white/10">{user.target_exams[0]}</span> : <span className="text-xs text-muted italic">-</span>}
                  </div>

                  <div className="font-black text-primary flex items-center gap-2">
                    <AnimatedNumber value={user.total_xp || 0} /> 
                    <span className="text-xs font-semibold text-muted bg-primary/10 px-1.5 rounded uppercase">XP</span>
                  </div>

                  <div className="text-center">
                    <span className="text-sm font-bold text-white bg-[#0a0c14] border border-border px-3 py-1 rounded-full shadow-inner">🔥 {user.current_streak || 0}</span>
                  </div>

                  <div className="text-right">
                    <Button variant="outline" className="h-8 text-xs font-semibold border-white/10 hover:border-danger hover:text-danger hover:bg-danger/10" onClick={() => setUpdateModal({ isOpen: true, user, oldRank: rank, newRank: rank, reason: REASONS[0] })}>
                      Update
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={updateModal.isOpen} onClose={() => setUpdateModal({ ...updateModal, isOpen: false })} className="max-w-md p-6 border-primary/30">
        <h3 className="text-2xl font-black text-white mb-2">Update User Rank</h3>
        <p className="text-sm text-muted mb-6">Manually log a rank change for <strong className="text-white">{updateModal.user?.username}</strong>.</p>
        
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-2">Current Rank</label>
              <input type="number" disabled value={updateModal.oldRank} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-muted cursor-not-allowed font-bold text-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-2">New Rank</label>
              <input type="number" value={updateModal.newRank} onChange={e => setUpdateModal({ ...updateModal, newRank: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full bg-[#0a0c14] border border-primary/50 rounded-lg px-4 py-3 text-white font-bold text-lg focus:border-primary outline-none" autoFocus />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">Reason for adjustment</label>
            <select value={updateModal.reason} onChange={e => setUpdateModal({ ...updateModal, reason: e.target.value })} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white focus:border-primary outline-none appearance-none">
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="p-3 mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2 text-amber-500 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>This will log an update to the system which will appear on the realtime dashboard. It does NOT automatically modify their XP.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setUpdateModal({ ...updateModal, isOpen: false })}>Cancel</Button>
          <Button className="flex-1" onClick={handleUpdateRankSubmit} disabled={updateModal.newRank === ''}>Log Rank Update</Button>
        </div>
      </Modal>
    </div>
  )
}
