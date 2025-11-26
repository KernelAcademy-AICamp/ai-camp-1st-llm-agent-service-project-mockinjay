"""
Agent Execution Type Enum
로컬 실행 vs 원격 실행 구분
"""

from enum import Enum


class ExecutionType(Enum):
    """Agent execution type"""
    LOCAL = "local"      # 로컬 실행 (Python 프로세스 내)
    REMOTE = "remote"    # 원격 실행 (Parlant 서버 HTTP 통신)
