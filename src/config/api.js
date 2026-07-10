export const API_CONFIG = {
  API_KEY: import.meta.env.VITE_MIMO_API_KEY,
  BASE_URL: import.meta.env.VITE_MIMO_BASE_URL || 'https://token-plan-cn.xiaomimimo.com/v1',
  MODEL: import.meta.env.VITE_MIMO_MODEL || 'mimo-v2.5',
  TTS_MODEL: 'mimo-v2.5-tts'
}
