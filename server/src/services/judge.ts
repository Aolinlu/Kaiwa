import { callLLM } from './llm.js'

const JUDGE_PROMPT = `You are a mission judge for a Japanese language conversation game.

Your job: determine which missions were completed or progressed based on the FULL conversation history.

【身份定义】
- "npc" = 对话中的 NPC 角色（对方）
- "user" = 对话中的用户（自己）
- 每个 mission 都有一个 side：side=user 表示该 mission 属于 user，side=npc 表示属于 NPC。

【主语铁律（最高优先级）】
- goal 中的"本人" = side 指定的那一方；"对方" = 对话中的另一方。
- tell_XXX：只有 side 方【亲口】说出了自己的信息，才算完成。
  - 对方说出、第三方转述、间接推断，一律不算。
  - ❌ 错误示例：NPC 自我介绍"我叫佐藤花子" → tell_name(user) 完成。这是错的，因为 user 全程没有说过自己的名字。这只能完成 tell_name(npc) 和 ask_name(user)。
- ask_XXX：只要对话中出现了对方的信息（对方主动说出，或本人问出后对方回答），本人即算"知道了"，mission 完成。

【认定标准：宽在表达，严在归属】
- 宽在表达：自报信息的形式不限——省略句、拆成两句、同音/谐音、罗马字、汉字变体，只要意思明确，都算"说出了"。
- 严在归属：必须认准是谁说的。记不清是谁说的、证据不足时，判 in_progress，不要判 completed。

【对偶提示（不改变主语铁律）】
- 一方亲口说出自己的信息时，可能同时完成：自己的 tell_XXX + 对方的 ask_XXX。

【举证义务】
- 判 completed 时，必须在 evidence 中引用对话原话并注明说话人。
- 先找证据，再下结论：找不到原话，就不能判 completed。

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
      "evidence": { "speaker": "user" or "npc", "quote": "对话原话（completed 必填）" },
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
  console.log('[Judge] history:\n' + history)
  console.log(`[Judge] missions:`, missions.map((m) => `${m.id}(${m.side})=${m.status}`))

  const missionRuntime = missions
    .map((m) => `- [${m.status}] ${m.id} (${m.side}): ${m.title}${m.goal ? `\n  Goal: ${m.goal}` : ''}`)
    .join('\n')

  const prompt = JUDGE_PROMPT
    .replace('{{missionRuntime}}', missionRuntime)
    .replace('{{history}}', history)

  const content = await callLLM([
    { role: 'system', content: prompt },
    { role: 'user', content: '请根据完整对话历史判断 Mission 完成情况。记住：先找证据，再下结论。' },
  ])

  const parsed = JSON.parse(content)
  console.log(`[Judge] response:`, parsed)

  const updates = parsed.missionUpdates || []

  // 软校验：completed 但没有举证的，打警告日志（不否决结果，仅暴露问题）
  for (const u of updates) {
    if (u.status === 'completed' && !u.evidence?.quote) {
      console.warn(`[Judge] ⚠️ ${u.id}(${u.side}) marked completed without evidence`)
    }
  }

  return updates
}
