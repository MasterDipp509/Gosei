from django.urls import path


from .views import (
    CharacterResponseView,
    DebateSessionContextView,
    DebateSessionListView,
    DebateSessionPinView,
    DebateSessionReportView,
    DiscussionControlView,
    DiscussionInputView,
    DiscussionStateView,
    MediatorResponseView,
    OpenFocusedDiscussionView,
    StartDebateSessionView,
)


app_name = "chamber"


urlpatterns = [

    # ==================================================
    # SESSION CREATION
    # ==================================================

    path(
        "sessions/start/",
        StartDebateSessionView.as_view(),
        name="session-start"
    ),


    # ==================================================
    # DEVELOPMENT CONTEXT INSPECTION
    # ==================================================

    path(
        "sessions/<uuid:session_id>/context/",
        DebateSessionContextView.as_view(),
        name="session-context"
    ),


    # ==================================================
    # SESSION LIST
    # ==================================================

    path(
        "sessions/",
        DebateSessionListView.as_view(),
        name="session-list"
    ),


    # ==================================================
    # SESSION PIN STATE
    # ==================================================

    path(
        "sessions/<uuid:session_id>/pin/",
        DebateSessionPinView.as_view(),
        name="session-pin"
    ),


    # ==================================================
    # SESSION REPORT
    #
    # GET:
    #
    # /sessions/<session_id>/report/
    # ==================================================

    path(
        "sessions/<uuid:session_id>/report/",
        DebateSessionReportView.as_view(),
        name="session-report"
    ),


    # ==================================================
    # DISCUSSION STATE
    # ==================================================

    path(
        "sessions/<uuid:session_id>/discussion/",
        DiscussionStateView.as_view(),
        name="discussion-state"
    ),


    # ==================================================
    # USER INPUT
    # ==================================================

    path(
        "sessions/<uuid:session_id>/discussion/input/",
        DiscussionInputView.as_view(),
        name="discussion-input"
    ),


    # ==================================================
    # CHARACTER RESPONSE
    # ==================================================

    path(
        (
            "sessions/<uuid:session_id>/"
            "discussion/character-response/"
        ),
        CharacterResponseView.as_view(),
        name="discussion-character-response"
    ),


    # ==================================================
    # MEDIATOR RESPONSE
    # ==================================================

    path(
        (
            "sessions/<uuid:session_id>/"
            "discussion/mediator-response/"
        ),
        MediatorResponseView.as_view(),
        name="discussion-mediator-response"
    ),


    # ==================================================
    # OPEN FOCUSED DISCUSSION
    # ==================================================

    path(
        (
            "sessions/<uuid:session_id>/"
            "discussion/open-sub-discussion/"
        ),
        OpenFocusedDiscussionView.as_view(),
        name="discussion-open-sub-discussion"
    ),


    # ==================================================
    # SESSION / ROUND CONTROL
    # ==================================================

    path(
        (
            "sessions/<uuid:session_id>/"
            "discussion/control/"
        ),
        DiscussionControlView.as_view(),
        name="discussion-control"
    ),
]
