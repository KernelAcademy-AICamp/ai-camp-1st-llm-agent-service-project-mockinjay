# jh 개발 계획 (Knowledge Search & Trends)

> AI 챗봇 지식 검색 및 트렌드 대시보드

## 담당 기능
- Knowledge Search (AI 챗봇, PubMed 검색)
- Trends (논문 트렌드, 대시보드)

## 의존성
- **jk의 작업**: 인증 API, API Client, UserContext (Week 2 완료 후 시작)
- **기존 코드**: Archive.zip의 Parlant 코드 활용

## 개발 순서

### Week 3-4: Knowledge Search (채팅)

#### 1. 벡터 DB 설정 (MongoDB Vector Search)

**파일**: `backend/app/db/connection.py` (추가)
```python
# MongoDB Vector Search를 위한 컬렉션
papers_collection = db["papers"]  # 논문 데이터 + 임베딩

# Vector Search 인덱스 생성 (MongoDB Atlas에서 수동 생성 필요)
# Index 이름: "vector_index"
# Field: "embedding"
# Dimensions: 1536 (OpenAI text-embedding-3-small)
# Similarity: cosine
```

**인덱스 생성 가이드**:
1. MongoDB Atlas 접속
2. Database → Search → Create Search Index
3. JSON Editor 선택:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "pmid"
    }
  ]
}
```

**체크리스트**:
- [ ] MongoDB Atlas 계정 생성
- [ ] Vector Search 인덱스 생성
- [ ] 논문 컬렉션 준비

#### 2. 논문 임베딩 생성

**파일**: `backend/app/services/embeddings.py`
```python
import openai
import os
from typing import List

openai.api_key = os.getenv("OPENAI_API_KEY")

class EmbeddingService:
    MODEL = "text-embedding-3-small"
    
    def create_embedding(self, text: str) -> List[float]:
        """텍스트를 벡터로 변환"""
        response = openai.Embedding.create(
            model=self.MODEL,
            input=text
        )
        return response['data'][0]['embedding']
    
    def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """여러 텍스트를 한 번에 벡터로 변환"""
        response = openai.Embedding.create(
            model=self.MODEL,
            input=texts
        )
        return [item['embedding'] for item in response['data']]
```

**논문 데이터 준비 스크립트**:
```python
# backend/scripts/prepare_papers.py
from app.db.connection import papers_collection
from app.services.embeddings import EmbeddingService
import json

def load_and_embed_papers():
    """Archive.zip의 논문 데이터를 로드하고 임베딩 생성"""
    embedding_service = EmbeddingService()
    
    # 기존 논문 데이터 로드
    with open('data/preprocess/unified_output/paper_dataset_enriched_s2_checkpoint_4850.jsonl', 'r') as f:
        papers = [json.loads(line) for line in f]
    
    # 각 논문에 대해 임베딩 생성
    for i, paper in enumerate(papers):
        if i % 10 == 0:
            print(f"Processing {i}/{len(papers)}")
        
        # 제목 + 초록으로 텍스트 생성
        text = f"{paper['title']} {paper.get('abstract', '')}"
        
        # 임베딩 생성
        embedding = embedding_service.create_embedding(text)
        
        # MongoDB에 저장
        paper_doc = {
            "title": paper['title'],
            "abstract": paper.get('abstract', ''),
            "authors": paper.get('metadata', {}).get('authors', []),
            "journal": paper.get('metadata', {}).get('journal', ''),
            "doi": paper.get('metadata', {}).get('doi', ''),
            "keywords": paper.get('metadata', {}).get('keywords', []),
            "embedding": embedding  # 벡터 (1536 dimensions)
        }
        
        papers_collection.insert_one(paper_doc)

if __name__ == "__main__":
    load_and_embed_papers()
```

**실행**:
```bash
cd backend
python scripts/prepare_papers.py
```

**체크리스트**:
- [ ] OpenAI API 키 설정
- [ ] 임베딩 서비스 작성
- [ ] 논문 데이터 임베딩 생성
- [ ] MongoDB에 저장 (4,850개 논문)

#### 3. 벡터 검색 모듈

**파일**: `backend/app/services/vector_search.py`
```python
from app.db.connection import papers_collection
from app.services.embeddings import EmbeddingService
from typing import List, Dict

class VectorSearch:
    def __init__(self):
        self.embedding_service = EmbeddingService()
    
    def search_papers(self, query: str, limit: int = 5) -> List[Dict]:
        """의미론적 논문 검색"""
        # 쿼리를 벡터로 변환
        query_embedding = self.embedding_service.create_embedding(query)
        
        # MongoDB Vector Search
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": 100,
                    "limit": limit
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "title": 1,
                    "abstract": 1,
                    "authors": 1,
                    "journal": 1,
                    "doi": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        results = list(papers_collection.aggregate(pipeline))
        return results
```

**체크리스트**:
- [ ] 벡터 검색 모듈 작성
- [ ] MongoDB aggregation pipeline 테스트
- [ ] 검색 결과 확인

#### 4. PubMed 검색 모듈 (실시간 검색)

**파일**: `backend/app/services/pubmed.py`
```python
import requests
from typing import List, Dict
import xml.etree.ElementTree as ET

class PubMedSearch:
    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    
    def search(self, query: str, max_results: int = 10) -> List[str]:
        """PubMed에서 논문 ID 검색"""
        url = f"{self.BASE_URL}esearch.fcgi"
        params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "retmode": "json"
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        return data.get("esearchresult", {}).get("idlist", [])
    
    def fetch_summaries(self, pmids: List[str]) -> List[Dict]:
        """논문 요약 정보 가져오기"""
        if not pmids:
            return []
        
        url = f"{self.BASE_URL}esummary.fcgi"
        params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "json"
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        results = []
        for pmid in pmids:
            if pmid in data.get("result", {}):
                paper = data["result"][pmid]
                results.append({
                    "pmid": pmid,
                    "title": paper.get("title", ""),
                    "authors": [
                        author.get("name", "") 
                        for author in paper.get("authors", [])
                    ],
                    "journal": paper.get("source", ""),
                    "pub_date": paper.get("pubdate", ""),
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                })
        
        return results
    
    def search_and_fetch(self, query: str, max_results: int = 10) -> List[Dict]:
        """검색 및 요약 한 번에"""
        pmids = self.search(query, max_results)
        return self.fetch_summaries(pmids)
```

**체크리스트**:
- [ ] PubMed API 연동
- [ ] 논문 ID 검색
- [ ] 논문 요약 가져오기
- [ ] 테스트

#### 5. 챗봇 API (벡터 검색 + PubMed 통합)

**파일**: `backend/app/api/chat.py`
```python
from fastapi import APIRouter, Depends
from app.services.pubmed import PubMedSearch
from app.services.vector_search import VectorSearch
from app.services.auth import get_current_user
from app.db.connection import db
from datetime import datetime
from typing import List
import openai
import os

router = APIRouter(prefix="/api/chat", tags=["chat"])
pubmed = PubMedSearch()
vector_search = VectorSearch()

# OpenAI API 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

@router.post("/message")
async def send_message(
    message: str,
    user_id: str = Depends(get_current_user)
):
    """메시지 전송 및 응답 생성"""
    
    # 1. 벡터 검색으로 저장된 논문 검색 (의미론적 검색)
    local_papers = vector_search.search_papers(message, limit=3)
    
    # 2. PubMed 실시간 검색 (키워드 검색)
    pubmed_papers = []
    if len(message) > 3:
        pubmed_papers = pubmed.search_and_fetch(message, max_results=2)
    
    # 3. 논문 정보 통합
    all_papers = []
    
    # 로컬 논문 (벡터 검색 결과)
    for paper in local_papers:
        all_papers.append({
            "title": paper["title"],
            "abstract": paper.get("abstract", "")[:200],  # 200자 제한
            "journal": paper.get("journal", ""),
            "source": "Local DB",
            "relevance": f"{paper.get('score', 0):.2f}"
        })
    
    # PubMed 논문 (실시간 검색 결과)
    for paper in pubmed_papers:
        all_papers.append({
            "title": paper["title"],
            "journal": paper.get("journal", ""),
            "pub_date": paper.get("pub_date", ""),
            "url": paper.get("url", ""),
            "source": "PubMed"
        })
    
    # 4. OpenAI로 답변 생성
    context = ""
    if all_papers:
        context = "### 관련 논문 정보:\n\n"
        for i, paper in enumerate(all_papers[:5], 1):  # 최대 5개
            context += f"{i}. **{paper['title']}**\n"
            if paper.get('abstract'):
                context += f"   요약: {paper['abstract']}\n"
            if paper.get('journal'):
                context += f"   출처: {paper['journal']}"
            if paper.get('pub_date'):
                context += f" ({paper['pub_date']})"
            if paper.get('source'):
                context += f" [{paper['source']}]"
            if paper.get('relevance'):
                context += f" - 관련도: {paper['relevance']}"
            context += "\n\n"
    
    system_prompt = """당신은 만성콩팥병(CKD) 전문 상담 AI입니다.

역할:
- 환자와 보호자에게 과학적 근거 기반의 정확한 정보 제공
- 의료 논문 정보를 쉽게 설명
- 항상 친절하고 공감하는 태도

중요 원칙:
1. 제공된 논문 정보를 우선적으로 활용
2. 불확실한 정보는 명확히 표시
3. 응급 증상 시 즉시 의료진 상담 권고
4. 개인별 의료 조언은 절대 금지

답변 형식:
- 간결하고 이해하기 쉽게
- 논문 정보 활용 시 출처 명시
- 필요시 추가 검색 제안"""

    user_prompt = f"""사용자 질문: {message}

{context}

위 논문 정보를 참고하여 질문에 답변해주세요.
논문 정보를 인용할 때는 [출처: 논문 제목] 형식으로 표시하세요.

⚠️ 답변 끝에는 항상 다음 문구를 포함하세요:
"이 정보는 참고용이며 의학적 진단이나 치료를 대체할 수 없습니다. 증상이 있다면 반드시 의료진과 상담하세요."""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        answer = response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI Error: {e}")
        answer = "죄송합니다. 답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    
    # 5. 대화 기록 저장
    chat_record = {
        "user_id": user_id,
        "message": message,
        "response": answer,
        "papers": all_papers,
        "timestamp": datetime.utcnow()
    }
    db["chat_history"].insert_one(chat_record)
    
    return {
        "success": True,
        "response": answer,
        "papers": all_papers
    }

@router.get("/history")
async def get_history(
    limit: int = 20,
    user_id: str = Depends(get_current_user)
):
    """대화 이력 조회"""
    history = list(
        db["chat_history"]
        .find({"user_id": user_id})
        .sort("timestamp", -1)
        .limit(limit)
    )
    
    for item in history:
        item["id"] = str(item.pop("_id"))
    
    return {"success": True, "history": history}
```

**main.py에 라우터 추가**:
```python
from app.api import chat
app.include_router(chat.router)
```

**체크리스트**:
- [ ] 벡터 검색 통합
- [ ] PubMed 검색 통합
- [ ] OpenAI 답변 생성
- [ ] 논문 출처 표시
- [ ] 대화 기록 저장
- [ ] 대화 이력 조회 API

#### 6. 채팅 UI (논문 출처 표시 개선)

**파일**: `frontend/src/pages/Chat.tsx`
```typescript
import { useState, useEffect, useRef } from 'react';
import apiClient from '@/api/client';
import { Header } from '@/components/Layout/Header';

interface Paper {
  title: string;
  abstract?: string;
  journal?: string;
  pub_date?: string;
  url?: string;
  source: string;
  relevance?: string;
}

interface Message {
  chatMessageId: string;
  message: string;
  response: string;
  papers?: Paper[];
  timestamp: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = async () => {
    try {
      const response = await apiClient.get('/api/chat/history');
      setMessages(response.data.history.reverse());
    } catch (error) {
      console.error('이력 불러오기 실패', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/api/chat/message', null, {
        params: { message: input }
      });

      const newMessage = {
        chatMessageId: Date.now().toString(),
        message: input,
        response: response.data.response,
        papers: response.data.papers,
        timestamp: new Date().toISOString()
      };

      setMessages([...messages, newMessage]);
      setInput('');
    } catch (error) {
      alert('메시지 전송 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto mt-10 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">지식 검색</h1>
          <div className="flex gap-2 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              📚 4,850개 논문 DB
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              🔍 벡터 검색
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
              🌐 PubMed 실시간
            </span>
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="bg-white rounded shadow h-[650px] flex flex-col">
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-6xl mb-4">🩺</div>
                <p className="text-xl font-bold mb-2">만성콩팥병에 대해 무엇이든 물어보세요!</p>
                <p className="text-sm">벡터 검색으로 관련 논문을 찾고 AI가 답변합니다</p>
                <div className="mt-6 text-left max-w-md mx-auto">
                  <p className="font-bold mb-2">예시 질문:</p>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• GFR 45는 어떤 단계인가요?</li>
                    <li>• 투석 환자의 식단 관리는 어떻게 하나요?</li>
                    <li>• 신장이식 후 주의사항은?</li>
                  </ul>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id}>
                  {/* 사용자 메시지 */}
                  <div className="flex justify-end mb-4">
                    <div className="bg-blue-500 text-white p-4 rounded-lg max-w-[70%] shadow">
                      {msg.message}
                    </div>
                  </div>

                  {/* AI 응답 */}
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg max-w-[80%] shadow-sm border">
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.response}</div>
                      
                      {/* 관련 논문 */}
                      {msg.papers && msg.papers.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <p className="font-bold text-gray-700 mb-3 flex items-center">
                            <span className="text-xl mr-2">📚</span>
                            참고 논문 ({msg.papers.length}개)
                          </p>
                          <div className="space-y-3">
                            {msg.papers.map((paper, idx) => (
                              <div key={idx} className="bg-white p-3 rounded border border-gray-200 hover:border-blue-300 transition">
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className="font-medium text-sm text-gray-800 flex-1">
                                    {idx + 1}. {paper.title}
                                  </h4>
                                  <span className={`text-xs px-2 py-1 rounded ml-2 ${
                                    paper.source === 'Local DB' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {paper.source}
                                  </span>
                                </div>
                                
                                {paper.abstract && (
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                    {paper.abstract}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div>
                                    {paper.journal && <span>{paper.journal}</span>}
                                    {paper.pub_date && <span className="ml-2">({paper.pub_date})</span>}
                                    {paper.relevance && (
                                      <span className="ml-2 text-blue-600 font-medium">
                                        관련도: {paper.relevance}
                                      </span>
                                    )}
                                  </div>
                                  {paper.url && (
                                    <a
                                      href={paper.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      원문 보기 →
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="border-t bg-gray-50 p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="질문을 입력하세요... (예: 투석 환자의 식단은?)"
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              >
                {loading ? '검색 중...' : '전송'}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <span className="mr-1">⚠️</span>
              이 정보는 참고용이며 의학적 진단이나 치료를 대체할 수 없습니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
```

**체크리스트**:
- [ ] 개선된 채팅 UI
- [ ] 논문 출처 배지 (Local DB / PubMed)
- [ ] 관련도 점수 표시
- [ ] 논문 초록 미리보기
- [ ] 원문 링크
- [ ] 로딩 애니메이션
- [ ] 반응형 디자인

### Week 5-6: Trends (대시보드)

#### 4. 트렌드 데이터 API

**파일**: `backend/app/api/trends.py`
```python
from fastapi import APIRouter
from app.services.pubmed import PubMedSearch
from datetime import datetime, timedelta
from collections import Counter

router = APIRouter(prefix="/api/trends", tags=["trends"])
pubmed = PubMedSearch()

@router.get("/papers")
async def get_paper_trends(keyword: str = "chronic kidney disease"):
    """논문 트렌드 분석"""
    
    # 최근 6개월간 월별 논문 수
    trends = []
    for i in range(6):
        date = datetime.now() - timedelta(days=30 * i)
        year = date.year
        month = date.month
        
        # PubMed 검색 (날짜 필터)
        query = f"{keyword} AND {year}/{month:02d}[PDAT]"
        pmids = pubmed.search(query, max_results=1000)
        
        trends.append({
            "month": f"{year}-{month:02d}",
            "count": len(pmids)
        })
    
    trends.reverse()
    
    return {"success": True, "trends": trends}

@router.get("/keywords")
async def get_keyword_trends():
    """인기 키워드"""
    
    # Mock 데이터 (실제로는 DB에서)
    keywords = [
        {"keyword": "dialysis", "count": 1250},
        {"keyword": "transplantation", "count": 980},
        {"keyword": "hypertension", "count": 750},
        {"keyword": "diabetes", "count": 620},
        {"keyword": "proteinuria", "count": 540}
    ]
    
    return {"success": True, "keywords": keywords}

@router.get("/stats")
async def get_statistics():
    """전체 통계"""
    
    # Mock 데이터
    stats = {
        "total_papers": 45230,
        "total_users": 1250,
        "total_chats": 8930,
        "monthly_growth": 12.5
    }
    
    return {"success": True, "stats": stats}
```

**main.py에 라우터 추가**:
```python
from app.api import trends
app.include_router(trends.router)
```

**체크리스트**:
- [ ] 논문 트렌드 API
- [ ] 키워드 통계 API
- [ ] 전체 통계 API

#### 5. 트렌드 대시보드 UI

**파일**: `frontend/src/pages/Trends.tsx`
```typescript
import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { Header } from '@/components/Layout/Header';

export default function Trends() {
  const [paperTrends, setPaperTrends] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trendsRes, keywordsRes, statsRes] = await Promise.all([
        apiClient.get('/api/trends/papers'),
        apiClient.get('/api/trends/keywords'),
        apiClient.get('/api/trends/stats')
      ]);

      setPaperTrends(trendsRes.data.trends);
      setKeywords(keywordsRes.data.keywords);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('데이터 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-screen">
          <div className="text-xl">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto mt-10 p-6">
        <h1 className="text-3xl font-bold mb-6">트렌드 대시보드</h1>

        {/* 전체 통계 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 mb-2">전체 논문</p>
            <p className="text-3xl font-bold">{stats?.total_papers.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 mb-2">사용자</p>
            <p className="text-3xl font-bold">{stats?.total_users.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 mb-2">채팅</p>
            <p className="text-3xl font-bold">{stats?.total_chats.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600 mb-2">월간 성장률</p>
            <p className="text-3xl font-bold text-green-600">+{stats?.monthly_growth}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 논문 트렌드 차트 */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">논문 트렌드 (최근 6개월)</h2>
            <div className="space-y-2">
              {paperTrends.map((trend, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="w-24 text-sm">{trend.month}</span>
                  <div className="flex-1 bg-gray-200 rounded h-8">
                    <div
                      className="bg-blue-500 h-8 rounded"
                      style={{
                        width: `${(trend.count / Math.max(...paperTrends.map(t => t.count))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm">{trend.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 인기 키워드 */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">인기 키워드</h2>
            <div className="space-y-3">
              {keywords.map((kw, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-500">#{idx + 1}</span>
                    <span className="font-medium">{kw.keyword}</span>
                  </div>
                  <span className="text-sm text-gray-600">{kw.count} 논문</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="bg-blue-50 p-6 rounded mt-6">
          <h3 className="font-bold mb-2">📊 대시보드 정보</h3>
          <p className="text-sm text-gray-700">
            이 대시보드는 PubMed에서 수집한 만성콩팥병 관련 논문의 트렌드와 
            CareGuide 플랫폼의 사용 통계를 보여줍니다.
          </p>
        </div>
      </div>
    </>
  );
}
```

**체크리스트**:
- [ ] 전체 통계 카드
- [ ] 논문 트렌드 차트
- [ ] 인기 키워드 목록
- [ ] 반응형 레이아웃

## 완료 기준

### Backend
- [ ] **MongoDB Vector Search 설정 완료**
- [ ] **논문 임베딩 생성 (4,850개)**
- [ ] **벡터 검색 모듈 작동**
- [ ] PubMed 검색 모듈 작동
- [ ] 채팅 메시지 API 작동 (벡터 + PubMed 통합)
- [ ] OpenAI 연동 (GPT-3.5-turbo, text-embedding-3-small)
- [ ] 대화 이력 저장/조회
- [ ] 트렌드 API 작동
- [ ] JWT 인증 적용

### Frontend
- [ ] 개선된 채팅 UI 완성
- [ ] 실시간 메시지 전송/수신
- [ ] 논문 출처 구분 표시 (Local DB / PubMed)
- [ ] 관련도 점수 표시
- [ ] 논문 초록 미리보기
- [ ] 원문 링크 제공
- [ ] 대화 이력 표시
- [ ] 트렌드 대시보드 완성
- [ ] 차트 시각화

### 데이터
- [ ] Archive.zip의 논문 데이터 로드
- [ ] 4,850개 논문 임베딩 생성
- [ ] MongoDB에 벡터 데이터 저장
- [ ] Vector Search 인덱스 생성

### 통합
- [ ] jk의 인증 API와 연동
- [ ] Header 컴포넌트 사용
- [ ] API Client 사용

## 고급 기능 (선택)

### Parlant 통합 (Archive.zip 활용)
기존 `parlant/` 코드를 활용하여 더 정교한 AI 대화:
- 의도 분류
- 다중 데이터 소스 검색
- RAG (Retrieval Augmented Generation)

**참고 파일**:
- `parlant/basic.py` - 기본 구조
- `parlant/pubmed_advanced.py` - 고급 PubMed 검색
- `parlant/search/hybrid_search.py` - 하이브리드 검색

### 차트 라이브러리
더 나은 시각화를 위해 Chart.js 또는 Recharts 사용:
```bash
npm install recharts
```

## 주의사항

### MongoDB Atlas Vector Search
- **무료 티어 제한**: 512MB 스토리지
- **임베딩 크기**: 4,850개 논문 × 1536 dimensions × 4 bytes ≈ 30MB
- **충분히 무료 티어 내에서 가능**
- Vector Search 인덱스는 Atlas M10 이상 또는 무료 M0에서 제한적 지원

### OpenAI API
- API 키 필수
- **비용 발생**:
  - text-embedding-3-small: $0.02 / 1M tokens
  - gpt-3.5-turbo: $0.50 / 1M input tokens
  - 4,850개 논문 임베딩: 약 $1~2
  - 채팅 사용: 매우 저렴 (월 $5 이내)
- Rate limit 주의: 분당 500 요청
- 새 계정은 $5 무료 크레딧 제공

### PubMed API
- 무료이지만 Rate limit 있음
- 초당 3회 요청 제한
- 적절한 딜레이 필요 (0.34초)
- Email 주소 포함 권장

### 에러 처리
- API 실패 시 적절한 메시지
- 로딩 상태 표시
- 타임아웃 처리
- 벡터 검색 실패 시 PubMed로 fallback

### 성능 최적화
- 임베딩 캐싱
- 배치 처리
- 비동기 처리
- 검색 결과 제한 (5~10개)
