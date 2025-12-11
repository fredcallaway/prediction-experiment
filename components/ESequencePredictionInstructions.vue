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

const { initialPoints } = useExperimentState()

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
          Wrong side! That means you lose {{ bonus.centsPerPoint }} cents 😕.
          <Arrow text-red-500 x=200 y=-18 length=70 rot=5 inset-0/>
        </EContinue>

        <EContinue name="final" button delay=3000 w120>
          <OnMounted :fn="() => bonus.points = initialPoints" />
          That's it! On each round, we put the coin on one of the sides. 
          If you guess which side it's on, you get five cents. 
          If you guess wrong, you lose five cents.
          <br><br>
          We'll start you off with {{ bonus.dollarsString }}.

        </EContinue>
      </ESequence>
    </div>
  </div>
</template>
