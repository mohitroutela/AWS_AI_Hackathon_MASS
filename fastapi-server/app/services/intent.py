from __future__ import annotations

import json
import re
from datetime import datetime, timedelta
from typing import Dict, List

DASHBOARD_KEYWORDS: List[str] = [
    "dashboard",
    "summarize",
    "summary",
    "visualize",
    "visualization",
    "overview",
    "chart",
    "graph",
    "show me",
    "display",
    "metrics",
    "kpi",
    "performance",
    "analytics overview",
    "data overview",
]

CARRY_WORDS: List[str] = ["same", "also", "too", "as well", "for that", "but for"]


def is_dashboard_request(message: str) -> bool:
    msg = message.lower()
    return any(keyword in msg for keyword in DASHBOARD_KEYWORDS)


def extract_filters(message: str, history: List[Dict]) -> Dict:
    msg = message.lower()
    filters: Dict[str, object] = {}
    today = datetime.utcnow().date()

    # ── Date range ─────────────────────────────────────────────────────────────
    if "today" in msg:
        filters["date_from"] = filters["date_to"] = str(today)
    elif any(key in msg for key in ["last week", "past week"]):
        filters["date_from"] = str(today - timedelta(days=7))
        filters["date_to"] = str(today)
    elif any(key in msg for key in ["last month", "past month"]):
        filters["date_from"] = str(today - timedelta(days=30))
        filters["date_to"] = str(today)
    elif any(key in msg for key in ["last year", "past year", "ytd"]):
        filters["date_from"] = f"{today.year}-01-01"
        filters["date_to"] = str(today)
    else:
        for quarter, (start_month, end_month) in {
            "q1": (1, 3),
            "q2": (4, 6),
            "q3": (7, 9),
            "q4": (10, 12),
        }.items():
            if quarter in msg:
                filters["date_from"] = f"{today.year}-{start_month:02d}-01"
                filters["date_to"] = f"{today.year}-{end_month:02d}-28"
                break

    # ── Store ─────────────────────────────────────────────────────────────────
    match = re.search(r"store[s]?\s*[#_]?\s*(\w+)", msg)
    if match:
        filters["store_id"] = match.group(1).upper()

    # ── Category ─────────────────────────────────────────────────────────-----
    for category in [
        "electronics",
        "clothing",
        "food",
        "beverages",
        "furniture",
        "sports",
        "beauty",
        "toys",
        "books",
        "automotive",
    ]:
        if category in msg:
            filters["category"] = category
            break

    # ── Product ─────────────────────────────────────────────────────────------
    match = re.search(
        r"(?:product|item|sku)\s*[#_]?\s*([A-Z0-9-]+)",
        message,
        re.IGNORECASE,
    )
    if match:
        filters["product_id"] = match.group(1).upper()

    # ── Top N ─────────────────────────────────────────────────────────────────
    match = re.search(r"top\s*(\d+)", msg)
    if match:
        filters["top_n"] = int(match.group(1))

    # ── Carry forward from prior dashboard if ambiguous ─────────────────────-
    if any(key in msg for key in CARRY_WORDS):
        prior = _prior_filters(history)
        for key, value in prior.items():
            if key not in filters:
                filters[key] = value

    return filters


def _prior_filters(history: List[Dict]) -> Dict:
    """Extract filters from the most recent dashboard turn in history."""
    for turn in reversed(history):
        if turn.get("role") == "assistant" and "dashboard_filters:" in turn.get(
            "content",
            "",
        ):
            try:
                raw = re.search(
                    r"dashboard_filters:({.*?})",
                    turn["content"],
                )
                if raw:
                    return json.loads(raw.group(1))
            except Exception:  # noqa: BLE001
                pass
    return {}


