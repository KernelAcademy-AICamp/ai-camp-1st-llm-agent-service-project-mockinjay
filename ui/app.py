"""Flask web application for the CareGuide chatbot (Parlant proxy)."""
from __future__ import annotations

import logging
import os
import uuid
from functools import lru_cache
from typing import Any, Dict, List, Optional

import requests
from flask import Flask, jsonify, render_template, request, session
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "careguide-secret-key-2024")
CORS(app)

PARLANT_SERVER = os.getenv("PARLANT_SERVER", "http://localhost:8800").rstrip("/")
PARLANT_AGENT_ID = os.getenv("PARLANT_AGENT_ID")
PARLANT_AGENT_NAME = os.getenv("PARLANT_AGENT_NAME", "CareGuide")
PARLANT_HTTP_TIMEOUT = float(os.getenv("PARLANT_HTTP_TIMEOUT", "60"))
DEFAULT_PROFILE = os.getenv("CARE_GUIDE_DEFAULT_PROFILE", "general")

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Simple in-memory store that tracks Parlant session details per browser session.
user_sessions: Dict[str, Dict[str, Any]] = {}


def _get_or_create_user_state(user_id: str) -> Dict[str, Any]:
    """Return the state bucket for the given user session."""
    return user_sessions.setdefault(
        user_id,
        {
            "session_id": None,
            "last_offset": 0,
            "profile": DEFAULT_PROFILE,
        },
    )


@lru_cache(maxsize=1)
def _resolve_agent_id() -> str:
    """Resolve the Parlant agent id via configuration or discovery."""
    if PARLANT_AGENT_ID:
        return PARLANT_AGENT_ID

    logger.info("Resolving agent id for Parlant agent named '%s'", PARLANT_AGENT_NAME)
    response = requests.get(
        f"{PARLANT_SERVER}/agents",
        timeout=PARLANT_HTTP_TIMEOUT,
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()
    agents: List[Dict[str, Any]] = response.json()

    for agent in agents:
        if agent.get("name") == PARLANT_AGENT_NAME:
            agent_id = agent["id"]
            logger.info("Using Parlant agent id %s", agent_id)
            return agent_id

    raise RuntimeError(
        f"No Parlant agent named '{PARLANT_AGENT_NAME}' was found. "
        "Set PARLANT_AGENT_ID to the agent identifier to bypass discovery.",
    )


def _create_parlant_session(profile: Optional[str]) -> str:
    """Create a Parlant session and return its id."""
    payload: Dict[str, Any] = {"agent_id": _resolve_agent_id()}
    metadata: Dict[str, Any] = {}

    if profile:
        metadata["careguide_profile"] = profile

    if metadata:
        payload["metadata"] = metadata

    response = requests.post(
        f"{PARLANT_SERVER}/sessions",
        params={"allow_greeting": "false"},
        json=payload,
        timeout=PARLANT_HTTP_TIMEOUT,
    )
    response.raise_for_status()

    session_payload = response.json()
    session_id = session_payload.get("id")

    if not session_id:
        raise RuntimeError("Parlant session creation response is missing an 'id' field.")

    logger.info("Created Parlant session %s", session_id)
    return session_id


def _post_customer_message(parlant_session_id: str, message: str) -> None:
    """Send the user's message to the Parlant session."""
    payload = {
        "kind": "message",
        "source": "customer",
        "message": message,
    }
    response = requests.post(
        f"{PARLANT_SERVER}/sessions/{parlant_session_id}/events",
        json=payload,
        timeout=PARLANT_HTTP_TIMEOUT,
    )
    response.raise_for_status()


def _update_session_profile(parlant_session_id: str, profile: str) -> None:
    """Synchronise profile metadata with the Parlant session."""
    payload = {"metadata": {"set": {"careguide_profile": profile}}}
    response = requests.patch(
        f"{PARLANT_SERVER}/sessions/{parlant_session_id}",
        json=payload,
        timeout=PARLANT_HTTP_TIMEOUT,
    )
    response.raise_for_status()


def _fetch_new_events(
    parlant_session_id: str,
    min_offset: int,
    *,
    wait_for_data: int = 60,
) -> List[Dict[str, Any]]:
    """Fetch newly generated events from Parlant."""
    params = {
        "min_offset": min_offset,
        "wait_for_data": wait_for_data,
        "kinds": "message,status,tool",
    }
    response = requests.get(
        f"{PARLANT_SERVER}/sessions/{parlant_session_id}/events",
        params=params,
        timeout=PARLANT_HTTP_TIMEOUT,
    )

    if response.status_code == 504:
        return []

    response.raise_for_status()
    events = response.json()

    if not isinstance(events, list):
        raise RuntimeError("Unexpected response when listing session events.")

    return events


def _extract_assistant_messages(events: List[Dict[str, Any]]) -> List[str]:
    """Return all assistant utterances from the provided events."""
    responses: List[str] = []

    for event in events:
        if event.get("kind") != "message":
            continue
        if event.get("source") not in {"ai_agent", "human_agent_on_behalf_of_ai_agent"}:
            continue

        payload = event.get("data")

        if isinstance(payload, dict):
            candidate = payload.get("message") or payload.get("text") or payload.get("content")

            if isinstance(candidate, str) and candidate.strip():
                responses.append(candidate.strip())
            elif isinstance(candidate, dict):
                nested = candidate.get("text") or candidate.get("content")
                if isinstance(nested, str) and nested.strip():
                    responses.append(nested.strip())
        elif isinstance(payload, str) and payload.strip():
            responses.append(payload.strip())

    return responses


def _extract_paper_results(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract PubMed-style tool results for display."""
    papers: List[Dict[str, Any]] = []
    seen: set[tuple[str, Optional[str]]] = set()

    for event in events:
        if event.get("kind") != "tool":
            continue

        result = event.get("result") or {}
        data = result.get("data")

        if not isinstance(data, list):
            continue

        for item in data:
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


def _collect_agent_updates(
    user_state: Dict[str, Any],
    *,
    max_attempts: int = 3,
    wait_for_data: int = 30,
) -> tuple[List[str], List[Dict[str, Any]]]:
    """Poll the Parlant server until an agent reply is ready or attempts are exhausted."""
    aggregated_messages: List[str] = []
    aggregated_papers: List[Dict[str, Any]] = []
    session_id = user_state["session_id"]

    for attempt in range(max_attempts):
        events = _fetch_new_events(
            session_id,
            user_state["last_offset"],
            wait_for_data=wait_for_data,
        )

        if events:
            user_state["last_offset"] = max(event.get("offset", -1) for event in events) + 1

        aggregated_messages.extend(_extract_assistant_messages(events))

        for paper in _extract_paper_results(events):
            if paper not in aggregated_papers:
                aggregated_papers.append(paper)

        if aggregated_messages:
            break

        if not events:
            # No new events yet; allow another poll.
            continue

    return aggregated_messages, aggregated_papers


@app.route("/")
def index():
    """Render the landing page."""
    return render_template("index.html")


@app.route("/chat")
def chat():
    """Render the chat page and initialise a browser session."""
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())

    _get_or_create_user_state(session["user_id"])
    return render_template("chat.html")


@app.route("/api/message", methods=["POST"])
def process_message():
    """Proxy user messages to the Parlant server."""
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        data = {}

    user_input = (data.get("message") or "").strip()

    if not user_input:
        return jsonify(
            {
                "message": "메시지가 비어 있습니다. 질문을 입력해 주세요.",
                "intent": "empty_input",
                "papers": [],
                "show_bubble": False,
            }
        ), 400

    user_id = session.get("user_id")

    if not user_id:
        user_id = str(uuid.uuid4())
        session["user_id"] = user_id

    user_state = _get_or_create_user_state(user_id)

    try:
        if not user_state["session_id"]:
            user_state["session_id"] = _create_parlant_session(user_state.get("profile"))
            user_state["last_offset"] = 0

        _post_customer_message(user_state["session_id"], user_input)

        responses, papers = _collect_agent_updates(user_state)
        response_text = "\n\n".join(responses).strip()

        if not response_text:
            response_text = "CareGuide가 응답을 준비하고 있습니다. 잠시만 기다려 주세요."

        return jsonify(
            {
                "message": response_text,
                "intent": "parlant",
                "papers": papers,
                "show_bubble": False,
            }
        )

    except requests.RequestException as api_error:
        logger.exception("Failed to communicate with Parlant server.")
        return jsonify(
            {
                "message": "Parlant 서버와 통신하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
                "intent": "error",
                "papers": [],
                "show_bubble": False,
                "detail": str(api_error),
            }
        ), 502
    except Exception as exc:
        logger.exception("Unhandled CareGuide proxy error.")
        return jsonify(
            {
                "message": "예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
                "intent": "error",
                "papers": [],
                "show_bubble": False,
                "detail": str(exc),
            }
        ), 500


@app.route("/api/profile", methods=["POST"])
def set_profile():
    """Persist the preferred profile and sync it to the Parlant session."""
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        data = {}

    profile_type = (data.get("profile_type") or DEFAULT_PROFILE or "general").lower()
    user_id = session.get("user_id")

    if not user_id:
        user_id = str(uuid.uuid4())
        session["user_id"] = user_id

    user_state = _get_or_create_user_state(user_id)
    user_state["profile"] = profile_type

    session_id = user_state.get("session_id")
    if session_id:
        try:
            _update_session_profile(session_id, profile_type)
        except requests.RequestException as api_error:
            logger.warning("Failed to update session metadata: %s", api_error)

    return jsonify({"status": "success", "profile": profile_type})


if __name__ == "__main__":
    app.run(debug=True, port=8000)
