import { API_CONFIG } from '../config/api.js'
import { ChatResponse, FeedbackResponse } from '../models/ChatResponse.js'

const SYSTEM_PROMPT = `You are a Japanese conversation partner at a convenience store.
The user is a beginner learning Japanese.

Rules:
- 尽量只使用 JLPT N5 vocabulary.
- Maximum 20 words per sentence.
- Ask only one question at a time.
- Don't explain grammar.
- Keep the conversation natural.
- If the user makes mistakes, continue chatting naturally.
- Give corrections only when the conversation ends.
- IMPORTANT: The "reply" field is REQUIRED and must NEVER be empty. Always provide a Japanese response in the "reply" field.
- IMPORTANT: The "hint" object should contain a COMPLETE SUGGESTED REPLY for the user to say next. This is NOT your reply, but a full example answer the user can read aloud. Include the Japanese text, hiragana reading, and Chinese translation.

Output JSON only:
{
  "reply": "Your Japanese response to the user (REQUIRED, never empty)",
  "translation": "Chinese translation of your reply",
  "reading": "Hiragana reading of your reply",
  "hint": {
    "text": "Complete suggested reply in Japanese (e.g., 'コーヒーをください。')",
    "reading": "Hiragana reading of the suggested reply (e.g., 'コーヒーをください。')",
    "translation": "Chinese translation of the suggested reply (e.g., '请给我咖啡。')"
  },
  "end": false
}`

const FEEDBACK_PROMPT = `You are a Japanese language teacher. Review the conversation and provide feedback.

Analyze the conversation between the AI assistant and the user. The user is a beginner learning Japanese.

Provide feedback in this exact JSON format:
{
  "score": 85,
  "good": ["Specific things the user did well, like using polite expressions correctly"],
  "improve": ["Specific areas for improvement, like pronunciation or grammar points"],
  "grammar": ["Grammar patterns used in the conversation"],
  "vocabulary": ["Key vocabulary words from the conversation"]
}

IMPORTANT: 
- score should be between 0-100
- Provide at least 1-2 items in each array
- Be specific and helpful
- Use Chinese for the feedback text`

export class LLMService {
  static async sendMessage(audioBase64, conversationHistory = []) {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      {
        role: 'user',
        content: [
          {
            type: 'input_audio',
            input_audio: {
              data: audioBase64
            }
          }
        ]
      }
    ]

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: messages,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      return ChatResponse.fromJson(content)
    } catch (error) {
      console.error('LLM API error:', error)
      throw error
    }
  }

  static async getFeedback(conversationHistory) {
    const messages = [
      { role: 'system', content: FEEDBACK_PROMPT },
      ...conversationHistory
    ]

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: messages,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      return FeedbackResponse.fromJson(content)
    } catch (error) {
      console.error('Feedback API error:', error)
      throw error
    }
  }
}
