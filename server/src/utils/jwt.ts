import 'dotenv/config'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET
if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; role: string } {
  return jwt.verify(token, SECRET) as { userId: string; role: string }
}
