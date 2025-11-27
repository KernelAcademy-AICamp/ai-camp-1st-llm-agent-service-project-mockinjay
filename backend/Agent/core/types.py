"""
에이전트 타입 정의
"""

from enum import Enum


class AgentType(Enum):
    """에이전트 실행 타입"""
    LOCAL = "local"      # 로컬에서 직접 실행
    REMOTE = "remote"    # 원격 서버 (HTTP 통신)


class QueryIntent(Enum):
    """질문 의도 타입"""
    NUTRITION = "nutrition"
    RESEARCH = "research_paper"
    WELFARE = "medical_welfare"
    QUIZ = "quiz"
    TREND = "trend_visualization"
    MULTI = "multi"  # 복합 질문
