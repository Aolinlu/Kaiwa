const STATUS_ORDER = { not_started: 0, in_progress: 1, completed: 2 }

export class MissionRuntime {
  constructor(userMissionDefs, npcMissionDefs) {
    this.userMissions = userMissionDefs.map(m => ({
      id: m.id,
      title: m.title,
      status: 'not_started',
      note: ''
    }))
    this.npcMissions = npcMissionDefs.map(m => ({
      id: m.id,
      title: m.title,
      status: 'not_started',
      note: ''
    }))
  }

  updateMission(side, id, status, note) {
    const list = side === 'user' ? this.userMissions : this.npcMissions
    const mission = list.find(m => m.id === id)
    if (!mission) return

    if (STATUS_ORDER[status] > STATUS_ORDER[mission.status]) {
      mission.status = status
      mission.note = note
    }
  }

  applyUpdates(updates) {
    for (const u of updates) {
      this.updateMission(u.side, u.id, u.status, u.note)
    }
  }

  allComplete() {
    const userDone = this.userMissions.every(m => m.status === 'completed')
    const npcDone = this.npcMissions.every(m => m.status === 'completed')
    return userDone && npcDone
  }

  toContextString() {
    let context = '## User Missions\n'
    for (const m of this.userMissions) {
      context += `- [${m.status}] ${m.id} (${m.title}): ${m.note}\n`
    }
    context += '\n## NPC Missions\n'
    for (const m of this.npcMissions) {
      context += `- [${m.status}] ${m.id} (${m.title}): ${m.note}\n`
    }
    return context
  }
}
