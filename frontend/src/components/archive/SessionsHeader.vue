<script setup>
import {
  computed
} from 'vue'


import {
  Activity,
  CheckCircle2,
  Gauge,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UsersRound
} from 'lucide-vue-next'


/* ==================================================
   PROPS

   EXPECTED SESSION SHAPE:

   {
     id,
     mode,
     status,

     discussionMembers: [],
     memberCount,

     confidenceInDebate,
     confidenceScore,

     risks: [],
     riskCount,

     discussionHydrated
   }
================================================== */

const props =
    defineProps({

      sessions: {
        type: Array,
        default: () => []
      },


      loading: {
        type: Boolean,
        default: false
      }
    })


/* ==================================================
   EMITS
================================================== */

const emit =
    defineEmits([
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
   CONFIDENCE VALUE

   Matches debates store fields:

   confidenceInDebate
   confidenceScore
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
   RISK COUNT

   Priority:

   1. hydrated riskCount
   2. risks array length
================================================== */

function riskCountOf(
    session
) {

  const explicit =
      numberOrNull(
          session?.riskCount
      )


  if (
      explicit !==
      null
  ) {

    return explicit
  }


  return asArray(
      session?.risks
  )
      .length
}


/* ==================================================
   TOTAL SESSIONS
================================================== */

const totalSessions =
    computed(() =>
        props.sessions.length
    )


/* ==================================================
   ACTIVE SESSIONS
================================================== */

const activeSessions =
    computed(() =>

        props.sessions.filter(
            session =>

                session?.status ===
                'active'
        )
            .length
    )


/* ==================================================
   COMPLETED SESSIONS
================================================== */

const completedSessions =
    computed(() =>

        props.sessions.filter(
            session =>

                session?.status ===
                'completed'
        )
            .length
    )


/* ==================================================
   PANEL SESSION COUNT
================================================== */

const panelSessions =
    computed(() =>

        props.sessions.filter(
            session =>

                (
                    session?.mode

                    ??

                    session
                        ?.calibration
                        ?.councilMode
                )

                ===

                'panel'
        )
            .length
    )


/* ==================================================
   MEDIATOR SESSION COUNT
================================================== */

const mediatorSessions =
    computed(() =>

        props.sessions.filter(
            session =>

                (
                    session?.mode

                    ??

                    session
                        ?.calibration
                        ?.councilMode
                )

                ===

                'mediator'
        )
            .length
    )


/* ==================================================
   AVERAGE CONFIDENCE

   Only sessions with a real numeric confidence value
   are included in the average.

   Sessions still waiting for discussion hydration
   are ignored rather than counted as zero.
================================================== */

const confidenceValues =
    computed(() =>

        props.sessions

            .map(
                confidenceOf
            )

            .filter(
                value =>

                    value !==
                    null
            )
    )


const averageConfidence =
    computed(() => {

      if (
          !confidenceValues.value.length
      ) {

        return null
      }


      const total =
          confidenceValues.value.reduce(

              (
                  sum,
                  value
              ) =>

                  sum +
                  value,

              0
          )


      return (

          Math.round(

              (
                  total
                  /
                  confidenceValues.value.length
              )

              *

              10
          )

          /

          10
      )
    })


const averageConfidenceLabel =
    computed(() => {

      if (
          averageConfidence.value ===
          null
      ) {

        return '—'
      }


      return `${averageConfidence.value}%`
    })


/* ==================================================
   CONFIDENCE COVERAGE

   Shows how many archive records currently have
   hydrated confidence data.
================================================== */

const confidenceCoverage =
    computed(() =>

        confidenceValues.value.length
    )


/* ==================================================
   TOTAL RISKS
================================================== */

const totalRisks =
    computed(() =>

        props.sessions.reduce(

            (
                total,
                session
            ) =>

                total

                +

                riskCountOf(
                    session
                ),

            0
        )
    )


/* ==================================================
   SESSIONS WITH RISKS
================================================== */

const sessionsWithRisks =
    computed(() =>

        props.sessions.filter(
            session =>

                riskCountOf(
                    session
                ) >
                0
        )
            .length
    )


/* ==================================================
   TOTAL DISCUSSION MEMBERS

   This is archive-wide participation volume.

   It is intentionally a total across sessions,
   not a unique-character count.
================================================== */

const totalMembers =
    computed(() =>

        props.sessions.reduce(

            (
                total,
                session
            ) => {

              const explicit =
                  numberOrNull(
                      session?.memberCount
                  )


              if (
                  explicit !==
                  null
              ) {

                return total +
                    explicit
              }


              const members =

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


              return total +
                  members
            },

            0
        )
    )


/* ==================================================
   COMPLETION RATE
================================================== */

const completionRate =
    computed(() => {

      if (
          !totalSessions.value
      ) {

        return null
      }


      return Math.round(

          (
              completedSessions.value
              /
              totalSessions.value
          )

          *

          100
      )
    })


/* ==================================================
   REFRESH
================================================== */

function refresh() {

  if (
      props.loading
  ) {

    return
  }


  emit(
      'refresh'
  )
}
</script>


<template>
  <header class="sessions-header">

    <!-- ==================================================
         DECORATION
    ================================================== -->

    <div class="header-glow glow-purple" />
    <div class="header-glow glow-cyan" />

    <div class="tech-line line-a" />
    <div class="tech-line line-b" />


    <!-- ==================================================
         IDENTITY
    ================================================== -->

    <section class="identity">

      <div class="sigil-shell">

        <div class="sigil-ring outer" />

        <div class="sigil-ring inner" />

        <div class="sigil-core">
          <UsersRound :size="23" />
        </div>

      </div>


      <div class="copy">

        <div class="eyebrow">
          <span />

          <small>
            SESSION ARCHIVE // LIVE INDEX
          </small>
        </div>


        <h1>
          Council Sessions
        </h1>


        <p>
          Review active discussions, completed councils and mediator consultations.
        </p>


        <div class="session-mix">

          <span class="mix-chip panel">

            <UsersRound :size="9" />

            {{ panelSessions }}
            Panel

          </span>


          <span class="mix-chip mediator">

            <Sparkles :size="9" />

            {{ mediatorSessions }}
            Mediator

          </span>


          <span class="mix-chip participation">

            <Activity :size="9" />

            {{ totalMembers }}
            participant slots

          </span>

        </div>

      </div>

    </section>


    <!-- ==================================================
         STATS
    ================================================== -->

    <section class="stats">

      <!-- ==============================================
           TOTAL
      ============================================== -->

      <article class="stat stat-total">

        <div class="stat-top">

          <Activity :size="11" />

          <small>
            TOTAL SESSIONS
          </small>

        </div>


        <div class="stat-value">
          {{ totalSessions }}
        </div>


        <div class="stat-footer">
          Archive records
        </div>


        <span class="stat-trace" />

      </article>


      <!-- ==============================================
           ACTIVE
      ============================================== -->

      <article class="stat stat-active">

        <div class="stat-top">

          <span class="live-dot" />

          <small>
            ACTIVE
          </small>

        </div>


        <div class="stat-value">
          {{ activeSessions }}
        </div>


        <div class="stat-footer">
          In progress
        </div>


        <span class="stat-trace" />

      </article>


      <!-- ==============================================
           COMPLETED
      ============================================== -->

      <article class="stat stat-completed">

        <div class="stat-top">

          <CheckCircle2 :size="11" />

          <small>
            COMPLETED
          </small>

        </div>


        <div class="stat-value">
          {{ completedSessions }}
        </div>


        <div class="stat-footer">

          <template
              v-if="
                completionRate !==
                null
              "
          >
            {{ completionRate }}% of archive
          </template>

          <template v-else>
            No sessions yet
          </template>

        </div>


        <span class="stat-trace" />

      </article>


      <!-- ==============================================
           CONFIDENCE
      ============================================== -->

      <article class="stat stat-confidence wide">

        <div class="stat-top">

          <Gauge :size="11" />

          <small>
            AVG. CONFIDENCE
          </small>

        </div>


        <div class="wide-value-row">

          <div class="stat-value">
            {{ averageConfidenceLabel }}
          </div>


          <div class="coverage">

            <strong>
              {{ confidenceCoverage }}
            </strong>

            <span>
              scored
            </span>

          </div>

        </div>


        <div class="stat-footer">

          <template
              v-if="
                confidenceCoverage
              "
          >
            Across hydrated discussions
          </template>

          <template v-else>
            Awaiting discussion metrics
          </template>

        </div>


        <span class="stat-trace" />

      </article>


      <!-- ==============================================
           RISKS
      ============================================== -->

      <article class="stat stat-risks wide">

        <div class="stat-top">

          <ShieldAlert :size="11" />

          <small>
            IDENTIFIED RISKS
          </small>

        </div>


        <div class="wide-value-row">

          <div class="stat-value">
            {{ totalRisks }}
          </div>


          <div class="coverage risk-coverage">

            <strong>
              {{ sessionsWithRisks }}
            </strong>

            <span>
              sessions
            </span>

          </div>

        </div>


        <div class="stat-footer">
          Recorded across archive
        </div>


        <span class="stat-trace" />

      </article>

    </section>


    <!-- ==================================================
         REFRESH
    ================================================== -->

    <button
        class="refresh"
        type="button"
        :disabled="loading"
        :class="{
          loading
        }"
        aria-label="Refresh sessions"
        title="Refresh archive"
        @click="
          refresh
        "
    >
      <RefreshCw :size="13" />
    </button>

  </header>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.sessions-header {
  position: relative;

  width: 100%;
  height: 100%;

  display: grid;

  grid-template-columns:
      minmax(19vw, 1.15fr)
      minmax(0, 2fr);

  align-items: center;

  gap:
      1.35vw;

  padding:
      1vh
      1.1vw;

  overflow: hidden;

  border:
      1px solid
      rgba(73, 192, 255, .095);

  clip-path:
      polygon(
          0 0,
          calc(100% - .8vw) 0,
          100% .85vh,
          100% 100%,
          .65vw 100%,
          0 calc(100% - .65vh)
      );

  background:
      linear-gradient(
          105deg,
          rgba(4, 9, 19, .975),
          rgba(8, 11, 28, .95) 42%,
          rgba(3, 13, 24, .96)
      );

  box-shadow:
      inset 0 0 32px
      rgba(72, 169, 255, .025),

      inset 0 0 0 1px
      rgba(164, 87, 255, .018),

      0 0 16px
      rgba(29, 151, 226, .03);
}


/* ==================================================
   BACKGROUND EFFECTS
================================================== */

.header-glow {
  position: absolute;

  pointer-events: none;

  border-radius: 50%;

  filter:
      blur(15px);
}


.glow-purple {
  width:
      11vw;

  height:
      11vw;

  left:
      -5vw;

  top:
      -7vw;

  background:
      radial-gradient(
          circle,
          rgba(151, 69, 255, .14),
          transparent 70%
      );
}


.glow-cyan {
  width:
      13vw;

  height:
      13vw;

  right:
      12vw;

  bottom:
      -10vw;

  background:
      radial-gradient(
          circle,
          rgba(55, 195, 255, .07),
          transparent 70%
      );
}


/* ==================================================
   TECH LINES
================================================== */

.tech-line {
  position: absolute;

  pointer-events: none;

  opacity:
      .45;
}


.line-a {
  top:
      0;

  left:
      27%;

  width:
      7vw;

  height:
      .7vh;

  border-left:
      1px solid
      rgba(68, 202, 255, .18);

  border-bottom:
      1px solid
      rgba(68, 202, 255, .12);
}


.line-b {
  right:
      1.5vw;

  bottom:
      0;

  width:
      5vw;

  height:
      .6vh;

  border-top:
      1px solid
      rgba(169, 87, 255, .15);

  border-right:
      1px solid
      rgba(169, 87, 255, .18);
}


/* ==================================================
   IDENTITY
================================================== */

.identity {
  position: relative;
  z-index: 1;

  min-width: 0;

  display: flex;
  align-items: center;

  gap:
      .9vw;
}


/* ==================================================
   SIGIL
================================================== */

.sigil-shell {
  position: relative;

  flex:
      0 0 auto;

  width:
      3.8vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;
}


.sigil-ring {
  position: absolute;

  border:
      1px solid
      rgba(165, 79, 255, .24);
}


.sigil-ring.outer {
  inset:
      .1vw;

  transform:
      rotate(45deg);

  box-shadow:
      0 0 12px
      rgba(150, 70, 255, .07);
}


.sigil-ring.inner {
  inset:
      .72vw;

  border-color:
      rgba(61, 206, 255, .2);

  transform:
      rotate(0deg);
}


.sigil-core {
  position: relative;
  z-index: 1;

  width:
      2vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  color:
      #b16cff;

  filter:
      drop-shadow(
          0 0 6px
          rgba(177, 108, 255, .45)
      );
}


/* ==================================================
   IDENTITY COPY
================================================== */

.copy {
  min-width: 0;
}


.eyebrow {
  display: flex;
  align-items: center;

  gap:
      .35vw;

  margin-bottom:
      .38vh;
}


.eyebrow > span {
  width:
      .85vw;

  height:
      1px;

  background:
      #a85fff;

  box-shadow:
      0 0 6px
      rgba(168, 95, 255, .6);
}


.eyebrow small {
  font-size:
      .32vw;

  letter-spacing:
      .11em;

  color:
      rgba(169, 104, 235, .58);
}


.copy h1 {
  margin:
      0;

  font-family:
      Georgia,
      serif;

  font-size:
      1.28vw;

  line-height:
      1;

  font-weight:
      400;

  letter-spacing:
      -.015em;

  color:
      rgba(239, 244, 253, .94);

  text-shadow:
      0 0 12px
      rgba(199, 219, 255, .04);
}


.copy p {
  max-width:
      18vw;

  margin:
      .55vh
      0
      0;

  font-size:
      .42vw;

  line-height:
      1.4;

  color:
      rgba(146, 170, 200, .43);
}


/* ==================================================
   SESSION MIX
================================================== */

.session-mix {
  margin-top:
      .62vh;

  display: flex;
  flex-wrap: wrap;

  gap:
      .28vw;
}


.mix-chip {
  min-height:
      1.55vh;

  padding:
      .14vh
      .3vw;

  display: inline-flex;
  align-items: center;

  gap:
      .18vw;

  border:
      1px solid
      rgba(121, 150, 185, .09);

  background:
      rgba(5, 14, 28, .36);

  font-size:
      .3vw;

  color:
      rgba(145, 171, 201, .43);
}


.mix-chip.panel {
  color:
      rgba(189, 113, 255, .62);

  border-color:
      rgba(179, 98, 255, .12);
}


.mix-chip.mediator {
  color:
      rgba(81, 207, 255, .64);

  border-color:
      rgba(81, 207, 255, .12);
}


/* ==================================================
   STATS GRID
================================================== */

.stats {
  position: relative;
  z-index: 1;

  height:
      72%;

  min-height:
      0;

  display: grid;

  grid-template-columns:
      .7fr
      .65fr
      .78fr
      1.22fr
      1.22fr;

  align-items: stretch;

  border:
      1px solid
      rgba(79, 188, 244, .055);

  background:
      rgba(1, 7, 15, .25);
}


/* ==================================================
   STAT CARD
================================================== */

.stat {
  position: relative;

  min-width: 0;

  padding:
      .6vh
      .72vw;

  display: flex;
  flex-direction: column;
  justify-content: center;

  overflow: hidden;

  border-right:
      1px solid
      rgba(88, 162, 211, .07);
}


.stat:last-child {
  border-right:
      0;
}


.stat::before {
  content:
      '';

  position: absolute;

  inset:
      0;

  opacity:
      0;

  pointer-events: none;

  background:
      linear-gradient(
          145deg,
          rgba(63, 190, 244, .04),
          transparent 70%
      );

  transition:
      opacity .2s ease;
}


.stat:hover::before {
  opacity:
      1;
}


/* ==================================================
   STAT TOP
================================================== */

.stat-top {
  display: flex;
  align-items: center;

  gap:
      .27vw;

  color:
      rgba(116, 186, 226, .47);
}


.stat-top small {
  font-size:
      .33vw;

  letter-spacing:
      .085em;

  color:
      rgba(143, 169, 198, .42);
}


/* ==================================================
   STAT VALUE
================================================== */

.stat-value {
  margin-top:
      .2vh;

  font-family:
      Georgia,
      serif;

  font-size:
      1.02vw;

  line-height:
      1;

  font-weight:
      400;

  color:
      rgba(229, 238, 249, .9);

  font-variant-numeric:
      tabular-nums;
}


.stat-footer {
  margin-top:
      .25vh;

  overflow:
      hidden;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;

  font-size:
      .3vw;

  color:
      rgba(131, 157, 187, .34);
}


/* ==================================================
   ACTIVE
================================================== */

.stat-active
.stat-value,
.stat-active
.stat-top {
  color:
      #4adeca;
}


.live-dot {
  width:
      .28vw;

  aspect-ratio:
      1;

  border-radius:
      50%;

  background:
      #4adeca;

  box-shadow:
      0 0 7px
      rgba(74, 222, 202, .65);

  animation:
      live-pulse
      1.8s
      ease-in-out
      infinite;
}


/* ==================================================
   COMPLETED
================================================== */

.stat-completed
.stat-value,
.stat-completed
.stat-top {
  color:
      #5dcfff;
}


/* ==================================================
   CONFIDENCE
================================================== */

.stat-confidence
.stat-value,
.stat-confidence
.stat-top {
  color:
      #69ddff;
}


/* ==================================================
   RISKS
================================================== */

.stat-risks
.stat-value,
.stat-risks
.stat-top {
  color:
      #c17aff;
}


/* ==================================================
   WIDE VALUE ROW
================================================== */

.wide-value-row {
  display: flex;
  align-items: flex-end;

  gap:
      .55vw;
}


.coverage {
  display: flex;
  align-items: baseline;

  gap:
      .18vw;

  padding-bottom:
      .02vh;
}


.coverage strong {
  font-family:
      Georgia,
      serif;

  font-size:
      .52vw;

  font-weight:
      400;

  color:
      rgba(111, 207, 245, .66);
}


.coverage span {
  font-size:
      .27vw;

  color:
      rgba(135, 163, 194, .34);
}


.risk-coverage strong {
  color:
      rgba(194, 122, 255, .67);
}


/* ==================================================
   STAT TRACE
================================================== */

.stat-trace {
  position: absolute;

  left:
      .72vw;

  right:
      .72vw;

  bottom:
      0;

  height:
      1px;

  background:
      rgba(63, 188, 244, .045);
}


.stat-trace::after {
  content:
      '';

  display: block;

  width:
      27%;

  height:
      100%;

  background:
      rgba(83, 205, 255, .55);

  box-shadow:
      0 0 5px
      rgba(83, 205, 255, .42);
}


.stat-active
.stat-trace::after {
  background:
      #4adeca;
}


.stat-risks
.stat-trace::after {
  background:
      #b96fff;
}


/* ==================================================
   REFRESH BUTTON
================================================== */

.refresh {
  position: absolute;
  z-index: 5;

  top:
      .5vh;

  right:
      .45vw;

  width:
      1.4vw;

  aspect-ratio:
      1;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(82, 199, 255, .08);

  background:
      rgba(5, 14, 28, .32);

  color:
      rgba(82, 199, 255, .3);

  cursor:
      pointer;

  opacity:
      .42;

  transition:
      opacity .18s ease,
      color .18s ease,
      border-color .18s ease,
      background .18s ease,
      box-shadow .18s ease;
}


.sessions-header:hover
.refresh {
  opacity:
      .9;
}


.refresh:hover {
  color:
      #5bd9ff;

  border-color:
      rgba(91, 217, 255, .28);

  background:
      rgba(35, 130, 174, .08);

  box-shadow:
      0 0 8px
      rgba(72, 204, 255, .08);
}


.refresh:disabled {
  cursor:
      wait;

  opacity:
      .5;
}


.refresh.loading svg {
  animation:
      spin
      .85s
      linear
      infinite;
}


/* ==================================================
   ANIMATIONS
================================================== */

@keyframes spin {

  to {
    transform:
        rotate(360deg);
  }
}


@keyframes live-pulse {

  0%,
  100% {
    opacity:
        .45;

    box-shadow:
        0 0 3px
        rgba(74, 222, 202, .3);
  }

  50% {
    opacity:
        1;

    box-shadow:
        0 0 8px
        rgba(74, 222, 202, .75);
  }
}
</style>
