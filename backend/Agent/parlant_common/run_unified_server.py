#!/usr/bin/env python3
"""
Unified Parlant Server (Port 8800)
Registers both ResearchPaper and MedicalWelfare agents

Run from: backend/Agent/parlant_common/
"""

import sys
from pathlib import Path
import asyncio

# Add backend to path
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

import parlant.sdk as p

# Import agent registration functions
# Add server directories to path
research_server_path = Path(__file__).parent.parent / "research_paper" / "server"
welfare_server_path = Path(__file__).parent.parent / "medical_welfare" / "server"

sys.path.insert(0, str(research_server_path))
sys.path.insert(0, str(welfare_server_path))

from healthcare_v2_en import register_agent as register_research_agent
from medical_welfare_server import register_agent as register_welfare_agent


# async def main():
#     """Run unified Parlant server with both agents"""
    
#     print("\n" + "="*70)
#     print("🚀 Starting Unified Parlant Server (Port 8800)")
#     print("="*70)
#     print("\n📊 Registering Agents:")
#     print("  1. ResearchPaper Agent (CareGuide_v2)")
#     print("  2. MedicalWelfare Agent")
#     print("\n" + "="*70 + "\n")
    
#     # Start Parlant server on port 8800 (tool service on 8820)
#     # 병렬 처리

#     async with p.Server(
#         host="127.0.0.1", 
#         port=8800,
#         tool_service_port=8819  # 포트 충돌 방지
#     ) as server:
#         # Register ResearchPaper agent
#         print("\n[1/2] Registering ResearchPaper Agent...")
#         await register_research_agent(server)
        
#         # Register MedicalWelfare agent
#         print("\n[2/2] Registering MedicalWelfare Agent...")
#         await register_welfare_agent(server)


async def setup_research_server():
    async with p.Server(
        host="127.0.0.1",
        port=8800,
        tool_service_port=8819,  # 충돌 방지
    ) as server:
        print("\n[1/2] Registering ResearchPaper Agent...")
        await register_research_agent(server)


async def setup_welfare_server():
    async with p.Server(
        host="127.0.0.1",
        port=8801,
        tool_service_port=8825,  # 충돌 방지
    ) as server:
        print("\n[2/2] Registering MedicalWelfare Agent...")
        await register_welfare_agent(server)


async def main():
    # 두 서버를 비동기 병렬로 실행
    await asyncio.gather(
        setup_research_server(),
        setup_welfare_server(),
    )



if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n\n❌ Server error: {e}")
        import traceback
        traceback.print_exc()
