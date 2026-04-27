import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Shield, Zap, BookOpen, Crown, Lock, Check } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useToast } from '../../components/ui/Toast'

interface StoreItem {
  id: string
  name: string
  description: string
  cost: number
  icon: any
  color: string
  category: 'powerup' | 'feature' | 'cosmetic'
  purchased?: boolean
}

export function MargStorePage() {
  const { profile, updateProfile } = useProfile()
  const { toast } = useToast()
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const currentCoins = profile?.coins || 0
  const inventory = profile?.inventory || []

  const STORE_ITEMS: StoreItem[] = [
    {
      id: 'streak_freeze',
      name: 'Streak Freeze',
      description: 'Missed a day? Automatically protect your streak from resetting once.',
      cost: 50,
      icon: Shield,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      category: 'powerup',
      purchased: inventory.includes('streak_freeze')
    },
    {
      id: 'extra_mock_test',
      name: 'Extra Mock Test',
      description: 'Unlock 1 additional full-length AI mock test beyond your plan limit.',
      cost: 150,
      icon: Zap,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      category: 'powerup'
    },
    {
      id: 'premium_pyq',
      name: 'Decade PYQ Vault',
      description: 'Permanent access to 10 years of chapter-wise sorted previous year questions.',
      cost: 500,
      icon: BookOpen,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      category: 'feature',
      purchased: inventory.includes('premium_pyq')
    },
    {
      id: 'topper_badge',
      name: 'Topper Avatar Badge',
      description: 'Display a golden crown next to your name in the community forum.',
      cost: 1000,
      icon: Crown,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      category: 'cosmetic',
      purchased: inventory.includes('topper_badge')
    }
  ]

  const handlePurchase = async (item: StoreItem) => {
    if (!profile) return
    if (currentCoins < item.cost) {
      toast({
        type: 'error',
        title: 'Not enough coins! 😢',
        description: `You need ${item.cost - currentCoins} more Marg Coins.`
      })
      return
    }

    setPurchasing(item.id)

    try {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 800))

      const newInventory = [...(profile.inventory || [])]
      if (item.category !== 'powerup' || item.id === 'streak_freeze') {
        newInventory.push(item.id)
      }

      await updateProfile({
        coins: profile.coins - item.cost,
        inventory: newInventory,
        ...(item.id === 'streak_freeze' ? { streak_freeze_count: (profile.streak_freeze_count || 0) + 1 } : {})
      })

      toast({
        type: 'success',
        title: 'Purchase Successful! 🎉',
        description: `You have successfully bought ${item.name}.`
      })
    } catch (e) {
      toast({
        type: 'error',
        title: 'Purchase failed',
        description: 'Something went wrong while processing your transaction.'
      })
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-br from-surface to-surface-2 p-8 rounded-3xl border border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Coins className="w-4 h-4" /> Marg Store
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Reward Yourself 🎁</h1>
          <p className="text-muted max-w-xl">Exchange your hard-earned Marg Coins for exclusive power-ups, profile badges, and premium academic features.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#0a0c14] p-4 rounded-2xl border border-border shadow-inner">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Your Balance</p>
            <p className="text-3xl font-bold text-white">{currentCoins}</p>
          </div>
        </div>
      </div>

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STORE_ITEMS.map((item, i) => {
          const Icon = item.icon
          const canAfford = currentCoins >= item.cost
          const isPurchasing = purchasing === item.id
          const alreadyOwned = item.purchased

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300"
            >
              <div className="p-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${item.color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted">{item.category}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                <p className="text-muted text-sm leading-relaxed mb-6 h-10">{item.description}</p>

                <button
                  disabled={alreadyOwned || isPurchasing || (!canAfford && !alreadyOwned)}
                  onClick={() => handlePurchase(item)}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    alreadyOwned 
                      ? 'bg-surface-2 text-white border border-border cursor-not-allowed'
                      : canAfford
                        ? 'bg-primary text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : 'bg-surface-2 text-muted border border-border cursor-not-allowed'
                  }`}
                >
                  {isPurchasing ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : alreadyOwned ? (
                    <>
                      <Check className="w-5 h-5" /> Owned
                    </>
                  ) : (
                    <>
                      {!canAfford && <Lock className="w-4 h-4" />}
                      <Coins className="w-4 h-4" /> {item.cost} Coins
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
