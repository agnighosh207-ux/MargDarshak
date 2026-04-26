import { useEffect } from 'react'

export function useKeyboard(
  onSearch?: () => void,
  onEscape?: () => void,
  onOptionSelect?: (option: number) => void,
  onNavigate?: (dir: 'prev' | 'next') => void,
  isTestSession: boolean = false
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        if (onSearch) {
          e.preventDefault()
          onSearch()
        }
      }
      
      // Escape
      if (e.key === 'Escape') {
        if (onEscape) onEscape()
      }

      // Test Session shortcuts
      if (isTestSession) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          if (onOptionSelect) onOptionSelect(parseInt(e.key) - 1)
        }
        if (e.key === 'ArrowLeft') {
          if (onNavigate) onNavigate('prev')
        }
        if (e.key === 'ArrowRight') {
          if (onNavigate) onNavigate('next')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSearch, onEscape, onOptionSelect, onNavigate, isTestSession])
}
