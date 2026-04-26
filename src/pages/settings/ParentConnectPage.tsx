import { useState } from 'react'
import { Phone, ShieldCheck, Share2, MessageCircle, Loader2, Info } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'

export function ParentConnectPage() {
  const { profile, refreshProfile } = useProfile()
  const { toast } = useToast()
  
  const [phone, setPhone] = useState(profile?.parent_phone || '')
  const [loading, setLoading] = useState(false)
  const [telemetryEnabled, setTelemetryEnabled] = useState(profile?.parent_telemetry_enabled || false)

  const handleSave = async () => {
    if (!phone) {
      toast({ type: 'error', title: 'Phone number required', description: 'Parent ka WhatsApp number toh dalo!' })
      return
    }
    setLoading(true)
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        parent_phone: phone,
        parent_telemetry_enabled: telemetryEnabled 
      })
      .eq('id', profile?.id)

    if (!error) {
      toast({ type: 'success', title: 'Settings Saved! ✅', description: 'Parent telemetry successfully configured.' })
      refreshProfile()
    } else {
      toast({ type: 'error', title: 'Error', description: 'Save nahi ho paaya. Network check karo!' })
    }
    setLoading(false)
  }

  const sendInvite = () => {
    const message = `Namaste! I am using MargDarshak AI for my exam prep. You can track my daily progress here: https://margdarshak.ai/parent-portal/${profile?.id}`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <Phone className="w-10 h-10 text-[#25D366]" />
          Parent Connect
        </h1>
        <p className="text-muted font-medium text-lg">Involve your parents in your success journey with weekly WhatsApp telemetry.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Configuration Card */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#0f1220] border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-black text-muted uppercase tracking-widest px-1">Parent's WhatsApp Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted border-r border-white/10 pr-3">
                  <span className="text-xs font-bold">+91</span>
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210" 
                  className="w-full bg-[#0a0c14] border border-white/10 rounded-xl pl-16 pr-4 py-4 text-white font-bold focus:outline-none focus:border-[#25D366] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/2 rounded-3xl border border-white/5">
              <div>
                <h3 className="text-sm font-black text-white">Enable Weekly Telemetry</h3>
                <p className="text-xs text-muted font-medium mt-1">Automatic progress report sent every Sunday.</p>
              </div>
              <button 
                onClick={() => setTelemetryEnabled(!telemetryEnabled)}
                className={cn(
                  "w-14 h-8 rounded-full transition-all relative p-1",
                  telemetryEnabled ? "bg-[#25D366]" : "bg-white/10"
                )}
              >
                <div className={cn("w-6 h-6 bg-white rounded-full transition-all shadow-md", telemetryEnabled ? "translate-x-6" : "translate-x-0")} />
              </button>
            </div>

            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 bg-[#25D366] text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(37,211,102,0.2)] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              Save Configuration
            </button>
          </div>

          {/* Invitation Section */}
          <div className="bg-gradient-to-br from-[#25D366]/10 to-transparent border border-[#25D366]/20 rounded-[40px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Share Tracking Link</h3>
              <p className="text-xs text-muted font-medium">Manually send the portal link to your parent's WhatsApp.</p>
            </div>
            <button 
              onClick={sendInvite}
              disabled={!phone}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" /> Send Invitation
            </button>
          </div>
        </div>

        {/* Preview Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f1220] border border-white/5 rounded-[40px] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 bg-[#075E54] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="text-sm font-black text-white">MargDarshak Bot</div>
              </div>
              <div className="text-[10px] font-bold text-white/70 uppercase">Telemetry Preview</div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#DCF8C6] rounded-2xl p-4 text-xs text-black font-medium shadow-sm relative mr-6">
                <p>Namaste! Here is the weekly progress report for <span className="font-bold">{profile?.full_name}</span>:</p>
                <div className="mt-3 space-y-1">
                  <p>📅 Study Hours: <span className="font-bold">24h 15m</span></p>
                  <p>🎯 Accuracy: <span className="font-bold">78%</span></p>
                  <p>🔥 Streak: <span className="font-bold">12 Days</span></p>
                </div>
                <p className="mt-3 text-[#075E54] font-bold">View full dashboard: https://margdarshak.ai/parent/preview</p>
                <div className="absolute -left-2 top-2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-[#DCF8C6]" />
              </div>
            </div>
            
            <div className="p-6 border-t border-white/5 text-center">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-relaxed">
                Reports are sent every Sunday at 10:00 AM IST
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 flex items-start gap-4">
            <Info className="w-5 h-5 text-primary shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-white">Student Control</h4>
              <p className="text-[10px] text-muted font-medium leading-relaxed">
                Aap jab chahein telemetry band kar sakte hain. We respect your privacy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
