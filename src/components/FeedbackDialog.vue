<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">练习反馈</h2>
        <div class="text-4xl mb-2">
          {{ scoreStars }}
        </div>
        <div class="text-xl text-gray-600">{{ feedback.score }}分</div>
        <p v-if="feedback.summary" class="text-sm text-gray-500 mt-2">{{ feedback.summary }}</p>
      </div>

      <div v-if="feedback.grammar?.highlights?.length > 0" class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📝</span>
          <span class="font-semibold text-gray-700">语法</span>
        </div>
        <p v-if="feedback.grammar.trend" class="text-sm text-gray-600 mb-2">{{ feedback.grammar.trend }}</p>
        <ul class="list-disc list-inside text-gray-600 space-y-1 text-sm">
          <li v-for="(item, index) in feedback.grammar.highlights" :key="index">{{ item }}</li>
        </ul>
      </div>

      <div v-if="feedback.pronunciation?.highlights?.length > 0" class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">🗣️</span>
          <span class="font-semibold text-gray-700">发音</span>
        </div>
        <p v-if="feedback.pronunciation.trend" class="text-sm text-gray-600 mb-2">{{ feedback.pronunciation.trend }}</p>
        <ul class="list-disc list-inside text-gray-600 space-y-1 text-sm">
          <li v-for="(item, index) in feedback.pronunciation.highlights" :key="index">{{ item }}</li>
        </ul>
      </div>

      <div v-if="feedback.vocabulary?.words_learned?.length > 0" class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📚</span>
          <span class="font-semibold text-gray-700">学到的词汇</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(word, index) in feedback.vocabulary.words_learned"
            :key="index"
            class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
          >
            {{ word }}
          </span>
        </div>
      </div>

      <div v-if="feedback.improve?.length > 0" class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">💡</span>
          <span class="font-semibold text-gray-700">需要改进</span>
        </div>
        <ul class="list-disc list-inside text-gray-600 space-y-1 text-sm">
          <li v-for="(item, index) in feedback.improve" :key="index">{{ item }}</li>
        </ul>
      </div>

      <button
        @click="$emit('close')"
        class="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors"
      >
        完成
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: Object,
    default: () => ({
      score: 0,
      summary: '',
      grammar: { trend: '', highlights: [] },
      pronunciation: { trend: '', highlights: [] },
      vocabulary: { words_learned: [] },
      improve: [],
      stages_completed: []
    })
  }
})

defineEmits(['close'])

const scoreStars = computed(() => {
  const score = props.feedback.score || 0
  const filled = Math.round(score / 20)
  return '⭐'.repeat(filled) + '☆'.repeat(5 - filled)
})
</script>
