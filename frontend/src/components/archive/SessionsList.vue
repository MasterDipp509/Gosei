<script setup>
import {
  computed
} from 'vue'


/* ==================================================
   PROPS
================================================== */

const props =
    defineProps({

      /* ==============================================
         ARCHIVE SESSION LIST

         Each enriched session can contain:

         {
           id,
           title,
           mode,
           status,

           currentRound,

           discussionMembers: [],
           members: [],
           memberCount,

           confidenceInDebate,
           confidenceScore,

           risks: [],
           riskCount,

           discussionHydrated,

           createdAt,
           updatedAt
         }
      ============================================== */

      sessions: {
        type: Array,
        default: () => []
      },


      /* ==============================================
         CURRENTLY SELECTED ARCHIVE SESSION
      ============================================== */

      selectedId: {
        type: [
          String,
          Number
        ],
        default: null
      },


      /* ==============================================
         SESSION LIST LOADING STATE
      ============================================== */

      loading: {
        type: Boolean,
        default: false
      },


      /* ==============================================
         SESSION LIST ERROR
      ============================================== */

      error: {
        type: [
          String,
          Object
        ],
        default: null
      }
    })


/* ==================================================
   EMITS
================================================== */

const emit =
    defineEmits([
      'select',
      'refresh'
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
   SESSION DATE

   Archive grouping uses updatedAt first.

   Falls back to createdAt.
================================================== */

function sessionDate(
    session
) {

  const rawDate =

      session?.updatedAt

      ??

      session?.createdAt

      ??

      0


  const date =
      new Date(
          rawDate
      )


  if (
      Number.isNaN(
          date.getTime()
      )
  ) {

    return new Date(0)
  }


  return date
}


/* ==================================================
   SAME DAY CHECK
================================================== */

function isSameDay(
    first,
    second
) {

  return (

      first.getFullYear() ===
      second.getFullYear()

      &&

      first.getMonth() ===
      second.getMonth()

      &&

      first.getDate() ===
      second.getDate()
  )
}


/* ==================================================
   GROUPED ARCHIVE SESSIONS

   Groups:

   today
   yesterday
   earlier
================================================== */

const groupedSessions =
    computed(() => {

      const now =
          new Date()


      const yesterday =
          new Date(
              now
          )


      yesterday.setDate(
          yesterday.getDate() - 1
      )


      return {

        today:
            props.sessions.filter(
                session =>

                    isSameDay(

                        sessionDate(
                            session
                        ),

                        now
                    )
            ),


        yesterday:
            props.sessions.filter(
                session =>

                    isSameDay(

                        sessionDate(
                            session
                        ),

                        yesterday
                    )
            ),


        earlier:
            props.sessions.filter(
                session => {

                  const date =
                      sessionDate(
                          session
                      )


                  return (

                      !isSameDay(
                          date,
                          now
                      )

                      &&

                      !isSameDay(
                          date,
                          yesterday
                      )
                  )
                }
            )
      }
    })


/* ==================================================
   RENDER GROUPS
================================================== */

const sessionGroups =
    computed(() => [

      {
        key:
            'today',

        title:
            'TODAY',

        sessions:
        groupedSessions.value.today
      },


      {
        key:
            'yesterday',

        title:
            'YESTERDAY',

        sessions:
        groupedSessions.value.yesterday
      },


      {
        key:
            'earlier',

        title:
            'EARLIER',

        sessions:
        groupedSessions.value.earlier
      }
    ])


/* ==================================================
   SESSION TITLE
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
   SESSION TIME
================================================== */

function timeOf(
    session
) {

  return sessionDate(
      session
  )
      .toLocaleTimeString(

          [],

          {
            hour:
                '2-digit',

            minute:
                '2-digit'
          }
      )
}


/* ==================================================
   SESSION DATE LABEL
================================================== */

function dateOf(
    session
) {

  return sessionDate(
      session
  )
      .toLocaleDateString(

          [],

          {
            month:
                'short',

            day:
                'numeric'
          }
      )
}


/* ==================================================
   FULL GROUP DATE
================================================== */

function fullDateOf(
    session
) {

  return sessionDate(
      session
  )
      .toLocaleDateString(

          [],

          {
            month:
                'short',

            day:
                'numeric',

            year:
                'numeric'
          }
      )
}


/* ==================================================
   SESSION MODE
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
   STATUS LABEL
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
   CURRENT ROUND

   Uses the actual currentRound returned by the
   session serializer.
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
   DISCUSSION MEMBERS

   Priority:

   1. hydrated discussionMembers
   2. members alias
   3. session panelMembers
   4. mediator
================================================== */

function membersOf(
    session
) {

  const discussionMembers =
      asArray(
          session?.discussionMembers
      )


  if (
      discussionMembers.length
  ) {

    return discussionMembers
  }


  const members =
      asArray(
          session?.members
      )


  if (
      members.length
  ) {

    return members
  }


  if (
      modeOf(session) ===
      'mediator'
  ) {

    return session?.mediator
        ? [
          session.mediator
        ]
        : []
  }


  return asArray(
      session?.panelMembers
  )
}


/* ==================================================
   MEMBER COUNT
================================================== */

function memberCountOf(
    session
) {

  const members =
      membersOf(
          session
      )


  if (
      members.length
  ) {

    return members.length
  }


  const count =
      Number(
          session?.memberCount
      )


  return Number.isFinite(
      count
  )
      ? count
      : 0
}


/* ==================================================
   VISIBLE MEMBER STACK

   Maximum four visible member markers.
================================================== */

function visibleMembersOf(
    session
) {

  return membersOf(
      session
  )
      .slice(
          0,
          4
      )
}


/* ==================================================
   HIDDEN MEMBER COUNT
================================================== */

function additionalMemberCount(
    session
) {

  return Math.max(

      memberCountOf(
          session
      )

      -

      4,

      0
  )
}


/* ==================================================
   MEMBER NAME
================================================== */

function memberNameOf(
    member
) {

  return (

      member?.name

      ??

      member?.id

      ??

      'Member'
  )
}


/* ==================================================
   MEMBER INITIALS

   Examples:

   Rei Kisaragi
   -> RK

   Mika
   -> MI
================================================== */

function memberInitials(
    member
) {

  const name =
      String(
          memberNameOf(
              member
          )
      )
          .trim()


  if (!name) {

    return '?'
  }


  const parts =
      name
          .split(
              /\s+/
          )
          .filter(
              Boolean
          )


  if (
      parts.length >
      1
  ) {

    return (

        parts[0][0]

        +

        parts[
        parts.length - 1
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
   CONFIDENCE IN DEBATE

   The archive store provides:

   confidenceInDebate

   and also:

   confidenceScore

   as a convenience alias.
================================================== */

function confidenceOf(
    session
) {

  const value =

      session?.confidenceInDebate

      ??

      session?.confidenceScore


  if (
      value === null
      ||
      value === undefined
      ||
      value === ''
  ) {

    return null
  }


  const number =
      Number(
          value
      )


  return Number.isFinite(
      number
  )
      ? number
      : null
}


/* ==================================================
   CONFIDENCE DISPLAY
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


  const rounded =
      Math.round(
          value * 10
      )
      /
      10


  return `${rounded}%`
}


/* ==================================================
   CONFIDENCE TONE

   Used only for subtle visual indication.
================================================== */

function confidenceTone(
    session
) {

  const value =
      confidenceOf(
          session
      )


  if (
      value === null
  ) {

    return 'unknown'
  }


  if (
      value >= 70
  ) {

    return 'high'
  }


  if (
      value >= 45
  ) {

    return 'medium'
  }


  return 'low'
}


/* ==================================================
   RISK COUNT

   Uses the archive store's derived riskCount.
================================================== */

function riskCountOf(
    session
) {

  const count =
      Number(
          session?.riskCount
      )


  if (
      Number.isFinite(
          count
      )
  ) {

    return count
  }


  return asArray(
      session?.risks
  )
      .length
}


/* ==================================================
   SELECT SESSION

   Selection only.

   This component performs no pinning and no session
   mutation.
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
  <section class="session-list">

    <!-- ==================================================
         LOADING
    ================================================== -->

    <div
        v-if="loading"
        class="state"
    >
      <span class="state-loader" />

      <span>
        Loading archive records...
      </span>
    </div>


    <!-- ==================================================
         ERROR
    ================================================== -->

    <div
        v-else-if="error"
        class="state error"
    >
      <span>
        Unable to load sessions.
      </span>

      <button
          type="button"
          @click="
            emit(
              'refresh'
            )
          "
      >
        Retry
      </button>
    </div>


    <!-- ==================================================
         SESSION GROUPS
    ================================================== -->

    <div
        v-else
        class="groups"
    >

      <div
          v-for="group in sessionGroups"
          :key="group.key"
          class="group"
      >

        <!-- ==============================================
             GROUP TITLE
        ============================================== -->

        <div
            v-if="group.sessions.length"
            class="group-title"
        >
          <span>
            {{ group.title }}
          </span>


          <small
              v-if="
                group.key !==
                'earlier'
              "
          >
            ·
            {{
              fullDateOf(
                  group.sessions[0]
              )
            }}
          </small>
        </div>


        <!-- ==============================================
             TABLE
        ============================================== -->

        <div
            v-if="group.sessions.length"
            class="table"
        >

          <!-- ============================================
               TABLE HEADER
          ============================================ -->

          <div class="table-head">

            <span>
              SESSION
            </span>

            <span>
              TYPE
            </span>

            <span>
              TIME
            </span>

            <span>
              STATUS
            </span>

            <span>
              MEMBERS
            </span>

            <span>
              ROUND
            </span>

            <span>
              CONFIDENCE
            </span>

            <span>
              RISKS
            </span>

          </div>


          <!-- ============================================
               SESSION ROW
          ============================================ -->

          <button
              v-for="session in group.sessions"
              :key="session.id"
              type="button"
              class="session-row"
              :class="{
                selected:
                  String(selectedId) ===
                  String(session.id),

                mediator:
                  modeOf(session) ===
                  'mediator'
              }"
              @click="
                selectSession(
                  session
                )
              "
          >

            <!-- ========================================
                 SESSION
            ======================================== -->

            <span class="session-cell title-cell">

              <span class="session-icon">

                {{
                  modeOf(session) ===
                  'mediator'
                      ? '✦'
                      : '♙'
                }}

              </span>


              <span class="title-copy">

                <span class="session-title">

                  {{
                    titleOf(
                        session
                    )
                  }}

                </span>


                <span class="session-stage">

                  {{
                    session.currentSectionTitle
                    ??
                    session.currentStage
                    ??
                    'Discussion'
                  }}

                </span>

              </span>

            </span>


            <!-- ========================================
                 TYPE
            ======================================== -->

            <span
                class="type-badge"
                :class="
                  modeOf(
                    session
                  )
                "
            >

              {{
                modeOf(session) ===
                'mediator'
                    ? 'Mediator'
                    : 'Panel'
              }}

            </span>


            <!-- ========================================
                 TIME
            ======================================== -->

            <span class="date-cell">

              {{
                group.key ===
                'earlier'

                    ? dateOf(
                        session
                    )

                    : timeOf(
                        session
                    )
              }}

            </span>


            <!-- ========================================
                 STATUS
            ======================================== -->

            <span class="status">

              <i
                  :class="
                    statusOf(
                      session
                    )
                  "
              />


              <span>
                {{
                  statusOf(
                      session
                  )
                }}
              </span>

            </span>


            <!-- ========================================
                 MEMBERS
            ======================================== -->

            <span class="members-cell">

              <span
                  v-if="
                    memberCountOf(
                      session
                    ) > 0
                  "
                  class="member-stack"
              >

                <span
                    v-for="
                      member
                      in
                      visibleMembersOf(
                        session
                      )
                    "
                    :key="
                      member.id
                      ??
                      member.name
                    "
                    class="member-avatar"
                    :title="
                      memberNameOf(
                        member
                      )
                    "
                >

                  {{
                    memberInitials(
                        member
                    )
                  }}

                </span>


                <span
                    v-if="
                      additionalMemberCount(
                        session
                      ) > 0
                    "
                    class="
                      member-avatar
                      member-more
                    "
                >

                  +{{
                    additionalMemberCount(
                        session
                    )
                  }}

                </span>

              </span>


              <span
                  v-else
                  class="empty-value"
              >
                —
              </span>

            </span>


            <!-- ========================================
                 ROUND
            ======================================== -->

            <span class="round-cell">

              <span class="round-number">

                {{
                  roundOf(
                      session
                  )
                }}

              </span>

            </span>


            <!-- ========================================
                 CONFIDENCE
            ======================================== -->

            <span
                class="confidence-cell"
                :class="
                  confidenceTone(
                    session
                  )
                "
            >

              {{
                confidenceLabel(
                    session
                )
              }}

            </span>


            <!-- ========================================
                 RISKS
            ======================================== -->

            <span
                class="risk-cell"
                :class="{
                  warning:
                    riskCountOf(
                      session
                    ) > 0
                }"
            >

              <span
                  v-if="
                    riskCountOf(
                      session
                    ) > 0
                  "
                  class="risk-marker"
              />


              {{
                riskCountOf(
                    session
                )
              }}

            </span>

          </button>

        </div>

      </div>


      <!-- ==================================================
           EMPTY
      ================================================== -->

      <div
          v-if="
            !groupedSessions.today.length
            &&
            !groupedSessions.yesterday.length
            &&
            !groupedSessions.earlier.length
          "
          class="state"
      >
        No archive records found.
      </div>

    </div>

  </section>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.session-list {
  width: 100%;
  height: 100%;
  min-height: 0;

  overflow: hidden;
}


/* ==================================================
   GROUP SCROLLER
================================================== */

.groups {
  height: 100%;

  overflow-y: auto;
  overflow-x: hidden;

  padding:
      .8vh
      .6vw
      1.5vh;

  scrollbar-width: thin;

  scrollbar-color:
      rgba(82, 201, 255, .22)
      transparent;
}


.groups::-webkit-scrollbar {
  width: 4px;
}


.groups::-webkit-scrollbar-track {
  background:
      transparent;
}


.groups::-webkit-scrollbar-thumb {
  background:
      rgba(82, 201, 255, .2);

  border-radius: 10px;
}


/* ==================================================
   GROUP
================================================== */

.group {
  margin-bottom:
      1.5vh;
}


.group-title {
  height:
      2.6vh;

  display: flex;
  align-items: center;

  gap:
      .3vw;

  padding:
      0
      .25vw;

  font-family:
      Georgia,
      serif;

  font-size:
      .58vw;

  letter-spacing:
      .08em;

  color:
      rgba(213, 226, 244, .58);
}


.group-title small {
  font-size:
      .52vw;

  color:
      rgba(179, 194, 215, .4);
}


/* ==================================================
   TABLE
================================================== */

.table {
  border:
      1px solid
      rgba(82, 201, 255, .06);

  background:
      rgba(3, 10, 18, .52);
}


/* ==================================================
   TABLE GRID

   SESSION
   TYPE
   TIME
   STATUS
   MEMBERS
   ROUND
   CONFIDENCE
   RISKS
================================================== */

.table-head,
.session-row {
  display: grid;

  grid-template-columns:
      minmax(0, 3.1fr)
      .76fr
      .68fr
      .88fr
      1.1fr
      .48fr
      .86fr
      .5fr;

  align-items: center;

  column-gap:
      .42vw;
}


/* ==================================================
   HEADER
================================================== */

.table-head {
  height:
      2.7vh;

  padding:
      0
      .65vw;

  border-bottom:
      1px solid
      rgba(105, 167, 208, .09);

  font-size:
      .45vw;

  letter-spacing:
      .08em;

  color:
      rgba(155, 180, 207, .4);
}


/* ==================================================
   ROW
================================================== */

.session-row {
  position: relative;

  width: 100%;
  height: 4.5vh;

  padding:
      0
      .65vw;

  border:
      none;

  border-bottom:
      1px solid
      rgba(105, 167, 208, .055);

  background:
      transparent;

  color:
      rgba(201, 216, 234, .68);

  font:
      inherit;

  font-size:
      .59vw;

  text-align:
      left;

  cursor:
      pointer;

  transition:
      background .18s ease,
      box-shadow .18s ease,
      color .18s ease;
}


.session-row:last-child {
  border-bottom:
      none;
}


.session-row:hover {
  background:
      rgba(73, 188, 255, .045);

  color:
      rgba(233, 242, 255, .9);
}


.session-row.selected {
  z-index: 1;

  background:
      linear-gradient(
          90deg,
          rgba(127, 57, 224, .1),
          rgba(61, 181, 255, .035)
      );

  box-shadow:
      inset 0 0 0 1px
      rgba(177, 79, 255, .72),

      0 0 14px
      rgba(129, 53, 255, .12);

  color:
      #eef5ff;
}


/* ==================================================
   SESSION TITLE CELL
================================================== */

.title-cell {
  min-width: 0;

  display: flex;
  align-items: center;

  gap:
      .55vw;
}


.session-icon {
  flex:
      0 0 auto;

  width:
      1.55vw;

  aspect-ratio:
      1;

  display: grid;

  place-items:
      center;

  border:
      1px solid
      rgba(170, 87, 255, .28);

  border-radius:
      50%;

  color:
      #a75cff;

  background:
      rgba(132, 52, 218, .06);

  box-shadow:
      inset 0 0 8px
      rgba(167, 92, 255, .04);

  font-size:
      .52vw;
}


.session-row.mediator
.session-icon {
  color:
      #42d4ff;

  border-color:
      rgba(66, 212, 255, .28);

  background:
      rgba(66, 212, 255, .06);
}


.title-copy {
  min-width:
      0;

  display: flex;
  flex-direction: column;

  gap:
      .14vh;
}


.session-title {
  display: block;

  overflow: hidden;

  white-space: nowrap;

  text-overflow:
      ellipsis;

  color:
      rgba(226, 236, 249, .86);
}


.session-stage {
  display: block;

  max-width:
      100%;

  overflow:
      hidden;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;

  font-size:
      .45vw;

  color:
      rgba(135, 159, 188, .42);
}


/* ==================================================
   TYPE
================================================== */

.type-badge {
  width:
      max-content;

  padding:
      .28vh
      .42vw;

  border-radius:
      2px;

  font-size:
      .49vw;

  line-height:
      1;
}


.type-badge.panel {
  color:
      #b56aff;

  border:
      1px solid
      rgba(174, 88, 255, .25);

  background:
      rgba(133, 50, 214, .07);
}


.type-badge.mediator {
  color:
      #43d3ff;

  border:
      1px solid
      rgba(67, 211, 255, .28);

  background:
      rgba(46, 172, 230, .07);
}


/* ==================================================
   DATE
================================================== */

.date-cell {
  color:
      rgba(178, 198, 220, .62);
}


/* ==================================================
   STATUS
================================================== */

.status {
  display: flex;
  align-items: center;

  gap:
      .35vw;

  text-transform:
      capitalize;
}


.status i {
  width:
      .3vw;

  aspect-ratio:
      1;

  flex:
      0 0 auto;

  border-radius:
      50%;

  background:
      rgba(153, 174, 198, .5);
}


.status i.active {
  background:
      #40e5c7;

  box-shadow:
      0 0 7px
      rgba(64, 229, 199, .65);
}


.status i.completed {
  background:
      #57a8db;

  box-shadow:
      0 0 5px
      rgba(87, 168, 219, .3);
}


.status i.paused {
  background:
      #e5ae59;

  box-shadow:
      0 0 5px
      rgba(229, 174, 89, .3);
}


.status i.ready {
  background:
      #a865ff;

  box-shadow:
      0 0 5px
      rgba(168, 101, 255, .35);
}


.status i.abandoned {
  background:
      #ff657c;

  box-shadow:
      0 0 5px
      rgba(255, 101, 124, .3);
}


/* ==================================================
   MEMBERS
================================================== */

.members-cell {
  min-width:
      0;

  display: flex;
  align-items: center;
}


.member-stack {
  display: flex;
  align-items: center;

  min-width:
      0;
}


.member-avatar {
  position: relative;

  width:
      1.15vw;

  aspect-ratio:
      1;

  display: grid;

  place-items:
      center;

  margin-left:
      -.19vw;

  border:
      1px solid
      rgba(106, 199, 255, .22);

  border-radius:
      50%;

  background:
      linear-gradient(
          145deg,
          rgba(42, 88, 129, .88),
          rgba(29, 31, 66, .94)
      );

  box-shadow:
      0 0 5px
      rgba(73, 188, 255, .06);

  color:
      rgba(219, 237, 255, .78);

  font-size:
      .35vw;

  letter-spacing:
      -.03em;
}


.member-avatar:first-child {
  margin-left:
      0;
}


.member-more {
  color:
      #b979ff;

  border-color:
      rgba(179, 102, 255, .27);

  background:
      rgba(81, 40, 120, .9);
}


.empty-value {
  color:
      rgba(151, 172, 198, .35);
}


/* ==================================================
   ROUND
================================================== */

.round-cell {
  color:
      rgba(200, 218, 238, .72);
}


.round-number {
  display:
      inline-flex;

  min-width:
      1.05vw;

  align-items:
      center;

  justify-content:
      center;

  padding:
      .15vh
      .2vw;

  border:
      1px solid
      rgba(89, 187, 242, .1);

  background:
      rgba(50, 135, 185, .035);

  font-size:
      .5vw;
}


/* ==================================================
   CONFIDENCE
================================================== */

.confidence-cell {
  font-variant-numeric:
      tabular-nums;

  color:
      rgba(194, 211, 231, .65);
}


.confidence-cell.high {
  color:
      #56e3c1;

  text-shadow:
      0 0 6px
      rgba(86, 227, 193, .12);
}


.confidence-cell.medium {
  color:
      #e3c66a;

  text-shadow:
      0 0 6px
      rgba(227, 198, 106, .1);
}


.confidence-cell.low {
  color:
      #ff7186;

  text-shadow:
      0 0 6px
      rgba(255, 113, 134, .1);
}


.confidence-cell.unknown {
  color:
      rgba(157, 177, 201, .35);
}


/* ==================================================
   RISKS
================================================== */

.risk-cell {
  display: flex;
  align-items: center;

  gap:
      .28vw;

  font-variant-numeric:
      tabular-nums;

  color:
      rgba(171, 190, 211, .52);
}


.risk-cell.warning {
  color:
      #ff617a;
}


.risk-marker {
  width:
      .27vw;

  aspect-ratio:
      1;

  border-radius:
      50%;

  background:
      currentColor;

  box-shadow:
      0 0 5px
      rgba(255, 82, 110, .45);
}


/* ==================================================
   STATE
================================================== */

.state {
  height:
      100%;

  display: flex;

  align-items:
      center;

  justify-content:
      center;

  gap:
      1vw;

  color:
      rgba(190, 208, 229, .55);

  font-size:
      .7vw;
}


.state-loader {
  width:
      .55vw;

  aspect-ratio:
      1;

  border:
      1px solid
      rgba(83, 205, 255, .22);

  border-top-color:
      rgba(83, 205, 255, .9);

  border-radius:
      50%;

  animation:
      archive-spin
      .8s
      linear
      infinite;
}


.state.error {
  color:
      rgba(255, 117, 135, .75);
}


.state button {
  padding:
      .45vh
      .7vw;

  border:
      1px solid
      rgba(69, 201, 255, .3);

  background:
      rgba(23, 112, 159, .08);

  color:
      #62d6ff;

  cursor:
      pointer;
}


/* ==================================================
   ANIMATIONS
================================================== */

@keyframes archive-spin {

  to {
    transform:
        rotate(360deg);
  }
}
</style>
