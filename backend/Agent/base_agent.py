"""
Base Agent
모든 Agent의 공통 인터페이스 및 기본 기능
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
from .core.contracts import AgentRequest, AgentResponse
from .core.types import AgentType


class BaseAgent(ABC):
    """모든 Agent의 기본 추상 클래스"""

    def __init__(self, agent_type: str):
        self.agent_type = agent_type
        self.created_at = datetime.utcnow()
        self.context_usage = 0  # 현재 컨텍스트 사용량 (토큰)

    @abstractmethod
    async def process(self, request: AgentRequest) -> AgentResponse:
        """
        통일된 계약 기반 처리
        
        Args:
            request: AgentRequest (query, session_id, context 등)
            
        Returns:
            AgentResponse: 통일된 응답 형식
        """
        pass

    async def process_stream(self, request: AgentRequest):
        """
        스트리밍 처리 (기본 구현: process 호출 후 결과 반환)
        Override this method for true streaming.
        
        Yields:
            AgentResponse or dict: Partial results or final response
        """
        response = await self.process(request)
        yield response
    
    @property
    @abstractmethod
    def metadata(self) -> Dict[str, Any]:
        """
        에이전트 메타데이터 (자동 등록용)
        
        Returns:
            Dict containing name, description, version, capabilities, etc.
        """
        pass
    
    @property
    @abstractmethod
    def execution_type(self) -> AgentType:
        """
        에이전트 실행 타입 (LOCAL or REMOTE)
        
        Returns:
            AgentType: LOCAL or REMOTE
        """
        pass

    def estimate_context_usage(self, user_input: str) -> int:
        """
        예상 컨텍스트 사용량 계산 (토큰 수)

        Args:
            user_input: 사용자 입력 텍스트

        Returns:
            int: 예상 토큰 수
        """
        # 기본 구현: 단어 수 * 1.3 (한국어 토큰 대략 추정)
        return int(len(user_input.split()) * 1.3)

    def get_agent_info(self) -> Dict[str, Any]:
        """Agent 정보 반환"""
        return {
            "agent_type": self.agent_type,
            "created_at": self.created_at.isoformat(),
            "context_usage": self.context_usage,
            "execution_type": self.execution_type.value,
            "metadata": self.metadata,
        }

    def reset_context(self):
        """컨텍스트 사용량 초기화"""
        self.context_usage = 0
