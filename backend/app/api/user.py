from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user
from app.models.user import UserUpdate
from app.db.connection import get_users_collection
from bson import ObjectId

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    """
    현재 로그인한 사용자의 프로필 정보를 조회합니다.

    Args:
        user_id: JWT 토큰에서 추출한 사용자 ID

    Returns:
        dict: 사용자 프로필 정보
    """
    user = await get_users_collection().find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "profile": user["profile"],
        "role": user.get("role", "user"),  # 기존 사용자를 위한 기본값
        "gender": user.get("gender"),
        "birth_date": user.get("birth_date"),
        "height": user.get("height"),
        "weight": user.get("weight"),
        "diagnosis": user.get("diagnosis")
    }

@router.put("/profile")
async def update_profile(user_update: UserUpdate, user_id: str = Depends(get_current_user)):
    """
    현재 로그인한 사용자의 프로필 정보를 수정합니다.

    Args:
        user_update: 수정할 사용자 정보 (이름, 성별, 생년월일, 키, 체중, 진단명)
        user_id: JWT 토큰에서 추출한 사용자 ID

    Returns:
        dict: 성공 메시지
    """
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}

    if not update_data:
        return {"success": True, "message": "변경할 내용이 없습니다"}

    result = await get_users_collection().update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    return {"success": True, "message": "프로필 업데이트 완료"}
