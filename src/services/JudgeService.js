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
- Be conservative: only mark "completed" if there is clear evidence
- Focus on whether the CONTENT was expressed, not exact wording

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
    const prompt = JUDGE_PROMPT
      .replace('{{missionRuntime}}', missionRuntime.toContextString())
      .replace('{{userText}}', userText)
      .replace('{{npcText}}', npcText)

    const messages = [
      { role: 'system', content: prompt },
      { role: 'user', content: '请根据最新对话判断 Mission 完成情况。' }
    ]

    const data = await this._callAPI(messages)
    return data.missionUpdates || []
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
      throw new Error(`Judge API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty Judge response')
    return JSON.parse(content)
  }
}
