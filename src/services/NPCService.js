import { API_CONFIG } from '../config/api.js'

const NPC_PROMPT_TEMPLATE = `你是一个正在和日语初学者对话的人。

## 你的身份
{{npcIdentity}}

你就是{{npcName}}。你不是 AI 助手，你是一个真实的人。
和你对话的人是"用户"，不要把自己的名字和用户的名字搞混。

## 场景
{{sceneDescription}}

## 你的任务
{{npcMissions}}

## 用户的任务（仅供参考，不要主动帮用户完成）
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
  "reply": "你的日语回复",
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
1. 牢记你的身份设定
2. 根据对话历史和用户刚说的话，生成一句自然的回复
3. 严格按照上述 JSON 格式输出，不要输出其他内容`

const FIRST_MESSAGE_ADDON = `

这是对话的开始。请生成一句自然的开场白，介绍自己的名字，并向用户提一个问题来开始对话。
不要透露用户想问你的信息。`

export class NPCService {
  static async getReply(npcName, npcIdentity, sceneDescription, npcMissions, userMissions, allComplete, history, latestUserMessage, isFirstMessage) {
    console.log(`[NPC] getReply: isFirst=${isFirstMessage}, allComplete=${allComplete}, npc=${npcName}`)

    let prompt = NPC_PROMPT_TEMPLATE
      .replace('{{npcIdentity}}', npcIdentity)
      .replace('{{npcName}}', npcName)
      .replace('{{sceneDescription}}', sceneDescription)
      .replace('{{npcMissions}}', npcMissions)
      .replace('{{userMissions}}', userMissions)
      .replace('{{allComplete}}', allComplete ? 'YES — wrap up the conversation' : 'NO — continue naturally')
      .replace('{{history}}', history)
      .replace('{{latestUserMessage}}', latestUserMessage || '（对话刚开始）')

    if (isFirstMessage) {
      prompt += FIRST_MESSAGE_ADDON
    }

    console.log('[NPC] prompt length:', prompt.length)

    const messages = [
      { role: 'system', content: prompt },
      { role: 'user', content: '请根据以上设定生成回复。' }
    ]

    console.log('[NPC] sending request...')
    const maxRetries = 2
    for (let i = 0; i < maxRetries; i++) {
      try {
        const data = await this._callAPI(messages)
        if (!data.reply || data.reply.trim() === '') {
          throw new Error('Empty reply')
        }
        console.log('[NPC] response:', data)
        return data
      } catch (e) {
        if (i < maxRetries - 1) {
          console.warn(`[NPC] retrying (${i + 1}/${maxRetries}):`, e.message)
          continue
        }
        throw e
      }
    }
  }

  static async _callAPI(messages) {
    console.log('[NPC] _callAPI: sending', messages.length, 'messages to', API_CONFIG.MODEL)

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
      console.error(`[NPC] _callAPI HTTP error: ${response.status}`, errorText)
      throw new Error(`NPC API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.error('[NPC] _callAPI empty content, full response:', data)
      throw new Error('Empty NPC response')
    }
    console.log('[NPC] _callAPI content string:', content)
    return JSON.parse(content)
  }
}
