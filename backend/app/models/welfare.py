"""
Welfare Program Pydantic Models

community.py, user.py 패턴 적용
공공데이터 기반 복지 프로그램 모델
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


# ============================================================================
# Enum 정의
# ============================================================================

class WelfareCategory(str, Enum):
    """복지 프로그램 카테고리"""
    SANGJUNG_SPECIAL = "sangjung_special"  # 산정특례
    DISABILITY = "disability"              # 장애인 복지
    MEDICAL_AID = "medical_aid"            # 의료비 지원
    TRANSPLANT = "transplant"              # 신장이식 지원
    TRANSPORT = "transport"                # 교통 및 생활 지원


# ============================================================================
# Nested 모델들
# ============================================================================

class WelfareBenefits(BaseModel):
    """복지 혜택 모델"""
    copay_reduction: Optional[str] = Field(None, description="본인부담금 감면율 (e.g., '90%')")
    copay_rate: Optional[str] = Field(None, description="본인부담률 (e.g., '10%')")
    original_copay: Optional[str] = Field(None, description="원래 본인부담률 (e.g., '20-60%')")
    max_monthly_cap: Optional[int] = Field(None, description="월 최대 본인부담금 (원)")
    max_support: Optional[str] = Field(None, description="최대 지원 금액 (e.g., '최대 2,000만원')")
    monthly_amount: Optional[int | Dict] = Field(None, description="월 지원 금액 (원) or dict")
    coverage_items: Optional[List[str]] = Field(None, description="적용 항목")
    benefits_list: Optional[List[str]] = Field(None, description="혜택 목록")
    exclusions: Optional[List[str]] = Field(None, description="제외 항목")
    disability_grade: Optional[Dict] = Field(None, description="장애 등급 정보")
    support_type: Optional[str] = Field(None, description="지원 유형")

    class Config:
        json_schema_extra = {
            "example": {
                "copay_reduction": "90%",
                "copay_rate": "10%",
                "coverage_items": ["외래진료", "검사", "약제"]
            }
        }


class WelfareEligibility(BaseModel):
    """자격 요건 모델"""
    disease_code: Optional[str] = Field(None, description="질병 코드 (e.g., 'V001')")
    ckd_stage: Optional[List[int]] = Field(None, description="CKD 단계 (e.g., [3, 4, 5])")
    eGFR: Optional[str] = Field(None, description="eGFR 기준 (e.g., '60 미만')")
    dialysis_type: Optional[str] = Field(None, description="투석 유형 (hemodialysis, peritoneal)")
    dialysis_duration: Optional[str] = Field(None, description="투석 기간 (e.g., '3개월 이상')")
    dialysis_frequency: Optional[str] = Field(None, description="투석 빈도 (e.g., '주 2-3회')")
    dialysis_required: Optional[bool] = Field(None, description="투석 필요 여부")
    income: Optional[str] = Field(None, description="소득 기준 (e.g., '기준중위소득 50% 이하')")
    transplant_candidate: Optional[bool] = Field(None, description="이식 대기자 여부")
    transplant_status: Optional[str] = Field(None, description="이식 상태")
    transplant_type: Optional[str] = Field(None, description="이식 유형")
    age: Optional[str] = Field(None, description="연령 요건")
    disability_registration: Optional[bool] = Field(None, description="장애인 등록 필요 여부")
    disability_level: Optional[str] = Field(None, description="장애 정도")
    situation: Optional[str] = Field(None, description="상황 요건")
    description: str = Field(..., description="자격 요건 설명")

    class Config:
        json_schema_extra = {
            "example": {
                "disease_code": "V001",
                "ckd_stage": [3, 4, 5],
                "description": "만성콩팥병 3기 이상 또는 eGFR 60 미만"
            }
        }


class WelfareApplication(BaseModel):
    """신청 방법 모델"""
    required_documents: List[str] = Field(..., description="필요 서류 목록")
    application_place: str = Field(..., description="신청 장소")
    application_method: Optional[List[str]] = Field(None, description="신청 방법 (방문, 온라인 등)")
    processing_time: str = Field(..., description="처리 기간 (e.g., '7-14일')")
    validity_period: str = Field(..., description="유효 기간 (e.g., '5년')")
    renewal: Optional[str] = Field(None, description="갱신 방법")

    class Config:
        json_schema_extra = {
            "example": {
                "required_documents": ["신청서", "진단서", "신분증"],
                "application_place": "국민건강보험공단 지사",
                "processing_time": "7-14일",
                "validity_period": "5년"
            }
        }


class WelfareContact(BaseModel):
    """연락처 정보 모델"""
    phone: str = Field(..., description="전화번호")
    organization: Optional[str] = Field(None, description="담당 기관")
    website: Optional[str] = Field(None, description="웹사이트 URL")
    online_application: Optional[bool] = Field(None, description="온라인 신청 가능 여부")
    online_url: Optional[str] = Field(None, description="온라인 신청 URL")

    class Config:
        json_schema_extra = {
            "example": {
                "phone": "1577-1000",
                "organization": "국민건강보험공단",
                "website": "https://www.nhis.or.kr",
                "online_application": True
            }
        }


# ============================================================================
# Main 모델
# ============================================================================

class WelfareProgram(BaseModel):
    """복지 프로그램 (완전한 문서)"""
    programId: str = Field(..., description="프로그램 고유 ID")
    title: str = Field(..., description="프로그램명")
    category: WelfareCategory = Field(..., description="카테고리")
    target_disease: List[str] = Field(..., description="대상 질병 목록")
    eligibility: WelfareEligibility = Field(..., description="자격 요건")
    benefits: WelfareBenefits = Field(..., description="혜택 정보")
    application: WelfareApplication = Field(..., description="신청 방법")
    contact: WelfareContact = Field(..., description="연락처")
    description: str = Field(..., description="프로그램 상세 설명")
    keywords: List[str] = Field(..., description="검색 키워드")
    is_active: bool = Field(default=True, description="프로그램 활성 여부")
    year: int = Field(..., description="기준 연도 (2024, 2025 등)")
    fact_check_verified: Optional[bool] = Field(None, description="Fact check 검증 완료 여부")
    source_urls: Optional[List[str]] = Field(None, description="출처 URL 목록")
    created_at: Optional[datetime] = Field(None, description="생성 일시")
    updated_at: Optional[datetime] = Field(None, description="수정 일시")

    class Config:
        json_schema_extra = {
            "example": {
                "programId": "sangjung_ckd_v001",
                "title": "만성콩팥병 산정특례 제도",
                "category": "sangjung_special",
                "target_disease": ["CKD", "만성콩팥병"],
                "eligibility": {
                    "disease_code": "V001",
                    "ckd_stage": [3, 4, 5],
                    "description": "만성콩팥병 3기 이상"
                },
                "benefits": {
                    "copay_rate": "10%"
                },
                "application": {
                    "required_documents": ["진단서", "신분증"],
                    "application_place": "건강보험공단",
                    "processing_time": "7-14일",
                    "validity_period": "5년"
                },
                "contact": {
                    "phone": "1577-1000",
                    "website": "https://www.nhis.or.kr"
                },
                "description": "본인부담금 90% 감면",
                "keywords": ["산정특례", "V001"],
                "year": 2024
            }
        }


class WelfareProgramResponse(WelfareProgram):
    """API 응답용 (score 추가)"""
    score: Optional[float] = Field(None, description="검색 관련도 점수")

    class Config:
        json_schema_extra = {
            "example": {
                "programId": "sangjung_ckd_v001",
                "title": "만성콩팥병 산정특례 제도",
                "score": 1.73
            }
        }


# ============================================================================
# API 요청/응답 모델
# ============================================================================

class WelfareSearchRequest(BaseModel):
    """검색 요청 모델"""
    query: str = Field(..., description="검색어", min_length=1)
    category: Optional[WelfareCategory] = Field(None, description="카테고리 필터")
    disease: Optional[str] = Field(None, description="질병 필터")
    ckd_stage: Optional[int] = Field(None, ge=1, le=5, description="CKD 단계 (1-5)")
    limit: int = Field(10, ge=1, le=50, description="최대 결과 수")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "산정특례",
                "category": "sangjung_special",
                "limit": 5
            }
        }


class WelfareStatsResponse(BaseModel):
    """통계 응답 모델"""
    total: int = Field(..., description="전체 프로그램 수")
    by_category: Dict[str, int] = Field(..., description="카테고리별 개수")

    class Config:
        json_schema_extra = {
            "example": {
                "total": 13,
                "by_category": {
                    "sangjung_special": 1,
                    "disability": 4,
                    "medical_aid": 4,
                    "transplant": 2,
                    "transport": 2
                }
            }
        }


class WelfareSearchResponse(BaseModel):
    """검색 응답 모델"""
    query: str = Field(..., description="검색어")
    total: int = Field(..., description="총 결과 수")
    results: List[WelfareProgramResponse] = Field(..., description="검색 결과 프로그램 리스트")
    filters_applied: Dict = Field(default={}, description="적용된 필터")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "산정특례",
                "total": 1,
                "results": [
                    {
                        "programId": "sangjung_ckd_v001",
                        "title": "만성콩팥병 산정특례 제도",
                        "score": 1.73
                    }
                ],
                "filters_applied": {"category": "sangjung_special"}
            }
        }
