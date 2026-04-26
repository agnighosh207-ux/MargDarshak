import { motion } from 'framer-motion'

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0c14] flex flex-col items-center justify-center">
      <div className="relative mb-6">
        <motion.div 
          animate={{ boxShadow: ['0 0 0 0 rgba(245,158,11,0.4)', '0 0 0 20px rgba(245,158,11,0)'] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 bg-primary rounded-full flex items-center justify-center"
        >
          <span className="text-3xl font-black text-black">M</span>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-black text-white tracking-tight"
      >
        MargDarshak
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  )
}
