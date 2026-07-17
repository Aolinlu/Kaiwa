<template>
  <div class="min-h-screen bg-[#f7f7f7] flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b-2 border-[#e5e5e5] px-4 py-3">
      <div class="flex items-center justify-between max-w-2xl mx-auto">
        <button @click="goBack" class="text-[#777777] font-bold">← 戻る</button>
        <div class="text-center">
          <h1 class="text-lg font-extrabold text-[#3c3c3c]">{{ scenarioTitle }}</h1>
        </div>
        <div class="w-12"></div>
      </div>
      <!-- Mission Status -->
      <div class="flex justify-center mt-2 gap-2 max-w-2xl mx-auto flex-wrap">
        <span
          v-for="m in missions"
          :key="m.id"
          class="px-3 py-1 text-xs font-bold rounded-full border-2"
          :class="m.status === 'completed' ? 'bg-[#dbf8c5] text-[#58a700] border-[#58cc02]' : 'bg-[#f7f7f7] text-[#afafaf] border-[#e5e5e5]'"
        >
          {{ m.title }}
        </span>
      </div>
    </header>

    <!-- Chat Area -->
    <main class="flex-1 overflow-y-auto p-4">
      <div class="max-w-2xl mx-auto space-y-4">
        <div v-for="(msg, index) in messages" :key="index">
          <!-- NPC message -->
          <div v-if="msg.role === 'assistant'" class="flex justify-start">
            <div class="max-w-[80%]">
              <div class="bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl p-4">
                <!-- Audio bar -->
                <div class="flex items-center gap-3 mb-3">
                  <button
                    @click="playNpcAudio(msg)"
                    class="w-10 h-10 rounded-full bg-[#1cb0f6] text-white flex items-center justify-center border-b-2 border-[#1899d6] hover:bg-[#4dc4f8] active:translate-y-0.5 active:border-b-0 transition-all"
                  >
                    {{ msg.isPlaying ? '⏸' : '🔊' }}
                  </button>
                  <div class="flex-1 h-3 bg-[#e5e5e5] rounded-full overflow-hidden">
                    <div class="h-full bg-[#1cb0f6] rounded-full transition-all duration-100" :style="{ width: (msg.progress || 0) + '%' }" />
                  </div>
                </div>
                <!-- Progressive reveal -->
                <div v-if="msg.audioEnded" class="space-y-1">
                  <div class="cursor-pointer select-none" @click="msg.revealLevel = Math.min((msg.revealLevel || 0) + 1, 3)">
                    <p class="text-[#3c3c3c] font-bold text-lg">{{ msg.text }}</p>
                  </div>
                  <div v-if="(msg.revealLevel || 0) >= 2" class="cursor-pointer select-none" @click="msg.revealLevel = 3">
                    <p class="text-[#777777]">{{ msg.reading }}</p>
                  </div>
                  <div v-if="(msg.revealLevel || 0) >= 3">
                    <p class="text-[#afafaf]">{{ msg.translation }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- User message -->
          <div v-else class="flex justify-end">
            <div class="max-w-[80%] bg-[#58cc02] text-white px-4 py-3 rounded-2xl rounded-br-sm border-b-4 border-[#58a700]">
              <p class="font-bold">{{ msg.text }}</p>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-start">
          <div class="bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl px-4 py-3">
            <span class="animate-pulse text-[#777777]">考え中...</span>
          </div>
        </div>

        <!-- Hint -->
        <div v-if="currentHint" class="bg-[#fff4d6] border-2 border-[#ff9600] border-b-4 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">💡</span>
            <span class="font-extrabold text-[#cc7a00]">ヒント</span>
          </div>
          <p class="text-[#3c3c3c] mb-2">{{ currentHint.idea }}</p>
          <div v-if="currentHint.keywords?.length" class="flex flex-wrap gap-1 mb-2">
            <span v-for="kw in currentHint.keywords" :key="kw" class="px-2 py-0.5 bg-[#ff9600]/10 text-[#cc7a00] text-sm rounded-full font-bold">
              {{ kw }}
            </span>
          </div>
          <div class="cursor-pointer select-none" @click="hintRevealLevel = Math.min(hintRevealLevel + 1, 3)">
            <p class="font-bold text-[#3c3c3c]">{{ currentHint.sentence }}</p>
            <p v-if="hintRevealLevel >= 2" class="text-[#777777]">{{ currentHint.sentence_reading }}</p>
            <p v-if="hintRevealLevel >= 3" class="text-[#afafaf]">{{ currentHint.sentence_translation }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Actions -->
    <footer class="bg-white border-t-2 border-[#e5e5e5] px-4 py-4">
      <div class="max-w-2xl mx-auto flex justify-center gap-4">
        <VoiceButton :disabled="isLoading" @recording-complete="handleRecording" />
        <button
          @click="hintRevealLevel = 1"
          :disabled="!currentHint"
          class="w-16 h-16 rounded-full bg-[#ff9600] text-white text-2xl flex items-center justify-center border-b-4 border-[#cc7a00] hover:bg-[#ffaa33] active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50"
        >
          💡
        </button>
        <button
          @click="showCompletion = true"
          :disabled="isLoading"
          class="w-16 h-16 rounded-full bg-[#ff4b4b] text-white text-2xl flex items-center justify-center border-b-4 border-[#cc3b3b] hover:bg-[#ff6b6b] active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50"
        >
          🏁
        </button>
      </div>
      <p class="text-center text-sm text-[#afafaf] mt-2">按住 🎤 说话 · 💡 提示 · 🏁 结束</p>
    </footer>

    <!-- Completion overlay -->
    <div v-if="showCompletion" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl p-8 max-w-sm mx-4 text-center">
        <h2 class="text-3xl font-extrabold text-[#3c3c3c] mb-2">🎉 練習完了！</h2>
        <p class="text-[#777777] mb-6">
          本次練習了 {{ turnCount }} 輪対話
        </p>
        <button
          @click="goToReport"
          class="w-full py-3 bg-[#58cc02] text-white font-extrabold rounded-2xl border-b-4 border-[#58a700] hover:bg-[#89e219] active:translate-y-1 active:border-b-0 transition-all"
        >
          学習レポートを見る
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { convertToWav } from '../utils/audio.js'
import { SessionService } from '../services/SessionService.js'
import { SpeechService } from '../services/SpeechService.js'
import VoiceButton from '../components/VoiceButton.vue'

const route = useRoute()
const router = useRouter()

const scenarioTitle = ref('')
const missions = ref([])
const messages = ref([])
const isLoading = ref(false)
const currentHint = ref(null)
const hintRevealLevel = ref(0)
const showCompletion = ref(false)
const turnCount = ref(0)
let sessionId = null

onMounted(async () => {
  try {
    isLoading.value = true
    const { session, npc, scenario } = await SessionService.createSession(
      'Course01_MeetNewPeople',
      'Scenario01_FirstMeeting'
    )

    sessionId = session.id
    scenarioTitle.value = scenario.title
    missions.value = session.missions

    const { turn, hint } = await SessionService.startSession(session.id)

    messages.value.push({
      role: 'assistant',
      text: turn.npcText,
      translation: turn.npcTranslation,
      reading: turn.npcReading,
      audioUrl: turn.npcAudioPath ? SessionService.getAudioUrl(session.id, turn.npcAudioPath.split('/').pop()) : null,
      isPlaying: false,
      progress: 0,
      audioEnded: false,
      revealLevel: 0,
    })
    currentHint.value = hint

    // Auto-play first message
    if (messages.value[0].audioUrl) {
      playNpcAudio(messages.value[0])
    }
  } catch (error) {
    console.error('Failed to start conversation:', error)
  } finally {
    isLoading.value = false
  }
})

async function playNpcAudio(msg) {
  if (!msg.audioUrl) return
  try {
    msg.isPlaying = true
    msg.progress = 0
    const interval = setInterval(() => {
      if (msg.progress < 90) msg.progress += 5
    }, 200)
    await SpeechService.playAudio(msg.audioUrl)
    clearInterval(interval)
    msg.progress = 100
    msg.isPlaying = false
    msg.audioEnded = true
    msg.revealLevel = 0
  } catch (e) {
    msg.isPlaying = false
    msg.audioEnded = true
  }
}

async function handleRecording(audioBlob) {
  isLoading.value = true
  currentHint.value = null
  hintRevealLevel.value = 0

  try {
    const wavBlob = await convertToWav(audioBlob)
    const base64 = await blobToBase64(wavBlob)
    messages.value.push({ role: 'user', text: '🎤 録音中...' })

    const result = await SessionService.addTurn(sessionId, base64)
    messages.value[messages.value.length - 1].text = result.evaluation?.transcript || '🎤 音声メッセージ'

    messages.value.push({
      role: 'assistant',
      text: result.turn.npcText,
      translation: result.turn.npcTranslation,
      reading: result.turn.npcReading,
      audioUrl: result.turn.npcAudioPath ? SessionService.getAudioUrl(sessionId, result.turn.npcAudioPath.split('/').pop()) : null,
      isPlaying: false,
      progress: 0,
      audioEnded: false,
      revealLevel: 0,
    })

    currentHint.value = result.hint
    turnCount.value++

    // Update missions
    if (result.missionUpdates) {
      for (const update of result.missionUpdates) {
        const mission = missions.value.find((m) => m.missionId === update.id)
        if (mission) mission.status = update.status
      }
    }

    // Auto-play NPC response
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg.audioUrl) {
      playNpcAudio(lastMsg)
    }

    if (result.allComplete || result.end) {
      setTimeout(() => { showCompletion.value = true }, 2000)
    }
  } catch (error) {
    console.error('Failed to process recording:', error)
  } finally {
    isLoading.value = false
  }
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(blob)
  })
}

async function goToReport() {
  try {
    await SessionService.generateReport(sessionId)
    router.push(`/report/${sessionId}`)
  } catch (e) {
    router.push(`/report/${sessionId}`)
  }
}

function goBack() {
  SpeechService.stop()
  router.push('/')
}
</script>
