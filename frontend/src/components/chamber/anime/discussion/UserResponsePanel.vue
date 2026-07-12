<script setup>
import {
  computed,
  nextTick,
  ref,
  watch
} from 'vue'

import {
  ArrowRight,
  ChevronRight,
  CirclePause,
  CirclePlay,
  CornerDownRight,
  Lightbulb,
  MessageSquareText,
  Send,
  ShieldAlert,
  Sparkles,
  Square,
  Trash2,
  X
} from 'lucide-vue-next'


/* ==================================================
   PROPS
================================================== */

const props = defineProps({

  /*
    Current backend session status.

    Expected values:

        ready
        active
        paused
        completed
        abandoned
  */

  status: {
    type: String,
    default: 'ready'
  },


  /*
    True whenever the discussion store is performing
    a backend mutation.

    Examples:

        sending user response
        advancing round
        pausing
        resuming
        ending
  */

  busy: {
    type: Boolean,
    default: false
  },


  /*
    Global interaction lock from DiscussionScene.

    DiscussionScene already decides whether the user
    is allowed to interact based on:

        discussion ready
        active session
        initial round complete
        store busy state
  */

  disabled: {
    type: Boolean,
    default: false
  },


  /*
    Current discussion round.
  */

  roundNumber: {
    type: Number,
    default: 1
  },


  /*
    Currently selected visual response context.

    This is the participant selected through one of
    the MemberResponseCards.

    It does NOT convert normal council replies into a
    direct one-on-one character conversation.
  */

  selectedParticipant: {
    type: Object,
    default: null
  },


  /*
    Structured discussion state for the selected
    participant.
  */

  selectedCharacterState: {
    type: Object,
    default: null
  },


  /*
    Current reaction recorded against the selected
    council member:

        agree
        disagree
        null
  */

  reaction: {
    type: String,
    default: null
  },


  /*
    Structured prompts assembled by DiscussionScene
    from:

        mediator questions
        unresolved points
        selected-member risks

    Shape:

    [
        {
            type:
                "question"
                "unresolved_point"
                "risk",

            value:
                String | Object
        }
    ]
  */

  responseAngles: {
    type: Array,
    default: () => []
  },


  /*
    Every member visible in the current panel. This is
    required to enforce a reaction against each member.
  */

  panelMembers: {
    type: Array,
    default: () => []
  },


  /*
    Current-round reaction map keyed by character ID.
  */

  reactions: {
    type: Object,
    default: () => ({})
  },


  /*
    Successful replies owned by DiscussionScene.

    Each entry contains:
      id, characterId, characterName, mode, content
  */

  replies: {
    type: Array,
    default: () => []
  },


  minimumReplies: {
    type: Number,
    default: 2
  }
})


/* ==================================================
   EMITS
================================================== */

const emit = defineEmits([
  'submit',
  'next-round',
  'pause',
  'resume',
  'end-session',
  'select-character',
  'delete-response'
])


/* ==================================================
   RESPONSE MODE

   reply:
       Normal contribution to the whole council.

   opposing:
       Explicit challenge / alternative position.
================================================== */

const responseMode = computed(() =>
    props.reaction === 'disagree'
        ? 'opposing'
        : 'reply'
)


/* ==================================================
   LOCAL INPUT

   This is presentation state only.

   Submitted discussion state lives in the backend
   and CurrentDiscussionStore.
================================================== */

const responseText =
    ref('')


const textareaRef =
    ref(null)


/* ==================================================
   LOCAL UI
================================================== */

const showAngles =
    ref(false)


const showSessionMenu =
    ref(false)


/* ==================================================
   STATUS
================================================== */

const sessionIsActive = computed(() =>
    props.status ===
    'active'
)


const sessionIsPaused = computed(() =>
    props.status ===
    'paused'
)


const sessionIsComplete = computed(() =>
    props.status ===
    'completed'
    ||
    props.status ===
    'abandoned'
)


/* ==================================================
   PARTICIPANT DISPLAY
================================================== */

const participantName = computed(() =>
    props.selectedParticipant
        ?.name ??
    'The Council'
)


const participantRole = computed(() =>
    props.selectedParticipant
        ?.role ??
    'Council'
)


/* ==================================================
   SELECTED POSITION
================================================== */

const selectedPosition = computed(() =>
    props.selectedCharacterState
        ?.position ??
    {}
)


const selectedStance = computed(() =>
    selectedPosition.value
        ?.stance ??
    ''
)


const selectedStatement = computed(() =>
    selectedPosition.value
        ?.statement ??
    ''
)


/* ==================================================
   RESPONSE MODE CONTENT
================================================== */

const modeTitle = computed(() => {

  if (
      responseMode.value ===
      'opposing'
  ) {
    return 'Present an opposing view'
  }


  return 'Respond to the council'
})


const modeDescription = computed(() => {

  if (
      responseMode.value ===
      'opposing'
  ) {
    return (
        'Challenge the current direction with a clear ' +
        'alternative position.'
    )
  }


  return (
      'Add context, clarify your position, or respond ' +
      'to the arguments raised this round.'
  )
})


const inputPlaceholder = computed(() => {

  if (
      sessionIsPaused.value
  ) {
    return 'Resume the discussion to respond.'
  }


  if (
      sessionIsComplete.value
  ) {
    return 'This discussion has ended.'
  }


  if (!props.reaction) {
    return 'Agree or disagree with this point before responding.'
  }


  if (
      responseMode.value ===
      'opposing'
  ) {
    return (
        'Explain where you think the council is wrong ' +
        'and present an alternative...'
    )
  }


  if (
      props.selectedParticipant
  ) {
    return (
        `Respond to the council with ` +
        `${participantName.value}'s position in mind...`
    )
  }


  return 'Share your response with the council...'
})


/* ==================================================
   RESPONSE AVAILABILITY
================================================== */

const hasResponseText = computed(() =>
    Boolean(
        responseText.value
            .trim()
    )
)


const canSubmit = computed(() =>
    sessionIsActive.value
    &&
    !props.disabled
    &&
    !props.busy
    &&
    Boolean(props.selectedParticipant?.id)
    &&
    (
        props.reaction === 'agree'
        ||
        props.reaction === 'disagree'
    )
    &&
    hasResponseText.value
)


const reactionForMember = member =>
    props.reactions?.[member?.id]
    ??
    props.reactions?.[String(member?.id)]
    ??
    null


const membersWithoutReaction = computed(() =>
    props.panelMembers.filter(member => {
      const value = reactionForMember(member)

      return value !== 'agree' && value !== 'disagree'
    })
)


const allMembersReacted = computed(() =>
    props.panelMembers.length > 0
    &&
    membersWithoutReaction.value.length === 0
)


/*
  Two messages to one person still count as responding
  to one council member. The gate intentionally counts
  distinct members/points addressed this round.
*/

const repliedCharacterIds = computed(() =>
    new Set(
        props.replies
            .map(reply => String(reply?.characterId ?? ''))
            .filter(Boolean)
    )
)


const replyTargetCount = computed(() =>
    repliedCharacterIds.value.size
)


const hasMinimumReplies = computed(() =>
    replyTargetCount.value >= props.minimumReplies
)


const nextRoundBlocker = computed(() => {
  if (!allMembersReacted.value) {
    const count = membersWithoutReaction.value.length

    return count === 1
        ? 'Agree or disagree with the remaining council point first.'
        : `Agree or disagree with all council points first. ${count} still need your stance.`
  }


  if (!hasMinimumReplies.value) {
    const remaining = props.minimumReplies - replyTargetCount.value

    return remaining === 1
        ? 'Respond to one more council member before continuing.'
        : `Respond to at least ${props.minimumReplies} council members before continuing.`
  }


  if (props.disabled) {
    return 'Wait for every council response to finish generating.'
  }


  if (props.busy) {
    return 'Please wait for the current action to finish.'
  }


  return ''
})


const canAdvanceRound = computed(() =>
    sessionIsActive.value
    &&
    !props.disabled
    &&
    !props.busy
    &&
    allMembersReacted.value
    &&
    hasMinimumReplies.value
)


/* ==================================================
   REACTION DISPLAY
================================================== */

const reactionLabel = computed(() => {

  if (
      props.reaction ===
      'agree'
  ) {
    return 'You agree'
  }


  if (
      props.reaction ===
      'disagree'
  ) {
    return 'You disagree'
  }


  return 'No stance selected'
})


/* ==================================================
   RESPONSE ANGLE NORMALIZATION
================================================== */

const angleText =
    angle => {

      const value =
          angle?.value


      if (
          typeof value ===
          'string'
      ) {
        return value
      }


      return (
          value?.question ??
          value?.statement ??
          value?.title ??
          value?.text ??
          value?.description ??
          value?.content ??
          ''
      )
    }


const angleLabel =
    angle => {

      switch (
          angle?.type
          ) {

        case 'question':
          return 'Mediator Question'


        case 'unresolved_point':
          return 'Unresolved Point'


        case 'risk':
          return 'Council Risk'


        default:
          return 'Discussion Angle'
      }
    }


/* ==================================================
   MODE SWITCH
================================================== */

const setResponseMode =
    () => {
      nextTick(
          () => {

            textareaRef.value
                ?.focus()
          }
      )
    }


/*
  A draft belongs to the selected point. Moving to a
  different member resets it and automatically derives
  the new immutable mode from that member's reaction.
*/

watch(
    () => props.selectedParticipant?.id,
    () => {
      responseText.value = ''
      showAngles.value = false
    }
)


/* ==================================================
   USE RESPONSE ANGLE

   Clicking an angle places it into the response area
   as a writing prompt.

   It does NOT automatically submit anything.
================================================== */

const useResponseAngle =
    angle => {

      const text =
          angleText(
              angle
          )


      if (!text) {
        return
      }


      if (
          responseText.value
              .trim()
      ) {

        responseText.value =
            `${responseText.value.trim()}\n\n${text}`

      } else {

        responseText.value =
            text
      }


      showAngles.value =
          false


      nextTick(
          () => {

            textareaRef.value
                ?.focus()
          }
      )
    }


/* ==================================================
   SUBMIT RESPONSE

   Emits exactly the payload expected by:

       DiscussionScene
           .handleUserResponseSubmit()

   Shape:

   {
       mode:
           "reply"
           "opposing",

       content:
           String
   }
================================================== */

const submitResponse =
    () => {

      if (
          !canSubmit.value
      ) {
        return
      }


      const content =
          responseText.value
              .trim()


      emit(
          'submit',

          {
            clientId:
                `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

            mode:
            responseMode.value,

            content,

            characterId:
            props.selectedParticipant?.id,

            characterName:
            participantName.value,

            reaction:
            props.reaction
          }
      )


      /*
        Clear local editor immediately after dispatch.

        The discussion state itself remains fully
        backend/store authoritative.
      */

      responseText.value =
          ''


      showAngles.value =
          false
    }


/* ==================================================
   KEYBOARD SUBMISSION

   Ctrl + Enter
   Cmd + Enter

   submits.

   Plain Enter continues to create new lines.
================================================== */

const handleTextareaKeydown =
    event => {

      if (
          event.key !==
          'Enter'
      ) {
        return
      }


      if (
          !event.ctrlKey
          &&
          !event.metaKey
      ) {
        return
      }


      event.preventDefault()


      submitResponse()
    }


/* ==================================================
   NEXT ROUND
================================================== */

const handleNextRound =
    () => {

      if (
          !canAdvanceRound.value
      ) {
        return
      }


      emit(
          'next-round'
      )
    }


const deleteResponse = reply => {
  if (props.busy || !reply?.id) {
    return
  }


  emit('delete-response', reply)
}


/* ==================================================
   SESSION CONTROLS
================================================== */

const handlePause =
    () => {

      if (
          !sessionIsActive.value
          ||
          props.busy
      ) {
        return
      }


      showSessionMenu.value =
          false


      emit(
          'pause'
      )
    }


const handleResume =
    () => {

      if (
          !sessionIsPaused.value
          ||
          props.busy
      ) {
        return
      }


      emit(
          'resume'
      )
    }


const handleEndSession =
    () => {

      if (
          sessionIsComplete.value
          ||
          props.busy
      ) {
        return
      }


      showSessionMenu.value =
          false


      emit(
          'end-session'
      )
    }
</script>


<template>
  <section
      class="user-response-controller"
      :class="{
        busy,

        paused:
            sessionIsPaused,

        complete:
            sessionIsComplete,

        opposingMode:
            responseMode === 'opposing'
      }"
  >

    <!-- ==================================================
         DECORATIVE FRAME
    ================================================== -->

    <span class="frame-line line-top"></span>

    <span class="frame-line line-bottom"></span>


    <!-- ==================================================
         LEFT CONTEXT AREA
    ================================================== -->

    <aside class="response-context">

      <!-- ================================================
           SECTION HEADER
      ================================================= -->

      <div class="context-header">

        <span class="section-kicker">
          RESPONSE CONTEXT
        </span>


        <span class="round-chip">
          ROUND
          {{ roundNumber }}
        </span>

      </div>


      <!-- ================================================
           SELECTED CHARACTER
      ================================================= -->

      <div class="selected-member">

        <div class="member-marker">

          <CornerDownRight :size="15" />

        </div>


        <div class="member-copy">

          <span class="member-role">
            {{ participantRole }}
          </span>


          <strong class="member-name">
            {{ participantName }}
          </strong>

        </div>

      </div>


      <!-- ================================================
           SELECTED STANCE
      ================================================= -->

      <div
          v-if="
            selectedStance ||
            selectedStatement
          "
          class="position-context"
      >

        <span
            v-if="selectedStance"
            class="stance-chip"
        >
          {{ selectedStance }}
        </span>


        <p
            v-if="selectedStatement"
            class="position-copy"
        >
          {{ selectedStatement }}
        </p>

      </div>


      <!-- ================================================
           USER REACTION
      ================================================= -->

      <div
          class="reaction-context"
          :class="{
            agree:
                reaction === 'agree',

            disagree:
                reaction === 'disagree'
          }"
      >

        <span class="reaction-dot"></span>

        <span>
          {{ reactionLabel }}
        </span>

      </div>


      <!-- ================================================
           CURRENT-ROUND REPLIES

           This area scrolls internally so replies never
           increase the height of the whole controller.
      ================================================= -->

      <div class="reply-history">

        <div class="reply-history-header">

          <span>
            YOUR REPLIES
          </span>

          <strong>
            {{ replyTargetCount }}
            /
            {{ minimumReplies }}
          </strong>

        </div>


        <div class="reply-history-scroll">

          <p
              v-if="!replies.length"
              class="empty-replies"
          >
            Your responses to council points will appear here.
          </p>


          <article
              v-for="reply in replies"
              :key="reply.id"
              class="reply-record"
              :class="{
                conflicting:
                    reply.mode === 'opposing'
              }"
          >

            <div class="reply-record-top">

              <span>
                TO {{ reply.characterName }}
              </span>


              <button
                  type="button"
                  title="Delete this reply"
                  :disabled="busy"
                  @click="deleteResponse(reply)"
              >
                <Trash2 :size="12" />
              </button>

            </div>


            <small>
              {{ reply.mode === 'opposing'
                ? 'CONFLICTING VIEW'
                : 'AGREEMENT RESPONSE'
              }}
            </small>


            <p>
              {{ reply.content }}
            </p>

          </article>

        </div>

      </div>

    </aside>


    <!-- ==================================================
         MAIN RESPONSE AREA
    ================================================== -->

    <div class="response-main">

      <!-- ================================================
           MODE SWITCHER
      ================================================= -->

      <header class="response-toolbar">

        <div class="mode-tabs">

          <button
              class="mode-tab"
              :class="{
                active:
                    reaction === 'agree'
              }"
              type="button"
              disabled
          >

            <MessageSquareText :size="13" />

            <span>
              Council Reply
            </span>

          </button>


          <button
              class="mode-tab opposing-tab"
              :class="{
                active:
                    reaction === 'disagree'
              }"
              type="button"
              disabled
          >

            <ShieldAlert :size="13" />

            <span>
              Opposing View
            </span>

          </button>


          <span class="mode-lock-copy">
            LOCKED BY YOUR STANCE
          </span>

        </div>


        <div class="toolbar-actions">

          <button
              class="angle-button"
              type="button"
              :disabled="
                !responseAngles.length
                ||
                disabled
              "
              @click="
                showAngles =
                  !showAngles
              "
          >

            <Lightbulb :size="13" />

            <span>
              Suggest Angles
            </span>

          </button>


          <button
              class="session-menu-button"
              type="button"
              :disabled="
                sessionIsComplete
              "
              @click="
                showSessionMenu =
                  !showSessionMenu
              "
          >
            •••
          </button>

        </div>

      </header>


      <!-- ================================================
           RESPONSE TITLE
      ================================================= -->

      <div class="response-heading">

        <div>

          <span class="response-kicker">
            YOUR RESPONSE
          </span>


          <h3>
            {{ modeTitle }}
          </h3>

        </div>


        <p>
          {{ modeDescription }}
        </p>

      </div>


      <!-- ================================================
           TEXT INPUT
      ================================================= -->

      <div class="response-editor">

        <textarea
            ref="textareaRef"
            v-model="responseText"

            :placeholder="
              inputPlaceholder
            "

            :disabled="
              disabled
              ||
              !reaction
              ||
              sessionIsPaused
              ||
              sessionIsComplete
            "

            maxlength="4000"

            @keydown="
              handleTextareaKeydown
            "
        ></textarea>


        <div class="editor-footer">

          <span class="character-count">
            {{ responseText.length }}
            /
            4000
          </span>


          <span class="shortcut-copy">
            CTRL + ENTER TO SEND
          </span>


          <button
              class="send-button"
              type="button"
              :disabled="
                !canSubmit
              "
              @click="
                submitResponse
              "
          >

            <span>
              Send Response
            </span>

            <Send :size="14" />

          </button>

        </div>

      </div>


      <!-- ================================================
           RESPONSE ANGLES
      ================================================= -->

      <Transition name="angles">

        <div
            v-if="
              showAngles
              &&
              responseAngles.length
            "
            class="angles-panel"
        >

          <div class="angles-header">

            <div>

              <Sparkles :size="13" />

              <span>
                RESPONSE ANGLES
              </span>

            </div>


            <button
                type="button"
                @click="
                  showAngles = false
                "
            >
              <X :size="14" />
            </button>

          </div>


          <div class="angle-list">

            <button
                v-for="(angle, index) in responseAngles"
                :key="
                  `${angle.type}-${index}`
                "
                class="angle-item"
                type="button"
                @click="
                  useResponseAngle(
                    angle
                  )
                "
            >

              <div class="angle-copy">

                <span>
                  {{ angleLabel(angle) }}
                </span>


                <p>
                  {{ angleText(angle) }}
                </p>

              </div>


              <ChevronRight :size="14" />

            </button>

          </div>

        </div>

      </Transition>


      <!-- ================================================
           SESSION MENU
      ================================================= -->

      <Transition name="menu">

        <div
            v-if="showSessionMenu"
            class="session-menu"
        >

          <button
              v-if="sessionIsActive"
              type="button"
              @click="
                handlePause
              "
          >

            <CirclePause :size="14" />

            <span>
              Pause Session
            </span>

          </button>


          <button
              class="end-session-control"
              type="button"
              @click="
                handleEndSession
              "
          >

            <Square :size="13" />

            <span>
              End Session
            </span>

          </button>

        </div>

      </Transition>

    </div>


    <!-- ==================================================
         RIGHT ROUND CONTROLS
    ================================================== -->

    <aside class="round-controls">

      <!-- ================================================
           ACTIVE SESSION
      ================================================= -->

      <template
          v-if="sessionIsActive"
      >

        <div class="round-status">

          <span>
            CURRENT ROUND
          </span>


          <strong>
            {{ roundNumber
              .toString()
              .padStart(
                  2,
                  '0'
              )
            }}
          </strong>

        </div>


        <div
            class="next-round-wrap"
            :class="{
              blocked:
                  !canAdvanceRound
            }"
        >

          <button
              class="next-round-button"
              type="button"
              :disabled="
                !canAdvanceRound
              "
              @click="
                handleNextRound
              "
          >

            <div>

              <span>
                CONTINUE
              </span>

              <strong>
                Next Round
              </strong>

            </div>


            <ArrowRight :size="18" />

          </button>


          <div
              v-if="
                !canAdvanceRound
                &&
                nextRoundBlocker
              "
              class="next-round-tooltip"
              role="tooltip"
          >
            {{ nextRoundBlocker }}
          </div>

        </div>

      </template>


      <!-- ================================================
           PAUSED SESSION
      ================================================= -->

      <template
          v-else-if="sessionIsPaused"
      >

        <div class="paused-status">

          <CirclePause :size="20" />


          <span>
            SESSION PAUSED
          </span>

        </div>


        <button
            class="resume-button"
            type="button"
            :disabled="busy"
            @click="
              handleResume
            "
        >

          <CirclePlay :size="17" />

          <span>
            Resume
          </span>

        </button>

      </template>


      <!-- ================================================
           COMPLETE SESSION
      ================================================= -->

      <template
          v-else-if="sessionIsComplete"
      >

        <div class="complete-status">

          <Sparkles :size="20" />


          <span>
            DISCUSSION COMPLETE
          </span>

        </div>

      </template>


      <!-- ================================================
           WAITING
      ================================================= -->

      <template
          v-else
      >

        <div class="waiting-status">

          <span class="waiting-pulse"></span>

          <span>
            PREPARING DISCUSSION
          </span>

        </div>

      </template>

    </aside>


    <!-- ==================================================
         BUSY OVERLAY
    ================================================== -->

    <Transition name="busy">

      <div
          v-if="busy"
          class="busy-overlay"
      >

        <div class="busy-indicator">

          <span></span>

          <span></span>

          <span></span>

        </div>

      </div>

    </Transition>

  </section>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.user-response-controller {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-columns:
      minmax(12rem, 0.85fr)
      minmax(0, 2.6fr)
      minmax(9rem, 0.65fr);

  overflow: hidden;

  border:
      1px solid
      rgba(126, 87, 255, 0.72);

  border-radius:
      0.42rem;

  background:
      linear-gradient(
          145deg,
          rgba(9, 8, 28, 0.97),
          rgba(4, 7, 20, 0.98)
      );

  box-shadow:
      inset
      0 0
      0
      1px
      rgba(78, 169, 255, 0.04),

      0 0
      1.4rem
      rgba(91, 49, 255, 0.2),

      0 0
      3.2rem
      rgba(29, 113, 255, 0.07);

  backdrop-filter:
      blur(16px);

  color:
      rgba(240, 237, 255, 0.94);
}


/* ==================================================
   BACKGROUND EFFECT
================================================== */

.user-response-controller::before {
  content: '';

  position: absolute;

  inset: 0;

  pointer-events: none;

  background:
      radial-gradient(
          ellipse at 42% 0%,
          rgba(107, 72, 255, 0.12),
          transparent 48%
      ),
      linear-gradient(
          110deg,
          transparent 25%,
          rgba(55, 137, 255, 0.025) 52%,
          transparent 75%
      );
}


/* ==================================================
   FRAME LINES
================================================== */

.frame-line {
  position: absolute;

  z-index: 20;

  height: 1px;

  pointer-events: none;
}


.line-top {
  top: 0;
  left: 4%;

  width: 21%;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(89, 193, 255, 0.9)
      );
}


.line-bottom {
  right: 4%;
  bottom: 0;

  width: 22%;

  background:
      linear-gradient(
          90deg,
          rgba(182, 88, 255, 0.9),
          transparent
      );
}


/* ==================================================
   LEFT RESPONSE CONTEXT
================================================== */

.response-context {
  position: relative;

  z-index: 2;

  min-width: 0;
  min-height: 0;

  display: flex;

  flex-direction: column;

  padding:
      clamp(
          0.55rem,
          0.8vw,
          0.95rem
      );

  border-right:
      1px solid
      rgba(126, 94, 255, 0.16);

  background:
      linear-gradient(
          135deg,
          rgba(39, 31, 91, 0.16),
          transparent
      );
}


/* ==================================================
   CONTEXT HEADER
================================================== */

.context-header {
  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 0.4rem;

  padding-bottom: 0.42rem;

  border-bottom:
      1px solid
      rgba(136, 107, 255, 0.13);
}


.section-kicker {
  font-size:
      clamp(
          0.42rem,
          0.42vw,
          0.54rem
      );

  letter-spacing:
      0.1em;

  color:
      rgba(143, 140, 213, 0.68);
}


.round-chip {
  padding:
      0.18rem
      0.32rem;

  border:
      1px solid
      rgba(107, 169, 255, 0.2);

  font-size:
      clamp(
          0.38rem,
          0.37vw,
          0.48rem
      );

  letter-spacing:
      0.08em;

  color:
      rgba(130, 187, 255, 0.75);
}


/* ==================================================
   SELECTED MEMBER
================================================== */

.selected-member {
  display: flex;

  align-items: center;

  gap: 0.55rem;

  margin-top: 0.55rem;
}


.member-marker {
  width: 1.7rem;
  height: 1.7rem;

  flex: 0 0 auto;

  display: grid;

  place-items: center;

  border:
      1px solid
      rgba(122, 110, 255, 0.45);

  background:
      rgba(46, 44, 113, 0.2);

  color:
      rgba(126, 184, 255, 0.84);
}


.member-copy {
  min-width: 0;

  display: flex;

  flex-direction: column;
}


.member-role {
  overflow: hidden;

  font-size:
      clamp(
          0.4rem,
          0.4vw,
          0.52rem
      );

  letter-spacing:
      0.09em;

  text-transform:
      uppercase;

  white-space: nowrap;

  text-overflow: ellipsis;

  color:
      rgba(151, 139, 255, 0.75);
}


.member-name {
  margin-top: 0.12rem;

  overflow: hidden;

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.65rem,
          0.7vw,
          0.9rem
      );

  font-weight: 500;

  white-space: nowrap;

  text-overflow: ellipsis;
}


/* ==================================================
   POSITION CONTEXT
================================================== */

.position-context {
  flex: 0 1 auto;

  min-height: 0;
  max-height: 28%;

  margin-top: 0.55rem;

  overflow-y: auto;
}


.stance-chip {
  display: inline-block;

  padding:
      0.16rem
      0.3rem;

  border:
      1px solid
      rgba(95, 176, 255, 0.2);

  background:
      rgba(45, 96, 158, 0.11);

  font-size:
      clamp(
          0.39rem,
          0.39vw,
          0.5rem
      );

  letter-spacing:
      0.07em;

  text-transform: uppercase;

  color:
      rgba(139, 195, 255, 0.78);
}


.position-copy {
  margin:
      0.4rem
      0
      0;

  display: -webkit-box;

  overflow: hidden;

  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;

  font-size:
      clamp(
          0.48rem,
          0.49vw,
          0.64rem
      );

  line-height: 1.45;

  color:
      rgba(186, 183, 214, 0.72);
}


/* ==================================================
   REACTION CONTEXT
================================================== */

.reaction-context {
  display: flex;

  align-items: center;

  gap: 0.32rem;

  margin-top: 0.45rem;

  padding-top: 0.4rem;

  border-top:
      1px solid
      rgba(130, 102, 255, 0.11);

  font-size:
      clamp(
          0.41rem,
          0.4vw,
          0.52rem
      );

  letter-spacing:
      0.06em;

  text-transform:
      uppercase;

  color:
      rgba(151, 147, 187, 0.63);
}


.reaction-dot {
  width: 0.3rem;
  height: 0.3rem;

  border-radius: 50%;

  background:
      rgba(128, 124, 171, 0.6);
}


.reaction-context.agree {
  color:
      rgba(122, 198, 255, 0.84);
}


.reaction-context.agree
.reaction-dot {
  background:
      rgba(91, 190, 255, 0.95);

  box-shadow:
      0 0
      0.4rem
      rgba(91, 190, 255, 0.6);
}


.reaction-context.disagree {
  color:
      rgba(215, 145, 255, 0.86);
}


.reaction-context.disagree
.reaction-dot {
  background:
      rgba(201, 105, 255, 0.95);

  box-shadow:
      0 0
      0.4rem
      rgba(201, 105, 255, 0.6);
}


/* ==================================================
   REPLY HISTORY
================================================== */

.reply-history {
  min-height: 0;
  flex: 1 1 auto;

  display: flex;
  flex-direction: column;

  margin-top: 0.5rem;
  padding-top: 0.45rem;

  border-top:
      1px solid
      rgba(130, 102, 255, 0.12);
}


.reply-history-header {
  flex: 0 0 auto;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 0.4rem;

  font-size:
      clamp(
          0.38rem,
          0.38vw,
          0.5rem
      );

  letter-spacing: 0.09em;

  color:
      rgba(143, 140, 213, 0.72);
}


.reply-history-header strong {
  color:
      rgba(119, 190, 255, 0.88);
}


.reply-history-scroll {
  min-height: 0;
  flex: 1 1 auto;

  margin-top: 0.38rem;
  padding-right: 0.22rem;

  overflow-y: auto;
  overscroll-behavior: contain;

  scrollbar-width: thin;
  scrollbar-color:
      rgba(103, 91, 210, 0.5)
      transparent;
}


.reply-history-scroll::-webkit-scrollbar {
  width: 0.22rem;
}


.reply-history-scroll::-webkit-scrollbar-thumb {
  background:
      rgba(103, 91, 210, 0.5);
}


.empty-replies {
  margin: 0;

  font-size:
      clamp(
          0.43rem,
          0.43vw,
          0.56rem
      );

  line-height: 1.45;

  color:
      rgba(151, 147, 187, 0.48);
}


.reply-record {
  padding: 0.42rem;

  border-left:
      2px solid
      rgba(84, 177, 255, 0.7);

  background:
      rgba(43, 76, 134, 0.1);
}


.reply-record + .reply-record {
  margin-top: 0.36rem;
}


.reply-record.conflicting {
  border-left-color:
      rgba(205, 104, 255, 0.78);

  background:
      rgba(101, 42, 133, 0.1);
}


.reply-record-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 0.35rem;
}


.reply-record-top > span,
.reply-record small {
  font-size:
      clamp(
          0.34rem,
          0.34vw,
          0.45rem
      );

  letter-spacing: 0.08em;
}


.reply-record-top > span {
  overflow: hidden;

  white-space: nowrap;
  text-overflow: ellipsis;

  color:
      rgba(171, 204, 255, 0.82);
}


.reply-record-top button {
  width: 1.25rem;
  height: 1.25rem;

  flex: 0 0 auto;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(223, 109, 179, 0.18);

  background: transparent;

  color:
      rgba(222, 132, 186, 0.68);

  cursor: pointer;
}


.reply-record-top button:hover:not(:disabled) {
  border-color:
      rgba(244, 120, 194, 0.52);

  color:
      rgba(255, 166, 220, 0.96);
}


.reply-record small {
  display: block;

  margin-top: 0.14rem;

  color:
      rgba(144, 138, 190, 0.56);
}


.reply-record p {
  margin:
      0.25rem
      0
      0;

  display: -webkit-box;
  overflow: hidden;

  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;

  font-size:
      clamp(
          0.42rem,
          0.43vw,
          0.56rem
      );

  line-height: 1.42;

  color:
      rgba(207, 203, 229, 0.74);
}


/* ==================================================
   MAIN RESPONSE AREA
================================================== */

.response-main {
  position: relative;

  z-index: 3;

  min-width: 0;
  min-height: 0;

  display: flex;

  flex-direction: column;

  padding:
      clamp(
          0.55rem,
          0.7vw,
          0.85rem
      );
}


/* ==================================================
   TOOLBAR
================================================== */

.response-toolbar {
  flex: 0 0 auto;

  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 0.5rem;
}


.mode-tabs {
  display: flex;

  align-items: center;

  gap: 0.25rem;
}


.mode-tab {
  height: 1.7rem;

  display: flex;

  align-items: center;

  gap: 0.3rem;

  padding:
      0
      0.48rem;

  border:
      1px solid
      transparent;

  background:
      transparent;

  font-size:
      clamp(
          0.42rem,
          0.42vw,
          0.55rem
      );

  letter-spacing:
      0.04em;

  color:
      rgba(156, 153, 194, 0.65);

  cursor: pointer;

  transition:
      color
      160ms
      ease,
      border-color
      160ms
      ease,
      background
      160ms
      ease;
}


.mode-tab.active {
  border-color:
      rgba(98, 170, 255, 0.31);

  background:
      rgba(42, 87, 153, 0.13);

  color:
      rgba(158, 210, 255, 0.94);
}


.opposing-tab.active {
  border-color:
      rgba(196, 99, 255, 0.34);

  background:
      rgba(125, 44, 181, 0.13);

  color:
      rgba(226, 175, 255, 0.94);
}


.mode-tab:disabled {
  cursor: default;
  opacity: 0.34;
}


.mode-tab.active:disabled {
  opacity: 1;
}


.mode-lock-copy {
  margin-left: 0.18rem;

  font-size:
      clamp(
          0.31rem,
          0.31vw,
          0.41rem
      );

  letter-spacing: 0.08em;

  color:
      rgba(126, 123, 164, 0.5);
}


/* ==================================================
   TOOLBAR ACTIONS
================================================== */

.toolbar-actions {
  display: flex;

  align-items: center;

  gap: 0.28rem;
}


.angle-button {
  height: 1.7rem;

  display: flex;

  align-items: center;

  gap: 0.3rem;

  padding:
      0
      0.45rem;

  border:
      1px solid
      rgba(134, 104, 255, 0.22);

  background:
      rgba(54, 42, 111, 0.11);

  font-size:
      clamp(
          0.4rem,
          0.4vw,
          0.52rem
      );

  color:
      rgba(188, 174, 235, 0.75);

  cursor: pointer;
}


.session-menu-button {
  width: 1.7rem;
  height: 1.7rem;

  padding: 0;

  border:
      1px solid
      rgba(133, 105, 255, 0.2);

  background:
      rgba(37, 30, 78, 0.15);

  color:
      rgba(175, 168, 210, 0.72);

  cursor: pointer;
}


/* ==================================================
   RESPONSE HEADING
================================================== */

.response-heading {
  flex: 0 0 auto;

  display: flex;

  align-items: flex-end;
  justify-content: space-between;

  gap: 1rem;

  margin-top:
      clamp(
          0.35rem,
          0.5vh,
          0.65rem
      );
}


.response-kicker {
  display: block;

  font-size:
      clamp(
          0.38rem,
          0.38vw,
          0.49rem
      );

  letter-spacing:
      0.11em;

  color:
      rgba(136, 130, 192, 0.62);
}


.response-heading h3 {
  margin:
      0.08rem
      0
      0;

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.72rem,
          0.83vw,
          1.08rem
      );

  font-weight: 500;

  color:
      rgba(239, 236, 255, 0.96);
}


.response-heading > p {
  max-width: 19rem;

  margin: 0;

  font-size:
      clamp(
          0.42rem,
          0.43vw,
          0.56rem
      );

  line-height: 1.4;

  text-align: right;

  color:
      rgba(160, 156, 192, 0.58);
}


/* ==================================================
   EDITOR
================================================== */

.response-editor {
  flex: 1;

  min-height: 0;

  display: flex;

  flex-direction: column;

  margin-top: 0.42rem;

  border:
      1px solid
      rgba(129, 101, 255, 0.24);

  background:
      rgba(4, 5, 18, 0.47);

  transition:
      border-color
      180ms
      ease,
      box-shadow
      180ms
      ease;
}


.response-editor:focus-within {
  border-color:
      rgba(118, 100, 255, 0.56);

  box-shadow:
      inset
      0 0
      1rem
      rgba(71, 56, 180, 0.07);
}


.opposingMode
.response-editor:focus-within {
  border-color:
      rgba(190, 89, 255, 0.54);
}


.response-editor textarea {
  flex: 1;

  min-height: 0;

  width: 100%;

  resize: none;

  padding:
      clamp(
          0.45rem,
          0.55vw,
          0.7rem
      );

  border: 0;

  outline: none;

  background: transparent;

  font-family: inherit;

  font-size:
      clamp(
          0.52rem,
          0.56vw,
          0.72rem
      );

  line-height: 1.5;

  color:
      rgba(229, 226, 246, 0.92);
}


.response-editor textarea::placeholder {
  color:
      rgba(144, 140, 177, 0.48);
}


/* ==================================================
   EDITOR FOOTER
================================================== */

.editor-footer {
  flex: 0 0 auto;

  min-height: 1.8rem;

  display: grid;

  grid-template-columns:
      auto
      1fr
      auto;

  align-items: center;

  gap: 0.5rem;

  padding:
      0.25rem;

  border-top:
      1px solid
      rgba(126, 99, 255, 0.12);
}


.character-count,
.shortcut-copy {
  font-size:
      clamp(
          0.34rem,
          0.35vw,
          0.45rem
      );

  letter-spacing:
      0.08em;

  color:
      rgba(124, 125, 163, 0.5);
}


.shortcut-copy {
  text-align: right;
}


.send-button {
  height: 1.55rem;

  display: flex;

  align-items: center;

  gap: 0.35rem;

  padding:
      0
      0.55rem;

  border:
      1px solid
      rgba(93, 173, 255, 0.55);

  background:
      linear-gradient(
          135deg,
          rgba(49, 111, 195, 0.32),
          rgba(71, 52, 180, 0.26)
      );

  font-size:
      clamp(
          0.42rem,
          0.43vw,
          0.56rem
      );

  color:
      rgba(191, 224, 255, 0.94);

  cursor: pointer;

  transition:
      opacity
      160ms
      ease,
      box-shadow
      160ms
      ease;
}


.send-button:hover:not(:disabled) {
  box-shadow:
      0 0
      0.8rem
      rgba(68, 154, 255, 0.2);
}


.send-button:disabled {
  opacity: 0.32;

  cursor: not-allowed;
}


/* ==================================================
   ANGLES PANEL
================================================== */

.angles-panel {
  position: absolute;

  right: 0.7rem;
  bottom: 0.7rem;

  z-index: 30;

  width:
      min(
          24rem,
          72%
      );

  max-height: 82%;

  overflow: hidden;

  border:
      1px solid
      rgba(132, 98, 255, 0.58);

  background:
      rgba(7, 7, 25, 0.98);

  box-shadow:
      0 0
      2rem
      rgba(72, 43, 190, 0.24);

  backdrop-filter:
      blur(18px);
}


.angles-header {
  min-height: 2.1rem;

  display: flex;

  align-items: center;
  justify-content: space-between;

  padding:
      0
      0.55rem;

  border-bottom:
      1px solid
      rgba(130, 101, 255, 0.16);
}


.angles-header > div {
  display: flex;

  align-items: center;

  gap: 0.35rem;

  font-size:
      clamp(
          0.4rem,
          0.4vw,
          0.52rem
      );

  letter-spacing:
      0.09em;

  color:
      rgba(170, 156, 255, 0.86);
}


.angles-header button {
  display: grid;

  place-items: center;

  padding: 0;

  border: 0;

  background: transparent;

  color:
      rgba(168, 161, 201, 0.7);

  cursor: pointer;
}


.angle-list {
  max-height: 14rem;

  overflow-y: auto;
}


.angle-item {
  width: 100%;

  display: grid;

  grid-template-columns:
      minmax(0, 1fr)
      auto;

  align-items: center;

  gap: 0.5rem;

  padding: 0.55rem;

  border: 0;

  border-bottom:
      1px solid
      rgba(130, 101, 255, 0.09);

  background: transparent;

  color: inherit;

  text-align: left;

  cursor: pointer;

  transition:
      background
      150ms
      ease;
}


.angle-item:hover {
  background:
      rgba(71, 54, 153, 0.16);
}


.angle-copy span {
  font-size:
      clamp(
          0.36rem,
          0.36vw,
          0.47rem
      );

  letter-spacing:
      0.08em;

  text-transform: uppercase;

  color:
      rgba(128, 178, 255, 0.76);
}


.angle-copy p {
  margin:
      0.15rem
      0
      0;

  font-size:
      clamp(
          0.47rem,
          0.48vw,
          0.62rem
      );

  line-height: 1.4;

  color:
      rgba(190, 187, 216, 0.77);
}


/* ==================================================
   SESSION MENU
================================================== */

.session-menu {
  position: absolute;

  top: 2.8rem;
  right: 0.7rem;

  z-index: 31;

  min-width: 10rem;

  padding: 0.3rem;

  border:
      1px solid
      rgba(132, 99, 255, 0.47);

  background:
      rgba(7, 7, 24, 0.98);

  box-shadow:
      0 0
      1.5rem
      rgba(55, 34, 145, 0.22);
}


.session-menu button {
  width: 100%;

  min-height: 2rem;

  display: flex;

  align-items: center;

  gap: 0.4rem;

  padding:
      0
      0.5rem;

  border: 0;

  background: transparent;

  font-size:
      clamp(
          0.45rem,
          0.46vw,
          0.59rem
      );

  color:
      rgba(194, 190, 219, 0.8);

  cursor: pointer;
}


.session-menu button:hover {
  background:
      rgba(65, 52, 140, 0.17);
}


.session-menu
.end-session-control {
  color:
      rgba(224, 151, 255, 0.84);
}


/* ==================================================
   ROUND CONTROLS
================================================== */

.round-controls {
  position: relative;

  z-index: 2;

  min-width: 0;
  min-height: 0;

  display: flex;

  flex-direction: column;

  justify-content: space-between;

  padding:
      clamp(
          0.55rem,
          0.75vw,
          0.9rem
      );

  border-left:
      1px solid
      rgba(126, 94, 255, 0.16);

  background:
      linear-gradient(
          145deg,
          rgba(40, 30, 91, 0.14),
          rgba(15, 34, 77, 0.07)
      );
}


.round-status {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;
}


.round-status span {
  font-size:
      clamp(
          0.38rem,
          0.38vw,
          0.49rem
      );

  letter-spacing:
      0.09em;

  color:
      rgba(134, 131, 174, 0.55);
}


.round-status strong {
  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          1.4rem,
          2vw,
          2.5rem
      );

  font-weight: 400;

  line-height: 0.8;

  color:
      rgba(147, 164, 255, 0.48);
}


/* ==================================================
   NEXT ROUND
================================================== */

.next-round-wrap {
  position: relative;

  width: 100%;
}


.next-round-tooltip {
  position: absolute;

  right: 0;
  bottom: calc(100% + 0.5rem);

  z-index: 40;

  width:
      min(
          15rem,
          70vw
      );

  padding:
      0.5rem
      0.58rem;

  border:
      1px solid
      rgba(168, 112, 255, 0.46);

  background:
      rgba(9, 7, 27, 0.98);

  box-shadow:
      0 0
      1.1rem
      rgba(80, 43, 170, 0.25);

  font-size:
      clamp(
          0.43rem,
          0.44vw,
          0.57rem
      );

  line-height: 1.42;

  color:
      rgba(220, 205, 247, 0.9);

  opacity: 0;
  visibility: hidden;

  pointer-events: none;

  transform:
      translateY(0.25rem);

  transition:
      opacity 150ms ease,
      visibility 150ms ease,
      transform 150ms ease;
}


.next-round-wrap.blocked:hover
.next-round-tooltip,
.next-round-wrap.blocked:focus-within
.next-round-tooltip {
  opacity: 1;
  visibility: visible;

  transform:
      translateY(0);
}

.next-round-button {
  width: 100%;

  min-height:
      clamp(
          2.8rem,
          6vh,
          4.2rem
      );

  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 0.5rem;

  padding:
      0
      clamp(
          0.5rem,
          0.7vw,
          0.8rem
      );

  border:
      1px solid
      rgba(94, 167, 255, 0.45);

  background:
      linear-gradient(
          135deg,
          rgba(42, 101, 184, 0.24),
          rgba(83, 47, 173, 0.17)
      );

  color:
      rgba(177, 215, 255, 0.92);

  cursor: pointer;

  transition:
      border-color
      170ms
      ease,
      box-shadow
      170ms
      ease,
      transform
      170ms
      ease;
}


.next-round-button:hover:not(:disabled) {
  border-color:
      rgba(101, 187, 255, 0.8);

  box-shadow:
      0 0
      1rem
      rgba(64, 144, 255, 0.16);

  transform:
      translateX(0.12rem);
}


.next-round-button:disabled {
  border-color:
      rgba(126, 129, 151, 0.18);

  background:
      linear-gradient(
          135deg,
          rgba(85, 88, 103, 0.13),
          rgba(54, 55, 68, 0.11)
      );

  color:
      rgba(154, 157, 169, 0.4);

  opacity: 1;

  cursor: not-allowed;
}


.next-round-button div {
  min-width: 0;

  display: flex;

  flex-direction: column;

  align-items: flex-start;
}


.next-round-button span {
  font-size:
      clamp(
          0.34rem,
          0.34vw,
          0.44rem
      );

  letter-spacing:
      0.1em;

  color:
      rgba(124, 174, 235, 0.64);
}


.next-round-button strong {
  margin-top: 0.08rem;

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.62rem,
          0.7vw,
          0.9rem
      );

  font-weight: 500;
}


/* ==================================================
   PAUSED / COMPLETE / WAITING
================================================== */

.paused-status,
.complete-status,
.waiting-status {
  flex: 1;

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 0.45rem;

  text-align: center;

  font-size:
      clamp(
          0.4rem,
          0.4vw,
          0.52rem
      );

  letter-spacing:
      0.08em;

  color:
      rgba(154, 159, 208, 0.7);
}


.resume-button {
  width: 100%;

  min-height: 2.5rem;

  display: flex;

  align-items: center;
  justify-content: center;

  gap: 0.4rem;

  border:
      1px solid
      rgba(92, 181, 255, 0.48);

  background:
      rgba(46, 105, 181, 0.18);

  color:
      rgba(173, 218, 255, 0.9);

  cursor: pointer;
}


.waiting-pulse {
  width: 0.45rem;
  height: 0.45rem;

  border-radius: 50%;

  background:
      rgba(117, 126, 255, 0.9);

  box-shadow:
      0 0
      0.6rem
      rgba(117, 126, 255, 0.7);

  animation:
      waitingPulse
      900ms
      ease-in-out
      infinite alternate;
}


@keyframes waitingPulse {

  from {
    opacity: 0.3;

    transform:
        scale(0.75);
  }

  to {
    opacity: 1;

    transform:
        scale(1.15);
  }
}


/* ==================================================
   BUSY OVERLAY
================================================== */

.busy-overlay {
  position: absolute;

  inset: 0;

  z-index: 50;

  display: grid;

  place-items: center;

  pointer-events: all;

  background:
      rgba(3, 4, 14, 0.38);

  backdrop-filter:
      blur(1.5px);
}


.busy-indicator {
  display: flex;

  align-items: center;

  gap: 0.3rem;
}


.busy-indicator span {
  width: 0.32rem;
  height: 0.32rem;

  border-radius: 50%;

  background:
      rgba(130, 119, 255, 0.95);

  box-shadow:
      0 0
      0.5rem
      rgba(130, 119, 255, 0.65);

  animation:
      busyPulse
      800ms
      ease-in-out
      infinite;
}


.busy-indicator span:nth-child(2) {
  animation-delay: 120ms;
}


.busy-indicator span:nth-child(3) {
  animation-delay: 240ms;
}


@keyframes busyPulse {

  0%,
  100% {
    opacity: 0.25;

    transform:
        translateY(0);
  }

  50% {
    opacity: 1;

    transform:
        translateY(-0.22rem);
  }
}


/* ==================================================
   TRANSITIONS
================================================== */

.angles-enter-active,
.angles-leave-active,
.menu-enter-active,
.menu-leave-active,
.busy-enter-active,
.busy-leave-active {
  transition:
      opacity
      180ms
      ease,
      transform
      180ms
      ease;
}


.angles-enter-from,
.angles-leave-to {
  opacity: 0;

  transform:
      translateY(0.5rem);
}


.menu-enter-from,
.menu-leave-to {
  opacity: 0;

  transform:
      translateY(-0.3rem);
}


.busy-enter-from,
.busy-leave-to {
  opacity: 0;
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 1100px) {

  .user-response-controller {
    grid-template-columns:
        minmax(9rem, 0.7fr)
        minmax(0, 2.5fr)
        minmax(7rem, 0.55fr);
  }


  .response-heading > p {
    display: none;
  }


  .shortcut-copy {
    display: none;
  }


  .editor-footer {
    grid-template-columns:
        auto
        1fr;
  }


  .send-button {
    justify-self: end;
  }


  .angle-button span {
    display: none;
  }
}


@media (max-width: 760px) {

  .user-response-controller {
    grid-template-columns:
        minmax(7rem, 0.65fr)
        minmax(0, 2.5fr)
        minmax(5.5rem, 0.5fr);
  }


  .position-copy {
    -webkit-line-clamp: 2;
  }


  .mode-tab span {
    display: none;
  }


  .round-status strong {
    font-size: 1.3rem;
  }


  .next-round-button {
    padding:
        0
        0.4rem;
  }


  .next-round-button span {
    display: none;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (
prefers-reduced-motion:
    reduce
) {

  .waiting-pulse,
  .busy-indicator span {
    animation: none;
  }


  .angles-enter-active,
  .angles-leave-active,
  .menu-enter-active,
  .menu-leave-active,
  .busy-enter-active,
  .busy-leave-active {
    transition-duration: 100ms;
  }
}
</style>
