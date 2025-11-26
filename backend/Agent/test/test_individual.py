#!/usr/bin/env python3
"""
Individual Agent Test with Real Queries
각 Agent에 실제 쿼리를 넣어서 테스트
"""

import sys
from pathlib import Path
import asyncio
import json
from datetime import datetime
import httpx

# Add backend to path
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

from Agent.core.agent_registry import AgentRegistry
from Agent.core.contracts import AgentRequest


# 각 Agent별 테스트 쿼리
TEST_QUERIES = {
    "nutrition": "CKD 3단계 환자를 위한 하루 식단을 추천해주세요. 단백질 섭취량도 알려주세요.",
    "quiz": "만성콩팥병의 단계에 대한 퀴즈 3개를 만들어주세요.",
    "trend_visualization": "최근 5년간 CKD 치료 연구 트렌드를 분석해주세요.",
    "research_paper": "CKD 환자의 식이요법에 대한 최신 연구 논문을 찾아주세요.",
    "medical_welfare": "CKD 환자가 받을 수 있는 복지 혜택과 서울에 있는 투석 가능한 병원을 알려주세요."
}


async def test_agent(agent_type: str, query: str):
    """개별 Agent 테스트"""
    print("\n" + "="*80)
    print(f"🧪 Testing: {agent_type.upper()}")
    print("="*80)
    print(f"📝 Query: {query}")
    print("-"*80)
    
    try:
        # Agent 생성
        agent = AgentRegistry.create_agent(agent_type)
        
        # Quiz Agent는 특별 처리 (action 필요)
        if agent_type == "quiz":
            context = {
                "action": "generate_quiz",
                "userId": "test_user",
                "sessionType": "daily_quiz",
                "category": "ckd_stages",
                "difficulty": "medium",
                "questionCount": 3
            }
        else:
            context = {}
        
        # Request 생성
        request = AgentRequest(
            query=query,
            session_id=f"test_{agent_type}_{int(datetime.now().timestamp())}",
            context=context,
            profile="general",
            language="ko"
        )
        
        # 실행
        print(f"⏳ Processing...")
        start_time = datetime.now()
        response = await agent.process(request)
        duration = (datetime.now() - start_time).total_seconds()
        
        # 결과 출력
        print(f"\n✅ Response received in {duration:.2f}s")
        print(f"📊 Status: {response.status}")
        print(f"🔢 Tokens used: {response.tokens_used}")
        print(f"\n💬 Answer:")
        print("-"*80)
        # 답변이 너무 길면 앞부분만 출력
        answer_preview = response.answer[:500] + "..." if len(response.answer) > 500 else response.answer
        print(answer_preview)
        print("-"*80)
        
        # 추가 정보
        if response.sources:
            print(f"\n📚 Sources: {len(response.sources)} items")
            for i, source in enumerate(response.sources[:3], 1):
                print(f"  {i}. {source.get('title', 'N/A')}")
        
        if response.papers:
            print(f"\n📄 Papers: {len(response.papers)} items")
            for i, paper in enumerate(response.papers[:3], 1):
                print(f"  {i}. {paper.get('title', 'N/A')}")
        
        if response.metadata:
            print(f"\n🔍 Metadata:")
            for key, value in list(response.metadata.items())[:5]:
                if key not in ['sources', 'papers']:
                    print(f"  • {key}: {value}")
        
        return {
            "agent_type": agent_type,
            "query": query,
            "status": response.status,
            "answer_length": len(response.answer),
            "tokens_used": response.tokens_used,
            "duration": duration,
            "sources_count": len(response.sources) if response.sources else 0,
            "papers_count": len(response.papers) if response.papers else 0,
            "success": response.status != "error"
        }
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "agent_type": agent_type,
            "query": query,
            "status": "error",
            "error": str(e),
            "success": False
        }


async def main():
    """모든 Agent 테스트"""
    print("\n" + "="*80)
    print("🚀 Individual Agent Testing with Real Queries")
    print("="*80)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Local Agents 테스트
    print("\n" + "="*80)
    print("📍 LOCAL AGENTS")
    print("="*80)
    
    for agent_type in ["nutrition", "quiz", "trend_visualization"]:
        query = TEST_QUERIES[agent_type]
        result = await test_agent(agent_type, query)
        results.append(result)
        await asyncio.sleep(1)  # Rate limiting
    
    # Remote Agents 테스트
    print("\n" + "="*80)
    print("📍 REMOTE AGENTS (Testing with Parlant Server)")
    print("="*80)
    
    # Parlant 서버 확인 (포트 체크)
    import socket
    def is_port_open(host, port):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((host, port))
            sock.close()
            return result == 0
        except:
            return False
    
    server_running = is_port_open('localhost', 8800)
    
    if server_running:
        print("\n✅ Parlant server is running on port 8800")
        print("   Testing remote agents...\n")
        
        for agent_type in ["research_paper", "medical_welfare"]:
            query = TEST_QUERIES[agent_type]
            result = await test_agent(agent_type, query)
            results.append(result)
            await asyncio.sleep(2)  # Rate limiting
    else:
        print("\n⚠️  Parlant server is NOT running on port 8800")
        print("   Skipping remote agent tests...")
        print("   To test remote agents, run:")
        print("   source .venv/bin/activate && python backend/Agent/parlant_common/run_unified_server.py")
        
        for agent_type in ["research_paper", "medical_welfare"]:
            results.append({
                "agent_type": agent_type,
                "query": TEST_QUERIES[agent_type],
                "status": "skipped",
                "success": False,
                "note": "Parlant server not running on port 8800"
            })
    
    # 결과 요약
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    
    successful = [r for r in results if r.get("success")]
    failed = [r for r in results if not r.get("success")]
    
    print(f"\n✅ Successful: {len(successful)}/5")
    print(f"❌ Failed/Skipped: {len(failed)}/5")
    
    if successful:
        print(f"\n🎯 Successful Tests:")
        for r in successful:
            print(f"  • {r['agent_type']}: {r['answer_length']} chars, {r['duration']:.2f}s, {r['tokens_used']} tokens")
    
    if failed:
        print(f"\n⚠️  Failed/Skipped Tests:")
        for r in failed:
            note = r.get('note', r.get('error', 'Unknown'))
            print(f"  • {r['agent_type']}: {note}")
    
    # JSON 저장
    result_file = Path(__file__).parent / "individual_test_results.json"
    with open(result_file, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "results": results,
            "summary": {
                "total": len(results),
                "successful": len(successful),
                "failed": len(failed)
            }
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed results saved to: {result_file}")
    print("\n" + "="*80)
    print("✨ Testing Complete!")
    print("="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
