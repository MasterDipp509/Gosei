<template>
  <section class="mediator-calibration">

    <div class="chamber-bg"></div>

    <div class="chamber-vignette"></div>


    <!-- ==================================================
         SCENE
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
        @click="goBack"
    >

      <span>
        ←
      </span>

      <span>
        Back
      </span>

    </button>


    <!-- ==================================================
         INTERFACE
    ================================================== -->

    <div class="calibration-interface">

      <div class="holo-frame">

        <div class="frame-corner frame-tl"></div>

        <div class="frame-corner frame-tr"></div>

        <div class="frame-corner frame-bl"></div>

        <div class="frame-corner frame-br"></div>


        <!-- ==================================================
             COMPLETE OVERLAY
        ================================================== -->

        <Transition name="locking">

          <div
              v-if="isLocking"
              class="locking-overlay"
          >

            <div class="locking-core">

              <span class="lock-ring ring-one"></span>

              <span class="lock-ring ring-two"></span>

              <span class="lock-ring ring-three"></span>


              <svg
                  class="locking-symbol"
                  viewBox="0 0 120 120"
                  xmlns="http://www.w3.org/2000/svg"
              >

                <circle
                    cx="60"
                    cy="60"
                    r="26"
                />

                <path
                    d="
                    M60 18
                    V35

                    M60 85
                    V102

                    M18 60
                    H35

                    M85 60
                    H102
                  "
                />

                <path
                    d="
                    M43 60
                    L55 72
                    L79 45
                  "
                />

              </svg>


              <span class="locking-kicker">
                CALIBRATION COMPLETE
              </span>


              <h2>
                I’m ready.
              </h2>


              <p>
                Opening the discussion channel.
              </p>

            </div>

          </div>

        </Transition>


        <!-- ==================================================
             NAVIGATION
        ================================================== -->

        <header class="flow-navigation">

          <div class="flow-steps">

            <button
                v-for="(
                item,
                index
              ) in steps"

                :key="item.number"

                class="flow-step"

                :class="{
                  active:
                    index === step,

                  complete:
                    index < step
                }"

                :disabled="
                  index >= step
                "

                @click="
                  goToCompletedStep(
                    index
                  )
                "
            >

              <span class="step-symbol">

                <span>
                  {{ item.number }}
                </span>

              </span>


              <span class="step-copy">

                <strong>
                  {{ item.label }}
                </strong>

              </span>

            </button>

          </div>


          <div class="mode-badge">

            <svg
                viewBox="0 0 40 40"
                xmlns="http://www.w3.org/2000/svg"
            >

              <circle
                  cx="20"
                  cy="20"
                  r="6"
              />

              <path
                  d="
                  M20 3
                  V12

                  M20 28
                  V37

                  M3 20
                  H12

                  M28 20
                  H37
                "
              />

            </svg>


            <span>
              MEDIATOR MODE
            </span>

          </div>

        </header>


        <!-- ==================================================
             PROGRESS
        ================================================== -->

        <div class="progress-track">

          <span
              class="progress-fill"

              :style="{
                width:
                  `${progress}%`
              }"
          ></span>

        </div>


        <!-- ==================================================
             HEADING
        ================================================== -->

        <div class="flow-heading">

          <span class="heading-index">

            {{
              currentStep.number
            }}

            /

            05

          </span>


          <h1>
            {{
              currentStep.title
            }}
          </h1>

        </div>


        <!-- ==================================================
             FLOW
        ================================================== -->

        <main class="flow-stage">

          <Transition
              name="flow-swap"
              mode="out-in"
          >

            <!-- ==================================================
                 STEP 1 — BRIEF
            ================================================== -->

            <section
                v-if="step === 0"
                key="brief"
                class="flow-page brief-page"
            >

              <p class="page-description">

                Tell me what you’re thinking about.

                Explain the idea, decision, problem, or situation
                in your own words.

              </p>


              <div class="brief-input">

                <textarea
                    v-model="form.topic"

                    maxlength="3000"

                    placeholder="Explain the idea, decision, problem, or situation in your own words. Start wherever makes sense."

                    @keydown.ctrl.enter.prevent="goNext"
                ></textarea>


                <div class="input-footer">

                  <span>
                    INPUT CHANNEL ACTIVE
                  </span>


                  <span>

                    {{
                      form.topic.length
                    }}

                    /

                    3000

                  </span>

                </div>

              </div>

            </section>


            <!-- ==================================================
                 STEP 2 — OBJECTIVE
            ================================================== -->

            <section
                v-else-if="step === 1"
                key="objective"
                class="flow-page objective-page"
            >

              <p class="page-description">

                What do you need from this session?

                Choose the outcome that would make this conversation
                useful to you.

              </p>


              <div class="objective-grid">

                <button
                    v-for="option in objectiveOptions"

                    :key="option.id"

                    type="button"

                    class="objective-card"

                    :class="{
                      selected:
                        form.objective ===
                        option.id
                    }"

                    @click="
                      selectObjective(
                        option.id
                      )
                    "
                >

                  <div class="objective-mark">

                    <span class="objective-ring"></span>

                    <span class="objective-core"></span>

                  </div>


                  <div class="objective-copy">

                    <h3>
                      {{ option.label }}
                    </h3>


                    <p>
                      {{ option.text }}
                    </p>

                  </div>


                  <span class="selected-edge"></span>

                </button>

              </div>

            </section>


            <!-- ==================================================
                 STEP 3 — CLARIFY
            ================================================== -->

            <section
                v-else-if="step === 2"
                key="clarify"
                class="flow-page clarify-page"
            >

              <p class="page-description">

                Add anything that changes how I should understand the issue:
                history, constraints, stakes, deadlines, or people involved.

              </p>


              <div class="clarify-layout">

                <div class="context-input">

                  <textarea
                      v-model="form.context"

                      maxlength="1800"

                      placeholder="Relevant background, limitations, deadlines, people involved, previous attempts, or anything else that changes the picture..."
                  ></textarea>


                  <div class="input-footer">

                    <span>
                      OPTIONAL CONTEXT
                    </span>


                    <span>

                      {{
                        form.context.length
                      }}

                      /

                      1800

                    </span>

                  </div>

                </div>


                <aside class="context-status">

                  <span class="status-kicker">
                    CONTEXT SIGNAL
                  </span>


                  <div class="status-orbit">

                    <span class="orbit orbit-a"></span>

                    <span class="orbit orbit-b"></span>

                    <span class="orbit orbit-c"></span>


                    <strong>

                      {{
                        form.context.length
                            ? 'SYNC'
                            : 'IDLE'
                      }}

                    </strong>

                  </div>


                  <p>

                    {{
                      form.context.length
                          ? 'Additional context registered.'
                          : 'No additional context supplied.'
                    }}

                  </p>

                </aside>

              </div>

            </section>


            <!-- ==================================================
                 STEP 4 — TUNE
            ================================================== -->

            <section
                v-else-if="step === 3"
                key="tune"
                class="flow-page tune-page"
            >

              <p class="page-description">

                Choose how you want me to respond.

                Nothing is selected automatically — pick the level of
                challenge you actually want.

              </p>


              <div class="approach-grid">

                <button
                    v-for="approach in approaches"

                    :key="approach.id"

                    type="button"

                    class="approach-card"

                    :class="{
                      selected:
                        form.approach ===
                        approach.id
                    }"

                    @click="
                      selectApproach(
                        approach.id
                      )
                    "
                >

                  <span class="approach-index">
                    {{ approach.index }}
                  </span>


                  <h3>
                    {{ approach.title }}
                  </h3>


                  <span class="approach-subtitle">
                    {{ approach.subtitle }}
                  </span>


                  <p>
                    {{ approach.description }}
                  </p>


                  <div class="intensity-row">

                    <span>
                      INTENSITY
                    </span>


                    <div class="intensity-track">

                      <span
                          class="intensity-fill"

                          :style="{
                            width:
                              `${approach.intensity}%`
                          }"
                      ></span>

                    </div>

                  </div>


                  <span class="selected-edge"></span>

                </button>

              </div>

            </section>


            <!-- ==================================================
                 STEP 5 — SUMMARY

                 This is intentionally the final step.
                 It only reflects values the user entered or selected.
            ================================================== -->

            <section
                v-else
                key="summary"
                class="flow-page summary-page"
            >

              <p class="page-description">

                Review what you entered before opening the discussion.

                Use the completed step tabs above or the Back button to
                change anything.

              </p>


              <div class="reflection-card summary-brief-card">

                <div class="reflection-symbol">

                  <span></span>

                </div>


                <div class="reflection-content">

                  <span class="reflection-label">
                    YOUR BRIEF
                  </span>


                  <p>
                    {{ briefPreview }}
                  </p>

                </div>

              </div>


              <div class="reflection-meta">

                <div class="meta-card">

                  <span>
                    OBJECTIVE
                  </span>

                  <strong>
                    {{ selectedObjective?.label ?? 'Not selected' }}
                  </strong>

                </div>


                <div class="meta-card">

                  <span>
                    RESPONSE PROFILE
                  </span>

                  <strong>
                    {{ selectedApproach?.title ?? 'Not selected' }}
                  </strong>

                </div>


                <div class="meta-card">

                  <span>
                    FORMAT
                  </span>

                  <strong>
                    One-to-one mediation
                  </strong>

                </div>


                <div class="meta-card">

                  <span>
                    ADDITIONAL CONTEXT
                  </span>

                  <strong>
                    {{
                      form.context.trim()
                          ? 'Provided'
                          : 'None provided'
                    }}
                  </strong>

                </div>

              </div>


              <div
                  v-if="form.context.trim()"
                  class="reflection-card summary-context-card"
              >

                <div class="reflection-content">

                  <span class="reflection-label">
                    YOUR CONTEXT
                  </span>


                  <p>
                    {{ form.context.trim() }}
                  </p>

                </div>

              </div>

            </section>

          </Transition>

        </main>


        <!-- ==================================================
             FOOTER
        ================================================== -->

        <footer class="flow-footer">

          <div class="mediator-dialogue">

            <span class="dialogue-symbol">
              ◇
            </span>


            <span>
              {{ dialogue }}
            </span>

          </div>


          <button
              class="continue-button"

              :disabled="!canContinue"

              @click="goNext"
          >

            <span>

              {{
                step === 4
                    ? 'Begin Discussion'
                    : step === 3
                        ? 'Review Summary'
                        : 'Continue'
              }}

            </span>


            <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >

              <path
                  d="
                  M5 12
                  H19

                  M14 7
                  L19 12
                  L14 17
                "
              />

            </svg>

          </button>

        </footer>

      </div>

    </div>

  </section>
</template>

<script setup>
import {
  computed,
  isProxy,
  isRef,
  onBeforeUnmount,
  ref,
  toRaw,
  unref,
  watch
} from 'vue'

import {
  useProfileStore
} from '@/stores/profileStore.js'

import {
  useCurrentDiscussionStore
} from '@/stores/currentDiscussion.js'


/* ==================================================
   STORES

   profileStore:
   Supplies the currently selected mediator before
   there is a frozen backend session snapshot.

   currentDiscussionStore:
   Holds the live discussion draft and later receives
   the authoritative backend discussion snapshot.

   CALIBRATION FLOW:

   profileStore
       ↓
   MediatorCalibration
       ↓
   currentDiscussion draft sync
       ↓
   ChamberFlow creates session
       ↓
   real backend session ID appears
       ↓
   loadDiscussion(sessionId)
       ↓
   authoritative backend hydration
================================================== */

const profileStore =
    useProfileStore()


const currentDiscussionStore =
    useCurrentDiscussionStore()


/* ==================================================
   PLAIN VALUE HELPER

   Props, Pinia state, computed values and refs may
   contain Vue reactive proxies.

   This helper recursively converts values into plain
   structures before they are:

   - emitted to ChamberFlow
   - used in backend request payloads
   - copied into discussion draft state

   currentDiscussion.js should still safely normalize
   values before structuredClone() or request usage.
================================================== */

const toPlainValue = (
    value,
    seen = new WeakMap()
) => {

  if (
      value === undefined
  ) {
    return undefined
  }


  let source =
      isRef(value)
          ? unref(value)
          : value


  if (
      isProxy(source)
  ) {
    source =
        toRaw(source)
  }


  if (
      source === null
      ||
      typeof source !== 'object'
  ) {

    if (
        typeof source === 'function'
        ||
        typeof source === 'symbol'
    ) {
      return undefined
    }


    return source
  }


  if (
      seen.has(source)
  ) {
    return seen.get(source)
  }


  if (
      source instanceof Date
  ) {
    return new Date(
        source.getTime()
    )
  }


  if (
      Array.isArray(source)
  ) {

    const result =
        []


    seen.set(
        source,
        result
    )


    source.forEach(
        item => {

          result.push(
              toPlainValue(
                  item,
                  seen
              )
          )
        }
    )


    return result
  }


  if (
      source instanceof Map
  ) {

    const result =
        {}


    seen.set(
        source,
        result
    )


    source.forEach(
        (
            entry,
            key
        ) => {

          result[
              String(key)
              ] =
              toPlainValue(
                  entry,
                  seen
              )
        }
    )


    return result
  }


  if (
      source instanceof Set
  ) {

    const result =
        []


    seen.set(
        source,
        result
    )


    source.forEach(
        entry => {

          result.push(
              toPlainValue(
                  entry,
                  seen
              )
          )
        }
    )


    return result
  }


  const result =
      {}


  seen.set(
      source,
      result
  )


  Object.entries(source)
      .forEach(
          ([
             key,
             entry
           ]) => {

            const plainEntry =
                toPlainValue(
                    entry,
                    seen
                )


            if (
                plainEntry !== undefined
            ) {
              result[key] =
                  plainEntry
            }
          }
      )


  return result
}


/* ==================================================
   SESSION ID HELPERS

   ChamberFlow may temporarily create local IDs like:

       draft-1783346726362

   These are frontend-only transition IDs.

   They must NEVER be used for:

       GET
       /chamber/sessions/{id}/discussion/

   Only persisted backend session IDs may activate a
   discussion.
================================================== */

const normalizeSessionId =
    sessionId => {

      if (
          sessionId === null
          ||
          sessionId === undefined
      ) {
        return null
      }


      const normalized =
          String(
              sessionId
          )
              .trim()


      return normalized ||
          null
    }


const isDraftSessionId =
    sessionId => {

      const normalized =
          normalizeSessionId(
              sessionId
          )


      if (!normalized) {
        return false
      }


      return normalized
          .startsWith(
              'draft-'
          )
    }


const isPersistedSessionId =
    sessionId => {

      const normalized =
          normalizeSessionId(
              sessionId
          )


      return Boolean(
          normalized
          &&
          !isDraftSessionId(
              normalized
          )
      )
    }


/* ==================================================
   PROPS / EMITS
================================================== */

const props = defineProps({

  /*
    May initially be null.

    ChamberFlow can later pass the created backend
    session back into this component.
  */

  session: {
    type: Object,
    default: null
  },


  /*
    Supports restoring calibration.

    Accepted shapes:

    {
      topic,
      objective,
      ...
    }

    or:

    {
      calibration: {
        topic,
        objective,
        ...
      }
    }
  */

  existingCalibration: {
    type: Object,
    default: null
  }
})


const emit = defineEmits([
  'complete',
  'back'
])


/* ==================================================
   OBJECTIVES
================================================== */

const objectiveOptions = [
  {
    id: 'clarity',

    label: 'Gain clarity',

    text:
        'Untangle the situation and understand what the real problem is.'
  },

  {
    id: 'decision',

    label: 'Make a decision',

    text:
        'Compare the available paths and leave with a clear direction.'
  },

  {
    id: 'reflection',

    label: 'Think it through',

    text:
        'Explore the matter openly without forcing an immediate conclusion.'
  },

  {
    id: 'resolution',

    label: 'Resolve a conflict',

    text:
        'Examine competing priorities and find a workable middle ground.'
  }
]


/* ==================================================
   APPROACHES
================================================== */

const approaches = [
  {
    id: 'supportive',

    index: '01',

    title: 'Supportive',

    subtitle: 'Build with me',

    description:
        'Help me explore the strongest version of the idea while gently identifying weak areas.',

    intensity: 34
  },

  {
    id: 'balanced',

    index: '02',

    title: 'Balanced',

    subtitle: 'Challenge and guide',

    description:
        'Question my assumptions when necessary while keeping the conversation constructive.',

    intensity: 64
  },

  {
    id: 'adversarial',

    index: '03',

    title: 'Adversarial',

    subtitle: 'Pressure-test me',

    description:
        'Push hard against my reasoning, find contradictions and expose weak assumptions.',

    intensity: 94
  }
]


/* ==================================================
   LOCAL FLOW STATE
================================================== */

const step =
    ref(0)


const isLocking =
    ref(false)


/*
  Stores the ID of a successfully activated backend
  discussion.

  Prevents duplicate hydration requests.
*/

const activatedSessionId =
    ref(null)


/*
  Keeps activation failure locally available without
  interfering with the store's own error state.
*/

const activationError =
    ref(null)


/*
  Tracks active loadDiscussion requests by session ID.

  This prevents multiple session-prop updates from
  creating duplicate GET /discussion/ requests.
*/

const activationPromises =
    new Map()


/*
  Protects component-local state after unmount.
*/

let componentUnmounted =
    false


/*
  Final transition timer.
*/

let completionTimer =
    null


/* ==================================================
   FORM

   IMPORTANT:

   Fresh mediator calibration is intentionally blank.

   Nothing is pre-selected and no previous discussion
   content is copied into these fields. The user must:

   - type the brief
   - choose an objective
   - optionally type context
   - choose a response approach

   The final Summary step only reflects these values.
================================================== */

const form = ref({

  topic: '',

  objective: '',

  context: '',

  approach: ''
})


/* ==================================================
   MEDIATOR SOURCE

   Priority:

   1. frozen backend session mediator
   2. currently selected profile mediator

   Once loadDiscussion() succeeds, the discussion
   store receives the authoritative participant
   snapshot from Django.
================================================== */

const discussionMediator = computed(() => {

  const sessionMediator =
      props.session
          ?.mediator ??

      props.session
          ?.mediatorSnapshot ??

      props.session
          ?.mediator_snapshot


  if (sessionMediator) {
    return sessionMediator
  }


  return (
      profileStore
          .councilMediator ??

      profileStore
          .mediator ??

      currentDiscussionStore
          .participants
          ?.mediator ??

      null
  )
})


/* ==================================================
   MEDIATOR DISPLAY

   Image path deliberately matches the existing
   component design and asset structure.
================================================== */

const mediatorImage = computed(() => {

  if (
      !discussionMediator.value
          ?.id
  ) {
    return ''
  }


  return (
      `/images/chamber/char/` +
      `${discussionMediator.value.id}/` +
      `NeonOffice.png`
  )
})


const mediatorName = computed(() =>
    discussionMediator.value
        ?.name ??
    'The Mediator'
)


/* ==================================================
   FLOW STEPS
================================================== */

const steps = [
  {
    number: '01',

    label: 'BRIEF',

    title: 'Brief the Chamber'
  },

  {
    number: '02',

    label: 'OBJECTIVE',

    title: 'Objective'
  },

  {
    number: '03',

    label: 'CLARIFY',

    title: 'Clarify'
  },

  {
    number: '04',

    label: 'TUNE',

    title: 'Tune the Chamber'
  },

  {
    number: '05',

    label: 'SUMMARY',

    title: 'Review Your Session'
  }
]


const currentStep = computed(() =>
    steps[
        step.value
        ]
)


const progress = computed(() =>
    (
        (
            step.value +
            1
        )
        /
        steps.length
    )
    *
    100
)


/* ==================================================
   SELECTED VALUES
================================================== */

const selectedObjective = computed(() =>
    objectiveOptions.find(
        option =>
            option.id ===
            form.value.objective
    ) ??
    null
)


const selectedApproach = computed(() =>
    approaches.find(
        approach =>
            approach.id ===
            form.value.approach
    ) ??
    null
)


/* ==================================================
   BRIEF PREVIEW

   The summary template renders briefPreview.

   Keep this derived directly from the current form
   value so edits made by revisiting Step 1 are
   reflected immediately on the final review page.
================================================== */

const briefPreview = computed(() => {

  const topic =
      form.value.topic
          .trim()


  return (
      topic ||
      'No brief provided.'
  )
})


/* ==================================================
   CALIBRATION PAYLOAD

   Uses the same stable calibration contract as panel
   mode.

   Fields currently edited by this component:

   - topic
   - objective
   - context
   - approach

   Additional arrays are preserved so resumed
   calibration or model-generated context is not lost.
================================================== */

const calibrationPayload = computed(() => ({

  topic:
      form.value.topic
          .trim(),


  objective:
      selectedObjective.value
          ?.label ??
      '',


  objectiveId:
  form.value.objective,


  context:
      form.value.context
          .trim(),


  approach:
  form.value.approach,


  councilMode:
      'mediator',


  desiredOutcome:
      '',


  constraints:
      [],


  assumptions:
      [],


  questions:
      [],


  additionalNotes:
      ''
}))


/* ==================================================
   PARTICIPANT NORMALIZATION

   Profile objects and backend snapshots may use
   different naming conventions.

   Accepted fields include:

       debateStyle
       debate_style

       focusAreas
       focus_areas
       expertise
================================================== */

const normalizePersonality =
    value => {

      if (
          Array.isArray(value)
      ) {
        return value
            .filter(
                item =>
                    typeof item ===
                    'string'
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean)
      }


      if (
          typeof value ===
          'string'
          &&
          value.trim()
      ) {
        return [
          value.trim()
        ]
      }


      return []
    }


const normalizeFocusAreas =
    participant => {

      const value =
          participant
              ?.focusAreas ??

          participant
              ?.focus_areas ??

          participant
              ?.expertise ??

          []


      if (
          !Array.isArray(value)
      ) {
        return []
      }


      return value
          .filter(
              item =>
                  typeof item ===
                  'string'
          )
          .map(
              item =>
                  item.trim()
          )
          .filter(Boolean)
    }


const participantPayload = (
    participant,
    fallbackRole = 'Mediator'
) => {

  if (
      !participant
          ?.id
  ) {
    return null
  }


  return {

    id:
        String(
            participant.id
        ),


    name:
        participant.name ??
        String(
            participant.id
        ),


    role:
        participant.role ??
        fallbackRole,


    description:
        participant.description ??
        '',


    personality:
        normalizePersonality(
            participant.personality ??
            participant.persona
        ),


    debateStyle:
        participant.debateStyle ??
        participant.debate_style ??
        '',


    focusAreas:
        normalizeFocusAreas(
            participant
        )
  }
}


/* ==================================================
   NORMALIZED MEDIATOR

   Used by:

   1. backend session request
   2. currentDiscussion draft participants
================================================== */

const normalizedMediator = computed(() =>
    participantPayload(
        discussionMediator.value,
        'Mediator'
    )
)


/* ==================================================
   FULL SESSION REQUEST

   The complete event payload contains both:

   1. flat calibration values for ChamberFlow
      compatibility

   2. structured backend session creation values

   Example:

   {
     topic,
     objective,
     context,
     approach,
     councilMode,

     mode: "mediator",

     title,

     calibration: {...},

     panelMembers: [],

     mediator: {...}
   }
================================================== */

const startSessionPayload = computed(() => {

  const calibration =
      toPlainValue(
          calibrationPayload.value
      )


  const mediatorSnapshot =
      toPlainValue(
          normalizedMediator.value
      )


  return {

    /*
      Existing ChamberFlow compatibility.
    */

    ...calibration,


    /*
      Session creation API values.
    */

    mode:
        'mediator',


    title:
        calibration.topic
            .slice(
                0,
                255
            ),


    calibration,


    /*
      Mediator discussions intentionally contain no
      character panel.
    */

    panelMembers:
        [],


    mediator:
    mediatorSnapshot
  }
})


/* ==================================================
   DISCUSSION DRAFT SYNC

   Prepares currentDiscussion before the discussion
   page mounts.

   Synchronizes:

   - calibration brief
   - model context
   - calibration snapshot
   - mediator participant
   - empty panel character list

   Django becomes authoritative once loadDiscussion()
   resolves.
================================================== */

const syncDiscussionDraft = () => {

  const calibration =
      toPlainValue(
          calibrationPayload.value
      )


  const mediatorSnapshot =
      toPlainValue(
          normalizedMediator.value
      )


  /* ================================================
     BRIEF
  ================================================ */

  currentDiscussionStore.brief = {

    ...currentDiscussionStore
        .brief,


    topic:
    calibration.topic,


    objective:
    calibration.objective,


    objectiveId:
    calibration.objectiveId,


    context:
    calibration.context,


    approach:
    calibration.approach,


    councilMode:
    calibration.councilMode,


    desiredOutcome:
    calibration.desiredOutcome,


    additionalNotes:
    calibration.additionalNotes
  }


  /* ================================================
     MODEL CONTEXT SEED

     Calibration-owned values are synchronized.

     Other existing model-context fields are preserved,
     including:

     - summary
     - knownFacts
     - entities
     - decisions
     - backend-generated context
  ================================================ */

  currentDiscussionStore.modelContext = {

    ...currentDiscussionStore
        .modelContext,


    assumptions: [
      ...calibration.assumptions
    ],


    constraints: [
      ...calibration.constraints
    ],


    objectives:
        calibration.objective
            ? [
              calibration.objective
            ]
            : [],


    unresolvedQuestions: [
      ...calibration.questions
    ],


    calibrationSnapshot: {

      ...calibration,


      constraints: [
        ...calibration.constraints
      ],


      assumptions: [
        ...calibration.assumptions
      ],


      questions: [
        ...calibration.questions
      ]
    }
  }


  /* ================================================
     PARTICIPANTS

     Mediator mode must contain:

       characters: []
       characterOrder: []
       mediator: {...}

     Explicitly clearing characters prevents panel
     participants from a previous session leaking into
     this discussion.
  ================================================ */

  currentDiscussionStore
      .setParticipants({

        characters:
            [],


        characterOrder:
            [],


        mediator:
        mediatorSnapshot
      })
}


/* ==================================================
   LIVE DRAFT SYNCHRONIZATION

   Any calibration edit or mediator change keeps the
   currentDiscussion draft synchronized.

   This matches the panel calibration behaviour.
================================================== */

watch(
    [
      calibrationPayload,
      normalizedMediator
    ],

    () => {
      syncDiscussionDraft()
    },

    {
      deep: true,
      immediate: true
    }
)


/* ==================================================
   DIALOGUE

   Presentation-only.

   These are not persisted as DebateMessage records.
================================================== */

const dialogue = computed(() => {

  const lines = [
    'All right. Tell me what you’re considering.',

    'What would make this conversation genuinely useful to you?',

    'Give me the context that changes how I should understand this.',

    'Tell me how hard you want me to push back.',

    'Take one last look. This is exactly what you entered.'
  ]


  return lines[
      step.value
      ]
})


/* ==================================================
   BACKEND DISCUSSION ACTIVATION

   After ChamberFlow creates the real backend session:

       ready
         ↓
       loadDiscussion(sessionId)
         ↓
       active
         ↓
       round 1
         ↓
       active section
         ↓
       authoritative store hydration

   IMPORTANT:

   This calibration page does NOT call initial message
   generation.

   Generation belongs to the actual discussion page.

   That prevents calibration and discussion mounting
   from creating duplicate AI responses.
================================================== */

const activateDiscussionSession =
    async session => {

      const normalizedSession =
          toPlainValue(
              session
          )


      const normalizedSessionId =
          normalizeSessionId(
              normalizedSession
                  ?.id
          )


      /*
        Cannot activate without an ID.
      */

      if (
          !normalizedSessionId
      ) {
        return null
      }


      /*
        Never send draft IDs to Django.
      */

      if (
          isDraftSessionId(
              normalizedSessionId
          )
      ) {

        console.debug(
            '[MediatorCalibration] Waiting for persisted session:',
            normalizedSessionId
        )


        return null
      }


      /*
        Successful activation already completed.
      */

      if (
          activatedSessionId.value ===
          normalizedSessionId
      ) {
        return null
      }


      /*
        Reuse an existing activation request for the
        same backend session.
      */

      if (
          activationPromises.has(
              normalizedSessionId
          )
      ) {
        return activationPromises.get(
            normalizedSessionId
        )
      }


      activationError.value =
          null


      const activationPromise =
          (
              async () => {

                /*
                  Ensure current calibration and mediator
                  state is present before backend hydration.
                */

                syncDiscussionDraft()


                /*
                  Seed session identity immediately.

                  loadDiscussion() will hydrate the
                  authoritative state afterward.
                */

                currentDiscussionStore.sessionId =
                    normalizedSessionId


                currentDiscussionStore.status =
                    normalizedSession
                        ?.status ??
                    'ready'


                currentDiscussionStore
                    .flow
                    .currentRound =
                    Number(
                        normalizedSession
                            ?.currentRound ??

                        normalizedSession
                            ?.current_round ??

                        currentDiscussionStore
                            .flow
                            .currentRound ??

                        0
                    )


                const snapshot =
                    await currentDiscussionStore
                        .loadDiscussion(
                            normalizedSessionId
                        )


                /*
                  Store hydration may finish after this
                  component has unmounted.

                  Allow the store request to finish, but
                  do not mutate local component state.
                */

                if (
                    componentUnmounted
                ) {
                  return snapshot
                }


                activatedSessionId.value =
                    normalizedSessionId


                console.log(
                    '[MediatorCalibration] Discussion activated:',
                    {

                      sessionId:
                      normalizedSessionId,


                      status:
                      currentDiscussionStore
                          .status,


                      round:
                      currentDiscussionStore
                          .flow
                          .currentRound,


                      sectionId:
                      currentDiscussionStore
                          .flow
                          .currentSectionId,


                      mediator:
                          currentDiscussionStore
                              .participants
                              .mediator
                              ?.id ??
                          null
                    }
                )


                return snapshot
              }
          )()


      activationPromises.set(
          normalizedSessionId,
          activationPromise
      )


      try {

        return await activationPromise

      } catch (error) {

        activationError.value =
            error


        console.error(
            '[MediatorCalibration] Discussion activation failed:',
            error
        )


        throw error

      } finally {

        /*
          Remove only the request belonging to this
          completed promise.
        */

        if (
            activationPromises.get(
                normalizedSessionId
            )
            ===
            activationPromise
        ) {
          activationPromises.delete(
              normalizedSessionId
          )
        }
      }
    }


/* ==================================================
   SESSION PROP WATCHER

   Typical flow:

   calibration completes
       ↓
   ChamberFlow receives payload
       ↓
   local draft session may appear
       ↓
   Django creates backend session
       ↓
   real UUID replaces draft ID
       ↓
   watcher activates discussion state

   Watching session.id only prevents unrelated session
   mutations from repeatedly activating the backend.
================================================== */

watch(
    () =>
        props.session
            ?.id,

    async nextSessionId => {

      if (
          !isPersistedSessionId(
              nextSessionId
          )
      ) {

        if (
            isDraftSessionId(
                nextSessionId
            )
        ) {
          console.debug(
              '[MediatorCalibration] Draft session detected. Waiting for backend UUID:',
              nextSessionId
          )
        }


        return
      }


      try {

        await activateDiscussionSession(
            props.session
        )

      } catch {
        /*
          loadDiscussion() already maintains the store's
          structured error state.

          Suppress unhandled Vue watcher rejection.
        */
      }
    },

    {
      immediate: true
    }
)


/* ==================================================
   VALIDATION
================================================== */

const canContinue = computed(() => {

  /*
    STEP 1 — BRIEF:
    The user must type a meaningful topic.
  */

  if (
      step.value ===
      0
  ) {
    return (
        form.value.topic
            .trim()
            .length >=
        5
    )
  }


  /*
    STEP 2 — OBJECTIVE:
    Nothing is selected by default.
  */

  if (
      step.value ===
      1
  ) {
    return Boolean(
        form.value.objective
    )
  }


  /*
    STEP 3 — CLARIFY:
    Context is optional.
  */

  if (
      step.value ===
      2
  ) {
    return true
  }


  /*
    STEP 4 — TUNE:
    The user must deliberately choose an approach.
  */

  if (
      step.value ===
      3
  ) {
    return Boolean(
        form.value.approach
    )
  }


  /*
    STEP 5 — SUMMARY:
    Final start validation includes the mediator.
  */

  return canStartSession.value
})


const canStartSession = computed(() => {

  return (
      form.value.topic
          .trim()
          .length >=
      5

      &&

      Boolean(
          form.value.objective
      )

      &&

      Boolean(
          form.value.approach
      )

      &&

      Boolean(
          normalizedMediator.value
              ?.id
      )
  )
})


/* ==================================================
   SELECTION
================================================== */

const selectObjective =
    id => {

      form.value.objective =
          id
    }


const selectApproach =
    id => {

      form.value.approach =
          id
    }


/* ==================================================
   NAVIGATION
================================================== */

const goNext = () => {

  if (
      !canContinue.value
      ||
      isLocking.value
  ) {
    return
  }


  if (
      step.value <
      steps.length -
      1
  ) {

    step.value +=
        1


    return
  }


  completeCalibration()
}


const goBack = () => {

  if (
      isLocking.value
  ) {
    return
  }


  if (
      step.value >
      0
  ) {

    step.value -=
        1


    return
  }


  emit(
      'back'
  )
}


const goToCompletedStep =
    index => {

      if (
          index >=
          step.value

          ||

          isLocking.value
      ) {
        return
      }


      step.value =
          index
    }


/* ==================================================
   COMPLETE CALIBRATION

   ChamberFlow remains responsible for:

   1. receiving the payload
   2. creating the backend session
   3. storing the active session
   4. transitioning to the discussion page

   This component performs one final store sync before
   emitting so no last-second input is lost.
================================================== */

const completeCalibration = () => {

  if (
      !canStartSession.value
      ||
      isLocking.value
  ) {
    return
  }


  /*
    Final discussion draft synchronization.
  */

  syncDiscussionDraft()


  /*
    Backend-ready session payload.
  */

  const payload =
      toPlainValue(
          startSessionPayload.value
      )


  console.log(
      '[MediatorCalibration] Complete payload:',
      payload
  )


  console.log(
      '[MediatorCalibration] Discussion mediator prepared:',
      currentDiscussionStore
          .participants
          .mediator
          ?.id ??
      null
  )


  isLocking.value =
      true


  /*
    Allow the existing locking animation to play
    before ChamberFlow changes stage.
  */

  completionTimer =
      window.setTimeout(
          () => {

            if (
                componentUnmounted
            ) {
              return
            }


            emit(
                'complete',
                payload
            )
          },

          1150
      )
}


/* ==================================================
   CLEANUP
================================================== */

onBeforeUnmount(() => {

  componentUnmounted =
      true


  if (
      completionTimer
  ) {

    window.clearTimeout(
        completionTimer
    )


    completionTimer =
        null
  }
})
</script>

<style scoped>
.mediator-calibration {
  --blue: #38c8ff;
  --blue-bright: #a6efff;

  --purple: #9b4fff;
  --purple-bright: #d9afff;

  --text: #eef8ff;
  --soft: #9eb3ca;
  --dim: #62738a;

  position: relative;

  width: 100%;
  height: 100%;
  min-height: 100dvh;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  color: var(--text);

  background: #010106;
}


button,
textarea {
  font: inherit;
}


button {
  color: inherit;
}


.chamber-bg {
  position: absolute;

  inset: 0;

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


.page-back {
  position: absolute;

  top:
      clamp(
          0.8rem,
          2vw,
          1.5rem
      );

  left:
      clamp(
          0.8rem,
          2vw,
          1.5rem
      );

  z-index: 30;

  display: flex;
  align-items: center;

  gap: 0.55rem;

  padding:
      0.55rem
      0.8rem;

  color:
      rgba(
          225,
          239,
          250,
          0.78
      );

  background:
      rgba(
          3,
          5,
          16,
          0.52
      );

  border:
      1px solid
      rgba(
          255,
          255,
          255,
          0.09
      );

  backdrop-filter:
      blur(0.45rem);

  cursor: pointer;

  transition:
      color 180ms ease,
      border-color 180ms ease;
}


.page-back:hover {
  color: var(--blue);

  border-color:
      rgba(
          75,
          200,
          255,
          0.35
      );
}


.calibration-interface {
  position: absolute;

  inset: 0;

  z-index: 10;

  display: flex;
  justify-content: center;
  align-items: flex-start;

  padding:
      clamp(
          2.8rem,
          5vh,
          5rem
      )
      clamp(
          0.8rem,
          3vw,
          3rem
      )
      0;

  box-sizing: border-box;

  pointer-events: none;
}


.holo-frame {
  position: relative;

  width:
      min(
          60rem,
          62vw
      );

  height:
      clamp(
          20rem,
          39vh,
          33rem
      );

  display: flex;
  flex-direction: column;

  overflow: hidden;

  pointer-events: auto;

  background:
      linear-gradient(
          145deg,
          rgba(
              9,
              8,
              43,
              0.9
          ),
          rgba(
              3,
              4,
              20,
              0.95
          )
      );

  border:
      1px solid
      rgba(
          152,
          86,
          255,
          0.76
      );

  clip-path:
      polygon(
          2.3% 0,
          97.7% 0,
          100% 4%,
          100% 96%,
          97.7% 100%,
          2.3% 100%,
          0 96%,
          0 4%
      );

  backdrop-filter:
      blur(0.8rem);

  box-shadow:
      inset
      0
      0
      4rem
      rgba(
          96,
          41,
          210,
          0.13
      ),
      0
      0
      2.5rem
      rgba(
          91,
          44,
          200,
          0.22
      );
}


.holo-frame::before {
  content: '';

  position: absolute;

  inset: 0;

  pointer-events: none;

  background-image:
      linear-gradient(
          rgba(
              75,
              200,
              255,
              0.045
          )
          1px,

          transparent
          1px
      ),
      linear-gradient(
          90deg,

          rgba(
              75,
              200,
              255,
              0.045
          )
          1px,

          transparent
          1px
      );

  background-size:
      2.6rem
      2.6rem;

  mask-image:
      linear-gradient(
          to bottom,
          black,
          transparent 88%
      );
}


.frame-corner {
  position: absolute;

  z-index: 5;

  width: 2.5rem;
  height: 2.5rem;

  pointer-events: none;
}


.frame-tl {
  top: 0.4rem;
  left: 0.4rem;

  border-top:
      2px solid
      var(--blue);

  border-left:
      2px solid
      var(--purple);
}


.frame-tr {
  top: 0.4rem;
  right: 0.4rem;

  border-top:
      2px solid
      var(--purple);

  border-right:
      2px solid
      var(--blue);
}


.frame-bl {
  left: 0.4rem;
  bottom: 0.4rem;

  border-left:
      2px solid
      var(--blue);

  border-bottom:
      2px solid
      var(--purple);
}


.frame-br {
  right: 0.4rem;
  bottom: 0.4rem;

  border-right:
      2px solid
      var(--purple);

  border-bottom:
      2px solid
      var(--blue);
}


.flow-navigation {
  position: relative;

  z-index: 4;

  flex: 0 0 auto;

  min-height: 3.8rem;

  display: grid;

  grid-template-columns:
      minmax(
          0,
          1fr
      )
      auto;

  align-items: center;

  gap: 1rem;

  padding:
      0.6rem
      clamp(
          1rem,
          1.8vw,
          1.6rem
      );

  box-sizing: border-box;

  border-bottom:
      1px solid
      rgba(
          255,
          255,
          255,
          0.06
      );
}


.flow-steps {
  display: grid;

  grid-template-columns:
      repeat(
          5,
          minmax(
              0,
              1fr
          )
      );

  align-items: center;

  min-width: 0;
}


.flow-step {
  min-width: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 0.5rem;

  padding: 0.25rem;

  border: 0;

  background: transparent;

  color: var(--dim);

  cursor: default;

  transition:
      color 200ms ease;
}


.flow-step.complete {
  cursor: pointer;
}


.step-symbol {
  width: 1.65rem;
  height: 1.65rem;

  flex: 0 0 auto;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(
          120,
          145,
          180,
          0.38
      );

  transform:
      rotate(45deg);

  transition:
      border-color 200ms ease,
      box-shadow 200ms ease;
}


.step-symbol span {
  transform:
      rotate(-45deg);

  font-size: 0.45rem;
  font-weight: 800;
}


.step-copy {
  min-width: 0;
}


.step-copy strong {
  display: block;

  overflow: hidden;

  font-size:
      clamp(
          0.4rem,
          0.56vw,
          0.6rem
      );

  letter-spacing: 0.08em;

  white-space: nowrap;
  text-overflow: ellipsis;
}


.flow-step.active {
  color: var(--purple-bright);
}


.flow-step.active
.step-symbol {
  border-color: var(--purple);

  box-shadow:
      0
      0
      0.9rem
      rgba(
          155,
          79,
          255,
          0.62
      );
}


.flow-step.complete {
  color: var(--blue);
}


.flow-step.complete
.step-symbol {
  border-color:
      rgba(
          75,
          200,
          255,
          0.6
      );
}


.mode-badge {
  display: flex;
  align-items: center;

  gap: 0.45rem;

  padding:
      0.45rem
      0.7rem;

  border:
      1px solid
      rgba(
          155,
          79,
          255,
          0.5
      );

  color: var(--text);

  font-size: 0.52rem;
  font-weight: 800;

  letter-spacing: 0.1em;

  white-space: nowrap;
}


.mode-badge svg {
  width: 1rem;
  height: 1rem;

  fill: none;

  stroke: var(--blue);
  stroke-width: 1.8;

  filter:
      drop-shadow(
          0
          0
          0.35rem
          var(--blue)
      );
}


.progress-track {
  position: relative;

  z-index: 4;

  flex: 0 0 1px;

  background:
      rgba(
          255,
          255,
          255,
          0.05
      );
}


.progress-fill {
  display: block;

  height: 100%;

  background:
      linear-gradient(
          to right,
          var(--purple),
          var(--blue)
      );

  box-shadow:
      0
      0
      0.8rem
      rgba(
          117,
          108,
          255,
          0.9
      );

  transition:
      width
      420ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.flow-heading {
  position: relative;

  z-index: 3;

  flex: 0 0 auto;

  padding:
      clamp(
          0.7rem,
          1.4vh,
          1.1rem
      )
      1rem
      0;

  text-align: center;
}


.heading-index {
  display: block;

  margin-bottom: 0.2rem;

  color: var(--blue);

  font-size: 0.48rem;
  font-weight: 900;

  letter-spacing: 0.18em;
}


.flow-heading h1 {
  margin: 0;

  font-size:
      clamp(
          1.25rem,
          2.1vw,
          2.1rem
      );

  letter-spacing: 0.02em;

  text-shadow:
      0
      0
      1rem
      rgba(
          75,
          200,
          255,
          0.25
      );
}


.flow-stage {
  position: relative;

  z-index: 3;

  flex: 1;

  min-width: 0;
  min-height: 0;

  overflow: hidden;
}


.flow-page {
  height: 100%;

  padding:
      clamp(
          0.45rem,
          1vh,
          0.8rem
      )
      clamp(
          1rem,
          3vw,
          3rem
      );

  box-sizing: border-box;

  overflow-y: auto;

  scrollbar-width: thin;

  scrollbar-color:
      rgba(
          75,
          200,
          255,
          0.3
      )
      transparent;
}


.page-description {
  max-width: 45rem;

  margin:
      0
      auto
      clamp(
          0.6rem,
          1.4vh,
          1rem
      );

  color: var(--soft);

  font-size:
      clamp(
          0.66rem,
          0.86vw,
          0.84rem
      );

  line-height: 1.5;

  text-align: center;
}


.brief-input {
  width:
      min(
          100%,
          47rem
      );

  margin: 0 auto;

  padding:
      clamp(
          0.75rem,
          1.5vw,
          1.2rem
      );

  box-sizing: border-box;

  background:
      linear-gradient(
          145deg,
          rgba(
              11,
              13,
              42,
              0.9
          ),
          rgba(
              4,
              5,
              22,
              0.95
          )
      );

  border:
      1px solid
      rgba(
          101,
          135,
          255,
          0.75
      );

  box-shadow:
      inset
      0
      0
      1.5rem
      rgba(
          77,
          96,
          255,
          0.08
      ),
      0
      0
      1rem
      rgba(
          85,
          100,
          255,
          0.14
      );
}


.brief-input textarea {
  display: block;

  width: 100%;

  min-height:
      clamp(
          6rem,
          14vh,
          10rem
      );

  box-sizing: border-box;

  padding: 0;

  resize: none;

  border: 0;
  outline: 0;

  background: transparent;

  color: var(--text);

  font-size:
      clamp(
          0.82rem,
          1.12vw,
          1.08rem
      );

  line-height: 1.55;
}


.brief-input textarea::placeholder,
.context-input textarea::placeholder {
  color:
      rgba(
          174,
          190,
          215,
          0.46
      );
}


.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 1rem;

  margin-top: 0.5rem;

  color: var(--dim);

  font-size: 0.48rem;
  font-weight: 800;

  letter-spacing: 0.1em;
}


.reflection-card {
  width:
      min(
          100%,
          49rem
      );

  margin: 0 auto;

  display: grid;

  grid-template-columns:
      auto
      minmax(
          0,
          1fr
      );

  gap: 1rem;

  padding:
      clamp(
          0.8rem,
          1.6vw,
          1.3rem
      );

  box-sizing: border-box;

  background:
      rgba(
          6,
          9,
          30,
          0.8
      );

  border:
      1px solid
      rgba(
          75,
          200,
          255,
          0.25
      );
}


.reflection-symbol {
  width: 2.6rem;
  height: 2.6rem;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(
          155,
          79,
          255,
          0.55
      );

  transform:
      rotate(45deg);
}


.reflection-symbol span {
  width: 0.45rem;
  height: 0.45rem;

  border-radius: 50%;

  background: var(--blue);

  box-shadow:
      0
      0
      0.7rem
      var(--blue);
}


.reflection-label {
  display: block;

  margin-bottom: 0.45rem;

  color: var(--blue);

  font-size: 0.48rem;
  font-weight: 900;

  letter-spacing: 0.13em;
}


.reflection-content p {
  margin: 0;

  color:
      rgba(
          232,
          244,
          255,
          0.92
      );

  font-size:
      clamp(
          0.72rem,
          0.92vw,
          0.94rem
      );

  line-height: 1.6;
}


.summary-brief-card
.reflection-content p {
  white-space: pre-wrap;

  overflow-wrap: anywhere;
}


.reflection-meta {
  width:
      min(
          100%,
          49rem
      );

  margin:
      0.7rem
      auto
      0;

  display: grid;

  grid-template-columns:
      repeat(
          2,
          minmax(
              0,
              1fr
          )
      );

  gap: 0.7rem;
}


.meta-card {
  padding:
      0.7rem
      0.85rem;

  background:
      rgba(
          5,
          7,
          25,
          0.68
      );

  border:
      1px solid
      rgba(
          255,
          255,
          255,
          0.06
      );
}


.meta-card span {
  display: block;

  margin-bottom: 0.3rem;

  color: var(--dim);

  font-size: 0.44rem;
  font-weight: 900;

  letter-spacing: 0.12em;
}


.meta-card strong {
  font-size:
      clamp(
          0.62rem,
          0.82vw,
          0.8rem
      );
}


.objective-grid {
  width:
      min(
          100%,
          51rem
      );

  margin: 0 auto;

  display: grid;

  grid-template-columns:
      repeat(
          2,
          minmax(
              0,
              1fr
          )
      );

  gap:
      clamp(
          0.5rem,
          0.9vw,
          0.8rem
      );
}


.objective-card {
  position: relative;

  min-width: 0;

  display: grid;

  grid-template-columns:
      auto
      minmax(
          0,
          1fr
      );

  align-items: center;

  gap: 0.8rem;

  padding:
      clamp(
          0.7rem,
          1.1vw,
          0.95rem
      );

  overflow: hidden;

  text-align: left;

  background:
      rgba(
          5,
          7,
          27,
          0.75
      );

  border:
      1px solid
      rgba(
          255,
          255,
          255,
          0.07
      );

  cursor: pointer;

  transition:
      transform 200ms ease,
      border-color 200ms ease,
      background 200ms ease;
}


.objective-card:hover {
  transform:
      translateY(-0.15rem);

  border-color:
      rgba(
          75,
          200,
          255,
          0.36
      );
}


.objective-card.selected {
  border-color:
      rgba(
          75,
          200,
          255,
          0.8
      );

  background:
      rgba(
          30,
          100,
          160,
          0.13
      );

  box-shadow:
      inset
      0
      0
      1.5rem
      rgba(
          75,
          200,
          255,
          0.08
      );
}


.objective-mark {
  position: relative;

  width: 2.4rem;
  height: 2.4rem;

  display: grid;
  place-items: center;
}


.objective-ring {
  position: absolute;

  inset: 0.3rem;

  border-radius: 50%;

  border:
      1px solid
      rgba(
          75,
          200,
          255,
          0.28
      );

  transition:
      transform 200ms ease,
      border-color 200ms ease,
      box-shadow 200ms ease;
}


.objective-core {
  width: 0.35rem;
  height: 0.35rem;

  border-radius: 50%;

  background:
      rgba(
          75,
          200,
          255,
          0.22
      );
}


.objective-card.selected
.objective-ring {
  transform:
      scale(1.1);

  border-color:
      var(--blue);

  box-shadow:
      0
      0
      0.7rem
      rgba(
          75,
          200,
          255,
          0.35
      );
}


.objective-card.selected
.objective-core {
  background: var(--blue);

  box-shadow:
      0
      0
      0.55rem
      var(--blue);
}


.objective-copy h3 {
  margin: 0;

  font-size:
      clamp(
          0.72rem,
          1vw,
          0.98rem
      );
}


.objective-copy p {
  margin:
      0.3rem
      0
      0;

  color: var(--soft);

  font-size:
      clamp(
          0.54rem,
          0.68vw,
          0.68rem
      );

  line-height: 1.4;
}


.selected-edge {
  position: absolute;

  left: 0;
  bottom: 0;

  width: 100%;
  height: 2px;

  background:
      linear-gradient(
          to right,
          var(--purple),
          var(--blue)
      );

  transform:
      scaleX(0);

  transform-origin: left;

  transition:
      transform 260ms ease;
}


.objective-card.selected
.selected-edge,
.approach-card.selected
.selected-edge {
  transform:
      scaleX(1);
}


.clarify-layout {
  width:
      min(
          100%,
          52rem
      );

  margin: 0 auto;

  display: grid;

  grid-template-columns:
      minmax(
          0,
          1fr
      )
      minmax(
          10rem,
          15rem
      );

  gap:
      clamp(
          0.6rem,
          1vw,
          1rem
      );
}


.context-input {
  min-width: 0;

  padding:
      clamp(
          0.75rem,
          1.3vw,
          1.05rem
      );

  box-sizing: border-box;

  background:
      rgba(
          5,
          7,
          27,
          0.78
      );

  border:
      1px solid
      rgba(
          75,
          200,
          255,
          0.2
      );
}


.context-input textarea {
  display: block;

  width: 100%;

  min-height:
      clamp(
          6rem,
          14vh,
          10rem
      );

  box-sizing: border-box;

  padding: 0;

  resize: none;

  border: 0;
  outline: 0;

  background: transparent;

  color: var(--text);

  font-size:
      clamp(
          0.68rem,
          0.85vw,
          0.84rem
      );

  line-height: 1.55;
}


.context-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 0.8rem;

  box-sizing: border-box;

  background:
      rgba(
          5,
          7,
          27,
          0.72
      );

  border:
      1px solid
      rgba(
          155,
          79,
          255,
          0.24
      );

  text-align: center;
}


.status-kicker {
  color: var(--purple-bright);

  font-size: 0.46rem;
  font-weight: 900;

  letter-spacing: 0.14em;
}


.status-orbit {
  position: relative;

  width:
      clamp(
          5.5rem,
          8vw,
          7.5rem
      );

  aspect-ratio: 1;

  margin:
      0.8rem
      0;

  display: grid;
  place-items: center;
}


.orbit {
  position: absolute;

  border-radius: 50%;

  border:
      1px solid
      rgba(
          155,
          79,
          255,
          0.4
      );
}


.orbit-a {
  width: 42%;
  height: 42%;
}


.orbit-b {
  width: 68%;
  height: 68%;

  opacity: 0.66;
}


.orbit-c {
  width: 94%;
  height: 94%;

  opacity: 0.3;
}


.status-orbit strong {
  color: var(--blue);

  font-size: 0.58rem;

  letter-spacing: 0.1em;
}


.context-status p {
  margin: 0;

  color: var(--soft);

  font-size:
      clamp(
          0.52rem,
          0.65vw,
          0.65rem
      );

  line-height: 1.4;
}


.approach-grid {
  width:
      min(
          100%,
          54rem
      );

  margin: 0 auto;

  display: grid;

  grid-template-columns:
      repeat(
          3,
          minmax(
              0,
              1fr
          )
      );

  gap:
      clamp(
          0.5rem,
          1vw,
          0.85rem
      );
}


.approach-card {
  position: relative;

  min-width: 0;

  padding:
      clamp(
          0.7rem,
          1.1vw,
          1rem
      );

  overflow: hidden;

  text-align: left;

  background:
      rgba(
          5,
          7,
          27,
          0.76
      );

  border:
      1px solid
      rgba(
          255,
          255,
          255,
          0.07
      );

  cursor: pointer;

  transition:
      transform 200ms ease,
      border-color 200ms ease,
      background 200ms ease;
}


.approach-card:hover {
  transform:
      translateY(-0.15rem);
}


.approach-card.selected {
  border-color:
      rgba(
          155,
          79,
          255,
          0.8
      );

  background:
      rgba(
          77,
          37,
          154,
          0.17
      );

  box-shadow:
      inset
      0
      0
      1.4rem
      rgba(
          155,
          79,
          255,
          0.1
      );
}


.approach-index {
  color: var(--blue);

  font-size: 0.46rem;
  font-weight: 900;

  letter-spacing: 0.14em;
}


.approach-card h3 {
  margin:
      0.35rem
      0
      0;

  font-size:
      clamp(
          0.76rem,
          1.1vw,
          1.05rem
      );
}


.approach-subtitle {
  display: block;

  margin-top: 0.16rem;

  color: var(--purple-bright);

  font-size:
      clamp(
          0.5rem,
          0.62vw,
          0.64rem
      );
}


.approach-card p {
  margin:
      0.45rem
      0
      0;

  color: var(--soft);

  font-size:
      clamp(
          0.5rem,
          0.64vw,
          0.65rem
      );

  line-height: 1.4;
}


.intensity-row {
  margin-top: 0.7rem;
}


.intensity-row > span {
  display: block;

  margin-bottom: 0.35rem;

  color: var(--dim);

  font-size: 0.42rem;
  font-weight: 900;

  letter-spacing: 0.12em;
}


.intensity-track {
  height: 2px;

  background:
      rgba(
          255,
          255,
          255,
          0.08
      );
}


.intensity-fill {
  display: block;

  height: 100%;

  background:
      linear-gradient(
          to right,
          var(--purple),
          var(--blue)
      );

  box-shadow:
      0
      0
      0.45rem
      rgba(
          90,
          150,
          255,
          0.75
      );
}


.summary-context-card {
  margin-top: 0.7rem;

  grid-template-columns:
      minmax(
          0,
          1fr
      );
}


.summary-context-card
.reflection-content p {
  white-space: pre-wrap;
}


.tune-summary {
  width:
      min(
          100%,
          54rem
      );

  margin:
      0.55rem
      auto
      0;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding:
      0.45rem
      0.65rem;

  box-sizing: border-box;

  border-top:
      1px solid
      rgba(
          75,
          200,
          255,
          0.12
      );
}


.tune-summary span {
  color: var(--dim);

  font-size: 0.44rem;
  font-weight: 900;

  letter-spacing: 0.12em;
}


.tune-summary strong {
  color: var(--blue-bright);

  font-size: 0.66rem;
}


.flow-footer {
  position: relative;

  z-index: 4;

  flex: 0 0 auto;

  min-height: 3.5rem;

  display: grid;

  grid-template-columns:
      minmax(
          0,
          1fr
      )
      auto;

  align-items: center;

  gap: 1rem;

  padding:
      0.45rem
      clamp(
          0.9rem,
          1.7vw,
          1.6rem
      );

  box-sizing: border-box;

  border-top:
      1px solid
      rgba(
          255,
          255,
          255,
          0.06
      );

  background:
      rgba(
          2,
          3,
          15,
          0.72
      );
}


.mediator-dialogue {
  min-width: 0;

  display: flex;
  align-items: center;

  gap: 0.55rem;

  overflow: hidden;

  color:
      rgba(
          215,
          230,
          246,
          0.86
      );

  font-size:
      clamp(
          0.56rem,
          0.74vw,
          0.74rem
      );

  white-space: nowrap;
  text-overflow: ellipsis;
}


.dialogue-symbol {
  flex: 0 0 auto;

  color: var(--blue);

  text-shadow:
      0
      0
      0.5rem
      var(--blue);
}


.continue-button {
  min-width:
      clamp(
          10rem,
          15vw,
          13.5rem
      );

  min-height: 2.3rem;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 0.7rem;

  padding:
      0.5rem
      1rem;

  border:
      1px solid
      rgba(
          155,
          79,
          255,
          0.74
      );

  background:
      linear-gradient(
          90deg,
          rgba(
              66,
              15,
              128,
              0.45
          ),
          rgba(
              22,
              12,
              70,
              0.85
          )
      );

  cursor: pointer;

  box-shadow:
      inset
      0
      0
      1rem
      rgba(
          155,
          79,
          255,
          0.14
      ),
      0
      0
      0.8rem
      rgba(
          155,
          79,
          255,
          0.14
      );

  transition:
      opacity 180ms ease,
      filter 180ms ease,
      box-shadow 180ms ease;
}


.continue-button:hover:not(:disabled) {
  filter:
      brightness(1.22);

  box-shadow:
      inset
      0
      0
      1.3rem
      rgba(
          155,
          79,
          255,
          0.2
      ),
      0
      0
      1.1rem
      rgba(
          155,
          79,
          255,
          0.38
      );
}


.continue-button:disabled {
  opacity: 0.3;

  cursor: not-allowed;
}


.continue-button svg {
  width: 1rem;
  height: 1rem;

  fill: none;

  stroke: var(--blue);

  stroke-width: 1.8;

  stroke-linecap: round;
  stroke-linejoin: round;
}


.locking-overlay {
  position: absolute;

  inset: 0;

  z-index: 50;

  display: grid;
  place-items: center;

  background:
      rgba(
          2,
          2,
          14,
          0.97
      );

  backdrop-filter:
      blur(0.8rem);
}


.locking-core {
  position: relative;

  width:
      min(
          22rem,
          85%
      );

  aspect-ratio: 1;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  text-align: center;
}


.lock-ring {
  position: absolute;

  border-radius: 50%;

  border:
      1px solid
      rgba(
          75,
          200,
          255,
          0.3
      );

  animation:
      lockPulse
      1.15s
      ease-out
      infinite;
}


.ring-one {
  width: 42%;
  height: 42%;
}


.ring-two {
  width: 66%;
  height: 66%;

  opacity: 0.55;

  animation-delay: 120ms;
}


.ring-three {
  width: 88%;
  height: 88%;

  opacity: 0.25;

  animation-delay: 240ms;
}


.locking-symbol {
  width: 4.7rem;
  height: 4.7rem;

  margin-bottom: 1rem;

  fill: none;

  stroke: var(--blue);

  stroke-width: 2;

  filter:
      drop-shadow(
          0
          0
          0.8rem
          rgba(
              75,
              200,
              255,
              0.85
          )
      );
}


.locking-kicker {
  color: var(--blue);

  font-size: 0.56rem;
  font-weight: 900;

  letter-spacing: 0.2em;
}


.locking-core h2 {
  margin:
      0.55rem
      0
      0;

  font-size:
      clamp(
          1.3rem,
          2vw,
          1.8rem
      );
}


.locking-core p {
  margin:
      0.4rem
      0
      0;

  color: var(--soft);

  font-size: 0.7rem;
}


@keyframes lockPulse {
  0% {
    transform:
        scale(0.92);

    opacity: 0.2;
  }

  50% {
    opacity: 1;
  }

  100% {
    transform:
        scale(1.06);

    opacity: 0.12;
  }
}


.flow-swap-enter-active,
.flow-swap-leave-active {
  transition:
      opacity 200ms ease,
      transform
      340ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      filter 240ms ease;
}


.flow-swap-enter-from {
  opacity: 0;

  transform:
      translateX(1.5rem);

  filter:
      blur(2px);
}


.flow-swap-leave-to {
  opacity: 0;

  transform:
      translateX(-0.9rem);

  filter:
      blur(2px);
}


.locking-enter-active,
.locking-leave-active {
  transition:
      opacity 280ms ease;
}


.locking-enter-from,
.locking-leave-to {
  opacity: 0;
}


@media (max-width: 1180px) {
  .holo-frame {
    width:
        min(
            76rem,
            84vw
        );
  }


  .step-copy {
    display: none;
  }


  .scene-assembly {
    width:
        min(
            108%,
            calc(
                90dvh *
                1.7778
            )
        );
  }


  .mediator-character {
    width: 25%;
    height: 84%;
  }


  .solo-table {
    width: 84%;
  }
}


@media (max-width: 760px) {
  .calibration-interface {
    padding:
        3.2rem
        0.4rem
        0;
  }


  .holo-frame {
    width: 100%;

    height:
        min(
            61dvh,
            37rem
        );

    clip-path:
        polygon(
            1.5% 0,
            98.5% 0,
            100% 2.5%,
            100% 97.5%,
            98.5% 100%,
            1.5% 100%,
            0 97.5%,
            0 2.5%
        );
  }


  .flow-navigation {
    grid-template-columns:
        minmax(
            0,
            1fr
        );

    min-height: 2.8rem;

    padding:
        0.35rem
        0.55rem;
  }


  .mode-badge {
    display: none;
  }


  .flow-step {
    padding: 0.1rem;
  }


  .step-symbol {
    width: 1.28rem;
    height: 1.28rem;
  }


  .step-symbol span {
    font-size: 0.36rem;
  }


  .flow-heading {
    padding-top: 0.5rem;
  }


  .flow-heading h1 {
    font-size:
        clamp(
            1rem,
            5vw,
            1.45rem
        );
  }


  .page-description {
    font-size: 0.6rem;

    margin-bottom: 0.45rem;
  }


  .flow-page {
    padding:
        0.35rem
        0.7rem;
  }


  .objective-grid {
    grid-template-columns: 1fr;
  }


  .clarify-layout {
    grid-template-columns: 1fr;
  }


  .context-status {
    display: none;
  }


  .approach-grid {
    grid-template-columns: 1fr;
  }


  .brief-input textarea,
  .context-input textarea {
    min-height: 5rem;
  }


  .reflection-meta {
    grid-template-columns: 1fr;
  }


  .flow-footer {
    grid-template-columns: 1fr;

    padding:
        0.4rem
        0.55rem;
  }


  .mediator-dialogue {
    display: none;
  }


  .continue-button {
    width: 100%;
  }


  .scene-assembly {
    bottom:
        clamp(
            4rem,
            9vh,
            6.5rem
        );

    width:
        min(
            145%,
            calc(
                76dvh *
                1.7778
            )
        );
  }


  .mediator-character {
    width: 23%;
    height: 78%;
  }


  .solo-table {
    width: 88%;
  }


  .page-back {
    top: 0.7rem;
    left: 0.7rem;

    padding:
        0.45rem
        0.65rem;

    font-size: 0.8rem;
  }
}


@media
(max-height: 720px)
and
(min-width: 761px) {
  .calibration-interface {
    padding-top: 0.5rem;
  }


  .holo-frame {
    width:
        min(
            64rem,
            72vw
        );

    height:
        min(
            76dvh,
            32rem
        );
  }


  .flow-navigation {
    min-height: 2.8rem;

    padding-top: 0.35rem;
    padding-bottom: 0.35rem;
  }


  .flow-heading {
    padding-top: 0.4rem;
  }


  .flow-heading h1 {
    font-size: 1.3rem;
  }


  .page-description {
    margin-bottom: 0.45rem;

    line-height: 1.35;
  }


  .brief-input textarea {
    min-height: 4.5rem;
  }


  .context-input textarea {
    min-height: 4.5rem;
  }


  .flow-footer {
    min-height: 2.8rem;
  }


  .scene-assembly {
    bottom: -0.5rem;

    width:
        min(
            100%,
            calc(
                106dvh *
                1.7778
            ),
            96rem
        );
  }


  .mediator-character {
    width: 21%;
    height: 76%;
  }


  .solo-table {
    width: 76%;
  }
}


@media
(max-height: 560px)
and
(min-width: 761px) {
  .calibration-interface {
    padding-top: 0.2rem;
  }


  .holo-frame {
    width:
        min(
            70vw,
            58rem
        );

    height: 80dvh;
  }


  .flow-navigation {
    min-height: 2.4rem;
  }


  .flow-heading {
    padding-top: 0.2rem;
  }


  .flow-heading h1 {
    font-size: 1.05rem;
  }


  .page-description {
    display: none;
  }


  .flow-page {
    padding-top: 0.25rem;
  }


  .scene-assembly {
    width:
        min(
            94%,
            calc(
                115dvh *
                1.7778
            )
        );
  }


  .mediator-dialogue {
    font-size: 0.55rem;
  }
}


@media
(max-width: 760px)
and
(min-height: 850px) {
  .holo-frame {
    height:
        min(
            57dvh,
            38rem
        );
  }


  .scene-assembly {
    bottom:
        clamp(
            4.8rem,
            10vh,
            7.5rem
        );

    width:
        min(
            150%,
            calc(
                68dvh *
                1.7778
            )
        );
  }
}


@media
(min-aspect-ratio: 21 / 9)
and
(min-width: 1400px) {
  .holo-frame {
    width:
        min(
            72rem,
            56vw
        );
  }


  .scene-assembly {
    width:
        min(
            88vw,
            calc(
                94dvh *
                1.7778
            ),
            112rem
        );
  }
}


@media (
prefers-reduced-motion:
    reduce
) {
  .flow-swap-enter-active,
  .flow-swap-leave-active,
  .locking-enter-active,
  .locking-leave-active {
    transition:
        opacity 120ms ease;
  }


  .flow-swap-enter-from,
  .flow-swap-leave-to {
    transform: none;

    filter: none;
  }


  .lock-ring {
    animation: none;
  }
}
</style>


