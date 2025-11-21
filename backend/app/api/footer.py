"""
Footer 관련 API 엔드포인트
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/footer", tags=["footer"])


@router.get("/info")
async def get_footer_info():
    """
    Footer 정보 조회
    
    정적 콘텐츠 반환:
    - 서비스명
    - 저작권 표기
    - 이용약관 링크
    - 개인정보처리방침 링크
    - 면책조항 링크
    - 앱 버전 정보
    
    Returns:
        dict: Footer 정보
    """
    return {
        "success": True,
        "data": {
            "service_name": "CareGuide",
            "copyright": "© 2025 CareGuide. All rights reserved",
            "version": "v1.0",
            "links": {
                "terms_of_service": "/terms",
                "privacy_policy": "/privacy",
                "disclaimer": "/disclaimer"
            }
        }
    }
