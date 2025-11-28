"""
원격 에이전트 - 별도 서버로 동작하는 에이전트 어댑터 (Parlant 등)
"""

import httpx
import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from enum import Enum

from ..base_agent import BaseAgent
from ..core.types import AgentType
from ..core.contracts import AgentRequest, AgentResponse
from ..core.exceptions import (
    AgentServerUnavailableError,
    AgentTimeoutError,
    AgentCircuitOpenError,
    AgentResponseParseError,
    AgentServerError,
    AgentSessionNotFoundError,
    AgentHTTPError,
    AgentExecutionError
)

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    CLOSED = "closed"      # 정상
    OPEN = "open"          # 장애 (요청 차단)
    HALF_OPEN = "half_open"  # 복구 시도


class CircuitBreaker:
    """서킷 브레이커 패턴 구현"""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = CircuitState.CLOSED
    
    def should_allow_request(self) -> bool:
        """요청 허용 여부 판단"""
        if self.state == CircuitState.CLOSED:
            return True
        
        if self.state == CircuitState.OPEN:
            # 복구 시간이 지났는지 확인
            if self.last_failure_time and \
               datetime.now() - self.last_failure_time > timedelta(seconds=self.recovery_timeout):
                self.state = CircuitState.HALF_OPEN
                return True
            return False
        
        if self.state == CircuitState.HALF_OPEN:
            return True
        
        return False
    
    def record_success(self):
        """성공 기록"""
        self.failure_count = 0
        self.state = CircuitState.CLOSED
    
    def record_failure(self):
        """실패 기록"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.error(f"Circuit breaker opened after {self.failure_count} failures")


class RemoteAgent(BaseAgent):
    """
    별도 서버로 동작하는 에이전트 어댑터 (Parlant 등)
    
    HTTP를 통해 원격 서버와 통신하며, 동일한 BaseAgent 인터페이스 제공
    """
    
    def __init__(
        self,
        agent_type: str,
        server_url: str,
        server_port: int = 8800,
        timeout: float = 30.0,
        max_retries: int = 3,
        backoff_factor: float = 2.0,
        max_polling_duration: float = 120.0,  # 최대 폴링 시간 (2분)
        polling_interval: float = 0.5,  # 초기 폴링 간격
    ):
        super().__init__(agent_type)
        self.server_url = server_url
        self.server_port = server_port
        self.base_url = f"http://{server_url}:{server_port}"
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.max_polling_duration = max_polling_duration
        self.polling_interval = polling_interval
        
        # Circuit breaker 초기화
        self.circuit_breaker = CircuitBreaker()
        
        # HTTP 클라이언트 (재사용)
        self.http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
    
    @property
    def execution_type(self) -> AgentType:
        """원격 실행 타입"""
        return AgentType.REMOTE
    
    async def process(self, request: AgentRequest) -> AgentResponse:
        """
        통일된 계약 기반 처리 (에러 처리 강화)
        
        Parlant 서버는 이벤트 기반 스트리밍 방식이므로:
        1. 세션 생성/조회
        2. 메시지 전송
        3. 이벤트 폴링 (typing, message, ready 상태 추적)
        4. 최종 응답 수집
        """
        # Circuit breaker 체크
        if not self.circuit_breaker.should_allow_request():
            raise AgentCircuitOpenError(
                f"{self.agent_type} server is unavailable (circuit open)"
            )
        
        # 재시도 로직
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                result = await self._execute_with_timeout(request)
                self.circuit_breaker.record_success()
                return result
            
            except (httpx.ConnectError, httpx.TimeoutException) as e:
                last_exception = e
                logger.warning(
                    f"Attempt {attempt + 1}/{self.max_retries} failed: {e}"
                )
                
                if attempt < self.max_retries - 1:
                    # Exponential backoff
                    wait_time = self.backoff_factor ** attempt
                    await asyncio.sleep(wait_time)
            
            except AgentResponseParseError as e:
                # 파싱 에러는 재시도 안 함 (서버 버그)
                logger.error(f"Response parsing error: {e}")
                self.circuit_breaker.record_failure()
                raise
            
            except Exception as e:
                logger.error(f"Unexpected error: {e}", exc_info=True)
                self.circuit_breaker.record_failure()
                raise
        
        # 모든 재시도 실패
        self.circuit_breaker.record_failure()
        raise AgentServerUnavailableError(
            f"Failed to connect to {self.agent_type} after {self.max_retries} attempts",
            agent_type=self.agent_type,
            original_error=last_exception
        )
    
    async def _execute_with_timeout(self, request: AgentRequest) -> AgentResponse:
        """타임아웃 적용된 실행"""
        try:
            return await asyncio.wait_for(
                self._execute_request(request),
                timeout=self.max_polling_duration
            )
        except asyncio.TimeoutError:
            raise AgentTimeoutError(
                f"{self.agent_type} exceeded max polling duration "
                f"({self.max_polling_duration}s)",
                timeout_seconds=self.max_polling_duration
            )
    
    async def _execute_request(self, request: AgentRequest) -> AgentResponse:
        """실제 요청 실행 - 서브클래스에서 오버라이드 가능"""
        # 기본 구현: Parlant 프로토콜
        # 1. Parlant 세션 관리
        session_id = await self._get_or_create_session(request.session_id)
        
        # 2. 메시지 전송
        await self._send_message(session_id, request.query)
        
        # 3. 이벤트 폴링 (개선된 종료 조건)
        events = await self._poll_events_until_ready(session_id)
        
        # 4. 응답 추출 및 변환
        return self._convert_events_to_response(events, request)
    
    async def _get_or_create_session(self, session_id: str) -> str:
        """Parlant 세션 생성 또는 조회 - 서브클래스에서 구현"""
        # GET /sessions/{session_id} or POST /sessions
        raise NotImplementedError("Subclass must implement _get_or_create_session")
    
    async def _send_message(self, session_id: str, message: str):
        """Parlant 세션에 메시지 전송 - 서브클래스에서 구현"""
        # POST /sessions/{session_id}/messages
        raise NotImplementedError("Subclass must implement _send_message")
    
    async def _poll_events_until_ready(self, session_id: str) -> list:
        """
        개선된 이벤트 폴링 (명확한 종료 조건)
        
        종료 조건:
        1. ready 상태 + 모든 active trace 완료
        2. 타임아웃 (외부에서 처리)
        3. 에러 이벤트 발생
        """
        active_trace_ids = set()
        offset = 0
        all_events = []
        start_time = datetime.now()
        current_interval = self.polling_interval
        
        while True:
            # 폴링 간격 동적 조정 (adaptive polling)
            elapsed = (datetime.now() - start_time).total_seconds()
            if elapsed > 10:  # 10초 이상 걸리면 간격 늘림
                current_interval = min(2.0, current_interval * 1.2)
            
            try:
                events = await self._fetch_events(
                    session_id,
                    offset,
                    wait_for_data=int(current_interval)
                )
            except httpx.HTTPStatusError as e:
                if e.response.status_code >= 500:
                    raise AgentServerError(f"Server error: {e}")
                elif e.response.status_code == 404:
                    raise AgentSessionNotFoundError(f"Session {session_id} not found")
                else:
                    raise AgentHTTPError(f"HTTP {e.response.status_code}: {e}")
            
            # 빈 이벤트 처리
            if not events:
                await asyncio.sleep(current_interval)
                continue
            
            for event in events:
                all_events.append(event)
                
                # 에러 이벤트 체크
                if event.get("kind") == "status" and event.get("data", {}).get("status") == "error":
                    error_msg = event.get("data", {}).get("message", "Unknown error")
                    raise AgentExecutionError(f"Agent error: {error_msg}")
                
                # Trace ID 추출 (안전하게)
                correlation_id = event.get("correlation_id", "")
                if not correlation_id:
                    logger.warning(f"Event without correlation_id: {event.get('kind')}")
                    continue
                
                trace_id = correlation_id.split("::")[0] if "::" in correlation_id else correlation_id
                
                # Message 이벤트 추적
                if event.get("kind") == "message" and event.get("source") == "agent":
                    active_trace_ids.add(trace_id)
                
                # Ready 상태에서 trace 제거
                if event.get("kind") == "status":
                    status = event.get("data", {}).get("status")
                    if status == "ready":
                        active_trace_ids.discard(trace_id)
            
            # 종료 조건 체크
            has_ready = any(
                e.get("kind") == "status" and e.get("data", {}).get("status") == "ready"
                for e in events
            )
            
            if has_ready and len(active_trace_ids) == 0:
                logger.info(f"Polling complete: {len(all_events)} events collected")
                break
            
            # Offset 업데이트
            if events:
                max_offset = max(e.get("offset", offset) for e in events)
                offset = max_offset + 1
            
            # 다음 폴링까지 대기
            await asyncio.sleep(current_interval)
        
        return all_events
    
    async def _fetch_events(
        self, session_id: str, offset: int, wait_for_data: int = 60
    ) -> list:
        """이벤트 목록 조회 (Long Polling) - 서브클래스에서 구현"""
        # GET /sessions/{session_id}/events?min_offset=X&wait_for_data=60
        raise NotImplementedError("Subclass must implement _fetch_events")
    
    def _convert_events_to_response(
        self, events: list, request: AgentRequest
    ) -> AgentResponse:
        """Parlant 이벤트를 AgentResponse로 변환 (안전한 파싱)"""
        try:
            # Message 이벤트추출
            messages = []
            for e in events:
                if e.get("kind") == "message" and e.get("source") == "agent":
                    data = e.get("data", {})
                    if isinstance(data, dict):
                        msg = data.get("message", "")
                        if msg:
                            messages.append(msg)
            
            # Tool 이벤트 추출 (논문 검색 등)
            tools = []
            for e in events:
                if e.get("kind") == "tool":
                    tool_data = e.get("data", {})
                    if isinstance(tool_data, dict):
                        tools.append(tool_data)
            
            # 응답 생성
            answer = "\n".join(messages) if messages else ""
            
            return AgentResponse(
                answer=answer,
                sources=[],  # Tool 이벤트에서 추출
                papers=tools,  # Parlant 도구 결과
                tokens_used=0,  # Parlant은 토큰 정보 제공 안 함
                status="success",
                agent_type=self.agent_type,
                metadata={
                    "event_count": len(events),
                    "message_count": len(messages),
                    "tool_count": len(tools),
                },
            )
        
        except Exception as e:
            raise AgentResponseParseError(
                f"Failed to parse Parlant events: {e}",
                events=events,
                original_error=e
            )
    
    @property
    def metadata(self) -> Dict[str, Any]:
        """원격 에이전트 메타데이터"""
        return {
            "name": f"{self.agent_type} (Remote)",
            "description": "Remote agent via Parlant server",
            "execution_type": "remote",
            "server_url": self.base_url,
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """헬스 체크"""
        try:
            response = await self.http_client.get(
                f"{self.base_url}/health",
                timeout=5.0
            )
            response.raise_for_status()
            
            return {
                "status": "healthy",
                "url": self.base_url,
                "circuit_state": self.circuit_breaker.state.value,
                "response_time": response.elapsed.total_seconds() if hasattr(response, 'elapsed') else None,
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "url": self.base_url,
                "circuit_state": self.circuit_breaker.state.value,
                "error": str(e),
            }
    
    async def close(self):
        """리소스 정리"""
        await self.http_client.aclose()
