"""
Research Paper Agent Implementation
Integrates with Parlant healthcare_v2_en.py server
Auto-starts server and uses singleton client pattern
"""

import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
import logging
import os
import asyncio
import subprocess
import time
import httpx

# Add backend path for imports
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from Agent.base_agent import BaseAgent
from Agent.core.contracts import AgentRequest, AgentResponse

# Parlant client for connecting to healthcare_v2_en.py server
from parlant.client.client import AsyncParlantClient
PARLANT_AVAILABLE = True

logger = logging.getLogger(__name__)


class ResearchPaperAgent(BaseAgent):
    """
    Research Paper Agent
    Connects to Parlant healthcare_v2_en.py server and uses search_medical_qa tool
    """

    # Class variables for singleton pattern
    _parlant_client = None
    _parlant_server_process = None
    _server_url = "http://localhost:8800"  # Parlant server URL
    _agent_id = None
    _customer_id = None

    def __init__(self):
        super().__init__(agent_type="research_paper")
        self._initialized = False
        self._session_cache = {}  # Cache sessions per session_id

    @classmethod
    async def _check_server_running(cls) -> bool:
        """Check if Parlant server is already running"""
        try:
            async with httpx.AsyncClient() as client:
                # Parlant doesn't have /health, try /api/agents instead
                response = await client.get(f"{cls._server_url}/api/agents", timeout=2.0)
                # Any response (even error) means server is up
                return response.status_code in [200, 401, 403, 404]
        except Exception:
            return False

    @classmethod
    async def _ensure_server_running(cls):
        """Ensure Parlant server is running, start if not"""
        # Check if server is already running
        if await cls._check_server_running():
            logger.info("✅ Parlant server already running")
            return

        if cls._parlant_server_process is not None:
            logger.info("✅ Parlant server process already started")
            return

        # Start the server
        logger.info("🚀 Starting Parlant healthcare server...")

        # Use healthcare_v2_en.py directly from server folder
        healthcare_server_path = Path(__file__).parent / "server" / "healthcare_v2_en.py"

        if not healthcare_server_path.exists():
            raise FileNotFoundError(
                f"Parlant healthcare server not found at {healthcare_server_path}"
            )

        # Start server as subprocess - DON'T capture output, let it print to console
        logger.info(f"📝 Server path: {healthcare_server_path}")
        logger.info(f"📝 Python executable: {sys.executable}")

        cls._parlant_server_process = subprocess.Popen(
            [sys.executable, str(healthcare_server_path)],
            cwd=str(healthcare_server_path.parent),
            env=os.environ.copy(),
            # Don't redirect output - let errors show in console
        )

        # Wait for server to be ready
        logger.info("⏳ Waiting for server to start...")
        max_wait = 60  # 60 seconds max
        wait_interval = 2
        elapsed = 0

        while elapsed < max_wait:
            await asyncio.sleep(wait_interval)
            elapsed += wait_interval

            # Check if process is still running
            poll_result = cls._parlant_server_process.poll()
            if poll_result is not None:
                logger.error(f"❌ Server process terminated with exit code: {poll_result}")
                logger.error("Check the output above for error details")
                raise RuntimeError(f"Parlant server process terminated unexpectedly with exit code {poll_result}")

            if await cls._check_server_running():
                logger.info(f"✅ Parlant server started successfully (took {elapsed}s)")
                return

            # Log progress every 10 seconds
            if elapsed % 10 == 0:
                logger.info(f"⏳ Still waiting... ({elapsed}s elapsed)")

        # If we get here, server didn't start
        raise TimeoutError(
            f"Parlant server failed to start within {max_wait} seconds. "
            f"Check the output above for errors."
        )

    @classmethod
    async def _get_client(cls):
        """Get singleton Parlant client"""
        if cls._parlant_client is None:
            if not PARLANT_AVAILABLE:
                raise ImportError(
                    "Parlant client not available. "
                    "Install with: pip install parlant-client-server"
                )

            # Ensure server is running
            await cls._ensure_server_running()

            # Create client (base_url is keyword-only)
            cls._parlant_client = AsyncParlantClient(base_url=cls._server_url)
            logger.info(f"✅ Parlant client connected to {cls._server_url}")

            # Get or create agent and customer
            await cls._setup_agent_and_customer()

        return cls._parlant_client

    @classmethod
    async def _setup_agent_and_customer(cls):
        """Setup agent ID and customer ID"""
        try:
            # List agents to get the CareGuide agent
            agents_response = await cls._parlant_client.agents.list()

            if agents_response and len(agents_response) > 0:
                # Use the first agent (CareGuide_v2)
                cls._agent_id = agents_response[0].id
                logger.info(f"✅ Using agent: {agents_response[0].name} (ID: {cls._agent_id})")
            else:
                raise ValueError("No agents found on Parlant server")

            # Create a customer for this agent instance
            customer = await cls._parlant_client.customers.create(
                name=f"research_agent_{int(time.time())}"
            )
            cls._customer_id = customer.id
            logger.info(f"✅ Created customer (ID: {cls._customer_id})")

        except Exception as e:
            logger.error(f"Failed to setup agent/customer: {e}")
            raise

    async def _initialize(self):
        """Initialize all connections"""
        if not self._initialized:
            self.client = await self._get_client()
            self._initialized = True

    async def process(
        self,
        user_input: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process research paper search request using Parlant's search_medical_qa tool

        Args:
            user_input: Search query
            session_id: Session ID
            context: Additional context (profile, language, etc.)

        Returns:
            Dict containing:
                - answer: Generated answer from Parlant LLM
                - sources: Source documents summary
                - papers: Research papers (if any)
                - tokens_used: Token count
                - agent_type: "research_paper"
                - metadata: Additional metadata
        """
        await self._initialize()

        # Build request
        request = AgentRequest(
            query=user_input,
            session_id=session_id,
            context=context or {},
            profile=context.get('profile', 'general') if context else 'general',
            language=context.get('language', 'ko') if context else 'ko'
        )

        # Estimate tokens
        tokens_estimated = self.estimate_context_usage(user_input)
        self.context_usage += tokens_estimated

        try:
            logger.info(f"🔍 Calling Parlant search_medical_qa for query: {request.query[:50]}...")

            # Get or create session for this session_id
            if session_id not in self._session_cache:
                # Create customer with correct profile tag for this session
                profile = request.profile if request.profile else 'general'

                # Create or get profile tag
                try:
                    # Try to create the tag (it's okay if it already exists)
                    profile_tag = await self.client.tags.create(name=f"profile:{profile}")
                    tag_id = profile_tag.id
                except Exception:
                    # Tag might already exist, fetch it
                    tags = await self.client.tags.list()
                    profile_tags = [t for t in tags if t.name == f"profile:{profile}"]
                    if profile_tags:
                        tag_id = profile_tags[0].id
                    else:
                        logger.warning(f"⚠️ Could not create or find profile tag: profile:{profile}")
                        tag_id = None

                # Create a customer for this session with profile tag
                customer_name = f"session_{session_id}_{int(time.time())}"
                if tag_id:
                    session_customer = await self.client.customers.create(
                        name=customer_name,
                        tags=[tag_id]
                    )
                    logger.info(f"✅ Created customer with profile '{profile}': {session_customer.id}")
                else:
                    session_customer = await self.client.customers.create(name=customer_name)
                    logger.warning(f"⚠️ Created customer without profile tag: {session_customer.id}")

                # Create session with the profile-tagged customer
                parlant_session = await self.client.sessions.create(
                    agent_id=self._agent_id,
                    customer_id=session_customer.id
                )
                self._session_cache[session_id] = parlant_session.id
                logger.info(f"📝 Created new Parlant session: {parlant_session.id}")

            parlant_session_id = self._session_cache[session_id]

            # Send the query as a customer message event
            # Set moderation='none' to ensure immediate processing
            customer_event = await self.client.sessions.create_event(
                session_id=parlant_session_id,
                kind="message",
                source="customer",
                message=request.query,
                moderation="none"  # Bypass moderation for immediate agent response
            )

            logger.info(f"📝 Customer event created with offset: {customer_event.offset}")

            # Wait for complete agent response by polling for events
            # Parlant sends preamble message first (__preamble__ tag), then actual response
            # We need to wait for the actual response message (without __preamble__ tag)
            # Termination conditions:
            # 1. Response contains disclaimer message (indicating completion)
            # 2. No new events for 10 minutes (600 seconds)
            max_wait_time = 600  # 10 minutes max total wait
            poll_interval = 5  # Poll every 5 seconds
            start_time = asyncio.get_event_loop().time()
            last_event_offset = customer_event.offset
            agent_messages = []
            has_actual_response = False  # Track if we got actual response (not preamble)
            no_new_events_count = 0
            max_no_new_events = 120  # Stop after 120 polls with no new events (10 minutes = 600 seconds / 5 seconds per poll)
            disclaimer_text = "⚠️ 이 답변은 교육 목적이며, 건강에 관한 궁금증이나 문제가 있을 경우 반드시 의료 전문가와 상담하시기 바랍니다."

            while True:
                elapsed = asyncio.get_event_loop().time() - start_time
                if elapsed > max_wait_time:
                    logger.warning(f"⏰ Max wait time ({max_wait_time}s) exceeded")
                    break

                try:
                    # Get events after the last seen event
                    events = await self.client.sessions.list_events(
                        session_id=parlant_session_id,
                        min_offset=last_event_offset + 1,
                        kinds="message",
                        wait_for_data=poll_interval
                    )

                    # Look for agent messages (source can be 'agent' or 'ai_agent')
                    # Filter out preamble messages (tagged with '__preamble__')
                    new_agent_messages = [
                        event for event in events
                        if event.kind == 'message' and event.source in ('agent', 'ai_agent')
                    ]

                    # Separate preamble and actual messages, check for disclaimer
                    response_complete = False
                    for msg in new_agent_messages:
                        tags = msg.data.get('tags', []) if isinstance(msg.data, dict) else []
                        message_text = msg.data.get('message', '') if isinstance(msg.data, dict) else ''

                        if '__preamble__' in tags:
                            logger.info(f"📝 Received preamble message: {message_text[:50]}...")
                        else:
                            logger.info(f"📨 Received actual response message")

                        # Check if message contains disclaimer (indicates completion)
                        if disclaimer_text in message_text:
                            logger.info(f"✅ Disclaimer found - response is complete!")
                            response_complete = True

                    if new_agent_messages:
                        agent_messages.extend(new_agent_messages)
                        last_event_offset = max(event.offset for event in new_agent_messages)
                        no_new_events_count = 0  # Reset counter
                        logger.info(f"📨 Received {len(new_agent_messages)} new message(s) (total: {len(agent_messages)})")

                        # If we found the disclaimer, response is complete
                        if response_complete:
                            logger.info(f"✅ Response complete with disclaimer after {elapsed:.1f}s")
                            break
                    else:
                        no_new_events_count += 1
                        logger.info(f"⏳ No new events ({no_new_events_count}/{max_no_new_events})")

                        # If we have messages and no new events for a while, assume complete
                        if agent_messages and no_new_events_count >= max_no_new_events:
                            logger.info(f"✅ Response appears complete after {no_new_events_count} empty polls")
                            break

                except Exception as e:
                    # 504 Gateway Timeout is expected when no new events arrive
                    if "504" in str(e) or "timeout" in str(e).lower():
                        no_new_events_count += 1
                        logger.info(f"⏳ Waiting for response... ({no_new_events_count}/{max_no_new_events})")

                        # If we have messages and timeout, assume complete
                        if agent_messages and no_new_events_count >= max_no_new_events:
                            logger.info(f"✅ Response appears complete (timeout after messages)")
                            break
                    else:
                        # Re-raise unexpected errors
                        raise

            if agent_messages:
                # Debug: log all message data
                logger.info(f"🔍 Analyzing {len(agent_messages)} agent message(s)")
                for i, msg in enumerate(agent_messages):
                    logger.info(f"Message {i}: offset={msg.offset}, data keys={list(msg.data.keys()) if isinstance(msg.data, dict) else 'not dict'}")

                # Combine all agent messages (streaming response)
                # Skip preamble messages (tagged with '__preamble__')
                full_answer = []
                for msg in agent_messages:
                    event_data = msg.data if hasattr(msg, 'data') else {}

                    # Skip preamble
                    tags = event_data.get('tags', []) if isinstance(event_data, dict) else []
                    if '__preamble__' in tags:
                        continue

                    # Extract message text
                    if isinstance(event_data, dict):
                        msg_text = event_data.get('message', event_data.get('text', ''))
                        if msg_text:
                            full_answer.append(msg_text)

                # Combine all message parts
                answer_text = '\n'.join(full_answer)

                # Debug: log combined answer
                logger.info(f"📊 Combined answer from {len(full_answer)} message parts")
                logger.info(f"📊 Total length: {len(answer_text)} characters")
                logger.info(f"📊 Answer preview: {answer_text[:200]}...")

                # Get summary information from data
                summary = event_data.get('summary', {}) if isinstance(event_data, dict) else {}
                sources_info = summary.get('sources', {}) if isinstance(summary, dict) else {}

                # Build response
                response_data = AgentResponse(
                    answer=answer_text,
                    sources=[{
                        'type': 'parlant_search',
                        'summary': summary,
                        'sources_count': sources_info
                    }],
                    papers=[],
                    tokens_used=tokens_estimated,  # Approximate
                    status="success",
                    agent_type=self.agent_type,
                    metadata={
                        'parlant_session_id': parlant_session_id,
                        'search_method': summary.get('search_method', 'hybrid_optimized'),
                        'total_count': summary.get('total_count', 0),
                        'response_time': summary.get('response_time', '0s'),
                        'sources_breakdown': sources_info,
                        'profile': request.profile,
                        'language': request.language
                    }
                )

                logger.info(f"✅ Parlant search completed: {summary.get('total_count', 0)} results")

                return response_data.dict()
            else:
                raise Exception("No assistant response received from Parlant after polling")

        except Exception as e:
            logger.error(f"Research paper agent error: {e}", exc_info=True)
            return {
                "answer": f"검색 중 오류가 발생했습니다: {str(e)}\n\n힌트: Parlant 서버가 실행 중인지 확인하세요.",
                "sources": [],
                "papers": [],
                "tokens_used": 0,
                "status": "error",
                "agent_type": self.agent_type,
                "metadata": {"error": str(e)}
            }

    def estimate_context_usage(self, user_input: str) -> int:
        """
        Estimate context usage (tokens)

        Args:
            user_input: User input text

        Returns:
            Estimated token count
        """
        # Base tokens
        estimated_tokens = int(len(user_input) * 1.5)

        # System prompt tokens
        estimated_tokens += 600

        # Search results tokens (hybrid search returns substantial data)
        estimated_tokens += 3000

        # Answer generation tokens
        estimated_tokens += 1500

        return estimated_tokens

    async def close(self):
        """Clean up resources"""
        # Clear session cache
        self._session_cache.clear()

        logger.info("Research Paper Agent closed")

    @classmethod
    async def shutdown_server(cls):
        """Shutdown the Parlant server (call this on application shutdown)"""
        if cls._parlant_server_process is not None:
            logger.info("🛑 Shutting down Parlant server...")
            cls._parlant_server_process.terminate()
            try:
                cls._parlant_server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                cls._parlant_server_process.kill()
            cls._parlant_server_process = None
            logger.info("✅ Parlant server stopped")

        if cls._parlant_client is not None:
            # Close client if it has a close method
            if hasattr(cls._parlant_client, 'close'):
                await cls._parlant_client.close()
            cls._parlant_client = None