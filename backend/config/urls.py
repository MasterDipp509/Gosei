# config/urls.py

from django.contrib import admin

from django.urls import (
    include,
    path,
)


urlpatterns = [

    path(
        "admin/",
        admin.site.urls,
    ),


    # ==============================================
    # AUTH
    # ==============================================

    path(
        "api/auth/",
        include(
            "accounts.urls"
        ),
    ),


    # ==============================================
    # CHAMBER
    # ==============================================

    path(
        "api/chamber/",
        include(
            "chamber.urls"
        ),
    ),
]
