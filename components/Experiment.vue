<script lang="ts" setup>

logEvent('experiment.begin')

defineWindowSize({
  width: 850,
  height: 650,
})

// wait for loggers to load
await new Promise(resolve => setTimeout(resolve, 10))

const bonus = useBonus()
bonus.centsPerPoint = 5

const colors = ['orange', 'blue'] as const  // `as const` allows typescript to confirm these colors are supported by PButton
const trials = random.shuffle(repeat(colors, 2)).map(color => ({color}))
const correct = ref(false)

</script>

<!-- if you include the line below anywhere in your template, the world may explode -->
<!--v-if-->

<template>
<div mt-10px w800px relative>

  <ESequence name="experiment" ref="experiment">
    <EConsent> <ConsentContent /> </EConsent>

    <EButtons :values="['I will not refresh the page']" w-130 mx-auto mt-30 >
      <div card-yellow >
        <h3>Warning!</h3>
        Do not refresh the page or close the browser window during the experiment.
        If you do, you will not be able to complete the study!
      </div>
    </EButtons>
  
    <ESequencePredictionInstructions />
    <ESequencePrediction />
  
    <ESurvey />
  
    <ECompletion />
  </ESequence>
</div>
</template>

