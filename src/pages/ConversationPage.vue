<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
      <div class="flex items-center justify-between">
        <button @click="$emit('finish')" class="text-gray-500 hover:text-gray-700">
          ← 戻る
        </button>
        <div class="text-center">
          <h1 class="text-xl font-bold text-gray-800">{{ scenario.title }}</h1>
          <p class="text-sm text-gray-500">{{ scenario.titleCn }}</p>
        </div>
        <div class="w-12"></div>
      </div>
      <div class="flex justify-center mt-2">
        <span class="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
          {{ currentState }}
        </span>
      </div>
    </header>

    <!-- Chat Area -->
    <main class="flex-1 overflow-y-auto p-4">
      <div class="max-w-2xl mx-auto">
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
          :idea="currentHint.idea"
          :keywords="currentHint.keywords"
          :sentence="currentHint.sentence"
          :sentence-reading="currentHint.sentence_reading"
          :sentence-translation="currentHint.sentence_translation"
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
            :disabled="isLoading || messages.length < 4"
            class="w-16 h-16 rounded-full bg-red-500 text-white text-2xl flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🏁
          </button>
        </div>
        <div class="text-center text-sm text-gray-500 mt-2">
          Hold 🎤 to speak · Tap 💡 for hint · Tap 🏁 to finish
        </div>
      </div>
    </footer>

    <!-- Feedback Dialog -->
    <FeedbackDialog
      :show="showFeedback"
      :feedback="feedbackData"
      @close="closeFeedback"
    />

    <!-- Error Toast -->
    <ErrorToast
      v-if="errorMessage"
      :message="errorMessage"
      @retry="retryLastAction"
      @dismiss="errorMessage = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ChatBubble from '../components/ChatBubble.vue'
import VoiceButton from '../components/VoiceButton.vue'
import HintCard from '../components/HintCard.vue'
import FeedbackDialog from '../components/FeedbackDialog.vue'
import ErrorToast from '../components/ErrorToast.vue'
import { LLMService, LLMFormatError } from '../services/LLMService.js'
import { SpeechService } from '../services/SpeechService.js'
import { ChatMessage } from '../models/ChatMessage.js'
import { SentenceEvaluation } from '../models/SentenceEvaluation.js'
import { FeedbackResponse } from '../models/ChatResponse.js'
import { convertToWav, blobToBase64 } from '../utils/audio.js'

const props = defineProps({
  scenario: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['finish'])

const messages = ref([])
const isLoading = ref(false)
const currentResponse = ref(null)
const currentHint = ref(null)
const currentState = ref('greeting')
const sentenceEvaluations = ref([])
const showFeedback = ref(false)
const feedbackData = ref(null)
const errorMessage = ref(null)
const lastAction = ref(null)
const turnIndex = ref(0)

onMounted(async () => {
  await startConversation()
})

async function startConversation() {
  isLoading.value = true
  try {
    const response = await LLMService.startSession(props.scenario)
    currentResponse.value = response
    messages.value.push(new ChatMessage('assistant', response.reply, response.translation))
    await SpeechService.speak(response.reply)
  } catch (error) {
    console.error('Failed to start conversation:', error)
    const fallback = {
      reply: props.scenario.greeting,
      translation: '',
      reading: '',
      hint: { idea: '', keywords: [], sentence: '', sentence_reading: '', sentence_translation: '' },
      stage_hint: 'greeting',
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
  errorMessage.value = null

  try {
    const wavBlob = await convertToWav(audioBlob)
    const audioBase64 = await blobToBase64(wavBlob)

    lastAction.value = { type: 'send', audioBase64 }

    const [chatResponse, evalData] = await Promise.all([
      LLMService.sendMessage(audioBase64, props.scenario, currentState.value, messages.value),
      LLMService.evaluateMessage(audioBase64, props.scenario, currentState.value, messages.value)
    ])

    currentResponse.value = chatResponse

    const userText = chatResponse.user_text || '🎤 Voice message'
    messages.value.push(new ChatMessage('user', userText, null, null, audioBase64, userText))
    messages.value.push(new ChatMessage('assistant', chatResponse.reply, chatResponse.translation))

    if (chatResponse.stage_hint && chatResponse.stage_hint !== currentState.value) {
      currentState.value = chatResponse.stage_hint
    }

    const evaluation = SentenceEvaluation.fromJson(evalData, turnIndex.value, audioBase64)
    sentenceEvaluations.value.push(evaluation)
    turnIndex.value++

    await SpeechService.speak(chatResponse.reply)
  } catch (error) {
    console.error('Failed to process recording:', error)
    if (error instanceof LLMFormatError) {
      errorMessage.value = 'AI 返回格式异常，请重试'
    } else {
      errorMessage.value = '处理录音时出错: ' + error.message
    }
  } finally {
    isLoading.value = false
  }
}

function showHint() {
  if (currentResponse.value?.hint) {
    currentHint.value = currentResponse.value.hint
  }
}

async function finishConversation() {
  isLoading.value = true
  errorMessage.value = null

  try {
    const summaryData = await LLMService.getSummary(props.scenario, sentenceEvaluations.value)
    feedbackData.value = FeedbackResponse.fromJson(summaryData)
    showFeedback.value = true
  } catch (error) {
    console.error('Failed to get summary:', error)
    errorMessage.value = '获取反馈失败，请重试'
  } finally {
    isLoading.value = false
  }
}

function retryLastAction() {
  errorMessage.value = null
  if (lastAction.value?.type === 'send') {
    const audioBase64 = lastAction.value.audioBase64
    lastAction.value = null
    handleRecordingFromBase64(audioBase64)
  }
}

async function handleRecordingFromBase64(audioBase64) {
  isLoading.value = true
  currentHint.value = null
  errorMessage.value = null

  try {
    const [chatResponse, evalData] = await Promise.all([
      LLMService.sendMessage(audioBase64, props.scenario, currentState.value, messages.value),
      LLMService.evaluateMessage(audioBase64, props.scenario, currentState.value, messages.value)
    ])

    currentResponse.value = chatResponse

    const userText = chatResponse.user_text || '🎤 Voice message'
    messages.value.push(new ChatMessage('user', userText, null, null, audioBase64, userText))
    messages.value.push(new ChatMessage('assistant', chatResponse.reply, chatResponse.translation))

    if (chatResponse.stage_hint && chatResponse.stage_hint !== currentState.value) {
      currentState.value = chatResponse.stage_hint
    }

    const evaluation = SentenceEvaluation.fromJson(evalData, turnIndex.value, audioBase64)
    sentenceEvaluations.value.push(evaluation)
    turnIndex.value++

    await SpeechService.speak(chatResponse.reply)
  } catch (error) {
    console.error('Failed to process recording:', error)
    if (error instanceof LLMFormatError) {
      errorMessage.value = 'AI 返回格式异常，请重试'
    } else {
      errorMessage.value = '处理录音时出错: ' + error.message
    }
  } finally {
    isLoading.value = false
  }
}

function closeFeedback() {
  showFeedback.value = false
  emit('finish')
}
</script>
