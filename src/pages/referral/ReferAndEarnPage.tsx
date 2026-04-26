import { useState, useEffect } from 'react'
import { Gift, Copy, Share2, Users, CheckCircle2, TrendingUp, Zap, Info } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'

export function ReferAndEarnPage() {
  const { profile } = useProfile()
  const { toast } = useToast()
  const [referrals, setReferrals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferrals()
  }, [profile])

  const fetchReferrals = async () => {
    if (!profile) return
    setLoading(true)
    const { data, error } = await supabase
      .from('referrals')
      .select('*, referred_id(full_name, email, plan)')
      .eq('referrer_id', profile.id)
      .order('created_at', { ascending: false })

    if (!error) setReferrals(data || [])
    setLoading(false)
  }

  const copyCode = () => {
    if (!profile?.referral_code) return
    navigator.clipboard.writeText(profile.referral_code)
    setCopied(true)
    toast({ type: 'success', title: 'Code copied!', description: 'Ab share karo apne doston ke saath! 🚀' })
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = () => {
    if (!profile?.referral_code) return
    const text = `Join MargDarshak AI for exam prep! Use my code ${profile.referral_code} to get 10 days extra bonus on premium. Link: ${window.location.origin}/register?ref=${profile.referral_code}`
    if (navigator.share) {
      navigator.share({
        title: 'MargDarshak Referral',
        text: text,
        url: `${window.location.origin}/register?ref=${profile.referral_code}`
      })
    } else {
      copyCode()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Gift className="w-10 h-10 text-primary" />
            Refer & Earn
          </h1>
          <p className="text-muted mt-2 text-lg font-medium">Earn 10 days extra premium for every friend who joins.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Referral Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0f1220] border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden group shadow-2xl">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-all duration-1000" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
                  Limited Time Reward
                </div>
                <h2 className="text-5xl font-black text-white leading-tight">
                  Share the gift of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">Success</span>.
                </h2>
                <p className="text-muted text-xl max-w-xl font-medium">
                  Jab aapka dost premium buy karega, aap dono ko milenge <span className="text-white font-bold">10 days extra</span> validitiy!
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-stretch gap-4 pt-4">
                <div className="flex-1 bg-[#0a0c14] border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between group/code">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Your Code</span>
                    <span className="text-2xl font-black text-white tracking-widest uppercase">{profile?.referral_code || '---'}</span>
                  </div>
                  <button 
                    onClick={copyCode}
                    className="p-3 bg-white/5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <button 
                  onClick={shareLink}
                  className="px-10 py-4 bg-primary text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(245,158,11,0.2)]"
                >
                  <Share2 className="w-5 h-5" /> Share Now
                </button>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
                {[
                  { icon: Share2, title: "Invite Friends", desc: "Share your unique code." },
                  { icon: Zap, title: "They Upgrade", desc: "Friend buys any premium plan." },
                  { icon: Gift, title: "Both Get Rewarded", desc: "10 days added to both accounts." }
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary border border-white/5">
                      <s.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">{s.title}</h4>
                      <p className="text-xs text-muted font-medium leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Referral Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0f1220] border border-white/5 rounded-3xl p-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Referrals</p>
                <h3 className="text-4xl font-black text-white">{(profile as any)?.referral_count || 0}</h3>
              </div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Users className="w-7 h-7" />
              </div>
            </div>
            <div className="bg-[#0f1220] border border-white/5 rounded-3xl p-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Bonus Days Earned</p>
                <h3 className="text-4xl font-black text-white">{((profile as any)?.referral_count || 0) * 10}</h3>
              </div>
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                <TrendingUp className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Referrals List */}
          <div className="bg-[#0f1220] border border-white/5 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <Users className="w-6 h-6 text-muted" /> Friends who joined
            </h3>
            
            <div className="space-y-4">
              {loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted" /></div>
              ) : referrals.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <p className="text-muted font-medium">Abhi tak koi nahi aaya. Jaldi bulalo! 😅</p>
                </div>
              ) : (
                referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                        {(ref.referred_id as any)?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{(ref.referred_id as any)?.full_name || 'User'}</div>
                        <div className="text-[10px] text-muted uppercase font-bold tracking-widest">Joined {new Date(ref.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      ref.rewarded ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                    )}>
                      {ref.rewarded ? "Rewarded" : "Pending Upgrade"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-3xl p-8 sticky top-24">
            <h3 className="text-lg font-bold text-white mb-6">Referral T&C</h3>
            <ul className="space-y-4">
              {[
                "Bonus tabhi milega jab dost premium plan buy karega.",
                "Eklavya (Free) plan pe bonus applicable nahi hai.",
                "Ek user multiple referral codes use nahi kar sakta.",
                "Misuse karne pe account ban ho sakta hai, toh dhyan se!"
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted font-medium leading-relaxed">
                  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    {i + 1}
                  </div>
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-10 p-4 bg-accent/10 border border-accent/20 rounded-2xl">
              <div className="flex items-center gap-2 text-accent font-black text-xs uppercase tracking-widest mb-2">
                <Info className="w-4 h-4" /> Pro Tip
              </div>
              <p className="text-xs text-muted font-medium leading-relaxed">
                Apne coaching groups aur discord servers pe share karo. Probability skyrocket ho jayegi! 📈
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
