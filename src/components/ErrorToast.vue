<template>
  <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
    <div class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
      <span class="text-red-500">⚠️</span>
      <span class="text-red-700 text-sm">{{ message }}</span>
      <button
        @click="$emit('retry')"
        class="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
      >
        重试
      </button>
      <button
        @click="$emit('dismiss')"
        class="text-red-400 hover:text-red-600 text-sm"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    required: true
  }
})

defineEmits(['retry', 'dismiss'])
</script>
