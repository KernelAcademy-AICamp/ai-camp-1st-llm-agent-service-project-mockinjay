import sys
import os
import asyncio
import pandas as pd
from dotenv import load_dotenv
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

# Load env vars
load_dotenv()

# Import agents to register them
try:
    from Agent.router.agent import RouterAgent
    from Agent.medical_welfare.agent import MedicalWelfareAgent
    from Agent.nutrition.agent import NutritionAgent
    from Agent.research_paper.agent import ResearchPaperAgent
    from Agent.core.contracts import AgentRequest
except ImportError as e:
    logger.error(f"Failed to import agents: {e}")
    sys.exit(1)

async def process_row(semaphore, index, row, router, total_rows):
    async with semaphore:
        time.sleep(3)
        query = row['input_query']
        user_type = row['user_type']
        
        # Mapping for user_type
        profile_map = {
            "일반인/노비스": "general",
            "질환자/경험자": "patient",
            "연구자/전문가": "researcher"
        }
        profile = profile_map.get(user_type, "general")
        
        logger.info(f"Processing [{index+1}/{total_rows}]: {query} ({profile})")
        
        request = AgentRequest(
            query=query,
            session_id=f"eval_{index}",
            user_id="eval_user",
            profile=profile,
            context={}
        )
        
        try:
            # 1. Get intents for CSV logging (Evaluation purpose)
            raw_result = await router._analyze_intent_raw(query)
            intents = raw_result.get("intents", [])

            # 2. Process with Router - Full Execution (async generator)
            response = None
            individual_responses = {}
            accumulated_answer = ""
            last_chunk = None


            async for chunk in router.process_stream(request):
                last_chunk = chunk
                # AgentResponse 객체인 경우 (단일 에이전트)
                if hasattr(chunk, 'answer'):
                    response = chunk
                # dict인 경우 (멀티 에이전트 또는 진행 상황)
                elif isinstance(chunk, dict):
                    # 개별 에이전트 응답 수집
                    if chunk.get("individual_response"):
                        agent_type = chunk.get("agent_type", "unknown")
                        individual_responses[agent_type] = chunk.get("content", "")
                    
                    # 최종 synthesis 응답
                    if chunk.get("synthesis") or chunk.get("status") == "complete":
                        # 마지막 청크의 내용을 임시 응답으로 저장
                        if response is None:
                            from Agent.core.contracts import AgentResponse
                            response = AgentResponse(
                                answer=chunk.get("content", ""),
                                status=chunk.get("status", "complete"),
                                agent_type=chunk.get("agent_type", "router"),
                                sources=[],
                                papers=[],
                                tokens_used=0,
                                metadata={"individual_responses": individual_responses}
                            )
                    
                    # Single agent stream accumulation (answer field contains content)
                    if "answer" in chunk and not chunk.get("individual_response"):
                        content = chunk.get("answer", "")
                        if content:
                            accumulated_answer += content + "\n"

            # response가 None이면 에러 처리 대신 accumulated_answer로 생성
            if response is None and accumulated_answer:
                from Agent.core.contracts import AgentResponse
                agent_type = last_chunk.get("agent_type", "router") if last_chunk else "router"
                response = AgentResponse(
                    answer=accumulated_answer.strip(),
                    status="success",
                    agent_type=agent_type,
                    sources=[],
                    papers=[],
                    tokens_used=0,
                    metadata={"individual_responses": individual_responses}
                )

            # 여전히 response가 None이면 에러
            if response is None:
                raise ValueError("No response received from router")

            # Extract individual responses (기존 로직과 호환)
            if not individual_responses and hasattr(response, 'metadata'):
                individual_responses = response.metadata.get("individual_responses", {})
            
            welfare_val = individual_responses.get("medical_welfare", "")
            nutrition_val = individual_responses.get("nutrition", "")
            research_val = individual_responses.get("research_paper", "")
            
            # Extract final answer
            answer = response.answer
            
            return {
                "index": index,
                "status": "success",
                "welfare": welfare_val,
                "nutrition": nutrition_val,
                "research": research_val,
                "intents": ", ".join(intents),
                "answer": answer,
                "sources": str(response.sources),
                "papers": str(response.papers),
                "tokens_used": response.tokens_used,
                "agent_status": response.status,
                "agent_type": response.agent_type,
                "metadata": str(response.metadata)
            }
            
        except Exception as e:
            logger.error(f"Error processing row {index}: {e}")
            return {
                "index": index,
                "status": "error",
                "error": str(e)
            }

async def main():
    # Load CSV
    csv_path = 'eval/eval.csv'
    if not os.path.exists(csv_path):
        logger.error(f"CSV file not found: {csv_path}")
        return

    df = pd.read_csv(csv_path)
    
    # Initialize columns
    new_columns = [
        '복지', '영양', '연구', '분류된_의도', 'rag+llm_answer',
        'sources', 'papers', 'tokens_used', 'agent_status', 'agent_type', 'metadata'
    ]
    for col in new_columns:
        if col not in df.columns:
            df[col] = ""
    
    # Initialize Router
    router = RouterAgent()
    
    total_rows = len(df)
    logger.info(f"Processing {total_rows} rows with concurrency=1...")
    
    output_path = 'eval/eval_result.csv'
    
    # Semaphore for concurrency control
    semaphore = asyncio.Semaphore(3)
    tasks = []
    
    for index, row in df.iterrows():
        if index <28:
            continue

        task = asyncio.create_task(process_row(semaphore, index, row, router, total_rows))
        tasks.append(task)
    
    # Wait for completion and update DF incrementally
    completed_count = 0
    for future in asyncio.as_completed(tasks):
        result = await future
        idx = result['index']
        
        if result['status'] == 'success':
            df.at[idx, '복지'] = result['welfare']
            df.at[idx, '영양'] = result['nutrition']
            df.at[idx, '연구'] = result['research']
            df.at[idx, '분류된_의도'] = result['intents']
            df.at[idx, 'rag+llm_answer'] = result['answer']
            df.at[idx, 'sources'] = result['sources']
            df.at[idx, 'papers'] = result['papers']
            df.at[idx, 'tokens_used'] = result['tokens_used']
            df.at[idx, 'agent_status'] = result['agent_status']
            df.at[idx, 'agent_type'] = result['agent_type']
            df.at[idx, 'metadata'] = result['metadata']
            logger.info(f"Row {idx+1} completed.")
        else:
            df.at[idx, '복지'] = f"Error: {result['error']}"
            df.at[idx, '영양'] = f"Error: {result['error']}"
            df.at[idx, '연구'] = f"Error: {result['error']}"
            df.at[idx, 'rag+llm_answer'] = f"Error: {result['error']}"
            df.at[idx, 'agent_status'] = "error"
            
        completed_count += 1
        if completed_count % 5 == 0:
            df.to_csv(output_path, index=False)
            logger.info(f"Saved progress to {output_path} ({completed_count}/{total_rows})")

    # Final save
    df.to_csv(output_path, index=False)
    logger.info(f"Saved final results to {output_path}")

if __name__ == "__main__":
    asyncio.run(main())
