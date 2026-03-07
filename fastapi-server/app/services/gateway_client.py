from typing import Any, Dict, List
import asyncio
import random

import httpx

from app.config import get_settings

settings = get_settings()


def _headers() -> Dict[str, str]:
    h: Dict[str, str] = {"Content-Type": "application/json"}
    if settings.api_gateway_key:
        h["x-api-key"] = settings.api_gateway_key
    return h


def _url(path: str) -> str:
    return settings.api_gateway_url.rstrip("/") + path


# ── Chat ───────────────────────────────────────────────────────────────────────


async def call_chat(session_id: str, message: str, conversation_id: str) -> Dict[str, Any]:
    """
    POST /chat → retail-chatbot-backend Lambda → Bedrock Agent.
    Returns: { response, sessionId, ... }
    Implements exponential backoff with jitter, max 3 retries.
    Only retries on 5xx, timeouts, and connection errors.
    """
    max_retries = 3
    base_delay = 1  # seconds
    
    async with httpx.AsyncClient(timeout=settings.http_timeout) as client:
        for attempt in range(max_retries + 1):
            try:
                resp = await client.post(
                    _url("/query"),
                    headers=_headers(),
                    json={"query": message, "session_id": session_id, "conversation_id": conversation_id},
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as exc:
                # Don't retry on 4xx client errors
                if 400 <= exc.response.status_code < 500:
                    raise
                # Retry on 5xx server errors
                if attempt >= max_retries:
                    raise
                wait_time = (base_delay * (2 ** attempt)) + random.uniform(0, 1)
                print(f"[gateway] call_chat attempt {attempt + 1} got {exc.response.status_code}. Retrying in {wait_time:.2f}s...")
                await asyncio.sleep(wait_time)
            except (httpx.TimeoutException, httpx.ConnectError) as exc:
                # Retry on timeouts and connection errors
                if attempt >= max_retries:
                    raise
                wait_time = (base_delay * (2 ** attempt)) + random.uniform(0, 1)
                print(f"[gateway] call_chat attempt {attempt + 1} failed: {type(exc).__name__}. Retrying in {wait_time:.2f}s...")
                await asyncio.sleep(wait_time)
            except Exception as exc:
                # Don't retry on other unexpected errors
                raise


# ── History ────────────────────────────────────────────────────────────────────


async def get_history(session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    GET /history?session_id=xxx → retail-history-manager Lambda → DynamoDB.
    Returns list of { role, content } dicts, oldest first.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            _url("/history"),
            headers=_headers(),
            params={"session_id": session_id, "limit": limit},
        )
        resp.raise_for_status()
        return resp.json().get("messages", [])


async def save_message(session_id: str, role: str, content: str) -> None:
    """
    POST /history → retail-history-manager Lambda → DynamoDB.
    Fire-and-forget style — errors are logged but not raised.
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                _url("/history"),
                headers=_headers(),
                json={"session_id": session_id, "role": role, "content": content},
            )
    except Exception as exc:  # noqa: BLE001
        print(f"[gateway] history save failed: {exc}")


# ── Dashboard ─────────────────────────────────────────────────────────────────


async def call_dashboard(
    session_id: str,
    message: str,
    filters: Dict[str, Any],
) -> Dict[str, Any]:
    """
    POST /dashboard → retail-generate-dashboard Lambda → Athena (parallel).
    Returns: { dashboard_data, active_filters }
    """
    async with httpx.AsyncClient(timeout=settings.http_timeout) as client:
        resp = await client.post(
            _url("/dashboard"),
            headers=_headers(),
            json={"message": message, "sessionId": session_id, "filters": filters},
        )
        resp.raise_for_status()
        return resp.json()


async def execute_sql_query(sql_query: str) -> Dict[str, Any]:
    """
    POST /executeSqlQuery → Execute SQL query via AI API.
    Returns: { statusCode, body: stringified JSON with success, data, row_count }
    """
    # Use the SQL-specific API Gateway URL
    sql_api_url = settings.sql_api_gateway_url.rstrip("/") + "/executeSqlQuery"
    
    async with httpx.AsyncClient(timeout=settings.http_timeout) as client:
        resp = await client.post(
            sql_api_url,
            headers=_headers(),
            json={"query": sql_query},
        )
        resp.raise_for_status()
        return resp.json()


