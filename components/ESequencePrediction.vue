<script lang="ts">

export const [provideSequencePredictionParams, useSequencePredictionParams, ProvideSequencePredictionParams] = defineParams({
  length: 50,
  pRight: random.uniform(0, 1),
  selectionTime: 300,
  feedbackInTime: 500,
  feedbackOutTime: 300,
  waitTime: 500,
})

type SequencePredictionParams = ReturnType<typeof useSequencePredictionParams>

type SequencePredictionTrial = {
  index: number
  target: boolean
  prediction: boolean
  correct: boolean
  rt: number
}

const [logSequencePredictionTrial, isSequencePredictionTrial] = declareEventLogger<SequencePredictionTrial>('SequencePrediction.trial')

declareDataView('SequencePrediction', (sessionData: SessionData) => {
  const events = sessionData.events.filter(isSequencePredictionTrial)
  return events.map(e => {
    const [ , block, trial ] = e.currentEpochId.match(/(\w+)\[(\d+)\]-SequencePrediction/)!

    return {
      block,
      trial,
      target: e.data.target,
      prediction: e.data.prediction,
      correct: e.data.correct,
      rt: e.data.rt,
    }
  })
})

</script>

<script lang="ts" setup>

const props = defineProps<{ params?: Partial<SequencePredictionParams> }>()
const { length, pRight, selectionTime, feedbackInTime, feedbackOutTime, waitTime } = useSequencePredictionParams(props.params)

const E = useEpoch('SequencePrediction')
const { sleep } = useLocalAsync()
const P = useParticipant()

if (!Number.isInteger(length) || length <= 0) {
  throw new Error('SequencePrediction length must be a positive integer')
}
if (pRight < 0 || pRight > 1) {
  throw new Error('SequencePrediction pRight must be between 0 and 1')
}

const sequence = Array.from({ length }, () => Math.random() < pRight)
if (sequence.length === 0) {
  throw new Error('SequencePrediction sequence length must be positive')
}
const initialTarget = sequence[0]

const state = reactive({
  index: 0,
  stage: 'waiting' as 'waiting' | 'choice' | 'selected' | 'feedback' | 'feedback2',
  target: initialTarget,
  prediction: null as null | boolean,
  correct: null as null | boolean,
})
useInspect(state)

const boxClass = (sideIsRight: boolean) => {
  if (state.prediction === sideIsRight) {
    return 'bg-blue-800'
  } else {
    return 'bg-gray'
  }
}

const globalOpacity = ref(0)

onMounted(async () => {
  await sleep(100)
  state.stage = 'waiting'
  globalOpacity.value = 1
  await sleep(1000)
  
  for (let i = 0; i < sequence.length; i += 1) {
    state.index = i
    state.target = sequence[i]
    state.prediction = null
    state.correct = null
    
    state.stage = 'choice'
    const response = await P.promiseKeyPress(['LEFT', 'RIGHT'])
    const prediction = response.key === 'RIGHT'
    state.prediction = prediction
    
    state.stage = 'selected'
    await sleep(selectionTime)

    const correct = prediction === state.target
    state.correct = correct
    if (correct) {
      bonus.addPoints(1)
    }
    state.stage = 'feedback'
    await sleep(feedbackInTime)
    state.stage = 'feedback2'
    await sleep(feedbackOutTime)

    logSequencePredictionTrial({
      index: i,
      target: state.target,
      prediction,
      correct,
      rt: response.rt,
    })

    // state.stage = 'waiting'
    // await sleep(waitTime)
  }
  state.stage = 'waiting'
  globalOpacity.value = 0
  await sleep(1500)

  E.done()
})

const bonus = useBonus()

</script>

<template>
  <div inset-0 relative>
    <div font-bold text-lg>
      Bonus: ${{ bonus.dollars.toFixed(2) }}
    </div>
      
    <div class="wfull h100 flex items-center justify-center" transition-opacity duration-1000 :style="{ opacity: globalOpacity }">
      <div class="flex items-center justify-around w150" >
        <div v-for="sideIsRight in [false, true]" 
          class="square-50 transition-colors duration-200 flex-center" 
          :class="boxClass(sideIsRight)" 
        >

          <div circle-30 bg-black flex-center v-if="state.stage.startsWith('feedback') && state.target === sideIsRight" :class="
            state.stage === 'feedback'
              ? ('animate-fade-in')
              : state.stage === 'feedback2'
                ? (state.correct ? 'animate-fade-out-up' : 'animate-rotate-out-down-left')
                : ''
          " :style="{ animationDuration: `${(state.stage === 'feedback' ? 100 : feedbackOutTime)+30}ms` }" >
            <div i-mdi-coin bg-amber wfull hfull />
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
