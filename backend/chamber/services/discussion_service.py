# chamber/services/discussion_service.py

from __future__ import annotations


from typing import Any


from django.db import transaction

from django.db.models import Max

from django.utils import timezone


from chamber.models import (
    DebateMessage,
    DebateReaction,
    DebateRound,
    DebateSession,
    FocusedDiscussion,
    FocusedDiscussionMessage,
)


from chamber.services.report_service import (
    generate_debate_report,
)


# ==================================================
# EXCEPTIONS
# ==================================================

class DiscussionServiceError(
    RuntimeError
):

    def __init__(
            self,
            message: str,
            *,
            code: str = "discussion_error",
            status_code: int = 400,
    ):

        super().__init__(
            message
        )


        self.code = code

        self.status_code = status_code


# ==================================================
# DEBATE ENGINE
# ==================================================

def _get_debate_engine():
    """
    Lazily import the current Gosei debate engine.

    Keeping the import local avoids loading the AI
    orchestration layer during Django migration and
    application-startup paths that do not need it.
    """

    from chamber.services import debate_engine

    return debate_engine


# ==================================================
# SECTION
# ==================================================

def section_id_for_round(
        round_number: int
) -> str:
    """
    One logical UI/history section per debate round.

    The round number remains globally increasing across the
    session, while section_id gives the frontend a stable,
    unique bucket for historical metrics.
    """

    safe_round_number = max(
        1,
        int(round_number or 1)
    )

    return f"section-{safe_round_number}"


def resolve_section_id(
        session: DebateSession,
        section_id: str | None = None,
) -> str:

    if (
            isinstance(
                section_id,
                str
            )
            and
            section_id.strip()
    ):
        return section_id.strip()


    current_stage = (
            session.current_stage
            or ""
    )


    reserved_stages = {
        "",
        "ready",
        "completed",
    }


    if (
            current_stage
            not in reserved_stages
    ):
        return current_stage


    return section_id_for_round(
        max(
            session.current_round,
            1
        )
    )

# ==================================================
# START / ENSURE DISCUSSION
# ==================================================

def ensure_discussion_started(
        session: DebateSession,
        *,
        section_id: str | None = None,
) -> tuple[
    DebateSession,
    DebateRound
]:

    resolved_section_id = (
        resolve_section_id(
            session,
            section_id
        )
    )


    with transaction.atomic():

        locked_session = (
            DebateSession.objects
            .select_for_update()
            .get(
                pk=session.pk
            )
        )


        changed_fields = []


        if (
                locked_session.current_round
                <= 0
        ):

            locked_session.current_round = 1

            changed_fields.append(
                "current_round"
            )


        if (
                locked_session.status
                ==
                DebateSession.Status.READY
        ):

            locked_session.status = (
                DebateSession.Status.ACTIVE
            )

            changed_fields.append(
                "status"
            )


        if (
                locked_session.current_stage
                ==
                "ready"
        ):

            locked_session.current_stage = (
                resolved_section_id
            )

            changed_fields.append(
                "current_stage"
            )


        if changed_fields:

            changed_fields.append(
                "updated_at"
            )


            locked_session.save(
                update_fields=changed_fields
            )


        round_object, created = (
            DebateRound.objects
            .get_or_create(

                session=locked_session,

                section_id=(
                    resolved_section_id
                ),

                number=(
                    locked_session
                    .current_round
                ),

                defaults={

                    "status":
                        DebateRound
                        .Status
                        .ACTIVE,

                    "started_at":
                        timezone.now(),
                }
            )
        )


        if (
                not created
                and
                round_object.status
                ==
                DebateRound.Status.PENDING
        ):

            round_object.status = (
                DebateRound.Status.ACTIVE
            )

            round_object.started_at = (
                    round_object.started_at
                    or timezone.now()
            )


            round_object.save(
                update_fields=[
                    "status",
                    "started_at",
                    "updated_at",
                ]
            )


    return (
        locked_session,
        round_object
    )


# ==================================================
# MESSAGE SEQUENCE
# ==================================================

def _next_debate_message_sequence(
        session: DebateSession
) -> int:

    last_sequence = (

            DebateMessage.objects
            .filter(
                session=session
            )
            .aggregate(
                maximum=Max(
                    "sequence"
                )
            )
            .get(
                "maximum"
            )

            or 0
    )


    return last_sequence + 1


def _next_focused_message_sequence(
        discussion: FocusedDiscussion
) -> int:

    last_sequence = (

            FocusedDiscussionMessage.objects
            .filter(
                discussion=discussion
            )
            .aggregate(
                maximum=Max(
                    "sequence"
                )
            )
            .get(
                "maximum"
            )

            or 0
    )


    return last_sequence + 1


# ==================================================
# SAVE MAIN MESSAGE
# ==================================================

def save_debate_message(
        *,
        session: DebateSession,
        speaker_id: str,
        speaker_type: str,
        message_type: str,
        content: str,
        round_number: int,
        stage: str,
        emotion: str = "",
        animation: str = "",
        metadata: dict[str, Any] | None = None,
) -> DebateMessage:

    clean_content = (
            content
            or ""
    ).strip()


    if not clean_content:

        raise DiscussionServiceError(
            "Cannot save an empty debate message.",
            code="empty_message"
        )


    with transaction.atomic():

        locked_session = (

            DebateSession.objects
            .select_for_update()
            .get(
                pk=session.pk
            )
        )


        sequence = (
            _next_debate_message_sequence(
                locked_session
            )
        )


        message = (
            DebateMessage.objects.create(

                session=locked_session,

                sequence=sequence,

                speaker_id=(
                    str(
                        speaker_id
                    )
                ),

                speaker_type=speaker_type,

                message_type=message_type,

                content=clean_content,

                emotion=(
                        emotion
                        or ""
                ),

                animation=(
                        animation
                        or ""
                ),

                round_number=round_number,

                stage=stage,

                metadata=(
                        metadata
                        or {}
                )
            )
        )


    return message


# ==================================================
# SAVE FOCUSED MESSAGE
# ==================================================

def save_focused_message(
        *,
        discussion: FocusedDiscussion,
        speaker_id: str,
        speaker_type: str,
        message_type: str,
        content: str,
        metadata: dict[str, Any] | None = None,
) -> FocusedDiscussionMessage:

    clean_content = (
            content
            or ""
    ).strip()


    if not clean_content:

        raise DiscussionServiceError(
            "Cannot save an empty focused discussion message.",
            code="empty_message"
        )


    with transaction.atomic():

        locked_discussion = (

            FocusedDiscussion.objects
            .select_for_update()
            .get(
                pk=discussion.pk
            )
        )


        sequence = (
            _next_focused_message_sequence(
                locked_discussion
            )
        )


        message = (
            FocusedDiscussionMessage
            .objects
            .create(

                discussion=(
                    locked_discussion
                ),

                sequence=sequence,

                speaker_id=(
                    str(
                        speaker_id
                    )
                ),

                speaker_type=speaker_type,

                message_type=message_type,

                content=clean_content,

                metadata=(
                        metadata
                        or {}
                )
            )
        )


    return message


# ==================================================
# SERIALIZE MAIN MESSAGE
# ==================================================

def serialize_debate_message(
        message: DebateMessage
) -> dict[str, Any]:

    return {

        "id":
            str(
                message.id
            ),

        "sequence":
            message.sequence,

        "speakerId":
            message.speaker_id,

        "speakerType":
            message.speaker_type,

        "messageType":
            message.message_type,

        "content":
            message.content,

        "emotion":
            message.emotion,

        "animation":
            message.animation,

        "roundNumber":
            message.round_number,

        "stage":
            message.stage,

        "metadata":
            message.metadata,

        "createdAt":
            message.created_at.isoformat(),
    }


# ==================================================
# SERIALIZE FOCUSED MESSAGE
# ==================================================

def serialize_focused_message(
        message: FocusedDiscussionMessage
) -> dict[str, Any]:

    return {

        "id":
            str(
                message.id
            ),

        "sequence":
            message.sequence,

        "speakerId":
            message.speaker_id,

        "speakerType":
            message.speaker_type,

        "messageType":
            message.message_type,

        "content":
            message.content,

        "metadata":
            message.metadata,

        "createdAt":
            message.created_at.isoformat(),
    }


# ==================================================
# ROUND STATE
# ==================================================

def serialize_round(
        round_object: DebateRound
) -> dict[str, Any]:

    reactions = {

        reaction.character_id:
            reaction.reaction

        for reaction
        in round_object
        .reactions
        .all()
    }


    interventions = []


    messages = (

        DebateMessage.objects
        .filter(

            session=round_object.session,

            round_number=(
                round_object.number
            ),

            stage=(
                round_object.section_id
            ),

            speaker_type=(
                DebateMessage
                .SpeakerType
                .USER
            )
        )
        .order_by(
            "sequence"
        )
    )


    for message in messages:

        input_type = (
            message.metadata
            .get(
                "inputType"
            )
        )


        if input_type not in {
            "council_reply",
            "opposing_view",
        }:
            continue


        interventions.append({

            "id":
                str(
                    message.id
                ),

            "type":
                input_type,

            "content":
                message.content,

            "createdAt":
                message
                .created_at
                .isoformat(),
        })


    return {

        "number":
            round_object.number,

        "status":
            round_object.status,

        "reactions":
            reactions,

        "interventions":
            interventions,

        "startedAt":
            (
                round_object
                .started_at
                .isoformat()

                if round_object.started_at

                else None
            ),

        "completedAt":
            (
                round_object
                .completed_at
                .isoformat()

                if round_object.completed_at

                else None
            ),
    }


# ==================================================
# FOCUSED DISCUSSION STATE
# ==================================================

def serialize_focused_discussion(
        discussion: FocusedDiscussion
) -> dict[str, Any]:

    messages = [

        serialize_focused_message(
            message
        )

        for message
        in discussion
        .messages
        .all()
    ]


    mediator_state = (
            discussion.mediator_state
            or {}
    )


    return {

        "id":
            str(
                discussion.id
            ),

        "title":
            discussion.title,

        "topic":
            discussion.topic,

        "openedFrom": {

            "type":
                discussion.source_type,

            "id":
                discussion.source_id,
        },

        "status":
            discussion.status,

        "participants": [
            discussion.character_id
        ],

        "messages":
            messages,

        "mediator": {

            "statements":
                mediator_state.get(
                    "statements",
                    []
                ),

            "summary":
                mediator_state.get(
                    "summary"
                ),

            "resolved":
                (
                        discussion.status
                        ==
                        FocusedDiscussion
                        .Status
                        .RESOLVED
                ),

            "conclusion":
                (
                        discussion.conclusion
                        or None
                )
        },

        "conclusion":
            (
                    discussion.conclusion
                    or None
            ),

        "createdAt":
            discussion
            .created_at
            .isoformat(),

        "updatedAt":
            discussion
            .updated_at
            .isoformat(),
    }


# ==================================================
# DEFAULT CHARACTER STATE
# ==================================================

def create_default_character_state() -> dict:

    return {

        "status":
            "pending",

        "confidence": {

            "initial":
                None,

            "current":
                None,

            "history":
                [],
        },

        "position": {

            "stance":
                "undecided",

            "statement":
                "",

            "reasoning":
                "",
        },

        "risks":
            [],

        "actions":
            [],

        "agreements":
            [],

        "disagreements":
            [],

        "statementHistory":
            [],

        "discussions":
            {},

        "discussionOrder":
            [],
    }


# ==================================================
# CONFIDENCE NORMALIZATION
# ==================================================

def _confidence_number(
        value: Any,
) -> int | None:

    if (
            isinstance(
                value,
                bool
            )
            or
            not isinstance(
                value,
                (
                        int,
                        float,
                )
            )
    ):
        return None


    return clamp_percentage(
        value
    )


def _merge_confidence_history(
        *histories: Any,
) -> list[dict[str, int]]:

    by_round: dict[int, int] = {}


    for history in histories:

        if not isinstance(
                history,
                list
        ):
            continue


        for item in history:

            if not isinstance(
                    item,
                    dict
            ):
                continue


            round_number = (
                item.get(
                    "round"
                )
            )

            value = (
                _confidence_number(
                    item.get(
                        "value"
                    )
                )
            )


            if (
                    not isinstance(
                        round_number,
                        int
                    )
                    or
                    round_number <= 0
                    or
                    value is None
            ):
                continue


            by_round[
                round_number
            ] = value


    return [

        {
            "round":
                round_number,

            "value":
                by_round[
                    round_number
                ],
        }

        for round_number
        in sorted(
            by_round
        )
    ]


def latest_character_state_before_response(
        *,
        session: DebateSession,
        character_id: str,
        round_number: int,
) -> dict[str, Any]:

    message = (

        DebateMessage.objects
        .filter(

            session=session,

            speaker_id=str(
                character_id
            ),

            speaker_type=(
                DebateMessage
                .SpeakerType
                .PANEL
            ),

            round_number__lte=(
                round_number
            )
        )
        .order_by(
            "-sequence"
        )
        .first()
    )


    if message is None:

        return {}


    state = (

        (
                message.metadata
                or {}
        )
        .get(
            "characterState"
        )
    )


    return (
        state

        if isinstance(
            state,
            dict
        )

        else {}
    )


def normalize_character_state_for_round(
        *,
        session: DebateSession,
        character_id: str,
        round_number: int,
        character_state: dict[str, Any] | None,
) -> dict[str, Any]:
    """
    The AI chooses the current confidence value.

    The backend owns confidence continuity:
    - initial never drifts after it has been established
    - previous history cannot be erased by a later response
    - exactly one authoritative history value exists per round
    - current always matches the current round history value
    """

    incoming_state = (

        dict(
            character_state
        )

        if isinstance(
            character_state,
            dict
        )

        else {}
    )


    previous_state = (
        latest_character_state_before_response(

            session=session,

            character_id=character_id,

            round_number=round_number
        )
    )


    previous_confidence = (

        previous_state.get(
            "confidence"
        )

        if isinstance(
            previous_state.get(
                "confidence"
            ),
            dict
        )

        else {}
    )


    incoming_confidence = (

        incoming_state.get(
            "confidence"
        )

        if isinstance(
            incoming_state.get(
                "confidence"
            ),
            dict
        )

        else {}
    )


    previous_initial = (
        _confidence_number(
            previous_confidence.get(
                "initial"
            )
        )
    )


    previous_current = (
        _confidence_number(
            previous_confidence.get(
                "current"
            )
        )
    )


    incoming_initial = (
        _confidence_number(
            incoming_confidence.get(
                "initial"
            )
        )
    )


    incoming_current = (
        _confidence_number(
            incoming_confidence.get(
                "current"
            )
        )
    )


    current_value = (
        incoming_current

        if incoming_current is not None

        else previous_current
    )


    if current_value is None:

        current_value = (
            incoming_initial
            if incoming_initial is not None
            else previous_initial
        )


    initial_value = (
        previous_initial

        if previous_initial is not None

        else incoming_initial
    )


    if initial_value is None:

        initial_value = current_value


    history = (
        _merge_confidence_history(

            previous_confidence.get(
                "history"
            ),

            incoming_confidence.get(
                "history"
            ),
        )
    )


    # The backend owns temporal integrity.
    #
    # An AI response must never create confidence history
    # entries for rounds that have not happened yet.

    history = [

        item

        for item
        in history

        if (
                item[
                    "round"
                ]
                <=
                int(
                    round_number
                )
        )
    ]


    if current_value is not None:

        history = (
            _merge_confidence_history(

                history,

                [
                    {
                        "round":
                            int(
                                round_number
                            ),

                        "value":
                            current_value,
                    }
                ]
            )
        )


    incoming_state[
        "confidence"
    ] = {

        "initial":
            initial_value,

        "current":
            current_value,

        "history":
            history,
    }


    return incoming_state


# ==================================================
# BUILD CHARACTER STATE
# ==================================================

def build_character_state(
        *,
        session: DebateSession,
        section_id: str,
        character_id: str,
) -> dict[str, Any]:

    state = (
        create_default_character_state()
    )


    messages = (

        DebateMessage.objects
        .filter(

            session=session,

            stage=section_id,

            speaker_id=character_id,

            speaker_type=(
                DebateMessage
                .SpeakerType
                .PANEL
            )
        )
        .order_by(
            "sequence"
        )
    )


    for message in messages:

        character_state = (

            message.metadata
            .get(
                "characterState"
            )
        )


        if isinstance(
                character_state,
                dict
        ):

            for key in [
                "status",
                "risks",
                "actions",
                "agreements",
                "disagreements",
            ]:

                if key in character_state:

                    state[key] = (
                        character_state[key]
                    )


            if isinstance(
                    character_state.get(
                        "confidence"
                    ),
                    dict
            ):

                state[
                    "confidence"
                ] = {

                    **state[
                        "confidence"
                    ],

                    **character_state[
                        "confidence"
                    ],
                }


            if isinstance(
                    character_state.get(
                        "position"
                    ),
                    dict
            ):

                state[
                    "position"
                ] = {

                    **state[
                        "position"
                    ],

                    **character_state[
                        "position"
                    ],
                }


        state[
            "statementHistory"
        ].append({

            "id":
                str(
                    message.id
                ),

            "content":
                message.content,

            "roundNumber":
                message.round_number,

            "messageType":
                message.message_type,

            "emotion":
                message.emotion,

            "animation":
                message.animation,

            "createdAt":
                message
                .created_at
                .isoformat(),
        })


        state["status"] = "complete"


    focused_discussions = (

        FocusedDiscussion.objects
        .filter(

            session=session,

            section_id=section_id,

            character_id=character_id
        )
        .order_by(
            "created_at"
        )
    )


    for discussion in focused_discussions:

        serialized = (
            serialize_focused_discussion(
                discussion
            )
        )


        discussion_id = (
            str(
                discussion.id
            )
        )


        state[
            "discussions"
        ][
            discussion_id
        ] = serialized


        state[
            "discussionOrder"
        ].append(
            discussion_id
        )


    return state


# ==================================================
# BUILD USER STATE
# ==================================================

def build_user_state(
        *,
        session: DebateSession,
        section_id: str,
) -> dict[str, Any]:

    messages = (

        DebateMessage.objects
        .filter(

            session=session,

            stage=section_id,

            speaker_type=(
                DebateMessage
                .SpeakerType
                .USER
            )
        )
        .order_by(
            "sequence"
        )
    )


    return {

        "messages": [

            serialize_debate_message(
                message
            )

            for message
            in messages
        ]
    }


# ==================================================
# BUILD MEDIATOR STATE
# ==================================================

def build_mediator_state(
        *,
        session: DebateSession,
        section_id: str,
) -> dict[str, Any]:

    state = {

        "statements":
            [],

        "summary":
            None,

        "consensus":
            [],

        "disagreements":
            [],

        "unresolvedPoints":
            [],

        "questionsForUser":
            [],
    }


    messages = (

        DebateMessage.objects
        .filter(

            session=session,

            stage=section_id,

            speaker_type=(
                DebateMessage
                .SpeakerType
                .MEDIATOR
            )
        )
        .order_by(
            "sequence"
        )
    )


    for message in messages:

        state[
            "statements"
        ].append({

            "id":
                str(
                    message.id
                ),

            "content":
                message.content,

            "roundNumber":
                message.round_number,

            "messageType":
                message.message_type,

            "createdAt":
                message
                .created_at
                .isoformat(),
        })


        mediator_state = (

            message.metadata
            .get(
                "mediatorState"
            )
        )


        if isinstance(
                mediator_state,
                dict
        ):

            for key in [

                "summary",

                "consensus",

                "disagreements",

                "unresolvedPoints",

                "questionsForUser",

            ]:

                if key in mediator_state:

                    state[key] = (
                        mediator_state[key]
                    )


    return state

# ==================================================
# SECTION METRICS
#
# Produces:
#
# - alignment score
# - stance distribution percentages
# - confidence in the idea
#
# Uses the latest reconstructed character state
# for the current section.
# ==================================================

STANCE_WEIGHTS = {

    "support":
        1.0,

    "conditional_support":
        0.5,

    "mixed":
        0.0,

    "undecided":
        0.0,

    "oppose":
        -1.0,
}


STANCE_OUTPUT_KEYS = {

    "support":
        "support",

    "conditional_support":
        "conditionalSupport",

    "mixed":
        "mixed",

    "undecided":
        "undecided",

    "oppose":
        "oppose",
}


def clamp_percentage(
        value: float
) -> int:

    return max(

        0,

        min(

            100,

            round(
                value
            )
        )
    )


def calculate_percentage(
        count: int,
        total: int,
) -> int:

    if total <= 0:

        return 0


    return round(

        (
                count
                /
                total
        )

        *
        100
    )


def build_section_metrics(
        *,
        characters: dict[str, dict[str, Any]],
) -> dict[str, Any]:

    # ==============================================
    # STANCE DISTRIBUTION
    # ==============================================

    stance_counts = {

        "support":
            0,

        "conditionalSupport":
            0,

        "mixed":
            0,

        "undecided":
            0,

        "oppose":
            0,
    }


    member_scores = []


    # ==============================================
    # READ CHARACTER STATES
    # ==============================================

    for (
            character_id,
            state
    ) in characters.items():

        if not isinstance(
                state,
                dict
        ):

            continue


        position = (
                state.get(
                    "position"
                )
                or {}
        )


        confidence = (
                state.get(
                    "confidence"
                )
                or {}
        )


        stance = (
                position.get(
                    "stance"
                )
                or "undecided"
        )


        confidence_value = (
            confidence.get(
                "current"
            )
        )


        # ------------------------------------------
        # COUNT STANCE
        # ------------------------------------------

        output_key = (
            STANCE_OUTPUT_KEYS.get(
                stance,
                "undecided"
            )
        )


        stance_counts[
            output_key
        ] += 1


        # ------------------------------------------
        # ONLY CHARACTERS WITH CONFIDENCE VALUES
        # CONTRIBUTE TO NUMERIC SCORING
        # ------------------------------------------

        if not isinstance(
                confidence_value,
                (
                        int,
                        float,
                )
        ):

            continue


        normalized_confidence = (

                max(
                    0,
                    min(
                        100,
                        confidence_value
                    )
                )

                /
                100
        )


        stance_weight = (
            STANCE_WEIGHTS.get(
                stance,
                0.0
            )
        )


        # ------------------------------------------
        # SIGNED SUPPORT STRENGTH
        #
        # confident support:
        # +1.0
        #
        # neutral / mixed:
        #  0.0
        #
        # confident opposition:
        # -1.0
        # ------------------------------------------

        signed_strength = (

                stance_weight
                *
                normalized_confidence
        )


        # ------------------------------------------
        # MEMBER ALIGNMENT SCORE
        #
        # The dashboard CouncilAlignmentPanel expects
        # a member-level score. Previously the API only
        # exposed confidence, so the frontend fell back
        # to confidence and every row could look the same.
        #
        # Map signed proposal support onto 0..100:
        #
        #   -1.0 ->   0
        #    0.0 ->  50
        #   +1.0 -> 100
        #
        # Direction still comes from `stance`; this score
        # represents how strongly the member aligns with
        # the proposal itself.
        # ------------------------------------------

        member_alignment_score = (

                50

                +

                (
                        signed_strength
                        *
                        50
                )
        )


        member_scores.append({

            "characterId":
                character_id,

            "stance":
                stance,

            "confidence":
                clamp_percentage(
                    confidence_value
                ),

            "signedStrength":
                round(
                    signed_strength,
                    4
                ),

            "alignmentScore":
                clamp_percentage(
                    member_alignment_score
                ),
        })


    total_members = (
        len(
            characters
        )
    )


    # ==============================================
    # ALIGNMENT DISTRIBUTION PERCENTAGES
    # ==============================================

    alignment_percentages = {

        key:
            calculate_percentage(
                count,
                total_members
            )

        for (
            key,
            count
        ) in stance_counts.items()
    }


    # ==============================================
    # NO NUMERIC CONFIDENCE DATA YET
    # ==============================================

    if not member_scores:

        return {

            "alignment": {

                "score":
                    None,

                **alignment_percentages,
            },

            "ideaConfidence":
                None,

            "scoredMembers":
                0,

            "totalMembers":
                total_members,

            "members":
                [],
        }


    signed_values = [

        member[
            "signedStrength"
        ]

        for member
        in member_scores
    ]


    # ==============================================
    # IDEA CONFIDENCE
    #
    # Maps collective signed support:
    #
    # -1.0 ->   0%
    #  0.0 ->  50%
    # +1.0 -> 100%
    # ==============================================

    average_signed_strength = (

            sum(
                signed_values
            )

            /
            len(
                signed_values
            )
    )


    idea_confidence = (

            50

            +

            (
                    average_signed_strength
                    *
                    50
            )
    )


    # ==============================================
    # ALIGNMENT SCORE
    #
    # Measures similarity between members.
    #
    # Members can be highly aligned while:
    #
    # - all supporting
    # - all opposing
    # - all uncertain
    #
    # Direction does not determine alignment.
    # ==============================================

    pairwise_differences = []


    for index, first_value in enumerate(
            signed_values
    ):

        for second_value in (
                signed_values[
                    index + 1:
                ]
        ):

            difference = (

                    abs(
                        first_value
                        -
                        second_value
                    )

                    /
                    2
            )


            pairwise_differences.append(
                difference
            )


    if pairwise_differences:

        average_difference = (

                sum(
                    pairwise_differences
                )

                /
                len(
                    pairwise_differences
                )
        )


        alignment_score = (

                100

                *
                (
                        1
                        -
                        average_difference
                )
        )

    else:

        # One scored member has no disagreement
        # to compare against.

        alignment_score = 100


    return {

        "alignment": {

            "score":
                clamp_percentage(
                    alignment_score
                ),

            **alignment_percentages,
        },


        "ideaConfidence":
            clamp_percentage(
                idea_confidence
            ),


        "scoredMembers":
            len(
                member_scores
            ),


        "totalMembers":
            total_members,


        "members":
            member_scores,
    }

# ==================================================
# SECTION POINT DEDUPLICATION
#
# Characters can independently propose the same risk
# or action using different IDs. The dashboard aggregates
# every character list, so duplicate titles would otherwise
# appear multiple times.
#
# Deduplication is performed at snapshot construction time:
#
# - the first owner keeps the point
# - later exact-title duplicates are removed
# - character-specific unique points remain untouched
# - persisted DebateMessage metadata is not rewritten
#
# This keeps the database history authoritative while giving
# every client a clean section snapshot.
# ==================================================

def _canonical_point_key(
        point: Any,
) -> str:

    if isinstance(
            point,
            str
    ):

        raw_value = point

    elif isinstance(
            point,
            dict
    ):

        raw_value = (
                point.get("title")
                or point.get("statement")
                or point.get("label")
                or point.get("name")
                or point.get("description")
                or point.get("id")
                or ""
        )

    else:

        raw_value = ""


    return "".join(

        character.lower()

        for character
        in str(raw_value).strip()

        if character.isalnum()
    )


def deduplicate_character_points(
        *,
        characters: dict[str, dict[str, Any]],
        field_name: str,
) -> None:

    seen_keys = set()


    for character_state in characters.values():

        if not isinstance(
                character_state,
                dict
        ):
            continue


        points = (
                character_state.get(
                    field_name
                )
                or []
        )


        if not isinstance(
                points,
                list
        ):

            character_state[field_name] = []

            continue


        unique_points = []


        for point in points:

            point_key = (
                _canonical_point_key(
                    point
                )
            )


            # Keep malformed/empty-key points instead of
            # silently discarding user-visible model output.

            if not point_key:

                unique_points.append(
                    point
                )

                continue


            if point_key in seen_keys:

                continue


            seen_keys.add(
                point_key
            )

            unique_points.append(
                point
            )


        character_state[field_name] = (
            unique_points
        )


# ==================================================
# BUILD SECTION STATE
# ==================================================

def build_section_state(
        *,
        session: DebateSession,
        section_id: str,
        sequence: int = 0,
) -> dict[str, Any]:

    calibration = (
            session.calibration_context
            or {}
    )


    round_objects = list(

        session
        .rounds
        .filter(
            section_id=section_id
        )
        .order_by(
            "number"
        )
    )


    rounds = {

        str(
            round_object.number
        ):
            serialize_round(
                round_object
            )

        for round_object
        in round_objects
    }


    characters = {}


    for participant in (
            session.panel_snapshot
            or []
    ):

        character_id = (
            str(
                participant.get(
                    "id",
                    ""
                )
            )
        )


        if not character_id:

            continue


        characters[
            character_id
        ] = build_character_state(

            session=session,

            section_id=section_id,

            character_id=character_id
        )


    # ==============================================
    # REMOVE CROSS-MEMBER DUPLICATES
    #
    # The dashboard aggregates these arrays across
    # every character. Clean them once in the backend
    # so every frontend receives the same canonical
    # section snapshot.
    # ==============================================

    deduplicate_character_points(

        characters=characters,

        field_name="risks"
    )


    deduplicate_character_points(

        characters=characters,

        field_name="actions"
    )


    metrics = (
        build_section_metrics(

            characters=characters
        )
    )


    current_section_id = (
        resolve_section_id(
            session
        )
    )


    if (
            session.status
            ==
            DebateSession.Status.COMPLETED
    ):

        section_status = "complete"


    elif (
            section_id
            ==
            current_section_id
    ):

        section_status = "active"


    elif (
            round_objects
            and
            all(

                round_object.status
                ==
                DebateRound.Status.COMPLETE

                for round_object
                in round_objects
            )
    ):

        section_status = "complete"


    else:

        section_status = "pending"


    section_round_number = (

        round_objects[0].number

        if round_objects

        else sequence + 1
    )


    return {

        "id":
            section_id,

        "title":
            (
                f"Round {section_round_number}"
            ),

        "description":
            (
                    calibration.get(
                        "topic"
                    )
                    or session.title
                    or "Discussion"
            ),

        "sequence":
            sequence,

        "status":
            section_status,

        "rounds":
            rounds,

        "characters":
            characters,

        "metrics":
            metrics,

        "user":
            build_user_state(

                session=session,

                section_id=section_id
            ),

        "mediator":
            build_mediator_state(

                session=session,

                section_id=section_id
            ),

        "conclusion":
            None,

        "metadata": {

            "roundNumber":
                section_round_number,
        },
    }


# ==================================================
# BUILD DISCUSSION SNAPSHOT
# ==================================================

# ==================================================
# BUILD DISCUSSION SNAPSHOT
# ==================================================

def build_discussion_snapshot(
        session: DebateSession
) -> dict[str, Any]:

    # ==============================================
    # REFRESH SESSION
    #
    # Ensure:
    #
    # - status
    # - current_round
    # - current_stage
    # - timestamps
    #
    # reflect the latest database state before the
    # discussion snapshot is constructed.
    # ==============================================

    session.refresh_from_db()


    # ==============================================
    # CALIBRATION
    #
    # Original debate setup information.
    # ==============================================

    calibration = (
            session.calibration_context
            or {}
    )


    # ==============================================
    # SECTION IDS
    #
    # DebateRound records look like:
    #
    # main / round 1
    # main / round 2
    # main / round 3
    #
    # Therefore querying section_id directly produces:
    #
    # [
    #     "main",
    #     "main",
    #     "main",
    # ]
    #
    # We preserve first-seen order while removing
    # duplicate section IDs.
    #
    # IMPORTANT:
    #
    # Do not use:
    #
    # .order_by("created_at")
    # .values_list("section_id", flat=True)
    # .distinct()
    #
    # because SQL ordering can prevent the expected
    # section-level de-duplication.
    # ==============================================

    raw_section_ids = (

        session
        .rounds
        .order_by(
            "created_at"
        )
        .values_list(
            "section_id",
            flat=True
        )
    )


    section_ids = list(

        dict.fromkeys(
            raw_section_ids
        )
    )


    # ==============================================
    # CURRENT SECTION
    #
    # Resolve the currently active logical section.
    #
    # Usually:
    #
    # "main"
    #
    # but the structure also supports future staged
    # debates such as:
    #
    # initial-position
    # risk-review
    # final-review
    # ==============================================

    current_section_id = (
        resolve_section_id(
            session
        )
    )


    # ==============================================
    # ENSURE CURRENT SECTION EXISTS
    #
    # A newly-started session may not yet have any
    # DebateRound rows when the snapshot is built.
    #
    # In that case, still expose the active section
    # to the frontend.
    # ==============================================

    if (
            current_section_id
            not in section_ids
    ):

        section_ids.append(
            current_section_id
        )


    # ==============================================
    # BUILD SECTION STATES
    #
    # Each unique section is constructed exactly once.
    #
    # Example:
    #
    # section_ids:
    #
    # [
    #     "main"
    # ]
    #
    # sections:
    #
    # [
    #     {
    #         id: "main",
    #         rounds: {
    #             "1": {...},
    #             "2": {...},
    #             "3": {...}
    #         },
    #         characters: {...},
    #         metrics: {...}
    #     }
    # ]
    # ==============================================

    sections = []


    for (
            index,
            section_id
    ) in enumerate(
        section_ids
    ):

        section_state = (
            build_section_state(

                session=session,

                section_id=section_id,

                sequence=index
            )
        )


        sections.append(
            section_state
        )


    # ==============================================
    # PANEL
    # ==============================================

    panel = (
            session.panel_snapshot
            or []
    )


    # ==============================================
    # CHARACTER ORDER
    #
    # Preserve the original panel order stored when
    # the debate session was created.
    # ==============================================

    character_order = [

        str(
            participant.get(
                "id"
            )
        )

        for participant
        in panel

        if participant.get(
            "id"
        )
    ]


    # ==============================================
    # SNAPSHOT RESPONSE
    # ==============================================

    return {

        # ==========================================
        # SESSION
        # ==========================================

        "sessionId":
            str(
                session.id
            ),


        "status":
            session.status,


        # ==========================================
        # BRIEF
        # ==========================================

        "brief": {

            "topic":
                calibration.get(
                    "topic",
                    ""
                ),


            "objective":
                calibration.get(
                    "objective",
                    ""
                ),


            "objectiveId":
                calibration.get(
                    "objectiveId",
                    ""
                ),


            "context":
                calibration.get(
                    "context",
                    ""
                ),


            "approach":
                calibration.get(
                    "approach",
                    "balanced"
                ),


            "councilMode":
                calibration.get(
                    "councilMode",
                    session.mode
                ),
        },


        # ==========================================
        # MODEL CONTEXT
        # ==========================================

        "modelContext": {

            "summary":
                "",


            "knownFacts":
                [],


            "assumptions":
                calibration.get(
                    "assumptions",
                    []
                ),


            "constraints":
                calibration.get(
                    "constraints",
                    []
                ),


            "objectives":
                (

                    [
                        calibration.get(
                            "objective"
                        )
                    ]

                    if calibration.get(
                        "objective"
                    )

                    else []
                ),


            "unresolvedQuestions":
                calibration.get(
                    "questions",
                    []
                ),


            "calibrationSnapshot":
                calibration,
        },


        # ==========================================
        # PARTICIPANTS
        # ==========================================

        "participants": {

            "characters":
                panel,


            "characterOrder":
                character_order,


            "mediator":
                session.mediator_snapshot,
        },


        # ==========================================
        # SECTIONS
        #
        # One entry per unique section ID.
        # ==========================================

        "sections":
            sections,


        # ==========================================
        # FLOW
        # ==========================================

        "flow": {

            "currentSectionId":
                current_section_id,


            "currentRound":
                (
                        session.current_round
                        or 1
                ),


            "currentCharacterId":
                None,


            "currentDiscussionId":
                None,


            "sectionOrder":
                section_ids,


            "completedSectionIds": [

                section[
                    "id"
                ]

                for section
                in sections

                if (
                        section.get(
                            "status"
                        )
                        ==
                        "complete"
                )
            ],
        },


        # ==========================================
        # FINAL OUTCOME
        #
        # This remains empty until final outcome
        # generation is implemented or completed.
        # ==========================================

        "outcome": {

            "confidence":
                None,


            "verdict":
                None,


            "summary":
                None,


            "risks":
                [],


            "actions":
                [],


            "unresolvedPoints":
                [],
        },
    }

# ==================================================
# LOAD DISCUSSION
# ==================================================

def load_discussion(
        session: DebateSession
) -> dict[str, Any]:

    ensure_discussion_started(
        session
    )


    return build_discussion_snapshot(
        session
    )


# ==================================================
# SYNC MEMBER REACTIONS
# ==================================================

def sync_reactions_from_context(
        *,
        session: DebateSession,
        context: dict[str, Any] | None,
        section_id: str,
        round_number: int,
) -> None:

    if not isinstance(
            context,
            dict
    ):
        return


    round_context = (
            context.get(
                "round"
            )
            or {}
    )


    reactions = (
            round_context.get(
                "reactions"
            )
            or {}
    )


    if not isinstance(
            reactions,
            dict
    ):
        return


    round_object = (

        DebateRound.objects
        .filter(

            session=session,

            section_id=section_id,

            number=round_number
        )
        .first()
    )


    if round_object is None:

        return


    valid_character_ids = {

        str(
            participant.get(
                "id"
            )
        )

        for participant
        in (
                session.panel_snapshot
                or []
        )

        if participant.get(
            "id"
        )
    }


    with transaction.atomic():

        for (
                character_id,
                reaction
        ) in reactions.items():

            character_id = (
                str(
                    character_id
                )
            )


            if (
                    character_id
                    not in valid_character_ids
            ):
                continue


            if reaction in {
                DebateReaction.Reaction.AGREE,
                DebateReaction.Reaction.DISAGREE,
            }:

                DebateReaction.objects.update_or_create(

                    round=round_object,

                    character_id=character_id,

                    defaults={
                        "reaction":
                            reaction
                    }
                )

            else:

                DebateReaction.objects.filter(

                    round=round_object,

                    character_id=character_id
                ).delete()


# ==================================================
# GLOBAL USER INPUT
# ==================================================

def submit_user_input(
        *,
        session: DebateSession,
        content: str,
        input_type: str,
        section_id: str | None = None,
        target_type: str = "section",
        target_character_id: str | None = None,
        discussion_id: str | None = None,
) -> dict[str, Any]:

    clean_content = (
            content
            or ""
    ).strip()


    if not clean_content:

        raise DiscussionServiceError(
            "Input content is required.",
            code="empty_input"
        )


    # ----------------------------------------------
    # FOCUSED DISCUSSION MESSAGE
    # ----------------------------------------------

    if (
            input_type
            ==
            "focused_discussion_message"
    ):

        if not discussion_id:

            raise DiscussionServiceError(
                "A discussion ID is required.",
                code="missing_discussion"
            )


        return continue_focused_discussion(

            session=session,

            discussion_id=discussion_id,

            content=clean_content,

            character_id=(
                target_character_id
            )
        )


    if input_type not in {
        "council_reply",
        "opposing_view",
    }:

        raise DiscussionServiceError(
            "Unsupported input type.",
            code="invalid_input_type"
        )


    (
        active_session,
        round_object
    ) = ensure_discussion_started(

        session,

        section_id=section_id
    )


    resolved_section_id = (
        round_object.section_id
    )


    if (
            input_type
            ==
            "opposing_view"
    ):

        message_type = (
            DebateMessage
            .MessageType
            .OPPOSING_VIEW
        )

    else:

        message_type = (
            DebateMessage
            .MessageType
            .COUNCIL_REPLY
        )


    message = save_debate_message(

        session=active_session,

        speaker_id="user",

        speaker_type=(
            DebateMessage
            .SpeakerType
            .USER
        ),

        message_type=message_type,

        content=clean_content,

        round_number=(
            round_object.number
        ),

        stage=resolved_section_id,

        metadata={

            "inputType":
                input_type,

            "targetType":
                target_type,

            "targetCharacterId":
                target_character_id,
        }
    )


    round_object.refresh_from_db()


    return {

        "section": {

            "id":
                resolved_section_id,

            "user":
                build_user_state(

                    session=active_session,

                    section_id=(
                        resolved_section_id
                    )
                )
        },

        "roundUpdate": {

            "sectionId":
                resolved_section_id,

            "roundNumber":
                round_object.number,

            "round":
                serialize_round(
                    round_object
                )
        },

        "message":
            serialize_debate_message(
                message
            ),

        "status":
            active_session.status,
    }


# ==================================================
# VALIDATE CHARACTER
# ==================================================

def validate_character(
        session: DebateSession,
        character_id: str,
) -> dict[str, Any]:

    for participant in (
            session.panel_snapshot
            or []
    ):

        if (
                str(
                    participant.get(
                        "id"
                    )
                )
                ==
                str(
                    character_id
                )
        ):
            return participant


    raise DiscussionServiceError(
        "The requested character is not part of this session.",
        code="invalid_character",
        status_code=404
    )


# ==================================================
# CHARACTER RESPONSE
# ==================================================

def request_character_response(
        *,
        session: DebateSession,
        character_id: str,
        section_id: str | None = None,
        discussion_id: str | None = None,
        task: str = "respond",
) -> dict[str, Any]:

    validate_character(
        session,
        character_id
    )


    (
        active_session,
        round_object
    ) = ensure_discussion_started(

        session,

        section_id=section_id
    )


    engine = (
        _get_debate_engine()
    )


    result = (
        engine.generate_character_response(

            session=active_session,

            character_id=character_id,

            section_id=(
                round_object.section_id
            ),

            round_number=(
                round_object.number
            ),

            discussion_id=discussion_id,

            task=task
        )
    )


    content = (
        result.get(
            "content",
            ""
        )
    )


    if not content:

        raise DiscussionServiceError(
            "The character response contained no content.",
            code="empty_character_response",
            status_code=502
        )


    normalized_character_state = (
        normalize_character_state_for_round(

            session=active_session,

            character_id=character_id,

            round_number=(
                round_object.number
            ),

            character_state=(
                result.get(
                    "characterState"
                )
            )
        )
    )


    message = save_debate_message(

        session=active_session,

        speaker_id=character_id,

        speaker_type=(
            DebateMessage
            .SpeakerType
            .PANEL
        ),

        message_type=(
                result.get(
                    "messageType"
                )
                or
                DebateMessage
                .MessageType
                .RESPONSE
        ),

        content=content,

        emotion=(
            result.get(
                "emotion",
                ""
            )
        ),

        animation=(
            result.get(
                "animation",
                ""
            )
        ),

        round_number=(
            round_object.number
        ),

        stage=(
            round_object.section_id
        ),

        metadata={

            "task":
                task,

            "characterState":
                normalized_character_state
        }
    )


    return {

        "section":
            build_section_state(

                session=active_session,

                section_id=(
                    round_object.section_id
                )
            ),


        "characterUpdate": {

            "sectionId":
                round_object.section_id,

            "characterId":
                character_id,

            "characterState":
                build_character_state(

                    session=active_session,

                    section_id=(
                        round_object
                        .section_id
                    ),

                    character_id=(
                        character_id
                    )
                )
        },


        "message":
            serialize_debate_message(
                message
            ),


        "flow": {

            "currentSectionId":
                round_object.section_id,

            "currentRound":
                round_object.number,

            "currentCharacterId":
                character_id,

            "currentDiscussionId":
                None,
        },


        "status":
            active_session.status,
    }


# ==================================================
# MEDIATOR RESPONSE
# ==================================================

def request_mediator_response(
        *,
        session: DebateSession,
        section_id: str | None = None,
        discussion_id: str | None = None,
        response_type: str = "synthesis",
) -> dict[str, Any]:

    (
        active_session,
        round_object
    ) = ensure_discussion_started(

        session,

        section_id=section_id
    )


    engine = (
        _get_debate_engine()
    )


    result = (
        engine.generate_mediator_response(

            session=active_session,

            section_id=(
                round_object.section_id
            ),

            round_number=(
                round_object.number
            ),

            discussion_id=discussion_id,

            response_type=(
                response_type
            )
        )
    )


    content = (
        result.get(
            "content",
            ""
        )
    )


    if not content:

        raise DiscussionServiceError(
            "The mediator response contained no content.",
            code="empty_mediator_response",
            status_code=502
        )


    mediator_id = str(

        (
                active_session
                .mediator_snapshot
                or {}
        ).get(
            "id",
            "mediator"
        )
    )


    message = save_debate_message(

        session=active_session,

        speaker_id=mediator_id,

        speaker_type=(
            DebateMessage
            .SpeakerType
            .MEDIATOR
        ),

        message_type=(
                result.get(
                    "messageType"
                )
                or
                DebateMessage
                .MessageType
                .SYNTHESIS
        ),

        content=content,

        emotion=(
            result.get(
                "emotion",
                ""
            )
        ),

        animation=(
            result.get(
                "animation",
                ""
            )
        ),

        round_number=(
            round_object.number
        ),

        stage=(
            round_object.section_id
        ),

        metadata={

            "responseType":
                response_type,

            "mediatorState":
                result.get(
                    "mediatorState",
                    {}
                )
        }
    )


    return {

        "mediatorUpdate": {

            "sectionId":
                round_object.section_id,

            "mediator":
                build_mediator_state(

                    session=active_session,

                    section_id=(
                        round_object
                        .section_id
                    )
                )
        },

        "message":
            serialize_debate_message(
                message
            ),

        "status":
            active_session.status,
    }


# ==================================================
# OPEN FOCUSED DISCUSSION
# ==================================================

def open_focused_discussion(
        *,
        session: DebateSession,
        character_id: str,
        source_type: str,
        source_id: str,
        topic: str,
        section_id: str | None = None,
) -> dict[str, Any]:

    validate_character(
        session,
        character_id
    )


    clean_topic = (
            topic
            or ""
    ).strip()


    if not clean_topic:

        raise DiscussionServiceError(
            "Focused discussion topic is required.",
            code="missing_topic"
        )


    valid_source_types = {

        choice[0]

        for choice
        in FocusedDiscussion
        .SourceType
        .choices
    }


    if (
            source_type
            not in valid_source_types
    ):

        source_type = (
            FocusedDiscussion
            .SourceType
            .OTHER
        )


    (
        active_session,
        round_object
    ) = ensure_discussion_started(

        session,

        section_id=section_id
    )


    discussion = (
        FocusedDiscussion.objects.create(

            session=active_session,

            round=round_object,

            section_id=(
                round_object.section_id
            ),

            character_id=character_id,

            source_type=source_type,

            source_id=(
                    source_id
                    or ""
            ),

            topic=clean_topic,

            title=(
                clean_topic[:255]
            ),

            status=(
                FocusedDiscussion
                .Status
                .ACTIVE
            )
        )
    )


    engine = (
        _get_debate_engine()
    )


    try:

        result = (
            engine.generate_focused_discussion_opening(

                session=active_session,

                discussion=discussion,

                character_id=character_id,

                topic=clean_topic
            )
        )


        opening_content = (
            result.get(
                "content",
                ""
            )
        )


        if opening_content:

            save_focused_message(

                discussion=discussion,

                speaker_id=character_id,

                speaker_type=(
                    FocusedDiscussionMessage
                    .SpeakerType
                    .CHARACTER
                ),

                message_type=(
                    FocusedDiscussionMessage
                    .MessageType
                    .RESPONSE
                ),

                content=opening_content,

                metadata={

                    "emotion":
                        result.get(
                            "emotion",
                            ""
                        ),

                    "animation":
                        result.get(
                            "animation",
                            ""
                        )
                }
            )


    except Exception:

        discussion.delete()

        raise


    discussion.refresh_from_db()


    return {

        "sectionId":
            round_object.section_id,

        "characterId":
            character_id,

        "subDiscussion":
            serialize_focused_discussion(
                discussion
            ),

        "flow": {

            "currentSectionId":
                round_object.section_id,

            "currentRound":
                round_object.number,

            "currentCharacterId":
                character_id,

            "currentDiscussionId":
                str(
                    discussion.id
                ),
        }
    }


# ==================================================
# CONTINUE FOCUSED DISCUSSION
# ==================================================

def continue_focused_discussion(
        *,
        session: DebateSession,
        discussion_id: str,
        content: str,
        character_id: str | None = None,
) -> dict[str, Any]:

    try:

        discussion = (

            FocusedDiscussion.objects
            .select_related(
                "session",
                "round"
            )
            .get(

                id=discussion_id,

                session=session
            )
        )

    except FocusedDiscussion.DoesNotExist:

        raise DiscussionServiceError(
            "Focused discussion was not found.",
            code="discussion_not_found",
            status_code=404
        )


    if (
            discussion.status
            !=
            FocusedDiscussion.Status.ACTIVE
    ):

        raise DiscussionServiceError(
            "This focused discussion is no longer active.",
            code="discussion_inactive"
        )


    resolved_character_id = (
            character_id
            or discussion.character_id
    )


    if (
            resolved_character_id
            !=
            discussion.character_id
    ):

        raise DiscussionServiceError(
            "Character does not match the focused discussion.",
            code="character_mismatch"
        )


    save_focused_message(

        discussion=discussion,

        speaker_id="user",

        speaker_type=(
            FocusedDiscussionMessage
            .SpeakerType
            .USER
        ),

        message_type=(
            FocusedDiscussionMessage
            .MessageType
            .MESSAGE
        ),

        content=content,

        metadata={}
    )


    engine = (
        _get_debate_engine()
    )


    result = (
        engine.generate_focused_discussion_response(

            session=session,

            discussion=discussion,

            character_id=(
                discussion.character_id
            )
        )
    )


    response_content = (
        result.get(
            "content",
            ""
        )
    )


    if response_content:

        save_focused_message(

            discussion=discussion,

            speaker_id=(
                discussion.character_id
            ),

            speaker_type=(
                FocusedDiscussionMessage
                .SpeakerType
                .CHARACTER
            ),

            message_type=(
                FocusedDiscussionMessage
                .MessageType
                .RESPONSE
            ),

            content=response_content,

            metadata={

                "emotion":
                    result.get(
                        "emotion",
                        ""
                    ),

                "animation":
                    result.get(
                        "animation",
                        ""
                    )
            }
        )


    if result.get(
            "resolved"
    ):

        discussion.status = (
            FocusedDiscussion
            .Status
            .RESOLVED
        )

        discussion.conclusion = (
            result.get(
                "conclusion",
                ""
            )
        )


        discussion.save(
            update_fields=[
                "status",
                "conclusion",
                "updated_at",
            ]
        )


    discussion.refresh_from_db()


    return {

        "sectionId":
            discussion.section_id,

        "characterId":
            discussion.character_id,

        "subDiscussion":
            serialize_focused_discussion(
                discussion
            ),

        "flow": {

            "currentSectionId":
                discussion.section_id,

            "currentRound":
                (
                    discussion.round.number

                    if discussion.round

                    else session.current_round
                ),

            "currentCharacterId":
                discussion.character_id,

            "currentDiscussionId":
                str(
                    discussion.id
                ),
        }
    }


# ==================================================
# PERSIST GENERATED ROUND
# ==================================================

def persist_generated_round(
        *,
        session: DebateSession,
        round_object: DebateRound,
        result: dict[str, Any],
) -> None:

    character_results = (
            result.get(
                "characters",
                []
            )
            or []
    )


    for character_result in (
            character_results
    ):

        character_id = str(

            character_result.get(
                "characterId",
                ""
            )
        )


        content = (
            character_result.get(
                "content",
                ""
            )
        )


        if (
                not character_id
                or
                not content
        ):
            continue


        save_debate_message(

            session=session,

            speaker_id=character_id,

            speaker_type=(
                DebateMessage
                .SpeakerType
                .PANEL
            ),

            message_type=(
                    character_result.get(
                        "messageType"
                    )
                    or
                    DebateMessage
                    .MessageType
                    .RESPONSE
            ),

            content=content,

            emotion=(
                character_result.get(
                    "emotion",
                    ""
                )
            ),

            animation=(
                character_result.get(
                    "animation",
                    ""
                )
            ),

            round_number=(
                round_object.number
            ),

            stage=(
                round_object.section_id
            ),

            metadata={

                "characterState":
                    character_result.get(
                        "characterState",
                        {}
                    )
            }
        )


    mediator_result = (
            result.get(
                "mediator"
            )
            or {}
    )


    mediator_content = (
        mediator_result.get(
            "content",
            ""
        )
    )


    if mediator_content:

        mediator_id = str(

            (
                    session.mediator_snapshot
                    or {}
            ).get(
                "id",
                "mediator"
            )
        )


        save_debate_message(

            session=session,

            speaker_id=mediator_id,

            speaker_type=(
                DebateMessage
                .SpeakerType
                .MEDIATOR
            ),

            message_type=(
                    mediator_result.get(
                        "messageType"
                    )
                    or
                    DebateMessage
                    .MessageType
                    .SYNTHESIS
            ),

            content=mediator_content,

            emotion=(
                mediator_result.get(
                    "emotion",
                    ""
                )
            ),

            animation=(
                mediator_result.get(
                    "animation",
                    ""
                )
            ),

            round_number=(
                round_object.number
            ),

            stage=(
                round_object.section_id
            ),

            metadata={

                "mediatorState":
                    mediator_result.get(
                        "mediatorState",
                        {}
                    )
            }
        )


# ==================================================
# GENERATE FULL ROUND
# ==================================================

def generate_round(
        *,
        session: DebateSession,
        round_object: DebateRound,
) -> dict[str, Any]:

    engine = (
        _get_debate_engine()
    )


    try:

        result = (
            engine.generate_round(

                session=session,

                section_id=(
                    round_object.section_id
                ),

                round_number=(
                    round_object.number
                )
            )
        )


        persist_generated_round(

            session=session,

            round_object=round_object,

            result=result
        )


        round_object.status = (
            DebateRound.Status.ACTIVE
        )


        round_object.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


    except Exception:

        round_object.status = (
            DebateRound.Status.ACTIVE
        )


        round_object.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


        raise


    session.refresh_from_db()


    return {

        "section":
            build_section_state(

                session=session,

                section_id=(
                    round_object.section_id
                )
            ),

        "roundUpdate": {

            "sectionId":
                round_object.section_id,

            "roundNumber":
                round_object.number,

            "round":
                serialize_round(
                    round_object
                )
        },

        "flow": {

            "currentSectionId":
                round_object.section_id,

            "currentRound":
                round_object.number,

            "currentCharacterId":
                None,

            "currentDiscussionId":
                None,
        },

        "status":
            session.status,
    }


# ==================================================
# NEXT ROUND
# ==================================================

def advance_round(
        *,
        session: DebateSession,
        context: dict[str, Any] | None = None,
) -> dict[str, Any]:

    (
        active_session,
        current_round_object
    ) = ensure_discussion_started(
        session
    )


    current_section_id = (
        current_round_object.section_id
    )


    sync_reactions_from_context(

        session=active_session,

        context=context,

        section_id=current_section_id,

        round_number=(
            current_round_object.number
        )
    )


    with transaction.atomic():

        locked_session = (

            DebateSession.objects
            .select_for_update()
            .get(
                pk=active_session.pk
            )
        )


        locked_current_round = (

            DebateRound.objects
            .select_for_update()
            .get(
                pk=current_round_object.pk
            )
        )


        locked_current_round.status = (
            DebateRound.Status.COMPLETE
        )

        locked_current_round.completed_at = (
            timezone.now()
        )


        locked_current_round.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )


        next_round_number = (
                locked_session.current_round
                + 1
        )


        next_section_id = (
            section_id_for_round(
                next_round_number
            )
        )


        next_round_object = (
            DebateRound.objects.create(

                session=locked_session,

                section_id=(
                    next_section_id
                ),

                number=next_round_number,

                status=(
                    DebateRound
                    .Status
                    .ACTIVE
                ),

                started_at=timezone.now()
            )
        )


        locked_session.current_round = (
            next_round_number
        )

        locked_session.status = (
            DebateSession.Status.ACTIVE
        )

        locked_session.current_stage = (
            next_section_id
        )


        locked_session.save(
            update_fields=[
                "current_round",
                "status",
                "current_stage",
                "updated_at",
            ]
        )


    locked_session.refresh_from_db()

    next_round_object.refresh_from_db()


    return {

        "section":
            build_section_state(

                session=locked_session,

                section_id=next_section_id,

                sequence=(
                        next_round_number
                        - 1
                )
            ),

        "roundUpdate": {

            "sectionId":
                next_section_id,

            "roundNumber":
                next_round_number,

            "round":
                serialize_round(
                    next_round_object
                )
        },

        "flow": {

            "currentSectionId":
                next_section_id,

            "currentRound":
                next_round_number,

            "currentCharacterId":
                None,

            "currentDiscussionId":
                None,

            "completedSectionIds":
                list(
                    dict.fromkeys(

                        locked_session
                        .rounds
                        .filter(
                            status=(
                                DebateRound
                                .Status
                                .COMPLETE
                            )
                        )
                        .order_by(
                            "number"
                        )
                        .values_list(
                            "section_id",
                            flat=True
                        )
                    )
                ),
        },

        "status":
            locked_session.status,
    }


# ==================================================
# PAUSE SESSION
# ==================================================

def pause_session(
        session: DebateSession
) -> dict[str, Any]:

    with transaction.atomic():

        locked_session = (

            DebateSession.objects
            .select_for_update()
            .get(
                pk=session.pk
            )
        )


        if (
                locked_session.status
                ==
                DebateSession.Status.COMPLETED
        ):

            raise DiscussionServiceError(
                "A completed session cannot be paused.",
                code="session_completed"
            )


        locked_session.status = (
            DebateSession.Status.PAUSED
        )


        locked_session.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


    return {

        "status":
            locked_session.status
    }


# ==================================================
# RESUME SESSION
# ==================================================

def resume_session(
        session: DebateSession
) -> dict[str, Any]:

    with transaction.atomic():

        locked_session = (

            DebateSession.objects
            .select_for_update()
            .get(
                pk=session.pk
            )
        )


        if (
                locked_session.status
                !=
                DebateSession.Status.PAUSED
        ):

            raise DiscussionServiceError(
                "Only a paused session can be resumed.",
                code="session_not_paused"
            )


        locked_session.status = (
            DebateSession.Status.ACTIVE
        )


        locked_session.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


    return {

        "status":
            locked_session.status
    }


# ==================================================
# END SESSION
# ==================================================

def end_session(
        session: DebateSession
) -> dict[str, Any]:

    with transaction.atomic():
        locked_session = (
            DebateSession.objects
            .select_for_update()
            .get(pk=session.pk)
        )

        locked_session.status = (
            DebateSession.Status.COMPLETED
        )

        locked_session.current_stage = (
            "completed"
        )

        locked_session.save(
            update_fields=[
                "status",
                "current_stage",
                "updated_at",
            ]
        )

        DebateRound.objects.filter(
            session=locked_session,
            status__in=[
                DebateRound.Status.ACTIVE,
                DebateRound.Status.PROCESSING,
            ]
        ).update(
            status=DebateRound.Status.COMPLETE,
            completed_at=timezone.now()
        )

        # Generate and persist the report inside the same transaction.
        #
        # If report generation or persistence fails, the completed status
        # and round updates are rolled back. This prevents completed
        # discussions from existing without reports.
        report = generate_debate_report(
            locked_session,
            force=False,
        )

    return {
        "status": locked_session.status,

        "reportId": str(report.id),

        "flow": {
            "currentSectionId": None,
            "currentRound": locked_session.current_round,
            "currentCharacterId": None,
            "currentDiscussionId": None,
        },
    }


# ==================================================
# SESSION CONTROL
# ==================================================

def control_session(
        *,
        session: DebateSession,
        action: str,
        context: dict[str, Any] | None = None,
) -> dict[str, Any]:

    if action == "next_round":

        return advance_round(

            session=session,

            context=context
        )


    if action == "pause":

        return pause_session(
            session
        )


    if action == "resume":

        return resume_session(
            session
        )


    if action == "end":

        return end_session(
            session
        )


    raise DiscussionServiceError(
        "Unsupported session control action.",
        code="invalid_control_action"
    )


