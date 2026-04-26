import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#080a10] text-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="text-[120px] font-black text-primary leading-none relative z-10"
        style={{ textShadow: '0 0 40px rgba(245,158,11,0.3)' }}
      >
        404
      </motion.div>
      
      <h2 className="text-2xl font-bold text-white mb-8 relative z-10 tracking-tight">Page not found</h2>
      
      <Link to="/dashboard" className="relative z-10 inline-flex items-center gap-2 px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)]">
        Go to Dashboard <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
