export const STAGE_DESCRIPTIONS = {
  greeting: '打招呼，确认对方可以开始对话',
  name: '自我介绍，说出自己的名字',
  hometown: '介绍自己的出身地',
  hobby: '介绍自己的兴趣爱好',
  ordering: '选择想要的商品或服务',
  seating: '确认座位或入座',
  payment: '确认价格，完成付款',
  goodbye: '礼貌告别，结束对话',
  asking: '提出问题',
  clarifying: '确认或追问细节',
  thanking: '表达感谢'
}

export const SCENARIOS = [
  {
    id: 'self-introduction',
    title: '自己紹介',
    titleCn: '自我介绍',
    difficulty: 1,
    goal: 'Introduce yourself to a new acquaintance',
    goalCn: '向新认识的人介绍自己',
    npc: '新しい友達',
    greeting: 'はじめまして！',
    stages: ['greeting', 'name', 'hometown', 'hobby', 'goodbye'],
    successCriteria: [
      '说出自己的名字',
      '介绍出身地',
      '提到一个兴趣爱好'
    ]
  },
  {
    id: 'convenience-store',
    title: 'コンビニ',
    titleCn: '便利店',
    difficulty: 2,
    goal: 'Buy items at a convenience store',
    goalCn: '在便利店购买商品',
    npc: '店員',
    greeting: 'いらっしゃいませ！',
    stages: ['greeting', 'ordering', 'payment', 'goodbye'],
    successCriteria: [
      '说出想要的商品',
      '确认价格',
      '完成付款'
    ]
  },
  {
    id: 'restaurant',
    title: 'レストラン',
    titleCn: '餐厅',
    difficulty: 3,
    goal: 'Order food at a restaurant',
    goalCn: '在餐厅点餐',
    npc: 'ウェイター',
    greeting: 'いらっしゃいませ！何名様ですか？',
    stages: ['greeting', 'seating', 'ordering', 'payment', 'goodbye'],
    successCriteria: [
      '确认用餐人数',
      '点餐',
      '完成付款'
    ]
  },
  {
    id: 'cafe',
    title: 'カフェ',
    titleCn: '咖啡店',
    difficulty: 2,
    goal: 'Order drinks at a café',
    goalCn: '在咖啡店点饮品',
    npc: 'カフェ店員',
    greeting: 'いらっしゃいませ！ご注文は？',
    stages: ['greeting', 'ordering', 'payment', 'goodbye'],
    successCriteria: [
      '选择饮品',
      '确认价格',
      '完成付款'
    ]
  },
  {
    id: 'station',
    title: '駅',
    titleCn: '车站',
    difficulty: 3,
    goal: 'Ask for directions at a train station',
    goalCn: '在车站问路',
    npc: '駅員',
    greeting: 'いらっしゃいませ。何かご質問はありますか？',
    stages: ['greeting', 'asking', 'clarifying', 'thanking', 'goodbye'],
    successCriteria: [
      '提出目的地',
      '确认路线',
      '表达感谢'
    ]
  }
]

export function getScenarioById(id) {
  return SCENARIOS.find(s => s.id === id) || null
}

export function buildStageGuide(stages) {
  return stages
    .map(stage => {
      const desc = STAGE_DESCRIPTIONS[stage] || stage
      return `- ${stage}：${desc}`
    })
    .join('\n')
}
