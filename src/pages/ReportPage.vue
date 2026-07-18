<template>
  <div class="min-h-screen bg-kinari-100">
    <!-- Header -->
    <header class="bg-kinari-50/90 backdrop-blur border-b border-kinari-200 sticky top-0 z-10 px-6 h-16 flex items-center">
      <div class="max-w-6xl mx-auto w-full flex items-center gap-4">
        <button @click="goBack" class="flex items-center gap-2 text-sumi-500 hover:text-ai-600 font-bold text-sm transition-colors">
          <span>←</span><span>戻る</span>
        </button>
        <h1 class="font-jserif text-lg font-bold text-sumi-800">学習レポート</h1>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-8 py-10">
      <div v-if="loading" class="text-center py-16 text-sumi-500">読み込み中…</div>
      <div v-else-if="!session" class="text-center py-16 text-shu-500">セッションが見つかりません</div>

      <div v-else class="grid grid-cols-3 gap-8 items-start">
        <!-- Left: Summary -->
        <div class="col-span-1 space-y-5">
          <!-- Score -->
          <div class="bg-white rounded-2xl border border-kinari-200 shadow-paper p-6 text-center msg-in">
            <div class="relative w-32 h-32 mx-auto mb-3">
              <svg viewBox="0 0 96 96" class="w-32 h-32 -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="#ece8de" stroke-width="7" />
                <circle
                  v-if="report?.overallScore"
                  cx="48" cy="48" r="40" fill="none" stroke="#c9a227" stroke-width="7"
                  stroke-linecap="round"
                  class="score-ring"
                  :stroke-dasharray="`${(report.overallScore / 10) * 251.2} 251.2`"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="font-jserif text-4xl font-bold text-kin-600">{{ report?.overallScore?.toFixed(1) || '--' }}</span>
                <span class="text-[10px] tracking-[0.3em] text-sumi-500 mt-1">総合スコア</span>
              </div>
            </div>
            <p v-if="report?.summary" class="text-sm text-sumi-600 leading-relaxed text-left border-t border-kinari-200 pt-4 mt-2">
              {{ report.summary }}
            </p>
          </div>

          <!-- Missions -->
          <div class="bg-white rounded-2xl border border-kinari-200 shadow-paper p-5 msg-in">
            <div class="flex items-baseline justify-between mb-1">
              <h3 class="font-jserif font-bold text-sumi-800">ミッション</h3>
              <span class="text-xs text-sumi-500">{{ missionDone }}/{{ session.missions.length }} 達成</span>
            </div>
            <div class="w-full bg-kinari-200 rounded-full h-1.5 overflow-hidden mb-4">
              <div class="h-full bg-gradient-to-r from-ai-500 to-ai-400 rounded-full transition-all duration-500" :style="{ width: missionProgress + '%' }" />
            </div>
            <div class="space-y-2">
              <div
                v-for="m in session.missions"
                :key="m.id"
                class="flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-500"
                :class="m.status === 'completed' ? 'bg-ai-50 border-ai-200' : 'bg-white border-kinari-200'"
              >
                <span
                  class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                  :class="m.status === 'completed' ? 'bg-ai-600 text-kinari-50' : 'bg-kinari-200 text-sumi-500/50'"
                >
                  {{ m.status === 'completed' ? '✓' : '○' }}
                </span>
                <span class="text-sm" :class="m.status === 'completed' ? 'text-sumi-800 font-bold' : 'text-sumi-500'">
                  {{ m.title }}
                </span>
              </div>
            </div>
          </div>

          <!-- Teacher Evaluation -->
          <div class="bg-white rounded-2xl border border-kinari-200 shadow-paper p-5 msg-in">
            <h3 class="font-jserif font-bold text-sumi-800 mb-4">Teacher 評価</h3>
            <div class="space-y-4">
              <div v-for="bar in evalBars" :key="bar.label">
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="text-sumi-500">{{ bar.label }}</span>
                  <span class="font-jserif font-bold text-sumi-800">{{ bar.value.toFixed(1) }}</span>
                </div>
                <div class="w-full bg-kinari-200 rounded-full h-1.5">
                  <div class="h-full rounded-full transition-all duration-700" :class="bar.color" :style="{ width: (bar.value * 10) + '%' }" />
                </div>
              </div>
            </div>
          </div>

          <!-- Words learned -->
          <div v-if="parsedWordsLearned.length" class="bg-white rounded-2xl border border-kinari-200 shadow-paper p-5 msg-in">
            <h3 class="font-jserif font-bold text-sumi-800 mb-3">学んだ単語</h3>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="word in parsedWordsLearned" :key="word" class="px-2.5 py-1 bg-ai-100 text-ai-700 text-xs rounded-full font-bold">
                {{ word }}
              </span>
            </div>
          </div>

          <!-- Improvements -->
          <div v-if="parsedImprovements.length" class="bg-white rounded-2xl border border-kinari-200 shadow-paper p-5 msg-in">
            <h3 class="font-jserif font-bold text-sumi-800 mb-3">改善提案</h3>
            <ul class="space-y-2">
              <li v-for="(item, i) in parsedImprovements" :key="i" class="flex gap-2 text-sm text-sumi-600 leading-relaxed">
                <span class="text-shu-500 flex-shrink-0">・</span>{{ item }}
              </li>
            </ul>
          </div>

          <!-- Next suggestions -->
          <div v-if="parsedNextSuggestions.length" class="bg-white rounded-2xl border border-kinari-200 shadow-paper p-5 msg-in">
            <h3 class="font-jserif font-bold text-sumi-800 mb-3">次回の提案</h3>
            <ul class="space-y-2">
              <li v-for="(item, i) in parsedNextSuggestions" :key="i" class="flex gap-2 text-sm text-sumi-600 leading-relaxed">
                <span class="text-ai-500 flex-shrink-0">・</span>{{ item }}
              </li>
            </ul>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 msg-in">
            <button
              @click="startNew"
              class="flex-1 py-3.5 rounded-lg bg-ai-600 text-kinari-50 font-bold shadow-paper transition-all hover:bg-ai-500 hover:shadow-paper-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              もう一度練習
            </button>
            <button
              @click="goHome"
              class="flex-1 py-3.5 rounded-lg bg-white text-sumi-600 font-bold border border-kinari-300 transition-all hover:border-ai-400 hover:text-ai-700 hover:-translate-y-0.5 active:translate-y-0"
            >
              ホームへ
            </button>
          </div>
        </div>

        <!-- Right: Conversation Review -->
        <div class="col-span-2">
          <div class="bg-white rounded-2xl border border-kinari-200 shadow-paper p-6 msg-in">
            <div class="flex items-baseline justify-between mb-5">
              <h3 class="font-jserif text-xl font-bold text-sumi-800">会話レビュー</h3>
              <span class="text-xs tracking-widest text-sumi-500">{{ session.turns.length }} ターン</span>
            </div>

            <div class="space-y-6">
              <div v-for="turn in session.turns" :key="turn.id" class="border-b border-kinari-200 pb-6 last:border-0 last:pb-0">
                <!-- User -->
                <div v-if="turn.userText" class="mb-4">
                  <p class="text-xs text-sumi-500 mb-1.5 text-right">あなた</p>
                  <div class="flex justify-end">
                    <div class="max-w-[85%] bg-ai-600 text-kinari-50 px-4 py-3 rounded-2xl rounded-br-sm shadow-paper">
                      <p class="font-jserif font-bold">{{ turn.userText }}</p>
                      <div v-if="turn.overallScore" class="flex items-center gap-3 mt-2">
                        <span class="text-xs font-bold text-kin-400">★ {{ turn.overallScore.toFixed(1) }}</span>
                        <button
                          v-if="turn.userAudioPath"
                          @click="playAudio(turn.userAudioPath)"
                          class="text-xs text-kinari-50/80 hover:text-kinari-50 font-bold transition-colors"
                        >
                          ▶ 音声を再生
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Teacher Evaluation -->
                  <div v-if="turn.grammarScore || turn.pronunciationScore || turn.naturalnessScore" class="mt-2 ml-auto max-w-[85%] bg-kinari-50 border border-kin-500/30 rounded-xl p-4">
                    <p class="text-[10px] tracking-[0.3em] font-bold text-kin-600 mb-3">TEACHER 評価</p>
                    <div class="space-y-3">
                      <div v-if="turn.grammarScore">
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-sumi-500">文法</span>
                          <span class="font-bold text-sumi-800">{{ turn.grammarScore.toFixed(1) }}</span>
                        </div>
                        <div class="w-full bg-kinari-200 rounded-full h-1">
                          <div class="h-full bg-ai-500 rounded-full" :style="{ width: (turn.grammarScore * 10) + '%' }" />
                        </div>
                        <div v-if="turn.grammarErrors" class="text-xs text-sumi-500 mt-1.5 leading-relaxed">
                          {{ JSON.parse(turn.grammarErrors).join(', ') }}
                        </div>
                      </div>
                      <div v-if="turn.pronunciationScore">
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-sumi-500">発音</span>
                          <span class="font-bold text-sumi-800">{{ turn.pronunciationScore.toFixed(1) }}</span>
                        </div>
                        <div class="w-full bg-kinari-200 rounded-full h-1">
                          <div class="h-full bg-kin-500 rounded-full" :style="{ width: (turn.pronunciationScore * 10) + '%' }" />
                        </div>
                        <div v-if="turn.pronunciationIssues" class="text-xs text-sumi-500 mt-1.5 leading-relaxed">
                          {{ JSON.parse(turn.pronunciationIssues).join(', ') }}
                        </div>
                      </div>
                      <div v-if="turn.naturalnessScore">
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-sumi-500">自然さ</span>
                          <span class="font-bold text-sumi-800">{{ turn.naturalnessScore.toFixed(1) }}</span>
                        </div>
                        <div class="w-full bg-kinari-200 rounded-full h-1">
                          <div class="h-full bg-shu-400 rounded-full" :style="{ width: (turn.naturalnessScore * 10) + '%' }" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- NPC -->
                <div v-if="turn.npcText">
                  <p class="text-xs text-sumi-500 mb-1.5">{{ session.npcName }}</p>
                  <div class="max-w-[85%] bg-kinari-50 border border-kinari-200 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <p class="font-jserif font-bold text-sumi-800">{{ turn.npcText }}</p>
                    <p v-if="turn.npcTranslation" class="text-sm text-sumi-500 mt-1">{{ turn.npcTranslation }}</p>
                    <button
                      v-if="turn.npcAudioPath"
                      @click="playAudio(turn.npcAudioPath)"
                      class="mt-2 text-xs text-ai-600 hover:text-ai-500 font-bold transition-colors"
                    >
                      ▶ NPC音声
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SessionService } from '../services/SessionService.js'
import { SpeechService } from '../services/SpeechService.js'

const route = useRoute()
const router = useRouter()
const sessionId = route.params.id

const session = ref(null)
const report = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    session.value = await SessionService.getSession(sessionId)
    report.value = session.value.report
  } catch (error) {
    console.error('Failed to load session:', error)
  } finally {
    loading.value = false
  }
})

const avgGrammar = computed(() => {
  const scores = session.value?.turns?.filter((t) => t.grammarScore).map((t) => t.grammarScore) || []
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
})

const avgPronunciation = computed(() => {
  const scores = session.value?.turns?.filter((t) => t.pronunciationScore).map((t) => t.pronunciationScore) || []
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
})

const avgNaturalness = computed(() => {
  const scores = session.value?.turns?.filter((t) => t.naturalnessScore).map((t) => t.naturalnessScore) || []
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
})

const evalBars = computed(() => [
  { label: '文法', value: avgGrammar.value, color: 'bg-ai-500' },
  { label: '発音', value: avgPronunciation.value, color: 'bg-kin-500' },
  { label: '自然さ', value: avgNaturalness.value, color: 'bg-shu-400' },
])

const missionDone = computed(() => {
  return (session.value?.missions || []).filter((m) => m.status === 'completed').length
})

const missionProgress = computed(() => {
  const total = session.value?.missions?.length || 0
  return total ? (missionDone.value / total) * 100 : 0
})

function parseJsonField(field) {
  if (!field) return []
  try { return JSON.parse(field) } catch { return [] }
}

const parsedImprovements = computed(() => parseJsonField(report.value?.improvements))
const parsedWordsLearned = computed(() => parseJsonField(report.value?.wordsLearned))
const parsedNextSuggestions = computed(() => parseJsonField(report.value?.nextSuggestions))

function playAudio(path) {
  const filename = path.split('/').pop()
  const url = SessionService.getAudioUrl(sessionId, filename)
  SpeechService.playAudio(url)
}

async function startNew() {
  try {
    const { session: newSession } = await SessionService.createSession(
      session.value.courseId,
      session.value.scenarioId
    )
    router.push(`/conversation/${newSession.id}`)
  } catch (error) {
    console.error('Failed to start new practice:', error)
  }
}

function goHome() {
  router.push('/')
}

function goBack() {
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

.score-ring {
  animation: draw-ring 1s ease-out both;
}

@keyframes draw-ring {
  from {
    stroke-dasharray: 0 251.2;
  }
}
</style>
