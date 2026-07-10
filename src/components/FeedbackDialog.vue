<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Today's Feedback</h2>
        <div class="text-4xl mb-2">
          {{ '⭐'.repeat(Math.round(feedback.score / 20)) }}{{ '☆'.repeat(5 - Math.round(feedback.score / 20)) }}
        </div>
        <div class="text-xl text-gray-600">{{ feedback.score }}分</div>
      </div>

      <div v-if="feedback.good.length > 0" class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">✅</span>
          <span class="font-semibold text-gray-700">Good</span>
        </div>
        <ul class="list-disc list-inside text-gray-600 space-y-1">
          <li v-for="(item, index) in feedback.good" :key="index">{{ item }}</li>
        </ul>
      </div>

      <div v-if="feedback.improve.length > 0" class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">⚠️</span>
          <span class="font-semibold text-gray-700">Improve</span>
        </div>
        <ul class="list-disc list-inside text-gray-600 space-y-1">
          <li v-for="(item, index) in feedback.improve" :key="index">{{ item }}</li>
        </ul>
      </div>

      <div v-if="feedback.vocabulary.length > 0" class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📚</span>
          <span class="font-semibold text-gray-700">Learned</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(word, index) in feedback.vocabulary"
            :key="index"
            class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
          >
            {{ word }}
          </span>
        </div>
      </div>

      <button
        @click="$emit('close')"
        class="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: Object,
    default: () => ({
      score: 0,
      good: [],
      improve: [],
      grammar: [],
      vocabulary: []
    })
  }
})

defineEmits(['close'])
</script>