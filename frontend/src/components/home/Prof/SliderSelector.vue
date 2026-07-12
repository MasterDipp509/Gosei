<script setup>
import { computed } from "vue"

const props = defineProps({
  items: {
    type: Array,
    required: true
  },

  modelValue: {
    type: [String, Number],
    required: true
  },

  primary: {
    type: String,
    required: true
  },

  secondary: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  "update:modelValue",
  "select"
])

const selectorStyle = computed(() => ({
  "--primary": props.primary,
  "--secondary": props.secondary
}))

const currentIndex = computed(() => {
  const index = props.items.findIndex(
      item => item.id === props.modelValue
  )

  return index >= 0
      ? index
      : 0
})

function wrapIndex(index) {
  const length = props.items.length

  if (!length) {
    return 0
  }

  return (
      (index % length) +
      length
  ) % length
}

const visibleItems = computed(() => {
  if (!props.items.length) {
    return []
  }

  if (props.items.length === 1) {
    return [
      {
        item: props.items[0],
        index: 0,
        position: "center"
      }
    ]
  }

  return [
    {
      item:
          props.items[
              wrapIndex(
                  currentIndex.value - 1
              )
              ],

      index:
          wrapIndex(
              currentIndex.value - 1
          ),

      position: "left"
    },

    {
      item:
          props.items[
              currentIndex.value
              ],

      index:
      currentIndex.value,

      position: "center"
    },

    {
      item:
          props.items[
              wrapIndex(
                  currentIndex.value + 1
              )
              ],

      index:
          wrapIndex(
              currentIndex.value + 1
          ),

      position: "right"
    }
  ]
})

function selectIndex(index) {
  const item =
      props.items[index]

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

function previous() {
  if (props.items.length <= 1) {
    return
  }

  selectIndex(
      wrapIndex(
          currentIndex.value - 1
      )
  )
}

function next() {
  if (props.items.length <= 1) {
    return
  }

  selectIndex(
      wrapIndex(
          currentIndex.value + 1
      )
  )
}

function handleKeydown(event) {
  if (event.key === "ArrowLeft") {
    event.preventDefault()
    previous()
  }

  if (event.key === "ArrowRight") {
    event.preventDefault()
    next()
  }
}
</script>

<template>
  <section
      class="discussion-selector"
      :style="selectorStyle"
      tabindex="0"
      @keydown="handleKeydown"
  >
    <button
        class="selector-arrow"
        type="button"
        aria-label="Previous discussion"
        @click="previous"
    >
      ‹
    </button>

    <div class="selector-items">
      <button
          v-for="entry in visibleItems"
          :key="`${entry.position}-${entry.item.id}`"
          class="selector-item"
          :class="[
            `selector-item-${entry.position}`,
            {
              active:
                entry.position ===
                'center'
            }
          ]"
          type="button"
          @click="selectIndex(entry.index)"
      >
        <span class="selector-title">
          {{ entry.item.title }}
        </span>
      </button>
    </div>

    <button
        class="selector-arrow"
        type="button"
        aria-label="Next discussion"
        @click="next"
    >
      ›
    </button>
  </section>
</template>

<style scoped>
.discussion-selector {
  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-columns:
      auto
      minmax(0, 1fr)
      auto;

  align-items: center;

  gap:
      clamp(
          0.8rem,
          2vw,
          2rem
      );

  padding:
      0
      clamp(
          0.5rem,
          1.2vw,
          1.25rem
      );

  outline: none;

  user-select: none;
}

.selector-items {
  min-width: 0;

  display: grid;

  grid-template-columns:
      minmax(0, 1fr)
      minmax(0, 1.35fr)
      minmax(0, 1fr);

  align-items: center;

  gap:
      clamp(
          0.75rem,
          2vw,
          2.5rem
      );
}

.selector-item {
  min-width: 0;

  position: relative;

  padding:
      0.75rem
      0.5rem
      0.9rem;

  border: none;

  background: transparent;

  color:
      rgba(
          235,
          242,
          250,
          0.42
      );

  font-family: inherit;

  font-size:
      clamp(
          0.72rem,
          0.9vw,
          0.95rem
      );

  font-weight: 500;

  letter-spacing: 0.03em;

  cursor: pointer;

  transition:
      color 180ms ease,
      opacity 180ms ease;
}

.selector-item:hover {
  color:
      rgba(
          235,
          242,
          250,
          0.75
      );
}

.selector-item-left {
  text-align: right;

  opacity: 0.6;
}

.selector-item-right {
  text-align: left;

  opacity: 0.6;
}

.selector-item-center {
  text-align: center;
}

.selector-item.active {
  color: var(--primary);

  opacity: 1;

  font-size:
      clamp(
          0.88rem,
          1.1vw,
          1.15rem
      );

  font-weight: 600;
}

.selector-item.active::after {
  content: "";

  position: absolute;

  left: 50%;
  bottom: 0;

  width:
      clamp(
          2.5rem,
          45%,
          6rem
      );

  height: 2px;

  transform:
      translateX(-50%);

  background:
      var(--primary);

  border-radius: 999px;

  box-shadow:
      0 0 0.45rem
      color-mix(
          in srgb,
          var(--primary) 55%,
          transparent
      );
}

.selector-title {
  display: block;

  overflow: hidden;

  white-space: nowrap;

  text-overflow: ellipsis;
}

.selector-arrow {
  width:
      clamp(
          2rem,
          2.6vw,
          2.75rem
      );

  height:
      clamp(
          2rem,
          2.6vw,
          2.75rem
      );

  display: grid;

  place-items: center;

  padding: 0;

  border: none;

  background: transparent;

  color:
      rgba(
          235,
          242,
          250,
          0.55
      );

  font-family:
      Arial,
      sans-serif;

  font-size:
      clamp(
          1.5rem,
          2vw,
          2rem
      );

  font-weight: 300;

  line-height: 1;

  cursor: pointer;

  transition:
      color 180ms ease,
      transform 180ms ease;
}

.selector-arrow:hover {
  color: var(--primary);

  transform:
      scale(1.08);
}

.selector-arrow:active {
  transform:
      scale(0.94);
}

@media
(max-width: 700px) {
  .discussion-selector {
    gap: 0.4rem;

    padding: 0 0.25rem;
  }

  .selector-items {
    gap: 0.3rem;

    grid-template-columns:
        0.7fr
        1.5fr
        0.7fr;
  }

  .selector-item {
    padding-inline: 0.2rem;

    font-size: 0.65rem;
  }

  .selector-item.active {
    font-size: 0.82rem;
  }

  .selector-arrow {
    width: 1.8rem;
    height: 1.8rem;

    font-size: 1.45rem;
  }
}

@media
(prefers-reduced-motion: reduce) {
  .selector-item,
  .selector-arrow {
    transition: none;
  }
}
</style>
