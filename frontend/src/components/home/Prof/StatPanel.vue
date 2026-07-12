<script setup>
import { computed } from "vue"

import {
  MessageSquareText,
  Gauge,
  ShieldAlert,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-vue-next"


const props = defineProps({
  icon: {
    type: String,
    required: true
  },

  title: {
    type: String,
    required: true
  },

  value: {
    type: [String, Number],
    required: true
  },

  suffix: {
    type: String,
    default: ""
  },

  change: {
    type: Number,
    default: 0
  },

  period: {
    type: String,
    default: ""
  },

  accent: {
    type: String,
    default: "#4bc8ff"
  },

  rounded: {
    type: Boolean,
    default: false
  }
})


const iconComponent = computed(() => {
  const icons = {
    discussion: MessageSquareText,
    confidence: Gauge,
    issues: ShieldAlert,
    activity: Activity
  }

  return icons[props.icon] ?? Activity
})


const trend = computed(() => {
  if (props.change > 0) {
    return "up"
  }

  if (props.change < 0) {
    return "down"
  }

  return "neutral"
})


const trendIcon = computed(() => {
  if (trend.value === "up") {
    return TrendingUp
  }

  if (trend.value === "down") {
    return TrendingDown
  }

  return Minus
})


const changeText = computed(() => {
  return Math.abs(props.change)
})


const panelStyle = computed(() => ({
  "--prof-stat-accent": props.accent
}))
</script>


<template>
  <article
      class="prof-stat-panel"
      :class="{
        'prof-stat-panel-rounded': rounded
      }"
      :style="panelStyle"
  >

    <div class="prof-stat-glow"></div>


    <div class="prof-stat-top">

      <div class="prof-stat-heading">

        <div class="prof-stat-icon-shell">
          <component
              :is="iconComponent"
              class="prof-stat-icon"
          />
        </div>


        <span class="prof-stat-title">
          {{ title }}
        </span>

      </div>


      <div class="prof-stat-accent-marker">
        <span></span>
        <span></span>
        <span></span>
      </div>

    </div>


    <div class="prof-stat-main">

      <div class="prof-stat-value-row">

        <span class="prof-stat-value">
          {{ value }}
        </span>

        <span
            v-if="suffix"
            class="prof-stat-suffix"
        >
          {{ suffix }}
        </span>

      </div>

    </div>


    <div class="prof-stat-footer">

      <div
          v-if="change !== 0"
          class="prof-stat-change"
          :class="`prof-stat-change-${trend}`"
      >

        <component
            :is="trendIcon"
            class="prof-stat-change-icon"
        />

        <span>
          {{ changeText }}%
        </span>

      </div>


      <div
          v-else
          class="prof-stat-status-dot"
      >
        <span></span>
      </div>


      <span class="prof-stat-period">
        {{ period }}
      </span>

    </div>

  </article>
</template>


<style scoped>
.prof-stat-panel {
  --prof-stat-accent: #4bc8ff;

  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-rows:
      auto
      minmax(0, 1fr)
      auto;

  box-sizing: border-box;

  overflow: hidden;

  padding:
      clamp(1rem, 1.4vw, 1.6rem);

  background:
      #05060b;

  border:
      1px solid
      rgba(255, 255, 255, 0.055);

  transition:
      border-color 180ms ease,
      transform 180ms ease;
}


.prof-stat-panel:hover {
  border-color:
      color-mix(
          in srgb,
          var(--prof-stat-accent) 35%,
          transparent
      );

  transform:
      translateY(-1px);
}


.prof-stat-panel-rounded {
  border-radius:
      clamp(
          1rem,
          1.35vw,
          1.5rem
      );
}


.prof-stat-glow {
  position: absolute;

  right: -15%;
  bottom: -50%;

  width: 55%;
  aspect-ratio: 1;

  border-radius: 50%;

  background:
      var(--prof-stat-accent);

  opacity: 0.055;

  filter:
      blur(4rem);

  pointer-events: none;
}


.prof-stat-top {
  position: relative;

  z-index: 1;

  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 1rem;

  min-width: 0;
}


.prof-stat-heading {
  display: flex;
  align-items: center;

  gap:
      clamp(
          0.65rem,
          0.8vw,
          0.9rem
      );

  min-width: 0;
}


.prof-stat-icon-shell {
  flex: 0 0 auto;

  width:
      clamp(
          2.35rem,
          2.6vw,
          3rem
      );

  height:
      clamp(
          2.35rem,
          2.6vw,
          3rem
      );

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius:
      0.75rem;

  background:
      color-mix(
          in srgb,
          var(--prof-stat-accent) 9%,
          #05060b
      );

  border:
      1px solid
      color-mix(
          in srgb,
          var(--prof-stat-accent) 20%,
          transparent
      );

  box-shadow:
      inset 0 0 1rem
      color-mix(
          in srgb,
          var(--prof-stat-accent) 6%,
          transparent
      );
}


.prof-stat-icon {
  width:
      clamp(
          1.1rem,
          1.25vw,
          1.45rem
      );

  height:
      clamp(
          1.1rem,
          1.25vw,
          1.45rem
      );

  color:
      var(--prof-stat-accent);

  filter:
      drop-shadow(
          0 0 0.45rem
          color-mix(
              in srgb,
              var(--prof-stat-accent) 40%,
              transparent
          )
      );
}


.prof-stat-title {
  min-width: 0;

  color:
      #aab5c5;

  font-size:
      clamp(
          0.78rem,
          0.78vw,
          0.96rem
      );

  font-weight: 600;

  line-height: 1.2;

  letter-spacing:
      0.01em;
}


.prof-stat-accent-marker {
  flex: 0 0 auto;

  display: flex;
  align-items: flex-end;

  gap: 0.18rem;

  height: 1rem;

  padding-top: 0.25rem;
}


.prof-stat-accent-marker span {
  display: block;

  width: 0.18rem;

  border-radius: 999px;

  background:
      var(--prof-stat-accent);

  box-shadow:
      0 0 0.4rem
      color-mix(
          in srgb,
          var(--prof-stat-accent) 45%,
          transparent
      );
}


.prof-stat-accent-marker span:nth-child(1) {
  height: 35%;
  opacity: 0.35;
}


.prof-stat-accent-marker span:nth-child(2) {
  height: 70%;
  opacity: 0.65;
}


.prof-stat-accent-marker span:nth-child(3) {
  height: 100%;
}


.prof-stat-main {
  position: relative;

  z-index: 1;

  min-width: 0;
  min-height: 0;

  display: flex;
  align-items: center;

  padding:
      clamp(
          0.6rem,
          1vh,
          1rem
      )
      0;
}


.prof-stat-value-row {
  display: flex;
  align-items: baseline;

  gap:
      clamp(
          0.2rem,
          0.3vw,
          0.35rem
      );

  min-width: 0;
}


.prof-stat-value {
  color:
      #f4f8ff;

  font-size:
      clamp(
          1.8rem,
          2.6vw,
          3.45rem
      );

  font-weight: 650;

  line-height: 0.95;

  letter-spacing:
      -0.055em;

  white-space: nowrap;

  text-shadow:
      0 0 1.5rem
      rgba(255, 255, 255, 0.045);

  overflow: hidden;

  text-overflow: ellipsis;
}


.prof-stat-suffix {
  color:
      var(--prof-stat-accent);

  font-size:
      clamp(
          1rem,
          1.25vw,
          1.55rem
      );

  font-weight: 600;

  line-height: 1;
}


.prof-stat-footer {
  position: relative;

  z-index: 1;

  min-width: 0;

  display: flex;
  align-items: center;

  gap:
      clamp(
          0.45rem,
          0.55vw,
          0.7rem
      );

  padding-top:
      clamp(
          0.65rem,
          0.8vw,
          0.9rem
      );

  border-top:
      1px solid
      rgba(255, 255, 255, 0.045);
}


.prof-stat-change {
  flex: 0 0 auto;

  display: flex;
  align-items: center;

  gap: 0.25rem;

  font-size:
      clamp(
          0.7rem,
          0.68vw,
          0.82rem
      );

  font-weight: 700;
}


.prof-stat-change-up {
  color:
      #5de6a8;
}


.prof-stat-change-down {
  color:
      #ff727f;
}


.prof-stat-change-neutral {
  color:
      #8794a8;
}


.prof-stat-change-icon {
  width: 0.9rem;
  height: 0.9rem;
}


.prof-stat-status-dot {
  flex: 0 0 auto;

  width: 0.5rem;
  height: 0.5rem;

  display: flex;
  align-items: center;
  justify-content: center;
}


.prof-stat-status-dot span {
  width: 0.35rem;
  height: 0.35rem;

  border-radius: 50%;

  background:
      var(--prof-stat-accent);

  box-shadow:
      0 0 0.5rem
      color-mix(
          in srgb,
          var(--prof-stat-accent) 65%,
          transparent
      );
}


.prof-stat-period {
  min-width: 0;

  color:
      #667386;

  font-size:
      clamp(
          0.68rem,
          0.68vw,
          0.82rem
      );

  font-weight: 500;

  line-height: 1.3;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}


@media (max-width: 1200px) {

  .prof-stat-panel {
    padding: 1rem;
  }


  .prof-stat-value {
    font-size:
        clamp(
            1.8rem,
            3vw,
            2.8rem
        );
  }

}


@media (max-width: 600px) {

  .prof-stat-panel {
    min-height: 9rem;

    padding:
        0.9rem 1rem;
  }


  .prof-stat-main {
    padding:
        0.7rem 0;
  }


  .prof-stat-value {
    font-size:
        clamp(
            1.8rem,
            8vw,
            2.6rem
        );
  }


  .prof-stat-title {
    font-size: 0.82rem;
  }


  .prof-stat-period {
    white-space: normal;
  }

}
</style>
