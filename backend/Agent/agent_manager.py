"""
Agent Manager
모든 Agent 조율, 라우팅 및 컨텍스트 관리
"""

from typing import Dict, Any, Optional
from .base_agent import BaseAgent
from .context_tracker import ContextTracker
from .session_manager import SessionManager
from .medical_welfare.agent import MedicalWelfareAgent
from .nutrition.agent import NutritionAgent
from .research_paper.agent import ResearchPaperAgent
from .trend_visualization.agent import TrendVisualizationAgent
from .quiz.agent import QuizAgent


class AgentManager:
    """Agent 관리 및 라우팅 시스템"""

    def __init__(self):
        self.context_tracker = ContextTracker()
        self.session_manager = SessionManager()

        # Agent 인스턴스 초기화
        self.agents: Dict[str, BaseAgent] = {
            "medical_welfare": MedicalWelfareAgent(),
            "nutrition": NutritionAgent(),
            "research_paper": ResearchPaperAgent(),
            "trend_visualization": TrendVisualizationAgent(),
            "quiz": QuizAgent(),
        }

    async def route_request(
        self,
        agent_type: str,
        user_input: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Agent로 요청 라우팅

        Args:
            agent_type: Agent 타입
            user_input: 사용자 입력
            session_id: 세션 ID
            context: 추가 컨텍스트

        Returns:
            Dict[str, Any]: Agent 응답 또는 에러
        """
        # 1. Agent 유효성 확인
        if agent_type not in self.agents:
            return {
                "success": False,
                "error": f"Unknown agent type: {agent_type}",
                "available_agents": list(self.agents.keys()),
            }

        # 2. 세션 확인
        session = self.session_manager.get_session(session_id)
        if not session:
            return {
                "success": False,
                "error": "Invalid or expired session",
            }

        agent = self.agents[agent_type]

        # 3. 컨텍스트 사용량 예측
        estimated_tokens = agent.estimate_context_usage(user_input)
        limit_check = self.context_tracker.check_limit(session_id, estimated_tokens)

        # 4. 컨텍스트 제한 확인
        if limit_check["would_exceed"]:
            return {
                "success": False,
                "error": "Context limit exceeded",
                "limit_info": {
                    "current_usage": limit_check["current_usage"],
                    "max_limit": limit_check["max_limit"],
                    "remaining": limit_check["remaining"],
                    "estimated_tokens": estimated_tokens,
                },
                "message": f"세션 컨텍스트 제한({limit_check['max_limit']} 토큰)을 초과합니다. "
                          f"현재 사용량: {limit_check['current_usage']} 토큰, "
                          f"예상 추가 사용량: {estimated_tokens} 토큰",
            }

        # 5. Agent 처리 실행
        try:
            result = await agent.process(user_input, session_id, context)

            # 6. 실제 사용량 추적
            actual_tokens = result.get("tokens_used", estimated_tokens)
            self.context_tracker.track_usage(session_id, agent_type, actual_tokens)

            # 7. 세션 업데이트
            self.session_manager.update_session_activity(session_id, agent_type)
            self.session_manager.add_to_history(
                session_id,
                agent_type,
                user_input,
                result.get("response", "")
            )

            # 8. 컨텍스트 정보 추가
            result["context_info"] = self.context_tracker.check_limit(session_id)

            return {
                "success": True,
                "agent_type": agent_type,
                "result": result,
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Agent processing failed: {str(e)}",
                "agent_type": agent_type,
            }

    def create_user_session(self, user_id: str) -> str:
        """
        사용자 세션 생성

        Args:
            user_id: 사용자 ID

        Returns:
            str: 세션 ID
        """
        return self.session_manager.create_session(user_id)

    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        세션 정보 조회

        Args:
            session_id: 세션 ID

        Returns:
            Optional[Dict]: 세션 정보
        """
        session = self.session_manager.get_session(session_id)
        if not session:
            return None

        context_summary = self.context_tracker.get_session_summary(session_id)

        return {
            "session": session,
            "context": context_summary,
        }

    def reset_session_context(self, session_id: str) -> bool:
        """
        세션 컨텍스트 초기화

        Args:
            session_id: 세션 ID

        Returns:
            bool: 초기화 성공 여부
        """
        session = self.session_manager.get_session(session_id)
        if not session:
            return False

        self.context_tracker.reset_session(session_id)
        return True

    def get_available_agents(self) -> Dict[str, Dict[str, Any]]:
        """
        사용 가능한 Agent 목록 반환

        Returns:
            Dict: Agent 정보
        """
        return {
            agent_type: agent.get_agent_info()
            for agent_type, agent in self.agents.items()
        }
