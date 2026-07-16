import { callLLM } from './llm.js'

const TEACHER_PROMPT = `You are a Japanese language teacher evaluating a beginner learner's audio utterance.

Your job:
1. Transcribe what the user said in Japanese
2. Evaluate grammar, pronunciation, and naturalness

Recent conversation context:
{{recentContext}}

Output JSON only:
{
  "transcript": "raw transcription of audio",
  "user_text": "corrected Japanese text",
  "grammar": {
    "score": 0,
    "errors": ["specific error descriptions in Chinese"],
    "correct": ["what was done correctly in Chinese"]
  },
  "pronunciation": {
    "score": 0,
    "issues": ["specific pronunciation issues in Chinese"],
    "good": ["good pronunciation points in Chinese"]
  },
  "naturalness": {
    "score": 0,
    "comment": "自然度评价 in Chinese"
  },
  "overall": 0
}

Scoring guide: 0-10 scale. 0-3 = poor, 4-6 = acceptable, 7-8 = good, 9-10 = excellent.
Do NOT care about missions, story, or NPC. Only evaluate language.`

export async function evaluateUserSpeech(audioBase64: string, recentContext: string) {
  const prompt = TEACHER_PROMPT.replace('{{recentContext}}', recentContext)

  const content = await callLLM([
    { role: 'system', content: prompt },
    {
      role: 'user',
      content: [
        { type: 'input_audio', input_audio: { data: audioBase64 } },
      ] as any,
    },
  ])

  return JSON.parse(content)
}
