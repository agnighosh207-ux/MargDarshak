import { useState, useEffect } from 'react'

import { AlertTriangle, Settings2, Save, Loader2, ShieldAlert } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '@clerk/clerk-react'
import { useToast } from '../../components/ui/Toast'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { cn } from '../../lib/utils'

export function AppConfig() {
  const { user } = useUser()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    id: 1,
    is_maintenance_mode: false,
    is_development_mode: false,
    maintenance_message: ''
  })
  
  const [confirmModal, setConfirmModal] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('app_config').select('*').single()
      if (data) setConfig(data)
      setLoading(false)
    }
    loadConfig()
  }, [])

  const handleToggleMaintenance = (val: boolean) => {
    if (val) {
      setConfirmModal(true) // require confirmation to turn ON
    } else {
      setConfig({ ...config, is_maintenance_mode: false })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const adminName = user?.fullName || user?.username || 'Admin'
      const { error } = await supabase.from('app_config').update({
        is_maintenance_mode: config.is_maintenance_mode,
        is_development_mode: config.is_development_mode,
        maintenance_message: config.maintenance_message,
        last_updated_by: adminName,
        updated_at: new Date().toISOString()
      }).eq('id', config.id)
      
      if (error) throw error
      toast({ type: 'success', title: 'Configuration saved globally' })
    } catch (err) {
      toast({ type: 'error', title: 'Failed to update config' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-danger" /></div>
  }

  return (
    <div className="max-w-3xl space-y-6">
      
      {/* MAINTENANCE MODE CARD */}
      <div className={cn("border rounded-2xl p-6 lg:p-8 transition-colors duration-300", config.is_maintenance_mode ? "bg-danger/5 border-danger" : "bg-surface border-border")}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-1">
              <ShieldAlert className={cn("w-6 h-6", config.is_maintenance_mode ? "text-danger" : "text-muted")} /> 
              MAINTENANCE MODE
            </h2>
            <p className="text-sm text-muted">Locks down the entire application for non-admin users.</p>
          </div>
          
          <button 
            onClick={() => handleToggleMaintenance(!config.is_maintenance_mode)}
            className={cn("w-16 h-8 rounded-full flex items-center p-1 transition-colors duration-300", config.is_maintenance_mode ? "bg-danger" : "bg-surface-2 border border-border")}
          >
            <div className={cn("w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-md", config.is_maintenance_mode ? "translate-x-8" : "translate-x-0 bg-muted")} />
          </button>
        </div>

        {config.is_maintenance_mode && (
          <div className="p-4 mb-6 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3 text-danger text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>⚠️ All non-admin users currently see the maintenance screen. They cannot log in or access their dashboard.</div>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-muted uppercase tracking-wider mb-2">Maintenance Message</label>
          <textarea
            value={config.maintenance_message}
            onChange={e => setConfig({ ...config, maintenance_message: e.target.value })}
            maxLength={200}
            rows={3}
            className={cn("w-full bg-[#0a0c14] border rounded-lg px-4 py-3 text-white resize-none transition-colors", config.is_maintenance_mode ? "border-danger/30 focus:border-danger outline-none" : "border-border focus:border-white/30 outline-none")}
          />
          <div className="text-right text-xs text-muted font-medium mt-1">{config.maintenance_message.length}/200</div>
        </div>
      </div>

      {/* DEV MODE CARD */}
      <div className={cn("border rounded-2xl p-6 lg:p-8 transition-colors duration-300", config.is_development_mode ? "bg-amber-500/5 border-amber-500/50" : "bg-surface border-border")}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-1">
              <Settings2 className={cn("w-6 h-6", config.is_development_mode ? "text-amber-500" : "text-muted")} /> 
              DEVELOPMENT MODE
            </h2>
            <p className="text-sm text-muted">Enables experimental features and verbose logging in production.</p>
          </div>
          
          <button 
            onClick={() => setConfig({ ...config, is_development_mode: !config.is_development_mode })}
            className={cn("w-14 h-7 rounded-full flex items-center p-1 transition-colors duration-300", config.is_development_mode ? "bg-amber-500" : "bg-surface-2 border border-border")}
          >
            <div className={cn("w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md", config.is_development_mode ? "translate-x-7" : "translate-x-0 bg-muted")} />
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="bg-white text-black hover:bg-white/90 font-bold px-8 py-4 h-auto shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          {saving ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving Configuration...</> : <><Save className="w-5 h-5 mr-2" /> Save Global Configuration</>}
        </Button>
      </div>

      {/* Modals */}
      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} className="max-w-md p-6 border-danger/50">
        <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2"><AlertTriangle className="text-danger" /> Enable Maintenance?</h3>
        <p className="text-sm text-muted mb-6">This will immediately block all non-admin users from accessing the application until disabled.</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirmModal(false)}>Cancel</Button>
          <Button className="flex-1 bg-danger text-white hover:bg-danger/90" onClick={() => { setConfig({ ...config, is_maintenance_mode: true }); setConfirmModal(false); }}>Yes, Lock Down App</Button>
        </div>
      </Modal>

    </div>
  )
}
