#!/usr/bin/env python3

from __future__ import annotations


import json
import os
import sys

from pathlib import Path


# ==================================================
# DJANGO BOOTSTRAP
# ==================================================

BASE_DIR = (
    Path(
        __file__
    )
    .resolve()
    .parent
)


if str(
        BASE_DIR
) not in sys.path:

    sys.path.insert(
        0,
        str(
            BASE_DIR
        )
    )


os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings"
)


import django


django.setup()


# ==================================================
# IMPORTS AFTER DJANGO SETUP
# ==================================================

from chamber.services.ai_service import (
    AIServiceError,
    create_response,
    extract_output_text,
)


from chamber.services.gpt_debate_engine import (
    CHARACTER_RESPONSE_SCHEMA,
)


# ==================================================
# TEST PROMPT
# ==================================================

TEST_INSTRUCTIONS = """
You are Rika, an energetic analytical council member in Gosei.

Speak like a lively, evidence-obsessed data gremlin.
You become sharply precise when an assumption is unsupported.

Ground every claim only in the information supplied by the user.
Do not invent studies, teams, sectors, probabilities, metrics, experiments,
or external facts.

This is opening round 1.

Return only the requested structured result.
""".strip()


TEST_INPUT = [

    {
        "role":
            "user",

        "content":
            (
                "The user says: "
                "\"I want to launch Gosei immediately instead of spending "
                "another week polishing it.\" "
                "No launch metrics, user research, reliability data, or "
                "conversion data have been supplied. "
                "Give your opening position and explicitly identify unsupported "
                "assumptions rather than inventing evidence."
            ),
    }
]


# ==================================================
# RUN
# ==================================================

def main() -> int:

    print(
        "AI_BASE_URL:",
        os.getenv(
            "AI_BASE_URL",
            "http://127.0.0.1:8001/v1"
        )
    )


    print(
        "AI_MODEL:",
        os.getenv(
            "AI_MODEL",
            "gosei-gemma"
        )
    )


    print(
        "Schema:",
        "CHARACTER_RESPONSE_SCHEMA"
    )


    try:

        response = create_response(

            instructions=(
                TEST_INSTRUCTIONS
            ),

            input_data=(
                TEST_INPUT
            ),

            text_config={

                "format": {

                    "type":
                        "json_schema",

                    "name":
                        "gosei_character_response",

                    "strict":
                        True,

                    "schema":
                        CHARACTER_RESPONSE_SCHEMA,
                }
            },

            max_output_tokens=2200,

            metadata={

                "action":
                    "schema_contract_test",

                "round":
                    "1",
            }
        )


        output_text = (
            extract_output_text(
                response
            )
        )


    except AIServiceError as exc:

        print(
            "\nAI SERVICE ERROR"
        )


        print(
            "code:",
            exc.code
        )


        print(
            "status:",
            exc.status_code
        )


        print(
            "message:",
            str(
                exc
            )
        )


        return 1


    try:

        parsed = json.loads(
            output_text
        )


    except json.JSONDecodeError as exc:

        print(
            "\nINVALID JSON"
        )


        print(
            output_text
        )


        print(
            "\nParser error:",
            exc
        )


        return 1


    # ----------------------------------------------
    # BASIC CONTRACT ASSERTIONS
    # ----------------------------------------------

    required_top_level = {

        "content",
        "messageType",
        "emotion",
        "animation",
        "characterState",
    }


    missing_top_level = (

            required_top_level
            -
            set(
                parsed
            )
    )


    if missing_top_level:

        print(
            "\nCONTRACT FAILURE"
        )


        print(
            "Missing top-level fields:",
            sorted(
                missing_top_level
            )
        )


        return 1


    character_state = parsed.get(
        "characterState"
    )


    if not isinstance(
            character_state,
            dict
    ):

        print(
            "\nCONTRACT FAILURE"
        )


        print(
            "characterState is not an object."
        )


        return 1


    confidence = character_state.get(
        "confidence"
    )


    if not isinstance(
            confidence,
            dict
    ):

        print(
            "\nCONTRACT FAILURE"
        )


        print(
            "confidence is not an object."
        )


        return 1


    history = confidence.get(
        "history"
    )


    if not isinstance(
            history,
            list
    ):

        print(
            "\nCONTRACT FAILURE"
        )


        print(
            "confidence.history is not an array."
        )


        return 1


    future_rounds = [

        item

        for item
        in history

        if (
                isinstance(
                    item,
                    dict
                )
                and
                isinstance(
                    item.get(
                        "round"
                    ),
                    int
                )
                and
                item[
                    "round"
                ]
                >
                1
        )
    ]


    print(
        "\nRAW STRUCTURED OUTPUT"
    )


    print(
        json.dumps(

            parsed,

            ensure_ascii=False,

            indent=2
        )
    )


    print(
        "\nCONTRACT RESULT"
    )


    print(
        "JSON parse:",
        "PASS"
    )


    print(
        "Top-level shape:",
        "PASS"
    )


    print(
        "Character state:",
        "PASS"
    )


    print(
        "Confidence history shape:",
        "PASS"
    )


    if future_rounds:

        print(
            "Model invented future confidence rounds:",
            "YES"
        )


        print(
            "Backend guard will remove:",
            json.dumps(
                future_rounds,
                ensure_ascii=False
            )
        )


    else:

        print(
            "Model invented future confidence rounds:",
            "NO"
        )


    print(
        "\nPRODUCTION CHARACTER SCHEMA TEST: PASS"
    )


    return 0


if __name__ == "__main__":

    raise SystemExit(
        main()
    )

