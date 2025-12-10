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

const outlineClass = (sideIsRight: boolean) => {
  if (state.prediction === sideIsRight) {
    return (
      state.stage === 'selected' ? 'border-gray-500' 
      : state.correct ? 'border-green-500' 
      : 'border-red-500'
    )
  }
  return 'border-transparent'
}

const boxClass = (sideIsRight: boolean) => {
  const isTarget = state.target === sideIsRight

  if (state.stage === 'feedback' && isTarget) {
    return ['bg-gray-900']
  }

  return ['bg-transparent']
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
      <div class="flex items-center justify-around w150" >
        <div v-for="sideIsRight in [false, true]" class="p-2 transition-colors duration-150 border-4" :class="outlineClass(sideIsRight)">
          <div class="w-28 h-28 transition-colors duration-150" :class="boxClass(sideIsRight)" />
        </div>
      </div>
    </div>

    <div wfull hfull flex-center inset-0 absolute>
      <div transition-opacity duration-100 w28 h28 bg-gray flex-center text-4xl text-white :class="state.stage === 'choice' ? 'opacity-100' : 'opacity-0'" >
        <div i-mdi-arrow-left-bold />
        <div i-mdi-question-mark />
        <div i-mdi-arrow-right-bold />
      </div>
    </div>

  </div>
</template>
