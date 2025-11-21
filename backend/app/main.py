from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import sys
from pathlib import Path
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add backend directory to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.db.connection import check_connection

# Import only NutritionAgent to avoid dependency issues
from Agent.nutrition.agent import NutritionAgent
from Agent.session_manager import SessionManager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CareGuide API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
nutrition_agent = NutritionAgent()
session_manager = SessionManager()

@app.get("/")
def root():
    return {"message": "CareGuide API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/db-check")
def database_check():
    """MongoDB 연결 상태 확인"""
    return check_connection()

@app.post("/api/session/create")
async def create_session(user_id: str = "default_user"):
    """새로운 세션 생성"""
    session_id = session_manager.create_session(user_id)
    session = session_manager.get_session(session_id)
    return {
        "session_id": session_id,
        "user_id": user_id,
        "status": "created",
        "created_at": session["created_at"].isoformat() if session else None
    }

@app.post("/api/nutrition/analyze")
async def analyze_nutrition(
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    session_id: str = Form(...),
    user_profile: str = Form("general")  # Add user profile parameter (general, patient, researcher)
):
    """영양 분석 API - 텍스트 또는 이미지 분석"""

    logger.info(f"📝 Nutrition analysis request: session={session_id}, profile={user_profile}, has_text={bool(text)}, has_image={bool(image)}")

    if not text and not image:
        raise HTTPException(status_code=400, detail="Either text or image is required")

    # Check session
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    # 이미지가 있으면 base64로 인코딩
    image_data = None
    if image:
        import base64
        contents = await image.read()
        image_data = base64.b64encode(contents).decode('utf-8')
        logger.info(f"🖼️ Image uploaded: {len(image_data)} bytes (base64)")

    context = {
        "image_data": image_data,
        "has_image": image is not None,
        "user_profile": user_profile  # Pass user profile to agent
    }

    user_input = text or "음식 이미지 분석 요청"

    try:
        # Call nutrition agent
        result = await nutrition_agent.process(
            user_input=user_input,
            session_id=session_id,
            context=context
        )

        logger.info(f"✅ Nutrition analysis complete: {result.get('status')}")

        return {
            "success": True,
            "agent_type": "nutrition",
            "result": result
        }

    except Exception as e:
        logger.error(f"❌ Nutrition analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
