import { API_CONFIG } from '../config/api.js'

const JUDGE_PROMPT = `You are a mission judge for a Japanese language conversation game.

Your job: determine which missions were completed or progressed based on the latest conversation.

Current Mission Runtime:
{{missionRuntime}}

Latest user said: "{{userText}}"
Latest NPC said: "{{npcText}}"

Rules:
- Only judge based on what was actually said
- A mission can go from not_started -> in_progress -> completed
- Never regress a mission status
- Focus on whether the CONTENT was expressed, not exact wording
- IMPORTANT: If someone VOLUNTEERED information without being asked (e.g., NPC said "I'm from Tokyo" even though user didn't ask), the mission is STILL completed. The content was expressed, regardless of whether it was in response to a question or volunteered freely.
- For "ask" missions (e.g., "ask_hometown"): if the other party already provided the information, the ask mission is also completed — there's no need to ask again.
- Be generous: if the content is clearly expressed, mark as completed.

Output JSON only:
{
  "missionUpdates": [
    {
      "id": "mission_id",
      "side": "user" or "npc",
      "status": "in_progress" or "completed",
      "note": "brief explanation in Chinese"
    }
  ]
}`

export class JudgeService {
  static async evaluateMission(userText, npcText, missionRuntime) {
    console.log(`[Judge] evaluateMission: user="${userText}", npc="${npcText}"`)

    const prompt = JUDGE_PROMPT
      .replace('{{missionRuntime}}', missionRuntime.toContextString())
      .replace('{{userText}}', userText)
      .replace('{{npcText}}', npcText)

    const messages = [
      { role: 'system', content: prompt },
      { role: 'user', content: '请根据最新对话判断 Mission 完成情况。' }
    ]

    console.log('[Judge] sending request...')
    const data = await this._callAPI(messages)
    console.log('[Judge] response:', data)
    return data.missionUpdates || []
  }

  static async _callAPI(messages) {
    console.log('[Judge] _callAPI: sending', messages.length, 'messages to', API_CONFIG.MODEL)

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
      const errorText = await response.text()
      console.error(`[Judge] _callAPI HTTP error: ${response.status}`, errorText)
      throw new Error(`Judge API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.error('[Judge] _callAPI empty content, full response:', data)
      throw new Error('Empty Judge response')
    }
    console.log('[Judge] _callAPI content string:', content)
    return JSON.parse(content)
  }
}
