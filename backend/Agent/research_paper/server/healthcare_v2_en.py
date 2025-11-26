# healthcare_v2_en.py
"""
CareGuide Healthcare Chatbot v2 - OPTIMIZED
- Hybrid Search Engine (Keyword + Semantic) with Parallel Processing
- MongoDB with Connection Pooling & Optimized Indexes
- Pinecone Vector Database with Embedding Cache
- PubMed Advanced API with Batch Parallel Fetching
- Multi-tier Caching (LRU + Disk + Redis)
- Advanced Components (QueryRouter, PerformanceMonitor, CrossEncoder)
"""

import parlant.sdk as p
from parlant.sdk import ToolContext, ToolResult
import asyncio
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

import uuid
import os
from typing import Optional, Dict
from bson import ObjectId
from toon_format import encode, decode
import time
from pathlib import Path
import sys

# 프로젝트 루트를 Python 경로에 추가 (backend 폴더)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))
# Shared profile utilities
from Agent.parlant_common import (
    get_profile,
    convert_objectid_to_str,
    get_default_profile
)
# ==================== Optimized Imports ====================
from app.services.hybrid_search import OptimizedHybridSearchEngine
import json
import logging

# Optional: Cache Manager (requires Redis)
try:
    from cache_manager import CacheManager
    CACHE_AVAILABLE = True
except ImportError:
    try:
        from Agent.research_paper.server.cache_manager import CacheManager
        CACHE_AVAILABLE = True
    except ImportError:
        print("⚠️ CacheManager not available (Redis not installed). Running without cache.")
        CACHE_AVAILABLE = False
        CacheManager = None

# Advanced components
try:
    from advanced_components import (
        QueryRouter,
        PerformanceMonitor,
        CrossEncoderReranker,
        HybridScoringSystem
    )
except ImportError:
    from Agent.research_paper.server.advanced_components import (
        QueryRouter,
        PerformanceMonitor,
        CrossEncoderReranker,
        HybridScoringSystem
    )

# ==================== Configuration ====================
PROFILE_LIMITS = {
    "researcher": {"max_results": 10, "detail_level": "high"},
    "patient": {"max_results": 5, "detail_level": "medium"},
    "general": {"max_results": 3, "detail_level": "low"}
}

# ==================== Global Variables ====================
# Optimized: Using hybrid search engine with caching and advanced components
SEARCH_ENGINE = None
CACHE_MANAGER = None
QUERY_ROUTER = None
PERFORMANCE_MONITOR = None
RERANKER = None


# ==================== Helper Functions ====================

async def initialize_search_engine():
    """Initialize optimized search engine with caching and advanced components"""
    global SEARCH_ENGINE, CACHE_MANAGER, QUERY_ROUTER, PERFORMANCE_MONITOR, RERANKER, CACHE_AVAILABLE

    if SEARCH_ENGINE is None:
        print("🔍 Initializing OPTIMIZED healthcare system...")

        # 1. Initialize Cache Manager (if available)
        if CACHE_AVAILABLE:
            print("📦 Initializing cache manager...")
            try:
                CACHE_MANAGER = CacheManager()
                await CACHE_MANAGER.connect()
                print("✅ Cache manager ready (Redis connected)")
            except Exception as e:
                print(f"⚠️  Redis connection failed: {e}")
                print("   Continuing without Redis cache...")
                CACHE_MANAGER = None
                CACHE_AVAILABLE = False
        else:
            print("⚠️  Cache manager unavailable - running without Redis cache")
            CACHE_MANAGER = None

        # 2. Initialize Hybrid Search Engine (Optimized)
        print("🔍 Initializing optimized hybrid search engine...")
        SEARCH_ENGINE = OptimizedHybridSearchEngine(use_cache=CACHE_AVAILABLE)
        await SEARCH_ENGINE.initialize()
        print("✅ Optimized search engine ready")

        # 3. Initialize Advanced Components
        print("🎯 Initializing advanced components...")
        QUERY_ROUTER = QueryRouter()
        PERFORMANCE_MONITOR = PerformanceMonitor()
        RERANKER = CrossEncoderReranker()
        print("✅ Advanced components ready")

        print("🎉 OPTIMIZED healthcare system fully initialized!")
        print("   - Parallel processing enabled")
        print(f"   - Multi-tier caching {'active' if CACHE_AVAILABLE else 'disabled (Redis connection failed)'}")
        print("   - Query routing ready")
        print("   - Performance monitoring active")


async def llm_refine_results_v2(query: str, raw_results: dict, profile: str) -> str:
    """Generate LLM refinement prompt - Including PubMed detailed information

    Args:
        query: User question
        raw_results: Hybrid search results
        profile: User profile (researcher/patient/general)

    Returns:
        Refinement prompt to pass to LLM
    """

    # Detail level by profile
    detail_levels = {
        "researcher": "in academic and professional terminology with detailed explanations",
        "patient": "in practical and easy-to-understand manner, applicable to daily life",
        "general": "in very simple and plain language, minimizing technical terms"
    }

    number_of_results = {
        "researcher": 10,
        "patient": 5,
        "general": 3
    }

    # Prepare data for toon_format encoding (more compact than JSON)
    max_results = number_of_results[profile]

    # 1. QA data - encode as toon_format
    qa_data = []
    if raw_results["qa_results"]:
        for item in raw_results["qa_results"][:max_results]:
            source = item.get('source_dataset', 'AI Hub')
            if source.startswith('dataset_'):
                source = 'AI Hub'
            qa_data.append({
                "question": item.get('question', ''),
                "answer": item.get('answer', ''),
                "source": source
            })
    
    # 2. Local paper data - encode as toon_format
    paper_data = []
    if raw_results["paper_results"]:
        for item in raw_results["paper_results"][:max_results]:
            metadata = item.get('metadata', {})
            paper_data.append({
                "title": item.get('title', 'N/A'),
                "abstract": item.get('abstract', 'N/A'),
                "source": item.get('source', '대한신장학회'),
                "journal": metadata.get('journal', '') if isinstance(metadata, dict) else '',
                "pub_date": metadata.get('publication_date', '') if isinstance(metadata, dict) else ''
            })

    # # 3. Medical data - encode as toon_format
    # medical_data = []
    # if raw_results["medical_results"]:
    #     for item in raw_results["medical_results"][:max_results]:
    #         keywords = item.get('keyword', [])
    #         if isinstance(keywords, list):
    #             keywords = keywords[:3]
    #         else:
    #             keywords = [str(keywords)[:40]]
    #         medical_data.append({
    #             "keywords": keywords,
    #             "text": item.get('text', '')[:300]
    #         })

    # 4. PubMed data - encode as toon_format
    pubmed_data = []
    if raw_results["pubmed_results"]:
        for paper in raw_results["pubmed_results"][:max_results]:
            authors_list = paper.get('authors', [])[:3]
            pubmed_data.append({
                "title": paper.get('title', 'N/A'),
                "authors": authors_list,
                "journal": paper.get('journal', 'N/A'),
                "pub_date": paper.get('pub_date', 'N/A'),
                "pmid": paper.get('pmid', 'N/A'),
                "doi": paper.get('doi', 'N/A'),
                "abstract": paper.get('abstract', 'N/A'),
                "url": paper.get('url', 'N/A')
            })

    guideline_data = []
    if raw_results["guidelines_results"]:
        for item in raw_results["guidelines_results"][:max_results]:
            guideline_data.append({
                "keywords": item.get('keyword', 'N/A'),
                "text": item.get('text', 'N/A'),

            })

    # Encode to toon_format (more compact than JSON)
    qa_summary = encode(qa_data) if qa_data else "No results"
    paper_summary = encode(paper_data) if paper_data else "No results"
    # medical_summary = encode(medical_data) if medical_data else "No results"
    pubmed_summary = encode(pubmed_data) if pubmed_data else "No results"
    guideline_summary = encode(guideline_data) if guideline_data else "No results"

    # 5. Final prompt generation (using toon_format for compactness)
    prompt = f"""Question: "{query}"
Profile: {profile.upper()}

Search Results ({raw_results['search_method'].upper()} method):

- QA Database ({len(raw_results['qa_results'])} results):
{qa_summary}

[2] Papers ({len(raw_results['paper_results']) + len(raw_results['pubmed_results'])} results):
{paper_summary}
{pubmed_summary}

[3] Guidelines ({len(raw_results['guidelines_results'])} results):
{guideline_summary}

Write an accurate answer in Korean. Requirements:
- Profile: {detail_levels.get(profile, '')}
- Integrate information from all sources
- Cite sources properly:
  * For papers: Include paper title and "Smith et al. (2024)의 연구 (PMID: [pmid], DOI: [doi])에서는..."
- Structure: Introduction → Main content → Conclusion → References
- References section must include:
  * Paper titles for all PubMed and local papers cited
  * Abstract summaries (brief) for key papers
  * Source organizations (AI Hub, 대한신장학회, etc.)
- Add medical disclaimer: "⚠️ This is for educational purposes only. Consult healthcare professionals."

Begin:"""

    return prompt

# ==================== Medical Information Tools ====================

@p.tool
async def search_medical_qa(
    context: ToolContext,
    query: str,
    profile: str = "general",
    use_guidelines: bool = True,
    use_qa: bool = True,
    use_papers: bool = True,
    use_medical: bool = True,
    use_pubmed: bool = True,
    max_per_source: Optional[int] = None,
    max_guidelines: Optional[int] = None,
    max_qa: Optional[int] = None,
    max_papers: Optional[int] = None,
    max_medical: Optional[int] = None,
    max_pubmed: Optional[int] = None
) -> ToolResult:
    """OPTIMIZED Integrated medical information search tool

    **Optimizations**:
    - Parallel processing (PubMed, MongoDB, Pinecone)
    - Multi-tier caching (LRU + Disk + Redis)
    - Query routing (intent classification)
    - Cross-encoder re-ranking (improved relevance)
    - Performance monitoring

    **Note**: This tool may take up to 2-3 minutes to complete due to extensive search across multiple databases.

    **Search Methods**:
    1. MongoDB text search (parallel, connection pooled)
    2. Pinecone vector search (cached embeddings)
    3. Local paper database (optimized projections)
    4. PubMed API (batch parallel fetching)

    **Hybrid Score Calculation**:
    - Adaptive weights based on query type
    - Cross-encoder re-ranking for top results

    **Usage in Agent Conditions/Actions**:
    You can customize which sources to search and how many results from each:

    Example 1 - Search only papers and PubMed:
        use_qa=False, use_medical=False, use_papers=True, use_pubmed=True

    Example 2 - Get 20 papers and 10 PubMed articles:
        max_papers=20, max_pubmed=10

    Example 3 - Quick QA response (5 results only):
        use_papers=False, use_medical=False, use_pubmed=False, max_qa=5

    Example 4 - Researcher mode with custom limits:
        profile="researcher", max_qa=5, max_pubmed=15

    Args:
        context: ToolContext
        query: User question
        profile: User profile type (researcher/patient/general)
        use_guidelines: Enable guidelines database search (default: True)
        use_qa: Enable QA database search (default: True)
        use_papers: Enable local papers database search (default: True)
        use_medical: Enable medical patents database search (default: True)
        use_pubmed: Enable PubMed real-time search (default: True)
        max_per_source: Maximum results per source (overrides profile default if set)
        max_guidelines: Maximum guidelines results (overrides max_per_source and profile for guidelines)
        max_qa: Maximum QA results (overrides max_per_source and profile for QA)
        max_papers: Maximum papers results (overrides max_per_source and profile for papers)
        max_medical: Maximum medical results (overrides max_per_source and profile for medical)
        max_pubmed: Maximum PubMed results (overrides max_per_source and profile for PubMed)

    Returns:
        ToolResult with optimized search results and monitoring data
    """
    start_time = time.time()

    try:
        # Initialize optimized search engine
        await initialize_search_engine()

        # Get profile from context (customer tags) - this overrides the parameter
        # The LLM sometimes ignores guidelines and sends wrong profile
        actual_profile = await get_profile(context)
        if actual_profile != profile:
            print(f"⚠️ LLM sent profile='{profile}' but customer has tag '{actual_profile}', using '{actual_profile}'")
            profile = actual_profile

        # Validate and use profile
        if profile not in ["researcher", "patient", "general"]:
            print(f"⚠️ Invalid profile '{profile}', using 'general'")
            profile = "general"

        # Determine max_results: use max_per_source if provided, otherwise use profile default
        profile_max = PROFILE_LIMITS[profile]["max_results"]
        default_max = max_per_source if max_per_source is not None else profile_max

        # Calculate per-source limits (individual params take precedence)
        actual_max_guidelines = max_guidelines if max_guidelines is not None else default_max
        actual_max_qa = max_qa if max_qa is not None else default_max
        actual_max_papers = max_papers if max_papers is not None else default_max
        actual_max_medical = max_medical if max_medical is not None else default_max
        actual_max_pubmed = max_pubmed if max_pubmed is not None else default_max

        print(f"✅ Using profile: {profile}")
        print(f"📚 Source selection: Guidelines={use_guidelines}, QA={use_qa}, Papers={use_papers}, Medical={use_medical}, PubMed={use_pubmed}")
        print(f"🔢 Source limits: Guidelines={actual_max_guidelines}, QA={actual_max_qa}, Papers={actual_max_papers}, Medical={actual_max_medical}, PubMed={actual_max_pubmed}")

        # 1. Query Routing (classify intent)
        query_intent = QUERY_ROUTER.classify_query(query)
        print(f"🎯 Query intent: {query_intent}")

        # Check cache first (if available)
        cached_result = None
        if CACHE_MANAGER:
            # Include source selection and per-source limits in cache key
            cache_key = f"{query}:{profile}:{query_intent}:{use_guidelines}:{use_qa}:{use_papers}:{use_medical}:{use_pubmed}:{actual_max_guidelines}:{actual_max_qa}:{actual_max_papers}:{actual_max_medical}:{actual_max_pubmed}"
            cached_result = await CACHE_MANAGER.get("query_result", cache_key)
            if cached_result:
                elapsed = time.time() - start_time
                print(f"⚡ Cache HIT! Response time: {elapsed:.3f}s")
                PERFORMANCE_MONITOR.log_search(query, elapsed, cached_result.get('total_results', 0))
                return ToolResult(
                    data=cached_result['data'],
                    metadata={"cached": True, "response_time": elapsed}
                )

        print(f"\n🔍 [{profile.upper()}] Optimized search for '{query}'...")

        # 2. Execute OPTIMIZED hybrid search with per-source limits
        raw_results = await SEARCH_ENGINE.search_all_sources(
            query=query,
            use_semantic=True,
            use_guidelines=use_guidelines,
            use_qa=use_qa,
            use_papers=use_papers,
            use_medical=use_medical,
            use_pubmed=use_pubmed,
            max_guidelines=actual_max_guidelines,
            max_qa=actual_max_qa,
            max_papers=actual_max_papers,
            max_medical=actual_max_medical,
            max_pubmed=actual_max_pubmed
        )

        # 3. Cross-encoder re-ranking for better relevance
        if raw_results.get('qa_results') and isinstance(raw_results['qa_results'], list):
            # Only rerank if we have dict items
            if raw_results['qa_results'] and isinstance(raw_results['qa_results'][0], dict):
                # Add combined text field for reranking
                for r in raw_results['qa_results']:
                    if 'text' not in r:
                        r['text'] = f"{r.get('question', '')} {r.get('answer', '')}"

                # Rerank using the 'text' field
                reranked_qa = RERANKER.rerank(query, raw_results['qa_results'], top_k=actual_max_qa, text_field='text')
                raw_results['qa_results'] = reranked_qa

        # Convert ObjectId to string (for serialization)
        raw_results = convert_objectid_to_str(raw_results)

        # Generate LLM refinement prompt
        refinement_prompt = await llm_refine_results_v2(query, raw_results, profile)

        # Total result count
        total_count = sum([
            len(raw_results.get("guidelines_results", [])),
            len(raw_results["qa_results"]),
            len(raw_results["paper_results"]),
            len(raw_results["medical_results"]),
            len(raw_results["pubmed_results"])
        ])

        print(f"✅ Search complete: {total_count} total results")

        # Calculate performance metrics
        elapsed = time.time() - start_time
        PERFORMANCE_MONITOR.log_search(query, elapsed, total_count)

        # Get performance stats
        perf_stats = PERFORMANCE_MONITOR.get_stats()

        # Prepare result data (optimized to reduce size)
        # Note: raw_results removed - data is already in refinement_prompt via toon_format
        result_data = {
            "query": query,
            "profile": profile,
            "refinement_prompt": refinement_prompt,  # Contains toon_format encoded data (essential for LLM)
            "summary": {  # Compact summary only
                "search_method": raw_results["search_method"],
                "total_count": total_count,
                "sources": {
                    "guidelines": len(raw_results.get("guidelines_results", [])),
                    "qa": len(raw_results["qa_results"]),
                    "papers": len(raw_results["paper_results"]),
                    "medical": len(raw_results["medical_results"]),
                    "pubmed": len(raw_results["pubmed_results"])
                },
                "response_time": f"{elapsed:.3f}s"
            }
        }

        # Cache the result (if available)
        if CACHE_MANAGER:
            await CACHE_MANAGER.set("query_result", cache_key, {
                'data': result_data,
                'total_results': total_count
            })

        # Log result size
        import json
        import sys
        result_json = json.dumps(result_data)
        result_size_bytes = len(result_json)  # Use len() instead of sys.getsizeof() for actual JSON size
        result_size_kb = result_size_bytes / 1024

        print(f"📊 Tool result size: {result_size_kb:.1f} KB ({result_size_bytes:,} bytes)")
        print(f"📦 Result breakdown: query={len(query)} chars, prompt={len(refinement_prompt)} chars, summary={len(json.dumps(result_data['summary']))} chars")
        print(f"⚡ Response time: {elapsed:.3f}s (Avg: {perf_stats['avg_latency']:.3f}s, P95: {perf_stats['p95_latency']:.3f}s)")
        print(f"📊 Results by Source: Guidelines={len(raw_results.get('guidelines_results', []))}, QA={len(raw_results['qa_results'])}, Papers={len(raw_results['paper_results'])}, Medical={len(raw_results['medical_results'])}, PubMed={len(raw_results['pubmed_results'])}")

        if result_size_bytes > 1024 * 1024:
            print(f"⚠️  WARNING: Result exceeds 1024KB Parlant limit!")
        elif result_size_bytes > 64 * 1024:
            print(f"⚠️  Warning: Result is large ({result_size_kb:.1f} KB).")
        else:
            print(f"✅ Result size is optimal (<64KB)")

        return ToolResult(
            data=result_data,
            metadata={
                "cached": False,
                "response_time": elapsed,
                "query_intent": query_intent
            }
        )

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"❌ Search error: {e}")
        print(f"⚠️  Response time: {elapsed:.3f}s (with error)")
        return ToolResult(
            data={
                "error": str(e),
                "message": f"⚠️ An error occurred during search: {e}\nPlease try again later."
            }
        )


@p.tool
async def get_kidney_stage_info(
    context: ToolContext,
    gfr: Optional[float] = None,
    stage: Optional[int] = None
) -> ToolResult:
    """Chronic Kidney Disease (CKD) stage information tool

    Provides detailed information on stages 1-5 of Chronic Kidney Disease.
    Can query by GFR (Glomerular Filtration Rate) value or stage number.

    Args:
        context: ToolContext
        gfr: GFR value (ml/min/1.73m²)
        stage: CKD stage (1-5)

    Returns:
        Detailed information by stage (description, management, diet, monitoring schedule)
    """
    # Extract profile
    profile = await get_profile(context)

    # CKD stage information definition
    kidney_stages = {
        1: {
            "stage": "Stage 1 (Normal or High GFR)",
            "gfr_range": "≥ 90",
            "description": "Kidney function is normal but there is evidence of kidney damage such as proteinuria",
            "symptoms": "Mostly asymptomatic",
            "management": [
                "Thorough management of underlying diseases (diabetes, hypertension)",
                "Regular blood pressure monitoring and control",
                "Blood sugar control (for diabetic patients)",
                "Smoking cessation and maintaining appropriate weight"
            ],
            "dietary": [
                "Balanced healthy diet",
                "Salt restriction (less than 5g/day)",
                "Adequate water intake",
                "Avoid excessive protein intake"
            ],
            "monitoring": "Regular checkups every 6-12 months",
            "prognosis": "Progression can be delayed with proper management"
        },
        2: {
            "stage": "Stage 2 (Mild Decrease)",
            "gfr_range": "60-89",
            "description": "Mild decrease in kidney function",
            "symptoms": "Mostly asymptomatic, possible fatigue",
            "management": [
                "Maintain Stage 1 management",
                "Drug therapy to protect kidney function",
                "Avoid nephrotoxic drugs (NSAIDs, etc.)",
                "Regular kidney function tests"
            ],
            "dietary": [
                "Low-salt diet (less than 5g/day)",
                "Adequate water intake",
                "Maintain moderate protein (0.8g/kg/day)",
                "Consider potassium and phosphorus restriction"
            ],
            "monitoring": "Regular checkups every 3-6 months",
            "prognosis": "Progression rate can be significantly slowed"
        },
        3: {
            "stage": "Stage 3 (Moderate Decrease)",
            "gfr_range": "30-59 (3a: 45-59, 3b: 30-44)",
            "description": "Moderate decrease in kidney function",
            "symptoms": "Possible fatigue, edema, loss of appetite, sleep disorders",
            "management": [
                "Regular nephrology specialist visits",
                "Prevent complications (anemia, bone disease)",
                "Drug dosage adjustment needed",
                "Consider ACE inhibitors or ARB",
                "Phosphate binders may be used"
            ],
            "dietary": [
                "Strict low-salt diet (3-5g/day)",
                "Low-potassium diet (limit bananas, oranges)",
                "Low-phosphorus diet (limit dairy, nuts)",
                "Protein restriction (0.6-0.8g/kg/day)",
                "Water intake control"
            ],
            "monitoring": "Regular checkups every 3 months",
            "prognosis": "Progression can be delayed with active management, start considering dialysis preparation"
        },
        4: {
            "stage": "Stage 4 (Severe Decrease)",
            "gfr_range": "15-29",
            "description": "Severe kidney function decline, approaching end-stage renal failure",
            "symptoms": "Fatigue, edema, loss of appetite, nausea, itching, difficulty breathing, sleep disorders",
            "management": [
                "Close nephrology specialist management",
                "Prepare for dialysis or kidney transplant",
                "Consider arteriovenous fistula creation (for dialysis)",
                "Anemia treatment (EPO injections)",
                "Bone disease prevention (vitamin D, calcium)",
                "Cardiovascular disease prevention"
            ],
            "dietary": [
                "Very strict dietary restrictions",
                "Professional nutritionist consultation required",
                "Low-salt, low-potassium, low-phosphorus diet",
                "Strict protein restriction (0.6g/kg/day)",
                "Water restriction (if edema present)"
            ],
            "monitoring": "Regular checkups every 1-2 months",
            "prognosis": "Dialysis or transplant preparation needed, quality of life management important"
        },
        5: {
            "stage": "Stage 5 (Kidney Failure)",
            "gfr_range": "< 15 or on dialysis",
            "description": "End-stage renal failure, requires renal replacement therapy",
            "symptoms": "Severe fatigue, generalized edema, vomiting, difficulty breathing, possible altered consciousness",
            "management": [
                "Start dialysis (hemodialysis or peritoneal dialysis)",
                "Kidney transplant waiting or in progress",
                "Active complication management",
                "Treatment for anemia, bone disease, cardiovascular disease",
                "Mental health support (depression management)"
            ],
            "dietary": [
                "Diet adjustment based on dialysis type",
                "Hemodialysis: Strict low-potassium, low-phosphorus, water restriction",
                "Peritoneal dialysis: Relatively relaxed dietary restrictions",
                "High-protein diet (to compensate for dialysis losses)",
                "Regular nutritional status assessment"
            ],
            "monitoring": "Weekly or monthly regular checkups (during dialysis)",
            "prognosis": "Life can be maintained with dialysis, prognosis improves with transplant"
        }
    }

    # Determine stage by GFR
    if gfr is not None:
        if gfr >= 90:
            stage = 1
        elif gfr >= 60:
            stage = 2
        elif gfr >= 30:
            stage = 3
        elif gfr >= 15:
            stage = 4
        else:
            stage = 5

    # Return stage information
    if stage and stage in kidney_stages:
        stage_info = kidney_stages[stage]

        message = f"""🏥 **CKD {stage_info['stage']}** Information

📊 **GFR Range**: {stage_info['gfr_range']} ml/min/1.73m²
{'📈 **Your GFR**: ' + str(gfr) + ' ml/min/1.73m²' if gfr else ''}

📝 **Description**: {stage_info['description']}

🩺 **Main Symptoms**: {stage_info['symptoms']}

💊 **Management Methods**:
{chr(10).join([f'  • {item}' for item in stage_info['management']])}

🍽️ **Diet Therapy**:
{chr(10).join([f'  • {item}' for item in stage_info['dietary']])}

🔍 **Monitoring Schedule**: {stage_info['monitoring']}

🎯 **Prognosis**: {stage_info['prognosis']}
"""

        return ToolResult(
            data={
                "stage": stage,
                "info": stage_info,
                "gfr": gfr,
                "profile": profile,
                "message": message
            }
        )
    else:
        return ToolResult(
            data={
                "error": "Please enter a valid stage or GFR value.",
                "valid_stages": "1-5",
                "valid_gfr": "Number greater than 0",
                "profile": profile,
                "message": """❌ CKD stage information not found.

📋 **How to Use**:
  • Enter GFR value (e.g., gfr=45)
  • Or enter stage number (e.g., stage=3)

📌 **CKD Stage Criteria**:
  • Stage 1: GFR ≥ 90
  • Stage 2: GFR 60-89
  • Stage 3: GFR 30-59
  • Stage 4: GFR 15-29
  • Stage 5: GFR < 15 (end-stage renal failure)
"""
            }
        )


@p.tool
async def get_symptom_info(context: ToolContext, symptoms: str) -> ToolResult:
    """Kidney disease-related symptom information tool

    Provides information on symptoms related to kidney disease.
    If emergency symptoms are detected, immediately provides 911 guidance.

    Args:
        context: ToolContext
        symptoms: Symptom string (comma-separated, e.g., "fatigue, edema")

    Returns:
        Information and management methods by symptom
    """
    # Extract profile
    profile = await get_profile(context)

    # Convert string to list
    symptom_list = [s.strip() for s in symptoms.split(',')]

    # Check for emergency symptoms
    emergency_symptoms = [
        "chest pain", "difficulty breathing", "unconsciousness",
        "severe edema", "generalized edema", "blood in urine", "severe headache"
    ]
    found_emergency = [s for s in symptom_list if any(e in s.lower() for e in emergency_symptoms)]

    if found_emergency:
        return ToolResult(
            data={
                "is_emergency": True,
                "symptoms": symptom_list,
                "emergency_symptoms": found_emergency,
                "message": f"""🚨 **EMERGENCY DETECTED!**

The following symptoms may indicate an emergency:
{chr(10).join([f'  • {s}' for s in found_emergency])}

⚠️ **CALL 911 IMMEDIATELY!**

📞 **Emergency Call Instructions**:
1. Call 911 now
2. Tell them your exact location
3. Describe symptoms in detail
4. Maintain safe position until paramedics arrive

⏱️ Do not delay - act immediately!""",
                "action": "CALL_911_IMMEDIATELY",
                "profile": profile
            }
        )

    # General kidney disease symptom information
    symptom_database = {
        "fatigue": {
            "description": "Occurs due to anemia and toxin accumulation from decreased kidney function",
            "causes": [
                "Anemia (decreased red blood cell production)",
                "Uremic toxin accumulation",
                "Nutritional imbalance",
                "Sleep disorders"
            ],
            "management": [
                "Get adequate rest",
                "Proper nutritional intake",
                "Anemia testing and treatment (EPO injections if needed)",
                "Regular light exercise"
            ],
            "severity": "Mild to moderate"
        },
        "edema": {
            "description": "Swelling in ankles, legs, face, hands due to fluid retention",
            "causes": [
                "Decreased kidney water and salt excretion function",
                "Decreased blood albumin",
                "Possible heart failure"
            ],
            "management": [
                "Limit salt intake (less than 5g/day)",
                "Control water intake (follow doctor's instructions)",
                "Elevate legs while resting",
                "Diuretics may be prescribed (consult doctor)"
            ],
            "severity": "Moderate to severe"
        },
        "urinary changes": {
            "description": "Decreased urine volume, foamy urine, blood in urine, nocturia, etc.",
            "causes": [
                "Glomerular damage (proteinuria)",
                "Decreased kidney filtration function",
                "Possible urinary tract infection"
            ],
            "management": [
                "Urine test (check for protein, blood)",
                "Tests needed for accurate diagnosis",
                "Control water intake",
                "Keep voiding diary"
            ],
            "severity": "Moderate to severe"
        },
        "itching": {
            "description": "Skin itching due to phosphorus and toxin accumulation",
            "causes": [
                "Elevated blood phosphorus levels",
                "Uremic toxin accumulation",
                "Dry skin"
            ],
            "management": [
                "Apply moisturizer frequently",
                "Low-phosphorus diet (limit dairy, nuts)",
                "Take phosphate binders (if prescribed)",
                "Shower with lukewarm water"
            ],
            "severity": "Mild to moderate"
        },
        "loss of appetite": {
            "description": "Decreased appetite and nausea due to uremia",
            "causes": [
                "Uremic toxin accumulation",
                "Decreased gastrointestinal function",
                "Taste changes"
            ],
            "management": [
                "Eat small, frequent meals",
                "Focus on favorite foods",
                "Nutritionist consultation (nutritional status assessment)",
                "Anti-nausea medication may be prescribed"
            ],
            "severity": "Moderate"
        },
        "hypertension": {
            "description": "Blood pressure elevation due to decreased kidney function",
            "causes": [
                "Excess fluid",
                "Renin-angiotensin system activation",
                "Atherosclerosis"
            ],
            "management": [
                "Regular blood pressure monitoring",
                "Take antihypertensive medication",
                "Salt restriction",
                "Stress management"
            ],
            "severity": "Moderate to severe"
        },
        "difficulty breathing": {
            "description": "Shortness of breath due to pulmonary edema or anemia",
            "causes": [
                "Excess fluid (pulmonary edema)",
                "Anemia",
                "Accompanying heart failure"
            ],
            "management": [
                "Consult medical staff immediately",
                "Water restriction",
                "Diuretic adjustment",
                "Anemia treatment"
            ],
            "severity": "Severe (emergency possible)"
        }
    }

    # Collect information on entered symptoms
    found_symptoms = {}
    not_found = []

    for symptom in symptom_list:
        matched = False
        for key, info in symptom_database.items():
            if key.lower() in symptom.lower() or symptom.lower() in key.lower():
                found_symptoms[symptom] = info
                matched = True
                break
        if not matched:
            not_found.append(symptom)

    if found_symptoms:
        # Format symptom information
        symptom_details = ""
        for symptom, info in found_symptoms.items():
            symptom_details += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🩺 **{symptom.title()}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 **Description**: {info['description']}

🔍 **Causes**:
{chr(10).join([f'  • {cause}' for cause in info['causes']])}

💊 **Management Methods**:
{chr(10).join([f'  • {mgmt}' for mgmt in info['management']])}

⚠️ **Severity**: {info['severity']}
"""

        message = f"""✅ Found information on {len(found_symptoms)} symptom(s).

{symptom_details}

{"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" if not_found else ""}
{"❓ **No additional information for**: " + ", ".join(not_found) if not_found else ""}

⚠️ **Disclaimer**:
This information is provided for educational purposes only. If symptoms persist or worsen, please consult a healthcare professional.
"""

        return ToolResult(
            data={
                "is_emergency": False,
                "symptoms": symptom_list,
                "found_symptoms": found_symptoms,
                "not_found": not_found,
                "message": message,
                "profile": profile
            }
        )
    else:
        return ToolResult(
            data={
                "is_emergency": False,
                "symptoms": symptom_list,
                "message": f"""❓ Could not find specific information on the symptoms you entered.

📋 **Entered symptoms**: {', '.join(symptom_list)}

💡 **Help**:
  • Common kidney disease symptoms: fatigue, edema, urinary changes, itching, loss of appetite
  • Try using more specific symptom names
  • Or use general medical information search

⚠️ **Note**: If you have symptoms, please consult a healthcare professional.""",
                "profile": profile
            }
        )


@p.tool
async def check_emergency_keywords(context: ToolContext, text: str) -> ToolResult:
    """Emergency keyword detection tool

    Detects keywords indicating emergency situations in user input.

    Args:
        context: ToolContext
        text: Text to check

    Returns:
        Emergency status and guidance message
    """
    # 영문 응급 키워드
    EMERGENCY_KEYWORDS_EN = [
        "chest pain", "difficulty breathing", "unconsciousness",
        "severe edema", "generalized edema", "fainting", "collapse",
        "seizure", "severe bleeding", "altered consciousness",
        "sudden vision loss", "severe headache", "numbness"
    ]

    # 한글 응급 키워드
    EMERGENCY_KEYWORDS_KO = [
        # 흉통
        "흉통", "가슴 통증", "가슴이 아", "가슴 답답",

        # 호흡곤란
        "호흡곤란", "숨쉬기 힘", "숨이 차", "숨을 쉴 수 없",

        # 의식저하
        "의식저하", "의식 없", "정신 없", "깨어나지 않",

        # 경련
        "경련", "발작", "몸이 떨",

        # 출혈
        "심한출혈", "피가 많이", "출혈이 멈추지",

        # 실신
        "쓰러짐", "실신", "기절", "정신 잃",

        # 부종
        "부종 심", "전신 부종", "몸이 부", "얼굴이 부",

        # 기타
        "갑자기 안 보", "시력 상실", "심한 두통", "마비"
    ]

    # 통합
    EMERGENCY_KEYWORDS = EMERGENCY_KEYWORDS_EN + EMERGENCY_KEYWORDS_KO

    found_keywords = [kw for kw in EMERGENCY_KEYWORDS if kw in text.lower()]
    is_emergency = len(found_keywords) > 0

    if is_emergency:
        # 한글 키워드 포함 여부 확인
        has_korean = any(kw in EMERGENCY_KEYWORDS_KO for kw in found_keywords)

        if has_korean:
            message = f"""🚨 **응급 상황 감지!**

다음 응급 증상이 감지되었습니다:
{chr(10).join([f'  • {kw}' for kw in found_keywords])}

**즉시 조치가 필요합니다:**
📞 119에 즉시 전화하세요
🏥 가까운 응급실로 가세요
⚠️ 의료 조치를 지연하지 마세요"""
        else:
            message = f"""🚨 **EMERGENCY DETECTED!**

The following emergency keywords were detected:
{chr(10).join([f'  • {kw}' for kw in found_keywords])}

**IMMEDIATE ACTION REQUIRED:**
📞 Call emergency services immediately (119/911)
🏥 Go to the nearest emergency room
⚠️ Do not delay seeking medical care"""

        return ToolResult(
            data={
                "is_emergency": True,
                "found_keywords": found_keywords,
                "message": message
            }
        )

    return ToolResult(
        data={
            "is_emergency": False,
            "message": "No emergency situation detected."
        }
    )





# ==================== Guidelines ====================

async def add_safety_guidelines(agent: p.Agent) -> p.Guideline:
    """Add medical safety guidelines with priority relationships

    Returns:
        The disclaimer guideline to be used in other priority relationships
    """

    # CHK-001: No reassurance for symptoms
    no_reassurance = await agent.create_guideline(
        condition="User mentions symptoms",
        action="Never use reassuring phrases like 'don't worry' or 'it will be fine'. Always recommend consulting medical professionals. Respond in Korean."
    )

    # CHK-002: Emergency priority (HIGHEST PRIORITY)
    emergency_guideline = await agent.create_guideline(
        condition="Emergency keywords like chest pain, difficulty breathing, severe bleeding, unconsciousness are mentioned",
        action="Immediately tell user to call 911. Provide clear instructions: 1) Call 911 now 2) Tell them your exact location 3) Describe symptoms accurately 4) Follow dispatcher's instructions. Stop all other conversations. Use strong, urgent language. Respond in Korean.",
        tools=[check_emergency_keywords]
    )

    # CHK-005: No diagnosis or prescription
    no_diagnosis = await agent.create_guideline(
        condition="User asks for diagnosis or prescription",
        action="Never provide diagnosis or prescribe medications. Clearly state: 'I am not a healthcare professional and cannot provide diagnosis or prescriptions. Please consult with a doctor.' Respond in Korean."
    )

    # CHK-009: Disclaimer - MANDATORY for ALL responses (ALWAYS ACTIVE)
    disclaimer_guideline = await agent.create_guideline(
        condition="EVERY single response without exception",
        action="CRITICAL REQUIREMENT: You MUST end every response with this EXACT Korean disclaimer on a new line:\n\n⚠️ 이 답변은 교육 목적이며, 건강에 관한 궁금증이나 문제가 있을 경우 반드시 의료 전문가와 상담하시기 바랍니다.\n\nThis disclaimer is REQUIRED for client-side message processing. Never omit it under any circumstances."
    )

    # Entailment relationships: ALL guidelines must trigger the disclaimer
    # This ensures the disclaimer is ALWAYS included regardless of which guideline activates
    await no_reassurance.entail(disclaimer_guideline)
    await emergency_guideline.entail(disclaimer_guideline)
    await no_diagnosis.entail(disclaimer_guideline)

    # Priority relationships: Emergency has highest priority for content
    # But disclaimer is still enforced via entailment
    await emergency_guideline.prioritize_over(no_reassurance)
    await emergency_guideline.prioritize_over(no_diagnosis)

    return disclaimer_guideline


async def add_profile_guidelines(agent: p.Agent, disclaimer_guideline: p.Guideline) -> None:
    """User profile-based guidelines with disclaimer enforcement

    Args:
        agent: The Parlant agent
        disclaimer_guideline: The disclaimer guideline to prioritize
    """

    # Researcher profile
    researcher_guideline = await agent.create_guideline(
        condition="The customer has the tag 'profile:researcher'",
        action="""You must use academic language and technical terminology.
        Focus on research findings, biological mechanisms, and evidence-based information.
        Provide detailed scientific explanations with specific data when available.
        Always respond in Korean.""",
    )

    # Patient profile
    patient_guideline = await agent.create_guideline(
        condition="The customer has the tag 'profile:patient'",
        action="""You must use practical and applicable explanations.
        Focus on daily life applications, self-care methods, and patient-centered information.
        Provide specific, actionable advice that patients can implement.
        Use empathetic language and acknowledge the challenges of living with illness.
        Always respond in Korean.""",
    )

    # General profile
    general_guideline = await agent.create_guideline(
        condition="The customer has the tag 'profile:general'",
        action="""You must use simple and easy-to-understand explanations.
        Minimize technical terminology and use plain, everyday language.
        Focus on basic concepts and general understanding.
        Use analogies and examples to explain complex ideas.
        Always respond in Korean.""",
    )

    # Entailment: ALL profile guidelines must trigger the disclaimer
    # When any profile guideline activates, the disclaimer MUST also activate
    await researcher_guideline.entail(disclaimer_guideline)
    await patient_guideline.entail(disclaimer_guideline)
    await general_guideline.entail(disclaimer_guideline)


async def add_blocking_guidelines(agent: p.Agent, disclaimer_guideline: p.Guideline) -> None:
    """Blocking guidelines with disclaimer enforcement

    Args:
        agent: The Parlant agent
        disclaimer_guideline: The disclaimer guideline to enforce
    """

    # Non-medical topic blocking
    non_medical_blocking = await agent.create_guideline(
        condition="User asks about non-medical topics (sports, politics, entertainment, etc.)",
        action="Politely decline: 'I apologize, but CareGuide can only handle medical and health-related questions. If you have medical questions, I'd be happy to help.' Redirect to medical topics. Respond in Korean."
    )

    # Inappropriate request blocking
    inappropriate_blocking = await agent.create_guideline(
        condition="User makes inappropriate, offensive, or harmful requests",
        action="Firmly decline: 'I cannot process inappropriate requests. If you need medical information, please ask appropriate questions.' If repeated, end conversation. Respond in Korean."
    )

    # Even blocking responses must include the disclaimer
    await non_medical_blocking.entail(disclaimer_guideline)
    await inappropriate_blocking.entail(disclaimer_guideline)


# ==================== Journey ====================

async def create_medical_info_journey(agent: p.Agent) -> p.Journey:
    """Create medical information provision journey"""

    journey = await agent.create_journey(
        title="CareGuide Medical Information Journey v2",
        description="Systematic medical information provision journey with hybrid search",
        conditions=[
            "User asks for medical information",
            "User wants to know about kidney disease or medical topics",
            "User has health-related questions"
        ],
    )

    # Step 1: Initial greeting and profile confirmation
    t0 = await journey.initial_state.transition_to(
        chat_state="""Greet user warmly in Korean.
        Confirm their profile type (researcher/patient/general).
        Ask what specific medical information they need.
        Mention that you use hybrid search (keyword + semantic) across 4 data sources including real-time PubMed.
        Be friendly and professional."""
    )

    # Step 2: Information gathering - Hybrid search
    t1 = await t0.target.transition_to(
        tool_state=search_medical_qa,
        condition="User asks a medical question that needs comprehensive information from multiple sources"
    )

    # Step 2-alt: CKD stage information
    t2_alt = await t0.target.transition_to(
        tool_state=get_kidney_stage_info,
        condition="User asks specifically about CKD stages, GFR values, or kidney disease stages"
    )

    # Step 2-alt2: Symptom information
    t3_alt = await t0.target.transition_to(
        tool_state=get_symptom_info,
        condition="User describes specific symptoms or asks about symptom management"
    )

    # Step 3: Information provision and explanation (based on hybrid search results)
    t4 = await t1.target.transition_to(
        chat_state="""Use the refinement_prompt from search_medical_qa to generate your response in Korean.

        Structure your response based on user profile:
        - Researchers: Detailed technical info with citations
        - Patients: Practical advice with empathy
        - General users: Simple explanations

        Important:
        1. Integrate information from available sources (guidelines, QA, papers, medical data, PubMed)
        2. NOT all sources are used for every query - depends on tool parameters used
        3. Don't distinguish between local papers and PubMed papers - treat all as "논문 연구"
        4. Cite papers with authors, year, and identifiers when available (e.g., "Smith et al. (2024) 연구에 따르면...")
        5. Focus on the most relevant information, regardless of source
        6. Always add medical disclaimer at the end

        Respond in Korean."""
    )

    # Step 3-alt: CKD information explanation
    t5 = await t2_alt.target.transition_to(
        chat_state="""Explain the CKD stage information clearly based on user's profile level.
        Use the structured information provided by the tool.
        Add practical advice and recommendations.
        Always include medical disclaimer.
        Respond in Korean."""
    )

    # Step 3-alt2: Symptom information explanation
    t6 = await t3_alt.target.transition_to(
        chat_state="""Explain the symptom information clearly.
        If emergency detected, strongly emphasize calling 911 immediately.
        Provide management tips for non-emergency symptoms.
        Add medical disclaimer.
        Respond in Korean."""
    )

    # Step 4: Check for additional questions (all paths converge)
    t7 = await t4.target.transition_to(
        chat_state="""Ask if they need more information or have other questions in Korean.
        Offer to:
        - Explain in more detail
        - Provide related information
        - Search for specific topics
        - Clarify any confusion

        Be helpful and supportive."""
    )
    await t5.target.transition_to(state=t7.target)
    await t6.target.transition_to(state=t7.target)

    # Step 4 -> Loop back to search if more questions
    await t7.target.transition_to(
        state=t1.target,
        condition="User has follow-up medical questions or wants more information"
    )

    # Step 5: Wrap-up
    t8 = await t7.target.transition_to(
        chat_state="""Summarize key points discussed in Korean.
        Remind them that:
        - This information is for reference only
        - They should consult healthcare providers for medical decisions
        - CareGuide is always available for more questions

        Thank them for using CareGuide.
        Wish them good health.""",
        condition="User indicates they have no more questions or wants to end conversation"
    )

    await t8.target.transition_to(state=p.END_JOURNEY)

    # Emergency situation handling guideline (Journey-level)
    await journey.create_guideline(
        condition="Emergency symptoms are detected (chest pain, difficulty breathing, unconsciousness, severe edema, etc.)",
        action="""Immediately and assertively tell them to call 911 in Korean.
        Use urgent, clear language:
        '🚨 THIS IS AN EMERGENCY! CALL 911 IMMEDIATELY!'

        Provide step-by-step instructions:
        1. Call 911
        2. Report location
        3. Describe symptoms
        4. Follow dispatcher instructions

        Do not provide other information until emergency is addressed.
        Prioritize user safety above all."""
    )

    return journey


async def create_research_paper_journey(agent: p.Agent) -> p.Journey:
    """연구자 전용 논문 검색 및 분석 Journey

    이 Journey는 연구자에게 다음 기능을 제공합니다:
    - 고급 PubMed 검색 (최대 20개 결과)
    - 다중 논문 비교 분석
    - 메타분석 요약
    - 논문 북마크 (선택)

    Medical Information Journey와 차별점:
    - 연구자 프로필 전용
    - 더 많은 검색 결과 (10-20개 vs 3-5개)
    - 전문적인 분석 도구
    - 학술적 언어 사용
    """
    journey = await agent.create_journey(
        title="Research Paper Deep Dive",
        description="Advanced PubMed search and multi-paper comparison for researchers",
        conditions=[
            "User is a researcher",
            "User wants advanced paper search and analysis",
            "User needs to compare multiple research papers"
        ]
    )

    # Step 1: Welcome & Query Input
    t0 = await journey.initial_state.transition_to(
        chat_state="""Welcome to **Research Paper Deep Dive** - Advanced mode for researchers!

This journey provides:
✓ Extended PubMed search (up to 20 papers)
✓ Multi-paper comparative analysis
✓ Meta-analysis summarization
✓ Academic-level explanations

**Search Options**:
1. **Keyword search**: "CKD biomarker 2024"
2. **PMID search**: "PMID: 12345678, 87654321"
3. **Author search**: "Smith J [Author]"
4. **Journal search**: "New England Journal of Medicine [Journal]"

Please enter your search query in Korean or English:"""
    )

    # Step 2: Execute Search
    t1 = await t0.target.transition_to(
        tool_state=search_medical_qa,
        tool_instruction="""🔍 Executing PubMed search in researcher mode...

**Researcher Mode Settings**:
- Max results: 20 papers
- Include: Guidelines, Papers, PubMed API
- Exclude: Basic QA (research focus)

Searching across multiple academic sources..."""
    )

    # Step 3: Present Results and Ask for Next Action
    t2 = await t1.target.transition_to(
        chat_state="""📊 **Search Results**

Present the found papers clearly with key details (title, authors, journal, year, PMID).

**What would you like to do next?**
1. Analyze a specific paper in detail
2. Compare multiple papers
3. Summarize meta-analysis findings
4. Bookmark interesting papers
5. Refine your search query
6. Start a new search

Please tell me your choice."""
    )

    # Step 4: Single Paper Analysis (conditional)
    t3 = await t2.target.transition_to(
        chat_state="""📑 **Detailed Paper Analysis**

I'll provide an in-depth academic analysis covering:

**1. Study Design & Methodology**
   - Research type, sample size, study duration
   - Inclusion/exclusion criteria
   - Methodological quality

**2. Key Findings**
   - Primary and secondary outcomes
   - Statistical significance (p-values, confidence intervals)
   - Effect sizes

**3. Results Interpretation**
   - Clinical implications
   - Practical applications
   - Relevant patient subgroups

**4. Limitations & Bias Assessment**
   - Study limitations
   - Potential biases (selection, measurement, reporting)
   - Confounding factors

**5. Evidence Quality (GRADE)**
   - Risk of bias level
   - Consistency of results
   - Generalizability

**6. Clinical Recommendations**
   - Practice implications
   - Areas for further research

Would you like to analyze another paper, compare papers, or perform a different action?""",
        condition="User requests detailed analysis of a specific paper"
    )

    # Step 4-alt: Multi-Paper Comparison (conditional)
    t4 = await t2.target.transition_to(
        chat_state="""📊 **Comparative Analysis of Multiple Papers**

I'll systematically compare the selected papers:

**Comparison Matrix**:
| Aspect | Paper A | Paper B | Paper C |
|--------|---------|---------|---------|
| Design | ... | ... | ... |
| Sample Size | ... | ... | ... |
| Primary Outcome | ... | ... | ... |
| Effect Size | ... | ... | ... |
| P-value | ... | ... | ... |
| Evidence Level | ... | ... | ... |

**Consensus Findings**:
- Common trends across studies
- Magnitude and direction of effects
- Consistency across populations

**Discrepancies & Heterogeneity**:
- Methodological differences
- Variations in outcomes
- Sources of heterogeneity (I², τ²)

**Integrated Conclusion**:
Based on the synthesized evidence, here are the key clinical recommendations...

Would you like to explore specific aspects, add more papers, or take another action?""",
        condition="User wants to compare multiple research papers"
    )

    # Step 4-alt2: Meta-Analysis Summary (conditional)
    t5 = await t2.target.transition_to(
        chat_state="""🔬 **Meta-Analysis Summary**

Comprehensive meta-analysis breakdown:

**Study Characteristics**:
- Number of included studies: N
- Total participants: N
- Publication years: YYYY-YYYY

**Pooled Effect Size**:
- Effect measure: [OR/RR/HR/MD]
- Pooled estimate: X.XX (95% CI: X.XX to X.XX)
- Z-score and p-value

**Heterogeneity Assessment**:
- I² statistic: X% [interpretation]
- Cochran's Q: X (p = X.XX)
- τ² (tau-squared): X.XX

**Publication Bias**:
- Funnel plot symmetry: [assessment]
- Egger's test: p = X.XX
- Trim-and-fill analysis: [findings]

**Subgroup Analyses** (if available):
- By study design
- By geographic region
- By patient characteristics

**Sensitivity Analysis**:
- Leave-one-out results
- Fixed vs random effects comparison

**GRADE Evidence Quality**:
- Risk of bias: [rating]
- Inconsistency: [rating]
- Indirectness: [rating]
- Imprecision: [rating]
- Overall quality: [High/Moderate/Low/Very Low]

**Clinical Implications & Recommendations**

What would you like to do next?""",
        condition="User selected a meta-analysis paper for summary"
    )

    # Merge paths back
    await t3.target.transition_to(state=t2.target, condition="User wants to perform another analysis")
    await t4.target.transition_to(state=t2.target, condition="User wants to perform another analysis")
    await t5.target.transition_to(state=t2.target, condition="User wants to perform another analysis")

    # Step 5: Refine Search (loop back)
    t6 = await t2.target.transition_to(
        chat_state="""🔧 **Refine Your Search**

Current query can be refined using:

**Filters**:
- Publication year (e.g., 2020-2024)
- Study type (RCT, meta-analysis, cohort, case-control)
- Language

**Advanced Search Techniques**:
- MeSH terms for precise subject matching
- Boolean operators (AND, OR, NOT)
- Field-specific search: [Author], [Journal], [Title], [PMID]

**Examples**:
- \"CKD AND biomarker AND 2023[PDAT]\"
- \"Smith J[Author] AND kidney disease\"
- \"New England Journal of Medicine[Journal]\"

Please enter your refined search query:""",
        condition="User wants to refine the current search"
    )

    # Loop refined search back to search execution
    await t6.target.transition_to(state=t1.target)

    # Step 6: New Search (loop to beginning)
    await t2.target.transition_to(
        state=t0.target,
        condition="User wants to start a completely new search"
    )

    # Step 7: End Journey
    t7 = await t2.target.transition_to(
        chat_state="""Thank you for using **Research Paper Deep Dive**!

**Session Summary**:
- Multiple research papers explored
- Advanced analysis tools utilized
- Academic insights generated

💡 **Tip**: You can access your bookmarked papers anytime in My Page → Bookmarks.

The research journey continues - feel free to return anytime for more in-depth literature analysis!

Have a productive research day! 🔬📚""",
        condition="User indicates they want to end the session or says goodbye"
    )

    await t7.target.transition_to(state=p.END_JOURNEY)

    return journey


# ==================== Journey 7: Welfare Support Journey ====================


# ==================== Main Function ====================

async def register_agent(server: p.Server) -> None:
    """Main function - Server initialization and execution"""

    print("\n" + "="*70)
    print("🏥 CareGuide Healthcare Chatbot v2.0 Initializing...")
    print("="*70)

    # Initialize search engine
    print("\n[1/3] Initializing hybrid search engine...")
    await initialize_search_engine()

    # Get default profile (can be overridden by client)
    print("\n[2/3] Loading default profile...")
    profile = get_default_profile()

    print(f"\n[3/3] Setting up Parlant Server...")
    if server:  # Use provided server
        # Create Agent
        agent = await server.create_agent(
            name="CareGuide_v2",
            description="""You are CareGuide v2.0, an advanced medical information chatbot with cutting-edge search capabilities.

**Core Features**:
1. **Hybrid Search Engine**: Combines keyword matching (40%) and semantic similarity (60%)
2. **Multi-Source Integration**:
   - MongoDB (structured data with text indexing)
   - Pinecone (vector database for semantic search)
   - Local paper dataset (enriched with metadata)
   - PubMed API (real-time with detailed abstracts, authors, DOIs, MeSH terms)

**User Profile System**:
- Researcher: Academic language, max 10 results, technical details
- Patient: Practical advice, max 5 results, empathetic tone
- General: Simple explanations, max 3 results, plain language

**Ethical Guidelines**:
- Never diagnose or prescribe
- Detect and prioritize emergency situations (call 911 immediately)
- Provide evidence-based information with proper citations
- Always include medical disclaimer
- Protect patient privacy

**Response Quality**:
- Integrate information from multiple sources
- Prioritize recent PubMed research when available
- Provide actionable advice tailored to user profile
- Use empathetic, supportive language
- Maintain medical accuracy at all times

Always respond in Korean unless specifically requested otherwise.
""",
            composition_mode=p.CompositionMode.COMPOSITED
        )

        print("  ✅ Agent created")

        # Add guidelines with proper priority relationships
        print("  🔧 Adding safety guidelines...")
        disclaimer_guideline = await add_safety_guidelines(agent)

        print("  🔧 Adding profile-based guidelines...")
        await add_profile_guidelines(agent, disclaimer_guideline)

        print("  🔧 Adding blocking guidelines...")
        await add_blocking_guidelines(agent, disclaimer_guideline)

        # Create journeys
        print("  🗺️ Creating Medical Information Journey...")
        journey = await create_medical_info_journey(agent)

        print("  🗺️ Creating Research Paper Journey...")
        research_journey = await create_research_paper_journey(agent)

        # Create profile tag
        profile_tag = await server.create_tag(name=f"profile:{profile}")

        # Create customer
        time_uuid = uuid.uuid4()
        customer = await server.create_customer(
            name=f"user_{time_uuid}",
            tags=[profile_tag.id],
        )


        # Display server information
        print("="*70)
        print("🎉 CareGuide v2.0 + WelfareGuide Server Successfully Started!")
        print("="*70)
        print(f"\n📋 **Server Information**:")
        print(f"  • CareGuide Agent ID: {agent.id}")
        # print(f"  • WelfareGuide Agent ID: {welfare_agent.id}")
        print(f"  • Customer ID: {customer.id}")
        print(f"  • Medical Journey ID: {journey.id}")
        print(f"  • Research Journey ID: {research_journey.id}")
        # print(f"  • Welfare Journey ID (CareGuide): {welfare_journey.id}")

        print(f"\n👤 **User Profile**:")
        profile_display = {
            "researcher": "Researcher/Expert",
            "patient": "Patient/Experience Holder",
            "general": "General Public/Novice"
        }
        print(f"  • Selected Profile: {profile_display[profile]}")
        print(f"  • Max Results: {PROFILE_LIMITS[profile]['max_results']} per source")
        print(f"  • Detail Level: {PROFILE_LIMITS[profile]['detail_level']}")



if __name__ == "__main__":
    async def run_standalone():
        async with p.Server() as server:
            await register_agent(server)
            print("Server running standalone. Press Ctrl+C to exit.")
            await asyncio.Event().wait()

    asyncio.run(run_standalone())
