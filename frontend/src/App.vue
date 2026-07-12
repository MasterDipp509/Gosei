<script setup>
import {
  computed
} from 'vue'


import CouncilSidebar
  from '@/components/Sidebar.vue'


import {
  useProfileStore
} from '@/stores/profileStore.js'


/* ==================================================
   STORE
================================================== */

const profileStore =
    useProfileStore()


/* ==================================================
   AUTH STATE
================================================== */

const isAuthenticated =
    computed(
        () =>
            profileStore.isAuthenticated
    )
</script>


<template>
  <div
      class="council-shell"
      :class="{
      'is-authenticated':
        isAuthenticated,

      'is-guest':
        !isAuthenticated
    }"
  >

    <!-- ==================================================
         SIDEBAR

         Only exists for authenticated users.
    =================================================== -->

    <CouncilSidebar
        v-if="isAuthenticated"
        class="sidebar-slot"
    />


    <!-- ==================================================
         ROUTED PAGE AREA

         Authenticated:
         Uses the remaining space beside / above sidebar.

         Guest:
         Occupies the full viewport.
    =================================================== -->

    <main class="router-stage">
      <RouterView />
    </main>

  </div>
</template>


<style scoped>

/* ==================================================
   ROOT SHELL
================================================== */

.council-shell {
  /*
    This value matches the desktop sizing logic
    used by the sidebar.

    The parent is the source of truth for the
    actual layout width.
  */

  --sidebar-width:
      clamp(
          16rem,
          17vw,
          18rem
      );

  position: relative;

  display: grid;

  width: 100dvw;
  height: 100dvh;

  min-width: 0;
  min-height: 0;

  max-width: 100dvw;
  max-height: 100dvh;

  overflow: hidden;

  background: #050f1f;

  isolation: isolate;
}


/* ==================================================
   AUTHENTICATED LAYOUT
================================================== */

.council-shell.is-authenticated {
  grid-template-columns:
      var(--sidebar-width)
      minmax(0, 1fr);

  grid-template-rows:
      minmax(0, 1fr);

  grid-template-areas:
      "sidebar stage";
}


/* ==================================================
   GUEST LAYOUT

   No sidebar.
   Routed page gets the entire viewport.
================================================== */

.council-shell.is-guest {
  grid-template-columns:
      minmax(0, 1fr);

  grid-template-rows:
      minmax(0, 1fr);

  grid-template-areas:
      "stage";
}


/* ==================================================
   SIDEBAR SLOT
================================================== */

.sidebar-slot {
  grid-area: sidebar;

  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  max-width: 100%;
  max-height: 100%;

  z-index: 50;
}


/* ==================================================
   ROUTER STAGE
================================================== */

.router-stage {
  grid-area: stage;

  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  max-width: 100%;
  max-height: 100%;

  margin: 0;
  padding: 0;

  overflow: hidden;

  z-index: 1;

  background: #000000;
}


/* ==================================================
   ROUTED PAGE ROOT

   Prevents routed page roots from exceeding
   the router stage.
================================================== */

.router-stage > :deep(*) {
  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  max-width: 100%;
  max-height: 100%;

  margin: 0;

  overflow: hidden;

  box-sizing: border-box;
}


/* ==================================================
   DESKTOP — MATCH SIDEBAR BREAKPOINT
================================================== */

@media (
max-width: 1500px
) and (
min-width: 721px
) {

  .council-shell.is-authenticated {
    --sidebar-width: 16.75rem;
  }

}


/* ==================================================
   SMALL DESKTOP — MATCH SIDEBAR BREAKPOINT
================================================== */

@media (
max-width: 1200px
) and (
min-width: 721px
) {

  .council-shell.is-authenticated {
    --sidebar-width: 15.75rem;
  }

}


/* ==================================================
   MOBILE

   Authenticated:
   Sidebar becomes the bottom row.

   Guest:
   Remains a single full-screen routed stage.
================================================== */

@media (max-width: 720px) {

  .council-shell.is-authenticated {
    --mobile-sidebar-height:
        calc(
            9.2rem +
            env(safe-area-inset-bottom)
        );

    grid-template-columns:
        minmax(0, 1fr);

    grid-template-rows:
        minmax(0, 1fr)
        var(--mobile-sidebar-height);

    grid-template-areas:
        "stage"
        "sidebar";
  }


  .council-shell.is-guest {
    grid-template-columns:
        minmax(0, 1fr);

    grid-template-rows:
        minmax(0, 1fr);

    grid-template-areas:
        "stage";
  }


  .sidebar-slot {
    width: 100%;
    height: 100%;

    min-width: 0;
    min-height: 0;

    max-width: 100%;
    max-height: 100%;

    z-index: 50;
  }


  .router-stage {
    width: 100%;
    height: 100%;

    min-width: 0;
    min-height: 0;

    max-width: 100%;
    max-height: 100%;

    overflow: hidden;
  }

}


/* ==================================================
   SMALL MOBILE

   Matches Sidebar.vue's 8.8rem mobile height.
================================================== */

@media (max-width: 480px) {

  .council-shell.is-authenticated {
    --mobile-sidebar-height:
        calc(
            8.8rem +
            env(safe-area-inset-bottom)
        );
  }

}

</style>
