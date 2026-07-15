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

  formatNpcIdentity(npc) {
    const fieldLabels = {
      name: '名前',
      age: '年齢',
      work: '職業',
      hobbies: '趣味',
      personality: '性格',
      speakingStyle: '話し方',
      background: '背景'
    }

    return Object.entries(npc)
      .map(([key, value]) => {
        const label = fieldLabels[key] || key
        const formattedValue = Array.isArray(value) ? value.join('、') : value
        return `- ${label}：${formattedValue}`
      })
      .join('\n')
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
