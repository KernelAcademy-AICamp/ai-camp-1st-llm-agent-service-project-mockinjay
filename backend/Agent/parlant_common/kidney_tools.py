"""
Parlant Common Tools - CKD (Chronic Kidney Disease) Information
만성콩팥병 관련 정보 도구
"""
import parlant.sdk as p
from parlant.sdk import ToolContext, ToolResult
from typing import Optional
import logging

logger = logging.getLogger(__name__)



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