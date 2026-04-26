import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Swords, Users, Trophy, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/utils'

export function BountyArenaPage() {
  const { profile } = useProfile()
  const { toast } = useToast()
  
  const [isInQueue, setIsInQueue] = useState(false)
  const [wagerAmount, setWagerAmount] = useState(100)
  const [activeMatch, setActiveMatch] = useState<any>(null)
  const [matchQuestions, setMatchQuestions] = useState<any[]>([])
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [p1Answers, setP1Answers] = useState<any[]>([])
  const [p2Answers, setP2Answers] = useState<any[]>([])
  const [winner, setWinner] = useState<string | null>(null)

  // Real-time Matchmaking & Battle Logic
  useEffect(() => {
    if (!profile) return

    const matchChannel = supabase.channel('bounty_lobby')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bounty_matches' }, (payload) => {
        if (payload.new.player_1_id === profile.id || payload.new.player_2_id === profile.id) {
          setActiveMatch(payload.new)
          setMatchQuestions(payload.new.questions || [])
          setIsInQueue(false)
          toast({ type: 'success', title: 'MATCH FOUND! ⚔️', description: 'Battle is starting now...' })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bounty_matches' }, (payload) => {
        if (payload.new.id === activeMatch?.id) {
          setActiveMatch(payload.new)
          setP1Answers(payload.new.p1_answers || [])
          setP2Answers(payload.new.p2_answers || [])
          if (payload.new.match_status === 'completed') {
            setWinner(payload.new.winner_id)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(matchChannel)
    }
  }, [profile, activeMatch?.id])

  const joinQueue = async () => {
    if (!profile) return
    if ((profile.credits_cr || 0) < wagerAmount) {
      toast({ type: 'error', title: 'Aukat ke bahar hai 😅', description: 'Not enough credits for this wager.' })
      return
    }

    setIsInQueue(true)
    
    // Check if someone else is in queue for the same amount
    const { data: opponent } = await supabase.from('bounty_queue')
      .select('*')
      .eq('wager_amount', wagerAmount)
      .neq('user_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (opponent) {
      // Create match
      const mockQuestions = [
        { q: 'A car starts from rest and accelerates at 2m/s². Distance in 5s?', options: ['A) 25m', 'B) 50m', 'C) 10m', 'D) 100m'], correct: 'A' },
        { q: 'Which element has the highest electronegativity?', options: ['A) O', 'B) F', 'C) Cl', 'D) N'], correct: 'B' },
        { q: 'Value of sin(45°) + cos(45°)?', options: ['A) 1', 'B) √2', 'C) 1/√2', 'D) 0'], correct: 'B' }
      ]

      const { data: match } = await supabase.from('bounty_matches').insert({
        player_1_id: opponent.user_id,
        player_2_id: profile.id,
        wager_amount: wagerAmount,
        match_status: 'active',
        questions: mockQuestions
      }).select().single()

      // Remove opponent from queue
      await supabase.from('bounty_queue').delete().eq('user_id', opponent.user_id)
      
      if (match) {
        setActiveMatch(match)
        setMatchQuestions(mockQuestions)
        setIsInQueue(false)
      }
    } else {
      // Add to queue
      await supabase.from('bounty_queue').upsert({ user_id: profile.id, wager_amount: wagerAmount })
    }
  }

  const handleAnswer = async (answer: string) => {
    if (!activeMatch || !profile) return
    
    const isP1 = activeMatch.player_1_id === profile.id
    const updatedAnswers = isP1 ? [...p1Answers, answer] : [...p2Answers, answer]
    
    const updateObj = isP1 ? { p1_answers: updatedAnswers } : { p2_answers: updatedAnswers }
    
    // Check if this was the last question
    if (updatedAnswers.length === matchQuestions.length) {
      // Very simple winner logic for now: first to finish with more correct wins
      // In a real app, this would be handled by a DB function to avoid cheating
    }

    await supabase.from('bounty_matches').update(updateObj).eq('id', activeMatch.id)
    setCurrentQIndex(prev => prev + 1)
  }

  if (activeMatch) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col relative overflow-hidden bg-black rounded-3xl border border-white/10 shadow-2xl">
        {/* VS SPLIT SCREEN EFFECT */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="w-1/2 bg-indigo-600/5 border-r border-white/5" />
          <div className="w-1/2 bg-amber-600/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-black text-white/5 italic select-none">VS</div>
        </div>

        {/* HUD */}
        <div className="relative z-10 p-6 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 overflow-hidden bg-indigo-500/20">
               <Users className="w-full h-full p-2 text-indigo-500" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-400 uppercase tracking-widest">Player 1</div>
              <div className="text-sm font-bold text-white">Lobby Host</div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xl font-black text-white flex items-center gap-3">
               <Trophy className="w-5 h-5 text-primary" /> {wagerAmount * 1.9} Credits
            </div>
            <div className="text-[10px] font-bold text-muted mt-2 tracking-[0.2em] uppercase">Bounty Pool (5% Fee)</div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-xs font-black text-amber-500 uppercase tracking-widest">Player 2</div>
              <div className="text-sm font-bold text-white">Challenger</div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-amber-500 overflow-hidden bg-amber-500/20">
               <Users className="w-full h-full p-2 text-amber-500" />
            </div>
          </div>
        </div>

        {/* BATTLE ARENA */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
          {winner ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-4xl font-black text-white mb-2">{winner === profile?.id ? 'YOU WON!' : 'YOU LOST!'}</h2>
              <p className="text-muted mb-8">{winner === profile?.id ? `+${wagerAmount * 0.9} Credits added to wallet.` : 'Dukh dard peeda... kal try karna.'}</p>
              <Button onClick={() => setActiveMatch(null)}>Return to Lobby</Button>
            </motion.div>
          ) : currentQIndex < matchQuestions.length ? (
            <div className="w-full max-w-2xl">
              <div className="flex justify-between mb-8">
                {matchQuestions.map((_, i) => (
                  <div key={i} className={cn("h-2 flex-1 mx-1 rounded-full transition-all duration-500", i < currentQIndex ? "bg-primary" : i === currentQIndex ? "bg-white animate-pulse" : "bg-white/10")} />
                ))}
              </div>

              <motion.div 
                key={currentQIndex}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md mb-8"
              >
                <div className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4">Question {currentQIndex + 1}</div>
                <h3 className="text-2xl font-bold text-white leading-tight">{matchQuestions[currentQIndex].q}</h3>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchQuestions[currentQIndex].options.map((opt: string) => (
                  <Button 
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className="h-20 text-lg font-bold bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/50 group"
                    variant="outline"
                  >
                    <span className="group-hover:scale-110 transition-transform">{opt}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="text-xl font-black text-white animate-pulse">Waiting for opponent...</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4 flex items-center gap-4">
            <Swords className="w-12 h-12 text-primary" /> THE BOUNTY ARENA
          </h1>
          <p className="text-xl text-muted max-w-lg leading-relaxed">
            High-stakes 1v1 rapid battles. Wager your credits, answer faster than your opponent, and take the pool.
          </p>
        </div>

        <div className="bg-surface border border-border p-8 rounded-3xl w-full md:w-96 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="text-xs font-black text-muted uppercase tracking-widest mb-6">Match Settings</div>
          
          <div className="space-y-4 mb-8">
            <label className="block text-sm font-bold text-white">Wager Amount</label>
            <div className="grid grid-cols-3 gap-2">
              {[100, 500, 1000].map(amt => (
                <button 
                  key={amt}
                  onClick={() => setWagerAmount(amt)}
                  className={cn("py-3 rounded-xl border text-sm font-black transition-all", wagerAmount === amt ? "bg-primary text-black border-primary" : "bg-white/5 border-white/10 text-muted hover:border-white/30")}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          <Button 
            className="w-full h-16 text-xl font-black shadow-[0_0_30px_rgba(245,158,11,0.2)]" 
            disabled={isInQueue}
            onClick={joinQueue}
          >
            {isInQueue ? (
              <span className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" /> Searching for Prey...
              </span>
            ) : 'JOIN BATTLE QUEUE'}
          </Button>

          <p className="text-[10px] text-muted text-center mt-6 uppercase font-bold tracking-widest">
            Wallet Balance: {profile?.credits_cr || 0} Credits
          </p>
        </div>
      </div>

      {/* RECENT BATTLES LIST (MOCK) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { player1: 'Agnish', player2: 'Rahul', pool: 1900, status: 'Live' },
          { player1: 'Sumit', player2: 'Priya', pool: 950, status: 'Completed' },
          { player1: 'Aryan', player2: 'Isha', pool: 190, status: 'Completed' },
        ].map((battle, i) => (
          <div key={i} className="bg-surface-2 border border-border p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className={cn("px-2 py-1 rounded text-[10px] font-black uppercase", battle.status === 'Live' ? "bg-danger/20 text-danger" : "bg-white/10 text-muted")}>
                {battle.status}
              </span>
              <span className="text-xs font-bold text-primary">{battle.pool} Pool</span>
            </div>
            <div className="flex items-center justify-between font-black text-white italic">
              <span>{battle.player1}</span>
              <span className="text-muted text-sm mx-2">VS</span>
              <span>{battle.player2}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
