import os
import sys
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Optional

# Load environment variables from .env file
load_dotenv()

# Add backend directory to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.db.connection import Database, check_connection, init_legacy_collections
from app.db.indexes import create_indexes
from app.api.chat import close_parlant_server
from app.api.careguide import router as careguide_router
from app.api.clinical_trials import router as clinical_trials_router
from app.api.terms import router as terms_router
from app.api.diet_care import router as diet_care_router
from app.api.news import router as news_router
from app.api.error_handlers import (
    not_found_handler,
    internal_server_error_handler,
    validation_error_handler
)
from app.middleware.auth import AuthenticationMiddleware
from app.api import auth, user
from app.api import user_health_records
from app.api.community import router as community_router
from app.api.header import router as header_router
from app.api.footer import router as footer_router
from app.api.notification import router as notification_router

# Import NutritionAgent for nutrition endpoint
from Agent.nutrition.agent import NutritionAgent
from Agent.session_manager import SessionManager

# Setup logging
from app.logging_config import setup_logging

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Application starting up...")
    # Initialize MongoDB connection
    await Database.connect()
    # Initialize legacy collection variables for backward compatibility
    init_legacy_collections()
    # Create database indexes
    await create_indexes(Database.db)
    logger.info("Database initialized with indexes")

    yield

    # Cleanup on shutdown
    await close_parlant_server()
    await Database.disconnect()
    logger.info("Application shutting down...")


app = FastAPI(
    title="CareGuide API",
    version="1.0.0",
    lifespan=lifespan
)

# Mount static files directory
uploads_dir = backend_path / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# CORS 설정 - 환경변수 기반
from app.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # 환경변수에서 읽어옴
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
        "X-CSRF-Token",
    ],
    expose_headers=["Content-Length", "X-Request-ID"],
    max_age=600,  # Preflight 요청 캐시 시간 (초)
)

# Authentication Middleware
# Note: Add this after CORS middleware
app.add_middleware(AuthenticationMiddleware)


from app.core.context_system import context_system
session_manager = context_system.session_manager

# Global nutrition agent instance
nutrition_agent = NutritionAgent()


# Include routers
# Include CareGuide Master Router (contains all main API routes)
app.include_router(careguide_router)

# Include additional routers from PR #25
app.include_router(clinical_trials_router)
app.include_router(terms_router)
app.include_router(diet_care_router)
app.include_router(news_router)
app.include_router(community_router, prefix="/api/community", tags=["community"])
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(user_health_records.router)
app.include_router(header_router)
app.include_router(footer_router)
app.include_router(notification_router)

# Error handlers (UTI-005)
# app.add_exception_handler(StarletteHTTPException, not_found_handler)  # Removed: This converts all HTTP errors to 404
app.add_exception_handler(Exception, internal_server_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)


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


@app.get("/test/error/500")
def test_server_error():
    """500 에러 테스트용 엔드포인트"""
    raise Exception("의도적인 500 에러 테스트")


# Session endpoints moved to app.api.session
# Nutrition analysis endpoint - kept for backward compatibility
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
