<template>
  <div class="min-h-screen bg-gray-50">
    <ScenarioPage v-if="!currentScenario" @select="startScenario" />
    <ConversationPage
      v-else
      :scenario="currentScenario"
      @finish="finishSession"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ScenarioPage from './pages/ScenarioPage.vue'
import ConversationPage from './pages/ConversationPage.vue'

const currentScenario = ref(null)

function startScenario(scenario) {
  currentScenario.value = scenario
}

function finishSession() {
  currentScenario.value = null
}
</script>
