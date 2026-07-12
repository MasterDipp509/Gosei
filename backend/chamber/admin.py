from django.contrib import admin

from .models import (
    DebateMessage,
    DebateSession
)


@admin.register(DebateSession)
class DebateSessionAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "title",
        "mode",
        "status",
        "current_round",
        "current_stage",
        "created_at",
    ]


    list_filter = [
        "mode",
        "status",
        "current_stage",
    ]


    search_fields = [
        "title",
        "id",
    ]


    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
    ]


@admin.register(DebateMessage)
class DebateMessageAdmin(admin.ModelAdmin):

    list_display = [
        "session",
        "sequence",
        "speaker_id",
        "speaker_type",
        "message_type",
        "round_number",
        "stage",
        "created_at",
    ]


    list_filter = [
        "speaker_type",
        "message_type",
        "stage",
    ]


    search_fields = [
        "speaker_id",
        "content",
    ]
