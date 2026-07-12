// src/stores/currentDiscussion.js

import { defineStore } from 'pinia'

import api from '@/services/api.js'
import { useChamberStore } from '@/stores/chamber.js'


/* ==================================================
   HELPERS
================================================== */

/* ==================================================
   SAFE VALUE CLONE

   Discussion state is JSON-compatible data.

   Do not call structuredClone() directly on Pinia
   reactive proxies because Vue proxies cannot be
   cloned by the browser structured-clone algorithm.

   JSON serialization safely converts the reactive
   discussion state into plain request-safe objects.
================================================== */

function cloneValue(value) {

    if (
        value === undefined
    ) {
        return undefined
    }


    if (
        value === null
    ) {
        return null
    }


    return JSON.parse(
        JSON.stringify(
            value
        )
    )
}


function createId(prefix) {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return `${prefix}-${crypto.randomUUID()}`
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}


function asArray(value) {
    return Array.isArray(value) ? value : []
}


function asObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {}
}


function normalizeId(value) {
    if (value === null || value === undefined || value === '') {
        return null
    }

    return String(value)
}


function messageMatchesRound(message, roundNumber) {
    const messageRound =
        message?.roundNumber ??
        message?.round_number ??
        message?.round ??
        message?.metadata?.roundNumber ??
        message?.metadata?.round_number ??
        null

    if (messageRound === null || messageRound === undefined) {
        return null
    }

    return Number(messageRound) === Number(roundNumber)
}


function listHasRoundMessage(list, roundNumber) {
    const messages = asArray(list)

    if (!messages.length) {
        return false
    }

    const roundMatches = messages.map(message =>
        messageMatchesRound(message, roundNumber)
    )

    if (roundMatches.some(value => value === true)) {
        return true
    }

    /*
      Some older snapshots may not include round metadata.

      For round 1, any existing message is enough
      to avoid generating duplicate initial responses.
    */

    if (
        Number(roundNumber) === 1 &&
        roundMatches.every(value => value === null)
    ) {
        return true
    }

    return false
}


function appendUniqueMessage(list, message) {
    if (!message) {
        return list
    }

    const next = [...asArray(list)]

    const messageId =
        message.id ??
        message.messageId ??
        message.message_id ??
        null

    if (messageId) {
        const exists = next.some(item =>
            String(
                item?.id ??
                item?.messageId ??
                item?.message_id ??
                ''
            ) === String(messageId)
        )

        if (exists) {
            return next
        }
    }

    next.push(cloneValue(message))

    return next
}


/* ==================================================
   BASE STATE FACTORIES
================================================== */

function createBrief(payload = {}) {
    return {
        topic:
            payload.topic ??
            '',

        objective:
            payload.objective ??
            '',

        objectiveId:
            payload.objectiveId ??
            payload.objective_id ??
            '',

        context:
            payload.context ??
            '',

        approach:
            payload.approach ??
            'balanced',

        councilMode:
            payload.councilMode ??
            payload.council_mode ??
            null,

        desiredOutcome:
            payload.desiredOutcome ??
            payload.desired_outcome ??
            '',

        additionalNotes:
            payload.additionalNotes ??
            payload.additional_notes ??
            ''
    }
}


function createModelContext(payload = {}) {
    return {
        summary:
            payload.summary ??
            '',

        knownFacts:
            cloneValue(
                asArray(
                    payload.knownFacts ??
                    payload.known_facts
                )
            ),

        assumptions:
            cloneValue(
                asArray(
                    payload.assumptions
                )
            ),

        constraints:
            cloneValue(
                asArray(
                    payload.constraints
                )
            ),

        objectives:
            cloneValue(
                asArray(
                    payload.objectives
                )
            ),

        unresolvedQuestions:
            cloneValue(
                asArray(
                    payload.unresolvedQuestions ??
                    payload.unresolved_questions
                )
            ),

        calibrationSnapshot:
            cloneValue(
                asObject(
                    payload.calibrationSnapshot ??
                    payload.calibration_snapshot
                )
            )
    }
}


function createParticipants() {
    return {
        characters: {},

        characterOrder: [],

        mediator: null
    }
}


function normalizeFocusAreas(participant) {
    const value =
        participant?.focusAreas ??
        participant?.focus_areas ??
        participant?.expertise ??
        []

    return asArray(value)
        .filter(
            item =>
                typeof item === 'string'
        )
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean)
}


function normalizeParticipant(participant) {
    const id =
        normalizeId(
            participant?.id
        )

    if (!id) {
        return null
    }

    return {
        ...cloneValue(participant),

        id,

        name:
            participant.name ??
            id,

        role:
            participant.role ??
            'Council Member',

        description:
            participant.description ??
            '',

        personality:
            participant.personality ??
            participant.persona ??
            [],

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


function createConfidenceState(payload = {}) {
    return {
        initial:
            payload.initial ??
            null,

        current:
            payload.current ??
            null,

        history:
            cloneValue(
                asArray(
                    payload.history
                )
            )
    }
}


function createPositionState(payload = {}) {
    return {
        stance:
            payload.stance ??
            'undecided',

        statement:
            payload.statement ??
            '',

        reasoning:
            payload.reasoning ??
            ''
    }
}


function createCharacterSectionState(payload = {}) {
    return {
        status:
            payload.status ??
            'pending',

        confidence:
            createConfidenceState(
                payload.confidence
            ),

        position:
            createPositionState(
                payload.position
            ),

        risks:
            cloneValue(
                asArray(
                    payload.risks
                )
            ),

        actions:
            cloneValue(
                asArray(
                    payload.actions
                )
            ),

        agreements:
            cloneValue(
                asArray(
                    payload.agreements
                )
            ),

        disagreements:
            cloneValue(
                asArray(
                    payload.disagreements
                )
            ),

        statementHistory:
            cloneValue(
                asArray(
                    payload.statementHistory ??
                    payload.statement_history
                )
            ),

        discussions:
            cloneValue(
                asObject(
                    payload.discussions
                )
            ),

        discussionOrder:
            cloneValue(
                asArray(
                    payload.discussionOrder ??
                    payload.discussion_order
                )
            )
    }
}


function createUserSectionState(payload = {}) {
    return {
        messages:
            cloneValue(
                asArray(
                    payload.messages
                )
            )
    }
}


function createMediatorSectionState(payload = {}) {
    return {
        statements:
            cloneValue(
                asArray(
                    payload.statements
                )
            ),

        summary:
            payload.summary ??
            null,

        consensus:
            cloneValue(
                asArray(
                    payload.consensus
                )
            ),

        disagreements:
            cloneValue(
                asArray(
                    payload.disagreements
                )
            ),

        unresolvedPoints:
            cloneValue(
                asArray(
                    payload.unresolvedPoints ??
                    payload.unresolved_points
                )
            ),

        questionsForUser:
            cloneValue(
                asArray(
                    payload.questionsForUser ??
                    payload.questions_for_user
                )
            )
    }
}


function createRoundState(payload = {}) {
    return {
        number:
            Number(
                payload.number ??
                1
            ),

        status:
            payload.status ??
            'pending',

        reactions:
            cloneValue(
                asObject(
                    payload.reactions
                )
            ),

        interventions:
            cloneValue(
                asArray(
                    payload.interventions
                )
            ),

        startedAt:
            payload.startedAt ??
            payload.started_at ??
            null,

        completedAt:
            payload.completedAt ??
            payload.completed_at ??
            null
    }
}


function createRoundsState(payload = {}) {
    const rounds = {}

    Object.entries(
        asObject(payload)
    ).forEach(
        ([
             roundKey,
             roundPayload
         ]) => {
            const safePayload =
                asObject(
                    roundPayload
                )

            const roundNumber =
                Number(
                    safePayload.number ??
                    roundKey
                )

            rounds[
                String(roundNumber)
                ] =
                createRoundState({
                    ...safePayload,

                    number:
                    roundNumber
                })
        }
    )

    if (
        !Object.keys(rounds).length
    ) {
        rounds['1'] =
            createRoundState({
                number: 1,

                status: 'active'
            })
    }

    return rounds
}


function mergeRoundState(
    current,
    incoming = {}
) {
    const base =
        current ??
        createRoundState()

    return {
        ...base,

        ...cloneValue(
            incoming
        ),

        number:
            Number(
                incoming.number ??
                base.number ??
                1
            ),

        reactions: {
            ...asObject(
                base.reactions
            ),

            ...asObject(
                incoming.reactions
            )
        },

        interventions:
            Array.isArray(
                incoming.interventions
            )
                ? cloneValue(
                    incoming.interventions
                )
                : base.interventions
    }
}


function createSection(
    payload = {},
    characterIds = []
) {

    const characters = {}


    characterIds.forEach(
        characterId => {

            const id =
                String(
                    characterId
                )


            characters[id] =
                createCharacterSectionState(

                    payload.characters?.[id]

                    ??

                    {}
                )
        }
    )


    Object.entries(
        asObject(
            payload.characters
        )
    )
        .forEach(
            ([
                 characterId,
                 state
             ]) => {

                const id =
                    String(
                        characterId
                    )


                if (
                    !characters[id]
                ) {

                    characters[id] =
                        createCharacterSectionState(
                            state
                        )
                }
            }
        )


    return {

        id:
            normalizeId(
                payload.id
            )

            ??

            createId(
                'section'
            ),


        title:
            payload.title

            ??

            'Untitled Section',


        description:
            payload.description

            ??

            '',


        sequence:
            Number(
                payload.sequence

                ??

                0
            ),


        status:
            payload.status

            ??

            'pending',


        rounds:
            createRoundsState(
                payload.rounds
            ),


        characters,


        /* ==========================================
           SECTION METRICS

           Backend format:

           {
               alignment: {
                   score,
                   support,
                   conditionalSupport,
                   mixed,
                   undecided,
                   oppose
               },

               ideaConfidence,

               scoredMembers,

               totalMembers,

               members: []
           }
        ========================================== */

        metrics:
            cloneValue(
                asObject(
                    payload.metrics
                )
            ),


        user:
            createUserSectionState(
                payload.user
            ),


        mediator:
            createMediatorSectionState(
                payload.mediator
            ),


        conclusion:
            payload.conclusion

            ??

            null,


        metadata:
            cloneValue(
                asObject(
                    payload.metadata
                )
            )
    }
}


function createSubDiscussion(payload = {}) {
    return {
        id:
            normalizeId(
                payload.id
            ) ??
            createId(
                'discussion'
            ),

        title:
            payload.title ??
            '',

        topic:
            payload.topic ??
            '',

        openedFrom:
            payload.openedFrom ??
            payload.opened_from ??
            null,

        status:
            payload.status ??
            'active',

        participants:
            cloneValue(
                asArray(
                    payload.participants
                )
            ),

        messages:
            cloneValue(
                asArray(
                    payload.messages
                )
            ),

        mediator: {
            statements:
                cloneValue(
                    asArray(
                        payload.mediator
                            ?.statements
                    )
                ),

            summary:
                payload.mediator
                    ?.summary ??
                null,

            resolved:
                payload.mediator
                    ?.resolved ??
                false,

            conclusion:
                payload.mediator
                    ?.conclusion ??
                null
        },

        conclusion:
            payload.conclusion ??
            null,

        createdAt:
            payload.createdAt ??
            payload.created_at ??
            null,

        updatedAt:
            payload.updatedAt ??
            payload.updated_at ??
            null
    }
}


function mergeSubDiscussion(
    current,
    incoming = {}
) {
    const base =
        current ??
        createSubDiscussion(
            incoming
        )

    return {
        ...base,

        ...cloneValue(
            incoming
        ),

        id:
            normalizeId(
                incoming.id ??
                base.id
            ),

        participants:
            Array.isArray(
                incoming.participants
            )
                ? cloneValue(
                    incoming.participants
                )
                : base.participants,

        messages:
            Array.isArray(
                incoming.messages
            )
                ? cloneValue(
                    incoming.messages
                )
                : base.messages,

        mediator: {
            ...base.mediator,

            ...cloneValue(
                incoming.mediator ??
                {}
            ),

            statements:
                Array.isArray(
                    incoming.mediator
                        ?.statements
                )
                    ? cloneValue(
                        incoming.mediator
                            .statements
                    )
                    : base.mediator
                        .statements
        }
    }
}


function createFlowState(payload = {}) {
    return {
        currentSectionId:
            payload.currentSectionId ??
            payload.current_section_id ??
            null,

        currentRound:
            Number(
                payload.currentRound ??
                payload.current_round ??
                1
            ),

        currentCharacterId:
            payload.currentCharacterId ??
            payload.current_character_id ??
            null,

        currentDiscussionId:
            payload.currentDiscussionId ??
            payload.current_discussion_id ??
            null,

        sectionOrder:
            cloneValue(
                asArray(
                    payload.sectionOrder ??
                    payload.section_order
                )
            ),

        completedSectionIds:
            cloneValue(
                asArray(
                    payload.completedSectionIds ??
                    payload.completed_section_ids
                )
            )
    }
}


function createOutcomeState(payload = {}) {
    return {
        confidence:
            payload.confidence ??
            null,

        verdict:
            payload.verdict ??
            null,

        summary:
            payload.summary ??
            null,

        risks:
            cloneValue(
                asArray(
                    payload.risks
                )
            ),

        actions:
            cloneValue(
                asArray(
                    payload.actions
                )
            ),

        unresolvedPoints:
            cloneValue(
                asArray(
                    payload.unresolvedPoints ??
                    payload.unresolved_points
                )
            )
    }
}


/* ==================================================
   MERGE HELPERS
================================================== */

function mergeCharacterState(
    current,
    incoming = {}
) {
    const base =
        current ??
        createCharacterSectionState()

    return {
        ...base,

        ...cloneValue(
            incoming
        ),

        confidence: {
            ...base.confidence,

            ...cloneValue(
                incoming.confidence ??
                {}
            ),

            history:
                Array.isArray(
                    incoming.confidence
                        ?.history
                )
                    ? cloneValue(
                        incoming.confidence
                            .history
                    )
                    : base.confidence
                        .history
        },

        position: {
            ...base.position,

            ...cloneValue(
                incoming.position ??
                {}
            )
        },

        risks:
            Array.isArray(
                incoming.risks
            )
                ? cloneValue(
                    incoming.risks
                )
                : base.risks,

        actions:
            Array.isArray(
                incoming.actions
            )
                ? cloneValue(
                    incoming.actions
                )
                : base.actions,

        agreements:
            Array.isArray(
                incoming.agreements
            )
                ? cloneValue(
                    incoming.agreements
                )
                : base.agreements,

        disagreements:
            Array.isArray(
                incoming.disagreements
            )
                ? cloneValue(
                    incoming.disagreements
                )
                : base.disagreements,

        statementHistory:
            Array.isArray(
                incoming.statementHistory ??
                incoming.statement_history
            )
                ? cloneValue(
                    incoming.statementHistory ??
                    incoming.statement_history
                )
                : base.statementHistory,

        discussions: {
            ...base.discussions,

            ...cloneValue(
                incoming.discussions ??
                {}
            )
        },

        discussionOrder:
            Array.isArray(
                incoming.discussionOrder ??
                incoming.discussion_order
            )
                ? cloneValue(
                    incoming.discussionOrder ??
                    incoming.discussion_order
                )
                : base.discussionOrder
    }
}


function mergeMediatorState(
    current,
    incoming = {}
) {
    const base =
        current ??
        createMediatorSectionState()

    return {
        ...base,

        ...cloneValue(
            incoming
        ),

        statements:
            Array.isArray(
                incoming.statements
            )
                ? cloneValue(
                    incoming.statements
                )
                : base.statements,

        consensus:
            Array.isArray(
                incoming.consensus
            )
                ? cloneValue(
                    incoming.consensus
                )
                : base.consensus,

        disagreements:
            Array.isArray(
                incoming.disagreements
            )
                ? cloneValue(
                    incoming.disagreements
                )
                : base.disagreements,

        unresolvedPoints:
            Array.isArray(
                incoming.unresolvedPoints ??
                incoming.unresolved_points
            )
                ? cloneValue(
                    incoming.unresolvedPoints ??
                    incoming.unresolved_points
                )
                : base.unresolvedPoints,

        questionsForUser:
            Array.isArray(
                incoming.questionsForUser ??
                incoming.questions_for_user
            )
                ? cloneValue(
                    incoming.questionsForUser ??
                    incoming.questions_for_user
                )
                : base.questionsForUser
    }
}


/* ==================================================
   STORE
================================================== */

export const useCurrentDiscussionStore =
    defineStore(
        'currentDiscussion',

        {
            /* ==================================================
               STATE
            ================================================== */

            state: () => ({
                sessionId:
                    null,

                status:
                    'idle',


                /* ==========================================
                   CORE DISCUSSION STATE
                ========================================== */

                brief:
                    createBrief(),

                modelContext:
                    createModelContext(),

                participants:
                    createParticipants(),

                flow:
                    createFlowState(),

                sections:
                    {},

                outcome:
                    createOutcomeState(),


                /* ==========================================
                   REQUEST STATE
                ========================================== */

                isLoading:
                    false,

                isSendingInput:
                    false,

                isGeneratingCharacter:
                    false,

                generatingCharacterIds:
                    {},

                isGeneratingMediator:
                    false,

                isGeneratingInitialRound:
                    false,

                isOpeningDiscussion:
                    false,

                isControllingSession:
                    false,


                /* ==========================================
                   INITIAL ROUND UI PROGRESS
                ========================================== */

                initialRoundProgress: {
                    total: 0,

                    completed: 0,

                    currentCharacterId: null,

                    mediatorPending: false
                },


                error:
                    null
            }),


            /* ==================================================
               GETTERS
            ================================================== */

            getters: {
                hasSession:
                    state =>
                        Boolean(
                            state.sessionId
                        ),


                isBusy:
                    state => (
                        state.isLoading ||

                        state.isSendingInput ||

                        state.isGeneratingCharacter ||

                        state.isGeneratingMediator ||

                        state.isGeneratingInitialRound ||

                        state.isOpeningDiscussion ||

                        state.isControllingSession
                    ),


                canInteract:
                    state =>
                        state.status ===
                        'active',


                isPaused:
                    state =>
                        state.status ===
                        'paused',


                isComplete:
                    state => (
                        state.status ===
                        'completed' ||

                        state.status ===
                        'abandoned'
                    ),


                currentSection(
                    state
                ) {
                    const sectionId =
                        state.flow
                            .currentSectionId

                    if (!sectionId) {
                        return null
                    }

                    return (
                        state.sections[
                            sectionId
                            ] ??
                        null
                    )
                },


                currentRoundState(
                    state
                ) {
                    const sectionId =
                        state.flow
                            .currentSectionId

                    const roundNumber =
                        state.flow
                            .currentRound

                    if (
                        !sectionId ||
                        !roundNumber
                    ) {
                        return null
                    }

                    return (
                        state.sections[
                            sectionId
                            ]?.rounds?.[
                            String(
                                roundNumber
                            )
                            ] ??
                        null
                    )
                },


                currentCharacter(
                    state
                ) {
                    const characterId =
                        state.flow
                            .currentCharacterId

                    if (!characterId) {
                        return null
                    }

                    return (
                        state.participants
                            .characters[
                            characterId
                            ] ??
                        null
                    )
                },


                currentCharacterState(
                    state
                ) {
                    const sectionId =
                        state.flow
                            .currentSectionId

                    const characterId =
                        state.flow
                            .currentCharacterId

                    if (
                        !sectionId ||
                        !characterId
                    ) {
                        return null
                    }

                    return (
                        state.sections[
                            sectionId
                            ]?.characters?.[
                            characterId
                            ] ??
                        null
                    )
                },


                currentDiscussion(
                    state
                ) {
                    const sectionId =
                        state.flow
                            .currentSectionId

                    const discussionId =
                        state.flow
                            .currentDiscussionId

                    if (
                        !sectionId ||
                        !discussionId
                    ) {
                        return null
                    }

                    const section =
                        state.sections[
                            sectionId
                            ]

                    if (!section) {
                        return null
                    }

                    const preferredCharacterId =
                        state.flow
                            .currentCharacterId

                    if (
                        preferredCharacterId
                    ) {
                        const preferred =
                            section.characters?.[
                                preferredCharacterId
                                ]?.discussions?.[
                                discussionId
                                ]

                        if (preferred) {
                            return preferred
                        }
                    }

                    for (
                        const characterState
                        of Object.values(
                        section.characters ??
                        {}
                    )
                        ) {
                        const discussion =
                            characterState
                                ?.discussions?.[
                                discussionId
                                ]

                        if (discussion) {
                            return discussion
                        }
                    }

                    return null
                },


                orderedSections(
                    state
                ) {
                    return state.flow
                        .sectionOrder
                        .map(
                            sectionId =>
                                state.sections[
                                    sectionId
                                    ]
                        )
                        .filter(Boolean)
                },


                activeCharacterIds(
                    state
                ) {
                    return state
                        .participants
                        .characterOrder
                },


                isCharacterGenerating:
                    state =>
                        characterId =>
                            Boolean(
                                state
                                    .generatingCharacterIds[
                                    String(
                                        characterId
                                    )
                                    ]
                            ),


                currentRoundHasResponses(
                    state
                ) {
                    const sectionId =
                        state.flow
                            .currentSectionId

                    const roundNumber =
                        state.flow
                            .currentRound

                    const section =
                        state.sections[
                            sectionId
                            ]

                    if (!section) {
                        return false
                    }

                    return state
                        .participants
                        .characterOrder
                        .some(
                            characterId => {
                                const characterState =
                                    section
                                        .characters?.[
                                        characterId
                                        ]

                                return listHasRoundMessage(
                                    characterState
                                        ?.statementHistory,

                                    roundNumber
                                )
                            }
                        )
                },


                currentRoundHasNoResponses(
                    state
                ) {
                    const sectionId =
                        state.flow
                            .currentSectionId

                    const roundNumber =
                        state.flow
                            .currentRound

                    const section =
                        state.sections[
                            sectionId
                            ]

                    if (!section) {
                        return true
                    }

                    return !state
                        .participants
                        .characterOrder
                        .some(
                            characterId => {
                                const characterState =
                                    section
                                        .characters?.[
                                        characterId
                                        ]

                                return listHasRoundMessage(
                                    characterState
                                        ?.statementHistory,

                                    roundNumber
                                )
                            }
                        )
                },


                charactersMissingCurrentRoundResponse(
                    state
                ) {
                    const sectionId =
                        state.flow
                            .currentSectionId

                    const roundNumber =
                        state.flow
                            .currentRound

                    const section =
                        state.sections[
                            sectionId
                            ]

                    if (!section) {
                        return [
                            ...state
                                .participants
                                .characterOrder
                        ]
                    }

                    return state
                        .participants
                        .characterOrder
                        .filter(
                            characterId => {
                                const characterState =
                                    section
                                        .characters?.[
                                        characterId
                                        ]

                                return !listHasRoundMessage(
                                    characterState
                                        ?.statementHistory,

                                    roundNumber
                                )
                            }
                        )
                },


                mediatorHasCurrentRoundResponse(
                    state
                ) {
                    const sectionId =
                        state.flow
                            .currentSectionId

                    const roundNumber =
                        state.flow
                            .currentRound

                    const section =
                        state.sections[
                            sectionId
                            ]

                    if (!section) {
                        return false
                    }

                    return listHasRoundMessage(
                        section.mediator
                            ?.statements,

                        roundNumber
                    )
                }
            },


            /* ==================================================
               ACTIONS
            ================================================== */

            actions: {
                /* ==================================================
                   INITIALIZATION
                ================================================== */

                initializeFromChamber(
                    options = {}
                ) {
                    const chamberStore =
                        useChamberStore()

                    const session =
                        chamberStore
                            .activeSession ??
                        null

                    const calibration =
                        chamberStore
                            .calibration ??

                        session
                            ?.calibrationContext ??

                        session
                            ?.calibration_context ??

                        {}

                    const aiContext =
                        chamberStore
                            .aiContext ??
                        {}

                    const explicitSessionId =
                        typeof options ===
                        'string'
                            ? options
                            : options
                                ?.sessionId ??
                            null

                    const resolvedSessionId =
                        explicitSessionId ??
                        session?.id ??
                        null

                    if (
                        !resolvedSessionId
                    ) {
                        throw new Error(
                            'No chamber session ID is available.'
                        )
                    }

                    this.resetDiscussion()

                    this.sessionId =
                        resolvedSessionId

                    this.status =
                        session?.status ??
                        'ready'

                    this.flow
                        .currentRound =
                        Number(
                            session
                                ?.currentRound ??

                            session
                                ?.current_round ??

                            1
                        )


                    /* ==========================================
                       BRIEF
                    ========================================== */

                    this.brief =
                        createBrief({
                            topic:
                                calibration
                                    ?.topic ??
                                '',

                            objective:
                                calibration
                                    ?.objective ??
                                '',

                            objectiveId:
                                calibration
                                    ?.objectiveId ??

                                calibration
                                    ?.objective_id ??

                                '',

                            context:
                                calibration
                                    ?.context ??
                                '',

                            approach:
                                calibration
                                    ?.approach ??
                                'balanced',

                            councilMode:
                                calibration
                                    ?.councilMode ??

                                calibration
                                    ?.council_mode ??

                                chamberStore
                                    .councilMode ??

                                session
                                    ?.mode ??

                                null,

                            desiredOutcome:
                                calibration
                                    ?.desiredOutcome ??

                                calibration
                                    ?.desired_outcome ??

                                '',

                            additionalNotes:
                                calibration
                                    ?.additionalNotes ??

                                calibration
                                    ?.additional_notes ??

                                ''
                        })


                    /* ==========================================
                       MODEL CONTEXT
                    ========================================== */

                    const submission =
                        aiContext
                            ?.submission ??

                        calibration ??

                        {}

                    this.modelContext =
                        createModelContext({
                            summary:
                                aiContext
                                    ?.summary ??
                                '',

                            knownFacts:
                                aiContext
                                    ?.knownFacts ??

                                aiContext
                                    ?.known_facts ??

                                [],

                            assumptions:
                                submission
                                    ?.assumptions ??
                                [],

                            constraints:
                                submission
                                    ?.constraints ??
                                [],

                            objectives:
                                this.brief
                                    .objective
                                    ? [
                                        this.brief
                                            .objective
                                    ]
                                    : [],

                            unresolvedQuestions:
                                submission
                                    ?.questions ??
                                [],

                            calibrationSnapshot:
                            submission
                        })


                    /* ==========================================
                       PARTICIPANTS
                    ========================================== */

                    const rawCharacters =
                        session
                            ?.panelMembers ??

                        session
                            ?.panel_snapshot ??

                        aiContext
                            ?.participants
                            ?.panel ??

                        []

                    const characters = {}

                    const characterOrder = []

                    asArray(
                        rawCharacters
                    ).forEach(
                        participant => {
                            const normalized =
                                normalizeParticipant(
                                    participant
                                )

                            if (!normalized) {
                                return
                            }

                            characters[
                                normalized.id
                                ] =
                                normalized

                            characterOrder.push(
                                normalized.id
                            )
                        }
                    )

                    const rawMediator =
                        session?.mediator ??

                        session
                            ?.mediator_snapshot ??

                        aiContext
                            ?.participants
                            ?.mediator ??

                        null

                    this.participants = {
                        characters,

                        characterOrder,

                        mediator:
                            normalizeParticipant(
                                rawMediator
                            )
                    }

                    return true
                },


                /* ==================================================
                   HYDRATE FULL BACKEND SNAPSHOT
                ================================================== */

                hydrate(payload) {
                    if (!payload) {
                        return
                    }

                    const sessionId =
                        payload.sessionId ??

                        payload.session_id ??

                        payload.session
                            ?.id ??

                        null

                    if (sessionId) {
                        this.sessionId =
                            sessionId
                    }

                    const status =
                        payload.status ??

                        payload.session
                            ?.status ??

                        null

                    if (status) {
                        this.status =
                            status
                    }

                    if (payload.brief) {
                        this.brief =
                            createBrief({
                                ...this.brief,

                                ...cloneValue(
                                    payload.brief
                                )
                            })
                    }

                    if (
                        payload.modelContext ??
                        payload.model_context
                    ) {
                        this.modelContext =
                            createModelContext({
                                ...this.modelContext,

                                ...cloneValue(
                                    payload
                                        .modelContext ??

                                    payload
                                        .model_context
                                )
                            })
                    }

                    if (
                        payload.participants
                    ) {
                        this.setParticipants(
                            payload.participants
                        )
                    }

                    if (
                        payload.sections
                    ) {
                        this.setSections(
                            payload.sections
                        )
                    }

                    if (
                        payload.flow
                    ) {
                        this.flow =
                            createFlowState({
                                ...this.flow,

                                ...cloneValue(
                                    payload.flow
                                )
                            })
                    }

                    const currentRound =
                        payload.currentRound ??

                        payload.current_round ??

                        payload.session
                            ?.currentRound ??

                        payload.session
                            ?.current_round ??

                        null

                    if (currentRound) {
                        this.flow
                            .currentRound =
                            Number(
                                currentRound
                            )
                    }

                    if (
                        payload.outcome
                    ) {
                        this.outcome =
                            createOutcomeState({
                                ...this.outcome,

                                ...cloneValue(
                                    payload.outcome
                                )
                            })
                    }
                },


                /* ==================================================
                   PARTICIPANTS
                ================================================== */

                setParticipants(
                    payload = {}
                ) {
                    const rawCharacters =
                        Array.isArray(
                            payload.characters
                        )
                            ? payload.characters

                            : Object.entries(
                                asObject(
                                    payload.characters
                                )
                            ).map(
                                ([
                                     characterId,
                                     participant
                                 ]) => ({
                                    ...asObject(
                                        participant
                                    ),

                                    id:
                                        participant
                                            ?.id ??

                                        characterId
                                })
                            )

                    const characters = {}

                    const discoveredOrder = []

                    rawCharacters.forEach(
                        participant => {
                            const normalized =
                                normalizeParticipant(
                                    participant
                                )

                            if (!normalized) {
                                return
                            }

                            characters[
                                normalized.id
                                ] =
                                normalized

                            discoveredOrder.push(
                                normalized.id
                            )
                        }
                    )

                    const requestedOrder =
                        asArray(
                            payload.characterOrder ??
                            payload.character_order
                        )
                            .map(
                                normalizeId
                            )
                            .filter(
                                id =>
                                    id &&
                                    characters[id]
                            )

                    const remainingIds =
                        discoveredOrder.filter(
                            id =>
                                !requestedOrder
                                    .includes(id)
                        )

                    this.participants = {
                        characters,

                        characterOrder: [
                            ...requestedOrder,

                            ...remainingIds
                        ],

                        mediator:
                            normalizeParticipant(
                                payload.mediator
                            )
                    }
                },


                /* ==================================================
                   SECTIONS
                ================================================== */

                setSections(payload) {
                    const incomingSections =
                        Array.isArray(payload)
                            ? [...payload]
                            : Object.values(
                                asObject(payload)
                            )

                    const sections = {}
                    const order = []

                    incomingSections
                        .sort(
                            (a, b) =>
                                Number(
                                    a?.sequence ?? 0
                                )
                                -
                                Number(
                                    b?.sequence ?? 0
                                )
                        )
                        .forEach(
                            sectionPayload => {
                                const section =
                                    createSection(
                                        sectionPayload,
                                        this.participants
                                            .characterOrder
                                    )

                                /*
                                  Store section by unique ID.
                                */

                                sections[
                                    section.id
                                    ] =
                                    section


                                /*
                                  Do not duplicate the same section ID
                                  in the display order.
                                */

                                if (
                                    !order.includes(
                                        section.id
                                    )
                                ) {
                                    order.push(
                                        section.id
                                    )
                                }
                            }
                        )

                    this.sections =
                        sections

                    this.flow.sectionOrder =
                        order

                    if (
                        !this.flow.currentSectionId
                        ||
                        !sections[
                            this.flow.currentSectionId
                            ]
                    ) {
                        this.flow.currentSectionId =
                            order[0] ?? null
                    }
                },


                upsertSection(payload) {
                    if (!payload?.id) {
                        return
                    }

                    const sectionId =
                        String(
                            payload.id
                        )

                    const current =
                        this.sections[
                            sectionId
                            ]

                    if (!current) {
                        const created =
                            createSection(
                                payload,

                                this.participants
                                    .characterOrder
                            )

                        this.sections[
                            created.id
                            ] =
                            created

                        if (
                            !this.flow
                                .sectionOrder
                                .includes(
                                    created.id
                                )
                        ) {
                            this.flow
                                .sectionOrder
                                .push(
                                    created.id
                                )
                        }

                        return
                    }

                    const updated = {
                        ...current,

                        ...cloneValue(
                            payload
                        ),

                        id:
                        sectionId,

                        characters: {
                            ...current.characters
                        },

                        rounds: {
                            ...current.rounds
                        },

                        user: {
                            ...current.user
                        },

                        mediator: {
                            ...current.mediator
                        }
                    }

                    Object.entries(
                        asObject(
                            payload.characters
                        )
                    ).forEach(
                        ([
                             characterId,
                             characterState
                         ]) => {
                            const id =
                                String(
                                    characterId
                                )

                            updated
                                .characters[id] =
                                mergeCharacterState(
                                    current
                                        .characters[id],

                                    characterState
                                )
                        }
                    )

                    Object.entries(
                        asObject(
                            payload.rounds
                        )
                    ).forEach(
                        ([
                             roundKey,
                             roundState
                         ]) => {
                            const resolvedKey =
                                String(
                                    roundState
                                        ?.number ??

                                    roundKey
                                )

                            updated
                                .rounds[
                                resolvedKey
                                ] =
                                mergeRoundState(
                                    current
                                        .rounds?.[
                                        resolvedKey
                                        ],

                                    {
                                        ...roundState,

                                        number:
                                            Number(
                                                resolvedKey
                                            )
                                    }
                                )
                        }
                    )

                    if (
                        payload.user
                    ) {
                        updated.user = {
                            ...current.user,

                            ...cloneValue(
                                payload.user
                            ),

                            messages:
                                Array.isArray(
                                    payload.user
                                        .messages
                                )
                                    ? cloneValue(
                                        payload.user
                                            .messages
                                    )
                                    : current.user
                                        .messages
                        }
                    }

                    if (
                        payload.mediator
                    ) {
                        updated.mediator =
                            mergeMediatorState(
                                current.mediator,

                                payload.mediator
                            )
                    }

                    this.sections[
                        sectionId
                        ] =
                        updated
                },


                /* ==================================================
                   FLOW SELECTION
                ================================================== */

                setCurrentSection(
                    sectionId
                ) {
                    const id =
                        normalizeId(
                            sectionId
                        )

                    if (
                        !id ||
                        !this.sections[id]
                    ) {
                        return false
                    }

                    this.flow
                        .currentSectionId =
                        id

                    this.flow
                        .currentCharacterId =
                        null

                    this.flow
                        .currentDiscussionId =
                        null

                    return true
                },


                setCurrentCharacter(
                    characterId
                ) {
                    const id =
                        normalizeId(
                            characterId
                        )

                    if (
                        !id ||

                        !this
                            .participants
                            .characters[id]
                    ) {
                        return false
                    }

                    this.flow
                        .currentCharacterId =
                        id

                    this.flow
                        .currentDiscussionId =
                        null

                    return true
                },


                setCurrentDiscussion({
                                         characterId,
                                         discussionId
                                     }) {
                    const sectionId =
                        this.flow
                            .currentSectionId

                    const characterKey =
                        normalizeId(
                            characterId
                        )

                    const discussionKey =
                        normalizeId(
                            discussionId
                        )

                    const discussion =
                        this.sections[
                            sectionId
                            ]?.characters?.[
                            characterKey
                            ]?.discussions?.[
                            discussionKey
                            ]

                    if (!discussion) {
                        return false
                    }

                    this.flow
                        .currentCharacterId =
                        characterKey

                    this.flow
                        .currentDiscussionId =
                        discussionKey

                    return true
                },


                closeCurrentDiscussion() {
                    this.flow
                        .currentDiscussionId =
                        null
                },


                /* ==================================================
                   LOCAL REACTIONS
                ================================================== */

                setMemberReaction(
                    characterId,
                    reaction
                ) {
                    const id =
                        normalizeId(
                            characterId
                        )

                    const validReactions = [
                        'agree',

                        'disagree',

                        null
                    ]

                    if (
                        !validReactions
                            .includes(
                                reaction
                            )
                    ) {
                        throw new Error(
                            'Reaction must be agree, disagree, or null.'
                        )
                    }

                    if (
                        !id ||

                        !this
                            .participants
                            .characters[id]
                    ) {
                        return false
                    }

                    if (
                        this.status !==
                        'active'
                    ) {
                        return false
                    }

                    const sectionId =
                        this.flow
                            .currentSectionId

                    const roundKey =
                        String(
                            this.flow
                                .currentRound
                        )

                    const round =
                        this.sections[
                            sectionId
                            ]?.rounds?.[
                            roundKey
                            ]

                    if (!round) {
                        return false
                    }

                    round.reactions[id] =
                        round.reactions[id] ===
                        reaction
                            ? null
                            : reaction

                    return true
                },


                async replyToCouncil(
                    content
                ) {
                    return this.sendUserInput({
                        content,

                        inputType:
                            'council_reply',

                        targetType:
                            'section'
                    })
                },


                async presentOpposingView(
                    content
                ) {
                    return this.sendUserInput({
                        content,

                        inputType:
                            'opposing_view',

                        targetType:
                            'section'
                    })
                },


                /* ==================================================
                   REQUEST CONTEXT
                ================================================== */

                buildRequestContext({
                                        sectionId = null,
                                        characterId = null,
                                        discussionId = null
                                    } = {}) {
                    const resolvedSectionId =
                        normalizeId(
                            sectionId
                        ) ??

                        this.flow
                            .currentSectionId

                    const resolvedCharacterId =
                        normalizeId(
                            characterId
                        ) ??

                        this.flow
                            .currentCharacterId

                    const resolvedDiscussionId =
                        normalizeId(
                            discussionId
                        ) ??

                        this.flow
                            .currentDiscussionId

                    const section =
                        resolvedSectionId
                            ? this.sections[
                                resolvedSectionId
                                ]

                            : null

                    const roundNumber =
                        this.flow
                            .currentRound

                    const round =
                        section
                            ?.rounds?.[
                            String(
                                roundNumber
                            )
                            ] ??
                        null

                    const character =
                        resolvedCharacterId
                            ? this.participants
                                .characters[
                                resolvedCharacterId
                                ]

                            : null

                    const characterState =
                        (
                            section &&
                            resolvedCharacterId
                        )
                            ? section
                                .characters?.[
                                resolvedCharacterId
                                ] ??
                            null

                            : null

                    const discussion =
                        (
                            characterState &&
                            resolvedDiscussionId
                        )
                            ? characterState
                                .discussions?.[
                                resolvedDiscussionId
                                ] ??
                            null

                            : null

                    return {
                        session: {
                            id:
                            this.sessionId,

                            status:
                            this.status
                        },

                        brief:
                            cloneValue(
                                this.brief
                            ),

                        modelContext:
                            cloneValue(
                                this.modelContext
                            ),

                        participants:
                            cloneValue(
                                this.participants
                            ),

                        active: {
                            sectionId:
                            resolvedSectionId,

                            roundNumber,

                            characterId:
                            resolvedCharacterId,

                            discussionId:
                            resolvedDiscussionId
                        },

                        section:
                            section
                                ? cloneValue(
                                    section
                                )
                                : null,

                        round:
                            round
                                ? cloneValue(
                                    round
                                )
                                : null,

                        character:
                            character
                                ? cloneValue(
                                    character
                                )
                                : null,

                        characterState:
                            characterState
                                ? cloneValue(
                                    characterState
                                )
                                : null,

                        discussion:
                            discussion
                                ? cloneValue(
                                    discussion
                                )
                                : null
                    }
                },


                /* ==================================================
                   LOAD DISCUSSION
                ================================================== */

                /* ==================================================
   LOAD DISCUSSION
================================================== */

                async loadDiscussion(sessionId = null) {

                    /*
                      Prefer the explicitly supplied session ID.

                      Fall back to the session already stored in the
                      discussion store when the scene reloads an
                      existing active discussion.
                    */

                    const resolvedSessionId =
                        normalizeId(
                            sessionId
                        ) ??

                        normalizeId(
                            this.sessionId
                        )


                    /*
                      Draft session IDs exist only on the frontend.

                      They must never be sent to Django.
                    */

                    if (
                        !resolvedSessionId ||

                        String(
                            resolvedSessionId
                        ).startsWith(
                            'draft-'
                        )
                    ) {

                        console.debug(
                            '[CurrentDiscussion] Skipping discussion load for local draft:',
                            resolvedSessionId
                        )

                        return null
                    }


                    this.isLoading =
                        true

                    this.error =
                        null


                    console.log(
                        '[CurrentDiscussion] Loading discussion:',
                        {
                            sessionId:
                            resolvedSessionId
                        }
                    )


                    try {

                        const {
                            data
                        } =
                            await api.get(
                                `/chamber/sessions/${resolvedSessionId}/discussion/`
                            )


                        console.log(
                            '[CurrentDiscussion] Discussion snapshot received:',
                            data
                        )


                        /*
                          CRITICAL:

                          The previous implementation returned the backend
                          payload without applying it to the Pinia store.

                          That meant:

                          - sections remained empty
                          - currentSectionId remained null
                          - backend session status was not synchronized
                          - participant response state was not synchronized
                          - initial round generation had no active section
                        */

                        this.applyBackendUpdate(
                            data
                        )


                        /*
                          Keep the resolved session ID available even if an
                          unusual backend response omits it from the snapshot.
                        */

                        if (
                            !this.sessionId
                        ) {
                            this.sessionId =
                                resolvedSessionId
                        }


                        console.log(
                            '[CurrentDiscussion] Discussion hydrated:',
                            {
                                sessionId:
                                this.sessionId,

                                status:
                                this.status,

                                currentSectionId:
                                this.flow
                                    .currentSectionId,

                                currentRound:
                                this.flow
                                    .currentRound,

                                sectionCount:
                                Object.keys(
                                    this.sections
                                ).length,

                                characterCount:
                                this.participants
                                    .characterOrder
                                    .length,

                                missingResponses:
                                    [
                                        ...this
                                            .charactersMissingCurrentRoundResponse
                                    ],

                                mediatorHasResponse:
                                this
                                    .mediatorHasCurrentRoundResponse
                            }
                        )


                        return data

                    } catch (error) {

                        this.setError(
                            error
                        )


                        console.error(
                            '[CurrentDiscussion] Discussion load failed:',
                            {
                                sessionId:
                                resolvedSessionId,

                                error
                            }
                        )


                        throw error

                    } finally {

                        this.isLoading =
                            false
                    }
                },


                /* ==================================================
                   INITIAL ROUND ORCHESTRATION

                   Temporary frontend orchestration until
                   the backend owns full initial-round
                   generation in one endpoint.
                ================================================== */

                async generateInitialRound({
                                               task = null,

                                               mediatorResponseType =
                                               'round_summary'
                                           } = {}) {
                    if (
                        !this.sessionId
                    ) {
                        throw new Error(
                            'No active discussion session exists.'
                        )
                    }

                    if (
                        this.status !==
                        'active'
                    ) {
                        throw new Error(
                            'The discussion must be active before generating a round.'
                        )
                    }


                    const resolvedTask =
                        task ??
                        (
                            Number(
                                this.flow
                                    .currentRound
                            ) > 1
                                ? 'continue_debate'
                                : 'initial_position'
                        )


                    const initialMissingCharacterIds = [
                        ...this
                            .charactersMissingCurrentRoundResponse
                    ]


                    const mediatorInitiallyMissing =
                        !this
                            .mediatorHasCurrentRoundResponse


                    this.isGeneratingInitialRound =
                        true

                    this.error =
                        null


                    this.initialRoundProgress = {
                        total:
                            initialMissingCharacterIds
                                .length +

                            (
                                mediatorInitiallyMissing
                                    ? 1
                                    : 0
                            ),

                        completed:
                            0,

                        currentCharacterId:
                            null,

                        mediatorPending:
                        mediatorInitiallyMissing
                    }


                    /*
                      A round used to have one outer try/catch around
                      the complete sequential character loop.

                      That meant one transient request failure stopped:

                          the current character
                          every later character
                          mediator synthesis

                      The UI then showed already-completed members plus
                      plain WAITING cards forever.

                      Run generation in bounded passes instead:

                          pass 1
                              attempt every missing member

                          failed request
                              reload authoritative Django state
                              continue to the next member

                          pass 2
                              retry only members still genuinely missing

                      Rehydrating before retry is important. A request
                      may have completed and persisted server-side while
                      the browser lost the response. Reloading prevents
                      blindly creating a duplicate answer.
                    */


                    const failedCharacters =
                        new Map()


                    const completedCharacterIds =
                        new Set()


                    const reconcileFromBackend =
                        async (
                            characterId,
                            error
                        ) => {

                            console.warn(
                                '[CurrentDiscussion] Character generation request failed. Reconciling discussion state:',
                                {
                                    characterId,

                                    round:
                                    this.flow
                                        .currentRound,

                                    error
                                }
                            )


                            try {

                                await this
                                    .loadDiscussion(
                                        this.sessionId
                                    )


                                return (
                                    !this
                                        .charactersMissingCurrentRoundResponse
                                        .includes(
                                            String(
                                                characterId
                                            )
                                        )
                                )

                            } catch (
                                reconciliationError
                                ) {

                                console.error(
                                    '[CurrentDiscussion] Discussion reconciliation failed:',
                                    {
                                        characterId,

                                        reconciliationError
                                    }
                                )


                                return false
                            }
                        }


                    const generateCharacterPass =
                        async (
                            characterIds,
                            passNumber
                        ) => {

                            for (
                                const characterId
                                of characterIds
                                ) {

                                const normalizedCharacterId =
                                    String(
                                        characterId
                                    )


                                /*
                                  A previous request or reconciliation may
                                  already have filled this response.
                                */

                                if (
                                    !this
                                        .charactersMissingCurrentRoundResponse
                                        .includes(
                                            normalizedCharacterId
                                        )
                                ) {

                                    if (
                                        !completedCharacterIds
                                            .has(
                                                normalizedCharacterId
                                            )
                                    ) {
                                        completedCharacterIds
                                            .add(
                                                normalizedCharacterId
                                            )

                                        this.initialRoundProgress
                                            .completed +=
                                            1
                                    }


                                    continue
                                }


                                this.initialRoundProgress
                                    .currentCharacterId =
                                    normalizedCharacterId


                                try {

                                    await this
                                        .requestCharacterResponse(
                                            normalizedCharacterId,

                                            {
                                                task:
                                                resolvedTask
                                            }
                                        )


                                    failedCharacters
                                        .delete(
                                            normalizedCharacterId
                                        )


                                    if (
                                        !completedCharacterIds
                                            .has(
                                                normalizedCharacterId
                                            )
                                    ) {
                                        completedCharacterIds
                                            .add(
                                                normalizedCharacterId
                                            )

                                        this.initialRoundProgress
                                            .completed +=
                                            1
                                    }

                                } catch (
                                    error
                                    ) {

                                    const reconciled =
                                        await reconcileFromBackend(
                                            normalizedCharacterId,
                                            error
                                        )


                                    if (
                                        reconciled
                                    ) {

                                        failedCharacters
                                            .delete(
                                                normalizedCharacterId
                                            )


                                        if (
                                            !completedCharacterIds
                                                .has(
                                                    normalizedCharacterId
                                                )
                                        ) {
                                            completedCharacterIds
                                                .add(
                                                    normalizedCharacterId
                                                )

                                            this.initialRoundProgress
                                                .completed +=
                                                1
                                        }


                                        continue
                                    }


                                    failedCharacters
                                        .set(
                                            normalizedCharacterId,

                                            {
                                                error,

                                                passNumber
                                            }
                                        )


                                    /*
                                      Deliberately continue.

                                      One model/API failure must not prevent
                                      later council members from responding.
                                    */

                                    continue
                                }
                            }
                        }


                    try {

                        /* ==========================================
                           PASS 1
                        ========================================== */

                        await generateCharacterPass(
                            initialMissingCharacterIds,
                            1
                        )


                        /* ==========================================
                           PASS 2 — ONLY STILL-MISSING MEMBERS
                        ========================================== */

                        const retryCharacterIds = [
                            ...this
                                .charactersMissingCurrentRoundResponse
                        ]


                        if (
                            retryCharacterIds
                                .length
                        ) {

                            console.warn(
                                '[CurrentDiscussion] Retrying missing council responses:',
                                {
                                    round:
                                    this.flow
                                        .currentRound,

                                    characterIds:
                                    retryCharacterIds
                                }
                            )


                            await generateCharacterPass(
                                retryCharacterIds,
                                2
                            )
                        }


                        this.initialRoundProgress
                            .currentCharacterId =
                            null


                        /* ==========================================
                           FINAL CHARACTER RECONCILIATION
                        ========================================== */

                        const remainingCharacterIds = [
                            ...this
                                .charactersMissingCurrentRoundResponse
                        ]


                        if (
                            remainingCharacterIds
                                .length
                        ) {

                            const lastFailure =
                                failedCharacters
                                    .get(
                                        String(
                                            remainingCharacterIds[0]
                                        )
                                    )
                                    ?.error


                            const generationError =
                                new Error(
                                    `Council generation is incomplete. Missing responses from: ${remainingCharacterIds.join(', ')}`
                                )


                            generationError
                                .cause =
                                lastFailure


                            this.setError(
                                generationError
                            )


                            console.error(
                                '[CurrentDiscussion] Council generation remained incomplete after bounded retries:',
                                {
                                    round:
                                    this.flow
                                        .currentRound,

                                    remainingCharacterIds,

                                    failures:
                                        Object.fromEntries(
                                            failedCharacters
                                        )
                                }
                            )


                            /*
                              Do not synthesize an incomplete council.

                              Return a partial result instead of throwing
                              away every response that did succeed. The
                              existing retry action can safely resume from
                              only the still-missing members.
                            */

                            return {
                                complete:
                                    false,

                                missingCharacterIds:
                                remainingCharacterIds,

                                mediatorGenerated:
                                    false
                            }
                        }


                        /* ==========================================
                           MEDIATOR
                        ========================================== */

                        const needsMediator =
                            !this
                                .mediatorHasCurrentRoundResponse


                        this.initialRoundProgress
                            .mediatorPending =
                            needsMediator


                        if (
                            needsMediator
                        ) {

                            try {

                                await this
                                    .requestMediatorResponse({
                                        responseType:
                                        mediatorResponseType
                                    })


                                this.initialRoundProgress
                                    .completed +=
                                    1


                                this.initialRoundProgress
                                    .mediatorPending =
                                    false

                            } catch (
                                error
                                ) {

                                /*
                                  The mediator request may also have
                                  persisted successfully before the browser
                                  lost the response. Rehydrate once before
                                  declaring it missing.
                                */

                                try {

                                    await this
                                        .loadDiscussion(
                                            this.sessionId
                                        )

                                } catch (
                                    reconciliationError
                                    ) {

                                    console.error(
                                        '[CurrentDiscussion] Mediator reconciliation failed:',
                                        reconciliationError
                                    )
                                }


                                if (
                                    !this
                                        .mediatorHasCurrentRoundResponse
                                ) {

                                    this.setError(
                                        error
                                    )


                                    return {
                                        complete:
                                            false,

                                        missingCharacterIds:
                                            [],

                                        mediatorGenerated:
                                            false
                                    }
                                }


                                this.initialRoundProgress
                                    .completed +=
                                    1


                                this.initialRoundProgress
                                    .mediatorPending =
                                    false
                            }
                        }


                        this.error =
                            null


                        return {
                            complete:
                                true,

                            missingCharacterIds:
                                [],

                            mediatorGenerated:
                                true
                        }

                    } finally {

                        this.initialRoundProgress
                            .currentCharacterId =
                            null


                        this.isGeneratingInitialRound =
                            false
                    }
                },


                /* ==================================================
                   USER INPUT
                ================================================== */

                async sendUserInput({
                                        content,

                                        inputType =
                                        'council_reply',

                                        sectionId =
                                        null,

                                        targetType =
                                        'section',

                                        targetCharacterId =
                                        null,

                                        discussionId =
                                        null
                                    }) {
                    const cleanContent =
                        content?.trim()

                    if (!cleanContent) {
                        return null
                    }

                    if (
                        !this.sessionId
                    ) {
                        throw new Error(
                            'No active discussion session exists.'
                        )
                    }

                    if (
                        this.status !==
                        'active'
                    ) {
                        throw new Error(
                            'The discussion is not currently active.'
                        )
                    }

                    const resolvedSectionId =
                        normalizeId(
                            sectionId
                        ) ??

                        this.flow
                            .currentSectionId

                    if (
                        !resolvedSectionId
                    ) {
                        throw new Error(
                            'No active discussion section exists.'
                        )
                    }

                    this.isSendingInput =
                        true

                    this.error =
                        null

                    try {
                        const context =
                            this.buildRequestContext({
                                sectionId:
                                resolvedSectionId,

                                characterId:
                                targetCharacterId,

                                discussionId
                            })

                        const {
                            data
                        } =
                            await api.post(
                                `/chamber/sessions/${this.sessionId}/discussion/input/`,

                                {
                                    context,

                                    input: {
                                        content:
                                        cleanContent,

                                        inputType,

                                        targetType,

                                        targetCharacterId,

                                        discussionId
                                    }
                                }
                            )

                        this.applyBackendUpdate(
                            data
                        )

                        return data

                    } catch (error) {
                        this.setError(
                            error
                        )

                        throw error

                    } finally {
                        this.isSendingInput =
                            false
                    }
                },


                /* ==================================================
                   CHARACTER GENERATION
                ================================================== */

                async requestCharacterResponse(
                    characterId,

                    {
                        sectionId =
                        null,

                        discussionId =
                        null,

                        task =
                        'respond'
                    } = {}
                ) {
                    const id =
                        normalizeId(
                            characterId
                        )

                    if (!id) {
                        throw new Error(
                            'Character ID is required.'
                        )
                    }

                    if (
                        !this
                            .participants
                            .characters[id]
                    ) {
                        throw new Error(
                            `Character ${id} does not belong to this discussion.`
                        )
                    }

                    if (
                        !this.sessionId
                    ) {
                        throw new Error(
                            'No active discussion session exists.'
                        )
                    }

                    if (
                        this.status !==
                        'active'
                    ) {
                        throw new Error(
                            'Character responses can only be generated for an active discussion.'
                        )
                    }

                    const resolvedSectionId =
                        normalizeId(
                            sectionId
                        ) ??

                        this.flow
                            .currentSectionId

                    if (
                        !resolvedSectionId
                    ) {
                        throw new Error(
                            'No active section exists.'
                        )
                    }

                    this.generatingCharacterIds = {
                        ...this
                            .generatingCharacterIds,

                        [id]:
                            true
                    }

                    this.isGeneratingCharacter =
                        true

                    this.error =
                        null

                    this.flow
                        .currentCharacterId =
                        id

                    try {
                        console.log(
                            '[CurrentDiscussion] Building request context:',
                            {
                                characterId:
                                id,

                                sectionId:
                                resolvedSectionId,

                                sessionId:
                                this.sessionId
                            }
                        )
                        const context =
                            this.buildRequestContext({
                                sectionId:
                                resolvedSectionId,

                                characterId:
                                id,

                                discussionId
                            })

                        const {
                            data
                        } =
                            await api.post(
                                `/chamber/sessions/${this.sessionId}/discussion/character-response/`,

                                {
                                    context,

                                    request: {
                                        task,

                                        characterId:
                                        id,

                                        sectionId:
                                        resolvedSectionId,

                                        discussionId
                                    }
                                }
                            )

                        this.applyBackendUpdate(
                            data
                        )

                        return data

                    } catch (error) {
                        this.setError(
                            error
                        )

                        throw error

                    } finally {
                        const next = {
                            ...this
                                .generatingCharacterIds
                        }

                        delete next[id]

                        this.generatingCharacterIds =
                            next

                        this.isGeneratingCharacter =
                            Object.values(
                                next
                            ).some(Boolean)
                    }
                },


                /* ==================================================
                   MEDIATOR GENERATION
                ================================================== */

                async requestMediatorResponse({
                                                  sectionId =
                                                  null,

                                                  discussionId =
                                                  null,

                                                  responseType =
                                                  'synthesis'
                                              } = {}) {
                    if (
                        !this.sessionId
                    ) {
                        throw new Error(
                            'No active discussion session exists.'
                        )
                    }

                    if (
                        this.status !==
                        'active'
                    ) {
                        throw new Error(
                            'Mediator responses can only be generated for an active discussion.'
                        )
                    }

                    const resolvedSectionId =
                        normalizeId(
                            sectionId
                        ) ??

                        this.flow
                            .currentSectionId

                    if (
                        !resolvedSectionId
                    ) {
                        throw new Error(
                            'No active section exists.'
                        )
                    }

                    this.isGeneratingMediator =
                        true

                    this.error =
                        null

                    try {
                        const context =
                            this.buildRequestContext({
                                sectionId:
                                resolvedSectionId,

                                discussionId
                            })

                        const {
                            data
                        } =
                            await api.post(
                                `/chamber/sessions/${this.sessionId}/discussion/mediator-response/`,

                                {
                                    context,

                                    request: {
                                        responseType,

                                        sectionId:
                                        resolvedSectionId,

                                        discussionId
                                    }
                                }
                            )

                        this.applyBackendUpdate(
                            data
                        )

                        return data

                    } catch (error) {
                        this.setError(
                            error
                        )

                        throw error

                    } finally {
                        this.isGeneratingMediator =
                            false
                    }
                },


                /* ==================================================
                   FOCUSED DISCUSSION
                ================================================== */

                async openSubDiscussion({
                                            characterId,

                                            sourceType,

                                            sourceId,

                                            topic,

                                            sectionId =
                                            null
                                        }) {
                    const id =
                        normalizeId(
                            characterId
                        )

                    if (!id) {
                        throw new Error(
                            'Character ID is required.'
                        )
                    }

                    if (
                        !this.sessionId
                    ) {
                        throw new Error(
                            'No active discussion session exists.'
                        )
                    }

                    if (
                        this.status !==
                        'active'
                    ) {
                        throw new Error(
                            'Focused discussions can only be opened while the session is active.'
                        )
                    }

                    const resolvedSectionId =
                        normalizeId(
                            sectionId
                        ) ??

                        this.flow
                            .currentSectionId

                    if (
                        !resolvedSectionId
                    ) {
                        throw new Error(
                            'No active section exists.'
                        )
                    }

                    /*
                      Focus the exact requested character before the
                      network call starts.

                      flow.currentCharacterId is shared with normal
                      round generation. Without this assignment the
                      opening UI can inherit the last generated council
                      member and show the wrong person as typing.
                    */

                    const previousCharacterId =
                        this.flow
                            .currentCharacterId

                    const previousDiscussionId =
                        this.flow
                            .currentDiscussionId


                    this.flow = {
                        ...this.flow,

                        currentCharacterId:
                        id,

                        currentDiscussionId:
                            null
                    }


                    this.isOpeningDiscussion =
                        true

                    this.error =
                        null

                    try {
                        const context =
                            this.buildRequestContext({
                                sectionId:
                                resolvedSectionId,

                                characterId:
                                id
                            })

                        const {
                            data
                        } =
                            await api.post(
                                `/chamber/sessions/${this.sessionId}/discussion/open-sub-discussion/`,

                                {
                                    context,

                                    request: {
                                        sectionId:
                                        resolvedSectionId,

                                        characterId:
                                        id,

                                        sourceType,

                                        sourceId,

                                        topic
                                    }
                                }
                            )

                        this.applyBackendUpdate(
                            data
                        )

                        const discussionId =
                            normalizeId(
                                data.discussion
                                    ?.id ??

                                data.subDiscussion
                                    ?.id ??

                                data.discussionId ??

                                null
                            )

                        if (discussionId) {
                            this.flow
                                .currentCharacterId =
                                id

                            this.flow
                                .currentDiscussionId =
                                discussionId
                        }

                        return data

                    } catch (error) {

                        /*
                          The branch did not open.

                          Restore the previous focused pointer so a
                          failed request does not leave the sidebar
                          pretending the clicked character owns an
                          active focused discussion.
                        */

                        this.flow = {
                            ...this.flow,

                            currentCharacterId:
                            previousCharacterId,

                            currentDiscussionId:
                            previousDiscussionId
                        }


                        this.setError(
                            error
                        )

                        throw error

                    } finally {
                        this.isOpeningDiscussion =
                            false
                    }
                },


                async continueSubDiscussion({
                                                content,

                                                characterId =
                                                null,

                                                discussionId =
                                                null
                                            }) {
                    const resolvedCharacterId =
                        normalizeId(
                            characterId
                        ) ??

                        this.flow
                            .currentCharacterId

                    const resolvedDiscussionId =
                        normalizeId(
                            discussionId
                        ) ??

                        this.flow
                            .currentDiscussionId

                    if (
                        !resolvedCharacterId ||
                        !resolvedDiscussionId
                    ) {
                        throw new Error(
                            'No active focused discussion exists.'
                        )
                    }

                    return this.sendUserInput({
                        content,

                        inputType:
                            'focused_discussion_message',

                        targetType:
                            'discussion',

                        targetCharacterId:
                        resolvedCharacterId,

                        discussionId:
                        resolvedDiscussionId
                    })
                },


                upsertSubDiscussion({
                                        sectionId,

                                        characterId,

                                        discussion
                                    }) {
                    const section =
                        this.sections[
                            sectionId
                            ]

                    const id =
                        normalizeId(
                            characterId
                        )

                    if (
                        !section ||
                        !id ||
                        !discussion
                    ) {
                        return
                    }

                    if (
                        !section
                            .characters[id]
                    ) {
                        section.characters[id] =
                            createCharacterSectionState()
                    }

                    const characterState =
                        section
                            .characters[id]

                    const discussionId =
                        normalizeId(
                            discussion.id
                        )

                    if (!discussionId) {
                        return
                    }

                    characterState
                        .discussions[
                        discussionId
                        ] =
                        mergeSubDiscussion(
                            characterState
                                .discussions[
                                discussionId
                                ],

                            discussion
                        )

                    if (
                        !characterState
                            .discussionOrder
                            .includes(
                                discussionId
                            )
                    ) {
                        characterState
                            .discussionOrder
                            .push(
                                discussionId
                            )
                    }
                },


                /* ==================================================
                   SESSION CONTROL
                ================================================== */

                async sendSessionControl(
                    action
                ) {
                    if (
                        !this.sessionId
                    ) {
                        throw new Error(
                            'No active discussion session exists.'
                        )
                    }

                    const validActions = [
                        'next_round',

                        'pause',

                        'resume',

                        'end'
                    ]

                    if (
                        !validActions
                            .includes(
                                action
                            )
                    ) {
                        throw new Error(
                            `Unsupported session action: ${action}`
                        )
                    }

                    this.isControllingSession =
                        true

                    this.error =
                        null

                    try {
                        const context =
                            this.buildRequestContext()

                        const {
                            data
                        } =
                            await api.post(
                                `/chamber/sessions/${this.sessionId}/discussion/control/`,

                                {
                                    context,

                                    action
                                }
                            )

                        this.applyBackendUpdate(
                            data
                        )

                        return data

                    } catch (error) {
                        this.setError(
                            error
                        )

                        throw error

                    } finally {
                        this.isControllingSession =
                            false
                    }
                },


                async advanceRound() {
                    if (
                        this.status !==
                        'active'
                    ) {
                        throw new Error(
                            'Only an active discussion can advance to the next round.'
                        )
                    }


                    const previousSectionId =
                        this.flow
                            .currentSectionId


                    const data =
                        await this
                            .sendSessionControl(
                                'next_round'
                            )


                    if (
                        previousSectionId &&
                        this.sections[
                            previousSectionId
                            ]
                    ) {
                        this.sections[
                            previousSectionId
                            ].status =
                            'complete'


                        if (
                            !this.flow
                                .completedSectionIds
                                .includes(
                                    previousSectionId
                                )
                        ) {
                            this.flow
                                .completedSectionIds
                                .push(
                                    previousSectionId
                                )
                        }
                    }


                    /*
                      Generate whichever responses are missing for the
                      newly-active round.

                      This is safe even if a view also calls
                      generateInitialRound(), because that action checks
                      the current round and only requests missing responses.
                    */

                    await this
                        .generateInitialRound({
                            task:
                                'continue_debate',

                            mediatorResponseType:
                                'round_summary'
                        })


                    return data
                },


                async pauseSession() {
                    if (
                        this.status !==
                        'active'
                    ) {
                        throw new Error(
                            'Only an active discussion can be paused.'
                        )
                    }

                    return this
                        .sendSessionControl(
                            'pause'
                        )
                },


                async resumeSession() {
                    if (
                        this.status !==
                        'paused'
                    ) {
                        throw new Error(
                            'Only a paused discussion can be resumed.'
                        )
                    }

                    return this
                        .sendSessionControl(
                            'resume'
                        )
                },


                async endSession() {
                    if (
                        this.status ===
                        'completed' ||

                        this.status ===
                        'abandoned'
                    ) {
                        return null
                    }

                    return this
                        .sendSessionControl(
                            'end'
                        )
                },


                /* ==================================================
                   UPDATE MERGING
                ================================================== */

                applyRoundUpdate({
                                     sectionId,

                                     roundNumber,

                                     round
                                 }) {
                    const resolvedSectionId =
                        normalizeId(
                            sectionId
                        ) ??

                        this.flow
                            .currentSectionId

                    const section =
                        this.sections[
                            resolvedSectionId
                            ]

                    if (
                        !section ||
                        !round
                    ) {
                        return
                    }

                    const resolvedRoundNumber =
                        Number(
                            roundNumber ??
                            round.number
                        )

                    if (
                        !resolvedRoundNumber
                    ) {
                        return
                    }

                    const roundKey =
                        String(
                            resolvedRoundNumber
                        )

                    section.rounds[
                        roundKey
                        ] =
                        mergeRoundState(
                            section.rounds[
                                roundKey
                                ],

                            {
                                ...round,

                                number:
                                resolvedRoundNumber
                            }
                        )
                },


                applyCharacterUpdate({
                                         sectionId,

                                         characterId,

                                         characterState
                                     }) {
                    const resolvedSectionId =
                        normalizeId(
                            sectionId
                        ) ??

                        this.flow
                            .currentSectionId

                    const id =
                        normalizeId(
                            characterId
                        )

                    const section =
                        this.sections[
                            resolvedSectionId
                            ]

                    if (
                        !section ||
                        !id ||
                        !characterState
                    ) {
                        return
                    }


                    /*
                      Replace the section/characters containers
                      rather than mutating a nested character slot
                      in place.

                      Vue 3 can track nested assignments, but the
                      discussion UI derives multiple computed view
                      models from the current section. Replacing the
                      containers gives every dependent computed value
                      an explicit reactive identity change as soon as
                      a backend character update arrives.
                    */

                    this.sections[
                        resolvedSectionId
                        ] = {

                        ...section,

                        characters: {

                            ...section.characters,

                            [id]:
                                mergeCharacterState(
                                    section.characters[id],

                                    characterState
                                )
                        }
                    }
                },


                applyMediatorUpdate({
                                        sectionId,

                                        mediator
                                    }) {
                    const resolvedSectionId =
                        normalizeId(
                            sectionId
                        ) ??

                        this.flow
                            .currentSectionId

                    const section =
                        this.sections[
                            resolvedSectionId
                            ]

                    if (
                        !section ||
                        !mediator
                    ) {
                        return
                    }

                    section.mediator =
                        mergeMediatorState(
                            section.mediator,

                            mediator
                        )
                },


                applyUserUpdate({
                                    sectionId,

                                    user
                                }) {
                    const resolvedSectionId =
                        normalizeId(
                            sectionId
                        ) ??

                        this.flow
                            .currentSectionId

                    const section =
                        this.sections[
                            resolvedSectionId
                            ]

                    if (
                        !section ||
                        !user
                    ) {
                        return
                    }

                    section.user = {
                        ...section.user,

                        ...cloneValue(
                            user
                        ),

                        messages:
                            Array.isArray(
                                user.messages
                            )
                                ? cloneValue(
                                    user.messages
                                )
                                : section.user
                                    .messages
                    }
                },


                applyLooseMessage(
                    message,
                    data = {}
                ) {
                    if (!message) {
                        return
                    }


                    /*
                      A generated character response is persisted by
                      Django before the endpoint returns.

                      The endpoint also returns that exact serialized
                      message immediately.

                      Use the message's own stage first because flow is
                      merged later inside applyBackendUpdate(). This
                      avoids attaching a newly-returned message to a
                      stale active section during live transitions.
                    */

                    const sectionId =
                        normalizeId(
                            message.stage ??
                            data.sectionId ??
                            data.section_id
                        ) ??

                        this.flow
                            .currentSectionId

                    const section =
                        this.sections[
                            sectionId
                            ]

                    if (!section) {
                        return
                    }


                    const speakerType =
                        message.speakerType ??

                        message.speaker_type ??

                        message.role ??

                        null


                    const speakerId =
                        normalizeId(
                            message.speakerId ??
                            message.speaker_id
                        )


                    const roundNumber =
                        Number(
                            message.roundNumber ??
                            message.round_number ??
                            message.round ??
                            this.flow.currentRound ??
                            1
                        )


                    const normalizedMessage = {

                        id:
                            normalizeId(
                                message.id ??
                                message.messageId ??
                                message.message_id
                            ),

                        sequence:
                            message.sequence ??
                            null,

                        content:
                            message.content ??
                            '',

                        roundNumber,

                        messageType:
                            message.messageType ??
                            message.message_type ??
                            null,

                        emotion:
                            message.emotion ??
                            '',

                        animation:
                            message.animation ??
                            '',

                        createdAt:
                            message.createdAt ??
                            message.created_at ??
                            null
                    }


                    /* ==========================================
                       USER MESSAGE

                       Keep the existing immediate user-history
                       synchronization behaviour.
                    ========================================== */

                    if (
                        speakerType ===
                        'user'
                    ) {

                        this.sections[
                            sectionId
                            ] = {

                            ...section,

                            user: {

                                ...section.user,

                                messages:
                                    appendUniqueMessage(
                                        section.user
                                            .messages,

                                        message
                                    )
                            }
                        }


                        return
                    }


                    /* ==========================================
                       PANEL MESSAGE

                       This is the live-sync fix.

                       Previously panel messages were ignored here.
                       The UI marks a member complete only when the
                       active round appears in statementHistory.

                       A reload worked because Django rebuilt that
                       history from DebateMessage rows. Apply the
                       returned persisted message immediately so the
                       live page and a cold reload use the same source
                       of truth.
                    ========================================== */

                    if (
                        speakerType ===
                        'panel'
                        &&
                        speakerId
                    ) {

                        const currentCharacterState =
                            section.characters?.[
                                speakerId
                                ] ??

                            createCharacterSectionState()


                        const metadataCharacterState =
                            asObject(
                                message.metadata
                                    ?.characterState ??

                                message.metadata
                                    ?.character_state
                            )


                        const nextCharacterState =
                            mergeCharacterState(

                                currentCharacterState,

                                {
                                    ...metadataCharacterState,

                                    status:
                                        'complete',

                                    statementHistory:
                                        appendUniqueMessage(
                                            currentCharacterState
                                                .statementHistory,

                                            normalizedMessage
                                        )
                                }
                            )


                        this.sections[
                            sectionId
                            ] = {

                            ...section,

                            characters: {

                                ...section.characters,

                                [speakerId]:
                                nextCharacterState
                            }
                        }


                        return
                    }


                    /* ==========================================
                       MEDIATOR MESSAGE

                       Mirror the same immediate synchronization for
                       mediator statements so synthesis content never
                       waits for a cold discussion reload either.
                    ========================================== */

                    if (
                        speakerType ===
                        'mediator'
                    ) {

                        const metadataMediatorState =
                            asObject(
                                message.metadata
                                    ?.mediatorState ??

                                message.metadata
                                    ?.mediator_state
                            )


                        const nextMediatorState =
                            mergeMediatorState(

                                section.mediator,

                                {
                                    ...metadataMediatorState,

                                    statements:
                                        appendUniqueMessage(
                                            section.mediator
                                                ?.statements,

                                            normalizedMessage
                                        )
                                }
                            )


                        this.sections[
                            sectionId
                            ] = {

                            ...section,

                            mediator:
                            nextMediatorState
                        }
                    }
                },


                /* ==================================================
                   APPLY ANY BACKEND UPDATE
                ================================================== */

                applyBackendUpdate(data) {
                    if (!data) {
                        return
                    }


                    /* ==========================================
                       SNAPSHOTS
                    ========================================== */

                    if (
                        data.discussionSnapshot
                    ) {
                        this.hydrate(
                            data.discussionSnapshot
                        )
                    }

                    if (
                        data.snapshot
                    ) {
                        this.hydrate(
                            data.snapshot
                        )
                    }


                    /*
                      Some endpoints may return the
                      full snapshot directly rather
                      than inside snapshot.
                    */

                    if (
                        data.sections &&
                        data.participants &&
                        data.flow
                    ) {
                        this.hydrate(
                            data
                        )
                    }


                    /* ==========================================
                       SESSION
                    ========================================== */

                    if (
                        data.session?.id &&
                        !this.sessionId
                    ) {
                        this.sessionId =
                            data.session.id
                    }


                    /* ==========================================
                       SECTION
                    ========================================== */

                    if (
                        data.section
                    ) {
                        this.upsertSection(
                            data.section
                        )
                    }


                    /* ==========================================
                       CHARACTER
                    ========================================== */

                    if (
                        data.characterUpdate
                    ) {
                        this.applyCharacterUpdate(
                            data.characterUpdate
                        )
                    }


                    /* ==========================================
                       MEDIATOR
                    ========================================== */

                    if (
                        data.mediatorUpdate
                    ) {
                        this.applyMediatorUpdate(
                            data.mediatorUpdate
                        )
                    }


                    /* ==========================================
                       USER
                    ========================================== */

                    if (
                        data.userUpdate
                    ) {
                        this.applyUserUpdate(
                            data.userUpdate
                        )
                    }


                    /* ==========================================
                       FOCUSED DISCUSSION
                    ========================================== */

                    const discussion =
                        data.subDiscussion ??

                        data.discussion ??

                        null

                    if (
                        discussion &&

                        (
                            data.characterId ??
                            data.character_id
                        )
                    ) {
                        this.upsertSubDiscussion({
                            sectionId:
                                data.sectionId ??

                                data.section_id ??

                                this.flow
                                    .currentSectionId,

                            characterId:
                                data.characterId ??

                                data.character_id,

                            discussion
                        })
                    }


                    /* ==========================================
                       ROUND
                    ========================================== */

                    if (
                        data.roundUpdate
                    ) {
                        this.applyRoundUpdate(
                            data.roundUpdate
                        )
                    }


                    /* ==========================================
                       LOOSE MESSAGE
                    ========================================== */

                    if (
                        data.message
                    ) {
                        this.applyLooseMessage(
                            data.message,

                            data
                        )
                    }


                    /* ==========================================
                       FLOW
                    ========================================== */

                    if (
                        data.flow
                    ) {
                        const existingCompletedSectionIds = [
                            ...this.flow
                                .completedSectionIds
                        ]


                        this.flow =
                            createFlowState({
                                ...this.flow,

                                ...cloneValue(
                                    data.flow
                                )
                            })


                        this.flow
                            .completedSectionIds = [
                            ...new Set([
                                ...existingCompletedSectionIds,

                                ...this.flow
                                    .completedSectionIds
                            ])
                        ]


                        this.flow
                            .completedSectionIds
                            .forEach(
                                sectionId => {

                                    if (
                                        this.sections[
                                            sectionId
                                            ]
                                    ) {
                                        this.sections[
                                            sectionId
                                            ].status =
                                            'complete'
                                    }
                                }
                            )
                    }

                    const nextRound =
                        data.currentRound ??

                        data.current_round ??

                        null

                    if (nextRound) {
                        this.flow
                            .currentRound =
                            Number(
                                nextRound
                            )
                    }


                    /* ==========================================
                       STATUS
                    ========================================== */

                    const nextStatus =
                        data.status ??

                        data.session
                            ?.status ??

                        null

                    if (nextStatus) {
                        this.status =
                            nextStatus
                    }


                    /* ==========================================
                       OUTCOME
                    ========================================== */

                    if (
                        data.outcome
                    ) {
                        this.outcome =
                            createOutcomeState({
                                ...this.outcome,

                                ...cloneValue(
                                    data.outcome
                                )
                            })
                    }
                },


                /* ==================================================
                   ERROR
                ================================================== */

                setError(error) {
                    this.error = {
                        message:
                            error
                                ?.response
                                ?.data
                                ?.detail ??

                            error
                                ?.response
                                ?.data
                                ?.message ??

                            error
                                ?.message ??

                            'Discussion request failed.',

                        status:
                            error
                                ?.status ??

                            error
                                ?.response
                                ?.status ??

                            0,

                        data:
                            error
                                ?.data ??

                            error
                                ?.response
                                ?.data ??

                            null
                    }
                },


                clearError() {
                    this.error =
                        null
                },


                /* ==================================================
                   RESET
                ================================================== */

                resetDiscussion() {
                    this.sessionId =
                        null

                    this.status =
                        'idle'

                    this.brief =
                        createBrief()

                    this.modelContext =
                        createModelContext()

                    this.participants =
                        createParticipants()

                    this.flow =
                        createFlowState()

                    this.sections =
                        {}

                    this.outcome =
                        createOutcomeState()


                    this.isLoading =
                        false

                    this.isSendingInput =
                        false

                    this.isGeneratingCharacter =
                        false

                    this.generatingCharacterIds =
                        {}

                    this.isGeneratingMediator =
                        false

                    this.isGeneratingInitialRound =
                        false

                    this.isOpeningDiscussion =
                        false

                    this.isControllingSession =
                        false


                    this.initialRoundProgress = {
                        total: 0,

                        completed: 0,

                        currentCharacterId: null,

                        mediatorPending: false
                    }


                    this.error =
                        null
                }
            }
        }
    )

