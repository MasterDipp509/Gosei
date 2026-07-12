<script setup>
import {
  computed
} from 'vue'


const props =
    defineProps({

      greeting: {
        type:
        String,

        default:
            ''
      },


      subtitle: {
        type:
        String,

        default:
            ''
      },


      time: {
        type:
        String,

        default:
            '--:--'
      },


      date: {
        type:
        String,

        default:
            ''
      },


      councilStatus: {
        type:
        Object,

        default:
            () => ({
              key:
                  'ready',

              label:
                  'READY',

              detail:
                  'All systems operational'
            })
      }

    })


/* ==================================================
   STATUS CLASS
================================================== */

const statusClass =
    computed(
        () =>

            `status-${

                props.councilStatus
                    ?.key

                ??

                'ready'
            }`
    )
</script>


<template>
  <div class="dashboard-header">

    <!-- ==================================================
         LEFT
    =================================================== -->

    <section class="header-main">

      <div class="breadcrumb">
        <span class="breadcrumb-mark">
          ✦
        </span>

        <span>
          HOME DASHBOARD
        </span>
      </div>


      <div class="welcome">

        <h1>
          {{ greeting }}
        </h1>

        <p>
          {{ subtitle }}
        </p>

      </div>

    </section>


    <!-- ==================================================
         RIGHT
    =================================================== -->

    <section class="header-system">

      <!-- DECORATIVE GLYPH -->

      <div
          class="system-glyph"
          aria-hidden="true"
      >
        <div class="glyph-ring glyph-ring-outer"></div>
        <div class="glyph-ring glyph-ring-inner"></div>

        <div class="glyph-cross glyph-cross-x"></div>
        <div class="glyph-cross glyph-cross-y"></div>

        <div class="glyph-core">
          ◇
        </div>
      </div>


      <!-- CLOCK -->

      <div class="clock-block">

        <div class="clock-time">
          {{ time }}
        </div>

        <div class="clock-date">
          {{ date }}
        </div>

      </div>


      <!-- STATUS -->

      <div
          class="status-block"
          :class="statusClass"
      >

        <div class="status-top">

          <span class="status-dot"></span>

          <span class="status-title">
            COUNCIL STATUS
          </span>

        </div>


        <div class="status-value">
          {{ councilStatus?.label }}
        </div>


        <div class="status-detail">
          {{ councilStatus?.detail }}
        </div>

      </div>

    </section>

  </div>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.dashboard-header {
  width:
      100%;

  height:
      100%;

  display:
      grid;

  grid-template-columns:
      minmax(0, 1fr)
      auto;

  align-items:
      stretch;

  overflow:
      hidden;

  color:
      rgba(
          236,
          231,
          255,
          0.96
      );
}


/* ==================================================
   LEFT SIDE
================================================== */

.header-main {
  min-width:
      0;

  display:
      flex;

  flex-direction:
      column;

  justify-content:
      space-between;

  padding:
      clamp(0.55rem, 1vw, 1rem)
      clamp(1rem, 2vw, 2rem);

  box-sizing:
      border-box;
}


/* ==================================================
   BREADCRUMB
================================================== */

.breadcrumb {
  display:
      flex;

  align-items:
      center;

  gap:
      0.45rem;

  font-size:
      clamp(
          0.55rem,
          0.58vw,
          0.75rem
      );

  font-weight:
      700;

  letter-spacing:
      0.14em;

  color:
      #aa7cff;

  text-shadow:
      0 0 10px
      rgb(132 71 255 / 0.45);
}


.breadcrumb-mark {
  font-size:
      0.8em;
}


/* ==================================================
   WELCOME TEXT
================================================== */

.welcome h1 {
  margin:
      0 0 0.25rem;

  font-size:
      clamp(
          1.2rem,
          1.75vw,
          2.15rem
      );

  font-weight:
      700;

  letter-spacing:
      0.025em;

  line-height:
      1.05;

  color:
      #e5dcff;

  text-shadow:
      0 0 20px
      rgb(137 89 255 / 0.18);
}


.welcome p {
  margin:
      0;

  margin-left: 2%;

  font-size:
      clamp(
          0.7rem,
          0.85vw,
          1.05rem
      );

  font-weight:
      400;

  color:
      rgba(
          222,
          217,
          240,
          0.78
      );
}


/* ==================================================
   RIGHT SYSTEM AREA
================================================== */

.header-system {
  height:
      100%;

  display:
      grid;

  grid-template-columns:
      clamp(7rem, 11vw, 13rem)
      clamp(10rem, 14vw, 17rem)
      clamp(11rem, 15vw, 18rem);

  align-items:
      center;

  border-left:
      1px solid
      rgb(144 86 255 / 0.14);
}


/* ==================================================
   GLYPH
================================================== */

.system-glyph {
  position:
      relative;

  width:
      clamp(
          4rem,
          5.2vw,
          6.5rem
      );

  aspect-ratio:
      1;

  justify-self:
      center;

  display:
      grid;

  place-items:
      center;

  opacity:
      0.72;
}


.glyph-ring {
  position:
      absolute;

  border-radius:
      50%;

  border:
      1px solid
      rgb(147 91 255 / 0.45);
}


.glyph-ring-outer {
  inset:
      0;
}


.glyph-ring-inner {
  inset:
      22%;
}


.glyph-cross {
  position:
      absolute;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgb(148 91 255 / 0.5),
          transparent
      );
}


.glyph-cross-x {
  width:
      120%;

  height:
      1px;
}


.glyph-cross-y {
  width:
      1px;

  height:
      120%;

  background:
      linear-gradient(
          180deg,
          transparent,
          rgb(148 91 255 / 0.5),
          transparent
      );
}


.glyph-core {
  width:
      34%;

  aspect-ratio:
      1;

  display:
      grid;

  place-items:
      center;

  border:
      1px solid
      rgb(164 105 255 / 0.7);

  transform:
      rotate(45deg);

  color:
      #9f6cff;

  font-size:
      clamp(
          0.7rem,
          1vw,
          1.2rem
      );

  box-shadow:
      0 0 16px
      rgb(127 70 255 / 0.24);
}


.glyph-core::first-letter {
  transform:
      rotate(-45deg);
}


/* ==================================================
   CLOCK
================================================== */

.clock-block {
  height:
      58%;

  display:
      flex;

  flex-direction:
      column;

  justify-content:
      center;

  padding:
      0
      clamp(1rem, 1.5vw, 1.75rem);

  border-left:
      1px solid
      rgb(255 255 255 / 0.08);

  border-right:
      1px solid
      rgb(255 255 255 / 0.08);

  box-sizing:
      border-box;
}


.clock-time {
  font-size:
      clamp(
          1.2rem,
          1.65vw,
          2rem
      );

  font-weight:
      700;

  letter-spacing:
      0.02em;

  line-height:
      1;

  color:
      #b786ff;

  text-shadow:
      0 0 18px
      rgb(153 83 255 / 0.35);
}


.clock-date {
  margin-top:
      0.42rem;

  font-size:
      clamp(
          0.42rem,
          0.48vw,
          0.64rem
      );

  font-weight:
      600;

  letter-spacing:
      0.1em;

  color:
      rgba(
          210,
          203,
          230,
          0.56
      );
}


/* ==================================================
   STATUS
================================================== */

.status-block {
  position:
      relative;

  margin:
      0
      clamp(0.75rem, 1.2vw, 1.4rem);

  padding:
      clamp(0.6rem, 0.8vw, 0.95rem)
      clamp(0.8rem, 1vw, 1.2rem);

  border:
      1px solid
      rgb(255 255 255 / 0.1);

  background:
      linear-gradient(
          135deg,
          rgb(255 255 255 / 0.025),
          transparent
      );

  clip-path:
      polygon(
          0 0,
          88% 0,
          100% 28%,
          100% 100%,
          0 100%
      );
}


/* ==================================================
   STATUS TOP
================================================== */

.status-top {
  display:
      flex;

  align-items:
      center;

  gap:
      0.5rem;
}


.status-dot {
  width:
      0.42rem;

  height:
      0.42rem;

  flex:
      0 0 auto;

  border-radius:
      50%;

  background:
      #67f2ca;

  box-shadow:
      0 0 10px
      #67f2ca;
}


.status-title {
  font-size:
      clamp(
          0.42rem,
          0.48vw,
          0.62rem
      );

  font-weight:
      700;

  letter-spacing:
      0.12em;

  color:
      rgba(
          210,
          203,
          230,
          0.58
      );
}


/* ==================================================
   STATUS CONTENT
================================================== */

.status-value {
  margin-top:
      0.12rem;

  padding-left:
      0.92rem;

  font-size:
      clamp(
          0.85rem,
          1vw,
          1.25rem
      );

  font-weight:
      700;

  letter-spacing:
      0.08em;

  color:
      #60c9ff;

  text-shadow:
      0 0 14px
      rgb(59 184 255 / 0.28);
}


.status-detail {
  margin-top:
      0.18rem;

  padding-left:
      0.92rem;

  font-size:
      clamp(
          0.4rem,
          0.45vw,
          0.58rem
      );

  color:
      rgba(
          205,
          199,
          225,
          0.48
      );
}


/* ==================================================
   STATUS VARIANTS
================================================== */

.status-syncing
.status-dot {
  background:
      #d59cff;

  box-shadow:
      0 0 10px
      #d59cff;
}


.status-syncing
.status-value {
  color:
      #d59cff;
}


.status-incomplete
.status-dot {
  background:
      #ffb454;

  box-shadow:
      0 0 10px
      #ffb454;
}


.status-incomplete
.status-value {
  color:
      #ffb454;
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (
max-width:
    1000px
) {

  .header-system {
    grid-template-columns:
        7rem
        10rem
        11rem;
  }


  .system-glyph {
    width:
        4rem;
  }
}
</style>
