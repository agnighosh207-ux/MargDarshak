import { useEffect } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { AnimatedNumber } from './AnimatedNumber'

export function ScoreGauge({ score, size = 180, label = 'Accuracy' }: { score: number, size?: number, label?: string }) {
  const r = (size / 2) - 16
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const color = score > 75 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444'

  const dashoffset = useMotionValue(circumference)

  useEffect(() => {
    const targetOffset = circumference * (1 - score / 100)
    animate(dashoffset, targetOffset, { duration: 1.2, ease: [0, 0.55, 0.45, 1] })
  }, [score, circumference, dashoffset])

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashoffset }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <div className="text-3xl font-bold" style={{ color }}>
          <AnimatedNumber value={score} suffix="%" />
        </div>
        <div className="text-xs text-muted uppercase tracking-wider mt-1 font-semibold">{label}</div>
      </div>
    </div>
  )
}
