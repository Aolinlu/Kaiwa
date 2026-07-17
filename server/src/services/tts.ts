import 'dotenv/config'
import { StorageService } from './storage.js'

const TTS_CONFIG = {
  API_KEY: process.env.TTS_API_KEY || '',
  MODEL: process.env.TTS_MODEL || 'seed-tts-2.0',
  SPEAKER: process.env.TTS_SPEAKER || 'ja_female_bv520_uranus_bigtts',
}

export async function generateTTS(text: string, sessionId: string, filename: string): Promise<string> {
  const requestId = crypto.randomUUID()

  const response = await fetch('https://openspeech.bytedance.com/api/v3/tts/unidirectional', {
    method: 'POST',
    headers: {
      'X-Api-Key': TTS_CONFIG.API_KEY,
      'X-Api-Resource-Id': TTS_CONFIG.MODEL,
      'X-Api-Request-Id': requestId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      req_params: {
        text,
        speaker: TTS_CONFIG.SPEAKER,
        audio_params: { format: 'mp3', sample_rate: 24000 },
        explicit_language: 'ja',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`)
  }

  const reader = response.body!.getReader()
  const chunks: string[] = []
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += new TextDecoder().decode(value)
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line)
          if (data.data) chunks.push(data.data)
        } catch {}
      }
    }
  }

  if (chunks.length === 0) throw new Error('No audio data received')

  const base64Audio = chunks.join('')
  const audioBuffer = Buffer.from(base64Audio, 'base64')

  return StorageService.saveAudio(sessionId, filename, audioBuffer)
}
