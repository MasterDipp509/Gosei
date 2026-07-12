<script setup>
import {
  Monitor,
  Swords,
  Users,
  Layers3,
  SlidersHorizontal,
  CircuitBoard
} from 'lucide-vue-next'


/* ==================================================
   PROPS
================================================== */

defineProps({

  preferences: {
    type:
    Array,

    default:
        () => []
  }

})


/* ==================================================
   ICONS
================================================== */

const preferenceIcons = {

  presentation:
  Monitor,

  style:
  Swords,

  mode:
  Users,

  depth:
  Layers3

}


function getPreferenceIcon(
    preference
) {

  return (

      preferenceIcons[
          preference?.id
          ]

      ??

      CircuitBoard
  )
}
</script>


<template>
  <section class="preferences-panel">

    <!-- ==================================================
         HEADER
    =================================================== -->

    <header class="preferences-header">

      <div class="header-left">

        <CircuitBoard
            class="header-icon"
            :stroke-width="1.7"
        />

        <span class="header-title">
          YOUR PREFERENCES
        </span>

      </div>


      <SlidersHorizontal
          class="settings-icon"
          :stroke-width="1.6"
      />

    </header>


    <!-- ==================================================
         ROWS
    =================================================== -->

    <div class="preferences-list">

      <div
          v-for="preference in preferences"
          :key="preference.id"
          class="preference-row"
      >

        <!-- ICON -->

        <div class="preference-icon-wrap">

          <component
              :is="
                getPreferenceIcon(
                  preference
                )
              "
              class="preference-icon"
              :stroke-width="1.45"
          />

        </div>


        <!-- LABEL -->

        <div class="preference-label">
          {{ preference.label }}
        </div>


        <!-- VALUE -->

        <div
            class="preference-value"
            :class="{
              unavailable:
                preference.available === false
            }"
        >
          {{ preference.value }}
        </div>

      </div>

    </div>

  </section>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.preferences-panel {
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
          rgb(8 10 27 / 0.91),
          rgb(10 11 29 / 0.84)
      );

  box-shadow:
      inset 0 0 30px
      rgb(90 44 190 / 0.06);

  color:
      #eeeaff;

  box-sizing:
      border-box;
}


/* ==================================================
   TOP EDGE GLOW
================================================== */

.preferences-panel::before {
  content:
      "";

  position:
      absolute;

  top:
      -1px;

  left:
      4%;

  right:
      4%;

  height:
      1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgb(156 94 255 / 0.8),
          transparent
      );

  box-shadow:
      0 0 10px
      rgb(139 78 255 / 0.45);

  pointer-events:
      none;
}


/* ==================================================
   CORNER DETAILS
================================================== */

.preferences-panel::after {
  content:
      "";

  position:
      absolute;

  inset:
      7px;

  border:
      1px solid
      rgb(164 108 255 / 0.05);

  border-radius:
      6px;

  pointer-events:
      none;
}


/* ==================================================
   HEADER
================================================== */

.preferences-header {
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
          1.2vw,
          1.35rem
      );

  display:
      flex;

  align-items:
      center;

  justify-content:
      space-between;

  border-bottom:
      1px solid
      rgb(150 94 255 / 0.12);

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
          0.45rem,
          0.65vw,
          0.7rem
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
      #9a64ff;

  filter:
      drop-shadow(
          0 0 4px
          rgb(136 73 255 / 0.4)
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


.settings-icon {
  width:
      clamp(
          0.8rem,
          0.9vw,
          1rem
      );

  height:
      auto;

  color:
      #9d6eff;

  opacity:
      0.82;
}


/* ==================================================
   LIST
================================================== */

.preferences-list {
  position:
      relative;

  z-index:
      2;

  min-height:
      0;

  margin:
      clamp(
          0.45rem,
          0.75vh,
          0.7rem
      )
      clamp(
          0.55rem,
          0.75vw,
          0.8rem
      )
      clamp(
          0.55rem,
          0.8vh,
          0.8rem
      );

  display:
      grid;

  grid-template-rows:
      repeat(
          4,
          minmax(
              0,
              1fr
          )
      );

  border:
      1px solid
      rgb(255 255 255 / 0.07);

  border-radius:
      7px;

  overflow:
      hidden;

  background:
      rgb(6 8 21 / 0.28);
}


/* ==================================================
   ROW
================================================== */

.preference-row {
  min-height:
      0;

  display:
      grid;

  grid-template-columns:
      clamp(
          2.5rem,
          3.7vw,
          4rem
      )
      minmax(
          0,
          1fr
      )
      auto;

  align-items:
      center;

  padding:
      0
      clamp(
          0.8rem,
          1vw,
          1.15rem
      );

  border-bottom:
      1px solid
      rgb(255 255 255 / 0.055);

  box-sizing:
      border-box;

  transition:
      background
      0.2s
      ease;
}


.preference-row:last-child {
  border-bottom:
      none;
}


.preference-row:hover {
  background:
      linear-gradient(
          90deg,
          rgb(131 71 255 / 0.035),
          transparent
      );
}


/* ==================================================
   ICON
================================================== */

.preference-icon-wrap {
  display:
      flex;

  align-items:
      center;
}


.preference-icon {
  width:
      clamp(
          1rem,
          1.3vw,
          1.45rem
      );

  height:
      auto;

  color:
      #a06dff;

  opacity:
      0.92;

  filter:
      drop-shadow(
          0 0 4px
          rgb(139 81 255 / 0.25)
      );
}


/* ==================================================
   LABEL
================================================== */

.preference-label {
  overflow:
      hidden;

  text-overflow:
      ellipsis;

  white-space:
      nowrap;

  font-size:
      clamp(
          0.53rem,
          0.62vw,
          0.75rem
      );

  font-weight:
      600;

  letter-spacing:
      0.08em;

  text-transform:
      uppercase;

  color:
      rgba(
          218,
          210,
          239,
          0.72
      );
}


/* ==================================================
   VALUE
================================================== */

.preference-value {
  padding-left:
      1rem;

  font-size:
      clamp(
          0.58rem,
          0.68vw,
          0.82rem
      );

  font-weight:
      650;

  color:
      #49caff;

  text-shadow:
      0 0 10px
      rgb(60 190 255 / 0.22);

  white-space:
      nowrap;
}


.preference-value.unavailable {
  color:
      rgb(205 198 225 / 0.35);

  text-shadow:
      none;
}


/* ==================================================
   SMALLER SCREENS
================================================== */

@media (
max-width:
    1000px
) {

  .preference-row {
    grid-template-columns:
        2.2rem
        minmax(0, 1fr)
        auto;
  }


  .preference-label {
    letter-spacing:
        0.05em;
  }
}
</style>
