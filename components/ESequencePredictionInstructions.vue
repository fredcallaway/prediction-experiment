<script lang="ts" setup>
const P = useParticipant()

const prompt = ref('Pick a side: LEFT or RIGHT')

const afterChoice = async (state: { target: boolean; prediction: boolean | null }) => {
  state.target = state.prediction!
  prompt.value = 'You found a coin!'
  // highlight change to bonus
  await P.promiseKeyPress(['SPACE'])

}

</script>

<template>
  <div>
    <div text-xl text-center min-h-8>{{ prompt }}</div>
    <ESequencePrediction
      :params="{ length: 1 }"
      :after-choice="afterChoice"
    />
  </div>
</template>
