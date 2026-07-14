import { describe, it, expect } from 'vitest'
import { ChatResponse, FeedbackResponse } from '../models/ChatResponse.js'

describe('ChatResponse', () => {
  it('parses valid JSON with all fields', () => {
    const json = {
      reply: 'いらっしゃいませ！',
      translation: '欢迎光临！',
      reading: 'いらっしゃいませ',
      hint: {
        idea: '表达想要咖啡',
        keywords: ['コーヒー', 'ください'],
        sentence: 'コーヒーをください。',
        sentence_reading: 'コーヒーをください。',
        sentence_translation: '请给我咖啡。'
      },
      end: false
    }
    const response = ChatResponse.fromJson(json)
    expect(response.reply).toBe('いらっしゃいませ！')
    expect(response.hint.idea).toBe('表达想要咖啡')
    expect(response.hint.keywords).toEqual(['コーヒー', 'ください'])
    expect(response.end).toBe(false)
  })

  it('handles missing optional fields gracefully', () => {
    const json = { reply: 'はい', translation: '是', reading: 'はい' }
    const response = ChatResponse.fromJson(json)
    expect(response.reply).toBe('はい')
    expect(response.hint.idea).toBe('')
    expect(response.hint.keywords).toEqual([])
  })

  it('parses JSON string input', () => {
    const jsonStr = '{"reply":"はい","translation":"是","reading":"はい"}'
    const response = ChatResponse.fromJson(jsonStr)
    expect(response.reply).toBe('はい')
  })

  it('returns fallback on invalid JSON', () => {
    const response = ChatResponse.fromJson('not json')
    expect(response.reply).toBe('すみません、もう一度言ってください。')
  })
})

describe('FeedbackResponse', () => {
  it('parses valid JSON with all fields', () => {
    const json = {
      score: 85,
      summary: 'Good effort overall',
      grammar: { trend: 'improving', highlights: ['助词使用正确'] },
      pronunciation: { trend: 'stable', highlights: ['は发音正确'] },
      vocabulary: { words_learned: ['コーヒー', 'ください'] },
      improve: ['长音不够自然']
    }
    const response = FeedbackResponse.fromJson(json)
    expect(response.score).toBe(85)
    expect(response.summary).toBe('Good effort overall')
    expect(response.grammar.trend).toBe('improving')
    expect(response.vocabulary.words_learned).toEqual(['コーヒー', 'ください'])
    expect(response.improve).toEqual(['长音不够自然'])
  })

  it('handles missing fields with defaults', () => {
    const json = {}
    const response = FeedbackResponse.fromJson(json)
    expect(response.score).toBe(0)
    expect(response.summary).toBe('')
    expect(response.improve).toEqual([])
  })
})
