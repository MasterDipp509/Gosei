from django.core.exceptions import (
    ImproperlyConfigured,
)

from django.shortcuts import (
    get_object_or_404,
)


from rest_framework import status

from rest_framework.permissions import (
    IsAuthenticated,
)

from rest_framework.response import (
    Response,
)

from rest_framework.views import (
    APIView,
)


from .models import (
    DebateSession,
)


from .serializers import (
    CharacterResponseRequestSerializer,
    DebateReportSerializer,
    DebateSessionPinSerializer,
    DebateSessionSerializer,
    DiscussionControlRequestSerializer,
    DiscussionInputRequestSerializer,
    MediatorResponseRequestSerializer,
    OpenFocusedDiscussionRequestSerializer,
    StartDebateSessionSerializer,
)


from .services.report_service import (
    build_report,
)


from .services.context_builder import (
    build_debate_context,
    build_openai_request_payload,
)


from .services import (
    discussion_service,
)


from .services.discussion_service import (
    DiscussionServiceError,
)


from .services.debate_engine import (
    DebateEngineError,
)


from .services.gemma_ai_service import (
    AIServiceError,
)


# ==================================================
# BASE API VIEW
# ==================================================

class ChamberAPIView(
    APIView
):

    # ----------------------------------------------
    # ALL CHAMBER ROUTES REQUIRE AUTHENTICATION
    # ----------------------------------------------

    permission_classes = [
        IsAuthenticated
    ]


    def handle_exception(
            self,
            exc
    ):

        # ----------------------------------------------
        # DISCUSSION SERVICE ERRORS
        # ----------------------------------------------

        if isinstance(
                exc,
                DiscussionServiceError
        ):

            return Response(

                {
                    "error": {

                        "code":
                            exc.code,

                        "message":
                            str(
                                exc
                            ),
                    }
                },

                status=(
                        exc.status_code
                        or status.HTTP_400_BAD_REQUEST
                )
            )


        # ----------------------------------------------
        # DEBATE ENGINE ERRORS
        # ----------------------------------------------

        if isinstance(
                exc,
                DebateEngineError
        ):

            return Response(

                {
                    "error": {

                        "code":
                            exc.code,

                        "message":
                            str(
                                exc
                            ),
                    }
                },

                status=(
                        exc.status_code
                        or status.HTTP_502_BAD_GATEWAY
                )
            )


        # ----------------------------------------------
        # GEMMA / VLLM AI TRANSPORT ERRORS
        # ----------------------------------------------

        if isinstance(
                exc,
                AIServiceError
        ):

            return Response(

                {
                    "error": {

                        "code":
                            exc.code,

                        "message":
                            str(
                                exc
                            ),
                    }
                },

                status=(
                        exc.status_code
                        or status.HTTP_502_BAD_GATEWAY
                )
            )


        # ----------------------------------------------
        # CONFIGURATION ERRORS
        # ----------------------------------------------

        if isinstance(
                exc,
                ImproperlyConfigured
        ):

            return Response(

                {
                    "error": {

                        "code":
                            "configuration_error",

                        "message":
                            str(
                                exc
                            ),
                    }
                },

                status=(
                    status
                    .HTTP_500_INTERNAL_SERVER_ERROR
                )
            )


        return super().handle_exception(
            exc
        )


# ==================================================
# USER-SCOPED SESSION LOOKUP
#
# Returns 404 when:
#
# - the session does not exist
# - the session belongs to another user
#
# This prevents cross-user access and avoids leaking
# whether another user's session ID exists.
# ==================================================

def get_debate_session(
        request,
        session_id
) -> DebateSession:

    return get_object_or_404(

        DebateSession,

        id=session_id,

        user=request.user
    )


# ==================================================
# START SESSION
# ==================================================

class StartDebateSessionView(
    ChamberAPIView
):

    def post(
            self,
            request
    ):

        serializer = (
            StartDebateSessionSerializer(

                data=request.data,

                context={
                    "request":
                        request
                }
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        session = (
            serializer.save()
        )


        session_data = (
            DebateSessionSerializer(
                session
            ).data
        )


        ai_context = (
            build_debate_context(
                session
            )
        )


        return Response(

            {
                "session":
                    session_data,

                "aiContext":
                    ai_context,
            },

            status=(
                status.HTTP_201_CREATED
            )
        )


# ==================================================
# DEVELOPMENT CONTEXT INSPECTION
# ==================================================

class DebateSessionContextView(
    ChamberAPIView
):

    def get(
            self,
            request,
            session_id
    ):

        session = (
            get_debate_session(
                request,
                session_id
            )
        )


        context = (
            build_debate_context(
                session
            )
        )


        openai_payload = (
            build_openai_request_payload(
                session
            )
        )


        return Response({

            "sessionId":
                str(
                    session.id
                ),

            "context":
                context,

            "openaiRequest":
                openai_payload,
        })


# ==================================================
# LOAD DISCUSSION
# ==================================================

class DiscussionStateView(
    ChamberAPIView
):

    def get(
            self,
            request,
            session_id
    ):

        session = (
            get_debate_session(
                request,
                session_id
            )
        )


        result = (
            discussion_service
            .load_discussion(
                session
            )
        )


        return Response(

            result,

            status=(
                status.HTTP_200_OK
            )
        )


# ==================================================
# USER INPUT
#
# Handles:
#
# council_reply
# opposing_view
# focused_discussion_message
# ==================================================

class DiscussionInputView(
    ChamberAPIView
):

    def post(
            self,
            request,
            session_id
    ):

        session = (
            get_debate_session(
                request,
                session_id
            )
        )


        serializer = (
            DiscussionInputRequestSerializer(

                data=request.data
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        validated = (
            serializer.validated_data
        )


        context = (
            validated.get(
                "context",
                {}
            )
        )


        input_payload = (
            validated[
                "input"
            ]
        )


        active_context = {}


        if isinstance(
                context,
                dict
        ):

            possible_active = (
                context.get(
                    "active"
                )
            )


            if isinstance(
                    possible_active,
                    dict
            ):

                active_context = (
                    possible_active
                )


        section_id = (
            active_context.get(
                "sectionId"
            )
        )


        discussion_id = (
            input_payload.get(
                "discussionId"
            )
        )


        result = (
            discussion_service
            .submit_user_input(

                session=session,


                content=(
                    input_payload[
                        "content"
                    ]
                ),


                input_type=(
                    input_payload[
                        "inputType"
                    ]
                ),


                section_id=(
                    section_id
                ),


                target_type=(
                    input_payload[
                        "targetType"
                    ]
                ),


                target_character_id=(
                    input_payload.get(
                        "targetCharacterId"
                    )
                ),


                discussion_id=(

                    str(
                        discussion_id
                    )

                    if discussion_id

                    else None
                )
            )
        )


        return Response(

            result,

            status=(
                status.HTTP_200_OK
            )
        )


# ==================================================
# CHARACTER RESPONSE
# ==================================================

class CharacterResponseView(
    ChamberAPIView
):

    def post(
            self,
            request,
            session_id
    ):

        session = (
            get_debate_session(
                request,
                session_id
            )
        )


        serializer = (
            CharacterResponseRequestSerializer(

                data=request.data
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        request_payload = (

            serializer
            .validated_data[
                "request"
            ]
        )


        discussion_id = (
            request_payload.get(
                "discussionId"
            )
        )


        result = (
            discussion_service
            .request_character_response(

                session=session,


                character_id=(
                    request_payload[
                        "characterId"
                    ]
                ),


                section_id=(
                    request_payload[
                        "sectionId"
                    ]
                ),


                discussion_id=(

                    str(
                        discussion_id
                    )

                    if discussion_id

                    else None
                ),


                task=(
                    request_payload.get(
                        "task",
                        "respond"
                    )
                )
            )
        )


        return Response(

            result,

            status=(
                status.HTTP_200_OK
            )
        )


# ==================================================
# MEDIATOR RESPONSE
# ==================================================

class MediatorResponseView(
    ChamberAPIView
):

    def post(
            self,
            request,
            session_id
    ):

        session = (
            get_debate_session(
                request,
                session_id
            )
        )


        serializer = (
            MediatorResponseRequestSerializer(

                data=request.data
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        request_payload = (

            serializer
            .validated_data[
                "request"
            ]
        )


        discussion_id = (
            request_payload.get(
                "discussionId"
            )
        )


        result = (
            discussion_service
            .request_mediator_response(

                session=session,


                section_id=(
                    request_payload[
                        "sectionId"
                    ]
                ),


                discussion_id=(

                    str(
                        discussion_id
                    )

                    if discussion_id

                    else None
                ),


                response_type=(
                    request_payload[
                        "responseType"
                    ]
                )
            )
        )


        return Response(

            result,

            status=(
                status.HTTP_200_OK
            )
        )


# ==================================================
# OPEN FOCUSED DISCUSSION
# ==================================================

class OpenFocusedDiscussionView(
    ChamberAPIView
):

    def post(
            self,
            request,
            session_id
    ):

        session = (
            get_debate_session(
                request,
                session_id
            )
        )


        serializer = (
            OpenFocusedDiscussionRequestSerializer(

                data=request.data
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        request_payload = (

            serializer
            .validated_data[
                "request"
            ]
        )


        result = (
            discussion_service
            .open_focused_discussion(

                session=session,


                character_id=(
                    request_payload[
                        "characterId"
                    ]
                ),


                source_type=(
                    request_payload[
                        "sourceType"
                    ]
                ),


                source_id=(
                    request_payload.get(
                        "sourceId",
                        ""
                    )
                ),


                topic=(
                    request_payload[
                        "topic"
                    ]
                ),


                section_id=(
                    request_payload[
                        "sectionId"
                    ]
                )
            )
        )


        return Response(

            result,

            status=(
                status.HTTP_201_CREATED
            )
        )


# ==================================================
# SESSION PIN STATE
#
# PATCH:
#
# {
#     "pinned": true
# }
#
# or:
#
# {
#     "pinned": false
# }
# ==================================================

class DebateSessionPinView(
    ChamberAPIView
):

    def patch(
            self,
            request,
            session_id
    ):

        # ----------------------------------------------
        # GET SESSION
        # ----------------------------------------------

        session = (
            get_debate_session(
                request,
                session_id
            )
        )


        # ----------------------------------------------
        # VALIDATE REQUEST
        # ----------------------------------------------

        serializer = (
            DebateSessionPinSerializer(

                data=request.data
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        pinned = (

            serializer
            .validated_data[
                "pinned"
            ]
        )


        # ----------------------------------------------
        # SAVE PIN STATE TO DATABASE
        # ----------------------------------------------

        session.pinned = pinned


        session.save(

            update_fields=[
                "pinned",
                "updated_at",
            ]
        )


        # ----------------------------------------------
        # RETURN FULL UPDATED SESSION
        # ----------------------------------------------

        session_data = (
            DebateSessionSerializer(
                session
            ).data
        )


        return Response(

            {
                "session":
                    session_data
            },

            status=(
                status.HTTP_200_OK
            )
        )


# ==================================================
# SESSION LIST
# ==================================================

class DebateSessionListView(
    ChamberAPIView
):

    def get(
            self,
            request
    ):

        # ----------------------------------------------
        # ONLY RETURN CURRENT USER'S SESSIONS
        # ----------------------------------------------

        sessions = (
            DebateSession
            .objects
            .filter(
                user=request.user
            )
        )


        # ----------------------------------------------
        # OPTIONAL STATUS FILTER
        #
        # GET /sessions/?status=paused
        # ----------------------------------------------

        status_filter = (
            request.query_params.get(
                "status"
            )
        )


        if status_filter:

            valid_statuses = {
                value

                for value, _
                in DebateSession.Status.choices
            }


            if (
                    status_filter
                    not in valid_statuses
            ):

                return Response(

                    {
                        "error": {

                            "code":
                                "invalid_status",

                            "message":
                                (
                                    "Invalid debate "
                                    "session status."
                                ),
                        }
                    },

                    status=(
                        status
                        .HTTP_400_BAD_REQUEST
                    )
                )


            sessions = (
                sessions.filter(
                    status=status_filter
                )
            )


        serializer = (
            DebateSessionSerializer(

                sessions,

                many=True
            )
        )


        return Response(

            {
                "sessions":
                    serializer.data
            },

            status=(
                status.HTTP_200_OK
            )
        )


# ==================================================
# SESSION CONTROL
#
# next_round
# pause
# resume
# end
# ==================================================

class DiscussionControlView(
    ChamberAPIView
):

    def post(
            self,
            request,
            session_id
    ):

        session = (
            get_debate_session(
                request,
                session_id
            )
        )


        serializer = (
            DiscussionControlRequestSerializer(

                data=request.data
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        validated = (
            serializer.validated_data
        )


        result = (
            discussion_service
            .control_session(

                session=session,


                action=(
                    validated[
                        "action"
                    ]
                ),


                context=(
                    validated.get(
                        "context",
                        {}
                    )
                )
            )
        )


        return Response(

            result,

            status=(
                status.HTTP_200_OK
            )
        )


# ==================================================
# SESSION REPORT
# ==================================================

class DebateSessionReportView(
    ChamberAPIView
):

    def get(
            self,
            request,
            session_id
    ):

        session = (
            get_debate_session(
                request,
                session_id
            )
        )


        report = (
            build_report(
                session
            )
        )


        serializer = (
            DebateReportSerializer(
                report
            )
        )


        return Response(

            {
                "report":
                    serializer.data
            },

            status=(
                status.HTTP_200_OK
            )
        )
