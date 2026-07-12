<template>
  <main class="sessions-page">

    <!-- ==================================================
         BACKGROUND
    ================================================== -->

    <div class="bg"></div>


    <!-- ==================================================
         PAGE CONTENT
    ================================================== -->

    <section class="content">

      <!-- ==================================================
           MAIN ARCHIVE AREA
      ================================================== -->

      <div class="main-area">

        <!-- ================================================
             HEADER

             Reads lightweight database session records.

             Does NOT receive the active discussion snapshot.

             orderedDebates contains:

             1. pinned sessions
             2. normal sessions

             with newest sessions first inside each group.
        ================================================ -->

        <SessionsHeader
            class="header"

            :sessions="
              orderedDebates
            "

            :loading="
              isLoading
            "

            @refresh="
              refreshSessions
            "
        />


        <!-- ================================================
             FILTERS

             The child may emit:

             {
               searchQuery,
               typeFilter,
               statusFilter,
               timeFilter,
               sortOrder
             }

             Short aliases are also accepted:

             {
               search,
               type,
               status,
               time,
               sort
             }
        ================================================ -->

        <SessionsFilters
            class="filters"

            v-model:view-mode="
              viewMode
            "

            :search-query="
              searchQuery
            "

            :type-filter="
              typeFilter
            "

            :status-filter="
              statusFilter
            "

            :time-filter="
              timeFilter
            "

            :sort-order="
              sortOrder
            "

            @change="
              applyFilters
            "

            @view-change="
              handleViewChange
            "
        />


        <!-- ================================================
             PINNED SESSIONS

             IMPORTANT:

             This now receives ONLY:

                 debatesStore.pinnedDebates

             It no longer receives the entire archive.

             The component stays rendered even when empty,
             because its empty state / Pin Session button may
             still be needed.

             Events:

             @select
                 selects the archive session

             @pin
                 opens the pin selector
        ================================================ -->

        <PinnedSessions
            class="pinned"

            :sessions="
              pinnedDebates
            "

            :selected-id="
              selectedDebateId
            "

            @select="
              selectSession
            "

            @pin="
              openPinSelector
            "
        />


        <!-- ================================================
             MAIN WORKSPACE
        ================================================ -->

        <div
            class="workspace"

            :class="
              `view-${viewMode}`
            "
        >

          <!-- ==============================================
               SESSION LIST

               Uses the complete lightweight archive list.

               Pinned sessions remain visible here as normal
               archive records as well as appearing in the
               dedicated pinned strip above.
          ============================================== -->

          <SessionsList
              class="panel sessions-list"

              :sessions="
                filteredSessions
              "

              :selected-id="
                selectedDebateId
              "

              :loading="
                isLoading
              "

              :error="
                error
              "

              @select="
                selectSession
              "

              @refresh="
                refreshSessions
              "
          />


          <!-- ==============================================
               SESSION PREVIEW

               Uses:

               session
                   from debatesStore

               sections
               participants
               outcome
               flow
                   from currentDiscussionStore

               Pin event:
                   toggles the session's pinned Boolean
                   through debatesStore.
          ============================================== -->

          <SessionPreview
              class="session-preview"

              :snapshot="
                selectedSnapshot
              "

              @continue="
                continueSession
              "

              @open="
                openSession
              "

              @report="
                openReport
              "

              @pin="
                pinSession
              "
          />

        </div>

      </div>


      <!-- ==================================================
           RECENT ACTIVITY

           This remains a lightweight session-list view.

           Clicking an activity item enters the exact same
           selection pipeline as every other component.
      ================================================== -->

      <SessionActivity
          class="activity"

          :sessions="
            filteredSessions
          "

          :selected-id="
            selectedDebateId
          "

          @select="
            selectSession
          "
      />

    </section>

  </main>
</template>


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
import { useRouter } from 'vue-router'

import SessionsList from '@/components/archive/SessionsList.vue'
import SessionPreview from '@/components/archive/SessionPreview.vue'
import SessionActivity from '@/components/archive/SessionActivity.vue'
import PinnedSessions from '@/components/archive/PinnedSessions.vue'
import SessionsFilters from '@/components/archive/SessionsFilters.vue'
import SessionsHeader from '@/components/archive/SessionsHeader.vue'

import { useDebatesStore } from '@/stores/debates.js'
import { useCurrentDiscussionStore } from '@/stores/currentDiscussion.js'
import { useChamberStore } from '@/stores/chamber.js'


/* ==================================================
   EMITS / ROUTER
================================================== */

const emit = defineEmits([
  'open-report',
  'open-pin-selector'
])

const router = useRouter()


/* ==================================================
   STORES
================================================== */

const debatesStore = useDebatesStore()
const discussionStore = useCurrentDiscussionStore()
const chamberStore = useChamberStore()

const {
  orderedDebates: allOrderedDebates,
  selectedDebate: storeSelectedDebate,
  selectedDebateId: storeSelectedDebateId,
  isLoading,
  error
} = storeToRefs(debatesStore)


/* ==================================================
   PAGE STATE
================================================== */

const archiveReady = ref(false)
const componentDestroyed = ref(false)
const selectedLoadError = ref(null)

const searchQuery = ref('')
const typeFilter = ref('all')
const statusFilter = ref('all')
const timeFilter = ref('all')
const sortOrder = ref('newest')
const viewMode = ref('list')


/*
 * Vue Router may keep this page alive.
 *
 * onMounted() only runs once for a kept-alive page, so
 * returning to the archive previously reused old Pinia
 * state until the browser was manually refreshed.
 */
let firstActivationSeen = false


/* ==================================================
   ID HELPERS
================================================== */

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

function resolveSessionId(value) {
  if (
      value
      && typeof value === 'object'
  ) {
    return normalizeId(
        value.id
        ?? value.sessionId
    )
  }

  return normalizeId(value)
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


/* ==================================================
   PANEL-ONLY MODE HELPERS

   Missing modes are not assumed to be panel.
   A record must explicitly resolve to "panel".
================================================== */

function normalizedDiscussionMode(session) {
  const rawMode = (
      session?.mode
      ?? session?.calibration?.councilMode
      ?? session?.calibration?.council_mode
      ?? session?.councilMode
      ?? session?.council_mode
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

function isPanelDiscussion(session) {
  return normalizedDiscussionMode(session) === 'panel'
}

function modeOf(session) {
  return normalizedDiscussionMode(session)
}


/* ==================================================
   PANEL-ONLY ARCHIVE COLLECTIONS

   These computed collections replace the raw store
   collections everywhere in this page.
================================================== */

const orderedDebates = computed(() => {
  return Array.isArray(allOrderedDebates.value)
      ? allOrderedDebates.value.filter(
          isPanelDiscussion
      )
      : []
})

const pinnedDebates = computed(() => {
  return orderedDebates.value.filter(
      session => Boolean(session?.pinned)
  )
})

const unpinnedDebates = computed(() => {
  return orderedDebates.value.filter(
      session => !session?.pinned
  )
})

const hasPinnedDebates = computed(() => {
  return pinnedDebates.value.length > 0
})

const pinnedDebateCount = computed(() => {
  return pinnedDebates.value.length
})


/* ==================================================
   PANEL-ONLY SELECTION

   If another page left a mediation session selected
   in the global store, it is hidden on this page.
================================================== */

const selectedDebate = computed(() => {
  const session = storeSelectedDebate.value

  return isPanelDiscussion(session)
      ? session
      : null
})

const selectedDebateId = computed(() => {
  if (!selectedDebate.value) {
    return null
  }

  return normalizeId(
      storeSelectedDebateId.value
      ?? selectedDebate.value?.id
  )
})

function panelSessionById(sessionId) {
  const id = normalizeId(sessionId)

  if (!id) {
    return null
  }

  return (
      orderedDebates.value.find(session => {
        return sameId(
            session?.id,
            id
        )
      })
      ?? null
  )
}


/* ==================================================
   SESSION HELPERS
================================================== */

function titleOf(session) {
  return (
      session?.title
      ?? session?.calibration?.topic
      ?? ''
  )
}

function sessionDate(session) {
  const value = (
      session?.updatedAt
      ?? session?.updated_at
      ?? session?.createdAt
      ?? session?.created_at
      ?? null
  )

  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
      ? null
      : date
}


/* ==================================================
   TIME FILTERING
================================================== */

function startOfDay(date) {
  const value = new Date(date)

  value.setHours(
      0,
      0,
      0,
      0
  )

  return value
}

function startOfWeek(date) {
  const value = startOfDay(date)
  const day = value.getDay()

  const difference = (
      day === 0
          ? -6
          : 1 - day
  )

  value.setDate(
      value.getDate() + difference
  )

  return value
}

function passesTimeFilter(session) {
  if (timeFilter.value === 'all') {
    return true
  }

  const date = sessionDate(session)

  if (!date) {
    return false
  }

  const now = new Date()
  const today = startOfDay(now)
  const tomorrow = new Date(today)

  tomorrow.setDate(
      tomorrow.getDate() + 1
  )

  if (timeFilter.value === 'today') {
    return (
        date >= today
        && date < tomorrow
    )
  }

  if (timeFilter.value === 'yesterday') {
    const yesterday = new Date(today)

    yesterday.setDate(
        yesterday.getDate() - 1
    )

    return (
        date >= yesterday
        && date < today
    )
  }

  if (
      timeFilter.value === 'week'
      || timeFilter.value === 'this-week'
  ) {
    return date >= startOfWeek(now)
  }

  if (
      timeFilter.value === '7-days'
      || timeFilter.value === '7days'
  ) {
    const boundary = new Date(now)

    boundary.setDate(
        boundary.getDate() - 7
    )

    return date >= boundary
  }

  if (
      timeFilter.value === 'month'
      || timeFilter.value === 'this-month'
  ) {
    return (
        date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
    )
  }

  if (
      timeFilter.value === '30-days'
      || timeFilter.value === '30days'
  ) {
    const boundary = new Date(now)

    boundary.setDate(
        boundary.getDate() - 30
    )

    return date >= boundary
  }

  return true
}


/* ==================================================
   SORTING
================================================== */

function sortSessions(sessions) {
  const result = [...sessions]

  if (sortOrder.value === 'oldest') {
    return result.sort((first, second) => {
      return (
          (sessionDate(first)?.getTime() ?? 0)
          -
          (sessionDate(second)?.getTime() ?? 0)
      )
    })
  }

  if (sortOrder.value === 'title') {
    return result.sort((first, second) => {
      return titleOf(first).localeCompare(
          titleOf(second)
      )
    })
  }

  if (sortOrder.value === 'status') {
    return result.sort((first, second) => {
      return String(
          first?.status ?? ''
      ).localeCompare(
          String(second?.status ?? '')
      )
    })
  }

  return result.sort((first, second) => {
    return (
        (sessionDate(second)?.getTime() ?? 0)
        -
        (sessionDate(first)?.getTime() ?? 0)
    )
  })
}


/* ==================================================
   FILTERED PANEL SESSIONS

   Mediation sessions have already been removed before
   search, status, time, or sorting is performed.
================================================== */

const filteredSessions = computed(() => {
  let sessions = [
    ...orderedDebates.value
  ]

  const query = searchQuery.value
      .trim()
      .toLowerCase()

  if (query) {
    sessions = sessions.filter(session => {
      const searchableValues = [
        session?.title,
        session?.calibration?.topic,
        session?.calibration?.objective,
        session?.calibration?.context
      ]

      return searchableValues
          .filter(Boolean)
          .some(value => {
            return String(value)
                .toLowerCase()
                .includes(query)
          })
    })
  }

  /*
   * Every session is already panel mode.
   *
   * If the child still emits "mediator", the archive
   * returns no results instead of exposing mediation.
   */
  if (
      typeFilter.value !== 'all'
      && normalizedDiscussionMode({
        mode: typeFilter.value
      }) !== 'panel'
  ) {
    sessions = []
  }

  if (statusFilter.value !== 'all') {
    sessions = sessions.filter(session => {
      return session?.status === statusFilter.value
    })
  }

  sessions = sessions.filter(
      passesTimeFilter
  )

  return sortSessions(sessions)
})


/* ==================================================
   DETAIL SELECTION MATCHING
================================================== */

const discussionMatchesSelection = computed(() => {
  if (!selectedDebateId.value) {
    return false
  }

  return sameId(
      discussionStore.sessionId,
      selectedDebateId.value
  )
})


/* ==================================================
   PREVIEW SESSION
================================================== */

const previewSession = computed(() => {
  const session = selectedDebate.value

  if (!session) {
    return null
  }

  if (!discussionMatchesSelection.value) {
    return session
  }

  return {
    ...session,

    mode: 'panel',

    status: (
        discussionStore.status
        ?? session.status
    ),

    currentRound: (
        discussionStore.flow?.currentRound
        ?? session.currentRound
        ?? 0
    ),

    currentStage: (
        discussionStore.flow?.currentSectionId
        ?? session.currentStage
        ?? null
    )
  }
})


/* ==================================================
   PARTICIPANT FALLBACK
================================================== */

const fallbackParticipants = computed(() => {
  const session = selectedDebate.value

  if (!session) {
    return {
      characters: {},
      characterOrder: [],
      mediator: null
    }
  }

  const characters = {}
  const characterOrder = []

  const panelMembers = Array.isArray(
      session.panelMembers
  )
      ? session.panelMembers
      : []

  panelMembers.forEach(character => {
    if (!character?.id) {
      return
    }

    const id = String(character.id)

    characters[id] = character
    characterOrder.push(id)
  })

  return {
    characters,
    characterOrder,
    mediator: session.mediator ?? null
  }
})


/* ==================================================
   SELECTED SNAPSHOT
================================================== */

const selectedSnapshot = computed(() => {
  const hasSelection = Boolean(
      selectedDebate.value
  )

  const matches = (
      hasSelection
      && discussionMatchesSelection.value
  )

  return {
    session: previewSession.value,

    status: matches
        ? discussionStore.status
        : (
            selectedDebate.value?.status
            ?? 'idle'
        ),

    sections: matches
        ? discussionStore.orderedSections
        : [],

    participants: matches
        ? discussionStore.participants
        : fallbackParticipants.value,

    outcome: matches
        ? discussionStore.outcome
        : {},

    flow: matches
        ? discussionStore.flow
        : {
          currentSectionId: null,

          currentRound: (
              selectedDebate.value?.currentRound
              ?? 0
          ),

          sectionOrder: [],
          completedSectionIds: []
        },

    loading: Boolean(
        hasSelection
        && (
            discussionStore.isLoading
            || !matches
        )
    ),

    error: (
        selectedLoadError.value
        ?? (
            matches
                ? discussionStore.error
                : null
        )
    )
  }
})


/* ==================================================
   FILTER EVENTS
================================================== */

function applyFilters(payload = {}) {
  if (
      !payload
      || typeof payload !== 'object'
  ) {
    return
  }

  const values = (
      payload.filters
      ?? payload
  )

  const nextSearch = (
      values.searchQuery
      ?? values.search
  )

  const nextType = (
      values.typeFilter
      ?? values.type
  )

  const nextStatus = (
      values.statusFilter
      ?? values.status
  )

  const nextTime = (
      values.timeFilter
      ?? values.time
  )

  const nextSort = (
      values.sortOrder
      ?? values.sort
  )

  if (nextSearch !== undefined) {
    searchQuery.value = String(
        nextSearch ?? ''
    )
  }

  if (nextType !== undefined) {
    const normalizedType = normalizedDiscussionMode({
      mode: nextType
    })

    /*
     * Accept "all" or "panel".
     * A mediation value may still be emitted by the
     * existing child, but it cannot expose any records.
     */
    typeFilter.value = (
        nextType === 'all'
        || normalizedType === 'panel'
    )
        ? nextType
        : 'mediation-hidden'
  }

  if (nextStatus !== undefined) {
    statusFilter.value = (
        nextStatus ?? 'all'
    )
  }

  if (nextTime !== undefined) {
    timeFilter.value = (
        nextTime ?? 'all'
    )
  }

  if (nextSort !== undefined) {
    sortOrder.value = (
        nextSort ?? 'newest'
    )
  }
}


/* ==================================================
   VIEW MODE
================================================== */

function handleViewChange(nextMode) {
  if (!nextMode) {
    return
  }

  viewMode.value = nextMode
}


/* ==================================================
   SYNCHRONIZE ARCHIVE METADATA
================================================== */

function syncArchiveSessionState(
    sessionId,
    response = null
) {
  if (
      !sameId(
          sessionId,
          selectedDebateId.value
      )
  ) {
    return
  }

  const archiveSession = panelSessionById(
      sessionId
  )

  if (!archiveSession) {
    return
  }

  const responseSession = (
      response?.session
      ?? response?.snapshot?.session
      ?? response?.discussionSnapshot?.session
      ?? null
  )

  if (
      responseSession?.id
      && (
          !normalizedDiscussionMode(responseSession)
          || isPanelDiscussion(responseSession)
      )
  ) {
    debatesStore.upsertDebate({
      ...responseSession,
      mode: 'panel'
    })

    return
  }

  debatesStore.patchDebate(
      sessionId,
      {
        mode: 'panel',

        status: discussionStore.status,

        currentRound: (
            discussionStore.flow?.currentRound
            ?? selectedDebate.value?.currentRound
            ?? 0
        ),

        currentStage: (
            discussionStore.flow?.currentSectionId
            ?? selectedDebate.value?.currentStage
            ?? null
        )
      }
  )
}


/* ==================================================
   SERIALIZED DISCUSSION LOAD
================================================== */

let discussionLoadQueue = Promise.resolve(null)

function queueDiscussionLoad(
    sessionId,
    {
      force = false
    } = {}
) {
  const id = normalizeId(sessionId)

  if (!id) {
    return Promise.resolve(null)
  }

  /*
   * Do not allow a mediation ID to enter the detail
   * loading pipeline.
   */
  if (!panelSessionById(id)) {
    return Promise.resolve(null)
  }

  discussionLoadQueue = discussionLoadQueue
      .catch(() => null)
      .then(async () => {
        if (componentDestroyed.value) {
          return null
        }

        if (
            !sameId(
                selectedDebateId.value,
                id
            )
        ) {
          return null
        }

        /*
         * Recheck after waiting in the queue because the
         * archive may have refreshed in the meantime.
         */
        if (!panelSessionById(id)) {
          return null
        }

        const alreadyLoaded = sameId(
            discussionStore.sessionId,
            id
        )

        if (
            alreadyLoaded
            && !force
            && !discussionStore.error
        ) {
          return null
        }

        selectedLoadError.value = null

        if (
            !alreadyLoaded
            || force
        ) {
          discussionStore.resetDiscussion()
        }

        try {
          const data = await discussionStore
              .loadDiscussion(id)

          if (componentDestroyed.value) {
            return data
          }

          if (
              sameId(
                  selectedDebateId.value,
                  id
              )
              && panelSessionById(id)
          ) {
            syncArchiveSessionState(
                id,
                data
            )
          }

          if (!selectedDebateId.value) {
            discussionStore.resetDiscussion()
          }

          return data
        } catch (loadError) {
          if (
              sameId(
                  selectedDebateId.value,
                  id
              )
          ) {
            selectedLoadError.value = loadError

            console.error(
                '[SessionsPage] Failed to load selected panel discussion:',
                loadError
            )
          }

          return null
        }
      })

  return discussionLoadQueue
}


/* ==================================================
   SELECT PANEL SESSION
================================================== */

function selectSession(sessionOrId) {
  const sessionId = resolveSessionId(
      sessionOrId
  )

  if (!sessionId) {
    return null
  }

  const panelSession = panelSessionById(
      sessionId
  )

  if (!panelSession) {
    return null
  }

  const previousId = selectedDebateId.value

  const session = debatesStore.selectDebate(
      panelSession.id
  )

  if (
      !session
      || !isPanelDiscussion(session)
  ) {
    return null
  }

  if (
      sameId(
          previousId,
          session.id
      )
      && !discussionMatchesSelection.value
  ) {
    void queueDiscussionLoad(
        session.id
    )
  }

  return session
}


/* ==================================================
   REFRESH PANEL ARCHIVE
================================================== */

async function refreshSessions() {
  try {
    const previousSelectionId = (
        selectedDebateId.value
    )

    await debatesStore.refreshDebates()

    const previousPanel = panelSessionById(
        previousSelectionId
    )

    if (previousPanel?.id) {
      debatesStore.selectDebate(
          previousPanel.id
      )

      await queueDiscussionLoad(
          previousPanel.id,
          {
            force: true
          }
      )

      return
    }

    const firstPanelSession = (
        orderedDebates.value[0]
    )

    if (firstPanelSession?.id) {
      debatesStore.selectDebate(
          firstPanelSession.id
      )

      await queueDiscussionLoad(
          firstPanelSession.id,
          {
            force: true
          }
      )

      return
    }

    discussionStore.resetDiscussion()
  } catch (refreshError) {
    console.error(
        '[SessionsPage] Panel archive refresh failed:',
        refreshError
    )
  }
}


/* ==================================================
   ENSURE PANEL DETAIL
================================================== */

async function ensureSessionDetail(sessionOrId) {
  const sessionId = resolveSessionId(
      sessionOrId
  )

  if (!sessionId) {
    return null
  }

  const panelSession = panelSessionById(
      sessionId
  )

  if (!panelSession) {
    return null
  }

  const session = debatesStore.selectDebate(
      panelSession.id
  )

  if (
      !session
      || !isPanelDiscussion(session)
  ) {
    return null
  }

  await queueDiscussionLoad(
      session.id
  )

  return session
}


/* ==================================================
   CONTINUE PANEL SESSION
================================================== */

async function continueSession(sessionOrId) {
  const session = await ensureSessionDetail(
      sessionOrId
  )

  if (!session) {
    return
  }

  try {
    await Promise.resolve(
        chamberStore.continueSession(session)
    )

    await router.push({
      path: '/chamber',

      query: {
        session: String(session.id)
      }
    })
  } catch (navigationError) {
    console.error(
        '[SessionsPage] Unable to continue panel session:',
        navigationError
    )
  }
}


/* ==================================================
   OPEN PANEL SESSION
================================================== */

async function openSession(sessionOrId) {
  const session = await ensureSessionDetail(
      sessionOrId
  )

  if (!session) {
    return
  }

  try {
    await router.push({
      path: '/chamber',

      query: {
        session: String(session.id)
      }
    })
  } catch (navigationError) {
    console.error(
        '[SessionsPage] Unable to open panel session:',
        navigationError
    )
  }
}


/* ==================================================
   OPEN PANEL REPORT
================================================== */

async function openReport(sessionOrId) {
  const session = await ensureSessionDetail(
      sessionOrId
  )

  if (!session) {
    return
  }

  emit(
      'open-report',
      {
        sessionId: String(session.id),
        snapshot: selectedSnapshot.value
      }
  )
}


/* ==================================================
   PIN PANEL SESSION
================================================== */

function pinSession(sessionOrId = null) {
  const sessionId = (
      resolveSessionId(sessionOrId)
      ?? normalizeId(selectedDebateId.value)
  )

  if (!sessionId) {
    return null
  }

  const panelSession = panelSessionById(
      sessionId
  )

  if (!panelSession) {
    return null
  }

  return debatesStore.toggleDebatePinned(
      panelSession.id
  )
}


/* ==================================================
   PANEL-ONLY PIN SELECTOR
================================================== */

function openPinSelector() {
  emit(
      'open-pin-selector',
      {
        sessions: [
          ...unpinnedDebates.value
        ],

        pinnedSessions: [
          ...pinnedDebates.value
        ],

        selectedId: selectedDebateId.value,

        hasPinnedDebates:
        hasPinnedDebates.value,

        pinnedCount:
        pinnedDebateCount.value
      }
  )
}


/* ==================================================
   SELECTED ID WATCHER
================================================== */

watch(
    selectedDebateId,

    sessionId => {
      if (!archiveReady.value) {
        return
      }

      selectedLoadError.value = null

      if (!sessionId) {
        discussionStore.resetDiscussion()
        return
      }

      if (!panelSessionById(sessionId)) {
        discussionStore.resetDiscussion()
        return
      }

      void queueDiscussionLoad(sessionId)
    }
)


/* ==================================================
   PAGE ENTRY AUTO-HYDRATION

   Every time this routed page is entered:

   1. refresh the debate archive from Django;
   2. preserve the current panel selection when valid;
   3. otherwise select the newest panel session;
   4. force-load the selected discussion snapshot.

   The archive and preview therefore update without a
   browser refresh.
================================================== */

async function hydrateArchiveOnEntry() {
  componentDestroyed.value = false
  archiveReady.value = false
  selectedLoadError.value = null

  try {
    await refreshSessions()

    if (componentDestroyed.value) {
      return null
    }

    archiveReady.value = true

    return selectedSnapshot.value
  } catch (entryError) {
    archiveReady.value = true

    console.error(
        '[SessionsPage] Archive entry hydration failed:',
        entryError
    )

    return null
  }
}


/* ==================================================
   INITIALIZATION

   Existing mediation selections are ignored and the
   first available panel discussion is selected.
================================================== */

onMounted(() => {
  void hydrateArchiveOnEntry()
})


/*
 * onActivated() runs on the first kept-alive activation
 * as well as later returns.
 *
 * The first load is already handled by onMounted(), so
 * skip only that first activation to avoid duplicate
 * archive/detail requests.
 */
onActivated(() => {
  componentDestroyed.value = false

  if (!firstActivationSeen) {
    firstActivationSeen = true
    return
  }

  void hydrateArchiveOnEntry()
})


/* ==================================================
   CLEANUP
================================================== */

onBeforeUnmount(() => {
  componentDestroyed.value = true
})
</script>


<style scoped>
.sessions-page {
  position: relative;

  width: 100%;
  height: 100vh;

  overflow: hidden;

  background:
      #000;
}


/* ==================================================
   PAGE ENTER SEQUENCE

   1. black screen
   2. archive image enters
   3. 0.5s rest
   4. header + activity
   5. session table + summary preview
   6. filters + pinned sessions
================================================== */

.bg {
  position: absolute;

  inset: 0;

  opacity: 0;

  transform:
      scale(1.045);

  background:
      linear-gradient(
          rgba(2, 4, 12, .35),
          rgba(2, 4, 12, .62)
      ),
      url("/images/archive/bg.png")
      center /
      cover
      no-repeat;

  will-change:
      opacity,
      transform;

  animation:
      archive-bg-enter
      1.15s
      cubic-bezier(.16, 1, .3, 1)
      forwards;
}


@keyframes archive-bg-enter {

  from {
    opacity: 0;

    transform:
        scale(1.045);
  }

  to {
    opacity: 1;

    transform:
        scale(1);
  }
}


/* ==================================================
   STAGED CONTENT ENTRANCE
================================================== */

.header,
.activity,
.sessions-list,
.session-preview,
.filters,
.pinned {
  opacity: 0;

  will-change:
      opacity,
      transform;
}


.header,
.activity {
  animation:
      archive-panel-enter
      .48s
      ease-out
      1.65s
      forwards;
}


.sessions-list,
.session-preview {
  animation:
      archive-panel-enter
      .48s
      ease-out
      2.13s
      forwards;
}


.filters,
.pinned {
  animation:
      archive-panel-enter
      .48s
      ease-out
      2.61s
      forwards;
}


@keyframes archive-panel-enter {

  from {
    opacity: 0;

    transform:
        translateY(10px);
  }

  to {
    opacity: 1;

    transform:
        translateY(0);
  }
}


.content {
  position: relative;

  z-index: 1;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  padding:
      2vh 2vw;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    14vw;

  gap:
      1vh;

  overflow: hidden;
}


.main-area {
  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-rows:
    12vh
    7vh
    9vh
    minmax(0, 1fr);

  gap:
      1vh;

  overflow: hidden;
}


.header,
.filters,
.pinned {
  min-width: 0;
  min-height: 0;
}


.workspace {
  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1.65fr)
    minmax(0, .85fr);

  gap:
      1vh;

  overflow: hidden;
}


/*
  Ready for future alternate presentation modes.

  Right now SessionsList remains the single archive
  records component, so these classes intentionally
  preserve the current layout.
*/

.workspace.view-list {
  grid-template-columns:
    minmax(0, 1.65fr)
    minmax(0, .85fr);
}


.panel {
  border:
      1px solid
      rgba(91, 202, 255, .25);

  background:
      rgba(3, 8, 18, .72);

  backdrop-filter:
      blur(8px);
}


.sessions-list,
.session-preview,
.activity {
  min-width: 0;
  min-height: 0;

  overflow: hidden;
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (
prefers-reduced-motion:
    reduce
) {

  .bg,
  .header,
  .activity,
  .sessions-list,
  .session-preview,
  .filters,
  .pinned {
    opacity: 1;

    transform: none;

    animation: none;
  }
}
</style>


