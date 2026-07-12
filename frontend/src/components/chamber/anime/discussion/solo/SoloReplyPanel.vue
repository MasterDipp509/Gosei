<script setup>
import {
  computed
} from 'vue'

import {
  LoaderCircle,
  MessageSquareText,
  Send,
  ThumbsDown,
  ThumbsUp
} from 'lucide-vue-next'


/* ==================================================
   PROPS
================================================== */

const props = defineProps({

  modelValue: {
    type: String,
    default: ''
  },


  reaction: {
    type: String,
    default: null
  },


  disabled: {
    type: Boolean,
    default: false
  },


  busy: {
    type: Boolean,
    default: false
  },


  roundNumber: {
    type: [Number, String],
    default: 1
  },


  selectedAction: {
    type: [Object, String],
    default: null
  },


  selectedRisk: {
    type: [Object, String],
    default: null
  }
})


/* ==================================================
   EMITS
================================================== */

const emit = defineEmits([
  'update:modelValue',
  'reaction',
  'submit'
])


/* ==================================================
   COMPUTED
================================================== */

const cleanValue = computed(() =>
    String(
        props.modelValue ?? ''
    ).trim()
)


const canSubmit = computed(() =>
    !props.disabled
    &&
    !props.busy
    &&
    (
        Boolean(cleanValue.value)
        ||
        Boolean(props.reaction)
    )
)


/* ==================================================
   HELPERS
================================================== */

const displayItemText = item => {

  if (
      typeof item ===
      'string'
  ) {
    return item
  }


  return (
      item?.title
      ??
      item?.label
      ??
      item?.text
      ??
      item?.description
      ??
      ''
  )
}


/* ==================================================
   INPUT
================================================== */

const handleInput = event => {

  emit(
      'update:modelValue',
      event.target.value
  )
}


/* ==================================================
   REACTION
================================================== */

const selectReaction = reaction => {

  if (
      props.disabled
      ||
      props.busy
  ) {
    return
  }


  emit(
      'reaction',
      reaction
  )
}


/* ==================================================
   SUBMIT
================================================== */

const handleSubmit = () => {

  if (!canSubmit.value) {
    return
  }


  emit(
      'submit',
      {
        content:
        cleanValue.value,

        reaction:
        props.reaction
      }
  )
}


/* ==================================================
   KEYBOARD

   Enter       → submit
   Shift+Enter → newline
================================================== */

const handleKeydown = event => {

  if (
      event.key !==
      'Enter'
  ) {
    return
  }


  if (event.shiftKey) {
    return
  }


  event.preventDefault()


  handleSubmit()
}
</script>

<template>
  <section
      class="solo-reply-panel"
      :class="{
      'is-powered': !disabled,
      'is-powered-down': disabled,
      'is-busy': busy
    }"
  >

    <!-- ==================================================
         OUTER GLOW / HULL
    ================================================== -->

    <div
        class="reply-panel__aura"
        aria-hidden="true"
    ></div>

    <div
        class="reply-panel__backplate"
        aria-hidden="true"
    ></div>


    <!-- ==================================================
         MAIN TERMINAL
    ================================================== -->

    <div class="reply-terminal">

      <!-- decorative frame layers -->

      <div
          class="reply-terminal__frame reply-terminal__frame--outer"
          aria-hidden="true"
      ></div>

      <div
          class="reply-terminal__frame reply-terminal__frame--inner"
          aria-hidden="true"
      ></div>

      <div
          class="reply-terminal__hotspot reply-terminal__hotspot--left"
          aria-hidden="true"
      ></div>

      <div
          class="reply-terminal__hotspot reply-terminal__hotspot--right"
          aria-hidden="true"
      ></div>

      <div
          class="reply-terminal__rail"
          aria-hidden="true"
      >
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div
          class="reply-terminal__status-col"
          aria-hidden="true"
      >
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </div>

      <svg
          class="reply-terminal__circuits"
          viewBox="0 0 1200 360"
          preserveAspectRatio="none"
          aria-hidden="true"
      >
        <g class="circuit-paths">
          <path d="M26 60 H180 L200 40 H330" />
          <path d="M905 40 H1045 L1070 65 H1170" />
          <path d="M955 84 H1072 L1096 106 H1160" />
          <path d="M80 286 H154 L185 252 H264" />
          <path d="M676 286 H802 L830 258 H920" />
        </g>

        <g class="circuit-dots">
          <circle cx="1118" cy="64" r="3" />
          <circle cx="1134" cy="64" r="3" />
          <circle cx="1150" cy="64" r="3" />
          <circle cx="736" cy="258" r="3" />
          <circle cx="752" cy="258" r="3" />
          <circle cx="768" cy="258" r="3" />
        </g>
      </svg>


      <!-- ==================================================
           HEADER
      ================================================== -->

      <header class="reply-header">

        <div class="reply-header__left">

          <div class="reply-header__icon">
            <MessageSquareText
                :size="16"
                :stroke-width="1.8"
            />
          </div>

          <div class="reply-header__copy">
            <span class="reply-header__eyebrow">
              ROUND {{ roundNumber }}
            </span>

            <h3>
              WRITE REPLY
            </h3>
          </div>

        </div>


        <div
            class="reply-header__meta"
            aria-hidden="true"
        >
          <span class="reply-header__line"></span>

          <span class="reply-header__dots">
            <i></i>
            <i></i>
            <i></i>
          </span>
        </div>

      </header>


      <!-- ==================================================
           OPTIONAL CONTEXT
      ================================================== -->

      <div
          v-if="
          selectedAction
          ||
          selectedRisk
        "
          class="context-row"
      >

        <div
            v-if="selectedAction"
            class="context-chip context-chip--action"
        >
          <span class="context-chip__label">
            ACTION
          </span>

          <span class="context-chip__value">
            {{ displayItemText(selectedAction) }}
          </span>
        </div>


        <div
            v-if="selectedRisk"
            class="context-chip context-chip--risk"
        >
          <span class="context-chip__label">
            RISK
          </span>

          <span class="context-chip__value">
            {{ displayItemText(selectedRisk) }}
          </span>
        </div>

      </div>


      <!-- ==================================================
           INPUT STRIP
      ================================================== -->

      <div class="reply-input-shell">

        <div
            class="reply-input-shell__back"
            aria-hidden="true"
        ></div>

        <svg
            class="reply-input-shell__circuits"
            viewBox="0 0 1200 160"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
          <g class="input-circuit-paths">
            <path d="M18 122 H108 L132 98 H210" />
            <path d="M742 128 H844 L874 94 H980" />
            <path d="M972 36 H1058 L1082 58 H1160" />
          </g>
        </svg>

        <textarea
            class="reply-textarea"

            :value="modelValue"

            :disabled="
            disabled
            ||
            busy
          "

            placeholder="Type your response here..."

            rows="2"

            @input="handleInput"
            @keydown="handleKeydown"
        ></textarea>


        <div class="reply-send-zone">

          <button
              type="button"
              class="send-button"
              :disabled="!canSubmit"
              @click="handleSubmit"
          >

            <template v-if="busy">

              <span class="send-button__inner">
                <LoaderCircle
                    class="send-loader"
                    :size="18"
                    :stroke-width="1.8"
                />

                <span>
                  WAIT
                </span>
              </span>

            </template>


            <template v-else>

              <span class="send-button__inner">
                <span>
                  SEND
                </span>

                <Send
                    :size="20"
                    :stroke-width="1.7"
                />
              </span>

            </template>

            <span
                class="send-button__scan"
                aria-hidden="true"
            ></span>

          </button>

        </div>


        <div
            class="reply-input-shell__dots"
            aria-hidden="true"
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>


      <!-- ==================================================
           REACTION BAR
      ================================================== -->

      <footer class="reaction-row">

        <div
            class="reaction-row__back"
            aria-hidden="true"
        ></div>

        <div
            class="reaction-row__join"
            aria-hidden="true"
        ></div>


        <!-- AGREE -->

        <button
            type="button"
            class="reaction-button reaction-button--agree"
            :class="{
            active:
              reaction === 'agree'
          }"
            :disabled="
            disabled
            ||
            busy
          "
            @click="selectReaction('agree')"
        >

          <svg
              class="reaction-button__circuit"
              viewBox="0 0 600 120"
              preserveAspectRatio="none"
              aria-hidden="true"
          >
            <path d="M18 88 H96 L118 68 H188" />
            <path d="M382 30 H474 L495 48 H570" />
          </svg>

          <span class="reaction-button__bracket reaction-button__bracket--tl"></span>
          <span class="reaction-button__bracket reaction-button__bracket--br"></span>

          <span class="reaction-button__inner">
            <ThumbsUp
                :size="18"
                :stroke-width="1.7"
            />

            <span class="reaction-button__label">
              AGREE
            </span>
          </span>

          <span
              v-if="reaction === 'agree'"
              class="reaction-button__status"
          >
            SELECTED
          </span>

          <span
              class="reaction-button__energy"
              aria-hidden="true"
          ></span>

        </button>


        <!-- DISAGREE -->

        <button
            type="button"
            class="reaction-button reaction-button--disagree"
            :class="{
            active:
              reaction === 'disagree'
          }"
            :disabled="
            disabled
            ||
            busy
          "
            @click="selectReaction('disagree')"
        >

          <svg
              class="reaction-button__circuit"
              viewBox="0 0 600 120"
              preserveAspectRatio="none"
              aria-hidden="true"
          >
            <path d="M28 26 H110 L130 46 H206" />
            <path d="M386 90 H470 L492 70 H572" />
          </svg>

          <span class="reaction-button__bracket reaction-button__bracket--tl"></span>
          <span class="reaction-button__bracket reaction-button__bracket--br"></span>

          <span class="reaction-button__inner">
            <ThumbsDown
                :size="18"
                :stroke-width="1.7"
            />

            <span class="reaction-button__label">
              DISAGREE
            </span>
          </span>

          <span
              v-if="reaction === 'disagree'"
              class="reaction-button__status"
          >
            SELECTED
          </span>

          <span
              class="reaction-button__energy"
              aria-hidden="true"
          ></span>

        </button>

      </footer>

    </div>

  </section>
</template>

<style scoped>
/* ==================================================
   ROOT
================================================== */

.solo-reply-panel {
  --glass-bg:
      rgba(10, 14, 36, 0.28);

  --glass-bg-strong:
      rgba(14, 18, 48, 0.42);

  --glass-dark:
      rgba(5, 8, 24, 0.54);

  --line-blue:
      rgba(68, 179, 255, 0.75);

  --line-blue-soft:
      rgba(68, 179, 255, 0.22);

  --line-violet:
      rgba(165, 92, 255, 0.88);

  --line-violet-soft:
      rgba(165, 92, 255, 0.24);

  --line-white:
      rgba(234, 226, 255, 0.88);

  --text:
      rgba(239, 236, 255, 0.96);

  --text-soft:
      rgba(187, 180, 225, 0.72);

  --text-muted:
      rgba(136, 130, 178, 0.58);

  position: relative;

  width: 100%;
  max-width: 46rem;

  margin-inline: auto;

  color:
      var(--text);

  isolation: isolate;
}


/* ==================================================
   OUTER AURA / BACKPLATE
================================================== */

.reply-panel__aura {
  position: absolute;

  inset:
      -0.9rem
      -1.1rem
      -0.8rem;

  z-index: -3;

  pointer-events: none;

  opacity: 0.72;

  background:
      radial-gradient(
          ellipse at 50% 40%,
          rgba(139, 83, 255, 0.18),
          transparent 56%
      );

  filter:
      blur(16px);

  transition:
      opacity 280ms ease,
      filter 280ms ease;
}


.reply-panel__backplate {
  position: absolute;

  inset:
      -0.32rem
      -0.4rem
      -0.24rem;

  z-index: -2;

  clip-path:
      polygon(
          1.7rem 0,
          calc(100% - 2.6rem) 0,
          calc(100% - 1.8rem) 0.72rem,
          calc(100% - 0.48rem) 0.72rem,
          100% 1.3rem,
          100% calc(100% - 1rem),
          calc(100% - 1rem) 100%,
          1rem 100%,
          0 calc(100% - 1rem),
          0 1.05rem
      );

  border:
      1px solid
      rgba(106, 78, 210, 0.32);

  background:
      linear-gradient(
          180deg,
          rgba(10, 11, 34, 0.22),
          rgba(5, 8, 22, 0.28)
      );

  backdrop-filter:
      blur(8px);

  -webkit-backdrop-filter:
      blur(8px);

  box-shadow:
      inset 0 0 1.2rem rgba(60, 46, 145, 0.1),
      0 0 1rem rgba(104, 66, 255, 0.12);

  transition:
      opacity 280ms ease,
      border-color 280ms ease,
      box-shadow 280ms ease,
      filter 280ms ease;
}


/* ==================================================
   MAIN TERMINAL
================================================== */

.reply-terminal {
  position: relative;

  overflow: hidden;

  padding:
      0.9rem
      1rem
      0.72rem;

  clip-path:
      polygon(
          1.6rem 0,
          calc(100% - 2.5rem) 0,
          calc(100% - 1.75rem) 0.7rem,
          calc(100% - 0.44rem) 0.7rem,
          100% 1.22rem,
          100% calc(100% - 0.9rem),
          calc(100% - 0.9rem) 100%,
          0.9rem 100%,
          0 calc(100% - 0.9rem),
          0 1rem
      );

  background:
      linear-gradient(
          180deg,
          rgba(10, 16, 39, 0.26),
          rgba(6, 11, 29, 0.28)
      );

  backdrop-filter:
      blur(18px)
      saturate(150%);

  -webkit-backdrop-filter:
      blur(18px)
      saturate(150%);

  box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.02),
      inset 0 0 2rem rgba(84, 48, 180, 0.08),
      0 0 0.8rem rgba(103, 62, 255, 0.12);

  transition:
      background 280ms ease,
      box-shadow 280ms ease,
      filter 280ms ease;
}


/* ==================================================
   FRAME
================================================== */

.reply-terminal__frame {
  position: absolute;

  pointer-events: none;

  transition:
      opacity 280ms ease,
      border-color 280ms ease,
      box-shadow 280ms ease,
      filter 280ms ease;
}


.reply-terminal__frame--outer {
  inset: 0.08rem;

  clip-path:
      polygon(
          1.6rem 0,
          calc(100% - 2.45rem) 0,
          calc(100% - 1.72rem) 0.68rem,
          calc(100% - 0.48rem) 0.68rem,
          100% 1.22rem,
          100% calc(100% - 0.9rem),
          calc(100% - 0.9rem) 100%,
          0.9rem 100%,
          0 calc(100% - 0.9rem),
          0 1rem
      );

  border:
      1px solid
      rgba(117, 80, 255, 0.68);

  box-shadow:
      0 0 0.9rem rgba(134, 79, 255, 0.18);
}


.reply-terminal__frame--inner {
  inset:
      0.48rem
      0.54rem
      0.42rem;

  clip-path:
      polygon(
          0.95rem 0,
          calc(100% - 1.35rem) 0,
          100% 0.92rem,
          100% calc(100% - 0.82rem),
          calc(100% - 0.82rem) 100%,
          0.82rem 100%,
          0 calc(100% - 0.82rem),
          0 0.84rem
      );

  border:
      1px solid
      rgba(76, 174, 255, 0.24);
}


/* ==================================================
   TERMINAL DETAIL
================================================== */

.reply-terminal__hotspot {
  position: absolute;

  pointer-events: none;

  transition:
      opacity 280ms ease,
      filter 280ms ease;
}


.reply-terminal__hotspot--left {
  left: 0;
  top: 34%;

  width: 0.26rem;
  height: 1.5rem;

  background:
      linear-gradient(
          180deg,
          transparent,
          rgba(72, 182, 255, 1),
          transparent
      );

  box-shadow:
      0 0 0.8rem rgba(72, 182, 255, 0.92);
}


.reply-terminal__hotspot--right {
  right: 0.12rem;
  top: 56%;

  width: 0.16rem;
  height: 1.3rem;

  background:
      linear-gradient(
          180deg,
          transparent,
          rgba(204, 108, 255, 1),
          transparent
      );

  box-shadow:
      0 0 0.82rem rgba(196, 96, 255, 0.84);
}


.reply-terminal__rail {
  position: absolute;

  top: 0.36rem;
  right: 4.2rem;

  display: flex;
  gap: 0.18rem;

  transform:
      skewX(-28deg);

  pointer-events: none;
}


.reply-terminal__rail span {
  width: 0.48rem;
  height: 0.14rem;

  background:
      rgba(157, 90, 255, 0.72);

  box-shadow:
      0 0 0.44rem rgba(157, 90, 255, 0.26);
}


.reply-terminal__status-col {
  position: absolute;

  top: 2rem;
  left: 0.62rem;

  display: flex;
  flex-direction: column;
  gap: 0.34rem;

  pointer-events: none;
}


.reply-terminal__status-col i {
  width: 0.28rem;
  height: 0.28rem;

  border:
      1px solid rgba(163, 90, 255, 0.78);

  box-shadow:
      0 0 0.34rem rgba(163, 90, 255, 0.14);
}


.reply-terminal__circuits {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  pointer-events: none;

  opacity: 0.92;
}


.circuit-paths {
  fill: none;

  stroke:
      rgba(97, 86, 199, 0.16);

  stroke-width: 1;
}


.circuit-dots {
  fill:
      rgba(161, 94, 255, 0.72);
}


/* ==================================================
   HEADER
================================================== */

.reply-header {
  position: relative;
  z-index: 4;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;

  min-height: 1.8rem;

  margin-bottom: 0.52rem;

  padding:
      0.12rem
      0.55rem
      0.44rem
      1.25rem;

  border-bottom:
      1px solid rgba(91, 79, 182, 0.2);
}


.reply-header__left {
  display: flex;
  align-items: center;
  gap: 0.58rem;

  min-width: 0;
}


.reply-header__icon {
  display: grid;
  place-items: center;

  width: 1.35rem;
  height: 1.35rem;

  color:
      rgba(189, 126, 255, 0.94);

  filter:
      drop-shadow(0 0 0.35rem rgba(155, 90, 255, 0.36));

  transition:
      color 280ms ease,
      filter 280ms ease;
}


.reply-header__copy {
  display: flex;
  align-items: baseline;
  gap: 0.58rem;

  min-width: 0;
}


.reply-header__eyebrow {
  color:
      var(--text-muted);

  font-size: 0.47rem;
  letter-spacing: 0.14em;

  white-space: nowrap;
}


.reply-header h3 {
  margin: 0;

  color:
      rgba(241, 237, 255, 0.98);

  font-size:
      clamp(0.82rem, 0.96vw, 0.98rem);

  font-weight: 500;

  letter-spacing: 0.24em;

  white-space: nowrap;

  text-shadow:
      0 0 0.55rem rgba(161, 92, 255, 0.26);

  transition:
      color 280ms ease,
      text-shadow 280ms ease;
}


.reply-header__meta {
  display: flex;
  align-items: center;
  gap: 0.48rem;

  flex: none;
}


.reply-header__line {
  width: 2.8rem;
  height: 1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(73, 166, 255, 0.32)
      );
}


.reply-header__dots {
  display: flex;
  gap: 0.2rem;
}


.reply-header__dots i {
  width: 0.18rem;
  height: 0.18rem;

  border-radius: 50%;

  border:
      1px solid rgba(168, 94, 255, 0.72);
}


/* ==================================================
   CONTEXT
================================================== */

.context-row {
  position: relative;
  z-index: 4;

  display: flex;
  gap: 0.38rem;

  margin:
      0
      0.52rem
      0.46rem
      1.25rem;
}


.context-chip {
  min-width: 0;
  max-width: 48%;

  display: flex;
  align-items: center;
  gap: 0.4rem;

  padding:
      0.22rem
      0.42rem;

  border:
      1px solid rgba(114, 84, 219, 0.28);

  background:
      rgba(12, 15, 37, 0.28);

  backdrop-filter:
      blur(10px);

  -webkit-backdrop-filter:
      blur(10px);

  clip-path:
      polygon(
          0.34rem 0,
          100% 0,
          100% calc(100% - 0.34rem),
          calc(100% - 0.34rem) 100%,
          0 100%,
          0 0.34rem
      );
}


.context-chip__label {
  flex: none;

  color:
      rgba(189, 117, 255, 0.9);

  font-size: 0.44rem;
  letter-spacing: 0.12em;
}


.context-chip__value {
  min-width: 0;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color:
      rgba(197, 191, 228, 0.82);

  font-size: 0.58rem;
}


.context-chip--risk {
  border-color:
      rgba(194, 96, 218, 0.26);
}


/* ==================================================
   INPUT SHELL
================================================== */

.reply-input-shell {
  position: relative;
  z-index: 5;

  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    9rem;

  align-items: stretch;

  min-height:
      clamp(4.7rem, 8vw, 5.7rem);

  margin:
      0
      0.28rem
      0.56rem;

  overflow: hidden;

  clip-path:
      polygon(
          0.85rem 0,
          calc(100% - 1.1rem) 0,
          100% 0.84rem,
          100% calc(100% - 0.72rem),
          calc(100% - 0.72rem) 100%,
          0.72rem 100%,
          0 calc(100% - 0.72rem),
          0 0.72rem
      );

  border:
      1px solid rgba(123, 78, 255, 0.52);

  background:
      linear-gradient(
          180deg,
          rgba(11, 15, 38, 0.18),
          rgba(8, 12, 32, 0.26)
      );

  backdrop-filter:
      blur(15px)
      saturate(150%);

  -webkit-backdrop-filter:
      blur(15px)
      saturate(150%);

  box-shadow:
      inset 0 0 1.2rem rgba(67, 53, 155, 0.08),
      0 0 0.9rem rgba(98, 61, 255, 0.1);

  transition:
      border-color 280ms ease,
      box-shadow 280ms ease,
      filter 280ms ease,
      background 280ms ease;
}


.reply-input-shell__back {
  position: absolute;

  inset:
      0.24rem;

  clip-path:
      polygon(
          0.65rem 0,
          calc(100% - 0.82rem) 0,
          100% 0.68rem,
          100% calc(100% - 0.62rem),
          calc(100% - 0.62rem) 100%,
          0.62rem 100%,
          0 calc(100% - 0.62rem),
          0 0.62rem
      );

  border:
      1px solid rgba(71, 162, 255, 0.12);

  pointer-events: none;
}


.reply-input-shell__circuits {
  position: absolute;
  inset: 0;

  width: 100%;
  height: 100%;

  pointer-events: none;
  opacity: 0.95;
}


.input-circuit-paths {
  fill: none;

  stroke:
      rgba(86, 82, 186, 0.18);

  stroke-width: 1;
}


.reply-textarea {
  position: relative;
  z-index: 2;

  width: 100%;
  height: 100%;

  min-width: 0;

  resize: none;

  padding:
      1rem
      1rem
      0.92rem
      1rem;

  border: 0;
  outline: 0;

  background:
      transparent;

  color:
      rgba(239, 236, 255, 0.96);

  caret-color:
      rgba(203, 124, 255, 1);

  font-family: inherit;

  font-size:
      clamp(0.85rem, 0.98vw, 0.94rem);

  line-height: 1.45;

  user-select: text;
  -webkit-user-select: text;

  cursor: text;

  transition:
      color 280ms ease,
      opacity 280ms ease;
}


.reply-textarea::placeholder {
  color:
      rgba(138, 132, 180, 0.56);
}


.reply-textarea:disabled {
  cursor: not-allowed;
}


.reply-send-zone {
  position: relative;
  z-index: 3;

  display: flex;
  align-items: center;

  padding:
      0.7rem
      0.7rem
      0.7rem
      0;
}


.reply-send-zone::before {
  content: '';

  position: absolute;

  top: 0.62rem;
  bottom: 0.62rem;
  left: -0.34rem;

  width: 0.34rem;

  border-top:
      1px solid rgba(93, 80, 180, 0.16);

  border-bottom:
      1px solid rgba(93, 80, 180, 0.16);
}


.send-button {
  position: relative;

  width: 100%;
  height: 100%;

  min-height: 3.24rem;

  overflow: hidden;

  clip-path:
      polygon(
          0.48rem 0,
          100% 0,
          100% calc(100% - 0.48rem),
          calc(100% - 0.48rem) 100%,
          0 100%,
          0 0.48rem
      );

  border:
      1px solid rgba(171, 96, 255, 0.7);

  color:
      rgba(230, 208, 255, 0.98);

  background:
      linear-gradient(
          135deg,
          rgba(75, 43, 164, 0.24),
          rgba(35, 27, 90, 0.38)
      );

  backdrop-filter:
      blur(12px);

  -webkit-backdrop-filter:
      blur(12px);

  font-family: inherit;

  cursor: pointer;

  box-shadow:
      inset 0 0 1rem rgba(144, 76, 255, 0.08),
      0 0 0.68rem rgba(143, 77, 255, 0.14);

  transition:
      transform 170ms ease,
      color 170ms ease,
      border-color 170ms ease,
      background 170ms ease,
      box-shadow 170ms ease,
      opacity 280ms ease,
      filter 280ms ease;
}


.send-button::before {
  content: '';

  position: absolute;

  inset: 0.2rem;

  border:
      1px solid rgba(162, 102, 255, 0.12);

  pointer-events: none;
}


.send-button:hover:not(:disabled) {
  transform:
      translateY(-1px);

  color:
      rgba(248, 238, 255, 1);

  border-color:
      rgba(214, 124, 255, 1);

  background:
      linear-gradient(
          135deg,
          rgba(110, 57, 229, 0.32),
          rgba(52, 32, 129, 0.5)
      );

  box-shadow:
      inset 0 0 1rem rgba(165, 88, 255, 0.14),
      0 0 1rem rgba(155, 84, 255, 0.28);
}


.send-button:disabled {
  cursor: not-allowed;
}


.send-button__inner {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.48rem;

  font-size:
      clamp(0.72rem, 0.82vw, 0.82rem);

  letter-spacing: 0.14em;
}


.send-button__scan {
  position: absolute;

  top: 0;
  bottom: 0;
  left: -40%;

  width: 36%;

  opacity: 0;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(226, 165, 255, 0.12),
          transparent
      );

  transform:
      skewX(-28deg);
}


.send-button:hover:not(:disabled)
.send-button__scan {
  opacity: 1;

  animation:
      send-scan 900ms ease;
}


.send-loader {
  animation:
      send-spin 0.85s linear infinite;
}


.reply-input-shell__dots {
  position: absolute;

  right: 10rem;
  bottom: 0.58rem;

  display: flex;
  gap: 0.22rem;

  pointer-events: none;
}


.reply-input-shell__dots span {
  width: 0.2rem;
  height: 0.2rem;

  border-radius: 50%;

  border:
      1px solid rgba(156, 90, 255, 0.7);
}


/* ==================================================
   REACTION ROW
================================================== */

.reaction-row {
  position: relative;
  z-index: 4;

  display: grid;
  grid-template-columns:
    1fr
    1fr;

  gap: 0.34rem;

  padding:
      0.1rem
      0.28rem
      0.1rem;
}


.reaction-row__back {
  position: absolute;

  inset: 0;

  z-index: -1;

  clip-path:
      polygon(
          0 0,
          47.5% 0,
          49.5% 0.5rem,
          50.5% 0.5rem,
          52.5% 0,
          100% 0,
          100% calc(100% - 0.72rem),
          calc(100% - 0.72rem) 100%,
          0.72rem 100%,
          0 calc(100% - 0.72rem)
      );

  border:
      1px solid rgba(111, 77, 255, 0.3);

  background:
      linear-gradient(
          180deg,
          rgba(8, 11, 28, 0.12),
          rgba(7, 9, 24, 0.18)
      );

  backdrop-filter:
      blur(12px);

  -webkit-backdrop-filter:
      blur(12px);
}


.reaction-row__join {
  position: absolute;

  top: 0.05rem;
  left: 50%;

  width: 1.7rem;
  height: 0.9rem;

  transform:
      translateX(-50%);

  pointer-events: none;
}


.reaction-row__join::before,
.reaction-row__join::after {
  content: '';

  position: absolute;

  top: 0.02rem;

  width: 0.86rem;
  height: 1px;

  background:
      rgba(168, 95, 255, 0.88);

  box-shadow:
      0 0 0.5rem rgba(168, 95, 255, 0.44);
}


.reaction-row__join::before {
  left: 0;

  transform:
      rotate(37deg);

  transform-origin:
      right center;
}


.reaction-row__join::after {
  right: 0;

  transform:
      rotate(-37deg);

  transform-origin:
      left center;
}


.reaction-button {
  position: relative;

  min-width: 0;
  height:
      clamp(2.8rem, 4.3vw, 3.2rem);

  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;

  clip-path:
      polygon(
          0.72rem 0,
          calc(100% - 0.72rem) 0,
          100% 0.72rem,
          100% calc(100% - 0.72rem),
          calc(100% - 0.72rem) 100%,
          0.72rem 100%,
          0 calc(100% - 0.72rem),
          0 0.72rem
      );

  border:
      1px solid rgba(119, 81, 255, 0.48);

  color:
      rgba(220, 214, 246, 0.92);

  background:
      linear-gradient(
          180deg,
          rgba(10, 13, 34, 0.18),
          rgba(7, 10, 27, 0.28)
      );

  backdrop-filter:
      blur(13px)
      saturate(140%);

  -webkit-backdrop-filter:
      blur(13px)
      saturate(140%);

  box-shadow:
      inset 0 0 1rem rgba(85, 61, 173, 0.07);

  font-family: inherit;

  cursor: pointer;

  transition:
      transform 170ms ease,
      color 170ms ease,
      border-color 170ms ease,
      background 170ms ease,
      box-shadow 170ms ease,
      opacity 280ms ease,
      filter 280ms ease;
}


.reaction-button::before {
  content: '';

  position: absolute;

  inset: 0.18rem;

  clip-path:
      polygon(
          0.54rem 0,
          calc(100% - 0.54rem) 0,
          100% 0.54rem,
          100% calc(100% - 0.54rem),
          calc(100% - 0.54rem) 100%,
          0.54rem 100%,
          0 calc(100% - 0.54rem),
          0 0.54rem
      );

  border:
      1px solid rgba(76, 168, 255, 0.08);

  pointer-events: none;
}


.reaction-button:hover:not(:disabled) {
  transform:
      translateY(-1px);

  color:
      rgba(248, 239, 255, 1);

  border-color:
      rgba(183, 101, 255, 0.88);

  background:
      linear-gradient(
          180deg,
          rgba(52, 28, 123, 0.24),
          rgba(15, 12, 52, 0.34)
      );

  box-shadow:
      inset 0 0 1rem rgba(137, 72, 255, 0.12),
      0 0 0.82rem rgba(121, 68, 255, 0.16);
}


.reaction-button.active {
  color:
      rgba(250, 240, 255, 1);

  border-color:
      rgba(207, 116, 255, 0.98);

  background:
      linear-gradient(
          180deg,
          rgba(76, 36, 176, 0.28),
          rgba(24, 16, 74, 0.38)
      );

  box-shadow:
      inset 0 0 1rem rgba(160, 80, 255, 0.16),
      0 0 1rem rgba(150, 81, 255, 0.2);
}


.reaction-button.active
.reaction-button__energy {
  opacity: 1;
  transform: scaleX(1);
}


.reaction-button:disabled {
  cursor: not-allowed;
}


.reaction-button__circuit {
  position: absolute;
  inset: 0;

  width: 100%;
  height: 100%;

  pointer-events: none;
}


.reaction-button__circuit path {
  fill: none;

  stroke:
      rgba(91, 84, 184, 0.16);

  stroke-width: 1;
}


.reaction-button__inner {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.44rem;
}


.reaction-button__inner svg {
  color:
      rgba(184, 108, 255, 0.92);

  filter:
      drop-shadow(0 0 0.32rem rgba(159, 88, 255, 0.28));
}


.reaction-button__label {
  font-size:
      clamp(0.72rem, 0.88vw, 0.84rem);

  letter-spacing: 0.1em;
}


.reaction-button__status {
  position: absolute;

  right: 0.72rem;
  bottom: 0.34rem;

  color:
      rgba(183, 120, 255, 0.72);

  font-size: 0.42rem;
  letter-spacing: 0.14em;
}


.reaction-button__energy {
  position: absolute;

  left: 28%;
  right: 28%;
  bottom: 0;

  height: 2px;

  opacity: 0;
  transform: scaleX(0.34);

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(204, 108, 255, 1),
          transparent
      );

  box-shadow:
      0 0 0.56rem rgba(197, 102, 255, 0.9);

  transition:
      opacity 180ms ease,
      transform 180ms ease;
}


.reaction-button__bracket {
  position: absolute;

  width: 0.44rem;
  height: 0.44rem;

  pointer-events: none;
}


.reaction-button__bracket--tl {
  top: 0.42rem;
  left: 0.54rem;

  border-top:
      1px solid rgba(134, 94, 255, 0.9);

  border-left:
      1px solid rgba(134, 94, 255, 0.9);
}


.reaction-button__bracket--br {
  right: 0.54rem;
  bottom: 0.42rem;

  border-right:
      1px solid rgba(134, 94, 255, 0.9);

  border-bottom:
      1px solid rgba(134, 94, 255, 0.9);
}


/* ==================================================
   POWERED ON
================================================== */

.solo-reply-panel.is-powered
.reply-panel__aura {
  animation:
      hologram-breathe 4.4s ease-in-out infinite;
}


.solo-reply-panel.is-powered
.reply-terminal {
  box-shadow:
      inset 0 0 2rem rgba(84, 48, 180, 0.08),
      0 0 0.85rem rgba(94, 63, 255, 0.16),
      0 0 1.4rem rgba(94, 63, 255, 0.09);
}


.solo-reply-panel.is-powered
.reply-terminal__rail span {
  animation:
      rail-flicker 2.8s ease-in-out infinite;
}


.solo-reply-panel.is-powered
.reply-terminal__rail span:nth-child(2) {
  animation-delay: 80ms;
}


.solo-reply-panel.is-powered
.reply-terminal__rail span:nth-child(3) {
  animation-delay: 160ms;
}


.solo-reply-panel.is-powered
.reply-terminal__rail span:nth-child(4) {
  animation-delay: 240ms;
}


.solo-reply-panel.is-powered
.reply-terminal__hotspot--left {
  animation:
      hotspot-pulse 4s ease-in-out infinite;
}


.solo-reply-panel.is-powered
.reply-terminal__hotspot--right {
  animation:
      hotspot-pulse 4.6s ease-in-out infinite reverse;
}


/* ==================================================
   POWERED DOWN
================================================== */

.solo-reply-panel.is-powered-down
.reply-panel__aura {
  opacity: 0.08;
  filter: blur(12px);
}


.solo-reply-panel.is-powered-down
.reply-panel__backplate {
  border-color:
      rgba(82, 77, 110, 0.22);

  box-shadow:
      none;

  filter:
      saturate(0.28)
      brightness(0.66);
}


.solo-reply-panel.is-powered-down
.reply-terminal {
  background:
      linear-gradient(
          180deg,
          rgba(8, 10, 24, 0.22),
          rgba(5, 8, 20, 0.24)
      );

  box-shadow:
      none;

  filter:
      saturate(0.24)
      brightness(0.72);
}


.solo-reply-panel.is-powered-down
.reply-terminal__frame--outer {
  border-color:
      rgba(90, 82, 128, 0.34);

  box-shadow:
      none;
}


.solo-reply-panel.is-powered-down
.reply-terminal__frame--inner {
  border-color:
      rgba(77, 92, 125, 0.16);
}


.solo-reply-panel.is-powered-down
.reply-terminal__rail,
.solo-reply-panel.is-powered-down
.reply-terminal__status-col,
.solo-reply-panel.is-powered-down
.reply-terminal__circuits {
  opacity: 0.34;
}


.solo-reply-panel.is-powered-down
.reply-terminal__hotspot {
  opacity: 0.18;
  box-shadow: none;
}


.solo-reply-panel.is-powered-down
.reply-header__icon {
  color:
      rgba(122, 112, 155, 0.48);

  filter:
      none;
}


.solo-reply-panel.is-powered-down
.reply-header h3 {
  color:
      rgba(149, 142, 181, 0.58);

  text-shadow:
      none;
}


.solo-reply-panel.is-powered-down
.reply-header__eyebrow,
.solo-reply-panel.is-powered-down
.reply-header__dots,
.solo-reply-panel.is-powered-down
.reply-header__line {
  opacity: 0.45;
}


.solo-reply-panel.is-powered-down
.context-chip {
  border-color:
      rgba(87, 80, 118, 0.2);

  background:
      rgba(11, 13, 26, 0.2);

  filter:
      saturate(0.2);
}


.solo-reply-panel.is-powered-down
.context-chip__label,
.solo-reply-panel.is-powered-down
.context-chip__value {
  color:
      rgba(139, 133, 166, 0.56);
}


.solo-reply-panel.is-powered-down
.reply-input-shell {
  border-color:
      rgba(84, 79, 119, 0.28);

  box-shadow:
      none;

  filter:
      saturate(0.22)
      brightness(0.75);
}


.solo-reply-panel.is-powered-down
.reply-input-shell__back,
.solo-reply-panel.is-powered-down
.reply-input-shell__circuits,
.solo-reply-panel.is-powered-down
.reply-input-shell__dots {
  opacity: 0.34;
}


.solo-reply-panel.is-powered-down
.reply-textarea {
  opacity: 0.5;

  color:
      rgba(142, 136, 171, 0.62);
}


.solo-reply-panel.is-powered-down
.reply-textarea::placeholder {
  color:
      rgba(116, 111, 144, 0.44);
}


.solo-reply-panel.is-powered-down
.send-button {
  opacity: 0.42;

  color:
      rgba(134, 127, 163, 0.58);

  border-color:
      rgba(92, 85, 126, 0.32);

  background:
      linear-gradient(
          135deg,
          rgba(23, 22, 45, 0.18),
          rgba(10, 12, 28, 0.24)
      );

  box-shadow:
      none;

  filter:
      saturate(0.18)
      brightness(0.74);
}


.solo-reply-panel.is-powered-down
.reaction-row__back {
  border-color:
      rgba(84, 80, 113, 0.2);
}


.solo-reply-panel.is-powered-down
.reaction-row__join {
  opacity: 0.28;
}


.solo-reply-panel.is-powered-down
.reaction-button {
  opacity: 0.5;

  color:
      rgba(149, 143, 175, 0.6);

  border-color:
      rgba(88, 82, 120, 0.28);

  background:
      linear-gradient(
          180deg,
          rgba(10, 12, 26, 0.16),
          rgba(8, 10, 22, 0.22)
      );

  box-shadow:
      none;

  filter:
      saturate(0.18)
      brightness(0.78);
}


.solo-reply-panel.is-powered-down
.reaction-button__inner svg,
.solo-reply-panel.is-powered-down
.reaction-button__status,
.solo-reply-panel.is-powered-down
.reaction-button__bracket,
.solo-reply-panel.is-powered-down
.reaction-button__energy,
.solo-reply-panel.is-powered-down
.reaction-button__circuit {
  opacity: 0.42;
}


/* ==================================================
   BUSY
================================================== */

.solo-reply-panel.is-busy:not(.is-powered-down)
.reply-input-shell__dots span {
  animation:
      busy-dot 1.2s ease-in-out infinite;
}


.solo-reply-panel.is-busy
.reply-input-shell__dots span:nth-child(2) {
  animation-delay: 120ms;
}


.solo-reply-panel.is-busy
.reply-input-shell__dots span:nth-child(3) {
  animation-delay: 240ms;
}


/* ==================================================
   ANIMATIONS
================================================== */

@keyframes send-spin {
  to {
    transform: rotate(360deg);
  }
}


@keyframes send-scan {
  from {
    left: -40%;
  }

  to {
    left: 130%;
  }
}


@keyframes hologram-breathe {
  0%,
  100% {
    opacity: 0.58;
    transform: scale(0.996);
  }

  50% {
    opacity: 0.84;
    transform: scale(1.004);
  }
}


@keyframes rail-flicker {
  0%,
  100% {
    opacity: 0.34;
  }

  50% {
    opacity: 1;
  }
}


@keyframes hotspot-pulse {
  0%,
  100% {
    opacity: 0.72;
  }

  50% {
    opacity: 1;
  }
}


@keyframes busy-dot {
  0%,
  100% {
    background: transparent;
    box-shadow: none;
  }

  50% {
    background: rgba(191, 110, 255, 0.94);
    box-shadow: 0 0 0.42rem rgba(183, 102, 255, 0.82);
  }
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 900px) {

  .solo-reply-panel {
    max-width: 100%;
  }


  .reply-header {
    padding-left: 1rem;
  }


  .context-row {
    margin-left: 1rem;
  }


  .reply-input-shell {
    grid-template-columns:
      minmax(0, 1fr)
      7.5rem;
  }
}


@media (max-width: 640px) {

  .reply-terminal {
    padding:
        0.8rem
        0.72rem
        0.66rem;
  }


  .reply-header {
    padding:
        0.06rem
        0.38rem
        0.38rem
        0.9rem;
  }


  .reply-header__eyebrow,
  .reply-header__meta {
    display: none;
  }


  .context-row {
    flex-direction: column;

    margin:
        0
        0.34rem
        0.4rem
        0.9rem;
  }


  .context-chip {
    max-width: 100%;
  }


  .reply-input-shell {
    grid-template-columns:
      minmax(0, 1fr)
      6.6rem;

    min-height:
        4.45rem;
  }


  .reply-textarea {
    padding:
        0.82rem
        0.78rem
        0.78rem;
  }


  .send-button__inner {
    gap: 0.3rem;
  }


  .reaction-button__status {
    display: none;
  }


  .reaction-button__label {
    letter-spacing: 0.06em;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {

  .solo-reply-panel *,
  .solo-reply-panel *::before,
  .solo-reply-panel *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
</style>
