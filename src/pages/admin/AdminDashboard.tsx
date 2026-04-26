import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, FileText, CheckCircle2, TrendingUp, ShieldAlert, Zap, Gift } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { StaggerContainer, StaggerItem } from '../../components/ui/StaggerReveal'

export function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, testsToday: 0, activeWeek: 0, doubts: 0 })
  const [rankUpdates, setRankUpdates] = useState<any[]>([])
  const [topReferrers, setTopReferrers] = useState<any[]>([])
  const [systemStatus, setSystemStatus] = useState<any>({ is_maintenance_mode: false, is_development_mode: false, last_updated_by: '' })
  const [rtConnected, setRtConnected] = useState(false)

  useEffect(() => {
    async function loadStats() {
      // Very crude approximations since complex queries need RPCs in Supabase, 
      // but for admin panel we can just do count fetches.
      const [{ count: cUsers }, { count: cTests }, { data: cSessions }, { count: cDoubts }, { data: sysData }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('mock_tests').select('*', { count: 'exact', head: true }).gte('taken_at', new Date().toISOString().split('T')[0]),
        supabase.from('study_sessions').select('user_id').gte('session_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('doubts').select('*', { count: 'exact', head: true }).eq('resolved', true),
        supabase.from('app_config').select('*').single()
      ])

      const uniqueActive = new Set((cSessions || []).map(s => s.user_id)).size

      setStats({
        users: cUsers || 0,
        testsToday: cTests || 0,
        activeWeek: uniqueActive,
        doubts: cDoubts || 0
      })
      if (sysData) setSystemStatus(sysData)

      // Fetch initial rank updates
      const { data: initRanks } = await supabase.from('rank_updates').select('*').order('created_at', { ascending: false }).limit(20)
      if (initRanks) setRankUpdates(initRanks)

      // Fetch top referrers
      const { data: referrers } = await supabase
        .from('profiles')
        .select('full_name, username, referral_count, email')
        .gt('referral_count', 0)
        .order('referral_count', { ascending: false })
        .limit(10)
      if (referrers) setTopReferrers(referrers)
    }
    loadStats()

    // Setup Realtime
    const channel = supabase.channel('admin-rank-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rank_updates' }, (payload) => {
        setRankUpdates(prev => [payload.new, ...prev].slice(0, 30))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRtConnected(true)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-8 pb-12">
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StaggerItem className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-primary/20"><Users className="w-12 h-12" /></div>
          <div className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Total Users</div>
          <div className="text-4xl font-black text-white">{stats.users}</div>
        </StaggerItem>
        <StaggerItem className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-emerald-500/20"><FileText className="w-12 h-12" /></div>
          <div className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Tests Today</div>
          <div className="text-4xl font-black text-white">{stats.testsToday}</div>
        </StaggerItem>
        <StaggerItem className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-indigo-500/20"><TrendingUp className="w-12 h-12" /></div>
          <div className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Active This Week</div>
          <div className="text-4xl font-black text-white">{stats.activeWeek}</div>
        </StaggerItem>
        <StaggerItem className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-pink-500/20"><CheckCircle2 className="w-12 h-12" /></div>
          <div className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Doubts Resolved</div>
          <div className="text-4xl font-black text-white">{stats.doubts}</div>
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Realtime Rank Updates */}
        <div className="bg-surface border border-border rounded-2xl flex flex-col h-[500px]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Live Rank Updates
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-surface-2 px-3 py-1 rounded-full">
              <div className={rtConnected ? "w-2 h-2 rounded-full bg-success" : "w-2 h-2 rounded-full bg-danger animate-pulse"} />
              {rtConnected ? 'Connected' : 'Connecting...'}
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence initial={false}>
              {rankUpdates.map((update, i) => {
                const improved = update.new_rank < update.old_rank
                return (
                  <motion.div
                    key={update.id || i}
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    className="mb-3 bg-[#0a0c14] border border-[rgba(255,255,255,0.02)] p-4 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-white mb-1">
                        <span className="text-primary">{update.user_name}</span> moved from #{update.old_rank} to #{update.new_rank}
                      </div>
                      <div className="text-xs text-muted font-medium">{update.reason || 'Manual adjustment'}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-black ${improved ? 'text-success' : 'text-danger'}`}>
                        {improved ? '🔺' : '🔻'} {Math.abs(update.old_rank - update.new_rank)}
                      </div>
                      <div className="text-[10px] text-muted uppercase mt-1">
                        {new Date(update.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {rankUpdates.length === 0 && <div className="text-center text-muted text-sm py-10">No recent rank updates</div>}
          </div>
        </div>

        {/* RIGHT: System Status */}
        <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 flex flex-col">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <ShieldAlert className="w-5 h-5 text-danger" /> System Status
          </h2>
          
          <div className="space-y-4 flex-1">
            <div className={`p-5 rounded-xl border ${systemStatus.is_maintenance_mode ? 'bg-danger/10 border-danger text-danger' : 'bg-surface-2 border-border text-white'}`}>
              <div className="font-bold text-lg mb-1">Maintenance Mode</div>
              <div className="text-sm opacity-80">{systemStatus.is_maintenance_mode ? 'ACTIVE: App is locked for users.' : 'Disabled: App is live.'}</div>
            </div>

            <div className={`p-5 rounded-xl border ${systemStatus.is_development_mode ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-surface-2 border-border text-white'}`}>
              <div className="font-bold text-lg mb-1">Development Mode</div>
              <div className="text-sm opacity-80">{systemStatus.is_development_mode ? 'ACTIVE: Experimental features enabled.' : 'Disabled: Production features only.'}</div>
            </div>
            
            <div className="p-5 rounded-xl border border-border bg-[#0a0c14]">
              <div className="font-bold text-sm text-muted uppercase tracking-wider mb-2">Last Configuration Update</div>
              <div className="text-sm font-semibold text-white">By: <span className="text-primary">{systemStatus.last_updated_by || 'System'}</span></div>
              <div className="text-xs text-muted mt-1">{systemStatus.updated_at ? new Date(systemStatus.updated_at).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Referrals Section */}
      <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <Gift className="w-6 h-6 text-primary" /> Top Referrers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topReferrers.map((ref, i) => (
            <div key={i} className="bg-[#0a0c14] border border-white/5 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{ref.full_name || ref.username}</div>
                  <div className="text-[10px] text-muted uppercase font-bold tracking-widest">{ref.email}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-primary">{ref.referral_count}</div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-widest">Referrals</div>
              </div>
            </div>
          ))}
          {topReferrers.length === 0 && <div className="col-span-full py-10 text-center text-muted font-medium">No referrals tracked yet.</div>}
        </div>
      </div>
    </div>
  )
}
