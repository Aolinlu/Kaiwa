export class Scenario {
  constructor(id, title, titleCn, difficulty, scene, npcPool, missions, missionCount) {
    this.id = id
    this.title = title
    this.titleCn = titleCn
    this.difficulty = difficulty
    this.scene = scene
    this.npcPool = npcPool
    this.missions = missions
    this.missionCount = missionCount
  }

  static fromJson(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json
    return new Scenario(
      data.id,
      data.title,
      data.titleCn,
      data.difficulty,
      data.scene,
      data.npcPool,
      data.missions,
      data.missionCount
    )
  }

  selectNpc() {
    const index = Math.floor(Math.random() * this.npcPool.length)
    return this.npcPool[index]
  }

  assignMissions() {
    const [min, max] = this.missionCount
    const count = min + Math.floor(Math.random() * (max - min + 1))

    const userPool = this.missions.filter(m => m.scope === 'user' || m.scope === 'both')
    const npcPool = this.missions.filter(m => m.scope === 'npc' || m.scope === 'both')

    const userMissions = this._randomPick(userPool, count)
    const npcMissions = this._randomPick(npcPool, count)

    return { userMissions, npcMissions }
  }

  _randomPick(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, arr.length))
  }
}
