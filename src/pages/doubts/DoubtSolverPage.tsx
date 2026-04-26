import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, MessageCircle, Send, CheckCircle2, Save, Menu, X, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useSearchParams, Link } from 'react-router-dom'

import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { askAI } from '../../lib/ai'
import { useToast } from '../../components/ui/Toast'
import { EmptyState } from '../../components/ui/EmptyState'
import { MagneticButton } from '../../components/ui/MagneticButton'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { cn } from '../../lib/utils'
import { EMPTY_STATE_MESSAGES } from '../../lib/hinglish'

export function DoubtSolverPage() {
  const { profile, checkLimit, awardXP } = useProfile()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  const [history, setHistory] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // activeDoubt can be null, 'new', or a full doubt object
  const [activeDoubt, setActiveDoubt] = useState<any | 'new' | null>(null)
  
  // New Doubt Form State
  const [newExam, setNewExam] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newChapter, setNewChapter] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [examSubjects, setExamSubjects] = useState<string[]>([])
  const [isStartingDoubt, setIsStartingDoubt] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Chat State
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 200)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load History
  const loadHistory = async () => {
    if (!profile) return
    let query = supabase.from('doubts').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
    if (debouncedSearch) {
      query = query.or(`subject.ilike.%${debouncedSearch}%,question_text.ilike.%${debouncedSearch}%`)
    }
    const { data } = await query
    setHistory(data || [])
  }

  useEffect(() => {
    loadHistory()
  }, [profile, debouncedSearch])

  // Query Params init
  useEffect(() => {
    if (searchParams.get('chapter') || searchParams.get('subject')) {
      setActiveDoubt('new')
      setNewChapter(searchParams.get('chapter') || '')
      setNewSubject(searchParams.get('subject') || '')
    }
  }, [searchParams])

  // New Form Subjects loading
  useEffect(() => {
    if (profile?.target_exams && profile.target_exams.length === 1 && !newExam) {
      setNewExam(profile.target_exams[0])
    }
  }, [profile])

  useEffect(() => {
    async function fetchSubj() {
      if (!newExam) return
      const { data } = await supabase.from('exams').select('subjects').eq('code', newExam).single()
      if (data?.subjects) {
        setExamSubjects(data.subjects)
        if (!newSubject || !data.subjects.includes(newSubject)) {
          setNewSubject(data.subjects[0])
        }
      }
    }
    fetchSubj()
  }, [newExam])

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Handle active doubt change
  useEffect(() => {
    if (activeDoubt && activeDoubt !== 'new') {
      setMessages(activeDoubt.messages || [])
    } else {
      setMessages([])
    }
  }, [activeDoubt])

  // Chat Submission
  const handleStartDoubt = async () => {
    if (!profile) return
    if (!newExam || !newSubject || !newQuestion.trim()) {
      toast({ type: 'error', title: 'Fill all fields' })
      return
    }

    const { allowed } = await checkLimit('doubt')
    if (!allowed) {
      setShowUpgradeModal(true)
      return
    }

    setIsStartingDoubt(true)
    
    try {
      const initialMsgs = [{ role: 'user', content: newQuestion }]
      const { data, error } = await supabase.from('doubts').insert({
        user_id: profile.id,
        exam_code: newExam,
        subject: newSubject,
        chapter: newChapter || null,
        question_text: newQuestion,
        messages: initialMsgs,
        resolved: false
      }).select().single()

      if (error) throw error

      setActiveDoubt(data)
      setMessages(initialMsgs)
      await loadHistory()
      
      // Auto trigger AI for the first message
      handleAiResponse(initialMsgs, data)

    } catch (err) {
      toast({ type: 'error', title: 'Failed to start doubt session' })
    } finally {
      setIsStartingDoubt(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeDoubt || activeDoubt === 'new' || isTyping) return
    
    const userMsg = { role: 'user', content: chatInput.trim() }
    const newMsgs = [...messages, userMsg]
    
    setMessages(newMsgs)
    setChatInput('')
    
    await handleAiResponse(newMsgs, activeDoubt)
  }

  const [isFailoverActive, setIsFailoverActive] = useState(false)

  const handleAiResponse = async (currentMsgs: any[], doubtObj: any) => {
    setIsTyping(true)
    setIsFailoverActive(false)
    try {
      const sysPrompt = `You are MargDarshak AI, an expert tutor for Indian competitive exams. 
The student is preparing for: ${(profile?.target_exams || []).join(', ')}.
Current subject: ${doubtObj.subject}, chapter: ${doubtObj.chapter || 'General'}.
Instructions:
- Explain step by step with numbered steps
- Use plain text math (e.g. F = ma, v² = u² + 2as, ∫f(x)dx)  
- Be encouraging and clear
- End with: 'Quick tip: [one actionable tip]' and 'Common mistake: [one mistake to avoid]'
- Keep responses 150-300 words unless problem requires more
- For UPSC/Law/Banking: focus on conceptual clarity and keywords`

      const aiResponseStr = await askAI(currentMsgs, sysPrompt, () => setIsFailoverActive(true))
      const finalMsgs = [...currentMsgs, { role: 'assistant', content: aiResponseStr }]
      setMessages(finalMsgs)

      // Auto save
      await supabase.from('doubts').update({ messages: finalMsgs }).eq('id', doubtObj.id)
      
    } catch (err) {
      toast({ type: 'error', title: 'AI failed to respond' })
    } finally {
      setIsTyping(false)
    }
  }

  const handleSave = async () => {
    if (!activeDoubt || activeDoubt === 'new') return
    await supabase.from('doubts').update({ messages }).eq('id', activeDoubt.id)
    toast({ type: 'success', title: 'Chat saved' })
  }

  const handleResolve = async () => {
    if (!activeDoubt || activeDoubt === 'new') return
    await supabase.from('doubts').update({ resolved: true }).eq('id', activeDoubt.id)
    setActiveDoubt({ ...activeDoubt, resolved: true })
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
    
    if (awardXP) {
      await awardXP(10)
    }

    toast({ type: 'success', title: 'Doubt marked as resolved! 🎉 +10 XP' })
    loadHistory()
  }

  // UI Renders
  const renderHistoryPanel = () => (
    <div className="w-full lg:w-[300px] h-full bg-surface border-r border-border flex flex-col z-[100] relative">
      <div className="p-4 border-b border-border space-y-4">
        <Button 
          variant="outline" 
          className="w-full border-primary text-primary hover:bg-primary/10"
          onClick={() => { setActiveDoubt('new'); setIsDrawerOpen(false); }}
        >
          <Plus className="w-4 h-4" /> New Doubt
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder="Search doubts..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0c14] border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary outline-none transition-colors"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">No doubts found.</div>
        ) : (
          history.map(d => {
            const isActive = activeDoubt !== 'new' && activeDoubt?.id === d.id
            const isMath = d.subject.toLowerCase().includes('math')
            const isPhy = d.subject.toLowerCase().includes('phys')
            const isChem = d.subject.toLowerCase().includes('chem')
            const badgeColor = isMath ? 'bg-amber-500/10 text-amber-500' : isPhy ? 'bg-indigo-500/10 text-indigo-500' : isChem ? 'bg-emerald-500/10 text-emerald-500' : 'bg-pink-500/10 text-pink-500'

            return (
              <div 
                key={d.id}
                onClick={() => { setActiveDoubt(d); setIsDrawerOpen(false); }}
                className={cn(
                  "px-4 py-4 border-b border-white/5 cursor-pointer hover:bg-surface-2 transition-colors relative",
                  isActive && "bg-surface-2"
                )}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
                <div className="flex justify-between items-start mb-2">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", badgeColor)}>
                    {d.subject}
                  </span>
                  <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", d.resolved ? "bg-success" : "bg-surface-2 border border-muted")} />
                </div>
                <p className="text-sm font-medium text-white line-clamp-2 leading-snug">{d.question_text}</p>
                <div className="text-xs text-muted mt-2">
                  {new Date(d.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
  const renderRightPanel = () => {
    if (!activeDoubt) {
      return (
        <div className="flex-1 flex flex-col bg-bg relative h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)]">
          <div className="lg:hidden p-4 border-b border-border bg-surface">
            <Button variant="ghost" className="px-2" onClick={() => setIsDrawerOpen(true)}>
              <Menu className="w-5 h-5 mr-2" /> History
            </Button>
          </div>
          <EmptyState 
            icon={MessageCircle}
            title="Ask anything. Your AI tutor is ready."
            description={EMPTY_STATE_MESSAGES.no_doubts}
            actionLabel="Start New Doubt →"
            onAction={() => setActiveDoubt('new')}
          />
        </div>
      )
    }

    if (activeDoubt === 'new') {
      return (
        <div className="flex-1 flex flex-col bg-bg overflow-y-auto h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] custom-scrollbar p-6">
          <div className="lg:hidden mb-6 flex justify-start">
            <Button variant="ghost" className="px-2" onClick={() => setIsDrawerOpen(true)}>
              <Menu className="w-5 h-5 mr-2" /> History
            </Button>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full bg-surface border border-border rounded-2xl p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-white mb-8">Start a New Doubt Session</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Exam</label>
                  <select 
                    value={newExam} onChange={e => setNewExam(e.target.value)}
                    className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow"
                  >
                    <option value="" disabled>Select Exam</option>
                    {profile?.target_exams?.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Subject</label>
                  <select 
                    value={newSubject} onChange={e => setNewSubject(e.target.value)} disabled={!newExam}
                    className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow disabled:opacity-50"
                  >
                    <option value="" disabled>Select Subject</option>
                    {examSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Chapter (Optional)</label>
                <input 
                  type="text" value={newChapter} onChange={e => setNewChapter(e.target.value)} placeholder="e.g. Thermodynamics"
                  className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Your Doubt</label>
                <textarea 
                  value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Describe your doubt in detail..." rows={4}
                  className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow resize-none"
                />
              </div>

              <div className="pt-4">
                <MagneticButton className="w-full block">
                  <Button 
                    onClick={handleStartDoubt} 
                    disabled={isStartingDoubt || !newExam || !newSubject || !newQuestion.trim()}
                    className="w-full py-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  >
                    {isStartingDoubt ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Thinking...</> : "Ask AI →"}
                  </Button>
                </MagneticButton>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }

    // STATE C: CHAT
    return (
      <div className="flex-1 flex flex-col bg-bg relative h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)]">
        {/* Chat Header */}
        <div className="h-16 shrink-0 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 relative z-10">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted hover:text-white" onClick={() => setIsDrawerOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-full">
              {activeDoubt.subject}
            </div>
            <div className="text-sm font-medium text-white truncate max-w-[150px] sm:max-w-[200px]">
              {activeDoubt.chapter || 'General'}
            </div>
            {isFailoverActive && (
              <div className="px-2 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger text-[10px] font-black uppercase tracking-tighter animate-pulse">
                Redundant Engine Active
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!activeDoubt.resolved && (
              <Button variant="outline" className="h-8 px-3 text-xs border-success text-success hover:bg-success/10 relative" onClick={handleResolve}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Resolved
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                        animate={{ 
                          opacity: 0, 
                          scale: Math.random() * 0.5 + 0.5, 
                          x: (Math.random() - 0.5) * 100, 
                          y: (Math.random() - 0.5) * -100 
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute w-2 h-2 bg-amber-500 rounded-full"
                      />
                    ))}
                  </div>
                )}
              </Button>
            )}
            <Button variant="ghost" className="h-8 px-3 text-xs" onClick={handleSave}>
              <Save className="w-3 h-3 mr-1" /> Save
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
              {m.role === 'user' ? (
                <div className="max-w-[85%] sm:max-w-[70%] bg-primary text-black rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-md">
                  <div className="font-medium text-[15px] whitespace-pre-wrap">{m.content}</div>
                </div>
              ) : (
                <div className="max-w-[90%] sm:max-w-[85%] bg-surface-2 border border-border border-l-4 border-l-primary rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm relative">
                  <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-a:text-primary prose-pre:bg-[#0a0c14] prose-pre:border prose-pre:border-border">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface-2 border border-border border-l-4 border-l-primary rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary" style={{ animation: `chat-bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-surface border-t border-border shrink-0">
          <div className="max-w-4xl mx-auto flex gap-3 relative">
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder={isTyping ? "AI is typing..." : "Ask a follow up question..."}
              disabled={isTyping}
              rows={1}
              className="flex-1 bg-[#0a0c14] border border-border rounded-xl pl-4 pr-12 py-3.5 text-[15px] text-white input-glow resize-none min-h-[52px] max-h-32 custom-scrollbar disabled:opacity-50"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSendMessage}
              disabled={isTyping || !chatInput.trim()}
              className="absolute right-3 bottom-2.5 w-8 h-8 rounded-lg bg-primary text-black flex items-center justify-center disabled:opacity-50 disabled:bg-surface-2 disabled:text-muted transition-colors"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </motion.button>
          </div>
          <div className="text-center mt-2 text-[10px] text-muted">
            Shift+Enter for newline, Enter to send. MargDarshak AI can make mistakes.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] overflow-hidden bg-bg rounded-t-xl lg:rounded-2xl border-x lg:border-t border-border">
      
      {/* Desktop Left Panel */}
      <div className="hidden lg:block">
        {renderHistoryPanel()}
      </div>

      {/* Main Content Area */}
      {renderRightPanel()}

      {/* Mobile Drawer Left Panel */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 z-[110] lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-surface border-r border-border z-[120] lg:hidden flex flex-col"
            >
              <div className="p-4 border-b border-border flex justify-between items-center">
                <span className="font-bold text-white tracking-tight">History</span>
                <button onClick={() => setIsDrawerOpen(false)} className="text-muted hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                {renderHistoryPanel()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <Modal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} className="w-full max-w-md p-8 text-center bg-surface border border-primary/30 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🚀</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Upgrade to Arjuna</h2>
        <p className="text-muted leading-relaxed mb-8">
          Arre beta, free limit khatam ho gayi! Arjuna plan lo aur unlimited mock tests aur doubts access karo — sirf ₹499/month 🚀
        </p>
        <Link to="/pricing" className="block w-full py-3 rounded-xl bg-primary text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:bg-primary/90 transition-all">
          Pricing dekho
        </Link>
        <button onClick={() => setShowUpgradeModal(false)} className="mt-4 text-sm text-muted hover:text-white transition-colors">
          Maybe later
        </button>
      </Modal>
    </div>
  )
}
