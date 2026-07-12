from rest_framework import serializers


from .models import (
    DebateSession,
    FocusedDiscussion,
)


# ==================================================
# CALIBRATION
# ==================================================

class CalibrationSerializer(
    serializers.Serializer
):

    topic = serializers.CharField(
        max_length=3000
    )


    objective = serializers.CharField(
        max_length=255
    )


    objectiveId = serializers.ChoiceField(
        choices=[
            "clarity",
            "decision",
            "reflection",
            "resolution",
        ]
    )


    context = serializers.CharField(
        max_length=1800,
        required=False,
        allow_blank=True,
        default=""
    )


    approach = serializers.ChoiceField(
        choices=[
            "supportive",
            "balanced",
            "adversarial",
        ],
        default="balanced"
    )


    councilMode = serializers.ChoiceField(
        choices=[
            "panel",
            "mediator",
        ]
    )


    desiredOutcome = serializers.CharField(
        max_length=4000,
        required=False,
        allow_blank=True,
        default=""
    )


    constraints = serializers.ListField(

        child=serializers.CharField(
            max_length=1000
        ),

        required=False,

        default=list
    )


    assumptions = serializers.ListField(

        child=serializers.CharField(
            max_length=1000
        ),

        required=False,

        default=list
    )


    questions = serializers.ListField(

        child=serializers.CharField(
            max_length=1000
        ),

        required=False,

        default=list
    )


    additionalNotes = serializers.CharField(
        max_length=8000,
        required=False,
        allow_blank=True,
        default=""
    )


# ==================================================
# PARTICIPANT
# ==================================================

class ParticipantSerializer(serializers.Serializer):
    id = serializers.CharField(
        max_length=100
    )

    name = serializers.CharField(
        max_length=150
    )

    role = serializers.CharField(
        max_length=150
    )

    archetype = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        default=""
    )

    description = serializers.CharField(
        max_length=3000,
        required=False,
        allow_blank=True,
        default=""
    )

    personality = serializers.JSONField(
        required=False,
        default=list
    )

    specialties = serializers.ListField(
        child=serializers.CharField(
            max_length=250
        ),
        required=False,
        default=list
    )

    debateStyle = serializers.CharField(
        max_length=3000,
        required=False,
        allow_blank=True,
        default=""
    )

    focusAreas = serializers.ListField(
        child=serializers.CharField(
            max_length=250
        ),
        required=False,
        default=list
    )

    personaAdaptation = serializers.JSONField(
        required=False,
        default=dict
    )

    voice = serializers.JSONField(
        required=False,
        default=dict
    )

    dialogueExamples = serializers.JSONField(
        required=False,
        default=dict
    )

    quote = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        default=""
    )

    avatar = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        default=""
    )

    accent = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        default=""
    )

    def validate_personality(self, value):
        if isinstance(value, str):
            return value

        if (
                isinstance(value, list)
                and all(
            isinstance(item, str)
            for item in value
        )
        ):
            return value

        raise serializers.ValidationError(
            "Personality must be a string or a list of strings."
        )

    def validate_personaAdaptation(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "personaAdaptation must be an object."
            )

        return value

    def validate_voice(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "voice must be an object."
            )

        return value

    def validate_dialogueExamples(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "dialogueExamples must be an object."
            )

        return value


# ==================================================
# CREATE SESSION
# ==================================================

class StartDebateSessionSerializer(
    serializers.Serializer
):

    mode = serializers.ChoiceField(
        choices=DebateSession.Mode.choices
    )


    title = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        default=""
    )


    calibration = (
        CalibrationSerializer()
    )


    panelMembers = (
        ParticipantSerializer(

            many=True,

            required=False,

            default=list
        )
    )


    mediator = (
        ParticipantSerializer()
    )


    # ==================================================
    # VALIDATION
    # ==================================================

    def validate(
            self,
            attrs
    ):

        mode = attrs[
            "mode"
        ]


        panel_members = attrs.get(
            "panelMembers",
            []
        )


        mediator = attrs.get(
            "mediator"
        )


        # ----------------------------------------------
        # PANEL MODE REQUIRES MEMBERS
        # ----------------------------------------------

        if (

                mode
                ==
                DebateSession.Mode.PANEL

                and

                not panel_members

        ):

            raise serializers.ValidationError({

                "panelMembers":
                    (
                        "Panel mode requires at least "
                        "one panel member."
                    )
            })


        # ----------------------------------------------
        # MEMBER LIMIT
        # ----------------------------------------------

        if len(
                panel_members
        ) > 8:

            raise serializers.ValidationError({

                "panelMembers":
                    (
                        "A session may contain at most "
                        "8 panel members."
                    )
            })


        # ----------------------------------------------
        # UNIQUE MEMBER IDS
        # ----------------------------------------------

        panel_ids = [

            member[
                "id"
            ]

            for member
            in panel_members
        ]


        if (

                len(
                    panel_ids
                )
                !=
                len(
                    set(
                        panel_ids
                    )
                )

        ):

            raise serializers.ValidationError({

                "panelMembers":
                    (
                        "Panel member IDs must "
                        "be unique."
                    )
            })


        # ----------------------------------------------
        # MEDIATOR REQUIRED
        # ----------------------------------------------

        if mediator is None:

            raise serializers.ValidationError({

                "mediator":
                    "A mediator is required."
            })


        # ----------------------------------------------
        # MEDIATOR CANNOT ALSO BE PANEL MEMBER
        # ----------------------------------------------

        if (

                mediator

                and

                mediator[
                    "id"
                ]
                in panel_ids

        ):

            raise serializers.ValidationError({

                "mediator":
                    (
                        "The mediator cannot also "
                        "be a panel member."
                    )
            })


        return attrs


    # ==================================================
    # CREATE
    # ==================================================

    def create(
            self,
            validated_data
    ):

        request = self.context.get(
            "request"
        )


        # ----------------------------------------------
        # AUTHENTICATED OWNER REQUIRED
        #
        # Chamber views also require authentication,
        # but this keeps ownership correct if this
        # serializer is reused elsewhere.
        # ----------------------------------------------

        if (

                request is None

                or

                not request.user.is_authenticated

        ):

            raise serializers.ValidationError({

                "detail":
                    "Authentication is required."
            })


        calibration = validated_data[
            "calibration"
        ]


        explicit_title = (

            validated_data
            .get(
                "title",
                ""
            )
            .strip()
        )


        # ----------------------------------------------
        # FALL BACK TO TOPIC AS CONVERSATION NAME
        # ----------------------------------------------

        title = (

                explicit_title

                or

                calibration.get(
                    "topic",
                    ""
                )[:255]
        )


        return DebateSession.objects.create(

            user=request.user,


            mode=validated_data[
                "mode"
            ],


            title=title,


            calibration_context=(
                calibration
            ),


            panel_snapshot=(
                validated_data.get(
                    "panelMembers",
                    []
                )
            ),


            mediator_snapshot=(
                validated_data[
                    "mediator"
                ]
            ),


            status=(
                DebateSession
                .Status
                .READY
            ),


            # ------------------------------------------
            # NEW SESSIONS START UNPINNED
            # ------------------------------------------

            pinned=False,


            current_round=0,


            current_stage="ready"
        )


# ==================================================
# SESSION OUTPUT
# ==================================================

class DebateSessionSerializer(
    serializers.ModelSerializer
):

    currentRound = serializers.IntegerField(
        source="current_round",
        read_only=True
    )


    currentStage = serializers.CharField(
        source="current_stage",
        read_only=True
    )


    calibration = serializers.JSONField(
        source="calibration_context",
        read_only=True
    )


    panelMembers = serializers.JSONField(
        source="panel_snapshot",
        read_only=True
    )


    mediator = serializers.JSONField(
        source="mediator_snapshot",
        read_only=True
    )


    createdAt = serializers.DateTimeField(
        source="created_at",
        read_only=True
    )


    updatedAt = serializers.DateTimeField(
        source="updated_at",
        read_only=True
    )


    class Meta:

        model = DebateSession


        fields = [
            "id",
            "mode",
            "title",
            "status",

            # ------------------------------------------
            # PIN STATE
            # ------------------------------------------

            "pinned",

            "currentRound",
            "currentStage",
            "calibration",
            "panelMembers",
            "mediator",
            "createdAt",
            "updatedAt",
        ]


        read_only_fields = [
            "id",
            "status",
            "pinned",
        ]


# ==================================================
# SESSION PIN REQUEST
#
# Expected:
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

class DebateSessionPinSerializer(
    serializers.Serializer
):

    pinned = serializers.BooleanField(
        required=True
    )


# ==================================================
# DISCUSSION INPUT PAYLOAD
# ==================================================

class DiscussionInputPayloadSerializer(
    serializers.Serializer
):

    content = serializers.CharField(
        max_length=12000,
        trim_whitespace=True
    )


    inputType = serializers.ChoiceField(

        choices=[
            "council_reply",
            "opposing_view",
            "focused_discussion_message",
        ],

        default="council_reply"
    )


    targetType = serializers.ChoiceField(

        choices=[
            "section",
            "discussion",
        ],

        default="section"
    )


    targetCharacterId = serializers.CharField(
        max_length=100,
        required=False,
        allow_null=True,
        allow_blank=True,
        default=None
    )


    discussionId = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None
    )


    def validate(
            self,
            attrs
    ):

        input_type = attrs.get(
            "inputType"
        )


        target_type = attrs.get(
            "targetType"
        )


        discussion_id = attrs.get(
            "discussionId"
        )


        target_character_id = attrs.get(
            "targetCharacterId"
        )


        # ----------------------------------------------
        # FOCUSED DISCUSSION REQUIREMENTS
        # ----------------------------------------------

        if (

                input_type
                ==
                "focused_discussion_message"

        ):

            if (
                    target_type
                    !=
                    "discussion"
            ):

                raise serializers.ValidationError({

                    "targetType":
                        (
                            "Focused discussion messages "
                            "must target a discussion."
                        )
                })


            if discussion_id is None:

                raise serializers.ValidationError({

                    "discussionId":
                        (
                            "A discussion ID is required "
                            "for focused discussion messages."
                        )
                })


            if not target_character_id:

                raise serializers.ValidationError({

                    "targetCharacterId":
                        (
                            "A character ID is required "
                            "for focused discussion messages."
                        )
                })


        # ----------------------------------------------
        # GLOBAL COUNCIL INPUT
        # ----------------------------------------------

        if input_type in {

            "council_reply",

            "opposing_view",

        }:

            if (
                    target_type
                    !=
                    "section"
            ):

                raise serializers.ValidationError({

                    "targetType":
                        (
                            "Council replies and opposing "
                            "views must target the section."
                        )
                })


        return attrs


# ==================================================
# DISCUSSION INPUT REQUEST
# ==================================================

class DiscussionInputRequestSerializer(
    serializers.Serializer
):

    context = serializers.JSONField(
        required=False,
        default=dict
    )


    input = (
        DiscussionInputPayloadSerializer()
    )


# ==================================================
# CHARACTER RESPONSE REQUEST
# ==================================================

class CharacterResponsePayloadSerializer(
    serializers.Serializer
):

    task = serializers.CharField(
        max_length=100,
        required=False,
        default="respond"
    )


    characterId = serializers.CharField(
        max_length=100
    )


    sectionId = serializers.CharField(
        max_length=100
    )


    discussionId = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None
    )


class CharacterResponseRequestSerializer(
    serializers.Serializer
):

    context = serializers.JSONField(
        required=False,
        default=dict
    )


    request = (
        CharacterResponsePayloadSerializer()
    )


# ==================================================
# MEDIATOR RESPONSE REQUEST
# ==================================================

class MediatorResponsePayloadSerializer(
    serializers.Serializer
):

    responseType = serializers.ChoiceField(

        choices=[
            "synthesis",
            "round_summary",
            "intervention",
            "verdict",
        ],

        default="synthesis"
    )


    sectionId = serializers.CharField(
        max_length=100
    )


    discussionId = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None
    )


class MediatorResponseRequestSerializer(
    serializers.Serializer
):

    context = serializers.JSONField(
        required=False,
        default=dict
    )


    request = (
        MediatorResponsePayloadSerializer()
    )


# ==================================================
# OPEN FOCUSED DISCUSSION
# ==================================================

class OpenFocusedDiscussionPayloadSerializer(
    serializers.Serializer
):

    sectionId = serializers.CharField(
        max_length=100
    )


    characterId = serializers.CharField(
        max_length=100
    )


    sourceType = serializers.ChoiceField(
        choices=(
            FocusedDiscussion
            .SourceType
            .choices
        )
    )


    sourceId = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        default=""
    )


    topic = serializers.CharField(
        max_length=8000,
        trim_whitespace=True
    )


class OpenFocusedDiscussionRequestSerializer(
    serializers.Serializer
):

    context = serializers.JSONField(
        required=False,
        default=dict
    )


    request = (
        OpenFocusedDiscussionPayloadSerializer()
    )


# ==================================================
# SESSION CONTROL
# ==================================================

class DiscussionControlRequestSerializer(
    serializers.Serializer
):

    context = serializers.JSONField(
        required=False,
        default=dict
    )


    action = serializers.ChoiceField(

        choices=[
            "next_round",
            "pause",
            "resume",
            "end",
        ]
    )

# ==================================================
# REPORT OUTPUT
# ==================================================

class DebateReportSerializer(serializers.Serializer):
    session = serializers.JSONField()

    executiveSummary = serializers.CharField(
        allow_blank=True
    )

    finalVerdict = serializers.CharField(
        allow_blank=True
    )

    mediatorFinalSummary = serializers.CharField(
        allow_blank=True
    )

    finalConfidence = serializers.IntegerField(
        allow_null=True
    )

    finalRisks = serializers.JSONField()

    finalActions = serializers.JSONField()

    unresolvedPoints = serializers.JSONField()

    importantNotes = serializers.JSONField()

    rounds = serializers.JSONField()

    turningPoints = serializers.JSONField()

    generatedAt = serializers.DateTimeField(
        allow_null=True
    )

    updatedAt = serializers.DateTimeField(
        allow_null=True
    )
