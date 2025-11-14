"""
Session Manager
사용자 세션 관리 및 Agent 컨텍스트 연결
"""

from typing import Dict, Optional, List
from datetime import datetime, timedelta
import uuid


class SessionManager:
    """사용자 세션 및 Agent 컨텍스트 관리"""

    def __init__(self, session_timeout_minutes: int = 30):
        self.sessions: Dict[str, Dict] = {}
        self.session_timeout = timedelta(minutes=session_timeout_minutes)

    def create_session(self, user_id: str) -> str:
        """
        새 세션 생성

        Args:
            user_id: 사용자 ID

        Returns:
            str: 생성된 세션 ID
        """
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "active_agent": None,
            "conversation_history": [],
        }
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict]:
        """
        세션 정보 조회

        Args:
            session_id: 세션 ID

        Returns:
            Optional[Dict]: 세션 정보 또는 None
        """
        if session_id not in self.sessions:
            return None

        session = self.sessions[session_id]

        # 세션 타임아웃 확인
        if datetime.utcnow() - session["last_activity"] > self.session_timeout:
            self.delete_session(session_id)
            return None

        return session

    def update_session_activity(self, session_id: str, agent_type: Optional[str] = None) -> bool:
        """
        세션 활동 시간 업데이트

        Args:
            session_id: 세션 ID
            agent_type: 활성화된 Agent 타입

        Returns:
            bool: 업데이트 성공 여부
        """
        session = self.get_session(session_id)
        if not session:
            return False

        session["last_activity"] = datetime.utcnow()
        if agent_type:
            session["active_agent"] = agent_type

        return True

    def add_to_history(self, session_id: str, agent_type: str, user_input: str, agent_response: str) -> bool:
        """
        대화 히스토리 추가

        Args:
            session_id: 세션 ID
            agent_type: Agent 타입
            user_input: 사용자 입력
            agent_response: Agent 응답

        Returns:
            bool: 추가 성공 여부
        """
        session = self.get_session(session_id)
        if not session:
            return False

        session["conversation_history"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "agent_type": agent_type,
            "user_input": user_input,
            "agent_response": agent_response,
        })

        return True

    def get_conversation_history(self, session_id: str, limit: Optional[int] = None) -> List[Dict]:
        """
        대화 히스토리 조회

        Args:
            session_id: 세션 ID
            limit: 최대 개수 (None이면 전체)

        Returns:
            List[Dict]: 대화 히스토리
        """
        session = self.get_session(session_id)
        if not session:
            return []

        history = session["conversation_history"]
        if limit:
            return history[-limit:]
        return history

    def delete_session(self, session_id: str) -> bool:
        """
        세션 삭제

        Args:
            session_id: 세션 ID

        Returns:
            bool: 삭제 성공 여부
        """
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

    def get_active_sessions(self) -> List[str]:
        """
        활성 세션 목록 반환

        Returns:
            List[str]: 활성 세션 ID 목록
        """
        active_sessions = []
        current_time = datetime.utcnow()

        for session_id, session in self.sessions.items():
            if current_time - session["last_activity"] <= self.session_timeout:
                active_sessions.append(session_id)

        return active_sessions

    def cleanup_expired_sessions(self) -> int:
        """
        만료된 세션 정리

        Returns:
            int: 정리된 세션 개수
        """
        expired_sessions = []
        current_time = datetime.utcnow()

        for session_id, session in self.sessions.items():
            if current_time - session["last_activity"] > self.session_timeout:
                expired_sessions.append(session_id)

        for session_id in expired_sessions:
            self.delete_session(session_id)

        return len(expired_sessions)
