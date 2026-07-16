export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
}

export function getAuthHeaders() {
  const token = localStorage.getItem('kaiwa_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
