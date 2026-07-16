<template>
  <button
    :class="[
      'inline-flex items-center justify-center font-extrabold rounded-2xl transition-all duration-150 select-none',
      'active:translate-y-[3px] active:border-b-0',
      variantClasses,
      sizeClasses,
      { 'opacity-50 cursor-not-allowed': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
})

defineEmits(['click'])

const variantClasses = computed(() => {
  const map = {
    primary: 'bg-[#58cc02] text-white border-b-4 border-[#58a700] hover:bg-[#89e219]',
    secondary: 'bg-white text-[#777777] border-2 border-[#e5e5e5] border-b-4 hover:text-[#3c3c3c] hover:border-[#afafaf]',
    danger: 'bg-[#ff4b4b] text-white border-b-4 border-[#cc3b3b] hover:bg-[#ff6b6b]',
    accent: 'bg-[#ff9600] text-white border-b-4 border-[#cc7a00] hover:bg-[#ffaa33]',
  }
  return map[props.variant] || map.primary
})

const sizeClasses = computed(() => {
  const map = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  return map[props.size] || map.md
})
</script>
