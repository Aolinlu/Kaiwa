<template>
  <div class="min-h-screen bg-[#f7f7f7]">
    <header class="bg-white shadow-sm border-b-2 border-[#e5e5e5] px-4 py-3">
      <div class="max-w-5xl mx-auto flex items-center">
        <button @click="goBack" class="text-[#777777] font-bold">← 戻る</button>
        <h1 class="text-lg font-extrabold text-[#3c3c3c] ml-4">学習レポート</h1>
      </div>
    </header>

    <main class="max-w-5xl mx-auto p-4">
      <div v-if="loading" class="text-center py-8 text-[#777777]">読み込み中...</div>
      <div v-else-if="!session" class="text-center py-8 text-[#ff4b4b]">セッションが見つかりません</div>
      <div v-else class="flex gap-6 flex-col lg:flex-row">
        <!-- Left: Summary -->
        <div class="lg:w-80 flex-shrink-0 space-y-4">
          <!-- Score -->
          <div class="bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl p-6 text-center">
            <p class="text-5xl font-extrabold text-[#58cc02]">⭐ {{ report?.overallScore?.toFixed(1) || '--' }}</p>
            <p class="text-[#777777] mt-1">総合スコア</p>
          </div>

          <!-- Missions -->
          <div class="bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl p-4">
            <h3 class="font-extrabold text-[#3c3c3c] mb-3">ミッション</h3>
            <div class="space-y-2">
              <div v-for="m in session.missions" :key="m.id" class="flex items-center gap-2">
                <span :class="m.status === 'completed' ? 'text-[#58cc02]' : 'text-[#e5e5e5]'">
                  {{ m.status === 'completed' ? '✅' : '⬜' }}
                </span>
                <span class="text-sm" :class="m.status === 'completed' ? 'text-[#3c3c3c]' : 'text-[#afafaf]'">
                  {{ m.title }}
                </span>
              </div>
            </div>
          </div>

          <!-- Teacher Evaluation -->
          <div class="bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl p-4">
            <h3 class="font-extrabold text-[#3c3c3c] mb-3">Teacher 評価</h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-[#777777]">文法</span>
                  <span class="font-bold text-[#3c3c3c]">{{ avgGrammar.toFixed(1) }}</span>
                </div>
                <div class="w-full bg-[#e5e5e5] rounded-full h-2">
                  <div class="h-full bg-[#58cc02] rounded-full" :style="{ width: (avgGrammar * 10) + '%' }" />
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-[#777777]">発音</span>
                  <span class="font-bold text-[#3c3c3c]">{{ avgPronunciation.toFixed(1) }}</span>
                </div>
                <div class="w-full bg-[#e5e5e5] rounded-full h-2">
                  <div class="h-full bg-[#ff9600] rounded-full" :style="{ width: (avgPronunciation * 10) + '%' }" />
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-[#777777]">自然さ</span>
                  <span class="font-bold text-[#3c3c3c]">{{ avgNaturalness.toFixed(1) }}</span>
                </div>
                <div class="w-full bg-[#e5e5e5] rounded-full h-2">
                  <div class="h-full bg-[#1cb0f6] rounded-full" :style="{ width: (avgNaturalness * 10) + '%' }" />
                </div>
              </div>
            </div>
          </div>

          <!-- Suggestions -->
          <div v-if="parsedImprovements.length" class="bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl p-4">
            <h3 class="font-extrabold text-[#3c3c3c] mb-3">改善提案</h3>
            <ul class="space-y-2">
              <li v-for="(item, i) in parsedImprovements" :key="i" class="text-sm text-[#777777]">
                • {{ item }}
              </li>
            </ul>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="startNew"
              class="flex-1 py-3 bg-[#58cc02] text-white font-extrabold rounded-2xl border-b-4 border-[#58a700] hover:bg-[#89e219] active:translate-y-1 active:border-b-0 transition-all"
            >
              もう一度
            </button>
            <button
              @click="goHome"
              class="flex-1 py-3 bg-white text-[#777777] font-extrabold rounded-2xl border-2 border-[#e5e5e5] border-b-4 hover:text-[#3c3c3c] active:translate-y-1 active:border-b-0 transition-all"
            >
              ホーム
            </button>
          </div>
        </div>

        <!-- Right: Conversation Review -->
        <div class="flex-1">
          <div class="bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl p-4">
            <h3 class="font-extrabold text-[#3c3c3c] mb-4">会話レビュー</h3>
            <div class="space-y-4">
              <div v-for="turn in session.turns" :key="turn.id" class="border-b border-[#e5e5e5] pb-4 last:border-0">
                <!-- User -->
                <div v-if="turn.userText" class="mb-3">
                  <p class="text-xs text-[#777777] mb-1">あなた</p>
                  <div class="bg-[#dbf8c5] rounded-xl p-3">
                    <p class="font-bold text-[#3c3c3c]">{{ turn.userText }}</p>
                    <div v-if="turn.overallScore" class="flex items-center gap-2 mt-2">
                      <span class="text-sm font-bold text-[#58cc02]">⭐ {{ turn.overallScore.toFixed(1) }}</span>
                      <button
                        v-if="turn.userAudioPath"
                        @click="playAudio(turn.userAudioPath)"
                        class="text-sm text-[#1cb0f6] font-bold hover:underline"
                      >
                        ▶️ あなたの音声
                      </button>
                    </div>
                  </div>

                  <!-- Teacher Evaluation -->
                  <div v-if="turn.grammarScore || turn.pronunciationScore || turn.naturalnessScore" class="mt-2 bg-[#fff4d6] border-2 border-[#ff9600] rounded-xl p-3">
                    <p class="text-xs font-extrabold text-[#cc7a00] mb-2">Teacher 評価</p>
                    <div class="space-y-2">
                      <div v-if="turn.grammarScore">
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-[#777777]">文法</span>
                          <span class="font-bold text-[#3c3c3c]">{{ turn.grammarScore.toFixed(1) }}</span>
                        </div>
                        <div class="w-full bg-[#e5e5e5] rounded-full h-1.5">
                          <div class="h-full bg-[#58cc02] rounded-full" :style="{ width: (turn.grammarScore * 10) + '%' }" />
                        </div>
                        <div v-if="turn.grammarErrors" class="text-xs text-[#777777] mt-1">
                          {{ JSON.parse(turn.grammarErrors).join(', ') }}
                        </div>
                      </div>
                      <div v-if="turn.pronunciationScore">
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-[#777777]">発音</span>
                          <span class="font-bold text-[#3c3c3c]">{{ turn.pronunciationScore.toFixed(1) }}</span>
                        </div>
                        <div class="w-full bg-[#e5e5e5] rounded-full h-1.5">
                          <div class="h-full bg-[#ff9600] rounded-full" :style="{ width: (turn.pronunciationScore * 10) + '%' }" />
                        </div>
                        <div v-if="turn.pronunciationIssues" class="text-xs text-[#777777] mt-1">
                          {{ JSON.parse(turn.pronunciationIssues).join(', ') }}
                        </div>
                      </div>
                      <div v-if="turn.naturalnessScore">
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-[#777777]">自然さ</span>
                          <span class="font-bold text-[#3c3c3c]">{{ turn.naturalnessScore.toFixed(1) }}</span>
                        </div>
                        <div class="w-full bg-[#e5e5e5] rounded-full h-1.5">
                          <div class="h-full bg-[#1cb0f6] rounded-full" :style="{ width: (turn.naturalnessScore * 10) + '%' }" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- NPC -->
                <div v-if="turn.npcText">
                  <p class="text-xs text-[#777777] mb-1">{{ session.npcName }}</p>
                  <div class="bg-[#f7f7f7] rounded-xl p-3">
                    <p class="font-bold text-[#3c3c3c]">{{ turn.npcText }}</p>
                    <p v-if="turn.npcTranslation" class="text-sm text-[#777777] mt-1">{{ turn.npcTranslation }}</p>
                    <button
                      v-if="turn.npcAudioPath"
                      @click="playAudio(turn.npcAudioPath)"
                      class="mt-2 text-sm text-[#1cb0f6] font-bold hover:underline"
                    >
                      ▶️ NPC音声
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

const parsedImprovements = computed(() => {
  if (!report.value?.improvements) return []
  try { return JSON.parse(report.value.improvements) } catch { return [] }
})

function playAudio(path) {
  const filename = path.split('/').pop()
  const url = SessionService.getAudioUrl(sessionId, filename)
  SpeechService.playAudio(url)
}

function startNew() {
  router.push('/conversation/new')
}

function goHome() {
  router.push('/')
}

function goBack() {
  router.push('/')
}
</script>
