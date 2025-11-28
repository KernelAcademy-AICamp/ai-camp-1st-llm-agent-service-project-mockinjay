"""
Session Manager
사용자 세션 관리 및 Agent 컨텍스트 연결
"""

from typing import Dict, Optional, List
from datetime import datetime, timedelta
import uuid


class SessionManager:
    """사용자 세션 및 Agent 컨텍스트 관리"""

    def __init__(self, session_timeout_minutes: int = 30, idle_timeout_minutes: int = 10):
        self.sessions: Dict[str, Dict] = {}
        self.session_timeout = timedelta(minutes=session_timeout_minutes)
        self.idle_timeout = timedelta(minutes=idle_timeout_minutes)
        # 사용자별 채팅방(room) 관리
        self.user_rooms: Dict[str, List[str]] = {}  # user_id -> [room_ids]

    def create_session(self, user_id: str, room_id: Optional[str] = None) -> str:
        """
        새 세션 생성

        Args:
            user_id: 사용자 ID
            room_id: 채팅방 ID (없으면 자동 생성)

        Returns:
            str: 생성된 세션 ID
        """
        session_id = str(uuid.uuid4())
        if not room_id:
            room_id = f"room_{str(uuid.uuid4())}"

        self.sessions[session_id] = {
            "user_id": user_id,
            "room_id": room_id,
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "active_agent": None,
            "conversation_history": [],
        }

        # 사용자별 채팅방 목록에 추가
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = []
        if room_id not in self.user_rooms[user_id]:
            self.user_rooms[user_id].append(room_id)

        return session_id

    def get_session(self, session_id: str, check_idle: bool = True) -> Optional[Dict]:
        """
        세션 정보 조회

        Args:
            session_id: 세션 ID
            check_idle: idle 타임아웃 체크 여부

        Returns:
            Optional[Dict]: 세션 정보 또는 None
        """
        if session_id not in self.sessions:
            return None

        session = self.sessions[session_id]
        current_time = datetime.utcnow()

        # 세션 타임아웃 확인 (전체 세션 만료)
        if current_time - session["created_at"] > self.session_timeout:
            self.delete_session(session_id)
            return None

        # idle 타임아웃 확인 (대화 기록 자동 삭제)
        if check_idle and current_time - session["last_activity"] > self.idle_timeout:
            # 대화 기록만 삭제, 세션은 유지
            session["conversation_history"] = []
            session["last_activity"] = current_time

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

    def get_conversation_history_by_agent(self, session_id: str, agent_type: str, limit: Optional[int] = None) -> List[Dict]:
        """
        특정 에이전트의 대화 히스토리만 조회

        Args:
            session_id: 세션 ID
            agent_type: 에이전트 타입
            limit: 최대 개수 (None이면 전체)

        Returns:
            List[Dict]: 해당 에이전트의 대화 히스토리
        """
        session = self.get_session(session_id)
        if not session:
            return []

        # 특정 에이전트의 대화만 필터링
        agent_history = [
            conv for conv in session["conversation_history"]
            if conv.get("agent_type") == agent_type
        ]

        if limit:
            return agent_history[-limit:]
        return agent_history

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

    def get_user_rooms(self, user_id: str) -> List[str]:
        """
        사용자의 채팅방 목록 조회

        Args:
            user_id: 사용자 ID

        Returns:
            List[str]: 채팅방 ID 목록
        """
        return self.user_rooms.get(user_id, [])

    def get_room_sessions(self, room_id: str) -> List[str]:
        """
        특정 채팅방의 세션 목록 조회

        Args:
            room_id: 채팅방 ID

        Returns:
            List[str]: 세션 ID 목록
        """
        room_sessions = []
        for session_id, session in self.sessions.items():
            if session.get("room_id") == room_id:
                room_sessions.append(session_id)
        return room_sessions

    def cleanup_expired_sessions(self) -> int:
        """
        만료된 세션 정리

        Returns:
            int: 정리된 세션 개수
        """
        expired_sessions = []
        current_time = datetime.utcnow()

        for session_id, session in self.sessions.items():
            # 전체 세션 타임아웃으로 삭제
            if current_time - session["created_at"] > self.session_timeout:
                expired_sessions.append(session_id)

        for session_id in expired_sessions:
            self.delete_session(session_id)

        return len(expired_sessions)
