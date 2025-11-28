from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
import logging
from Agent.nutrition.agent import NutritionAgent
from Agent.core.contracts import AgentRequest
from app.core.context_system import context_system

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/nutrition", tags=["Nutrition"])

# Global instances for nutrition agent
nutrition_agent = NutritionAgent()
session_manager = context_system.session_manager


@router.post("/analyze")
async def analyze_nutrition(
    session_id: str = Form(...),
    text: Optional[str] = Form(None),
    user_profile: str = Form("general"),
    image: Optional[UploadFile] = File(None)
):
    """
    Nutrition analysis API - Analyze text or image for nutrition information

    This endpoint is used by the frontend ChatPage to analyze food/nutrition queries.
    """
    logger.info(f"📝 Nutrition analysis request: session={session_id}, profile={user_profile}, has_text={bool(text)}, has_image={bool(image)}")

    # Validate that either text or image is provided
    if not text and not image:
        raise HTTPException(status_code=400, detail="Either text or image is required")

    # Check session
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    # 이미지가 있고, 실제 파일인 경우에만 base64로 인코딩
    image_data = None
    if image and image.filename:  # Check if image has a filename (actual file uploaded)
        import base64
        contents = await image.read()
        image_data = base64.b64encode(contents).decode('utf-8')
        logger.info(f"🖼️ Image uploaded: filename={image.filename}, size={len(image_data)} bytes (base64)")

    context = {
        "image_data": image_data,
        "has_image": image is not None and image.filename is not None,
        "user_profile": user_profile  # Pass user profile to agent
    }

    user_input = text or "음식 이미지 분석 요청"

    try:
        # Create AgentRequest for the nutrition agent
        request = AgentRequest(
            query=user_input,
            session_id=session_id,
            context=context,
            profile=user_profile
        )

        # Call nutrition agent with AgentRequest
        response = await nutrition_agent.process(request)

        logger.info(f"✅ Nutrition analysis complete: {response.status}")

        return {
            "success": response.status != "error",
            "agent_type": "nutrition",
            "result": {
                "response": response.answer,
                "status": response.status,
                "metadata": response.metadata,
                # Extract additional fields from metadata if available
                "nutritionData": response.metadata.get("nutrition_data") if response.metadata else None,
                "dishCandidates": response.metadata.get("dish_candidates") if response.metadata else None,
                "recommendedDishes": response.metadata.get("recommended_dishes") if response.metadata else None,
                "ingredientCandidates": response.metadata.get("ingredient_candidates") if response.metadata else None,
                "analysisType": response.metadata.get("analysis_type") if response.metadata else None
            }
        }

    except Exception as e:
        logger.error(f"❌ Nutrition analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
