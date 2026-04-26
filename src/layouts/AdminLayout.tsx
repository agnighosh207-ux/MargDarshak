import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { LayoutDashboard, Users, Trophy, Settings, BarChart, Sparkles, ArrowLeft } from 'lucide-react'
import { cn } from '../lib/utils'

export function AdminLayout({ children, title }: { children: ReactNode, title?: string }) {
  const { user } = useUser()
  const location = useLocation()

  const NAV_ITEMS = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Rankings', path: '/admin/ranks', icon: Trophy },
    { label: 'App Config', path: '/admin/config', icon: Settings },
    { label: 'Test Analytics', path: '/admin/tests', icon: BarChart },
  ]

  return (
    <div className="min-h-screen bg-[#080a10] text-white flex flex-col">
      {/* HEADER */}
      <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-primary"><Sparkles className="w-5 h-5" /></span>
            MargDarshak
          </div>
          <div className="bg-danger text-white rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            ⚡ Admin Panel
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-sm font-semibold text-muted hover:text-white flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to App
          </Link>
          <div className="flex items-center gap-3 pl-6 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold leading-none">{user?.fullName || 'Super Admin'}</div>
              <div className="text-xs text-danger font-medium mt-0.5">God Mode</div>
            </div>
            <img src={user?.imageUrl} alt="Admin" className="w-9 h-9 rounded-full border border-danger" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[200px] bg-surface border-r border-border flex-col hidden lg:flex shrink-0">
          <nav className="p-4 space-y-1">
            <div className="text-xs font-black text-muted uppercase tracking-wider mb-4 px-3">System Control</div>
            {NAV_ITEMS.map(item => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                    isActive ? "bg-danger/10 text-danger" : "text-muted hover:bg-surface-2 hover:text-white"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar relative">
          {title && <h1 className="text-3xl font-black text-white mb-8 tracking-tight">{title}</h1>}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
