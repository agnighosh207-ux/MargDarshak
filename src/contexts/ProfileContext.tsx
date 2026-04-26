import { createContext, useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'


interface Profile {
  id: string
  username: string
  email: string
  full_name: string | null
  avatar_url: string | null
  target_exams: string[]
  streak_days: number
  total_xp: number
  is_admin: boolean
  referral_code: string | null
  referred_by: string | null
  referral_count: number
  subscription_expires_at: string | null
  target_year: number | null
  parent_phone: string | null
  parent_telemetry_enabled: boolean
  plan: 'eklavya' | 'arjuna' | 'dronacharya' | 'brahmastra'
  role: 'student' | 'admin'
  streak_count: number
  streak_freeze_count: number
  last_study_date: string | null
  coins: number
  credits_cr: number
  inventory: any[]
  created_at: string
}

export const FREE_LIMITS = { tests: 12, doubts: 10 }

export interface UsageLimits {
  tests_this_month: number
  doubts_this_month: number
  plan: 'eklavya' | 'arjuna' | 'dronacharya' | 'brahmastra'
}

export interface Gamification {
  streak: number
  streakFreeze: number
  longestStreak: number
  totalXp: number
  xpToNextLevel: number
  levelName: string
}

interface ProfileContextType {
  profile: Profile | null
  profileLoading: boolean
  profileExists: boolean
  usageLimits: UsageLimits
  gamification: Gamification
  checkLimit: (feature: 'test' | 'doubt') => Promise<{ allowed: boolean; used: number; limit: number; message: string }>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshStreak: () => Promise<void>
  awardXP: (amount: number) => Promise<void>
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileExists, setProfileExists] = useState(false)
  const [usageLimits, setUsageLimits] = useState<UsageLimits>({ tests_this_month: 0, doubts_this_month: 0, plan: 'eklavya' })
  const [gamification, setGamification] = useState<Gamification>({
    streak: 0,
    streakFreeze: 0,
    longestStreak: 0,
    totalXp: 0,
    xpToNextLevel: 500,
    levelName: 'Newbie'
  })

  const getLevelName = (xp: number) => {
    if (xp < 500) return { name: "Newbie", next: 500 }
    if (xp < 1500) return { name: "Serious Aspirant", next: 1500 }
    if (xp < 3000) return { name: "Consistent Coder", next: 3000 }
    if (xp < 6000) return { name: "JEE/NEET Warrior", next: 6000 }
    return { name: "Topper Material", next: Infinity }
  }

  const refreshStreak = async (currentProfile = profile) => {
    if (!user || !currentProfile) return

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('session_date')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })
      
      if (!error && data) {
        const dates = Array.from(new Set(data.map(d => d.session_date))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        
        let currentStreak = 0
        let longestStreak = 0
        
        if (dates.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0]
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]

          let hasTodayOrYesterday = false
          if (dates[0] === todayStr || dates[0] === yesterdayStr) {
            hasTodayOrYesterday = true
          }

          if (hasTodayOrYesterday) {
            let currDate = new Date(dates[0])
            currentStreak = 1
            for (let i = 1; i < dates.length; i++) {
              currDate.setDate(currDate.getDate() - 1)
              const expectedStr = currDate.toISOString().split('T')[0]
              if (dates[i] === expectedStr) {
                currentStreak++
              } else {
                break
              }
            }
          }
          
          let tempStreak = 1
          longestStreak = 1
          for (let i = 1; i < dates.length; i++) {
            let prevDate = new Date(dates[i-1])
            prevDate.setDate(prevDate.getDate() - 1)
            const expectedStr = prevDate.toISOString().split('T')[0]
            if (dates[i] === expectedStr) {
              tempStreak++
            } else {
              tempStreak = 1
            }
            if (tempStreak > longestStreak) longestStreak = tempStreak
          }
        }

        const totalXp = currentProfile.total_xp || 0
        const level = getLevelName(totalXp)

        setGamification({
          streak: currentStreak,
          streakFreeze: currentProfile.streak_freeze_count || 0,
          longestStreak,
          totalXp,
          xpToNextLevel: level.next === Infinity ? 0 : level.next - totalXp,
          levelName: level.name
        })

        if (currentProfile.streak_days !== currentStreak) {
          await supabase.from('profiles').update({ streak_days: currentStreak }).eq('id', user.id)
          setProfile(prev => prev ? { ...prev, streak_days: currentStreak } : null)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null)
      setProfileExists(false)
      setProfileLoading(false)
      return
    }

    try {
      setProfileLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        setProfileExists(false)
        setProfile(null)
      } else {
        // Generate referral code if missing
        if (!data.referral_code) {
          const newCode = `${data.username?.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`
          await supabase.from('profiles').update({ referral_code: newCode }).eq('id', user.id)
          data.referral_code = newCode
        }

        setProfileExists(true)
        setProfile(data)
        
        const plan: UsageLimits['plan'] = data.role === 'admin' ? 'brahmastra' : (data.plan || 'eklavya')
        
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        const startIso = startOfMonth.toISOString()

        const [testsRes, doubtsRes] = await Promise.all([
          supabase.from('mock_tests').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso),
          supabase.from('doubts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso)
        ])

        setUsageLimits({
          tests_this_month: testsRes.count || 0,
          doubts_this_month: doubtsRes.count || 0,
          plan
        })

        // Refresh streak and gamification data after profile fetches
        await refreshStreak(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfileExists(false)
    } finally {
      setProfileLoading(false)
    }
  }

  const checkLimit = async (feature: 'test' | 'doubt') => {
    if (!user || !profile) return { allowed: false, used: 0, limit: 0, message: 'Not logged in' }
    
    const plan = (profile.role === 'admin' ? 'brahmastra' : (profile.plan || 'eklavya')) as UsageLimits['plan']
    if (plan === 'arjuna' || plan === 'dronacharya' || plan === 'brahmastra') {
      return { allowed: true, used: 0, limit: Infinity, message: 'Unlimited access' }
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const startIso = startOfMonth.toISOString()

    const tableName = feature === 'test' ? 'mock_tests' : 'doubts'
    const maxLimit = feature === 'test' ? FREE_LIMITS.tests : FREE_LIMITS.doubts

    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startIso)

    const used = count || 0
    const allowed = used < maxLimit

    // Update state to keep it in sync
    setUsageLimits(prev => ({
      ...prev,
      [feature === 'test' ? 'tests_this_month' : 'doubts_this_month']: used
    }))

    return { 
      allowed, 
      used, 
      limit: maxLimit, 
      message: allowed ? '' : `You have reached your free Eklavya limit of ${maxLimit} ${feature}s this month.`
    }
  }

  const awardXP = async (amount: number) => {
    if (!user || !profile) return
    const coinAmount = Math.floor(amount / 10)
    const newXp = (profile.total_xp || 0) + amount
    const newCoins = (profile.coins || 0) + coinAmount
    
    await supabase.from('profiles').update({ 
      total_xp: newXp,
      coins: newCoins 
    }).eq('id', user.id)
    
    setProfile(prev => prev ? { ...prev, total_xp: newXp, coins: newCoins } : null)
    
    // Update gamification synchronously
    const level = getLevelName(newXp)
    setGamification(prev => ({
      ...prev,
      totalXp: newXp,
      xpToNextLevel: level.next === Infinity ? 0 : level.next - newXp,
      levelName: level.name,
      streakFreeze: profile.streak_freeze_count || 0
    }))
  }

  useEffect(() => {
    if (isLoaded) {
      fetchProfile()
    }
  }, [user, isLoaded])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    
    if (!error) {
      await fetchProfile()
    }
  }

  return (
    <ProfileContext.Provider value={{
      profile,
      profileLoading,
      profileExists,
      usageLimits,
      gamification,
      checkLimit,
      refreshProfile: fetchProfile,
      updateProfile,
      refreshStreak: () => refreshStreak(profile),
      awardXP
    }}>
      {children}
    </ProfileContext.Provider>
  )
}
