<script lang="ts" setup>
import { hooks, provideSequencePredictionParams } from './ESequencePrediction.vue'
const { sleep } = useLocalAsync()

provideSequencePredictionParams({
  length: 2,
  feedbackInTime: 1000,
})

const currentEpoch = useCurrentEpoch()
const showGame = computed(() => !R.isIncludedIn(currentEpoch.value._name, ['first', 'final']))
const bonus = useBonus()
const { length } = useExperimentState()

// locking input in the task component
const paused = ref(false)
const unpaused = () => until(paused).toBe(false)

useInspect({paused})

</script>

<template>
  <div wfull flex-center text-lg>
    <ESequencePrediction v-if="showGame" disabled />

    <div wfull flex-center text-center t5>
      <ESequence name="instructions">
    
        <EButtons name="first" values="Yes Definitely" >
          Want to play a game? It's a fun one!
        </EButtons>
    
        <EPage @mounted="(epoch) => {
          showGame = true
          hooks.afterChoice.receive((state) => {
            state.target = state.prediction!
            epoch.done()
          })
        }">
          Pick a side: left <Key>F</Key> or right <Key>J</Key>
        </EPage>

        <EWait :until="() => {
          // pause before the next choice
          hooks.beforeChoice.receive(async () => {
            paused = true
            await unpaused()
          })
          // continue to next page when feedback comes (happens first)
          return hooks.afterFeedback.receive()
        }" />
        
        <EContinue delay=1000>
          You found a coin!
        </EContinue>

        <EContinue delay=1000 >
          Each coin is worth <span text-green-500 font-bold>{{ bonus.centsPerPoint }} cents!</span>
          <Arrow text-green-500 x=220 y=-18 length=70 rot=5 inset-0/>
        </EContinue>
        
        <EPage @mounted="(epoch) => {
          paused = false
          hooks.afterChoice.receive((state) => {
            state.target = !state.prediction!
            epoch.done()
          })
        }">
          Try again! (<Key>F</Key> or <Key>J</Key>)
        </EPage>

        <EWait :until="() => hooks.afterFeedback.receive()" />

        <EContinue delay=1000>
          Dang, wrong side...
        </EContinue>

        <EContinue name="final" button delay=3000 w120 >
          That's it! On each round, we put the coin on one of the sides. 
          If you guess which side it's on, you get five cents.
          <br><br>
          There will {{ length }} rounds. Good luck!
        </EContinue>
      </ESequence>
    </div>
  </div>
</template>
