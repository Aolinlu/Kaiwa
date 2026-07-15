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
      <!-- Mission Status -->
      <div class="flex justify-center mt-2 gap-2">
        <span
          v-for="m in userMissionDisplay"
          :key="m.id"
          class="px-2 py-1 text-xs rounded-full"
          :class="m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
        >
          {{ m.title }}
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

        <div v-if="isLoading" class="flex justify-center mb-4">
          <div class="bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
            <span class="animate-pulse">🤖 Thinking...</span>
          </div>
        </div>

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
            :disabled="isLoading || !currentHintAvailable"
            class="w-16 h-16 rounded-full bg-orange-500 text-white text-2xl flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💡
          </button>
          <button
            @click="finishConversation"
            :disabled="isLoading"
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

    <FeedbackDialog
      :show="showFeedback"
      :feedback="feedbackData"
      @close="closeFeedback"
    />

    <ErrorToast
      v-if="errorMessage"
      :message="errorMessage"
      @retry="retryLastAction"
      @dismiss="errorMessage = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ChatBubble from '../components/ChatBubble.vue'
import VoiceButton from '../components/VoiceButton.vue'
import HintCard from '../components/HintCard.vue'
import FeedbackDialog from '../components/FeedbackDialog.vue'
import ErrorToast from '../components/ErrorToast.vue'
import { TeacherService } from '../services/TeacherService.js'
import { NPCService } from '../services/NPCService.js'
import { JudgeService } from '../services/JudgeService.js'
import { SpeechService } from '../services/SpeechService.js'
import { ChatMessage } from '../models/ChatMessage.js'
import { ChatResponse, FeedbackResponse } from '../models/ChatResponse.js'
import { SentenceEvaluation } from '../models/SentenceEvaluation.js'
import { MissionRuntime } from '../models/MissionRuntime.js'
import { convertToWav, blobToBase64 } from '../utils/audio.js'
import { API_CONFIG } from '../config/api.js'

const props = defineProps({
  scenario: { type: Object, required: true }
})

const emit = defineEmits(['finish'])

const messages = ref([])
const isLoading = ref(false)
const currentHintData = ref(null)
const missionRuntime = ref(null)
const npcDescription = ref('')
const sentenceEvaluations = ref([])
const showFeedback = ref(false)
const feedbackData = ref(null)
const errorMessage = ref(null)
const lastAction = ref(null)
const turnIndex = ref(0)
const allMissionsComplete = ref(false)

const currentHintAvailable = computed(() => currentHintData.value !== null)
const currentHint = computed(() => currentHintData.value)

const userMissionDisplay = computed(() => {
  if (!missionRuntime.value) return []
  return missionRuntime.value.userMissions
})

onMounted(async () => {
  await startConversation()
})

function buildConversationHistory(msgs) {
  // Exclude the last user message (it goes in "用户刚说的话" section)
  const historyMsgs = msgs.slice(0, -1)
  const historyObjects = historyMsgs
    .filter(msg => msg.userText || msg.role === 'assistant')
    .map(msg => msg.toHistoryObject())
  return JSON.stringify(historyObjects, null, 2)
}

function getLatestUserMessage(msgs) {
  const lastMsg = msgs[msgs.length - 1]
  if (lastMsg && lastMsg.role === 'user') {
    return lastMsg.userText || lastMsg.content
  }
  return ''
}

function formatMissionContext(missions) {
  return missions.map(m => `- [${m.status}] ${m.id}: ${m.title}`).join('\n')
}

async function startConversation() {
  isLoading.value = true
  try {
    const { userMissions, npcMissions } = props.scenario.assignMissions()
    missionRuntime.value = new MissionRuntime(userMissions, npcMissions)

    const npc = props.scenario.selectNpc()
    npcDescription.value = npc

    const npcIdentity = props.scenario.formatNpcIdentity(npc)
    const npcName = npc.name
    const npcMissionsStr = formatMissionContext(missionRuntime.value.npcMissions)
    const userMissionsStr = formatMissionContext(missionRuntime.value.userMissions)

    const npcData = await NPCService.getReply(
      npcName,
      npcIdentity,
      props.scenario.scene.description,
      npcMissionsStr,
      userMissionsStr,
      false,
      '[]',
      '',
      true
    )

    const response = ChatResponse.fromJson(npcData)
    currentHintData.value = response.hint
    messages.value.push(new ChatMessage('assistant', response.reply, response.translation))
    await SpeechService.speak(response.reply)
  } catch (error) {
    console.error('Failed to start conversation:', error)
    messages.value.push(new ChatMessage('assistant', 'はじめまして！', '初次见面！'))
  } finally {
    isLoading.value = false
  }
}

async function processAudio(audioBase64) {
  const teacherData = await TeacherService.evaluate(audioBase64, messages.value)
  const userText = teacherData.user_text || teacherData.transcript || '🎤 Voice message'

  const evaluation = SentenceEvaluation.fromJson(teacherData, turnIndex.value, audioBase64)
  sentenceEvaluations.value.push(evaluation)

  messages.value.push(new ChatMessage('user', userText, null, null, audioBase64, userText))

  const history = buildConversationHistory(messages.value)
  const latestUserMessage = getLatestUserMessage(messages.value)
  const lastNpcMsg = messages.value.filter(m => m.role === 'assistant').pop()
  const npcText = lastNpcMsg?.content || ''

  try {
    const updates = await JudgeService.evaluateMission(userText, npcText, missionRuntime.value)
    missionRuntime.value.applyUpdates(updates)
    allMissionsComplete.value = missionRuntime.value.allComplete()
  } catch (error) {
    console.warn('Judge evaluation failed, continuing:', error)
  }

  const npcIdentity = props.scenario.formatNpcIdentity(npcDescription.value)
  const npcName = npcDescription.value.name
  const npcMissionsStr = formatMissionContext(missionRuntime.value.npcMissions)
  const userMissionsStr = formatMissionContext(missionRuntime.value.userMissions)

  const npcData = await NPCService.getReply(
    npcName,
    npcIdentity,
    props.scenario.scene.description,
    npcMissionsStr,
    userMissionsStr,
    allMissionsComplete.value,
    history,
    latestUserMessage,
    false
  )

  const response = ChatResponse.fromJson(npcData)
  currentHintData.value = response.hint

  messages.value.push(new ChatMessage('assistant', response.reply, response.translation))
  turnIndex.value++

  await SpeechService.speak(response.reply)

  if (response.end || allMissionsComplete.value) {
    setTimeout(() => finishConversation(), 1000)
  }
}

async function handleRecording(audioBlob) {
  isLoading.value = true
  currentHintData.value = null
  errorMessage.value = null

  try {
    const wavBlob = await convertToWav(audioBlob)
    const audioBase64 = await blobToBase64(wavBlob)
    lastAction.value = { type: 'send', audioBase64 }
    await processAudio(audioBase64)
  } catch (error) {
    console.error('Failed to process recording:', error)
    errorMessage.value = '处理录音时出错: ' + error.message
  } finally {
    isLoading.value = false
  }
}

function showHint() {
  // Hint is already shown via currentHint computed
}

async function finishConversation() {
  isLoading.value = true
  errorMessage.value = null

  try {
    const evalsForSummary = sentenceEvaluations.value.map(e => ({
      turnIndex: e.turnIndex,
      userText: e.userText,
      grammar: e.grammar,
      pronunciation: e.pronunciation,
      vocabulary: e.vocabulary,
      naturalness: e.naturalness,
      overall: e.overall
    }))

    const summaryPrompt = `Summarize the learner's performance based on these evaluations.
Evaluations: ${JSON.stringify(evalsForSummary, null, 2)}
Output JSON: { "score": 0, "summary": "总体评价", "grammar": { "trend": "", "highlights": [] }, "pronunciation": { "trend": "", "highlights": [] }, "vocabulary": { "words_learned": [] }, "improve": [] }`

    const response = await fetch(`${API_CONFIG.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: API_CONFIG.MODEL,
        messages: [
          { role: 'system', content: summaryPrompt },
          { role: 'user', content: '请生成学习总结。' }
        ],
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    const content = JSON.parse(data.choices[0].message.content)
    feedbackData.value = FeedbackResponse.fromJson(content)
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
  currentHintData.value = null
  errorMessage.value = null
  try {
    await processAudio(audioBase64)
  } catch (error) {
    errorMessage.value = '处理录音时出错: ' + error.message
  } finally {
    isLoading.value = false
  }
}

function closeFeedback() {
  showFeedback.value = false
  emit('finish')
}
</script>
