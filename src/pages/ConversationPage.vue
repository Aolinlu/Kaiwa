<template>
  <div class="h-screen bg-kinari-100 flex overflow-hidden">
    <!-- Left Sidebar: Hint -->
    <aside class="w-72 flex-shrink-0 bg-kinari-50 border-r border-kinari-200 p-5 overflow-y-auto">
      <div class="flex items-baseline justify-between mb-4">
        <h3 class="font-jserif text-lg font-bold text-sumi-800">ヒント</h3>
        <span class="text-[10px] tracking-[0.3em] text-sumi-500">HINT</span>
      </div>

      <Transition name="fade-slide">
        <div v-if="currentHint && hintVisible" class="bg-white rounded-xl border border-kin-500/40 shadow-paper p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-7 h-7 rounded-full bg-kin-500/15 text-kin-600 flex items-center justify-center text-sm">💡</span>
            <span class="font-bold text-kin-600 text-sm">こんな話題はどう？</span>
          </div>
          <p class="text-sumi-700 text-sm leading-relaxed mb-3">{{ currentHint.idea }}</p>
          <div v-if="currentHint.keywords?.length" class="flex flex-wrap gap-1.5 mb-3">
            <span v-for="kw in currentHint.keywords" :key="kw" class="px-2 py-0.5 bg-ai-100 text-ai-700 text-xs rounded-full font-bold">
              {{ kw }}
            </span>
          </div>
          <div class="border-t border-kinari-200 pt-3 cursor-pointer select-none group" @click="hintRevealLevel = Math.min(hintRevealLevel + 1, 3)">
            <p class="font-jserif font-bold text-sumi-800 group-hover:text-ai-700 transition-colors">{{ currentHint.sentence }}</p>
            <p v-if="hintRevealLevel >= 2" class="text-sm text-sumi-500 mt-1">{{ currentHint.sentence_reading }}</p>
            <p v-if="hintRevealLevel >= 3" class="text-sm text-sumi-500/80 mt-1">{{ currentHint.sentence_translation }}</p>
            <p v-if="hintRevealLevel < 3" class="text-[10px] tracking-widest text-sumi-500/60 mt-2">クリックで読み・訳を表示</p>
          </div>
        </div>
      </Transition>

      <div v-if="!currentHint || !hintVisible" class="text-center text-sumi-500/70 mt-16">
        <div class="bg-seigaiha text-kinari-300 h-12 rounded-lg mb-4"></div>
        <p class="text-2xl mb-2">💡</p>
        <p class="text-xs leading-relaxed">下の 💡 ボタンで<br>会話のヒントを表示</p>
      </div>
    </aside>

    <!-- Center: Conversation -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <header class="bg-kinari-50/90 backdrop-blur border-b border-kinari-200 px-6 h-16 flex items-center flex-shrink-0">
        <div class="flex items-center justify-between w-full">
          <button @click="goBack" class="flex items-center gap-2 text-sumi-500 hover:text-ai-600 font-bold text-sm transition-colors">
            <span>←</span><span>戻る</span>
          </button>
          <h1 class="font-jserif text-lg font-bold text-sumi-800">{{ scenarioTitle }}</h1>
          <div class="w-16"></div>
        </div>
      </header>

      <!-- Chat Area -->
      <main class="flex-1 overflow-y-auto px-6 py-6">
        <div class="max-w-3xl mx-auto space-y-5">
          <div v-for="(msg, index) in messages" :key="index" class="msg-in">
            <!-- NPC message -->
            <div v-if="msg.role === 'assistant'" class="flex justify-start">
              <div class="max-w-[80%] bg-white border border-kinari-200 shadow-paper rounded-2xl rounded-tl-sm p-4">
                <!-- Audio bar -->
                <div class="flex items-center gap-3">
                  <button
                    @click="playNpcAudio(msg)"
                    class="w-11 h-11 rounded-full bg-ai-600 text-kinari-50 flex items-center justify-center shadow-paper transition-all hover:bg-ai-500 hover:shadow-paper-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {{ msg.isPlaying ? '⏸' : '🔊' }}
                  </button>
                  <div class="flex-1 h-1.5 bg-kinari-200 rounded-full overflow-hidden">
                    <div class="h-full bg-ai-500 rounded-full transition-all duration-100" :style="{ width: (msg.progress || 0) + '%' }" />
                  </div>
                </div>
                <!-- Progressive reveal -->
                <div v-if="msg.audioEnded" class="mt-3 border-t border-kinari-200 pt-3">
                  <div class="cursor-pointer select-none group" @click="msg.revealLevel = Math.min((msg.revealLevel || 0) + 1, 3)">
                    <p class="font-jserif text-sumi-800 font-bold text-lg group-hover:text-ai-700 transition-colors">{{ msg.text }}</p>
                  </div>
                  <div v-if="(msg.revealLevel || 0) >= 2" class="cursor-pointer select-none" @click="msg.revealLevel = 3">
                    <p class="text-sm text-sumi-500 mt-1">{{ msg.reading }}</p>
                  </div>
                  <div v-if="(msg.revealLevel || 0) >= 3">
                    <p class="text-sm text-sumi-500/80 mt-1">{{ msg.translation }}</p>
                  </div>
                  <p v-if="(msg.revealLevel || 0) < 3" class="text-[10px] tracking-widest text-sumi-500/60 mt-2">クリックで読み・訳を表示</p>
                </div>
                <p v-else class="mt-3 text-[10px] tracking-widest text-sumi-500/60">🔊 まず音声を聞いてみましょう</p>
              </div>
            </div>

            <!-- User message -->
            <div v-else class="flex justify-end">
              <div class="max-w-[80%] bg-ai-600 text-kinari-50 px-4 py-3 rounded-2xl rounded-br-sm shadow-paper">
                <div class="flex items-center gap-2">
                  <p class="font-jserif font-bold flex-1">{{ msg.text }}</p>
                  <button
                    v-if="msg.audioBase64"
                    @click="playUserAudio(msg)"
                    class="w-8 h-8 rounded-full bg-white/20 text-kinari-50 flex items-center justify-center text-sm transition-all hover:bg-white/30"
                  >
                    {{ msg.isPlaying ? '⏸' : '▶' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="flex justify-start msg-in">
            <div class="bg-white border border-kinari-200 shadow-paper rounded-2xl rounded-tl-sm px-5 py-4">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-ai-400 thinking-dot"></span>
                <span class="w-2 h-2 rounded-full bg-ai-400 thinking-dot" style="animation-delay: 0.15s"></span>
                <span class="w-2 h-2 rounded-full bg-ai-400 thinking-dot" style="animation-delay: 0.3s"></span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Actions -->
      <footer class="bg-kinari-50 border-t border-kinari-200 px-6 py-4 flex-shrink-0">
        <div class="flex justify-center items-center gap-6">
          <button
            @click="hintVisible = true; hintRevealLevel = 1"
            :disabled="!currentHint"
            class="w-14 h-14 rounded-full bg-kin-500/15 text-kin-600 text-xl flex items-center justify-center border border-kin-500/30 transition-all hover:bg-kin-500/25 hover:-translate-y-0.5 hover:shadow-paper active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            💡
          </button>
          <VoiceButton :disabled="isLoading" @recording-complete="handleRecording" />
          <button
            @click="showCompletion = true"
            :disabled="isLoading"
            class="w-14 h-14 rounded-full bg-shu-500/15 text-shu-500 text-xl flex items-center justify-center border border-shu-500/30 transition-all hover:bg-shu-500/25 hover:-translate-y-0.5 hover:shadow-paper active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            🏁
          </button>
        </div>
        <p class="text-center text-xs text-sumi-500/70 mt-2 tracking-wide">🎤 長押しで話す · 💡 ヒント · 🏁 終了</p>
      </footer>
    </div>

    <!-- Right Sidebar: Missions -->
    <aside class="w-72 flex-shrink-0 bg-kinari-50 border-l border-kinari-200 p-5 overflow-y-auto">
      <div class="flex items-baseline justify-between mb-1">
        <h3 class="font-jserif text-lg font-bold text-sumi-800">ミッション</h3>
        <span class="text-[10px] tracking-[0.3em] text-sumi-500">MISSION</span>
      </div>
      <p class="text-xs text-sumi-500 mb-3">{{ completedCount }}/{{ userMissions.length }} 達成</p>
      <div class="w-full bg-kinari-200 rounded-full h-1.5 overflow-hidden mb-5">
        <div class="h-full bg-gradient-to-r from-ai-500 to-ai-400 rounded-full transition-all duration-500" :style="{ width: missionProgress + '%' }" />
      </div>

      <div class="space-y-2">
        <div
          v-for="m in userMissions"
          :key="m.id"
          class="flex items-center gap-3 p-3 rounded-lg border transition-all duration-500"
          :class="m.status === 'completed' ? 'bg-ai-50 border-ai-200' : 'bg-white border-kinari-200'"
        >
          <span
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-500"
            :class="m.status === 'completed' ? 'bg-ai-600 text-kinari-50 scale-110' : 'bg-kinari-200 text-sumi-500/50'"
          >
            {{ m.status === 'completed' ? '✓' : '○' }}
          </span>
          <span class="text-sm transition-colors duration-500" :class="m.status === 'completed' ? 'text-sumi-800 font-bold' : 'text-sumi-500'">
            {{ m.title }}
          </span>
        </div>
      </div>
    </aside>

    <!-- Completion overlay -->
    <Transition name="fade-slide">
      <div v-if="showCompletion" class="fixed inset-0 bg-sumi-800/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl border border-kinari-200 shadow-paper-lg overflow-hidden max-w-sm w-full mx-4">
          <div class="bg-seigaiha text-ai-200 bg-ai-800 h-16 flex items-center justify-center">
            <span class="font-jserif text-3xl">🎉</span>
          </div>
          <div class="p-8 text-center">
            <h2 class="font-jserif text-2xl font-bold text-sumi-800 mb-2">練習完了！</h2>
            <p class="text-sumi-500 text-sm mb-6">本次練習了 {{ turnCount }} 輪対話</p>
            <button
              @click="goToReport"
              class="w-full py-3.5 rounded-lg bg-ai-600 text-kinari-50 font-bold shadow-paper transition-all hover:bg-ai-500 hover:shadow-paper-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              学習レポートを見る →
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Error overlay -->
    <Transition name="fade-slide">
      <div v-if="showError" class="fixed inset-0 bg-sumi-800/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl border border-kinari-200 shadow-paper-lg p-8 max-w-sm w-full mx-4 text-center">
          <h2 class="font-jserif text-2xl font-bold text-shu-500 mb-2">⚠️ エラー</h2>
          <p class="text-sumi-500 text-sm mb-6">{{ errorMessage }}</p>
          <div class="flex gap-3">
            <button
              @click="showError = false"
              class="flex-1 py-3 rounded-lg bg-white text-sumi-600 font-bold border border-kinari-300 transition-all hover:border-sumi-500 hover:-translate-y-0.5 active:translate-y-0"
            >
              閉じる
            </button>
            <button
              @click="showError = false; retryLastAction()"
              class="flex-1 py-3 rounded-lg bg-ai-600 text-kinari-50 font-bold shadow-paper transition-all hover:bg-ai-500 hover:shadow-paper-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
const hintVisible = ref(false)
const showCompletion = ref(false)
const turnCount = ref(0)
const errorMessage = ref('')
const showError = ref(false)
let sessionId = null

const userMissions = computed(() => {
  return missions.value.filter((m) => m.side === 'user')
})

const completedCount = computed(() => {
  return userMissions.value.filter((m) => m.status === 'completed').length
})

const missionProgress = computed(() => {
  if (!userMissions.value.length) return 0
  return (completedCount.value / userMissions.value.length) * 100
})

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
    lastAudioBase64 = audioBlob // Store for retry
    messages.value.push({
      role: 'user',
      text: '🎤 録音中...',
      audioBase64: base64
    })

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
    hintVisible.value = false
    hintRevealLevel.value = 0
    turnCount.value++

    // Update missions
    if (result.missionUpdates) {
      for (const update of result.missionUpdates) {
        const mission = missions.value.find(
          (m) => m.missionId === update.id && m.side === update.side
        )
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
    errorMessage.value = error.message || '处理失败，请重试'
    showError.value = true
    // Remove the pending user message
    messages.value.pop()
  } finally {
    isLoading.value = false
  }
}

async function playUserAudio(msg) {
  if (!msg.audioBase64) return
  try {
    msg.isPlaying = true
    const audio = new Audio(`data:audio/wav;base64,${msg.audioBase64}`)
    audio.onended = () => { msg.isPlaying = false }
    audio.onerror = () => { msg.isPlaying = false }
    await audio.play()
  } catch (e) {
    msg.isPlaying = false
  }
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(blob)
  })
}

let lastAudioBase64 = null

function retryLastAction() {
  if (lastAudioBase64) {
    handleRecording(lastAudioBase64)
  }
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

<style scoped>
.msg-in {
  animation: msg-in 0.35s ease both;
}

@keyframes msg-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.thinking-dot {
  animation: thinking 1s ease-in-out infinite;
}

@keyframes thinking {
  0%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
