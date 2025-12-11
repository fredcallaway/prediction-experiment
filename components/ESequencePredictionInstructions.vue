<script lang="ts" setup>
const P = useParticipant()

const prompt = ref('Pick a side: LEFT or RIGHT')

let trial = 0

const afterChoice = async (state: { target: boolean; prediction: boolean | null }) => {
  if (trial === 0) {
    state.target = state.prediction!
    prompt.value = 'You found a coin!'
  } else {
    state.target = !state.prediction!
    prompt.value = 'Dang, wrong side...'
  }
}

const afterFeedback = async (state: { target: boolean; prediction: boolean | null }) => {
  prompt.value = 'Try again!'
}

</script>

<template>
  <div>
    <div text-xl text-center t0 wfull pt13>{{ prompt }}</div>
    <ESequencePrediction
      :params="{ length: 2 }"
      :after-choice="afterChoice"
      :after-feedback="afterFeedback"
    />
  </div>
</template>
