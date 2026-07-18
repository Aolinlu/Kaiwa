<template>
  <div class="min-h-screen bg-kinari-100">
    <!-- Header -->
    <header class="bg-kinari-50/90 backdrop-blur border-b border-kinari-200 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-ai-800 flex items-center justify-center shadow-paper">
            <span class="text-kinari-50 font-jserif font-bold text-lg leading-none">会</span>
          </div>
          <div class="leading-tight">
            <p class="font-jserif font-bold text-ai-900 text-lg">KaiWa</p>
            <p class="text-[10px] tracking-[0.3em] text-sumi-500">会話練習</p>
          </div>
        </div>
        <div class="flex items-center gap-5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-ai-100 text-ai-700 flex items-center justify-center text-sm font-bold">
              {{ user?.name?.charAt(0) || '？' }}
            </div>
            <span class="text-sm text-sumi-600 font-medium">{{ user?.name }}</span>
          </div>
          <span class="w-px h-4 bg-kinari-300"></span>
          <button @click="handleLogout" class="text-sm text-sumi-500 hover:text-shu-500 transition-colors">
            ログアウト
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-8 py-10">
      <!-- Greeting -->
      <div class="mb-10">
        <h1 class="font-jserif text-3xl font-bold text-sumi-800 mb-2">
          おかえりなさい、{{ user?.name }} さん。
        </h1>
        <p class="text-sumi-500 text-sm tracking-wide">今日は {{ todayText }} です。声に出して、覚えましょう。</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-5 mb-12">
        <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-xl border border-kinari-200 shadow-paper px-6 py-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs tracking-widest text-sumi-500 mb-2">{{ stat.label }}</p>
              <p class="font-jserif text-3xl font-bold" :class="stat.color">
                {{ stat.value }}<span class="text-base font-normal text-sumi-500 ml-1">{{ stat.unit }}</span>
              </p>
            </div>
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg" :class="stat.badge">
              {{ stat.mark }}
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-8 items-start">
        <!-- Course -->
        <section class="col-span-2">
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="font-jserif text-xl font-bold text-sumi-800">コース</h2>
            <span class="text-xs tracking-widest text-sumi-500">COURSE</span>
          </div>

          <div v-if="!courses.length" class="bg-kinari-50 border border-dashed border-kinari-300 rounded-xl p-8 text-center">
            <div class="bg-seigaiha text-kinari-300 h-10 mb-4 rounded"></div>
            <p class="text-sumi-500 text-sm">コースを読み込み中…</p>
          </div>

          <div v-else class="space-y-6">
            <div v-for="(course, ci) in courses" :key="course.id" class="bg-white rounded-2xl border border-kinari-200 shadow-paper overflow-hidden">
              <!-- Course header band -->
              <div class="relative bg-ai-800 px-8 py-7 overflow-hidden">
                <div class="absolute inset-0 bg-seigaiha text-ai-300 opacity-20"></div>
                <div class="relative">
                  <p class="text-ai-200 text-xs tracking-[0.3em] mb-2">COURSE {{ String(ci + 1).padStart(2, '0') }}</p>
                  <h3 class="font-jserif text-2xl font-bold text-kinari-50 mb-1">{{ course.title }}</h3>
                  <p class="text-ai-200 text-sm">{{ course.description || course.titleCn }}</p>
                </div>
              </div>

              <!-- Progress（全体の練習量、暫定で最初のコースに表示） -->
              <div v-if="ci === 0" class="px-8 pt-6 pb-2">
                <div class="flex items-baseline justify-between mb-2">
                  <p class="text-sm text-sumi-600">
                    累計練習 <span class="font-jserif font-bold text-ai-700 text-lg">{{ sessions.length }}</span> 回
                  </p>
                  <p class="text-xs text-sumi-500">次の節目まであと {{ milestoneRemaining }} 回</p>
                </div>
                <div class="w-full bg-kinari-200 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-ai-500 to-ai-400 rounded-full transition-all duration-700"
                    :style="{ width: milestoneProgress + '%' }"
                  />
                </div>
              </div>

              <!-- Scenario list -->
              <div class="px-8 py-6 space-y-3">
                <p class="text-xs tracking-widest text-sumi-500">シナリオ</p>
                <div
                  v-for="(sc, si) in course.scenarios"
                  :key="sc.id"
                  class="group flex items-center gap-5 rounded-xl border border-kinari-200 bg-kinari-50 px-6 py-5 cursor-pointer transition-all hover:border-ai-300 hover:shadow-paper-lg hover:-translate-y-0.5"
                  @click="startScenario(course.id, sc.id)"
                >
                  <div class="w-12 h-12 rounded-full bg-ai-600 text-kinari-50 flex items-center justify-center font-jserif font-bold text-lg shadow-paper group-hover:bg-ai-500 transition-colors">
                    {{ KANJI_NUMERALS[si] || si + 1 }}
                  </div>
                  <div class="flex-1">
                    <h4 class="font-bold text-sumi-800 mb-0.5">
                      {{ sc.title }}
                      <span v-if="sc.difficulty" class="text-kin-500 text-xs ml-2">{{ '★'.repeat(sc.difficulty) }}</span>
                    </h4>
                    <p class="text-sm text-sumi-500">{{ sc.sceneTitle }}<span v-if="sc.titleCn"> · {{ sc.titleCn }}</span></p>
                  </div>
                  <button
                    :disabled="starting"
                    class="px-5 py-2.5 rounded-lg bg-ai-600 text-kinari-50 text-sm font-bold shadow-paper transition-all group-hover:bg-ai-500 group-hover:shadow-paper-lg disabled:opacity-50"
                  >
                    練習を始める →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- History -->
        <section>
          <!-- In progress -->
          <div v-if="inProgressSessions.length" class="mb-8">
            <div class="flex items-baseline justify-between mb-4">
              <h2 class="font-jserif text-xl font-bold text-sumi-800">練習中</h2>
              <span class="text-xs tracking-widest text-sumi-500">{{ inProgressSessions.length }} 件</span>
            </div>
            <div class="space-y-3">
              <div
                v-for="session in inProgressSessions"
                :key="session.id"
                class="group bg-white rounded-xl border-2 border-dashed border-ai-300 px-5 py-4 cursor-pointer transition-all hover:border-ai-500 hover:shadow-paper-lg hover:-translate-y-0.5"
                @click="resumePractice(session.id)"
              >
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-ai-100 text-ai-600 flex items-center justify-center font-jserif font-bold flex-shrink-0">
                    続
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-jserif text-sm text-sumi-500 mb-0.5">{{ formatDate(session.startedAt) }}</p>
                    <p class="font-bold text-sumi-800 truncate">{{ session.npcName }} との会話</p>
                    <p class="text-xs text-sumi-500 mt-0.5">
                      {{ session._count?.turns ?? 0 }} ターン · ミッション {{ missionSummary(session) }}
                    </p>
                  </div>
                  <span class="text-sm font-bold text-ai-600 group-hover:text-ai-500 whitespace-nowrap transition-colors">続きから →</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Completed -->
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="font-jserif text-xl font-bold text-sumi-800">練習履歴</h2>
            <span class="text-xs tracking-widest text-sumi-500">{{ completedSessions.length }} 件</span>
          </div>

          <div v-if="sessions.length === 0" class="bg-kinari-50 border border-dashed border-kinari-300 rounded-xl p-8 text-center">
            <div class="bg-seigaiha text-kinari-300 h-10 mb-4 rounded"></div>
            <p class="text-sumi-500 text-sm leading-relaxed">まだ練習記録がありません。<br>最初の会話を始めましょう。</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="session in completedSessions"
              :key="session.id"
              class="group bg-white rounded-xl border border-kinari-200 shadow-paper px-5 py-4 cursor-pointer transition-all hover:border-ai-300 hover:shadow-paper-lg hover:-translate-y-0.5"
              @click="viewReport(session.id)"
            >
              <div class="flex items-center gap-4">
                <!-- Score ring -->
                <div class="relative w-14 h-14 flex-shrink-0">
                  <svg viewBox="0 0 48 48" class="w-14 h-14 -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#ece8de" stroke-width="4" />
                    <circle
                      v-if="session.score"
                      cx="24" cy="24" r="20" fill="none" stroke="#c9a227" stroke-width="4"
                      stroke-linecap="round"
                      :stroke-dasharray="`${(session.score / 10) * 125.6} 125.6`"
                    />
                    <circle
                      v-else
                      cx="24" cy="24" r="20" fill="none" stroke="#8da4cf" stroke-width="4"
                      stroke-linecap="round" stroke-dasharray="4 6"
                    />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span v-if="session.score" class="font-jserif font-bold text-kin-600 text-sm">{{ session.score.toFixed(1) }}</span>
                    <span v-else class="text-ai-400 text-[10px] font-bold">途中</span>
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="font-jserif text-sm text-sumi-500 mb-0.5">{{ formatDate(session.startedAt) }}</p>
                  <p class="font-bold text-sumi-800 truncate">{{ session.npcName }} との会話</p>
                  <p class="text-xs text-sumi-500 mt-0.5">
                    {{ session._count?.turns ?? 0 }} ターン · ミッション {{ missionSummary(session) }}
                  </p>
                </div>

                <span class="text-kinari-300 group-hover:text-ai-400 transition-colors text-lg">→</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '../services/AuthService.js'
import { SessionService } from '../services/SessionService.js'

const router = useRouter()
const user = ref(AuthService.getCurrentUser())
const sessions = ref([])
const courses = ref([])
const starting = ref(false)

const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土']
const KANJI_NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

const inProgressSessions = computed(() => sessions.value.filter((s) => s.status !== 'completed'))
const completedSessions = computed(() => sessions.value.filter((s) => s.status === 'completed'))

const todayText = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS_JP[d.getDay()]}）`
})

const streakDays = computed(() => {
  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const practiced = new Set(sessions.value.map((s) => dayKey(new Date(s.startedAt))))
  const cursor = new Date()
  if (!practiced.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (practiced.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
})

const totalTurns = computed(() =>
  sessions.value.reduce((sum, s) => sum + (s._count?.turns ?? 0), 0)
)

const averageScore = computed(() => {
  const scored = sessions.value.filter((s) => s.score)
  if (!scored.length) return null
  return scored.reduce((sum, s) => sum + s.score, 0) / scored.length
})

const milestoneProgress = computed(() => (sessions.value.length % 10) * 10)

const milestoneRemaining = computed(() => {
  const rem = sessions.value.length % 10
  return rem === 0 ? 10 : 10 - rem
})

const stats = computed(() => [
  { label: '連続練習', value: streakDays.value, unit: '日', mark: '火', color: streakDays.value > 0 ? 'text-shu-500' : 'text-sumi-500', badge: 'bg-shu-500/10 text-shu-500' },
  { label: '練習セッション', value: sessions.value.length, unit: '回', mark: '話', color: 'text-ai-700', badge: 'bg-ai-100 text-ai-600' },
  { label: '総対話ターン', value: totalTurns.value, unit: '回', mark: '言', color: 'text-ai-700', badge: 'bg-ai-100 text-ai-600' },
  { label: '平均スコア', value: averageScore.value?.toFixed(1) ?? '—', unit: averageScore.value ? '点' : '', mark: '星', color: 'text-kin-600', badge: 'bg-kin-500/10 text-kin-500' },
])

onMounted(async () => {
  try {
    const [coursesData, sessionsData] = await Promise.all([
      SessionService.listCourses(),
      SessionService.listSessions(),
    ])
    courses.value = coursesData
    sessions.value = sessionsData.sessions
  } catch (error) {
    console.error('Failed to load home data:', error)
  }
})

async function startScenario(courseId, scenarioId) {
  if (starting.value) return
  starting.value = true
  try {
    const { session } = await SessionService.createSession(courseId, scenarioId)
    router.push(`/conversation/${session.id}`)
  } catch (error) {
    console.error('Failed to create session:', error)
  } finally {
    starting.value = false
  }
}

function resumePractice(sessionId) {
  router.push(`/conversation/${sessionId}`)
}

function viewReport(sessionId) {
  router.push(`/report/${sessionId}`)
}

function handleLogout() {
  AuthService.logout()
  router.push('/login')
}

function missionSummary(session) {
  const userMissions = (session.missions || []).filter((m) => m.side === 'user')
  const done = userMissions.filter((m) => m.status === 'completed').length
  return `${done}/${userMissions.length}`
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS_JP[d.getDay()]}）`
}
</script>
