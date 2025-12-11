<script lang="ts" setup>
import { hooks } from './ESequencePrediction.vue'
const { sleep } = useLocalAsync()

const prompt = ref('Pick a side: LEFT or RIGHT')

onMounted(async () => {
  await hooks.afterChoice.receive(async (state) => {
    state.target = state.prediction!
    prompt.value = 'You found a coin!'
  })
  await sleep(2000)
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
    <ESequencePrediction
      :params="{ length: 2 }"
    />
  </div>
</template>
