"""
Health Data Domain Models

Pydantic models for health tracking features:
- Lab results (creatinine, GFR, potassium, etc.)
- Medications and adherence tracking
- Vital signs (blood pressure, weight, fluid intake)
- Health events (hospitalizations, procedures)
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime, date
from enum import Enum


# ============================================
# Enums
# ============================================

class LabTestType(str, Enum):
    """Supported lab test types for CKD patients"""
    CREATININE = "creatinine"
    GFR = "gfr"
    POTASSIUM = "potassium"
    PHOSPHORUS = "phosphorus"
    HEMOGLOBIN = "hemoglobin"
    ALBUMIN = "albumin"
    CALCIUM = "calcium"
    SODIUM = "sodium"
    BUN = "bun"  # Blood Urea Nitrogen
    URIC_ACID = "uric_acid"
    PTH = "pth"  # Parathyroid Hormone


class LabResultStatus(str, Enum):
    """Lab result status compared to reference range"""
    NORMAL = "normal"
    BORDERLINE = "borderline"
    ELEVATED = "elevated"
    LOW = "low"
    CRITICAL = "critical"


class MedicationFrequency(str, Enum):
    """Medication dosing frequency"""
    ONCE_DAILY = "once_daily"
    TWICE_DAILY = "twice_daily"
    THREE_TIMES_DAILY = "three_times_daily"
    FOUR_TIMES_DAILY = "four_times_daily"
    AS_NEEDED = "as_needed"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class MedicationRoute(str, Enum):
    """Medication administration route"""
    ORAL = "oral"
    INJECTION = "injection"
    TOPICAL = "topical"
    INHALATION = "inhalation"
    TRANSDERMAL = "transdermal"


class VitalSignType(str, Enum):
    """Types of vital signs to track"""
    BLOOD_PRESSURE = "blood_pressure"
    WEIGHT = "weight"
    FLUID_INTAKE = "fluid_intake"
    URINE_OUTPUT = "urine_output"
    HEART_RATE = "heart_rate"
    TEMPERATURE = "temperature"


class VitalSignStatus(str, Enum):
    """Vital sign status assessment"""
    NORMAL = "normal"
    BORDERLINE_LOW = "borderline_low"
    BORDERLINE_HIGH = "borderline_high"
    LOW = "low"
    HIGH = "high"
    CRITICAL = "critical"


class HealthEventType(str, Enum):
    """Types of health events"""
    HOSPITALIZATION = "hospitalization"
    EMERGENCY_VISIT = "emergency_visit"
    PROCEDURE = "procedure"
    DIAGNOSIS = "diagnosis"
    FOLLOW_UP_VISIT = "follow_up_visit"
    LAB_WORK = "lab_work"


class EventSeverity(str, Enum):
    """Health event severity"""
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


# ============================================
# Lab Results Models
# ============================================

class ReferenceRange(BaseModel):
    """Reference range for lab test"""
    min: float = Field(..., description="Minimum normal value")
    max: float = Field(..., description="Maximum normal value")
    unit: str = Field(..., description="Measurement unit")

    class Config:
        json_schema_extra = {
            "example": {
                "min": 0.7,
                "max": 1.3,
                "unit": "mg/dL"
            }
        }


class CreateLabResultRequest(BaseModel):
    """Request to create a lab result"""
    user_id: str = Field(..., min_length=24, max_length=24)
    test_type: LabTestType
    value: float = Field(..., ge=0)
    unit: str = Field(..., min_length=1, max_length=20)
    test_date: datetime
    lab_name: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=1000)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "test_type": "creatinine",
                "value": 1.8,
                "unit": "mg/dL",
                "test_date": "2025-11-28T10:30:00Z",
                "lab_name": "Seoul Medical Center",
                "notes": "Fasting test"
            }
        }


class LabResult(BaseModel):
    """Lab result entity"""
    id: str = Field(..., description="Result ID")
    user_id: str
    test_type: LabTestType
    value: float
    unit: str
    test_date: datetime
    lab_name: Optional[str] = None
    reference_range: Optional[ReferenceRange] = None
    status: LabResultStatus
    notes: Optional[str] = None
    verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439099",
                "user_id": "507f1f77bcf86cd799439011",
                "test_type": "creatinine",
                "value": 1.8,
                "unit": "mg/dL",
                "test_date": "2025-11-28T10:30:00Z",
                "lab_name": "Seoul Medical Center",
                "reference_range": {
                    "min": 0.7,
                    "max": 1.3,
                    "unit": "mg/dL"
                },
                "status": "elevated",
                "notes": "Fasting test",
                "verified": True,
                "created_at": "2025-11-28T11:00:00Z",
                "updated_at": "2025-11-28T11:00:00Z"
            }
        }


class LabResultResponse(BaseModel):
    """Response after creating/retrieving lab result"""
    success: bool = True
    result: LabResult
    trends: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "result": {
                    "id": "507f1f77bcf86cd799439099",
                    "test_type": "creatinine",
                    "value": 1.8,
                    "status": "elevated"
                },
                "trends": {
                    "status": "elevated",
                    "change_from_previous": 0.2,
                    "recommendation": "Consider consulting with your nephrologist"
                }
            }
        }


class LabResultListResponse(BaseModel):
    """Response with list of lab results"""
    success: bool = True
    results: List[LabResult]
    pagination: Dict[str, int]

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "results": [],
                "pagination": {
                    "total": 45,
                    "page": 1,
                    "page_size": 20,
                    "total_pages": 3
                }
            }
        }


# ============================================
# Medication Models
# ============================================

class CreateMedicationRequest(BaseModel):
    """Request to add a medication"""
    user_id: str = Field(..., min_length=24, max_length=24)
    medication_name: str = Field(..., min_length=1, max_length=200)
    generic_name: Optional[str] = Field(None, max_length=200)
    dosage: str = Field(..., min_length=1, max_length=50)
    frequency: MedicationFrequency
    schedule: List[str] = Field(..., min_items=1, description="Times of day (HH:MM format)")
    route: MedicationRoute
    start_date: date
    end_date: Optional[date] = None
    prescribing_doctor: Optional[str] = Field(None, max_length=200)
    purpose: Optional[str] = Field(None, max_length=500)
    side_effects: Optional[List[str]] = None

    @field_validator('schedule')
    @classmethod
    def validate_schedule(cls, v):
        """Validate time format in schedule"""
        for time_str in v:
            try:
                # Validate HH:MM format
                hours, minutes = time_str.split(':')
                if not (0 <= int(hours) <= 23 and 0 <= int(minutes) <= 59):
                    raise ValueError(f"Invalid time: {time_str}")
            except (ValueError, AttributeError):
                raise ValueError(f"Schedule times must be in HH:MM format, got: {time_str}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "medication_name": "Furosemide",
                "generic_name": "Furosemide",
                "dosage": "40mg",
                "frequency": "twice_daily",
                "schedule": ["09:00", "21:00"],
                "route": "oral",
                "start_date": "2025-11-28",
                "end_date": null,
                "prescribing_doctor": "Dr. Kim",
                "purpose": "Manage fluid retention",
                "side_effects": ["dizziness", "increased urination"]
            }
        }


class Medication(BaseModel):
    """Medication entity"""
    id: str = Field(..., description="Medication ID")
    user_id: str
    medication_name: str
    generic_name: Optional[str] = None
    dosage: str
    frequency: MedicationFrequency
    schedule: List[str]
    route: MedicationRoute
    start_date: date
    end_date: Optional[date] = None
    prescribing_doctor: Optional[str] = None
    purpose: Optional[str] = None
    side_effects: Optional[List[str]] = None
    is_active: bool = True
    adherence_rate: float = Field(default=0.0, ge=0, le=100, description="Adherence percentage")
    created_at: datetime
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439100",
                "user_id": "507f1f77bcf86cd799439011",
                "medication_name": "Furosemide",
                "dosage": "40mg",
                "frequency": "twice_daily",
                "schedule": ["09:00", "21:00"],
                "route": "oral",
                "start_date": "2025-11-28",
                "is_active": True,
                "adherence_rate": 95.0,
                "created_at": "2025-11-28T11:00:00Z",
                "updated_at": "2025-11-28T11:00:00Z"
            }
        }


class MedicationResponse(BaseModel):
    """Response after creating/retrieving medication"""
    success: bool = True
    medication: Medication
    next_reminder: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "medication": {
                    "id": "507f1f77bcf86cd799439100",
                    "medication_name": "Furosemide",
                    "dosage": "40mg"
                },
                "next_reminder": "2025-11-28T09:00:00Z"
            }
        }


class MedicationListResponse(BaseModel):
    """Response with list of medications"""
    success: bool = True
    medications: List[Medication]
    active_count: int
    inactive_count: int

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "medications": [],
                "active_count": 5,
                "inactive_count": 2
            }
        }


# ============================================
# Vital Signs Models
# ============================================

class CreateVitalSignRequest(BaseModel):
    """Request to record a vital sign"""
    user_id: str = Field(..., min_length=24, max_length=24)
    sign_type: VitalSignType
    recorded_at: datetime

    # For blood_pressure
    systolic: Optional[int] = Field(None, ge=50, le=250)
    diastolic: Optional[int] = Field(None, ge=30, le=150)

    # For weight
    weight_kg: Optional[float] = Field(None, ge=20, le=300)

    # For fluid_intake or urine_output
    fluid_ml: Optional[int] = Field(None, ge=0, le=10000)

    # For heart_rate
    heart_rate_bpm: Optional[int] = Field(None, ge=30, le=250)

    # For temperature
    temperature_c: Optional[float] = Field(None, ge=30.0, le=45.0)

    notes: Optional[str] = Field(None, max_length=500)

    @field_validator('systolic', 'diastolic')
    @classmethod
    def validate_blood_pressure(cls, v, info):
        """Validate blood pressure values are provided together"""
        # This will be checked in the service layer
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "sign_type": "blood_pressure",
                "systolic": 135,
                "diastolic": 85,
                "recorded_at": "2025-11-28T08:00:00Z",
                "notes": "Morning reading before medication"
            }
        }


class VitalSign(BaseModel):
    """Vital sign entity"""
    id: str = Field(..., description="Vital sign ID")
    user_id: str
    sign_type: VitalSignType
    recorded_at: datetime

    # Blood pressure
    systolic: Optional[int] = None
    diastolic: Optional[int] = None

    # Weight
    weight_kg: Optional[float] = None

    # Fluid
    fluid_ml: Optional[int] = None

    # Heart rate
    heart_rate_bpm: Optional[int] = None

    # Temperature
    temperature_c: Optional[float] = None

    notes: Optional[str] = None
    status: VitalSignStatus
    created_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439101",
                "user_id": "507f1f77bcf86cd799439011",
                "sign_type": "blood_pressure",
                "systolic": 135,
                "diastolic": 85,
                "recorded_at": "2025-11-28T08:00:00Z",
                "status": "borderline_high",
                "created_at": "2025-11-28T08:05:00Z"
            }
        }


class VitalSignResponse(BaseModel):
    """Response after recording vital sign"""
    success: bool = True
    vital_sign: VitalSign
    trend: Optional[str] = None
    recommendation: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "vital_sign": {
                    "id": "507f1f77bcf86cd799439101",
                    "sign_type": "blood_pressure",
                    "systolic": 135,
                    "diastolic": 85,
                    "status": "borderline_high"
                },
                "trend": "stable",
                "recommendation": "Monitor daily and report to doctor if consistently above 140/90"
            }
        }


class VitalSignListResponse(BaseModel):
    """Response with list of vital signs"""
    success: bool = True
    vital_signs: List[VitalSign]
    pagination: Dict[str, int]

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "vital_signs": [],
                "pagination": {
                    "total": 120,
                    "page": 1,
                    "page_size": 20,
                    "total_pages": 6
                }
            }
        }


# ============================================
# Health Events Models
# ============================================

class CreateHealthEventRequest(BaseModel):
    """Request to record a health event"""
    user_id: str = Field(..., min_length=24, max_length=24)
    event_type: HealthEventType
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    event_date: date
    duration_days: Optional[int] = Field(None, ge=0, le=365)
    facility: Optional[str] = Field(None, max_length=200)
    attending_physician: Optional[str] = Field(None, max_length=200)
    outcome: Optional[str] = Field(None, max_length=1000)
    severity: EventSeverity
    related_lab_results: Optional[List[str]] = None
    related_medications: Optional[List[str]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "event_type": "hospitalization",
                "title": "Kidney Function Evaluation",
                "description": "Admitted for comprehensive kidney function assessment",
                "event_date": "2025-11-20",
                "duration_days": 3,
                "facility": "Seoul National University Hospital",
                "attending_physician": "Dr. Park",
                "outcome": "Stabilized, adjusted medication dosage",
                "severity": "moderate",
                "related_lab_results": ["507f1f77bcf86cd799439099"],
                "related_medications": ["507f1f77bcf86cd799439100"]
            }
        }


class HealthEvent(BaseModel):
    """Health event entity"""
    id: str = Field(..., description="Event ID")
    user_id: str
    event_type: HealthEventType
    title: str
    description: Optional[str] = None
    event_date: date
    duration_days: Optional[int] = None
    facility: Optional[str] = None
    attending_physician: Optional[str] = None
    outcome: Optional[str] = None
    severity: EventSeverity
    related_lab_results: Optional[List[str]] = None
    related_medications: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439103",
                "user_id": "507f1f77bcf86cd799439011",
                "event_type": "hospitalization",
                "title": "Kidney Function Evaluation",
                "event_date": "2025-11-20",
                "duration_days": 3,
                "severity": "moderate",
                "created_at": "2025-11-23T10:00:00Z",
                "updated_at": "2025-11-23T10:00:00Z"
            }
        }


class HealthEventResponse(BaseModel):
    """Response after creating/retrieving health event"""
    success: bool = True
    event: HealthEvent

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "event": {
                    "id": "507f1f77bcf86cd799439103",
                    "title": "Kidney Function Evaluation",
                    "event_type": "hospitalization",
                    "event_date": "2025-11-20"
                }
            }
        }


class HealthEventListResponse(BaseModel):
    """Response with list of health events"""
    success: bool = True
    events: List[HealthEvent]
    pagination: Dict[str, int]

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "events": [],
                "pagination": {
                    "total": 12,
                    "page": 1,
                    "page_size": 20,
                    "total_pages": 1
                }
            }
        }


# ============================================
# Health Summary Models
# ============================================

class HealthSummary(BaseModel):
    """Comprehensive health summary for a user"""
    user_id: str
    latest_lab_results: Dict[str, LabResult] = Field(
        default_factory=dict,
        description="Latest result for each test type"
    )
    active_medications_count: int = 0
    recent_vital_signs: Dict[str, VitalSign] = Field(
        default_factory=dict,
        description="Latest vital sign for each type"
    )
    recent_events_count: int = 0
    health_alerts: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Critical health alerts"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "latest_lab_results": {
                    "creatinine": {
                        "id": "507f1f77bcf86cd799439099",
                        "value": 1.8,
                        "status": "elevated"
                    }
                },
                "active_medications_count": 5,
                "recent_vital_signs": {
                    "blood_pressure": {
                        "id": "507f1f77bcf86cd799439101",
                        "systolic": 135,
                        "diastolic": 85,
                        "status": "borderline_high"
                    }
                },
                "recent_events_count": 2,
                "health_alerts": [
                    {
                        "type": "warning",
                        "message": "GFR has decreased 4.5% in the past month",
                        "action": "Schedule follow-up with nephrologist"
                    }
                ]
            }
        }


class HealthSummaryResponse(BaseModel):
    """Response with health summary"""
    success: bool = True
    summary: HealthSummary

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "summary": {
                    "user_id": "507f1f77bcf86cd799439011",
                    "active_medications_count": 5,
                    "recent_events_count": 2
                }
            }
        }
