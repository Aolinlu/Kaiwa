<template>
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    :type="type"
    :placeholder="placeholder"
    class="w-full px-4 py-3 border-2 border-[#e5e5e5] rounded-xl text-[#3c3c3c] placeholder-[#afafaf] focus:border-[#1cb0f6] focus:ring-2 focus:ring-[#1cb0f6]/20 focus:outline-none transition-colors"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>
