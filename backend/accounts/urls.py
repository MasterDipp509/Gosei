# accounts/urls.py

from django.urls import (
    path,
)

from .views import (
    ChangePasswordView,
    CsrfView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
)


app_name = "accounts"


urlpatterns = [

    # ----------------------------------------------
    # CSRF
    # ----------------------------------------------

    path(
        "csrf/",
        CsrfView.as_view(),
        name="csrf",
    ),


    # ----------------------------------------------
    # AUTH
    # ----------------------------------------------

    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),


    path(
        "login/",
        LoginView.as_view(),
        name="login",
    ),


    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),


    # ----------------------------------------------
    # USER
    # ----------------------------------------------

    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),


    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),
]
