<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount
} from "vue"


/* ==================================================
   PROPS
================================================== */

const props =
    defineProps({

      items: {
        type: Array,
        default: () => []
      },

      modelValue: {
        type: [
          String,
          Number
        ],
        default: null
      },

      loading: {
        type: Boolean,
        default: false
      },

      primary: {
        type: String,
        default: "#a579ff"
      },

      secondary: {
        type: String,
        default: "#51dcff"
      }
    })


/* ==================================================
   EMITS
================================================== */

const emit =
    defineEmits([

      "update:modelValue",

      "select"
    ])


/* ==================================================
   REFS
================================================== */

const viewportRef =
    ref(
        null
    )


const cursorIndex =
    ref(
        0
    )


const dragging =
    ref(
        false
    )


const dragOffset =
    ref(
        0
    )


const viewportHeight =
    ref(
        700
    )


/* ==================================================
   POINTER STATE
================================================== */

let observer =
    null


let activePointerId =
    null


let lastPointerY =
    0


let totalMovement =
    0


let suppressClick =
    false


/* ==================================================
   ROOT STYLE
================================================== */

const selectorStyle =
    computed(
        () => ({

          "--primary":
          props.primary,

          "--secondary":
          props.secondary
        })
    )


/* ==================================================
   SLOT COUNT

   Same visual system as the horizontal selector:
   maximum of five visible cards.
================================================== */

const slotCount =
    computed(
        () =>

            Math.min(

                5,

                props.items.length
            )
    )


/* ==================================================
   HELPERS
================================================== */

function normalizeId(
    value
) {

  if (
      value === null

      ||

      value === undefined

      ||

      value === ""
  ) {

    return null
  }


  return String(
      value
  )
}


function sameId(
    first,
    second
) {

  return (

      normalizeId(
          first
      )

      ===

      normalizeId(
          second
      )
  )
}


function wrapIndex(
    index
) {

  const length =
      props.items.length


  if (!length) {

    return 0
  }


  return (

      (
          index % length
      )

      +

      length

  ) % length
}


function clamp(
    value,
    min,
    max
) {

  return Math.min(

      Math.max(
          value,
          min
      ),

      max
  )
}


/* ==================================================
   DRAG STEP

   Horizontal selector used viewport width.

   Vertical version uses viewport height.
================================================== */

function dragStep() {

  return Math.max(

      viewportHeight.value *
      0.15,

      80
  )
}


/* ==================================================
   SLOT OFFSETS

   Preserved exactly from the horizontal component.
================================================== */

function getOffsets(
    count
) {

  if (
      count === 1
  ) {

    return [
      0
    ]
  }


  if (
      count === 2
  ) {

    return [
      0,
      1
    ]
  }


  if (
      count === 3
  ) {

    return [
      -1,
      0,
      1
    ]
  }


  if (
      count === 4
  ) {

    return [
      -1,
      0,
      1,
      2
    ]
  }


  return [
    -2,
    -1,
    0,
    1,
    2
  ]
}


/* ==================================================
   VISIBLE ITEMS
================================================== */

const visibleItems =
    computed(
        () => {

          if (
              !slotCount.value
          ) {

            return []
          }


          return getOffsets(

              slotCount.value

          )
              .map(
                  distance => {

                    const itemIndex =
                        wrapIndex(

                            cursorIndex.value

                            +

                            distance
                        )


                    return {

                      item:
                          props.items[
                              itemIndex
                              ],

                      itemIndex,

                      distance
                    }
                  }
              )
        }
    )


/* ==================================================
   VERTICAL ORBIT GEOMETRY

   Original horizontal geometry:

   active position = top of horizontal ellipse.

   Vertical geometry:

   active position = left side of vertical ellipse.

   Cards above and below follow the vertical arc.
================================================== */

function itemStyle(
    entry
) {

  const normalizedDrag =

      dragOffset.value

      /

      dragStep()


  const rawDistance =

      entry.distance

      +

      normalizedDrag


  /*
   * Active item:
   *
   * angle 180°
   *
   * = left-most point of ellipse.
   *
   * Negative distance travels upward.
   * Positive distance travels downward.
   */

  const angle =

      180

      -

      rawDistance * 35


  const radians =

      angle

      *

      Math.PI

      /

      180


  /*
   * Vertical rotation of the original orbit geometry.
   */

  const x =

      66

      +

      Math.cos(
          radians
      ) * 32


  const y =

      50

      +

      Math.sin(
          radians
      ) * 44


  const distance =

      Math.abs(
          rawDistance
      )


  const opacity =

      clamp(

          1

          -

          distance * 0.36,

          0.12,

          1
      )


  const scale =

      clamp(

          1

          -

          distance * 0.13,

          0.7,

          1
      )


  const rotation =

      rawDistance * 7


  const z =

      Math.round(

          20

          -

          distance * 5
      )


  return {

    "--x":
        `${x}%`,

    "--y":
        `${y}%`,

    "--opacity":
    opacity,

    "--scale":
    scale,

    "--rotate":
        `${rotation}deg`,

    "--z":
    z
  }
}


/* ==================================================
   SYNC FROM MODEL
================================================== */

function syncFromModel() {

  if (
      !props.items.length
  ) {

    cursorIndex.value =
        0

    return
  }


  const index =
      props.items.findIndex(

          item =>

              sameId(

                  item.id,

                  props.modelValue
              )
      )


  cursorIndex.value =

      index >= 0

          ? index

          : props.items.length - 1
}


/* ==================================================
   EMIT CURRENT SELECTION
================================================== */

function emitCurrentSelection() {

  const item =
      props.items[
          cursorIndex.value
          ]


  if (!item) {

    return
  }


  emit(

      "update:modelValue",

      item.id
  )


  emit(

      "select",

      item
  )
}


/* ==================================================
   SHIFT SELECTION
================================================== */

function shiftSelection(
    direction
) {

  if (
      props.loading

      ||

      props.items.length <= 1
  ) {

    return
  }


  cursorIndex.value =

      wrapIndex(

          cursorIndex.value

          +

          direction
      )


  emitCurrentSelection()
}


/* ==================================================
   CLICK ITEM
================================================== */

function selectVisibleItem(
    entry
) {

  if (
      suppressClick

      ||

      props.loading
  ) {

    return
  }


  if (
      entry.itemIndex ===
      cursorIndex.value
  ) {

    return
  }


  cursorIndex.value =
      entry.itemIndex


  dragOffset.value =
      0


  emitCurrentSelection()
}


/* ==================================================
   POINTER DOWN
================================================== */

function handlePointerDown(
    event
) {

  if (
      props.loading
  ) {

    return
  }


  if (
      event.pointerType === "mouse"

      &&

      event.button !== 0
  ) {

    return
  }


  activePointerId =
      event.pointerId


  lastPointerY =
      event.clientY


  totalMovement =
      0


  dragging.value =
      true


  viewportRef.value
      ?.setPointerCapture(
          event.pointerId
      )
}


/* ==================================================
   POINTER MOVE

   Vertical equivalent of horizontal X dragging.
================================================== */

function handlePointerMove(
    event
) {

  if (
      !dragging.value

      ||

      event.pointerId !==
      activePointerId
  ) {

    return
  }


  const delta =

      event.clientY

      -

      lastPointerY


  lastPointerY =
      event.clientY


  totalMovement +=
      Math.abs(
          delta
      )


  dragOffset.value +=
      delta


  const step =
      dragStep()


  while (
      dragOffset.value >=
      step
      ) {

    dragOffset.value -=
        step


    shiftSelection(
        -1
    )
  }


  while (
      dragOffset.value <=
      -step
      ) {

    dragOffset.value +=
        step


    shiftSelection(
        1
    )
  }
}


/* ==================================================
   SETTLE DRAG
================================================== */

function settleDrag() {

  const step =
      dragStep()


  const threshold =
      step * 0.23


  if (
      dragOffset.value >
      threshold
  ) {

    shiftSelection(
        -1
    )


    dragOffset.value -=
        step
  }


  else if (
      dragOffset.value <
      -threshold
  ) {

    shiftSelection(
        1
    )


    dragOffset.value +=
        step
  }


  dragging.value =
      false


  requestAnimationFrame(
      () => {

        dragOffset.value =
            0
      }
  )
}


/* ==================================================
   POINTER END
================================================== */

function handlePointerEnd(
    event
) {

  if (
      event.pointerId !==
      activePointerId
  ) {

    return
  }


  suppressClick =

      totalMovement >
      7


  try {

    viewportRef.value
        ?.releasePointerCapture(
            event.pointerId
        )

  } catch {

    /* no-op */
  }


  activePointerId =
      null


  settleDrag()


  setTimeout(
      () => {

        suppressClick =
            false

      },
      0
  )
}


/* ==================================================
   WHEEL

   Vertical selector supports natural wheel selection.
================================================== */

let wheelLocked =
    false


let wheelTimer =
    null


function handleWheel(
    event
) {

  if (
      props.loading

      ||

      wheelLocked

      ||

      props.items.length <= 1

      ||

      Math.abs(
          event.deltaY
      ) < 8
  ) {

    return
  }


  shiftSelection(

      event.deltaY > 0

          ? 1

          : -1
  )


  wheelLocked =
      true


  clearTimeout(
      wheelTimer
  )


  wheelTimer =
      setTimeout(
          () => {

            wheelLocked =
                false

          },
          320
      )
}


/* ==================================================
   KEYBOARD
================================================== */

function handleKeydown(
    event
) {

  if (
      props.loading
  ) {

    return
  }


  if (
      event.key ===
      "ArrowUp"
  ) {

    event.preventDefault()


    shiftSelection(
        -1
    )
  }


  if (
      event.key ===
      "ArrowDown"
  ) {

    event.preventDefault()


    shiftSelection(
        1
    )
  }
}


/* ==================================================
   WATCHERS
================================================== */

watch(

    () =>
        props.modelValue,

    syncFromModel
)


watch(

    () =>
        props.items.map(
            item =>
                item.id
        ),

    syncFromModel
)


/* ==================================================
   MOUNT
================================================== */

onMounted(
    () => {

      syncFromModel()


      observer =
          new ResizeObserver(

              entries => {

                const entry =
                    entries[0]


                if (!entry) {

                  return
                }


                viewportHeight.value =
                    entry.contentRect.height
              }
          )


      if (
          viewportRef.value
      ) {

        observer.observe(
            viewportRef.value
        )
      }
    }
)


/* ==================================================
   CLEANUP
================================================== */

onBeforeUnmount(
    () => {

      observer
          ?.disconnect()


      clearTimeout(
          wheelTimer
      )
    }
)
</script>


<template>
  <section
      class="discussion-selector"
      :style="selectorStyle"
  >
    <div
        ref="viewportRef"
        class="selector-viewport"
        :class="{
          'is-dragging':
            dragging,

          'is-loading':
            loading
        }"
        tabindex="0"
        @wheel.prevent="handleWheel"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerEnd"
        @pointercancel="handlePointerEnd"
        @keydown="handleKeydown"
    >

      <!-- ================================================
           VERTICAL ORBIT
      ================================================= -->

      <div class="orbit-ring">
        <span class="orbit-trace" />

        <span
            class="
              orbit-node
              orbit-node-top
            "
        />

        <span
            class="
              orbit-node
              orbit-node-bottom
            "
        />
      </div>


      <!-- ================================================
           CARDS
      ================================================= -->

      <button
          v-for="entry in visibleItems"
          :key="entry.item.id"
          class="selector-item"
          :class="{
            active:
              entry.itemIndex ===
              cursorIndex
          }"
          :style="itemStyle(entry)"
          type="button"
          @click="
            selectVisibleItem(entry)
          "
      >
        <span class="item-frame">

          <span class="active-line" />


          <span class="item-node">
            <span class="node-core" />
          </span>


          <span class="item-copy">
            <span class="item-title">
              {{
                entry.item.title
              }}
            </span>


            <span
                v-if="
                  entry.item.subtitle
                "
                class="item-subtitle"
            >
              {{
                entry.item.subtitle
              }}
            </span>
          </span>


          <span class="item-number">
            {{
              String(
                  entry.itemIndex + 1
              ).padStart(
                  2,
                  "0"
              )
            }}
          </span>
        </span>


        <!-- ==============================================
             POINTER FACES INTO THE ORBIT
        =============================================== -->

        <span class="active-pointer">
          <span class="pointer-core" />
        </span>
      </button>


      <!-- ================================================
           ACTIVE AXIS MARKER
      ================================================= -->

      <div class="crown-marker">
        <span class="crown-core" />
      </div>


      <!-- ================================================
           VERTICAL DRAG HINT
      ================================================= -->

      <div class="drag-hint">
        <span class="drag-line" />

        <span class="drag-copy">
          DRAG TO SELECT
        </span>

        <span class="drag-line" />
      </div>


      <!-- ================================================
           EMPTY
      ================================================= -->

      <div
          v-if="!items.length"
          class="empty-state"
      >
        <span class="empty-symbol">
          ◇
        </span>

        <span class="empty-title">
          NO CONVERSATIONS
        </span>

        <span class="empty-copy">
          Completed discussions will appear here.
        </span>
      </div>
    </div>
  </section>
</template>


<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}


/* ==================================================
   ROOT
================================================== */

.discussion-selector {
  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  position: relative;

  overflow: visible;
}


/* ==================================================
   VIEWPORT
================================================== */

.selector-viewport {
  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  position: relative;

  overflow: hidden;

  cursor: grab;

  user-select: none;

  touch-action: none;

  outline: none;
}


.selector-viewport.is-dragging {
  cursor: grabbing;
}


.selector-viewport.is-loading {
  cursor: wait;
}


/* ==================================================
   VERTICAL ORBIT

   Rotated equivalent of:

   left: 6%
   top: 34%
   width: 88%
   height: 66%

   Horizontal ellipse becomes vertical ellipse.
================================================== */

.orbit-ring {
  position: absolute;

  left: 34%;
  top: 6%;

  width: 66%;
  height: 88%;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 21%,
          transparent
      );

  border-radius: 50%;

  pointer-events: none;
}


.orbit-ring::before {
  content: "";

  position: absolute;

  inset: 5%;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--secondary) 6%,
          transparent
      );

  border-radius: 50%;
}


/* ==================================================
   ORBIT TRACE

   Original horizontal trace was across the top.

   Rotated version runs down the active side.
================================================== */

.orbit-trace {
  position: absolute;

  left: -1px;
  top: 42%;

  width: 1px;
  height: 16%;

  background:
      var(--primary);

  box-shadow:
      0 0 0.65rem
      color-mix(
          in srgb,
          var(--primary) 82%,
          transparent
      );
}


/* ==================================================
   ORBIT NODES
================================================== */

.orbit-node {
  position: absolute;

  width: 0.4rem;

  aspect-ratio: 1;

  left: 50%;

  background:
      var(--secondary);

  transform:
      translateX(-50%)
      rotate(45deg);

  opacity: 0.45;

  box-shadow:
      0 0 0.4rem
      color-mix(
          in srgb,
          var(--secondary) 50%,
          transparent
      );
}


.orbit-node-top {
  top: -0.2rem;
}


.orbit-node-bottom {
  bottom: -0.2rem;
}


/* ==================================================
   SELECTOR ITEMS
================================================== */

.selector-item {
  position: absolute;

  left:
      var(--x);

  top:
      var(--y);

  width:
      clamp(
          9rem,
          78%,
          13.5rem
      );

  height:
      clamp(
          2.8rem,
          8vh,
          3.8rem
      );

  padding: 0;

  border: none;

  background: transparent;

  color:
      rgba(
          233,
          244,
          255,
          0.7
      );

  opacity:
      var(--opacity);

  z-index:
      var(--z);

  transform:
      translate(
          -50%,
          -50%
      )
      rotate(
          var(--rotate)
      )
      scale(
          var(--scale)
      );

  transform-origin:
      center;

  cursor: pointer;

  transition:
      left
      280ms
      cubic-bezier(
          0.22,
          0.8,
          0.2,
          1
      ),
      top
      280ms
      cubic-bezier(
          0.22,
          0.8,
          0.2,
          1
      ),
      transform
      280ms
      cubic-bezier(
          0.22,
          0.8,
          0.2,
          1
      ),
      opacity
      280ms
      ease;
}


.is-dragging
.selector-item {
  transition: none;
}


.is-loading
.selector-item {
  pointer-events: none;
}


/* ==================================================
   CARD FRAME
================================================== */

.item-frame {
  width: 100%;
  height: 100%;

  position: relative;

  display: grid;

  grid-template-columns:
    auto
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap:
      clamp(
          0.45rem,
          0.7vw,
          0.75rem
      );

  padding:
      0.45rem
      0.7rem;

  border:
      1px solid
      rgba(
          255,
          255,
          255,
          0.075
      );

  background:
      rgba(
          2,
          4,
          11,
          0.92
      );

  box-shadow:
      inset
      0 0 1rem
      rgba(
          255,
          255,
          255,
          0.012
      );

  overflow: hidden;

  transition:
      border-color
      180ms
      ease,
      box-shadow
      180ms
      ease,
      background-color
      180ms
      ease;
}


.selector-item:hover
.item-frame {
  border-color:
      color-mix(
          in srgb,
          var(--primary) 45%,
          transparent
      );
}


.selector-item.active
.item-frame {
  border-color:
      color-mix(
          in srgb,
          var(--primary) 80%,
          var(--secondary) 20%
      );

  background:
      rgba(
          3,
          7,
          16,
          0.98
      );

  box-shadow:
      0 0 1.15rem
      color-mix(
          in srgb,
          var(--primary) 17%,
          transparent
      ),
      inset
      0 0 0.9rem
      color-mix(
          in srgb,
          var(--secondary) 8%,
          transparent
      );
}


/* ==================================================
   ACTIVE LINE
================================================== */

.active-line {
  position: absolute;

  top: -1px;

  left: 24%;
  right: 24%;

  height: 1px;

  opacity: 0;

  background:
      var(--primary);

  box-shadow:
      0 0 0.5rem
      var(--primary);

  transition:
      opacity
      180ms
      ease,
      left
      180ms
      ease,
      right
      180ms
      ease;
}


.selector-item.active
.active-line {
  opacity: 1;

  left: 8%;
  right: 8%;
}


/* ==================================================
   ITEM NODE
================================================== */

.item-node {
  width:
      clamp(
          0.95rem,
          1.25vw,
          1.2rem
      );

  aspect-ratio: 1;

  display: grid;
  place-items: center;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--secondary) 52%,
          transparent
      );

  transform:
      rotate(45deg);

  transition:
      border-color
      180ms
      ease,
      box-shadow
      180ms
      ease;
}


.node-core {
  width: 30%;

  aspect-ratio: 1;

  background:
      var(--secondary);

  opacity: 0.48;

  transition:
      opacity
      180ms
      ease,
      background-color
      180ms
      ease,
      box-shadow
      180ms
      ease;
}


.selector-item.active
.item-node {
  border-color:
      var(--primary);

  box-shadow:
      0 0 0.5rem
      color-mix(
          in srgb,
          var(--primary) 42%,
          transparent
      );
}


.selector-item.active
.node-core {
  opacity: 1;

  background:
      var(--primary);

  box-shadow:
      0 0 0.45rem
      var(--primary);
}


/* ==================================================
   ITEM COPY
================================================== */

.item-copy {
  min-width: 0;

  display: flex;
  flex-direction: column;

  gap: 0.12rem;

  text-align: left;
}


.item-title {
  overflow: hidden;

  white-space: nowrap;

  text-overflow: ellipsis;

  font-family:
      Georgia,
      "Times New Roman",
      serif;

  font-size:
      clamp(
          0.63rem,
          0.76vw,
          0.8rem
      );

  letter-spacing:
      0.035em;
}


.item-subtitle {
  overflow: hidden;

  white-space: nowrap;

  text-overflow: ellipsis;

  color:
      var(--primary);

  font-size:
      clamp(
          0.42rem,
          0.5vw,
          0.56rem
      );

  letter-spacing:
      0.09em;

  text-transform:
      uppercase;

  opacity: 0.62;
}


.selector-item.active
.item-subtitle {
  opacity: 1;
}


/* ==================================================
   ITEM NUMBER
================================================== */

.item-number {
  align-self: start;

  color:
      var(--secondary);

  font-size:
      clamp(
          0.4rem,
          0.46vw,
          0.48rem
      );

  letter-spacing:
      0.1em;

  opacity: 0.5;
}


.selector-item.active
.item-number {
  color:
      var(--primary);

  opacity: 1;
}


/* ==================================================
   ACTIVE POINTER

   Horizontal version:
   pointer below card.

   Vertical rotation:
   pointer on right side, facing orbit interior.
================================================== */

.active-pointer {
  position: absolute;

  right: -0.48rem;
  top: 50%;

  width: 0.8rem;

  aspect-ratio: 1;

  display: grid;
  place-items: center;

  border:
      1px solid
      var(--primary);

  background:
      rgba(
          2,
          4,
          11,
          0.98
      );

  opacity: 0;

  transform:
      translateY(-50%)
      rotate(45deg);

  box-shadow:
      0 0 0.55rem
      color-mix(
          in srgb,
          var(--primary) 46%,
          transparent
      );

  transition:
      opacity
      180ms
      ease;
}


.selector-item.active
.active-pointer {
  opacity: 1;
}


.pointer-core {
  width: 28%;

  aspect-ratio: 1;

  background:
      var(--primary);

  box-shadow:
      0 0 0.4rem
      var(--primary);
}


/* ==================================================
   CROWN MARKER

   Rotated from top-center to left-center.
================================================== */

.crown-marker {
  position: absolute;

  left: 4%;
  top: 50%;

  width: 0.95rem;

  aspect-ratio: 1;

  display: grid;
  place-items: center;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 80%,
          transparent
      );

  transform:
      translateY(-50%)
      rotate(45deg);

  pointer-events: none;

  box-shadow:
      0 0 0.65rem
      color-mix(
          in srgb,
          var(--primary) 32%,
          transparent
      );
}


.crown-core {
  width: 28%;

  aspect-ratio: 1;

  background:
      var(--primary);

  box-shadow:
      0 0 0.4rem
      var(--primary);
}


/* ==================================================
   VERTICAL DRAG HINT
================================================== */

.drag-hint {
  position: absolute;

  right: 2.5%;
  top: 50%;

  height:
      clamp(
          9rem,
          28%,
          14rem
      );

  display: grid;

  grid-template-rows:
    minmax(0, 1fr)
    auto
    minmax(0, 1fr);

  justify-items: center;
  align-items: center;

  gap: 0.5rem;

  transform:
      translateY(-50%);

  pointer-events: none;

  opacity: 0.42;
}


.drag-line {
  width: 1px;
  height: 100%;

  background:
      color-mix(
          in srgb,
          var(--secondary) 42%,
          transparent
      );
}


.drag-copy {
  color:
      var(--secondary);

  font-size:
      clamp(
          0.38rem,
          0.46vw,
          0.48rem
      );

  letter-spacing:
      0.14em;

  white-space: nowrap;

  writing-mode:
      vertical-rl;

  text-orientation:
      mixed;
}


/* ==================================================
   EMPTY STATE
================================================== */

.empty-state {
  position: absolute;

  inset: 0;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 0.45rem;

  text-align: center;

  pointer-events: none;
}


.empty-symbol {
  color:
      var(--primary);

  font-size: 1.4rem;

  text-shadow:
      0 0 0.5rem
      color-mix(
          in srgb,
          var(--primary) 60%,
          transparent
      );
}


.empty-title {
  color:
      var(--secondary);

  font-size: 0.48rem;

  letter-spacing: 0.14em;
}


.empty-copy {
  max-width: 12rem;

  color:
      rgba(
          220,
          228,
          245,
          0.42
      );

  font-size: 0.58rem;

  line-height: 1.5;
}


/* ==================================================
   COMPACT WIDTH
================================================== */

@media
(max-width: 700px) {

  .selector-item {
    width:
        clamp(
            6.5rem,
            68%,
            9rem
        );

    height:
        clamp(
            2.45rem,
            8vh,
            3.1rem
        );
  }


  .item-number {
    display: none;
  }


  .item-frame {
    grid-template-columns:
      auto
      minmax(0, 1fr);
  }


  .orbit-ring {
    left: 30%;

    width: 70%;
  }


  .drag-hint {
    right: 1%;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media
(prefers-reduced-motion: reduce) {

  .selector-item,
  .item-frame,
  .item-node,
  .node-core,
  .active-line,
  .active-pointer {
    transition: none;
  }
}
</style>
