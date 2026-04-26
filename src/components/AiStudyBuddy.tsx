import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Bot } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { askGroq } from '../lib/groq'
import { cn } from '../lib/utils'

export function AiStudyBuddy() {
  const { profile } = useProfile()
  const location = useLocation()
  
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [weakSubjects, setWeakSubjects] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch weak subjects
  useEffect(() => {
    async function fetchWeak() {
      if (!profile) return
      const { data } = await supabase.from('chapter_performance')
        .select('subject')
        .eq('user_id', profile.id)
        .lt('accuracy', 50)
      
      if (data) {
        const set = new Set(data.map(d => d.subject))
        setWeakSubjects(Array.from(set))
      }
    }
    fetchWeak()
  }, [profile])

  // Context aware greeting
  useEffect(() => {
    let pageContext = ''
    if (location.pathname.startsWith('/tests')) pageContext = "I see you're around tests! Need any quick tips or strategy?"
    else if (location.pathname.startsWith('/doubts')) pageContext = "Doubts section mein ho? Main bhi help kar sakta hoon if you want a quick explanation."
    else if (location.pathname.startsWith('/planner')) pageContext = "Planning your schedule? Let me know if you need help prioritizing."
    else if (location.pathname.startsWith('/chapters')) pageContext = "Reviewing weak chapters? Don't stress, we can improve them together!"
    else pageContext = "Aur sunao, kaisa chal raha hai preparation?"

    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: `Hey! StudyBuddy here 👋 ${pageContext}` }])
    }
  }, [location.pathname, messages.length])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  const handleSend = async (text: string) => {
    if (!text.trim()) return

    const userMsg = { role: 'user' as const, content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInputText('')
    setIsTyping(true)

    const sysPrompt = `You are StudyBuddy, an AI assistant for MargDarshak — an Indian exam prep app. You speak in friendly Hinglish (mix of Hindi and English). You help students with exam strategy, motivation, and quick concept doubts. Be concise, real, and occasionally funny. Never be formal. Examples of your tone: 'Arre bhai, yeh wala concept simple hai', 'Chill maar, 3 din mein ho jaayega', 'Galat answer? No problem, sahi approach dekho'. 
The student's target exams are: ${profile?.target_exams?.join(', ') || 'General'}. Their weak subjects are: ${weakSubjects.join(', ') || 'None identified yet'}. Current page context: ${location.pathname}`

    try {
      // Pass the last 5 messages for context
      const chatHistory = newMessages.slice(-5)
      const res = await askGroq(chatHistory, sysPrompt)
      setMessages([...newMessages, { role: 'assistant', content: res }])
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: "Oops, mera network thoda slow hai abhi. Ek minute baad try karna! 😅" }])
    } finally {
      setIsTyping(false)
    }
  }

  const suggestions = [
    "Motivate me 🔥",
    "Quick tip for today",
    "Explain a concept",
    `Strategy for ${profile?.target_exams?.[0] || 'exam'}`
  ]

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed right-6 w-14 h-14 bg-accent text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50",
          isOpen ? "scale-0" : "scale-100",
          "bottom-40 lg:bottom-6"
        )}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 lg:bottom-24 right-0 lg:right-6 w-full h-[85vh] lg:w-[350px] lg:h-[500px] bg-surface border border-border lg:rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-surface-2 border-b border-border p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">StudyBuddy</h3>
                  <div className="text-[10px] text-accent font-medium">Online 🟢</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-bg relative">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap shadow-sm",
                    msg.role === 'user' ? "bg-primary text-black rounded-br-sm" : "bg-surface-2 border border-border text-white rounded-bl-sm"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-surface-2 border border-border px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-muted rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-muted rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-muted rounded-full" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-surface border-t border-border p-3 shrink-0">
              <div className="flex overflow-x-auto gap-2 mb-3 pb-1 custom-scrollbar hide-scrollbar">
                {suggestions.map(s => (
                  <button 
                    key={s} 
                    onClick={() => handleSend(s)}
                    className="whitespace-nowrap px-3 py-1.5 bg-surface-2 border border-border rounded-full text-xs text-muted hover:text-white hover:border-white/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form 
                onSubmit={e => { e.preventDefault(); handleSend(inputText) }}
                className="flex gap-2"
              >
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-[#0a0c14] border border-border rounded-full px-4 py-2 text-sm text-white focus:border-accent outline-none transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
