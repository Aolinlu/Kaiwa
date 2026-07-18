import 'dotenv/config'
import jwt from 'jsonwebtoken'

const SECRET: string = (() => {
  const value = process.env.JWT_SECRET
  if (!value) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return value
})()

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; role: string } {
  const decoded = jwt.verify(token, SECRET)
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload')
  }
  return decoded as { userId: string; role: string }
}
