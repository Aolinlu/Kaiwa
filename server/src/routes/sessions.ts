import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

type Env = {
  Variables: {
    userId: string
    role: string
  }
}

export const sessionRoutes = new Hono<Env>()

sessionRoutes.use('/*', authMiddleware)

sessionRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')

  const [sessions, total] = await Promise.all([
    prisma.practiceSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        missions: true,
        report: true,
        _count: { select: { turns: true } },
      },
    }),
    prisma.practiceSession.count({ where: { userId } }),
  ])

  return c.json({ sessions, total, page, limit })
})

sessionRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const { courseId, scenarioId } = await c.req.json()

  const scenarioPath = `../../src/courses/${courseId}/${scenarioId}.json`
  const scenarioModule = await import(scenarioPath)
  const scenario = scenarioModule.default || scenarioModule

  const npc = scenario.npcPool[Math.floor(Math.random() * scenario.npcPool.length)]

  const [min, max] = scenario.missionCount
  const count = min + Math.floor(Math.random() * (max - min + 1))
  const userPool = scenario.missions.filter((m: any) => m.scope === 'user' || m.scope === 'both')
  const npcPool = scenario.missions.filter((m: any) => m.scope === 'npc' || m.scope === 'both')

  function randomPick(arr: any[], n: number) {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length))
  }

  const userMissions = randomPick(userPool, count)
  const npcMissions = randomPick(npcPool, count)

  const session = await prisma.practiceSession.create({
    data: {
      userId,
      courseId,
      scenarioId,
      npcName: npc.name,
      missions: {
        create: [
          ...userMissions.map((m: any) => ({ missionId: m.id, side: 'user' as const, title: m.title })),
          ...npcMissions.map((m: any) => ({ missionId: m.id, side: 'npc' as const, title: m.title })),
        ],
      },
    },
    include: { missions: true },
  })

  return c.json({ session, npc, scenario })
})

sessionRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')
  const sessionId = c.req.param('id')

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      missions: true,
      turns: { orderBy: { turnIndex: 'asc' } },
      report: true,
      events: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!session) {
    return c.json({ error: 'Session not found', code: 'NOT_FOUND' }, 404)
  }

  return c.json({ session })
})

sessionRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const sessionId = c.req.param('id')
  const body = await c.req.json()

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId },
  })

  if (!session) {
    return c.json({ error: 'Session not found', code: 'NOT_FOUND' }, 404)
  }

  const updated = await prisma.practiceSession.update({
    where: { id: sessionId },
    data: body,
  })

  return c.json({ session: updated })
})

sessionRoutes.post('/:id/start', async (c) => {
  const userId = c.get('userId')
  const sessionId = c.req.param('id')

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId },
    include: { missions: true },
  })

  if (!session) {
    return c.json({ error: 'Session not found', code: 'NOT_FOUND' }, 404)
  }

  const scenarioPath = `../../src/courses/${session.courseId}/${session.scenarioId}.json`
  const scenario = await import(scenarioPath)
  const scenarioData = scenario.default || scenario
  const npc = scenarioData.npcPool.find((n: any) => n.name === session.npcName) || scenarioData.npcPool[0]

  const npcIdentity = Object.entries(npc)
    .map(([key, value]) => `- ${key}：${Array.isArray(value) ? value.join('、') : value}`)
    .join('\n')

  const npcMissionsStr = session.missions
    .filter((m) => m.side === 'npc')
    .map((m) => `- [${m.status}] ${m.id}: ${m.title}`)
    .join('\n')

  const userMissionsStr = session.missions
    .filter((m) => m.side === 'user')
    .map((m) => `- [${m.status}] ${m.id}: ${m.title}`)
    .join('\n')

  const { getNPCReply } = await import('../services/npc.js')

  const npcReply = await getNPCReply({
    npcName: npc.name,
    npcIdentity,
    sceneDescription: scenarioData.scene.description,
    npcMissions: npcMissionsStr,
    userMissions: userMissionsStr,
    allComplete: false,
    history: '[]',
    latestUserMessage: '',
    isFirstMessage: true,
    sessionId,
    turnIndex: 0,
  })

  const turn = await prisma.conversationTurn.create({
    data: {
      sessionId,
      turnIndex: 0,
      npcText: npcReply.reply,
      npcTranslation: npcReply.translation,
      npcReading: npcReply.reading,
      npcAudioPath: npcReply.audioPath,
    },
  })

  await prisma.sessionEvent.create({
    data: { sessionId, type: 'conversation_started' },
  })

  return c.json({ turn, hint: npcReply.hint })
})

sessionRoutes.post('/:id/turns', async (c) => {
  const userId = c.get('userId')
  const sessionId = c.req.param('id')
  const { userAudioBase64 } = await c.req.json()

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId },
    include: { missions: true, turns: { orderBy: { turnIndex: 'desc' }, take: 1 } },
  })

  if (!session) {
    return c.json({ error: 'Session not found', code: 'NOT_FOUND' }, 404)
  }

  const turnIndex = (session.turns[0]?.turnIndex ?? -1) + 1

  const allTurns = await prisma.conversationTurn.findMany({
    where: { sessionId },
    orderBy: { turnIndex: 'asc' },
  })
  const history = JSON.stringify(
    allTurns.map((t) => ({ role: 'assistant', content: t.npcText }))
  )

  const { StorageService } = await import('../services/storage.js')
  let userAudioPath: string | null = null
  if (userAudioBase64) {
    const buffer = Buffer.from(userAudioBase64, 'base64')
    userAudioPath = await StorageService.saveAudio(sessionId, `turn_${turnIndex}_user.wav`, buffer)
  }

  const { evaluateUserSpeech } = await import('../services/teacher.js')
  const recentContext = allTurns.slice(-4).map((t) => `NPC: ${t.npcText}\nUser: ${t.userText || ''}`).join('\n')
  const evaluation = await evaluateUserSpeech(userAudioBase64, recentContext)
  const userText = evaluation.user_text || evaluation.transcript || '🎤 Voice message'

  const { evaluateMissions } = await import('../services/judge.js')
  const missionUpdates = await evaluateMissions(
    userText,
    allTurns[allTurns.length - 1]?.npcText || '',
    session.missions
  )

  for (const update of missionUpdates) {
    await prisma.sessionMission.updateMany({
      where: { sessionId, missionId: update.id, side: update.side },
      data: { status: update.status, note: update.note },
    })
  }

  const updatedMissions = await prisma.sessionMission.findMany({ where: { sessionId } })
  const allComplete = updatedMissions.every((m) => m.status === 'completed')

  const scenarioPath = `../../src/courses/${session.courseId}/${session.scenarioId}.json`
  const scenario = await import(scenarioPath)
  const scenarioData = scenario.default || scenario
  const npc = scenarioData.npcPool.find((n: any) => n.name === session.npcName) || scenarioData.npcPool[0]

  const npcIdentity = Object.entries(npc)
    .map(([key, value]) => `- ${key}：${Array.isArray(value) ? value.join('、') : value}`)
    .join('\n')

  const npcMissionsStr = updatedMissions
    .filter((m) => m.side === 'npc')
    .map((m) => `- [${m.status}] ${m.id}: ${m.title}`)
    .join('\n')

  const userMissionsStr = updatedMissions
    .filter((m) => m.side === 'user')
    .map((m) => `- [${m.status}] ${m.id}: ${m.title}`)
    .join('\n')

  const { getNPCReply } = await import('../services/npc.js')
  const npcReply = await getNPCReply({
    npcName: npc.name,
    npcIdentity,
    sceneDescription: scenarioData.scene.description,
    npcMissions: npcMissionsStr,
    userMissions: userMissionsStr,
    allComplete,
    history,
    latestUserMessage: userText,
    isFirstMessage: false,
    sessionId,
    turnIndex,
  })

  const turn = await prisma.conversationTurn.create({
    data: {
      sessionId,
      turnIndex,
      npcText: npcReply.reply,
      npcTranslation: npcReply.translation,
      npcReading: npcReply.reading,
      npcAudioPath: npcReply.audioPath,
      userText,
      userAudioPath,
      grammarScore: evaluation.grammar?.score,
      grammarErrors: JSON.stringify(evaluation.grammar?.errors || []),
      pronunciationScore: evaluation.pronunciation?.score,
      pronunciationIssues: JSON.stringify(evaluation.pronunciation?.issues || []),
      naturalnessScore: evaluation.naturalness?.score,
      overallScore: evaluation.overall,
    },
  })

  await prisma.sessionEvent.create({
    data: {
      sessionId,
      type: 'turn_completed',
      payload: JSON.stringify({ turnIndex, allComplete, missionUpdates }),
    },
  })

  return c.json({
    turn,
    hint: npcReply.hint,
    allComplete,
    end: npcReply.end || false,
    evaluation: {
      grammar: evaluation.grammar,
      pronunciation: evaluation.pronunciation,
      naturalness: evaluation.naturalness,
      overall: evaluation.overall,
    },
  })
})

sessionRoutes.post('/:id/report', async (c) => {
  const userId = c.get('userId')
  const sessionId = c.req.param('id')

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId },
    include: { turns: true, missions: true },
  })

  if (!session) {
    return c.json({ error: 'Session not found', code: 'NOT_FOUND' }, 404)
  }

  const evalsForSummary = session.turns
    .filter((t) => t.overallScore !== null)
    .map((t) => ({
      turnIndex: t.turnIndex,
      userText: t.userText,
      grammar: { score: t.grammarScore, errors: t.grammarErrors },
      pronunciation: { score: t.pronunciationScore, issues: t.pronunciationIssues },
      naturalness: { score: t.naturalnessScore },
      overall: t.overallScore,
    }))

  const summaryPrompt = `Summarize the learner's performance based on these evaluations.
Evaluations: ${JSON.stringify(evalsForSummary, null, 2)}
Output JSON: {
  "score": 0,
  "summary": "总体评价",
  "grammar": { "trend": "", "highlights": [] },
  "pronunciation": { "trend": "", "highlights": [] },
  "vocabulary": { "words_learned": [] },
  "improve": [],
  "next_suggestions": []
}`

  const { callLLM } = await import('../services/llm.js')
  const content = await callLLM([
    { role: 'system', content: summaryPrompt },
    { role: 'user', content: '请生成学习总结。' },
  ])
  const summaryData = JSON.parse(content)

  const report = await prisma.learningReport.upsert({
    where: { sessionId },
    update: {
      overallScore: summaryData.score,
      summary: summaryData.summary,
      grammarTrend: summaryData.grammar?.trend,
      grammarHighlights: JSON.stringify(summaryData.grammar?.highlights || []),
      pronunciationTrend: summaryData.pronunciation?.trend,
      pronunciationHighlights: JSON.stringify(summaryData.pronunciation?.highlights || []),
      wordsLearned: JSON.stringify(summaryData.vocabulary?.words_learned || []),
      improvements: JSON.stringify(summaryData.improve || []),
      nextSuggestions: JSON.stringify(summaryData.next_suggestions || []),
    },
    create: {
      sessionId,
      overallScore: summaryData.score,
      summary: summaryData.summary,
      grammarTrend: summaryData.grammar?.trend,
      grammarHighlights: JSON.stringify(summaryData.grammar?.highlights || []),
      pronunciationTrend: summaryData.pronunciation?.trend,
      pronunciationHighlights: JSON.stringify(summaryData.pronunciation?.highlights || []),
      wordsLearned: JSON.stringify(summaryData.vocabulary?.words_learned || []),
      improvements: JSON.stringify(summaryData.improve || []),
      nextSuggestions: JSON.stringify(summaryData.next_suggestions || []),
    },
  })

  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: { status: 'completed', score: summaryData.score, completedAt: new Date() },
  })

  return c.json({ report })
})
