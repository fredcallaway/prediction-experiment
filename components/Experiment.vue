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

// // hesitant-alternator
// const fsm = new FSM({
//   transition: [[0.95, 0.05], [0.05, 0.95]],
//   emission: [0.15, 0.85],
//   initial: [0., 1.],
// })
// const sequence = repeatedly(50, (i) => fsm.step())
// console.log('experiment.sequence', sequence.map(x => x ? 'X' : 'O').join(''))
// 
// // oddball-sticky
// const fsm = new FSM({
//   transition: [[0.1, 0.9], [0.9, 0.1]],
//   emission: [0., 1.],
//   initial: [1., 0.],
// })
  

const { fsm } = useConditions().choice({fsm: ['hesitant-alternator', 'oddball-sticky'] as const})
const sequence = {
  'hesitant-alternator': 'OXOXOXOXOXOXOXXOXOXXOXOXOXOOXOXOXOXOXOXOXOXOXOXXOX',
  'oddball-sticky': 'OOOOXOOOOOOOXOOOOOXXXXXOXOXOXXXXXXXXXOXXXXOOOOXOOO',
}[fsm].split('').map(x => x === 'X')

const { length } = useExperimentState()
provideSequencePredictionParams({ length, fsm: sequence })

</script>

<!-- if you include the line below anywhere in your template, the world may explode -->
<!--v-if-->

<template>
<div wfull hfull relative mt2>

  <ESequence name="experiment" ref="experiment">
    <EConsent> <ConsentContent /> </EConsent>
  
    <ESequencePredictionInstructions />
    <EConnectionCheck />
    <ENoReturn mt-30 />
    
    <ESequencePrediction />
    <ESurvey />
    <ECompletion />
  </ESequence>
</div>
</template>
