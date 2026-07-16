<template>
  <div class="w-full bg-[#e5e5e5] rounded-full overflow-hidden" :style="{ height: height + 'px' }">
    <div
      class="h-full rounded-full transition-all duration-300 ease-out"
      :class="colorClass"
      :style="{ width: percentage + '%' }"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  height: { type: Number, default: 16 },
  color: { type: String, default: 'green' },
})

const percentage = computed(() => Math.min(100, (props.value / props.max) * 100))

const colorClass = computed(() => {
  const map = {
    green: 'bg-[#58cc02]',
    orange: 'bg-[#ff9600]',
    blue: 'bg-[#1cb0f6]',
  }
  return map[props.color] || map.green
})
</script>
