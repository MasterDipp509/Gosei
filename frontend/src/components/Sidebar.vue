<script setup>
import {
  computed,
  ref
} from 'vue'

import {
  useRoute,
  useRouter
} from 'vue-router'


import {
  useProfileStore
} from '@/stores/profileStore.js'

import {
  useCurrentDiscussionStore
} from '@/stores/currentDiscussion.js'

import {
  useChamberStore
} from '@/stores/chamber.js'


import {
  House,
  Scale,
  MessageSquareText,
  FolderKanban,
  ScrollText,
  BookOpen,
  ChartNoAxesCombined,
  CalendarDays,
  ShieldCheck,
  CircleDot,
  LogOut,
  UserRound,
  ChevronRight
} from '@lucide/vue'


/* ==================================================
   ROUTER
================================================== */

const route =
    useRoute()

const router =
    useRouter()


/* ==================================================
   STORES
================================================== */

const profileStore =
    useProfileStore()

const currentDiscussionStore =
    useCurrentDiscussionStore()

const chamberStore =
    useChamberStore()


/* ==================================================
   DISCUSSION STATUS

   Keep terminal-state handling local and defensive.

   The backend/store normally uses:

     completed
     abandoned

   Older or lightweight records may still expose:

     complete

   All three are treated as terminal.
================================================== */

const normalizedDiscussionStatus =
    computed(() =>

        String(
            currentDiscussionStore
                .status ??
            ''
        )
            .trim()
            .toLowerCase()
    )


const discussionIsTerminal =
    computed(() =>

        [
          'complete',
          'completed',
          'abandoned'
        ].includes(
            normalizedDiscussionStatus.value
        )
    )


/* ==================================================
   DISCUSSION AVAILABILITY

   A terminal discussion must behave exactly like
   there is no current active discussion in the
   sidebar.

   That means completed discussions do NOT expose:

   - current session card
   - council members
   - mediator
   - round progress
   - End Session controls
================================================== */

const hasDiscussion =
    computed(() =>

        Boolean(
            currentDiscussionStore
                .hasSession
        )

        &&

        !discussionIsTerminal.value
    )


/* ==================================================
   CURRENT SECTION
================================================== */

const currentSection =
    computed(() => {

      if (
          !hasDiscussion.value
      ) {
        return null
      }


      return (
          currentDiscussionStore
              .currentSection ??

          null
      )
    })


/* ==================================================
   SESSION DATE

   The discussion store does not expose a dedicated
   top-level createdAt value.

   This safely checks any hydrated backend metadata
   that may contain a session date.

   If no date exists, the sidebar simply renders an
   empty date value instead of inventing one.
================================================== */

const sessionDate =
    computed(() => {

      if (
          !hasDiscussion.value
      ) {
        return ''
      }


      const rawDate =

          currentSection
              .value
              ?.metadata
              ?.createdAt ??

          currentSection
              .value
              ?.metadata
              ?.created_at ??

          currentDiscussionStore
              .modelContext
              ?.calibrationSnapshot
              ?.createdAt ??

          currentDiscussionStore
              .modelContext
              ?.calibrationSnapshot
              ?.created_at ??

          null


      if (
          !rawDate
      ) {
        return ''
      }


      const parsedDate =
          new Date(
              rawDate
          )


      if (
          Number.isNaN(
              parsedDate.getTime()
          )
      ) {
        return String(
            rawDate
        )
      }


      return parsedDate
          .toLocaleDateString(
              undefined,

              {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }
          )
    })


/* ==================================================
   TOTAL ROUNDS

   Prefer explicit backend metadata.

   Otherwise use the actual rounds currently present
   in the active section.

   The current round is included as a minimum so the
   UI can never display something invalid like 3 / 2.
================================================== */

const totalRounds =
    computed(() => {

      if (
          !hasDiscussion.value
      ) {
        return 0
      }


      const explicitTotal =

          currentSection
              .value
              ?.metadata
              ?.totalRounds ??

          currentSection
              .value
              ?.metadata
              ?.total_rounds ??

          null


      if (
          Number(explicitTotal) > 0
      ) {
        return Number(
            explicitTotal
        )
      }


      const storedRoundCount =
          Object.keys(
              currentSection
                  .value
                  ?.rounds ??

              {}
          ).length


      const currentRound =
          Number(
              currentDiscussionStore
                  .flow
                  .currentRound ??

              1
          )


      return Math.max(
          storedRoundCount,
          currentRound,
          1
      )
    })


/* ==================================================
   ACTIVE SESSION

   No discussion session means null.

   When the currentDiscussion store hydrates, this
   object updates automatically.
================================================== */

const activeSession =
    computed(() => {

      if (
          !hasDiscussion.value
      ) {
        return null
      }


      return {
        id:
        currentDiscussionStore
            .sessionId,

        title:
            currentDiscussionStore
                .brief
                ?.topic ||

            currentSection
                .value
                ?.title ||

            'Council Session',

        date:
        sessionDate.value,

        round:
            Number(
                currentDiscussionStore
                    .flow
                    .currentRound ??

                1
            ),

        totalRounds:
        totalRounds.value,

        status:
        currentDiscussionStore
            .status
      }
    })


/* ==================================================
   MEMBER ACCENT FALLBACKS

   Accent colours are presentation-only values.

   A participant-provided accent is preferred when
   available. Otherwise a stable colour is selected
   according to council order.
================================================== */

const memberAccentFallbacks = [
  '#48b8ff',
  '#8268ff',
  '#58d8ff',
  '#c06cff',
  '#718cff'
]


/* ==================================================
   COUNCIL MEMBERS

   Character order comes directly from the discussion
   store.

   Character data is then resolved from the
   participants.characters map.

   No active discussion = empty array.
================================================== */

const councilMembers =
    computed(() => {

      if (
          !hasDiscussion.value
      ) {
        return []
      }


      const order =
          currentDiscussionStore
              .participants
              ?.characterOrder ??

          []


      const characters =
          currentDiscussionStore
              .participants
              ?.characters ??

          {}


      return order
          .map(
              (
                  characterId,
                  index
              ) => {

                const member =
                    characters[
                        characterId
                        ]


                if (
                    !member
                ) {
                  return null
                }


                return {
                  ...member,

                  id:
                      member.id ??
                      characterId,

                  name:
                      member.name ??
                      'Council Member',

                  role:
                      member.role ??
                      'Council Member',

                  accent:
                      member.accent ??

                      member.color ??

                      member.themeColor ??

                      member.theme_color ??

                      memberAccentFallbacks[
                      index %
                      memberAccentFallbacks.length
                          ]
                }
              }
          )
          .filter(Boolean)
    })


/* ==================================================
   MEDIATOR

   No active discussion = null.

   Otherwise the mediator is read directly from the
   discussion participants state.
================================================== */

const mediator =
    computed(() => {

      if (
          !hasDiscussion.value
      ) {
        return null
      }


      const participant =
          currentDiscussionStore
              .participants
              ?.mediator


      if (
          !participant
      ) {
        return null
      }


      return {
        ...participant,

        id:
            participant.id ??
            'mediator',

        name:
            participant.name ??
            'Mediator',

        role:
            participant.role ??
            'Council Facilitator'
      }
    })


/* ==================================================
   PRESENTATION MODE
================================================== */

const mode =
    computed({

      get: () =>
          profileStore
              .profile
              .presentationPreference,


      set: value => {

        profileStore
            .setPresentationPreference(
                value
            )
      }
    })


function setMode(
    nextMode
) {

  mode.value =
      nextMode
}


/* ==================================================
   PRESENTATION MODE TRACK
================================================== */

const activeTrackStyle =
    computed(() => {

      if (
          mode.value ===
          'anime'
      ) {
        return {
          left: '0%',
          right: '50%'
        }
      }


      return {
        left: '50%',
        right: '0%'
      }
    })


const modeIndicatorStyle =
    computed(() => ({

      left:
          mode.value ===
          'anime'
              ? '0%'
              : '100%',

      transform:
          'translate(-50%, -50%)'
    }))


/* ==================================================
   NAVIGATION
================================================== */

const navigation = [

  {
    label: 'Sessions',
    mobileLabel: 'Sessions',
    path: '/sessions',
    icon: MessageSquareText
  },


  {
    label: 'Chamber',
    mobileLabel: 'Chamber',
    path: '/chamber',
    icon: Scale
  },


  {
    label: 'Knowledge Vault',
    mobileLabel: 'Vault',
    path: '/knowledge-vault',
    icon: BookOpen
  },

]


/* ==================================================
   SIDEBAR DISPLAY STATE
================================================== */

const hasActiveSession =
    computed(() =>
        Boolean(
            activeSession.value
        )
    )


const hasCouncilMembers =
    computed(() =>
        councilMembers
            .value
            .length > 0
    )


/* ==================================================
   SESSION PROGRESS
================================================== */

const sessionProgress =
    computed(() => {

      if (
          !activeSession.value
      ) {
        return 0
      }


      const round =
          Number(
              activeSession
                  .value
                  .round
          )


      const total =
          Number(
              activeSession
                  .value
                  .totalRounds
          )


      if (
          !total ||
          total <= 0
      ) {
        return 0
      }


      return Math.min(
          100,

          Math.max(
              0,

              (
                  round /
                  total
              ) * 100
          )
      )
    })


/* ==================================================
   ROUTE STATE
================================================== */

function isRouteActive(
    path
) {

  return (
      route.path ===
      path ||

      route.path.startsWith(
          `${path}/`
      )
  )
}


/* ==================================================
   NAVIGATION ACTIONS
================================================== */

function goHome() {

  router.push(
      '/'
  )
}


function openCurrentSession() {

  if (
      !activeSession.value

      ||

      discussionIsTerminal.value
  ) {
    return
  }


  const discussionId =
      activeSession
          .value
          .id


  const councilMode =
      currentDiscussionStore
          .brief
          ?.councilMode ??

      chamberStore
          .activeSession
          ?.councilMode ??

      chamberStore
          .activeSession
          ?.mode ??

      chamberStore
          .councilMode ??

      'panel'


  const calibrationSnapshot =
      currentDiscussionStore
          .modelContext
          ?.calibrationSnapshot ??

      {}


  const resumeCalibration = {

    ...calibrationSnapshot,

    topic:
        currentDiscussionStore
            .brief
            ?.topic ??

        calibrationSnapshot
            ?.topic ??

        calibrationSnapshot
            ?.idea ??

        '',

    objective:
        currentDiscussionStore
            .brief
            ?.objective ??

        calibrationSnapshot
            ?.objective ??

        '',

    objectiveId:
        currentDiscussionStore
            .brief
            ?.objectiveId ??

        calibrationSnapshot
            ?.objectiveId ??

        calibrationSnapshot
            ?.objective_id ??

        '',

    context:
        currentDiscussionStore
            .brief
            ?.context ??

        calibrationSnapshot
            ?.context ??

        calibrationSnapshot
            ?.backgroundContext ??

        calibrationSnapshot
            ?.background_context ??

        '',

    approach:
        currentDiscussionStore
            .brief
            ?.approach ??

        calibrationSnapshot
            ?.approach ??

        'balanced',

    councilMode,

    complete:
        true
  }


  /*
    IMPORTANT:

    Routing alone is not enough.

    ChamberFlow decides which page to render from the
    chamber store, so prime that store FIRST and only
    navigate after the resume action succeeds.
  */

  const resumed =
      chamberStore
          .continueSession({

            ...chamberStore
                .activeSession,

            id:
            discussionId,

            title:
            activeSession
                .value
                .title,

            status:
            currentDiscussionStore
                .status,

            mode:
            councilMode,

            councilMode,

            currentRound:
            currentDiscussionStore
                .flow
                .currentRound,

            calibration:
            resumeCalibration,

            panelMembers:
            councilMembers.value,

            mediator:
            mediator.value
          })


  if (
      !resumed
  ) {
    console.warn(
        '[CouncilSidebar] Chamber store refused session resume:',
        discussionId
    )

    return
  }


  router.push({

    path:
        '/chamber',

    query: {
      session:
      discussionId
    }
  })
}


function openPanelEditor() {

  router.push(
      '/settings'
  )
}


/* ==================================================
   LOG OUT

   Authentication cleanup stays owned by profileStore.
   The store handles the backend request, CSRF state,
   authenticated-user cleanup, and council defaults.
================================================== */

const isLoggingOut =
    ref(false)


async function logOutUser() {

  if (
      isLoggingOut.value

      ||

      profileStore.isLoading
  ) {
    return
  }


  isLoggingOut.value =
      true


  try {

    await profileStore
        .logout()

  } finally {

    isLoggingOut.value =
        false


    await router.replace(
        '/login'
    )
  }
}


/* ==================================================
   END SESSION

   Flow:

   1. Send the real backend `end` control action.
   2. Let currentDiscussion apply the backend update.
   3. Canonicalize the local state to `completed` if
      an unusual response omitted a terminal status.
   4. Mirror completion into chamberStore so archive
      and navigation state cannot still treat the
      session as resumable before the next refresh.

   As soon as status becomes terminal, hasDiscussion
   turns false and every active-session information
   panel disappears reactively.
================================================== */

async function endSession() {

  if (
      !currentDiscussionStore
          .hasSession

      ||

      discussionIsTerminal.value
  ) {
    return null
  }


  const endingSessionId =
      currentDiscussionStore
          .sessionId


  try {

    const data =
        await currentDiscussionStore
            .endSession()


    const returnedStatus =
        String(
            data?.status ??
            data?.session?.status ??
            currentDiscussionStore.status ??
            ''
        )
            .trim()
            .toLowerCase()


    const returnedTerminal =
        [
          'complete',
          'completed',
          'abandoned'
        ].includes(
            returnedStatus
        )


    /*
      Defensive fallback.

      The backend should return `completed` after the
      end action. If it does not, keep the client from
      displaying a dead session as active.
    */

    if (
        !returnedTerminal
    ) {
      currentDiscussionStore.status =
          'completed'
    }


    /* ==============================================
       SYNC CHAMBER ACTIVE SESSION
    ============================================== */

    if (
        chamberStore
            .activeSession
            ?.id

        &&

        String(
            chamberStore
                .activeSession
                .id
        )

        ===

        String(
            endingSessionId
        )
    ) {

      chamberStore.activeSession = {

        ...chamberStore.activeSession,

        status:
            'completed'
      }
    }


    /* ==============================================
       SYNC RESUMABLE SESSION CACHE

       Prevents an already-ended discussion from
       remaining resumable in local archive state.
    ============================================== */

    chamberStore.resumableSessions =
        chamberStore
            .resumableSessions
            .map(
                session => {

                  if (
                      String(
                          session?.id
                      )

                      !==

                      String(
                          endingSessionId
                      )
                  ) {
                    return session
                  }


                  return {

                    ...session,

                    status:
                        'completed'
                  }
                }
            )


    return data

  } catch (error) {

    console.error(
        '[CouncilSidebar] Failed to end session:',
        error
    )


    return null
  }
}
</script>


<template>
  <aside
      class="council-sidebar"
      :data-presentation="mode"
      :data-theme="profileStore.profile.theme"
  >

    <div class="sidebar-surface"></div>


    <div class="sidebar-inner">

      <header class="sidebar-brand">

        <div class="brand-emblem">
          <Scale :size="23" />
        </div>

        <div class="brand-copy">

          <div class="brand-name">
            GOSEI
          </div>

          <span>
            AI COUNCIL SYSTEM
          </span>

        </div>

      </header>


      <button
          class="home-button"
          type="button"
          @click="goHome"
      >

        <span class="home-button__icon">
          <House :size="17" />
        </span>

        <span class="home-button__label">
          Home
        </span>

        <ChevronRight
            class="home-button__arrow"
            :size="15"
        />

        <span class="button-trace"></span>

      </button>


      <nav class="sidebar-nav">

        <RouterLink
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{
              active: isRouteActive(item.path)
            }"
        >

          <span class="nav-icon">

            <component
                :is="item.icon"
                :size="17"
                stroke-width="1.8"
            />

          </span>

          <span class="nav-label desktop-label">
            {{ item.label }}
          </span>

          <span class="nav-label mobile-label">
            {{ item.mobileLabel }}
          </span>

          <ChevronRight
              v-if="isRouteActive(item.path)"
              class="nav-arrow"
              :size="15"
          />

          <span class="nav-tracer"></span>

        </RouterLink>

      </nav>


      <div class="sidebar-scroll">

        <section class="sidebar-section">

          <div class="section-heading">

            <span class="heading-node"></span>

            <span>
              Current Session
            </span>

            <span class="heading-line"></span>

          </div>


          <button
              v-if="hasActiveSession"
              class="session-card"
              type="button"
              @click="openCurrentSession"
          >

            <div class="session-icon">
              <CalendarDays :size="17" />
            </div>

            <div class="session-info">

              <strong>
                {{ activeSession.title }}
              </strong>

              <span>
                {{ activeSession.date }}
              </span>

            </div>

            <div class="session-status">

              <span class="status-dot"></span>

              <span>
                Active
              </span>

            </div>

          </button>


          <div
              v-else
              class="section-empty"
          >

            <MessageSquareText :size="20" />

            <div>

              <strong>
                No active session
              </strong>

              <span>
                Start a council session to begin.
              </span>

            </div>

          </div>

        </section>


        <section class="sidebar-section">

          <div class="section-heading">

            <span class="heading-node"></span>

            <span>
              Council Members
            </span>

            <span class="heading-line"></span>

          </div>


          <div
              v-if="hasCouncilMembers"
              class="member-list"
          >

            <div
                v-for="member in councilMembers"
                :key="member.id"
                class="member-row"
                :style="{
                  '--member-accent': member.accent
                }"
            >

              <span class="member-node"></span>

              <div class="member-avatar">

                <span class="avatar-corner corner-one"></span>
                <span class="avatar-corner corner-two"></span>

                <UserRound :size="16" />

              </div>

              <div class="member-info">

                <strong>
                  {{ member.name }}
                </strong>

                <span>
                  {{ member.role }}
                </span>

              </div>

            </div>

          </div>


          <div
              v-else
              class="section-empty compact"
          >

            <UserRound :size="18" />

            <div>

              <strong>
                Council not assembled
              </strong>

              <span>
                Members appear when a session begins.
              </span>

            </div>

          </div>

        </section>


        <section class="sidebar-section">

          <div class="section-heading">

            <span class="heading-node purple"></span>

            <span>
              Mediator
            </span>

            <span class="heading-line purple"></span>

          </div>


          <div
              v-if="mediator"
              class="mediator-card"
          >

            <div class="mediator-emblem">
              <ShieldCheck :size="20" />
            </div>

            <div class="mediator-info">

              <strong>
                {{ mediator.name }}
              </strong>

              <span>
                {{ mediator.role }}
              </span>

            </div>

          </div>


          <div
              v-else
              class="section-empty compact"
          >

            <ShieldCheck :size="18" />

            <div>

              <strong>
                No mediator assigned
              </strong>

              <span>
                Assign one before starting.
              </span>

            </div>

          </div>

        </section>


        <section
            v-if="hasActiveSession"
            class="session-controls"
        >

          <button
              class="end-session-button"
              type="button"
              @click="endSession"
          >

            <LogOut :size="15" />

            <span>
              End Session
            </span>

          </button>


          <div class="session-footer">

            <div class="session-live">

              <CircleDot :size="13" />

              <span>
                Council in Session
              </span>

            </div>

            <span class="round-state">
              Round
              {{ activeSession.round }}
              /
              {{ activeSession.totalRounds }}
            </span>

          </div>


          <div class="round-progress">

            <span
                :style="{
                  width: `${sessionProgress}%`
                }"
            ></span>

          </div>

        </section>

      </div>


      <footer class="sidebar-footer">

        <!--
        ==================================================
        PRESENTATION MODE SLIDER

        Temporarily disabled in the UI.
        Keep this block intact so it can be restored later
        by removing this template comment wrapper.
        ==================================================

        <div class="mode-panel">

          <div class="mode-heading">

            <span>
              Presentation
            </span>

            <span
                class="mode-value"
                :class="{
                  anime: mode === 'anime',
                  professional: mode === 'professional'
                }"
            >
              {{ mode === 'anime' ? 'Anime' : 'Professional' }}
            </span>

          </div>


          <div class="mode-switch">

            <div class="mode-track"></div>


            <div
                class="mode-track-active"
                :class="mode"
                :style="activeTrackStyle"
            ></div>


            <span
                class="mode-indicator"
                :class="mode"
                :style="modeIndicatorStyle"
            ></span>


            <button
                type="button"
                class="mode-node mode-node--left"
                :class="{
                  active: mode === 'anime'
                }"
                aria-label="Switch to anime mode"
                title="Anime presentation"
                @click="setMode('anime')"
            >

              <svg
                  class="mode-node__svg"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
              >
                <path
                    d="M7 13.5 10.5 7l5.5 4.2L21.5 7l3.5 6.5v7.2c0 3.1-4 5.8-9 5.8s-9-2.7-9-5.8Z"
                />

                <path
                    d="M11.2 17.1c1.3-1 2.6-1 3.9 0M17 17.1c1.3-1 2.6-1 3.9 0"
                />

                <path
                    d="M13 21.2c1.7 1.1 4.3 1.1 6 0"
                />

                <path
                    d="m5.5 9 1.2-2.4L9 5.5M25 6l1.2 2.3 2.3 1.2"
                />
              </svg>

            </button>


            <button
                type="button"
                class="mode-node mode-node--right"
                :class="{
                  active: mode === 'professional'
                }"
                aria-label="Switch to professional mode"
                title="Professional presentation"
                @click="setMode('professional')"
            >

              <svg
                  class="mode-node__svg"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
              >
                <rect
                    x="5.5"
                    y="9"
                    width="21"
                    height="15.5"
                    rx="1.8"
                />

                <path
                    d="M11.5 9V6.5h9V9M5.5 14.2h21M13 17h6M16 14.2v4.1"
                />

                <path
                    d="M9.5 24.5v2M22.5 24.5v2"
                />
              </svg>

            </button>

          </div>

        </div>
        -->


        <button
            class="settings-button edit-panel-button"
            :class="{
              active: isRouteActive('/settings')
            }"
            type="button"
            @click="openPanelEditor"
        >

          <svg
              class="edit-panel-svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M17.5 4.5a2.12 2.12 0 0 1 3 3L13 15l-4 1 1-4Z" />
          </svg>

          <span class="settings-text">
            Edit Panel
          </span>

          <span class="settings-sweep"></span>

        </button>


        <button
            class="settings-button logout-button"
            type="button"
            :disabled="isLoggingOut || profileStore.isLoading"
            @click="logOutUser"
        >

          <LogOut
              :size="18"
              stroke-width="1.8"
          />

          <span class="settings-text">
            {{ isLoggingOut ? 'Logging Out…' : 'Log Out' }}
          </span>

          <span class="settings-sweep"></span>

        </button>

      </footer>

    </div>


    <svg
        class="sidebar-overlap"
        viewBox="0 0 78 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
    >

      <path
          class="overlap-fill"
          d="
          M 0 0
          H 48
          L 68 18
          V 176
          L 54 200
          V 800
          L 68 824
          V 982
          L 48 1000
          H 0
          Z
        "
      />


      <path
          class="overlap-purple"
          d="
          M 5 0
          H 45
          L 61 20
          V 171
          L 46 197
          V 803
          L 61 829
          V 980
          L 45 1000
        "
      />


      <path
          class="overlap-neon"
          d="
          M 14 0
          H 40
          L 54 22
          V 168
          L 39 195
          V 805
          L 54 832
          V 978
          L 40 1000
        "
      />


      <path
          class="overlap-tracer"
          d="
          M 14 0
          H 40
          L 54 22
          V 168
          L 39 195
          V 805
          L 54 832
          V 978
          L 40 1000
        "
      />

    </svg>

  </aside>
</template>


<style scoped>

/* ==================================================
   ROOT
================================================== */

.council-sidebar {
  --black: #010104;
  --black-soft: #030309;
  --panel: #050610;
  --panel-raised: #070916;

  --blue: #4bc8ff;
  --blue-bright: #8de4ff;
  --blue-soft: rgba(75, 200, 255, 0.22);

  --purple: #9f62ff;
  --purple-bright: #c69aff;
  --purple-soft: rgba(159, 98, 255, 0.22);

  --text-main: #eef7ff;
  --text-soft: #94a9c2;
  --text-dim: #66748a;

  position: relative;

  display: block;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  max-width: 100%;
  max-height: 100%;

  overflow: visible;

  z-index: 50;

  color: var(--text-main);

  isolation: isolate;
}


.council-sidebar *,
.council-sidebar *::before,
.council-sidebar *::after {
  box-sizing: border-box;
}


/* ==================================================
   BLACK SURFACE
================================================== */

.sidebar-surface {
  position: absolute;

  inset: 0;

  z-index: -3;

  background: var(--black);
}


/* ==================================================
   INNER LAYOUT
================================================== */

.sidebar-inner {
  position: relative;

  display: grid;

  grid-template-rows:
    auto
    auto
    auto
    minmax(0, 1fr)
    auto;

  height: 100%;

  padding:
      clamp(0.85rem, 1.6vh, 1.3rem)
      clamp(1rem, 1.15vw, 1.3rem)
      clamp(0.8rem, 1.3vh, 1rem)
      clamp(1rem, 1.15vw, 1.3rem);

  background: var(--black);

  border-top:
      1px solid rgba(75, 200, 255, 0.65);

  border-bottom:
      1px solid rgba(75, 200, 255, 0.65);

  border-left:
      1px solid rgba(159, 98, 255, 0.6);

  border-right:
      1px solid rgba(75, 200, 255, 0.35);

  box-shadow:
      inset 0 0 0 1px rgba(159, 98, 255, 0.06),
      inset 10px 0 24px rgba(106, 66, 255, 0.035),
      14px 0 36px rgba(0, 0, 0, 0.48);

  overflow: hidden;
}


/*
  TOP + BOTTOM INNER FRAME LINES
*/

.sidebar-inner::before,
.sidebar-inner::after {
  content: '';

  position: absolute;

  left: 0.65rem;
  right: 0.65rem;

  height: 1px;

  z-index: 5;

  pointer-events: none;
}


.sidebar-inner::before {
  top: 0.55rem;

  background:
      linear-gradient(
          90deg,
          var(--purple),
          rgba(159, 98, 255, 0.16) 32%,
          rgba(75, 200, 255, 0.15) 68%,
          var(--blue)
      );
}


.sidebar-inner::after {
  bottom: 0.55rem;

  background:
      linear-gradient(
          90deg,
          var(--purple),
          rgba(159, 98, 255, 0.14) 35%,
          rgba(75, 200, 255, 0.14) 65%,
          var(--blue)
      );
}


/* ==================================================
   BRAND
================================================== */

.sidebar-brand {
  display: flex;
  align-items: center;

  justify-content: center;

  gap: 0.85rem;

  padding:
      0.2rem
      0.15rem
      1rem;
}


.brand-emblem {
  position: relative;

  display: grid;
  place-items: center;

  width: 2.65rem;
  height: 2.65rem;

  flex-shrink: 0;

  color: var(--blue);

  background: var(--black);

  border:
      1px solid rgba(75, 200, 255, 0.7);

  transform: rotate(45deg);

  box-shadow:
      0 0 14px rgba(75, 200, 255, 0.12),
      inset 0 0 12px rgba(159, 98, 255, 0.09);
}


.brand-emblem::after {
  content: '';

  position: absolute;

  inset: 4px;

  border:
      1px solid rgba(159, 98, 255, 0.38);
}


.brand-emblem svg {
  transform: rotate(-45deg);
}


.brand-copy {
  min-width: 0;
}


.brand-name {
  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(1.05rem, 1.05vw, 1.2rem);

  font-weight: 600;

  line-height: 1;

  letter-spacing: 0.18em;

  color: var(--text-main);

  text-shadow:
      0 0 12px rgba(75, 200, 255, 0.2);
}


.brand-copy span {
  display: block;

  margin-top: 0.35rem;

  font-size: 0.52rem;

  letter-spacing: 0.14em;

  color: #8298b1;

  white-space: nowrap;
}


/* ==================================================
   HOME BUTTON
================================================== */

.home-button {
  position: relative;

  display: grid;

  grid-template-columns:
    2rem
    minmax(0, 1fr)
    auto;

  align-items: center;

  min-height: 2.55rem;

  margin-bottom: 0.7rem;

  padding:
      0
      0.8rem
      0
      0.45rem;

  overflow: hidden;

  color: var(--text-main);

  background: var(--black-soft);

  border:
      1px solid rgba(75, 200, 255, 0.55);

  cursor: pointer;

  transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
}


.home-button::before {
  content: '';

  position: absolute;

  left: 0;
  top: 0;
  bottom: 0;

  width: 2px;

  background: var(--purple);

  box-shadow:
      0 0 8px rgba(159, 98, 255, 0.65);
}


.home-button:hover {
  transform: translateX(0.12rem);

  border-color: var(--blue);

  box-shadow:
      inset 0 0 18px rgba(75, 200, 255, 0.08),
      0 0 18px rgba(75, 200, 255, 0.07);
}


.home-button__icon {
  display: grid;
  place-items: center;

  color: var(--blue);
}


.home-button__label {
  text-align: left;

  font-size: 0.76rem;

  letter-spacing: 0.03em;
}


.home-button__arrow {
  color: var(--purple-bright);
}


.button-trace {
  position: absolute;

  left: -25%;
  bottom: 0;

  width: 22%;
  height: 1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          var(--blue),
          transparent
      );

  animation:
      buttonTrace
      4.5s
      linear
      infinite;
}


@keyframes buttonTrace {

  to {
    left: 120%;
  }

}


/* ==================================================
   NAVIGATION
================================================== */

.sidebar-nav {
  display: flex;
  flex-direction: column;

  gap: 0.15rem;

  padding-bottom: 0.75rem;

  border-bottom:
      1px solid rgba(75, 200, 255, 0.12);
}


.nav-item {
  position: relative;

  display: grid;

  grid-template-columns:
    2rem
    minmax(0, 1fr)
    auto;

  align-items: center;

  min-height:
      clamp(
          2.05rem,
          4.3vh,
          2.5rem
      );

  padding:
      0
      0.75rem
      0
      0.4rem;

  color: #aebfd0;

  text-decoration: none;

  border:
      1px solid transparent;

  background: transparent;

  clip-path:
      polygon(
          0 0,
          calc(100% - 0.65rem) 0,
          100% 50%,
          calc(100% - 0.65rem) 100%,
          0 100%
      );

  transition:
      color 180ms ease,
      background 180ms ease,
      border-color 180ms ease,
      transform 180ms ease;
}


.nav-item:hover {
  color: #ffffff;

  background:
      linear-gradient(
          90deg,
          rgba(159, 98, 255, 0.07),
          rgba(75, 200, 255, 0.07)
      );

  transform: translateX(0.12rem);
}


.nav-item.active {
  color: #ffffff;

  background:
      linear-gradient(
          90deg,
          rgba(159, 98, 255, 0.12),
          rgba(75, 200, 255, 0.1)
      );

  border-color:
      rgba(75, 200, 255, 0.48);

  box-shadow:
      inset 0 0 15px rgba(75, 200, 255, 0.035);
}


.nav-icon {
  display: grid;
  place-items: center;

  color: #7864c9;

  transition:
      color 180ms ease,
      filter 180ms ease;
}


.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  color: var(--blue);

  filter:
      drop-shadow(
          0 0 5px
          rgba(75, 200, 255, 0.38)
      );
}


.nav-label {
  font-size:
      clamp(
          0.7rem,
          0.7vw,
          0.8rem
      );

  letter-spacing: 0.015em;
}


.mobile-label {
  display: none;
}


.nav-arrow {
  color: var(--purple-bright);
}


.nav-tracer {
  position: absolute;

  left: 0;
  bottom: 0;

  width: 0;
  height: 1px;

  background:
      linear-gradient(
          90deg,
          var(--purple),
          var(--blue),
          transparent
      );

  box-shadow:
      0 0 7px rgba(75, 200, 255, 0.4);

  transition:
      width 240ms ease;
}


.nav-item:hover .nav-tracer,
.nav-item.active .nav-tracer {
  width: 100%;
}


/* ==================================================
   SCROLL AREA
================================================== */

.sidebar-scroll {
  min-height: 0;

  overflow-y: auto;
  overflow-x: hidden;

  padding:
      clamp(0.55rem, 1vh, 0.8rem)
      0.15rem
      clamp(0.7rem, 1.3vh, 1rem)
      0;

  scrollbar-width: thin;

  scrollbar-color:
      rgba(75, 200, 255, 0.28)
      transparent;
}


.sidebar-scroll::-webkit-scrollbar {
  width: 3px;
}


.sidebar-scroll::-webkit-scrollbar-thumb {
  background:
      linear-gradient(
          180deg,
          var(--purple),
          var(--blue)
      );

  border-radius: 999px;
}


/* ==================================================
   SECTIONS
================================================== */

.sidebar-section {
  padding:
      clamp(0.32rem, 0.65vh, 0.55rem)
      0
      clamp(0.15rem, 0.3vh, 0.25rem);
}


.section-heading {
  display: grid;

  grid-template-columns:
    auto
    auto
    1fr;

  align-items: center;

  gap: 0.45rem;

  margin-bottom:
      clamp(0.35rem, 0.7vh, 0.55rem);
}


.heading-node {
  width: 0.32rem;
  height: 0.32rem;

  border-radius: 50%;

  background: var(--blue);

  box-shadow:
      0 0 7px rgba(75, 200, 255, 0.75);
}


.heading-node.purple {
  background: var(--purple);

  box-shadow:
      0 0 7px rgba(159, 98, 255, 0.75);
}


.section-heading > span:nth-child(2) {
  font-size: 0.56rem;

  text-transform: uppercase;

  letter-spacing: 0.1em;

  color: #8198b2;
}


.heading-line {
  height: 1px;

  background:
      linear-gradient(
          90deg,
          rgba(75, 200, 255, 0.4),
          transparent
      );
}


.heading-line.purple {
  background:
      linear-gradient(
          90deg,
          rgba(159, 98, 255, 0.5),
          transparent
      );
}


/* ==================================================
   SESSION CARD
================================================== */

.session-card {
  position: relative;

  width: 100%;

  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 0.65rem;

  padding:
      clamp(0.5rem, 0.85vh, 0.68rem)
      0.65rem;

  text-align: left;

  color: inherit;

  background: var(--black-soft);

  border:
      1px solid rgba(75, 200, 255, 0.26);

  cursor: pointer;

  transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
}


.session-card::after {
  content: '';

  position: absolute;

  top: -1px;
  right: -1px;

  width: 1rem;
  height: 1rem;

  border-top:
      1px solid var(--purple);

  border-right:
      1px solid var(--purple);
}


.session-card:hover {
  transform: translateX(0.12rem);

  border-color:
      rgba(75, 200, 255, 0.54);

  box-shadow:
      inset 0 0 16px rgba(75, 200, 255, 0.04);
}


.session-icon {
  display: grid;
  place-items: center;

  width: 2.15rem;
  height: 2.15rem;

  color: var(--purple-bright);

  border:
      1px solid rgba(159, 98, 255, 0.46);

  border-radius: 50%;

  box-shadow:
      inset 0 0 8px rgba(159, 98, 255, 0.06);
}


.session-info {
  min-width: 0;
}


.session-info strong,
.session-info span {
  display: block;
}


.session-info strong {
  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  font-size: 0.71rem;

  font-weight: 500;

  color: #ebf5ff;
}


.session-info span {
  margin-top: 0.2rem;

  font-size: 0.57rem;

  color: #7288a2;
}


.session-status {
  display: flex;
  align-items: center;

  gap: 0.28rem;

  font-size: 0.52rem;

  color: var(--blue);

  white-space: nowrap;
}


.status-dot {
  width: 0.4rem;
  height: 0.4rem;

  flex-shrink: 0;

  border-radius: 50%;

  background: var(--blue);

  box-shadow:
      0 0 8px rgba(75, 200, 255, 0.85);
}


/* ==================================================
   EMPTY
================================================== */

.section-empty {
  display: flex;
  align-items: center;

  gap: 0.7rem;

  padding: 0.7rem;

  color: #69819b;

  background: var(--black-soft);

  border:
      1px dashed rgba(75, 200, 255, 0.2);
}


.section-empty.compact {
  padding: 0.55rem;
}


.section-empty strong,
.section-empty span {
  display: block;
}


.section-empty strong {
  font-size: 0.65rem;

  font-weight: 500;

  color: #93abc2;
}


.section-empty span {
  margin-top: 0.17rem;

  font-size: 0.51rem;

  color: #5c7189;
}


/* ==================================================
   MEMBER LIST
================================================== */

.member-list {
  position: relative;

  display: flex;
  flex-direction: column;

  gap: 0.08rem;
}


.member-list::before {
  content: '';

  position: absolute;

  left: 0.35rem;

  top: 1.15rem;
  bottom: 1.15rem;

  width: 1px;

  background:
      linear-gradient(
          180deg,
          transparent,
          var(--purple),
          var(--blue),
          transparent
      );

  opacity: 0.65;
}


.member-row {
  position: relative;

  display: grid;

  grid-template-columns:
    1rem
    2rem
    minmax(0, 1fr);

  align-items: center;

  gap: 0.45rem;

  min-height:
      clamp(
          2.15rem,
          4.7vh,
          2.75rem
      );

  padding:
      0.14rem
      0.4rem
      0.14rem
      0;

  border-bottom:
      1px solid rgba(75, 200, 255, 0.055);
}


.member-node {
  position: relative;

  z-index: 2;

  width: 0.43rem;
  height: 0.43rem;

  justify-self: center;

  border-radius: 50%;

  background: var(--member-accent);

  box-shadow:
      0 0 9px var(--member-accent);
}


.member-avatar {
  position: relative;

  display: grid;
  place-items: center;

  width: 1.85rem;
  height: 1.85rem;

  color: var(--member-accent);

  background: var(--black);

  border:
      1px solid
      color-mix(
          in srgb,
          var(--member-accent) 55%,
          transparent
      );
}


.avatar-corner {
  position: absolute;

  width: 0.35rem;
  height: 0.35rem;
}


.corner-one {
  top: -1px;
  left: -1px;

  border-top:
      1px solid var(--member-accent);

  border-left:
      1px solid var(--member-accent);
}


.corner-two {
  right: -1px;
  bottom: -1px;

  border-right:
      1px solid var(--member-accent);

  border-bottom:
      1px solid var(--member-accent);
}


.member-info {
  min-width: 0;
}


.member-info strong,
.member-info span {
  display: block;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;
}


.member-info strong {
  font-size: 0.68rem;

  font-weight: 500;

  color: #dfeaf7;
}


.member-info span {
  margin-top: 0.13rem;

  font-size: 0.55rem;

  color: var(--member-accent);
}


/* ==================================================
   MEDIATOR
================================================== */

.mediator-card {
  display: flex;
  align-items: center;

  gap: 0.75rem;

  padding:
      clamp(0.52rem, 0.9vh, 0.7rem);

  background: var(--black-soft);

  border:
      1px solid rgba(159, 98, 255, 0.32);

  box-shadow:
      inset 0 0 14px rgba(159, 98, 255, 0.035);
}


.mediator-emblem {
  display: grid;
  place-items: center;

  width: 2.3rem;
  height: 2.3rem;

  flex-shrink: 0;

  color: var(--purple-bright);

  border:
      1px solid rgba(159, 98, 255, 0.52);

  transform: rotate(45deg);
}


.mediator-emblem svg {
  transform: rotate(-45deg);
}


.mediator-info {
  min-width: 0;
}


.mediator-info strong,
.mediator-info span {
  display: block;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;
}


.mediator-info strong {
  font-size: 0.72rem;

  font-weight: 500;

  color: #efe8ff;
}


.mediator-info span {
  margin-top: 0.17rem;

  font-size: 0.56rem;

  color: var(--blue);
}


/* ==================================================
   SESSION CONTROLS
================================================== */

.session-controls {
  margin-top: 0.65rem;
}


.end-session-button {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 0.45rem;

  min-height: 2.3rem;

  color: #aab9cd;

  background: var(--black-soft);

  border:
      1px solid rgba(159, 98, 255, 0.28);

  cursor: pointer;

  transition:
      color 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
}


.end-session-button:hover {
  color: var(--purple-bright);

  border-color:
      rgba(159, 98, 255, 0.62);

  box-shadow:
      inset 0 0 14px rgba(159, 98, 255, 0.06);
}


.session-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 0.5rem;

  padding:
      0.55rem
      0.15rem
      0.4rem;
}


.session-live {
  display: flex;
  align-items: center;

  gap: 0.35rem;

  color: var(--blue);

  font-size: 0.53rem;
}


.round-state {
  font-size: 0.52rem;

  color: #75869b;
}


.round-progress {
  height: 2px;

  overflow: hidden;

  background:
      rgba(75, 200, 255, 0.1);
}


.round-progress span {
  display: block;

  height: 100%;

  background:
      linear-gradient(
          90deg,
          var(--purple),
          var(--blue)
      );

  box-shadow:
      0 0 8px rgba(75, 200, 255, 0.55);

  transition:
      width 300ms ease;
}


/* ==================================================
   FOOTER
================================================== */

.sidebar-footer {
  display: grid;

  gap: 0.6rem;

  padding-top: 0.55rem;

  border-top:
      1px solid rgba(75, 200, 255, 0.12);
}


/* ==================================================
   MODE PANEL
================================================== */

.mode-panel {
  padding:
      0.65rem
      0.8rem
      0.75rem;

  background: var(--black-soft);

  border:
      1px solid rgba(75, 200, 255, 0.28);

  box-shadow:
      inset 0 0 16px rgba(159, 98, 255, 0.025);
}


.mode-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 0.5rem;

  margin-bottom: 0.9rem;
}


.mode-heading > span:first-child {
  font-size: 0.53rem;

  text-transform: uppercase;

  letter-spacing: 0.1em;

  color: #72869f;
}


.mode-value {
  font-size: 0.56rem;

  transition:
      color 180ms ease,
      text-shadow 180ms ease;
}


.mode-value.anime {
  color: var(--purple-bright);

  text-shadow:
      0 0 8px rgba(159, 98, 255, 0.35);
}


.mode-value.professional {
  color: var(--blue-bright);

  text-shadow:
      0 0 8px rgba(75, 200, 255, 0.35);
}


/* ==================================================
   ACTUAL SLIDER GEOMETRY
================================================== */

.mode-switch {
  position: relative;

  height: 2.65rem;

  margin:
      0
      1.1rem;
}


.mode-track {
  position: absolute;

  top: 50%;

  left: 0;
  right: 0;

  height: 2px;

  transform:
      translateY(-50%);

  background:
      rgba(112, 128, 160, 0.22);
}


.mode-track-active {
  position: absolute;

  top: 50%;

  height: 2px;

  transform:
      translateY(-50%);

  transition:
      left 260ms ease,
      right 260ms ease,
      background 220ms ease,
      box-shadow 220ms ease;
}


.mode-track-active.anime {
  background:
      linear-gradient(
          90deg,
          var(--purple),
          #b77fff
      );

  box-shadow:
      0 0 9px rgba(159, 98, 255, 0.75);
}


.mode-track-active.professional {
  background:
      linear-gradient(
          90deg,
          #579fff,
          var(--blue)
      );

  box-shadow:
      0 0 9px rgba(75, 200, 255, 0.75);
}


/*
  Glowing selected endpoint. The SVG button sits above
  this halo so the selected presentation mode feels
  powered on rather than just text-selected.
*/

.mode-indicator {
  position: absolute;

  top: 50%;

  z-index: 2;

  width: 2.35rem;
  height: 2.35rem;

  border-radius: 50%;

  pointer-events: none;

  transition:
      left 260ms ease,
      background 220ms ease,
      border-color 220ms ease,
      box-shadow 220ms ease;
}


.mode-indicator.anime {
  background:
      radial-gradient(
          circle,
          rgba(159, 98, 255, 0.2),
          rgba(159, 98, 255, 0.04) 58%,
          transparent 72%
      );

  border:
      1px solid rgba(198, 154, 255, 0.62);

  box-shadow:
      0 0 8px rgba(159, 98, 255, 0.7),
      0 0 18px rgba(159, 98, 255, 0.28),
      inset 0 0 12px rgba(159, 98, 255, 0.14);
}


.mode-indicator.professional {
  background:
      radial-gradient(
          circle,
          rgba(75, 200, 255, 0.2),
          rgba(75, 200, 255, 0.04) 58%,
          transparent 72%
      );

  border:
      1px solid rgba(141, 228, 255, 0.62);

  box-shadow:
      0 0 8px rgba(75, 200, 255, 0.7),
      0 0 18px rgba(75, 200, 255, 0.28),
      inset 0 0 12px rgba(75, 200, 255, 0.14);
}


.mode-node {
  position: absolute;

  top: 50%;

  z-index: 4;

  display: grid;
  place-items: center;

  width: 2.2rem;
  height: 2.2rem;

  padding: 0;

  color: #718299;

  background:
      linear-gradient(
          145deg,
          rgba(7, 9, 22, 0.98),
          rgba(1, 1, 4, 0.98)
      );

  border:
      1px solid rgba(112, 128, 160, 0.45);

  border-radius: 50%;

  cursor: pointer;

  box-shadow:
      inset 0 0 10px rgba(112, 128, 160, 0.04);

  transition:
      color 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease,
      transform 180ms ease;
}


.mode-node--left {
  left: 0;

  transform:
      translate(-50%, -50%);
}


.mode-node--right {
  right: 0;

  transform:
      translate(50%, -50%);
}


.mode-node:hover {
  color: #dfeeff;
}


.mode-node--left:hover {
  transform:
      translate(-50%, -50%)
      scale(1.06);
}


.mode-node--right:hover {
  transform:
      translate(50%, -50%)
      scale(1.06);
}


.mode-node__svg {
  width: 1.25rem;
  height: 1.25rem;

  fill: none;

  stroke: currentColor;

  stroke-width: 1.55;
  stroke-linecap: round;
  stroke-linejoin: round;

  transition:
      filter 180ms ease;
}


.mode-node--left.active {
  color: var(--purple-bright);

  border-color:
      rgba(198, 154, 255, 0.8);

  box-shadow:
      inset 0 0 12px rgba(159, 98, 255, 0.12),
      0 0 12px rgba(159, 98, 255, 0.28);
}


.mode-node--right.active {
  color: var(--blue-bright);

  border-color:
      rgba(141, 228, 255, 0.8);

  box-shadow:
      inset 0 0 12px rgba(75, 200, 255, 0.12),
      0 0 12px rgba(75, 200, 255, 0.28);
}


.mode-node.active
.mode-node__svg {
  filter:
      drop-shadow(
          0 0 4px
          currentColor
      );
}


/* ==================================================
   SETTINGS
================================================== */

.settings-button {
  position: relative;

  width: 100%;

  min-height: 2.55rem;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 0.55rem;

  overflow: hidden;

  color: #a8c9e4;

  background: var(--black-soft);

  border:
      1px solid rgba(75, 200, 255, 0.42);

  clip-path:
      polygon(
          0.45rem 0,
          calc(100% - 0.45rem) 0,
          100% 0.45rem,
          100% calc(100% - 0.45rem),
          calc(100% - 0.45rem) 100%,
          0.45rem 100%,
          0 calc(100% - 0.45rem),
          0 0.45rem
      );

  cursor: pointer;

  transition:
      color 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
}


.settings-button::before {
  content: '';

  position: absolute;

  left: 0;
  top: 25%;
  bottom: 25%;

  width: 2px;

  background: var(--purple);

  box-shadow:
      0 0 7px rgba(159, 98, 255, 0.6);
}


.settings-button:hover,
.settings-button.active {
  color: #ffffff;

  border-color: var(--blue);

  box-shadow:
      inset 0 0 20px rgba(75, 200, 255, 0.08),
      0 0 16px rgba(75, 200, 255, 0.08);
}


.logout-button {
  color: #d5a8c5;

  border-color:
      rgba(255, 104, 165, 0.34);
}


.logout-button::before {
  background: #ff68a5;

  box-shadow:
      0 0 7px rgba(255, 104, 165, 0.58);
}


.logout-button:hover {
  color: #fff1f7;

  border-color:
      rgba(255, 104, 165, 0.72);

  box-shadow:
      inset 0 0 20px rgba(255, 104, 165, 0.07),
      0 0 16px rgba(255, 104, 165, 0.07);
}


.settings-button:disabled {
  opacity: 0.55;

  cursor: wait;

  pointer-events: none;
}


.settings-sweep {
  position: absolute;

  top: 0;
  bottom: 0;

  width: 30%;

  left: -45%;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(75, 200, 255, 0.14),
          transparent
      );

  transform: skewX(-25deg);

  animation:
      settingsSweep
      4.5s
      ease-in-out
      infinite;
}


@keyframes settingsSweep {

  0%,
  55% {
    left: -45%;
  }

  88%,
  100% {
    left: 125%;
  }

}


/* ==================================================
   OVERLAP FRAME
================================================== */

.sidebar-overlap {
  position: absolute;

  top: 0;
  right: -3.2rem;

  width: 3.45rem;
  height: 100%;

  pointer-events: none;

  overflow: visible;

  filter:
      drop-shadow(
          8px 0 16px
          rgba(0, 0, 0, 0.48)
      );
}


/*
  IMPORTANT:

  This is now the exact same black
  as the sidebar.

  No separate navy section.
  No bleed.
*/

.overlap-fill {
  fill: var(--black);
}


.overlap-purple {
  fill: none;

  stroke:
      rgba(159, 98, 255, 0.72);

  stroke-width: 1.4;

  vector-effect:
      non-scaling-stroke;

  filter:
      drop-shadow(
          0 0 3px
          rgba(159, 98, 255, 0.32)
      );
}


.overlap-neon {
  fill: none;

  stroke:
      rgba(75, 200, 255, 0.8);

  stroke-width: 1.25;

  vector-effect:
      non-scaling-stroke;

  filter:
      drop-shadow(
          0 0 4px
          rgba(75, 200, 255, 0.45)
      );
}


.overlap-tracer {
  fill: none;

  stroke: #aeeeff;

  stroke-width: 2;

  stroke-linecap: round;

  stroke-dasharray:
      72
      1200;

  vector-effect:
      non-scaling-stroke;

  filter:
      drop-shadow(
          0 0 6px
          rgba(75, 200, 255, 1)
      );

  animation:
      overlapTrace
      7s
      linear
      infinite;
}


@keyframes overlapTrace {

  to {
    stroke-dashoffset: -1270;
  }

}


/* ==================================================
   DESKTOP WIDTH RESPONSIVENESS
================================================== */

@media (max-width: 1200px) and (min-width: 721px) {

  .session-status span:last-child {
    display: none;
  }


  .sidebar-overlap {
    right: -2.8rem;

    width: 3rem;
  }

}


/* ==================================================
   SHORTER DESKTOPS
================================================== */

@media (max-height: 900px) and (min-width: 721px) {

  .sidebar-inner {
    padding-top: 0.8rem;
    padding-bottom: 0.7rem;
  }


  .sidebar-brand {
    padding-bottom: 0.75rem;
  }


  .brand-emblem {
    width: 2.35rem;
    height: 2.35rem;
  }


  .home-button {
    min-height: 2.2rem;

    margin-bottom: 0.5rem;
  }


  .sidebar-nav {
    padding-bottom: 0.55rem;
  }


  .nav-item {
    min-height: 2.05rem;
  }


  .sidebar-scroll {
    padding-top: 0.4rem;
  }


  .member-row {
    min-height: 2.15rem;
  }


  .sidebar-footer {
    gap: 0.45rem;
  }


  .mode-panel {
    padding-top: 0.5rem;
    padding-bottom: 0.6rem;
  }


  .mode-heading {
    margin-bottom: 0.75rem;
  }


  .settings-button {
    min-height: 2.25rem;
  }

}


/* ==================================================
   SHORT LAPTOP
================================================== */

@media (max-height: 760px) and (min-width: 721px) {

  .sidebar-inner {
    padding-top: 0.55rem;
    padding-bottom: 0.5rem;
  }


  .sidebar-brand {
    padding-bottom: 0.5rem;
  }


  .brand-emblem {
    width: 2rem;
    height: 2rem;
  }


  .brand-name {
    font-size: 0.92rem;
  }


  .brand-copy span {
    font-size: 0.46rem;
  }


  .home-button {
    min-height: 1.9rem;

    margin-bottom: 0.35rem;
  }


  .sidebar-nav {
    padding-bottom: 0.35rem;
  }


  .nav-item {
    min-height: 1.82rem;
  }


  .sidebar-scroll {
    padding-top: 0.25rem;
    padding-bottom: 0.3rem;
  }


  .sidebar-section {
    padding-top: 0.22rem;
  }


  .section-heading {
    margin-bottom: 0.28rem;
  }


  .member-row {
    min-height: 1.95rem;
  }


  .member-avatar {
    width: 1.6rem;
    height: 1.6rem;
  }


  .mediator-emblem {
    width: 1.9rem;
    height: 1.9rem;
  }


  .session-controls {
    margin-top: 0.35rem;
  }


  .sidebar-footer {
    padding-top: 0.35rem;

    gap: 0.35rem;
  }


  .mode-panel {
    padding:
        0.4rem
        0.7rem
        0.5rem;
  }


  .mode-heading {
    margin-bottom: 0.62rem;
  }


  .mode-switch {
    height: 2rem;
  }


  .settings-button {
    min-height: 2rem;
  }

}


/* ==================================================
   VERY SHORT LANDSCAPE
================================================== */

@media (max-height: 650px) and (min-width: 721px) {

  .brand-copy span {
    display: none;
  }


  .sidebar-brand {
    padding-bottom: 0.35rem;
  }


  .brand-emblem {
    width: 1.8rem;
    height: 1.8rem;
  }


  .home-button {
    min-height: 1.7rem;

    margin-bottom: 0.25rem;
  }


  .nav-item {
    min-height: 1.6rem;
  }


  .member-row {
    min-height: 1.8rem;
  }


  .mode-panel {
    padding-top: 0.32rem;
    padding-bottom: 0.4rem;
  }


  .mode-heading {
    margin-bottom: 0.52rem;
  }


  .settings-button {
    min-height: 1.8rem;
  }

}


/* ==================================================
   MOBILE
================================================== */

@media (max-width: 720px) {

  .council-sidebar {
    width: 100%;
    height: 100%;

    min-width: 0;
    min-height: 0;

    max-width: 100%;
    max-height: 100%;
  }


  /*
    MOBILE STRUCTURE

    ROW 1:
    NAVIGATION

    ROW 2:
    HOME | EDIT PANEL | LOG OUT
  */

  .sidebar-inner {
    display: grid;

    grid-template-areas:
      "nav nav nav"
      "home footer footer";

    grid-template-columns:
      auto
      minmax(0, 1fr)
      auto;

    grid-template-rows:
      minmax(4.1rem, 1fr)
      3.75rem;

    gap:
        0.35rem
        0.4rem;

    width: 100%;
    height: 100%;

    padding:
        0.5rem
        max(
            0.55rem,
            env(safe-area-inset-right)
        )
        max(
            0.55rem,
            env(safe-area-inset-bottom)
        )
        max(
            0.55rem,
            env(safe-area-inset-left)
        );

    background: var(--black);

    border:
        1px solid rgba(75, 200, 255, 0.62);

    border-bottom:
        1px solid rgba(159, 98, 255, 0.7);

    overflow: hidden;
  }


  .sidebar-inner::before {
    top: 0.32rem;

    left: 1rem;
    right: 1rem;
  }


  .sidebar-inner::after {
    bottom:
        calc(
            0.25rem +
            env(safe-area-inset-bottom)
        );

    left: 1rem;
    right: 1rem;
  }


  .sidebar-brand,
  .sidebar-scroll,
  .sidebar-overlap {
    display: none;
  }


  /* ==================================================
     MOBILE NAV
  ================================================== */

  .sidebar-nav {
    grid-area: nav;

    display: grid;

    grid-template-columns:
      repeat(6, minmax(0, 1fr));

    gap: 0.2rem;

    min-width: 0;

    padding: 0;

    border: 0;

    overflow: visible;
  }


  .nav-item {
    display: flex;

    flex-direction: column;

    align-items: center;
    justify-content: center;

    gap: 0.3rem;

    min-width: 0;
    min-height: 100%;

    padding:
        0.4rem
        0.15rem;

    border:
        1px solid transparent;

    clip-path:
        polygon(
            0.35rem 0,
            calc(100% - 0.35rem) 0,
            100% 0.35rem,
            100% calc(100% - 0.35rem),
            calc(100% - 0.35rem) 100%,
            0.35rem 100%,
            0 calc(100% - 0.35rem),
            0 0.35rem
        );
  }


  .nav-item:hover {
    transform: none;
  }


  .nav-item.active {
    background:
        linear-gradient(
            180deg,
            rgba(159, 98, 255, 0.12),
            rgba(75, 200, 255, 0.1)
        );

    border-color:
        rgba(75, 200, 255, 0.46);
  }


  .nav-icon svg {
    width:
        clamp(
            1.05rem,
            4.6vw,
            1.3rem
        );

    height:
        clamp(
            1.05rem,
            4.6vw,
            1.3rem
        );
  }


  .desktop-label {
    display: none;
  }


  .mobile-label {
    display: block;

    width: 100%;

    overflow: hidden;

    text-align: center;

    text-overflow: ellipsis;
    white-space: nowrap;

    font-size:
        clamp(
            0.45rem,
            1.65vw,
            0.58rem
        );

    line-height: 1;
  }


  .nav-arrow {
    display: none;
  }


  .nav-tracer {
    left: 12%;

    width: 76%;

    opacity: 0;
  }


  .nav-item.active .nav-tracer {
    width: 76%;

    opacity: 1;
  }


  /* ==================================================
     MOBILE HOME
  ================================================== */

  .home-button {
    grid-area: home;

    display: grid;

    grid-template-columns: 1fr;

    place-items: center;

    align-self: stretch;

    width: 3.8rem;
    min-height: 100%;

    margin: 0;

    padding: 0.25rem;

    gap: 0.18rem;
  }


  .home-button__icon {
    align-self: end;
  }


  .home-button__label {
    align-self: start;

    font-size: 0.52rem;

    text-align: center;
  }


  .home-button__arrow {
    display: none;
  }


  /* ==================================================
     MOBILE FOOTER
  ================================================== */

  .sidebar-footer {
    grid-area: footer;

    display: grid;

    grid-template-columns:
      repeat(2, minmax(0, 1fr));

    align-items: stretch;

    gap: 0.4rem;

    padding: 0;

    border: 0;
  }


  .mode-panel {
    display: grid;

    grid-template-columns:
      auto
      minmax(8rem, 1fr);

    align-items: center;

    gap: 0.85rem;

    min-width: 0;

    padding:
        0.4rem
        1.1rem;

    border-color:
        rgba(159, 98, 255, 0.34);
  }


  .mode-heading {
    display: block;

    margin: 0;
  }


  .mode-heading > span:first-child {
    display: block;

    font-size: 0.43rem;
  }


  .mode-value {
    display: block;

    margin-top: 0.25rem;

    font-size: 0.53rem;
  }


  .mode-switch {
    width: 100%;
    height: 2.15rem;

    margin: 0;
  }


  .mode-node__label {
    font-size: 0.5rem;
  }


  .settings-button {
    width: 100%;
    min-width: 0;
    min-height: 100%;

    flex-direction: column;

    gap: 0.2rem;

    padding: 0.2rem;
  }


  .settings-text {
    font-size: 0.5rem;
  }

}


/* ==================================================
   SMALL MOBILE
================================================== */

@media (max-width: 480px) {

  .sidebar-inner {
    grid-template-rows:
      minmax(3.8rem, 1fr)
      3.55rem;

    gap: 0.25rem;
  }


  .sidebar-nav {
    gap: 0.1rem;
  }


  .nav-item {
    padding-left: 0.08rem;
    padding-right: 0.08rem;
  }


  .mobile-label {
    font-size: 0.43rem;
  }


  .home-button {
    width: 3.35rem;
  }


  .sidebar-footer {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));

    gap: 0.25rem;
  }


  .mode-panel {
    grid-template-columns:
      auto
      minmax(6.5rem, 1fr);

    gap: 0.55rem;

    padding:
        0.35rem
        0.8rem;
  }


  .mode-heading > span:first-child {
    display: none;
  }


  .mode-value {
    margin: 0;

    font-size: 0.48rem;
  }


  .mode-node__label {
    font-size: 0.45rem;
  }


  .settings-button {
    width: 100%;
    min-width: 0;
  }


  .settings-text {
    font-size: 0.45rem;
  }

}


/* ==================================================
   EXTRA SMALL MOBILE
================================================== */

@media (max-width: 370px) {

  .mobile-label {
    display: none;
  }


  .sidebar-nav {
    align-items: stretch;
  }


  .nav-item {
    justify-content: center;
  }


  .nav-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }


  .mode-panel {
    gap: 0.4rem;

    padding-left: 0.65rem;
    padding-right: 0.65rem;
  }


  .mode-value {
    max-width: 3.5rem;

    overflow: hidden;

    text-overflow: ellipsis;
  }

}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {

  .settings-sweep,
  .overlap-tracer,
  .button-trace {
    animation: none;
  }


  .nav-item,
  .home-button,
  .session-card,
  .end-session-button,
  .round-progress span,
  .settings-button,
  .mode-node,
  .mode-indicator,
  .mode-track-active {
    transition: none;
  }

}
</style>
