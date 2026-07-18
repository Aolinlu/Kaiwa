<template>
  <div class="flex flex-col items-center gap-1.5">
    <button
      @mousedown="startRecording"
      @mouseup="stopRecording"
      @mouseleave="stopRecording"
      @touchstart.prevent="startRecording"
      @touchend.prevent="stopRecording"
      :class="[
        'relative', 'w-20', 'h-20', 'rounded-full', 'flex', 'items-center', 'justify-center',
        'text-3xl', 'transition-all', 'duration-200', 'select-none', 'shadow-paper',
        isRecording
          ? 'bg-shu-500 scale-110 shadow-paper-lg'
          : 'bg-ai-600 hover:bg-ai-500 hover:-translate-y-0.5 hover:shadow-paper-lg active:translate-y-0'
      ]"
      :disabled="disabled"
    >
      <span
        v-if="isRecording"
        class="absolute inset-0 rounded-full bg-shu-500 animate-ping opacity-40"
      ></span>
      <span class="relative">🎤</span>
    </button>
    <div class="text-xs tracking-wide" :class="isRecording ? 'text-shu-500 font-bold' : 'text-sumi-500'">
      {{ isRecording ? '録音中…' : '長押しで話す' }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['recording-complete'])

const isRecording = ref(false)
let mediaRecorder = null
let audioChunks = []

async function startRecording() {
  if (props.disabled) return
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // Check supported MIME types
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'
    
    console.log('Using MIME type:', mimeType)
    mediaRecorder = new MediaRecorder(stream, { mimeType })
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      console.log('Audio chunk size:', event.data.size)
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: mimeType })
      console.log('Final audio blob size:', audioBlob.size, 'type:', audioBlob.type)
      emit('recording-complete', audioBlob)
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start()
    isRecording.value = true
  } catch (error) {
    console.error('Recording error:', error)
    alert('请允许麦克风权限以使用语音功能')
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
  }
}
</script>
