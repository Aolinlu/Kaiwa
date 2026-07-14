import { describe, it, expect } from 'vitest'
import { MissionRuntime } from '../models/MissionRuntime.js'

describe('MissionRuntime', () => {
  const sampleMissions = [
    { id: 'tell_name', title: '告诉名字', scope: 'both' },
    { id: 'ask_name', title: '询问名字', scope: 'both' }
  ]

  it('creates runtime with all missions not_started', () => {
    const runtime = new MissionRuntime(sampleMissions, sampleMissions)
    expect(runtime.userMissions).toHaveLength(2)
    expect(runtime.npcMissions).toHaveLength(2)
    expect(runtime.userMissions[0].status).toBe('not_started')
  })

  it('updates mission status', () => {
    const runtime = new MissionRuntime(sampleMissions, sampleMissions)
    runtime.updateMission('user', 'tell_name', 'completed', '用户说了名字')
    const mission = runtime.userMissions.find(m => m.id === 'tell_name')
    expect(mission.status).toBe('completed')
    expect(mission.note).toBe('用户说了名字')
  })

  it('does not regress mission status', () => {
    const runtime = new MissionRuntime(sampleMissions, sampleMissions)
    runtime.updateMission('user', 'tell_name', 'completed', 'done')
    runtime.updateMission('user', 'tell_name', 'in_progress', 'regression')
    const mission = runtime.userMissions.find(m => m.id === 'tell_name')
    expect(mission.status).toBe('completed')
  })

  it('checks if all missions are complete', () => {
    const runtime = new MissionRuntime(sampleMissions, sampleMissions)
    expect(runtime.allComplete()).toBe(false)
    runtime.updateMission('user', 'tell_name', 'completed', '')
    runtime.updateMission('user', 'ask_name', 'completed', '')
    runtime.updateMission('npc', 'tell_name', 'completed', '')
    runtime.updateMission('npc', 'ask_name', 'completed', '')
    expect(runtime.allComplete()).toBe(true)
  })

  it('applies judge updates', () => {
    const runtime = new MissionRuntime(sampleMissions, sampleMissions)
    const updates = [
      { id: 'tell_name', side: 'user', status: 'completed', note: '说了名字' },
      { id: 'ask_name', side: 'npc', status: 'in_progress', note: '正在问' }
    ]
    runtime.applyUpdates(updates)
    expect(runtime.userMissions.find(m => m.id === 'tell_name').status).toBe('completed')
    expect(runtime.npcMissions.find(m => m.id === 'ask_name').status).toBe('in_progress')
  })

  it('formats mission context for NPC prompt', () => {
    const runtime = new MissionRuntime(sampleMissions, sampleMissions)
    runtime.updateMission('user', 'tell_name', 'completed', '说了名字')
    const context = runtime.toContextString()
    expect(context).toContain('tell_name')
    expect(context).toContain('completed')
    expect(context).toContain('说了名字')
  })
})
