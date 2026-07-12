<script setup>
import {
  computed
} from 'vue'

import {
  useCurrentDiscussionStore
} from '@/stores/currentDiscussion.js'


/* ==================================================
   PROPS
================================================== */

const props =
    defineProps({

      /*
        Normalized timeline format:

        [
          {
            roundNumber: 1,
            before: null,
            after: 68
          },

          {
            roundNumber: 2,
            before: 68,
            after: 84
          }
        ]


        Also supports direct trend points:

        [
          {
            label: 'Round 1',
            value: 68
          }
        ]
      */

      confidenceTimeline: {
        type: Array,

        default:
            () => []
      },


      confidenceStart: {
        type: [
          Number,
          String
        ],

        default:
            null
      },


      confidenceEnd: {
        type: [
          Number,
          String
        ],

        default:
            null
      },


      alignmentScore: {
        type: [
          Number,
          String
        ],

        default:
            null
      },


      alignmentLabel: {
        type: String,

        default:
            ''
      },


      decisionStrength: {
        type: String,

        default:
            ''
      },


      decisionStrengthScore: {
        type: [
          Number,
          String
        ],

        default:
            null
      },


      primary: {
        type: String,

        default:
            '#a66cff'
      },


      secondary: {
        type: String,

        default:
            '#57f5bb'
      }
    })


/* ==================================================
   DISCUSSION STORE

   Older completed discussions may have no generated
   report rows.

   Their real metrics are available here:

   orderedSections[n].metrics.ideaConfidence

   orderedSections[n].metrics.alignment.score
================================================== */

const discussionStore =
    useCurrentDiscussionStore()


/* ==================================================
   STYLE
================================================== */

const panelStyle =
    computed(
        () => ({

          '--primary':
          props.primary,

          '--secondary':
          props.secondary
        })
    )


/* ==================================================
   HELPERS
================================================== */

function asArray(
    value
) {

  return Array.isArray(
      value
  )
      ? value
      : []
}


function numberOrNull(
    value
) {

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
      Number(
          value
      )


  return Number.isFinite(
      numeric
  )
      ? numeric
      : null
}


function clamp(
    value,
    minimum,
    maximum
) {

  return Math.max(

      minimum,

      Math.min(
          maximum,
          value
      )
  )
}


function clampPercentage(
    value
) {

  const numeric =
      numberOrNull(
          value
      )


  if (
      numeric ===
      null
  ) {

    return null
  }


  return clamp(
      numeric,
      0,
      100
  )
}


/* ==================================================
   DISCUSSION SECTIONS
================================================== */

const discussionSections =
    computed(
        () => [

          ...asArray(
              discussionStore
                  .orderedSections
          )
        ]
    )


const finalDiscussionSection =
    computed(
        () => (

            discussionSections.value.at(
                -1
            )

            ??

            discussionStore
                .currentSection

            ??

            null
        )
    )


/* ==================================================
   DISCUSSION CONFIDENCE POINTS

   Source:

   section.metrics.ideaConfidence
================================================== */

const discussionConfidencePoints =
    computed(
        () => {

          return discussionSections.value

              .map(
                  (
                      section,
                      index
                  ) => {

                    const value =
                        clampPercentage(

                            section
                                ?.metrics
                                ?.ideaConfidence
                        )


                    if (
                        value ===
                        null
                    ) {

                      return null
                    }


                    const roundNumber =

                        numberOrNull(

                            section
                                ?.metadata
                                ?.roundNumber
                        )

                        ??

                        index + 1


                    return {

                      roundNumber,

                      label:
                          `Round ${roundNumber}`,

                      value
                    }
                  }
              )

              .filter(
                  Boolean
              )
        }
    )


/* ==================================================
   PROP TIMELINE VALUES

   Supports:

   {
     before,
     after
   }

   and:

   {
     value
   }
================================================== */

const propTimelineValues =
    computed(
        () => {

          const values =
              []


          asArray(
              props.confidenceTimeline
          )
              .forEach(
                  point => {

                    const directValue =
                        clampPercentage(
                            point?.value
                        )


                    if (
                        directValue !==
                        null
                    ) {

                      values.push(
                          directValue
                      )


                      return
                    }


                    const before =
                        clampPercentage(
                            point?.before
                        )


                    const after =
                        clampPercentage(
                            point?.after
                        )


                    /*
                      Only use the first before value.

                      Later before values usually duplicate
                      the previous round's after score.
                    */

                    if (
                        before !==
                        null

                        &&

                        !values.length
                    ) {

                      values.push(
                          before
                      )
                    }


                    if (
                        after !==
                        null
                    ) {

                      values.push(
                          after
                      )
                    }
                  }
              )


          return values
        }
    )


/* ==================================================
   RESOLVED TIMELINE VALUES

   Priority:

   1. explicit timeline prop
   2. discussion section confidence scores
================================================== */

const timelineValues =
    computed(
        () => {

          if (
              propTimelineValues.value.length
          ) {

            return propTimelineValues.value
          }


          return discussionConfidencePoints.value
              .map(
                  point =>
                      point.value
              )
        }
    )


/* ==================================================
   CONFIDENCE START

   Priority:

   1. explicit prop
   2. first timeline value
   3. first discussion section score
================================================== */

const resolvedConfidenceStart =
    computed(
        () => (

            clampPercentage(
                props.confidenceStart
            )

            ??

            timelineValues.value[0]

            ??

            discussionConfidencePoints.value[0]
                ?.value

            ??

            null
        )
    )


/* ==================================================
   CONFIDENCE END

   Priority:

   1. explicit prop
   2. final timeline value
   3. final discussion section score
================================================== */

const resolvedConfidenceEnd =
    computed(
        () => (

            clampPercentage(
                props.confidenceEnd
            )

            ??

            timelineValues.value.at(
                -1
            )

            ??

            discussionConfidencePoints.value.at(
                -1
            )
                ?.value

            ??

            null
        )
    )


/* ==================================================
   CONFIDENCE CHANGE
================================================== */

const confidenceChange =
    computed(
        () => {

          if (
              resolvedConfidenceStart.value ===
              null

              ||

              resolvedConfidenceEnd.value ===
              null
          ) {

            return null
          }


          return (

              resolvedConfidenceEnd.value

              -

              resolvedConfidenceStart.value
          )
        }
    )


/* ==================================================
   CONFIDENCE DISPLAY
================================================== */

const confidenceRange =
    computed(
        () => {

          if (
              resolvedConfidenceStart.value ===
              null

              ||

              resolvedConfidenceEnd.value ===
              null
          ) {

            return '—'
          }


          return (

              `${Math.round(
                  resolvedConfidenceStart.value
              )}%`

              +

              ' → '

              +

              `${Math.round(
                  resolvedConfidenceEnd.value
              )}%`
          )
        }
    )


const confidenceChangeLabel =
    computed(
        () => {

          if (
              confidenceChange.value ===
              null
          ) {

            return 'NO DATA'
          }


          const rounded =
              Math.round(
                  confidenceChange.value
              )


          if (
              rounded >
              0
          ) {

            return `+${rounded}%`
          }


          return `${rounded}%`
        }
    )


/* ==================================================
   ALIGNMENT FALLBACK

   Source:

   final section
   .metrics
   .alignment
   .score
================================================== */

const discussionAlignmentScore =
    computed(
        () =>

            clampPercentage(

                finalDiscussionSection.value
                    ?.metrics
                    ?.alignment
                    ?.score
            )
    )


/* ==================================================
   RESOLVED ALIGNMENT
================================================== */

const normalizedAlignment =
    computed(
        () => (

            clampPercentage(
                props.alignmentScore
            )

            ??

            discussionAlignmentScore.value

            ??

            null
        )
    )


const alignmentDisplay =
    computed(
        () => {

          if (
              normalizedAlignment.value ===
              null
          ) {

            return '—'
          }


          return `${Math.round(
              normalizedAlignment.value
          )}%`
        }
    )


/* ==================================================
   ALIGNMENT LABEL
================================================== */

const resolvedAlignmentLabel =
    computed(
        () => {

          if (
              props.alignmentLabel
                  ?.trim()
          ) {

            return props.alignmentLabel
                .trim()
                .toUpperCase()
          }


          const score =
              normalizedAlignment.value


          if (
              score ===
              null
          ) {

            return 'NO DATA'
          }


          if (
              score >=
              80
          ) {

            return 'STRONGLY ALIGNED'
          }


          if (
              score >=
              65
          ) {

            return 'ALIGNED'
          }


          if (
              score >=
              45
          ) {

            return 'MIXED'
          }


          return 'DIVIDED'
        }
    )


/* ==================================================
   DECISION STRENGTH SCORE

   Explicit score wins.

   Fallback:

   average of available final confidence and
   alignment score.

   No artificial 65 fallback.
================================================== */

const normalizedDecisionStrengthScore =
    computed(
        () => {

          const explicit =
              clampPercentage(
                  props.decisionStrengthScore
              )


          if (
              explicit !==
              null
          ) {

            return explicit
          }


          const values = [

            resolvedConfidenceEnd.value,

            normalizedAlignment.value

          ]
              .filter(
                  value =>
                      value !==
                      null
              )


          if (
              !values.length
          ) {

            return null
          }


          return (

              values.reduce(
                  (
                      total,
                      value
                  ) =>

                      total +
                      value,

                  0
              )

              /

              values.length
          )
        }
    )


/* ==================================================
   DECISION STRENGTH LABEL

   Kept consistent with the current parent logic.
================================================== */

const resolvedDecisionStrength =
    computed(
        () => {

          if (
              props.decisionStrength
                  ?.trim()
          ) {

            return props.decisionStrength
          }


          const score =
              normalizedDecisionStrengthScore.value


          if (
              score ===
              null
          ) {

            return '—'
          }


          if (
              score >=
              80
          ) {

            return 'High'
          }


          if (
              score >=
              60
          ) {

            return 'Moderate'
          }


          return 'Low'
        }
    )


/* ==================================================
   CHART VALUES
================================================== */

const chartValues =
    computed(
        () => {

          if (
              timelineValues.value.length >
              1
          ) {

            return timelineValues.value
          }


          if (
              resolvedConfidenceStart.value !==
              null

              &&

              resolvedConfidenceEnd.value !==
              null
          ) {

            return [

              resolvedConfidenceStart.value,

              resolvedConfidenceEnd.value
            ]
          }


          return []
        }
    )


/* ==================================================
   CONFIDENCE SPARKLINE

   IMPORTANT:

   Y axis is fixed to the real 0–100 score range.

   The previous version normalized using local min/max,
   which visually exaggerated small movements.

   Example:

   88 → 92

   must look like a 4-point move,
   not a full-height chart swing.
================================================== */

const sparklinePoints =
    computed(
        () => {

          const values =
              chartValues.value


          if (
              values.length <
              2
          ) {

            return []
          }


          return values.map(
              (
                  rawValue,
                  index
              ) => {

                const value =
                    clamp(
                        rawValue,
                        0,
                        100
                    )


                const x =

                    5

                    +

                    (
                        index

                        /

                        (
                            values.length -
                            1
                        )
                    )

                    *

                    90


                /*
                  100 = top
                  0   = bottom
                */

                const y =

                    38

                    -

                    (
                        value
                        /
                        100
                    )

                    *

                    28


                return {

                  x,

                  y,

                  value
                }
              }
          )
        }
    )


const sparklinePath =
    computed(
        () => {

          if (
              !sparklinePoints.value.length
          ) {

            return ''
          }


          return sparklinePoints.value

              .map(
                  (
                      point,
                      index
                  ) => {

                    return (

                        index ===
                        0

                            ? `M ${point.x} ${point.y}`

                            : `L ${point.x} ${point.y}`
                    )
                  }
              )

              .join(
                  ' '
              )
        }
    )


const sparklineAreaPath =
    computed(
        () => {

          if (
              !sparklinePoints.value.length
          ) {

            return ''
          }


          const first =
              sparklinePoints.value[0]


          const last =
              sparklinePoints.value.at(
                  -1
              )


          return (

              `${sparklinePath.value} `

              +

              `L ${last.x} 44 `

              +

              `L ${first.x} 44 Z`
          )
        }
    )


/* ==================================================
   ALIGNMENT ARC GEOMETRY

   Semicircle represents 100%.

   The visible progress arc represents the actual
   alignment score.
================================================== */

const alignmentArcLength =
    126


const alignmentArcOffset =
    computed(
        () => {

          const score =
              normalizedAlignment.value
              ??
              0


          return (

              alignmentArcLength

              -

              (
                  score
                  /
                  100
              )

              *

              alignmentArcLength
          )
        }
    )


/* ==================================================
   DECISION STRENGTH BARS

   Four 25-point bands.

   Example score: 68

   bar 1 = 100%
   bar 2 = 100%
   bar 3 = 72%
   bar 4 = 0%

   This makes the bars a real segmented score display.
================================================== */

const decisionBars =
    computed(
        () => {

          const score =
              normalizedDecisionStrengthScore.value


          const heights = [

            42,
            58,
            76,
            94

          ]


          if (
              score ===
              null
          ) {

            return heights.map(
                (
                    height,
                    index
                ) => ({

                  key:
                  index,

                  height,

                  fill:
                      0
                })
            )
          }


          return heights.map(
              (
                  height,
                  index
              ) => {

                const bandStart =
                    index
                    *
                    25


                const bandFill =
                    clamp(

                        (
                            (
                                score
                                -
                                bandStart
                            )

                            /
                            25
                        )

                        *

                        100,

                        0,

                        100
                    )


                return {

                  key:
                  index,

                  height,

                  fill:
                  bandFill
                }
              }
          )
        }
    )


/* ==================================================
   DATA STATES
================================================== */

const hasConfidenceData =
    computed(
        () =>

            sparklinePoints.value.length >
            0
    )


const hasAlignmentData =
    computed(
        () =>

            normalizedAlignment.value !==
            null
    )


const hasDecisionData =
    computed(
        () =>

            normalizedDecisionStrengthScore.value !==
            null
    )
</script>


<template>
  <section
      class="outcome-panel"
      :style="panelStyle"
  >
    <!-- ==================================================
         BACKGROUND
    =================================================== -->

    <div class="panel-grid" />

    <div class="ambient-glow" />


    <!-- ==================================================
         FRAME CORNERS
    =================================================== -->

    <span class="frame-corner corner-tl" />

    <span class="frame-corner corner-tr" />

    <span class="frame-corner corner-bl" />

    <span class="frame-corner corner-br" />


    <!-- ==================================================
         HEADER
    =================================================== -->

    <header class="panel-header">
      <span class="header-icon">
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
          <path
              d="
                M12 2
                L14.5 9.5
                L22 12
                L14.5 14.5
                L12 22
                L9.5 14.5
                L2 12
                L9.5 9.5
                Z
              "
              fill="none"
              stroke="currentColor"
              stroke-width="1.3"
          />

          <circle
              cx="12"
              cy="12"
              r="2"
              fill="currentColor"
          />
        </svg>
      </span>


      <span class="header-title">
        KEY OUTCOME
      </span>


      <span class="header-trace" />
    </header>


    <!-- ==================================================
         METRICS
    =================================================== -->

    <div class="metrics-grid">
      <!-- ================================================
           CONFIDENCE
      ================================================= -->

      <article class="metric-cell confidence-cell">
        <div class="metric-heading">
          <span class="metric-label">
            CONFIDENCE
          </span>

          <span class="metric-label">
            EVOLUTION
          </span>
        </div>


        <div class="confidence-main">
          <span class="confidence-range">
            {{ confidenceRange }}
          </span>


          <span
              class="confidence-change"
              :class="{
                negative:
                  confidenceChange !== null
                  &&
                  confidenceChange < 0,

                neutral:
                  confidenceChange === 0
              }"
          >
            {{ confidenceChangeLabel }}
          </span>
        </div>


        <div class="confidence-chart">
          <svg
              viewBox="0 0 100 44"
              preserveAspectRatio="none"
              aria-hidden="true"
          >
            <defs>
              <linearGradient
                  id="confidenceArea"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
              >
                <stop
                    offset="0%"
                    stop-color="var(--primary)"
                    stop-opacity="0.32"
                />

                <stop
                    offset="100%"
                    stop-color="var(--primary)"
                    stop-opacity="0"
                />
              </linearGradient>
            </defs>


            <!-- ==========================================
                 25 / 50 / 75 GUIDES
            =========================================== -->

            <g class="score-guides">
              <line
                  x1="0"
                  x2="100"
                  y1="31"
                  y2="31"
              />

              <line
                  x1="0"
                  x2="100"
                  y1="24"
                  y2="24"
              />

              <line
                  x1="0"
                  x2="100"
                  y1="17"
                  y2="17"
              />
            </g>


            <path
                v-if="sparklineAreaPath"
                :d="sparklineAreaPath"
                class="chart-area"
            />


            <path
                v-if="sparklinePath"
                :d="sparklinePath"
                class="chart-line"
            />


            <template
                v-for="(
                  point,
                  index
                ) in sparklinePoints"
                :key="index"
            >
              <circle
                  :cx="point.x"
                  :cy="point.y"
                  r="1.7"
                  class="chart-node-outer"
              />

              <circle
                  :cx="point.x"
                  :cy="point.y"
                  r="0.75"
                  class="chart-node-core"
              />
            </template>
          </svg>


          <div
              v-if="!hasConfidenceData"
              class="chart-empty"
          >
            NO TIMELINE
          </div>
        </div>
      </article>


      <!-- ================================================
           ALIGNMENT
      ================================================= -->

      <article class="metric-cell alignment-cell">
        <div class="metric-heading">
          <span class="metric-label">
            ALIGNMENT
          </span>

          <span class="metric-label">
            SCORE
          </span>
        </div>


        <div class="alignment-main">
          <span class="alignment-score">
            {{ alignmentDisplay }}
          </span>


          <span class="alignment-label">
            {{ resolvedAlignmentLabel }}
          </span>
        </div>


        <!-- ==============================================
             REAL SCORE ARC
        =============================================== -->

        <div class="alignment-visual">
          <svg
              viewBox="0 0 120 64"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
          >
            <!-- full semicircle track -->

            <path
                d="
                  M10 56
                  A50 50
                  0 0 1
                  110 56
                "
                class="alignment-track"
                pathLength="126"
            />


            <!-- score progress -->

            <path
                v-if="hasAlignmentData"
                d="
                  M10 56
                  A50 50
                  0 0 1
                  110 56
                "
                class="alignment-progress"
                pathLength="126"
                :stroke-dasharray="alignmentArcLength"
                :stroke-dashoffset="alignmentArcOffset"
            />


            <!-- center guides -->

            <line
                x1="60"
                y1="11"
                x2="60"
                y2="18"
                class="alignment-tick"
            />

            <line
                x1="25"
                y1="28"
                x2="31"
                y2="32"
                class="alignment-tick"
            />

            <line
                x1="95"
                y1="28"
                x2="89"
                y2="32"
                class="alignment-tick"
            />


            <!-- horizon -->

            <line
                x1="13"
                y1="56"
                x2="107"
                y2="56"
                class="alignment-horizon-line"
            />


            <!-- center node -->

            <rect
                x="57.5"
                y="53.5"
                width="5"
                height="5"
                class="alignment-node-shape"
                transform="
                  rotate(
                    45
                    60
                    56
                  )
                "
            />
          </svg>
        </div>
      </article>


      <!-- ================================================
           DECISION STRENGTH
      ================================================= -->

      <article class="metric-cell decision-cell">
        <div class="metric-heading">
          <span class="metric-label">
            DECISION
          </span>

          <span class="metric-label">
            STRENGTH
          </span>
        </div>


        <span
            class="decision-value"
            :class="{
              unavailable:
                !hasDecisionData
            }"
        >
          {{ resolvedDecisionStrength }}
        </span>


        <!-- ==============================================
             REAL SEGMENTED SCORE METER
        =============================================== -->

        <div
            class="strength-chart"
            :class="{
              unavailable:
                !hasDecisionData
            }"
        >
          <div
              v-for="bar in decisionBars"
              :key="bar.key"
              class="strength-column"
          >
            <div
                class="strength-bar"
                :style="{
                  '--bar-height':
                    `${bar.height}%`
                }"
            >
              <div
                  class="strength-fill"
                  :style="{
                    '--fill-height':
                      `${bar.fill}%`
                  }"
              >
                <span
                    v-if="bar.fill > 0"
                    class="bar-cap"
                />
              </div>
            </div>


            <div class="micro-bars">
              <span
                  :class="{
                    active:
                      bar.fill > 0
                  }"
              />

              <span
                  :class="{
                    active:
                      bar.fill >= 35
                  }"
              />

              <span
                  :class="{
                    active:
                      bar.fill >= 65
                  }"
              />

              <span
                  :class="{
                    active:
                      bar.fill >= 95
                  }"
              />
            </div>
          </div>
        </div>
      </article>
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
================================================== */

.outcome-panel {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  display: grid;

  grid-template-rows:
    auto
    minmax(0, 1fr);

  border-radius:
      clamp(
          8px,
          0.75vw,
          12px
      );

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 27%,
          transparent
      );

  padding:
      clamp(
          0.5rem,
          0.72vw,
          0.75rem
      )
      clamp(
          0.55rem,
          0.9vw,
          0.9rem
      )
      clamp(
          0.55rem,
          0.85vw,
          0.85rem
      );

  color:
      rgba(
          239,
          242,
          255,
          0.94
      );

  background:
      linear-gradient(
          145deg,
          rgba(7, 6, 23, 0.94),
          rgba(3, 6, 18, 0.91)
      );

  box-shadow:
      inset
      0
      0
      1.2rem
      rgba(
          139,
          80,
          255,
          0.045
      ),

      0
      0
      0.9rem
      rgba(
          91,
          47,
          166,
          0.08
      );

  isolation: isolate;
}


/* ==================================================
   BACKGROUND GRID
================================================== */

.panel-grid {
  position: absolute;

  z-index: -2;

  inset: 0;

  pointer-events: none;

  opacity: 0.18;

  background-image:
      linear-gradient(
          rgba(
              125,
              93,
              219,
              0.07
          )
          1px,
          transparent
          1px
      ),

      linear-gradient(
          90deg,
          rgba(
              89,
              143,
              215,
              0.05
          )
          1px,
          transparent
          1px
      );

  background-size:
      1.2rem
      1.2rem;
}


/* ==================================================
   AMBIENT GLOW
================================================== */

.ambient-glow {
  position: absolute;

  z-index: -1;

  right: -14%;
  bottom: -34%;

  width: 65%;

  aspect-ratio: 1;

  border-radius:
      50%;

  pointer-events: none;

  background:
      radial-gradient(
          circle,

          color-mix(
              in srgb,
              var(--primary) 11%,
              transparent
          ),

          transparent 66%
      );

  filter:
      blur(0.8rem);
}


/* ==================================================
   FRAME CORNERS
================================================== */

.frame-corner {
  position: absolute;

  z-index: 10;

  width:
      0.65rem;

  height:
      0.65rem;

  pointer-events: none;
}


.corner-tl {
  left: 0;
  top: 0;

  border-left:
      1px solid
      var(--primary);

  border-top:
      1px solid
      var(--primary);
}


.corner-tr {
  right: 0;
  top: 0;

  border-right:
      1px solid
      var(--secondary);

  border-top:
      1px solid
      var(--secondary);
}


.corner-bl {
  left: 0;
  bottom: 0;

  border-left:
      1px solid
      var(--secondary);

  border-bottom:
      1px solid
      var(--secondary);
}


.corner-br {
  right: 0;
  bottom: 0;

  border-right:
      1px solid
      var(--primary);

  border-bottom:
      1px solid
      var(--primary);
}


/* ==================================================
   HEADER
================================================== */

.panel-header {
  min-width: 0;

  position: relative;

  display: grid;

  grid-template-columns:
    auto
    auto
    minmax(0, 1fr);

  align-items: center;

  gap:
      clamp(
          0.35rem,
          0.55vw,
          0.55rem
      );

  padding:
      0.05rem
      0
      clamp(
          0.45rem,
          0.6vw,
          0.6rem
      );

  border-bottom:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 16%,
          transparent
      );
}


.header-icon {
  width:
      clamp(
          0.8rem,
          1vw,
          1rem
      );

  aspect-ratio:
      1;

  color:
      var(--primary);

  filter:
      drop-shadow(
          0
          0
          0.3rem

          color-mix(
              in srgb,
              var(--primary) 55%,
              transparent
          )
      );
}


.header-icon svg {
  display: block;

  width: 100%;
  height: 100%;
}


.header-title {
  color:
      var(--primary);

  font-family:
      monospace;

  font-size:
      clamp(
          0.4rem,
          0.54vw,
          0.56rem
      );

  font-weight:
      600;

  letter-spacing:
      0.11em;

  white-space:
      nowrap;
}


.header-trace {
  height:
      1px;

  background:
      linear-gradient(
          90deg,

          color-mix(
              in srgb,
              var(--primary) 20%,
              transparent
          ),

          transparent
      );
}


/* ==================================================
   METRIC GRID
================================================== */

.metrics-grid {
  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1.18fr)
    minmax(0, 0.88fr)
    minmax(0, 0.78fr);

  align-items:
      stretch;

  padding-top:
      clamp(
          0.45rem,
          0.7vw,
          0.7rem
      );

  overflow:
      hidden;
}


/* ==================================================
   SHARED METRIC CELL
================================================== */

.metric-cell {
  min-width: 0;
  min-height: 0;

  position:
      relative;

  overflow:
      hidden;

  padding:
      clamp(
          0.2rem,
          0.45vw,
          0.45rem
      )
      clamp(
          0.55rem,
          0.85vw,
          0.85rem
      );

  border-right:
      1px solid
      rgba(
          131,
          154,
          207,
          0.12
      );
}


.metric-cell:first-child {
  padding-left:
      clamp(
          0.15rem,
          0.3vw,
          0.3rem
      );
}


.metric-cell:last-child {
  border-right:
      0;

  padding-right:
      clamp(
          0.15rem,
          0.3vw,
          0.3rem
      );
}


/* ==================================================
   METRIC HEADINGS
================================================== */

.metric-heading {
  min-height:
      clamp(
          1.45rem,
          2.3vh,
          2rem
      );

  display:
      flex;

  flex-direction:
      column;

  justify-content:
      center;

  gap:
      0.06rem;
}


.metric-label {
  color:
      rgba(
          161,
          178,
          213,
          0.53
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.3rem,
          0.39vw,
          0.41rem
      );

  line-height:
      1.15;

  letter-spacing:
      0.08em;
}


/* ==================================================
   CONFIDENCE
================================================== */

.confidence-cell {
  display:
      grid;

  grid-template-rows:
    auto
    auto
    minmax(0, 1fr);
}


.confidence-main {
  display:
      flex;

  flex-direction:
      column;

  gap:
      clamp(
          0.12rem,
          0.25vw,
          0.25rem
      );

  margin-top:
      clamp(
          0.15rem,
          0.3vw,
          0.3rem
      );
}


.confidence-range {
  color:
      rgba(
          242,
          244,
          255,
          0.94
      );

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.75rem,
          1.15vw,
          1.1rem
      );

  white-space:
      nowrap;
}


.confidence-change {
  color:
      var(--secondary);

  font-family:
      monospace;

  font-size:
      clamp(
          0.45rem,
          0.58vw,
          0.62rem
      );

  text-shadow:
      0
      0
      0.4rem

      color-mix(
          in srgb,
          var(--secondary) 45%,
          transparent
      );
}


.confidence-change.negative {
  color:
      #ff708f;
}


.confidence-change.neutral {
  color:
      rgba(
          191,
          203,
          229,
          0.5
      );

  text-shadow:
      none;
}


/* ==================================================
   CONFIDENCE CHART
================================================== */

.confidence-chart {
  min-width: 0;
  min-height: 0;

  position:
      relative;

  align-self:
      end;

  width:
      100%;

  height:
      clamp(
          2.2rem,
          7vh,
          4.5rem
      );

  margin-top:
      0.25rem;

  overflow:
      hidden;

  border-bottom:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 15%,
          transparent
      );

  background:
      linear-gradient(
          180deg,
          transparent,

          color-mix(
              in srgb,
              var(--primary) 5%,
              transparent
          )
      );
}


.confidence-chart::before {
  content:
      '';

  position:
      absolute;

  inset:
      0;

  background-image:
      linear-gradient(
          rgba(
              166,
              108,
              255,
              0.07
          )
          1px,
          transparent
          1px
      ),

      linear-gradient(
          90deg,
          rgba(
              166,
              108,
              255,
              0.06
          )
          1px,
          transparent
          1px
      );

  background-size:
      0.8rem
      0.8rem;
}


.confidence-chart svg {
  position:
      relative;

  z-index:
      2;

  display:
      block;

  width:
      100%;

  height:
      100%;

  overflow:
      visible;
}


.score-guides line {
  stroke:
      rgba(
          160,
          180,
          224,
          0.08
      );

  stroke-width:
      0.5;

  stroke-dasharray:
      2 4;

  vector-effect:
      non-scaling-stroke;
}


.chart-area {
  fill:
      url(#confidenceArea);
}


.chart-line {
  fill:
      none;

  stroke:
      var(--primary);

  stroke-width:
      1.35;

  vector-effect:
      non-scaling-stroke;

  filter:
      drop-shadow(
          0
          0
          0.18rem
          var(--primary)
      );
}


.chart-node-outer {
  fill:
      rgba(
          6,
          5,
          20,
          0.94
      );

  stroke:
      var(--primary);

  stroke-width:
      0.8;

  vector-effect:
      non-scaling-stroke;
}


.chart-node-core {
  fill:
      var(--primary);
}


.chart-empty {
  position:
      absolute;

  inset:
      0;

  display:
      grid;

  place-items:
      center;

  color:
      rgba(
          167,
          181,
          214,
          0.25
      );

  font-family:
      monospace;

  font-size:
      0.35rem;

  letter-spacing:
      0.1em;
}


/* ==================================================
   ALIGNMENT
================================================== */

.alignment-cell {
  display:
      grid;

  grid-template-rows:
    auto
    auto
    minmax(0, 1fr);

  text-align:
      center;
}


.alignment-main {
  display:
      flex;

  flex-direction:
      column;

  align-items:
      center;

  gap:
      clamp(
          0.15rem,
          0.28vw,
          0.28rem
      );

  margin-top:
      clamp(
          0.12rem,
          0.25vw,
          0.25rem
      );
}


.alignment-score {
  color:
      var(--primary);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.95rem,
          1.7vw,
          1.55rem
      );

  line-height:
      1;

  text-shadow:
      0
      0
      0.7rem

      color-mix(
          in srgb,
          var(--primary) 40%,
          transparent
      );
}


.alignment-label {
  color:
      var(--secondary);

  font-family:
      monospace;

  font-size:
      clamp(
          0.33rem,
          0.44vw,
          0.46rem
      );

  letter-spacing:
      0.05em;
}


/* ==================================================
   ALIGNMENT SCORE VISUAL
================================================== */

.alignment-visual {
  min-width: 0;
  min-height: 0;

  display:
      grid;

  place-items:
      end center;

  margin-top:
      0.15rem;

  overflow:
      hidden;
}


.alignment-visual svg {
  width:
      min(
          100%,
          8rem
      );

  height:
      100%;

  min-height:
      2.2rem;

  overflow:
      visible;
}


.alignment-track {
  fill:
      none;

  stroke:
      rgba(
          133,
          151,
          194,
          0.12
      );

  stroke-width:
      5;

  stroke-linecap:
      butt;

  vector-effect:
      non-scaling-stroke;
}


.alignment-progress {
  fill:
      none;

  stroke:
      var(--primary);

  stroke-width:
      5;

  stroke-linecap:
      butt;

  vector-effect:
      non-scaling-stroke;

  transition:
      stroke-dashoffset
      700ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );

  filter:
      drop-shadow(
          0
          0
          0.22rem
          var(--primary)
      );
}


.alignment-tick {
  stroke:
      color-mix(
          in srgb,
          var(--secondary) 26%,
          transparent
      );

  stroke-width:
      0.8;

  vector-effect:
      non-scaling-stroke;
}


.alignment-horizon-line {
  stroke:
      color-mix(
          in srgb,
          var(--primary) 30%,
          transparent
      );

  stroke-width:
      0.7;

  vector-effect:
      non-scaling-stroke;
}


.alignment-node-shape {
  fill:
      var(--primary);

  filter:
      drop-shadow(
          0
          0
          0.25rem
          var(--primary)
      );
}


/* ==================================================
   DECISION
================================================== */

.decision-cell {
  display:
      grid;

  grid-template-rows:
    auto
    auto
    minmax(0, 1fr);

  text-align:
      center;
}


.decision-value {
  margin-top:
      clamp(
          0.2rem,
          0.4vw,
          0.4rem
      );

  color:
      var(--primary);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.72rem,
          1.1vw,
          1rem
      );

  text-shadow:
      0
      0
      0.55rem

      color-mix(
          in srgb,
          var(--primary) 38%,
          transparent
      );
}


.decision-value.unavailable {
  color:
      rgba(
          191,
          203,
          229,
          0.4
      );

  text-shadow:
      none;
}


/* ==================================================
   STRENGTH CHART
================================================== */

.strength-chart {
  min-width: 0;
  min-height: 0;

  display:
      grid;

  grid-template-columns:
    repeat(
        4,
        minmax(0, 1fr)
    );

  align-items:
      end;

  gap:
      clamp(
          0.16rem,
          0.3vw,
          0.3rem
      );

  padding:
      0.35rem
      0
      0;

  overflow:
      hidden;
}


.strength-chart.unavailable {
  opacity:
      0.3;
}


.strength-column {
  min-width:
      0;

  height:
      100%;

  display:
      grid;

  grid-template-rows:
    minmax(0, 1fr)
    auto;

  gap:
      0.18rem;
}


/* ==================================================
   BAR TRACK
================================================== */

.strength-bar {
  position:
      relative;

  align-self:
      end;

  width:
      100%;

  height:
      var(--bar-height);

  min-height:
      0.25rem;

  overflow:
      hidden;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 15%,
          transparent
      );

  background:
      linear-gradient(
          180deg,
          rgba(
              136,
              151,
              196,
              0.08
          ),
          rgba(
              136,
              151,
              196,
              0.025
          )
      );
}


/* ==================================================
   BAR REAL FILL
================================================== */

.strength-fill {
  position:
      absolute;

  left:
      0;

  right:
      0;

  bottom:
      0;

  height:
      var(--fill-height);

  background:
      linear-gradient(
          180deg,

          color-mix(
              in srgb,
              var(--primary) 52%,
              transparent
          ),

          color-mix(
              in srgb,
              var(--primary) 12%,
              transparent
          )
      );

  transition:
      height
      700ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );

  box-shadow:
      inset
      0
      0
      0.3rem

      color-mix(
          in srgb,
          var(--primary) 18%,
          transparent
      );
}


.bar-cap {
  position:
      absolute;

  left:
      0;

  right:
      0;

  top:
      0;

  height:
      1px;

  background:
      var(--primary);

  box-shadow:
      0
      0
      0.35rem
      var(--primary);
}


/* ==================================================
   MICRO INDICATORS
================================================== */

.micro-bars {
  display:
      flex;

  flex-direction:
      column;

  gap:
      1px;
}


.micro-bars span {
  display:
      block;

  height:
      2px;

  background:
      color-mix(
          in srgb,
          var(--primary) 10%,
          transparent
      );

  transition:
      background
      180ms
      ease,
      box-shadow
      180ms
      ease;
}


.micro-bars span.active {
  background:
      color-mix(
          in srgb,
          var(--primary) 45%,
          transparent
      );

  box-shadow:
      0
      0
      0.14rem

      color-mix(
          in srgb,
          var(--primary) 28%,
          transparent
      );
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 900px) {
  .outcome-panel {
    padding:
        0.45rem
        0.55rem
        0.55rem;
  }


  .metrics-grid {
    grid-template-columns:
      minmax(0, 1.1fr)
      minmax(0, 0.8fr)
      minmax(0, 0.7fr);
  }


  .metric-cell {
    padding-left:
        0.4rem;

    padding-right:
        0.4rem;
  }
}


@media (max-width: 620px) {
  .metrics-grid {
    grid-template-columns:
      minmax(0, 1fr)
      minmax(0, 0.8fr);
  }


  .decision-cell {
    display:
        none;
  }


  .alignment-cell {
    border-right:
        0;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {
  .chart-line,
  .alignment-progress,
  .strength-fill {
    transition:
        none;

    animation:
        none;
  }
}
</style>
