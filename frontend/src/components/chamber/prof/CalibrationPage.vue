<script setup>
import {
  computed,
  nextTick,
  ref
} from 'vue'


const props = defineProps({
  session: {
    type: Object,
    default: null
  },

  councilMode: {
    type: String,
    default: 'panel'
  },

  existingCalibration: {
    type: Object,
    default: null
  }
})


const emit = defineEmits([
  'complete',
  'back'
])


const step = ref(0)

const isLocking = ref(false)

const topicInput = ref(null)


const form = ref({
  topic:
      props.existingCalibration?.topic ??
      '',

  objective:
      props.existingCalibration?.objective ??
      '',

  context:
      props.existingCalibration?.context ??
      '',

  approach:
      props.existingCalibration?.approach ??
      'balanced'
})


const steps = computed(() => [
  {
    key: 'topic',
    number: '01',
    label: 'ISSUE'
  },

  {
    key: 'objective',
    number: '02',
    label: 'OUTCOME'
  },

  {
    key: 'context',
    number: '03',
    label: 'CONTEXT'
  },

  {
    key: 'approach',
    number: '04',
    label: 'APPROACH'
  }
])


const approaches = [
  {
    id: 'supportive',
    index: '01',
    title: 'Supportive',
    description:
        'Explore the idea constructively, refine weak areas and help build a stronger path forward.',

    intensity: 34
  },

  {
    id: 'balanced',
    index: '02',
    title: 'Balanced',
    description:
        'Challenge assumptions where needed while still giving practical, constructive direction.',

    intensity: 63
  },

  {
    id: 'adversarial',
    index: '03',
    title: 'Adversarial',
    description:
        'Pressure-test the idea aggressively. Find contradictions, hidden risks and weak reasoning.',

    intensity: 92
  }
]


const objectiveOptions = computed(() => {
  if (
      props.councilMode ===
      'mediator'
  ) {
    return [
      {
        id: 'clarity',
        label: 'Gain clarity',
        text:
            'Untangle the issue and find the real problem underneath it.'
      },

      {
        id: 'decision',
        label: 'Make a decision',
        text:
            'Compare the options and leave with a clear direction.'
      },

      {
        id: 'reflection',
        label: 'Think it through',
        text:
            'Explore the issue openly without forcing an immediate conclusion.'
      },

      {
        id: 'resolution',
        label: 'Resolve a conflict',
        text:
            'Examine competing priorities and find a workable middle ground.'
      }
    ]
  }

  return [
    {
      id: 'decision',
      label: 'Make a decision',
      text:
          'Compare options and determine the strongest path forward.'
    },

    {
      id: 'strategy',
      label: 'Build a strategy',
      text:
          'Turn the issue into a structured plan with actions and priorities.'
    },

    {
      id: 'risk',
      label: 'Find the risks',
      text:
          'Expose weaknesses, blind spots and possible points of failure.'
    },

    {
      id: 'validate',
      label: 'Challenge an idea',
      text:
          'Pressure-test the concept before committing time or resources.'
    }
  ]
})


const currentStep = computed(() =>
    steps.value[step.value]
)


const progress = computed(() =>
    ((step.value + 1) /
        steps.value.length) *
    100
)


const canContinue = computed(() => {
  if (
      step.value === 0
  ) {
    return (
        form.value.topic
            .trim()
            .length >= 5
    )
  }

  if (
      step.value === 1
  ) {
    return Boolean(
        form.value.objective
    )
  }

  return true
})


const selectedObjective = computed(() =>
    objectiveOptions.value.find(
        option =>
            option.id ===
            form.value.objective
    ) ??
    null
)


const selectObjective = id => {
  form.value.objective = id
}


const goNext = async () => {
  if (!canContinue.value) {
    return
  }

  if (
      step.value <
      steps.value.length - 1
  ) {
    step.value += 1

    await nextTick()

    return
  }

  completeCalibration()
}


const goBack = () => {
  if (
      step.value > 0
  ) {
    step.value -= 1

    return
  }

  emit('back')
}


const completeCalibration = () => {
  isLocking.value = true

  window.setTimeout(() => {
    emit(
        'complete',
        {
          topic:
              form.value.topic.trim(),

          objective:
              selectedObjective.value?.label ??
              form.value.objective,

          objectiveId:
          form.value.objective,

          context:
              form.value.context.trim(),

          approach:
          form.value.approach,

          councilMode:
          props.councilMode
        }
    )
  }, 1150)
}
</script>


<template>
  <section class="calibration-page">

    <div class="calibration-grid"></div>

    <div class="calibration-vignette"></div>


    <Transition
        name="lock-screen"
    >

      <div
          v-if="isLocking"
          class="locking-screen"
      >

        <div class="locking-core">

          <div class="lock-ring lock-ring-one"></div>

          <div class="lock-ring lock-ring-two"></div>

          <div class="lock-ring lock-ring-three"></div>


          <svg
              class="lock-symbol"
              viewBox="0 0 120 120"
              xmlns="http://www.w3.org/2000/svg"
          >

            <circle
                cx="60"
                cy="60"
                r="27"
            />

            <path
                d="
                M60 18
                V36

                M60 84
                V102

                M18 60
                H36

                M84 60
                H102
              "
            />

            <path
                d="
                M42 60
                L54 72
                L79 45
              "
            />

          </svg>


          <span class="locking-eyebrow">
            CALIBRATION COMPLETE
          </span>

          <h2>
            The Chamber is ready.
          </h2>

          <p>
            Council parameters locked.
          </p>

        </div>

      </div>

    </Transition>


    <header class="calibration-header">

      <button
          class="back-button"
          @click="goBack"
      >

        <span>←</span>

        Back

      </button>


      <div class="header-center">

        <span class="header-kicker">
          CHAMBER CALIBRATION
        </span>

        <span class="header-mode">

          {{
            councilMode === 'panel'
                ? 'FULL COUNCIL'
                : 'MEDIATOR'
          }}

        </span>

      </div>


      <span class="header-step">
        {{ currentStep.number }}
        /
        04
      </span>

    </header>


    <div class="progress-track">

      <span
          class="progress-fill"
          :style="{
          width: `${progress}%`
        }"
      ></span>

      <span
          v-for="(
          item,
          index
        ) in steps"
          :key="item.key"
          class="progress-node"
          :class="{
          active:
            index === step,

          complete:
            index < step
        }"
      >

        <span class="node-dot"></span>

        <span class="node-label">
          {{ item.label }}
        </span>

      </span>

    </div>


    <main class="calibration-stage">

      <Transition
          name="calibration-step"
          mode="out-in"
      >

        <section
            v-if="step === 0"
            key="topic"
            class="step-page topic-step"
        >

          <div class="step-copy">

            <span class="step-index">
              01 — DEFINE THE ISSUE
            </span>

            <h1>
              What are we bringing
              before the council?
            </h1>

            <p>
              Describe the decision, problem or
              idea you want examined.
            </p>

          </div>


          <div class="topic-input-shell">

            <div class="input-corner corner-top-left"></div>

            <div class="input-corner corner-top-right"></div>

            <div class="input-corner corner-bottom-left"></div>

            <div class="input-corner corner-bottom-right"></div>


            <textarea
                ref="topicInput"
                v-model="form.topic"
                maxlength="500"
                placeholder="I need to decide whether..."
                autofocus
                @keydown.ctrl.enter.prevent="
                goNext
              "
            ></textarea>


            <div class="topic-input-footer">

              <span>
                {{
                  form.topic.length
                }}
                / 500
              </span>

              <span>
                CTRL + ENTER TO CONTINUE
              </span>

            </div>

          </div>


          <div class="signal-visual">

            <svg
                viewBox="0 0 800 240"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >

              <path
                  class="signal-line dim"
                  d="
                  M0 120
                  C80 120 92 82 150 82
                  C205 82 208 154 270 154
                  C332 154 340 56 412 56
                  C486 56 490 174 558 174
                  C628 174 634 104 690 104
                  C746 104 760 120 800 120
                "
              />

              <path
                  class="signal-line bright"
                  d="
                  M0 120
                  C80 120 92 82 150 82
                  C205 82 208 154 270 154
                  C332 154 340 56 412 56
                  C486 56 490 174 558 174
                  C628 174 634 104 690 104
                  C746 104 760 120 800 120
                "
              />

            </svg>

          </div>

        </section>


        <section
            v-else-if="step === 1"
            key="objective"
            class="step-page objective-step"
        >

          <div class="step-copy">

            <span class="step-index">
              02 — SET THE OUTCOME
            </span>

            <h1>
              What do you need
              from this session?
            </h1>

            <p>
              This tells the Chamber what success
              should look like.
            </p>

          </div>


          <div class="objective-grid">

            <button
                v-for="option in objectiveOptions"
                :key="option.id"
                class="objective-card"
                :class="{
                selected:
                  form.objective ===
                  option.id
              }"
                @click="
                selectObjective(
                  option.id
                )
              "
            >

              <div class="objective-mark">

                <span
                    class="objective-ring"
                ></span>

                <span
                    class="objective-core"
                ></span>

              </div>


              <div class="objective-copy">

                <h3>
                  {{ option.label }}
                </h3>

                <p>
                  {{ option.text }}
                </p>

              </div>


              <span class="selection-line"></span>

            </button>

          </div>

        </section>


        <section
            v-else-if="step === 2"
            key="context"
            class="step-page context-step"
        >

          <div class="step-copy">

            <span class="step-index">
              03 — PROVIDE CONTEXT
            </span>

            <h1>
              What should the Chamber
              know before speaking?
            </h1>

            <p>
              Add constraints, history, stakes or
              anything that changes how the issue
              should be understood.
            </p>

          </div>


          <div class="context-layout">

            <div class="context-input-shell">

              <textarea
                  v-model="form.context"
                  maxlength="1800"
                  placeholder="Relevant background, limitations, deadlines, people involved..."
              ></textarea>


              <div class="context-footer">

                <span>
                  OPTIONAL CONTEXT
                </span>

                <span>
                  {{
                    form.context.length
                  }}
                  / 1800
                </span>

              </div>

            </div>


            <aside class="context-scan">

              <span class="scan-label">
                CONTEXT CHANNEL
              </span>


              <div class="scan-core">

                <span class="scan-ring ring-a"></span>

                <span class="scan-ring ring-b"></span>

                <span class="scan-ring ring-c"></span>

                <span class="scan-center">

                  {{
                    form.context.length > 0
                        ? 'SYNC'
                        : 'IDLE'
                  }}

                </span>

              </div>


              <p>

                {{
                  form.context.length > 0
                      ? 'Additional context registered.'
                      : 'No additional context supplied.'
                }}

              </p>

            </aside>

          </div>

        </section>


        <section
            v-else
            key="approach"
            class="step-page approach-step"
        >

          <div class="step-copy">

            <span class="step-index">
              04 — TUNE THE CHAMBER
            </span>

            <h1>
              How hard should they
              push back?
            </h1>

            <p>
              Set the tone of the reasoning.
              This changes how aggressively your
              assumptions are challenged.
            </p>

          </div>


          <div class="approach-list">

            <button
                v-for="approach in approaches"
                :key="approach.id"
                class="approach-option"
                :class="{
                selected:
                  form.approach ===
                  approach.id
              }"
                @click="
                form.approach =
                  approach.id
              "
            >

              <span class="approach-index">
                {{ approach.index }}
              </span>


              <div class="approach-info">

                <h3>
                  {{ approach.title }}
                </h3>

                <p>
                  {{
                    approach.description
                  }}
                </p>

              </div>


              <div class="intensity-visual">

                <span class="intensity-label">
                  INTENSITY
                </span>

                <div class="intensity-track">

                  <span
                      class="intensity-fill"
                      :style="{
                      width:
                        `${approach.intensity}%`
                    }"
                  ></span>

                </div>

              </div>


              <span class="option-edge"></span>

            </button>

          </div>

        </section>

      </Transition>

    </main>


    <footer class="calibration-footer">

      <div class="footer-signal">

        <span class="signal-dot"></span>

        <span>
          INPUT CHANNEL ACTIVE
        </span>

      </div>


      <button
          class="continue-button"
          :disabled="!canContinue"
          @click="goNext"
      >

        <span>

          {{
            step === 3
                ? 'Calibrate Chamber'
                : 'Continue'
          }}

        </span>


        <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >

          <path
              d="
              M5 12
              H19

              M14 7
              L19 12
              L14 17
            "
          />

        </svg>

      </button>

    </footer>

  </section>
</template>


<style scoped>
.calibration-page {
  --blue: #4bc8ff;
  --blue-bright: #a4ecff;

  --purple: #9f62ff;
  --purple-bright: #d2adff;

  --black: #010104;

  --panel:
      rgba(4, 6, 14, 0.94);

  --text: #edf8ff;

  --soft: #91a5bc;

  --dim: #526174;


  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  display: flex;
  flex-direction: column;

  background: var(--black);

  color: var(--text);

  overflow: hidden;
}


.calibration-grid {
  position: absolute;

  inset: 0;

  opacity: 0.16;

  background-image:
      linear-gradient(
          rgba(75, 200, 255, 0.1) 1px,
          transparent 1px
      ),
      linear-gradient(
          90deg,
          rgba(75, 200, 255, 0.1) 1px,
          transparent 1px
      );

  background-size:
      5rem 5rem;

  mask-image:
      linear-gradient(
          to bottom,
          transparent,
          black 15%,
          black 80%,
          transparent
      );

  pointer-events: none;
}


.calibration-vignette {
  position: absolute;

  inset: 0;

  box-shadow:
      inset 0 0 12rem
      rgba(0, 0, 0, 0.95);

  pointer-events: none;
}


.calibration-header {
  position: relative;

  z-index: 4;

  flex: 0 0 auto;

  min-height: 4.5rem;

  display: grid;

  grid-template-columns:
      1fr
      auto
      1fr;

  align-items: center;

  gap: 1rem;

  padding:
      0 2rem;

  border-bottom:
      1px solid
      rgba(75, 200, 255, 0.12);

  background:
      rgba(1, 1, 4, 0.84);
}


.back-button {
  justify-self: start;

  display: flex;
  align-items: center;

  gap: 0.6rem;

  padding: 0;

  border: 0;

  background: transparent;

  color: var(--soft);

  font-size: 0.74rem;

  cursor: pointer;

  transition:
      color 180ms ease;
}


.back-button:hover {
  color: var(--blue);
}


.header-center {
  text-align: center;
}


.header-kicker {
  display: block;

  color: var(--blue);

  font-size: 0.58rem;
  font-weight: 900;

  letter-spacing: 0.22em;
}


.header-mode {
  display: block;

  margin-top: 0.25rem;

  color: var(--dim);

  font-size: 0.56rem;

  letter-spacing: 0.14em;
}


.header-step {
  justify-self: end;

  color: var(--soft);

  font-size: 0.66rem;
  font-weight: 800;

  letter-spacing: 0.1em;
}


.progress-track {
  position: relative;

  z-index: 4;

  flex: 0 0 4.2rem;

  display: grid;

  grid-template-columns:
      repeat(
          4,
          minmax(0, 1fr)
      );

  align-items: center;

  margin:
      0
      clamp(2rem, 8vw, 9rem);

  border-bottom:
      1px solid
      rgba(255, 255, 255, 0.05);
}


.progress-track::before {
  content: '';

  position: absolute;

  left: 0;
  right: 0;

  top: 50%;

  height: 1px;

  background:
      rgba(75, 200, 255, 0.14);
}


.progress-fill {
  position: absolute;

  left: 0;
  top: 50%;

  height: 1px;

  background: var(--blue);

  box-shadow:
      0 0 0.7rem
      rgba(75, 200, 255, 0.8);

  transition:
      width 420ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.progress-node {
  position: relative;

  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 0.55rem;

  color: var(--dim);

  font-size: 0.55rem;
  font-weight: 800;

  letter-spacing: 0.12em;

  transition:
      color 200ms ease;
}


.node-dot {
  width: 0.44rem;
  height: 0.44rem;

  border-radius: 50%;

  background: #111722;

  border:
      1px solid
      rgba(75, 200, 255, 0.34);

  transition:
      background 200ms ease,
      box-shadow 200ms ease,
      transform 200ms ease;
}


.progress-node.active,
.progress-node.complete {
  color: var(--text);
}


.progress-node.active
.node-dot {
  background: var(--blue);

  transform: scale(1.35);

  box-shadow:
      0 0 0.8rem
      var(--blue);
}


.progress-node.complete
.node-dot {
  background:
      var(--purple);

  border-color:
      var(--purple);

  box-shadow:
      0 0 0.5rem
      rgba(159, 98, 255, 0.7);
}


.calibration-stage {
  position: relative;

  z-index: 3;

  flex: 1;

  min-width: 0;
  min-height: 0;

  overflow: hidden;
}


.step-page {
  position: absolute;

  inset: 0;

  display: flex;
  flex-direction: column;

  padding:
      clamp(2rem, 4vh, 3.5rem)
      clamp(2rem, 8vw, 9rem);

  box-sizing: border-box;
}


.step-copy {
  max-width: 53rem;
}


.step-index {
  display: block;

  margin-bottom: 0.8rem;

  color: var(--blue);

  font-size: 0.62rem;
  font-weight: 900;

  letter-spacing: 0.2em;
}


.step-copy h1 {
  margin: 0;

  max-width: 49rem;

  font-size:
      clamp(2.2rem, 4.2vw, 4.6rem);

  line-height: 0.98;

  letter-spacing: -0.045em;
}


.step-copy p {
  max-width: 40rem;

  margin:
      1.1rem 0 0;

  color: var(--soft);

  font-size:
      clamp(
          0.86rem,
          1.1vw,
          1.02rem
      );

  line-height: 1.65;
}


.topic-input-shell {
  position: relative;

  width:
      min(100%, 60rem);

  margin-top:
      clamp(2rem, 5vh, 4rem);

  padding: 1.3rem;

  background:
      rgba(4, 6, 14, 0.88);

  border:
      1px solid
      rgba(75, 200, 255, 0.16);
}


.topic-input-shell textarea {
  width: 100%;
  min-height: 7rem;

  resize: none;

  padding: 0;

  border: 0;
  outline: none;

  background: transparent;

  color: var(--text);

  font: inherit;

  font-size:
      clamp(
          1rem,
          1.5vw,
          1.35rem
      );

  line-height: 1.6;
}


.topic-input-shell textarea::placeholder,
.context-input-shell textarea::placeholder {
  color:
      rgba(145, 165, 188, 0.38);
}


.topic-input-footer,
.context-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 1rem;

  color: var(--dim);

  font-size: 0.56rem;
  font-weight: 800;

  letter-spacing: 0.12em;
}


.input-corner {
  position: absolute;

  width: 0.8rem;
  height: 0.8rem;

  border-color: var(--blue);
}


.corner-top-left {
  top: -1px;
  left: -1px;

  border-top: 2px solid;
  border-left: 2px solid;
}


.corner-top-right {
  top: -1px;
  right: -1px;

  border-top: 2px solid;
  border-right: 2px solid;
}


.corner-bottom-left {
  left: -1px;
  bottom: -1px;

  border-left: 2px solid;
  border-bottom: 2px solid;
}


.corner-bottom-right {
  right: -1px;
  bottom: -1px;

  border-right: 2px solid;
  border-bottom: 2px solid;
}


.signal-visual {
  position: absolute;

  left: 0;
  right: 0;
  bottom: 0;

  height: 12rem;

  opacity: 0.26;

  pointer-events: none;
}


.signal-visual svg {
  width: 100%;
  height: 100%;
}


.signal-line {
  fill: none;

  stroke-width: 2;
}


.signal-line.dim {
  stroke:
      rgba(75, 200, 255, 0.18);
}


.signal-line.bright {
  stroke: var(--blue);

  stroke-dasharray:
      100 700;

  animation:
      scanSignal
      4s linear infinite;
}


@keyframes scanSignal {
  from {
    stroke-dashoffset: 800;
  }

  to {
    stroke-dashoffset: 0;
  }
}


.objective-grid {
  width:
      min(100%, 70rem);

  flex: 1;

  min-height: 0;

  margin-top:
      clamp(2rem, 4vh, 3rem);

  display: grid;

  grid-template-columns:
      repeat(
          2,
          minmax(0, 1fr)
      );

  gap: 1rem;
}


.objective-card {
  position: relative;

  min-width: 0;

  display: grid;

  grid-template-columns:
      auto minmax(0, 1fr);

  align-items: center;

  gap: 1.2rem;

  padding:
      1.3rem 1.4rem;

  text-align: left;

  color: inherit;

  background:
      rgba(4, 6, 14, 0.8);

  border:
      1px solid
      rgba(255, 255, 255, 0.06);

  cursor: pointer;

  overflow: hidden;

  transition:
      transform 220ms ease,
      border-color 220ms ease,
      background 220ms ease;
}


.objective-card:hover {
  transform:
      translateY(-0.2rem);

  border-color:
      rgba(75, 200, 255, 0.35);
}


.objective-card.selected {
  background:
      rgba(75, 200, 255, 0.055);

  border-color:
      rgba(75, 200, 255, 0.6);
}


.objective-mark {
  position: relative;

  width: 3rem;
  height: 3rem;

  display: grid;
  place-items: center;
}


.objective-ring {
  position: absolute;

  inset: 0.3rem;

  border-radius: 50%;

  border:
      1px solid
      rgba(75, 200, 255, 0.28);

  transition:
      border-color 200ms ease,
      box-shadow 200ms ease,
      transform 200ms ease;
}


.objective-core {
  width: 0.45rem;
  height: 0.45rem;

  border-radius: 50%;

  background:
      rgba(75, 200, 255, 0.25);

  transition:
      background 200ms ease,
      box-shadow 200ms ease;
}


.objective-card.selected
.objective-ring {
  border-color: var(--blue);

  transform: scale(1.12);

  box-shadow:
      0 0 1rem
      rgba(75, 200, 255, 0.22);
}


.objective-card.selected
.objective-core {
  background: var(--blue);

  box-shadow:
      0 0 0.7rem
      var(--blue);
}


.objective-copy h3 {
  margin: 0;

  font-size:
      clamp(
          1rem,
          1.5vw,
          1.35rem
      );
}


.objective-copy p {
  max-width: 28rem;

  margin:
      0.5rem 0 0;

  color: var(--soft);

  font-size: 0.75rem;

  line-height: 1.55;
}


.selection-line,
.option-edge {
  position: absolute;

  left: 0;
  bottom: 0;

  height: 2px;

  width: 100%;

  background: var(--blue);

  transform: scaleX(0);

  transform-origin: left;

  transition:
      transform 260ms ease;
}


.objective-card.selected
.selection-line,
.approach-option.selected
.option-edge {
  transform: scaleX(1);
}


.context-layout {
  width:
      min(100%, 74rem);

  flex: 1;

  min-height: 0;

  margin-top:
      clamp(2rem, 4vh, 3rem);

  display: grid;

  grid-template-columns:
      minmax(0, 1fr)
      18rem;

  gap: 1.2rem;
}


.context-input-shell {
  min-width: 0;
  min-height: 0;

  display: flex;
  flex-direction: column;

  padding: 1.3rem;

  background:
      rgba(4, 6, 14, 0.88);

  border:
      1px solid
      rgba(75, 200, 255, 0.14);
}


.context-input-shell textarea {
  flex: 1;

  width: 100%;
  min-height: 10rem;

  padding: 0;

  resize: none;

  border: 0;
  outline: none;

  background: transparent;

  color: var(--text);

  font: inherit;

  font-size: 0.88rem;

  line-height: 1.7;
}


.context-scan {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 1.2rem;

  border:
      1px solid
      rgba(159, 98, 255, 0.14);

  background:
      rgba(4, 6, 14, 0.72);

  text-align: center;
}


.scan-label {
  color: var(--purple-bright);

  font-size: 0.58rem;
  font-weight: 900;

  letter-spacing: 0.16em;
}


.scan-core {
  position: relative;

  width: 9rem;
  height: 9rem;

  margin: 1.7rem 0;

  display: grid;
  place-items: center;
}


.scan-ring {
  position: absolute;

  border-radius: 50%;

  border:
      1px solid
      rgba(159, 98, 255, 0.28);
}


.ring-a {
  width: 4rem;
  height: 4rem;
}


.ring-b {
  width: 6.3rem;
  height: 6.3rem;

  opacity: 0.65;
}


.ring-c {
  width: 8.8rem;
  height: 8.8rem;

  opacity: 0.3;
}


.scan-center {
  color: var(--blue);

  font-size: 0.68rem;
  font-weight: 900;

  letter-spacing: 0.14em;
}


.context-scan p {
  margin: 0;

  color: var(--soft);

  font-size: 0.7rem;

  line-height: 1.5;
}


.approach-list {
  width:
      min(100%, 72rem);

  flex: 1;

  min-height: 0;

  margin-top:
      clamp(2rem, 4vh, 3rem);

  display: grid;

  grid-template-columns:
      repeat(
          3,
          minmax(0, 1fr)
      );

  gap: 1rem;
}


.approach-option {
  position: relative;

  min-width: 0;

  display: flex;
  flex-direction: column;

  padding:
      1.4rem;

  color: inherit;

  text-align: left;

  border:
      1px solid
      rgba(255, 255, 255, 0.06);

  background:
      rgba(4, 6, 14, 0.82);

  cursor: pointer;

  overflow: hidden;

  transition:
      transform 220ms ease,
      border-color 220ms ease,
      background 220ms ease;
}


.approach-option:hover {
  transform:
      translateY(-0.25rem);

  border-color:
      rgba(75, 200, 255, 0.34);
}


.approach-option.selected {
  border-color:
      rgba(75, 200, 255, 0.62);

  background:
      rgba(75, 200, 255, 0.045);
}


.approach-index {
  color: var(--blue);

  font-size: 0.58rem;
  font-weight: 900;

  letter-spacing: 0.16em;
}


.approach-info {
  margin-top: 1.4rem;
}


.approach-info h3 {
  margin: 0;

  font-size:
      clamp(
          1.1rem,
          1.7vw,
          1.6rem
      );
}


.approach-info p {
  margin:
      0.7rem 0 0;

  color: var(--soft);

  font-size: 0.74rem;

  line-height: 1.65;
}


.intensity-visual {
  margin-top: auto;

  padding-top: 2rem;
}


.intensity-label {
  display: block;

  margin-bottom: 0.55rem;

  color: var(--dim);

  font-size: 0.52rem;
  font-weight: 800;

  letter-spacing: 0.14em;
}


.intensity-track {
  height: 2px;

  background:
      rgba(255, 255, 255, 0.08);
}


.intensity-fill {
  display: block;

  height: 100%;

  background: var(--blue);

  box-shadow:
      0 0 0.5rem
      rgba(75, 200, 255, 0.7);
}


.calibration-footer {
  position: relative;

  z-index: 5;

  flex: 0 0 5rem;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 1rem;

  padding:
      0
      clamp(2rem, 8vw, 9rem);

  border-top:
      1px solid
      rgba(75, 200, 255, 0.1);

  background:
      rgba(1, 1, 4, 0.92);
}


.footer-signal {
  display: flex;
  align-items: center;

  gap: 0.55rem;

  color: var(--dim);

  font-size: 0.55rem;
  font-weight: 800;

  letter-spacing: 0.12em;
}


.signal-dot {
  width: 0.4rem;
  height: 0.4rem;

  border-radius: 50%;

  background: var(--blue);

  box-shadow:
      0 0 0.65rem
      var(--blue);
}


.continue-button {
  min-width: 11rem;
  height: 2.9rem;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 0.8rem;

  padding:
      0 1.2rem;

  border:
      1px solid
      rgba(75, 200, 255, 0.45);

  background:
      rgba(75, 200, 255, 0.08);

  color: var(--text);

  cursor: pointer;

  transition:
      background 180ms ease,
      border-color 180ms ease,
      opacity 180ms ease;
}


.continue-button:disabled {
  opacity: 0.28;

  cursor: not-allowed;
}


.continue-button:not(:disabled):hover {
  border-color: var(--blue);

  background:
      rgba(75, 200, 255, 0.15);
}


.continue-button svg {
  width: 1.1rem;
  height: 1.1rem;

  fill: none;

  stroke: var(--blue);

  stroke-width: 1.8;

  stroke-linecap: round;
  stroke-linejoin: round;
}


.calibration-step-enter-active,
.calibration-step-leave-active {
  transition:
      opacity 240ms ease,
      transform 400ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      filter 260ms ease;
}


.calibration-step-enter-from {
  opacity: 0;

  transform:
      translateX(2.5rem);

  filter: blur(3px);
}


.calibration-step-leave-to {
  opacity: 0;

  transform:
      translateX(-1.5rem);

  filter: blur(2px);
}


.locking-screen {
  position: absolute;

  z-index: 20;

  inset: 0;

  display: grid;
  place-items: center;

  background:
      rgba(1, 1, 4, 0.97);

  backdrop-filter:
      blur(10px);
}


.locking-core {
  position: relative;

  width: 24rem;
  height: 24rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  text-align: center;
}


.lock-ring {
  position: absolute;

  border-radius: 50%;

  border:
      1px solid
      rgba(75, 200, 255, 0.28);

  animation:
      lockPulse
      1.2s ease-out infinite;
}


.lock-ring-one {
  width: 10rem;
  height: 10rem;
}


.lock-ring-two {
  width: 15rem;
  height: 15rem;

  animation-delay: 120ms;

  opacity: 0.55;
}


.lock-ring-three {
  width: 20rem;
  height: 20rem;

  animation-delay: 240ms;

  opacity: 0.26;
}


@keyframes lockPulse {
  0% {
    transform: scale(0.92);

    opacity: 0.2;
  }

  50% {
    opacity: 1;
  }

  100% {
    transform: scale(1.06);

    opacity: 0.15;
  }
}


.lock-symbol {
  width: 6rem;
  height: 6rem;

  margin-bottom: 1.4rem;

  fill: none;

  stroke: var(--blue);

  stroke-width: 2;

  filter:
      drop-shadow(
          0 0 0.8rem
          rgba(75, 200, 255, 0.8)
      );
}


.locking-eyebrow {
  color: var(--blue);

  font-size: 0.62rem;
  font-weight: 900;

  letter-spacing: 0.22em;
}


.locking-core h2 {
  margin:
      0.7rem 0 0;

  font-size: 1.8rem;
}


.locking-core p {
  margin:
      0.5rem 0 0;

  color: var(--soft);

  font-size: 0.75rem;
}


.lock-screen-enter-active,
.lock-screen-leave-active {
  transition:
      opacity 280ms ease;
}


.lock-screen-enter-from,
.lock-screen-leave-to {
  opacity: 0;
}


@media (max-width: 900px) {
  .progress-track {
    margin:
        0 2rem;
  }


  .step-page {
    padding:
        2rem;
  }


  .objective-grid {
    grid-template-columns: 1fr;

    overflow-y: auto;
  }


  .context-layout {
    grid-template-columns: 1fr;
  }


  .context-scan {
    display: none;
  }


  .approach-list {
    grid-template-columns: 1fr;

    overflow-y: auto;
  }


  .calibration-footer {
    padding:
        0 2rem;
  }
}


@media (max-width: 640px) {
  .calibration-header {
    padding:
        0 1rem;
  }


  .progress-track {
    margin:
        0 1rem;
  }


  .node-label {
    display: none;
  }


  .step-page {
    padding:
        1.5rem 1rem;
  }


  .step-copy h1 {
    font-size:
        clamp(
            2rem,
            9vw,
            3.3rem
        );
  }


  .calibration-footer {
    padding:
        0 1rem;
  }


  .footer-signal {
    display: none;
  }


  .continue-button {
    width: 100%;
  }
}
</style>
