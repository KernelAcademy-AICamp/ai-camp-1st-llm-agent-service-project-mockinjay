from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.connection import check_connection

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
