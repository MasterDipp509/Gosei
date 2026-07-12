<script setup>
import {
  computed,
  ref,
  watch
} from 'vue'


/* ==================================================
   PROPS
================================================== */

const props =
    defineProps({

      member: {
        type:
        Object,

        default:
            null
      },


      memberNumber: {
        type:
        Number,

        default:
            0
      },


      memberCount: {
        type:
        Number,

        default:
            0
      }

    })


/* ==================================================
   CHARACTER ID
================================================== */

function characterIdOf(
    member
) {

  if (
      !member
  ) {

    return null
  }


  const id =

      member.id

      ??

      member.characterId

      ??

      member.character_id

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
   DISPLAYED COPY STATE

   IMAGE:

   follows props.member immediately.

   COPY:

   stays on the previous character until the new
   character image has completed its entrance.
================================================== */

const displayedCopyMember =
    ref(
        props.member
    )


const displayedCopyNumber =
    ref(
        props.memberNumber
    )


const hasDisplayedMember =
    ref(
        Boolean(
            props.member
        )
    )


/* ==================================================
   DISPLAYED IMAGE MEMBER
================================================== */

const displayedImageMember =
    computed(
        () =>

            props.member
    )


/* ==================================================
   MEMBER WATCHER

   Initial member:

   image + copy display normally.

   Character change:

   image transitions first.

   Copy is updated later inside
   onImageEnterComplete().
================================================== */

watch(
    () => props.member,

    (
        newMember,
        oldMember
    ) => {

      const newId =
          characterIdOf(
              newMember
          )


      const oldId =
          characterIdOf(
              oldMember
          )


      if (
          !newId
      ) {

        displayedCopyMember.value =
            null


        displayedCopyNumber.value =
            0


        return
      }


      /* ==============================================
         INITIAL HYDRATION
      ============================================== */

      if (
          !hasDisplayedMember.value
          ||
          !oldId
      ) {

        displayedCopyMember.value =
            newMember


        displayedCopyNumber.value =
            props.memberNumber


        hasDisplayedMember.value =
            true


        return
      }


      /* ==============================================
         SAME CHARACTER DATA REFRESH

         Update data directly without animation.
      ============================================== */

      if (
          newId ===
          oldId

          &&

          characterIdOf(
              displayedCopyMember.value
          ) ===
          newId
      ) {

        displayedCopyMember.value =
            newMember


        displayedCopyNumber.value =
            props.memberNumber
      }

    },

    {
      immediate:
          true
    }
)


/* ==================================================
   MEMBER NUMBER WATCHER
================================================== */

watch(
    () => props.memberNumber,

    newNumber => {

      const selectedId =
          characterIdOf(
              props.member
          )


      const copyId =
          characterIdOf(
              displayedCopyMember.value
          )


      if (
          selectedId
          &&
          selectedId ===
          copyId
      ) {

        displayedCopyNumber.value =
            newNumber
      }
    }
)


/* ==================================================
   IMAGE ENTER COMPLETE

   Sequence at this point:

   1. old image dissolved
   2. new image entered
   3. now trigger copy transition
================================================== */

function onImageEnterComplete() {

  const selectedMember =
      props.member


  const selectedId =
      characterIdOf(
          selectedMember
      )


  const copyId =
      characterIdOf(
          displayedCopyMember.value
      )


  if (
      !selectedId
  ) {

    return
  }


  if (
      selectedId ===
      copyId
  ) {

    return
  }


  displayedCopyMember.value =
      selectedMember


  displayedCopyNumber.value =
      props.memberNumber
}


/* ==================================================
   FORMATTED NUMBER

   Uses displayedCopyNumber so the label stays synced
   with the currently visible text.
================================================== */

const formattedNumber =
    computed(
        () =>

            String(
                displayedCopyNumber.value
            )
                .padStart(
                    2,
                    '0'
                )
    )


/* ==================================================
   CHARACTER IMAGE
================================================== */

function characterImage(
    member
) {

  const id =
      characterIdOf(
          member
      )


  if (
      !id
  ) {

    return ''
  }


  return (
      `/images/char/home/${id}.png`
  )
}


/* ==================================================
   ACCENT

   Follows copy state so panel styling changes with
   the text rather than halfway through image change.
================================================== */

const accent =
    computed(
        () =>

            displayedCopyMember.value
                ?.accent

            ??

            props.member
                ?.accent

            ??

            '#9b6cff'
    )


/* ==================================================
   ROLE POINT MAP
================================================== */

const rolePointMap = {

  Strategist: [
    'Clarifies strategic direction',
    'Tests long-term consequences',
    'Exposes weak assumptions'
  ],


  Visionary: [
    'Finds overlooked opportunities',
    'Explores alternative paths',
    'Pushes creative possibility'
  ],


  Skeptic: [
    'Challenges assumptions',
    'Identifies risk',
    'Prevents premature consensus'
  ],


  Humanist: [
    'Examines human impact',
    'Reads emotional incentives',
    'Protects trust and communication'
  ],


  Operator: [
    'Tests real-world execution',
    'Clarifies ownership',
    'Turns ideas into action'
  ],


  Analyst: [
    'Questions weak evidence',
    'Designs useful experiments',
    'Makes uncertainty measurable'
  ],


  Philosopher: [
    'Questions the premise',
    'Clarifies underlying values',
    'Reframes the real problem'
  ],


  'Audience Advocate': [
    'Tests audience understanding',
    'Examines adoption friction',
    'Challenges unclear messaging'
  ],


  'Systems Architect': [
    'Maps hidden dependencies',
    'Finds architectural fragility',
    'Reduces unnecessary complexity'
  ],


  Guardian: [
    'Protects ethical boundaries',
    'Questions risk transfer',
    'Tests long-term trust'
  ]

}


/* ==================================================
   ROLE POINTS FOR CHARACTER
================================================== */

function rolePointsFor(
    member
) {

  if (
      !member
  ) {

    return []
  }


  const mapped =
      rolePointMap[
          member.role
          ]


  if (
      mapped
  ) {

    return mapped
  }


  const specialties =
      Array.isArray(
          member.specialties
      )

          ? member.specialties

          : []


  if (
      specialties.length
  ) {

    return specialties
        .slice(
            0,
            3
        )
  }


  const focusAreas =
      Array.isArray(
          member.focusAreas
      )

          ? member.focusAreas

          : []


  return focusAreas
      .slice(
          0,
          3
      )
}


/* ==================================================
   DISPLAYED ROLE POINTS
================================================== */

const rolePoints =
    computed(
        () =>

            rolePointsFor(
                displayedCopyMember.value
            )
    )
</script>


<template>
  <section
      class="member-feature"

      :style="{
        '--accent':
          accent
      }"
  >

    <!-- ==================================================
         TOP LABEL
    =================================================== -->

    <header class="feature-header">

      <span class="header-label">
        COUNCIL MEMBER /
        {{ formattedNumber }}
      </span>


      <span class="header-line"></span>

    </header>


    <!-- ==================================================
         MEMBER STAGE
    =================================================== -->

    <div
        v-if="
          displayedImageMember
          ||
          displayedCopyMember
        "

        class="member-stage"
    >

      <!-- ==================================================
           CHARACTER ART CONTAINER

           IMPORTANT:

           This container does NOT transition.

           Only the actual PNG image inside transitions.

           This preserves the transparency of the PNG.
      =================================================== -->

      <div
          class="character-art"
          aria-hidden="true"
      >

        <!-- ==============================================
             IMAGE TRANSITION
        =============================================== -->

        <Transition
            name="character-image-change"

            mode="out-in"

            @after-enter="
              onImageEnterComplete
            "
        >

          <img
              v-if="
                displayedImageMember
              "

              :key="
                characterIdOf(
                  displayedImageMember
                )
              "

              class="character-image"

              :src="
                characterImage(
                  displayedImageMember
                )
              "

              :alt="
                displayedImageMember.name
              "
          />

        </Transition>


        <!-- ==============================================
             STATIC SIDE BLEND

             Does NOT participate in image transitions.
        =============================================== -->

        <div class="art-side-blend"></div>


        <!-- ==============================================
             STATIC BOTTOM BLEND
        =============================================== -->

        <div class="art-bottom-blend"></div>

      </div>


      <!-- ==================================================
           MEMBER COPY

           Old copy remains visible during image change.

           It only transitions after the new image has
           completely entered.
      =================================================== -->

      <Transition
          name="member-copy-change"
          mode="out-in"
      >

        <div
            v-if="
              displayedCopyMember
            "

            :key="
              characterIdOf(
                displayedCopyMember
              )
            "

            class="member-copy"
        >

          <!-- NAME -->

          <h1 class="member-name">
            {{ displayedCopyMember.name }}
          </h1>


          <!-- ROLE -->

          <div class="member-role">
            {{ displayedCopyMember.role }}
          </div>


          <!-- DIVIDER -->

          <div class="copy-divider"></div>


          <!-- DESCRIPTION -->

          <p class="member-description">
            {{ displayedCopyMember.description }}
          </p>


          <!-- ROLE IN COUNCIL -->

          <div class="council-role">

            <h2>
              ROLE IN YOUR COUNCIL
            </h2>


            <div class="role-points">

              <template
                  v-for="(
                    point,
                    index
                  ) in rolePoints"

                  :key="
                    `${characterIdOf(
                      displayedCopyMember
                    )}-${point}`
                  "
              >

                <span class="role-point">
                  {{ point }}
                </span>


                <span
                    v-if="
                      index <
                      rolePoints.length - 1
                    "

                    class="role-separator"
                >
                  ◆
                </span>

              </template>

            </div>

          </div>

        </div>

      </Transition>

    </div>


    <!-- ==================================================
         EMPTY STATE
    =================================================== -->

    <div
        v-if="
          !displayedImageMember
          &&
          !displayedCopyMember
        "

        class="member-empty"
    >
      Select a council member
    </div>

  </section>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.member-feature {
  position:
      relative;

  isolation:
      isolate;

  width:
      100%;

  height:
      100%;

  min-width:
      0;

  min-height:
      0;

  overflow:
      hidden;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--accent)
          52%,
          rgb(255 255 255 / 0.08)
      );

  border-radius:
      9px;

  background:
      linear-gradient(
          90deg,
          rgb(5 8 20 / 0.96)
          0%,
          rgb(7 9 24 / 0.9)
          42%,
          rgb(6 8 20 / 0.7)
          100%
      );

  box-shadow:
      inset 0 0 32px
      rgb(74 33 160 / 0.07);

  color:
      #eeeaff;

  box-sizing:
      border-box;

  transition:
      border-color
      0.32s
      ease;
}


/* ==================================================
   SUBTLE BACKGROUND DETAIL
================================================== */

.member-feature::before {
  content:
      "";

  position:
      absolute;

  inset:
      0;

  z-index:
      0;

  pointer-events:
      none;

  background:
      linear-gradient(
          120deg,
          transparent
          0%,
          transparent
          30%,
          rgb(128 67 255 / 0.025)
          50%,
          transparent
          70%
      );
}


/* ==================================================
   LEFT EDGE ACCENT
================================================== */

.member-feature::after {
  content:
      "";

  position:
      absolute;

  left:
      -1px;

  top:
      2%;

  bottom:
      2%;

  z-index:
      4;

  width:
      2px;

  background:
      linear-gradient(
          180deg,
          transparent,
          var(--accent)
          10%,
          var(--accent)
          90%,
          transparent
      );

  box-shadow:
      0 0 10px
      color-mix(
          in srgb,
          var(--accent)
          55%,
          transparent
      );

  transition:
      background
      0.32s
      ease,
      box-shadow
      0.32s
      ease;
}


/* ==================================================
   HEADER
================================================== */

.feature-header {
  position:
      absolute;

  z-index:
      10;

  top:
      0;

  left:
      0;

  width:
      58%;

  height:
      clamp(
          2.1rem,
          3.3vw,
          3.3rem
      );

  padding-left:
      clamp(
          1.1rem,
          1.8vw,
          2.2rem
      );

  display:
      flex;

  align-items:
      center;

  gap:
      1rem;

  box-sizing:
      border-box;
}


.header-label {
  flex:
      0 0 auto;

  font-size:
      clamp(
          0.52rem,
          0.63vw,
          0.8rem
      );

  font-weight:
      700;

  letter-spacing:
      0.12em;

  color:
      #a879ff;

  text-shadow:
      0 0 10px
      rgb(147 86 255 / 0.28);
}


.header-line {
  width:
      min(
          15vw,
          16rem
      );

  height:
      1px;

  background:
      linear-gradient(
          90deg,
          rgb(146 92 255 / 0.35),
          transparent
      );
}


/* ==================================================
   MEMBER STAGE
================================================== */

.member-stage {
  position:
      absolute;

  inset:
      0;

  z-index:
      1;

  overflow:
      hidden;
}


/* ==================================================
   CHARACTER ART CONTAINER

   STATIC.

   This layer does not animate.

   Therefore the transparency of the image remains
   untouched by the transition system.
================================================== */

.character-art {
  position:
      absolute;

  z-index:
      1;

  top:
      0;

  right:
      0;

  width:
      63%;

  height:
      100%;

  pointer-events:
      none;

  overflow:
      visible;
}


/* ==================================================
   CHARACTER IMAGE

   ONLY this transparent PNG participates in the
   character change transition.
================================================== */

.character-image {
  position:
      absolute;

  z-index:
      1;

  right:
      0;

  bottom:
      0;

  width:
      100%;

  height:
      100%;

  display:
      block;

  object-fit:
      contain;

  object-position:
      right bottom;

  user-select:
      none;

  pointer-events:
      none;

  will-change:
      opacity,
      transform;
}


/* ==================================================
   STATIC SIDE BLEND

   This remains mounted through character changes.

   It prevents any rectangular overlay from fading
   with the PNG.
================================================== */

.art-side-blend {
  position:
      absolute;

  z-index:
      2;

  inset:
      0;

  pointer-events:
      none;

  background:
      linear-gradient(
          90deg,
          rgb(6 8 20 / 1)
          0%,
          rgb(6 8 20 / 0.86)
          9%,
          rgb(6 8 20 / 0.35)
          24%,
          transparent
          48%
      );
}


/* ==================================================
   STATIC BOTTOM BLEND
================================================== */

.art-bottom-blend {
  position:
      absolute;

  z-index:
      3;

  left:
      0;

  right:
      0;

  bottom:
      0;

  height:
      22%;

  pointer-events:
      none;

  background:
      linear-gradient(
          0deg,
          rgb(5 7 18 / 0.4),
          transparent
      );
}


/* ==================================================
   COPY AREA
================================================== */

.member-copy {
  position:
      absolute;

  z-index:
      5;

  top:
      21%;

  left:
      clamp(
          1.2rem,
          2vw,
          2.4rem
      );

  width:
      min(
          39%,
          27rem
      );

  min-width:
      0;

  will-change:
      opacity,
      transform;
}


/* ==================================================
   NAME
================================================== */

.member-name {
  margin:
      0;

  font-family:
      Georgia,
      'Times New Roman',
      serif;

  font-size:
      clamp(
          1.35rem,
          2vw,
          2.55rem
      );

  font-weight:
      700;

  line-height:
      1;

  letter-spacing:
      0.035em;

  text-transform:
      uppercase;

  color:
      var(--accent);

  text-shadow:
      0 0 18px
      color-mix(
          in srgb,
          var(--accent)
          18%,
          transparent
      );
}


/* ==================================================
   ROLE
================================================== */

.member-role {
  margin-top:
      clamp(
          0.45rem,
          0.7vh,
          0.75rem
      );

  font-size:
      clamp(
          0.62rem,
          0.8vw,
          1rem
      );

  font-weight:
      700;

  letter-spacing:
      0.13em;

  text-transform:
      uppercase;

  color:
      color-mix(
          in srgb,
          var(--accent)
          76%,
          #ffffff
      );
}


/* ==================================================
   DIVIDER
================================================== */

.copy-divider {
  width:
      clamp(
          2rem,
          3vw,
          3.5rem
      );

  height:
      1px;

  margin:
      clamp(
          0.7rem,
          1.2vh,
          1.25rem
      )
      0;

  background:
      linear-gradient(
          90deg,
          color-mix(
              in srgb,
              var(--accent)
              70%,
              white
          ),
          transparent
      );
}


/* ==================================================
   DESCRIPTION
================================================== */

.member-description {
  margin:
      0;

  max-width:
      25rem;

  font-size:
      clamp(
          0.62rem,
          0.75vw,
          0.94rem
      );

  font-weight:
      400;

  line-height:
      1.55;

  color:
      rgba(
          221,
          216,
          236,
          0.76
      );
}


/* ==================================================
   ROLE SECTION
================================================== */

.council-role {
  margin-top:
      clamp(
          1.4rem,
          3.6vh,
          3rem
      );
}


.council-role h2 {
  margin:
      0
      0
      clamp(
          0.55rem,
          0.9vh,
          0.9rem
      );

  font-size:
      clamp(
          0.54rem,
          0.68vw,
          0.83rem
      );

  font-weight:
      700;

  letter-spacing:
      0.11em;

  color:
      var(--accent);
}


/* ==================================================
   ROLE POINTS
================================================== */

.role-points {
  display:
      flex;

  flex-wrap:
      wrap;

  align-items:
      center;

  gap:
      0.35rem
      0.65rem;

  max-width:
      25rem;
}


.role-point {
  font-size:
      clamp(
          0.52rem,
          0.65vw,
          0.8rem
      );

  line-height:
      1.4;

  color:
      rgba(
          218,
          211,
          235,
          0.7
      );
}


.role-separator {
  font-size:
      0.28rem;

  color:
      color-mix(
          in srgb,
          var(--accent)
          62%,
          transparent
      );
}


/* ==================================================
   EMPTY STATE
================================================== */

.member-empty {
  position:
      absolute;

  inset:
      0;

  z-index:
      5;

  display:
      grid;

  place-items:
      center;

  font-size:
      0.75rem;

  letter-spacing:
      0.12em;

  text-transform:
      uppercase;

  color:
      rgb(218 209 240 / 0.4);
}


/* ==================================================
   CHARACTER IMAGE LEAVE

   Old PNG dissolves away.

   No blur is used because blur can make transparent
   artwork appear to have rectangular boundaries.
================================================== */

.character-image-change-leave-active {
  transition:
      opacity
      0.3s
      ease,
      transform
      0.34s
      ease;
}


.character-image-change-leave-from {
  opacity:
      1;

  transform:
      translateX(0)
      scale(1);
}


.character-image-change-leave-to {
  opacity:
      0;

  transform:
      translateX(14px)
      scale(1.012);
}


/* ==================================================
   CHARACTER IMAGE ENTER

   New PNG enters only after the previous image has
   fully disappeared.
================================================== */

.character-image-change-enter-active {
  transition:
      opacity
      0.5s
      ease,
      transform
      0.58s
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.character-image-change-enter-from {
  opacity:
      0;

  transform:
      translateX(28px)
      scale(0.985);
}


.character-image-change-enter-to {
  opacity:
      1;

  transform:
      translateX(0)
      scale(1);
}


/* ==================================================
   COPY LEAVE

   Starts only after new image has completed entering.
================================================== */

.member-copy-change-leave-active {
  transition:
      opacity
      0.2s
      ease,
      transform
      0.24s
      ease;
}


.member-copy-change-leave-from {
  opacity:
      1;

  transform:
      translateY(0);
}


.member-copy-change-leave-to {
  opacity:
      0;

  transform:
      translateY(-5px);
}


/* ==================================================
   COPY ENTER
================================================== */

.member-copy-change-enter-active {
  transition:
      opacity
      0.34s
      ease,
      transform
      0.42s
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.member-copy-change-enter-from {
  opacity:
      0;

  transform:
      translateY(8px);
}


.member-copy-change-enter-to {
  opacity:
      1;

  transform:
      translateY(0);
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (
max-width:
    1100px
) {

  .character-art {
    width:
        58%;
  }


  .member-copy {
    width:
        44%;
  }


  .member-description {
    line-height:
        1.42;
  }


  .council-role {
    margin-top:
        1.2rem;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (
prefers-reduced-motion:
    reduce
) {

  .character-image-change-enter-active,
  .character-image-change-leave-active,
  .member-copy-change-enter-active,
  .member-copy-change-leave-active {
    transition:
        none !important;
  }
}
</style>
