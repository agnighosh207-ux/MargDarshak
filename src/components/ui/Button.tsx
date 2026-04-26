import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    
    const baseStyles = "px-6 py-2.5 rounded-full font-semibold flex items-center justify-center gap-2 transition-all duration-150 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    
    const variants = {
      primary: "bg-primary text-black hover:bg-amber-400 hover:shadow-[0_0_24px_rgba(245,158,11,0.25)] focus:shadow-[0_0_0_3px_rgba(245,158,11,0.2)]",
      secondary: "bg-accent text-white hover:bg-indigo-400 hover:shadow-[0_0_24px_rgba(99,102,241,0.25)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]",
      outline: "bg-transparent border border-border text-text hover:border-primary/50 hover:text-primary focus:border-primary",
      ghost: "bg-transparent text-muted hover:text-white hover:bg-surface-2"
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
