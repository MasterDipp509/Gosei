<script setup>
import {
  computed
} from 'vue'


/* ==================================================
   PROPS
================================================== */

const props =
    defineProps({

      members: {
        type:
        Array,

        default:
            () => []
      },


      mediator: {
        type:
        Object,

        default:
            null
      },


      selectedId: {
        type:
        String,

        default:
            null
      }

    })


/* ==================================================
   EMITS
================================================== */

const emit =
    defineEmits([
      'select'
    ])


/* ==================================================
   MEMBER COUNT

   This count only represents panel members.

   The mediator remains separate from the five-member
   panel.
================================================== */

const memberCount =
    computed(
        () =>

            String(
                props.members.length
            )
                .padStart(
                    2,
                    '0'
                )
    )


/* ==================================================
   ID NORMALIZATION
================================================== */

function characterIdOf(
    character
) {

  if (
      typeof character ===
      'string'

      ||

      typeof character ===
      'number'
  ) {

    return String(
        character
    )
  }


  if (
      !character
      ||
      typeof character !==
      'object'
      ||
      Array.isArray(
          character
      )
  ) {

    return null
  }


  const id =

      character.id

      ??

      character.characterId

      ??

      character.character_id

      ??

      character.memberId

      ??

      character.member_id

      ??

      character.character?.id

      ??

      character.member?.id

      ??

      null


  if (
      id === null
      ||
      id === undefined
      ||
      id === ''
  ) {

    return null
  }


  return String(
      id
  )
}


/* ==================================================
   SELECTED CHECK

   String normalization avoids mismatches between:

   - numeric IDs
   - string IDs
================================================== */

function isSelected(
    character
) {

  const characterId =
      characterIdOf(
          character
      )


  const selectedId =
      characterIdOf(
          props.selectedId
      )


  if (
      !characterId
      ||
      !selectedId
  ) {

    return false
  }


  return characterId ===
      selectedId
}


/* ==================================================
   CHARACTER IMAGE

   REQUIRED PATH:

   /images/char/know/{id}.png
================================================== */

function characterImage(
    character
) {

  const id =
      characterIdOf(
          character
      )


  if (
      !id
  ) {

    return ''
  }


  return (
      `/images/char/know/${id}.png`
  )
}


/* ==================================================
   CHARACTER NAME
================================================== */

function characterName(
    character
) {

  return (

      character?.name

      ??

      character?.displayName

      ??

      character?.display_name

      ??

      'Unknown Character'
  )
}


/* ==================================================
   CHARACTER ROLE
================================================== */

function characterRole(
    character,
    fallback =
    'Council Member'
) {

  return (

      character?.role

      ??

      character?.title

      ??

      character?.archetype

      ??

      fallback
  )
}


/* ==================================================
   MEMBER NUMBER
================================================== */

function memberNumber(
    index
) {

  return String(
      index +
      1
  )
      .padStart(
          2,
          '0'
      )
}


/* ==================================================
   ACCENT
================================================== */

function memberAccent(
    character
) {

  return (

      character?.accent

      ??

      character?.accentColor

      ??

      character?.accent_color

      ??

      '#9167ff'
  )
}


/* ==================================================
   SELECT

   Both panel members and the mediator use this same
   event.
================================================== */

function selectCharacter(
    character
) {

  const id =
      characterIdOf(
          character
      )


  if (
      !id
  ) {

    return
  }


  emit(
      'select',
      id
  )
}
</script>


<template>
  <div class="council-list">

    <!-- ==================================================
         COUNCIL MEMBERS
    =================================================== -->

    <section class="council-section">

      <!-- HEADER -->

      <div class="section-header">

        <span class="section-title">
          YOUR COUNCIL
        </span>


        <span class="section-count">
          {{ memberCount }} MEMBERS
        </span>

      </div>


      <!-- MEMBER LIST -->

      <div class="member-list">

        <button
            v-for="(
              member,
              index
            ) in members"

            :key="
              characterIdOf(
                member
              )
            "

            type="button"

            class="member-row"

            :class="{
              selected:
                isSelected(
                  member
                )
            }"

            :style="{
              '--member-accent':
                memberAccent(
                  member
                )
            }"

            :aria-pressed="
              isSelected(
                member
              )
            "

            @click="
              selectCharacter(
                member
              )
            "
        >

          <!-- ==========================================
               IMAGE
          =========================================== -->

          <div class="portrait-frame">

            <div class="portrait-accent"></div>

            <img
                class="portrait"

                :src="
                  characterImage(
                    member
                  )
                "

                :alt="
                  characterName(
                    member
                  )
                "
            />

          </div>


          <!-- ==========================================
               NUMBER
          =========================================== -->

          <div class="member-number">
            {{ memberNumber(index) }}
          </div>


          <!-- ==========================================
               INFO
          =========================================== -->

          <div class="member-info">

            <div class="member-name">
              {{ characterName(member) }}
            </div>

            <div class="member-role">
              {{
                characterRole(
                    member
                )
              }}
            </div>

          </div>


          <!-- ==========================================
               SELECTED LABEL
          =========================================== -->

          <div
              v-if="
                isSelected(
                  member
                )
              "
              class="selected-label"
          >
            SELECTED
          </div>


          <!-- ==========================================
               DIAMOND
          =========================================== -->

          <div class="member-symbol">

            <span class="symbol-inner"></span>

          </div>

        </button>


        <!-- EMPTY STATE -->

        <div
            v-if="
              !members.length
            "
            class="empty-state"
        >

          <span class="empty-title">
            NO PANEL MEMBERS
          </span>

          <span class="empty-detail">
            Configure your council to continue.
          </span>

        </div>

      </div>

    </section>


    <!-- ==================================================
         MEDIATOR

         The mediator is now a real button and emits the
         same select event as every panel member.
    =================================================== -->

    <section
        v-if="mediator"
        class="mediator-section"
    >

      <div class="section-header mediator-header">

        <span class="section-title">
          MEDIATOR
        </span>


        <span
            v-if="
              isSelected(
                mediator
              )
            "
            class="section-count mediator-selected-count"
        >
          ACTIVE SELECTION
        </span>

      </div>


      <button
          type="button"

          class="
            member-row
            mediator-row
          "

          :class="{
            selected:
              isSelected(
                mediator
              )
          }"

          :style="{
            '--member-accent':
              memberAccent(
                mediator
              )
          }"

          :aria-pressed="
            isSelected(
              mediator
            )
          "

          @click="
            selectCharacter(
              mediator
            )
          "
      >

        <!-- IMAGE -->

        <div class="portrait-frame">

          <div class="portrait-accent"></div>

          <img
              class="portrait"

              :src="
                characterImage(
                  mediator
                )
              "

              :alt="
                characterName(
                  mediator
                )
              "
          />

        </div>


        <!-- MEDIATOR MARKER -->

        <div class="mediator-marker">
          M
        </div>


        <!-- INFO -->

        <div class="member-info mediator-info">

          <div class="member-name">
            {{ characterName(mediator) }}
          </div>

          <div class="member-role">
            {{
              characterRole(
                  mediator,
                  'Mediator'
              )
            }}
          </div>

        </div>


        <!-- SELECTED LABEL -->

        <div
            v-if="
              isSelected(
                mediator
              )
            "
            class="selected-label"
        >
          SELECTED
        </div>


        <!-- SYMBOL -->

        <div class="member-symbol">

          <span class="symbol-inner"></span>

        </div>

      </button>

    </section>

  </div>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.council-list {
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
      minmax(0, 1fr)
      auto;

  gap:
      0.35rem;

  color:
      #eee9ff;

  overflow:
      hidden;
}


/* ==================================================
   SECTION BASE
================================================== */

.council-section,
.mediator-section {
  min-width:
      0;

  min-height:
      0;

  border:
      1px solid
      rgb(166 111 255 / 0.14);

  background:
      linear-gradient(
          180deg,
          rgb(10 12 29 / 0.48),
          rgb(7 9 23 / 0.7)
      );

  box-shadow:
      inset 0 0 24px
      rgb(110 57 255 / 0.035);
}


/* ==================================================
   COUNCIL SECTION
================================================== */

.council-section {
  display:
      grid;

  grid-template-rows:
      auto
      minmax(0, 1fr);

  overflow:
      hidden;
}


/* ==================================================
   HEADERS
================================================== */

.section-header {
  height:
      clamp(
          1.65rem,
          2.3vh,
          2.4rem
      );

  padding:
      0
      clamp(
          0.7rem,
          1vw,
          1rem
      );

  display:
      flex;

  align-items:
      center;

  justify-content:
      space-between;

  border-bottom:
      1px solid
      rgb(166 111 255 / 0.12);

  box-sizing:
      border-box;
}


.section-title {
  font-size:
      clamp(
          0.52rem,
          0.62vw,
          0.76rem
      );

  font-weight:
      700;

  letter-spacing:
      0.13em;

  color:
      #a97aff;

  text-shadow:
      0 0 10px
      rgb(149 86 255 / 0.25);
}


.section-count {
  font-size:
      clamp(
          0.42rem,
          0.47vw,
          0.58rem
      );

  font-weight:
      600;

  letter-spacing:
      0.1em;

  color:
      rgba(
          214,
          205,
          235,
          0.54
      );
}


.mediator-selected-count {
  color:
      color-mix(
          in srgb,
          var(--member-accent, #9167ff)
          60%,
          #f2ecff
      );
}


/* ==================================================
   MEMBER LIST
================================================== */

.member-list {
  min-height:
      0;

  display:
      flex;

  flex-direction:
      column;

  gap:
      clamp(
          0.18rem,
          0.35vh,
          0.32rem
      );

  padding:
      clamp(
          0.35rem,
          0.55vh,
          0.6rem
      )
      clamp(
          0.5rem,
          0.7vw,
          0.75rem
      );

  overflow:
      hidden;

  box-sizing:
      border-box;
}


/* ==================================================
   MEMBER ROW
================================================== */

.member-row {
  position:
      relative;

  width:
      100%;

  flex:
      1 1 0;

  min-height:
      0;

  display:
      grid;

  grid-template-columns:
      clamp(
          4.3rem,
          5.4vw,
          6.5rem
      )
      clamp(
          1.8rem,
          2.5vw,
          3rem
      )
      minmax(
          0,
          1fr
      )
      auto
      clamp(
          2rem,
          2.5vw,
          3rem
      );

  align-items:
      center;

  padding:
      0;

  border:
      1px solid
      rgb(255 255 255 / 0.08);

  border-radius:
      7px;

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--member-accent)
              5%,
              transparent
          ),
          rgb(255 255 255 / 0.01)
          25%,
          rgb(255 255 255 / 0.008)
      );

  color:
      inherit;

  font:
      inherit;

  text-align:
      left;

  overflow:
      hidden;

  box-sizing:
      border-box;

  appearance:
      none;

  transition:
      border-color
      0.2s
      ease,
      background
      0.2s
      ease,
      box-shadow
      0.2s
      ease,
      transform
      0.2s
      ease;

  cursor:
      pointer;
}


.member-row:hover {
  border-color:
      color-mix(
          in srgb,
          var(--member-accent)
          48%,
          transparent
      );

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--member-accent)
              11%,
              transparent
          ),
          rgb(255 255 255 / 0.015)
      );
}


.member-row:focus-visible {
  outline:
      2px solid
      color-mix(
          in srgb,
          var(--member-accent)
          80%,
          white
      );

  outline-offset:
      -2px;
}


.member-row:active {
  transform:
      scale(0.995);
}


.member-row.selected {
  border-color:
      color-mix(
          in srgb,
          var(--member-accent)
          72%,
          transparent
      );

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--member-accent)
              11%,
              transparent
          ),
          rgb(255 255 255 / 0.01)
          45%,
          color-mix(
              in srgb,
              var(--member-accent)
              4%,
              transparent
          )
      );

  box-shadow:
      inset 3px 0 0
      var(--member-accent);
}


/* ==================================================
   PORTRAIT
================================================== */

.portrait-frame {
  position:
      relative;

  width:
      100%;

  height:
      calc(100% - 0.3rem);

  margin-left:
      0.25rem;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--member-accent)
          70%,
          transparent
      );

  border-radius:
      4px;

  overflow:
      hidden;

  background:
      #080a17;

  box-shadow:
      0 0 12px
      color-mix(
          in srgb,
          var(--member-accent)
          20%,
          transparent
      );

  box-sizing:
      border-box;
}


.portrait-accent {
  position:
      absolute;

  inset:
      0 auto 0 0;

  z-index:
      2;

  width:
      3px;

  background:
      var(--member-accent);

  box-shadow:
      0 0 8px
      var(--member-accent);
}


.portrait {
  width:
      100%;

  height:
      100%;

  display:
      block;

  object-fit:
      cover;

  object-position:
      center 24%;

  filter:
      saturate(0.9)
      contrast(1.05);
}


/* ==================================================
   NUMBER / MEDIATOR MARKER
================================================== */

.member-number,
.mediator-marker {
  justify-self:
      center;

  font-size:
      clamp(
          0.63rem,
          0.72vw,
          0.88rem
      );

  font-weight:
      700;

  letter-spacing:
      0.04em;

  color:
      var(--member-accent);

  text-shadow:
      0 0 10px
      color-mix(
          in srgb,
          var(--member-accent)
          35%,
          transparent
      );
}


.mediator-marker {
  width:
      clamp(
          1.35rem,
          1.65vw,
          1.8rem
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
          var(--member-accent)
          60%,
          transparent
      );

  border-radius:
      50%;

  font-size:
      clamp(
          0.46rem,
          0.54vw,
          0.65rem
      );

  background:
      color-mix(
          in srgb,
          var(--member-accent)
          8%,
          transparent
      );
}


/* ==================================================
   MEMBER INFO
================================================== */

.member-info {
  min-width:
      0;

  padding:
      0
      0.4rem;
}


.member-name {
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
          0.94rem
      );

  font-weight:
      650;

  letter-spacing:
      0.12em;

  line-height:
      1.15;

  color:
      color-mix(
          in srgb,
          var(--member-accent)
          42%,
          #f1edff
      );
}


.member-role {
  margin-top:
      clamp(
          0.15rem,
          0.25vh,
          0.3rem
      );

  overflow:
      hidden;

  text-overflow:
      ellipsis;

  white-space:
      nowrap;

  font-size:
      clamp(
          0.42rem,
          0.48vw,
          0.58rem
      );

  font-weight:
      600;

  letter-spacing:
      0.09em;

  text-transform:
      uppercase;

  color:
      rgba(
          203,
          194,
          228,
          0.58
      );
}


/* ==================================================
   SELECTED LABEL
================================================== */

.selected-label {
  margin-right:
      0.4rem;

  font-size:
      clamp(
          0.4rem,
          0.45vw,
          0.54rem
      );

  font-weight:
      700;

  letter-spacing:
      0.08em;

  color:
      rgba(
          236,
          229,
          248,
          0.72
      );
}


/* ==================================================
   SYMBOL
================================================== */

.member-symbol {
  width:
      clamp(
          0.75rem,
          0.9vw,
          1rem
      );

  aspect-ratio:
      1;

  justify-self:
      center;

  display:
      grid;

  place-items:
      center;

  border:
      1px solid
      var(--member-accent);

  transform:
      rotate(45deg);

  box-shadow:
      0 0 7px
      color-mix(
          in srgb,
          var(--member-accent)
          35%,
          transparent
      );
}


.symbol-inner {
  width:
      30%;

  height:
      30%;

  background:
      var(--member-accent);

  box-shadow:
      0 0 5px
      var(--member-accent);
}


/* ==================================================
   MEDIATOR
================================================== */

.mediator-section {
  display:
      grid;

  grid-template-rows:
      auto
      minmax(
          3.5rem,
          1fr
      );

  overflow:
      hidden;
}


.mediator-header {
  border-bottom:
      1px solid
      rgb(166 111 255 / 0.12);
}


.mediator-row {
  width:
      auto;

  height:
      auto;

  min-height:
      clamp(
          3.5rem,
          7vh,
          5.6rem
      );

  margin:
      clamp(
          0.4rem,
          0.6vh,
          0.65rem
      )
      clamp(
          0.5rem,
          0.7vw,
          0.75rem
      );

  grid-template-columns:
      clamp(
          4.3rem,
          5.4vw,
          6.5rem
      )
      clamp(
          1.8rem,
          2.5vw,
          3rem
      )
      minmax(
          0,
          1fr
      )
      auto
      clamp(
          2rem,
          2.5vw,
          3rem
      );
}


.mediator-row:hover {
  border-color:
      color-mix(
          in srgb,
          var(--member-accent)
          48%,
          transparent
      );

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--member-accent)
              11%,
              transparent
          ),
          rgb(255 255 255 / 0.015)
      );
}


.mediator-info {
  padding-left:
      0.4rem;
}


/* ==================================================
   EMPTY STATE
================================================== */

.empty-state {
  flex:
      1;

  min-height:
      0;

  display:
      flex;

  flex-direction:
      column;

  align-items:
      center;

  justify-content:
      center;

  gap:
      0.4rem;

  border:
      1px dashed
      rgb(167 123 255 / 0.18);

  border-radius:
      7px;

  background:
      rgb(7 9 24 / 0.3);

  text-align:
      center;
}


.empty-title {
  font-size:
      clamp(
          0.55rem,
          0.62vw,
          0.75rem
      );

  font-weight:
      700;

  letter-spacing:
      0.12em;

  color:
      #a97aff;
}


.empty-detail {
  font-size:
      clamp(
          0.45rem,
          0.5vw,
          0.6rem
      );

  color:
      rgb(214 205 235 / 0.48);
}


/* ==================================================
   SMALLER WIDTHS
================================================== */

@media (
max-width:
    1050px
) {

  .member-row,
  .mediator-row {
    grid-template-columns:
        4.2rem
        2rem
        minmax(0, 1fr)
        auto
        2rem;
  }


  .selected-label {
    display:
        none;
  }
}
</style>
