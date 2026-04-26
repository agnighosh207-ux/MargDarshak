import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ThumbsUp, MessageSquare, Send, Loader2, CheckCircle2, Award, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'

export function QuestionDetailPage() {
  const { id } = useParams()
  const { profile, awardXP } = useProfile()
  const { toast } = useToast()
  
  const [question, setQuestion] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchQuestionDetails()
    }
  }, [id])

  const fetchQuestionDetails = async () => {
    setLoading(true)
    const [qRes, aRes] = await Promise.all([
      supabase.from('forum_questions').select('*, profiles(full_name, total_xp, referral_code)').eq('id', id).single(),
      supabase.from('forum_answers').select('*, profiles(full_name, total_xp)').eq('question_id', id).order('created_at', { ascending: true })
    ])

    if (!qRes.error) setQuestion(qRes.data)
    if (!aRes.error) setAnswers(aRes.data || [])
    setLoading(false)
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !reply.trim()) return
    setSubmitting(true)

    try {
      const { error } = await supabase.from('forum_answers').insert({
        question_id: id,
        user_id: profile.id,
        content: reply
      })

      if (error) throw error

      toast({ type: 'success', title: 'Reply posted!', description: 'Thanks for helping out the community! +5 XP' })
      if (awardXP) await awardXP(5)
      
      setReply('')
      fetchQuestionDetails()
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: 'Could not post reply.' })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUpvote = async () => {
    toast({ type: 'info', title: 'Upvoted!', description: 'Great feedback!' })
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-muted font-bold">Thread load ho raha hai...</p>
    </div>
  )

  if (!question) return (
    <div className="py-20 text-center">
      <h2 className="text-2xl font-bold text-white">Bhai, ye doubt gayab ho gaya!</h2>
      <Link to="/forum" className="text-primary hover:underline mt-4 block">Wapas chalein?</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <Link to="/forum" className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors text-sm font-bold">
        <ChevronLeft className="w-4 h-4" /> Back to Forum
      </Link>

      {/* Main Question */}
      <div className="bg-[#0f1220] border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-lg font-black text-primary border border-primary/20">
                {question.profiles?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="text-base font-black text-white">{question.profiles?.full_name || 'Anonymous User'}</div>
                <div className="flex items-center gap-2 text-[10px] text-muted font-black uppercase tracking-widest">
                  <Clock className="w-3 h-3" /> {new Date(question.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
              {question.exam_code}
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{question.title}</h1>
          
          <div className="p-6 rounded-3xl bg-[#0a0c14] border border-white/5 text-muted text-lg font-medium leading-relaxed whitespace-pre-wrap">
            {question.content}
          </div>

          <div className="flex items-center gap-6 pt-4">
            <button 
              onClick={() => toggleUpvote()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-primary hover:text-black transition-all active:scale-95"
            >
              <ThumbsUp className="w-4 h-4" /> {question.upvotes || 0}
            </button>
            <div className="flex items-center gap-2 text-muted text-sm font-bold">
              <MessageSquare className="w-4 h-4" /> {answers.length} Replies
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-white flex items-center gap-3 px-4">
          <CheckCircle2 className="w-6 h-6 text-success" /> Replies
        </h3>

        {answers.length === 0 ? (
          <div className="py-12 text-center bg-surface-2 border-2 border-dashed border-white/5 rounded-[32px]">
            <p className="text-muted font-medium italic">Koi reply nahi aaya abhi tak. Help kar do bhai!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((ans, i) => (
              <motion.div
                key={ans.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-6 md:p-8 rounded-[32px] border relative overflow-hidden transition-all",
                  ans.is_accepted ? "bg-success/5 border-success/30" : "bg-[#0f1220] border-white/5 hover:border-white/10"
                )}
              >
                {ans.is_accepted && (
                  <div className="absolute top-4 right-6 flex items-center gap-1.5 text-success font-black text-[10px] uppercase tracking-widest">
                    <Award className="w-4 h-4" /> Solution Accepted
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-black text-muted border border-white/5">
                    {ans.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{ans.profiles?.full_name || 'Expert Contributor'}</div>
                    <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Replied {new Date(ans.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="text-muted font-medium leading-relaxed mb-6">
                  {ans.content}
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleUpvote()}
                    className="flex items-center gap-2 text-muted hover:text-primary transition-colors text-xs font-bold"
                  >
                    <ThumbsUp className="w-4 h-4" /> {ans.upvotes || 0}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Box */}
      <div className="bg-[#0f1220] border border-white/10 rounded-[40px] p-8 shadow-2xl relative">
        <h3 className="text-lg font-black text-white mb-6">Post a Reply</h3>
        <form onSubmit={handleReply} className="space-y-4">
          <textarea 
            required
            rows={4}
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Help solve this doubt..." 
            className="w-full bg-[#0a0c14] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all resize-none font-medium"
          ></textarea>
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={submitting || !reply.trim()}
              className="px-10 py-4 bg-primary text-black font-black rounded-2xl flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Post Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
