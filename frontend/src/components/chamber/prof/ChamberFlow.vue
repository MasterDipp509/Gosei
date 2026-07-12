<script setup>
import {
  computed,
  watch
} from 'vue'

import { useRoute } from 'vue-router'

import { useChamberStore } from '@/stores/chamber.js'


const props = defineProps({
  selectionComponent: {
    type: [Object, Function],
    required: true
  },

  calibrationComponent: {
    type: [Object, Function],
    required: true
  },

  discussionComponent: {
    type: [Object, Function],
    required: true
  }
})


const route = useRoute()

const chamber = useChamberStore()


const componentMap = computed(() => ({
  selection:
  props.selectionComponent,

  calibration:
  props.calibrationComponent,

  discussion:
  props.discussionComponent
}))


const currentComponent = computed(() =>
    componentMap.value[
        chamber.phase
        ]
)


const transitionName = computed(() =>
    chamber.transitionDirection ===
    'backward'
        ? 'chamber-backward'
        : 'chamber-forward'
)


const currentProps = computed(() => {
  if (
      chamber.phase ===
      'selection'
  ) {
    return {
      step:
      chamber.selectionStep,

      activeSession:
      chamber.activeSession,

      resumableSessions:
      chamber.resumableSessions
    }
  }


  if (
      chamber.phase ===
      'calibration'
  ) {
    return {
      session:
      chamber.activeSession,

      councilMode:
      chamber.councilMode,

      existingCalibration:
      chamber.calibration
    }
  }


  return {
    session:
    chamber.activeSession,

    councilMode:
    chamber.councilMode,

    calibration:
    chamber.calibration,

    discussion:
    chamber.discussion
  }
})


const currentListeners = computed(() => {
  if (
      chamber.phase ===
      'selection'
  ) {
    return {
      'new-session':
      chamber.openNewSessionSelection,

      'selection-back':
      chamber.returnToEntrySelection,

      'start-session':
      chamber.beginNewSession,

      'continue-session':
      chamber.continueSession
    }
  }


  if (
      chamber.phase ===
      'calibration'
  ) {
    return {
      complete:
      chamber.completeCalibration,

      back:
      chamber.returnFromCalibration
    }
  }


  return {
    'update-discussion':
    chamber.updateDiscussion,

    'end-session':
    chamber.endSession
  }
})


watch(
    () => [
      route.query.session,
      chamber.resumableSessions.length
    ],

    ([sessionId]) => {
      if (!sessionId) {
        return
      }

      if (
          String(
              chamber.activeSession?.id
          ) === String(sessionId)
      ) {
        return
      }

      chamber.continueSession(
          String(sessionId)
      )
    },

    {
      immediate: true
    }
)
</script>


<template>
  <main class="chamber-flow">

    <div class="chamber-stage">

      <Transition
          :name="transitionName"
      >

        <div
            :key="chamber.phase"
            class="chamber-stage__layer"
        >

          <component
              :is="currentComponent"
              v-bind="currentProps"
              v-on="currentListeners"
          />

        </div>

      </Transition>

    </div>

  </main>
</template>


<style scoped>
.chamber-flow {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;
}


.chamber-stage {
  position: relative;

  width: 100%;
  height: 100%;

  overflow: hidden;

  isolation: isolate;
}


.chamber-stage__layer {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;
}


/* FORWARD */

.chamber-forward-enter-active,
.chamber-forward-leave-active {
  transition:
      opacity 280ms ease,
      transform 420ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      filter 300ms ease;
}


.chamber-forward-enter-from {
  opacity: 0;

  transform:
      translateX(2.2rem)
      scale(0.992);

  filter: blur(3px);
}


.chamber-forward-leave-to {
  opacity: 0;

  transform:
      translateX(-1.4rem)
      scale(0.996);

  filter: blur(2px);
}


.chamber-forward-enter-to,
.chamber-forward-leave-from {
  opacity: 1;

  transform:
      translateX(0)
      scale(1);

  filter: blur(0);
}


/* BACKWARD */

.chamber-backward-enter-active,
.chamber-backward-leave-active {
  transition:
      opacity 280ms ease,
      transform 420ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      filter 300ms ease;
}


.chamber-backward-enter-from {
  opacity: 0;

  transform:
      translateX(-2.2rem)
      scale(0.992);

  filter: blur(3px);
}


.chamber-backward-leave-to {
  opacity: 0;

  transform:
      translateX(1.4rem)
      scale(0.996);

  filter: blur(2px);
}


.chamber-backward-enter-to,
.chamber-backward-leave-from {
  opacity: 1;

  transform:
      translateX(0)
      scale(1);

  filter: blur(0);
}


.chamber-forward-leave-active,
.chamber-backward-leave-active {
  pointer-events: none;
}


@media (
prefers-reduced-motion:
    reduce
) {

  .chamber-forward-enter-active,
  .chamber-forward-leave-active,
  .chamber-backward-enter-active,
  .chamber-backward-leave-active {
    transition:
        opacity 120ms ease;
  }


  .chamber-forward-enter-from,
  .chamber-forward-leave-to,
  .chamber-backward-enter-from,
  .chamber-backward-leave-to {
    transform: none;

    filter: none;
  }
}
</style>
