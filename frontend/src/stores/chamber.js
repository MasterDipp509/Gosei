// src/stores/chamber.js

import {
    defineStore
} from 'pinia'

import api from '@/services/api.js'

import {
    useProfileStore
} from '@/stores/profileStore.js'

import {
    useCharacterStore
} from '@/stores/characterStore.js'


/* ==================================================
   CONSTANTS
================================================== */

const VALID_COUNCIL_MODES = [
    'panel',
    'mediator'
]


const VALID_APPROACHES = [
    'supportive',
    'balanced',
    'adversarial'
]


const USE_MOCK_SESSION =
    import.meta.env.DEV &&
    import.meta.env.VITE_CHAMBER_MOCK_SESSION ===
    'true'


/* ==================================================
   GENERAL HELPERS
================================================== */

function cloneValue(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {
        return value
    }


    /*
      JSON cloning deliberately unwraps Vue/Pinia
      proxies into request-safe plain objects.
    */

    return JSON.parse(
        JSON.stringify(value)
    )
}


function asObject(
    value
) {

    return (
        value &&
        typeof value ===
        'object' &&
        !Array.isArray(value)
    )
        ? value
        : {}
}


function asArray(
    value
) {

    return Array.isArray(value)
        ? value
        : []
}


function cleanText(
    value,
    fallback = ''
) {

    if (
        typeof value !==
        'string'
    ) {
        return fallback
    }


    return (
        value.trim() ||
        fallback
    )
}


function normalizeStringArray(
    value,
    fallback = []
) {

    const source =
        Array.isArray(value) &&
        value.length > 0

            ? value

            : (
                Array.isArray(fallback)
                    ? fallback
                    : []
            )


    return source
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


/* ==================================================
   DRAFT ID
================================================== */

function createDraftId() {

    if (
        typeof crypto !==
        'undefined' &&

        typeof crypto.randomUUID ===
        'function'
    ) {
        return crypto.randomUUID()
    }


    return (
        `draft-${Date.now()}`
    )
}


/* ==================================================
   CALIBRATION NORMALIZATION
================================================== */

function normalizeCalibration(
    payload,
    fallbackMode = null
) {

    if (!payload) {
        return null
    }


    const councilMode =
        payload.councilMode ??
        payload.council_mode ??
        fallbackMode


    return {

        topic:
            cleanText(
                payload.topic ??
                payload.idea ??
                ''
            ),


        objective:
            cleanText(
                payload.objective ??
                ''
            ),


        objectiveId:
            payload.objectiveId ??
            payload.objective_id ??
            '',


        context:
            cleanText(
                payload.context ??
                payload.backgroundContext ??
                payload.background_context ??
                ''
            ),


        approach:
            VALID_APPROACHES.includes(
                payload.approach
            )
                ? payload.approach
                : 'balanced',


        councilMode:
            VALID_COUNCIL_MODES.includes(
                councilMode
            )
                ? councilMode
                : fallbackMode,


        complete:
            Boolean(
                payload.complete
            )
    }
}


/* ==================================================
   PARTICIPANT HELPERS
================================================== */

function resolveParticipantId(
    participant
) {

    if (
        typeof participant ===
        'string' ||

        typeof participant ===
        'number'
    ) {
        return String(
            participant
        )
    }


    if (
        participant?.id
    ) {
        return String(
            participant.id
        )
    }


    return null
}


function normalizeFocusAreas(
    participant,
    fallback = null
) {

    const focusAreas =
        participant?.focusAreas ??
        participant?.focus_areas ??
        participant?.expertise ??
        fallback?.focusAreas ??
        fallback?.focus_areas ??
        fallback?.expertise ??
        []


    return normalizeStringArray(
        focusAreas
    )
}


function normalizePersonality(
    participant,
    fallback = null
) {

    const incoming =
        participant?.personality ??
        participant?.persona


    if (
        Array.isArray(incoming) &&
        incoming.length > 0
    ) {
        return cloneValue(
            incoming
        )
    }


    if (
        typeof incoming ===
        'string' &&

        incoming.trim()
    ) {
        return incoming.trim()
    }


    const canonical =
        fallback?.personality ??
        fallback?.persona ??
        []


    return cloneValue(
        canonical
    )
}


function normalizeParticipant(
    participant,
    canonicalParticipant = null
) {

    const id =
        resolveParticipantId(
            participant
        )


    if (!id) {
        return null
    }


    const incoming =
        (
            participant &&
            typeof participant ===
            'object' &&
            !Array.isArray(participant)
        )
            ? cloneValue(participant)
            : {
                id
            }


    const canonical =
        cloneValue(
            asObject(
                canonicalParticipant
            )
        )


    /*
      Canonical data supplies the permanent character
      identity and personality.

      Incoming/profile data may override ordinary fields,
      but partial objects must not erase the persona.
    */

    const personaAdaptation = {

        ...cloneValue(
            asObject(
                canonical.personaAdaptation
            )
        ),

        ...cloneValue(
            asObject(
                incoming.personaAdaptation
            )
        )
    }


    const canonicalVoice =
        asObject(
            canonical.voice
        )


    const incomingVoice =
        asObject(
            incoming.voice
        )


    const voice = {

        ...cloneValue(
            canonicalVoice
        ),

        ...cloneValue(
            incomingVoice
        ),


        verbalHabits:
            normalizeStringArray(
                incomingVoice.verbalHabits,
                canonicalVoice.verbalHabits
            ),


        emotionalTells:
            normalizeStringArray(
                incomingVoice.emotionalTells,
                canonicalVoice.emotionalTells
            )
    }


    const dialogueExamples = {

        ...cloneValue(
            asObject(
                canonical.dialogueExamples
            )
        ),

        ...cloneValue(
            asObject(
                incoming.dialogueExamples
            )
        )
    }


    const specialties =
        normalizeStringArray(
            incoming.specialties,
            canonical.specialties
        )


    const focusAreas =
        normalizeFocusAreas(
            incoming,
            canonical
        )


    const personality =
        normalizePersonality(
            incoming,
            canonical
        )


    const merged = {

        ...canonical,

        ...incoming
    }


    return {

        /*
          Preserve any additional safe catalogue fields.
        */

        ...merged,


        id,


        name:
            cleanText(
                merged.name,
                id
            ),


        role:
            cleanText(
                merged.role,
                'Council Member'
            ),


        archetype:
            cleanText(
                merged.archetype
            ),


        description:
            cleanText(
                merged.description
            ),


        personality,


        specialties,


        debateStyle:
            cleanText(
                merged.debateStyle ??
                merged.debate_style
            ),


        focusAreas,


        personaAdaptation,


        voice,


        dialogueExamples,


        quote:
            cleanText(
                merged.quote
            ),


        avatar:
            cleanText(
                merged.avatar
            ),


        accent:
            cleanText(
                merged.accent
            )
    }
}


function resolveFullParticipant(
    participant,
    characterStore
) {

    const id =
        resolveParticipantId(
            participant
        )


    if (!id) {
        return null
    }


    const canonical =
        characterStore
            .characterById(
                id
            )


    if (!canonical) {

        console.warn(
            '[Chamber] No canonical character found:',
            {
                id,
                participant
            }
        )
    }


    return normalizeParticipant(
        participant,
        canonical
    )
}


function enrichSessionParticipants(
    payload,
    characterStore
) {

    const panelMembers =
        asArray(
            payload?.panelMembers
        )
            .map(
                participant =>
                    resolveFullParticipant(
                        participant,
                        characterStore
                    )
            )
            .filter(Boolean)


    const mediator =
        resolveFullParticipant(
            payload?.mediator,
            characterStore
        )


    return {

        ...payload,

        panelMembers,

        mediator
    }
}


/* ==================================================
   DEBUG VALIDATION
================================================== */

function validateParticipantPersona(
    participant,
    label
) {

    if (!participant) {

        console.error(
            `[Chamber] ${label} is missing.`
        )


        return false
    }


    const missing = []


    if (
        !participant.archetype
    ) {
        missing.push(
            'archetype'
        )
    }


    if (
        !participant.debateStyle
    ) {
        missing.push(
            'debateStyle'
        )
    }


    if (
        !participant.personaAdaptation
            ?.tone
    ) {
        missing.push(
            'personaAdaptation.tone'
        )
    }


    if (
        !participant.voice
            ?.speechPattern
    ) {
        missing.push(
            'voice.speechPattern'
        )
    }


    if (
        !participant.dialogueExamples ||

        Object.keys(
            participant.dialogueExamples
        ).length ===
        0
    ) {
        missing.push(
            'dialogueExamples'
        )
    }


    if (
        missing.length > 0
    ) {

        console.error(
            `[Chamber] ${label} has an incomplete persona:`,
            {
                id:
                participant.id,

                missing,

                participant
            }
        )


        return false
    }


    return true
}


function validateSessionPersonas(
    payload
) {

    const panelResults =
        asArray(
            payload.panelMembers
        )
            .map(
                (participant, index) =>
                    validateParticipantPersona(
                        participant,
                        `Panel member ${index + 1}`
                    )
            )


    const mediatorResult =
        validateParticipantPersona(
            payload.mediator,
            'Mediator'
        )


    return (
        panelResults.every(Boolean) &&
        mediatorResult
    )
}


/* ==================================================
   SESSION TITLE
================================================== */

function buildSessionTitle(
    topic
) {

    const cleanTopic =
        cleanText(
            topic
        )


    if (!cleanTopic) {

        return (
            'Untitled Chamber Session'
        )
    }


    if (
        cleanTopic.length <=
        120
    ) {
        return cleanTopic
    }


    return (
        cleanTopic
            .slice(
                0,
                117
            )
            .trim()
        +
        '...'
    )
}


/* ==================================================
   STORE
================================================== */

export const useChamberStore =
    defineStore(

        'chamber',

        {

            /* ==================================================
               STATE
            ================================================== */

            state: () => ({

                phase:
                    'selection',


                selectionStep:
                    'composition',


                transitionDirection:
                    'forward',


                sessionIntent:
                    null,


                councilMode:
                    null,


                activeSession:
                    null,


                resumableSessions:
                    [],


                calibration:
                    null,


                discussion:
                    null,


                aiContext:
                    null,


                isStartingSession:
                    false,


                isLoadingSession:
                    false,


                apiError:
                    null
            }),


            /* ==================================================
               GETTERS
            ================================================== */

            getters: {

                isSelectionPhase:
                    state =>
                        state.phase ===
                        'selection',


                isCalibrationPhase:
                    state =>
                        state.phase ===
                        'calibration',


                isDiscussionPhase:
                    state =>
                        state.phase ===
                        'discussion',


                isCalibrated:
                    state =>
                        Boolean(
                            state.calibration
                                ?.complete
                        ),


                hasActiveSession:
                    state =>
                        Boolean(
                            state.activeSession
                        ),


                hasPersistedSession:
                    state =>
                        Boolean(

                            state.activeSession?.id &&

                            state.activeSession?.status !==
                            'draft' &&

                            state.activeSession?.status !==
                            'starting'
                        ),


                activeSessionId:
                    state =>
                        state.activeSession?.id ??
                        null
            },


            /* ==================================================
               ACTIONS
            ================================================== */

            actions: {

                /* ==================================================
                   RESUMABLE SESSIONS
                ================================================== */

                setResumableSessions(
                    sessions
                ) {

                    this.resumableSessions =
                        Array.isArray(
                            sessions
                        )
                            ? sessions
                            : []
                },


                /* ==================================================
                   BEGIN NEW SESSION
                ================================================== */

                beginNewSession(
                    mode
                ) {

                    if (
                        !VALID_COUNCIL_MODES.includes(
                            mode
                        )
                    ) {

                        throw new Error(
                            `Invalid council mode: ${mode}`
                        )
                    }


                    this.transitionDirection =
                        'forward'


                    this.sessionIntent =
                        'new'


                    this.councilMode =
                        mode


                    this.calibration =
                        null


                    this.discussion =
                        null


                    this.aiContext =
                        null


                    this.apiError =
                        null


                    this.activeSession = {

                        id:
                            createDraftId(),


                        status:
                            'draft',


                        councilMode:
                        mode,


                        mode,


                        calibration:
                            null
                    }


                    this.phase =
                        'calibration'
                },


                /* ==================================================
                   CONTINUE EXISTING SESSION
                ================================================== */

                continueSession(
                    sessionOrId
                ) {

                    let session =
                        sessionOrId


                    if (
                        typeof sessionOrId ===
                        'string' ||

                        typeof sessionOrId ===
                        'number'
                    ) {

                        session =
                            this.resumableSessions
                                .find(
                                    item =>
                                        String(
                                            item.id
                                        ) ===
                                        String(
                                            sessionOrId
                                        )
                                )
                    }


                    if (
                        !session ||
                        !session.id
                    ) {

                        console.warn(
                            '[Chamber] Unable to continue session:',
                            sessionOrId
                        )


                        return false
                    }


                    const normalizedStatus =
                        String(
                            session.status ??
                            ''
                        )
                            .trim()
                            .toLowerCase()


                    const terminalStatuses = [
                        'complete',
                        'completed',
                        'abandoned'
                    ]


                    if (
                        terminalStatuses.includes(
                            normalizedStatus
                        )
                    ) {

                        console.warn(
                            '[Chamber] Refusing to continue terminal session:',
                            {
                                id:
                                session.id,

                                status:
                                normalizedStatus
                            }
                        )


                        return false
                    }


                    const mode =
                        session.councilMode ??
                        session.council_mode ??
                        session.mode ??
                        session.calibration
                            ?.councilMode ??
                        session.calibration
                            ?.council_mode ??
                        'panel'


                    const rawCalibration =
                        session.calibration ??
                        session.calibration_context ??
                        null


                    const normalizedCalibration =
                        rawCalibration

                            ? {

                                ...normalizeCalibration(
                                    rawCalibration,
                                    mode
                                ),


                                complete:
                                    true
                            }

                            : null


                    this.transitionDirection =
                        'forward'


                    this.sessionIntent =
                        'continue'


                    this.councilMode =
                        mode


                    this.activeSession = {

                        ...session,


                        councilMode:
                        mode,


                        mode,


                        calibration:
                            normalizedCalibration ??
                            session.calibration ??
                            null
                    }


                    this.calibration =
                        normalizedCalibration


                    this.discussion =
                        session.discussion ??
                        null


                    this.aiContext =
                        session.aiContext ??
                        session.ai_context ??
                        null


                    this.apiError =
                        null


                    this.phase =
                        'discussion'


                    console.log(
                        '[Chamber] Session resumed:',
                        {
                            id:
                            this.activeSession.id,

                            mode:
                            this.councilMode,

                            phase:
                            this.phase,

                            status:
                            normalizedStatus
                        }
                    )


                    return true
                },


                /* ==================================================
                   SAVE CALIBRATION
                ================================================== */

                saveCalibration(
                    payload
                ) {

                    const normalized =
                        normalizeCalibration(
                            payload,
                            this.councilMode
                        )


                    if (!normalized) {

                        throw new Error(
                            'Calibration payload is missing.'
                        )
                    }


                    if (
                        !normalized.councilMode
                    ) {

                        throw new Error(
                            'Calibration has no council mode.'
                        )
                    }


                    normalized.complete =
                        true


                    this.councilMode =
                        normalized.councilMode


                    this.calibration =
                        normalized


                    return normalized
                },


                /* ==================================================
                   BUILD START SESSION PAYLOAD
                ================================================== */

                buildStartSessionPayload() {

                    const profileStore =
                        useProfileStore()


                    const characterStore =
                        useCharacterStore()


                    if (
                        !this.calibration
                    ) {

                        throw new Error(
                            'Calibration has not been completed.'
                        )
                    }


                    if (
                        this.calibration
                            .topic
                            .length <
                        5
                    ) {

                        throw new Error(
                            'The discussion topic is too short.'
                        )
                    }


                    if (
                        !this.calibration
                            .objective
                    ) {

                        throw new Error(
                            'A discussion objective is required.'
                        )
                    }


                    const rawPanelMembers =
                        profileStore
                            .councilMembers ??
                        profileStore.panel ??
                        []


                    const rawMediator =
                        profileStore
                            .councilMediator ??
                        profileStore.mediator ??
                        null


                    const panelMembers =
                        asArray(
                            rawPanelMembers
                        )
                            .map(
                                participant =>
                                    resolveFullParticipant(
                                        participant,
                                        characterStore
                                    )
                            )
                            .filter(Boolean)


                    const mediator =
                        resolveFullParticipant(
                            rawMediator,
                            characterStore
                        )


                    if (!mediator) {

                        throw new Error(
                            'No mediator is configured.'
                        )
                    }


                    if (
                        this.councilMode ===
                        'panel' &&

                        panelMembers.length ===
                        0
                    ) {

                        throw new Error(
                            'Panel mode requires at least one council member.'
                        )
                    }


                    const payload = {

                        mode:
                        this.councilMode,


                        title:
                            buildSessionTitle(
                                this.calibration
                                    .topic
                            ),


                        calibration: {

                            idea:
                            this.calibration
                                .topic,


                            objective:
                            this.calibration
                                .objective,


                            objectiveId:
                            this.calibration
                                .objectiveId,


                            backgroundContext:
                            this.calibration
                                .context,


                            approach:
                            this.calibration
                                .approach,


                            councilMode:
                            this.councilMode,


                            desiredOutcome:
                                '',


                            constraints:
                                [],


                            assumptions:
                                [],


                            questions:
                                [],


                            additionalNotes:
                                ''
                        },


                        panelMembers:
                            this.councilMode ===
                            'panel'

                                ? panelMembers

                                : [],


                        mediator
                    }


                    return enrichSessionParticipants(
                        payload,
                        characterStore
                    )
                },


                /* ==================================================
                   CREATE REAL BACKEND SESSION
                ================================================== */

                async createSession(
                    rawPayload
                ) {

                    if (
                        !rawPayload ||

                        typeof rawPayload !==
                        'object'
                    ) {

                        throw new Error(
                            'Session creation payload is missing.'
                        )
                    }


                    const characterStore =
                        useCharacterStore()


                    /*
                      Always enrich here as well.

                      This protects calls where ChamberFlow passes
                      a prebuilt sessionPayload and therefore bypasses
                      buildStartSessionPayload().
                    */

                    const payload =
                        enrichSessionParticipants(
                            rawPayload,
                            characterStore
                        )


                    if (!payload.mode) {

                        throw new Error(
                            'Session payload has no mode.'
                        )
                    }


                    if (!payload.calibration) {

                        throw new Error(
                            'Session payload has no calibration.'
                        )
                    }


                    if (!payload.mediator) {

                        throw new Error(
                            'Session payload has no mediator.'
                        )
                    }


                    if (
                        payload.mode ===
                        'panel' &&

                        payload.panelMembers.length ===
                        0
                    ) {

                        throw new Error(
                            'Panel session payload has no members.'
                        )
                    }


                    const personasValid =
                        validateSessionPersonas(
                            payload
                        )


                    if (!personasValid) {

                        throw new Error(
                            'Session participants are missing complete personality profiles.'
                        )
                    }


                    console.log(
                        '[Chamber] Enriched session participants:',
                        {
                            panelCount:
                            payload.panelMembers.length,

                            firstPanelMember:
                                payload.panelMembers[0] ??
                                null,

                            mediator:
                            payload.mediator,

                            panelHasVoice:
                                Boolean(
                                    payload.panelMembers[0]
                                        ?.voice
                                        ?.speechPattern
                                ),

                            panelHasPersona:
                                Boolean(
                                    payload.panelMembers[0]
                                        ?.personaAdaptation
                                        ?.tone
                                ),

                            panelHasDialogueExamples:
                                Boolean(
                                    payload.panelMembers[0]
                                        ?.dialogueExamples &&
                                    Object.keys(
                                        payload.panelMembers[0]
                                            .dialogueExamples
                                    ).length
                                ),

                            mediatorHasVoice:
                                Boolean(
                                    payload.mediator
                                        ?.voice
                                        ?.speechPattern
                                ),

                            mediatorHasPersona:
                                Boolean(
                                    payload.mediator
                                        ?.personaAdaptation
                                        ?.tone
                                )
                        }
                    )


                    /* ==============================================
                       MOCK SESSION
                    ============================================== */

                    if (
                        USE_MOCK_SESSION
                    ) {

                        const mode =
                            payload.mode ??
                            this.councilMode ??
                            'panel'


                        const session = {

                            id:
                                `dev-session-${Date.now()}`,


                            status:
                                'ready',


                            mode,


                            title:
                                payload.title ??
                                this.calibration?.topic ??
                                'Test Discussion',


                            objective:
                                payload.calibration
                                    ?.objective ??
                                this.calibration
                                    ?.objective ??
                                '',


                            calibration:
                                cloneValue(
                                    payload.calibration
                                ),


                            panelMembers:
                                cloneValue(
                                    payload.panelMembers
                                ),


                            mediator:
                                cloneValue(
                                    payload.mediator
                                ),


                            createdAt:
                                new Date()
                                    .toISOString()
                        }


                        const response = {

                            session,


                            aiContext: {

                                summary:
                                    '',


                                knownFacts:
                                    [],


                                participants: {

                                    panel:
                                        cloneValue(
                                            session.panelMembers
                                        ),


                                    mediator:
                                        cloneValue(
                                            session.mediator
                                        )
                                }
                            }
                        }


                        this.activeSession =
                            session


                        this.aiContext =
                            response.aiContext


                        console.info(
                            '[Chamber] Using local development session:',
                            response
                        )


                        return response
                    }


                    /* ==============================================
                       REAL API SESSION
                    ============================================== */

                    console.log(
                        '[Chamber] POST session payload:',
                        payload
                    )


                    const {
                        data
                    } =
                        await api.post(

                            '/chamber/sessions/start/',

                            payload
                        )


                    this.activeSession =
                        data.session


                    this.aiContext =
                        data.aiContext ??
                        null


                    return data
                },


                /* ==================================================
                   COMPLETE CALIBRATION
                ================================================== */

                async completeCalibration(
                    calibrationPayload,
                    sessionPayload = null
                ) {

                    const calibration =
                        this.saveCalibration(
                            calibrationPayload
                        )


                    this.activeSession = {

                        ...this.activeSession,


                        status:
                            'starting',


                        councilMode:
                        this.councilMode,


                        mode:
                        this.councilMode,


                        calibration
                    }


                    this.transitionDirection =
                        'forward'


                    this.isStartingSession =
                        true


                    this.apiError =
                        null


                    try {

                        /*
                          createSession() performs final participant
                          enrichment even when ChamberFlow supplies
                          a prebuilt payload here.
                        */

                        const requestPayload =
                            sessionPayload ??
                            this.buildStartSessionPayload()


                        console.log(
                            '[Chamber] Final pre-enrichment payload:',
                            requestPayload
                        )


                        const data =
                            await this.createSession(
                                requestPayload
                            )


                        if (
                            data?.session
                        ) {

                            this.activeSession =
                                data.session
                        }


                        if (
                            data?.aiContext
                        ) {

                            this.aiContext =
                                data.aiContext
                        }


                        this.discussion =
                            this.discussion ??
                            {
                                messages: []
                            }


                        this.phase =
                            'discussion'


                        return data

                    } catch (error) {

                        this.apiError = {

                            message:
                                error?.response
                                    ?.data
                                    ?.detail ??
                                error?.response
                                    ?.data
                                    ?.message ??
                                error?.message ??
                                'Failed to create debate session.',


                            status:
                                error?.response
                                    ?.status ??
                                error?.status ??
                                0,


                            data:
                                error?.response
                                    ?.data ??
                                error?.data ??
                                null
                        }


                        this.phase =
                            'calibration'


                        throw error

                    } finally {

                        this.isStartingSession =
                            false
                    }
                },


                /* ==================================================
                   RETURN FROM CALIBRATION
                ================================================== */

                returnFromCalibration() {

                    this.transitionDirection =
                        'backward'


                    this.phase =
                        'selection'


                    this.selectionStep =
                        'composition'


                    this.apiError =
                        null
                },


                /* ==================================================
                   REOPEN SELECTION
                ================================================== */

                reopenSelection() {

                    this.transitionDirection =
                        'backward'


                    this.phase =
                        'selection'


                    this.selectionStep =
                        'composition'


                    this.apiError =
                        null
                },


                /* ==================================================
                   DISCUSSION COMPATIBILITY
                ================================================== */

                updateDiscussion(
                    payload
                ) {

                    this.discussion = {

                        ...this.discussion,

                        ...payload
                    }


                    if (
                        this.activeSession
                    ) {

                        this.activeSession = {

                            ...this.activeSession,


                            discussion:
                            this.discussion
                        }
                    }
                },


                /* ==================================================
                   API ERROR
                ================================================== */

                clearApiError() {

                    this.apiError =
                        null
                },


                /* ==================================================
                   END SESSION
                ================================================== */

                endSession() {

                    this.transitionDirection =
                        'backward'


                    this.phase =
                        'selection'


                    this.selectionStep =
                        'composition'


                    this.sessionIntent =
                        null


                    this.councilMode =
                        null


                    this.activeSession =
                        null


                    this.calibration =
                        null


                    this.discussion =
                        null


                    this.aiContext =
                        null


                    this.isStartingSession =
                        false


                    this.isLoadingSession =
                        false


                    this.apiError =
                        null
                }
            }
        }
    )
