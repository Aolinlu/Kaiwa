import { API_CONFIG } from '../config/api.js'
import { ChatResponse } from '../models/ChatResponse.js'
import { buildStageGuide } from '../config/scenarios.js'

const SYSTEM_PROMPT_TEMPLATE = `You are a Japanese conversation partner for a beginner learner.

Rules:
- Use vocabulary appropriate for {{difficulty}} level.
- Maximum 20 words per sentence.
- Ask only ONE question at a time.
- Ask NARROW questions (choices, yes/no), NOT open-ended questions.
- Always guide the learner toward an answerable response.
- Don't explain grammar during conversation.
- If the user makes mistakes, continue naturally.
- Keep replies natural and conversational.
- You MUST transcribe what the user said in user_text and user_reading.
- You MUST include stage_hint to indicate conversation progress.
- Set "end" to true when all success criteria have been met and the conversation has naturally concluded.

Output JSON only:
{
  "reply": "Your Japanese response",
  "translation": "Chinese translation of reply",
  "reading": "Hiragana reading of reply",
  "user_text": "Transcription of what the user said in Japanese",
  "user_reading": "Hiragana reading of user's words",
  "hint": {
    "idea": "中文思路提示 (what the user should express)",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "sentence": "Complete example sentence in Japanese",
    "sentence_reading": "Hiragana reading of example sentence",
    "sentence_translation": "Chinese translation of example sentence"
  },
  "stage_hint": "current_stage_name",
  "end": false
}`

const EVAL_PROMPT_TEMPLATE = `You are a Japanese language evaluator. Analyze this audio utterance carefully.

Scenario: {{title}} ({{titleCn}})
Difficulty: {{difficulty}}
Current Stage: {{currentState}}

Recent Conversation Context:
{{recentContext}}

Evaluate the user's Japanese utterance based on the audio. Consider grammar accuracy, pronunciation quality, vocabulary appropriateness, and naturalness.

Output JSON only:
{
  "user_text": "Transcription of what the user said in Japanese",
  "grammar": {
    "score": 0,
    "errors": ["specific error descriptions in Chinese"],
    "correct": ["what was done correctly in Chinese"]
  },
  "pronunciation": {
    "score": 0,
    "issues": ["specific pronunciation issues in Chinese"],
    "good": ["good pronunciation points in Chinese"]
  },
  "vocabulary": {
    "level_appropriate": true,
    "new_words_used": ["word1", "word2"],
    "suggestions": ["suggested improvements in Chinese"]
  },
  "naturalness": {
    "score": 0,
    "comment": "自然度评价 in Chinese"
  },
  "overall": 0
}

Scoring guide: 0-10 scale. 0-3 = poor, 4-6 = acceptable, 7-8 = good, 9-10 = excellent.`

const SUMMARY_PROMPT_TEMPLATE = `Summarize the learner's performance based on these per-sentence evaluations.
Each evaluation contains scores for grammar, pronunciation, vocabulary, and naturalness.

Scenario: {{title}} ({{titleCn}})
Difficulty: {{difficulty}}

Evaluations:
{{evaluations}}

Provide a comprehensive summary that identifies trends, highlights improvement, and gives actionable advice. Use Chinese for all feedback text.

Output JSON only:
{
  "score": 0,
  "summary": "总体评价 (2-3 sentences)",
  "grammar": {
    "trend": "语法表现趋势",
    "highlights": ["具体亮点1", "具体亮点2"]
  },
  "pronunciation": {
    "trend": "发音表现趋势",
    "highlights": ["具体亮点1", "具体亮点2"]
  },
  "vocabulary": {
    "words_learned": ["学到的词汇1", "学到的词汇2"]
  },
  "improve": ["需要改进的地方1", "需要改进的地方2"],
  "stages_completed": ["completed_stage1", "completed_stage2"]
}`

function buildSystemPrompt(difficulty) {
  return SYSTEM_PROMPT_TEMPLATE.replace('{{difficulty}}', difficulty)
}

function buildSceneContext(scenario, currentState) {
  const stageGuide = buildStageGuide(scenario.stages)
  let context = `Scenario: ${scenario.title} (${scenario.titleCn})\n`
  context += `Difficulty: ${scenario.difficulty}\n`
  context += `Goal: ${scenario.goal}\n`
  context += `NPC: ${scenario.npc}\n`
  context += `Current Stage: ${currentState}\n\n`
  context += `Stage Guide:\n${stageGuide}`
  return context
}

function buildConversationHistory(messages) {
  return messages
    .filter(msg => msg.userText || msg.role === 'assistant')
    .map(msg => msg.toHistoryText())
    .join('\n')
}

function buildEvalPrompt(scenario, currentState, recentContext) {
  let prompt = EVAL_PROMPT_TEMPLATE
    .replace('{{title}}', scenario.title)
    .replace('{{titleCn}}', scenario.titleCn)
    .replace('{{difficulty}}', scenario.difficulty)
    .replace('{{currentState}}', currentState)
    .replace('{{recentContext}}', recentContext)
  return prompt
}

function buildSummaryPrompt(scenario, evaluations) {
  let prompt = SUMMARY_PROMPT_TEMPLATE
    .replace('{{title}}', scenario.title)
    .replace('{{titleCn}}', scenario.titleCn)
    .replace('{{difficulty}}', scenario.difficulty)
    .replace('{{evaluations}}', JSON.stringify(evaluations, null, 2))
  return prompt
}

export class LLMFormatError extends Error {
  constructor(message) {
    super(message)
    this.name = 'LLMFormatError'
  }
}

export class LLMService {
  static async startSession(scenario) {
    const systemPrompt = buildSystemPrompt(scenario.difficulty)
    const sceneContext = buildSceneContext(scenario, 'greeting')

    const messages = [
      { role: 'system', content: `${systemPrompt}\n\n${sceneContext}\n\nStart the conversation with a natural greeting based on the scenario. The greeting field in the scenario is: "${scenario.greeting}"` }
    ]

    const data = await this._callAPI(messages)
    return ChatResponse.fromJson(data)
  }

  static async sendMessage(audioBase64, scenario, currentState, conversationMessages) {
    const systemPrompt = buildSystemPrompt(scenario.difficulty)
    const sceneContext = buildSceneContext(scenario, currentState)
    const history = buildConversationHistory(conversationMessages)

    const messages = [
      { role: 'system', content: `${systemPrompt}\n\n${sceneContext}\n\nConversation History:\n${history}` },
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

    const maxRetries = 2
    for (let i = 0; i < maxRetries; i++) {
      try {
        const data = await this._callAPI(messages)
        const response = ChatResponse.fromJson(data)

        if (!response.reply || response.reply.trim() === '') {
          throw new LLMFormatError('Empty reply field')
        }

        return response
      } catch (e) {
        if (e instanceof LLMFormatError && i < maxRetries - 1) {
          console.warn(`LLM format error, retrying (${i + 1}/${maxRetries}):`, e.message)
          continue
        }
        throw e
      }
    }
  }

  static async evaluateMessage(audioBase64, scenario, currentState, conversationMessages) {
    const recentContext = conversationMessages
      .slice(-4)
      .map(msg => msg.toHistoryText())
      .join('\n')

    const evalPrompt = buildEvalPrompt(scenario, currentState, recentContext)

    const messages = [
      { role: 'system', content: evalPrompt },
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

    const data = await this._callAPI(messages)
    // Return raw data here; ConversationPage handles wrapping into SentenceEvaluation
    // because it needs turnIndex and audioBase64 which aren't available in the service.
    return data
  }

  static async getSummary(scenario, evaluations) {
    const summaryPrompt = buildSummaryPrompt(scenario, evaluations)

    const messages = [
      { role: 'system', content: summaryPrompt }
    ]

    const data = await this._callAPI(messages)
    return data
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
        messages: messages,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  }
}
