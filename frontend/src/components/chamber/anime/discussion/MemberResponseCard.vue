<script setup>
import {
  computed
} from 'vue'

import {
  Check,
  X,
  Star,
  AlertTriangle,
  Target,
  MessageCircle
} from 'lucide-vue-next'

import {
  marked
} from 'marked'

import DOMPurify
  from 'dompurify'


/* ==================================================
   PROPS
================================================== */

const props = defineProps({

  /*
    Participant snapshot.

    Expected shape:

    {
        id,
        name,
        role,
        description,
        ...
    }
  */

  participant: {
    type: Object,
    required: true
  },


  /*
    Authoritative structured character state from:

        currentDiscussionStore
            .currentSection
            .characters[characterId]

    Expected shape:

    {
        status,

        confidence: {
            initial,
            current,
            history
        },

        position: {
            stance,
            statement,
            reasoning
        },

        risks: [],

        actions: [],

        agreements: [],

        disagreements: [],

        statementHistory: [],

        discussions: {},

        discussionOrder: []
    }
  */

  characterState: {
    type: Object,
    default: null
  },


  /*
    Current round reaction.

    Supported values:

        "agree"
        "disagree"
        null
  */

  reaction: {
    type: String,
    default: null
  },


  /*
    True only when THIS specific character
    is currently generating.
  */

  loading: {
    type: Boolean,
    default: false
  },


  /*
    Global discussion interaction lock.
  */

  disabled: {
    type: Boolean,
    default: false
  },


  /*
    Current debate round.
  */

  roundNumber: {
    type: Number,
    default: 1
  }
})


/* ==================================================
   EMITS
================================================== */

const emit = defineEmits([
  'select',
  'agree',
  'disagree',
  'open-point-discussion'
])


/* ==================================================
   PARTICIPANT DISPLAY DATA
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
   POSITION DATA
================================================== */

const position = computed(() =>
    props.characterState
        ?.position ??
    {}
)


const stance = computed(() =>
    position.value
        ?.stance ??
    null
)


const statement = computed(() =>
    position.value
        ?.statement ??
    ''
)


/* ==================================================
   SPOKEN DIALOGUE

   position.statement is deliberately neutral,
   structured debate data.

   statementHistory[].content is the actual dialogue
   generated in the character's personality.
================================================== */

const statementHistory = computed(() =>
    Array.isArray(
        props.characterState
            ?.statementHistory
    )
        ? props.characterState
            .statementHistory
        : []
)


const spokenStatement = computed(() => {

  const currentRoundStatements =
      statementHistory.value
          .filter(
              item =>
                  Number(
                      item?.roundNumber
                  ) ===
                  Number(
                      props.roundNumber
                  )
          )


  const currentRoundDialogue =
      currentRoundStatements
          .at(-1)
          ?.content


  if (
      typeof currentRoundDialogue ===
      'string' &&
      currentRoundDialogue.trim()
  ) {
    return currentRoundDialogue.trim()
  }


  const latestDialogue =
      statementHistory.value
          .at(-1)
          ?.content


  if (
      typeof latestDialogue ===
      'string' &&
      latestDialogue.trim()
  ) {
    return latestDialogue.trim()
  }


  return statement.value
})


const reasoning = computed(() =>
    position.value
        ?.reasoning ??
    ''
)


/* ==================================================
   SAFE MARKDOWN

   AI content can contain Markdown.

   Block Markdown is used for dialogue and reasoning.
   Inline Markdown is used for clickable risk/action
   points so the button content remains compact.

   All rendered HTML is sanitized before v-html.
================================================== */

const markdownOptions = {
  gfm: true,
  breaks: true
}


const sanitizeMarkdown =
    html =>
        DOMPurify.sanitize(
            html,

            {
              /*
                AI-generated links are not useful inside
                these clickable discussion surfaces.

                Removing anchors also prevents nested
                interactive controls inside the card.
              */

              FORBID_TAGS: [
                'a'
              ]
            }
        )


const renderMarkdown =
    value => {

      const source =
          String(
              value ??
              ''
          )


      if (
          !source.trim()
      ) {
        return ''
      }


      return sanitizeMarkdown(
          marked.parse(
              source,
              markdownOptions
          )
      )
    }


const renderInlineMarkdown =
    value => {

      const source =
          String(
              value ??
              ''
          )


      if (
          !source.trim()
      ) {
        return ''
      }


      return sanitizeMarkdown(
          marked.parseInline(
              source,

              {
                gfm: true
              }
          )
      )
    }


const renderedSpokenStatement = computed(() =>
    renderMarkdown(
        spokenStatement.value
    )
)


const renderedReasoning = computed(() =>
    renderMarkdown(
        reasoning.value
    )
)


const renderedPointMarkdown =
    point =>
        renderInlineMarkdown(
            pointText(
                point
            )
        )


/* ==================================================
   STATUS
================================================== */

const responseStatus = computed(() => {

  if (
      props.loading
  ) {
    return 'thinking'
  }


  if (
      props.characterState
      &&
      spokenStatement.value
  ) {
    return 'complete'
  }


  return 'waiting'
})


const statusLabel = computed(() => {

  switch (
      responseStatus.value
      ) {

    case 'thinking':
      return 'Thinking...'


    case 'complete':
      return `Round ${props.roundNumber}`


    default:
      return 'Waiting...'
  }
})


/* ==================================================
   LIST NORMALIZATION

   Backend structured fields may contain:

       "Simple string"

   or:

       {
           id,
           title,
           statement,
           text,
           description
       }

   This lets the component safely render either.
================================================== */

const normalizeList =
    value => {

      if (
          !Array.isArray(value)
      ) {
        return []
      }


      return value
          .filter(Boolean)
    }


const risks = computed(() =>
    normalizeList(
        props.characterState
            ?.risks
    )
)


const actions = computed(() =>
    normalizeList(
        props.characterState
            ?.actions
    )
)


/* ==================================================
   POINT TEXT
================================================== */

const pointText =
    point => {

      if (
          typeof point ===
          'string'
      ) {
        return point
      }


      return (
          point?.topic ??
          point?.statement ??
          point?.title ??
          point?.text ??
          point?.description ??
          ''
      )
    }


/* ==================================================
   POINT ID
================================================== */

const pointId = (
    point,
    type,
    index
) => {

  if (
      typeof point ===
      'object'
      &&
      point?.id
  ) {
    return String(
        point.id
    )
  }


  return (
      `${props.participant.id}-` +
      `${type}-` +
      `${props.roundNumber}-` +
      `${index}`
  )
}


/* ==================================================
   OPEN FOCUSED DISCUSSION

   DiscussionScene expects:

   {
       sourceType,
       sourceId,
       topic
   }
================================================== */

const openPoint = (
    point,
    sourceType,
    index
) => {

  if (
      props.disabled
      ||
      props.loading
  ) {
    return
  }


  const topic =
      pointText(
          point
      )


  if (!topic) {
    return
  }


  emit(
      'select'
  )


  emit(
      'open-point-discussion',

      {
        sourceType,

        sourceId:
            pointId(
                point,
                sourceType,
                index
            ),

        topic
      }
  )
}


/* ==================================================
   OPEN MAIN STATEMENT DISCUSSION
================================================== */

const openStatementDiscussion =
    () => {

      if (
          !spokenStatement.value
      ) {
        return
      }


      openPoint(
          {
            id:
                `${props.participant.id}-statement-round-${props.roundNumber}`,

            topic:
            spokenStatement.value
          },

          'statement',

          0
      )
    }


/* ==================================================
   REACTIONS
================================================== */

const handleAgree =
    () => {

      if (
          props.disabled
          ||
          props.loading
      ) {
        return
      }


      emit(
          'select'
      )


      emit(
          'agree'
      )
    }


const handleDisagree =
    () => {

      if (
          props.disabled
          ||
          props.loading
      ) {
        return
      }


      emit(
          'select'
      )


      emit(
          'disagree'
      )
    }


/* ==================================================
   SELECT CARD
================================================== */

const handleCardSelect =
    () => {

      emit(
          'select'
      )
    }
</script>


<template>
  <article
      class="member-response-card"
      :class="{
        loading,

        waiting:
            responseStatus === 'waiting',

        selectedAgree:
            reaction === 'agree',

        selectedDisagree:
            reaction === 'disagree'
      }"
      @click="handleCardSelect"
  >

    <!-- ==================================================
         OUTER DECORATION
    ================================================== -->

    <span class="corner cornerTopLeft"></span>

    <span class="corner cornerBottomRight"></span>


    <!-- ==================================================
         HEADER
    ================================================== -->

    <header class="card-header">

      <div class="identity">

        <span class="member-role">
          {{ participantRole }}
        </span>


        <strong class="member-name">
          {{ participantName }}
        </strong>

      </div>


      <button
          class="favorite-button"
          type="button"
          tabindex="-1"
          aria-hidden="true"
      >
        <Star :size="12" />
      </button>

    </header>


    <!-- ==================================================
         STATUS STRIP
    ================================================== -->

    <div class="status-strip">

      <span class="status-dot"></span>

      <span>
        {{ statusLabel }}
      </span>

    </div>


    <!-- ==================================================
         THINKING STATE
    ================================================== -->

    <div
        v-if="loading"
        class="thinking-state"
    >

      <div class="thinking-orbit">

        <span></span>

        <span></span>

        <span></span>

      </div>


      <p>
        {{ participantName }} is considering the issue.
      </p>

    </div>


    <!-- ==================================================
         RESPONSE CONTENT
    ================================================== -->

    <div
        v-else-if="spokenStatement"
        class="response-content"
    >

      <!-- ================================================
           STANCE
      ================================================= -->

      <span
          v-if="stance"
          class="stance-label"
      >
        {{ stance }}
      </span>


      <!-- ================================================
           MAIN STATEMENT
      ================================================= -->

      <div
          class="statement-button"
          :class="{
            disabled
          }"
          role="button"
          :tabindex="
            disabled
                ? -1
                : 0
          "
          :aria-disabled="
            disabled
          "
          @click.stop="
            openStatementDiscussion
          "
          @keydown.enter.stop.prevent="
            openStatementDiscussion
          "
          @keydown.space.stop.prevent="
            openStatementDiscussion
          "
      >
        <div
            class="
              statement-text
              markdown-content
              statement-markdown
            "
            v-html="
              renderedSpokenStatement
            "
        ></div>

        <MessageCircle
            class="discussion-icon"
            :size="13"
        />
      </div>


      <!-- ================================================
           REASONING
      ================================================= -->

      <div
          v-if="reasoning"
          class="
            reasoning-text
            markdown-content
            reasoning-markdown
          "
          v-html="
            renderedReasoning
          "
      ></div>


      <!-- ================================================
           RISKS

           Only first two are shown to prevent tiny cards
           becoming vertically overloaded.
      ================================================= -->

      <div
          v-if="risks.length"
          class="point-section"
      >

        <div class="point-heading">

          <AlertTriangle :size="11" />

          <span>
            Concerns
          </span>

        </div>


        <button
            v-for="(risk, index) in risks.slice(0, 2)"
            :key="
              pointId(
                risk,
                'risk',
                index
              )
            "
            class="discussion-point"
            type="button"
            :disabled="disabled"
            @click.stop="
              openPoint(
                risk,
                'risk',
                index
              )
            "
        >
          <span
              class="point-markdown"
              v-html="
                renderedPointMarkdown(
                    risk
                )
              "
          ></span>
        </button>

      </div>


      <!-- ================================================
           ACTIONS
      ================================================= -->

      <div
          v-if="actions.length"
          class="point-section action-section"
      >

        <div class="point-heading">

          <Target :size="11" />

          <span>
            Focus
          </span>

        </div>


        <button
            v-for="(action, index) in actions.slice(0, 1)"
            :key="
              pointId(
                action,
                'action',
                index
              )
            "
            class="discussion-point"
            type="button"
            :disabled="disabled"
            @click.stop="
              openPoint(
                action,
                'action',
                index
              )
            "
        >
          <span
              class="point-markdown"
              v-html="
                renderedPointMarkdown(
                    action
                )
              "
          ></span>
        </button>

      </div>

    </div>


    <!-- ==================================================
         WAITING STATE
    ================================================== -->

    <div
        v-else
        class="waiting-state"
    >
      <p>
        Waiting for response...
      </p>
    </div>


    <!-- ==================================================
         REACTIONS
    ================================================== -->

    <footer class="reaction-controls">

      <button
          class="
            reaction-button
            agree-button
          "
          :class="{
            active:
                reaction === 'agree'
          }"
          type="button"
          :disabled="
            disabled ||
            loading ||
            !spokenStatement
          "
          @click.stop="
            handleAgree
          "
      >

        <Check :size="13" />

        <span>
          Agree
        </span>

      </button>


      <button
          class="
            reaction-button
            disagree-button
          "
          :class="{
            active:
                reaction === 'disagree'
          }"
          type="button"
          :disabled="
            disabled ||
            loading ||
            !spokenStatement
          "
          @click.stop="
            handleDisagree
          "
      >

        <X :size="13" />

        <span>
          Disagree
        </span>

      </button>

    </footer>


    <!-- ==================================================
         BOTTOM VN POINTER
    ================================================== -->

    <span class="card-pointer"></span>

  </article>
</template>


<style scoped>
/* ==================================================
   ROOT CARD
================================================== */

.member-response-card {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  display: flex;

  flex-direction: column;

  padding:
      clamp(
          0.55rem,
          0.75vw,
          0.9rem
      );

  overflow: visible;

  border:
      1px solid
      rgba(150, 105, 255, 0.78);

  border-radius:
      0.35rem;

  background:
      linear-gradient(
          145deg,
          rgba(15, 11, 38, 0.96),
          rgba(5, 8, 25, 0.96)
      );

  box-shadow:
      0 0 0
      1px
      rgba(90, 170, 255, 0.08)
      inset,

      0 0
      1.2rem
      rgba(100, 56, 255, 0.22),

      0 0
      2.5rem
      rgba(40, 130, 255, 0.08);

  backdrop-filter:
      blur(14px);

  color:
      #f5f2ff;

  cursor: pointer;

  transition:
      border-color
      180ms
      ease,
      box-shadow
      180ms
      ease,
      transform
      180ms
      ease;
}


.member-response-card:hover {
  border-color:
      rgba(177, 139, 255, 0.96);

  box-shadow:
      0 0 0
      1px
      rgba(116, 196, 255, 0.12)
      inset,

      0 0
      1.5rem
      rgba(117, 65, 255, 0.32),

      0 0
      3rem
      rgba(40, 135, 255, 0.11);
}


/* ==================================================
   REACTION CARD STATES
================================================== */

.member-response-card.selectedAgree {
  border-color:
      rgba(113, 199, 255, 0.9);
}


.member-response-card.selectedDisagree {
  border-color:
      rgba(214, 107, 255, 0.92);
}


/* ==================================================
   CORNER DECORATION
================================================== */

.corner {
  position: absolute;

  width: 0.65rem;
  height: 0.65rem;

  pointer-events: none;
}


.cornerTopLeft {
  top: -0.18rem;
  left: -0.18rem;

  border-top:
      1px solid
      rgba(104, 210, 255, 0.8);

  border-left:
      1px solid
      rgba(104, 210, 255, 0.8);
}


.cornerBottomRight {
  right: -0.18rem;
  bottom: -0.18rem;

  border-right:
      1px solid
      rgba(195, 104, 255, 0.82);

  border-bottom:
      1px solid
      rgba(195, 104, 255, 0.82);
}


/* ==================================================
   HEADER
================================================== */

.card-header {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  gap: 0.4rem;

  padding-bottom: 0.35rem;

  border-bottom:
      1px solid
      rgba(142, 110, 255, 0.16);
}


.identity {
  min-width: 0;

  display: flex;

  flex-direction: column;

  align-items: flex-start;
}


.member-role {
  max-width: 100%;

  overflow: hidden;

  font-size:
      clamp(
          0.46rem,
          0.48vw,
          0.62rem
      );

  line-height: 1;

  letter-spacing:
      0.105em;

  text-transform: uppercase;

  white-space: nowrap;
  text-overflow: ellipsis;

  color:
      rgba(153, 146, 255, 0.88);
}


.member-name {
  margin-top: 0.18rem;

  max-width: 100%;

  overflow: hidden;

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.62rem,
          0.7vw,
          0.88rem
      );

  font-weight: 500;

  color:
      rgba(241, 238, 255, 0.94);

  white-space: nowrap;
  text-overflow: ellipsis;
}


/* ==================================================
   FAVORITE DECORATION
================================================== */

.favorite-button {
  width: 1.15rem;
  height: 1.15rem;

  flex: 0 0 auto;

  display: grid;

  place-items: center;

  padding: 0;

  border: 0;

  background: transparent;

  color:
      rgba(183, 148, 255, 0.72);

  pointer-events: none;
}


/* ==================================================
   STATUS STRIP
================================================== */

.status-strip {
  display: flex;

  align-items: center;

  gap: 0.3rem;

  margin-top: 0.35rem;

  font-size:
      clamp(
          0.42rem,
          0.42vw,
          0.55rem
      );

  letter-spacing:
      0.09em;

  text-transform: uppercase;

  color:
      rgba(157, 155, 205, 0.66);
}


.status-dot {
  width: 0.25rem;
  height: 0.25rem;

  border-radius: 50%;

  background:
      rgba(111, 178, 255, 0.9);

  box-shadow:
      0 0
      0.4rem
      rgba(111, 178, 255, 0.72);
}


.loading
.status-dot {
  animation:
      pulseDot
      900ms
      ease-in-out
      infinite alternate;
}


@keyframes pulseDot {
  from {
    opacity: 0.35;

    transform:
        scale(0.8);
  }

  to {
    opacity: 1;

    transform:
        scale(1.2);
  }
}


/* ==================================================
   RESPONSE CONTENT
================================================== */

.response-content {
  flex: 1;

  min-height: 0;

  display: flex;

  flex-direction: column;

  gap:
      clamp(
          0.3rem,
          0.5vh,
          0.55rem
      );

  padding:
      clamp(
          0.45rem,
          0.7vh,
          0.7rem
      )
      0;

  overflow-y: auto;

  scrollbar-width: thin;

  scrollbar-color:
      rgba(132, 91, 255, 0.35)
      transparent;
}


.response-content::-webkit-scrollbar {
  width: 3px;
}


.response-content::-webkit-scrollbar-thumb {
  background:
      rgba(132, 91, 255, 0.35);
}


/* ==================================================
   STANCE
================================================== */

.stance-label {
  align-self: flex-start;

  padding:
      0.18rem
      0.35rem;

  border:
      1px solid
      rgba(118, 181, 255, 0.2);

  background:
      rgba(67, 77, 160, 0.14);

  font-size:
      clamp(
          0.42rem,
          0.4vw,
          0.52rem
      );

  letter-spacing:
      0.08em;

  text-transform: uppercase;

  color:
      rgba(166, 200, 255, 0.86);
}


/* ==================================================
   STATEMENT
================================================== */

.statement-button {
  position: relative;

  width: 100%;

  display: flex;

  align-items: flex-start;

  gap: 0.35rem;

  padding: 0;

  border: 0;

  background: transparent;

  color: inherit;

  text-align: left;

  cursor: pointer;
}


.statement-button.disabled {
  opacity: 0.58;

  cursor: not-allowed;
}


.statement-button:focus-visible {
  outline:
      1px solid
      rgba(118, 181, 255, 0.72);

  outline-offset: 0.18rem;
}


.statement-text {
  flex: 1;

  font-size:
      clamp(
          0.58rem,
          0.63vw,
          0.79rem
      );

  line-height: 1.48;

  color:
      rgba(234, 232, 252, 0.9);
}


/* ==================================================
   MARKDOWN
================================================== */

.markdown-content {
  min-width: 0;
}


.markdown-content :deep(p) {
  margin:
      0
      0
      0.48rem;
}


.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}


.markdown-content :deep(strong) {
  color:
      rgba(255, 255, 255, 0.98);

  font-weight: 700;
}


.markdown-content :deep(em) {
  color:
      rgba(215, 188, 255, 0.96);
}


.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin:
      0.48rem
      0
      0.28rem;

  line-height: 1.22;

  color:
      rgba(240, 222, 255, 0.98);
}


.markdown-content :deep(h1) {
  font-size: 1.18em;
}


.markdown-content :deep(h2) {
  font-size: 1.1em;
}


.markdown-content :deep(h3) {
  font-size: 1.04em;
}


.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin:
      0.32rem
      0
      0.52rem;

  padding-left: 1.15rem;
}


.markdown-content :deep(li) {
  margin-bottom: 0.18rem;
}


.markdown-content :deep(blockquote) {
  margin:
      0.4rem
      0;

  padding:
      0.28rem
      0.48rem;

  border-left:
      2px solid
      rgba(166, 85, 255, 0.68);

  background:
      linear-gradient(
          90deg,
          rgba(126, 64, 255, 0.1),
          transparent
      );

  color:
      rgba(211, 200, 231, 0.94);
}


.markdown-content :deep(code),
.point-markdown :deep(code) {
  padding:
      0.06rem
      0.18rem;

  border:
      1px solid
      rgba(142, 80, 255, 0.22);

  border-radius: 0.15rem;

  background:
      rgba(14, 8, 36, 0.72);

  color:
      rgba(221, 198, 255, 0.98);

  font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;

  font-size: 0.88em;
}


.markdown-content :deep(pre) {
  max-width: 100%;

  overflow-x: auto;

  margin:
      0.45rem
      0;

  padding: 0.5rem;

  border:
      1px solid
      rgba(142, 80, 255, 0.27);

  background:
      rgba(3, 5, 17, 0.82);
}


.markdown-content :deep(pre code) {
  padding: 0;

  border: 0;

  background: transparent;
}


.markdown-content :deep(hr) {
  margin:
      0.5rem
      0;

  border: 0;

  border-top:
      1px solid
      rgba(138, 105, 235, 0.22);
}


.statement-markdown {
  flex: 1;
}


.reasoning-markdown {
  min-width: 0;
}


.point-markdown {
  display: inline;

  min-width: 0;
}


.point-markdown :deep(strong) {
  color:
      rgba(228, 221, 255, 0.96);

  font-weight: 700;
}


.point-markdown :deep(em) {
  color:
      rgba(214, 184, 255, 0.9);
}


.discussion-icon {
  flex: 0 0 auto;

  margin-top: 0.15rem;

  opacity: 0;

  color:
      rgba(132, 190, 255, 0.85);

  transition:
      opacity
      160ms
      ease;
}


.statement-button:hover
.discussion-icon {
  opacity: 1;
}


/* ==================================================
   REASONING
================================================== */

.reasoning-text {
  margin: 0;

  font-size:
      clamp(
          0.5rem,
          0.52vw,
          0.67rem
      );

  line-height: 1.45;

  color:
      rgba(182, 178, 212, 0.73);
}


/* ==================================================
   POINT SECTIONS
================================================== */

.point-section {
  display: flex;

  flex-direction: column;

  gap: 0.2rem;

  margin-top: 0.05rem;
}


.point-heading {
  display: flex;

  align-items: center;

  gap: 0.28rem;

  font-size:
      clamp(
          0.42rem,
          0.42vw,
          0.54rem
      );

  letter-spacing:
      0.07em;

  text-transform: uppercase;

  color:
      rgba(195, 153, 255, 0.82);
}


.action-section
.point-heading {
  color:
      rgba(116, 192, 255, 0.86);
}


.discussion-point {
  width: 100%;

  padding:
      0.23rem
      0;

  border: 0;

  border-bottom:
      1px solid
      rgba(138, 105, 235, 0.1);

  background: transparent;

  font-size:
      clamp(
          0.47rem,
          0.47vw,
          0.61rem
      );

  line-height: 1.4;

  text-align: left;

  color:
      rgba(196, 192, 224, 0.72);

  cursor: pointer;

  transition:
      color
      150ms
      ease,
      padding-left
      150ms
      ease;
}


.discussion-point:hover:not(:disabled) {
  padding-left: 0.2rem;

  color:
      rgba(228, 221, 255, 0.96);
}


/* ==================================================
   THINKING / WAITING
================================================== */

.thinking-state,
.waiting-state {
  flex: 1;

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 0.55rem;

  text-align: center;

  color:
      rgba(172, 167, 209, 0.62);
}


.thinking-state p,
.waiting-state p {
  margin: 0;

  font-size:
      clamp(
          0.5rem,
          0.52vw,
          0.68rem
      );
}


/* ==================================================
   THINKING DOTS
================================================== */

.thinking-orbit {
  display: flex;

  align-items: center;

  gap: 0.26rem;
}


.thinking-orbit span {
  width: 0.28rem;
  height: 0.28rem;

  border-radius: 50%;

  background:
      rgba(145, 102, 255, 0.9);

  box-shadow:
      0 0
      0.5rem
      rgba(145, 102, 255, 0.66);

  animation:
      thinkingPulse
      900ms
      ease-in-out
      infinite;
}


.thinking-orbit span:nth-child(2) {
  animation-delay: 150ms;
}


.thinking-orbit span:nth-child(3) {
  animation-delay: 300ms;
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


/* ==================================================
   REACTION CONTROLS
================================================== */

.reaction-controls {
  display: grid;

  grid-template-columns:
      repeat(
          2,
          minmax(0, 1fr)
      );

  gap:
      clamp(
          0.25rem,
          0.35vw,
          0.45rem
      );

  margin-top: auto;

  padding-top: 0.4rem;

  border-top:
      1px solid
      rgba(136, 102, 235, 0.13);
}


.reaction-button {
  min-width: 0;

  height:
      clamp(
          1.55rem,
          2.2vw,
          2.1rem
      );

  display: flex;

  align-items: center;
  justify-content: center;

  gap: 0.25rem;

  padding:
      0
      0.3rem;

  border:
      1px solid
      rgba(133, 109, 239, 0.46);

  border-radius:
      0.22rem;

  background:
      rgba(15, 12, 39, 0.68);

  font-size:
      clamp(
          0.45rem,
          0.47vw,
          0.6rem
      );

  color:
      rgba(216, 211, 243, 0.79);

  cursor: pointer;

  transition:
      background
      160ms
      ease,
      border-color
      160ms
      ease,
      color
      160ms
      ease,
      box-shadow
      160ms
      ease;
}


.reaction-button:disabled {
  opacity: 0.34;

  cursor: not-allowed;
}


/* ==================================================
   AGREE
================================================== */

.agree-button:hover:not(:disabled),
.agree-button.active {
  border-color:
      rgba(93, 181, 255, 0.82);

  background:
      rgba(57, 111, 193, 0.18);

  color:
      rgba(174, 221, 255, 1);

  box-shadow:
      0 0
      0.75rem
      rgba(64, 154, 255, 0.14);
}


/* ==================================================
   DISAGREE
================================================== */

.disagree-button:hover:not(:disabled),
.disagree-button.active {
  border-color:
      rgba(207, 104, 255, 0.86);

  background:
      rgba(150, 52, 207, 0.17);

  color:
      rgba(238, 192, 255, 1);

  box-shadow:
      0 0
      0.75rem
      rgba(186, 70, 255, 0.14);
}


/* ==================================================
   CARD POINTER
================================================== */

.card-pointer {
  position: absolute;

  left: 50%;
  bottom: -0.47rem;

  width: 0.75rem;
  height: 0.75rem;

  background:
      rgba(7, 8, 27, 0.98);

  border-right:
      1px solid
      rgba(150, 105, 255, 0.78);

  border-bottom:
      1px solid
      rgba(150, 105, 255, 0.78);

  transform:
      translateX(-50%)
      rotate(45deg);

  pointer-events: none;
}


/* ==================================================
   SMALL SCREEN
================================================== */

@media (max-width: 1100px) {

  .member-response-card {
    padding: 0.45rem;
  }


  .point-section {
    display: none;
  }


  .reasoning-text {
    display: -webkit-box;

    overflow: hidden;

    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (
prefers-reduced-motion:
    reduce
) {

  .thinking-orbit span,
  .status-dot {
    animation: none;
  }


  .member-response-card,
  .reaction-button,
  .discussion-point {
    transition-duration: 100ms;
  }
}
</style>
