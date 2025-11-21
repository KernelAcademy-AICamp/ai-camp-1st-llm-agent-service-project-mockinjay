"""
UTI API 엔드포인트 테스트 스크립트

이 스크립트는 구현된 UTI-001, UTI-003, UTI-004, UTI-005 기능을 테스트합니다.
"""
import sys
import os

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def test_imports():
    """모든 필요한 모듈이 import 가능한지 테스트"""
    print("=" * 80)
    print("Testing imports...")
    print("=" * 80)
    
    try:
        from app.models.notification import (
            NotificationCreate,
            NotificationResponse,
            NotificationSettings,
            NotificationSettingsUpdate
        )
        print("✓ Notification models imported successfully")
    except Exception as e:
        print(f"✗ Failed to import notification models: {e}")
        return False
    
    try:
        from app.models.user import UserCreate, UserResponse
        print("✓ User models imported successfully")
    except Exception as e:
        print(f"✗ Failed to import user models: {e}")
        return False
    
    try:
        from app.db.connection import (
            users_collection,
            notifications_collection,
            notification_settings_collection
        )
        print("✓ Database collections imported successfully")
    except Exception as e:
        print(f"✗ Failed to import database collections: {e}")
        return False
    
    try:
        from app.services import notification_service
        print("✓ Notification service imported successfully")
    except Exception as e:
        print(f"✗ Failed to import notification service: {e}")
        return False
    
    try:
        from app.api.header import router as header_router
        from app.api.footer import router as footer_router
        from app.api.notification import router as notification_router
        from app.api.error_handlers import (
            not_found_handler,
            internal_server_error_handler,
            validation_error_handler
        )
        print("✓ API routers and error handlers imported successfully")
    except Exception as e:
        print(f"✗ Failed to import API routers: {e}")
        return False
    
    print("\n✓ All imports successful!\n")
    return True


def test_models():
    """Pydantic 모델 생성 테스트"""
    print("=" * 80)
    print("Testing Pydantic models...")
    print("=" * 80)
    
    try:
        from app.models.notification import NotificationCreate, NotificationSettingsUpdate
        
        # NotificationCreate 테스트
        notif = NotificationCreate(
            user_id="test_user_123",
            type="quiz",
            message="새로운 퀴즈가 등록되었습니다!",
            link="/quiz/123"
        )
        print(f"✓ NotificationCreate model created: {notif.type}")
        
        # NotificationSettingsUpdate 테스트
        settings = NotificationSettingsUpdate(
            quiz_notification=True,
            community_reply_notification=False
        )
        print(f"✓ NotificationSettingsUpdate model created")
        
    except Exception as e:
        print(f"✗ Failed to create models: {e}")
        return False
    
    print("\n✓ All model tests passed!\n")
    return True


def test_api_routes():
    """API 라우트 정의 확인"""
    print("=" * 80)
    print("Testing API routes...")
    print("=" * 80)
    
    try:
        from app.api.header import router as header_router
        from app.api.footer import router as footer_router
        from app.api.notification import router as notification_router
        
        # Header routes
        print(f"✓ Header router prefix: {header_router.prefix}")
        print(f"  Routes: {[route.path for route in header_router.routes]}")
        
        # Footer routes
        print(f"✓ Footer router prefix: {footer_router.prefix}")
        print(f"  Routes: {[route.path for route in footer_router.routes]}")
        
        # Notification routes
        print(f"✓ Notification router prefix: {notification_router.prefix}")
        print(f"  Routes: {[route.path for route in notification_router.routes]}")
        
    except Exception as e:
        print(f"✗ Failed to test routes: {e}")
        return False
    
    print("\n✓ All route tests passed!\n")
    return True


def main():
    """메인 테스트 실행"""
    print("\n" + "=" * 80)
    print("UTI API Implementation Test Suite")
    print("=" * 80 + "\n")
    
    all_passed = True
    
    # Import 테스트
    if not test_imports():
        all_passed = False
    
    # Model 테스트
    if not test_models():
        all_passed = False
    
    # Route 테스트
    if not test_api_routes():
        all_passed = False
    
    # 최종 결과
    print("=" * 80)
    if all_passed:
        print("✓ ALL TESTS PASSED!")
    else:
        print("✗ SOME TESTS FAILED")
    print("=" * 80 + "\n")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
