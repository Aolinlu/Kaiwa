<template>
  <div class="min-h-screen bg-white flex items-center justify-center">
    <div class="w-full max-w-sm px-6">
      <h1 class="text-4xl font-extrabold text-center mb-2">🗾 KaiWa</h1>
      <p class="text-center text-[#777777] mb-8">日语口语练习</p>
      <form @submit.prevent="handleLogin">
        <DInput v-model="email" type="email" placeholder="Email" />
        <DInput v-model="password" type="password" placeholder="Password" class="mt-3" />
        <DButton class="w-full mt-4" :disabled="loading">
          {{ loading ? '...' : '登录' }}
        </DButton>
        <p v-if="error" class="mt-3 text-[#ff4b4b] text-sm text-center">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '../services/AuthService.js'
import DInput from '../components/duolingo/DInput.vue'
import DButton from '../components/duolingo/DButton.vue'

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
