import { API_CONFIG } from '../config/api.js'

const TEACHER_PROMPT = `You are a Japanese language teacher evaluating a beginner learner's audio utterance.

Your job:
1. Transcribe what the user said in Japanese
2. Evaluate grammar, pronunciation, and naturalness

Recent conversation context:
{{recentContext}}

Output JSON only:
{
  "transcript": "raw transcription of audio",
  "user_text": "corrected Japanese text",
  "grammar": {
    "score": 0,
    "errors": ["specific error descriptions in Chinese"],
    "correct": ["what was done correctly in Chinese"]
  },
  "pronunciation": {
    "score": 0,
    "issues": ["specific pronunciation issues in Chinese"],
    "good": ["good pronunciation points in Chinese"]
  },
  "naturalness": {
    "score": 0,
    "comment": "自然度评价 in Chinese"
  },
  "overall": 0
}

Scoring guide: 0-10 scale. 0-3 = poor, 4-6 = acceptable, 7-8 = good, 9-10 = excellent.
Do NOT care about missions, story, or NPC. Only evaluate language.`

export class TeacherService {
  static async evaluate(audioBase64, conversationMessages) {
    const recentContext = conversationMessages
      .slice(-4)
      .map(msg => msg.toHistoryText())
      .join('\n')

    const prompt = TEACHER_PROMPT.replace('{{recentContext}}', recentContext)

    const messages = [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: [
          { type: 'input_audio', input_audio: { data: audioBase64 } }
        ]
      }
    ]

    const data = await this._callAPI(messages)
    return data
  }

  static async _callAPI(messages) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: API_CONFIG.MODEL,
        messages,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error(`Teacher API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty Teacher response')
    return JSON.parse(content)
  }
}
