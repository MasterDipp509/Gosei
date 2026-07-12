<script setup>
import {
  computed,
  ref,
  watch
} from 'vue'


const props = defineProps({
  step: {
    type: String,
    default: 'entry'
  },

  activeSession: {
    type: Object,
    default: null
  },

  resumableSessions: {
    type: Array,
    default: () => []
  }
})


const emit = defineEmits([
  'new-session',
  'selection-back',
  'start-session',
  'continue-session'
])


const selectedResumeId = ref(
    props.resumableSessions?.[0]?.id ??
    null
)


watch(
    () => props.resumableSessions,
    sessions => {
      if (
          !selectedResumeId.value &&
          sessions?.length
      ) {
        selectedResumeId.value =
            sessions[0].id
      }
    },
    {
      deep: true
    }
)


const selectedResumeSession = computed(() =>
    props.resumableSessions.find(
        session =>
            String(session.id) ===
            String(selectedResumeId.value)
    ) ??
    props.resumableSessions[0] ??
    null
)


const canContinue = computed(() =>
    Boolean(selectedResumeSession.value)
)


const continueSession = () => {
  if (!selectedResumeSession.value) {
    return
  }

  emit(
      'continue-session',
      selectedResumeSession.value
  )
}


const selectSession = session => {
  selectedResumeId.value =
      session.id
}
</script>


<template>
  <section class="chamber-select">

    <div class="select-ambient-grid"></div>

    <div class="select-vignette"></div>


    <Transition
        name="selection-swap"
        mode="out-in"
    >

      <div
          v-if="step === 'entry'"
          key="entry"
          class="selection-screen"
      >

        <header class="selection-header">

          <span class="selection-eyebrow">
            THE CHAMBER
          </span>

          <h1>
            Enter the council.
          </h1>

          <p>
            Resume an existing discussion or
            convene a new session.
          </p>

        </header>


        <div class="entry-options">

          <button
              class="choice-card continue-card"
              :class="{
              disabled: !canContinue
            }"
              :disabled="!canContinue"
              @click="continueSession"
          >

            <div class="card-art">

              <svg
                  viewBox="0 0 600 360"
                  xmlns="http://www.w3.org/2000/svg"
              >

                <g class="continue-svg">

                  <path
                      class="svg-floor"
                      d="
                      M80 300
                      L300 168
                      L520 300
                    "
                  />

                  <path
                      class="svg-table"
                      d="
                      M126 262
                      Q300 130 474 262
                      L440 304
                      Q300 222 160 304
                      Z
                    "
                  />

                  <ellipse
                      class="svg-center-ring"
                      cx="300"
                      cy="224"
                      rx="48"
                      ry="24"
                  />

                  <g class="seat seat-one">
                    <circle
                        cx="198"
                        cy="185"
                        r="22"
                    />
                    <path
                        d="
                        M170 242
                        Q198 202 226 242
                      "
                    />
                  </g>

                  <g class="seat seat-two">
                    <circle
                        cx="256"
                        cy="145"
                        r="22"
                    />
                    <path
                        d="
                        M228 202
                        Q256 162 284 202
                      "
                    />
                  </g>

                  <g class="seat seat-three">
                    <circle
                        cx="344"
                        cy="145"
                        r="22"
                    />
                    <path
                        d="
                        M316 202
                        Q344 162 372 202
                      "
                    />
                  </g>

                  <g class="seat seat-four">
                    <circle
                        cx="402"
                        cy="185"
                        r="22"
                    />
                    <path
                        d="
                        M374 242
                        Q402 202 430 242
                      "
                    />
                  </g>

                  <path
                      class="resume-line"
                      d="
                      M300 264
                      C252 264 226 246 226 222
                      C226 198 252 184 276 184
                    "
                  />

                  <path
                      class="resume-arrow"
                      d="
                      M266 172
                      L286 184
                      L268 198
                    "
                  />

                </g>

              </svg>

            </div>


            <div class="card-copy">

              <span class="card-index">
                01
              </span>

              <div>

                <h2>
                  Continue Session
                </h2>

                <p v-if="canContinue">
                  Return to an active council
                  discussion.
                </p>

                <p v-else>
                  No resumable discussions are
                  currently available.
                </p>

              </div>

            </div>

          </button>


          <button
              class="choice-card new-card"
              @click="$emit('new-session')"
          >

            <div class="card-art">

              <svg
                  viewBox="0 0 600 360"
                  xmlns="http://www.w3.org/2000/svg"
              >

                <g class="new-svg">

                  <path
                      class="svg-floor"
                      d="
                      M80 300
                      L300 168
                      L520 300
                    "
                  />

                  <path
                      class="svg-table"
                      d="
                      M126 262
                      Q300 130 474 262
                      L440 304
                      Q300 222 160 304
                      Z
                    "
                  />

                  <g class="empty-seat">

                    <circle
                        cx="300"
                        cy="145"
                        r="24"
                    />

                    <path
                        d="
                        M266 210
                        Q300 158 334 210
                      "
                    />

                  </g>


                  <circle
                      class="new-session-ring outer"
                      cx="300"
                      cy="225"
                      r="52"
                  />

                  <circle
                      class="new-session-ring inner"
                      cx="300"
                      cy="225"
                      r="30"
                  />

                  <path
                      class="plus-line"
                      d="
                      M300 207
                      V243
                      M282 225
                      H318
                    "
                  />

                </g>

              </svg>

            </div>


            <div class="card-copy">

              <span class="card-index">
                02
              </span>

              <div>

                <h2>
                  New Session
                </h2>

                <p>
                  Bring a new matter before the
                  council.
                </p>

              </div>

            </div>

          </button>

        </div>


        <div
            v-if="resumableSessions.length > 1"
            class="resume-strip"
        >

          <span class="resume-label">
            RESUMABLE
          </span>

          <button
              v-for="session in resumableSessions"
              :key="session.id"
              class="resume-item"
              :class="{
              active:
                String(selectedResumeId) ===
                String(session.id)
            }"
              @click="selectSession(session)"
          >

            <span class="resume-dot"></span>

            <span>
              {{
                session.title ??
                session.name ??
                'Untitled Session'
              }}
            </span>

          </button>

        </div>

      </div>


      <div
          v-else
          key="composition"
          class="selection-screen composition-screen"
      >

        <button
            class="selection-back"
            @click="$emit('selection-back')"
        >
          <span>←</span>
          Back
        </button>


        <header class="selection-header">

          <span class="selection-eyebrow">
            COUNCIL FORMAT
          </span>

          <h1>
            Who should sit at the table?
          </h1>

          <p>
            Choose how the Chamber should
            examine your discussion.
          </p>

        </header>


        <div class="composition-options">

          <button
              class="choice-card mode-card panel-mode"
              @click="$emit(
              'start-session',
              'panel'
            )"
          >

            <div class="card-art mode-art">

              <svg
                  viewBox="0 0 600 360"
                  xmlns="http://www.w3.org/2000/svg"
              >

                <g class="panel-svg">

                  <path
                      class="svg-table"
                      d="
                      M86 290
                      Q300 100 514 290
                      L474 326
                      Q300 206 126 326
                      Z
                    "
                  />


                  <g
                      class="panel-person person-one"
                  >
                    <circle
                        cx="150"
                        cy="212"
                        r="25"
                    />

                    <path
                        d="
                        M112 282
                        Q150 224 188 282
                      "
                    />
                  </g>


                  <g
                      class="panel-person person-two"
                  >
                    <circle
                        cx="226"
                        cy="142"
                        r="25"
                    />

                    <path
                        d="
                        M188 212
                        Q226 154 264 212
                      "
                    />
                  </g>


                  <g
                      class="panel-person person-three"
                  >
                    <circle
                        cx="300"
                        cy="112"
                        r="27"
                    />

                    <path
                        d="
                        M258 190
                        Q300 124 342 190
                      "
                    />
                  </g>


                  <g
                      class="panel-person person-four"
                  >
                    <circle
                        cx="374"
                        cy="142"
                        r="25"
                    />

                    <path
                        d="
                        M336 212
                        Q374 154 412 212
                      "
                    />
                  </g>


                  <g
                      class="panel-person person-five"
                  >
                    <circle
                        cx="450"
                        cy="212"
                        r="25"
                    />

                    <path
                        d="
                        M412 282
                        Q450 224 488 282
                      "
                    />
                  </g>


                  <circle
                      class="panel-core"
                      cx="300"
                      cy="246"
                      r="32"
                  />

                  <path
                      class="panel-connection"
                      d="
                      M150 236
                      L280 248

                      M226 166
                      L288 228

                      M300 139
                      V214

                      M374 166
                      L312 228

                      M450 236
                      L320 248
                    "
                  />

                </g>

              </svg>

            </div>


            <div class="card-copy">

              <span class="card-index">
                PANEL
              </span>

              <div>

                <h2>
                  Full Council
                </h2>

                <p>
                  Multiple perspectives debate,
                  challenge and examine the issue
                  together.
                </p>

              </div>

            </div>

          </button>


          <button
              class="choice-card mode-card mediator-mode"
              @click="$emit(
              'start-session',
              'mediator'
            )"
          >

            <div class="card-art mode-art">

              <svg
                  viewBox="0 0 600 360"
                  xmlns="http://www.w3.org/2000/svg"
              >

                <g class="mediator-svg">

                  <path
                      class="mediator-desk"
                      d="
                      M142 264
                      Q300 194 458 264
                      L430 312
                      Q300 260 170 312
                      Z
                    "
                  />


                  <circle
                      class="mediator-head"
                      cx="300"
                      cy="128"
                      r="34"
                  />


                  <path
                      class="mediator-body"
                      d="
                      M240 238
                      Q252 158 300 158
                      Q348 158 360 238
                      Z
                    "
                  />


                  <circle
                      class="mediator-orbit orbit-one"
                      cx="300"
                      cy="188"
                      r="74"
                  />

                  <circle
                      class="mediator-orbit orbit-two"
                      cx="300"
                      cy="188"
                      r="104"
                  />


                  <path
                      class="mediator-line"
                      d="
                      M196 188
                      H246

                      M354 188
                      H404

                      M300 84
                      V104
                    "
                  />

                  <circle
                      class="med-node node-one"
                      cx="196"
                      cy="188"
                      r="8"
                  />

                  <circle
                      class="med-node node-two"
                      cx="404"
                      cy="188"
                      r="8"
                  />

                  <circle
                      class="med-node node-three"
                      cx="300"
                      cy="84"
                      r="8"
                  />

                </g>

              </svg>

            </div>


            <div class="card-copy">

              <span class="card-index">
                SOLO
              </span>

              <div>

                <h2>
                  Mediator Only
                </h2>

                <p>
                  A focused one-on-one discussion
                  guided by a single neutral
                  mediator.
                </p>

              </div>

            </div>

          </button>

        </div>

      </div>

    </Transition>

  </section>
</template>


<style scoped>
.chamber-select {
  --blue: #4bc8ff;
  --blue-bright: #a1ecff;
  --purple: #9f62ff;
  --purple-bright: #d3afff;
  --black: #020207;
  --panel: rgba(5, 7, 16, 0.94);
  --text: #edf7ff;
  --soft: #8da2ba;
  --dim: #526176;

  position: relative;

  width: 100%;
  height: 100%;

  min-height: 0;

  background: var(--black);

  overflow: hidden;

  color: var(--text);
}


.select-ambient-grid {
  position: absolute;

  inset: 0;

  opacity: 0.16;

  background-image:
      linear-gradient(
          rgba(75, 200, 255, 0.12) 1px,
          transparent 1px
      ),
      linear-gradient(
          90deg,
          rgba(75, 200, 255, 0.12) 1px,
          transparent 1px
      );

  background-size:
      5rem 5rem;

  mask-image:
      linear-gradient(
          to bottom,
          transparent,
          black 22%,
          black 76%,
          transparent
      );

  pointer-events: none;
}


.select-vignette {
  position: absolute;

  inset: 0;

  box-shadow:
      inset 0 0 10rem rgba(0, 0, 0, 0.96);

  pointer-events: none;
}


.selection-screen {
  position: relative;

  z-index: 2;

  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;

  padding:
      clamp(2rem, 4vw, 4rem)
      clamp(1.5rem, 5vw, 6rem);

  box-sizing: border-box;
}


.selection-header {
  text-align: center;

  max-width: 48rem;

  margin-bottom:
      clamp(2rem, 4vh, 3.8rem);
}


.selection-eyebrow {
  display: block;

  margin-bottom: 0.7rem;

  color: var(--blue);

  font-size: 0.72rem;
  font-weight: 800;

  letter-spacing: 0.3em;
}


.selection-header h1 {
  margin: 0;

  font-size:
      clamp(2rem, 4vw, 4.3rem);

  line-height: 1;

  letter-spacing: -0.045em;
}


.selection-header p {
  margin:
      1rem auto 0;

  max-width: 34rem;

  color: var(--soft);

  font-size:
      clamp(0.9rem, 1.2vw, 1.08rem);

  line-height: 1.7;
}


.entry-options,
.composition-options {
  width:
      min(100%, 76rem);

  flex: 1;

  min-height: 0;

  display: grid;

  grid-template-columns:
      repeat(
          2,
          minmax(0, 1fr)
      );

  gap:
      clamp(1rem, 2vw, 2rem);
}


.choice-card {
  position: relative;

  min-width: 0;
  min-height: 0;

  padding: 0;

  display: flex;
  flex-direction: column;

  color: inherit;

  background:
      rgba(4, 6, 14, 0.9);

  border:
      1px solid rgba(75, 200, 255, 0.16);

  cursor: pointer;

  overflow: hidden;

  text-align: left;

  transition:
      transform 280ms ease,
      border-color 280ms ease,
      box-shadow 280ms ease;
}


.choice-card::after {
  content: '';

  position: absolute;

  left: 0;
  right: 0;
  bottom: 0;

  height: 2px;

  background: var(--blue);

  transform: scaleX(0);

  transform-origin: left;

  transition:
      transform 320ms ease;
}


.choice-card:hover {
  transform:
      translateY(-0.45rem);

  border-color:
      rgba(75, 200, 255, 0.72);

  box-shadow:
      0 0 2.5rem
      rgba(75, 200, 255, 0.12);
}


.choice-card:hover::after {
  transform: scaleX(1);
}


.choice-card.disabled {
  cursor: not-allowed;

  opacity: 0.42;
}


.choice-card.disabled:hover {
  transform: none;

  box-shadow: none;
}


.card-art {
  flex: 1;

  min-height: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 1.5rem;
}


.card-art svg {
  width: 100%;
  height: 100%;

  max-height: 24rem;

  overflow: visible;
}


.card-copy {
  min-height: 7.5rem;

  display: grid;

  grid-template-columns:
      auto minmax(0, 1fr);

  align-items: center;

  gap: 1.2rem;

  padding:
      1.2rem
      clamp(1.2rem, 2vw, 2rem);

  border-top:
      1px solid
      rgba(255, 255, 255, 0.06);
}


.card-index {
  color: var(--blue);

  font-size: 0.68rem;
  font-weight: 900;

  letter-spacing: 0.2em;
}


.card-copy h2 {
  margin: 0;

  font-size:
      clamp(1.1rem, 1.7vw, 1.6rem);
}


.card-copy p {
  margin:
      0.45rem 0 0;

  color: var(--soft);

  font-size: 0.82rem;

  line-height: 1.55;
}


.svg-floor,
.svg-table,
.mediator-desk {
  fill:
      rgba(75, 200, 255, 0.025);

  stroke:
      rgba(75, 200, 255, 0.75);

  stroke-width: 2;
}


.seat circle,
.empty-seat circle,
.panel-person circle,
.mediator-head {
  fill:
      rgba(75, 200, 255, 0.08);

  stroke: var(--blue);

  stroke-width: 2;
}


.seat path,
.empty-seat path,
.panel-person path,
.mediator-body {
  fill:
      rgba(159, 98, 255, 0.05);

  stroke: var(--purple);

  stroke-width: 2;
}


.svg-center-ring,
.new-session-ring,
.panel-core,
.mediator-orbit {
  fill: none;

  stroke: var(--blue);

  stroke-width: 2;
}


.resume-line,
.resume-arrow,
.plus-line,
.panel-connection,
.mediator-line {
  fill: none;

  stroke: var(--blue-bright);

  stroke-width: 3;

  stroke-linecap: round;
  stroke-linejoin: round;
}


.new-session-ring.outer,
.mediator-orbit.orbit-two {
  opacity: 0.25;
}


.new-session-ring.inner,
.mediator-orbit.orbit-one {
  opacity: 0.6;
}


.panel-core {
  fill:
      rgba(75, 200, 255, 0.08);

  filter:
      drop-shadow(
          0 0 0.8rem
          rgba(75, 200, 255, 0.8)
      );
}


.panel-connection {
  opacity: 0.45;
}


.med-node {
  fill: var(--purple);

  filter:
      drop-shadow(
          0 0 0.5rem
          var(--purple)
      );
}


.resume-strip {
  width:
      min(100%, 76rem);

  margin-top: 1.2rem;

  display: flex;
  align-items: center;

  gap: 0.75rem;

  overflow-x: auto;

  scrollbar-width: none;
}


.resume-strip::-webkit-scrollbar {
  display: none;
}


.resume-label {
  flex: 0 0 auto;

  color: var(--dim);

  font-size: 0.62rem;
  font-weight: 900;

  letter-spacing: 0.2em;
}


.resume-item {
  flex: 0 0 auto;

  display: flex;
  align-items: center;

  gap: 0.55rem;

  padding:
      0.65rem 0.9rem;

  background:
      rgba(255, 255, 255, 0.025);

  border:
      1px solid
      rgba(255, 255, 255, 0.06);

  color: var(--soft);

  cursor: pointer;
}


.resume-item.active {
  color: var(--text);

  border-color:
      rgba(75, 200, 255, 0.42);
}


.resume-dot {
  width: 0.4rem;
  height: 0.4rem;

  border-radius: 50%;

  background: var(--blue);
}


.selection-back {
  position: absolute;

  top:
      clamp(1.5rem, 3vw, 3rem);

  left:
      clamp(1.5rem, 4vw, 4rem);

  display: flex;
  align-items: center;

  gap: 0.65rem;

  padding:
      0.6rem 0.9rem;

  color: var(--soft);

  background: transparent;

  border: 0;

  cursor: pointer;
}


.selection-back:hover {
  color: var(--blue);
}


.selection-swap-enter-active,
.selection-swap-leave-active {
  transition:
      opacity 220ms ease,
      transform 360ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.selection-swap-enter-from {
  opacity: 0;

  transform:
      translateX(2rem)
      scale(0.992);
}


.selection-swap-leave-to {
  opacity: 0;

  transform:
      translateX(-1.5rem)
      scale(0.996);
}


@media (max-width: 820px) {
  .selection-screen {
    overflow-y: auto;
  }


  .entry-options,
  .composition-options {
    flex: none;

    grid-template-columns: 1fr;
  }


  .choice-card {
    min-height: 27rem;
  }


  .selection-back {
    position: relative;

    align-self: flex-start;

    top: auto;
    left: auto;

    margin-bottom: 1rem;
  }
}
</style>
