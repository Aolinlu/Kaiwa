import { describe, it, expect } from 'vitest'
import { Scenario } from '../models/Scenario.js'

describe('Scenario', () => {
  const validJson = {
    id: 'first-meeting',
    title: 'はじめまして！',
    titleCn: '初次见面！',
    difficulty: 1,
    scene: { title: 'カフェ', description: '咖啡店' },
    npcPool: ['NPC 1', 'NPC 2'],
    missions: [
      { id: 'tell_name', title: '告诉名字', scope: 'both' },
      { id: 'ask_name', title: '询问名字', scope: 'both' },
      { id: 'tell_work', title: '告诉工作', scope: 'user' },
      { id: 'ask_work', title: '询问工作', scope: 'npc' }
    ],
    missionCount: [2, 3]
  }

  it('parses valid JSON', () => {
    const s = Scenario.fromJson(validJson)
    expect(s.id).toBe('first-meeting')
    expect(s.title).toBe('はじめまして！')
    expect(s.difficulty).toBe(1)
  })

  it('selects a random NPC from pool', () => {
    const s = Scenario.fromJson(validJson)
    const npc = s.selectNpc()
    expect(validJson.npcPool).toContain(npc)
  })

  it('assigns missions to user and npc', () => {
    const s = Scenario.fromJson(validJson)
    const { userMissions, npcMissions } = s.assignMissions()
    expect(userMissions.length).toBeGreaterThanOrEqual(2)
    expect(userMissions.length).toBeLessThanOrEqual(3)
    expect(npcMissions.length).toBeGreaterThanOrEqual(2)
    expect(npcMissions.length).toBeLessThanOrEqual(3)
  })

  it('user missions only contain scope user or both', () => {
    const s = Scenario.fromJson(validJson)
    const { userMissions } = s.assignMissions()
    for (const m of userMissions) {
      expect(['user', 'both']).toContain(m.scope)
    }
  })

  it('npc missions only contain scope npc or both', () => {
    const s = Scenario.fromJson(validJson)
    const { npcMissions } = s.assignMissions()
    for (const m of npcMissions) {
      expect(['npc', 'both']).toContain(m.scope)
    }
  })
})
