<script setup>
import {
  computed
} from 'vue'


const props =
    defineProps({

      sessions: {
        type: Array,
        default: () => []
      },

      selectedId: {
        type: [
          String,
          Number
        ],
        default: null
      },

      maxVisible: {
        type: Number,
        default: 3
      }
    })


const emit =
    defineEmits([
      'select',
      'pin'
    ])


const pinnedSessions =
    computed(() =>

        props.sessions.filter(
            session =>
                session.pinned === true
                ||
                session.isPinned === true
        )
    )


function titleOf(
    session
) {

  return (
      session.title
      ??
      session.calibration?.topic
      ??
      'Untitled Session'
  )
}


function modeOf(
    session
) {

  return (
      session.mode
      ??
      session.calibration?.councilMode
      ??
      'panel'
  )
}


function metaOf(
    session
) {

  if (
      session.status ===
      'active'
  ) {

    return 'Active'
  }


  if (
      session.currentRound
  ) {

    return `Round ${session.currentRound}`
  }


  return 'Completed'
}


function timeOf(
    session
) {

  const value =
      session.updatedAt
      ??
      session.createdAt


  if (!value) {

    return '—'
  }


  return new Date(
      value
  )
      .toLocaleTimeString(
          [],
          {
            hour:
                '2-digit',

            minute:
                '2-digit'
          }
      )
}
</script>


<template>
  <section class="pinned">
    <header class="pinned-head">
      <div class="label">
        <span class="pin-icon">
          ⚑
        </span>

        <span>
          PINNED / IMPORTANT
        </span>
      </div>

      <span class="results">
        {{ sessions.length }} results
      </span>
    </header>


    <div class="pinned-track">
      <button
          v-for="session in pinnedSessions"
          :key="session.id"
          type="button"
          class="pinned-card"
          :class="{
          selected:
            String(selectedId) ===
            String(session.id),

          mediator:
            modeOf(session) ===
            'mediator'
        }"
          @click="
          emit(
            'select',
            session.id
          )
        "
      >
        <span class="card-icon">
          {{
            modeOf(session) ===
            'mediator'
                ? '✦'
                : '♙'
          }}
        </span>


        <span class="card-content">
          <strong>
            {{
              titleOf(
                  session
              )
            }}
          </strong>

          <span class="card-meta">
            <i
                class="mode-tag"
                :class="
                modeOf(
                  session
                )
              "
            >
              {{
                modeOf(session) ===
                'mediator'
                    ? 'Mediator'
                    : 'Panel'
              }}
            </i>

            <span>
              {{
                metaOf(
                    session
                )
              }}
            </span>

            <span>
              ◷
              {{
                timeOf(
                    session
                )
              }}
            </span>
          </span>
        </span>


        <span class="card-pin">
          ◆
        </span>
      </button>


      <button
          type="button"
          class="add-pin"
          @click="
          emit(
            'pin'
          )
        "
      >
        <span class="plus">
          +
        </span>

        <span>
          Pin Session
        </span>
      </button>
    </div>
  </section>
</template>


<style scoped>
.pinned {
  width: 100%;
  min-width: 0;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  padding:
      .7vh .7vw;

  border:
      1px solid
      rgba(89, 198, 255, .08);

  background:
      linear-gradient(
          180deg,
          rgba(3, 10, 20, .88),
          rgba(2, 7, 15, .78)
      );
}


.pinned-head {
  height:
      2.1vh;

  flex: 0 0 auto;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding:
      0 .15vw;
}


.label {
  display: flex;
  align-items: center;

  gap:
      .3vw;

  font-size:
      .45vw;

  letter-spacing:
      .07em;

  color:
      rgba(164, 182, 208, .48);
}


.pin-icon {
  color:
      #a45cff;

  font-size:
      .48vw;
}


.results {
  font-size:
      .43vw;

  color:
      rgba(156, 178, 204, .4);
}


.pinned-track {
  flex: 1;

  min-width: 0;

  display: flex;

  gap:
      .45vw;

  overflow-x: auto;
  overflow-y: hidden;

  padding:
      .25vh 0;

  scrollbar-width:
      thin;

  scrollbar-color:
      rgba(126, 76, 221, .22)
      transparent;
}


.pinned-card {
  position: relative;

  flex:
      0 0
      clamp(
          220px,
          20vw,
          330px
      );

  min-width: 0;

  display: grid;

  grid-template-columns:
    1.55vw
    minmax(0, 1fr)
    .8vw;

  align-items: center;

  gap:
      .55vw;

  padding:
      .55vh .55vw;

  border:
      1px solid
      rgba(166, 77, 255, .28);

  background:
      linear-gradient(
          110deg,
          rgba(111, 49, 181, .1),
          rgba(4, 12, 23, .62)
      );

  color:
      inherit;

  text-align:
      left;

  cursor:
      pointer;

  transition:
      border-color .18s ease,
      background .18s ease,
      box-shadow .18s ease;
}


.pinned-card:hover,
.pinned-card.selected {
  border-color:
      rgba(181, 85, 255, .65);

  background:
      linear-gradient(
          110deg,
          rgba(119, 51, 198, .17),
          rgba(6, 17, 31, .7)
      );

  box-shadow:
      inset 0 0 14px
      rgba(137, 57, 239, .06),

      0 0 12px
      rgba(130, 48, 237, .08);
}


.pinned-card.mediator {
  border-color:
      rgba(49, 199, 255, .28);

  background:
      linear-gradient(
          110deg,
          rgba(19, 118, 168, .09),
          rgba(4, 12, 23, .62)
      );
}


.pinned-card.mediator:hover,
.pinned-card.mediator.selected {
  border-color:
      rgba(58, 208, 255, .58);

  background:
      linear-gradient(
          110deg,
          rgba(22, 142, 194, .14),
          rgba(5, 17, 30, .7)
      );
}


.card-icon {
  width:
      1.55vw;

  aspect-ratio:
      1;

  display:
      grid;

  place-items:
      center;

  border:
      1px solid
      rgba(167, 83, 255, .28);

  color:
      #ad62ff;

  background:
      rgba(129, 52, 210, .07);

  font-size:
      .48vw;
}


.pinned-card.mediator
.card-icon {
  color:
      #42d5ff;

  border-color:
      rgba(64, 211, 255, .3);

  background:
      rgba(38, 174, 226, .06);
}


.card-content {
  min-width: 0;

  display: flex;
  flex-direction: column;

  gap:
      .38vh;
}


.card-content strong {
  overflow:
      hidden;

  white-space:
      nowrap;

  text-overflow:
      ellipsis;

  font-family:
      Georgia,
      serif;

  font-size:
      .57vw;

  font-weight:
      400;

  color:
      rgba(228, 236, 249, .85);
}


.card-meta {
  display: flex;
  align-items: center;

  gap:
      .4vw;

  min-width: 0;

  font-size:
      .4vw;

  color:
      rgba(158, 179, 204, .44);
}


.mode-tag {
  padding:
      .17vh .3vw;

  border:
      1px solid
      rgba(168, 83, 255, .24);

  color:
      #ad66ff;

  background:
      rgba(118, 46, 197, .06);

  font-style:
      normal;

  font-size:
      .38vw;
}


.mode-tag.mediator {
  border-color:
      rgba(58, 206, 255, .26);

  color:
      #42d3ff;

  background:
      rgba(31, 161, 209, .06);
}


.card-pin {
  align-self:
      start;

  color:
      #a15cff;

  font-size:
      .47vw;

  text-shadow:
      0 0 7px
      rgba(161, 92, 255, .6);
}


.pinned-card.mediator
.card-pin {
  color:
      #40d4ff;

  text-shadow:
      0 0 7px
      rgba(64, 212, 255, .55);
}


.add-pin {
  flex:
      0 0
      clamp(
          180px,
          16vw,
          260px
      );

  display: flex;
  align-items: center;

  gap:
      .55vw;

  padding:
      0 .8vw;

  border:
      1px dashed
      rgba(76, 192, 242, .16);

  background:
      rgba(4, 12, 21, .34);

  color:
      rgba(169, 190, 214, .48);

  font: inherit;

  font-size:
      .48vw;

  cursor:
      pointer;

  transition:
      border-color .18s ease,
      color .18s ease,
      background .18s ease;
}


.add-pin:hover {
  border-color:
      rgba(71, 206, 255, .35);

  color:
      rgba(212, 230, 247, .8);

  background:
      rgba(15, 68, 91, .08);
}


.plus {
  width:
      1.45vw;

  aspect-ratio:
      1;

  display:
      grid;

  place-items:
      center;

  border:
      1px solid
      rgba(59, 204, 255, .26);

  border-radius:
      50%;

  color:
      #40d3ff;

  font-size:
      .72vw;
}
</style>
