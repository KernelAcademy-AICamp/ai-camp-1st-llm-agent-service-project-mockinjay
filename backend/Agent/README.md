# Agent System - 4개 의료 에이전트 시스템

## 개요
이 시스템은 4개의 특화된 의료 에이전트를 제공합니다:

1. **Research Paper Agent** - healthcare_v2_en.py와 동일한 기능 제공
2. **Medical Welfare Agent** - 의료 복지 정보 제공
3. **Nutrition Agent** - 영양 및 식단 관리
4. **Trend Visualization Agent** - 데이터 트렌드 분석

## 폴더 구조

```
Agent/
├── core/                      # 핵심 공통 기능
│   ├── contracts.py          # 입출력 계약 (AgentRequest, AgentResponse)
│   └── policies.py           # 정책 엔진 (토큰 제한 관리)
│
├── api/                       # API 클라이언트 래퍼
│   ├── mongodb_client.py     # MongoDB 클라이언트
│   ├── vector_client.py      # Vector DB 클라이언트
│   ├── pubmed_client.py      # PubMed 클라이언트
│   └── openai_client.py      # OpenAI 클라이언트
│
├── research_paper/            # 연구논문 에이전트
│   └── agent.py              # healthcare_v2_en.py 동일 기능
│
├── medical_welfare/           # 의료복지 에이전트
│   └── agent.py
│
├── nutrition/                 # 영양 에이전트
│   └── agent.py
│
└── trend_visualization/       # 트렌드 시각화 에이전트
    └── agent.py
```

## 핵심 기능

### 1. Research Paper Agent
- healthcare_v2_en.py의 search_medical_qa 기능 완전 복제
- Hybrid Search (MongoDB + Pinecone)
- PubMed 논문 검색
- GPT 기반 답변 생성
- 다중 소스 통합 (QA, Papers, Medical, Guidelines)

### 2. Medical Welfare Agent
- 의료 복지 제도 정보 제공
- 지원 혜택 안내
- 신청 자격 및 방법 설명
- 프로필별 맞춤 정보

### 3. Nutrition Agent
- 영양 가이드라인 제공
- 식단 관리 조언
- 영양소 분석
- 제한사항 및 권장사항 제공

### 4. Trend Visualization Agent
- 데이터 트렌드 분석
- 차트 데이터 생성
- 카테고리별 분포 분석
- 시각화 설정 제공

## 사용 방법

### 기본 사용 예제

```python
import asyncio
from Agent.research_paper.agent import ResearchPaperAgent

async def main():
    agent = ResearchPaperAgent()

    result = await agent.process(
        user_input="chronic kidney disease treatment",
        session_id="session-001",
        context={'profile': 'general', 'language': 'en'}
    )

    print(f"Answer: {result['answer']}")
    print(f"Sources: {len(result['sources'])}")
    print(f"Papers: {len(result['papers'])}")

    await agent.close()

asyncio.run(main())
```

### AgentManager 사용

```python
from Agent.agent_manager import AgentManager

async def main():
    manager = AgentManager()

    # Research Paper Agent 사용
    result = await manager.route_request(
        agent_type="research_paper",
        user_input="diabetes research",
        session_id="session-001"
    )

    print(result)

asyncio.run(main())
```

## 테스트 실행

```bash
cd backend
python -m Agent.test_agents
```

## 통합 방식

### 기존 코드 재사용
- API 클라이언트를 통해 기존 서비스 래핑
- OptimizedMongoDBManager, OptimizedVectorDBManager 활용
- OptimizedHybridSearchEngine 직접 사용

### 통일된 인터페이스
- AgentRequest: 모든 에이전트 입력 통일
- AgentResponse: 모든 에이전트 출력 통일
- 공통 기반 클래스 (BaseAgent) 상속

### 정책 관리
- PolicyEngine: 세션별 토큰 제한 관리
- 자동 만료 세션 정리
- 사용량 추적

## 주요 특징

1. **healthcare_v2_en.py 호환성**
   - Research Paper Agent가 동일한 기능 제공
   - 동일한 검색 품질 및 성능

2. **확장 가능성**
   - 새 에이전트 추가 용이
   - 모듈화된 구조
   - 독립적인 에이전트 운영

3. **효율성**
   - 기존 최적화된 코드 재사용
   - 중복 제거
   - 래퍼 패턴으로 유지보수성 향상

4. **통합 관리**
   - AgentManager를 통한 중앙 관리
   - 세션 및 컨텍스트 관리
   - 정책 기반 사용량 제한

## 환경 변수

필요한 환경 변수:
```
MONGODB_URI=mongodb://localhost:27017
PINECONE_API_KEY=your_pinecone_key
OPENAI_API_KEY=your_openai_key
PUBMED_EMAIL=your_email
NCBI_API_KEY=your_ncbi_key (선택)
```

## 의존성

- OpenAI
- MongoDB (Motor)
- Pinecone
- Sentence Transformers
- Other dependencies from existing services

## 라이센스

프로젝트 라이센스 참조
