import { describe, it, expect } from 'vitest'
import { HintResponse, validateHintFormat } from '../models/HintResponse.js'

describe('HintResponse', () => {
  it('creates from valid JSON', () => {
    const hint = new HintResponse('表达想要咖啡', ['コーヒー', 'ください'], 'コーヒーをください。', 'コーヒーをください。', '请给我咖啡。')
    expect(hint.idea).toBe('表达想要咖啡')
    expect(hint.keywords).toEqual(['コーヒー', 'ください'])
    expect(hint.sentence).toBe('コーヒーをください。')
  })

  it('validates complete hint as valid', () => {
    const hint = { idea: 'test', keywords: ['a', 'b'], sentence: 'test sentence', sentence_reading: 'r', sentence_translation: 't' }
    expect(validateHintFormat(hint)).toBe(true)
  })

  it('validates hint missing idea as invalid', () => {
    const hint = { keywords: ['a'], sentence: 'test' }
    expect(validateHintFormat(hint)).toBe(false)
  })

  it('validates hint with empty keywords as invalid', () => {
    const hint = { idea: 'test', keywords: [], sentence: 'test' }
    expect(validateHintFormat(hint)).toBe(false)
  })

  it('validates hint missing sentence as invalid', () => {
    const hint = { idea: 'test', keywords: ['a'] }
    expect(validateHintFormat(hint)).toBe(false)
  })

  it('validates null hint as invalid', () => {
    expect(validateHintFormat(null)).toBe(false)
    expect(validateHintFormat(undefined)).toBe(false)
  })
})
