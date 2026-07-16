<template>
  <div class="min-h-screen bg-[#f7f7f7]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b-2 border-[#e5e5e5] px-4 py-3">
      <div class="max-w-2xl mx-auto flex items-center justify-between">
        <h1 class="text-xl font-extrabold">KaiWa</h1>
        <div class="flex items-center gap-3">
          <span class="text-sm text-[#777777]">{{ user?.name }}</span>
          <button @click="handleLogout" class="text-sm text-[#ff4b4b] font-bold">退出</button>
        </div>
      </div>
    </header>

    <main class="max-w-2xl mx-auto p-4">
      <!-- Course Card -->
      <section class="mb-6">
        <h2 class="text-lg font-extrabold text-[#3c3c3c] mb-3">練習を続ける</h2>
        <div
          class="bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
          @click="startPractice"
        >
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-[#58cc02] flex items-center justify-center text-3xl border-b-4 border-[#58a700]">
              🗾
            </div>
            <div class="flex-1">
              <h3 class="font-extrabold text-[#3c3c3c]">Course 01</h3>
              <p class="text-[#777777] text-sm">初めての出会い</p>
            </div>
          </div>
          <div class="mt-3 w-full bg-[#e5e5e5] rounded-full h-4 overflow-hidden">
            <div class="h-full bg-[#58cc02] rounded-full transition-all duration-300" :style="{ width: progressValue + '%' }" />
          </div>
        </div>
      </section>

      <!-- History -->
      <section>
        <h2 class="text-lg font-extrabold text-[#3c3c3c] mb-3">練習履歴</h2>
        <div v-if="sessions.length === 0" class="text-center py-8 text-[#afafaf]">
          まだ練習記録がありません
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="session in sessions"
            :key="session.id"
            class="bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
            @click="viewReport(session.id)"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[#777777]">{{ formatDate(session.startedAt) }}</p>
                <p class="font-bold text-[#3c3c3c]">{{ session.npcName }}</p>
              </div>
              <div class="text-right">
                <p v-if="session.score" class="text-2xl font-extrabold text-[#58cc02]">⭐ {{ session.score.toFixed(1) }}</p>
                <p v-else class="text-sm text-[#afafaf]">進行中</p>
              </div>
            </div>
          </div>
        </div>
      </section>
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

const progressValue = computed(() => {
  const completed = sessions.value.filter((s) => s.status === 'completed').length
  return Math.min(100, completed * 20)
})

onMounted(async () => {
  try {
    const data = await SessionService.listSessions()
    sessions.value = data.sessions
  } catch (error) {
    console.error('Failed to load sessions:', error)
  }
})

async function startPractice() {
  router.push('/conversation/new')
}

function viewReport(sessionId) {
  router.push(`/report/${sessionId}`)
}

function handleLogout() {
  AuthService.logout()
  router.push('/login')
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>
