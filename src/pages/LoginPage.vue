<template>
  <div class="min-h-screen bg-white flex items-center justify-center">
    <div class="w-full max-w-sm px-6">
      <h1 class="text-4xl font-extrabold text-center mb-2">🗾 KaiWa</h1>
      <p class="text-center text-[#777777] mb-8">日语口语练习</p>
      <form @submit.prevent="handleLogin">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          class="w-full px-4 py-3 border-2 border-[#e5e5e5] rounded-xl text-[#3c3c3c] placeholder-[#afafaf] focus:border-[#1cb0f6] focus:ring-2 focus:ring-[#1cb0f6]/20 focus:outline-none transition-colors"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="w-full px-4 py-3 mt-3 border-2 border-[#e5e5e5] rounded-xl text-[#3c3c3c] placeholder-[#afafaf] focus:border-[#1cb0f6] focus:ring-2 focus:ring-[#1cb0f6]/20 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          :disabled="loading"
          class="w-full mt-4 py-3 bg-[#58cc02] text-white font-extrabold rounded-2xl border-b-4 border-[#58a700] hover:bg-[#89e219] active:translate-y-[3px] active:border-b-0 transition-all disabled:opacity-50"
        >
          {{ loading ? '...' : '登录' }}
        </button>
        <p v-if="error" class="mt-3 text-[#ff4b4b] text-sm text-center">{{ error }}</p>
      </form>
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
