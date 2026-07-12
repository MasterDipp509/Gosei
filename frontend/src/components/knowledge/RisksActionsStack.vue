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
        PRIMARY REPORT SOURCES

        When the report exists and contains data,
        these take priority.

        Older discussions may provide empty arrays.
        In that case this component falls back to the
        current discussion store.
      */

      risks: {
        type: Array,

        default:
            () => []
      },


      actions: {
        type: Array,

        default:
            () => []
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
            '#ffc857'
      },


      danger: {
        type: String,

        default:
            '#ff4f72'
      }
    })


/* ==================================================
   DISCUSSION STORE

   Used only as a fallback source when the report
   arrays are empty.
================================================== */

const discussionStore =
    useCurrentDiscussionStore()


/* ==================================================
   STYLE
================================================== */

const componentStyle =
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

function asArray(
    value
) {

  return Array.isArray(
      value
  )
      ? value
      : []
}


function asObject(
    value
) {

  return (
      value
      &&
      typeof value ===
      'object'
      &&
      !Array.isArray(
          value
      )
  )
      ? value
      : {}
}


function cleanText(
    value
) {

  if (
      typeof value !==
      'string'
  ) {

    return ''
  }


  return value
      .trim()
}


function textOf(
    item
) {

  if (
      typeof item ===
      'string'
  ) {

    return cleanText(
        item
    )
  }


  return cleanText(

      item?.title

      ??

      item?.name

      ??

      item?.description

      ??

      item?.text

      ??

      item?.content

      ??

      item?.risk

      ??

      item?.action

      ??

      ''
  )
}


function normalizedTextKey(
    value
) {

  return cleanText(
      value
  )
      .toLowerCase()

      .replace(
          /[^\p{L}\p{N}\s]/gu,
          ''
      )

      .replace(
          /\s+/g,
          ' '
      )
}


/* ==================================================
   DISCUSSION SECTIONS
================================================== */

const discussionSections =
    computed(
        () => {

          return [
            ...asArray(
                discussionStore
                    .orderedSections
            )
          ]
        }
    )


const finalDiscussionSection =
    computed(
        () => (

            discussionSections.value.at(
                -1
            )

            ??

            null
        )
    )


/* ==================================================
   CHARACTER STATE COLLECTION

   Section shape:

   section.characters = {
     characterId: {
       risks: [],
       actions: []
     }
   }
================================================== */

function collectCharacterItems(
    sections,
    field
) {

  const collected =
      []


  asArray(
      sections
  )
      .forEach(
          section => {

            const characters =
                asObject(
                    section?.characters
                )


            Object.entries(
                characters
            )
                .forEach(
                    ([
                       characterId,
                       characterState
                     ]) => {

                      asArray(
                          characterState?.[
                              field
                              ]
                      )
                          .forEach(
                              (
                                  item,
                                  index
                              ) => {

                                if (
                                    typeof item ===
                                    'string'
                                ) {

                                  collected.push({

                                    text:
                                    item,

                                    sourceCharacterId:
                                    characterId,

                                    sourceSectionId:
                                    section?.id,

                                    sourceIndex:
                                    index
                                  })


                                  return
                                }


                                collected.push({

                                  ...asObject(
                                      item
                                  ),

                                  sourceCharacterId:

                                      item?.sourceCharacterId

                                      ??

                                      characterId,


                                  sourceSectionId:

                                      item?.sourceSectionId

                                      ??

                                      section?.id,


                                  sourceIndex:
                                  index
                                })
                              }
                          )
                    }
                )
          }
      )


  return collected
}


/* ==================================================
   DISCUSSION FALLBACK SOURCES
================================================== */

const outcomeRisks =
    computed(
        () =>

            asArray(
                discussionStore
                    .outcome
                    ?.risks
            )
    )


const outcomeActions =
    computed(
        () =>

            asArray(
                discussionStore
                    .outcome
                    ?.actions
            )
    )


const finalSectionRisks =
    computed(
        () => {

          if (
              !finalDiscussionSection.value
          ) {

            return []
          }


          return collectCharacterItems(
              [
                finalDiscussionSection.value
              ],
              'risks'
          )
        }
    )


const finalSectionActions =
    computed(
        () => {

          if (
              !finalDiscussionSection.value
          ) {

            return []
          }


          return collectCharacterItems(
              [
                finalDiscussionSection.value
              ],
              'actions'
          )
        }
    )


const allDiscussionRisks =
    computed(
        () =>

            collectCharacterItems(
                discussionSections.value,
                'risks'
            )
    )


const allDiscussionActions =
    computed(
        () =>

            collectCharacterItems(
                discussionSections.value,
                'actions'
            )
    )


/* ==================================================
   SOURCE RESOLUTION

   Priority:

   1. Generated report props
   2. Discussion outcome
   3. Final section character state
   4. Whole discussion character state
================================================== */

const resolvedRiskSource =
    computed(
        () => {

          if (
              asArray(
                  props.risks
              ).length
          ) {

            return props.risks
          }


          if (
              outcomeRisks.value.length
          ) {

            return outcomeRisks.value
          }


          if (
              finalSectionRisks.value.length
          ) {

            return finalSectionRisks.value
          }


          return allDiscussionRisks.value
        }
    )


const resolvedActionSource =
    computed(
        () => {

          if (
              asArray(
                  props.actions
              ).length
          ) {

            return props.actions
          }


          if (
              outcomeActions.value.length
          ) {

            return outcomeActions.value
          }


          if (
              finalSectionActions.value.length
          ) {

            return finalSectionActions.value
          }


          return allDiscussionActions.value
        }
    )


/* ==================================================
   RISK SEVERITY

   IMPORTANT:

   Missing severity is UNRATED.

   It must not silently become medium.
================================================== */

const severityRanks = {

  unrated:
      0,

  low:
      1,

  medium:
      2,

  high:
      3,

  critical:
      4
}


function normalizeSeverity(
    risk
) {

  if (
      !risk
      ||
      typeof risk !==
      'object'
  ) {

    return 'unrated'
  }


  const raw =

      risk?.severity

      ??

      risk?.level

      ??

      risk?.priority

      ??

      risk?.riskLevel

      ??

      risk?.risk_level

      ??

      null


  if (
      raw === null
      ||
      raw === undefined
      ||
      raw === ''
  ) {

    return 'unrated'
  }


  const normalized =
      String(
          raw
      )
          .trim()
          .toLowerCase()


  switch (
      normalized
      ) {

    case 'critical':
    case 'urgent':
      return 'critical'


    case 'high':
    case 'severe':
      return 'high'


    case 'medium':
    case 'moderate':
      return 'medium'


    case 'low':
    case 'minor':
      return 'low'


    default:
      return 'unrated'
  }
}


function severityLabel(
    severity
) {

  switch (
      severity
      ) {

    case 'critical':
      return 'Critical'


    case 'high':
      return 'High'


    case 'medium':
      return 'Medium'


    case 'low':
      return 'Low'


    case 'unrated':
    default:
      return 'Unrated'
  }
}


function severityClass(
    severity
) {

  return `severity-${severity}`
}


/* ==================================================
   NORMALIZE ONE RISK
================================================== */

function normalizeRisk(
    risk,
    index
) {

  const text =
      textOf(
          risk
      )


  if (
      !text
  ) {

    return null
  }


  const severity =
      normalizeSeverity(
          risk
      )


  return {

    id:

        risk?.id

        ??

        risk?.riskId

        ??

        risk?.risk_id

        ??

        `risk-${index}-${normalizedTextKey(text)}`,


    text,


    textKey:
        normalizedTextKey(
            text
        ),


    severity,


    severityRank:

        severityRanks[
            severity
            ]

        ??

        0,


    severityLabel:
        severityLabel(
            severity
        ),


    severityClass:
        severityClass(
            severity
        ),


    sourceCharacterId:

        risk?.sourceCharacterId

        ??

        null,


    sourceSectionId:

        risk?.sourceSectionId

        ??

        null
  }
}


/* ==================================================
   NORMALIZED + DEDUPED RISKS

   Duplicate risk text is merged.

   When duplicate risks contain different explicit
   severities, the strongest real supplied severity
   wins.
================================================== */

const normalizedRisks =
    computed(
        () => {

          const riskMap =
              new Map()


          asArray(
              resolvedRiskSource.value
          )
              .map(
                  normalizeRisk
              )
              .filter(
                  Boolean
              )
              .forEach(
                  risk => {

                    const key =
                        risk.textKey


                    const existing =
                        riskMap.get(
                            key
                        )


                    if (
                        !existing
                    ) {

                      riskMap.set(
                          key,
                          {
                            ...risk,

                            occurrenceCount:
                                1
                          }
                      )


                      return
                    }


                    existing.occurrenceCount +=
                        1


                    if (
                        risk.severityRank >
                        existing.severityRank
                    ) {

                      existing.severity =
                          risk.severity


                      existing.severityRank =
                          risk.severityRank


                      existing.severityLabel =
                          risk.severityLabel


                      existing.severityClass =
                          risk.severityClass
                    }
                  }
              )


          return [
            ...riskMap.values()
          ]
              .sort(
                  (
                      first,
                      second
                  ) => {

                    return (

                        second.severityRank

                        -

                        first.severityRank
                    )
                  }
              )
        }
    )


/* ==================================================
   ACTION COMPLETION

   Report-native action completion state is preserved.

   Discussion-generated actions without completion
   metadata remain incomplete.
================================================== */

function actionIsComplete(
    action
) {

  if (
      !action
      ||
      typeof action !==
      'object'
  ) {

    return false
  }


  if (
      typeof action.completed ===
      'boolean'
  ) {

    return action.completed
  }


  if (
      typeof action.isCompleted ===
      'boolean'
  ) {

    return action.isCompleted
  }


  if (
      typeof action.is_completed ===
      'boolean'
  ) {

    return action.is_completed
  }


  if (
      typeof action.done ===
      'boolean'
  ) {

    return action.done
  }


  const status =
      cleanText(
          action.status
          ??
          ''
      )
          .toLowerCase()


  return [

    'completed',
    'complete',
    'done',
    'resolved'

  ]
      .includes(
          status
      )
}


/* ==================================================
   NORMALIZE ONE ACTION
================================================== */

function normalizeAction(
    action,
    index
) {

  const text =
      textOf(
          action
      )


  if (
      !text
  ) {

    return null
  }


  return {

    id:

        action?.id

        ??

        action?.actionId

        ??

        action?.action_id

        ??

        `action-${index}-${normalizedTextKey(text)}`,


    text,


    textKey:
        normalizedTextKey(
            text
        ),


    complete:
        actionIsComplete(
            action
        ),


    sourceCharacterId:

        action?.sourceCharacterId

        ??

        null,


    sourceSectionId:

        action?.sourceSectionId

        ??

        null
  }
}


/* ==================================================
   NORMALIZED + DEDUPED ACTIONS

   Duplicate action text is merged.

   If one explicit copy is marked complete, the merged
   action remains complete.
================================================== */

const normalizedActions =
    computed(
        () => {

          const actionMap =
              new Map()


          asArray(
              resolvedActionSource.value
          )
              .map(
                  normalizeAction
              )
              .filter(
                  Boolean
              )
              .forEach(
                  action => {

                    const key =
                        action.textKey


                    const existing =
                        actionMap.get(
                            key
                        )


                    if (
                        !existing
                    ) {

                      actionMap.set(
                          key,
                          {
                            ...action,

                            occurrenceCount:
                                1
                          }
                      )


                      return
                    }


                    existing.occurrenceCount +=
                        1


                    existing.complete =

                        existing.complete

                        ||

                        action.complete
                  }
              )


          return [
            ...actionMap.values()
          ]
        }
    )


/* ==================================================
   DISPLAY STATE
================================================== */

const hasRisks =
    computed(
        () =>

            normalizedRisks.value.length >
            0
    )


const hasActions =
    computed(
        () =>

            normalizedActions.value.length >
            0
    )


/* ==================================================
   SOURCE LABELS

   Internal DOM metadata only.
================================================== */

const riskSourceType =
    computed(
        () => {

          if (
              asArray(
                  props.risks
              ).length
          ) {

            return 'report'
          }


          if (
              outcomeRisks.value.length
          ) {

            return 'discussion-outcome'
          }


          if (
              finalSectionRisks.value.length
          ) {

            return 'final-section'
          }


          return 'discussion-history'
        }
    )


const actionSourceType =
    computed(
        () => {

          if (
              asArray(
                  props.actions
              ).length
          ) {

            return 'report'
          }


          if (
              outcomeActions.value.length
          ) {

            return 'discussion-outcome'
          }


          if (
              finalSectionActions.value.length
          ) {

            return 'final-section'
          }


          return 'discussion-history'
        }
    )
</script>


<template>
  <section
      class="risks-actions-stack"
      :style="componentStyle"
  >
    <!-- ==================================================
         RISKS PANEL
    =================================================== -->

    <article
        class="data-panel risks-panel"
        :data-source="riskSourceType"
    >
      <div class="panel-grid" />

      <div class="risk-glow" />


      <span class="frame-corner corner-tl" />

      <span class="frame-corner corner-tr" />

      <span class="frame-corner corner-bl" />

      <span class="frame-corner corner-br" />


      <!-- ================================================
           HEADER
      ================================================= -->

      <header class="panel-header">
        <span class="header-icon risk-icon">
          <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
          >
            <path
                d="
                  M12 2
                  L21 7
                  V13
                  C21 18
                  17 21
                  12 22
                  C7 21
                  3 18
                  3 13
                  V7
                  Z
                "
                fill="none"
                stroke="currentColor"
                stroke-width="1.2"
            />

            <path
                d="
                  M12 7
                  V13
                "
                stroke="currentColor"
                stroke-width="1.3"
            />

            <circle
                cx="12"
                cy="17"
                r="0.9"
                fill="currentColor"
            />
          </svg>
        </span>


        <span class="header-title">
          TOP RISKS (FINAL)
        </span>


        <span class="header-trace" />


        <span class="header-count">
          {{
            String(
                normalizedRisks.length
            )
                .padStart(
                    2,
                    '0'
                )
          }}
        </span>
      </header>


      <!-- ================================================
           RISK LIST
      ================================================= -->

      <div
          v-if="hasRisks"
          class="data-list risk-list"
      >
        <div
            v-for="(
              risk,
              index
            ) in normalizedRisks"
            :key="risk.id"
            class="data-row risk-row"
            :title="risk.text"
        >
          <span class="row-index">
            {{
              String(
                  index + 1
              )
                  .padStart(
                      2,
                      '0'
                  )
            }}
          </span>


          <span class="row-copy">
            {{ risk.text }}
          </span>


          <span
              class="severity"
              :class="risk.severityClass"
          >
            {{ risk.severityLabel }}
          </span>
        </div>
      </div>


      <!-- ================================================
           EMPTY RISK STATE
      ================================================= -->

      <div
          v-else
          class="empty-state"
      >
        <span class="empty-symbol">
          ◇
        </span>


        <div class="empty-copy">
          <span class="empty-title">
            NO FINAL RISKS
          </span>

          <span class="empty-description">
            No risk findings were recorded in either the report
            or the discussion history.
          </span>
        </div>
      </div>
    </article>


    <!-- ==================================================
         ACTIONS PANEL
    =================================================== -->

    <article
        class="data-panel actions-panel"
        :data-source="actionSourceType"
    >
      <div class="panel-grid" />

      <div class="action-glow" />


      <span class="frame-corner corner-tl" />

      <span class="frame-corner corner-tr" />

      <span class="frame-corner corner-bl" />

      <span class="frame-corner corner-br" />


      <!-- ================================================
           HEADER
      ================================================= -->

      <header class="panel-header">
        <span class="header-icon action-icon">
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
          NEXT ACTIONS
        </span>


        <span class="header-trace" />


        <span class="header-count">
          {{
            String(
                normalizedActions.length
            )
                .padStart(
                    2,
                    '0'
                )
          }}
        </span>
      </header>


      <!-- ================================================
           ACTION LIST
      ================================================= -->

      <div
          v-if="hasActions"
          class="data-list action-list"
      >
        <div
            v-for="(
              action,
              index
            ) in normalizedActions"
            :key="action.id"
            class="data-row action-row"
            :class="{
              complete:
                action.complete
            }"
            :title="action.text"
        >
          <span class="row-index">
            {{
              String(
                  index + 1
              )
                  .padStart(
                      2,
                      '0'
                  )
            }}
          </span>


          <span class="row-copy">
            {{ action.text }}
          </span>


          <span
              class="action-checkbox"
              :class="{
                checked:
                  action.complete
              }"
          >
            <svg
                v-if="action.complete"
                viewBox="0 0 20 20"
                aria-hidden="true"
            >
              <path
                  d="
                    M4 10
                    L8 14
                    L16 5
                  "
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>


      <!-- ================================================
           EMPTY ACTION STATE
      ================================================= -->

      <div
          v-else
          class="empty-state"
      >
        <span class="empty-symbol">
          ◇
        </span>


        <div class="empty-copy">
          <span class="empty-title">
            NO NEXT ACTIONS
          </span>

          <span class="empty-description">
            No follow-up actions were recorded in either the
            report or the discussion history.
          </span>
        </div>
      </div>
    </article>
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

   Layout wrapper only.

   The two children are the visual panels.
================================================== */

.risks-actions-stack {
  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-rows:
    minmax(0, 1.08fr)
    minmax(0, 0.92fr);

  gap:
      clamp(
          0.4rem,
          0.6vw,
          0.6rem
      );

  overflow: hidden;
}


/* ==================================================
   SHARED PANEL
================================================== */

.data-panel {
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
          0.4rem,
          0.6vw,
          0.6rem
      )
      clamp(
          0.5rem,
          0.75vw,
          0.75rem
      )
      clamp(
          0.45rem,
          0.7vw,
          0.7rem
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
          0.04
      ),

      0
      0
      0.8rem
      rgba(
          72,
          39,
          145,
          0.08
      );

  isolation: isolate;
}


/* ==================================================
   PANEL BACKGROUND
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
              0.045
          )
          1px,
          transparent
          1px
      );

  background-size:
      1.15rem
      1.15rem;
}


/* ==================================================
   PANEL GLOWS
================================================== */

.risk-glow,
.action-glow {
  position: absolute;

  z-index: -1;

  width: 55%;

  aspect-ratio: 1;

  border-radius: 50%;

  pointer-events: none;

  filter:
      blur(0.8rem);
}


.risk-glow {
  right: -24%;
  top: -75%;

  background:
      radial-gradient(
          circle,

          color-mix(
              in srgb,
              var(--danger) 9%,
              transparent
          ),

          transparent 68%
      );
}


.action-glow {
  left: -20%;
  bottom: -85%;

  background:
      radial-gradient(
          circle,

          color-mix(
              in srgb,
              var(--success) 8%,
              transparent
          ),

          transparent 68%
      );
}


/* ==================================================
   FRAME CORNERS
================================================== */

.frame-corner {
  position: absolute;

  z-index: 10;

  width: 0.55rem;
  height: 0.55rem;

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
   HEADER
================================================== */

.panel-header {
  min-width: 0;

  display: grid;

  grid-template-columns:
    auto
    auto
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap:
      clamp(
          0.3rem,
          0.45vw,
          0.45rem
      );

  padding:
      0
      0
      clamp(
          0.32rem,
          0.5vw,
          0.5rem
      );

  border-bottom:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 15%,
          transparent
      );
}


/* ==================================================
   HEADER ICON
================================================== */

.header-icon {
  width:
      clamp(
          0.7rem,
          0.9vw,
          0.9rem
      );

  aspect-ratio: 1;

  color:
      var(--primary);

  filter:
      drop-shadow(
          0
          0
          0.28rem

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


.risk-icon {
  color:
      var(--danger);
}


.action-icon {
  color:
      var(--primary);
}


/* ==================================================
   HEADER TITLE
================================================== */

.header-title {
  min-width: 0;

  color:
      var(--primary);

  font-family:
      monospace;

  font-size:
      clamp(
          0.36rem,
          0.48vw,
          0.5rem
      );

  font-weight: 600;

  letter-spacing:
      0.09em;

  white-space: nowrap;
}


/* ==================================================
   HEADER TRACE
================================================== */

.header-trace {
  min-width: 0;

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
   HEADER COUNT
================================================== */

.header-count {
  color:
      rgba(
          190,
          202,
          229,
          0.35
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
      0.08em;

  font-variant-numeric:
      tabular-nums;
}


/* ==================================================
   LIST
================================================== */

.data-list {
  min-width: 0;
  min-height: 0;

  overflow-y: auto;
  overflow-x: hidden;

  display: flex;

  flex-direction: column;

  padding-top:
      clamp(
          0.3rem,
          0.45vw,
          0.45rem
      );

  scrollbar-width: none;

  overscroll-behavior:
      contain;
}


.data-list::-webkit-scrollbar {
  display: none;
}


/* ==================================================
   ROW
================================================== */

.data-row {
  flex:
      0
      0
      auto;

  min-width: 0;

  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap:
      clamp(
          0.35rem,
          0.55vw,
          0.55rem
      );

  min-height:
      clamp(
          1.25rem,
          2.2vh,
          1.8rem
      );

  padding:
      clamp(
          0.12rem,
          0.22vw,
          0.22rem
      )
      clamp(
          0.1rem,
          0.2vw,
          0.2rem
      );

  border-bottom:
      1px solid
      rgba(
          129,
          149,
          198,
          0.075
      );
}


.data-row:last-child {
  border-bottom: 0;
}


/* ==================================================
   INDEX
================================================== */

.row-index {
  width:
      clamp(
          0.85rem,
          1.2vw,
          1.15rem
      );

  aspect-ratio: 1;

  display: grid;

  place-items: center;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 28%,
          transparent
      );

  border-radius:
      2px;

  color:
      rgba(
          203,
          211,
          235,
          0.5
      );

  background:
      rgba(
          13,
          10,
          33,
          0.52
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.3rem,
          0.38vw,
          0.4rem
      );
}


/* ==================================================
   COPY
================================================== */

.row-copy {
  min-width: 0;

  overflow: hidden;

  white-space: nowrap;

  text-overflow: ellipsis;

  color:
      rgba(
          210,
          219,
          241,
          0.68
      );

  font-size:
      clamp(
          0.4rem,
          0.52vw,
          0.56rem
      );
}


/* ==================================================
   SEVERITY
================================================== */

.severity {
  min-width:
      clamp(
          2.5rem,
          3.8vw,
          3.7rem
      );

  text-align: left;

  font-family:
      monospace;

  font-size:
      clamp(
          0.33rem,
          0.42vw,
          0.44rem
      );

  letter-spacing:
      0.02em;
}


.severity-critical {
  color:
      #ff315c;

  text-shadow:
      0
      0
      0.35rem
      rgba(
          255,
          49,
          92,
          0.38
      );
}


.severity-high {
  color:
      var(--danger);
}


.severity-medium {
  color:
      var(--warning);
}


.severity-low {
  color:
      var(--success);
}


.severity-unrated {
  color:
      rgba(
          178,
          190,
          220,
          0.42
      );
}


/* ==================================================
   ACTION CHECKBOX
================================================== */

.action-checkbox {
  width:
      clamp(
          0.7rem,
          0.95vw,
          0.95rem
      );

  aspect-ratio: 1;

  display: grid;

  place-items: center;

  border:
      1px solid
      rgba(
          141,
          159,
          202,
          0.28
      );

  border-radius:
      2px;

  color:
      var(--success);

  background:
      rgba(
          5,
          8,
          19,
          0.75
      );
}


.action-checkbox.checked {
  border-color:
      color-mix(
          in srgb,
          var(--success) 60%,
          transparent
      );

  background:
      color-mix(
          in srgb,
          var(--success) 6%,
          rgba(5, 8, 19, 0.75)
      );

  box-shadow:
      0
      0
      0.35rem
      color-mix(
          in srgb,
          var(--success) 20%,
          transparent
      );
}


.action-checkbox svg {
  width: 76%;
  height: 76%;
}


/* ==================================================
   COMPLETE ACTION
================================================== */

.action-row.complete
.row-copy {
  color:
      rgba(
          201,
          222,
          218,
          0.7
      );
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

  gap:
      clamp(
          0.55rem,
          0.9vw,
          0.9rem
      );

  padding:
      clamp(
          0.6rem,
          1vw,
          1rem
      );
}


.empty-symbol {
  color:
      var(--primary);

  font-size:
      clamp(
          1rem,
          1.5vw,
          1.4rem
      );

  text-shadow:
      0
      0
      0.5rem
      color-mix(
          in srgb,
          var(--primary) 55%,
          transparent
      );
}


.empty-copy {
  min-width: 0;

  display: flex;

  flex-direction: column;

  gap:
      0.2rem;
}


.empty-title {
  color:
      var(--primary);

  font-family:
      monospace;

  font-size:
      clamp(
          0.35rem,
          0.45vw,
          0.48rem
      );

  letter-spacing:
      0.1em;
}


.empty-description {
  color:
      rgba(
          193,
          205,
          231,
          0.42
      );

  font-size:
      clamp(
          0.4rem,
          0.5vw,
          0.54rem
      );

  line-height:
      1.45;
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 900px) {
  .risks-actions-stack {
    gap:
        0.35rem;
  }


  .data-panel {
    padding:
        0.38rem
        0.45rem
        0.45rem;
  }


  .severity {
    min-width:
        2.4rem;
  }
}


@media (max-width: 620px) {
  .header-count {
    display: none;
  }


  .panel-header {
    grid-template-columns:
      auto
      auto
      minmax(0, 1fr);
  }


  .severity {
    min-width: auto;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {
  .data-panel,
  .data-row,
  .action-checkbox {
    transition: none;
  }
}
</style>
