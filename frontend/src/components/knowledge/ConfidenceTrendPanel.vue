<script setup>
import {
  computed
} from 'vue'


/* ==================================================
   PROPS

   PRIMARY INPUT
   --------------------------------------------------

   The Reports parent passes:

   timeline: [
     {
       roundNumber,
       before,
       after,
       change,
       reason
     }
   ]

   This may be built from:

   1. discussion section idea-confidence progression
   2. report round confidence fallback


   OPTIONAL TREND SUPPORT
   --------------------------------------------------

   The component also accepts the Home-style format:

   trend: [
     {
       label,
       value
     }
   ]

   This keeps the chart compatible with both metric
   adapters without needing another rewrite later.
================================================== */

const props =
    defineProps({

      timeline: {
        type: Array,

        default:
            () => []
      },


      trend: {
        type: Array,

        default:
            () => []
      },


      finalConfidence: {
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
            '#5ce8ff'
      }
    })


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


function clampConfidence(
    value
) {

  const numeric =
      numberOrNull(
          value
      )


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


function sameNumber(
    first,
    second
) {

  const firstNumber =
      numberOrNull(
          first
      )


  const secondNumber =
      numberOrNull(
          second
      )


  if (
      firstNumber === null
      ||
      secondNumber === null
  ) {

    return false
  }


  return (
      Math.abs(
          firstNumber
          -
          secondNumber
      )
      <
      0.001
  )
}


/* ==================================================
   NORMALIZED HOME-STYLE TREND

   Format:

   [
     {
       label: 'Calibration',
       value: 48
     },

     {
       label: 'Round 1',
       value: 59
     }
   ]
================================================== */

const normalizedDirectTrend =
    computed(
        () => {

          return asArray(
              props.trend
          )
              .map(
                  (
                      point,
                      index
                  ) => {

                    const value =
                        clampConfidence(
                            point?.value
                            ??
                            point?.confidence
                            ??
                            point?.score
                        )


                    if (
                        value === null
                    ) {

                      return null
                    }


                    return {

                      key:
                          point?.key
                          ??
                          point?.id
                          ??
                          `trend-${index}`,

                      label:
                          point?.label
                          ??
                          point?.title
                          ??
                          (
                              index === 0
                                  ? 'Calibration'
                                  : `Round ${index}`
                          ),

                      value,

                      kind:
                          point?.kind
                          ??
                          (
                              index === 0
                                  ? 'initial'
                                  : 'round'
                          ),

                      isFinal:
                          point?.isFinal === true
                          ||
                          point?.is_final === true
                    }
                  }
              )
              .filter(
                  Boolean
              )
        }
    )


/* ==================================================
   NORMALIZE TIMELINE ROWS

   Supported normalized parent format:

   {
     roundNumber,
     before,
     after,
     change,
     reason
   }


   Also tolerates raw report round fields.
================================================== */

const normalizedTimeline =
    computed(
        () => {

          const rows =
              asArray(
                  props.timeline
              )
                  .map(
                      (
                          item,
                          index
                      ) => {

                        const nestedConfidence =
                            (
                                item?.confidence
                                &&
                                typeof item.confidence ===
                                'object'
                            )
                                ? item.confidence
                                : {}


                        const roundNumber =
                            numberOrNull(

                                item?.roundNumber

                                ??

                                item?.round_number

                                ??

                                item?.round?.number

                                ??

                                nestedConfidence?.roundNumber

                                ??

                                nestedConfidence?.round_number
                            )

                            ??

                            index + 1


                        return {

                          roundNumber,


                          before:
                              clampConfidence(

                                  item?.before

                                  ??

                                  item?.confidenceBefore

                                  ??

                                  item?.confidence_before

                                  ??

                                  nestedConfidence
                                      ?.previousConfidence

                                  ??

                                  nestedConfidence
                                      ?.previous_confidence
                              ),


                          after:
                              clampConfidence(

                                  item?.after

                                  ??

                                  item?.confidenceAfter

                                  ??

                                  item?.confidence_after

                                  ??

                                  nestedConfidence
                                      ?.confidence
                              ),


                          change:
                              numberOrNull(

                                  item?.change

                                  ??

                                  item?.confidenceChange

                                  ??

                                  item?.confidence_change

                                  ??

                                  nestedConfidence
                                      ?.change
                              ),


                          reason:

                              item?.reason

                              ??

                              item?.confidenceChangeReason

                              ??

                              item?.confidence_change_reason

                              ??

                              nestedConfidence
                                  ?.reason

                              ??

                              '',


                          originalIndex:
                          index
                        }
                      }
                  )
                  .sort(
                      (
                          first,
                          second
                      ) => {

                        const roundDifference =

                            first.roundNumber

                            -

                            second.roundNumber


                        if (
                            roundDifference !==
                            0
                        ) {

                          return roundDifference
                        }


                        return (

                            first.originalIndex

                            -

                            second.originalIndex
                        )
                      }
                  )


          let previousAfter =
              null


          return rows.map(
              row => {

                let before =
                    row.before


                let after =
                    row.after


                /* ==================================
                   ROUND CONTINUITY

                   Previous round after becomes the
                   next round before when omitted.
                ================================== */

                if (
                    before === null

                    &&

                    previousAfter !==
                    null
                ) {

                  before =
                      previousAfter
                }


                /* ==================================
                   RECONSTRUCT AFTER
                ================================== */

                if (
                    after === null

                    &&

                    before !== null

                    &&

                    row.change !== null
                ) {

                  after =
                      clampConfidence(

                          before

                          +

                          row.change
                      )
                }


                /* ==================================
                   RECONSTRUCT BEFORE
                ================================== */

                if (
                    before === null

                    &&

                    after !== null

                    &&

                    row.change !== null
                ) {

                  before =
                      clampConfidence(

                          after

                          -

                          row.change
                      )
                }


                if (
                    after !== null
                ) {

                  previousAfter =
                      after
                }


                return {
                  ...row,

                  before,

                  after
                }
              }
          )
        }
    )


/* ==================================================
   TIMELINE → CHART POINTS

   Example:

   timeline:

   [
     {
       roundNumber: 1,
       before: 48,
       after: 59
     },

     {
       roundNumber: 2,
       before: 59,
       after: 71
     }
   ]


   becomes:

   Calibration 48
   Round 1     59
   Round 2     71
================================================== */

const timelineChartData =
    computed(
        () => {

          const timeline =
              normalizedTimeline.value


          if (
              !timeline.length
          ) {

            return []
          }


          const result =
              []


          /* ========================================
             CALIBRATION / INITIAL VALUE
          ======================================== */

          const firstBefore =
              timeline

                  .map(
                      point =>
                          point.before
                  )

                  .find(
                      value =>
                          value !== null
                  )


          if (
              firstBefore !==
              undefined
          ) {

            result.push({

              key:
                  'calibration',

              label:
                  'Calibration',

              value:
              firstBefore,

              kind:
                  'initial'
            })
          }


          /* ========================================
             ROUND END VALUES
          ======================================== */

          timeline.forEach(
              point => {

                if (
                    point.after ===
                    null
                ) {

                  return
                }


                result.push({

                  key:
                      `round-${point.roundNumber}`,

                  label:
                      `Round ${point.roundNumber}`,

                  value:
                  point.after,

                  roundNumber:
                  point.roundNumber,

                  change:
                  point.change,

                  reason:
                  point.reason,

                  kind:
                      'round'
                })
              }
          )


          return result
        }
    )


/* ==================================================
   BASE CHART DATA

   Direct stage trend wins when explicitly supplied.

   Otherwise use the timeline adapter provided by the
   Reports parent.
================================================== */

const baseChartData =
    computed(
        () => {

          if (
              normalizedDirectTrend.value.length
          ) {

            return normalizedDirectTrend.value
          }


          return timelineChartData.value
        }
    )


/* ==================================================
   FINAL CHART DATA

   Screenshot target:

   Calibration
   Round 1
   Round 2
   Final


   RULES
   --------------------------------------------------

   1. Never duplicate final confidence.

   2. If the final confidence equals the existing last
      point, rename that last point to Final.

   3. If final confidence is genuinely different,
      append a separate Final point.

   4. Preserve all genuine intermediate round points.
================================================== */

const chartData =
    computed(
        () => {

          const result =
              baseChartData.value.map(
                  item => ({
                    ...item
                  })
              )


          const finalValue =
              clampConfidence(
                  props.finalConfidence
              )


          /* ========================================
             NO FINAL CONFIDENCE

             Keep existing data untouched.
          ======================================== */

          if (
              finalValue === null
          ) {

            return result
          }


          /* ========================================
             ONLY FINAL VALUE EXISTS
          ======================================== */

          if (
              !result.length
          ) {

            return [
              {
                key:
                    'final',

                label:
                    'Final',

                value:
                finalValue,

                kind:
                    'final',

                isFinal:
                    true
              }
            ]
          }


          const lastIndex =
              result.length -
              1


          const lastPoint =
              result[
                  lastIndex
                  ]


          /* ========================================
             FINAL ALREADY REPRESENTED

             Do not draw a duplicate horizontal point.

             Instead:

                 Round 3 76%
                 Final   76%

             becomes:

                 Final   76%
          ======================================== */

          if (
              sameNumber(
                  lastPoint.value,
                  finalValue
              )
          ) {

            result[
                lastIndex
                ] = {

              ...lastPoint,

              key:
                  'final',

              label:
                  'Final',

              kind:
                  'final',

              isFinal:
                  true
            }


            return result
          }


          /* ========================================
             DISTINCT FINAL OUTCOME

             Keep the last real round and append Final.
          ======================================== */

          result.push({

            key:
                'final',

            label:
                'Final',

            value:
            finalValue,

            kind:
                'final',

            isFinal:
                true
          })


          return result
        }
    )


/* ==================================================
   SVG DIMENSIONS
================================================== */

const chartWidth =
    600


const chartHeight =
    240


const plotLeft =
    62


const plotRight =
    578


const plotTop =
    26


const plotBottom =
    190


const plotWidth =
    plotRight
    -
    plotLeft


const plotHeight =
    plotBottom
    -
    plotTop


/* ==================================================
   AXIS TICKS
================================================== */

const yTicks = [
  100,
  75,
  50,
  25,
  0
]


/* ==================================================
   CHART POINTS
================================================== */

const chartPoints =
    computed(
        () => {

          const data =
              chartData.value


          if (
              !data.length
          ) {

            return []
          }


          /* ========================================
             SINGLE POINT
          ======================================== */

          if (
              data.length ===
              1
          ) {

            const item =
                data[0]


            return [
              {
                ...item,

                x:

                    plotLeft

                    +

                    plotWidth
                    /
                    2,


                y:

                    plotBottom

                    -

                    (
                        item.value
                        /
                        100
                    )

                    *

                    plotHeight
              }
            ]
          }


          /* ========================================
             MULTIPLE POINTS
          ======================================== */

          return data.map(
              (
                  item,
                  index
              ) => {

                const x =

                    plotLeft

                    +

                    (
                        index

                        /

                        (
                            data.length -
                            1
                        )
                    )

                    *

                    plotWidth


                const y =

                    plotBottom

                    -

                    (
                        item.value
                        /
                        100
                    )

                    *

                    plotHeight


                return {
                  ...item,

                  x,

                  y
                }
              }
          )
        }
    )


/* ==================================================
   LINE PATH
================================================== */

const linePath =
    computed(
        () => {

          if (
              !chartPoints.value.length
          ) {

            return ''
          }


          return chartPoints.value

              .map(
                  (
                      point,
                      index
                  ) =>

                      index ===
                      0

                          ? `M ${point.x} ${point.y}`

                          : `L ${point.x} ${point.y}`
              )

              .join(
                  ' '
              )
        }
    )


/* ==================================================
   AREA PATH
================================================== */

const areaPath =
    computed(
        () => {

          const points =
              chartPoints.value


          if (
              points.length <
              2
          ) {

            return ''
          }


          const first =
              points[0]


          const last =
              points[
              points.length -
              1
                  ]


          return (

              `${linePath.value} `

              +

              `L ${last.x} ${plotBottom} `

              +

              `L ${first.x} ${plotBottom} Z`
          )
        }
    )


/* ==================================================
   OVERALL TREND

   Final displayed confidence minus calibration.

   Example:

       Calibration 48
       Final       76

       result      +28%
================================================== */

const trend =
    computed(
        () => {

          if (
              chartData.value.length <
              2
          ) {

            return null
          }


          const first =
              numberOrNull(
                  chartData.value[0]?.value
              )


          const last =
              numberOrNull(

                  chartData.value[
                  chartData.value.length -
                  1
                      ]
                      ?.value
              )


          if (
              first === null
              ||
              last === null
          ) {

            return null
          }


          return (
              last
              -
              first
          )
        }
    )
</script>


<template>
  <section
      class="confidence-panel"
      :style="panelStyle"
  >
    <!-- ==================================================
         BACKGROUND
    =================================================== -->

    <div class="panel-grid" />

    <div class="ambient-glow" />


    <!-- ==================================================
         FRAME DETAILS
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
              r="2.2"
              fill="currentColor"
          />
        </svg>
      </span>


      <span class="header-title">
        CONFIDENCE OVER TIME
      </span>


      <div
          v-if="trend !== null"
          class="trend-chip"
          :class="{
            negative:
              trend < 0
          }"
      >
        {{
          trend >= 0
              ? '+'
              : ''
        }}{{ Math.round(trend) }}%
      </div>
    </header>


    <!-- ==================================================
         CHART
    =================================================== -->

    <div
        v-if="chartPoints.length"
        class="chart-wrapper"
    >
      <svg
          class="confidence-chart"
          :viewBox="`
            0
            0
            ${chartWidth}
            ${chartHeight}
          `"
          preserveAspectRatio="none"
          aria-hidden="true"
      >
        <!-- ==============================================
             DEFINITIONS
        =============================================== -->

        <defs>
          <linearGradient
              id="confidenceTimelineFill"
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
                offset="70%"
                stop-color="var(--primary)"
                stop-opacity="0.08"
            />

            <stop
                offset="100%"
                stop-color="var(--primary)"
                stop-opacity="0"
            />
          </linearGradient>


          <filter
              id="confidenceLineGlow"
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
          >
            <feGaussianBlur
                stdDeviation="3"
                result="blur"
            />

            <feMerge>
              <feMergeNode
                  in="blur"
              />

              <feMergeNode
                  in="SourceGraphic"
              />
            </feMerge>
          </filter>
        </defs>


        <!-- ==============================================
             HORIZONTAL GRID
        =============================================== -->

        <g class="grid-lines">
          <line
              v-for="tick in yTicks"
              :key="tick"
              :x1="plotLeft"
              :x2="plotRight"
              :y1="
                plotBottom
                -
                (tick / 100)
                *
                plotHeight
              "
              :y2="
                plotBottom
                -
                (tick / 100)
                *
                plotHeight
              "
          />
        </g>


        <!-- ==============================================
             VERTICAL GRID
        =============================================== -->

        <g class="vertical-grid-lines">
          <line
              v-for="point in chartPoints"
              :key="`grid-${point.x}`"
              :x1="point.x"
              :x2="point.x"
              :y1="plotTop"
              :y2="plotBottom"
          />
        </g>


        <!-- ==============================================
             AREA
        =============================================== -->

        <path
            v-if="areaPath"
            :d="areaPath"
            class="chart-area"
        />


        <!-- ==============================================
             LINE GLOW
        =============================================== -->

        <path
            v-if="linePath"
            :d="linePath"
            class="chart-line-glow"
        />


        <!-- ==============================================
             MAIN LINE
        =============================================== -->

        <path
            v-if="linePath"
            :d="linePath"
            class="chart-line"
        />


        <!-- ==============================================
             POINTS
        =============================================== -->

        <g
            v-for="(
              point,
              index
            ) in chartPoints"
            :key="`point-${index}`"
            class="chart-point"
        >
          <circle
              :cx="point.x"
              :cy="point.y"
              r="8"
              class="point-glow"
          />

          <circle
              :cx="point.x"
              :cy="point.y"
              r="4.2"
              class="point-outer"
          />

          <circle
              :cx="point.x"
              :cy="point.y"
              r="1.8"
              class="point-core"
          />


          <!-- ============================================
               VALUE
          ============================================= -->

          <text
              :x="point.x"
              :y="point.y - 15"
              text-anchor="middle"
              class="point-value"
          >
            {{ Math.round(point.value) }}%
          </text>


          <!-- ============================================
               LABEL
          ============================================= -->

          <text
              :x="point.x"
              :y="plotBottom + 29"
              text-anchor="middle"
              class="point-label"
          >
            {{ point.label }}
          </text>
        </g>


        <!-- ==============================================
             Y AXIS LABELS
        =============================================== -->

        <g class="axis-labels">
          <text
              v-for="tick in yTicks"
              :key="`label-${tick}`"
              :x="plotLeft - 17"
              :y="
                plotBottom
                -
                (tick / 100)
                *
                plotHeight
                +
                4
              "
              text-anchor="end"
          >
            {{ tick }}%
          </text>
        </g>
      </svg>
    </div>


    <!-- ==================================================
         EMPTY STATE
    =================================================== -->

    <div
        v-else
        class="empty-state"
    >
      <div class="empty-chart">
        <span class="empty-axis axis-x" />

        <span class="empty-axis axis-y" />

        <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
          <path
              d="
                M5 34
                L30 27
                L52 29
                L74 17
                L95 13
              "
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-dasharray="3 4"
          />
        </svg>
      </div>


      <span class="empty-title">
        CONFIDENCE DATA UNAVAILABLE
      </span>

      <span class="empty-copy">
        Confidence evolution will appear as the discussion progresses.
      </span>
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
   ROOT PANEL
================================================== */

.confidence-panel {
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

  /*
    Real panel radius, matching the reference card.
  */

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
          var(--primary) 25%,
          transparent
      );

  /*
    Actual inset spacing.

    Chart content never touches the outside frame.
  */

  padding:
      clamp(
          0.5rem,
          0.72vw,
          0.75rem
      )
      clamp(
          0.65rem,
          1vw,
          1rem
      )
      clamp(
          0.55rem,
          0.85vw,
          0.85rem
      );

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
          rgba(7, 6, 23, 0.95),
          rgba(3, 6, 18, 0.92)
      );

  box-shadow:
      inset
      0
      0
      1.4rem
      rgba(
          144,
          80,
          255,
          0.045
      ),
      0
      0
      0.9rem
      rgba(
          74,
          41,
          150,
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

  opacity: 0.16;

  background-image:
      linear-gradient(
          rgba(
              135,
              99,
              226,
              0.07
          )
          1px,
          transparent
          1px
      ),
      linear-gradient(
          90deg,
          rgba(
              76,
              137,
              211,
              0.05
          )
          1px,
          transparent
          1px
      );

  background-size:
      1.35rem
      1.35rem;
}


/* ==================================================
   AMBIENT GLOW
================================================== */

.ambient-glow {
  position: absolute;

  z-index: -1;

  right: -8%;
  bottom: -65%;

  width: 65%;
  aspect-ratio: 1;

  border-radius: 50%;

  pointer-events: none;

  background:
      radial-gradient(
          circle,
          color-mix(
              in srgb,
              var(--primary) 11%,
              transparent
          ),
          transparent 68%
      );

  filter:
      blur(
          0.8rem
      );
}


/* ==================================================
   FRAME CORNERS
================================================== */

.frame-corner {
  position: absolute;

  z-index: 10;

  width: 0.65rem;
  height: 0.65rem;

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
          0.65vw,
          0.65rem
      );

  border-bottom:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 16%,
          transparent
      );
}


/* ==================================================
   HEADER ICON
================================================== */

.header-icon {
  width:
      clamp(
          0.8rem,
          1vw,
          1rem
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


/* ==================================================
   HEADER TITLE
================================================== */

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

  font-weight: 600;

  letter-spacing:
      0.1em;

  white-space: nowrap;
}


/* ==================================================
   TREND
================================================== */

.trend-chip {
  justify-self: end;

  padding:
      0.16rem
      0.35rem;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--secondary) 26%,
          transparent
      );

  border-radius: 3px;

  color:
      var(--secondary);

  background:
      color-mix(
          in srgb,
          var(--secondary) 5%,
          transparent
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.3rem,
          0.4vw,
          0.42rem
      );

  letter-spacing:
      0.05em;
}


.trend-chip.negative {
  color:
      #ff718f;

  border-color:
      rgba(
          255,
          113,
          143,
          0.3
      );
}


/* ==================================================
   CHART WRAPPER
================================================== */

.chart-wrapper {
  min-width: 0;
  min-height: 0;

  position: relative;

  /*
    Additional chart breathing room inside the card.
  */

  padding:
      clamp(
          0.35rem,
          0.65vw,
          0.65rem
      )
      0
      0;

  overflow: hidden;
}


/* ==================================================
   SVG
================================================== */

.confidence-chart {
  display: block;

  width: 100%;
  height: 100%;

  min-height: 0;

  overflow: visible;
}


/* ==================================================
   GRID
================================================== */

.grid-lines line {
  stroke:
      rgba(
          136,
          161,
          212,
          0.1
      );

  stroke-width: 1;

  vector-effect:
      non-scaling-stroke;
}


.vertical-grid-lines line {
  stroke:
      rgba(
          125,
          91,
          210,
          0.055
      );

  stroke-width: 1;

  stroke-dasharray:
      2 5;

  vector-effect:
      non-scaling-stroke;
}


/* ==================================================
   AREA
================================================== */

.chart-area {
  fill:
      url(
      #confidenceTimelineFill
      );
}


/* ==================================================
   LINE
================================================== */

.chart-line-glow {
  fill: none;

  stroke:
      var(--primary);

  stroke-width: 5;

  opacity: 0.2;

  filter:
      url(
      #confidenceLineGlow
      );

  vector-effect:
      non-scaling-stroke;
}


.chart-line {
  fill: none;

  stroke:
      var(--primary);

  stroke-width: 1.5;

  vector-effect:
      non-scaling-stroke;

  filter:
      drop-shadow(
          0
          0
          0.18rem
          color-mix(
              in srgb,
              var(--primary) 60%,
              transparent
          )
      );
}


/* ==================================================
   POINTS
================================================== */

.point-glow {
  fill:
      color-mix(
          in srgb,
          var(--primary) 20%,
          transparent
      );

  filter:
      blur(
          2px
      );
}


.point-outer {
  fill:
      rgba(
          7,
          5,
          22,
          0.96
      );

  stroke:
      var(--primary);

  stroke-width: 1.1;

  vector-effect:
      non-scaling-stroke;
}


.point-core {
  fill:
      #f8efff;

  filter:
      drop-shadow(
          0
          0
          0.2rem
          var(--primary)
      );
}


/* ==================================================
   VALUES
================================================== */

.point-value {
  fill:
      rgba(
          245,
          240,
          255,
          0.92
      );

  font-family:
      monospace;

  font-size:
      13px;

  paint-order:
      stroke;

  stroke:
      rgba(
          4,
          5,
          17,
          0.8
      );

  stroke-width: 3px;

  stroke-linejoin:
      round;
}


/* ==================================================
   X LABELS
================================================== */

.point-label {
  fill:
      rgba(
          170,
          186,
          216,
          0.58
      );

  font-family:
      monospace;

  font-size:
      10px;

  letter-spacing:
      0.02em;
}


/* ==================================================
   Y LABELS
================================================== */

.axis-labels text {
  fill:
      rgba(
          160,
          178,
          211,
          0.5
      );

  font-family:
      monospace;

  font-size:
      9px;
}


/* ==================================================
   EMPTY STATE
================================================== */

.empty-state {
  min-width: 0;
  min-height: 0;

  display: flex;

  flex-direction: column;

  justify-content: center;
  align-items: center;

  gap: 0.4rem;

  padding: 1rem;

  text-align: center;
}


/* ==================================================
   EMPTY CHART
================================================== */

.empty-chart {
  position: relative;

  width:
      min(
          15rem,
          76%
      );

  height:
      clamp(
          2.6rem,
          7vh,
          4rem
      );

  margin-bottom: 0.25rem;

  color:
      rgba(
          166,
          108,
          255,
          0.3
      );

  opacity: 0.6;
}


.empty-chart svg {
  width: 100%;
  height: 100%;
}


.empty-axis {
  position: absolute;

  background:
      rgba(
          143,
          161,
          201,
          0.15
      );
}


.axis-x {
  left: 0;
  right: 0;
  bottom: 0;

  height: 1px;
}


.axis-y {
  left: 0;
  top: 0;
  bottom: 0;

  width: 1px;
}


/* ==================================================
   EMPTY COPY
================================================== */

.empty-title {
  color:
      var(--primary);

  font-family:
      monospace;

  font-size:
      clamp(
          0.38rem,
          0.48vw,
          0.5rem
      );

  letter-spacing:
      0.1em;
}


.empty-copy {
  max-width: 24rem;

  color:
      rgba(
          194,
          205,
          230,
          0.4
      );

  font-size:
      clamp(
          0.44rem,
          0.58vw,
          0.6rem
      );

  line-height: 1.5;
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 900px) {
  .confidence-panel {
    padding:
        0.45rem
        0.55rem
        0.55rem;
  }


  .point-value {
    font-size: 11px;
  }


  .point-label {
    font-size: 8px;
  }


  .axis-labels text {
    font-size: 8px;
  }
}


@media (max-width: 620px) {
  .trend-chip {
    display: none;
  }


  .confidence-chart {
    min-width: 34rem;
  }


  .chart-wrapper {
    overflow-x: auto;

    scrollbar-width: none;
  }


  .chart-wrapper::-webkit-scrollbar {
    display: none;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {
  .chart-line,
  .chart-line-glow,
  .chart-point {
    animation: none;
    transition: none;
  }
}
</style>
