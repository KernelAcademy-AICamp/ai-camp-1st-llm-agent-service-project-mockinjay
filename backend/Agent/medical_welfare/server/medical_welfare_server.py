"""
Medical Welfare Parlant Server
Medical Welfare Agent를 위한 독립 Parlant 서버

도구:
- search_welfare_programs: 복지 프로그램 검색
- search_hospitals: 병원/약국/투석센터 검색
- check_emergency_keywords: 응급 상황 감지
- get_kidney_stage_info: CKD 단계 정보
- get_symptom_info: 증상 정보
"""

import parlant.sdk as p
from parlant.sdk import ToolContext, ToolResult
import asyncio
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

import os
import time
from pathlib import Path
import sys
from typing import Optional, Dict
import uuid

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

# 서비스 imports
from app.db.welfare_manager import WelfareManager
from app.db.hospital_manager import HospitalManager
import logging

# 공통 도구 imports
from Agent.parlant_common import (
    check_emergency_keywords,
    get_kidney_stage_info,
    get_symptom_info,
    get_profile,
    convert_objectid_to_str,
    get_default_profile
)

# Journey import
from Agent.medical_welfare.server.welfare_journey import create_welfare_journey


logger = logging.getLogger(__name__)

# ==================== Global Variables ====================
WELFARE_MANAGER: Optional[WelfareManager] = None
HOSPITAL_MANAGER: Optional[HospitalManager] = None


# ==================== Initialization ====================

async def initialize_welfare_manager():
    """Initialize WelfareManager singleton"""
    global WELFARE_MANAGER

    if WELFARE_MANAGER is None:
        logger.info("🏥 Initializing Welfare Manager...")
        WELFARE_MANAGER = WelfareManager()
        # Connect to MongoDB and create indexes
        await WELFARE_MANAGER.connect()
        # Pre-initialize vector manager (loads Sentence Transformer model)
        logger.info("🔄 Pre-initializing Welfare Vector Manager...")
        await WELFARE_MANAGER._ensure_vector_manager()
        logger.info("✅ Welfare Manager ready (MongoDB + Vector Search)")


async def initialize_hospital_manager():
    """Initialize HospitalManager singleton"""
    global HOSPITAL_MANAGER

    if HOSPITAL_MANAGER is None:
        logger.info("🏥 Initializing Hospital Manager...")
        HOSPITAL_MANAGER = HospitalManager()
        # Connect to MongoDB and create indexes
        await HOSPITAL_MANAGER.connect()
        # Pre-initialize vector manager (loads Sentence Transformer model)
        logger.info("🔄 Pre-initializing Hospital Vector Manager...")
        await HOSPITAL_MANAGER._ensure_vector_manager()
        logger.info("✅ Hospital Manager ready (MongoDB + Vector Search)")


# ==================== Formatting Helpers ====================

def _summarize_benefits(benefits: Optional[Dict]) -> str:
    """Extract a short benefit summary for tool responses."""
    if not isinstance(benefits, dict):
        return "Please check the main support details."

    simple_fields = ["copay_reduction", "copay_rate", "monthly_amount", "benefits_list", "coverage_items"]
    for key in simple_fields:
        value = benefits.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, list) and value:
            return ", ".join(map(str, value[:3]))
        if isinstance(value, dict) and value:
            # Take the first nested string value
            nested = next((str(v) for v in value.values() if isinstance(v, (str, int, float))), None)
            if nested:
                return nested

    if "description" in benefits and isinstance(benefits["description"], str):
        return benefits["description"]

    return "Please refer to the organization's guide for detailed benefits."


def _format_program_summary(program: Dict, index: int) -> str:
    """Format a single welfare program into a concise summary line."""
    title = program.get("title") or "Unknown Program Name"
    category = program.get("category") or "Unknown Category"
    contact = program.get("contact") or {}
    organization = contact.get("organization") or contact.get("name") or "Unknown Organization"
    phone = contact.get("phone") or contact.get("contact") or "Unknown Contact"
    eligibility = program.get("eligibility") or {}

    if isinstance(eligibility, dict):
        stages = eligibility.get("ckd_stage") or eligibility.get("stage")
        stage_info = f"CKD Stage {'/'.join(map(str, stages))}" if stages else ""
        disease_code = eligibility.get("disease_code") or eligibility.get("code") or ""
        eligibility_desc = eligibility.get("description") or ""
    else:
        stage_info = ""
        disease_code = ""
        eligibility_desc = ""

    eligibility_bits = [bit for bit in [stage_info, disease_code, eligibility_desc] if bit]
    eligibility_text = " / ".join(eligibility_bits) if eligibility_bits else "Please check the provided description for detailed eligibility."

    benefits = _summarize_benefits(program.get("benefits"))

    return (
        f"{index}. {title} ({category})\n"
        f"   - Target: {eligibility_text}\n"
        f"   - Main Support: {benefits}\n"
        f"   - Contact: {organization} ({phone})"
    )


def _format_hospital_summary(hospital: Dict, index: int) -> str:
    """Format hospital search results into user-ready lines."""
    name = hospital.get("name") or "Unknown Hospital Name"
    address = hospital.get("address") or "No Address Info"
    phone = hospital.get("phone") or "No Phone Number"
    region = hospital.get("region") or ""
    hospital_type = hospital.get("type") or "No Type Info"
    has_dialysis = hospital.get("has_dialysis_unit")
    dialysis_text = "Dialysis Available" if has_dialysis else "No Dialysis Info"
    machines = hospital.get("dialysis_machines")
    if machines:
        dialysis_text += f", {machines} Dialysis Machines"
    night_dialysis = hospital.get("night_dialysis")
    night_text = "Night Dialysis Available" if night_dialysis else "No Night Dialysis"

    map_url = hospital.get("naver_map_url") or hospital.get("kakao_map_url")
    map_text = f"Map: {map_url}" if map_url else "No Map Link"

    return (
        f"{index}. {name} ({hospital_type}, {region})\n"
        f"   - Address: {address}\n"
        f"   - Contact: {phone}\n"
        f"   - Dialysis: {dialysis_text} / {night_text}\n"
        f"   - {map_text}"
    )


# ==================== Welfare Tools ====================

@p.tool
async def search_welfare_programs(
    context: ToolContext,
    query: str,
    category: Optional[str] = None,
    disease: Optional[str] = None,
    ckd_stage: Optional[int] = None
) -> ToolResult:
    """
    Search welfare programs for CKD patients

    This tool searches for welfare programs for Chronic Kidney Disease patients.

    Args:
        context: ToolContext
        query: Search query (e.g., "Dialysis Support", "Medical Expense Support") - **REQUIRED**
        category: (Optional) Category filter. Valid values:
            - "sangjung_special": 산정특례 (Special calculation for medical expenses)
            - "disability": 장애인 복지 (Disability welfare)
            - "medical_aid": 의료비 지원 (Medical expense support)
            - "transplant": 신장이식 지원 (Kidney transplant support)
            - "transport": 교통 및 생활 지원 (Transport and living support)
            If not specified, searches all categories.
        disease: (Optional) Disease filter (e.g., "CKD", "ESRD", "dialysis")
        ckd_stage: (Optional) CKD Stage (1-5), searches all stages if not provided

    Returns:
        ToolResult with welfare program results
        - programs: List of programs
        - metadata: Search metadata
    """
    start_time = time.time()

    # Valid category values in the database
    VALID_CATEGORIES = {"sangjung_special", "disability", "medical_aid", "transplant", "transport"}

    try:
        # Initialize
        await initialize_welfare_manager()

        # Validate and normalize category - ignore invalid values to avoid 0 results
        if category and category not in VALID_CATEGORIES:
            logger.warning(f"Invalid category '{category}' provided. Ignoring filter to search all categories.")
            category = None

        logger.info(f"Welfare search: query='{query}', category={category}, disease={disease}, stage={ckd_stage}")

        # Search welfare programs
        results = await WELFARE_MANAGER.search_programs(
            query=query,
            category=category,
            disease=disease,
            ckd_stage=ckd_stage,
        )
        
        # Convert ObjectId to string
        results = convert_objectid_to_str(results)
        
        programs = results
        
        elapsed = time.time() - start_time
        logger.info(f"Welfare search complete: {len(programs)} programs in {elapsed:.3f}s")
        
        summaries = [
            _format_program_summary(program, idx + 1)
            for idx, program in enumerate(programs)
        ]

        if summaries:
            message = "📋 Welfare Program Search Results:\n" + "\n".join(summaries)
        else:
            message = "No welfare programs found matching the search criteria. Please try again with different keywords or conditions."

        return ToolResult(
            data={
                "message": message,
                "query": query,
                "programs": programs,
                "summaries": summaries,
                "metadata": {
                    "count": len(programs),
                    "category": category,
                    "disease": disease,
                    "ckd_stage": ckd_stage,
                    "response_time": f"{elapsed:.3f}s",
                    "search_type": "hybrid"  # Indicates vector + keyword search
                }
            }
        )
        
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"Welfare search error: {e}", exc_info=True)
        return ToolResult(
            data={
                "error": str(e),
                "message": f"⚠️ An error occurred while searching for welfare programs: {e}"
            }
        )


@p.tool
async def search_hospitals(
    context: ToolContext,
    query: str,
    hospital_type: Optional[str] = None,
    region: Optional[str] = None,
    has_dialysis: Optional[bool] = None,
    night_dialysis: Optional[bool] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    max_distance_km: Optional[float] = 10.0
) -> ToolResult:
    """
    Search hospitals, pharmacies, and dialysis centers
    
    This tool searches for hospitals, pharmacies, and dialysis centers.
    
    Args:
        context: ToolContext
        query: Search query (e.g., "Hospitals with dialysis", "24-hour pharmacy")
        hospital_type: Hospital type ("hospital", "pharmacy", "dialysis_center")
        region: Region (e.g., "Seoul", "Busan")
        has_dialysis: Whether dialysis is available
        night_dialysis: Whether night dialysis is available
        latitude: Latitude (for location-based search)
        longitude: Longitude (for location-based search)
        max_distance_km: Maximum distance (km, default 10km)
    
    Returns:
        ToolResult with hospital results
        - hospitals: List of hospitals
        - metadata: Search metadata
    """
    start_time = time.time()

    try:
        # Initialize
        await initialize_hospital_manager()

        # Input sanitization: strip whitespace and trailing punctuation (LLM sometimes adds commas)
        def sanitize_param(value: Optional[str]) -> Optional[str]:
            if not value:
                return None
            cleaned = value.strip().rstrip(",.:;")
            return cleaned if cleaned else None

        query = sanitize_param(query)
        hospital_type = sanitize_param(hospital_type)
        region = sanitize_param(region)

        # Map English hospital_type to Korean DB values
        # DB only has: "병원/의원", "약국"
        hospital_type_mapping = {
            "hospital": "병원/의원",
            "pharmacy": "약국",
            "dialysis_center": None,  # Use has_dialysis=True instead
            "clinic": "병원/의원",
            "병원": "병원/의원",
            "약국": "약국",
        }

        mapped_type = hospital_type_mapping.get(hospital_type, hospital_type) if hospital_type else None

        # If dialysis_center is requested, ignore type filter and use has_dialysis=True
        if hospital_type == "dialysis_center":
            mapped_type = None
            has_dialysis = True

        logger.info(f"Hospital search: query='{query}', type={mapped_type}, region={region}, has_dialysis={has_dialysis}")

        # Search hospitals
        results = await HOSPITAL_MANAGER.search_hospitals(
            query=query,
            hospital_type=mapped_type,
            region=region,
            has_dialysis=has_dialysis,
            night_dialysis=night_dialysis,
            latitude=latitude,
            longitude=longitude,
            max_distance_km=max_distance_km,
        )
        
        # Convert ObjectId to string
        results = convert_objectid_to_str(results)
        
        hospitals = results
        
        elapsed = time.time() - start_time
        logger.info(f"Hospital search complete: {len(hospitals)} hospitals in {elapsed:.3f}s")
        
        summaries = [
            _format_hospital_summary(hospital, idx + 1)
            for idx, hospital in enumerate(hospitals)
        ]

        if summaries:
            message = "🏥 Hospital/Pharmacy Search Results:\n" + "\n".join(summaries)
        else:
            message = "No hospitals or pharmacies found matching the conditions. Please adjust the region, keywords, or dialysis criteria."

        return ToolResult(
            data={
                "message": message,
                "query": query,
                "hospitals": hospitals,
                "summaries": summaries,
                "metadata": {
                    "count": len(hospitals),
                    "hospital_type": hospital_type,
                    "region": region,
                    "has_dialysis": has_dialysis,
                    "night_dialysis": night_dialysis,
                    "response_time": f"{elapsed:.3f}s"
                }
            }
        )
        
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"Hospital search error: {e}", exc_info=True)
        return ToolResult(
            data={
                "error": str(e),
                "message": f"⚠️ An error occurred while searching for hospitals: {e}"
            }
        )

# ==================== Common Tools (Wrappers) ====================

@p.tool
async def check_emergency(context: ToolContext, text: str) -> ToolResult:
    """
    Emergency keyword detection
    
    Args:
        context: ToolContext
        text: Text to check
    
    Returns:
        Emergency status and guidance
    """
    result = await check_emergency_keywords(context, text)
    return ToolResult(data=result)


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
        condition="User asks about non-welfare or non-health topics (sports, politics, entertainment, etc.) OR makes inappropriate, offensive, or harmful requests",
        action="Politely explain that CareGuide specializes exclusively in welfare and health-related topics. If the request is inappropriate or offensive, firmly decline and remind the user that the service is designed for legitimate welfare inquiries."
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


# ==================== Parlant Server Main ====================

async def register_agent(server: p.Server):
    """Main function - Server initialization and execution"""
    
    print("\n" + "="*70)
    print("🚀 Medical Welfare Parlant Server Initializing...")
    print("="*70)
    
    # Initialize managers
    print("\n[1/3] Initializing Welfare Manager...")
    await initialize_welfare_manager()
    
    print("[2/3] Initializing Hospital Manager...")
    await initialize_hospital_manager()
    
    # Get default profile
    print("\n[3/3] Setting up Parlant Server...")
    profile = get_default_profile()
    
    # Start Parlant server
    if server:  # Use provided server
        # Create Agent
        agent = await server.create_agent(
            name="MedicalWelfare_Agent",
            description="""Medical Welfare Agent is a specialized AI assistant designed to navigate the complex landscape of social support for Chronic Kidney Disease (CKD) patients by leveraging search tools for welfare programs and medical facilities. It intelligently distinguishes between inquiries—directing users to specific cost reduction schemes, disability benefits, and local dialysis centers—while responsibly redirecting clinical questions to research-focused agents to ensure medical accuracy. Strictly adhering to current Korean welfare standards, the agent provides structured, actionable guidance on eligibility and application processes, ensuring patients receive the most relevant and up-to-date non-clinical support available.""",
            composition_mode=p.CompositionMode.COMPOSITED
        )
        
        print("  ✅ Agent created")
        print(f"  📊 Agent ID: {agent.id}")
        print(f"  📊 Agent Name: {agent.name}")

        await add_guidelines(agent)
        
        # Create Welfare Journey
        welfare_journey = await create_welfare_journey(agent, search_welfare_programs, search_hospitals)

        
        print("\n" + "="*70)
        print("🟢 Medical Welfare Server is running on port 8801")
        print(f"   Agent ID: {agent.id}")
        print(f"   Journey ID: {welfare_journey.id}")
        print("   Press Ctrl+C to exit.")
        print("="*70 + "\n")
        profile = get_default_profile()
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
        print("🎉 Medical Welfare Server Successfully Started!")
        print("="*70)
        print(f"\n📋 **Server Information**:")
        print(f"  • Medical Welfare Agent ID: {agent.id}")
        print(f"  • Customer ID: {customer.id}")
        print(f"  • Welfare Journey ID: {welfare_journey.id}")




async def cleanup_managers():
    """Cleanup database connections on shutdown"""
    global WELFARE_MANAGER, HOSPITAL_MANAGER
    
    logger.info("🛑 Cleaning up database connections...")
    
    if WELFARE_MANAGER:
        await WELFARE_MANAGER.close()
        WELFARE_MANAGER = None
        logger.info("✅ Welfare Manager connection closed")
    
    if HOSPITAL_MANAGER:
        await HOSPITAL_MANAGER.close()
        HOSPITAL_MANAGER = None
        logger.info("✅ Hospital Manager connection closed")


if __name__ == "__main__":
    async def run_standalone():
        try:
            async with p.Server(host="127.0.0.1", port=8801) as server:
                await register_agent(server)
        except KeyboardInterrupt:
            logger.info("\n🛑 Received shutdown signal")
        finally:
            await cleanup_managers()
            logger.info("👋 Server shutdown complete")

    asyncio.run(run_standalone())

