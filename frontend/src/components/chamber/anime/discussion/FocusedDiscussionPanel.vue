<script setup>
import {
  computed,
  nextTick,
  ref,
  watch
} from 'vue'

import {
  Bot,
  ChevronDown,
  CircleDot,
  CornerDownRight,
  MessageCircleMore,
  Send,
  Sparkles,
  User,
  X
} from 'lucide-vue-next'


/* ==================================================
   PROPS
================================================== */

const props = defineProps({

  /*
    Authoritative focused discussion branch.

    Expected shape:

    {
        id,
        title,
        topic,
        openedFrom,
        status,

        participants: [],

        messages: [
            {
                id,
                speakerType,
                speakerId,
                content,
                createdAt,
                ...
            }
        ],

        mediator: {
            statements,
            summary,
            resolved,
            conclusion
        },

        conclusion,
        createdAt,
        updatedAt
    }
  */

  discussion: {
    type: Object,
    default: null
  },


  /*
    Character participant currently associated with
    this focused discussion.
  */

  participant: {
    type: Object,
    default: null
  },


  /*
    True while:

        opening focused discussion
        sending focused discussion message
  */

  loading: {
    type: Boolean,
    default: false
  },


  /*
    Prevents interaction while another mutation is
    active or the main session is unavailable.
  */

  disabled: {
    type: Boolean,
    default: false
  }
})


/* ==================================================
   EMITS
================================================== */

const emit = defineEmits([
  'send',
  'close'
])


/* ==================================================
   LOCAL UI STATE
================================================== */

const messageText =
    ref('')


const messageInputRef =
    ref(null)


const messageScrollRef =
    ref(null)


/* ==================================================
   DISCUSSION STATE
================================================== */

const hasDiscussion = computed(() =>
    Boolean(
        props.discussion
    )
)


/*
  When a user clicks a council response, the parent
  immediately starts opening the focused discussion.

  The backend discussion object may not exist yet while
  the AI is generating the first character response.

  Keep the panel visually occupied during that gap so
  the click always has immediate feedback.
*/

const isOpeningDiscussion = computed(() =>
    props.loading
    &&
    !hasDiscussion.value
    &&
    Boolean(
        props.participant
    )
)


const discussionTitle = computed(() =>
    props.discussion
        ?.title ??

    props.discussion
        ?.topic ??

    'Focused Discussion'
)


const discussionTopic = computed(() =>
    props.discussion
        ?.topic ??
    ''
)


const discussionStatus = computed(() =>
    props.discussion
        ?.status ??
    'active'
)


const discussionIsResolved = computed(() =>
    discussionStatus.value ===
    'resolved'

    ||

    Boolean(
        props.discussion
            ?.mediator
            ?.resolved
    )
)


/* ==================================================
   PARTICIPANT DISPLAY
================================================== */

const participantName = computed(() =>
    props.participant
        ?.name ??
    'Council Member'
)


const participantRole = computed(() =>
    props.participant
        ?.role ??
    'Council Member'
)


/* ==================================================
   CHARACTER IMAGE
================================================== */

const participantImage = computed(() => {

  if (
      !props.participant
          ?.id
  ) {
    return ''
  }


  return (
      `/images/chamber/char/` +
      `${props.participant.id}/` +
      `NeonOffice.png`
  )
})


/* ==================================================
   MESSAGES
================================================== */

const messages = computed(() => {

  const value =
      props.discussion
          ?.messages


  if (
      !Array.isArray(value)
  ) {
    return []
  }


  return value
})


/* ==================================================
   MEDIATOR DISCUSSION STATE
================================================== */

const mediatorState = computed(() =>
    props.discussion
        ?.mediator ??
    {}
)


const mediatorSummary = computed(() =>
    mediatorState.value
        ?.summary ??
    ''
)


const mediatorConclusion = computed(() =>
    mediatorState.value
        ?.conclusion ??

    props.discussion
        ?.conclusion ??

    ''
)


/* ==================================================
   MESSAGE HELPERS
================================================== */

const messageSpeakerType =
    message => {

      return (
          message?.speakerType ??
          message?.speaker_type ??
          'unknown'
      )
    }


const messageSpeakerId =
    message => {

      return (
          message?.speakerId ??
          message?.speaker_id ??
          null
      )
    }


const messageContent =
    message => {

      return (
          message?.content ??
          message?.message ??
          message?.text ??
          ''
      )
    }


const isUserMessage =
    message => {

      const type =
          messageSpeakerType(
              message
          )


      return (
          type === 'user'
          ||
          type === 'member'
      )
    }


const isMediatorMessage =
    message => {

      const type =
          messageSpeakerType(
              message
          )


      return (
          type === 'mediator'
      )
    }


const isCharacterMessage =
    message => {

      if (
          isUserMessage(message)
          ||
          isMediatorMessage(message)
      ) {
        return false
      }


      const speakerId =
          messageSpeakerId(
              message
          )


      if (
          speakerId
          &&
          props.participant
              ?.id
      ) {

        return (
            String(speakerId)
            ===
            String(
                props.participant.id
            )
        )
      }


      const type =
          messageSpeakerType(
              message
          )


      return (
          type === 'character'
          ||
          type === 'council_member'
          ||
          type === 'assistant'
      )
    }


/* ==================================================
   SPEAKER LABEL
================================================== */

const speakerLabel =
    message => {

      if (
          isUserMessage(message)
      ) {
        return 'You'
      }


      if (
          isMediatorMessage(message)
      ) {
        return 'Mediator'
      }


      if (
          isCharacterMessage(message)
      ) {
        return participantName.value
      }


      return 'Council'
    }


/* ==================================================
   CAN SEND
================================================== */

const hasMessageText = computed(() =>
    Boolean(
        messageText.value
            .trim()
    )
)


const canSend = computed(() =>
    hasDiscussion.value
    &&
    !props.loading
    &&
    !props.disabled
    &&
    !discussionIsResolved.value
    &&
    hasMessageText.value
)


/* ==================================================
   SEND MESSAGE

   DiscussionScene accepts:

       {
           content: "..."
       }
================================================== */

const sendMessage =
    () => {

      if (
          !canSend.value
      ) {
        return
      }


      const content =
          messageText.value
              .trim()


      emit(
          'send',

          {
            content
          }
      )


      messageText.value =
          ''
    }


/* ==================================================
   KEYBOARD SUBMIT

   Ctrl + Enter
   Cmd + Enter
================================================== */

const handleKeydown =
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


      sendMessage()
    }


/* ==================================================
   CLOSE PANEL

   This only clears the focused pointer in the store.

   It does NOT delete the discussion branch.
================================================== */

const closePanel =
    () => {

      emit(
          'close'
      )
    }


/* ==================================================
   SCROLL TO LATEST MESSAGE
================================================== */

const scrollToLatest =
    async () => {

      await nextTick()


      const element =
          messageScrollRef.value


      if (!element) {
        return
      }


      element.scrollTop =
          element.scrollHeight
    }


/* ==================================================
   AUTO-SCROLL WHEN MESSAGE COUNT CHANGES
================================================== */

watch(
    () => messages.value.length,

    () => {

      void scrollToLatest()
    },

    {
      immediate: true
    }
)


/* ==================================================
   FOCUS INPUT WHEN DISCUSSION OPENS
================================================== */

watch(
    () => props.discussion?.id,

    async discussionId => {

      if (!discussionId) {
        return
      }


      await nextTick()


      messageInputRef.value
          ?.focus()


      await scrollToLatest()
    }
)
</script>


<template>
  <section
      class="focused-discussion-panel"
      :class="{
        empty:
            !hasDiscussion,

        loading,

        resolved:
            discussionIsResolved
      }"
  >

    <!-- ==================================================
         FRAME DECORATION
    ================================================== -->

    <span class="frame-corner corner-top-left"></span>

    <span class="frame-corner corner-top-right"></span>

    <span class="frame-corner corner-bottom-left"></span>

    <span class="frame-corner corner-bottom-right"></span>


    <!-- ==================================================
         OPENING / FIRST AI RESPONSE

         This state appears immediately after the user
         clicks a council response and remains visible
         while the backend opens the discussion branch
         and generates the first AI response.
    ================================================== -->

    <div
        v-if="isOpeningDiscussion"
        class="opening-state"
    >

      <div class="opening-profile">

        <div class="opening-portrait">

          <img
              v-if="participantImage"
              :src="participantImage"
              :alt="participantName"
          >


          <Bot
              v-else
              :size="26"
          />

        </div>


        <div class="opening-profile-copy">

          <span>
            {{ participantRole }}
          </span>


          <strong>
            {{ participantName }}
          </strong>


          <small>
            Opening focused discussion
          </small>

        </div>

      </div>


      <div class="opening-typing-card">

        <span class="opening-speaker">
          {{ participantName }}
        </span>


        <div class="typing-line">

          <div class="thinking-dots">

            <span></span>

            <span></span>

            <span></span>

          </div>


          <p>
            is typing the first response...
          </p>

        </div>

      </div>


      <p class="opening-note">
        Preparing a focused discussion around the point
        you selected.
      </p>

    </div>


    <!-- ==================================================
         EMPTY STATE
    ================================================== -->

    <div
        v-else-if="!hasDiscussion"
        class="empty-state"
    >

      <div class="empty-icon">

        <MessageCircleMore :size="29" />

        <span class="empty-pulse"></span>

      </div>


      <div class="empty-copy">

        <span class="empty-kicker">
          FOCUSED DISCUSSION
        </span>


        <strong>
          Explore a point in depth
        </strong>


        <p>
          Click a council member's response text to open
          a focused discussion around that exact point.
        </p>


        <span class="empty-action-hint">
          CLICK RESPONSE TEXT TO DISCUSS FURTHER
        </span>

      </div>

    </div>


    <!-- ==================================================
         ACTIVE DISCUSSION
    ================================================== -->

    <template
        v-else
    >

      <!-- ================================================
           HEADER
      ================================================= -->

      <header class="discussion-header">

        <div class="participant-portrait">

          <img
              v-if="participantImage"
              :src="participantImage"
              :alt="participantName"
          >


          <Bot
              v-else
              :size="20"
          />

        </div>


        <div class="header-copy">

          <span class="participant-role">
            {{ participantRole }}
          </span>


          <strong class="participant-name">
            {{ participantName }}
          </strong>


          <span class="discussion-label">
            Focused Discussion
          </span>

        </div>


        <div
            class="status-chip"
            :class="{
              resolved:
                  discussionIsResolved
            }"
        >

          <CircleDot :size="10" />


          <span>
            {{
              discussionIsResolved
                  ? 'Resolved'
                  : 'Active'
            }}
          </span>

        </div>


        <button
            class="close-button"
            type="button"
            aria-label="Close focused discussion"
            @click="
              closePanel
            "
        >

          <X :size="15" />

        </button>

      </header>


      <!-- ================================================
           TOPIC
      ================================================= -->

      <div class="topic-banner">

        <CornerDownRight :size="13" />


        <div>

          <span>
            DISCUSSION POINT
          </span>


          <p>
            {{
              discussionTopic ||
              discussionTitle
            }}
          </p>

        </div>

      </div>


      <!-- ================================================
           MESSAGE STREAM
      ================================================= -->

      <div
          ref="messageScrollRef"
          class="message-scroll"
      >

        <!-- ==============================================
             NO MESSAGES YET
        =============================================== -->

        <div
            v-if="
              !messages.length
              &&
              loading
            "
            class="initializing-state"
        >

          <div class="thinking-dots">

            <span></span>

            <span></span>

            <span></span>

          </div>


          <p>
            {{ participantName }} is typing the first response...
          </p>

        </div>


        <!-- ==============================================
             MESSAGE LIST
        =============================================== -->

        <div
            v-else
            class="message-list"
        >

          <article
              v-for="(message, index) in messages"
              :key="
                message.id ??
                `message-${index}`
              "
              class="message-row"
              :class="{
                user:
                    isUserMessage(message),

                character:
                    isCharacterMessage(message),

                mediator:
                    isMediatorMessage(message)
              }"
          >

            <!-- ==========================================
                 SPEAKER ICON
            =========================================== -->

            <div class="speaker-icon">

              <User
                  v-if="
                    isUserMessage(message)
                  "
                  :size="13"
              />


              <Sparkles
                  v-else-if="
                    isMediatorMessage(message)
                  "
                  :size="13"
              />


              <Bot
                  v-else
                  :size="13"
              />

            </div>


            <!-- ==========================================
                 MESSAGE
            =========================================== -->

            <div class="message-body">

              <span class="speaker-label">
                {{ speakerLabel(message) }}
              </span>


              <p>
                {{ messageContent(message) }}
              </p>

            </div>

          </article>

        </div>


        <!-- ==============================================
             MEDIATOR SUMMARY
        =============================================== -->

        <section
            v-if="mediatorSummary"
            class="discussion-mediator-summary"
        >

          <div class="mediator-summary-header">

            <Sparkles :size="12" />


            <span>
              MEDIATOR NOTE
            </span>

          </div>


          <p>
            {{ mediatorSummary }}
          </p>

        </section>


        <!-- ==============================================
             CONCLUSION
        =============================================== -->

        <section
            v-if="
              discussionIsResolved
              &&
              mediatorConclusion
            "
            class="discussion-conclusion"
        >

          <span>
            CONCLUSION
          </span>


          <p>
            {{ mediatorConclusion }}
          </p>

        </section>

      </div>


      <!-- ================================================
           LOADING RESPONSE BAR
      ================================================= -->

      <div
          v-if="
            loading
            &&
            messages.length
          "
          class="response-loading-bar"
      >

        <div class="thinking-dots small">

          <span></span>

          <span></span>

          <span></span>

        </div>


        <span>
          {{ participantName }} is responding...
        </span>

      </div>


      <!-- ================================================
           INPUT
      ================================================= -->

      <footer class="discussion-input-area">

        <div class="input-wrap">

          <textarea
              ref="messageInputRef"
              v-model="messageText"

              :placeholder="
                discussionIsResolved
                    ? 'This discussion has been resolved.'
                    : `Continue with ${participantName}...`
              "

              :disabled="
                disabled
                ||
                loading
                ||
                discussionIsResolved
              "

              maxlength="3000"

              @keydown="
                handleKeydown
              "
          ></textarea>


          <div class="input-footer">

            <span class="input-hint">
              CTRL + ENTER TO SEND
            </span>


            <span class="character-count">
              {{ messageText.length }}
              /
              3000
            </span>


            <button
                class="send-button"
                type="button"
                :disabled="
                  !canSend
                "
                @click="
                  sendMessage
                "
            >

              <Send :size="13" />

            </button>

          </div>

        </div>

      </footer>


      <!-- ================================================
           BOTTOM TECH STRIP
      ================================================= -->

      <div class="tech-strip">

        <span>
          BRANCH //
          {{
            discussion?.id
                ? String(discussion.id)
                    .slice(0, 8)
                : 'ACTIVE'
          }}
        </span>


        <ChevronDown :size="11" />

      </div>

    </template>

  </section>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.focused-discussion-panel {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  display: flex;

  flex-direction: column;

  overflow: hidden;

  border:
      1px solid
      rgba(126, 88, 255, 0.68);

  border-radius:
      0.42rem;

  background:
      linear-gradient(
          150deg,
          rgba(10, 8, 30, 0.97),
          rgba(4, 7, 21, 0.98)
      );

  box-shadow:
      inset
      0 0
      0
      1px
      rgba(74, 167, 255, 0.05),

      0 0
      1.35rem
      rgba(92, 46, 255, 0.18),

      0 0
      2.8rem
      rgba(35, 116, 255, 0.05);

  backdrop-filter:
      blur(16px);

  color:
      rgba(239, 237, 255, 0.94);
}


/* ==================================================
   BACKGROUND EFFECT
================================================== */

.focused-discussion-panel::before {
  content: '';

  position: absolute;

  inset: 0;

  pointer-events: none;

  background:
      radial-gradient(
          ellipse at 12% 0%,
          rgba(76, 147, 255, 0.12),
          transparent 36%
      ),
      linear-gradient(
          125deg,
          transparent 30%,
          rgba(119, 76, 255, 0.035),
          transparent 72%
      );
}


/* ==================================================
   FRAME CORNERS
================================================== */

.frame-corner {
  position: absolute;

  z-index: 20;

  width: 0.68rem;
  height: 0.68rem;

  pointer-events: none;
}


.corner-top-left {
  top: 0.16rem;
  left: 0.16rem;

  border-top:
      1px solid
      rgba(89, 199, 255, 0.74);

  border-left:
      1px solid
      rgba(89, 199, 255, 0.74);
}


.corner-top-right {
  top: 0.16rem;
  right: 0.16rem;

  border-top:
      1px solid
      rgba(181, 92, 255, 0.74);

  border-right:
      1px solid
      rgba(181, 92, 255, 0.74);
}


.corner-bottom-left {
  left: 0.16rem;
  bottom: 0.16rem;

  border-left:
      1px solid
      rgba(181, 92, 255, 0.56);

  border-bottom:
      1px solid
      rgba(181, 92, 255, 0.56);
}


.corner-bottom-right {
  right: 0.16rem;
  bottom: 0.16rem;

  border-right:
      1px solid
      rgba(89, 199, 255, 0.56);

  border-bottom:
      1px solid
      rgba(89, 199, 255, 0.56);
}


/* ==================================================
   OPENING / FIRST RESPONSE STATE
================================================== */

.opening-state {
  position: relative;

  z-index: 2;

  flex: 1;

  min-height: 0;

  display: flex;

  flex-direction: column;

  align-items: stretch;
  justify-content: center;

  gap:
      clamp(
          0.65rem,
          1vh,
          1rem
      );

  padding:
      clamp(
          0.75rem,
          1vw,
          1.2rem
      );
}


.opening-profile {
  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr);

  align-items: center;

  gap: 0.7rem;
}


.opening-portrait {
  position: relative;

  width:
      clamp(
          3.6rem,
          5vw,
          5.5rem
      );

  aspect-ratio: 1;

  display: grid;

  place-items: center;

  overflow: hidden;

  border:
      1px solid
      rgba(112, 144, 255, 0.58);

  border-radius: 0.35rem;

  background:
      rgba(18, 21, 57, 0.88);

  color:
      rgba(147, 192, 255, 0.88);

  box-shadow:
      0 0
      1.4rem
      rgba(81, 89, 255, 0.16);
}


.opening-portrait::after {
  content: '';

  position: absolute;

  inset: 0;

  pointer-events: none;

  background:
      linear-gradient(
          to top,
          rgba(3, 4, 18, 0.34),
          transparent 55%
      );
}


.opening-portrait img {
  width: 100%;
  height: 100%;

  object-fit: cover;

  object-position:
      center 18%;
}


.opening-profile-copy {
  min-width: 0;

  display: flex;

  flex-direction: column;
}


.opening-profile-copy span {
  font-size:
      clamp(
          0.38rem,
          0.38vw,
          0.5rem
      );

  letter-spacing: 0.11em;

  text-transform: uppercase;

  color:
      rgba(147, 137, 255, 0.76);
}


.opening-profile-copy strong {
  margin-top: 0.12rem;

  overflow: hidden;

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.9rem,
          1vw,
          1.25rem
      );

  font-weight: 500;

  white-space: nowrap;

  text-overflow: ellipsis;

  color:
      rgba(235, 232, 255, 0.94);
}


.opening-profile-copy small {
  margin-top: 0.18rem;

  font-size:
      clamp(
          0.4rem,
          0.42vw,
          0.55rem
      );

  letter-spacing: 0.06em;

  text-transform: uppercase;

  color:
      rgba(117, 134, 184, 0.58);
}


.opening-typing-card {
  padding:
      0.7rem
      0.75rem;

  border:
      1px solid
      rgba(132, 99, 255, 0.2);

  border-left:
      2px solid
      rgba(126, 100, 255, 0.62);

  background:
      linear-gradient(
          90deg,
          rgba(69, 48, 145, 0.16),
          rgba(28, 61, 108, 0.06)
      );

  box-shadow:
      inset
      0 0
      1rem
      rgba(83, 71, 184, 0.04);
}


.opening-speaker {
  display: block;

  margin-bottom: 0.42rem;

  font-size:
      clamp(
          0.36rem,
          0.36vw,
          0.47rem
      );

  letter-spacing: 0.09em;

  text-transform: uppercase;

  color:
      rgba(153, 143, 255, 0.72);
}


.typing-line {
  display: flex;

  align-items: center;

  gap: 0.55rem;
}


.typing-line p {
  margin: 0;

  font-size:
      clamp(
          0.49rem,
          0.5vw,
          0.65rem
      );

  color:
      rgba(197, 194, 225, 0.76);
}


.opening-note {
  margin: 0;

  text-align: center;

  font-size:
      clamp(
          0.4rem,
          0.42vw,
          0.55rem
      );

  line-height: 1.45;

  color:
      rgba(130, 130, 169, 0.55);
}


/* ==================================================
   EMPTY STATE
================================================== */

.empty-state {
  position: relative;

  z-index: 2;

  flex: 1;

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 0.9rem;

  padding: 1.3rem;

  text-align: center;
}


.empty-icon {
  position: relative;

  width: 4rem;
  height: 4rem;

  display: grid;

  place-items: center;

  border:
      1px solid
      rgba(120, 104, 255, 0.28);

  border-radius: 50%;

  color:
      rgba(137, 176, 255, 0.78);

  background:
      rgba(33, 40, 91, 0.12);
}


.empty-pulse {
  position: absolute;

  inset: -0.4rem;

  border:
      1px solid
      rgba(123, 98, 255, 0.14);

  border-radius: 50%;

  animation:
      emptyPulse
      1800ms
      ease-in-out
      infinite;
}


@keyframes emptyPulse {

  0%,
  100% {
    opacity: 0.2;

    transform:
        scale(0.92);
  }

  50% {
    opacity: 0.85;

    transform:
        scale(1.08);
  }
}


.empty-copy {
  max-width: 16rem;
}


.empty-kicker {
  font-size:
      clamp(
          0.4rem,
          0.4vw,
          0.52rem
      );

  letter-spacing:
      0.12em;

  color:
      rgba(142, 132, 212, 0.7);
}


.empty-copy strong {
  display: block;

  margin-top: 0.3rem;

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.76rem,
          0.82vw,
          1rem
      );

  font-weight: 500;

  color:
      rgba(232, 229, 250, 0.9);
}


.empty-copy p {
  margin:
      0.45rem
      0
      0;

  font-size:
      clamp(
          0.49rem,
          0.5vw,
          0.64rem
      );

  line-height: 1.5;

  color:
      rgba(166, 163, 194, 0.61);
}


.empty-action-hint {
  display: inline-flex;

  margin-top: 0.75rem;

  padding:
      0.35rem
      0.5rem;

  border:
      1px solid
      rgba(108, 151, 255, 0.2);

  background:
      rgba(48, 77, 145, 0.08);

  font-size:
      clamp(
          0.32rem,
          0.34vw,
          0.45rem
      );

  letter-spacing: 0.09em;

  color:
      rgba(131, 181, 255, 0.7);
}


/* ==================================================
   HEADER
================================================== */

.discussion-header {
  position: relative;

  z-index: 3;

  flex: 0 0 auto;

  min-height:
      clamp(
          3.5rem,
          7vh,
          5rem
      );

  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr)
      auto
      auto;

  align-items: center;

  gap: 0.5rem;

  padding:
      clamp(
          0.5rem,
          0.7vw,
          0.8rem
      );

  border-bottom:
      1px solid
      rgba(132, 100, 255, 0.16);

  background:
      linear-gradient(
          90deg,
          rgba(45, 45, 106, 0.16),
          transparent
      );
}


/* ==================================================
   PORTRAIT
================================================== */

.participant-portrait {
  width:
      clamp(
          2.2rem,
          3vw,
          3.4rem
      );

  height:
      clamp(
          2.2rem,
          3vw,
          3.4rem
      );

  display: grid;

  place-items: center;

  overflow: hidden;

  border:
      1px solid
      rgba(115, 132, 255, 0.44);

  border-radius:
      0.25rem;

  background:
      rgba(17, 19, 53, 0.78);

  color:
      rgba(138, 181, 255, 0.86);
}


.participant-portrait img {
  width: 100%;
  height: 100%;

  object-fit: cover;

  object-position:
      center 18%;
}


/* ==================================================
   HEADER COPY
================================================== */

.header-copy {
  min-width: 0;

  display: flex;

  flex-direction: column;
}


.participant-role {
  overflow: hidden;

  font-size:
      clamp(
          0.4rem,
          0.4vw,
          0.52rem
      );

  letter-spacing:
      0.1em;

  text-transform:
      uppercase;

  white-space: nowrap;

  text-overflow: ellipsis;

  color:
      rgba(149, 138, 255, 0.78);
}


.participant-name {
  margin-top: 0.08rem;

  overflow: hidden;

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.7rem,
          0.75vw,
          0.96rem
      );

  font-weight: 500;

  white-space: nowrap;

  text-overflow: ellipsis;
}


.discussion-label {
  margin-top: 0.08rem;

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
      rgba(121, 135, 186, 0.55);
}


/* ==================================================
   STATUS
================================================== */

.status-chip {
  display: flex;

  align-items: center;

  gap: 0.25rem;

  padding:
      0.25rem
      0.4rem;

  border:
      1px solid
      rgba(88, 178, 255, 0.2);

  background:
      rgba(45, 95, 159, 0.1);

  font-size:
      clamp(
          0.36rem,
          0.36vw,
          0.47rem
      );

  letter-spacing:
      0.07em;

  text-transform: uppercase;

  color:
      rgba(128, 192, 255, 0.78);
}


.status-chip.resolved {
  border-color:
      rgba(141, 107, 255, 0.22);

  background:
      rgba(85, 55, 158, 0.12);

  color:
      rgba(189, 164, 255, 0.8);
}


/* ==================================================
   CLOSE BUTTON
================================================== */

.close-button {
  width: 1.75rem;
  height: 1.75rem;

  display: grid;

  place-items: center;

  padding: 0;

  border:
      1px solid
      rgba(133, 100, 255, 0.2);

  background:
      rgba(40, 31, 82, 0.12);

  color:
      rgba(184, 177, 214, 0.7);

  cursor: pointer;

  transition:
      border-color
      150ms
      ease,
      color
      150ms
      ease,
      background
      150ms
      ease;
}


.close-button:hover {
  border-color:
      rgba(201, 105, 255, 0.45);

  background:
      rgba(110, 42, 150, 0.14);

  color:
      rgba(231, 186, 255, 0.92);
}


/* ==================================================
   TOPIC BANNER
================================================== */

.topic-banner {
  position: relative;

  z-index: 3;

  flex: 0 0 auto;

  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr);

  gap: 0.4rem;

  padding:
      0.45rem
      clamp(
          0.55rem,
          0.7vw,
          0.8rem
      );

  border-bottom:
      1px solid
      rgba(128, 99, 255, 0.11);

  background:
      linear-gradient(
          90deg,
          rgba(61, 51, 131, 0.12),
          rgba(30, 67, 118, 0.06)
      );

  color:
      rgba(127, 182, 255, 0.76);
}


.topic-banner > div {
  min-width: 0;
}


.topic-banner span {
  display: block;

  font-size:
      clamp(
          0.34rem,
          0.34vw,
          0.45rem
      );

  letter-spacing:
      0.1em;

  color:
      rgba(127, 128, 176, 0.52);
}


.topic-banner p {
  margin:
      0.15rem
      0
      0;

  display: -webkit-box;

  overflow: hidden;

  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  font-size:
      clamp(
          0.48rem,
          0.49vw,
          0.63rem
      );

  line-height: 1.4;

  color:
      rgba(198, 195, 224, 0.78);
}


/* ==================================================
   MESSAGE SCROLL
================================================== */

.message-scroll {
  position: relative;

  z-index: 2;

  flex: 1;

  min-height: 0;

  overflow-y: auto;

  padding:
      clamp(
          0.5rem,
          0.7vw,
          0.85rem
      );

  scrollbar-width: thin;

  scrollbar-color:
      rgba(129, 91, 255, 0.34)
      transparent;
}


.message-scroll::-webkit-scrollbar {
  width: 3px;
}


.message-scroll::-webkit-scrollbar-thumb {
  background:
      rgba(129, 91, 255, 0.34);
}


/* ==================================================
   MESSAGE LIST
================================================== */

.message-list {
  display: flex;

  flex-direction: column;

  gap: 0.55rem;
}


.message-row {
  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr);

  align-items: flex-start;

  gap: 0.42rem;
}


/* ==================================================
   USER MESSAGE
================================================== */

.message-row.user {
  grid-template-columns:
      minmax(0, 1fr)
      auto;
}


.message-row.user
.speaker-icon {
  grid-column: 2;

  color:
      rgba(118, 198, 255, 0.86);

  border-color:
      rgba(91, 181, 255, 0.28);

  background:
      rgba(36, 95, 151, 0.12);
}


.message-row.user
.message-body {
  grid-column: 1;
  grid-row: 1;

  align-items: flex-end;
}


.message-row.user
.message-body p {
  border-right:
      1px solid
      rgba(80, 171, 255, 0.34);

  border-left: 0;

  background:
      linear-gradient(
          270deg,
          rgba(43, 99, 160, 0.12),
          transparent
      );

  text-align: right;
}


/* ==================================================
   SPEAKER ICON
================================================== */

.speaker-icon {
  width: 1.55rem;
  height: 1.55rem;

  display: grid;

  place-items: center;

  border:
      1px solid
      rgba(137, 105, 255, 0.25);

  background:
      rgba(55, 41, 115, 0.1);

  color:
      rgba(170, 148, 255, 0.84);
}


/* ==================================================
   MESSAGE BODY
================================================== */

.message-body {
  min-width: 0;

  display: flex;

  flex-direction: column;

  align-items: flex-start;
}


.speaker-label {
  margin-bottom: 0.17rem;

  font-size:
      clamp(
          0.35rem,
          0.35vw,
          0.46rem
      );

  letter-spacing:
      0.08em;

  text-transform: uppercase;

  color:
      rgba(133, 132, 177, 0.58);
}


.message-body p {
  width: 100%;

  margin: 0;

  padding:
      0.42rem
      0.48rem;

  border-left:
      1px solid
      rgba(142, 100, 255, 0.3);

  background:
      linear-gradient(
          90deg,
          rgba(65, 44, 132, 0.12),
          transparent
      );

  font-size:
      clamp(
          0.49rem,
          0.5vw,
          0.65rem
      );

  line-height: 1.48;

  color:
      rgba(200, 197, 226, 0.82);
}


/* ==================================================
   MEDIATOR MESSAGE
================================================== */

.message-row.mediator
.speaker-icon {
  color:
      rgba(133, 191, 255, 0.84);

  border-color:
      rgba(83, 171, 255, 0.25);

  background:
      rgba(37, 86, 147, 0.1);
}


.message-row.mediator
.message-body p {
  border-left-color:
      rgba(83, 171, 255, 0.3);

  background:
      linear-gradient(
          90deg,
          rgba(34, 79, 137, 0.12),
          transparent
      );
}


/* ==================================================
   INITIALIZING STATE
================================================== */

.initializing-state {
  min-height: 100%;

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 0.55rem;

  text-align: center;

  color:
      rgba(163, 159, 198, 0.62);
}


.initializing-state p {
  margin: 0;

  font-size:
      clamp(
          0.46rem,
          0.47vw,
          0.61rem
      );
}


/* ==================================================
   THINKING DOTS
================================================== */

.thinking-dots {
  display: flex;

  align-items: center;

  gap: 0.27rem;
}


.thinking-dots span {
  width: 0.3rem;
  height: 0.3rem;

  border-radius: 50%;

  background:
      rgba(139, 104, 255, 0.92);

  box-shadow:
      0 0
      0.5rem
      rgba(139, 104, 255, 0.62);

  animation:
      thinkingPulse
      800ms
      ease-in-out
      infinite;
}


.thinking-dots span:nth-child(2) {
  animation-delay: 120ms;
}


.thinking-dots span:nth-child(3) {
  animation-delay: 240ms;
}


@keyframes thinkingPulse {

  0%,
  100% {
    opacity: 0.25;

    transform:
        translateY(0);
  }

  50% {
    opacity: 1;

    transform:
        translateY(-0.18rem);
  }
}


.thinking-dots.small span {
  width: 0.22rem;
  height: 0.22rem;
}


/* ==================================================
   MEDIATOR SUMMARY
================================================== */

.discussion-mediator-summary {
  margin-top: 0.7rem;

  padding: 0.55rem;

  border:
      1px solid
      rgba(102, 160, 255, 0.17);

  background:
      linear-gradient(
          135deg,
          rgba(39, 76, 140, 0.11),
          rgba(68, 49, 146, 0.07)
      );
}


.mediator-summary-header {
  display: flex;

  align-items: center;

  gap: 0.3rem;

  font-size:
      clamp(
          0.36rem,
          0.36vw,
          0.47rem
      );

  letter-spacing:
      0.1em;

  color:
      rgba(124, 184, 255, 0.76);
}


.discussion-mediator-summary p {
  margin:
      0.35rem
      0
      0;

  font-size:
      clamp(
          0.48rem,
          0.49vw,
          0.63rem
      );

  line-height: 1.48;

  color:
      rgba(191, 194, 222, 0.76);
}


/* ==================================================
   CONCLUSION
================================================== */

.discussion-conclusion {
  margin-top: 0.6rem;

  padding: 0.55rem;

  border:
      1px solid
      rgba(160, 102, 255, 0.18);

  background:
      rgba(85, 51, 151, 0.1);
}


.discussion-conclusion > span {
  font-size:
      clamp(
          0.36rem,
          0.36vw,
          0.47rem
      );

  letter-spacing:
      0.1em;

  color:
      rgba(192, 149, 255, 0.78);
}


.discussion-conclusion p {
  margin:
      0.3rem
      0
      0;

  font-size:
      clamp(
          0.49rem,
          0.5vw,
          0.64rem
      );

  line-height: 1.5;

  color:
      rgba(211, 204, 234, 0.82);
}


/* ==================================================
   RESPONSE LOADING
================================================== */

.response-loading-bar {
  position: relative;

  z-index: 3;

  flex: 0 0 auto;

  min-height: 1.7rem;

  display: flex;

  align-items: center;

  gap: 0.4rem;

  padding:
      0
      0.6rem;

  border-top:
      1px solid
      rgba(126, 100, 255, 0.1);

  font-size:
      clamp(
          0.38rem,
          0.38vw,
          0.49rem
      );

  letter-spacing:
      0.04em;

  color:
      rgba(157, 151, 196, 0.58);
}


/* ==================================================
   INPUT AREA
================================================== */

.discussion-input-area {
  position: relative;

  z-index: 3;

  flex: 0 0 auto;

  padding:
      0.5rem;

  border-top:
      1px solid
      rgba(128, 99, 255, 0.14);

  background:
      rgba(5, 5, 19, 0.6);
}


/* ==================================================
   INPUT WRAPPER
================================================== */

.input-wrap {
  display: flex;

  flex-direction: column;

  border:
      1px solid
      rgba(129, 99, 255, 0.23);

  background:
      rgba(3, 4, 15, 0.42);

  transition:
      border-color
      160ms
      ease,
      box-shadow
      160ms
      ease;
}


.input-wrap:focus-within {
  border-color:
      rgba(105, 141, 255, 0.52);

  box-shadow:
      inset
      0 0
      0.8rem
      rgba(60, 87, 180, 0.06);
}


/* ==================================================
   TEXTAREA
================================================== */

.input-wrap textarea {
  width: 100%;
  min-height: 3.3rem;

  resize: none;

  padding:
      0.45rem;

  border: 0;

  outline: none;

  background: transparent;

  font-family: inherit;

  font-size:
      clamp(
          0.49rem,
          0.5vw,
          0.65rem
      );

  line-height: 1.45;

  color:
      rgba(222, 219, 242, 0.88);
}


.input-wrap textarea::placeholder {
  color:
      rgba(140, 136, 171, 0.45);
}


/* ==================================================
   INPUT FOOTER
================================================== */

.input-footer {
  min-height: 1.65rem;

  display: grid;

  grid-template-columns:
      1fr
      auto
      auto;

  align-items: center;

  gap: 0.4rem;

  padding:
      0.2rem;

  border-top:
      1px solid
      rgba(126, 99, 255, 0.1);
}


.input-hint,
.character-count {
  font-size:
      clamp(
          0.32rem,
          0.33vw,
          0.43rem
      );

  letter-spacing:
      0.07em;

  color:
      rgba(117, 117, 155, 0.48);
}


/* ==================================================
   SEND BUTTON
================================================== */

.send-button {
  width: 1.7rem;
  height: 1.55rem;

  display: grid;

  place-items: center;

  padding: 0;

  border:
      1px solid
      rgba(86, 176, 255, 0.48);

  background:
      linear-gradient(
          135deg,
          rgba(43, 105, 182, 0.24),
          rgba(77, 48, 168, 0.2)
      );

  color:
      rgba(169, 217, 255, 0.92);

  cursor: pointer;
}


.send-button:disabled {
  opacity: 0.28;

  cursor: not-allowed;
}


/* ==================================================
   TECH STRIP
================================================== */

.tech-strip {
  position: relative;

  z-index: 3;

  flex: 0 0 auto;

  min-height: 1.25rem;

  display: flex;

  align-items: center;
  justify-content: space-between;

  padding:
      0
      0.55rem;

  border-top:
      1px solid
      rgba(126, 99, 255, 0.08);

  background:
      rgba(4, 5, 17, 0.82);

  font-size:
      clamp(
          0.31rem,
          0.32vw,
          0.42rem
      );

  letter-spacing:
      0.1em;

  color:
      rgba(99, 112, 159, 0.48);
}


/* ==================================================
   RESOLVED STATE
================================================== */

.focused-discussion-panel.resolved {
  border-color:
      rgba(105, 152, 255, 0.57);
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 1100px) {

  .status-chip span {
    display: none;
  }


  .topic-banner p {
    -webkit-line-clamp: 1;
  }


  .input-hint {
    display: none;
  }


  .input-footer {
    grid-template-columns:
        1fr
        auto;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (
prefers-reduced-motion:
    reduce
) {

  .empty-pulse,
  .thinking-dots span {
    animation: none;
  }
}
</style>
