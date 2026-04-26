import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowLeft, Loader2, Sparkles, Copy, CheckCircle2, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { askGroq } from '../../lib/groq'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { ScoreGauge } from '../../components/ui/ScoreGauge'
import { Button } from '../../components/ui/Button'
import { cn } from '../../lib/utils'

export function TestResultPage() {
  const { id } = useParams()
  const { profile } = useProfile()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [test, setTest] = useState<any>(null)
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [expandedQs, setExpandedQs] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)

  const generateAiAnalysis = async (testData: any) => {
    setAnalyzing(true)
    try {
      const answers = testData.answers || {}
      const qs = testData.questions || []
      
      const wrongChapters = new Set<string>()
      qs.forEach((q: any, i: number) => {
        const ans = answers[i]
        if (ans && ans !== q.correct_answer && !ans.startsWith(q.correct_answer)) {
          wrongChapters.add(q.chapter)
        }
      })

      const sysPrompt = "You are an expert exam coach. In 3 concise sentences, analyze this test performance and give highly actionable advice. Be encouraging but direct."
      const userMsg = `Exam: ${testData.exam_code}, Subject: ${testData.subject}. Score: ${testData.score}/${testData.total_marks}. Accuracy: ${testData.accuracy}%. Weak areas identified: ${Array.from(wrongChapters).join(', ') || 'None specifically'}.`

      const res = await askGroq([{ role: 'user', content: userMsg }], sysPrompt)
      setAiAnalysis(res)
    } catch (err) {
      console.error(err)
      setAiAnalysis("Could not generate AI analysis at this time.")
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    async function loadTest() {
      if (!profile || !id) return
      const { data, error } = await supabase.from('mock_tests').select('*').eq('id', id).eq('user_id', profile.id).single()
      if (error || !data) {
        navigate('/tests')
        return
      }
      setTest(data)
      setLoading(false)

      if (data.status === 'completed' && !aiAnalysis) {
        generateAiAnalysis(data)
      }
    }
    loadTest()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile, navigate])

  const toggleQ = (index: number) => {
    setExpandedQs(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`I just scored ${test.score}/${test.total_marks} (${Number(test.accuracy).toFixed(1)}% accuracy) on a ${test.exam_code} ${test.subject} test using MargDarshak AI!`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !test) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const acc = Number(test.accuracy || 0)
  const subtitle = acc > 85 ? 'Exceptional Performance!' : acc > 70 ? 'Good Job!' : 'Keep Practicing!'
  
  const answers = test.answers || {}
  const qs = test.questions || []
  
  let correct = 0
  let wrong = 0
  qs.forEach((q: any, i: number) => {
    const ans = answers[i]
    if (!ans) return
    if (ans === q.correct_answer || ans.startsWith(q.correct_answer)) correct++
    else wrong++
  })
  const unattempted = qs.length - (correct + wrong)

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* HEADER ACTIONS */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/tests')} className="px-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tests
        </Button>
        <div className="text-sm font-semibold text-muted bg-surface-2 px-3 py-1 rounded-full border border-border">
          {test.test_name}
        </div>
      </div>

      {/* HERO SCORE */}
      <div className="bg-surface border border-border rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <ScoreGauge score={acc} size={200} label="Accuracy" />
        
        <h2 className="text-2xl font-bold text-white mt-6 mb-2">{subtitle}</h2>
        <p className="text-muted text-center max-w-sm">
          You scored <span className="font-bold text-white">{test.score}</span> out of {test.total_marks} marks in {test.time_taken_seconds ? Math.floor(test.time_taken_seconds/60) : 0} minutes.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 w-full max-w-2xl">
          <div className="bg-surface-2 border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary"><AnimatedNumber value={test.score} /></div>
            <div className="text-xs text-muted uppercase tracking-wider font-semibold mt-1">Score</div>
          </div>
          <div className="bg-surface-2 border border-success/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-success"><AnimatedNumber value={correct} /></div>
            <div className="text-xs text-success/70 uppercase tracking-wider font-semibold mt-1">Correct</div>
          </div>
          <div className="bg-surface-2 border border-danger/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-danger"><AnimatedNumber value={wrong} /></div>
            <div className="text-xs text-danger/70 uppercase tracking-wider font-semibold mt-1">Wrong</div>
          </div>
          <div className="bg-surface-2 border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white"><AnimatedNumber value={unattempted} /></div>
            <div className="text-xs text-muted uppercase tracking-wider font-semibold mt-1">Skipped</div>
          </div>
        </div>
      </div>

      {/* AI ANALYSIS */}
      <div className="bg-surface border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500" />
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" /> AI Coach Analysis
        </h3>
        
        <div className="text-sm text-muted leading-relaxed prose prose-invert max-w-none">
          {analyzing ? (
            <div className="flex items-center gap-3 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing your performance...</span>
            </div>
          ) : (
            <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
          )}
        </div>
      </div>

      {/* QUESTION REVIEW */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white px-2">Detailed Review</h3>
        
        {qs.map((q: any, i: number) => {
          const ans = answers[i]
          const isAttempted = ans !== undefined
          const isCorrect = isAttempted && (ans === q.correct_answer || ans.startsWith(q.correct_answer))
          
          const borderColor = isCorrect ? 'border-l-success' : isAttempted ? 'border-l-danger' : 'border-l-muted'
          const badgeColor = isCorrect ? 'bg-success/10 text-success' : isAttempted ? 'bg-danger/10 text-danger' : 'bg-surface text-muted'
          const label = isCorrect ? 'Correct' : isAttempted ? 'Wrong' : 'Skipped'
          
          const isExpanded = expandedQs[i]

          return (
            <div key={i} className={`bg-surface border border-border border-l-4 ${borderColor} rounded-xl overflow-hidden transition-all duration-200`}>
              <button 
                onClick={() => toggleQ(i)}
                className="w-full text-left p-4 sm:p-5 flex items-start gap-4 hover:bg-surface-2/50 transition-colors outline-none"
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-sm font-bold text-white border border-border">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badgeColor}`}>
                      {label}
                    </span>
                    <span className="text-xs text-muted">{q.chapter}</span>
                  </div>
                  <p className="text-sm font-medium text-white line-clamp-2">{q.question}</p>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-muted transition-transform shrink-0 mt-1", isExpanded && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-surface-2/30"
                  >
                    <div className="p-5 sm:p-6 space-y-6">
                      <div>
                        <p className="text-sm text-white leading-relaxed mb-4 whitespace-pre-wrap">{q.question}</p>
                        
                        {q.options && (
                          <div className="space-y-2 mt-4">
                            {q.options.map((opt: string, oi: number) => {
                              const isThisCorrect = opt.startsWith(q.correct_answer)
                              const isThisSelected = ans === opt
                              
                              return (
                                <div key={oi} className={cn(
                                  "p-3 rounded-lg text-sm border flex items-start gap-3",
                                  isThisCorrect ? "bg-success/10 border-success/30 text-success font-medium" : 
                                  isThisSelected ? "bg-danger/10 border-danger/30 text-danger" : 
                                  "bg-surface border-border text-muted"
                                )}>
                                  <div className="shrink-0 font-bold w-5">{['A','B','C','D'][oi]}.</div>
                                  <div className="flex-1">{opt.replace(/^[A-D]\)\s*/, '')}</div>
                                  {isThisCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                  {isThisSelected && !isThisCorrect && <X className="w-4 h-4 shrink-0" />}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {!q.options && (
                          <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <div className="flex-1 bg-surface border border-border rounded-lg p-3">
                              <span className="text-xs text-muted block mb-1">Your Answer:</span>
                              <span className={cn("font-medium", isCorrect ? "text-success" : "text-danger")}>{ans || '--'}</span>
                            </div>
                            <div className="flex-1 bg-success/10 border border-success/30 rounded-lg p-3">
                              <span className="text-xs text-success/80 block mb-1">Correct Answer:</span>
                              <span className="font-bold text-success">{q.correct_answer}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Explanation</h4>
                        <div className="text-sm text-white/90 prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{q.explanation || "No detailed explanation provided."}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-4 pt-8">
        <Button variant="outline" className="flex-1" onClick={handleShare}>
          {copied ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Share Result</>}
        </Button>
        <Button className="flex-1" onClick={() => navigate('/tests')}>Back to Tests</Button>
      </div>

    </div>
  )
}
