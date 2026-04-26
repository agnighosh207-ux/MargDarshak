import { motion } from 'framer-motion'
import { ParticleField } from '../components/ui/ParticleField'

const CARDS = [
  { title: "25+ Exams Covered", icon: "🎯" },
  { title: "AI-Powered Doubt Solver", icon: "🤖" },
  { title: "10K+ Questions", icon: "📝" },
]

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#0f1220]">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[45%] relative flex-col items-center justify-center overflow-hidden" 
           style={{ background: 'linear-gradient(135deg, #0a0c14 0%, #0f1220 100%)' }}>
        
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px' 
          }} 
        />
        
        <ParticleField />
        
        <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] mb-8"
          >
            <span className="text-4xl font-bold text-black tracking-tighter">M</span>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-white text-3xl font-bold tracking-tight mb-2"
          >
            MargDarshak
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted italic mb-12 text-lg"
          >
            "आपकी सफलता, हमारा लक्ष्य"
          </motion.p>
          
          <div className="w-full space-y-4">
            {CARDS.map((card, idx) => (
              <motion.div 
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + idx * 0.2, duration: 0.5 }}
                className="animate-float p-4 rounded-xl flex items-center gap-4"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  animationDelay: `${idx * -1}s`
                }}
              >
                <div className="text-2xl">{card.icon}</div>
                <div className="text-white font-medium">{card.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 w-full flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
