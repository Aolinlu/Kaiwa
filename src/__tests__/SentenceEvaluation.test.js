import { describe, it, expect } from 'vitest'
import { SentenceEvaluation } from '../models/SentenceEvaluation.js'

describe('SentenceEvaluation', () => {
  it('creates from eval JSON response', () => {
    const json = {
      user_text: 'コーヒーありますか',
      grammar: { score: 8, errors: [], correct: ['助词使用正确'] },
      pronunciation: { score: 7, issues: ['长音不够'], good: ['は发音正确'] },
      vocabulary: { level_appropriate: true, new_words_used: ['コーヒー'], suggestions: [] },
      naturalness: { score: 7, comment: '基本自然' },
      overall: 7
    }
    const evaluation = SentenceEvaluation.fromJson(json, 2, 'base64audio')
    expect(evaluation.turnIndex).toBe(2)
    expect(evaluation.userText).toBe('コーヒーありますか')
    expect(evaluation.grammar.score).toBe(8)
    expect(evaluation.pronunciation.score).toBe(7)
    expect(evaluation.overall).toBe(7)
  })

  it('handles missing fields with defaults', () => {
    const json = { user_text: 'test' }
    const evaluation = SentenceEvaluation.fromJson(json, 0, '')
    expect(evaluation.grammar.score).toBe(0)
    expect(evaluation.pronunciation.score).toBe(0)
    expect(evaluation.vocabulary.level_appropriate).toBe(true)
  })
})
