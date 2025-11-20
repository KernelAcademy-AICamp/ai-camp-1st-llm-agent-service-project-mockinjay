"""
MongoDB 연결 및 컬렉션 관리
"""
from pymongo import MongoClient
from pymongo.collection import Collection
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB 연결 설정
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = "careguide"

# MongoDB 클라이언트 초기화
client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

# 컬렉션 정의
users_collection: Collection = db["users"]
notifications_collection: Collection = db["notifications"]
notification_settings_collection: Collection = db["notification_settings"]


def check_connection():
    """MongoDB 연결 상태 확인"""
    try:
        # ping 명령으로 연결 확인
        client.admin.command('ping')
        return {
            "status": "success",
            "message": "MongoDB 연결 성공"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"MongoDB 연결 실패: {str(e)}"
        }
