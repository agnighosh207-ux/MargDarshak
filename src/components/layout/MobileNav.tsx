import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, MessageCircle, BarChart3, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const MOBILE_NAV_ITEMS = [
  { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tests', path: '/tests', icon: FileText },
  { name: 'Doubts', path: '/doubts', icon: MessageCircle },
  { name: 'Chapters', path: '/chapters', icon: BookOpen },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
]

export function MobileNav() {
  const location = useLocation()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full h-16 bg-[rgba(10,12,20,0.85)] backdrop-blur-xl border-t border-[rgba(255,255,255,0.07)] z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-full px-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              <motion.div
                whileTap={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "flex flex-col items-center gap-1",
                  isActive ? "text-primary" : "text-muted hover:text-text transition-colors"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted")} />
                <span className="text-[10px] font-medium">{item.name}</span>
                
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
