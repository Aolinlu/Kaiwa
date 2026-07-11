export class SentenceEvaluation {
  constructor(turnIndex, userAudio, userText, grammar, pronunciation, vocabulary, naturalness, overall) {
    this.turnIndex = turnIndex
    this.userAudio = userAudio
    this.userText = userText
    this.grammar = grammar
    this.pronunciation = pronunciation
    this.vocabulary = vocabulary
    this.naturalness = naturalness
    this.overall = overall
  }

  static fromJson(json, turnIndex = 0, userAudio = '') {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json

      return new SentenceEvaluation(
        turnIndex,
        userAudio,
        data.user_text || '',
        {
          score: data.grammar?.score || 0,
          errors: data.grammar?.errors || [],
          correct: data.grammar?.correct || []
        },
        {
          score: data.pronunciation?.score || 0,
          issues: data.pronunciation?.issues || [],
          good: data.pronunciation?.good || []
        },
        {
          level_appropriate: data.vocabulary?.level_appropriate ?? true,
          new_words_used: data.vocabulary?.new_words_used || [],
          suggestions: data.vocabulary?.suggestions || []
        },
        {
          score: data.naturalness?.score || 0,
          comment: data.naturalness?.comment || ''
        },
        data.overall || 0
      )
    } catch (e) {
      console.error('Failed to parse SentenceEvaluation:', e)
      return new SentenceEvaluation(
        turnIndex,
        userAudio,
        '',
        { score: 0, errors: [], correct: [] },
        { score: 0, issues: [], good: [] },
        { level_appropriate: true, new_words_used: [], suggestions: [] },
        { score: 0, comment: '' },
        0
      )
    }
  }
}
