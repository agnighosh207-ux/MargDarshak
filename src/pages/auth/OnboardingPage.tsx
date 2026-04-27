// ALTER TABLE profiles ADD COLUMN referral_source TEXT;
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import { useProfile } from '../../hooks/useProfile'

const EXAM_GROUPS = [
  { category: '⚙️ Engineering', exams: ['JEE Main','JEE Advanced','WBJEE','MHT CET','BITSAT','VITEEE','GATE','NEST'] },
  { category: '🩺 Medical', exams: ['NEET UG','AIIMS PG'] },
  { category: '🏛️ Civil Services & Defence', exams: ['UPSC CSE','UPSC CDS','NDA'] },
  { category: '🏦 Banking & Finance', exams: ['SBI PO','IBPS PO','RBI Grade B','CA Final','CA Inter'] },
  { category: '📚 Management', exams: ['CAT','XAT','MAT'] },
  { category: '⚖️ Law', exams: ['CLAT','AILET'] },
  { category: '🏢 Government Jobs', exams: ['SSC CGL','SSC CHSL','SSC MTS'] }
]

export function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const { refreshProfile } = useProfile()
  
  const [step, setStep] = useState(1)
  const [selectedExams, setSelectedExams] = useState<string[]>([])
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [targetYear, setTargetYear] = useState('2026')
  const [referralSource, setReferralSource] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle')

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName)
    if (user?.primaryEmailAddress?.emailAddress) {
      const suggested = user.primaryEmailAddress.emailAddress.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
      setUsername(suggested)
    }
  }, [user])

  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('id').eq('id', user.id).single()
      if (data) navigate('/dashboard', { replace: true })
    }
    if (isLoaded) checkExisting()
  }, [user, isLoaded, navigate])

  // Debounced username check
  useEffect(() => {
    if (step !== 2 || !username) return
    const timeoutId = setTimeout(async () => {
      setUsernameStatus('checking')
      const { data } = await supabase.from('profiles').select('id').eq('username', username).single()
      setUsernameStatus(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [username, step])

  const toggleExam = (exam: string) => {
    setSelectedExams(prev => prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam])
  }

  const handleComplete = async () => {
    if (!user) return
    setStep(4)
    
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      username,
      full_name: fullName,
      target_exams: selectedExams,
      target_year: parseInt(targetYear),
      referral_source: referralSource
    } as any)

    if (error) {
      console.error('Failed to create profile', error)
      alert(`Error creating profile: ${error.message}\n\nPlease make sure you have run the latest database-init.sql in your Supabase SQL editor!`)
      setStep(3)
    } else {
      await refreshProfile()
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    }
  }

  if (!isLoaded || !user) return null

  return (
    <div className="min-h-screen bg-[#0a0c14] text-text flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Simple Animated BG */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[100px] animate-pulse pointer-events-none" />
      
      <div className="w-full max-w-2xl relative z-10">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-medium text-muted mb-2 px-1">
            <span className={cn(step >= 1 ? "text-primary" : "")}>Pick Exams</span>
            <span className={cn(step >= 2 ? "text-primary" : "")}>Details</span>
            <span className={cn(step >= 3 ? "text-primary" : "")}>Target</span>
            <span className={cn(step === 4 ? "text-primary" : "")}>Ready!</span>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: '25%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Select Your Targets 🎯</h1>
                <p className="text-muted">Choose one or more exams to personalize your MargDarshak AI</p>
              </div>

              <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {EXAM_GROUPS.map(group => (
                  <div key={group.category}>
                    <h3 className="text-xs tracking-widest uppercase text-muted mb-3 font-semibold">{group.category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {group.exams.map(exam => {
                        const isSelected = selectedExams.includes(exam)
                        return (
                          <button
                            key={exam}
                            onClick={() => toggleExam(exam)}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm transition-all duration-150 flex items-center gap-2",
                              isSelected 
                                ? "bg-primary text-black font-semibold scale-[1.03] shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                                : "bg-surface-2 border border-border text-text hover:border-primary/50"
                            )}
                          >
                            {isSelected && <Check className="w-4 h-4" />}
                            {exam}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <button 
                  disabled={selectedExams.length === 0}
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-full bg-primary text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all hover:bg-amber-400"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Your Details 📝</h1>
                <p className="text-muted">Set up your profile to continue</p>
              </div>

              <div className="space-y-5 bg-surface-2 p-6 rounded-2xl border border-border">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Username</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={username} 
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className={cn(
                        "w-full bg-[#0a0c14] border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 transition-all",
                        usernameStatus === 'taken' ? "border-danger focus:border-danger focus:ring-danger" : 
                        usernameStatus === 'available' ? "border-success focus:border-success focus:ring-success" : 
                        "border-border focus:border-primary focus:ring-primary"
                      )}
                    />
                    <div className="absolute right-3 top-3">
                      {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-muted animate-spin" />}
                      {usernameStatus === 'available' && <Check className="w-5 h-5 text-success" />}
                      {usernameStatus === 'taken' && <span className="text-danger text-sm font-medium">Taken</span>}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted italic">Almost there! One last step after this.</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(1)} className="px-6 py-2.5 text-muted hover:text-white transition-colors">
                  Back
                </button>
                <button 
                  disabled={!fullName || !username || usernameStatus !== 'available'}
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-full bg-primary text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-amber-400 transition-all"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Final Step! 🎯</h1>
                <p className="text-muted">Kab aur kaise? Help us personalize your journey.</p>
              </div>

              <div className="space-y-6 bg-surface-2 p-6 rounded-2xl border border-border">
                <div>
                  <label className="block text-sm font-medium text-muted mb-3">Kab dene wale ho exam?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['2025', '2026', '2027'].map(year => (
                      <button
                        key={year}
                        onClick={() => setTargetYear(year)}
                        className={cn(
                          "py-3 rounded-xl text-sm font-bold transition-all border-2",
                          targetYear === year 
                            ? "bg-primary border-primary text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                            : "bg-[#0a0c14] border-border text-muted hover:border-primary/40"
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-3">How did you hear about us?</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {['Google Search', 'Instagram', 'Friend', 'YouTube', 'Other'].map(source => (
                      <button
                        key={source}
                        onClick={() => setReferralSource(source)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm text-left transition-all border",
                          referralSource === source 
                            ? "bg-primary/10 border-primary text-primary font-bold" 
                            : "bg-[#0a0c14] border-border text-muted hover:bg-white/5"
                        )}
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(2)} className="px-6 py-2.5 text-muted hover:text-white transition-colors">
                  Back
                </button>
                <button 
                  disabled={!targetYear || !referralSource}
                  onClick={handleComplete}
                  className="px-6 py-2.5 rounded-full bg-primary text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                >
                  Complete Setup <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                >
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" 
                    className="w-8 h-8 text-black"
                  >
                    <motion.path 
                      initial={{ pathLength: 0 }} 
                      animate={{ pathLength: 1 }} 
                      transition={{ duration: 0.5, delay: 0.4 }} 
                      strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" 
                    />
                  </motion.svg>
                </motion.div>
              </div>
              <h2 className="text-3xl font-bold mb-2">You're all set, {fullName.split(' ')[0]}! 🚀</h2>
              <p className="text-muted">Preparing your personalized dashboard...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
