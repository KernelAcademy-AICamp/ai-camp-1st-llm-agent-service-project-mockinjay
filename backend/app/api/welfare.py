"""
Welfare API endpoints

복지 프로그램 검색 및 조회 REST API
Data source: 공공데이터포털 2024-2025 검증 완료

Pattern: community.py
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime

from app.models.welfare import (
    WelfareProgram,
    WelfareProgramResponse,
    WelfareSearchRequest,
    WelfareSearchResponse,
    WelfareStatsResponse,
    WelfareCategory
)
from app.db.welfare_manager import WelfareManager

router = APIRouter()

# Global WelfareManager instance (initialized on first request)
_welfare_manager: Optional[WelfareManager] = None


async def get_welfare_manager() -> WelfareManager:
    """Get or create WelfareManager instance (singleton pattern)"""
    global _welfare_manager
    if _welfare_manager is None:
        _welfare_manager = WelfareManager()
        await _welfare_manager.connect()
    return _welfare_manager


# ============================================================================
# Welfare Program Endpoints
# ============================================================================

@router.get("/programs", response_model=List[WelfareProgramResponse])
async def get_welfare_programs(
    category: Optional[WelfareCategory] = Query(None, description="Filter by category"),
    disease: Optional[str] = Query(None, description="Filter by target disease (e.g., CKD, ESRD)"),
    ckd_stage: Optional[int] = Query(None, ge=1, le=5, description="Filter by CKD stage (1-5)"),
    limit: int = Query(20, ge=1, le=50, description="Maximum number of programs to return")
):
    """
    Get welfare programs with optional filters.

    Fetches welfare programs from MongoDB with various filtering options.
    Returns programs sorted by relevance or category.

    Args:
        category: Filter by welfare category
        disease: Filter by target disease
        ckd_stage: Filter by CKD stage
        limit: Maximum number of results (1-50, default: 20)

    Returns:
        List of welfare programs matching filters

    Raises:
        HTTPException: 500 if database error occurs
    """
    try:
        manager = await get_welfare_manager()

        # Apply filters based on query parameters
        if category:
            results = await manager.search_by_category(category.value, limit=limit)
        elif disease:
            results = await manager.search_by_disease(disease, limit=limit)
        elif ckd_stage:
            results = await manager.search_by_ckd_stage(ckd_stage, limit=limit)
        else:
            # Get all active programs
            results = await manager.search_by_category("sangjung_special", limit=limit)
            # Add other categories
            for cat in ["disability", "medical_aid", "transplant", "transport"]:
                cat_results = await manager.search_by_category(cat, limit=limit)
                results.extend(cat_results)

        # Serialize ObjectId to string
        for prog in results:
            if "_id" in prog:
                prog["_id"] = str(prog["_id"])

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch welfare programs: {str(e)}")


@router.get("/programs/{program_id}", response_model=WelfareProgramResponse)
async def get_welfare_program(program_id: str):
    """
    Get a specific welfare program by ID.

    Args:
        program_id: Program ID (e.g., "sangjung_ckd_v001")

    Returns:
        Welfare program details

    Raises:
        HTTPException: 404 if program not found
        HTTPException: 500 if database error occurs
    """
    try:
        manager = await get_welfare_manager()
        result = await manager.get_by_id(program_id)

        if not result:
            raise HTTPException(status_code=404, detail=f"Program not found: {program_id}")

        # Serialize ObjectId
        if "_id" in result:
            result["_id"] = str(result["_id"])

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch program: {str(e)}")


@router.post("/search", response_model=WelfareSearchResponse)
async def search_welfare_programs(request: WelfareSearchRequest):
    """
    Search welfare programs with text query and filters.

    Performs text search across program titles, descriptions, and keywords.
    Supports additional filtering by category, disease, and CKD stage.
    Results are ranked by relevance score.

    Args:
        request: WelfareSearchRequest with query and optional filters

    Returns:
        WelfareSearchResponse with matching programs and metadata

    Raises:
        HTTPException: 400 if invalid request
        HTTPException: 500 if database error occurs
    """
    try:
        manager = await get_welfare_manager()

        # Build filters
        filters = {}
        if request.category:
            filters["category"] = request.category.value
        if request.disease:
            filters["target_disease"] = {"$in": [request.disease]}
        if request.ckd_stage:
            filters["eligibility.ckd_stage"] = {"$in": [request.ckd_stage]}

        # Execute text search
        results = await manager.search_by_text(
            query=request.query,
            limit=request.limit,
            filters=filters if filters else None
        )

        # Serialize ObjectId
        for prog in results:
            if "_id" in prog:
                prog["_id"] = str(prog["_id"])

        return {
            "query": request.query,
            "total": len(results),
            "results": results,
            "filters_applied": filters
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/stats", response_model=WelfareStatsResponse)
async def get_welfare_stats():
    """
    Get welfare program statistics.

    Returns statistics about total number of programs and distribution by category.
    Uses caching for performance (1 hour TTL).

    Returns:
        WelfareStatsResponse with total count and category breakdown

    Raises:
        HTTPException: 500 if database error occurs
    """
    try:
        manager = await get_welfare_manager()
        stats = await manager.get_stats(use_cache=True)
        return stats

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")


@router.get("/categories", response_model=List[str])
async def get_welfare_categories():
    """
    Get all available welfare categories.

    Returns list of all unique categories present in the database.

    Returns:
        List of category strings (sorted alphabetically)

    Raises:
        HTTPException: 500 if database error occurs
    """
    try:
        manager = await get_welfare_manager()
        categories = await manager.get_all_categories()
        return categories

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")
