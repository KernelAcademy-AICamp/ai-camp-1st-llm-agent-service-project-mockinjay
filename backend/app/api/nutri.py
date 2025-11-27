"""
Nutrition API Router (NutriCoach)

This module provides additional nutrition-related endpoints.
The core NutriCoach functionality is in diet_care.py at /api/diet-care/nutri-coach

This router can be extended for:
- Nutrition database lookups
- Food search functionality
- Nutrition recommendations
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/nutri", tags=["nutrition"])


@router.get("/health")
async def nutri_health_check():
    """Health check for nutrition service"""
    return {"status": "healthy", "service": "nutrition"}
