import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, MessageCircle, BarChart3, Calendar, Settings, LogOut, BookOpen, MessageSquare, CreditCard, Gift, Shield, Trophy, Brain, Phone, Sparkles, Smartphone, Flame, Coins, Swords } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useProfile } from '../../hooks/useProfile'
import { usePWA } from '../../hooks/usePWA'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Mock Tests', path: '/tests', icon: FileText },
  { name: 'AI Doubt Solver', path: '/doubts', icon: MessageCircle },
  { name: 'Community Forum', path: '/forum', icon: MessageSquare },
  { name: 'Shadow Matrix', path: '/matrix', icon: Trophy },
  { name: 'Revision Hub', path: '/revision', icon: Brain },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Chapters', path: '/chapters', icon: BookOpen },
  { name: 'PYQ Library', path: '/library', icon: FileText },
  { name: 'Study Planner', path: '/planner', icon: Calendar },
  { name: 'Focus Engine', path: '/focus', icon: Shield },
  { name: 'Parent Connect', path: '/parent-connect', icon: Phone },
  { name: 'Brahmastra Hub', path: '/brahmastra', icon: Sparkles },
  { name: 'Bounty Arena', path: '/bounty', icon: Swords },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Plans & Billing', path: '/billing', icon: CreditCard },
  { name: 'Refer & Earn', path: '/referral', icon: Gift },
  { name: 'Support', path: '/support', icon: MessageSquare },
]

export function Sidebar() {
  const location = useLocation()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { profile } = useProfile()
  const { canInstall, install } = usePWA()

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 w-60 h-screen bg-[#0a0c14] border-r border-[rgba(255,255,255,0.07)] z-40">
      {/* Top Section */}
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center gap-3 mb-6 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all">
            <span className="text-xl font-bold text-black tracking-tighter">M</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">MargDarshak</span>
        </Link>
        
        {/* Exam Badges */}
        {profile?.target_exams && profile.target_exams.length > 0 && (
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-2">
            {profile.target_exams.map(exam => (
              <span key={exam} className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-surface-2 border border-border rounded-full whitespace-nowrap text-muted">
                {exam}
              </span>
            ))}
          </div>
        )}

        {/* Real-time Gamification Stats */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-black text-amber-500">{profile?.streak_count || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-lg border border-primary/20">
            <Coins className="w-3 h-3 text-primary" />
            <span className="text-xs font-black text-primary">{profile?.coins || 0}</span>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 relative flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative px-4 py-3 rounded-xl flex items-center gap-3 transition-colors outline-none"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-highlight"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              
              <motion.div 
                whileHover={{ x: 3 }}
                className={cn(
                  "relative z-10 flex items-center gap-3 w-full",
                  isActive ? "text-primary font-medium" : "text-muted hover:text-text"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted")} />
                {item.name}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.07)] mt-auto">
        {canInstall && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-gradient-to-br from-primary/20 to-amber-600/10 border border-primary/20"
          >
            <p className="text-xs font-medium text-white mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              App install karo — faster hai
            </p>
            <button 
              onClick={install}
              className="w-full py-2 bg-primary text-black text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
            >
              Install Now
            </button>
          </motion.div>
        )}

        <div className="flex items-center gap-3 mb-4 px-2">
          <img src={user?.imageUrl} alt="Avatar" className="w-10 h-10 rounded-full bg-surface-2 border border-border" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{profile?.full_name || user?.fullName}</div>
            <div className="text-xs text-muted truncate">{profile?.target_exams[0] || 'Preparing'}</div>
          </div>
        </div>
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted hover:text-danger hover:bg-danger/10 transition-colors font-medium text-sm"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  )
}
