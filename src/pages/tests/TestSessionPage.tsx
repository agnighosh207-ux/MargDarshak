import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowLeft, ArrowRight, Flag, X } from 'lucide-react'

import { useProfile } from '../../hooks/useProfile'
import { useKeyboard } from '../../hooks/useKeyboard'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { cn } from '../../lib/utils'

export function TestSessionPage() {
  const { id } = useParams()
  const location = useLocation()
  const { mode = 'practice', duration = null } = (location.state as any) || {}
  
  const { profile, awardXP } = useProfile()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [marked, setMarked] = useState<Record<number, boolean>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [timeTaken, setTimeTaken] = useState(0)
  
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const totalTime = mode === 'exam' && duration ? duration * 60 : questions.length * 150 // 2.5 mins per question
  const timeRemaining = Math.max(totalTime - timeTaken, 0)
  const percentTimeUsed = totalTime > 0 ? (timeTaken / totalTime) * 100 : 0

  // Touch handlers
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    async function loadTest() {
      if (!profile || !id) return
      const { data, error } = await supabase.from('mock_tests').select('*').eq('id', id).eq('user_id', profile.id).single()
      if (error || !data) {
        navigate('/tests')
        return
      }

      if (data.status === 'completed') {
        navigate(`/tests/${id}/result`)
        return
      }

      setTest(data)
      setQuestions(data.questions || [])
      setAnswers(data.answers || {})
      setLoading(false)

      if (data.status === 'pending') {
        await supabase.from('mock_tests').update({ status: 'in_progress' }).eq('id', id)
      }
    }
    loadTest()
  }, [id, profile, navigate])

  const handleSubmitRef = useRef<() => void>();

  // Timer
  useEffect(() => {
    if (loading || submitting) return
    const timer = setInterval(() => {
      setTimeTaken(t => t + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [loading, submitting])

  // Auto-submit for Exam mode
  useEffect(() => {
    if (mode === 'exam' && timeRemaining <= 0 && totalTime > 0 && !submitting && !loading) {
      if (handleSubmitRef.current) handleSubmitRef.current();
    }
  }, [timeRemaining, mode, totalTime, submitting, loading])

  const handleAnswer = useCallback((val: string) => {
    setAnswers(prev => {
      if (prev[currentIndex] === val) {
        const copy = { ...prev }
        delete copy[currentIndex]
        return copy
      }
      return { ...prev, [currentIndex]: val }
    })
  }, [currentIndex])

  // Keyboard Navigation via useKeyboard Hook
  const handleKeyDownAction = useCallback((key: string) => {
    if (isSubmitModalOpen) return
    const q = questions[currentIndex]
    
    if (key === 'ArrowLeft') {
      setCurrentIndex(prev => Math.max(0, prev - 1))
    } else if (key === 'ArrowRight') {
      setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))
    } else if (q?.type === 'mcq' && ['1', '2', '3', '4'].includes(key)) {
      if (!q.options) return
      const optMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' } as any
      const prefix = optMap[key]
      const matchingOpt = q.options.find((opt: string) => opt.startsWith(prefix))
      if (matchingOpt) handleAnswer(matchingOpt)
    }
  }, [currentIndex, questions, isSubmitModalOpen, handleAnswer])

  useKeyboard(
    undefined, // no search here
    () => { if (isMobileDrawerOpen) setIsMobileDrawerOpen(false); if (isSubmitModalOpen) setIsSubmitModalOpen(false); },
    (optIndex) => handleKeyDownAction((optIndex + 1).toString()),
    (dir) => handleKeyDownAction(dir === 'prev' ? 'ArrowLeft' : 'ArrowRight'),
    true // isTestSession
  )

  const handleClear = () => {
    setAnswers(prev => {
      const copy = { ...prev }
      delete copy[currentIndex]
      return copy
    })
  }

  const handleMarkReview = () => {
    setMarked(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }))
  }

  const handleSubmitTest = async () => {
    if (!test || !profile) return
    setSubmitting(true)

    let correct = 0
    let totalMarks = 0
    let earnedMarks = 0

    const chapterStats: Record<string, { attempts: number, correct: number }> = {}

    questions.forEach((q, i) => {
      const ans = answers[i]
      const isAttempted = ans !== undefined
      const isCorrect = ans === q.correct_answer || (ans && q.options && ans.startsWith(q.correct_answer))

      totalMarks += (q.marks || 4)

      if (!chapterStats[q.chapter]) {
        chapterStats[q.chapter] = { attempts: 0, correct: 0 }
      }

      if (isAttempted) {
        chapterStats[q.chapter].attempts += 1
        if (isCorrect) {
          correct += 1
          earnedMarks += (q.marks || 4)
          chapterStats[q.chapter].correct += 1
        } else {
          earnedMarks += (q.negative_marks || -1)
        }
      }
    })

    const attempted = Object.keys(answers).length
    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0

    try {
      const submissionHour = new Date().getHours()
      const finalScore = submissionHour >= 0 && submissionHour < 5 ? earnedMarks * 0.9 : earnedMarks

      // 1. Update Test
      await supabase.from('mock_tests').update({
        answers,
        score: finalScore,
        total_marks: totalMarks,
        accuracy,
        time_taken_seconds: timeTaken,
        status: 'completed',
        submission_hour: submissionHour
      }).eq('id', test.id)

      // 2. Update chapter_performance (Upsert logic)
      for (const chapterName of Object.keys(chapterStats)) {
        const stats = chapterStats[chapterName]
        if (stats.attempts > 0) {
          const { data: existing } = await supabase.from('chapter_performance')
            .select('*').eq('user_id', profile.id).eq('exam_code', test.exam_code).eq('subject', test.subject).eq('chapter', chapterName).single()

          if (existing) {
            await supabase.from('chapter_performance').update({
              attempts: existing.attempts + stats.attempts,
              correct: existing.correct + stats.correct,
              last_attempted: new Date().toISOString()
            }).eq('id', existing.id)
          } else {
            await supabase.from('chapter_performance').insert({
              user_id: profile.id,
              exam_code: test.exam_code,
              subject: test.subject,
              chapter: chapterName,
              attempts: stats.attempts,
              correct: stats.correct
            })
          }
        }
      }

      // 3. Update XP
      if (awardXP) {
        await awardXP(50)
      }

      navigate(`/tests/${test.id}/result`)
    } catch (err) {
      console.error('Submit error', err)
      setSubmitting(false)
    }
  }

  useEffect(() => {
    handleSubmitRef.current = handleSubmitTest
  })

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const q = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const markedCount = Object.keys(marked).filter(k => marked[parseInt(k)]).length
  const unansweredCount = questions.length - answeredCount

  const currentHour = new Date().getHours()
  const isCircadianRisk = currentHour >= 0 && currentHour < 5

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const timerColor = percentTimeUsed > 95 ? 'text-danger animate-pulse' : percentTimeUsed > 80 ? 'text-amber-500' : 'text-white'

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (diff > 50) setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))
    if (diff < -50) setCurrentIndex(prev => Math.max(0, prev - 1))
    setTouchStart(null)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex flex-col overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* HEADER */}
      <header className="h-16 shrink-0 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-8">
        <div className="w-1/3 flex items-center gap-3">
          <div className="truncate text-sm font-semibold text-white">{test.test_name}</div>
          {isCircadianRisk && (
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1, 0.95] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-tighter shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              Circadian Warning: -10% Rank Penalty
            </motion.div>
          )}
        </div>
        <div className={cn("w-1/3 text-center text-xl font-mono font-bold tracking-wider", timerColor)}>
          {formatTime(timeRemaining)}
        </div>
        <div className="w-1/3 flex justify-end">
          <Button 
            variant="outline" 
            className={cn("h-9 px-4 text-sm transition-colors", answeredCount > questions.length / 2 && "border-primary text-primary hover:bg-primary/10")}
            onClick={() => setIsSubmitModalOpen(true)}
          >
            Submit Test
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL (Desktop) */}
        <div className="hidden lg:flex flex-col w-[260px] bg-surface-2 border-r border-border p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Question Palette</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((_, i) => {
              const isAns = answers[i] !== undefined
              const isMark = marked[i]
              const isCur = i === currentIndex

              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "h-10 rounded-md text-sm font-semibold flex items-center justify-center transition-all",
                    isCur ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-2" : "",
                    isMark ? "bg-amber-500/20 text-amber-500 border border-amber-500/50" :
                    isAns ? "bg-success/20 text-success border border-success/50" :
                    "bg-surface border border-border text-muted hover:border-white/20"
                  )}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          
          <div className="mt-8 space-y-2 text-xs font-medium text-muted">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-success/20 border border-success/50" /> Answered</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/50" /> Marked</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-surface border border-border" /> Unanswered</div>
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
          <div className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Question {currentIndex + 1} of {questions.length}</h2>
              <div className="text-sm font-medium text-muted bg-surface-2 px-3 py-1 rounded-full border border-border">
                <span className="text-success">+{q.marks || 4}</span> / <span className="text-danger">{q.negative_marks || -1}</span>
              </div>
            </div>

            <div className="text-lg text-white leading-relaxed mb-8 whitespace-pre-wrap font-medium">
              {q.question}
            </div>

            {q.type === 'mcq' && q.options && (
              <div className="space-y-3">
                {q.options.map((opt: string, i: number) => {
                  const isSelected = answers[currentIndex] === opt
                  let isCorrect = false
                  let isWrong = false
                  
                  if (mode === 'practice' && revealed[currentIndex]) {
                    if (opt.startsWith(q.correct_answer)) isCorrect = true
                    if (isSelected && !opt.startsWith(q.correct_answer)) isWrong = true
                  }

                  return (
                    <motion.button
                      key={i}
                      whileTap={mode === 'practice' && revealed[currentIndex] ? {} : { scale: 0.99 }}
                      onClick={() => {
                        if (mode === 'practice' && revealed[currentIndex]) return
                        handleAnswer(opt)
                      }}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-4",
                        isSelected && !isCorrect && !isWrong ? "bg-primary/10 border-primary text-primary font-medium" : "",
                        isCorrect ? "bg-success/20 border-success text-success font-medium" : "",
                        isWrong ? "bg-danger/20 border-danger text-danger font-medium" : "",
                        !isSelected && !isCorrect && !isWrong ? "bg-surface-2 border-border text-white hover:border-primary/40 hover:bg-primary/5" : ""
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-xs mt-0.5 transition-colors",
                        (isSelected && !isCorrect && !isWrong) ? "border-primary bg-primary text-black" : 
                        isCorrect ? "border-success bg-success text-black" :
                        isWrong ? "border-danger bg-danger text-black" :
                        "border-muted text-muted"
                      )}>
                        {['A','B','C','D'][i]}
                      </div>
                      <div className="flex-1">{opt.replace(/^[A-D]\)\s*/, '')}</div>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {(q.type === 'numerical' || q.type === 'integer') && (
              <div className="mt-8">
                <input
                  type="number"
                  step="any"
                  value={answers[currentIndex] || ''}
                  onChange={e => {
                    if (mode === 'practice' && revealed[currentIndex]) return
                    handleAnswer(e.target.value)
                  }}
                  disabled={mode === 'practice' && revealed[currentIndex]}
                  placeholder="Enter your numeric answer..."
                  className="w-full max-w-sm bg-surface-2 border border-border rounded-xl px-6 py-4 text-2xl text-white outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(245,158,11,0.1)] transition-all disabled:opacity-50"
                />
              </div>
            )}

            {mode === 'practice' && (q.type === 'numerical' || q.type === 'integer') && revealed[currentIndex] && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mt-4 p-4 rounded-xl border max-w-sm",
                  answers[currentIndex] === q.correct_answer 
                    ? "bg-success/10 border-success/30 text-success" 
                    : "bg-danger/10 border-danger/30 text-danger"
                )}
              >
                <div className="text-sm font-semibold mb-1">
                  {answers[currentIndex] === q.correct_answer ? "Correct!" : "Incorrect"}
                </div>
                <div className="text-sm">
                  Correct Answer: <span className="font-bold">{q.correct_answer}</span>
                </div>
              </motion.div>
            )}

            {mode === 'practice' && !revealed[currentIndex] && (
              <Button 
                onClick={() => setRevealed(prev => ({...prev, [currentIndex]: true}))}
                disabled={answers[currentIndex] === undefined || answers[currentIndex] === ''}
                className="mt-8 bg-primary text-black hover:bg-primary/90"
              >
                Check Answer
              </Button>
            )}

            {mode === 'practice' && revealed[currentIndex] && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-5 rounded-xl bg-surface-2 border border-border"
              >
                <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-lg">💡</span> Explanation
                </div>
                <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                  {q.explanation || "No explanation provided."}
                </div>
              </motion.div>
            )}
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="p-4 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-between sticky bottom-0 z-10 shrink-0">
            <Button variant="ghost" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
              <ArrowLeft className="w-4 h-4" /> Prev
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="hidden sm:flex" onClick={handleClear} disabled={answers[currentIndex] === undefined}>
                Clear
              </Button>
              <Button 
                variant="outline" 
                onClick={handleMarkReview}
                className={cn(marked[currentIndex] && "border-amber-500 text-amber-500 hover:bg-amber-500/10")}
              >
                <Flag className="w-4 h-4" /> <span className="hidden sm:inline">Mark for Review</span>
              </Button>
              <Button className="md:hidden ml-2" variant="outline" onClick={() => setIsMobileDrawerOpen(true)}>
                Grid
              </Button>
            </div>

            {currentIndex === questions.length - 1 ? (
              <Button onClick={() => setIsSubmitModalOpen(true)} className="bg-success text-black hover:bg-success/90">
                Submit Test
              </Button>
            ) : (
              <Button onClick={() => setCurrentIndex(currentIndex + 1)}>
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[110]" onClick={() => setIsMobileDrawerOpen(false)} />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed bottom-0 left-0 right-0 bg-surface-2 border-t border-border rounded-t-2xl p-6 z-[120] max-h-[70vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Questions</h3>
                <button onClick={() => setIsMobileDrawerOpen(false)}><X className="text-muted w-6 h-6" /></button>
              </div>
              <div className="grid grid-cols-5 gap-3 overflow-y-auto custom-scrollbar pb-4">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentIndex(i); setIsMobileDrawerOpen(false); }}
                    className={cn(
                      "h-12 rounded-lg text-sm font-semibold transition-all",
                      currentIndex === i ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-2" : "",
                      marked[i] ? "bg-amber-500/20 text-amber-500 border border-amber-500/50" :
                      answers[i] !== undefined ? "bg-success/20 text-success border border-success/50" :
                      "bg-surface border border-border text-muted"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SUBMIT MODAL */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Submit Test?</h2>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-2 p-3 rounded-xl text-center border border-success/20">
            <div className="text-2xl font-bold text-success">{answeredCount}</div>
            <div className="text-xs text-muted font-medium mt-1 uppercase">Answered</div>
          </div>
          <div className="bg-surface-2 p-3 rounded-xl text-center border border-amber-500/20">
            <div className="text-2xl font-bold text-amber-500">{markedCount}</div>
            <div className="text-xs text-muted font-medium mt-1 uppercase">Marked</div>
          </div>
          <div className="bg-surface-2 p-3 rounded-xl text-center border border-border">
            <div className="text-2xl font-bold text-white">{unansweredCount}</div>
            <div className="text-xs text-muted font-medium mt-1 uppercase">Unanswered</div>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div className="p-3 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm text-center">
            ⚠️ You still have {unansweredCount} unanswered questions!
          </div>
        )}

        {markedCount > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white mb-3">Flagged for Review:</h3>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
              {questions.map((_, i) => marked[i] ? (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentIndex(i)
                    setIsSubmitModalOpen(false)
                  }}
                  className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 text-sm font-bold flex items-center justify-center transition-colors"
                >
                  {i + 1}
                </button>
              ) : null)}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setIsSubmitModalOpen(false)}>Continue Attempt</Button>
          <Button className="flex-1 bg-danger hover:bg-danger/90 text-white" onClick={handleSubmitTest} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Yes, Submit'}
          </Button>
        </div>
      </Modal>

    </div>
  )
}
