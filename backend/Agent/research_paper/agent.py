"""
Research Paper Agent Implementation
연구논문 검색 기능 구현
"""

from typing import Dict, Any, Optional
from ..base_agent import BaseAgent
from .prompts import RESEARCH_PAPER_SYSTEM_PROMPT


class ResearchPaperAgent(BaseAgent):
    """연구논문 검색 Agent"""

    def __init__(self):
        super().__init__(agent_type="research_paper")

    async def process(
        self,
        user_input: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        연구논문 검색 처리

        Args:
            user_input: 검색 쿼리
            session_id: 세션 ID
            context: 추가 컨텍스트

        Returns:
            Dict[str, Any]: 검색 결과
        """
        # TODO: 논문 데이터베이스 API 연동 (PubMed, arXiv 등)

        tokens_used = self.estimate_context_usage(user_input)
        self.context_usage += tokens_used

        return {
            "response": f"연구논문 검색: '{user_input}'에 대한 논문을 검색 중입니다.",
            "tokens_used": tokens_used,
            "data": {
                "query": user_input,
                "papers": [],  # 검색된 논문 목록
                "summary": "",  # 검색 결과 요약
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
        estimated_tokens = int(len(user_input) * 1.5)
        estimated_tokens += 600  # 시스템 프롬프트
        estimated_tokens += 1500  # 논문 검색 결과 (긴 응답)

        return estimated_tokens
