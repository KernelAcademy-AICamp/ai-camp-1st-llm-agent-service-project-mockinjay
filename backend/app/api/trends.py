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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/trends", tags=["trends"])

# Global instances
trend_agent = TrendVisualizationAgent()
summarization_service = PaperSummarizationService()
pubmed_client = PubMedClient()


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


# ==================== API Endpoints ====================

@router.post("/temporal")
async def analyze_temporal_trends(request: TemporalTrendsRequest) -> Dict[str, Any]:
    """
    Analyze publication trends for a query across a year range.
    
    Returns:
        dict: Analysis result containing a line chart configuration, a textual trend explanation, a list of recent relevant papers, and metadata (e.g., peak year, total papers).
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

        result = await trend_agent.process(
            user_input=request.query,
            session_id=request.session_id,
            context=context
        )

        return result

    except Exception as e:
        logger.error(f"Temporal trends error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/geographic")
async def analyze_geographic_distribution(request: GeographicDistributionRequest) -> Dict[str, Any]:
    """
    Analyze geographic distribution for a research query and return visualization data and supporting results.
    
    Returns:
        dict: Result object containing:
            - `chart_config`: configuration for a horizontal bar chart of country-level counts.
            - `explanation`: textual summary describing the geographic distribution.
            - `papers`: list of sample paper metadata relevant to the query.
            - `metadata`: additional information such as top country, total results, and other summary metrics.
    """
    try:
        logger.info(f"Geographic distribution request: {request.query}")

        context = {
            'analysis_type': 'geographic',
            'countries': request.countries,
            'language': request.language
        }

        result = await trend_agent.process(
            user_input=request.query,
            session_id=request.session_id,
            context=context
        )

        return result

    except Exception as e:
        logger.error(f"Geographic distribution error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mesh")
async def analyze_mesh_categories(request: MeshCategoryRequest) -> Dict[str, Any]:
    """
    Analyze MeSH category and subheading distribution for the given query.
    
    Returns:
        dict: Analysis result containing:
            charts (dict): Chart configurations (e.g., 'categories' doughnut chart and 'subheadings' bar chart).
            explanation (str): Natural-language explanation of the MeSH analysis.
            papers (List[dict]): Sample papers returned for the query.
            metadata (dict): Additional metadata such as 'top_category', 'top_subheading', and other summary statistics.
    """
    try:
        logger.info(f"MeSH category request: {request.query}")

        context = {
            'analysis_type': 'mesh',
            'language': request.language
        }

        result = await trend_agent.process(
            user_input=request.query,
            session_id=request.session_id,
            context=context
        )

        return result

    except Exception as e:
        logger.error(f"MeSH category error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
async def compare_keywords(request: CompareKeywordsRequest) -> Dict[str, Any]:
    """
    Compare trends across the provided keywords and return a structured comparison result.
    
    Returns:
        dict: A result mapping with the following keys:
            - `chart`: chart configuration for a multi-line comparison of trends.
            - `explanation`: textual summary or interpretation of the comparison.
            - `papers`: list of paper records returned for the first keyword.
            - `metadata`: dictionary containing details such as `keywords` (compared), `start_year`, `end_year`, and `language`.
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

        result = await trend_agent.process(
            user_input=request.keywords[0],  # Use first keyword as main query
            session_id=request.session_id,
            context=context
        )

        return result

    except Exception as e:
        logger.error(f"Keyword comparison error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/papers")
async def search_papers(request: PapersRequest) -> Dict[str, Any]:
    """
    Search for research papers matching the request and return the results with summary metadata.
    
    Returns:
        dict: A dictionary with keys:
            - papers: list of paper metadata dictionaries (e.g., title, abstract, authors, identifiers).
            - total: int number of papers returned.
            - query: str the original search query.
            - status: str set to "success" when the search completes successfully.
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
    Produce an AI-generated summary for the provided papers.
    
    Parameters:
        request (SummarizeRequest): Request containing papers to summarize, a query, language, and `summary_type` ("single" to summarize the first paper, otherwise summarizes all provided papers).
    
    Returns:
        dict: A dictionary containing the summarization output produced by the summarization service augmented with a `'status': 'success'` entry.
    
    Raises:
        HTTPException: If an error occurs during summarization, an HTTP 500 exception is raised with the error detail.
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


# ==================== Health Check ====================

@router.get("/health")
async def health_check():
    """
    Get current health status of the trends API and its components.
    
    Returns:
        health (dict): Dictionary containing:
            - "status" (str): Overall service health (e.g., "healthy").
            - "service" (str): Service identifier (e.g., "trends_api").
            - "components" (dict): Mapping of component names to readiness strings (e.g., {"trend_agent": "ready", "summarization_service": "ready", "pubmed_client": "ready"}).
    """
    return {
        "status": "healthy",
        "service": "trends_api",
        "components": {
            "trend_agent": "ready",
            "summarization_service": "ready",
            "pubmed_client": "ready"
        }
    }


# ==================== Shutdown Handler ====================

@router.on_event("shutdown")
async def shutdown_event():
    """
    Close and release external resources used by the Trends API during application shutdown.
    
    Attempts to close the global TrendVisualizationAgent and PubMed client and logs success or any errors encountered.
    """
    try:
        await trend_agent.close()
        pubmed_client.close()
        logger.info("Trends API resources cleaned up")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")