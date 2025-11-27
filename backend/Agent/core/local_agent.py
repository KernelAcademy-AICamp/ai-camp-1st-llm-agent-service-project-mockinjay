"""
로컬 에이전트 - 로컬에서 직접 실행되는 에이전트 기본 클래스
"""

from typing import Optional, Dict, Any
from ..base_agent import BaseAgent
from ..core.types import AgentType
from ..core.contracts import AgentRequest, AgentResponse


class LocalAgent(BaseAgent):
    """로컬에서 직접 실행되는 에이전트 (기존 방식)"""
    
    def __init__(
        self,
        agent_type: str,
        openai_service: Optional[Any] = None,
        # 다른 서비스들도 주입 가능
    ):
        super().__init__(agent_type)
        self.openai_service = openai_service
        # OpenAI 서비스는 lazy loading으로 각 에이전트에서 초기화
    
    @property
    def execution_type(self) -> AgentType:
        """로컬 실행 타입"""
        return AgentType.LOCAL
    
    async def process(self, request: AgentRequest) -> AgentResponse:
        """Process the user request and return an AgentResponse"""
        raise NotImplementedError("Agents must implement process method")

    async def process_stream(self, request: AgentRequest):
        """
        Process the user request and yield chunks.
        Default implementation calls process() and yields the full response.
        """
        response = await self.process(request)
        yield response

    # process()와 metadata는 각 구체 클래스에서 구현
