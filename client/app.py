"""
CareGuide Client Application
Flask-based web interface for CareGuide Healthcare Chatbot
"""
import os
import uuid
import logging
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict
from random import random

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
# Structure: user_id -> profile -> {session_id, last_offset}
user_sessions: Dict[str, Dict[str, Dict[str, Any]]] = {}

# Request deduplication cache
# Maps (session_id, min_offset) -> (timestamp, response)
request_cache: Dict[Tuple[str, int], Tuple[float, List[Any]]] = {}
CACHE_TTL = 2.0  # 2 seconds cache TTL


# ==================== Retry and Backoff Logic ====================

def calculate_retry_delay(retries: int, base_delay: float = 0.5, max_delay: float = 10.0) -> float:
    """
    Calculate exponential backoff delay with jitter (Parlant pattern)

    Args:
        retries: Number of retries so far
        base_delay: Base delay in seconds (default: 0.5s)
        max_delay: Maximum delay in seconds (default: 10s)

    Returns:
        Delay in seconds with jitter applied
    """
    # Exponential backoff: 0.5s → 1s → 2s → 4s → 8s → 10s (capped)
    retry_delay = min(base_delay * pow(2.0, retries), max_delay)

    # Add 25% random jitter to prevent thundering herd
    jitter = retry_delay * (1 - 0.25 * random())

    return jitter


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


def get_or_create_user_state(user_id: str, profile: str) -> Dict[str, Any]:
    """
    Get or create user state for a specific profile

    The user_id is combined with SERVER_START_ID to ensure that
    each server restart creates completely new sessions with fresh
    guest customers in Parlant.

    Args:
        user_id: Unique browser session identifier
        profile: User profile type (researcher, patient, general)

    Returns:
        Dictionary with session_id, last_offset
    """
    # Create unique key combining user_id with server start ID
    # This ensures server restart = new session = new guest customer
    unique_key = f"{user_id}_{SERVER_START_ID}"

    if unique_key not in user_sessions:
        user_sessions[unique_key] = {}

    return user_sessions[unique_key].setdefault(
        profile,
        {
            "session_id": None,
            "last_offset": 0,
        },
    )


def create_parlant_session(profile: Optional[str] = None) -> str:
    """
    Create a Parlant session with customer tag for profile

    Args:
        profile: User profile (researcher/patient/general)

    Returns:
        Session ID
    """
    # Default to general if no profile specified
    if not profile:
        profile = "general"

    with get_parlant_client() as client:
        # 1. Create or get profile tag
        tag_name = f"profile:{profile}"

        # Check if tag exists
        existing_tags = client.list_tags()
        profile_tag = next((t for t in existing_tags if t.get("name") == tag_name), None)

        if not profile_tag:
            logger.info("Creating new profile tag: %s", tag_name)
            profile_tag = client.create_tag(name=tag_name)
        else:
            logger.info("Using existing profile tag: %s", tag_name)

        # 2. Create customer with profile tag
        customer_name = f"user_{uuid.uuid4().hex[:8]}"
        customer = client.create_customer(
            name=customer_name,
            tags=[profile_tag["id"]]
        )
        logger.info("Created customer %s with profile tag: %s", customer["id"], tag_name)

        # 3. Create session with customer and metadata
        # Keep metadata for client-side tracking
        metadata = {"careguide_profile": profile}

        session_data = client.create_session(
            agent_id=resolve_agent_id(),
            customer_id=customer["id"],
            metadata=metadata,
            allow_greeting=False
        )

    session_id = session_data.get("id")
    if not session_id:
        raise RuntimeError("Parlant session creation response is missing an 'id' field.")

    logger.info("Created Parlant session: %s (profile: %s)", session_id, profile)
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


def group_events_by_correlation(events: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Group events by correlation_id (Parlant pattern)

    Args:
        events: List of event dicts

    Returns:
        Dictionary mapping base correlation_id to list of events
    """
    grouped = defaultdict(list)

    for event in events:
        correlation_id = event.get("correlation_id", "")
        # Split by '::' and take first part as base correlation ID
        base_correlation_id = correlation_id.split("::")[0] if correlation_id else "unknown"
        grouped[base_correlation_id].append(event)

    return dict(grouped)


def get_message_status(correlation_group: List[Dict[str, Any]]) -> str:
    """
    Get the latest status from a correlation group

    Args:
        correlation_group: List of events with same correlation_id

    Returns:
        Status string (pending, processing, typing, ready, error)
    """
    # Find the latest status event
    status_events = [e for e in correlation_group if e.get("kind") == "status"]

    if not status_events:
        return "ready"

    # Get the last status event
    last_status = status_events[-1]
    status_data = last_status.get("data", {})

    # Extract status from various possible fields
    status = (
        status_data.get("status") or
        status_data.get("state") or
        status_data.get("stage") or
        "ready"
    )

    return status


def extract_assistant_messages(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extract assistant messages from events with status tracking (Parlant pattern)

    Args:
        events: List of event dicts

    Returns:
        List of message dicts with text and status
    """
    messages = []

    # Group events by correlation_id for status tracking
    correlation_groups = group_events_by_correlation(events)

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
            # Get correlation_id and find status
            correlation_id = event.get("correlation_id", "")
            base_correlation_id = correlation_id.split("::")[0] if correlation_id else "unknown"

            # Get status from correlation group
            correlation_group = correlation_groups.get(base_correlation_id, [])
            status = get_message_status(correlation_group)

            logger.info("Extracted message (status=%s): %s...", status, message_text[:50])

            messages.append({
                "text": message_text.strip(),
                "status": status,
                "correlation_id": correlation_id
            })
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
    wait_for_data: int = 30,
    use_exponential_backoff: bool = False
) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Poll for agent responses with improved error handling

    Args:
        user_state: User state dict
        max_attempts: Maximum polling attempts
        wait_for_data: Seconds to wait per attempt
        use_exponential_backoff: Use exponential backoff on failures

    Returns:
        (messages, papers) - messages are now dicts with text and status
    """
    messages = []
    papers = []
    session_id = user_state["session_id"]
    error_count = 0

    with get_parlant_client() as client:
        for attempt in range(max_attempts):
            try:
                # Check cache first (request deduplication)
                cache_key = (session_id, user_state["last_offset"])
                now = time.time()

                if cache_key in request_cache:
                    cached_time, cached_events = request_cache[cache_key]
                    if now - cached_time < CACHE_TTL:
                        logger.debug("Using cached events for session %s", session_id)
                        events = cached_events
                    else:
                        # Cache expired, remove
                        del request_cache[cache_key]
                        events = None
                else:
                    events = None

                if events is None:
                    # Fetch new events with long polling
                    events = client.list_events(
                        session_id=session_id,
                        min_offset=user_state["last_offset"],
                        wait_for_data=wait_for_data,
                        kinds="message,status,tool"
                    )

                    # Cache the response
                    request_cache[cache_key] = (now, events)

                if events:
                    # Update offset
                    user_state["last_offset"] = max(
                        event.get("offset", -1) for event in events
                    ) + 1

                    # Reset error count on success
                    error_count = 0

                # Extract messages with status (Parlant pattern)
                new_messages = extract_assistant_messages(events)
                messages.extend(new_messages)

                # Extract papers
                for paper in extract_paper_results(events):
                    if paper not in papers:
                        papers.append(paper)

                # If we have messages, break
                if messages:
                    break

                # If no events, continue polling
                if not events:
                    continue

            except Exception as exc:
                error_count += 1
                logger.error("Error polling events (attempt %d/%d): %s", attempt + 1, max_attempts, exc)

                # Use exponential backoff if enabled
                if use_exponential_backoff and error_count > 0:
                    delay = calculate_retry_delay(error_count - 1)
                    logger.info("Backing off for %.2fs before retry", delay)
                    time.sleep(delay)

                # Continue to next attempt
                continue

    return messages, papers


# ==================== Routes ====================

@app.route("/")
def index():
    """Render the landing page"""
    return render_template("index.html")


@app.route("/chat")
def chat():
    """Render the chat page and initialise a browser session."""
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())

    # Initialize default profile state (but don't create Parlant session yet)
    profile = request.args.get("profile", DEFAULT_PROFILE)
    get_or_create_user_state(session["user_id"], profile)
    return render_template("chat.html", initial_profile=profile)


@app.route("/api/rooms/create", methods=["POST"])
def create_chat_room():
    """Create a new chat room with specified profile."""
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        data = {}

    profile = (data.get("profile") or DEFAULT_PROFILE).strip().lower()

    # Validate profile
    if profile not in ["researcher", "patient", "general"]:
        return jsonify(
            {
                "error": "Invalid profile",
                "message": "프로필은 researcher, patient, general 중 하나여야 합니다.",
            }
        ), 400

    user_id = session.get("user_id")
    if not user_id:
        user_id = str(uuid.uuid4())
        session["user_id"] = user_id

    user_state = get_or_create_user_state(user_id, profile)

    try:
        # Create Parlant session if it doesn't exist
        if not user_state["session_id"]:
            user_state["session_id"] = create_parlant_session(profile)
            user_state["last_offset"] = 0

        return jsonify(
            {
                "status": "success",
                "profile": profile,
                "session_id": user_state["session_id"],
                "message": f"{profile.capitalize()} 채팅방이 생성되었습니다.",
            }
        )

    except Exception as exc:
        logger.exception("Failed to create Parlant session.")
        return jsonify(
            {
                "error": "session_creation_failed",
                "message": "Parlant 세션 생성 중 오류가 발생했습니다.",
                "detail": str(exc),
            }
        ), 502


@app.route("/api/rooms/list", methods=["GET"])
def list_chat_rooms():
    """List all active chat rooms for the current user."""
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"rooms": []})

    # Get unique key
    unique_key = f"{user_id}_{SERVER_START_ID}"

    if unique_key not in user_sessions:
        return jsonify({"rooms": []})

    rooms = []
    for profile, state in user_sessions[unique_key].items():
        if state.get("session_id"):
            rooms.append(
                {
                    "profile": profile,
                    "session_id": state["session_id"],
                    "last_offset": state["last_offset"],
                }
            )

    return jsonify({"rooms": rooms})


@app.route("/api/message", methods=["POST"])
def process_message():
    """
    Process user message and send to Parlant (non-blocking)

    Request JSON:
        {
            "message": "user message text",
            "profile": "researcher|patient|general"
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
    profile = (data.get("profile") or DEFAULT_PROFILE).strip().lower()

    if not user_input:
        return jsonify({
            "status": "error",
            "message": "메시지가 비어 있습니다. 질문을 입력해 주세요.",
        }), 400

    # Validate profile
    if profile not in ["researcher", "patient", "general"]:
        return jsonify({
            "status": "error",
            "message": "유효하지 않은 프로필입니다.",
        }), 400

    # Get or create user session
    user_id = session.get("user_id")
    if not user_id:
        user_id = str(uuid.uuid4())
        session["user_id"] = user_id

    user_state = get_or_create_user_state(user_id, profile)

    try:
        # Create Parlant session if needed
        if not user_state["session_id"]:
            user_state["session_id"] = create_parlant_session(profile)
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
    Poll for new messages from the assistant (with long polling)

    Query Parameters:
        wait: Wait time in seconds (default: 30, max: 30)
        profile: User profile (researcher|patient|general)

    Response JSON:
        {
            "status": "ok",
            "messages": [{"text": "...", "status": "ready", "correlation_id": "..."}],
            "papers": [...],
            "has_more": false,
            "current_status": "ready"|"processing"|"typing"
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

    profile = request.args.get("profile", DEFAULT_PROFILE).strip().lower()

    # Validate profile
    if profile not in ["researcher", "patient", "general"]:
        profile = DEFAULT_PROFILE

    user_state = get_or_create_user_state(user_id, profile)

    if not user_state.get("session_id"):
        logger.warning("Poll request with no Parlant session_id")
        return jsonify({
            "status": "no_parlant_session",
            "messages": [],
            "papers": [],
            "has_more": False
        })

    try:
        # Use longer default wait time for long polling (Parlant pattern)
        wait_time = int(request.args.get("wait", "30"))
        wait_time = min(wait_time, 30)  # Cap at 30 seconds

        logger.info(
            "Long polling session %s from offset %d (wait=%ds)",
            user_state["session_id"],
            user_state["last_offset"],
            wait_time
        )

        # Check cache first (request deduplication)
        cache_key = (user_state["session_id"], user_state["last_offset"])
        now = time.time()

        if cache_key in request_cache:
            cached_time, cached_events = request_cache[cache_key]
            if now - cached_time < CACHE_TTL:
                logger.debug("Using cached events")
                events = cached_events
            else:
                # Cache expired
                del request_cache[cache_key]
                events = None
        else:
            events = None

        if events is None:
            # Poll for new events with long polling
            with get_parlant_client() as client:
                events = client.list_events(
                    session_id=user_state["session_id"],
                    min_offset=user_state["last_offset"],
                    wait_for_data=wait_time,
                    kinds="message,status,tool"
                )

            # Cache the response
            request_cache[cache_key] = (now, events)

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

        # Extract messages with status (Parlant pattern)
        messages = extract_assistant_messages(events)
        papers = extract_paper_results(events)

        # Determine current status from latest status event
        current_status = "ready"
        status_events = [e for e in events if e.get("kind") == "status"]
        if status_events:
            last_status_event = status_events[-1]
            status_data = last_status_event.get("data", {})
            current_status = (
                status_data.get("status") or
                status_data.get("state") or
                "ready"
            )

        logger.info("Extracted %d messages and %d papers (current_status=%s)", len(messages), len(papers), current_status)

        return jsonify({
            "status": "ok",
            "messages": messages,
            "papers": papers,
            "has_more": len(messages) > 0,  # Suggest polling again if we got messages
            "current_status": current_status
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

    Query Parameters:
        profile: User profile (researcher|patient|general)

    The stream will:
    1. Wait for new events from Parlant
    2. Extract and send messages immediately
    3. Continue until client disconnects or max time reached
    """
    user_id = session.get("user_id")
    if not user_id:
        # Send error event and close with proper status
        logger.error("SSE connection attempted without user session")
        def error_gen():
            yield f"event: error\ndata: {json.dumps({'error': 'No user session. Please refresh the page.'})}\n\n"
        return Response(error_gen(), mimetype='text/event-stream', status=401)

    profile = request.args.get("profile", DEFAULT_PROFILE).strip().lower()

    # Validate profile
    if profile not in ["researcher", "patient", "general"]:
        profile = DEFAULT_PROFILE

    user_state = get_or_create_user_state(user_id, profile)

    if not user_state.get("session_id"):
        logger.error("SSE connection attempted without Parlant session for user %s", user_id)
        def error_gen():
            yield f"event: error\ndata: {json.dumps({'error': 'No Parlant session. Please refresh the page.'})}\n\n"
        return Response(error_gen(), mimetype='text/event-stream', status=500)

    def generate():
        """Generator function for SSE stream with improved completion detection"""
        session_id = user_state["session_id"]
        last_offset = user_state["last_offset"]
        max_attempts = 30  # 30 attempts (7.5 minutes total)
        attempt = 0
        total_messages_sent = 0  # Track total messages sent
        consecutive_empty_polls = 0  # Track consecutive polls with no events
        last_event_time = time.time()  # Track when we last received events

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
                        wait_for_data=30,  # Increased to 30 seconds for complex tool operations
                        kinds="message,status,tool"
                    )

                    if events:
                        logger.debug("SSE received %d events", len(events))

                        # Update offset
                        last_offset = max(event.get("offset", -1) for event in events) + 1
                        user_state["last_offset"] = last_offset

                        # Reset inactivity tracking - we got events
                        consecutive_empty_polls = 0
                        last_event_time = time.time()

                        # Extract messages with status (Parlant pattern)
                        messages = extract_assistant_messages(events)
                        papers = extract_paper_results(events)

                        # Determine current agent status
                        current_status = "ready"
                        status_events = [e for e in events if e.get("kind") == "status"]
                        if status_events:
                            last_status_event = status_events[-1]
                            status_data = last_status_event.get("data", {})
                            current_status = (
                                status_data.get("status") or
                                status_data.get("state") or
                                status_data.get("stage") or
                                "ready"
                            )

                        # Send status update first (for UI indicators)
                        if status_events:
                            yield f"event: status\ndata: {json.dumps({'status': current_status})}\n\n"
                            logger.debug("SSE sent status: %s", current_status)

                        # Send messages with status
                        if messages:
                            for msg in messages:
                                data = json.dumps({
                                    'type': 'message',
                                    'text': msg.get('text') if isinstance(msg, dict) else msg,
                                    'status': msg.get('status', 'ready') if isinstance(msg, dict) else 'ready',
                                    'correlation_id': msg.get('correlation_id', '') if isinstance(msg, dict) else ''
                                })
                                yield f"event: message\ndata: {data}\n\n"
                                total_messages_sent += 1
                                msg_text = msg.get('text') if isinstance(msg, dict) else msg
                                logger.info("SSE sent message #%d (status=%s): %s...",
                                           total_messages_sent,
                                           msg.get('status', 'ready') if isinstance(msg, dict) else 'ready',
                                           msg_text[:50] if msg_text else '')

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
                        # Only complete when agent explicitly signals completion
                        should_complete = False

                        if agent_finished:
                            # Agent explicitly finished - this is the most reliable indicator
                            logger.info("Agent finished status detected, completing SSE stream")
                            should_complete = True
                        elif current_status in {"ready", "completed"}:
                            # Agent is in ready/completed state AND we have messages
                            # This means the agent has finished processing
                            if total_messages_sent > 10:
                                logger.info(
                                    "Agent status is '%s' with %d messages sent, completing SSE stream",
                                    current_status,
                                    total_messages_sent
                                )
                                should_complete = True
                            else:
                                # Ready but no messages yet - keep waiting
                                logger.debug("Agent ready but no messages yet, continuing...")

                        # Inactivity-based completion
                        # If agent is idle (no events) for too long after sending messages
                        if not should_complete and total_messages_sent > 0:
                            time_since_last_event = time.time() - last_event_time

                            # Option 1: Consecutive empty polls (more reliable)
                            if consecutive_empty_polls >= 3:
                                # 3 consecutive empty polls (~45 seconds of inactivity)
                                logger.info(
                                    "Inactivity-based completion: %d consecutive empty polls, %d messages sent",
                                    consecutive_empty_polls,
                                    total_messages_sent
                                )
                                should_complete = True

                            # Option 2: Time-based (backup)
                            elif time_since_last_event > 60:
                                # No events for 60 seconds
                                logger.info(
                                    "Time-based completion: %.1fs since last event, %d messages sent",
                                    time_since_last_event,
                                    total_messages_sent
                                )
                                should_complete = True

                        # Absolute timeout - prevent infinite loops
                        if not should_complete and attempt >= max_attempts:
                            logger.warning(
                                "Max attempts reached (%d), forcing completion with %d messages",
                                max_attempts,
                                total_messages_sent
                            )
                            should_complete = True

                        if should_complete:
                            yield f"event: complete\ndata: {json.dumps({'status': 'complete'})}\n\n"
                            break
                    else:
                        # No events in this poll
                        consecutive_empty_polls += 1
                        logger.debug("Empty poll #%d", consecutive_empty_polls)

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

    Query Parameters:
        profile: User profile (researcher|patient|general)

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

    profile = request.args.get("profile", DEFAULT_PROFILE).strip().lower()

    # Validate profile
    if profile not in ["researcher", "patient", "general"]:
        profile = DEFAULT_PROFILE

    user_state = get_or_create_user_state(user_id, profile)

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
        profile: User profile (researcher|patient|general)

    Response JSON:
        {
            "messages": [{"text": "...", "status": "ready", "correlation_id": "..."}],
            "papers": [...],
            "has_pending": true/false,
            "current_status": "ready"|"processing"|"typing"
        }
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({
            "messages": [],
            "papers": [],
            "has_pending": False
        })

    profile = request.args.get("profile", DEFAULT_PROFILE).strip().lower()

    # Validate profile
    if profile not in ["researcher", "patient", "general"]:
        profile = DEFAULT_PROFILE

    user_state = get_or_create_user_state(user_id, profile)

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
                kinds="message,status,tool"
            )

        if events:
            # Update offset
            user_state["last_offset"] = max(
                event.get("offset", -1) for event in events
            ) + 1

        # Extract messages with status (Parlant pattern)
        messages = extract_assistant_messages(events)
        papers = extract_paper_results(events)

        # Determine current status
        current_status = "ready"
        status_events = [e for e in events if e.get("kind") == "status"]
        if status_events:
            last_status_event = status_events[-1]
            status_data = last_status_event.get("data", {})
            current_status = (
                status_data.get("status") or
                status_data.get("state") or
                "ready"
            )

        logger.info("Found %d pending messages (status=%s)", len(messages), current_status)

        return jsonify({
            "messages": messages,
            "papers": papers,
            "has_pending": len(messages) > 0,
            "current_status": current_status
        })

    except Exception as exc:
        logger.exception("Error checking pending messages")
        return jsonify({
            "messages": [],
            "papers": [],
            "has_pending": False,
            "error": str(exc)
        }), 500


@app.route("/api/session/validate")
def validate_session():
    """
    Validate if user has an active session for the given profile

    Query Parameters:
        profile: User profile (researcher|patient|general)

    Response JSON:
        {
            "valid": true/false,
            "session_id": "session_id" (if valid)
        }
    """
    profile = request.args.get("profile", DEFAULT_PROFILE).strip().lower()

    # Validate profile
    if profile not in ["researcher", "patient", "general"]:
        profile = DEFAULT_PROFILE

    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"valid": False, "error": "No user session"})

    user_state = get_or_create_user_state(user_id, profile)
    session_id = user_state.get("session_id")

    if not session_id:
        return jsonify({"valid": False, "error": "No Parlant session"})

    # If session_id exists in our state, consider it valid
    # We trust that get_or_create_user_state() has already created a valid session
    # Verifying with Parlant adds overhead and can fail for newly created sessions
    return jsonify({
        "valid": True,
        "session_id": session_id
    })


@app.route("/api/session/reset", methods=["POST"])
def reset_session():
    """
    Reset user session for a specific profile (delete and recreate)

    Request JSON:
        {
            "profile": "researcher|patient|general"
        }

    Response JSON:
        {
            "status": "success",
            "message": "Session reset successfully"
        }
    """
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        data = {}

    profile = (data.get("profile") or DEFAULT_PROFILE).strip().lower()

    # Validate profile
    if profile not in ["researcher", "patient", "general"]:
        profile = DEFAULT_PROFILE

    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"status": "success", "message": "No session to reset"})

    user_state = get_or_create_user_state(user_id, profile)

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
        "message": f"{profile.capitalize()} 세션이 재설정되었습니다."
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
