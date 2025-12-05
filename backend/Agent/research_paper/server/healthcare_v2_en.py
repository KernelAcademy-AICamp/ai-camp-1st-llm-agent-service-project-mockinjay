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
from typing import Optional, Dict, Sequence, Union
from types import NoneType

from bson import ObjectId
from toon_format import encode, decode
import time
from pathlib import Path
import sys

# Add project root to Python path (backend folder)
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
    "researcher": {
        "detail_level": "high",
        "max_qa": 20,
        "max_guidelines": 20,
        "max_medical": 15,
        "max_paper": 10,
        "max_pubmed": 10
    },
    "patient": {
        "detail_level": "medium",
        "max_qa": 15,
        "max_guidelines": 15,
        "max_medical": 10,
        "max_paper": 5,
        "max_pubmed": 5
    },
    "general": {
        "detail_level": "low",
        "max_qa": 10,
        "max_guidelines": 10,
        "max_medical": 5,
        "max_paper": 3,
        "max_pubmed": 3
    }
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




def format_results_prompt(query: str, results: dict, profile: str) -> str:
    """Format search results into compact prompt"""
    
    # Extract and encode each source
    qa_data = [r for r in (results.get("qa_results") or [])]


    paper_data = [r for r in (results.get("paper_results") or [])]
    
    pubmed_data = [r for r in (results.get("pubmed_results") or [])]
    
    guideline_data = [r for r in (results.get("guidelines_results") or [])]
    
    medical_data = [r for r in (results.get("medical_results") or [])]



    if profile == 'general':
        max_results_paper = 3
        total_paper_data = pubmed_data + paper_data
        total_paper_data = total_paper_data[:max_results_paper]
    elif profile == 'patient':
        max_results_paper = 5
        total_paper_data = pubmed_data + paper_data
        total_paper_data = total_paper_data[:max_results_paper]
    elif profile == 'researcher':
        max_results_paper = 10
        total_paper_data = pubmed_data + paper_data
        total_paper_data = total_paper_data[:max_results_paper]
    else:
        max_results_paper = 3
        total_paper_data = pubmed_data + paper_data
        total_paper_data = total_paper_data[:max_results_paper]
    

    return f"""Query: "{query}" | Profile: {profile}

    [QA] {encode(qa_data) if qa_data else "None"}
    [Papers] {encode(total_paper_data) if total_paper_data else "None"}
    [Guidelines] {encode(guideline_data) if guideline_data else "None"}
    [Medical] {encode(medical_data) if medical_data else "None"}
    """

# ==================== Medical Information Tools ====================
@p.tool
async def search_medical_qa(
    context: ToolContext,
    query: str,
    max_results: Optional[str] = None
) -> ToolResult:
    """Integrated medical search tool
    
    Args:
        context: ToolContext
        query: User question
        max_results: Max results per source as sequence [guidelines, qa, papers, medical, pubmed]
                     If single value provided, applies to all sources.
                     If None, uses profile default.
    """
    start_time = time.time()

    if isinstance(max_results, str):
        # convert to list of int
        if max_results[0] == '[' and max_results[-1] == ']':
            max_results = [int(x) for x in max_results[1:-1].split(",")]
        else:
            max_results = int(max_results)
    else:
        max_results = None
    
    try:
        await initialize_search_engine()
        
        # Get actual profile from context
        profile = await get_profile(context)
        
        if profile not in PROFILE_LIMITS:
            profile = "general"
        
        # Parse max_results sequence
        profile_limits = PROFILE_LIMITS[profile]
        
        if len(max_results) == 1:
            # Single value applies to all sources, but capped by profile limits
            single_limit = max_results[0]
            max_guidelines = min(single_limit, profile_limits["max_guidelines"])
            max_qa = min(single_limit, profile_limits["max_qa"])
            max_papers = min(single_limit, profile_limits["max_paper"])
            max_medical = min(single_limit, profile_limits["max_medical"])
            max_pubmed = min(single_limit, profile_limits["max_pubmed"])
        elif len(max_results) >= 5:
            # Individual limits: [guidelines, qa, papers, medical, pubmed], capped by profile
            max_guidelines = min(max_results[0], profile_limits["max_guidelines"])
            max_qa = min(max_results[1], profile_limits["max_qa"])
            max_papers = min(max_results[2], profile_limits["max_paper"])
            max_medical = min(max_results[3], profile_limits["max_medical"])
            max_pubmed = min(max_results[4], profile_limits["max_pubmed"])
        else:
            # Fallback to profile defaults
            max_guidelines = profile_limits["max_guidelines"]
            max_qa = profile_limits["max_qa"]
            max_papers = profile_limits["max_paper"]
            max_medical = profile_limits["max_medical"]
            max_pubmed = profile_limits["max_pubmed"]

        
        print(f"Limits - Guidelines:{max_guidelines}, QA:{max_qa}, Papers:{max_papers}, Medical:{max_medical}, PubMed:{max_pubmed}")

        results = await SEARCH_ENGINE.search_all_sources(
            query=query,
            use_semantic=True,
            use_guidelines=True,
            use_qa=True if max_qa > 0 else False,
            use_papers=True if max_papers > 0 else False,
            use_medical=True if max_medical > 0 else False,
            use_pubmed=True if max_pubmed > 0 else False,
            max_guidelines=max_guidelines,
            max_qa=max_qa,
            max_papers=max_papers,
            max_medical=max_medical,
            max_pubmed=max_pubmed
        )
        
        results = convert_objectid_to_str(results)
        prompt = format_results_prompt(query, results, profile)
        
        total = sum(len(results.get(k, []) or []) for k in 
                   ["qa_results", "paper_results", "pubmed_results", "guidelines_results", "medical_results"])
        
        elapsed = time.time() - start_time
        print(f"✅ Search: {total} results in {elapsed:.2f}s")
        
        return ToolResult(data={
            "query": query,
            "profile": profile,
            "limits_used": {
                "guidelines": max_guidelines,
                "qa": max_qa,
                "papers": max_papers,
                "medical": max_medical,
                "pubmed": max_pubmed
            },
            "refinement_prompt": prompt,
            "total_count": total,
            "response_time": f"{elapsed:.2f}s"
        })
        
    except Exception as e:
        print(f"❌ Search error: {e}")
        return ToolResult(data={"error": str(e)})



import math

@p.tool
async def cal_gfr(
    context: ToolContext,
    age: int,
    sex: str,
    creatinine: float,
    weight: float = None,
    height: float = None,
    race: str = "non-black",
    eGFR_equation: str = "CKD-EPI"
) -> ToolResult:
    """Calculate estimated GFR (glomerular filtration rate) using various equations

    Args:
        context: ToolContext
        age: Patient age in years
        sex: Patient sex ("male" or "female")
        creatinine: Serum creatinine level in mg/dL
        weight: Patient weight in kg (required for Cockcroft-Gault)
        height: Patient height in cm (required for Schwartz)
        race: Patient race ("black" or "non-black") - for MDRD equation
        eGFR_equation: Equation to use ("CKD-EPI", "MDRD", "Cockcroft-Gault", "Schwartz")

    Returns:
        Estimated GFR/CrCl value in mL/min or mL/min/1.73m²
    """
    try:
        sex = sex.lower()
        race = race.lower()
        
        if eGFR_equation == "MDRD":
            # MDRD equation: GFR = 175 × (Scr)^(-1.154) × (age)^(-0.203) × (0.742 if female) × (1.212 if black)
            gfr = 175 * (creatinine ** -1.154) * (age ** -0.203)
            
            if sex == "female":
                gfr *= 0.742
            
            if race == "black":
                gfr *= 1.212
            
            unit = "mL/min/1.73m²"
                
        elif eGFR_equation == "CKD-EPI":
            # CKD-EPI 2021 equation (race-free version)
            if sex == "female":
                kappa = 0.7
                alpha = -0.241 if creatinine <= 0.7 else -1.200
            else:  # male
                kappa = 0.9
                alpha = -0.302 if creatinine <= 0.9 else -1.200
            
            gfr = 142 * ((creatinine / kappa) ** alpha) * (0.9938 ** age)
            unit = "mL/min/1.73m²"
            
        elif eGFR_equation == "Cockcroft-Gault":
            # Cockcroft-Gault equation: CrCl = [(140 - age) × weight] / [72 × Scr] × (0.85 if female)
            if weight is None:
                raise ValueError("Weight (kg) is required for Cockcroft-Gault equation")
            
            gfr = ((140 - age) * weight) / (72 * creatinine)
            
            if sex == "female":
                gfr *= 0.85
            
            unit = "mL/min"
            
        elif eGFR_equation == "Schwartz":
            # Schwartz equation for pediatrics: GFR = k × height(cm) / Scr
            if height is None:
                raise ValueError("Height (cm) is required for Schwartz equation")
            
            if age >= 18:
                raise ValueError("Schwartz equation is for pediatric patients (age < 18)")
            
            # Determine k value based on age and sex
            if age < 1:  # Infant
                k = 0.45  # Full-term infant (use 0.33 for preterm if needed)
            elif age < 13:  # Child
                k = 0.55
            else:  # Adolescent (13-17)
                k = 0.70 if sex == "male" else 0.55
            
            gfr = k * height / creatinine
            unit = "mL/min/1.73m²"
            
        else:
            raise ValueError("Invalid eGFR equation. Use 'MDRD', 'CKD-EPI', 'Cockcroft-Gault', or 'Schwartz'")
        
        # Round to 1 decimal place
        gfr = round(gfr, 1)
        
        # Add interpretation (only for standardized units)
        if unit == "mL/min/1.73m²":
            if gfr >= 90:
                stage = "G1 - Normal or high"
            elif gfr >= 60:
                stage = "G2 - Mild decrease"
            elif gfr >= 45:
                stage = "G3a - Mild to moderate decrease"
            elif gfr >= 30:
                stage = "G3b - Moderate to severe decrease"
            elif gfr >= 15:
                stage = "G4 - Severe decrease"
            else:
                stage = "G5 - Kidney failure"
        else:
            stage = "Not applicable (non-standardized unit)"
        
        return ToolResult(data={
            "gfr": gfr,
            "unit": unit,
            "stage": stage,
            "equation_used": eGFR_equation,
            "parameters": {
                "age": age,
                "sex": sex,
                "creatinine": creatinine,
                "weight": weight,
                "height": height,
                "race": race if eGFR_equation == "MDRD" else "not applicable"
            }
        })
        
    except Exception as e:
        return ToolResult(data={"error": str(e)})



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
    # CKD stage information definition
    kidney_stages = {
        '1': {
        "stage": "Stage 1 (Normal or High GFR)",
        "stage_code": "G1",
        "gfr_range": "≥ 90",
        "description": "Kidney function is normal but there is evidence of kidney damage (proteinuria, hematuria, structural abnormalities)",
        "symptoms": "Usually asymptomatic",
        "management": [
            "Treat underlying diseases (diabetes, hypertension, glomerulonephritis)",
            "Blood pressure control (target SBP <120 mmHg; <130/80 mmHg for transplant recipients only)",  # ✅ 수정
            "Blood glucose control (individualized HbA1c target <6.5% to <8.0% for diabetic patients)",  # ✅ 수정
            "Smoking cessation and maintain healthy weight",
            "Regular exercise (at least 150 minutes/week)"
        ],
        "dietary": [
            "Balanced, healthy diet with more plant-based foods",  # ✅ KDIGO 2024 권장사항 추가
            "Salt restriction (<5g/day or <2g sodium/day)",
            "Adequate hydration (unless contraindicated)",
            "Normal protein intake (0.8-1.0g/kg/day, avoid >1.3g/kg/day)",  # ✅ 수정
            "Limit processed foods and ultraprocessed foods"  # ✅ KDIGO 2024 권장사항
        ],
        "monitoring": "Annual checkups (urine test, blood creatinine, GFR)",
        "prognosis": "Progression can be prevented or significantly delayed with proper management"
    },
        '2': {
        "stage": "Stage 2 (Mild Decrease)",
        "stage_code": "G2",
        "gfr_range": "60-89",
        "description": "Mild decrease in kidney function with evidence of kidney damage",
        "symptoms": "Usually asymptomatic, occasional fatigue",
        "management": [
            "Continue Stage 1 management",
            "ACE inhibitors or ARBs (especially if proteinuria present)",
            "Avoid nephrotoxic drugs (NSAIDs, aminoglycosides, contrast agents)",
            "Adjust drug dosages if needed",
            "Screen for complications"
        ],
        "dietary": [
            "Low-salt diet (<5g/day or <2g sodium/day)",  # ✅ 명확화
            "Maintain adequate hydration",
            "Moderate protein (0.8-1.0g/kg/day, avoid >1.3g/kg/day)",  # ✅ 수정
            "Monitor potassium and phosphorus (not usually restricted yet)",
            "Limit alcohol consumption"
        ],
        "monitoring": "Every 6-12 months (GFR, urine protein, electrolytes)",
        "prognosis": "Good prognosis with proper management, low risk of progression"
    },
        "3a": {
        "stage": "Stage 3a (Mild to Moderate Decrease)",
        "stage_code": "G3a",
        "gfr_range": "45-59",
        "description": "Mild to moderate decrease in kidney function",
        "symptoms": "Possible fatigue, mild edema, occasional nocturia",
        "management": [
            "Nephrology referral recommended",
            "ACE inhibitors or ARBs",
            "Screen for complications: anemia, bone mineral disorder",
            "Adjust drug dosages",
            "Avoid nephrotoxic agents",
            "Cardiovascular risk management"
        ],
        "dietary": [
            "Low-salt diet (<2g sodium/day)",  # ✅ 명확화
            "Protein intake (0.8g/kg/day, avoid >1.3g/kg/day)",  # ✅ 수정
            "Monitor potassium and phosphorus (restrict if elevated)",  # ✅ 명확화
            "Limit processed foods and phosphate additives",  # ✅ 추가
            "Adequate hydration"
        ],
        "monitoring": "Every 3-6 months (GFR, CBC, electrolytes, urine protein)",
        "prognosis": "Good prognosis with active management, progression can be slowed"
    },
        "3b": {
        "stage": "Stage 3b (Moderate to Severe Decrease)",
        "stage_code": "G3b",
        "gfr_range": "30-44",
        "description": "Moderate to severe decrease in kidney function",
        "symptoms": "Fatigue, edema, decreased appetite, sleep disturbances, nocturia, foamy urine",
        "management": [
            "Nephrology referral mandatory",
            "ACE inhibitors or ARBs",
            "Treat complications: anemia (if Hb <10g/dL), bone mineral disorder",
            "Adjust all drug dosages",
            "Phosphate binders (if hyperphosphatemia)",
            "Vitamin D supplementation",
            "Cardiovascular risk management",
            "Start considering dialysis education"
        ],
        "dietary": [
            "Low-salt diet (<2g sodium/day)",  # ✅ 수정
            "Protein intake (0.8g/kg/day; supervised very low protein diet 0.3-0.4g/kg/day with supplements may be considered for high-risk patients)",  # ✅ 수정
            "Potassium restriction (if hyperkalemia >5.0-5.5 mmol/L, limit to 2-3g/day)",  # ✅ 명확화
            "Phosphorus restriction (<800-1000mg/day)",
            "Limit dairy products, nuts, processed meats, phosphate additives",  # ✅ 추가
            "Monitor fluid intake"
        ],
        "monitoring": "Every 3 months (GFR, CBC, electrolytes, PTH, vitamin D)",
        "prognosis": "Variable; active management essential. May need dialysis preparation"
    },
        '4': {
        "stage": "Stage 4 (Severe Decrease)",
        "stage_code": "G4",
        "gfr_range": "15-29",
        "description": "Severe kidney function impairment, pre-dialysis stage",
        "symptoms": "Marked fatigue, edema, nausea/vomiting, loss of appetite, itching, shortness of breath, sleep disturbances, metallic taste, cognitive impairment",
        "management": [
            "Close nephrology follow-up",
            "Prepare for renal replacement therapy (dialysis education)",
            "Vascular access creation (AV fistula 6+ months before dialysis)",
            "Consider kidney transplant evaluation",
            "Anemia management (ESA, iron supplementation, target Hb below 11.5g/dL)",  # ✅ 수정
            "Bone disease prevention (phosphate binders, vitamin D analogs, calcimimetics)",
            "Cardiovascular disease prevention",
            "Metabolic acidosis correction (sodium bicarbonate)",
            "Fluid and electrolyte management"
        ],
        "dietary": [
            "Strict dietary restrictions - renal dietitian consultation mandatory",  # ✅ 수정
            "Low-salt (<2g sodium/day)",
            "Low-potassium (<2-3g/day if hyperkalemia)",  # ✅ 명확화
            "Low-phosphorus (<800-1000mg/day)",  # ✅ 수정
            "Protein intake (0.8g/kg/day; supervised very low protein diet 0.3-0.4g/kg/day with amino acid/ketoacid supplements may be considered)",  # ✅ 수정
            "Fluid restriction (if oliguria or edema)",
            "Adequate caloric intake (30-35kcal/kg/day) to prevent malnutrition"
        ],
        "monitoring": "Every 1-3 months (GFR, CBC, electrolytes, PTH, calcium, phosphorus, albumin)",
        "prognosis": "Dialysis typically needed within 1-2 years. Transplant offers best outcome. Quality of life focus important"
    },
        '5': {
        "stage": "Stage 5 (Kidney Failure/ESRD)",
        "stage_code": "G5",
        "gfr_range": "< 15 or on dialysis",
        "description": "End-stage renal disease (ESRD), requires renal replacement therapy",
        "symptoms": "Severe uremic symptoms: extreme fatigue, generalized edema, persistent nausea/vomiting, shortness of breath, confusion, seizures (if untreated), pericarditis",
        "management": [
            "Initiate dialysis (hemodialysis 3x/week or continuous peritoneal dialysis)",
            "Kidney transplant evaluation and listing",
            "Aggressive complication management",
            "Anemia treatment (ESA + iron, target Hb below 11.5g/dL)",  # ✅ 수정
            "Bone mineral disorder management",
            "Cardiovascular disease management (leading cause of death)",
            "Nutritional support",
            "Psychosocial support (depression, anxiety common)",
            "Infection prevention (vaccination)"
        ],
        "dietary": [
            "Diet varies by dialysis modality:",
            "Hemodialysis: Strict potassium (<2g/day), phosphorus (<800-1000mg/day), fluid restriction (500-1000mL + urine output)",
            "Peritoneal dialysis: More liberal fluid and potassium, monitor glucose (from dialysate)",
            "HIGH protein diet (1.0-1.2g/kg/day for both HD and PD)",  # ✅ 수정
            "Adequate calories (30-35kcal/kg/day)",
            "Regular nutritional assessments to prevent malnutrition",
            "Avoid high-potassium foods (bananas, oranges, tomatoes, potatoes)",
            "Avoid phosphate additives in processed foods"  # ✅ 추가
        ],
        "monitoring": "Dialysis patients: monthly labs (pre/post-dialysis BUN, creatinine, electrolytes, CBC, albumin, PTH quarterly)",
        "prognosis": "5-year survival ~40% on dialysis. Transplant significantly improves survival (80-90% 5-year survival) and quality of life"
    }
    }

    # Input validation
    if gfr is not None:
        if gfr < 0:
            return ToolResult(
                data={
                    "error": "Invalid GFR value",
                    "message": "❌ GFR cannot be negative. Please provide a valid GFR value (≥ 0)."
                }
            )
        
    if gfr > 200:
        return ToolResult(
            data={
                "error": "Unusually high GFR",
                "warning": True,
                "message": f"⚠️ GFR value of {gfr} is unusually high. Normal range is typically 90-120. Please verify the calculation."
            }
        )


    # Determine stage by GFR with substage support
    stage_key = None
    if gfr is not None:
        if gfr >= 90:
            stage_key = 1
        elif gfr >= 60:
            stage_key = 2
        elif gfr >= 45:
            stage_key = "3a"
        elif gfr >= 30:
            stage_key = "3b"
        elif gfr >= 15:
            stage_key = 4
        else:
            stage_key = 5
    elif stage is not None:
        # If stage is provided directly
        if stage == 3:
            # Default to 3a if no GFR specified
            stage_key = "3a"
        elif stage in [1, 2, 4, 5]:
            stage_key = stage
        else:
            return ToolResult(
                data={
                    "error": "Invalid stage number",
                    "valid_stages": "1, 2, 3, 4, or 5",
                    "message": "❌ Please enter a valid CKD stage (1-5)."
                }
            )

    # Return stage information
    if stage_key and stage_key in kidney_stages:
        stage_info = kidney_stages[stage_key]

        # Format message with proper markdown
        message = f"""🏥 **CKD {stage_info['stage']}** ({stage_info['stage_code']})\n 📊 **GFR Range**: {stage_info['gfr_range']} mL/min/1.73m² \n {f"📈 **Your GFR**: {gfr} mL/min/1.73m²" if gfr else ""}📝 **Description**: {stage_info['description']}\n😷 **Main Symptoms**: {stage_info['symptoms']}\n💊 **Management Methods**: {chr(10).join([f"  • {item}" for item in stage_info['management']])}\n🍽️ **Diet Therapy**: {chr(10).join([f"  • {item}" for item in stage_info['dietary']])}\n📅 **Monitoring Schedule**: {stage_info['monitoring']}\n🔮 **Prognosis**: {stage_info['prognosis']}"""
        return ToolResult(
            data={
                "stage": stage_key,
                "stage_code": stage_info['stage_code'],
                "info": stage_info,
                "gfr": gfr,
                "message": message
            }
        )
    else:
        return ToolResult(
            data={
                "error": "Please enter a valid stage or GFR value.",
                "valid_stages": "1, 2, 3 (3a/3b), 4, or 5",
                "valid_gfr": "Number ≥ 0",
                "message": "❌ CKD stage information not found. Please enter a valid GFR value (e.g., gfr=45) or stage number (e.g., stage=3)."
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
                "message": f"🚨 **EMERGENCY DETECTED!** The following symptoms may indicate an emergency: {chr(10).join([f'  • {s}' for s in found_emergency])} ⚠️ **CALL 911 IMMEDIATELY!** Do not delay - act immediately!",
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
                "Low-phosphorus diet may include limiting dairy products; consult your kidney dietitian about whether you need to limit nuts, as most CKD patients can eat them unless blood tests show high phosphorus levels",
                "Phosphate binders treat hyperphosphatemia, which may reduce itching in some patients, but they are not first-line therapy for pruritus itself. Primary treatments include emollients, moisturizers, antihistamines, gabapentin, and difelikefalin. The phrasing '(if prescribed)' is appropriate and medically responsible.",
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
            symptom_details += f" **{symptom.title()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📝 **Description**: {info['description']}\n\n🔍 **Causes**: {', '.join(info['causes'])}\n\n💊 **Management Methods**: {', '.join(info['management'])}\n\n⚠️ **Severity**: {info['severity']}\n"

        message = f"✅ Found information on {len(found_symptoms)} symptom(s).\n\n{symptom_details}\n{('❓ **No additional information for**: ' + ', '.join(not_found) if not_found else '')}"

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
                "message": f"❓ Could not find specific information on the symptoms you entered.\n\n📋 **Entered symptoms**: {', '.join(symptom_list)}",
                "profile": profile
            }
        )


@p.tool
async def check_emergency_keywords(context: ToolContext, text: str) -> ToolResult:
    """Emergency keyword detection tool

    Detects keywords indicating emergency situations in user input.
    Categorizes emergencies into:
    1. Immediate 119 Call (Critical)
    2. Emergency Room Visit (Urgent)
    3. Outpatient Visit (Non-urgent)

    Args:
        context: ToolContext
        text: Text to check

    Returns:
        Emergency status and guidance message
    """
    # 1. Critical Emergency (Call 119)
    # Includes: Severe chest pain/Arrhythmia, Breathing difficulty/Pulmonary edema, Altered consciousness/Seizure
    CRITICAL_KEYWORDS = [
        # English
        "severe chest pain", "arrhythmia", "cardiac arrest", "hyperkalemia",
        "difficulty breathing", "pulmonary edema", "suffocation",
        "unconsciousness", "seizure", "uremic encephalopathy", "confusion", "tremor",
        
        # Korean
        "심한 가슴 통증", "부정맥", "고칼륨혈증", "심장 박동", "심정지",
        "호흡 곤란", "폐부종", "질식",
        "의식 저하", "발작", "요독성 뇌병증", "의식 혼미", "손 떨림", "경련"
    ]

    # 2. Urgent (Visit ER)
    # Includes: Sudden urine decrease, Severe flank pain, Cola-colored urine
    URGENT_KEYWORDS = [
        # English
        "sudden urine decrease", "oliguria", "anuria", "acute renal failure",
        "severe flank pain", "kidney stone", "hematuria",
        "cola-colored urine", "red urine", "acute kidney injury",
        
        # Korean
        "갑작스러운 소변량 감소", "소변량 급격히 줄", "아예 배출되지 않", "급성 신부전",
        "극심한 옆구리 통증", "요로 결석", "소변 흐름이 막히",
        "콜라색 소변", "육안적 혈뇨", "소변이 붉", "소변이 검붉", "급성 신장 손상"
    ]

    # 3. Non-Urgent (Outpatient)
    # Includes: CKD suspicion, Nephrotoxic drugs
    NON_URGENT_KEYWORDS = [
        # English
        "chronic kidney disease", "urine abnormality", "edema", "fatigue", "nocturia", "high blood pressure",
        "nephrotoxic drug", "nsaid", "antibiotic",
        
        # Korean
        "만성 콩팥병", "소변 이상", "부종", "피로", "야간뇨", "혈압 상승",
        "신독성 약물", "소염진통제", "항생제", "불편감"
    ]

    text_lower = text.lower()
    
    found_critical = [kw for kw in CRITICAL_KEYWORDS if kw in text_lower]
    found_urgent = [kw for kw in URGENT_KEYWORDS if kw in text_lower]
    found_non_urgent = [kw for kw in NON_URGENT_KEYWORDS if kw in text_lower]

    if found_critical:
        message = f"🚨 **CRITICAL EMERGENCY DETECTED (119)** The following symptoms require IMMEDIATE action: {', '.join(found_critical)}. Call 119 immediately."
        return ToolResult(
            data={
                "is_emergency": True,
                "severity": "critical",
                "found_keywords": found_critical,
                "message": message
            }
        )

    if found_urgent:
        message = f"⚠️ **URGENT MEDICAL ATTENTION NEEDED (ER)** The following symptoms require an Emergency Room visit: {', '.join(found_urgent)}. Visit the ER immediately to prevent worsening of the condition."
        return ToolResult(
            data={
                "is_emergency": True,
                "severity": "urgent",
                "found_keywords": found_urgent,
                "message": message
            }
        )
        
    if found_non_urgent:
        message = f"ℹ️ **MEDICAL CONSULTATION RECOMMENDED** The following items suggest a need for medical review: {', '.join(found_non_urgent)}. Schedule an outpatient visit to prevent worsening of the condition."
        return ToolResult(
            data={
                "is_emergency": False,
                "severity": "non_urgent",
                "found_keywords": found_non_urgent,
                "message": message
            }
        )

    return ToolResult(
        data={
            "is_emergency": False,
            "message": "No emergency situation detected. 💡 **Tip**: 119 is available for critical emergencies. For accurate diagnosis, describe your symptoms and onset time clearly at the ER."
        }
    )



# ==================== Guidelines ====================

async def add_guidelines(agent: p.Agent):
    """Add medical safety guidelines with priority relationships

    Returns:
        The disclaimer guideline to be used in other priority relationships
    """

    # # CHK-001: No reassurance for symptoms
    # no_reassurance = await agent.create_guideline(
    #     condition="User mentions symptoms",
    #     action="Never use reassuring phrases like 'don't worry' or 'it will be fine'. Always recommend consulting medical professionals."
    # )


    fast_answer_guideline = await agent.create_guideline(
        condition="Always respond any query",
        action="Always respond with a fast and concise answer. Never use exaggerated or inaccurate information. Base responses only on verified medical knowledge and search results."
    )

    # CHK-002: Emergency priority (HIGHEST PRIORITY)
    emergency_guideline = await agent.create_guideline(
        condition="Emergency keywords like chest pain, difficulty breathing, severe bleeding, unconsciousness are mentioned",
        action="Immediately tell user to call 911. Stop all other conversations.",
        tools=[check_emergency_keywords]
    )

    # limit_diagnosis = await agent.create_guideline(
    #     condition="User asks for diagnosis or prescription",
    #     action="Provide a comprehensive disclaimer explaining AI limitations in medical matters, emphasize the importance of professional medical evaluation, and suggest specific "
    # )

    # Off-topic and inappropriate request blocking
    off_topic_blocking = await agent.create_guideline(
        condition="User asks about non-medical topics (sports, politics, entertainment, etc.) OR makes inappropriate, offensive, or harmful requests",
        action="Politely explain that CareGuide specializes exclusively in medical and health-related topics. If the request is inappropriate or offensive, firmly decline and remind the user that the service is designed for legitimate medical inquiries."
    )

    # korean_guidelines = await agent.create_guideline(
    #     condition="Always upon reaching the final answer",
    #     action="Always translate the answer in Korean language.",
    # )


    # Priority relationships: Emergency has highest priority for content
    # await emergency_guideline.prioritize_over(no_reassurance)
    # await emergency_guideline.prioritize_over(limit_diagnosis)
    # await emergency_guideline.prioritize_over(profile_guidelines)
    await emergency_guideline.prioritize_over(off_topic_blocking)
    
    await agent.create_guideline(
        condition="When generating any response, including Korean writing, formatting, grammar, spacing, typography, presentation, readability management, and final delivery",
        action="Apply correct Korean spacing rules; ensure grammatical accuracy and consistent honorifics; format content with clear headings, lists, and Markdown; present key points first with progressive detail and examples; translate the final answer into natural Korean; apply proper typography such as bold, italic, and code formatting; review readability, sentence flow, spacing, and clarity before sending; and ensure that the final answer always follows a consistent, proper format without deviation."
    )




# ==================== Journey ====================
async def create_integrated_medical_journey(agent: p.Agent) -> p.Journey:
    journey = await agent.create_journey(
        title="Medical & Research Assistant",
        description=f"Simple 3-step flow with tool fallback.",
        conditions=["User asks any medical question or related question"],
    )


    # Step 1: Initial Search (search_medical_qa)
    t_initial_search = await journey.initial_state.transition_to(
        tool_state=search_medical_qa,
        tool_instruction="Perform initial medical search using Guidelines and QA sources with limits: [int, int, 0, 0, 0] for [guidelines, qa, papers, medical, pubmed]. QA limit is 10-20. Guidelines limit is 10-20. Medical limit is 5-15. Paper limit is 3-10. PubMed limit is 3-10. If user mention research or paper, use also papers and pubmed sources with limits [int, int, int, int, int] for [guidelines, qa, papers, medical, pubmed]. If user mention only research or paper, use only papers and pubmed sources with limits [0, 0, int, 0, int] for [guidelines, qa, papers, medical, pubmed].",
    )

    # Step 2: Generate response from initial search
    t_initial_response = await t_initial_search.target.transition_to(
        chat_state="Generate answer based on search results."
    )

    # Branch A: Satisfied -> Korean Response
    t_korean_direct = await t_initial_response.target.transition_to(
        chat_state="Translate/summarize the previous response into Korean and answer. You must respond only in Korean.",
        condition="Answer is complete and satisfactory about user's question"
    )
    await t_korean_direct.target.transition_to(state=p.END_JOURNEY)

    # Branch B: Not satisfied -> Use both specific tools sequentially
    t_stage_tool = await t_initial_response.target.transition_to(
        tool_state=get_kidney_stage_info,
        tool_instruction="Get kidney stage information based on GFR and stage. If GFR is not provided, use stage. If stage is not provided, use GFR.",
        condition="Answer is NOT satisfactory OR needs more specific info about kidney stage"
    )

    t_symptom_tool = await t_stage_tool.target.transition_to(
        tool_state=get_symptom_info,
        tool_instruction="Get symptom information based on kidney stage. If kidney stage is not provided, use GFR and stage.",
        condition="Answer is NOT satisfactory OR needs more specific info about kidney stage"
    )
    t_calculator_tool = await t_symptom_tool.target.transition_to(
        tool_state=cal_gfr,
        tool_instruction="Calculate GFR based on serum creatinine and age. If serum creatinine is not provided, use estimated GFR.",
        condition="User mentions GFR calculation"
    )

    # Step 2.5: Generate response from tools
    t_tools_response = await t_calculator_tool.target.transition_to(
        chat_state="Combine and explain results from stage, symptom, and calculator tools."
    )

    # Branch A: Satisfied after tools -> Korean Response
    t_korean_tools = await t_tools_response.target.transition_to(
        chat_state="Translate/summarize the previous response into Korean and answer. You must respond only in Korean.",
        condition="Answer is now complete and satisfactory"
    )
    await t_korean_tools.target.transition_to(state=p.END_JOURNEY)

    # Branch B: Still not satisfied -> Final fallback search
    t_fallback_search = await t_tools_response.target.transition_to(
        tool_state=search_medical_qa,
        tool_instruction="Deep fallback search. Expand scope. Include all sources with limits: [int, int, int, int, int] for [guidelines, qa, papers, medical, pubmed]. QA limit is 10-20. Guidelines limit is 10-20. Medical limit is 5-15. Paper limit is 3-10. PubMed limit is 3-10. If user mention research or paper, use also papers and pubmed sources with limits [int, int, int, int, int] for [guidelines, qa, papers, medical, pubmed]. If user mention only research or paper, use only papers and pubmed sources with limits [0, 0, int, 0, int] for [guidelines, qa, papers, medical, pubmed].",
        condition="Answer is still NOT satisfactory"
    )

    # Step 3: Final response
    t_final_response = await t_fallback_search.target.transition_to(
        chat_state="Generate comprehensive answer using all gathered information."
    )

    # Step 4: Final Korean Response (공통 최종 단계)
    t_korean_final = await t_final_response.target.transition_to(
        chat_state="Translate/summarize the previous response into Korean and answer. You must respond only in Korean."
    )

    await t_korean_final.target.transition_to(state=p.END_JOURNEY)

    return journey




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
            description="""CareGuide v2.0 is an advanced medical chatbot that combines hybrid search technology with real-time data from PubMed and other sources to deliver accurate, evidence-based health information. It intelligently adapts its responses—ranging from technical details for researchers to empathetic advice for patients—while strictly adhering to ethical safety guidelines and privacy standards.""",
            composition_mode=p.CompositionMode.COMPOSITED
        )
        print("  ✅ Agent created")
        # Create profile tag
        profile_tag = await server.create_tag(name=f"profile:{profile}")

        # Create customer
        time_uuid = uuid.uuid4()
        customer = await server.create_customer(
            name=f"user_{time_uuid}",
            tags=[profile_tag.id],
        )
        # Add guidelines with proper priority relationships
        print("  🔧 Adding guidelines...")
        await add_guidelines(agent)

        # Create journeys
        print("  🗺️ Creating Medical Information Journey...")
        journey = await create_integrated_medical_journey(agent)

        print("="*70)
        print("🎉 CareGuide v2.0 Server Successfully Started!")
        print("="*70)
        print(f"\n📋 **Server Information**:")
        print(f"  • CareGuide Agent ID: {agent.id}")
        print(f"  • Customer ID: {customer.id}")
        print(f"  • Medical Journey ID: {journey.id}")
        # print(f"  • Research Journey ID: {research_journey.id}")
        # print(f"  • Welfare Journey ID (CareGuide): {welfare_journey.id}")

        print(f"\n👤 **User Profile**:")
        profile_display = {
            "researcher": "Researcher/Expert",
            "patient": "Patient/Experience Holder",
            "general": "General Public/Novice"
        }
        print(f"  • Selected Profile: {profile_display[profile]}")
        print(f"  • Detail Level: {PROFILE_LIMITS[profile]['detail_level']}")
        print(f"  • Max Limits - QA:{PROFILE_LIMITS[profile]['max_qa']}, Guidelines:{PROFILE_LIMITS[profile]['max_guidelines']}, Papers:{PROFILE_LIMITS[profile]['max_paper']}, Medical:{PROFILE_LIMITS[profile]['max_medical']}, PubMed:{PROFILE_LIMITS[profile]['max_pubmed']}")



if __name__ == "__main__":
    async def run_standalone():
        async with p.Server() as server:
            await register_agent(server)
            print("Server running standalone. Press Ctrl+C to exit.")

    asyncio.run(run_standalone())
