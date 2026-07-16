<template>
  <div class="min-h-screen bg-[#f7f7f7]">
    <header class="bg-white shadow-sm border-b-2 border-[#e5e5e5] px-4 py-3">
      <div class="max-w-2xl mx-auto flex items-center justify-between">
        <h1 class="text-xl font-extrabold">KaiWa</h1>
        <button @click="handleLogout" class="text-sm text-[#ff4b4b] font-bold">退出</button>
      </div>
    </header>
    <main class="max-w-2xl mx-auto p-4">
      <p class="text-center text-[#777777] mt-8">首页开发中...</p>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { AuthService } from '../services/AuthService.js'

const router = useRouter()

function handleLogout() {
  AuthService.logout()
  router.push('/login')
}
</script>
