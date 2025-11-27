"""
커스텀 예외 정의
"""

from typing import Optional, Any


class AgentError(Exception):
    """
    에이전트 예외 기본 클래스
    
    모든 에이전트 예외는 이 클래스를 상속해야 함
    """
    
    def __init__(
        self,
        message: str,
        error_code: str = None,
        original_error: Exception = None,
        metadata: dict = None
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.original_error = original_error
        self.metadata = metadata or {}
    
    def to_dict(self) -> dict:
        """예외를 딕셔너리로 변환 (로깅, API 응답용)"""
        return {
            "error_type": self.__class__.__name__,
            "error_code": self.error_code,
            "message": self.message,
            "metadata": self.metadata,
            "original_error": str(self.original_error) if self.original_error else None
        }


# 인프라 계층 예외
class InfrastructureError(AgentError):
    """인프라 계층 오류"""
    pass


class DatabaseConnectionError(InfrastructureError):
    """데이터베이스 연결 오류"""
    def __init__(self, message: str, db_type: str = None, original_error: Exception = None):
        super().__init__(
            message,
            error_code="DB_CONNECTION_ERROR",
            original_error=original_error,
            metadata={"db_type": db_type}
        )


class ExternalServiceError(InfrastructureError):
    """외부 서비스 오류"""
    def __init__(self, message: str, service: str, original_error: Exception = None):
        super().__init__(
            message,
            error_code="EXTERNAL_SERVICE_ERROR",
            original_error=original_error,
            metadata={"service": service}
        )


# 에이전트 계층 예외
class AgentNotFoundException(AgentError):
    """에이전트를 찾을 수 없음"""
    def __init__(self, agent_type: str):
        super().__init__(
            f"Agent '{agent_type}' not found",
            error_code="AGENT_NOT_FOUND",
            metadata={"agent_type": agent_type}
        )


class AgentServerUnavailableError(AgentError):
    """에이전트 서버 연결 불가"""
    def __init__(self, message: str, agent_type: str = None, original_error: Exception = None):
        super().__init__(
            message,
            error_code="AGENT_SERVER_UNAVAILABLE",
            original_error=original_error,
            metadata={"agent_type": agent_type}
        )


class AgentTimeoutError(AgentError):
    """에이전트 타임아웃"""
    def __init__(self, message: str, timeout_seconds: float = None, original_error: Exception = None):
        super().__init__(
            message,
            error_code="AGENT_TIMEOUT",
            original_error=original_error,
            metadata={"timeout_seconds": timeout_seconds}
        )


class AgentResponseParseError(AgentError):
    """에이전트 응답 파싱 에러"""
    def __init__(self, message: str, events: list = None, original_error: Exception = None):
        super().__init__(
            message,
            error_code="AGENT_RESPONSE_PARSE_ERROR",
            original_error=original_error,
            metadata={"event_count": len(events) if events else 0}
        )
        self.events = events


class AgentCircuitOpenError(AgentError):
    """서킷 브레이커 오픈"""
    def __init__(self, message: str, agent_type: str = None):
        super().__init__(
            message,
            error_code="AGENT_CIRCUIT_OPEN",
            metadata={"agent_type": agent_type}
        )


class AgentServerError(AgentError):
    """서버 5xx 에러"""
    pass


class AgentSessionNotFoundError(AgentError):
    """세션 없음"""
    pass


class AgentHTTPError(AgentError):
    """기타 HTTP 에러"""
    pass


class AgentExecutionError(AgentError):
    """에이전트 실행 에러"""
    pass


# 비즈니스 로직 예외
class IntentClassificationError(AgentError):
    """의도 분류 실패"""
    def __init__(self, message: str, user_input: str = None, original_error: Exception = None):
        super().__init__(
            message,
            error_code="INTENT_CLASSIFICATION_ERROR",
            original_error=original_error,
            metadata={"input_length": len(user_input) if user_input else 0}
        )


class ResponseAggregationError(AgentError):
    """응답 통합 실패"""
    def __init__(self, message: str, num_results: int = None, original_error: Exception = None):
        super().__init__(
            message,
            error_code="RESPONSE_AGGREGATION_ERROR",
            original_error=original_error,
            metadata={"num_results": num_results}
        )


class SessionNotFoundError(AgentError):
    """세션을 찾을 수 없음"""
    pass


class SessionCreationNotAllowedError(AgentError):
    """세션 생성이 허용되지 않음"""
    pass
