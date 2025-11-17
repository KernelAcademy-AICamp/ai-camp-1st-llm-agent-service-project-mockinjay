"""
Base Agent
모든 Agent의 공통 인터페이스 및 기본 기능
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime


class BaseAgent(ABC):
    """모든 Agent의 기본 추상 클래스"""

    def __init__(self, agent_type: str):
        self.agent_type = agent_type
        self.created_at = datetime.utcnow()
        self.context_usage = 0  # 현재 컨텍스트 사용량 (토큰)

    @abstractmethod
    async def process(self, user_input: str, session_id: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        사용자 입력 처리 (각 Agent가 구현)

        Args:
            user_input: 사용자 입력 텍스트
            session_id: 세션 ID
            context: 추가 컨텍스트 정보

        Returns:
            Dict[str, Any]: 처리 결과
        """
        pass

    @abstractmethod
    def estimate_context_usage(self, user_input: str) -> int:
        """
        예상 컨텍스트 사용량 계산 (토큰 수)

        Args:
            user_input: 사용자 입력 텍스트

        Returns:
            int: 예상 토큰 수
        """
        pass

    def get_agent_info(self) -> Dict[str, Any]:
        """Agent 정보 반환"""
        return {
            "agent_type": self.agent_type,
            "created_at": self.created_at.isoformat(),
            "context_usage": self.context_usage,
        }

    def reset_context(self):
        """컨텍스트 사용량 초기화"""
        self.context_usage = 0
