"""
MongoDB 연결 및 컬렉션 관리 (Motor - 비동기)
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    """MongoDB 데이터베이스 연결 관리 클래스"""

    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

    @classmethod
    async def connect(cls):
        """MongoDB 연결 초기화"""
        try:
            cls.client = AsyncIOMotorClient(settings.mongodb_uri)
            cls.db = cls.client[settings.db_name]
            # 연결 테스트
            await cls.client.admin.command('ping')
            logger.info(f"MongoDB 연결 성공: {settings.db_name}")
        except Exception as e:
            logger.error(f"MongoDB 연결 실패: {str(e)}")
            raise

    @classmethod
    async def disconnect(cls):
        """MongoDB 연결 종료"""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB 연결 종료")

    @classmethod
    def get_collection(cls, name: str) -> AsyncIOMotorCollection:
        """컬렉션 반환"""
        if cls.db is None:
            raise RuntimeError("Database not initialized. Call Database.connect() first.")
        return cls.db[name]


# 컬렉션 getter 함수들
def get_users_collection() -> AsyncIOMotorCollection:
    """사용자 컬렉션 반환"""
    return Database.get_collection("users")


def get_notifications_collection() -> AsyncIOMotorCollection:
    """알림 컬렉션 반환"""
    return Database.get_collection("notifications")


def get_notification_settings_collection() -> AsyncIOMotorCollection:
    """알림 설정 컬렉션 반환"""
    return Database.get_collection("notification_settings")


def get_diet_sessions_collection() -> AsyncIOMotorCollection:
    """식단 세션 컬렉션 반환"""
    return Database.get_collection("diet_sessions")


def get_diet_meals_collection() -> AsyncIOMotorCollection:
    """식사 기록 컬렉션 반환"""
    return Database.get_collection("diet_meals")


def get_diet_goals_collection() -> AsyncIOMotorCollection:
    """식단 목표 컬렉션 반환"""
    return Database.get_collection("diet_goals")


def get_bookmarks_collection() -> AsyncIOMotorCollection:
    """북마크 컬렉션 반환"""
    return Database.get_collection("bookmarks")


# 하위 호환성을 위한 전역 변수 (점진적 마이그레이션용)
# 주의: 이 변수들은 비동기 컨텍스트에서만 사용해야 합니다
users_collection = None
notifications_collection = None
notification_settings_collection = None
diet_sessions_collection = None
diet_meals_collection = None
diet_goals_collection = None
bookmarks_collection = None


def init_legacy_collections():
    """레거시 컬렉션 변수 초기화 (하위 호환성용)"""
    global users_collection, notifications_collection, notification_settings_collection
    global diet_sessions_collection, diet_meals_collection, diet_goals_collection
    global bookmarks_collection
    users_collection = get_users_collection()
    notifications_collection = get_notifications_collection()
    notification_settings_collection = get_notification_settings_collection()
    diet_sessions_collection = get_diet_sessions_collection()
    diet_meals_collection = get_diet_meals_collection()
    diet_goals_collection = get_diet_goals_collection()
    bookmarks_collection = get_bookmarks_collection()


# 하위 호환성을 위한 db 객체 (Database.db를 직접 참조)
# 주의: connect() 호출 이후에만 사용 가능
class _DBProxy:
    """Database.db에 대한 프록시 객체"""
    def __getitem__(self, key):
        if Database.db is None:
            raise RuntimeError("Database not initialized. Call Database.connect() first.")
        return Database.db[key]

    def __getattr__(self, name):
        if Database.db is None:
            raise RuntimeError("Database not initialized. Call Database.connect() first.")
        return getattr(Database.db, name)


db = _DBProxy()


async def check_connection():
    """MongoDB 연결 상태 확인"""
    try:
        if Database.client is None:
            await Database.connect()
        # ping 명령으로 연결 확인
        await Database.client.admin.command('ping')
        return {
            "status": "success",
            "message": "MongoDB 연결 성공"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"MongoDB 연결 실패: {str(e)}"
        }
