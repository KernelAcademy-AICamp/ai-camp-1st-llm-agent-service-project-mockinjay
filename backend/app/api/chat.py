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
    """
    Close the shared HTTP client used to proxy requests to the Parlant server.
    
    This is intended to be called on application shutdown to gracefully close the module-level AsyncClient and release network resources.
    """
    await client.aclose()
    logger.info("Parlant proxy client closed")


@router.get("/info")
async def chat_info():
    """
    Provide service metadata for the chat proxy.
    
    Returns:
        info (dict): Mapping with keys:
            - "service": human-readable service name,
            - "parlant_server": Parlant base URL,
            - "status": current proxy status ("proxying").
    """
    return {
        "service": "Chat API (Parlant Proxy)",
        "parlant_server": PARLANT_BASE_URL,
        "status": "proxying"
    }


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_to_parlant(path: str, request: Request):
    """
    Proxy incoming requests under /api/chat to the configured Parlant server.
    
    Forwards the incoming request's method, query parameters, body, and headers (excluding Host and Content-Length) to the Parlant server and returns the server's response as a JSONResponse. Raises HTTPException with status 503 if the Parlant server is unreachable, 504 on timeout, or 500 for other proxy errors.
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

        logger.info(f"Proxying {request.method} {url}")

        # Forward request to Parlant server
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
        )

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
                # If JSON parsing fails, return as text
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