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

import MemberResponseCard
  from '@/components/chamber/anime/discussion/MemberResponseCard.vue'

import MediatorSummaryPanel
  from '@/components/chamber/anime/discussion/MediatorSummaryPanel.vue'

import UserResponsePanel
  from '@/components/chamber/anime/discussion/UserResponsePanel.vue'

import FocusedDiscussionPanel
  from '@/components/chamber/anime/discussion/FocusedDiscussionPanel.vue'


defineOptions({
  name: 'PanelDiscussion'
})


/* ==================================================
   PROPS / EMITS
================================================== */

/*
  PanelDiscussion receives the session created by
  ChamberFlow.

  session:
      Backend-created DebateSession representation.

  calibration:
      Original calibration values. Used only as a
      fallback while the authoritative discussion
      snapshot is loading.

  discussion:
      Optional already-loaded discussion snapshot.

      This allows the parent to provide a snapshot
      without forcing this component to invent its
      own duplicate state.

  councilMode:
      Currently expected to be "panel" here.
*/

const props = defineProps({
  session: {
    type: Object,
    default: null
  },

  councilMode: {
    type: String,
    default: 'panel'
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


/*
  update-discussion:

      Emitted after meaningful backend mutations.

      Payload format:

      {
          reason,
          data,
          state: {
              sessionId,
              status,
              flow,
              outcome
          }
      }


  end-session:

      Emitted only after the backend confirms that
      the session has ended.
*/

const emit = defineEmits([
  'update-discussion',
  'end-session'
])


/* ==================================================
   STORES
================================================== */

const profileStore =
    useProfileStore()


const currentDiscussionStore =
    useCurrentDiscussionStore()


/* ==================================================
   LOCAL PLAIN VALUE HELPER

   Vue store values are reactive proxies.

   This helper creates a safe plain object for events
   sent back to ChamberFlow or another parent.

   It also safely unwraps nested refs and proxies
   before returning the value.

   IMPORTANT:

   This protects values leaving this component.

   The request-context cloning inside:

       currentDiscussion.js

   independently converts discussion state into
   request-safe plain JSON values.
================================================== */

const toPlainValue = (
    value,
    seen = new WeakMap()
) => {

  /* -----------------------------------------------
     UNDEFINED
  ----------------------------------------------- */

  if (
      value === undefined
  ) {
    return undefined
  }


  /* -----------------------------------------------
     UNWRAP REF
  ----------------------------------------------- */

  let source =
      isRef(value)
          ? unref(value)
          : value


  /* -----------------------------------------------
     UNWRAP REACTIVE PROXY
  ----------------------------------------------- */

  if (
      isProxy(source)
  ) {
    source =
        toRaw(source)
  }


  /* -----------------------------------------------
     PRIMITIVES
  ----------------------------------------------- */

  if (
      source === null
      ||
      typeof source !== 'object'
  ) {

    /*
      Functions and symbols should never be sent
      through parent discussion update events.
    */

    if (
        typeof source === 'function'
        ||
        typeof source === 'symbol'
    ) {
      return undefined
    }


    return source
  }


  /* -----------------------------------------------
     ALREADY VISITED
  ----------------------------------------------- */

  if (
      seen.has(source)
  ) {
    return seen.get(source)
  }


  /* -----------------------------------------------
     DATE
  ----------------------------------------------- */

  if (
      source instanceof Date
  ) {
    return new Date(
        source.getTime()
    )
  }


  /* -----------------------------------------------
     ARRAY
  ----------------------------------------------- */

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

          const plainItem =
              toPlainValue(
                  item,
                  seen
              )


          result.push(
              plainItem
          )
        }
    )


    return result
  }


  /* -----------------------------------------------
     MAP
  ----------------------------------------------- */

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


  /* -----------------------------------------------
     SET
  ----------------------------------------------- */

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


  /* -----------------------------------------------
     OBJECT
  ----------------------------------------------- */

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

   ChamberFlow may temporarily create frontend-only
   session identifiers such as:

       draft-1783346726362

   These identifiers are useful while calibration is
   being assembled.

   They are NOT backend DebateSession IDs and must
   never be used in requests such as:

       GET
       /sessions/{id}/discussion/

   The scene therefore waits until a persisted backend
   session ID exists.
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


/*
  Resolve the session ID that is safe to send to the
  backend.

  Priority:

  1. persisted session prop
  2. persisted CurrentDiscussion session ID

  Draft IDs are deliberately ignored.
*/

const resolvePersistedSessionId =
    () => {

      const propSessionId =
          props.session
              ?.id


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
          currentDiscussionStore
              .sessionId


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


/* ==================================================
   SCENE DISCUSSION STATE
================================================== */

/*
  True after loadDiscussion() has successfully
  hydrated the active backend discussion snapshot.
*/

const discussionReady =
    ref(false)


/*
  Initialization error for the scene itself.

  The structured request error still lives in:

      currentDiscussionStore.error
*/

const initializationError =
    ref(null)


/*
  Prevents multiple simultaneous bootstrap requests.
*/

let discussionBootPromise =
    null


/*
  Prevents duplicate frontend current-round
  orchestration calls.
*/

let roundGenerationPromise =
    null


/*
  Used to avoid updating UI state after the
  component has unmounted.
*/

let sceneUnmounted =
    false


/* ==================================================
   MODE
================================================== */

const resolvedMode = computed(() =>
    currentDiscussionStore
        .brief
        ?.councilMode ??

    props.calibration
        ?.councilMode ??

    props.calibration
        ?.council_mode ??

    props.session
        ?.mode ??

    props.councilMode
)


/* ==================================================
   SESSION STATUS
================================================== */

const discussionStatus = computed(() =>
    currentDiscussionStore
        .status
)


const sessionIsActive = computed(() =>
    discussionStatus.value ===
    'active'
)


const sessionIsPaused = computed(() =>
    discussionStatus.value ===
    'paused'
)


const sessionIsComplete = computed(() =>
    (
        discussionStatus.value ===
        'completed'
    )
    ||
    (
        discussionStatus.value ===
        'abandoned'
    )
)


/* ==================================================
   CURRENT SECTION
================================================== */

/*
  These are authoritative store getters.

  Components must receive these values from this
  scene rather than reading sections themselves.
*/

const currentSection = computed(() =>
    currentDiscussionStore
        .currentSection
)


const currentRoundState = computed(() =>
    currentDiscussionStore
        .currentRoundState
)


const currentRoundNumber = computed(() =>
    currentDiscussionStore
        .flow
        .currentRound ??
    1
)


/* ==================================================
   PANEL MEMBERS

   Priority:

   1. currentDiscussion participant snapshot
   2. session snapshot
   3. profile store fallback

   Once loadDiscussion() completes, option 1 should
   always be authoritative.
================================================== */

const storePanelMembers = computed(() => {

  const order =
      currentDiscussionStore
          .participants
          ?.characterOrder ??
      []


  const characters =
      currentDiscussionStore
          .participants
          ?.characters ??
      {}


  return order
      .map(
          characterId =>
              characters[
                  characterId
                  ]
      )
      .filter(Boolean)
})


const panelMembers = computed(() => {

  if (
      storePanelMembers.value
          .length
  ) {
    return storePanelMembers.value
  }


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
      )
      &&
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
   MEDIATOR PARTICIPANT

   This is the PERSONA / PARTICIPANT record.

   The mediator's generated DISCUSSION STATE is
   exposed separately as mediatorState.
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
      props.session
          ?.mediator ??

      props.session
          ?.mediatorSnapshot ??

      props.session
          ?.mediator_snapshot ??

      profileStore
          .councilMediator ??

      profileStore
          .mediator ??

      null
  )
})


const mediatorState = computed(() =>
    currentSection.value
        ?.mediator ??
    null
)


/* ==================================================
   CHARACTER IMAGES
================================================== */

/*
  Normal council member path:

      /images/chamber/char/{id}/NeonOffice.png
*/

const characterImage = member => {

  if (!member?.id) {
    return ''
  }


  return (
      `/images/chamber/char/` +
      `${member.id}/` +
      `NeonOffice.png`
  )
}


/*
  Mediator path:

      /images/chamber/char/{id}/mediator/NeonOffice.png
*/

const mediatorImage = computed(() => {

  if (
      !mediatorParticipant.value
          ?.id
  ) {
    return ''
  }


  return (
      `/images/chamber/char/` +
      `${mediatorParticipant.value.id}/` +
      `mediator/NeonOffice.png`
  )
})


/* ==================================================
   CHARACTER STATE ACCESS

   This is the cumulative authoritative character
   state for the entire section.

   It contains:

   - latest structured position
   - confidence history
   - risks
   - actions
   - agreements
   - disagreements
   - statement history across rounds
   - focused discussions

   MemberResponseCard should not receive this raw
   cumulative state directly.
================================================== */

const characterStateFor =
    characterId => {

      return (
          currentSection.value
              ?.characters?.[
              characterId
              ] ??

          null
      )
    }


/* ==================================================
   CURRENT-ROUND CHARACTER PRESENTATION STATE

   The authoritative character state is cumulative.

   That means it contains the character's latest
   position plus statement history across every round.

   MemberResponseCard must NOT receive that cumulative
   state directly, otherwise Round N+1 briefly displays
   Round N text while the new response is being
   generated.

   This helper derives a presentation-only state for
   the active round:

       no active-round response
           -> pending / empty card

       active-round response exists
           -> current character state + only the
              active round's statement history

   The store and backend still keep full history.
================================================== */

const currentRoundCharacterStateFor =
    characterId => {

      const characterState =
          characterStateFor(
              characterId
          )


      if (!characterState) {
        return null
      }


      const roundNumber =
          Number(
              currentRoundNumber.value
          )


      const roundStatements =
          (
              characterState
                  .statementHistory ??
              []
          )
              .filter(
                  statement => {

                    const statementRound =
                        statement
                            ?.roundNumber ??

                        statement
                            ?.round_number ??

                        statement
                            ?.round ??

                        statement
                            ?.metadata
                            ?.roundNumber ??

                        statement
                            ?.metadata
                            ?.round_number ??

                        null


                    return (
                        statementRound !==
                        null

                        &&

                        Number(
                            statementRound
                        )
                        ===
                        roundNumber
                    )
                  }
              )


      /*
        No response has landed for this member in the
        current round yet.

        Return an empty presentation state so the card
        visibly resets to WAITING / THINKING instead of
        retaining the previous round's text.
      */

      if (
          !roundStatements.length
      ) {
        return {
          ...characterState,

          status:
              'pending',

          position: {
            stance:
                'undecided',

            statement:
                '',

            reasoning:
                ''
          },

          risks:
              [],

          actions:
              [],

          agreements:
              [],

          disagreements:
              [],

          statementHistory:
              []
        }
      }


      /*
        Once the current-round response exists, expose
        the latest structured character state while
        limiting visible statement history to this
        round only.
      */

      return {
        ...characterState,

        statementHistory:
        roundStatements
      }
    }


/* ==================================================
   ROUND REACTION ACCESS

   Return value:

       "agree"
       "disagree"
       null
================================================== */

const reactionFor =
    characterId => {

      return (
          currentRoundState.value
              ?.reactions?.[
              characterId
              ] ??

          null
      )
    }


/* ==================================================
   CHARACTER GENERATION STATE

   The store tracks generation by character ID.

   This lets each response card independently show:

       waiting
       thinking
       complete

   without every card displaying a loading state when
   only one character is currently generating.
================================================== */

const characterIsGenerating =
    characterId => {

      return currentDiscussionStore
          .isCharacterGenerating(
              characterId
          )
    }


/* ==================================================
   MEMBER CARD VIEW MODELS

   Each member card receives a current-round
   presentation state rather than the cumulative
   section-level character state.

   This is what gives the intended visual flow:

       round changes
           ↓
       cards reset to waiting
           ↓
       one card becomes thinking
           ↓
       response arrives
           ↓
       next card becomes thinking
================================================== */

const memberCardModels = computed(() =>
    panelMembers.value.map(
        participant => ({
          participant,

          characterState:
              currentRoundCharacterStateFor(
                  participant.id
              ),

          reaction:
              reactionFor(
                  participant.id
              ),

          loading:
              characterIsGenerating(
                  participant.id
              ),

          roundNumber:
          currentRoundNumber.value
        })
    )
)


/* ==================================================
   SELECTED MEMBER FOR USER RESPONSE UI

   This is PRESENTATION STATE ONLY.

   Selecting a member here does not turn the VN input
   into direct character chat.

   Global user replies still use:

       replyToCouncil()

   or:

       presentOpposingView()

   The selected member is useful for displaying:

       RESPONDING TO
       YOUR STANCE
       WHY ARE YOU AGREEING?

   like the supplied visual reference.
================================================== */

const selectedCharacterId =
    ref(null)


/*
  Successful user replies for the active round.

  These records drive the left-side reply history and
  the "respond to at least two" round gate. They are
  cleared only when the active round actually changes.
*/

const currentRoundReplies =
    ref([])


watch(
    currentRoundNumber,

    () => {
      currentRoundReplies.value = []
    }
)


const selectedParticipant = computed(() => {

  if (
      !selectedCharacterId.value
  ) {
    return null
  }


  return (
      currentDiscussionStore
          .participants
          ?.characters?.[
          selectedCharacterId.value
          ] ??

      panelMembers.value.find(
          member =>
              String(member.id) ===
              String(
                  selectedCharacterId.value
              )
      ) ??

      null
  )
})


const selectedCharacterState = computed(() => {

  if (
      !selectedCharacterId.value
  ) {
    return null
  }


  return characterStateFor(
      selectedCharacterId.value
  )
})


const selectedReaction = computed(() => {

  if (
      !selectedCharacterId.value
  ) {
    return null
  }


  return reactionFor(
      selectedCharacterId.value
  )
})


/* ==================================================
   KEEP RESPONSE SELECTION VALID

   Default to the first panel member.

   If the panel changes, ensure the selected ID still
   belongs to the current participant snapshot.
================================================== */

watch(
    panelMembers,

    members => {

      if (!members.length) {
        selectedCharacterId.value =
            null

        return
      }


      const stillExists =
          members.some(
              member =>
                  String(member.id) ===
                  String(
                      selectedCharacterId.value
                  )
          )


      if (!stillExists) {
        selectedCharacterId.value =
            String(
                members[0].id
            )
      }
    },

    {
      immediate: true
    }
)


/* ==================================================
   FOCUSED DISCUSSION STATE
================================================== */

const focusedDiscussion = computed(() =>
    currentDiscussionStore
        .currentDiscussion
)


/*
  Pin the exact card that the user clicked.

  flow.currentCharacterId is also used by normal council
  generation, so it may still contain the most recently
  generated panel member when a focused discussion starts.

  That value must never be used as the opening animation's
  source of truth while the focused branch is still being
  created.
*/

const pendingFocusedCharacterId =
    ref(null)


const focusedCharacterId = computed(() => {

  const pendingId =
      pendingFocusedCharacterId.value


  if (pendingId) {
    return String(
        pendingId
    )
  }


  const discussionCharacterId =
      focusedDiscussion.value
          ?.characterId ??

      focusedDiscussion.value
          ?.character_id ??

      null


  if (discussionCharacterId) {
    return String(
        discussionCharacterId
    )
  }


  const storeCharacterId =
      currentDiscussionStore
          .flow
          .currentCharacterId


  return storeCharacterId
      ? String(storeCharacterId)
      : null
})


const focusedParticipant = computed(() => {

  const characterId =
      focusedCharacterId.value


  if (!characterId) {
    return null
  }


  return (
      currentDiscussionStore
          .participants
          ?.characters?.[
          characterId
          ] ??

      panelMembers.value.find(
          member =>
              String(member.id) ===
              String(characterId)
      ) ??

      null
  )
})


/* ==================================================
   CURRENT ROUND STATE

   Generation is no longer treated as Round-1-only.

   Every active round uses:

       charactersMissingCurrentRoundResponse
       mediatorHasCurrentRoundResponse

   The store owns request execution.

   PanelDiscussion owns orchestration timing.
================================================== */

const currentRoundMissingCharacters = computed(() =>
    currentDiscussionStore
        .charactersMissingCurrentRoundResponse
)


const currentMediatorMissing = computed(() =>
    !currentDiscussionStore
        .mediatorHasCurrentRoundResponse
)


const currentRoundComplete = computed(() => {

  return (
      currentRoundMissingCharacters.value
          .length ===
      0

      &&

      !currentMediatorMissing.value
  )
})


/* ==================================================
   GLOBAL INTERACTION LOCK

   Child components receive this as:

       disabled
       locked

   Controls should be unavailable when:

   - discussion is not ready
   - session is not active
   - current round is still generating
   - another backend mutation is running
================================================== */

const interactionLocked = computed(() => {

  return (
      !discussionReady.value

      ||

      !sessionIsActive.value

      ||

      !currentRoundComplete.value

      ||

      currentDiscussionStore
          .isBusy
  )
})


/* ==================================================
   MEDIATOR SUPPORT CONTENT FOR USER PANEL
================================================== */

const responseAngles = computed(() => {

  const angles = []


  const mediatorQuestions =
      mediatorState.value
          ?.questionsForUser ??
      []


  const unresolved =
      mediatorState.value
          ?.unresolvedPoints ??
      []


  const selectedRisks =
      selectedCharacterState.value
          ?.risks ??
      []


  mediatorQuestions.forEach(
      item => {
        angles.push({
          type: 'question',

          value: item
        })
      }
  )


  unresolved.forEach(
      item => {
        angles.push({
          type: 'unresolved_point',

          value: item
        })
      }
  )


  selectedRisks
      .slice(0, 3)
      .forEach(
          item => {
            angles.push({
              type: 'risk',

              value: item
            })
          }
      )


  return angles
})


/* ==================================================
   PARENT UPDATE NOTIFICATION
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
            toPlainValue(
                data
            ),

        state: {
          sessionId:
          currentDiscussionStore
              .sessionId,

          status:
          currentDiscussionStore
              .status,

          flow:
              toPlainValue(
                  currentDiscussionStore
                      .flow
              ),

          outcome:
              toPlainValue(
                  currentDiscussionStore
                      .outcome
              )
        }
      }
  )
}


/* ==================================================
   ACTIVE DISCUSSION BOOTSTRAP

   FLOW:

   1. Resolve persisted session ID.
   2. Ignore frontend-only draft session IDs.
   3. Initialize the store if necessary.
   4. Hydrate optional parent snapshot.
   5. GET /discussion/
   6. Backend activates ready session.
   7. Backend creates/resolves round 1.
   8. Store hydrates full snapshot.
   9. Scene becomes ready.
================================================== */

const initializeActiveDiscussion =
    async () => {

      const sessionId =
          resolvePersistedSessionId()


      if (!sessionId) {

        console.debug(
            '[PanelDiscussion] Waiting for persisted session ID.',
            {
              propSessionId:
                  props.session
                      ?.id ??
                  null,

              storeSessionId:
                  currentDiscussionStore
                      .sessionId ??
                  null
            }
        )


        return null
      }


      if (discussionBootPromise) {
        return discussionBootPromise
      }


      discussionBootPromise =
          (
              async () => {

                initializationError.value =
                    null


                try {

                  /* ==========================================
                     INITIALIZE SESSION IDENTITY
                  ========================================== */

                  const currentStoreSessionId =
                      currentDiscussionStore
                          .sessionId


                  if (
                      !isPersistedSessionId(
                          currentStoreSessionId
                      )
                      ||
                      String(
                          currentStoreSessionId
                      )
                      !==
                      String(
                          sessionId
                      )
                  ) {
                    currentDiscussionStore
                        .initializeFromChamber({
                          sessionId
                        })
                  }


                  /* ==========================================
                     OPTIONAL PRELOADED SNAPSHOT
                  ========================================== */

                  if (
                      props.discussion
                  ) {
                    const plainDiscussion =
                        toPlainValue(
                            props.discussion
                        )


                    currentDiscussionStore
                        .hydrate(
                            plainDiscussion
                        )
                  }


                  /* ==========================================
                     FINAL SESSION SAFETY CHECK
                  ========================================== */

                  if (
                      !isPersistedSessionId(
                          sessionId
                      )
                  ) {
                    console.debug(
                        '[PanelDiscussion] Bootstrap skipped for draft session:',
                        sessionId
                    )


                    return null
                  }


                  /* ==========================================
                     LOAD + ACTIVATE DISCUSSION
                  ========================================== */

                  const data =
                      await currentDiscussionStore
                          .loadDiscussion(
                              sessionId
                          )


                  if (
                      sceneUnmounted
                  ) {
                    return data
                  }


                  const currentResolvedSessionId =
                      resolvePersistedSessionId()


                  if (
                      currentResolvedSessionId
                      &&
                      String(
                          currentResolvedSessionId
                      )
                      !==
                      String(
                          sessionId
                      )
                  ) {

                    console.debug(
                        '[PanelDiscussion] Ignoring stale discussion bootstrap result.',
                        {
                          requestedSessionId:
                          sessionId,

                          currentSessionId:
                          currentResolvedSessionId
                        }
                    )


                    return data
                  }


                  discussionReady.value =
                      true


                  console.log(
                      '[PanelDiscussion] Discussion ready:',
                      {
                        sessionId:
                        currentDiscussionStore
                            .sessionId,

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

                        characters:
                        currentDiscussionStore
                            .participants
                            .characterOrder
                      }
                  )


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
                      '[PanelDiscussion] Initialization failed:',
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
   CURRENT ROUND GENERATION

   This orchestration is used for every active round.

   ROUND 1:

       empty cards
       ↓
       character responses sequentially
       ↓
       mediator synthesis

   LATER ROUNDS:

       backend advances state
       ↓
       cards immediately derive empty current-round
       presentation state
       ↓
       character responses sequentially react to:
           user intervention
           reactions
           prior council positions
           mediator synthesis
       ↓
       mediator synthesis

   The store safely skips character responses that
   already exist for the current round.
================================================== */

const ensureCurrentRound =
    async () => {

      if (roundGenerationPromise) {
        return roundGenerationPromise
      }


      roundGenerationPromise =
          (
              async () => {

                /*
                  Ensure the backend discussion has been
                  loaded and activated first.
                */

                if (
                    !discussionReady.value
                ) {
                  await initializeActiveDiscussion()
                }


                /*
                  Initialization may have returned without
                  loading because ChamberFlow still had only
                  a frontend draft ID.

                  The session watcher will call this again
                  when the persisted UUID becomes available.
                */

                if (
                    !discussionReady.value
                ) {
                  return null
                }


                /*
                  Never generate against a draft or missing
                  session identity.
                */

                const sessionId =
                    resolvePersistedSessionId()


                if (
                    !sessionId
                ) {
                  return null
                }


                /*
                  Generation only runs while the session is
                  active.
                */

                if (
                    !sessionIsActive.value
                ) {
                  return null
                }


                /*
                  Nothing to generate for the active round.
                */

                if (
                    currentRoundComplete.value
                ) {
                  return null
                }


                const roundNumber =
                    Number(
                        currentRoundNumber.value
                    )


                /*
                  The store method is historically named
                  generateInitialRound(), but its internals
                  already operate on whatever round is active:

                      missing character responses
                      then mediator synthesis

                  Round 1 receives the initial-position task.

                  Later rounds receive a continuation task so
                  the patched debate engine explicitly reacts
                  to user interventions, reactions, prior
                  council positions, and mediator synthesis.
                */

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

      } catch (error) {

        console.error(
            '[PanelDiscussion] Current round generation failed:',
            error
        )


        throw error

      } finally {

        roundGenerationPromise =
            null
      }
    }


/* ==================================================
   MEMBER SELECTION
================================================== */

const selectResponseMember =
    characterId => {

      const exists =
          panelMembers.value.some(
              member =>
                  String(member.id) ===
                  String(characterId)
          )


      if (!exists) {
        return false
      }


      selectedCharacterId.value =
          String(
              characterId
          )


      return true
    }


/* ==================================================
   MEMBER REACTIONS

   Reaction buttons are local round-state changes.

   Backend persistence occurs when the user advances
   the round.
================================================== */

const handleAgree =
    characterId => {

      selectResponseMember(
          characterId
      )


      return currentDiscussionStore
          .setMemberReaction(
              characterId,
              'agree'
          )
    }


const handleDisagree =
    characterId => {

      selectResponseMember(
          characterId
      )


      return currentDiscussionStore
          .setMemberReaction(
              characterId,
              'disagree'
          )
    }


/* ==================================================
   OPEN FOCUSED DISCUSSION
================================================== */

const handleOpenPointDiscussion =
    async (
        characterId,
        point
    ) => {

      if (
          interactionLocked.value
      ) {
        return null
      }


      const sourceType =
          point?.sourceType ??
          point?.type ??
          'other'


      const sourceId =
          point?.sourceId ??
          point?.id ??
          null


      const topic =
          point?.topic ??

          point?.statement ??

          point?.title ??

          point?.text ??

          ''


      if (
          !sourceId ||
          !topic
      ) {
        console.warn(
            '[PanelDiscussion] Invalid focused discussion point:',
            point
        )

        return null
      }


      const focusedCharacterId =
          String(
              characterId
          )


      selectResponseMember(
          focusedCharacterId
      )


      /*
        Set the exact clicked member before the store request.

        The focused panel can now show the correct portrait,
        name, and typing state on the very first render frame.
      */

      pendingFocusedCharacterId.value =
          focusedCharacterId


      try {

        const data =
            await currentDiscussionStore
                .openSubDiscussion({
                  characterId:
                  focusedCharacterId,

                  sourceType,

                  sourceId,

                  topic
                })


        emitDiscussionUpdate(
            'focused-discussion-opened',
            data
        )


        return data

      } finally {

        pendingFocusedCharacterId.value =
            null
      }
    }


/* ==================================================
   FOCUSED DISCUSSION SEND
================================================== */

const handleFocusedDiscussionSend =
    async payload => {

      const content =
          typeof payload ===
          'string'
              ? payload

              : payload
                  ?.content


      if (
          !content?.trim()
      ) {
        return null
      }


      const data =
          await currentDiscussionStore
              .continueSubDiscussion({
                content:
                    content.trim()
              })


      emitDiscussionUpdate(
          'focused-discussion-message',
          data
      )


      return data
    }


const handleCloseFocusedDiscussion =
    () => {

      pendingFocusedCharacterId.value =
          null


      currentDiscussionStore
          .closeCurrentDiscussion()


      emitDiscussionUpdate(
          'focused-discussion-closed'
      )
    }


/* ==================================================
   GENERIC USER RESPONSE SUBMITTER

   Preferred child payload:

   {
       mode: "reply",
       content: "..."
   }

   or:

   {
       mode: "opposing",
       content: "..."
   }
================================================== */

const handleUserResponseSubmit =
    async payload => {

      if (
          interactionLocked.value
      ) {
        return null
      }


      const mode =
          payload?.mode ??
          'reply'


      const content =
          payload?.content
              ?.trim()


      if (!content) {
        return null
      }


      let data


      if (
          mode ===
          'opposing'
      ) {
        data =
            await currentDiscussionStore
                .presentOpposingView(
                    content
                )
      } else {
        data =
            await currentDiscussionStore
                .replyToCouncil(
                    content
                )
      }


      emitDiscussionUpdate(
          mode === 'opposing'
              ? 'opposing-view-submitted'
              : 'council-reply-submitted',

          data
      )


      const serverResponse =
          data?.userResponse
          ??
          data?.user_response
          ??
          data?.input
          ??
          data?.intervention
          ??
          data


      const serverId =
          serverResponse?.id
          ??
          serverResponse?.responseId
          ??
          serverResponse?.response_id
          ??
          null


      currentRoundReplies.value.push({
        id:
            serverId
            ??
            payload?.clientId
            ??
            `reply-${Date.now()}`,

        serverId,

        characterId:
            payload?.characterId
            ??
            selectedParticipant.value?.id,

        characterName:
            payload?.characterName
            ??
            selectedParticipant.value?.name
            ??
            'Council Member',

        reaction:
            payload?.reaction
            ??
            selectedReaction.value,

        mode,
        content,

        roundNumber:
        currentRoundNumber.value
      })


      return data
    }


/* ==================================================
   DELETE A CURRENT-ROUND USER REPLY

   If the store exposes a backend deletion mutation,
   use it before removing the visual record. The local
   record is still removable in projects where replies
   are intentionally staged client-side until advance.
================================================== */

const handleDeleteUserResponse =
    async reply => {

      if (
          !reply?.id
          ||
          currentDiscussionStore.isBusy
      ) {
        return false
      }


      const deleteMutation =
          currentDiscussionStore.deleteUserResponse
          ??
          currentDiscussionStore.removeUserResponse
          ??
          currentDiscussionStore.deleteUserInput
          ??
          currentDiscussionStore.removeUserInput


      if (
          reply.serverId
          &&
          typeof deleteMutation === 'function'
      ) {
        const data =
            await deleteMutation.call(
                currentDiscussionStore,
                reply.serverId
            )


        emitDiscussionUpdate(
            'user-response-deleted',
            data
        )
      }


      currentRoundReplies.value =
          currentRoundReplies.value.filter(
              item =>
                  String(item.id) !==
                  String(reply.id)
          )


      return true
    }


/* ==================================================
   OPTIONAL DIRECT REPLY HANDLERS
================================================== */

const handleCouncilReply =
    async payload => {

      const content =
          typeof payload ===
          'string'
              ? payload

              : payload
                  ?.content


      return handleUserResponseSubmit({
        mode:
            'reply',

        content
      })
    }


const handleOpposingView =
    async payload => {

      const content =
          typeof payload ===
          'string'
              ? payload

              : payload
                  ?.content


      return handleUserResponseSubmit({
        mode:
            'opposing',

        content
      })
    }


/* ==================================================
   NEXT ROUND

   FLOW:

       persist current reactions
       ↓
       complete current round
       ↓
       create next active round
       ↓
       frontend flow updates immediately
       ↓
       cards derive empty state for new round
       ↓
       character 1 thinking → response
       ↓
       character 2 thinking → response
       ↓
       ...
       ↓
       mediator thinking → synthesis

   AI generation is deliberately not performed inside
   the backend control request.
================================================== */

const handleNextRound =
    async () => {

      if (
          interactionLocked.value
      ) {
        return null
      }


      /*
        1. Persist current reactions.
        2. Complete the current round.
        3. Create the next active round.
        4. Apply the returned flow update locally.

        The backend control endpoint no longer performs
        synchronous AI generation.
      */

      const data =
          await currentDiscussionStore
              .advanceRound()


      /*
        Keep response context valid after the round
        changes.
      */

      if (
          !selectedCharacterId.value
          &&
          panelMembers.value.length
      ) {
        selectedCharacterId.value =
            String(
                panelMembers.value[0].id
            )
      }


      /*
        Notify the parent immediately after the state
        transition.

        At this point currentRoundNumber has changed,
        so currentRoundCharacterStateFor() causes every
        MemberResponseCard to reset to its empty state.
      */

      emitDiscussionUpdate(
          'round-advanced',
          data
      )


      /*
        Allow Vue's reactive queue to observe the new
        current round before sequential AI responses
        begin arriving.

        The request itself is asynchronous, so the
        browser will also naturally receive rendering
        opportunities while generation is underway.
      */

      await Promise.resolve()


      /*
        Generate all missing responses for the new
        current round.

        The store handles characters sequentially and
        then requests mediator synthesis.

        Each character card therefore moves through:

            waiting
            thinking
            populated

        independently.
      */

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
   PAUSE SESSION
================================================== */

const handlePauseSession =
    async () => {

      if (
          !sessionIsActive.value
      ) {
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


/* ==================================================
   RESUME SESSION
================================================== */

const handleResumeSession =
    async () => {

      if (
          !sessionIsPaused.value
      ) {
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


/* ==================================================
   END SESSION
================================================== */

const handleEndSession =
    async () => {

      if (
          sessionIsComplete.value
      ) {
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
            currentDiscussionStore
                .sessionId,

            status:
            currentDiscussionStore
                .status,

            outcome:
                toPlainValue(
                    currentDiscussionStore
                        .outcome
                ),

            data:
                toPlainValue(
                    data
                )
          }
      )


      return data
    }


/* ==================================================
   ERROR RETRY

   Current intended retry behavior:

   initialization error:
       retry bootstrap

   partial current-round failure:
       retry ensureCurrentRound()

   The store skips already-generated characters for
   the active round, so retrying does not blindly
   regenerate completed member responses.
================================================== */

const retryDiscussionInitialization =
    async () => {

      initializationError.value =
          null


      const result =
          await initializeActiveDiscussion()


      if (
          discussionReady.value
          &&
          showMemberResponses.value
          &&
          !currentRoundComplete.value
      ) {
        await ensureCurrentRound()
      }


      return result
    }


const retryInitialRound =
    async () => {

      currentDiscussionStore
          .clearError()


      return ensureCurrentRound()
    }


/* ==================================================
   ANIMATION STATE

   Scene animation is deliberately separate from
   backend state.

   The frontend decides when elements appear.

   The backend decides what those elements contain.
================================================== */

const isShifted =
    ref(false)


const showSidebar =
    ref(false)


const showMemberResponses =
    ref(false)


const showUserResponse =
    ref(false)


/* ==================================================
   TIMING
================================================== */

const SHIFT_DELAY =
    500


const SHIFT_DURATION =
    1250


const POST_SHIFT_PAUSE =
    1000


const UI_STAGE_GAP =
    500


const SIDEBAR_REVEAL =
    SHIFT_DELAY +
    SHIFT_DURATION +
    POST_SHIFT_PAUSE


const MEMBER_REVEAL =
    SIDEBAR_REVEAL +
    UI_STAGE_GAP


const RESPONSE_REVEAL =
    MEMBER_REVEAL +
    UI_STAGE_GAP


/* ==================================================
   TIMER MANAGEMENT
================================================== */

const timers =
    []


const schedule = (
    callback,
    delay
) => {

  const timer =
      window.setTimeout(
          () => {

            if (
                sceneUnmounted
            ) {
              return
            }


            callback()
          },

          delay
      )


  timers.push(
      timer
  )
}


/* ==================================================
   EXTERNAL DISCUSSION SNAPSHOT SYNC
================================================== */

watch(
    () => props.discussion,

    discussion => {

      if (!discussion) {
        return
      }


      const plainDiscussion =
          toPlainValue(
              discussion
          )


      currentDiscussionStore
          .hydrate(
              plainDiscussion
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

    async (
        nextSessionId,
        previousSessionId
    ) => {

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
              '[PanelDiscussion] Draft session detected. Waiting for backend session.',
              nextSessionId
          )
        }


        return
      }


      const nextNormalized =
          normalizeSessionId(
              nextSessionId
          )


      const currentStoreSession =
          normalizeSessionId(
              currentDiscussionStore
                  .sessionId
          )


      if (
          discussionReady.value
          &&
          currentStoreSession
          &&
          String(
              currentStoreSession
          )
          ===
          String(
              nextNormalized
          )
      ) {
        return
      }


      discussionReady.value =
          false


      initializationError.value =
          null


      roundGenerationPromise =
          null


      try {

        await initializeActiveDiscussion()


        if (
            showMemberResponses.value
            &&
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
            '[PanelDiscussion] Session synchronization failed:',
            {
              previousSessionId,

              nextSessionId,

              error
            }
        )
      }
    }
)


/* ==================================================
   DISCUSSION READY / CARD VISIBILITY SYNC

   This handles cases where discussion bootstrap and
   visual reveal finish in either order.

   The roundGenerationPromise guard prevents duplicate
   orchestration.
================================================== */

watch(
    [
      discussionReady,
      showMemberResponses
    ],

    ([
       ready,
       cardsVisible
     ]) => {

      if (
          !ready
          ||
          !cardsVisible
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
                    '[PanelDiscussion] Deferred round generation error:',
                    error
                )
              }
          )
    }
)


/* ==================================================
   MOUNT

   Two processes begin together:

   A. BACKEND BOOTSTRAP
      Load and activate the real discussion when a
      persisted backend session ID exists.

   B. VISUAL SEQUENCE
      Move scene and reveal UI.

   Current-round generation starts only when response
   boxes are visible.

   For Round 1 that gives:

       empty cards
       ↓
       one member thinking
       ↓
       member populated
       ↓
       next member thinking

   Later rounds are started by handleNextRound().
================================================== */

onMounted(() => {

  sceneUnmounted =
      false


  /* -----------------------------------------------
     Begin backend discussion bootstrap immediately.
  ----------------------------------------------- */

  void initializeActiveDiscussion()
      .catch(
          error => {

            console.error(
                '[PanelDiscussion] Bootstrap error:',
                error
            )
          }
      )


  /* -----------------------------------------------
     Start scene movement.
  ----------------------------------------------- */

  schedule(
      () => {

        isShifted.value =
            true

      },

      SHIFT_DELAY
  )


  /* -----------------------------------------------
     Sidebar reveal.
  ----------------------------------------------- */

  schedule(
      () => {

        showSidebar.value =
            true

      },

      SIDEBAR_REVEAL
  )


  /* -----------------------------------------------
     Member-card reveal.

     This is where current-round generation becomes
     eligible to start.

     On initial mount this normally means Round 1.

     Later rounds are explicitly triggered through
     handleNextRound().
  ----------------------------------------------- */

  schedule(
      () => {

        showMemberResponses.value =
            true


        void ensureCurrentRound()
            .catch(
                error => {

                  console.error(
                      '[PanelDiscussion] Current round generation error:',
                      error
                  )
                }
            )

      },

      MEMBER_REVEAL
  )


  /* -----------------------------------------------
     User controller reveal.

     The component may be visible while locked.

     It becomes interactive automatically when:

         discussionReady
         session active
         current round complete
         store not busy
  ----------------------------------------------- */

  schedule(
      () => {

        showUserResponse.value =
            true

      },

      RESPONSE_REVEAL
  )
})


/* ==================================================
   CLEANUP
================================================== */

onBeforeUnmount(() => {

  sceneUnmounted =
      true


  pendingFocusedCharacterId.value =
      null


  timers.forEach(
      timer => {

        window.clearTimeout(
            timer
        )
      }
  )


  timers.length =
      0
})


/* ==================================================
   CHILD COMPONENT CONNECTION REFERENCE
================================================== */


/* ==================================================
   MEMBER RESPONSE CARD

   MemberResponseCard receives round-specific
   presentation state.

   It must never:

   - call APIs directly
   - advance rounds
   - maintain independent debate history
================================================== */


/* ==================================================
   FOCUSED DISCUSSION PANEL

   FocusedDiscussionPanel receives the active branch
   from the store and emits user intent back upward.
================================================== */


/* ==================================================
   MEDIATOR SUMMARY PANEL

   MediatorSummaryPanel renders structured mediator
   state.

   It does not generate or infer council state itself.
================================================== */


/* ==================================================
   USER RESPONSE PANEL

   UserResponsePanel emits:

       submit
       next-round
       pause
       resume
       end-session
       select-character

   All backend mutations remain routed through the
   scene handlers above.
================================================== */

</script>


<template>
  <section
      class="discussion-scene"
      :class="{
        shifted: isShifted
      }"
  >

    <!-- ==================================================
         BACKGROUND
    ================================================== -->

    <div class="background-track">

      <div class="chamber-bg"></div>

    </div>


    <!-- ==================================================
         ROOM EFFECTS
    ================================================== -->

    <div class="chamber-vignette"></div>

    <div class="city-bloom"></div>


    <!-- ==================================================
         MOVING PANEL SCENE
    ================================================== -->

    <div
        v-if="
          resolvedMode === 'panel'
        "
        class="scene-track"
    >
      <div class="scene-layer">

        <div class="panel-scene">


          <!-- ============================================
               MEMBER RESPONSE PANELS

               Same coordinate system and grid geometry
               as the characters.
          ============================================= -->

          <div
              class="member-response-row"
              :class="{
      visible:
          showMemberResponses
    }"
          >

            <MemberResponseCard
                v-for="model in memberCardModels"
                :key="
        `response-${model.participant.id}`
      "

                :participant="
        model.participant
      "

                :character-state="
        model.characterState
      "

                :reaction="
        model.reaction
      "

                :loading="
        model.loading
      "

                :disabled="
        interactionLocked
      "

                :round-number="
        model.roundNumber
      "

                @select="
        selectResponseMember(
          model.participant.id
        )
      "

                @agree="
        handleAgree(
          model.participant.id
        )
      "

                @disagree="
        handleDisagree(
          model.participant.id
        )
      "

                @open-point-discussion="
        point =>
          handleOpenPointDiscussion(
            model.participant.id,
            point
          )
      "
            />

          </div>


          <!-- ============================================
               CHARACTERS
          ============================================= -->

          <div class="panel-members">

            <div
                v-for="member in panelMembers"
                :key="member.id"
                class="panel-member"
            >
              <img
                  :src="
                    characterImage(member)
                  "
                  :alt="
                    member.name
                  "
              >
            </div>

          </div>


          <!-- ============================================
               TABLE
          ============================================= -->

          <img
              class="group-table"
              src="/images/chamber/groupTable.png"
              alt=""
          >

        </div>

      </div>
    </div>


    <!-- ==================================================
         FIXED DISCUSSION UI
    ================================================== -->

    <div class="discussion-ui">


      <!-- ================================================
           RIGHT SIDEBAR

           Both sidebar components appear together.
      ================================================= -->

      <div
          class="discussion-side"
          :class="{
      visible:
          showSidebar
    }"
      >

        <!-- ================================================
             FOCUSED DISCUSSION
        ================================================= -->

        <FocusedDiscussionPanel

            :discussion="
        focusedDiscussion
      "

            :participant="
        focusedParticipant
      "

            :loading="
        currentDiscussionStore
            .isSendingInput
        ||
        currentDiscussionStore
            .isOpeningDiscussion
      "

            :disabled="
        !sessionIsActive
        ||
        currentDiscussionStore
            .isBusy
      "

            @send="
        handleFocusedDiscussionSend
      "

            @close="
        handleCloseFocusedDiscussion
      "

        />


        <!-- ================================================
             MEDIATOR SUMMARY
        ================================================= -->

        <MediatorSummaryPanel

            :participant="
        mediatorParticipant
      "

            :mediator-state="
        mediatorState
      "

            :loading="
        currentDiscussionStore
            .isGeneratingMediator
      "

            :round-number="
        currentRoundNumber
      "

            :status="
        discussionStatus
      "

        />

      </div>


      <!-- ================================================
           USER RESPONSE
      ================================================= -->

      <div
          class="user-response-panel"
          :class="{
      visible:
          showUserResponse
    }"
      >

        <UserResponsePanel

            :status="
        discussionStatus
      "

            :busy="
        currentDiscussionStore
            .isBusy
      "

            :disabled="
        interactionLocked
      "

            :round-number="
        currentRoundNumber
      "

            :selected-participant="
        selectedParticipant
      "

            :selected-character-state="
        selectedCharacterState
      "

            :reaction="
        selectedReaction
      "

            :response-angles="
        responseAngles
      "

            :panel-members="
        panelMembers
      "

            :reactions="
        currentRoundState
            ?.reactions
        ??
        {}
      "

            :replies="
        currentRoundReplies
      "

            :minimum-replies="2"

            @submit="
        handleUserResponseSubmit
      "

            @next-round="
        handleNextRound
      "

            @pause="
        handlePauseSession
      "

            @resume="
        handleResumeSession
      "

            @end-session="
        handleEndSession
      "

            @select-character="
        selectResponseMember
      "

            @delete-response="
        handleDeleteUserResponse
      "

        />

      </div>

    </div>

  </section>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.discussion-scene {
  --bg-start-x: 4vw;
  --bg-pan-x: -2vw;

  --scene-pan-x: -14%;

  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 100dvh;

  overflow: hidden;

  background: #020108;

  isolation: isolate;
}


/* ==================================================
   BACKGROUND
================================================== */

.background-track {
  position: absolute;

  inset: 0 -3%;

  z-index: 0;

  transform:
      translateX(
          var(--bg-start-x)
      )
      scaleX(1.055);

  transform-origin:
      top center;

  transition:
      transform
      1250ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );

  will-change: transform;
}


.chamber-bg {
  position: absolute;

  inset: 0;

  background:
      url('/images/chamber/bg.png')
      center
      center /
      cover
      no-repeat;
}


.discussion-scene.shifted
.background-track {
  transform:
      translateX(
          var(--bg-pan-x)
      )
      scaleX(1.055);
}


/* ==================================================
   VIGNETTE
================================================== */

.chamber-vignette {
  position: absolute;

  inset: 0;

  z-index: 1;

  pointer-events: none;

  background:
      radial-gradient(
          circle at 54% 44%,
          transparent 10%,
          rgba(3, 0, 12, 0.08) 45%,
          rgba(1, 0, 7, 0.72) 100%
      ),
      linear-gradient(
          to bottom,
          rgba(2, 0, 9, 0.1),
          rgba(1, 0, 7, 0.04) 48%,
          rgba(1, 0, 7, 0.72) 100%
      );
}


/* ==================================================
   CITY BLOOM
================================================== */

.city-bloom {
  position: absolute;

  inset: 0;

  z-index: 2;

  pointer-events: none;

  background:
      radial-gradient(
          ellipse at 51% 53%,
          rgba(80, 45, 255, 0.16),
          transparent 42%
      ),
      radial-gradient(
          ellipse at 76% 52%,
          rgba(37, 178, 255, 0.1),
          transparent 34%
      );

  mix-blend-mode: screen;
}


/* ==================================================
   SCENE TRACK
================================================== */

.scene-track {
  position: absolute;

  inset: 0;

  z-index: 3;

  pointer-events: none;

  transform:
      translateX(0);

  transition:
      transform
      1250ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );

  will-change: transform;
}


.discussion-scene.shifted
.scene-track {
  transform:
      translateX(
          var(--scene-pan-x)
      );
}


/* ==================================================
   SCENE LAYER
================================================== */

.scene-layer {
  position: absolute;

  inset: 0;

  pointer-events: none;
}


/* ==================================================
   PANEL SCENE
================================================== */

.panel-scene {
  position: absolute;

  left: 56%;

  bottom:
      clamp(
          -3.3rem,
          -4.7vh,
          -1.5rem
      );

  width:
      min(
          97%,
          calc(91dvh * 1.7778),
          108rem
      );

  aspect-ratio: 16 / 9;

  transform:
      translateX(-50%);

  transform-origin:
      bottom center;
}


/* ==================================================
   BASE PANEL
================================================== */

.panel {
  border:
      1px solid
      rgba(126, 85, 255, 0.65);

  background:
      rgba(6, 7, 20, 0.84);

  box-shadow:
      0 0 1.25rem
      rgba(92, 47, 255, 0.18);

  backdrop-filter:
      blur(8px);

  color:
      rgba(237, 235, 255, 0.8);

  border-radius:
      0.4rem;
}


.placement-label {
  font-size:
      clamp(
          0.65rem,
          0.7vw,
          0.85rem
      );

  letter-spacing:
      0.05em;

  text-transform:
      uppercase;

  opacity: 0.7;
}


/* ==================================================
   MEMBER RESPONSE ROW
================================================== */

.member-response-row {
  position: absolute;

  left: 50%;
  top: 1.5%;

  z-index: 5;

  width: 80%;
  height: 28%;

  display: grid;

  grid-template-columns:
      repeat(
          5,
          minmax(0, 1fr)
      );

  gap:
      clamp(
          0.2rem,
          0.8vw,
          1rem
      );

  transform:
      translateX(-50%)
      translateY(-0.8rem);

  opacity: 0;

  visibility: hidden;

  pointer-events: none;

  transition:
      opacity
      500ms
      ease,
      transform
      650ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      visibility
      0s
      linear
      500ms;
}


.member-response-row.visible {
  opacity: 1;

  visibility: visible;

  transform:
      translateX(-50%)
      translateY(0);

  pointer-events: auto;

  transition:
      opacity
      500ms
      ease,
      transform
      650ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      visibility
      0s;
}


/* ==================================================
   INDIVIDUAL MEMBER RESPONSE
================================================== */

.member-response-panel {
  position: relative;

  width: 100%;
  height: 100%;

  display: flex;

  align-items: flex-start;
  justify-content: center;

  padding:
      clamp(
          0.5rem,
          0.8vw,
          1rem
      );

  text-align: center;
}


.member-response-panel::after {
  content: '';

  position: absolute;

  left: 50%;
  bottom: -0.65rem;

  width: 1rem;
  height: 1rem;

  background:
      rgba(6, 7, 20, 0.94);

  border-right:
      1px solid
      rgba(126, 85, 255, 0.65);

  border-bottom:
      1px solid
      rgba(126, 85, 255, 0.65);

  transform:
      translateX(-50%)
      rotate(45deg);
}


/* ==================================================
   MEMBERS
================================================== */

.panel-members {
  position: absolute;

  left: 50%;
  bottom: 17%;

  z-index: 1;

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
          0.2rem,
          0.8vw,
          1rem
      );

  transform:
      translateX(-50%);
}


.panel-member {
  width: 100%;
  height: 100%;

  min-width: 0;

  display: flex;

  align-items: flex-end;
  justify-content: center;
}


.panel-member img {
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
      );
}


/* ==================================================
   TABLE
================================================== */

.group-table {
  position: absolute;

  left: 50%;
  bottom: -10%;

  z-index: 2;

  display: block;

  width: 100%;
  height: auto;

  max-width: none;

  transform:
      translateX(-50%);

  object-fit: contain;

  filter:
      drop-shadow(
          0
          1.4rem
          2.4rem
          rgba(0, 0, 0, 0.95)
      );
}


/* ==================================================
   FIXED UI LAYER
================================================== */

.discussion-ui {
  position: absolute;

  inset: 0;

  z-index: 10;

  pointer-events: none;
}


/* ==================================================
   SIDEBAR
================================================== */

.discussion-side {
  position: absolute;

  top: 1.5%;
  right: 1%;

  width: 20%;
  height: 97%;

  display: grid;

  grid-template-rows:
      minmax(0, 1.08fr)
      minmax(0, 0.92fr);

  gap:
      clamp(
          0.5rem,
          1vh,
          0.9rem
      );

  opacity: 0;

  visibility: hidden;

  transform:
      translateX(1.2rem);

  pointer-events: none;

  transition:
      opacity
      500ms
      ease,
      transform
      650ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      visibility
      0s
      linear
      500ms;
}


.discussion-side.visible {
  opacity: 1;

  visibility: visible;

  transform:
      translateX(0);

  pointer-events: auto;

  transition:
      opacity
      500ms
      ease,
      transform
      650ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      visibility
      0s;
}


.focused-discussion,
.mediator-summary {
  position: relative;

  width: 100%;
  height: 100%;

  display: flex;

  align-items: center;
  justify-content: center;
}


/* ==================================================
   USER RESPONSE
================================================== */

.user-response-panel {
  position: absolute;

  left: 1.5%;
  bottom: 1.5%;

  width: 76%;
  height: 27%;

  display: flex;

  align-items: center;
  justify-content: center;

  opacity: 0;

  visibility: hidden;

  transform:
      translateY(1rem);

  pointer-events: none;

  transition:
      opacity
      500ms
      ease,
      transform
      650ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      visibility
      0s
      linear
      500ms;
}


.user-response-panel.visible {
  opacity: 1;

  visibility: visible;

  transform:
      translateY(0);

  pointer-events: auto;

  transition:
      opacity
      500ms
      ease,
      transform
      650ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      visibility
      0s;
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 1100px) {
  .discussion-scene {
    --bg-pan-x: -5%;
    --scene-pan-x: -12%;
  }


  .panel-scene {
    width:
        min(
            108%,
            calc(90dvh * 1.7778)
        );
  }


  .discussion-side {
    width: 22%;
  }


  .user-response-panel {
    width: 74%;
  }
}


@media (max-width: 760px) {
  .discussion-scene {
    --bg-pan-x: -3.5%;
    --scene-pan-x: -10%;
  }


  .panel-scene {
    bottom: 4vh;

    width:
        min(
            142%,
            calc(76dvh * 1.7778)
        );
  }


  /*
    Keep these geometrically identical
    so each response box stays tied
    directly to its character.
  */

  .member-response-row,
  .panel-members {
    width: 68%;

    gap: 0;
  }


  .member-response-row {
    top: 5%;
    height: 24%;
  }


  .panel-members {
    height: 80%;
  }


  .discussion-side {
    right: 0.5%;

    width: 24%;
  }


  .user-response-panel {
    left: 1%;

    width: 73%;
    height: 25%;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (
prefers-reduced-motion:
    reduce
) {
  .background-track,
  .scene-track {
    transition-duration: 120ms;
  }


  .discussion-side,
  .member-response-row,
  .user-response-panel {
    transition-duration: 120ms;
  }
}
</style>
