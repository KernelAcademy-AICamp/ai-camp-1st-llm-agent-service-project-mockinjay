"""
에이전트 레지스트리 - 플러그인 자동 등록 시스템
"""

from typing import Dict, Type, List, Any
import logging

logger = logging.getLogger(__name__)


class AgentRegistry:
    """에이전트 자동 발견 및 등록"""
    
    _agents: Dict[str, Type['BaseAgent']] = {}
    
    @classmethod
    def register(cls, agent_type: str):
        """
        데코레이터로 에이전트 자동 등록
        
        사용 예:
        ```python
        @AgentRegistry.register("nutrition")
        class NutritionAgent(LocalAgent):
            pass
        ```
        """
        def decorator(agent_class: Type['BaseAgent']):
            logger.info(f"Registering agent: {agent_type} -> {agent_class.__name__}")
            cls._agents[agent_type] = agent_class
            return agent_class
        return decorator
    
    @classmethod
    def get_agent_class(cls, agent_type: str) -> Type['BaseAgent']:
        """
        에이전트 클래스 가져오기
        
        Args:
            agent_type: 에이전트 타입
            
        Returns:
            에이전트 클래스
            
        Raises:
            AgentNotFoundException: 에이전트를 찾을 수 없음
        """
        from .exceptions import AgentNotFoundException
        
        if agent_type not in cls._agents:
            raise AgentNotFoundException(agent_type)
        return cls._agents[agent_type]
    
    @classmethod
    def create_agent(cls, agent_type: str, **dependencies) -> 'BaseAgent':
        """
        팩토리 패턴으로 에이전트 생성
        
        Args:
            agent_type: 에이전트 타입
            **dependencies: 의존성 주입 (openai_service 등)
            
        Returns:
            생성된 에이전트 인스턴스
        """
        agent_class = cls.get_agent_class(agent_type)
        return agent_class(**dependencies)
    
    @classmethod
    def list_agents(cls) -> List[str]:
        """등록된 모든 에이전트 목록"""
        return list(cls._agents.keys())
    
    @classmethod
    def get_agents_info(cls) -> Dict[str, Dict[str, Any]]:
        """
        등록된 모든 에이전트의 메타데이터
        
        Returns:
            {
                "nutrition": {"name": "...", "description": "..."},
                "research_paper": {"name": "...", "description": "..."},
                ...
            }
        """
        info = {}
        for agent_type, agent_class in cls._agents.items():
            # 메타데이터는 인스턴스에서 가져와야 하므로 임시 인스턴스 생성
            try:
                # metadata는 property이므로 클래스 레벨에서는 접근 불가
                # 대신 agent_type만 반환
                info[agent_type] = {
                    "class_name": agent_class.__name__,
                    "module": agent_class.__module__
                }
            except Exception as e:
                logger.warning(f"Cannot get metadata for {agent_type}: {e}")
                info[agent_type] = {"error": str(e)}
        
        return info
