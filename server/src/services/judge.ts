import { callLLM } from './llm.js'

const JUDGE_PROMPT = `You are a mission judge for a Japanese language conversation game.

Your job: determine which missions were completed or progressed based on the latest conversation.

【重要身份定义】
- "npc" = 对话中的 NPC 角色（对方）
- "user" = 对话中的用户（自己）

Current Mission Runtime:
{{missionRuntime}}

Latest NPC said: "{{npcText}}"
Latest user said: "{{userText}}"

Rules:
- Only judge based on what was actually said
- A mission can go from not_started -> in_progress -> completed
- Never regress a mission status
- Focus on whether the CONTENT was expressed, not exact wording

【关键判定逻辑】
- NPC 主动说出信息（如名字、家乡、爱好）= NPC 完成 tell_XXX + user 完成 ask_XXX
- user 主动说出信息（如名字、家乡、爱好）= user 完成 tell_XXX + NPC 完成 ask_XXX
- 例如：NPC 说"我叫佐藤花子" = NPC 完成 tell_name + user 完成 ask_name
- 例如：user 说"我在京都大学" = user 完成 tell_work/tell_hometown + NPC 完成 ask_work/ask_hometown

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
  npcText: string,
  userText: string,
  missions: Mission[]
) {
  console.log(`[Judge] evaluateMissions: npc="${npcText}", user="${userText}"`)
  console.log(`[Judge] missions:`, missions.map((m) => `${m.id}(${m.side})=${m.status}`))

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
  console.log(`[Judge] response:`, parsed)
  return parsed.missionUpdates || []
}
