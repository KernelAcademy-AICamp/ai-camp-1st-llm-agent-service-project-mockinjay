"""
Parlant REST API Client
Based on healthcare_v2_en.py and Parlant REST API Reference
"""
import os
import requests
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ParlantConfig:
    """Configuration for Parlant client"""
    base_url: str
    timeout: float = 600.0  # 10 minutes for complex operations (PubMed search + LLM refinement)

    @classmethod
    def from_env(cls) -> 'ParlantConfig':
        """Create config from environment variables"""
        return cls(
            base_url=os.getenv("PARLANT_SERVER", "http://localhost:8800").rstrip("/"),
            timeout=float(os.getenv("PARLANT_HTTP_TIMEOUT", "600"))
        )


class ParlantClient:
    """
    Client for interacting with Parlant REST API

    Provides methods for:
    - Agent management
    - Session creation and management
    - Message handling (events)
    - Customer management
    - Tag management
    """

    def __init__(self, config: Optional[ParlantConfig] = None):
        self.config = config or ParlantConfig.from_env()
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})

    # ==================== Agent Operations ====================

    def list_agents(self) -> List[Dict[str, Any]]:
        """
        List all agents
        GET /agents
        """
        response = self.session.get(
            f"{self.config.base_url}/agents",
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def get_agent(self, agent_id: str) -> Dict[str, Any]:
        """
        Get agent by ID
        GET /agents/:agent_id
        """
        response = self.session.get(
            f"{self.config.base_url}/agents/{agent_id}",
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def get_agent_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Find agent by name
        """
        agents = self.list_agents()
        for agent in agents:
            if agent.get("name") == name:
                return agent
        return None

    def create_agent(
        self,
        name: str,
        description: Optional[str] = None,
        max_engine_iterations: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create a new agent
        POST /agents
        """
        payload = {"name": name}
        if description:
            payload["description"] = description
        if max_engine_iterations is not None:
            payload["max_engine_iterations"] = max_engine_iterations

        response = self.session.post(
            f"{self.config.base_url}/agents",
            json=payload,
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def update_agent(
        self,
        agent_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        max_engine_iterations: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Update an agent
        PATCH /agents/:agent_id
        """
        payload = {}
        if name is not None:
            payload["name"] = name
        if description is not None:
            payload["description"] = description
        if max_engine_iterations is not None:
            payload["max_engine_iterations"] = max_engine_iterations

        response = self.session.patch(
            f"{self.config.base_url}/agents/{agent_id}",
            json=payload,
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def delete_agent(self, agent_id: str) -> None:
        """
        Delete an agent
        DELETE /agents/:agent_id
        """
        response = self.session.delete(
            f"{self.config.base_url}/agents/{agent_id}",
            timeout=self.config.timeout
        )
        response.raise_for_status()

    # ==================== Customer Operations ====================

    def list_customers(self) -> List[Dict[str, Any]]:
        """
        List all customers
        GET /customers
        """
        response = self.session.get(
            f"{self.config.base_url}/customers",
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """
        Get customer by ID
        GET /customers/:customer_id
        """
        response = self.session.get(
            f"{self.config.base_url}/customers/{customer_id}",
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def create_customer(
        self,
        name: str,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create a new customer
        POST /customers
        """
        payload = {"name": name}
        if tags:
            payload["tags"] = tags

        response = self.session.post(
            f"{self.config.base_url}/customers",
            json=payload,
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def update_customer(
        self,
        customer_id: str,
        name: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Update a customer
        PATCH /customers/:customer_id
        """
        payload = {}
        if name is not None:
            payload["name"] = name
        if tags is not None:
            payload["tags"] = tags

        response = self.session.patch(
            f"{self.config.base_url}/customers/{customer_id}",
            json=payload,
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def delete_customer(self, customer_id: str) -> None:
        """
        Delete a customer
        DELETE /customers/:customer_id
        """
        response = self.session.delete(
            f"{self.config.base_url}/customers/{customer_id}",
            timeout=self.config.timeout
        )
        response.raise_for_status()

    # ==================== Tag Operations ====================

    def list_tags(self) -> List[Dict[str, Any]]:
        """
        List all tags
        GET /tags
        """
        response = self.session.get(
            f"{self.config.base_url}/tags",
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def get_tag(self, tag_id: str) -> Dict[str, Any]:
        """
        Get tag by ID
        GET /tags/:tag_id
        """
        response = self.session.get(
            f"{self.config.base_url}/tags/{tag_id}",
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def create_tag(self, name: str) -> Dict[str, Any]:
        """
        Create a new tag
        POST /tags
        """
        response = self.session.post(
            f"{self.config.base_url}/tags",
            json={"name": name},
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def update_tag(self, tag_id: str, name: str) -> Dict[str, Any]:
        """
        Update a tag
        PATCH /tags/:tag_id
        """
        response = self.session.patch(
            f"{self.config.base_url}/tags/{tag_id}",
            json={"name": name},
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def delete_tag(self, tag_id: str) -> None:
        """
        Delete a tag
        DELETE /tags/:tag_id
        """
        response = self.session.delete(
            f"{self.config.base_url}/tags/{tag_id}",
            timeout=self.config.timeout
        )
        response.raise_for_status()

    # ==================== Session Operations ====================

    def list_sessions(
        self,
        agent_id: Optional[str] = None,
        customer_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List sessions with optional filters
        GET /sessions
        """
        params = {}
        if agent_id:
            params["agent_id"] = agent_id
        if customer_id:
            params["customer_id"] = customer_id

        response = self.session.get(
            f"{self.config.base_url}/sessions",
            params=params,
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def get_session(self, session_id: str) -> Dict[str, Any]:
        """
        Get session by ID
        GET /sessions/:session_id
        """
        response = self.session.get(
            f"{self.config.base_url}/sessions/{session_id}",
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def create_session(
        self,
        agent_id: str,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        allow_greeting: bool = False
    ) -> Dict[str, Any]:
        """
        Create a new session
        POST /sessions

        Args:
            agent_id: The agent ID
            customer_id: Optional customer ID
            metadata: Optional metadata dict (e.g., {"careguide_profile": "researcher"})
            allow_greeting: Whether to allow greeting message
        """
        payload = {"agent_id": agent_id}

        if customer_id:
            payload["customer_id"] = customer_id

        if metadata:
            payload["metadata"] = metadata

        params = {"allow_greeting": str(allow_greeting).lower()}

        response = self.session.post(
            f"{self.config.base_url}/sessions",
            json=payload,
            params=params,
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def update_session(
        self,
        session_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Update a session (typically metadata)
        PATCH /sessions/:session_id

        Args:
            session_id: The session ID
            metadata: Metadata operations dict, e.g.:
                {"set": {"careguide_profile": "patient"}}
        """
        payload = {}
        if metadata:
            payload["metadata"] = metadata

        response = self.session.patch(
            f"{self.config.base_url}/sessions/{session_id}",
            json=payload,
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def delete_session(self, session_id: str) -> None:
        """
        Delete a session
        DELETE /sessions/:session_id
        """
        response = self.session.delete(
            f"{self.config.base_url}/sessions/{session_id}",
            timeout=self.config.timeout
        )
        response.raise_for_status()

    def delete_sessions(
        self,
        agent_id: Optional[str] = None,
        customer_id: Optional[str] = None
    ) -> None:
        """
        Delete multiple sessions
        DELETE /sessions
        """
        params = {}
        if agent_id:
            params["agent_id"] = agent_id
        if customer_id:
            params["customer_id"] = customer_id

        response = self.session.delete(
            f"{self.config.base_url}/sessions",
            params=params,
            timeout=self.config.timeout
        )
        response.raise_for_status()

    # ==================== Event Operations ====================

    def list_events(
        self,
        session_id: str,
        min_offset: int = 0,
        wait_for_data: int = 60,
        kinds: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List events for a session
        GET /sessions/:session_id/events

        Args:
            session_id: The session ID
            min_offset: Minimum offset to fetch from
            wait_for_data: Seconds to wait for new data (long polling)
            kinds: Comma-separated event kinds (e.g., "message,status,tool")

        Returns:
            List of events or empty list if 504 timeout
        """
        params = {
            "min_offset": min_offset,
            "wait_for_data": wait_for_data
        }

        if kinds:
            params["kinds"] = kinds

        response = self.session.get(
            f"{self.config.base_url}/sessions/{session_id}/events",
            params=params,
            timeout=self.config.timeout + wait_for_data
        )

        # 504 means no new data within wait_for_data timeout
        if response.status_code == 504:
            return []

        response.raise_for_status()
        return response.json()

    def create_event(
        self,
        session_id: str,
        kind: str,
        source: str,
        message: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create an event (send a message)
        POST /sessions/:session_id/events

        Args:
            session_id: The session ID
            kind: Event kind (e.g., "message")
            source: Event source (e.g., "customer", "ai_agent")
            message: Message content (for message events)
            data: Additional event data
        """
        payload = {
            "kind": kind,
            "source": source
        }

        if message:
            payload["message"] = message

        if data:
            payload["data"] = data

        response = self.session.post(
            f"{self.config.base_url}/sessions/{session_id}/events",
            json=payload,
            timeout=self.config.timeout
        )
        response.raise_for_status()
        return response.json()

    def post_customer_message(
        self,
        session_id: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Convenience method to post a customer message
        """
        return self.create_event(
            session_id=session_id,
            kind="message",
            source="customer",
            message=message
        )

    def delete_event(self, event_id: str) -> None:
        """
        Delete an event
        DELETE /events/:event_id
        """
        response = self.session.delete(
            f"{self.config.base_url}/events/{event_id}",
            timeout=self.config.timeout
        )
        response.raise_for_status()

    # ==================== Helper Methods ====================

    def wait_for_assistant_response(
        self,
        session_id: str,
        last_offset: int,
        max_attempts: int = 3,
        wait_for_data: int = 30
    ) -> tuple[List[str], int]:
        """
        Poll for assistant responses

        Returns:
            (messages, new_offset)
        """
        messages = []
        current_offset = last_offset

        for attempt in range(max_attempts):
            events = self.list_events(
                session_id=session_id,
                min_offset=current_offset,
                wait_for_data=wait_for_data,
                kinds="message,status,tool"
            )

            if events:
                # Update offset
                current_offset = max(event.get("offset", -1) for event in events) + 1

                # Extract assistant messages
                for event in events:
                    if event.get("kind") != "message":
                        continue

                    if event.get("source") not in {"ai_agent", "human_agent_on_behalf_of_ai_agent"}:
                        continue

                    payload = event.get("data")

                    # Extract message text
                    message_text = None
                    if isinstance(payload, dict):
                        message_text = (
                            payload.get("message") or
                            payload.get("text") or
                            payload.get("content")
                        )

                        if isinstance(message_text, dict):
                            message_text = message_text.get("text") or message_text.get("content")

                    elif isinstance(payload, str):
                        message_text = payload

                    if message_text and isinstance(message_text, str):
                        messages.append(message_text.strip())

            # If we have messages, break
            if messages:
                break

            # If no events, continue polling
            if not events:
                continue

        return messages, current_offset

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.session.close()
