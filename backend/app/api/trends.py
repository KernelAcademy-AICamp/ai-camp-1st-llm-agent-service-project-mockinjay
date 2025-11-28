"""
Trends API Router
Handles trend visualization and analysis requests
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
import sys
from pathlib import Path

# Add backend path for imports
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from Agent.trend_visualization.agent import TrendVisualizationAgent
from app.services.summarization import PaperSummarizationService
from Agent.api.pubmed_client import PubMedClient
from Agent.core.contracts import AgentRequest
from app.services.news_scraper import NewsScraperService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/trends", tags=["trends"])

# Global instances
trend_agent = TrendVisualizationAgent()
summarization_service = PaperSummarizationService()
pubmed_client = PubMedClient()
news_scraper = NewsScraperService()


# ==================== Request Models ====================

class TemporalTrendsRequest(BaseModel):
    """Request for temporal trends analysis"""
    query: str = Field(..., description="Search query")
    start_year: int = Field(2015, description="Start year for analysis")
    end_year: int = Field(2024, description="End year for analysis")
    normalize: bool = Field(True, description="Normalize counts")
    session_id: str = Field("default", description="Session ID")
    language: str = Field("ko", description="Response language (ko/en)")


class GeographicDistributionRequest(BaseModel):
    """Request for geographic distribution analysis"""
    query: str = Field(..., description="Search query")
    countries: Optional[List[str]] = Field(None, description="List of countries to analyze")
    session_id: str = Field("default", description="Session ID")
    language: str = Field("ko", description="Response language (ko/en)")


class MeshCategoryRequest(BaseModel):
    """Request for MeSH category analysis"""
    query: str = Field(..., description="Search query")
    session_id: str = Field("default", description="Session ID")
    language: str = Field("ko", description="Response language (ko/en)")


class CompareKeywordsRequest(BaseModel):
    """Request for keyword comparison"""
    keywords: List[str] = Field(..., min_items=2, max_items=4, description="2-4 keywords to compare")
    start_year: int = Field(2015, description="Start year for analysis")
    end_year: int = Field(2024, description="End year for analysis")
    session_id: str = Field("default", description="Session ID")
    language: str = Field("ko", description="Response language (ko/en)")


class PapersRequest(BaseModel):
    """Request for paper search"""
    query: str = Field(..., description="Search query")
    max_results: int = Field(10, ge=1, le=50, description="Maximum results (1-50)")
    sort: str = Field("relevance", description="Sort order (relevance/pub_date)")
    session_id: str = Field("default", description="Session ID")


class SummarizeRequest(BaseModel):
    """Request for paper summarization"""
    papers: List[Dict[str, Any]] = Field(..., description="List of papers to summarize")
    query: str = Field(..., description="Original search query for context")
    language: str = Field("ko", description="Summary language (ko/en)")
    summary_type: str = Field("multiple", description="Summary type (single/multiple)")


class OneLineSummaryRequest(BaseModel):
    """Request for one-line summaries"""
    papers: List[Dict[str, Any]] = Field(..., description="List of papers")
    language: str = Field("ko", description="Summary language (ko/en)")


class TranslateRequest(BaseModel):
    """Request for abstract translation"""
    papers: List[Dict[str, Any]] = Field(..., description="List of papers to translate")
    target_language: str = Field("ko", description="Target language code")


class NewsRequest(BaseModel):
    """Request for news articles"""
    limit: int = Field(20, ge=1, le=50, description="Maximum number of news items (1-50)")


# ==================== API Endpoints ====================

@router.post("/temporal")
async def analyze_temporal_trends(request: TemporalTrendsRequest) -> Dict[str, Any]:
    """
    Analyze publication trends over time

    Returns:
        - Chart configuration for line chart
        - Trend explanation
        - Recent papers
        - Metadata (peak year, total papers, etc.)
    """
    try:
        logger.info(f"Temporal trends request: {request.query} ({request.start_year}-{request.end_year})")

        context = {
            'analysis_type': 'temporal',
            'start_year': request.start_year,
            'end_year': request.end_year,
            'normalize': request.normalize,
            'language': request.language
        }

        agent_request = AgentRequest(
            query=request.query,
            session_id=request.session_id,
            context=context
        )

        result = await trend_agent.process(agent_request)

        # Convert AgentResponse to dict for FastAPI validation
        return result.model_dump()

    except Exception as e:
        logger.error(f"Temporal trends error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/geographic")
async def analyze_geographic_distribution(request: GeographicDistributionRequest) -> Dict[str, Any]:
    """
    Analyze geographic distribution of research

    Returns:
        - Chart configuration for horizontal bar chart
        - Geographic distribution explanation
        - Sample papers
        - Metadata (top country, total results, etc.)
    """
    try:
        logger.info(f"Geographic distribution request: {request.query}")

        context = {
            'analysis_type': 'geographic',
            'countries': request.countries,
            'language': request.language
        }

        agent_request = AgentRequest(
            query=request.query,
            session_id=request.session_id,
            context=context
        )

        result = await trend_agent.process(agent_request)

        return result.model_dump()

    except Exception as e:
        logger.error(f"Geographic distribution error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mesh")
async def analyze_mesh_categories(request: MeshCategoryRequest) -> Dict[str, Any]:
    """
    Analyze MeSH category and subheading distribution

    Returns:
        - Chart configurations (doughnut for categories, bar for subheadings)
        - MeSH analysis explanation
        - Sample papers
        - Metadata (top category, top subheading, etc.)
    """
    try:
        logger.info(f"MeSH category request: {request.query}")

        context = {
            'analysis_type': 'mesh',
            'language': request.language
        }

        agent_request = AgentRequest(
            query=request.query,
            session_id=request.session_id,
            context=context
        )

        result = await trend_agent.process(agent_request)

        return result.model_dump()

    except Exception as e:
        logger.error(f"MeSH category error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
async def compare_keywords(request: CompareKeywordsRequest) -> Dict[str, Any]:
    """
    Compare trends across multiple keywords

    Returns:
        - Chart configuration for multi-line comparison
        - Comparison explanation
        - Papers for first keyword
        - Metadata (keywords compared, analysis period, etc.)
    """
    try:
        logger.info(f"Keyword comparison request: {request.keywords}")

        context = {
            'analysis_type': 'compare',
            'keywords': request.keywords,
            'start_year': request.start_year,
            'end_year': request.end_year,
            'language': request.language
        }

        agent_request = AgentRequest(
            query=request.keywords[0],  # Use first keyword as main query
            session_id=request.session_id,
            context=context
        )

        result = await trend_agent.process(agent_request)

        return result.model_dump()

    except Exception as e:
        logger.error(f"Keyword comparison error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/papers")
async def search_papers(request: PapersRequest) -> Dict[str, Any]:
    """
    Search for research papers

    Returns:
        - List of papers with metadata (title, abstract, authors, etc.)
        - Total count
    """
    try:
        logger.info(f"Paper search request: {request.query} (max: {request.max_results})")

        papers = await pubmed_client.search(
            query=request.query,
            max_results=request.max_results,
            sort=request.sort
        )

        return {
            'papers': papers,
            'total': len(papers),
            'query': request.query,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Paper search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_papers(request: SummarizeRequest) -> Dict[str, Any]:
    """
    Generate AI-powered summaries of research papers

    Returns:
        - Comprehensive summary (overview, themes, trends, implications, recommendations)
        - Tokens used
        - Papers analyzed count
    """
    try:
        logger.info(f"Summarization request: {len(request.papers)} papers, type: {request.summary_type}")

        if request.summary_type == "single" and len(request.papers) > 0:
            # Summarize single paper
            result = await summarization_service.summarize_paper(
                paper=request.papers[0],
                language=request.language
            )
        else:
            # Summarize multiple papers
            result = await summarization_service.summarize_multiple_papers(
                papers=request.papers,
                query=request.query,
                language=request.language
            )

        return {
            **result,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Summarization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/one-line-summaries")
async def generate_one_line_summaries(request: OneLineSummaryRequest) -> Dict[str, Any]:
    """
    Generate one-line summaries for each paper

    Returns:
        - Papers with one_line_summary field added
    """
    try:
        logger.info(f"One-line summaries request: {len(request.papers)} papers")

        papers_with_summaries = await summarization_service.generate_one_line_summaries(
            papers=request.papers,
            language=request.language
        )

        return {
            'papers': papers_with_summaries,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"One-line summaries error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/translate")
async def translate_abstracts(request: TranslateRequest) -> Dict[str, Any]:
    """
    Translate paper abstracts to target language

    Returns:
        - Papers with abstract_translated field added
    """
    try:
        logger.info(f"Translation request: {len(request.papers)} papers to {request.target_language}")

        papers_with_translation = await summarization_service.translate_papers_abstracts(
            papers=request.papers,
            target_lang=request.target_language
        )

        return {
            'papers': papers_with_translation,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Translation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/news")
async def get_news(request: NewsRequest) -> Dict[str, Any]:
    """
    Get filtered kidney disease news from multiple sources

    Returns:
        - List of news items with metadata (title, description, source, etc.)
        - Total count
        - Keywords used for filtering
    """
    try:
        logger.info(f"News request: limit={request.limit}")

        news_items = await news_scraper.get_all_news(limit=request.limit)

        return {
            'news': news_items,
            'total': len(news_items),
            'sources': ['NewsAPI', '뉴스와이어', '보건의료연합신문', '보건복지부', '질병관리청', '식품의약품안전처'],
            'keywords': {
                'ckd': news_scraper.CKD_KEYWORDS,
                'welfare': news_scraper.WELFARE_KEYWORDS
            },
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"News retrieval error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Health Check ====================

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "trends_api",
        "components": {
            "trend_agent": "ready",
            "summarization_service": "ready",
            "pubmed_client": "ready",
            "news_scraper": "ready"
        }
    }


# ==================== Shutdown Handler ====================

@router.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        await trend_agent.close()
        pubmed_client.close()
        logger.info("Trends API resources cleaned up")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")
