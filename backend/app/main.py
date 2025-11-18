import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.connection import check_connection
from app.api.trends import router as trends_router
from app.api.chat import router as chat_router, close_parlant_server
import logging
from app.api import auth, user

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and shutdown for the FastAPI application.
    
    On entry logs a startup message and yields control for the application to run. On exit it closes the parlant server and logs a shutdown message.
    """
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


@app.get("/")
def root():
    """
    Return basic application metadata for the root endpoint.
    
    Returns:
        dict: A mapping with keys "message" set to "CareGuide API" and "version" set to "1.0.0".
    """
    return {"message": "CareGuide API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """
    Report API health status.
    
    Returns:
        dict: Mapping with key "status" set to "healthy".
    """
    return {"status": "healthy"}


@app.get("/db-check")
async def database_check():
    """
    Check MongoDB connection status.
    
    Returns:
        bool: `True` if the MongoDB connection is healthy, `False` otherwise.
    """
    return await check_connection()
    return check_connection()

# 라우터 등록
app.include_router(auth.router)
app.include_router(user.router)