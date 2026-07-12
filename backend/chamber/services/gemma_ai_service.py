# chamber/services/gemma_ai_service.py

from __future__ import annotations


import logging
import os
import threading

from typing import Any


from openai import (
    APIConnectionError,
    APIError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)


# ==================================================
# LOGGER
# ==================================================

logger = logging.getLogger(
    __name__
)


# ==================================================
# DEFAULTS
# ==================================================

DEFAULT_BASE_URL = (
    ""
)


DEFAULT_MODEL = (
    "gosei-gemma"
)


DEFAULT_API_KEY = (
    ""
)


DEFAULT_TIMEOUT_SECONDS = (
    300.0
)


DEFAULT_MAX_RETRIES = (
    2
)


DEFAULT_TEMPERATURE = (
    0.7
)


# ==================================================
# CLIENT STATE
# ==================================================

_client: OpenAI | None = None


_client_lock = threading.Lock()


# ==================================================
# EXCEPTIONS
# ==================================================

class AIServiceError(
    RuntimeError
):
    """
    Raised when the configured AI transport cannot
    successfully complete or read an AI response.

    Gosei currently targets an OpenAI-compatible vLLM
    endpoint serving Gemma on AMD ROCm infrastructure.
    """

    def __init__(
            self,
            message: str,
            *,
            code: str = "ai_service_error",
            status_code: int = 502,
    ):

        super().__init__(
            message
        )


        self.code = code

        self.status_code = status_code


# ==================================================
# ENVIRONMENT HELPERS
# ==================================================

def _get_base_url() -> str:

    base_url = (
        os.getenv(
            "AI_BASE_URL",
            DEFAULT_BASE_URL
        )
        .strip()
    )


    if not base_url:

        raise AIServiceError(

            "AI_BASE_URL is empty.",

            code="ai_base_url_missing",

            status_code=500
        )


    return base_url.rstrip(
        "/"
    )


def _get_api_key() -> str:

    api_key = (
        os.getenv(
            "AI_API_KEY",
            DEFAULT_API_KEY
        )
        .strip()
    )


    if not api_key:

        raise AIServiceError(

            "AI_API_KEY is empty.",

            code="ai_api_key_missing",

            status_code=500
        )


    return api_key


def _get_model_name() -> str:

    model = (
        os.getenv(
            "AI_MODEL",
            DEFAULT_MODEL
        )
        .strip()
    )


    if not model:

        raise AIServiceError(

            "AI_MODEL is empty.",

            code="ai_model_missing",

            status_code=500
        )


    return model


def _get_timeout_seconds() -> float:

    raw_value = os.getenv(

        "AI_TIMEOUT_SECONDS",

        str(
            DEFAULT_TIMEOUT_SECONDS
        )
    )


    try:

        value = float(
            raw_value
        )


    except (
            TypeError,
            ValueError,
    ) as exc:

        raise AIServiceError(

            "AI_TIMEOUT_SECONDS must be a number.",

            code="invalid_ai_timeout",

            status_code=500

        ) from exc


    if value <= 0:

        raise AIServiceError(

            "AI_TIMEOUT_SECONDS must be greater than zero.",

            code="invalid_ai_timeout",

            status_code=500
        )


    return value


def _get_max_retries() -> int:

    raw_value = os.getenv(

        "AI_MAX_RETRIES",

        str(
            DEFAULT_MAX_RETRIES
        )
    )


    try:

        value = int(
            raw_value
        )


    except (
            TypeError,
            ValueError,
    ) as exc:

        raise AIServiceError(

            "AI_MAX_RETRIES must be an integer.",

            code="invalid_ai_max_retries",

            status_code=500

        ) from exc


    if value < 0:

        raise AIServiceError(

            "AI_MAX_RETRIES cannot be negative.",

            code="invalid_ai_max_retries",

            status_code=500
        )


    return value


def _get_temperature() -> float:

    raw_value = os.getenv(

        "AI_TEMPERATURE",

        str(
            DEFAULT_TEMPERATURE
        )
    )


    try:

        value = float(
            raw_value
        )


    except (
            TypeError,
            ValueError,
    ) as exc:

        raise AIServiceError(

            "AI_TEMPERATURE must be a number.",

            code="invalid_ai_temperature",

            status_code=500

        ) from exc


    if (
            value < 0
            or
            value > 2
    ):

        raise AIServiceError(

            "AI_TEMPERATURE must be between 0 and 2.",

            code="invalid_ai_temperature",

            status_code=500
        )


    return value


# ==================================================
# CLIENT CREATION
# ==================================================

def _build_client() -> OpenAI:
    """
    Build an OpenAI SDK client pointed at the configured
    OpenAI-compatible inference server.

    For Gosei's hackathon deployment this is vLLM serving
    Gemma on AMD ROCm infrastructure.
    """

    client_options: dict[str, Any] = {

        "api_key":
            _get_api_key(),


        "base_url":
            _get_base_url(),


        "timeout":
            _get_timeout_seconds(),


        "max_retries":
            _get_max_retries(),
    }


    try:

        return OpenAI(
            **client_options
        )


    except Exception as exc:

        logger.exception(
            "Failed to initialize AI client."
        )


        raise AIServiceError(

            "The AI client could not be initialized.",

            code="ai_client_initialization_error",

            status_code=500

        ) from exc


def get_ai_client() -> OpenAI:
    """
    Return one reusable process-local AI client.
    """

    global _client


    if _client is not None:

        return _client


    with _client_lock:

        if _client is None:

            _client = (
                _build_client()
            )


    return _client


# ==================================================
# METADATA NORMALIZATION
# ==================================================

def _normalize_metadata(
        metadata: dict[str, str] | None
) -> dict[str, str] | None:

    if not metadata:

        return None


    normalized: dict[str, str] = {}


    for key, value in metadata.items():

        if value is None:

            continue


        normalized[
            str(
                key
            )
        ] = str(
            value
        )


    return (
            normalized
            or None
    )


# ==================================================
# MESSAGE NORMALIZATION
# ==================================================

def _normalize_messages(
        *,
        instructions: str,
        input_data: list[dict[str, Any]],
) -> list[dict[str, str]]:

    messages: list[dict[str, str]] = [

        {
            "role":
                "system",

            "content":
                instructions.strip(),
        }
    ]


    for index, item in enumerate(
            input_data
    ):

        if not isinstance(
                item,
                dict
        ):

            raise AIServiceError(

                (
                    "AI input item "
                    f"{index} must be an object."
                ),

                code="invalid_ai_input_item",

                status_code=500
            )


        role = str(
            item.get(
                "role",
                ""
            )
        ).strip()


        content = item.get(
            "content"
        )


        if role not in {
            "system",
            "user",
            "assistant",
        }:

            raise AIServiceError(

                (
                    "AI input item "
                    f"{index} has unsupported role '{role}'."
                ),

                code="invalid_ai_input_role",

                status_code=500
            )


        if (
                not isinstance(
                    content,
                    str
                )
                or
                not content.strip()
        ):

            raise AIServiceError(

                (
                    "AI input item "
                    f"{index} must contain non-empty text."
                ),

                code="invalid_ai_input_content",

                status_code=500
            )


        messages.append({

            "role":
                role,

            "content":
                content,
        })


    return messages


# ==================================================
# STRUCTURED OUTPUT TRANSLATION
# ==================================================

def _build_response_format(
        text_config: dict[str, Any] | None
) -> dict[str, Any] | None:
    """
    Translate Gosei's existing Responses-API-style
    text.format configuration into the Chat Completions
    response_format shape used by vLLM structured outputs.

    Input:

        {
            "format": {
                "type": "json_schema",
                "name": "gosei_character_response",
                "strict": True,
                "schema": {...},
            }
        }

    Output:

        {
            "type": "json_schema",
            "json_schema": {
                "name": "gosei_character_response",
                "strict": True,
                "schema": {...},
            }
        }
    """

    if text_config is None:

        return None


    if not isinstance(
            text_config,
            dict
    ):

        raise AIServiceError(

            "text_config must be an object.",

            code="invalid_ai_text_config",

            status_code=500
        )


    format_config = text_config.get(
        "format"
    )


    if not isinstance(
            format_config,
            dict
    ):

        raise AIServiceError(

            "text_config.format must be an object.",

            code="invalid_ai_format_config",

            status_code=500
        )


    format_type = format_config.get(
        "type"
    )


    if format_type != "json_schema":

        raise AIServiceError(

            (
                "Unsupported structured output format: "
                f"{format_type!r}."
            ),

            code="unsupported_ai_format",

            status_code=500
        )


    schema_name = str(
        format_config.get(
            "name",
            ""
        )
    ).strip()


    schema = format_config.get(
        "schema"
    )


    strict = bool(
        format_config.get(
            "strict",
            True
        )
    )


    if not schema_name:

        raise AIServiceError(

            "JSON schema name is missing.",

            code="ai_schema_name_missing",

            status_code=500
        )


    if not isinstance(
            schema,
            dict
    ):

        raise AIServiceError(

            "JSON schema must be an object.",

            code="ai_schema_missing",

            status_code=500
        )


    return {

        "type":
            "json_schema",


        "json_schema": {

            "name":
                schema_name,


            "strict":
                strict,


            "schema":
                schema,
        },
    }


# ==================================================
# RESPONSE CREATION
# ==================================================

def create_response(
        *,
        instructions: str,
        input_data: list[dict[str, Any]],
        text_config: dict[str, Any] | None = None,
        max_output_tokens: int = 2400,
        metadata: dict[str, str] | None = None,
        model: str | None = None,
        previous_response_id: str | None = None,
) -> Any:
    """
    Create one Chat Completions response through the
    configured OpenAI-compatible inference endpoint.

    The public function signature intentionally matches
    Gosei's previous OpenAI transport so debate_engine.py
    can keep its structured request contract.
    """

    if (
            not isinstance(
                instructions,
                str
            )
            or
            not instructions.strip()
    ):

        raise AIServiceError(

            "AI instructions cannot be empty.",

            code="ai_instructions_missing",

            status_code=500
        )


    if (
            not isinstance(
                input_data,
                list
            )
            or
            not input_data
    ):

        raise AIServiceError(

            "AI input data cannot be empty.",

            code="ai_input_missing",

            status_code=500
        )


    if (
            not isinstance(
                max_output_tokens,
                int
            )
            or
            max_output_tokens <= 0
    ):

        raise AIServiceError(

            "max_output_tokens must be a positive integer.",

            code="invalid_max_output_tokens",

            status_code=500
        )


    if previous_response_id:

        raise AIServiceError(

            (
                "previous_response_id is not supported by "
                "the current stateless vLLM chat transport."
            ),

            code="ai_continuation_unsupported",

            status_code=500
        )


    client = get_ai_client()


    resolved_model = (

        model.strip()

        if (
                isinstance(
                    model,
                    str
                )
                and
                model.strip()
        )

        else _get_model_name()
    )


    messages = _normalize_messages(

        instructions=instructions,

        input_data=input_data,
    )


    response_format = (
        _build_response_format(
            text_config
        )
    )


    normalized_metadata = (
        _normalize_metadata(
            metadata
        )
    )


    request_data: dict[str, Any] = {

        "model":
            resolved_model,


        "messages":
            messages,


        "max_tokens":
            max_output_tokens,


        "temperature":
            _get_temperature(),
    }


    if response_format is not None:

        request_data[
            "response_format"
        ] = response_format


    try:

        response = (
            client.chat.completions.create(
                **request_data
            )
        )


        logger.info(

            "AI response completed. "
            "response_id=%s model=%s action=%s",

            getattr(
                response,
                "id",
                None
            ),

            resolved_model,

            (
                    normalized_metadata
                    or {}
            ).get(
                "action"
            )
        )


        return response


    except AuthenticationError as exc:

        raise AIServiceError(

            "AI authentication failed. Check AI_API_KEY.",

            code="ai_authentication_error",

            status_code=500

        ) from exc


    except RateLimitError as exc:

        logger.warning(
            "AI rate limit reached."
        )


        raise AIServiceError(

            "The AI service is temporarily rate limited.",

            code="ai_rate_limit",

            status_code=503

        ) from exc


    except APITimeoutError as exc:

        logger.warning(
            "AI request timed out."
        )


        raise AIServiceError(

            "The AI service took too long to respond.",

            code="ai_timeout",

            status_code=504

        ) from exc


    except APIConnectionError as exc:

        logger.exception(
            "Could not connect to the AI endpoint."
        )


        raise AIServiceError(

            "The AI service could not be reached.",

            code="ai_connection_error",

            status_code=503

        ) from exc


    except APIStatusError as exc:

        provider_status = getattr(
            exc,
            "status_code",
            None
        )


        request_id = getattr(
            exc,
            "request_id",
            None
        )


        response_body = getattr(
            exc,
            "body",
            None
        )


        logger.exception(

            "AI endpoint returned an API error. "
            "status=%s request_id=%s body=%r",

            provider_status,

            request_id,

            response_body
        )


        raise AIServiceError(

            "The AI provider rejected or failed the request.",

            code="ai_api_error",

            status_code=502

        ) from exc


    except APIError as exc:

        logger.exception(
            "OpenAI-compatible SDK error."
        )


        raise AIServiceError(

            "The AI provider returned an unexpected error.",

            code="ai_sdk_error",

            status_code=502

        ) from exc


    except Exception as exc:

        logger.exception(
            "Unexpected error during AI response creation."
        )


        raise AIServiceError(

            "An unexpected AI service error occurred.",

            code="ai_unexpected_error",

            status_code=500

        ) from exc


# ==================================================
# RESPONSE ATTRIBUTE HELPER
# ==================================================

def _get_value(
        value: Any,
        key: str,
        default: Any = None,
) -> Any:

    if isinstance(
            value,
            dict
    ):

        return value.get(
            key,
            default
        )


    return getattr(
        value,
        key,
        default
    )


# ==================================================
# OUTPUT TEXT EXTRACTION
# ==================================================

def extract_output_text(
        response: Any
) -> str:
    """
    Extract assistant text from an OpenAI-compatible
    Chat Completions response.
    """

    if response is None:

        raise AIServiceError(

            "The AI service returned no response.",

            code="ai_response_missing",

            status_code=502
        )


    choices = _get_value(

        response,

        "choices",

        []
    )


    if (
            not isinstance(
                choices,
                list
            )
            or
            not choices
    ):

        raise AIServiceError(

            "The AI response contained no choices.",

            code="ai_choices_missing",

            status_code=502
        )


    first_choice = choices[
        0
    ]


    finish_reason = _get_value(

        first_choice,

        "finish_reason"
    )


    if finish_reason == "length":

        raise AIServiceError(

            "The AI response was incomplete because it reached the token limit.",

            code="ai_incomplete_response",

            status_code=502
        )


    message = _get_value(

        first_choice,

        "message"
    )


    if message is None:

        raise AIServiceError(

            "The AI response contained no assistant message.",

            code="ai_message_missing",

            status_code=502
        )


    refusal = _get_value(

        message,

        "refusal"
    )


    if (
            isinstance(
                refusal,
                str
            )
            and
            refusal.strip()
    ):

        logger.warning(

            "AI response was refused. refusal=%s",

            refusal
        )


        raise AIServiceError(

            "The AI provider refused the requested generation.",

            code="ai_refusal",

            status_code=502
        )


    content = _get_value(

        message,

        "content"
    )


    if (
            isinstance(
                content,
                str
            )
            and
            content.strip()
    ):

        return content.strip()


    raise AIServiceError(

        "The AI response contained no output text.",

        code="ai_output_text_missing",

        status_code=502
    )

