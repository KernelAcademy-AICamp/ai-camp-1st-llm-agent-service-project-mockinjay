import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import sys
from pathlib import Path
import logging
from dotenv import load_dotenv
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Load environment variables from .env file
load_dotenv()

# Add backend directory to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.db.connection import check_connection
from app.api.trends import router as trends_router
from app.api.chat import router as chat_router, close_parlant_server
from app.api.community import router as community_router
from app.api.quiz import router as quiz_router
from app.api.header import router as header_router
from app.api.footer import router as footer_router
from app.api.notification import router as notification_router
from app.api.error_handlers import (
    not_found_handler,
    internal_server_error_handler,
    validation_error_handler
)
import logging
from app.api import auth, user

# Import NutritionAgent for nutrition endpoint
from Agent.nutrition.agent import NutritionAgent
from Agent.session_manager import SessionManager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Application starting up...")
    yield
    # Cleanup on shutdown
    await close_parlant_server()
    logger.info("Application shutting down...")


app = FastAPI(
    title="CareGuide API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite 개발 서버 (localhost)
        "http://localhost:5174",  # Vite 개발 서버 (localhost - alternative port)
        "http://192.168.129.32:5173",  # Vite 개발 서버 (네트워크 IP)
        "http://192.168.129.32:5174",  # Vite 개발 서버 (네트워크 IP - alternative port)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances for nutrition agent
nutrition_agent = NutritionAgent()
session_manager = SessionManager()

# Include routers
app.include_router(chat_router)
app.include_router(trends_router)
app.include_router(community_router, prefix="/api/community", tags=["community"])
app.include_router(quiz_router, prefix="/api/quiz", tags=["quiz"])
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(header_router)
app.include_router(footer_router)
app.include_router(notification_router)

# Error handlers (UTI-005)
app.add_exception_handler(StarletteHTTPException, not_found_handler)
app.add_exception_handler(Exception, internal_server_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)


@app.get("/")
def root():
    return {"message": "CareGuide API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-check")
async def database_check():
    """MongoDB 연결 상태 확인"""
    return await check_connection()

@app.get("/test/error/500")
def test_server_error():
    """500 에러 테스트용 엔드포인트"""
    raise Exception("의도적인 500 에러 테스트")


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
    session_id: str = Form(...),
    text: Optional[str] = Form(None),
    user_profile: str = Form("general"),  # Add user profile parameter (general, patient, researcher)
    image: Optional[UploadFile] = File(None)
):
    """영양 분석 API - 텍스트 또는 이미지 분석"""

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
