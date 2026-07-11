import { describe, it, expect } from 'vitest'
import { ChatResponse } from '../models/ChatResponse.js'

describe('ChatResponse', () => {
  it('parses valid JSON with all fields', () => {
    const json = {
      reply: 'いらっしゃいませ！',
      translation: '欢迎光临！',
      reading: 'いらっしゃいませ',
      user_text: 'コーヒーください',
      user_reading: 'コーヒーください',
      hint: {
        idea: '表达想要咖啡',
        keywords: ['コーヒー', 'ください'],
        sentence: 'コーヒーをください。',
        sentence_reading: 'コーヒーをください。',
        sentence_translation: '请给我咖啡。'
      },
      stage_hint: 'ordering',
      end: false
    }
    const response = ChatResponse.fromJson(json)
    expect(response.reply).toBe('いらっしゃいませ！')
    expect(response.user_text).toBe('コーヒーください')
    expect(response.hint.idea).toBe('表达想要咖啡')
    expect(response.hint.keywords).toEqual(['コーヒー', 'ください'])
    expect(response.stage_hint).toBe('ordering')
    expect(response.end).toBe(false)
  })

  it('handles missing optional fields gracefully', () => {
    const json = { reply: 'はい', translation: '是', reading: 'はい' }
    const response = ChatResponse.fromJson(json)
    expect(response.reply).toBe('はい')
    expect(response.user_text).toBe('')
    expect(response.hint.idea).toBe('')
    expect(response.hint.keywords).toEqual([])
    expect(response.stage_hint).toBe('')
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
