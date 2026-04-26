import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function AnimatedNumber({ 
  value, 
  duration = 1200, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  className = ''
}: AnimatedNumberProps) {
  const [currentValue, setCurrentValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          let startTimestamp: number | null = null
          
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)
            
            const easedProgress = easeOutExpo(progress)
            setCurrentValue(easedProgress * value)
            
            if (progress < 1) {
              requestAnimationFrame(step)
            } else {
              setCurrentValue(value)
            }
          }
          
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {currentValue.toFixed(decimals)}
      {suffix}
    </span>
  )
}
