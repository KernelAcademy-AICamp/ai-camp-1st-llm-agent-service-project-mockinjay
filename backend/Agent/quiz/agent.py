"""
Quiz Agent Implementation
퀴즈 생성 및 관리 에이전트
"""

import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from bson import ObjectId

from ..core.local_agent import LocalAgent
from ..core.agent_registry import AgentRegistry
from ..core.contracts import AgentRequest, AgentResponse
from ..api.vector_client import VectorClient
from ..api.mongodb_client import MongoDBClient
from ..api.openai_client import OpenAIClient
from .prompts import (
    QUIZ_GENERATION_SYSTEM_PROMPT,
    QUIZ_GENERATION_USER_PROMPT_TEMPLATE,
    QUIZ_FEEDBACK_PROMPT_TEMPLATE,
    CATEGORY_KEYWORDS,
    CATEGORY_NAMES_KR,
    DIFFICULTY_DESCRIPTIONS
)

# MongoDB 직접 접근용
import sys
from pathlib import Path
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))
from app.db.connection import db

logger = logging.getLogger(__name__)

# 난이도별 정답 1개당 점수
POINTS_PER_CORRECT = {
    "easy": 3,      # 3점 × 5문제 = 최대 15점
    "medium": 5,    # 5점 × 5문제 = 최대 25점
    "hard": 7,      # 7점 × 5문제 = 최대 35점
}

# 난이도별 최대 점수 (5문제 기준)
DIFFICULTY_MAX_SCORES = {
    "easy": 15,     # 3 × 5 = 15
    "medium": 25,   # 5 × 5 = 25
    "hard": 35,     # 7 × 5 = 35
}

# 문제 수는 모든 난이도에서 5개로 고정
NUM_QUESTIONS = 5


@AgentRegistry.register("quiz")
class QuizAgent(LocalAgent):
    """퀴즈 생성 및 관리 Agent"""

    def __init__(self):
        super().__init__(agent_type="quiz")
        self.openai_client = OpenAIClient(model="gpt-4o-mini")
        self.vector_client = VectorClient()
        self.mongodb_client = MongoDBClient()
    
    @property
    def metadata(self) -> Dict[str, Any]:
        """에이전트 메타데이터"""
        return {
            "name": "Quiz Agent",
            "description": "RAG 기반 CKD 퀴즈 생성 및 관리",
            "version": "2.0",
            "capabilities": [
                "quiz_generation",
                "rag_search",
                "answer_submission",
                "session_management",
                "user_stats",
                "quiz_history"
            ],
            "supported_session_types": ["daily_quiz", "level_test", "learning_mission"]
        }

    async def process(self, request: AgentRequest) -> AgentResponse:
        """
        통일된 계약 기반 처리 (새 인터페이스)
        
        Args:
            request: AgentRequest
            
        Returns:
            AgentResponse: 통일된 응답 형식
        """
        # 기존 메서드 호출 (어댑터 패턴)
        legacy_result = await self._process_legacy(
            request.query,
            request.session_id,
            request.context
        )
        
        # Dict -> AgentResponse 변환
        if not legacy_result.get("success", False):
            return AgentResponse(
                answer=legacy_result.get("error", "퀴즈 처리 오류"),
                status="error",
                agent_type=self.agent_type,
                metadata=legacy_result.get("metadata", {})
            )
        
        # 액션 감지: legacy_result의 필드를 보고 어떤 액션이 실행되었는지 판단
        if "sessionId" in legacy_result and "currentQuestion" in legacy_result:
            # generate_quiz 액션
            action = "generate_quiz"
        elif "isCorrect" in legacy_result and "explanation" in legacy_result:
            # submit_answer 액션
            action = "submit_answer"
        elif "accuracyRate" in legacy_result and "completedAt" in legacy_result:
            # complete_session 액션
            action = "complete_session"
        elif "totalSessions" in legacy_result:
            # get_stats 액션
            action = "get_stats"
        elif "sessions" in legacy_result or "total" in legacy_result:
            # get_history 액션
            action = "get_history"
        else:
            # 알 수 없는 액션
            action = None
        
        # answer 필드 생성 (액션별로 다름)
        if action == "generate_quiz":
            session_type_kr = {
                "daily_quiz": "일일 퀴즈",
                "level_test": "레벨 테스트",
                "learning_mission": "학습 미션"
            }.get(legacy_result.get('sessionType'), "퀴즈")
            
            total_questions = legacy_result.get('totalQuestions', 0)
            current_question = legacy_result.get('currentQuestion', {})
            question_text = current_question.get('question', '')
            
            answer = f"""🎯 {session_type_kr}가 시작되었습니다!

📝 **문제 1/{total_questions}**
{question_text}

위 문장이 맞으면 'True', 틀리면 'False'를 선택하세요."""
        elif action == "submit_answer":
            is_correct = legacy_result.get("isCorrect", False)
            explanation = legacy_result.get("explanation", "")
            current_score = legacy_result.get("currentScore", 0)
            consecutive = legacy_result.get("consecutiveCorrect", 0)
            
            result_emoji = "✅" if is_correct else "❌"
            result_text = "정답입니다!" if is_correct else "틀렸습니다."
            
            answer = f"""{result_emoji} {result_text}

💡 **해설**: {explanation}

📊 현재 점수: {current_score}점"""
            
            if consecutive >= 3:
                answer += f"\n🔥 연속 {consecutive}개 정답! 보너스 +5점!"
                
        elif action == "complete_session":
            accuracy = legacy_result.get("accuracyRate", 0)
            final_score = legacy_result.get("finalScore", 0)
            total = legacy_result.get("totalQuestions", 0)
            correct = legacy_result.get("correctAnswers", 0)
            
            answer = f"""🎉 퀴즈를 완료했습니다!

📊 최종 결과:
   - 정답률: {accuracy}% ({correct}/{total})
   - 최종 점수: {final_score}점"""
   
            streak = legacy_result.get("streak")
            if streak:
                answer += f"\n🔥 현재 연속 {streak}일째 퀴즈 풀이 중!"
                
        elif action == "get_stats":
            total_sessions = legacy_result.get("totalSessions", 0)
            total_questions = legacy_result.get("totalQuestions", 0)
            correct_answers = legacy_result.get("correctAnswers", 0)
            accuracy = (correct_answers / total_questions * 100) if total_questions > 0 else 0
            
            answer = f"""📊 퀴즈 통계

   - 총 세션: {total_sessions}개
   - 총 문제: {total_questions}개
   - 정답: {correct_answers}개
   - 정답률: {accuracy:.1f}%"""
   
        elif action == "get_history":
            total = legacy_result.get("total", 0)
            answer = f"📚 총 {total}개의 퀴즈 이력이 있습니다."
        else:
            answer = "퀴즈 요청이 처리되었습니다."
        
        return AgentResponse(
            answer=answer,
            sources=[],
            papers=[],
            tokens_used=legacy_result.get("tokens_used", 0),
            status="success",
            agent_type=self.agent_type,
            metadata=legacy_result  # 전체 레거시 응답을 메타데이터로 포함
        )
    
    async def _process_legacy(
        self,
        user_input: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        기존 process 메서드 (하위 호환성 유지)
        
        퀴즈 관련 요청 처리

        Args:
            user_input: 사용자 입력 (action 포함)
            session_id: 세션 ID
            context: 추가 컨텍스트 (action, params 등)

        Returns:
            Dict[str, Any]: 처리 결과
        """
        # 자연어 쿼리 감지: context가 없거나 비어있는 경우
        if not context or not context.get("action"):
            # 퀴즈 요청인지 확인
            quiz_keywords = ["퀴즈", "quiz", "문제", "테스트", "시험"]
            if any(keyword in user_input.lower() for keyword in quiz_keywords):
                # 기본 daily_quiz 설정으로 자동 생성
                logger.info(f"자연어 퀴즈 요청 감지: {user_input}")
                context = {
                    "action": "generate_quiz",
                    "userId": session_id,  # session_id를 userId로 사용
                    "sessionType": "daily_quiz",
                    "category": None,  # daily_quiz는 카테고리 자동 선택
                    "difficulty": None  # daily_quiz는 난이도 혼합
                }
            else:
                return {
                    "success": False,
                    "error": "퀴즈 에이전트에 컨텍스트가 필요합니다",
                    "hint": "퀴즈를 시작하려면 '퀴즈'라는 단어를 포함하거나, context에 action을 지정하세요.",
                    "available_actions": [
                        "generate_quiz",
                        "submit_answer",
                        "complete_session",
                        "get_stats",
                        "get_history"
                    ]
                }

        action = context.get("action")

        try:
            if action == "generate_quiz":
                return await self._generate_quiz_session(context, session_id)
            elif action == "submit_answer":
                return await self._submit_answer(context, session_id)
            elif action == "complete_session":
                return await self._complete_session(context, session_id)
            elif action == "get_stats":
                return await self._get_user_stats(context, session_id)
            elif action == "get_history":
                return await self._get_quiz_history(context, session_id)
            else:
                return {
                    "success": False,
                    "error": f"알 수 없는 작업입니다: {action}",
                    "available_actions": [
                        "generate_quiz",
                        "submit_answer",
                        "complete_session",
                        "get_stats",
                        "get_history"
                    ]
                }

        except Exception as e:
            logger.error(f"퀴즈 에이전트 오류: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "metadata": {
                    "agent_type": self.agent_type,
                    "session_id": session_id,
                }
            }

    async def _generate_quiz_session(
        self,
        context: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        퀴즈 세션 생성 (DB에서 문제 가져오기)

        Args:
            context: 세션 파라미터 (userId, sessionType, category, difficulty)
            session_id: 세션 ID

        Returns:
            Dict[str, Any]: 세션 정보 및 첫 번째 문제
        """
        user_id = context.get("userId")
        session_type = context.get("sessionType")
        category = context.get("category")
        difficulty = context.get("difficulty")

        # DB에서 퀴즈 가져오기 (5문제 고정)
        questions = await self._fetch_questions_from_pool(
            user_id=user_id,
            category=category,
            difficulty=difficulty,
            num_questions=NUM_QUESTIONS
        )

        if not questions:
            return {
                "success": False,
                "error": "퀴즈 문제를 가져올 수 없습니다. 퀴즈 풀이 비어있습니다."
            }

        # MongoDB에 세션 저장
        sessions_collection = db["quiz_sessions"]

        # 문제 ID 및 메타데이터 준비
        question_ids = [str(q["_id"]) for q in questions]
        questions_metadata = [
            {
                "questionId": str(q["_id"]),
                "category": q["category"],
                "difficulty": q["difficulty"]
            }
            for q in questions
        ]

        # 세션 저장
        session_doc = {
            "userId": user_id,
            "sessionType": session_type,
            "difficulty": difficulty,  # 난이도 저장
            "questionIds": question_ids,
            "questionsMetadata": questions_metadata,
            "currentQuestionIndex": 0,
            "answers": [],
            "score": 0,
            "maxScore": DIFFICULTY_MAX_SCORES.get(difficulty, 15),  # 최대 점수
            "status": "in_progress",
            "startedAt": datetime.utcnow(),
            "completedAt": None
        }
        session_result = await sessions_collection.insert_one(session_doc)
        session_obj_id = str(session_result.inserted_id)

        # 첫 번째 문제
        first_question = questions[0]

        # 클라이언트에게 답안/해설 숨기고 실제 카테고리/난이도 반환
        response_question = {
            "id": str(first_question["_id"]),
            "category": first_question["category"],
            "difficulty": first_question["difficulty"],
            "question": first_question["question"],
            "answer": True,  # 더미값
            "explanation": ""  # 숨김
        }

        return {
            "success": True,
            "sessionId": session_obj_id,
            "userId": user_id,
            "sessionType": session_type,
            "difficulty": difficulty,
            "totalQuestions": len(question_ids),
            "currentQuestionNumber": 1,
            "score": 0,
            "maxScore": DIFFICULTY_MAX_SCORES.get(difficulty, 15),
            "pointsPerCorrect": POINTS_PER_CORRECT.get(difficulty, 3),
            "status": "in_progress",
            "currentQuestion": response_question,
            "tokens_used": 0,  # DB에서 가져오므로 토큰 사용 없음
            "metadata": {
                "agent_type": self.agent_type,
                "session_id": session_id,
            }
        }

    async def _fetch_questions_from_pool(
        self,
        user_id: str,
        category: Optional[str],
        difficulty: Optional[str],
        num_questions: int = 5
    ) -> List[Dict]:
        """
        DB의 quiz_pool에서 문제 가져오기 (이미 푼 문제는 제외)

        Args:
            user_id: 사용자 ID
            category: 카테고리 필터 (None이면 전체)
            difficulty: 난이도 필터 (None이면 전체)
            num_questions: 가져올 문제 수

        Returns:
            List[Dict]: 선택된 퀴즈 문제들
        """
        quiz_pool = db["quiz_pool"]
        user_quiz_history = db["user_quiz_history"]

        # 사용자가 맞춘 문제만 제외 (틀린 문제는 다시 출제 가능)
        correct_cursor = user_quiz_history.find({
            "userId": user_id,
            "isCorrect": True
        })
        correct_history = await correct_cursor.to_list(length=None)
        correct_question_ids = set()
        for h in correct_history:
            if "questionId" in h:
                try:
                    correct_question_ids.add(ObjectId(h["questionId"]))
                except Exception as e:
                    # 잘못된 문제 ID 형식, 건너뛰기 (Invalid question ID format, skip)
                    logger.warning(f"Invalid question ID in history: {e}")
                    pass

        logger.info(f"사용자 {user_id}: 맞춘 문제 {len(correct_question_ids)}개 제외")

        # 필터 조건 구성
        filter_condition = {}
        if category:
            filter_condition["category"] = category
        if difficulty:
            filter_condition["difficulty"] = difficulty

        # 맞춘 문제 제외하여 가져오기
        if correct_question_ids:
            filter_condition["_id"] = {"$nin": list(correct_question_ids)}

        all_questions = await quiz_pool.find(filter_condition).to_list(length=None)

        # 문제가 부족하면 필터 조건 완화 (난이도만 유지)
        if len(all_questions) < num_questions and category:
            logger.info(f"카테고리 필터 완화: {len(all_questions)}개 → 전체 카테고리 검색")
            filter_condition.pop("category", None)
            all_questions = await quiz_pool.find(filter_condition).to_list(length=None)

        # 그래도 부족하면 맞춘 문제도 포함 (사이클 반복)
        if len(all_questions) < num_questions:
            logger.info(f"문제 부족 ({len(all_questions)}개): 맞춘 문제 포함하여 재선택")
            filter_condition.pop("_id", None)  # 제외 조건 제거
            all_questions = await quiz_pool.find(filter_condition).to_list(length=None)

        if not all_questions:
            return []

        # 랜덤 셔플 후 선택
        import random
        random.shuffle(all_questions)

        return all_questions[:num_questions]

    async def _generate_questions_with_rag(
        self,
        category: str,
        difficulty: str,
        num_questions: int = 5
    ) -> List[Dict]:
        """
        RAG 기반 퀴즈 생성

        Args:
            category: 카테고리
            difficulty: 난이도
            num_questions: 문제 수

        Returns:
            List[Dict]: 생성된 퀴즈 문제들
        """
        # 1. 카테고리 키워드로 RAG 검색
        keywords = CATEGORY_KEYWORDS.get(category, [])
        search_query = f"만성콩팥병 {CATEGORY_NAMES_KR[category]} {' '.join(keywords[:5])}"

        # Vector DB 검색 (의학 논문, 가이드라인)
        rag_results = await self.vector_client.semantic_search(
            query=search_query,
            namespace="papers_kidney",
            top_k=5
        )

        # MongoDB 검색 (Q&A, 의료 정보)
        mongodb_results = await self.mongodb_client.search_parallel(
            query=search_query,
            collections=["qa_kidney", "guidelines_kidney"],
            limit=5
        )

        # RAG 컨텍스트 구성
        rag_context = self._build_rag_context(rag_results, mongodb_results)

        # 2. OpenAI로 퀴즈 생성
        category_kr = CATEGORY_NAMES_KR.get(category, category)
        difficulty_kr = DIFFICULTY_DESCRIPTIONS.get(difficulty, difficulty)

        user_prompt = QUIZ_GENERATION_USER_PROMPT_TEMPLATE.format(
            num_questions=num_questions,
            category=category,
            category_kr=category_kr,
            difficulty=difficulty,
            difficulty_kr=difficulty_kr,
            rag_context=rag_context
        )

        result = await self.openai_client.generate(
            prompt=user_prompt,
            system_prompt=QUIZ_GENERATION_SYSTEM_PROMPT,
            temperature=0.7,
            max_tokens=2000
        )

        # 3. JSON 파싱 (마크다운 코드 블록 제거)
        try:
            response_text = result["text"].strip()
            
            # 마크다운 코드 블록 제거 (```json ... ```)
            if response_text.startswith("```"):
                # 첫 번째 줄 제거 (```json)
                lines = response_text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                # 마지막 줄 제거 (```)
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                response_text = "\n".join(lines).strip()
            
            questions = json.loads(response_text)
            if not isinstance(questions, list):
                raise ValueError("퀴즈 문제 목록 형식이 올바르지 않습니다")

            # 카테고리/난이도 메타데이터 추가 (모든 문제에)
            for q in questions:
                q["category"] = category
                q["difficulty"] = difficulty

            return questions

        except json.JSONDecodeError as e:
            logger.error(f"퀴즈 JSON 파싱 실패: {e}")
            logger.error(f"원본 응답: {result['text'][:500]}...")
            logger.error(f"정제된 응답: {response_text[:500]}...")
            raise ValueError("퀴즈 문제 생성에 실패했습니다")

    def _build_rag_context(
        self,
        vector_results: List[Dict],
        mongodb_results: List[Dict]
    ) -> str:
        """
        RAG 검색 결과를 컨텍스트로 변환

        Args:
            vector_results: Vector DB 검색 결과
            mongodb_results: MongoDB 검색 결과

        Returns:
            str: 포맷팅된 컨텍스트
        """
        context_parts = []

        # Vector DB 결과 (논문/가이드라인)
        if vector_results:
            context_parts.append("=== 연구 논문 및 가이드라인 ===")
            for i, result in enumerate(vector_results[:3], 1):
                text = result.get("text", "")[:300]
                score = result.get("score", 0)
                context_parts.append(f"{i}. [신뢰도: {score:.2f}] {text}...")

        # MongoDB 결과 (Q&A, 의료 정보)
        if mongodb_results:
            context_parts.append("\n=== 환자 Q&A 및 의료 정보 ===")
            for i, result in enumerate(mongodb_results[:3], 1):
                if "question" in result:
                    question = result.get("question", "")
                    answer = result.get("answer", "")[:200]
                    context_parts.append(f"{i}. Q: {question}\n   A: {answer}...")
                else:
                    text = result.get("content", result.get("text", ""))[:200]
                    context_parts.append(f"{i}. {text}...")

        return "\n".join(context_parts) if context_parts else "참고 자료 없음 (일반 지식 기반)"

    def _determine_question_config(
        self,
        session_type: str,
        category: Optional[str],
        difficulty: Optional[str]
    ) -> List[Dict]:
        """
        세션 타입에 따른 문제 구성 결정

        Returns:
            List[Dict]: [{"category": "nutrition", "difficulty": "easy", "count": 2}, ...]
        """
        if session_type == "level_test":
            # 난이도 혼합 (easy 2 + medium 2 + hard 1)
            categories = ["nutrition", "treatment", "lifestyle"]
            return [
                {"category": cat, "difficulty": "easy", "count": 1}
                for cat in categories[:2]
            ] + [
                {"category": categories[0], "difficulty": "medium", "count": 1},
                {"category": categories[1], "difficulty": "medium", "count": 1},
                {"category": categories[2], "difficulty": "hard", "count": 1}
            ]

        elif session_type == "learning_mission":
            # 특정 카테고리/난이도 집중 (5문제)
            if not category or not difficulty:
                raise ValueError("학습 미션에는 카테고리와 난이도가 필요합니다")
            return [{"category": category, "difficulty": difficulty, "count": 5}]

        elif session_type == "daily_quiz":
            # 기본~보통 난이도 (easy 3 + medium 2)
            categories = ["nutrition", "treatment", "lifestyle"]
            return [
                {"category": categories[0], "difficulty": "easy", "count": 2},
                {"category": categories[1], "difficulty": "easy", "count": 1},
                {"category": categories[2], "difficulty": "medium", "count": 2}
            ]

        else:
            raise ValueError(f"알 수 없는 세션 타입입니다: {session_type}")

    async def _submit_answer(
        self,
        context: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        답안 제출 처리

        Returns:
            QuizAnswerResponse 형식:
            - isCorrect, correctAnswer, explanation
            - pointsEarned, currentScore, consecutiveCorrect
            - questionStats (totalAttempts, correctAttempts, userChoicePercentage)
            - nextQuestion (QuizQuestion 형식, 답안/해설 숨김)
        """
        quiz_session_id = context.get("sessionId")
        user_id = context.get("userId")
        question_id = context.get("questionId")
        user_answer = context.get("userAnswer")

        sessions_collection = db["quiz_sessions"]
        quiz_pool = db["quiz_pool"]  # quiz_questions -> quiz_pool로 변경
        attempts_collection = db["quiz_attempts"]
        user_quiz_history = db["user_quiz_history"]  # 사용자 퀴즈 이력 추가

        # 세션 조회
        session = await sessions_collection.find_one({"_id": ObjectId(quiz_session_id)})
        if not session:
            return {"success": False, "error": "세션을 찾을 수 없습니다"}

        if session["status"] != "in_progress":
            return {"success": False, "error": "이미 완료된 세션입니다"}

        # 문제 조회 (quiz_pool에서)
        question = await quiz_pool.find_one({"_id": ObjectId(question_id)})
        if not question:
            return {"success": False, "error": "문제를 찾을 수 없습니다"}

        # 정답 확인
        is_correct = (user_answer == question["answer"])

        # 난이도에 따른 점수 계산 (쉬움: 3점, 보통: 5점, 어려움: 7점)
        difficulty = question.get("difficulty", "easy")
        points_earned = 0

        if is_correct:
            points_earned = POINTS_PER_CORRECT.get(difficulty, 3)

        # 세션 업데이트
        current_score = session.get("score", 0) + points_earned
        current_index = session.get("currentQuestionIndex", 0)

        await sessions_collection.update_one(
            {"_id": ObjectId(quiz_session_id)},
            {
                "$push": {
                    "answers": {
                        "questionId": question_id,
                        "userAnswer": user_answer,
                        "isCorrect": is_correct,
                        "pointsEarned": points_earned,
                        "difficulty": difficulty
                    }
                },
                "$set": {
                    "score": current_score,
                    "currentQuestionIndex": current_index + 1
                }
            }
        )

        # 시도 기록 저장
        await attempts_collection.insert_one({
            "sessionId": quiz_session_id,
            "userId": user_id,
            "questionId": question_id,
            "userAnswer": user_answer,
            "isCorrect": is_correct,
            "attemptedAt": datetime.utcnow()
        })

        # 사용자 퀴즈 이력 저장 (맞춘 문제 추적용)
        await user_quiz_history.insert_one({
            "userId": user_id,
            "questionId": question_id,
            "isCorrect": is_correct,
            "attemptedAt": datetime.utcnow()
        })

        # 문제 통계 업데이트 (quiz_pool에서)
        await quiz_pool.update_one(
            {"_id": ObjectId(question_id)},
            {
                "$inc": {
                    "totalAttempts": 1,
                    "correctAttempts": 1 if is_correct else 0
                }
            }
        )

        # 업데이트된 문제 통계 가져오기
        updated_question = await quiz_pool.find_one({"_id": ObjectId(question_id)})
        total_attempts = updated_question.get("totalAttempts", 1)
        correct_attempts = updated_question.get("correctAttempts", 0)

        # 사용자 선택 비율 계산 (사용자가 선택한 답변의 비율)
        if user_answer:  # True를 선택한 경우
            user_choice_percentage = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0
        else:  # False를 선택한 경우
            user_choice_percentage = ((total_attempts - correct_attempts) / total_attempts * 100) if total_attempts > 0 else 0

        # 연속 정답 수 계산
        if is_correct:
            # 이전 답변들에서 연속 정답 수 계산
            previous_answers = session.get("answers", [])
            consecutive_count = 0
            for ans in reversed(previous_answers):
                if ans.get("isCorrect"):
                    consecutive_count += 1
                else:
                    break
            new_consecutive = consecutive_count + 1  # 현재 정답 포함
        else:
            new_consecutive = 0  # 틀리면 리셋

        # 다음 문제 가져오기 (nextQuestion 필드)
        question_ids = session["questionIds"]
        next_question = None
        is_quiz_complete = False

        # 모든 문제를 다 풀었는지 확인 (난이도별 문제 수 지원)
        if current_index + 1 >= len(question_ids):
            is_quiz_complete = True
            # 세션 완료 처리
            await sessions_collection.update_one(
                {"_id": ObjectId(quiz_session_id)},
                {"$set": {"status": "completed", "completedAt": datetime.utcnow()}}
            )
        else:
            next_q = await quiz_pool.find_one({"_id": ObjectId(question_ids[current_index + 1])})
            if next_q:
                next_question = {
                    "id": question_ids[current_index + 1],
                    "category": next_q["category"],
                    "difficulty": next_q["difficulty"],
                    "question": next_q["question"],
                    "answer": True,  # 더미값 (숨김)
                    "explanation": ""  # 숨김
                }

        # QuizAnswerResponse 형식으로 반환
        return {
            "success": True,
            "isCorrect": is_correct,
            "correctAnswer": question["answer"],
            "explanation": question["explanation"],
            "pointsEarned": points_earned,
            "currentScore": current_score,
            "consecutiveCorrect": new_consecutive,  # 현재 연속 정답 수
            "questionStats": {
                "totalAttempts": total_attempts,
                "correctAttempts": correct_attempts,
                "userChoicePercentage": round(user_choice_percentage, 2)
            },
            "nextQuestion": next_question,  # 다음 문제 (5문제 완료 시 null)
            "isQuizComplete": is_quiz_complete,  # 퀴즈 완료 여부
            "tokens_used": 0,
            "metadata": {
                "agent_type": self.agent_type,
                "session_id": session_id
            }
        }

    async def _complete_session(
        self,
        context: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        세션 완료 처리

        Returns:
            QuizSessionCompleteResponse 형식:
            - sessionId, userId, sessionType
            - totalQuestions, correctAnswers, finalScore, accuracyRate
            - completedAt (ISO string)
            - streak (daily_quiz만)
            - categoryPerformance (array of {category, correct, total, rate})
        """
        quiz_session_id = context.get("sessionId")

        sessions_collection = db["quiz_sessions"]
        stats_collection = db["user_quiz_stats"]

        # 세션 조회
        session = await sessions_collection.find_one({"_id": ObjectId(quiz_session_id)})
        if not session:
            return {"success": False, "error": "세션을 찾을 수 없습니다"}

        # 모든 문제 풀었는지 확인
        total_questions = len(session["questionIds"])
        answered_questions = len(session.get("answers", []))

        if answered_questions < total_questions:
            return {"success": False, "error": "모든 문제를 풀어야 세션을 완료할 수 있습니다"}

        # 정답 수 계산
        correct_answers = sum(1 for a in session["answers"] if a["isCorrect"])
        accuracy_rate = (correct_answers / total_questions) * 100

        # 완료 시간
        completed_at = datetime.utcnow()

        # 세션 완료 처리
        await sessions_collection.update_one(
            {"_id": ObjectId(quiz_session_id)},
            {
                "$set": {
                    "status": "completed",
                    "completedAt": completed_at
                }
            }
        )

        # 사용자 통계 업데이트
        user_id = session["userId"]
        session_type = session["sessionType"]

        existing_stats = await stats_collection.find_one({"userId": user_id})

        current_streak = 1
        best_streak = 1

        if existing_stats:
            # 기존 통계 업데이트
            updates = {
                "$inc": {
                    "totalSessions": 1,
                    "totalQuestions": total_questions,
                    "correctAnswers": correct_answers,
                    "totalScore": session["score"]
                },
                "$set": {
                    "lastSessionDate": completed_at
                }
            }

            # 스트릭 계산 (daily_quiz만)
            if session_type == "daily_quiz":
                last_date = existing_stats.get("lastSessionDate")
                if last_date:
                    days_diff = (completed_at - last_date).days
                    if days_diff == 1:
                        # 연속 달성
                        current_streak = existing_stats.get("currentStreak", 0) + 1
                        updates["$set"]["currentStreak"] = current_streak
                        # 최고 스트릭 업데이트
                        if current_streak > existing_stats.get("bestStreak", 0):
                            updates["$set"]["bestStreak"] = current_streak
                        best_streak = max(current_streak, existing_stats.get("bestStreak", 0))
                    elif days_diff > 1:
                        # 스트릭 끊김
                        updates["$set"]["currentStreak"] = 1
                        current_streak = 1
                        best_streak = existing_stats.get("bestStreak", 1)
                    else:
                        # 같은 날 (스트릭 유지)
                        current_streak = existing_stats.get("currentStreak", 1)
                        best_streak = existing_stats.get("bestStreak", 1)
                else:
                    updates["$set"]["currentStreak"] = 1
                    updates["$set"]["bestStreak"] = 1
            else:
                current_streak = existing_stats.get("currentStreak", 0)
                best_streak = existing_stats.get("bestStreak", 0)

            # 레벨 판정 (level_test만)
            if session_type == "level_test":
                level = "beginner"
                if accuracy_rate >= 80:
                    level = "advanced"
                elif accuracy_rate >= 50:
                    level = "intermediate"
                updates["$set"]["level"] = level

            await stats_collection.update_one({"userId": user_id}, updates)
        else:
            # 새 통계 생성
            new_stats = {
                "userId": user_id,
                "totalSessions": 1,
                "totalQuestions": total_questions,
                "correctAnswers": correct_answers,
                "totalScore": session["score"],
                "currentStreak": 1 if session_type == "daily_quiz" else 0,
                "bestStreak": 1 if session_type == "daily_quiz" else 0,
                "level": "intermediate",
                "lastSessionDate": completed_at
            }

            # 레벨 판정
            if session_type == "level_test":
                if accuracy_rate >= 80:
                    new_stats["level"] = "advanced"
                elif accuracy_rate >= 50:
                    new_stats["level"] = "intermediate"
                else:
                    new_stats["level"] = "beginner"

            await stats_collection.insert_one(new_stats)

        # 카테고리별 성과 계산
        category_performance = await self._calculate_category_performance(session)

        # QuizSessionCompleteResponse 형식으로 반환
        return {
            "success": True,
            "sessionId": quiz_session_id,
            "userId": user_id,
            "sessionType": session_type,
            "totalQuestions": total_questions,
            "correctAnswers": correct_answers,
            "finalScore": session["score"],
            "accuracyRate": round(accuracy_rate, 2),
            "completedAt": completed_at.isoformat(),
            "streak": current_streak if session_type == "daily_quiz" else None,
            "categoryPerformance": category_performance,
            "tokens_used": 50,
            "metadata": {
                "agent_type": self.agent_type,
                "session_id": session_id
            }
        }

    async def _calculate_category_performance(self, session: Dict) -> List[Dict]:
        """
        카테고리별 성과 계산

        Returns:
            List[Dict]: [{category, correct, total, rate}, ...]
        """
        quiz_pool = db["quiz_pool"]

        category_stats = {}
        for i, answer in enumerate(session["answers"]):
            q_id = session["questionIds"][i]
            question = await quiz_pool.find_one({"_id": ObjectId(q_id)})

            category = question["category"]
            if category not in category_stats:
                category_stats[category] = {"correct": 0, "total": 0}

            category_stats[category]["total"] += 1
            if answer["isCorrect"]:
                category_stats[category]["correct"] += 1

        return [
            {
                "category": cat,
                "correct": stats["correct"],
                "total": stats["total"],
                "rate": round((stats["correct"] / stats["total"]) * 100, 2)
            }
            for cat, stats in category_stats.items()
        ]

    async def _get_user_stats(
        self,
        context: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        사용자 통계 조회

        Returns:
            UserQuizStatsResponse 형식:
            - totalSessions (not totalQuizzes)
            - totalQuestions, correctAnswers, totalScore, accuracyRate
            - currentStreak, bestStreak
            - level (beginner/intermediate/advanced)
            - lastSessionDate (ISO string or null)
        """
        user_id = context.get("userId")

        stats_collection = db["user_quiz_stats"]
        stats = await stats_collection.find_one({"userId": user_id})

        if not stats:
            return {
                "success": True,
                "userId": user_id,
                "totalSessions": 0,
                "totalQuestions": 0,
                "correctAnswers": 0,
                "totalScore": 0,
                "accuracyRate": 0.0,
                "currentStreak": 0,
                "bestStreak": 0,
                "level": "beginner",
                "lastSessionDate": None,
                "tokens_used": 10,
                "metadata": {
                    "agent_type": self.agent_type,
                    "session_id": session_id
                }
            }

        accuracy_rate = (stats["correctAnswers"] / stats["totalQuestions"]) * 100 if stats["totalQuestions"] > 0 else 0

        return {
            "success": True,
            "userId": user_id,
            "totalSessions": stats.get("totalSessions", 0),  # totalSessions (not totalQuizzes)
            "totalQuestions": stats.get("totalQuestions", 0),
            "correctAnswers": stats.get("correctAnswers", 0),
            "totalScore": stats.get("totalScore", 0),
            "accuracyRate": round(accuracy_rate, 2),
            "currentStreak": stats.get("currentStreak", 0),
            "bestStreak": stats.get("bestStreak", 0),
            "level": stats.get("level", "beginner"),
            "lastSessionDate": stats.get("lastSessionDate").isoformat() if stats.get("lastSessionDate") else None,
            "tokens_used": 10,
            "metadata": {
                "agent_type": self.agent_type,
                "session_id": session_id
            }
        }

    async def _get_quiz_history(
        self,
        context: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        퀴즈 이력 조회

        Returns:
            QuizHistoryResponse 형식:
            - sessions (array of QuizHistorySession)
            - total, limit, offset, hasMore (flat structure)
        """
        user_id = context.get("userId")
        limit = min(context.get("limit", 10), 50)
        offset = context.get("offset", 0)

        sessions_collection = db["quiz_sessions"]

        # 완료된 세션만 조회
        cursor = sessions_collection.find(
            {"userId": user_id, "status": "completed"}
        ).sort("completedAt", -1).skip(offset).limit(limit)

        sessions = []
        async for s in cursor:
            total_q = len(s["questionIds"])
            correct_a = sum(1 for a in s["answers"] if a["isCorrect"])
            accuracy = (correct_a / total_q) * 100 if total_q > 0 else 0

            sessions.append({
                "sessionId": str(s["_id"]),
                "sessionType": s["sessionType"],
                "totalQuestions": total_q,
                "correctAnswers": correct_a,
                "finalScore": s["score"],
                "accuracyRate": round(accuracy, 2),
                "completedAt": s["completedAt"].isoformat() if s.get("completedAt") else None,
                "categoryPerformance": await self._calculate_category_performance(s)
            })

        total_count = await sessions_collection.count_documents(
            {"userId": user_id, "status": "completed"}
        )

        # QuizHistoryResponse 형식 (flat structure)
        return {
            "success": True,
            "sessions": sessions,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "hasMore": (offset + limit) < total_count,
            "tokens_used": 20,
            "metadata": {
                "agent_type": self.agent_type,
                "session_id": session_id
            }
        }

    def estimate_context_usage(self, user_input: str) -> int:
        """
        컨텍스트 사용량 추정

        Args:
            user_input: 사용자 입력

        Returns:
            int: 예상 토큰 수
        """
        # 기본 추정치
        estimated_tokens = int(len(user_input) * 1.5)

        # 시스템 프롬프트 + RAG 컨텍스트
        estimated_tokens += 1000

        # 퀴즈 생성 응답 (5문제 기준)
        estimated_tokens += 2000

        return estimated_tokens
