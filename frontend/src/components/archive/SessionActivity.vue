<script setup>
import {
  computed
} from 'vue'


import {
  Activity,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Gauge,
  PauseCircle,
  PlayCircle,
  Radio,
  ShieldAlert,
  Sparkles,
  UsersRound
} from 'lucide-vue-next'


/* ==================================================
   PROPS
================================================== */

const props =
    defineProps({

      sessions: {
        type: Array,
        default: () => []
      },


      selectedId: {
        type: [
          String,
          Number
        ],
        default: null
      }
    })


/* ==================================================
   EMITS
================================================== */

const emit =
    defineEmits([
      'select'
    ])


/* ==================================================
   SAFE ARRAY
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


/* ==================================================
   NUMBER NORMALIZATION
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


/* ==================================================
   SESSION TIMESTAMP
================================================== */

function sessionTimestamp(
    session
) {

  const value =

      session?.updatedAt

      ??

      session?.createdAt

      ??

      0


  const timestamp =
      new Date(
          value
      )
          .getTime()


  return Number.isFinite(
      timestamp
  )
      ? timestamp
      : 0
}


/* ==================================================
   RECENT SESSION LIST

   Keeps the newest archive activity first.

   Increase the slice limit if you want more visible
   activity history in this rail.
================================================== */

const recentSessions =
    computed(() =>

        [
          ...props.sessions
        ]

            .sort(

                (
                    first,
                    second
                ) =>

                    sessionTimestamp(
                        second
                    )

                    -

                    sessionTimestamp(
                        first
                    )
            )

            .slice(
                0,
                12
            )
    )


/* ==================================================
   COUNTS
================================================== */

const activeCount =
    computed(() =>

        recentSessions.value.filter(
            session =>

                session?.status ===
                'active'
        )
            .length
    )


const completedCount =
    computed(() =>

        recentSessions.value.filter(
            session =>

                session?.status ===
                'completed'
        )
            .length
    )


/* ==================================================
   TITLE
================================================== */

function titleOf(
    session
) {

  return (

      session?.title

      ??

      session
          ?.calibration
          ?.topic

      ??

      'Untitled Session'
  )
}


/* ==================================================
   MODE
================================================== */

function modeOf(
    session
) {

  return (

      session?.mode

      ??

      session
          ?.calibration
          ?.councilMode

      ??

      'panel'
  )
}


/* ==================================================
   STATUS
================================================== */

function statusOf(
    session
) {

  return (
      session?.status
      ??
      'ready'
  )
}


/* ==================================================
   STATUS LABEL
================================================== */

function statusLabel(
    session
) {

  const status =
      statusOf(
          session
      )


  if (
      status ===
      'active'
  ) {

    return 'In Discussion'
  }


  if (
      status ===
      'completed'
  ) {

    return 'Completed'
  }


  if (
      status ===
      'paused'
  ) {

    return 'Paused'
  }


  if (
      status ===
      'abandoned'
  ) {

    return 'Abandoned'
  }


  return 'Ready'
}


/* ==================================================
   CURRENT ROUND
================================================== */

function roundOf(
    session
) {

  const round =
      Number(
          session?.currentRound
          ??
          0
      )


  return Number.isFinite(
      round
  )
      ? round
      : 0
}


/* ==================================================
   CONFIDENCE
================================================== */

function confidenceOf(
    session
) {

  return (

      numberOrNull(
          session?.confidenceInDebate
      )

      ??

      numberOrNull(
          session?.confidenceScore
      )

      ??

      null
  )
}


/* ==================================================
   CONFIDENCE LABEL
================================================== */

function confidenceLabel(
    session
) {

  const value =
      confidenceOf(
          session
      )


  if (
      value === null
  ) {

    return '—'
  }


  return `${Math.round(
      value * 10
  ) / 10}%`
}


/* ==================================================
   RISK COUNT
================================================== */

function riskCountOf(
    session
) {

  const count =
      numberOrNull(
          session?.riskCount
      )


  if (
      count !==
      null
  ) {

    return count
  }


  return asArray(
      session?.risks
  )
      .length
}


/* ==================================================
   MEMBER COUNT
================================================== */

function memberCountOf(
    session
) {

  const count =
      numberOrNull(
          session?.memberCount
      )


  if (
      count !==
      null
  ) {

    return count
  }


  return (

      asArray(
          session?.discussionMembers
      )
          .length

      ||

      asArray(
          session?.members
      )
          .length

      ||

      asArray(
          session?.panelMembers
      )
          .length
  )
}


/* ==================================================
   TIME LABEL

   Today:
       21:45

   Older:
       Jul 07
================================================== */

function timeOf(
    session
) {

  const value =

      session?.updatedAt

      ??

      session?.createdAt


  if (
      !value
  ) {

    return '—'
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

    return '—'
  }


  const now =
      new Date()


  const sameDay =

      date.getFullYear() ===
      now.getFullYear()

      &&

      date.getMonth() ===
      now.getMonth()

      &&

      date.getDate() ===
      now.getDate()


  if (
      sameDay
  ) {

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


  return date.toLocaleDateString(

      [],

      {
        month:
            'short',

        day:
            '2-digit'
      }
  )
}


/* ==================================================
   SESSION AGE LABEL
================================================== */

function ageLabel(
    session
) {

  const timestamp =
      sessionTimestamp(
          session
      )


  if (
      !timestamp
  ) {

    return 'Unknown'
  }


  const difference =
      Date.now()
      -
      timestamp


  const minutes =
      Math.floor(
          difference / 60000
      )


  if (
      minutes <
      1
  ) {

    return 'Just now'
  }


  if (
      minutes <
      60
  ) {

    return `${minutes}m ago`
  }


  const hours =
      Math.floor(
          minutes / 60
      )


  if (
      hours <
      24
  ) {

    return `${hours}h ago`
  }


  const days =
      Math.floor(
          hours / 24
      )


  if (
      days <
      7
  ) {

    return `${days}d ago`
  }


  return timeOf(
      session
  )
}


/* ==================================================
   STATUS ICON
================================================== */

function statusIcon(
    session
) {

  const status =
      statusOf(
          session
      )


  if (
      status ===
      'active'
  ) {

    return PlayCircle
  }


  if (
      status ===
      'completed'
  ) {

    return CheckCircle2
  }


  if (
      status ===
      'paused'
  ) {

    return PauseCircle
  }


  return CircleDot
}


/* ==================================================
   SELECT SESSION
================================================== */

function selectSession(
    session
) {

  if (
      !session?.id
  ) {

    return
  }


  emit(
      'select',
      session.id
  )
}
</script>


<template>
  <aside class="activity">

    <!-- ==================================================
         DECORATIVE LAYERS
    ================================================== -->

    <div class="rail-glow" />

    <div class="rail-line rail-line-top" />
    <div class="rail-line rail-line-bottom" />


    <!-- ==================================================
         HEADER
    ================================================== -->

    <header class="activity-head">

      <div class="head-main">

        <div class="head-icon">
          <Radio :size="15" />
        </div>


        <div class="head-copy">

          <small>
            ARCHIVE SIGNAL
          </small>

          <strong>
            Recent Activity
          </strong>

        </div>

      </div>


      <div class="live-state">

        <span class="live-dot" />

        LIVE
      </div>

    </header>


    <!-- ==================================================
         SUMMARY STRIP
    ================================================== -->

    <section class="activity-summary">

      <div class="summary-stat">

        <small>
          RECENT
        </small>

        <strong>
          {{ recentSessions.length }}
        </strong>

      </div>


      <div class="summary-divider" />


      <div class="summary-stat active">

        <small>
          ACTIVE
        </small>

        <strong>
          {{ activeCount }}
        </strong>

      </div>


      <div class="summary-divider" />


      <div class="summary-stat completed">

        <small>
          DONE
        </small>

        <strong>
          {{ completedCount }}
        </strong>

      </div>

    </section>


    <!-- ==================================================
         SESSION ACTIVITY BODY
    ================================================== -->

    <div
        v-if="
          recentSessions.length
        "
        class="activity-scroll"
    >

      <div class="activity-list">

        <button
            v-for="
              (session, index)
              in
              recentSessions
            "
            :key="session.id"
            type="button"
            class="activity-card"
            :class="{
              selected:
                String(selectedId) ===
                String(session.id),

              mediator:
                modeOf(session) ===
                'mediator',

              activeSession:
                statusOf(session) ===
                'active'
            }"
            :aria-current="
              String(selectedId) ===
              String(session.id)
                  ? 'true'
                  : undefined
            "
            @click="
              selectSession(
                session
              )
            "
        >

          <!-- ==============================================
               TIMELINE SPINE
          ============================================== -->

          <span class="activity-spine">

            <i class="spine-index">
              {{
                String(
                    index + 1
                )
                    .padStart(
                        2,
                        '0'
                    )
              }}
            </i>


            <span
                v-if="
                  index <
                  recentSessions.length - 1
                "
                class="spine-line"
            />

          </span>


          <!-- ==============================================
               CARD BODY
          ============================================== -->

          <span class="card-body">

            <!-- ==========================================
                 TOP ROW
            ========================================== -->

            <span class="card-top">

              <span class="mode-badge">

                <Sparkles
                    v-if="
                      modeOf(session) ===
                      'mediator'
                    "
                    :size="9"
                />

                <UsersRound
                    v-else
                    :size="9"
                />


                {{
                  modeOf(session) ===
                  'mediator'
                      ? 'MEDIATOR'
                      : 'PANEL'
                }}

              </span>


              <span class="time-block">

                <Clock3 :size="9" />

                {{ ageLabel(session) }}

              </span>

            </span>


            <!-- ==========================================
                 TITLE
            ========================================== -->

            <strong class="session-title">
              {{ titleOf(session) }}
            </strong>


            <!-- ==========================================
                 STATUS ROW
            ========================================== -->

            <span class="status-row">

              <span
                  class="status"
                  :class="
                    statusOf(
                      session
                    )
                  "
              >

                <component
                    :is="
                      statusIcon(
                        session
                      )
                    "
                    :size="10"
                />

                {{
                  statusLabel(
                      session
                  )
                }}

              </span>


              <span
                  v-if="
                    statusOf(session) ===
                    'active'
                    ||
                    statusOf(session) ===
                    'paused'
                  "
                  class="round-label"
              >
                ROUND
                {{
                  roundOf(
                      session
                  )
                }}
              </span>

            </span>


            <!-- ==========================================
                 INTELLIGENCE META
            ========================================== -->

            <span class="card-intelligence">

              <span class="intel-item">

                <Gauge :size="10" />

                <span class="intel-copy">

                  <small>
                    CONF
                  </small>

                  <strong>
                    {{
                      confidenceLabel(
                          session
                      )
                    }}
                  </strong>

                </span>

              </span>


              <span class="intel-item risk">

                <ShieldAlert :size="10" />

                <span class="intel-copy">

                  <small>
                    RISKS
                  </small>

                  <strong>
                    {{
                      riskCountOf(
                          session
                      )
                    }}
                  </strong>

                </span>

              </span>


              <span class="intel-item members">

                <UsersRound :size="10" />

                <span class="intel-copy">

                  <small>
                    TEAM
                  </small>

                  <strong>
                    {{
                      memberCountOf(
                          session
                      )
                    }}
                  </strong>

                </span>

              </span>

            </span>


            <!-- ==========================================
                 SELECTED SIGNAL
            ========================================== -->

            <span class="card-select">

              <span>
                OPEN RECORD
              </span>

              <ChevronRight :size="11" />

            </span>

          </span>

        </button>

      </div>

    </div>


    <!-- ==================================================
         EMPTY STATE
    ================================================== -->

    <div
        v-else
        class="empty"
    >

      <div class="empty-icon">
        <Activity :size="18" />
      </div>


      <strong>
        No archive activity
      </strong>


      <span>
        New council discussions will appear here as sessions are created.
      </span>

    </div>


    <!-- ==================================================
         FOOTER
    ================================================== -->

    <footer class="activity-footer">

      <span>
        DISPLAYING
      </span>


      <strong>
        {{ recentSessions.length }}
      </strong>


      <span>
        OF
      </span>


      <strong>
        {{ sessions.length }}
      </strong>


      <span class="footer-label">
        SESSION RECORDS
      </span>

    </footer>

  </aside>
</template>


<style scoped>
/* ==================================================
   ROOT

   The important structural change:

   header
   summary
   minmax(0, 1fr) scroll region
   footer

   This makes the panel truly behave like a
   full-height side rail.
================================================== */

.activity {
  position: relative;

  width: 100%;
  height: 100%;
  min-height: 0;

  display: grid;

  grid-template-rows:
      auto
      auto
      minmax(0, 1fr)
      auto;

  overflow: hidden;

  border:
      1px solid
      rgba(74, 198, 255, .14);

  clip-path:
      polygon(
          0 0,
          calc(100% - .85vw) 0,
          100% .9vh,
          100% calc(100% - .7vh),
          calc(100% - .65vw) 100%,
          0 100%
      );

  background:
      linear-gradient(
          180deg,
          rgba(4, 11, 23, .98),
          rgba(4, 9, 20, .96) 48%,
          rgba(3, 7, 16, .985)
      );

  box-shadow:
      inset 0 0 35px
      rgba(55, 174, 255, .035),

      inset 0 0 0 1px
      rgba(168, 81, 255, .018),

      0 0 18px
      rgba(51, 174, 255, .035);

  color:
      rgba(214, 228, 246, .76);
}


/* ==================================================
   BACKGROUND EFFECTS
================================================== */

.rail-glow {
  position: absolute;

  width:
      9vw;

  height:
      15vw;

  top:
      -7vw;

  right:
      -5vw;

  pointer-events:
      none;

  background:
      radial-gradient(
          circle,
          rgba(119, 57, 255, .15),
          transparent 70%
      );

  filter:
      blur(12px);
}


.rail-line {
  position: absolute;

  pointer-events:
      none;

  opacity:
      .5;
}


.rail-line-top {
  top:
      0;

  left:
      .8vw;

  width:
      3vw;

  height:
      .5vh;

  border-bottom:
      1px solid
      rgba(68, 205, 255, .16);

  border-right:
      1px solid
      rgba(68, 205, 255, .12);
}


.rail-line-bottom {
  right:
      .8vw;

  bottom:
      0;

  width:
      2.5vw;

  height:
      .5vh;

  border-top:
      1px solid
      rgba(177, 88, 255, .16);

  border-left:
      1px solid
      rgba(177, 88, 255, .12);
}


/* ==================================================
   HEADER
================================================== */

.activity-head {
  position: relative;
  z-index: 1;

  min-height:
      5.4vh;

  padding:
      .95vh
      .72vw
      .8vh;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-bottom:
      1px solid
      rgba(83, 197, 255, .08);
}


.head-main {
  display: flex;
  align-items: center;

  gap:
      .48vw;
}


.head-icon {
  width:
      1.7vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(77, 205, 255, .19);

  background:
      linear-gradient(
          145deg,
          rgba(27, 97, 137, .12),
          rgba(13, 20, 44, .2)
      );

  color:
      #64d8ff;

  box-shadow:
      inset 0 0 10px
      rgba(71, 205, 255, .045),

      0 0 8px
      rgba(71, 205, 255, .035);
}


.head-copy {
  display: grid;

  gap:
      .08vh;
}


.head-copy small {
  font-size:
      .27vw;

  letter-spacing:
      .11em;

  color:
      rgba(151, 94, 225, .58);
}


.head-copy strong {
  font-family:
      Georgia,
      serif;

  font-size:
      .62vw;

  font-weight:
      400;

  color:
      rgba(231, 239, 250, .88);
}


.live-state {
  display: flex;
  align-items: center;

  gap:
      .22vw;

  padding:
      .18vh
      .28vw;

  border:
      1px solid
      rgba(68, 222, 199, .13);

  background:
      rgba(21, 91, 81, .045);

  font-size:
      .26vw;

  letter-spacing:
      .08em;

  color:
      rgba(76, 225, 201, .68);
}


.live-dot {
  width:
      .24vw;

  aspect-ratio:
      1;

  border-radius:
      50%;

  background:
      #4be0c5;

  box-shadow:
      0 0 6px
      rgba(75, 224, 197, .7);

  animation:
      live-pulse
      1.8s
      ease-in-out
      infinite;
}


/* ==================================================
   SUMMARY STRIP
================================================== */

.activity-summary {
  position: relative;
  z-index: 1;

  min-height:
      4.3vh;

  padding:
      .55vh
      .65vw;

  display: grid;

  grid-template-columns:
      1fr
      1px
      1fr
      1px
      1fr;

  align-items: center;

  border-bottom:
      1px solid
      rgba(75, 189, 244, .07);

  background:
      rgba(1, 7, 15, .28);
}


.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;

  gap:
      .05vh;
}


.summary-stat small {
  font-size:
      .25vw;

  letter-spacing:
      .08em;

  color:
      rgba(130, 156, 187, .34);
}


.summary-stat strong {
  font-family:
      Georgia,
      serif;

  font-size:
      .66vw;

  font-weight:
      400;

  color:
      rgba(221, 233, 247, .78);
}


.summary-stat.active
strong {
  color:
      #4bdcc5;
}


.summary-stat.completed
strong {
  color:
      #5ecfff;
}


.summary-divider {
  width:
      1px;

  height:
      65%;

  background:
      rgba(86, 168, 214, .08);
}


/* ==================================================
   SCROLL REGION

   This is the actual full-height body.
================================================== */

.activity-scroll {
  position: relative;
  z-index: 1;

  min-height: 0;

  overflow-y: auto;
  overflow-x: hidden;

  padding:
      .65vh
      .48vw
      1vh;

  scrollbar-width:
      thin;

  scrollbar-color:
      rgba(72, 199, 255, .18)
      transparent;
}


.activity-scroll::-webkit-scrollbar {
  width:
      3px;
}


.activity-scroll::-webkit-scrollbar-track {
  background:
      transparent;
}


.activity-scroll::-webkit-scrollbar-thumb {
  background:
      rgba(72, 199, 255, .18);
}


/* ==================================================
   ACTIVITY LIST
================================================== */

.activity-list {
  display: grid;
}


/* ==================================================
   ACTIVITY CARD

   Each item has a narrow archive spine and a real
   information card.
================================================== */

.activity-card {
  position: relative;

  width: 100%;

  display: grid;

  grid-template-columns:
      1.45vw
      minmax(0, 1fr);

  gap:
      .25vw;

  padding:
      0;

  border:
      0;

  background:
      transparent;

  color:
      inherit;

  text-align:
      left;

  font:
      inherit;

  cursor:
      pointer;
}


/* ==================================================
   SPINE
================================================== */

.activity-spine {
  position: relative;

  min-height:
      11.8vh;

  display: flex;
  flex-direction: column;
  align-items: center;
}


.spine-index {
  position: relative;
  z-index: 2;

  width:
      1.1vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(155, 78, 242, .18);

  background:
      rgba(15, 8, 30, .96);

  color:
      rgba(177, 101, 255, .6);

  font-family:
      Georgia,
      serif;

  font-size:
      .31vw;

  font-style:
      normal;

  transition:
      color .18s ease,
      border-color .18s ease,
      box-shadow .18s ease;
}


.spine-line {
  flex:
      1;

  width:
      1px;

  min-height:
      2vh;

  background:
      linear-gradient(
          180deg,
          rgba(152, 78, 240, .19),
          rgba(69, 196, 255, .07)
      );
}


.activity-card.selected
.spine-index {
  color:
      #6edfff;

  border-color:
      rgba(98, 221, 255, .42);

  box-shadow:
      0 0 9px
      rgba(85, 216, 255, .16);
}


.activity-card.mediator
.spine-index {
  color:
      #62d9ff;

  border-color:
      rgba(76, 207, 255, .2);

  background:
      rgba(3, 20, 30, .96);
}


/* ==================================================
   CARD BODY
================================================== */

.card-body {
  position: relative;

  min-width: 0;

  margin-bottom:
      .52vh;

  padding:
      .55vh
      .52vw
      .5vh;

  display: flex;
  flex-direction: column;

  border:
      1px solid
      rgba(77, 177, 230, .07);

  background:
      linear-gradient(
          145deg,
          rgba(7, 15, 29, .58),
          rgba(4, 10, 20, .42)
      );

  overflow: hidden;

  transition:
      border-color .18s ease,
      background .18s ease,
      box-shadow .18s ease,
      transform .18s ease;
}


.card-body::before {
  content:
      '';

  position: absolute;

  left:
      0;

  top:
      .45vh;

  bottom:
      .45vh;

  width:
      1px;

  background:
      rgba(165, 83, 255, .28);

  box-shadow:
      0 0 5px
      rgba(165, 83, 255, .18);
}


.activity-card.mediator
.card-body::before {
  background:
      rgba(71, 210, 255, .35);

  box-shadow:
      0 0 5px
      rgba(71, 210, 255, .22);
}


.activity-card:hover
.card-body {
  transform:
      translateX(.08vw);

  border-color:
      rgba(89, 205, 255, .17);

  background:
      linear-gradient(
          145deg,
          rgba(13, 29, 46, .62),
          rgba(7, 13, 25, .48)
      );
}


.activity-card.selected
.card-body {
  border-color:
      rgba(166, 81, 255, .35);

  background:
      linear-gradient(
          110deg,
          rgba(92, 38, 145, .12),
          rgba(7, 19, 34, .58)
      );

  box-shadow:
      inset 0 0 16px
      rgba(132, 61, 214, .055),

      0 0 11px
      rgba(116, 45, 212, .045);
}


.activity-card.mediator.selected
.card-body {
  border-color:
      rgba(73, 207, 255, .28);

  background:
      linear-gradient(
          110deg,
          rgba(28, 100, 137, .1),
          rgba(7, 19, 34, .58)
      );
}


/* ==================================================
   CARD TOP
================================================== */

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap:
      .4vw;
}


.mode-badge {
  display: inline-flex;
  align-items: center;

  gap:
      .17vw;

  padding:
      .12vh
      .22vw;

  border:
      1px solid
      rgba(173, 95, 255, .12);

  color:
      rgba(188, 115, 255, .58);

  font-size:
      .25vw;

  letter-spacing:
      .07em;
}


.activity-card.mediator
.mode-badge {
  color:
      rgba(89, 211, 255, .62);

  border-color:
      rgba(89, 211, 255, .12);
}


.time-block {
  display: flex;
  align-items: center;

  gap:
      .17vw;

  font-size:
      .27vw;

  color:
      rgba(132, 158, 188, .36);
}


/* ==================================================
   SESSION TITLE
================================================== */

.session-title {
  display:
      -webkit-box;

  margin-top:
      .42vh;

  overflow:
      hidden;

  -webkit-line-clamp:
      2;

  -webkit-box-orient:
      vertical;

  font-family:
      Georgia,
      serif;

  font-size:
      .56vw;

  line-height:
      1.28;

  font-weight:
      400;

  color:
      rgba(219, 231, 246, .77);

  transition:
      color .18s ease;
}


.activity-card:hover
.session-title,
.activity-card.selected
.session-title {
  color:
      rgba(241, 246, 255, .96);
}


/* ==================================================
   STATUS ROW
================================================== */

.status-row {
  margin-top:
      .4vh;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap:
      .4vw;
}


.status {
  display: flex;
  align-items: center;

  gap:
      .2vw;

  font-size:
      .31vw;

  color:
      rgba(151, 177, 206, .48);
}


.status.active {
  color:
      #4cddc5;
}


.status.completed {
  color:
      #5dcdff;
}


.status.paused {
  color:
      #e6b563;
}


.status.ready {
  color:
      #b477ff;
}


.status.abandoned {
  color:
      #ff7188;
}


.round-label {
  font-size:
      .25vw;

  letter-spacing:
      .06em;

  color:
      rgba(140, 168, 199, .35);
}


/* ==================================================
   INTELLIGENCE META
================================================== */

.card-intelligence {
  margin-top:
      .48vh;

  display: grid;

  grid-template-columns:
      repeat(3, 1fr);

  border:
      1px solid
      rgba(74, 169, 220, .055);

  background:
      rgba(1, 6, 14, .24);
}


.intel-item {
  min-width: 0;

  min-height:
      2.6vh;

  display: flex;
  align-items: center;

  gap:
      .3vw;

  padding:
      .3vh
      .3vw;

  border-right:
      1px solid
      rgba(80, 162, 209, .05);

  color:
      rgba(90, 205, 255, .5);
}


.intel-item:last-child {
  border-right:
      0;
}


.intel-item.risk {
  color:
      rgba(255, 103, 130, .62);
}


.intel-item.members {
  color:
      rgba(183, 112, 255, .58);
}


.intel-copy {
  min-width: 0;

  display: grid;

  gap:
      .02vh;
}


.intel-copy small {
  font-size:
      .21vw;

  letter-spacing:
      .06em;

  color:
      rgba(128, 154, 184, .32);
}


.intel-copy strong {
  font-family:
      Georgia,
      serif;

  font-size:
      .42vw;

  font-weight:
      400;

  color:
      currentColor;
}


/* ==================================================
   CARD SELECT FOOTER
================================================== */

.card-select {
  margin-top:
      .4vh;

  padding-top:
      .32vh;

  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap:
      .14vw;

  border-top:
      1px solid
      rgba(78, 169, 215, .045);

  font-size:
      .24vw;

  letter-spacing:
      .07em;

  color:
      rgba(80, 199, 244, .28);

  opacity:
      0;

  transform:
      translateY(.15vh);

  transition:
      opacity .18s ease,
      transform .18s ease,
      color .18s ease;
}


.activity-card:hover
.card-select,
.activity-card.selected
.card-select {
  opacity:
      1;

  transform:
      translateY(0);

  color:
      rgba(87, 210, 255, .58);
}


/* ==================================================
   EMPTY
================================================== */

.empty {
  min-height: 0;

  padding:
      1.2vw;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap:
      .35vh;

  text-align:
      center;
}


.empty-icon {
  width:
      2.2vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  margin-bottom:
      .35vh;

  border:
      1px solid
      rgba(76, 198, 255, .13);

  color:
      rgba(81, 204, 255, .48);
}


.empty strong {
  font-family:
      Georgia,
      serif;

  font-size:
      .58vw;

  font-weight:
      400;

  color:
      rgba(207, 223, 241, .56);
}


.empty > span {
  max-width:
      11vw;

  font-size:
      .34vw;

  line-height:
      1.45;

  color:
      rgba(137, 163, 193, .35);
}


/* ==================================================
   FOOTER
================================================== */

.activity-footer {
  position: relative;
  z-index: 1;

  min-height:
      3.1vh;

  padding:
      .5vh
      .65vw;

  display: flex;
  align-items: center;

  gap:
      .2vw;

  border-top:
      1px solid
      rgba(78, 185, 239, .07);

  background:
      rgba(1, 6, 14, .36);

  font-size:
      .24vw;

  letter-spacing:
      .055em;

  color:
      rgba(125, 151, 181, .3);
}


.activity-footer strong {
  font-family:
      Georgia,
      serif;

  font-size:
      .38vw;

  font-weight:
      400;

  color:
      rgba(93, 206, 255, .54);
}


.footer-label {
  margin-left:
      auto;
}


/* ==================================================
   ANIMATIONS
================================================== */

@keyframes live-pulse {

  0%,
  100% {
    opacity:
        .35;

    box-shadow:
        0 0 3px
        rgba(75, 224, 197, .3);
  }

  50% {
    opacity:
        1;

    box-shadow:
        0 0 8px
        rgba(75, 224, 197, .75);
  }
}
</style>
