export class ChatResponse {
  constructor(reply, translation, reading, hint, end = false) {
    this.reply = reply
    this.translation = translation
    this.reading = reading
    this.hint = hint // { text, reading, translation }
    this.end = end
  }

  static fromJson(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      
      // Handle hint object
      let hint = data.hint || {}
      if (typeof hint === 'string') {
        // Backward compatibility: if hint is a string, convert to object
        hint = {
          text: hint,
          reading: '',
          translation: ''
        }
      }
      
      return new ChatResponse(
        data.reply || '',
        data.translation || '',
        data.reading || '',
        hint,
        data.end || false
      )
    } catch (e) {
      console.error('Failed to parse ChatResponse:', e)
      return new ChatResponse('すみません、もう一度言ってください。', 'Sorry, please say that again.', '', { text: '', reading: '', translation: '' }, false)
    }
  }
}

export class FeedbackResponse {
  constructor(score, good, improve, grammar, vocabulary) {
    this.score = score
    this.good = good || []
    this.improve = improve || []
    this.grammar = grammar || []
    this.vocabulary = vocabulary || []
  }

  static fromJson(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      return new FeedbackResponse(
        data.score || 0,
        data.good || [],
        data.improve || [],
        data.grammar || [],
        data.vocabulary || []
      )
    } catch (e) {
      console.error('Failed to parse FeedbackResponse:', e)
      return new FeedbackResponse(0, [], [], [], [])
    }
  }
}
