from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user
from app.db.connection import users_collection
from bson import ObjectId

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    """
    현재 로그인한 사용자의 프로필 정보를 조회합니다.
    
    Args:
        user_id: JWT 토큰에서 추출한 사용자 ID
        
    Returns:
        dict: 사용자 프로필 정보 (id, email, name, profile)
    """
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "profile": user["profile"],
        "role": user.get("role", "user")  # 기존 사용자를 위한 기본값
    }

@router.put("/profile")
async def update_profile(name: str, user_id: str = Depends(get_current_user)):
    """
    현재 로그인한 사용자의 이름을 수정합니다.
    
    Args:
        name: 새로운 이름
        user_id: JWT 토큰에서 추출한 사용자 ID
        
    Returns:
        dict: 성공 메시지
    """
    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"name": name}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    return {"success": True, "message": "프로필 업데이트 완료"}
