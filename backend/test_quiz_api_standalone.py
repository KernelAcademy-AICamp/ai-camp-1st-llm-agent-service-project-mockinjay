"""
Quiz API 독립 테스트 서버
Pinecone 의존성 없이 Quiz API만 테스트
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 환경변수 설정
os.environ["UPSTAGE_API_KEY"] = "up_RZKXRUPu0OvJLWm6FQCh2xFtd9w1R"
os.environ["MONGODB_URI"] = "mongodb+srv://mongoplomo11:mongorFggh100k!@careguidetest.q1dopif.mongodb.net/?appName=careguidetest"

# Quiz API Router import
from app.api.quiz import router as quiz_router

# FastAPI 앱 생성
app = FastAPI(
    title="CareGuide Quiz API (Standalone)",
    description="Quiz Agent API 독립 테스트",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Quiz Router 등록
app.include_router(quiz_router, prefix="/api/quiz", tags=["Quiz"])


@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "ok",
        "message": "CareGuide Quiz API (Standalone)",
        "endpoints": [
            "POST /api/quiz/session/start",
            "POST /api/quiz/session/submit-answer",
            "POST /api/quiz/session/complete",
            "GET /api/quiz/stats",
            "GET /api/quiz/history"
        ]
    }


@app.get("/health")
async def health():
    """상세 헬스체크"""
    from pymongo import MongoClient

    health_status = {
        "status": "ok",
        "components": {}
    }

    # MongoDB 확인
    try:
        mongodb_uri = os.getenv("MONGODB_URI")
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=3000)
        client.admin.command('ping')
        health_status["components"]["mongodb"] = "ok"
        client.close()
    except Exception as e:
        health_status["components"]["mongodb"] = f"error: {str(e)}"
        health_status["status"] = "degraded"

    # Upstage API 확인
    api_key = os.getenv("UPSTAGE_API_KEY")
    if api_key:
        health_status["components"]["upstage_api"] = "configured"
    else:
        health_status["components"]["upstage_api"] = "missing"
        health_status["status"] = "degraded"

    return health_status


if __name__ == "__main__":
    import uvicorn
    print("\n" + "🚀"*40)
    print("Quiz API Standalone Server 시작")
    print("🚀"*40)
    print("\n📍 서버 주소: http://localhost:8000")
    print("📍 API 문서: http://localhost:8000/docs")
    print("📍 Health Check: http://localhost:8000/health")
    print("\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)
