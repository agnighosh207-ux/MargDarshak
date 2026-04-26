import { askGroq } from './groq'

export async function askAI(messages: any[], systemPrompt: string, onFailover?: () => void) {
  try {
    // In a real project, we would use an actual Gemini endpoint.
    // For this demo, we simulate a failover to Groq.
    throw new Error('Simulating Gemini Failover') 
  } catch (error) {
    console.warn('Gemini failed, switching to Groq failover...', error)
    if (onFailover) onFailover()
    return await askGroq(messages, systemPrompt)
  }
}
