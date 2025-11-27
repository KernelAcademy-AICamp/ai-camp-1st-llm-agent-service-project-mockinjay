#!/usr/bin/env python3
"""
Comprehensive Agent System Test
모든 에이전트의 모든 기능을 테스트합니다.

테스트 범위:
1. Core Infrastructure
2. AgentRegistry
3. Local Agents (Nutrition, Quiz, TrendVisualization)
4. Remote Agents (ResearchPaper, MedicalWelfare)
5. AgentManager
6. Parlant Common Tools
"""

import sys
from pathlib import Path
import asyncio
import time
from typing import Dict, Any, List
import json

# Add backend to path
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

from Agent.core.agent_registry import AgentRegistry
from Agent.core.contracts import AgentRequest, AgentResponse
from Agent.core.execution_type import ExecutionType
from Agent.agent_manager import AgentManager


class ComprehensiveAgentTester:
    """종합 에이전트 테스트"""
    
    def __init__(self):
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "tests": []
        }
        self.agent_manager = None
    
    def log_test(self, category: str, test_name: str, status: str, message: str = "", duration: float = 0):
        """테스트 결과 기록"""
        self.results["total_tests"] += 1
        
        if status == "PASS":
            self.results["passed"] += 1
            icon = "✅"
        elif status == "FAIL":
            self.results["failed"] += 1
            icon = "❌"
        else:
            self.results["skipped"] += 1
            icon = "⏭️"
        
        self.results["tests"].append({
            "category": category,
            "name": test_name,
            "status": status,
            "message": message,
            "duration": duration
        })
        
        print(f"{icon} [{category}] {test_name}: {status}")
        if message:
            print(f"   → {message}")
        if duration > 0:
            print(f"   ⏱️  {duration:.2f}s")
    
    # ==================== 1. Core Infrastructure Tests ====================
    
    def test_agent_registry(self):
        """AgentRegistry 테스트"""
        print("\n" + "="*70)
        print("1️⃣  Core Infrastructure Tests")
        print("="*70)
        
        try:
            # Test 1.1: List agents
            start = time.time()
            agents = AgentRegistry.list_agents()
            duration = time.time() - start
            
            if len(agents) >= 5:
                self.log_test(
                    "Core", 
                    "AgentRegistry.list_agents()",
                    "PASS",
                    f"Found {len(agents)} agents: {', '.join(agents)}",
                    duration
                )
            else:
                self.log_test(
                    "Core",
                    "AgentRegistry.list_agents()",
                    "FAIL",
                    f"Expected >= 5 agents, got {len(agents)}"
                )
            
            # Test 1.2: Get agents info (수정: get_agent_info -> get_agents_info)
            start = time.time()
            all_info = AgentRegistry.get_agents_info()
            duration = time.time() - start
            
            if all_info and len(all_info) >= 5:
                self.log_test(
                    "Core",
                    "AgentRegistry.get_agents_info()",
                    "PASS",
                    f"Got info for {len(all_info)} agents",
                    duration
                )
            else:
                self.log_test(
                    "Core",
                    "AgentRegistry.get_agents_info()",
                    "FAIL",
                    "Missing agents info"
                )
            
            # Test 1.3: Create agents
            for agent_type in agents:
                start = time.time()
                try:
                    agent = AgentRegistry.create_agent(agent_type)
                    duration = time.time() - start
                    
                    if agent:
                        self.log_test(
                            "Core",
                            f"AgentRegistry.create_agent('{agent_type}')",
                            "PASS",
                            f"Created {agent.__class__.__name__}",
                            duration
                        )
                    else:
                        self.log_test(
                            "Core",
                            f"AgentRegistry.create_agent('{agent_type}')",
                            "FAIL",
                            "Agent is None"
                        )
                except Exception as e:
                    self.log_test(
                        "Core",
                        f"AgentRegistry.create_agent('{agent_type}')",
                        "FAIL",
                        str(e)
                    )
        
        except Exception as e:
            self.log_test("Core", "AgentRegistry", "FAIL", str(e))
    
    # ==================== 2. Local Agent Tests ====================
    
    async def test_local_agents(self):
        """로컬 에이전트 테스트"""
        print("\n" + "="*70)
        print("2️⃣  Local Agent Tests")
        print("="*70)
        
        local_agents = ["nutrition", "quiz", "trend_visualization"]
        
        for agent_type in local_agents:
            try:
                agent = AgentRegistry.create_agent(agent_type)
                
                # Test 2.1: Metadata
                start = time.time()
                metadata = agent.metadata
                duration = time.time() - start
                
                if metadata and "name" in metadata:
                    self.log_test(
                        f"Local/{agent_type}",
                        "metadata",
                        "PASS",
                        f"Name: {metadata['name']}",
                        duration
                    )
                else:
                    self.log_test(
                        f"Local/{agent_type}",
                        "metadata",
                        "FAIL",
                        "Missing metadata"
                    )
                
                # Test 2.2: Execution type
                start = time.time()
                exec_type = agent.execution_type
                duration = time.time() - start
                
                # ExecutionType.LOCAL의 value는 "local"
                if exec_type.value == "local":
                    self.log_test(
                        f"Local/{agent_type}",
                        "execution_type",
                        "PASS",
                        f"ExecutionType.LOCAL (value: {exec_type.value})",
                        duration
                    )
                else:
                    self.log_test(
                        f"Local/{agent_type}",
                        "execution_type",
                        "FAIL",
                        f"Expected 'local', got {exec_type.value}"
                    )
                
                # Test 2.3: Process method (간단한 쿼리)
                test_queries = {
                    "nutrition": "CKD 환자를 위한 식단 추천해줘",
                    "quiz": "CKD에 대한 퀴즈 만들어줘",
                    "trend_visualization": "최근 CKD 연구 트렌드 분석해줘"
                }
                
                query = test_queries.get(agent_type, "테스트 쿼리")
                request = AgentRequest(
                    query=query,
                    session_id=f"test_{agent_type}_{int(time.time())}",
                    context={},
                    profile="general",
                    language="ko"
                )
                
                start = time.time()
                try:
                    response = await agent.process(request)
                    duration = time.time() - start
                    
                    if isinstance(response, AgentResponse) and response.answer:
                        self.log_test(
                            f"Local/{agent_type}",
                            "process()",
                            "PASS",
                            f"Answer length: {len(response.answer)} chars, Status: {response.status}",
                            duration
                        )
                    else:
                        self.log_test(
                            f"Local/{agent_type}",
                            "process()",
                            "FAIL",
                            "Invalid response"
                        )
                except Exception as e:
                    duration = time.time() - start
                    self.log_test(
                        f"Local/{agent_type}",
                        "process()",
                        "FAIL",
                        str(e),
                        duration
                    )
            
            except Exception as e:
                self.log_test(f"Local/{agent_type}", "initialization", "FAIL", str(e))
    
    # ==================== 3. Remote Agent Tests ====================
    
    async def test_remote_agents(self):
        """원격 에이전트 테스트 (Parlant 서버 필요)"""
        print("\n" + "="*70)
        print("3️⃣  Remote Agent Tests (Requires Parlant Server on 8800)")
        print("="*70)
        
        remote_agents = ["research_paper", "medical_welfare"]
        
        for agent_type in remote_agents:
            try:
                agent = AgentRegistry.create_agent(agent_type)
                
                # Test 3.1: Metadata
                start = time.time()
                metadata = agent.metadata
                duration = time.time() - start
                
                if metadata and "parlant_server" in metadata:
                    self.log_test(
                        f"Remote/{agent_type}",
                        "metadata",
                        "PASS",
                        f"Server: {metadata['parlant_server']['url']}",
                        duration
                    )
                else:
                    self.log_test(
                        f"Remote/{agent_type}",
                        "metadata",
                        "FAIL",
                        "Missing parlant_server in metadata"
                    )
                
                # Test 3.2: Execution type
                start = time.time()
                exec_type = agent.execution_type
                duration = time.time() - start
                
                if exec_type == ExecutionType.REMOTE:
                    self.log_test(
                        f"Remote/{agent_type}",
                        "execution_type",
                        "PASS",
                        "ExecutionType.REMOTE",
                        duration
                    )
                else:
                    self.log_test(
                        f"Remote/{agent_type}",
                        "execution_type",
                        "FAIL",
                        f"Expected REMOTE, got {exec_type}"
                    )
                
                # Test 3.3: Server connection (간단한 테스트)
                print(f"\n   ⚠️  Skipping process() test for {agent_type}")
                print(f"   → Requires Parlant server running on port 8800")
                print(f"   → Run: source .venv/bin/activate && python backend/Agent/parlant_common/run_unified_server.py")
                
                self.log_test(
                    f"Remote/{agent_type}",
                    "process() [Server Required]",
                    "SKIP",
                    "Parlant server not tested (manual test required)"
                )
            
            except Exception as e:
                self.log_test(f"Remote/{agent_type}", "initialization", "FAIL", str(e))
    
    # ==================== 4. AgentManager Tests ====================
    
    async def test_agent_manager(self):
        """AgentManager 테스트"""
        print("\n" + "="*70)
        print("4️⃣  AgentManager Tests")
        print("="*70)
        
        try:
            # Test 4.1: Initialize
            start = time.time()
            self.agent_manager = AgentManager()
            duration = time.time() - start
            
            if self.agent_manager and self.agent_manager.agents:
                self.log_test(
                    "AgentManager",
                    "__init__()",
                    "PASS",
                    f"Initialized with {len(self.agent_manager.agents)} agents",
                    duration
                )
            else:
                self.log_test(
                    "AgentManager",
                    "__init__()",
                    "FAIL",
                    "No agents initialized"
                )
            
            # Test 4.2: Get available agents (agents 속성 직접 확인)
            start = time.time()
            available = list(self.agent_manager.agents.keys())
            duration = time.time() - start
            
            if available and len(available) >= 5:
                self.log_test(
                    "AgentManager",
                    "agents (available)",
                    "PASS",
                    f"Found {len(available)} agents: {', '.join(available)}",
                    duration
                )
            else:
                self.log_test(
                    "AgentManager",
                    "agents (available)",
                    "FAIL",
                    f"Expected >= 5 agents, got {len(available) if available else 0}"
                )
            
            # Test 4.3: Route request (Local agent only)
            # 먼저 세션 생성 (user_id만 전달, session_id는 자동 생성)
            session_id = self.agent_manager.session_manager.create_session(
                user_id="test_user"
            )
            
            start = time.time()
            try:
                result = await self.agent_manager.route_request(
                    agent_type="nutrition",
                    user_input="CKD 환자를 위한 간단한 식단 추천",
                    session_id=session_id,
                    context={"profile": "general"}
                )
                duration = time.time() - start
                
                if result and result.get("success") and "result" in result:
                    self.log_test(
                        "AgentManager",
                        "route_request(nutrition)",
                        "PASS",
                        f"Success: {result.get('success')}, Response length: {len(result['result'].get('response', ''))} chars",
                        duration
                    )
                else:
                    error_msg = result.get('error', 'Unknown error') if result else 'No result'
                    self.log_test(
                        "AgentManager",
                        "route_request(nutrition)",
                        "FAIL",
                        f"Invalid result: {error_msg}"
                    )
            except Exception as e:
                duration = time.time() - start
                self.log_test(
                    "AgentManager",
                    "route_request(nutrition)",
                    "FAIL",
                    str(e),
                    duration
                )
        
        except Exception as e:
            self.log_test("AgentManager", "initialization", "FAIL", str(e))
    
    # ==================== 5. Summary ====================
    
    def print_summary(self):
        """테스트 결과 요약"""
        print("\n" + "="*70)
        print("📊 Test Summary")
        print("="*70)
        
        total = self.results["total_tests"]
        passed = self.results["passed"]
        failed = self.results["failed"]
        skipped = self.results["skipped"]
        
        pass_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"\n총 테스트: {total}")
        print(f"✅ 성공: {passed} ({pass_rate:.1f}%)")
        print(f"❌ 실패: {failed}")
        print(f"⏭️  스킵: {skipped}")
        
        if failed > 0:
            print(f"\n❌ 실패한 테스트:")
            for test in self.results["tests"]:
                if test["status"] == "FAIL":
                    print(f"   • [{test['category']}] {test['name']}")
                    print(f"     → {test['message']}")
        
        # 카테고리별 통계
        print(f"\n📂 카테고리별 통계:")
        categories = {}
        for test in self.results["tests"]:
            cat = test["category"]
            if cat not in categories:
                categories[cat] = {"total": 0, "passed": 0, "failed": 0, "skipped": 0}
            
            categories[cat]["total"] += 1
            if test["status"] == "PASS":
                categories[cat]["passed"] += 1
            elif test["status"] == "FAIL":
                categories[cat]["failed"] += 1
            else:
                categories[cat]["skipped"] += 1
        
        for cat, stats in categories.items():
            rate = (stats["passed"] / stats["total"] * 100) if stats["total"] > 0 else 0
            print(f"   {cat}: {stats['passed']}/{stats['total']} ({rate:.1f}%)")
        
        # 결과 파일 저장
        result_file = Path(__file__).parent / "test_results.json"
        with open(result_file, "w", encoding="utf-8") as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 상세 결과 저장: {result_file}")
        
        print("\n" + "="*70)
        if failed == 0:
            print("🎉 모든 테스트 통과!")
        else:
            print(f"⚠️  {failed}개 테스트 실패")
        print("="*70 + "\n")
    
    # ==================== Main Test Runner ====================
    
    async def run_all_tests(self):
        """모든 테스트 실행"""
        print("\n" + "="*70)
        print("🧪 Comprehensive Agent System Test")
        print("="*70)
        print(f"시작 시간: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        start_time = time.time()
        
        # 1. Core Infrastructure
        self.test_agent_registry()
        
        # 2. Local Agents
        await self.test_local_agents()
        
        # 3. Remote Agents
        await self.test_remote_agents()
        
        # 4. AgentManager
        await self.test_agent_manager()  # 수정: agent_manager() -> test_agent_manager()
        
        total_duration = time.time() - start_time
        
        print(f"\n총 소요 시간: {total_duration:.2f}s")
        
        # Summary
        self.print_summary()


async def main():
    """메인 함수"""
    tester = ComprehensiveAgentTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
