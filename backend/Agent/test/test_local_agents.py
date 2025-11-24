"""
로컬 에이전트 테스트 스크립트

새로 리팩토링한 LocalAgent들이 제대로 작동하는지 테스트합니다.
"""

import asyncio
import sys
from pathlib import Path

# 프로젝트 루트를 sys.path에 추가
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from Agent.core.agent_registry import AgentRegistry
from Agent.core.contracts import AgentRequest, AgentResponse

# 에이전트 import (자동 등록됨)
from Agent.nutrition.agent import NutritionAgent
from Agent.quiz.agent import QuizAgent
from Agent.trend_visualization.agent import TrendVisualizationAgent


def print_separator(title: str = ""):
    """구분선 출력"""
    print("\n" + "=" * 80)
    if title:
        print(f"  {title}")
        print("=" * 80)
    print()


async def test_agent_registry():
    """AgentRegistry 테스트"""
    print_separator("1. AgentRegistry 테스트")
    
    # 등록된 에이전트 목록 확인
    registered_agents = AgentRegistry.list_agents()
    print(f"✅ 등록된 에이전트: {registered_agents}")
    print(f"   총 {len(registered_agents)}개 에이전트 자동 등록")
    
    # 에이전트 정보 확인
    agents_info = AgentRegistry.get_agents_info()
    print("\n📋 에이전트 상세 정보:")
    for agent_type, info in agents_info.items():
        print(f"   - {agent_type}: {info}")
    
    return registered_agents


async def test_agent_metadata(agent_type: str):
    """에이전트 메타데이터 테스트"""
    print_separator(f"2. {agent_type.upper()} - 메타데이터 테스트")
    
    # 에이전트 생성
    agent = AgentRegistry.create_agent(agent_type)
    
    # 메타데이터 확인
    metadata = agent.metadata
    print(f"📌 Name: {metadata.get('name')}")
    print(f"📌 Description: {metadata.get('description')}")
    print(f"📌 Version: {metadata.get('version')}")
    print(f"📌 Capabilities: {metadata.get('capabilities', [])}")
    print(f"📌 Execution Type: {agent.execution_type.value}")
    
    return agent


async def test_nutrition_agent():
    """NutritionAgent 테스트"""
    print_separator("3. NUTRITION AGENT - 기능 테스트")
    
    try:
        agent = AgentRegistry.create_agent("nutrition")
        
        # 테스트 요청 1: 텍스트 쿼리
        print("🧪 테스트 1: 텍스트 쿼리 (김치찌개)")
        request1 = AgentRequest(
            query="김치찌개 영양 분석해줘",
            session_id="test-session-001",
            context={"user_profile": "patient"}
        )
        
        response1 = await agent.process(request1)
        print(f"✅ Status: {response1.status}")
        print(f"✅ Answer: {response1.answer[:100]}...")
        print(f"✅ Agent Type: {response1.agent_type}")
        print(f"✅ Tokens Used: {response1.tokens_used}")
        
        # 메타데이터 확인
        if response1.metadata:
            print(f"✅ Analysis Type: {response1.metadata.get('analysisType')}")
            if response1.metadata.get('nutritionData'):
                print(f"✅ Nutrition Data: 있음")
        
        return True
        
    except Exception as e:
        print(f"❌ 오류: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_quiz_agent():
    """QuizAgent 테스트"""
    print_separator("4. QUIZ AGENT - 기능 테스트")
    
    try:
        agent = AgentRegistry.create_agent("quiz")
        
        # 테스트 요청: 사용자 통계 조회
        print("🧪 테스트: 사용자 통계 조회")
        request = AgentRequest(
            query="내 퀴즈 통계 보여줘",
            session_id="test-session-002",
            context={
                "action": "get_stats",
                "userId": "test-user-001"
            }
        )
        
        response = await agent.process(request)
        print(f"✅ Status: {response.status}")
        print(f"✅ Answer: {response.answer}")
        print(f"✅ Agent Type: {response.agent_type}")
        
        # 메타데이터 확인
        if response.metadata:
            print(f"✅ Total Sessions: {response.metadata.get('totalSessions', 0)}")
            print(f"✅ Total Questions: {response.metadata.get('totalQuestions', 0)}")
        
        return True
        
    except Exception as e:
        print(f"❌ 오류: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_trend_agent():
    """TrendVisualizationAgent 테스트"""
    print_separator("5. TREND VISUALIZATION AGENT - 기능 테스트")
    
    try:
        agent = AgentRegistry.create_agent("trend_visualization")
        
        # 테스트 요청: 트렌드 분석
        print("🧪 테스트: 트렌드 분석")
        request = AgentRequest(
            query="당뇨병 연구 트렌드",
            session_id="test-session-003",
            context={
                "analysisType": "temporal_trends",
                "keywords": ["diabetes", "CKD"]
            }
        )
        
        response = await agent.process(request)
        print(f"✅ Status: {response.status}")
        print(f"✅ Answer: {response.answer[:100] if response.answer else 'None'}...")
        print(f"✅ Agent Type: {response.agent_type}")
        
        # 메타데이터 확인
        if response.metadata:
            print(f"✅ Type: {response.metadata.get('type')}")
            print(f"✅ Has Trends: {response.metadata.get('trends') is not None}")
        
        return True
        
    except Exception as e:
        print(f"❌ 오류: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_agent_interface_consistency():
    """모든 에이전트의 인터페이스 일관성 테스트"""
    print_separator("6. 인터페이스 일관성 테스트")
    
    agent_types = AgentRegistry.list_agents()
    results = {}
    
    for agent_type in agent_types:
        print(f"\n🔍 {agent_type} 테스트 중...")
        
        try:
            agent = AgentRegistry.create_agent(agent_type)
            
            # 필수 속성 확인
            has_metadata = hasattr(agent, 'metadata') and callable(getattr(agent, 'metadata', None))
            has_execution_type = hasattr(agent, 'execution_type')
            has_process = hasattr(agent, 'process') and callable(getattr(agent, 'process'))
            
            results[agent_type] = {
                "metadata": "✅" if has_metadata else "❌",
                "execution_type": "✅" if has_execution_type else "❌",
                "process": "✅" if has_process else "❌"
            }
            
        except Exception as e:
            results[agent_type] = {"error": str(e)}
    
    # 결과 출력
    print("\n📊 인터페이스 일관성 검사 결과:")
    print(f"{'Agent Type':<25} {'metadata':<12} {'execution_type':<18} {'process':<10}")
    print("-" * 70)
    for agent_type, checks in results.items():
        if "error" in checks:
            print(f"{agent_type:<25} ❌ Error: {checks['error']}")
        else:
            print(f"{agent_type:<25} {checks['metadata']:<12} {checks['execution_type']:<18} {checks['process']:<10}")
    
    return all("error" not in r and all(v == "✅" for v in r.values()) for r in results.values())


async def main():
    """메인 테스트 함수"""
    print_separator("🚀 로컬 에이전트 리팩토링 테스트 시작")
    
    test_results = {}
    
    # 1. AgentRegistry 테스트
    try:
        registered_agents = await test_agent_registry()
        test_results["agent_registry"] = True
    except Exception as e:
        print(f"❌ AgentRegistry 테스트 실패: {e}")
        test_results["agent_registry"] = False
    
    # 2. 메타데이터 테스트
    for agent_type in ["nutrition", "quiz", "trend_visualization"]:
        try:
            await test_agent_metadata(agent_type)
            test_results[f"{agent_type}_metadata"] = True
        except Exception as e:
            print(f"❌ {agent_type} 메타데이터 테스트 실패: {e}")
            test_results[f"{agent_type}_metadata"] = False
    
    # 3. 기능 테스트
    test_results["nutrition_functional"] = await test_nutrition_agent()
    test_results["quiz_functional"] = await test_quiz_agent()
    test_results["trend_functional"] = await test_trend_agent()
    
    # 4. 인터페이스 일관성 테스트
    test_results["interface_consistency"] = await test_agent_interface_consistency()
    
    # 최종 결과
    print_separator("📊 최종 테스트 결과")
    
    passed = sum(1 for v in test_results.values() if v)
    total = len(test_results)
    
    print(f"✅ 통과: {passed}/{total}")
    print(f"❌ 실패: {total - passed}/{total}")
    print(f"\n성공률: {passed/total*100:.1f}%")
    
    print("\n상세 결과:")
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} - {test_name}")
    
    if passed == total:
        print("\n🎉 모든 테스트 통과!")
    else:
        print("\n⚠️ 일부 테스트 실패")
    
    print_separator()


if __name__ == "__main__":
    asyncio.run(main())
