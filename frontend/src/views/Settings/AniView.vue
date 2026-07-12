<script setup>
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch
} from 'vue'

import {
  storeToRefs
} from 'pinia'

import {
  Check,
  ChevronRight,
  CircleAlert,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Shield,
  Sparkles,
  UserRound,
  UsersRound,
  X
} from 'lucide-vue-next'

import {
  useCharacterStore
} from '@/stores/characterStore.js'

import {
  useProfileStore
} from '@/stores/profileStore.js'


/* =========================================================
   STORES
========================================================= */

const characterStore =
    useCharacterStore()

const profileStore =
    useProfileStore()

const {
  panelMemberIds: committedPanelMemberIds,
  selectedMediatorId: committedMediatorId
} = storeToRefs(
    profileStore
)


/* =========================================================
   CONSTANTS
========================================================= */

const PANEL_SIZE =
    5


/* =========================================================
   LOCAL DRAFT STATE

   Nothing here updates profileStore until saveCouncil().
========================================================= */

const draftPanelIds =
    ref([])

const draftMediatorId =
    ref(null)

const selectedCharacterId =
    ref(null)

const selectedRoster =
    ref('panel')

const searchQuery =
    ref('')

const pendingReplacementId =
    ref(null)

const saveState =
    ref('idle')

const statusMessage =
    ref('')

const previewChanging =
    ref(false)

const hasHydratedDraft =
    ref(false)

const pageReady =
    ref(false)

const pageEntering =
    ref(true)


/* =========================================================
   CHARACTER CATALOGUES
========================================================= */

const panelCharacters =
    computed(
        () =>
            characterStore.councilMembers
            ??
            characterStore.panel
            ??
            []
    )

const mediatorCharacters =
    computed(
        () =>
            characterStore.councilMediators
            ??
            characterStore.mediators
            ??
            []
    )

const allCharacters =
    computed(
        () => [
          ...panelCharacters.value,
          ...mediatorCharacters.value
        ]
    )


/* =========================================================
   CHARACTER HELPERS
========================================================= */

const getCharacterById =
    characterId => {

      if (
          !characterId
      ) {
        return null
      }

      return (
          allCharacters.value.find(
              character =>
                  character.id ===
                  characterId
          )
          ??
          null
      )
    }


const isMediatorCharacter =
    characterId =>
        mediatorCharacters.value.some(
            character =>
                character.id ===
                characterId
        )


const isPanelCharacter =
    characterId =>
        panelCharacters.value.some(
            character =>
                character.id ===
                characterId
        )


const getKnowledgeImage =
    character =>
        character?.id
            ? `/images/char/know/${character.id}.png`
            : ''


const getPreviewImage =
    character =>
        character?.id
            ? `/images/char/home/${character.id}.png`
            : ''


/* =========================================================
   DRAFT HYDRATION
========================================================= */

const hydrateDraftFromStore =
    () => {

      draftPanelIds.value =
          Array.isArray(
              committedPanelMemberIds.value
          )
              ? [
                ...committedPanelMemberIds.value
              ]
                  .filter(
                      id =>
                          Boolean(
                              characterStore.panelMemberById(
                                  id
                              )
                          )
                  )
                  .slice(
                      0,
                      PANEL_SIZE
                  )
              : []

      draftMediatorId.value =
          characterStore.mediatorById(
              committedMediatorId.value
          )
              ? committedMediatorId.value
              : null

      selectedCharacterId.value =
          draftPanelIds.value[0]
          ??
          panelCharacters.value[0]?.id
          ??
          mediatorCharacters.value[0]?.id
          ??
          null

      pendingReplacementId.value =
          null

      saveState.value =
          'idle'

      statusMessage.value =
          ''

      hasHydratedDraft.value =
          true
    }


onMounted(
    async () => {
      hydrateDraftFromStore()

      await nextTick()

      window.requestAnimationFrame(
          () => {
            window.requestAnimationFrame(
                () => {
                  pageReady.value =
                      true
                }
            )
          }
      )

      window.setTimeout(
          () => {
            pageEntering.value =
                false
          },
          2050
      )
    }
)


watch(
    [
      panelCharacters,
      mediatorCharacters
    ],

    () => {

      if (
          !hasHydratedDraft.value
      ) {
        hydrateDraftFromStore()
      }
    },

    {
      immediate: true
    }
)


/* =========================================================
   CURRENT PREVIEW
========================================================= */

const selectedCharacter =
    computed(
        () =>
            getCharacterById(
                selectedCharacterId.value
            )
    )


const selectedCharacterType =
    computed(
        () =>
            isMediatorCharacter(
                selectedCharacterId.value
            )
                ? 'mediator'
                : 'panel'
    )


const selectedCharacterPanelIndex =
    computed(
        () =>
            draftPanelIds.value.indexOf(
                selectedCharacterId.value
            )
    )


const selectedCharacterIsInPanel =
    computed(
        () =>
            selectedCharacterPanelIndex.value !==
            -1
    )


const selectedCharacterIsMediator =
    computed(
        () =>
            draftMediatorId.value ===
            selectedCharacterId.value
    )


/* =========================================================
   PANEL RESOLUTION
========================================================= */

const draftPanel =
    computed(
        () =>
            draftPanelIds.value
                .map(
                    id =>
                        characterStore.panelMemberById(
                            id
                        )
                )
                .filter(
                    Boolean
                )
    )


const draftMediator =
    computed(
        () =>
            characterStore.mediatorById(
                draftMediatorId.value
            )
            ??
            null
    )


const panelSlots =
    computed(
        () =>
            Array.from(
                {
                  length: PANEL_SIZE
                },

                (
                    _,
                    index
                ) =>
                    draftPanel.value[index]
                    ??
                    null
            )
    )


/* =========================================================
   SEARCHING
========================================================= */

const normalizeCharacterText =
    character =>
        [
          character?.name,
          character?.role,
          character?.archetype,
          character?.description,
          ...(character?.personality ?? []),
          ...(character?.specialties ?? []),
          ...(character?.focusAreas ?? [])
        ]
            .filter(
                Boolean
            )
            .join(' ')
            .toLowerCase()


const visibleCharacters =
    computed(
        () => {

          const source =
              selectedRoster.value ===
              'mediator'
                  ? mediatorCharacters.value
                  : panelCharacters.value

          const query =
              searchQuery.value
                  .trim()
                  .toLowerCase()

          if (
              !query
          ) {
            return source
          }

          return source.filter(
              character =>
                  normalizeCharacterText(
                      character
                  )
                      .includes(
                          query
                      )
          )
        }
    )


/* =========================================================
   DRAFT VALIDATION
========================================================= */

const panelIsComplete =
    computed(
        () =>
            draftPanelIds.value.length ===
            PANEL_SIZE
    )


const mediatorIsSelected =
    computed(
        () =>
            Boolean(
                draftMediator.value
            )
    )


const councilIsComplete =
    computed(
        () =>
            panelIsComplete.value &&
            mediatorIsSelected.value
    )


const hasDuplicatePanelMembers =
    computed(
        () =>
            new Set(
                draftPanelIds.value
            ).size !==
            draftPanelIds.value.length
    )


const draftIsValid =
    computed(
        () =>
            councilIsComplete.value &&
            !hasDuplicatePanelMembers.value &&
            draftPanelIds.value.every(
                characterId =>
                    Boolean(
                        characterStore.panelMemberById(
                            characterId
                        )
                    )
            )
    )


const hasUnsavedChanges =
    computed(
        () => {

          const committedPanel =
              Array.isArray(
                  committedPanelMemberIds.value
              )
                  ? committedPanelMemberIds.value
                  : []

          const panelChanged =
              JSON.stringify(
                  draftPanelIds.value
              ) !==
              JSON.stringify(
                  committedPanel
              )

          const mediatorChanged =
              draftMediatorId.value !==
              committedMediatorId.value

          return (
              panelChanged ||
              mediatorChanged
          )
        }
    )


const saveDisabled =
    computed(
        () =>
            !draftIsValid.value ||
            !hasUnsavedChanges.value ||
            saveState.value ===
            'saving'
    )


/* =========================================================
   SELECT CHARACTER
========================================================= */

const selectCharacter =
    async character => {

      if (
          !character?.id ||
          selectedCharacterId.value ===
          character.id
      ) {
        return
      }

      previewChanging.value =
          true

      await new Promise(
          resolve =>
              window.setTimeout(
                  resolve,
                  180
              )
      )

      selectedCharacterId.value =
          character.id

      await nextTick()

      window.setTimeout(
          () => {
            previewChanging.value =
                false
          },
          40
      )
    }


/* =========================================================
   ROSTER TABS
========================================================= */

const setRoster =
    roster => {

      selectedRoster.value =
          roster

      searchQuery.value =
          ''

      pendingReplacementId.value =
          null

      const firstCharacter =
          roster ===
          'mediator'
              ? (
                  draftMediator.value
                  ??
                  mediatorCharacters.value[0]
              )
              : (
                  draftPanel.value[0]
                  ??
                  panelCharacters.value[0]
              )

      if (
          firstCharacter
      ) {
        selectCharacter(
            firstCharacter
        )
      }
    }


/* =========================================================
   PANEL ACTION STATE
========================================================= */

const previewActionLabel =
    computed(
        () => {

          if (
              !selectedCharacter.value
          ) {
            return 'Select a character'
          }

          if (
              selectedCharacterType.value ===
              'mediator'
          ) {

            if (
                selectedCharacterIsMediator.value
            ) {
              return 'Selected Mediator'
            }

            return draftMediator.value
                ? 'Set as Mediator'
                : 'Choose Mediator'
          }

          if (
              selectedCharacterIsInPanel.value
          ) {
            return 'Remove from Panel'
          }

          if (
              draftPanelIds.value.length <
              PANEL_SIZE
          ) {
            return 'Add to Panel'
          }

          if (
              pendingReplacementId.value ===
              selectedCharacterId.value
          ) {
            return 'Select Member to Replace'
          }

          return 'Replace a Panel Member'
        }
    )


const previewActionIcon =
    computed(
        () => {

          if (
              selectedCharacterType.value ===
              'mediator'
          ) {
            return Shield
          }

          if (
              selectedCharacterIsInPanel.value
          ) {
            return X
          }

          if (
              draftPanelIds.value.length >=
              PANEL_SIZE
          ) {
            return RefreshCw
          }

          return UsersRound
        }
    )


const previewActionDisabled =
    computed(
        () =>
            !selectedCharacter.value ||
            (
                selectedCharacterType.value ===
                'mediator' &&
                selectedCharacterIsMediator.value
            )
    )


/* =========================================================
   MODIFY LOCAL DRAFT
========================================================= */

const runPreviewAction =
    () => {

      const character =
          selectedCharacter.value

      if (
          !character
      ) {
        return
      }

      statusMessage.value =
          ''

      if (
          selectedCharacterType.value ===
          'mediator'
      ) {

        draftMediatorId.value =
            character.id

        pendingReplacementId.value =
            null

        statusMessage.value =
            `${character.name} is now the draft mediator.`

        return
      }

      if (
          selectedCharacterIsInPanel.value
      ) {

        draftPanelIds.value =
            draftPanelIds.value.filter(
                id =>
                    id !==
                    character.id
            )

        pendingReplacementId.value =
            null

        statusMessage.value =
            `${character.name} was removed from the draft panel.`

        return
      }

      if (
          draftPanelIds.value.length <
          PANEL_SIZE
      ) {

        draftPanelIds.value = [
          ...draftPanelIds.value,
          character.id
        ]

        pendingReplacementId.value =
            null

        statusMessage.value =
            `${character.name} was added to the draft panel.`

        return
      }

      pendingReplacementId.value =
          character.id

      statusMessage.value =
          `Choose one current panel member to replace with ${character.name}.`
    }


const replacePanelSlot =
    slotIndex => {

      const incomingId =
          pendingReplacementId.value

      if (
          !incomingId
      ) {

        const character =
            panelSlots.value[
                slotIndex
                ]

        if (
            character
        ) {
          selectCharacter(
              character
          )
        }

        return
      }

      const outgoingCharacter =
          panelSlots.value[
              slotIndex
              ]

      const incomingCharacter =
          characterStore.panelMemberById(
              incomingId
          )

      if (
          !outgoingCharacter ||
          !incomingCharacter
      ) {
        return
      }

      const nextPanel = [
        ...draftPanelIds.value
      ]

      nextPanel.splice(
          slotIndex,
          1,
          incomingId
      )

      draftPanelIds.value =
          nextPanel

      pendingReplacementId.value =
          null

      statusMessage.value =
          `${outgoingCharacter.name} was replaced by ${incomingCharacter.name}.`

      selectCharacter(
          incomingCharacter
      )
    }


const cancelReplacement =
    () => {

      pendingReplacementId.value =
          null

      statusMessage.value =
          ''
    }


const removePanelMember =
    characterId => {

      draftPanelIds.value =
          draftPanelIds.value.filter(
              id =>
                  id !==
                  characterId
          )

      if (
          pendingReplacementId.value ===
          characterId
      ) {
        pendingReplacementId.value =
            null
      }
    }


/* =========================================================
   RESET DRAFT

   This restores the last committed store state.
========================================================= */

const resetDraft =
    () => {

      hydrateDraftFromStore()

      statusMessage.value =
          'Unsaved changes were discarded.'
    }


/* =========================================================
   SAVE

   The profile store is touched only here.
========================================================= */

const saveCouncil =
    async () => {

      if (
          !draftIsValid.value
      ) {

        statusMessage.value =
            'Choose exactly five panel members and one mediator before saving.'

        return
      }

      saveState.value =
          'saving'

      statusMessage.value =
          ''

      try {

        const saved =
            profileStore
                .setCouncilConfiguration({
                  panelMemberIds: [
                    ...draftPanelIds.value
                  ],
                  selectedMediatorId:
                  draftMediatorId.value
                })

        if (
            !saved
        ) {
          throw new Error(
              'The profile store rejected the council configuration.'
          )
        }

        saveState.value =
            'saved'

        statusMessage.value =
            'Your council has been saved.'

        window.setTimeout(
            () => {

              if (
                  saveState.value ===
                  'saved'
              ) {
                saveState.value =
                    'idle'
              }
            },
            2200
        )
      }
      catch (
          error
          ) {

        console.error(
            '[CouncilSelection] Save failed:',
            error
        )

        saveState.value =
            'error'

        statusMessage.value =
            'The council could not be saved. Your draft is still available.'
      }
    }


/* =========================================================
   PREVIEW CONTENT
========================================================= */

const previewTraits =
    computed(
        () => {

          const character =
              selectedCharacter.value

          if (
              !character
          ) {
            return []
          }

          const source = [
            ...(character.personality ?? []),
            ...(character.focusAreas ?? []),
            ...(character.specialties ?? [])
          ]

          return [
            ...new Set(
                source
                    .filter(
                        Boolean
                    )
                    .map(
                        trait =>
                            String(
                                trait
                            )
                                .trim()
                    )
            )
          ]
              .slice(
                  0,
                  3
              )
        }
    )


const previewQuote =
    computed(
        () =>
            selectedCharacter.value?.quote
            ??
            selectedCharacter.value?.dialogueExamples?.challenge
            ??
            'Every perspective should earn its place at the table.'
    )


/* =========================================================
   COUNCIL BALANCE

   This is presentation-only and derived from character text.
========================================================= */

const scoreCharacterForTerms =
    (
        character,
        terms
    ) => {

      const text =
          normalizeCharacterText(
              character
          )

      const matches =
          terms.filter(
              term =>
                  text.includes(
                      term
                  )
          ).length

      return Math.min(
          100,
          28 + (
              matches *
              18
          )
      )
    }


const councilBalance =
    computed(
        () => {

          const characters = [
            ...draftPanel.value,
            draftMediator.value
          ]
              .filter(
                  Boolean
              )

          const dimensions = [
            {
              label: 'Emotional awareness',
              terms: [
                'empath',
                'emotion',
                'human',
                'warm',
                'gentle'
              ]
            },
            {
              label: 'Practicality',
              terms: [
                'practical',
                'operator',
                'realist',
                'execution',
                'efficient'
              ]
            },
            {
              label: 'Skepticism',
              terms: [
                'skeptic',
                'risk',
                'evidence',
                'critical',
                'logic'
              ]
            },
            {
              label: 'Creativity',
              terms: [
                'creative',
                'vision',
                'imagin',
                'opportunity',
                'alternative'
              ]
            },
            {
              label: 'Long-term thinking',
              terms: [
                'long-term',
                'strategy',
                'consequence',
                'future',
                'planning'
              ]
            }
          ]

          return dimensions.map(
              dimension => {

                if (
                    characters.length ===
                    0
                ) {
                  return {
                    ...dimension,
                    value: 0
                  }
                }

                const total =
                    characters.reduce(
                        (
                            sum,
                            character
                        ) =>
                            sum +
                            scoreCharacterForTerms(
                                character,
                                dimension.terms
                            ),
                        0
                    )

                return {
                  ...dimension,
                  value:
                      Math.round(
                          total /
                          characters.length
                      )
                }
              }
          )
        }
    )


const balanceSummary =
    computed(
        () => {

          if (
              !councilIsComplete.value
          ) {
            return 'Complete your council to generate its reasoning profile.'
          }

          const values =
              councilBalance.value.map(
                  item =>
                      item.value
              )

          const spread =
              Math.max(
                  ...values
              ) -
              Math.min(
                  ...values
              )

          if (
              spread <=
              24
          ) {
            return 'A broad range of reasoning styles is represented.'
          }

          const strongest =
              [
                ...councilBalance.value
              ]
                  .sort(
                      (
                          a,
                          b
                      ) =>
                          b.value -
                          a.value
                  )[0]

          return `This council currently leans toward ${strongest.label.toLowerCase()}.`
        }
    )


/* =========================================================
   STATUS
========================================================= */

const councilStatusText =
    computed(
        () => {

          if (
              councilIsComplete.value
          ) {

            if (
                hasUnsavedChanges.value
            ) {
              return 'Council ready · Unsaved changes'
            }

            return 'Council ready · Configuration saved'
          }

          const missingPanel =
              PANEL_SIZE -
              draftPanelIds.value.length

          if (
              missingPanel >
              0 &&
              !draftMediator.value
          ) {
            return `${missingPanel} panel ${missingPanel === 1 ? 'seat' : 'seats'} and a mediator required`
          }

          if (
              missingPanel >
              0
          ) {
            return `${missingPanel} panel ${missingPanel === 1 ? 'seat' : 'seats'} remaining`
          }

          return 'Select one mediator to complete the council'
        }
    )


const saveButtonText =
    computed(
        () => {

          if (
              saveState.value ===
              'saving'
          ) {
            return 'Saving Council'
          }

          if (
              saveState.value ===
              'saved'
          ) {
            return 'Council Saved'
          }

          return 'Save Council'
        }
    )
</script>


<template>
  <main
      class="settings"
      :class="{
        'page-ready': pageReady,
        'page-entering': pageEntering
      }"
  >
    <div
        class="ambient ambient-left"
        aria-hidden="true"
    />

    <div
        class="ambient ambient-right"
        aria-hidden="true"
    />

    <div class="cont">
      <!-- ================================================
           HEADER
      ================================================= -->

      <header class="header panel">
        <div class="header-copy">
          <div class="eyebrow">
            <span class="eyebrow-line" />

            <span>
              Council Configuration
            </span>
          </div>

          <h1>
            Select Your Panel
          </h1>

          <p>
            Choose five voices to challenge, refine, and
            strengthen your decisions.
          </p>
        </div>

        <div class="header-count">
          <div class="count-value">
            <span>
              {{ draftPanelIds.length.toString().padStart(2, '0') }}
            </span>

            <small>
              /
              {{ PANEL_SIZE.toString().padStart(2, '0') }}
            </small>
          </div>

          <div class="count-label">
            Panel selected
          </div>

          <div
              class="mediator-state"
              :class="{
              complete: mediatorIsSelected
            }"
          >
            <Shield :size="13" />

            <span>
              {{ mediatorIsSelected ? 'Mediator selected' : 'Mediator required' }}
            </span>
          </div>
        </div>
      </header>


      <!-- ================================================
           MAIN SELECTION AREA
      ================================================= -->

      <section class="selection">
        <!-- ==============================================
             AVAILABLE CHARACTERS
        =============================================== -->

        <aside class="chars panel">
          <div class="section-heading">
            <div>
              <span class="section-kicker">
                Available Members
              </span>

              <h2>
                Character Roster
              </h2>
            </div>

            <span class="roster-total">
              {{ visibleCharacters.length }}
            </span>
          </div>

          <div
              class="roster-tabs"
              role="tablist"
              aria-label="Character type"
          >
            <button
                type="button"
                class="roster-tab"
                :class="{
                active: selectedRoster === 'panel'
              }"
                @click="setRoster('panel')"
            >
              <UsersRound :size="15" />

              Panel

              <span>
                {{ panelCharacters.length }}
              </span>
            </button>

            <button
                type="button"
                class="roster-tab"
                :class="{
                active: selectedRoster === 'mediator'
              }"
                @click="setRoster('mediator')"
            >
              <Shield :size="15" />

              Mediators

              <span>
                {{ mediatorCharacters.length }}
              </span>
            </button>
          </div>

          <label class="search-field">
            <Search :size="16" />

            <input
                v-model="searchQuery"
                type="search"
                placeholder="Search members..."
                autocomplete="off"
            />

            <button
                v-if="searchQuery"
                type="button"
                aria-label="Clear search"
                @click="searchQuery = ''"
            >
              <X :size="14" />
            </button>
          </label>


          <div
              v-if="visibleCharacters.length"
              class="character-grid"
          >
            <button
                v-for="(character, characterIndex) in visibleCharacters"
                :key="character.id"
                :style="{
                '--card-index': characterIndex
              }"
                type="button"
                class="character-card"
                :class="{
                active:
                  selectedCharacterId === character.id,

                selected:
                  draftPanelIds.includes(character.id) ||
                  draftMediatorId === character.id
              }"
                @click="selectCharacter(character)"
            >
              <div class="character-card-image">
                <img
                    :src="getKnowledgeImage(character)"
                    :alt="character.name"
                    draggable="false"
                />

                <div class="card-image-shade" />

                <span
                    v-if="draftPanelIds.includes(character.id)"
                    class="selection-number"
                >
                  Panel
                  {{
                    (
                        draftPanelIds.indexOf(character.id) + 1
                    )
                        .toString()
                        .padStart(2, '0')
                  }}
                </span>

                <span
                    v-else-if="draftMediatorId === character.id"
                    class="selection-number mediator-number"
                >
                  Mediator
                </span>

                <span
                    v-if="
                    draftPanelIds.includes(character.id) ||
                    draftMediatorId === character.id
                  "
                    class="selected-check"
                >
                  <Check :size="14" />
                </span>
              </div>

              <div class="character-card-copy">
                <strong>
                  {{ character.name }}
                </strong>

                <span>
                  {{ character.role }}
                </span>
              </div>
            </button>
          </div>

          <div
              v-else
              class="empty-roster"
          >
            <Search :size="24" />

            <strong>
              No characters found
            </strong>

            <span>
              Try another name or switch roster.
            </span>
          </div>
        </aside>


        <!-- ==============================================
             CHARACTER PREVIEW
        =============================================== -->

        <article
            class="preview panel"
            :class="{
            changing: previewChanging
          }"
        >
          <div class="preview-environment" />

          <div
              class="preview-frame"
              aria-hidden="true"
          >
            <span class="corner corner-top-left" />
            <span class="corner corner-top-right" />
            <span class="corner corner-bottom-left" />
            <span class="corner corner-bottom-right" />
          </div>

          <template v-if="selectedCharacter">
            <div class="preview-role">
              <span>
                {{
                  selectedCharacterType === 'mediator'
                      ? 'Mediator Candidate'
                      : 'Panel Candidate'
                }}
              </span>
            </div>

            <Transition
                name="character-art"
                mode="out-in"
            >
              <div
                  :key="selectedCharacter.id"
                  class="preview-character"
              >
                <img
                    :src="getPreviewImage(selectedCharacter)"
                    :alt="selectedCharacter.name"
                    draggable="false"
                />
              </div>
            </Transition>

            <Transition
                name="preview-copy"
                mode="out-in"
            >
              <div
                  :key="`copy-${selectedCharacter.id}`"
                  class="preview-content"
              >
                <h2>
                  {{ selectedCharacter.name }}
                </h2>

                <span class="preview-title">
                  {{ selectedCharacter.role }}
                </span>

                <blockquote>
                  “{{ previewQuote }}”
                </blockquote>

                <div class="trait-list">
                  <span
                      v-for="trait in previewTraits"
                      :key="trait"
                  >
                    {{ trait }}
                  </span>
                </div>

                <button
                    type="button"
                    class="preview-action"
                    :class="{
                    danger:
                      selectedCharacterIsInPanel,

                    replacing:
                      pendingReplacementId ===
                      selectedCharacter.id,

                    selected:
                      selectedCharacterIsMediator
                  }"
                    :disabled="previewActionDisabled"
                    @click="runPreviewAction"
                >
                  <component
                      :is="previewActionIcon"
                      :size="17"
                  />

                  <span>
                    {{ previewActionLabel }}
                  </span>

                  <ChevronRight
                      v-if="!selectedCharacterIsInPanel"
                      :size="16"
                      class="action-arrow"
                  />
                </button>
              </div>
            </Transition>
          </template>

          <div
              v-else
              class="empty-preview"
          >
            <UserRound :size="44" />

            <strong>
              Select a character
            </strong>

            <span>
              Their role, personality, and council position
              will appear here.
            </span>
          </div>
        </article>


        <!-- ==============================================
             CURRENT DRAFT COUNCIL
        =============================================== -->

        <aside class="team panel">
          <div class="section-heading">
            <div>
              <span class="section-kicker">
                Current Draft
              </span>

              <h2>
                Your Council
              </h2>
            </div>

            <span
                class="draft-state"
                :class="{
                dirty: hasUnsavedChanges
              }"
            >
              {{ hasUnsavedChanges ? 'Unsaved' : 'Saved' }}
            </span>
          </div>

          <!-- Mediator -->

          <div class="team-group">
            <div class="team-group-label">
              <Shield :size="13" />

              Mediator

              <span>
                01 required
              </span>
            </div>

            <button
                v-if="draftMediator"
                type="button"
                class="mediator-card"
                :class="{
                active:
                  selectedCharacterId ===
                  draftMediator.id
              }"
                @click="selectCharacter(draftMediator)"
            >
              <img
                  :src="getPreviewImage(draftMediator)"
                  :alt="draftMediator.name"
                  draggable="false"
              />

              <span class="mediator-card-shade" />

              <span class="mediator-card-copy">
                <small>
                  Mediator
                </small>

                <strong>
                  {{ draftMediator.name }}
                </strong>

                <em>
                  {{ draftMediator.role }}
                </em>
              </span>

              <span class="mediator-icon">
                <Shield :size="16" />
              </span>
            </button>

            <button
                v-else
                type="button"
                class="empty-mediator"
                @click="setRoster('mediator')"
            >
              <Shield :size="20" />

              <span>
                Choose a mediator
              </span>

              <ChevronRight :size="16" />
            </button>
          </div>

          <!-- Panel slots -->

          <div class="team-group panel-team-group">
            <div class="team-group-label">
              <UsersRound :size="13" />

              Panel Members

              <span>
                {{ draftPanelIds.length }} / {{ PANEL_SIZE }}
              </span>
            </div>

            <div
                v-if="pendingReplacementId"
                class="replacement-notice"
            >
              <div>
                <RefreshCw :size="15" />

                <span>
                  Select a member below to replace.
                </span>
              </div>

              <button
                  type="button"
                  aria-label="Cancel replacement"
                  @click="cancelReplacement"
              >
                <X :size="14" />
              </button>
            </div>

            <div
                class="team-slots"
                :class="{
                replacing: pendingReplacementId
              }"
            >
              <button
                  v-for="(character, index) in panelSlots"
                  :key="character?.id ?? `empty-${index}`"
                  type="button"
                  class="team-slot"
                  :class="{
                  empty: !character,

                  active:
                    character &&
                    selectedCharacterId ===
                    character.id,

                  replaceable:
                    character &&
                    pendingReplacementId
                }"
                  :disabled="
                  !character &&
                  Boolean(pendingReplacementId)
                "
                  @click="replacePanelSlot(index)"
              >
                <template v-if="character">
                  <div class="slot-image">
                    <img
                        :src="getPreviewImage(character)"
                        :alt="character.name"
                        draggable="false"
                    />

                    <span class="slot-image-shade" />

                    <span class="slot-number">
                      {{
                        (
                            index + 1
                        )
                            .toString()
                            .padStart(2, '0')
                      }}
                    </span>

                    <span
                        v-if="pendingReplacementId"
                        class="replace-overlay"
                    >
                      <RefreshCw :size="18" />

                      Replace
                    </span>
                  </div>

                  <span class="slot-copy">
                    <strong>
                      {{ character.name }}
                    </strong>

                    <small>
                      {{ character.role }}
                    </small>
                  </span>
                </template>

                <template v-else>
                  <span class="empty-slot-number">
                    {{
                      (
                          index + 1
                      )
                          .toString()
                          .padStart(2, '0')
                    }}
                  </span>

                  <UserRound :size="20" />

                  <span>
                    Open seat
                  </span>
                </template>
              </button>
            </div>
          </div>

          <!-- Balance -->

          <div class="balance">
            <div class="balance-heading">
              <Sparkles :size="14" />

              <span>
                Council Balance
              </span>
            </div>

            <div class="balance-list">
              <div
                  v-for="item in councilBalance"
                  :key="item.label"
                  class="balance-item"
              >
                <div class="balance-label">
                  <span>
                    {{ item.label }}
                  </span>

                  <small>
                    {{ item.value }}
                  </small>
                </div>

                <div class="balance-track">
                  <span
                      :style="{
                      width: `${item.value}%`
                    }"
                  />
                </div>
              </div>
            </div>

            <p>
              {{ balanceSummary }}
            </p>
          </div>
        </aside>
      </section>


      <!-- ================================================
           SAVE BAR
      ================================================= -->

      <footer class="save-bar panel">
        <div class="save-status">
          <span
              class="status-dot"
              :class="{
              complete: councilIsComplete,
              dirty: hasUnsavedChanges
            }"
          />

          <div>
            <strong>
              {{ councilStatusText }}
            </strong>

            <span v-if="statusMessage">
              {{ statusMessage }}
            </span>

            <span v-else-if="hasUnsavedChanges">
              Changes remain local until you save.
            </span>

            <span v-else>
              Your current council configuration is active.
            </span>
          </div>
        </div>

        <div
            v-if="!draftIsValid"
            class="validation-message"
        >
          <CircleAlert :size="15" />

          <span>
            Five panel members and one mediator are required.
          </span>
        </div>

        <div class="save-actions">
          <button
              type="button"
              class="reset-button"
              :disabled="!hasUnsavedChanges"
              @click="resetDraft"
          >
            <RotateCcw :size="16" />

            Reset
          </button>

          <button
              type="button"
              class="save-button"
              :class="{
              saved: saveState === 'saved'
            }"
              :disabled="saveDisabled"
              @click="saveCouncil"
          >
            <RefreshCw
                v-if="saveState === 'saving'"
                :size="17"
                class="spin"
            />

            <Check
                v-else-if="saveState === 'saved'"
                :size="18"
            />

            <Save
                v-else
                :size="17"
            />

            <span>
              {{ saveButtonText }}
            </span>

            <ChevronRight
                v-if="saveState === 'idle'"
                :size="17"
            />
          </button>
        </div>
      </footer>
    </div>
  </main>
</template>


<style scoped>
/* =========================================================
   PAGE
========================================================= */

.settings {
  --bg: #03050b;
  --panel: rgba(5, 9, 19, 0.9);
  --panel-solid: #070b15;
  --panel-soft: rgba(10, 16, 31, 0.84);
  --line: rgba(106, 148, 192, 0.24);
  --line-strong: rgba(94, 208, 255, 0.52);
  --cyan: #4bd7ff;
  --cyan-soft: #8ae8ff;
  --purple: #a763ff;
  --purple-soft: #d094ff;
  --text: #f4f7ff;
  --muted: #8b98ae;
  --muted-strong: #b5bfd0;
  --danger: #ff6eaa;
  --success: #67ffd5;

  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 100dvh;
  overflow: hidden;
  color: var(--text);
  background:
      linear-gradient(
          90deg,
          rgba(3, 5, 11, 0.98),
          rgba(3, 6, 13, 0.91)
      ),
      url('/images/settings/bg.png')
      center center / cover no-repeat;
  isolation: isolate;
}

.settings::before,
.settings::after {
  transition:
      opacity 850ms ease,
      transform 1200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.settings:not(.page-ready)::before {
  opacity: 0;
  transform: scale(1.035);
}

.settings:not(.page-ready)::after {
  opacity: 0;
}

.settings.page-ready::before {
  opacity: 1;
  transform: scale(1);
}

.settings.page-ready::after {
  opacity: 0.15;
}

.settings::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  content: '';
  pointer-events: none;
  background:
      linear-gradient(
          180deg,
          rgba(3, 5, 11, 0.2),
          rgba(3, 5, 11, 0.8)
      ),
      radial-gradient(
          circle at 51% 38%,
          transparent 0,
          rgba(2, 4, 10, 0.12) 36%,
          rgba(2, 4, 10, 0.7) 100%
      );
}

.settings::after {
  position: absolute;
  z-index: 10;
  inset: 0;
  content: '';
  pointer-events: none;
  background-image:
      linear-gradient(
          rgba(255, 255, 255, 0.025) 1px,
          transparent 1px
      );
  background-size: 100% 4px;
}

.ambient {
  position: absolute;
  z-index: -1;
  width: 30rem;
  height: 30rem;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(100px);
  opacity: 0;
  transform: scale(0.68);
  will-change: opacity, transform;
}

.ambient-left {
  top: 10%;
  left: -15rem;
  background: var(--cyan);
}

.ambient-right {
  right: -12rem;
  bottom: -12rem;
  background: var(--purple);
}

.panel {
  border: 1px solid var(--line);
  background:
      linear-gradient(
          145deg,
          rgba(9, 14, 27, 0.94),
          rgba(3, 6, 13, 0.92)
      );
  box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.025),
      0 18px 42px rgba(0, 0, 0, 0.28);
}


/* =========================================================
   MASTER GRID
========================================================= */

.cont {
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  padding:
      clamp(0.7rem, 1vw, 1.2rem);
  display: grid;
  grid-template-rows:
    auto
    minmax(0, 1fr)
    auto;
  gap:
      clamp(0.6rem, 0.75vw, 0.9rem);
}


/* =========================================================
   HEADER
========================================================= */

.header {
  min-height: 7.4rem;
  padding:
      clamp(1rem, 1.4vw, 1.6rem)
      clamp(1.1rem, 1.7vw, 2rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  border-left-color: var(--cyan);
}

.header-copy {
  min-width: 0;
}

.eyebrow {
  margin-bottom: 0.55rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: var(--muted);
  font-size: clamp(0.58rem, 0.55vw, 0.7rem);
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.eyebrow-line {
  width: 2.6rem;
  height: 1px;
  background:
      linear-gradient(
          90deg,
          var(--cyan),
          transparent
      );
}

.header h1 {
  margin: 0;
  color: #f7f5ff;
  font-family:
      Georgia,
      'Times New Roman',
      serif;
  font-size: clamp(1.7rem, 2.5vw, 3rem);
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.header p {
  margin: 0.65rem 0 0;
  color: var(--muted-strong);
  font-size: clamp(0.72rem, 0.72vw, 0.9rem);
  line-height: 1.5;
}

.header-count {
  flex: 0 0 auto;
  text-align: right;
}

.count-value {
  color: var(--cyan);
  font-family:
      Georgia,
      'Times New Roman',
      serif;
  line-height: 1;
}

.count-value span {
  font-size: clamp(1.8rem, 2.4vw, 3rem);
}

.count-value small {
  color: var(--purple-soft);
  font-size: clamp(1rem, 1.25vw, 1.45rem);
}

.count-label {
  margin-top: 0.3rem;
  color: var(--muted);
  font-size: 0.61rem;
  letter-spacing: 0.23em;
  text-transform: uppercase;
}

.mediator-state {
  margin-top: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  color: #ff91bb;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mediator-state.complete {
  color: var(--success);
}


/* =========================================================
   MAIN LAYOUT
========================================================= */

.selection {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns:
    minmax(17rem, 0.95fr)
    minmax(25rem, 1.55fr)
    minmax(18rem, 1fr);
  gap:
      clamp(0.6rem, 0.75vw, 0.9rem);
}

.chars,
.preview,
.team {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}


/* =========================================================
   COMMON SECTION ELEMENTS
========================================================= */

.section-heading {
  min-height: 3.2rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.section-kicker {
  display: block;
  margin-bottom: 0.2rem;
  color: var(--cyan);
  font-size: 0.54rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin: 0;
  font-family:
      Georgia,
      'Times New Roman',
      serif;
  font-size: clamp(0.92rem, 1vw, 1.12rem);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.roster-total {
  min-width: 1.8rem;
  height: 1.8rem;
  padding: 0 0.4rem;
  display: grid;
  place-items: center;
  border: 1px solid rgba(75, 215, 255, 0.32);
  color: var(--cyan);
  font-family: Georgia, serif;
  font-size: 0.78rem;
}


/* =========================================================
   LEFT ROSTER
========================================================= */

.chars {
  padding:
      clamp(0.8rem, 1vw, 1.15rem);
  display: flex;
  flex-direction: column;
}

.roster-tabs {
  margin-bottom: 0.65rem;
  padding: 0.25rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem;
  border: 1px solid rgba(106, 148, 192, 0.18);
  background: rgba(2, 5, 11, 0.72);
}

.roster-tab {
  min-width: 0;
  min-height: 2.25rem;
  padding: 0 0.7rem;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition:
      180ms ease;
}

.roster-tab span {
  color: currentColor;
  opacity: 0.58;
}

.roster-tab:hover {
  color: var(--text);
}

.roster-tab.active {
  border-color: rgba(75, 215, 255, 0.38);
  color: var(--cyan-soft);
  background:
      linear-gradient(
          90deg,
          rgba(34, 119, 179, 0.15),
          rgba(92, 47, 167, 0.11)
      );
}

.search-field {
  height: 2.4rem;
  padding: 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid rgba(106, 148, 192, 0.25);
  color: var(--muted);
  background: rgba(2, 5, 11, 0.78);
  transition:
      border-color 180ms ease,
      box-shadow 180ms ease;
}

.search-field:focus-within {
  border-color: rgba(75, 215, 255, 0.55);
  box-shadow:
      0 0 0 2px rgba(75, 215, 255, 0.06);
}

.search-field input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: var(--text);
  background: transparent;
  font: inherit;
  font-size: 0.75rem;
}

.search-field input::placeholder {
  color: #66738a;
}

.search-field button {
  padding: 0;
  border: 0;
  display: grid;
  place-items: center;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
}

.character-grid {
  min-height: 0;
  padding-right: 0.3rem;
  display: grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );
  align-content: start;
  gap: 0.55rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color:
      rgba(166, 99, 255, 0.75)
      rgba(106, 148, 192, 0.12);
}

.character-card {
  position: relative;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(106, 148, 192, 0.28);
  color: var(--text);
  background: rgba(3, 7, 15, 0.94);
  cursor: pointer;
  text-align: left;
  transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
}

.character-card:hover {
  transform: translateY(-2px);
  border-color: rgba(75, 215, 255, 0.52);
}

.character-card.active {
  border-color: var(--purple);
  box-shadow:
      0 0 0 1px rgba(166, 99, 255, 0.16),
      inset 0 0 24px rgba(166, 99, 255, 0.08);
}

.character-card.selected::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  border: 1px solid rgba(75, 215, 255, 0.55);
}

.character-card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1.22 / 1;
  overflow: hidden;
  background: #070b14;
}

.character-card-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 20%;
  transform: scale(1.015);
  transition:
      transform 300ms ease;
}

.character-card:hover img {
  transform: scale(1.05);
}

.card-image-shade {
  position: absolute;
  inset: 0;
  background:
      linear-gradient(
          180deg,
          transparent 42%,
          rgba(2, 5, 12, 0.94) 100%
      );
}

.selection-number {
  position: absolute;
  top: 0.4rem;
  left: 0.4rem;
  padding: 0.22rem 0.38rem;
  border: 1px solid rgba(75, 215, 255, 0.6);
  color: var(--cyan-soft);
  background: rgba(2, 7, 17, 0.86);
  font-size: 0.48rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.mediator-number {
  border-color: rgba(166, 99, 255, 0.72);
  color: var(--purple-soft);
}

.selected-check {
  position: absolute;
  right: 0.42rem;
  bottom: 0.42rem;
  width: 1.45rem;
  height: 1.45rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #061019;
  background: var(--cyan);
  box-shadow:
      0 0 14px rgba(75, 215, 255, 0.45);
}

.character-card-copy {
  min-width: 0;
  padding: 0.55rem 0.62rem 0.65rem;
}

.character-card-copy strong,
.character-card-copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.character-card-copy strong {
  font-family: Georgia, serif;
  font-size: clamp(0.69rem, 0.68vw, 0.82rem);
  font-weight: 500;
}

.character-card-copy span {
  margin-top: 0.18rem;
  color: var(--cyan);
  font-size: 0.56rem;
}

.empty-roster {
  min-height: 12rem;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.45rem;
  color: var(--muted);
  text-align: center;
}

.empty-roster strong {
  color: var(--muted-strong);
  font-size: 0.8rem;
}

.empty-roster span {
  font-size: 0.65rem;
}


/* =========================================================
   CENTER PREVIEW
========================================================= */

.preview {
  position: relative;
  isolation: isolate;
  background: #030711;
}

.preview-environment {
  position: absolute;
  z-index: -3;
  inset: 0;
  background:
      linear-gradient(
          180deg,
          rgba(3, 6, 14, 0.08),
          rgba(3, 6, 14, 0.2) 48%,
          rgba(3, 6, 14, 0.94) 89%
      ),
      url('/images/settings/bg.png')
      center center / cover no-repeat;
}

.preview::before {
  position: absolute;
  z-index: -2;
  inset: 0;
  content: '';
  background:
      radial-gradient(
          ellipse at 50% 35%,
          rgba(49, 84, 181, 0.05),
          rgba(2, 5, 13, 0.18) 42%,
          rgba(2, 5, 13, 0.72) 100%
      );
}

.preview::after {
  position: absolute;
  z-index: 5;
  right: 0;
  bottom: 0;
  left: 0;
  height: 36%;
  content: '';
  pointer-events: none;
  background:
      linear-gradient(
          180deg,
          transparent,
          rgba(2, 5, 12, 0.84) 34%,
          #03060d 100%
      );
}

.preview-frame {
  position: absolute;
  z-index: 8;
  inset: 0.75rem;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 1.6rem;
  height: 1.6rem;
  opacity: 0.55;
}

.corner-top-left {
  top: 0;
  left: 0;
  border-top: 1px solid var(--cyan);
  border-left: 1px solid var(--cyan);
}

.corner-top-right {
  top: 0;
  right: 0;
  border-top: 1px solid var(--purple);
  border-right: 1px solid var(--purple);
}

.corner-bottom-left {
  bottom: 0;
  left: 0;
  border-bottom: 1px solid var(--purple);
  border-left: 1px solid var(--purple);
}

.corner-bottom-right {
  right: 0;
  bottom: 0;
  border-right: 1px solid var(--cyan);
  border-bottom: 1px solid var(--cyan);
}

.preview-role {
  position: absolute;
  z-index: 9;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.preview-role span {
  padding: 0.32rem 0.75rem;
  border: 1px solid rgba(75, 215, 255, 0.26);
  color: var(--cyan-soft);
  background: rgba(2, 6, 15, 0.75);
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.preview-character {
  position: absolute;
  z-index: 1;
  inset: 2.4rem 0 8.1rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
}

.preview-character img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center bottom;
  filter:
      drop-shadow(
          0 22px 22px rgba(0, 0, 0, 0.54)
      );
}

.preview-content {
  position: absolute;
  z-index: 9;
  right: 5%;
  bottom: 1rem;
  left: 5%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.preview-content h2 {
  margin: 0;
  font-family:
      Georgia,
      'Times New Roman',
      serif;
  font-size: clamp(1.15rem, 1.65vw, 2rem);
  font-weight: 500;
  letter-spacing: 0.18em;
  line-height: 1.1;
  text-transform: uppercase;
  text-shadow:
      0 2px 12px rgba(0, 0, 0, 0.9);
}

.preview-title {
  margin-top: 0.4rem;
  color: var(--purple-soft);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.preview-content blockquote {
  width: min(100%, 31rem);
  margin: 0.55rem auto 0;
  color: #d3d8e4;
  font-family: Georgia, serif;
  font-size: clamp(0.67rem, 0.68vw, 0.83rem);
  font-style: italic;
  line-height: 1.45;
}

.trait-list {
  margin-top: 0.72rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.45rem;
}

.trait-list span {
  min-height: 1.7rem;
  padding: 0 0.78rem;
  border: 1px solid rgba(166, 99, 255, 0.54);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--purple-soft);
  background: rgba(5, 7, 17, 0.74);
  font-size: 0.51rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.preview-action {
  width: min(100%, 21rem);
  min-height: 2.65rem;
  margin-top: 0.8rem;
  padding: 0 1rem;
  border: 1px solid rgba(166, 99, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  color: #e4c4ff;
  background:
      linear-gradient(
          90deg,
          rgba(72, 30, 116, 0.24),
          rgba(12, 33, 74, 0.22)
      );
  cursor: pointer;
  font: inherit;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition:
      180ms ease;
}

.preview-action:hover:not(:disabled) {
  border-color: var(--cyan);
  color: var(--cyan-soft);
  box-shadow:
      inset 0 0 22px rgba(75, 215, 255, 0.08),
      0 0 18px rgba(75, 215, 255, 0.08);
}

.preview-action.danger {
  border-color: rgba(255, 110, 170, 0.58);
  color: #ffadd0;
}

.preview-action.replacing {
  border-color: var(--cyan);
  color: var(--cyan-soft);
  animation:
      replacement-pulse
      1.8s ease-in-out infinite;
}

.preview-action.selected,
.preview-action:disabled {
  color: var(--success);
  border-color: rgba(103, 255, 213, 0.3);
  cursor: default;
  opacity: 0.72;
}

.action-arrow {
  margin-left: auto;
}

.empty-preview {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.6rem;
  color: var(--muted);
  text-align: center;
}

.empty-preview strong {
  color: var(--text);
  font-family: Georgia, serif;
  font-size: 1rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.empty-preview span {
  max-width: 18rem;
  font-size: 0.72rem;
  line-height: 1.5;
}


/* =========================================================
   RIGHT TEAM
========================================================= */

.team {
  padding:
      clamp(0.8rem, 1vw, 1.15rem);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color:
      rgba(166, 99, 255, 0.65)
      transparent;
}

.draft-state {
  padding: 0.27rem 0.48rem;
  border: 1px solid rgba(103, 255, 213, 0.25);
  color: var(--success);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.draft-state.dirty {
  border-color: rgba(255, 192, 98, 0.34);
  color: #ffc062;
}

.team-group + .team-group {
  margin-top: 0.85rem;
}

.team-group-label {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.42rem;
  color: var(--muted-strong);
  font-size: 0.57rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.team-group-label span {
  margin-left: auto;
  color: var(--muted);
  font-size: 0.48rem;
}

.mediator-card {
  position: relative;
  width: 100%;
  height: clamp(6.3rem, 12vh, 8rem);
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(166, 99, 255, 0.58);
  color: var(--text);
  background: #080b17;
  cursor: pointer;
  text-align: left;
  transition:
      180ms ease;
}

.mediator-card:hover,
.mediator-card.active {
  border-color: var(--purple-soft);
  box-shadow:
      inset 0 0 26px rgba(166, 99, 255, 0.1);
}

.mediator-card img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 24%;
}

.mediator-card-shade {
  position: absolute;
  inset: 0;
  background:
      linear-gradient(
          90deg,
          rgba(3, 6, 14, 0.96) 0%,
          rgba(3, 6, 14, 0.72) 36%,
          rgba(3, 6, 14, 0.08) 72%
      ),
      linear-gradient(
          180deg,
          transparent,
          rgba(3, 6, 14, 0.62)
      );
}

.mediator-card-copy {
  position: absolute;
  top: 50%;
  left: 0.8rem;
  display: flex;
  flex-direction: column;
  transform: translateY(-50%);
}

.mediator-card-copy small {
  color: var(--purple-soft);
  font-size: 0.47rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.mediator-card-copy strong {
  margin-top: 0.35rem;
  font-family: Georgia, serif;
  font-size: clamp(0.85rem, 0.95vw, 1.05rem);
  font-weight: 500;
}

.mediator-card-copy em {
  margin-top: 0.2rem;
  color: var(--cyan);
  font-size: 0.55rem;
  font-style: normal;
}

.mediator-icon {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(166, 99, 255, 0.46);
  display: grid;
  place-items: center;
  color: var(--purple-soft);
  background: rgba(3, 6, 14, 0.62);
  transform: rotate(45deg);
}

.mediator-icon svg {
  transform: rotate(-45deg);
}

.empty-mediator {
  width: 100%;
  min-height: 4.3rem;
  padding: 0 0.8rem;
  border: 1px dashed rgba(166, 99, 255, 0.42);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--purple-soft);
  background: rgba(45, 20, 73, 0.08);
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
}

.empty-mediator svg:last-child {
  margin-left: auto;
}

.replacement-notice {
  min-height: 2.2rem;
  margin-bottom: 0.55rem;
  padding: 0 0.55rem;
  border: 1px solid rgba(75, 215, 255, 0.38);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--cyan-soft);
  background: rgba(29, 106, 151, 0.1);
  animation:
      replacement-pulse
      1.8s ease-in-out infinite;
}

.replacement-notice div {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.58rem;
}

.replacement-notice button {
  padding: 0;
  border: 0;
  display: grid;
  place-items: center;
  color: var(--cyan-soft);
  background: transparent;
  cursor: pointer;
}

.team-slots {
  display: grid;
  grid-template-columns:
    repeat(
      3,
      minmax(0, 1fr)
    );
  gap: 0.45rem;
}

.team-slot {
  min-width: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(106, 148, 192, 0.28);
  color: var(--text);
  background: rgba(3, 7, 15, 0.88);
  cursor: pointer;
  text-align: left;
  transition:
      170ms ease;
}

.team-slot:hover:not(:disabled),
.team-slot.active {
  border-color: rgba(75, 215, 255, 0.56);
}

.team-slot.replaceable {
  border-color: rgba(75, 215, 255, 0.4);
}

.team-slot.replaceable:hover {
  transform: translateY(-2px);
  border-color: var(--cyan);
  box-shadow:
      0 0 16px rgba(75, 215, 255, 0.12);
}

.slot-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1.1 / 1;
  overflow: hidden;
}

.slot-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 20%;
}

.slot-image-shade {
  position: absolute;
  inset: 0;
  background:
      linear-gradient(
          180deg,
          transparent 48%,
          rgba(2, 5, 12, 0.9)
      );
}

.slot-number {
  position: absolute;
  top: 0.32rem;
  left: 0.32rem;
  color: var(--cyan);
  font-family: Georgia, serif;
  font-size: 0.72rem;
}

.replace-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: var(--cyan-soft);
  background: rgba(2, 8, 18, 0.82);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0;
  text-transform: uppercase;
  transition:
      opacity 160ms ease;
}

.team-slot.replaceable:hover .replace-overlay {
  opacity: 1;
}

.slot-copy {
  min-width: 0;
  padding: 0.42rem 0.45rem 0.5rem;
  display: block;
}

.slot-copy strong,
.slot-copy small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-copy strong {
  font-family: Georgia, serif;
  font-size: clamp(0.58rem, 0.58vw, 0.7rem);
  font-weight: 500;
}

.slot-copy small {
  margin-top: 0.14rem;
  color: var(--cyan);
  font-size: 0.46rem;
}

.team-slot.empty {
  min-height: 6.8rem;
  padding: 0.55rem;
  border-style: dashed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  color: #657188;
  text-align: center;
}

.empty-slot-number {
  font-family: Georgia, serif;
  font-size: 0.65rem;
}

.team-slot.empty span:last-child {
  font-size: 0.5rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.balance {
  margin-top: auto;
  padding-top: 0.9rem;
}

.balance-heading {
  margin-bottom: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--muted-strong);
  font-size: 0.57rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.balance-list {
  display: grid;
  gap: 0.42rem;
}

.balance-label {
  margin-bottom: 0.22rem;
  display: flex;
  justify-content: space-between;
  color: #aab5c7;
  font-size: 0.55rem;
}

.balance-label small {
  color: var(--cyan);
  font-size: 0.5rem;
}

.balance-track {
  height: 0.27rem;
  overflow: hidden;
  border: 1px solid rgba(106, 148, 192, 0.22);
  background: rgba(3, 6, 13, 0.8);
}

.balance-track span {
  height: 100%;
  display: block;
  background:
      linear-gradient(
          90deg,
          var(--purple),
          var(--cyan)
      );
  box-shadow:
      0 0 8px rgba(75, 215, 255, 0.32);
  transition:
      width 450ms ease;
}

.balance p {
  margin: 0.7rem 0 0;
  color: var(--muted);
  font-family: Georgia, serif;
  font-size: 0.58rem;
  font-style: italic;
  line-height: 1.45;
}


/* =========================================================
   SAVE BAR
========================================================= */

.save-bar {
  min-height: 4.6rem;
  padding:
      0.65rem
      clamp(0.8rem, 1vw, 1.1rem);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.save-status {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-dot {
  flex: 0 0 auto;
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 50%;
  background: #ff6eaa;
  box-shadow:
      0 0 10px rgba(255, 110, 170, 0.42);
}

.status-dot.complete {
  background: var(--cyan);
  box-shadow:
      0 0 12px rgba(75, 215, 255, 0.7);
}

.status-dot.complete:not(.dirty) {
  background: var(--success);
  box-shadow:
      0 0 12px rgba(103, 255, 213, 0.65);
}

.save-status div {
  min-width: 0;
}

.save-status strong,
.save-status span {
  display: block;
}

.save-status strong {
  color: #cbd7e7;
  font-family: Georgia, serif;
  font-size: clamp(0.68rem, 0.7vw, 0.84rem);
  font-weight: 500;
  letter-spacing: 0.03em;
}

.save-status span {
  margin-top: 0.18rem;
  overflow: hidden;
  color: var(--muted);
  font-size: 0.54rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.validation-message {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #ff9bbf;
  font-size: 0.57rem;
}

.save-actions {
  margin-left: auto;
  display: flex;
  gap: 0.55rem;
}

.reset-button,
.save-button {
  min-height: 2.75rem;
  padding: 0 1.1rem;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  transition:
      180ms ease;
}

.reset-button {
  min-width: 7rem;
  border-color: rgba(139, 152, 174, 0.38);
  color: #c1cad7;
  background: rgba(5, 8, 15, 0.76);
}

.reset-button:hover:not(:disabled) {
  color: var(--text);
  border-color: rgba(181, 191, 208, 0.62);
}

.save-button {
  min-width: clamp(12rem, 17vw, 19rem);
  border-color: rgba(75, 215, 255, 0.68);
  color: white;
  background:
      linear-gradient(
          105deg,
          #22add9,
          #5874ed 54%,
          #9c43e7
      );
  box-shadow:
      0 0 20px rgba(89, 110, 237, 0.16);
}

.save-button svg:last-child {
  margin-left: auto;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
      0 0 24px rgba(75, 215, 255, 0.22);
}

.save-button.saved {
  border-color: rgba(103, 255, 213, 0.7);
  background:
      linear-gradient(
          105deg,
          #159a91,
          #3bcf9f
      );
}

.reset-button:disabled,
.save-button:disabled {
  cursor: not-allowed;
  filter: saturate(0.35);
  opacity: 0.38;
}


/* =========================================================
   PAGE ENTRANCE SEQUENCE
========================================================= */

.page-ready .ambient-left {
  animation:
      ambient-enter-left
      1350ms cubic-bezier(0.16, 1, 0.3, 1)
      40ms both;
}

.page-ready .ambient-right {
  animation:
      ambient-enter-right
      1450ms cubic-bezier(0.16, 1, 0.3, 1)
      180ms both;
}

.page-ready .header {
  animation:
      header-panel-enter
      700ms cubic-bezier(0.16, 1, 0.3, 1)
      100ms both;
}

.page-ready .chars {
  animation:
      left-panel-enter
      720ms cubic-bezier(0.16, 1, 0.3, 1)
      300ms both;
}

.page-ready .preview {
  animation:
      preview-panel-enter
      820ms cubic-bezier(0.16, 1, 0.3, 1)
      430ms both;
}

.page-ready .team {
  animation:
      right-panel-enter
      720ms cubic-bezier(0.16, 1, 0.3, 1)
      610ms both;
}

.page-ready .save-bar {
  animation:
      save-bar-enter
      620ms cubic-bezier(0.16, 1, 0.3, 1)
      810ms both;
}

/* Header pieces do not arrive in one lump. */

.page-entering .header .eyebrow,
.page-entering .header h1,
.page-entering .header p,
.page-entering .header-count {
  opacity: 0;
}

.page-ready.page-entering .header .eyebrow {
  animation:
      copy-rise-enter
      480ms ease
      240ms both;
}

.page-ready.page-entering .header h1 {
  animation:
      title-slice-enter
      620ms cubic-bezier(0.16, 1, 0.3, 1)
      330ms both;
}

.page-ready.page-entering .header p {
  animation:
      copy-rise-enter
      520ms ease
      455ms both;
}

.page-ready.page-entering .header-count {
  animation:
      count-enter
      580ms cubic-bezier(0.16, 1, 0.3, 1)
      390ms both;
}

/* Roster controls arrive before the cards cascade in. */

.page-entering .chars .section-heading,
.page-entering .chars .roster-tabs,
.page-entering .chars .search-field,
.page-entering .character-card {
  opacity: 0;
}

.page-ready.page-entering .chars .section-heading {
  animation:
      copy-rise-enter
      460ms ease
      500ms both;
}

.page-ready.page-entering .chars .roster-tabs {
  animation:
      control-strip-enter
      520ms cubic-bezier(0.16, 1, 0.3, 1)
      590ms both;
}

.page-ready.page-entering .chars .search-field {
  animation:
      control-strip-enter
      520ms cubic-bezier(0.16, 1, 0.3, 1)
      690ms both;
}

.page-ready.page-entering .character-card {
  animation:
      roster-card-enter
      500ms cubic-bezier(0.16, 1, 0.3, 1)
      calc(790ms + (var(--card-index, 0) * 55ms))
      both;
}

/* The center preview boots in layers: frame, badge, art, then copy. */

.page-entering .preview-frame,
.page-entering .preview-role,
.page-entering .preview-character,
.page-entering .preview-content {
  opacity: 0;
}

.page-ready.page-entering .preview-frame {
  animation:
      preview-frame-enter
      650ms cubic-bezier(0.16, 1, 0.3, 1)
      650ms both;
}

.page-ready.page-entering .preview-role {
  animation:
      preview-role-enter
      460ms cubic-bezier(0.16, 1, 0.3, 1)
      760ms both;
}

.page-ready.page-entering .preview-character {
  animation:
      initial-character-enter
      900ms cubic-bezier(0.16, 1, 0.3, 1)
      820ms both;
}

.page-ready.page-entering .preview-content {
  animation:
      initial-preview-copy-enter
      650ms cubic-bezier(0.16, 1, 0.3, 1)
      1130ms both;
}

/* The current council resolves top-to-bottom after the preview. */

.page-entering .team > .section-heading,
.page-entering .team > .team-group,
.page-entering .team > .balance {
  opacity: 0;
}

.page-ready.page-entering .team > .section-heading {
  animation:
      copy-rise-enter
      460ms ease
      790ms both;
}

.page-ready.page-entering .team > .team-group:not(.panel-team-group) {
  animation:
      team-block-enter
      560ms cubic-bezier(0.16, 1, 0.3, 1)
      900ms both;
}

.page-ready.page-entering .team > .panel-team-group {
  animation:
      team-block-enter
      560ms cubic-bezier(0.16, 1, 0.3, 1)
      1030ms both;
}

.page-ready.page-entering .team > .balance {
  animation:
      team-block-enter
      560ms cubic-bezier(0.16, 1, 0.3, 1)
      1190ms both;
}

.page-entering .save-bar .save-status,
.page-entering .save-bar .validation-message,
.page-entering .save-bar .save-actions {
  opacity: 0;
}

.page-ready.page-entering .save-bar .save-status {
  animation:
      footer-piece-enter
      460ms ease
      960ms both;
}

.page-ready.page-entering .save-bar .validation-message {
  animation:
      footer-piece-enter
      460ms ease
      1040ms both;
}

.page-ready.page-entering .save-bar .save-actions {
  animation:
      footer-actions-enter
      520ms cubic-bezier(0.16, 1, 0.3, 1)
      1110ms both;
}

@keyframes ambient-enter-left {
  from {
    opacity: 0;
    transform:
        translate3d(-5rem, 2rem, 0)
        scale(0.68);
  }

  to {
    opacity: 0.12;
    transform:
        translate3d(0, 0, 0)
        scale(1);
  }
}

@keyframes ambient-enter-right {
  from {
    opacity: 0;
    transform:
        translate3d(5rem, 3rem, 0)
        scale(0.68);
  }

  to {
    opacity: 0.12;
    transform:
        translate3d(0, 0, 0)
        scale(1);
  }
}

@keyframes header-panel-enter {
  from {
    opacity: 0;
    transform: translate3d(0, -1.25rem, 0);
    clip-path: inset(0 48% 0 48%);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    clip-path: inset(0 0 0 0);
  }
}

@keyframes left-panel-enter {
  from {
    opacity: 0;
    transform:
        translate3d(-2rem, 0.8rem, 0)
        scale(0.985);
  }

  to {
    opacity: 1;
    transform:
        translate3d(0, 0, 0)
        scale(1);
  }
}

@keyframes preview-panel-enter {
  from {
    opacity: 0;
    transform:
        translate3d(0, 1.4rem, 0)
        scale(0.965);
    clip-path: inset(9% 0 9% 0);
  }

  to {
    opacity: 1;
    transform:
        translate3d(0, 0, 0)
        scale(1);
    clip-path: inset(0 0 0 0);
  }
}

@keyframes right-panel-enter {
  from {
    opacity: 0;
    transform:
        translate3d(2rem, 0.8rem, 0)
        scale(0.985);
  }

  to {
    opacity: 1;
    transform:
        translate3d(0, 0, 0)
        scale(1);
  }
}

@keyframes save-bar-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 1.5rem, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes copy-rise-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 0.55rem, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes title-slice-enter {
  from {
    opacity: 0;
    transform: translate3d(-1.2rem, 0, 0);
    clip-path: inset(0 100% 0 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    clip-path: inset(0 0 0 0);
  }
}

@keyframes count-enter {
  from {
    opacity: 0;
    transform:
        translate3d(1rem, -0.4rem, 0)
        scale(0.94);
  }

  to {
    opacity: 1;
    transform:
        translate3d(0, 0, 0)
        scale(1);
  }
}

@keyframes control-strip-enter {
  from {
    opacity: 0;
    transform: translate3d(-0.8rem, 0, 0);
    clip-path: inset(0 100% 0 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    clip-path: inset(0 0 0 0);
  }
}

@keyframes roster-card-enter {
  from {
    opacity: 0;
    transform:
        translate3d(0, 1rem, 0)
        scale(0.96);
  }

  58% {
    opacity: 1;
  }

  to {
    opacity: 1;
    transform:
        translate3d(0, 0, 0)
        scale(1);
  }
}

@keyframes preview-frame-enter {
  from {
    opacity: 0;
    transform: scale(0.94);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes preview-role-enter {
  from {
    opacity: 0;
    transform:
        translate3d(-50%, -0.75rem, 0)
        scale(0.94);
  }

  to {
    opacity: 1;
    transform:
        translate3d(-50%, 0, 0)
        scale(1);
  }
}

@keyframes initial-character-enter {
  from {
    opacity: 0;
    filter: blur(8px);
    transform:
        translate3d(0, 2.5rem, 0)
        scale(1.04);
  }

  55% {
    opacity: 1;
    filter: blur(1px);
  }

  to {
    opacity: 1;
    filter: blur(0);
    transform:
        translate3d(0, 0, 0)
        scale(1);
  }
}

@keyframes initial-preview-copy-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 1rem, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes team-block-enter {
  from {
    opacity: 0;
    transform: translate3d(0.8rem, 0.7rem, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes footer-piece-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 0.55rem, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes footer-actions-enter {
  from {
    opacity: 0;
    transform: translate3d(1rem, 0, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}


/* =========================================================
   TRANSITIONS
========================================================= */

.character-art-enter-active {
  transition:
      opacity 520ms ease,
      transform 700ms cubic-bezier(0.2, 0.9, 0.2, 1),
      filter 600ms ease;
}

.character-art-leave-active {
  transition:
      opacity 240ms ease,
      transform 280ms ease,
      filter 260ms ease;
}

.character-art-enter-from {
  opacity: 0;
  filter: blur(5px);
  transform:
      translateY(2.2rem)
      scale(1.035);
}

.character-art-leave-to {
  opacity: 0;
  filter: blur(4px);
  transform:
      translateY(0.5rem)
      scale(0.985);
}

.preview-copy-enter-active {
  transition:
      opacity 420ms ease 140ms,
      transform 480ms ease 140ms;
}

.preview-copy-leave-active {
  transition:
      opacity 180ms ease,
      transform 200ms ease;
}

.preview-copy-enter-from {
  opacity: 0;
  transform: translateY(0.7rem);
}

.preview-copy-leave-to {
  opacity: 0;
  transform: translateY(0.3rem);
}

@keyframes replacement-pulse {
  0%,
  100% {
    box-shadow:
        inset 0 0 0 rgba(75, 215, 255, 0);
  }

  50% {
    box-shadow:
        inset 0 0 18px rgba(75, 215, 255, 0.08);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation:
      spin
      800ms linear infinite;
}


/* =========================================================
   LARGE / SHORT SCREENS
========================================================= */

@media (max-height: 850px) and (min-width: 1181px) {
  .cont {
    padding: 0.55rem;
    gap: 0.5rem;
  }

  .header {
    min-height: 5.8rem;
    padding:
        0.75rem
        1rem;
  }

  .header h1 {
    font-size: clamp(1.35rem, 2vw, 2.25rem);
  }

  .header p {
    margin-top: 0.4rem;
  }

  .character-grid {
    gap: 0.4rem;
  }

  .character-card-copy {
    padding: 0.38rem 0.5rem 0.46rem;
  }

  .mediator-card {
    height: 5.2rem;
  }

  .team-slot.empty {
    min-height: 5.5rem;
  }

  .save-bar {
    min-height: 3.8rem;
  }

  .reset-button,
  .save-button {
    min-height: 2.35rem;
  }
}


/* =========================================================
   TABLET / NARROW DESKTOP
========================================================= */

@media (max-width: 1380px) {
  .selection {
    grid-template-columns:
      minmax(15.5rem, 0.92fr)
      minmax(22rem, 1.38fr)
      minmax(17rem, 1fr);
  }

  .team-slots {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .validation-message {
    display: none;
  }
}


@media (max-width: 1180px) {
  .settings {
    height: auto;
    min-height: 100dvh;
    overflow-y: auto;
  }

  .cont {
    height: auto;
    min-height: 100dvh;
  }

  .selection {
    min-height: 68rem;
    grid-template-columns:
      minmax(17rem, 0.85fr)
      minmax(24rem, 1.25fr);
    grid-template-rows:
      minmax(42rem, 1fr)
      auto;
  }

  .team {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns:
      minmax(15rem, 0.75fr)
      minmax(24rem, 1.4fr)
      minmax(16rem, 0.85fr);
    gap: 1rem;
  }

  .team > .section-heading {
    grid-column: 1 / -1;
  }

  .team-group + .team-group {
    margin-top: 0;
  }

  .balance {
    margin-top: 0;
    padding-top: 0;
  }

  .team-slots {
    grid-template-columns:
      repeat(
        5,
        minmax(0, 1fr)
      );
  }
}


/* =========================================================
   MOBILE / STACKED
========================================================= */

@media (max-width: 820px) {
  .settings {
    overflow-x: hidden;
  }

  .cont {
    padding: 0.55rem;
  }

  .header {
    min-height: 0;
    align-items: flex-start;
  }

  .header h1 {
    font-size: clamp(1.25rem, 6vw, 2rem);
  }

  .header p {
    max-width: 26rem;
  }

  .header-count {
    display: none;
  }

  .selection {
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .chars {
    height: 36rem;
    flex: 0 0 auto;
  }

  .preview {
    height: min(46rem, 86dvh);
    min-height: 38rem;
    order: -1;
  }

  .team {
    display: flex;
  }

  .team-slots {
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
  }

  .save-bar {
    position: sticky;
    z-index: 30;
    bottom: 0;
    flex-wrap: wrap;
  }

  .save-status {
    width: 100%;
  }

  .save-actions {
    width: 100%;
    margin-left: 0;
  }

  .reset-button {
    min-width: 0;
    flex: 0 0 auto;
  }

  .save-button {
    min-width: 0;
    flex: 1;
  }
}


@media (max-width: 520px) {
  .header {
    padding: 0.9rem;
  }

  .header h1 {
    letter-spacing: 0.09em;
  }

  .chars,
  .team {
    padding: 0.75rem;
  }

  .character-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .preview {
    min-height: 35rem;
  }

  .preview-character {
    inset:
        2.5rem
        -8%
        9rem;
  }

  .preview-content {
    right: 3%;
    left: 3%;
  }

  .preview-content h2 {
    font-size: 1.05rem;
    letter-spacing: 0.12em;
  }

  .trait-list span {
    padding: 0 0.5rem;
  }

  .team-slots {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .save-bar {
    padding: 0.65rem;
  }

  .save-status span {
    white-space: normal;
  }

  .reset-button {
    width: 2.8rem;
    padding: 0;
  }

  .reset-button span {
    display: none;
  }

  .save-button {
    padding: 0 0.75rem;
    letter-spacing: 0.08em;
  }
}


/* =========================================================
   REDUCED MOTION
========================================================= */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
