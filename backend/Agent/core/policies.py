"""
Policy Engine - 에이전트 정책 관리
"""
from typing import Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class PolicyEngine:
    """정책 엔진 - 토큰 제한 및 사용량 관리"""

    # 세션당 최대 토큰 수
    MAX_TOKENS_PER_SESSION = 20000

    # 세션 만료 시간 (24시간)
    SESSION_EXPIRY_HOURS = 24

    def __init__(self):
        """정책 엔진 초기화"""
        self.session_tokens: Dict[str, int] = {}
        self.session_timestamps: Dict[str, datetime] = {}

    def check_and_update(self, session_id: str, tokens: int) -> bool:
        """
        세션의 토큰 사용량을 확인하고 업데이트

        Args:
            session_id: 세션 ID
            tokens: 사용할 토큰 수

        Returns:
            bool: 토큰 사용 가능 여부
        """
        # 만료된 세션 정리
        self._cleanup_expired_sessions()

        # 현재 세션의 사용량 조회
        current = self.session_tokens.get(session_id, 0)

        # 제한 확인
        if current + tokens > self.MAX_TOKENS_PER_SESSION:
            logger.warning(
                f"Token limit exceeded for session {session_id}: "
                f"current={current}, requested={tokens}, limit={self.MAX_TOKENS_PER_SESSION}"
            )
            return False

        # 사용량 업데이트
        self.session_tokens[session_id] = current + tokens
        self.session_timestamps[session_id] = datetime.utcnow()

        logger.info(
            f"Session {session_id} token usage updated: {current} -> {current + tokens}"
        )

        return True

    def get_remaining_tokens(self, session_id: str) -> int:
        """
        세션의 남은 토큰 수 조회

        Args:
            session_id: 세션 ID

        Returns:
            int: 남은 토큰 수
        """
        current = self.session_tokens.get(session_id, 0)
        return max(0, self.MAX_TOKENS_PER_SESSION - current)

    def reset_session(self, session_id: str) -> None:
        """
        세션 토큰 사용량 초기화

        Args:
            session_id: 세션 ID
        """
        if session_id in self.session_tokens:
            del self.session_tokens[session_id]
        if session_id in self.session_timestamps:
            del self.session_timestamps[session_id]
        logger.info(f"Session {session_id} reset")

    def _cleanup_expired_sessions(self) -> None:
        """만료된 세션 정리"""
        now = datetime.utcnow()
        expiry_time = timedelta(hours=self.SESSION_EXPIRY_HOURS)

        expired_sessions = [
            session_id
            for session_id, timestamp in self.session_timestamps.items()
            if now - timestamp > expiry_time
        ]

        for session_id in expired_sessions:
            self.reset_session(session_id)
            logger.info(f"Expired session cleaned up: {session_id}")

    def get_session_info(self, session_id: str) -> Dict:
        """
        세션 정보 조회

        Args:
            session_id: 세션 ID

        Returns:
            Dict: 세션 정보
        """
        return {
            "session_id": session_id,
            "tokens_used": self.session_tokens.get(session_id, 0),
            "tokens_remaining": self.get_remaining_tokens(session_id),
            "max_tokens": self.MAX_TOKENS_PER_SESSION,
            "last_updated": self.session_timestamps.get(session_id),
            "is_expired": self._is_session_expired(session_id)
        }

    def _is_session_expired(self, session_id: str) -> bool:
        """
        세션 만료 여부 확인

        Args:
            session_id: 세션 ID

        Returns:
            bool: 만료 여부
        """
        if session_id not in self.session_timestamps:
            return True

        now = datetime.utcnow()
        timestamp = self.session_timestamps[session_id]
        expiry_time = timedelta(hours=self.SESSION_EXPIRY_HOURS)

        return now - timestamp > expiry_time
