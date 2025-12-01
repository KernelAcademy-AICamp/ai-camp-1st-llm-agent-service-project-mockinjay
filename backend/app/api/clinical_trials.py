"""
Clinical Trials API Router
Handles clinical trial data from ClinicalTrials.gov
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
import httpx
from datetime import datetime
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
import hashlib
import json
from functools import lru_cache
import asyncio

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/clinical-trials", tags=["clinical-trials"])

# OpenAI client for AI summarization
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# In-memory cache for translated trials
# Key: (condition, page, page_size) -> Value: cached response with timestamp
_trials_cache = {}
_translation_cache = {}  # Key: text hash -> Value: translated text
CACHE_TTL = 3600  # Cache for 1 hour


# ==================== Cache Helper Functions ====================

def get_text_hash(text: str) -> str:
    """Generate hash for text to use as cache key"""
    return hashlib.md5(text.encode()).hexdigest()


def get_cache_key(condition: str, page: int, page_size: int) -> str:
    """Generate cache key for trial list"""
    return f"{condition}:{page}:{page_size}"


def is_cache_valid(timestamp: float) -> bool:
    """Check if cache is still valid"""
    return (datetime.now().timestamp() - timestamp) < CACHE_TTL


def get_cached_trials(condition: str, page: int, page_size: int) -> Optional[Dict[str, Any]]:
    """Get cached trial list if available and valid"""
    cache_key = get_cache_key(condition, page, page_size)
    if cache_key in _trials_cache:
        cached_data = _trials_cache[cache_key]
        if is_cache_valid(cached_data["timestamp"]):
            logger.info(f"Cache hit for trials: {cache_key}")
            return cached_data["data"]
        else:
            # Remove expired cache
            del _trials_cache[cache_key]
            logger.info(f"Cache expired for trials: {cache_key}")
    return None


def set_cached_trials(condition: str, page: int, page_size: int, data: Dict[str, Any]):
    """Cache trial list data"""
    cache_key = get_cache_key(condition, page, page_size)
    _trials_cache[cache_key] = {
        "data": data,
        "timestamp": datetime.now().timestamp()
    }
    logger.info(f"Cached trials: {cache_key}")


def get_cached_translation(text: str) -> Optional[str]:
    """Get cached translation if available"""
    text_hash = get_text_hash(text)
    if text_hash in _translation_cache:
        logger.info(f"Translation cache hit")
        return _translation_cache[text_hash]
    return None


def set_cached_translation(text: str, translation: str):
    """Cache translation"""
    text_hash = get_text_hash(text)
    _translation_cache[text_hash] = translation


# ==================== Request/Response Models ====================

class ClinicalTrialListRequest(BaseModel):
    """Request for clinical trial list"""
    condition: str = Field(default="kidney", description="Medical condition to search")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=10, ge=1, le=50, description="Results per page")
    status: Optional[str] = Field(default=None, description="Study status filter")


class ClinicalTrialDetailRequest(BaseModel):
    """Request for clinical trial detail with AI summary"""
    nct_id: str = Field(..., description="NCT ID of the trial")
    language: str = Field(default="ko", description="Summary language (ko/en)")


# ==================== Helper Functions ====================

async def fetch_clinical_trials(
    condition: str = "kidney",
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetch clinical trials from ClinicalTrials.gov API

    API Documentation: https://clinicaltrials.gov/api/v2/studies
    """
    try:
        base_url = "https://clinicaltrials.gov/api/v2/studies"

        # Build query parameters
        # API v2 uses query.term for keyword search
        query_parts = [f"AREA[Condition]{condition}"]
        if status:
            query_parts.append(f"AREA[OverallStatus]{status}")

        params = {
            "query.term": " AND ".join(query_parts),
            "pageSize": page_size,
            "format": "json",
            "sort": "LastUpdatePostDate:desc"  # Sort by last update date, newest first
        }

        # For pagination, use countTotal on first request
        if page == 1:
            params["countTotal"] = "true"

        async with httpx.AsyncClient(timeout=30.0) as client:
            # First request to get total count
            if page == 1:
                response = await client.get(base_url, params=params)
            else:
                # For subsequent pages, calculate the pageToken
                # pageToken is typically the next page token from previous response
                # For now, we'll use a simple approach
                params["pageSize"] = page_size
                response = await client.get(base_url, params=params)

            response.raise_for_status()
            data = response.json()

            return data

    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching clinical trials: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch clinical trials: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching clinical trials: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def fetch_trial_detail(nct_id: str) -> Dict[str, Any]:
    """
    Fetch detailed information for a specific clinical trial
    """
    try:
        url = f"https://clinicaltrials.gov/api/v2/studies/{nct_id}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params={"format": "json"})
            response.raise_for_status()
            data = response.json()

            return data

    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching trial detail: {e}")
        raise HTTPException(status_code=404, detail=f"Trial not found: {nct_id}")
    except Exception as e:
        logger.error(f"Error fetching trial detail: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def translate_to_korean(text: str) -> str:
    """
    Translate English text to Korean using OpenAI with caching
    """
    if not text or len(text.strip()) == 0:
        return text

    # Check cache first
    cached = get_cached_translation(text)
    if cached:
        return cached

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional medical translator. Translate the following English text to Korean. Maintain medical terminology accuracy. Only output the Korean translation without any additional explanation."},
                {"role": "user", "content": text}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        translation = response.choices[0].message.content.strip()

        # Cache the translation
        set_cached_translation(text, translation)

        return translation
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return text  # Return original text if translation fails


async def parse_trial_data(study: Dict[str, Any], translate: bool = False) -> Dict[str, Any]:
    """
    Parse and structure clinical trial data from API response
    """
    try:
        protocol = study.get("protocolSection", {})
        identification = protocol.get("identificationModule", {})
        status = protocol.get("statusModule", {})
        description = protocol.get("descriptionModule", {})
        conditions = protocol.get("conditionsModule", {})
        design = protocol.get("designModule", {})
        eligibility = protocol.get("eligibilityModule", {})
        contacts = protocol.get("contactsModule", {})

        # Extract raw data
        title = identification.get("briefTitle", "")
        official_title = identification.get("officialTitle", "")
        brief_summary = description.get("briefSummary", "")
        detailed_description = description.get("detailedDescription", "")
        eligibility_criteria = eligibility.get("eligibilityCriteria", "")
        study_type = design.get("studyType", "")
        overall_status = status.get("overallStatus", "")

        # Translate if requested
        if translate:
            title = await translate_to_korean(title)
            if official_title:
                official_title = await translate_to_korean(official_title)
            if brief_summary:
                brief_summary = await translate_to_korean(brief_summary)
            if detailed_description:
                detailed_description = await translate_to_korean(detailed_description)
            if eligibility_criteria:
                eligibility_criteria = await translate_to_korean(eligibility_criteria)
            if study_type:
                study_type = await translate_to_korean(study_type)
            if overall_status:
                overall_status = await translate_to_korean(overall_status)

        return {
            "nctId": identification.get("nctId", ""),
            "title": title,
            "officialTitle": official_title,
            "status": overall_status,
            "phase": design.get("phases", ["N/A"])[0] if design.get("phases") else "N/A",
            "studyType": study_type,
            "briefSummary": brief_summary,
            "detailedDescription": detailed_description,
            "conditions": conditions.get("conditions", []),
            "enrollment": design.get("enrollmentInfo", {}).get("count", 0),
            "startDate": status.get("startDateStruct", {}).get("date", ""),
            "completionDate": status.get("completionDateStruct", {}).get("date", ""),
            "lastUpdateDate": status.get("lastUpdatePostDateStruct", {}).get("date", ""),
            "sponsor": protocol.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name", ""),
            "locations": contacts.get("locations", []),
            "eligibilityCriteria": eligibility_criteria,
            "sex": eligibility.get("sex", ""),
            "minimumAge": eligibility.get("minimumAge", ""),
            "maximumAge": eligibility.get("maximumAge", ""),
        }

    except Exception as e:
        logger.error(f"Error parsing trial data: {e}", exc_info=True)
        return {}


async def generate_ai_summary(trial_data: Dict[str, Any], language: str = "ko") -> str:
    """
    Generate AI-powered summary of clinical trial using OpenAI
    """
    try:
        # Prepare content for summarization
        content = f"""
Clinical Trial Information:
Title: {trial_data.get('title', '')}
Status: {trial_data.get('status', '')}
Phase: {trial_data.get('phase', '')}
Study Type: {trial_data.get('studyType', '')}
Conditions: {', '.join(trial_data.get('conditions', []))}
Brief Summary: {trial_data.get('briefSummary', '')}
Detailed Description: {trial_data.get('detailedDescription', '')}
Eligibility Criteria: {trial_data.get('eligibilityCriteria', '')}
Enrollment: {trial_data.get('enrollment', 0)} participants
"""

        # Create prompt based on language
        if language == "ko":
            system_prompt = """당신은 의료 전문가를 위한 임상시험 요약 전문가입니다.
주어진 임상시험 정보를 한국어로 명확하고 이해하기 쉽게 요약해주세요.
다음 섹션을 포함해야 합니다:
1. 연구 개요 (2-3문장)
2. 주요 목적
3. 대상 환자
4. 참여 조건
5. 임상적 의의"""
        else:
            system_prompt = """You are a clinical trial summary expert for medical professionals.
Please provide a clear and concise summary of the given clinical trial information.
Include the following sections:
1. Study Overview (2-3 sentences)
2. Primary Objective
3. Target Patients
4. Eligibility
5. Clinical Significance"""

        # Call OpenAI API
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content}
            ],
            temperature=0.7,
            max_tokens=1000
        )

        summary = response.choices[0].message.content
        return summary

    except Exception as e:
        logger.error(f"Error generating AI summary: {e}", exc_info=True)
        return "AI 요약을 생성할 수 없습니다." if language == "ko" else "Unable to generate AI summary."


# ==================== API Endpoints ====================

@router.post("/list")
async def get_clinical_trials(request: ClinicalTrialListRequest) -> Dict[str, Any]:
    """
    Get list of clinical trials filtered by condition (default: kidney)

    Returns:
        - List of trials with basic information (cached for performance)
        - Total count
        - Pagination info
    """
    try:
        logger.info(f"Clinical trials list request: condition={request.condition}, page={request.page}")

        # Check cache first
        cached_response = get_cached_trials(request.condition, request.page, request.page_size)
        if cached_response:
            logger.info("Returning cached clinical trials")
            return cached_response

        # Fetch data from ClinicalTrials.gov
        data = await fetch_clinical_trials(
            condition=request.condition,
            page=request.page,
            page_size=request.page_size,
            status=request.status
        )

        # Parse studies with Korean translation
        studies = data.get("studies", [])
        trials = []

        for study in studies:
            trial = await parse_trial_data(study, translate=True)
            if trial:
                trials.append(trial)

        # Get total count
        total_count = data.get("totalCount", len(trials))

        response = {
            "status": "success",
            "trials": trials,
            "total": total_count,
            "page": request.page,
            "pageSize": request.page_size,
            "totalPages": (total_count + request.page_size - 1) // request.page_size
        }

        # Cache the response
        set_cached_trials(request.condition, request.page, request.page_size, response)

        return response

    except Exception as e:
        logger.error(f"Error in get_clinical_trials: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detail")
async def get_trial_detail_with_summary(request: ClinicalTrialDetailRequest) -> Dict[str, Any]:
    """
    Get detailed information about a specific clinical trial with AI-generated summary

    Returns:
        - Full trial details
        - AI-generated summary in requested language
    """
    try:
        logger.info(f"Clinical trial detail request: {request.nct_id}")

        # Fetch trial detail
        data = await fetch_trial_detail(request.nct_id)

        # Parse trial data with Korean translation
        study = data.get("protocolSection", {})
        trial_data = await parse_trial_data({"protocolSection": study}, translate=True)

        # Generate AI summary
        ai_summary = await generate_ai_summary(trial_data, request.language)

        return {
            "status": "success",
            "trial": trial_data,
            "aiSummary": ai_summary,
            "generatedAt": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_trial_detail_with_summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_trials(
    condition: str = Query(default="kidney", description="Medical condition to search"),
    status: Optional[str] = Query(default=None, description="Study status filter"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=50, description="Results per page")
) -> Dict[str, Any]:
    """
    Search clinical trials (GET endpoint for easy testing)
    """
    request = ClinicalTrialListRequest(
        condition=condition,
        page=page,
        page_size=page_size,
        status=status
    )
    return await get_clinical_trials(request)


# ==================== Health Check ====================

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test ClinicalTrials.gov API connectivity
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("https://clinicaltrials.gov/api/v2/stats/size")
            api_status = "connected" if response.status_code == 200 else "error"

        return {
            "status": "healthy",
            "service": "clinical_trials_api",
            "clinicalTrialsGov": api_status,
            "aiSummary": "ready" if os.getenv("OPENAI_API_KEY") else "no_api_key"
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "degraded",
            "service": "clinical_trials_api",
            "error": str(e)
        }
