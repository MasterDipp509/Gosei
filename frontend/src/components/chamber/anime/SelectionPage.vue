<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'

import {
  useProfileStore
} from '@/stores/profileStore.js'


/* ==================================================
   STORE
================================================== */

const profileStore =
    useProfileStore()


/* ==================================================
   PROPS

   Kept compatible with ChamberFlow.

   The old entry / resume flow is no longer used.
================================================== */

defineProps({

  step: {
    type: String,
    default: 'composition'
  },


  activeSession: {
    type: Object,
    default: null
  }
})


/* ==================================================
   EMITS
================================================== */

const emit =
    defineEmits([
      'start-session'
    ])


/* ==================================================
   MODE
================================================== */

const selectedMode =
    ref('mediator')


/* ==================================================
   PROFILE
================================================== */

const mediator =
    computed(() =>
        profileStore.councilMediator
    )


const panelMembers =
    computed(() =>
        profileStore.councilMembers ??
        []
    )


/* ==================================================
   CHARACTER IMAGES
================================================== */

const characterImage =
    character => {

      if (!character?.id) {
        return ''
      }


      return (
          `/images/chamber/char/` +
          `${character.id}/` +
          `NeonOffice.png`
      )
    }


const mediatorImage =
    computed(() =>
        characterImage(
            mediator.value
        )
    )


/* ==================================================
   INTRO SEQUENCE

   1. Black screen
   2. Background image fades in
   3. Table rises/fades in
   4. Character(s) rise/fade in
   5. Mode cards plop in
   6. Proceed button fades in
================================================== */

const intro =
    ref({

      background:
          false,

      table:
          false,

      characters:
          false,

      modes:
          false,

      proceed:
          false
    })


const introTimers =
    []


const scheduleIntroStage = (
    key,
    delay
) => {

  const timer =
      window.setTimeout(
          () => {

            intro.value[key] =
                true
          },

          delay
      )


  introTimers.push(
      timer
  )
}


onMounted(() => {

  /*
    Keep the page black briefly before the
    chamber environment appears.
  */

  scheduleIntroStage(
      'background',
      180
  )


  scheduleIntroStage(
      'table',
      900
  )


  scheduleIntroStage(
      'characters',
      1500
  )


  scheduleIntroStage(
      'modes',
      2150
  )


  scheduleIntroStage(
      'proceed',
      2750
  )
})


onBeforeUnmount(() => {

  introTimers.forEach(
      timer =>
          window.clearTimeout(
              timer
          )
  )
})


/* ==================================================
   MODE SELECTION
================================================== */

const selectMode =
    mode => {

      selectedMode.value =
          mode
    }


/* ==================================================
   PROCEED
================================================== */

const proceed = () => {

  emit(
      'start-session',
      selectedMode.value
  )
}
</script>


<template>
  <section class="chamber-select">

    <!-- =============================================
         BACKGROUND
    ============================================== -->

    <div
        class="chamber-bg"
        :class="{
          'intro-visible':
            intro.background
        }"
    />


    <div
        class="chamber-vignette"
        :class="{
          'intro-visible':
            intro.background
        }"
    />


    <!-- =============================================
         MAIN COMPOSITION SCREEN
    ============================================== -->

    <div
        class="
          selection-screen
          composition-screen
        "
    >

      <div class="composition-stage">


        <!-- =========================================
             SCENE
        ========================================== -->

        <div class="scene-layer">

          <Transition
              name="scene-change"
              mode="out-in"
          >

            <!-- =====================================
                 MEDIATOR
            ====================================== -->

            <div
                v-if="
                  selectedMode ===
                  'mediator'
                "
                key="mediator"
                class="
                  scene
                  mediator-scene
                "
            >

              <div
                  class="
                    scene-assembly
                    solo-assembly
                  "
              >

                <!-- CHARACTER -->

                <div
                    class="
                      solo-character-layer
                    "
                >

                  <img
                      v-if="mediatorImage"
                      class="
                        mediator-character
                      "
                      :class="{
                        'intro-visible':
                          intro.characters
                      }"
                      :src="mediatorImage"
                      :alt="
                        mediator?.name ??
                        'Mediator'
                      "
                  >

                </div>


                <!-- TABLE -->

                <img
                    class="
                      scene-table
                      solo-table
                    "
                    :class="{
                      'intro-visible':
                        intro.table
                    }"
                    src="
                      /images/chamber/soloTable.png
                    "
                    alt=""
                >

              </div>

            </div>


            <!-- =====================================
                 PANEL
            ====================================== -->

            <div
                v-else
                key="panel"
                class="
                  scene
                  panel-scene
                "
            >

              <div
                  class="
                    scene-assembly
                    panel-assembly
                  "
              >

                <!-- CHARACTERS -->

                <div
                    class="
                      panel-character-layer
                    "
                >

                  <div class="panel-members">

                    <div
                        v-for="
                          member in
                          panelMembers
                        "
                        :key="member.id"
                        class="panel-member"
                    >

                      <img
                          :class="{
                            'intro-visible':
                              intro.characters
                          }"
                          :src="
                            characterImage(
                              member
                            )
                          "
                          :alt="member.name"
                      >

                    </div>

                  </div>

                </div>


                <!-- TABLE -->

                <img
                    class="
                      scene-table
                      group-table
                    "
                    :class="{
                      'intro-visible':
                        intro.table
                    }"
                    src="
                      /images/chamber/groupTable.png
                    "
                    alt=""
                >

              </div>

            </div>

          </Transition>

        </div>


        <!-- =========================================
             INTERFACE
        ========================================== -->

        <div class="mode-interface">


          <!-- =======================================
               TOP MODE BUTTONS
          ======================================== -->

          <div
              class="mode-options"
              :class="{
                'intro-visible':
                  intro.modes
              }"
          >


            <!-- PANEL -->

            <button
                class="mode-card"
                :class="{
                  active:
                    selectedMode ===
                    'panel'
                }"
                @click="
                  selectMode('panel')
                "
            >

              <span
                  class="
                    corner
                    corner-tl
                  "
              />

              <span
                  class="
                    corner
                    corner-tr
                  "
              />

              <span
                  class="
                    corner
                    corner-bl
                  "
              />

              <span
                  class="
                    corner
                    corner-br
                  "
              />


              <div
                  class="
                    mode-icon
                    panel-icon
                  "
              >

                <svg
                    viewBox="0 0 128 128"
                    xmlns="
                      http://www.w3.org/2000/svg
                    "
                >

                  <circle
                      cx="64"
                      cy="38"
                      r="15"
                  />

                  <circle
                      cx="30"
                      cy="48"
                      r="12"
                  />

                  <circle
                      cx="98"
                      cy="48"
                      r="12"
                  />

                  <path
                      d="
                        M38 98
                        V84

                        C38 66
                        49 57
                        64 57

                        C79 57
                        90 66
                        90 84

                        V98
                      "
                  />

                  <path
                      d="
                        M8 95
                        V80

                        C8 67
                        17 60
                        30 60

                        C39 60
                        46 64
                        50 70
                      "
                  />

                  <path
                      d="
                        M120 95
                        V80

                        C120 67
                        111 60
                        98 60

                        C89 60
                        82 64
                        78 70
                      "
                  />

                </svg>

              </div>


              <h2>
                Panel
              </h2>


              <p>
                Discuss as a council.<br>
                Multiple perspectives.<br>
                Collective insight.
              </p>

            </button>


            <!-- MEDIATOR -->

            <button
                class="mode-card"
                :class="{
                  active:
                    selectedMode ===
                    'mediator'
                }"
                @click="
                  selectMode('mediator')
                "
            >

              <span
                  class="
                    corner
                    corner-tl
                  "
              />

              <span
                  class="
                    corner
                    corner-tr
                  "
              />

              <span
                  class="
                    corner
                    corner-bl
                  "
              />

              <span
                  class="
                    corner
                    corner-br
                  "
              />


              <div
                  class="
                    mode-icon
                    mediator-icon
                  "
              >

                <svg
                    viewBox="0 0 128 128"
                    xmlns="
                      http://www.w3.org/2000/svg
                    "
                >

                  <circle
                      cx="64"
                      cy="48"
                      r="21"
                  />

                  <path
                      d="
                        M36 102
                        V87

                        C36 69
                        47 59
                        64 59

                        C81 59
                        92 69
                        92 87

                        V102
                        Z
                      "
                  />

                  <path
                      d="
                        M64 8
                        V21

                        M64 75
                        V102

                        M57 76
                        L64 88
                        L71 76
                      "
                  />

                  <path
                      d="
                        M24 48
                        H10

                        M118 48
                        H104

                        M35 19
                        L25 9

                        M93 19
                        L103 9
                      "
                  />

                </svg>

              </div>


              <h2>
                Mediator
              </h2>


              <p>
                Seek guidance from<br>
                a single advisor.<br>
                Focused wisdom.
              </p>

            </button>

          </div>


          <!-- =======================================
               BOTTOM BUTTON
          ======================================== -->

          <button
              class="proceed-button"
              :class="{
                'intro-visible':
                  intro.proceed
              }"
              @click="proceed"
          >

            <strong>
              Proceed
            </strong>


            <small>
              Choose your discussion mode to begin.
            </small>

          </button>

        </div>

      </div>

    </div>

  </section>
</template>


<style scoped>
.chamber-select {
  --blue: #38c8ff;
  --blue-bright: #a6efff;

  --purple: #9b4fff;
  --purple-bright: #d9afff;

  --text: #eef8ff;
  --soft: #a9bdd1;

  position: relative;

  width: 100%;
  height: 100%;
  min-height: 100dvh;

  min-width: 0;

  overflow: hidden;

  color: var(--text);

  /*
    IMPORTANT:

    The page begins completely black.
  */

  background: #000;
}


button {
  font: inherit;
}


/* ==================================================
   BACKGROUND
================================================== */

.chamber-bg {
  position: absolute;

  inset: 0 -3% 0 -3%;

  width: 106%;
  height: 100%;

  background-image:
      url('/images/chamber/bg.png');

  background-position:
      center top;

  background-repeat:
      no-repeat;

  background-size:
      cover;

  opacity: 0;

  transform:
      scaleX(1.025)
      scale(1.015);

  transform-origin:
      top center;

  filter:
      brightness(0.55)
      blur(0.15rem);

  transition:
      opacity 1050ms ease,
      transform 1500ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      filter 1200ms ease;

  pointer-events: none;
}


.chamber-bg.intro-visible {
  opacity: 1;

  transform:
      scaleX(1.025)
      scale(1);

  filter:
      brightness(1)
      blur(0);
}


/* ==================================================
   VIGNETTE
================================================== */

.chamber-vignette {
  position: absolute;

  inset: 0;

  z-index: 1;

  opacity: 0;

  pointer-events: none;

  background:
      radial-gradient(
          circle at center 42%,
          transparent 20%,
          rgba(0, 0, 8, 0.1) 58%,
          rgba(0, 0, 6, 0.65) 100%
      ),
      linear-gradient(
          to bottom,
          rgba(0, 0, 8, 0.02),
          rgba(0, 0, 8, 0.08) 55%,
          rgba(0, 0, 8, 0.5)
      );

  transition:
      opacity 1200ms ease;
}


.chamber-vignette.intro-visible {
  opacity: 1;
}


/* ==================================================
   SCREEN
================================================== */

.selection-screen {
  position: relative;

  z-index: 2;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;
}


/* ==================================================
   COMPOSITION
================================================== */

.composition-screen {
  position: relative;
}


.composition-stage {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  isolation: isolate;
}


/* ==================================================
   SCENE
================================================== */

.scene-layer {
  position: absolute;

  inset: 0;

  z-index: 2;

  pointer-events: none;
}


.scene {
  position: absolute;

  inset: 0;

  overflow: hidden;
}


/* ==================================================
   SHARED SCENE POSITIONING
================================================== */

.scene-assembly {
  --assembly-drop: 0rem;

  position: absolute;

  left: 50%;

  bottom:
      clamp(
          0rem,
          2vh,
          1.5rem
      );

  width:
      min(
          100%,
          calc(92dvh * 1.7778),
          106rem
      );

  aspect-ratio: 16 / 9;

  transform:
      translateX(-50%)
      translateY(
          var(--assembly-drop)
      );

  transform-origin:
      bottom center;
}


/* ==================================================
   TABLE INTRO
================================================== */

.scene-table {
  position: absolute;

  left: 50%;
  bottom: 0;

  z-index: 2;

  display: block;

  height: auto;

  max-width: none;
  max-height: none;

  opacity: 0;

  transform:
      translateX(-50%)
      translateY(2.5rem)
      scale(0.97);

  object-fit: contain;

  filter:
      drop-shadow(
          0 1.4rem 2.2rem
          rgba(0, 0, 0, 0.88)
      )
      blur(0.15rem);

  transition:
      opacity 750ms ease,
      transform 950ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      filter 800ms ease;
}


.scene-table.intro-visible {
  opacity: 1;

  transform:
      translateX(-50%)
      translateY(0)
      scale(1);

  filter:
      drop-shadow(
          0 1.4rem 2.2rem
          rgba(0, 0, 0, 0.88)
      )
      blur(0);
}


/* ==================================================
   PANEL SCENE
================================================== */

.panel-assembly {
  --assembly-drop:
      clamp(
          2.6rem,
          5.5vh,
          5.2rem
      );
}


.panel-character-layer {
  position: absolute;

  inset: 0;

  z-index: 1;

  pointer-events: none;
}


.panel-members {
  position: absolute;

  left: 50%;
  bottom: 17%;

  width: 80%;
  height: 86%;

  display: grid;

  grid-template-columns:
    repeat(
      5,
      minmax(0, 1fr)
    );

  align-items: end;

  gap:
      clamp(
          0.2rem,
          0.8vw,
          1rem
      );

  transform:
      translateX(-50%);
}


.panel-member {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;

  display: flex;

  align-items: flex-end;
  justify-content: center;

  overflow: visible;
}


.panel-member img {
  display: block;

  width: auto;
  height: 100%;

  max-width: 150%;

  opacity: 0;

  object-fit: contain;
  object-position: bottom center;

  transform:
      translateY(2.2rem)
      scale(0.975);

  filter:
      drop-shadow(
          0 0.9rem 1.4rem
          rgba(0, 0, 0, 0.86)
      )
      blur(0.12rem);

  transition:
      opacity 650ms ease,
      transform 950ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      filter 700ms ease;
}


.panel-member img.intro-visible {
  opacity: 1;

  transform:
      translateY(0)
      scale(1);

  filter:
      drop-shadow(
          0 0.9rem 1.4rem
          rgba(0, 0, 0, 0.86)
      )
      blur(0);
}


/*
  Slight character cascade when in panel mode.
*/

.panel-member:nth-child(2) img {
  transition-delay: 60ms;
}


.panel-member:nth-child(3) img {
  transition-delay: 120ms;
}


.panel-member:nth-child(4) img {
  transition-delay: 180ms;
}


.panel-member:nth-child(5) img {
  transition-delay: 240ms;
}


.group-table {
  width: 100%;

  bottom: -10%;
}


/* ==================================================
   MEDIATOR SCENE
================================================== */

.solo-character-layer {
  position: absolute;

  inset: 0;

  z-index: 1;

  pointer-events: none;
}


.mediator-character {
  position: absolute;

  left: 50%;
  bottom: 10%;

  display: block;

  width: 25%;
  height: 100%;

  opacity: 0;

  object-fit: contain;
  object-position: bottom center;

  transform:
      translateX(-50%)
      translateY(2.2rem)
      scale(0.975);

  filter:
      drop-shadow(
          0 1rem 1.8rem
          rgba(0, 0, 0, 0.88)
      )
      blur(0.12rem);

  transition:
      opacity 700ms ease,
      transform 1050ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      filter 750ms ease;
}


.mediator-character.intro-visible {
  opacity: 1;

  transform:
      translateX(-50%)
      translateY(0)
      scale(1);

  filter:
      drop-shadow(
          0 1rem 1.8rem
          rgba(0, 0, 0, 0.88)
      )
      blur(0);
}


.solo-table {
  width: 70%;
}


/* ==================================================
   MODE INTERFACE
================================================== */

.mode-interface {
  position: absolute;

  inset: 0;

  z-index: 10;

  display: grid;

  grid-template-rows:
    minmax(0, 1fr)
    auto;

  padding:
      clamp(
          1rem,
          2vh,
          1.5rem
      )
      clamp(
          1rem,
          2vw,
          2rem
      );

  box-sizing: border-box;

  pointer-events: none;
}


/* ==================================================
   MODE OPTIONS
================================================== */

.mode-options {
  grid-row: 1;

  align-self: center;
  justify-self: center;

  transform:
      translateY(-22vh);

  width:
      min(
          42rem,
          54vw
      );

  display: grid;

  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );

  gap:
      clamp(
          0.7rem,
          1.2vw,
          1.25rem
      );

  pointer-events: auto;
}


/* ==================================================
   MODE CARDS
================================================== */

.mode-card {
  position: relative;

  min-width: 0;

  aspect-ratio: 1.12;

  padding:
      clamp(
          1rem,
          1.7vw,
          1.5rem
      );

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  color: var(--text);

  background:
      linear-gradient(
          145deg,
          rgba(15, 7, 42, 0.76),
          rgba(3, 4, 22, 0.94)
      );

  border:
      1px solid
      rgba(157, 89, 255, 0.58);

  clip-path:
      polygon(
          7% 0,
          93% 0,
          100% 7%,
          100% 93%,
          93% 100%,
          7% 100%,
          0 93%,
          0 7%
      );

  cursor: pointer;

  backdrop-filter:
      blur(0.5rem);

  box-shadow:
      inset 0 0 1.5rem
      rgba(157, 89, 255, 0.09),

      0 0 1.3rem
      rgba(157, 89, 255, 0.12);

  transition:
      transform 240ms ease,
      filter 240ms ease,
      border-color 240ms ease,
      box-shadow 240ms ease,
      background 240ms ease;
}


.mode-card:hover {
  transform:
      translateY(-0.35rem);

  filter:
      brightness(1.14);
}


.mode-card.active {
  border-color:
      rgba(76, 207, 255, 0.96);

  background:
      linear-gradient(
          145deg,
          rgba(4, 34, 75, 0.86),
          rgba(3, 8, 29, 0.96)
      );

  box-shadow:
      inset 0 0 2.2rem
      rgba(45, 190, 255, 0.2),

      0 0 1.5rem
      rgba(35, 188, 255, 0.55),

      0 0 3rem
      rgba(35, 188, 255, 0.22);
}


/* ==================================================
   MODE CARD INTRO

   Both cards begin invisible and compressed.

   Once the intro reaches the mode stage they
   "plop" into place.
================================================== */

.mode-options:not(.intro-visible)
.mode-card {
  opacity: 0;

  transform:
      translateY(-1.8rem)
      scale(0.68);

  filter:
      blur(0.3rem)
      brightness(1.6);

  pointer-events: none;
}


.mode-options.intro-visible
.mode-card {
  opacity: 1;

  transform:
      translateY(0)
      scale(1);

  filter:
      blur(0)
      brightness(1);

  transition:
      opacity 180ms ease,
      transform 680ms
      cubic-bezier(
          0.16,
          1.45,
          0.3,
          1
      ),
      filter 500ms ease,
      border-color 240ms ease,
      box-shadow 240ms ease,
      background 240ms ease;
}


.mode-options.intro-visible
.mode-card:nth-child(2) {
  transition-delay:
      100ms;
}


.mode-options.intro-visible
.mode-card:hover {
  transform:
      translateY(-0.35rem)
      scale(1.015);

  filter:
      brightness(1.14);
}


/* ==================================================
   CORNERS
================================================== */

.corner {
  position: absolute;

  width: 16%;
  height: 16%;

  pointer-events: none;
}


.corner::before,
.corner::after {
  content: '';

  position: absolute;

  background:
      currentColor;

  box-shadow:
      0 0 0.5rem
      currentColor;
}


.corner::before {
  width: 100%;
  height: 1px;
}


.corner::after {
  width: 1px;
  height: 100%;
}


.corner-tl {
  top: 5%;
  left: 5%;

  color: var(--purple);
}


.corner-tr {
  top: 5%;
  right: 5%;

  color: var(--purple);

  transform:
      rotate(90deg);
}


.corner-bl {
  bottom: 5%;
  left: 5%;

  color: var(--purple);

  transform:
      rotate(-90deg);
}


.corner-br {
  right: 5%;
  bottom: 5%;

  color: var(--purple);

  transform:
      rotate(180deg);
}


.mode-card.active
.corner {
  color: var(--blue);
}


/* ==================================================
   MODE ICON
================================================== */

.mode-icon {
  width:
      clamp(
          3.5rem,
          7vw,
          6.5rem
      );

  aspect-ratio: 1;

  margin-bottom:
      0.65rem;

  transition:
      transform 220ms ease,
      filter 220ms ease;
}


.mode-icon svg {
  width: 100%;
  height: 100%;

  fill:
      rgba(80, 200, 255, 0.03);

  stroke:
      currentColor;

  stroke-width: 4;

  stroke-linecap:
      round;

  stroke-linejoin:
      round;
}


.panel-icon {
  color:
      var(--purple-bright);

  filter:
      drop-shadow(
          0 0 0.55rem
          rgba(160, 87, 255, 0.8)
      );
}


.mediator-icon {
  color:
      var(--blue-bright);

  filter:
      drop-shadow(
          0 0 0.55rem
          rgba(75, 200, 255, 0.8)
      );
}


.mode-card h2 {
  margin: 0;

  font-size:
      clamp(
          1rem,
          1.6vw,
          1.6rem
      );

  font-weight: 700;

  text-shadow:
      0 0 0.7rem
      currentColor;
}


.mode-card p {
  margin:
      0.55rem
      0
      0;

  color:
      rgba(215, 231, 247, 0.82);

  font-size:
      clamp(
          0.58rem,
          0.74vw,
          0.78rem
      );

  line-height: 1.45;

  text-align: center;
}


/* ==================================================
   PROCEED
================================================== */

.proceed-button {
  grid-row: 2;

  justify-self: center;

  width:
      min(
          27rem,
          64vw
      );

  margin-top:
      clamp(
          0.6rem,
          1.2vh,
          1rem
      );

  padding:
      0.75rem
      1rem;

  display: flex;

  flex-direction: column;

  align-items: center;

  color:
      var(--blue-bright);

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(5, 35, 84, 0.78) 18%,
          rgba(4, 21, 58, 0.92) 50%,
          rgba(5, 35, 84, 0.78) 82%,
          transparent
      );

  border:
      1px solid
      rgba(75, 200, 255, 0.58);

  clip-path:
      polygon(
          8% 0,
          92% 0,
          100% 50%,
          92% 100%,
          8% 100%,
          0 50%
      );

  cursor: pointer;

  pointer-events: auto;

  box-shadow:
      inset 0 0 1.5rem
      rgba(75, 200, 255, 0.15),

      0 0 1rem
      rgba(75, 200, 255, 0.18);

  /*
    Hidden until final intro stage.
  */

  opacity: 0;

  transform:
      translateY(0.8rem);

  filter:
      blur(0.15rem);

  visibility: hidden;

  transition:
      opacity 800ms ease,
      transform 900ms
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      filter 800ms ease,
      box-shadow 200ms ease;
}


.proceed-button.intro-visible {
  opacity: 1;

  transform:
      translateY(0);

  filter:
      blur(0);

  visibility: visible;
}


.proceed-button.intro-visible:hover {
  transform:
      translateY(-0.2rem);

  filter:
      brightness(1.2);

  box-shadow:
      inset 0 0 2rem
      rgba(75, 200, 255, 0.22),

      0 0 1.5rem
      rgba(75, 200, 255, 0.38);
}


.proceed-button strong {
  font-size:
      clamp(
          1rem,
          1.5vw,
          1.55rem
      );

  text-shadow:
      0 0 0.8rem
      rgba(75, 200, 255, 0.9);
}


.proceed-button small {
  margin-top:
      0.15rem;

  color:
      rgba(174, 216, 240, 0.8);

  font-size:
      clamp(
          0.5rem,
          0.62vw,
          0.68rem
      );
}


/* ==================================================
   SCENE SWITCHING

   Used only after the intro when switching between
   Panel and Mediator.
================================================== */

.scene-change-enter-active,
.scene-change-leave-active {
  transition:
      opacity 280ms ease,
      filter 280ms ease;
}


.scene-change-enter-from,
.scene-change-leave-to {
  opacity: 0;

  filter:
      blur(0.25rem);
}


/* ==================================================
   LARGE TABLET / SMALL DESKTOP
================================================== */

@media (max-width: 1100px) {

  .scene-assembly {
    width:
        min(
            108%,
            calc(90dvh * 1.7778)
        );
  }


  .panel-assembly {
    --assembly-drop:
        clamp(
            2rem,
            4.8vh,
            4rem
        );
  }


  .panel-members {
    width: 72%;
    height: 83%;
  }


  .group-table {
    width: 100%;
  }


  .mediator-character {
    width: 25%;
    height: 82%;
  }


  .solo-table {
    width: 84%;
  }


  .mode-options {
    width:
        min(
            42rem,
            68vw
        );
  }
}


/* ==================================================
   NARROW / MOBILE
================================================== */

@media (max-width: 760px) {

  .scene-assembly {
    bottom:
        clamp(
            4.4rem,
            10vh,
            7rem
        );

    width:
        min(
            142%,
            calc(76dvh * 1.7778)
        );
  }


  .panel-assembly {
    --assembly-drop:
        clamp(
            1.2rem,
            3vh,
            2.4rem
        );
  }


  .panel-members {
    width: 68%;
    height: 80%;

    gap: 0;
  }


  .group-table {
    width: 100%;
  }


  .mediator-character {
    width: 23%;
    height: 78%;
  }


  .solo-table {
    width: 88%;
  }


  .mode-interface {
    padding:
        0.8rem
        1rem
        max(
            0.7rem,
            env(
                safe-area-inset-bottom
            )
        );

    background:
        linear-gradient(
            to bottom,
            transparent 60%,
            rgba(1, 2, 10, 0.48) 78%,
            rgba(1, 2, 10, 0.94) 100%
        );
  }


  .mode-options {
    width: auto;

    display: flex;

    align-items: center;
    justify-content: center;

    gap:
        clamp(
            3rem,
            16vw,
            7rem
        );
  }


  .mode-card {
    width:
        clamp(
            4.5rem,
            16vw,
            5.5rem
        );

    aspect-ratio: auto;

    padding: 0;

    background:
        transparent;

    border: none;

    clip-path: none;

    box-shadow: none;

    backdrop-filter: none;
  }


  .mode-card.active {
    background:
        transparent;

    border: none;

    box-shadow: none;
  }


  .mode-options.intro-visible
  .mode-card:hover {
    transform:
        translateY(0)
        scale(1);
  }


  .mode-card:not(.active) {
    opacity: 0.48;
  }


  .mode-card.active
  .mode-icon {
    transform:
        translateY(-0.2rem)
        scale(1.12);

    filter:
        drop-shadow(
            0 0 0.9rem
            rgba(75, 200, 255, 0.95)
        );
  }


  .corner {
    display: none;
  }


  .mode-icon {
    width:
        clamp(
            3rem,
            11vw,
            4.2rem
        );

    margin:
        0 auto;
  }


  .mode-card h2,
  .mode-card p {
    display: none;
  }


  .proceed-button {
    width:
        min(
            28rem,
            92vw
        );

    padding:
        0.75rem
        1rem;
  }


  .proceed-button strong {
    font-size: 1rem;
  }


  .proceed-button small {
    display: none;
  }
}


/* ==================================================
   SHORT LANDSCAPE SCREENS
================================================== */

@media
(max-height: 720px)
and
(min-width: 761px) {

  .scene-assembly {
    bottom: -0.5rem;

    width:
        min(
            100%,
            calc(106dvh * 1.7778),
            96rem
        );
  }


  .panel-assembly {
    --assembly-drop:
        clamp(
            2rem,
            6vh,
            3.8rem
        );
  }


  .panel-members {
    width: 68%;
    height: 80%;
  }


  .group-table {
    width: 94%;
  }


  .mediator-character {
    width: 21%;
    height: 76%;
  }


  .solo-table {
    width: 76%;
  }


  .mode-interface {
    padding:
        0.5rem
        1rem;
  }


  .mode-options {
    width:
        min(
            35rem,
            50vw
        );

    gap: 0.7rem;
  }


  .mode-card {
    aspect-ratio: 1.42;

    padding: 0.65rem;
  }


  .mode-icon {
    width: 3.4rem;

    margin-bottom:
        0.25rem;
  }


  .mode-card p {
    display: none;
  }


  .proceed-button {
    width:
        min(
            24rem,
            42vw
        );

    margin-top:
        0.4rem;

    padding:
        0.55rem
        1rem;
  }
}


/* ==================================================
   VERY SHORT LANDSCAPE
================================================== */

@media
(max-height: 560px)
and
(min-width: 761px) {

  .scene-assembly {
    width:
        min(
            94%,
            calc(115dvh * 1.7778)
        );
  }


  .panel-assembly {
    --assembly-drop:
        clamp(
            1.7rem,
            6vh,
            3rem
        );
  }


  .mode-options {
    width:
        min(
            30rem,
            46vw
        );
  }


  .mode-card {
    aspect-ratio: 1.7;
  }


  .mode-icon {
    width: 2.8rem;
  }


  .mode-card h2 {
    font-size: 0.95rem;
  }


  .proceed-button {
    padding:
        0.45rem
        1rem;
  }
}


/* ==================================================
   TALL PORTRAIT
================================================== */

@media
(max-width: 760px)
and
(min-height: 850px) {

  .scene-assembly {
    bottom:
        clamp(
            5rem,
            11vh,
            8rem
        );

    width:
        min(
            150%,
            calc(68dvh * 1.7778)
        );
  }


  .panel-assembly {
    --assembly-drop:
        clamp(
            1.5rem,
            3.2vh,
            2.8rem
        );
  }


  .mode-options {
    align-self:
        center;
  }
}


/* ==================================================
   ULTRAWIDE
================================================== */

@media
(min-aspect-ratio: 21 / 9)
and
(min-width: 1400px) {

  .scene-assembly {
    width:
        min(
            88vw,
            calc(94dvh * 1.7778),
            112rem
        );
  }


  .mode-options {
    width:
        min(
            42rem,
            38vw
        );
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media
(prefers-reduced-motion: reduce) {

  .chamber-bg,
  .chamber-vignette,
  .scene-table,
  .mediator-character,
  .panel-member img,
  .mode-card,
  .proceed-button {
    transition-duration:
        1ms !important;

    transition-delay:
        0ms !important;
  }
}
</style>