import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X as XIcon, ChevronDown, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/utils'

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const handleOpenPayment = () => {
    setIsPaymentModalOpen(true)
  }

  // Pricing Data from the screenshot
  const plans = [
    {
      id: 'eklavya',
      badge: 'BASE OPERATIONS',
      name: 'Eklavya',
      monthlyPrice: '0',
      quarterlyPrice: '0',
      yearlyPrice: '0',
      period: '/forever',
      features: [
        'Basic analytics dashboard logs',
        'PYQ browsing & secure downloads',
        'Community public doubt forum',
        'Limited Focus Engine (2hrs/day)'
      ],
      notIncluded: [],
      cta: 'Start Free',
      borderColor: 'border-white/10',
      btnColor: 'bg-transparent border border-white text-white hover:bg-white/5',
      badgeColor: 'text-amber-500'
    },
    {
      id: 'arjuna',
      badge: 'CORE ARSENAL',
      name: 'Arjuna',
      monthlyPrice: '499',
      quarterlyPrice: '1,299',
      yearlyPrice: '4,999',
      period: '/mo',
      features: [
        'Unlimited AI Deep Mock Tests',
        'Live Shadow Ranker Matrix',
        'Surgical X-Ray Diagnostics Pipeline',
        'Personalized 5-Day Study Plans',
        'Basic Forgetting Curve System'
      ],
      notIncluded: [],
      cta: 'UPGRADE TO ARJUNA',
      borderColor: 'border-[#00f2fe] shadow-[0_0_30px_rgba(0,242,254,0.2)]', // Match glowing cyan color
      btnColor: 'bg-[#00f2fe] text-black font-bold uppercase tracking-wider hover:bg-[#00f2fe]/90 hover:shadow-[0_0_20px_rgba(0,242,254,0.4)]',
      badgeColor: 'text-[#00f2fe] bg-[#00f2fe]/10 px-3 py-1 rounded-full text-[10px] w-fit mb-4',
      isPopular: true
    },
    {
      id: 'dronacharya',
      badge: 'ADVANCED MENTORSHIP',
      name: 'Dronacharya',
      monthlyPrice: '999',
      quarterlyPrice: '2,699',
      yearlyPrice: '9,999',
      period: '/mo',
      features: [
        'Everything included in Arjuna',
        'Unlimited Socratic Doubt Solver',
        'Video Deep-Links for Weak Spots',
        'Weekly Parent WhatsApp Telemetry',
        'Priority Engine Allocation'
      ],
      notIncluded: [],
      cta: 'GET DRONACHARYA',
      borderColor: 'border-emerald-500/30',
      btnColor: 'bg-white text-black font-bold uppercase tracking-wider hover:bg-white/90',
      badgeColor: 'text-emerald-500'
    },
    {
      id: 'brahmastra',
      badge: 'DATA SUPREMACY EDITION',
      name: 'Brahmastra 🏆',
      monthlyPrice: '499', 
      quarterlyPrice: '1,499',
      yearlyPrice: '4,999',
      period: '/yr',
      features: [
        'Everything in Dronacharya Base',
        'Adversarial Stress-Test Engine',
        'Global Topper Telemetry Access',
        'Priority LPU Allocation',
        'Personalized Mistake-to-Asset PDF',
        'Predictive Rank Guarantee SLA'
      ],
      notIncluded: [],
      cta: 'Equip Brahmastra',
      borderColor: 'border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)]',
      btnColor: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90',
      badgeColor: 'text-purple-400'
    }
  ]

  const faqs = [
    {
      question: 'Kya EMI available hai?',
      answer: 'Haan bilkul! Brahmastra aur Dronacharya yearly plans pe no-cost EMI options available hain major credit cards aur Bajaj Finserv ke through.'
    },
    {
      question: 'Refund policy?',
      answer: 'Hum 7-day no-questions-asked refund policy offer karte hain on all premium plans. Agar MargDarshak pasand nahi aaya, toh full refund claim kar sakte ho.'
    },
    {
      question: 'Student discount?',
      answer: 'First 1,000 students ke liye prices already discounted hain (Early Bird). Uske alawa, economically weaker sections ke liye special scholarship tests hote hain har mahine.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white overflow-x-hidden pt-20 pb-20 font-sans">
      
      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full mix-blend-screen filter blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full mix-blend-screen filter blur-[150px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tight mb-8 hover:opacity-80 transition-opacity">
            <span className="text-primary"><Sparkles className="w-5 h-5" /></span>
            MargDarshak
          </Link>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Invest in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">Future</span>
          </h1>
          <p className="text-lg text-muted mb-10">
            Choose the perfect arsenal for your exam preparation journey. No hidden fees. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1.5 bg-surface-2 border border-white/5 rounded-full relative">
            {['monthly', 'quarterly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle as any)}
                className={cn(
                  "relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all z-10",
                  billingCycle === cycle ? "text-black" : "text-muted hover:text-white"
                )}
              >
                {billingCycle === cycle && (
                  <motion.div
                    layoutId="billing-toggle"
                    className="absolute inset-0 bg-primary rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="capitalize">{cycle}</span>
                {cycle === 'yearly' && (
                  <span className={cn(
                    "ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold",
                    billingCycle === cycle ? "bg-black/20 text-black" : "bg-success/20 text-success"
                  )}>
                    SAVE 40%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-10 items-stretch">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={cn(
                "relative flex flex-col bg-[#0f1220]/80 backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-2",
                plan.borderColor
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-black text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", plan.badgeColor)}>
                  {plan.badge}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold tracking-tight">₹{
                    billingCycle === 'yearly' ? plan.yearlyPrice : 
                    billingCycle === 'quarterly' ? plan.quarterlyPrice : 
                    plan.monthlyPrice
                  }</span>
                  <span className="text-muted text-sm pb-1">{plan.id === 'brahmastra' ? '/yr' : billingCycle === 'yearly' && plan.id !== 'eklavya' ? '/yr' : billingCycle === 'quarterly' && plan.id !== 'eklavya' ? '/qtr' : plan.period}</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm text-white/90 leading-tight">{feature}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 opacity-50">
                    <div className="w-5 h-5 rounded-full bg-danger/10 flex items-center justify-center shrink-0 mt-0.5">
                      <XIcon className="w-3 h-3 text-danger" />
                    </div>
                    <span className="text-sm text-muted leading-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleOpenPayment}
                className={cn(
                  "w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300",
                  plan.btnColor
                )}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mb-20 flex items-center justify-center gap-2 text-sm text-muted">
          <Info className="w-4 h-4" />
          <span>No credit card required for free tier. Cancel anytime.</span>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>

      </div>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} className="w-full max-w-md p-8 text-center bg-surface border border-primary/30 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Coming Soon!</h2>
        <p className="text-muted leading-relaxed mb-8">
          Hum jald hi payments enable kar rahe hain. Tab tak <span className="text-white font-bold">MargDarshak AI</span> ko completely free use karo aur apne preparation ko boost karo!
        </p>
        <Button onClick={() => setIsPaymentModalOpen(false)} className="w-full py-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          Got it, thanks!
        </Button>
      </Modal>

    </div>
  )
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="border border-white/5 bg-surface-2 rounded-xl overflow-hidden transition-colors hover:bg-white/[0.02]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="font-semibold text-white">{question}</span>
        <ChevronDown className={cn("w-5 h-5 text-muted transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-5 text-muted leading-relaxed text-sm">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
