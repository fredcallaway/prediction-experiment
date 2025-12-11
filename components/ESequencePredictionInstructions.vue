<script lang="ts" setup>
import { hooks, provideSequencePredictionParams } from './ESequencePrediction.vue'
const { sleep } = useLocalAsync()

const E = useEpoch('Instructions')

provideSequencePredictionParams({
  length: 2,
  feedbackInTime: 2000,
})

const prompt = ref('Pick a side: LEFT or RIGHT')

const showGame = ref(true)
const bonus = useBonus()

onMounted(async () => {
  prompt.value = 'Want to play a game?'
  await until(showGame).toBe(true)

  prompt.value = 'Pick a side: F (left) or J (right)'
  await hooks.afterChoice.receive(async (state) => {
    state.target = state.prediction!
    prompt.value = `You found a coin! Each coin is worth ${bonus.centsPerPoint} cents.`
  })
  await sleep(2500)
  prompt.value = 'Try again!'

  await hooks.afterChoice.receive(async (state) => {
    state.target = !state.prediction!
    prompt.value = 'Dang, wrong side...'
  })
})

</script>

<template>
  <div>
    <div text-xl text-center t0 wfull pt13>{{ prompt }}</div>
    <div v-if="!showGame" wfull flex-center t10>
      <PButton value="Yes" @click="showGame = true" />
    </div>
    <ESequencePrediction v-else />
  </div>
</template>
