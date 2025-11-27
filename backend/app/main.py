import os
import sys
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Load environment variables from .env file
load_dotenv()

# Add backend directory to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.db.connection import Database, check_connection, init_legacy_collections
from app.db.indexes import create_indexes
from app.api.chat import close_parlant_server
from app.api.careguide import router as careguide_router
from app.api.error_handlers import (
    not_found_handler,
    internal_server_error_handler,
    validation_error_handler
)
from app.middleware.auth import AuthenticationMiddleware

# Import NutritionAgent for nutrition endpoint
# Import NutritionAgent for nutrition endpoint (Moved to diet.py)
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
    ],
    expose_headers=["Content-Length", "X-Request-ID"],
    max_age=600,  # Preflight 요청 캐시 시간 (초)
)

# Authentication Middleware
# Note: Add this after CORS middleware
app.add_middleware(AuthenticationMiddleware)


from app.core.context_system import context_system
session_manager = context_system.session_manager



# Include routers
# Include CareGuide Master Router
app.include_router(careguide_router)

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


# Session endpoints moved to app.api.session
# Nutrition analysis endpoint moved to app.api.diet
