import json

from fastapi import APIRouter, HTTPException

from app.models.chat import DashboardRequest, DashboardResponse
from app.services import gateway_client as gw
from app.services import intent as intent_svc
from app.services import session as sess_svc

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.post("", response_model=DashboardResponse)
async def dashboard(req: DashboardRequest) -> DashboardResponse:
    session_id = req.session_id

    # Step 1: Load history (needed for filter carry-forward).
    history: list[dict] = []
    try:
        history = await gw.get_history(session_id, limit=10)
    except Exception as exc:  # noqa: BLE001
        print(f"[dashboard] history load failed: {exc}")

    # Step 2: Save user message.
    await gw.save_message(session_id, "user", req.message)

    # Step 3: Extract filters from message and history.
    filters = intent_svc.extract_filters(req.message, history)
    print(f"[dashboard] filters extracted: {filters}")

    # Step 4: Call the dashboard Lambda via API Gateway.
    try:
        lambda_resp = await gw.call_dashboard(session_id, req.message, filters)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Dashboard call failed: {exc}")

    dashboard_data = lambda_resp.get("dashboard_data", {})
    active_filters = dashboard_data.get("active_filters", "Last 30 Days")

    # Step 5: Save a compact summary to history so future turns can
    # carry forward filters and the agent can reference prior dashboards.
    summary = (
        f"[Dashboard shown] dashboard_filters:{json.dumps(filters)} "
        f"active: {active_filters}"
    )
    await gw.save_message(session_id, "assistant", summary)
    sess_svc.mark_warm(session_id)

    return DashboardResponse(
        session_id=session_id,
        active_filters=active_filters,
        dashboard_data=dashboard_data,
    )


