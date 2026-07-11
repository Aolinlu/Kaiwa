<template>
  <div v-if="idea" class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
    <div class="flex items-start gap-3">
      <div class="text-2xl">💡</div>
      <div class="flex-1">
        <!-- Level A: Idea -->
        <div class="text-sm text-gray-500 mb-1">思路：</div>
        <div class="text-lg font-medium text-gray-800 mb-2">{{ idea }}</div>

        <!-- Level B: Keywords -->
        <template v-if="showKeywords">
          <div class="text-sm text-gray-500 mb-1 mt-3">关键词：</div>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="(kw, index) in keywords"
              :key="index"
              class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"
            >
              {{ kw }}
            </span>
          </div>
        </template>

        <!-- Level C: Sentence -->
        <template v-if="showSentence">
          <div class="text-sm text-gray-500 mb-1 mt-3">例句：</div>
          <div class="text-lg font-medium text-gray-800 mb-1">{{ sentence }}</div>
          <div v-if="sentenceReading" class="text-sm text-gray-600 mb-1">
            <span class="mr-2">📖</span>
            <span>{{ sentenceReading }}</span>
          </div>
          <div v-if="sentenceTranslation" class="text-sm text-gray-500 mb-3">
            <span class="mr-2">🇨🇳</span>
            <span>{{ sentenceTranslation }}</span>
          </div>
          <button
            @click="playHint"
            class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            🔊 Listen
          </button>
        </template>

        <!-- Expand button -->
        <button
          v-if="!showSentence"
          @click="expand"
          class="mt-3 text-sm text-yellow-700 hover:text-yellow-900 underline"
        >
          {{ showKeywords ? '显示完整例句 →' : '显示关键词 →' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { SpeechService } from '../services/SpeechService.js'

const props = defineProps({
  idea: {
    type: String,
    default: ''
  },
  keywords: {
    type: Array,
    default: () => []
  },
  sentence: {
    type: String,
    default: ''
  },
  sentenceReading: {
    type: String,
    default: ''
  },
  sentenceTranslation: {
    type: String,
    default: ''
  }
})

const showKeywords = ref(false)
const showSentence = ref(false)

function expand() {
  if (!showKeywords.value) {
    showKeywords.value = true
  } else {
    showSentence.value = true
  }
}

async function playHint() {
  if (props.sentence) {
    await SpeechService.speak(props.sentence)
  }
}
</script>
