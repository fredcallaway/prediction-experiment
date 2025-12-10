<script lang="ts">

export const [provideSequencePredictionParams, useSequencePredictionParams, ProvideSequencePredictionParams] = defineParams({
  length: 10,
  pRight: random.uniform(0, 1),
  outlineTime: 500,
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
const { length, pRight, outlineTime, feedbackTime, waitTime } = useSequencePredictionParams(props.params)

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

const arrowClass = (sideIsRight: boolean) => {
  if (state.stage === 'choice') {
    return 'opacity-100'
  }

  if (state.stage === 'selected' || state.stage === 'feedback') {
    if (state.prediction === sideIsRight) {
      return 'opacity-100'
    }
    return 'opacity-20'
  }

  return 'opacity-0'
}

const questionClass = () => {
  if (state.stage === 'choice') {
    return 'opacity-100'
  }
  if (state.stage === 'selected') {
    return 'opacity-0'
  }
  return 'opacity-0'
}

const squareClass = () => {
  if (state.stage === 'waiting') {
    return ['opacity-0', 'translate-x-0']
  }

  if (state.stage === 'feedback') {
    return [
      state.target ? 'translate-x-24' : '-translate-x-24',
      'opacity-0',
    ]
  }

  return ['translate-x-0', 'opacity-100']
}

onMounted(async () => {
  for (let i = 0; i < sequence.length; i += 1) {
    state.index = i
    state.target = sequence[i]
    state.prediction = null
    state.correct = null
    state.stage = 'waiting'
    await sleep(waitTime)
    
    state.stage = 'choice'
    const response = await P.promiseKeyPress(['LEFT', 'RIGHT'])
    const prediction = response.key === 'RIGHT'
    state.prediction = prediction
    
    state.stage = 'selected'
    await sleep(outlineTime)

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
  }
  E.done()
})

const bonus = useBonus()

</script>

<template>
  <div inset-0 relative>
    <div font-bold>
      Bonus: ${{ bonus.dollars.toFixed(2) }}
    </div>
    
    <div class="wfull h100 flex items-center justify-center border">
      <div class="relative w-80 h-40 flex items-center justify-center overflow-hidden">
        <div
          class="absolute w-28 h-28 bg-gray flex items-center justify-center gap-2 rounded-sm text-4xl text-white transition-all duration-700 pointer-events-none"
          :class="squareClass()"
        >
          <div i-mdi-arrow-left-bold :class="arrowClass(false)" />
          <div i-mdi-question-mark :class="questionClass()" />
          <div i-mdi-arrow-right-bold :class="arrowClass(true)" />
        </div>
      </div>
    </div>

  </div>
</template>
