<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
      <div class="text-center">
        <div class="text-3xl mb-1">🏪</div>
        <h1 class="text-xl font-bold text-gray-800">Convenience Store</h1>
        <p class="text-sm text-gray-500">Japanese Conversation Practice</p>
      </div>
    </header>

    <!-- Chat Area -->
    <main class="flex-1 overflow-y-auto p-4">
      <div class="max-w-2xl mx-auto">
        <!-- Messages -->
        <div class="space-y-4 mb-4">
          <ChatBubble
            v-for="(msg, index) in messages"
            :key="index"
            :content="msg.content"
            :translation="msg.translation"
            :is-user="msg.role === 'user'"
          />
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="flex justify-center mb-4">
          <div class="bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
            <span class="animate-pulse">🤖 Thinking...</span>
          </div>
        </div>

        <!-- Hint Card -->
        <HintCard
          v-if="currentHint"
          :hint="currentHint.hint"
          :reading="currentHint.reading"
          :translation="currentHint.translation"
        />
      </div>
    </main>

    <!-- Action Buttons -->
    <footer class="bg-white border-t border-gray-200 px-4 py-4">
      <div class="max-w-2xl mx-auto">
        <div class="flex justify-center gap-4">
          <VoiceButton
            :disabled="isLoading"
            @recording-complete="handleRecording"
          />
          <button
            @click="showHint"
            :disabled="isLoading || !currentResponse?.hint"
            class="w-16 h-16 rounded-full bg-orange-500 text-white text-2xl flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💡
          </button>
          <button
            @click="finishConversation"
            :disabled="isLoading || messages.length < 2"
            class="w-16 h-16 rounded-full bg-red-500 text-white text-2xl flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🏁
          </button>
        </div>
        <div class="text-center text-sm text-gray-500 mt-2">
          Hold 🎤 to speak • Tap 💡 for hint • Tap 🏁 to finish
        </div>
      </div>
    </footer>

    <!-- Feedback Dialog -->
    <FeedbackDialog
      :show="showFeedback"
      :feedback="feedbackData"
      @close="closeFeedback"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ChatBubble from '../components/ChatBubble.vue'
import VoiceButton from '../components/VoiceButton.vue'
import HintCard from '../components/HintCard.vue'
import FeedbackDialog from '../components/FeedbackDialog.vue'
import { LLMService } from '../services/LLMService.js'
import { SpeechService } from '../services/SpeechService.js'
import { ChatMessage } from '../models/ChatMessage.js'
import { API_CONFIG } from '../config/api.js'

const messages = ref([])
const isLoading = ref(false)
const currentResponse = ref(null)
const currentHint = ref(null)
const showFeedback = ref(false)
const feedbackData = ref({
  score: 0,
  good: [],
  improve: [],
  grammar: [],
  vocabulary: []
})

onMounted(async () => {
  await startConversation()
})

async function startConversation() {
  isLoading.value = true
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: API_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a Japanese conversation partner at a convenience store. 
The user is a beginner.

Rules:
- 尽量只使用 JLPT N5 vocabulary.
- Maximum 20 words per sentence.
- Ask only one question at a time.
- Don't explain grammar.
- Keep the conversation natural.
- IMPORTANT: The "reply" field is REQUIRED and must NEVER be empty.
- IMPORTANT: The "hint" object should contain a COMPLETE SUGGESTED REPLY for the user to say next.

Start the conversation with a greeting and ask what the user would like.

Output JSON only:
{
  "reply": "Your Japanese greeting (REQUIRED)",
  "translation": "Chinese translation",
  "reading": "Hiragana reading",
  "hint": {
    "text": "Suggested reply for user (e.g., 'コーヒーをください。')",
    "reading": "Hiragana reading of suggested reply",
    "translation": "Chinese translation of suggested reply"
  },
  "end": false
}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    const content = JSON.parse(data.choices[0].message.content)
    
    currentResponse.value = content
    messages.value.push(new ChatMessage('assistant', content.reply, content.translation))
    
    await SpeechService.speak(content.reply)
  } catch (error) {
    console.error('Failed to start conversation:', error)
    const fallback = {
      reply: 'いらっしゃいませ！',
      translation: '欢迎光临！',
      reading: 'いらっしゃいませ',
      hint: {
        text: 'こんにちは、コーヒーをください。',
        reading: 'こんにちは、コーヒーをください。',
        translation: '你好，请给我咖啡。'
      },
      end: false
    }
    currentResponse.value = fallback
    messages.value.push(new ChatMessage('assistant', fallback.reply, fallback.translation))
  } finally {
    isLoading.value = false
  }
}

async function handleRecording(audioBlob) {
  isLoading.value = true
  currentHint.value = null
  
  try {
    console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type)
    
    // Convert to WAV format for MiMo API
    const wavBlob = await convertToWav(audioBlob)
    console.log('WAV blob size:', wavBlob.size, 'type:', wavBlob.type)
    
    const audioBase64 = await blobToBase64(wavBlob)
    console.log('Base64 length:', audioBase64.length)
    
    const conversationHistory = messages.value.map(msg => msg.toApiFormat())
    
    const response = await LLMService.sendMessage(audioBase64, conversationHistory)
    console.log('LLM response:', response)
    
    // Save user message with audio for feedback
    messages.value.push(new ChatMessage('user', '🎤 Voice message', null, null, audioBase64))
    
    currentResponse.value = response
    
    // Handle empty reply - use hint if reply is empty
    const replyText = response.reply || response.hint?.text || '...'
    const translationText = response.translation || ''
    
    messages.value.push(new ChatMessage('assistant', replyText, translationText))
    
    if (replyText && replyText !== '...') {
      await SpeechService.speak(replyText)
    }
  } catch (error) {
    console.error('Failed to process recording:', error)
    console.error('Error details:', error.message, error.stack)
    alert('处理录音时出错: ' + error.message)
  } finally {
    isLoading.value = false
  }
}

async function convertToWav(audioBlob) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  
  // Convert to WAV
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16
  
  let audioData
  if (numberOfChannels === 2) {
    const left = audioBuffer.getChannelData(0)
    const right = audioBuffer.getChannelData(1)
    audioData = interleave(left, right)
  } else {
    audioData = audioBuffer.getChannelData(0)
  }
  
  const dataLength = audioData.length * (bitDepth / 8)
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)
  
  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true)
  view.setUint16(32, numberOfChannels * (bitDepth / 8), true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)
  
  // Write audio data
  const offset = 44
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]))
    view.setInt16(offset + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
  }
  
  return new Blob([buffer], { type: 'audio/wav' })
}

function interleave(left, right) {
  const length = left.length + right.length
  const result = new Float32Array(length)
  let inputIndex = 0
  for (let index = 0; index < length; ) {
    result[index++] = left[inputIndex]
    result[index++] = right[inputIndex]
    inputIndex++
  }
  return result
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function showHint() {
  console.log('showHint called')
  console.log('currentResponse:', currentResponse.value)
  console.log('hint:', currentResponse.value?.hint)
  
  if (currentResponse.value?.hint?.text) {
    // Set currentHint with the structure expected by HintCard
    currentHint.value = {
      hint: currentResponse.value.hint.text,
      reading: currentResponse.value.hint.reading,
      translation: currentResponse.value.hint.translation
    }
    console.log('currentHint set:', currentHint.value)
  }
}

async function finishConversation() {
  isLoading.value = true
  
  try {
    // 直接使用对话历史（包含音频），让MiMo评估发音
    const conversationHistory = messages.value.map(msg => msg.toApiFormat())
    console.log('Conversation history for feedback:', conversationHistory)
    
    const feedback = await LLMService.getFeedback(conversationHistory)
    console.log('Feedback response:', feedback)
    
    feedbackData.value = feedback
    showFeedback.value = true
  } catch (error) {
    console.error('Failed to get feedback:', error)
    console.error('Error details:', error.message, error.stack)
    feedbackData.value = {
      score: 70,
      good: ['积极参与对话'],
      improve: ['可以尝试更长的句子'],
      grammar: [],
      vocabulary: ['いらっしゃいませ', 'ください']
    }
    showFeedback.value = true
  } finally {
    isLoading.value = false
  }
}

function closeFeedback() {
  showFeedback.value = false
  
  // Reset conversation
  messages.value = []
  currentResponse.value = null
  currentHint.value = null
  
  // Start new conversation
  startConversation()
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
</script>
