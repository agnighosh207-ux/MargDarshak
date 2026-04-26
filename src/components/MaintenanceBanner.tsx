import { useState, useEffect } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export function MaintenanceBanner() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('app_config').select('*').single()
      if (data) setConfig(data)
      setLoading(false)
    }
    loadConfig()

    // Realtime subscription for app config changes
    const channel = supabase.channel('app_config_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_config' }, (payload) => {
        setConfig(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading || !config?.is_maintenance_mode) return null

  return (
    <div className="fixed inset-0 z-[100] bg-[#080a10]/95 backdrop-blur-xl flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="max-w-lg w-full bg-surface border border-danger/30 rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-danger/10 rounded-full blur-[50px] pointer-events-none" />
        
        <div className="w-20 h-20 bg-danger/10 border border-danger/30 rounded-2xl flex items-center justify-center mx-auto mb-8 relative z-10">
          <AlertTriangle className="w-10 h-10 text-danger animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-4 relative z-10 tracking-tight">
          🚧 Under Maintenance
        </h1>
        
        <p className="text-muted text-lg mb-8 leading-relaxed relative z-10">
          {config.maintenance_message || 'System is currently undergoing scheduled maintenance. We will be back shortly.'}
        </p>
        
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-surface-2 border border-border rounded-full relative z-10 text-sm font-semibold text-white">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          We'll be back soon!
        </div>
      </motion.div>
    </div>
  )
}
