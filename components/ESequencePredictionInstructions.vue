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

</script>

<template>
  <div wfull flex-center>
    <ESequencePrediction v-if="showGame" disabled />

    <div wfull flex-center text-center t5>
      <ESequence name="instructions">
    
        <EButtons name="first" values="Yes">
          Want to play a game? It's a fun one!
        </EButtons>
    
        <EPage @mounted="(epoch) => {
          showGame = true
          hooks.afterChoice.receive((state) => {
            state.target = state.prediction!
            epoch.done()
          })
        }">
          Pick a side: F (left) or J (right)
        </EPage>

        <EWait :until="() => hooks.afterFeedback.receive()" />
        
        <EContinue delay=1000>
          You found a coin!
        </EContinue>

        <EContinue delay=1000 >
          Each coin is worth <span text-green-500 font-bold>{{ bonus.centsPerPoint }} cents!</span>
          <Arrow text-green-500 x=200 y=-18 length=70 rot=5 inset-0/>
        </EContinue>
        
        <EPage @mounted="(epoch) => {
          hooks.afterChoice.receive((state) => {
            state.target = !state.prediction!
            epoch.done()
          })
        }">
          Try again! (F or J)
        </EPage>

        <EWait :until="() => hooks.afterFeedback.receive()" />

        <EContinue delay=1000>
          Dang, wrong side...
        </EContinue>

        <EContinue name="final" button delay=3000 w120 >
          That's it! On each round, we put the coin on one of the sides. 
          If you guess which side it's on, you get five cents.
          Good luck!

        </EContinue>
      </ESequence>
    </div>
  </div>
</template>
