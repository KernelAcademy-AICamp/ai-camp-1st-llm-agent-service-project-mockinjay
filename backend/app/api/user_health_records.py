from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user
from app.models.user_health_record import HealthRecordCreate, HealthRecordUpdate, HealthRecordResponse
from app.db.connection import db
from bson import ObjectId
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/health-records", tags=["health-records"])


def get_health_records_collection():
    """Lazy getter for health_records collection - avoids import-time DB access"""
    return db["health_records"]

@router.get("/", response_model=List[HealthRecordResponse])
async def get_health_records(user_id: str = Depends(get_current_user)):
    """
    현재 로그인한 사용자의 모든 건강 기록을 조회합니다.
    """
    health_records_collection = get_health_records_collection()
    records = list(health_records_collection.find({"user_id": user_id}).sort("date", -1))
    
    return [
        {
            "id": str(record["_id"]),
            "user_id": record["user_id"],
            **{k: v for k, v in record.items() if k not in ["_id", "user_id", "created_at"]}
        }
        for record in records
    ]

@router.post("/", response_model=HealthRecordResponse)
async def create_health_record(
    record: HealthRecordCreate,
    user_id: str = Depends(get_current_user)
):
    """
    새로운 건강 기록을 생성합니다.
    """
    health_records_collection = get_health_records_collection()
    record_doc = {
        "user_id": user_id,
        **record.model_dump(),
        "created_at": datetime.utcnow()
    }

    result = health_records_collection.insert_one(record_doc)
    
    return {
        "id": str(result.inserted_id),
        "user_id": user_id,
        **record.model_dump()
    }

@router.put("/{record_id}", response_model=HealthRecordResponse)
async def update_health_record(
    record_id: str,
    record_update: HealthRecordUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    건강 기록을 수정합니다.
    """
    health_records_collection = get_health_records_collection()
    # 권한 확인
    existing_record = health_records_collection.find_one({
        "_id": ObjectId(record_id),
        "user_id": user_id
    })
    
    if not existing_record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다")
    
    # 업데이트할 데이터만 추출
    update_data = {k: v for k, v in record_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="업데이트할 데이터가 없습니다")
    
    health_records_collection.update_one(
        {"_id": ObjectId(record_id)},
        {"$set": update_data}
    )
    
    # 업데이트된 기록 조회
    updated_record = health_records_collection.find_one({"_id": ObjectId(record_id)})
    
    return {
        "id": str(updated_record["_id"]),
        "user_id": updated_record["user_id"],
        **{k: v for k, v in updated_record.items() if k not in ["_id", "user_id", "created_at"]}
    }

@router.delete("/{record_id}")
async def delete_health_record(
    record_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    건강 기록을 삭제합니다.
    """
    health_records_collection = get_health_records_collection()
    result = health_records_collection.delete_one({
        "_id": ObjectId(record_id),
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다")
    
    return {"success": True, "message": "기록이 삭제되었습니다"}
