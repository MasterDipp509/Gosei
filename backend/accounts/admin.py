# accounts/admin.py

from django.contrib import admin

from django.contrib.auth.admin import (
    UserAdmin as DjangoUserAdmin,
)

from .models import User


@admin.register(User)
class UserAdmin(
    DjangoUserAdmin
):

    list_display = [

        "username",
        "email",
        "first_name",
        "last_name",

        "presentation_preference",

        "is_staff",
        "is_active",
    ]


    search_fields = [

        "username",
        "email",
        "first_name",
        "last_name",
    ]


    fieldsets = (

        *DjangoUserAdmin.fieldsets,


        (
            "Gosei Profile",

            {
                "fields": (

                    "avatar",
                    "bio",

                    "presentation_preference",
                    "style_preference",
                    "mode_preference",
                    "depth_preference",

                    "theme",
                )
            },
        ),


        (
            "Council Configuration",

            {
                "fields": (

                    "panel_member_ids",

                    "selected_mediator_id",
                )
            },
        ),
    )


    add_fieldsets = (

        *DjangoUserAdmin.add_fieldsets,


        (
            "User Details",

            {
                "fields": (

                    "email",

                    "first_name",
                    "last_name",
                )
            },
        ),
    )
