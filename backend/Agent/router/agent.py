"""
Router Agent - Routes requests to appropriate agents and combines results
Uses sophisticated prompt engineering for accurate intent classification
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
from Agent.router.prompts import (
    format_classification_prompt,
    is_emergency_query,
    IntentCategory
)

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

    def _normalize_agent_name(self, agent_name: str) -> str:
        """Normalize agent names to match registry (e.g., 'research' -> 'research_paper')"""
        aliases = {
            "research": "research_paper",
            "paper": "research_paper",
            "welfare": "medical_welfare",
            "medical": "medical_welfare",
            "diet": "nutrition",
            "food": "nutrition",
            "trend": "trend_visualization",
            "trends": "trend_visualization",
        }
        return aliases.get(agent_name.lower(), agent_name)

    async def _classify_intent(self, query: str) -> List[str]:
        """
        Classify the user query into agent types using sophisticated prompts.
        Returns a list of agent types to execute.

        Uses Chain-of-Thought reasoning with False Negative prevention
        to ensure medical queries are never missed.
        """
        # Quick emergency check
        if is_emergency_query(query):
            logger.warning(f"🚨 EMERGENCY DETECTED in query: {query}")
            return ["research_paper"]  # Route to research_paper which handles medical info

        # Use formatted prompt from prompts.py with sophisticated classification
        messages = format_classification_prompt(query)

        try:
            content = await self._chat_completion(messages=messages, temperature=0.0, max_tokens=512)
            content = content.strip()

            # Clean up markdown formatting if present
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            # Parse JSON response
            result = json.loads(content)

            # Validate response structure
            if not isinstance(result, dict) or "intents" not in result:
                logger.warning("Invalid classification response structure, using fallback")
                return self._rule_based_intent(query)

            intents = result.get("intents", [])
            confidence = result.get("confidence", 0.0)
            reasoning = result.get("reasoning", "")
            is_emergency = result.get("is_emergency", False)

            # Log classification details
            logger.info(f"📊 Intent Classification:")
            logger.info(f"   Query: {query}")
            logger.info(f"   Intents: {intents}")
            logger.info(f"   Confidence: {confidence:.2f}")
            logger.info(f"   Emergency: {is_emergency}")
            logger.info(f"   Reasoning: {reasoning[:200]}...")

            # Check emergency flag
            if is_emergency:
                logger.warning(f"🚨 EMERGENCY FLAG SET for query: {query}")

            # Validate intents is a list
            if not isinstance(intents, list) or not intents:
                logger.warning("Empty or invalid intents list, using rule-based fallback")
                return self._rule_based_intent(query)

            # Map frontend intent categories to backend agent names
            agent_mapping = {
                IntentCategory.MEDICAL_INFO: "research_paper",  # medical_welfare can also be used
                IntentCategory.DIET_INFO: "nutrition",
                IntentCategory.HEALTH_RECORD: "research_paper",  # medical_welfare for record interpretation
                IntentCategory.WELFARE_INFO: "medical_welfare",
                IntentCategory.RESEARCH: "research_paper",
                IntentCategory.LEARNING: "quiz",
                IntentCategory.POLICY: "research_paper",
                IntentCategory.CHIT_CHAT: "research_paper",
                IntentCategory.NON_MEDICAL: "research_paper",
                IntentCategory.ILLEGAL_REQUEST: "research_paper"
            }

            # Convert intents to agent types
            agents = []
            for intent in intents:
                agent = agent_mapping.get(intent)
                if agent and agent not in agents:
                    agents.append(agent)

            # If no valid agents found, use fallback
            if not agents:
                logger.warning("No valid agents mapped from intents, using fallback")
                return self._rule_based_intent(query)

            # Normalize agent names (e.g., 'research' -> 'research_paper')
            agents = [self._normalize_agent_name(a) for a in agents]

            return agents

        except json.JSONDecodeError as decode_err:
            logger.warning(f"Router response was not valid JSON ({decode_err}); falling back to heuristics")
            logger.warning(f"Raw content: {content[:200]}...")
            return self._rule_based_intent(query)
        except Exception as e:
            logger.error(f"Routing failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
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
        target_agent = request.context.get("target_agent") if request.context else None
        
        if target_agent:
            logger.info(f"🎯 Forced routing to: {target_agent}")
            target_agents = [target_agent]
        else:
            target_agents = await self._classify_intent(request.query)
        
        # Fallback: If no agents were selected, default to research_paper
        if not target_agents:
            logger.warning("⚠️ No agents selected by classifier, forcing fallback to 'research_paper'")
            target_agents = ["research_paper"]
            
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

    async def process_stream(self, request: AgentRequest):
        """
        Process request with streaming support.
        Supports streaming for single-agent and real-time updates for multi-agent.
        """
        logger.info(f"🔄 Router received query (stream): {request.query}")

        # 1. Classify Intent
        target_agent = request.context.get("target_agent") if request.context else None

        if target_agent:
            target_agents = [target_agent]
        else:
            target_agents = await self._classify_intent(request.query)

        if not target_agents:
            target_agents = ["research_paper"]

        logger.info(f"👉 Routing to (stream): {target_agents}")

        # 2. Execute Agents
        if len(target_agents) == 1:
            agent_type = target_agents[0]
            agent = await self._get_agent(agent_type)

            # Check if agent supports streaming
            if hasattr(agent, 'process_stream'):
                async for chunk in agent.process_stream(request):
                    yield chunk
            else:
                # Fallback to non-streaming
                yield {
                    "content": "분석 중입니다...",
                    "status": "processing",
                    "agent_type": agent_type
                }
                response = await agent.process(request)
                yield response
        else:
            # Multi-agent: Stream progress updates while executing
            yield {
                "content": f"🔄 여러 전문가에게 문의 중입니다... ({', '.join(target_agents)})",
                "status": "processing",
                "agent_type": "router",
                "routed_to": target_agents
            }

            # Execute agents in parallel and stream each result
            results: Dict[str, AgentResponse] = {}
            tasks = []

            for agent_type in target_agents:
                if agent_type in ["medical_welfare", "research_paper", "nutrition", "quiz", "trend_visualization"]:
                    agent = await self._get_agent(agent_type)
                    tasks.append((agent_type, agent.process(request)))

            if not tasks:
                yield {
                    "content": "죄송합니다. 요청을 처리할 수 있는 에이전트를 찾지 못했습니다.",
                    "status": "error",
                    "agent_type": "router"
                }
                return

            # Stream individual agent results as they complete
            pending = {asyncio.create_task(task): agent_type for agent_type, task in tasks}

            while pending:
                done, _ = await asyncio.wait(pending.keys(), return_when=asyncio.FIRST_COMPLETED)

                for task in done:
                    agent_type = pending.pop(task)
                    try:
                        response = task.result()
                        results[agent_type] = response

                        # Stream individual result
                        yield {
                            "content": f"📋 {agent_type} 응답:\n{response.answer[:500]}{'...' if len(response.answer) > 500 else ''}",
                            "status": "partial",
                            "agent_type": agent_type,
                            "individual_response": True
                        }
                    except Exception as e:
                        logger.error(f"Agent {agent_type} failed: {e}")
                        yield {
                            "content": f"⚠️ {agent_type} 처리 중 오류: {str(e)}",
                            "status": "error",
                            "agent_type": agent_type
                        }

            # Synthesize final answer
            if results:
                yield {
                    "content": "🔄 응답을 종합하고 있습니다...",
                    "status": "synthesizing",
                    "agent_type": "router"
                }

                final_answer = await self._synthesize_answers(request.query, results)

                yield {
                    "content": final_answer,
                    "status": "complete",
                    "agent_type": "router",
                    "routed_to": target_agents,
                    "synthesis": True
                }
            else:
                yield {
                    "content": "죄송합니다. 내부 오류로 답변을 생성할 수 없습니다.",
                    "status": "error",
                    "agent_type": "router"
                }
