"""
Health Tracking Models

Pydantic models for health tracking features including:
- Lab results (creatinine, GFR, BUN, etc.)
- Medications
- Vital signs (blood pressure, weight)
- Symptoms
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from enum import Enum


# ============================================
# Enums
# ============================================

class LabTestType(str, Enum):
    """Types of lab tests for CKD patients"""
    CREATININE = "creatinine"
    GFR = "gfr"
    BUN = "bun"
    POTASSIUM = "potassium"
    PHOSPHORUS = "phosphorus"
    ALBUMIN = "albumin"
    HEMOGLOBIN = "hemoglobin"
    CALCIUM = "calcium"
    URIC_ACID = "uric_acid"
    OTHER = "other"


class MedicationType(str, Enum):
    """Types of medications"""
    BLOOD_PRESSURE = "blood_pressure"
    DIURETIC = "diuretic"
    PHOSPHATE_BINDER = "phosphate_binder"
    EPO = "epo"  # Erythropoietin
    VITAMIN_D = "vitamin_d"
    IRON_SUPPLEMENT = "iron_supplement"
    OTHER = "other"


class MedicationFrequency(str, Enum):
    """Medication dosing frequency"""
    ONCE_DAILY = "once_daily"
    TWICE_DAILY = "twice_daily"
    THREE_TIMES_DAILY = "three_times_daily"
    AS_NEEDED = "as_needed"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class SymptomSeverity(str, Enum):
    """Symptom severity levels"""
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


# ============================================
# Lab Results Models
# ============================================

class CreateLabResultRequest(BaseModel):
    """Request to log lab results"""
    test_date: str = Field(..., description="Test date in ISO format (YYYY-MM-DD)")

    # Core CKD markers
    creatinine_mg_dl: Optional[float] = Field(None, ge=0, le=20, description="Creatinine level (mg/dL)")
    gfr_ml_min: Optional[float] = Field(None, ge=0, le=200, description="Glomerular Filtration Rate (mL/min)")
    bun_mg_dl: Optional[float] = Field(None, ge=0, le=200, description="Blood Urea Nitrogen (mg/dL)")

    # Electrolytes
    potassium_meq_l: Optional[float] = Field(None, ge=0, le=10, description="Potassium level (mEq/L)")
    phosphorus_mg_dl: Optional[float] = Field(None, ge=0, le=20, description="Phosphorus level (mg/dL)")
    calcium_mg_dl: Optional[float] = Field(None, ge=0, le=20, description="Calcium level (mg/dL)")

    # Other important markers
    albumin_g_dl: Optional[float] = Field(None, ge=0, le=10, description="Albumin level (g/dL)")
    hemoglobin_g_dl: Optional[float] = Field(None, ge=0, le=25, description="Hemoglobin level (g/dL)")
    uric_acid_mg_dl: Optional[float] = Field(None, ge=0, le=20, description="Uric acid level (mg/dL)")

    # Optional notes
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")
    doctor_name: Optional[str] = Field(None, max_length=100, description="Doctor who ordered the test")

    @field_validator('test_date')
    @classmethod
    def validate_test_date(cls, v: str) -> str:
        """Validate test date format"""
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError("test_date must be in ISO format (YYYY-MM-DD)")

    class Config:
        json_schema_extra = {
            "example": {
                "test_date": "2024-01-15",
                "creatinine_mg_dl": 1.8,
                "gfr_ml_min": 42,
                "bun_mg_dl": 25,
                "potassium_meq_l": 4.2,
                "phosphorus_mg_dl": 4.5,
                "hemoglobin_g_dl": 11.2,
                "notes": "Quarterly checkup",
                "doctor_name": "Dr. Kim"
            }
        }


class LabResultResponse(BaseModel):
    """Lab result response"""
    id: str
    user_id: str
    test_date: str

    # Lab values
    creatinine_mg_dl: Optional[float]
    gfr_ml_min: Optional[float]
    bun_mg_dl: Optional[float]
    potassium_meq_l: Optional[float]
    phosphorus_mg_dl: Optional[float]
    calcium_mg_dl: Optional[float]
    albumin_g_dl: Optional[float]
    hemoglobin_g_dl: Optional[float]
    uric_acid_mg_dl: Optional[float]

    notes: Optional[str]
    doctor_name: Optional[str]
    created_at: str
    updated_at: str


class LabResultListResponse(BaseModel):
    """List of lab results"""
    results: List[LabResultResponse]
    total_count: int
    date_range: dict


class LabTrendResponse(BaseModel):
    """Lab result trends over time"""
    test_type: LabTestType
    data_points: List[dict]  # [{date, value}, ...]
    trend: str  # improving, stable, declining
    latest_value: Optional[float]
    target_range: Optional[dict]  # {min, max}


# ============================================
# Medication Models
# ============================================

class CreateMedicationRequest(BaseModel):
    """Request to add a medication"""
    name: str = Field(..., min_length=1, max_length=200, description="Medication name")
    medication_type: MedicationType = Field(..., description="Type of medication")
    dosage: str = Field(..., min_length=1, max_length=100, description="Dosage (e.g., '10mg', '5ml')")
    frequency: MedicationFrequency = Field(..., description="How often to take")

    # Optional fields
    start_date: Optional[str] = Field(None, description="Start date (ISO format)")
    end_date: Optional[str] = Field(None, description="End date (ISO format)")
    prescribing_doctor: Optional[str] = Field(None, max_length=100)
    purpose: Optional[str] = Field(None, max_length=500, description="Why taking this medication")
    side_effects: Optional[List[str]] = Field(None, description="Known side effects")
    notes: Optional[str] = Field(None, max_length=500)

    # Reminder settings
    reminder_enabled: bool = Field(False, description="Enable medication reminder")
    reminder_times: Optional[List[str]] = Field(None, description="Reminder times (HH:MM format)")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Lisinopril",
                "medication_type": "blood_pressure",
                "dosage": "10mg",
                "frequency": "once_daily",
                "start_date": "2024-01-01",
                "prescribing_doctor": "Dr. Kim",
                "purpose": "Control blood pressure",
                "reminder_enabled": True,
                "reminder_times": ["08:00", "20:00"]
            }
        }


class UpdateMedicationRequest(BaseModel):
    """Request to update medication"""
    dosage: Optional[str] = Field(None, min_length=1, max_length=100)
    frequency: Optional[MedicationFrequency] = None
    end_date: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)
    reminder_enabled: Optional[bool] = None
    reminder_times: Optional[List[str]] = None


class MedicationResponse(BaseModel):
    """Medication response"""
    id: str
    user_id: str
    name: str
    medication_type: MedicationType
    dosage: str
    frequency: MedicationFrequency

    start_date: Optional[str]
    end_date: Optional[str]
    prescribing_doctor: Optional[str]
    purpose: Optional[str]
    side_effects: Optional[List[str]]
    notes: Optional[str]

    reminder_enabled: bool
    reminder_times: Optional[List[str]]

    is_active: bool
    created_at: str
    updated_at: str


class MedicationListResponse(BaseModel):
    """List of medications"""
    medications: List[MedicationResponse]
    active_count: int
    inactive_count: int
    total_count: int


class MedicationAdherenceResponse(BaseModel):
    """Medication adherence tracking"""
    medication_id: str
    medication_name: str
    doses_taken: int
    doses_missed: int
    adherence_percentage: float
    last_taken: Optional[str]


# ============================================
# Vital Signs Models
# ============================================

class CreateVitalSignsRequest(BaseModel):
    """Request to log vital signs"""
    recorded_at: Optional[str] = Field(None, description="Recording time (ISO format)")

    # Blood pressure
    systolic_bp: Optional[int] = Field(None, ge=50, le=250, description="Systolic BP (mmHg)")
    diastolic_bp: Optional[int] = Field(None, ge=30, le=150, description="Diastolic BP (mmHg)")

    # Weight and BMI
    weight_kg: Optional[float] = Field(None, ge=20, le=300, description="Weight in kg")
    height_cm: Optional[float] = Field(None, ge=100, le=250, description="Height in cm")

    # Other vitals
    heart_rate_bpm: Optional[int] = Field(None, ge=30, le=200, description="Heart rate (bpm)")
    temperature_c: Optional[float] = Field(None, ge=35, le=42, description="Body temperature (°C)")
    blood_glucose_mg_dl: Optional[int] = Field(None, ge=50, le=500, description="Blood glucose (mg/dL)")

    notes: Optional[str] = Field(None, max_length=500)

    class Config:
        json_schema_extra = {
            "example": {
                "recorded_at": "2024-01-15T08:30:00Z",
                "systolic_bp": 135,
                "diastolic_bp": 85,
                "weight_kg": 70.5,
                "heart_rate_bpm": 72,
                "notes": "Morning measurement"
            }
        }


class VitalSignsResponse(BaseModel):
    """Vital signs response"""
    id: str
    user_id: str
    recorded_at: str

    systolic_bp: Optional[int]
    diastolic_bp: Optional[int]
    weight_kg: Optional[float]
    height_cm: Optional[float]
    bmi: Optional[float]
    heart_rate_bpm: Optional[int]
    temperature_c: Optional[float]
    blood_glucose_mg_dl: Optional[int]

    notes: Optional[str]
    created_at: str


class VitalSignsListResponse(BaseModel):
    """List of vital signs"""
    vitals: List[VitalSignsResponse]
    total_count: int
    date_range: dict


# ============================================
# Symptom Tracking Models
# ============================================

class CreateSymptomRequest(BaseModel):
    """Request to log a symptom"""
    symptom_name: str = Field(..., min_length=1, max_length=100, description="Symptom name")
    severity: SymptomSeverity = Field(..., description="Severity level")

    occurred_at: Optional[str] = Field(None, description="When symptom occurred (ISO format)")
    duration_minutes: Optional[int] = Field(None, ge=0, description="Duration in minutes")

    # Additional context
    triggers: Optional[List[str]] = Field(None, description="Possible triggers")
    notes: Optional[str] = Field(None, max_length=500)

    # Related to medications or activities
    related_medication: Optional[str] = Field(None, max_length=100)
    related_activity: Optional[str] = Field(None, max_length=100)

    class Config:
        json_schema_extra = {
            "example": {
                "symptom_name": "Fatigue",
                "severity": "moderate",
                "occurred_at": "2024-01-15T14:00:00Z",
                "duration_minutes": 120,
                "triggers": ["lack of sleep", "low iron"],
                "notes": "Felt tired after lunch"
            }
        }


class SymptomResponse(BaseModel):
    """Symptom response"""
    id: str
    user_id: str
    symptom_name: str
    severity: SymptomSeverity
    occurred_at: str
    duration_minutes: Optional[int]
    triggers: Optional[List[str]]
    notes: Optional[str]
    related_medication: Optional[str]
    related_activity: Optional[str]
    created_at: str


class SymptomListResponse(BaseModel):
    """List of symptoms"""
    symptoms: List[SymptomResponse]
    total_count: int
    date_range: dict


class SymptomSummaryResponse(BaseModel):
    """Summary of symptoms"""
    most_common_symptoms: List[dict]  # [{name, count}]
    severity_distribution: dict  # {mild: x, moderate: y, severe: z}
    total_symptoms_logged: int
    period: str
