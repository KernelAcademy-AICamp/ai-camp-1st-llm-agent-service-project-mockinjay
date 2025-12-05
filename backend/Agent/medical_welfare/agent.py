"""
Medical Welfare Agent - Refactored for Independent Parlant Server
Port 8801에서 실행되는 medical_welfare_server.py와 통신

Supports persistent Parlant customers linked to user accounts.
사용자 계정에 연결된 영구 Parlant 고객을 지원합니다.
"""

import sys
from pathlib import Path
from typing import Dict, Any, Optional
import logging
import os
import asyncio
import subprocess
import time
import httpx
from asyncio import Queue, Task

# Add backend path
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from Agent.core.local_agent import LocalAgent
from Agent.core.agent_registry import AgentRegistry
from Agent.core.contracts import AgentRequest, AgentResponse
from Agent.core.execution_type import ExecutionType

# Parlant client
from parlant.client.client import AsyncParlantClient
from parlant.client.errors.not_found_error import NotFoundError

logger = logging.getLogger(__name__)


@AgentRegistry.register("medical_welfare")
class MedicalWelfareAgent(LocalAgent):
    """
    Medical Welfare Agent - Parlant Remote Agent with Session-Based Continuous Polling
    세션 기반 연속 폴링을 사용하는 Medical Welfare 에이전트

    Connects to independent medical_welfare_server.py (port 8801)
    """

    # Class variables for singleton pattern
    _parlant_client: Optional[AsyncParlantClient] = None
    _parlant_server_process = None
    _server_url = "http://localhost:8801"  # Dedicated medical_welfare_server.py
    _agent_id = None
    _session_cache = {}

    # Session-based polling management
    # 세션 기반 폴링 관리
    _active_sessions: Dict[str, Dict[str, Any]] = {}  # parlant_session_id -> {task, queue, last_offset, is_active}
    
    def __init__(self):
        super().__init__(agent_type="medical_welfare")
        self._initialized = False
    
    @property
    def metadata(self) -> Dict[str, Any]:
        return {
            "name": "Medical Welfare Agent",
            "description": "CKD 환자를 위한 복지 프로그램 및 병원 정보 검색",
            "version": "2.0-parlant",
            "capabilities": [
                "welfare_program_search",
                "hospital_search",
                "dialysis_center_search",
                "ckd_information",
                "emergency_detection"
            ],
            "parlant_server": {
                "url": self._server_url,
                "port": 8801,
                "server": "medical_welfare_server.py (port 8801)",
                "tools": [
                    "search_welfare_programs",
                    "search_hospitals",
                    "check_emergency",
                    "get_ckd_stage_info",
                    "get_symptoms_info"
                ]
            }
        }
    
    @property
    def execution_type(self) -> ExecutionType:
        return ExecutionType.REMOTE
    
    @classmethod
    async def _check_server_running(cls) -> bool:
        """Check if Parlant server is running"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{cls._server_url}/api/agents", timeout=2.0)
                return response.status_code in [200, 401, 403, 404]
        except Exception:
            return False
    
    @classmethod
    async def _ensure_server_running(cls):
        """Ensure Parlant server is running"""
        if await cls._check_server_running():
            logger.info("✅ Medical Welfare server already running")
            return
        
        if cls._parlant_server_process is not None:
            logger.info("✅ Medical Welfare server process already started")
            return
        
        logger.info("🚀 Starting Medical Welfare Parlant server...")
        
        server_path = Path(__file__).parent / "server" / "medical_welfare_server.py"
        
        if not server_path.exists():
            raise FileNotFoundError(f"Server not found: {server_path}")
        
        logger.info(f"📝 Server path: {server_path}")
        
        cls._parlant_server_process = subprocess.Popen(
            [sys.executable, str(server_path)],
            cwd=str(server_path.parent),
            env=os.environ.copy()
        )
        
        logger.info("⏳ Waiting for server to start...")
        max_wait = 60
        wait_interval = 2
        elapsed = 0
        
        while elapsed < max_wait:
            await asyncio.sleep(wait_interval)
            elapsed += wait_interval
            
            if cls._parlant_server_process.poll() is not None:
                raise RuntimeError(
                    f"Server terminated with exit code {cls._parlant_server_process.poll()}"
                )
            
            if await cls._check_server_running():
                logger.info(f"✅ Medical Welfare server started ({elapsed}s)")
                return
            
            if elapsed % 10 == 0:
                logger.info(f"⏳ Still waiting... ({elapsed}s)")
        
        raise TimeoutError(f"Server failed to start within {max_wait}s")
    
    @classmethod
    async def _get_client(cls) -> AsyncParlantClient:
        """Get singleton Parlant client"""
        if cls._parlant_client is None:
            await cls._ensure_server_running()
            
            # Create httpx client with extended timeout for long-polling
            httpx_client = httpx.AsyncClient(
                timeout=httpx.Timeout(
                    connect=10.0,      # Connection timeout
                    read=240.0,        # Read timeout - 4 minutes for long-polling
                    write=10.0,        # Write timeout
                    pool=None          # No pool timeout
                )
            )
            
            cls._parlant_client = AsyncParlantClient(
                base_url=cls._server_url,
                httpx_client=httpx_client
            )
            logger.info(f"✅ Parlant client connected to {cls._server_url} (read timeout: 240s)")
            
            await cls._setup_agent()
        
        return cls._parlant_client
    
    @classmethod
    async def _setup_agent(cls):
        """Setup agent ID"""
        try:
            agents_response = await cls._parlant_client.agents.list()
            
            if agents_response and len(agents_response) > 0:
                # Find MedicalWelfare_Agent
                target_agent = next(
                    (a for a in agents_response if a.name == "MedicalWelfare_Agent"),
                    None
                )
                
                if target_agent:
                    cls._agent_id = target_agent.id
                    logger.info(f"✅ Using agent: {target_agent.name} (ID: {cls._agent_id})")
                else:
                    # Fallback to first agent if specific one not found
                    cls._agent_id = agents_response[0].id
                    logger.warning(f"⚠️ 'MedicalWelfare_Agent' not found, using first available: {agents_response[0].name} (ID: {cls._agent_id})")
            else:
                raise ValueError("No agents found on Parlant server")
        except Exception as e:
            logger.error(f"Failed to setup agent: {e}")
            raise
    
    async def _initialize(self):
        """Initialize client"""
        if not self._initialized:
            self.client = await self._get_client()
            self._initialized = True

    @classmethod
    async def _continuous_polling_task(cls, parlant_session_id: str, event_queue: Queue):
        """
        Background task for continuous event polling.
        백그라운드 연속 이벤트 폴링 태스크

        This task runs continuously until the session is explicitly stopped.
        세션이 명시적으로 중지될 때까지 계속 실행됩니다.

        Args:
            parlant_session_id: Parlant session ID
            event_queue: Queue to store received events
        """
        session_data = cls._active_sessions.get(parlant_session_id)
        if not session_data:
            logger.error(f"Session data not found for {parlant_session_id}")
            return

        last_offset = session_data['last_offset']
        logger.info(f"🚀 Starting continuous polling for session {parlant_session_id} from offset {last_offset}")
        count_504 = 0
        limit_504 = 3
        try:
            while session_data['is_active']:
                try:
                    # Long-polling for events (60 seconds)
                    # 이벤트 롱폴링 (60초)
                    events = await cls._parlant_client.sessions.list_events(
                        session_id=parlant_session_id,
                        min_offset=last_offset + 1,
                        wait_for_data=60
                    )

                    if events:
                        last_offset = max(e.offset for e in events)
                        session_data['last_offset'] = last_offset

                        # Put all events into queue for async processing
                        # 모든 이벤트를 비동기 처리를 위해 큐에 추가
                        for event in events:
                            await event_queue.put(event)
                            logger.debug(f"📥 Event queued: {event.kind} (offset: {event.offset})")

                    # Check if session is still active (may have been deactivated)
                    # 세션이 여전히 활성화되어 있는지 확인
                    if not session_data['is_active']:
                        logger.info(f"✅ Session {parlant_session_id} marked inactive, stopping polling")
                        break

                except Exception as e:
                    # 504 is normal for long polling timeout
                    # 504는 롱폴링 타임아웃의 정상 응답
                    count_504 += 1
                    if count_504 > limit_504:
                        logger.error(f"❌ Polling error: {e}")
                        break
                    if "504" in str(e) or "Gateway Timeout" in str(e):
                        logger.debug(f"⏳ No new events (timeout)")
                        continue
                    else:
                        logger.error(f"❌ Polling error: {e}")
                        # Put error into queue
                        await event_queue.put({"error": str(e)})
                        await asyncio.sleep(5)  # Back off on error

        except asyncio.CancelledError:
            logger.info(f"🛑 Polling task cancelled for session {parlant_session_id}")
        except Exception as e:
            logger.error(f"❌ Fatal polling error: {e}", exc_info=True)
        finally:
            logger.info(f"✅ Polling task ended for session {parlant_session_id}")

    @classmethod
    async def _start_session_polling(cls, parlant_session_id: str, initial_offset: int) -> Queue:
        """
        Start background polling for a session.
        세션에 대한 백그라운드 폴링 시작

        Args:
            parlant_session_id: Parlant session ID
            initial_offset: Starting offset for polling

        Returns:
            Event queue for receiving events
        """
        # Check if already polling
        # 이미 폴링 중인지 확인
        if parlant_session_id in cls._active_sessions:
            logger.info(f"Session {parlant_session_id} already has active polling")
            return cls._active_sessions[parlant_session_id]['queue']

        # Create event queue and session data
        # 이벤트 큐와 세션 데이터 생성
        event_queue = Queue()

        cls._active_sessions[parlant_session_id] = {
            'queue': event_queue,
            'last_offset': initial_offset,
            'is_active': True,
            'task': None
        }

        # Start background polling task
        # 백그라운드 폴링 태스크 시작
        task = asyncio.create_task(
            cls._continuous_polling_task(parlant_session_id, event_queue)
        )
        cls._active_sessions[parlant_session_id]['task'] = task

        logger.info(f"✅ Started continuous polling for session {parlant_session_id}")
        return event_queue

    @classmethod
    async def _stop_session_polling(cls, parlant_session_id: str):
        """
        Stop background polling for a session.
        세션에 대한 백그라운드 폴링 중지

        Args:
            parlant_session_id: Parlant session ID
        """
        session_data = cls._active_sessions.get(parlant_session_id)
        if not session_data:
            logger.warning(f"No active session found: {parlant_session_id}")
            return

        # Mark session as inactive
        # 세션을 비활성으로 표시
        session_data['is_active'] = False

        # Cancel the polling task
        # 폴링 태스크 취소
        task = session_data.get('task')
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

        # Remove from active sessions
        # 활성 세션에서 제거
        del cls._active_sessions[parlant_session_id]
        logger.info(f"✅ Stopped polling for session {parlant_session_id}")

    async def _get_or_create_customer(self, request: AgentRequest) -> str:
        """
        Get existing customer ID from user or create a new one.
        사용자의 기존 고객 ID를 가져오거나 새로 생성합니다.

        Uses the same customer ID as Research Paper agent (shared customer).
        Research Paper 에이전트와 동일한 고객 ID를 사용합니다 (공유 고객).

        Priority:
        1. Use parlant_customer_id from request context (if user has one)
        2. Fetch from database using user_id
        3. Create new customer with profile tag

        Args:
            request: AgentRequest with user_id, profile, context

        Returns:
            Parlant customer ID
        """
        # Check if customer ID is in context (passed from frontend/backend)
        # context에서 고객 ID 확인 (프론트엔드/백엔드에서 전달된 경우)
        if request.context and request.context.get('parlant_customer_id'):
            customer_id = request.context['parlant_customer_id']
            logger.info(f"✅ Using customer ID from context: {customer_id}")
            return customer_id

        # Try to get from database if user_id is available
        # user_id가 있으면 데이터베이스에서 가져오기 시도
        if request.user_id:
            try:
                from app.db.connection import Database, get_users_collection
                # Check if database is initialized before querying
                # 쿼리 전에 데이터베이스가 초기화되었는지 확인
                if Database.db is not None:
                    users = get_users_collection()
                    user = await users.find_one({"_id": __import__('bson').ObjectId(request.user_id)})
                    if user and user.get('parlant_customer_id'):
                        customer_id = user['parlant_customer_id']
                        logger.info(f"✅ Using customer ID from user DB: {customer_id}")
                        return customer_id
                else:
                    logger.debug("Database not initialized, skipping user lookup")
            except Exception as e:
                logger.warning(f"Could not fetch user parlant_customer_id: {e}")

        # Create new customer with profile tag
        # 프로필 태그로 새 고객 생성
        profile = request.profile or 'general'

        # Create or get profile tag
        tag_name = f"profile:{profile}"
        tag_id = None
        try:
            tag = await self.client.tags.create(name=tag_name)
            tag_id = tag.id
            logger.info(f"✅ Created profile tag: {tag_name}")
        except Exception:
            tags = await self.client.tags.list()
            profile_tags = [t for t in tags if t.name == tag_name]
            tag_id = profile_tags[0].id if profile_tags else None
            if tag_id:
                logger.info(f"✅ Found existing profile tag: {tag_name}")

        # Create customer with profile tag
        customer_name = f"session_{request.session_id}_{int(time.time())}"
        if tag_id:
            customer = await self.client.customers.create(
                name=customer_name,
                tags=[tag_id]
            )
            logger.info(f"✅ Created new customer with profile '{profile}': {customer.id}")
        else:
            customer = await self.client.customers.create(name=customer_name)
            logger.warning(f"⚠️ Created customer without profile tag: {customer.id}")

        return customer.id

    async def _get_valid_parlant_session(self, request: AgentRequest) -> tuple:
        """
        Get or create a valid Parlant session, with automatic recovery for stale sessions.
        스테일 세션에 대한 자동 복구 기능이 있는 유효한 Parlant 세션 가져오기/생성

        Args:
            request: AgentRequest with session_id, user_id, context

        Returns:
            Tuple of (parlant_session_id, customer_id, last_offset)
            - last_offset: The last event offset in the session (-1 for new sessions)
        """
        session_key = request.session_id

        # Debug: Log session key for room-based session separation
        logger.info(f"🔑 Parlant session lookup: session_key={session_key}, cache_keys={list(self._session_cache.keys())}")

        # If we have a cached session, validate it first
        if session_key in self._session_cache:
            parlant_session_id, customer_id = self._session_cache[session_key]

            try:
                # Validate session exists by trying to get it
                await self.client.sessions.retrieve(session_id=parlant_session_id)

                # Get existing events to find the last offset
                # 기존 이벤트를 가져와서 마지막 offset 찾기
                existing_events = await self.client.sessions.list_events(
                    session_id=parlant_session_id,
                    min_offset=0,
                    wait_for_data=0  # Don't wait, just get existing events
                )

                if existing_events:
                    last_offset = max(e.offset for e in existing_events)
                    logger.info(f"✅ Session validated: {parlant_session_id} (last_offset: {last_offset}, {len(existing_events)} events)")
                else:
                    last_offset = -1
                    logger.debug(f"✅ Session validated: {parlant_session_id} (no existing events)")

                return parlant_session_id, customer_id, last_offset

            except NotFoundError:
                # Session is stale, remove from cache and create new one
                logger.warning(f"⚠️ Stale session detected: {parlant_session_id}, creating new session...")
                del self._session_cache[session_key]

                # Also stop polling for the stale session if active
                if parlant_session_id in self._active_sessions:
                    await self._stop_session_polling(parlant_session_id)

        # Create new session
        customer_id = await self._get_or_create_customer(request)

        parlant_session = await self.client.sessions.create(
            agent_id=self._agent_id,
            customer_id=customer_id
        )

        self._session_cache[session_key] = (parlant_session.id, customer_id)
        logger.info(f"📝 Created new Parlant session: {parlant_session.id}")

        return parlant_session.id, customer_id, -1  # New session starts at -1

    async def process(self, request: AgentRequest) -> AgentResponse:
        """
        Process welfare/hospital search request
        
        Args:
            request: AgentRequest with query, session_id, context
        
        Returns:
            AgentResponse with answer, sources
        """
        await self._initialize()

        try:
            logger.info(f"🏥 Medical Welfare query: {request.query[:50]}...")

            # Get or create valid session (with automatic stale session recovery)
            # 유효한 세션 가져오기/생성 (스테일 세션 자동 복구 포함)
            parlant_session_id, _, last_offset = await self._get_valid_parlant_session(request)

            # Prepare message with context if available
            message_to_send = request.query

            # Inject user context if available
            if request.context and 'user_history' in request.context:
                user_history = request.context['user_history']
                summary = user_history.get('summary', '')
                keywords = user_history.get('keywords', [])

                if summary or keywords:
                    context_info = "[사용자 컨텍스트]\n"
                    if summary:
                        context_info += f"이전 대화 요약: {summary}\n"
                    if keywords:
                        context_info += f"관심 주제: {', '.join(keywords)}\n"
                    context_info += f"\n[현재 질문]\n{request.query}"

                    message_to_send = context_info
                    logger.info(f"✅ Context injected into Parlant message")

            # Start continuous polling if not already started (use last_offset from existing session)
            # 아직 시작하지 않았다면 연속 폴링 시작 (기존 세션의 last_offset 사용)
            if parlant_session_id not in self._active_sessions:
                event_queue = await self._start_session_polling(parlant_session_id, last_offset)
            else:
                event_queue = self._active_sessions[parlant_session_id]['queue']

            # Send message
            customer_event = await self.client.sessions.create_event(
                session_id=parlant_session_id,
                kind="message",
                source="customer",
                message=message_to_send,
                moderation="none"
            )

            logger.info(f"📝 Message sent, offset: {customer_event.offset}")

            # Collect response from event queue (continuous polling pattern)
            # 이벤트 큐에서 응답 수집 (연속 폴링 패턴)
            max_wait = 600  # 5 minutes total timeout
            start_time = time.time()
            agent_messages = []
            response_complete = False

            # Fallback idle detection
            idle_start_time = None
            idle_timeout = 60
            
            # Parlant 1:N pattern support - wait for additional messages after ready
            ready_received = False
            ready_timer_start = None
            ready_wait_timeout = 10  # Wait 10s after ready for more messages

            logger.info(f"📡 Listening for events from continuous polling (max {max_wait}s)")

            while True:
                elapsed = time.time() - start_time

                # Check total timeout
                if elapsed > max_wait:
                    logger.warning(f"⏰ Max wait time exceeded ({elapsed:.1f}s)")
                    break

                # Check ready timeout
                if ready_received and ready_timer_start is not None:
                    if time.time() - ready_timer_start > ready_wait_timeout:
                        logger.info(f"✅ Response complete (ready timeout expired)")
                        response_complete = True
                        break

                # Check if response is complete (only if explicitly set via other means, though we rely on ready timeout now)
                if response_complete:
                    break

                # Fallback idle timeout
                if idle_start_time is not None:
                    idle_duration = time.time() - idle_start_time
                    if agent_messages and idle_duration > idle_timeout:
                        logger.info(f"✅ Response complete (fallback: idle timeout)")
                        break

                try:
                    # Get event from queue with timeout
                    # 타임아웃으로 큐에서 이벤트 가져오기
                    event = await asyncio.wait_for(event_queue.get(), timeout=5.0)

                    # Check if it's an error dict
                    if isinstance(event, dict) and 'error' in event:
                        logger.error(f"❌ Error from polling: {event['error']}")
                        raise Exception(f"Polling error: {event['error']}")

                    # Reset idle timer on event
                    idle_start_time = None
                    
                    # Reset ready timer on any event
                    if ready_received:
                        ready_timer_start = time.time()

                    # Process message events
                    if hasattr(event, 'kind') and event.kind == 'message' and event.source in ('agent', 'ai_agent'):
                        # Reset ready timer on new message
                        if ready_received:
                            logger.info(f"📨 New message after ready - resetting timer")
                            ready_received = False
                            ready_timer_start = None
                            
                        agent_messages.append(event)
                        logger.info(f"📨 Received message (total: {len(agent_messages)})")

                    # Process status events
                    elif hasattr(event, 'kind') and event.kind == 'status':
                        event_data = event.data if isinstance(event.data, dict) else {}
                        status = event_data.get('status')

                        logger.debug(f"📊 Status event: {status}")

                        # ready = potentially response complete (start wait timer)
                        if status == 'ready' and agent_messages:
                            if not ready_received:
                                ready_received = True
                                ready_timer_start = time.time()
                                logger.info(f"✅ Agent status: ready - waiting {ready_wait_timeout}s for more messages")
                            
                        # error = agent error
                        elif status == 'error':
                            error_data = event_data.get('data', {})
                            error_msg = error_data.get('message', 'Unknown error')
                            logger.error(f"❌ Agent error: {error_msg}")
                            raise Exception(f"Parlant agent error: {error_msg}")

                        # cancelled
                        elif status == 'cancelled':
                            logger.warning(f"⚠️ Agent was cancelled")
                            break

                except asyncio.TimeoutError:
                    # No event in queue within timeout - start idle timer
                    # 타임아웃 내 큐에 이벤트 없음 - 유휴 타이머 시작
                    if idle_start_time is None:
                        idle_start_time = time.time()
                    continue
                except Exception as e:
                    logger.error(f"❌ Event processing error: {e}")
                    raise
            
            if agent_messages:
                # Combine messages
                full_answer = []
                for msg in agent_messages:
                    # Extract text from different possible structures
                    msg_text = None
                    
                    # Try direct message attribute first
                    if hasattr(msg, 'message') and msg.message:
                        msg_text = msg.message
                    # Try data dict
                    elif hasattr(msg, 'data'):
                        event_data = msg.data if isinstance(msg.data, dict) else {}
                        msg_text = event_data.get('message') or event_data.get('text', '')
                    
                    if msg_text and msg_text.strip():
                        full_answer.append(msg_text)
                        logger.debug(f"📝 Extracted message: {msg_text[:100]}...")
                
                answer_text = '\n'.join(full_answer)
                
                logger.info(f"📊 Combined {len(full_answer)} message parts ({len(answer_text)} chars)")
                
                # Extract metadata from last message
                event_data = agent_messages[-1].data if hasattr(agent_messages[-1], 'data') and isinstance(agent_messages[-1].data, dict) else {}
                summary = event_data.get('summary', {}) if isinstance(event_data, dict) else {}
                
                return AgentResponse(
                    answer=answer_text,
                    sources=[{
                        'type': 'medical_welfare',
                        'summary': summary
                    }],
                    papers=[],
                    tokens_used=self.estimate_context_usage(request.query),
                    status="success",
                    agent_type=self.agent_type,
                    metadata={
                        'parlant_session_id': parlant_session_id,
                        'profile': request.profile,
                        'language': request.language,
                        'server_port': 8801
                    }
                )
            else:
                raise Exception("No response received from Parlant")
        
        except Exception as e:
            logger.error(f"Medical Welfare error: {e}", exc_info=True)
            return AgentResponse(
                answer=f"검색 중 오류가 발생했습니다: {str(e)}",
                sources=[],
                papers=[],
                tokens_used=0,
                status="error",
                agent_type=self.agent_type,
                metadata={"error": str(e)}
            )
    
    async def process_stream(self, request: AgentRequest):
        """
        Stream responses from Parlant using continuous polling.
        연속 폴링을 사용하여 Parlant로부터 응답 스트림
        """
        await self._initialize()

        try:
            logger.info(f"🏥 Medical Welfare query (stream): {request.query[:50]}...")

            # Get or create valid session (with automatic stale session recovery)
            # 유효한 세션 가져오기/생성 (스테일 세션 자동 복구 포함)
            parlant_session_id, _, last_offset = await self._get_valid_parlant_session(request)

            # Prepare message with context if available
            message_to_send = request.query

            # Inject user context if available
            if request.context and 'user_history' in request.context:
                user_history = request.context['user_history']
                summary = user_history.get('summary', '')
                keywords = user_history.get('keywords', [])

                if summary or keywords:
                    context_info = "[사용자 컨텍스트]\n"
                    if summary:
                        context_info += f"이전 대화 요약: {summary}\n"
                    if keywords:
                        context_info += f"관심 주제: {', '.join(keywords)}\n"
                    context_info += f"\n[현재 질문]\n{request.query}"

                    message_to_send = context_info
                    logger.info(f"✅ Context injected into Parlant message")

            # Start continuous polling if not already started (use last_offset from existing session)
            # 아직 시작하지 않았다면 연속 폴링 시작 (기존 세션의 last_offset 사용)
            if parlant_session_id not in self._active_sessions:
                event_queue = await self._start_session_polling(parlant_session_id, last_offset)
            else:
                event_queue = self._active_sessions[parlant_session_id]['queue']

            # Send message
            customer_event = await self.client.sessions.create_event(
                session_id=parlant_session_id,
                kind="message",
                source="customer",
                message=message_to_send,
                moderation="none"
            )

            logger.info(f"📝 Message sent, offset: {customer_event.offset}")

            # Stream response from event queue (continuous polling pattern)
            # 이벤트 큐에서 응답 스트림 (연속 폴링 패턴)
            max_wait = 600  # 10 minutes total timeout
            start_time = time.time()
            response_complete = False
            message_count = 0

            # Fallback idle detection
            idle_start_time = None
            idle_timeout = 60

            # Parlant 1:N pattern support - wait for additional messages after ready
            # Parlant 1:N 패턴 지원 - ready 후에도 추가 메시지 대기
            ready_received = False
            ready_timer_start = None
            ready_wait_timeout = 60  # 60초 동안 추가 메시지 대기

            logger.info(f"📡 Streaming events from continuous polling (max {max_wait}s)")

            while True:
                elapsed = time.time() - start_time
                if elapsed > max_wait:
                    logger.warning(f"⏰ Stream max wait time exceeded")
                    break

                if response_complete:
                    logger.info(f"✅ Stream complete (ready timeout expired, total messages: {message_count})")
                    break

                # Check ready timeout - wait for additional messages after ready
                # ready 타임아웃 체크 - ready 후에도 추가 메시지 대기
                if ready_received and ready_timer_start is not None:
                    ready_elapsed = time.time() - ready_timer_start
                    if ready_elapsed > ready_wait_timeout:
                        logger.info(f"✅ Stream complete (no new messages for {ready_wait_timeout}s after ready)")
                        response_complete = True
                        break

                if idle_start_time is not None:
                    idle_duration = time.time() - idle_start_time
                    if message_count > 0 and idle_duration > idle_timeout:
                        logger.info(f"✅ Stream complete (fallback: idle timeout)")
                        break

                try:
                    # Get event from queue with timeout
                    event = await asyncio.wait_for(event_queue.get(), timeout=5.0)

                    # Check if it's an error dict
                    if isinstance(event, dict) and 'error' in event:
                        logger.error(f"❌ Error from polling: {event['error']}")
                        yield {
                            "answer": f"오류가 발생했습니다: {event['error']}",
                            "status": "error",
                            "agent_type": self.agent_type
                        }
                        return

                    # Reset timers on event (status 변경 시 타임아웃 초기화)
                    start_time = time.time()
                    idle_start_time = None
                    # Reset ready timer on any event (ready 타이머도 초기화)
                    if ready_received:
                        ready_timer_start = time.time()

                    # Process message events
                    # 메시지 이벤트 처리
                    if hasattr(event, 'kind') and event.kind == 'message' and event.source in ('agent', 'ai_agent'):
                        # Reset ready timer on new message (Parlant 1:N pattern)
                        # 새 메시지가 오면 ready 타이머 리셋 (Parlant 1:N 패턴)
                        if ready_received:
                            logger.info(f"📨 New message after ready - resetting timer")
                            ready_timer_start = None
                            ready_received = False

                        msg_text = None
                        if hasattr(event, 'message') and event.message:
                            msg_text = event.message
                        elif hasattr(event, 'data'):
                            event_data = event.data if isinstance(event.data, dict) else {}
                            msg_text = event_data.get('message') or event_data.get('text', '')

                        if msg_text and msg_text.strip():
                            message_count += 1
                            # First message: streaming, subsequent: new_message
                            status = "streaming" if message_count == 1 else "new_message"
                            logger.info(f"📨 Streaming message #{message_count} (status: {status})")
                            yield {
                                "answer": msg_text,
                                "content": msg_text,
                                "status": status,
                                "agent_type": self.agent_type,
                                "message_index": message_count
                            }

                    # Process status events
                    # 상태 이벤트 처리
                    elif hasattr(event, 'kind') and event.kind == 'status':
                        event_data = event.data if isinstance(event.data, dict) else {}
                        status = event_data.get('status')

                        if status == 'ready' and message_count > 0:
                            # Don't break immediately - start timer for additional messages (Parlant 1:N pattern)
                            # 바로 종료하지 않고 추가 메시지 대기 타이머 시작 (Parlant 1:N 패턴)
                            if not ready_received:
                                ready_received = True
                                ready_timer_start = time.time()
                                logger.info(f"⏱️ Agent status: ready - waiting {ready_wait_timeout}s for additional messages")
                            # Continue polling instead of breaking
                            # break 대신 계속 폴링
                        elif status == 'error':
                            error_data = event_data.get('data', {})
                            error_msg = error_data.get('message', 'Unknown error')
                            logger.error(f"❌ Agent error in stream: {error_msg}")
                            yield {
                                "answer": f"오류가 발생했습니다: {error_msg}",
                                "status": "error",
                                "agent_type": self.agent_type
                            }
                            return
                        elif status == 'cancelled':
                            logger.warning(f"⚠️ Agent was cancelled")
                            break

                except asyncio.TimeoutError:
                    # No event in queue within timeout - start idle timer
                    if idle_start_time is None:
                        idle_start_time = time.time()
                    continue
                except Exception as e:
                    logger.error(f"❌ Stream event processing error: {e}")
                    raise
            
        except Exception as e:
            logger.error(f"Medical Welfare stream error: {e}", exc_info=True)
            yield {
                "answer": f"Error: {str(e)}",
                "status": "error",
                "agent_type": self.agent_type
            }

    def estimate_context_usage(self, user_input: str) -> int:
        """Estimate token usage"""
        return int(len(user_input) * 1.5) + 600 + 2000 + 1500
    
    @classmethod
    async def shutdown_server(cls):
        """Shutdown Parlant server"""
        if cls._parlant_server_process is not None:
            logger.info("🛑 Shutting down Medical Welfare server...")
            cls._parlant_server_process.terminate()
            try:
                cls._parlant_server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                cls._parlant_server_process.kill()
            cls._parlant_server_process = None
            logger.info("✅ Server stopped")
        
        if cls._parlant_client is not None:
            cls._parlant_client = None
