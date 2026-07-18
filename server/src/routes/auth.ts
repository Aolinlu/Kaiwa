import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { signToken } from '../utils/jwt.js'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

type Env = {
  Variables: {
    userId: string
    role: string
  }
}

export const authRoutes = new Hono<Env>()

authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: 'Email and password required', code: 'MISSING_FIELDS' }, 400)
  }

  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) {
    return c.json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 401)
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return c.json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 401)
  }

  const token = signToken({ userId: user.id, role: user.role })

  return c.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  })
})

authRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  })

  if (!user) {
    return c.json({ error: 'User not found', code: 'NOT_FOUND' }, 404)
  }

  return c.json({ user })
})
