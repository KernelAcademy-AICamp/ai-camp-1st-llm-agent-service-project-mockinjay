"""
Health Data Repository

Data access layer for health-related collections:
- Lab results
- Medications
- Vital signs
- Health events

Implements async operations with Motor driver
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from app.db.connection import Database
from app.models.health import (
    LabResult, LabTestType, LabResultStatus,
    Medication, MedicationFrequency,
    VitalSign, VitalSignType, VitalSignStatus,
    HealthEvent, HealthEventType
)


class HealthRepository:
    """Repository for health data operations"""

    def __init__(self):
        self.db = Database.db

    # ============================================
    # Lab Results Operations
    # ============================================

    async def create_lab_result(
        self,
        user_id: str,
        test_type: LabTestType,
        value: float,
        unit: str,
        test_date: datetime,
        lab_name: Optional[str] = None,
        notes: Optional[str] = None,
        reference_range: Optional[Dict[str, Any]] = None,
        status: LabResultStatus = LabResultStatus.NORMAL
    ) -> str:
        """
        Create a new lab result record

        Args:
            user_id: User ID
            test_type: Type of lab test
            value: Test result value
            unit: Measurement unit
            test_date: Date of test
            lab_name: Name of laboratory
            notes: Additional notes
            reference_range: Reference range for the test
            status: Result status

        Returns:
            str: Created lab result ID
        """
        collection: AsyncIOMotorCollection = self.db["lab_results"]

        lab_result_doc = {
            "user_id": user_id,
            "test_type": test_type.value,
            "value": value,
            "unit": unit,
            "test_date": test_date,
            "lab_name": lab_name,
            "reference_range": reference_range,
            "status": status.value,
            "notes": notes,
            "verified": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await collection.insert_one(lab_result_doc)
        return str(result.inserted_id)

    async def get_lab_result(self, result_id: str) -> Optional[Dict[str, Any]]:
        """Get a lab result by ID"""
        collection: AsyncIOMotorCollection = self.db["lab_results"]
        result = await collection.find_one({"_id": ObjectId(result_id)})

        if result:
            result["id"] = str(result.pop("_id"))
            return result
        return None

    async def get_user_lab_results(
        self,
        user_id: str,
        test_type: Optional[LabTestType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 20,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get lab results for a user with optional filters

        Args:
            user_id: User ID
            test_type: Filter by test type
            start_date: Filter by start date
            end_date: Filter by end date
            limit: Maximum results
            skip: Number to skip (pagination)

        Returns:
            List of lab results
        """
        collection: AsyncIOMotorCollection = self.db["lab_results"]

        query: Dict[str, Any] = {"user_id": user_id}

        if test_type:
            query["test_type"] = test_type.value

        if start_date or end_date:
            query["test_date"] = {}
            if start_date:
                query["test_date"]["$gte"] = start_date
            if end_date:
                query["test_date"]["$lte"] = end_date

        cursor = collection.find(query).sort("test_date", -1).skip(skip).limit(limit)
        results = []

        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            results.append(doc)

        return results

    async def get_latest_lab_results(
        self,
        user_id: str
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get the most recent result for each test type

        Args:
            user_id: User ID

        Returns:
            Dict mapping test_type to latest result
        """
        collection: AsyncIOMotorCollection = self.db["lab_results"]

        # Aggregation pipeline to get latest result for each test type
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$sort": {"test_date": -1}},
            {
                "$group": {
                    "_id": "$test_type",
                    "latest_result": {"$first": "$$ROOT"}
                }
            }
        ]

        results = {}
        async for doc in collection.aggregate(pipeline):
            test_type = doc["_id"]
            latest = doc["latest_result"]
            latest["id"] = str(latest.pop("_id"))
            results[test_type] = latest

        return results

    async def count_lab_results(
        self,
        user_id: str,
        test_type: Optional[LabTestType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> int:
        """Count lab results matching criteria"""
        collection: AsyncIOMotorCollection = self.db["lab_results"]

        query: Dict[str, Any] = {"user_id": user_id}

        if test_type:
            query["test_type"] = test_type.value

        if start_date or end_date:
            query["test_date"] = {}
            if start_date:
                query["test_date"]["$gte"] = start_date
            if end_date:
                query["test_date"]["$lte"] = end_date

        return await collection.count_documents(query)

    # ============================================
    # Medications Operations
    # ============================================

    async def create_medication(
        self,
        user_id: str,
        medication_name: str,
        dosage: str,
        frequency: MedicationFrequency,
        schedule: List[str],
        route: str,
        start_date: date,
        generic_name: Optional[str] = None,
        end_date: Optional[date] = None,
        prescribing_doctor: Optional[str] = None,
        purpose: Optional[str] = None,
        side_effects: Optional[List[str]] = None
    ) -> str:
        """Create a new medication record"""
        collection: AsyncIOMotorCollection = self.db["medications"]

        medication_doc = {
            "user_id": user_id,
            "medication_name": medication_name,
            "generic_name": generic_name,
            "dosage": dosage,
            "frequency": frequency.value,
            "schedule": schedule,
            "route": route,
            "start_date": datetime.combine(start_date, datetime.min.time()),
            "end_date": datetime.combine(end_date, datetime.min.time()) if end_date else None,
            "prescribing_doctor": prescribing_doctor,
            "purpose": purpose,
            "side_effects": side_effects or [],
            "is_active": True,
            "adherence_rate": 0.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await collection.insert_one(medication_doc)
        return str(result.inserted_id)

    async def get_medication(self, medication_id: str) -> Optional[Dict[str, Any]]:
        """Get a medication by ID"""
        collection: AsyncIOMotorCollection = self.db["medications"]
        result = await collection.find_one({"_id": ObjectId(medication_id)})

        if result:
            result["id"] = str(result.pop("_id"))
            # Convert datetime back to date
            if result.get("start_date"):
                result["start_date"] = result["start_date"].date()
            if result.get("end_date"):
                result["end_date"] = result["end_date"].date()
            return result
        return None

    async def get_user_medications(
        self,
        user_id: str,
        is_active: Optional[bool] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get medications for a user"""
        collection: AsyncIOMotorCollection = self.db["medications"]

        query: Dict[str, Any] = {"user_id": user_id}
        if is_active is not None:
            query["is_active"] = is_active

        cursor = collection.find(query).sort("start_date", -1).limit(limit)
        results = []

        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            # Convert datetime back to date
            if doc.get("start_date"):
                doc["start_date"] = doc["start_date"].date()
            if doc.get("end_date"):
                doc["end_date"] = doc["end_date"].date()
            results.append(doc)

        return results

    async def update_medication_status(
        self,
        medication_id: str,
        is_active: bool
    ) -> bool:
        """Update medication active status"""
        collection: AsyncIOMotorCollection = self.db["medications"]

        result = await collection.update_one(
            {"_id": ObjectId(medication_id)},
            {
                "$set": {
                    "is_active": is_active,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return result.modified_count > 0

    async def update_medication_adherence(
        self,
        medication_id: str,
        adherence_rate: float
    ) -> bool:
        """Update medication adherence rate"""
        collection: AsyncIOMotorCollection = self.db["medications"]

        result = await collection.update_one(
            {"_id": ObjectId(medication_id)},
            {
                "$set": {
                    "adherence_rate": adherence_rate,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return result.modified_count > 0

    # ============================================
    # Vital Signs Operations
    # ============================================

    async def create_vital_sign(
        self,
        user_id: str,
        sign_type: VitalSignType,
        recorded_at: datetime,
        status: VitalSignStatus,
        systolic: Optional[int] = None,
        diastolic: Optional[int] = None,
        weight_kg: Optional[float] = None,
        fluid_ml: Optional[int] = None,
        heart_rate_bpm: Optional[int] = None,
        temperature_c: Optional[float] = None,
        notes: Optional[str] = None
    ) -> str:
        """Create a new vital sign record"""
        collection: AsyncIOMotorCollection = self.db["vital_signs"]

        vital_sign_doc = {
            "user_id": user_id,
            "sign_type": sign_type.value,
            "recorded_at": recorded_at,
            "systolic": systolic,
            "diastolic": diastolic,
            "weight_kg": weight_kg,
            "fluid_ml": fluid_ml,
            "heart_rate_bpm": heart_rate_bpm,
            "temperature_c": temperature_c,
            "notes": notes,
            "status": status.value,
            "created_at": datetime.utcnow()
        }

        result = await collection.insert_one(vital_sign_doc)
        return str(result.inserted_id)

    async def get_user_vital_signs(
        self,
        user_id: str,
        sign_type: Optional[VitalSignType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Get vital signs for a user with optional filters"""
        collection: AsyncIOMotorCollection = self.db["vital_signs"]

        query: Dict[str, Any] = {"user_id": user_id}

        if sign_type:
            query["sign_type"] = sign_type.value

        if start_date or end_date:
            query["recorded_at"] = {}
            if start_date:
                query["recorded_at"]["$gte"] = start_date
            if end_date:
                query["recorded_at"]["$lte"] = end_date

        cursor = collection.find(query).sort("recorded_at", -1).skip(skip).limit(limit)
        results = []

        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            results.append(doc)

        return results

    async def get_latest_vital_signs(
        self,
        user_id: str
    ) -> Dict[str, Dict[str, Any]]:
        """Get the most recent vital sign for each type"""
        collection: AsyncIOMotorCollection = self.db["vital_signs"]

        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$sort": {"recorded_at": -1}},
            {
                "$group": {
                    "_id": "$sign_type",
                    "latest_sign": {"$first": "$$ROOT"}
                }
            }
        ]

        results = {}
        async for doc in collection.aggregate(pipeline):
            sign_type = doc["_id"]
            latest = doc["latest_sign"]
            latest["id"] = str(latest.pop("_id"))
            results[sign_type] = latest

        return results

    async def count_vital_signs(
        self,
        user_id: str,
        sign_type: Optional[VitalSignType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> int:
        """Count vital signs matching criteria"""
        collection: AsyncIOMotorCollection = self.db["vital_signs"]

        query: Dict[str, Any] = {"user_id": user_id}

        if sign_type:
            query["sign_type"] = sign_type.value

        if start_date or end_date:
            query["recorded_at"] = {}
            if start_date:
                query["recorded_at"]["$gte"] = start_date
            if end_date:
                query["recorded_at"]["$lte"] = end_date

        return await collection.count_documents(query)

    # ============================================
    # Health Events Operations
    # ============================================

    async def create_health_event(
        self,
        user_id: str,
        event_type: HealthEventType,
        title: str,
        event_date: date,
        severity: str,
        description: Optional[str] = None,
        duration_days: Optional[int] = None,
        facility: Optional[str] = None,
        attending_physician: Optional[str] = None,
        outcome: Optional[str] = None,
        related_lab_results: Optional[List[str]] = None,
        related_medications: Optional[List[str]] = None
    ) -> str:
        """Create a new health event record"""
        collection: AsyncIOMotorCollection = self.db["health_events"]

        health_event_doc = {
            "user_id": user_id,
            "event_type": event_type.value,
            "title": title,
            "description": description,
            "event_date": datetime.combine(event_date, datetime.min.time()),
            "duration_days": duration_days,
            "facility": facility,
            "attending_physician": attending_physician,
            "outcome": outcome,
            "severity": severity,
            "related_lab_results": related_lab_results or [],
            "related_medications": related_medications or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await collection.insert_one(health_event_doc)
        return str(result.inserted_id)

    async def get_health_event(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Get a health event by ID"""
        collection: AsyncIOMotorCollection = self.db["health_events"]
        result = await collection.find_one({"_id": ObjectId(event_id)})

        if result:
            result["id"] = str(result.pop("_id"))
            if result.get("event_date"):
                result["event_date"] = result["event_date"].date()
            return result
        return None

    async def get_user_health_events(
        self,
        user_id: str,
        event_type: Optional[HealthEventType] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Get health events for a user with optional filters"""
        collection: AsyncIOMotorCollection = self.db["health_events"]

        query: Dict[str, Any] = {"user_id": user_id}

        if event_type:
            query["event_type"] = event_type.value

        if start_date or end_date:
            query["event_date"] = {}
            if start_date:
                query["event_date"]["$gte"] = datetime.combine(start_date, datetime.min.time())
            if end_date:
                query["event_date"]["$lte"] = datetime.combine(end_date, datetime.min.time())

        cursor = collection.find(query).sort("event_date", -1).skip(skip).limit(limit)
        results = []

        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            if doc.get("event_date"):
                doc["event_date"] = doc["event_date"].date()
            results.append(doc)

        return results

    async def count_health_events(
        self,
        user_id: str,
        event_type: Optional[HealthEventType] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> int:
        """Count health events matching criteria"""
        collection: AsyncIOMotorCollection = self.db["health_events"]

        query: Dict[str, Any] = {"user_id": user_id}

        if event_type:
            query["event_type"] = event_type.value

        if start_date or end_date:
            query["event_date"] = {}
            if start_date:
                query["event_date"]["$gte"] = datetime.combine(start_date, datetime.min.time())
            if end_date:
                query["event_date"]["$lte"] = datetime.combine(end_date, datetime.min.time())

        return await collection.count_documents(query)

    # ============================================
    # Utility Operations
    # ============================================

    async def delete_lab_result(self, result_id: str, user_id: str) -> bool:
        """Delete a lab result (soft delete by user verification)"""
        collection: AsyncIOMotorCollection = self.db["lab_results"]

        result = await collection.delete_one({
            "_id": ObjectId(result_id),
            "user_id": user_id
        })

        return result.deleted_count > 0

    async def delete_medication(self, medication_id: str, user_id: str) -> bool:
        """Delete a medication"""
        collection: AsyncIOMotorCollection = self.db["medications"]

        result = await collection.delete_one({
            "_id": ObjectId(medication_id),
            "user_id": user_id
        })

        return result.deleted_count > 0

    async def delete_vital_sign(self, vital_sign_id: str, user_id: str) -> bool:
        """Delete a vital sign record"""
        collection: AsyncIOMotorCollection = self.db["vital_signs"]

        result = await collection.delete_one({
            "_id": ObjectId(vital_sign_id),
            "user_id": user_id
        })

        return result.deleted_count > 0

    async def delete_health_event(self, event_id: str, user_id: str) -> bool:
        """Delete a health event"""
        collection: AsyncIOMotorCollection = self.db["health_events"]

        result = await collection.delete_one({
            "_id": ObjectId(event_id),
            "user_id": user_id
        })

        return result.deleted_count > 0
