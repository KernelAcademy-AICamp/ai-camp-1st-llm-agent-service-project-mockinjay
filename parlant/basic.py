# healthcare.py

import parlant.sdk as p
from parlant.sdk import ToolContext, ToolResult
import asyncio
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

import uuid
import json
import os
from typing import Optional
import httpx

# ==================== 설정 ====================
PROFILE_LIMITS = {
    "researcher": {"max_results": 10, "detail_level": "high"},
    "patient": {"max_results": 5, "detail_level": "medium"},
    "general": {"max_results": 3, "detail_level": "low"}
}

DATA_PATHS = {
    "qa": "/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/unified_output/qa_enhanced.jsonl",
    "papers": "/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/unified_output/paper_dataset_enriched_s2_checkpoint_4850.jsonl",
    "medical": "/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/unified_output/medical_data_enhanced.jsonl"
}

# ==================== 전역 데이터 ====================
QA_DATA = []
PAPER_DATA = []
MEDICAL_DATA = []

def load_all_data():
    """3개 데이터셋 로드"""
    global QA_DATA, PAPER_DATA, MEDICAL_DATA

    print("📂 데이터 로딩 중...")

    # QA 데이터 (샘플링: 1만 개)
    try:
        with open(DATA_PATHS["qa"], "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                if i >= 10000:
                    break
                QA_DATA.append(json.loads(line))
        print(f"  ✅ QA 데이터: {len(QA_DATA)}개 로드")
    except Exception as e:
        print(f"  ⚠️ QA 데이터 로드 실패: {e}")

    # 논문 데이터 (전체)
    try:
        with open(DATA_PATHS["papers"], "r", encoding="utf-8") as f:
            for line in f:
                PAPER_DATA.append(json.loads(line))
        print(f"  ✅ 논문 데이터: {len(PAPER_DATA)}개 로드")
    except Exception as e:
        print(f"  ⚠️ 논문 데이터 로드 실패: {e}")

    # 의료 데이터 (샘플링: 1만 개)
    try:
        with open(DATA_PATHS["medical"], "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                if i >= 10000:
                    break
                MEDICAL_DATA.append(json.loads(line))
        print(f"  ✅ 의료 데이터: {len(MEDICAL_DATA)}개 로드")
    except Exception as e:
        print(f"  ⚠️ 의료 데이터 로드 실패: {e}")

    print(f"📊 총 {len(QA_DATA) + len(PAPER_DATA) + len(MEDICAL_DATA)}개 데이터 로드 완료\n")


# ==================== 헬퍼 함수 ====================

async def get_profile(context: ToolContext) -> str:
    """프로필 추출"""
    try:
        customer = await context.get_customer()
        for tag_id in customer.tags:
            tag = await context.get_tag(tag_id)
            if tag.name.startswith("profile:"):
                return tag.name.split(":")[1]
    except:
        pass
    return "general"


def simple_search(query: str, data: list, field: str, top_k: int = 5) -> list:
    """간단한 키워드 검색"""
    query_lower = query.lower()
    results = []

    for item in data:
        # 필드가 리스트인 경우 (예: keywords)
        if isinstance(item.get(field), list):
            text = " ".join(str(x) for x in item.get(field, [])).lower()
        else:
            text = str(item.get(field, "")).lower()

        if query_lower in text:
            score = text.count(query_lower)  # 출현 빈도
            results.append({"data": item, "score": score})

    results.sort(key=lambda x: x["score"], reverse=True)
    return [r["data"] for r in results[:top_k]]


async def search_pubmed_simple(query: str, max_results: int = 5) -> list:
    """PubMed API 간단 검색"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # ID 검색
            search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
            params = {
                "db": "pubmed",
                "term": query,
                "retmax": max_results,
                "retmode": "json"
            }
            resp = await client.get(search_url, params=params)
            pmids = resp.json().get("esearchresult", {}).get("idlist", [])

            if not pmids:
                return []

            # 요약 정보
            summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
            params = {"db": "pubmed", "id": ",".join(pmids), "retmode": "json"}
            resp = await client.get(summary_url, params=params)
            data = resp.json()

            papers = []
            for pmid in pmids:
                info = data.get("result", {}).get(pmid, {})
                papers.append({
                    "title": info.get("title", ""),
                    "source": "PubMed",
                    "pmid": pmid,
                    "pubdate": info.get("pubdate", "")
                })

            return papers
    except Exception as e:
        print(f"⚠️ PubMed 검색 오류: {e}")
        return []


async def llm_refine_results(query: str, raw_results: dict, profile: str) -> str:
    """LLM으로 검색 결과 정제 및 요약"""

    # 프로필별 언어 수준
    detail_levels = {
        "researcher": "학술적이고 전문적인 용어를 사용하여 상세하게",
        "patient": "실용적이고 이해하기 쉽게, 일상생활에 적용 가능하도록",
        "general": "매우 쉽고 간단한 언어로, 전문 용어 최소화하여"
    }

    # 검색 결과 요약
    qa_summary = "\n".join([
        f"- Q: {item.get('question', '')[:100]}\n  A: {item.get('answer', '')[:200]}"
        for item in raw_results["qa_results"][:5]
    ]) if raw_results["qa_results"] else "결과 없음"

    paper_summary = "\n".join([
        f"- {item.get('title', '')[:150]}"
        for item in raw_results["paper_results"][:5]
    ]) if raw_results["paper_results"] else "결과 없음"

    medical_summary = "\n".join([
        f"- {' '.join(item.get('keyword', [])[:5]) if isinstance(item.get('keyword'), list) else ''}: {item.get('text', '')[:200]}"
        for item in raw_results["medical_results"][:3]
    ]) if raw_results["medical_results"] else "결과 없음"

    pubmed_summary = "\n".join([
        f"- {item.get('title', '')[:150]} (PMID: {item.get('pmid', '')})"
        for item in raw_results["pubmed_results"][:3]
    ]) if raw_results["pubmed_results"] else "결과 없음"

    # LLM 프롬프트
    prompt = f"""사용자 질문: "{query}"

다음은 4개 데이터 소스에서 검색한 원본 결과입니다:

**1. QA 데이터 ({len(raw_results['qa_results'])}개 결과):**
{qa_summary}

**2. 논문 데이터 ({len(raw_results['paper_results'])}개 결과):**
{paper_summary}

**3. 의료 특허/발명 데이터 ({len(raw_results['medical_results'])}개 결과):**
{medical_summary}

**4. PubMed 검색 결과 ({len(raw_results['pubmed_results'])}개 결과):**
{pubmed_summary}

위 검색 결과를 바탕으로 사용자 질문에 대한 답변을 작성하세요.

**요구사항:**
1. 사용자 프로필: {profile} - {detail_levels.get(profile, '')} 설명하세요.
2. 중복된 정보는 제거하고 관련성 높은 정보만 포함하세요.
3. 출처를 명시하세요 (예: "QA 데이터에 따르면...", "PubMed 논문에서는...").
4. 한국어로 작성하세요.
5. 의료 면책 조항: "⚠️ 이 정보는 참고용이며 의학적 조언을 대체할 수 없습니다. 증상이 있으시면 의료진과 상담하세요."를 마지막에 추가하세요.

답변:"""

    return prompt


async def gather_all_sources(query: str, max_per_source: int = 5) -> dict:
    """4개 소스에서 병렬 검색"""

    # 1. 로컬 검색 (동기)
    qa_results = simple_search(query, QA_DATA, "question", max_per_source)
    paper_results = simple_search(query, PAPER_DATA, "title", max_per_source)
    medical_results = simple_search(query, MEDICAL_DATA, "text", max_per_source)

    # 2. PubMed 검색 (비동기)
    pubmed_results = await search_pubmed_simple(query, max_per_source)

    return {
        "qa_results": qa_results,
        "paper_results": paper_results,
        "medical_results": medical_results,
        "pubmed_results": pubmed_results
    }



async def select_profile() -> str:
    """프로필 선택 - 입력 검증 강화"""
    print("\n" + "="*60)
    print("CareGuide Healthcare Chatbot")
    print("="*60)
    print("\n사용자 프로필을 선택하세요:\n")
    print("1. 연구자/전문가 (학술적 정보, 최대 10개 결과)")
    print("2. 질환자/경험자 (실용적 정보, 최대 5개 결과)")
    print("3. 일반인/노비스 (간단한 설명, 최대 3개 결과)")
    print()

    mapping = {"1": "researcher", "2": "patient", "3": "general"}

    while True:
        choice = input("선택 (1/2/3): ").strip()
        if choice in mapping:
            return mapping[choice]
        print("❌ 잘못된 입력입니다. 1, 2, 3 중 하나를 선택하세요.\n")



# ================== Medical Information Tools ==================
# 의료 정보 제공 도구들 - 프로필별 맞춤 정보 제공

@p.tool
async def search_medical_qa(context: ToolContext, query: str) -> ToolResult:
    """의료 정보 검색 - 4개 소스 통합 + LLM 정제

    1. qa_enhanced.jsonl 검색
    2. paper_dataset.jsonl 검색
    3. medical_data.jsonl 검색
    4. PubMed API 검색
    5. LLM으로 결과 정제 및 요약
    """
    try:
        # 프로필 추출
        profile = await get_profile(context)
        max_results = PROFILE_LIMITS[profile]["max_results"]

        # 4개 소스 병렬 검색
        raw_results = await gather_all_sources(query, max_per_source=max_results)

        # LLM 정제용 프롬프트 생성
        refinement_prompt = await llm_refine_results(query, raw_results, profile)

        # 총 결과 수
        total_count = (
            len(raw_results["qa_results"]) +
            len(raw_results["paper_results"]) +
            len(raw_results["medical_results"]) +
            len(raw_results["pubmed_results"])
        )

        # 검색 결과 반환 (Parlant Agent가 refinement_prompt를 처리)
        return ToolResult(
            data={
                "query": query,
                "profile": profile,
                "raw_results": raw_results,
                "refinement_prompt": refinement_prompt,
                "total_sources": 4,
                "qa_count": len(raw_results["qa_results"]),
                "paper_count": len(raw_results["paper_results"]),
                "medical_count": len(raw_results["medical_results"]),
                "pubmed_count": len(raw_results["pubmed_results"]),
                "total_count": total_count,
                "message": f"총 {total_count}개 결과를 4개 소스에서 찾았습니다. (QA: {len(raw_results['qa_results'])}, 논문: {len(raw_results['paper_results'])}, 의료: {len(raw_results['medical_results'])}, PubMed: {len(raw_results['pubmed_results'])})"
            }
        )
    except Exception as e:
        return ToolResult(
            data={
                "error": str(e),
                "message": f"검색 중 오류가 발생했습니다: {e}"
            }
        )


@p.tool
async def get_kidney_stage_info(context: ToolContext, gfr: Optional[float] = None, stage: Optional[int] = None) -> ToolResult:
    """신장질환 단계별 정보 제공 도구

    CKD (만성신장질환) 1-5단계에 대한 상세 정보를 제공합니다.
    GFR 수치 또는 단계 번호로 조회 가능합니다.
    """
    # 프로필 추출
    profile = await get_profile(context)

    # CKD 단계별 정보 정의
    kidney_stages = {
        1: {
            "stage": "1단계",
            "gfr_range": "90 이상",
            "description": "신장 기능은 정상이나 단백뇨 등 신장 손상의 증거가 있음",
            "management": "혈압 관리, 당뇨 조절, 정기적인 검진",
            "dietary": "일반적인 건강식, 염분 제한",
            "monitoring": "6-12개월마다 검진"
        },
        2: {
            "stage": "2단계",
            "gfr_range": "60-89",
            "description": "경도의 신장 기능 저하",
            "management": "원인 질환 치료, 신장 기능 보호",
            "dietary": "저염식, 적절한 수분 섭취",
            "monitoring": "6개월마다 검진"
        },
        3: {
            "stage": "3단계 (3a: 45-59, 3b: 30-44)",
            "gfr_range": "30-59",
            "description": "중등도의 신장 기능 저하",
            "management": "합병증 예방, 진행 속도 늦추기",
            "dietary": "저염식, 저칼륨, 저인 식이",
            "monitoring": "3-6개월마다 검진"
        },
        4: {
            "stage": "4단계",
            "gfr_range": "15-29",
            "description": "심한 신장 기능 저하",
            "management": "투석 또는 이식 준비",
            "dietary": "엄격한 식이 제한, 영양사 상담 필수",
            "monitoring": "1-3개월마다 검진"
        },
        5: {
            "stage": "5단계",
            "gfr_range": "15 미만",
            "description": "말기 신부전",
            "management": "투석 또는 신장 이식 필요",
            "dietary": "투석 종류에 따른 식이 관리",
            "monitoring": "매월 또는 더 자주 검진"
        }
    }

    # GFR로 단계 결정
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

    # 단계 정보 반환
    if stage and stage in kidney_stages:
        stage_info = kidney_stages[stage]
        return ToolResult(
            data={
                "stage": stage,
                "info": stage_info,
                "gfr": gfr,
                "profile": profile,
                "message": f"CKD {stage_info['stage']} 정보: {stage_info['description']}"
            }
        )
    else:
        return ToolResult(
            data={
                "error": "유효한 단계 또는 GFR 수치를 입력해주세요.",
                "valid_stages": "1-5",
                "profile": profile,
                "message": "CKD는 1-5단계로 분류됩니다. GFR 수치 또는 단계 번호를 입력해주세요."
            }
        )


@p.tool
async def get_symptom_info(context: ToolContext, symptoms: list) -> ToolResult:
    """신장질환 관련 증상 정보 제공 도구

    신장질환과 관련된 증상들에 대한 정보를 제공합니다.
    응급 증상을 감지하면 즉시 119 안내를 합니다.
    """
    # 프로필 추출
    profile = await get_profile(context)

    # 응급 증상 체크
    emergency_symptoms = ["흉통", "호흡곤란", "의식저하", "가슴통증", "숨막힘", "심한 부종"]
    found_emergency = any(symptom in emergency_symptoms for symptom in symptoms)

    if found_emergency:
        return ToolResult(
            data={
                "is_emergency": True,
                "symptoms": symptoms,
                "message": "🚨 응급 상황입니다! 즉시 119에 전화하세요!",
                "action": "CALL_119_IMMEDIATELY",
                "profile": profile
            }
        )

    # 일반적인 신장질환 증상 정보
    symptom_info = {
        "피로": {
            "description": "신장 기능 저하로 인한 빈혈과 독소 축적",
            "management": "충분한 휴식, 의사와 상담하여 원인 확인"
        },
        "부종": {
            "description": "체액 저류로 인한 발목, 다리, 얼굴 부기",
            "management": "염분 제한, 이뇨제 처방 가능"
        },
        "소변변화": {
            "description": "소변량 감소, 거품뇨, 혈뇨 등",
            "management": "정확한 검사 필요, 수분 섭취 조절"
        },
        "가려움": {
            "description": "인과 독소 축적으로 인한 피부 가려움",
            "management": "보습제 사용, 인 제한 식이"
        },
        "식욕부진": {
            "description": "요독증으로 인한 입맛 저하",
            "management": "소량씩 자주 식사, 영양 상담"
        }
    }

    # 입력된 증상에 대한 정보 수집
    found_symptoms = {}
    for symptom in symptoms:
        for key, info in symptom_info.items():
            if key in symptom or symptom in key:
                found_symptoms[symptom] = info

    if found_symptoms:
        return ToolResult(
            data={
                "is_emergency": False,
                "symptoms": symptoms,
                "symptom_info": found_symptoms,
                "message": f"{len(found_symptoms)}개 증상에 대한 정보를 찾았습니다.",
                "disclaimer": "증상이 지속되면 의료진과 상담하세요.",
                "profile": profile
            }
        )
    else:
        return ToolResult(
            data={
                "is_emergency": False,
                "symptoms": symptoms,
                "message": "입력하신 증상에 대한 구체적인 정보를 찾을 수 없습니다.",
                "disclaimer": "증상이 있으시면 의료진과 상담하세요.",
                "profile": profile
            }
        )

@p.tool
async def check_emergency_keywords(context: ToolContext, text: str) -> ToolResult:
    """응급 키워드 감지"""
    emergency_keywords = ["흉통", "호흡곤란", "의식저하", "가슴통증", "숨막힘"]
    is_emergency = any(keyword in text for keyword in emergency_keywords)

    if is_emergency:
        return ToolResult(
            data={
                "is_emergency": True,
                "message": "⚠️ 응급 상황이 감지되었습니다. 즉시 119에 전화하세요!"
            }
        )

    return ToolResult(data={"is_emergency": False})

# ================== Guidelines ==================

async def add_safety_guidelines(agent: p.Agent) -> None:
    """의료 안전성 가이드라인 추가"""

    # CHK-001: No reassurance for symptoms
    # 증상에 대한 안심 금지 - 안심시키는 표현 사용 금지, 의료 전문가 상담 권장
    await agent.create_guideline(
        condition="User mentions symptoms",
        action="Never use reassuring phrases. Always recommend consulting medical professionals. Respond in Korean."
    )

    # CHK-002: Emergency priority
    # 응급 상황 우선 처리 - 즉시 119 전화 안내, 모든 대화 중단
    await agent.create_guideline(
        condition="Emergency keywords like chest pain, difficulty breathing, severe bleeding are mentioned",
        action="Immediately tell user to call 119. Provide clear instructions: 1) Call 119 now 2) Tell them your location 3) Describe symptoms accurately. Stop all other conversations. Respond in Korean.",
        tools=[check_emergency_keywords]
    )

    # CHK-005: No diagnosis or prescription
    # 진단 및 처방 금지 - 절대 진단/처방 금지, 의사 상담 안내
    await agent.create_guideline(
        condition="User asks for diagnosis or prescription",
        action="Never diagnose or prescribe. Tell them to consult a doctor. Respond in Korean."
    )

    # CHK-009: Disclaimer
    # 면책 조항 - 모든 응답 끝에 참고용 정보임을 명시
    await agent.create_guideline(
        condition="All medical responses",
        action="Add disclaimer at end: This information is for reference only and not medical advice. Respond in Korean."
    )


async def add_profile_guidelines(agent: p.Agent) -> None:
    """사용자 프로필별 가이드라인 - tag 기반 + search_medical_qa 활용"""

    # Researcher/Expert profile
    # 연구자/전문가 프로필: 학술적 언어, 전문 용어, search_medical_qa 필수 사용
    await agent.create_guideline(
        condition="The customer has the tag 'profile:researcher'",
        action="""You must use academic language and technical terminology.
        Focus on research findings and biological mechanisms.
        Provide detailed scientific explanations.
        When user asks medical questions, ALWAYS use search_medical_qa tool first.
        The tool searches 4 sources (QA data, papers, medical data, PubMed) and provides refinement_prompt.
        You should use the refinement_prompt to generate your response.
        You may reference up to 10 results based on the profile limit.
        Always maintain a professional and scholarly tone.
        Respond in Korean."""
    )

    # Patient profile
    # 질환자/경험자 프로필: 실용적 설명, search_medical_qa 필수 사용
    await agent.create_guideline(
        condition="The customer has the tag 'profile:patient'",
        action="""You must use practical and applicable explanations.
        Focus on daily life applications and self-care methods.
        Provide specific advice that patients can implement.
        When user asks medical questions, ALWAYS use search_medical_qa tool first.
        The tool searches 4 sources (QA data, papers, medical data, PubMed) and provides refinement_prompt.
        You should use the refinement_prompt to generate your response.
        You may reference up to 5 results based on the profile limit.
        Use an empathetic and supportive tone.
        Respond in Korean."""
    )

    # General/Novice profile
    # 일반인/노비스 프로필: 쉬운 설명, search_medical_qa 필수 사용
    await agent.create_guideline(
        condition="The customer has the tag 'profile:general'",
        action="""You must use simple and easy-to-understand explanations.
        Minimize technical terminology and use plain language.
        Focus on basic concepts and general understanding.
        When user asks medical questions, ALWAYS use search_medical_qa tool first.
        The tool searches 4 sources (QA data, papers, medical data, PubMed) and provides refinement_prompt.
        You should use the refinement_prompt to generate your response.
        You may reference up to 3 results based on the profile limit.
        Be clear and accessible in your communication.
        Respond in Korean."""
    )


async def add_blocking_guidelines(agent: p.Agent) -> None:
    """차단 가이드라인"""

    # Non-medical topic blocking
    # 비의료 주제 차단 - 정중하게 거절, CareGuide는 의료 관련 질문만 처리
    await agent.create_guideline(
        condition="User asks about non-medical topics",
        action="Politely decline. Tell them CareGuide only handles medical questions. Respond in Korean."
    )

    # Inappropriate request blocking
    # 부적절한 요청 차단 - 단호하게 거절, 대화 종료
    await agent.create_guideline(
        condition="User makes inappropriate requests",
        action="Firmly decline and end conversation. Respond in Korean."
    )


# ================== Journey ==================

async def create_medical_info_journey(agent: p.Agent) -> p.Journey:
    """의료 정보 제공 Journey 생성

    신장질환 정보를 체계적으로 제공하는 Journey입니다.
    사용자 프로필에 따라 맞춤형 정보를 제공합니다.
    """

    # Journey 생성
    journey = await agent.create_journey(
        title="CareGuide Medical Information Journey",
        description="Systematic medical information provision journey for kidney disease",
        conditions=["User asks for medical information", "User wants to know about kidney disease or medical topics"],
    )

    # Step 1: 초기 인사 및 프로필 확인
    # Initial greeting and profile confirmation
    t0 = await journey.initial_state.transition_to(
        chat_state="Greet user warmly. Confirm their profile type (researcher/patient/general). Ask what medical information they need. Respond in Korean."
    )

    # Step 2: 정보 수집 - 검색 도구 사용
    # Information gathering - use search tools
    t1 = await t0.target.transition_to(
        tool_state=search_medical_qa,
        condition="User asks a medical question that needs comprehensive information"
    )

    # Step 2-alt: CKD 단계 정보
    t2_alt = await t0.target.transition_to(
        tool_state=get_kidney_stage_info,
        condition="User asks specifically about CKD stages or GFR"
    )

    # Step 2-alt2: 증상 정보
    t3_alt = await t0.target.transition_to(
        tool_state=get_symptom_info,
        condition="User asks about specific symptoms"
    )

    # Step 3: 정보 제공 및 설명
    # Provide information based on search results
    t4 = await t1.target.transition_to(
        chat_state="""Use the refinement_prompt from search_medical_qa to generate your response.
        Provide information matching user's profile level:
        - Researchers: detailed technical info (max 10 results)
        - Patients: practical advice (max 5 results)
        - General users: simple explanations (max 3 results)
        Always add medical disclaimer at the end. Respond in Korean."""
    )

    # Step 3-alt: CKD 정보 설명
    t5 = await t2_alt.target.transition_to(
        chat_state="Explain the CKD stage information clearly based on user's profile level. Add disclaimer. Respond in Korean."
    )

    # Step 3-alt2: 증상 정보 설명
    t6 = await t3_alt.target.transition_to(
        chat_state="Explain the symptom information. If emergency detected, emphasize calling 119 immediately. Add disclaimer. Respond in Korean."
    )

    # Step 4: 추가 질문 확인
    # Check for additional questions - all paths converge here
    t7 = await t4.target.transition_to(
        chat_state="Ask if they need more information or have other questions. Offer to explain in more detail or provide related information. Respond in Korean."
    )
    await t5.target.transition_to(state=t7.target)
    await t6.target.transition_to(state=t7.target)

    # Step 4 -> Loop back to search if more questions
    await t7.target.transition_to(
        state=t1.target,
        condition="User has follow-up medical questions"
    )

    # Step 5: 마무리
    # Conclusion with medical disclaimer
    t8 = await t7.target.transition_to(
        chat_state="Summarize key points discussed. Remind them to consult healthcare providers for medical decisions. Thank them for using CareGuide. Respond in Korean.",
        condition="User has no more questions"
    )

    await t8.target.transition_to(state=p.END_JOURNEY)

    # 응급 상황 처리 가이드라인
    await journey.create_guideline(
        condition="Emergency symptoms are detected (흉통, 호흡곤란, 의식저하, etc.)",
        action="Immediately and assertively tell them to call 119. Do not provide other information until emergency is addressed."
    )

    return journey


async def main() -> None:
    # 데이터 로드
    print("📂 데이터 로딩 중...")
    load_all_data()

    # 프로필 선택
    profile = await select_profile()
    print(f"\n✅ '{profile}' 프로필이 선택되었습니다.\n")

    async with p.Server() as server:
        # Agent 생성
        # CareGuide 의료 정보 챗봇 - 4개 소스 통합 검색, 프로필 기반 맞춤 응답
        agent = await server.create_agent(
            name="CareGuide",
            description="""You are CareGuide, a medical information chatbot.
You classify user intent and provide ethical and accurate answers through appropriate questions and dialogue.
User profiles (researcher, patient, general public) are identified through customer.tags.
You help answer medical questions in a way that is understandable to the general public.
You protect patient privacy and exercise caution when handling sensitive medical information.
Your search_medical_qa tool searches 4 data sources (QA data, papers, medical data, PubMed) and provides comprehensive information.
Your answers must always be accurate and reliable, focusing on helping patients make their own decisions.
Always respond in Korean.""",
            composition_mode=p.CompositionMode.COMPOSITED
        )

        # 가이드라인 추가
        await add_safety_guidelines(agent)
        await add_profile_guidelines(agent)
        await add_blocking_guidelines(agent)

        # Journey 생성
        # Create medical information journey
        journey = await create_medical_info_journey(agent)

        # 프로필 태그 생성
        profile_tag = await server.create_tag(name=f"profile:{profile}")

        # Customer 생성 (선택된 프로필 태그 포함)
        time_uuid = uuid.uuid4()
        customer = await server.create_customer(
            name=f"user_{time_uuid}",
            tags=[profile_tag.id],
        )

        print(f"\n{'='*60}")
        print(f"CareGuide 서버 설정 완료!")
        print(f"{'='*60}")
        print(f"Agent ID: {agent.id}")
        print(f"Customer ID: {customer.id}")
        print(f"Journey ID: {journey.id}")
        print(f"프로필: {profile}")
        print(f"최대 결과 수: {PROFILE_LIMITS[profile]['max_results']}")
        print(f"검색 소스: QA 데이터 + 논문 데이터 + 의료 데이터 + PubMed")
        print(f"등록된 Tools: search_medical_qa (4개 소스 통합), get_kidney_stage_info, get_symptom_info")
        print(f"{'='*60}\n")
        print("서버가 실행 중입니다. Ctrl+C로 종료하세요.\n")

   



if __name__ == "__main__":
    
    asyncio.run(main())