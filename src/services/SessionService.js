import { API_CONFIG, getAuthHeaders } from '../config/api.js'

export class SessionService {
  static async createSession(courseId, scenarioId) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ courseId, scenarioId }),
    })
    if (!response.ok) throw new Error('Failed to create session')
    return (await response.json())
  }

  static async getSession(id) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/sessions/${id}`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to get session')
    return (await response.json()).session
  }

  static async startSession(id) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/sessions/${id}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to start session')
    return (await response.json())
  }

  static async addTurn(sessionId, userAudioBase64) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/sessions/${sessionId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ userAudioBase64 }),
    })
    if (!response.ok) throw new Error('Failed to add turn')
    return (await response.json())
  }

  static async generateReport(sessionId) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/sessions/${sessionId}/report`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to generate report')
    return (await response.json())
  }

  static async listSessions(page = 1, limit = 10) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/sessions?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to list sessions')
    return (await response.json())
  }

  static getAudioUrl(sessionId, filename) {
    return `${API_CONFIG.BASE_URL.replace('/api', '')}/audio/${sessionId}/${filename}`
  }
}
