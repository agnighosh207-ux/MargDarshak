import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Search, Plus, Filter, ThumbsUp, MessageCircle, ChevronRight, Loader2, Target, Sparkles, X, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'
import { Link } from 'react-router-dom'
import { Modal } from '../../components/ui/Modal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function ForumPage() {
  const { profile } = useProfile()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [selectedExam, setSelectedExam] = useState('ALL')
  const [isAskModalOpen, setIsAskModalOpen] = useState(false)

  // Form State
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newSubject, setNewSubject] = useState('')

  const EXAMS = ['ALL', 'JEE_MAIN', 'JEE_ADV', 'NEET_UG', 'UPSC_CSE', 'CAT', 'GATE']

  // 1. Fetch Questions Query
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['forum_questions', selectedExam],
    queryFn: async () => {
      let query = supabase
        .from('forum_questions')
        .select('*, profiles(full_name, total_xp)')
        .order('created_at', { ascending: false })
      
      if (selectedExam !== 'ALL') {
        query = query.eq('exam_code', selectedExam)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    }
  })

  // 2. Post Question Mutation
  const askMutation = useMutation({
    mutationFn: async (newQuestion: any) => {
      const { error } = await supabase.from('forum_questions').insert(newQuestion)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum_questions'] })
      toast({ type: 'success', title: 'Question Posted! 🚀', description: 'Ab bas thoda wait karo, doston ka reply aayega.' })
      setIsAskModalOpen(false)
      setNewTitle('')
      setNewContent('')
      setNewSubject('')
    },
    onError: () => {
      toast({ type: 'error', title: 'Error', description: 'Post nahi ho paaya. Try again!' })
    }
  })

  // 3. Optimistic Upvote Mutation
  const upvoteMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase.rpc('increment_upvotes', { question_id: questionId })
      if (error) {
        // Fallback if RPC doesn't exist
        const { data: current } = await supabase.from('forum_questions').select('upvotes').eq('id', questionId).single()
        await supabase.from('forum_questions').update({ upvotes: (current?.upvotes || 0) + 1 }).eq('id', questionId)
      }
    },
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({ queryKey: ['forum_questions'] })
      const previousQuestions = queryClient.getQueryData(['forum_questions', selectedExam])
      
      queryClient.setQueryData(['forum_questions', selectedExam], (old: any) => 
        old.map((q: any) => q.id === questionId ? { ...q, upvotes: (q.upvotes || 0) + 1 } : q)
      )

      return { previousQuestions }
    },
    onError: (_err, _questionId, context: any) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData(['forum_questions', selectedExam], context.previousQuestions)
      }
      toast({ type: 'error', title: 'Upvote Failed', description: 'Please try again.' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['forum_questions'] })
    }
  })

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    askMutation.mutate({
      user_id: profile.id,
      title: newTitle,
      content: newContent,
      subject: newSubject,
      exam_code: profile.target_exams[0] || 'GENERAL'
    })
  }

  const filteredQuestions = questions.filter((q: any) => 
    q.title.toLowerCase().includes(search.toLowerCase()) || 
    q.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="w-10 h-10 text-primary" />
            Community Forum
          </h1>
          <p className="text-muted mt-2 text-lg font-medium">Bhai-chara badhao. Doubts pucho aur doston ki help karo.</p>
        </div>

        <button 
          onClick={() => setIsAskModalOpen(true)}
          className="px-8 py-4 bg-primary text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)]"
        >
          <Plus className="w-5 h-5" /> Ask a Question
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0f1220] border border-white/5 rounded-3xl p-6 sticky top-24">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Filter by Exam
            </h3>
            <div className="space-y-2">
              {EXAMS.map(ex => (
                <button
                  key={ex}
                  onClick={() => setSelectedExam(ex)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-left text-sm font-bold transition-all",
                    selectedExam === ex ? "bg-primary text-black" : "text-muted hover:bg-white/5 hover:text-white"
                  )}
                >
                  {ex.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-2">
                  <Sparkles className="w-3 h-3" /> Tip of the day
                </div>
                <p className="text-xs text-muted font-medium leading-relaxed">
                  Helpful answers earns you extra <span className="text-white">XP</span> and increases your rank! 📈
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Try: 'How to solve circles using calculus?' (Semantic Search Ready)" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0f1220] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary/50 transition-all shadow-xl"
            />
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-muted font-bold">Doubts dhund raha hoon...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-20 text-center bg-[#0f1220] border-2 border-dashed border-white/5 rounded-[40px]">
              <Target className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">No questions found!</h3>
              <p className="text-muted mt-2">Pehle insaan bano jo yahan doubt puche. 🚀</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredQuestions.map((q) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className="group bg-[#0f1220] border border-white/5 rounded-3xl p-6 md:p-8 hover:border-primary/30 transition-all relative overflow-hidden"
                  >
                    <Link to={`/forum/${q.id}`} className="absolute inset-0 z-0" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                            {q.profiles?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{q.profiles?.full_name || 'Anonymous User'}</div>
                            <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{new Date(q.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-muted uppercase tracking-widest">
                          {q.exam_code}
                        </div>
                      </div>

                      <h2 className="text-xl font-black text-white mb-3 group-hover:text-primary transition-colors leading-tight">{q.title}</h2>
                      <p className="text-muted text-sm line-clamp-2 mb-6 font-medium leading-relaxed">{q.content}</p>

                      <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                        <button 
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            upvoteMutation.mutate(q.id)
                          }}
                          className={cn(
                            "flex items-center gap-2 text-xs font-bold transition-all px-4 py-2 rounded-xl border",
                            upvoteMutation.isPending ? "opacity-50" : "hover:bg-primary hover:text-black hover:border-primary border-white/10 text-muted"
                          )}
                        >
                          <ThumbsUp className="w-4 h-4" /> {q.upvotes || 0}
                        </button>
                        <div className="flex items-center gap-2 text-muted text-xs font-bold">
                          <MessageCircle className="w-4 h-4" /> 0 Replies
                        </div>
                        <div className="ml-auto text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Thread <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Ask Modal */}
      <Modal isOpen={isAskModalOpen} onClose={() => setIsAskModalOpen(false)} className="max-w-2xl p-0 overflow-hidden bg-[#0a0c14] border border-white/10 shadow-2xl">
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-white">Ask your doubt</h2>
            <button onClick={() => setIsAskModalOpen(false)} className="p-2 text-muted hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleAsk} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-widest px-1">Short Title</label>
              <input 
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Help with Integration problem in Physics" 
                className="w-full bg-[#0f1220] border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-widest px-1">Subject</label>
                <input 
                  required
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g. Physics" 
                  className="w-full bg-[#0f1220] border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-widest px-1">Exam</label>
                <div className="w-full bg-[#0f1220] border border-white/10 rounded-xl px-6 py-4 text-white/50 cursor-not-allowed">
                  {profile?.target_exams[0] || 'GENERAL'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-widest px-1">Detailed Explanation</label>
              <textarea 
                required
                rows={5}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Explain what exactly you're stuck on..." 
                className="w-full bg-[#0f1220] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all resize-none"
              ></textarea>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={askMutation.isPending}
                className="w-full py-4 bg-primary text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(245,158,11,0.2)] disabled:opacity-50"
              >
                {askMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                Post to Community
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
