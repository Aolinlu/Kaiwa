import 'dotenv/config'

const MIMO_CONFIG = {
  API_KEY: process.env.MIMO_API_KEY || '',
  BASE_URL: process.env.MIMO_BASE_URL || '',
  MODEL: process.env.MIMO_MODEL || '',
}

const MAX_RETRIES = 2

export async function callLLM(messages: { role: string; content: string }[]): Promise<string> {
  console.log(`[LLM] calling ${MIMO_CONFIG.MODEL}, messages=${messages.length}`)

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${MIMO_CONFIG.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${MIMO_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MIMO_CONFIG.MODEL,
          messages,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`LLM API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      // Verify it's valid JSON
      JSON.parse(content)
      return content
    } catch (e) {
      lastError = e as Error
      console.warn(`[LLM] attempt ${attempt + 1}/${MAX_RETRIES} failed:`, e)
      if (attempt < MAX_RETRIES - 1) {
        console.log(`[LLM] retrying...`)
      }
    }
  }

  throw new Error(`LLM failed after ${MAX_RETRIES} attempts: ${lastError?.message}`)
}
