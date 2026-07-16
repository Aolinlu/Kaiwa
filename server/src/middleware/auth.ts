import { Context, Next } from 'hono'
import { verifyToken } from '../utils/jwt.js'

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
  }

  try {
    const token = header.slice(7)
    const payload = verifyToken(token)
    c.set('userId', payload.userId)
    c.set('role', payload.role)
    await next()
  } catch {
    return c.json({ error: 'Invalid token', code: 'INVALID_TOKEN' }, 401)
  }
}
