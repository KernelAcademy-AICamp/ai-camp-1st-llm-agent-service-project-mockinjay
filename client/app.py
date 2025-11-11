"""
CareGuide Client Application
Flask-based web interface for CareGuide Healthcare Chatbot
"""
import os
import uuid
import logging
from functools import lru_cache
from typing import Any, Dict, List, Optional

from flask import Flask, jsonify, render_template, request, session, Response, stream_with_context
from flask_cors import CORS
import json
import time

from parlant_client import ParlantClient, ParlantConfig

# ==================== Configuration ====================

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "careguide-secret-key-2024")
CORS(app)

# Parlant configuration
PARLANT_AGENT_NAME = os.getenv("PARLANT_AGENT_NAME", "CareGuide_v2")
DEFAULT_PROFILE = os.getenv("CARE_GUIDE_DEFAULT_PROFILE", "general")

# Logging setup
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG for troubleshooting
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Silence noisy loggers
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('werkzeug').setLevel(logging.INFO)

# Server instance identification
# This ID changes on every server restart, ensuring fresh sessions
SERVER_START_ID = str(uuid.uuid4())[:8]
SERVER_START_TIME = time.time()

# In-memory user session storage
# Maps user_id -> {"session_id": str, "last_offset": int, "profile": str}
user_sessions: Dict[str, Dict[str, Any]] = {}


# ==================== Helper Functions ====================

def get_parlant_client() -> ParlantClient:
    """Get a Parlant client instance"""
    return ParlantClient(ParlantConfig.from_env())


@lru_cache(maxsize=1)
def resolve_agent_id() -> str:
    """
    Resolve the Parlant agent ID via configuration or discovery

    Returns:
        The agent ID string
    """
    agent_id = os.getenv("PARLANT_AGENT_ID")
    if agent_id:
        logger.info("Using configured agent ID: %s", agent_id)
        return agent_id

    # Discover agent by name
    logger.info("Resolving agent ID for agent named '%s'", PARLANT_AGENT_NAME)
    with get_parlant_client() as client:
        agent = client.get_agent_by_name(PARLANT_AGENT_NAME)
        if agent:
            agent_id = agent["id"]
            logger.info("Discovered agent ID: %s", agent_id)
            return agent_id

    raise RuntimeError(
        f"No Parlant agent named '{PARLANT_AGENT_NAME}' was found. "
        "Set PARLANT_AGENT_ID to the agent identifier to bypass discovery."
    )


def get_or_create_user_state(user_id: str) -> Dict[str, Any]:
    """
    Get or create user state

    The user_id is combined with SERVER_START_ID to ensure that
    each server restart creates completely new sessions with fresh
    guest customers in Parlant.

    Returns:
        Dictionary with session_id, last_offset, profile
    """
    # Create unique key combining user_id with server start ID
    # This ensures server restart = new session = new guest customer
    unique_key = f"{user_id}_{SERVER_START_ID}"

    return user_sessions.setdefault(
        unique_key,
        {
            "session_id": None,
            "last_offset": 0,
            "profile": DEFAULT_PROFILE,
        },
    )


def create_parlant_session(profile: Optional[str] = None) -> str:
    """
    Create a Parlant session

    Args:
        profile: User profile (researcher/patient/general)

    Returns:
        Session ID
    """
    metadata = {}
    if profile:
        metadata["careguide_profile"] = profile

    with get_parlant_client() as client:
        session_data = client.create_session(
            agent_id=resolve_agent_id(),
            metadata=metadata,
            allow_greeting=False
        )

    session_id = session_data.get("id")
    if not session_id:
        raise RuntimeError("Parlant session creation response is missing an 'id' field.")

    logger.info("Created Parlant session: %s", session_id)
    return session_id


def update_session_profile(session_id: str, profile: str) -> None:
    """
    Update session profile metadata

    Args:
        session_id: The Parlant session ID
        profile: New profile value
    """
    with get_parlant_client() as client:
        client.update_session(
            session_id=session_id,
            metadata={"set": {"careguide_profile": profile}}
        )


def extract_assistant_messages(events: List[Dict[str, Any]]) -> List[str]:
    """
    Extract assistant messages from events

    Args:
        events: List of event dicts

    Returns:
        List of message strings
    """
    messages = []

    for event in events:
        # Log event for debugging
        logger.debug(
            "Processing event: kind=%s, source=%s, offset=%s",
            event.get("kind"),
            event.get("source"),
            event.get("offset")
        )

        if event.get("kind") != "message":
            continue

        # Accept various source types for assistant messages
        source = event.get("source", "")
        if source not in {"ai_agent", "human_agent_on_behalf_of_ai_agent", "agent"}:
            # Skip customer messages
            if source in {"customer", "human"}:
                continue
            # Log unknown sources for debugging
            logger.warning("Unknown message source: %s", source)

        payload = event.get("data")

        # Extract message text - try multiple paths
        message_text = None

        if isinstance(payload, dict):
            # Try common field names
            message_text = (
                payload.get("message") or
                payload.get("text") or
                payload.get("content") or
                payload.get("utterance") or
                payload.get("response")
            )

            # If nested, dig deeper
            if isinstance(message_text, dict):
                message_text = (
                    message_text.get("text") or
                    message_text.get("content") or
                    message_text.get("message")
                )

        elif isinstance(payload, str):
            message_text = payload

        if message_text and isinstance(message_text, str) and message_text.strip():
            logger.info("Extracted message: %s...", message_text[:50])
            messages.append(message_text.strip())
        else:
            logger.debug("No message text found in event data: %s", payload)

    return messages


def extract_paper_results(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extract paper/research results from tool events

    Args:
        events: List of event dicts

    Returns:
        List of paper dicts
    """
    papers = []
    seen = set()

    for event in events:
        if event.get("kind") != "tool":
            continue

        result = event.get("result") or {}
        data = result.get("data")

        if isinstance(data, dict):
            # Check for pubmed_results
            pubmed_results = data.get("raw_results", {}).get("pubmed_results", [])
            if pubmed_results:
                for item in pubmed_results:
                    if not isinstance(item, dict):
                        continue

                    title = item.get("title")
                    doi = item.get("doi")

                    if not isinstance(title, str):
                        continue

                    key = (title, doi if isinstance(doi, str) else None)

                    if key in seen:
                        continue

                    seen.add(key)
                    papers.append(item)

    return papers


def collect_agent_updates(
    user_state: Dict[str, Any],
    max_attempts: int = 3,
    wait_for_data: int = 30
) -> tuple[List[str], List[Dict[str, Any]]]:
    """
    Poll for agent responses

    Args:
        user_state: User state dict
        max_attempts: Maximum polling attempts
        wait_for_data: Seconds to wait per attempt

    Returns:
        (messages, papers)
    """
    messages = []
    papers = []
    session_id = user_state["session_id"]

    with get_parlant_client() as client:
        for attempt in range(max_attempts):
            events = client.list_events(
                session_id=session_id,
                min_offset=user_state["last_offset"],
                wait_for_data=wait_for_data,
                kinds="message,status,tool"
            )

            if events:
                # Update offset
                user_state["last_offset"] = max(
                    event.get("offset", -1) for event in events
                ) + 1

            # Extract messages and papers
            messages.extend(extract_assistant_messages(events))

            for paper in extract_paper_results(events):
                if paper not in papers:
                    papers.append(paper)

            # If we have messages, break
            if messages:
                break

            # If no events, continue polling
            if not events:
                continue

    return messages, papers


# ==================== Routes ====================

@app.route("/")
def index():
    """Render the landing page"""
    return render_template("index.html")


@app.route("/chat")
def chat():
    """Render the chat page"""
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())

    get_or_create_user_state(session["user_id"])
    return render_template("chat.html")


@app.route("/api/message", methods=["POST"])
def process_message():
    """
    Process user message and send to Parlant (non-blocking)

    Request JSON:
        {
            "message": "user message text"
        }

    Response JSON:
        {
            "status": "sent",
            "message": "메시지가 전송되었습니다."
        }
    """
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        data = {}

    user_input = (data.get("message") or "").strip()

    if not user_input:
        return jsonify({
            "status": "error",
            "message": "메시지가 비어 있습니다. 질문을 입력해 주세요.",
        }), 400

    # Get or create user session
    user_id = session.get("user_id")
    if not user_id:
        user_id = str(uuid.uuid4())
        session["user_id"] = user_id

    user_state = get_or_create_user_state(user_id)

    try:
        # Create Parlant session if needed
        if not user_state["session_id"]:
            user_state["session_id"] = create_parlant_session(user_state.get("profile"))
            user_state["last_offset"] = 0

        # Send customer message (non-blocking)
        with get_parlant_client() as client:
            client.post_customer_message(
                session_id=user_state["session_id"],
                message=user_input
            )

        return jsonify({
            "status": "sent",
            "message": "메시지가 전송되었습니다.",
            "session_id": user_state["session_id"]
        })

    except Exception as exc:
        logger.exception("Error processing message")
        return jsonify({
            "status": "error",
            "message": "오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            "detail": str(exc),
        }), 500


@app.route("/api/poll", methods=["GET"])
def poll_messages():
    """
    Poll for new messages from the assistant

    Query Parameters:
        wait: Wait time in seconds (default: 10)

    Response JSON:
        {
            "status": "ok",
            "messages": ["message1", "message2"],
            "papers": [...],
            "has_more": false
        }
    """
    user_id = session.get("user_id")
    if not user_id:
        logger.warning("Poll request with no user_id")
        return jsonify({
            "status": "no_session",
            "messages": [],
            "papers": [],
            "has_more": False
        })

    user_state = get_or_create_user_state(user_id)

    if not user_state.get("session_id"):
        logger.warning("Poll request with no Parlant session_id")
        return jsonify({
            "status": "no_parlant_session",
            "messages": [],
            "papers": [],
            "has_more": False
        })

    try:
        wait_time = int(request.args.get("wait", "10"))
        wait_time = min(wait_time, 30)  # Cap at 30 seconds

        logger.info(
            "Polling session %s from offset %d (wait=%ds)",
            user_state["session_id"],
            user_state["last_offset"],
            wait_time
        )

        # Poll for new events
        with get_parlant_client() as client:
            events = client.list_events(
                session_id=user_state["session_id"],
                min_offset=user_state["last_offset"],
                wait_for_data=wait_time,
                kinds="message,status,tool"
            )

        logger.info("Received %d events", len(events))

        # Log all events for debugging
        if events:
            for event in events:
                logger.debug("Event detail: %s", event)

        if events:
            # Update offset
            new_offset = max(event.get("offset", -1) for event in events) + 1
            logger.info("Updating offset from %d to %d", user_state["last_offset"], new_offset)
            user_state["last_offset"] = new_offset

        # Extract messages and papers
        messages = extract_assistant_messages(events)
        papers = extract_paper_results(events)

        logger.info("Extracted %d messages and %d papers", len(messages), len(papers))

        return jsonify({
            "status": "ok",
            "messages": messages,
            "papers": papers,
            "has_more": len(messages) > 0  # Suggest polling again if we got messages
        })

    except Exception as exc:
        logger.exception("Error polling messages")
        return jsonify({
            "status": "error",
            "messages": [],
            "papers": [],
            "has_more": False,
            "error": str(exc)
        }), 500


@app.route("/api/stream")
def stream_messages():
    """
    Server-Sent Events (SSE) endpoint for real-time message streaming

    This replaces polling with a persistent connection that pushes
    messages to the client as soon as they're available.

    The stream will:
    1. Wait for new events from Parlant
    2. Extract and send messages immediately
    3. Continue until client disconnects or max time reached
    """
    user_id = session.get("user_id")
    if not user_id:
        # Send error event and close
        def error_gen():
            yield f"event: error\ndata: {json.dumps({'error': 'No session'})}\n\n"
        return Response(error_gen(), mimetype='text/event-stream')

    user_state = get_or_create_user_state(user_id)

    if not user_state.get("session_id"):
        def error_gen():
            yield f"event: error\ndata: {json.dumps({'error': 'No Parlant session'})}\n\n"
        return Response(error_gen(), mimetype='text/event-stream')

    def generate():
        """Generator function for SSE stream"""
        session_id = user_state["session_id"]
        last_offset = user_state["last_offset"]
        max_attempts = 30  # Increased from 20 to 30 (7.5 minutes total)
        attempt = 0
        total_messages_sent = 0  # Track total messages sent

        logger.info("Starting SSE stream for session %s", session_id)

        # Send initial connection event
        yield f"event: connected\ndata: {json.dumps({'status': 'connected'})}\n\n"

        try:
            with get_parlant_client() as client:
                while attempt < max_attempts:
                    attempt += 1

                    logger.debug("SSE attempt %d/%d (offset=%d, total_messages=%d)",
                                attempt, max_attempts, last_offset, total_messages_sent)

                    # Fetch new events with long polling
                    events = client.list_events(
                        session_id=session_id,
                        min_offset=last_offset,
                        wait_for_data=15,  # Increased from 10 to 15 seconds
                        kinds="message,status,tool"
                    )

                    if events:
                        logger.debug("SSE received %d events", len(events))

                        # Update offset
                        last_offset = max(event.get("offset", -1) for event in events) + 1
                        user_state["last_offset"] = last_offset

                        # Extract messages
                        messages = extract_assistant_messages(events)
                        papers = extract_paper_results(events)

                        # Send messages
                        if messages:
                            for message in messages:
                                data = json.dumps({
                                    'type': 'message',
                                    'message': message
                                })
                                yield f"event: message\ndata: {data}\n\n"
                                total_messages_sent += 1
                                logger.info("SSE sent message #%d: %s...", total_messages_sent, message[:50])

                        # Send papers
                        if papers:
                            data = json.dumps({
                                'type': 'papers',
                                'papers': papers
                            })
                            yield f"event: papers\ndata: {data}\n\n"
                            logger.info("SSE sent %d papers", len(papers))

                        # Check if agent has finished (look for completion status)
                        agent_finished = False
                        for event in events:
                            if event.get("kind") == "status":
                                status_data = event.get("data", {})
                                # Check various completion indicators
                                if (status_data.get("status") == "completed" or
                                    status_data.get("state") == "completed" or
                                    status_data.get("finished") is True):
                                    agent_finished = True
                                    logger.info("Agent completion status detected")
                                    break

                        # Determine if we should complete the stream
                        should_complete = False

                        if agent_finished:
                            # Agent explicitly finished
                            logger.info("Agent finished status detected, completing SSE stream")
                            should_complete = True
                        elif total_messages_sent >= 2:
                            # We have at least 2 messages total (disclaimer + actual response)
                            logger.info("Received %d messages total, completing SSE stream", total_messages_sent)
                            should_complete = True
                        elif total_messages_sent == 1:
                            # Only one message so far - likely just disclaimer
                            # Keep waiting for the actual response
                            logger.debug("Only 1 message received so far (likely disclaimer), continuing...")

                        if should_complete:
                            yield f"event: complete\ndata: {json.dumps({'status': 'complete'})}\n\n"
                            break

                    # Small delay before next check
                    time.sleep(1)

                # Max attempts reached
                if attempt >= max_attempts:
                    logger.warning("SSE max attempts reached")
                    yield f"event: timeout\ndata: {json.dumps({'status': 'timeout'})}\n\n"

        except Exception as e:
            logger.exception("Error in SSE stream")
            error_data = json.dumps({'error': str(e)})
            yield f"event: error\ndata: {error_data}\n\n"

    response = Response(stream_with_context(generate()), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'  # Disable nginx buffering
    return response


@app.route("/api/history", methods=["GET"])
def get_chat_history():
    """
    Get complete chat history for current session

    Returns all messages from the beginning of the session,
    useful for restoring chat after page refresh.

    Response JSON:
        {
            "messages": [
                {"sender": "user", "text": "...", "timestamp": "..."},
                {"sender": "assistant", "text": "...", "timestamp": "..."}
            ],
            "papers": [...],
            "total": 10
        }
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({
            "messages": [],
            "papers": [],
            "total": 0
        })

    user_state = get_or_create_user_state(user_id)

    if not user_state.get("session_id"):
        return jsonify({
            "messages": [],
            "papers": [],
            "total": 0
        })

    try:
        session_id = user_state["session_id"]

        logger.info("Fetching chat history for session %s", session_id)

        # Fetch ALL events from the beginning (offset 0)
        with get_parlant_client() as client:
            all_events = client.list_events(
                session_id=session_id,
                min_offset=0,
                wait_for_data=1,  # Quick fetch
                kinds="message,tool"
            )

        logger.info("Retrieved %d total events", len(all_events))

        # Extract messages with timestamps
        messages = []
        for event in all_events:
            if event.get("kind") != "message":
                continue

            source = event.get("source", "")
            timestamp = event.get("creation_utc", "")

            # Customer messages
            if source in {"customer", "human"}:
                payload = event.get("data", {})
                if isinstance(payload, dict):
                    text = payload.get("message", "")
                    if text:
                        messages.append({
                            "sender": "user",
                            "text": text,
                            "timestamp": timestamp
                        })

            # Assistant messages
            elif source in {"ai_agent", "human_agent_on_behalf_of_ai_agent", "agent"}:
                payload = event.get("data", {})
                message_text = None

                if isinstance(payload, dict):
                    message_text = (
                        payload.get("message") or
                        payload.get("text") or
                        payload.get("content") or
                        payload.get("utterance") or
                        payload.get("response")
                    )

                    if isinstance(message_text, dict):
                        message_text = (
                            message_text.get("text") or
                            message_text.get("content") or
                            message_text.get("message")
                        )

                elif isinstance(payload, str):
                    message_text = payload

                if message_text and isinstance(message_text, str) and message_text.strip():
                    messages.append({
                        "sender": "assistant",
                        "text": message_text.strip(),
                        "timestamp": timestamp
                    })

        # Extract papers
        papers = extract_paper_results(all_events)

        logger.info("Extracted %d messages and %d papers", len(messages), len(papers))

        return jsonify({
            "messages": messages,
            "papers": papers,
            "total": len(messages)
        })

    except Exception as exc:
        logger.exception("Error fetching chat history")
        return jsonify({
            "messages": [],
            "papers": [],
            "total": 0,
            "error": str(exc)
        }), 500


@app.route("/api/pending", methods=["GET"])
def get_pending_messages():
    """
    Check for pending (undelivered) messages

    Query Parameters:
        quick: "true" for fast check (wait=1s)

    Response JSON:
        {
            "messages": [...],
            "papers": [...],
            "has_pending": true/false
        }
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({
            "messages": [],
            "papers": [],
            "has_pending": False
        })

    user_state = get_or_create_user_state(user_id)

    if not user_state.get("session_id"):
        return jsonify({
            "messages": [],
            "papers": [],
            "has_pending": False
        })

    try:
        quick = request.args.get("quick", "false").lower() == "true"
        wait_time = 1 if quick else 5

        logger.debug(
            "Checking pending messages for session %s (offset=%d, quick=%s)",
            user_state["session_id"],
            user_state["last_offset"],
            quick
        )

        # Check for new events
        with get_parlant_client() as client:
            events = client.list_events(
                session_id=user_state["session_id"],
                min_offset=user_state["last_offset"],
                wait_for_data=wait_time,
                kinds="message,tool"
            )

        if events:
            # Update offset
            user_state["last_offset"] = max(
                event.get("offset", -1) for event in events
            ) + 1

        # Extract messages and papers
        messages = extract_assistant_messages(events)
        papers = extract_paper_results(events)

        logger.info("Found %d pending messages", len(messages))

        return jsonify({
            "messages": messages,
            "papers": papers,
            "has_pending": len(messages) > 0
        })

    except Exception as exc:
        logger.exception("Error checking pending messages")
        return jsonify({
            "messages": [],
            "papers": [],
            "has_pending": False,
            "error": str(exc)
        }), 500


@app.route("/api/profile", methods=["POST"])
def set_profile():
    """
    Set user profile

    Request JSON:
        {
            "profile_type": "researcher" | "patient" | "general"
        }

    Response JSON:
        {
            "status": "success",
            "profile": "researcher"
        }
    """
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        data = {}

    profile_type = (data.get("profile_type") or DEFAULT_PROFILE or "general").lower()

    # Get or create user session
    user_id = session.get("user_id")
    if not user_id:
        user_id = str(uuid.uuid4())
        session["user_id"] = user_id

    user_state = get_or_create_user_state(user_id)
    user_state["profile"] = profile_type

    # Update Parlant session if it exists
    session_id = user_state.get("session_id")
    if session_id:
        try:
            update_session_profile(session_id, profile_type)
        except Exception as exc:
            logger.warning("Failed to update session metadata: %s", exc)

    return jsonify({"status": "success", "profile": profile_type})


@app.route("/api/session/reset", methods=["POST"])
def reset_session():
    """
    Reset user session (create new Parlant session)

    Response JSON:
        {
            "status": "success",
            "message": "Session reset successfully"
        }
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"status": "success", "message": "No session to reset"})

    user_state = get_or_create_user_state(user_id)

    # Delete old session if exists
    old_session_id = user_state.get("session_id")
    if old_session_id:
        try:
            with get_parlant_client() as client:
                client.delete_session(old_session_id)
        except Exception as exc:
            logger.warning("Failed to delete old session: %s", exc)

    # Reset state
    user_state["session_id"] = None
    user_state["last_offset"] = 0

    return jsonify({
        "status": "success",
        "message": "세션이 재설정되었습니다."
    })


@app.route("/api/server-info", methods=["GET"])
def get_server_info():
    """
    Get server instance information

    This endpoint returns the current server instance ID, which changes
    on every server restart. Clients can use this to detect server restarts
    and clear their local state accordingly.

    Returns:
        JSON with server_id, start_time, and uptime_seconds
    """
    return jsonify({
        "server_id": SERVER_START_ID,
        "start_time": SERVER_START_TIME,
        "start_time_formatted": time.ctime(SERVER_START_TIME),
        "uptime_seconds": time.time() - SERVER_START_TIME
    })


@app.route("/health")
def health():
    """Health check endpoint"""
    try:
        # Try to connect to Parlant
        with get_parlant_client() as client:
            client.list_agents()
        return jsonify({"status": "healthy", "parlant": "connected"})
    except Exception as exc:
        logger.error("Health check failed: %s", exc)
        return jsonify({"status": "unhealthy", "error": str(exc)}), 503


# ==================== Main ====================

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "8000"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"

    logger.info("="*60)
    logger.info("Starting CareGuide Client")
    logger.info("Server Instance ID: %s", SERVER_START_ID)
    logger.info("Start Time: %s", time.ctime(SERVER_START_TIME))
    logger.info("Port: %d", port)
    logger.info("All new sessions will use fresh guest customers")
    logger.info("="*60)

    app.run(debug=debug, port=port, host="0.0.0.0")
