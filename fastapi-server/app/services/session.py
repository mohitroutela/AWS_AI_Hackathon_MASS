from typing import Dict

import time

from app.config import get_settings

settings = get_settings()

# In-process dict: session_id → last_used epoch.
_warm: Dict[str, float] = {}


def is_warm(session_id: str) -> bool:
    last = _warm.get(session_id)
    return last is not None and (time.time() - last) < settings.session_ttl_seconds


def mark_warm(session_id: str) -> None:
    _warm[session_id] = time.time()

    # Trim entries older than 2x TTL to prevent unbounded memory growth.
    cutoff = time.time() - settings.session_ttl_seconds * 2
    stale = [key for key, value in _warm.items() if value < cutoff]
    for key in stale:
        del _warm[key]


def build_context_prompt(history: list[dict], message: str) -> str:
    """
    Prepend recent conversation turns to the user message so Bedrock can
    resolve pronouns like 'those products', 'same store', 'that period'.
    Long assistant replies are truncated to limit token overhead.
    """
    if not history:
        return message

    lines: list[str] = []
    for turn in history:
        role = "User" if turn["role"] == "user" else "Assistant"
        content = turn["content"]
        if turn["role"] == "assistant" and len(content) > 400:
            content = content[:400] + " ... [truncated for brevity]"
        lines.append(f"{role}: {content}")

    block = "\n".join(lines)
    return (
        "[Previous conversation — use to resolve references like 'those', "
        "'same', 'that store', 'that period']\n"
        f"{block}\n"
        "[End of context]\n\n"
        f"Current question: {message}"
    )


