"""
Router Agent - Routes requests to appropriate agents and combines results
"""

import logging
import json
import asyncio
import os
from typing import Dict, Any, List, Optional, Tuple

from openai import AsyncOpenAI

from Agent.core.local_agent import LocalAgent
from Agent.core.agent_registry import AgentRegistry
from Agent.core.contracts import AgentRequest, AgentResponse

logger = logging.getLogger(__name__)

@AgentRegistry.register("router")
class RouterAgent(LocalAgent):
    """
    Router Agent that analyzes intent and orchestrates other agents.
    Can combine results from multiple agents (Medical Welfare + Research Paper).
    """

    def __init__(self):
        super().__init__(agent_type="router")
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self._agents = {}

    async def _chat_completion(
        self,
        messages: List[Dict[str, Any]],
        temperature: float = 0.0,
        max_tokens: Optional[int] = None
    ) -> str:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content or ""

    @property
    def metadata(self) -> Dict[str, Any]:
        return {
            "name": "Router Agent",
            "description": "Intelligent router that dispatches tasks to specialized agents and synthesizes answers.",
            "version": "1.0",
            "capabilities": [
                "intent_classification",
                "multi_agent_orchestration",
                "answer_synthesis"
            ]
        }

    async def _get_agent(self, agent_type: str) -> LocalAgent:
        """Lazy load and cache agents"""
        if agent_type not in self._agents:
            self._agents[agent_type] = AgentRegistry.create_agent(agent_type)
        return self._agents[agent_type]

    async def _classify_intent(self, query: str) -> List[str]:
        """
        Classify the user query into agent types.
        Returns a list of agent types to execute.
        """
        system_prompt = """You are an intelligent router for a medical AI system.
        You have access to five specialized agents:
        1. 'medical_welfare': Handles questions about welfare programs, hospital search, dialysis centers, and costs.
        2. 'research_paper': Handles questions about medical research, CKD stages, symptoms, and general medical knowledge.
        3. 'nutrition': Handles questions about diet, food, nutrition analysis, meal recommendations, and food image analysis.
        4. 'quiz': Handles requests to take a quiz, test knowledge, or check learning progress about CKD.
        5. 'trend_visualization': Handles requests to visualize research trends, compare keywords, or see geographic distribution of research.

        Analyze the user's query and decide which agent(s) should handle it.
        
        - If the query asks about welfare, hospitals, or costs, select 'medical_welfare'.
        - If the query asks about medical facts, research, papers, or symptoms, select 'research_paper'.
        - If the query asks about food, diet, eating, or nutrition, select 'nutrition'.
        - If the query asks to take a quiz, solve a problem, or check knowledge, select 'quiz'.
        - If the query asks for trends, graphs, charts, or research statistics, select 'trend_visualization'.
        - If the query implies multiple intents (e.g., "What are CKD symptoms and what should I eat?"), select ALL relevant agents.
        
        Output ONLY a JSON array of strings. Example: ["medical_welfare", "nutrition"]
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]

        try:
            content = await self._chat_completion(messages=messages, temperature=0.0, max_tokens=256)
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]

            agents = json.loads(content)
            if isinstance(agents, list) and all(isinstance(a, str) for a in agents):
                return agents
            logger.warning("Router LLM returned non-list JSON, using rule-based fallback")
            return self._rule_based_intent(query)
        except json.JSONDecodeError as decode_err:
            logger.warning(f"Router response was not valid JSON ({decode_err}); falling back to heuristics")
            return self._rule_based_intent(query)
        except Exception as e:
            logger.error(f"Routing failed: {e}")
            return self._rule_based_intent(query)

    async def _synthesize_answers(self, query: str, results: Dict[str, AgentResponse]) -> str:
        """Combine answers from multiple agents into one coherent response"""
        
        system_prompt = """You are a helpful medical assistant.
        You have received information from multiple specialized agents to answer a user's query.
        Synthesize the following agent responses into a single, coherent, and helpful answer.
        Ensure the tone is professional and empathetic.
        Do not explicitly mention "Agent A said this" or "Agent B said that". Just present the information naturally.
        
        User Query: {query}
        """
        
        inputs = f"User Query: {query}\n\n"
        for agent_type, response in results.items():
            inputs += f"--- Info from {agent_type} ---\n{response.answer}\n\n"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": inputs}
        ]

        try:
            return await self._chat_completion(messages=messages, temperature=0.2, max_tokens=800)
        except Exception as e:
            logger.error(f"Synthesis failed: {e}")
            return "\n\n".join([r.answer for r in results.values()])

    def _rule_based_intent(self, query: str) -> List[str]:
        """Simple keyword-based fallback classifier when the LLM output is unusable."""
        lowered = query.lower()
        mapping = {
            "medical_welfare": [
                "복지", "지원금", "비용", "병원", "센터", "신청", "보험", "수급",
                "지원", "dialysis", "원무", "제도"
            ],
            "research_paper": [
                "증상", "연구", "논문", "stage", "ckd", "의학", "치료", "약물", "검사"
            ],
            "nutrition": [
                "음식", "식단", "영양", "먹어", "식사", "diet", "칼륨", "나트륨",
                "레시피", "meal", "food", "요리"
            ],
            "quiz": [
                "퀴즈", "문제", "테스트", "점수", "학습", "체크", "quiz"
            ],
            "trend_visualization": [
                "트렌드", "그래프", "통계", "시각화", "지도", "비교", "추세", "trend"
            ],
        }

        selected: List[str] = []
        for agent, keywords in mapping.items():
            if any(keyword in lowered for keyword in keywords):
                selected.append(agent)

        if not selected:
            return ["research_paper"]
        return selected

    async def process(self, request: AgentRequest) -> AgentResponse:
        """
        Process the request by routing to appropriate agents.
        """
        logger.info(f"🔄 Router received query: {request.query}")

        # 1. Classify Intent
        target_agents = await self._classify_intent(request.query)
        logger.info(f"👉 Routing to: {target_agents}")

        # 2. Execute Agents
        results: Dict[str, AgentResponse] = {}
        
        # If only one agent, return its result with metadata
        if len(target_agents) == 1:
            agent_type = target_agents[0]
            agent = await self._get_agent(agent_type)
            response = await agent.process(request)
            # Add metadata to show this was a single-agent routing
            response.metadata = response.metadata or {}
            response.metadata.update({
                "routed_to": target_agents,
                "synthesis": False,
                "individual_responses": {
                    agent_type: response.answer
                }
            })
            return response

        # Execute multiple agents in parallel
        tasks = []
        for agent_type in target_agents:
            if agent_type in ["medical_welfare", "research_paper", "nutrition", "quiz", "trend_visualization"]:
                agent = await self._get_agent(agent_type)
                tasks.append(agent.process(request))
            else:
                logger.warning(f"Unknown agent type from router: {agent_type}")

        if not tasks:
            return AgentResponse(
                answer="죄송합니다. 요청을 처리할 수 있는 에이전트를 찾지 못했습니다.",
                sources=[],
                papers=[],
                tokens_used=0,
                status="error",
                agent_type="router"
            )

        agent_responses = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect successful responses
        total_tokens = 0
        all_sources = []
        all_papers = []
        
        for i, agent_type in enumerate(target_agents):
            response = agent_responses[i]
            if isinstance(response, AgentResponse):
                results[agent_type] = response
                total_tokens += response.tokens_used
                all_sources.extend(response.sources)
                all_papers.extend(response.papers)
            else:
                logger.error(f"Agent {agent_type} failed: {response}")

        if not results:
             return AgentResponse(
                answer="죄송합니다. 내부 시스템 오류로 답변을 생성할 수 없습니다.",
                sources=[],
                papers=[],
                tokens_used=0,
                status="error",
                agent_type="router"
            )

        # 3. Synthesize Results
        final_answer = await self._synthesize_answers(request.query, results)

        return AgentResponse(
            answer=final_answer,
            sources=all_sources,
            papers=all_papers,
            tokens_used=total_tokens + 500, # Add overhead for routing/synthesis
            status="success",
            agent_type="router",
            metadata={
                "routed_to": target_agents,
                "synthesis": True,
                "individual_responses": {
                    k: v.answer for k, v in results.items()
                }
            }
        )
