import { callLLM } from './llm.js'

const JUDGE_PROMPT = `You are a mission judge for a Japanese language conversation game.

Your job: determine which missions were completed or progressed based on the FULL conversation history.

【重要身份定义】
- "npc" = 对话中的 NPC 角色（对方）
- "user" = 对话中的用户（自己）

【Mission 判定规则】
每个 mission 都有一个 goal 描述，判断是否完成的唯一标准就是看是否达成了 goal。

例如：
- ask_name 的 goal 是"已经知道了对方的名字"，那么只要对话中出现了对方的名字（无论谁说的），这个 mission 就算完成。
- tell_name 的 goal 是"用户或NPC主动说出了自己的名字"，那么只要对应方说出了自己的名字，就算完成。

【判定原则】
- 只看结果，不看过程。只要 goal 达成了，就算完成。
- NPC 主动说出信息 = NPC 完成 tell_XXX + user 完成 ask_XXX
- user 主动说出信息 = user 完成 tell_XXX + NPC 完成 ask_XXX

Current Mission Runtime:
{{missionRuntime}}

Full Conversation History:
{{history}}

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
  goal?: string
}

export async function evaluateMissions(
  history: string,
  missions: Mission[]
) {
  console.log(`[Judge] evaluateMissions: history=${history.length} chars`)
  console.log(`[Judge] missions:`, missions.map((m) => `${m.id}(${m.side})=${m.status}`))

  const missionRuntime = missions
    .map((m) => `- [${m.status}] ${m.id} (${m.side}): ${m.title}${m.goal ? `\n  Goal: ${m.goal}` : ''}`)
    .join('\n')

  const prompt = JUDGE_PROMPT
    .replace('{{missionRuntime}}', missionRuntime)
    .replace('{{history}}', history)

  const content = await callLLM([
    { role: 'system', content: prompt },
    { role: 'user', content: '请根据完整对话历史判断 Mission 完成情况。' },
  ])

  const parsed = JSON.parse(content)
  console.log(`[Judge] response:`, parsed)
  return parsed.missionUpdates || []
}
