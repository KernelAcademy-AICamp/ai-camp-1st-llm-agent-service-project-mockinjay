"""
Agent Contracts - 통일된 에이전트 입출력 계약
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime


class AgentRequest(BaseModel):
    """통일된 에이전트 요청"""
    query: str = Field(..., description="사용자 질문")
    session_id: str = Field(..., description="세션 ID")
    context: Dict[str, Any] = Field(default_factory=dict, description="추가 컨텍스트")
    profile: str = Field(default="general", description="사용자 프로필")
    language: str = Field(default="ko", description="언어 설정")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "query": "당뇨병 최신 연구 논문을 찾아줘",
                "session_id": "session-12345",
                "context": {"previous_queries": []},
                "profile": "patient",
                "language": "ko"
            }
        }


class AgentResponse(BaseModel):
    """통일된 에이전트 응답"""
    answer: str = Field(..., description="생성된 답변")
    sources: List[Dict] = Field(default_factory=list, description="참조 소스")
    papers: List[Dict] = Field(default_factory=list, description="논문 검색 결과")
    tokens_used: int = Field(default=0, description="사용된 토큰 수")
    status: str = Field(default="success", description="처리 상태")
    agent_type: str = Field(..., description="에이전트 타입")
    metadata: Dict = Field(default_factory=dict, description="추가 메타데이터")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "answer": "당뇨병에 대한 최신 연구 결과를 찾았습니다...",
                "sources": [{"title": "...", "url": "..."}],
                "papers": [{"title": "...", "authors": "..."}],
                "tokens_used": 1500,
                "status": "success",
                "agent_type": "research_paper",
                "metadata": {"total_results": 10}
            }
        }
