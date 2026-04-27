const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export async function askGroq(
  messages: {role: string, content: string}[],
  systemPrompt?: string
): Promise<string> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `Groq API Error: ${response.status}`)
    }

    const data = await response.json()
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Groq API returned no choices')
    }

    return data.choices[0].message.content as string
  } catch (error) {
    console.error('Groq API Failure:', error)
    return "Bhai, AI thoda thak gaya hai. Please try again in a bit! (Groq Error)"
  }
}

