import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth.js'
import { sessionRoutes } from './routes/sessions.js'
import { courseRoutes } from './routes/courses.js'
import { audioRoutes } from './routes/audio.js'

const app = new Hono()

app.use('/*', cors({
  origin: 'http://localhost:3000',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
}))

app.route('/api/auth', authRoutes)
app.route('/api/sessions', sessionRoutes)
app.route('/api/courses', courseRoutes)
app.route('/api/audio', audioRoutes)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})
