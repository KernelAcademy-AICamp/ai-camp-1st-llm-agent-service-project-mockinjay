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


