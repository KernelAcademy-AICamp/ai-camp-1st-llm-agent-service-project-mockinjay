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
# ==================== Optimized Imports ====================
from app.services.hybrid_search import OptimizedHybridSearchEngine
from app.db.welfare_manager import WelfareManager
from app.db.hospital_manager import HospitalManager
import json
import logging

# Optional: Cache Manager (requires Redis)
try:
    from cache_manager import CacheManager
    CACHE_AVAILABLE = True
except ImportError:
    print("⚠️ CacheManager not available (Redis not installed). Running without cache.")
    CACHE_AVAILABLE = False
    CacheManager = None

# Advanced components
from advanced_components import (
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
WELFARE_MANAGER: Optional[WelfareManager] = None
HOSPITAL_MANAGER: Optional[HospitalManager] = None


# ==================== Helper Functions ====================

async def get_profile(context: ToolContext) -> str:
    """Determine profile based on plugin_data or customer tags

    IMPORTANT: Profile-specific behavior is controlled by Parlant guidelines.
    The LLM receives different instructions based on customer tags:
    - "profile:researcher" → Academic language, max 10 results
    - "profile:patient" → Practical advice, max 5 results
    - "profile:general" → Simple language, max 3 results

    This function reads customer tags from Parlant's internal stores to
    determine the correct profile for result limiting.

    Args:
        context: ToolContext with customer_id and plugin_data

    Returns:
        Profile type for result limiting
    """
    # 1. Check if profile is in plugin_data (preferred method)
    if hasattr(context, 'plugin_data') and context.plugin_data:
        # Support both 'profile' and 'careguide_profile' keys
        profile = context.plugin_data.get('profile') or context.plugin_data.get('careguide_profile')
        if profile and profile in ["researcher", "patient", "general"]:
            print(f"✅ Profile from plugin_data: {profile}")
            return profile

    # 2. Fetch customer and tags from Container using customer_id
    if hasattr(context, 'customer_id') and hasattr(context, 'plugin_data'):
        customer_id = context.customer_id
        container = context.plugin_data.get('container')

        if container and customer_id:
            try:
                # Import stores from Parlant core
                from parlant.core.customers import CustomerStore
                from parlant.core.tags import TagStore

                # Get customer from store
                customer_store = container[CustomerStore]
                customer = await customer_store.read_customer(customer_id)

                if customer and customer.tags:
                    print(f"🔍 Fetched customer with {len(customer.tags)} tag IDs: {customer.tags}")

                    # customer.tags is a list of TagId (strings)
                    # We need to fetch the actual Tag objects to get tag names
                    tag_store = container[TagStore]

                    for tag_id in customer.tags:
                        try:
                            # Fetch Tag object from TagStore
                            tag = await tag_store.read_tag(tag_id)
                            tag_name = tag.name

                            print(f"🔍 Tag ID '{tag_id}' → name '{tag_name}'")

                            # Check if this is a profile tag
                            if tag_name and tag_name.startswith('profile:'):
                                profile = tag_name.split(':', 1)[1]
                                if profile in ["researcher", "patient", "general"]:
                                    print(f"✅ Profile extracted from customer tags: {profile}")
                                    return profile
                        except Exception as tag_error:
                            print(f"⚠️  Failed to read tag {tag_id}: {tag_error}")
                            continue

            except Exception as e:
                print(f"⚠️  Failed to fetch customer from store: {e}")
                import traceback
                traceback.print_exc()

    # 3. Check customer object if directly available (unlikely but kept as fallback)
    customer = getattr(context, 'customer', None)
    if customer and hasattr(customer, 'tags'):
        print(f"🔍 Customer object available directly with tags: {customer.tags}")
        # In this case, tags might already be Tag objects or TagIds
        for tag in customer.tags:
            tag_name = tag if isinstance(tag, str) else (tag.name if hasattr(tag, 'name') else str(tag))
            if tag_name and tag_name.startswith('profile:'):
                profile = tag_name.split(':', 1)[1]
                if profile in ["researcher", "patient", "general"]:
                    print(f"✅ Profile extracted from customer object: {profile}")
                    return profile

    # Note: We don't fetch from REST API here to avoid deadlock
    # The Parlant server is busy executing this tool, so HTTP requests
    # to the same server will timeout or block.

    # Default profile for result limiting
    # The actual response style is controlled by Parlant guidelines
    print(f"ℹ️  Using default profile limits (guidelines control actual behavior)")
    return "general"


def convert_objectid_to_str(data):
    """Convert ObjectId to string (recursive)"""
    if isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    else:
        return data


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
                "question": item.get('question', '')[:200],
                "answer": item.get('answer', '')[:500],
                "source": source
            })
    
    # 2. Local paper data - encode as toon_format
    paper_data = []
    if raw_results["paper_results"]:
        for item in raw_results["paper_results"][:max_results]:
            metadata = item.get('metadata', {})
            paper_data.append({
                "title": item.get('title', 'N/A'),
                "abstract": item.get('abstract', 'N/A')[:400],
                "source": item.get('source', '대한신장학회'),
                "journal": metadata.get('journal', '')[:50] if isinstance(metadata, dict) else '',
                "pub_date": metadata.get('publication_date', '') if isinstance(metadata, dict) else ''
            })

    # 3. Medical data - encode as toon_format
    medical_data = []
    if raw_results["medical_results"]:
        for item in raw_results["medical_results"][:max_results]:
            keywords = item.get('keyword', [])
            if isinstance(keywords, list):
                keywords = keywords[:3]
            else:
                keywords = [str(keywords)[:40]]
            medical_data.append({
                "keywords": keywords,
                "text": item.get('text', '')[:300]
            })

    # 4. PubMed data - encode as toon_format
    pubmed_data = []
    if raw_results["pubmed_results"]:
        for paper in raw_results["pubmed_results"][:max_results]:
            authors_list = paper.get('authors', [])[:3]
            pubmed_data.append({
                "title": paper.get('title', 'N/A')[:200],
                "authors": authors_list,
                "journal": paper.get('journal', 'N/A')[:50],
                "pub_date": paper.get('pub_date', 'N/A'),
                "pmid": paper.get('pmid', 'N/A'),
                "doi": paper.get('doi', 'N/A')[:40],
                "abstract": paper.get('abstract', 'N/A')[:400],
                "url": paper.get('url', 'N/A')
            })

    # Encode to toon_format (more compact than JSON)
    qa_summary = encode(qa_data) if qa_data else "No results"
    paper_summary = encode(paper_data) if paper_data else "No results"
    medical_summary = encode(medical_data) if medical_data else "No results"
    pubmed_summary = encode(pubmed_data) if pubmed_data else "No results"

    # 5. Final prompt generation (using toon_format for compactness)
    prompt = f"""Question: "{query}"
Profile: {profile.upper()}

Search Results ({raw_results['search_method'].upper()} method):

[1] QA Database ({len(raw_results['qa_results'])} results):
{qa_summary}

[2] Local Papers ({len(raw_results['paper_results'])} results):
{paper_summary}

[3] Medical Data ({len(raw_results['medical_results'])} results):
{medical_summary}

[4] PubMed ({len(raw_results['pubmed_results'])} results):
{pubmed_summary}

Note: Results are in toon_format (compact data format). 
- Simple objects: "key: value" format
- Arrays: "[N,]header: row1,row2..." format
- Use decode() if needed, but you can read the format directly.

Write an accurate answer in Korean. Requirements:
- Profile: {detail_levels.get(profile, '')}
- Integrate information from all sources
- Cite sources properly:
  * For QA data: "AI Hub 데이터에 따르면..." or use specific source name shown
  * For local papers: "대한신장학회 논문에서..." or use specific source/journal name shown
  * For medical data: "의료 특허 데이터에서는..."
  * For PubMed: Include paper title and "Smith et al. (2024)의 연구 (PMID: [pmid], DOI: [doi])에서는..."
- Structure: Introduction → Main content → Conclusion → References
- References section must include:
  * Paper titles for all PubMed and local papers cited
  * Abstract summaries (brief) for key papers
  * Source organizations (AI Hub, 대한신장학회, etc.)
- Add medical disclaimer: "⚠️ This is for educational purposes only. Consult healthcare professionals."

Begin:"""

    return prompt


def get_default_profile() -> str:
    """Get default profile from environment variable.

    This is only used when running the Parlant server directly.
    When accessed via the UI, the profile is determined by the client.

    Returns:
        Default profile type (researcher, patient, or general)
    """
    profile = os.getenv("CARE_GUIDE_DEFAULT_PROFILE", "general").lower()

    if profile not in ["researcher", "patient", "general"]:
        print(f"⚠️  Invalid profile '{profile}' in environment variable, using 'general'")
        profile = "general"

    profile_names = {
        "researcher": "Researcher/Expert",
        "patient": "Patient/Experience Holder",
        "general": "General Public/Novice"
    }

    print(f"\n✅ Using default profile: {profile_names[profile]}")
    print("   (Profile can be overridden by client session metadata)\n")

    return profile


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


# ==================== Welfare & Hospital Tools ====================

logger = logging.getLogger(__name__)


async def initialize_welfare_manager():
    """Initialize WelfareManager singleton

    SEARCH_ENGINE 초기화 패턴 적용
    """
    global WELFARE_MANAGER
    if WELFARE_MANAGER is None:
        WELFARE_MANAGER = WelfareManager()
        await WELFARE_MANAGER.connect()
        logger.info("✅ WelfareManager initialized for Parlant Tool")


async def initialize_hospital_manager():
    """Initialize HospitalManager singleton"""
    global HOSPITAL_MANAGER
    if HOSPITAL_MANAGER is None:
        HOSPITAL_MANAGER = HospitalManager()
        await HOSPITAL_MANAGER.connect()
        logger.info("✅ HospitalManager initialized for Parlant Tool")


@p.tool
async def search_welfare_programs(
    context: ToolContext,
    query: str,
    category: Optional[str] = None,
    disease: Optional[str] = None,
    ckd_stage: Optional[int] = None
) -> ToolResult:
    """Search welfare programs for CKD patients

    이 도구는 만성콩팥병 환자를 위한 복지 프로그램을 검색합니다.
    산정특례, 장애인 복지, 의료비 지원, 신장이식 지원, 교통비 지원 등을 찾을 수 있습니다.

    **데이터 출처**:
    - 국민건강보험공단 (NHIS)
    - 보건복지부 (MOHW)
    - 질병관리청 (KDCA)
    - 공공데이터포털 (data.go.kr)
    - 2024-2025년 검증된 정부 프로그램

    **주요 카테고리**:
    - sangjung_special: 산정특례 제도 (본인부담금 감면 10%)
    - disability: 장애인 복지 혜택 (장애인연금, 공공요금 감면 등)
    - medical_aid: 저소득층 의료비 지원 (재난적 의료비, 긴급 의료비)
    - transplant: 신장이식 지원 (KAMCO-밀알복지재단, 사랑의장기기증)
    - transport: 투석 환자 교통비 및 활동 지원

    **사용 예시**:
    - search_welfare_programs(query="산정특례")
    - search_welfare_programs(query="의료비", category="medical_aid")
    - search_welfare_programs(query="지원", ckd_stage=4)

    Args:
        context: Tool execution context (automatic)
        query: 검색어 (e.g., "산정특례", "장애인 등록", "의료비 지원")
        category: 카테고리 필터 (optional)
        disease: 질병 필터 (e.g., "CKD", "ESRD", "dialysis") (optional)
        ckd_stage: CKD 단계 필터 1-5 (optional)

    Returns:
        ToolResult containing:
        - results: 검색된 프로그램 리스트
        - synthesis_prompt: LLM이 사용할 합성 프롬프트
        - metadata: 검색 메타데이터 (count, response_time)
    """
    start_time = time.time()

    try:
        # Initialize WelfareManager (singleton)
        await initialize_welfare_manager()

        # Get profile for result limiting
        profile = await get_profile(context)
        max_results = PROFILE_LIMITS[profile]["max_results"]

        logger.info(f"[WELFARE TOOL] Search started: query='{query}', profile='{profile}', max={max_results}")

        # Build filters
        filters = {}
        if category:
            filters["category"] = category
            logger.info(f"[WELFARE TOOL] Filter: category={category}")

        if disease:
            filters["target_disease"] = {"$in": [disease]}
            logger.info(f"[WELFARE TOOL] Filter: disease={disease}")

        if ckd_stage:
            filters["eligibility.ckd_stage"] = {"$in": [ckd_stage]}
            logger.info(f"[WELFARE TOOL] Filter: ckd_stage={ckd_stage}")

        # Execute search
        results = await WELFARE_MANAGER.search_by_text(
            query=query,
            limit=max_results,
            filters=filters if filters else None
        )

        logger.info(f"[WELFARE TOOL] Search completed: {len(results)} results in {time.time()-start_time:.3f}s")

        # Format results for LLM
        formatted_results = []
        for prog in results:
            formatted_results.append({
                "programId": prog.get("programId"),
                "title": prog.get("title"),
                "category": prog.get("category"),
                "description": prog.get("description"),
                "benefits": prog.get("benefits", {}),
                "application": prog.get("application", {}),
                "contact": prog.get("contact", {}),
                "keywords": prog.get("keywords", []),
                "year": prog.get("year"),
                "fact_check_verified": prog.get("fact_check_verified", False),
                "score": prog.get("score", 0)
            })

        # Generate LLM synthesis prompt
        synthesis_prompt = f"""You are CareGuide, an AI assistant helping CKD patients find welfare programs.

**User Query**: "{query}"
**User Profile**: {profile}
  - researcher: Provide detailed, academic-level information with sources
  - patient: Provide practical, step-by-step guidance with empathy
  - general: Provide simple, easy-to-understand explanation

**Search Results**: {len(formatted_results)} welfare programs found

**Programs**:
{json.dumps(formatted_results, ensure_ascii=False, indent=2)}

**Your Task**:
Synthesize the above welfare program information into a comprehensive, helpful response.

**Required Content**:
1. **Brief Summary** (1-2 sentences):
   - Overview of available programs matching the query

2. **Program Details** (for each program):
   - 💳 Program name and category
   - 📋 Eligibility requirements (who can apply)
   - ✨ Benefits (copay reduction, financial support, specific amounts)
   - 📝 Application process (step-by-step)
   - 📄 Required documents (bulleted list)
   - 📍 Where to apply
   - ⏱️ Processing time and validity period
   - 📞 Contact information (phone number, website)

3. **Important Notes**:
   - Clarify that final eligibility is determined by authorities
   - Provide specific contact numbers for personalized guidance
   - Encourage users to contact programs directly for accurate info
   - Mention fact-check verification if available

4. **Next Steps**:
   - Suggest related programs if applicable
   - Offer to find nearby hospitals/application centers
   - Suggest other helpful actions

**Response Style**:
{'Academic and detailed with references' if profile == 'researcher' else 'Practical and supportive with examples' if profile == 'patient' else 'Simple and encouraging'}

**Language**: Use Korean (한국어) for all responses.

**Format**:
- Use markdown formatting
- Use emojis for visual clarity (💳, 📋, ✨, etc.)
- Bold important information
- Use bullet points and numbered lists
- Include phone numbers and websites as clickable links where possible

**Disclaimer**:
Always remind users that this is general information based on 2024-2025 government data and they should contact the relevant authorities for personalized eligibility assessment.
"""

        elapsed = time.time() - start_time

        return ToolResult(
            data={
                "query": query,
                "category": category,
                "disease": disease,
                "ckd_stage": ckd_stage,
                "profile": profile,
                "results": formatted_results,
                "synthesis_prompt": synthesis_prompt,
                "metadata": {
                    "count": len(formatted_results),
                    "response_time": f"{elapsed:.3f}s",
                    "max_results": max_results,
                    "filters_applied": bool(filters),
                    "data_source": "공공데이터포털 2024-2025 검증 완료"
                }
            }
        )

    except Exception as e:
        logger.error(f"[WELFARE TOOL] Error: {e}", exc_info=True)
        return ToolResult(
            data={
                "error": str(e),
                "query": query,
                "results": [],
                "synthesis_prompt": f"복지 프로그램 검색 중 오류가 발생했습니다: {e}. 죄송합니다. 국민건강보험공단(1577-1000) 또는 보건복지콜센터(129)로 직접 문의하시기 바랍니다."
            }
        )


@p.tool
async def search_hospitals(
    context: ToolContext,
    query: Optional[str] = None,
    region: Optional[str] = None,
    has_dialysis: Optional[bool] = None,
    night_dialysis: Optional[bool] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    max_distance_km: Optional[float] = 10.0
) -> ToolResult:
    """Search hospitals, pharmacies, and dialysis centers

    이 도구는 병원, 약국, 투석센터를 검색합니다.
    특히 복지 프로그램 신청이 가능한 병원이나 투석 가능한 병원을 찾을 수 있습니다.

    **104,836개** 병원/약국 데이터베이스에서 검색합니다.

    **검색 방법**:
    1. Text search: query parameter (e.g., "서울대병원")
    2. Regional search: region parameter (e.g., "서울", "부산")
    3. Nearby search: latitude + longitude (e.g., 37.5826, 127.0001)

    **사용 예시**:
    - search_hospitals(region="서울", has_dialysis=True)
    - search_hospitals(query="서울대병원")
    - search_hospitals(latitude=37.5826, longitude=127.0001, max_distance_km=5.0)

    Args:
        context: Tool execution context (automatic)
        query: 병원명 또는 검색어 (optional)
        region: 지역 (e.g., "서울", "부산", "대구") (optional)
        has_dialysis: 투석 가능 병원만 (optional)
        night_dialysis: 야간 투석 가능 병원만 (optional)
        latitude: 사용자 위도 (nearby search용) (optional)
        longitude: 사용자 경도 (nearby search용) (optional)
        max_distance_km: 최대 거리 (km) (default: 10.0)

    Returns:
        ToolResult containing:
        - results: 병원 리스트
        - synthesis_prompt: LLM이 사용할 프롬프트
        - metadata: 검색 메타데이터
    """
    start_time = time.time()

    try:
        # Initialize HospitalManager
        await initialize_hospital_manager()

        # Get profile for result limiting
        profile = await get_profile(context)
        max_results = PROFILE_LIMITS[profile]["max_results"] * 2  # 병원은 더 많이 표시

        logger.info(f"[HOSPITAL TOOL] Search started: query='{query}', region='{region}', dialysis={has_dialysis}")

        # Determine search method
        results = []

        if latitude is not None and longitude is not None:
            # Nearby search (geospatial)
            logger.info(f"[HOSPITAL TOOL] Using nearby search: lat={latitude}, lng={longitude}, distance={max_distance_km}km")
            results = await HOSPITAL_MANAGER.search_nearby(
                latitude=latitude,
                longitude=longitude,
                max_distance_km=max_distance_km,
                has_dialysis=has_dialysis,
                limit=max_results
            )

        elif region:
            # Regional search
            logger.info(f"[HOSPITAL TOOL] Using regional search: region={region}")
            results = await HOSPITAL_MANAGER.search_by_region(
                region=region,
                has_dialysis=has_dialysis,
                night_dialysis=night_dialysis,
                limit=max_results
            )

        elif query:
            # Text search
            logger.info(f"[HOSPITAL TOOL] Using text search: query={query}")
            filters = {}
            if has_dialysis:
                filters["has_dialysis_unit"] = True
            if night_dialysis:
                filters["night_dialysis"] = True

            results = await HOSPITAL_MANAGER.search_by_text(
                query=query,
                limit=max_results,
                filters=filters if filters else None
            )

        else:
            # Default: Get dialysis centers
            logger.info(f"[HOSPITAL TOOL] Using default: get dialysis centers")
            results = await HOSPITAL_MANAGER.get_dialysis_centers(
                region=region,
                night_only=night_dialysis or False,
                limit=max_results
            )

        logger.info(f"[HOSPITAL TOOL] Search completed: {len(results)} results")

        # Format results
        formatted_results = []
        for hospital in results:
            formatted_results.append({
                "name": hospital.get("name"),
                "address": hospital.get("address"),
                "phone": hospital.get("phone"),
                "region": hospital.get("region"),
                "type": hospital.get("type"),
                "has_dialysis": hospital.get("has_dialysis_unit", False),
                "dialysis_machines": hospital.get("dialysis_machines", 0),
                "night_dialysis": hospital.get("night_dialysis", False),
                "dialysis_days": hospital.get("dialysis_days", []),
                "naver_map": hospital.get("naver_map_url"),
                "kakao_map": hospital.get("kakao_map_url"),
                "distance": hospital.get("distance")  # For nearby search
            })

        # Generate LLM synthesis prompt
        synthesis_prompt = f"""You are CareGuide, helping users find hospitals and dialysis centers.

**Search Parameters**:
- Query: {query or 'N/A'}
- Region: {region or 'N/A'}
- Dialysis capability: {has_dialysis or 'N/A'}
- Night dialysis: {night_dialysis or 'N/A'}
- Location: {f'({latitude}, {longitude})' if latitude else 'N/A'}

**Hospitals Found**: {len(formatted_results)}

**Hospital Data**:
{json.dumps(formatted_results, ensure_ascii=False, indent=2)}

**Your Task**:
Synthesize hospital information into a helpful response.

**Required Content**:
1. **Summary**: Brief overview of hospitals found
2. **Hospital List**: For each hospital:
   - 🏥 Hospital name
   - 📍 Address
   - 📞 Phone number
   - 💉 Dialysis capability (if applicable)
     - Number of machines
     - Night dialysis availability
     - Available days
   - 🗺️ Map links (Naver/Kakao)
   - 📏 Distance (if nearby search)

3. **Recommendations**:
   - Best options based on user needs
   - Tips for visiting or contacting
   - Which hospital to visit for welfare program application

4. **Additional Info**:
   - For welfare program application (산정특례, 장애진단서 etc.)
   - Suggest calling ahead to confirm services

**Language**: Use Korean (한국어).

**Format**:
- Use markdown
- Use emojis for clarity
- Bold hospital names
- Provide clickable map links if available
"""

        elapsed = time.time() - start_time

        return ToolResult(
            data={
                "query": query,
                "region": region,
                "has_dialysis": has_dialysis,
                "night_dialysis": night_dialysis,
                "results": formatted_results,
                "synthesis_prompt": synthesis_prompt,
                "metadata": {
                    "count": len(formatted_results),
                    "response_time": f"{elapsed:.3f}s",
                    "search_method": "nearby" if latitude else ("region" if region else ("text" if query else "default"))
                }
            }
        )

    except Exception as e:
        logger.error(f"[HOSPITAL TOOL] Error: {e}", exc_info=True)
        return ToolResult(
            data={
                "error": str(e),
                "results": [],
                "synthesis_prompt": f"병원 검색 중 오류가 발생했습니다: {e}"
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

        When user asks medical questions, ALWAYS use search_medical_qa tool first.

        **Tool Usage - Customize based on query type**:

        For literature review / research questions:
        search_medical_qa(query="...", profile="researcher", max_papers=20, max_pubmed=15, max_qa=5, use_medical=False)

        For clinical questions needing comprehensive sources:
        search_medical_qa(query="...", profile="researcher", max_qa=10, max_papers=10, max_medical=5, max_pubmed=10)

        For quick factual questions:
        search_medical_qa(query="...", profile="researcher", max_qa=10, use_papers=False, use_medical=False, use_pubmed=False)

        **Available Parameters**:
        - use_guidelines, use_qa, use_papers, use_medical, use_pubmed: Enable/disable each source (default: all True)
        - max_guidelines, max_qa, max_papers, max_medical, max_pubmed: Set results per source (default: 10 for researcher)
        - max_per_source: Set all sources at once (overridden by individual limits)

        **Data Sources**:
        The tool searches 5 sources: guidelines database, QA database, papers (local + PubMed), medical patents, and PubMed real-time.
        Choose sources based on query - not all sources are needed for every question.

        **Response Guidelines**:
        - Cite all papers with authors, year, and identifiers (PMID/DOI when available)
        - Don't distinguish between local papers and PubMed - treat all as "논문 연구"
        - Integrate information from multiple sources naturally
        - With researcher profile, you get up to 10 results per source by default (customize as needed)
        - Maintain professional and scholarly tone throughout

        Always respond in Korean.""",
        tools=[search_medical_qa]
    )

    # Patient profile
    patient_guideline = await agent.create_guideline(
        condition="The customer has the tag 'profile:patient'",
        action="""You must use practical and applicable explanations.
        Focus on daily life applications, self-care methods, and patient-centered information.
        Provide specific, actionable advice that patients can implement.
        Use empathetic language and acknowledge the challenges of living with illness.

        When user asks medical questions, ALWAYS use search_medical_qa tool first.

        **Tool Usage - Customize based on query type**:

        For practical daily life questions:
        search_medical_qa(query="...", profile="patient", max_qa=10, use_papers=False, use_medical=False, use_pubmed=False)

        For treatment/management questions needing evidence:
        search_medical_qa(query="...", profile="patient", max_qa=5, max_papers=5, use_medical=False, max_pubmed=3)

        For symptom-related questions:
        search_medical_qa(query="...", profile="patient", max_qa=8, max_papers=3, use_medical=False, use_pubmed=False)

        **Available Parameters**:
        - use_guidelines, use_qa, use_papers, use_medical, use_pubmed: Enable/disable each source (default: all True)
        - max_guidelines, max_qa, max_papers, max_medical, max_pubmed: Set results per source (default: 5 for patient)
        - max_per_source: Set all sources at once (overridden by individual limits)

        **Data Sources**:
        The tool searches 5 sources: guidelines database, QA database, papers, medical patents, and PubMed.
        For patients, prioritize QA database (practical answers) over academic papers.
        Not all sources are needed for every question.

        **Response Guidelines**:
        - Translate complex medical terms into everyday language
        - Focus on actionable advice and practical tips
        - When citing papers, don't distinguish local vs PubMed - just say "논문 연구에 따르면"
        - With patient profile, you get up to 5 results per source by default (customize as needed)
        - Provide encouragement while maintaining medical accuracy

        Always respond in Korean.""",
        tools=[search_medical_qa]
    )

    # General profile
    general_guideline = await agent.create_guideline(
        condition="The customer has the tag 'profile:general'",
        action="""You must use simple and easy-to-understand explanations.
        Minimize technical terminology and use plain, everyday language.
        Focus on basic concepts and general understanding.
        Use analogies and examples to explain complex ideas.

        When user asks medical questions, ALWAYS use search_medical_qa tool first.

        **Tool Usage - Customize based on query type**:

        For simple definition/explanation questions:
        search_medical_qa(query="...", profile="general", max_qa=5, use_papers=False, use_medical=False, use_pubmed=False)

        For general health information:
        search_medical_qa(query="...", profile="general", max_qa=3, max_papers=2, use_medical=False, use_pubmed=False)

        For basic medical concepts:
        search_medical_qa(query="...", profile="general", max_qa=5, max_papers=3, use_medical=False, use_pubmed=False)

        **Available Parameters**:
        - use_guidelines, use_qa, use_papers, use_medical, use_pubmed: Enable/disable each source (default: all True)
        - max_guidelines, max_qa, max_papers, max_medical, max_pubmed: Set results per source (default: 3 for general)
        - max_per_source: Set all sources at once (overridden by individual limits)

        **Data Sources**:
        The tool searches 5 sources: guidelines database, QA database, papers, medical patents, and PubMed.
        For general users, prioritize QA database (simple answers) and limit papers.
        Not all sources are needed for every question.

        **Response Guidelines**:
        - Avoid medical jargon unless absolutely necessary (then explain it immediately)
        - Use analogies and everyday examples
        - Don't distinguish between different paper sources - just say "연구에 따르면"
        - Break down information into small, digestible parts
        - With general profile, you get up to 3 results per source by default (customize as needed)

        Always respond in Korean.""",
        tools=[search_medical_qa]
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
7. End session

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

async def create_welfare_journey(agent: p.Agent) -> p.Journey:
    """복지 지원 Journey (Journey 1 패턴 100% 적용)

    Journey 1 (Medical Information Journey) 구조 참고:
    - Multi-step conversation flow
    - Tool execution (search_welfare_programs, search_hospitals)
    - State transitions with conditions
    - Fork-based user choices
    - Profile-aware responses
    - Journey-level guidelines

    **Steps**:
    0. Welcome and introduce welfare categories
    1. Execute welfare search (tool)
    2. Present results and offer follow-up
    3. (Optional) Find nearby hospitals (tool)
    4. End or loop back

    **Tools Used**:
    - search_welfare_programs: 복지 프로그램 검색
    - search_hospitals: 신청 가능 병원 검색

    **Profile Behavior**:
    - researcher: 10 results, detailed info
    - patient: 5 results, practical advice
    - general: 3 results, simple explanation
    """
    journey = await agent.create_journey(
        title="Welfare Support Journey",
        description="Guide for welfare programs, insurance support, and medical cost reduction for CKD patients",
        conditions=[
            "User asks about welfare programs (복지, 지원, 혜택)",
            "User wants to know about 산정특례 or copay reduction",
            "User needs information about disability registration (장애인 등록)",
            "User asks about medical cost support or insurance benefits (의료비, 본인부담금)",
            "User mentions 교통비 지원 or transport support",
            "User asks how to apply for benefits (신청 방법)",
            "User needs financial assistance information"
        ]
    )

    # ========================================
    # Step 0: Welcome & Category Introduction
    # ========================================
    t0 = await journey.initial_state.transition_to(
        chat_state="""안녕하세요! 복지 지원 상담에 오신 것을 환영합니다. 🎗️

만성콩팥병 환자를 위한 다양한 복지 혜택을 안내해드립니다.
모든 정보는 **2024-2025년 정부 공식 데이터**를 기반으로 검증되었습니다.

**주요 복지 프로그램**:

1. 💳 **산정특례** - 본인부담금 90% 감면
   - CKD 3기 이상: 본인부담금 10%
   - 혈액투석/복막투석: 본인부담금 10%
   - 유효기간: 5년 (투석은 계속)

2. 🦽 **장애인 등록** - 장애인 복지 혜택
   - 투석 3개월 이상: 심한 장애 (구 2급)
   - 신장이식 후: 심하지 않은 장애 (구 5급)
   - 장애인연금 최대 월 43만원 (2025년)
   - 전기요금, 교통비, 문화시설 할인

3. 💰 **의료비 지원** - 저소득층 의료비
   - 재난적 의료비: 최대 2,000만원
   - 긴급 의료비: 최대 300만원
   - 희귀질환 의료비: 간병비 월 30만원 포함

4. 🏥 **신장이식 지원** - 수술비 및 면역억제제
   - KAMCO-밀알복지재단: 최대 500만원
   - 사랑의장기기증운동본부: 저소득층 지원

5. 🚗 **교통비 지원** - 투석 환자 교통비
   - 지자체별 월 10-15만원
   - 활동지원 서비스: 병원 동행 가능

---

어떤 복지 혜택에 대해 궁금하신가요?
구체적으로 말씀해주시면 자세히 안내해드리겠습니다.

**예시**:
- "산정특례 신청 방법 알려주세요"
- "장애인 등록하려면 어떻게 하나요?"
- "의료비 지원 받을 수 있나요?"
- "신장이식 수술비 지원은?"
"""
    )

    # ========================================
    # Step 1: Execute Welfare Search (Tool)
    # ========================================
    t1 = await t0.target.transition_to(
        tool_state=search_welfare_programs,
        condition="User specifies welfare program interest or asks specific question about benefits"
    )

    # ========================================
    # Step 2: Present Results
    # ========================================
    t2 = await t1.target.transition_to(
        chat_state="""검색된 복지 프로그램 정보를 바탕으로 상세히 안내해드립니다.

{synthesis_prompt에서 생성된 LLM 응답이 여기에 표시됩니다}

---

**추가로 도움이 필요하신가요?**

다음 옵션 중 선택해주세요:
- 🔍 **다른 복지 프로그램 알아보기** (다른 카테고리나 키워드로 검색)
- 🏥 **근처 신청 가능한 병원 찾기** (산정특례 신청, 장애진단서 발급 등)
- ✅ **상담 종료** (충분한 정보를 얻으셨다면)

원하시는 옵션을 말씀해주세요."""
    )

    # ========================================
    # Step 3: Follow-up Options (Fork)
    # ========================================

    # Option A: Search more programs (loop back to Step 1)
    await t2.target.transition_to(
        state=t1.target,
        condition="User wants to know about other welfare programs or different category"
    )

    # Option B: Find nearby hospitals (new tool execution)
    t3_hospital = await t2.target.transition_to(
        tool_state=search_hospitals,
        condition="User wants to find nearby hospitals or application centers or dialysis centers"
    )

    # ========================================
    # Step 4: Present Hospital Results
    # ========================================
    t4 = await t3_hospital.target.transition_to(
        chat_state="""근처 병원 정보를 안내해드립니다.

{hospital search synthesis_prompt 응답이 여기에 표시됩니다}

---

**다음 단계**:
복지 프로그램 신청은 위 병원에서 가능합니다.
- **산정특례**: 병원 원무과 방문하여 신청서 제출
- **장애진단서**: 신장내과 진료 예약 필요
- **투석 상담**: 투석실에 연락하여 상담

**추가 도움**:
- 다른 지역 병원 찾기
- 다른 복지 프로그램 알아보기
- 상담 종료"""
    )

    # Loop back options from hospital results
    await t4.target.transition_to(
        state=t1.target,
        condition="User wants to explore more welfare programs"
    )

    await t4.target.transition_to(
        state=t3_hospital.target,
        condition="User wants to search hospitals in different region"
    )

    # Option C: End journey
    await t2.target.transition_to(
        state=p.END_JOURNEY,
        condition="User is satisfied or wants to end the conversation or says goodbye"
    )

    await t4.target.transition_to(
        state=p.END_JOURNEY,
        condition="User is satisfied or wants to end"
    )

    # ========================================
    # Journey-level Guidelines
    # ========================================

    # Guideline 1: Eligibility disclaimer
    await journey.create_guideline(
        condition="User asks about specific eligibility requirements or whether they qualify",
        action="""Always remind the user that:

1. You are providing GENERAL guidelines based on typical requirements from government data
2. FINAL ELIGIBILITY is determined by the relevant authorities (국민건강보험공단, 주민센터, KONOS, etc.)
3. Personal circumstances may affect eligibility
4. They should contact the program directly for personalized eligibility assessment

**Example Response Format**:
"일반적으로 [자격 요건]에 해당하는 경우 신청 가능합니다.
하지만 최종 자격 여부는 [담당 기관]에서 개별적으로 판단합니다.
정확한 상담을 위해 [전화번호]로 직접 문의하시는 것을 권장드립니다."

**Tone**: Helpful but cautious, avoiding definitive yes/no answers about eligibility
"""
    )

    # Guideline 2: Empathetic support
    await journey.create_guideline(
        condition="User expresses financial difficulty, desperation, or emotional distress about medical costs",
        action="""Respond with empathy and comprehensive support:

1. **Acknowledge** their situation with compassion
   - "의료비 부담이 크시겠어요. 여러 지원 제도가 있으니 함께 알아보겠습니다."

2. **Emphasize** that multiple support programs are available
   - List all relevant programs (산정특례, 의료비 지원, 장애인 복지)

3. **Provide** the most relevant programs for their situation
   - Prioritize by impact (산정특례 90% reduction first)
   - Mention urgent options (긴급 의료비 3-7일 처리)

4. **Encourage** them to apply and seek help
   - "포기하지 마시고 꼭 신청하세요"
   - "담당자와 상담하시면 도움받으실 수 있습니다"

5. **Emergency contact** if needed
   - 보건복지콜센터: 국번없이 129
   - 긴급 복지 지원: 주민센터
   - 재난적 의료비: 1577-1000

**Tone**: Warm, supportive, encouraging, non-judgmental
**Avoid**: Minimizing their concerns, making promises about approval, being overly optimistic
"""
    )

    # Guideline 3: Application process clarity
    await journey.create_guideline(
        condition="User asks about application process or required documents",
        action="""Provide CLEAR, STEP-BY-STEP application instructions:

1. **List steps** in numbered format
   - Step 1: [First action - e.g., "병원에서 진단서 받기"]
   - Step 2: [Second action - e.g., "서류 준비하기"]
   - Step 3: [Third action - e.g., "신청 기관 방문"]
   - ...

2. **Required documents**:
   - Use bullet points
   - Be specific (e.g., "의사 진단서 (희귀난치성질환 등록 신청용)")
   - Mention where to get each document if not obvious

3. **Where to apply**:
   - Provide exact location (e.g., "국민건강보험공단 지사 또는 병원 원무과")
   - Suggest calling ahead to confirm office hours and requirements

4. **Processing time**:
   - Set realistic expectations (e.g., "7-14일 소요")
   - Mention follow-up options if delayed

5. **Contact for questions**:
   - Always provide phone number and organization
   - Encourage calling for clarification before visiting

**Format**: Use numbered lists, bullet points, and emojis for visual clarity
**Language**: Korean (한국어)
"""
    )

    return journey


# ==================== Main Function ====================

async def main() -> None:
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

    async with p.Server() as server:
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

Always respond in Korean unless specifically requested otherwise.""",
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

        print("  🗺️ Creating Welfare Support Journey...")
        welfare_journey = await create_welfare_journey(agent)

        # Journey Disambiguation
        print("  🔀 Setting up Journey disambiguation...")

        # Medical vs Research
        paper_inquiry = await agent.create_observation(
            "User asks about research papers, scientific studies, or wants advanced paper analysis, "
            "but it's not clear whether they need basic information or in-depth research analysis"
        )
        await paper_inquiry.disambiguate([journey, research_journey])

        # Medical vs Welfare
        welfare_inquiry = await agent.create_observation(
            "User asks about medical costs, insurance benefits, copay reduction, financial support, or welfare programs, "
            "but it's not clear whether they need medical information or welfare program guidance"
        )
        await welfare_inquiry.disambiguate([journey, welfare_journey])

        # Research vs Welfare
        research_welfare_inquiry = await agent.create_observation(
            "User asks about programs, support systems, or policies, "
            "but it's not clear whether they want research papers about programs or actual welfare benefit information"
        )
        await research_welfare_inquiry.disambiguate([research_journey, welfare_journey])

        print("     ✅ Journey disambiguation configured (3 journeys)")

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
        print("🎉 CareGuide v2.0 Server Successfully Started!")
        print("="*70)
        print(f"\n📋 **Server Information**:")
        print(f"  • Agent ID: {agent.id}")
        print(f"  • Customer ID: {customer.id}")
        print(f"  • Medical Journey ID: {journey.id}")
        print(f"  • Research Journey ID: {research_journey.id}")
        print(f"  • Welfare Journey ID: {welfare_journey.id}")

        print(f"\n👤 **User Profile**:")
        profile_display = {
            "researcher": "Researcher/Expert",
            "patient": "Patient/Experience Holder",
            "general": "General Public/Novice"
        }
        print(f"  • Selected Profile: {profile_display[profile]}")
        print(f"  • Max Results: {PROFILE_LIMITS[profile]['max_results']} per source")
        print(f"  • Detail Level: {PROFILE_LIMITS[profile]['detail_level']}")

        print(f"\n🔍 **Search System**:")
        print(f"  • Search Method: Hybrid (Keyword 40% + Semantic 60%)")
        print(f"  • Data Sources:")
        print(f"    1. MongoDB - Structured data (text indexing)")
        print(f"    2. Pinecone - Vector database (semantic search)")
        print(f"    3. Local Papers - Rich metadata")
        print(f"    4. PubMed API - Real-time (abstracts, authors, DOI, MeSH)")

        print(f"\n🛠️ **Registered Tools**:")
        print(f"  • search_medical_qa - Hybrid integrated search")
        print(f"  • get_kidney_stage_info - CKD stage information")
        print(f"  • get_symptom_info - Symptom info and emergency detection")
        print(f"  • check_emergency_keywords - Emergency keyword detection")
        print(f"  • search_welfare_programs - Welfare program search (13 verified programs)")
        print(f"  • search_hospitals - Hospital/dialysis center search (104,836 facilities)")

        print(f"\n⚠️ **Safety Features**:")
        print(f"  • Automatic emergency detection (911 guidance)")
        print(f"  • Diagnosis/prescription blocking")
        print(f"  • Automatic medical disclaimer")
        print(f"  • Inappropriate request blocking")

        print("\n" + "="*70)
        print("🟢 Server is running.")
        print("   Press Ctrl+C to exit.")
        print("="*70 + "\n")



if __name__ == "__main__":
        asyncio.run(main())
