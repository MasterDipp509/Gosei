<script setup>
import {
  computed,
  watch
} from 'vue'

import {
  useRoute
} from 'vue-router'

import {
  useChamberStore
} from '@/stores/chamber.js'

import {
  useProfileStore
} from '@/stores/profileStore.js'


/* ==================================================
   PROPS
================================================== */

const props = defineProps({

  selectionComponent: {
    type: [Object, Function],
    required: true
  },


  panelCalibrationComponent: {
    type: [Object, Function],
    required: true
  },


  mediatorCalibrationComponent: {
    type: [Object, Function],
    required: true
  },


  /*
    Full council / panel discussion page.
  */

  discussionComponent: {
    type: [Object, Function],
    required: true
  },


  /*
    Mediator-only / solo discussion page.
  */

  soloDiscussionComponent: {
    type: [Object, Function],
    required: true
  }
})


/* ==================================================
   ROUTE / STORES
================================================== */

const route =
    useRoute()


const chamber =
    useChamberStore()


const profileStore =
    useProfileStore()


/* ==================================================
   ACTIVE CALIBRATION COMPONENT
================================================== */

/*
  PANEL FLOW
  ----------

  Selection
      ↓
  PanelCalibrationPage


  MEDIATOR FLOW
  -------------

  Selection
      ↓
  MediatorCalibrationPage
*/

const calibrationComponent =
    computed(() => {

      if (
          chamber.councilMode ===
          'panel'
      ) {
        return props.panelCalibrationComponent
      }


      return props.mediatorCalibrationComponent
    })


/* ==================================================
   ACTIVE DISCUSSION COMPONENT
================================================== */

/*
  PANEL
  -----

  PanelCalibrationPage
      ↓
  completeCalibration()
      ↓
  DiscussionPage


  MEDIATOR
  --------

  MediatorCalibrationPage
      ↓
  completeCalibration()
      ↓
  SoloDiscussionPage
*/

const discussionComponent =
    computed(() => {

      if (
          chamber.councilMode ===
          'panel'
      ) {
        return props.discussionComponent
      }


      return props.soloDiscussionComponent
    })


/* ==================================================
   ACTIVE COMPONENT
================================================== */

const currentComponent =
    computed(() => {

      switch (
          chamber.phase
          ) {

        case 'selection':

          return props.selectionComponent


        case 'calibration':

          return calibrationComponent.value


        case 'discussion':

          return discussionComponent.value


        default:

          return props.selectionComponent
      }
    })


/* ==================================================
   COMPONENT KEY
================================================== */

/*
  Council mode is included in calibration
  and discussion component keys.

  This prevents Vue from reusing the wrong
  component instance when switching between:

    panel
    mediator
*/

const currentComponentKey =
    computed(() => {

      if (
          chamber.phase ===
          'calibration'
      ) {
        return (
            `calibration-` +
            `${chamber.councilMode}`
        )
      }


      if (
          chamber.phase ===
          'discussion'
      ) {
        return (
            `discussion-` +
            `${chamber.councilMode}`
        )
      }


      return chamber.phase
    })


/* ==================================================
   COMPONENT PROPS
================================================== */

const currentProps =
    computed(() => {

      /*
        SELECTION PAGE

        We no longer expose the old:

          Continue Session
          Start New Session

        entry step.

        The selection page is forced directly
        onto the council-mode selection state:

          Panel
          Mediator / Solo
      */

      if (
          chamber.phase ===
          'selection'
      ) {
        return {

          step:
              'mode',

          activeSession:
          chamber.activeSession
        }
      }


      /*
        CALIBRATION

        Both calibration pages receive the same
        core information.

        The active calibration component is chosen
        from chamber.councilMode.
      */

      if (
          chamber.phase ===
          'calibration'
      ) {
        return {

          session:
          chamber.activeSession,

          councilMode:
          chamber.councilMode,

          existingCalibration:
          chamber.calibration
        }
      }


      /*
        DISCUSSION

        Both discussion types receive the same
        core session state.

        panel:
          DiscussionPage

        mediator:
          SoloDiscussionPage
      */

      if (
          chamber.phase ===
          'discussion'
      ) {
        return {

          session:
          chamber.activeSession,

          councilMode:
          chamber.councilMode,

          calibration:
          chamber.calibration,

          discussion:
          chamber.discussion
        }
      }


      return {}
    })


/* ==================================================
   PARTICIPANT NORMALIZATION
================================================== */

const normalizePersonality = value => {

  if (
      typeof value ===
      'string'
  ) {
    return value
  }


  if (
      Array.isArray(value)
  ) {
    return value.filter(
        item =>
            typeof item ===
            'string'
    )
  }


  return []
}


const normalizeFocusAreas = participant => {

  const value =
      participant?.focusAreas ??
      participant?.focus_areas ??
      participant?.expertise ??
      []


  if (
      !Array.isArray(value)
  ) {
    return []
  }


  return value
      .filter(
          item =>
              typeof item ===
              'string'
      )
      .map(
          item =>
              item.trim()
      )
      .filter(Boolean)
}


const normalizeParticipant = (
    participant,
    fallbackRole
) => {

  if (!participant?.id) {
    return null
  }


  return {

    id:
        String(
            participant.id
        ),


    name:
        participant.name ??
        String(
            participant.id
        ),


    role:
        participant.role ??
        fallbackRole,


    description:
        participant.description ??
        '',


    personality:
        normalizePersonality(
            participant.personality ??
            participant.persona
        ),


    debateStyle:
        participant.debateStyle ??
        participant.debate_style ??
        '',


    focusAreas:
        normalizeFocusAreas(
            participant
        )
  }
}


/* ==================================================
   BUILD CALIBRATION
================================================== */

const buildCalibration = payload => {

  const source =
      payload?.calibration ??
      payload ??
      {}


  return {

    topic:
        source.topic ??
        '',


    objective:
        source.objective ??
        '',


    objectiveId:
        source.objectiveId ??
        '',


    context:
        source.context ??
        '',


    approach:
        source.approach ??
        'balanced',


    councilMode:
        source.councilMode ??
        chamber.councilMode,


    desiredOutcome:
        source.desiredOutcome ??
        '',


    constraints:
        Array.isArray(
            source.constraints
        )
            ? source.constraints
            : [],


    assumptions:
        Array.isArray(
            source.assumptions
        )
            ? source.assumptions
            : [],


    questions:
        Array.isArray(
            source.questions
        )
            ? source.questions
            : [],


    additionalNotes:
        source.additionalNotes ??
        ''
  }
}


/* ==================================================
   BUILD SESSION REQUEST
================================================== */

const buildSessionPayload =
    emittedPayload => {

      const calibration =
          buildCalibration(
              emittedPayload
          )


      /*
        Council mode should have already been
        selected on SelectionPage.

        Values:

          panel
          mediator
      */

      const mode =
          emittedPayload?.mode ??
          calibration.councilMode ??
          chamber.councilMode ??
          'panel'


      const profilePanel =
          profileStore.councilMembers ??
          profileStore.panel ??
          []


      const profileMediator =
          profileStore.councilMediator ??
          profileStore.mediator ??
          null


      /*
        Panel mode sends council members.

        Mediator mode sends:

          panelMembers: []

        and the configured mediator.
      */

      const panelMembers =
          Array.isArray(
              emittedPayload?.panelMembers
          )
              ? emittedPayload.panelMembers

              : mode === 'panel'
                  ? profilePanel
                  : []


      const mediator =
          emittedPayload?.mediator ??
          profileMediator


      return {

        mode,


        title:
            emittedPayload?.title ??
            calibration.topic
                .slice(
                    0,
                    255
                ),


        calibration,


        panelMembers:
            panelMembers
                .map(
                    member =>
                        normalizeParticipant(
                            member,
                            'Council Member'
                        )
                )
                .filter(Boolean),


        mediator:
            normalizeParticipant(
                mediator,
                'Mediator'
            )
      }
    }


/* ==================================================
   SELECTION EVENTS
================================================== */

/*
  The old entry stage has been removed.

  Selection now does only this:

    Panel
        ↓
    Panel Calibration


    Mediator
        ↓
    Mediator Calibration
*/

const handleStartSession = mode => {

  console.log(
      '[ChamberFlow] Starting mode:',
      mode
  )


  chamber.beginNewSession(
      mode
  )
}


/* ==================================================
   CALIBRATION EVENTS
================================================== */

const handleCalibrationComplete =
    async emittedPayload => {

      console.log(
          '[ChamberFlow] Calibration event:',
          emittedPayload
      )


      const calibration =
          buildCalibration(
              emittedPayload
          )


      const sessionPayload =
          buildSessionPayload(
              emittedPayload
          )


      console.log(
          '[ChamberFlow] Calibration:',
          calibration
      )


      console.log(
          '[ChamberFlow] Session payload:',
          sessionPayload
      )


      /*
        Store transition:

          calibration
              ↓
          discussion

        ChamberFlow then selects:

          panel
              ↓
          DiscussionPage


          mediator
              ↓
          SoloDiscussionPage
      */

      await chamber.completeCalibration(
          calibration,
          sessionPayload
      )
    }


const handleCalibrationBack = () => {

  chamber.returnFromCalibration()
}


/* ==================================================
   DISCUSSION EVENTS
================================================== */

const handleDiscussionUpdate =
    discussion => {

      chamber.updateDiscussion(
          discussion
      )
    }


const handleEndSession = () => {

  chamber.endSession()
}


/* ==================================================
   ROUTE SESSION HANDLING
================================================== */

/*
  Direct session routes still work.

  Example:

    ?session=<session-id>

  This allows archive/session pages to open an
  existing discussion directly without bringing
  back the removed continue/start entry screen.
*/

watch(

    () => [
      route.query.session,
      chamber.resumableSessions.length
    ],


    ([sessionId]) => {

      if (!sessionId) {
        return
      }


      if (
          String(
              chamber.activeSession?.id
          ) ===
          String(sessionId)
      ) {
        return
      }


      chamber.continueSession(
          String(sessionId)
      )
    },


    {
      immediate: true
    }
)
</script>


<template>
  <main class="chamber-flow">

    <div class="chamber-stage">

      <div class="chamber-stage__layer">

        <component
            :is="currentComponent"
            :key="currentComponentKey"

            v-bind="currentProps"

            @start-session="
              handleStartSession
            "

            @complete="
              handleCalibrationComplete
            "

            @back="
              handleCalibrationBack
            "

            @update-discussion="
              handleDiscussionUpdate
            "

            @end-session="
              handleEndSession
            "
        />

      </div>

    </div>

  </main>
</template>


<style scoped>
.chamber-flow {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;
}


.chamber-stage {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  isolation: isolate;
}


.chamber-stage__layer {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;
}
</style>
