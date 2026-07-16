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
