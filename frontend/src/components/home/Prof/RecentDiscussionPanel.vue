<script setup>
import { computed } from "vue"

const props = defineProps({
  discussion: {
    type: Object,
    default: null
  },

  primary: {
    type: String,
    default: "#4bc8ff"
  },

  secondary: {
    type: String,
    default: "#9f62ff"
  },

  rounded: {
    type: Boolean,
    default: false
  }
})

const radius = 42

const circumference =
    2 * Math.PI * radius

const confidence = computed(() => {
  const value =
      Number(
          props.discussion
              ?.confidenceScore ?? 0
      )

  return Math.max(
      0,
      Math.min(100, value)
  )
})

const confidenceOffset = computed(() => {
  return (
      circumference -
      (
          confidence.value /
          100
      ) *
      circumference
  )
})

const panelStyle = computed(() => {
  const image =
      props.discussion
          ?.coverImage

  return {
    "--primary":
    props.primary,

    "--secondary":
    props.secondary,

    "--circumference":
    circumference,

    "--confidence-offset":
    confidenceOffset.value,

    "--discussion-image":
        image
            ? `url("${image}")`
            : "none"
  }
})
</script>


<template>
  <article
      v-if="discussion"
      class="discussion-panel"
      :class="{ rounded }"
      :style="panelStyle"
  >
    <span class="corner top-left"></span>
    <span class="corner top-right"></span>
    <span class="corner bottom-left"></span>
    <span class="corner bottom-right"></span>


    <div class="discussion-main">

      <div class="visual-layer">
        <div class="discussion-image"></div>
      </div>


      <div class="top-content">
        <span class="eyebrow">
          Recent Discussion
        </span>


        <h2 class="discussion-title">
          {{ discussion.title }}
        </h2>


        <div class="category-chip">
          <span class="chip-diamond"></span>

          {{ discussion.category }}
        </div>


        <p class="description">
          {{ discussion.description }}
        </p>
      </div>

    </div>


    <div class="lower-section">

      <div class="verdict-section">
        <span class="section-label">
          Council Verdict
        </span>

        <strong class="verdict">
          {{ discussion.verdict }}
        </strong>
      </div>


      <div class="confidence-section">

        <div class="confidence-copy">
          <span class="section-label">
            Confidence Score
          </span>

          <strong class="confidence-number">
            {{ confidence }}%
          </strong>
        </div>


        <div class="confidence-ring">
          <svg viewBox="0 0 110 110">
            <circle
                class="ring-track"
                cx="55"
                cy="55"
                :r="radius"
            />

            <circle
                class="ring-progress"
                cx="55"
                cy="55"
                :r="radius"
            />
          </svg>

          <div class="ring-core"></div>
        </div>

      </div>

    </div>

  </article>
</template>


<style scoped>
.discussion-panel {
  --primary: #4bc8ff;
  --secondary: #9f62ff;

  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-columns:
      minmax(0, 1fr)
      minmax(
          24rem,
          29%
      );

  grid-template-rows:
      minmax(0, 1fr);

  overflow: hidden;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--primary) 38%,
          rgba(255, 255, 255, 0.08)
      );

  background:
      rgba(2, 6, 12, 0.96);

  box-shadow:
      inset 0 0 2rem
      rgba(0, 0, 0, 0.62);

  isolation: isolate;
}


.discussion-panel.rounded {
  border-radius:
      11px 0 11px 0;
}


.discussion-main {
  position: relative;

  min-width: 0;
  min-height: 0;

  height: 100%;

  overflow: hidden;
}


.visual-layer {
  position: absolute;

  z-index: 0;

  top: 0;
  right: 0;
  bottom: 0;

  width: 52%;

  overflow: hidden;

  pointer-events: none;
}


.discussion-image {
  position: absolute;

  inset: 0;

  background-image:
      var(--discussion-image);

  background-position:
      center;

  background-repeat:
      no-repeat;

  background-size:
      cover;

  opacity: 0.35;

  filter:
      saturate(0.72)
      contrast(1.08);
}


.visual-layer::before {
  content: "";

  position: absolute;

  z-index: 2;

  inset: 0;

  background:
      linear-gradient(
          90deg,
          rgba(2, 6, 12, 1) 0%,
          rgba(2, 6, 12, 0.72) 24%,
          rgba(2, 6, 12, 0.16) 72%,
          rgba(2, 6, 12, 0.3) 100%
      );
}


.top-content {
  position: relative;

  z-index: 4;

  width: min(
      70%,
      42rem
  );

  height: 100%;

  min-width: 0;
  min-height: 0;

  display: flex;

  flex-direction: column;

  align-items: flex-start;

  justify-content: center;

  padding:
      clamp(
          0.8rem,
          1.3vw,
          1.35rem
      )
      clamp(
          1.2rem,
          2vw,
          2rem
      )
      clamp(
          0.8rem,
          1.3vw,
          1.35rem
      )
      clamp(
          1.6rem,
          2.5vw,
          2.8rem
      );

  box-sizing: border-box;
}


.eyebrow,
.section-label {
  color:
      rgba(
          187,
          209,
          232,
          0.72
      );

  font-family:
      Georgia,
      "Times New Roman",
      serif;

  font-size:
      clamp(
          0.54rem,
          0.58vw,
          0.68rem
      );

  letter-spacing:
      0.065em;

  text-transform:
      uppercase;
}


.discussion-title {
  margin:
      0.3rem
      0
      0;

  color:
      rgba(
          239,
          244,
          250,
          0.96
      );

  font-family:
      Georgia,
      "Times New Roman",
      serif;

  font-size:
      clamp(
          1rem,
          1.3vw,
          1.55rem
      );

  font-weight: 400;

  line-height: 1.15;
}


.category-chip {
  display: inline-flex;

  align-items: center;

  gap: 0.38rem;

  margin-top: 0.45rem;

  padding:
      0.26rem
      0.55rem;

  border:
      1px solid
      color-mix(
          in srgb,
          var(--secondary) 25%,
          transparent
      );

  border-radius: 999px;

  background:
      color-mix(
          in srgb,
          var(--secondary) 10%,
          rgba(2, 4, 10, 0.9)
      );

  color:
      color-mix(
          in srgb,
          var(--secondary) 75%,
          white
      );

  font-size:
      clamp(
          0.48rem,
          0.52vw,
          0.62rem
      );
}


.chip-diamond {
  width: 0.34rem;

  aspect-ratio: 1;

  border:
      1px solid
      var(--secondary);

  transform:
      rotate(45deg);
}


.description {
  width:
      min(
          100%,
          36rem
      );

  margin:
      0.55rem
      0
      0;

  color:
      rgba(
          212,
          222,
          234,
          0.76
      );

  font-size:
      clamp(
          0.58rem,
          0.67vw,
          0.76rem
      );

  line-height: 1.45;

  display: -webkit-box;

  -webkit-box-orient: vertical;

  -webkit-line-clamp: 2;

  overflow: hidden;
}


.lower-section {
  position: relative;

  z-index: 5;

  min-width: 0;
  min-height: 0;

  height: 100%;

  display: grid;

  grid-template-columns:
      minmax(0, 1fr)
      minmax(0, 1.05fr);

  border-left:
      1px solid
      rgba(
          108,
          160,
          205,
          0.12
      );

  background:
      rgba(
          2,
          6,
          12,
          0.97
      );
}


.verdict-section {
  min-width: 0;
  min-height: 0;

  height: 100%;

  display: flex;

  flex-direction: column;

  align-items: flex-start;

  justify-content: center;

  padding:
      clamp(
          0.75rem,
          1.2vw,
          1.25rem
      );

  box-sizing: border-box;

  border-right:
      1px solid
      rgba(
          108,
          160,
          205,
          0.1
      );
}


.verdict {
  margin-top: 0.35rem;

  max-width: 100%;

  color:
      rgba(
          236,
          242,
          249,
          0.96
      );

  font-family:
      Georgia,
      "Times New Roman",
      serif;

  font-size:
      clamp(
          0.95rem,
          1.25vw,
          1.45rem
      );

  font-weight: 400;

  line-height: 1.2;

  overflow-wrap: anywhere;
}


.confidence-section {
  min-width: 0;
  min-height: 0;

  height: 100%;

  display: grid;

  grid-template-columns:
      minmax(0, 1fr)
      auto;

  align-items: center;

  gap:
      clamp(
          0.5rem,
          0.9vw,
          1rem
      );

  padding:
      clamp(
          0.65rem,
          1vw,
          1.1rem
      );

  box-sizing: border-box;
}


.confidence-copy {
  min-width: 0;

  display: flex;

  flex-direction: column;

  align-items: flex-start;

  justify-content: center;
}


.confidence-number {
  margin-top: 0.3rem;

  color:
      var(--primary);

  font-family:
      Georgia,
      "Times New Roman",
      serif;

  font-size:
      clamp(
          1.3rem,
          1.8vw,
          2rem
      );

  font-weight: 400;

  line-height: 1;

  text-shadow:
      0 0 0.7rem
      rgba(
          75,
          200,
          255,
          0.22
      );
}


.confidence-ring {
  position: relative;

  flex-shrink: 0;

  width:
      clamp(
          4rem,
          5.4vw,
          5.7rem
      );

  aspect-ratio: 1;
}


.confidence-ring svg {
  width: 100%;
  height: 100%;

  transform:
      rotate(-90deg);

  overflow: visible;
}


.ring-track,
.ring-progress {
  fill: none;

  stroke-width: 9;
}


.ring-track {
  stroke:
      rgba(
          159,
          98,
          255,
          0.13
      );
}


.ring-progress {
  stroke:
      var(--secondary);

  stroke-linecap:
      round;

  stroke-dasharray:
      var(--circumference);

  stroke-dashoffset:
      var(--confidence-offset);

  filter:
      drop-shadow(
          0 0 0.3rem
          var(--secondary)
      );

  transition:
      stroke-dashoffset
      0.65s ease;
}


.ring-core {
  position: absolute;

  inset: 29%;

  border-radius: 50%;

  background:
      rgba(
          159,
          98,
          255,
          0.05
      );

  box-shadow:
      0 0 1rem
      rgba(
          159,
          98,
          255,
          0.13
      );
}


.corner {
  position: absolute;

  z-index: 10;

  width: 0.55rem;
  height: 0.55rem;

  pointer-events: none;
}


.rounded .corner {
  display: none;
}


.top-left {
  top: -1px;
  left: -1px;

  border-top:
      1px solid
      var(--primary);

  border-left:
      1px solid
      var(--primary);
}


.top-right {
  top: -1px;
  right: -1px;

  border-top:
      1px solid
      var(--primary);

  border-right:
      1px solid
      var(--primary);
}


.bottom-left {
  bottom: -1px;
  left: -1px;

  border-bottom:
      1px solid
      var(--primary);

  border-left:
      1px solid
      var(--primary);
}


.bottom-right {
  right: -1px;
  bottom: -1px;

  border-right:
      1px solid
      var(--primary);

  border-bottom:
      1px solid
      var(--primary);
}


@media (max-width: 1000px) {
  .discussion-panel {
    grid-template-columns:
        minmax(0, 1fr)
        minmax(
            21rem,
            38%
        );
  }


  .top-content {
    width: 80%;
  }


  .confidence-ring {
    width:
        clamp(
            3.5rem,
            6vw,
            4.5rem
        );
  }
}


@media (max-width: 700px) {
  .discussion-panel {
    grid-template-columns:
        minmax(0, 1fr)
        minmax(
            17rem,
            45%
        );
  }


  .top-content {
    width: 90%;

    padding-left: 1rem;
  }


  .lower-section {
    grid-template-columns:
        minmax(0, 0.9fr)
        minmax(0, 1.1fr);
  }


  .confidence-section {
    gap: 0.3rem;
  }


  .confidence-ring {
    width: 3.5rem;
  }
}
</style>
