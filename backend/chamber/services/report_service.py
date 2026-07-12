from __future__ import annotations

from typing import Any

from django.db import transaction

from chamber.models import (
    DebateReport,
    DebateRound,
    DebateRoundMemberReport,
    DebateRoundReport,
    DebateRoundUserResponse,
    DebateSession,
    DebateTurningPoint,
)


# ==================================================
# HELPERS
# ==================================================

def safe_list(value: Any) -> list:
    return value if isinstance(value, list) else []


def safe_dict(value: Any) -> dict:
    return value if isinstance(value, dict) else {}


def clean_text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def clean_int(value: Any) -> int | None:
    if isinstance(value, bool):
        return None

    if isinstance(value, int):
        return value

    if isinstance(value, float):
        return round(value)

    return None


def participant_for(session: DebateSession, character_id: str) -> dict[str, Any]:
    target_id = str(character_id or "")

    for participant in safe_list(session.panel_snapshot):
        if str(safe_dict(participant).get("id", "")) == target_id:
            return safe_dict(participant)

    mediator = safe_dict(session.mediator_snapshot)

    if str(mediator.get("id", "")) == target_id:
        return mediator

    return {
        "id": target_id,
        "name": target_id,
        "role": "Council Member",
    }


def find_round(
        *,
        session: DebateSession,
        section_id: str,
        round_number: int,
) -> DebateRound | None:
    return (
        DebateRound.objects
        .filter(
            session=session,
            section_id=section_id,
            number=round_number,
        )
        .first()
    )


# ==================================================
# SERIALIZATION
# ==================================================

def serialize_report(report: DebateReport) -> dict[str, Any]:
    round_reports = (
        report
        .round_reports
        .all()
        .prefetch_related(
            "member_reports",
            "user_responses",
        )
        .order_by(
            "round_number",
            "section_id",
        )
    )

    turning_points = (
        report
        .turning_points
        .all()
        .select_related(
            "round_report",
        )
        .order_by(
            "id",
        )
    )

    return {
        "session": {
            "id": str(report.session.id),
            "title": report.session.title,
            "mode": report.session.mode,
            "status": report.session.status,
            "pinned": report.session.pinned,
            "currentRound": report.session.current_round,
            "currentStage": report.session.current_stage,
            "calibration": report.session.calibration_context,
            "panelMembers": report.session.panel_snapshot,
            "mediator": report.session.mediator_snapshot,
            "createdAt": report.session.created_at.isoformat(),
            "updatedAt": report.session.updated_at.isoformat(),
        },

        "executiveSummary": report.executive_summary,
        "finalVerdict": report.final_verdict,
        "mediatorFinalSummary": report.mediator_final_summary,
        "finalConfidence": report.final_confidence,
        "finalRisks": report.final_risks,
        "finalActions": report.final_actions,
        "unresolvedPoints": report.unresolved_points,
        "importantNotes": report.important_notes,
        "generatedAt": report.generated_at.isoformat(),
        "updatedAt": report.updated_at.isoformat(),

        "rounds": [
            {
                "id": str(round_report.id),
                "roundId": str(round_report.round.id) if round_report.round else None,
                "sectionId": round_report.section_id,
                "roundNumber": round_report.round_number,
                "summary": round_report.summary,
                "mediatorSummary": round_report.mediator_summary,
                "keyConflict": round_report.key_conflict,
                "resolution": round_report.resolution,
                "confidenceBefore": round_report.confidence_before,
                "confidenceAfter": round_report.confidence_after,
                "confidenceChange": round_report.confidence_change,
                "confidenceChangeReason": round_report.confidence_change_reason,
                "importantNotes": round_report.important_notes,
                "memberReports": [
                    {
                        "id": str(member_report.id),
                        "characterId": member_report.character_id,
                        "characterName": member_report.character_name,
                        "role": member_report.role,
                        "stance": member_report.stance,
                        "thoughts": member_report.thoughts,
                        "reasoning": member_report.reasoning,
                        "confidenceBefore": member_report.confidence_before,
                        "confidenceAfter": member_report.confidence_after,
                        "confidenceChangeReason": member_report.confidence_change_reason,
                        "risks": member_report.risks,
                        "actions": member_report.actions,
                        "agreements": member_report.agreements,
                        "disagreements": member_report.disagreements,
                        "changedPosition": member_report.changed_position,
                    }
                    for member_report in round_report.member_reports.all()
                ],
                "userResponses": [
                    {
                        "id": str(user_response.id),
                        "characterId": user_response.character_id,
                        "userMessage": user_response.user_message,
                        "responseType": user_response.response_type,
                        "effect": user_response.effect,
                        "sourceMessageId": (
                            str(user_response.source_message_id)
                            if user_response.source_message_id
                            else None
                        ),
                    }
                    for user_response in round_report.user_responses.all()
                ],
            }
            for round_report in round_reports
        ],

        "turningPoints": [
            {
                "id": str(turning_point.id),
                "roundReportId": (
                    str(turning_point.round_report.id)
                    if turning_point.round_report
                    else None
                ),
                "roundNumber": (
                    turning_point.round_report.round_number
                    if turning_point.round_report
                    else None
                ),
                "title": turning_point.title,
                "description": turning_point.description,
                "importance": turning_point.importance,
                "confidenceBefore": turning_point.confidence_before,
                "confidenceAfter": turning_point.confidence_after,
                "sourceMessageIds": turning_point.source_message_ids,
                "metadata": turning_point.metadata,
            }
            for turning_point in turning_points
        ],
    }


def empty_report_payload(session: DebateSession) -> dict[str, Any]:
    return {
        "session": {
            "id": str(session.id),
            "title": session.title,
            "mode": session.mode,
            "status": session.status,
            "pinned": session.pinned,
            "currentRound": session.current_round,
            "currentStage": session.current_stage,
            "calibration": session.calibration_context,
            "panelMembers": session.panel_snapshot,
            "mediator": session.mediator_snapshot,
            "createdAt": session.created_at.isoformat(),
            "updatedAt": session.updated_at.isoformat(),
        },
        "executiveSummary": "",
        "finalVerdict": "",
        "mediatorFinalSummary": "",
        "finalConfidence": None,
        "finalRisks": [],
        "finalActions": [],
        "unresolvedPoints": [],
        "importantNotes": [
            "No saved report has been generated for this session yet."
        ],
        "rounds": [],
        "turningPoints": [],
        "generatedAt": None,
        "updatedAt": None,
    }


# ==================================================
# SAVE AI REPORT
# ==================================================

def save_report_payload(
        *,
        session: DebateSession,
        payload: dict[str, Any],
) -> DebateReport:
    payload = safe_dict(payload)

    with transaction.atomic():
        report, _ = DebateReport.objects.get_or_create(
            session=session,
            defaults={
                "executive_summary": "",
                "final_verdict": "",
                "mediator_final_summary": "",
            },
        )

        # Replace child rows so regenerated reports are clean and deterministic.
        report.round_reports.all().delete()
        report.turning_points.all().delete()

        report.executive_summary = clean_text(
            payload.get("executiveSummary")
        )
        report.final_verdict = clean_text(
            payload.get("finalVerdict")
        )
        report.mediator_final_summary = clean_text(
            payload.get("mediatorFinalSummary")
        )
        report.final_confidence = clean_int(
            payload.get("finalConfidence")
        )
        report.final_risks = safe_list(
            payload.get("finalRisks")
        )
        report.final_actions = safe_list(
            payload.get("finalActions")
        )
        report.unresolved_points = safe_list(
            payload.get("unresolvedPoints")
        )
        report.important_notes = safe_list(
            payload.get("importantNotes")
        )

        report.save(
            update_fields=[
                "executive_summary",
                "final_verdict",
                "mediator_final_summary",
                "final_confidence",
                "final_risks",
                "final_actions",
                "unresolved_points",
                "important_notes",
                "updated_at",
            ]
        )

        round_report_by_number: dict[int, DebateRoundReport] = {}

        for round_payload in safe_list(payload.get("rounds")):
            round_payload = safe_dict(round_payload)

            section_id = clean_text(
                round_payload.get("sectionId")
            ) or "main"

            round_number = clean_int(
                round_payload.get("roundNumber")
            ) or 1

            confidence_before = clean_int(
                round_payload.get("confidenceBefore")
            )

            confidence_after = clean_int(
                round_payload.get("confidenceAfter")
            )

            confidence_change = clean_int(
                round_payload.get("confidenceChange")
            )

            if (
                    confidence_change is None
                    and confidence_before is not None
                    and confidence_after is not None
            ):
                confidence_change = confidence_after - confidence_before

            round_object = find_round(
                session=session,
                section_id=section_id,
                round_number=round_number,
            )

            round_report = DebateRoundReport.objects.create(
                report=report,
                round=round_object,
                section_id=section_id,
                round_number=round_number,
                summary=clean_text(round_payload.get("summary")),
                mediator_summary=clean_text(round_payload.get("mediatorSummary")),
                key_conflict=clean_text(round_payload.get("keyConflict")),
                resolution=clean_text(round_payload.get("resolution")),
                confidence_before=confidence_before,
                confidence_after=confidence_after,
                confidence_change=confidence_change,
                confidence_change_reason=clean_text(
                    round_payload.get("confidenceChangeReason")
                ),
                important_notes=safe_list(
                    round_payload.get("importantNotes")
                ),
            )

            round_report_by_number[round_number] = round_report

            for member_payload in safe_list(round_payload.get("memberReports")):
                member_payload = safe_dict(member_payload)

                character_id = clean_text(
                    member_payload.get("characterId")
                )

                participant = participant_for(
                    session,
                    character_id,
                )

                DebateRoundMemberReport.objects.create(
                    round_report=round_report,
                    character_id=character_id,
                    character_name=(
                            clean_text(member_payload.get("characterName"))
                            or participant.get("name", character_id)
                    ),
                    role=(
                            clean_text(member_payload.get("role"))
                            or participant.get("role", "")
                    ),
                    stance=clean_text(member_payload.get("stance")),
                    thoughts=clean_text(member_payload.get("thoughts")),
                    reasoning=clean_text(member_payload.get("reasoning")),
                    confidence_before=clean_int(member_payload.get("confidenceBefore")),
                    confidence_after=clean_int(member_payload.get("confidenceAfter")),
                    confidence_change_reason=clean_text(
                        member_payload.get("confidenceChangeReason")
                    ),
                    risks=safe_list(member_payload.get("risks")),
                    actions=safe_list(member_payload.get("actions")),
                    agreements=safe_list(member_payload.get("agreements")),
                    disagreements=safe_list(member_payload.get("disagreements")),
                    changed_position=bool(member_payload.get("changedPosition")),
                )

            for response_payload in safe_list(round_payload.get("userResponses")):
                response_payload = safe_dict(response_payload)

                source_message_id = response_payload.get("sourceMessageId")

                DebateRoundUserResponse.objects.create(
                    round_report=round_report,
                    character_id=clean_text(response_payload.get("characterId")),
                    user_message=clean_text(response_payload.get("userMessage")),
                    response_type=clean_text(response_payload.get("responseType")),
                    effect=clean_text(response_payload.get("effect")),
                    source_message_id=(
                        source_message_id
                        if source_message_id
                        else None
                    ),
                )

        for point_payload in safe_list(payload.get("turningPoints")):
            point_payload = safe_dict(point_payload)

            round_number = clean_int(
                point_payload.get("roundNumber")
            )

            round_report = (
                round_report_by_number.get(round_number)
                if round_number is not None
                else None
            )

            DebateTurningPoint.objects.create(
                report=report,
                round_report=round_report,
                title=clean_text(point_payload.get("title")) or "Turning point",
                description=clean_text(point_payload.get("description")),
                importance=(
                        clean_text(point_payload.get("importance"))
                        or "medium"
                ),
                confidence_before=clean_int(point_payload.get("confidenceBefore")),
                confidence_after=clean_int(point_payload.get("confidenceAfter")),
                source_message_ids=safe_list(point_payload.get("sourceMessageIds")),
                metadata=safe_dict(point_payload.get("metadata")),
            )

    return report


# ==================================================
# PUBLIC API
# ==================================================

def generate_debate_report(
        session: DebateSession,
        *,
        force: bool = False,
) -> DebateReport:
    """
    Generate and persist the completed-session report.

    This is the backend write path. The frontend report endpoint should remain
    read-only and call build_report().
    """

    if (
            not force
            and hasattr(session, "report")
            and session.report is not None
    ):
        return session.report

    from chamber.services.gpt_debate_engine import generate_session_report

    payload = generate_session_report(
        session
    )

    return save_report_payload(
        session=session,
        payload=payload,
    )


def build_report(
        session: DebateSession,
) -> dict[str, Any]:
    """
    Read the saved report as frontend-ready JSON.

    This must not call AI. Viewing the report should be deterministic.
    """

    try:
        report = session.report

    except DebateReport.DoesNotExist:
        return empty_report_payload(
            session
        )

    return serialize_report(
        report
    )

