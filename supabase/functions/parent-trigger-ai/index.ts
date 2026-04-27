import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing environment variables" }), { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 1. Fetch performance data for all users
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, parent_phone, parent_telemetry_enabled')
    .eq('parent_telemetry_enabled', true)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  if (!users) return new Response(JSON.stringify({ status: 'success', processed: 0 }), { status: 200 })

  for (const user of users) {
    // Fetch rank change and focus violations
    const { data: rankUpdates } = await supabase
      .from('predictive_ranks')
      .select('predicted_rank')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2)

    let rankDiff = 0
    if (rankUpdates && rankUpdates.length >= 2) {
      rankDiff = (rankUpdates[1].predicted_rank || 0) - (rankUpdates[0].predicted_rank || 0)
    }
    
    // Synthesis via Gemini (Mocked logic for demo)
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

