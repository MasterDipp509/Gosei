import uuid


from django.conf import settings

from django.db import models


# ==================================================
# DEBATE SESSION
# ==================================================

class DebateSession(
    models.Model
):

    class Mode(
        models.TextChoices
    ):
        PANEL = (
            "panel",
            "Panel"
        )

        MEDIATOR = (
            "mediator",
            "Mediator"
        )


    class Status(
        models.TextChoices
    ):
        READY = (
            "ready",
            "Ready"
        )

        ACTIVE = (
            "active",
            "Active"
        )

        PAUSED = (
            "paused",
            "Paused"
        )

        COMPLETED = (
            "completed",
            "Completed"
        )

        ABANDONED = (
            "abandoned",
            "Abandoned"
        )


    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )


    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="debate_sessions"
    )


    mode = models.CharField(
        max_length=20,
        choices=Mode.choices
    )


    title = models.CharField(
        max_length=255,
        blank=True
    )


    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.READY
    )


    # ==============================================
    # PIN STATE
    #
    # Used by the frontend session archive to:
    #
    # - identify pinned discussions
    # - show pinned discussions separately
    # - sort pinned sessions before normal sessions
    #
    # Defaults to False so existing sessions remain
    # unpinned after migration.
    # ==============================================

    pinned = models.BooleanField(
        default=False,
        db_index=True
    )


    # Everything collected during calibration.

    calibration_context = models.JSONField(
        default=dict
    )


    # Frozen snapshots of the participant
    # configuration used for this session.

    panel_snapshot = models.JSONField(
        default=list
    )


    mediator_snapshot = models.JSONField(
        default=dict
    )


    current_round = (
        models.PositiveSmallIntegerField(
            default=0
        )
    )


    current_stage = models.CharField(
        max_length=100,
        default="ready"
    )


    # Reserved for Responses API continuation
    # if we later choose to use it.

    openai_conversation_id = (
        models.CharField(
            max_length=255,
            blank=True
        )
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    updated_at = models.DateTimeField(
        auto_now=True
    )


    class Meta:

        ordering = [
            "-created_at"
        ]


    def __str__(self):

        return (
                self.title
                or
                f"{self.mode} debate — {self.id}"
        )


# ==================================================
# DEBATE ROUND
# ==================================================

class DebateRound(
    models.Model
):

    class Status(
        models.TextChoices
    ):
        PENDING = (
            "pending",
            "Pending"
        )

        PROCESSING = (
            "processing",
            "Processing"
        )

        ACTIVE = (
            "active",
            "Active"
        )

        COMPLETE = (
            "complete",
            "Complete"
        )


    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )


    session = models.ForeignKey(
        DebateSession,
        on_delete=models.CASCADE,
        related_name="rounds"
    )


    # Matches frontend currentSectionId.
    #
    # For now this can be "main".
    # Later the debate engine can create
    # structured sections.

    section_id = models.CharField(
        max_length=100,
        default="main"
    )


    number = (
        models.PositiveSmallIntegerField()
    )


    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )


    started_at = models.DateTimeField(
        null=True,
        blank=True
    )


    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    updated_at = models.DateTimeField(
        auto_now=True
    )


    class Meta:

        ordering = [
            "section_id",
            "number"
        ]


        constraints = [

            models.UniqueConstraint(

                fields=[
                    "session",
                    "section_id",
                    "number"
                ],

                name=(
                    "unique_debate_round_"
                    "per_section"
                )
            )
        ]


        indexes = [

            models.Index(

                fields=[
                    "session",
                    "section_id",
                    "number"
                ],

                name="debate_round_lookup"
            )
        ]


    def __str__(self):

        return (
            f"{self.session_id} "
            f"{self.section_id} "
            f"round {self.number}"
        )


# ==================================================
# DEBATE MESSAGE
# ==================================================

class DebateMessage(
    models.Model
):

    class SpeakerType(
        models.TextChoices
    ):
        USER = (
            "user",
            "User"
        )

        PANEL = (
            "panel",
            "Panel Member"
        )

        MEDIATOR = (
            "mediator",
            "Mediator"
        )

        SYSTEM = (
            "system",
            "System"
        )


    class MessageType(
        models.TextChoices
    ):
        POSITION = (
            "position",
            "Position"
        )

        CHALLENGE = (
            "challenge",
            "Challenge"
        )

        RESPONSE = (
            "response",
            "Response"
        )

        INTERVENTION = (
            "intervention",
            "Intervention"
        )

        COUNCIL_REPLY = (
            "council_reply",
            "Council Reply"
        )

        OPPOSING_VIEW = (
            "opposing_view",
            "Opposing View"
        )

        SYNTHESIS = (
            "synthesis",
            "Synthesis"
        )

        VERDICT = (
            "verdict",
            "Verdict"
        )


    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )


    session = models.ForeignKey(
        DebateSession,
        on_delete=models.CASCADE,
        related_name="messages"
    )


    sequence = (
        models.PositiveIntegerField()
    )


    speaker_id = models.CharField(
        max_length=100
    )


    speaker_type = models.CharField(
        max_length=20,
        choices=SpeakerType.choices
    )


    message_type = models.CharField(
        max_length=30,
        choices=MessageType.choices
    )


    content = models.TextField()


    emotion = models.CharField(
        max_length=50,
        blank=True
    )


    animation = models.CharField(
        max_length=50,
        blank=True
    )


    round_number = (
        models.PositiveSmallIntegerField(
            default=1
        )
    )


    # Matches the section / debate stage
    # the message belongs to.

    stage = models.CharField(
        max_length=100
    )


    metadata = models.JSONField(
        default=dict,
        blank=True
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    class Meta:

        ordering = [
            "sequence"
        ]


        constraints = [

            models.UniqueConstraint(

                fields=[
                    "session",
                    "sequence"
                ],

                name=(
                    "unique_session_"
                    "message_sequence"
                )
            )
        ]


        indexes = [

            models.Index(

                fields=[
                    "session",
                    "round_number"
                ],

                name="debate_message_round"
            ),


            models.Index(

                fields=[
                    "session",
                    "stage"
                ],

                name="debate_message_stage"
            ),
        ]


    def __str__(self):

        return (
            f"{self.session_id} "
            f"#{self.sequence} "
            f"{self.speaker_id}"
        )


# ==================================================
# MEMBER REACTION
# ==================================================

class DebateReaction(
    models.Model
):

    class Reaction(
        models.TextChoices
    ):
        AGREE = (
            "agree",
            "Agree"
        )

        DISAGREE = (
            "disagree",
            "Disagree"
        )


    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )


    round = models.ForeignKey(
        DebateRound,
        on_delete=models.CASCADE,
        related_name="reactions"
    )


    character_id = models.CharField(
        max_length=100
    )


    reaction = models.CharField(
        max_length=20,
        choices=Reaction.choices
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    updated_at = models.DateTimeField(
        auto_now=True
    )


    class Meta:

        ordering = [
            "character_id"
        ]


        constraints = [

            models.UniqueConstraint(

                fields=[
                    "round",
                    "character_id"
                ],

                name=(
                    "unique_character_reaction_"
                    "per_round"
                )
            )
        ]


    def __str__(self):

        return (
            f"{self.round_id} "
            f"{self.character_id}: "
            f"{self.reaction}"
        )


# ==================================================
# FOCUSED DISCUSSION
# ==================================================

class FocusedDiscussion(
    models.Model
):

    class Status(
        models.TextChoices
    ):
        ACTIVE = (
            "active",
            "Active"
        )

        RESOLVED = (
            "resolved",
            "Resolved"
        )

        CLOSED = (
            "closed",
            "Closed"
        )


    class SourceType(
        models.TextChoices
    ):
        RISK = (
            "risk",
            "Risk"
        )

        ACTION = (
            "action",
            "Action"
        )

        STATEMENT = (
            "statement",
            "Statement"
        )

        DISAGREEMENT = (
            "disagreement",
            "Disagreement"
        )

        QUESTION = (
            "question",
            "Question"
        )

        OTHER = (
            "other",
            "Other"
        )


    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )


    session = models.ForeignKey(
        DebateSession,
        on_delete=models.CASCADE,
        related_name="focused_discussions"
    )


    round = models.ForeignKey(
        DebateRound,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="focused_discussions"
    )


    section_id = models.CharField(
        max_length=100,
        default="main"
    )


    character_id = models.CharField(
        max_length=100
    )


    source_type = models.CharField(
        max_length=30,
        choices=SourceType.choices
    )


    source_id = models.CharField(
        max_length=150,
        blank=True
    )


    topic = models.TextField()


    title = models.CharField(
        max_length=255,
        blank=True
    )


    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )


    conclusion = models.TextField(
        blank=True
    )


    mediator_state = models.JSONField(
        default=dict,
        blank=True
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    updated_at = models.DateTimeField(
        auto_now=True
    )


    class Meta:

        ordering = [
            "created_at"
        ]


        indexes = [

            models.Index(

                fields=[
                    "session",
                    "section_id",
                    "character_id"
                ],

                name="focused_discussion_lookup"
            )
        ]


    def __str__(self):

        return (
            f"{self.character_id}: "
            f"{self.topic[:60]}"
        )


# ==================================================
# FOCUSED DISCUSSION MESSAGE
# ==================================================

class FocusedDiscussionMessage(
    models.Model
):

    class SpeakerType(
        models.TextChoices
    ):
        USER = (
            "user",
            "User"
        )

        CHARACTER = (
            "character",
            "Character"
        )

        MEDIATOR = (
            "mediator",
            "Mediator"
        )

        SYSTEM = (
            "system",
            "System"
        )


    class MessageType(
        models.TextChoices
    ):
        MESSAGE = (
            "message",
            "Message"
        )

        RESPONSE = (
            "response",
            "Response"
        )

        SYNTHESIS = (
            "synthesis",
            "Synthesis"
        )


    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )


    discussion = models.ForeignKey(
        FocusedDiscussion,
        on_delete=models.CASCADE,
        related_name="messages"
    )


    sequence = (
        models.PositiveIntegerField()
    )


    speaker_id = models.CharField(
        max_length=100
    )


    speaker_type = models.CharField(
        max_length=20,
        choices=SpeakerType.choices
    )


    message_type = models.CharField(
        max_length=30,
        choices=MessageType.choices
    )


    content = models.TextField()


    metadata = models.JSONField(
        default=dict,
        blank=True
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    class Meta:

        ordering = [
            "sequence"
        ]


        constraints = [

            models.UniqueConstraint(

                fields=[
                    "discussion",
                    "sequence"
                ],

                name=(
                    "unique_focused_discussion_"
                    "message_sequence"
                )
            )
        ]


    def __str__(self):

        return (
            f"{self.discussion_id} "
            f"#{self.sequence} "
            f"{self.speaker_id}"
        )

class DebateReport(models.Model):
    session = models.OneToOneField(DebateSession, on_delete=models.CASCADE, related_name="report")
    executive_summary = models.TextField(blank=True)
    final_verdict = models.TextField(blank=True)
    mediator_final_summary = models.TextField(blank=True)
    final_confidence = models.IntegerField(null=True, blank=True)
    final_risks = models.JSONField(default=list, blank=True)
    final_actions = models.JSONField(default=list, blank=True)
    unresolved_points = models.JSONField(default=list, blank=True)
    important_notes = models.JSONField(default=list, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class DebateRoundReport(models.Model):
    report = models.ForeignKey(DebateReport, on_delete=models.CASCADE, related_name="round_reports")
    round = models.ForeignKey(DebateRound, on_delete=models.SET_NULL, null=True, blank=True)
    section_id = models.CharField(max_length=100, default="main")
    round_number = models.PositiveSmallIntegerField()

    summary = models.TextField(blank=True)
    mediator_summary = models.TextField(blank=True)

    key_conflict = models.TextField(blank=True)
    resolution = models.TextField(blank=True)

    confidence_before = models.IntegerField(null=True, blank=True)
    confidence_after = models.IntegerField(null=True, blank=True)
    confidence_change = models.IntegerField(null=True, blank=True)
    confidence_change_reason = models.TextField(blank=True)

    important_notes = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = ("report", "section_id", "round_number")

class DebateRoundMemberReport(
    models.Model
):

    round_report = models.ForeignKey(
        DebateRoundReport,
        on_delete=models.CASCADE,
        related_name="member_reports"
    )


    character_id = models.CharField(
        max_length=100
    )


    character_name = models.CharField(
        max_length=150,
        blank=True
    )


    role = models.CharField(
        max_length=150,
        blank=True
    )


    stance = models.TextField(
        blank=True
    )


    thoughts = models.TextField(
        blank=True
    )


    reasoning = models.TextField(
        blank=True
    )


    confidence_before = models.IntegerField(
        null=True,
        blank=True
    )


    confidence_after = models.IntegerField(
        null=True,
        blank=True
    )


    confidence_change_reason = models.TextField(
        blank=True
    )


    risks = models.JSONField(
        default=list,
        blank=True
    )


    actions = models.JSONField(
        default=list,
        blank=True
    )


    agreements = models.JSONField(
        default=list,
        blank=True
    )


    disagreements = models.JSONField(
        default=list,
        blank=True
    )


    changed_position = models.BooleanField(
        default=False
    )


    class Meta:

        ordering = [
            "character_name"
        ]


        constraints = [

            models.UniqueConstraint(

                fields=[
                    "round_report",
                    "character_id"
                ],

                name=(
                    "unique_character_report_"
                    "per_round_report"
                )
            )
        ]


    def __str__(
            self
    ):

        return (
            f"{self.character_name or self.character_id} "
            f"— round {self.round_report.round_number}"
        )

class DebateRoundUserResponse(models.Model):
    round_report = models.ForeignKey(DebateRoundReport, on_delete=models.CASCADE, related_name="user_responses")
    character_id = models.CharField(max_length=100, blank=True)
    user_message = models.TextField()
    response_type = models.CharField(max_length=100, blank=True)
    effect = models.TextField(blank=True)
    source_message_id = models.UUIDField(null=True, blank=True)

class DebateTurningPoint(models.Model):
    report = models.ForeignKey(DebateReport, on_delete=models.CASCADE, related_name="turning_points")
    round_report = models.ForeignKey(DebateRoundReport, on_delete=models.SET_NULL, null=True, blank=True)

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    importance = models.CharField(max_length=50, default="medium")

    confidence_before = models.IntegerField(null=True, blank=True)
    confidence_after = models.IntegerField(null=True, blank=True)

    source_message_ids = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

