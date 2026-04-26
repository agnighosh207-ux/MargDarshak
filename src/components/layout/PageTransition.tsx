import { motion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.99 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(4px)', scale: 1.01 }}
      transition={{ duration: 0.22, ease: [0.25, 0.4, 0.25, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}
