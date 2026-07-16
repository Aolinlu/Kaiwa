import { callLLM } from './llm.js'

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
- IMPORTANT: If someone VOLUNTEERED information without being asked, the mission is STILL completed
- For "ask" missions: if the other party already provided the information, the ask mission is also completed
- Be generous: if the content is clearly expressed, mark as completed

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

interface Mission {
  id: string
  side: string
  title: string
  status: string
}

export async function evaluateMissions(
  userText: string,
  npcText: string,
  missions: Mission[]
) {
  const missionRuntime = missions
    .map((m) => `- [${m.status}] ${m.id} (${m.side}): ${m.title}`)
    .join('\n')

  const prompt = JUDGE_PROMPT
    .replace('{{missionRuntime}}', missionRuntime)
    .replace('{{userText}}', userText)
    .replace('{{npcText}}', npcText)

  const content = await callLLM([
    { role: 'system', content: prompt },
    { role: 'user', content: '请根据最新对话判断 Mission 完成情况。' },
  ])

  const parsed = JSON.parse(content)
  return parsed.missionUpdates || []
}
