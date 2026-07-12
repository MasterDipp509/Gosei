// src/stores/debates.js


import {
    defineStore
} from 'pinia'


import api from '@/services/api.js'


/* ==================================================
   DEBATES STORE

   PURPOSE
   --------------------------------------------------

   This store owns the DATABASE-BACKED SESSION ARCHIVE.

   It is responsible for:

   - fetching debate sessions from Django
   - hydrating archive summary information
   - storing discussion members
   - storing current/latest debate confidence
   - storing current/final risks
   - storing risk count
   - persisted pinning and unpinning
   - archive filtering
   - archive ordering
   - archive selection
   - local session patching
   - inserting newly created sessions


   PRIMARY SESSION LIST:

       GET /chamber/sessions/


   DISCUSSION SUMMARY HYDRATION:

       GET /chamber/sessions/:id/discussion/


   PIN STATE:

       PATCH /chamber/sessions/:id/pin/


   IMPORTANT
   --------------------------------------------------

   This store stores only the discussion information
   needed by the archive UI.

   It does NOT replace currentDiscussion.js.

   currentDiscussion.js still owns:

   - active flow
   - round generation
   - full section state
   - character messages
   - focused discussions
   - active mediator state
   - user interaction
================================================== */


/* ==================================================
   RESUMABLE SESSION STATUSES
================================================== */

const RESUMABLE_STATUSES =
    new Set([

        'ready',

        'active',

        'paused'
    ])


/* ==================================================
   SAFE ARRAY
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


/* ==================================================
   SAFE OBJECT
================================================== */

function asObject(
    value
) {

    return (

        value

        &&

        typeof value ===
        'object'

        &&

        !Array.isArray(
            value
        )

    )
        ? value
        : {}
}


/* ==================================================
   NORMALIZE ID
================================================== */

function normalizeId(
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


    return String(
        value
    )
}


/* ==================================================
   NUMBER OR NULL

   Important:

   0 is a valid value.

   null means there is no metric yet.
================================================== */

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


/* ==================================================
   CONFIDENCE VALUE NORMALIZATION

   Supports:

   72

   {
       current: 72
   }

   {
       score: 72
   }

   {
       value: 72
   }

   {
       percentage: 72
   }
================================================== */

function normalizeConfidenceValue(
    value
) {

    const direct =
        numberOrNull(
            value
        )


    if (
        direct !==
        null
    ) {

        return direct
    }


    if (
        !value
        ||
        typeof value !==
        'object'
    ) {

        return null
    }


    return (

        numberOrNull(
            value.current
        )

        ??

        numberOrNull(
            value.score
        )

        ??

        numberOrNull(
            value.value
        )

        ??

        numberOrNull(
            value.percentage
        )

        ??

        null
    )
}


/* ==================================================
   EXTRACT SESSION LIST
================================================== */

function extractSessions(
    payload
) {

    if (
        Array.isArray(
            payload
        )
    ) {

        return payload
    }


    if (
        Array.isArray(
            payload?.sessions
        )
    ) {

        return payload.sessions
    }


    if (
        Array.isArray(
            payload?.results
        )
    ) {

        return payload.results
    }


    return []
}


/* ==================================================
   EXTRACT SINGLE SESSION RESPONSE

   Supported:

   {
       session: {...}
   }

   or:

   {...}
================================================== */

function extractSession(
    payload
) {

    if (
        payload?.session
        &&
        typeof payload.session ===
        'object'
    ) {

        return payload.session
    }


    if (
        payload
        &&
        typeof payload ===
        'object'
        &&
        payload.id
    ) {

        return payload
    }


    return null
}


/* ==================================================
   NORMALIZE MEMBER
================================================== */

function normalizeMember(
    member
) {

    if (
        !member
        ||
        typeof member !==
        'object'
    ) {

        return null
    }


    const id =
        normalizeId(
            member.id
            ??
            member.characterId
            ??
            member.character_id
        )


    if (!id) {

        return null
    }


    return {

        ...member,

        id,

        name:
            member.name
            ??
            id,

        role:
            member.role
            ??
            'Council Member',

        description:
            member.description
            ??
            '',

        personality:
            member.personality
            ??
            member.persona
            ??
            [],

        debateStyle:
            member.debateStyle
            ??
            member.debate_style
            ??
            '',

        focusAreas:
            asArray(

                member.focusAreas

                ??

                member.focus_areas

                ??

                member.expertise
            )
    }
}


/* ==================================================
   NORMALIZE MEMBER ARRAY
================================================== */

function normalizeMembers(
    members
) {

    return asArray(
        members
    )
        .map(
            normalizeMember
        )
        .filter(
            Boolean
        )
}


/* ==================================================
   SESSION MEMBERS

   Before full discussion hydration:

   panel mode:
       panelMembers

   mediator mode:
       mediator only


   Once hydrated, the participants payload becomes
   authoritative.
================================================== */

function getSessionMembers(
    session
) {

    const explicitMembers =
        normalizeMembers(

            session?.discussionMembers

            ??

            session?.members
        )


    if (
        explicitMembers.length
    ) {

        return explicitMembers
    }


    if (
        session?.mode ===
        'mediator'
    ) {

        const mediator =
            normalizeMember(
                session?.mediator
            )


        return mediator
            ? [
                mediator
            ]
            : []
    }


    return normalizeMembers(
        session?.panelMembers
        ??
        session?.panel_snapshot
    )
}


/* ==================================================
   EXTRACT DISCUSSION MEMBERS

   Backend discussion shape:

   participants: {

       characters: {
           "rei": {...},
           "mika": {...}
       },

       characterOrder: [
           "rei",
           "mika"
       ],

       mediator: {...}
   }
================================================== */

function extractDiscussionMembers(
    snapshot,
    session
) {

    const participants =
        asObject(
            snapshot?.participants
        )


    const rawCharacters =
        participants.characters


    let characterMap = {}


    if (
        Array.isArray(
            rawCharacters
        )
    ) {

        rawCharacters.forEach(
            member => {

                const normalized =
                    normalizeMember(
                        member
                    )


                if (
                    normalized
                ) {

                    characterMap[
                        normalized.id
                        ] =
                        normalized
                }
            }
        )

    } else {

        Object.entries(
            asObject(
                rawCharacters
            )
        )
            .forEach(

                ([
                     characterId,
                     member
                 ]) => {

                    const normalized =
                        normalizeMember({

                            ...asObject(
                                member
                            ),

                            id:
                                member?.id
                                ??
                                characterId
                        })


                    if (
                        normalized
                    ) {

                        characterMap[
                            normalized.id
                            ] =
                            normalized
                    }
                }
            )
    }


    const requestedOrder =
        asArray(

            participants.characterOrder

            ??

            participants.character_order
        )
            .map(
                normalizeId
            )
            .filter(
                Boolean
            )


    const orderedCharacters = []


    requestedOrder.forEach(
        characterId => {

            const member =
                characterMap[
                    characterId
                    ]


            if (
                member
            ) {

                orderedCharacters.push(
                    member
                )
            }
        }
    )


    Object.values(
        characterMap
    )
        .forEach(
            member => {

                if (
                    !orderedCharacters.some(

                        existing =>

                            existing.id ===
                            member.id
                    )
                ) {

                    orderedCharacters.push(
                        member
                    )
                }
            }
        )


    /* ----------------------------------------------
       PANEL MODE
    ---------------------------------------------- */

    if (
        orderedCharacters.length
    ) {

        return orderedCharacters
    }


    /* ----------------------------------------------
       MEDIATOR MODE
    ---------------------------------------------- */

    const mediator =
        normalizeMember(
            participants.mediator
            ??
            session?.mediator
        )


    if (
        mediator
    ) {

        return [
            mediator
        ]
    }


    /* ----------------------------------------------
       FALLBACK TO SESSION LIST
    ---------------------------------------------- */

    return getSessionMembers(
        session
    )
}


/* ==================================================
   DISCUSSION SECTIONS

   Supports:

   sections: []

   and:

   sections: {
       sectionId: {...}
   }
================================================== */

function extractSections(
    snapshot
) {

    const rawSections =
        snapshot?.sections


    if (
        Array.isArray(
            rawSections
        )
    ) {

        return [
            ...rawSections
        ]
    }


    return Object.values(
        asObject(
            rawSections
        )
    )
}


/* ==================================================
   LATEST / CURRENT SECTION

   Priority:

   1. flow.currentSectionId
   2. final ID in flow.sectionOrder
   3. highest section.sequence
================================================== */

function getLatestSection(
    snapshot
) {

    const sections =
        extractSections(
            snapshot
        )


    if (
        !sections.length
    ) {

        return null
    }


    const flow =
        asObject(
            snapshot?.flow
        )


    const currentSectionId =
        normalizeId(

            flow.currentSectionId

            ??

            flow.current_section_id
        )


    if (
        currentSectionId
    ) {

        const current =
            sections.find(

                section =>

                    normalizeId(
                        section?.id
                    )

                    ===

                    currentSectionId
            )


        if (
            current
        ) {

            return current
        }
    }


    const sectionOrder =
        asArray(

            flow.sectionOrder

            ??

            flow.section_order
        )
            .map(
                normalizeId
            )
            .filter(
                Boolean
            )


    if (
        sectionOrder.length
    ) {

        const lastSectionId =
            sectionOrder[
            sectionOrder.length - 1
                ]


        const orderedLatest =
            sections.find(

                section =>

                    normalizeId(
                        section?.id
                    )

                    ===

                    lastSectionId
            )


        if (
            orderedLatest
        ) {

            return orderedLatest
        }
    }


    return [

        ...sections

    ].sort(

        (
            first,
            second
        ) =>

            Number(
                second?.sequence
                ??
                0
            )

            -

            Number(
                first?.sequence
                ??
                0
            )
    )[0]
}


/* ==================================================
   MEMBER CONFIDENCE FALLBACK

   Used only if the section does not yet have an
   aggregated ideaConfidence metric.
================================================== */

function calculateSectionMemberConfidence(
    section
) {

    const values = []


    Object.values(
        asObject(
            section?.characters
        )
    )
        .forEach(
            characterState => {

                const confidence =

                    normalizeConfidenceValue(

                        characterState
                            ?.confidence
                            ?.current

                        ??

                        characterState
                            ?.confidence
                    )


                if (
                    confidence !==
                    null
                ) {

                    values.push(
                        confidence
                    )
                }
            }
        )


    if (
        !values.length
    ) {

        return null
    }


    const total =
        values.reduce(

            (
                sum,
                value
            ) =>

                sum +
                value,

            0
        )


    return (
        total
        /
        values.length
    )
}


/* ==================================================
   LATEST CONFIDENCE IN DEBATE

   Priority:

   1. final outcome confidence
   2. current/latest section ideaConfidence
   3. section metrics confidence
   4. average current character confidence
================================================== */

function extractConfidenceInDebate(
    snapshot
) {

    const outcomeConfidence =
        normalizeConfidenceValue(
            snapshot
                ?.outcome
                ?.confidence
        )


    if (
        outcomeConfidence !==
        null
    ) {

        return outcomeConfidence
    }


    const section =
        getLatestSection(
            snapshot
        )


    if (
        !section
    ) {

        return null
    }


    const metrics =
        asObject(
            section.metrics
        )


    const sectionConfidence =

        normalizeConfidenceValue(
            metrics.ideaConfidence
        )

        ??

        normalizeConfidenceValue(
            metrics.idea_confidence
        )

        ??

        normalizeConfidenceValue(
            metrics.confidence
        )


    if (
        sectionConfidence !==
        null
    ) {

        return sectionConfidence
    }


    return calculateSectionMemberConfidence(
        section
    )
}


/* ==================================================
   NORMALIZE RISK
================================================== */

function normalizeRisk(
    risk
) {

    if (
        risk === null
        ||
        risk === undefined
    ) {

        return null
    }


    if (
        typeof risk ===
        'string'
    ) {

        const text =
            risk.trim()


        if (!text) {

            return null
        }


        return {

            id:
            text,

            title:
            text,

            description:
            text
        }
    }


    if (
        typeof risk !==
        'object'
    ) {

        return null
    }


    return {

        ...risk
    }
}


/* ==================================================
   RISK IDENTITY

   Used to prevent duplicate risks from multiple
   characters appearing more than once in the archive
   risk count.
================================================== */

function getRiskKey(
    risk
) {

    return String(

        risk?.id

        ??

        risk?.riskId

        ??

        risk?.risk_id

        ??

        risk?.title

        ??

        risk?.name

        ??

        risk?.description

        ??

        risk?.text

        ??

        JSON.stringify(
            risk
        )
    )
        .trim()
        .toLowerCase()
}


/* ==================================================
   DEDUPLICATE RISKS
================================================== */

function uniqueRisks(
    risks
) {

    const result = []

    const seen =
        new Set()


    asArray(
        risks
    )
        .forEach(
            rawRisk => {

                const risk =
                    normalizeRisk(
                        rawRisk
                    )


                if (
                    !risk
                ) {

                    return
                }


                const key =
                    getRiskKey(
                        risk
                    )


                if (
                    !key
                    ||
                    seen.has(
                        key
                    )
                ) {

                    return
                }


                seen.add(
                    key
                )


                result.push(
                    risk
                )
            }
        )


    return result
}


/* ==================================================
   EXTRACT RISKS

   Priority:

   1. final outcome risks

   If final outcome risks do not exist:

   2. risks from characters in current/latest section

   This prevents old section risks being blindly
   counted multiple times as the debate evolves.
================================================== */

function extractRisks(
    snapshot
) {

    const outcomeRisks =
        uniqueRisks(
            snapshot
                ?.outcome
                ?.risks
        )


    if (
        outcomeRisks.length
    ) {

        return outcomeRisks
    }


    const section =
        getLatestSection(
            snapshot
        )


    if (
        !section
    ) {

        return []
    }


    const collected = []


    asArray(
        section.risks
    )
        .forEach(
            risk =>

                collected.push(
                    risk
                )
        )


    Object.values(
        asObject(
            section.characters
        )
    )
        .forEach(
            characterState => {

                asArray(
                    characterState?.risks
                )
                    .forEach(
                        risk =>

                            collected.push(
                                risk
                            )
                    )
            }
        )


    return uniqueRisks(
        collected
    )
}


/* ==================================================
   DISCUSSION ARCHIVE SUMMARY

   Converts the full discussion snapshot into the small
   amount of data needed by the session archive.
================================================== */

function buildDiscussionSummary(
    snapshot,
    session
) {

    const members =
        extractDiscussionMembers(
            snapshot,
            session
        )


    const risks =
        extractRisks(
            snapshot
        )


    const confidence =
        extractConfidenceInDebate(
            snapshot
        )


    const latestSection =
        getLatestSection(
            snapshot
        )


    return {

        /* ------------------------------------------
           MEMBERS
        ------------------------------------------ */

        discussionMembers:
        members,

        members:
        members,

        memberCount:
        members.length,


        /* ------------------------------------------
           RISKS
        ------------------------------------------ */

        risks,

        riskCount:
        risks.length,


        /* ------------------------------------------
           CONFIDENCE
        ------------------------------------------ */

        confidenceInDebate:
        confidence,

        confidenceScore:
        confidence,


        /* ------------------------------------------
           CURRENT SECTION INFORMATION
        ------------------------------------------ */

        currentSectionId:
            normalizeId(
                latestSection?.id
            ),

        currentSectionTitle:
            latestSection?.title
            ??
            '',


        /* ------------------------------------------
           HYDRATION STATE
        ------------------------------------------ */

        discussionHydrated:
            true,

        discussionHydratedAt:
            new Date()
                .toISOString()
    }
}


/* ==================================================
   NORMALIZE SESSION

   Every archive session is guaranteed to expose:

   {
       id,
       pinned,

       discussionMembers,
       members,
       memberCount,

       risks,
       riskCount,

       confidenceInDebate,
       confidenceScore,

       discussionHydrated
   }
================================================== */

function normalizeSession(
    session
) {

    if (
        !session
        ||
        typeof session !==
        'object'
    ) {

        return null
    }


    const id =
        normalizeId(
            session.id
        )


    if (!id) {

        return null
    }


    const members =
        getSessionMembers(
            session
        )


    const risks =
        uniqueRisks(
            session.risks
        )


    const explicitRiskCount =
        numberOrNull(
            session.riskCount
        )


    const confidence =

        normalizeConfidenceValue(
            session.confidenceInDebate
        )

        ??

        normalizeConfidenceValue(
            session.confidenceScore
        )

        ??

        null


    return {

        ...session,

        id,


        /* ------------------------------------------
           SERVER-BACKED PIN STATE
        ------------------------------------------ */

        pinned:
            Boolean(
                session.pinned
            ),


        /* ------------------------------------------
           DISCUSSION MEMBERS
        ------------------------------------------ */

        discussionMembers:
        members,

        members:
        members,

        memberCount:
        members.length,


        /* ------------------------------------------
           RISKS
        ------------------------------------------ */

        risks,

        riskCount:
            explicitRiskCount
            ??
            risks.length,


        /* ------------------------------------------
           CONFIDENCE
        ------------------------------------------ */

        confidenceInDebate:
        confidence,

        confidenceScore:
        confidence,


        /* ------------------------------------------
           DETAIL HYDRATION STATE
        ------------------------------------------ */

        discussionHydrated:
            Boolean(
                session.discussionHydrated
            )
    }
}


/* ==================================================
   NORMALIZE SESSION ARRAY
================================================== */

function normalizeSessions(
    sessions
) {

    return asArray(
        sessions
    )
        .map(
            normalizeSession
        )
        .filter(
            Boolean
        )
}


/* ==================================================
   DATE TIMESTAMP
================================================== */

function getSessionTimestamp(
    session
) {

    const timestamp =
        new Date(

            session?.updatedAt

            ??

            session?.createdAt

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


/* ==================================================
   DATE SORT
================================================== */

function sortSessionsByDate(
    sessions
) {

    return [

        ...sessions

    ].sort(

        (
            first,
            second
        ) =>

            getSessionTimestamp(
                second
            )

            -

            getSessionTimestamp(
                first
            )
    )
}


/* ==================================================
   STORE
================================================== */

export const useDebatesStore =
    defineStore(

        'debates',

        {

            /* ==================================================
               STATE
            ================================================== */

            state: () => ({

                /* ==============================================
                   DATABASE SESSION ARCHIVE
                ============================================== */

                debates:
                    [],


                /* ==============================================
                   SELECTED ARCHIVE SESSION
                ============================================== */

                selectedDebateId:
                    null,


                /* ==============================================
                   LIST REQUEST STATE
                ============================================== */

                hasLoaded:
                    false,

                isLoading:
                    false,

                lastFetchedAt:
                    null,


                /* ==============================================
                   DISCUSSION SUMMARY HYDRATION
                ============================================== */

                isHydrating:
                    false,

                hasHydratedSummaries:
                    false,

                hydratingDebateIds:
                    {},

                summaryHydrationErrors:
                    {},


                /* ==============================================
                   PIN REQUEST STATE

                   Example:

                   {
                       "session-uuid": true
                   }
                ============================================== */

                pinningDebateIds:
                    {},


                /* ==============================================
                   GENERAL ERROR
                ============================================== */

                error:
                    null
            }),


            /* ==================================================
               GETTERS
            ================================================== */

            getters: {

                /* ==============================================
                   HAS DEBATES
                ============================================== */

                hasDebates:
                    state =>

                        state.debates.length >
                        0,


                /* ==============================================
                   DEBATE COUNT
                ============================================== */

                debateCount:
                    state =>

                        state.debates.length,


                /* ==============================================
                   HAS PINNED DEBATES
                ============================================== */

                hasPinnedDebates:
                    state =>

                        state.debates.some(

                            debate =>

                                debate.pinned ===
                                true
                        ),


                /* ==============================================
                   PINNED COUNT
                ============================================== */

                pinnedDebateCount:
                    state =>

                        state.debates.filter(

                            debate =>

                                debate.pinned ===
                                true
                        )
                            .length,


                /* ==============================================
                   PINNED DEBATES
                ============================================== */

                pinnedDebates:
                    state =>

                        sortSessionsByDate(

                            state.debates.filter(

                                debate =>

                                    debate.pinned ===
                                    true
                            )
                        ),


                /* ==============================================
                   UNPINNED DEBATES
                ============================================== */

                unpinnedDebates:
                    state =>

                        sortSessionsByDate(

                            state.debates.filter(

                                debate =>

                                    debate.pinned !==
                                    true
                            )
                        ),


                /* ==============================================
                   SELECTED DEBATE
                ============================================== */

                selectedDebate(
                    state
                ) {

                    if (
                        !state.selectedDebateId
                    ) {

                        return null
                    }


                    return (

                        state.debates.find(

                            debate =>

                                String(
                                    debate.id
                                )

                                ===

                                String(
                                    state.selectedDebateId
                                )
                        )

                        ??

                        null
                    )
                },


                /* ==============================================
                   DEBATE BY ID
                ============================================== */

                debateById:
                    state =>

                        debateId => {

                            const id =
                                normalizeId(
                                    debateId
                                )


                            if (!id) {

                                return null
                            }


                            return (

                                state.debates.find(

                                    debate =>

                                        String(
                                            debate.id
                                        )

                                        ===

                                        id
                                )

                                ??

                                null
                            )
                        },


                /* ==============================================
                   ORDERED DEBATES

                   1. pinned first
                   2. newest updated session first
                ============================================== */

                orderedDebates(
                    state
                ) {

                    return [

                        ...state.debates

                    ].sort(

                        (
                            first,
                            second
                        ) => {

                            const firstPinned =
                                Boolean(
                                    first.pinned
                                )


                            const secondPinned =
                                Boolean(
                                    second.pinned
                                )


                            if (
                                firstPinned !==
                                secondPinned
                            ) {

                                return (

                                    Number(
                                        secondPinned
                                    )

                                    -

                                    Number(
                                        firstPinned
                                    )
                                )
                            }


                            return (

                                getSessionTimestamp(
                                    second
                                )

                                -

                                getSessionTimestamp(
                                    first
                                )
                            )
                        }
                    )
                },


                /* ==============================================
                   RESUMABLE
                ============================================== */

                resumableDebates:
                    state =>

                        state.debates.filter(

                            debate =>

                                RESUMABLE_STATUSES.has(
                                    debate.status
                                )
                        ),


                /* ==============================================
                   READY
                ============================================== */

                readyDebates:
                    state =>

                        state.debates.filter(

                            debate =>

                                debate.status ===
                                'ready'
                        ),


                /* ==============================================
                   ACTIVE
                ============================================== */

                activeDebates:
                    state =>

                        state.debates.filter(

                            debate =>

                                debate.status ===
                                'active'
                        ),


                /* ==============================================
                   PAUSED
                ============================================== */

                pausedDebates:
                    state =>

                        state.debates.filter(

                            debate =>

                                debate.status ===
                                'paused'
                        ),


                /* ==============================================
                   COMPLETED
                ============================================== */

                completedDebates:
                    state =>

                        state.debates.filter(

                            debate =>

                                debate.status ===
                                'completed'
                        ),


                /* ==============================================
                   ABANDONED
                ============================================== */

                abandonedDebates:
                    state =>

                        state.debates.filter(

                            debate =>

                                debate.status ===
                                'abandoned'
                        ),


                /* ==============================================
                   BY STATUS
                ============================================== */

                debatesByStatus:
                    state =>

                        sessionStatus =>

                            state.debates.filter(

                                debate =>

                                    debate.status ===
                                    sessionStatus
                            ),


                /* ==============================================
                   IS DEBATE PINNING
                ============================================== */

                isDebatePinning:
                    state =>

                        debateId => {

                            const id =
                                normalizeId(
                                    debateId
                                )


                            return Boolean(

                                id

                                &&

                                state
                                    .pinningDebateIds[
                                    id
                                    ]
                            )
                        },


                /* ==============================================
                   IS DEBATE HYDRATING
                ============================================== */

                isDebateHydrating:
                    state =>

                        debateId => {

                            const id =
                                normalizeId(
                                    debateId
                                )


                            return Boolean(

                                id

                                &&

                                state
                                    .hydratingDebateIds[
                                    id
                                    ]
                            )
                        }
            },


            /* ==================================================
               ACTIONS
            ================================================== */

            actions: {

                /* ==================================================
                   FETCH DEBATES

                   Default behavior:

                   1. fetch session list
                   2. normalize session list
                   3. hydrate archive summaries
                   4. return fully enriched debates


                   Usage:

                   await store.fetchDebates()


                   Force refresh:

                   await store.fetchDebates({
                       force: true
                   })


                   Skip detail hydration:

                   await store.fetchDebates({
                       hydrate: false
                   })
                ================================================== */

                async fetchDebates({

                                       force = false,

                                       hydrate = true

                                   } = {}) {

                    /* ------------------------------------------
                       USE CURRENT CACHE
                    ------------------------------------------ */

                    if (
                        this.hasLoaded
                        &&
                        !force
                    ) {

                        if (
                            hydrate
                            &&
                            !this.hasHydratedSummaries
                        ) {

                            await this
                                .hydrateDebateSummaries()
                        }


                        return this.debates
                    }


                    /* ------------------------------------------
                       PREVENT DUPLICATE LIST REQUEST
                    ------------------------------------------ */

                    if (
                        this.isLoading
                    ) {

                        return this.debates
                    }


                    this.isLoading =
                        true


                    this.error =
                        null


                    try {

                        const {
                            data
                        } =
                            await api.get(
                                '/chamber/sessions/'
                            )


                        this.debates =
                            normalizeSessions(

                                extractSessions(
                                    data
                                )
                            )


                        this.hasLoaded =
                            true


                        this.hasHydratedSummaries =
                            false


                        this.lastFetchedAt =
                            new Date()
                                .toISOString()


                        /* --------------------------------------
                           VALIDATE SELECTION
                        -------------------------------------- */

                        if (
                            this.selectedDebateId
                            &&
                            !this.debates.some(

                                debate =>

                                    String(
                                        debate.id
                                    )

                                    ===

                                    String(
                                        this.selectedDebateId
                                    )
                            )
                        ) {

                            this.selectedDebateId =
                                null
                        }


                        /* --------------------------------------
                           HYDRATE DISCUSSION SUMMARY DATA
                        -------------------------------------- */

                        if (
                            hydrate
                        ) {

                            await this
                                .hydrateDebateSummaries()
                        }


                        return this.debates

                    } catch (error) {

                        this.setError(
                            error
                        )


                        throw error

                    } finally {

                        this.isLoading =
                            false
                    }
                },


                /* ==================================================
                   REFRESH DEBATES

                   Forces:

                   - fresh session list
                   - fresh pin state
                   - fresh members
                   - fresh risks
                   - fresh confidence
                ================================================== */

                async refreshDebates() {

                    return this.fetchDebates({

                        force:
                            true,

                        hydrate:
                            true
                    })
                },


                /* ==================================================
                   FETCH BY STATUS

                   This does not replace debates[].

                   Detail hydration is optional.
                ================================================== */

                async fetchByStatus(

                    sessionStatus,

                    {
                        hydrate = false
                    } = {}

                ) {

                    this.error =
                        null


                    try {

                        const {
                            data
                        } =
                            await api.get(

                                '/chamber/sessions/',

                                {
                                    params: {

                                        status:
                                        sessionStatus
                                    }
                                }
                            )


                        const sessions =
                            normalizeSessions(

                                extractSessions(
                                    data
                                )
                            )


                        if (
                            !hydrate
                        ) {

                            return sessions
                        }


                        const results =
                            await Promise.all(

                                sessions.map(

                                    async session => {

                                        try {

                                            const response =
                                                await api.get(

                                                    `/chamber/sessions/${session.id}/discussion/`
                                                )


                                            return normalizeSession({

                                                ...session,

                                                ...buildDiscussionSummary(

                                                    response.data,

                                                    session
                                                )
                                            })

                                        } catch {

                                            return session
                                        }
                                    }
                                )
                            )


                        return results

                    } catch (error) {

                        this.setError(
                            error
                        )


                        throw error
                    }
                },


                /* ==================================================
                   HYDRATE ALL DEBATE SUMMARIES

                   Loads each discussion snapshot in parallel.

                   A failure for one session does not destroy the
                   complete archive load.
                ================================================== */

                async hydrateDebateSummaries() {

                    if (
                        !this.debates.length
                    ) {

                        this.hasHydratedSummaries =
                            true


                        return []
                    }


                    if (
                        this.isHydrating
                    ) {

                        return this.debates
                    }


                    this.isHydrating =
                        true


                    this.summaryHydrationErrors =
                        {}


                    try {

                        const results =
                            await Promise.allSettled(

                                this.debates.map(

                                    debate =>

                                        this
                                            .hydrateDebateSummary(
                                                debate.id
                                            )
                                )
                            )


                        results.forEach(

                            (
                                result,
                                index
                            ) => {

                                if (
                                    result.status ===
                                    'rejected'
                                ) {

                                    const debate =
                                        this.debates[
                                            index
                                            ]


                                    if (
                                        debate?.id
                                    ) {

                                        this
                                            .summaryHydrationErrors[
                                            debate.id
                                            ] =

                                            result.reason
                                                ?.message

                                            ??

                                            'Discussion summary could not be loaded.'
                                    }
                                }
                            }
                        )


                        this.hasHydratedSummaries =
                            true


                        return results

                    } finally {

                        this.isHydrating =
                            false
                    }
                },


                /* ==================================================
                   HYDRATE ONE DEBATE SUMMARY
                ================================================== */

                async hydrateDebateSummary(
                    debateId
                ) {

                    const id =
                        normalizeId(
                            debateId
                        )


                    if (!id) {

                        return null
                    }


                    const session =
                        this.debateById(
                            id
                        )


                    if (!session) {

                        return null
                    }


                    if (
                        this.hydratingDebateIds[
                            id
                            ]
                    ) {

                        return session
                    }


                    this.hydratingDebateIds = {

                        ...this.hydratingDebateIds,

                        [id]:
                            true
                    }


                    try {

                        const {
                            data
                        } =
                            await api.get(

                                `/chamber/sessions/${id}/discussion/`
                            )


                        const summary =
                            buildDiscussionSummary(

                                data,

                                session
                            )


                        return this.patchDebate(

                            id,

                            summary
                        )

                    } finally {

                        const next = {

                            ...this.hydratingDebateIds
                        }


                        delete next[
                            id
                            ]


                        this.hydratingDebateIds =
                            next
                    }
                },


                /* ==================================================
                   SELECT DEBATE

                   Local archive selection only.
                ================================================== */

                selectDebate(
                    debateId
                ) {

                    const id =
                        normalizeId(
                            debateId
                        )


                    if (!id) {

                        this.selectedDebateId =
                            null


                        return null
                    }


                    const debate =
                        this.debateById(
                            id
                        )


                    if (!debate) {

                        return null
                    }


                    this.selectedDebateId =
                        id


                    return debate
                },


                /* ==================================================
                   CLEAR SELECTION
                ================================================== */

                clearSelection() {

                    this.selectedDebateId =
                        null
                },


                /* ==================================================
                   UPSERT DEBATE

                   Existing summary fields are preserved if the
                   incoming session response does not include them.

                   Important for pin response:

                   PATCH /pin/

                   returns the updated session metadata but does not
                   need to return the full discussion snapshot.
                ================================================== */

                upsertDebate(
                    session
                ) {

                    if (
                        !session?.id
                    ) {

                        return null
                    }


                    const id =
                        normalizeId(
                            session.id
                        )


                    if (!id) {

                        return null
                    }


                    const index =
                        this.debates.findIndex(

                            debate =>

                                String(
                                    debate.id
                                )

                                ===

                                id
                        )


                    /* ------------------------------------------
                       NEW SESSION
                    ------------------------------------------ */

                    if (
                        index ===
                        -1
                    ) {

                        const normalized =
                            normalizeSession(
                                session
                            )


                        if (!normalized) {

                            return null
                        }


                        this.debates.unshift(
                            normalized
                        )


                        this.hasHydratedSummaries =
                            false


                        return normalized
                    }


                    /* ------------------------------------------
                       EXISTING SESSION
                    ------------------------------------------ */

                    const current =
                        this.debates[
                            index
                            ]


                    const normalized =
                        normalizeSession({

                            ...current,

                            ...session,

                            id
                        })


                    if (!normalized) {

                        return null
                    }


                    this.debates.splice(

                        index,

                        1,

                        normalized
                    )


                    return this.debates[
                        index
                        ]
                },


                /* ==================================================
                   PATCH LOCAL DEBATE
                ================================================== */

                patchDebate(
                    debateId,
                    changes
                ) {

                    const id =
                        normalizeId(
                            debateId
                        )


                    if (
                        !id
                        ||
                        !changes
                        ||
                        typeof changes !==
                        'object'
                    ) {

                        return null
                    }


                    const index =
                        this.debates.findIndex(

                            debate =>

                                String(
                                    debate.id
                                )

                                ===

                                id
                        )


                    if (
                        index ===
                        -1
                    ) {

                        return null
                    }


                    const current =
                        this.debates[
                            index
                            ]


                    const normalized =
                        normalizeSession({

                            ...current,

                            ...changes,

                            id
                        })


                    if (!normalized) {

                        return null
                    }


                    this.debates.splice(

                        index,

                        1,

                        normalized
                    )


                    return this.debates[
                        index
                        ]
                },


                /* ==================================================
                   SET DEBATE PINNED

                   SERVER-BACKED PINNING.

                   Flow:

                   1. capture old pin state
                   2. update UI immediately
                   3. PATCH Django
                   4. merge confirmed server response
                   5. rollback on failure


                   Usage:

                   await store.setDebatePinned(
                       sessionId,
                       true
                   )


                   Unpin:

                   await store.setDebatePinned(
                       sessionId,
                       false
                   )
                ================================================== */

                async setDebatePinned(
                    debateId,
                    pinned
                ) {

                    const id =
                        normalizeId(
                            debateId
                        )


                    if (!id) {

                        return null
                    }


                    const debate =
                        this.debateById(
                            id
                        )


                    if (!debate) {

                        return null
                    }


                    /* ------------------------------------------
                       PREVENT DUPLICATE PIN REQUEST
                    ------------------------------------------ */

                    if (
                        this.pinningDebateIds[
                            id
                            ]
                    ) {

                        return debate
                    }


                    const previousPinned =
                        Boolean(
                            debate.pinned
                        )


                    const nextPinned =
                        Boolean(
                            pinned
                        )


                    /* ------------------------------------------
                       NO CHANGE REQUIRED
                    ------------------------------------------ */

                    if (
                        previousPinned ===
                        nextPinned
                    ) {

                        return debate
                    }


                    this.error =
                        null


                    this.pinningDebateIds = {

                        ...this.pinningDebateIds,

                        [id]:
                            true
                    }


                    /* ------------------------------------------
                       OPTIMISTIC UPDATE
                    ------------------------------------------ */

                    this.patchDebate(

                        id,

                        {
                            pinned:
                            nextPinned
                        }
                    )


                    try {

                        const {
                            data
                        } =
                            await api.patch(

                                `/chamber/sessions/${id}/pin/`,

                                {
                                    pinned:
                                    nextPinned
                                }
                            )


                        /* --------------------------------------
                           MERGE SERVER-CONFIRMED SESSION

                           The backend view returns:

                           {
                               session: {...}
                           }
                        -------------------------------------- */

                        const serverSession =
                            extractSession(
                                data
                            )


                        if (
                            serverSession
                        ) {

                            return this.upsertDebate(
                                serverSession
                            )
                        }


                        /* --------------------------------------
                           FALLBACK

                           If the endpoint only returns pin data,
                           keep the confirmed requested state.
                        -------------------------------------- */

                        return this.patchDebate(

                            id,

                            {
                                pinned:
                                nextPinned
                            }
                        )

                    } catch (error) {

                        /* --------------------------------------
                           ROLLBACK
                        -------------------------------------- */

                        this.patchDebate(

                            id,

                            {
                                pinned:
                                previousPinned
                            }
                        )


                        this.setError(
                            error
                        )


                        throw error

                    } finally {

                        const next = {

                            ...this.pinningDebateIds
                        }


                        delete next[
                            id
                            ]


                        this.pinningDebateIds =
                            next
                    }
                },


                /* ==================================================
                   TOGGLE DEBATE PIN

                   Proper persisted toggle.

                   Usage:

                   await store.toggleDebatePinned(
                       sessionId
                   )
                ================================================== */

                async toggleDebatePinned(
                    debateId
                ) {

                    const id =
                        normalizeId(
                            debateId
                        )


                    if (!id) {

                        return null
                    }


                    const debate =
                        this.debateById(
                            id
                        )


                    if (!debate) {

                        return null
                    }


                    return this.setDebatePinned(

                        id,

                        !Boolean(
                            debate.pinned
                        )
                    )
                },


                /* ==================================================
                   PIN DEBATE
                ================================================== */

                async pinDebate(
                    debateId
                ) {

                    return this.setDebatePinned(

                        debateId,

                        true
                    )
                },


                /* ==================================================
                   UNPIN DEBATE
                ================================================== */

                async unpinDebate(
                    debateId
                ) {

                    return this.setDebatePinned(

                        debateId,

                        false
                    )
                },


                /* ==================================================
                   REMOVE LOCAL DEBATE

                   Local state only.

                   Does not delete from Django.
                ================================================== */

                removeLocalDebate(
                    debateId
                ) {

                    const id =
                        normalizeId(
                            debateId
                        )


                    if (!id) {

                        return false
                    }


                    const previousLength =
                        this.debates.length


                    this.debates =
                        this.debates.filter(

                            debate =>

                                String(
                                    debate.id
                                )

                                !==

                                id
                        )


                    if (
                        this.selectedDebateId
                        &&
                        String(
                            this.selectedDebateId
                        )

                        ===

                        id
                    ) {

                        this.selectedDebateId =
                            null
                    }


                    return (

                        this.debates.length !==
                        previousLength
                    )
                },


                /* ==================================================
                   SET ERROR
                ================================================== */

                setError(
                    error
                ) {

                    this.error =

                        error?.apiError

                        ??

                        error
                            ?.response
                            ?.data
                            ?.error
                            ?.message

                        ??

                        error
                            ?.response
                            ?.data
                            ?.detail

                        ??

                        error?.message

                        ??

                        'Unable to load debates.'
                },


                /* ==================================================
                   CLEAR ERROR
                ================================================== */

                clearError() {

                    this.error =
                        null
                },


                /* ==================================================
                   RESET STORE
                ================================================== */

                reset() {

                    this.debates =
                        []


                    this.selectedDebateId =
                        null


                    this.hasLoaded =
                        false


                    this.isLoading =
                        false


                    this.lastFetchedAt =
                        null


                    this.isHydrating =
                        false


                    this.hasHydratedSummaries =
                        false


                    this.hydratingDebateIds =
                        {}


                    this.summaryHydrationErrors =
                        {}


                    this.pinningDebateIds =
                        {}


                    this.error =
                        null
                }
            }
        }
    )
