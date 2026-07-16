import { API_CONFIG, getAuthHeaders } from '../config/api.js'

export class AuthService {
  static async login(email, password) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    localStorage.setItem('kaiwa_token', data.token)
    localStorage.setItem('kaiwa_user', JSON.stringify(data.user))
    return data
  }

  static logout() {
    localStorage.removeItem('kaiwa_token')
    localStorage.removeItem('kaiwa_user')
  }

  static getToken() {
    return localStorage.getItem('kaiwa_token')
  }

  static isAuthenticated() {
    return !!this.getToken()
  }

  static getCurrentUser() {
    const user = localStorage.getItem('kaiwa_user')
    return user ? JSON.parse(user) : null
  }
}
