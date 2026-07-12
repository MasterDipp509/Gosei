<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'


import {
  useRouter
} from 'vue-router'


import {
  ArrowRight,
  AtSign,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserRoundPlus
} from 'lucide-vue-next'


import {
  useProfileStore
} from '@/stores/profileStore.js'


/* ==================================================
   STORES / ROUTER
================================================== */

const router =
    useRouter()


const profileStore =
    useProfileStore()


/* ==================================================
   MODE
================================================== */

const mode =
    ref('login')


const isLogin =
    computed(
        () =>
            mode.value ===
            'login'
    )


/* ==================================================
   COUNCIL SLIDESHOW

   The slideshow is driven by profileStore, not the
   full character catalogue.

   Order:
   1. Selected mediator
   2. The user's five selected panel members
================================================== */

const CHARACTER_SLIDE_MS =
    5200


const currentCharacterIndex =
    ref(0)


const characterVisible =
    ref(true)


let characterSlideTimer =
    null


const councilSlides =
    computed(
        () => {

          const selectedCouncil =

              Array.isArray(
                  profileStore.fullCouncil
              )

                  ? profileStore.fullCouncil

                  : []


          const mediatorId =
              profileStore.mediatorId


          const orderedCouncil = [

            ...selectedCouncil.filter(
                character =>
                    character?.id ===
                    mediatorId
            ),

            ...selectedCouncil.filter(
                character =>
                    character?.id !==
                    mediatorId
            )
          ]


          const seen =
              new Set()


          return orderedCouncil.filter(
              character => {

                if (
                    !character?.id
                    ||
                    seen.has(
                        character.id
                    )
                ) {

                  return false
                }


                seen.add(
                    character.id
                )


                return true
              }
          )
        }
    )


const activeCharacter =
    computed(
        () => {

          if (
              !councilSlides.value.length
          ) {

            return null
          }


          const safeIndex =

              currentCharacterIndex.value

              %

              councilSlides.value.length


          return (

              councilSlides.value[
                  safeIndex
                  ]

              ??

              null
          )
        }
    )


const activeCharacterImage =
    computed(
        () => {

          const id =
              activeCharacter.value?.id


          return id

              ? `/images/char/home/${id}.png`

              : ''
        }
    )


const activeCharacterIsMediator =
    computed(
        () => {

          const characterId =
              activeCharacter.value?.id


          return Boolean(

              characterId

              &&

              characterId ===
              profileStore.mediatorId
          )
        }
    )


const activeCharacterRole =
    computed(
        () =>

            activeCharacter.value?.role

            ||

            (
                activeCharacterIsMediator.value

                    ? 'Mediator'

                    : 'Council Member'
            )
    )





function stopCharacterSlideshow() {

  if (
      characterSlideTimer
  ) {

    clearInterval(
        characterSlideTimer
    )


    characterSlideTimer =
        null
  }
}


function startCharacterSlideshow() {

  stopCharacterSlideshow()


  if (
      typeof window ===
      'undefined'
      ||
      councilSlides.value.length <=
      1
  ) {

    return
  }


  characterSlideTimer =
      window.setInterval(
          () => {

            currentCharacterIndex.value =

                (
                    currentCharacterIndex.value
                    +
                    1
                )

                %

                councilSlides.value.length
          },

          CHARACTER_SLIDE_MS
      )
}


function handleCharacterError() {

  characterVisible.value =
      false
}


watch(

    () =>
        activeCharacter.value?.id,

    () => {

      characterVisible.value =
          true
    }
)


watch(

    () =>
        councilSlides.value
            .map(
                character =>
                    character.id
            )
            .join('|'),

    () => {

      if (
          currentCharacterIndex.value >=
          councilSlides.value.length
      ) {

        currentCharacterIndex.value =
            0
      }


      startCharacterSlideshow()
    }
)


onMounted(
    () => {

      startCharacterSlideshow()
    }
)


onBeforeUnmount(
    () => {

      stopCharacterSlideshow()
    }
)


/* ==================================================
   LOGIN FORM
================================================== */

const loginForm =
    ref({

      identifier:
          '',

      password:
          ''
    })


/* ==================================================
   REGISTER FORM
================================================== */

const registerForm =
    ref({

      firstName:
          '',

      lastName:
          '',

      username:
          '',

      email:
          '',

      password:
          '',

      passwordConfirm:
          ''
    })


/* ==================================================
   PASSWORD VISIBILITY
================================================== */

const showLoginPassword =
    ref(false)


const showRegisterPassword =
    ref(false)


const showRegisterConfirmPassword =
    ref(false)


/* ==================================================
   LOCAL STATE
================================================== */

const localError =
    ref('')


const successMessage =
    ref('')


const identifierInput =
    ref(null)


const firstNameInput =
    ref(null)


/* ==================================================
   STORE STATE
================================================== */

const isSubmitting =
    computed(
        () =>
            profileStore.isLoading
    )


const errorMessage =
    computed(
        () =>
            localError.value
            ||
            profileStore.error
            ||
            ''
    )


/* ==================================================
   DISPLAY CONTENT
================================================== */

const sceneEyebrow =
    computed(
        () =>
            isLogin.value

                ? 'COUNCIL ACCESS'

                : 'NEW COUNCIL MEMBER'
    )


const sceneTitle =
    computed(
        () =>
            isLogin.value

                ? 'Welcome back.'

                : 'Your council is waiting.'
    )


const sceneBody =
    computed(
        () =>
            isLogin.value

                ? 'Return to your discussions, projects, and the council you assembled around the way you think.'

                : 'Create your account, choose how Gosei challenges your thinking, and build a council that feels entirely your own.'
    )


const submitLabel =
    computed(
        () => {

          if (
              isSubmitting.value
          ) {

            return isLogin.value

                ? 'Entering council...'

                : 'Creating account...'
          }


          return isLogin.value

              ? 'Enter Gosei'

              : 'Create account'
        }
    )


/* ==================================================
   VALIDATION HELPERS
================================================== */

function fieldError(
    ...fieldNames
) {

  const errors =
      profileStore.validationErrors


  if (
      !errors
      ||
      typeof errors !==
      'object'
  ) {

    return ''
  }


  for (
      const fieldName of fieldNames
      ) {

    const value =
        errors[fieldName]


    if (
        typeof value ===
        'string'
    ) {

      return value
    }


    if (
        Array.isArray(
            value
        )
        &&
        value.length
    ) {

      return String(
          value[0]
      )
    }
  }


  return ''
}


/* ==================================================
   MODE SWITCH
================================================== */

async function setMode(
    nextMode
) {

  if (
      mode.value === nextMode
      ||
      isSubmitting.value
  ) {

    return
  }


  mode.value =
      nextMode


  localError.value =
      ''


  successMessage.value =
      ''


  profileStore.clearError?.()


  await nextTick()


  if (
      nextMode ===
      'login'
  ) {

    identifierInput.value
        ?.focus()
  }

  else {

    firstNameInput.value
        ?.focus()
  }
}


/* ==================================================
   LOGIN
================================================== */

async function submitLogin() {

  localError.value =
      ''


  successMessage.value =
      ''


  profileStore.clearError?.()


  const identifier =
      loginForm.value
          .identifier
          .trim()


  if (
      !identifier
  ) {

    localError.value =
        'Enter your username or email address.'


    return
  }


  if (
      !loginForm.value.password
  ) {

    localError.value =
        'Enter your password.'


    return
  }


  try {

    await profileStore.login({

      identifier,

      password:
      loginForm.value.password
    })


    await router.push('/')

  } catch (
      error
      ) {

    console.error(
        '[AuthView] Login failed:',
        error
    )
  }
}


/* ==================================================
   REGISTER
================================================== */

async function submitRegister() {

  localError.value =
      ''


  successMessage.value =
      ''


  profileStore.clearError?.()


  const form =
      registerForm.value


  if (
      !form.firstName.trim()
      ||
      !form.lastName.trim()
  ) {

    localError.value =
        'Tell us your first and last name.'


    return
  }


  if (
      !form.username.trim()
  ) {

    localError.value =
        'Choose a username.'


    return
  }


  if (
      !form.email.trim()
  ) {

    localError.value =
        'Enter your email address.'


    return
  }


  if (
      !form.password
  ) {

    localError.value =
        'Create a password.'


    return
  }


  if (
      form.password !==
      form.passwordConfirm
  ) {

    localError.value =
        'The passwords do not match.'


    return
  }


  try {

    await profileStore.register({

      firstName:
          form.firstName.trim(),

      lastName:
          form.lastName.trim(),

      username:
          form.username.trim(),

      email:
          form.email.trim(),

      password:
      form.password,

      passwordConfirm:
      form.passwordConfirm
    })


    await router.push('/')

  } catch (
      error
      ) {

    console.error(
        '[AuthView] Registration failed:',
        error
    )
  }
}


/* ==================================================
   GENERAL SUBMIT
================================================== */

function submit() {

  if (
      isLogin.value
  ) {

    return submitLogin()
  }


  return submitRegister()
}


/* ==================================================
   MODE WATCH
================================================== */

watch(

    mode,

    () => {

      localError.value =
          ''


      successMessage.value =
          ''
    }
)
</script>


<template>
  <main
      class="auth-page"
      :class="{
            'is-register':
                !isLogin
        }"
  >
    <!-- ==========================================
         BACKGROUND
    =========================================== -->

    <div
        class="background-image"
        aria-hidden="true"
    ></div>


    <div
        class="background-vignette"
        aria-hidden="true"
    ></div>


    <div
        class="background-grid"
        aria-hidden="true"
    ></div>


    <div
        class="ambient ambient-purple"
        aria-hidden="true"
    ></div>


    <div
        class="ambient ambient-blue"
        aria-hidden="true"
    ></div>


    <div
        class="scan-line scan-line-one"
        aria-hidden="true"
    ></div>


    <div
        class="scan-line scan-line-two"
        aria-hidden="true"
    ></div>


    <!-- ==========================================
         TOP BAR
    =========================================== -->

    <header class="auth-topbar">
      <div class="brand">
        <div class="brand-mark">
          <span class="brand-mark-inner"></span>
        </div>


        <div class="brand-copy">
          <strong>
            GOSEI
          </strong>

          <span>
                        Decision Council
                    </span>
        </div>
      </div>


      <div class="secure-chip">
        <ShieldCheck
            :size="15"
            :stroke-width="1.8"
        />

        <span>
                    Secure council access
                </span>
      </div>
    </header>


    <!-- ==========================================
         CONTENT
    =========================================== -->

    <section class="auth-layout">

      <!-- ======================================
           LEFT SCENE
      ======================================= -->

      <aside class="scene-panel">

        <div class="scene-copy">
          <div class="scene-eyebrow">
            <span class="eyebrow-line"></span>

            {{ sceneEyebrow }}
          </div>


          <Transition
              name="scene-copy"
              mode="out-in"
          >
            <div
                :key="mode"
                class="scene-copy-inner"
            >
              <h1>
                {{ sceneTitle }}
              </h1>


              <p>
                {{ sceneBody }}
              </p>
            </div>
          </Transition>


          <Transition
              name="scene-status"
              mode="out-in"
          >
            <div
                :key="
                    activeCharacter?.id
                    ??
                    'council-ready'
                "
                class="scene-status"
            >

            </div>
          </Transition>
        </div>


        <!-- Character visual -->

        <div class="character-stage">
          <div
              class="character-ring character-ring-a"
              aria-hidden="true"
          ></div>


          <div
              class="character-ring character-ring-b"
              aria-hidden="true"
          ></div>


          <div
              class="character-glow"
              aria-hidden="true"
          ></div>


          <Transition
              appear
              name="character-enter"
              mode="out-in"
          >
            <img
                v-if="
                    characterVisible
                    &&
                    activeCharacterImage
                "
                :key="activeCharacter?.id"
                class="character-image"
                :src="activeCharacterImage"
                :alt="
                    activeCharacter?.name
                    ??
                    ''
                "
                draggable="false"
                @error="handleCharacterError"
            />
          </Transition>


          <Transition
              name="nameplate-shift"
              mode="out-in"
          >
            <div
                :key="
                    activeCharacter?.id
                    ??
                    'council'
                "
                class="character-nameplate"
            >
              <div>
                <span>
                  {{ activeCharacterRole }}
                </span>

                <strong>
                  {{
                    activeCharacter?.name
                    ??
                    'Your Council'
                  }}
                </strong>
              </div>


              <Sparkles
                  :size="18"
                  :stroke-width="1.6"
              />
            </div>
          </Transition>
        </div>


        <div class="scene-coordinates">
                    <span>
                        GSEI // AUTH
                    </span>

          <span>
                        NODE 01
                    </span>
        </div>
      </aside>


      <!-- ======================================
           AUTH PANEL
      ======================================= -->

      <section class="auth-panel">
        <div class="auth-panel-glow"></div>


        <div class="auth-panel-content">

          <!-- ==================================
               FORM HEADER
          =================================== -->

          <div class="form-header">
            <div class="form-icon">
              <Fingerprint
                  v-if="isLogin"
                  :size="22"
                  :stroke-width="1.7"
              />

              <UserRoundPlus
                  v-else
                  :size="22"
                  :stroke-width="1.7"
              />
            </div>


            <div>
                            <span class="form-kicker">
                                {{
                                isLogin
                                    ? 'IDENTITY VERIFICATION'
                                    : 'COUNCIL REGISTRATION'
                              }}
                            </span>


              <h2>
                {{
                  isLogin
                      ? 'Enter your workspace'
                      : 'Create your identity'
                }}
              </h2>


              <p>
                {{
                  isLogin
                      ? 'Continue where your last discussion ended.'
                      : 'One account. Your preferences, council, and discussions.'
                }}
              </p>
            </div>
          </div>


          <!-- ==================================
               MODE SWITCH
          =================================== -->

          <div
              class="mode-switch"
              role="tablist"
              aria-label="Authentication mode"
          >
            <div
                class="mode-switch-slider"
                :class="{
                                register:
                                    !isLogin
                            }"
            ></div>


            <button
                type="button"
                role="tab"
                :aria-selected="isLogin"
                :class="{
                                active:
                                    isLogin
                            }"
                @click="setMode('login')"
            >
              Sign in
            </button>


            <button
                type="button"
                role="tab"
                :aria-selected="!isLogin"
                :class="{
                                active:
                                    !isLogin
                            }"
                @click="setMode('register')"
            >
              Register
            </button>
          </div>


          <!-- ==================================
               FORMS
          =================================== -->

          <div class="form-stage">
            <Transition
                name="form-shift"
                mode="out-in"
            >

              <!-- ==========================
                   LOGIN
              =========================== -->

              <form
                  v-if="isLogin"
                  key="login"
                  class="auth-form login-form"
                  novalidate
                  @submit.prevent="submit"
              >
                <div class="fields-stack">

                  <!-- Identifier -->

                  <label class="field">
                                        <span class="field-label">
                                            Username or email
                                        </span>


                    <span
                        class="input-shell"
                        :class="{
                                                invalid:
                                                    fieldError(
                                                        'identifier',
                                                        'username',
                                                        'email'
                                                    )
                                            }"
                    >
                                            <AtSign
                                                class="input-icon"
                                                :size="18"
                                                :stroke-width="1.7"
                                            />


                                            <input
                                                ref="identifierInput"
                                                v-model="loginForm.identifier"
                                                type="text"
                                                autocomplete="username"
                                                placeholder="Enter username or email"
                                                :disabled="isSubmitting"
                                            />
                                        </span>


                    <span
                        v-if="
                                                fieldError(
                                                    'identifier',
                                                    'username',
                                                    'email'
                                                )
                                            "
                        class="field-error"
                    >
                                            {{
                        fieldError(
                            'identifier',
                            'username',
                            'email'
                        )
                      }}
                                        </span>
                  </label>


                  <!-- Password -->

                  <label class="field">
                                        <span class="field-label">
                                            Password
                                        </span>


                    <span
                        class="input-shell"
                        :class="{
                                                invalid:
                                                    fieldError(
                                                        'password'
                                                    )
                                            }"
                    >
                                            <LockKeyhole
                                                class="input-icon"
                                                :size="18"
                                                :stroke-width="1.7"
                                            />


                                            <input
                                                v-model="loginForm.password"
                                                :type="
                                                    showLoginPassword
                                                        ? 'text'
                                                        : 'password'
                                                "
                                                autocomplete="current-password"
                                                placeholder="Enter your password"
                                                :disabled="isSubmitting"
                                            />


                                            <button
                                                class="visibility-button"
                                                type="button"
                                                :aria-label="
                                                    showLoginPassword
                                                        ? 'Hide password'
                                                        : 'Show password'
                                                "
                                                tabindex="-1"
                                                @click="
                                                    showLoginPassword =
                                                        !showLoginPassword
                                                "
                                            >
                                                <EyeOff
                                                    v-if="showLoginPassword"
                                                    :size="18"
                                                />

                                                <Eye
                                                    v-else
                                                    :size="18"
                                                />
                                            </button>
                                        </span>


                    <span
                        v-if="
                                                fieldError(
                                                    'password'
                                                )
                                            "
                        class="field-error"
                    >
                                            {{
                        fieldError(
                            'password'
                        )
                      }}
                                        </span>
                  </label>
                </div>


                <div
                    v-if="errorMessage"
                    class="form-message error-message"
                >
                  <span class="message-dot"></span>

                  {{ errorMessage }}
                </div>


                <button
                    class="submit-button"
                    type="submit"
                    :disabled="isSubmitting"
                >
                                    <span>
                                        {{ submitLabel }}
                                    </span>


                  <span class="submit-icon">
                                        <ArrowRight
                                            :size="18"
                                            :stroke-width="2"
                                        />
                                    </span>
                </button>

              </form>


              <!-- ==========================
                   REGISTER
              =========================== -->

              <form
                  v-else
                  key="register"
                  class="auth-form register-form"
                  novalidate
                  @submit.prevent="submit"
              >
                <div class="register-fields">

                  <!-- First name -->

                  <label class="field">
                                        <span class="field-label">
                                            First name
                                        </span>


                    <span
                        class="input-shell compact"
                        :class="{
                                                invalid:
                                                    fieldError(
                                                        'first_name',
                                                        'firstName'
                                                    )
                                            }"
                    >
                                            <User
                                                class="input-icon"
                                                :size="17"
                                                :stroke-width="1.7"
                                            />


                                            <input
                                                ref="firstNameInput"
                                                v-model="registerForm.firstName"
                                                type="text"
                                                autocomplete="given-name"
                                                placeholder="First name"
                                                :disabled="isSubmitting"
                                            />
                                        </span>
                  </label>


                  <!-- Last name -->

                  <label class="field">
                                        <span class="field-label">
                                            Last name
                                        </span>


                    <span
                        class="input-shell compact"
                        :class="{
                                                invalid:
                                                    fieldError(
                                                        'last_name',
                                                        'lastName'
                                                    )
                                            }"
                    >
                                            <User
                                                class="input-icon"
                                                :size="17"
                                                :stroke-width="1.7"
                                            />


                                            <input
                                                v-model="registerForm.lastName"
                                                type="text"
                                                autocomplete="family-name"
                                                placeholder="Last name"
                                                :disabled="isSubmitting"
                                            />
                                        </span>
                  </label>


                  <!-- Username -->

                  <label class="field">
                                        <span class="field-label">
                                            Username
                                        </span>


                    <span
                        class="input-shell compact"
                        :class="{
                                                invalid:
                                                    fieldError(
                                                        'username'
                                                    )
                                            }"
                    >
                                            <AtSign
                                                class="input-icon"
                                                :size="17"
                                                :stroke-width="1.7"
                                            />


                                            <input
                                                v-model="registerForm.username"
                                                type="text"
                                                autocomplete="username"
                                                placeholder="Choose username"
                                                :disabled="isSubmitting"
                                            />
                                        </span>


                    <span
                        v-if="
                                                fieldError(
                                                    'username'
                                                )
                                            "
                        class="field-error"
                    >
                                            {{
                        fieldError(
                            'username'
                        )
                      }}
                                        </span>
                  </label>


                  <!-- Email -->

                  <label class="field">
                                        <span class="field-label">
                                            Email
                                        </span>


                    <span
                        class="input-shell compact"
                        :class="{
                                                invalid:
                                                    fieldError(
                                                        'email'
                                                    )
                                            }"
                    >
                                            <Mail
                                                class="input-icon"
                                                :size="17"
                                                :stroke-width="1.7"
                                            />


                                            <input
                                                v-model="registerForm.email"
                                                type="email"
                                                autocomplete="email"
                                                placeholder="you@email.com"
                                                :disabled="isSubmitting"
                                            />
                                        </span>


                    <span
                        v-if="
                                                fieldError(
                                                    'email'
                                                )
                                            "
                        class="field-error"
                    >
                                            {{
                        fieldError(
                            'email'
                        )
                      }}
                                        </span>
                  </label>


                  <!-- Password -->

                  <label class="field">
                                        <span class="field-label">
                                            Password
                                        </span>


                    <span
                        class="input-shell compact"
                        :class="{
                                                invalid:
                                                    fieldError(
                                                        'password'
                                                    )
                                            }"
                    >
                                            <LockKeyhole
                                                class="input-icon"
                                                :size="17"
                                                :stroke-width="1.7"
                                            />


                                            <input
                                                v-model="registerForm.password"
                                                :type="
                                                    showRegisterPassword
                                                        ? 'text'
                                                        : 'password'
                                                "
                                                autocomplete="new-password"
                                                placeholder="Create password"
                                                :disabled="isSubmitting"
                                            />


                                            <button
                                                class="visibility-button"
                                                type="button"
                                                tabindex="-1"
                                                @click="
                                                    showRegisterPassword =
                                                        !showRegisterPassword
                                                "
                                            >
                                                <EyeOff
                                                    v-if="showRegisterPassword"
                                                    :size="17"
                                                />

                                                <Eye
                                                    v-else
                                                    :size="17"
                                                />
                                            </button>
                                        </span>


                    <span
                        v-if="
                                                fieldError(
                                                    'password'
                                                )
                                            "
                        class="field-error"
                    >
                                            {{
                        fieldError(
                            'password'
                        )
                      }}
                                        </span>
                  </label>


                  <!-- Confirm password -->

                  <label class="field">
                                        <span class="field-label">
                                            Confirm password
                                        </span>


                    <span
                        class="input-shell compact"
                        :class="{
                                                invalid:
                                                    fieldError(
                                                        'password_confirm',
                                                        'passwordConfirm'
                                                    )
                                            }"
                    >
                                            <Check
                                                class="input-icon"
                                                :size="17"
                                                :stroke-width="1.8"
                                            />


                                            <input
                                                v-model="
                                                    registerForm
                                                        .passwordConfirm
                                                "
                                                :type="
                                                    showRegisterConfirmPassword
                                                        ? 'text'
                                                        : 'password'
                                                "
                                                autocomplete="new-password"
                                                placeholder="Repeat password"
                                                :disabled="isSubmitting"
                                            />


                                            <button
                                                class="visibility-button"
                                                type="button"
                                                tabindex="-1"
                                                @click="
                                                    showRegisterConfirmPassword =
                                                        !showRegisterConfirmPassword
                                                "
                                            >
                                                <EyeOff
                                                    v-if="
                                                        showRegisterConfirmPassword
                                                    "
                                                    :size="17"
                                                />

                                                <Eye
                                                    v-else
                                                    :size="17"
                                                />
                                            </button>
                                        </span>
                  </label>
                </div>


                <div
                    v-if="errorMessage"
                    class="form-message error-message"
                >
                  <span class="message-dot"></span>

                  {{ errorMessage }}
                </div>


                <button
                    class="submit-button register-submit"
                    type="submit"
                    :disabled="isSubmitting"
                >
                                    <span>
                                        {{ submitLabel }}
                                    </span>


                  <span class="submit-icon">
                                        <ArrowRight
                                            :size="18"
                                            :stroke-width="2"
                                        />
                                    </span>
                </button>

              </form>
            </Transition>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>


<style scoped>
/* ==================================================
   ROOT
================================================== */

.auth-page {
  position: relative;

  width: 100%;
  height: 100vh;
  height: 100dvh;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  color: #f5f7ff;

  background:
      #080a12;

  font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
}


/* ==================================================
   BACKGROUND
================================================== */

.background-image,
.background-vignette,
.background-grid,
.ambient,
.scan-line {
  position: absolute;
  pointer-events: none;
}


.background-image {
  inset: 0;

  background-image:
      url('/images/settings/bg.png');

  background-size:
      cover;

  background-position:
      center;

  opacity:
      0.34;

  filter:
      saturate(0.78)
      brightness(0.62);
}


.background-vignette {
  inset: 0;

  background:
      radial-gradient(
          circle at 31% 50%,
          rgba(17, 20, 39, 0.08) 0%,
          rgba(7, 8, 16, 0.28) 40%,
          rgba(4, 5, 10, 0.92) 100%
      ),
      linear-gradient(
          90deg,
          rgba(5, 7, 15, 0.35) 0%,
          rgba(5, 7, 15, 0.15) 42%,
          rgba(5, 7, 15, 0.72) 100%
      );
}


.background-grid {
  inset: 0;

  opacity:
      0.15;

  background-image:
      linear-gradient(
          rgba(152, 162, 255, 0.08) 1px,
          transparent 1px
      ),
      linear-gradient(
          90deg,
          rgba(152, 162, 255, 0.08) 1px,
          transparent 1px
      );

  background-size:
      72px 72px;

  mask-image:
      linear-gradient(
          to right,
          transparent,
          black 32%,
          black 100%
      );
}


.ambient {
  border-radius:
      999px;

  filter:
      blur(80px);

  opacity:
      0.2;
}


.ambient-purple {
  width:
      min(42vw, 600px);

  aspect-ratio:
      1;

  left:
      -16vw;

  bottom:
      -28%;

  background:
      #9f4cff;
}


.ambient-blue {
  width:
      min(38vw, 520px);

  aspect-ratio:
      1;

  right:
      -15vw;

  top:
      -20%;

  background:
      #348cff;
}


.scan-line {
  height:
      1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(130, 156, 255, 0.28),
          transparent
      );
}


.scan-line-one {
  width:
      46%;

  top:
      28%;

  left:
      0;
}


.scan-line-two {
  width:
      34%;

  bottom:
      21%;

  right:
      0;
}


/* ==================================================
   TOP BAR
================================================== */

.auth-topbar {
  position: relative;
  z-index: 10;

  height:
      clamp(66px, 8.5vh, 86px);

  padding:
      0 clamp(24px, 4vw, 72px);

  display:
      flex;

  align-items:
      center;

  justify-content:
      space-between;
}


.brand {
  display:
      flex;

  align-items:
      center;

  gap:
      12px;
}


.brand-mark {
  width:
      35px;

  height:
      35px;

  display:
      grid;

  place-items:
      center;

  border:
      1px solid rgba(143, 160, 255, 0.34);

  border-radius:
      11px;

  transform:
      rotate(45deg);

  background:
      linear-gradient(
          145deg,
          rgba(108, 92, 255, 0.23),
          rgba(61, 116, 255, 0.08)
      );

  box-shadow:
      inset 0 0 18px rgba(112, 91, 255, 0.16),
      0 0 26px rgba(80, 88, 255, 0.08);
}


.brand-mark-inner {
  width:
      11px;

  height:
      11px;

  border:
      1px solid rgba(202, 210, 255, 0.8);

  border-radius:
      3px;

  transform:
      rotate(-45deg);
}


.brand-copy {
  display:
      flex;

  flex-direction:
      column;

  line-height:
      1;
}


.brand-copy strong {
  font-size:
      15px;

  letter-spacing:
      0.25em;

  font-weight:
      800;
}


.brand-copy span {
  margin-top:
      6px;

  color:
      rgba(208, 214, 241, 0.48);

  font-size:
      9px;

  letter-spacing:
      0.16em;

  text-transform:
      uppercase;
}


.secure-chip {
  display:
      flex;

  align-items:
      center;

  gap:
      8px;

  padding:
      8px 12px;

  color:
      rgba(219, 225, 250, 0.62);

  font-size:
      10px;

  letter-spacing:
      0.08em;

  text-transform:
      uppercase;

  border:
      1px solid rgba(144, 158, 225, 0.15);

  border-radius:
      999px;

  background:
      rgba(13, 16, 30, 0.42);

  backdrop-filter:
      blur(14px);
}


/* ==================================================
   MAIN LAYOUT
================================================== */

.auth-layout {
  position: relative;
  z-index: 5;

  width:
      min(1440px, calc(100% - 48px));

  height:
      calc(
          100dvh -
          clamp(66px, 8.5vh, 86px) -
          26px
      );

  min-height:
      0;

  margin:
      0 auto 26px;

  display:
      grid;

  grid-template-columns:
        minmax(0, 1.12fr)
        minmax(460px, 0.88fr);

  gap:
      clamp(20px, 3vw, 46px);
}


/* ==================================================
   LEFT SCENE
================================================== */

.scene-panel {
  position:
      relative;

  min-width:
      0;

  min-height:
      0;

  overflow:
      hidden;

  border:
      1px solid rgba(129, 142, 210, 0.11);

  border-radius:
      28px;

  background:
      linear-gradient(
          145deg,
          rgba(15, 17, 33, 0.44),
          rgba(9, 11, 24, 0.17)
      );

  box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.025);

  backdrop-filter:
      blur(6px);
}


.scene-panel::before {
  content:
      '';

  position:
      absolute;

  inset:
      0;

  background:
      linear-gradient(
          105deg,
          rgba(8, 10, 20, 0.92) 0%,
          rgba(8, 10, 20, 0.62) 38%,
          transparent 69%
      );

  pointer-events:
      none;

  z-index:
      1;
}


.scene-copy {
  position:
      absolute;

  z-index:
      5;

  top:
      13%;

  left:
      clamp(28px, 4.5vw, 72px);

  width:
      min(48%, 430px);
}


.scene-eyebrow {
  display:
      flex;

  align-items:
      center;

  gap:
      10px;

  margin-bottom:
      17px;

  color:
      rgba(174, 187, 255, 0.64);

  font-size:
      10px;

  font-weight:
      700;

  letter-spacing:
      0.18em;
}


.eyebrow-line {
  width:
      31px;

  height:
      1px;

  background:
      linear-gradient(
          to right,
          #9c6dff,
          #5f91ff
      );
}


.scene-copy h1 {
  margin:
      0;

  max-width:
      460px;

  font-size:
      clamp(36px, 4.1vw, 67px);

  line-height:
      0.98;

  letter-spacing:
      -0.055em;

  font-weight:
      690;

  text-wrap:
      balance;
}


.scene-copy p {
  max-width:
      390px;

  margin:
      21px 0 0;

  color:
      rgba(213, 219, 243, 0.6);

  font-size:
      clamp(12px, 1.05vw, 15px);

  line-height:
      1.75;
}


.scene-status {
  display:
      flex;

  align-items:
      center;

  gap:
      9px;

  margin-top:
      25px;

  color:
      rgba(224, 229, 248, 0.72);

  font-size:
      10px;

  letter-spacing:
      0.06em;

  text-transform:
      uppercase;
}


.status-pulse {
  width:
      7px;

  height:
      7px;

  border-radius:
      50%;

  background:
      #76caff;

  box-shadow:
      0 0 12px rgba(74, 170, 255, 0.85);

  animation:
      statusPulse 2.3s ease-in-out infinite;
}


.character-stage {
  position:
      absolute;

  z-index:
      3;

  right:
      -2%;

  bottom:
      0;

  width:
      62%;

  height:
      95%;

  min-width:
      380px;
}


.character-image {
  position:
      absolute;

  z-index:
      4;

  right:
      0;

  bottom:
      -2%;

  width:
      100%;

  height:
      100%;

  object-fit:
      contain;

  object-position:
      right bottom;

  filter:
      drop-shadow(
          -22px 12px 35px
          rgba(0, 0, 0, 0.34)
      );
}


.character-glow {
  position:
      absolute;

  z-index:
      1;

  width:
      68%;

  height:
      54%;

  right:
      5%;

  top:
      23%;

  border-radius:
      50%;

  background:
      radial-gradient(
          circle,
          rgba(96, 105, 255, 0.19),
          rgba(133, 69, 255, 0.07) 42%,
          transparent 70%
      );

  filter:
      blur(17px);
}


.character-ring {
  position:
      absolute;

  z-index:
      1;

  border:
      1px solid rgba(130, 146, 255, 0.1);

  border-radius:
      50%;
}


.character-ring-a {
  width:
      430px;

  height:
      430px;

  right:
      -90px;

  top:
      18%;

  animation:
      slowRotate 24s linear infinite;
}


.character-ring-b {
  width:
      315px;

  height:
      315px;

  right:
      -15px;

  top:
      30%;

  border-style:
      dashed;

  animation:
      slowRotateReverse 34s linear infinite;
}


.character-nameplate {
  position:
      absolute;

  z-index:
      8;

  right:
      3%;

  bottom:
      5%;

  min-width:
      180px;

  display:
      flex;

  align-items:
      center;

  justify-content:
      space-between;

  gap:
      20px;

  padding:
      12px 14px;

  border:
      1px solid rgba(151, 164, 235, 0.16);

  border-radius:
      13px;

  background:
      rgba(9, 12, 26, 0.62);

  backdrop-filter:
      blur(18px);

  box-shadow:
      0 15px 40px rgba(0, 0, 0, 0.18);
}


.character-nameplate div {
  display:
      flex;

  flex-direction:
      column;

  gap:
      4px;
}


.character-nameplate span {
  color:
      rgba(155, 172, 246, 0.57);

  font-size:
      8px;

  font-weight:
      700;

  letter-spacing:
      0.18em;
}


.character-nameplate strong {
  font-size:
      13px;

  font-weight:
      600;
}


.character-nameplate svg {
  color:
      #a88aff;
}


.scene-coordinates {
  position:
      absolute;

  z-index:
      6;

  left:
      clamp(28px, 4.5vw, 72px);

  bottom:
      28px;

  display:
      flex;

  gap:
      25px;

  color:
      rgba(175, 185, 224, 0.26);

  font-family:
      monospace;

  font-size:
      8px;

  letter-spacing:
      0.16em;
}


/* ==================================================
   AUTH PANEL
================================================== */

.auth-panel {
  position:
      relative;

  min-width:
      0;

  min-height:
      0;

  overflow:
      hidden;

  display:
      grid;

  place-items:
      center;

  padding:
      clamp(22px, 3vh, 34px)
      clamp(24px, 3vw, 46px);

  border:
      1px solid rgba(142, 154, 216, 0.14);

  border-radius:
      28px;

  background:
      linear-gradient(
          145deg,
          rgba(19, 22, 42, 0.9),
          rgba(10, 13, 28, 0.94)
      );

  box-shadow:
      0 28px 80px rgba(0, 0, 0, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.035);

  backdrop-filter:
      blur(22px);
}


.auth-panel::before {
  content:
      '';

  position:
      absolute;

  top:
      0;

  left:
      13%;

  right:
      13%;

  height:
      1px;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgba(132, 144, 255, 0.6),
          transparent
      );
}


.auth-panel-glow {
  position:
      absolute;

  width:
      420px;

  height:
      420px;

  top:
      -250px;

  right:
      -170px;

  border-radius:
      50%;

  background:
      rgba(86, 82, 255, 0.15);

  filter:
      blur(70px);

  pointer-events:
      none;
}


.auth-panel-content {
  position:
      relative;

  z-index:
      2;

  width:
      min(100%, 500px);

  min-height:
      0;
}


/* ==================================================
   FORM HEADER
================================================== */

.form-header {
  display:
      flex;

  align-items:
      flex-start;

  gap:
      14px;

  margin-bottom:
      clamp(16px, 2.3vh, 24px);
}


.form-icon {
  width:
      43px;

  height:
      43px;

  flex:
      0 0 auto;

  display:
      grid;

  place-items:
      center;

  color:
      #bbb9ff;

  border:
      1px solid rgba(151, 153, 255, 0.22);

  border-radius:
      13px;

  background:
      linear-gradient(
          145deg,
          rgba(111, 91, 255, 0.18),
          rgba(52, 111, 255, 0.1)
      );
}


.form-kicker {
  color:
      rgba(165, 178, 246, 0.51);

  font-size:
      8px;

  font-weight:
      700;

  letter-spacing:
      0.18em;
}


.form-header h2 {
  margin:
      4px 0 5px;

  font-size:
      clamp(21px, 2vw, 28px);

  line-height:
      1.15;

  letter-spacing:
      -0.025em;

  font-weight:
      650;
}


.form-header p {
  margin:
      0;

  color:
      rgba(205, 212, 239, 0.48);

  font-size:
      11px;

  line-height:
      1.5;
}


/* ==================================================
   MODE SWITCH
================================================== */

.mode-switch {
  position:
      relative;

  height:
      43px;

  display:
      grid;

  grid-template-columns:
        1fr 1fr;

  padding:
      4px;

  margin-bottom:
      clamp(17px, 2.3vh, 24px);

  border:
      1px solid rgba(139, 152, 219, 0.12);

  border-radius:
      12px;

  background:
      rgba(5, 8, 20, 0.48);
}


.mode-switch-slider {
  position:
      absolute;

  top:
      4px;

  left:
      4px;

  width:
      calc(50% - 4px);

  height:
      calc(100% - 8px);

  border:
      1px solid rgba(150, 155, 255, 0.19);

  border-radius:
      9px;

  background:
      linear-gradient(
          135deg,
          rgba(96, 85, 255, 0.25),
          rgba(55, 101, 255, 0.15)
      );

  box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04);

  transition:
      transform 0.35s
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      );
}


.mode-switch-slider.register {
  transform:
      translateX(100%);
}


.mode-switch button {
  position:
      relative;

  z-index:
      2;

  border:
      0;

  color:
      rgba(206, 213, 240, 0.42);

  background:
      transparent;

  font: inherit;

  font-size:
      11px;

  font-weight:
      600;

  cursor:
      pointer;

  transition:
      color 0.25s ease;
}


.mode-switch button.active {
  color:
      #f2f4ff;
}


/* ==================================================
   FORM STAGE
================================================== */

.form-stage {
  min-height:
      0;
}


.auth-form {
  width:
      100%;
}


.fields-stack {
  display:
      grid;

  gap:
      16px;
}


.register-fields {
  display:
      grid;

  grid-template-columns:
        repeat(2, minmax(0, 1fr));

  gap:
      12px 11px;
}


/* ==================================================
   FIELDS
================================================== */

.field {
  min-width:
      0;

  display:
      flex;

  flex-direction:
      column;

  gap:
      6px;
}


.field-label {
  padding-left:
      2px;

  color:
      rgba(218, 224, 248, 0.62);

  font-size:
      9px;

  font-weight:
      600;

  letter-spacing:
      0.035em;
}


.input-shell {
  width:
      100%;

  height:
      51px;

  min-width:
      0;

  display:
      flex;

  align-items:
      center;

  gap:
      10px;

  padding:
      0 14px;

  border:
      1px solid rgba(143, 155, 215, 0.13);

  border-radius:
      12px;

  background:
      rgba(5, 8, 20, 0.48);

  transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
}


.input-shell.compact {
  height:
      45px;

  padding:
      0 11px;

  gap:
      8px;
}


.input-shell:focus-within {
  border-color:
      rgba(124, 132, 255, 0.48);

  background:
      rgba(7, 10, 24, 0.72);

  box-shadow:
      0 0 0 3px rgba(106, 93, 255, 0.08),
      inset 0 0 18px rgba(83, 93, 255, 0.025);
}


.input-shell.invalid {
  border-color:
      rgba(255, 103, 133, 0.45);
}


.input-icon {
  flex:
      0 0 auto;

  color:
      rgba(155, 169, 232, 0.5);
}


.input-shell:focus-within
.input-icon {
  color:
      rgba(174, 174, 255, 0.85);
}


.input-shell input {
  width:
      100%;

  min-width:
      0;

  border:
      0;

  outline:
      0;

  color:
      #f0f3ff;

  background:
      transparent;

  font:
      inherit;

  font-size:
      12px;
}


.input-shell input::placeholder {
  color:
      rgba(183, 193, 229, 0.25);
}


.input-shell input:disabled {
  cursor:
      not-allowed;

  opacity:
      0.55;
}


.visibility-button {
  width:
      29px;

  height:
      29px;

  flex:
      0 0 auto;

  display:
      grid;

  place-items:
      center;

  padding:
      0;

  border:
      0;

  color:
      rgba(165, 178, 228, 0.42);

  background:
      transparent;

  cursor:
      pointer;

  transition:
      color 0.2s ease;
}


.visibility-button:hover {
  color:
      rgba(214, 220, 255, 0.8);
}


.field-error {
  color:
      rgba(255, 132, 155, 0.88);

  font-size:
      8px;

  line-height:
      1.25;
}


/* ==================================================
   FORM MESSAGE
================================================== */

.form-message {
  min-height:
      34px;

  display:
      flex;

  align-items:
      center;

  gap:
      8px;

  margin-top:
      13px;

  padding:
      8px 11px;

  border-radius:
      9px;

  font-size:
      9px;

  line-height:
      1.35;
}


.error-message {
  color:
      rgba(255, 180, 194, 0.92);

  border:
      1px solid rgba(255, 86, 122, 0.16);

  background:
      rgba(133, 31, 55, 0.11);
}


.message-dot {
  width:
      5px;

  height:
      5px;

  flex:
      0 0 auto;

  border-radius:
      50%;

  background:
      #ff718f;

  box-shadow:
      0 0 9px rgba(255, 82, 119, 0.7);
}


/* ==================================================
   SUBMIT
================================================== */

.submit-button {
  width:
      100%;

  height:
      51px;

  display:
      flex;

  align-items:
      center;

  justify-content:
      space-between;

  margin-top:
      18px;

  padding:
      0 10px 0 18px;

  border:
      1px solid rgba(155, 157, 255, 0.27);

  border-radius:
      12px;

  color:
      #f7f8ff;

  background:
      linear-gradient(
          105deg,
          rgba(100, 78, 255, 0.86),
          rgba(61, 96, 235, 0.84)
      );

  box-shadow:
      0 12px 30px rgba(73, 62, 255, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);

  font:
      inherit;

  font-size:
      11px;

  font-weight:
      650;

  cursor:
      pointer;

  transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      filter 0.2s ease;
}


.submit-button:hover:not(:disabled) {
  transform:
      translateY(-1px);

  box-shadow:
      0 16px 36px rgba(73, 62, 255, 0.23),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);

  filter:
      brightness(1.05);
}


.submit-button:active:not(:disabled) {
  transform:
      translateY(0);
}


.submit-button:disabled {
  cursor:
      wait;

  opacity:
      0.62;
}


.submit-icon {
  width:
      32px;

  height:
      32px;

  display:
      grid;

  place-items:
      center;

  border-radius:
      8px;

  background:
      rgba(255, 255, 255, 0.1);
}


.register-submit {
  margin-top:
      14px;

  height:
      47px;
}


/* ==================================================
   FOOTER
================================================== */

.form-footer {
  margin-top:
      14px;

  text-align:
      center;

  color:
      rgba(192, 201, 234, 0.42);

  font-size:
      9px;
}


.form-footer button {
  padding:
      0 0 0 4px;

  border:
      0;

  color:
      rgba(174, 176, 255, 0.9);

  background:
      transparent;

  font:
      inherit;

  font-weight:
      600;

  cursor:
      pointer;
}


/* ==================================================
   TRANSITIONS
================================================== */

.form-shift-enter-active,
.form-shift-leave-active {
  transition:
      opacity 0.23s ease,
      transform 0.3s
      cubic-bezier(
          0.22,
          1,
          0.36,
          1
      ),
      filter 0.25s ease;
}


.form-shift-enter-from {
  opacity:
      0;

  transform:
      translateX(18px);

  filter:
      blur(5px);
}


.form-shift-leave-to {
  opacity:
      0;

  transform:
      translateX(-14px);

  filter:
      blur(4px);
}


.scene-copy-enter-active,
.scene-copy-leave-active {
  transition:
      opacity 0.3s ease,
      transform 0.38s ease,
      filter 0.3s ease;
}


.scene-copy-enter-from {
  opacity:
      0;

  transform:
      translateY(10px);

  filter:
      blur(4px);
}


.scene-copy-leave-to {
  opacity:
      0;

  transform:
      translateY(-7px);

  filter:
      blur(3px);
}


.character-enter-enter-active {
  transition:
      opacity 0.9s ease,
      transform 1.1s
      cubic-bezier(
          0.16,
          1,
          0.3,
          1
      ),
      filter 1s ease;
}


.character-enter-leave-active {
  transition:
      opacity 0.42s ease,
      transform 0.52s ease,
      filter 0.42s ease;
}


.character-enter-enter-from {
  opacity:
      0;

  transform:
      translateX(38px)
      scale(0.98);

  filter:
      blur(7px);
}


.character-enter-leave-to {
  opacity:
      0;

  transform:
      translateX(-20px)
      scale(0.985);

  filter:
      blur(5px);
}


.scene-status-enter-active,
.scene-status-leave-active,
.nameplate-shift-enter-active,
.nameplate-shift-leave-active {
  transition:
      opacity 0.28s ease,
      transform 0.34s ease,
      filter 0.28s ease;
}


.scene-status-enter-from,
.nameplate-shift-enter-from {
  opacity:
      0;

  transform:
      translateY(8px);

  filter:
      blur(4px);
}


.scene-status-leave-to,
.nameplate-shift-leave-to {
  opacity:
      0;

  transform:
      translateY(-6px);

  filter:
      blur(3px);
}


/* ==================================================
   ANIMATIONS
================================================== */

@keyframes statusPulse {

  0%,
  100% {
    opacity:
        0.55;

    transform:
        scale(0.86);
  }

  50% {
    opacity:
        1;

    transform:
        scale(1.12);
  }
}


@keyframes slowRotate {

  to {
    transform:
        rotate(360deg);
  }
}


@keyframes slowRotateReverse {

  to {
    transform:
        rotate(-360deg);
  }
}


/* ==================================================
   HEIGHT COMPRESSION

   Keeps the entire auth screen inside the viewport.
================================================== */

@media (max-height: 760px) {

  .auth-topbar {
    height:
        64px;
  }


  .auth-layout {
    height:
        calc(100dvh - 78px);

    margin-bottom:
        14px;
  }


  .scene-copy {
    top:
        10%;
  }


  .scene-copy h1 {
    font-size:
        clamp(34px, 3.7vw, 54px);
  }


  .scene-copy p {
    margin-top:
        15px;

    line-height:
        1.55;
  }


  .scene-status {
    margin-top:
        17px;
  }


  .auth-panel {
    padding-top:
        17px;

    padding-bottom:
        17px;
  }


  .form-header {
    margin-bottom:
        12px;
  }


  .form-icon {
    width:
        38px;

    height:
        38px;
  }


  .form-header h2 {
    margin-top:
        2px;

    font-size:
        21px;
  }


  .mode-switch {
    height:
        39px;

    margin-bottom:
        13px;
  }


  .fields-stack {
    gap:
        12px;
  }


  .input-shell {
    height:
        46px;
  }


  .input-shell.compact {
    height:
        40px;
  }


  .register-fields {
    gap:
        8px 9px;
  }


  .submit-button {
    height:
        46px;

    margin-top:
        13px;
  }


  .register-submit {
    height:
        43px;

    margin-top:
        10px;
  }


  .form-footer {
    margin-top:
        10px;
  }
}


/* ==================================================
   TABLET
================================================== */

@media (max-width: 1050px) {

  .auth-layout {
    grid-template-columns:
            minmax(0, 0.88fr)
            minmax(430px, 1.12fr);

    gap:
        18px;
  }


  .scene-copy {
    width:
        66%;
  }


  .character-stage {
    width:
        78%;

    right:
        -20%;
  }


  .character-nameplate {
    display:
        none;
  }
}


/* ==================================================
   MOBILE / NARROW
================================================== */

@media (max-width: 820px) {

  .auth-topbar {
    padding:
        0 18px;
  }


  .secure-chip {
    display:
        none;
  }


  .auth-layout {
    width:
        calc(100% - 24px);

    grid-template-columns:
            minmax(0, 1fr);

    gap:
        0;
  }


  .scene-panel {
    display:
        none;
  }


  .auth-panel {
    border-radius:
        22px;

    padding:
        25px clamp(18px, 6vw, 38px);
  }


  .auth-panel-content {
    width:
        min(100%, 540px);
  }
}


/* ==================================================
   VERY NARROW
================================================== */

@media (max-width: 520px) {

  .brand-copy span {
    display:
        none;
  }


  .register-fields {
    grid-template-columns:
            1fr;
  }


  .auth-panel {
    padding:
        18px;
  }


  .form-header p {
    display:
        none;
  }
}


/* ==================================================
   VERY SHORT VIEWPORTS
================================================== */

@media (max-height: 610px) {

  .auth-topbar {
    height:
        52px;
  }


  .auth-layout {
    height:
        calc(100dvh - 60px);

    margin-bottom:
        8px;
  }


  .form-header {
    margin-bottom:
        8px;
  }


  .form-header p {
    display:
        none;
  }


  .mode-switch {
    margin-bottom:
        8px;
  }


  .field {
    gap:
        3px;
  }


  .field-label {
    font-size:
        8px;
  }


  .register-fields {
    gap:
        5px 8px;
  }


  .input-shell.compact {
    height:
        35px;
  }


  .register-submit {
    height:
        38px;

    margin-top:
        7px;
  }


  .form-footer {
    margin-top:
        6px;
  }
}


/* ==================================================
   REDUCED MOTION
================================================== */

@media (prefers-reduced-motion: reduce) {

  *,
  *::before,
  *::after {
    animation-duration:
        0.01ms !important;

    animation-iteration-count:
        1 !important;

    transition-duration:
        0.01ms !important;
  }
}
</style>
