import { promises as fs } from 'fs'
import path from 'path'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'audio')

export class StorageService {
  static async ensureSessionDir(sessionId: string): Promise<string> {
    const dir = path.join(STORAGE_ROOT, sessionId)
    await fs.mkdir(dir, { recursive: true })
    return dir
  }

  static async saveAudio(sessionId: string, filename: string, buffer: Buffer): Promise<string> {
    const dir = await this.ensureSessionDir(sessionId)
    const filePath = path.join(dir, filename)
    await fs.writeFile(filePath, buffer)
    return `audio/${sessionId}/${filename}`
  }

  static async getAudioPath(sessionId: string, filename: string): Promise<string> {
    const filePath = path.join(STORAGE_ROOT, sessionId, filename)
    await fs.access(filePath)
    return filePath
  }
}
