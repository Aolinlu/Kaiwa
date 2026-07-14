import { API_CONFIG } from '../config/api.js'

const NPC_PROMPT = `You are {{npcDescription}}

You are having a natural conversation in Japanese with a beginner learner.

Scene: {{sceneDescription}}

Your missions:
{{npcMissions}}

User's missions (for your reference, to understand what the user is trying to do):
{{userMissions}}

All missions complete: {{allComplete}}

Rules:
1. NATURALNESS FIRST — always respond naturally to what the user said
2. After responding, try to guide the conversation toward completing your missions
3. Do NOT repeat things already said in the conversation
4. If all missions are complete, wrap up the conversation naturally with a goodbye
5. Keep replies short (max 20 sentences per reply)
6. Use vocabulary appropriate for difficulty {{difficulty}} level
7. Ask only ONE question at a time
8. Ask NARROW questions (choices, yes/no), NOT open-ended questions

Hint generation:
- Generate a hint from the USER's perspective — help them figure out how to reply to your last message
- The hint should be what the USER would say next, not what you would say

Conversation history:
{{history}}

Output JSON only:
{
  "reply": "your Japanese response",
  "translation": "Chinese translation of reply",
  "reading": "Hiragana reading of reply",
  "hint": {
    "idea": "中文思路提示 — what the user should express next",
    "keywords": ["keyword1", "keyword2"],
    "sentence": "complete example sentence in Japanese that the user could say",
    "sentence_reading": "Hiragana reading of example sentence",
    "sentence_translation": "Chinese translation of example sentence"
  },
  "end": false
}`

export class NPCService {
  static async getReply(npcDescription, sceneDescription, difficulty, npcMissions, userMissions, allComplete, history, isFirstMessage) {
    let prompt = NPC_PROMPT
      .replace('{{npcDescription}}', npcDescription)
      .replace('{{sceneDescription}}', sceneDescription)
      .replace('{{difficulty}}', difficulty)
      .replace('{{npcMissions}}', npcMissions)
      .replace('{{userMissions}}', userMissions)
      .replace('{{allComplete}}', allComplete ? 'YES — wrap up the conversation' : 'NO — continue naturally')
      .replace('{{history}}', history)

    if (isFirstMessage) {
      prompt += '\n\nThis is the FIRST message. Generate a natural greeting that introduces yourself and guides the user to start talking. Do NOT use a generic greeting — make it specific to your missions.'
    }

    const messages = [
      { role: 'system', content: prompt },
      { role: 'user', content: isFirstMessage ? '开始对话。' : `User said: ${history.split('\n').pop()}` }
    ]

    const maxRetries = 2
    for (let i = 0; i < maxRetries; i++) {
      try {
        const data = await this._callAPI(messages)
        if (!data.reply || data.reply.trim() === '') {
          throw new Error('Empty reply')
        }
        return data
      } catch (e) {
        if (i < maxRetries - 1) continue
        throw e
      }
    }
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
      throw new Error(`NPC API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty NPC response')
    return JSON.parse(content)
  }
}
