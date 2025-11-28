"""
Health Tracking API Router

Endpoints for tracking health data for CKD patients:
- Lab results (creatinine, GFR, etc.)
- Medications
- Vital signs
- Symptoms
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId

from app.api.dependencies import get_current_user
from app.db.connection import db
from app.models.health_tracking import (
    CreateLabResultRequest,
    LabResultResponse,
    LabResultListResponse,
    LabTrendResponse,
    CreateMedicationRequest,
    UpdateMedicationRequest,
    MedicationResponse,
    MedicationListResponse,
    MedicationAdherenceResponse,
    CreateVitalSignsRequest,
    VitalSignsResponse,
    VitalSignsListResponse,
    CreateSymptomRequest,
    SymptomResponse,
    SymptomListResponse,
    SymptomSummaryResponse,
    LabTestType,
    MedicationType,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/health", tags=["health-tracking"])


# Lazy getters for database collections - avoids import-time DB access
def get_labs_collection():
    return db["health_labs"]


def get_medications_collection():
    return db["health_medications"]


def get_vitals_collection():
    return db["health_vitals"]


def get_symptoms_collection():
    return db["health_symptoms"]


# ============================================
# Lab Results Endpoints
# ============================================

@router.post("/labs", response_model=LabResultResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_result(
    lab_data: CreateLabResultRequest,
    user_id: str = Depends(get_current_user)
) -> LabResultResponse:
    """
    Log new lab results.

    Stores CKD-related lab test results including creatinine, GFR, BUN,
    electrolytes, and other important markers.

    Args:
        lab_data: Lab result data
        user_id: Current authenticated user ID

    Returns:
        LabResultResponse: Created lab result
    """
    created_at = datetime.utcnow()
    test_date = datetime.fromisoformat(lab_data.test_date)

    lab_doc = {
        "user_id": user_id,
        "test_date": test_date,
        **lab_data.model_dump(exclude={'test_date'}),
        "created_at": created_at,
        "updated_at": created_at
    }

    labs_collection = get_labs_collection()
    result = labs_collection.insert_one(lab_doc)

    logger.info(f"Created lab result {result.inserted_id} for user {user_id}")

    return LabResultResponse(
        id=str(result.inserted_id),
        user_id=user_id,
        test_date=lab_data.test_date,
        **lab_data.model_dump(exclude={'test_date'}),
        created_at=created_at.isoformat(),
        updated_at=created_at.isoformat()
    )


@router.get("/labs", response_model=LabResultListResponse)
async def get_lab_results(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    user_id: str = Depends(get_current_user)
) -> LabResultListResponse:
    """
    Get lab results history.

    Retrieves lab results for a date range with pagination.

    Query params:
        - start_date: ISO date string (default: 1 year ago)
        - end_date: ISO date string (default: today)
        - limit: Max results to return (1-200, default: 50)

    Returns:
        LabResultListResponse: List of lab results
    """
    # Parse dates
    if end_date:
        end = datetime.fromisoformat(end_date)
    else:
        end = datetime.utcnow()

    if start_date:
        start = datetime.fromisoformat(start_date)
    else:
        start = end - timedelta(days=365)

    # Query labs
    query = {
        "user_id": user_id,
        "test_date": {
            "$gte": start,
            "$lte": end
        }
    }

    labs_collection = get_labs_collection()
    labs = list(labs_collection.find(query).sort("test_date", -1).limit(limit))

    # Convert to response models
    lab_responses = []
    for lab_doc in labs:
        lab_responses.append(LabResultResponse(
            id=str(lab_doc["_id"]),
            user_id=lab_doc["user_id"],
            test_date=lab_doc["test_date"].isoformat(),
            creatinine_mg_dl=lab_doc.get("creatinine_mg_dl"),
            gfr_ml_min=lab_doc.get("gfr_ml_min"),
            bun_mg_dl=lab_doc.get("bun_mg_dl"),
            potassium_meq_l=lab_doc.get("potassium_meq_l"),
            phosphorus_mg_dl=lab_doc.get("phosphorus_mg_dl"),
            calcium_mg_dl=lab_doc.get("calcium_mg_dl"),
            albumin_g_dl=lab_doc.get("albumin_g_dl"),
            hemoglobin_g_dl=lab_doc.get("hemoglobin_g_dl"),
            uric_acid_mg_dl=lab_doc.get("uric_acid_mg_dl"),
            notes=lab_doc.get("notes"),
            doctor_name=lab_doc.get("doctor_name"),
            created_at=lab_doc["created_at"].isoformat(),
            updated_at=lab_doc["updated_at"].isoformat()
        ))

    return LabResultListResponse(
        results=lab_responses,
        total_count=len(lab_responses),
        date_range={
            "start": start.isoformat(),
            "end": end.isoformat()
        }
    )


@router.get("/labs/trends/{test_type}", response_model=LabTrendResponse)
async def get_lab_trend(
    test_type: LabTestType,
    months: int = Query(6, ge=1, le=24),
    user_id: str = Depends(get_current_user)
) -> LabTrendResponse:
    """
    Get trend analysis for a specific lab test.

    Analyzes trends over time and provides insights.

    Args:
        test_type: Type of lab test (creatinine, gfr, etc.)
        months: Number of months to analyze (1-24, default: 6)

    Returns:
        LabTrendResponse: Trend analysis with data points
    """
    # Get data for the period
    start_date = datetime.utcnow() - timedelta(days=months * 30)

    query = {
        "user_id": user_id,
        "test_date": {"$gte": start_date}
    }

    labs_collection = get_labs_collection()

    # Map test type to field name
    field_mapping = {
        LabTestType.CREATININE: "creatinine_mg_dl",
        LabTestType.GFR: "gfr_ml_min",
        LabTestType.BUN: "bun_mg_dl",
        LabTestType.POTASSIUM: "potassium_meq_l",
        LabTestType.PHOSPHORUS: "phosphorus_mg_dl",
        LabTestType.CALCIUM: "calcium_mg_dl",
        LabTestType.ALBUMIN: "albumin_g_dl",
        LabTestType.HEMOGLOBIN: "hemoglobin_g_dl",
        LabTestType.URIC_ACID: "uric_acid_mg_dl",
    }

    field_name = field_mapping.get(test_type)
    if not field_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported test type: {test_type}"
        )

    # Get labs with this field
    labs = list(labs_collection.find(query).sort("test_date", 1))

    # Extract data points
    data_points = []
    values = []

    for lab in labs:
        value = lab.get(field_name)
        if value is not None:
            data_points.append({
                "date": lab["test_date"].isoformat(),
                "value": value
            })
            values.append(value)

    # Analyze trend
    if len(values) < 2:
        trend = "insufficient_data"
    else:
        # Simple linear trend analysis
        first_half_avg = sum(values[:len(values)//2]) / (len(values)//2)
        second_half_avg = sum(values[len(values)//2:]) / (len(values) - len(values)//2)

        # For GFR, higher is better; for others, depends on target range
        if test_type == LabTestType.GFR:
            if second_half_avg > first_half_avg * 1.1:
                trend = "improving"
            elif second_half_avg < first_half_avg * 0.9:
                trend = "declining"
            else:
                trend = "stable"
        else:
            # For most markers, stability is good
            if abs(second_half_avg - first_half_avg) / first_half_avg < 0.1:
                trend = "stable"
            elif second_half_avg > first_half_avg:
                trend = "increasing"
            else:
                trend = "decreasing"

    # Get target ranges (simplified)
    target_ranges = {
        LabTestType.CREATININE: {"min": 0.7, "max": 1.3},
        LabTestType.GFR: {"min": 60, "max": 120},
        LabTestType.BUN: {"min": 7, "max": 20},
        LabTestType.POTASSIUM: {"min": 3.5, "max": 5.0},
        LabTestType.PHOSPHORUS: {"min": 2.5, "max": 4.5},
        LabTestType.HEMOGLOBIN: {"min": 12, "max": 16},
    }

    return LabTrendResponse(
        test_type=test_type,
        data_points=data_points,
        trend=trend,
        latest_value=values[-1] if values else None,
        target_range=target_ranges.get(test_type)
    )


@router.delete("/labs/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab_result(
    lab_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete a lab result.

    Only the owner can delete their lab results.

    Args:
        lab_id: Lab result ID
        user_id: Current authenticated user ID

    Returns:
        204 No Content on success
    """
    try:
        lab_object_id = ObjectId(lab_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid lab ID format"
        )

    labs_collection = get_labs_collection()
    # Find and check ownership
    lab = labs_collection.find_one({"_id": lab_object_id})

    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab result not found"
        )

    if lab["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own lab results"
        )

    labs_collection.delete_one({"_id": lab_object_id})
    logger.info(f"Deleted lab result {lab_id} for user {user_id}")


# ============================================
# Medication Endpoints
# ============================================

@router.post("/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(
    medication: CreateMedicationRequest,
    user_id: str = Depends(get_current_user)
) -> MedicationResponse:
    """
    Add a medication to user's medication list.

    Args:
        medication: Medication data
        user_id: Current authenticated user ID

    Returns:
        MedicationResponse: Created medication
    """
    created_at = datetime.utcnow()

    # Parse dates if provided
    start_date = None
    if medication.start_date:
        start_date = datetime.fromisoformat(medication.start_date)

    end_date = None
    if medication.end_date:
        end_date = datetime.fromisoformat(medication.end_date)

    med_doc = {
        "user_id": user_id,
        **medication.model_dump(exclude={'start_date', 'end_date'}),
        "start_date": start_date,
        "end_date": end_date,
        "is_active": True,
        "created_at": created_at,
        "updated_at": created_at
    }

    medications_collection = get_medications_collection()
    result = medications_collection.insert_one(med_doc)

    logger.info(f"Created medication {result.inserted_id} for user {user_id}")

    return MedicationResponse(
        id=str(result.inserted_id),
        user_id=user_id,
        **medication.model_dump(exclude={'start_date', 'end_date'}),
        start_date=medication.start_date,
        end_date=medication.end_date,
        is_active=True,
        created_at=created_at.isoformat(),
        updated_at=created_at.isoformat()
    )


@router.get("/medications", response_model=MedicationListResponse)
async def get_medications(
    active_only: bool = Query(True, description="Only return active medications"),
    user_id: str = Depends(get_current_user)
) -> MedicationListResponse:
    """
    Get user's medication list.

    Query params:
        - active_only: If true, only return active medications (default: true)

    Returns:
        MedicationListResponse: List of medications
    """
    query = {"user_id": user_id}

    if active_only:
        query["is_active"] = True

    medications_collection = get_medications_collection()
    medications = list(medications_collection.find(query).sort("created_at", -1))

    # Convert to response models
    med_responses = []
    active_count = 0
    inactive_count = 0

    for med_doc in medications:
        is_active = med_doc.get("is_active", True)
        if is_active:
            active_count += 1
        else:
            inactive_count += 1

        med_responses.append(MedicationResponse(
            id=str(med_doc["_id"]),
            user_id=med_doc["user_id"],
            name=med_doc["name"],
            medication_type=med_doc["medication_type"],
            dosage=med_doc["dosage"],
            frequency=med_doc["frequency"],
            start_date=med_doc.get("start_date").isoformat() if med_doc.get("start_date") else None,
            end_date=med_doc.get("end_date").isoformat() if med_doc.get("end_date") else None,
            prescribing_doctor=med_doc.get("prescribing_doctor"),
            purpose=med_doc.get("purpose"),
            side_effects=med_doc.get("side_effects"),
            notes=med_doc.get("notes"),
            reminder_enabled=med_doc.get("reminder_enabled", False),
            reminder_times=med_doc.get("reminder_times"),
            is_active=is_active,
            created_at=med_doc["created_at"].isoformat(),
            updated_at=med_doc["updated_at"].isoformat()
        ))

    return MedicationListResponse(
        medications=med_responses,
        active_count=active_count,
        inactive_count=inactive_count,
        total_count=len(med_responses)
    )


@router.patch("/medications/{medication_id}", response_model=MedicationResponse)
async def update_medication(
    medication_id: str,
    updates: UpdateMedicationRequest,
    user_id: str = Depends(get_current_user)
) -> MedicationResponse:
    """
    Update a medication.

    Only the owner can update their medications.

    Args:
        medication_id: Medication ID
        updates: Fields to update
        user_id: Current authenticated user ID

    Returns:
        MedicationResponse: Updated medication
    """
    try:
        med_object_id = ObjectId(medication_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid medication ID format"
        )

    medications_collection = get_medications_collection()
    # Find and check ownership
    medication = medications_collection.find_one({"_id": med_object_id})

    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )

    if medication["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own medications"
        )

    # Build update document
    update_dict = updates.model_dump(exclude_none=True)
    if "end_date" in update_dict and update_dict["end_date"]:
        update_dict["end_date"] = datetime.fromisoformat(update_dict["end_date"])

    update_dict["updated_at"] = datetime.utcnow()

    medications_collection.update_one(
        {"_id": med_object_id},
        {"$set": update_dict}
    )

    # Fetch updated medication
    updated_med = medications_collection.find_one({"_id": med_object_id})

    logger.info(f"Updated medication {medication_id} for user {user_id}")

    return MedicationResponse(
        id=str(updated_med["_id"]),
        user_id=updated_med["user_id"],
        name=updated_med["name"],
        medication_type=updated_med["medication_type"],
        dosage=updated_med["dosage"],
        frequency=updated_med["frequency"],
        start_date=updated_med.get("start_date").isoformat() if updated_med.get("start_date") else None,
        end_date=updated_med.get("end_date").isoformat() if updated_med.get("end_date") else None,
        prescribing_doctor=updated_med.get("prescribing_doctor"),
        purpose=updated_med.get("purpose"),
        side_effects=updated_med.get("side_effects"),
        notes=updated_med.get("notes"),
        reminder_enabled=updated_med.get("reminder_enabled", False),
        reminder_times=updated_med.get("reminder_times"),
        is_active=updated_med.get("is_active", True),
        created_at=updated_med["created_at"].isoformat(),
        updated_at=updated_med["updated_at"].isoformat()
    )


@router.delete("/medications/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    medication_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete (deactivate) a medication.

    This performs a soft delete by setting is_active to false.

    Args:
        medication_id: Medication ID
        user_id: Current authenticated user ID

    Returns:
        204 No Content on success
    """
    try:
        med_object_id = ObjectId(medication_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid medication ID format"
        )

    medications_collection = get_medications_collection()
    # Find and check ownership
    medication = medications_collection.find_one({"_id": med_object_id})

    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )

    if medication["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own medications"
        )

    # Soft delete
    medications_collection.update_one(
        {"_id": med_object_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )

    logger.info(f"Deactivated medication {medication_id} for user {user_id}")


# ============================================
# Health Check Endpoint
# ============================================

@router.get("/health")
async def health_check():
    """Health check endpoint for Health Tracking API"""
    return {
        "status": "healthy",
        "service": "health_tracking_api",
        "endpoints": {
            "labs": "ready",
            "medications": "ready",
            "vitals": "ready",
            "symptoms": "ready"
        }
    }
