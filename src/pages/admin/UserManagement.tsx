import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, ShieldAlert, Loader2, UserX } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ui/Toast'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { cn } from '../../lib/utils'

export function UserManagement() {
  const { toast } = useToast()
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('total_xp')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [userStats, setUserStats] = useState<Record<string, any>>({})
  
  const [adminModal, setAdminModal] = useState<{ isOpen: boolean, user: any, newStatus: boolean }>({ isOpen: false, user: null, newStatus: false })

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      let query = supabase.from('profiles').select('*')
      
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`)
      }
      
      query = query.order(sortBy, { ascending: false }).limit(50)
      
      const { data } = await query
      setUsers(data || [])
      setLoading(false)
    }
    
    const debounce = setTimeout(fetchUsers, 300)
    return () => clearTimeout(debounce)
  }, [search, sortBy])

  const toggleExpand = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null)
      return
    }
    setExpandedUser(userId)
    
    if (!userStats[userId]) {
      const [tests, sessions] = await Promise.all([
        supabase.from('mock_tests').select('test_name, score, taken_at').eq('user_id', userId).order('taken_at', { ascending: false }).limit(5),
        supabase.from('study_sessions').select('duration_minutes').eq('user_id', userId).gte('session_date', new Date(Date.now() - 7 * 86400000).toISOString())
      ])
      
      const weeklyMinutes = sessions.data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0
      setUserStats(prev => ({ ...prev, [userId]: { tests: tests.data || [], weeklyHours: (weeklyMinutes / 60).toFixed(1) } }))
    }
  }

  const handleAdminToggle = async () => {
    const { user, newStatus } = adminModal
    const { error } = await supabase.from('profiles').update({ is_admin: newStatus }).eq('id', user.id)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: newStatus } : u))
      toast({ type: 'success', title: `Admin privileges ${newStatus ? 'granted' : 'revoked'}` })
    } else {
      toast({ type: 'error', title: 'Failed to update privileges' })
    }
    setAdminModal({ isOpen: false, user: null, newStatus: false })
  }

  return (
    <div className="space-y-6">
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border rounded-2xl p-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text" placeholder="Search users by name or username..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0a0c14] border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-danger outline-none transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-semibold text-muted">Sort by:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-[#0a0c14] border border-border rounded-lg px-3 py-2 text-sm font-bold text-white outline-none focus:border-danger">
            <option value="total_xp">Total XP</option>
            <option value="created_at">Joined Date</option>
            <option value="current_streak">Current Streak</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-[3rem_2fr_1fr_1fr_1fr_1fr] gap-4 p-4 border-b border-white/5 bg-surface-2 text-xs font-black text-muted uppercase tracking-wider">
          <div className="text-center">#</div>
          <div>User</div>
          <div>Exams</div>
          <div>Stats</div>
          <div className="text-center">Admin Status</div>
          <div className="text-right">Joined</div>
        </div>

        {loading ? (
          <div className="p-4 space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-muted">
            <UserX className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-white mb-1">No users found</h3>
            <p className="text-sm">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map((user, idx) => {
              const isExpanded = expandedUser === user.id
              const stats = userStats[user.id]

              return (
                <div key={user.id} className="bg-surface hover:bg-surface-2 transition-colors">
                  <div className="grid grid-cols-1 lg:grid-cols-[3rem_2fr_1fr_1fr_1fr_1fr] gap-4 p-4 items-center cursor-pointer" onClick={() => toggleExpand(user.id)}>
                    <div className="hidden lg:block text-center text-sm font-bold text-muted">{idx + 1}</div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-white/10 bg-[#0a0c14] flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                        {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{user.full_name}</div>
                        <div className="text-xs text-muted truncate">@{user.username || 'user'}</div>
                      </div>
                    </div>

                    <div className="hidden lg:flex gap-1 flex-wrap">
                      {user.target_exams && user.target_exams.length > 0 ? (
                        <>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white border border-white/10">{user.target_exams[0]}</span>
                          {user.target_exams.length > 1 && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-muted border border-white/10">+{user.target_exams.length - 1}</span>}
                        </>
                      ) : <span className="text-xs text-muted italic">None</span>}
                    </div>

                    <div className="hidden lg:block">
                      <div className="font-black text-primary"><AnimatedNumber value={user.total_xp || 0} /> XP</div>
                      <div className="text-xs font-semibold text-muted mt-0.5">🔥 {user.current_streak || 0} days</div>
                    </div>

                    <div className="hidden lg:flex justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setAdminModal({ isOpen: true, user, newStatus: !user.is_admin }) }}
                        className={cn("w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-200", user.is_admin ? "bg-danger" : "bg-[#0a0c14] border border-border")}
                      >
                        <div className={cn("w-4 h-4 rounded-full bg-white transition-transform duration-200", user.is_admin ? "translate-x-6" : "translate-x-0 bg-muted")} />
                      </button>
                    </div>

                    <div className="hidden lg:flex items-center justify-end gap-2">
                      <div className="text-sm font-semibold text-muted text-right">
                        {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5 bg-[#0a0c14]">
                        <div className="p-4 lg:pl-[4rem] grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Recent Mock Tests</h4>
                            {!stats ? <div className="text-xs text-muted flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Loading...</div> : 
                             stats.tests.length === 0 ? <div className="text-sm text-muted italic">No tests taken</div> : 
                             <div className="space-y-2">
                               {stats.tests.map((t: any, i: number) => (
                                 <div key={i} className="flex justify-between items-center bg-surface border border-border p-2 rounded-lg">
                                   <div className="text-sm font-medium text-white truncate max-w-[200px]">{t.test_name}</div>
                                   <div className="text-sm font-bold text-primary">{t.score}</div>
                                 </div>
                               ))}
                             </div>
                            }
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Activity</h4>
                            <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
                              <span className="text-sm font-semibold text-muted">Study Hours (Last 7D)</span>
                              <span className="text-lg font-black text-white">{stats?.weeklyHours || '0.0'}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={adminModal.isOpen} onClose={() => setAdminModal({ isOpen: false, user: null, newStatus: false })} className="max-w-sm p-6 text-center border-danger/30">
        <ShieldAlert className="w-12 h-12 text-danger mx-auto mb-4" />
        <h3 className="text-xl font-black text-white mb-2">Change Privileges</h3>
        <p className="text-sm text-muted mb-6">Are you sure you want to {adminModal.newStatus ? 'GRANT' : 'REVOKE'} admin access for <strong className="text-white">{adminModal.user?.username}</strong>?</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setAdminModal({ isOpen: false, user: null, newStatus: false })}>Cancel</Button>
          <Button className="flex-1 bg-danger hover:bg-danger/90 text-white" onClick={handleAdminToggle}>Confirm</Button>
        </div>
      </Modal>

    </div>
  )
}
