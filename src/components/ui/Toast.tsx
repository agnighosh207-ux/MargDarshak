import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback(({ type, title, description }: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, type, title, description }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <ToastComponent key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastComponent({ toast, onDismiss }: { toast: ToastItem, onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-success" />,
    error: <XCircle className="w-5 h-5 text-danger" />,
    info: <Info className="w-5 h-5 text-primary" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />
  }

  const borderColors = {
    success: 'border-l-success',
    error: 'border-l-danger',
    info: 'border-l-primary',
    warning: 'border-l-amber-500'
  }

  const progressColors = {
    success: 'bg-success',
    error: 'bg-danger',
    info: 'bg-primary',
    warning: 'bg-amber-500'
  }

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`relative w-80 bg-[#0f1220] border border-border rounded-xl shadow-2xl overflow-hidden pointer-events-auto border-l-4 ${borderColors[toast.type]}`}
      onClick={onDismiss}
    >
      <div className="p-4 flex gap-3">
        <div className="shrink-0 pt-0.5">{icons[toast.type]}</div>
        <div>
          <h4 className="text-sm font-semibold text-white">{toast.title}</h4>
          {toast.description && <p className="text-xs text-muted mt-1">{toast.description}</p>}
        </div>
      </div>
      
      {/* Progress Bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 3, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-1 ${progressColors[toast.type]}`}
      />
    </motion.div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
