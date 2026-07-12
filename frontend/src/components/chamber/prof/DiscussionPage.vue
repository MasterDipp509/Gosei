<script setup>
import {
  computed,
  nextTick,
  ref
} from 'vue'


const props = defineProps({
  session: {
    type: Object,
    default: null
  },

  councilMode: {
    type: String,
    default: 'panel'
  },

  calibration: {
    type: Object,
    default: null
  },

  discussion: {
    type: Object,
    default: null
  }
})


const emit = defineEmits([
  'update-discussion',
  'end-session'
])


const composer = ref('')

const focusedMemberId = ref(null)

const messageFeed = ref(null)


const fallbackPanelMembers = [
  {
    id: 'strategy',
    name: 'Strategy',
    symbol: 'S'
  },

  {
    id: 'risk',
    name: 'Risk',
    symbol: 'R'
  },

  {
    id: 'operations',
    name: 'Operations',
    symbol: 'O'
  },

  {
    id: 'market',
    name: 'Market',
    symbol: 'M'
  },

  {
    id: 'challenge',
    name: 'Challenger',
    symbol: 'C'
  }
]


const fallbackMediator = [
  {
    id: 'mediator',
    name: 'Mediator',
    symbol: 'M'
  }
]


const councilMembers = computed(() => {
  const members =
      props.session?.councilMembers

  if (
      Array.isArray(members) &&
      members.length
  ) {
    return members
  }

  return props.councilMode ===
  'mediator'
      ? fallbackMediator
      : fallbackPanelMembers
})


const messages = computed(() =>
    Array.isArray(
        props.discussion?.messages
    )
        ? props.discussion.messages
        : []
)


const title = computed(() =>
    props.session?.title ??
    props.calibration?.topic ??
    'Untitled Discussion'
)


const objective = computed(() =>
    props.calibration?.objective ??
    props.session?.objective ??
    'Council discussion in progress.'
)


const focusedMember = computed(() =>
    councilMembers.value.find(
        member =>
            member.id ===
            focusedMemberId.value
    ) ??
    null
)


const composerLabel = computed(() => {
  if (focusedMember.value) {
    return `Addressing ${focusedMember.value.name}`
  }

  return props.councilMode ===
  'panel'
      ? 'Address the council'
      : 'Speak to the mediator'
})


const submitMessage = async () => {
  const content =
      composer.value.trim()

  if (!content) {
    return
  }

  const nextMessages = [
    ...messages.value,

    {
      id: `user-${Date.now()}`,

      role: 'user',

      content,

      addressedTo:
          focusedMember.value?.id ??
          null,

      createdAt:
          new Date().toISOString()
    }
  ]

  emit(
      'update-discussion',
      {
        messages: nextMessages,

        lastActivityAt:
            new Date().toISOString()
      }
  )

  composer.value = ''

  await nextTick()

  if (messageFeed.value) {
    messageFeed.value.scrollTo({
      top:
      messageFeed.value.scrollHeight,

      behavior: 'smooth'
    })
  }
}


const selectMember = member => {
  focusedMemberId.value =
      focusedMemberId.value ===
      member.id
          ? null
          : member.id
}


const formatTime = value => {
  if (!value) {
    return ''
  }

  const date =
      new Date(value)

  if (
      Number.isNaN(
          date.getTime()
      )
  ) {
    return ''
  }

  return date.toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit'
      }
  )
}
</script>


<template>
  <section class="discussion-page">

    <div class="room-grid"></div>

    <div class="room-lines">
      <span class="line left"></span>
      <span class="line right"></span>
    </div>


    <header class="discussion-header">

      <div class="session-heading">

        <span class="session-kicker">
          LIVE CHAMBER
        </span>

        <h1>
          {{ title }}
        </h1>

        <p>
          {{ objective }}
        </p>

      </div>


      <div class="session-actions">

        <span class="session-status">
          <span class="status-pulse"></span>
          ACTIVE
        </span>

        <button
            class="end-button"
            @click="$emit('end-session')"
        >
          End Session
        </button>

      </div>

    </header>


    <main
        class="chamber-layout"
        :class="{
        'mediator-layout':
          councilMode === 'mediator'
      }"
    >

      <section class="council-stage">

        <div
            v-if="
            councilMode === 'panel'
          "
            class="panel-council"
        >

          <button
              v-for="(
              member,
              index
            ) in councilMembers"
              :key="member.id"
              class="council-member"
              :class="[
              `seat-${index + 1}`,

              {
                focused:
                  focusedMemberId ===
                  member.id
              }
            ]"
              @click="
              selectMember(member)
            "
          >

            <div class="member-aura"></div>

            <div class="member-avatar">

              <svg
                  viewBox="0 0 120 140"
                  xmlns="http://www.w3.org/2000/svg"
              >

                <circle
                    class="avatar-head"
                    cx="60"
                    cy="38"
                    r="23"
                />

                <path
                    class="avatar-hair"
                    d="
                    M36 41
                    Q37 8 61 8
                    Q91 9 86 45
                    Q76 25 60 25
                    Q44 25 36 41
                    Z
                  "
                />

                <path
                    class="avatar-body"
                    d="
                    M22 132
                    Q25 72 60 72
                    Q95 72 98 132
                    Z
                  "
                />

                <path
                    class="avatar-collar"
                    d="
                    M43 78
                    L60 99
                    L77 78
                  "
                />

              </svg>

              <span class="member-symbol">
                {{
                  member.symbol ??
                  member.name?.[0]
                }}
              </span>

            </div>


            <span class="member-name">
              {{ member.name }}
            </span>

            <span class="member-state">
              Listening
            </span>

          </button>


          <div class="panel-table">

            <svg
                viewBox="0 0 1000 320"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >

              <path
                  class="table-main"
                  d="
                  M60 250
                  Q500 -20 940 250
                  L870 316
                  Q500 112 130 316
                  Z
                "
              />

              <path
                  class="table-trim"
                  d="
                  M96 266
                  Q500 40 904 266
                "
              />

              <ellipse
                  class="table-core"
                  cx="500"
                  cy="218"
                  rx="70"
                  ry="31"
              />

            </svg>

          </div>

        </div>


        <div
            v-else
            class="mediator-stage"
        >

          <button
              v-for="member in councilMembers"
              :key="member.id"
              class="mediator-member"
              :class="{
              focused:
                focusedMemberId ===
                member.id
            }"
              @click="
              selectMember(member)
            "
          >

            <div class="mediator-ring ring-one"></div>
            <div class="mediator-ring ring-two"></div>

            <div class="mediator-avatar">

              <svg
                  viewBox="0 0 140 170"
                  xmlns="http://www.w3.org/2000/svg"
              >

                <circle
                    class="avatar-head"
                    cx="70"
                    cy="45"
                    r="28"
                />

                <path
                    class="avatar-hair"
                    d="
                    M40 48
                    Q42 8 70 8
                    Q106 12 99 54
                    Q88 29 69 29
                    Q51 29 40 48
                  "
                />

                <path
                    class="avatar-body"
                    d="
                    M22 165
                    Q28 84 70 84
                    Q112 84 118 165
                    Z
                  "
                />

                <path
                    class="avatar-collar"
                    d="
                    M50 91
                    L70 116
                    L90 91
                  "
                />

              </svg>

            </div>


            <span class="member-name">
              {{ member.name }}
            </span>

          </button>


          <div class="mediator-table">

            <svg
                viewBox="0 0 800 280"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >

              <path
                  class="table-main"
                  d="
                  M72 210
                  Q400 36 728 210
                  L670 272
                  Q400 150 130 272
                  Z
                "
              />

              <path
                  class="table-trim"
                  d="
                  M110 222
                  Q400 88 690 222
                "
              />

            </svg>

          </div>

        </div>

      </section>


      <section class="discussion-console">

        <div class="console-header">

          <div>

            <span class="console-kicker">
              DISCUSSION LOG
            </span>

            <h2>
              Council Transcript
            </h2>

          </div>


          <span class="message-count">
            {{ messages.length }}
            messages
          </span>

        </div>


        <div
            ref="messageFeed"
            class="message-feed"
        >

          <div
              v-if="!messages.length"
              class="empty-discussion"
          >

            <div class="empty-glyph">

              <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
              >

                <circle
                    cx="50"
                    cy="50"
                    r="34"
                />

                <path
                    d="
                    M30 45
                    H70

                    M30 56
                    H60
                  "
                />

              </svg>

            </div>

            <h3>
              The Chamber is listening.
            </h3>

            <p>
              Present the issue, challenge or
              decision you want the council to
              examine.
            </p>

          </div>


          <article
              v-for="message in messages"
              :key="message.id"
              class="message"
              :class="{
              user:
                message.role === 'user',

              council:
                message.role !== 'user'
            }"
          >

            <div class="message-meta">

              <span class="message-author">
                {{
                  message.role === 'user'
                      ? 'YOU'
                      : message.author ??
                      'COUNCIL'
                }}
              </span>

              <span class="message-time">
                {{
                  formatTime(
                      message.createdAt
                  )
                }}
              </span>

            </div>


            <p>
              {{ message.content }}
            </p>

          </article>

        </div>


        <div class="composer-area">

          <div class="composer-context">

            <span>
              {{ composerLabel }}
            </span>

            <button
                v-if="focusedMember"
                @click="
                focusedMemberId = null
              "
            >
              Address all
            </button>

          </div>


          <div class="composer-shell">

            <textarea
                v-model="composer"
                rows="1"
                placeholder="Speak before the council..."
                @keydown.enter.exact.prevent="
                submitMessage
              "
            ></textarea>


            <button
                class="send-button"
                :disabled="!composer.trim()"
                @click="submitMessage"
            >

              <svg
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
              >

                <path
                    d="
                    M4 12
                    L20 4
                    L15 20
                    L11 13
                    Z
                  "
                />

              </svg>

            </button>

          </div>

        </div>

      </section>

    </main>

  </section>
</template>


<style scoped>
.discussion-page {
  --blue: #4bc8ff;
  --blue-bright: #a5edff;
  --purple: #9f62ff;
  --purple-bright: #d0a7ff;
  --black: #010104;
  --panel: rgba(4, 6, 13, 0.94);
  --text: #eff8ff;
  --soft: #91a6bd;
  --dim: #56657a;

  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  display: flex;
  flex-direction: column;

  background: var(--black);

  color: var(--text);

  overflow: hidden;
}


.room-grid {
  position: absolute;

  inset: 0;

  opacity: 0.12;

  background-image:
      linear-gradient(
          rgba(75, 200, 255, 0.11) 1px,
          transparent 1px
      ),
      linear-gradient(
          90deg,
          rgba(75, 200, 255, 0.11) 1px,
          transparent 1px
      );

  background-size:
      5rem 5rem;

  mask-image:
      linear-gradient(
          to bottom,
          transparent,
          black 20%,
          black 78%,
          transparent
      );
}


.room-lines .line {
  position: absolute;

  top: 0;
  bottom: 0;

  width: 1px;

  background:
      rgba(75, 200, 255, 0.13);
}


.room-lines .left {
  left: 4%;
}


.room-lines .right {
  right: 4%;
}


.discussion-header {
  position: relative;

  z-index: 4;

  flex: 0 0 auto;

  min-height: 6.3rem;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 2rem;

  padding:
      1rem
      clamp(1.5rem, 3vw, 3.5rem);

  border-bottom:
      1px solid
      rgba(75, 200, 255, 0.14);

  background:
      rgba(1, 1, 4, 0.88);
}


.session-heading {
  min-width: 0;
}


.session-kicker,
.console-kicker {
  display: block;

  margin-bottom: 0.35rem;

  color: var(--blue);

  font-size: 0.62rem;
  font-weight: 900;

  letter-spacing: 0.22em;
}


.session-heading h1 {
  margin: 0;

  max-width: 50rem;

  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  font-size:
      clamp(1.2rem, 2vw, 2rem);
}


.session-heading p {
  margin: 0.4rem 0 0;

  color: var(--soft);

  font-size: 0.78rem;
}


.session-actions {
  flex: 0 0 auto;

  display: flex;
  align-items: center;

  gap: 1rem;
}


.session-status {
  display: flex;
  align-items: center;

  gap: 0.5rem;

  color: var(--soft);

  font-size: 0.65rem;
  font-weight: 900;

  letter-spacing: 0.12em;
}


.status-pulse {
  width: 0.45rem;
  height: 0.45rem;

  border-radius: 50%;

  background: var(--blue);

  box-shadow:
      0 0 0.8rem
      var(--blue);
}


.end-button {
  padding:
      0.7rem 1rem;

  border:
      1px solid
      rgba(159, 98, 255, 0.35);

  background: transparent;

  color: var(--purple-bright);

  cursor: pointer;

  transition:
      border-color 200ms ease,
      background 200ms ease;
}


.end-button:hover {
  border-color:
      var(--purple);

  background:
      rgba(159, 98, 255, 0.08);
}


.chamber-layout {
  position: relative;

  z-index: 2;

  flex: 1;

  min-width: 0;
  min-height: 0;

  display: grid;

  grid-template-columns:
      minmax(0, 1.25fr)
      minmax(25rem, 0.75fr);

  gap: 1rem;

  padding:
      1rem
      clamp(1rem, 2vw, 2rem)
      1.5rem;
}


.council-stage {
  position: relative;

  min-width: 0;
  min-height: 0;

  border:
      1px solid
      rgba(75, 200, 255, 0.1);

  background:
      rgba(3, 4, 10, 0.58);

  overflow: hidden;
}


.council-stage::before {
  content: '';

  position: absolute;

  left: 10%;
  right: 10%;
  top: 5%;

  height: 1px;

  background:
      rgba(75, 200, 255, 0.16);
}


.panel-council {
  position: relative;

  width: 100%;
  height: 100%;
}


.council-member {
  position: absolute;

  z-index: 4;

  width:
      clamp(7rem, 11vw, 10rem);

  padding: 0;

  border: 0;

  background: transparent;

  color: var(--text);

  cursor: pointer;

  text-align: center;

  transition:
      transform 240ms ease;
}


.council-member:hover,
.council-member.focused {
  transform:
      translateY(-0.45rem);
}


.seat-1 {
  left: 4%;
  top: 37%;
}


.seat-2 {
  left: 20%;
  top: 18%;
}


.seat-3 {
  left: 50%;
  top: 8%;

  transform:
      translateX(-50%);
}


.seat-3:hover,
.seat-3.focused {
  transform:
      translateX(-50%)
      translateY(-0.45rem);
}


.seat-4 {
  right: 20%;
  top: 18%;
}


.seat-5 {
  right: 4%;
  top: 37%;
}


.member-aura {
  position: absolute;

  left: 50%;
  top: 2rem;

  width: 5rem;
  height: 5rem;

  transform:
      translateX(-50%);

  border-radius: 50%;

  border:
      1px solid
      rgba(75, 200, 255, 0.16);

  opacity: 0;

  transition:
      opacity 200ms ease,
      transform 200ms ease;
}


.council-member:hover
.member-aura,
.council-member.focused
.member-aura {
  opacity: 1;

  transform:
      translateX(-50%)
      scale(1.3);
}


.member-avatar {
  position: relative;

  width:
      clamp(5rem, 8vw, 7rem);

  height:
      clamp(6rem, 10vw, 8.5rem);

  margin: 0 auto;
}


.member-avatar svg,
.mediator-avatar svg {
  width: 100%;
  height: 100%;
}


.avatar-head {
  fill:
      rgba(75, 200, 255, 0.09);

  stroke: var(--blue);

  stroke-width: 2;
}


.avatar-hair {
  fill:
      rgba(159, 98, 255, 0.22);

  stroke: var(--purple);

  stroke-width: 2;
}


.avatar-body {
  fill:
      rgba(4, 7, 18, 0.95);

  stroke: var(--blue);

  stroke-width: 2;
}


.avatar-collar {
  fill: none;

  stroke: var(--purple-bright);

  stroke-width: 2;
}


.member-symbol {
  position: absolute;

  left: 50%;
  bottom: 0.4rem;

  transform:
      translateX(-50%);

  color: var(--blue);

  font-size: 0.62rem;
  font-weight: 900;
}


.member-name {
  display: block;

  margin-top: 0.35rem;

  font-size: 0.75rem;
  font-weight: 700;
}


.member-state {
  display: block;

  margin-top: 0.2rem;

  color: var(--dim);

  font-size: 0.58rem;

  letter-spacing: 0.08em;
}


.panel-table {
  position: absolute;

  z-index: 3;

  left: 1%;
  right: 1%;
  bottom: 2%;

  height: 49%;
}


.panel-table svg,
.mediator-table svg {
  width: 100%;
  height: 100%;
}


.table-main {
  fill:
      rgba(4, 8, 18, 0.97);

  stroke:
      rgba(75, 200, 255, 0.62);

  stroke-width: 2;
}


.table-trim {
  fill: none;

  stroke:
      rgba(159, 98, 255, 0.7);

  stroke-width: 2;
}


.table-core {
  fill:
      rgba(75, 200, 255, 0.07);

  stroke: var(--blue);

  stroke-width: 2;
}


.mediator-stage {
  position: relative;

  width: 100%;
  height: 100%;

  display: flex;
  align-items: flex-start;
  justify-content: center;

  padding-top: 8%;

  box-sizing: border-box;
}


.mediator-member {
  position: relative;

  z-index: 4;

  width: 12rem;

  padding: 0;

  background: transparent;

  border: 0;

  color: var(--text);

  cursor: pointer;
}


.mediator-avatar {
  position: relative;

  width: 8rem;
  height: 10rem;

  margin: auto;
}


.mediator-ring {
  position: absolute;

  left: 50%;
  top: 4rem;

  transform:
      translate(-50%, -50%);

  border-radius: 50%;

  border:
      1px solid
      rgba(75, 200, 255, 0.24);

  pointer-events: none;
}


.ring-one {
  width: 8rem;
  height: 8rem;
}


.ring-two {
  width: 11rem;
  height: 11rem;

  opacity: 0.45;
}


.mediator-member.focused
.mediator-ring {
  border-color: var(--blue);

  box-shadow:
      0 0 1.4rem
      rgba(75, 200, 255, 0.2);
}


.mediator-table {
  position: absolute;

  left: 7%;
  right: 7%;
  bottom: 3%;

  height: 48%;
}


.discussion-console {
  min-width: 0;
  min-height: 0;

  display: flex;
  flex-direction: column;

  background: var(--panel);

  border:
      1px solid
      rgba(159, 98, 255, 0.14);
}


.console-header {
  flex: 0 0 auto;

  min-height: 4.7rem;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 1rem;

  padding:
      0.9rem 1.1rem;

  border-bottom:
      1px solid
      rgba(255, 255, 255, 0.06);
}


.console-header h2 {
  margin: 0;

  font-size: 1rem;
}


.message-count {
  color: var(--dim);

  font-size: 0.68rem;
}


.message-feed {
  flex: 1;

  min-height: 0;

  overflow-y: auto;

  padding: 1rem;

  scrollbar-width: thin;

  scrollbar-color:
      rgba(75, 200, 255, 0.25)
      transparent;
}


.empty-discussion {
  min-height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 2rem;

  text-align: center;
}


.empty-glyph {
  width: 4rem;
  height: 4rem;

  margin-bottom: 1rem;
}


.empty-glyph svg {
  width: 100%;
  height: 100%;

  fill: none;

  stroke: var(--blue);

  stroke-width: 2;

  opacity: 0.6;
}


.empty-discussion h3 {
  margin: 0;

  font-size: 1rem;
}


.empty-discussion p {
  max-width: 22rem;

  margin:
      0.6rem 0 0;

  color: var(--soft);

  font-size: 0.78rem;

  line-height: 1.6;
}


.message {
  max-width: 88%;

  margin-bottom: 1rem;

  padding:
      0.8rem 0.9rem;

  border:
      1px solid
      rgba(255, 255, 255, 0.06);

  background:
      rgba(255, 255, 255, 0.025);
}


.message.user {
  margin-left: auto;

  border-color:
      rgba(75, 200, 255, 0.2);
}


.message.council {
  margin-right: auto;

  border-color:
      rgba(159, 98, 255, 0.2);
}


.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 1rem;

  margin-bottom: 0.45rem;
}


.message-author {
  color: var(--blue);

  font-size: 0.58rem;
  font-weight: 900;

  letter-spacing: 0.12em;
}


.message.council
.message-author {
  color: var(--purple-bright);
}


.message-time {
  color: var(--dim);

  font-size: 0.58rem;
}


.message p {
  margin: 0;

  color: #d8e6f2;

  font-size: 0.78rem;

  line-height: 1.65;
}


.composer-area {
  flex: 0 0 auto;

  padding:
      0.8rem 0.9rem 0.9rem;

  border-top:
      1px solid
      rgba(255, 255, 255, 0.06);
}


.composer-context {
  min-height: 1.5rem;

  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 0.35rem;

  color: var(--soft);

  font-size: 0.64rem;
}


.composer-context button {
  padding: 0;

  border: 0;

  background: transparent;

  color: var(--blue);

  font-size: inherit;

  cursor: pointer;
}


.composer-shell {
  min-height: 3.5rem;

  display: grid;

  grid-template-columns:
      minmax(0, 1fr)
      auto;

  align-items: center;

  gap: 0.6rem;

  padding:
      0.5rem 0.55rem
      0.5rem 0.8rem;

  border:
      1px solid
      rgba(75, 200, 255, 0.18);

  background:
      rgba(0, 0, 0, 0.34);
}


.composer-shell textarea {
  width: 100%;

  max-height: 8rem;

  resize: none;

  border: 0;
  outline: none;

  background: transparent;

  color: var(--text);

  font: inherit;

  font-size: 0.78rem;
}


.composer-shell textarea::placeholder {
  color: var(--dim);
}


.send-button {
  width: 2.7rem;
  height: 2.7rem;

  display: grid;
  place-items: center;

  border:
      1px solid
      rgba(75, 200, 255, 0.34);

  background:
      rgba(75, 200, 255, 0.08);

  cursor: pointer;

  transition:
      background 180ms ease,
      border-color 180ms ease;
}


.send-button:disabled {
  opacity: 0.3;

  cursor: default;
}


.send-button:not(:disabled):hover {
  background:
      rgba(75, 200, 255, 0.16);

  border-color: var(--blue);
}


.send-button svg {
  width: 1.2rem;
  height: 1.2rem;

  fill: none;

  stroke: var(--blue);

  stroke-width: 1.8;

  stroke-linejoin: round;
}


@media (max-width: 1100px) {
  .chamber-layout {
    grid-template-columns:
        minmax(0, 1fr)
        minmax(22rem, 0.78fr);
  }


  .seat-1 {
    left: 1%;
  }


  .seat-5 {
    right: 1%;
  }
}


@media (max-width: 860px) {
  .discussion-page {
    overflow-y: auto;
  }


  .discussion-header {
    align-items: flex-start;
  }


  .chamber-layout {
    flex: none;

    grid-template-columns: 1fr;

    height: auto;
  }


  .council-stage {
    height: 31rem;
  }


  .discussion-console {
    min-height: 36rem;
  }
}
</style>
