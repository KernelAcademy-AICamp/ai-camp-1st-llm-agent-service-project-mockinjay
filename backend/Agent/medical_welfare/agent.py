"""
Medical Welfare Agent Implementation
의료복지 검색 기능 구현
"""

from typing import Dict, Any, Optional
from ..base_agent import BaseAgent
from .prompts import MEDICAL_WELFARE_SYSTEM_PROMPT


class MedicalWelfareAgent(BaseAgent):
    """의료복지 정보 검색 Agent"""

    def __init__(self):
        super().__init__(agent_type="medical_welfare")

    async def process(
        self,
        user_input: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        의료복지 검색 처리

        Args:
            user_input: 사용자 질문
            session_id: 세션 ID
            context: 추가 컨텍스트

        Returns:
            Dict[str, Any]: 검색 결과
        """
        # TODO: LLM 연동 및 의료복지 데이터베이스 검색 로직 구현
        # 현재는 기본 응답 반환

        tokens_used = self.estimate_context_usage(user_input)
        self.context_usage += tokens_used

        return {
            "response": f"의료복지 검색 결과: {user_input}에 대한 정보를 찾고 있습니다.",
            "tokens_used": tokens_used,
            "data": {
                "query": user_input,
                "results": [],  # 실제 검색 결과
            },
            "metadata": {
                "agent_type": self.agent_type,
                "session_id": session_id,
            }
        }

    def estimate_context_usage(self, user_input: str) -> int:
        """
        컨텍스트 사용량 추정

        Args:
            user_input: 사용자 입력

        Returns:
            int: 예상 토큰 수
        """
        # 간단한 토큰 추정 (실제로는 tiktoken 등 사용)
        # 평균적으로 한글 1글자 = 약 1.5 토큰
        estimated_tokens = int(len(user_input) * 1.5)

        # 시스템 프롬프트 + 응답 예상 토큰 추가
        estimated_tokens += 500  # 기본 시스템 토큰
        estimated_tokens += 1000  # 예상 응답 토큰

        return estimated_tokens
