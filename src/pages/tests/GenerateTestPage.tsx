import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { askGroq } from '../../lib/groq'
import { useToast } from '../../components/ui/Toast'
import { MagneticButton } from '../../components/ui/MagneticButton'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { cn } from '../../lib/utils'

export function GenerateTestPage() {
  const { profile, checkLimit } = useProfile()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [exam, setExam] = useState(profile?.target_exams?.length === 1 ? profile.target_exams[0] : '')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('Medium')
  const [count, setCount] = useState(10)
  const [type, setType] = useState('MCQ')
  const [testName, setTestName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [testMode, setTestMode] = useState<'practice' | 'exam'>('practice')
  const [examDuration, setExamDuration] = useState(60) // in minutes
  const [pyqEnabled, setPyqEnabled] = useState(false)

  // Custom difficulty distribution
  const [diffEasy, setDiffEasy] = useState(33)
  const [diffMed, setDiffMed] = useState(34)
  const [diffHard, setDiffHard] = useState(33)

  const [examSubjects, setExamSubjects] = useState<string[]>([])

  useEffect(() => {
    if (profile?.target_exams && profile.target_exams.length === 1 && !exam) {
      setExam(profile.target_exams[0])
    }
  }, [profile, exam])

  useEffect(() => {
    async function loadSubjects() {
      if (!exam) return
      const { data } = await supabase.from('exams').select('subjects').eq('code', exam).single()
      if (data?.subjects) {
        setExamSubjects(data.subjects)
        if (data.subjects.length > 0) setSubject(data.subjects[0])
      }
    }
    loadSubjects()
  }, [exam])

  const derivedTestName = testName || (subject && topic ? `${subject} - ${topic} Test` : '')

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleGenerate = async () => {
    if (!profile) return
    if (!exam || !subject || !topic) {
      toast({ type: 'error', title: 'Missing fields', description: 'Please fill out exam, subject, and topic.' })
      return
    }

    const { allowed } = await checkLimit('test')
    if (!allowed) {
      setShowUpgradeModal(true)
      return
    }

    setIsGenerating(true)

    let diffString = difficulty
    if (difficulty === 'Custom') {
      diffString = `${diffEasy}% Easy, ${diffMed}% Medium, ${diffHard}% Hard`
    }

    const pyqString = pyqEnabled 
      ? `Generate questions similar to actual previous year ${exam} questions from 2019-2024. Include the year and paper reference in explanation if possible.` 
      : ''

    try {
      const systemPrompt = `You are an expert ${subject} teacher for ${exam} exam preparation in India.
Generate exactly ${count} questions on: "${topic}".
Difficulty: ${diffString}. Type: ${type}.
Follow the exact marking scheme for ${exam}.
${pyqString}

Return ONLY a valid JSON array, no markdown, no explanation, no extra text:
[
  {
    "id": "q1",
    "question": "Full question text",
    "type": "mcq",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct_answer": "A",
    "explanation": "Detailed explanation of why this is correct",
    "marks": 4,
    "negative_marks": -1,
    "chapter": "${topic}",
    "difficulty": "${difficulty.toLowerCase()}"
  }
]
For numerical type: omit options, correct_answer is the numeric value as string.
For mixed: include both mcq and numerical questions.`

      const raw = await askGroq([{
        role: 'user',
        content: `Generate ${count} ${difficulty} ${type} questions on topic: "${topic}" for ${exam}`
      }], systemPrompt)

      const cleaned = raw.replace(/```json\n?|```\n?/g, '').trim()
      const startIdx = cleaned.indexOf('[')
      const endIdx = cleaned.lastIndexOf(']')
      
      if (startIdx === -1 || endIdx === -1) {
        throw new Error('Invalid JSON format received from AI')
      }
      
      const questions = JSON.parse(cleaned.substring(startIdx, endIdx + 1))

      const { data, error } = await supabase.from('mock_tests').insert({
        user_id: profile.id,
        test_name: derivedTestName || `${subject} - ${topic} Test`,
        exam_code: exam,
        subject,
        topic,
        questions,
        status: 'pending'
      }).select().single()

      if (error) throw error

      toast({ type: 'success', title: `Test generated! ${questions.length} questions ready 📝` })
      navigate(`/tests/${data.id}`, { state: { mode: testMode, duration: testMode === 'exam' ? examDuration : null } })

    } catch (err) {
      console.error(err)
      toast({ type: 'error', title: 'Generation failed', description: 'The AI failed to generate the test. Please try again.' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateQuick = async () => {
    if (!profile) return
    const { allowed } = await checkLimit('test')
    if (!allowed) {
      setShowUpgradeModal(true)
      return
    }

    // Use generic subjects if exam/subject not set
    const quickExam = exam || (profile?.target_exams?.[0] || 'JEE')
    const quickSubject = subject || (examSubjects.length > 0 ? examSubjects[0] : 'Physics')
    const quickTopic = topic || 'Mixed Concepts'

    setIsGenerating(true)

    try {
      const systemPrompt = `You are an expert ${quickSubject} teacher for ${quickExam} exam preparation in India.
Generate exactly 5 questions on: "${quickTopic}".
Difficulty: Medium. Type: MCQ.
Follow the exact marking scheme for ${quickExam}.

Return ONLY a valid JSON array, no markdown, no explanation, no extra text:
[
  {
    "id": "q1",
    "question": "Full question text",
    "type": "mcq",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct_answer": "A",
    "explanation": "Detailed explanation of why this is correct",
    "marks": 4,
    "negative_marks": -1,
    "chapter": "${quickTopic}",
    "difficulty": "medium"
  }
]`
      const raw = await askGroq([{
        role: 'user',
        content: `Generate 5 Medium MCQ questions on topic: "${quickTopic}" for ${quickExam}`
      }], systemPrompt)

      const cleaned = raw.replace(/```json\n?|```\n?/g, '').trim()
      const startIdx = cleaned.indexOf('[')
      const endIdx = cleaned.lastIndexOf(']')
      
      if (startIdx === -1 || endIdx === -1) throw new Error('Invalid JSON format received from AI')
      
      const questions = JSON.parse(cleaned.substring(startIdx, endIdx + 1))

      const { data, error } = await supabase.from('mock_tests').insert({
        user_id: profile.id,
        test_name: `Quick Warm-up: ${quickSubject}`,
        exam_code: quickExam,
        subject: quickSubject,
        topic: quickTopic,
        questions,
        status: 'pending'
      }).select().single()

      if (error) throw error

      toast({ type: 'success', title: `Warm-up generated! ⚡` })
      navigate(`/tests/${data.id}`, { state: { mode: 'practice' } })

    } catch (err) {
      console.error(err)
      toast({ type: 'error', title: 'Generation failed' })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-6 lg:p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Test Generator</h1>
          <p className="text-muted mt-2">Configure parameters and let MargDarshak AI build a tailored mock test.</p>
        </div>

        <div className="mb-8">
          <Button 
            onClick={handleGenerateQuick} 
            disabled={isGenerating}
            className="w-full py-4 text-lg bg-surface-2 border border-accent text-accent hover:bg-accent/10 shadow-[0_0_15px_rgba(99,102,241,0.2)] font-bold transition-all"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2 inline" /> : null}
            ⚡ Quick 5 min warm-up — abhi shuru karo
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Target Exam</label>
              <div className="flex flex-wrap gap-2">
                {profile?.target_exams?.map(e => (
                  <button
                    key={e}
                    onClick={() => setExam(e)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all outline-none",
                      exam === e ? "bg-primary text-black" : "bg-[#0a0c14] border border-border text-muted hover:border-primary/50"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {examSubjects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Subject</label>
                <div className="flex flex-wrap gap-2">
                  {examSubjects.map(s => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all outline-none",
                        subject === s ? "bg-indigo-500 text-white" : "bg-[#0a0c14] border border-border text-muted hover:border-indigo-500/50"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">Topic / Chapter</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Rotational Motion, Electrochemistry" 
              className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow"
            />
          </div>

          {/* Test Mode & PYQ Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-2 p-4 rounded-xl border border-white/5">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Test Mode</label>
              <div className="flex bg-[#0a0c14] border border-border rounded-lg p-1">
                <button
                  onClick={() => setTestMode('practice')}
                  className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-colors", testMode === 'practice' ? "bg-primary text-black" : "text-muted hover:text-white")}
                >
                  Practice Mode
                </button>
                <button
                  onClick={() => setTestMode('exam')}
                  className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-colors", testMode === 'exam' ? "bg-primary text-black" : "text-muted hover:text-white")}
                >
                  Exam Mode
                </button>
              </div>
            </div>

            {testMode === 'exam' && (
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Duration</label>
                <select 
                  value={examDuration} 
                  onChange={e => setExamDuration(Number(e.target.value))}
                  className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-2 text-sm text-white"
                >
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>120 min</option>
                  <option value={180}>180 min (Custom)</option>
                </select>
              </div>
            )}

            <div className={testMode === 'practice' ? "md:col-span-1" : "md:col-span-2"}>
              <label className="flex items-center gap-3 cursor-pointer mt-1">
                <div className={cn("w-10 h-6 rounded-full p-1 transition-colors relative", pyqEnabled ? "bg-primary" : "bg-muted")}>
                  <motion.div 
                    initial={false}
                    animate={{ x: pyqEnabled ? 16 : 0 }}
                    className="w-4 h-4 bg-white rounded-full shadow"
                  />
                </div>
                <input type="checkbox" className="hidden" checked={pyqEnabled} onChange={e => setPyqEnabled(e.target.checked)} />
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <span className="text-xl">📚</span>
                  Use Previous Year Questions (2019-2024)
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Difficulty</label>
              <div className="flex flex-col gap-2">
                {['Easy', 'Medium', 'Hard', 'Mixed', 'Custom'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all text-left outline-none",
                      difficulty === d ? "bg-surface-2 border border-primary text-primary" : "bg-[#0a0c14] border border-border text-muted hover:border-primary/30"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {difficulty === 'Custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-[#0a0c14] rounded-xl border border-border space-y-4 overflow-hidden"
                  >
                    <label className="block text-xs font-medium text-muted mb-2 text-center">Must sum to 100%</label>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span>Easy</span><span>{diffEasy}%</span></div>
                      <input type="range" min="0" max="100" value={diffEasy} onChange={e => {
                        const val = parseInt(e.target.value);
                        setDiffEasy(val);
                        const remaining = 100 - val;
                        const ratio = diffMed + diffHard > 0 ? diffMed / (diffMed + diffHard) : 0.5;
                        setDiffMed(Math.round(remaining * ratio));
                        setDiffHard(remaining - Math.round(remaining * ratio));
                      }} className="w-full accent-success" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span>Medium</span><span>{diffMed}%</span></div>
                      <input type="range" min="0" max="100" value={diffMed} onChange={e => {
                        const val = parseInt(e.target.value);
                        setDiffMed(val);
                        const remaining = 100 - val;
                        const ratio = diffEasy + diffHard > 0 ? diffEasy / (diffEasy + diffHard) : 0.5;
                        setDiffEasy(Math.round(remaining * ratio));
                        setDiffHard(remaining - Math.round(remaining * ratio));
                      }} className="w-full accent-amber-500" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span>Hard</span><span>{diffHard}%</span></div>
                      <input type="range" min="0" max="100" value={diffHard} onChange={e => {
                        const val = parseInt(e.target.value);
                        setDiffHard(val);
                        const remaining = 100 - val;
                        const ratio = diffEasy + diffMed > 0 ? diffEasy / (diffEasy + diffMed) : 0.5;
                        setDiffEasy(Math.round(remaining * ratio));
                        setDiffMed(remaining - Math.round(remaining * ratio));
                      }} className="w-full accent-danger" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">Question Count</label>
              <div className="flex flex-col gap-2">
                {[5, 10, 15, 20].map(c => (
                  <button
                    key={c}
                    onClick={() => setCount(c)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all text-left outline-none",
                      count === c ? "bg-surface-2 border border-primary text-primary" : "bg-[#0a0c14] border border-border text-muted hover:border-primary/30"
                    )}
                  >
                    {c} Questions
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">Type</label>
              <div className="flex flex-col gap-2">
                {['MCQ', 'Numerical', 'Mixed'].map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all text-left outline-none",
                      type === t ? "bg-surface-2 border border-primary text-primary" : "bg-[#0a0c14] border border-border text-muted hover:border-primary/30"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">Test Name</label>
            <input 
              type="text" 
              value={testName}
              placeholder={subject && topic ? `${subject} - ${topic} Test` : "Give your test a name..."}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow"
            />
          </div>

          <div className="pt-6">
            <MagneticButton className="w-full block">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !exam || !subject || !topic}
                className="w-full py-4 text-lg shadow-[0_0_30px_rgba(245,158,11,0.25)]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> 
                    Generating {count} questions...
                  </>
                ) : (
                  <>🤖 Generate with AI</>
                )}
              </Button>
            </MagneticButton>
          </div>
        </div>
      </motion.div>

      <Modal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} className="w-full max-w-md p-8 text-center bg-surface border border-primary/30 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🚀</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Upgrade to Pro</h2>
        <p className="text-muted leading-relaxed mb-8">
          Arre beta, free limit khatam ho gayi! Pro plan lo aur unlimited karo — sirf ₹499/month 🚀
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
