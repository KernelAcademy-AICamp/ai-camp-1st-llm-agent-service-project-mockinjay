# healthcare_v2_en.py
"""
CareGuide Healthcare Chatbot v2
- Hybrid Search Engine (Keyword + Semantic)
- MongoDB (Structured Data Storage)
- Pinecone (Vector Database)
- PubMed Advanced API (Real-time with Abstracts)
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

# ==================== New Import ====================
from search.hybrid_search import HybridSearchEngine

# ==================== Configuration ====================
PROFILE_LIMITS = {
    "researcher": {"max_results": 10, "detail_level": "high"},
    "patient": {"max_results": 5, "detail_level": "medium"},
    "general": {"max_results": 3, "detail_level": "low"}
}

# ==================== Global Variables ====================
# Old: Direct JSONL file loading
# New: Using hybrid search engine
SEARCH_ENGINE = None


# ==================== Helper Functions ====================

async def get_profile(context: ToolContext) -> str:
    """Determine profile based on plugin_data or customer context

    IMPORTANT: Profile-specific behavior is controlled by Parlant guidelines.
    The LLM receives different instructions based on customer tags:
    - "profile:researcher" → Academic language, max 10 results
    - "profile:patient" → Practical advice, max 5 results
    - "profile:general" → Simple language, max 3 results

    This function attempts to read profile from context but defaults to
    standard limits. The actual tone/style is controlled by LLM guidelines.

    Args:
        context: ToolContext with optional plugin_data

    Returns:
        Profile type for result limiting
    """
    # Check if profile is in plugin_data (preferred method)
    if hasattr(context, 'plugin_data') and context.plugin_data:
        profile = context.plugin_data.get('profile')
        if profile and profile in ["researcher", "patient", "general"]:
            print(f"✅ Profile from plugin_data: {profile}")
            return profile

    # Note: We don't fetch from REST API here to avoid deadlock
    # The Parlant server is busy executing this tool, so HTTP requests
    # to the same server will timeout or block.

    # Instead, we rely on:
    # 1. LLM guidelines (controlled by customer tags) for tone/style
    # 2. Default result limits (can be adjusted by guidelines)

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
    """Initialize search engine (run once at app start)"""
    global SEARCH_ENGINE

    if SEARCH_ENGINE is None:
        print("🔍 Initializing hybrid search engine...")
        SEARCH_ENGINE = HybridSearchEngine()
        await SEARCH_ENGINE.initialize()
        print("✅ Search engine ready")


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


    # 1. QA data summary (reduced: truncate long answers, include source)
    qa_summary = ""
    if raw_results["qa_results"]:
        for i, item in enumerate(raw_results["qa_results"][:number_of_results[profile]], 1):
            question = item.get('question', '')[:200]  # Limit question length
            answer = item.get('answer', '')[:500]  # Limit answer to 500 chars
            source = item.get('source_dataset', 'AI Hub')  # Get source or default to AI Hub
            # Simplify source name for display
            if source.startswith('dataset_'):
                source = 'AI Hub'
            qa_summary += f"{i}. Q: {question}\n   A: {answer}...\n   Source: {source}\n"
    else:
        qa_summary = "No results"

    # 2. Local paper data summary (include title, abstract, and source)
    paper_summary = ""
    if raw_results["paper_results"]:
        for i, item in enumerate(raw_results["paper_results"][:number_of_results[profile]], 1):
            title = item.get('title', 'N/A')
            abstract = item.get('abstract', 'N/A')[:400]  # Limit abstract to 400 chars
            source = item.get('source', '대한신장학회')  # Default to Korean Society of Nephrology

            # Extract metadata if available
            metadata = item.get('metadata', {})
            journal = metadata.get('journal', '')[:50] if isinstance(metadata, dict) else ''
            pub_date = metadata.get('publication_date', '') if isinstance(metadata, dict) else ''

            paper_summary += f"""{i}. Title: {title}
   Abstract: {abstract}...
   Source: {source}"""
            if journal:
                paper_summary += f" | Journal: {journal}"
            if pub_date:
                paper_summary += f" ({pub_date})"
            paper_summary += "\n"
    else:
        paper_summary = "No results"

    # 3. Medical data summary (truncate text to avoid JSON size limit)
    medical_summary = ""
    if raw_results["medical_results"]:
        for i, item in enumerate(raw_results["medical_results"][:number_of_results[profile]], 1):
            text = item.get('text', '')[:300]  # Limit to 300 chars
            keywords = item.get('keyword', [])
            if isinstance(keywords, list):
                kw_str = ', '.join(keywords[:3])
            else:
                kw_str = str(keywords)[:40]
            medical_summary += f"{i}. [{kw_str}] {text}...\n"
    else:
        medical_summary = "No results"

    # 4. PubMed real-time search results (truncate all fields to avoid JSON size limit)
    pubmed_summary = ""
    if raw_results["pubmed_results"]:
        for i, paper in enumerate(raw_results["pubmed_results"][:number_of_results[profile]], 1):
            title = paper.get('title', 'N/A')[:200]  # Limit title to 200 chars
            authors_list = paper.get('authors', [])[:3]  # Max 3 authors
            authors = ', '.join(authors_list)
            if len(paper.get('authors', [])) > 3:
                authors += " et al."
            journal = paper.get('journal', 'N/A')[:50]  # Limit journal name
            pub_date = paper.get('pub_date', 'N/A')
            pmid = paper.get('pmid', 'N/A')
            doi = paper.get('doi', 'N/A')[:40]
            abstract = paper.get('abstract', 'N/A')[:400]  # Limit abstract to 400 chars
            url = paper.get('url', 'N/A')

            pubmed_summary += f"""{i}. {title}
   Authors: {authors} | {journal} ({pub_date})
   PMID: {pmid} | DOI: {doi}
   Abstract: {abstract}...
   URL: {url}
"""
    else:
        pubmed_summary = "No results"

    # 5. Final prompt generation (simplified formatting)
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
    profile: str = "general"
) -> ToolResult:
    """Integrated medical information search tool

    **Search Methods**:
    1. MongoDB text search (keyword matching)
    2. Pinecone vector search (semantic similarity)
    3. Local paper database
    4. PubMed API real-time search (abstracts, authors, DOI included)

    **Hybrid Score Calculation**:
    - Final score = keyword score × 0.4 + semantic score × 0.6

    Args:
        context: ToolContext
        query: User question
        profile: User profile type (researcher/patient/general) - controls result count and detail level

    Returns:
        ToolResult with raw_results and refinement_prompt
    """
    try:
        # Initialize search engine
        await initialize_search_engine()

        # Validate and use profile
        if profile not in ["researcher", "patient", "general"]:
            print(f"⚠️ Invalid profile '{profile}', using 'general'")
            profile = "general"

        max_results = PROFILE_LIMITS[profile]["max_results"]
        print(f"✅ Using profile: {profile} (max_results={max_results})")

        print(f"\n🔍 [{profile.upper()}] Searching for '{query}'...")

        # Execute hybrid search
        raw_results = await SEARCH_ENGINE.search_all_sources(
            query=query,
            max_per_source=max_results,
            use_semantic=True,  # Enable semantic search
            use_pubmed=True     # Enable PubMed advanced search
        )

        # Convert ObjectId to string (for serialization)
        raw_results = convert_objectid_to_str(raw_results)

        # Generate LLM refinement prompt
        refinement_prompt = await llm_refine_results_v2(query, raw_results, profile)

        # Total result count
        total_count = sum([
            len(raw_results["qa_results"]),
            len(raw_results["paper_results"]),
            len(raw_results["medical_results"]),
            len(raw_results["pubmed_results"])
        ])

        print(f"✅ Search complete: {total_count} total results")

        # Prepare result data
        result_data = {
            "query": query,
            "profile": profile,
            "raw_results": raw_results,
            "refinement_prompt": refinement_prompt,
            "search_method": raw_results["search_method"],  # "hybrid" or "keyword"
            "total_sources": 4,
            "qa_count": len(raw_results["qa_results"]),
            "paper_count": len(raw_results["paper_results"]),
            "medical_count": len(raw_results["medical_results"]),
            "pubmed_count": len(raw_results["pubmed_results"]),
            "total_count": total_count,
            "message": f"""✅ Found {total_count} total results using {raw_results['search_method'].upper()} search.

📊 Results by Source:
  • QA Data: {len(raw_results['qa_results'])}
  • Local Papers: {len(raw_results['paper_results'])}
  • Medical Patents: {len(raw_results['medical_results'])}
  • PubMed Real-time: {len(raw_results['pubmed_results'])}

🔬 Search Method: {raw_results['search_method'].upper()}
  {'- Keyword matching (40%) + Semantic similarity (60%)' if raw_results['search_method'] == 'hybrid' else '- Keyword matching only'}"""
        }

        # Log result size for debugging JSON serialization issues
        import json
        import sys
        result_json = json.dumps(result_data)
        result_size_bytes = sys.getsizeof(result_json)
        result_size_kb = result_size_bytes / 1024

        print(f"📊 Tool result size: {result_size_kb:.1f} KB ({result_size_bytes:,} bytes)")

        if result_size_bytes > 1024 * 1024:
            print(f"⚠️  WARNING: Result exceeds 1024KB Parlant limit! This may cause JSON parsing errors.")
        elif result_size_bytes > 64 * 1024:
            print(f"⚠️  Warning: Result is large ({result_size_kb:.1f} KB). Consider further reduction.")

        return ToolResult(data=result_data)

    except Exception as e:
        print(f"❌ Search error: {e}")
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
    emergency_keywords = [
        "chest pain", "difficulty breathing", "unconsciousness",
        "severe edema", "generalized edema", "fainting", "collapse"
    ]

    found_keywords = [kw for kw in emergency_keywords if kw in text.lower()]
    is_emergency = len(found_keywords) > 0

    if is_emergency:
        return ToolResult(
            data={
                "is_emergency": True,
                "found_keywords": found_keywords,
                "message": f"""🚨 **EMERGENCY DETECTED!**

The following emergency keywords were detected:
{chr(10).join([f'  • {kw}' for kw in found_keywords])}

⚠️ **CALL 911 IMMEDIATELY!**

📞 **Emergency Call Steps**:
1. Call 911
2. Report location
3. Describe symptoms
4. Follow dispatcher instructions

⏱️ Time is critical!"""
            }
        )

    return ToolResult(
        data={
            "is_emergency": False,
            "message": "No emergency situation detected."
        }
    )


# ==================== Guidelines ====================

async def add_safety_guidelines(agent: p.Agent) -> None:
    """Add medical safety guidelines"""

    # CHK-001: No reassurance for symptoms
    await agent.create_guideline(
        condition="User mentions symptoms",
        action="Never use reassuring phrases like 'don't worry' or 'it will be fine'. Always recommend consulting medical professionals. Respond in Korean."
    )

    # CHK-002: Emergency priority
    await agent.create_guideline(
        condition="Emergency keywords like chest pain, difficulty breathing, severe bleeding, unconsciousness are mentioned",
        action="Immediately tell user to call 911. Provide clear instructions: 1) Call 911 now 2) Tell them your exact location 3) Describe symptoms accurately 4) Follow dispatcher's instructions. Stop all other conversations. Use strong, urgent language. Respond in Korean.",
        tools=[check_emergency_keywords]
    )

    # CHK-005: No diagnosis or prescription
    await agent.create_guideline(
        condition="User asks for diagnosis or prescription",
        action="Never provide diagnosis or prescribe medications. Clearly state: 'I am not a healthcare professional and cannot provide diagnosis or prescriptions. Please consult with a doctor.' Respond in Korean."
    )

    # CHK-009: Disclaimer
    await agent.create_guideline(
        condition="All medical responses",
        action="Add disclaimer at end: '⚠️ This information is for educational and reference purposes only and cannot replace medical advice. If you have symptoms, please consult with healthcare professionals.' Respond in Korean."
    )


async def add_profile_guidelines(agent: p.Agent) -> None:
    """User profile-based guidelines"""

    # Researcher profile
    await agent.create_guideline(
        condition="The customer has the tag 'profile:researcher'",
        action="""You must use academic language and technical terminology.
        Focus on research findings, biological mechanisms, and evidence-based information.
        Provide detailed scientific explanations with specific data when available.

        When user asks medical questions, ALWAYS use search_medical_qa tool first.
        IMPORTANT: Call the tool with profile="researcher" parameter:
        search_medical_qa(query="...", profile="researcher")

        The tool provides refinement_prompt from 4 sources (QA, papers, medical data, PubMed).
        Use the refinement_prompt to generate comprehensive, research-oriented responses.

        With researcher profile, you'll get up to 10 results per source with high detail level.
        Include citations with PMIDs, DOIs, and publication dates when mentioning PubMed papers.
        Maintain a professional and scholarly tone throughout.

        Always respond in Korean.""",
        tools=[search_medical_qa]
    )

    # Patient profile
    await agent.create_guideline(
        condition="The customer has the tag 'profile:patient'",
        action="""You must use practical and applicable explanations.
        Focus on daily life applications, self-care methods, and patient-centered information.
        Provide specific, actionable advice that patients can implement.
        Use empathetic language and acknowledge the challenges of living with illness.

        When user asks medical questions, ALWAYS use search_medical_qa tool first.
        IMPORTANT: Call the tool with profile="patient" parameter:
        search_medical_qa(query="...", profile="patient")

        The tool provides refinement_prompt from 4 sources (QA, papers, medical data, PubMed).
        Use the refinement_prompt to generate practical, patient-friendly responses.

        With patient profile, you'll get up to 5 results per source with medium detail level.
        Translate complex medical terms into everyday language.
        Provide encouragement while maintaining medical accuracy.

        Always respond in Korean.""",
        tools=[search_medical_qa]
    )

    # General profile
    await agent.create_guideline(
        condition="The customer has the tag 'profile:general'",
        action="""You must use simple and easy-to-understand explanations.
        Minimize technical terminology and use plain, everyday language.
        Focus on basic concepts and general understanding.
        Use analogies and examples to explain complex ideas.

        When user asks medical questions, ALWAYS use search_medical_qa tool first.
        IMPORTANT: Call the tool with profile="general" parameter:
        search_medical_qa(query="...", profile="general")

        The tool provides refinement_prompt from 4 sources (QA, papers, medical data, PubMed).
        Use the refinement_prompt to generate simple, accessible responses.

        With general profile, you'll get up to 3 results per source with low detail level.
        Avoid medical jargon unless absolutely necessary (then explain it).
        Break down information into small, digestible parts.

        Always respond in Korean.""",
        tools=[search_medical_qa]
    )


async def add_blocking_guidelines(agent: p.Agent) -> None:
    """Blocking guidelines"""

    # Non-medical topic blocking
    await agent.create_guideline(
        condition="User asks about non-medical topics (sports, politics, entertainment, etc.)",
        action="Politely decline: 'I apologize, but CareGuide can only handle medical and health-related questions. If you have medical questions, I'd be happy to help.' Redirect to medical topics. Respond in Korean."
    )

    # Inappropriate request blocking
    await agent.create_guideline(
        condition="User makes inappropriate, offensive, or harmful requests",
        action="Firmly decline: 'I cannot process inappropriate requests. If you need medical information, please ask appropriate questions.' If repeated, end conversation. Respond in Korean."
    )


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
        - Researchers: Detailed technical info with citations (max 10 results per source)
        - Patients: Practical advice with empathy (max 5 results per source)
        - General users: Simple explanations (max 3 results per source)

        Important:
        1. Integrate information from all 4 sources (QA, local papers, medical data, PubMed)
        2. Prioritize recent PubMed results when available
        3. Cite sources properly (e.g., "According to PubMed research (PMID: 12345678, 2024)...")
        4. Provide DOIs and URLs for PubMed papers
        5. Always add medical disclaimer at the end

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

        # Add guidelines
        print("  🔧 Adding safety guidelines...")
        await add_safety_guidelines(agent)

        print("  🔧 Adding profile-based guidelines...")
        await add_profile_guidelines(agent)

        print("  🔧 Adding blocking guidelines...")
        await add_blocking_guidelines(agent)

        # Create journey
        print("  🗺️ Creating Medical Information Journey...")
        journey = await create_medical_info_journey(agent)

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
        print(f"  • Journey ID: {journey.id}")

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
