import { Menu, Search, Bell } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'

export function TopBar({ title }: { title?: string }) {
  const location = useLocation()
  
  // Format title from path if not provided
  const displayTitle = title || location.pathname.split('/')[1]?.charAt(0).toUpperCase() + location.pathname.split('/')[1]?.slice(1) || 'Dashboard'

  return (
    <header className="fixed top-0 left-0 lg:left-60 right-0 h-16 bg-[rgba(10,12,20,0.7)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.07)] z-30 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 -ml-2 text-muted hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-white tracking-tight">{displayTitle}</h1>
      </div>
      
      <div className="flex items-center gap-4 lg:gap-6">
        <button className="text-muted hover:text-white transition-colors">
          <Search className="w-5 h-5" />
        </button>
        
        <button className="relative text-muted hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-bg"></span>
        </button>

        <div className="h-6 w-px bg-border hidden sm:block"></div>
        
        <UserButton 
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8 rounded-xl",
              userButtonPopoverCard: "bg-surface border-border",
            }
          }}
        />
      </div>
    </header>
  )
}
