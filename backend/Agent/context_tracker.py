"""
Context Tracker
세션별 컨텍스트 사용량 추적 및 제한 관리
"""

from typing import Dict, Optional
from datetime import datetime


class ContextTracker:
    """컨텍스트 사용량 추적 및 제한 관리"""

    # 세션당 최대 컨텍스트 제한 (토큰)
    MAX_CONTEXT_LIMIT = 20000

    def __init__(self):
        # session_id -> {agent_type -> usage}
        self.session_usage: Dict[str, Dict[str, int]] = {}
        self.session_timestamps: Dict[str, datetime] = {}

    def track_usage(self, session_id: str, agent_type: str, tokens_used: int) -> None:
        """
        컨텍스트 사용량 기록

        Args:
            session_id: 세션 ID
            agent_type: Agent 타입
            tokens_used: 사용된 토큰 수
        """
        if session_id not in self.session_usage:
            self.session_usage[session_id] = {}
            self.session_timestamps[session_id] = datetime.utcnow()

        if agent_type not in self.session_usage[session_id]:
            self.session_usage[session_id][agent_type] = 0

        self.session_usage[session_id][agent_type] += tokens_used

    def get_total_usage(self, session_id: str) -> int:
        """
        세션의 총 컨텍스트 사용량 반환

        Args:
            session_id: 세션 ID

        Returns:
            int: 총 사용량 (토큰)
        """
        if session_id not in self.session_usage:
            return 0

        return sum(self.session_usage[session_id].values())

    def get_agent_usage(self, session_id: str, agent_type: str) -> int:
        """
        특정 Agent의 컨텍스트 사용량 반환

        Args:
            session_id: 세션 ID
            agent_type: Agent 타입

        Returns:
            int: 사용량 (토큰)
        """
        if session_id not in self.session_usage:
            return 0

        return self.session_usage[session_id].get(agent_type, 0)

    def check_limit(self, session_id: str, estimated_tokens: int = 0) -> Dict[str, any]:
        """
        컨텍스트 제한 확인

        Args:
            session_id: 세션 ID
            estimated_tokens: 예상 사용 토큰 수

        Returns:
            Dict: {
                "within_limit": bool,
                "current_usage": int,
                "max_limit": int,
                "remaining": int,
                "would_exceed": bool (estimated_tokens 제공 시)
            }
        """
        current_usage = self.get_total_usage(session_id)
        remaining = self.MAX_CONTEXT_LIMIT - current_usage
        would_exceed = (current_usage + estimated_tokens) > self.MAX_CONTEXT_LIMIT if estimated_tokens > 0 else False

        return {
            "within_limit": current_usage < self.MAX_CONTEXT_LIMIT,
            "current_usage": current_usage,
            "max_limit": self.MAX_CONTEXT_LIMIT,
            "remaining": max(0, remaining),
            "would_exceed": would_exceed,
        }

    def reset_session(self, session_id: str) -> None:
        """
        세션 컨텍스트 초기화

        Args:
            session_id: 세션 ID
        """
        if session_id in self.session_usage:
            del self.session_usage[session_id]
        if session_id in self.session_timestamps:
            del self.session_timestamps[session_id]

    def get_session_summary(self, session_id: str) -> Optional[Dict[str, any]]:
        """
        세션 요약 정보 반환

        Args:
            session_id: 세션 ID

        Returns:
            Dict: 세션 요약 정보 또는 None
        """
        if session_id not in self.session_usage:
            return None

        return {
            "session_id": session_id,
            "total_usage": self.get_total_usage(session_id),
            "usage_by_agent": self.session_usage[session_id].copy(),
            "created_at": self.session_timestamps[session_id].isoformat(),
            "limit_status": self.check_limit(session_id),
        }
