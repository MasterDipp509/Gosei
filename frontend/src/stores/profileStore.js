// src/stores/profileStore.js

import {
    defineStore
} from 'pinia'


import api from '@/services/api.js'


import {
    useCharacterStore
} from '@/stores/characterStore.js'


/* ==================================================
   API ENDPOINTS
================================================== */

const ENDPOINTS = {

    csrf:
        '/auth/csrf/',

    register:
        '/auth/register/',

    login:
        '/auth/login/',

    logout:
        '/auth/logout/',

    me:
        '/auth/me/',

    changePassword:
        '/auth/change-password/'
}


/* ==================================================
   DEFAULT PROFILE
================================================== */

const DEFAULT_PROFILE = {

    id:
        null,

    firstName:
        '',

    lastName:
        '',

    username:
        '',

    email:
        '',

    avatar:
        '/images/profile/default-avatar.png',

    bio:
        '',

    presentationPreference:
        'anime',

    stylePreference:
        'balanced',

    modePreference:
        'panel',

    depthPreference:
        'standard',

    theme:
        'neon_office',

    dateJoined:
        null
}


/* ==================================================
   DEFAULT COUNCIL CONFIGURATION
================================================== */

const DEFAULT_PANEL_MEMBER_IDS = [

    'rei-kisaragi',

    'akari-hoshino',

    'mio-tachibana',

    'kaede-mizuhara',

    'riku-amamiya'
]


const DEFAULT_MEDIATOR_ID =
    'mika-amane'


/* ==================================================
   HELPERS
================================================== */

const clone =
    value =>

        JSON.parse(
            JSON.stringify(value)
        )


function isObject(
    value
) {

    return (

        value !== null

        &&

        typeof value ===
        'object'

        &&

        !Array.isArray(
            value
        )
    )
}


/* ==================================================
   CHARACTER IDS
================================================== */

function normalizeCharacterIds(
    characters
) {

    if (
        !Array.isArray(
            characters
        )
    ) {

        return []
    }


    return characters

        .map(
            character => {

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


                return (

                    character?.id

                    ??

                    character?.characterId

                    ??

                    character?.character_id

                    ??

                    null
                )
            }
        )

        .filter(
            Boolean
        )
}


/* ==================================================
   AUTH USER PAYLOAD EXTRACTION
================================================== */

function extractUserPayload(
    payload
) {

    if (
        !isObject(
            payload
        )
    ) {

        return null
    }


    return (

        payload.user

        ??

        payload.data?.user

        ??

        payload.data

        ??

        payload
    )
}


/* ==================================================
   BACKEND USER
   ->
   LEGACY PROFILE OBJECT
================================================== */

function normalizeProfileFromUser(
    payload
) {

    const user =
        extractUserPayload(
            payload
        )


    if (
        !user
    ) {

        return clone(
            DEFAULT_PROFILE
        )
    }


    return {

        id:

            user.id

            ??

            null,


        firstName:

            user.first_name

            ??

            user.firstName

            ??

            '',


        lastName:

            user.last_name

            ??

            user.lastName

            ??

            '',


        username:

            user.username

            ??

            '',


        email:

            user.email

            ??

            '',


        avatar:

            user.avatar

            ??

            DEFAULT_PROFILE.avatar,


        bio:

            user.bio

            ??

            '',


        presentationPreference:

            user.presentation_preference

            ??

            user.presentationPreference

            ??

            DEFAULT_PROFILE
                .presentationPreference,


        stylePreference:

            user.style_preference

            ??

            user.stylePreference

            ??

            DEFAULT_PROFILE
                .stylePreference,


        modePreference:

            user.mode_preference

            ??

            user.modePreference

            ??

            DEFAULT_PROFILE
                .modePreference,


        depthPreference:

            user.depth_preference

            ??

            user.depthPreference

            ??

            DEFAULT_PROFILE
                .depthPreference,


        theme:

            user.theme

            ??

            DEFAULT_PROFILE.theme,


        dateJoined:

            user.date_joined

            ??

            user.dateJoined

            ??

            null
    }
}


/* ==================================================
   PROFILE
   ->
   DJANGO PATCH PAYLOAD
================================================== */

function profileToBackendPayload(
    profile
) {

    return {

        username:
        profile.username,

        email:
        profile.email,

        first_name:
        profile.firstName,

        last_name:
        profile.lastName,

        avatar:
        profile.avatar,

        bio:
        profile.bio,

        presentation_preference:
        profile.presentationPreference,

        style_preference:
        profile.stylePreference,

        mode_preference:
        profile.modePreference,

        depth_preference:
        profile.depthPreference,

        theme:
        profile.theme
    }
}


/* ==================================================
   NORMALIZE PROFILE UPDATE

   Supports both camelCase and snake_case.
================================================== */

function normalizeProfileUpdate(
    data
) {

    if (
        !isObject(
            data
        )
    ) {

        return {}
    }


    const result = {}


    if (
        data.id !==
        undefined
    ) {

        result.id =
            data.id
    }


    if (
        data.firstName !==
        undefined

        ||

        data.first_name !==
        undefined
    ) {

        result.firstName =

            data.firstName

            ??

            data.first_name
    }


    if (
        data.lastName !==
        undefined

        ||

        data.last_name !==
        undefined
    ) {

        result.lastName =

            data.lastName

            ??

            data.last_name
    }


    if (
        data.username !==
        undefined
    ) {

        result.username =
            data.username
    }


    if (
        data.email !==
        undefined
    ) {

        result.email =
            data.email
    }


    if (
        data.avatar !==
        undefined
    ) {

        result.avatar =
            data.avatar
    }


    if (
        data.bio !==
        undefined
    ) {

        result.bio =
            data.bio
    }


    if (
        data.presentationPreference !==
        undefined

        ||

        data.presentation_preference !==
        undefined
    ) {

        result.presentationPreference =

            data.presentationPreference

            ??

            data.presentation_preference
    }


    if (
        data.stylePreference !==
        undefined

        ||

        data.style_preference !==
        undefined
    ) {

        result.stylePreference =

            data.stylePreference

            ??

            data.style_preference
    }


    if (
        data.modePreference !==
        undefined

        ||

        data.mode_preference !==
        undefined
    ) {

        result.modePreference =

            data.modePreference

            ??

            data.mode_preference
    }


    if (
        data.depthPreference !==
        undefined

        ||

        data.depth_preference !==
        undefined
    ) {

        result.depthPreference =

            data.depthPreference

            ??

            data.depth_preference
    }


    if (
        data.theme !==
        undefined
    ) {

        result.theme =
            data.theme
    }


    if (
        data.dateJoined !==
        undefined

        ||

        data.date_joined !==
        undefined
    ) {

        result.dateJoined =

            data.dateJoined

            ??

            data.date_joined
    }


    return result
}


/* ==================================================
   NORMALIZE GENERIC BACKEND PATCH PAYLOAD
================================================== */

function normalizeBackendUpdatePayload(
    payload
) {

    if (
        !isObject(
            payload
        )
    ) {

        return {}
    }


    const result = {}


    /* ==========================================
       IDENTITY
    ========================================== */

    if (
        payload.username !==
        undefined
    ) {

        result.username =
            payload.username
    }


    if (
        payload.email !==
        undefined
    ) {

        result.email =
            payload.email
    }


    if (
        payload.first_name !==
        undefined

        ||

        payload.firstName !==
        undefined
    ) {

        result.first_name =

            payload.first_name

            ??

            payload.firstName
    }


    if (
        payload.last_name !==
        undefined

        ||

        payload.lastName !==
        undefined
    ) {

        result.last_name =

            payload.last_name

            ??

            payload.lastName
    }


    /* ==========================================
       PROFILE
    ========================================== */

    if (
        payload.avatar !==
        undefined
    ) {

        result.avatar =
            payload.avatar
    }


    if (
        payload.bio !==
        undefined
    ) {

        result.bio =
            payload.bio
    }


    /* ==========================================
       PREFERENCES
    ========================================== */

    if (
        payload.presentation_preference !==
        undefined

        ||

        payload.presentationPreference !==
        undefined
    ) {

        result.presentation_preference =

            payload.presentation_preference

            ??

            payload.presentationPreference
    }


    if (
        payload.style_preference !==
        undefined

        ||

        payload.stylePreference !==
        undefined
    ) {

        result.style_preference =

            payload.style_preference

            ??

            payload.stylePreference
    }


    if (
        payload.mode_preference !==
        undefined

        ||

        payload.modePreference !==
        undefined
    ) {

        result.mode_preference =

            payload.mode_preference

            ??

            payload.modePreference
    }


    if (
        payload.depth_preference !==
        undefined

        ||

        payload.depthPreference !==
        undefined
    ) {

        result.depth_preference =

            payload.depth_preference

            ??

            payload.depthPreference
    }


    if (
        payload.theme !==
        undefined
    ) {

        result.theme =
            payload.theme
    }


    /* ==========================================
       COUNCIL
    ========================================== */

    if (
        payload.panel_member_ids !==
        undefined

        ||

        payload.panelMemberIds !==
        undefined

        ||

        payload.panel !==
        undefined
    ) {

        result.panel_member_ids =

            payload.panel_member_ids

            ??

            payload.panelMemberIds

            ??

            payload.panel
    }


    if (
        payload.selected_mediator_id !==
        undefined

        ||

        payload.selectedMediatorId !==
        undefined

        ||

        payload.mediatorId !==
        undefined

        ||

        payload.mediator !==
        undefined
    ) {

        result.selected_mediator_id =

            payload.selected_mediator_id

            ??

            payload.selectedMediatorId

            ??

            payload.mediatorId

            ??

            (
                typeof payload.mediator ===
                'string'

                    ? payload.mediator

                    : payload.mediator?.id
            )
    }


    return result
}


/* ==================================================
   REGISTER PAYLOAD
================================================== */

function normalizeRegisterPayload(
    payload
) {

    return {

        username:

            payload?.username

            ??

            '',


        email:

            payload?.email

            ??

            '',


        first_name:

            payload?.first_name

            ??

            payload?.firstName

            ??

            '',


        last_name:

            payload?.last_name

            ??

            payload?.lastName

            ??

            '',


        password:

            payload?.password

            ??

            '',


        password_confirm:

            payload?.password_confirm

            ??

            payload?.passwordConfirm

            ??

            ''
    }
}


/* ==================================================
   LOGIN PAYLOAD
================================================== */

function normalizeLoginPayload(
    payload
) {

    return {

        identifier:

            payload?.identifier

            ??

            payload?.username

            ??

            payload?.email

            ??

            '',


        password:

            payload?.password

            ??

            ''
    }
}


/* ==================================================
   PASSWORD PAYLOAD
================================================== */

function normalizePasswordPayload(
    payload
) {

    return {

        current_password:

            payload?.current_password

            ??

            payload?.currentPassword

            ??

            '',


        new_password:

            payload?.new_password

            ??

            payload?.newPassword

            ??

            '',


        new_password_confirm:

            payload?.new_password_confirm

            ??

            payload?.newPasswordConfirm

            ??

            ''
    }
}


/* ==================================================
   ERROR MESSAGE
================================================== */

function getErrorMessage(
    error,
    fallback =
    'Something went wrong.'
) {

    const data =
        error?.data


    if (
        typeof data?.detail ===
        'string'
    ) {

        return data.detail
    }


    if (
        typeof data?.message ===
        'string'
    ) {

        return data.message
    }


    if (
        isObject(
            data
        )
    ) {

        const firstValue =
            Object.values(
                data
            )[0]


        if (
            typeof firstValue ===
            'string'
        ) {

            return firstValue
        }


        if (
            Array.isArray(
                firstValue
            )

            &&

            firstValue.length
        ) {

            return String(
                firstValue[0]
            )
        }


        if (
            isObject(
                firstValue
            )
        ) {

            const nestedValue =
                Object.values(
                    firstValue
                )[0]


            if (
                Array.isArray(
                    nestedValue
                )

                &&

                nestedValue.length
            ) {

                return String(
                    nestedValue[0]
                )
            }
        }
    }


    if (
        typeof error?.message ===
        'string'

        &&

        error.message
    ) {

        return error.message
    }


    return fallback
}


/* ==================================================
   STORE
================================================== */

export const useProfileStore =
    defineStore(

        'profile',

        {

            /* ==================================================
               STATE
            ================================================== */

            state:
                () => ({

                    /* ==========================================
                       LEGACY PROFILE STATE

                       Existing SFCs keep using:

                       profileStore.profile.firstName
                       profileStore.profile.username
                       profileStore.profile.theme
                       etc.
                    ========================================== */

                    profile:
                        clone(
                            DEFAULT_PROFILE
                        ),


                    /* ==========================================
                       USER COUNCIL CONFIGURATION
                    ========================================== */

                    panelMemberIds:
                        clone(
                            DEFAULT_PANEL_MEMBER_IDS
                        ),


                    selectedMediatorId:
                    DEFAULT_MEDIATOR_ID,


                    /* ==========================================
                       RAW AUTHENTICATED USER

                       This mirrors the backend response.
                    ========================================== */

                    user:
                        null,


                    /* ==========================================
                       CSRF
                    ========================================== */

                    csrfToken:
                        null,


                    csrfReady:
                        false,


                    /* ==========================================
                       SESSION INITIALIZATION
                    ========================================== */

                    isInitializing:
                        false,


                    isInitialized:
                        false,


                    /* ==========================================
                       REQUEST STATE
                    ========================================== */

                    isLoading:
                        false,


                    isSaving:
                        false,


                    error:
                        null,


                    validationErrors:
                        null,


                    lastFetchedAt:
                        null
                }),


            /* ==================================================
               GETTERS
            ================================================== */

            getters: {

                /* ==========================================
                   PROFILE

                   ORIGINAL GETTERS PRESERVED
                ========================================== */

                fullName(
                    state
                ) {

                    const name = [

                        state.profile
                            .firstName,

                        state.profile
                            .lastName
                    ]
                        .filter(
                            Boolean
                        )

                        .join(
                            ' '
                        )

                        .trim()


                    return (

                        name

                        ||

                        state.profile.username

                        ||

                        ''
                    )
                },


                isAnimeMode(
                    state
                ) {

                    return (

                        state.profile
                            .presentationPreference

                        ===

                        'anime'
                    )
                },


                isProfessionalMode(
                    state
                ) {

                    return (

                        state.profile
                            .presentationPreference

                        ===

                        'professional'
                    )
                },


                activeTheme(
                    state
                ) {

                    return (
                        state.profile.theme
                    )
                },


                /* ==========================================
                   AUTH GETTERS
                ========================================== */

                isAuthenticated(
                    state
                ) {

                    return Boolean(
                        state.profile.id
                    )
                },


                isGuest() {

                    return (
                        !this.isAuthenticated
                    )
                },


                sessionReady(
                    state
                ) {

                    return (

                        state.isInitialized

                        &&

                        !state.isInitializing
                    )
                },


                userId(
                    state
                ) {

                    return (

                        state.profile.id

                        ??

                        null
                    )
                },


                firstName(
                    state
                ) {

                    return (

                        state.profile.firstName

                        ??

                        ''
                    )
                },


                lastName(
                    state
                ) {

                    return (

                        state.profile.lastName

                        ??

                        ''
                    )
                },


                username(
                    state
                ) {

                    return (

                        state.profile.username

                        ??

                        ''
                    )
                },


                email(
                    state
                ) {

                    return (

                        state.profile.email

                        ??

                        ''
                    )
                },


                avatar(
                    state
                ) {

                    return (

                        state.profile.avatar

                        ||

                        DEFAULT_PROFILE.avatar
                    )
                },


                bio(
                    state
                ) {

                    return (

                        state.profile.bio

                        ??

                        ''
                    )
                },


                /* ==========================================
                   ACTIVE PANEL

                   ORIGINAL GETTER PRESERVED
                ========================================== */

                panel(
                    state
                ) {

                    const characterStore =
                        useCharacterStore()


                    return state
                        .panelMemberIds

                        .map(
                            characterId =>

                                characterStore
                                    .panelMemberById(
                                        characterId
                                    )
                        )

                        .filter(
                            Boolean
                        )
                },


                /* ==========================================
                   ACTIVE MEDIATOR

                   ORIGINAL GETTER PRESERVED
                ========================================== */

                mediator(
                    state
                ) {

                    const characterStore =
                        useCharacterStore()


                    return (

                        characterStore
                            .mediatorById(
                                state
                                    .selectedMediatorId
                            )

                        ??

                        null
                    )
                },


                /* ==========================================
                   COMPATIBILITY GETTERS

                   ORIGINAL NAMES PRESERVED
                ========================================== */

                councilMembers() {

                    return (
                        this.panel
                    )
                },


                councilMediator() {

                    return (
                        this.mediator
                    )
                },


                fullCouncil() {

                    return [

                        ...this.panel,

                        this.mediator
                    ]
                        .filter(
                            Boolean
                        )
                },


                councilMemberCount() {

                    return (
                        this.panel.length
                    )
                },


                /* ==========================================
                   ID GETTERS

                   ORIGINAL NAMES PRESERVED
                ========================================== */

                panelIds(
                    state
                ) {

                    return (
                        state.panelMemberIds
                    )
                },


                mediatorId(
                    state
                ) {

                    return (
                        state.selectedMediatorId
                    )
                },


                /* ==========================================
                   CHARACTER STORE PROXIES

                   ORIGINAL NAMES PRESERVED
                ========================================== */

                characterMap() {

                    const characterStore =
                        useCharacterStore()


                    return (
                        characterStore.characterMap
                    )
                },


                availablePanelMembers() {

                    const characterStore =
                        useCharacterStore()


                    return (
                        characterStore.councilMembers
                    )
                },


                availableMediators() {

                    const characterStore =
                        useCharacterStore()


                    return (
                        characterStore.councilMediators
                    )
                },


                availablePanelMemberCount() {

                    const characterStore =
                        useCharacterStore()


                    return (
                        characterStore.panel.length
                    )
                },


                availableMediatorCount() {

                    const characterStore =
                        useCharacterStore()


                    return (
                        characterStore.mediators.length
                    )
                }
            },


            /* ==================================================
               ACTIONS
            ================================================== */

            actions: {

                /* ==========================================
                   ERROR STATE
                ========================================== */

                clearError() {

                    this.error =
                        null


                    this.validationErrors =
                        null
                },


                setRequestError(
                    error,
                    fallback
                ) {

                    this.error =
                        getErrorMessage(
                            error,
                            fallback
                        )


                    this.validationErrors =

                        isObject(
                            error?.data
                        )

                            ? error.data

                            : null
                },


                /* ==========================================
                   AUTH USER HYDRATION

                   Internal bridge:

                   Django snake_case
                   ->
                   existing frontend camelCase
                ========================================== */

                hydrateAuthenticatedUser(
                    payload
                ) {

                    const user =
                        extractUserPayload(
                            payload
                        )


                    if (
                        !user
                    ) {

                        return false
                    }


                    this.user =
                        user


                    this.profile = {

                        ...clone(
                            DEFAULT_PROFILE
                        ),

                        ...normalizeProfileFromUser(
                            user
                        )
                    }


                    const incomingPanel =

                        user.panel_member_ids

                        ??

                        user.panelMemberIds

                        ??

                        null


                    const incomingMediator =

                        user.selected_mediator_id

                        ??

                        user.selectedMediatorId

                        ??

                        null


                    if (
                        incomingPanel
                    ) {

                        const ids =
                            normalizeCharacterIds(
                                incomingPanel
                            )


                        const uniqueIds = [

                            ...new Set(
                                ids
                            )
                        ]


                        if (
                            uniqueIds.length ===
                            5
                        ) {

                            this.panelMemberIds =
                                uniqueIds
                        }
                    }


                    if (
                        incomingMediator
                    ) {

                        this.selectedMediatorId =
                            String(
                                incomingMediator
                            )
                    }


                    this.lastFetchedAt =
                        new Date()
                            .toISOString()


                    return true
                },


                /* ==========================================
                   CSRF HEADERS
                ========================================== */

                csrfHeaders() {

                    if (
                        !this.csrfToken
                    ) {

                        return {}
                    }


                    return {

                        'X-CSRFToken':
                        this.csrfToken
                    }
                },


                /* ==========================================
                   FETCH CSRF TOKEN
                ========================================== */

                async fetchCsrf(
                    {
                        force = false
                    } = {}
                ) {

                    if (
                        this.csrfReady

                        &&

                        this.csrfToken

                        &&

                        !force
                    ) {

                        return this.csrfToken
                    }


                    try {

                        const {
                            data
                        } =
                            await api.get(
                                ENDPOINTS.csrf
                            )


                        const token =

                            data?.csrfToken

                            ??

                            data?.csrf_token

                            ??

                            null


                        if (
                            !token
                        ) {

                            throw new Error(
                                'The server did not return a CSRF token.'
                            )
                        }


                        this.csrfToken =
                            token


                        this.csrfReady =
                            true


                        return token

                    } catch (
                        error
                        ) {

                        this.csrfToken =
                            null


                        this.csrfReady =
                            false


                        throw error
                    }
                },


                /* ==========================================
                   INITIALIZE PROFILE / AUTH SESSION
                ========================================== */

                async initialize() {

                    if (
                        this.isInitialized
                    ) {

                        return this.profile
                    }


                    return this.restoreSession()
                },


                /* ==========================================
                   RESTORE SESSION

                   GET /api/auth/me/
                ========================================== */

                async restoreSession() {

                    if (
                        this.isInitializing
                    ) {

                        return this.profile
                    }


                    this.isInitializing =
                        true


                    this.clearError()


                    try {

                        const {
                            data
                        } =
                            await api.get(
                                ENDPOINTS.me
                            )


                        this.hydrateAuthenticatedUser(
                            data
                        )


                        return this.profile

                    } catch (
                        error
                        ) {

                        if (
                            error?.status ===
                            401

                            ||

                            error?.status ===
                            403
                        ) {

                            this.clearAuthenticatedUser()


                            return null
                        }


                        this.setRequestError(
                            error,
                            'Unable to restore your session.'
                        )


                        throw error

                    } finally {

                        this.isInitializing =
                            false


                        this.isInitialized =
                            true
                    }
                },


                /* ==========================================
                   FETCH PROFILE

                   Alias kept for profile-centric SFCs.
                ========================================== */

                async fetchProfile(
                    {
                        force = false
                    } = {}
                ) {

                    if (
                        this.isInitialized

                        &&

                        this.isAuthenticated

                        &&

                        !force
                    ) {

                        return this.profile
                    }


                    return this.refreshUser()
                },


                /* ==========================================
                   REFRESH CURRENT USER
                ========================================== */

                async refreshUser() {

                    this.clearError()


                    try {

                        const {
                            data
                        } =
                            await api.get(
                                ENDPOINTS.me
                            )


                        this.hydrateAuthenticatedUser(
                            data
                        )


                        this.isInitialized =
                            true


                        return this.profile

                    } catch (
                        error
                        ) {

                        if (
                            error?.status ===
                            401

                            ||

                            error?.status ===
                            403
                        ) {

                            this.clearAuthenticatedUser()


                            this.isInitialized =
                                true


                            return null
                        }


                        this.setRequestError(
                            error,
                            'Unable to load your profile.'
                        )


                        throw error
                    }
                },


                /* ==========================================
                   REGISTER
                ========================================== */

                /* ==========================================
   REGISTER
========================================== */

                async register(
                    payload
                ) {

                    if (
                        this.isLoading
                    ) {

                        return null
                    }


                    this.isLoading =
                        true


                    this.clearError()


                    try {

                        const registerPayload =
                            normalizeRegisterPayload(
                                payload
                            )


                        /* ==================================
                           PUBLIC REGISTER

                           No session or CSRF cookie
                           required before this request.
                        ================================== */

                        const registerResponse =
                            await api.post(

                                ENDPOINTS.register,

                                registerPayload
                            )


                        /* ==================================
                           PUBLIC LOGIN

                           Registration creates the user,
                           then login establishes the session.
                        ================================== */

                        const loginResponse =
                            await api.post(

                                ENDPOINTS.login,

                                {
                                    identifier:
                                    registerPayload
                                        .username,

                                    password:
                                    registerPayload
                                        .password
                                }
                            )


                        this.hydrateAuthenticatedUser(
                            loginResponse.data
                        )


                        this.isInitialized =
                            true


                        /* ==================================
                           ESTABLISH CSRF STATE

                           The user is authenticated now.

                           Future protected mutations such as:

                           PATCH /auth/me/
                           POST /auth/logout/
                           POST /auth/change-password/

                           can use CSRF normally.
                        ================================== */

                        this.csrfToken =
                            null


                        this.csrfReady =
                            false


                        await this.fetchCsrf({
                            force:
                                true
                        })


                        return {

                            registration:
                            registerResponse.data,

                            profile:
                            this.profile,

                            user:
                            this.user
                        }

                    } catch (
                        error
                        ) {

                        this.clearAuthenticatedUser()


                        this.setRequestError(
                            error,
                            'Unable to create your account.'
                        )


                        throw error

                    } finally {

                        this.isLoading =
                            false
                    }
                },


                /* ==========================================
                   LOGIN
                ========================================== */

                /* ==========================================
   LOGIN
========================================== */

                async login(
                    payload
                ) {

                    if (
                        this.isLoading
                    ) {

                        return null
                    }


                    this.isLoading =
                        true


                    this.clearError()


                    try {

                        /* ==================================
                           PUBLIC LOGIN

                           No prior session or CSRF bootstrap
                           required.
                        ================================== */

                        const {
                            data
                        } =
                            await api.post(

                                ENDPOINTS.login,

                                normalizeLoginPayload(
                                    payload
                                )
                            )


                        this.hydrateAuthenticatedUser(
                            data
                        )


                        this.isInitialized =
                            true


                        /* ==================================
                           ESTABLISH CSRF STATE

                           Login has now created the session.

                           Bootstrap CSRF for future protected
                           write operations.
                        ================================== */

                        this.csrfToken =
                            null


                        this.csrfReady =
                            false


                        await this.fetchCsrf({
                            force:
                                true
                        })


                        return this.profile

                    } catch (
                        error
                        ) {

                        this.clearAuthenticatedUser()


                        this.setRequestError(
                            error,
                            'Unable to log in.'
                        )


                        throw error

                    } finally {

                        this.isLoading =
                            false
                    }
                },


                /* ==========================================
                   LOGOUT
                ========================================== */

                async logout() {

                    if (
                        this.isLoading
                    ) {

                        return false
                    }


                    this.isLoading =
                        true


                    this.clearError()


                    try {

                        if (
                            this.isAuthenticated
                        ) {

                            await this.fetchCsrf()


                            await api.post(

                                ENDPOINTS.logout,

                                {},

                                {
                                    headers:
                                        this.csrfHeaders()
                                }
                            )
                        }


                        return true

                    } catch (
                        error
                        ) {

                        if (
                            error?.status !==
                            401
                        ) {

                            this.setRequestError(
                                error,
                                'Unable to log out cleanly.'
                            )
                        }


                        return false

                    } finally {

                        this.clearAuthenticatedUser()


                        this.csrfToken =
                            null


                        this.csrfReady =
                            false


                        this.isInitialized =
                            true


                        this.isLoading =
                            false
                    }
                },


                /* ==========================================
                   CLEAR AUTHENTICATED USER
                ========================================== */

                clearAuthenticatedUser() {

                    this.user =
                        null


                    this.profile =
                        clone(
                            DEFAULT_PROFILE
                        )


                    this.panelMemberIds =
                        clone(
                            DEFAULT_PANEL_MEMBER_IDS
                        )


                    this.selectedMediatorId =
                        DEFAULT_MEDIATOR_ID


                    this.lastFetchedAt =
                        null
                },


                /* ==========================================
                   UPDATE USER ON BACKEND

                   PATCH /api/auth/me/
                ========================================== */

                async updateUser(
                    payload,
                    {
                        silent = false
                    } = {}
                ) {

                    if (
                        !isObject(
                            payload
                        )
                    ) {

                        return null
                    }


                    if (
                        !silent
                    ) {

                        this.clearError()
                    }


                    this.isSaving =
                        true


                    try {

                        await this.fetchCsrf()


                        const {
                            data
                        } =
                            await api.patch(

                                ENDPOINTS.me,

                                normalizeBackendUpdatePayload(
                                    payload
                                ),

                                {
                                    headers:
                                        this.csrfHeaders()
                                }
                            )


                        this.hydrateAuthenticatedUser(
                            data
                        )


                        return this.profile

                    } catch (
                        error
                        ) {

                        if (
                            !silent
                        ) {

                            this.setRequestError(
                                error,
                                'Unable to save your profile.'
                            )
                        }


                        throw error

                    } finally {

                        this.isSaving =
                            false
                    }
                },


                /* ==========================================
                   QUIET BACKGROUND PERSISTENCE

                   Used by legacy synchronous setters.

                   Existing components still receive their
                   immediate true/false return values.
                ========================================== */

                queueUserPatch(
                    payload
                ) {

                    if (
                        !this.isAuthenticated
                    ) {

                        return
                    }


                    this.updateUser(
                        payload,
                        {
                            silent:
                                true
                        }
                    )
                        .catch(
                            error => {

                                console.error(
                                    '[ProfileStore] Background profile sync failed:',
                                    error
                                )
                            }
                        )
                },


                /* ==========================================
                   PRESENTATION MODE

                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                setPresentationPreference(
                    preference,
                    persist = true
                ) {

                    if (
                        ![
                            'anime',
                            'professional'
                        ]
                            .includes(
                                preference
                            )
                    ) {

                        return false
                    }


                    this.profile
                        .presentationPreference =
                        preference


                    if (
                        persist
                    ) {

                        this.queueUserPatch({

                            presentation_preference:
                            preference
                        })
                    }


                    return true
                },


                /* ==========================================
                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                togglePresentationPreference(
                    persist = true
                ) {

                    const preference =

                        this.profile
                            .presentationPreference

                        ===

                        'anime'

                            ? 'professional'

                            : 'anime'


                    this.profile
                        .presentationPreference =
                        preference


                    if (
                        persist
                    ) {

                        this.queueUserPatch({

                            presentation_preference:
                            preference
                        })
                    }


                    return preference
                },


                /* ==========================================
                   THEME

                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                setTheme(
                    theme,
                    persist = true
                ) {

                    if (
                        !theme

                        ||

                        typeof theme !==
                        'string'
                    ) {

                        return false
                    }


                    this.profile.theme =
                        theme


                    if (
                        persist
                    ) {

                        this.queueUserPatch({
                            theme
                        })
                    }


                    return true
                },


                /* ==========================================
                   PROFILE UPDATE

                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                updateProfile(
                    data,
                    persist = true
                ) {

                    if (
                        !isObject(
                            data
                        )
                    ) {

                        return false
                    }


                    const normalized =
                        normalizeProfileUpdate(
                            data
                        )


                    this.profile = {

                        ...this.profile,

                        ...normalized
                    }


                    if (
                        persist
                    ) {

                        this.queueUserPatch(

                            profileToBackendPayload(
                                this.profile
                            )
                        )
                    }


                    return true
                },


                /* ==========================================
                   SET PROFILE

                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                setProfile(
                    profile,
                    persist = true
                ) {

                    if (
                        !isObject(
                            profile
                        )
                    ) {

                        return false
                    }


                    const normalized =
                        normalizeProfileUpdate(
                            profile
                        )


                    this.profile = {

                        ...this.profile,

                        ...normalized
                    }


                    if (
                        persist
                    ) {

                        this.queueUserPatch(

                            profileToBackendPayload(
                                this.profile
                            )
                        )
                    }


                    return true
                },


                /* ==========================================
                   EXPLICIT PROFILE SAVE

                   Useful for pages that edit a local draft,
                   then save only on button press.
                ========================================== */

                async saveProfile(
                    data = null
                ) {

                    if (
                        isObject(
                            data
                        )
                    ) {

                        this.updateProfile(
                            data,
                            false
                        )
                    }


                    return this.updateUser(

                        profileToBackendPayload(
                            this.profile
                        )
                    )
                },


                /* ==========================================
                   CHARACTER ACCESS HELPERS

                   ORIGINAL ACTION NAMES PRESERVED
                ========================================== */

                getCharacterById(
                    characterId
                ) {

                    const characterStore =
                        useCharacterStore()


                    return (

                        characterStore
                            .characterById(
                                characterId
                            )
                    )
                },


                getPanelMemberById(
                    characterId
                ) {

                    const characterStore =
                        useCharacterStore()


                    return (

                        characterStore
                            .panelMemberById(
                                characterId
                            )
                    )
                },


                getMediatorById(
                    mediatorId
                ) {

                    const characterStore =
                        useCharacterStore()


                    return (

                        characterStore
                            .mediatorById(
                                mediatorId
                            )
                    )
                },


                /* ==========================================
                   SET FULL PANEL

                   ORIGINAL ACTION NAME PRESERVED.

                   Optional second parameter:

                   setPanel(panel, false)

                   skips backend persistence during hydration
                   or local drafting.
                ========================================== */

                setPanel(
                    panel,
                    persist = true
                ) {

                    const characterStore =
                        useCharacterStore()


                    const ids =
                        normalizeCharacterIds(
                            panel
                        )


                    const uniqueIds = [

                        ...new Set(
                            ids
                        )
                    ]


                    if (
                        uniqueIds.length !==
                        5
                    ) {

                        console.warn(
                            '[ProfileStore] Panel must contain exactly 5 unique characters.'
                        )


                        return false
                    }


                    /* ==================================
                       ONLY CATALOGUE-VALIDATE IF THE
                       CHARACTER STORE IS HYDRATED.

                       Auth can load before characters.
                    ================================== */

                    const catalogueAvailable =

                        Array.isArray(
                            characterStore.panel
                        )

                        &&

                        characterStore
                            .panel
                            .length >
                        0


                    if (
                        catalogueAvailable
                    ) {

                        const allValid =
                            uniqueIds.every(
                                characterId =>

                                    Boolean(

                                        characterStore
                                            .panelMemberById(
                                                characterId
                                            )
                                    )
                            )


                        if (
                            !allValid
                        ) {

                            console.warn(
                                '[ProfileStore] Panel contains one or more invalid character IDs.'
                            )


                            return false
                        }
                    }


                    this.panelMemberIds =
                        uniqueIds


                    if (
                        persist
                    ) {

                        this.queueUserPatch({

                            panel_member_ids:
                            uniqueIds
                        })
                    }


                    return true
                },


                /* ==========================================
                   REPLACE ONE PANEL MEMBER

                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                replacePanelMember(
                    currentCharacterId,
                    newCharacterId,
                    persist = true
                ) {

                    const characterStore =
                        useCharacterStore()


                    const currentIndex =
                        this.panelMemberIds
                            .indexOf(
                                currentCharacterId
                            )


                    if (
                        currentIndex ===
                        -1
                    ) {

                        return false
                    }


                    if (
                        this.panelMemberIds
                            .includes(
                                newCharacterId
                            )
                    ) {

                        return false
                    }


                    const catalogueAvailable =

                        Array.isArray(
                            characterStore.panel
                        )

                        &&

                        characterStore
                            .panel
                            .length >
                        0


                    if (
                        catalogueAvailable

                        &&

                        !characterStore
                            .panelMemberById(
                                newCharacterId
                            )
                    ) {

                        return false
                    }


                    this.panelMemberIds.splice(

                        currentIndex,

                        1,

                        newCharacterId
                    )


                    if (
                        persist
                    ) {

                        this.queueUserPatch({

                            panel_member_ids:
                                clone(
                                    this.panelMemberIds
                                )
                        })
                    }


                    return true
                },


                /* ==========================================
                   SET MEDIATOR

                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                setMediator(
                    mediator,
                    persist = true
                ) {

                    const characterStore =
                        useCharacterStore()


                    const mediatorId =

                        typeof mediator ===
                        'string'

                            ? mediator

                            : (

                                mediator?.id

                                ??

                                mediator?.mediatorId

                                ??

                                mediator?.mediator_id

                                ??

                                null
                            )


                    if (
                        !mediatorId
                    ) {

                        return false
                    }


                    const catalogueAvailable =

                        Array.isArray(
                            characterStore.mediators
                        )

                        &&

                        characterStore
                            .mediators
                            .length >
                        0


                    if (
                        catalogueAvailable
                    ) {

                        const exists =
                            Boolean(

                                characterStore
                                    .mediatorById(
                                        mediatorId
                                    )
                            )


                        if (
                            !exists
                        ) {

                            console.warn(
                                `[ProfileStore] Mediator "${mediatorId}" does not exist.`
                            )


                            return false
                        }
                    }


                    this.selectedMediatorId =
                        String(
                            mediatorId
                        )


                    if (
                        persist
                    ) {

                        this.queueUserPatch({

                            selected_mediator_id:
                            this.selectedMediatorId
                        })
                    }


                    return true
                },


                /* ==========================================
                   COUNCIL CONFIGURATION

                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                setCouncilConfiguration(
                    payload,
                    persist = true
                ) {

                    if (
                        !isObject(
                            payload
                        )
                    ) {

                        return false
                    }


                    let panelUpdated =
                        true


                    let mediatorUpdated =
                        true


                    const incomingPanel =

                        payload.panelMemberIds

                        ??

                        payload.panel_member_ids

                        ??

                        payload.panel


                    const incomingMediator =

                        payload.selectedMediatorId

                        ??

                        payload.selected_mediator_id

                        ??

                        payload.mediatorId

                        ??

                        payload.mediator_id

                        ??

                        payload.mediator


                    if (
                        incomingPanel
                    ) {

                        panelUpdated =
                            this.setPanel(
                                incomingPanel,
                                false
                            )
                    }


                    if (
                        incomingMediator
                    ) {

                        mediatorUpdated =
                            this.setMediator(
                                incomingMediator,
                                false
                            )
                    }


                    const successful =

                        panelUpdated

                        &&

                        mediatorUpdated


                    if (
                        successful

                        &&

                        persist
                    ) {

                        this.queueUserPatch({

                            panel_member_ids:
                                clone(
                                    this.panelMemberIds
                                ),

                            selected_mediator_id:
                            this.selectedMediatorId
                        })
                    }


                    return successful
                },


                /* ==========================================
                   EXPLICIT COUNCIL SAVE

                   Awaitable.

                   Ideal for the council settings page's
                   Save button.
                ========================================== */

                async saveCouncilConfiguration(
                    payload = null
                ) {

                    if (
                        isObject(
                            payload
                        )
                    ) {

                        const updated =
                            this
                                .setCouncilConfiguration(
                                    payload,
                                    false
                                )


                        if (
                            !updated
                        ) {

                            return false
                        }
                    }


                    await this.updateUser({

                        panel_member_ids:
                            clone(
                                this.panelMemberIds
                            ),

                        selected_mediator_id:
                        this.selectedMediatorId
                    })


                    return true
                },


                /* ==========================================
                   UPDATE COUNCIL

                   AUTH-LAYER CONVENIENCE ACTION
                ========================================== */

                async updateCouncil(
                    {
                        panelMemberIds,
                        selectedMediatorId
                    }
                ) {

                    return this.saveCouncilConfiguration({

                        panelMemberIds,

                        selectedMediatorId
                    })
                },


                /* ==========================================
                   CHARACTER CATALOGUE BRIDGE

                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                setCharacters(
                    payload
                ) {

                    const characterStore =
                        useCharacterStore()


                    characterStore
                        .setCharacters(
                            payload
                        )


                    const panel =

                        payload?.panelMemberIds

                        ??

                        payload?.panel_member_ids


                    const mediator =

                        payload?.selectedMediatorId

                        ??

                        payload?.selected_mediator_id


                    if (
                        panel
                    ) {

                        this.setPanel(
                            panel,
                            false
                        )
                    }


                    if (
                        mediator
                    ) {

                        this.setMediator(
                            mediator,
                            false
                        )
                    }
                },


                /* ==========================================
                   RESET COUNCIL

                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                resetCouncil(
                    persist = true
                ) {

                    this.panelMemberIds =
                        clone(
                            DEFAULT_PANEL_MEMBER_IDS
                        )


                    this.selectedMediatorId =
                        DEFAULT_MEDIATOR_ID


                    if (
                        persist
                    ) {

                        this.queueUserPatch({

                            panel_member_ids:
                                clone(
                                    this.panelMemberIds
                                ),

                            selected_mediator_id:
                            this.selectedMediatorId
                        })
                    }
                },


                /* ==========================================
                   UPDATE PRESENTATION PREFERENCE

                   AUTH-LAYER CONVENIENCE ACTION
                ========================================== */

                async updatePresentationPreference(
                    preference
                ) {

                    const valid =
                        this
                            .setPresentationPreference(
                                preference,
                                false
                            )


                    if (
                        !valid
                    ) {

                        return false
                    }


                    await this.updateUser({

                        presentation_preference:
                        preference
                    })


                    return true
                },


                /* ==========================================
                   UPDATE THEME

                   AUTH-LAYER CONVENIENCE ACTION
                ========================================== */

                async updateTheme(
                    theme
                ) {

                    const valid =
                        this.setTheme(
                            theme,
                            false
                        )


                    if (
                        !valid
                    ) {

                        return false
                    }


                    await this.updateUser({
                        theme
                    })


                    return true
                },


                /* ==========================================
                   CHANGE PASSWORD
                ========================================== */

                async changePassword(
                    payload
                ) {

                    if (
                        this.isLoading
                    ) {

                        return false
                    }


                    this.isLoading =
                        true


                    this.clearError()


                    try {

                        await this.fetchCsrf()


                        await api.post(

                            ENDPOINTS
                                .changePassword,

                            normalizePasswordPayload(
                                payload
                            ),

                            {
                                headers:
                                    this.csrfHeaders()
                            }
                        )


                        /* ==================================
                           BACKEND CALLS
                           update_session_auth_hash(),
                           SO USER REMAINS LOGGED IN.
                        ================================== */

                        this.csrfToken =
                            null


                        this.csrfReady =
                            false


                        await this.fetchCsrf({
                            force:
                                true
                        })


                        return true

                    } catch (
                        error
                        ) {

                        this.setRequestError(
                            error,
                            'Unable to change your password.'
                        )


                        throw error

                    } finally {

                        this.isLoading =
                            false
                    }
                },


                /* ==========================================
                   RESET PROFILE ONLY

                   ORIGINAL ACTION NAME PRESERVED.

                   Council remains unchanged.

                   This is a LOCAL reset only.
                ========================================== */

                resetProfile() {

                    const currentPanelMemberIds =
                        clone(
                            this.panelMemberIds
                        )


                    const currentMediatorId =
                        this.selectedMediatorId


                    const currentAuthState = {

                        user:
                        this.user,

                        csrfToken:
                        this.csrfToken,

                        csrfReady:
                        this.csrfReady,

                        isInitializing:
                        this.isInitializing,

                        isInitialized:
                        this.isInitialized,

                        isLoading:
                        this.isLoading,

                        isSaving:
                        this.isSaving,

                        error:
                        this.error,

                        validationErrors:
                        this.validationErrors,

                        lastFetchedAt:
                        this.lastFetchedAt
                    }


                    this.$reset()


                    this.panelMemberIds =
                        currentPanelMemberIds


                    this.selectedMediatorId =
                        currentMediatorId


                    this.user =
                        currentAuthState.user


                    this.csrfToken =
                        currentAuthState
                            .csrfToken


                    this.csrfReady =
                        currentAuthState
                            .csrfReady


                    this.isInitializing =
                        currentAuthState
                            .isInitializing


                    this.isInitialized =
                        currentAuthState
                            .isInitialized


                    this.isLoading =
                        currentAuthState
                            .isLoading


                    this.isSaving =
                        currentAuthState
                            .isSaving


                    this.error =
                        currentAuthState.error


                    this.validationErrors =
                        currentAuthState
                            .validationErrors


                    this.lastFetchedAt =
                        currentAuthState
                            .lastFetchedAt
                },


                /* ==========================================
                   FULL RESET

                   ORIGINAL ACTION NAME PRESERVED
                ========================================== */

                resetAllProfileData() {

                    this.$reset()
                },


                /* ==========================================
                   AUTH STATE RESET

                   Local only.

                   Does not call /logout/.
                ========================================== */

                resetAuthState() {

                    this.clearAuthenticatedUser()


                    this.csrfToken =
                        null


                    this.csrfReady =
                        false


                    this.isInitializing =
                        false


                    this.isInitialized =
                        false


                    this.isLoading =
                        false


                    this.isSaving =
                        false


                    this.error =
                        null


                    this.validationErrors =
                        null
                }
            }
        }
    )
