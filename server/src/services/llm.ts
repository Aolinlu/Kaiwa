import 'dotenv/config'

const MIMO_CONFIG = {
  API_KEY: process.env.MIMO_API_KEY || '',
  BASE_URL: process.env.MIMO_BASE_URL || '',
  MODEL: process.env.MIMO_MODEL || '',
}

export async function callLLM(messages: { role: string; content: string }[]): Promise<string> {
  console.log(`[LLM] calling ${MIMO_CONFIG.MODEL}, messages=${messages.length}`)

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
  return data.choices?.[0]?.message?.content || ''
}
