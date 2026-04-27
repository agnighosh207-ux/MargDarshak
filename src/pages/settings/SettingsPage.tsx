import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useUser, useClerk } from '@clerk/clerk-react'
import { Camera, Check, X, Loader2, LogOut, AlertTriangle, User, Bell, Shield, Target } from 'lucide-react'

import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ui/Toast'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { cn } from '../../lib/utils'

const EXAM_GROUPS = [
  {
    category: 'Engineering',
    exams: [
      { id: 'JEE_MAIN', name: 'JEE Main', month: 1 },
      { id: 'JEE_ADV', name: 'JEE Advanced', month: 5 },
      { id: 'BITSAT', name: 'BITSAT', month: 5 },
      { id: 'VITEEE', name: 'VITEEE', month: 4 }
    ]
  },
  {
    category: 'Medical',
    exams: [
      { id: 'NEET', name: 'NEET UG', month: 5 },
      { id: 'AIIMS', name: 'AIIMS', month: 5 }
    ]
  },
  {
    category: 'Management',
    exams: [
      { id: 'CAT', name: 'CAT', month: 11 },
      { id: 'XAT', name: 'XAT', month: 1 }
    ]
  },
  {
    category: 'Law & Others',
    exams: [
      { id: 'CLAT', name: 'CLAT', month: 12 },
      { id: 'CUET', name: 'CUET', month: 5 },
      { id: 'NDA', name: 'NDA', month: 4 }
    ]
  }
]

export function SettingsPage() {
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  const { profile, refreshProfile } = useProfile()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'Profile' | 'Exam Settings' | 'Account' | 'Notifications'>('Profile')

  // --- PROFILE TAB STATE ---
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [savedProfileTime, setSavedProfileTime] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setUsername(profile.username || '')
    }
  }, [profile])

  useEffect(() => {
    if (!username || username === profile?.username) {
      setUsernameStatus('idle')
      return
    }
    const checkUsername = async () => {
      setUsernameStatus('checking')
      const { data } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).single()
      if (data && data.id !== profile?.id) {
        setUsernameStatus('taken')
      } else {
        setUsernameStatus('available')
      }
    }
    const timer = setTimeout(checkUsername, 500)
    return () => clearTimeout(timer)
  }, [username, profile?.username, profile?.id])

  const handleSaveProfile = async () => {
    if (!profile) return
    setIsSavingProfile(true)
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      username: username.toLowerCase()
    }).eq('id', profile.id)

    setIsSavingProfile(false)
    if (!error) {
      refreshProfile()
      setSavedProfileTime(Date.now())
      setTimeout(() => setSavedProfileTime(null), 2000)
    } else {
      toast({ type: 'error', title: 'Failed to save profile' })
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    
    try {
      setUploadProgress(10)
      const fileExt = file.name.split('.').pop()
      const filePath = `${profile.id}/avatar.${fileExt}`
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      setUploadProgress(60)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setUploadProgress(90)

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
      setUploadProgress(100)
      
      refreshProfile()
      toast({ type: 'success', title: 'Photo updated!' })
    } catch (err) {
      toast({ type: 'error', title: 'Failed to upload photo' })
    } finally {
      setTimeout(() => setUploadProgress(null), 1000)
    }
  }

  // --- EXAM SETTINGS STATE ---
  const [targetExams, setTargetExams] = useState<string[]>([])
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear() + 1)
  
  // Local storage settings
  const [prefDifficulty, setPrefDifficulty] = useState(3)
  const [prefDuration, setPrefDuration] = useState(60)

  useEffect(() => {
    if (profile) {
      setTargetExams(profile.target_exams || [])
      setTargetYear((profile as any).target_year || new Date().getFullYear() + 1)
    }
    const diff = localStorage.getItem('marg_pref_diff')
    const dur = localStorage.getItem('marg_pref_dur')
    if (diff) setPrefDifficulty(Number(diff))
    if (dur) setPrefDuration(Number(dur))
  }, [profile])

  const handleSaveExamPrefs = async () => {
    if (!profile) return
    await supabase.from('profiles').update({ target_exams: targetExams, target_year: targetYear }).eq('id', profile.id)
    localStorage.setItem('marg_pref_diff', prefDifficulty.toString())
    localStorage.setItem('marg_pref_dur', prefDuration.toString())
    refreshProfile()
    toast({ type: 'success', title: 'Exam preferences saved!' })
  }

  // Countdown logic
  const daysToExam = useMemo(() => {
    if (targetExams.length === 0) return 0
    let minDays = Infinity
    const now = new Date()
    
    targetExams.forEach(examId => {
      let examMonth = 1
      EXAM_GROUPS.forEach(g => {
        const f = g.exams.find(e => e.id === examId)
        if (f) examMonth = f.month
      })
      let examDate = new Date(targetYear, examMonth - 1, 15)
      if (examDate < now) examDate = new Date(targetYear + 1, examMonth - 1, 15)
      
      const diff = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diff > 0 && diff < minDays) minDays = diff
    })
    return minDays === Infinity ? 0 : minDays
  }, [targetExams, targetYear])

  // --- NOTIFICATIONS STATE ---
  const [notifs, setNotifs] = useState({
    dailyReminder: false,
    reminderTime: '18:00',
    testSummary: true,
    streakAlerts: true,
    weeklyReport: false
  })

  useEffect(() => {
    const s = localStorage.getItem('marg_notifs')
    if (s) setNotifs(JSON.parse(s))
  }, [])

  const updateNotif = (key: string, val: any) => {
    const updated = { ...notifs, [key]: val }
    setNotifs(updated)
    localStorage.setItem('marg_notifs', JSON.stringify(updated))
  }

  // --- ACCOUNT STATE ---
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [isSignOutOpen, setIsSignOutOpen] = useState(false)

  const handleDeleteConfirm = () => {
    toast({ type: 'info', title: 'Account Deletion Requested', description: 'Please contact support@margdarshak.com from your registered email to permanently delete your account.' })
    setIsDeleteOpen(false)
  }

  const TABS = [
    { id: 'Profile', icon: User },
    { id: 'Exam Settings', icon: Target },
    { id: 'Account', icon: Shield },
    { id: 'Notifications', icon: Bell }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>

      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar border-b border-white/10">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={cn(
              "relative px-4 py-3 text-sm font-semibold transition-all outline-none flex items-center gap-2 whitespace-nowrap",
              activeTab === t.id ? "text-primary" : "text-muted hover:text-white"
            )}
          >
            <t.icon className="w-4 h-4" />
            <span className="relative z-10">{t.id}</span>
            {activeTab === t.id && (
              <motion.div layoutId="settings-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        
        {/* =========================================
            PROFILE TAB 
            ========================================= */}
        {activeTab === 'Profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl bg-surface border border-border rounded-2xl p-6 lg:p-8 space-y-8">
            <div className="flex flex-col items-center">
              <div className="relative group w-24 h-24">
                <div className="w-full h-full rounded-full border-2 border-primary overflow-hidden bg-surface-2 flex items-center justify-center relative">
                  {profile?.avatar_url || user?.imageUrl ? (
                    <img src={profile?.avatar_url || user?.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary">{profile?.full_name?.charAt(0) || user?.firstName?.charAt(0) || 'U'}</span>
                  )}
                  {uploadProgress !== null && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-xs font-bold text-primary">{uploadProgress}%</div>
                    </div>
                  )}
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              <Button variant="ghost" className="mt-4 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploadProgress !== null}>
                <Camera className="w-4 h-4 mr-2" /> Change Photo
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Username</label>
                <div className="relative">
                  <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} className="w-full bg-[#0a0c14] border border-border rounded-lg px-4 py-3 text-white input-glow pr-12" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-muted animate-spin" />}
                    {usernameStatus === 'available' && <Check className="w-4 h-4 text-success" />}
                    {usernameStatus === 'taken' && <X className="w-4 h-4 text-danger" />}
                  </div>
                </div>
                {usernameStatus === 'taken' && <p className="text-xs text-danger mt-1">This username is already taken.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Email Address</label>
                <input type="email" value={user?.primaryEmailAddress?.emailAddress || ''} disabled className="w-full bg-surface-2 border border-white/5 rounded-lg px-4 py-3 text-muted cursor-not-allowed opacity-70" />
                <p className="text-xs text-muted mt-2 italic">Email is securely managed by Clerk authentication.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSavingProfile || usernameStatus === 'checking' || usernameStatus === 'taken'}>
                {savedProfileTime ? <><Check className="w-4 h-4 mr-2" /> Saved!</> : isSavingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* =========================================
            EXAM SETTINGS TAB 
            ========================================= */}
        {activeTab === 'Exam Settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
            
            <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 flex items-center justify-between overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Nearest Target Exam</h3>
                <div className="text-3xl font-bold text-white flex items-center gap-3">
                  📅 <AnimatedNumber value={daysToExam} /> <span className="text-xl font-normal text-muted">days to go</span>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Your Exam Targets</h3>
                <div className="space-y-6">
                  {EXAM_GROUPS.map(group => (
                    <div key={group.category}>
                      <h4 className="text-xs font-semibold text-muted mb-3 uppercase tracking-wider">{group.category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {group.exams.map(exam => {
                          const isSelected = targetExams.includes(exam.id)
                          return (
                            <button
                              key={exam.id}
                              onClick={() => setTargetExams(prev => isSelected ? prev.filter(e => e !== exam.id) : [...prev, exam.id])}
                              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all border", isSelected ? "bg-primary/10 border-primary text-primary" : "bg-surface-2 border-transparent text-muted hover:border-white/20 hover:text-white")}
                            >
                              {exam.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Target Year</h3>
                <div className="flex flex-wrap gap-2">
                  {[2026, 2027, 2028, 2029].map(y => (
                    <button
                      key={y}
                      onClick={() => setTargetYear(y)}
                      className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all border", targetYear === y ? "bg-primary text-black border-primary" : "bg-surface-2 border-transparent text-muted hover:border-white/20")}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-bold text-white mb-4">Question Difficulty Preference</h3>
                <div className="px-2">
                  <input type="range" min="1" max="5" step="1" value={prefDifficulty} onChange={e => setPrefDifficulty(Number(e.target.value))} className="w-full accent-primary h-2 bg-surface-2 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs font-medium text-muted mt-3">
                    <span className={cn(prefDifficulty === 1 && "text-primary")}>Easy</span>
                    <span className={cn(prefDifficulty === 2 && "text-primary")}>Medium</span>
                    <span className={cn(prefDifficulty === 3 && "text-primary")}>Hard</span>
                    <span className={cn(prefDifficulty === 4 && "text-primary")}>Very Hard</span>
                    <span className={cn(prefDifficulty === 5 && "text-primary")}>Extreme</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-bold text-white mb-4">Default Test Duration</h3>
                <div className="flex gap-2">
                  {[30, 60, 180].map(m => (
                    <button
                      key={m}
                      onClick={() => setPrefDuration(m)}
                      className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all border", prefDuration === m ? "bg-primary text-black border-primary" : "bg-surface-2 border-transparent text-muted")}
                    >
                      {m === 180 ? '3 hours' : `${m} min`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button onClick={handleSaveExamPrefs}>Save Preferences</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================
            ACCOUNT TAB 
            ========================================= */}
        {activeTab === 'Account' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Email Address</h3>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 rounded-lg border border-white/5 text-white text-sm">
                  <Shield className="w-4 h-4 text-success" />
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-bold text-white mb-2">Change Password</h3>
                <p className="text-sm text-muted mb-4">Your password is securely managed by Clerk authentication. Click below to manage your credentials.</p>
                <Button variant="outline" onClick={() => openUserProfile()}>Change Password →</Button>
              </div>
            </div>

            <div className="bg-[#1a0f14] border border-danger/30 rounded-2xl p-6 lg:p-8 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-danger/10 rounded-full blur-[40px] pointer-events-none" />
              <h3 className="text-lg font-bold text-danger flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h3>
              <p className="text-sm text-danger/80">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <Button variant="outline" className="border-danger/50 text-danger hover:bg-danger/10" onClick={() => setIsDeleteOpen(true)}>Delete Account</Button>
            </div>

            <div className="pt-4 flex justify-start">
              <Button variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setIsSignOutOpen(true)}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </motion.div>
        )}

        {/* =========================================
            NOTIFICATIONS TAB 
            ========================================= */}
        {activeTab === 'Notifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl bg-surface border border-border rounded-2xl p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div>
                <div className="font-semibold text-white">Daily Study Reminder</div>
                <div className="text-sm text-muted">Get a nudge to keep your streak alive.</div>
              </div>
              <div className="flex items-center gap-4">
                {notifs.dailyReminder && (
                  <input type="time" value={notifs.reminderTime} onChange={e => updateNotif('reminderTime', e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1 text-sm text-white [color-scheme:dark]" />
                )}
                <CustomToggle checked={notifs.dailyReminder} onChange={v => updateNotif('dailyReminder', v)} />
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div>
                <div className="font-semibold text-white">Test Completion Summary</div>
                <div className="text-sm text-muted">Receive AI analysis after completing a mock test.</div>
              </div>
              <CustomToggle checked={notifs.testSummary} onChange={v => updateNotif('testSummary', v)} />
            </div>

            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div>
                <div className="font-semibold text-white">Streak Alerts</div>
                <div className="text-sm text-muted">Warnings when you are about to lose your streak.</div>
              </div>
              <CustomToggle checked={notifs.streakAlerts} onChange={v => updateNotif('streakAlerts', v)} />
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <div className="font-semibold text-white">Weekly Progress Report</div>
                <div className="text-sm text-muted">A comprehensive email summary every Sunday.</div>
              </div>
              <CustomToggle checked={notifs.weeklyReport} onChange={v => updateNotif('weeklyReport', v)} />
            </div>
          </motion.div>
        )}

      </div>

      {/* Account Modals */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} className="max-w-md p-6">
        <h3 className="text-2xl font-bold text-white mb-2">Delete Account</h3>
        <p className="text-sm text-muted mb-6">Type <strong className="text-white select-none">DELETE MY ACCOUNT</strong> below to confirm.</p>
        <input type="text" value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="Type here..." className="w-full bg-[#0a0c14] border border-danger/30 rounded-lg px-4 py-3 text-white mb-6 focus:border-danger outline-none transition-colors" />
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
          <Button className="flex-1 bg-danger hover:bg-danger/90 text-white" disabled={deleteText !== 'DELETE MY ACCOUNT'} onClick={handleDeleteConfirm}>Delete Data</Button>
        </div>
      </Modal>

      <Modal isOpen={isSignOutOpen} onClose={() => setIsSignOutOpen(false)} className="max-w-sm p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Sign Out</h3>
        <p className="text-sm text-muted mb-6">Are you sure you want to sign out?</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setIsSignOutOpen(false)}>Cancel</Button>
          <Button className="flex-1" onClick={() => signOut()}>Sign Out</Button>
        </div>
      </Modal>

    </div>
  )
}

function CustomToggle({ checked, onChange }: { checked: boolean, onChange: (c: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!checked)}
      className={cn("w-10 h-6 rounded-full flex items-center p-1 transition-colors duration-200", checked ? "bg-primary" : "bg-surface-2 border border-border")}
    >
      <div className={cn("w-4 h-4 rounded-full transition-transform duration-200", checked ? "bg-black translate-x-4" : "bg-muted translate-x-0")} />
    </button>
  )
}
