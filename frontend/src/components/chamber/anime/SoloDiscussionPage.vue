<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

import {
  useProfileStore
} from '@/stores/profileStore.js'

import {
  useCurrentDiscussionStore
} from '@/stores/currentDiscussion.js'

import SoloMediatorSpeech
  from '@/components/chamber/anime/discussion/solo/SoloMediatorSpeech.vue'

import SoloReplyPanel
  from '@/components/chamber/anime/discussion/solo/SoloReplyPanel.vue'

/* ==================================================
   PROPS / EMITS

   This page owns all solo-discussion presentation
   state and all store mutations.

   Future child components should only:

   - receive data through props
   - emit user intent upward
   - never call the discussion store directly
================================================== */

const props = defineProps({

  session: {
    type: Object,
    default: null
  },


  councilMode: {
    type: String,
    default: 'mediator'
  },


  calibration: {
    type: Object,
    default: null
  },


  discussion: {
    type: Object,
    default: null
  }
})


const emit = defineEmits([
  'update-discussion',
  'end-session',
  'back'
])


/* ==================================================
   STORES
================================================== */

const profileStore =
    useProfileStore()


const currentDiscussionStore =
    useCurrentDiscussionStore()


/* ==================================================
   SMALL HELPERS
================================================== */

const toPlainValue = value => {

  if (
      value === undefined
      ||
      value === null
  ) {
    return value
  }


  return JSON.parse(
      JSON.stringify(value)
  )
}


const normalizeSessionId = sessionId => {

  if (
      sessionId === null
      ||
      sessionId === undefined
  ) {
    return null
  }


  const normalized =
      String(sessionId).trim()


  return normalized || null
}


const isDraftSessionId = sessionId => {

  const normalized =
      normalizeSessionId(sessionId)


  return Boolean(
      normalized
      &&
      normalized.startsWith('draft-')
  )
}


const isPersistedSessionId = sessionId => {

  const normalized =
      normalizeSessionId(sessionId)


  return Boolean(
      normalized
      &&
      !isDraftSessionId(normalized)
  )
}


const resolvePersistedSessionId = () => {

  const propSessionId =
      props.session?.id


  if (
      isPersistedSessionId(
          propSessionId
      )
  ) {
    return normalizeSessionId(
        propSessionId
    )
  }


  const storeSessionId =
      currentDiscussionStore.sessionId


  if (
      isPersistedSessionId(
          storeSessionId
      )
  ) {
    return normalizeSessionId(
        storeSessionId
    )
  }


  return null
}


const statementRoundNumber = statement => {

  if (
      !statement
      ||
      typeof statement === 'string'
  ) {
    return null
  }


  return (
      statement.roundNumber
      ??
      statement.round_number
      ??
      statement.round
      ??
      statement.metadata?.roundNumber
      ??
      statement.metadata?.round_number
      ??
      null
  )
}


const displayItemText = item => {

  if (
      typeof item === 'string'
  ) {
    return item
  }


  return (
      item?.title
      ??
      item?.label
      ??
      item?.text
      ??
      item?.description
      ??
      'Untitled item'
  )
}


/* ==================================================
   SCENE STATE
================================================== */

const discussionReady =
    ref(false)


const initializationError =
    ref(null)


const interfaceVisible =
    ref(false)


/*
  Reactive submission state.

  IMPORTANT:

  The promise itself remains a plain variable and is
  used only as an async duplicate-request guard.

  replySubmitting is the reactive UI state used by
  interactionLocked.

  This avoids the previous issue where the UI could
  remain permanently locked after the first reply.
*/

const replySubmitting =
    ref(false)


let discussionBootPromise =
    null


let roundGenerationPromise =
    null


let replySubmissionPromise =
    null


let sceneUnmounted =
    false


let revealTimer =
    null


/* ==================================================
   SESSION STATE
================================================== */

const discussionStatus = computed(() =>
    currentDiscussionStore.status
)


const sessionIsActive = computed(() =>
    discussionStatus.value === 'active'
)


const sessionIsPaused = computed(() =>
    discussionStatus.value === 'paused'
)


const sessionIsComplete = computed(() =>
    discussionStatus.value === 'completed'
    ||
    discussionStatus.value === 'abandoned'
)


/* ==================================================
   AUTHORITATIVE DISCUSSION STATE
================================================== */

const currentSection = computed(() =>
    currentDiscussionStore.currentSection
)


const currentRoundNumber = computed(() =>
    currentDiscussionStore.flow.currentRound
    ??
    1
)


const mediatorState = computed(() =>
    currentSection.value?.mediator
    ??
    null
)


/* ==================================================
   MEDIATOR PARTICIPANT

   Priority:

   1. discussion store snapshot
   2. session snapshot
   3. profile store fallback
================================================== */

const mediatorParticipant = computed(() => {

  const storeMediator =
      currentDiscussionStore
          .participants
          ?.mediator


  if (storeMediator) {
    return storeMediator
  }


  return (
      props.session?.mediator
      ??
      props.session?.mediatorSnapshot
      ??
      props.session?.mediator_snapshot
      ??
      profileStore.councilMediator
      ??
      profileStore.mediator
      ??
      null
  )
})


const mediatorName = computed(() =>
    mediatorParticipant.value?.name
    ??
    'The Mediator'
)


/*
  Keep the exact image path used by the supplied solo
  calibration scene.
*/

const mediatorImage = computed(() => {

  const id =
      mediatorParticipant.value?.id


  if (!id) {
    return ''
  }


  return (
      `/images/chamber/char/${id}/NeonOffice.png`
  )
})


/* ==================================================
   SOLO ROUND STATE

   Solo mode has no character-response requirement.

   A round is ready once the mediator has supplied
   the initial response for the active round.
================================================== */

const currentRoundComplete = computed(() =>
    currentDiscussionStore
        .mediatorHasCurrentRoundResponse
)


/*
  interactionLocked must depend only on reactive
  values.

  Do not use Boolean(replySubmissionPromise) here.

  replySubmissionPromise is intentionally non-reactive
  and would not trigger a computed refresh when cleared.
*/

const interactionLocked = computed(() =>
    !discussionReady.value
    ||
    !sessionIsActive.value
    ||
    !currentRoundComplete.value
    ||
    currentDiscussionStore.isBusy
    ||
    replySubmitting.value
)


/* ==================================================
   CURRENT MEDIATOR SPEECH

   Only the active round is shown when round metadata
   exists.

   If multiple mediator statements exist in the same
   round, the newest one is shown.

   This means:

   mediator initial response
       ↓
   user reply
       ↓
   mediator intervention
       ↓
   textbox automatically shows new response
================================================== */

const currentMediatorStatement = computed(() => {

  const statements =
      mediatorState.value?.statements
      ??
      []


  if (!statements.length) {
    return null
  }


  const roundNumber =
      Number(
          currentRoundNumber.value
      )


  const roundStatements =
      statements.filter(
          statement => {

            const statementRound =
                statementRoundNumber(
                    statement
                )


            return (
                statementRound !== null
                &&
                Number(statementRound) ===
                roundNumber
            )
          }
      )


  return (
      roundStatements.at(-1)
      ??
      statements.at(-1)
      ??
      null
  )
})


const mediatorSpeech = computed(() => {

  const statement =
      currentMediatorStatement.value


  if (
      typeof statement === 'string'
  ) {
    return statement
  }


  const statementText =
      statement?.content
      ??
      statement?.text
      ??
      statement?.statement
      ??
      statement?.message
      ??
      null


  if (statementText) {
    return statementText
  }


  if (
      currentDiscussionStore
          .isGeneratingMediator
  ) {
    return 'Thinking through your situation…'
  }


  return (
      mediatorState.value?.summary
      ??
      'Waiting for the mediator response.'
  )
})


/* ==================================================
   SUPPORT CONTENT FOR FUTURE CHILD COMPONENTS

   These are owned by this parent.

   Future components receive:

   actions-panel:
       :actions="suggestedActions"

   risks-panel:
       :risks="keyRisks"
================================================== */

const suggestedActions = computed(() =>
    mediatorState.value?.actions
    ??
    currentDiscussionStore.outcome?.actions
    ??
    []
)


const keyRisks = computed(() =>
    mediatorState.value?.risks
    ??
    currentDiscussionStore.outcome?.risks
    ??
    []
)


const selectedAction =
    ref(null)


const selectedRisk =
    ref(null)


const handleActionSelect = action => {

  selectedAction.value =
      action ?? null
}


const handleRiskSelect = risk => {

  selectedRisk.value =
      risk ?? null
}


/* ==================================================
   REPLY STATE

   SoloReplyPanel contract:

   props:
       modelValue
       reaction
       disabled
       busy
       roundNumber
       selectedAction
       selectedRisk

   emits:
       update:modelValue
       reaction
       submit
================================================== */

const replyText =
    ref('')


const selectedReaction =
    ref(null)


const setReplyText = value => {

  replyText.value =
      String(value ?? '')
}


const handleReaction = reaction => {

  if (
      reaction !== 'agree'
      &&
      reaction !== 'disagree'
  ) {

    selectedReaction.value =
        null

    return
  }


  selectedReaction.value =
      selectedReaction.value === reaction
          ? null
          : reaction
}


/* ==================================================
   PARENT UPDATE EVENT
================================================== */

const emitDiscussionUpdate = (
    reason,
    data = null
) => {

  emit(
      'update-discussion',

      {
        reason,


        data:
            toPlainValue(data),


        state: {

          sessionId:
          currentDiscussionStore.sessionId,


          status:
          currentDiscussionStore.status,


          flow:
              toPlainValue(
                  currentDiscussionStore.flow
              ),


          outcome:
              toPlainValue(
                  currentDiscussionStore.outcome
              )
        }
      }
  )
}


/* ==================================================
   DISCUSSION BOOTSTRAP

   Same core flow as the panel discussion page:

   persisted session ID
       ↓
   initialize store identity if needed
       ↓
   hydrate optional parent snapshot
       ↓
   loadDiscussion(sessionId)
       ↓
   authoritative discussion state ready
================================================== */

const initializeActiveDiscussion = async () => {

  const sessionId =
      resolvePersistedSessionId()


  if (!sessionId) {

    console.debug(
        '[SoloDiscussion] Waiting for persisted session ID.'
    )

    return null
  }


  if (discussionBootPromise) {
    return discussionBootPromise
  }


  discussionBootPromise = (
      async () => {

        initializationError.value =
            null


        try {

          const currentStoreSessionId =
              normalizeSessionId(
                  currentDiscussionStore.sessionId
              )


          if (
              !isPersistedSessionId(
                  currentStoreSessionId
              )
              ||
              String(currentStoreSessionId) !==
              String(sessionId)
          ) {

            currentDiscussionStore
                .initializeFromChamber({
                  sessionId
                })
          }


          if (props.discussion) {

            currentDiscussionStore
                .hydrate(
                    toPlainValue(
                        props.discussion
                    )
                )
          }


          const data =
              await currentDiscussionStore
                  .loadDiscussion(
                      sessionId
                  )


          if (sceneUnmounted) {
            return data
          }


          const currentSessionId =
              resolvePersistedSessionId()


          if (
              currentSessionId
              &&
              String(currentSessionId) !==
              String(sessionId)
          ) {
            return data
          }


          discussionReady.value =
              true


          emitDiscussionUpdate(
              'discussion-loaded',
              data
          )


          return data

        } catch (error) {

          initializationError.value =
              error


          discussionReady.value =
              false


          console.error(
              '[SoloDiscussion] Initialization failed:',
              error
          )


          throw error
        }
      }
  )()


  try {

    return await discussionBootPromise

  } finally {

    discussionBootPromise =
        null
  }
}


/* ==================================================
   SOLO ROUND GENERATION

   generateInitialRound() already works for solo mode:

   missing characters = []
       ↓
   mediator response requested

   We keep the same orchestration path as the panel
   page so backend/store behavior stays consistent.
================================================== */

const ensureCurrentRound = async () => {

  if (roundGenerationPromise) {
    return roundGenerationPromise
  }


  roundGenerationPromise = (
      async () => {

        if (!discussionReady.value) {

          await initializeActiveDiscussion()
        }


        if (
            !discussionReady.value
            ||
            !resolvePersistedSessionId()
            ||
            !sessionIsActive.value
            ||
            currentRoundComplete.value
        ) {
          return null
        }


        const roundNumber =
            Number(
                currentRoundNumber.value
            )


        const result =
            await currentDiscussionStore
                .generateInitialRound({

                  task:
                      roundNumber <= 1
                          ? 'initial_position'
                          : 'round_response',


                  mediatorResponseType:
                      'round_summary'
                })


        emitDiscussionUpdate(

            roundNumber <= 1
                ? 'initial-round-generated'
                : 'round-generated',

            result
        )


        return result
      }
  )()


  try {

    return await roundGenerationPromise

  } finally {

    roundGenerationPromise =
        null
  }
}


/* ==================================================
   SOLO REPLY SUBMIT

   Backend translation:

   AGREE
       ↓
   council_reply

   DISAGREE
       ↓
   opposing_view

   Both are stored against the current section.

   Then:

   user input stored
       ↓
   mediator intervention requested
       ↓
   store receives new mediator statement
       ↓
   speech box displays newest statement
       ↓
   replySubmitting becomes false
       ↓
   UI unlocks for next reply
================================================== */

const handleReplySubmit = async payload => {

  /*
    First guard is reactive UI state.

    Second guard protects against a second invocation
    occurring in the same event loop before Vue has
    refreshed the interface.
  */

  if (
      interactionLocked.value
      ||
      replySubmissionPromise
  ) {
    return null
  }


  const content = (
          typeof payload === 'string'
              ? payload
              : payload?.content
      )
      ??
      replyText.value


  const reaction =
      typeof payload === 'object'
          ? (
              payload?.reaction
              ??
              selectedReaction.value
          )
          : selectedReaction.value


  const cleanContent =
      String(content ?? '').trim()


  /*
    Nothing entered and no reaction selected.
  */

  if (
      !cleanContent
      &&
      !reaction
  ) {
    return null
  }


  /*
    Reaction-only submission fallback.
  */

  const fallbackContent =
      reaction === 'agree'
          ? 'I agree with your position.'

          : reaction === 'disagree'
              ? 'I disagree with your position.'

              : ''


  /*
    Translate solo interface reactions into the
    existing backend input types.

    Never send:

      mediator_reply
      mediator_agree_reply
      mediator_disagree_reply
  */

  const inputType =
      reaction === 'disagree'
          ? 'opposing_view'
          : 'council_reply'


  /*
    Set reactive loading state BEFORE beginning the
    asynchronous sequence.

    This immediately disables another submission.
  */

  replySubmitting.value =
      true


  replySubmissionPromise = (
      async () => {

        /* ==========================================
           STEP 1
           SAVE USER REPLY
        ========================================== */

        const inputData =
            await currentDiscussionStore
                .sendUserInput({

                  content:
                      cleanContent
                      ||
                      fallbackContent,


                  inputType,


                  targetType:
                      'section'
                })


        emitDiscussionUpdate(
            'mediator-reply-submitted',
            inputData
        )


        /* ==========================================
           STEP 2
           GENERATE MEDIATOR FOLLOW-UP

           This does not involve panel characters.

           The mediator responds directly using the
           current discussion context, including the
           newly submitted user input.
        ========================================== */

        const mediatorData =
            await currentDiscussionStore
                .requestMediatorResponse({

                  responseType:
                      'intervention'
                })


        /* ==========================================
           STEP 3
           CLEAR LOCAL INPUT STATE
        ========================================== */

        replyText.value =
            ''


        selectedReaction.value =
            null


        emitDiscussionUpdate(
            'mediator-follow-up-generated',
            mediatorData
        )


        return {

          input:
          inputData,


          mediator:
          mediatorData
        }
      }
  )()


  try {

    return await replySubmissionPromise

  } catch (error) {

    console.error(
        '[SoloDiscussion] Reply cycle failed:',
        error
    )


    throw error

  } finally {

    /*
      Clear the plain promise guard first.
    */

    replySubmissionPromise =
        null


    /*
      Then clear the reactive submission state.

      This causes interactionLocked to recompute after
      the promise guard has already been released.

      The reply interface can now accept another reply.
    */

    replySubmitting.value =
        false
  }
}


/* ==================================================
   NEXT ROUND

   Same responsibility split as the panel page:

   advance round
       ↓
   store applies new flow
       ↓
   generate mediator response for the new round
================================================== */

const handleNextRound = async () => {

  if (interactionLocked.value) {
    return null
  }


  const data =
      await currentDiscussionStore
          .advanceRound()


  selectedAction.value =
      null


  selectedRisk.value =
      null


  selectedReaction.value =
      null


  replyText.value =
      ''


  emitDiscussionUpdate(
      'round-advanced',
      data
  )


  await Promise.resolve()


  const generationResult =
      await ensureCurrentRound()


  return {

    transition:
    data,


    generation:
    generationResult
  }
}


/* ==================================================
   SESSION CONTROLS
================================================== */

const handlePauseSession = async () => {

  if (!sessionIsActive.value) {
    return null
  }


  const data =
      await currentDiscussionStore
          .pauseSession()


  emitDiscussionUpdate(
      'session-paused',
      data
  )


  return data
}


const handleResumeSession = async () => {

  if (!sessionIsPaused.value) {
    return null
  }


  const data =
      await currentDiscussionStore
          .resumeSession()


  emitDiscussionUpdate(
      'session-resumed',
      data
  )


  return data
}


const handleEndSession = async () => {

  if (sessionIsComplete.value) {
    return null
  }


  const data =
      await currentDiscussionStore
          .endSession()


  emitDiscussionUpdate(
      'session-ended',
      data
  )


  emit(
      'end-session',

      {

        sessionId:
        currentDiscussionStore.sessionId,


        status:
        currentDiscussionStore.status,


        outcome:
            toPlainValue(
                currentDiscussionStore.outcome
            ),


        data:
            toPlainValue(data)
      }
  )


  return data
}


const handleBack = () => {

  emit('back')
}


/* ==================================================
   RETRY
================================================== */

const retryDiscussion = async () => {

  currentDiscussionStore
      .clearError()


  initializationError.value =
      null


  await initializeActiveDiscussion()


  return ensureCurrentRound()
}


/* ==================================================
   EXTERNAL SNAPSHOT SYNC
================================================== */

watch(

    () => props.discussion,


    discussion => {

      if (!discussion) {
        return
      }


      currentDiscussionStore
          .hydrate(
              toPlainValue(discussion)
          )
    },


    {
      deep: true
    }
)


/* ==================================================
   SESSION CHANGE SYNC
================================================== */

watch(

    () => props.session?.id,


    async nextSessionId => {

      if (
          !isPersistedSessionId(
              nextSessionId
          )
      ) {
        return
      }


      const nextNormalized =
          normalizeSessionId(
              nextSessionId
          )


      const currentStoreSession =
          normalizeSessionId(
              currentDiscussionStore.sessionId
          )


      if (
          discussionReady.value
          &&
          currentStoreSession
          &&
          String(currentStoreSession) ===
          String(nextNormalized)
      ) {
        return
      }


      discussionReady.value =
          false


      roundGenerationPromise =
          null


      replySubmissionPromise =
          null


      /*
        Reset reactive submit state when moving between
        sessions so a previous session cannot leave the
        new interface locked.
      */

      replySubmitting.value =
          false


      selectedReaction.value =
          null


      replyText.value =
          ''


      try {

        await initializeActiveDiscussion()


        if (
            discussionReady.value
            &&
            sessionIsActive.value
            &&
            !currentRoundComplete.value
        ) {

          await ensureCurrentRound()
        }

      } catch (error) {

        console.error(
            '[SoloDiscussion] Session sync failed:',
            error
        )
      }
    }
)


/* ==================================================
   READY / REVEAL SYNC

   Bootstrap and visual reveal may finish in either
   order.

   The promise guard prevents duplicate round
   generation.
================================================== */

watch(

    [
      discussionReady,
      interfaceVisible
    ],


    ([ready, visible]) => {

      if (
          !ready
          ||
          !visible
          ||
          !sessionIsActive.value
          ||
          currentRoundComplete.value
      ) {
        return
      }


      void ensureCurrentRound()
          .catch(
              error => {

                console.error(
                    '[SoloDiscussion] Round generation failed:',
                    error
                )
              }
          )
    }
)


/* ==================================================
   MOUNT / CLEANUP
================================================== */

onMounted(() => {

  sceneUnmounted =
      false


  void initializeActiveDiscussion()
      .catch(
          error => {

            console.error(
                '[SoloDiscussion] Bootstrap failed:',
                error
            )
          }
      )


  revealTimer =
      window.setTimeout(

          () => {

            if (sceneUnmounted) {
              return
            }


            interfaceVisible.value =
                true
          },

          650
      )
})


onBeforeUnmount(() => {

  sceneUnmounted =
      true


  if (revealTimer) {

    window.clearTimeout(
        revealTimer
    )


    revealTimer =
        null
  }
})
</script>

<template>
  <section class="solo-discussion">

    <!-- ==================================================
         BACKGROUND

         Placement copied from the solo calibration scene.
    ================================================== -->

    <div class="chamber-bg"></div>

    <div class="chamber-vignette"></div>


    <!-- ==================================================
         SOLO SCENE

         Character and table use the same assembly and
         coordinates as the supplied calibration page.
    ================================================== -->

    <div class="scene-layer">

      <div class="scene-assembly">

        <div class="mediator-layer">

          <img
              v-if="mediatorImage"
              class="mediator-character"
              :src="mediatorImage"
              :alt="mediatorName"
          >

        </div>


        <img
            class="solo-table"
            src="/images/chamber/soloTable.png"
            alt=""
        >

      </div>

    </div>


    <!-- ==================================================
         BACK
    ================================================== -->

    <button
        class="page-back"
        type="button"
        @click="handleBack"
    >
      ← Back
    </button>


    <!-- ==================================================
         SOLO UI

         For now these are simple .panel placeholders.

         Each block already consumes parent-owned data and
         routes user intent through parent handlers so the
         markup can later be replaced by components without
         moving store/API logic into those components.
    ================================================== -->

    <div
        class="solo-ui"
        :class="{
          visible: interfaceVisible
        }"
    >

      <!-- ================================================
           ACTIONS PLACEHOLDER

           Future component:

           <SoloActionsPanel
             :actions="suggestedActions"
             :selected="selectedAction"
             :loading="currentDiscussionStore.isGeneratingMediator"
             :disabled="interactionLocked"
             @select="handleActionSelect"
           />
      ================================================= -->




      <!-- ================================================
           REPLY PLACEHOLDER

           Future component:

           <SoloReplyPanel
             :model-value="replyText"
             :reaction="selectedReaction"
             :disabled="interactionLocked"
             :busy="currentDiscussionStore.isBusy"
             :round-number="currentRoundNumber"
             :selected-action="selectedAction"
             :selected-risk="selectedRisk"
             @update:model-value="setReplyText"
             @reaction="handleReaction"
             @submit="handleReplySubmit"
           />
      ================================================= -->

      <section class="reply-stack">

        <SoloReplyPanel
            class="solo-reply-box"

            v-model="
      replyText
    "

            :reaction="
      selectedReaction
    "

            :disabled="
      interactionLocked
    "

            :busy="
      replySubmitting
      ||
      currentDiscussionStore.isBusy
    "

            :round-number="
      currentRoundNumber
    "

            :selected-action="
      selectedAction
    "

            :selected-risk="
      selectedRisk
    "

            @reaction="
      handleReaction
    "

            @submit="
      handleReplySubmit
    "
        />

      </section>





      <!-- ================================================
           VN SPEECH PLACEHOLDER

           Future component:

           <SoloMediatorSpeech
             :participant="mediatorParticipant"
             :statement="currentMediatorStatement"
             :speech="mediatorSpeech"
             :loading="currentDiscussionStore.isGeneratingMediator"
             :busy="currentDiscussionStore.isBusy"
             :status="discussionStatus"
             :round-number="currentRoundNumber"
             @next-round="handleNextRound"
             @pause="handlePauseSession"
             @resume="handleResumeSession"
             @end-session="handleEndSession"
           />
      ================================================= -->

      <section class="speech-panel">

        <SoloMediatorSpeech
            class="mediator-speech-box"

            :participant="
      mediatorParticipant
    "

            :statement="
      currentMediatorStatement
    "

            :speech="
      mediatorSpeech
    "

            :loading="
      currentDiscussionStore
        .isGeneratingMediator
    "

            :busy="
      currentDiscussionStore
        .isBusy
    "

            :status="
      discussionStatus
    "

            :round-number="
      currentRoundNumber
    "
        />

      </section>

    </div>


    <!-- ==================================================
         SIMPLE ERROR STATE
    ================================================== -->

    <div
        v-if="initializationError || currentDiscussionStore.error"
        class="panel error-panel"
    >
      <strong>
        Discussion error
      </strong>

      <span>
        {{
          currentDiscussionStore.error?.message
          ??
          initializationError?.message
          ??
          'The discussion could not be loaded.'
        }}
      </span>

      <button
          type="button"
          @click="retryDiscussion"
      >
        Retry
      </button>
    </div>

  </section>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.solo-discussion {
  --blue: #38c8ff;
  --purple: #9b4fff;
  --text: #eef8ff;
  --soft: #9eb3ca;

  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 100dvh;

  overflow: hidden;

  color: var(--text);
  background: #010106;

  isolation: isolate;
}


button,
input {
  font: inherit;
}


button {
  color: inherit;
}


/* ==================================================
   BACKGROUND

   Same placement as the supplied solo calibration.
================================================== */

.chamber-bg {
  position: absolute;

  inset: 0;

  z-index: 0;

  background-image:
      url('/images/chamber/bg.png');

  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}


.chamber-vignette {
  position: absolute;

  inset: 0;

  z-index: 1;

  pointer-events: none;

  background:
      radial-gradient(
          circle at center 42%,
          transparent 18%,
          rgba(0, 0, 8, 0.08) 52%,
          rgba(0, 0, 6, 0.72) 100%
      ),
      linear-gradient(
          to bottom,
          rgba(0, 0, 8, 0.04),
          rgba(0, 0, 8, 0.04) 50%,
          rgba(0, 0, 8, 0.48)
      );
}


/* ==================================================
   SCENE

   Same solo character/table placement as calibration.
================================================== */

.scene-layer {
  position: absolute;

  inset: 0;

  z-index: 2;

  pointer-events: none;
}


.scene-assembly {
  position: absolute;

  left: 50%;

  bottom:
      clamp(
          0rem,
          2vh,
          1.5rem
      );

  width:
      min(
          100%,
          calc(92dvh * 1.7778),
          106rem
      );

  aspect-ratio: 16 / 9;

  transform:
      translateX(-50%);

  transform-origin:
      bottom center;
}


.mediator-layer {
  position: absolute;

  inset: 0;

  z-index: 1;
}


.mediator-character {
  position: absolute;

  left: 50%;
  bottom: 10%;

  display: block;

  width: 25%;
  height: 100%;

  object-fit: contain;
  object-position: bottom center;

  transform:
      translateX(-50%);

  filter:
      drop-shadow(
          0 1rem 1.8rem
          rgba(0, 0, 0, 0.88)
      );
}


.solo-table {
  position: absolute;

  left: 50%;
  bottom: 0;

  z-index: 2;

  display: block;

  width: 70%;
  height: auto;

  max-width: none;

  transform:
      translateX(-50%);

  object-fit: contain;

  filter:
      drop-shadow(
          0 1.4rem 2.2rem
          rgba(0, 0, 0, 0.88)
      );
}


/* ==================================================
   SIMPLE BASE PANEL
================================================== */

.panel {
  border:
      1px solid
      rgba(126, 85, 255, 0.65);

  background:
      rgba(6, 7, 20, 0.82);

  box-shadow:
      0 0 1.25rem
      rgba(92, 47, 255, 0.18);

  backdrop-filter:
      blur(8px);

  color:
      rgba(237, 235, 255, 0.92);

  border-radius: 0.4rem;
}


.panel-label {
  display: block;

  margin-bottom: 0.8rem;

  font-size:
      clamp(
          0.72rem,
          0.8vw,
          0.95rem
      );

  font-weight: 700;

  letter-spacing: 0.08em;
  text-transform: uppercase;

  color: #ffffff;
}


/* ==================================================
   UI PLACEMENT
================================================== */

.solo-ui {
  position: absolute;

  inset: 0;

  z-index: 10;

  opacity: 0;

  transform:
      translateY(0.6rem);

  pointer-events: none;

  transition:
      opacity 450ms ease,
      transform 650ms cubic-bezier(0.22, 1, 0.36, 1);
}


.solo-ui.visible {
  opacity: 1;

  transform:
      translateY(0);

  pointer-events: auto;
}


.actions-panel,
.risks-panel {
  position: absolute;

  top: 7%;

  width: 18%;
  min-height: 34%;

  padding:
      clamp(
          0.75rem,
          1vw,
          1.2rem
      );
}


.actions-panel {
  left: 4%;
}


.risks-panel {
  right: 4%;
}


.reply-stack {
  position: absolute;

  top: 7%;
  left: 50%;

  width: 29%;

  transform:
      translateX(-50%);
}


.reply-panel {
  padding:
      clamp(
          0.75rem,
          1vw,
          1.15rem
      );
}


.reply-row {
  display: grid;

  grid-template-columns:
      minmax(0, 1fr)
      auto;

  gap: 0.55rem;
}


.reply-row input {
  min-width: 0;

  padding: 0.75rem 0.85rem;

  border:
      1px solid
      rgba(56, 200, 255, 0.35);

  border-radius: 0.3rem;

  outline: none;

  color: var(--text);

  background:
      rgba(0, 5, 16, 0.78);
}


.reply-row button,
.speech-controls button,
.error-panel button {
  padding: 0.65rem 0.9rem;

  border:
      1px solid
      rgba(56, 200, 255, 0.4);

  border-radius: 0.3rem;

  background:
      rgba(15, 28, 52, 0.8);

  cursor: pointer;
}


.reaction-row {
  display: grid;

  grid-template-columns:
      repeat(2, minmax(0, 1fr));

  gap: 0.7rem;

  margin-top: 0.7rem;
}


.reaction-button {
  padding: 0.85rem;

  cursor: pointer;

  transition:
      border-color 180ms ease,
      box-shadow 180ms ease,
      transform 180ms ease;
}


.reaction-button.selected {
  border-color:
      rgba(56, 200, 255, 0.95);

  box-shadow:
      0 0 1.1rem
      rgba(56, 200, 255, 0.22);

  transform:
      translateY(-1px);
}


.placeholder-item {
  display: block;

  width: 100%;

  margin-top: 0.55rem;
  padding: 0.75rem;

  border:
      1px solid
      rgba(126, 85, 255, 0.28);

  border-radius: 0.3rem;

  text-align: left;

  background:
      rgba(20, 13, 43, 0.58);

  cursor: pointer;
}


.placeholder-copy {
  margin: 0;

  color: var(--soft);

  font-size: 0.9rem;
  line-height: 1.5;
}


/* ==================================================
   VN SPEECH BOX PLACEMENT
================================================== */

.speech-panel {
  position: absolute;

  left: 7%;
  right: 7%;
  bottom: 3%;

  min-height: 21%;

  padding:
      clamp(
          1rem,
          1.5vw,
          1.6rem
      );

  display: grid;

  grid-template-rows:
      auto
      minmax(0, 1fr)
      auto;
}


.speech-header {
  display: flex;

  align-items: baseline;

  gap: 0.7rem;

  padding-bottom: 0.7rem;

  border-bottom:
      1px solid
      rgba(126, 85, 255, 0.28);
}


.speech-header strong {
  font-size:
      clamp(
          1rem,
          1.4vw,
          1.6rem
      );
}


.speech-header span {
  color:
      rgba(191, 140, 255, 0.95);
}


.speech-copy {
  margin:
      0.9rem
      0;

  max-width: 82%;

  font-size:
      clamp(
          0.9rem,
          1.15vw,
          1.25rem
      );

  line-height: 1.55;

  white-space: pre-wrap;
}


.speech-controls {
  display: flex;

  justify-content: flex-end;

  gap: 0.45rem;
}


/* ==================================================
   BACK / ERROR
================================================== */

.page-back {
  position: absolute;

  top: 1rem;
  left: 1rem;

  z-index: 20;

  padding: 0.55rem 0.8rem;

  border:
      1px solid
      rgba(126, 85, 255, 0.45);

  border-radius: 0.3rem;

  background:
      rgba(6, 7, 20, 0.78);

  cursor: pointer;
}


.error-panel {
  position: absolute;

  top: 50%;
  left: 50%;

  z-index: 40;

  width:
      min(
          28rem,
          80vw
      );

  padding: 1rem;

  display: grid;

  gap: 0.7rem;

  transform:
      translate(-50%, -50%);
}


button:disabled,
input:disabled {
  opacity: 0.5;

  cursor: not-allowed;
}


/* ==================================================
   SIMPLE RESPONSIVE FALLBACK
================================================== */

@media (max-width: 1180px) {
  .scene-assembly {
    width:
        min(
            108%,
            calc(90dvh * 1.7778)
        );
  }

  .mediator-character {
    width: 25%;
    height: 84%;
  }

  .solo-table {
    width: 84%;
  }

  .actions-panel,
  .risks-panel {
    width: 21%;
  }

  .reply-stack {
    width: 34%;
  }
}
</style>
