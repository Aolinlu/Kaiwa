<template>
  <div v-if="hint" class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
    <div class="flex items-start gap-3">
      <div class="text-2xl">💡</div>
      <div class="flex-1">
        <div class="text-sm text-gray-500 mb-2">可以这样回复：</div>
        <div class="text-lg font-medium text-gray-800 mb-2">{{ hint }}</div>
        <div v-if="reading" class="text-sm text-gray-600 mb-1">
          <span class="mr-2">📖</span>
          <span>{{ reading }}</span>
        </div>
        <div v-if="translation" class="text-sm text-gray-500 mb-3">
          <span class="mr-2">🇨🇳</span>
          <span>{{ translation }}</span>
        </div>
        <button
          @click="playHint"
          class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          🔊 Listen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { SpeechService } from '../services/SpeechService.js'

const props = defineProps({
  hint: {
    type: String,
    default: ''
  },
  reading: {
    type: String,
    default: ''
  },
  translation: {
    type: String,
    default: ''
  }
})

async function playHint() {
  if (props.hint) {
    await SpeechService.speak(props.hint)
  }
}
</script>
