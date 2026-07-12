<script setup>
import {
  computed,
  ref,
  watch
} from 'vue'

import { useCurrentDiscussionStore } from '@/stores/currentDiscussion.js'


/* ==================================================
   PROPS
================================================== */

const props = defineProps({
  steps: {
    type: Array,
    default: () => []
  },

  turningPoints: {
    type: Array,
    default: () => []
  },

  primary: {
    type: String,
    default: '#a66cff'
  },

  secondary: {
    type: String,
    default: '#37a9ff'
  },

  success: {
    type: String,
    default: '#59f5c4'
  }
})


/* ==================================================
   STORE
================================================== */

const discussionStore =
    useCurrentDiscussionStore()


/* ==================================================
   LOCAL STATE
================================================== */

const selectedStepId =
    ref(null)


/* ==================================================
   STYLE
================================================== */

const panelStyle =
    computed(() => ({
      '--primary':
      props.primary,

      '--secondary':
      props.secondary,

      '--success':
      props.success
    }))


/* ==================================================
   HELPERS
================================================== */

function safeArray(value) {
  return Array.isArray(value)
      ? value
      : []
}


function numberOrNull(value) {
  if (
      value === null
      ||
      value === undefined
      ||
      value === ''
  ) {
    return null
  }

  const numeric =
      Number(value)

  return Number.isFinite(numeric)
      ? numeric
      : null
}


function clampPercentage(value) {
  const numeric =
      numberOrNull(value)

  if (
      numeric === null
  ) {
    return null
  }

  return Math.max(
      0,
      Math.min(
          100,
          numeric
      )
  )
}


function cleanText(value) {
  return typeof value === 'string'
      ? value.trim()
      : ''
}


function firstText(...values) {
  for (
      const value
      of values
      ) {
    const text =
        cleanText(value)

    if (
        text
    ) {
      return text
    }
  }

  return ''
}


function normalizeId(value) {
  if (
      value === null
      ||
      value === undefined
      ||
      value === ''
  ) {
    return null
  }

  return String(value)
}


/* ==================================================
   DISCUSSION SECTIONS
================================================== */

const discussionSections =
    computed(() => {
      return safeArray(
          discussionStore.orderedSections
      )
          .map(
              (
                  section,
                  index
              ) => ({
                section,

                index,

                order:
                    numberOrNull(
                        section?.sequence
                    )
                    ??
                    numberOrNull(
                        section
                            ?.metadata
                            ?.roundNumber
                    )
                    ??
                    index
              })
          )

          .sort(
              (
                  first,
                  second
              ) => {
                if (
                    first.order !==
                    second.order
                ) {
                  return (
                      first.order
                      -
                      second.order
                  )
                }

                return (
                    first.index
                    -
                    second.index
                )
              }
          )

          .map(
              item =>
                  item.section
          )
    })


/* ==================================================
   DISCUSSION STATE
================================================== */

const discussionStatus =
    computed(() =>
        String(
            discussionStore.status
            ??
            ''
        )
            .trim()
            .toLowerCase()
    )


const discussionIsComplete =
    computed(() =>
        [
          'complete',
          'completed',
          'finished',
          'ended'
        ]
            .includes(
                discussionStatus.value
            )
    )


const currentSectionId =
    computed(() =>
        normalizeId(
            discussionStore
                .currentSection
                ?.id
        )
    )


/* ==================================================
   ROUND HELPERS
================================================== */

function roundNumberOf(
    section,
    index
) {
  return (
      numberOrNull(
          section
              ?.metadata
              ?.roundNumber
      )
      ??
      numberOrNull(
          section?.roundNumber
      )
      ??
      numberOrNull(
          section?.round_number
      )
      ??
      index + 1
  )
}


function roundMarker(
    roundNumber
) {
  const numeric =
      numberOrNull(
          roundNumber
      )

  if (
      numeric === null
  ) {
    return 'ROUND'
  }

  return `R${String(
      Math.round(
          numeric
      )
  )
      .padStart(
          2,
          '0'
      )}`
}


function roundTitle(
    step
) {
  return `ROUND ${String(
      Math.round(
          step?.roundNumber
          ??
          0
      )
  )
      .padStart(
          2,
          '0'
      )}`
}


/* ==================================================
   TIME
================================================== */

function sectionTimestampOf(
    section
) {
  return (
      section?.completedAt
      ??
      section?.completed_at
      ??
      section?.updatedAt
      ??
      section?.updated_at
      ??
      section?.createdAt
      ??
      section?.created_at
      ??
      null
  )
}


function formatTimestamp(
    value
) {
  if (
      !value
  ) {
    return ''
  }

  const date =
      new Date(value)

  if (
      Number.isNaN(
          date.getTime()
      )
  ) {
    return ''
  }

  return date.toLocaleTimeString(
      [],
      {
        hour:
            '2-digit',

        minute:
            '2-digit'
      }
  )
}


/* ==================================================
   STATUS
================================================== */

function normalizeStatus(
    value
) {
  const status =
      String(
          value
          ??
          ''
      )
          .trim()
          .toLowerCase()

  if (
      [
        'complete',
        'completed',
        'done',
        'finished'
      ]
          .includes(
              status
          )
  ) {
    return 'complete'
  }

  if (
      [
        'active',
        'current',
        'running',
        'in_progress',
        'in progress'
      ]
          .includes(
              status
          )
  ) {
    return 'active'
  }

  if (
      [
        'pending',
        'waiting',
        'queued'
      ]
          .includes(
              status
          )
  ) {
    return 'pending'
  }

  return status
      ||
      'complete'
}


function statusLabel(
    step
) {
  if (
      step?.isCurrent
  ) {
    return 'CURRENT ROUND'
  }

  if (
      step?.status ===
      'complete'
  ) {
    return 'ROUND COMPLETE'
  }

  if (
      step?.status ===
      'pending'
  ) {
    return 'PENDING'
  }

  return String(
      step?.status
      ??
      'ROUND'
  )
      .replaceAll(
          '_',
          ' '
      )
      .toUpperCase()
}


/* ==================================================
   DESCRIPTION
================================================== */

function sectionDescriptionOf(
    section
) {
  return firstText(
      section
          ?.mediator
          ?.summary,

      section?.summary,

      section?.description,

      section
          ?.mediator
          ?.consensus
  )
}


/* ==================================================
   DISCUSSION TIMELINE
================================================== */

const discussionTimeline =
    computed(() => {
      return discussionSections.value.map(
          (
              section,
              index
          ) => {
            const roundNumber =
                roundNumberOf(
                    section,
                    index
                )

            const formattedTime =
                formatTimestamp(
                    sectionTimestampOf(
                        section
                    )
                )

            const confidence =
                clampPercentage(
                    section
                        ?.metrics
                        ?.ideaConfidence
                )

            const alignment =
                clampPercentage(
                    section
                        ?.metrics
                        ?.alignment
                        ?.score
                )

            const id =
                normalizeId(
                    section?.id
                )

            const isCurrent =
                id !== null
                &&
                id ===
                currentSectionId.value

            const isEndpoint =
                discussionIsComplete.value
                &&
                index ===
                discussionSections.value.length - 1

            return {
              id:
                  id
                  ??
                  `section-${roundNumber}`,

              roundNumber,

              time:
                  formattedTime
                  ||
                  roundMarker(
                      roundNumber
                  ),

              timeIsClock:
                  Boolean(
                      formattedTime
                  ),

              title:
                  firstText(
                      section?.title
                  )
                  ||
                  `Round ${roundNumber}`,

              description:
                  sectionDescriptionOf(
                      section
                  ),

              status:
                  isCurrent
                      ? 'active'
                      : normalizeStatus(
                          section?.status
                      ),

              isCurrent,

              isEndpoint,

              confidence,

              alignment,

              raw:
              section
            }
          }
      )
    })


/* ==================================================
   EXPLICIT TIMELINE
================================================== */

const explicitTimeline =
    computed(() => {
      return safeArray(
          props.steps
      )
          .map(
              (
                  step,
                  index
              ) => {
                const roundNumber =
                    numberOrNull(
                        step?.roundNumber
                    )
                    ??
                    numberOrNull(
                        step?.round_number
                    )
                    ??
                    numberOrNull(
                        step?.number
                    )
                    ??
                    index + 1

                const suppliedTime =
                    firstText(
                        step?.time,
                        step?.clock
                    )

                const formattedTimestamp =
                    formatTimestamp(
                        step?.timestamp
                        ??
                        step?.createdAt
                        ??
                        step?.created_at
                    )

                return {
                  id:
                      normalizeId(
                          step?.id
                          ??
                          step?.number
                          ??
                          step?.roundNumber
                          ??
                          index + 1
                      ),

                  roundNumber,

                  time:
                      suppliedTime
                      ||
                      formattedTimestamp
                      ||
                      roundMarker(
                          roundNumber
                      ),

                  timeIsClock:
                      Boolean(
                          suppliedTime
                          ||
                          formattedTimestamp
                      ),

                  title:
                      firstText(
                          step?.title,
                          step?.label
                      )
                      ||
                      `Round ${roundNumber}`,

                  description:
                      firstText(
                          step?.description,
                          step?.summary,
                          step?.detail
                      ),

                  status:
                      normalizeStatus(
                          step?.status
                      ),

                  isCurrent:
                      step?.isCurrent === true
                      ||
                      step?.is_current === true,

                  isEndpoint:
                      step?.isEndpoint === true
                      ||
                      step?.is_endpoint === true,

                  confidence:
                      clampPercentage(
                          step?.confidence
                          ??
                          step?.ideaConfidence
                          ??
                          step?.idea_confidence
                      ),

                  alignment:
                      clampPercentage(
                          step?.alignmentScore
                          ??
                          step?.alignment_score
                          ??
                          step?.alignment
                      )
                }
              }
          )
    })


/* ==================================================
   RESOLVED TIMELINE
================================================== */

const normalizedSteps =
    computed(() => {
      if (
          !explicitTimeline.value.length
      ) {
        return discussionTimeline.value
      }

      return explicitTimeline.value.map(
          (
              step,
              index
          ) => ({
            ...step,

            isEndpoint:
                step.isEndpoint
                ||
                (
                    discussionIsComplete.value
                    &&
                    index ===
                    explicitTimeline.value.length - 1
                )
          })
      )
    })


/* ==================================================
   SELECTED ROUND
================================================== */

const selectedStep =
    computed(() => {
      return normalizedSteps.value.find(
              step =>
                  String(
                      step.id
                  )
                  ===
                  String(
                      selectedStepId.value
                  )
          )
          ??
          normalizedSteps.value[0]
          ??
          null
    })


function selectStep(
    step
) {
  selectedStepId.value =
      step.id
}


watch(
    normalizedSteps,

    steps => {
      if (
          !steps.length
      ) {
        selectedStepId.value =
            null

        return
      }

      const selectedStillExists =
          steps.some(
              step =>
                  String(
                      step.id
                  )
                  ===
                  String(
                      selectedStepId.value
                  )
          )

      if (
          selectedStillExists
      ) {
        return
      }

      const currentRound =
          steps.find(
              step =>
                  step.isCurrent
          )

      selectedStepId.value =
          currentRound?.id
          ??
          steps[
          steps.length - 1
              ]?.id
          ??
          steps[0]?.id
    },

    {
      immediate:
          true
    }
)


const hasTimeline =
    computed(() =>
        normalizedSteps.value.length > 0
    )
</script>


<template>
  <section
      class="report-timeline"
      :style="panelStyle"
  >
    <div class="timeline-frame">
      <template v-if="hasTimeline">
        <div class="report-layout">
          <!-- ==================================================
               LEFT — TIMELINE
          =================================================== -->

          <section class="report-panel timeline-panel">
            <span class="panel-corner corner-tl" />
            <span class="panel-corner corner-tr" />
            <span class="panel-corner corner-bl" />
            <span class="panel-corner corner-br" />


            <header class="panel-header">
              <span class="header-symbol">
                ✧
              </span>

              <span class="header-title">
                DELIBERATION TIMELINE
              </span>

              <span class="header-line" />
            </header>


            <div class="timeline-content">
              <!-- ==============================================
                   CENTERED TIMELINE
              =============================================== -->

              <div class="timeline-viewport">
                <div
                    class="timeline-track"
                    :style="{
                    '--step-count':
                      normalizedSteps.length
                  }"
                >
                  <button
                      v-for="(
                      step,
                      index
                    ) in normalizedSteps"
                      :key="step.id"
                      type="button"
                      class="timeline-item"
                      :class="{
                      selected:
                        selectedStep?.id === step.id,

                      current:
                        step.isCurrent,

                      endpoint:
                        step.isEndpoint,

                      complete:
                        step.status === 'complete'
                    }"
                      @click="selectStep(step)"
                  >
                    <span
                        v-if="
                        index
                        <
                        normalizedSteps.length - 1
                      "
                        class="timeline-link"
                    />


                    <div class="timeline-label-area">
                      <span
                          v-if="step.isCurrent"
                          class="current-label"
                      >
                        CURRENT
                      </span>

                      <span
                          v-else
                          class="timeline-label"
                      >
                        {{
                          roundMarker(
                              step.roundNumber
                          )
                        }}
                      </span>
                    </div>


                    <div class="timeline-node">
                      <span class="node-ring">
                        <span class="node-core" />
                      </span>
                    </div>


                    <div class="timeline-info">
                      <span class="timeline-time">
                        {{ step.time }}
                      </span>

                      <span class="timeline-title">
                        {{ step.title }}
                      </span>
                    </div>
                  </button>
                </div>
              </div>


              <!-- ==============================================
                   METRICS
              =============================================== -->

              <div
                  v-if="selectedStep"
                  class="selected-metrics"
              >
                <div class="metric-line-row">
                  <span class="metric-line-label">
                    CONFIDENCE
                  </span>

                  <span class="metric-line-value">
                    {{
                      selectedStep.confidence !== null
                          ? `${Math.round(
                              selectedStep.confidence
                          )}%`
                          : '—'
                    }}
                  </span>

                  <span class="metric-line-track">
                    <span
                        class="metric-line-fill confidence"
                        :style="{
                        width:
                          `${selectedStep.confidence ?? 0}%`
                      }"
                    />
                  </span>
                </div>


                <div class="metric-line-row">
                  <span class="metric-line-label">
                    ALIGNMENT
                  </span>

                  <span class="metric-line-value">
                    {{
                      selectedStep.alignment !== null
                          ? `${Math.round(
                              selectedStep.alignment
                          )}%`
                          : '—'
                    }}
                  </span>

                  <span class="metric-line-track">
                    <span
                        class="metric-line-fill alignment"
                        :style="{
                        width:
                          `${selectedStep.alignment ?? 0}%`
                      }"
                    />
                  </span>
                </div>
              </div>
            </div>
          </section>


          <!-- ==================================================
               RIGHT — SELECTED ROUND DESCRIPTION
          =================================================== -->

          <aside class="report-panel turning-panel">
            <span class="panel-corner corner-tl" />
            <span class="panel-corner corner-tr" />
            <span class="panel-corner corner-bl" />
            <span class="panel-corner corner-br" />


            <header class="panel-header">
              <span class="header-symbol">
                ✧
              </span>

              <span class="header-title">
                KEY TURNING POINT
              </span>

              <span class="header-line" />
            </header>


            <div
                v-if="selectedStep"
                class="turning-content"
            >
              <!-- ==============================================
                   ROUND IDENTITY
              =============================================== -->

              <div class="turning-round-header">
                <div class="round-glyph">
                  <span class="glyph-orbit" />

                  <span class="glyph-number">
                    {{
                      String(
                          Math.round(
                              selectedStep.roundNumber
                          )
                      )
                          .padStart(
                              2,
                              '0'
                          )
                    }}
                  </span>
                </div>


                <div class="round-heading">
                  <div class="round-heading-top">
                    <span class="round-kicker">
                      {{
                        roundTitle(
                            selectedStep
                        )
                      }}
                    </span>


                    <span
                        v-if="selectedStep.isCurrent"
                        class="round-current-badge"
                    >
                      <span class="round-current-pulse" />

                      CURRENT
                    </span>
                  </div>


                  <span class="round-heading-title">
                    {{ selectedStep.title }}
                  </span>
                </div>
              </div>


              <!-- ==============================================
                   ROUND DESCRIPTION
              =============================================== -->

              <div class="turning-description-wrap">
                <article class="selected-point-card round-description-card">
                  <div class="point-index">
                    <span class="index-number">
                      {{
                        String(
                            Math.round(
                                selectedStep.roundNumber
                            )
                        )
                            .padStart(
                                2,
                                '0'
                            )
                      }}
                    </span>

                    <span class="index-line" />
                  </div>


                  <div class="point-body">
                    <div class="point-meta">
                      <span class="point-time">
                        {{ selectedStep.time }}
                      </span>


                      <span
                          class="point-status"
                          :class="{
                          current:
                            selectedStep.isCurrent,

                          complete:
                            selectedStep.status === 'complete'
                        }"
                      >
                        <span class="status-dot" />

                        {{
                          statusLabel(
                              selectedStep
                          )
                        }}
                      </span>
                    </div>


                    <p class="point-text">
                      {{
                        selectedStep.description

                        ||

                        'No detailed round description was recorded for this stage of the deliberation.'
                      }}
                    </p>
                  </div>
                </article>
              </div>


              <div class="turning-footer">
                <span class="footer-hint">
                  SELECT A ROUND ON THE TIMELINE
                </span>

                <span class="footer-round">
                  {{
                    roundMarker(
                        selectedStep.roundNumber
                    )
                  }}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </template>


      <!-- ==================================================
           EMPTY
      =================================================== -->

      <div
          v-else
          class="full-empty"
      >
        <span class="full-empty-mark">
          ✧
        </span>

        <div class="full-empty-copy">
          <span class="full-empty-title">
            DELIBERATION DATA UNAVAILABLE
          </span>

          <span class="full-empty-description">
            Timeline rounds will appear once report data exists.
          </span>
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
   ROOT HOST

   Full-size child for the parent report cell.
================================================== */

.report-timeline {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  color:
      rgba(
          244,
          246,
          255,
          0.98
      );

  font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
}


/* ==================================================
   INNER VISUAL FRAME

   Keeps the original 3% left offset without making
   the component root participate in 103% sizing.
================================================== */

.timeline-frame {
  position: relative;

  width: 97%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  margin-left: 3%;

  overflow: hidden;
}


/* ==================================================
   SHRINK GUARDS
================================================== */

.timeline-frame,
.report-layout,
.report-panel,
.timeline-content,
.timeline-viewport,
.timeline-track,
.turning-content,
.turning-description-wrap,
.selected-point-card,
.point-body,
.turning-round-header,
.round-heading,
.round-heading-top,
.selected-metrics,
.metric-line-row,
.full-empty,
.full-empty-copy {
  min-width: 0;
  min-height: 0;
}


/* ==================================================
   LAYOUT
================================================== */

.report-layout {
  width: 100%;
  height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-columns:
    minmax(0, 2.15fr)
    minmax(0, 1fr);

  gap:
      clamp(
          0.5rem,
          0.8vw,
          0.8rem
      );
}


/* ==================================================
   PANELS
================================================== */

.report-panel {
  position: relative;

  width: 100%;
  height: 100%;

  display: grid;

  grid-template-rows:
    auto
    minmax(0, 1fr);

  overflow: hidden;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 38%,
          transparent
      );

  border-radius: 8px;

  background:
      linear-gradient(
          150deg,
          rgba(8, 5, 27, 0.95),
          rgba(3, 7, 20, 0.96)
      );

  box-shadow:
      inset
      0
      0
      1.2rem
      rgba(132, 75, 255, 0.05),

      0
      0
      0.8rem
      rgba(48, 27, 94, 0.08);
}


.report-panel::before {
  content: '';

  position: absolute;

  inset: 0;

  pointer-events: none;

  opacity: 0.13;

  background-image:
      linear-gradient(
          rgba(127, 86, 222, 0.06)
          1px,
          transparent
          1px
      ),

      linear-gradient(
          90deg,
          rgba(55, 169, 255, 0.04)
          1px,
          transparent
          1px
      );

  background-size:
      1.2rem
      1.2rem;
}


/* ==================================================
   CORNERS
================================================== */

.panel-corner {
  position: absolute;

  z-index: 5;

  width: 0.6rem;
  height: 0.6rem;

  pointer-events: none;
}


.corner-tl {
  top: -1px;
  left: -1px;

  border-top:
      1px solid
      var(--primary);

  border-left:
      1px solid
      var(--primary);
}


.corner-tr {
  top: -1px;
  right: -1px;

  border-top:
      1px solid
      var(--secondary);

  border-right:
      1px solid
      var(--secondary);
}


.corner-bl {
  bottom: -1px;
  left: -1px;

  border-bottom:
      1px solid
      var(--secondary);

  border-left:
      1px solid
      var(--secondary);
}


.corner-br {
  right: -1px;
  bottom: -1px;

  border-right:
      1px solid
      var(--primary);

  border-bottom:
      1px solid
      var(--primary);
}


/* ==================================================
   PANEL HEADER
================================================== */

.panel-header {
  position: relative;

  z-index: 2;

  min-width: 0;

  display: grid;

  grid-template-columns:
    auto
    minmax(0, auto)
    minmax(0, 1fr);

  align-items: center;

  gap: 0.45rem;

  min-height:
      clamp(
          1.75rem,
          2.1vw,
          2.15rem
      );

  padding:
      0
      clamp(
          0.55rem,
          0.8vw,
          0.8rem
      );

  overflow: hidden;

  border-bottom:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 18%,
          transparent
      );

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--primary) 7%,
              transparent
          ),
          transparent 60%
      );
}


.header-symbol {
  color:
      var(--primary);

  font-size: 0.8rem;

  font-weight: 700;

  text-shadow:
      0
      0
      0.45rem
      var(--primary);
}


.header-title {
  min-width: 0;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  color:
      color-mix(
          in srgb,
          var(--primary) 72%,
          white 28%
      );

  font-size:
      clamp(
          0.56rem,
          0.62vw,
          0.66rem
      );

  font-weight: 750;

  letter-spacing:
      0.07em;
}


.header-line {
  min-width: 0;

  height: 1px;

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--primary) 32%,
              transparent
          ),
          transparent
      );
}


/* ==================================================
   LEFT CONTENT
================================================== */

.timeline-content {
  position: relative;

  z-index: 2;

  display: grid;

  grid-template-rows:
    minmax(0, 1fr)
    auto;

  overflow: hidden;
}


/* ==================================================
   TIMELINE VIEWPORT

   This is the only horizontal scroll owner.
================================================== */

.timeline-viewport {
  display: flex;

  align-items: center;
  justify-content: flex-start;

  overflow-x: auto;
  overflow-y: hidden;

  padding:
      0.5rem
      0.7rem;

  overscroll-behavior-x:
      contain;

  scrollbar-width:
      thin;

  scrollbar-color:
      color-mix(
          in srgb,
          var(--primary) 36%,
          transparent
      )
      transparent;
}


.timeline-viewport::-webkit-scrollbar {
  height: 0.24rem;
}


.timeline-viewport::-webkit-scrollbar-track {
  background:
      transparent;
}


.timeline-viewport::-webkit-scrollbar-thumb {
  border-radius:
      999px;

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--primary) 42%,
              transparent
          ),
          color-mix(
              in srgb,
              var(--secondary) 32%,
              transparent
          )
      );
}


/* ==================================================
   TIMELINE TRACK
================================================== */

.timeline-track {
  --node-y:
      2.075rem;

  position: relative;

  width: 100%;

  min-width:
      max(
          38rem,

          calc(
              var(--step-count)
              *
              7.8rem
          )
      );

  min-height:
      6.25rem;

  display: grid;

  grid-template-columns:
    repeat(
      var(--step-count),
      minmax(7rem, 1fr)
    );

  align-items:
      center;
}


/* ==================================================
   TIMELINE ITEM
================================================== */

.timeline-item {
  position: relative;

  z-index: 1;

  isolation: isolate;

  appearance: none;

  min-width: 0;

  display: grid;

  grid-template-rows:
    1.25rem
    1.65rem
    auto;

  justify-items: center;

  padding:
      0
      0.4rem;

  border: 0;

  color: inherit;

  background: none;

  text-align: center;

  cursor: pointer;

  font: inherit;

  opacity: 0.72;

  transition:
      opacity
      180ms
      ease;
}


.timeline-item:hover,
.timeline-item.selected {
  opacity: 1;
}


/* ==================================================
   CONNECTOR SEGMENTS
================================================== */

.timeline-link {
  position: absolute;

  z-index: 0;

  top:
      var(--node-y);

  left: 50%;

  width: 100%;
  height: 1px;

  pointer-events: none;

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--primary) 70%,
              transparent
          ),
          color-mix(
              in srgb,
              var(--secondary) 58%,
              transparent
          )
      );

  box-shadow:
      0
      0
      0.45rem
      color-mix(
          in srgb,
          var(--primary) 28%,
          transparent
      );
}


.timeline-item.current
.timeline-link {
  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--secondary) 72%,
              transparent
          ),
          color-mix(
              in srgb,
              var(--primary) 55%,
              transparent
          )
      );
}


/* ==================================================
   LABELS
================================================== */

.timeline-label-area {
  position: relative;

  z-index: 2;

  display: flex;

  align-items: center;
  justify-content: center;
}


.timeline-label {
  color:
      rgba(
          211,
          202,
          239,
          0.8
      );

  font-size:
      0.58rem;

  font-weight:
      750;

  letter-spacing:
      0.07em;
}


.current-label {
  display:
      inline-flex;

  align-items:
      center;

  padding:
      0.14rem
      0.34rem;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--secondary) 52%,
          transparent
      );

  border-radius:
      999px;

  color:
      color-mix(
          in srgb,
          var(--secondary) 70%,
          white 30%
      );

  background:
      color-mix(
          in srgb,
          var(--secondary) 10%,
          transparent
      );

  font-size:
      0.45rem;

  font-weight:
      800;

  letter-spacing:
      0.08em;

  box-shadow:
      0
      0
      0.55rem
      color-mix(
          in srgb,
          var(--secondary) 18%,
          transparent
      );
}


/* ==================================================
   NODE
================================================== */

.timeline-node {
  position: relative;

  z-index: 2;

  width: 100%;

  display: grid;

  place-items: center;
}


.node-ring {
  position: relative;

  width: 1.25rem;

  aspect-ratio: 1;

  display: grid;

  place-items: center;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 74%,
          transparent
      );

  border-radius: 50%;

  background:
      radial-gradient(
          circle,
          color-mix(
              in srgb,
              var(--primary) 18%,
              rgba(8, 5, 28, 0.98)
          ),
          rgba(7, 4, 23, 0.98) 72%
      );

  box-shadow:
      0
      0
      0.45rem
      color-mix(
          in srgb,
          var(--primary) 40%,
          transparent
      );

  transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
}


.node-core {
  width: 34%;

  aspect-ratio: 1;

  border-radius: 50%;

  background:
      var(--primary);

  box-shadow:
      0
      0
      0.4rem
      var(--primary);
}


.timeline-item.selected
.node-ring {
  transform:
      scale(1.16);

  border-color:
      white;

  box-shadow:
      0
      0
      0
      3px
      color-mix(
          in srgb,
          var(--primary) 15%,
          transparent
      ),

      0
      0
      0.7rem
      color-mix(
          in srgb,
          var(--primary) 55%,
          transparent
      );
}


.timeline-item.current
.node-ring {
  border-color:
      var(--secondary);
}


.timeline-item.current
.node-core {
  background:
      var(--secondary);

  box-shadow:
      0
      0
      0.5rem
      var(--secondary);
}


.timeline-item.current
.node-ring::after {
  content: '';

  position: absolute;

  inset: -0.35rem;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--secondary) 38%,
          transparent
      );

  border-radius:
      50%;

  animation:
      currentPulse
      1.8s
      ease-out
      infinite;
}


.timeline-item.endpoint
.node-ring {
  border-color:
      var(--success);
}


.timeline-item.endpoint
.node-core {
  background:
      var(--success);

  box-shadow:
      0
      0
      0.5rem
      var(--success);
}


/* ==================================================
   TIMELINE INFO
================================================== */

.timeline-info {
  position: relative;

  z-index: 2;

  min-width: 0;
  width: 100%;

  display: flex;

  flex-direction: column;

  align-items: center;

  padding-top:
      0.12rem;
}


.timeline-time {
  color:
      rgba(
          230,
          233,
          247,
          0.84
      );

  font-size:
      0.58rem;

  font-weight:
      700;
}


.timeline-title {
  width: 100%;

  min-width: 0;

  margin-top:
      0.08rem;

  overflow: hidden;

  color:
      rgba(
          250,
          250,
          255,
          0.98
      );

  font-size:
      clamp(
          0.62rem,
          0.68vw,
          0.72rem
      );

  font-weight:
      750;

  line-height:
      1.2;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;
}


/* ==================================================
   METRICS
================================================== */

.selected-metrics {
  display: grid;

  gap:
      0.5rem;

  padding:
      0.58rem
      clamp(
          0.75rem,
          1vw,
          1rem
      )
      0.68rem;

  overflow: hidden;

  border-top:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 16%,
          transparent
      );

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--primary) 4%,
              rgba(4, 7, 20, 0.42)
          ),
          rgba(4, 7, 20, 0.24)
      );
}


.metric-line-row {
  display: grid;

  grid-template-columns:
    minmax(0, 5.6rem)
    minmax(0, 2.3rem)
    minmax(0, 1fr);

  align-items: center;

  gap:
      0.6rem;
}


.metric-line-label {
  min-width: 0;

  overflow: hidden;

  text-overflow:
      ellipsis;

  white-space:
      nowrap;

  color:
      rgba(
          194,
          201,
          224,
          0.64
      );

  font-size:
      clamp(
          0.48rem,
          0.55vw,
          0.56rem
      );

  font-weight:
      800;

  letter-spacing:
      0.1em;
}


.metric-line-value {
  color:
      rgba(
          251,
          251,
          255,
          0.98
      );

  font-size:
      clamp(
          0.58rem,
          0.66vw,
          0.68rem
      );

  font-weight:
      800;

  text-align:
      right;
}


.metric-line-track {
  position: relative;

  width: 100%;
  height: 3px;

  overflow: hidden;

  border-radius:
      999px;

  background:
      rgba(
          255,
          255,
          255,
          0.08
      );
}


.metric-line-fill {
  display: block;

  height: 100%;

  border-radius:
      inherit;

  transition:
      width
      260ms
      ease;
}


.metric-line-fill.confidence {
  background:
      linear-gradient(
          90deg,
          var(--primary),
          color-mix(
              in srgb,
              var(--primary) 42%,
              white
          )
      );

  box-shadow:
      0
      0
      0.55rem
      var(--primary);
}


.metric-line-fill.alignment {
  background:
      linear-gradient(
          90deg,
          var(--secondary),
          color-mix(
              in srgb,
              var(--secondary) 42%,
              white
          )
      );

  box-shadow:
      0
      0
      0.55rem
      var(--secondary);
}


/* ==================================================
   TURNING CONTENT
================================================== */

.turning-content {
  position: relative;

  z-index: 2;

  display: grid;

  grid-template-rows:
    auto
    minmax(0, 1fr)
    auto;

  overflow: hidden;
}


/* ==================================================
   TURNING ROUND HEADER
================================================== */

.turning-round-header {
  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr);

  align-items: center;

  gap:
      0.65rem;

  padding:
      0.62rem
      0.7rem;

  overflow: hidden;

  border-bottom:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 14%,
          transparent
      );

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--primary) 6%,
              transparent
          ),
          transparent
      );
}


.round-glyph {
  position: relative;

  width:
      clamp(
          1.75rem,
          2.1vw,
          2.1rem
      );

  aspect-ratio: 1;

  display: grid;

  place-items: center;
}


.glyph-orbit {
  position: absolute;

  inset: 0;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 38%,
          transparent
      );

  border-radius:
      50%;
}


.glyph-orbit::after {
  content: '';

  position: absolute;

  top: -2px;
  left: 50%;

  width: 4px;

  aspect-ratio: 1;

  border-radius:
      50%;

  background:
      var(--primary);

  box-shadow:
      0
      0
      0.4rem
      var(--primary);
}


.glyph-number {
  color:
      color-mix(
          in srgb,
          var(--primary) 70%,
          white 30%
      );

  font-family:
      Georgia,
      serif;

  font-size:
      0.84rem;
}


.round-heading {
  overflow: hidden;
}


.round-heading-top {
  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 0.5rem;

  margin-bottom:
      0.14rem;

  overflow: hidden;
}


.round-kicker {
  min-width: 0;

  overflow: hidden;

  text-overflow:
      ellipsis;

  white-space:
      nowrap;

  color:
      var(--primary);

  font-size:
      0.5rem;

  font-weight:
      800;

  letter-spacing:
      0.1em;
}


.round-current-badge {
  flex:
      0
      0
      auto;

  display:
      inline-flex;

  align-items:
      center;

  gap:
      0.28rem;

  color:
      var(--secondary);

  font-size:
      0.44rem;

  font-weight:
      800;

  letter-spacing:
      0.07em;
}


.round-current-pulse {
  width:
      0.35rem;

  aspect-ratio:
      1;

  border-radius:
      50%;

  background:
      var(--secondary);

  box-shadow:
      0
      0
      0.45rem
      var(--secondary);

  animation:
      currentDotPulse
      1.4s
      ease-in-out
      infinite;
}


.round-heading-title {
  display: block;

  min-width: 0;

  overflow: hidden;

  color:
      rgba(
          248,
          249,
          255,
          0.96
      );

  font-size:
      clamp(
          0.68rem,
          0.78vw,
          0.82rem
      );

  font-weight:
      750;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;
}


/* ==================================================
   DESCRIPTION SCROLL OWNER
================================================== */

.turning-description-wrap {
  overflow-x: hidden;
  overflow-y: auto;

  overscroll-behavior:
      contain;

  padding:
      0.65rem;

  scrollbar-width:
      thin;

  scrollbar-color:
      color-mix(
          in srgb,
          var(--primary) 38%,
          transparent
      )
      transparent;
}


.turning-description-wrap::-webkit-scrollbar {
  width:
      0.24rem;
}


.turning-description-wrap::-webkit-scrollbar-track {
  background:
      transparent;
}


.turning-description-wrap::-webkit-scrollbar-thumb {
  border-radius:
      999px;

  background:
      color-mix(
          in srgb,
          var(--primary) 38%,
          transparent
      );
}


/* ==================================================
   DESCRIPTION CARD
================================================== */

.selected-point-card {
  position: relative;

  width: 100%;

  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr);

  gap:
      0.6rem;

  padding:
      0.6rem;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 18%,
          transparent
      );

  border-radius:
      5px;

  background:
      linear-gradient(
          120deg,
          color-mix(
              in srgb,
              var(--primary) 5%,
              rgba(7, 8, 25, 0.74)
          ),
          rgba(5, 9, 20, 0.62)
      );
}


.round-description-card {
  min-height:
      min(
          100%,
          8rem
      );
}


.point-index {
  display: flex;

  flex-direction: column;

  align-items: center;

  gap:
      0.25rem;
}


.index-number {
  color:
      var(--primary);

  font-family:
      Georgia,
      serif;

  font-size:
      0.75rem;
}


.index-line {
  width:
      1px;

  flex:
      1;

  min-height:
      1rem;

  background:
      linear-gradient(
          180deg,
          color-mix(
              in srgb,
              var(--primary) 50%,
              transparent
          ),
          transparent
      );
}


.point-body {
  overflow: hidden;
}


.point-meta {
  min-width: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap:
      0.5rem;

  margin-bottom:
      0.42rem;

  padding-bottom:
      0.42rem;

  overflow: hidden;

  border-bottom:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 12%,
          transparent
      );
}


.point-time {
  min-width: 0;

  overflow: hidden;

  text-overflow:
      ellipsis;

  white-space:
      nowrap;

  color:
      color-mix(
          in srgb,
          var(--secondary) 66%,
          white 34%
      );

  font-size:
      0.52rem;

  font-weight:
      750;
}


.point-status {
  flex:
      0
      0
      auto;

  display:
      inline-flex;

  align-items:
      center;

  gap:
      0.28rem;

  color:
      rgba(
          190,
          201,
          228,
          0.56
      );

  font-size:
      0.42rem;

  font-weight:
      800;

  letter-spacing:
      0.07em;

  white-space:
      nowrap;
}


.status-dot {
  width:
      0.3rem;

  aspect-ratio:
      1;

  border-radius:
      50%;

  background:
      var(--primary);
}


.point-status.current {
  color:
      var(--secondary);
}


.point-status.current
.status-dot {
  background:
      var(--secondary);

  box-shadow:
      0
      0
      0.4rem
      var(--secondary);
}


.point-status.complete {
  color:
      var(--success);
}


.point-status.complete
.status-dot {
  background:
      var(--success);
}


.point-text {
  margin:
      0;

  min-width:
      0;

  color:
      rgba(
          232,
          235,
          248,
          0.88
      );

  font-size:
      clamp(
          0.59rem,
          0.67vw,
          0.7rem
      );

  font-weight:
      520;

  line-height:
      1.5;

  overflow-wrap:
      anywhere;
}


/* ==================================================
   TURNING FOOTER
================================================== */

.turning-footer {
  min-width: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap:
      0.5rem;

  padding:
      0.45rem
      0.7rem;

  overflow: hidden;

  border-top:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 14%,
          transparent
      );

  background:
      rgba(
          3,
          6,
          18,
          0.42
      );
}


.footer-hint {
  min-width: 0;

  overflow: hidden;

  text-overflow:
      ellipsis;

  white-space:
      nowrap;

  color:
      rgba(
          173,
          184,
          213,
          0.42
      );

  font-size:
      0.42rem;

  font-weight:
      800;

  letter-spacing:
      0.08em;
}


.footer-round {
  color:
      var(--primary);

  font-size:
      0.48rem;

  font-weight:
      800;

  letter-spacing:
      0.06em;

  white-space:
      nowrap;
}


/* ==================================================
   EMPTY
================================================== */

.full-empty {
  width: 100%;
  height: 100%;

  display: flex;

  align-items: center;
  justify-content: center;

  gap:
      0.8rem;

  padding:
      1rem;

  overflow: hidden;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 28%,
          transparent
      );

  border-radius:
      8px;

  background:
      linear-gradient(
          145deg,
          rgba(7, 5, 24, 0.95),
          rgba(3, 7, 18, 0.95)
      );
}


.full-empty-mark {
  flex:
      0
      0
      auto;

  color:
      var(--primary);

  font-size:
      1.4rem;

  text-shadow:
      0
      0
      0.8rem
      var(--primary);
}


.full-empty-copy {
  display: flex;

  flex-direction: column;

  gap:
      0.3rem;

  overflow:
      hidden;
}


.full-empty-title {
  overflow:
      hidden;

  text-overflow:
      ellipsis;

  white-space:
      nowrap;

  color:
      var(--primary);

  font-size:
      0.7rem;

  font-weight:
      750;

  letter-spacing:
      0.08em;
}


.full-empty-description {
  overflow:
      hidden;

  text-overflow:
      ellipsis;

  white-space:
      nowrap;

  color:
      rgba(
          218,
          223,
          240,
          0.7
      );

  font-size:
      0.68rem;
}


/* ==================================================
   ANIMATIONS
================================================== */

@keyframes currentPulse {
  0% {
    transform:
        scale(0.75);

    opacity:
        0.9;
  }

  100% {
    transform:
        scale(1.5);

    opacity:
        0;
  }
}


@keyframes currentDotPulse {
  0%,
  100% {
    opacity:
        0.45;
  }

  50% {
    opacity:
        1;
  }
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 900px) {
  .timeline-frame {
    width:
        100%;

    margin-left:
        0;
  }


  .report-layout {
    grid-template-columns:
      minmax(0, 1fr);

    grid-template-rows:
      minmax(15rem, 1fr)
      minmax(11rem, 0.75fr);

    overflow-y:
        auto;

    overscroll-behavior:
        contain;
  }
}


@media (max-width: 620px) {
  .timeline-track {
    min-width:
        max(
            36rem,

            calc(
                var(--step-count)
                *
                7.5rem
            )
        );
  }


  .metric-line-row {
    grid-template-columns:
      minmax(0, 5rem)
      minmax(0, 2.2rem)
      minmax(0, 1fr);

    gap:
        0.4rem;
  }


  .turning-round-header {
    padding:
        0.55rem;
  }


  .turning-description-wrap {
    padding:
        0.5rem;
  }


  .point-meta {
    grid-template-columns:
      minmax(0, 1fr);

    align-items:
        start;
  }


  .point-status {
    justify-self:
        start;
  }
}


/* ==================================================
   SHORT LANDSCAPE
================================================== */

@media (max-height: 700px) and (orientation: landscape) {
  .timeline-viewport {
    padding:
        0.3rem
        0.55rem;
  }


  .timeline-track {
    min-height:
        5.5rem;
  }


  .selected-metrics {
    gap:
        0.34rem;

    padding:
        0.42rem
        0.65rem;
  }


  .turning-round-header {
    padding:
        0.45rem
        0.55rem;
  }


  .turning-description-wrap {
    padding:
        0.45rem;
  }


  .turning-footer {
    padding:
        0.35rem
        0.55rem;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {
  .timeline-item,
  .node-ring,
  .metric-line-fill,
  .timeline-item.current
  .node-ring::after,
  .round-current-pulse {
    transition:
        none;

    animation:
        none;
  }
}
</style>
