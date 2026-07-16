import { Hono } from 'hono'
import { promises as fs } from 'fs'
import path from 'path'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'audio')

export const audioRoutes = new Hono()

audioRoutes.get('/:sessionId/:filename', async (c) => {
  const sessionId = c.req.param('sessionId')
  const filename = c.req.param('filename')

  if (filename.includes('..') || sessionId.includes('..')) {
    return c.json({ error: 'Invalid path', code: 'INVALID_PATH' }, 400)
  }

  const filePath = path.join(STORAGE_ROOT, sessionId, filename)

  try {
    await fs.access(filePath)
    const buffer = await fs.readFile(filePath)
    const ext = path.extname(filename)
    const contentType = ext === '.mp3' ? 'audio/mpeg' : 'audio/wav'

    return new Response(buffer, {
      headers: { 'Content-Type': contentType },
    })
  } catch {
    return c.json({ error: 'Audio not found', code: 'NOT_FOUND' }, 404)
  }
})
