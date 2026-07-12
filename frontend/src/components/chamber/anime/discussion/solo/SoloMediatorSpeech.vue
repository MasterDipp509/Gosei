<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

import {
  FastForward,
  FolderOpen,
  LoaderCircle,
  RotateCw,
  Save,
  ScrollText,
  Settings
} from 'lucide-vue-next'

import {
  marked
} from 'marked'

import DOMPurify
  from 'dompurify'


/* ==================================================
   PROPS
================================================== */

const props = defineProps({

  participant: {
    type: Object,
    default: null
  },


  statement: {
    type: [Object, String],
    default: null
  },


  speech: {
    type: String,
    default: ''
  },


  loading: {
    type: Boolean,
    default: false
  },


  busy: {
    type: Boolean,
    default: false
  },


  status: {
    type: String,
    default: 'active'
  },


  roundNumber: {
    type: [Number, String],
    default: 1
  },


  /*
    Pixels travelled per second.

    22px/sec is slow enough to feel like a VN
    dialogue crawl while still being visibly moving.
  */

  scrollSpeed: {
    type: Number,
    default: 22
  },


  /*
    Time spent resting at the bottom before
    jumping back to the top.
  */

  bottomPause: {
    type: Number,
    default: 3500
  },


  /*
    Small pause after jumping back to the top.
  */

  topPause: {
    type: Number,
    default: 1200
  }
})


const emit = defineEmits([
  'utility-action'
])


/* ==================================================
   ELEMENT REFS
================================================== */

const speechViewport =
    ref(null)


/* ==================================================
   DISPLAY DATA
================================================== */

const speakerName = computed(() =>
    props.participant?.name
    ??
    'The Mediator'
)


const speakerRole = computed(() =>
    props.participant?.role
    ??
    'Mediator'
)


/* ==================================================
   MARKDOWN
================================================== */

/*
  AI content is rendered as Markdown and sanitized
  before being inserted into the DOM.
*/

const renderedSpeech = computed(() => {

  const source =
      String(
          props.speech ?? ''
      )


  const html =
      marked.parse(
          source,
          {
            gfm: true,
            breaks: true
          }
      )


  return DOMPurify.sanitize(
      html
  )
})


/* ==================================================
   AUTO SCROLL STATE
================================================== */

const autoEnabled =
    ref(true)


const scrollPhase =
    ref('top-pause')


let animationFrame =
    null


let previousFrameTime =
    0


let pauseUntil =
    0


let manualPauseUntil =
    0


/*
  Floating-point scroll position.

  This is important because direct operations such as:

      element.scrollTop += 0.2

  may lose tiny fractional movements depending on
  browser behaviour and rendering conditions.
*/

let virtualScrollTop =
    0


/* ==================================================
   SCROLL HELPERS
================================================== */

const getMaxScroll = () => {

  const element =
      speechViewport.value


  if (!element) {
    return 0
  }


  return Math.max(
      0,

      element.scrollHeight
      -
      element.clientHeight
  )
}


/*
  Synchronise our floating point position with the
  real viewport position.

  Used after manual scrolling and when Auto is
  toggled back on.
*/

const syncVirtualScrollPosition = () => {

  const element =
      speechViewport.value


  if (!element) {
    return
  }


  virtualScrollTop =
      element.scrollTop
}


/*
  Reset a response back to the top and begin the
  standard VN scroll cycle.
*/

const resetScrollCycle = async () => {

  await nextTick()


  /*
    Give Markdown/layout one extra frame to settle.

    This matters when speech changes from the
    thinking state into a long rendered response.
  */

  await new Promise(resolve => {

    requestAnimationFrame(() => {
      resolve()
    })
  })


  const element =
      speechViewport.value


  if (!element) {
    return
  }


  element.scrollTop =
      0


  virtualScrollTop =
      0


  scrollPhase.value =
      'top-pause'


  pauseUntil =
      performance.now()
      +
      props.topPause


  previousFrameTime =
      0
}


/* ==================================================
   AUTO SCROLL LOOP

   FLOW:

   TOP
     ↓
   SHORT PAUSE
     ↓
   SLOW SCROLL DOWN
     ↓
   BOTTOM
     ↓
   LONG PAUSE
     ↓
   INSTANT JUMP TO TOP
     ↓
   REPEAT
================================================== */

const scrollLoop = timestamp => {

  const element =
      speechViewport.value


  /*
    Keep the animation loop alive while the element
    is temporarily unavailable.
  */

  if (!element) {

    previousFrameTime =
        timestamp


    animationFrame =
        requestAnimationFrame(
            scrollLoop
        )

    return
  }


  /* ================================================
     FRAME TIMING
  ================================================= */

  if (!previousFrameTime) {

    previousFrameTime =
        timestamp
  }


  const deltaSeconds =
      Math.min(
          (
              timestamp
              -
              previousFrameTime
          )
          /
          1000,

          /*
            Clamp large frame gaps.

            This prevents a tab switch or frame hitch
            from causing a huge scroll jump.
          */

          0.05
      )


  previousFrameTime =
      timestamp


  /* ================================================
     MANUAL USER CONTROL
  ================================================= */

  if (
      Date.now()
      <
      manualPauseUntil
  ) {

    /*
      User may be dragging or wheel-scrolling.

      Keep our virtual position aligned with them
      until automatic control resumes.
    */

    virtualScrollTop =
        element.scrollTop


    animationFrame =
        requestAnimationFrame(
            scrollLoop
        )

    return
  }


  const maxScroll =
      getMaxScroll()


  /* ================================================
     CONDITIONS WHERE AUTO SCROLL STOPS
  ================================================= */

  if (
      !autoEnabled.value
      ||
      props.loading
      ||
      maxScroll <= 1
  ) {

    virtualScrollTop =
        element.scrollTop


    animationFrame =
        requestAnimationFrame(
            scrollLoop
        )

    return
  }


  /* ================================================
     TOP PAUSE
  ================================================= */

  if (
      scrollPhase.value ===
      'top-pause'
  ) {

    if (
        timestamp >=
        pauseUntil
    ) {

      virtualScrollTop =
          element.scrollTop


      scrollPhase.value =
          'scrolling'
    }


    animationFrame =
        requestAnimationFrame(
            scrollLoop
        )

    return
  }


  /* ================================================
     BOTTOM PAUSE
  ================================================= */

  if (
      scrollPhase.value ===
      'bottom-pause'
  ) {

    if (
        timestamp >=
        pauseUntil
    ) {

      /*
        VN-style reset.

        Jump directly back to the beginning rather
        than reverse-scrolling upward.
      */

      element.scrollTop =
          0


      virtualScrollTop =
          0


      scrollPhase.value =
          'top-pause'


      pauseUntil =
          timestamp
          +
          props.topPause
    }


    animationFrame =
        requestAnimationFrame(
            scrollLoop
        )

    return
  }


  /* ================================================
     ACTIVE SCROLLING

     Update the floating-point position first.
     Then apply it to the real viewport.
  ================================================= */

  virtualScrollTop +=
      props.scrollSpeed
      *
      deltaSeconds


  virtualScrollTop =
      Math.min(
          virtualScrollTop,
          maxScroll
      )


  element.scrollTop =
      virtualScrollTop


  /* ================================================
     REACHED BOTTOM
  ================================================= */

  if (
      virtualScrollTop >=
      maxScroll - 0.5
  ) {

    virtualScrollTop =
        maxScroll


    element.scrollTop =
        maxScroll


    scrollPhase.value =
        'bottom-pause'


    pauseUntil =
        timestamp
        +
        props.bottomPause
  }


  animationFrame =
      requestAnimationFrame(
          scrollLoop
      )
}


/* ==================================================
   USER INTERACTION
================================================== */

/*
  Manual scroll pauses Auto for five seconds.

  The system resumes from wherever the user left
  the viewport rather than jumping elsewhere.
*/

const temporarilyPauseAutoScroll = () => {

  syncVirtualScrollPosition()


  manualPauseUntil =
      Date.now()
      +
      5000
}


/* ==================================================
   VN CONTROL BUTTONS
================================================== */

const handleDecorativeAction = action => {

  emit(
      'utility-action',
      action
  )
}


/* ==================================================
   AUTO BUTTON
================================================== */

const toggleAuto = () => {

  autoEnabled.value =
      !autoEnabled.value


  if (
      autoEnabled.value
  ) {

    /*
      Resume from the current real viewport
      position.
    */

    syncVirtualScrollPosition()


    previousFrameTime =
        0


    scrollPhase.value =
        'scrolling'
  }
}


/* ==================================================
   SKIP BUTTON
================================================== */

const skipToBottom = () => {

  const element =
      speechViewport.value


  if (!element) {
    return
  }


  const maxScroll =
      getMaxScroll()


  virtualScrollTop =
      maxScroll


  element.scrollTop =
      maxScroll


  scrollPhase.value =
      'bottom-pause'


  pauseUntil =
      performance.now()
      +
      props.bottomPause
}


/* ==================================================
   SPEECH CHANGE

   Every genuinely new response starts from the top.

   The loading watcher also handles the transition
   between Thinking → Response, but this watcher
   covers cases where speech changes directly while
   loading is already false.
================================================== */

watch(
    () => props.speech,

    async (
        newSpeech,
        oldSpeech
    ) => {

      if (
          newSpeech ===
          oldSpeech
      ) {
        return
      }


      /*
        While loading, the viewport belongs to the
        thinking state.

        The loading watcher will start the response
        cycle once loading becomes false.
      */

      if (
          props.loading
      ) {
        return
      }


      await resetScrollCycle()
    }
)


/* ==================================================
   LOADING STATE CHANGE

   THINKING START:
     Reset viewport to top.

   THINKING END:
     Wait for Markdown to render, then begin
     the normal auto-scroll cycle.
================================================== */

watch(
    () => props.loading,

    async (
        isLoading,
        wasLoading
    ) => {

      await nextTick()


      const element =
          speechViewport.value


      if (!element) {
        return
      }


      /* ================================================
         ENTERING THINKING STATE
      ================================================= */

      if (isLoading) {

        element.scrollTop =
            0


        virtualScrollTop =
            0


        scrollPhase.value =
            'top-pause'


        previousFrameTime =
            0


        return
      }


      /* ================================================
         THINKING FINISHED
      ================================================= */

      if (
          wasLoading
          &&
          !isLoading
      ) {

        await resetScrollCycle()
      }
    }
)


/* ==================================================
   AUTO ENABLED WATCH

   Defensive sync in case Auto is ever changed from
   somewhere other than toggleAuto().
================================================== */

watch(
    autoEnabled,

    enabled => {

      if (!enabled) {
        return
      }


      syncVirtualScrollPosition()


      previousFrameTime =
          0
    }
)


/* ==================================================
   LIFECYCLE
================================================== */

onMounted(async () => {

  await resetScrollCycle()


  animationFrame =
      requestAnimationFrame(
          scrollLoop
      )
})


onBeforeUnmount(() => {

  if (animationFrame) {

    cancelAnimationFrame(
        animationFrame
    )


    animationFrame =
        null
  }
})
</script>


<template>
  <!--
    Shell remains overflow-visible so the speaker
    nameplate can sit above and outside the main frame.
  -->

  <section
      class="vn-shell"
      :class="{
        'is-thinking': loading
      }"
  >

    <!-- ==================================================
         SPEAKER NAMEPLATE

         Separate box floating over the top-right edge.
    ================================================== -->

    <header class="speaker-nameplate">

      <!-- Faint motherboard decoration -->

      <div
          class="nameplate-board"
          aria-hidden="true"
      >
        <span class="board-node node-a"></span>
        <span class="board-node node-b"></span>
        <span class="board-node node-c"></span>
        <span class="board-node node-d"></span>
      </div>


      <!--
        Inline SVG symbol.

        This can later be replaced with any supplied
        panel/mediator-specific SVG without changing
        the layout.
      -->

      <svg
          class="nameplate-symbol"
          viewBox="0 0 48 48"
          aria-hidden="true"
      >
        <g
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
        >
          <path
              d="
                M24 4
                L28.5 15.5
                L40 10
                L34 21
                L45 24
                L34 27
                L40 38
                L28.5 32.5
                L24 44
                L19.5 32.5
                L8 38
                L14 27
                L3 24
                L14 21
                L8 10
                L19.5 15.5
                Z
              "
          />

          <path
              d="
                M24 14
                L30 24
                L24 34
                L18 24
                Z
              "
          />
        </g>

        <circle
            cx="24"
            cy="24"
            r="3"
            fill="currentColor"
        />
      </svg>


      <div class="speaker-copy">

        <strong class="speaker-name">
          {{ speakerName }}
        </strong>


        <span class="speaker-divider">
          —
        </span>


        <span class="speaker-role">
          {{ speakerRole }}
        </span>

      </div>


      <span
          class="nameplate-bracket"
          aria-hidden="true"
      ></span>

    </header>


    <!-- ==================================================
         MAIN DIALOGUE FRAME
    ================================================== -->

    <div class="vn-dialogue">

      <!-- Outer glow layers -->

      <div
          class="outer-frame outer-frame-a"
          aria-hidden="true"
      ></div>


      <div
          class="outer-frame outer-frame-b"
          aria-hidden="true"
      ></div>


      <!-- Internal cyber lines -->

      <div
          class="outer-circuit circuit-top"
          aria-hidden="true"
      >
        <i></i>
        <i></i>
        <i></i>
      </div>


      <div
          class="outer-circuit circuit-bottom"
          aria-hidden="true"
      >
        <i></i>
        <i></i>
      </div>


      <!-- Decorative corner particles -->

      <div
          class="ornament ornament-left"
          aria-hidden="true"
      ></div>


      <div
          class="ornament ornament-right"
          aria-hidden="true"
      ></div>


      <!-- ==================================================
           SECOND / INNER BACKGROUND PANEL
      ================================================== -->

      <div
          class="dialogue-surface"
          aria-hidden="true"
      >

        <div class="surface-grid"></div>


        <div class="surface-trace trace-a">
          <span></span>
          <span></span>
        </div>


        <div class="surface-trace trace-b">
          <span></span>
          <span></span>
        </div>


        <span class="surface-node surface-node-a"></span>
        <span class="surface-node surface-node-b"></span>
        <span class="surface-node surface-node-c"></span>

      </div>


      <!-- ==================================================
           SPEECH VIEWPORT
      ================================================== -->

      <div
          ref="speechViewport"
          class="speech-viewport"
          @wheel.passive="
            temporarilyPauseAutoScroll
          "
          @touchstart.passive="
            temporarilyPauseAutoScroll
          "
      >

        <!-- ================================================
             CYBER THINKING STATE
        ================================================= -->

        <div
            v-if="loading"
            class="thinking-state"
            role="status"
            aria-live="polite"
        >

          <div
              class="thinking-scanner"
              aria-hidden="true"
          ></div>


          <div class="thinking-status">

            <span class="thinking-led"></span>

            <span class="thinking-status-label">
              MEDIATOR CORE
            </span>

            <span class="thinking-status-separator">
              //
            </span>

            <span class="thinking-status-active">
              SYNTHESIS ACTIVE
            </span>

          </div>


          <div class="thinking-main">

            <div
                class="thinking-orbit"
                aria-hidden="true"
            >
              <span class="orbit-ring orbit-ring-a"></span>
              <span class="orbit-ring orbit-ring-b"></span>
              <span class="orbit-core"></span>
            </div>


            <div class="thinking-copy">

              <div class="thinking-title">

                <span>
                  Thinking through your situation
                </span>


                <span
                    class="thinking-dots"
                    aria-hidden="true"
                >
                  <i></i>
                  <i></i>
                  <i></i>
                </span>

              </div>


              <span class="thinking-subtitle">
                Analysing context, priorities and possible outcomes
              </span>

            </div>

          </div>


          <div
              class="thinking-traces"
              aria-hidden="true"
          >
            <span class="thinking-trace trace-one"></span>
            <span class="thinking-trace trace-two"></span>
            <span class="thinking-trace trace-three"></span>
          </div>

        </div>


        <!-- ================================================
             RESPONSE MARKDOWN
        ================================================= -->

        <div
            v-else
            class="markdown-content"
            v-html="renderedSpeech"
        ></div>

      </div>


      <!-- ==================================================
           SCROLL INDICATOR
      ================================================== -->

      <div
          v-if="!loading"
          class="scroll-indicator"
          :class="{
            active: autoEnabled
          }"
          aria-hidden="true"
      >
        <span></span>
      </div>


      <!-- ==================================================
           VN CONTROLS
      ================================================== -->

      <footer class="vn-controls">

        <!-- SAVE -->

        <button
            type="button"
            class="control-button"
            aria-label="Save"
            @click="
              handleDecorativeAction('save')
            "
        >

          <Save :size="13" />

          <span>
            Save
          </span>

        </button>


        <!-- LOAD / LOADING -->

        <button
            type="button"
            class="control-button load-control"
            :class="{
              loading
            }"
            :disabled="loading"
            :aria-busy="loading"
            aria-label="Load"
            @click="
              handleDecorativeAction('load')
            "
        >

          <span
              v-if="loading"
              class="load-icon-wrap"
          >
            <LoaderCircle
                :size="13"
                class="load-spinner"
            />
          </span>


          <FolderOpen
              v-else
              :size="13"
          />


          <span>
            {{ loading ? 'Loading' : 'Load' }}
          </span>


          <span
              v-if="loading"
              class="load-progress"
              aria-hidden="true"
          ></span>

        </button>


        <!-- AUTO -->

        <button
            type="button"
            class="control-button"
            :class="{
              active: autoEnabled
            }"
            aria-label="Toggle automatic scrolling"
            @click="toggleAuto"
        >

          <RotateCw :size="13" />

          <span>
            Auto
          </span>

        </button>


        <!-- SKIP -->

        <button
            type="button"
            class="control-button"
            aria-label="Skip to bottom"
            @click="skipToBottom"
        >

          <FastForward :size="13" />

          <span>
            Skip
          </span>

        </button>


        <!-- LOG -->

        <button
            type="button"
            class="control-button"
            aria-label="Log"
            @click="
              handleDecorativeAction('log')
            "
        >

          <ScrollText :size="13" />

          <span>
            Log
          </span>

        </button>


        <!-- SETTINGS -->

        <button
            type="button"
            class="control-button"
            aria-label="Settings"
            @click="
              handleDecorativeAction('settings')
            "
        >

          <Settings :size="13" />

          <span>
            Settings
          </span>

        </button>

      </footer>

    </div>

  </section>
</template>


<style scoped>
/* ==================================================
   COMPONENT SHELL

   The top padding creates physical room for the
   floating speaker nameplate.
================================================== */

.vn-shell {
  --violet:
      #9f54ff;

  --violet-bright:
      #c17aff;

  --violet-soft:
      rgba(161, 84, 255, 0.5);

  --blue:
      #648cff;

  --cyan:
      #69d7ff;

  position: relative;

  width: 100%;

  padding-top:
      clamp(
          2.5rem,
          3.4vw,
          3.6rem
      );

  overflow: visible;

  isolation: isolate;
}


/* ==================================================
   MAIN DIALOGUE FRAME
================================================== */

.vn-dialogue {
  position: relative;

  width: 100%;

  height:
      clamp(
          12rem,
          14vw,
          14.8rem
      );

  min-height: 12rem;

  overflow: hidden;

  color:
      rgba(240, 237, 255, 0.98);

  background:
      radial-gradient(
          circle at 74% 18%,
          rgba(69, 37, 143, 0.13),
          transparent 27%
      ),

      radial-gradient(
          circle at 15% 80%,
          rgba(50, 75, 160, 0.08),
          transparent 30%
      ),

      linear-gradient(
          180deg,
          rgba(9, 9, 32, 0.985) 0%,
          rgba(5, 7, 25, 0.985) 58%,
          rgba(4, 5, 18, 0.99) 100%
      );

  border:
      1px solid
      rgba(177, 101, 255, 0.98);

  clip-path:
      polygon(
          0 1.15rem,
          1.15rem 0,
          calc(100% - 1rem) 0,
          100% 1rem,
          100% calc(100% - 1.15rem),
          calc(100% - 1.15rem) 100%,
          1.15rem 100%,
          0 calc(100% - 1.15rem)
      );

  box-shadow:
      inset 0 0 1.6rem
      rgba(89, 48, 176, 0.13),

      inset 0 0 5rem
      rgba(21, 16, 68, 0.2),

      0 0 0.4rem
      rgba(178, 87, 255, 0.88),

      0 0 1.5rem
      rgba(101, 52, 240, 0.26);
}


/* ==================================================
   MAIN FRAME BACKGROUND TEXTURE
================================================== */

.vn-dialogue::before {
  content: '';

  position: absolute;

  inset: 0;

  z-index: 0;

  pointer-events: none;

  opacity: 0.48;

  background-image:
      linear-gradient(
          rgba(121, 75, 255, 0.025) 1px,
          transparent 1px
      ),

      linear-gradient(
          90deg,
          rgba(121, 75, 255, 0.025) 1px,
          transparent 1px
      );

  background-size:
      2.1rem 2.1rem;
}


/*
  Dark lower fade behind the buttons.
*/

.vn-dialogue::after {
  content: '';

  position: absolute;

  left: 0;
  right: 0;
  bottom: 0;

  height: 3.2rem;

  z-index: 2;

  pointer-events: none;

  background:
      linear-gradient(
          180deg,
          transparent,
          rgba(3, 4, 17, 0.48) 34%,
          rgba(3, 4, 15, 0.88)
      );
}


/* ==================================================
   OUTER FRAME LAYERS
================================================== */

.outer-frame {
  position: absolute;

  z-index: 3;

  pointer-events: none;
}


.outer-frame-a {
  inset: 0.42rem;

  border:
      1px solid
      rgba(115, 73, 255, 0.52);

  clip-path:
      polygon(
          0 0.85rem,
          0.85rem 0,
          calc(100% - 0.75rem) 0,
          100% 0.75rem,
          100% calc(100% - 0.85rem),
          calc(100% - 0.85rem) 100%,
          0.85rem 100%,
          0 calc(100% - 0.85rem)
      );

  box-shadow:
      inset 0 0 0.9rem
      rgba(126, 70, 255, 0.13);
}


.outer-frame-b {
  inset:
      0.75rem
      0.86rem;

  border-top:
      1px solid
      rgba(157, 83, 255, 0.18);

  border-bottom:
      1px solid
      rgba(86, 93, 255, 0.16);
}


/* ==================================================
   OUTER CIRCUIT LINES
================================================== */

.outer-circuit {
  position: absolute;

  z-index: 4;

  pointer-events: none;

  opacity: 0.58;
}


.circuit-top {
  top: 0.72rem;
  left: 3rem;

  width: 58%;
  height: 1.35rem;

  border-top:
      1px solid
      rgba(157, 85, 255, 0.48);

  border-right:
      1px solid
      rgba(110, 102, 255, 0.28);

  clip-path:
      polygon(
          0 0,
          100% 0,
          100% 38%,
          96% 38%,
          94% 100%,
          62% 100%,
          60% 52%,
          0 52%
      );
}


.circuit-top i {
  position: absolute;

  display: block;

  width: 3px;
  height: 3px;

  border:
      1px solid
      rgba(191, 114, 255, 0.8);

  border-radius: 50%;

  box-shadow:
      0 0 0.3rem
      rgba(171, 90, 255, 0.8);
}


.circuit-top i:nth-child(1) {
  top: -2px;
  left: 18%;
}


.circuit-top i:nth-child(2) {
  top: -2px;
  left: 56%;
}


.circuit-top i:nth-child(3) {
  right: 0;
  bottom: 0;
}


.circuit-bottom {
  left: 2rem;
  bottom: 0.55rem;

  width: 51%;
  height: 1.45rem;

  border-bottom:
      1px solid
      rgba(159, 80, 255, 0.4);

  border-right:
      1px solid
      rgba(102, 101, 255, 0.25);

  clip-path:
      polygon(
          0 52%,
          63% 52%,
          66% 0,
          100% 0,
          100% 100%,
          0 100%
      );
}


.circuit-bottom i {
  position: absolute;

  bottom: -2px;

  width: 3px;
  height: 3px;

  border-radius: 50%;

  background:
      rgba(186, 107, 255, 0.8);

  box-shadow:
      0 0 0.35rem
      rgba(169, 82, 255, 0.9);
}


.circuit-bottom i:nth-child(1) {
  left: 28%;
}


.circuit-bottom i:nth-child(2) {
  left: 73%;
}


/* ==================================================
   FLOATING SPEAKER NAMEPLATE
================================================== */

.speaker-nameplate {
  position: absolute;

  top: 0;
  right: -0.15rem;

  z-index: 30;

  width:
      clamp(
          20rem,
          42vw,
          39rem
      );

  min-height:
      clamp(
          3.85rem,
          4.6vw,
          4.8rem
      );

  display: flex;

  align-items: center;

  gap:
      clamp(
          0.55rem,
          0.8vw,
          0.9rem
      );

  padding:
      0.6rem
      clamp(
          1.1rem,
          1.8vw,
          1.8rem
      );

  overflow: hidden;

  color:
      rgba(243, 239, 255, 0.98);

  background:
      linear-gradient(
          135deg,
          rgba(17, 13, 50, 0.985),
          rgba(7, 8, 30, 0.99) 56%,
          rgba(13, 9, 41, 0.985)
      );

  border:
      1px solid
      rgba(186, 105, 255, 0.96);

  clip-path:
      polygon(
          1.15rem 0,
          100% 0,
          100% calc(100% - 0.72rem),
          calc(100% - 0.72rem) 100%,
          1.1rem 100%,
          0 calc(100% - 1rem),
          0 1.15rem
      );

  box-shadow:
      inset 0 0 1.5rem
      rgba(96, 53, 210, 0.18),

      0 0 0.4rem
      rgba(186, 92, 255, 0.82),

      0 0 1.3rem
      rgba(105, 56, 235, 0.38);
}


/*
  Internal bevel line.
*/

.speaker-nameplate::before {
  content: '';

  position: absolute;

  inset: 0.4rem;

  z-index: 1;

  pointer-events: none;

  border:
      1px solid
      rgba(123, 79, 255, 0.36);

  clip-path:
      polygon(
          0.85rem 0,
          100% 0,
          100% calc(100% - 0.4rem),
          calc(100% - 0.4rem) 100%,
          0.75rem 100%,
          0 calc(100% - 0.7rem),
          0 0.85rem
      );
}


/*
  Small animated light sweep.
*/

.speaker-nameplate::after {
  content: '';

  position: absolute;

  top: 0;
  bottom: 0;

  left: -24%;

  width: 20%;

  z-index: 2;

  pointer-events: none;

  opacity: 0.25;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(161, 102, 255, 0.2),
          transparent
      );

  transform:
      skewX(-22deg);

  animation:
      nameplate-sweep
      7s linear
      infinite;
}


@keyframes nameplate-sweep {

  0% {
    left: -25%;
  }

  55%,
  100% {
    left: 125%;
  }
}


/* ==================================================
   NAMEPLATE MOTHERBOARD DESIGN
================================================== */

.nameplate-board {
  position: absolute;

  inset: 0;

  z-index: 0;

  pointer-events: none;

  opacity: 0.46;

  background:
      linear-gradient(
          90deg,
          transparent 0 8%,
          rgba(121, 72, 255, 0.2) 8% 8.15%,
          transparent 8.15% 28%,
          rgba(104, 92, 255, 0.15) 28% 28.12%,
          transparent 28.12% 58%,
          rgba(157, 78, 255, 0.12) 58% 58.14%,
          transparent 58.14%
      ),

      linear-gradient(
          180deg,
          transparent 0 24%,
          rgba(131, 74, 255, 0.16) 24% 24.7%,
          transparent 24.7% 66%,
          rgba(94, 106, 255, 0.12) 66% 66.7%,
          transparent 66.7%
      );
}


.nameplate-board::before {
  content: '';

  position: absolute;

  left: 1.3rem;
  top: 1rem;

  width: 42%;
  height: 1.5rem;

  border-top:
      1px solid
      rgba(148, 82, 255, 0.28);

  border-left:
      1px solid
      rgba(121, 89, 255, 0.2);

  clip-path:
      polygon(
          0 0,
          68% 0,
          73% 28%,
          100% 28%,
          100% 100%,
          72% 100%,
          67% 66%,
          0 66%
      );
}


.board-node {
  position: absolute;

  width: 4px;
  height: 4px;

  border:
      1px solid
      rgba(173, 97, 255, 0.8);

  border-radius: 50%;

  box-shadow:
      0 0 0.3rem
      rgba(163, 83, 255, 0.8);
}


.node-a {
  top: 19%;
  left: 18%;
}


.node-b {
  top: 65%;
  left: 34%;
}


.node-c {
  top: 30%;
  right: 18%;
}


.node-d {
  bottom: 16%;
  right: 8%;
}


/* ==================================================
   NAMEPLATE CONTENT
================================================== */

.nameplate-symbol {
  position: relative;

  z-index: 5;

  flex: 0 0 auto;

  width:
      clamp(
          1.8rem,
          2.4vw,
          2.7rem
      );

  height:
      clamp(
          1.8rem,
          2.4vw,
          2.7rem
      );

  color:
      rgba(170, 91, 255, 0.98);

  filter:
      drop-shadow(
          0 0 0.42rem
          rgba(144, 65, 255, 0.68)
      );
}


.speaker-copy {
  position: relative;

  z-index: 5;

  min-width: 0;

  display: flex;

  align-items: baseline;

  gap:
      clamp(
          0.45rem,
          0.8vw,
          0.8rem
      );

  white-space: nowrap;
}


.speaker-name {
  color:
      rgba(248, 245, 255, 0.99);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          1.08rem,
          1.75vw,
          1.85rem
      );

  font-weight: 700;

  letter-spacing: 0.02em;

  text-shadow:
      0 0 0.7rem
      rgba(182, 119, 255, 0.2);
}


.speaker-divider {
  color:
      rgba(198, 112, 255, 0.8);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.9rem,
          1.25vw,
          1.25rem
      );
}


.speaker-role {
  color:
      rgba(187, 95, 255, 0.98);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.9rem,
          1.3vw,
          1.35rem
      );

  text-shadow:
      0 0 0.55rem
      rgba(156, 71, 255, 0.36);
}


.nameplate-bracket {
  position: absolute;

  right: 0.75rem;
  top: 0.7rem;
  bottom: 0.7rem;

  width: 0.6rem;

  z-index: 5;

  border-top:
      1px solid
      rgba(190, 111, 255, 0.72);

  border-right:
      1px solid
      rgba(190, 111, 255, 0.72);

  border-bottom:
      1px solid
      rgba(190, 111, 255, 0.72);
}


/* ==================================================
   DECORATIVE CORNER ORNAMENTS
================================================== */

.ornament {
  position: absolute;

  z-index: 6;

  width: 7.5rem;
  height: 7rem;

  pointer-events: none;

  opacity: 0.72;

  filter:
      drop-shadow(
          0 0 0.26rem
          rgba(171, 85, 255, 0.72)
      );
}


.ornament::before {
  content: '';

  position: absolute;

  inset: 0;

  background:
      radial-gradient(
          circle at 18% 18%,
          #c275ff 0 1.2px,
          transparent 2.2px
      ),

      radial-gradient(
          circle at 31% 36%,
          #9551ff 0 1.8px,
          transparent 2.8px
      ),

      radial-gradient(
          circle at 48% 17%,
          #d08cff 0 1.1px,
          transparent 2.1px
      ),

      radial-gradient(
          circle at 59% 48%,
          #884cff 0 1.5px,
          transparent 2.5px
      ),

      radial-gradient(
          circle at 75% 27%,
          #c26aff 0 1.3px,
          transparent 2.3px
      ),

      radial-gradient(
          ellipse at 36% 23%,
          rgba(165, 78, 255, 0.42) 0 3px,
          transparent 4px
      ),

      radial-gradient(
          ellipse at 54% 42%,
          rgba(193, 102, 255, 0.36) 0 3px,
          transparent 4px
      );
}


.ornament::after {
  content: '';

  position: absolute;

  left: 8%;
  top: 14%;

  width: 80%;
  height: 70%;

  border-top:
      1px solid
      rgba(155, 75, 255, 0.5);

  transform:
      rotate(29deg)
      skewX(-18deg);

  transform-origin:
      left center;
}


.ornament-left {
  top: 0.45rem;
  left: 0.25rem;
}


.ornament-right {
  right: 0.2rem;
  bottom: 0.1rem;

  transform:
      rotate(180deg);
}


/* ==================================================
   INNER DIALOGUE PANEL

   This is the second visual panel behind the text.
================================================== */

.dialogue-surface {
  position: absolute;

  top: 2.7rem;
  left: 5.8%;
  right: 4.8%;
  bottom: 3.05rem;

  z-index: 4;

  overflow: hidden;

  pointer-events: none;

  background:
      radial-gradient(
          circle at 90% 12%,
          rgba(72, 52, 166, 0.09),
          transparent 28%
      ),

      linear-gradient(
          120deg,
          rgba(10, 12, 39, 0.7),
          rgba(4, 6, 24, 0.6)
      );

  border:
      1px solid
      rgba(124, 84, 255, 0.38);

  clip-path:
      polygon(
          1.35rem 0,
          100% 0,
          100% calc(100% - 0.8rem),
          calc(100% - 0.8rem) 100%,
          56% 100%,
          53% calc(100% - 0.82rem),
          1.1rem calc(100% - 0.82rem),
          0 calc(100% - 1.85rem),
          0 1.2rem
      );

  box-shadow:
      inset 0 0 1.15rem
      rgba(67, 54, 181, 0.14),

      inset 0 0 3rem
      rgba(48, 28, 115, 0.08),

      0 0 0.55rem
      rgba(102, 62, 255, 0.13);
}


.dialogue-surface::before {
  content: '';

  position: absolute;

  inset: 0.35rem;

  border:
      1px solid
      rgba(96, 85, 255, 0.13);

  clip-path:
      polygon(
          1rem 0,
          100% 0,
          100% calc(100% - 0.5rem),
          calc(100% - 0.5rem) 100%,
          56% 100%,
          53% calc(100% - 0.55rem),
          0.8rem calc(100% - 0.55rem),
          0 calc(100% - 1.45rem),
          0 0.9rem
      );
}


.surface-grid {
  position: absolute;

  inset: 0;

  opacity: 0.2;

  background-image:
      linear-gradient(
          rgba(107, 79, 255, 0.035) 1px,
          transparent 1px
      ),

      linear-gradient(
          90deg,
          rgba(107, 79, 255, 0.035) 1px,
          transparent 1px
      );

  background-size:
      1.7rem 1.7rem;
}


/* ==================================================
   INNER PANEL CIRCUIT TRACES
================================================== */

.surface-trace {
  position: absolute;

  opacity: 0.65;
}


.trace-a {
  top: 0.65rem;
  right: 1rem;

  width: 28%;
  height: 2rem;

  border-top:
      1px solid
      rgba(116, 81, 255, 0.28);

  border-left:
      1px solid
      rgba(116, 81, 255, 0.18);

  clip-path:
      polygon(
          18% 0,
          100% 0,
          100% 36%,
          38% 36%,
          33% 100%,
          0 100%,
          0 68%,
          15% 68%
      );
}


.trace-b {
  left: 1rem;
  bottom: 0.55rem;

  width: 34%;
  height: 2.4rem;

  border-bottom:
      1px solid
      rgba(121, 83, 255, 0.24);

  border-right:
      1px solid
      rgba(121, 83, 255, 0.18);

  clip-path:
      polygon(
          0 62%,
          52% 62%,
          58% 0,
          100% 0,
          100% 100%,
          0 100%
      );
}


.surface-node {
  position: absolute;

  width: 5px;
  height: 5px;

  border:
      1px solid
      rgba(130, 92, 255, 0.6);

  border-radius: 50%;

  box-shadow:
      0 0 0.4rem
      rgba(131, 74, 255, 0.58);
}


.surface-node-a {
  top: 0.6rem;
  left: 34%;
}


.surface-node-b {
  right: 12%;
  top: 1.25rem;
}


.surface-node-c {
  left: 45%;
  bottom: 0.65rem;
}


/* ==================================================
   SPEECH VIEWPORT
================================================== */

.speech-viewport {
  position: absolute;

  top: 3.55rem;
  left: 8.7%;
  right: 8.8%;
  bottom: 3.6rem;

  z-index: 10;

  overflow-y: auto;
  overflow-x: hidden;

  padding-right: 1.25rem;

  scroll-behavior: auto;

  scrollbar-width: none;

  mask-image:
      linear-gradient(
          to bottom,
          transparent 0,
          black 0.18rem,
          black calc(100% - 0.18rem),
          transparent 100%
      );
}


.speech-viewport::-webkit-scrollbar {
  display: none;
}


/* ==================================================
   MARKDOWN
================================================== */

.markdown-content {
  max-width: 72rem;

  color:
      rgba(235, 231, 244, 0.97);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.88rem,
          1.08vw,
          1.12rem
      );

  line-height: 1.45;

  letter-spacing: 0.003em;

  text-shadow:
      0 1px 0
      rgba(0, 0, 0, 0.6);
}


.markdown-content :deep(p) {
  margin:
      0
      0
      0.75rem;
}


.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}


.markdown-content :deep(strong) {
  color:
      rgba(255, 255, 255, 0.99);

  font-weight: 700;
}


.markdown-content :deep(em) {
  color:
      rgba(218, 193, 255, 0.99);
}


.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin:
      0.8rem
      0
      0.42rem;

  color:
      rgba(240, 222, 255, 0.99);

  line-height: 1.2;
}


.markdown-content :deep(h1) {
  font-size: 1.3em;
}


.markdown-content :deep(h2) {
  font-size: 1.18em;
}


.markdown-content :deep(h3) {
  font-size: 1.08em;
}


.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin:
      0.45rem
      0
      0.8rem;

  padding-left: 1.35rem;
}


.markdown-content :deep(li) {
  margin-bottom: 0.26rem;
}


.markdown-content :deep(blockquote) {
  margin:
      0.65rem
      0;

  padding:
      0.42rem
      0.8rem;

  border-left:
      2px solid
      rgba(166, 85, 255, 0.76);

  color:
      rgba(216, 203, 235, 0.98);

  background:
      linear-gradient(
          90deg,
          rgba(126, 64, 255, 0.1),
          transparent
      );
}


.markdown-content :deep(code) {
  padding:
      0.1rem
      0.28rem;

  border:
      1px solid
      rgba(142, 80, 255, 0.24);

  border-radius: 0.18rem;

  color:
      rgba(221, 198, 255, 0.99);

  background:
      rgba(14, 8, 36, 0.75);

  font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;

  font-size: 0.88em;
}


.markdown-content :deep(pre) {
  overflow-x: auto;

  margin:
      0.7rem
      0;

  padding: 0.7rem;

  border:
      1px solid
      rgba(142, 80, 255, 0.3);

  background:
      rgba(3, 5, 17, 0.82);
}


.markdown-content :deep(pre code) {
  padding: 0;

  border: 0;

  background: transparent;
}


/* ==================================================
   CYBER THINKING STATE
================================================== */

.thinking-state {
  position: relative;

  min-height: 100%;

  overflow: hidden;

  display: flex;

  flex-direction: column;

  justify-content: center;

  gap: 0.75rem;

  padding:
      0.7rem
      1rem;

  border-left:
      1px solid
      rgba(149, 84, 255, 0.24);

  background:
      linear-gradient(
          90deg,
          rgba(95, 55, 190, 0.055),
          transparent 42%
      );
}


/*
  Horizontal scanner sweeping through the
  thinking state.
*/

.thinking-scanner {
  position: absolute;

  left: 0;
  right: 0;
  top: -0.2rem;

  height: 1px;

  opacity: 0.85;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(104, 205, 255, 0.22),
          rgba(184, 103, 255, 0.8),
          rgba(104, 205, 255, 0.22),
          transparent
      );

  box-shadow:
      0 0 0.5rem
      rgba(151, 83, 255, 0.55);

  animation:
      scanner-pass
      2.8s ease-in-out
      infinite;
}


@keyframes scanner-pass {

  0% {
    top: 4%;
    opacity: 0;
  }

  16% {
    opacity: 0.9;
  }

  82% {
    opacity: 0.72;
  }

  100% {
    top: 96%;
    opacity: 0;
  }
}


/* ==================================================
   THINKING STATUS HEADER
================================================== */

.thinking-status {
  display: flex;

  align-items: center;

  gap: 0.42rem;

  color:
      rgba(153, 124, 209, 0.72);

  font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;

  font-size:
      clamp(
          0.52rem,
          0.58vw,
          0.65rem
      );

  letter-spacing: 0.13em;
}


.thinking-led {
  width: 0.42rem;
  height: 0.42rem;

  border-radius: 50%;

  background:
      rgba(112, 217, 255, 0.96);

  box-shadow:
      0 0 0.25rem
      rgba(98, 207, 255, 0.95),

      0 0 0.6rem
      rgba(125, 98, 255, 0.5);

  animation:
      thinking-led
      1.15s ease-in-out
      infinite;
}


@keyframes thinking-led {

  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}


.thinking-status-label {
  color:
      rgba(191, 151, 255, 0.86);
}


.thinking-status-separator {
  opacity: 0.45;
}


.thinking-status-active {
  color:
      rgba(111, 205, 255, 0.78);
}


/* ==================================================
   THINKING MAIN CONTENT
================================================== */

.thinking-main {
  display: flex;

  align-items: center;

  gap: 1.25rem;
}


/* ==================================================
   THINKING ORBIT
================================================== */

.thinking-orbit {
  position: relative;

  flex:
      0
      0
      2.9rem;

  width: 2.9rem;
  height: 2.9rem;

  display: grid;

  place-items: center;
}


.orbit-ring {
  position: absolute;

  border-radius: 50%;
}


.orbit-ring-a {
  inset: 0;

  border:
      1px solid
      rgba(151, 86, 255, 0.52);

  border-top-color:
      rgba(111, 209, 255, 0.9);

  box-shadow:
      0 0 0.4rem
      rgba(128, 70, 255, 0.28);

  animation:
      orbit-clockwise
      2.25s linear
      infinite;
}


.orbit-ring-b {
  inset: 0.45rem;

  border:
      1px dashed
      rgba(183, 106, 255, 0.48);

  border-right-color:
      rgba(110, 220, 255, 0.86);

  animation:
      orbit-counter
      1.55s linear
      infinite;
}


.orbit-core {
  width: 0.52rem;
  height: 0.52rem;

  border-radius: 50%;

  background:
      rgba(184, 103, 255, 0.96);

  box-shadow:
      0 0 0.45rem
      rgba(181, 91, 255, 0.95),

      0 0 1.05rem
      rgba(101, 176, 255, 0.5);

  animation:
      core-pulse
      1.35s ease-in-out
      infinite;
}


@keyframes orbit-clockwise {

  to {
    transform: rotate(360deg);
  }
}


@keyframes orbit-counter {

  to {
    transform: rotate(-360deg);
  }
}


@keyframes core-pulse {

  0%,
  100% {
    transform: scale(0.78);
    opacity: 0.6;
  }

  50% {
    transform: scale(1.14);
    opacity: 1;
  }
}


/* ==================================================
   THINKING COPY
================================================== */

.thinking-copy {
  min-width: 0;
}


.thinking-title {
  display: flex;

  align-items: baseline;

  color:
      rgba(232, 224, 247, 0.96);

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          0.9rem,
          1.08vw,
          1.1rem
      );

  letter-spacing: 0.01em;

  text-shadow:
      0 0 0.5rem
      rgba(153, 85, 255, 0.18);
}


.thinking-subtitle {
  display: block;

  margin-top: 0.3rem;

  color:
      rgba(148, 133, 181, 0.72);

  font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;

  font-size:
      clamp(
          0.5rem,
          0.58vw,
          0.64rem
      );

  letter-spacing: 0.075em;
}


/* ==================================================
   THINKING DOTS
================================================== */

.thinking-dots {
  display: inline-flex;

  align-items: center;

  gap: 0.22rem;

  margin-left: 0.45rem;
}


.thinking-dots i {
  width: 0.28rem;
  height: 0.28rem;

  border-radius: 50%;

  background:
      rgba(177, 103, 255, 0.95);

  box-shadow:
      0 0 0.35rem
      rgba(163, 82, 255, 0.88);

  animation:
      thinking-dot
      1.2s ease-in-out
      infinite;
}


.thinking-dots i:nth-child(2) {
  animation-delay: 0.16s;
}


.thinking-dots i:nth-child(3) {
  animation-delay: 0.32s;
}


@keyframes thinking-dot {

  0%,
  65%,
  100% {
    opacity: 0.22;
    transform: translateY(0);
  }

  32% {
    opacity: 1;
    transform: translateY(-0.22rem);
  }
}


/* ==================================================
   THINKING DATA TRACES
================================================== */

.thinking-traces {
  display: flex;

  align-items: center;

  gap: 0.5rem;

  width:
      min(
          28rem,
          74%
      );

  height: 0.35rem;
}


.thinking-trace {
  position: relative;

  display: block;

  height: 1px;

  overflow: hidden;

  background:
      rgba(112, 82, 192, 0.22);
}


.thinking-trace::after {
  content: '';

  position: absolute;

  top: 0;
  bottom: 0;

  width: 34%;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(99, 214, 255, 0.85),
          rgba(176, 96, 255, 0.95),
          transparent
      );

  animation:
      trace-data
      2s linear
      infinite;
}


.trace-one {
  width: 42%;
}


.trace-two {
  width: 29%;
}


.trace-three {
  width: 18%;
}


.trace-two::after {
  animation-delay: 0.55s;
}


.trace-three::after {
  animation-delay: 1.05s;
}


@keyframes trace-data {

  from {
    left: -38%;
  }

  to {
    left: 110%;
  }
}


/* ==================================================
   THINKING MODE PANEL RESPONSE
================================================== */

.vn-shell.is-thinking
.dialogue-surface {
  border-color:
      rgba(132, 91, 255, 0.52);

  box-shadow:
      inset 0 0 1.5rem
      rgba(72, 55, 190, 0.18),

      inset 0 0 4rem
      rgba(58, 27, 129, 0.1),

      0 0 0.75rem
      rgba(104, 63, 255, 0.2);

  animation:
      thinking-surface
      2.1s ease-in-out
      infinite;
}


@keyframes thinking-surface {

  0%,
  100% {
    filter: brightness(0.92);
  }

  50% {
    filter: brightness(1.1);
  }
}


/* ==================================================
   SCROLL INDICATOR
================================================== */

.scroll-indicator {
  position: absolute;

  right: 12.5%;
  bottom: 3.48rem;

  z-index: 12;

  width: 1.6rem;
  height: 1rem;

  display: grid;

  place-items: center;

  opacity: 0.46;
}


.scroll-indicator span {
  width: 0;
  height: 0;

  border-left:
      0.5rem solid transparent;

  border-right:
      0.5rem solid transparent;

  border-top:
      0.62rem solid
      rgba(229, 220, 255, 0.98);

  filter:
      drop-shadow(
          0 0 0.38rem
          rgba(130, 77, 255, 0.94)
      );
}


.scroll-indicator.active {
  animation:
      indicator-float
      1.55s ease-in-out
      infinite;
}


@keyframes indicator-float {

  0%,
  100% {
    transform:
        translateY(0);

    opacity: 0.48;
  }

  50% {
    transform:
        translateY(0.22rem);

    opacity: 1;
  }
}


/* ==================================================
   CONTROL RAIL
================================================== */

.vn-controls {
  position: absolute;

  right: 1.2rem;
  bottom: 0.6rem;

  z-index: 20;

  display: flex;

  align-items: center;

  gap: 0.42rem;
}


/*
  Diagonal connection from the inner panel
  into the button rail.
*/

.vn-controls::before {
  content: '';

  position: absolute;

  right: calc(100% + 0.45rem);
  bottom: 50%;

  width: 4.5rem;
  height: 1.8rem;

  border-top:
      1px solid
      rgba(147, 79, 255, 0.42);

  border-right:
      1px solid
      rgba(147, 79, 255, 0.28);

  transform:
      skewX(-42deg)
      translateY(50%);

  transform-origin:
      right center;

  pointer-events: none;
}


/* ==================================================
   CONTROL BUTTONS
================================================== */

.control-button {
  position: relative;

  height: 2rem;

  min-width: 4.35rem;

  padding:
      0
      0.65rem;

  overflow: hidden;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 0.35rem;

  border:
      1px solid
      rgba(142, 84, 255, 0.46);

  border-radius: 0;

  clip-path:
      polygon(
          0.48rem 0,
          100% 0,
          100% calc(100% - 0.28rem),
          calc(100% - 0.28rem) 100%,
          0.4rem 100%,
          0 calc(100% - 0.4rem),
          0 0.48rem
      );

  color:
      rgba(221, 211, 241, 0.93);

  background:
      linear-gradient(
          180deg,
          rgba(27, 21, 55, 0.95),
          rgba(11, 10, 32, 0.98)
      );

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size: 0.7rem;

  cursor: pointer;

  box-shadow:
      inset 0 1px
      rgba(255, 255, 255, 0.025),

      inset 0 0 0.8rem
      rgba(104, 67, 215, 0.05);

  transition:
      color 150ms ease,
      border-color 150ms ease,
      background 150ms ease,
      box-shadow 150ms ease,
      transform 150ms ease;
}


.control-button::before {
  content: '';

  position: absolute;

  top: 0;
  bottom: 0;
  left: -65%;

  width: 38%;

  pointer-events: none;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(164, 107, 255, 0.14),
          transparent
      );

  transform:
      skewX(-22deg);

  transition:
      left 380ms ease;
}


.control-button:hover::before {
  left: 120%;
}


.control-button:hover {
  color:
      rgba(255, 255, 255, 1);

  border-color:
      rgba(185, 110, 255, 0.78);

  background:
      linear-gradient(
          180deg,
          rgba(53, 30, 91, 0.96),
          rgba(20, 13, 48, 0.98)
      );

  box-shadow:
      0 0 0.6rem
      rgba(138, 71, 255, 0.22),

      inset 0 0 0.8rem
      rgba(139, 76, 255, 0.08);

  transform:
      translateY(-1px);
}


.control-button.active {
  color:
      rgba(242, 229, 255, 1);

  border-color:
      rgba(188, 115, 255, 0.9);

  box-shadow:
      inset 0 0 0.5rem
      rgba(147, 69, 255, 0.2),

      0 0 0.5rem
      rgba(147, 69, 255, 0.18);
}


/* ==================================================
   LOAD BUTTON ACTIVE ANIMATION
================================================== */

.load-control.loading {
  color:
      rgba(217, 230, 255, 0.98);

  border-color:
      rgba(106, 194, 255, 0.72);

  cursor: wait;

  background:
      linear-gradient(
          180deg,
          rgba(25, 35, 69, 0.98),
          rgba(13, 12, 42, 0.99)
      );

  box-shadow:
      inset 0 0 0.8rem
      rgba(72, 155, 255, 0.12),

      0 0 0.55rem
      rgba(86, 172, 255, 0.16);

  animation:
      load-button-pulse
      1.5s ease-in-out
      infinite;
}


.load-control:disabled {
  opacity: 1;
}


.load-icon-wrap {
  display: inline-flex;

  align-items: center;

  justify-content: center;
}


.load-spinner {
  animation:
      load-spin
      0.9s linear
      infinite;
}


.load-progress {
  position: absolute;

  left: 0;
  bottom: 0;

  width: 36%;
  height: 1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(101, 213, 255, 0.98),
          rgba(186, 111, 255, 0.96),
          transparent
      );

  box-shadow:
      0 0 0.4rem
      rgba(102, 198, 255, 0.7);

  animation:
      load-progress
      1.45s linear
      infinite;
}


@keyframes load-spin {

  to {
    transform: rotate(360deg);
  }
}


@keyframes load-progress {

  from {
    left: -38%;
  }

  to {
    left: 104%;
  }
}


@keyframes load-button-pulse {

  0%,
  100% {
    filter: brightness(0.9);
  }

  50% {
    filter: brightness(1.15);
  }
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 1100px) {

  .speaker-nameplate {
    width: 54%;
  }


  .speaker-name {
    font-size:
        clamp(
            0.95rem,
            1.7vw,
            1.4rem
        );
  }


  .speaker-role {
    font-size:
        clamp(
            0.75rem,
            1.15vw,
            1rem
        );
  }


  .speech-viewport {
    left: 8%;
    right: 7.5%;
  }


  .control-button {
    min-width: 2.2rem;

    padding:
        0
        0.46rem;
  }


  .control-button span:not(
    .load-progress
  ):not(
    .load-icon-wrap
  ) {
    display: none;
  }
}


@media (max-width: 720px) {

  .vn-shell {
    padding-top: 2.35rem;
  }


  .speaker-nameplate {
    width: 68%;

    min-height: 3.4rem;

    padding:
        0.45rem
        0.85rem;
  }


  .nameplate-symbol {
    width: 1.5rem;
    height: 1.5rem;
  }


  .speaker-copy {
    gap: 0.3rem;
  }


  .speaker-name {
    font-size: 0.92rem;
  }


  .speaker-role {
    font-size: 0.7rem;
  }


  .vn-dialogue {
    height: 12rem;
  }


  .dialogue-surface {
    left: 4.5%;
    right: 4.5%;
  }


  .speech-viewport {
    left: 7%;
    right: 6%;
  }


  .thinking-subtitle {
    display: none;
  }


  .thinking-status {
    letter-spacing: 0.06em;
  }


  .vn-controls {
    right: 0.75rem;

    gap: 0.25rem;
  }


  .control-button {
    width: 1.9rem;
    min-width: 1.9rem;

    padding: 0;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (
prefers-reduced-motion: reduce
) {

  .speaker-nameplate::after,
  .thinking-scanner,
  .thinking-led,
  .orbit-ring-a,
  .orbit-ring-b,
  .orbit-core,
  .thinking-dots i,
  .thinking-trace::after,
  .load-spinner,
  .load-progress,
  .load-control.loading,
  .scroll-indicator.active,
  .vn-shell.is-thinking
  .dialogue-surface {
    animation: none;
  }
}
</style>
