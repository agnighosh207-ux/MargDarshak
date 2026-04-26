import { useState, useEffect } from 'react'

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  useEffect(() => {
    let startY = 0
    let currentY = 0
    const THRESHOLD = 70

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || startY === 0) return
      
      currentY = e.touches[0].clientY
      const diff = currentY - startY
      
      if (diff > 0) {
        e.preventDefault() // prevent default scroll when pulling down
        setPullDistance(Math.min(diff * 0.4, THRESHOLD + 20)) // Add friction
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return
      
      if (pullDistance >= THRESHOLD) {
        setIsRefreshing(true)
        setPullDistance(50) // hold at refreshing position
        await onRefresh()
        setIsRefreshing(false)
      }
      
      setPullDistance(0)
      setIsPulling(false)
      startY = 0
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, pullDistance, onRefresh])

  return { isPulling, pullDistance, isRefreshing }
}
