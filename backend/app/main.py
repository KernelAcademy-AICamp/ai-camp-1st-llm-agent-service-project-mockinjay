from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.connection import check_connection
from app.api import auth, user

app = FastAPI(title="CareGuide API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# 라우터 등록
app.include_router(auth.router)
app.include_router(user.router)
