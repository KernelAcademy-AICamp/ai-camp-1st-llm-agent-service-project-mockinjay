"""
Medical Welfare Agent - Refactored for Independent Parlant Server
Port 8801에서 실행되는 medical_welfare_server.py와 통신
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

logger = logging.getLogger(__name__)


@AgentRegistry.register("medical_welfare")
class MedicalWelfareAgent(LocalAgent):
    """
    Medical Welfare Agent - Parlant Remote Agent
    
    Connects to independent medical_welfare_server.py (port 8801)
    """
    
    # Class variables for singleton pattern
    _parlant_client: Optional[AsyncParlantClient] = None
    _parlant_server_process = None
    _server_url = "http://localhost:8801"  # Dedicated medical_welfare_server.py
    _agent_id = None
    _session_cache = {}
    
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
            
            # Get or create session
            session_key = request.session_id
            if session_key not in self._session_cache:
                profile = request.profile or 'general'
                
                # Create or get profile tag
                tag_name = f"profile:{profile}"
                tag_id = None
                try:
                    # Try to create tag (will fail if exists)
                    tag = await self.client.tags.create(name=tag_name)
                    tag_id = tag.id
                    logger.info(f"✅ Created profile tag: {tag_name}")
                except Exception:
                    # Tag already exists, find it
                    tags = await self.client.tags.list()
                    profile_tags = [t for t in tags if t.name == tag_name]
                    tag_id = profile_tags[0].id if profile_tags else None
                    if tag_id:
                        logger.info(f"✅ Found existing profile tag: {tag_name}")
                
                # Create customer with profile tag
                customer_name = f"session_{session_key}_{int(time.time())}"
                if tag_id:
                    customer = await self.client.customers.create(
                        name=customer_name,
                        tags=[tag_id]
                    )
                    logger.info(f"✅ Customer with profile '{profile}': {customer.id}")
                else:
                    customer = await self.client.customers.create(name=customer_name)
                    logger.warning(f"⚠️ Customer without profile tag: {customer.id}")

                
                # Create session
                parlant_session = await self.client.sessions.create(
                    agent_id=self._agent_id,
                    customer_id=customer.id
                )
                
                self._session_cache[session_key] = (parlant_session.id, customer.id)
                logger.info(f"📝 Created Parlant session: {parlant_session.id}")
            
            parlant_session_id, _ = self._session_cache[session_key]
            
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
            
            # Send message
            customer_event = await self.client.sessions.create_event(
                session_id=parlant_session_id,
                kind="message",
                source="customer",
                message=message_to_send,
                moderation="none"
            )
            
            logger.info(f"📝 Message sent, offset: {customer_event.offset}")
            
            # Poll for response - Simple timeout-based approach (Parlant standard pattern)
            max_wait = 600  # 5 minutes total
            poll_interval = 60
            start_time = time.time()
            last_offset = customer_event.offset
            agent_messages = []
            idle_start_time = None  # Track when we started being idle
            idle_timeout = 300  # Exit if no messages for 60 seconds
            
            logger.info(f"📡 Starting to poll for messages (max {max_wait}s, idle timeout {idle_timeout}s)")
            
            while True:
                elapsed = time.time() - start_time
                
                # Check total timeout
                if elapsed > max_wait:
                    logger.warning(f"⏰ Max wait time exceeded ({elapsed:.1f}s)")
                    break
                
                # Check idle timeout
                if idle_start_time is not None:
                    idle_duration = time.time() - idle_start_time
                    if agent_messages and idle_duration > idle_timeout:
                        logger.info(f"✅ Response complete (no new messages for {idle_duration:.1f}s)")
                        break
                
                try:
                    # Poll for all events to keep connection alive during tool execution
                    events = await self.client.sessions.list_events(
                        session_id=parlant_session_id,
                        min_offset=last_offset + 1,
                        wait_for_data=poll_interval
                    )
                    
                    if events:
                        # Reset idle timer on ANY event (tool calls, status updates, etc.)
                        idle_start_time = None
                        last_offset = max(e.offset for e in events)

                    # Filter agent messages
                    new_messages = [
                        e for e in events
                        if e.kind == 'message' and e.source in ('agent', 'ai_agent')
                    ]
                    
                    if new_messages:
                        agent_messages.extend(new_messages)
                        logger.info(f"📨 Received {len(new_messages)} messages (total: {len(agent_messages)})")
                    elif not events:
                        # No events at all - start idle timer
                        if idle_start_time is None:
                            idle_start_time = time.time()
                
                except Exception as e:
                    # 504 is normal for long polling - just means no new events
                    if "504" in str(e) or "Gateway Timeout" in str(e):
                        logger.debug(f"⏳ No new events (504 timeout)")
                        # Start idle timer if not started
                        if idle_start_time is None:
                            idle_start_time = time.time()
                        continue
                    else:
                        logger.error(f"❌ Polling error: {e}")
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
