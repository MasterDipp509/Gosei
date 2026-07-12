<script setup>
import {
  computed
} from 'vue'


/* ==================================================
   PROPS
================================================== */

const props = defineProps({
  verdict: {
    type: String,
    default: ''
  },

  reason: {
    type: String,
    default: ''
  },

  status: {
    type: String,
    default: ''
  },

  primary: {
    type: String,
    default: '#a579ff'
  },

  secondary: {
    type: String,
    default: '#51dcff'
  }
})


/* ==================================================
   STYLE VARIABLES
================================================== */

const panelStyle = computed(() => ({
  '--primary': props.primary,
  '--secondary': props.secondary
}))


/* ==================================================
   STATUS
================================================== */

const normalizedStatus = computed(() => {
  return String(
      props.status ?? ''
  )
      .trim()
      .toLowerCase()
})


const isComplete = computed(() => {
  return normalizedStatus.value === 'completed'
})


/* ==================================================
   CONTENT STATE
================================================== */

const hasVerdict = computed(() => {
  return Boolean(
      props.verdict?.trim()
  )
})


const hasReason = computed(() => {
  return Boolean(
      props.reason?.trim()
  )
})


const showVerdict = computed(() => {
  return (
      isComplete.value
      && hasVerdict.value
  )
})


const completedWithoutVerdict = computed(() => {
  return (
      isComplete.value
      && !hasVerdict.value
  )
})


/* ==================================================
   EMPTY STATE COPY
================================================== */

const emptyTitle = computed(() => {
  switch (normalizedStatus.value) {
    case 'ready':
      return 'AWAITING DELIBERATION'

    case 'active':
      return 'VERDICT FORMING'

    case 'paused':
      return 'DELIBERATION PAUSED'

    case 'abandoned':
      return 'NO FINAL VERDICT'

    default:
      return 'VERDICT UNAVAILABLE'
  }
})


const emptyDescription = computed(() => {
  switch (normalizedStatus.value) {
    case 'ready':
      return (
          'The council has not begun its deliberation. '
          + 'A final recommendation will appear once the discussion is completed.'
      )

    case 'active':
      return (
          'The council is still evaluating the proposal. '
          + 'The final recommendation remains sealed until deliberation concludes.'
      )

    case 'paused':
      return (
          'The discussion is currently paused. '
          + 'Resume and complete the session to generate a final recommendation.'
      )

    case 'abandoned':
      return (
          'This discussion was closed before a final recommendation could be established.'
      )

    default:
      return (
          'Complete the discussion to unlock the council’s final recommendation.'
      )
  }
})
</script>


<template>
  <section
      class="verdict-panel"
      :style="panelStyle"
  >
    <!-- ==================================================
         BACKGROUND EFFECTS
    =================================================== -->

    <div class="panel-grid" />

    <div class="panel-noise" />

    <span class="corner corner-top-left" />

    <span class="corner corner-top-right" />

    <span class="corner corner-bottom-left" />

    <span class="corner corner-bottom-right" />


    <!-- ==================================================
         HEADER
    =================================================== -->

    <header class="panel-header">
      <div class="header-symbol">
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
          <path
              d="
              M12 2
              L15 9
              L22 12
              L15 15
              L12 22
              L9 15
              L2 12
              L9 9
              Z
            "
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
          />

          <circle
              cx="12"
              cy="12"
              r="2.4"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
          />
        </svg>
      </div>


      <span class="header-title">
        FINAL VERDICT
      </span>


      <span
          class="header-state"
          :class="{
          unlocked: showVerdict
        }"
      >
        {{
          showVerdict
              ? 'RESOLVED'
              : 'SEALED'
        }}
      </span>
    </header>


    <!-- ==================================================
         COMPLETE VERDICT
    =================================================== -->

    <div
        v-if="showVerdict"
        class="verdict-content"
    >
      <!-- ================================================
           SCROLLING COPY AREA
      ================================================= -->

      <div class="verdict-copy">
        <div class="copy-inner">
          <div class="recommendation-block">
            <span class="section-label">
              RECOMMENDATION
            </span>

            <p class="recommendation">
              {{ verdict }}
            </p>
          </div>


          <div
              v-if="hasReason"
              class="reason-block"
          >
            <span class="section-label">
              WHY
            </span>

            <p class="reason">
              {{ reason }}
            </p>
          </div>
        </div>
      </div>


      <!-- ================================================
           VERDICT COMPASS
      ================================================= -->

      <div class="verdict-compass">
        <span class="compass-glow" />

        <svg
            class="compass-svg"
            viewBox="0 0 240 240"
            aria-hidden="true"
        >
          <!-- outer rings -->

          <circle
              cx="120"
              cy="120"
              r="91"
              class="ring ring-outer"
          />

          <circle
              cx="120"
              cy="120"
              r="71"
              class="ring ring-middle"
          />

          <circle
              cx="120"
              cy="120"
              r="45"
              class="ring ring-inner"
          />


          <!-- axes -->

          <path
              d="
              M120 8
              V232

              M8 120
              H232
            "
              class="axis"
          />

          <path
              d="
              M41 41
              L199 199

              M199 41
              L41 199
            "
              class="axis axis-diagonal"
          />


          <!-- minor radial ticks -->

          <g class="minor-lines">
            <path d="M120 20 V47" />
            <path d="M120 193 V220" />

            <path d="M20 120 H47" />
            <path d="M193 120 H220" />

            <path d="M49 49 L68 68" />
            <path d="M172 172 L191 191" />

            <path d="M191 49 L172 68" />
            <path d="M68 172 L49 191" />
          </g>


          <!-- compass star -->

          <path
              d="
              M120 29

              L135 93

              L211 120

              L139 137

              L120 211

              L101 139

              L29 120

              L101 101

              Z
            "
              class="compass-star"
          />


          <path
              d="
              M120 56

              L128 106

              L184 120

              L130 130

              L120 184

              L110 130

              L56 120

              L112 108

              Z
            "
              class="compass-inner-star"
          />


          <!-- center -->

          <circle
              cx="120"
              cy="120"
              r="9"
              class="center-ring"
          />

          <circle
              cx="120"
              cy="120"
              r="3"
              class="center-core"
          />
        </svg>


        <span class="compass-node node-top" />

        <span class="compass-node node-right" />

        <span class="compass-node node-bottom" />

        <span class="compass-node node-left" />
      </div>
    </div>


    <!-- ==================================================
         ACTIVE / INCOMPLETE EMPTY STATE
    =================================================== -->

    <div
        v-else-if="!isComplete"
        class="empty-state-viewport"
    >
      <div class="empty-state">
        <div class="empty-seal">
          <span class="seal-ring seal-ring-outer" />

          <span class="seal-ring seal-ring-inner" />

          <span class="seal-lock">
            <svg
                viewBox="0 0 32 32"
                aria-hidden="true"
            >
              <path
                  d="
                  M9 14
                  V10

                  C9 6.2 11.8 4 16 4

                  C20.2 4 23 6.2 23 10

                  V14
                "
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
              />

              <rect
                  x="6"
                  y="14"
                  width="20"
                  height="14"
                  rx="1"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
              />

              <circle
                  cx="16"
                  cy="20"
                  r="2"
                  fill="currentColor"
              />

              <path
                  d="M16 22 V25"
                  stroke="currentColor"
                  stroke-width="1.5"
              />
            </svg>
          </span>
        </div>


        <div class="empty-copy">
          <span class="empty-kicker">
            DELIBERATION STATUS
          </span>

          <h3 class="empty-title">
            {{ emptyTitle }}
          </h3>

          <p class="empty-description">
            {{ emptyDescription }}
          </p>


          <div class="status-trace">
            <span class="trace-node active" />

            <span class="trace-line active" />

            <span
                class="trace-node"
                :class="{
                active:
                  normalizedStatus === 'active'
              }"
            />

            <span class="trace-line" />

            <span class="trace-node" />
          </div>


          <span class="status-caption">
            DISCUSSION
            <span>/</span>
            DELIBERATION
            <span>/</span>
            VERDICT
          </span>
        </div>
      </div>
    </div>


    <!-- ==================================================
         COMPLETED, BUT REPORT HAS NO VERDICT
    =================================================== -->

    <div
        v-else-if="completedWithoutVerdict"
        class="empty-state-viewport"
    >
      <div class="empty-state report-missing">
        <div class="empty-seal">
          <span class="seal-ring seal-ring-outer" />

          <span class="seal-ring seal-ring-inner" />

          <span class="missing-symbol">
            !
          </span>
        </div>


        <div class="empty-copy">
          <span class="empty-kicker">
            REPORT STATUS
          </span>

          <h3 class="empty-title">
            ANALYSIS UNAVAILABLE
          </h3>

          <p class="empty-description">
            The discussion is complete, but its final verdict
            has not yet been generated.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>


<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}


/* ==================================================
   ROOT

   Important:
   - size stays dictated by parent
   - content cannot increase parent row height
   - all overflow is managed internally
================================================== */

.verdict-panel {
  --panel-background:
      rgba(
          4,
          5,
          17,
          0.92
      );

  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  max-width: 100%;
  max-height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-rows:
    auto
    minmax(0, 1fr);

  color:
      rgba(
          239,
          241,
          255,
          0.94
      );

  background:
      linear-gradient(
          145deg,
          rgba(8, 6, 23, 0.96),
          rgba(3, 6, 17, 0.9)
      );

  isolation: isolate;

  contain:
      layout
      paint;
}


/* ==================================================
   DIRECT CHILD SIZE PROTECTION
================================================== */

.verdict-panel > * {
  min-width: 0;
  min-height: 0;
}


/* ==================================================
   GRID BACKGROUND
================================================== */

.panel-grid {
  position: absolute;

  z-index: -2;

  inset: 0;

  opacity: 0.17;

  pointer-events: none;

  background-image:
      linear-gradient(
          rgba(
              113,
              82,
              201,
              0.08
          )
          1px,
          transparent
          1px
      ),
      linear-gradient(
          90deg,
          rgba(
              74,
              151,
              220,
              0.06
          )
          1px,
          transparent
          1px
      );

  background-size:
      1.5rem
      1.5rem;
}


/* ==================================================
   NOISE / HAZE
================================================== */

.panel-noise {
  position: absolute;

  z-index: -1;

  inset: 0;

  pointer-events: none;

  background:
      radial-gradient(
          circle at 82% 52%,
          color-mix(
              in srgb,
              var(--primary) 10%,
              transparent
          ),
          transparent 35%
      ),
      radial-gradient(
          circle at 12% 15%,
          color-mix(
              in srgb,
              var(--secondary) 4%,
              transparent
          ),
          transparent 25%
      );
}


/* ==================================================
   CORNERS
================================================== */

.corner {
  position: absolute;

  z-index: 10;

  width: 0.65rem;
  height: 0.65rem;

  pointer-events: none;
}


.corner-top-left {
  top: 0;
  left: 0;

  border-top:
      1px solid
      var(--primary);

  border-left:
      1px solid
      var(--primary);
}


.corner-top-right {
  top: 0;
  right: 0;

  border-top:
      1px solid
      var(--secondary);

  border-right:
      1px solid
      var(--secondary);
}


.corner-bottom-left {
  bottom: 0;
  left: 0;

  border-bottom:
      1px solid
      var(--secondary);

  border-left:
      1px solid
      var(--secondary);
}


.corner-bottom-right {
  bottom: 0;
  right: 0;

  border-bottom:
      1px solid
      var(--primary);

  border-right:
      1px solid
      var(--primary);
}


/* ==================================================
   HEADER

   Remains fixed.
   Only content beneath it scrolls.
================================================== */

.panel-header {
  position: relative;
  z-index: 5;

  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap:
      clamp(
          0.4rem,
          0.7vw,
          0.7rem
      );

  padding:
      clamp(
          0.55rem,
          0.8vw,
          0.78rem
      )
      clamp(
          0.7rem,
          1vw,
          1rem
      );

  border-bottom:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 20%,
          transparent
      );

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--primary) 7%,
              rgba(5, 5, 17, 0.94)
          ),
          rgba(5, 5, 17, 0.72)
      );
}


.panel-header::after {
  content: '';

  position: absolute;

  left: 0;
  bottom: -1px;

  width: 38%;
  height: 1px;

  background:
      linear-gradient(
          90deg,
          var(--primary),
          transparent
      );

  box-shadow:
      0
      0
      0.45rem
      color-mix(
          in srgb,
          var(--primary) 50%,
          transparent
      );
}


/* ==================================================
   HEADER SYMBOL
================================================== */

.header-symbol {
  width:
      clamp(
          0.9rem,
          1.2vw,
          1.15rem
      );

  aspect-ratio: 1;

  color:
      var(--primary);

  filter:
      drop-shadow(
          0
          0
          0.3rem
          color-mix(
              in srgb,
              var(--primary) 50%,
              transparent
          )
      );
}


.header-symbol svg {
  display: block;

  width: 100%;
  height: 100%;
}


/* ==================================================
   HEADER TITLE
================================================== */

.header-title {
  min-width: 0;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  color:
      var(--primary);

  font-family:
      monospace;

  font-size:
      clamp(
          0.44rem,
          0.56vw,
          0.6rem
      );

  font-weight: 600;

  letter-spacing: 0.11em;
}


/* ==================================================
   HEADER STATE
================================================== */

.header-state {
  color:
      rgba(
          186,
          198,
          224,
          0.3
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.31rem,
          0.39vw,
          0.4rem
      );

  letter-spacing: 0.1em;

  white-space: nowrap;
}


.header-state.unlocked {
  color:
      var(--secondary);

  text-shadow:
      0
      0
      0.4rem
      color-mix(
          in srgb,
          var(--secondary) 60%,
          transparent
      );
}


/* ==================================================
   COMPLETE CONTENT

   This must NEVER size the surrounding grid row.
================================================== */

.verdict-content {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  max-width: 100%;
  max-height: 100%;

  display: grid;

  grid-template-columns:
    minmax(0, 1.1fr)
    minmax(
      clamp(
          7rem,
          30%,
          11rem
      ),
      0.7fr
    );

  overflow: hidden;
}


/* ==================================================
   VERDICT COPY SCROLL VIEWPORT
================================================== */

.verdict-copy {
  position: relative;
  z-index: 2;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  max-width: 100%;
  max-height: 100%;

  overflow-x: hidden;
  overflow-y: auto;

  overscroll-behavior: contain;

  scrollbar-width: thin;

  scrollbar-color:
      color-mix(
          in srgb,
          var(--primary) 45%,
          transparent
      )
      rgba(255, 255, 255, 0.025);
}


/* ==================================================
   SCROLLBAR
================================================== */

.verdict-copy::-webkit-scrollbar,
.empty-state-viewport::-webkit-scrollbar {
  width: 0.28rem;
}


.verdict-copy::-webkit-scrollbar-track,
.empty-state-viewport::-webkit-scrollbar-track {
  background:
      rgba(
          255,
          255,
          255,
          0.02
      );
}


.verdict-copy::-webkit-scrollbar-thumb,
.empty-state-viewport::-webkit-scrollbar-thumb {
  border-radius: 999px;

  background:
      linear-gradient(
          180deg,
          color-mix(
              in srgb,
              var(--primary) 55%,
              transparent
          ),
          color-mix(
              in srgb,
              var(--secondary) 35%,
              transparent
          )
      );
}


/* ==================================================
   COPY INNER LAYOUT

   min-height 100% keeps short content centered.
   Long content naturally becomes scrollable.
================================================== */

.copy-inner {
  width: 100%;

  min-width: 0;
  min-height: 100%;

  display: flex;
  flex-direction: column;

  justify-content: center;

  gap:
      clamp(
          0.7rem,
          1.4vh,
          1.1rem
      );

  padding:
      clamp(
          0.7rem,
          1.2vw,
          1.2rem
      );

  padding-right:
      clamp(
          0.9rem,
          1.5vw,
          1.4rem
      );
}


/* ==================================================
   COPY BLOCKS
================================================== */

.recommendation-block,
.reason-block {
  min-width: 0;

  flex: 0 0 auto;
}


/* ==================================================
   LABELS
================================================== */

.section-label {
  display: block;

  margin-bottom:
      clamp(
          0.22rem,
          0.4vw,
          0.38rem
      );

  color:
      rgba(
          154,
          173,
          211,
          0.48
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.32rem,
          0.42vw,
          0.45rem
      );

  letter-spacing: 0.1em;
}


/* ==================================================
   RECOMMENDATION
================================================== */

.recommendation {
  margin: 0;

  width: 100%;
  max-width: 38rem;

  overflow-wrap: anywhere;

  color:
      rgba(
          245,
          245,
          255,
          0.94
      );

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.78rem,
          1.15vw,
          1.15rem
      );

  line-height: 1.35;

  letter-spacing: 0.005em;
}


/* ==================================================
   REASON

   No line clamp.
   Full text remains available through internal scroll.
================================================== */

.reason {
  margin: 0;

  width: 100%;
  max-width: 35rem;

  overflow-wrap: anywhere;

  color:
      rgba(
          209,
          217,
          239,
          0.58
      );

  font-size:
      clamp(
          0.48rem,
          0.64vw,
          0.68rem
      );

  line-height: 1.55;
}


/* ==================================================
   COMPASS
================================================== */

.verdict-compass {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  max-width: 100%;
  max-height: 100%;

  display: grid;
  place-items: center;

  overflow: hidden;

  pointer-events: none;

  contain:
      layout
      paint;
}


.compass-glow {
  position: absolute;

  width: 72%;
  max-height: 90%;

  aspect-ratio: 1;

  border-radius: 50%;

  background:
      radial-gradient(
          circle,
          color-mix(
              in srgb,
              var(--primary) 15%,
              transparent
          ),
          transparent 64%
      );

  filter:
      blur(0.5rem);
}


.compass-svg {
  width:
      min(
          94%,
          13rem
      );

  height: auto;

  max-width: 94%;
  max-height: 94%;

  aspect-ratio: 1;

  overflow: visible;

  color:
      var(--primary);

  filter:
      drop-shadow(
          0
          0
          0.45rem
          color-mix(
              in srgb,
              var(--primary) 28%,
              transparent
          )
      );
}


/* ==================================================
   COMPASS SVG ELEMENTS
================================================== */

.ring {
  fill: none;

  stroke:
      currentColor;

  stroke-width: 0.7;
}


.ring-outer {
  opacity: 0.16;

  stroke-dasharray:
      2 5;
}


.ring-middle {
  opacity: 0.24;
}


.ring-inner {
  opacity: 0.18;

  stroke-dasharray:
      5 5;
}


.axis {
  fill: none;

  stroke:
      currentColor;

  stroke-width: 0.6;

  opacity: 0.2;
}


.axis-diagonal {
  opacity: 0.11;
}


.minor-lines {
  fill: none;

  stroke:
      currentColor;

  stroke-width: 0.8;

  opacity: 0.28;
}


.compass-star {
  fill:
      color-mix(
          in srgb,
          var(--primary) 7%,
          transparent
      );

  stroke:
      currentColor;

  stroke-width: 1.1;

  opacity: 0.78;
}


.compass-inner-star {
  fill:
      color-mix(
          in srgb,
          var(--primary) 10%,
          transparent
      );

  stroke:
      var(--secondary);

  stroke-width: 0.85;

  opacity: 0.78;
}


.center-ring {
  fill:
      rgba(
          4,
          5,
          17,
          0.95
      );

  stroke:
      var(--secondary);

  stroke-width: 1;

  opacity: 0.9;
}


.center-core {
  fill:
      var(--primary);

  filter:
      drop-shadow(
          0
          0
          0.3rem
          var(--primary)
      );
}


/* ==================================================
   COMPASS NODES
================================================== */

.compass-node {
  position: absolute;

  width: 0.25rem;
  aspect-ratio: 1;

  background:
      var(--secondary);

  transform:
      rotate(45deg);

  opacity: 0.45;

  box-shadow:
      0
      0
      0.4rem
      var(--secondary);
}


.node-top {
  top: 10%;
  left: 50%;
}


.node-right {
  right: 8%;
  top: 50%;
}


.node-bottom {
  bottom: 10%;
  left: 50%;
}


.node-left {
  left: 8%;
  top: 50%;
}


/* ==================================================
   EMPTY STATE SCROLL VIEWPORT
================================================== */

.empty-state-viewport {
  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  max-width: 100%;
  max-height: 100%;

  overflow-x: hidden;
  overflow-y: auto;

  overscroll-behavior: contain;

  scrollbar-width: thin;

  scrollbar-color:
      color-mix(
          in srgb,
          var(--primary) 45%,
          transparent
      )
      rgba(255, 255, 255, 0.025);
}


/* ==================================================
   EMPTY STATE
================================================== */

.empty-state {
  width: 100%;

  min-width: 0;
  min-height: 100%;

  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr);

  align-items: center;

  gap:
      clamp(
          0.9rem,
          2vw,
          2rem
      );

  padding:
      clamp(
          1rem,
          2vw,
          2rem
      );
}


/* ==================================================
   EMPTY SEAL
================================================== */

.empty-seal {
  position: relative;

  width:
      clamp(
          4.2rem,
          7vw,
          7rem
      );

  max-width: 100%;

  aspect-ratio: 1;

  display: grid;
  place-items: center;

  flex-shrink: 0;
}


.seal-ring {
  position: absolute;

  border-radius: 50%;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 30%,
          transparent
      );
}


.seal-ring-outer {
  inset: 0;

  border-style: dashed;

  animation:
      sealed-orbit
      18s
      linear
      infinite;
}


.seal-ring-inner {
  inset: 17%;

  opacity: 0.55;
}


.seal-lock {
  width: 36%;
  aspect-ratio: 1;

  color:
      var(--primary);

  opacity: 0.6;

  filter:
      drop-shadow(
          0
          0
          0.45rem
          color-mix(
              in srgb,
              var(--primary) 40%,
              transparent
          )
      );
}


.seal-lock svg {
  width: 100%;
  height: 100%;
}


/* ==================================================
   EMPTY COPY
================================================== */

.empty-copy {
  min-width: 0;

  max-width: 28rem;

  display: flex;
  flex-direction: column;

  align-items: flex-start;
}


.empty-kicker {
  margin-bottom: 0.25rem;

  color:
      var(--secondary);

  font-family:
      monospace;

  font-size:
      clamp(
          0.32rem,
          0.42vw,
          0.44rem
      );

  letter-spacing: 0.13em;

  opacity: 0.6;
}


.empty-title {
  margin:
      0
      0
      0.45rem;

  color:
      rgba(
          232,
          234,
          249,
          0.82
      );

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-weight: 400;

  font-size:
      clamp(
          0.78rem,
          1.1vw,
          1.1rem
      );

  letter-spacing: 0.03em;

  overflow-wrap: anywhere;
}


.empty-description {
  margin: 0;

  color:
      rgba(
          203,
          211,
          233,
          0.46
      );

  font-size:
      clamp(
          0.46rem,
          0.62vw,
          0.65rem
      );

  line-height: 1.55;

  overflow-wrap: anywhere;
}


/* ==================================================
   STATUS TRACE
================================================== */

.status-trace {
  width:
      min(
          100%,
          18rem
      );

  display: grid;

  grid-template-columns:
    auto
    1fr
    auto
    1fr
    auto;

  align-items: center;

  margin-top: 0.85rem;
}


.trace-node {
  width: 0.42rem;
  aspect-ratio: 1;

  border:
      1px solid
      rgba(
          165,
          121,
          255,
          0.28
      );

  transform:
      rotate(45deg);
}


.trace-node.active {
  border-color:
      var(--primary);

  background:
      var(--primary);

  box-shadow:
      0
      0
      0.4rem
      var(--primary);
}


.trace-line {
  height: 1px;

  background:
      rgba(
          165,
          121,
          255,
          0.13
      );
}


.trace-line.active {
  background:
      linear-gradient(
          90deg,
          var(--primary),
          color-mix(
              in srgb,
              var(--primary) 18%,
              transparent
          )
      );
}


.status-caption {
  margin-top: 0.35rem;

  color:
      rgba(
          161,
          177,
          210,
          0.3
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.29rem,
          0.35vw,
          0.36rem
      );

  letter-spacing: 0.08em;
}


.status-caption span {
  margin:
      0
      0.2rem;

  color:
      var(--primary);

  opacity: 0.4;
}


/* ==================================================
   COMPLETED BUT REPORT MISSING
================================================== */

.report-missing
.empty-seal {
  opacity: 0.76;
}


.missing-symbol {
  color:
      var(--primary);

  font-family:
      Georgia,
      serif;

  font-size:
      clamp(
          1rem,
          2vw,
          1.8rem
      );

  text-shadow:
      0
      0
      0.5rem
      var(--primary);
}


/* ==================================================
   ANIMATIONS
================================================== */

@keyframes sealed-orbit {
  from {
    transform:
        rotate(0deg);
  }

  to {
    transform:
        rotate(360deg);
  }
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 800px) {
  .verdict-content {
    grid-template-columns:
      minmax(0, 1fr)
      minmax(6rem, 28%);
  }


  .copy-inner {
    padding:
        0.75rem;
  }


  .empty-state {
    grid-template-columns:
      auto
      minmax(0, 1fr);
  }
}


@media (max-width: 560px) {
  .verdict-content {
    grid-template-columns:
      minmax(0, 1fr);
  }


  .verdict-compass {
    position: absolute;

    right: -2rem;
    top: 50%;

    width: 45%;
    height: 90%;

    opacity: 0.25;

    transform:
        translateY(-50%);
  }


  .copy-inner {
    padding-right:
        clamp(
            2.5rem,
            18vw,
            5rem
        );
  }


  .empty-state {
    grid-template-columns:
      minmax(0, 1fr);

    justify-items: center;

    text-align: center;
  }


  .empty-copy {
    align-items: center;
  }
}


/* ==================================================
   VERY SHORT CONTAINERS

   Keeps this usable when the report grid gives the
   panel a particularly shallow row.
================================================== */

@media (max-height: 700px) {
  .panel-header {
    padding:
        0.45rem
        0.7rem;
  }


  .copy-inner {
    justify-content: flex-start;

    gap: 0.65rem;

    padding:
        0.65rem
        0.8rem;
  }


  .recommendation {
    font-size:
        clamp(
            0.72rem,
            1vw,
            1rem
        );
  }


  .empty-state {
    align-items: start;

    padding:
        0.75rem;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {
  .seal-ring-outer {
    animation: none;
  }
}
</style>