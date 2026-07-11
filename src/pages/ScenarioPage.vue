<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <div class="max-w-2xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">KaiWa</h1>
        <p class="text-gray-500">选择一个场景开始练习</p>
      </div>

      <div class="grid gap-4">
        <button
          v-for="scenario in scenarios"
          :key="scenario.id"
          @click="$emit('select', scenario)"
          class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
        >
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-semibold text-gray-800">{{ scenario.title }}</h2>
            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              {{ scenario.difficulty }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mb-1">{{ scenario.titleCn }}</p>
          <p class="text-sm text-gray-600">{{ scenario.goalCn }}</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { SCENARIOS } from '../config/scenarios.js'

defineEmits(['select'])

const scenarios = SCENARIOS
</script>
