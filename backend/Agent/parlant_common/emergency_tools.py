"""
Parlant Common Tools - Emergency Detection
응급 상황 키워드 감지 도구
"""

import parlant.sdk as p
from parlant.sdk import ToolContext, ToolResult
import logging

logger = logging.getLogger(__name__)


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
