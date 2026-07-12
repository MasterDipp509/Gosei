<script setup>
import {
  computed,
  ref
} from 'vue'

import {
  useCharacterStore
} from '@/stores/characterStore.js'

import {
  useCurrentDiscussionStore
} from '@/stores/currentDiscussion.js'


/* ==================================================
   PROPS
================================================== */

const props =
    defineProps({

      positions: {
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
      },

      warning: {
        type: String,
        default: '#ffc857'
      },

      danger: {
        type: String,
        default: '#ff4f72'
      }
    })


/* ==================================================
   STORES
================================================== */

const characterStore =
    useCharacterStore()


const discussionStore =
    useCurrentDiscussionStore()


/* ==================================================
   COMPONENT STYLE
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
   IMAGE FALLBACK
================================================== */

const failedImageIds =
    ref(
        new Set()
    )


function handleImageError(
    characterId
) {

  const next =
      new Set(
          failedImageIds.value
      )


  next.add(
      String(
          characterId
      )
  )


  failedImageIds.value =
      next
}


function imageHasFailed(
    characterId
) {

  return failedImageIds.value.has(
      String(
          characterId
      )
  )
}


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


function normalizeId(
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


  return String(
      value
  )
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


function cleanText(
    value
) {

  if (
      typeof value !==
      'string'
  ) {

    return ''
  }


  return value.trim()
}


function firstText(
    ...values
) {

  for (
      const value
      of values
      ) {

    const text =
        cleanText(
            value
        )


    if (
        text
    ) {

      return text
    }
  }


  return ''
}


function firstNumber(
    ...values
) {

  for (
      const value
      of values
      ) {

    const numeric =
        numberOrNull(
            value
        )


    if (
        numeric !== null
    ) {

      return numeric
    }
  }


  return null
}


/* ==================================================
   FINAL DISCUSSION SECTION
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


const finalSectionMetrics =
    computed(
        () =>

            asObject(
                finalDiscussionSection.value
                    ?.metrics
            )
    )


/* ==================================================
   FINAL MEMBER METRICS
================================================== */

const finalMetricMembers =
    computed(
        () =>

            asArray(
                finalSectionMetrics.value
                    ?.members
            )
    )


const finalMetricMemberMap =
    computed(
        () => {

          const map =
              new Map()


          finalMetricMembers.value
              .forEach(
                  member => {

                    const id =
                        normalizeId(

                            member?.characterId

                            ??

                            member?.character_id

                            ??

                            member?.id
                        )


                    if (
                        id
                    ) {

                      map.set(
                          id,
                          member
                      )
                    }
                  }
              )


          return map
        }
    )


/* ==================================================
   FINAL CHARACTER STATES
================================================== */

const finalSectionCharacterMap =
    computed(
        () =>

            asObject(
                finalDiscussionSection.value
                    ?.characters
            )
    )


/* ==================================================
   POSITION ID
================================================== */

function getCharacterId(
    item
) {

  return normalizeId(

      item?.characterId

      ??

      item?.character_id

      ??

      item?.report
          ?.characterId

      ??

      item?.report
          ?.character_id

      ??

      item?.id

      ??

      null
  )
}


/* ==================================================
   EXPLICIT REPORT
================================================== */

function getExplicitReport(
    item
) {

  return asObject(

      item?.report

      ??

      item
  )
}


/* ==================================================
   EXPLICIT POSITION MAP
================================================== */

const explicitPositionMap =
    computed(
        () => {

          const map =
              new Map()


          asArray(
              props.positions
          )
              .forEach(
                  item => {

                    const id =
                        getCharacterId(
                            item
                        )


                    if (
                        !id
                    ) {

                      return
                    }


                    map.set(
                        id,
                        {

                          item,

                          report:
                              getExplicitReport(
                                  item
                              )
                        }
                    )
                  }
              )


          return map
        }
    )


/* ==================================================
   PARTICIPANT IDS
================================================== */

const discussionParticipantIds =
    computed(
        () => {

          const order =
              asArray(
                  discussionStore
                      .participants
                      ?.characterOrder
              )


          if (
              order.length
          ) {

            return order
                .map(
                    normalizeId
                )
                .filter(
                    Boolean
                )
          }


          return Object.keys(

              asObject(
                  discussionStore
                      .participants
                      ?.characters
              )
          )
        }
    )


/* ==================================================
   RESOLVED CHARACTER IDS
================================================== */

const resolvedCharacterIds =
    computed(
        () => {

          const ids =
              new Set()


          explicitPositionMap.value
              .forEach(
                  (
                      value,
                      id
                  ) => {

                    ids.add(
                        id
                    )
                  }
              )


          finalMetricMemberMap.value
              .forEach(
                  (
                      value,
                      id
                  ) => {

                    ids.add(
                        id
                    )
                  }
              )


          Object.keys(
              finalSectionCharacterMap.value
          )
              .forEach(
                  id => {

                    ids.add(
                        String(
                            id
                        )
                    )
                  }
              )


          discussionParticipantIds.value
              .forEach(
                  id => {

                    ids.add(
                        id
                    )
                  }
              )


          return [
            ...ids
          ]
        }
    )


/* ==================================================
   STANCE
================================================== */

function rawStanceOf(
    source
) {

  if (
      !source
  ) {

    return ''
  }


  return firstText(

      source?.stance,

      source?.finalStance,

      source?.final_stance,

      source?.position
          ?.stance,

      source?.positionLabel,

      source?.position_label
  )
}


function normalizeStance(
    raw
) {

  const stance =
      String(
          raw
          ??
          ''
      )
          .trim()
          .toLowerCase()


  return stance
      ||
      'undecided'
}


function stanceLabel(
    stance
) {

  switch (
      stance
      ) {

    case 'strong_support':
    case 'strong support':
    case 'strongly_support':
    case 'strongly support':

      return 'STRONG SUPPORT'


    case 'support':
    case 'supports':
    case 'positive':

      return 'SUPPORT'


    case 'conditional_support':
    case 'conditional support':
    case 'conditional':
    case 'cautious':
    case 'caution':

      return 'CAUTIOUS'


    case 'mixed':
    case 'neutral':
    case 'undecided':

      return 'NEUTRAL'


    case 'oppose':
    case 'opposed':
    case 'against':
    case 'negative':

      return 'OPPOSED'


    case 'strong_oppose':
    case 'strong oppose':
    case 'strongly opposed':
    case 'strongly_oppose':

      return 'STRONG OPPOSE'


    default:

      return String(
          stance
      )
          .replace(
              /[_-]+/g,
              ' '
          )
          .toUpperCase()
  }
}


function stanceClass(
    stance
) {

  switch (
      stance
      ) {

    case 'strong_support':
    case 'strong support':
    case 'strongly_support':
    case 'strongly support':
    case 'support':
    case 'supports':
    case 'positive':

      return 'stance-support'


    case 'conditional_support':
    case 'conditional support':
    case 'conditional':
    case 'cautious':
    case 'caution':

      return 'stance-cautious'


    case 'oppose':
    case 'opposed':
    case 'against':
    case 'negative':
    case 'strong_oppose':
    case 'strong oppose':
    case 'strongly opposed':
    case 'strongly_oppose':

      return 'stance-opposed'


    default:

      return 'stance-neutral'
  }
}


/* ==================================================
   CONFIDENCE
================================================== */

function confidenceOf(
    source
) {

  if (
      !source
  ) {

    return null
  }


  const direct =
      firstNumber(

          source?.finalConfidence,

          source?.final_confidence,

          source?.confidenceScore,

          source?.confidence_score
      )


  if (
      direct !==
      null
  ) {

    return direct
  }


  const confidence =
      source?.confidence


  if (
      typeof confidence ===
      'number'
      ||
      typeof confidence ===
      'string'
  ) {

    return numberOrNull(
        confidence
    )
  }


  return firstNumber(

      confidence?.current,

      confidence?.final,

      confidence?.score,

      confidence?.value
  )
}


/* ==================================================
   STATEMENT TEXT
================================================== */

function statementTextOf(
    statement
) {

  if (
      typeof statement ===
      'string'
  ) {

    return cleanText(
        statement
    )
  }


  return firstText(

      statement?.text,

      statement?.content,

      statement?.message,

      statement?.statement,

      statement?.summary
  )
}


function latestStatementOf(
    source
) {

  const statements =
      asArray(
          source?.statements
      )


  for (
      let index =
          statements.length - 1;

      index >= 0;

      index -= 1
  ) {

    const text =
        statementTextOf(
            statements[index]
        )


    if (
        text
    ) {

      return text
    }
  }


  return ''
}


/* ==================================================
   REASON
================================================== */

function reasonOf(
    source
) {

  if (
      !source
  ) {

    return ''
  }


  return firstText(

      source?.summary,

      source?.reasoning,

      source?.reason,

      source?.analysis,

      source?.position
          ?.reasoning,

      source?.position
          ?.statement,

      source?.statement,

      source?.conclusion,

      latestStatementOf(
          source
      )
  )
}


/* ==================================================
   DISCUSSION IDENTITY
================================================== */

function discussionIdentityOf(
    characterId
) {

  const characters =
      asObject(
          discussionStore
              .participants
              ?.characters
      )


  return asObject(
      characters[
          characterId
          ]
  )
}


/* ==================================================
   INITIALS
================================================== */

function initialsOf(
    name
) {

  return String(
      name
      ??
      '?'
  )
      .split(
          /\s+/
      )
      .filter(
          Boolean
      )
      .slice(
          0,
          2
      )
      .map(
          part =>
              part[0]
      )
      .join(
          ''
      )
      .toUpperCase()
}


/* ==================================================
   DISPLAY NAME
================================================== */

function displayNameOf(
    character
) {

  return String(
      character?.name
      ??
      'UNKNOWN'
  )
      .split(
          /\s+/
      )[0]
      .toUpperCase()
}


/* ==================================================
   POSITION ROWS
================================================== */

const positionRows =
    computed(
        () => {

          const panelOrder =
              asArray(
                  characterStore
                      .panelIds
              )
                  .map(
                      normalizeId
                  )


          return resolvedCharacterIds.value

              .map(
                  characterId => {

                    const explicit =
                        explicitPositionMap.value.get(
                            characterId
                        )


                    const explicitItem =
                        explicit?.item
                        ??
                        {}


                    const explicitReport =
                        explicit?.report
                        ??
                        {}


                    const metricMember =
                        finalMetricMemberMap.value.get(
                            characterId
                        )
                        ??
                        {}


                    const characterState =
                        asObject(

                            finalSectionCharacterMap.value[
                                characterId
                                ]
                        )


                    const storeCharacter =
                        characterStore
                            .characterById(
                                characterId
                            )


                    const discussionIdentity =
                        discussionIdentityOf(
                            characterId
                        )


                    const character = {

                      ...discussionIdentity,

                      ...asObject(
                          explicitItem
                      ),

                      ...asObject(
                          storeCharacter
                      )
                    }


                    if (
                        !character?.id
                        &&
                        !character?.name
                    ) {

                      return null
                    }


                    const rawStance =
                        firstText(

                            rawStanceOf(
                                explicitReport
                            ),

                            rawStanceOf(
                                metricMember
                            ),

                            rawStanceOf(
                                characterState
                            )
                        )


                    const stance =
                        normalizeStance(
                            rawStance
                        )


                    const confidence =
                        firstNumber(

                            confidenceOf(
                                explicitReport
                            ),

                            confidenceOf(
                                metricMember
                            ),

                            confidenceOf(
                                characterState
                            )
                        )


                    const reason =
                        firstText(

                            reasonOf(
                                explicitReport
                            ),

                            reasonOf(
                                characterState
                            ),

                            reasonOf(
                                metricMember
                            )
                        )


                    const resolvedId =
                        normalizeId(
                            character?.id
                        )
                        ??
                        characterId


                    const resolvedName =
                        firstText(

                            character?.name,

                            explicitItem?.name,

                            characterId
                        )


                    return {

                      id:
                      resolvedId,

                      name:
                      resolvedName,

                      displayName:
                          displayNameOf({

                            name:
                            resolvedName
                          }),

                      role:

                          character?.role

                          ??

                          explicitItem?.role

                          ??

                          'Council Member',

                      accent:

                          character?.accent

                          ??

                          explicitItem?.accent

                          ??

                          props.primary,

                      image:
                          `/images/char/know/${resolvedId}.png`,

                      initials:
                          initialsOf(
                              resolvedName
                          ),

                      stance,

                      stanceLabel:
                          stanceLabel(
                              stance
                          ),

                      stanceClass:
                          stanceClass(
                              stance
                          ),

                      confidence:

                          confidence !==
                          null

                              ? Math.max(

                                  0,

                                  Math.min(
                                      100,
                                      confidence
                                  )
                              )

                              : null,

                      alignmentScore:
                          numberOrNull(

                              metricMember
                                  ?.alignmentScore

                              ??

                              metricMember
                                  ?.alignment_score
                          ),

                      signedStrength:
                          numberOrNull(

                              metricMember
                                  ?.signedStrength

                              ??

                              metricMember
                                  ?.signed_strength
                          ),

                      reason,

                      rawReport:
                      explicitReport,

                      rawMetric:
                      metricMember,

                      rawCharacterState:
                      characterState
                    }
                  }
              )

              .filter(
                  Boolean
              )

              .sort(
                  (
                      first,
                      second
                  ) => {

                    const firstIndex =
                        panelOrder.indexOf(
                            first.id
                        )


                    const secondIndex =
                        panelOrder.indexOf(
                            second.id
                        )


                    const safeFirst =
                        firstIndex >= 0
                            ? firstIndex
                            : 999


                    const safeSecond =
                        secondIndex >= 0
                            ? secondIndex
                            : 999


                    if (
                        safeFirst !==
                        safeSecond
                    ) {

                      return (
                          safeFirst
                          -
                          safeSecond
                      )
                    }


                    return first.name
                        .localeCompare(
                            second.name
                        )
                  }
              )
        }
    )


/* ==================================================
   DISPLAY STATE
================================================== */

const hasPositions =
    computed(
        () =>
            positionRows.value.length >
            0
    )
</script>


<template>
  <section
      class="council-positions"
      :style="componentStyle"
  >
    <!-- ==================================================
         BACKGROUND DECOR
    =================================================== -->

    <div class="panel-grid" />

    <div class="ambient ambient-primary" />

    <div class="ambient ambient-secondary" />


    <!-- ==================================================
         FRAME
    =================================================== -->

    <span class="frame-corner corner-tl" />

    <span class="frame-corner corner-tr" />

    <span class="frame-corner corner-bl" />

    <span class="frame-corner corner-br" />


    <!-- ==================================================
         HEADER
    =================================================== -->

    <header class="panel-header">
      <div class="header-left">
        <span class="header-icon">
          <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
          >
            <circle
                cx="12"
                cy="7"
                r="3"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
            />

            <path
                d="
                  M5 20
                  C5 15
                  8 12
                  12 12
                  C16 12
                  19 15
                  19 20
                "
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
            />

            <path
                d="
                  M3 10
                  L6 7

                  M21 10
                  L18 7
                "
                fill="none"
                stroke="currentColor"
                stroke-width="1.1"
            />
          </svg>
        </span>


        <div class="header-copy">
          <span class="header-title">
            COUNCIL POSITIONS
          </span>

          <span class="header-subtitle">
            FINAL MEMBER ASSESSMENTS
          </span>
        </div>
      </div>


      <div class="header-count">
        <span class="count-label">
          MEMBERS
        </span>

        <span class="count-value">
          {{
            String(
                positionRows.length
            )
                .padStart(
                    2,
                    '0'
                )
          }}
        </span>
      </div>
    </header>


    <!-- ==================================================
         LIST
    =================================================== -->

    <div
        v-if="hasPositions"
        class="positions-list"
    >
      <article
          v-for="row in positionRows"
          :key="row.id"
          class="position-card"
          :style="{
            '--character-accent':
              row.accent
          }"
      >
        <!-- ==============================================
             IMAGE SECTION
        =============================================== -->

        <div class="portrait-section">
          <div class="portrait-frame">
            <img
                v-if="!imageHasFailed(row.id)"
                class="portrait-image"
                :src="row.image"
                :alt="row.name"
                draggable="false"
                loading="lazy"
                decoding="async"
                @error="
                  handleImageError(row.id)
                "
            />


            <span
                v-else
                class="portrait-fallback"
            >
              {{ row.initials }}
            </span>


            <div class="portrait-vignette" />


            <span
                class="
                  portrait-corner
                  portrait-corner-tl
                "
            />

            <span
                class="
                  portrait-corner
                  portrait-corner-tr
                "
            />

            <span
                class="
                  portrait-corner
                  portrait-corner-bl
                "
            />

            <span
                class="
                  portrait-corner
                  portrait-corner-br
                "
            />
          </div>
        </div>


        <!-- ==============================================
             CONTENT
        =============================================== -->

        <div class="position-content">
          <!-- ============================================
               IDENTITY
          ============================================= -->

          <div class="identity-section">
            <div class="identity-copy">
              <h3 class="character-name">
                {{ row.displayName }}
              </h3>

              <span class="character-role">
                {{ row.role }}
              </span>
            </div>


            <span class="character-glyph">
              <span class="glyph-core" />
            </span>
          </div>


          <!-- ============================================
               DIVIDER
          ============================================= -->

          <div class="content-divider">
            <span />
          </div>


          <!-- ============================================
               METRICS
          ============================================= -->

          <div class="metrics-row">
            <div class="stance-block">
              <span class="metric-label">
                STANCE
              </span>


              <span
                  class="stance-value"
                  :class="row.stanceClass"
              >
                {{ row.stanceLabel }}
              </span>
            </div>


            <div class="confidence-block">
              <span class="metric-label">
                CONFIDENCE
              </span>


              <span class="confidence-value">
                {{
                  row.confidence !== null

                      ? `${Math.round(
                          row.confidence
                      )}%`

                      : '—'
                }}
              </span>
            </div>
          </div>


          <!-- ============================================
               REASON
          ============================================= -->

          <p class="position-reason">
            {{
              row.reason
              ||
              'No position reasoning was recorded.'
            }}
          </p>
        </div>


        <!-- ==============================================
             CARD ACCENT
        =============================================== -->

        <span class="card-accent-line" />
      </article>
    </div>


    <!-- ==================================================
         EMPTY STATE
    =================================================== -->

    <div
        v-else
        class="empty-state"
    >
      <div class="empty-council">
        <span class="empty-orbit orbit-1" />

        <span class="empty-orbit orbit-2" />

        <span class="empty-member member-1" />

        <span class="empty-member member-2" />

        <span class="empty-member member-3" />
      </div>


      <span class="empty-title">
        NO COUNCIL POSITIONS
      </span>


      <span class="empty-description">
        Member positions will appear after the council has evaluated the discussion.
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
   ROOT
================================================== */

.council-positions {
  position: relative;

  container-type:
      inline-size;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  display: grid;

  grid-template-rows:
    auto
    minmax(0, 1fr);

  color:
      rgba(
          245,
          246,
          255,
          0.96
      );

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 35%,
          transparent
      );

  border-radius:
      10px;

  background:
      linear-gradient(
          145deg,
          rgba(7, 6, 22, 0.98),
          rgba(3, 5, 15, 0.97)
      );

  box-shadow:
      inset
      0
      0
      26px
      rgba(126, 62, 255, 0.055),

      0
      0
      18px
      rgba(66, 31, 138, 0.11);

  isolation: isolate;
}


/* ==================================================
   BACKGROUND
================================================== */

.panel-grid {
  position: absolute;

  z-index: -3;

  inset: 0;

  pointer-events: none;

  opacity:
      0.12;

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
              0.055
          )
          1px,
          transparent
          1px
      );

  background-size:
      18px
      18px;
}


.ambient {
  position: absolute;

  z-index: -2;

  pointer-events: none;

  border-radius:
      50%;

  filter:
      blur(36px);
}


.ambient-primary {
  left: -25%;
  top: 8%;

  width: 70%;
  aspect-ratio: 1;

  background:
      color-mix(
          in srgb,
          var(--primary) 8%,
          transparent
      );
}


.ambient-secondary {
  right: -35%;
  bottom: -5%;

  width: 70%;
  aspect-ratio: 1;

  background:
      color-mix(
          in srgb,
          var(--secondary) 5%,
          transparent
      );
}


/* ==================================================
   FRAME CORNERS
================================================== */

.frame-corner {
  position: absolute;

  z-index: 20;

  width: 12px;
  height: 12px;

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

  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 12px;

  padding:
      12px
      14px
      11px;

  border-bottom:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 23%,
          transparent
      );

  background:
      linear-gradient(
          90deg,

          color-mix(
              in srgb,
              var(--primary) 5%,
              transparent
          ),

          transparent 55%
      );
}


.header-left {
  min-width: 0;

  display: flex;

  align-items: center;

  gap: 10px;
}


.header-icon {
  flex:
      0
      0
      auto;

  width: 18px;
  height: 18px;

  color:
      var(--primary);

  filter:
      drop-shadow(
          0
          0
          5px

          color-mix(
              in srgb,
              var(--primary) 45%,
              transparent
          )
      );
}


.header-icon svg {
  display: block;

  width: 100%;
  height: 100%;
}


.header-copy {
  min-width: 0;

  display: flex;
  flex-direction: column;

  gap: 2px;
}


.header-title {
  color:
      var(--primary);

  font-family:
      monospace;

  font-size:
      0.72rem;

  font-weight:
      800;

  letter-spacing:
      0.12em;

  line-height:
      1.1;

  white-space:
      nowrap;
}


.header-subtitle {
  color:
      rgba(
          186,
          199,
          226,
          0.48
      );

  font-family:
      monospace;

  font-size:
      0.52rem;

  font-weight:
      600;

  letter-spacing:
      0.08em;
}


.header-count {
  flex:
      0
      0
      auto;

  display: flex;

  align-items: center;

  gap: 7px;
}


.count-label {
  color:
      rgba(
          165,
          180,
          211,
          0.42
      );

  font-family:
      monospace;

  font-size:
      0.5rem;

  font-weight:
      700;

  letter-spacing:
      0.08em;
}


.count-value {
  color:
      rgba(
          233,
          237,
          252,
          0.75
      );

  font-family:
      monospace;

  font-size:
      0.7rem;

  font-weight:
      800;

  font-variant-numeric:
      tabular-nums;
}


/* ==================================================
   LIST
================================================== */

.positions-list {
  min-width: 0;
  min-height: 0;

  overflow-y: auto;
  overflow-x: hidden;

  display: flex;

  flex-direction: column;

  gap: 10px;

  padding:
      12px
      12px
      14px;

  scrollbar-width:
      thin;

  scrollbar-color:
      color-mix(
          in srgb,
          var(--primary) 55%,
          transparent
      )
      transparent;

  overscroll-behavior:
      contain;
}


.positions-list::-webkit-scrollbar {
  width: 5px;
}


.positions-list::-webkit-scrollbar-track {
  background:
      transparent;
}


.positions-list::-webkit-scrollbar-thumb {
  border-radius:
      999px;

  background:
      linear-gradient(
          180deg,
          var(--primary),
          var(--secondary)
      );
}


/* ==================================================
   POSITION CARD
================================================== */

.position-card {
  position: relative;

  flex:
      0
      0
      auto;

  min-width: 0;

  display: grid;

  grid-template-columns:
    clamp(
        108px,
        31cqw,
        138px
    )
    minmax(0, 1fr);

  gap:
      13px;

  padding:
      9px;

  overflow: hidden;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--character-accent) 30%,
          rgba(255, 255, 255, 0.05)
      );

  border-radius:
      8px;

  background:
      linear-gradient(
          115deg,

          color-mix(
              in srgb,
              var(--character-accent) 5%,
              rgba(9, 8, 25, 0.94)
          ),

          rgba(4, 5, 16, 0.91) 64%
      );

  box-shadow:
      inset
      0
      0
      18px

      color-mix(
          in srgb,
          var(--character-accent) 3%,
          transparent
      );

  transition:
      border-color
      180ms
      ease,

      background
      180ms
      ease;
}


.position-card:hover {
  border-color:
      color-mix(
          in srgb,
          var(--character-accent) 52%,
          transparent
      );

  background:
      linear-gradient(
          115deg,

          color-mix(
              in srgb,
              var(--character-accent) 8%,
              rgba(9, 8, 25, 0.96)
          ),

          rgba(4, 5, 16, 0.93) 68%
      );
}


.card-accent-line {
  position: absolute;

  left: 0;
  top: 14%;

  width: 2px;
  height: 72%;

  border-radius:
      0
      999px
      999px
      0;

  background:
      var(--character-accent);

  box-shadow:
      0
      0
      9px
      var(--character-accent);

  opacity:
      0.65;
}


/* ==================================================
   PORTRAIT
================================================== */

.portrait-section {
  min-width: 0;

  display: flex;

  align-items: flex-start;
}


.portrait-frame {
  position: relative;

  width: 100%;

  aspect-ratio:
      1 / 1;

  overflow: hidden;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--character-accent) 72%,
          transparent
      );

  border-radius:
      5px;

  background:
      #03040d;

  box-shadow:
      0
      0
      12px

      color-mix(
          in srgb,
          var(--character-accent) 11%,
          transparent
      );
}


.portrait-image {
  display: block;

  width: 100%;
  height: 100%;

  object-fit:
      cover;

  object-position:
      center center;

  image-rendering:
      auto;

  -ms-interpolation-mode:
      bicubic;

  user-select:
      none;

  pointer-events:
      none;
}


/* ==================================================
   PORTRAIT VIGNETTE
================================================== */

.portrait-vignette {
  position: absolute;

  inset: 0;

  pointer-events: none;

  background:
      linear-gradient(
          180deg,
          transparent 58%,
          rgba(1, 2, 8, 0.22) 100%
      ),

      linear-gradient(
          90deg,

          color-mix(
              in srgb,
              var(--character-accent) 4%,
              transparent
          ),

          transparent 45%
      );
}


/* ==================================================
   PORTRAIT CORNERS
================================================== */

.portrait-corner {
  position: absolute;

  width: 9px;
  height: 9px;

  pointer-events: none;
}


.portrait-corner-tl {
  left: 3px;
  top: 3px;

  border-left:
      1px solid
      var(--character-accent);

  border-top:
      1px solid
      var(--character-accent);
}


.portrait-corner-tr {
  right: 3px;
  top: 3px;

  border-right:
      1px solid
      var(--character-accent);

  border-top:
      1px solid
      var(--character-accent);
}


.portrait-corner-bl {
  left: 3px;
  bottom: 3px;

  border-left:
      1px solid
      var(--character-accent);

  border-bottom:
      1px solid
      var(--character-accent);
}


.portrait-corner-br {
  right: 3px;
  bottom: 3px;

  border-right:
      1px solid
      var(--character-accent);

  border-bottom:
      1px solid
      var(--character-accent);
}


/* ==================================================
   FALLBACK
================================================== */

.portrait-fallback {
  position: absolute;

  inset: 0;

  display: grid;

  place-items: center;

  color:
      var(--character-accent);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      1.5rem;

  font-weight:
      700;

  text-shadow:
      0
      0
      10px
      var(--character-accent);
}


/* ==================================================
   CONTENT
================================================== */

.position-content {
  min-width: 0;

  display: flex;

  flex-direction: column;

  justify-content: center;

  gap: 7px;

  padding:
      2px
      4px
      2px
      0;
}


/* ==================================================
   IDENTITY
================================================== */

.identity-section {
  min-width: 0;

  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  gap: 8px;
}


.identity-copy {
  min-width: 0;

  display: flex;

  flex-direction: column;

  gap: 3px;
}


.character-name {
  margin: 0;

  overflow: hidden;

  color:
      var(--character-accent);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.88rem,
          3.2cqw,
          1.02rem
      );

  font-weight:
      700;

  line-height:
      1.05;

  letter-spacing:
      0.02em;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;

  text-shadow:
      0
      0
      8px

      color-mix(
          in srgb,
          var(--character-accent) 28%,
          transparent
      );
}


.character-role {
  overflow: hidden;

  color:
      rgba(
          193,
          204,
          228,
          0.58
      );

  font-size:
      clamp(
          0.58rem,
          2.2cqw,
          0.67rem
      );

  font-weight:
      600;

  line-height:
      1.2;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;
}


/* ==================================================
   CHARACTER GLYPH
================================================== */

.character-glyph {
  flex:
      0
      0
      auto;

  width: 14px;
  height: 14px;

  display: grid;

  place-items: center;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--character-accent) 58%,
          transparent
      );

  transform:
      rotate(45deg);

  opacity:
      0.85;
}


.glyph-core {
  width: 4px;
  height: 4px;

  background:
      var(--character-accent);

  box-shadow:
      0
      0
      5px
      var(--character-accent);
}


/* ==================================================
   DIVIDER
================================================== */

.content-divider {
  width: 100%;
  height: 1px;

  overflow: hidden;
}


.content-divider span {
  display: block;

  width: 100%;
  height: 1px;

  background:
      linear-gradient(
          90deg,

          color-mix(
              in srgb,
              var(--character-accent) 35%,
              transparent
          ),

          transparent
      );
}


/* ==================================================
   METRICS
================================================== */

.metrics-row {
  min-width: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    auto;

  gap: 10px;

  align-items: end;
}


.stance-block,
.confidence-block {
  min-width: 0;

  display: flex;

  flex-direction: column;

  gap: 3px;
}


.confidence-block {
  align-items:
      flex-end;
}


.metric-label {
  color:
      rgba(
          161,
          176,
          209,
          0.48
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.5rem,
          1.9cqw,
          0.57rem
      );

  font-weight:
      700;

  letter-spacing:
      0.08em;
}


.stance-value {
  min-width: 0;

  overflow: hidden;

  font-family:
      monospace;

  font-size:
      clamp(
          0.64rem,
          2.3cqw,
          0.72rem
      );

  font-weight:
      800;

  letter-spacing:
      0.035em;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;
}


.stance-support {
  color:
      var(--success);
}


.stance-cautious {
  color:
      var(--warning);
}


.stance-neutral {
  color:
      var(--secondary);
}


.stance-opposed {
  color:
      var(--danger);
}


.confidence-value {
  color:
      rgba(
          244,
          246,
          255,
          0.96
      );

  font-family:
      monospace;

  font-size:
      clamp(
          0.72rem,
          2.5cqw,
          0.8rem
      );

  font-weight:
      800;

  font-variant-numeric:
      tabular-nums;
}


/* ==================================================
   REASON
================================================== */

.position-reason {
  margin: 0;

  min-width: 0;

  display:
      -webkit-box;

  overflow: hidden;

  -webkit-line-clamp:
      3;

  -webkit-box-orient:
      vertical;

  color:
      rgba(
          207,
          216,
          237,
          0.7
      );

  font-size:
      clamp(
          0.65rem,
          2.35cqw,
          0.73rem
      );

  font-weight:
      500;

  line-height:
      1.5;
}


/* ==================================================
   EMPTY STATE
================================================== */

.empty-state {
  min-width: 0;
  min-height: 0;

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 8px;

  padding: 20px;

  text-align: center;
}


.empty-council {
  position: relative;

  width: 92px;
  height: 92px;

  margin-bottom:
      4px;
}


.empty-orbit {
  position: absolute;

  border-radius:
      50%;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 28%,
          transparent
      );
}


.orbit-1 {
  inset: 0;

  border-style:
      dashed;
}


.orbit-2 {
  inset: 19%;
}


.empty-member {
  position: absolute;

  width: 10px;
  height: 10px;

  border:
      1px solid
      var(--primary);

  border-radius:
      50%;

  background:
      #050512;

  box-shadow:
      0
      0
      8px

      color-mix(
          in srgb,
          var(--primary) 40%,
          transparent
      );
}


.member-1 {
  top: 13%;
  left: 50%;

  transform:
      translateX(-50%);
}


.member-2 {
  left: 19%;
  bottom: 20%;
}


.member-3 {
  right: 19%;
  bottom: 20%;
}


.empty-title {
  color:
      var(--primary);

  font-family:
      monospace;

  font-size:
      0.75rem;

  font-weight:
      800;

  letter-spacing:
      0.1em;
}


.empty-description {
  max-width:
      260px;

  color:
      rgba(
          198,
          209,
          234,
          0.58
      );

  font-size:
      0.7rem;

  font-weight:
      500;

  line-height:
      1.55;
}


/* ==================================================
   CONTAINER RESPONSIVE
================================================== */

@container (max-width: 360px) {
  .panel-header {
    padding:
        10px
        11px;
  }


  .header-subtitle,
  .count-label {
    display:
        none;
  }


  .positions-list {
    gap:
        8px;

    padding:
        9px;
  }


  .position-card {
    grid-template-columns:
      104px
      minmax(0, 1fr);

    gap:
        10px;

    padding:
        7px;
  }


  .position-content {
    gap:
        5px;
  }


  .position-reason {
    -webkit-line-clamp:
        2;
  }
}


@container (max-width: 300px) {
  .position-card {
    grid-template-columns:
      92px
      minmax(0, 1fr);
  }


  .character-role {
    display:
        none;
  }


  .position-reason {
    font-size:
        0.62rem;

    -webkit-line-clamp:
        2;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {
  .position-card {
    transition:
        none;
  }
}
</style>
