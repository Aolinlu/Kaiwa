export class ChatMessage {
  constructor(role, content, translation = null, reading = null, audioBase64 = null, userText = null) {
    this.role = role
    this.content = content
    this.translation = translation
    this.reading = reading
    this.audioBase64 = audioBase64
    this.userText = userText
    this.timestamp = Date.now()
  }

  toApiFormat() {
    if (this.role === 'user') {
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
      content: this.content
    }
  }

  toHistoryText() {
    if (this.role === 'user') {
      return `User: ${this.userText || this.content}`
    }
    return `AI: ${this.content}`
  }
}
