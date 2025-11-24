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

# Guidelines import
from Agent.medical_welfare.server.medical_welfare_guidelines import MEDICAL_WELFARE_GUIDELINES

logger = logging.getLogger(__name__)

# ==================== Configuration ====================
PROFILE_LIMITS = {
    "researcher": {"max_results": 10},
    "patient": {"max_results": 5},
    "general": {"max_results": 3}
}

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
        logger.info("✅ Welfare Manager ready (connected to MongoDB)")


async def initialize_hospital_manager():
    """Initialize HospitalManager singleton"""
    global HOSPITAL_MANAGER
    
    if HOSPITAL_MANAGER is None:
        logger.info("🏥 Initializing Hospital Manager...")
        HOSPITAL_MANAGER = HospitalManager()
        # Connect to MongoDB and create indexes
        await HOSPITAL_MANAGER.connect()
        logger.info("✅ Hospital Manager ready (connected to MongoDB)")


# ==================== Formatting Helpers ====================

def _summarize_benefits(benefits: Optional[Dict]) -> str:
    """Extract a short benefit summary for tool responses."""
    if not isinstance(benefits, dict):
        return "주요 지원 내용을 확인해 주세요."

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

    return "세부 혜택은 담당 기관 안내를 참고해 주세요."


def _format_program_summary(program: Dict, index: int) -> str:
    """Format a single welfare program into a concise summary line."""
    title = program.get("title") or "프로그램명 미상"
    category = program.get("category") or "카테고리 미상"
    contact = program.get("contact") or {}
    organization = contact.get("organization") or contact.get("name") or "담당 기관 미상"
    phone = contact.get("phone") or contact.get("contact") or "문의처 미상"
    eligibility = program.get("eligibility") or {}

    if isinstance(eligibility, dict):
        stages = eligibility.get("ckd_stage") or eligibility.get("stage")
        stage_info = f"CKD {'/'.join(map(str, stages))}기" if stages else ""
        disease_code = eligibility.get("disease_code") or eligibility.get("code") or ""
        eligibility_desc = eligibility.get("description") or ""
    else:
        stage_info = ""
        disease_code = ""
        eligibility_desc = ""

    eligibility_bits = [bit for bit in [stage_info, disease_code, eligibility_desc] if bit]
    eligibility_text = " / ".join(eligibility_bits) if eligibility_bits else "세부 대상 조건은 제시된 설명을 확인해 주세요."

    benefits = _summarize_benefits(program.get("benefits"))

    return (
        f"{index}. {title} ({category})\n"
        f"   - 대상: {eligibility_text}\n"
        f"   - 주요 지원: {benefits}\n"
        f"   - 문의: {organization} ({phone})"
    )


def _format_hospital_summary(hospital: Dict, index: int) -> str:
    """Format hospital search results into user-ready lines."""
    name = hospital.get("name") or "병원명 미상"
    address = hospital.get("address") or "주소 정보 없음"
    phone = hospital.get("phone") or "전화번호 없음"
    region = hospital.get("region") or ""
    hospital_type = hospital.get("type") or "유형 정보 없음"
    has_dialysis = hospital.get("has_dialysis_unit")
    dialysis_text = "투석 가능" if has_dialysis else "투석 정보 없음"
    machines = hospital.get("dialysis_machines")
    if machines:
        dialysis_text += f", 투석기 {machines}대"
    night_dialysis = hospital.get("night_dialysis")
    night_text = "야간투석 운영" if night_dialysis else "야간투석 미운영"

    map_url = hospital.get("naver_map_url") or hospital.get("kakao_map_url")
    map_text = f"지도: {map_url}" if map_url else "지도 링크 없음"

    return (
        f"{index}. {name} ({hospital_type}, {region})\n"
        f"   - 주소: {address}\n"
        f"   - 연락처: {phone}\n"
        f"   - 투석: {dialysis_text} / {night_text}\n"
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
    
    이 도구는 만성콩팥병 환자를 위한 복지 프로그램을 검색합니다.
    
    Args:
        context: ToolContext
        query: 검색 쿼리 (예: "투석 지원", "의료비 지원") - **REQUIRED**
        category: (Optional) 카테고리 필터 (예: "medical_support", "social_welfare")
        disease: (Optional) 질병 필터 (예: "CKD", "diabetes")
        ckd_stage: (Optional) CKD 단계 (1-5), 제공되지 않으면 모든 단계 검색
    
    Returns:
        ToolResult with welfare program results
        - programs: 프로그램 목록
        - metadata: 검색 메타데이터
    """
    start_time = time.time()
    
    try:
        # Initialize
        await initialize_welfare_manager()
        
        # Get profile
        profile = await get_profile(context)
        max_results = PROFILE_LIMITS[profile]["max_results"]
        
        logger.info(f"Welfare search: query='{query}', category={category}, disease={disease}, stage={ckd_stage}")
        
        # Search welfare programs
        results = await WELFARE_MANAGER.search_programs(
            query=query,
            category=category,
            disease=disease,
            ckd_stage=ckd_stage,
            limit=max_results * 2  # Get more, then filter
        )
        
        # Convert ObjectId to string
        results = convert_objectid_to_str(results)
        
        # Limit results based on profile
        programs = results[:max_results] if results else []
        
        elapsed = time.time() - start_time
        logger.info(f"Welfare search complete: {len(programs)} programs in {elapsed:.3f}s")
        
        summaries = [
            _format_program_summary(program, idx + 1)
            for idx, program in enumerate(programs)
        ]

        if summaries:
            message = "📋 복지 프로그램 검색 결과:\n" + "\n".join(summaries)
        else:
            message = "검색 조건에 맞는 복지 프로그램을 찾지 못했습니다. 다른 키워드나 조건으로 다시 시도해 주세요."

        return ToolResult(
            data={
                "message": message,
                "query": query,
                "profile": profile,
                "programs": programs,
                "summaries": summaries,
                "metadata": {
                    "count": len(programs),
                    "category": category,
                    "disease": disease,
                    "ckd_stage": ckd_stage,
                    "response_time": f"{elapsed:.3f}s"
                }
            }
        )
        
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"Welfare search error: {e}", exc_info=True)
        return ToolResult(
            data={
                "error": str(e),
                "message": f"⚠️ 복지 프로그램 검색 중 오류가 발생했습니다: {e}"
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
    
    이 도구는 병원, 약국, 투석센터를 검색합니다.
    
    Args:
        context: ToolContext
        query: 검색 쿼리 (예: "투석 가능한 병원", "24시간 약국")
        hospital_type: 병원 유형 ("hospital", "pharmacy", "dialysis_center")
        region: 지역 (예: "서울", "부산")
        has_dialysis: 투석 가능 여부
        night_dialysis: 야간 투석 가능 여부
        latitude: 위도 (위치 기반 검색)
        longitude: 경도 (위치 기반 검색)
        max_distance_km: 최대 거리 (km, 기본 10km)
    
    Returns:
        ToolResult with hospital results
        - hospitals: 병원 목록
        - metadata: 검색 메타데이터
    """
    start_time = time.time()
    
    try:
        # Initialize
        await initialize_hospital_manager()
        
        # Get profile
        profile = await get_profile(context)
        max_results = PROFILE_LIMITS[profile]["max_results"]
        
        logger.info(f"Hospital search: query='{query}', type={hospital_type}, region={region}")
        
        # Search hospitals
        results = await HOSPITAL_MANAGER.search_hospitals(
            query=query,
            hospital_type=hospital_type,
            region=region,
            has_dialysis=has_dialysis,
            night_dialysis=night_dialysis,
            latitude=latitude,
            longitude=longitude,
            max_distance_km=max_distance_km,
            limit=max_results * 2
        )
        
        # Convert ObjectId to string
        results = convert_objectid_to_str(results)
        
        # Limit results
        hospitals = results[:max_results] if results else []
        
        elapsed = time.time() - start_time
        logger.info(f"Hospital search complete: {len(hospitals)} hospitals in {elapsed:.3f}s")
        
        summaries = [
            _format_hospital_summary(hospital, idx + 1)
            for idx, hospital in enumerate(hospitals)
        ]

        if summaries:
            message = "🏥 병원/약국 검색 결과:\n" + "\n".join(summaries)
        else:
            message = "조건에 맞는 병원이나 약국을 찾지 못했습니다. 지역·키워드나 투석 조건을 조정해 검색해 주세요."

        return ToolResult(
            data={
                "message": message,
                "query": query,
                "profile": profile,
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
                "message": f"⚠️ 병원 검색 중 오류가 발생했습니다: {e}"
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


@p.tool
async def get_ckd_stage_info(
    context: ToolContext,
    gfr: float = None,
    stage: int = None
) -> ToolResult:
    """
    CKD stage information
    
    Args:
        context: ToolContext
        gfr: GFR value
        stage: CKD stage (1-5)
    
    Returns:
        Stage information
    """
    result = await get_kidney_stage_info(context, gfr, stage)
    return ToolResult(data=result)


@p.tool
async def get_symptoms_info(context: ToolContext, symptoms: str) -> ToolResult:
    """
    Symptom information
    
    Args:
        context: ToolContext
        symptoms: Symptoms (comma-separated)
    
    Returns:
        Symptom details
    """
    result = await get_symptom_info(context, symptoms)
    return ToolResult(data=result)


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
            description="""You are a Medical Welfare Agent for CKD (Chronic Kidney Disease) patients.
**When to use each tool**:
1. User asks about 복지/지원/혜택 → Use `search_welfare_programs`
2. User asks about 병원/투석센터 → Use `search_hospitals`
3. User asks about CKD symptoms/treatment → Politely redirect to Research Paper Agent

**Core Features**:
1. **Welfare Program Search** (`search_welfare_programs`):
   - 산정특례 (special cost reduction)
   - 의료비 지원 (medical cost support)
   - 장애인 등록 안내 (disability registration)
   - 투석 지원 (dialysis support)
   - 교통비 지원 (transportation support)
   
2. **Hospital/Facility Search** (`search_hospitals`):
   - Location-based search
   - Dialysis capability filtering
   - Night dialysis availability
   - Pharmacy search

**Response Structure**:
1. **Search First**: ALWAYS use appropriate tool before answering
2. **Available Programs**: List relevant welfare programs from search results
3. **Eligibility**: Who can apply
4. **Benefits**: What support is provided
5. **Application**: How to apply (step-by-step)
6. **Hospitals**: Nearby facilities (if location provided)
7. **Contacts**: Phone numbers, websites
8. **Disclaimer**: "⚠️ 복지 정보는 변경될 수 있습니다. 최신 정보는 해당 기관에 문의하세요."

Always respond in Korean unless specifically requested otherwise.
""",
            composition_mode=p.CompositionMode.COMPOSITED
        )
        
        print("  ✅ Agent created")
        print(f"  📊 Agent ID: {agent.id}")
        print(f"  📊 Agent Name: {agent.name}")
        
        # Add Guidelines
        print("  🔧 Adding welfare guidelines...")
        await agent.create_guideline(
        condition="Emergency keywords like chest pain, difficulty breathing, severe bleeding, unconsciousness are mentioned",
        action="Immediately tell user to call 911. Provide clear instructions: 1) Call 911 now 2) Tell them your exact location 3) Describe symptoms accurately 4) Follow dispatcher's instructions. Stop all other conversations. Use strong, urgent language. Respond in Korean.",
        tools=[check_emergency]
    )
        
        # Guideline 4: Profile-aware responses
        await agent.create_guideline(
            condition="Providing welfare program information",
            action=MEDICAL_WELFARE_GUIDELINES,
        )
        
        print(f"  ✅ Added 5 guidelines")
        
        # Create Welfare Journey
        print("  🗺️ Creating Welfare Support Journey...")
        welfare_journey = await create_welfare_journey(agent, search_welfare_programs, search_hospitals)
        print(f"  ✅ Journey created: {welfare_journey.id}")

        
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
                await asyncio.Event().wait()
        except KeyboardInterrupt:
            logger.info("\n🛑 Received shutdown signal")
        finally:
            await cleanup_managers()
            logger.info("👋 Server shutdown complete")

    asyncio.run(run_standalone())

