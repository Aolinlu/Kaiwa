export class ChatMessage {
  constructor(role, content, translation = null, reading = null, audioBase64 = null) {
    this.role = role // 'user' | 'assistant'
    this.content = content
    this.translation = translation
    this.reading = reading
    this.audioBase64 = audioBase64 // For user audio
    this.timestamp = Date.now()
  }

  toApiFormat() {
    if (this.role === 'user') {
      // If we have audio, send it as audio content
      if (this.audioBase64) {
        return {
          role: 'user',
          content: [
            {
              type: 'input_audio',
              input_audio: {
                data: this.audioBase64
              }
            }
          ]
        }
      }
      return {
        role: 'user',
        content: this.content
      }
    }
    return {
      role: 'assistant',
      content: JSON.stringify({
        reply: this.content,
        translation: this.translation,
        reading: this.reading
      })
    }
  }
}
