import { Menu, Search, Bell, Zap, Trophy, MessageSquare } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'reward', title: 'Marg Coins Earned!', desc: '+50 coins for a 3-day streak.', time: '2m ago', read: false, icon: Trophy },
  { id: 2, type: 'alert', title: 'Mock Test Ready', desc: 'Your custom JEE Advanced test is generated.', time: '1h ago', read: false, icon: Zap },
  { id: 3, type: 'message', title: 'New Forum Reply', desc: 'Someone answered your doubt on Rotational Mechanics.', time: '3h ago', read: true, icon: MessageSquare }
]

export function TopBar({ title }: { title?: string }) {
  const location = useLocation()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const notifRef = useRef<HTMLDivElement>(null)
  
  // Format title from path if not provided
  const displayTitle = title || location.pathname.split('/')[1]?.charAt(0).toUpperCase() + location.pathname.split('/')[1]?.slice(1) || 'Dashboard'

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

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
        
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn("relative p-2 rounded-lg transition-colors", showNotifications ? "bg-surface-2 text-white" : "text-muted hover:text-white")}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-bg animate-pulse"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between bg-surface-2/50">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:text-amber-400 transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted">
                      <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif) => {
                        const Icon = notif.icon
                        return (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
                            }}
                            className={cn(
                              "p-4 border-b border-border/50 flex gap-3 hover:bg-surface-2 transition-colors cursor-pointer",
                              !notif.read ? "bg-primary/5" : ""
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                              notif.type === 'reward' ? "bg-primary/20 text-primary" :
                              notif.type === 'alert' ? "bg-blue-500/20 text-blue-400" :
                              "bg-purple-500/20 text-purple-400"
                            )}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium truncate", !notif.read ? "text-white" : "text-gray-300")}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.desc}
                              </p>
                              <p className="text-[10px] text-muted/70 mt-2 font-medium">
                                {notif.time}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-px bg-border hidden sm:block"></div>
        
        <UserButton 
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8 rounded-xl ring-2 ring-transparent hover:ring-primary/50 transition-all",
              userButtonPopoverCard: "bg-surface border-border",
            }
          }}
        />
      </div>
    </header>
  )
}
