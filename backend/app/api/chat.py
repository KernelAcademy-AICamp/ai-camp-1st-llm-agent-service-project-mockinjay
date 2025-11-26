"""
Chat API Router - Proxy to Parlant Server
Routes all /api/chat requests to the Parlant agent server
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
import httpx
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Parlant server configuration
PARLANT_HOST = os.getenv("PARLANT_HOST", "127.0.0.1")
PARLANT_PORT = int(os.getenv("PARLANT_PORT", "8800"))
PARLANT_BASE_URL = f"http://{PARLANT_HOST}:{PARLANT_PORT}"

# HTTP client for proxying
client = httpx.AsyncClient(timeout=30.0)


async def close_parlant_server():
    """Close the HTTP client on shutdown"""
    await client.aclose()
    logger.info("Parlant proxy client closed")


@router.get("/info")
async def chat_info():
    """
    Get chat service information
    """
    return {
        "service": "Chat API (Parlant Proxy)",
        "parlant_server": PARLANT_BASE_URL,
        "status": "proxying"
    }


from app.core.context_system import context_system
import json
import asyncio

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_to_parlant(path: str, request: Request):
    """
    Proxy all requests to the Parlant server with Context Engineering
    """
    try:
        # Build target URL
        url = f"{PARLANT_BASE_URL}/{path}"
        if request.url.query:
            url = f"{url}?{request.url.query}"

        # Prepare headers (exclude host and content-length)
        headers = {
            key: value
            for key, value in request.headers.items()
            if key.lower() not in ["host", "content-length"]
        }

        # Get request body
        body = await request.body()
        
        # --- Context Engineering: Injection ---
        user_id = None
        session_id = None
        query = None
        
        if request.method == "POST":
            try:
                # Try to parse body as JSON to inject context
                body_json = json.loads(body)
                session_id = body_json.get("session_id")
                query = body_json.get("query") or body_json.get("message")
                
                if session_id and query:
                    session = context_system.session_manager.get_session(session_id)
                    if session:
                        user_id = session.get("user_id")
                        if user_id:
                            # 1. Get Context
                            user_context = await context_system.context_engineer.get_user_context(user_id)
                            
                            # 2. Inject Context
                            if user_context.get("summary") or user_context.get("keywords"):
                                # Add to 'context' field which agents should respect
                                if "context" not in body_json:
                                    body_json["context"] = {}
                                
                                # Add user history context
                                body_json["context"]["user_history"] = user_context
                                
                                # Re-serialize body
                                body = json.dumps(body_json).encode("utf-8")
                                # Update content-length header
                                headers["content-length"] = str(len(body))
                                logger.info(f"✅ Injected context for user {user_id}")
            except Exception as e:
                logger.warning(f"Context injection failed: {e}")

        logger.info(f"Proxying {request.method} {url}")

        # Forward request to Parlant server
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
        )

        # --- Context Engineering: Recording ---
        try:
            if session_id and query and response.status_code == 200 and user_id:
                resp_json = response.json()
                # Try to find the answer in various common fields
                agent_response = resp_json.get("answer") or resp_json.get("response") or resp_json.get("result", {}).get("response")
                agent_type = resp_json.get("agent_type", "unknown")
                
                if agent_response:
                    # Save to DB
                    await context_system.context_engineer.db_manager.save_conversation(
                        user_id, session_id, agent_type, query, agent_response
                    )
                    # Trigger analysis (fire and forget)
                    asyncio.create_task(context_system.context_engineer.analyze_and_update_context(user_id))
                    logger.info(f"✅ Saved conversation and triggered analysis for user {user_id}")
        except Exception as e:
            logger.warning(f"History saving failed: {e}")

        # Return response with proper content handling
        content_type = response.headers.get("content-type", "")

        if "application/json" in content_type:
            try:
                return JSONResponse(
                    content=response.json(),
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )
            except:
                pass

        # Return text response
        return JSONResponse(
            content={"response": response.text},
            status_code=response.status_code,
            headers=dict(response.headers)
        )

    except httpx.ConnectError:
        logger.error(f"Cannot connect to Parlant server at {PARLANT_BASE_URL}")
        raise HTTPException(
            status_code=503,
            detail=f"Parlant server unavailable at {PARLANT_BASE_URL}. Please ensure the Parlant server is running."
        )
    except httpx.TimeoutException:
        logger.error(f"Timeout connecting to Parlant server")
        raise HTTPException(
            status_code=504,
            detail="Parlant server timeout"
        )
    except Exception as e:
        logger.error(f"Proxy error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Proxy error: {str(e)}"
        )
