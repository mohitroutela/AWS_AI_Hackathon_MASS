from uuid import uuid4
import json
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.models.chat import ChatRequest, ChatResponse, TransformedChatResponse
from app.models.chat_management import ChatDetailsCreate, ChatHistoryCreate, WidgetDetails
from app.services import gateway_client as gw
from app.services import session as sess_svc
from app.services.chat_transformer import chat_transformer
from app.services.chat_details_service import chat_details_service
from app.services.chat_history_service import chat_history_service

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("", response_model=TransformedChatResponse)
async def chat(req: ChatRequest) -> TransformedChatResponse:
    is_new_conversation = not req.conversation_id
    conversation_id = req.conversation_id or str(uuid4())
    session_id = req.session_id

    # Step 1: If new conversation — generate title + insert into `chat` table
    if is_new_conversation:
        try:
            title = req.message[:60]  # TODO: replace with gw.generate_title(req.message)
        except Exception as exc:
            print(f"[chat] title generation failed, using fallback: {exc}")
            title = req.message[:60]

        # try:
        #     await gw.create_conversation(
        #         conversation_id=conversation_id,
        #         title=title,
        #     )  #siddhes to implement
        # except Exception as exc:
        #     print(f"[chat] failed to create conversation record: {exc}")

    # Step 2: Call the chat Lambda via API Gateway
    try:
        lambda_resp = await gw.call_chat(session_id, req.message, conversation_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Bedrock call failed: {exc}")

    response_text = lambda_resp.get("response", "")
    new_session_id = lambda_resp.get("session_id", session_id)  # use rotated session if expired

    # Extract optional SQL query (if present) from the Lambda JSON payload.
    sql_query_for_history = None
    try:
        parsed = json.loads(response_text)
        sql_query_for_history = parsed.get("sql_query")
    except Exception as exc:
        # For purely conversational responses, this may not be JSON or may not contain sql_query.
        print(f"[chat] failed to parse Lambda response for sql_query: {exc}")

    # Step 3: Transform response for frontend consumption
    try:
        transformed_response = chat_transformer.transform_response(
            raw_response=response_text,
            session_id=new_session_id,
            conversation_id=conversation_id,
            context_injected=False
        )
        result = TransformedChatResponse(**transformed_response)
        result.conversation_id = conversation_id
        result.session_id = new_session_id
    except Exception as exc:
        print(f"[chat] transformation failed: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to transform response: {str(exc)}"
        )

    # Step 4: Persist chat details (only for new conversations) and chat history
    # These writes happen after we have a successful Lambda response and transformation.
    try:
        if is_new_conversation:
            # Create chat details with conversation_id as sessionId
            chat_details_dict = {
                "sessionId": conversation_id,  # Use conversation_id as sessionId
                "sessionTitle": title,
                "sessionDescription": "This is a new conversation",
                "userId": req.user_id,
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat()
            }
            # Directly call repository to avoid generating new UUID
            from app.database.chat_details_repository import get_chat_details_repository
            chat_details_repo = get_chat_details_repository()
            chat_details_repo.create_chat_details(chat_details_dict)
            logger.info(f"Chat details created for conversation: {conversation_id}")
    except Exception as exc:
        print(f"[chat] failed to create chat details — non-blocking (continuing): {exc}")

    try:
        widget_details = WidgetDetails(
            widgetId=result.widgetId,
            widgetType=result.widget_type,
            widgetData=result.data,
        )
        chat_history = ChatHistoryCreate(
            sessionId=result.conversation_id,
            prompt=req.message,
            response=response_text,
            sqlQuery=sql_query_for_history,
            widgetDetails=widget_details,
        )
        chat_history_service.create_chat_history(chat_history)
    except Exception as exc:
        print(f"[chat] failed to create chat history — non-blocking (continuing): {exc}")

    # -------------------------------------------------------------------------
    # Step 5: Persist turn to `chatHistory` — TODO: Siddhesh to implement
    # gw.save_turn() should insert one document into the `chatHistory` DynamoDB table
    #
    # Document shape:
    # {
    #     "conversation_id": conversation_id,   # partition key — links to `chat` table
    #     "user_message":    req.message,        # raw user input (never prompt_to_send)
    #     "assistant_response": response_text,   # raw bedrock response
    #     "context_injected": False,             # True in future when history injection is on
    #     "created_at": datetime.utcnow().isoformat()
    # }
    #
    # try:
    #     await gw.save_turn(
    #         conversation_id=conversation_id,
    #         user_message=req.message,
    #         assistant_response=response_text,
    #         context_injected=False
    #     )
    # except Exception as exc:
    #     print(f"[chat] failed to save turn — non-blocking (continuing): {exc}")
    # -------------------------------------------------------------------------

    return result

@router.get("/history/{session_id}")
async def get_chat_history(session_id: str) -> dict:
    """Return the last 50 messages for a session — useful for Streamlit preload."""
    try:
        messages = await gw.get_history(session_id, limit=50)
        return {"session_id": session_id, "messages": messages}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc))


