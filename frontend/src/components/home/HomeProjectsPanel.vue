<script setup>
import {
  computed
} from 'vue'


import {
  MessagesSquare,
  Hexagon
} from 'lucide-vue-next'


/* ==================================================
   PROPS
================================================== */

const props =
    defineProps({

      projects: {
        type:
        Array,

        default:
            () => []
      }

    })


/* ==================================================
   EMITS
================================================== */

const emit =
    defineEmits([
      'open'
    ])


/* ==================================================
   TIMESTAMP
================================================== */

function timestampOf(
    discussion
) {

  const timestamp =
      new Date(

          discussion?.updatedAt

          ??

          discussion?.createdAt

          ??

          0
      )
          .getTime()


  return Number.isFinite(
      timestamp
  )
      ? timestamp
      : 0
}


/* ==================================================
   THREE LATEST
================================================== */

const latestDiscussions =
    computed(
        () => [

          ...props.projects

        ]
            .sort(
                (
                    first,
                    second
                ) =>

                    timestampOf(
                        second
                    )

                    -

                    timestampOf(
                        first
                    )
            )

            .slice(
                0,
                3
            )
    )


/* ==================================================
   ROW ACCENTS
================================================== */

const discussionAccents = [
  '#965bff',
  '#ff9d2f',
  '#31d9ef'
]


function discussionAccent(
    index
) {

  return (

      discussionAccents[
          index
          ]

      ??

      '#965bff'
  )
}


/* ==================================================
   DISCUSSION COUNT / ROUND

   The current session-backed data contains
   currentRound rather than a project discussion count.

   Keep the fallback flexible for later project data.
================================================== */

function discussionCount(
    discussion
) {

  return (

      discussion?.discussionCount

      ??

      discussion?.discussions

      ??

      discussion?.currentRound

      ??

      0
  )
}


/* ==================================================
   UPDATED TEXT
================================================== */

function updatedText(
    discussion
) {

  const date =
      new Date(

          discussion?.updatedAt

          ??

          discussion?.createdAt

          ??

          0
      )


  const timestamp =
      date.getTime()


  if (
      !Number.isFinite(
          timestamp
      )
  ) {

    return ''
  }


  const difference =
      Math.max(
          0,

          Date.now() -
          timestamp
      )


  const minutes =
      Math.floor(
          difference /
          60_000
      )


  const hours =
      Math.floor(
          difference /
          3_600_000
      )


  const days =
      Math.floor(
          difference /
          86_400_000
      )


  if (
      minutes <
      1
  ) {

    return 'Updated just now'
  }


  if (
      minutes <
      60
  ) {

    return (
        `Updated ${minutes}m ago`
    )
  }


  if (
      hours <
      24
  ) {

    return (
        `Updated ${hours}h ago`
    )
  }


  if (
      days ===
      1
  ) {

    return 'Updated yesterday'
  }


  return (
      `Updated ${days} days ago`
  )
}


/* ==================================================
   STATUS
================================================== */

const statusLabels = {

  ready:
      'READY',

  active:
      'ACTIVE',

  paused:
      'PAUSED',

  completed:
      'COMPLETED',

  abandoned:
      'ABANDONED'

}


function statusLabel(
    discussion
) {

  const status =
      String(
          discussion?.status
          ??
          'ready'
      )
          .toLowerCase()


  return (

      statusLabels[
          status
          ]

      ??

      status.toUpperCase()
  )
}


/* ==================================================
   STATUS CLASS
================================================== */

function statusClass(
    discussion
) {

  return (
      `status-${
          String(
              discussion?.status
              ??
              'ready'
          )
              .toLowerCase()
      }`
  )
}


/* ==================================================
   OPEN DISCUSSION
================================================== */

function openDiscussion(
    discussion
) {

  emit(
      'open',
      discussion
  )
}
</script>


<template>
  <section class="discussions-panel">

    <!-- ==================================================
         HEADER
    =================================================== -->

    <header class="discussions-header">

      <div class="header-left">

        <MessagesSquare
            class="header-icon"
            :stroke-width="1.6"
        />


        <span class="header-title">
          LATEST DISCUSSIONS
        </span>

      </div>


      <span class="header-count">
        {{ latestDiscussions.length }}
        RECENT
      </span>

    </header>


    <!-- ==================================================
         DISCUSSIONS
    =================================================== -->

    <div class="discussions-list">

      <button
          v-for="(
            discussion,
            index
          ) in latestDiscussions"

          :key="discussion.id"

          type="button"

          class="discussion-row"

          :style="{
            '--accent':
              discussionAccent(
                index
              )
          }"

          @click="
            openDiscussion(
              discussion
            )
          "
      >

        <!-- ==========================================
             DISCUSSION MARK
        =========================================== -->

        <div class="discussion-mark">

          <div class="mark-aura"></div>


          <div class="mark-frame">

            <Hexagon
                class="mark-icon"
                :stroke-width="1.25"
            />

            <span class="mark-core"></span>

          </div>

        </div>


        <!-- ==========================================
             INFORMATION
        =========================================== -->

        <div class="discussion-info">

          <div class="discussion-title">
            {{ discussion.title }}
          </div>


          <div class="discussion-meta">

            <span>
              {{ discussionCount(discussion) }}
              rounds
            </span>


            <span class="meta-dot">
              •
            </span>


            <span>
              {{ updatedText(discussion) }}
            </span>

          </div>

        </div>


        <!-- ==========================================
             MODE
        =========================================== -->

        <div class="discussion-mode">

          <span class="mode-label">
            {{
              String(
                  discussion.mode
                  ??
                  ''
              )
                  .toUpperCase()
            }}
          </span>

        </div>


        <!-- ==========================================
             STATUS TAG
        =========================================== -->

        <div class="status-holder">

          <span
              class="status-tag"
              :class="
                statusClass(
                  discussion
                )
              "
          >
            <span class="status-dot"></span>

            {{
              statusLabel(
                  discussion
              )
            }}
          </span>

        </div>

      </button>


      <!-- ==================================================
           EMPTY
      =================================================== -->

      <div
          v-if="
            !latestDiscussions.length
          "
          class="discussions-empty"
      >

        <MessagesSquare
            class="empty-icon"
            :stroke-width="1.3"
        />

        <span>
          No discussions yet
        </span>

      </div>

    </div>

  </section>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.discussions-panel {
  position:
      relative;

  width:
      100%;

  height:
      100%;

  min-width:
      0;

  min-height:
      0;

  display:
      grid;

  grid-template-rows:
      auto
      minmax(
          0,
          1fr
      );

  overflow:
      hidden;

  border:
      1px solid
      rgb(145 92 255 / 0.48);

  border-radius:
      9px;

  background:
      linear-gradient(
          145deg,
          rgb(8 10 27 / 0.92),
          rgb(8 10 25 / 0.84)
      );

  box-shadow:
      inset 0 0 30px
      rgb(84 41 180 / 0.055);

  color:
      #eeeaff;

  box-sizing:
      border-box;
}


/* ==================================================
   TOP LIGHT
================================================== */

.discussions-panel::before {
  content:
      "";

  position:
      absolute;

  top:
      -1px;

  left:
      3%;

  right:
      3%;

  height:
      1px;

  z-index:
      5;

  pointer-events:
      none;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgb(153 91 255 / 0.75),
          transparent
      );

  box-shadow:
      0 0 10px
      rgb(134 71 255 / 0.36);
}


/* ==================================================
   HEADER
================================================== */

.discussions-header {
  position:
      relative;

  z-index:
      2;

  min-height:
      clamp(
          2rem,
          3.1vh,
          2.8rem
      );

  padding:
      0
      clamp(
          0.8rem,
          1.15vw,
          1.3rem
      );

  display:
      flex;

  align-items:
      center;

  justify-content:
      space-between;

  border-bottom:
      1px solid
      rgb(153 96 255 / 0.12);

  box-sizing:
      border-box;
}


.header-left {
  display:
      flex;

  align-items:
      center;

  gap:
      clamp(
          0.5rem,
          0.7vw,
          0.75rem
      );
}


.header-icon {
  width:
      clamp(
          0.85rem,
          1vw,
          1.15rem
      );

  height:
      auto;

  color:
      #a06cff;

  filter:
      drop-shadow(
          0 0 4px
          rgb(140 78 255 / 0.35)
      );
}


.header-title {
  font-size:
      clamp(
          0.52rem,
          0.62vw,
          0.75rem
      );

  font-weight:
      700;

  letter-spacing:
      0.12em;

  color:
      #a67cff;

  text-shadow:
      0 0 10px
      rgb(144 87 255 / 0.3);
}


.header-count {
  font-size:
      clamp(
          0.4rem,
          0.46vw,
          0.56rem
      );

  font-weight:
      600;

  letter-spacing:
      0.1em;

  color:
      rgba(
          208,
          198,
          230,
          0.48
      );
}


/* ==================================================
   LIST
================================================== */

.discussions-list {
  position:
      relative;

  z-index:
      2;

  min-height:
      0;

  display:
      grid;

  grid-template-rows:
      repeat(
          3,
          minmax(
              0,
              1fr
          )
      );

  gap:
      clamp(
          0.2rem,
          0.35vh,
          0.35rem
      );

  padding:
      clamp(
          0.4rem,
          0.6vh,
          0.65rem
      )
      clamp(
          0.55rem,
          0.75vw,
          0.8rem
      );

  overflow:
      hidden;

  box-sizing:
      border-box;
}


/* ==================================================
   ROW
================================================== */

.discussion-row {
  position:
      relative;

  min-width:
      0;

  min-height:
      0;

  display:
      grid;

  grid-template-columns:
      clamp(
          3.7rem,
          4.7vw,
          5.4rem
      )
      minmax(
          0,
          1fr
      )
      clamp(
          4rem,
          5vw,
          6rem
      )
      clamp(
          5.5rem,
          7vw,
          8rem
      );

  align-items:
      center;

  padding:
      0;

  overflow:
      hidden;

  border:
      1px solid
      rgb(255 255 255 / 0.07);

  border-radius:
      7px;

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--accent)
              4%,
              transparent
          ),
          rgb(255 255 255 / 0.008)
      );

  color:
      inherit;

  font-family:
      inherit;

  text-align:
      left;

  cursor:
      pointer;

  box-sizing:
      border-box;

  transition:
      border-color
      0.2s
      ease,
      background
      0.2s
      ease,
      transform
      0.2s
      ease;
}


.discussion-row:hover {
  border-color:
      color-mix(
          in srgb,
          var(--accent)
          38%,
          transparent
      );

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--accent)
              9%,
              transparent
          ),
          rgb(255 255 255 / 0.012)
      );
}


/* ==================================================
   MARK
================================================== */

.discussion-mark {
  position:
      relative;

  width:
      100%;

  height:
      100%;

  display:
      grid;

  place-items:
      center;
}


.mark-aura {
  position:
      absolute;

  width:
      58%;

  aspect-ratio:
      1;

  border-radius:
      50%;

  background:
      var(--accent);

  opacity:
      0.12;

  filter:
      blur(
          12px
      );
}


.mark-frame {
  position:
      relative;

  z-index:
      2;

  width:
      clamp(
          2rem,
          2.7vw,
          3rem
      );

  aspect-ratio:
      1;

  display:
      grid;

  place-items:
      center;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--accent)
          58%,
          transparent
      );

  transform:
      rotate(
          30deg
      );

  background:
      color-mix(
          in srgb,
          var(--accent)
          7%,
          rgb(8 10 24)
      );

  box-shadow:
      0 0 12px
      color-mix(
          in srgb,
          var(--accent)
          22%,
          transparent
      );
}


.mark-icon {
  width:
      62%;

  height:
      62%;

  color:
      var(--accent);

  transform:
      rotate(
          -30deg
      );

  filter:
      drop-shadow(
          0 0 4px
          var(--accent)
      );
}


.mark-core {
  position:
      absolute;

  width:
      17%;

  aspect-ratio:
      1;

  border:
      1px solid
      var(--accent);

  transform:
      rotate(
          15deg
      );
}


/* ==================================================
   INFO
================================================== */

.discussion-info {
  min-width:
      0;

  padding-right:
      clamp(
          0.6rem,
          1vw,
          1rem
      );
}


.discussion-title {
  overflow:
      hidden;

  text-overflow:
      ellipsis;

  white-space:
      nowrap;

  font-size:
      clamp(
          0.62rem,
          0.76vw,
          0.92rem
      );

  font-weight:
      650;

  letter-spacing:
      0.055em;

  text-transform:
      uppercase;

  color:
      rgba(
          237,
          233,
          248,
          0.9
      );
}


.discussion-meta {
  margin-top:
      clamp(
          0.18rem,
          0.3vh,
          0.3rem
      );

  display:
      flex;

  align-items:
      center;

  gap:
      0.35rem;

  overflow:
      hidden;

  white-space:
      nowrap;

  font-size:
      clamp(
          0.42rem,
          0.49vw,
          0.6rem
      );

  color:
      rgba(
          199,
          192,
          220,
          0.55
      );
}


.meta-dot {
  color:
      color-mix(
          in srgb,
          var(--accent)
          65%,
          transparent
      );
}


/* ==================================================
   MODE
================================================== */

.discussion-mode {
  display:
      flex;

  justify-content:
      center;

  min-width:
      0;
}


.mode-label {
  font-size:
      clamp(
          0.4rem,
          0.48vw,
          0.57rem
      );

  font-weight:
      600;

  letter-spacing:
      0.1em;

  color:
      rgba(
          203,
          195,
          225,
          0.42
      );
}


/* ==================================================
   STATUS HOLDER
================================================== */

.status-holder {
  display:
      flex;

  align-items:
      center;

  justify-content:
      flex-end;

  padding-right:
      clamp(
          0.7rem,
          1vw,
          1.1rem
      );
}


/* ==================================================
   STATUS TAG
================================================== */

.status-tag {
  --status-color:
      #a67cff;

  display:
      inline-flex;

  align-items:
      center;

  gap:
      0.4rem;

  padding:
      clamp(
          0.25rem,
          0.35vh,
          0.35rem
      )
      clamp(
          0.45rem,
          0.65vw,
          0.7rem
      );

  border:
      1px solid
      color-mix(
          in srgb,
          var(--status-color)
          32%,
          transparent
      );

  border-radius:
      3px;

  background:
      color-mix(
          in srgb,
          var(--status-color)
          5%,
          transparent
      );

  font-size:
      clamp(
          0.42rem,
          0.5vw,
          0.62rem
      );

  font-weight:
      700;

  letter-spacing:
      0.1em;

  color:
      var(--status-color);

  white-space:
      nowrap;
}


.status-dot {
  width:
      0.32rem;

  height:
      0.32rem;

  border-radius:
      50%;

  background:
      var(--status-color);

  box-shadow:
      0 0 6px
      color-mix(
          in srgb,
          var(--status-color)
          72%,
          transparent
      );
}


/* ==================================================
   STATUS COLORS
================================================== */

.status-active {
  --status-color:
      #55e6b1;
}


.status-ready {
  --status-color:
      #55c9ff;
}


.status-paused {
  --status-color:
      #ffb84b;
}


.status-completed {
  --status-color:
      #9f72ff;
}


.status-abandoned {
  --status-color:
      #ff5b72;
}


/* ==================================================
   EMPTY
================================================== */

.discussions-empty {
  grid-row:
      1 /
      -1;

  display:
      flex;

  flex-direction:
      column;

  align-items:
      center;

  justify-content:
      center;

  gap:
      0.6rem;

  font-size:
      clamp(
          0.5rem,
          0.6vw,
          0.7rem
      );

  font-weight:
      600;

  letter-spacing:
      0.1em;

  text-transform:
      uppercase;

  color:
      rgb(204 195 229 / 0.35);
}


.empty-icon {
  width:
      1.5rem;

  color:
      rgb(158 104 255 / 0.4);
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (
max-width:
    1050px
) {

  .discussion-row {
    grid-template-columns:
        3.7rem
        minmax(
            0,
            1fr
        )
        4rem
        5.5rem;
  }


  .discussion-meta {
    gap:
        0.2rem;
  }
}
</style>
