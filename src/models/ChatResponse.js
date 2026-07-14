export class ChatResponse {
  constructor(reply, translation, reading, hint, end = false) {
    this.reply = reply
    this.translation = translation
    this.reading = reading
    this.hint = hint
    this.end = end
  }

  static fromJson(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json

      let hint = data.hint || {}
      if (typeof hint === 'string') {
        hint = { idea: '', keywords: [], sentence: hint, sentence_reading: '', sentence_translation: '' }
      }
      hint = {
        idea: hint.idea || '',
        keywords: Array.isArray(hint.keywords) ? hint.keywords : [],
        sentence: hint.sentence || '',
        sentence_reading: hint.sentence_reading || '',
        sentence_translation: hint.sentence_translation || ''
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
      return new ChatResponse(
        'すみません、もう一度言ってください。',
        'Sorry, please say that again.',
        '',
        { idea: '', keywords: [], sentence: '', sentence_reading: '', sentence_translation: '' },
        false
      )
    }
  }
}

export class FeedbackResponse {
  constructor(score, summary, grammar, pronunciation, vocabulary, improve) {
    this.score = score || 0
    this.summary = summary || ''
    this.grammar = grammar || { trend: '', highlights: [] }
    this.pronunciation = pronunciation || { trend: '', highlights: [] }
    this.vocabulary = vocabulary || { words_learned: [] }
    this.improve = improve || []
  }

  static fromJson(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      return new FeedbackResponse(
        data.score,
        data.summary,
        data.grammar,
        data.pronunciation,
        data.vocabulary,
        data.improve
      )
    } catch (e) {
      console.error('Failed to parse FeedbackResponse:', e)
      return new FeedbackResponse(0, '', {}, {}, {}, [])
    }
  }
}
