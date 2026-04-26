import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Sparkles, Shield, History as HistoryIcon, Zap } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'

export function BillingPage() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)

  const currentPlan = {
    name: 'Eklavya',
    status: 'Free Forever',
    renewsAt: 'N/A',
    tier: 'free'
  }

  const plans = [
    {
      id: 'eklavya',
      name: 'Eklavya',
      badge: 'BASE OPERATIONS',
      price: '0',
      period: 'forever',
      features: [
        'Basic analytics dashboard logs',
        'PYQ browsing & secure downloads',
        'Community public doubt forum',
        'Limited Focus Engine (2hrs/day)'
      ],
      color: 'text-muted',
      borderColor: 'border-white/10',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]',
      btnText: 'START FREE',
      btnClass: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
      isPopular: false
    },
    {
      id: 'arjuna',
      name: 'Arjuna',
      badge: 'CORE ARSENAL',
      price: '499',
      period: 'mo',
      features: [
        'Unlimited AI Deep Mock Tests',
        'Live Shadow Ranker Matrix',
        'Surgical X-Ray Diagnostics Pipeline',
        'Personalized 5-Day Study Plans',
        'Basic Forgetting Curve System'
      ],
      color: 'text-[#00f2fe]',
      borderColor: 'border-[#00f2fe]/30',
      glowColor: 'shadow-[0_0_40px_rgba(0,242,254,0.15)]',
      btnText: 'UPGRADE TO ARJUNA',
      btnClass: 'bg-[#00f2fe] text-black hover:scale-[1.02]',
      isPopular: true
    },
    {
      id: 'dronacharya',
      name: 'Dronacharya',
      badge: 'ADVANCED MENTORSHIP',
      price: '999',
      period: 'mo',
      features: [
        'Everything included in Arjuna',
        'Unlimited Socratic Doubt Solver',
        'Video Deep-Links for Weak Spots',
        'Weekly Parent WhatsApp Telemetry',
        'Priority Engine Allocation'
      ],
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]',
      btnText: 'GET DRONACHARYA',
      btnClass: 'bg-white text-black hover:scale-[1.02]',
      isPopular: false
    },
    {
      id: 'brahmastra',
      name: 'Brahmastra',
      badge: 'DATA SUPREMACY EDITION',
      price: '4,999',
      period: 'yr',
      features: [
        'Everything in Dronacharya Base',
        'Adversarial Stress-Test Engine',
        'Global Topper Telemetry Access',
        'Priority LPU Allocation',
        'Personalized Mistake-to-Asset PDF',
        'Predictive Rank Guarantee SLA'
      ],
      color: 'text-purple-400',
      borderColor: 'border-purple-500/20',
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]',
      btnText: 'EQUIP BRAHMASTRA',
      btnClass: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-[1.02]',
      isPopular: false,
      hasIcon: true
    }
  ]

  const handleUpgrade = (plan: any) => {
    setSelectedPlan(plan)
    setIsPaymentModalOpen(true)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="text-center space-y-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest"
        >
          <Sparkles className="w-3 h-3" /> Subscription Hub
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          Choose your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">Weapon</span>
        </h1>
        <p className="text-muted text-lg font-medium max-w-2xl mx-auto">
          Four tiers of aggression. Choose the armor that perfectly aligns with your ambition to dominate.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              "group relative flex flex-col bg-[#0f1220] border rounded-[32px] p-8 transition-all duration-500",
              plan.borderColor,
              plan.glowColor,
              plan.isPopular && "scale-105 z-10 border-[#00f2fe]/50 ring-1 ring-[#00f2fe]/20"
            )}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#00f2fe] text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(0,242,254,0.4)]">
                Most Popular Selection
              </div>
            )}

            <div className="mb-8">
              <div className={cn("text-[10px] font-black uppercase tracking-widest mb-2", plan.color)}>
                {plan.badge}
              </div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                {plan.hasIcon && <Crown className="w-6 h-6 text-amber-500" />}
              </div>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-black text-white">₹{plan.price}</span>
                <span className="text-muted text-sm font-medium">/{plan.period}</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-10">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 group/feat">
                  <div className={cn("mt-1 p-0.5 rounded-full border border-white/10 bg-white/5", plan.color)}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-xs text-white/70 font-medium leading-relaxed group-hover/feat:text-white transition-colors">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgrade(plan)}
              className={cn(
                "w-full py-4 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2",
                plan.btnClass
              )}
            >
              {plan.btnText}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Current Plan Overview (Compact) */}
      <div className="bg-[#0f1220] border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Your Active Armor</div>
            <h2 className="text-2xl font-black text-white">{currentPlan.name}</h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> {currentPlan.status}
              </span>
              <span className="text-xs text-muted font-medium">Renews: {currentPlan.renewsAt}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all">
            Billing Portal
          </button>
          <button className="px-6 py-3 rounded-xl bg-white text-black text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
            Manage Plan
          </button>
        </div>
      </div>

      {/* Billing History (Compact) */}
      <div className="bg-[#0f1220] border border-white/5 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-muted" /> Billing History
          </h3>
          <button className="text-xs font-bold text-primary hover:underline">Download Invoices</button>
        </div>
        
        <div className="flex items-center justify-center py-12 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
          <div>
            <HistoryIcon className="w-12 h-12 text-muted/30 mx-auto mb-4" />
            <p className="text-muted text-sm font-medium">No transaction records found.</p>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} className="max-w-md p-8 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Zap className="w-10 h-10 text-primary fill-current" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Coming Soon!</h2>
        <p className="text-muted text-lg font-medium leading-relaxed mb-8">
          Hum {selectedPlan?.name} aur Razorpay integrate kar rahe hain. Jald hi aap upgrade kar payenge!
        </p>
        <Button onClick={() => setIsPaymentModalOpen(false)} className="w-full py-4 text-lg">
          Samajh gaya, thanks!
        </Button>
      </Modal>
    </div>
  )
}
