import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.db.connection import check_connection
from app.api.trends import router as trends_router
from app.api.chat import router as chat_router, close_parlant_server
from app.api.community import router as community_router
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
        "http://192.168.129.32:5173",  # Vite 개발 서버 (네트워크 IP)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(trends_router)
app.include_router(community_router, prefix="/api/community", tags=["community"])
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
