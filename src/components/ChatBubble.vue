<template>
  <div :class="['flex', 'gap-3', 'mb-4', isUser ? 'flex-row-reverse' : 'flex-row']">
    <div :class="['flex-shrink-0', 'w-10', 'h-10', 'rounded-full', 'flex', 'items-center', 'justify-center', 'text-xl', isUser ? 'bg-blue-100' : 'bg-gray-100']">
      {{ isUser ? '👤' : '🤖' }}
    </div>
    <div :class="['max-w-[80%]', 'rounded-2xl', 'px-4', 'py-3', isUser ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200']">
      <div class="text-base">{{ content }}</div>
      <div v-if="translation" :class="['text-sm', 'mt-1', isUser ? 'text-blue-100' : 'text-gray-500']">
        {{ translation }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  content: {
    type: String,
    required: true
  },
  translation: {
    type: String,
    default: null
  },
  isUser: {
    type: Boolean,
    default: false
  }
})
</script>
