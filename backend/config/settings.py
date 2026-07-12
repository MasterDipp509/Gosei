"""
Django settings for config project.

Development configuration for Gosei.

Current development behaviour:

- Accept connections from any host.
- Allow CORS requests from any origin.
- Allow credentialed requests.
- Support HTTP development.
- Keep authenticated browser sessions for 30 days.
- Refresh session expiry while the user remains active.

IMPORTANT:
This configuration is intentionally permissive for development.
Lock down ALLOWED_HOSTS and CORS before production deployment.
"""

from pathlib import Path

import os


# ==================================================
# PATHS
# ==================================================

BASE_DIR = (
    Path(__file__)
    .resolve()
    .parent
    .parent
)


# ==================================================
# ENVIRONMENT HELPERS
# ==================================================

def env_bool(
        name,
        default=False,
):

    raw_value = os.getenv(
        name,
        "1" if default else "0",
    )

    return (
            str(raw_value)
            .strip()
            .lower()
            in {
                "1",
                "true",
                "yes",
                "on",
            }
    )


def env_list(
        name,
        default=None,
):

    raw_value = os.getenv(
        name,
        "",
    )

    if raw_value.strip():

        return [
            value.strip()

            for value in raw_value.split(",")

            if value.strip()
        ]


    return list(
        default
        or
        []
    )


# ==================================================
# SECURITY
# ==================================================

DEFAULT_SECRET_KEY = (
    "django-insecure-"
    "w(kpcx=_pag8)&&^&#f*@khjlr$5("
    "pf86s#b0w&y(48k0w#mex"
)


SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    DEFAULT_SECRET_KEY,
)


DEBUG = env_bool(
    "DJANGO_DEBUG",
    True,
)


# ==================================================
# HTTP / HTTPS MODE
#
# DEVELOPMENT:
#
# USE_HTTPS=0
#
# PRODUCTION:
#
# USE_HTTPS=1
# ==================================================

USE_HTTPS = env_bool(
    "USE_HTTPS",
    False,
)


# ==================================================
# ALLOWED HOSTS
#
# DEVELOPMENT:
#
# Accept connections using:
#
# - localhost
# - 127.0.0.1
# - any LAN IP
# - any Docker hostname
# - any local hostname
# - any development machine on the network
#
# IMPORTANT:
#
# Lock this down before production deployment.
# ==================================================

ALLOWED_HOSTS = [
    "*",
]


# ==================================================
# APPLICATIONS
# ==================================================

INSTALLED_APPS = [

    # ----------------------------------------------
    # DJANGO
    # ----------------------------------------------

    "django.contrib.admin",

    "django.contrib.auth",

    "django.contrib.contenttypes",

    "django.contrib.sessions",

    "django.contrib.messages",

    "django.contrib.staticfiles",


    # ----------------------------------------------
    # THIRD PARTY
    # ----------------------------------------------

    "rest_framework",

    "corsheaders",


    # ----------------------------------------------
    # LOCAL
    # ----------------------------------------------

    "api",

    "chamber",

    "accounts.apps.AccountsConfig",
]


# ==================================================
# SESSION CONFIGURATION
#
# Behaviour:
#
# - session survives browser close
# - valid for 30 days
# - active usage refreshes the 30-day expiry
# - session cookie unavailable to JavaScript
# - Secure flag enabled only for HTTPS mode
#
# This effectively behaves as:
#
# "Remember this device for 30 days."
# ==================================================

SESSION_ENGINE = (
    "django.contrib.sessions.backends.db"
)


SESSION_COOKIE_NAME = (
    "sessionid"
)


# 30 days in seconds.

SESSION_COOKIE_AGE = (
        60
        *
        60
        *
        24
        *
        30
)


# Keep session after browser closes.

SESSION_EXPIRE_AT_BROWSER_CLOSE = (
    False
)


# Refresh expiry on active requests.

SESSION_SAVE_EVERY_REQUEST = (
    True
)


# JavaScript cannot directly read the session cookie.

SESSION_COOKIE_HTTPONLY = (
    True
)


# Good default for same-site application access.

SESSION_COOKIE_SAMESITE = (
    "Lax"
)


# False for HTTP development.
# True when USE_HTTPS=1.

SESSION_COOKIE_SECURE = (
    USE_HTTPS
)


# Session is valid across the whole site.

SESSION_COOKIE_PATH = (
    "/"
)


# ==================================================
# CSRF COOKIE CONFIGURATION
# ==================================================

CSRF_COOKIE_NAME = (
    "csrftoken"
)


# Axios needs to read the CSRF cookie so it can send:
#
# X-CSRFToken: ...
#
# Therefore this must remain False.

CSRF_COOKIE_HTTPONLY = (
    False
)


CSRF_COOKIE_SAMESITE = (
    "Lax"
)


CSRF_COOKIE_SECURE = (
    USE_HTTPS
)


CSRF_COOKIE_PATH = (
    "/"
)


# ==================================================
# SECURITY REDIRECTS
# ==================================================

SECURE_SSL_REDIRECT = (
        USE_HTTPS
        and
        not DEBUG
)


# ==================================================
# REVERSE PROXY HTTPS SUPPORT
#
# Useful when:
#
# Browser
#     ->
# HTTPS Nginx
#     ->
# HTTP Django container
# ==================================================

SECURE_PROXY_SSL_HEADER = (

    "HTTP_X_FORWARDED_PROTO",

    "https",
)


# ==================================================
# MIDDLEWARE
# ==================================================

MIDDLEWARE = [

    # ----------------------------------------------
    # CORS
    #
    # Keep near the top of the middleware stack.
    # ----------------------------------------------

    "corsheaders.middleware.CorsMiddleware",


    # ----------------------------------------------
    # SECURITY
    # ----------------------------------------------

    "django.middleware.security.SecurityMiddleware",


    # ----------------------------------------------
    # SESSION
    # ----------------------------------------------

    "django.contrib.sessions.middleware.SessionMiddleware",


    # ----------------------------------------------
    # COMMON
    # ----------------------------------------------

    "django.middleware.common.CommonMiddleware",


    # ----------------------------------------------
    # CSRF
    # ----------------------------------------------

    "django.middleware.csrf.CsrfViewMiddleware",


    # ----------------------------------------------
    # AUTHENTICATION
    # ----------------------------------------------

    "django.contrib.auth.middleware.AuthenticationMiddleware",


    # ----------------------------------------------
    # MESSAGES
    # ----------------------------------------------

    "django.contrib.messages.middleware.MessageMiddleware",


    # ----------------------------------------------
    # CLICKJACKING
    # ----------------------------------------------

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ==================================================
# URLS
# ==================================================

ROOT_URLCONF = (
    "config.urls"
)


# ==================================================
# TEMPLATES
# ==================================================

TEMPLATES = [

    {

        "BACKEND":
            (
                "django.template.backends."
                "django.DjangoTemplates"
            ),


        "DIRS":
            [],


        "APP_DIRS":
            True,


        "OPTIONS": {

            "context_processors": [

                (
                    "django.template.context_processors."
                    "debug"
                ),

                (
                    "django.template.context_processors."
                    "request"
                ),

                (
                    "django.contrib.auth.context_processors."
                    "auth"
                ),

                (
                    "django.contrib.messages.context_processors."
                    "messages"
                ),
            ],
        },
    },
]


# ==================================================
# WSGI
# ==================================================

WSGI_APPLICATION = (
    "config.wsgi.application"
)


# ==================================================
# DATABASE
# ==================================================

DATABASES = {

    "default": {

        "ENGINE":
            "django.db.backends.postgresql",


        "NAME":
            os.getenv(
                "POSTGRES_DB",
                "gosei_db",
            ),


        "USER":
            os.getenv(
                "POSTGRES_USER",
                "gosei_user",
            ),


        "PASSWORD":
            os.getenv(
                "POSTGRES_PASSWORD",
                "gosei_password",
            ),


        "HOST":
            os.getenv(
                "POSTGRES_HOST",
                "db",
            ),


        "PORT":
            os.getenv(
                "POSTGRES_PORT",
                "5432",
            ),
    }
}


# ==================================================
# CORS
#
# DEVELOPMENT CONFIGURATION:
#
# Accept requests from any browser origin.
#
# This means:
#
# - any localhost port
# - any LAN address
# - any Vite development server
# - other machines on the network
#
# Credentials remain enabled for Django sessions.
# ==================================================

CORS_ALLOW_ALL_ORIGINS = (
    True
)


CORS_ALLOW_CREDENTIALS = (
    True
)


# ==================================================
# CSRF TRUSTED ORIGINS
#
# Same-origin requests through Nginx do not need to be
# manually listed here.
#
# Cross-origin authenticated writes still require a
# trusted origin because DRF SessionAuthentication
# correctly enforces CSRF.
#
# Additional development origins can be supplied with:
#
# DJANGO_CSRF_TRUSTED_ORIGINS=
# http://192.168.1.5:5173,
# http://10.0.0.20:5173
# ==================================================

DEFAULT_CSRF_TRUSTED_ORIGINS = [

    # ----------------------------------------------
    # LOCALHOST
    # ----------------------------------------------

    "http://localhost",

    "http://127.0.0.1",


    # ----------------------------------------------
    # COMMON DEV PORTS
    # ----------------------------------------------

    "http://localhost:5173",

    "http://127.0.0.1:5173",


    "http://localhost:3000",

    "http://127.0.0.1:3000",


    "http://localhost:4173",

    "http://127.0.0.1:4173",


    "http://localhost:8080",

    "http://127.0.0.1:8080",


    # ----------------------------------------------
    # CURRENT GOSEI LAN ADDRESS
    # ----------------------------------------------

    "http://192.168.8.7",

    "http://192.168.8.7:5173",

    "http://192.168.8.7:3000",

    "http://192.168.8.7:4173",

    "http://192.168.8.7:8080",
]


CSRF_TRUSTED_ORIGINS = env_list(

    "DJANGO_CSRF_TRUSTED_ORIGINS",

    DEFAULT_CSRF_TRUSTED_ORIGINS,
)


# ==================================================
# REST FRAMEWORK
#
# SessionAuthentication means:
#
# - browser sessionid cookie authenticates user
# - protected endpoints require logged-in session
# - unsafe authenticated requests require CSRF
#
# Public views explicitly override:
#
# authentication_classes = []
# permission_classes = [AllowAny]
# ==================================================

REST_FRAMEWORK = {

    "DEFAULT_AUTHENTICATION_CLASSES": [

        (
            "rest_framework.authentication."
            "SessionAuthentication"
        ),
    ],


    "DEFAULT_PERMISSION_CLASSES": [

        (
            "rest_framework.permissions."
            "IsAuthenticated"
        ),
    ],
}


# ==================================================
# PASSWORD VALIDATION
# ==================================================

AUTH_PASSWORD_VALIDATORS = [

    {

        "NAME":
            (
                "django.contrib.auth."
                "password_validation."
                "UserAttributeSimilarityValidator"
            ),
    },


    {

        "NAME":
            (
                "django.contrib.auth."
                "password_validation."
                "MinimumLengthValidator"
            ),


        "OPTIONS": {

            "min_length":
                8,
        },
    },


    {

        "NAME":
            (
                "django.contrib.auth."
                "password_validation."
                "CommonPasswordValidator"
            ),
    },


    {

        "NAME":
            (
                "django.contrib.auth."
                "password_validation."
                "NumericPasswordValidator"
            ),
    },
]


# ==================================================
# INTERNATIONALIZATION
# ==================================================

LANGUAGE_CODE = (
    "en-us"
)


TIME_ZONE = (
    "UTC"
)


USE_I18N = (
    True
)


USE_TZ = (
    True
)


# ==================================================
# STATIC FILES
# ==================================================

STATIC_URL = (
    "/static/"
)


# ==================================================
# DEFAULT PRIMARY KEY
# ==================================================

DEFAULT_AUTO_FIELD = (
    "django.db.models.BigAutoField"
)


# ==================================================
# AI INFERENCE
#
# Gosei uses an OpenAI-compatible vLLM endpoint
# serving Gemma on AMD ROCm infrastructure.
# ==================================================

AI_BASE_URL = os.getenv(
    "AI_BASE_URL",
    "http://127.0.0.1:8001/v1",
)


AI_API_KEY = os.getenv(
    "AI_API_KEY",
    "gosei-local",
)


AI_MODEL = os.getenv(
    "AI_MODEL",
    "gosei-gemma",
)


AI_TIMEOUT_SECONDS = os.getenv(
    "AI_TIMEOUT_SECONDS",
    "300",
)


AI_MAX_RETRIES = os.getenv(
    "AI_MAX_RETRIES",
    "2",
)


AI_TEMPERATURE = os.getenv(
    "AI_TEMPERATURE",
    "0.7",
)


# ==================================================
# CUSTOM USER MODEL
# ==================================================

AUTH_USER_MODEL = (
    "accounts.User"
)
