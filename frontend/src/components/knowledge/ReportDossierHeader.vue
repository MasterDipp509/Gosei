<script setup>
import {
  computed
} from 'vue'


/* ==================================================
   PROPS
================================================== */

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },

  roundCount: {
    type: Number,
    default: 0
  },

  sectionCount: {
    type: Number,
    default: 0
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
   HELPERS
================================================== */

function firstValue(...values) {
  for (const value of values) {
    if (
        value !== null
        && value !== undefined
        && value !== ''
    ) {
      return value
    }
  }

  return null
}


function firstText(...values) {
  for (const value of values) {
    if (typeof value !== 'string') {
      continue
    }

    const cleaned = value.trim()

    if (cleaned) {
      return cleaned
    }
  }

  return ''
}


function numberOrNull(value) {
  if (
      value === null
      || value === undefined
      || value === ''
  ) {
    return null
  }

  const numeric = Number(value)

  return Number.isFinite(numeric)
      ? numeric
      : null
}


/* ==================================================
   STATUS NORMALIZATION
================================================== */

function normalizeStatus(value) {
  const raw = String(
      value ?? ''
  )
      .trim()
      .toLowerCase()

  switch (raw) {
    case 'complete':
    case 'completed':
    case 'finished':
    case 'ended':
      return 'completed'

    case 'active':
    case 'running':
    case 'in_progress':
    case 'in progress':
    case 'current':
      return 'active'

    case 'paused':
    case 'on_hold':
    case 'on hold':
      return 'paused'

    case 'abandoned':
    case 'cancelled':
    case 'canceled':
    case 'closed':
      return 'abandoned'

    case 'ready':
    case 'pending':
    case 'draft':
    case 'created':
    default:
      return 'ready'
  }
}


/* ==================================================
   STATUS
================================================== */

const status = computed(() => {
  return normalizeStatus(
      props.data?.status
  )
})


const statusLabel = computed(() => {
  return status.value.toUpperCase()
})


const isCompleted = computed(() => {
  return status.value === 'completed'
})


const isActive = computed(() => {
  return status.value === 'active'
})


const statusDescription = computed(() => {
  switch (status.value) {
    case 'completed':
      return 'Deliberation concluded and archived'

    case 'active':
      return 'Council deliberation currently in progress'

    case 'paused':
      return 'Session preserved and awaiting continuation'

    case 'abandoned':
      return 'Discussion closed without final resolution'

    case 'ready':
    default:
      return 'Council session prepared for deliberation'
  }
})


const statusEyebrow = computed(() => {
  switch (status.value) {
    case 'completed':
      return 'ARCHIVED OUTCOME'

    case 'active':
      return 'LIVE SESSION'

    case 'paused':
      return 'SESSION HOLD'

    case 'abandoned':
      return 'CLOSED SESSION'

    case 'ready':
    default:
      return 'SESSION READY'
  }
})


/* ==================================================
   STATUS COLOR
================================================== */

const statusColor = computed(() => {
  switch (status.value) {
    case 'completed':
      return '#59f5b5'

    case 'active':
      return '#51dcff'

    case 'paused':
      return '#ffc86b'

    case 'abandoned':
      return '#ff667d'

    case 'ready':
    default:
      return '#c18aff'
  }
})


/* ==================================================
   ROOT STYLE
================================================== */

const headerStyle = computed(() => ({
  '--primary': props.primary,
  '--secondary': props.secondary,
  '--status-color': statusColor.value
}))


/* ==================================================
   DOSSIER NUMBER
================================================== */

const reportNumber = computed(() => {
  const id = firstValue(
      props.data?.index,
      props.data?.number,
      props.data?.id
  )

  if (id === null) {
    return '#---'
  }

  const numeric = numberOrNull(id)

  if (numeric !== null) {
    return `#${String(numeric).padStart(3, '0')}`
  }

  const text = String(id)

  if (text.startsWith('#')) {
    return text
  }

  const compact = text
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase()

  return compact
      ? `#${compact}`
      : '#---'
})


/* ==================================================
   PRIMARY CONTENT
================================================== */

const title = computed(() => {
  return (
      firstText(
          props.data?.title,
          props.data?.topic
      )
      || 'Untitled Discussion'
  )
})


const objective = computed(() => {
  return firstText(
      props.data?.objective,
      props.data?.subtitle
  )
})


const context = computed(() => {
  return firstText(
      props.data?.context
  )
})


const secondaryCopy = computed(() => {
  return (
      context.value
      || objective.value
      || 'No additional discussion context was recorded.'
  )
})


/* ==================================================
   MODE
================================================== */

const mode = computed(() => {
  return (
      firstText(
          props.data?.mode
      ).toUpperCase()
      || 'PANEL'
  )
})


/* ==================================================
   COUNTS
================================================== */

const resolvedRoundCount = computed(() => {
  const propValue = numberOrNull(
      props.roundCount
  )

  const dataValue = numberOrNull(
      props.data?.roundCount
      ?? props.data?.round_count
      ?? props.data?.rounds?.length
  )

  return Math.max(
      0,
      Math.round(
          propValue && propValue > 0
              ? propValue
              : dataValue ?? 0
      )
  )
})


const resolvedSectionCount = computed(() => {
  const propValue = numberOrNull(
      props.sectionCount
  )

  const dataValue = numberOrNull(
      props.data?.sectionCount
      ?? props.data?.section_count
      ?? props.data?.sections?.length
  )

  return Math.max(
      0,
      Math.round(
          propValue && propValue > 0
              ? propValue
              : dataValue ?? 0
      )
  )
})


/* ==================================================
   DATE FORMATTING
================================================== */

function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (
      Number.isNaN(
          date.getTime()
      )
  ) {
    return '—'
  }

  return new Intl.DateTimeFormat(
      undefined,
      {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
  ).format(date)
}


/* ==================================================
   CREATED
================================================== */

const createdAt = computed(() => {
  return formatDate(
      props.data?.createdAt
      ?? props.data?.created_at
  )
})


/* ==================================================
   LIFECYCLE DATE
================================================== */

const lifecycleLabel = computed(() => {
  if (isCompleted.value) {
    return 'COMPLETED'
  }

  switch (status.value) {
    case 'abandoned':
      return 'CLOSED'

    case 'active':
    case 'paused':
    case 'ready':
    default:
      return 'LAST UPDATED'
  }
})


const lifecycleDate = computed(() => {
  if (isCompleted.value) {
    return formatDate(
        props.data?.completedAt
        ?? props.data?.completed_at
        ?? props.data?.generatedAt
        ?? props.data?.generated_at
        ?? props.data?.updatedAt
        ?? props.data?.updated_at
    )
  }

  return formatDate(
      props.data?.updatedAt
      ?? props.data?.updated_at
      ?? props.data?.createdAt
      ?? props.data?.created_at
  )
})


/* ==================================================
   DOSSIER TYPE LABEL
================================================== */

const dossierLabel = computed(() => {
  if (isActive.value) {
    return 'LIVE COUNCIL DOSSIER'
  }

  if (isCompleted.value) {
    return 'ARCHIVE COUNCIL DOSSIER'
  }

  return 'COUNCIL DOSSIER'
})


/* ==================================================
   TELEMETRY ITEMS
================================================== */

const telemetryItems = computed(() => [
  {
    key: 'mode',
    label: 'MODE',
    value: mode.value
  },

  {
    key: 'status',
    label: 'STATUS',
    value: statusLabel.value,
    status: true
  },

  {
    key: 'created',
    label: 'CREATED',
    value: createdAt.value
  },

  {
    key: 'lifecycle',
    label: lifecycleLabel.value,
    value: lifecycleDate.value
  },

  {
    key: 'rounds',
    label: 'ROUNDS',
    value: String(
        resolvedRoundCount.value
    ),
    numeric: true
  },

  {
    key: 'sections',
    label: 'SECTIONS',
    value: String(
        resolvedSectionCount.value
    ),
    numeric: true
  }
])
</script>


<template>
  <!--
    Full-size host.

    The parent's direct-child width rules act on this element.
    The visual 5% offset is moved to .dossier-frame inside it.
  -->

  <header
      class="dossier-header"
      :class="[
      `is-${status}`
    ]"
      :style="headerStyle"
  >
    <div class="dossier-frame">
      <!-- ==================================================
           BACKGROUND SYSTEM
      =================================================== -->

      <div class="header-grid" />

      <div class="noise-layer" />

      <div class="status-ambient" />

      <div class="scan-line" />


      <!-- ==================================================
           FRAME
      =================================================== -->

      <span class="frame-corner corner-tl" />

      <span class="frame-corner corner-tr" />

      <span class="frame-corner corner-bl" />

      <span class="frame-corner corner-br" />

      <span class="edge-light edge-light-top" />

      <span class="edge-light edge-light-bottom" />


      <!-- ==================================================
           TOP CLASSIFICATION RAIL
      =================================================== -->

      <div class="classification-rail">
        <div class="classification-left">
          <span class="classification-node" />

          <span class="classification-label">
            {{ dossierLabel }}
          </span>

          <span class="classification-divider" />

          <span class="classification-number">
            {{ reportNumber }}
          </span>
        </div>


        <div class="classification-status">
          <span
              class="live-indicator"
              :class="{
              pulsing: isActive
            }"
          />

          <span class="classification-status-text">
            {{ statusEyebrow }}
          </span>
        </div>
      </div>


      <!-- ==================================================
           HERO BODY
      =================================================== -->

      <div class="hero-layout">
        <!-- ================================================
             IDENTITY AREA
        ================================================= -->

        <section class="identity-area">
          <div class="identity-index">
            <span class="index-rule" />

            <span>
              SESSION RECORD
            </span>
          </div>


          <h1 class="report-title">
            {{ title }}
          </h1>


          <p
              v-if="objective"
              class="report-objective"
          >
            {{ objective }}
          </p>


          <div class="context-block">
            <span class="context-marker">
              CONTEXT
            </span>

            <p class="context-copy">
              {{ secondaryCopy }}
            </p>
          </div>
        </section>


        <!-- ================================================
             STATUS COMMAND AREA
        ================================================= -->

        <aside class="status-command">
          <!-- ==============================================
               STATUS SEAL
          =============================================== -->

          <div class="status-seal">
            <span class="seal-halo halo-outer" />

            <span class="seal-halo halo-mid" />

            <span class="seal-halo halo-inner" />

            <span class="seal-axis axis-x" />

            <span class="seal-axis axis-y" />


            <div class="seal-core">
              <div class="seal-diamond">
                <span class="diamond-inner">
                  <!-- ACTIVE -->

                  <svg
                      v-if="status === 'active'"
                      viewBox="0 0 48 48"
                      class="status-icon"
                      aria-hidden="true"
                  >
                    <path
                        d="
                        M8 25
                        H15
                        L19 14
                        L25 35
                        L30 21
                        H40
                      "
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linejoin="round"
                    />

                    <circle
                        cx="24"
                        cy="24"
                        r="17"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1"
                    />
                  </svg>


                  <!-- COMPLETED -->

                  <svg
                      v-else-if="status === 'completed'"
                      viewBox="0 0 48 48"
                      class="status-icon"
                      aria-hidden="true"
                  >
                    <circle
                        cx="24"
                        cy="24"
                        r="17"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.2"
                    />

                    <path
                        d="
                        M15 24
                        L21 30
                        L34 17
                      "
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                  </svg>


                  <!-- PAUSED -->

                  <svg
                      v-else-if="status === 'paused'"
                      viewBox="0 0 48 48"
                      class="status-icon"
                      aria-hidden="true"
                  >
                    <circle
                        cx="24"
                        cy="24"
                        r="17"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.2"
                    />

                    <path
                        d="
                        M19 16
                        V32

                        M29 16
                        V32
                      "
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                    />
                  </svg>


                  <!-- ABANDONED -->

                  <svg
                      v-else-if="status === 'abandoned'"
                      viewBox="0 0 48 48"
                      class="status-icon"
                      aria-hidden="true"
                  >
                    <path
                        d="
                        M24 6
                        L38 12
                        L42 24
                        L38 36
                        L24 42
                        L10 36
                        L6 24
                        L10 12
                        Z
                      "
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.25"
                    />

                    <path
                        d="
                        M17 17
                        L31 31

                        M31 17
                        L17 31
                      "
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        stroke-linecap="round"
                    />
                  </svg>


                  <!-- READY -->

                  <svg
                      v-else
                      viewBox="0 0 48 48"
                      class="status-icon"
                      aria-hidden="true"
                  >
                    <path
                        d="
                        M24 5
                        L28 18
                        L42 24
                        L28 30
                        L24 43
                        L20 30
                        L6 24
                        L20 18
                        Z
                      "
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.4"
                    />

                    <circle
                        cx="24"
                        cy="24"
                        r="4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.2"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>


          <!-- ==============================================
               STATUS COPY
          =============================================== -->

          <div class="status-copy">
            <span class="status-overline">
              DISCUSSION STATE
            </span>

            <span class="status-title">
              {{ statusLabel }}
            </span>

            <span class="status-description">
              {{ statusDescription }}
            </span>
          </div>


          <!-- ==============================================
               MINI TELEMETRY
          =============================================== -->

          <div class="command-telemetry">
            <div class="command-stat">
              <span class="command-stat-value">
                {{
                  String(
                      resolvedRoundCount
                  ).padStart(
                      2,
                      '0'
                  )
                }}
              </span>

              <span class="command-stat-label">
                ROUNDS
              </span>
            </div>


            <span class="command-separator" />


            <div class="command-stat">
              <span class="command-stat-value">
                {{
                  String(
                      resolvedSectionCount
                  ).padStart(
                      2,
                      '0'
                  )
                }}
              </span>

              <span class="command-stat-label">
                SECTIONS
              </span>
            </div>
          </div>
        </aside>
      </div>


      <!-- ==================================================
           FULL-WIDTH TELEMETRY RAIL
      =================================================== -->

      <div class="telemetry-rail">
        <div
            v-for="item in telemetryItems"
            :key="item.key"
            class="telemetry-cell"
            :class="{
            numeric: item.numeric
          }"
        >
          <span class="telemetry-label">
            {{ item.label }}
          </span>


          <span
              class="telemetry-value"
              :class="{
              'status-value': item.status
            }"
          >
            {{ item.value }}
          </span>
        </div>
      </div>
    </div>
  </header>
</template>


<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}


/* ==================================================
   HOST ROOT

   This is the only direct child visible to the parent.

   It fills the parent cell without carrying the visual
   5% offset, so parent width guards cannot create:
   100% width + 5% margin = 105% overflow.
================================================== */

.dossier-header {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  color:
      rgba(
          239,
          243,
          255,
          0.96
      );

  isolation: isolate;
}


/* ==================================================
   VISUAL DOSSIER FRAME

   The old root's 95% width + 5% offset now lives safely
   inside the full-size host.
================================================== */

.dossier-frame {
  position: relative;

  width: 95%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  margin-left: 5%;

  overflow: hidden;

  display: grid;

  grid-template-rows:
    auto
    minmax(0, 1fr)
    auto;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 24%,
          transparent
      );

  border-radius:
      clamp(
          9px,
          0.8vw,
          14px
      );

  background:
      linear-gradient(
          115deg,
          rgba(5, 5, 19, 0.98) 0%,
          rgba(6, 6, 24, 0.96) 42%,
          rgba(3, 9, 23, 0.95) 100%
      );

  box-shadow:
      inset
      0
      0
      2.4rem
      color-mix(
          in srgb,
          var(--primary) 4%,
          transparent
      ),

      0
      0
      1.4rem
      rgba(
          63,
          39,
          125,
          0.08
      );

  isolation: isolate;
}


/* ==================================================
   DIRECT GRID CHILD PROTECTION
================================================== */

.dossier-frame > *,
.hero-layout > *,
.status-command > *,
.telemetry-rail > *,
.classification-rail > * {
  min-width: 0;
  min-height: 0;
}


/* ==================================================
   GRID
================================================== */

.header-grid {
  position: absolute;

  z-index: -3;

  inset: 0;

  pointer-events: none;

  opacity: 0.2;

  background-image:
      linear-gradient(
          rgba(
              120,
              102,
              213,
              0.055
          )
          1px,
          transparent
          1px
      ),

      linear-gradient(
          90deg,
          rgba(
              72,
              154,
              224,
              0.045
          )
          1px,
          transparent
          1px
      );

  background-size:
      1.6rem
      1.6rem;
}


/* ==================================================
   NOISE
================================================== */

.noise-layer {
  position: absolute;

  z-index: -2;

  inset: 0;

  pointer-events: none;

  opacity: 0.12;

  background:
      repeating-linear-gradient(
          0deg,
          transparent 0,
          transparent 3px,
          rgba(
              255,
              255,
              255,
              0.012
          )
          4px
      );
}


/* ==================================================
   STATUS AMBIENT
================================================== */

.status-ambient {
  position: absolute;

  z-index: -2;

  right: -8%;
  top: -80%;

  width: 48%;

  aspect-ratio: 1;

  border-radius: 50%;

  pointer-events: none;

  background:
      radial-gradient(
          circle,
          color-mix(
              in srgb,
              var(--status-color) 12%,
              transparent
          ),
          transparent 68%
      );

  filter:
      blur(1.2rem);
}


/* ==================================================
   SCAN LINE
================================================== */

.scan-line {
  position: absolute;

  z-index: 6;

  left: 0;
  right: 0;
  top: 0;

  height: 1px;

  pointer-events: none;

  opacity: 0;

  background:
      linear-gradient(
          90deg,
          transparent,
          var(--secondary),
          transparent
      );

  animation:
      scan-header
      6s
      linear
      infinite;
}


/* ==================================================
   FRAME CORNERS
================================================== */

.frame-corner {
  position: absolute;

  z-index: 12;

  width: 0.8rem;
  height: 0.8rem;

  pointer-events: none;
}


.corner-tl {
  top: 0;
  left: 0;

  border-top:
      1px solid
      var(--primary);

  border-left:
      1px solid
      var(--primary);
}


.corner-tr {
  top: 0;
  right: 0;

  border-top:
      1px solid
      var(--secondary);

  border-right:
      1px solid
      var(--secondary);
}


.corner-bl {
  bottom: 0;
  left: 0;

  border-bottom:
      1px solid
      var(--secondary);

  border-left:
      1px solid
      var(--secondary);
}


.corner-br {
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
   EDGE LIGHTS
================================================== */

.edge-light {
  position: absolute;

  z-index: 4;

  pointer-events: none;
}


.edge-light-top {
  top: 0;
  left: 3%;

  width: 32%;
  height: 1px;

  background:
      linear-gradient(
          90deg,
          var(--primary),
          transparent
      );

  opacity: 0.46;
}


.edge-light-bottom {
  right: 6%;
  bottom: 0;

  width: 30%;
  height: 1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          var(--secondary)
      );

  opacity: 0.34;
}


/* ==================================================
   CLASSIFICATION RAIL
================================================== */

.classification-rail {
  width: 100%;

  min-width: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap:
      clamp(
          0.5rem,
          1vw,
          1rem
      );

  padding:
      clamp(
          0.5rem,
          0.7vw,
          0.72rem
      )
      clamp(
          0.65rem,
          1.2vw,
          1.2rem
      );

  overflow: hidden;

  border-bottom:
      1px solid
      rgba(
          125,
          151,
          211,
          0.11
      );

  background:
      linear-gradient(
          90deg,
          rgba(
              88,
              57,
              156,
              0.07
          ),
          transparent 55%,
          color-mix(
              in srgb,
              var(--status-color) 4%,
              transparent
          )
      );
}


.classification-left {
  min-width: 0;

  display: flex;

  align-items: center;

  gap:
      clamp(
          0.4rem,
          0.6vw,
          0.65rem
      );

  overflow: hidden;
}


.classification-node {
  flex:
      0
      0
      auto;

  width: 0.32rem;

  aspect-ratio: 1;

  transform:
      rotate(45deg);

  background:
      var(--primary);

  box-shadow:
      0
      0
      0.35rem
      var(--primary);
}


.classification-label {
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
          0.37rem,
          0.47vw,
          0.5rem
      );

  font-weight: 600;

  letter-spacing:
      0.11em;
}


.classification-divider {
  flex:
      0
      1
      clamp(
          1rem,
          2vw,
          2.5rem
      );

  width:
      clamp(
          1rem,
          2vw,
          2.5rem
      );

  min-width: 0;

  height: 1px;

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--primary) 38%,
              transparent
          ),
          transparent
      );
}


.classification-number {
  flex:
      0
      0
      auto;

  color:
      rgba(
          184,
          216,
          244,
          0.68
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.35rem,
          0.45vw,
          0.48rem
      );

  letter-spacing:
      0.08em;
}


.classification-status {
  min-width: 0;

  display: flex;

  align-items: center;

  justify-content: flex-end;

  gap: 0.4rem;

  color:
      var(--status-color);

  font-family:
      monospace;

  font-size:
      clamp(
          0.34rem,
          0.43vw,
          0.46rem
      );

  letter-spacing:
      0.09em;

  overflow: hidden;
}


.classification-status-text {
  min-width: 0;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;
}


.live-indicator {
  flex:
      0
      0
      auto;

  width: 0.35rem;

  aspect-ratio: 1;

  border-radius: 50%;

  background:
      var(--status-color);

  box-shadow:
      0
      0
      0.4rem
      var(--status-color);
}


.live-indicator.pulsing {
  animation:
      status-pulse
      1.8s
      ease-in-out
      infinite;
}


/* ==================================================
   HERO LAYOUT
================================================== */

.hero-layout {
  width: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    minmax(
      clamp(
          12rem,
          22vw,
          17rem
      ),
      0.42fr
    );

  gap:
      clamp(
          0.65rem,
          1.5vw,
          1.6rem
      );

  padding:
      clamp(
          0.7rem,
          1.3vw,
          1.3rem
      )
      clamp(
          0.65rem,
          1.1vw,
          1.15rem
      )
      clamp(
          0.7rem,
          1.3vw,
          1.3rem
      )
      clamp(
          0.8rem,
          1.5vw,
          1.5rem
      );

  align-items: stretch;
}


/* ==================================================
   IDENTITY AREA
================================================== */

.identity-area {
  min-width: 0;
  min-height: 0;

  overflow: hidden;

  display: flex;

  flex-direction: column;

  justify-content: center;

  padding-right:
      clamp(
          0.25rem,
          0.7vw,
          0.7rem
      );
}


.identity-index {
  min-width: 0;

  display: flex;

  align-items: center;

  gap: 0.5rem;

  margin-bottom:
      clamp(
          0.35rem,
          0.55vw,
          0.55rem
      );

  overflow: hidden;

  color:
      rgba(
          151,
          179,
          223,
          0.4
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.3rem,
          0.38vw,
          0.4rem
      );

  letter-spacing:
      0.12em;
}


.index-rule {
  flex:
      0
      1
      clamp(
          1rem,
          2vw,
          2rem
      );

  width:
      clamp(
          1rem,
          2vw,
          2rem
      );

  min-width: 0;

  height: 1px;

  background:
      linear-gradient(
          90deg,
          var(--secondary),
          transparent
      );

  opacity: 0.6;
}


/* ==================================================
   TITLE
================================================== */

.report-title {
  margin: 0;

  width: 100%;
  max-width: 100%;

  min-width: 0;

  display:
      -webkit-box;

  overflow: hidden;

  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  overflow-wrap: anywhere;

  color:
      rgba(
          247,
          248,
          255,
          0.98
      );

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          1.15rem,
          2vw,
          2.15rem
      );

  font-weight: 400;

  line-height: 1.12;

  letter-spacing:
      0.005em;

  text-shadow:
      0
      0
      1rem
      rgba(
          166,
          121,
          255,
          0.08
      );
}


/* ==================================================
   OBJECTIVE
================================================== */

.report-objective {
  margin:
      clamp(
          0.35rem,
          0.6vw,
          0.65rem
      )
      0
      0;

  min-width: 0;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  color:
      color-mix(
          in srgb,
          var(--secondary) 66%,
          white 34%
      );

  font-size:
      clamp(
          0.48rem,
          0.68vw,
          0.72rem
      );

  line-height: 1.4;
}


/* ==================================================
   CONTEXT
================================================== */

.context-block {
  min-width: 0;

  margin-top:
      auto;

  padding-top:
      clamp(
          0.55rem,
          0.9vw,
          0.9rem
      );

  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr);

  align-items: start;

  gap:
      clamp(
          0.5rem,
          0.8vw,
          0.8rem
      );
}


.context-marker {
  padding:
      0.2rem
      0.35rem;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 25%,
          transparent
      );

  color:
      var(--primary);

  background:
      color-mix(
          in srgb,
          var(--primary) 4%,
          transparent
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.28rem,
          0.36vw,
          0.38rem
      );

  letter-spacing:
      0.08em;

  white-space: nowrap;
}


.context-copy {
  margin: 0;

  min-width: 0;

  display:
      -webkit-box;

  overflow: hidden;

  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  overflow-wrap: anywhere;

  color:
      rgba(
          194,
          207,
          233,
          0.48
      );

  font-size:
      clamp(
          0.42rem,
          0.57vw,
          0.61rem
      );

  line-height: 1.5;
}


/* ==================================================
   STATUS COMMAND

   Fully shrinkable.
================================================== */

.status-command {
  position: relative;

  width: 100%;

  min-width: 0;
  min-height: 0;

  justify-self: stretch;
  align-self: center;

  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr);

  grid-template-rows:
    auto
    auto;

  grid-template-areas:
    'seal copy'
    'telemetry telemetry';

  align-items: center;

  column-gap:
      clamp(
          0.4rem,
          0.65vw,
          0.7rem
      );

  row-gap:
      clamp(
          0.3rem,
          0.45vw,
          0.45rem
      );

  margin: 0;
  padding: 0;

  overflow: hidden;
}


/* ==================================================
   STATUS SEAL
================================================== */

.status-seal {
  grid-area: seal;

  position: relative;

  flex:
      0
      0
      auto;

  width:
      clamp(
          3rem,
          4.4vw,
          4.6rem
      );

  aspect-ratio: 1;

  display: grid;

  place-items: center;
}


.seal-halo {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;
}


.halo-outer {
  inset: 0;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--status-color) 20%,
          transparent
      );
}


.halo-mid {
  inset: 10%;

  border:
      1px dashed
      color-mix(
          in srgb,
          var(--status-color) 25%,
          transparent
      );

  animation:
      rotate-orbit
      16s
      linear
      infinite;
}


.halo-inner {
  inset: 22%;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--status-color) 16%,
          transparent
      );
}


.is-active
.halo-mid {
  animation-duration:
      8s;
}


/* ==================================================
   SEAL AXES
================================================== */

.seal-axis {
  position: absolute;

  pointer-events: none;
}


.axis-x {
  left: -7%;
  right: -7%;

  height: 1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          color-mix(
              in srgb,
              var(--status-color) 28%,
              transparent
          ),
          transparent
      );
}


.axis-y {
  top: -7%;
  bottom: -7%;

  width: 1px;

  background:
      linear-gradient(
          180deg,
          transparent,
          color-mix(
              in srgb,
              var(--status-color) 28%,
              transparent
          ),
          transparent
      );
}


/* ==================================================
   SEAL CORE
================================================== */

.seal-core {
  width: 48%;

  aspect-ratio: 1;

  display: grid;

  place-items: center;

  border-radius: 50%;

  background:
      radial-gradient(
          circle,
          color-mix(
              in srgb,
              var(--status-color) 10%,
              rgba(5, 7, 18, 0.95)
          ),
          rgba(
              4,
              6,
              17,
              0.96
          )
      );

  box-shadow:
      0
      0
      1rem
      color-mix(
          in srgb,
          var(--status-color) 14%,
          transparent
      );
}


.seal-diamond {
  width: 74%;

  aspect-ratio: 1;

  display: grid;

  place-items: center;

  border:
      1px solid
      var(--status-color);

  transform:
      rotate(45deg);

  box-shadow:
      0
      0
      0.7rem
      color-mix(
          in srgb,
          var(--status-color) 28%,
          transparent
      );
}


.diamond-inner {
  width: 100%;
  height: 100%;

  display: grid;

  place-items: center;

  transform:
      rotate(-45deg);
}


.status-icon {
  width: 82%;
  height: 82%;

  color:
      var(--status-color);

  filter:
      drop-shadow(
          0
          0
          0.3rem
          color-mix(
              in srgb,
              var(--status-color) 55%,
              transparent
          )
      );
}


/* ==================================================
   STATUS-SPECIFIC SEAL BEHAVIOR
================================================== */

.is-active
.seal-core {
  animation:
      active-core-pulse
      2.2s
      ease-in-out
      infinite;
}


.is-completed
.halo-mid {
  animation-duration:
      22s;
}


.is-completed
.seal-diamond {
  box-shadow:
      0
      0
      0.85rem
      color-mix(
          in srgb,
          var(--status-color) 42%,
          transparent
      );
}


.is-paused
.halo-mid {
  animation-play-state:
      paused;

  transform:
      rotate(45deg);
}


.is-abandoned
.halo-mid {
  border-style: solid;

  animation: none;

  opacity: 0.55;
}


.is-abandoned
.seal-diamond {
  transform:
      rotate(45deg)
      scale(0.9);
}


.is-ready
.halo-mid {
  animation-duration:
      28s;
}


/* ==================================================
   STATUS COPY
================================================== */

.status-copy {
  grid-area: copy;

  min-width: 0;

  overflow: hidden;

  display: flex;

  flex-direction: column;

  justify-content: center;

  gap: 0.2rem;
}


.status-overline {
  min-width: 0;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  color:
      color-mix(
          in srgb,
          var(--status-color) 42%,
          rgba(169, 186, 220, 0.38)
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.28rem,
          0.36vw,
          0.38rem
      );

  letter-spacing:
      0.12em;
}


.status-title {
  min-width: 0;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  color:
      var(--status-color);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.72rem,
          1vw,
          1.08rem
      );

  line-height: 1;

  letter-spacing:
      0.02em;

  text-shadow:
      0
      0
      0.8rem
      color-mix(
          in srgb,
          var(--status-color) 30%,
          transparent
      );
}


.status-description {
  width: 100%;

  min-width: 0;

  display:
      -webkit-box;

  overflow: hidden;

  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  overflow-wrap: anywhere;

  color:
      color-mix(
          in srgb,
          var(--status-color) 22%,
          rgba(204, 216, 239, 0.48)
      );

  font-size:
      clamp(
          0.34rem,
          0.43vw,
          0.46rem
      );

  line-height: 1.45;
}


/* ==================================================
   COMMAND TELEMETRY
================================================== */

.command-telemetry {
  grid-area: telemetry;

  min-width: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    auto
    minmax(0, 1fr);

  align-items: center;

  padding-top:
      clamp(
          0.4rem,
          0.65vw,
          0.65rem
      );

  border-top:
      1px solid
      color-mix(
          in srgb,
          var(--status-color) 12%,
          transparent
      );
}


.command-stat {
  min-width: 0;

  display: flex;

  align-items: baseline;
  justify-content: center;

  gap: 0.3rem;

  overflow: hidden;
}


.command-stat-value {
  flex:
      0
      0
      auto;

  color:
      var(--status-color);

  font-family:
      Georgia,
      serif;

  font-size:
      clamp(
          0.52rem,
          0.68vw,
          0.72rem
      );
}


.command-stat-label {
  min-width: 0;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  color:
      color-mix(
          in srgb,
          var(--status-color) 26%,
          rgba(175, 194, 227, 0.34)
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.26rem,
          0.34vw,
          0.36rem
      );

  letter-spacing:
      0.09em;
}


.command-separator {
  width: 1px;
  height: 1rem;

  background:
      rgba(
          130,
          154,
          205,
          0.12
      );
}


/* ==================================================
   TELEMETRY RAIL

   No fixed intrinsic minimum widths.

   Every column may shrink inside the actual available
   header width instead of forcing horizontal overflow.
================================================== */

.telemetry-rail {
  min-width: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 0.72fr)
    minmax(0, 0.85fr)
    minmax(0, 1.35fr)
    minmax(0, 1.35fr)
    minmax(0, 0.55fr)
    minmax(0, 0.55fr);

  overflow: hidden;

  border-top:
      1px solid
      rgba(
          122,
          151,
          210,
          0.13
      );

  background:
      linear-gradient(
          90deg,
          rgba(
              6,
              8,
              22,
              0.82
          ),
          rgba(
              5,
              8,
              20,
              0.68
          )
      );
}


/* ==================================================
   TELEMETRY CELL
================================================== */

.telemetry-cell {
  min-width: 0;

  overflow: hidden;

  display: flex;

  flex-direction: column;

  justify-content: center;

  gap:
      0.16rem;

  padding:
      clamp(
          0.4rem,
          0.65vw,
          0.65rem
      )
      clamp(
          0.38rem,
          0.8vw,
          0.8rem
      );

  border-right:
      1px solid
      rgba(
          122,
          151,
          210,
          0.1
      );
}


.telemetry-cell:last-child {
  border-right: 0;
}


.telemetry-cell.numeric {
  align-items: center;

  text-align: center;
}


.telemetry-label {
  min-width: 0;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  color:
      rgba(
          154,
          177,
          216,
          0.38
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.28rem,
          0.36vw,
          0.38rem
      );

  letter-spacing:
      0.1em;
}


.telemetry-value {
  min-width: 0;

  overflow: hidden;

  white-space: nowrap;

  text-overflow: ellipsis;

  color:
      rgba(
          229,
          235,
          250,
          0.76
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.38rem,
          0.5vw,
          0.54rem
      );
}


.telemetry-value.status-value {
  color:
      var(--status-color);

  text-shadow:
      0
      0
      0.35rem
      color-mix(
          in srgb,
          var(--status-color) 25%,
          transparent
      );
}


/* ==================================================
   ANIMATIONS
================================================== */

@keyframes scan-header {
  0% {
    top: 0;
    opacity: 0;
  }

  7% {
    opacity: 0.42;
  }

  35% {
    opacity: 0;
  }

  100% {
    top: 100%;
    opacity: 0;
  }
}


@keyframes rotate-orbit {
  from {
    transform:
        rotate(0deg);
  }

  to {
    transform:
        rotate(360deg);
  }
}


@keyframes active-core-pulse {
  0%,
  100% {
    box-shadow:
        0
        0
        0.65rem
        color-mix(
            in srgb,
            var(--status-color) 12%,
            transparent
        );
  }

  50% {
    box-shadow:
        0
        0
        1.1rem
        color-mix(
            in srgb,
            var(--status-color) 30%,
            transparent
        );
  }
}


@keyframes status-pulse {
  0%,
  100% {
    opacity: 0.5;

    transform:
        scale(0.85);
  }

  50% {
    opacity: 1;

    transform:
        scale(1.15);
  }
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 1100px) {
  .hero-layout {
    grid-template-columns:
      minmax(0, 1fr)
      minmax(11rem, 0.52fr);

    gap:
        0.7rem;
  }


  .status-seal {
    width:
        clamp(
            2.8rem,
            4vw,
            3.8rem
        );
  }


  .telemetry-rail {
    grid-template-columns:
      repeat(
        4,
        minmax(0, 1fr)
      );
  }


  .telemetry-cell:nth-child(5),
  .telemetry-cell:nth-child(6) {
    display: none;
  }
}


@media (max-width: 800px) {
  .dossier-frame {
    width: 100%;

    margin-left: 0;
  }


  .hero-layout {
    grid-template-columns:
      minmax(0, 1fr);

    grid-template-rows:
      minmax(0, 1fr)
      auto;

    gap:
        0.65rem;

    padding-left:
        clamp(
            0.9rem,
            1.5vw,
            1.5rem
        );
  }


  .identity-area {
    padding-left: 0;
    padding-right: 0;
  }


  .status-command {
    grid-template-columns:
      auto
      minmax(0, 1fr);

    padding:
        0.5rem
        0.7rem;
  }


  .status-seal {
    width:
        3.35rem;
  }


  .command-telemetry {
    display: none;
  }


  .telemetry-rail {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }


  .telemetry-cell:nth-child(3),
  .telemetry-cell:nth-child(4),
  .telemetry-cell:nth-child(5),
  .telemetry-cell:nth-child(6) {
    display: none;
  }
}


@media (max-width: 560px) {
  .classification-number,
  .classification-divider {
    display: none;
  }


  .classification-rail {
    grid-template-columns:
      minmax(0, 1fr)
      minmax(0, auto);

    padding:
        0.45rem
        0.55rem;
  }


  .hero-layout {
    padding:
        0.65rem;
  }


  .context-block {
    grid-template-columns:
      minmax(0, 1fr);

    gap:
        0.3rem;
  }


  .context-marker {
    width:
        max-content;

    max-width: 100%;
  }


  .status-command {
    grid-template-columns:
      auto
      minmax(0, 1fr);

    padding:
        0;
  }


  .status-description {
    -webkit-line-clamp: 2;
  }
}


/* ==================================================
   SHORT VIEWPORT
================================================== */

@media (max-height: 700px) and (orientation: landscape) {
  .classification-rail {
    padding:
        0.4rem
        0.7rem;
  }


  .hero-layout {
    padding:
        0.55rem
        0.7rem;
  }


  .telemetry-cell {
    padding:
        0.35rem
        0.45rem;
  }


  .status-seal {
    width:
        clamp(
            2.6rem,
            4vw,
            3.8rem
        );
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {
  .scan-line,
  .halo-mid,
  .live-indicator {
    animation: none;
  }
}
</style>
