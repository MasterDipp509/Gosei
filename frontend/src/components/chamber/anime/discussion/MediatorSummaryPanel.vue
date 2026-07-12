<script setup>
import {
  computed
} from 'vue'

import {
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  HelpCircle,
  MessageCircle,
  Scale,
  Sparkles
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

  participant: {
    type: Object,
    default: null
  },

  mediatorState: {
    type: Object,
    default: null
  },

  loading: {
    type: Boolean,
    default: false
  },

  roundNumber: {
    type: Number,
    default: 1
  },

  status: {
    type: String,
    default: 'ready'
  }
})


/* ==================================================
   IDENTITY
================================================== */

const mediatorName = computed(() =>
    props.participant
        ?.name ??
    'Mediator'
)


const mediatorRole = computed(() =>
    props.participant
        ?.role ??
    'Discussion Mediator'
)


const mediatorImage = computed(() => {

  const id =
      props.participant
          ?.id


  if (!id) {
    return ''
  }


  return (
      `/images/chamber/char/` +
      `${id}/` +
      `mediator/NeonOffice.png`
  )
})


/* ==================================================
   NORMALIZATION
================================================== */

const normalizeList =
    value => (
        Array.isArray(value)
            ? value.filter(Boolean)
            : []
    )


const itemText =
    item => {

      if (
          typeof item ===
          'string'
      ) {
        return item
      }


      return (
          item?.statement ??
          item?.question ??
          item?.title ??
          item?.text ??
          item?.description ??
          item?.content ??
          ''
      )
    }


/* ==================================================
   SAFE MARKDOWN

   Dialogue and structured analysis can both contain
   Markdown. Everything is sanitized before v-html.
================================================== */

const markdownOptions = {
  gfm: true,
  breaks: true
}


const renderMarkdown =
    value => {

      const source =
          String(
              value ??
              ''
          )


      if (!source.trim()) {
        return ''
      }


      return DOMPurify.sanitize(
          marked.parse(
              source,
              markdownOptions
          )
      )
    }


const renderItemMarkdown =
    item =>
        renderMarkdown(
            itemText(item)
        )


/* ==================================================
   ACTUAL SPOKEN DIALOGUE

   mediatorState.summary is deliberately structured.
   mediatorState.statements[].content is what the
   mediator actually said in-character.
================================================== */

const statements = computed(() =>
    normalizeList(
        props.mediatorState
            ?.statements
    )
)


const structuredSummary = computed(() =>
    props.mediatorState
        ?.summary ??
    ''
)


const spokenDialogue = computed(() => {

  const currentRoundStatements =
      statements.value
          .filter(
              statement =>
                  Number(
                      statement?.roundNumber
                  ) ===
                  Number(
                      props.roundNumber
                  )
          )


  const currentRoundLine =
      currentRoundStatements
          .at(-1)
          ?.content


  if (
      typeof currentRoundLine ===
      'string' &&
      currentRoundLine.trim()
  ) {
    return currentRoundLine.trim()
  }


  const latestLine =
      statements.value
          .at(-1)
          ?.content


  if (
      typeof latestLine ===
      'string' &&
      latestLine.trim()
  ) {
    return latestLine.trim()
  }


  return structuredSummary.value
})


const renderedDialogue = computed(() =>
    renderMarkdown(
        spokenDialogue.value
    )
)


const renderedStructuredSummary = computed(() =>
    renderMarkdown(
        structuredSummary.value
    )
)


const showStructuredSummary = computed(() => {

  const summary =
      structuredSummary.value
          ?.trim()


  const dialogue =
      spokenDialogue.value
          ?.trim()


  return Boolean(
      summary &&
      summary !== dialogue
  )
})


/* ==================================================
   STRUCTURED ANALYSIS
================================================== */

const consensus = computed(() =>
    normalizeList(
        props.mediatorState
            ?.consensus
    )
)


const disagreements = computed(() =>
    normalizeList(
        props.mediatorState
            ?.disagreements
    )
)


const unresolvedPoints = computed(() =>
    normalizeList(
        props.mediatorState
            ?.unresolvedPoints
    )
)


const questionsForUser = computed(() =>
    normalizeList(
        props.mediatorState
            ?.questionsForUser
    )
)


const analysisSections = computed(() => [

  {
    key:
        'consensus',

    title:
        'Consensus',

    eyebrow:
        'What survived the room',

    icon:
    CheckCircle2,

    tone:
        'consensus',

    items:
    consensus.value
  },

  {
    key:
        'tension',

    title:
        'Points of Tension',

    eyebrow:
        'Where the council splits',

    icon:
    Scale,

    tone:
        'tension',

    items:
    disagreements.value
  },

  {
    key:
        'unresolved',

    title:
        'Still Unresolved',

    eyebrow:
        'What blocks a clean conclusion',

    icon:
    CircleAlert,

    tone:
        'unresolved',

    items:
    unresolvedPoints.value
  },

  {
    key:
        'questions',

    title:
        'Your Input Needed',

    eyebrow:
        'Questions only you can answer',

    icon:
    HelpCircle,

    tone:
        'questions',

    items:
    questionsForUser.value
  }
].filter(
    section =>
        section.items.length > 0
))


const hasContent = computed(() =>
    Boolean(
        spokenDialogue.value ||
        showStructuredSummary.value ||
        analysisSections.value.length
    )
)


/* ==================================================
   STATUS
================================================== */

const statusLabel = computed(() => {

  if (
      props.loading
  ) {
    return 'Synthesizing'
  }


  switch (
      props.status
      ) {

    case 'active':
      return `Round ${props.roundNumber}`

    case 'paused':
      return 'Paused'

    case 'completed':
      return 'Complete'

    case 'abandoned':
      return 'Ended'

    default:
      return 'Standing By'
  }
})
</script>


<template>
  <aside
      class="mediator-panel"
      :class="{
        loading,

        paused:
            status === 'paused',

        complete:
            status === 'completed' ||
            status === 'abandoned'
      }"
  >

    <span class="frame-corner top-left"></span>
    <span class="frame-corner top-right"></span>
    <span class="frame-corner bottom-left"></span>
    <span class="frame-corner bottom-right"></span>


    <!-- ==================================================
         MINI VISUAL-NOVEL SCENE
    ================================================== -->

    <section class="vn-scene">

      <span class="scene-frame scene-frame-outer"></span>
      <span class="scene-frame scene-frame-inner"></span>


      <div
          class="scene-circuit circuit-left"
          aria-hidden="true"
      >
        <i></i>
        <i></i>
      </div>


      <div
          class="scene-circuit circuit-right"
          aria-hidden="true"
      >
        <i></i>
        <i></i>
        <i></i>
      </div>

      <img
          v-if="mediatorImage"
          class="vn-background"
          :src="mediatorImage"
          :alt="mediatorName"
      >


      <div
          v-else
          class="vn-fallback"
      >
        <BrainCircuit :size="34" />
      </div>


      <div class="vn-vignette"></div>


      <header class="vn-topbar">

        <div class="mediator-label">

          <span class="live-dot"></span>

          <span>
            Mediator speaking
          </span>

        </div>


        <span class="round-chip">
          {{ statusLabel }}
        </span>

      </header>


      <div
          v-if="loading"
          class="vn-loading"
      >

        <div class="thinking-ring">

          <BrainCircuit :size="23" />

          <span></span>

        </div>


        <p>
          {{ mediatorName }} is reading the room...
        </p>

      </div>


      <div
          v-else-if="spokenDialogue"
          class="dialogue-wrap"
      >

        <div class="speaker-nameplate">

          <span>
            {{ mediatorName }}
          </span>

          <small>
            {{ mediatorRole }}
          </small>

        </div>


        <div class="dialogue-box">

          <MessageCircle
              class="dialogue-icon"
              :size="14"
          />

          <div
              class="dialogue-markdown"
              v-html="renderedDialogue"
          ></div>

          <span class="continue-mark"></span>

        </div>

      </div>


      <div
          v-else
          class="scene-standby"
      >

        <Sparkles :size="20" />

        <span>
          Waiting for the council
        </span>

      </div>

    </section>


    <!-- ==================================================
         ANALYSIS BELOW THE SPOKEN DIALOGUE
    ================================================== -->

    <div
        v-if="!loading && hasContent"
        class="analysis-scroll"
    >

      <section
          v-if="showStructuredSummary"
          class="overview-card"
      >

        <div class="overview-heading">

          <Sparkles :size="12" />

          <div>
            <span>Round Read</span>
            <small>Structured mediator analysis</small>
          </div>

        </div>


        <div
            class="overview-markdown"
            v-html="renderedStructuredSummary"
        ></div>

      </section>


      <section
          v-for="section in analysisSections"
          :key="section.key"
          class="analysis-section"
          :class="`tone-${section.tone}`"
      >

        <header class="analysis-heading">

          <span class="analysis-icon">
            <component
                :is="section.icon"
                :size="13"
            />
          </span>


          <div>

            <strong>
              {{ section.title }}
            </strong>

            <small>
              {{ section.eyebrow }}
            </small>

          </div>


          <span class="item-count">
            {{ section.items.length }}
          </span>

        </header>


        <div class="analysis-list">

          <div
              v-for="(item, index) in section.items"
              :key="`${section.key}-${index}`"
              class="analysis-item"
          >

            <span
                v-if="section.key !== 'questions'"
                class="item-diamond"
            ></span>


            <span
                v-else
                class="question-number"
            >
              {{ index + 1 }}
            </span>


            <div
                class="item-markdown"
                v-html="renderItemMarkdown(item)"
            ></div>

          </div>

        </div>

      </section>

    </div>


    <div
        v-else-if="!loading"
        class="empty-analysis"
    >

      <BrainCircuit :size="22" />

      <div>

        <strong>
          The room is still forming its view
        </strong>

        <p>
          The mediator's spoken synthesis and analysis will appear here.
        </p>

      </div>

    </div>


    <footer class="panel-footer">

      <span>
        GOSEI // MEDIATOR CHANNEL
      </span>

      <span>
        R{{ roundNumber.toString().padStart(2, '0') }}
      </span>

    </footer>

  </aside>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.mediator-panel {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-rows:
      minmax(11rem, 42%)
      minmax(0, 1fr)
      1.55rem;

  overflow: hidden;

  border:
      1px solid
      rgba(126, 89, 255, 0.72);

  border-radius: 0.42rem;

  background:
      linear-gradient(
          160deg,
          rgba(10, 9, 31, 0.98),
          rgba(4, 7, 22, 0.99)
      );

  box-shadow:
      inset
      0 0
      0
      1px
      rgba(89, 171, 255, 0.06),

      0 0
      1.4rem
      rgba(92, 48, 255, 0.2);

  color:
      rgba(239, 237, 255, 0.95);
}


.mediator-panel::before {
  content: '';

  position: absolute;

  inset: 0;

  z-index: 0;

  pointer-events: none;

  background:
      linear-gradient(
          115deg,
          transparent,
          rgba(121, 75, 255, 0.035),
          transparent
      );
}


/* ==================================================
   FRAME
================================================== */

.frame-corner {
  position: absolute;

  z-index: 20;

  width: 0.72rem;
  height: 0.72rem;

  pointer-events: none;
}


.top-left {
  top: 0.17rem;
  left: 0.17rem;

  border-top: 1px solid rgba(95, 204, 255, 0.8);
  border-left: 1px solid rgba(95, 204, 255, 0.8);
}


.top-right {
  top: 0.17rem;
  right: 0.17rem;

  border-top: 1px solid rgba(190, 99, 255, 0.82);
  border-right: 1px solid rgba(190, 99, 255, 0.82);
}


.bottom-left {
  bottom: 0.17rem;
  left: 0.17rem;

  border-bottom: 1px solid rgba(190, 99, 255, 0.68);
  border-left: 1px solid rgba(190, 99, 255, 0.68);
}


.bottom-right {
  right: 0.17rem;
  bottom: 0.17rem;

  border-right: 1px solid rgba(95, 204, 255, 0.7);
  border-bottom: 1px solid rgba(95, 204, 255, 0.7);
}


/* ==================================================
   MINI VN SCENE
================================================== */

.vn-scene {
  position: relative;

  z-index: 1;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  border-bottom:
      1px solid
      rgba(130, 93, 255, 0.3);

  background:
      radial-gradient(
          circle at 50% 25%,
          rgba(67, 78, 164, 0.28),
          rgba(6, 7, 23, 0.98) 72%
      );

  clip-path:
      polygon(
          0 0.8rem,
          0.8rem 0,
          calc(100% - 0.75rem) 0,
          100% 0.75rem,
          100% 100%,
          0 100%
      );
}


.scene-frame {
  position: absolute;

  z-index: 2;

  pointer-events: none;
}


.scene-frame-outer {
  inset: 0.42rem;

  border:
      1px solid
      rgba(139, 93, 255, 0.3);

  clip-path:
      polygon(
          0 0.58rem,
          0.58rem 0,
          calc(100% - 0.55rem) 0,
          100% 0.55rem,
          100% calc(100% - 0.55rem),
          calc(100% - 0.55rem) 100%,
          0.55rem 100%,
          0 calc(100% - 0.55rem)
      );
}


.scene-frame-inner {
  inset:
      0.72rem
      0.78rem;

  border-top:
      1px solid
      rgba(112, 167, 255, 0.16);

  border-bottom:
      1px solid
      rgba(179, 91, 255, 0.16);
}


.scene-circuit {
  position: absolute;

  z-index: 3;

  pointer-events: none;

  opacity: 0.7;
}


.scene-circuit i {
  position: absolute;

  width: 3px;
  height: 3px;

  border-radius: 50%;

  background:
      rgba(153, 111, 255, 0.9);

  box-shadow:
      0 0
      0.35rem
      rgba(153, 111, 255, 0.7);
}


.circuit-left {
  left: 1rem;
  bottom: 0.65rem;

  width: 31%;
  height: 1.2rem;

  border-left:
      1px solid
      rgba(103, 189, 255, 0.3);

  border-bottom:
      1px solid
      rgba(103, 189, 255, 0.3);
}


.circuit-left i:first-child {
  left: -2px;
  top: 20%;
}


.circuit-left i:last-child {
  right: 18%;
  bottom: -2px;
}


.circuit-right {
  top: 0.72rem;
  right: 1rem;

  width: 38%;
  height: 1rem;

  border-top:
      1px solid
      rgba(183, 94, 255, 0.34);

  border-right:
      1px solid
      rgba(183, 94, 255, 0.22);
}


.circuit-right i:nth-child(1) {
  top: -2px;
  left: 18%;
}


.circuit-right i:nth-child(2) {
  top: -2px;
  left: 57%;
}


.circuit-right i:nth-child(3) {
  right: -2px;
  bottom: 0;
}


.vn-background {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  object-fit: cover;
  object-position: center 20%;

  filter:
      saturate(0.88)
      brightness(0.76)
      contrast(1.06);

  transform: scale(1.02);
}


.vn-fallback {
  position: absolute;

  inset: 0;

  display: grid;

  place-items: center;

  color:
      rgba(148, 158, 255, 0.5);
}


.vn-vignette {
  position: absolute;

  inset: 0;

  background:
      linear-gradient(
          to bottom,
          rgba(4, 5, 19, 0.12),
          rgba(4, 5, 19, 0.08) 35%,
          rgba(4, 5, 19, 0.92) 100%
      ),

      linear-gradient(
          90deg,
          rgba(4, 5, 19, 0.42),
          transparent 45%,
          rgba(4, 5, 19, 0.2)
      );
}


.vn-topbar {
  position: absolute;

  top: 0;
  left: 0;
  right: 0;

  z-index: 3;

  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 0.45rem;

  padding:
      0.48rem
      0.58rem;

  background:
      linear-gradient(
          to bottom,
          rgba(4, 5, 20, 0.76),
          transparent
      );
}


.mediator-label,
.round-chip {
  display: inline-flex;

  align-items: center;

  gap: 0.28rem;

  font-size:
      clamp(
          0.4rem,
          0.42vw,
          0.54rem
      );

  letter-spacing: 0.09em;

  text-transform: uppercase;
}


.mediator-label {
  color:
      rgba(181, 198, 255, 0.84);
}


.round-chip {
  padding:
      0.22rem
      0.35rem;

  border:
      1px solid
      rgba(121, 154, 255, 0.22);

  background:
      rgba(10, 13, 43, 0.66);

  color:
      rgba(170, 195, 255, 0.8);
}


.live-dot {
  width: 0.28rem;
  height: 0.28rem;

  border-radius: 50%;

  background:
      rgba(93, 201, 255, 0.96);

  box-shadow:
      0 0
      0.5rem
      rgba(93, 201, 255, 0.8);
}


/* ==================================================
   DIALOGUE BOX
================================================== */

.dialogue-wrap {
  position: absolute;

  left: 0.52rem;
  right: 0.52rem;
  bottom: 0.52rem;

  z-index: 4;
}


.speaker-nameplate {
  position: relative;

  z-index: 2;

  width: fit-content;
  max-width: calc(100% - 0.8rem);

  display: flex;

  align-items: baseline;

  gap: 0.45rem;

  margin-left: 0.45rem;
  margin-bottom: -1px;

  padding:
      0.28rem
      0.6rem;

  border:
      1px solid
      rgba(166, 102, 255, 0.68);

  background:
      linear-gradient(
          90deg,
          rgba(54, 25, 113, 0.98),
          rgba(22, 20, 65, 0.97)
      );

  box-shadow:
      0 0
      0.8rem
      rgba(112, 58, 255, 0.2);

  clip-path:
      polygon(
          0.48rem 0,
          100% 0,
          calc(100% - 0.4rem) 100%,
          0 100%,
          0 0.48rem
      );
}


.speaker-nameplate::after {
  content: '';

  width: 0.42rem;
  height: 0.42rem;

  flex: 0 0 auto;

  border:
      1px solid
      rgba(190, 124, 255, 0.78);

  transform: rotate(45deg);

  box-shadow:
      0 0
      0.45rem
      rgba(143, 83, 255, 0.38);
}


.speaker-nameplate span {
  overflow: hidden;

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.62rem,
          0.66vw,
          0.84rem
      );

  white-space: nowrap;
  text-overflow: ellipsis;

  color:
      rgba(248, 241, 255, 0.98);
}


.speaker-nameplate small {
  overflow: hidden;

  font-size:
      clamp(
          0.39rem,
          0.39vw,
          0.5rem
      );

  letter-spacing: 0.08em;

  text-transform: uppercase;

  white-space: nowrap;
  text-overflow: ellipsis;

  color:
      rgba(185, 157, 255, 0.75);
}


.dialogue-box {
  position: relative;

  max-height:
      clamp(
          5rem,
          14vh,
          8.6rem
      );

  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr);

  align-items: flex-start;

  gap: 0.42rem;

  overflow-y: auto;

  padding:
      0.68rem
      0.7rem
      0.62rem;

  border:
      1px solid
      rgba(143, 112, 255, 0.54);

  background:
      linear-gradient(
          135deg,
          rgba(8, 8, 29, 0.96),
          rgba(17, 13, 49, 0.94)
      );

  box-shadow:
      inset
      0 0
      0
      1px
      rgba(105, 178, 255, 0.05),

      0 0
      1.2rem
      rgba(58, 29, 138, 0.34);

  scrollbar-width: thin;
  scrollbar-color: rgba(143, 102, 255, 0.34) transparent;
}


.dialogue-markdown {
  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.57rem,
          0.58vw,
          0.75rem
      );

  line-height: 1.55;

  color:
      rgba(237, 232, 250, 0.94);
}


.dialogue-markdown :deep(p) {
  margin:
      0
      0
      0.58rem;
}


.dialogue-markdown :deep(p:last-child) {
  margin-bottom: 0;
}


.dialogue-markdown :deep(strong) {
  color:
      rgba(255, 255, 255, 0.99);

  font-weight: 700;
}


.dialogue-markdown :deep(em) {
  color:
      rgba(220, 190, 255, 0.98);
}


.dialogue-markdown :deep(h1),
.dialogue-markdown :deep(h2),
.dialogue-markdown :deep(h3) {
  margin:
      0.6rem
      0
      0.3rem;

  color:
      rgba(240, 219, 255, 0.98);

  line-height: 1.2;
}


.dialogue-markdown :deep(h1) {
  font-size: 1.25em;
}


.dialogue-markdown :deep(h2) {
  font-size: 1.16em;
}


.dialogue-markdown :deep(h3) {
  font-size: 1.08em;
}


.dialogue-markdown :deep(ul),
.dialogue-markdown :deep(ol) {
  margin:
      0.38rem
      0
      0.62rem;

  padding-left: 1.2rem;
}


.dialogue-markdown :deep(li) {
  margin-bottom: 0.2rem;
}


.dialogue-markdown :deep(blockquote) {
  margin:
      0.48rem
      0;

  padding:
      0.35rem
      0.58rem;

  border-left:
      2px solid
      rgba(173, 91, 255, 0.72);

  background:
      linear-gradient(
          90deg,
          rgba(126, 64, 255, 0.1),
          transparent
      );
}


.dialogue-markdown :deep(code),
.overview-markdown :deep(code),
.item-markdown :deep(code) {
  padding:
      0.08rem
      0.22rem;

  border:
      1px solid
      rgba(142, 80, 255, 0.24);

  border-radius: 0.16rem;

  background:
      rgba(14, 8, 36, 0.76);

  color:
      rgba(222, 199, 255, 0.98);

  font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;

  font-size: 0.88em;
}


.dialogue-markdown :deep(pre) {
  overflow-x: auto;

  margin:
      0.55rem
      0;

  padding: 0.55rem;

  border:
      1px solid
      rgba(142, 80, 255, 0.28);

  background:
      rgba(3, 5, 17, 0.84);
}


.dialogue-markdown :deep(pre code) {
  padding: 0;

  border: 0;

  background: transparent;
}


.dialogue-markdown :deep(a),
.overview-markdown :deep(a),
.item-markdown :deep(a) {
  color:
      rgba(111, 203, 255, 0.96);

  text-decoration-color:
      rgba(111, 203, 255, 0.45);
}


.dialogue-icon {
  margin-top: 0.18rem;

  color:
      rgba(150, 129, 255, 0.88);
}


.continue-mark {
  position: absolute;

  right: 0.55rem;
  bottom: 0.35rem;

  width: 0.38rem;
  height: 0.38rem;

  border-right:
      1px solid
      rgba(170, 137, 255, 0.75);

  border-bottom:
      1px solid
      rgba(170, 137, 255, 0.75);

  transform: rotate(45deg);

  animation:
      continuePulse
      1.2s
      ease-in-out
      infinite;
}


@keyframes continuePulse {

  0%,
  100% {
    opacity: 0.25;
    transform: translateY(-0.1rem) rotate(45deg);
  }

  50% {
    opacity: 1;
    transform: translateY(0.08rem) rotate(45deg);
  }
}


/* ==================================================
   SCENE LOADING / STANDBY
================================================== */

.vn-loading,
.scene-standby {
  position: absolute;

  inset: 0;

  z-index: 4;

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 0.5rem;

  padding: 1rem;

  text-align: center;

  background:
      rgba(4, 5, 19, 0.52);

  color:
      rgba(177, 184, 230, 0.76);
}


.vn-loading p,
.scene-standby span {
  margin: 0;

  font-size:
      clamp(
          0.5rem,
          0.52vw,
          0.68rem
      );
}


.thinking-ring {
  position: relative;

  width: 3.2rem;
  height: 3.2rem;

  display: grid;

  place-items: center;

  color:
      rgba(158, 148, 255, 0.9);
}


.thinking-ring span {
  position: absolute;

  inset: 0;

  border:
      1px solid
      rgba(113, 145, 255, 0.38);

  border-radius: 50%;

  border-top-color:
      rgba(175, 107, 255, 0.92);

  animation:
      spin
      1.6s
      linear
      infinite;
}


@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


/* ==================================================
   ANALYSIS SCROLL
================================================== */

.analysis-scroll {
  position: relative;

  z-index: 2;

  min-width: 0;
  min-height: 0;

  overflow-y: auto;

  padding:
      clamp(
          0.55rem,
          0.7vw,
          0.82rem
      );

  scrollbar-width: thin;
  scrollbar-color: rgba(135, 94, 255, 0.35) transparent;
}


.analysis-scroll::-webkit-scrollbar,
.dialogue-box::-webkit-scrollbar {
  width: 3px;
}


.analysis-scroll::-webkit-scrollbar-thumb,
.dialogue-box::-webkit-scrollbar-thumb {
  background:
      rgba(135, 94, 255, 0.38);
}


/* ==================================================
   OVERVIEW
================================================== */

.overview-card {
  margin-bottom: 0.58rem;

  padding: 0.58rem;

  border:
      1px solid
      rgba(122, 111, 255, 0.2);

  background:
      linear-gradient(
          135deg,
          rgba(83, 61, 178, 0.12),
          rgba(30, 57, 112, 0.07)
      );
}


.overview-heading {
  display: flex;

  align-items: center;

  gap: 0.38rem;

  margin-bottom: 0.38rem;

  color:
      rgba(173, 150, 255, 0.92);
}


.overview-heading div {
  min-width: 0;

  display: flex;

  flex-direction: column;
}


.overview-heading span {
  font-size:
      clamp(
          0.46rem,
          0.46vw,
          0.58rem
      );

  font-weight: 600;

  letter-spacing: 0.08em;

  text-transform: uppercase;
}


.overview-heading small {
  margin-top: 0.08rem;

  font-size:
      clamp(
          0.38rem,
          0.37vw,
          0.47rem
      );

  color:
      rgba(155, 153, 191, 0.55);
}


.overview-markdown {
  margin: 0;

  font-size:
      clamp(
          0.5rem,
          0.51vw,
          0.66rem
      );

  line-height: 1.5;

  color:
      rgba(209, 205, 230, 0.8);
}


.overview-markdown :deep(p) {
  margin:
      0
      0
      0.42rem;
}


.overview-markdown :deep(p:last-child) {
  margin-bottom: 0;
}


.overview-markdown :deep(ul),
.overview-markdown :deep(ol) {
  margin:
      0.35rem
      0;

  padding-left: 1.05rem;
}


.overview-markdown :deep(strong) {
  color:
      rgba(239, 232, 255, 0.96);
}


/* ==================================================
   ANALYSIS SECTIONS
================================================== */

.analysis-section {
  --tone: 155, 116, 255;

  padding:
      0.58rem
      0;

  border-top:
      1px solid
      rgba(var(--tone), 0.14);
}


.analysis-section:first-of-type {
  border-top: 0;
}


.tone-consensus {
  --tone: 85, 191, 255;
}


.tone-tension {
  --tone: 203, 119, 255;
}


.tone-unresolved {
  --tone: 232, 151, 255;
}


.tone-questions {
  --tone: 105, 177, 255;
}


.analysis-heading {
  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr)
      auto;

  align-items: center;

  gap: 0.42rem;

  margin-bottom: 0.44rem;
}


.analysis-icon {
  width: 1.55rem;
  height: 1.55rem;

  display: grid;

  place-items: center;

  border:
      1px solid
      rgba(var(--tone), 0.26);

  background:
      rgba(var(--tone), 0.08);

  color:
      rgba(var(--tone), 0.92);
}


.analysis-heading > div {
  min-width: 0;

  display: flex;

  flex-direction: column;
}


.analysis-heading strong {
  font-size:
      clamp(
          0.48rem,
          0.48vw,
          0.61rem
      );

  font-weight: 600;

  letter-spacing: 0.07em;

  text-transform: uppercase;

  color:
      rgba(var(--tone), 0.94);
}


.analysis-heading small {
  margin-top: 0.08rem;

  overflow: hidden;

  font-size:
      clamp(
          0.37rem,
          0.37vw,
          0.47rem
      );

  white-space: nowrap;
  text-overflow: ellipsis;

  color:
      rgba(163, 160, 194, 0.54);
}


.item-count {
  min-width: 1.3rem;

  padding:
      0.16rem
      0.26rem;

  border:
      1px solid
      rgba(var(--tone), 0.2);

  background:
      rgba(var(--tone), 0.06);

  font-size:
      clamp(
          0.39rem,
          0.38vw,
          0.48rem
      );

  text-align: center;

  color:
      rgba(var(--tone), 0.8);
}


.analysis-list {
  display: flex;

  flex-direction: column;

  gap: 0.26rem;
}


.analysis-item {
  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr);

  align-items: flex-start;

  gap: 0.42rem;

  padding:
      0.32rem
      0.38rem;

  border-left:
      1px solid
      rgba(var(--tone), 0.28);

  background:
      linear-gradient(
          90deg,
          rgba(var(--tone), 0.07),
          transparent
      );
}


.item-markdown {
  margin: 0;

  font-size:
      clamp(
          0.48rem,
          0.49vw,
          0.63rem
      );

  line-height: 1.45;

  color:
      rgba(200, 196, 222, 0.8);
}


.item-markdown :deep(p) {
  margin:
      0
      0
      0.3rem;
}


.item-markdown :deep(p:last-child) {
  margin-bottom: 0;
}


.item-markdown :deep(ul),
.item-markdown :deep(ol) {
  margin:
      0.28rem
      0;

  padding-left: 1rem;
}


.item-markdown :deep(strong) {
  color:
      rgba(235, 226, 250, 0.94);
}


.item-diamond {
  width: 0.26rem;
  height: 0.26rem;

  margin-top: 0.31rem;

  transform: rotate(45deg);

  background:
      rgba(var(--tone), 0.9);

  box-shadow:
      0 0
      0.35rem
      rgba(var(--tone), 0.45);
}


.question-number {
  min-width: 1rem;

  font-size:
      clamp(
          0.44rem,
          0.43vw,
          0.54rem
      );

  font-weight: 600;

  color:
      rgba(var(--tone), 0.92);
}


/* ==================================================
   EMPTY ANALYSIS
================================================== */

.empty-analysis {
  position: relative;

  z-index: 2;

  min-height: 0;

  display: flex;

  align-items: center;
  justify-content: center;

  gap: 0.65rem;

  padding: 1rem;

  text-align: left;

  color:
      rgba(134, 151, 215, 0.62);
}


.empty-analysis div {
  min-width: 0;
}


.empty-analysis strong {
  display: block;

  font-size:
      clamp(
          0.54rem,
          0.56vw,
          0.72rem
      );

  font-weight: 500;

  color:
      rgba(211, 208, 237, 0.78);
}


.empty-analysis p {
  margin:
      0.2rem
      0
      0;

  font-size:
      clamp(
          0.44rem,
          0.44vw,
          0.57rem
      );

  line-height: 1.45;

  color:
      rgba(168, 165, 197, 0.55);
}


/* ==================================================
   FOOTER / STATES
================================================== */

.panel-footer {
  position: relative;

  z-index: 3;

  display: flex;

  align-items: center;
  justify-content: space-between;

  padding:
      0
      0.62rem;

  border-top:
      1px solid
      rgba(125, 98, 255, 0.14);

  background:
      rgba(5, 6, 21, 0.92);

  font-size:
      clamp(
          0.36rem,
          0.35vw,
          0.46rem
      );

  letter-spacing: 0.11em;

  color:
      rgba(113, 131, 190, 0.58);
}


.mediator-panel.paused {
  filter: saturate(0.72);
}


.mediator-panel.complete {
  border-color:
      rgba(99, 176, 255, 0.65);
}


.mediator-panel.loading
.live-dot {
  animation:
      livePulse
      0.8s
      ease-in-out
      infinite alternate;
}


@keyframes livePulse {
  from {
    opacity: 0.25;
  }

  to {
    opacity: 1;
  }
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 1100px) {

  .mediator-panel {
    grid-template-rows:
        minmax(9.5rem, 40%)
        minmax(0, 1fr)
        1.45rem;
  }


  .analysis-heading small,
  .speaker-nameplate small {
    display: none;
  }


  .dialogue-box {
    max-height: 6rem;
  }
}


@media (max-height: 720px) {

  .mediator-panel {
    grid-template-rows:
        minmax(8.5rem, 38%)
        minmax(0, 1fr)
        1.35rem;
  }


  .dialogue-wrap {
    left: 0.4rem;
    right: 0.4rem;
    bottom: 0.4rem;
  }


  .dialogue-box {
    max-height: 5.4rem;

    padding:
        0.55rem
        0.6rem;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (
prefers-reduced-motion:
    reduce
) {

  .continue-mark,
  .thinking-ring span,
  .live-dot {
    animation: none;
  }
}
</style>
