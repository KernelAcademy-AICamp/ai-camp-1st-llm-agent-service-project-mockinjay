"""
Trend Visualization Agent Implementation
Provides data trend analysis and visualization
"""

import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime

backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from Agent.base_agent import BaseAgent
from Agent.core.contracts import AgentRequest, AgentResponse
from Agent.api.mongodb_client import MongoDBClient

logger = logging.getLogger(__name__)


class TrendVisualizationAgent(BaseAgent):
    """Data Trend Analysis and Visualization Agent"""

    def __init__(self):
        super().__init__(agent_type="trend_visualization")
        self.mongodb = MongoDBClient()
        self._initialized = False

    async def _initialize(self):
        if not self._initialized:
            await self.mongodb.connect()
            self._initialized = True

    async def process(
        self,
        user_input: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process trend visualization request"""
        await self._initialize()

        request = AgentRequest(
            query=user_input,
            session_id=session_id,
            context=context or {},
            profile=context.get('profile', 'general') if context else 'general',
            language=context.get('language', 'ko') if context else 'ko'
        )

        tokens_estimated = self.estimate_context_usage(user_input)
        self.context_usage += tokens_estimated

        try:
            all_data = await self.mongodb.search_parallel(
                query=request.query,
                collections=['qa_kidney', 'papers_kidney', 'medical_kidney', 'guidelines_kidney'],
                limit=50
            )

            trends = self._analyze_trends(all_data, request.query)
            chart_config = self._generate_chart_data(trends)
            explanation = self._explain_trends(trends)

            response = AgentResponse(
                answer=explanation,
                sources=[chart_config],
                papers=[],
                tokens_used=100,
                status="success",
                agent_type=self.agent_type,
                metadata={
                    'data_points': len(all_data),
                    'trend_type': trends.get('type', 'general')
                }
            )

            return response.dict()

        except Exception as e:
            logger.error(f"Trend visualization agent error: {e}", exc_info=True)
            return {
                "answer": f"트렌드 분석 중 오류가 발생했습니다: {str(e)}",
                "sources": [],
                "papers": [],
                "tokens_used": 0,
                "status": "error",
                "agent_type": self.agent_type,
                "metadata": {"error": str(e)}
            }

    def _analyze_trends(self, data: List[Dict], query: str) -> Dict:
        """Analyze trend patterns"""
        categories = {}
        for item in data:
            category = item.get('category', 'unknown')
            categories[category] = categories.get(category, 0) + 1

        return {
            'categories': categories,
            'type': 'research' if '연구' in query else 'general',
            'total_data': len(data)
        }

    def _generate_chart_data(self, trends: Dict) -> Dict:
        """Generate chart configuration"""
        categories = trends.get('categories', {})
        return {
            'type': 'bar',
            'data': {
                'labels': list(categories.keys())[:10],
                'datasets': [{
                    'label': '데이터 분포',
                    'data': list(categories.values())[:10]
                }]
            }
        }

    def _explain_trends(self, trends: Dict) -> str:
        """Explain trend findings"""
        total = trends.get('total_data', 0)
        categories = trends.get('categories', {})
        top_category = max(categories.items(), key=lambda x: x[1])[0] if categories else 'N/A'

        return f"""
트렌드 분석 결과:
- 총 {total}개의 데이터 포인트 분석
- 주요 카테고리: {top_category}
- 카테고리별 분포: {len(categories)}개 카테고리

차트를 통해 데이터 분포를 확인할 수 있습니다.
        """

    def estimate_context_usage(self, user_input: str) -> int:
        return int(len(user_input) * 1.5) + 500 + 800

    async def close(self):
        await self.mongodb.close()
