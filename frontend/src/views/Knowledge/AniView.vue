<script setup>
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import ConversationReportSelector from '@/components/knowledge/SliderSelector.vue'
import ReportDossierHeader from '@/components/knowledge/ReportDossierHeader.vue'
import FinalVerdictPanel from '@/components/knowledge/FinalVerdictPanel.vue'
import KeyOutcomePanel from '@/components/knowledge/KeyOutcomePanel.vue'
import ConfidenceTrendPanel from '@/components/knowledge/ConfidenceTrendPanel.vue'
import AlignmentBreakdownPanel from '@/components/knowledge/AlignmentBreakdownPanel.vue'
import DeliberationTimelinePanel from '@/components/knowledge/DeliberationTimelinePanel.vue'
import RisksActionsStack from '@/components/knowledge/RisksActionsStack.vue'
import CouncilPositionsPanel from '@/components/knowledge/CouncilPositionsPanel.vue'

import { useDebatesStore } from '@/stores/debates.js'
import { useCurrentDiscussionStore } from '@/stores/currentDiscussion.js'
import { useReportStore } from '@/stores/reportStore.js'


/* ==================================================
   PROPS / ROUTE
================================================== */

const props = defineProps({
  sessionId: {
    type: [
      String,
      Number
    ],

    default: null
  }
})

const route = useRoute()


/* ==================================================
   STORES
================================================== */

const debatesStore = useDebatesStore()
const discussionStore = useCurrentDiscussionStore()
const reportStore = useReportStore()

const {
  orderedDebates,
  selectedDebate,
  selectedDebateId,

  isLoading: debatesLoading,
  error: debatesError
} = storeToRefs(debatesStore)

const {
  sessionId: discussionSessionId,
  status: discussionStatus,
  brief,
  participants,
  orderedSections,
  currentSection,

  isLoading: discussionLoading,
  error: discussionError
} = storeToRefs(discussionStore)

const {
  sessionId: reportSessionId,
  report,
  session: reportSession,
  rounds,
  turningPoints,
  finalRisks,
  finalActions,
  confidenceTimeline: reportConfidenceTimeline,

  isLoading: reportLoading,
  isRegenerating,
  error: reportError
} = storeToRefs(reportStore)


/* ==================================================
   GENERAL HELPERS
================================================== */

function asArray(value) {
  return Array.isArray(value)
      ? value
      : []
}

function asObject(value) {
  return (
      value
      && typeof value === 'object'
      && !Array.isArray(value)
  )
      ? value
      : {}
}

function normalizeId(value) {
  if (
      value === null
      || value === undefined
      || value === ''
  ) {
    return null
  }

  return String(value)
}

function sameId(first, second) {
  const firstId = normalizeId(first)
  const secondId = normalizeId(second)

  return Boolean(
      firstId
      && secondId
      && firstId === secondId
  )
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

function readableError(error) {
  if (!error) {
    return null
  }

  return (
      error?.message
      ?? error?.detail
      ?? error?.data?.detail
      ?? error?.data?.message
      ?? 'Unable to load the report.'
  )
}

function roundNumberOf(round, fallback = null) {
  return numberOrNull(
      round?.roundNumber
      ?? round?.round_number
      ?? round?.round?.number
      ?? fallback
  )
}


/* ==================================================
   PANEL MODE FILTER

   Only discussions whose resolved mode is "panel"
   are allowed onto this report page.
================================================== */

function normalizedDiscussionMode(discussion) {
  const rawMode = (
      discussion?.mode
      ?? discussion?.calibration?.councilMode
      ?? discussion?.calibration?.council_mode
      ?? discussion?.councilMode
      ?? discussion?.council_mode
      ?? null
  )

  if (
      rawMode === null
      || rawMode === undefined
  ) {
    return ''
  }

  return String(rawMode)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '')
}

function isPanelDiscussion(discussion) {
  return normalizedDiscussionMode(discussion) === 'panel'
}

/*
 * This is now the authoritative list used by:
 *
 * - The conversation selector
 * - Initial fallback selection
 * - Route session validation
 * - Session metadata resolution
 *
 * Mediation discussions are completely excluded.
 */
const panelDebates = computed(() => {
  return asArray(orderedDebates.value)
      .filter(isPanelDiscussion)
})


/* ==================================================
   REQUESTED SESSION
================================================== */

const requestedSessionId = computed(() => {
  return normalizeId(
      props.sessionId
      ?? route.params?.sessionId
      ?? route.params?.id
      ?? route.query?.session
      ?? route.query?.sessionId
      ?? null
  )
})


/* ==================================================
   HYDRATION STATE
================================================== */

const pageReady = ref(false)
const isHydrating = ref(false)
const hydrationError = ref(null)

const loadedSessionId = ref(null)
const pendingSessionId = ref(null)

let pageMounted = false
let componentDestroyed = false
let hydrationQueue = Promise.resolve(null)


/* ==================================================
   PANEL SESSION RESOLUTION

   A requested mediation ID is ignored. The resolver
   selects the first available panel discussion instead.
================================================== */

function resolvePageSessionId(explicitId = null) {
  const candidateIds = [
    explicitId,
    requestedSessionId.value,
    discussionSessionId.value,
    reportSessionId.value,
    selectedDebateId.value
  ]
      .map(normalizeId)
      .filter(Boolean)

  /*
   * Keep candidate priority:
   *
   * 1. Explicit selection
   * 2. Route/prop session
   * 3. Current discussion store session
   * 4. Current report store session
   * 5. Archive selector session
   */
  const matchingPanel = candidateIds
      .map(candidateId => {
        return panelDebates.value.find(debate => {
          return sameId(
              debate?.id,
              candidateId
          )
        })
      })
      .find(Boolean)

  return normalizeId(
      matchingPanel?.id
      ?? panelDebates.value[0]?.id
      ?? null
  )
}


/* ==================================================
   HYDRATE PANEL SESSION
================================================== */

async function hydrateSession(explicitSessionId = null) {
  pageReady.value = false
  isHydrating.value = true
  hydrationError.value = null

  let sessionId = null

  try {
    /*
     * Always refresh the archive before resolving the
     * page session.
     *
     * fetchDebates() may legitimately reuse already-loaded
     * Pinia state. That is useful elsewhere, but this page
     * is entered immediately after discussion/report changes
     * and must see the newest session without a browser reload.
     */
    await debatesStore.refreshDebates()

    if (componentDestroyed) {
      return null
    }

    sessionId = resolvePageSessionId(
        explicitSessionId
    )

    if (!sessionId) {
      throw new Error(
          'No panel discussion is available for this report.'
      )
    }

    pendingSessionId.value = sessionId

    let archiveSession = debatesStore.debateById(
        sessionId
    )

    /*
     * Refresh once if the session is missing or somehow
     * resolves to a non-panel discussion.
     */
    if (
        !archiveSession
        || !isPanelDiscussion(archiveSession)
    ) {
      await debatesStore.refreshDebates()

      /*
       * Re-resolve after refreshing because the archive
       * contents may have changed.
       */
      sessionId = resolvePageSessionId(
          explicitSessionId
      )

      archiveSession = sessionId
          ? debatesStore.debateById(sessionId)
          : null
    }

    if (
        !sessionId
        || !archiveSession
        || !isPanelDiscussion(archiveSession)
    ) {
      throw new Error(
          'No panel discussion is available for this report.'
      )
    }

    if (componentDestroyed) {
      return null
    }

    pendingSessionId.value = sessionId

    debatesStore.selectDebate(sessionId)

    if (
        !sameId(
            discussionSessionId.value,
            sessionId
        )
    ) {
      discussionStore.resetDiscussion()
    }

    if (
        !sameId(
            reportSessionId.value,
            sessionId
        )
    ) {
      reportStore.resetReport()
    }

    const [
      discussionResponse,
      reportResponse
    ] = await Promise.all([
      discussionStore.loadDiscussion(sessionId),
      reportStore.loadReport(sessionId)
    ])

    if (componentDestroyed) {
      return null
    }

    loadedSessionId.value = sessionId
    pageReady.value = true

    return {
      sessionId,
      discussion: discussionResponse,
      report: reportResponse
    }
  } catch (error) {
    hydrationError.value = error

    console.error(
        '[ReportPage] Panel report hydration failed:',
        error
    )

    return null
  } finally {
    if (
        sameId(
            pendingSessionId.value,
            sessionId
        )
    ) {
      pendingSessionId.value = null
    }

    isHydrating.value = false
  }
}

function queueHydration(sessionId = null) {
  hydrationQueue = hydrationQueue
      .catch(() => null)
      .then(() => hydrateSession(sessionId))

  return hydrationQueue
}


/* ==================================================
   ACTIVE SESSION
================================================== */

const activeSessionId = computed(() => {
  const possibleIds = [
    pendingSessionId.value,
    loadedSessionId.value,
    reportSessionId.value,
    discussionSessionId.value,
    selectedDebateId.value,
    requestedSessionId.value
  ]
      .map(normalizeId)
      .filter(Boolean)

  const matchingPanel = possibleIds
      .map(candidateId => {
        return panelDebates.value.find(debate => {
          return sameId(
              debate?.id,
              candidateId
          )
        })
      })
      .find(Boolean)

  return normalizeId(
      matchingPanel?.id
      ?? panelDebates.value[0]?.id
      ?? null
  )
})


/* ==================================================
   SESSION METADATA
================================================== */

const session = computed(() => {
  const reportMetadata = asObject(
      reportSession.value
  )

  /*
   * The report metadata is only valid when it belongs
   * to the active panel session.
   */
  if (
      Object.keys(reportMetadata).length
      && (
          !reportMetadata?.id
          || sameId(
              reportMetadata?.id,
              activeSessionId.value
          )
      )
      && (
          !normalizedDiscussionMode(reportMetadata)
          || isPanelDiscussion(reportMetadata)
      )
  ) {
    return reportMetadata
  }

  if (
      selectedDebate.value
      && sameId(
          selectedDebate.value?.id,
          activeSessionId.value
      )
      && isPanelDiscussion(selectedDebate.value)
  ) {
    return selectedDebate.value
  }

  return (
      panelDebates.value.find(debate => {
        return sameId(
            debate?.id,
            activeSessionId.value
        )
      })
      ?? null
  )
})

const calibration = computed(() => {
  return asObject(
      session.value?.calibration
  )
})

const sessionTitle = computed(() => {
  return (
      session.value?.title
      ?? calibration.value?.topic
      ?? brief.value?.topic
      ?? 'Untitled Discussion'
  )
})

const sessionTopic = computed(() => {
  return (
      calibration.value?.topic
      ?? brief.value?.topic
      ?? sessionTitle.value
  )
})

const sessionObjective = computed(() => {
  return (
      calibration.value?.objective
      ?? brief.value?.objective
      ?? ''
  )
})

const sessionMode = computed(() => {
  /*
   * The page is panel-only, so never distribute a
   * mediation mode to the header.
   */
  return 'panel'
})

const sessionStatus = computed(() => {
  return (
      session.value?.status
      ?? discussionStatus.value
      ?? null
  )
})

const sessionCreatedAt = computed(() => {
  return (
      session.value?.createdAt
      ?? session.value?.created_at
      ?? null
  )
})

const generatedAt = computed(() => {
  return report.value?.generatedAt ?? null
})

const sessionUpdatedAt = computed(() => {
  return (
      report.value?.updatedAt
      ?? session.value?.updatedAt
      ?? session.value?.updated_at
      ?? generatedAt.value
      ?? null
  )
})


/* ==================================================
   TOP-LEVEL REPORT FACTS
================================================== */

const executiveSummary = computed(() => {
  return report.value?.executiveSummary ?? ''
})

const finalVerdict = computed(() => {
  return report.value?.finalVerdict ?? ''
})

const mediatorFinalSummary = computed(() => {
  return report.value?.mediatorFinalSummary ?? ''
})


/* ==================================================
   DISCUSSION CONFIDENCE
================================================== */

const discussionConfidenceTrend = computed(() => {
  return asArray(orderedSections.value)
      .map((section, index) => {
        const value = numberOrNull(
            section?.metrics?.ideaConfidence
        )

        if (value === null) {
          return null
        }

        const roundNumber = (
            numberOrNull(
                section?.metadata?.roundNumber
            )
            ?? index + 1
        )

        return {
          key: section?.id ?? `section-${roundNumber}`,
          label: `Round ${roundNumber}`,
          value,
          roundNumber,
          kind: 'round',
          sectionId: section?.id
        }
      })
      .filter(Boolean)
})

const discussionConfidenceTimeline = computed(() => {
  const trend = discussionConfidenceTrend.value

  return trend.map((point, index) => {
    const previousValue = (
        index > 0
            ? trend[index - 1]?.value
            : null
    )

    return {
      roundNumber: point.roundNumber,

      before: previousValue ?? null,

      after: point.value,

      change: (
          previousValue !== null
          && previousValue !== undefined
      )
          ? point.value - previousValue
          : null,

      reason: (
          orderedSections.value[index]
              ?.mediator
              ?.summary
          ?? ''
      )
    }
  })
})

const confidenceTimeline = computed(() => {
  if (discussionConfidenceTimeline.value.length) {
    return discussionConfidenceTimeline.value
  }

  return asArray(
      reportConfidenceTimeline.value
  )
})

const finalConfidence = computed(() => {
  const finalSectionPoint = (
      discussionConfidenceTrend.value.at(-1)
  )

  return (
      numberOrNull(finalSectionPoint?.value)
      ?? numberOrNull(report.value?.finalConfidence)
      ?? null
  )
})


/* ==================================================
   REPORT ROUNDS
================================================== */

const orderedReportRounds = computed(() => {
  return [
    ...asArray(rounds.value)
  ]
      .sort((first, second) => {
        const firstRound = (
            roundNumberOf(first, 0)
            ?? 0
        )

        const secondRound = (
            roundNumberOf(second, 0)
            ?? 0
        )

        return firstRound - secondRound
      })
})

const finalRound = computed(() => {
  return orderedReportRounds.value.at(-1) ?? null
})


/* ==================================================
   FINAL DISCUSSION METRICS
================================================== */

const finalDiscussionSection = computed(() => {
  return (
      orderedSections.value.at(-1)
      ?? currentSection.value
      ?? null
  )
})

const finalMetrics = computed(() => {
  return asObject(
      finalDiscussionSection.value?.metrics
  )
})

const finalAlignment = computed(() => {
  return asObject(
      finalMetrics.value?.alignment
  )
})

const alignmentScore = computed(() => {
  return numberOrNull(
      finalAlignment.value?.score
  )
})


/* ==================================================
   KEY OUTCOME
================================================== */

const confidenceStart = computed(() => {
  const firstSectionPoint = (
      discussionConfidenceTrend.value[0]
  )

  const directSectionScore = numberOrNull(
      firstSectionPoint?.value
  )

  if (directSectionScore !== null) {
    return directSectionScore
  }

  const firstPoint = asArray(
      confidenceTimeline.value
  )[0]

  return (
      numberOrNull(firstPoint?.before)
      ?? numberOrNull(firstPoint?.after)
      ?? null
  )
})

const alignmentLabel = computed(() => {
  const score = alignmentScore.value

  if (score === null) {
    return 'Pending'
  }

  if (score >= 80) {
    return 'Strongly Aligned'
  }

  if (score >= 65) {
    return 'Aligned'
  }

  if (score >= 45) {
    return 'Mixed'
  }

  return 'Divided'
})

const decisionStrengthScore = computed(() => {
  const values = [
    finalConfidence.value,
    alignmentScore.value
  ]
      .filter(value => value !== null)

  if (!values.length) {
    return null
  }

  const total = values.reduce(
      (sum, value) => sum + value,
      0
  )

  return Math.round(
      total / values.length
  )
})

const decisionStrength = computed(() => {
  const score = decisionStrengthScore.value

  if (score === null) {
    return 'Pending'
  }

  if (score >= 80) {
    return 'High'
  }

  if (score >= 60) {
    return 'Moderate'
  }

  return 'Low'
})

const keyOutcomeData = computed(() => {
  return {
    confidenceTimeline: confidenceTimeline.value,
    confidenceStart: confidenceStart.value,
    confidenceEnd: finalConfidence.value,

    alignmentScore: alignmentScore.value,
    alignmentLabel: alignmentLabel.value,

    decisionStrength: decisionStrength.value,
    decisionStrengthScore: decisionStrengthScore.value
  }
})


/* ==================================================
   ALIGNMENT BREAKDOWN
================================================== */

const alignmentMemberCount = computed(() => {
  const explicitTotal = numberOrNull(
      finalMetrics.value?.totalMembers
  )

  if (explicitTotal !== null) {
    return explicitTotal
  }

  return asArray(
      finalRound.value?.memberReports
  ).length
})

function percentageToCount(percentage, total) {
  const percent = numberOrNull(percentage)
  const memberTotal = numberOrNull(total)

  if (
      percent === null
      || memberTotal === null
      || memberTotal <= 0
  ) {
    return 0
  }

  return Math.round(
      (percent / 100) * memberTotal
  )
}

const alignmentBreakdownData = computed(() => {
  const alignment = finalAlignment.value
  const total = alignmentMemberCount.value

  const splitPercentage = (
      (numberOrNull(alignment.mixed) ?? 0)
      + (numberOrNull(alignment.undecided) ?? 0)
  )

  return {
    score: alignmentScore.value,

    breakdown: {
      fullyAligned: percentageToCount(
          alignment.support,
          total
      ),

      mostlyAligned: percentageToCount(
          alignment.conditionalSupport,
          total
      ),

      split: percentageToCount(
          splitPercentage,
          total
      ),

      opposed: percentageToCount(
          alignment.oppose,
          total
      )
    }
  }
})


/* ==================================================
   COUNCIL IDENTITIES
================================================== */

const reportPanelMembers = computed(() => {
  return asArray(
      session.value?.panelMembers
  )
})

const discussionMembers = computed(() => {
  const characterMap = asObject(
      participants.value?.characters
  )

  const order = asArray(
      participants.value?.characterOrder
  )

  const ordered = order
      .map(characterId => {
        return characterMap[
            String(characterId)
            ]
      })
      .filter(Boolean)

  if (ordered.length) {
    return ordered
  }

  return Object.values(characterMap)
})

const councilIdentityMap = computed(() => {
  const map = new Map()

  const allMembers = [
    ...discussionMembers.value,
    ...reportPanelMembers.value
  ]

  allMembers.forEach(member => {
    const id = normalizeId(member?.id)

    if (id) {
      map.set(id, member)
    }
  })

  return map
})


/* ==================================================
   FINAL COUNCIL POSITIONS
================================================== */

const finalCouncilPositions = computed(() => {
  const memberReports = asArray(
      finalRound.value?.memberReports
  )

  if (memberReports.length) {
    return memberReports.map(memberReport => {
      const characterId = normalizeId(
          memberReport?.characterId
      )

      const identity = characterId
          ? (
              councilIdentityMap.value.get(
                  characterId
              )
              ?? {}
          )
          : {}

      return {
        ...identity,
        ...memberReport,

        id: (
            characterId
            ?? normalizeId(identity?.id)
        ),

        report: memberReport
      }
    })
  }

  if (reportPanelMembers.value.length) {
    return reportPanelMembers.value
  }

  /*
   * Do not fall back to the mediator here.
   * This panel-only page should display panel members
   * or an empty state.
   */
  return discussionMembers.value
})


/* ==================================================
   HEADER
================================================== */

const headerData = computed(() => {
  return {
    id: activeSessionId.value,

    title: sessionTitle.value,
    topic: sessionTopic.value,
    objective: sessionObjective.value,

    mode: sessionMode.value,
    status: sessionStatus.value,

    createdAt: sessionCreatedAt.value,
    updatedAt: sessionUpdatedAt.value,
    generatedAt: generatedAt.value
  }
})


/* ==================================================
   DELIBERATION TIMELINE
================================================== */

const deliberationTimelineData = computed(() => {
  return orderedReportRounds.value.map(
      (round, index) => {
        const roundNumber = roundNumberOf(
            round,
            index + 1
        )

        return {
          id: (
              round?.id
              ?? round?.roundId
              ?? `round-${roundNumber}`
          ),

          time: '',

          title: `Round ${roundNumber}`,

          description: (
              round?.summary
              ?? round?.mediatorSummary
              ?? round?.keyConflict
              ?? ''
          )
        }
      }
  )
})


/* ==================================================
   PANEL-ONLY CONVERSATION SELECTOR
================================================== */

const conversationSelectorItems = computed(() => {
  return panelDebates.value.map(debate => {
    return {
      id: normalizeId(debate?.id),

      title: (
          debate?.title
          ?? debate?.calibration?.topic
          ?? 'Untitled Discussion'
      ),

      subtitle: (
          debate?.calibration?.objective
          ?? ''
      ),

      status: debate?.status ?? 'unknown',

      /*
       * All entries here have already passed the panel
       * filter, so the selector can never show mediation.
       */
      mode: 'panel',

      pinned: Boolean(debate?.pinned),

      createdAt: (
          debate?.createdAt
          ?? debate?.created_at
          ?? null
      ),

      updatedAt: (
          debate?.updatedAt
          ?? debate?.updated_at
          ?? null
      ),

      raw: debate
    }
  })
})

function selectConversation(conversation) {
  const sessionId = normalizeId(
      conversation?.id
      ?? conversation
  )

  if (
      !sessionId
      || sameId(
          sessionId,
          activeSessionId.value
      )
  ) {
    return
  }

  const selectedPanel = panelDebates.value.find(
      debate => sameId(
          debate?.id,
          sessionId
      )
  )

  /*
   * Ignore any manually emitted or malformed selection
   * that does not belong to the panel-only collection.
   */
  if (!selectedPanel) {
    return
  }

  void queueHydration(sessionId)
}


/* ==================================================
   REQUEST STATE
================================================== */

const pageLoading = computed(() => {
  return (
      isHydrating.value
      || debatesLoading.value
      || discussionLoading.value
      || reportLoading.value
      || isRegenerating.value
  )
})

const pageError = computed(() => {
  return (
      readableError(hydrationError.value)
      ?? readableError(reportError.value)
      ?? readableError(discussionError.value)
      ?? readableError(debatesError.value)
      ?? null
  )
})

const dataReady = computed(() => {
  const id = loadedSessionId.value

  return Boolean(
      pageReady.value
      && id
      && sameId(
          reportSessionId.value,
          id
      )
      && sameId(
          discussionSessionId.value,
          id
      )
  )
})


/* ==================================================
   PUBLIC ACTIONS
================================================== */

async function refreshPage() {
  try {
    await debatesStore.refreshDebates()

    const sessionId = resolvePageSessionId(
        activeSessionId.value
    )

    if (!sessionId) {
      throw new Error(
          'No panel discussion is available for this report.'
      )
    }

    return await queueHydration(sessionId)
  } catch (error) {
    hydrationError.value = error
    return null
  }
}

async function regenerateReport() {
  const sessionId = activeSessionId.value

  if (!sessionId) {
    return null
  }

  const activePanel = panelDebates.value.find(
      debate => sameId(
          debate?.id,
          sessionId
      )
  )

  if (!activePanel) {
    return null
  }

  try {
    return await reportStore.regenerateReport(
        sessionId
    )
  } catch (error) {
    console.error(
        '[ReportPage] Report regeneration failed:',
        error
    )

    return null
  }
}

defineExpose({
  refreshPage,
  regenerateReport,
  pageError,
  dataReady
})


/* ==================================================
   PAGE ENTRY AUTO-HYDRATION

   This page can live inside a kept-alive routed view.

   onMounted() only runs once for a kept-alive component,
   so returning to the report page could previously show
   stale Pinia data until the browser was refreshed.

   On every real page entry we:

   1. resolve the freshest session identity already held
      by the discussion/report/archive stores;
   2. refresh the debate archive from the API;
   3. fetch the authoritative discussion snapshot;
   4. fetch the authoritative report snapshot.

   No manual browser refresh is required.
================================================== */

async function hydrateOnEntry() {
  componentDestroyed = false

  const preferredSessionId = normalizeId(
      requestedSessionId.value
      ?? discussionSessionId.value
      ?? reportSessionId.value
      ?? selectedDebateId.value
      ?? null
  )

  return queueHydration(
      preferredSessionId
  )
}


/*
 * Vue calls onActivated() on the initial activation of a
 * kept-alive component as well as later re-entries.
 *
 * The first activation is already handled by onMounted().
 * Skip only that first activation to avoid issuing duplicate
 * discussion/report requests during initial render.
 */
let firstActivationSeen = false


/* ==================================================
   ROUTE CHANGES

   If the new route points to mediation, hydration
   resolves back to a valid panel discussion.
================================================== */

watch(
    requestedSessionId,

    (
        nextSessionId,
        previousSessionId
    ) => {
      if (
          !pageMounted
          || sameId(
              nextSessionId,
              previousSessionId
          )
      ) {
        return
      }

      void queueHydration(nextSessionId)
    }
)


/* ==================================================
   LIFECYCLE
================================================== */

onMounted(() => {
  pageMounted = true
  componentDestroyed = false

  void hydrateOnEntry()
})


onActivated(() => {
  componentDestroyed = false

  if (!firstActivationSeen) {
    firstActivationSeen = true
    return
  }

  void hydrateOnEntry()
})


onBeforeUnmount(() => {
  componentDestroyed = true
})
</script>


<template>
  <div class="holder">
    <!-- ==================================================
         BACKGROUND
    =================================================== -->

    <div class="background" />


    <!-- ==================================================
         TOP AREA
    =================================================== -->

    <section class="top">
      <!-- ================================================
           MAIN CONTENT
      ================================================= -->

      <div class="content">
        <!-- ==============================================
             HEADER
        =============================================== -->

        <div
            class="
            header
            report-cell
            enter-panel
            enter-header
          "
        >
          <ReportDossierHeader
              :data="headerData"
              :round-count="
              rounds.length
              ||
              orderedSections.length
            "
              :section-count="orderedSections.length"
              primary="#a579ff"
              secondary="#51dcff"
          />
        </div>


        <!-- ==============================================
             MAIN REPORT GRID
        =============================================== -->

        <div class="info-1">
          <!-- ============================================
               LEFT REPORT CLUSTER
          ============================================= -->

          <div class="small">
            <!-- ==========================================
                 TOP ROW
            =========================================== -->

            <div class="top-row">
              <!-- FINAL VERDICT -->

              <div
                  class="
                  report-cell
                  enter-panel
                  enter-top-left
                "
              >
                <FinalVerdictPanel
                    :verdict="finalVerdict"
                    :reason="
                    mediatorFinalSummary
                    ||
                    executiveSummary
                  "
                    :status="sessionStatus"
                    primary="#a579ff"
                    secondary="#51dcff"
                />
              </div>


              <!-- KEY OUTCOME -->

              <div
                  class="
                  report-cell
                  enter-panel
                  enter-top-right
                "
              >
                <KeyOutcomePanel
                    v-bind="keyOutcomeData"
                    primary="#a66cff"
                    secondary="#57f5bb"
                />
              </div>
            </div>


            <!-- ==========================================
                 BOTTOM ROW
            =========================================== -->

            <div class="bottom-row">
              <!-- CONFIDENCE -->

              <div
                  class="
                  report-cell
                  enter-panel
                  enter-bottom-left
                "
              >
                <ConfidenceTrendPanel
                    :trend="discussionConfidenceTrend"
                    :timeline="confidenceTimeline"
                    :final-confidence="finalConfidence"
                    primary="#a66cff"
                    secondary="#5ce8ff"
                />
              </div>


              <!-- ALIGNMENT -->

              <div
                  class="
                  report-cell
                  enter-panel
                  enter-bottom-right
                "
              >
                <AlignmentBreakdownPanel
                    v-bind="alignmentBreakdownData"
                    primary="#a66cff"
                    secondary="#37a9ff"
                    success="#59f5c4"
                    danger="#ff4f72"
                />
              </div>
            </div>
          </div>


          <!-- ============================================
               COUNCIL POSITIONS
          ============================================= -->

          <div
              class="
              chars
              report-cell
              enter-panel
              enter-chars
            "
          >
            <CouncilPositionsPanel
                :positions="finalCouncilPositions"
                primary="#a66cff"
                secondary="#37a9ff"
                success="#59f5c4"
                warning="#ffc857"
                danger="#ff4f72"
            />
          </div>
        </div>
      </div>


      <!-- ================================================
           CONVERSATION SELECTOR
      ================================================= -->

      <div
          class="
          selection
          report-cell
          enter-panel
          enter-selection
        "
      >
        <ConversationReportSelector
            :model-value="activeSessionId"
            :items="conversationSelectorItems"
            :loading="pageLoading"
            primary="#a579ff"
            secondary="#51dcff"
            @select="selectConversation"
        />
      </div>
    </section>


    <!-- ==================================================
         BOTTOM AREA
    =================================================== -->

    <section class="bottom">
      <div class="content-2">
        <!-- ================================================
             TIMELINE AREA
        ================================================= -->

        <div class="info-2">
          <div
              class="space"
              aria-hidden="true"
          />


          <div
              class="
              report-cell
              enter-panel
              enter-bottom-main
            "
          >
            <DeliberationTimelinePanel
                :steps="deliberationTimelineData"
                :turning-points="turningPoints"
                primary="#a66cff"
                secondary="#37a9ff"
                success="#59f5c4"
            />
          </div>
        </div>


        <!-- ================================================
             RISKS AND ACTIONS
        ================================================= -->

        <div
            class="
            actions
            report-cell
            enter-panel
            enter-actions
          "
        >
          <RisksActionsStack
              :risks="finalRisks"
              :actions="finalActions"
              primary="#a66cff"
              secondary="#37a9ff"
              success="#59f5c4"
              warning="#ffc857"
              danger="#ff4f72"
          />
        </div>
      </div>


      <!-- ================================================
           INTENTIONAL DEAD SPACE
      ================================================= -->

      <div
          class="dead"
          aria-hidden="true"
      />
    </section>
  </div>
</template>


<style scoped>
/* =========================================================
   RESET
========================================================= */

*,
*::before,
*::after {
  box-sizing: border-box;
}


/* =========================================================
   SHRINK GUARDS

   These prevent intrinsic child content from forcing
   grid tracks wider or taller.

   Important:
   No global max-width.
   No paint containment.
   No descendant overflow rules.
========================================================= */

.holder,
.top,
.bottom,
.content,
.content-2,
.info-1,
.info-2,
.small,
.top-row,
.bottom-row,
.header,
.chars,
.selection,
.actions,
.report-cell,
.space,
.dead {
  min-width: 0;
  min-height: 0;
}


/* =========================================================
   ROOT PAGE
========================================================= */

.holder {
  position: relative;

  width: 100%;
  height: 100dvh;

  overflow: hidden;

  display: grid;

  grid-template-rows:
    minmax(0, 5fr)
    minmax(0, 2fr);

  background:
      #000;

  isolation:
      isolate;
}


/* =========================================================
   ROOT GRID CHILD PROTECTION
========================================================= */

.holder > .top,
.holder > .bottom {
  min-width: 0;
  min-height: 0;

  width: 100%;
  height: 100%;

  overflow: hidden;
}


/* =========================================================
   PAGE BACKGROUND
========================================================= */

.background {
  position: absolute;

  inset: 0;

  z-index: -2;

  width: 100%;
  height: 100%;

  pointer-events: none;

  background-image:
      linear-gradient(
          rgba(0, 0, 8, 0.18),
          rgba(0, 0, 12, 0.32)
      ),
      url('/images/knowledge/bg.png');

  background-position:
      center;

  background-size:
      cover;

  background-repeat:
      no-repeat;

  opacity: 0;

  transform:
      scale(1.025);

  animation:
      background-enter
      1.4s
      ease-out
      0.25s
      forwards;
}


.holder::after {
  content: '';

  position: absolute;

  inset: 0;

  z-index: -1;

  pointer-events: none;

  background:
      radial-gradient(
          circle at 50% 44%,
          transparent 0%,
          rgba(0, 0, 10, 0.08) 46%,
          rgba(0, 0, 12, 0.32) 100%
      );

  opacity: 0;

  animation:
      overlay-enter
      1s
      ease
      1s
      forwards;
}


/* =========================================================
   REPORT CELL

   This is the important guard.

   It:
   - can shrink in both dimensions;
   - stays within its grid track;
   - clips true accidental outer overflow;
   - does NOT interfere with the component's internals;
   - does NOT use contain: paint.
========================================================= */

.report-cell {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;
}


/* =========================================================
   COMPONENT ROOT SIZE

   Only the immediate Vue component root is sized.

   We deliberately do NOT:
   - apply overflow here;
   - apply max-width here;
   - target nested descendants.

   Internal scroll regions therefore keep working.
========================================================= */

.report-cell > :deep(*) {
  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;
}


/* =========================================================
   BASE PANEL
========================================================= */

.panel {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  border:
      1px solid
      rgba(216, 197, 255, 0.52);

  background:
      linear-gradient(
          145deg,
          rgba(18, 14, 34, 0.62),
          rgba(8, 10, 24, 0.54)
      );

  backdrop-filter:
      blur(5px)
      saturate(1.08);

  -webkit-backdrop-filter:
      blur(5px)
      saturate(1.08);

  border-radius:
      10px;

  box-shadow:
      inset
      0
      0
      18px
      rgba(125, 63, 255, 0.05),

      0
      0
      12px
      rgba(58, 22, 120, 0.08);
}


/* =========================================================
   ENTER ANIMATION
========================================================= */

.enter-panel {
  opacity: 1;

  transform: none;

  animation-name:
      panel-enter;

  animation-duration:
      0.7s;

  animation-timing-function:
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );

  animation-fill-mode:
      backwards;
}


.enter-header {
  animation-delay:
      1.8s;
}


.enter-top-left {
  animation-delay:
      2.05s;
}


.enter-top-right {
  animation-delay:
      2.2s;
}


.enter-bottom-left {
  animation-delay:
      2.4s;
}


.enter-bottom-right {
  animation-delay:
      2.55s;
}


.enter-chars {
  animation-delay:
      2.75s;
}


.enter-selection {
  animation-delay:
      2.95s;
}


.enter-bottom-main {
  animation-delay:
      3.15s;
}


.enter-actions {
  animation-delay:
      3.35s;
}


/* =========================================================
   TOP SECTION
========================================================= */

.top {
  position: relative;

  z-index: 1;

  width: 100%;
  height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-columns:
    minmax(0, 5fr)
    minmax(0, 1fr);
}


/* =========================================================
   TOP DIRECT CHILD PROTECTION
========================================================= */

.top > .content,
.top > .selection {
  min-width: 0;
  min-height: 0;

  width: 100%;
  height: 100%;
}


/* =========================================================
   MAIN CONTENT
========================================================= */

.content {
  width: 100%;
  height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-rows:
    minmax(0, 2fr)
    minmax(0, 5fr);

  gap:
      0.5rem;
}


/* =========================================================
   CONTENT CHILD PROTECTION
========================================================= */

.content > .header,
.content > .info-1 {
  min-width: 0;
  min-height: 0;
}


/* =========================================================
   PRIMARY INFO GRID
========================================================= */

.info-1 {
  width: 100%;
  height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-columns:
    minmax(0, 5fr)
    minmax(0, 2fr);

  gap:
      0.5rem;
}


/* =========================================================
   INFO CHILD PROTECTION
========================================================= */

.info-1 > .small,
.info-1 > .chars {
  min-width: 0;
  min-height: 0;
}


/* =========================================================
   SMALL PANEL GROUP
========================================================= */

.small {
  width: 100%;
  height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-rows:
    minmax(0, 5fr)
    minmax(0, 4fr);

  gap:
      0.5rem;
}


/* =========================================================
   SMALL GROUP CHILD PROTECTION
========================================================= */

.small > .top-row,
.small > .bottom-row {
  min-width: 0;
  min-height: 0;
}


/* =========================================================
   TOP ROW
========================================================= */

.top-row {
  width: 100%;
  height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1fr);

  gap:
      0.5rem;
}


/* =========================================================
   TOP ROW CELLS
========================================================= */

.top-row > .report-cell {
  min-width: 0;
  min-height: 0;

  width: 100%;
  height: 100%;
}


/* =========================================================
   BOTTOM ROW
========================================================= */

.bottom-row {
  width: 100%;
  height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-columns:
    minmax(0, 5fr)
    minmax(0, 4fr);

  gap:
      0.5rem;
}


/* =========================================================
   BOTTOM ROW CELLS
========================================================= */

.bottom-row > .report-cell {
  min-width: 0;
  min-height: 0;

  width: 100%;
  height: 100%;
}


/* =========================================================
   BOTTOM SECTION
========================================================= */

.bottom {
  position: relative;

  z-index: 1;

  width: 100%;
  height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-columns:
    minmax(0, 7fr)
    minmax(0, 1fr);
}


/* =========================================================
   BOTTOM DIRECT CHILD PROTECTION
========================================================= */

.bottom > .content-2,
.bottom > .dead {
  min-width: 0;
  min-height: 0;
}


/* =========================================================
   BOTTOM CONTENT
========================================================= */

.content-2 {
  width: 100%;
  height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-columns:
    minmax(0, 5fr)
    minmax(0, 2fr);

  gap:
      0.5rem;
}


/* =========================================================
   BOTTOM CONTENT CHILD PROTECTION
========================================================= */

.content-2 > .info-2,
.content-2 > .actions {
  min-width: 0;
  min-height: 0;
}


/* =========================================================
   BOTTOM INFO
========================================================= */

.info-2 {
  width: 100%;
  height: 100%;

  overflow: hidden;

  display: grid;

  grid-template-rows:
    minmax(0, 1fr)
    minmax(0, 5fr);
}


/* =========================================================
   BOTTOM INFO CHILD PROTECTION
========================================================= */

.info-2 > .space,
.info-2 > .report-cell {
  min-width: 0;
  min-height: 0;
}


/* =========================================================
   NAMED CELLS
========================================================= */

.header,
.chars,
.selection,
.actions {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;
}


/* =========================================================
   INTENTIONAL SPACING
========================================================= */

.space {
  width: 100%;
  height: 100%;

  pointer-events: none;
}


/* =========================================================
   DEAD SPACE
========================================================= */

.dead {
  width: 100%;
  height: 100%;

  pointer-events: none;
}


/* =========================================================
   KEYFRAMES
========================================================= */

@keyframes background-enter {
  0% {
    opacity: 0;

    transform:
        scale(1.025);
  }

  100% {
    opacity: 1;

    transform:
        scale(1);
  }
}


@keyframes overlay-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}


@keyframes panel-enter {
  0% {
    opacity: 0;

    transform:
        translateY(10px)
        scale(0.99);
  }


  45% {
    opacity: 0.7;
  }


  100% {
    opacity: 1;

    transform:
        translateY(0)
        scale(1);
  }
}


/* =========================================================
   LARGE TABLET / SMALL LAPTOP
========================================================= */

@media (max-width: 1200px) {
  .top {
    grid-template-columns:
      minmax(0, 4.5fr)
      minmax(150px, 1.2fr);
  }


  .bottom {
    grid-template-columns:
      minmax(0, 6fr)
      minmax(80px, 1fr);
  }


  .info-1 {
    grid-template-columns:
      minmax(0, 4fr)
      minmax(150px, 1.5fr);
  }


  .content-2 {
    grid-template-columns:
      minmax(0, 4fr)
      minmax(160px, 1.5fr);
  }
}


/* =========================================================
   TABLET / NARROW LANDSCAPE
========================================================= */

@media (max-width: 900px) {
  .holder {
    grid-template-rows:
      minmax(0, 3fr)
      minmax(0, 1.3fr);
  }


  .top {
    grid-template-columns:
      minmax(0, 1fr)
      minmax(120px, 0.25fr);
  }


  .bottom {
    grid-template-columns:
      minmax(0, 1fr)
      minmax(50px, 0.15fr);
  }


  .content {
    grid-template-rows:
      minmax(0, 1.5fr)
      minmax(0, 5fr);
  }


  .info-1 {
    grid-template-columns:
      minmax(0, 3fr)
      minmax(120px, 1fr);
  }


  .top-row,
  .bottom-row {
    gap:
        0.35rem;
  }


  .content,
  .content-2,
  .info-1,
  .small {
    gap:
        0.35rem;
  }
}


/* =========================================================
   MOBILE / PORTRAIT
========================================================= */

@media (max-width: 650px) and (orientation: portrait) {
  .holder {
    height: auto;
    min-height: 100dvh;

    overflow-x: hidden;
    overflow-y: auto;

    display: flex;
    flex-direction: column;

    gap:
        0.5rem;
  }


  .background {
    position: fixed;
  }


  .holder::after {
    position: fixed;
  }


  .top {
    height: auto;

    display: grid;

    grid-template-columns:
      minmax(0, 1fr);

    gap:
        0.5rem;
  }


  .content {
    height: auto;

    grid-template-rows:
      minmax(110px, auto)
      minmax(500px, auto);
  }


  .info-1 {
    height: 500px;

    grid-template-columns:
      minmax(0, 1fr);

    grid-template-rows:
      minmax(0, 3fr)
      minmax(160px, 1fr);
  }


  .selection {
    min-height: 180px;
  }


  .bottom {
    height: 400px;

    grid-template-columns:
      minmax(0, 1fr);
  }


  .content-2 {
    grid-template-columns:
      minmax(0, 1fr);

    grid-template-rows:
      minmax(0, 1fr)
      minmax(160px, 0.6fr);
  }


  .dead {
    display: none;
  }
}


/* =========================================================
   SHORT LANDSCAPE VIEWPORT
========================================================= */

@media (max-height: 700px) and (orientation: landscape) {
  .content,
  .info-1,
  .small,
  .top-row,
  .bottom-row,
  .content-2 {
    gap:
        0.35rem;
  }
}


/* =========================================================
   REDUCED MOTION
========================================================= */

@media (prefers-reduced-motion: reduce) {
  .background,
  .holder::after,
  .enter-panel {
    animation-duration:
        0.01ms;

    animation-delay:
        0ms;
  }
}
</style>
