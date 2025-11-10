# healthcare_v2.py
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

# ==================== 새로운 Import ====================
from search.hybrid_search import HybridSearchEngine

# ==================== 설정 ====================
PROFILE_LIMITS = {
    "researcher": {"max_results": 10, "detail_level": "high"},
    "patient": {"max_results": 5, "detail_level": "medium"},
    "general": {"max_results": 3, "detail_level": "low"}
}

# ==================== 전역 변수 (변경됨) ====================
# 기존: JSONL 파일 직접 로드
# 새로운 방식: 하이브리드 검색 엔진 사용
SEARCH_ENGINE = None


# ==================== 헬퍼 함수 ====================

async def get_profile(context: ToolContext) -> str:
    """프로필 추출 (customer.tags에서)"""
    try:
        customer = await context.get_customer()
        for tag_id in customer.tags:
            tag = await context.get_tag(tag_id)
            if tag.name.startswith("profile:"):
                return tag.name.split(":")[1]
    except:
        pass
    return "general"


def convert_objectid_to_str(data):
    """ObjectId를 문자열로 변환 (재귀적)"""
    if isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    else:
        return data


async def initialize_search_engine():
    """검색 엔진 초기화 (앱 시작 시 1회 실행)"""
    global SEARCH_ENGINE

    if SEARCH_ENGINE is None:
        print("🔍 하이브리드 검색 엔진 초기화 중...")
        SEARCH_ENGINE = HybridSearchEngine()
        await SEARCH_ENGINE.initialize()
        print("✅ 검색 엔진 준비 완료")


async def llm_refine_results_v2(query: str, raw_results: dict, profile: str) -> str:
    """LLM 정제 프롬프트 생성 - PubMed 상세 정보 포함
    
    Args:
        query: 사용자 질문
        raw_results: 하이브리드 검색 결과
        profile: 사용자 프로필 (researcher/patient/general)
    
    Returns:
        LLM에게 전달할 정제 프롬프트
    """
    
    # 프로필별 언어 수준
    detail_levels = {
        "researcher": "학술적이고 전문적인 용어를 사용하여 상세하게",
        "patient": "실용적이고 이해하기 쉽게, 일상생활에 적용 가능하도록",
        "general": "매우 쉽고 간단한 언어로, 전문 용어 최소화하여"
    }
    
    # 1. QA 데이터 요약
    qa_summary = ""
    if raw_results["qa_results"]:
        for i, item in enumerate(raw_results["qa_results"][:5], 1):
            question = item.get('question', '')[:100]
            answer = item.get('answer', '')[:200]
            qa_summary += f"{i}. Q: {question}\n   A: {answer}...\n\n"
    else:
        qa_summary = "결과 없음"
    
    # 2. 로컬 논문 데이터 요약
    paper_summary = ""
    if raw_results["paper_results"]:
        for i, item in enumerate(raw_results["paper_results"][:5], 1):
            title = item.get('title', '')[:150]
            paper_summary += f"{i}. {title}\n"
    else:
        paper_summary = "결과 없음"
    
    # 3. 의료 데이터 요약
    medical_summary = ""
    if raw_results["medical_results"]:
        for i, item in enumerate(raw_results["medical_results"][:3], 1):
            text = item.get('text', '')[:200]
            keywords = item.get('keyword', [])
            if isinstance(keywords, list):
                kw_str = ', '.join(keywords[:5])
            else:
                kw_str = str(keywords)[:50]
            medical_summary += f"{i}. [키워드: {kw_str}]\n   {text}...\n\n"
    else:
        medical_summary = "결과 없음"
    
    # 4. PubMed 실시간 검색 결과 (상세 정보 포함)
    pubmed_summary = ""
    if raw_results["pubmed_results"]:
        for i, paper in enumerate(raw_results["pubmed_results"][:3], 1):
            title = paper.get('title', 'N/A')
            authors = ', '.join(paper.get('authors', [])[:3])
            if len(paper.get('authors', [])) > 3:
                authors += " 외"
            journal = paper.get('journal', 'N/A')
            pub_date = paper.get('pub_date', 'N/A')
            pmid = paper.get('pmid', 'N/A')
            doi = paper.get('doi', 'N/A')
            abstract = paper.get('abstract', 'N/A')[:400]
            url = paper.get('url', 'N/A')
            
            pubmed_summary += f"""{i}. **제목**: {title}
   **저자**: {authors}
   **저널**: {journal} ({pub_date})
   **PMID**: {pmid}
   **DOI**: {doi}
   **초록**: {abstract}...
   **URL**: {url}

"""
    else:
        pubmed_summary = "결과 없음"
    
    # 5. 최종 프롬프트 생성
    prompt = f"""사용자 질문: "{query}"

다음은 **{raw_results['search_method'].upper()} 검색 방식**으로 수집한 원본 결과입니다:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 **1. QA 데이터베이스** ({len(raw_results['qa_results'])}개 결과)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{qa_summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 **2. 로컬 논문 데이터** ({len(raw_results['paper_results'])}개 결과)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{paper_summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 **3. 의료 특허/발명 데이터** ({len(raw_results['medical_results'])}개 결과)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{medical_summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔬 **4. PubMed 실시간 검색** ({len(raw_results['pubmed_results'])}개 결과)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{pubmed_summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

위 검색 결과를 바탕으로 사용자 질문에 대한 **정확하고 체계적인 답변**을 작성하세요.

**📋 답변 작성 요구사항:**

1. **사용자 프로필 고려**: {profile.upper()} 프로필
   - {detail_levels.get(profile, '')} 설명해주세요.

2. **정보 통합 및 정제**:
   - 중복된 정보는 제거하고 관련성 높은 정보만 선별
   - 4개 소스의 정보를 논리적으로 통합
   - 최신 정보(PubMed)와 기존 지식(로컬 데이터) 조화

3. **출처 명시** (필수):
   - "QA 데이터베이스에 따르면..."
   - "로컬 논문 데이터에서..."
   - "의료 특허 데이터에서는..."
   - "최근 PubMed 연구 (PMID: [pmid], [연도])에 의하면..."
   
4. **PubMed 논문 인용 형식**:
   - 제목과 PMID를 함께 언급
   - DOI가 있으면 포함
   - URL 제공으로 접근성 향상
   - 예시: "Smith et al. (2024)의 연구 (PMID: 12345678, DOI: 10.1038/xxx)에서는..."

5. **답변 구조**:
   - 서론: 질문 요약 및 검색 결과 개요
   - 본론: 주요 내용 (소스별 정보 통합)
   - 결론: 요약 및 실용적 조언
   - 참고문헌: 주요 출처 링크

6. **언어**: 한국어로 작성

7. **의료 면책 조항** (필수):
   마지막에 다음을 반드시 추가하세요:
   "⚠️ **의료 면책 조항**: 이 정보는 교육 및 참고 목적으로만 제공되며, 의학적 조언, 진단 또는 치료를 대체할 수 없습니다. 증상이 있거나 건강 문제가 있으시면 반드시 의료 전문가와 상담하세요."

답변을 시작하세요:"""
    
    return prompt


async def select_profile() -> str:
    """프로필 선택 - 입력 검증 강화"""
    print("\n" + "="*70)
    print("🏥 CareGuide Healthcare Chatbot v2.0")
    print("   Hybrid Search | MongoDB | Pinecone | PubMed Advanced API")
    print("="*70)
    print("\n사용자 프로필을 선택하세요:\n")
    print("1️⃣  연구자/전문가 (Researcher)")
    print("   - 학술적 정보, 전문 용어 사용")
    print("   - 최대 10개 결과 제공")
    print("   - 논문 초록, DOI, 인용 정보 포함\n")
    
    print("2️⃣  질환자/경험자 (Patient)")
    print("   - 실용적 정보, 일상 적용 가능")
    print("   - 최대 5개 결과 제공")
    print("   - 치료법, 자가관리 중심\n")
    
    print("3️⃣  일반인/노비스 (General)")
    print("   - 간단한 설명, 쉬운 언어")
    print("   - 최대 3개 결과 제공")
    print("   - 기본 개념 이해 중심\n")
    
    print("="*70)

    mapping = {"1": "researcher", "2": "patient", "3": "general"}

    while True:
        choice = input("\n선택하세요 (1/2/3): ").strip()
        if choice in mapping:
            selected = mapping[choice]
            profile_names = {
                "researcher": "연구자/전문가",
                "patient": "질환자/경험자",
                "general": "일반인/노비스"
            }
            print(f"\n✅ '{profile_names[selected]}' 프로필이 선택되었습니다.")
            return selected
        print("❌ 잘못된 입력입니다. 1, 2, 3 중 하나를 선택하세요.")


# ==================== Medical Information Tools ====================

@p.tool
async def search_medical_qa(context: ToolContext, query: str) -> ToolResult:
    """의료 정보 통합 검색 도구
    
    **검색 방식**:
    1. MongoDB 텍스트 검색 (키워드 매칭)
    2. Pinecone 벡터 검색 (의미론적 유사도)
    3. 로컬 논문 데이터베이스
    4. PubMed API 실시간 검색 (초록, 저자, DOI 포함)
    
    **하이브리드 점수 계산**:
    - 최종 점수 = 키워드 점수 × 0.4 + 시맨틱 점수 × 0.6
    
    Args:
        context: ToolContext (프로필 정보 포함)
        query: 사용자 질문
    
    Returns:
        ToolResult with raw_results and refinement_prompt
    """
    try:
        # 검색 엔진 초기화
        await initialize_search_engine()
        
        # 프로필 추출
        profile = await get_profile(context)
        max_results = PROFILE_LIMITS[profile]["max_results"]
        
        print(f"\n🔍 [{profile.upper()}] 프로필로 '{query}' 검색 중...")
        
        # 하이브리드 검색 실행
        raw_results = await SEARCH_ENGINE.search_all_sources(
            query=query,
            max_per_source=max_results,
            use_semantic=True,  # 시맨틱 검색 활성화
            use_pubmed=True     # PubMed 고급 검색 활성화
        )

        # ObjectId를 문자열로 변환 (직렬화 가능하도록)
        raw_results = convert_objectid_to_str(raw_results)

        # LLM 정제용 프롬프트 생성
        refinement_prompt = await llm_refine_results_v2(query, raw_results, profile)
        
        # 총 결과 수
        total_count = sum([
            len(raw_results["qa_results"]),
            len(raw_results["paper_results"]),
            len(raw_results["medical_results"]),
            len(raw_results["pubmed_results"])
        ])
        
        print(f"✅ 검색 완료: 총 {total_count}개 결과")
        
        return ToolResult(
            data={
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
                "message": f"""✅ 총 {total_count}개 결과를 {raw_results['search_method'].upper()} 검색으로 찾았습니다.

📊 소스별 결과:
  • QA 데이터: {len(raw_results['qa_results'])}개
  • 로컬 논문: {len(raw_results['paper_results'])}개
  • 의료 특허: {len(raw_results['medical_results'])}개
  • PubMed 실시간: {len(raw_results['pubmed_results'])}개

🔬 검색 방식: {raw_results['search_method'].upper()}
  {'- 키워드 매칭 (40%) + 의미론적 유사도 (60%)' if raw_results['search_method'] == 'hybrid' else '- 키워드 매칭만 사용'}"""
            }
        )
    
    except Exception as e:
        print(f"❌ 검색 오류: {e}")
        return ToolResult(
            data={
                "error": str(e),
                "message": f"⚠️ 검색 중 오류가 발생했습니다: {e}\n잠시 후 다시 시도해주세요."
            }
        )


@p.tool
async def get_kidney_stage_info(
    context: ToolContext, 
    gfr: Optional[float] = None, 
    stage: Optional[int] = None
) -> ToolResult:
    """신장질환(CKD) 단계별 정보 제공 도구
    
    만성신장질환(Chronic Kidney Disease)의 1-5단계에 대한 상세 정보를 제공합니다.
    GFR(사구체여과율) 수치 또는 단계 번호로 조회 가능합니다.
    
    Args:
        context: ToolContext
        gfr: GFR 수치 (ml/min/1.73m²)
        stage: CKD 단계 (1-5)
    
    Returns:
        단계별 상세 정보 (설명, 관리법, 식이요법, 검진 주기)
    """
    # 프로필 추출
    profile = await get_profile(context)

    # CKD 단계별 정보 정의
    kidney_stages = {
        1: {
            "stage": "1단계 (정상 또는 높은 GFR)",
            "gfr_range": "≥ 90",
            "description": "신장 기능은 정상이나 단백뇨 등 신장 손상의 증거가 있음",
            "symptoms": "대부분 증상 없음",
            "management": [
                "원인 질환(당뇨, 고혈압) 철저한 관리",
                "정기적인 혈압 측정 및 조절",
                "혈당 조절 (당뇨병 환자)",
                "금연 및 적정 체중 유지"
            ],
            "dietary": [
                "균형 잡힌 건강식",
                "염분 제한 (하루 5g 이하)",
                "적절한 수분 섭취",
                "과도한 단백질 섭취 자제"
            ],
            "monitoring": "6-12개월마다 정기 검진",
            "prognosis": "적절한 관리로 진행을 늦출 수 있음"
        },
        2: {
            "stage": "2단계 (경도 감소)",
            "gfr_range": "60-89",
            "description": "경도의 신장 기능 저하",
            "symptoms": "대부분 증상 없음, 피로감 가능",
            "management": [
                "1단계 관리법 유지",
                "신장 기능 보호를 위한 약물 치료",
                "신독성 약물 피하기 (NSAIDs 등)",
                "정기적인 신장 기능 검사"
            ],
            "dietary": [
                "저염식 (하루 5g 이하)",
                "적절한 수분 섭취",
                "단백질 적당량 유지 (0.8g/kg/day)",
                "칼륨, 인 제한 고려"
            ],
            "monitoring": "3-6개월마다 정기 검진",
            "prognosis": "진행 속도를 크게 늦출 수 있음"
        },
        3: {
            "stage": "3단계 (중등도 감소)",
            "gfr_range": "30-59 (3a: 45-59, 3b: 30-44)",
            "description": "중등도의 신장 기능 저하",
            "symptoms": "피로, 부종, 식욕부진, 수면장애 가능",
            "management": [
                "신장내과 전문의 정기 진료",
                "합병증 예방 (빈혈, 골질환)",
                "약물 용량 조절 필요",
                "ACE 억제제 또는 ARB 고려",
                "인 결합제 사용 가능"
            ],
            "dietary": [
                "엄격한 저염식 (하루 3-5g)",
                "저칼륨 식이 (바나나, 오렌지 제한)",
                "저인 식이 (유제품, 견과류 제한)",
                "단백질 제한 (0.6-0.8g/kg/day)",
                "수분 섭취 조절"
            ],
            "monitoring": "3개월마다 정기 검진",
            "prognosis": "적극적 관리로 진행 지연 가능, 투석 준비 고려 시작"
        },
        4: {
            "stage": "4단계 (심한 감소)",
            "gfr_range": "15-29",
            "description": "심한 신장 기능 저하, 말기신부전에 가까움",
            "symptoms": "피로, 부종, 식욕부진, 구역, 가려움, 호흡곤란, 수면장애",
            "management": [
                "신장내과 전문의 밀착 관리",
                "투석 또는 신장 이식 준비",
                "동정맥루(투석 혈관) 조성 고려",
                "빈혈 치료 (EPO 주사)",
                "골질환 예방 (비타민 D, 칼슘)",
                "심혈관 질환 예방"
            ],
            "dietary": [
                "매우 엄격한 식이 제한",
                "영양사 전문 상담 필수",
                "저염, 저칼륨, 저인 식이",
                "단백질 엄격 제한 (0.6g/kg/day)",
                "수분 제한 (부종 시)"
            ],
            "monitoring": "1-2개월마다 정기 검진",
            "prognosis": "투석 또는 이식 준비 필요, 삶의 질 관리 중요"
        },
        5: {
            "stage": "5단계 (신부전)",
            "gfr_range": "< 15 또는 투석 중",
            "description": "말기 신부전, 신대체요법 필요",
            "symptoms": "심한 피로, 전신 부종, 구토, 호흡곤란, 의식 변화 가능",
            "management": [
                "투석 시작 (혈액투석 또는 복막투석)",
                "신장 이식 대기 또는 진행",
                "합병증 적극 관리",
                "빈혈, 골질환, 심혈관 질환 치료",
                "정신건강 지원 (우울증 관리)"
            ],
            "dietary": [
                "투석 종류에 따른 식이 조절",
                "혈액투석: 저칼륨, 저인, 수분 엄격 제한",
                "복막투석: 상대적으로 식이 제한 완화",
                "고단백 식이 (투석으로 손실 보충)",
                "영양 상태 정기 평가"
            ],
            "monitoring": "매주 또는 매월 정기 검진 (투석 중)",
            "prognosis": "투석으로 생명 유지 가능, 이식 시 예후 개선"
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
        
        message = f"""🏥 **CKD {stage_info['stage']}** 정보

📊 **GFR 범위**: {stage_info['gfr_range']} ml/min/1.73m²
{'📈 **귀하의 GFR**: ' + str(gfr) + ' ml/min/1.73m²' if gfr else ''}

📝 **설명**: {stage_info['description']}

🩺 **주요 증상**: {stage_info['symptoms']}

💊 **관리 방법**:
{chr(10).join([f'  • {item}' for item in stage_info['management']])}

🍽️ **식이요법**:
{chr(10).join([f'  • {item}' for item in stage_info['dietary']])}

🔍 **검진 주기**: {stage_info['monitoring']}

🎯 **예후**: {stage_info['prognosis']}
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
                "error": "유효한 단계 또는 GFR 수치를 입력해주세요.",
                "valid_stages": "1-5",
                "valid_gfr": "0 이상의 숫자",
                "profile": profile,
                "message": """❌ CKD 단계 정보를 찾을 수 없습니다.

📋 **사용 방법**:
  • GFR 수치를 입력하세요 (예: gfr=45)
  • 또는 단계 번호를 입력하세요 (예: stage=3)

📌 **CKD 단계 기준**:
  • 1단계: GFR ≥ 90
  • 2단계: GFR 60-89
  • 3단계: GFR 30-59
  • 4단계: GFR 15-29
  • 5단계: GFR < 15 (말기신부전)
"""
            }
        )


@p.tool
async def get_symptom_info(context: ToolContext, symptoms: str) -> ToolResult:
    """신장질환 관련 증상 정보 제공 도구
    
    신장질환과 관련된 증상들에 대한 정보를 제공합니다.
    응급 증상을 감지하면 즉시 119 안내를 합니다.
    
    Args:
        context: ToolContext
        symptoms: 증상 문자열 (콤마로 구분, 예: "피로, 부종")

    Returns:
        증상별 정보 및 관리 방법
    """
    # 프로필 추출
    profile = await get_profile(context)

    # 문자열을 리스트로 변환
    symptom_list = [s.strip() for s in symptoms.split(',')]

    # 응급 증상 체크
    emergency_symptoms = [
        "흉통", "가슴통증", "호흡곤란", "숨막힘", "의식저하",
        "의식불명", "심한 부종", "전신 부종", "혈뇨", "심한 두통"
    ]
    found_emergency = [s for s in symptom_list if any(e in s for e in emergency_symptoms)]

    if found_emergency:
        return ToolResult(
            data={
                "is_emergency": True,
                "symptoms": symptom_list,
                "emergency_symptoms": found_emergency,
                "message": f"""🚨 **응급 상황 감지!**

다음 증상은 응급 상황일 수 있습니다:
{chr(10).join([f'  • {s}' for s in found_emergency])}

⚠️ **즉시 119에 전화하세요!**

📞 **응급 전화 안내**:
1. 119에 전화하세요
2. 정확한 위치를 알려주세요
3. 증상을 상세히 설명하세요
4. 구급대원 도착까지 안전한 자세 유지

⏱️ 지체하지 말고 즉시 조치하세요!""",
                "action": "CALL_119_IMMEDIATELY",
                "profile": profile
            }
        )

    # 일반적인 신장질환 증상 정보
    symptom_database = {
        "피로": {
            "description": "신장 기능 저하로 인한 빈혈과 독소 축적으로 발생",
            "causes": [
                "빈혈 (적혈구 생성 감소)",
                "요독소 축적",
                "영양 불균형",
                "수면 장애"
            ],
            "management": [
                "충분한 휴식 취하기",
                "적절한 영양 섭취",
                "빈혈 검사 및 치료 (필요시 EPO 주사)",
                "규칙적인 가벼운 운동"
            ],
            "severity": "경도-중등도"
        },
        "부종": {
            "description": "체액 저류로 인한 발목, 다리, 얼굴, 손 등의 부기",
            "causes": [
                "신장의 수분·염분 배출 기능 저하",
                "혈중 알부민 감소",
                "심부전 동반 가능"
            ],
            "management": [
                "염분 섭취 제한 (하루 5g 이하)",
                "수분 섭취 조절 (의사 지시 따름)",
                "다리 올리고 휴식",
                "이뇨제 처방 가능 (의사 상담)"
            ],
            "severity": "중등도-심함"
        },
        "소변변화": {
            "description": "소변량 감소, 거품뇨, 혈뇨, 야간뇨 등",
            "causes": [
                "사구체 손상 (단백뇨)",
                "신장 여과 기능 저하",
                "요로 감염 가능성"
            ],
            "management": [
                "소변 검사 (요단백, 혈뇨 확인)",
                "정확한 진단을 위한 검사 필요",
                "수분 섭취 조절",
                "배뇨 일지 작성"
            ],
            "severity": "중등도-심함"
        },
        "가려움": {
            "description": "인(phosphorus)과 독소 축적으로 인한 피부 가려움",
            "causes": [
                "혈중 인 수치 상승",
                "요독소 축적",
                "피부 건조"
            ],
            "management": [
                "보습제 자주 바르기",
                "저인 식이 (유제품, 견과류 제한)",
                "인 결합제 복용 (처방 시)",
                "미지근한 물로 샤워"
            ],
            "severity": "경도-중등도"
        },
        "식욕부진": {
            "description": "요독증으로 인한 입맛 저하 및 구역감",
            "causes": [
                "요독소 축적",
                "위장관 기능 저하",
                "미각 변화"
            ],
            "management": [
                "소량씩 자주 식사",
                "좋아하는 음식 위주로 섭취",
                "영양사 상담 (영양 상태 평가)",
                "구역 방지제 처방 가능"
            ],
            "severity": "중등도"
        },
        "고혈압": {
            "description": "신장 기능 저하로 인한 혈압 상승",
            "causes": [
                "체액 과다",
                "레닌-안지오텐신 시스템 활성화",
                "동맥 경화"
            ],
            "management": [
                "정기적인 혈압 측정",
                "항고혈압제 복용",
                "염분 제한",
                "스트레스 관리"
            ],
            "severity": "중등도-심함"
        },
        "호흡곤란": {
            "description": "폐부종 또는 빈혈로 인한 숨참",
            "causes": [
                "체액 과다 (폐부종)",
                "빈혈",
                "심부전 동반"
            ],
            "management": [
                "즉시 의료진 상담",
                "수분 제한",
                "이뇨제 조절",
                "빈혈 치료"
            ],
            "severity": "심함 (응급 가능)"
        }
    }

    # 입력된 증상에 대한 정보 수집
    found_symptoms = {}
    not_found = []

    for symptom in symptom_list:
        matched = False
        for key, info in symptom_database.items():
            if key in symptom or symptom in key:
                found_symptoms[symptom] = info
                matched = True
                break
        if not matched:
            not_found.append(symptom)

    if found_symptoms:
        # 증상 정보 포맷팅
        symptom_details = ""
        for symptom, info in found_symptoms.items():
            symptom_details += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🩺 **{symptom}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 **설명**: {info['description']}

🔍 **원인**:
{chr(10).join([f'  • {cause}' for cause in info['causes']])}

💊 **관리 방법**:
{chr(10).join([f'  • {mgmt}' for mgmt in info['management']])}

⚠️ **심각도**: {info['severity']}
"""
        
        message = f"""✅ {len(found_symptoms)}개 증상에 대한 정보를 찾았습니다.

{symptom_details}

{"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" if not_found else ""}
{"❓ **추가 정보가 없는 증상**: " + ", ".join(not_found) if not_found else ""}

⚠️ **면책 조항**: 
이 정보는 교육 목적으로만 제공됩니다. 증상이 지속되거나 악화되면 반드시 의료 전문가와 상담하세요.
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
                "message": f"""❓ 입력하신 증상에 대한 구체적인 정보를 찾을 수 없습니다.

📋 **입력한 증상**: {', '.join(symptom_list)}

💡 **도움말**:
  • 일반적인 신장질환 증상: 피로, 부종, 소변변화, 가려움, 식욕부진
  • 더 구체적인 증상명을 사용해보세요
  • 또는 일반 의료 정보 검색을 이용해주세요

⚠️ **주의**: 증상이 있으시면 반드시 의료 전문가와 상담하세요.""",
                "profile": profile
            }
        )


@p.tool
async def check_emergency_keywords(context: ToolContext, text: str) -> ToolResult:
    """응급 키워드 감지 도구
    
    사용자 입력에서 응급 상황을 나타내는 키워드를 감지합니다.
    
    Args:
        context: ToolContext
        text: 검사할 텍스트
    
    Returns:
        응급 여부 및 안내 메시지
    """
    emergency_keywords = [
        "흉통", "가슴통증", "호흡곤란", "숨막힘", "의식저하",
        "의식불명", "심한 부종", "전신 부종", "실신", "쓰러짐"
    ]
    
    found_keywords = [kw for kw in emergency_keywords if kw in text]
    is_emergency = len(found_keywords) > 0

    if is_emergency:
        return ToolResult(
            data={
                "is_emergency": True,
                "found_keywords": found_keywords,
                "message": f"""🚨 **응급 상황 감지!**

다음 응급 키워드가 감지되었습니다:
{chr(10).join([f'  • {kw}' for kw in found_keywords])}

⚠️ **즉시 119에 전화하세요!**

📞 **응급 전화 순서**:
1. 119에 전화
2. 위치 알림
3. 증상 설명
4. 구급대원 지시 따름

⏱️ 시간이 생명입니다!"""
            }
        )

    return ToolResult(
        data={
            "is_emergency": False,
            "message": "응급 상황이 감지되지 않았습니다."
        }
    )


# ==================== Guidelines ====================

async def add_safety_guidelines(agent: p.Agent) -> None:
    """의료 안전성 가이드라인 추가"""

    # CHK-001: No reassurance for symptoms
    await agent.create_guideline(
        condition="User mentions symptoms",
        action="Never use reassuring phrases like '걱정하지 마세요' or '괜찮을 겁니다'. Always recommend consulting medical professionals. Respond in Korean."
    )

    # CHK-002: Emergency priority
    await agent.create_guideline(
        condition="Emergency keywords like chest pain (흉통), difficulty breathing (호흡곤란), severe bleeding (심한 출혈), unconsciousness (의식저하) are mentioned",
        action="Immediately tell user to call 119. Provide clear instructions: 1) Call 119 now 2) Tell them your exact location 3) Describe symptoms accurately 4) Follow dispatcher's instructions. Stop all other conversations. Use strong, urgent language. Respond in Korean.",
        tools=[check_emergency_keywords]
    )

    # CHK-005: No diagnosis or prescription
    await agent.create_guideline(
        condition="User asks for diagnosis (진단) or prescription (처방)",
        action="Never provide diagnosis or prescribe medications. Clearly state: '저는 의료 전문가가 아니며, 진단이나 처방을 할 수 없습니다. 반드시 의사와 상담하세요.' Respond in Korean."
    )

    # CHK-009: Disclaimer
    await agent.create_guideline(
        condition="All medical responses",
        action="Add disclaimer at end: '⚠️ 이 정보는 교육 및 참고용이며 의학적 조언을 대체할 수 없습니다. 증상이 있으시면 의료진과 상담하세요.' Respond in Korean."
    )


async def add_profile_guidelines(agent: p.Agent) -> None:
    """사용자 프로필별 가이드라인"""

    # Researcher profile
    await agent.create_guideline(
        condition="The customer has the tag 'profile:researcher'",
        action="""You must use academic language and technical terminology.
        Focus on research findings, biological mechanisms, and evidence-based information.
        Provide detailed scientific explanations with specific data when available.
        
        When user asks medical questions, ALWAYS use search_medical_qa tool first.
        The tool provides refinement_prompt from 4 sources (QA, papers, medical data, PubMed).
        Use the refinement_prompt to generate comprehensive, research-oriented responses.
        
        You may reference up to 10 results per source based on the profile limit.
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
        The tool provides refinement_prompt from 4 sources (QA, papers, medical data, PubMed).
        Use the refinement_prompt to generate practical, patient-friendly responses.
        
        You may reference up to 5 results per source based on the profile limit.
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
        The tool provides refinement_prompt from 4 sources (QA, papers, medical data, PubMed).
        Use the refinement_prompt to generate simple, accessible responses.
        
        You may reference up to 3 results per source based on the profile limit.
        Avoid medical jargon unless absolutely necessary (then explain it).
        Break down information into small, digestible parts.
        
        Always respond in Korean.""",
        tools=[search_medical_qa]
    )


async def add_blocking_guidelines(agent: p.Agent) -> None:
    """차단 가이드라인"""

    # Non-medical topic blocking
    await agent.create_guideline(
        condition="User asks about non-medical topics (sports, politics, entertainment, etc.)",
        action="Politely decline: '죄송합니다. CareGuide는 의료 및 건강 관련 질문만 처리할 수 있습니다. 의료 관련 질문이 있으시면 도와드리겠습니다.' Redirect to medical topics. Respond in Korean."
    )

    # Inappropriate request blocking
    await agent.create_guideline(
        condition="User makes inappropriate, offensive, or harmful requests",
        action="Firmly decline: '부적절한 요청은 처리할 수 없습니다. 의료 정보가 필요하시면 적절한 질문을 해주세요.' If repeated, end conversation. Respond in Korean."
    )


# ==================== Journey ====================

async def create_medical_info_journey(agent: p.Agent) -> p.Journey:
    """의료 정보 제공 Journey 생성"""

    journey = await agent.create_journey(
        title="CareGuide Medical Information Journey v2",
        description="Systematic medical information provision journey with hybrid search",
        conditions=[
            "User asks for medical information",
            "User wants to know about kidney disease or medical topics",
            "User has health-related questions"
        ],
    )

    # Step 1: 초기 인사 및 프로필 확인
    t0 = await journey.initial_state.transition_to(
        chat_state="""Greet user warmly in Korean. 
        Confirm their profile type (researcher/patient/general).
        Ask what specific medical information they need.
        Mention that you use hybrid search (keyword + semantic) across 4 data sources including real-time PubMed.
        Be friendly and professional."""
    )

    # Step 2: 정보 수집 - 하이브리드 검색
    t1 = await t0.target.transition_to(
        tool_state=search_medical_qa,
        condition="User asks a medical question that needs comprehensive information from multiple sources"
    )

    # Step 2-alt: CKD 단계 정보
    t2_alt = await t0.target.transition_to(
        tool_state=get_kidney_stage_info,
        condition="User asks specifically about CKD stages, GFR values, or kidney disease stages"
    )

    # Step 2-alt2: 증상 정보
    t3_alt = await t0.target.transition_to(
        tool_state=get_symptom_info,
        condition="User describes specific symptoms or asks about symptom management"
    )

    # Step 3: 정보 제공 및 설명 (하이브리드 검색 결과 기반)
    t4 = await t1.target.transition_to(
        chat_state="""Use the refinement_prompt from search_medical_qa to generate your response in Korean.
        
        Structure your response based on user profile:
        - Researchers: Detailed technical info with citations (max 10 results per source)
        - Patients: Practical advice with empathy (max 5 results per source)
        - General users: Simple explanations (max 3 results per source)
        
        Important:
        1. Integrate information from all 4 sources (QA, local papers, medical data, PubMed)
        2. Prioritize recent PubMed results when available
        3. Cite sources properly (e.g., "PubMed 연구 (PMID: 12345678, 2024)에 따르면...")
        4. Provide DOIs and URLs for PubMed papers
        5. Always add medical disclaimer at the end
        
        Respond in Korean."""
    )

    # Step 3-alt: CKD 정보 설명
    t5 = await t2_alt.target.transition_to(
        chat_state="""Explain the CKD stage information clearly based on user's profile level.
        Use the structured information provided by the tool.
        Add practical advice and recommendations.
        Always include medical disclaimer.
        Respond in Korean."""
    )

    # Step 3-alt2: 증상 정보 설명
    t6 = await t3_alt.target.transition_to(
        chat_state="""Explain the symptom information clearly.
        If emergency detected, strongly emphasize calling 119 immediately.
        Provide management tips for non-emergency symptoms.
        Add medical disclaimer.
        Respond in Korean."""
    )

    # Step 4: 추가 질문 확인 (모든 경로 수렴)
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

    # Step 5: 마무리
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

    # 응급 상황 처리 가이드라인 (Journey-level)
    await journey.create_guideline(
        condition="Emergency symptoms are detected (흉통, 호흡곤란, 의식저하, 심한 부종, etc.)",
        action="""Immediately and assertively tell them to call 119 in Korean.
        Use urgent, clear language:
        '🚨 응급 상황입니다! 즉시 119에 전화하세요!'
        
        Provide step-by-step instructions:
        1. 119 전화
        2. 위치 알림
        3. 증상 설명
        4. 구급대원 지시 따름
        
        Do not provide other information until emergency is addressed.
        Prioritize user safety above all."""
    )

    return journey


# ==================== Main Function ====================

async def main() -> None:
    """메인 함수 - 서버 초기화 및 실행"""
    
    print("\n" + "="*70)
    print("🏥 CareGuide Healthcare Chatbot v2.0 초기화 중...")
    print("="*70)
    
    # 검색 엔진 초기화
    print("\n[1/4] 하이브리드 검색 엔진 초기화...")
    await initialize_search_engine()
    
    # 프로필 선택
    print("\n[2/4] 사용자 프로필 선택...")
    profile = await select_profile()
    
    print(f"\n[3/4] Parlant Server 설정 중...")
    
    async with p.Server() as server:
        # Agent 생성
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
- Detect and prioritize emergency situations (call 119 immediately)
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
        
        print("  ✅ Agent 생성 완료")
        
        # 가이드라인 추가
        print("  🔧 안전성 가이드라인 추가 중...")
        await add_safety_guidelines(agent)
        
        print("  🔧 프로필별 가이드라인 추가 중...")
        await add_profile_guidelines(agent)
        
        print("  🔧 차단 가이드라인 추가 중...")
        await add_blocking_guidelines(agent)
        
        # Journey 생성
        print("  🗺️ Medical Information Journey 생성 중...")
        journey = await create_medical_info_journey(agent)
        
        # 프로필 태그 생성
        profile_tag = await server.create_tag(name=f"profile:{profile}")
        
        # Customer 생성
        time_uuid = uuid.uuid4()
        customer = await server.create_customer(
            name=f"user_{time_uuid}",
            tags=[profile_tag.id],
        )
        
        print("\n[4/4] 최종 설정 완료!\n")
        
        # 서버 정보 출력
        print("="*70)
        print("🎉 CareGuide v2.0 서버가 성공적으로 시작되었습니다!")
        print("="*70)
        print(f"\n📋 **서버 정보**:")
        print(f"  • Agent ID: {agent.id}")
        print(f"  • Customer ID: {customer.id}")
        print(f"  • Journey ID: {journey.id}")
        
        print(f"\n👤 **사용자 프로필**:")
        profile_display = {
            "researcher": "연구자/전문가",
            "patient": "질환자/경험자",
            "general": "일반인/노비스"
        }
        print(f"  • 선택된 프로필: {profile_display[profile]}")
        print(f"  • 최대 결과 수: {PROFILE_LIMITS[profile]['max_results']}개/소스")
        print(f"  • 상세 수준: {PROFILE_LIMITS[profile]['detail_level']}")
        
        print(f"\n🔍 **검색 시스템**:")
        print(f"  • 검색 방식: 하이브리드 (키워드 40% + 시맨틱 60%)")
        print(f"  • 데이터 소스:")
        print(f"    1. MongoDB - 구조화된 데이터 (텍스트 인덱싱)")
        print(f"    2. Pinecone - 벡터 데이터베이스 (의미론적 검색)")
        print(f"    3. 로컬 논문 - 풍부한 메타데이터")
        print(f"    4. PubMed API - 실시간 (초록, 저자, DOI, MeSH)")
        
        print(f"\n🛠️ **등록된 도구**:")
        print(f"  • search_medical_qa - 하이브리드 통합 검색")
        print(f"  • get_kidney_stage_info - CKD 단계별 정보")
        print(f"  • get_symptom_info - 증상 정보 및 응급 감지")
        print(f"  • check_emergency_keywords - 응급 키워드 감지")
        
        print(f"\n⚠️ **안전 기능**:")
        print(f"  • 응급 상황 자동 감지 (119 안내)")
        print(f"  • 진단/처방 차단")
        print(f"  • 의료 면책 조항 자동 추가")
        print(f"  • 부적절한 요청 차단")
        
        print("\n" + "="*70)
        print("🟢 서버가 실행 중입니다.")
        print("   Ctrl+C를 눌러 종료할 수 있습니다.")
        print("="*70 + "\n")
        


if __name__ == "__main__":
        asyncio.run(main())

