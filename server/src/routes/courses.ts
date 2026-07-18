import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { readFile, readdir } from 'fs/promises'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SERVER_ROOT = resolve(__dirname, '..', '..')
const COURSES_DIR = resolve(SERVER_ROOT, 'data', 'courses')

type Env = {
  Variables: {
    userId: string
    role: string
  }
}

export const courseRoutes = new Hono<Env>()

courseRoutes.use('/*', authMiddleware)

// GET /api/courses — scan data/courses and return course + scenario metadata
courseRoutes.get('/', async (c) => {
  const entries = (await readdir(COURSES_DIR, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))

  const courses = []

  for (const entry of entries) {
    const courseDir = join(COURSES_DIR, entry.name)
    const files = (await readdir(courseDir)).filter((f) => f.endsWith('.json')).sort()

    let meta: Record<string, any> = { title: entry.name, titleCn: '', description: '' }
    const scenarios = []

    for (const file of files) {
      const data = JSON.parse(await readFile(join(courseDir, file), 'utf-8'))
      if (file === 'course.json') {
        meta = { ...meta, ...data }
        continue
      }
      scenarios.push({
        // id must be the filename: POST /sessions resolves the file by this id
        id: file.replace(/\.json$/, ''),
        title: data.title,
        titleCn: data.titleCn || '',
        difficulty: data.difficulty ?? null,
        sceneTitle: data.scene?.title || '',
        sceneDescription: data.scene?.description || '',
      })
    }

    courses.push({ id: entry.name, ...meta, scenarios })
  }

  return c.json({ courses })
})
