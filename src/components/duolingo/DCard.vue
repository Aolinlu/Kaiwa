<template>
  <div
    :class="[
      'bg-white border-2 border-[#e5e5e5] border-b-4 rounded-2xl p-4 transition-all duration-200',
      { 'hover:-translate-y-0.5 hover:shadow-md': hoverable }
    ]"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  hoverable: { type: Boolean, default: false },
})
</script>
