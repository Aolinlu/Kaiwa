export class HintResponse {
  constructor(idea, keywords, sentence, sentenceReading, sentenceTranslation) {
    this.idea = idea
    this.keywords = keywords
    this.sentence = sentence
    this.sentence_reading = sentenceReading
    this.sentence_translation = sentenceTranslation
  }
}

export function validateHintFormat(hint) {
  if (!hint || typeof hint !== 'object') return false
  if (!hint.idea || typeof hint.idea !== 'string' || hint.idea.trim() === '') return false
  if (!Array.isArray(hint.keywords) || hint.keywords.length === 0) return false
  if (!hint.sentence || typeof hint.sentence !== 'string' || hint.sentence.trim() === '') return false
  return true
}
