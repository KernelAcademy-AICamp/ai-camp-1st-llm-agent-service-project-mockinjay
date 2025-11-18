"""
Trend Visualization Agent Implementation
Provides data trend analysis and visualization with PubMed integration
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
from Agent.api.pubmed_client import PubMedClient

logger = logging.getLogger(__name__)


class TrendVisualizationAgent(BaseAgent):
    """Data Trend Analysis and Visualization Agent with PubMed Integration"""

    def __init__(self):
        """
        Initialize the TrendVisualizationAgent, set up data clients, and mark it as not yet initialized.
        
        Creates a MongoDBClient and a PubMedClient for data access, calls the BaseAgent initializer with agent_type "trend_visualization", and sets an internal `_initialized` flag to False.
        """
        super().__init__(agent_type="trend_visualization")
        self.mongodb = MongoDBClient()
        self.pubmed = PubMedClient()
        self._initialized = False

    async def _initialize(self):
        """
        Ensure the agent's external resources are connected before use.
        
        Connect to MongoDB if not already connected and mark the agent as initialized.
        """
        if not self._initialized:
            await self.mongodb.connect()
            self._initialized = True

    async def process(
        self,
        user_input: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Handle a trend visualization request and dispatch it to the appropriate analysis handler.
        
        Processes the provided user_input and session_id with optional context, ensures internal resources are initialized, updates the agent's context usage estimate, and routes the request to one of the analysis handlers determined by context['analysis_type'] ('temporal', 'geographic', 'mesh', 'compare', or 'general'). On failure returns a standardized error payload.
        
        Parameters:
            user_input (str): The user's query text.
            session_id (str): Identifier for the user session.
            context (Optional[Dict[str, Any]]): Optional context that may include 'analysis_type', 'profile', 'language', and other analysis-specific options.
        
        Returns:
            Dict[str, Any]: Serialized agent response containing fields such as 'answer', 'sources', 'papers', 'tokens_used', 'status', 'agent_type', and 'metadata'. On error, 'status' is 'error' and 'metadata' contains an 'error' message.
        """
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
            # Determine analysis type from context
            analysis_type = context.get('analysis_type', 'general') if context else 'general'

            if analysis_type == 'temporal':
                return await self._analyze_temporal_trends(request, context)
            elif analysis_type == 'geographic':
                return await self._analyze_geographic_distribution(request, context)
            elif analysis_type == 'mesh':
                return await self._analyze_mesh_categories(request, context)
            elif analysis_type == 'compare':
                return await self._compare_keywords(request, context)
            else:
                # General analysis - query all data sources
                return await self._analyze_general_trends(request, context)

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

    async def _analyze_temporal_trends(
        self,
        request: AgentRequest,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Produce a temporal analysis of publication activity for the request query and return a structured AgentResponse serialized as a dict.
        
        Parameters:
            request (AgentRequest): The agent request whose `query` is analyzed; `language` controls localized labels in chart text.
            context (Dict[str, Any]): Optional analysis parameters:
                - start_year (int): First year of the analysis (default 2015).
                - end_year (int): Last year of the analysis (default 2024).
                - normalize (bool): Whether to include normalized counts (default True).
        
        Returns:
            Dict[str, Any]: A serialized AgentResponse containing:
                - answer: Human-readable explanation of temporal trends.
                - sources: List with a chart configuration for the time series (and normalized series if requested).
                - papers: Sample recent papers relevant to the query (up to 5 returned).
                - tokens_used, status, agent_type.
                - metadata: Summary fields such as `total_papers`, `peak_year`, and `analysis_period`.
        """
        start_year = context.get('start_year', 2015)
        end_year = context.get('end_year', 2024)
        normalize = context.get('normalize', True)

        try:
            # Get temporal trends from PubMed
            trends_data = await self.pubmed.searcher.get_publication_trends_parallel(
                query=request.query,
                start_year=start_year,
                end_year=end_year,
                normalize=normalize
            )

            # Get recent papers
            recent_papers = await self.pubmed.search(
                query=request.query,
                max_results=10,
                sort="pub_date"
            )

            # Generate chart configuration
            chart_config = {
                'type': 'line',
                'data': {
                    'labels': [str(year) for year in trends_data['years']],
                    'datasets': [
                        {
                            'label': '논문 수' if request.language == 'ko' else 'Paper Count',
                            'data': trends_data['counts'],
                            'borderColor': 'rgb(59, 130, 246)',
                            'backgroundColor': 'rgba(59, 130, 246, 0.1)',
                            'tension': 0.3
                        }
                    ]
                }
            }

            if normalize and 'normalized_counts' in trends_data:
                chart_config['data']['datasets'].append({
                    'label': '정규화된 수 (per 100K)' if request.language == 'ko' else 'Normalized (per 100K)',
                    'data': trends_data['normalized_counts'],
                    'borderColor': 'rgb(239, 68, 68)',
                    'backgroundColor': 'rgba(239, 68, 68, 0.1)',
                    'tension': 0.3,
                    'yAxisID': 'y1'
                })

            # Generate explanation
            total_papers = sum(trends_data['counts'])
            max_year_idx = trends_data['counts'].index(max(trends_data['counts']))
            peak_year = trends_data['years'][max_year_idx]
            peak_count = trends_data['counts'][max_year_idx]

            explanation = f"""시간별 연구 트렌드 분석 ({start_year}-{end_year}):

📊 전체 논문 수: {total_papers:,}개
📈 최고 발행 연도: {peak_year}년 ({peak_count:,}개)
📅 분석 기간: {end_year - start_year + 1}년

최근 {end_year - start_year + 1}년간 "{request.query}" 주제의 연구는 꾸준한 관심을 받고 있으며,
{peak_year}년에 가장 많은 논문이 발표되었습니다."""

            response = AgentResponse(
                answer=explanation,
                sources=[chart_config],
                papers=recent_papers[:5],
                tokens_used=100,
                status="success",
                agent_type=self.agent_type,
                metadata={
                    'total_papers': total_papers,
                    'peak_year': peak_year,
                    'analysis_period': f"{start_year}-{end_year}"
                }
            )

            return response.model_dump()

        except Exception as e:
            logger.error(f"Temporal trends error: {e}", exc_info=True)
            raise

    async def _analyze_geographic_distribution(
        self,
        request: AgentRequest,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze the geographic distribution of publications for the agent's query and produce a chart, explanation, and sample papers.
        
        Parameters:
            context (dict): Optional keys:
                - countries (Optional[List[str]]): List of country names to restrict the analysis.
        
        Returns:
            dict: Serialized AgentResponse containing:
                - answer: human-readable explanation of geographic findings,
                - sources: list with a chart configuration (horizontal bar chart of country counts),
                - papers: up to five sample paper records,
                - tokens_used, status, agent_type,
                - metadata: includes `total_results`, `top_country`, and `countries_analyzed`.
        """
        countries = context.get('countries', None)

        try:
            # Get geographic distribution from PubMed
            geo_data = await self.pubmed.searcher.get_geographic_distribution_parallel(
                query=request.query,
                countries=countries
            )

            # Sort countries by count
            sorted_countries = sorted(
                geo_data['countries'].items(),
                key=lambda x: x[1]['count'],
                reverse=True
            )[:15]  # Top 15 countries

            # Generate chart configuration
            chart_config = {
                'type': 'bar',
                'data': {
                    'labels': [country for country, _ in sorted_countries],
                    'datasets': [{
                        'label': '논문 수' if request.language == 'ko' else 'Paper Count',
                        'data': [data['count'] for _, data in sorted_countries],
                        'backgroundColor': 'rgba(59, 130, 246, 0.7)',
                        'borderColor': 'rgb(59, 130, 246)',
                        'borderWidth': 1
                    }]
                },
                'options': {
                    'indexAxis': 'y',
                    'responsive': True
                }
            }

            # Get sample papers
            papers = await self.pubmed.search(
                query=request.query,
                max_results=10
            )

            # Generate explanation
            top_country = sorted_countries[0][0] if sorted_countries else 'N/A'
            top_count = sorted_countries[0][1]['count'] if sorted_countries else 0
            total_results = geo_data['total_results']

            explanation = f"""지역별 연구 분포 분석:

🌍 총 논문 수: {total_results:,}개
🏆 최다 연구 국가: {top_country} ({top_count:,}개, {top_count/total_results*100:.1f}%)
📊 분석 국가 수: {len(sorted_countries)}개

"{request.query}" 주제는 전 세계적으로 연구되고 있으며,
{top_country}에서 가장 활발한 연구가 진행되고 있습니다."""

            response = AgentResponse(
                answer=explanation,
                sources=[chart_config],
                papers=papers[:5],
                tokens_used=100,
                status="success",
                agent_type=self.agent_type,
                metadata={
                    'total_results': total_results,
                    'top_country': top_country,
                    'countries_analyzed': len(sorted_countries)
                }
            )

            return response.model_dump()

        except Exception as e:
            logger.error(f"Geographic distribution error: {e}", exc_info=True)
            raise

    async def _analyze_mesh_categories(
        self,
        request: AgentRequest,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze MeSH category and subheading distributions for the request query and return chart configurations, a textual summary, and sample papers.
        
        Parameters:
            request (AgentRequest): AgentRequest whose `query` is analyzed and whose `language` controls localized labels.
            context (Dict[str, Any]): Additional options (not required by this implementation).
        
        Returns:
            Dict[str, Any]: A serialized AgentResponse containing:
                - answer (str): Human-readable explanation of MeSH findings.
                - sources (List[dict]): Two chart configurations (category doughnut and subheading bar).
                - papers (List[dict]): Up to five sample papers for the query.
                - tokens_used (int), status (str), agent_type (str).
                - metadata (dict): Contains `total_results`, `top_category`, and `top_subheading`.
        """
        try:
            # Get MeSH distribution from PubMed
            from app.services.pubmed_search import MESH_CATEGORIES, MESH_SUBHEADINGS

            mesh_data = await self.pubmed.searcher.get_mesh_distribution_parallel(
                query=request.query,
                categories=MESH_CATEGORIES[:10],
                subheadings=MESH_SUBHEADINGS[:10]
            )

            # Sort categories
            categories = sorted(
                mesh_data.get('categories', []),
                key=lambda x: x['proportion'],
                reverse=True
            )[:10]

            subheadings = sorted(
                mesh_data.get('subheadings', []),
                key=lambda x: x['proportion'],
                reverse=True
            )[:10]

            # Generate chart configurations
            category_chart = {
                'type': 'doughnut',
                'data': {
                    'labels': [cat['name'] for cat in categories],
                    'datasets': [{
                        'label': '카테고리 분포' if request.language == 'ko' else 'Category Distribution',
                        'data': [cat['count'] for cat in categories],
                        'backgroundColor': [
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(239, 68, 68, 0.7)',
                            'rgba(34, 197, 94, 0.7)',
                            'rgba(234, 179, 8, 0.7)',
                            'rgba(168, 85, 247, 0.7)',
                            'rgba(236, 72, 153, 0.7)',
                            'rgba(20, 184, 166, 0.7)',
                            'rgba(249, 115, 22, 0.7)',
                            'rgba(99, 102, 241, 0.7)',
                            'rgba(132, 204, 22, 0.7)'
                        ]
                    }]
                }
            }

            subheading_chart = {
                'type': 'bar',
                'data': {
                    'labels': [sub['name'] for sub in subheadings],
                    'datasets': [{
                        'label': '서브헤딩 분포' if request.language == 'ko' else 'Subheading Distribution',
                        'data': [sub['count'] for sub in subheadings],
                        'backgroundColor': 'rgba(34, 197, 94, 0.7)',
                        'borderColor': 'rgb(34, 197, 94)',
                        'borderWidth': 1
                    }]
                }
            }

            # Get sample papers
            papers = await self.pubmed.search(
                query=request.query,
                max_results=10
            )

            # Generate explanation
            total_results = mesh_data['total_results']
            top_category = categories[0]['name'] if categories else 'N/A'
            top_subheading = subheadings[0]['name'] if subheadings else 'N/A'

            explanation = f"""MeSH 카테고리 분석:

📚 총 논문 수: {total_results:,}개
🏷️ 주요 카테고리: {top_category}
🔍 주요 서브헤딩: {top_subheading}

"{request.query}" 주제는 주로 {top_category} 카테고리와 관련이 있으며,
{top_subheading} 관점에서 많이 연구되고 있습니다."""

            response = AgentResponse(
                answer=explanation,
                sources=[category_chart, subheading_chart],
                papers=papers[:5],
                tokens_used=100,
                status="success",
                agent_type=self.agent_type,
                metadata={
                    'total_results': total_results,
                    'top_category': top_category,
                    'top_subheading': top_subheading
                }
            )

            return response.model_dump()

        except Exception as e:
            logger.error(f"MeSH category error: {e}", exc_info=True)
            raise

    async def _compare_keywords(
        self,
        request: AgentRequest,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare publication trends for up to four keywords and produce a chart, example papers, and a textual summary.
        
        Parameters:
            request (AgentRequest): Agent request containing the primary query used when no keywords are provided.
            context (Dict[str, Any]): Analysis options; recognized keys:
                - keywords (List[str]): Keywords to compare. Defaults to [request.query].
                - start_year (int): Analysis start year. Defaults to 2015.
                - end_year (int): Analysis end year. Defaults to 2024.
        
        Returns:
            Dict[str, Any]: A serialized AgentResponse containing:
                - answer (str): Human-readable explanation of the comparison and per-keyword totals.
                - sources (List[dict]): Chart configuration(s) for visualizing normalized trends by year.
                - papers (List[dict]): Up to five example papers for the first keyword.
                - tokens_used (int): Estimated token usage.
                - status (str): Operation status (e.g., "success").
                - agent_type (str): Agent type identifier.
                - metadata (dict): Additional info including `keywords_compared` (int) and `analysis_period` (str).
        """
        keywords = context.get('keywords', [request.query])
        start_year = context.get('start_year', 2015)
        end_year = context.get('end_year', 2024)

        try:
            # Get trends for each keyword
            all_trends = []
            for keyword in keywords[:4]:  # Limit to 4 keywords
                trends = await self.pubmed.searcher.get_publication_trends_parallel(
                    query=keyword,
                    start_year=start_year,
                    end_year=end_year,
                    normalize=True
                )
                all_trends.append({
                    'keyword': keyword,
                    'data': trends
                })

            # Generate chart configuration
            colors = [
                'rgb(59, 130, 246)',   # blue
                'rgb(239, 68, 68)',    # red
                'rgb(34, 197, 94)',    # green
                'rgb(234, 179, 8)'     # yellow
            ]

            datasets = []
            for i, trend in enumerate(all_trends):
                datasets.append({
                    'label': trend['keyword'],
                    'data': trend['data']['normalized_counts'],
                    'borderColor': colors[i],
                    'backgroundColor': colors[i].replace('rgb', 'rgba').replace(')', ', 0.1)'),
                    'tension': 0.3
                })

            chart_config = {
                'type': 'line',
                'data': {
                    'labels': [str(year) for year in all_trends[0]['data']['years']],
                    'datasets': datasets
                }
            }

            # Get papers for first keyword
            papers = await self.pubmed.search(
                query=keywords[0],
                max_results=10
            )

            # Generate explanation
            keyword_summaries = []
            for trend in all_trends:
                total = sum(trend['data']['counts'])
                keyword_summaries.append(f"- {trend['keyword']}: {total:,}개")

            explanation = f"""키워드 비교 분석 ({start_year}-{end_year}):

📊 비교 키워드 수: {len(all_trends)}개
📈 기간: {end_year - start_year + 1}년

키워드별 총 논문 수:
{chr(10).join(keyword_summaries)}

선택한 키워드들의 연구 트렌드를 시간에 따라 비교하여
각 주제의 관심도 변화를 확인할 수 있습니다."""

            response = AgentResponse(
                answer=explanation,
                sources=[chart_config],
                papers=papers[:5],
                tokens_used=100,
                status="success",
                agent_type=self.agent_type,
                metadata={
                    'keywords_compared': len(all_trends),
                    'analysis_period': f"{start_year}-{end_year}"
                }
            )

            return response.model_dump()

        except Exception as e:
            logger.error(f"Keyword comparison error: {e}", exc_info=True)
            raise

    async def _analyze_general_trends(
        self,
        request: AgentRequest,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Perform a general trend analysis across predefined kidney-related MongoDB collections for the agent's query.
        
        Queries multiple MongoDB collections, aggregates results into trend metrics, generates chart configuration and a short explanatory summary, and returns a serialized AgentResponse-like dictionary containing the analysis.
        
        Returns:
            dict: Serialized AgentResponse with keys including `answer` (explanation string), `sources` (list with chart configuration), `papers` (sample papers list, may be empty), `tokens_used` (int), `status` (e.g., "success"), `agent_type` (str), and `metadata` (contains `data_points` and `trend_type`).
        """
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

            return response.model_dump()

        except Exception as e:
            logger.error(f"General trends error: {e}", exc_info=True)
            raise

    def _analyze_trends(self, data: List[Dict], query: str) -> Dict:
        """
        Aggregate category counts from the provided records and classify the trend type based on the query.
        
        Parameters:
            data (List[Dict]): Iterable records (typically from MongoDB) where each record may contain a 'category' key.
            query (str): Search query used to determine the trend type; if it contains the substring '연구' the type is 'research'.
        
        Returns:
            Dict: A dictionary with:
                - 'categories' (Dict[str, int]): Mapping of category name to its occurrence count.
                - 'type' (str): 'research' if `query` contains '연구', otherwise 'general'.
                - 'total_data' (int): Total number of records processed.
        """
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
        """
        Builds a bar chart configuration representing category counts from the provided trends.
        
        Parameters:
            trends (dict): Trends data containing a 'categories' mapping of label -> numeric count. Only up to the first 10 categories are used.
        
        Returns:
            dict: Chart configuration with keys 'type' and 'data' suitable for a frontend charting library; 'data' contains 'labels' and a single 'datasets' entry with styling and values.
        """
        categories = trends.get('categories', {})
        return {
            'type': 'bar',
            'data': {
                'labels': list(categories.keys())[:10],
                'datasets': [{
                    'label': '데이터 분포',
                    'data': list(categories.values())[:10],
                    'backgroundColor': 'rgba(59, 130, 246, 0.7)',
                    'borderColor': 'rgb(59, 130, 246)',
                    'borderWidth': 1
                }]
            }
        }

    def _explain_trends(self, trends: Dict) -> str:
        """
        Generate a concise human-readable summary of trend analytics suitable for presentation to users.
        
        Parameters:
            trends (Dict): Trend data containing 'total_data' (int) and 'categories' (dict mapping category names to counts).
        
        Returns:
            str: A user-facing summary string that states the total number of data points analyzed, the top category, and the number of categories, formatted for display.
        """
        total = trends.get('total_data', 0)
        categories = trends.get('categories', {})
        top_category = max(categories.items(), key=lambda x: x[1])[0] if categories else 'N/A'

        return f"""트렌드 분석 결과:

📊 총 {total}개의 데이터 포인트 분석
🏷️ 주요 카테고리: {top_category}
📈 카테고리별 분포: {len(categories)}개 카테고리

차트를 통해 데이터 분포를 확인할 수 있습니다."""

    def estimate_context_usage(self, user_input: str) -> int:
        """
        Estimate context usage for a given user input.
        
        Returns:
        	Estimated context usage as an integer (approximate token count).
        """
        return int(len(user_input) * 1.5) + 500 + 800

    async def close(self):
        """
        Close the agent's external resources.
        
        Closes the MongoDB connection and shuts down the PubMed client so the agent releases external network and database resources.
        """
        await self.mongodb.close()
        self.pubmed.close()