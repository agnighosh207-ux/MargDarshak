import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { SignedOut, useUser } from '@clerk/clerk-react'
import { Sparkles, ArrowRight, Brain, Target, Calendar, BarChart3, Flame, MessageCircle, ChevronDown, CheckCircle2, Star, Quote } from 'lucide-react'

const EXAMS = [
  { id: 'jee-main', name: 'JEE Main', category: 'Engineering' },
  { id: 'jee-adv', name: 'JEE Advanced', category: 'Engineering' },
  { id: 'neet-ug', name: 'NEET UG', category: 'Medical' },
  { id: 'upsc-cse', name: 'UPSC CSE', category: 'Civil Services' },
  { id: 'cat', name: 'CAT', category: 'Management' },
  { id: 'ssc-cgl', name: 'SSC CGL', category: 'Govt Exams' },
  { id: 'bank-po', name: 'Bank PO', category: 'Banking' },
  { id: 'gate', name: 'GATE', category: 'Engineering PG' },
  { id: 'clat', name: 'CLAT', category: 'Law' },
  { id: 'nda', name: 'NDA', category: 'Defence' },
  { id: 'cuet', name: 'CUET', category: 'University' },
  { id: 'bitsat', name: 'BITSAT', category: 'Engineering' },
  { id: 'wbjee', name: 'WBJEE', category: 'Engineering' },
  { id: 'mht-cet', name: 'MHT CET', category: 'Engineering' },
  { id: 'ca-found', name: 'CA Foundation', category: 'Finance' },
  { id: 'ugc-net', name: 'UGC NET', category: 'Teaching' },
  { id: 'rrb-ntpc', name: 'RRB NTPC', category: 'Railways' },
  { id: 'ibps-clerk', name: 'IBPS Clerk', category: 'Banking' },
  { id: 'cds', name: 'CDS', category: 'Defence' },
  { id: 'aiims-pg', name: 'AIIMS PG', category: 'Medical PG' },
]

// Extracted from App.tsx or use local aurora styles
const TypewriterText = () => {
  const words = ["JEE crack karo", "NEET qualify karo", "UPSC clear karo", "CAT ace karo"]
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="h-16 md:h-24 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

const FAQ = [
  { q: "Kya yeh sab sach mein free hai?", a: "Abhi ke liye Core features free hain. Premium features like advanced AI Strategy are available in paid tiers. Par basic mock tests aur daily practice bilkul free hain." },
  { q: "AI doubt solver accurate hai kya?", a: "Bhai, yeh advanced AI models pe chalta hai. Math, Physics, Chemistry aur Biology mein accuracy 95%+ hai. Fir bhi doubt ho toh cross-check kar lena." },
  { q: "Groq API use kar rahe ho, toh data safe hai?", a: "Ekdum safe. Hum personal data model train karne ke liye nahi bhejte. Sirf question context jata hai API pe." },
  { q: "Kya yeh mobile pe chalega?", a: "Haan! Pura platform mobile-first design kiya gaya hai. Raste mein chalte chalte revise kar lo." },
  { q: "Mera exam is list mein nahi hai, kya karoon?", a: "Hum constantly naye exams add kar rahe hain. Abhi ke liye tum custom mock tests create karke practice kar sakte ho." },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { isSignedIn } = useUser()
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [examModal, setExamModal] = useState<any | null>(null)

  // Redirect if logged in
  useEffect(() => {
    if (isSignedIn) navigate('/dashboard', { replace: true })
  }, [isSignedIn, navigate])

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0c14]/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-tight">
            <span className="text-primary"><Sparkles className="w-5 h-5" /></span>
            MargDarshak
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hidden md:block text-sm font-medium hover:text-primary transition-colors text-muted">Features</a>
            <Link to="/pricing" className="hidden md:block text-sm font-medium hover:text-primary transition-colors text-muted">Pricing</Link>
            <Link to="/support" className="hidden md:block text-sm font-medium hover:text-primary transition-colors text-muted">Support</Link>
            {isSignedIn ? (
              <Link to="/dashboard" className="px-5 py-2 text-sm font-bold bg-primary text-black rounded-full hover:bg-primary/90 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold text-white hover:text-primary transition-colors">Log In</Link>
                <Link to="/register" className="px-5 py-2 text-sm font-bold bg-primary text-black rounded-full hover:bg-primary/90 transition-transform hover:scale-105">
                  Start Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Aurora Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              India's Most Advanced AI Tutor
            </div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-tight mb-4">
              <TypewriterText />
            </h1>
            
            <p className="text-xl md:text-2xl text-muted/80 max-w-2xl mx-auto mb-10 font-medium">
              Beta, raat ko rona band karo — logic samjho, formula khud yaad ho jaayega.
            </p>

            <Link 
              to={isSignedIn ? "/dashboard" : "/register"} 
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-primary text-black font-black text-lg hover:scale-105 transition-all shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:shadow-[0_0_60px_rgba(245,158,11,0.5)]"
            >
              {isSignedIn ? "Go to Dashboard" : "Abhi shuru karo — free hai"} <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <section id="features" className="py-24 bg-[#080a10] relative z-10 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Toh Khas Kya Hai?</h2>
            <p className="text-muted text-lg">Sab kuch jo ek serious aspirant ko chahiye.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Target, title: "AI Mock Tests", desc: "Tera exam, teri speed, teri difficulty.", color: "text-red-400" },
              { icon: MessageCircle, title: "AI Doubt Solver", desc: "24/7 available, judge nahi karega.", color: "text-blue-400" },
              { icon: Brain, title: "Weak Chapter Finder", desc: "Pata chalega kahan maar raha hai.", color: "text-amber-400" },
              { icon: Calendar, title: "Smart Study Planner", desc: "Din bhar ka time table — AI banayega.", color: "text-emerald-400" },
              { icon: BarChart3, title: "Analytics Dashboard", desc: "Numbers jhoot nahi bolte.", color: "text-purple-400" },
              { icon: Flame, title: "Progress Streaks", desc: "Ek din miss kiya toh…na karo yaar.", color: "text-orange-400" },
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#0f1220] border border-white/5 p-8 rounded-3xl hover:border-white/20 transition-colors"
              >
                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ${f.color}`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-muted font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. EXAM SHOWCASE */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-4">25+ Exams Covered</h2>
          <p className="text-muted text-lg">Pura India yahan prepare karta hai.</p>
        </div>
        
        {/* Auto-scrolling pill grid (simplified css animation or just flex wrap for layout) */}
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-3 px-4">
          {EXAMS.map((exam, i) => (
            <motion.button
              key={exam.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setExamModal(exam)}
              className="px-6 py-3 rounded-full bg-[#0f1220] border border-white/10 text-sm font-bold text-white/80 hover:text-white hover:border-primary hover:bg-primary/10 transition-all cursor-pointer"
            >
              {exam.name}
            </motion.button>
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-24 bg-[#080a10] border-y border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-5xl font-black mb-16 text-center">Process Simple Hai</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line desktop */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
            
            {[
              { step: "01", title: "Select Exam", desc: "Sign up and target your dream exam." },
              { step: "02", title: "Practice Daily", desc: "Mock tests, AI planner, and doubt solving." },
              { step: "03", title: "Crack It", desc: "Watch your accuracy and rank skyrocket." }
            ].map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative text-center z-10"
              >
                <div className="w-16 h-16 mx-auto bg-[#0a0c14] border-2 border-primary rounded-full flex items-center justify-center text-2xl font-black text-primary mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  {s.step}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-muted">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-black mb-16 text-center">Seniors Kya Bolte Hain?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Rahul S.", exam: "JEE Advanced - AIR 432", text: "Bhai, chemistry ke doubts AI se puchna game changer tha. Coaching mein sir ke paas time nahi hota tha.", rating: 5 },
              { name: "Ananya M.", exam: "NEET UG - 685/720", text: "The AI study planner saved me. Mera revision track pe rakha isne end ke 2 mahine mein. Highly recommend!", rating: 5 },
              { name: "Kunal P.", exam: "UPSC Prelims Cleared", text: "Mock tests ki difficulty exactly real exam jaisi thi. Analytics se pata chala polity weak hai, fix kar liya.", rating: 5 }
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-[#0f1220] p-8 rounded-3xl border border-white/5 relative"
              >
                <Quote className="w-10 h-10 text-primary/20 absolute top-6 right-6" />
                <div className="flex gap-1 mb-6 text-primary">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-lg font-medium text-white/90 leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <div className="font-bold text-white">{t.name}</div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">{t.exam}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PRICING */}
      <section id="pricing" className="py-24 bg-[#080a10] border-y border-white/5">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Investment, Not Expense</h2>
            <p className="text-muted text-lg">Pick a plan. Let's crack this together.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* Free */}
            <div className="bg-[#0f1220]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-left flex flex-col hover:-translate-y-2 transition-all">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2 text-amber-500">BASE OPERATIONS</div>
              <h3 className="text-2xl font-bold text-white mb-2">Eklavya</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold tracking-tight">₹0</span>
                <span className="text-muted text-sm pb-1">/forever</span>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-white/90 flex-1">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Basic analytics dashboard logs</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> PYQ browsing & secure downloads</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Community public doubt forum</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Limited Focus Engine (2hrs/day)</li>
              </ul>
              <Link to="/pricing" className="block w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm text-center bg-transparent border border-white text-white hover:bg-white/5 transition-all">Start Free</Link>
            </div>

            {/* Pro */}
            <div className="bg-[#0f1220]/80 backdrop-blur-xl p-8 rounded-3xl border border-[#00f2fe] shadow-[0_0_30px_rgba(0,242,254,0.2)] text-left flex flex-col relative hover:-translate-y-2 transition-all">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00f2fe] text-black text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(0,242,254,0.5)] whitespace-nowrap">Most Popular</div>
              <div className="text-[#00f2fe] bg-[#00f2fe]/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit mb-4">CORE ARSENAL</div>
              <h3 className="text-2xl font-bold text-white mb-2">Arjuna</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold tracking-tight">₹499</span>
                <span className="text-muted text-sm pb-1">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-white/90 flex-1">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Unlimited AI Deep Mock Tests</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Live Shadow Ranker Matrix</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Surgical X-Ray Diagnostics Pipeline</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Personalized 5-Day Study Plans</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Basic Forgetting Curve System</li>
              </ul>
              <Link to="/pricing" className="block w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm text-center bg-[#00f2fe] text-black hover:bg-[#00f2fe]/90 hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all">Upgrade to Arjuna</Link>
            </div>

            {/* Premium */}
            <div className="bg-[#0f1220]/80 backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/30 text-left flex flex-col hover:-translate-y-2 transition-all">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2 text-emerald-500">ADVANCED MENTORSHIP</div>
              <h3 className="text-2xl font-bold text-white mb-2">Dronacharya</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold tracking-tight">₹999</span>
                <span className="text-muted text-sm pb-1">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-white/90 flex-1">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Everything included in Arjuna</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Unlimited Socratic Doubt Solver</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Video Deep-Links for Weak Spots</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Weekly Parent WhatsApp Telemetry</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Priority Engine Allocation</li>
              </ul>
              <Link to="/pricing" className="block w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm text-center bg-white text-black hover:bg-white/90 transition-all">Get Dronacharya</Link>
            </div>

            {/* Elite */}
            <div className="bg-[#0f1220]/80 backdrop-blur-xl p-8 rounded-3xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)] text-left flex flex-col hover:-translate-y-2 transition-all">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2 text-purple-400">DATA SUPREMACY EDITION</div>
              <h3 className="text-2xl font-bold text-white mb-2">Brahmastra 🏆</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold tracking-tight">₹4,999</span>
                <span className="text-muted text-sm pb-1">/yr</span>
              </div>
              <ul className="space-y-4 mb-8 text-sm text-white/90 flex-1">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Everything in Dronacharya Base</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Adversarial Stress-Test Engine</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Global Topper Telemetry Access</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Priority LPU Allocation</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Personalized Mistake-to-Asset PDF</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> Predictive Rank Guarantee SLA</li>
              </ul>
              <Link to="/pricing" className="block w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-all">Equip Brahmastra</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-24 max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-black text-center mb-12">Tumhare Sawaal (FAQs)</h2>
        <div className="space-y-4">
          {FAQ.map((f, i) => (
            <div key={i} className="bg-[#0f1220] border border-white/5 rounded-2xl overflow-hidden transition-colors hover:border-white/10">
              <button 
                className="w-full text-left px-6 py-5 flex items-center justify-between font-bold text-white"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                {f.q}
                <ChevronDown className={`w-5 h-5 text-muted transition-transform duration-300 ${activeFaq === i ? 'rotate-180 text-primary' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-5 text-muted leading-relaxed"
                  >
                    {f.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-[#080a10] border-t border-white/5 pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-2 font-black text-2xl tracking-tight text-white">
              <span className="text-primary"><Sparkles className="w-6 h-6" /></span>
              MargDarshak
            </div>
            <div className="flex gap-6 text-sm font-semibold text-muted">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link to="/support" className="hover:text-white transition-colors">Support</Link>
              <Link to="/register" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
          </div>
          <div className="text-center text-muted text-sm font-medium pt-8 border-t border-white/5">
            Made with ❤️ for Indian students.<br/>
            © {new Date().getFullYear()} MargDarshak AI. All rights reserved.
          </div>
        </div>
      </footer>

      {/* EXAM MODAL */}
      <AnimatePresence>
        {examModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setExamModal(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0f1220] border border-white/10 p-8 rounded-3xl w-full max-w-md relative z-10 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-4 border border-primary/20">
                {examModal.id.substring(0,2).toUpperCase()}
              </div>
              <h3 className="text-2xl font-black text-white mb-2">{examModal.name}</h3>
              <div className="text-xs font-bold text-muted uppercase tracking-wider mb-6">Category: {examModal.category}</div>
              <Link to="/register" className="block w-full py-3 rounded-full bg-primary text-black font-bold hover:scale-105 transition-transform">Start Preparing</Link>
              <button onClick={() => setExamModal(null)} className="mt-4 text-sm font-medium text-muted hover:text-white">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
