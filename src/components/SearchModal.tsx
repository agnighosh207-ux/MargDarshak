import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, LayoutDashboard, FileText, MessageCircle, Settings, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useKeyboard } from '../hooks/useKeyboard'
import { useProfile } from '../hooks/useProfile'
import { cn } from '../lib/utils'

export function SearchModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { profile } = useProfile()

  const PLACEHOLDERS = [
    "Chapter search karo...",
    "Doubt dhundo...",
    "Test generate karo...",
    "Beta, kya dhund rahe ho?",
    "Analytics check karo..."
  ]

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches')
    if (saved) setRecentSearches(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Handle escape globally when search is open
  useKeyboard(
    undefined, 
    () => { if (isOpen) onClose() }
  )

  const COMMANDS = [
    { label: 'Generate Test', cmd: '/test', path: '/tests/new', icon: FileText },
    { label: 'Doubt Solver', cmd: '/doubt', path: '/doubts', icon: MessageCircle },
    { label: 'Study Planner', cmd: '/plan', path: '/planner', icon: Calendar },
    { label: 'Analytics', cmd: '/analytics', path: '/analytics', icon: LayoutDashboard },
    { label: 'Settings', cmd: '/settings', path: '/settings', icon: Settings },
  ]

  const MODULES = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Mock Tests', path: '/tests', icon: FileText },
    { label: 'Generate Test', path: '/tests/new', icon: FileText },
    { label: 'Doubt Solver', path: '/doubts', icon: MessageCircle },
    { label: 'Study Planner', path: '/planner', icon: Calendar },
    { label: 'Settings', path: '/settings', icon: Settings },
  ]

  const isCommand = query.startsWith('/')
  let displayItems = isCommand 
    ? COMMANDS.filter(c => c.cmd.includes(query.toLowerCase()))
    : MODULES.filter(m => m.label.toLowerCase().includes(query.toLowerCase()))

  const handleSelect = (path: string) => {
    if (!isCommand && query.trim()) {
      const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
      setRecentSearches(newRecent)
      localStorage.setItem('recent_searches', JSON.stringify(newRecent))
    }
    navigate(path)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % (displayItems.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + (displayItems.length || 1)) % (displayItems.length || 1))
    } else if (e.key === 'Enter') {
      if (displayItems[selectedIndex]) {
        handleSelect(displayItems[selectedIndex].path)
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#080a10]/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col mx-4"
          >
            <div className="flex items-center px-4 py-4 border-b border-white/5 relative">
              <Search className="w-5 h-5 text-muted shrink-0" />
              <div className="flex-1 relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none text-white px-4 outline-none placeholder:opacity-0"
                  spellCheck={false}
                />
                {!query && (
                  <div className="absolute left-4 pointer-events-none overflow-hidden h-5 flex flex-col">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={placeholderIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-muted text-sm"
                      >
                        {PLACEHOLDERS[placeholderIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted bg-white/5 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-tighter">/ for commands</span>
                <button onClick={onClose} className="p-1 text-muted hover:text-white bg-surface-2 rounded-md transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {query === '' && (
                <div className="p-4 space-y-6">
                  {recentSearches.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Recent Searches</h3>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((s, i) => (
                          <button key={i} onClick={() => setQuery(s)} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-xs text-white hover:bg-white/10 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile?.target_exams && profile.target_exams.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Your Exams</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.target_exams.map((exam, i) => (
                          <button key={i} onClick={() => setQuery(exam)} className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary font-bold hover:bg-primary/20 transition-colors">
                            {exam}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {displayItems.length > 0 ? (
                <div className="p-2 space-y-1">
                  {displayItems.map((r, i) => (
                    <button
                      key={i}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => handleSelect(r.path)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group",
                        selectedIndex === i ? "bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "bg-transparent border border-transparent hover:bg-surface-2"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <r.icon className={cn("w-4 h-4", selectedIndex === i ? "text-primary" : "text-muted")} />
                        <span className={cn("text-sm font-semibold", selectedIndex === i ? "text-white" : "text-muted group-hover:text-white")}>{r.label}</span>
                      </div>
                      {selectedIndex === i && <span className="text-[10px] font-bold text-primary animate-pulse">ENTER ↵</span>}
                    </button>
                  ))}
                </div>
              ) : query !== '' && (
                <div className="p-8 text-center text-muted">No modules found for "{query}"</div>
              )}

              {query !== '' && !isCommand && (
                <div className="p-4 border-t border-white/5">
                  <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleSelect(`/tests/new?topic=${query}`)}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-2"
                    >
                      ⚡ Generate test on "{query}"
                    </button>
                    <button 
                      onClick={() => handleSelect(`/doubts?subject=${query}`)}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-2"
                    >
                      🤖 Ask doubt about "{query}"
                    </button>
                    <button 
                      onClick={() => handleSelect('/planner')}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-2"
                    >
                      📅 Open planner
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-surface-2 px-4 py-2 border-t border-white/5 text-[10px] text-muted flex justify-between">
              <span>Navigate to modules</span>
              <span>esc to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
