<script setup>
import {
  computed,
  isProxy,
  isRef,
  onBeforeUnmount,
  onMounted,
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
   Supplies the user's currently selected council
   configuration when there is not yet a frozen
   backend session snapshot.

   currentDiscussionStore:
   Receives the live calibration brief, panel
   participants, mediator, and eventually the
   authoritative backend discussion snapshot.
================================================== */

const profileStore =
    useProfileStore()

const currentDiscussionStore =
    useCurrentDiscussionStore()


/* ==================================================
   LOCAL PLAIN VALUE HELPER

   Values coming from props, computed refs, Pinia,
   and the profile store may be reactive proxies.

   This helper recursively unwraps Vue refs and
   proxies before values are:

   - copied into request payloads
   - emitted to ChamberFlow
   - used to seed discussion draft state

   IMPORTANT:

   Pinia will make state reactive again after it is
   assigned to the store.

   currentDiscussion.js must therefore still unwrap
   its own request-context values before calling
   structuredClone().
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

   ChamberFlow may temporarily expose a frontend-only
   session ID such as:

       draft-1783346726362

   That ID exists only for local transition state.

   It must never be sent to:

       GET
       /chamber/sessions/{id}/discussion/

   Only persisted backend session IDs are allowed to
   activate discussion state.
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
          String(sessionId)
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
    Once the backend creates the session, ChamberFlow
    can pass the created session object back here.

    Before creation this may be null.
  */

  session: {
    type: Object,
    default: null
  },


  councilMode: {
    type: String,
    default: 'panel'
  },


  /*
    Supports returning to calibration with previously
    entered values.
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
   OBJECTIVE OPTIONS
================================================== */

const objectiveOptions = [
  {
    id: 'clarity',

    label: 'Gain clarity',

    text:
        'Untangle the situation and understand what the real issue actually is.'
  },

  {
    id: 'decision',

    label: 'Make a decision',

    text:
        'Compare the available paths and leave with a clear next move.'
  },

  {
    id: 'reflection',

    label: 'Think it through',

    text:
        'Explore the matter properly without forcing a conclusion too early.'
  },

  {
    id: 'resolution',

    label: 'Resolve a conflict',

    text:
        'Examine competing priorities and find a workable way forward.'
  }
]


/* ==================================================
   COUNCIL APPROACH OPTIONS
================================================== */

const approaches = [
  {
    id: 'supportive',

    index: '01',

    title: 'Supportive',

    subtitle: 'Build with me',

    description:
        'Gentle guidance that helps strengthen your idea while carefully identifying weak spots.',

    intensity: 34
  },

  {
    id: 'balanced',

    index: '02',

    title: 'Balanced',

    subtitle: 'Challenge and guide',

    description:
        'A healthy mix of encouragement and pushback so the council stays constructive.',

    intensity: 64
  },

  {
    id: 'adversarial',

    index: '03',

    title: 'Adversarial',

    subtitle: 'Pressure-test me',

    description:
        'Sharper scrutiny designed to challenge assumptions, find contradictions, and expose gaps.',

    intensity: 94
  }
]


/* ==================================================
   CALIBRATION STEPS
================================================== */

const steps = [
  {
    number: '01',

    short: 'Brief',

    label: 'BRIEF',

    panelTitle:
        'SHARE YOUR IDEA',

    panelSubtitle:
        'Tell me what the chamber should help you with.'
  },

  {
    number: '02',

    short: 'Objective',

    label: 'OBJECTIVE',

    panelTitle:
        'CHOOSE AN OUTCOME',

    panelSubtitle:
        'What would make this discussion genuinely useful for you?'
  },

  {
    number: '03',

    short: 'Context',

    label: 'CONTEXT',

    panelTitle:
        'ADD CONTEXT',

    panelSubtitle:
        'Anything that changes the picture should be included here.'
  },

  {
    number: '04',

    short: 'Tone',

    label: 'TONE',

    panelTitle:
        'TUNE THE COUNCIL',

    panelSubtitle:
        'Choose how strongly the council should challenge your thinking.'
  }
]


/* ==================================================
   MEDIATOR DIALOGUE

   These lines are presentation-only.

   They guide the calibration flow but are not
   persisted as actual DebateMessage records.
================================================== */

const dialogueByMediator = {
  'yuna-tsukino': [
    [
      'All right, council assembled. Try not to traumatize the question before we understand it.',
      'Start with the messy version. I’ll help untangle it before everyone develops opinions.'
    ],
    [
      'Okay, what are we actually trying to leave this room with?',
      'Clarity? A decision? Emotional damage? Pick the useful one.'
    ],
    [
      'Tiny timeout before we unleash the council.',
      'What context would make everyone give completely different advice if they knew it?'
    ],
    [
      'Last one. How sharp do you want the room today?',
      'Gentle, balanced, or full pressure test. Choose responsibly. Or dramatically. Your call.'
    ]
  ],

  'aoi-serizawa': [
    [
      'We will begin by defining the matter before the council.',
      'Describe the situation as clearly as possible. Precision now will improve the discussion that follows.'
    ],
    [
      'Next, we should establish the desired outcome.',
      'A discussion cannot be evaluated properly without knowing what resolution would make it useful.'
    ],
    [
      'Now provide any information that materially affects the decision.',
      'Relevant constraints, history, stakeholders, and prior attempts should be recorded before deliberation begins.'
    ],
    [
      'Finally, select the level of scrutiny you wish the council to apply.',
      'This will affect the intensity of challenge, not the fairness of the discussion.'
    ]
  ],

  'mika-amane': [
    [
      'Hi! Okay, everyone is here, nobody has started arguing yet—amazing start.',
      'Tell me what’s going on. Messy is fine! We’ll clean it up together.'
    ],
    [
      'Okaaay, next question! What do you actually want from us?',
      'A decision? Clarity? Space to think? No wrong answer, but I need the honest one.'
    ],
    [
      'Context time!',
      'People involved, deadlines, previous disasters, emotional complications—give me the stuff that changes the picture.'
    ],
    [
      'Last step! How spicy are we making the council today?',
      'Supportive, balanced, or pressure-test mode. And yes, I will try to stop them from emotionally murdering each other.'
    ]
  ],

  'ren-kurogane': [
    [
      'State the issue.',
      'Be direct. We can examine complexity after the target is clear.'
    ],
    [
      'Define the outcome.',
      'What specifically must this discussion accomplish?'
    ],
    [
      'Add relevant context.',
      'Constraints, deadlines, previous attempts, dependencies. Leave out anything that does not affect the decision.'
    ],
    [
      'Choose the level of resistance you want from the council.',
      'Supportive, balanced, or adversarial. Decide.'
    ]
  ],

  'hikari-fuyuno': [
    [
      'Take your time.',
      'Tell me what brought you here, even if you are not completely sure how to explain it yet.'
    ],
    [
      'Now, think about what you hope will feel clearer when this discussion ends.',
      'You do not need to force yourself toward a decision if understanding is what you actually need.'
    ],
    [
      'Is there anything important sitting behind the question?',
      'History, pressure, other people, fear, practical limits—anything that changes how this situation feels or works.'
    ],
    [
      'One last thing.',
      'How gently or directly would you like the council to challenge your thinking today?'
    ]
  ]
}


/* ==================================================
   CALIBRATION SOURCE

   Supports:

   existingCalibration = {
     topic,
     objective,
     ...
   }

   and:

   existingCalibration = {
     calibration: {
       topic,
       objective,
       ...
     }
   }
================================================== */

const calibrationSource = computed(() => {
  return (
      props.existingCalibration
          ?.calibration ??

      props.existingCalibration ??

      {}
  )
})


/* ==================================================
   INITIAL OBJECTIVE

   Stored calibration may contain either:

   objectiveId: "decision"

   or:

   objective: "Make a decision"
================================================== */

const initialObjective = () => {
  const directId =
      calibrationSource.value
          ?.objectiveId ??

      calibrationSource.value
          ?.objective_id


  if (directId) {
    return directId
  }


  const storedLabel =
      calibrationSource.value
          ?.objective


  return (
      objectiveOptions.find(
          option =>
              option.label ===
              storedLabel
      )?.id ??
      ''
  )
}


/* ==================================================
   LOCAL UI STATE
================================================== */

const step =
    ref(0)


/*
  Locks navigation during the transition out of
  calibration.
*/

const isLocking =
    ref(false)


/*
  Final review confirmation modal.
*/

const showReviewModal =
    ref(false)


/*
  Tracks whether the backend discussion has already
  been activated for the current session.

  This prevents repeated GET requests if the same
  session prop is updated several times.
*/

const activatedSessionId =
    ref(null)


/*
  Stores an activation failure separately from the
  main store error state for optional template use.
*/

const activationError =
    ref(null)


/*
  Tracks in-flight activation requests by persisted
  session ID.

  The session prop can be replaced or updated more
  than once during the transition into DiscussionPage.

  This map prevents duplicate GET /discussion/
  requests for the same backend session while one is
  already running.
*/

const activationPromises =
    new Map()


/*
  Used to avoid animation callbacks mutating local UI
  state after the component has unmounted.
*/

let componentUnmounted =
    false


/* ==================================================
   INTRO ANIMATION STATE
================================================== */

const introSequence = ref({
  sceneSettled: false,

  ui: false,

  character: false,

  textbox: false,

  toolbar: false,

  text: false
})


const introTimers = []


const scheduleIntro = (
    callback,
    delay
) => {
  const timer =
      window.setTimeout(
          () => {

            if (
                componentUnmounted
            ) {
              return
            }


            callback()
          },

          delay
      )


  introTimers.push(
      timer
  )
}


/* ==================================================
   CALIBRATION FORM
================================================== */

const form = ref({
  topic:
      calibrationSource.value
          ?.topic ??
      '',


  objective:
      initialObjective(),


  context:
      calibrationSource.value
          ?.context ??
      '',


  approach:
      calibrationSource.value
          ?.approach ??
      'balanced'
})


/* ==================================================
   PANEL MEMBER SOURCE

   Priority:

   1. Frozen participants from an existing session.
   2. Current profile council selection.

   Once the backend discussion snapshot is loaded,
   currentDiscussion will receive the authoritative
   frozen participant snapshots from Django.
================================================== */

const panelMembers = computed(() => {
  const sessionMembers =
      props.session
          ?.panelMembers ??

      props.session
          ?.panel_members ??

      props.session
          ?.panelSnapshot ??

      props.session
          ?.panel_snapshot


  if (
      Array.isArray(
          sessionMembers
      ) &&
      sessionMembers.length
  ) {
    return sessionMembers
  }


  return (
      profileStore
          .councilMembers ??

      profileStore
          .panel ??

      []
  )
})


/* ==================================================
   MEDIATOR SOURCE
================================================== */

const mediator = computed(() => {
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

      null
  )
})


/* ==================================================
   CHARACTER IMAGE HELPERS
================================================== */

const characterImage = character => {
  if (!character?.id) {
    return ''
  }


  return (
      `/images/chamber/char/` +
      `${character.id}/` +
      `NeonOffice.png`
  )
}


/*
  Mediator files live one directory deeper:

  /char/{id}/mediator/NeonOffice.png
*/

const mediatorImage = computed(() => {
  if (!mediator.value?.id) {
    return ''
  }


  return (
      `/images/chamber/char/` +
      `${mediator.value.id}/` +
      `mediator/NeonOffice.png`
  )
})


const mediatorName = computed(() =>
    mediator.value?.name ??
    'Iris'
)


/* ==================================================
   FLOW COMPUTEDS
================================================== */

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


const currentDialogue = computed(() => {
  const mediatorId =
      mediator.value?.id

  const dialogueSet =
      dialogueByMediator[
          mediatorId
          ]
      ??
      dialogueByMediator[
          'yuna-tsukino'
          ]

  return (
      dialogueSet[
          step.value
          ]
      ??
      [
        'Let’s continue.',
        'We’ll take this one step at a time.'
      ]
  )
})


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
        item =>
            item.id ===
            form.value.approach
    ) ??
    approaches[1]
)


/* ==================================================
   REVIEW CONTENT
================================================== */

const briefPreview = computed(() => {
  const value =
      form.value.topic
          .trim()


  if (!value) {
    return 'No topic added yet.'
  }


  if (
      value.length <=
      420
  ) {
    return value
  }


  return (
      `${value
          .slice(
              0,
              420
          )
          .trim()}…`
  )
})


const contextPreview = computed(() => {
  const value =
      form.value.context
          .trim()


  if (!value) {
    return (
        'No additional context was provided.'
    )
  }


  if (
      value.length <=
      320
  ) {
    return value
  }


  return (
      `${value
          .slice(
              0,
              320
          )
          .trim()}…`
  )
})


const assistantSummary = computed(() => {
  const objectiveText =
      selectedObjective.value
          ?.label
          ?.toLowerCase() ??
      'clarify the situation'


  const approachTitle =
      selectedApproach.value
          ?.title
          ?.toLowerCase() ??
      'balanced'


  if (
      !form.value.topic
          .trim()
  ) {
    return (
        'You would like help preparing a council discussion, ' +
        'and you want the chamber set up clearly before proceeding.'
    )
  }


  return (
      `You’d like the panel to help you ${objectiveText}, ` +
      `and you want the discussion framed with a ` +
      `${approachTitle} response style.`
  )
})


/* ==================================================
   CALIBRATION PAYLOAD

   This is the calibration object persisted by the
   backend in DebateSession.calibration_context.

   The current UI only directly collects:

   topic
   objective
   context
   approach

   The remaining arrays are prepared now so the
   backend contract stays stable when those fields
   become editable later.
================================================== */

const calibrationPayload = computed(() => ({
  topic:
      form.value.topic
          .trim(),


  objective:
      selectedObjective.value
          ?.label ??
      form.value.objective,


  objectiveId:
  form.value.objective,


  context:
      form.value.context
          .trim(),


  approach:
  form.value.approach,


  councilMode:
      'panel',


  desiredOutcome:
      calibrationSource.value
          ?.desiredOutcome ??

      calibrationSource.value
          ?.desired_outcome ??

      '',


  constraints:
      Array.isArray(
          calibrationSource.value
              ?.constraints
      )
          ? [
            ...calibrationSource.value
                .constraints
          ]
          : [],


  assumptions:
      Array.isArray(
          calibrationSource.value
              ?.assumptions
      )
          ? [
            ...calibrationSource.value
                .assumptions
          ]
          : [],


  questions:
      Array.isArray(
          calibrationSource.value
              ?.questions
      )
          ? [
            ...calibrationSource.value
                .questions
          ]
          : [],


  additionalNotes:
      calibrationSource.value
          ?.additionalNotes ??

      calibrationSource.value
          ?.additional_notes ??

      ''
}))


/* ==================================================
   PARTICIPANT API NORMALIZATION

   The frontend profile objects may use either:

   debateStyle
   debate_style

   focusAreas
   focus_areas
   expertise

   We normalize everything before both:

   1. Sending to Django.
   2. Seeding currentDiscussion.
================================================== */

const normalizePersonality = value => {
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
      'string' &&
      value.trim()
  ) {
    return [
      value.trim()
    ]
  }


  return []
}


const normalizeFocusAreas = participant => {
  const value =
      participant?.focusAreas ??
      participant?.focus_areas ??
      participant?.expertise ??
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
    fallbackRole = 'Council Member'
) => {
  if (!participant?.id) {
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
   NORMALIZED DISCUSSION PARTICIPANTS

   These are used by both the session request and the
   currentDiscussion Pinia store.

   This is important because the visual discussion
   page should already know which character belongs
   in which position before the first AI generation
   call begins.
================================================== */

const normalizedPanel = computed(() =>
    panelMembers.value
        .map(
            member =>
                participantPayload(
                    member,
                    'Council Member'
                )
        )
        .filter(Boolean)
)


const normalizedMediator = computed(() =>
    participantPayload(
        mediator.value,
        'Mediator'
    )
)


/* ==================================================
   FULL SESSION REQUEST

   Django receives:

   mode
   title
   calibration
   panelMembers
   mediator

   The calibration fields are also kept flat for
   compatibility with the existing ChamberFlow code.
================================================== */

const startSessionPayload = computed(() => {
  const calibration =
      toPlainValue(
          calibrationPayload.value
      )


  const panel =
      toPlainValue(
          normalizedPanel.value
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
      StartDebateSessionSerializer fields.
    */

    mode:
        'panel',


    title:
        calibration.topic
            .slice(
                0,
                255
            ),


    calibration,


    panelMembers:
    panel,


    mediator:
    mediatorSnapshot
  }
})


/* ==================================================
   DISCUSSION DRAFT SYNC

   This function prepares currentDiscussion before
   the DiscussionPage mounts.

   It synchronizes:

   calibration brief
   model context seed
   panel participants
   panel order
   mediator snapshot

   Django remains authoritative once loadDiscussion()
   returns the persisted discussion snapshot.
================================================== */

const syncDiscussionDraft = () => {
  const calibration =
      toPlainValue(
          calibrationPayload.value
      )


  const panel =
      toPlainValue(
          normalizedPanel.value
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

     The backend will replace/extend this when the
     real discussion snapshot is loaded.
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

     setParticipants() also builds:

     participants.characters
     participants.characterOrder
     participants.mediator
  ================================================ */

  currentDiscussionStore.setParticipants({
    characters:
    panel,

    characterOrder:
        panel.map(
            character =>
                character.id
        ),

    mediator:
    mediatorSnapshot
  })
}


/* ==================================================
   LIVE STORE SYNCHRONIZATION

   Any calibration edit or participant change keeps
   currentDiscussion synchronized.

   This means the discussion scene can use the
   currentDiscussion store immediately for its
   character layout instead of going back to the
   profile store.
================================================== */

watch(
    [
      calibrationPayload,

      normalizedPanel,

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
   BACKEND DISCUSSION ACTIVATION

   The session creation endpoint initially returns a
   session in "ready" state.

   Calling:

   GET /discussion/

   causes the backend discussion service to:

   ready -> active
   round 0 -> round 1
   resolve active section
   create DebateRound 1
   return the complete discussion snapshot

   IMPORTANT:

   We do NOT call generateInitialRound() here.

   Initial response generation belongs in the actual
   DiscussionPage after it mounts. That prevents this
   calibration component and the DiscussionPage from
   racing each other and generating duplicate messages.
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
        A missing ID cannot be activated.
      */

      if (
          !normalizedSessionId
      ) {
        return null
      }


      /*
        Frontend draft IDs are transition state only.

        Never send them to Django.

        The session ID watcher will run again when
        ChamberFlow replaces the draft with the real
        backend UUID.
      */

      if (
          isDraftSessionId(
              normalizedSessionId
          )
      ) {

        console.debug(
            '[PanelCalibration] Waiting for persisted session:',
            normalizedSessionId
        )


        return null
      }


      /*
        Avoid activating the same successfully loaded
        session twice.
      */

      if (
          activatedSessionId.value ===
          normalizedSessionId
      ) {
        return null
      }


      /*
        Return the existing activation request when
        the same session is already being loaded.

        This prevents duplicate GET requests caused by
        prop updates during the stage transition.
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
                  Ensure the latest calibration and
                  character selection is present before
                  loading the authoritative backend
                  snapshot.
                */

                syncDiscussionDraft()


                /*
                  Seed session identity immediately.

                  loadDiscussion() will then hydrate the
                  store with authoritative backend state.
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
                  The component may have unmounted while
                  the request was running.

                  The store request itself is allowed to
                  finish, but local component state and
                  logging should not continue afterward.
                */

                if (
                    componentUnmounted
                ) {
                  return snapshot
                }


                /*
                  Record successful activation only after
                  loadDiscussion() resolves.

                  Failed requests remain retryable.
                */

                activatedSessionId.value =
                    normalizedSessionId


                console.log(
                    '[PanelCalibration] Discussion activated:',
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

                      characterOrder:
                      currentDiscussionStore
                          .participants
                          .characterOrder
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
            '[PanelCalibration] Discussion activation failed:',
            error
        )


        throw error

      } finally {

        /*
          Delete only the promise that belongs to this
          exact completed request.
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

   ChamberFlow may create the session asynchronously
   after this component emits "complete".

   When that real backend session appears here, we
   activate and hydrate the discussion store.
================================================== */

watch(
    () => props.session?.id,

    async nextSessionId => {

      /*
        Ignore missing IDs and frontend-only drafts.

        Watching only session.id also avoids repeated
        activation attempts caused by unrelated deep
        mutations to the session object.
      */

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
              '[PanelCalibration] Draft session detected. Waiting for backend UUID:',
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
          The store already contains structured error
          state through loadDiscussion().

          Do not throw from the watcher, otherwise Vue
          reports an unhandled watcher error.
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


  if (
      step.value ===
      1
  ) {
    return Boolean(
        form.value.objective
    )
  }


  return true
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

      normalizedPanel.value
          .length >
      0

      &&

      Boolean(
          normalizedMediator.value
              ?.id
      )
  )
})


const nextLabel = computed(() => {
  if (
      step.value ===
      steps.length -
      1
  ) {
    return 'Review Setup'
  }


  return 'Continue'
})


/* ==================================================
   FORM ACTIONS
================================================== */

const selectObjective = id => {
  form.value.objective =
      id
}


const selectApproach = id => {
  form.value.approach =
      id
}


/* ==================================================
   STEP NAVIGATION
================================================== */

const goToCompletedStep = index => {
  if (
      index >=
      step.value ||

      isLocking.value ||

      showReviewModal.value
  ) {
    return
  }


  step.value =
      index
}


const goNext = () => {
  if (
      !canContinue.value ||

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


  showReviewModal.value =
      true
}


const goBack = () => {
  if (
      isLocking.value
  ) {
    return
  }


  if (
      showReviewModal.value
  ) {
    showReviewModal.value =
        false

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


/* ==================================================
   FINAL CONFIRMATION

   The parent ChamberFlow remains responsible for:

   1. Receiving this payload.
   2. Calling the backend session creation endpoint.
   3. Saving activeSession in chamberStore.
   4. Transitioning to DiscussionPage.

   Before emitting, we perform one last discussion
   store synchronization so no last-second input can
   be missing from the frontend state.
================================================== */

const confirmProceed = () => {
  if (
      !canStartSession.value ||

      isLocking.value
  ) {
    return
  }


  /*
    Final store synchronization.
  */

  syncDiscussionDraft()


  const payload =
      toPlainValue(
          startSessionPayload.value
      )


  console.log(
      '[PanelCalibration] Complete payload:',
      payload
  )


  console.log(
      '[PanelCalibration] Discussion participants prepared:',
      {
        panel:
        currentDiscussionStore
            .participants
            .characterOrder,

        mediator:
            currentDiscussionStore
                .participants
                .mediator
                ?.id ??
            null
      }
  )


  showReviewModal.value =
      false


  isLocking.value =
      true


  /*
    Leave enough time for the visual closing
    transition before ChamberFlow changes stage.
  */

  window.setTimeout(
      () => {
        emit(
            'complete',
            payload
        )
      },

      1050
  )
}


/* ==================================================
   INTRO SEQUENCE
================================================== */

onMounted(() => {

  componentUnmounted =
      false


  scheduleIntro(
      () => {
        introSequence.value
            .sceneSettled =
            true
      },

      520
  )


  scheduleIntro(
      () => {
        introSequence.value
            .ui =
            true
      },

      1380
  )


  scheduleIntro(
      () => {
        introSequence.value
            .character =
            true
      },

      1760
  )


  scheduleIntro(
      () => {
        introSequence.value
            .textbox =
            true
      },

      2110
  )


  scheduleIntro(
      () => {
        introSequence.value
            .toolbar =
            true
      },

      2380
  )


  scheduleIntro(
      () => {
        introSequence.value
            .text =
            true
      },

      2620
  )
})


/* ==================================================
   CLEANUP
================================================== */

onBeforeUnmount(() => {

  componentUnmounted =
      true


  introTimers.forEach(
      timer => {

        window.clearTimeout(
            timer
        )
      }
  )


  introTimers.length =
      0
})
</script>


<template>
  <section class="panel-calibration">

    <!-- ==================================================
         BACKGROUND
    ================================================== -->

    <div
        class="pc-bg"
        :class="{
          'is-settled':
            introSequence.sceneSettled
        }"
    ></div>


    <div class="pc-vignette"></div>


    <!-- ==================================================
         BACK
    ================================================== -->

    <button
        class="
          pc-page-back
          pc-ui-reveal
          pc-ui-reveal--top
        "
        :class="{
          'is-visible':
            introSequence.ui
        }"
        @click="goBack"
    >

      <span class="pc-back-arrow">
        ←
      </span>


      <span>
        Back
      </span>

    </button>


    <!-- ==================================================
         TOP UI
    ================================================== -->

    <header
        class="
          pc-header
          pc-ui-reveal
          pc-ui-reveal--top
        "
        :class="{
          'is-visible':
            introSequence.ui
        }"
    >

      <div class="pc-hud-left">

        <div class="pc-day-badge">

          <span class="pc-day-icon">
            ✦
          </span>


          <div class="pc-day-copy">

            <strong>
              Panel Calibration
            </strong>


            <small>
              Prepare the Council
            </small>

          </div>

        </div>

      </div>


      <!-- =============================================
           FLOW
      ============================================== -->

      <div class="pc-flow">

        <button
            v-for="(
              item,
              index
            ) in steps"
            :key="item.number"
            class="pc-flow-step"
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

          <span class="pc-flow-gem"></span>


          <span class="pc-flow-copy">

            <small>
              {{ item.number }}
            </small>


            <strong>
              {{ item.short }}
            </strong>

          </span>

        </button>


        <div class="pc-progress-track">

          <span
              class="pc-progress-fill"
              :style="{
                width:
                  `${progress}%`
              }"
          ></span>

        </div>

      </div>


      <!-- =============================================
           STATUS
      ============================================== -->

      <div class="pc-hud-right">

        <div class="pc-system-status">

          <span class="pc-status-dot"></span>


          <strong>
            CHAMBER ONLINE
          </strong>

        </div>


        <button
            class="pc-mini-button"
            type="button"
        >
          LOG
        </button>


        <button
            class="pc-mini-button"
            type="button"
        >
          MENU
        </button>

      </div>

    </header>


    <!-- ==================================================
         PANEL SCENE
    ================================================== -->

    <div class="pc-scene-layer">

      <div
          class="pc-panel-scene"
          :class="{
            'is-settled':
              introSequence.sceneSettled
          }"
      >

        <div class="pc-panel-members">

          <div
              v-for="
                member in panelMembers
              "
              :key="member.id"
              class="pc-panel-member"
          >

            <img
                :src="
                  characterImage(
                    member
                  )
                "
                :alt="
                  member.name
                "
            >

          </div>

        </div>


        <img
            class="pc-group-table"
            src="/images/chamber/groupTable.png"
            alt=""
        >

      </div>

    </div>


    <!-- ==================================================
         MEDIATOR
    ================================================== -->

    <div
        class="pc-mediator-foreground"
        :class="{
          'is-visible':
            introSequence.character
        }"
    >

      <img
          v-if="mediatorImage"
          class="pc-mediator-standing"
          :src="mediatorImage"
          :alt="mediatorName"
      >

    </div>


    <!-- ==================================================
         INPUT PANEL
    ================================================== -->

    <aside
        class="
          pc-input-panel
          pc-ui-reveal
          pc-ui-reveal--side
        "
        :class="{
          'is-visible':
            introSequence.ui
        }"
    >

      <div class="pc-panel-head">

        <span class="pc-step-kicker">

          {{ currentStep.number }}

          /

          {{ steps.length }}

        </span>


        <h2>
          {{ currentStep.panelTitle }}
        </h2>


        <p>
          {{ currentStep.panelSubtitle }}
        </p>

      </div>


      <Transition
          name="pc-panel-swap"
          mode="out-in"
      >

        <!-- =========================================
             BRIEF
        ========================================== -->

        <div
            v-if="step === 0"
            key="brief"
            class="pc-panel-page"
        >

          <div
              class="
                pc-ornate-input
                pc-large-input
              "
          >

            <textarea
                v-model="form.topic"
                maxlength="3000"
                placeholder="Write your idea, question, or situation here..."
                @keydown.ctrl.enter.prevent="
                  goNext
                "
            ></textarea>


            <span class="pc-character-count">

              {{ form.topic.length }}

              /

              3000

            </span>

          </div>


          <button
              class="pc-main-action"
              :disabled="
                !canContinue
              "
              @click="goNext"
          >

            <span class="pc-action-star">
              ✦
            </span>


            <span>
              {{ nextLabel }}
            </span>

          </button>


          <p class="pc-action-note">
            I’ll use this to prepare the chamber’s starting frame.
          </p>

        </div>


        <!-- =========================================
             OBJECTIVE
        ========================================== -->

        <div
            v-else-if="
              step === 1
            "
            key="objective"
            class="pc-panel-page"
        >

          <div class="pc-objective-list">

            <button
                v-for="
                  option in
                  objectiveOptions
                "
                :key="option.id"
                class="pc-objective-option"
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

              <span class="pc-objective-radio">
                <span></span>
              </span>


              <span class="pc-objective-copy">

                <strong>
                  {{ option.label }}
                </strong>


                <small>
                  {{ option.text }}
                </small>

              </span>

            </button>

          </div>


          <button
              class="pc-main-action"
              :disabled="
                !canContinue
              "
              @click="goNext"
          >

            <span class="pc-action-star">
              ✦
            </span>


            <span>
              {{ nextLabel }}
            </span>

          </button>

        </div>


        <!-- =========================================
             CONTEXT
        ========================================== -->

        <div
            v-else-if="
              step === 2
            "
            key="context"
            class="pc-panel-page"
        >

          <div
              class="
                pc-ornate-input
                pc-context-input
              "
          >

            <textarea
                v-model="form.context"
                maxlength="1800"
                placeholder="Relevant background, deadlines, people involved, constraints, previous attempts, or anything else that changes the picture..."
            ></textarea>


            <span class="pc-character-count">

              {{ form.context.length }}

              /

              1800

            </span>

          </div>


          <div class="pc-context-signal">

            <span class="pc-signal-dot"></span>


            <span>

              {{
                form.context.length
                    ? 'Additional context registered.'
                    : 'Context is optional.'
              }}

            </span>

          </div>


          <button
              class="pc-main-action"
              @click="goNext"
          >

            <span class="pc-action-star">
              ✦
            </span>


            <span>
              {{ nextLabel }}
            </span>

          </button>

        </div>


        <!-- =========================================
             TONE
        ========================================== -->

        <div
            v-else
            key="tone"
            class="pc-panel-page"
        >

          <div class="pc-approach-list">

            <button
                v-for="
                  approach in
                  approaches
                "
                :key="approach.id"
                class="pc-approach-option"
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

              <span class="pc-approach-number">
                {{ approach.index }}
              </span>


              <span class="pc-approach-copy">

                <strong>
                  {{ approach.title }}
                </strong>


                <small>
                  {{ approach.subtitle }}
                </small>


                <em>
                  {{ approach.description }}
                </em>

              </span>


              <span class="pc-approach-meter">

                <span
                    :style="{
                      width:
                        `${approach.intensity}%`
                    }"
                ></span>

              </span>

            </button>

          </div>


          <div class="pc-response-profile">

            <span>
              Response Profile
            </span>


            <strong>
              {{ selectedApproach.title }}
            </strong>

          </div>


          <button
              class="pc-main-action"
              @click="goNext"
          >

            <span class="pc-action-star">
              ✦
            </span>


            <span>
              {{ nextLabel }}
            </span>

          </button>

        </div>

      </Transition>

    </aside>


    <!-- ==================================================
         VN DIALOGUE
    ================================================== -->

    <section
        class="pc-dialogue-shell"
        :class="{
          'is-visible':
            introSequence.textbox
        }"
    >

      <div class="pc-dialogue-nameplate">

        <strong>
          {{ mediatorName }}
        </strong>

      </div>


      <div
          class="pc-dialogue-toolbar"
          :class="{
            'is-visible':
              introSequence.toolbar
          }"
      >

        <button type="button">
          SAVE
        </button>


        <button type="button">
          SETTINGS
        </button>


        <button type="button">
          AUTO PLAY
        </button>


        <button type="button">
          SKIP
        </button>

      </div>


      <div
          class="pc-dialogue-copy"
          :class="{
            'is-visible':
              introSequence.text
          }"
      >

        <Transition
            name="pc-dialogue-swap"
            mode="out-in"
        >

          <div
              :key="step"
              class="pc-dialogue-lines"
          >

            <p>
              {{ currentDialogue[0] }}
            </p>


            <p>
              {{ currentDialogue[1] }}
            </p>

          </div>

        </Transition>

      </div>


      <button
          class="pc-dialogue-next"
          type="button"
          @click="goNext"
      >
        ›
      </button>

    </section>


    <!-- ==================================================
         REVIEW
    ================================================== -->

    <Transition name="pc-review">

      <div
          v-if="
            showReviewModal
          "
          class="pc-review-overlay"
      >

        <div class="pc-review-card">

          <div class="pc-review-head">

            <span class="pc-review-kicker">
              Review Before Proceeding
            </span>


            <h3>
              Confirm the chamber setup
            </h3>


            <p>
              Please check everything below before opening the discussion.
            </p>

          </div>


          <div class="pc-review-grid">

            <div class="pc-review-row">

              <span class="pc-review-label">
                Goal
              </span>


              <div class="pc-review-value">

                {{
                  selectedObjective
                      ?.label ??
                  'No objective selected.'
                }}

              </div>

            </div>


            <div class="pc-review-row">

              <span class="pc-review-label">
                Assistant Summary
              </span>


              <div class="pc-review-value">
                {{ assistantSummary }}
              </div>

            </div>


            <div class="pc-review-row">

              <span class="pc-review-label">
                Discussion Topic
              </span>


              <div class="pc-review-value">
                {{ briefPreview }}
              </div>

            </div>


            <div class="pc-review-row">

              <span class="pc-review-label">
                Context Notes
              </span>


              <div class="pc-review-value">
                {{ contextPreview }}
              </div>

            </div>


            <div class="pc-review-row">

              <span class="pc-review-label">
                Council Tone
              </span>


              <div class="pc-review-value">

                <strong>
                  {{ selectedApproach.title }}
                </strong>


                <small>
                  {{ selectedApproach.description }}
                </small>

              </div>

            </div>


            <div class="pc-review-row">

              <span class="pc-review-label">
                Panel
              </span>


              <div class="pc-review-value">

                {{
                  panelMembers.length
                }}

                members ready

              </div>

            </div>

          </div>


          <div class="pc-review-actions">

            <button
                class="
                  pc-review-button
                  secondary
                "
                @click="
                  showReviewModal = false
                "
            >
              Go Back
            </button>


            <button
                class="
                  pc-review-button
                  primary
                "
                :disabled="
                  !canStartSession
                "
                @click="
                  confirmProceed
                "
            >
              Confirm & Proceed
            </button>

          </div>

        </div>

      </div>

    </Transition>


    <!-- ==================================================
         LOCKING
    ================================================== -->

    <Transition name="pc-locking">

      <div
          v-if="isLocking"
          class="pc-locking-overlay"
      >

        <div class="pc-locking-card">

          <span
              class="
                pc-lock-orbit
                orbit-a
              "
          ></span>


          <span
              class="
                pc-lock-orbit
                orbit-b
              "
          ></span>


          <span
              class="
                pc-lock-orbit
                orbit-c
              "
          ></span>


          <div class="pc-lock-core">
            ✦
          </div>


          <span class="pc-lock-kicker">
            CALIBRATION COMPLETE
          </span>


          <h2>
            The chamber is ready.
          </h2>


          <p>
            Opening the council discussion channel.
          </p>

        </div>

      </div>

    </Transition>

  </section>
</template>

<style scoped>
.panel-calibration {
  --pc-blue: #4ccfff;
  --pc-blue-soft: #b9f4ff;

  --pc-cyan: #7deaff;

  --pc-purple: #a354ff;
  --pc-purple-deep: #6f35d9;
  --pc-purple-soft: #e2bdff;

  --pc-violet: #7d3bd7;

  --pc-text: #f7f3ff;
  --pc-text-soft: #c7bdd7;
  --pc-text-dim: #8d829f;

  --pc-panel:
      rgba(8, 8, 28, 0.88);

  --pc-panel-soft:
      rgba(15, 12, 42, 0.82);

  --pc-line:
      rgba(163, 84, 255, 0.52);

  --pc-line-blue:
      rgba(76, 207, 255, 0.44);

  --pc-shadow:
      rgba(0, 0, 0, 0.52);


  position: relative;

  width: 100%;
  min-height: 100dvh;

  overflow: hidden;

  color: var(--pc-text);

  background: #020108;

  isolation: isolate;
}


button,
textarea {
  font: inherit;
}


button {
  color: inherit;
}


/* ==================================================
   BACKGROUND

   No animation.
   No scaling animation.
   No crossfade.

   Keeps scene visually continuous.
================================================== */

.pc-bg {
  position: absolute;

  inset: 0 -3% 0 -3%;

  width: 106%;
  height: 100%;

  background-image:
      url('/images/chamber/bg.png');

  background-position:
      center top;

  background-repeat:
      no-repeat;

  background-size:
      cover;


  transform-origin:
      top center;

  pointer-events: none;


  /*
    Starting frame.

    Slight horizontal stretch only.
    Top remains anchored.
  */
  transform:
      translate3d(
          0,
          0,
          0
      )
      scaleX(1.035);

  transform-origin:
      top center;


  will-change:
      transform;


  transition:
      transform
      1000ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      )
      80ms;
}


.pc-bg.is-settled {
  transform:
      translate3d(
          3.5vw,
          0,
          0
      )
      scaleX(1.055);
}

.pc-vignette {
  position: absolute;

  inset: 0;

  z-index: 1;

  pointer-events: none;

  background:
      radial-gradient(
          circle at center 42%,
          transparent 20%,
          rgba(0, 0, 8, 0.1) 58%,
          rgba(0, 0, 6, 0.65) 100%
      ),
      linear-gradient(
          to bottom,
          rgba(0, 0, 8, 0.02),
          rgba(0, 0, 8, 0.08) 55%,
          rgba(0, 0, 8, 0.5)
      );
}
/* ==================================================
   INTRO UI REVEAL
================================================== */

.pc-ui-reveal {
  opacity: 0;

  visibility: hidden;

  pointer-events: none;
}


.pc-ui-reveal--top {
  transform:
      translateY(-0.7rem);
}


.pc-ui-reveal--side {
  transform:
      translateX(0.9rem);
}


.pc-ui-reveal.is-visible {
  opacity: 1;

  visibility: visible;

  pointer-events: auto;

  transform:
      translate(0, 0);
}


/* ==================================================
   BACK
================================================== */

.pc-page-back {
  position: absolute;

  top: 1rem;
  left: 1rem;

  z-index: 45;

  display: inline-flex;

  align-items: center;

  gap: 0.5rem;

  padding:
      0.68rem
      0.95rem;

  border:
      1px solid
      rgba(76, 207, 255, 0.34);

  border-radius: 999px;

  background:
      rgba(5, 6, 23, 0.76);

  backdrop-filter:
      blur(12px);

  color:
      rgba(233, 245, 255, 0.92);

  cursor: pointer;

  box-shadow:
      inset
      0 0 0 1px
      rgba(163, 84, 255, 0.08),

      0 0 1.2rem
      rgba(76, 207, 255, 0.08);

  transition:
      opacity 420ms ease,

      transform 500ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),

      border-color 180ms ease,

      background 180ms ease,

      box-shadow 180ms ease;
}


.pc-page-back.is-visible:hover {
  transform:
      translateY(-1px);

  border-color:
      rgba(76, 207, 255, 0.7);

  background:
      rgba(8, 9, 31, 0.88);

  box-shadow:
      inset
      0 0 0 1px
      rgba(163, 84, 255, 0.12),

      0 0 1.4rem
      rgba(76, 207, 255, 0.18);
}


.pc-back-arrow {
  color: var(--pc-blue);

  font-size: 1rem;

  line-height: 1;
}


/* ==================================================
   TOP HUD
================================================== */

.pc-header {
  position: absolute;

  top: 1rem;
  left: 8.5rem;
  right: 1rem;

  z-index: 30;

  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr)
      auto;

  align-items: start;

  gap: 1rem;

  transition:
      opacity 460ms ease,

      transform 540ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.pc-day-badge {
  position: relative;

  display: inline-flex;

  align-items: center;

  gap: 0.75rem;

  min-width: 14rem;

  padding:
      0.82rem
      1rem;

  border:
      1px solid
      rgba(163, 84, 255, 0.58);

  border-radius: 1.2rem;

  background:
      linear-gradient(
          135deg,
          rgba(28, 11, 66, 0.94),
          rgba(8, 12, 38, 0.94)
      );

  backdrop-filter:
      blur(12px);

  box-shadow:
      inset
      0 0 1.4rem
      rgba(163, 84, 255, 0.1),

      0 0 1.4rem
      rgba(123, 62, 255, 0.14);

  color: var(--pc-text);
}


.pc-day-badge::after {
  content: '';

  position: absolute;

  left: 1.05rem;
  right: 1.05rem;
  bottom: -1px;

  height: 1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          var(--pc-purple),
          var(--pc-blue),
          transparent
      );

  box-shadow:
      0 0 0.65rem
      rgba(76, 207, 255, 0.5);
}


.pc-day-icon {
  width: 2.35rem;

  aspect-ratio: 1;

  display: grid;

  place-items: center;

  border:
      1px solid
      rgba(76, 207, 255, 0.42);

  border-radius: 0.85rem;

  background:
      linear-gradient(
          145deg,
          rgba(163, 84, 255, 0.18),
          rgba(76, 207, 255, 0.08)
      );

  color: var(--pc-blue-soft);

  font-size: 1rem;

  box-shadow:
      inset
      0 0 0.9rem
      rgba(76, 207, 255, 0.08),

      0 0 0.8rem
      rgba(163, 84, 255, 0.12);
}


.pc-day-copy strong,
.pc-day-copy small {
  display: block;
}


.pc-day-copy strong {
  color: #f4efff;

  font-size: 0.96rem;

  font-weight: 800;

  letter-spacing: 0.02em;
}


.pc-day-copy small {
  margin-top: 0.14rem;

  color:
      rgba(199, 189, 215, 0.78);

  font-size: 0.72rem;

  letter-spacing: 0.04em;
}


/* ==================================================
   FLOW
================================================== */

.pc-flow {
  position: relative;

  max-width: 42rem;

  padding:
      0.72rem
      1rem
      1.06rem;

  margin:
      0
      auto;

  display: grid;

  grid-template-columns:
      repeat(
          4,
          minmax(0, 1fr)
      );

  gap: 0.6rem;

  border:
      1px solid
      rgba(163, 84, 255, 0.42);

  border-radius: 1.35rem;

  background:
      linear-gradient(
          180deg,
          rgba(13, 10, 39, 0.8),
          rgba(6, 7, 24, 0.84)
      );

  backdrop-filter:
      blur(12px);

  box-shadow:
      inset
      0 0 1.5rem
      rgba(125, 59, 215, 0.08),

      0 0 1.4rem
      rgba(76, 207, 255, 0.06);
}


.pc-flow::before,
.pc-flow::after {
  content: '';

  position: absolute;

  top: 0.7rem;

  width: 1.7rem;
  height: 1px;

  background:
      rgba(76, 207, 255, 0.58);

  box-shadow:
      0 0 0.5rem
      rgba(76, 207, 255, 0.5);
}


.pc-flow::before {
  left: -0.65rem;
}


.pc-flow::after {
  right: -0.65rem;
}


.pc-flow-step {
  position: relative;

  display: flex;

  align-items: center;

  gap: 0.55rem;

  padding:
      0.2rem
      0.1rem;

  border: 0;

  background: transparent;

  text-align: left;

  color:
      rgba(199, 189, 215, 0.48);

  cursor: default;
}


.pc-flow-step.complete {
  cursor: pointer;

  color: var(--pc-blue);
}


.pc-flow-step.active {
  color: var(--pc-purple-soft);
}


.pc-flow-gem {
  width: 0.9rem;

  aspect-ratio: 1;

  flex: 0 0 auto;

  border:
      1px solid
      currentColor;

  border-radius: 0.2rem;

  background:
      rgba(13, 9, 37, 0.86);

  transform:
      rotate(45deg);

  box-shadow:
      inset
      0 0 0.35rem
      currentColor,

      0 0 0.55rem
      color-mix(
          in srgb,
          currentColor 55%,
          transparent
      );
}


.pc-flow-step.active
.pc-flow-gem {
  background:
      rgba(163, 84, 255, 0.28);
}


.pc-flow-step.complete
.pc-flow-gem {
  background:
      rgba(76, 207, 255, 0.18);
}


.pc-flow-copy small,
.pc-flow-copy strong {
  display: block;
}


.pc-flow-copy small {
  color: currentColor;

  font-size: 0.56rem;

  font-weight: 800;

  letter-spacing: 0.1em;
}


.pc-flow-copy strong {
  margin-top: 0.06rem;

  color: currentColor;

  font-size: 0.8rem;

  font-weight: 700;
}


.pc-progress-track {
  position: absolute;

  left: 1rem;
  right: 1rem;
  bottom: 0.52rem;

  height: 0.24rem;

  overflow: hidden;

  border-radius: 999px;

  background:
      rgba(255, 255, 255, 0.07);
}


.pc-progress-fill {
  display: block;

  height: 100%;

  border-radius: inherit;

  background:
      linear-gradient(
          90deg,
          var(--pc-purple),
          var(--pc-blue)
      );

  box-shadow:
      0 0 0.75rem
      rgba(76, 207, 255, 0.62);

  transition:
      width 280ms ease;
}


/* ==================================================
   RIGHT HUD
================================================== */

.pc-hud-right {
  display: inline-flex;

  align-items: center;

  gap: 0.55rem;

  justify-self: end;

  flex-wrap: wrap;
}


.pc-system-status,
.pc-mini-button {
  height: 2.65rem;

  padding:
      0
      0.95rem;

  display: inline-flex;

  align-items: center;

  gap: 0.48rem;

  border:
      1px solid
      rgba(76, 207, 255, 0.28);

  border-radius: 999px;

  background:
      rgba(5, 7, 24, 0.74);

  backdrop-filter:
      blur(12px);

  box-shadow:
      inset
      0 0 0.8rem
      rgba(163, 84, 255, 0.06),

      0 0 0.9rem
      rgba(76, 207, 255, 0.06);

  color:
      rgba(228, 239, 255, 0.86);
}


.pc-system-status strong {
  font-size: 0.68rem;

  letter-spacing: 0.08em;
}


.pc-status-dot {
  width: 0.46rem;

  aspect-ratio: 1;

  border-radius: 50%;

  background: var(--pc-blue);

  box-shadow:
      0 0 0.8rem
      rgba(76, 207, 255, 0.9);
}


.pc-mini-button {
  cursor: pointer;

  font-size: 0.7rem;

  font-weight: 800;

  letter-spacing: 0.08em;

  transition:
      border-color 180ms ease,
      color 180ms ease,
      background 180ms ease;
}


.pc-mini-button:hover {
  color: var(--pc-blue-soft);

  border-color:
      rgba(76, 207, 255, 0.62);

  background:
      rgba(8, 12, 35, 0.9);
}


/* ==================================================
   SCENE LAYER
================================================== */

.pc-scene-layer {
  position: absolute;

  inset: 0;

  z-index: 3;

  pointer-events: none;
}


/* ==================================================
   PANEL SCENE CONTINUITY

   Initial values mirror SelectionPage:

   left: 50%

   width:
   min(
     100%,
     calc(92dvh * 1.7778),
     106rem
   )

   initial visual bottom:
   original base bottom
   minus original assembly-drop.

   Final values are the calibration
   composition from the original SFC.
================================================== */

.pc-panel-scene {
  --pc-panel-start-left:
      50%;

  --pc-panel-end-left:
      56%;


  --pc-panel-start-bottom:
      calc(
          clamp(
          0rem,
          2vh,
          1.5rem
          )
          -
          clamp(
          2.6rem,
          5.5vh,
          5.2rem
          )
      );


  --pc-panel-end-bottom:
      clamp(
          -3.3rem,
          -4.7vh,
          -1.5rem
      );


  --pc-panel-start-width:
      min(
          100%,
          calc(92dvh * 1.7778),
          106rem
      );


  --pc-panel-end-width:
      min(
          97%,
          calc(91dvh * 1.7778),
          108rem
      );


  position: absolute;

  left:
      var(--pc-panel-start-left);

  bottom:
      var(--pc-panel-start-bottom);

  width:
      var(--pc-panel-start-width);

  aspect-ratio:
      16 / 9;

  transform:
      translateX(-50%);

  transform-origin:
      bottom center;

  will-change:
      left,
      bottom,
      width;

  transition:
      left
      760ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),

      bottom
      760ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),

      width
      760ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.pc-panel-scene.is-settled {
  left:
      var(--pc-panel-end-left);

  bottom:
      var(--pc-panel-end-bottom);

  width:
      var(--pc-panel-end-width);
}


/* ==================================================
   PANEL MEMBERS
================================================== */

.pc-panel-members {
  position: absolute;

  left: 50%;

  bottom: 17%;

  width: 80%;
  height: 86%;

  display: grid;

  grid-template-columns:
      repeat(
          5,
          minmax(0, 1fr)
      );

  align-items: end;

  gap:
      clamp(
          0.25rem,
          0.8vw,
          1rem
      );

  transform:
      translateX(-50%);
}


.pc-panel-member {
  width: 100%;
  height: 100%;

  display: flex;

  align-items: flex-end;

  justify-content: center;
}


.pc-panel-member img {
  display: block;

  width: auto;
  height: 100%;

  max-width: 150%;

  object-fit: contain;

  object-position:
      bottom center;

  filter:
      drop-shadow(
          0
          0.95rem
          1.4rem
          rgba(0, 0, 0, 0.9)
      )

      drop-shadow(
          0
          0
          0.5rem
          rgba(118, 72, 255, 0.12)
      );
}


/* ==================================================
   PANEL TABLE
================================================== */

.pc-group-table {
  position: absolute;

  left: 50%;

  bottom: -10%;

  z-index: 2;

  display: block;

  width: 100%;
  height: auto;

  transform:
      translateX(-50%);

  object-fit: contain;

  filter:
      drop-shadow(
          0
          1.4rem
          2.4rem
          rgba(0, 0, 0, 0.95)
      )

      drop-shadow(
          0
          0
          1rem
          rgba(107, 62, 255, 0.16)
      );
}


/* ==================================================
   MEDIATOR
================================================== */

.pc-mediator-foreground {
  position: absolute;

  left:
      clamp(
          -1rem,
          0.5vw,
          0.4rem
      );

  bottom:
      clamp(
          -9rem,
          -12vh,
          -4rem
      );

  z-index: 15;

  width:
      clamp(
          30rem,
          42vw,
          51rem
      );

  height:
      min(
          96vh,
          64rem
      );

  pointer-events: none;

  opacity: 0;

  transform:
      translateY(18px)
      scale(0.98);

  transition:
      opacity
      420ms ease,

      transform
      520ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.pc-mediator-foreground.is-visible {
  opacity: 1;

  transform:
      translateY(0)
      scale(1);
}


.pc-mediator-standing {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: contain;

  object-position:
      bottom left;

  filter:
      drop-shadow(
          0
          28px
          30px
          rgba(0, 0, 0, 0.58)
      )

      drop-shadow(
          0
          0
          14px
          rgba(128, 82, 255, 0.1)
      );
}


/* ==================================================
   INPUT PANEL
================================================== */

.pc-input-panel {
  position: absolute;

  top: 7rem;
  right: 1.2rem;

  z-index: 20;

  width:
      clamp(
          19rem,
          24vw,
          26rem
      );

  min-height: 29rem;

  max-height:
      calc(
          100vh - 10rem
      );

  display: flex;

  flex-direction: column;

  padding:
      1rem
      1rem
      1.05rem;

  border:
      1px solid
      rgba(163, 84, 255, 0.56);

  border-radius: 1.75rem;

  background:
      linear-gradient(
          155deg,
          rgba(16, 12, 45, 0.94),
          rgba(5, 8, 27, 0.94)
      );

  backdrop-filter:
      blur(14px);

  box-shadow:
      inset
      0 0 0 1px
      rgba(76, 207, 255, 0.06),

      inset
      0 0 2.4rem
      rgba(129, 60, 255, 0.08),

      0 22px 44px
      rgba(0, 0, 0, 0.32),

      0 0 1.5rem
      rgba(127, 56, 245, 0.12);

  transition:
      opacity
      460ms ease,

      transform
      560ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.pc-input-panel::before {
  content: '';

  position: absolute;

  inset: 0.58rem;

  border:
      1px solid
      rgba(76, 207, 255, 0.12);

  border-radius: 1.35rem;

  pointer-events: none;
}


.pc-input-panel::after {
  content: '';

  position: absolute;

  top: -1px;

  left: 2.2rem;
  right: 2.2rem;

  height: 1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          var(--pc-purple),
          var(--pc-blue),
          transparent
      );

  box-shadow:
      0 0 0.75rem
      rgba(76, 207, 255, 0.5);
}


.pc-panel-head {
  position: relative;

  z-index: 2;

  padding:
      0.42rem
      0.3rem
      0.86rem;

  text-align: center;
}


.pc-step-kicker {
  display: block;

  margin-bottom: 0.3rem;

  color: var(--pc-blue);

  font-size: 0.58rem;

  font-weight: 900;

  letter-spacing: 0.18em;

  text-transform: uppercase;
}


.pc-panel-head h2 {
  margin: 0;

  color: #f3edff;

  font-size:
      clamp(
          1rem,
          1.4vw,
          1.28rem
      );

  font-weight: 900;

  letter-spacing: 0.06em;

  text-shadow:
      0 0 0.8rem
      rgba(163, 84, 255, 0.22);
}


.pc-panel-head p {
  margin:
      0.42rem
      0
      0;

  color:
      rgba(199, 189, 215, 0.76);

  font-size: 0.72rem;

  line-height: 1.55;
}


.pc-panel-page {
  position: relative;

  z-index: 2;

  flex: 1;

  min-height: 0;

  display: flex;

  flex-direction: column;

  padding:
      0.12rem
      0.25rem
      0;

  overflow-y: auto;

  scrollbar-width: thin;

  scrollbar-color:
      rgba(163, 84, 255, 0.4)
      transparent;
}


/* ==================================================
   INPUTS
================================================== */

.pc-ornate-input {
  position: relative;

  width: 100%;

  padding: 0.9rem;

  box-sizing: border-box;

  border:
      1px solid
      rgba(76, 207, 255, 0.24);

  border-radius: 1.2rem;

  background:
      linear-gradient(
          180deg,
          rgba(13, 13, 42, 0.9),
          rgba(8, 9, 29, 0.94)
      );

  box-shadow:
      inset
      0 0 0 1px
      rgba(163, 84, 255, 0.08),

      inset
      0 0 1.4rem
      rgba(76, 207, 255, 0.03),

      0 12px 24px
      rgba(0, 0, 0, 0.18);
}


.pc-ornate-input:focus-within {
  border-color:
      rgba(76, 207, 255, 0.58);

  box-shadow:
      inset
      0 0 0 1px
      rgba(163, 84, 255, 0.12),

      inset
      0 0 1.4rem
      rgba(76, 207, 255, 0.04),

      0 0 1rem
      rgba(76, 207, 255, 0.1);
}


.pc-large-input,
.pc-context-input {
  flex: 1;

  min-height: 12rem;
}


.pc-ornate-input textarea {
  display: block;

  width: 100%;
  height: 100%;

  min-height: 9rem;

  padding: 0;

  border: 0;

  outline: 0;

  resize: none;

  background: transparent;

  color: #f4f0fb;

  font-size: 0.88rem;

  line-height: 1.65;
}


.pc-ornate-input
textarea::placeholder {
  color:
      rgba(199, 189, 215, 0.44);
}


.pc-character-count {
  position: absolute;

  right: 0.9rem;
  bottom: 0.7rem;

  color:
      rgba(125, 234, 255, 0.62);

  font-size: 0.6rem;

  letter-spacing: 0.05em;
}


/* ==================================================
   MAIN ACTION
================================================== */

.pc-main-action {
  width: 100%;

  min-height: 3rem;

  margin-top: 0.9rem;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 0.55rem;

  border:
      1px solid
      rgba(185, 244, 255, 0.56);

  border-radius: 999px;

  background:
      linear-gradient(
          100deg,
          rgba(116, 58, 220, 0.96),
          rgba(85, 62, 220, 0.96) 48%,
          rgba(39, 168, 224, 0.96)
      );

  color: white;

  font-weight: 900;

  letter-spacing: 0.02em;

  cursor: pointer;

  box-shadow:
      inset
      0 0 0 1px
      rgba(255, 255, 255, 0.1),

      0 14px 28px
      rgba(70, 30, 160, 0.24),

      0 0 1rem
      rgba(76, 207, 255, 0.12);

  transition:
      transform 180ms ease,
      filter 180ms ease,
      opacity 180ms ease,
      box-shadow 180ms ease;
}


.pc-main-action:hover:not(
    :disabled
) {
  transform:
      translateY(-1px);

  filter:
      brightness(1.06);

  box-shadow:
      inset
      0 0 0 1px
      rgba(255, 255, 255, 0.14),

      0 16px 30px
      rgba(70, 30, 160, 0.28),

      0 0 1.4rem
      rgba(76, 207, 255, 0.18);
}


.pc-main-action:disabled {
  opacity: 0.42;

  cursor: not-allowed;
}


.pc-action-star {
  color: var(--pc-blue-soft);

  font-size: 0.9rem;
}


.pc-action-note {
  margin:
      0.55rem
      0
      0;

  color:
      rgba(199, 189, 215, 0.62);

  font-size: 0.68rem;

  line-height: 1.5;

  text-align: center;
}


/* ==================================================
   OBJECTIVE
================================================== */

.pc-objective-list,
.pc-approach-list {
  display: flex;

  flex-direction: column;

  gap: 0.65rem;
}


.pc-objective-option,
.pc-approach-option {
  position: relative;

  width: 100%;

  padding:
      0.85rem
      0.9rem;

  border:
      1px solid
      rgba(163, 84, 255, 0.2);

  border-radius: 1.08rem;

  background:
      linear-gradient(
          180deg,
          rgba(18, 15, 48, 0.86),
          rgba(8, 10, 31, 0.9)
      );

  text-align: left;

  cursor: pointer;

  box-shadow:
      inset
      0 0 0 1px
      rgba(76, 207, 255, 0.025),

      0 8px 18px
      rgba(0, 0, 0, 0.14);

  transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease,
      background 180ms ease;
}


.pc-objective-option {
  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr);

  align-items: center;

  gap: 0.8rem;
}


.pc-objective-option:hover,
.pc-approach-option:hover {
  transform:
      translateY(-1px);

  border-color:
      rgba(76, 207, 255, 0.44);

  box-shadow:
      inset
      0 0 0 1px
      rgba(163, 84, 255, 0.05),

      0 10px 22px
      rgba(0, 0, 0, 0.2),

      0 0 0.8rem
      rgba(76, 207, 255, 0.06);
}


.pc-objective-option.selected,
.pc-approach-option.selected {
  border-color:
      rgba(163, 84, 255, 0.7);

  background:
      linear-gradient(
          135deg,
          rgba(45, 24, 88, 0.9),
          rgba(10, 21, 50, 0.9)
      );

  box-shadow:
      inset
      0 0 1.2rem
      rgba(163, 84, 255, 0.08),

      0 0 1rem
      rgba(76, 207, 255, 0.06);
}


.pc-objective-radio {
  width: 1.35rem;

  aspect-ratio: 1;

  display: grid;

  place-items: center;

  border:
      1px solid
      rgba(76, 207, 255, 0.36);

  border-radius: 50%;
}


.pc-objective-radio span {
  width: 0.46rem;

  aspect-ratio: 1;

  border-radius: 50%;

  background: transparent;
}


.pc-objective-option.selected
.pc-objective-radio span {
  background: var(--pc-blue);

  box-shadow:
      0 0 0.8rem
      rgba(76, 207, 255, 0.82);
}


.pc-objective-copy strong,
.pc-objective-copy small {
  display: block;
}


.pc-objective-copy strong {
  color: #f1ebff;

  font-size: 0.84rem;

  font-weight: 800;
}


.pc-objective-copy small {
  margin-top: 0.18rem;

  color:
      rgba(199, 189, 215, 0.68);

  font-size: 0.67rem;

  line-height: 1.45;
}


/* ==================================================
   CONTEXT
================================================== */

.pc-context-signal {
  display: flex;

  align-items: center;

  gap: 0.45rem;

  margin-top: 0.65rem;

  padding:
      0.8rem
      0.9rem;

  border:
      1px solid
      rgba(76, 207, 255, 0.18);

  border-radius: 1rem;

  background:
      rgba(10, 11, 34, 0.76);

  color:
      rgba(199, 189, 215, 0.68);

  font-size: 0.66rem;
}


.pc-signal-dot {
  width: 0.52rem;

  aspect-ratio: 1;

  border-radius: 50%;

  background: var(--pc-blue);

  box-shadow:
      0 0 0.75rem
      rgba(76, 207, 255, 0.76);
}


/* ==================================================
   APPROACH
================================================== */

.pc-approach-option {
  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr);

  gap: 0.8rem;

  padding-bottom: 1.15rem;
}


.pc-approach-number {
  color: var(--pc-blue);

  font-size: 0.7rem;

  font-weight: 900;

  line-height: 1;
}


.pc-approach-copy strong,
.pc-approach-copy small,
.pc-approach-copy em {
  display: block;
}


.pc-approach-copy strong {
  color: #f2ecff;

  font-size: 0.88rem;

  font-style: normal;

  font-weight: 800;
}


.pc-approach-copy small {
  margin-top: 0.16rem;

  color: var(--pc-purple-soft);

  font-size: 0.67rem;

  font-weight: 700;
}


.pc-approach-copy em {
  margin-top: 0.3rem;

  color:
      rgba(199, 189, 215, 0.64);

  font-size: 0.65rem;

  line-height: 1.45;

  font-style: normal;
}


.pc-approach-meter {
  position: absolute;

  left: 0.9rem;
  right: 0.9rem;
  bottom: 0.55rem;

  height: 0.24rem;

  overflow: hidden;

  border-radius: 999px;

  background:
      rgba(255, 255, 255, 0.06);
}


.pc-approach-meter > span {
  display: block;

  height: 100%;

  border-radius: inherit;

  background:
      linear-gradient(
          90deg,
          var(--pc-purple),
          var(--pc-blue)
      );

  box-shadow:
      0 0 0.5rem
      rgba(76, 207, 255, 0.5);
}


.pc-response-profile {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-top: 0.75rem;

  padding:
      0.85rem
      0.95rem;

  border:
      1px solid
      rgba(163, 84, 255, 0.24);

  border-radius: 1rem;

  background:
      rgba(10, 10, 32, 0.8);
}


.pc-response-profile span {
  color:
      rgba(199, 189, 215, 0.66);

  font-size: 0.62rem;

  font-weight: 800;

  text-transform: uppercase;

  letter-spacing: 0.1em;
}


.pc-response-profile strong {
  color: var(--pc-blue-soft);

  font-size: 0.8rem;

  font-weight: 900;
}


/* ==================================================
   VN DIALOGUE SHELL
================================================== */

.pc-dialogue-shell {
  position: absolute;

  left: 18.8%;
  right: 16.8%;

  bottom: 1.15rem;

  z-index: 25;

  min-height: 12.5rem;

  padding:
      3rem
      2.1rem
      1.45rem;

  border:
      1px solid
      rgba(163, 84, 255, 0.76);

  border-radius: 1.6rem;

  background:
      linear-gradient(
          155deg,
          rgba(18, 14, 49, 0.94),
          rgba(5, 9, 29, 0.95)
      );

  backdrop-filter:
      blur(16px);

  box-shadow:
      inset
      0 0 0 1px
      rgba(76, 207, 255, 0.07),

      inset
      0 0 2.4rem
      rgba(111, 53, 217, 0.08),

      0 22px 42px
      rgba(0, 0, 0, 0.34),

      0 0 1.6rem
      rgba(117, 61, 236, 0.12);

  opacity: 0;

  visibility: hidden;

  pointer-events: none;

  transform:
      translateY(16px)
      scale(0.99);

  transition:
      opacity
      360ms ease,

      visibility
      0s linear
      500ms,

      transform
      500ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.pc-dialogue-shell::before {
  content: '';

  position: absolute;

  inset: 0.55rem;

  border:
      1px solid
      rgba(76, 207, 255, 0.14);

  border-radius: 1.24rem;

  pointer-events: none;
}


.pc-dialogue-shell::after {
  content: '';

  position: absolute;

  left: 2rem;
  right: 2rem;
  top: -1px;

  height: 1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          var(--pc-purple),
          var(--pc-blue),
          transparent
      );

  box-shadow:
      0 0 0.8rem
      rgba(76, 207, 255, 0.58);
}


.pc-dialogue-shell.is-visible {
  opacity: 1;

  visibility: visible;

  pointer-events: auto;

  transform:
      translateY(0)
      scale(1);

  transition:
      opacity
      360ms ease,

      visibility
      0s linear
      0s,

      transform
      500ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


/* ==================================================
   NAMEPLATE
================================================== */

.pc-dialogue-nameplate {
  position: absolute;

  left: 1.1rem;
  top: -0.95rem;

  z-index: 4;

  min-width: 12rem;

  padding:
      0.72rem
      1.35rem;

  border:
      1px solid
      rgba(185, 244, 255, 0.48);

  border-radius: 0.95rem;

  background:
      linear-gradient(
          105deg,
          rgba(113, 52, 215, 0.98),
          rgba(80, 61, 219, 0.98) 54%,
          rgba(38, 155, 217, 0.98)
      );

  color: white;

  box-shadow:
      inset
      0 0 0 1px
      rgba(255, 255, 255, 0.1),

      0 12px 26px
      rgba(23, 15, 80, 0.34),

      0 0 1rem
      rgba(76, 207, 255, 0.12);
}


.pc-dialogue-nameplate strong {
  display: block;

  font-size:
      clamp(
          1rem,
          1.45vw,
          1.6rem
      );

  font-weight: 900;

  line-height: 1;

  letter-spacing: 0.02em;
}


/* ==================================================
   TOOLBAR
================================================== */

.pc-dialogue-toolbar {
  position: absolute;

  top: 0.82rem;
  right: 1.15rem;

  z-index: 4;

  display: inline-flex;

  align-items: center;

  gap: 0.5rem;

  opacity: 0;

  transform:
      translateY(10px);

  transition:
      opacity
      280ms ease,

      transform
      360ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.pc-dialogue-toolbar.is-visible {
  opacity: 1;

  transform:
      translateY(0);
}


.pc-dialogue-toolbar button {
  min-height: 2.35rem;

  padding:
      0.5rem
      0.9rem;

  border:
      1px solid
      rgba(76, 207, 255, 0.22);

  border-radius: 999px;

  background:
      rgba(7, 9, 29, 0.82);

  color:
      rgba(223, 237, 255, 0.82);

  font-size: 0.72rem;

  font-weight: 800;

  letter-spacing: 0.05em;

  box-shadow:
      inset
      0 0 0.8rem
      rgba(163, 84, 255, 0.05),

      0 7px 16px
      rgba(0, 0, 0, 0.14);

  transition:
      border-color 180ms ease,
      color 180ms ease,
      background 180ms ease;
}


.pc-dialogue-toolbar button:hover {
  color: var(--pc-blue-soft);

  border-color:
      rgba(76, 207, 255, 0.5);

  background:
      rgba(10, 13, 40, 0.94);
}


/* ==================================================
   DIALOGUE COPY
================================================== */

.pc-dialogue-copy {
  position: relative;

  z-index: 3;

  min-height: 6rem;

  opacity: 0;

  transform:
      translateY(10px);

  transition:
      opacity
      280ms ease,

      transform
      360ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.pc-dialogue-copy.is-visible {
  opacity: 1;

  transform:
      translateY(0);
}


.pc-dialogue-lines p {
  margin: 0;

  color: #f3effa;

  font-size:
      clamp(
          1rem,
          1.28vw,
          1.5rem
      );

  font-weight: 500;

  line-height: 1.62;

  letter-spacing: 0.01em;

  text-shadow:
      0 0 0.8rem
      rgba(75, 114, 255, 0.06);
}


.pc-dialogue-lines p + p {
  margin-top: 0.45rem;

  color:
      rgba(231, 225, 242, 0.88);
}


/* ==================================================
   DIALOGUE NEXT
================================================== */

.pc-dialogue-next {
  position: absolute;

  right: 1.15rem;
  bottom: 1rem;

  z-index: 4;

  width: 4rem;
  height: 4rem;

  display: grid;

  place-items: center;

  border:
      1px solid
      rgba(185, 244, 255, 0.52);

  border-radius: 1.05rem;

  background:
      linear-gradient(
          135deg,
          var(--pc-purple-deep),
          #4d50d8 56%,
          #249fd3
      );

  color: white;

  font-size: 2rem;

  line-height: 1;

  cursor: pointer;

  box-shadow:
      inset
      0 0 0 1px
      rgba(255, 255, 255, 0.08),

      0 14px 26px
      rgba(27, 19, 93, 0.34),

      0 0 1rem
      rgba(76, 207, 255, 0.12);

  transition:
      transform 180ms ease,
      filter 180ms ease;
}


.pc-dialogue-next:hover {
  transform:
      translateY(-1px);

  filter:
      brightness(1.08);
}


/* ==================================================
   REVIEW + LOCKING OVERLAYS
================================================== */

.pc-review-overlay,
.pc-locking-overlay {
  position: absolute;

  inset: 0;

  z-index: 100;

  display: grid;

  place-items: center;

  background:
      rgba(2, 2, 10, 0.72);

  backdrop-filter:
      blur(14px);
}


/* ==================================================
   REVIEW
================================================== */

.pc-review-card {
  position: relative;

  width:
      min(
          48rem,
          calc(100vw - 2rem)
      );

  max-height:
      calc(100vh - 2rem);

  overflow: auto;

  padding:
      1.45rem
      1.45rem
      1.25rem;

  border:
      1px solid
      rgba(163, 84, 255, 0.58);

  border-radius: 1.55rem;

  background:
      linear-gradient(
          155deg,
          rgba(18, 14, 49, 0.98),
          rgba(6, 8, 28, 0.99)
      );

  box-shadow:
      inset
      0 0 0 1px
      rgba(76, 207, 255, 0.06),

      inset
      0 0 2rem
      rgba(126, 56, 220, 0.08),

      0 24px 50px
      rgba(0, 0, 0, 0.46),

      0 0 1.8rem
      rgba(123, 61, 234, 0.14);
}


.pc-review-card::after {
  content: '';

  position: absolute;

  top: -1px;
  left: 3rem;
  right: 3rem;

  height: 1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          var(--pc-purple),
          var(--pc-blue),
          transparent
      );

  box-shadow:
      0 0 0.8rem
      rgba(76, 207, 255, 0.6);
}


.pc-review-head {
  text-align: center;
}


.pc-review-kicker {
  display: inline-block;

  color: var(--pc-blue);

  font-size: 0.76rem;

  font-weight: 900;

  letter-spacing: 0.14em;

  text-transform: uppercase;
}


.pc-review-head h3 {
  margin:
      0.35rem
      0
      0;

  color: #f3edff;

  font-size:
      clamp(
          1.35rem,
          2vw,
          2rem
      );

  font-weight: 900;
}


.pc-review-head p {
  margin:
      0.45rem
      auto
      0;

  max-width: 30rem;

  color:
      rgba(199, 189, 215, 0.72);

  font-size: 0.92rem;

  line-height: 1.6;
}


.pc-review-grid {
  margin-top: 1.2rem;

  display: grid;

  gap: 0.8rem;
}


.pc-review-row {
  display: grid;

  grid-template-columns:
      10rem
      minmax(0, 1fr);

  gap: 1rem;

  align-items: start;

  padding: 1rem;

  border:
      1px solid
      rgba(76, 207, 255, 0.14);

  border-radius: 1.15rem;

  background:
      linear-gradient(
          180deg,
          rgba(16, 14, 43, 0.88),
          rgba(8, 9, 29, 0.9)
      );
}


.pc-review-label {
  color: var(--pc-purple-soft);

  font-size: 0.94rem;

  font-weight: 900;

  line-height: 1.35;
}


.pc-review-value {
  color: #f0ecf6;

  font-size: 0.98rem;

  font-weight: 500;

  line-height: 1.7;
}


.pc-review-value strong,
.pc-review-value small {
  display: block;
}


.pc-review-value small {
  margin-top: 0.18rem;

  color:
      rgba(199, 189, 215, 0.68);

  font-size: 0.88rem;
}


.pc-review-actions {
  display: flex;

  justify-content: flex-end;

  gap: 0.8rem;

  margin-top: 1rem;
}


.pc-review-button {
  min-width: 11rem;

  min-height: 3rem;

  padding:
      0
      1.2rem;

  border-radius: 999px;

  font-weight: 900;

  cursor: pointer;
}


.pc-review-button.secondary {
  border:
      1px solid
      rgba(76, 207, 255, 0.24);

  background:
      rgba(8, 10, 31, 0.86);

  color:
      rgba(230, 240, 255, 0.86);
}


.pc-review-button.primary {
  border:
      1px solid
      rgba(185, 244, 255, 0.5);

  background:
      linear-gradient(
          100deg,
          var(--pc-purple-deep),
          #5352d9,
          #299ed5
      );

  color: white;

  box-shadow:
      0 14px 26px
      rgba(36, 26, 120, 0.32),

      0 0 1rem
      rgba(76, 207, 255, 0.12);
}


/* ==================================================
   LOCKING
================================================== */

.pc-locking-card {
  position: relative;

  width:
      min(
          30rem,
          calc(100vw - 2rem)
      );

  aspect-ratio: 1.65;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  border:
      1px solid
      rgba(163, 84, 255, 0.58);

  border-radius: 1.7rem;

  background:
      radial-gradient(
          circle at center,
          rgba(25, 20, 62, 0.98),
          rgba(5, 7, 24, 0.99)
      );

  box-shadow:
      inset
      0 0 2rem
      rgba(120, 55, 230, 0.1),

      0 24px 48px
      rgba(0, 0, 0, 0.48),

      0 0 1.5rem
      rgba(76, 207, 255, 0.08);
}


.pc-lock-orbit {
  position: absolute;

  left: 50%;
  top: 41%;

  border:
      1px solid
      rgba(76, 207, 255, 0.26);

  border-radius: 50%;

  transform:
      translate(-50%, -50%);

  animation:
      pc-lock-spin
      5s
      linear
      infinite;
}


.orbit-a {
  width: 4rem;
  height: 4rem;
}


.orbit-b {
  width: 5.2rem;
  height: 5.2rem;

  border-color:
      rgba(163, 84, 255, 0.28);

  animation-direction:
      reverse;

  animation-duration:
      7s;
}


.orbit-c {
  width: 6.4rem;
  height: 6.4rem;

  animation-duration:
      9s;
}


.pc-lock-core {
  margin-bottom: 3.5rem;

  color: var(--pc-blue);

  font-size: 1.9rem;

  text-shadow:
      0 0 1rem
      rgba(76, 207, 255, 0.8);
}


.pc-lock-kicker {
  color: var(--pc-purple-soft);

  font-size: 0.62rem;

  font-weight: 900;

  letter-spacing: 0.18em;
}


.pc-locking-card h2 {
  margin:
      0.45rem
      0
      0;

  color: #f2edff;

  font-size: 1.45rem;

  font-weight: 900;
}


.pc-locking-card p {
  margin:
      0.45rem
      0
      0;

  color:
      rgba(199, 189, 215, 0.68);

  font-size: 0.84rem;
}


/* ==================================================
   INTERNAL STEP TRANSITIONS
================================================== */

.pc-panel-swap-enter-active,
.pc-panel-swap-leave-active,
.pc-dialogue-swap-enter-active,
.pc-dialogue-swap-leave-active {
  transition:
      opacity 220ms ease,

      transform
      280ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.pc-panel-swap-enter-from {
  opacity: 0;

  transform:
      translateX(10px);
}


.pc-panel-swap-leave-to {
  opacity: 0;

  transform:
      translateX(-8px);
}


.pc-dialogue-swap-enter-from {
  opacity: 0;

  transform:
      translateY(8px);
}


.pc-dialogue-swap-leave-to {
  opacity: 0;

  transform:
      translateY(-6px);
}


.pc-review-enter-active,
.pc-review-leave-active,
.pc-locking-enter-active,
.pc-locking-leave-active {
  transition:
      opacity 220ms ease;
}


.pc-review-enter-from,
.pc-review-leave-to,
.pc-locking-enter-from,
.pc-locking-leave-to {
  opacity: 0;
}


/* ==================================================
   LOCK ANIMATION
================================================== */

@keyframes pc-lock-spin {

  from {
    transform:
        translate(-50%, -50%)
        rotate(0deg);
  }


  to {
    transform:
        translate(-50%, -50%)
        rotate(360deg);
  }

}


/* ==================================================
   RESPONSIVE — <= 1450
================================================== */

@media
(max-width: 1450px) {

  .pc-header {
    grid-template-columns:
        auto
        minmax(0, 1fr);
  }


  .pc-hud-right {
    position: absolute;

    top: 4.1rem;
    right: 0;
  }


  .pc-input-panel {
    width:
        clamp(
            18rem,
            25vw,
            22rem
        );
  }


  .pc-dialogue-shell {
    left: 18%;
    right: 23%;
  }

}


/* ==================================================
   RESPONSIVE — <= 1180
================================================== */

@media
(max-width: 1180px) {

  .pc-header {
    left: 7rem;
  }


  .pc-panel-scene {
    --pc-panel-end-left:
        50%;

    --pc-panel-end-width:
        min(
            108%,
            calc(82dvh * 1.7778)
        );
  }


  .pc-mediator-foreground {
    width:
        clamp(
            24rem,
            38vw,
            34rem
        );

    left: -1.8rem;

    bottom:
        clamp(
            -7rem,
            -10vh,
            -3rem
        );
  }


  .pc-input-panel {
    top: auto;

    right: 1rem;

    bottom: 12.8rem;

    width:
        min(
            24rem,
            34vw
        );

    max-height: 34rem;
  }


  .pc-dialogue-shell {
    left: 15%;

    right: 1rem;
  }

}


/* ==================================================
   MATCH SELECTION PAGE SMALL DESKTOP SCENE
================================================== */

@media
(max-width: 1100px) {

  .pc-panel-scene {
    --pc-panel-start-width:
        min(
            108%,
            calc(90dvh * 1.7778)
        );


    --pc-panel-start-bottom:
        calc(
            clamp(
            0rem,
            2vh,
            1.5rem
            )
            -
            clamp(
            2rem,
            4.8vh,
            4rem
            )
        );
  }

}


/* ==================================================
   RESPONSIVE — <= 920
================================================== */

@media
(max-width: 920px) {

  .panel-calibration {
    overflow-y: auto;
  }


  .pc-header {
    position: relative;

    top: auto;
    left: auto;
    right: auto;

    padding:
        4.5rem
        1rem
        0;

    gap: 0.8rem;

    grid-template-columns: 1fr;

    justify-items: center;
  }


  .pc-hud-left,
  .pc-hud-right {
    position: static;

    justify-self: center;
  }


  .pc-flow {
    width: 100%;
  }


  .pc-flow-copy strong {
    font-size: 0.72rem;
  }


  .pc-scene-layer {
    top: 8.5rem;

    height: 43vh;
  }


  .pc-panel-scene {
    --pc-panel-end-left:
        50%;

    --pc-panel-end-bottom:
        -1.8rem;

    --pc-panel-end-width:
        min(
            132%,
            calc(62dvh * 1.7778)
        );
  }


  .pc-mediator-foreground {
    top: 9rem;

    bottom: auto;

    left: -3rem;

    width: 22rem;

    height: 43vh;
  }


  .pc-input-panel {
    position: relative;

    top: auto;
    right: auto;
    bottom: auto;

    width:
        calc(100% - 2rem);

    max-height: none;

    min-height: 25rem;

    margin:
        40vh
        auto
        15rem;
  }


  .pc-dialogue-shell {
    position: fixed;

    left: 1rem;
    right: 1rem;
    bottom: 1rem;

    min-height: 11.5rem;
  }


  .pc-dialogue-toolbar {
    position: static;

    margin-bottom: 0.9rem;

    flex-wrap: wrap;
  }


  .pc-dialogue-next {
    width: 3.4rem;
    height: 3.4rem;

    font-size: 1.7rem;
  }

}


/* ==================================================
   RESPONSIVE — <= 760

   Selection page used a different mobile
   assembly size, so initial scene values
   also mirror that here.
================================================== */

@media
(max-width: 760px) {

  .pc-panel-scene {
    --pc-panel-start-width:
        min(
            142%,
            calc(76dvh * 1.7778)
        );


    --pc-panel-start-bottom:
        calc(
            clamp(
            4.4rem,
            10vh,
            7rem
            )
            -
            clamp(
            1.2rem,
            3vh,
            2.4rem
            )
        );
  }


  .pc-panel-members {
    width: 68%;

    height: 80%;

    gap: 0;
  }

}


/* ==================================================
   RESPONSIVE — <= 640
================================================== */

@media
(max-width: 640px) {

  .pc-page-back {
    left: 0.6rem;

    top: 0.6rem;
  }


  .pc-header {
    padding:
        4.6rem
        0.6rem
        0;
  }


  .pc-day-badge {
    min-width: 0;

    width: 100%;
  }


  .pc-flow {
    padding-inline: 0.75rem;

    gap: 0.35rem;
  }


  .pc-flow-copy strong {
    display: none;
  }


  .pc-flow-copy small {
    font-size: 0.52rem;
  }


  .pc-hud-right {
    width: 100%;

    justify-content: center;
  }


  .pc-system-status {
    width: 100%;

    justify-content: center;
  }


  .pc-mediator-foreground {
    left: -4.8rem;

    width: 20rem;
  }


  .pc-input-panel {
    width:
        calc(100% - 1rem);
  }


  .pc-dialogue-shell {
    left: 0.5rem;
    right: 0.5rem;
    bottom: 0.5rem;

    min-height: 11rem;

    padding:
        2.8rem
        1rem
        1rem;
  }


  .pc-dialogue-nameplate {
    left: 0.8rem;

    min-width: 9.8rem;

    padding:
        0.62rem
        1rem;
  }


  .pc-dialogue-lines p {
    font-size: 0.92rem;
  }


  .pc-dialogue-toolbar button {
    min-height: 2.15rem;

    padding-inline: 0.75rem;

    font-size: 0.66rem;
  }


  .pc-review-row {
    grid-template-columns: 1fr;

    gap: 0.45rem;
  }


  .pc-review-label,
  .pc-review-value {
    font-size: 0.92rem;
  }


  .pc-review-actions {
    flex-direction: column;
  }


  .pc-review-button {
    width: 100%;
  }

}


/* ==================================================
   SHORT LANDSCAPE

   Mirrors the SelectionPage short
   landscape panel starting dimensions.
================================================== */

@media
(max-height: 720px)
and
(min-width: 761px) {

  .pc-panel-scene {
    --pc-panel-start-width:
        min(
            100%,
            calc(106dvh * 1.7778),
            96rem
        );


    --pc-panel-start-bottom:
        calc(
            -0.5rem
            -
            clamp(
            2rem,
            6vh,
            3.8rem
            )
        );
  }


  .pc-panel-members {
    width: 68%;

    height: 80%;
  }

}


/* ==================================================
   VERY SHORT LANDSCAPE
================================================== */

@media
(max-height: 560px)
and
(min-width: 761px) {

  .pc-panel-scene {
    --pc-panel-start-width:
        min(
            94%,
            calc(115dvh * 1.7778)
        );


    --pc-panel-start-bottom:
        calc(
            -0.5rem
            -
            clamp(
            1.7rem,
            6vh,
            3rem
            )
        );
  }

}


/* ==================================================
   TALL PORTRAIT

   Matches SelectionPage tall mobile start.
================================================== */

@media
(max-width: 760px)
and
(min-height: 850px) {

  .pc-panel-scene {
    --pc-panel-start-width:
        min(
            150%,
            calc(68dvh * 1.7778)
        );


    --pc-panel-start-bottom:
        calc(
            clamp(
            5rem,
            11vh,
            8rem
            )
            -
            clamp(
            1.5rem,
            3.2vh,
            2.8rem
            )
        );
  }

}


/* ==================================================
   ULTRAWIDE

   Matches SelectionPage ultrawide
   starting assembly dimensions.
================================================== */

@media
(min-aspect-ratio: 21 / 9)
and
(min-width: 1400px) {

  .pc-panel-scene {
    --pc-panel-start-width:
        min(
            88vw,
            calc(94dvh * 1.7778),
            112rem
        );
  }

}


/* ==================================================
   REDUCED MOTION
================================================== */

@media
(prefers-reduced-motion: reduce) {

  .pc-panel-scene {
    transition:
        left 120ms ease,
        bottom 120ms ease,
        width 120ms ease;
  }


  .pc-page-back,
  .pc-header,
  .pc-input-panel,
  .pc-mediator-foreground,
  .pc-dialogue-shell,
  .pc-dialogue-toolbar,
  .pc-dialogue-copy {
    transition:
        opacity 120ms ease;
  }


  .pc-ui-reveal--top,
  .pc-ui-reveal--side,
  .pc-mediator-foreground,
  .pc-dialogue-shell,
  .pc-dialogue-toolbar,
  .pc-dialogue-copy {
    transform: none;
  }

}
</style>
