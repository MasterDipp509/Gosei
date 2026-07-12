<template>
  <div
      class="container"
      :class="{
        'anime-entering':
          pageEntering
      }"
  >

    <!-- ==================================================
         INITIAL BLACK FRAME
    =================================================== -->

    <div
        class="page-curtain"
        aria-hidden="true"
    ></div>


    <div class="holder">

      <!-- ==================================================
           HEADER
      =================================================== -->

      <div class="header">

        <div
            class="
              component-enter
              component-enter--header
            "
        >

          <HomeHeader
              v-bind="headerData"
          />

        </div>

      </div>


      <!-- ==================================================
           COUNCIL AREA
      =================================================== -->

      <div class="council">

        <!-- ==============================================
             SELECTED CHARACTER INFO

             Can display either:

             - a panel member
             - the mediator
        =============================================== -->

        <div class="info">

          <div
              class="
                component-enter
                component-enter--member
              "
          >

            <HomeCouncilMember
                :member="selectedCouncilCharacter"
                :member-number="selectedCouncilCharacterNumber"
                :member-count="selectableCouncilCharacters.length"
            />

          </div>

        </div>


        <!-- ==============================================
             COUNCIL LIST
        =============================================== -->

        <div class="list">

          <div
              class="
                component-enter
                component-enter--list
              "
          >

            <HomeCouncilList
                :members="activeCouncilMembers"
                :mediator="activeMediator"
                :selected-id="selectedCouncilCharacterId"
                @select="selectCouncilCharacter"
            />

          </div>

        </div>

      </div>


      <!-- ==================================================
           LOWER AREA
      =================================================== -->

      <div class="extra">

        <!-- ==============================================
             PREFERENCES
        =============================================== -->

        <div class="pref">

          <div
              class="
                component-enter
                component-enter--preferences
              "
          >

            <HomePreferencePanel
                :preferences="preferenceRows"
            />

          </div>

        </div>


        <!-- ==============================================
             PROJECTS / WORK IN MOTION
        =============================================== -->

        <div class="projects">

          <div
              class="
                component-enter
                component-enter--projects
              "
          >

            <HomeProjectsPanel
                :projects="projectsInMotion"
                @open="openWorkItem"
            />

          </div>

        </div>

      </div>

    </div>

  </div>
</template>


<script setup>
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'


import {
  storeToRefs
} from 'pinia'


import HomeHeader from '@/components/home/HomeHeader.vue'
import HomeCouncilList from '@/components/home/HomeCouncilList.vue'
import HomeCouncilMember from '@/components/home/HomeCouncilMember.vue'
import HomePreferencePanel from '@/components/home/HomePreferencePanel.vue'
import HomeProjectsPanel from '@/components/home/HomeProjectsPanel.vue'


/* ==================================================
   STORES
================================================== */

import {
  useProfileStore
} from '@/stores/profileStore.js'


import {
  useCharacterStore
} from '@/stores/characterStore.js'


import {
  useDebatesStore
} from '@/stores/debates.js'


/* ==================================================
   STORE INSTANCES
================================================== */

const profileStore =
    useProfileStore()


const characterStore =
    useCharacterStore()


const debatesStore =
    useDebatesStore()


/* ==================================================
   PROFILE REFS

   The dashboard council is sourced from:

   - profileStore.panel
   - profileStore.mediator

   Debate participants are deliberately ignored.
================================================== */

const {
  profile,
  fullName,
  isAnimeMode,
  isProfessionalMode,
  activeTheme,

  panel:
      profilePanel,

  mediator:
      profileMediator
} =
    storeToRefs(
        profileStore
    )


/* ==================================================
   CHARACTER REFS
================================================== */

const {
  councilMembers,
  councilMediators,
  councilMemberCount,
  mediatorCount,
  mediatorId,
  fullCharacterRoster,

  isLoaded:
      charactersLoaded,

  isLoading:
      charactersLoading,

  error:
      charactersError
} =
    storeToRefs(
        characterStore
    )


/* ==================================================
   DEBATE REFS
================================================== */

const {
  orderedDebates,
  resumableDebates,
  readyDebates,
  activeDebates,
  pausedDebates,
  completedDebates,
  abandonedDebates,

  hasDebates,
  debateCount,

  hasLoaded:
      debatesLoaded,

  isLoading:
      debatesLoading,

  isHydrating:
      debatesHydrating,

  hasHydratedSummaries,

  error:
      debatesError
} =
    storeToRefs(
        debatesStore
    )


/* ==================================================
   PAGE ENTER STATE
================================================== */

const pageEntering =
    ref(
        false
    )


let entranceFrame =
    null


/*
  The page may be rendered inside <KeepAlive>.

  Returning to a kept-alive page does not run
  onMounted() again, so use onActivated() to force the
  profile and debate stores to refresh on re-entry.
*/

let firstActivationSeen =
    false


/* ==================================================
   CLOCK STATE
================================================== */

const now =
    ref(
        new Date()
    )


let clockTimer =
    null


/* ==================================================
   BASIC HELPERS
================================================== */

function asArray(
    value
) {

  return Array.isArray(
      value
  )
      ? value
      : []
}


function numberOrNull(
    value
) {

  if (
      value === null
      ||
      value === undefined
      ||
      value === ''
  ) {

    return null
  }


  const number =
      Number(
          value
      )


  return Number.isFinite(
      number
  )
      ? number
      : null
}


function titleCase(
    value
) {

  if (
      !value
  ) {

    return ''
  }


  return String(
      value
  )
      .replace(
          /[_-]+/g,
          ' '
      )

      .replace(
          /\b\w/g,
          letter =>
              letter.toUpperCase()
      )
}


function timestampOf(
    item
) {

  const timestamp =
      new Date(

          item?.updatedAt

          ??

          item?.updated_at

          ??

          item?.createdAt

          ??

          item?.created_at

          ??

          0
      )
          .getTime()


  return Number.isFinite(
      timestamp
  )
      ? timestamp
      : 0
}


function newestOf(
    items
) {

  return [
        ...asArray(
            items
        )
      ]
          .sort(
              (
                  first,
                  second
              ) =>

                  timestampOf(
                      second
                  )

                  -

                  timestampOf(
                      first
                  )
          )[0]

      ??

      null
}


/* ==================================================
   CLOCK
================================================== */

const timeText =
    computed(
        () =>

            new Intl.DateTimeFormat(
                undefined,
                {
                  hour:
                      '2-digit',

                  minute:
                      '2-digit',

                  hour12:
                      false
                }
            )
                .format(
                    now.value
                )
    )


const dateText =
    computed(
        () =>

            new Intl.DateTimeFormat(
                undefined,
                {
                  weekday:
                      'long',

                  day:
                      '2-digit',

                  month:
                      'long',

                  year:
                      'numeric'
                }
            )
                .format(
                    now.value
                )
                .toUpperCase()
    )


/* ==================================================
   GREETING
================================================== */

const greetingPeriod =
    computed(
        () => {

          const hour =
              now.value
                  .getHours()


          if (
              hour <
              12
          ) {

            return 'GOOD MORNING'
          }


          if (
              hour <
              18
          ) {

            return 'GOOD AFTERNOON'
          }


          return 'GOOD EVENING'
        }
    )


const firstName =
    computed(
        () =>

            profile.value
                ?.firstName

            ??

            profile.value
                ?.first_name

            ??

            fullName.value
                ?.split(' ')[0]

            ??

            ''
    )


const greeting =
    computed(
        () => {

          const name =
              String(
                  firstName.value
                  ??
                  ''
              )
                  .trim()
                  .toUpperCase()


          if (
              !name
          ) {

            return greetingPeriod.value
          }


          return (
              `${greetingPeriod.value}, ${name}`
          )
        }
    )


/* ==================================================
   DASHBOARD SESSION
================================================== */

const dashboardSession =
    computed(
        () =>

            newestOf(
                activeDebates.value
            )

            ??

            newestOf(
                pausedDebates.value
            )

            ??

            newestOf(
                readyDebates.value
            )

            ??

            newestOf(
                orderedDebates.value
            )

            ??

            null
    )


/* ==================================================
   CHARACTER ID RESOLUTION
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

      character.panelMemberId

      ??

      character.panel_member_id

      ??

      character.character?.id

      ??

      character.member?.id

      ??

      character.panelMember?.id

      ??

      character.panel_member?.id

      ??

      null


  return id === null
  ||
  id === undefined
  ||
  id === ''

      ? null

      : String(
          id
      )
}


/* ==================================================
   CHARACTER SNAPSHOT RESOLUTION
================================================== */

function characterSnapshotOf(
    character
) {

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

    return {}
  }


  return (

      character.character

      ??

      character.member

      ??

      character.panelMember

      ??

      character.panel_member

      ??

      character
  )
}


/* ==================================================
   CHARACTER RESOLUTION

   Profile entries may contain:

   - complete objects
   - partial objects
   - raw IDs
================================================== */

function resolveCharacter(
    character
) {

  const id =
      characterIdOf(
          character
      )


  if (
      !id
  ) {

    return null
  }


  const canonical =
      characterStore
          .characterById(
              id
          )


  const snapshot =
      characterSnapshotOf(
          character
      )


  return {

    ...snapshot,

    ...(
        canonical
        ??
        {}
    ),


    id,


    image:
        `/images/char/home/${id}.png`,


    homeImage:
        `/images/char/home/${id}.png`,


    knowledgeImage:
        `/images/char/know/${id}.png`,


    rawSnapshot:
    character,


    canonicalCharacter:
    canonical
  }
}


/* ==================================================
   ACTIVE PANEL MEMBERS

   These are only the five selected panel members.

   The mediator is not inserted into this array.
================================================== */

const activeCouncilMembers =
    computed(
        () => {

          const seenIds =
              new Set()


          return asArray(
              profilePanel.value
          )

              .map(
                  resolveCharacter
              )

              .filter(
                  member => {

                    if (
                        !member?.id
                    ) {

                      return false
                    }


                    if (
                        seenIds.has(
                            member.id
                        )
                    ) {

                      return false
                    }


                    seenIds.add(
                        member.id
                    )


                    return true
                  }
              )
        }
    )


/* ==================================================
   ACTIVE MEDIATOR

   Stored separately from the panel members.
================================================== */

const activeMediator =
    computed(
        () =>

            resolveCharacter(
                profileMediator.value
            )
    )


/* ==================================================
   SELECTABLE COUNCIL CHARACTERS

   This combined array is used only for selection and
   displaying character information.

   The actual panel data remains separate.
================================================== */

const selectableCouncilCharacters =
    computed(
        () => {

          const characters = [
            ...activeCouncilMembers.value
          ]


          const mediator =
              activeMediator.value


          if (
              mediator?.id
              &&
              !characters.some(
                  member =>

                      member.id ===
                      mediator.id
              )
          ) {

            characters.push(
                mediator
            )
          }


          return characters
        }
    )


/* ==================================================
   COUNCIL CHARACTER SELECTION
================================================== */

const selectedCouncilCharacterId =
    ref(
        null
    )


watch(
    selectableCouncilCharacters,

    characters => {

      const selectedStillExists =
          characters.some(
              character =>

                  character.id ===
                  selectedCouncilCharacterId.value
          )


      if (
          selectedStillExists
      ) {

        return
      }


      selectedCouncilCharacterId.value =
          characters[0]?.id
          ??
          null
    },

    {
      immediate:
          true
    }
)


const selectedCouncilCharacter =
    computed(
        () =>

            selectableCouncilCharacters.value
                .find(
                    character =>

                        character.id ===
                        selectedCouncilCharacterId.value
                )

            ??

            selectableCouncilCharacters.value[0]

            ??

            null
    )


/* ==================================================
   SELECTED CHARACTER TYPE
================================================== */

const selectedCouncilCharacterType =
    computed(
        () => {

          if (
              !selectedCouncilCharacter.value?.id
          ) {

            return null
          }


          if (
              selectedCouncilCharacter.value.id ===
              activeMediator.value?.id
          ) {

            return 'mediator'
          }


          return 'panel'
        }
    )


const selectedCouncilCharacterIsMediator =
    computed(
        () =>

            selectedCouncilCharacterType.value ===
            'mediator'
    )


/* ==================================================
   SELECTED CHARACTER NUMBER

   Panel members use 1–5.

   Mediator appears after the panel members.
================================================== */

const selectedCouncilCharacterNumber =
    computed(
        () => {

          const selected =
              selectedCouncilCharacter.value


          if (
              !selected?.id
          ) {

            return 0
          }


          const index =
              selectableCouncilCharacters.value
                  .findIndex(
                      character =>

                          character.id ===
                          selected.id
                  )


          if (
              index <
              0
          ) {

            return 0
          }


          return index +
              1
        }
    )


/* ==================================================
   SELECT CHARACTER

   Accepts either:

   - a character object
   - a character id

   Both panel members and the mediator are valid.
================================================== */

function selectCouncilCharacter(
    characterOrId
) {

  const id =
      characterIdOf(
          characterOrId
      )


  if (
      !id
  ) {

    return false
  }


  const exists =
      selectableCouncilCharacters.value
          .some(
              character =>

                  character.id ===
                  id
          )


  if (
      !exists
  ) {

    console.warn(
        '[AnimeView] Attempted to select unavailable council character:',
        id
    )


    return false
  }


  selectedCouncilCharacterId.value =
      id


  return true
}


/* ==================================================
   COUNCIL STATUS
================================================== */

const councilStatus =
    computed(
        () => {

          if (
              charactersLoading.value
              ||
              debatesLoading.value
          ) {

            return {
              key:
                  'syncing',

              label:
                  'SYNCING',

              detail:
                  'Preparing council data'
            }
          }


          if (
              activeCouncilMembers.value.length
              &&
              activeMediator.value
          ) {

            return {
              key:
                  'ready',

              label:
                  'READY',

              detail:
                  'All systems operational'
            }
          }


          return {
            key:
                'incomplete',

            label:
                'INCOMPLETE',

            detail:
                'Council configuration required'
          }
        }
    )


/* ==================================================
   HEADER PAYLOAD
================================================== */

const headerData =
    computed(
        () => ({

          greeting:
          greeting.value,


          subtitle:
              'Your council is assembled and ready.',


          time:
          timeText.value,


          date:
          dateText.value,


          councilStatus:
          councilStatus.value,


          user: {
            ...profile.value
          },


          theme:
          activeTheme.value
        })
    )


/* ==================================================
   COUNCIL PAYLOAD
================================================== */

const councilData =
    computed(
        () => ({

          members:
          activeCouncilMembers.value,


          panelMembers:
          activeCouncilMembers.value,


          mediator:
          activeMediator.value,


          selectableCharacters:
          selectableCouncilCharacters.value,


          selectedCharacter:
          selectedCouncilCharacter.value,


          selectedCharacterId:
          selectedCouncilCharacterId.value,


          selectedCharacterNumber:
          selectedCouncilCharacterNumber.value,


          selectedCharacterType:
          selectedCouncilCharacterType.value,


          selectedCharacterIsMediator:
          selectedCouncilCharacterIsMediator.value,


          memberCount:
          activeCouncilMembers.value.length,


          selectableCount:
          selectableCouncilCharacters.value.length,


          availableMemberCount:
          councilMemberCount.value,


          availableMediatorCount:
          mediatorCount.value,


          availableMembers:
              councilMembers.value
                  .map(
                      resolveCharacter
                  )
                  .filter(
                      Boolean
                  ),


          availableMediators:
              councilMediators.value
                  .map(
                      resolveCharacter
                  )
                  .filter(
                      Boolean
                  ),


          selectedGlobalMediatorId:
          mediatorId.value
        })
    )


/* ==================================================
   CURRENT CALIBRATION
================================================== */

const currentCalibration =
    computed(
        () =>

            dashboardSession.value
                ?.calibration

            ??

            {}
    )


/* ==================================================
   STYLE LABELS
================================================== */

const approachLabels = {

  supportive:
      'Supportive',

  balanced:
      'Balanced',

  adversarial:
      'Challenging'
}


/* ==================================================
   PRESENTATION PREFERENCE
================================================== */

const presentationPreference =
    computed(
        () =>

            titleCase(
                profile.value
                    ?.presentationPreference

                ??

                profile.value
                    ?.presentation_preference

                ??

                ''
            )
    )


/* ==================================================
   STYLE PREFERENCE
================================================== */

const stylePreference =
    computed(
        () => {

          const profilePreference =

              profile.value
                  ?.stylePreference

              ??

              profile.value
                  ?.style_preference

              ??

              profile.value
                  ?.approachPreference

              ??

              profile.value
                  ?.approach_preference

              ??

              null


          if (
              profilePreference
          ) {

            return (

                approachLabels[
                    profilePreference
                    ]

                ??

                titleCase(
                    profilePreference
                )
            )
          }


          const sessionApproach =
              currentCalibration.value
                  ?.approach


          return (

              approachLabels[
                  sessionApproach
                  ]

              ??

              ''
          )
        }
    )


/* ==================================================
   MODE PREFERENCE
================================================== */

const modePreference =
    computed(
        () => {

          const value =

              profile.value
                  ?.modePreference

              ??

              profile.value
                  ?.mode_preference

              ??

              profile.value
                  ?.councilModePreference

              ??

              profile.value
                  ?.council_mode_preference

              ??

              currentCalibration.value
                  ?.councilMode

              ??

              currentCalibration.value
                  ?.council_mode

              ??

              dashboardSession.value
                  ?.mode

              ??

              ''


          return titleCase(
              value
          )
        }
    )


/* ==================================================
   DEPTH PREFERENCE
================================================== */

const depthPreference =
    computed(
        () =>

            titleCase(

                profile.value
                    ?.depthPreference

                ??

                profile.value
                    ?.depth_preference

                ??

                profile.value
                    ?.discussionDepth

                ??

                profile.value
                    ?.discussion_depth

                ??

                ''
            )
    )


/* ==================================================
   PREFERENCE ROWS
================================================== */

const preferenceRows =
    computed(
        () => [

          {
            id:
                'presentation',

            label:
                'Presentation',

            value:
                presentationPreference.value
                ||
                '—',

            available:
                Boolean(
                    presentationPreference.value
                ),

            raw:
                profile.value
                    ?.presentationPreference

                ??

                profile.value
                    ?.presentation_preference

                ??

                null
          },


          {
            id:
                'style',

            label:
                'Style',

            value:
                stylePreference.value
                ||
                '—',

            available:
                Boolean(
                    stylePreference.value
                ),

            raw:
                profile.value
                    ?.stylePreference

                ??

                profile.value
                    ?.style_preference

                ??

                currentCalibration.value
                    ?.approach

                ??

                null
          },


          {
            id:
                'mode',

            label:
                'Mode',

            value:
                modePreference.value
                ||
                '—',

            available:
                Boolean(
                    modePreference.value
                ),

            raw:
                profile.value
                    ?.modePreference

                ??

                profile.value
                    ?.mode_preference

                ??

                currentCalibration.value
                    ?.councilMode

                ??

                currentCalibration.value
                    ?.council_mode

                ??

                dashboardSession.value
                    ?.mode

                ??

                null
          },


          {
            id:
                'depth',

            label:
                'Depth',

            value:
                depthPreference.value
                ||
                '—',

            available:
                Boolean(
                    depthPreference.value
                ),

            raw:
                profile.value
                    ?.depthPreference

                ??

                profile.value
                    ?.depth_preference

                ??

                null
          }
        ]
    )


/* ==================================================
   PREFERENCES PAYLOAD
================================================== */

const preferencesData =
    computed(
        () => ({

          presentation:
          presentationPreference.value,


          style:
          stylePreference.value,


          mode:
          modePreference.value,


          depth:
          depthPreference.value,


          rows:
          preferenceRows.value,


          isAnimeMode:
          isAnimeMode.value,


          isProfessionalMode:
          isProfessionalMode.value
        })
    )


/* ==================================================
   LATEST DISCUSSIONS
================================================== */

const projectsInMotion =
    computed(
        () => [

          ...resumableDebates.value

        ]
            .sort(
                (
                    first,
                    second
                ) =>

                    timestampOf(
                        second
                    )

                    -

                    timestampOf(
                        first
                    )
            )

            .slice(
                0,
                3
            )

            .map(
                session => {

                  const confidence =

                      numberOrNull(
                          session
                              ?.confidenceInDebate
                      )

                      ??

                      numberOrNull(
                          session
                              ?.confidence_in_debate
                      )

                      ??

                      numberOrNull(
                          session
                              ?.confidenceScore
                      )

                      ??

                      numberOrNull(
                          session
                              ?.confidence_score
                      )


                  const progress =

                      numberOrNull(
                          session
                              ?.progress
                      )

                      ??

                      numberOrNull(
                          session
                              ?.projectProgress
                      )

                      ??

                      numberOrNull(
                          session
                              ?.project_progress
                      )


                  const sessionPanelMembers =

                      asArray(
                          session.panelMembers
                      ).length

                          ? asArray(
                              session.panelMembers
                          )

                          : asArray(
                              session.panel_members
                          )


                  return {

                    id:
                    session.id,


                    title:
                        session.title

                        ||

                        session.calibration
                            ?.topic

                        ||

                        'Untitled Discussion',


                    status:
                        session.status
                        ??
                        'ready',


                    mode:
                        session.mode

                        ??

                        session.calibration
                            ?.councilMode

                        ??

                        session.calibration
                            ?.council_mode

                        ??

                        null,


                    currentRound:

                        numberOrNull(
                            session.currentRound
                        )

                        ??

                        numberOrNull(
                            session.current_round
                        )

                        ??

                        0,


                    currentStage:
                        session.currentStage

                        ??

                        session.current_stage

                        ??

                        null,


                    confidence,


                    progress,


                    memberCount:

                        numberOrNull(
                            session.memberCount
                        )

                        ??

                        numberOrNull(
                            session.member_count
                        )

                        ??

                        sessionPanelMembers.length,


                    riskCount:

                        numberOrNull(
                            session.riskCount
                        )

                        ??

                        numberOrNull(
                            session.risk_count
                        )

                        ??

                        asArray(
                            session.risks
                        )
                            .length,


                    updatedAt:
                        session.updatedAt

                        ??

                        session.updated_at

                        ??

                        null,


                    createdAt:
                        session.createdAt

                        ??

                        session.created_at

                        ??

                        null,


                    calibration:
                        session.calibration
                        ??
                        {},


                    rawSession:
                    session
                  }
                }
            )
    )


/* ==================================================
   PROJECT PAYLOAD
================================================== */

const projectsData =
    computed(
        () => ({

          items:
          projectsInMotion.value,


          count:
          projectsInMotion.value.length,


          hasItems:
              projectsInMotion.value.length >
              0,


          totalResumable:
          resumableDebates.value.length,


          activeCount:
          activeDebates.value.length,


          pausedCount:
          pausedDebates.value.length,


          readyCount:
          readyDebates.value.length
        })
    )


/* ==================================================
   DASHBOARD REQUEST STATE
================================================== */

const dashboardLoading =
    computed(
        () =>

            debatesLoading.value

            ||

            debatesHydrating.value

            ||

            charactersLoading.value
    )


const dashboardError =
    computed(
        () =>

            debatesError.value

            ??

            charactersError.value

            ??

            null
    )


const dashboardReady =
    computed(
        () =>

            charactersLoaded.value

            &&

            debatesLoaded.value

            &&

            !dashboardLoading.value
    )


/* ==================================================
   COMPLETE DASHBOARD PAYLOAD
================================================== */

const dashboardData =
    computed(
        () => ({

          header:
          headerData.value,


          council:
          councilData.value,


          preferences:
          preferencesData.value,


          projects:
          projectsData.value,


          session:
          dashboardSession.value,


          state: {

            ready:
            dashboardReady.value,

            loading:
            dashboardLoading.value,

            error:
            dashboardError.value
          },


          archive: {

            total:
            debateCount.value,

            hasDebates:
            hasDebates.value,

            active:
            activeDebates.value.length,

            paused:
            pausedDebates.value.length,

            ready:
            readyDebates.value.length,

            completed:
            completedDebates.value.length,

            abandoned:
            abandonedDebates.value.length,

            summariesHydrated:
            hasHydratedSummaries.value
          },


          catalogue: {

            characters:
                fullCharacterRoster.value
                    .map(
                        resolveCharacter
                    )
                    .filter(
                        Boolean
                    ),

            panelMembers:
                councilMembers.value
                    .map(
                        resolveCharacter
                    )
                    .filter(
                        Boolean
                    ),

            mediators:
                councilMediators.value
                    .map(
                        resolveCharacter
                    )
                    .filter(
                        Boolean
                    )
          }
        })
    )


/* ==================================================
   OPEN WORK ITEM
================================================== */

function openWorkItem(
    projectOrId
) {

  const id =
      typeof projectOrId ===
      'object'

          ? projectOrId?.id

          : projectOrId


  if (
      !id
  ) {

    return null
  }


  return debatesStore
      .debateById(
          id
      )
}


/* ==================================================
   LOAD DASHBOARD
================================================== */

async function loadDashboard({
                               force = false
                             } = {}) {

  try {

    /*
      The home screen is assembled from two live stores:

      profileStore
          selected panel
          selected mediator
          user preferences
          profile identity

      debatesStore
          current/resumable sessions
          progress
          risks
          confidence
          archive counts

      Fetch both on page entry instead of trusting stale
      Pinia cache from the previous route.
    */

    await Promise.all([

      profileStore
          .fetchProfile({
            force
          }),

      force
          ? debatesStore
              .refreshDebates()

          : debatesStore
              .fetchDebates({
                hydrate:
                    true
              })
    ])


    console.log(
        '[AnimeView] Profile panel:',
        profilePanel.value
    )


    console.log(
        '[AnimeView] Profile mediator:',
        profileMediator.value
    )


    console.log(
        '[AnimeView] Active panel members:',
        activeCouncilMembers.value
    )


    console.log(
        '[AnimeView] Active mediator:',
        activeMediator.value
    )


    console.log(
        '[AnimeView] Selectable council characters:',
        selectableCouncilCharacters.value
    )


    console.log(
        '[AnimeView] Selected council character:',
        selectedCouncilCharacter.value
    )


    return dashboardData.value

  } catch (error) {

    console.error(
        '[AnimeView] Unable to load dashboard:',
        error
    )


    return null
  }
}


/* ==================================================
   REFRESH DASHBOARD
================================================== */

async function refreshDashboard() {

  return loadDashboard({
    force:
        true
  })
}


/* ==================================================
   PAGE ENTRY AUTO-HYDRATION
================================================== */

async function hydrateDashboardOnEntry() {

  now.value =
      new Date()


  return loadDashboard({
    force:
        true
  })
}


/* ==================================================
   LIFECYCLE
================================================== */

onMounted(
    () => {

      entranceFrame =
          window.requestAnimationFrame(
              () => {

                pageEntering.value =
                    true
              }
          )


      now.value =
          new Date()


      clockTimer =
          window.setInterval(
              () => {

                now.value =
                    new Date()
              },

              30_000
          )


      void hydrateDashboardOnEntry()
    }
)


onActivated(
    () => {

      if (
          !firstActivationSeen
      ) {

        firstActivationSeen =
            true


        return
      }


      void hydrateDashboardOnEntry()
    }
)


onBeforeUnmount(
    () => {

      if (
          entranceFrame !==
          null
      ) {

        window.cancelAnimationFrame(
            entranceFrame
        )
      }


      if (
          clockTimer
      ) {

        window.clearInterval(
            clockTimer
        )


        clockTimer =
            null
      }
    }
)
</script>


<style>
/* ==================================================
   GLOBAL
================================================== */

body {
  margin:
      0;

  background-color:
      black;
}


/* ==================================================
   PLACEHOLDER PANEL STYLE
================================================== */

.panel {
  border-radius:
      15px;

  border:
      white solid 1px;

  background-color:
      rgb(255 255 255 / 0.55);

  min-width:
      0;

  min-height:
      0;

  overflow:
      hidden;
}


/* ==================================================
   ROOT
================================================== */

.container {
  position:
      relative;

  isolation:
      isolate;

  overflow:
      hidden;

  width:
      100%;

  min-height:
      100vh;

  background-color:
      black;

  display:
      flex;

  align-items:
      center;

  justify-content:
      flex-start;
}


/* ==================================================
   BACKGROUND IMAGE
================================================== */

.container::before {
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

  background-image:
      url(
      "/images/home/NeonOffice.png"
      );

  background-position:
      center;

  background-repeat:
      no-repeat;

  background-size:
      cover;

  opacity:
      0;
}


.anime-entering.container::before {
  animation:
      anime-background-enter
      1s
      ease-out
      0.12s
      forwards;
}


/* ==================================================
   INITIAL BLACK CURTAIN
================================================== */

.page-curtain {
  position:
      absolute;

  inset:
      0;

  z-index:
      50;

  pointer-events:
      none;

  background-color:
      black;

  opacity:
      1;
}


.anime-entering .page-curtain {
  animation:
      anime-curtain-release
      0.55s
      ease-out
      0.12s
      forwards;
}


/* ==================================================
   HOLDER
================================================== */

.holder {
  position:
      relative;

  z-index:
      1;

  width:
      90%;

  height:
      90vh;

  display:
      grid;

  grid-template-rows:
      1fr
      4fr
      2fr;

  gap:
      0.5rem;

  min-width:
      0;

  min-height:
      0;
}


/* ==================================================
   COUNCIL GRID
================================================== */

.council {
  width:
      100%;

  height:
      100%;

  display:
      grid;

  grid-template-columns:
      5fr
      3fr;

  gap:
      0.2rem;

  min-width:
      0;

  min-height:
      0;
}


/* ==================================================
   LOWER GRID
================================================== */

.extra {
  width:
      100%;

  height:
      100%;

  display:
      grid;

  grid-template-columns:
      2fr
      3fr;

  gap:
      0.5rem;

  min-width:
      0;

  min-height:
      0;
}


/* ==================================================
   COMPONENT ENTER STAGES
================================================== */

.component-enter {
  width:
      100%;

  height:
      100%;

  opacity:
      0;

  transform:
      translateY(14px)
      scale(0.995);

  will-change:
      opacity,
      transform;
}


/* ==================================================
   HEADER ENTRY
================================================== */

.anime-entering
.component-enter--header {
  animation:
      anime-component-enter
      0.6s
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      )
      0.95s
      forwards;
}


/* ==================================================
   CHARACTER FEATURE ENTRY
================================================== */

.anime-entering
.component-enter--member {
  animation:
      anime-component-enter
      0.65s
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      )
      1.08s
      forwards;
}


/* ==================================================
   COUNCIL LIST ENTRY
================================================== */

.anime-entering
.component-enter--list {
  animation:
      anime-component-enter
      0.65s
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      )
      1.18s
      forwards;
}


/* ==================================================
   PREFERENCES ENTRY
================================================== */

.anime-entering
.component-enter--preferences {
  animation:
      anime-component-enter
      0.6s
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      )
      1.32s
      forwards;
}


/* ==================================================
   PROJECTS ENTRY
================================================== */

.anime-entering
.component-enter--projects {
  animation:
      anime-component-enter
      0.6s
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      )
      1.4s
      forwards;
}


/* ==================================================
   ANIMATIONS
================================================== */

@keyframes anime-background-enter {

  from {
    opacity:
        0;
  }

  to {
    opacity:
        1;
  }
}


@keyframes anime-curtain-release {

  from {
    opacity:
        1;
  }

  to {
    opacity:
        0;

    visibility:
        hidden;
  }
}


@keyframes anime-component-enter {

  from {
    opacity:
        0;

    transform:
        translateY(14px)
        scale(0.995);
  }

  to {
    opacity:
        1;

    transform:
        translateY(0)
        scale(1);
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (
prefers-reduced-motion:
    reduce
) {

  .container::before {
    opacity:
        1;

    animation:
        none !important;
  }


  .page-curtain {
    display:
        none;
  }


  .component-enter {
    opacity:
        1;

    transform:
        none;

    animation:
        none !important;
  }
}
</style>

