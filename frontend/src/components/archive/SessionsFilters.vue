<script setup>
import {
  reactive,
  watch
} from 'vue'


const emit =
    defineEmits([
      'change',
      'view-change'
    ])


const filters =
    reactive({

      search:
          '',

      time:
          'today',

      type:
          'all',

      status:
          'all',

      unread:
          false,

      sort:
          'newest'
    })


const viewMode =
    defineModel(
        'viewMode',

        {
          type: String,
          default: 'list'
        }
    )


watch(
    filters,

    value => {

      emit(
          'change',
          {
            ...value
          }
      )
    },

    {
      deep: true,
      immediate: true
    }
)


function setTime(
    value
) {

  filters.time =
      filters.time === value
          ? 'all'
          : value
}


function setType(
    value
) {

  filters.type =
      filters.type === value
          ? 'all'
          : value
}


function setStatus(
    value
) {

  filters.status =
      filters.status === value
          ? 'all'
          : value
}


function toggleUnread() {

  filters.unread =
      !filters.unread
}


function setView(
    value
) {

  viewMode.value =
      value

  emit(
      'view-change',
      value
  )
}
</script>


<template>
  <section class="filters">
    <label class="search">
      <input
          v-model="filters.search"
          type="text"
          placeholder="Search sessions, topics, or council members..."
      >

      <span>
        ⌕
      </span>
    </label>


    <div class="filter-group">
      <button
          type="button"
          :class="{
          active:
            filters.time ===
            'today'
        }"
          @click="
          setTime(
            'today'
          )
        "
      >
        Today
      </button>

      <button
          type="button"
          :class="{
          active:
            filters.time ===
            'yesterday'
        }"
          @click="
          setTime(
            'yesterday'
          )
        "
      >
        Yesterday
      </button>

      <button
          type="button"
          :class="{
          active:
            filters.time ===
            'week'
        }"
          @click="
          setTime(
            'week'
          )
        "
      >
        This Week
      </button>
    </div>


    <div class="filter-group">
      <button
          type="button"
          :class="{
          active:
            filters.type ===
            'panel'
        }"
          @click="
          setType(
            'panel'
          )
        "
      >
        Panel
      </button>

      <button
          type="button"
          :class="{
          active:
            filters.type ===
            'mediator'
        }"
          @click="
          setType(
            'mediator'
          )
        "
      >
        Mediator
      </button>

      <button
          type="button"
          :class="{
          active:
            filters.status ===
            'active'
        }"
          @click="
          setStatus(
            'active'
          )
        "
      >
        Active
      </button>

      <button
          type="button"
          :class="{
          active:
            filters.status ===
            'completed'
        }"
          @click="
          setStatus(
            'completed'
          )
        "
      >
        Completed
      </button>

      <button
          type="button"
          :class="{
          active:
            filters.unread
        }"
          @click="
          toggleUnread
        "
      >
        Unread / New
      </button>
    </div>


    <div class="sort">
      <select
          v-model="filters.sort"
      >
        <option value="newest">
          Sort: Newest
        </option>

        <option value="oldest">
          Sort: Oldest
        </option>

        <option value="confidence">
          Sort: Confidence
        </option>
      </select>
    </div>


    <div class="view-toggle">
      <button
          type="button"
          :class="{
          active:
            viewMode ===
            'list'
        }"
          aria-label="List view"
          @click="
          setView(
            'list'
          )
        "
      >
        ▤
      </button>

      <button
          type="button"
          :class="{
          active:
            viewMode ===
            'grid'
        }"
          aria-label="Grid view"
          @click="
          setView(
            'grid'
          )
        "
      >
        ▦
      </button>
    </div>
  </section>
</template>


<style scoped>
.filters {
  width: 100%;
  min-width: 0;

  display: grid;

  grid-template-columns:
    minmax(250px, 1.8fr)
    auto
    auto
    minmax(105px, .42fr)
    auto;

  align-items: center;

  gap:
      .8vw;

  padding:
      .7vh .65vw;

  border:
      1px solid
      rgba(79, 190, 255, .08);

  background:
      rgba(3, 9, 18, .82);
}


.search {
  position: relative;

  min-width: 0;
}


.search input {
  width: 100%;
  height: 3.4vh;

  padding:
      0 2vw
      0 .7vw;

  border:
      1px solid
      rgba(86, 185, 235, .12);

  outline: none;

  background:
      rgba(2, 8, 16, .52);

  color:
      rgba(221, 231, 244, .86);

  font:
      inherit;

  font-size:
      .52vw;
}


.search input::placeholder {
  color:
      rgba(156, 176, 201, .42);
}


.search input:focus {
  border-color:
      rgba(76, 203, 255, .32);

  box-shadow:
      inset 0 0 12px
      rgba(59, 188, 255, .04);
}


.search span {
  position:
      absolute;

  top:
      50%;

  right:
      .65vw;

  transform:
      translateY(-50%);

  color:
      rgba(139, 174, 202, .52);

  font-size:
      .75vw;
}


.filter-group {
  display: flex;

  border:
      1px solid
      rgba(112, 140, 181, .12);
}


.filter-group button,
.view-toggle button {
  height:
      3.4vh;

  padding:
      0 .7vw;

  border: 0;

  border-right:
      1px solid
      rgba(119, 145, 181, .13);

  background:
      rgba(5, 11, 21, .45);

  color:
      rgba(190, 204, 223, .58);

  font:
      inherit;

  font-size:
      .48vw;

  cursor:
      pointer;

  transition:
      color .16s ease,
      background .16s ease,
      box-shadow .16s ease;
}


.filter-group button:last-child {
  border-right:
      0;
}


.filter-group button:hover,
.view-toggle button:hover {
  color:
      rgba(230, 238, 250, .9);

  background:
      rgba(58, 116, 168, .08);
}


.filter-group button.active {
  color:
      #f0e6ff;

  background:
      linear-gradient(
          180deg,
          rgba(124, 57, 205, .34),
          rgba(92, 40, 164, .16)
      );

  box-shadow:
      inset 0 0 12px
      rgba(172, 83, 255, .13);
}


.sort select {
  width: 100%;
  height:
      3.4vh;

  padding:
      0 1.8vw
      0 .7vw;

  border:
      1px solid
      rgba(82, 181, 230, .12);

  outline: none;

  appearance:
      none;

  background:
      rgba(4, 11, 21, .62);

  color:
      rgba(191, 207, 227, .6);

  font:
      inherit;

  font-size:
      .48vw;

  cursor:
      pointer;
}


.view-toggle {
  display: flex;

  gap:
      .35vw;
}


.view-toggle button {
  width:
      2vw;

  padding:
      0;

  display:
      grid;

  place-items:
      center;

  border:
      1px solid
      rgba(82, 184, 232, .12);

  font-size:
      .72vw;
}


.view-toggle button.active {
  color:
      #42d4ff;

  border-color:
      rgba(56, 207, 255, .42);

  background:
      rgba(34, 159, 208, .1);

  box-shadow:
      inset 0 0 10px
      rgba(55, 199, 255, .08),

      0 0 8px
      rgba(55, 199, 255, .06);
}


@media (
max-width:
    1200px
) {

  .filters {
    grid-template-columns:
      1fr
      auto
      auto;
  }

  .search {
    grid-column:
        1 / -1;
  }
}
</style>
