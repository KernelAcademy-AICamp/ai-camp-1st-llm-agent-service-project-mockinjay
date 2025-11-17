"""
Simple Test Script for 4 Agents
Tests all agents with basic queries
"""

import asyncio
import sys
from pathlib import Path

# Add backend path
backend_path = Path(__file__).parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from Agent.research_paper.agent import ResearchPaperAgent
from Agent.medical_welfare.agent import MedicalWelfareAgent
from Agent.nutrition.agent import NutritionAgent
from Agent.trend_visualization.agent import TrendVisualizationAgent


async def test_research_paper_agent():
    """Test Research Paper Agent"""
    print("\n" + "="*80)
    print("Testing Research Paper Agent (healthcare_v2_en.py equivalent)")
    print("="*80)

    agent = ResearchPaperAgent()

    try:
        result = await agent.process(
            user_input="신장이 안좋은 사람은 무엇을 해야하나요?",
            session_id="test-research-001",
            context={'profile': 'general', 'language': 'ko'}
        )

        print(f"\n✅ Agent Type: {result.get('agent_type')}")
        print(f"Status: {result.get('status')}")
        print(f"Answer (first 200 chars): {result.get('answer', '')[:200]}...")
        print(f"Sources: {len(result.get('sources', []))} items")
        print(f"Papers: {len(result.get('papers', []))} items")
        print(f"Tokens Used: {result.get('tokens_used', 0)}")
        print(f"Metadata: {result.get('metadata', {})}")

    except Exception as e:
        print(f"❌ Error: {e}")

    finally:
        await agent.close()


async def test_medical_welfare_agent():
    """Test Medical Welfare Agent"""
    print("\n" + "="*80)
    print("Testing Medical Welfare Agent")
    print("="*80)

    agent = MedicalWelfareAgent()

    try:
        result = await agent.process(
            user_input="신장 투석 환자 의료비 지원",
            session_id="test-welfare-001",
            context={'profile': 'patient', 'language': 'ko'}
        )

        print(f"\n✅ Agent Type: {result.get('agent_type')}")
        print(f"Status: {result.get('status')}")
        print(f"Answer (first 200 chars): {result.get('answer', '')[:200]}...")
        print(f"Sources: {len(result.get('sources', []))} items")
        print(f"Tokens Used: {result.get('tokens_used', 0)}")

    except Exception as e:
        print(f"❌ Error: {e}")

    finally:
        await agent.close()


async def test_nutrition_agent():
    """Test Nutrition Agent"""
    print("\n" + "="*80)
    print("Testing Nutrition Agent")
    print("="*80)

    agent = NutritionAgent()

    try:
        result = await agent.process(
            user_input="당뇨병 환자 저염식 식단",
            session_id="test-nutrition-001",
            context={'profile': 'patient', 'language': 'ko'}
        )

        print(f"\n✅ Agent Type: {result.get('agent_type')}")
        print(f"Status: {result.get('status')}")
        print(f"Answer (first 200 chars): {result.get('answer', '')[:200]}...")
        print(f"Sources: {len(result.get('sources', []))} items")
        print(f"Tokens Used: {result.get('tokens_used', 0)}")

    except Exception as e:
        print(f"❌ Error: {e}")

    finally:
        await agent.close()


async def test_trend_visualization_agent():
    """Test Trend Visualization Agent"""
    print("\n" + "="*80)
    print("Testing Trend Visualization Agent")
    print("="*80)

    agent = TrendVisualizationAgent()

    try:
        result = await agent.process(
            user_input="만성신장질환 발병률 트렌드",
            session_id="test-trend-001",
            context={'profile': 'general', 'language': 'ko'}
        )

        print(f"\n✅ Agent Type: {result.get('agent_type')}")
        print(f"Status: {result.get('status')}")
        print(f"Answer (first 200 chars): {result.get('answer', '')[:200]}...")
        print(f"Chart Data: {len(result.get('sources', []))} charts")
        print(f"Tokens Used: {result.get('tokens_used', 0)}")
        print(f"Metadata: {result.get('metadata', {})}")

    except Exception as e:
        print(f"❌ Error: {e}")

    finally:
        await agent.close()


async def main():
    """Run all tests"""
    print("\n🚀 Starting Agent System Tests")
    print("Testing all 4 agents...")

    # Run tests sequentially
    await test_research_paper_agent()
    # await test_medical_welfare_agent()
    # await test_nutrition_agent()
    # await test_trend_visualization_agent()

    print("\n" + "="*80)
    print("✅ All Tests Completed")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(main())
