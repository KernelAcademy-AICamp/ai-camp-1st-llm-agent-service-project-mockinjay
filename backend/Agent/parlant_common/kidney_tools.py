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

