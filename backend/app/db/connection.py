from pymongo import MongoClient
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# MongoDB 연결 설정
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "careguide")

# MongoDB 클라이언트 생성
client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
users_collection = db["users"]
chat_messages_collection = db["chat_messages"]
nutri_records_collection = db["nutri_records"]
posts_collection = db["posts"]
comments_collection = db["comments"]

def get_database():
    """데이터베이스 인스턴스 반환"""
    return db

def check_connection():
    """MongoDB 연결 테스트"""
    try:
        client.admin.command('ping')
        return {"status": "success", "message": "MongoDB 연결 성공"}
    except Exception as e:
        return {"status": "error", "message": f"MongoDB 연결 실패: {str(e)}"}
