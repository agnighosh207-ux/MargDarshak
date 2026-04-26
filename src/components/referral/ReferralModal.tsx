import { useState, useEffect } from 'react'
import { Gift, X, Check, Loader2, Star } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { useToast } from '../ui/Toast'
import { cn } from '../../lib/utils'

export function ReferralModal() {
  const { profile, refreshProfile } = useProfile()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Show modal if user has no referred_by and is relatively new (created in last 5 mins)
    // and hasn't seen it in this session
    if (profile && !profile.referred_by) {
      const isNewUser = new Date().getTime() - new Date(profile.created_at).getTime() < 5 * 60 * 1000
      const hasSeen = sessionStorage.getItem('marg_referral_modal_seen')
      
      if (isNewUser && !hasSeen) {
        setIsOpen(true)
        sessionStorage.setItem('marg_referral_modal_seen', 'true')
      }
    }
  }, [profile])

  const handleSubmit = async () => {
    if (!code.trim()) return
    setStatus('checking')
    
    try {
      // 1. Find the referrer
      const { data: referrer, error: findError } = await supabase
        .from('profiles')
        .select('id, referral_code')
        .eq('referral_code', code.trim().toUpperCase())
        .single()

      if (findError || !referrer) {
        setStatus('error')
        setErrorMsg('Invalid code. Check kar lo wapas!')
        return
      }

      if (referrer.id === profile?.id) {
        setStatus('error')
        setErrorMsg('Apna khud ka code? Nice try! 😂')
        return
      }

      // 2. Update profile with referred_by
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ referred_by: referrer.id })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      // 3. Log the referral
      await supabase.from('referrals').insert({
        referrer_id: referrer.id,
        referred_id: profile?.id,
        status: 'pending'
      })

      setStatus('success')
      toast({ 
        type: 'success', 
        title: 'Referral Applied! 🎁', 
        description: 'Jab aap premium buy karenge, aapko aur aapke dost ko 10 days extra milenge!' 
      })
      
      setTimeout(() => {
        setIsOpen(false)
        refreshProfile()
      }, 2000)
    } catch (err) {
      setStatus('error')
      setErrorMsg('Something went wrong. Try again later.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-md p-0 overflow-hidden bg-[#0f1220] border border-white/10 shadow-2xl">
      <div className="relative p-8 md:p-10">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-[40px] pointer-events-none" />

        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 text-muted hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-primary/20">
            <Gift className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">Got a Promo Code?</h2>
            <p className="text-muted font-medium">Enter your friend's referral code to unlock <span className="text-white font-bold">10 Days Bonus</span> on your first premium upgrade!</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text" 
                value={code}
                onChange={e => {
                  setCode(e.target.value.toUpperCase())
                  setStatus('idle')
                }}
                disabled={status === 'success' || status === 'checking'}
                placeholder="E.G. AB1234" 
                className={cn(
                  "w-full bg-[#0a0c14] border-2 rounded-2xl px-6 py-4 text-xl font-black tracking-widest text-center uppercase focus:outline-none transition-all",
                  status === 'error' ? "border-danger/50 text-danger" : 
                  status === 'success' ? "border-success/50 text-success" : 
                  "border-white/10 focus:border-primary text-white"
                )}
              />
              {status === 'checking' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}
            </div>
            
            {status === 'error' && <p className="text-xs font-bold text-danger animate-bounce">{errorMsg}</p>}
            {status === 'success' && <p className="text-xs font-bold text-success">Applied Successfully! 🎉</p>}

            <div className="pt-2">
              {status === 'success' ? (
                <div className="w-full py-4 bg-success/10 border border-success/20 text-success font-black rounded-2xl flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> Applied
                </div>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={!code || status === 'checking'}
                  className="w-full py-4 bg-primary text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:scale-100"
                >
                  Apply Code & Claim
                </button>
              )}
            </div>
          </div>

          <button onClick={() => setIsOpen(false)} className="text-xs font-bold text-muted hover:text-white transition-colors">
            I don't have a code, skip this
          </button>
          
          <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-muted font-bold uppercase tracking-widest">
            <Star className="w-3 h-3 text-primary" /> 100% Genuine Reward System
          </div>
        </div>
      </div>
    </Modal>
  )
}
