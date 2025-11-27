#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CKD Nutrition Agent - LangGraph 기반 멀티턴 영양 상담 에이전트

기능:
1. 사용자 프로필 수집 (CKD 단계, 목표 수치)
2. 음식 사진 분석 (GPT-4o Vision)
3. 영양소 조회 (MongoDB)
4. 대체 레시피 추천 (RAG)
"""

import os
import json
import base64
from typing import TypedDict, Annotated, Literal, Optional, List, Dict, Any
from datetime import datetime

from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

load_dotenv()

# 프로젝트 imports
import sys
from pathlib import Path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.tools.nutrient_lookup import NutrientLookupTool
from backend.tools.rag_recipe_tool import RAGRecipeTool

# API 키
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# CKD 단계별 기본 목표치
CKD_TARGETS = {
    1: {"sodium_mg": 2300, "potassium_mg": 4700, "phosphorus_mg": 1250, "protein_g": 60},
    2: {"sodium_mg": 2300, "potassium_mg": 4700, "phosphorus_mg": 1250, "protein_g": 60},
    3: {"sodium_mg": 2000, "potassium_mg": 2700, "phosphorus_mg": 1000, "protein_g": 50},
    4: {"sodium_mg": 2000, "potassium_mg": 2500, "phosphorus_mg": 800, "protein_g": 45},
    5: {"sodium_mg": 2000, "potassium_mg": 2000, "phosphorus_mg": 800, "protein_g": 40},
    "dialysis": {"sodium_mg": 2000, "potassium_mg": 2500, "phosphorus_mg": 1000, "protein_g": 70}
}


# ===== State Definition =====
class NutritionState(TypedDict):
    """에이전트 상태"""
    messages: Annotated[list, add_messages]
    user_id: str
    profile_complete: bool
    ckd_stage: Optional[int]
    target_sodium_mg: Optional[int]
    target_potassium_mg: Optional[int]
    target_phosphorus_mg: Optional[int]
    target_protein_g: Optional[int]
    current_step: str
    image_data: Optional[str]
    detected_foods: Optional[List[str]]
    analysis_result: Optional[Dict[str, Any]]
    waiting_for_input: bool


# ===== LLM Setup =====
llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
    openai_api_key=OPENAI_API_KEY
)

vision_llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
    openai_api_key=OPENAI_API_KEY,
    max_tokens=1000
)


# ===== Tools =====
nutrient_tool = NutrientLookupTool()
rag_tool = RAGRecipeTool()


# ===== Node Functions =====

def check_profile(state: NutritionState) -> NutritionState:
    """사용자 프로필 확인"""
    user_id = state.get("user_id", "anonymous")

    # MongoDB에서 프로필 조회
    profile = nutrient_tool.get_user_profile(user_id)

    if profile and profile.get("profile_complete"):
        state["profile_complete"] = True
        state["ckd_stage"] = profile.get("ckd_stage")
        state["target_sodium_mg"] = profile.get("target_sodium_mg")
        state["target_potassium_mg"] = profile.get("target_potassium_mg")
        state["target_phosphorus_mg"] = profile.get("target_phosphorus_mg")
        state["target_protein_g"] = profile.get("target_protein_g")
        state["current_step"] = "ready"
    else:
        state["profile_complete"] = False
        state["current_step"] = "ask_ckd_stage"

    return state


def ask_ckd_stage(state: NutritionState) -> NutritionState:
    """CKD 단계 질문"""
    message = AIMessage(content="""안녕하세요! CKD(만성신장질환) 영양 상담을 도와드리겠습니다.

먼저 몇 가지 정보가 필요해요.

**신장병 진단을 받으셨나요? 몇 단계인가요?**

1. CKD 1단계
2. CKD 2단계
3. CKD 3단계
4. CKD 4단계
5. CKD 5단계
6. 투석 중
7. 모름 / 진단받지 않음

숫자나 단계를 입력해주세요.""")

    state["messages"] = [message]
    state["current_step"] = "waiting_ckd_stage"
    state["waiting_for_input"] = True

    return state


def process_ckd_stage(state: NutritionState) -> NutritionState:
    """CKD 단계 응답 처리"""
    last_message = state["messages"][-1].content.lower()

    # 응답 파싱
    stage = None

    if "모름" in last_message or "진단" in last_message or "7" in last_message:
        stage = 3  # 기본값
        state["messages"].append(AIMessage(content="알겠습니다. 일반적인 CKD 3단계 기준으로 설정하겠습니다."))
    elif "투석" in last_message or "6" in last_message:
        stage = "dialysis"
    elif "1" in last_message:
        stage = 1
    elif "2" in last_message:
        stage = 2
    elif "3" in last_message:
        stage = 3
    elif "4" in last_message:
        stage = 4
    elif "5" in last_message:
        stage = 5
    else:
        # 다시 질문
        state["messages"].append(AIMessage(content="죄송해요, 이해하지 못했어요. 1~7 중에서 선택해주세요."))
        state["waiting_for_input"] = True
        return state

    state["ckd_stage"] = stage

    # 기본 목표치 설정
    targets = CKD_TARGETS.get(stage, CKD_TARGETS[3])
    state["target_sodium_mg"] = targets["sodium_mg"]
    state["target_potassium_mg"] = targets["potassium_mg"]
    state["target_phosphorus_mg"] = targets["phosphorus_mg"]
    state["target_protein_g"] = targets["protein_g"]

    state["current_step"] = "ask_custom_targets"
    state["waiting_for_input"] = False

    return state


def ask_custom_targets(state: NutritionState) -> NutritionState:
    """커스텀 목표치 질문"""
    stage = state["ckd_stage"]
    stage_name = f"CKD {stage}단계" if isinstance(stage, int) else "투석"

    message = AIMessage(content=f"""좋아요! **{stage_name}** 기준으로 설정했습니다.

현재 목표치:
- 나트륨: {state['target_sodium_mg']}mg/일
- 칼륨: {state['target_potassium_mg']}mg/일
- 인: {state['target_phosphorus_mg']}mg/일
- 단백질: {state['target_protein_g']}g/일

**주치의가 권장한 다른 목표치가 있으신가요?**

예시: "나트륨 1500, 칼륨 2000" 또는 "없음"

없으면 '없음' 또는 '괜찮아요'라고 입력해주세요.""")

    state["messages"].append(message)
    state["current_step"] = "waiting_custom_targets"
    state["waiting_for_input"] = True

    return state


def process_custom_targets(state: NutritionState) -> NutritionState:
    """커스텀 목표치 응답 처리"""
    last_message = state["messages"][-1].content.lower()

    if "없" in last_message or "괜찮" in last_message or "아니" in last_message:
        pass  # 기본값 유지
    else:
        # 숫자 파싱 시도
        import re
        numbers = re.findall(r'(\w+)\s*[:\s]\s*(\d+)', last_message)

        for key, value in numbers:
            value = int(value)
            if "나트륨" in key or "나" in key:
                state["target_sodium_mg"] = value
            elif "칼륨" in key or "칼" in key:
                state["target_potassium_mg"] = value
            elif "인" in key:
                state["target_phosphorus_mg"] = value
            elif "단백" in key:
                state["target_protein_g"] = value

    # 프로필 저장
    profile_data = {
        "ckd_stage": state["ckd_stage"],
        "target_sodium_mg": state["target_sodium_mg"],
        "target_potassium_mg": state["target_potassium_mg"],
        "target_phosphorus_mg": state["target_phosphorus_mg"],
        "target_protein_g": state["target_protein_g"],
        "profile_complete": True
    }

    nutrient_tool.update_user_profile(state["user_id"], profile_data)

    state["profile_complete"] = True
    state["current_step"] = "profile_complete"
    state["waiting_for_input"] = False

    # 완료 메시지
    state["messages"].append(AIMessage(content=f"""프로필 설정이 완료되었습니다!

**저장된 목표치:**
- 나트륨: {state['target_sodium_mg']}mg/일
- 칼륨: {state['target_potassium_mg']}mg/일
- 인: {state['target_phosphorus_mg']}mg/일
- 단백질: {state['target_protein_g']}g/일

이제 음식 사진을 보내시거나 "OO 먹어도 될까요?"라고 물어보세요!"""))

    return state


def analyze_image(state: NutritionState) -> NutritionState:
    """GPT-4o Vision으로 음식 사진 분석"""
    image_data = state.get("image_data")

    if not image_data:
        state["messages"].append(AIMessage(content="이미지를 찾을 수 없습니다. 다시 업로드해주세요."))
        return state

    # Vision 분석
    vision_prompt = """이 음식 사진을 분석해주세요.

1. 음식 이름들을 한국어로 나열해주세요 (쉼표로 구분)
2. 각 음식의 대략적인 양도 추정해주세요

형식:
음식: 밥 1공기, 김치 50g, 된장국 1그릇, 불고기 100g

음식 이름만 정확히 나열해주세요."""

    try:
        response = vision_llm.invoke([
            HumanMessage(content=[
                {"type": "text", "text": vision_prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
            ])
        ])

        # 음식 파싱
        content = response.content
        foods = []

        if ":" in content:
            food_part = content.split(":")[-1]
            foods = [f.strip().split()[0] for f in food_part.split(",") if f.strip()]
        else:
            foods = [f.strip() for f in content.split(",") if f.strip()]

        state["detected_foods"] = foods
        state["current_step"] = "analyze_nutrients"

        state["messages"].append(AIMessage(content=f"음식 인식 완료: {', '.join(foods)}"))

    except Exception as e:
        state["messages"].append(AIMessage(content=f"이미지 분석 중 오류가 발생했습니다: {str(e)}"))
        state["current_step"] = "ready"

    return state


def analyze_nutrients(state: NutritionState) -> NutritionState:
    """영양소 분석 및 평가"""
    foods = state.get("detected_foods", [])

    if not foods:
        state["messages"].append(AIMessage(content="분석할 음식이 없습니다."))
        state["current_step"] = "ready"
        return state

    # MongoDB에서 영양 정보 조회
    analysis = nutrient_tool.analyze_meal_nutrients(foods, state.get("user_id"))

    state["analysis_result"] = analysis

    # 결과 포맷팅
    result = format_analysis_result(state, analysis)

    state["messages"].append(AIMessage(content=result))

    # 고위험 영양소가 있으면 대체 식품 추천
    if analysis.get("warnings"):
        state["current_step"] = "suggest_alternatives"
    else:
        state["current_step"] = "ready"

    return state


def suggest_alternatives(state: NutritionState) -> NutritionState:
    """대체 식품 및 레시피 추천"""
    analysis = state.get("analysis_result", {})
    warnings = analysis.get("warnings", [])

    if not warnings:
        state["current_step"] = "ready"
        return state

    suggestions = []

    for warning in warnings:
        if "칼륨" in warning:
            results = rag_tool.get_low_potassium_recipes()
            if results:
                suggestions.append("**저칼륨 대체 식품:**\n" + results[0]['content'][:300])

        elif "인" in warning:
            results = rag_tool.get_low_phosphorus_recipes()
            if results:
                suggestions.append("**저인 대체 식품:**\n" + results[0]['content'][:300])

        elif "나트륨" in warning:
            results = rag_tool.get_low_sodium_recipes()
            if results:
                suggestions.append("**저나트륨 조리법:**\n" + results[0]['content'][:300])

    if suggestions:
        state["messages"].append(AIMessage(content="\n\n".join(suggestions)))

    state["current_step"] = "ready"
    return state


def handle_text_query(state: NutritionState) -> NutritionState:
    """텍스트 질문 처리 ("OO 먹어도 될까요?")"""
    last_message = state["messages"][-1].content

    # 음식명 추출
    import re
    match = re.search(r'(.+?)\s*먹어도', last_message)

    if match:
        food_name = match.group(1).strip()
        state["detected_foods"] = [food_name]
        state["current_step"] = "analyze_nutrients"
    else:
        # 일반 질문은 RAG로 검색
        results = rag_tool.search_recipes(last_message)
        if results:
            response = rag_tool.format_results_for_chat(results)
            state["messages"].append(AIMessage(content=response))
        else:
            state["messages"].append(AIMessage(content="죄송합니다. 관련 정보를 찾을 수 없습니다."))

        state["current_step"] = "ready"

    return state


# ===== Helper Functions =====

def format_analysis_result(state: NutritionState, analysis: Dict[str, Any]) -> str:
    """분석 결과를 프론트엔드 카드용 JSON 포맷으로 변환"""

    # 기본 결과 텍스트
    total = analysis.get("total", {})
    percentages = analysis.get("percentages", {})
    warnings = analysis.get("warnings", [])

    result = f"""## 영양 분석 결과

**총 영양소:**
- 나트륨: {total.get('sodium_mg', 0):.0f}mg ({percentages.get('sodium_mg', 0):.0f}%)
- 칼륨: {total.get('potassium_mg', 0):.0f}mg ({percentages.get('potassium_mg', 0):.0f}%)
- 인: {total.get('phosphorus_mg', 0):.0f}mg ({percentages.get('phosphorus_mg', 0):.0f}%)
- 단백질: {total.get('protein_g', 0):.0f}g ({percentages.get('protein_g', 0):.0f}%)
- 칼로리: {total.get('calories', 0):.0f}kcal

"""

    if warnings:
        result += "**주의사항:**\n"
        for w in warnings:
            result += f"- {w}\n"
    else:
        result += "이 식사는 목표치 범위 내입니다."

    # 프론트엔드용 JSON 데이터
    card_data = {
        "type": "nutrition_analysis",
        "foods": analysis.get("foods", []),
        "total": total,
        "percentages": percentages,
        "targets": analysis.get("targets", {}),
        "warnings": warnings,
        "is_safe": analysis.get("is_safe", True)
    }

    result += f"\n\n```json\n{json.dumps(card_data, ensure_ascii=False, indent=2)}\n```"

    return result


# ===== Node: Router =====

def router(state: NutritionState) -> NutritionState:
    """진입점 라우터 - 상태를 그대로 반환"""
    return state


# ===== Conditional Edges =====

def route_entry(state: NutritionState) -> str:
    """진입점 라우팅 - current_step에 따라 분기"""
    current_step = state.get("current_step", "start")

    if current_step == "start":
        return "check_profile"
    elif current_step == "waiting_ckd_stage":
        return "process_ckd_stage"
    elif current_step == "waiting_custom_targets":
        return "process_custom_targets"
    elif state.get("image_data"):
        return "analyze_image"
    elif current_step == "ready" or state.get("profile_complete"):
        return "handle_text_query"
    else:
        return "check_profile"


def route_after_check_profile(state: NutritionState) -> str:
    """프로필 확인 후 라우팅"""
    if state.get("profile_complete"):
        return "ready"
    else:
        return "ask_ckd_stage"


def route_after_message(state: NutritionState) -> str:
    """메시지 수신 후 라우팅"""
    current_step = state.get("current_step", "")

    if current_step == "waiting_ckd_stage":
        return "process_ckd_stage"
    elif current_step == "waiting_custom_targets":
        return "process_custom_targets"
    elif state.get("image_data"):
        return "analyze_image"
    else:
        return "handle_text_query"


def route_after_nutrients(state: NutritionState) -> str:
    """영양소 분석 후 라우팅"""
    analysis = state.get("analysis_result")
    if analysis and analysis.get("warnings"):
        return "suggest_alternatives"
    else:
        return END


# ===== Build Graph =====

def build_nutrition_graph():
    """LangGraph 그래프 구축"""

    workflow = StateGraph(NutritionState)

    # 노드 추가
    workflow.add_node("router", router)
    workflow.add_node("check_profile", check_profile)
    workflow.add_node("ask_ckd_stage", ask_ckd_stage)
    workflow.add_node("process_ckd_stage", process_ckd_stage)
    workflow.add_node("ask_custom_targets", ask_custom_targets)
    workflow.add_node("process_custom_targets", process_custom_targets)
    workflow.add_node("analyze_image", analyze_image)
    workflow.add_node("analyze_nutrients", analyze_nutrients)
    workflow.add_node("suggest_alternatives", suggest_alternatives)
    workflow.add_node("handle_text_query", handle_text_query)

    # 진입점 설정
    workflow.set_entry_point("router")

    # 라우터에서 조건부 분기
    workflow.add_conditional_edges(
        "router",
        route_entry,
        {
            "check_profile": "check_profile",
            "process_ckd_stage": "process_ckd_stage",
            "process_custom_targets": "process_custom_targets",
            "analyze_image": "analyze_image",
            "handle_text_query": "handle_text_query"
        }
    )

    # 엣지 추가
    workflow.add_conditional_edges(
        "check_profile",
        route_after_check_profile,
        {
            "ready": END,
            "ask_ckd_stage": "ask_ckd_stage"
        }
    )

    workflow.add_edge("ask_ckd_stage", END)  # 사용자 입력 대기
    workflow.add_edge("process_ckd_stage", "ask_custom_targets")
    workflow.add_edge("ask_custom_targets", END)  # 사용자 입력 대기
    workflow.add_edge("process_custom_targets", END)

    workflow.add_edge("analyze_image", "analyze_nutrients")

    workflow.add_conditional_edges(
        "analyze_nutrients",
        route_after_nutrients,
        {
            "suggest_alternatives": "suggest_alternatives",
            END: END
        }
    )

    workflow.add_edge("suggest_alternatives", END)
    workflow.add_edge("handle_text_query", "analyze_nutrients")

    return workflow.compile()


# ===== Main Agent Class =====

class NutritionAgent:
    """CKD 영양 상담 에이전트"""

    def __init__(self):
        self.graph = build_nutrition_graph()
        self.sessions: Dict[str, NutritionState] = {}

    def get_or_create_session(self, user_id: str) -> NutritionState:
        """세션 조회 또는 생성"""
        if user_id not in self.sessions:
            self.sessions[user_id] = {
                "messages": [],
                "user_id": user_id,
                "profile_complete": False,
                "ckd_stage": None,
                "target_sodium_mg": None,
                "target_potassium_mg": None,
                "target_phosphorus_mg": None,
                "target_protein_g": None,
                "current_step": "start",
                "image_data": None,
                "detected_foods": None,
                "analysis_result": None,
                "waiting_for_input": False
            }

        return self.sessions[user_id]

    def process_message(
        self,
        user_id: str,
        message: str,
        image_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        메시지 처리

        Args:
            user_id: 사용자 ID
            message: 텍스트 메시지
            image_base64: 이미지 base64 데이터 (선택)

        Returns:
            응답 결과
        """
        state = self.get_or_create_session(user_id)

        # 메시지 추가
        state["messages"].append(HumanMessage(content=message))

        # 이미지 데이터 설정
        if image_base64:
            state["image_data"] = image_base64

        # 그래프 실행
        result = self.graph.invoke(state)

        # 세션 업데이트
        self.sessions[user_id] = result

        # 마지막 AI 메시지 추출
        ai_messages = [m for m in result["messages"] if isinstance(m, AIMessage)]
        last_response = ai_messages[-1].content if ai_messages else ""

        return {
            "response": last_response,
            "profile_complete": result.get("profile_complete", False),
            "waiting_for_input": result.get("waiting_for_input", False),
            "analysis": result.get("analysis_result")
        }

    def start_session(self, user_id: str) -> Dict[str, Any]:
        """새 세션 시작"""
        state = self.get_or_create_session(user_id)

        # 프로필 체크부터 시작
        result = self.graph.invoke(state)
        self.sessions[user_id] = result

        ai_messages = [m for m in result["messages"] if isinstance(m, AIMessage)]
        last_response = ai_messages[-1].content if ai_messages else ""

        return {
            "response": last_response,
            "profile_complete": result.get("profile_complete", False),
            "waiting_for_input": result.get("waiting_for_input", False)
        }


# ===== Singleton Instance =====
_agent_instance = None

def get_nutrition_agent() -> NutritionAgent:
    """싱글톤 에이전트 인스턴스 반환"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = NutritionAgent()
    return _agent_instance


# ===== Test =====
if __name__ == "__main__":
    agent = get_nutrition_agent()

    print("=== CKD Nutrition Agent 테스트 ===\n")

    user_id = "test_user_456"  # 새로운 테스트 유저

    # 세션 시작
    result = agent.start_session(user_id)

    # 디버깅: 세션 상태 확인
    session = agent.sessions.get(user_id, {})
    print(f"[DEBUG] current_step: {session.get('current_step')}")
    print(f"[DEBUG] profile_complete: {session.get('profile_complete')}")
    print(f"[DEBUG] messages count: {len(session.get('messages', []))}")

    print(f"[Agent] {result['response']}\n")

    # 대화 시뮬레이션
    test_messages = [
        ("3", True),  # CKD 3단계 - waiting for input
        ("없음", False),  # 커스텀 목표 없음 - profile complete
    ]

    for msg, _ in test_messages:
        print(f"[User] {msg}")
        result = agent.process_message(user_id, msg)
        print(f"[Agent] {result['response']}\n")

    # 프로필 완료 후 음식 질문 테스트
    if result.get("profile_complete"):
        print("=== 음식 질문 테스트 ===\n")
        food_query = "바나나 먹어도 될까요?"
        print(f"[User] {food_query}")
        result = agent.process_message(user_id, food_query)
        print(f"[Agent] {result['response']}\n")

        # 분석 결과 확인
        if result.get("analysis"):
            print("[분석 결과]")
            print(f"  안전 여부: {result['analysis'].get('is_safe', 'N/A')}")
            print(f"  경고: {result['analysis'].get('warnings', [])}")
    else:
        print("[오류] 프로필 설정이 완료되지 않았습니다.")
