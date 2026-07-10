// 豆包TTS配置
const VOLC_TTS_CONFIG = {
  API_KEY: import.meta.env.VITE_TTS_API_KEY,
  // 使用Vite代理避免CORS问题
  BASE_URL: '/api/tts',
  MODEL: import.meta.env.VITE_TTS_MODEL || 'seed-tts-2.0',
  SPEAKER: import.meta.env.VITE_TTS_SPEAKER || 'ja_female_bv520_uranus_bigtts'
}

export class SpeechService {
  static async textToSpeech(text) {
    try {
      const requestId = crypto.randomUUID()
      
      const response = await fetch(`${VOLC_TTS_CONFIG.BASE_URL}/unidirectional`, {
        method: 'POST',
        headers: {
          'X-Api-Key': VOLC_TTS_CONFIG.API_KEY,
          'X-Api-Resource-Id': VOLC_TTS_CONFIG.MODEL,
          'X-Api-Request-Id': requestId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          req_params: {
            text: text,
            speaker: VOLC_TTS_CONFIG.SPEAKER,
            audio_params: {
              format: 'mp3',
              sample_rate: 24000
            },
            explicit_language: 'ja' // 指定日语
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`TTS API error: ${response.status} - ${errorText}`)
      }

      // 处理流式响应
      const reader = response.body.getReader()
      const audioChunks = []
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        // 将Uint8Array转换为字符串
        const chunk = new TextDecoder().decode(value)
        buffer += chunk
        
        // 尝试解析JSON行
        const lines = buffer.split('\n')
        buffer = lines.pop() // 保留最后一个不完整的行
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              if (data.data) {
                audioChunks.push(data.data)
              }
            } catch (e) {
              // 忽略解析错误，可能是空行
            }
          }
        }
      }
      
      // 处理buffer中剩余的数据
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer)
          if (data.data) {
            audioChunks.push(data.data)
          }
        } catch (e) {
          // 忽略
        }
      }
      
      if (audioChunks.length === 0) {
        throw new Error('No audio data received')
      }
      
      // 合并所有音频chunk
      return audioChunks.join('')
    } catch (error) {
      console.error('TTS error:', error)
      throw error
    }
  }

  static playAudio(base64Audio) {
    return new Promise((resolve, reject) => {
      try {
        const audioSrc = `data:audio/mp3;base64,${base64Audio}`
        const audio = new Audio(audioSrc)
        
        audio.onended = () => resolve()
        audio.onerror = (e) => reject(e)
        
        audio.play().catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  static async speak(text) {
    try {
      const audioData = await this.textToSpeech(text)
      await this.playAudio(audioData)
    } catch (error) {
      console.error('Speech failed:', error)
      // 静默失败，不影响用户体验
    }
  }
}
