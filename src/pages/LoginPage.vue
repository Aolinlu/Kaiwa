<template>
  <div class="min-h-screen flex bg-kinari-100">
    <!-- Left: Brand panel -->
    <div class="relative w-[46%] bg-ai-800 overflow-hidden flex flex-col justify-between p-12">
      <div class="absolute inset-0 bg-seigaiha text-ai-300 opacity-20"></div>

      <div class="relative flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-kinari-50 flex items-center justify-center shadow-paper">
          <span class="text-ai-800 font-jserif font-bold text-xl leading-none">会</span>
        </div>
        <p class="font-jserif font-bold text-kinari-50 text-xl">KaiWa</p>
      </div>

      <div class="relative">
        <h1 class="font-jserif text-5xl font-bold text-kinari-50 leading-snug mb-6">
          声に出して、<br>覚える。
        </h1>
        <p class="text-ai-200 leading-relaxed max-w-sm">
          NPC とのリアルな会話を通じて、日本語のスピーキングを練習しましょう。ミッションを達成しながら、自然な会話力を身につけます。
        </p>
      </div>

      <div class="relative flex items-center gap-6 text-ai-300 text-xs tracking-widest">
        <span>発音評価</span>
        <span class="w-1 h-1 rounded-full bg-ai-400"></span>
        <span>会話ミッション</span>
        <span class="w-1 h-1 rounded-full bg-ai-400"></span>
        <span>学習レポート</span>
      </div>
    </div>

    <!-- Right: Login form -->
    <div class="flex-1 flex items-center justify-center px-12">
      <div class="w-full max-w-sm">
        <h2 class="font-jserif text-2xl font-bold text-sumi-800 mb-2">ログイン</h2>
        <p class="text-sumi-500 text-sm mb-8">おかえりなさい。練習を続けましょう。</p>

        <form @submit.prevent="handleLogin">
          <label class="block mb-4">
            <span class="block text-xs tracking-widest text-sumi-500 mb-1.5">メールアドレス</span>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full px-4 py-3 rounded-lg bg-white border border-kinari-300 text-sumi-800 placeholder-sumi-500/50 outline-none transition-all focus:border-ai-500 focus:ring-2 focus:ring-ai-500/20"
            />
          </label>

          <label class="block mb-6">
            <span class="block text-xs tracking-widest text-sumi-500 mb-1.5">パスワード</span>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-3 rounded-lg bg-white border border-kinari-300 text-sumi-800 placeholder-sumi-500/50 outline-none transition-all focus:border-ai-500 focus:ring-2 focus:ring-ai-500/20"
            />
          </label>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 rounded-lg bg-ai-600 text-kinari-50 font-bold shadow-paper transition-all hover:bg-ai-500 hover:shadow-paper-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {{ loading ? 'ログイン中…' : 'ログイン' }}
          </button>

          <p v-if="error" class="mt-4 text-shu-500 text-sm text-center">{{ error }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '../services/AuthService.js'

const router = useRouter()
const email = ref('admin@kaiwa.dev')
const password = ref('admin123')
const loading = ref(false)
const error = ref(null)

async function handleLogin() {
  loading.value = true
  error.value = null
  try {
    await AuthService.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
