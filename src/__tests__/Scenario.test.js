import { describe, it, expect } from 'vitest'
import { Scenario } from '../models/Scenario.js'

describe('Scenario', () => {
  const validJson = {
    id: 'first-meeting',
    title: 'はじめまして！',
    titleCn: '初次见面！',
    difficulty: 1,
    scene: { title: 'カフェ', description: '咖啡店' },
    npcPool: [
      { name: '田中太郎', age: 25, work: 'プログラマー', hobbies: ['バスケ'] },
      { name: '佐藤花子', age: 22, work: '学生', hobbies: ['絵'] }
    ],
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
    expect(npc).toHaveProperty('name')
    expect(npc).toHaveProperty('age')
  })

  it('formats NPC identity as structured text', () => {
    const s = Scenario.fromJson(validJson)
    const npc = { name: '田中太郎', age: 25, work: 'プログラマー', hobbies: ['バスケ', '映画'] }
    const identity = s.formatNpcIdentity(npc)
    expect(identity).toContain('- 名前：田中太郎')
    expect(identity).toContain('- 年齢：25')
    expect(identity).toContain('- 職業：プログラマー')
    expect(identity).toContain('- 趣味：バスケ、映画')
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
