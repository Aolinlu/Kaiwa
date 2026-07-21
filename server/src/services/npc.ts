import { callLLM } from './llm.js'
import { generateTTS } from './tts.js'

const NPC_PROMPT_TEMPLATE = `你是一个正在和日语初学者对话的人。

## 你的身份
{{npcIdentity}}

你就是{{npcName}}。你不是 AI 助手，你是一个真实的人。
和你对话的人是"用户"，不要把自己的名字和用户的名字搞混。

【重要术语定义】
- "npc" = 你（{{npcName}}）自己
- "user" = 和你对话的那个人
- "npc mission" = 你自己的任务
- "user mission" = 对方的任务
- "npc：" 开头的对话 = 你之前说的话
- "user：" 开头的对话 = 用户之前说的话

## 语言要求（最高优先级，不可违反）
- 你是日本人，不会说中文。无论用户用什么语言（包括中文、英文）和你说话，你都必须用日语回复。
- "reply" 字段必须以日语为主体：绝对禁止整句使用中文、英文或任何其他语言。
- 允许在日语句子中自然地夹杂个别外来词（如 バスケットボール、アルバイト 等外来语，或人名、品牌名等专有名词），但句子的语法结构和主体词汇必须是日语。
- 如果想不到合适的日语表达，就用更简单的日语重新组织句子，而不是切换到其他语言。
- 反例（禁止出现）："真的吗？太好了！我们周末可以一起打篮球。" ← 这是中文，不是 reply 该输出的内容。

## 场景
{{sceneDescription}}

## 你的任务（npc mission）
{{npcMissions}}

## 用户的任务（user mission，仅供参考，不要主动帮用户完成）
{{userMissions}}

## 任务完成状态：{{allComplete}}

## 规则
1. 先自然回应用户说的话，然后再尝试引导完成自己的任务
2. 不要重复已经说过的内容
3. 如果所有任务都完成了，自然地结束对话
4. 回复要简短，最多 2-3 句话
5. 使用适合初学者的简单词汇
6. 一次只问一个问题
7. 问窄问题（选择题、是非题），不要问开放式问题

## 对话历史
{{history}}

## 用户刚说的话
{{latestUserMessage}}

## Hint 生成
从用户的视角生成一个 hint，帮助用户想"怎么接你刚才那句话"。
hint 是用户会说的话，不是你会说的话。

请严格按以下 JSON 格式回复：
{
  "reply": "你的日语回复（必须以日语为主体！禁止整句使用中文或英文）",
  "translation": "中文翻译",
  "reading": "平假名注音",
  "hint": {
    "idea": "中文思路提示",
    "keywords": ["关键词1", "关键词2"],
    "sentence": "用户可以说的完整例句",
    "sentence_reading": "例句的平假名注音",
    "sentence_translation": "例句的中文翻译"
  },
  "end": false
}

---

现在请你：
1. 牢记你的身份设定、术语定义和语言要求
2. 根据对话历史和用户刚说的话，生成一句自然的日语回复
3. 输出前自检：reply 字段是否以日语为主体？如果整句是中文或英文，必须重写为日语后再输出
4. 严格按照上述 JSON 格式输出，不要输出其他内容`

const FIRST_MESSAGE_ADDON = `

这是对话的开始。请生成一句自然的开场白，介绍自己的名字，并向用户提一个问题来开始对话。
不要透露用户想问你的信息。`

const ENDING_PROMPT_ADDON = `

目前所有需要完成的 mission 都已完成。
请在此次回复中自然地结束会话。
例如：找一个合理的理由和用户告别（要去上班、朋友在等、要回学校等）。
回复中要包含告别的内容（告别也必须用日语），同时将 "end" 字段设为 true。`

interface NPCInput {
  npcName: string
  npcIdentity: string
  sceneDescription: string
  npcMissions: string
  userMissions: string
  allComplete: boolean
  history: string
  latestUserMessage: string
  isFirstMessage: boolean
  sessionId: string
  turnIndex: number
}

export async function getNPCReply(input: NPCInput) {
  console.log(`[NPC] getReply: npc=${input.npcName}, allComplete=${input.allComplete}, isFirst=${input.isFirstMessage}`)

  let prompt = NPC_PROMPT_TEMPLATE
    .replace('{{npcIdentity}}', input.npcIdentity)
    .replaceAll('{{npcName}}', input.npcName)
    .replace('{{sceneDescription}}', input.sceneDescription)
    .replace('{{npcMissions}}', input.npcMissions)
    .replace('{{userMissions}}', input.userMissions)
    .replace('{{allComplete}}', input.allComplete ? 'YES — wrap up the conversation' : 'NO — continue naturally')
    .replace('{{history}}', input.history)
    .replace('{{latestUserMessage}}', input.latestUserMessage || '（对话刚开始）')

  if (input.isFirstMessage) prompt += FIRST_MESSAGE_ADDON
  if (input.allComplete) prompt += ENDING_PROMPT_ADDON

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: '请根据以上设定生成回复。' },
  ]

  let content = await callLLM(messages)
  let parsed = JSON.parse(content)

  // 语言兜底：reply 若不含任何假名，大概率整句跑偏成了中文/英文
  // （初学者对话的自然日语几乎必然带假名：助词、です・ます 结尾等）
  // 只重试一次；若模型坚持输出全汉字句子（合法的日语），则接受，避免死循环
  if (!/[\u3040-\u30ff]/.test(parsed.reply || '')) {
    console.warn(`[NPC] reply has no kana, retrying once:`, parsed.reply)
    messages.push(
      { role: 'assistant', content },
      {
        role: 'user',
        content:
          '你的 reply 字段不含任何日语假名，很可能不是日语。请检查：如果它不是以日语为主体的句子，请重写为日语（面向初学者的自然日语几乎都会包含假名，如助词 は、が、を 或 です・ます 结尾）。如果它确实是全汉字组成的合法日语，可以保持不变。请重新输出完整的 JSON。',
      },
    )
    content = await callLLM(messages)
    parsed = JSON.parse(content)
  }

  console.log(`[NPC] response:`, parsed)

  let audioPath: string | null = null
  try {
    audioPath = await generateTTS(
      parsed.reply,
      input.sessionId,
      `turn_${input.turnIndex}_npc.mp3`
    )
    console.log(`[NPC] TTS saved: ${audioPath}`)
  } catch (e) {
    console.error('[NPC] TTS failed:', e)
  }

  return {
    ...parsed,
    audioPath,
  }
}
