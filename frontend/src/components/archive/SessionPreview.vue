<script setup>
import {
  computed,
  ref,
  watch
} from 'vue'


import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock3,
  ExternalLink,
  FileText,
  Gauge,
  History,
  ListChecks,
  Pin,
  PinOff,
  Play,
  ShieldAlert,
  Sparkles,
  UsersRound,
} from 'lucide-vue-next'


/* ==================================================
   PROPS

   EXPECTED SNAPSHOT:

   {
     session,
     status,
     sections,
     participants,
     outcome,
     flow,
     loading,
     error
   }
================================================== */

const props =
    defineProps({

      snapshot: {
        type: Object,
        default: () => ({})
      }
    })


/* ==================================================
   EMITS

   This component only forwards interaction intent.

   Session navigation and persisted pinning remain
   owned by the parent/store layer.
================================================== */

const emit =
    defineEmits([
      'continue',
      'open',
      'report',
      'pin'
    ])


/* ==================================================
   LOCAL UI STATE
================================================== */

const activeTab =
    ref(
        'overview'
    )


/* ==================================================
   SAFE HELPERS
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


/* ==================================================
   LABEL FORMATTER
================================================== */

function label(
    value
) {

  return String(
      value
      ??
      ''
  )
      .replace(
          /_/g,
          ' '
      )
      .replace(
          /\b\w/g,
          character =>
              character.toUpperCase()
      )
}


/* ==================================================
   CORE SNAPSHOT STATE
================================================== */

const session =
    computed(() =>
        props.snapshot?.session
        ??
        null
    )


const loading =
    computed(() =>
        Boolean(
            props.snapshot?.loading
        )
    )


const loadError =
    computed(() =>
        props.snapshot?.error
        ??
        null
    )


const status =
    computed(() =>

        props.snapshot?.status

        ??

        session.value?.status

        ??

        'ready'
    )


const flow =
    computed(() =>
        asObject(
            props.snapshot?.flow
        )
    )


const outcome =
    computed(() =>
        asObject(
            props.snapshot?.outcome
        )
    )


const participants =
    computed(() =>
        asObject(
            props.snapshot?.participants
        )
    )


/* ==================================================
   NORMALIZED SECTION ARRAY

   The parent currently supplies orderedSections,
   which is an array.

   Object format is also accepted safely.
================================================== */

const sections =
    computed(() => {

      const value =
          props.snapshot?.sections


      if (
          Array.isArray(
              value
          )
      ) {

        return [

          ...value

        ].sort(

            (
                first,
                second
            ) =>

                Number(
                    first?.sequence
                    ??
                    0
                )

                -

                Number(
                    second?.sequence
                    ??
                    0
                )
        )
      }


      return Object.values(
          asObject(
              value
          )
      )
          .sort(

              (
                  first,
                  second
              ) =>

                  Number(
                      first?.sequence
                      ??
                      0
                  )

                  -

                  Number(
                      second?.sequence
                      ??
                      0
                  )
          )
    })


/* ==================================================
   CURRENT / LATEST SECTION

   Priority:

   1. flow.currentSectionId
   2. final ordered section
================================================== */

const latestSection =
    computed(() => {

      if (
          !sections.value.length
      ) {

        return null
      }


      const currentSectionId =
          normalizeId(
              flow.value?.currentSectionId
          )


      if (
          currentSectionId
      ) {

        const current =
            sections.value.find(

                section =>

                    normalizeId(
                        section?.id
                    )

                    ===

                    currentSectionId
            )


        if (
            current
        ) {

          return current
        }
      }


      return sections.value[
      sections.value.length - 1
          ]
    })


/* ==================================================
   SESSION IDENTITY
================================================== */

const title =
    computed(() =>

        session.value?.title

        ??

        session.value
            ?.calibration
            ?.topic

        ??

        'Untitled Session'
    )


const mode =
    computed(() =>

        session.value?.mode

        ??

        session.value
            ?.calibration
            ?.councilMode

        ??

        'panel'
    )


const currentRound =
    computed(() => {

      const value =
          Number(

              flow.value?.currentRound

              ??

              session.value?.currentRound

              ??

              0
          )


      return Number.isFinite(
          value
      )
          ? value
          : 0
    })


/* ==================================================
   SECTION POSITION
================================================== */

const currentSectionPosition =
    computed(() => {

      if (
          !latestSection.value
      ) {

        return 0
      }


      const index =
          sections.value.findIndex(

              section =>

                  normalizeId(
                      section?.id
                  )

                  ===

                  normalizeId(
                      latestSection.value?.id
                  )
          )


      return index >= 0
          ? index + 1
          : sections.value.length
    })


/* ==================================================
   CONFIDENCE READER
================================================== */

function readConfidence(
    value
) {

  const direct =
      numberOrNull(
          value
      )


  if (
      direct !==
      null
  ) {

    return direct
  }


  if (
      !value
      ||
      typeof value !==
      'object'
  ) {

    return null
  }


  return (

      numberOrNull(
          value.current
      )

      ??

      numberOrNull(
          value.score
      )

      ??

      numberOrNull(
          value.value
      )

      ??

      numberOrNull(
          value.percentage
      )

      ??

      null
  )
}


/* ==================================================
   CONFIDENCE

   For completed discussions:

   final outcome confidence wins.

   For active discussions:

   latest/current section ideaConfidence wins.
================================================== */

const confidence =
    computed(() => {

      const finalConfidence =
          readConfidence(
              outcome.value?.confidence
          )


      const sectionConfidence =
          readConfidence(

              latestSection.value
                  ?.metrics
                  ?.ideaConfidence
          )


      const archiveConfidence =

          readConfidence(
              session.value
                  ?.confidenceInDebate
          )

          ??

          readConfidence(
              session.value
                  ?.confidenceScore
          )


      if (
          status.value ===
          'completed'

          ||

          status.value ===
          'abandoned'
      ) {

        return (

            finalConfidence

            ??

            sectionConfidence

            ??

            archiveConfidence
        )
      }


      return (

          sectionConfidence

          ??

          finalConfidence

          ??

          archiveConfidence
      )
    })


const confidenceLabel =
    computed(() => {

      if (
          confidence.value ===
          null

          ||

          confidence.value ===
          undefined
      ) {

        return '—'
      }


      return `${Math.round(
          confidence.value * 10
      ) / 10}%`
    })


const confidenceTone =
    computed(() => {

      if (
          confidence.value ===
          null

          ||

          confidence.value ===
          undefined
      ) {

        return 'unknown'
      }


      if (
          confidence.value >=
          70
      ) {

        return 'high'
      }


      if (
          confidence.value >=
          45
      ) {

        return 'medium'
      }


      return 'low'
    })


/* ==================================================
   PARTICIPANT CHARACTER MAP
================================================== */

const characterMap =
    computed(() => {

      const rawCharacters =
          participants.value?.characters


      if (
          Array.isArray(
              rawCharacters
          )
      ) {

        const map = {}


        rawCharacters.forEach(
            character => {

              if (
                  !character?.id
              ) {

                return
              }


              map[
                  String(
                      character.id
                  )
                  ] =
                  character
            }
        )


        return map
      }


      return asObject(
          rawCharacters
      )
    })


/* ==================================================
   CHARACTER ORDER
================================================== */

const orderedCharacterIds =
    computed(() => {

      const requestedOrder =
          asArray(

              participants.value?.characterOrder

              ??

              participants.value?.character_order
          )
              .map(
                  normalizeId
              )
              .filter(
                  Boolean
              )


      const discoveredIds =
          Object.keys(
              characterMap.value
          )


      return [

        ...requestedOrder,

        ...discoveredIds.filter(

            id =>

                !requestedOrder.includes(
                    id
                )
        )
      ]
    })


/* ==================================================
   PARTICIPANT NAME LOOKUP
================================================== */

function participantName(
    characterId
) {

  const id =
      normalizeId(
          characterId
      )


  if (!id) {

    return 'Council Member'
  }


  return (

      characterMap.value[
          id
          ]?.name

      ??

      id
  )
}


/* ==================================================
   DISCUSSION MEMBERS

   Uses authoritative participants first.

   Falls back to archive session member data while
   detailed discussion hydration is loading.
================================================== */

const discussionMembers =
    computed(() => {

      const result =
          orderedCharacterIds.value

              .map(
                  characterId => {

                    const character =
                        characterMap.value[
                            characterId
                            ]


                    if (
                        !character
                    ) {

                      return null
                    }


                    return {

                      ...character,

                      id:
                      characterId,

                      isMediator:
                          false
                    }
                  }
              )

              .filter(
                  Boolean
              )


      const mediator =
          participants.value?.mediator

          ??

          session.value?.mediator

          ??

          null


      if (
          mode.value ===
          'mediator'
      ) {

        if (
            mediator
        ) {

          return [

            {
              ...mediator,

              id:
                  normalizeId(
                      mediator.id
                  )
                  ??
                  'mediator',

              isMediator:
                  true
            }
          ]
        }


        return []
      }


      if (
          result.length
      ) {

        if (
            mediator
        ) {

          result.push({

            ...mediator,

            id:
                normalizeId(
                    mediator.id
                )
                ??
                'mediator',

            isMediator:
                true
          })
        }


        return result
      }


      const fallback =
          asArray(

              session.value?.discussionMembers

              ??

              session.value?.members

              ??

              session.value?.panelMembers
          )


      return fallback.map(
          member => ({

            ...member,

            id:
                normalizeId(
                    member?.id
                )
                ??
                member?.name,

            isMediator:
                false
          })
      )
    })


/* ==================================================
   MEMBER INITIALS
================================================== */

function initialsOf(
    member
) {

  const name =
      String(

          member?.name

          ??

          member?.id

          ??

          '?'
      )
          .trim()


  const words =
      name
          .split(
              /\s+/
          )
          .filter(
              Boolean
          )


  if (
      words.length >
      1
  ) {

    return (

        words[0][0]

        +

        words[
        words.length - 1
            ][0]
    )
        .toUpperCase()
  }


  return name
      .slice(
          0,
          2
      )
      .toUpperCase()
}


/* ==================================================
   INSIGHT ITEM NORMALIZATION
================================================== */

function itemTitle(
    item
) {

  if (
      typeof item ===
      'string'
  ) {

    return item
  }


  return (

      item?.title

      ??

      item?.name

      ??

      item?.label

      ??

      item?.risk

      ??

      item?.action

      ??

      item?.text

      ??

      item?.description

      ??

      item?.content

      ??

      'Untitled Item'
  )
}


function itemDescription(
    item
) {

  if (
      typeof item ===
      'string'
  ) {

    return ''
  }


  const description =

      item?.description

      ??

      item?.reasoning

      ??

      item?.detail

      ??

      item?.details

      ??

      item?.rationale

      ??

      item?.context

      ??

      ''


  return description ===
  itemTitle(
      item
  )
      ? ''
      : description
}


/* ==================================================
   NORMALIZE RISK / ACTION ITEM
================================================== */

function normalizeInsightItem(
    item,
    {
      type,
      sourceCharacterId = null,
      sourceName = null,
      index = 0
    }
) {

  if (
      item === null
      ||
      item === undefined
  ) {

    return null
  }


  const object =
      typeof item ===
      'object'

          ? item

          : {
            title:
                String(
                    item
                )
          }


  const titleValue =
      itemTitle(
          object
      )


  const statusValue =
      String(

          object?.status

          ??

          (
              object?.completed
                  ? 'completed'
                  : 'open'
          )
      )
          .toLowerCase()


  const completed =

      object?.completed ===
      true

      ||

      [
        'completed',
        'done',
        'resolved',
        'closed'
      ].includes(
          statusValue
      )


  return {

    ...object,


    id:
        normalizeId(

            object?.id

            ??

            object?.riskId

            ??

            object?.risk_id

            ??

            object?.actionId

            ??

            object?.action_id
        )

        ??

        `${type}-${sourceCharacterId ?? 'session'}-${index}-${titleValue}`,


    type,


    title:
    titleValue,


    description:
        itemDescription(
            object
        ),


    severity:
        String(
            object?.severity
            ??
            object?.level
            ??
            'medium'
        )
            .toLowerCase(),


    priority:
        String(
            object?.priority
            ??
            object?.urgency
            ??
            'medium'
        )
            .toLowerCase(),


    status:
    statusValue,


    completed,


    sourceCharacterId:
        normalizeId(
            sourceCharacterId
        ),


    sourceName:
        sourceName
        ??
        (
            sourceCharacterId
                ? participantName(
                    sourceCharacterId
                )
                : null
        )
  }
}


/* ==================================================
   UNIQUE INSIGHT ITEMS
================================================== */

function uniqueItems(
    items
) {

  const seen =
      new Set()


  return asArray(
      items
  )
      .filter(
          Boolean
      )
      .filter(
          item => {

            const key =
                String(

                    item?.id

                    ??

                    `${item?.title}-${item?.description}`
                )
                    .trim()
                    .toLowerCase()


            if (
                seen.has(
                    key
                )
            ) {

              return false
            }


            seen.add(
                key
            )


            return true
          }
      )
}


/* ==================================================
   COLLECT ITEMS FROM SECTION

   Character section state contains:

   risks: []
   actions: []
================================================== */

function collectSectionItems(
    section,
    key,
    type
) {

  if (
      !section
  ) {

    return []
  }


  const result = []


  Object.entries(

      asObject(
          section?.characters
      )

  ).forEach(

      ([
         characterId,
         characterState
       ]) => {

        asArray(
            characterState?.[key]
        )
            .forEach(

                (
                    item,
                    index
                ) => {

                  const normalized =
                      normalizeInsightItem(

                          item,

                          {
                            type,

                            sourceCharacterId:
                            characterId,

                            sourceName:
                                participantName(
                                    characterId
                                ),

                            index
                          }
                      )


                  if (
                      normalized
                  ) {

                    result.push(
                        normalized
                    )
                  }
                }
            )
      }
  )


  return uniqueItems(
      result
  )
}


/* ==================================================
   RISKS

   Priority:

   1. final outcome risks
   2. current/latest section character risks
   3. enriched archive session risks
================================================== */

const risks =
    computed(() => {

      const finalRisks =
          asArray(
              outcome.value?.risks
          )
              .map(

                  (
                      risk,
                      index
                  ) =>

                      normalizeInsightItem(

                          risk,

                          {
                            type:
                                'risk',

                            index
                          }
                      )
              )
              .filter(
                  Boolean
              )


      if (
          finalRisks.length
      ) {

        return uniqueItems(
            finalRisks
        )
      }


      const sectionRisks =
          collectSectionItems(

              latestSection.value,

              'risks',

              'risk'
          )


      if (
          sectionRisks.length
      ) {

        return sectionRisks
      }


      return uniqueItems(

          asArray(
              session.value?.risks
          )
              .map(

                  (
                      risk,
                      index
                  ) =>

                      normalizeInsightItem(

                          risk,

                          {
                            type:
                                'risk',

                            index
                          }
                      )
              )
      )
    })


/* ==================================================
   ACTIONS

   Priority:

   1. final outcome actions
   2. current/latest section character actions
================================================== */

const actions =
    computed(() => {

      const finalActions =
          asArray(
              outcome.value?.actions
          )
              .map(

                  (
                      action,
                      index
                  ) =>

                      normalizeInsightItem(

                          action,

                          {
                            type:
                                'action',

                            index
                          }
                      )
              )
              .filter(
                  Boolean
              )


      if (
          finalActions.length
      ) {

        return uniqueItems(
            finalActions
        )
      }


      return collectSectionItems(

          latestSection.value,

          'actions',

          'action'
      )
    })


/* ==================================================
   RISK SORTING
================================================== */

const riskPriorityOrder = {

  critical:
      5,

  high:
      4,

  medium:
      3,

  moderate:
      3,

  low:
      2,

  info:
      1
}


const sortedRisks =
    computed(() =>

        [
          ...risks.value
        ].sort(

            (
                first,
                second
            ) =>

                (
                    riskPriorityOrder[
                        second?.severity
                        ] ?? 0
                )

                -

                (
                    riskPriorityOrder[
                        first?.severity
                        ] ?? 0
                )
        )
    )


/* ==================================================
   ACTION SORTING

   Open actions before completed actions.
================================================== */

const actionPriorityOrder = {

  urgent:
      5,

  critical:
      5,

  high:
      4,

  medium:
      3,

  normal:
      3,

  low:
      2
}


const sortedActions =
    computed(() =>

        [
          ...actions.value
        ].sort(

            (
                first,
                second
            ) => {

              if (
                  first.completed
                  !==
                  second.completed
              ) {

                return Number(
                        first.completed
                    )
                    -
                    Number(
                        second.completed
                    )
              }


              return (

                  (
                      actionPriorityOrder[
                          second?.priority
                          ] ?? 0
                  )

                  -

                  (
                      actionPriorityOrder[
                          first?.priority
                          ] ?? 0
                  )
              )
            }
        )
    )


/* ==================================================
   COUNTS
================================================== */

const highRiskCount =
    computed(() =>

        risks.value.filter(

            risk =>

                [
                  'high',
                  'critical'
                ].includes(
                    risk?.severity
                )
        )
            .length
    )


const openActionCount =
    computed(() =>

        actions.value.filter(
            action =>
                !action.completed
        )
            .length
    )


const completedActionCount =
    computed(() =>

        actions.value.filter(
            action =>
                action.completed
        )
            .length
    )


/* ==================================================
   REPLY COUNT
================================================== */

const replies =
    computed(() =>

        sections.value.reduce(

            (
                count,
                section
            ) => {

              const characterReplies =
                  Object.values(

                      asObject(
                          section?.characters
                      )

                  ).reduce(

                      (
                          total,
                          character
                      ) =>

                          total

                          +

                          asArray(
                              character?.statementHistory
                          )
                              .length,

                      0
                  )


              const mediatorReplies =
                  asArray(
                      section
                          ?.mediator
                          ?.statements
                  )
                      .length


              const userReplies =
                  asArray(
                      section
                          ?.user
                          ?.messages
                  )
                      .length


              return (

                  count

                  +

                  characterReplies

                  +

                  mediatorReplies

                  +

                  userReplies
              )
            },

            0
        )
    )


/* ==================================================
   DATE
================================================== */

const formattedDate =
    computed(() => {

      const value =

          session.value?.updatedAt

          ??

          session.value?.createdAt


      if (
          !value
      ) {

        return 'No timestamp'
      }


      const date =
          new Date(
              value
          )


      if (
          Number.isNaN(
              date.getTime()
          )
      ) {

        return 'No timestamp'
      }


      return date.toLocaleString(

          [],

          {
            month:
                'short',

            day:
                'numeric',

            year:
                'numeric',

            hour:
                '2-digit',

            minute:
                '2-digit'
          }
      )
    })


/* ==================================================
   TABS
================================================== */

const tabs =
    computed(() => [

      {
        key:
            'overview',

        label:
            'Overview',

        count:
            null
      },


      {
        key:
            'risks',

        label:
            'Risks',

        count:
        risks.value.length
      },


      {
        key:
            'actions',

        label:
            'Actions',

        count:
        actions.value.length
      },


      {
        key:
            'members',

        label:
            'Members',

        count:
        discussionMembers.value.length
      },


      {
        key:
            'timeline',

        label:
            'Timeline',

        count:
        sections.value.length
      }
    ])


/* ==================================================
   SECTION ITEM COUNTS
================================================== */

function sectionRiskCount(
    section
) {

  return collectSectionItems(

      section,

      'risks',

      'risk'
  )
      .length
}


function sectionActionCount(
    section
) {

  return collectSectionItems(

      section,

      'actions',

      'action'
  )
      .length
}


/* ==================================================
   SECTION CONFIDENCE
================================================== */

function sectionConfidence(
    section
) {

  return readConfidence(
      section
          ?.metrics
          ?.ideaConfidence
  )
}


function sectionConfidenceLabel(
    section
) {

  const value =
      sectionConfidence(
          section
      )


  return value ===
  null

      ? '—'

      : `${Math.round(
          value * 10
      ) / 10}%`
}


/* ==================================================
   SECTION ROUND COUNT
================================================== */

function sectionRoundCount(
    section
) {

  return Object.keys(

      asObject(
          section?.rounds
      )

  ).length
}


/* ==================================================
   ACTION / RISK DISPLAY HELPERS
================================================== */

function riskSeverity(
    risk
) {

  return risk?.severity
      ??
      'medium'
}


function actionStatus(
    action
) {

  if (
      action?.completed
  ) {

    return 'completed'
  }


  return action?.status
      ??
      'open'
}


/* ==================================================
   SESSION ACTION STATE
================================================== */

const normalizedStatus =
    computed(() =>

        String(
            status.value
            ??
            ''
        )
            .trim()
            .toLowerCase()
    )


const sessionIsTerminal =
    computed(() =>

        [
          'complete',
          'completed',
          'abandoned'
        ].includes(
            normalizedStatus.value
        )
    )


const canContinue =
    computed(() => {

      if (
          sessionIsTerminal.value
      ) {

        return false
      }


      return [
        'ready',
        'active',
        'paused'
      ].includes(
          normalizedStatus.value
      )
    })


const continueLabel =
    computed(() => {

      if (
          normalizedStatus.value ===
          'complete'

          ||

          normalizedStatus.value ===
          'completed'
      ) {

        return 'Session Complete'
      }


      if (
          normalizedStatus.value ===
          'abandoned'
      ) {

        return 'Session Closed'
      }


      if (
          normalizedStatus.value ===
          'ready'
      ) {

        return 'Start Session'
      }


      if (
          normalizedStatus.value ===
          'paused'
      ) {

        return 'Resume Session'
      }


      return 'Continue Session'
    })


/* ==================================================
   RESET TAB ON SESSION CHANGE
================================================== */

watch(

    () =>
        session.value?.id,

    () => {

      activeTab.value =
          'overview'
    }
)
</script>


<template>
  <aside class="preview">

    <!-- ==================================================
         DECORATIVE PANEL LAYERS
    ================================================== -->

    <div class="panel-glow" />

    <div class="circuit-line circuit-line-a" />
    <div class="circuit-line circuit-line-b" />


    <!-- ==================================================
         EMPTY STATE
    ================================================== -->

    <div
        v-if="!session"
        class="empty"
    >
      <div class="empty-sigil">
        <Activity :size="24" />
      </div>

      <strong>
        No session selected
      </strong>

      <span>
        Select an archive record to inspect its discussion intelligence.
      </span>
    </div>


    <!-- ==================================================
         SESSION
    ================================================== -->

    <template v-else>

      <!-- ==================================================
           HEADER
      ================================================== -->

      <header class="preview-head">

        <div class="title-block">

          <div class="eyebrow-row">

            <span class="eyebrow-line" />

            <span class="type-label">
              {{
                mode ===
                'mediator'
                    ? 'MEDIATOR SESSION'
                    : 'COUNCIL SESSION'
              }}
            </span>

            <span class="record-id">
              RECORD //
              {{
                String(session.id)
                    .slice(0, 8)
                    .toUpperCase()
              }}
            </span>

          </div>


          <h2>
            {{ title }}
          </h2>


          <div class="meta-row">

            <span
                class="status-chip"
                :class="
                  status
                "
            >
              <i />

              {{
                label(
                    status
                )
              }}
            </span>


            <span class="meta-chip">
              <Clock3 :size="10" />

              Round
              {{ currentRound }}
            </span>


            <span class="meta-chip">
              <Activity :size="10" />

              Section
              {{ currentSectionPosition }}
              /
              {{ sections.length }}
            </span>

          </div>


          <div class="date">
            <Clock3 :size="11" />

            {{ formattedDate }}
          </div>

        </div>


        <!-- ==============================================
             SIGIL
        ============================================== -->

        <div class="sigil-wrap">

          <div class="sigil-ring ring-one" />
          <div class="sigil-ring ring-two" />

          <div class="sigil-core">

            <Sparkles
                v-if="
                  mode ===
                  'mediator'
                "
                :size="25"
            />

            <UsersRound
                v-else
                :size="25"
            />

          </div>

        </div>

      </header>


      <!-- ==================================================
           DETAIL LOADING
      ================================================== -->

      <div
          v-if="loading"
          class="detail-state"
      >
        <div class="scanner">
          <span />
          <span />
          <span />
        </div>

        <strong>
          Synchronizing discussion record
        </strong>

        <small>
          Loading section intelligence, risks, actions and participants...
        </small>
      </div>


      <!-- ==================================================
           DETAIL ERROR
      ================================================== -->

      <div
          v-else-if="loadError"
          class="detail-state detail-error"
      >
        <AlertTriangle :size="25" />

        <strong>
          Discussion detail unavailable
        </strong>

        <small>
          The archive record exists, but its detailed discussion snapshot could not be loaded.
        </small>
      </div>


      <!-- ==================================================
           DETAIL CONTENT
      ================================================== -->

      <template v-else>

        <!-- ==================================================
             METRICS
        ================================================== -->

        <section class="metrics">

          <!-- ==============================================
               CONFIDENCE
          ============================================== -->

          <div
              class="metric"
              :class="
                `confidence-${confidenceTone}`
              "
          >
            <div class="metric-top">

              <Gauge :size="12" />

              <small>
                CONFIDENCE
              </small>

            </div>


            <div class="metric-value">
              {{ confidenceLabel }}
            </div>


            <span>
              {{
                latestSection?.title
                ??
                'Current debate'
              }}
            </span>


            <div class="metric-line">
              <i />
            </div>

          </div>


          <!-- ==============================================
               RISKS
          ============================================== -->

          <div class="metric metric-risk">

            <div class="metric-top">

              <ShieldAlert :size="12" />

              <small>
                RISKS
              </small>

            </div>


            <div class="metric-value">
              {{ risks.length }}
            </div>


            <span>
              {{ highRiskCount }}
              high priority
            </span>


            <div class="metric-line">
              <i />
            </div>

          </div>


          <!-- ==============================================
               ACTIONS
          ============================================== -->

          <div class="metric metric-action">

            <div class="metric-top">

              <ListChecks :size="12" />

              <small>
                ACTIONS
              </small>

            </div>


            <div class="metric-value">
              {{ openActionCount }}
            </div>


            <span>
              {{ completedActionCount }}
              completed
            </span>


            <div class="metric-line">
              <i />
            </div>

          </div>


          <!-- ==============================================
               REPLIES
          ============================================== -->

          <div class="metric metric-activity">

            <div class="metric-top">

              <Activity :size="12" />

              <small>
                REPLIES
              </small>

            </div>


            <div class="metric-value">
              {{ replies }}
            </div>


            <span>
              {{ discussionMembers.length }}
              participants
            </span>


            <div class="metric-line">
              <i />
            </div>

          </div>

        </section>


        <!-- ==================================================
             TABS
        ================================================== -->

        <nav class="tabs">

          <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              :class="{
                active:
                  activeTab ===
                  tab.key
              }"
              @click="
                activeTab =
                  tab.key
              "
          >
            <span>
              {{ tab.label }}
            </span>

            <small
                v-if="
                  tab.count !==
                  null
                "
            >
              {{ tab.count }}
            </small>
          </button>

        </nav>


        <!-- ==================================================
             TAB CONTENT
        ================================================== -->

        <section class="tab-content">

          <!-- ==================================================
               OVERVIEW

               No fake summaries.

               Overview is the actionable intelligence view:
               RISKS + ACTIONS.
          ================================================== -->

          <div
              v-if="
                activeTab ===
                'overview'
              "
              class="overview"
          >

            <!-- ==============================================
                 CURRENT SECTION STRIP
            ============================================== -->

            <div class="section-strip">

              <div class="section-strip-icon">
                <Activity :size="14" />
              </div>


              <div class="section-strip-copy">

                <small>
                  CURRENT DISCUSSION POINT
                </small>

                <strong>
                  {{
                    latestSection?.title
                    ??
                    'No section loaded'
                  }}
                </strong>

              </div>


              <div class="section-strip-meta">

                <span>
                  ROUND
                </span>

                <strong>
                  {{ currentRound }}
                </strong>

              </div>


              <div class="section-strip-meta">

                <span>
                  CONF
                </span>

                <strong>
                  {{ confidenceLabel }}
                </strong>

              </div>

            </div>


            <!-- ==============================================
                 INTELLIGENCE GRID
            ============================================== -->

            <div class="intelligence-grid">

              <!-- ============================================
                   RISK PREVIEW
              ============================================ -->

              <article class="intel-panel risks-panel">

                <header class="intel-head">

                  <div>

                    <span class="intel-icon">
                      <ShieldAlert :size="14" />
                    </span>

                    <div>
                      <small>
                        THREAT MATRIX
                      </small>

                      <strong>
                        Priority Risks
                      </strong>
                    </div>

                  </div>


                  <button
                      type="button"
                      @click="
                        activeTab =
                          'risks'
                      "
                  >
                    VIEW ALL

                    <ArrowRight :size="11" />
                  </button>

                </header>


                <div
                    v-if="
                      sortedRisks.length
                    "
                    class="compact-list"
                >

                  <article
                      v-for="
                        (risk, index)
                        in
                        sortedRisks.slice(
                          0,
                          4
                        )
                      "
                      :key="risk.id"
                      class="compact-item risk-item"
                  >

                    <span class="item-index">
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


                    <div class="compact-copy">

                      <strong>
                        {{ risk.title }}
                      </strong>

                      <small
                          v-if="
                            risk.sourceName
                          "
                      >
                        FLAGGED BY //
                        {{ risk.sourceName }}
                      </small>

                    </div>


                    <span
                        class="severity"
                        :class="
                          riskSeverity(
                            risk
                          )
                        "
                    >
                      {{
                        label(
                            riskSeverity(
                                risk
                            )
                        )
                      }}
                    </span>

                  </article>

                </div>


                <div
                    v-else
                    class="intel-empty"
                >
                  <CheckCircle2 :size="18" />

                  <span>
                    No risks have been identified for the current discussion state.
                  </span>
                </div>

              </article>


              <!-- ============================================
                   ACTION PREVIEW
              ============================================ -->

              <article class="intel-panel actions-panel">

                <header class="intel-head">

                  <div>

                    <span class="intel-icon">
                      <ListChecks :size="14" />
                    </span>

                    <div>
                      <small>
                        EXECUTION QUEUE
                      </small>

                      <strong>
                        Next Actions
                      </strong>
                    </div>

                  </div>


                  <button
                      type="button"
                      @click="
                        activeTab =
                          'actions'
                      "
                  >
                    VIEW ALL

                    <ArrowRight :size="11" />
                  </button>

                </header>


                <div
                    v-if="
                      sortedActions.length
                    "
                    class="compact-list"
                >

                  <article
                      v-for="
                        (action, index)
                        in
                        sortedActions.slice(
                          0,
                          4
                        )
                      "
                      :key="action.id"
                      class="compact-item action-item"
                      :class="{
                        completed:
                          action.completed
                      }"
                  >

                    <span class="action-check">

                      <Check
                          v-if="
                            action.completed
                          "
                          :size="10"
                      />

                      <Circle
                          v-else
                          :size="9"
                      />

                    </span>


                    <div class="compact-copy">

                      <strong>
                        {{ action.title }}
                      </strong>

                      <small
                          v-if="
                            action.sourceName
                          "
                      >
                        PROPOSED BY //
                        {{ action.sourceName }}
                      </small>

                    </div>


                    <span class="action-state">
                      {{
                        label(
                            actionStatus(
                                action
                            )
                        )
                      }}
                    </span>

                  </article>

                </div>


                <div
                    v-else
                    class="intel-empty"
                >
                  <ListChecks :size="18" />

                  <span>
                    No actions have been generated for the current discussion state.
                  </span>
                </div>

              </article>

            </div>

          </div>


          <!-- ==================================================
               RISKS TAB
          ================================================== -->

          <div
              v-else-if="
                activeTab ===
                'risks'
              "
              class="detail-list"
          >

            <header class="list-heading">

              <div>

                <small>
                  DISCUSSION INTELLIGENCE
                </small>

                <h3>
                  Identified Risks
                </h3>

              </div>


              <span>
                {{ risks.length }}
                TOTAL
              </span>

            </header>


            <div
                v-if="
                  sortedRisks.length
                "
                class="risk-grid"
            >

              <article
                  v-for="
                    (risk, index)
                    in
                    sortedRisks
                  "
                  :key="risk.id"
                  class="risk-card"
                  :class="
                    riskSeverity(
                      risk
                    )
                  "
              >

                <div class="risk-card-index">
                  R-{{
                    String(
                        index + 1
                    )
                        .padStart(
                            2,
                            '0'
                        )
                  }}
                </div>


                <div class="risk-card-icon">
                  <AlertTriangle :size="15" />
                </div>


                <div class="risk-card-copy">

                  <div class="risk-card-top">

                    <strong>
                      {{ risk.title }}
                    </strong>


                    <span
                        class="severity"
                        :class="
                          riskSeverity(
                            risk
                          )
                        "
                    >
                      {{
                        label(
                            riskSeverity(
                                risk
                            )
                        )
                      }}
                    </span>

                  </div>


                  <p
                      v-if="
                        risk.description
                      "
                  >
                    {{ risk.description }}
                  </p>


                  <small
                      v-if="
                        risk.sourceName
                      "
                  >
                    SOURCE //
                    {{ risk.sourceName }}
                  </small>

                </div>

              </article>

            </div>


            <div
                v-else
                class="large-empty"
            >
              <CheckCircle2 :size="26" />

              <strong>
                No identified risks
              </strong>

              <span>
                The current discussion state has not produced any recorded risk items.
              </span>
            </div>

          </div>


          <!-- ==================================================
               ACTIONS TAB
          ================================================== -->

          <div
              v-else-if="
                activeTab ===
                'actions'
              "
              class="detail-list"
          >

            <header class="list-heading">

              <div>

                <small>
                  EXECUTION PLAN
                </small>

                <h3>
                  Recommended Actions
                </h3>

              </div>


              <span>
                {{ openActionCount }}
                OPEN
              </span>

            </header>


            <div
                v-if="
                  sortedActions.length
                "
                class="action-list"
            >

              <article
                  v-for="
                    (action, index)
                    in
                    sortedActions
                  "
                  :key="action.id"
                  class="action-card"
                  :class="{
                    completed:
                      action.completed
                  }"
              >

                <div class="action-order">
                  {{
                    String(
                        index + 1
                    )
                        .padStart(
                            2,
                            '0'
                        )
                  }}
                </div>


                <div class="action-status-icon">

                  <CheckCircle2
                      v-if="
                        action.completed
                      "
                      :size="17"
                  />

                  <CircleDot
                      v-else
                      :size="17"
                  />

                </div>


                <div class="action-card-copy">

                  <div class="action-card-head">

                    <strong>
                      {{ action.title }}
                    </strong>


                    <span
                        class="priority-chip"
                        :class="
                          action.priority
                        "
                    >
                      {{
                        label(
                            action.priority
                        )
                      }}
                    </span>

                  </div>


                  <p
                      v-if="
                        action.description
                      "
                  >
                    {{ action.description }}
                  </p>


                  <div class="action-meta">

                    <span>
                      STATUS //
                      {{
                        label(
                            actionStatus(
                                action
                            )
                        )
                      }}
                    </span>


                    <span
                        v-if="
                          action.sourceName
                        "
                    >
                      SOURCE //
                      {{ action.sourceName }}
                    </span>

                  </div>

                </div>

              </article>

            </div>


            <div
                v-else
                class="large-empty"
            >
              <ListChecks :size="26" />

              <strong>
                No actions recorded
              </strong>

              <span>
                Recommended actions will appear here as the discussion develops.
              </span>
            </div>

          </div>


          <!-- ==================================================
               MEMBERS TAB
          ================================================== -->

          <div
              v-else-if="
                activeTab ===
                'members'
              "
              class="members-view"
          >

            <header class="list-heading">

              <div>

                <small>
                  SESSION PARTICIPANTS
                </small>

                <h3>
                  Discussion Members
                </h3>

              </div>


              <span>
                {{ discussionMembers.length }}
                ACTIVE
              </span>

            </header>


            <div
                v-if="
                  discussionMembers.length
                "
                class="member-grid"
            >

              <article
                  v-for="
                    member
                    in
                    discussionMembers
                  "
                  :key="member.id"
                  class="member-card"
                  :class="{
                    mediator:
                      member.isMediator
                  }"
              >

                <div class="member-avatar">
                  {{ initialsOf(member) }}
                </div>


                <div class="member-copy">

                  <div class="member-name-row">

                    <strong>
                      {{
                        member.name
                        ??
                        member.id
                      }}
                    </strong>


                    <span
                        v-if="
                          member.isMediator
                        "
                    >
                      MEDIATOR
                    </span>

                  </div>


                  <small>
                    {{
                      member.role
                      ??
                      (
                          member.isMediator
                              ? 'Mediator'
                              : 'Council Member'
                      )
                    }}
                  </small>


                  <p
                      v-if="
                        member.description
                      "
                  >
                    {{ member.description }}
                  </p>


                  <div
                      v-if="
                        asArray(
                          member.focusAreas
                        ).length
                      "
                      class="member-tags"
                  >

                    <span
                        v-for="
                          area
                          in
                          asArray(
                            member.focusAreas
                          ).slice(
                            0,
                            3
                          )
                        "
                        :key="area"
                    >
                      {{ area }}
                    </span>

                  </div>

                </div>

              </article>

            </div>


            <div
                v-else
                class="large-empty"
            >
              <UsersRound :size="26" />

              <strong>
                No participants available
              </strong>

              <span>
                Participant data was not included in this discussion snapshot.
              </span>
            </div>

          </div>


          <!-- ==================================================
               TIMELINE TAB
          ================================================== -->

          <div
              v-else
              class="timeline-view"
          >

            <header class="list-heading">

              <div>

                <small>
                  DISCUSSION FLOW
                </small>

                <h3>
                  Section Timeline
                </h3>

              </div>


              <span>
                {{ sections.length }}
                SECTIONS
              </span>

            </header>


            <div
                v-if="
                  sections.length
                "
                class="timeline"
            >

              <article
                  v-for="
                    (section, index)
                    in
                    sections
                  "
                  :key="section.id"
                  class="timeline-item"
                  :class="{
                    current:
                      normalizeId(
                        section.id
                      ) ===
                      normalizeId(
                        latestSection?.id
                      )
                  }"
              >

                <div class="timeline-rail">

                  <span class="timeline-node">
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


                  <i
                      v-if="
                        index <
                        sections.length - 1
                      "
                  />

                </div>


                <div class="timeline-card">

                  <header>

                    <div>

                      <small>
                        SECTION
                        {{
                          String(
                              index + 1
                          )
                              .padStart(
                                  2,
                                  '0'
                              )
                        }}
                      </small>

                      <strong>
                        {{
                          section.title
                          ??
                          'Untitled Section'
                        }}
                      </strong>

                    </div>


                    <span
                        class="timeline-status"
                        :class="
                          section.status
                        "
                    >
                      {{
                        label(
                            section.status
                            ??
                            'pending'
                        )
                      }}
                    </span>

                  </header>


                  <p
                      v-if="
                        section.description
                      "
                  >
                    {{ section.description }}
                  </p>


                  <div class="timeline-metrics">

                    <span>
                      <Clock3 :size="10" />

                      {{
                        sectionRoundCount(
                            section
                        )
                      }}
                      rounds
                    </span>


                    <span>
                      <Gauge :size="10" />

                      {{
                        sectionConfidenceLabel(
                            section
                        )
                      }}
                    </span>


                    <span>
                      <ShieldAlert :size="10" />

                      {{
                        sectionRiskCount(
                            section
                        )
                      }}
                      risks
                    </span>


                    <span>
                      <ListChecks :size="10" />

                      {{
                        sectionActionCount(
                            section
                        )
                      }}
                      actions
                    </span>

                  </div>

                </div>

              </article>

            </div>


            <div
                v-else
                class="large-empty"
            >
              <History :size="26" />

              <strong>
                No timeline available
              </strong>

              <span>
                Discussion sections have not been generated yet.
              </span>
            </div>

          </div>

        </section>


        <!-- ==================================================
             FOOTER ACTIONS
        ================================================== -->

        <footer class="footer-actions">

          <button
              class="primary-action"
              :class="{
                disabled:
                  !canContinue
              }"
              type="button"
              :disabled="
                !canContinue
              "
              @click="
                canContinue

                &&

                emit(
                  'continue',
                  session.id
                )
              "
          >
            <CheckCircle2
                v-if="
                  sessionIsTerminal
                "
                :size="13"
            />

            <Play
                v-else
                :size="13"
            />

            <span>
              {{ continueLabel }}
            </span>

            <ArrowRight
                v-if="
                  canContinue
                "
                :size="13"
            />
          </button>


          <button
              class="secondary-action"
              type="button"
              @click="
                emit(
                  'open',
                  session.id
                )
              "
          >
            <ExternalLink :size="12" />

            <span>
              Open
            </span>
          </button>


          <button
              class="secondary-action"
              type="button"
              @click="
                emit(
                  'report',
                  session.id
                )
              "
          >
            <FileText :size="12" />

            <span>
              Report
            </span>
          </button>


          <button
              class="secondary-action pin-action"
              :class="{
                active:
                  session.pinned
              }"
              type="button"
              @click="
                emit(
                  'pin',
                  session.id
                )
              "
          >
            <PinOff
                v-if="
                  session.pinned
                "
                :size="12"
            />

            <Pin
                v-else
                :size="12"
            />

            <span>
              {{
                session.pinned
                    ? 'Unpin'
                    : 'Pin'
              }}
            </span>
          </button>

        </footer>

      </template>

    </template>

  </aside>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.preview {
  position: relative;

  width: 100%;
  height: 100%;
  min-height: 0;

  padding:
      1.1vw
      1.05vw
      .85vw;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  border:
      1px solid
      rgba(161, 78, 255, .38);

  clip-path:
      polygon(
          0 0,
          calc(100% - 1.25vw) 0,
          100% 1.6vh,
          100% 100%,
          1vw 100%,
          0 calc(100% - 1.3vh)
      );

  background:
      linear-gradient(
          145deg,
          rgba(13, 10, 31, .975),
          rgba(4, 12, 24, .96) 55%,
          rgba(5, 8, 20, .975)
      );

  box-shadow:
      inset 0 0 36px
      rgba(121, 58, 255, .065),

      inset 0 0 0 1px
      rgba(71, 206, 255, .025),

      0 0 22px
      rgba(122, 52, 255, .08);

  color:
      rgba(220, 231, 246, .78);
}


/* ==================================================
   DECORATIVE BACKGROUND
================================================== */

.panel-glow {
  position: absolute;

  width:
      13vw;

  height:
      13vw;

  right:
      -7vw;

  top:
      -6vw;

  pointer-events:
      none;

  border-radius:
      50%;

  background:
      radial-gradient(
          circle,
          rgba(141, 72, 255, .14),
          transparent 68%
      );

  filter:
      blur(12px);
}


.circuit-line {
  position: absolute;

  pointer-events:
      none;

  opacity:
      .22;
}


.circuit-line::before,
.circuit-line::after {
  content:
      '';

  position: absolute;

  background:
      linear-gradient(
          90deg,
          rgba(71, 210, 255, 0),
          rgba(71, 210, 255, .3),
          rgba(71, 210, 255, 0)
      );
}


.circuit-line-a {
  top:
      10.5vh;

  right:
      0;

  width:
      5vw;

  height:
      2vh;

  border-top:
      1px solid
      rgba(65, 206, 255, .14);

  border-left:
      1px solid
      rgba(65, 206, 255, .12);
}


.circuit-line-b {
  left:
      0;

  bottom:
      5vh;

  width:
      4vw;

  height:
      2.5vh;

  border-top:
      1px solid
      rgba(170, 88, 255, .12);

  border-right:
      1px solid
      rgba(170, 88, 255, .12);
}


/* ==================================================
   HEADER
================================================== */

.preview-head {
  position: relative;
  z-index: 1;

  display: grid;

  grid-template-columns:
      minmax(0, 1fr)
      4.3vw;

  align-items:
      start;

  gap:
      .8vw;

  flex:
      0 0 auto;

  padding-bottom:
      1.1vh;

  border-bottom:
      1px solid
      rgba(84, 194, 255, .07);
}


.eyebrow-row {
  display: flex;
  align-items: center;

  gap:
      .35vw;

  min-width:
      0;
}


.eyebrow-line {
  width:
      .8vw;

  height:
      1px;

  background:
      #a75dff;

  box-shadow:
      0 0 6px
      rgba(167, 93, 255, .65);
}


.type-label {
  flex:
      0 0 auto;

  font-size:
      .42vw;

  letter-spacing:
      .12em;

  color:
      rgba(190, 120, 255, .8);
}


.record-id {
  overflow:
      hidden;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;

  font-size:
      .35vw;

  letter-spacing:
      .08em;

  color:
      rgba(124, 157, 190, .34);
}


h2 {
  max-width:
      18vw;

  margin:
      .55vh 0
      .75vh;

  font-family:
      Georgia,
      serif;

  font-size:
      1.05vw;

  line-height:
      1.15;

  font-weight:
      400;

  color:
      rgba(240, 245, 255, .96);
}


.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  gap:
      .34vw;
}


.status-chip,
.meta-chip {
  min-height:
      1.85vh;

  padding:
      .2vh
      .38vw;

  display: inline-flex;
  align-items: center;

  gap:
      .25vw;

  border:
      1px solid
      rgba(117, 151, 190, .14);

  background:
      rgba(8, 17, 31, .42);

  font-size:
      .4vw;

  letter-spacing:
      .02em;

  color:
      rgba(180, 199, 222, .58);
}


.status-chip i {
  width:
      .25vw;

  aspect-ratio:
      1;

  border-radius:
      50%;

  background:
      currentColor;

  box-shadow:
      0 0 5px
      currentColor;
}


.status-chip.active {
  color:
      #45e0c7;

  border-color:
      rgba(69, 224, 199, .22);
}


.status-chip.paused {
  color:
      #e7b65f;

  border-color:
      rgba(231, 182, 95, .22);
}


.status-chip.completed {
  color:
      #5fc9ff;

  border-color:
      rgba(95, 201, 255, .22);
}


.status-chip.ready {
  color:
      #b978ff;

  border-color:
      rgba(185, 120, 255, .24);
}


.status-chip.abandoned {
  color:
      #ff7088;

  border-color:
      rgba(255, 112, 136, .24);
}


.date {
  margin-top:
      .65vh;

  display: flex;
  align-items: center;

  gap:
      .28vw;

  font-size:
      .42vw;

  color:
      rgba(154, 177, 205, .4);
}


/* ==================================================
   SIGIL
================================================== */

.sigil-wrap {
  position: relative;

  width:
      3.7vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;
}


.sigil-ring {
  position: absolute;

  inset:
      0;

  border:
      1px solid
      rgba(165, 80, 255, .2);

  transform:
      rotate(45deg);
}


.ring-two {
  inset:
      .45vw;

  border-color:
      rgba(65, 205, 255, .17);

  transform:
      rotate(0deg);
}


.sigil-core {
  width:
      2vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  color:
      #ad67ff;

  text-shadow:
      0 0 15px
      rgba(168, 87, 255, .7);
}


/* ==================================================
   METRICS
================================================== */

.metrics {
  flex:
      0 0 auto;

  display: grid;

  grid-template-columns:
      repeat(4, 1fr);

  margin-top:
      .8vh;

  border:
      1px solid
      rgba(84, 196, 255, .07);

  background:
      rgba(1, 7, 16, .4);
}


.metric {
  position: relative;

  min-width:
      0;

  padding:
      .62vh
      .55vw
      .55vh;

  overflow:
      hidden;

  border-right:
      1px solid
      rgba(84, 196, 255, .055);
}


.metric:last-child {
  border-right:
      0;
}


.metric-top {
  display: flex;
  align-items: center;

  gap:
      .28vw;

  color:
      rgba(103, 205, 255, .65);
}


.metric-top small {
  font-size:
      .34vw;

  letter-spacing:
      .09em;
}


.metric-value {
  margin-top:
      .15vh;

  font-family:
      Georgia,
      serif;

  font-size:
      .95vw;

  color:
      #56d7ff;
}


.metric > span {
  display: block;

  margin-top:
      .05vh;

  overflow:
      hidden;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;

  font-size:
      .34vw;

  color:
      rgba(145, 168, 196, .38);
}


.metric-line {
  position: absolute;

  left:
      .55vw;

  right:
      .55vw;

  bottom:
      0;

  height:
      1px;

  background:
      rgba(79, 201, 255, .05);
}


.metric-line i {
  display: block;

  width:
      36%;

  height:
      100%;

  background:
      rgba(80, 211, 255, .7);

  box-shadow:
      0 0 5px
      rgba(80, 211, 255, .5);
}


.metric-risk
.metric-top,
.metric-risk
.metric-value {
  color:
      #ff718b;
}


.metric-risk
.metric-line i {
  background:
      #ff5e7c;

  box-shadow:
      0 0 5px
      rgba(255, 94, 124, .45);
}


.metric-action
.metric-top,
.metric-action
.metric-value {
  color:
      #5ee2c5;
}


.metric-action
.metric-line i {
  background:
      #4ee0bf;

  box-shadow:
      0 0 5px
      rgba(78, 224, 191, .45);
}


.metric-activity
.metric-top,
.metric-activity
.metric-value {
  color:
      #b879ff;
}


.metric-activity
.metric-line i {
  background:
      #ad65ff;

  box-shadow:
      0 0 5px
      rgba(173, 101, 255, .5);
}


.confidence-high
.metric-value {
  color:
      #56e3c1;
}


.confidence-medium
.metric-value {
  color:
      #e4c669;
}


.confidence-low
.metric-value {
  color:
      #ff7186;
}


/* ==================================================
   TABS
================================================== */

.tabs {
  flex:
      0 0 auto;

  display: flex;
  align-items: center;

  gap:
      .95vw;

  height:
      3.4vh;

  border-bottom:
      1px solid
      rgba(89, 197, 255, .08);
}


.tabs button {
  position: relative;

  height:
      100%;

  padding:
      0;

  display: inline-flex;
  align-items: center;

  gap:
      .25vw;

  border:
      0;

  background:
      transparent;

  color:
      rgba(169, 188, 213, .42);

  font-family:
      Georgia,
      serif;

  font-size:
      .48vw;

  cursor:
      pointer;

  transition:
      color .18s ease;
}


.tabs button small {
  min-width:
      .8vw;

  padding:
      .1vh
      .2vw;

  border:
      1px solid
      rgba(111, 153, 197, .1);

  font-family:
      sans-serif;

  font-size:
      .3vw;

  text-align:
      center;

  color:
      rgba(137, 164, 194, .38);
}


.tabs button.active {
  color:
      rgba(235, 243, 255, .92);
}


.tabs button.active small {
  color:
      #6fd9ff;

  border-color:
      rgba(80, 207, 255, .18);

  background:
      rgba(60, 188, 238, .04);
}


.tabs button.active::after {
  content:
      '';

  position: absolute;

  left:
      0;

  right:
      0;

  bottom:
      -1px;

  height:
      1px;

  background:
      #5ad8ff;

  box-shadow:
      0 0 7px
      rgba(90, 216, 255, .75);
}


/* ==================================================
   TAB CONTENT
================================================== */

.tab-content {
  flex:
      1;

  min-height:
      0;

  overflow-y:
      auto;

  overflow-x:
      hidden;

  padding:
      .7vh
      .1vw
      .45vh;

  scrollbar-width:
      thin;

  scrollbar-color:
      rgba(84, 199, 255, .18)
      transparent;
}


.tab-content::-webkit-scrollbar {
  width:
      3px;
}


.tab-content::-webkit-scrollbar-thumb {
  background:
      rgba(84, 199, 255, .18);
}


/* ==================================================
   CURRENT SECTION STRIP
================================================== */

.section-strip {
  min-height:
      3.8vh;

  display: grid;

  grid-template-columns:
      1.45vw
      minmax(0, 1fr)
      2.4vw
      2.8vw;

  align-items: center;

  gap:
      .45vw;

  padding:
      .45vh
      .55vw;

  margin-bottom:
      .65vh;

  border:
      1px solid
      rgba(87, 203, 255, .08);

  background:
      linear-gradient(
          90deg,
          rgba(37, 133, 184, .055),
          rgba(81, 48, 139, .035)
      );
}


.section-strip-icon {
  width:
      1.3vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(77, 201, 255, .18);

  color:
      #5fd7ff;
}


.section-strip-copy {
  min-width:
      0;

  display: grid;

  gap:
      .08vh;
}


.section-strip-copy small,
.section-strip-meta span {
  font-size:
      .3vw;

  letter-spacing:
      .08em;

  color:
      rgba(134, 162, 191, .38);
}


.section-strip-copy strong {
  overflow:
      hidden;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;

  font-size:
      .48vw;

  font-weight:
      500;

  color:
      rgba(216, 230, 247, .78);
}


.section-strip-meta {
  display: grid;

  gap:
      .05vh;
}


.section-strip-meta strong {
  font-family:
      Georgia,
      serif;

  font-size:
      .64vw;

  font-weight:
      400;

  color:
      #75dfff;
}


/* ==================================================
   OVERVIEW GRID
================================================== */

.intelligence-grid {
  display: grid;

  grid-template-columns:
      1fr
      1fr;

  gap:
      .55vw;
}


.intel-panel {
  min-width:
      0;

  border:
      1px solid
      rgba(88, 190, 244, .075);

  background:
      rgba(2, 9, 19, .38);

  overflow:
      hidden;
}


.risks-panel {
  border-top-color:
      rgba(255, 100, 130, .2);
}


.actions-panel {
  border-top-color:
      rgba(79, 223, 192, .2);
}


.intel-head {
  min-height:
      3.3vh;

  padding:
      .42vh
      .5vw;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-bottom:
      1px solid
      rgba(88, 190, 244, .06);
}


.intel-head > div {
  display: flex;
  align-items: center;

  gap:
      .4vw;
}


.intel-icon {
  width:
      1.35vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(87, 203, 255, .14);

  color:
      #65d7ff;
}


.risks-panel
.intel-icon {
  color:
      #ff7088;

  border-color:
      rgba(255, 112, 136, .18);
}


.actions-panel
.intel-icon {
  color:
      #58dec1;

  border-color:
      rgba(88, 222, 193, .18);
}


.intel-head small {
  display: block;

  font-size:
      .28vw;

  letter-spacing:
      .08em;

  color:
      rgba(131, 158, 189, .38);
}


.intel-head strong {
  display: block;

  margin-top:
      .05vh;

  font-family:
      Georgia,
      serif;

  font-size:
      .5vw;

  font-weight:
      400;

  color:
      rgba(224, 235, 249, .82);
}


.intel-head button {
  padding:
      .2vh
      .3vw;

  display: flex;
  align-items: center;

  gap:
      .18vw;

  border:
      0;

  background:
      transparent;

  color:
      rgba(93, 206, 255, .58);

  font-size:
      .29vw;

  letter-spacing:
      .06em;

  cursor:
      pointer;
}


/* ==================================================
   COMPACT LISTS
================================================== */

.compact-list {
  display: grid;
}


.compact-item {
  min-height:
      3.65vh;

  padding:
      .38vh
      .45vw;

  display: grid;
  align-items: center;

  border-bottom:
      1px solid
      rgba(89, 180, 229, .05);
}


.compact-item:last-child {
  border-bottom:
      0;
}


.risk-item {
  grid-template-columns:
      1vw
      minmax(0, 1fr)
      auto;

  gap:
      .35vw;
}


.action-item {
  grid-template-columns:
      .8vw
      minmax(0, 1fr)
      auto;

  gap:
      .35vw;
}


.item-index {
  font-family:
      Georgia,
      serif;

  font-size:
      .42vw;

  color:
      rgba(255, 109, 135, .48);
}


.compact-copy {
  min-width:
      0;

  display: grid;

  gap:
      .08vh;
}


.compact-copy strong {
  overflow:
      hidden;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;

  font-size:
      .43vw;

  font-weight:
      500;

  color:
      rgba(208, 222, 241, .72);
}


.compact-copy small {
  overflow:
      hidden;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;

  font-size:
      .26vw;

  letter-spacing:
      .05em;

  color:
      rgba(123, 151, 180, .34);
}


.severity,
.priority-chip {
  padding:
      .17vh
      .28vw;

  border:
      1px solid
      rgba(143, 166, 194, .12);

  font-size:
      .28vw;

  text-transform:
      uppercase;
}


.severity.critical,
.severity.high {
  color:
      #ff637d;

  border-color:
      rgba(255, 99, 125, .2);

  background:
      rgba(255, 72, 101, .045);
}


.severity.medium,
.severity.moderate {
  color:
      #e1b65f;

  border-color:
      rgba(225, 182, 95, .18);
}


.severity.low {
  color:
      #65d1ff;

  border-color:
      rgba(101, 209, 255, .16);
}


.action-check {
  display: grid;
  place-items: center;

  color:
      #59dec1;
}


.action-item.completed {
  opacity:
      .48;
}


.action-state {
  font-size:
      .27vw;

  text-transform:
      uppercase;

  color:
      rgba(94, 217, 192, .55);
}


/* ==================================================
   INTEL EMPTY
================================================== */

.intel-empty {
  min-height:
      8vh;

  padding:
      1vh
      1vw;

  display: flex;
  align-items: center;
  justify-content: center;

  gap:
      .45vw;

  text-align:
      center;

  color:
      rgba(139, 168, 198, .42);

  font-size:
      .4vw;
}


/* ==================================================
   LIST HEADINGS
================================================== */

.list-heading {
  min-height:
      3.7vh;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding:
      .2vh
      .15vw
      .55vh;

  border-bottom:
      1px solid
      rgba(87, 193, 246, .07);

  margin-bottom:
      .55vh;
}


.list-heading small {
  display: block;

  font-size:
      .29vw;

  letter-spacing:
      .1em;

  color:
      rgba(160, 97, 237, .58);
}


.list-heading h3 {
  margin:
      .12vh
      0
      0;

  font-family:
      Georgia,
      serif;

  font-size:
      .67vw;

  font-weight:
      400;

  color:
      rgba(230, 238, 250, .88);
}


.list-heading > span {
  padding:
      .22vh
      .35vw;

  border:
      1px solid
      rgba(92, 203, 255, .12);

  color:
      rgba(101, 210, 255, .58);

  font-size:
      .3vw;

  letter-spacing:
      .06em;
}


/* ==================================================
   RISK CARDS
================================================== */

.risk-grid {
  display: grid;

  grid-template-columns:
      1fr
      1fr;

  gap:
      .45vw;
}


.risk-card {
  position: relative;

  min-height:
      6.5vh;

  padding:
      .55vh
      .55vw;

  display: grid;

  grid-template-columns:
      1.35vw
      minmax(0, 1fr);

  gap:
      .45vw;

  border:
      1px solid
      rgba(255, 105, 132, .09);

  background:
      linear-gradient(
          135deg,
          rgba(65, 20, 39, .09),
          rgba(4, 11, 22, .38)
      );

  overflow:
      hidden;
}


.risk-card::before {
  content:
      '';

  position: absolute;

  left:
      0;

  top:
      0;

  bottom:
      0;

  width:
      1px;

  background:
      rgba(255, 102, 128, .5);

  box-shadow:
      0 0 7px
      rgba(255, 102, 128, .4);
}


.risk-card.medium::before,
.risk-card.moderate::before {
  background:
      rgba(224, 183, 91, .55);
}


.risk-card.low::before {
  background:
      rgba(97, 206, 255, .55);
}


.risk-card-index {
  position: absolute;

  right:
      .35vw;

  bottom:
      .2vh;

  font-size:
      .27vw;

  letter-spacing:
      .08em;

  color:
      rgba(255, 101, 129, .2);
}


.risk-card-icon {
  width:
      1.25vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(255, 104, 133, .15);

  color:
      #ff6b84;
}


.risk-card-copy {
  min-width:
      0;
}


.risk-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap:
      .4vw;
}


.risk-card-copy strong {
  font-size:
      .45vw;

  line-height:
      1.25;

  font-weight:
      500;

  color:
      rgba(224, 232, 245, .82);
}


.risk-card-copy p {
  margin:
      .28vh
      0;

  font-size:
      .38vw;

  line-height:
      1.4;

  color:
      rgba(160, 182, 208, .5);
}


.risk-card-copy > small {
  font-size:
      .27vw;

  letter-spacing:
      .05em;

  color:
      rgba(130, 156, 187, .35);
}


/* ==================================================
   ACTION CARDS
================================================== */

.action-list {
  display: grid;

  gap:
      .4vh;
}


.action-card {
  min-height:
      5.4vh;

  display: grid;

  grid-template-columns:
      1.1vw
      1.4vw
      minmax(0, 1fr);

  align-items: start;

  gap:
      .35vw;

  padding:
      .48vh
      .55vw;

  border:
      1px solid
      rgba(75, 221, 190, .08);

  background:
      linear-gradient(
          90deg,
          rgba(20, 73, 66, .07),
          rgba(4, 12, 23, .36)
      );
}


.action-card.completed {
  opacity:
      .5;
}


.action-order {
  padding-top:
      .15vh;

  font-family:
      Georgia,
      serif;

  font-size:
      .43vw;

  color:
      rgba(83, 221, 191, .44);
}


.action-status-icon {
  width:
      1.25vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(77, 220, 190, .15);

  color:
      #55ddbf;
}


.action-card-copy {
  min-width:
      0;
}


.action-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap:
      .5vw;
}


.action-card-head strong {
  font-size:
      .46vw;

  font-weight:
      500;

  color:
      rgba(220, 233, 246, .82);
}


.priority-chip {
  color:
      rgba(98, 216, 194, .64);
}


.priority-chip.high,
.priority-chip.urgent,
.priority-chip.critical {
  color:
      #ff788d;

  border-color:
      rgba(255, 120, 141, .18);
}


.action-card-copy p {
  margin:
      .25vh
      0;

  font-size:
      .38vw;

  line-height:
      1.38;

  color:
      rgba(158, 181, 206, .5);
}


.action-meta {
  display: flex;
  flex-wrap: wrap;

  gap:
      .8vw;

  font-size:
      .27vw;

  letter-spacing:
      .05em;

  color:
      rgba(124, 154, 184, .34);
}


/* ==================================================
   MEMBER GRID
================================================== */

.member-grid {
  display: grid;

  grid-template-columns:
      1fr
      1fr;

  gap:
      .45vw;
}


.member-card {
  min-height:
      7vh;

  padding:
      .55vh
      .55vw;

  display: grid;

  grid-template-columns:
      1.65vw
      minmax(0, 1fr);

  gap:
      .5vw;

  border:
      1px solid
      rgba(97, 188, 241, .08);

  background:
      rgba(3, 10, 21, .38);
}


.member-card.mediator {
  border-color:
      rgba(176, 91, 255, .13);

  background:
      linear-gradient(
          135deg,
          rgba(89, 38, 135, .06),
          rgba(3, 10, 21, .38)
      );
}


.member-avatar {
  width:
      1.55vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(84, 203, 255, .19);

  background:
      linear-gradient(
          145deg,
          rgba(34, 104, 143, .22),
          rgba(23, 22, 57, .34)
      );

  color:
      #89e3ff;

  font-family:
      Georgia,
      serif;

  font-size:
      .42vw;
}


.member-card.mediator
.member-avatar {
  color:
      #bd7aff;

  border-color:
      rgba(189, 122, 255, .22);
}


.member-copy {
  min-width:
      0;
}


.member-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap:
      .4vw;
}


.member-name-row strong {
  overflow:
      hidden;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;

  font-size:
      .45vw;

  font-weight:
      500;

  color:
      rgba(224, 235, 248, .84);
}


.member-name-row span {
  padding:
      .12vh
      .22vw;

  border:
      1px solid
      rgba(183, 104, 255, .16);

  color:
      rgba(189, 119, 255, .62);

  font-size:
      .25vw;

  letter-spacing:
      .05em;
}


.member-copy > small {
  display: block;

  margin-top:
      .08vh;

  font-size:
      .31vw;

  color:
      rgba(111, 199, 239, .48);
}


.member-copy p {
  margin:
      .3vh
      0;

  max-height:
      2.4em;

  overflow:
      hidden;

  font-size:
      .34vw;

  line-height:
      1.2;

  color:
      rgba(151, 174, 202, .42);
}


.member-tags {
  display: flex;
  flex-wrap: wrap;

  gap:
      .2vw;
}


.member-tags span {
  padding:
      .1vh
      .22vw;

  border:
      1px solid
      rgba(101, 193, 237, .09);

  color:
      rgba(120, 197, 232, .4);

  font-size:
      .25vw;
}


/* ==================================================
   TIMELINE
================================================== */

.timeline {
  display: grid;
}


.timeline-item {
  display: grid;

  grid-template-columns:
      1.6vw
      minmax(0, 1fr);

  gap:
      .45vw;
}


.timeline-rail {
  position: relative;

  display: flex;
  flex-direction: column;
  align-items: center;
}


.timeline-node {
  position: relative;
  z-index: 1;

  width:
      1.3vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(157, 85, 245, .22);

  background:
      rgba(21, 13, 40, .95);

  color:
      rgba(183, 108, 255, .72);

  font-family:
      Georgia,
      serif;

  font-size:
      .38vw;
}


.timeline-item.current
.timeline-node {
  color:
      #6be0ff;

  border-color:
      rgba(85, 215, 255, .38);

  box-shadow:
      0 0 10px
      rgba(85, 215, 255, .13);
}


.timeline-rail i {
  flex:
      1;

  width:
      1px;

  min-height:
      1.5vh;

  background:
      linear-gradient(
          rgba(151, 84, 233, .18),
          rgba(79, 200, 255, .08)
      );
}


.timeline-card {
  margin-bottom:
      .5vh;

  padding:
      .5vh
      .55vw;

  border:
      1px solid
      rgba(92, 189, 238, .07);

  background:
      rgba(3, 10, 20, .34);
}


.timeline-item.current
.timeline-card {
  border-color:
      rgba(83, 211, 255, .16);

  background:
      linear-gradient(
          90deg,
          rgba(39, 141, 180, .055),
          rgba(3, 10, 20, .34)
      );
}


.timeline-card header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap:
      .5vw;
}


.timeline-card header small {
  display: block;

  font-size:
      .26vw;

  letter-spacing:
      .08em;

  color:
      rgba(150, 91, 229, .48);
}


.timeline-card header strong {
  display: block;

  margin-top:
      .08vh;

  font-size:
      .45vw;

  font-weight:
      500;

  color:
      rgba(220, 231, 246, .8);
}


.timeline-status {
  padding:
      .13vh
      .28vw;

  border:
      1px solid
      rgba(110, 150, 190, .1);

  color:
      rgba(149, 177, 206, .46);

  font-size:
      .27vw;

  text-transform:
      uppercase;
}


.timeline-status.active {
  color:
      #55dfc2;

  border-color:
      rgba(85, 223, 194, .17);
}


.timeline-status.complete,
.timeline-status.completed {
  color:
      #65d2ff;

  border-color:
      rgba(101, 210, 255, .17);
}


.timeline-card p {
  margin:
      .3vh
      0;

  font-size:
      .35vw;

  color:
      rgba(151, 173, 199, .42);
}


.timeline-metrics {
  display: flex;
  flex-wrap: wrap;

  gap:
      .55vw;

  margin-top:
      .35vh;
}


.timeline-metrics span {
  display: flex;
  align-items: center;

  gap:
      .16vw;

  font-size:
      .28vw;

  color:
      rgba(136, 165, 196, .38);
}


/* ==================================================
   LARGE EMPTY STATES
================================================== */

.large-empty {
  min-height:
      15vh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap:
      .4vh;

  text-align:
      center;

  color:
      rgba(112, 197, 236, .4);
}


.large-empty strong {
  font-family:
      Georgia,
      serif;

  font-size:
      .58vw;

  font-weight:
      400;

  color:
      rgba(197, 217, 238, .6);
}


.large-empty span {
  max-width:
      12vw;

  font-size:
      .37vw;

  line-height:
      1.45;

  color:
      rgba(144, 169, 197, .36);
}


/* ==================================================
   LOADING / ERROR
================================================== */

.detail-state {
  flex:
      1;

  min-height:
      0;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap:
      .45vh;

  text-align:
      center;
}


.detail-state strong {
  font-family:
      Georgia,
      serif;

  font-size:
      .62vw;

  font-weight:
      400;

  color:
      rgba(216, 232, 248, .72);
}


.detail-state small {
  max-width:
      14vw;

  font-size:
      .36vw;

  line-height:
      1.5;

  color:
      rgba(136, 163, 194, .4);
}


.detail-error {
  color:
      rgba(255, 106, 131, .7);
}


.scanner {
  display: flex;

  gap:
      .25vw;

  margin-bottom:
      .4vh;
}


.scanner span {
  width:
      .3vw;

  height:
      1.3vh;

  background:
      rgba(84, 211, 255, .7);

  box-shadow:
      0 0 7px
      rgba(84, 211, 255, .45);

  animation:
      scan-pulse
      .9s
      ease-in-out
      infinite;
}


.scanner span:nth-child(2) {
  animation-delay:
      .15s;
}


.scanner span:nth-child(3) {
  animation-delay:
      .3s;
}


/* ==================================================
   FOOTER ACTIONS
================================================== */

.footer-actions {
  flex:
      0 0 auto;

  min-height:
      3.45vh;

  display: grid;

  grid-template-columns:
      minmax(0, 1.55fr)
      .7fr
      .75fr
      .65fr;

  gap:
      .38vw;

  margin-top:
      .45vh;

  padding-top:
      .55vh;

  border-top:
      1px solid
      rgba(86, 196, 251, .07);
}


.footer-actions button {
  min-width:
      0;

  min-height:
      2.8vh;

  display: flex;
  align-items: center;
  justify-content: center;

  gap:
      .3vw;

  border:
      1px solid
      rgba(110, 146, 183, .15);

  background:
      rgba(3, 10, 22, .55);

  color:
      rgba(188, 209, 232, .6);

  font:
      inherit;

  font-size:
      .4vw;

  cursor:
      pointer;

  transition:
      border-color .18s ease,
      color .18s ease,
      background .18s ease,
      box-shadow .18s ease;
}


.footer-actions button:hover {
  color:
      rgba(230, 241, 255, .88);

  border-color:
      rgba(92, 205, 255, .3);

  background:
      rgba(31, 109, 148, .07);
}


.primary-action {
  border-color:
      rgba(173, 81, 255, .48)
  !important;

  background:
      linear-gradient(
          90deg,
          rgba(120, 44, 205, .34),
          rgba(91, 42, 157, .15)
      )
  !important;

  color:
      rgba(246, 235, 255, .92)
  !important;

  box-shadow:
      inset 0 0 15px
      rgba(167, 76, 255, .1),

      0 0 10px
      rgba(135, 57, 224, .05);
}


.primary-action span {
  flex:
      1;

  text-align:
      center;
}


.primary-action:disabled,
.primary-action.disabled {
  cursor:
      not-allowed;

  opacity:
      .38;

  filter:
      saturate(.35);

  border-color:
      rgba(112, 126, 148, .18)
  !important;

  background:
      linear-gradient(
          90deg,
          rgba(46, 55, 73, .2),
          rgba(17, 25, 40, .14)
      )
  !important;

  color:
      rgba(164, 179, 199, .48)
  !important;

  box-shadow:
      inset 0 0 12px
      rgba(85, 106, 136, .04)
  !important;
}


.primary-action:disabled:hover,
.primary-action.disabled:hover {
  border-color:
      rgba(112, 126, 148, .18)
  !important;

  background:
      linear-gradient(
          90deg,
          rgba(46, 55, 73, .2),
          rgba(17, 25, 40, .14)
      )
  !important;

  color:
      rgba(164, 179, 199, .48)
  !important;
}


.pin-action.active {
  color:
      #c27fff;

  border-color:
      rgba(194, 127, 255, .28);
}


/* ==================================================
   EMPTY SESSION
================================================== */

.empty {
  height:
      100%;

  padding:
      2vw;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap:
      .45vh;

  text-align:
      center;
}


.empty-sigil {
  width:
      2.7vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  margin-bottom:
      .3vh;

  border:
      1px solid
      rgba(94, 204, 255, .14);

  transform:
      rotate(45deg);

  color:
      rgba(103, 211, 255, .55);
}


.empty-sigil svg {
  transform:
      rotate(-45deg);
}


.empty strong {
  font-family:
      Georgia,
      serif;

  font-size:
      .7vw;

  font-weight:
      400;

  color:
      rgba(212, 228, 245, .62);
}


.empty span {
  max-width:
      13vw;

  font-size:
      .4vw;

  line-height:
      1.5;

  color:
      rgba(143, 169, 198, .38);
}


/* ==================================================
   ANIMATION
================================================== */

@keyframes scan-pulse {

  0%,
  100% {
    opacity:
        .25;

    transform:
        scaleY(.5);
  }

  50% {
    opacity:
        1;

    transform:
        scaleY(1);
  }
}
</style>
