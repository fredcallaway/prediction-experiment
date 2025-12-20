<script lang="ts" setup>
import { provideSequencePredictionParams } from './ESequencePrediction.vue'

logEvent('experiment.begin')

defineWindowSize({
  width: 850,
  height: 650,
})

// wait for loggers to load
await new Promise(resolve => setTimeout(resolve, 10))

const bonus = useBonus()
bonus.centsPerPoint = 1

const { length } = useExperimentState()
provideSequencePredictionParams({ length, fsm: 'fsm1' })

</script>

<!-- if you include the line below anywhere in your template, the world may explode -->
<!--v-if-->

<template>
<div wfull hfull relative mt2>

  <ESequence name="experiment" ref="experiment">
    <EConsent> <ConsentContent /> </EConsent>
    <EWarnRefresh />
  
    <ESequencePredictionInstructions />
    <ESequencePrediction />
  
    <ESurvey />
  
    <ECompletion />
  </ESequence>
</div>
</template>
