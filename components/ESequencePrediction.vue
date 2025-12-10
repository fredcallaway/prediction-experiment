<script lang="ts">

export const [provideSequencePredictionParams, useSequencePredictionParams, ProvideSequencePredictionParams] = defineParams({
  length: 2,
  pRight: random.uniform(0, 1),
  selectionTime: 500,
  feedbackTime: 500,
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
const { length, pRight, selectionTime, feedbackTime, waitTime } = useSequencePredictionParams(props.params)

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
  stage: 'waiting' as 'waiting' | 'choice' |'selected' | 'feedback',
  target: initialTarget,
  prediction: null as null | boolean,
  correct: null as null | boolean,
})
useInspect(state)

const arrowTransitionStyle = { transitionDuration: `${selectionTime}ms` }
const squareTransitionStyle = { transitionDuration: `${feedbackTime}ms` }

const arrowClass = (sideIsRight: boolean) => {
  if (state.stage === 'choice') {
    return 'opacity-20 bg-white'
  }

  if (state.stage === 'selected' || state.stage === 'feedback') {
    if (state.prediction === sideIsRight) {
      // const color = state.correct ? 'bg-green' : 'bg-red'
      const color = 'bg-white'
      return ['opacity-100', color]
    }
    return 'opacity-20 bg-white'
  }

  return 'opacity-20 bg-white'
}

const squareClass = () => {
  if (state.stage === 'waiting') {
    return ['opacity-100', 'translate-x-0']
  }

  if (state.stage === 'feedback') {
    return [
      state.target ? 'translate-x-10' : '-translate-x-10',
      'opacity-100',
      state.correct ? 'bg-green' : 'bg-red',
    ]
  }

  return ['translate-x-0', 'opacity-100']
}

const globalOpacity = ref(0)

onMounted(async () => {
  await sleep(500)
  globalOpacity.value = 1
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
    await sleep(feedbackTime)

    logSequencePredictionTrial({
      index: i,
      target: state.target,
      prediction,
      correct,
      rt: response.rt,
    })

    state.stage = 'waiting'
    await sleep(waitTime)
  }

  globalOpacity.value = 0
  await sleep(2500)

  E.done()
})

const bonus = useBonus()

</script>

<template>
  <div inset-0 relative>
    <div font-bold text-lg>
      Bonus: ${{ bonus.dollars.toFixed(2) }}
    </div>
    
    <div class="wfull h100 flex items-center justify-center" transition-opacity duration-2000 :style="{ opacity: globalOpacity }">
      <div class="relative wfull hfull flex items-center justify-center overflow-hidden">
        <div
          class="absolute square-50 bg-gray flex items-center justify-center gap-2 rounded-sm transition-all pointer-events-none"
          :class="squareClass()"
          :style="squareTransitionStyle"
        >
          <div transition-all square-24 i-mdi-arrow-left-bold :class="arrowClass(false)" :style="arrowTransitionStyle" />
          <!-- <div square-10 i-mdi-question-mark :class="questionClass()" /> -->
          <div transition-all square-24 i-mdi-arrow-right-bold :class="arrowClass(true)" :style="arrowTransitionStyle" />
        </div>
      </div>
    </div>

  </div>
</template>
