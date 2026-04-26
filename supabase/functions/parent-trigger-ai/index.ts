import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  // 1. Fetch performance data for all users
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, parent_phone, parent_telemetry_enabled')
    .eq('parent_telemetry_enabled', true)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  for (const user of users) {
    // Fetch rank change and focus violations
    const { data: rankUpdates } = await supabase
      .from('predictive_ranks')
      .select('predicted_rank')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2)

    const rankDiff = (rankUpdates?.[1]?.predicted_rank || 0) - (rankUpdates?.[0]?.predicted_rank || 0)
    
    // Synthesis via Gemini (Mocked logic for demo, in real it would be a fetch call)
    const prompt = `Generate a 1-sentence Hinglish update for a parent. 
    Student: ${user.full_name}. 
    Rank Change: ${rankDiff > 0 ? 'Improved' : 'Dropped'} by ${Math.abs(rankDiff)}.
    Style: Professional yet empathetic.`

    const message = `${user.full_name}'s consistency was great, but focus mode dropped by 15%. Rank improved by ${Math.abs(rankDiff)} positions! 🚀`

    // 2. Log to broadcast table
    await supabase.from('pending_whatsapp_broadcast').insert({
      user_id: user.id,
      parent_phone: user.parent_phone,
      message: message,
      status: 'pending'
    })
  }

  return new Response(JSON.stringify({ status: 'success', processed: users.length }), {
    headers: { "Content-Type": "application/json" },
  })
})
