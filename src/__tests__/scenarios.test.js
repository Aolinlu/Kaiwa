import { describe, it, expect } from 'vitest'
import { SCENARIOS, getScenarioById, STAGE_DESCRIPTIONS, buildStageGuide } from '../config/scenarios.js'

describe('SCENARIOS', () => {
  it('contains 5 scenarios', () => {
    expect(SCENARIOS).toHaveLength(5)
  })

  it('each scenario has required fields', () => {
    for (const s of SCENARIOS) {
      expect(s).toHaveProperty('id')
      expect(s).toHaveProperty('title')
      expect(s).toHaveProperty('titleCn')
      expect(s).toHaveProperty('difficulty')
      expect(s).toHaveProperty('goal')
      expect(s).toHaveProperty('goalCn')
      expect(s).toHaveProperty('npc')
      expect(s).toHaveProperty('greeting')
      expect(s).toHaveProperty('stages')
      expect(s).toHaveProperty('successCriteria')
      expect(Array.isArray(s.stages)).toBe(true)
      expect(Array.isArray(s.successCriteria)).toBe(true)
      expect(s.stages.length).toBeGreaterThan(0)
    }
  })

  it('each scenario starts with greeting stage', () => {
    for (const s of SCENARIOS) {
      expect(s.stages[0]).toBe('greeting')
    }
  })

  it('each scenario ends with goodbye stage', () => {
    for (const s of SCENARIOS) {
      expect(s.stages[s.stages.length - 1]).toBe('goodbye')
    }
  })

  it('getScenarioById returns correct scenario', () => {
    const scenario = getScenarioById('convenience-store')
    expect(scenario.title).toBe('コンビニ')
  })

  it('getScenarioById returns null for unknown id', () => {
    const scenario = getScenarioById('nonexistent')
    expect(scenario).toBeNull()
  })
})

describe('STAGE_DESCRIPTIONS', () => {
  it('contains greeting description', () => {
    expect(STAGE_DESCRIPTIONS.greeting).toBe('打招呼，确认对方可以开始对话')
  })

  it('contains goodbye description', () => {
    expect(STAGE_DESCRIPTIONS.goodbye).toBe('礼貌告别，结束对话')
  })
})

describe('buildStageGuide', () => {
  it('returns formatted string for stages', () => {
    const result = buildStageGuide(['greeting', 'ordering', 'goodbye'])
    expect(result).toContain('greeting')
    expect(result).toContain('ordering')
    expect(result).toContain('goodbye')
    expect(result).toContain('：')
  })

  it('handles unknown stage gracefully', () => {
    const result = buildStageGuide(['greeting', 'unknown-stage'])
    expect(result).toContain('greeting')
    expect(result).toContain('unknown-stage')
  })
})
