<script setup>
import {
  computed
} from 'vue'


/* ==================================================
   PROPS
================================================== */

const props =
    defineProps({

      /*
        Overall alignment score.

        Example:
        64
      */

      score: {
        type: [
          Number,
          String
        ],

        default:
            null
      },


      /*
        NORMALIZED COUNTS

        {
          fullyAligned: 2,
          mostlyAligned: 2,
          split: 0,
          opposed: 1
        }


        OR RAW DISCUSSION ALIGNMENT

        {
          score: 64,
          support: 40,
          conditionalSupport: 40,
          mixed: 0,
          undecided: 0,
          oppose: 20
        }
      */

      breakdown: {
        type: [
          Object,
          Array
        ],

        default:
            () => ({})
      },


      /*
        Optional member total.

        Used when raw percentage data needs to be
        converted into member counts for the legend.
      */

      memberTotal: {
        type: [
          Number,
          String
        ],

        default:
            null
      },


      /*
        auto
        count
        percentage
      */

      breakdownMode: {
        type: String,

        default:
            'auto',

        validator:
            value => [

              'auto',
              'count',
              'percentage'

            ]
                .includes(
                    value
                )
      },


      primary: {
        type: String,

        default:
            '#a66cff'
      },


      secondary: {
        type: String,

        default:
            '#37a9ff'
      },


      success: {
        type: String,

        default:
            '#59f5c4'
      },


      warning: {
        type: String,

        default:
            '#ffb45c'
      },


      danger: {
        type: String,

        default:
            '#ff4f72'
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
          props.secondary,

          '--success':
          props.success,

          '--warning':
          props.warning,

          '--danger':
          props.danger
        })
    )


/* ==================================================
   HELPERS
================================================== */

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


function numberOrZero(
    value
) {

  return (
      numberOrNull(
          value
      )

      ??

      0
  )
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


function normalizeKey(
    value
) {

  return String(
      value
      ??
      ''
  )
      .trim()

      .replace(
          /([a-z])([A-Z])/g,
          '$1 $2'
      )

      .replace(
          /[_-]+/g,
          ' '
      )

      .replace(
          /\s+/g,
          ' '
      )

      .toLowerCase()
}


/* ==================================================
   ARRAY BREAKDOWN → OBJECT
================================================== */

function arrayToMap(
    values
) {

  const map =
      {}


  values.forEach(
      entry => {

        const key =
            normalizeKey(

                entry?.key

                ??

                entry?.type

                ??

                entry?.label

                ??

                entry?.name
            )


        if (
            !key
        ) {

          return
        }


        const value =
            numberOrNull(

                entry?.count

                ??

                entry?.value

                ??

                entry?.percentage

                ??

                entry?.percent
            )


        if (
            value !==
            null
        ) {

          map[
              key
              ] =
              value
        }
      }
  )


  return map
}


/* ==================================================
   RAW SOURCE
================================================== */

const rawSource =
    computed(
        () => {

          if (
              Array.isArray(
                  props.breakdown
              )
          ) {

            return arrayToMap(
                props.breakdown
            )
          }


          if (
              props.breakdown
              &&
              typeof props.breakdown ===
              'object'
          ) {

            return props.breakdown
          }


          return {}
        }
    )


/* ==================================================
   VALUE LOOKUP
================================================== */

function valueFromKeys(
    source,
    possibleKeys
) {

  /*
    Exact lookup.
  */

  for (
      const key
      of possibleKeys
      ) {

    const value =
        numberOrNull(
            source?.[
                key
                ]
        )


    if (
        value !==
        null
    ) {

      return value
    }
  }


  /*
    Normalized lookup.
  */

  const normalized =
      {}


  Object.entries(
      source
  )
      .forEach(
          ([
             key,
             value
           ]) => {

            normalized[
                normalizeKey(
                    key
                )
                ] =
                value
          }
      )


  for (
      const key
      of possibleKeys
      ) {

    const value =
        numberOrNull(

            normalized[
                normalizeKey(
                    key
                )
                ]
        )


    if (
        value !==
        null
    ) {

      return value
    }
  }


  return null
}


/* ==================================================
   DATA MODE DETECTION
================================================== */

const looksLikeRawDiscussionAlignment =
    computed(
        () => {

          const normalizedKeys =
              Object.keys(
                  rawSource.value
              )
                  .map(
                      normalizeKey
                  )


          return (

              normalizedKeys.includes(
                  'support'
              )

              ||

              normalizedKeys.includes(
                  'conditional support'
              )

              ||

              normalizedKeys.includes(
                  'mixed'
              )

              ||

              normalizedKeys.includes(
                  'undecided'
              )

              ||

              normalizedKeys.includes(
                  'oppose'
              )
          )
        }
    )


const resolvedMode =
    computed(
        () => {

          if (
              props.breakdownMode !==
              'auto'
          ) {

            return props.breakdownMode
          }


          return looksLikeRawDiscussionAlignment.value
              ? 'percentage'
              : 'count'
        }
    )


/* ==================================================
   MEMBER TOTAL
================================================== */

const normalizedMemberTotal =
    computed(
        () => {

          const value =
              numberOrNull(
                  props.memberTotal
              )


          if (
              value ===
              null
          ) {

            return null
          }


          return Math.max(
              0,
              Math.round(
                  value
              )
          )
        }
    )


/* ==================================================
   EXTRACT BREAKDOWN

   IMPORTANT:

   SPLIT =
     explicit split

   OR

     mixed + undecided
================================================== */

const extractedBreakdown =
    computed(
        () => {

          const source =
              rawSource.value


          const fullyAligned =
              valueFromKeys(
                  source,
                  [
                    'fullyAligned',
                    'fully_aligned',
                    'fully aligned',
                    'support'
                  ]
              )


          const mostlyAligned =
              valueFromKeys(
                  source,
                  [
                    'mostlyAligned',
                    'mostly_aligned',
                    'mostly aligned',
                    'conditionalSupport',
                    'conditional_support',
                    'conditional support'
                  ]
              )


          const explicitSplit =
              valueFromKeys(
                  source,
                  [
                    'split'
                  ]
              )


          const mixed =
              valueFromKeys(
                  source,
                  [
                    'mixed'
                  ]
              )


          const undecided =
              valueFromKeys(
                  source,
                  [
                    'undecided'
                  ]
              )


          const opposed =
              valueFromKeys(
                  source,
                  [
                    'opposed',
                    'oppose',
                    'opposition'
                  ]
              )


          return {

            fullyAligned:
                Math.max(
                    0,
                    numberOrZero(
                        fullyAligned
                    )
                ),


            mostlyAligned:
                Math.max(
                    0,
                    numberOrZero(
                        mostlyAligned
                    )
                ),


            split:

                explicitSplit !==
                null

                    ? Math.max(
                        0,
                        explicitSplit
                    )

                    : Math.max(

                        0,

                        numberOrZero(
                            mixed
                        )

                        +

                        numberOrZero(
                            undecided
                        )
                    ),


            opposed:
                Math.max(
                    0,
                    numberOrZero(
                        opposed
                    )
                )
          }
        }
    )


/* ==================================================
   SCORE
================================================== */

const normalizedScore =
    computed(
        () => {

          const explicit =
              numberOrNull(
                  props.score
              )


          const embedded =
              valueFromKeys(
                  rawSource.value,
                  [
                    'score',
                    'alignmentScore',
                    'alignment_score'
                  ]
              )


          const score =

              explicit

              ??

              embedded


          if (
              score ===
              null
          ) {

            return null
          }


          return clamp(
              score,
              0,
              100
          )
        }
    )


const scoreLabel =
    computed(
        () => {

          if (
              normalizedScore.value ===
              null
          ) {

            return '—'
          }


          return `${Math.round(
              normalizedScore.value
          )}%`
        }
    )


/* ==================================================
   CATEGORY DEFINITIONS

   These colors are shared by:

   1. ring segments
   2. legend dots
================================================== */

const categoryDefinitions = [

  {
    key:
        'fullyAligned',

    label:
        'Fully Aligned',

    color:
        'var(--success)'
  },


  {
    key:
        'mostlyAligned',

    label:
        'Mostly Aligned',

    color:
        'var(--primary)'
  },


  {
    key:
        'split',

    label:
        'Split',

    color:
        'var(--warning)'
  },


  {
    key:
        'opposed',

    label:
        'Opposed',

    color:
        'var(--danger)'
  }
]


/* ==================================================
   CATEGORY DATA
================================================== */

const categoryData =
    computed(
        () => {

          const values =
              extractedBreakdown.value


          return categoryDefinitions.map(
              definition => {

                const rawValue =
                    numberOrZero(

                        values[
                            definition.key
                            ]
                    )


                let displayValue


                if (
                    resolvedMode.value ===
                    'percentage'
                ) {

                  if (
                      normalizedMemberTotal.value !==
                      null
                      &&
                      normalizedMemberTotal.value >
                      0
                  ) {

                    displayValue =
                        String(

                            Math.round(

                                (
                                    rawValue
                                    /
                                    100
                                )

                                *

                                normalizedMemberTotal.value
                            )
                        )

                  } else {

                    displayValue =
                        `${Math.round(
                            rawValue
                        )}%`
                  }

                } else {

                  displayValue =
                      String(
                          Math.round(
                              rawValue
                          )
                      )
                }


                return {

                  ...definition,

                  rawValue,

                  displayValue
                }
              }
          )
        }
    )


/* ==================================================
   TOTAL CATEGORY WEIGHT

   Count mode example:

   2 + 2 + 0 + 1 = 5


   Percentage mode example:

   40 + 40 + 0 + 20 = 100
================================================== */

const totalCategoryWeight =
    computed(
        () => {

          return categoryData.value.reduce(
              (
                  total,
                  category
              ) => {

                return (

                    total

                    +

                    category.rawValue
                )
              },

              0
          )
        }
    )


/* ==================================================
   RADIAL GEOMETRY
================================================== */

const radius =
    44


const circumference =
    2
    *
    Math.PI
    *
    radius


/* ==================================================
   RADIAL SEGMENTS

   CORE LOGIC

   Example:

   score = 64

   distribution:

   Fully    40%
   Mostly   40%
   Split     0%
   Opposed  20%


   Painted ring contributions:

   Fully:
     64 × 0.40 = 25.6% circumference

   Mostly:
     64 × 0.40 = 25.6% circumference

   Opposed:
     64 × 0.20 = 12.8% circumference


   Total:

   25.6 + 25.6 + 12.8 = 64%
================================================== */

const ringSegments =
    computed(
        () => {

          const score =
              normalizedScore.value


          const weightTotal =
              totalCategoryWeight.value


          if (
              score ===
              null
              ||
              score <= 0
              ||
              weightTotal <= 0
          ) {

            return []
          }


          let cumulativeScoreContribution =
              0


          return categoryData.value
              .map(
                  category => {

                    const distributionShare =

                        category.rawValue

                        /

                        weightTotal


                    /*
                      Percentage points of the full
                      circumference contributed by this
                      category.
                    */

                    const scoreContribution =

                        score

                        *

                        distributionShare


                    /*
                      Actual SVG arc length.
                    */

                    const arcLength =

                        circumference

                        *

                        (
                            scoreContribution
                            /
                            100
                        )


                    /*
                      Starting point based on all previous
                      score contributions.
                    */

                    const offsetLength =

                        circumference

                        *

                        (
                            cumulativeScoreContribution
                            /
                            100
                        )


                    cumulativeScoreContribution +=
                        scoreContribution


                    return {

                      ...category,

                      distributionShare,

                      scoreContribution,

                      arcLength,

                      offsetLength,

                      dashArray:
                          `${arcLength} ${circumference - arcLength}`,

                      dashOffset:
                          -offsetLength
                    }
                  }
              )
              .filter(
                  segment =>
                      segment.arcLength >
                      0
              )
        }
    )


/* ==================================================
   SCORE CONTRIBUTION LOOKUP

   Used by the legend tooltip.
================================================== */

const categoryContributionMap =
    computed(
        () => {

          const map =
              new Map()


          ringSegments.value.forEach(
              segment => {

                map.set(
                    segment.key,
                    segment.scoreContribution
                )
              }
          )


          return map
        }
    )


/* ==================================================
   LEGEND ITEMS
================================================== */

const alignmentItems =
    computed(
        () => {

          return categoryData.value.map(
              category => ({

                ...category,

                scoreContribution:

                    categoryContributionMap.value.get(
                        category.key
                    )

                    ??

                    0
              })
          )
        }
    )


/* ==================================================
   DISPLAY STATE
================================================== */

const hasData =
    computed(
        () => {

          return (

              normalizedScore.value !==
              null

              ||

              totalCategoryWeight.value >
              0
          )
        }
    )
</script>


<template>
  <section
      class="alignment-panel"
      :style="panelStyle"
  >
    <!-- ==================================================
         BACKGROUND
    =================================================== -->

    <div class="panel-grid" />

    <div class="ambient-glow" />


    <!-- ==================================================
         CORNERS
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

          <path
              d="
                M8 12
                L11 15
                L17 8
              "
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
          />
        </svg>
      </span>


      <span class="header-title">
        ALIGNMENT BREAKDOWN
      </span>


      <span class="header-trace" />
    </header>


    <!-- ==================================================
         CONTENT
    =================================================== -->

    <div
        v-if="hasData"
        class="alignment-content"
    >
      <!-- ================================================
           RADIAL
      ================================================= -->

      <div class="radial-area">
        <div class="radial-background-glow" />


        <svg
            class="radial-chart"
            viewBox="0 0 140 140"
            aria-hidden="true"
        >
          <!-- ============================================
               DECORATIVE OUTER RINGS
          ============================================= -->

          <circle
              cx="70"
              cy="70"
              r="58"
              class="outer-ring"
          />

          <circle
              cx="70"
              cy="70"
              r="52"
              class="outer-ring-dashed"
          />


          <!-- ============================================
               QUADRANT MARKERS
          ============================================= -->

          <path
              d="
                M70 7
                V24

                M70 116
                V133

                M7 70
                H24

                M116 70
                H133
              "
              class="quadrant-lines"
          />


          <!-- ============================================
               FULL DARK TRACK
          ============================================= -->

          <circle
              cx="70"
              cy="70"
              :r="radius"
              class="progress-track"
          />


          <!-- ============================================
               COLORED SCORE CONTRIBUTION SEGMENTS

               Combined length of all these segments
               equals score % of circumference.
          ============================================= -->

          <circle
              v-for="segment in ringSegments"
              :key="segment.key"
              cx="70"
              cy="70"
              :r="radius"
              class="contribution-segment"
              :stroke-dasharray="segment.dashArray"
              :stroke-dashoffset="segment.dashOffset"
              :style="{
                stroke:
                  segment.color
              }"
          >
            <title>
              {{ segment.label }}:
              {{ segment.scoreContribution.toFixed(1) }}
              points of the alignment score
            </title>
          </circle>


          <!-- ============================================
               INNER ORBITS
          ============================================= -->

          <circle
              cx="70"
              cy="70"
              r="34"
              class="inner-ring"
          />

          <circle
              cx="70"
              cy="70"
              r="29"
              class="inner-ring-dashed"
          />


          <!-- ============================================
               DIAGONAL MARKERS
          ============================================= -->

          <path
              d="
                M35 35
                L42 42

                M98 98
                L105 105

                M105 35
                L98 42

                M42 98
                L35 105
              "
              class="diagonal-markers"
          />
        </svg>


        <!-- ==============================================
             CENTER SCORE
        =============================================== -->

        <div class="radial-center">
          <span class="score-value">
            {{ scoreLabel }}
          </span>
        </div>


        <!-- ==============================================
             DECORATIVE NODES
        =============================================== -->

        <span class="orbit-node node-top" />

        <span class="orbit-node node-right" />

        <span class="orbit-node node-bottom" />

        <span class="orbit-node node-left" />
      </div>


      <!-- ================================================
           BREAKDOWN LIST
      ================================================= -->

      <div class="breakdown-list">
        <div
            v-for="item in alignmentItems"
            :key="item.key"
            class="breakdown-row"
            :title="`${item.label}: ${item.scoreContribution.toFixed(1)} score contribution`"
        >
          <span
              class="status-dot"
              :style="{
                '--dot-color':
                  item.color
              }"
          >
            <span class="dot-core" />
          </span>


          <span class="breakdown-label">
            {{ item.label }}
          </span>


          <span class="breakdown-count">
            {{ item.displayValue }}
          </span>
        </div>
      </div>
    </div>


    <!-- ==================================================
         EMPTY STATE
    =================================================== -->

    <div
        v-else
        class="empty-state"
    >
      <div class="empty-orbit">
        <span class="empty-ring ring-1" />

        <span class="empty-ring ring-2" />

        <span class="empty-core">
          —
        </span>
      </div>


      <div class="empty-copy">
        <span class="empty-title">
          ALIGNMENT DATA UNAVAILABLE
        </span>

        <span class="empty-description">
          Council alignment will appear once member positions
          have been evaluated.
        </span>
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
================================================== */

.alignment-panel {
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

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 27%,
          transparent
      );

  border-radius:
      clamp(
          8px,
          0.75vw,
          12px
      );

  padding:
      clamp(
          0.5rem,
          0.72vw,
          0.75rem
      )
      clamp(
          0.6rem,
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
          rgba(7, 6, 23, 0.95),
          rgba(3, 6, 18, 0.92)
      );

  box-shadow:
      inset
      0
      0
      1.2rem
      rgba(
          145,
          78,
          255,
          0.045
      ),

      0
      0
      0.9rem
      rgba(
          72,
          39,
          145,
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
              135,
              99,
              226,
              0.065
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
      1.25rem
      1.25rem;
}


/* ==================================================
   AMBIENT GLOW
================================================== */

.ambient-glow {
  position: absolute;

  z-index: -1;

  left: -20%;
  bottom: -70%;

  width: 70%;

  aspect-ratio: 1;

  border-radius: 50%;

  pointer-events: none;

  background:
      radial-gradient(
          circle,

          color-mix(
              in srgb,
              var(--secondary) 10%,
              transparent
          ),

          transparent 68%
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


.header-trace {
  height: 1px;

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
   CONTENT
================================================== */

.alignment-content {
  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 0.9fr)
    minmax(0, 1.1fr);

  align-items: center;

  gap:
      clamp(
          0.4rem,
          1vw,
          1rem
      );

  padding-top:
      clamp(
          0.35rem,
          0.65vw,
          0.65rem
      );

  overflow: hidden;
}


/* ==================================================
   RADIAL AREA
================================================== */

.radial-area {
  position: relative;

  width:
      min(
          100%,
          9rem
      );

  aspect-ratio: 1;

  justify-self: center;

  display: grid;

  place-items: center;

  min-width: 0;
  min-height: 0;
}


.radial-background-glow {
  position: absolute;

  width: 72%;

  aspect-ratio: 1;

  border-radius: 50%;

  background:
      radial-gradient(
          circle,

          color-mix(
              in srgb,
              var(--primary) 14%,
              transparent
          ),

          transparent 70%
      );

  filter:
      blur(0.45rem);
}


/* ==================================================
   RADIAL SVG
================================================== */

.radial-chart {
  width: 100%;
  height: 100%;

  overflow: visible;

  /*
    All circle dash sequences begin at 3 o'clock.

    Rotate the entire chart so the score begins at
    the top.
  */

  transform:
      rotate(-90deg);
}


/* ==================================================
   DECORATION
================================================== */

.outer-ring {
  fill: none;

  stroke:
      color-mix(
          in srgb,
          var(--primary) 20%,
          transparent
      );

  stroke-width: 0.8;
}


.outer-ring-dashed {
  fill: none;

  stroke:
      color-mix(
          in srgb,
          var(--secondary) 19%,
          transparent
      );

  stroke-width: 0.7;

  stroke-dasharray:
      2 5;
}


.quadrant-lines {
  fill: none;

  stroke:
      color-mix(
          in srgb,
          var(--primary) 24%,
          transparent
      );

  stroke-width: 0.8;
}


/* ==================================================
   SCORE TRACK
================================================== */

.progress-track {
  fill: none;

  stroke:
      rgba(
          125,
          141,
          190,
          0.12
      );

  stroke-width: 8;
}


/* ==================================================
   CONTRIBUTION SEGMENTS
================================================== */

.contribution-segment {
  fill: none;

  stroke-width: 8;

  stroke-linecap: butt;

  transition:
      stroke-dasharray
      800ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),

      stroke-dashoffset
      800ms
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
          currentColor
      );
}


/* ==================================================
   INNER RINGS
================================================== */

.inner-ring {
  fill: none;

  stroke:
      color-mix(
          in srgb,
          var(--secondary) 20%,
          transparent
      );

  stroke-width: 0.7;
}


.inner-ring-dashed {
  fill: none;

  stroke:
      color-mix(
          in srgb,
          var(--primary) 25%,
          transparent
      );

  stroke-width: 0.6;

  stroke-dasharray:
      2 4;
}


.diagonal-markers {
  fill: none;

  stroke:
      var(--secondary);

  stroke-width: 0.7;

  opacity: 0.3;
}


/* ==================================================
   CENTER SCORE
================================================== */

.radial-center {
  position: absolute;

  inset: 0;

  display: grid;

  place-items: center;

  pointer-events: none;
}


.score-value {
  color:
      var(--primary);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          1rem,
          1.75vw,
          1.65rem
      );

  line-height: 1;

  text-shadow:
      0
      0
      0.7rem
      color-mix(
          in srgb,
          var(--primary) 50%,
          transparent
      );
}


/* ==================================================
   ORBIT NODES
================================================== */

.orbit-node {
  position: absolute;

  width: 0.25rem;

  aspect-ratio: 1;

  background:
      var(--secondary);

  transform:
      rotate(45deg);

  opacity: 0.5;

  box-shadow:
      0
      0
      0.4rem
      var(--secondary);
}


.node-top {
  top: 5%;
  left: 50%;
}


.node-right {
  right: 5%;
  top: 50%;
}


.node-bottom {
  bottom: 5%;
  left: 50%;
}


.node-left {
  left: 5%;
  top: 50%;
}


/* ==================================================
   BREAKDOWN LIST
================================================== */

.breakdown-list {
  min-width: 0;

  display: flex;

  flex-direction: column;

  justify-content: center;

  gap:
      clamp(
          0.4rem,
          0.85vh,
          0.7rem
      );

  padding:
      clamp(
          0.2rem,
          0.45vw,
          0.45rem
      );
}


.breakdown-row {
  min-width: 0;

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

  position: relative;

  padding-bottom:
      clamp(
          0.2rem,
          0.35vw,
          0.35rem
      );
}


.breakdown-row:not(:last-child)::after {
  content: '';

  position: absolute;

  left:
      clamp(
          0.8rem,
          1.2vw,
          1.2rem
      );

  right: 0;
  bottom: 0;

  height: 1px;

  background:
      linear-gradient(
          90deg,
          rgba(
              140,
              160,
              210,
              0.08
          ),
          transparent
      );
}


/* ==================================================
   STATUS DOT
================================================== */

.status-dot {
  width:
      clamp(
          0.45rem,
          0.62vw,
          0.62rem
      );

  aspect-ratio: 1;

  display: grid;

  place-items: center;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--dot-color) 45%,
          transparent
      );

  border-radius: 50%;

  box-shadow:
      0
      0
      0.35rem
      color-mix(
          in srgb,
          var(--dot-color) 20%,
          transparent
      );
}


.dot-core {
  width: 38%;

  aspect-ratio: 1;

  border-radius: 50%;

  background:
      var(--dot-color);

  box-shadow:
      0
      0
      0.28rem
      var(--dot-color);
}


/* ==================================================
   LABEL
================================================== */

.breakdown-label {
  min-width: 0;

  overflow: hidden;

  white-space: nowrap;

  text-overflow: ellipsis;

  color:
      rgba(
          211,
          220,
          241,
          0.65
      );

  font-size:
      clamp(
          0.45rem,
          0.6vw,
          0.62rem
      );
}


/* ==================================================
   COUNT / PERCENTAGE
================================================== */

.breakdown-count {
  color:
      rgba(
          242,
          245,
          255,
          0.9
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.5rem,
          0.7vw,
          0.7rem
      );

  text-align: right;

  font-variant-numeric:
      tabular-nums;
}


/* ==================================================
   EMPTY STATE
================================================== */

.empty-state {
  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr);

  align-items: center;

  justify-content: center;

  gap:
      clamp(
          0.8rem,
          1.5vw,
          1.5rem
      );

  padding:
      clamp(
          0.8rem,
          1.5vw,
          1.5rem
      );
}


.empty-orbit {
  position: relative;

  width:
      clamp(
          3.8rem,
          6vw,
          6rem
      );

  aspect-ratio: 1;

  display: grid;

  place-items: center;
}


.empty-ring {
  position: absolute;

  border-radius: 50%;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 22%,
          transparent
      );
}


.ring-1 {
  inset: 0;

  border-style: dashed;
}


.ring-2 {
  inset: 18%;

  border-color:
      color-mix(
          in srgb,
          var(--secondary) 18%,
          transparent
      );
}


.empty-core {
  color:
      var(--primary);

  font-family:
      Georgia,
      serif;

  font-size: 1.1rem;

  opacity: 0.6;
}


.empty-copy {
  min-width: 0;

  max-width: 22rem;

  display: flex;

  flex-direction: column;

  gap:
      0.35rem;
}


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


.empty-description {
  color:
      rgba(
          195,
          207,
          233,
          0.42
      );

  font-size:
      clamp(
          0.44rem,
          0.57vw,
          0.6rem
      );

  line-height: 1.5;
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 850px) {
  .alignment-panel {
    padding:
        0.45rem
        0.55rem
        0.55rem;
  }


  .alignment-content {
    grid-template-columns:
      minmax(5rem, 0.8fr)
      minmax(0, 1.2fr);
  }


  .radial-area {
    width:
        min(
            100%,
            7rem
        );
  }
}


@media (max-width: 560px) {
  .alignment-content {
    grid-template-columns:
      minmax(4.8rem, 0.7fr)
      minmax(0, 1.3fr);

    gap:
        0.25rem;
  }


  .breakdown-list {
    gap:
        0.3rem;
  }


  .breakdown-row {
    gap:
        0.3rem;
  }


  .breakdown-label {
    font-size:
        0.42rem;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {
  .contribution-segment {
    transition: none;
  }
}
</style>
