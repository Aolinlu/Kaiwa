import { describe, it, expect } from 'vitest'
import { ChatMessage } from '../models/ChatMessage.js'

describe('ChatMessage', () => {
  describe('toHistoryObject', () => {
    it('returns speaker and message for user message', () => {
      const msg = new ChatMessage('user', 'こんにちは', null, null, null, 'こんにちは、高橋です')
      const obj = msg.toHistoryObject()
      expect(obj.speaker).toBe('user')
      expect(obj.message).toBe('こんにちは、高橋です')
    })

    it('returns speaker and message for npc message', () => {
      const msg = new ChatMessage('assistant', '田中です。よろしくお願いします。', '初次见面')
      const obj = msg.toHistoryObject()
      expect(obj.speaker).toBe('npc')
      expect(obj.message).toBe('田中です。よろしくお願いします。')
    })

    it('uses content when userText is null', () => {
      const msg = new ChatMessage('user', 'こんにちは')
      const obj = msg.toHistoryObject()
      expect(obj.speaker).toBe('user')
      expect(obj.message).toBe('こんにちは')
    })
  })

  describe('toHistoryText', () => {
    it('returns formatted text for user', () => {
      const msg = new ChatMessage('user', 'こんにちは', null, null, null, '高橋です')
      expect(msg.toHistoryText()).toBe('User: 高橋です')
    })

    it('returns formatted text for assistant', () => {
      const msg = new ChatMessage('assistant', '田中です')
      expect(msg.toHistoryText()).toBe('AI: 田中です')
    })
  })
})
