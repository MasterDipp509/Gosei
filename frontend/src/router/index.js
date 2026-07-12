// src/router/index.js

import {
    createRouter,
    createWebHistory
} from 'vue-router'


import {
    defineComponent,
    computed,
    h
} from 'vue'


import {
    useProfileStore
} from '@/stores/profileStore.js'


/* ==================================================
   HOME
================================================== */

import HomeAnimeView
    from '@/views/Home/AnimeView.vue'

import HomeProfView
    from '@/views/Home/ProfView.vue'


/* ==================================================
   CHAMBER
================================================== */

import ChamberAnimeView
    from '@/views/Chamber/AnimeView.vue'

import ChamberProfView
    from '@/views/Chamber/ProfView.vue'


/* ==================================================
   ARCHIVE
================================================== */

import ArchiveAnimeView
    from '@/views/Archive/AnimeView.vue'

import ArchiveProfView
    from '@/views/Archive/ProfView.vue'


/* ==================================================
   KNOWLEDGE
================================================== */

import KnowAnimeView
    from '@/views/Knowledge/AniView.vue'

import KnowProfView
    from '@/views/Knowledge/ProfView.vue'


/* ==================================================
   SETTINGS
================================================== */

import SetAnimeView
    from '@/views/Settings/AniView.vue'

import SetProfView
    from '@/views/Settings/ProfView.vue'


/* ==================================================
   OTHER
================================================== */

import TestView
    from '@/views/TestView.vue'


import Enter
    from '@/views/Enter.vue'


/* ==================================================
   PRESENTATION VIEW FACTORY

   Keeps the existing Anime / Professional switch.
================================================== */

function createPresentationView(
    AnimeView,
    ProfView
) {

    return defineComponent({

        setup() {

            const profileStore =
                useProfileStore()


            const activeView =
                computed(
                    () =>

                        profileStore
                            .profile
                            .presentationPreference

                        ===

                        'anime'

                            ? AnimeView

                            : ProfView
                )


            return () =>

                h(

                    activeView.value,

                    {
                        key:

                        profileStore
                            .profile
                            .presentationPreference
                    }
                )
        }
    })
}


/* ==================================================
   ROUTES

   Everything is protected by default.

   Only routes with:

   meta: {
       public: true
   }

   can be opened without authentication.
================================================== */

const routes = [

    /* ==================================================
       HOME
    ================================================== */

    {
        path:
            '/',

        name:
            'home',

        component:
            createPresentationView(

                HomeAnimeView,

                HomeProfView
            )
    },


    /* ==================================================
       CHAMBER
    ================================================== */

    {
        path:
            '/chamber',

        name:
            'chamber',

        component:
            createPresentationView(

                ChamberAnimeView,

                ChamberProfView
            )
    },


    /* ==================================================
       SESSIONS
    ================================================== */

    {
        path:
            '/sessions',

        name:
            'sessions',

        component:
            createPresentationView(

                ArchiveAnimeView,

                ArchiveProfView
            )
    },


    /* ==================================================
       KNOWLEDGE VAULT
    ================================================== */

    {
        path:
            '/knowledge-vault',

        name:
            'knowledge-vault',

        component:
            createPresentationView(

                KnowAnimeView,

                KnowProfView
            )
    },


    /* ==================================================
       SETTINGS
    ================================================== */

    {
        path:
            '/settings',

        name:
            'settings',

        component:
            createPresentationView(

                SetAnimeView,

                SetProfView
            )
    },


    /* ==================================================
       ENTER

       THE ONLY PUBLIC ROUTE.
    ================================================== */

    {
        path:
            '/enter',

        name:
            'enter',

        component:
        Enter,

        meta: {

            public:
                true
        }
    },


    /* ==================================================
       TEST

       Still protected because only Enter is public.
    ================================================== */

    {
        path:
            '/test',

        name:
            'test',

        component:
        TestView
    },


    /* ==================================================
       UNKNOWN ROUTES

       Send everything unknown to home.

       The global auth guard will then send guests to
       Enter before they can access Home.
    ================================================== */

    {
        path:
            '/:pathMatch(.*)*',

        redirect:
            '/'
    }
]


/* ==================================================
   ROUTER
================================================== */

const router =
    createRouter({

        history:
            createWebHistory(),

        routes
    })


/* ==================================================
   AUTH GUARD

   FLOW:

   navigation begins
           ↓
   restore Django session once
           ↓
   authenticated?
       │
       ├── no + protected route
       │       ↓
       │    /enter
       │
       ├── yes + /enter
       │       ↓
       │      /
       │
       └── allowed
================================================== */

router.beforeEach(

    async (
        to
    ) => {

        const profileStore =
            useProfileStore()


        /* ==========================================
           RESTORE SESSION ON FIRST NAVIGATION

           initialize() is safe to call repeatedly.
        ========================================== */

        if (
            !profileStore.isInitialized
        ) {

            try {

                await profileStore.initialize()

            } catch (
                error
                ) {

                console.error(
                    '[Router] Session initialization failed:',
                    error
                )
            }
        }


        /* ==========================================
           ROUTE ACCESS STATE
        ========================================== */

        const isPublic =
            to.meta.public ===
            true


        const isAuthenticated =
            profileStore.isAuthenticated


        /* ==========================================
           GUEST TRYING TO ACCESS PROTECTED ROUTE
        ========================================== */

        if (
            !isPublic

            &&

            !isAuthenticated
        ) {

            return {

                name:
                    'enter',

                query: {

                    redirect:
                    to.fullPath
                },

                replace:
                    true
            }
        }


        /* ==========================================
           AUTHENTICATED USER TRYING TO OPEN ENTER
        ========================================== */

        if (

            to.name ===
            'enter'

            &&

            isAuthenticated
        ) {

            const redirect =
                typeof to.query.redirect ===
                'string'

                    ? to.query.redirect

                    : '/'


            return {
                path:
                redirect,

                replace:
                    true
            }
        }


        /* ==========================================
           ALLOW NAVIGATION
        ========================================== */

        return true
    }
)


/* ==================================================
   EXPORT
================================================== */

export default router
