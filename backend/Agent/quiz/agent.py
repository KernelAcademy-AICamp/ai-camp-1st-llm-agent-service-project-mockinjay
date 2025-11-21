"""
Quiz Agent Implementation
퀴즈 생성 및 관리 에이전트
"""

import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from bson import ObjectId

from ..base_agent import BaseAgent
from ..api.openai_client import OpenAIClient
from ..api.vector_client import VectorClient
from ..api.mongodb_client import MongoDBClient
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


class QuizAgent(BaseAgent):
    """퀴즈 생성 및 관리 Agent"""

    def __init__(self):
        super().__init__(agent_type="quiz")
        self.openai_client = OpenAIClient(model="gpt-4o-mini")
        self.vector_client = VectorClient()
        self.mongodb_client = MongoDBClient()

    async def process(
        self,
        user_input: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        퀴즈 관련 요청 처리

        Args:
            user_input: 사용자 입력 (action 포함)
            session_id: 세션 ID
            context: 추가 컨텍스트 (action, params 등)

        Returns:
            Dict[str, Any]: 처리 결과
        """
        if not context:
            return {
                "success": False,
                "error": "퀴즈 에이전트에 컨텍스트가 필요합니다"
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
        퀴즈 세션 생성 (RAG 기반 문제 생성)

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

        # 세션 타입별 문제 구성 결정
        question_configs = self._determine_question_config(
            session_type, category, difficulty
        )

        all_questions = []
        total_tokens = 0

        # 각 구성에 따라 문제 생성
        for config in question_configs:
            questions = await self._generate_questions_with_rag(
                category=config["category"],
                difficulty=config["difficulty"],
                num_questions=config["count"]
            )
            all_questions.extend(questions)
            total_tokens += config["count"] * 800  # 예상 토큰

        # MongoDB에 세션 저장
        sessions_collection = db["quiz_sessions"]
        quiz_questions_collection = db["quiz_questions"]

        # 문제 저장 (카테고리/난이도 포함)
        question_ids = []
        questions_metadata = []  # 세션에 저장할 메타데이터

        for q in all_questions:
            q_doc = {
                "category": q["category"],
                "difficulty": q["difficulty"],
                "question": q["question"],
                "answer": q["answer"],
                "explanation": q["explanation"],
                "totalAttempts": 0,
                "correctAttempts": 0,
                "createdAt": datetime.utcnow()
            }
            result = quiz_questions_collection.insert_one(q_doc)
            q_id = str(result.inserted_id)
            question_ids.append(q_id)

            # 세션에서 빠르게 접근할 수 있도록 메타데이터 저장
            questions_metadata.append({
                "questionId": q_id,
                "category": q["category"],
                "difficulty": q["difficulty"]
            })

        # 세션 저장 (consecutiveCorrect 필드 추가)
        session_doc = {
            "userId": user_id,
            "sessionType": session_type,
            "questionIds": question_ids,
            "questionsMetadata": questions_metadata,  # 메타데이터 저장
            "currentQuestionIndex": 0,
            "answers": [],
            "score": 0,
            "consecutiveCorrect": 0,  # 연속 정답 카운터 추가
            "status": "in_progress",
            "startedAt": datetime.utcnow(),
            "completedAt": None
        }
        session_result = sessions_collection.insert_one(session_doc)
        session_obj_id = str(session_result.inserted_id)

        # 첫 번째 문제 가져오기
        first_question = quiz_questions_collection.find_one(
            {"_id": ObjectId(question_ids[0])}
        )

        # 클라이언트에게 답안/해설 숨기고 실제 카테고리/난이도 반환
        response_question = {
            "id": question_ids[0],
            "category": first_question["category"],  # 실제 카테고리
            "difficulty": first_question["difficulty"],  # 실제 난이도
            "question": first_question["question"],
            "answer": True,  # 더미값
            "explanation": ""  # 숨김
        }

        return {
            "success": True,
            "sessionId": session_obj_id,
            "userId": user_id,
            "sessionType": session_type,
            "totalQuestions": len(question_ids),
            "currentQuestionNumber": 1,
            "score": 0,
            "status": "in_progress",
            "currentQuestion": response_question,
            "tokens_used": total_tokens,
            "metadata": {
                "agent_type": self.agent_type,
                "session_id": session_id,
            }
        }

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

        # 3. JSON 파싱
        try:
            questions = json.loads(result["text"])
            if not isinstance(questions, list):
                raise ValueError("퀴즈 문제 목록 형식이 올바르지 않습니다")

            # 카테고리/난이도 메타데이터 추가 (모든 문제에)
            for q in questions:
                q["category"] = category
                q["difficulty"] = difficulty

            return questions

        except json.JSONDecodeError as e:
            logger.error(f"퀴즈 JSON 파싱 실패: {e}")
            logger.error(f"응답: {result['text']}")
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
        questions_collection = db["quiz_questions"]
        attempts_collection = db["quiz_attempts"]

        # 세션 조회
        session = sessions_collection.find_one({"_id": ObjectId(quiz_session_id)})
        if not session:
            return {"success": False, "error": "세션을 찾을 수 없습니다"}

        if session["status"] != "in_progress":
            return {"success": False, "error": "이미 완료된 세션입니다"}

        # 문제 조회
        question = questions_collection.find_one({"_id": ObjectId(question_id)})
        if not question:
            return {"success": False, "error": "문제를 찾을 수 없습니다"}

        # 정답 확인
        is_correct = (user_answer == question["answer"])

        # 연속 정답 카운터 가져오기
        current_consecutive = session.get("consecutiveCorrect", 0)

        # 점수 계산 (연속 정답 보너스 로직)
        points_earned = 0
        new_consecutive = 0

        if is_correct:
            points_earned = 10
            new_consecutive = current_consecutive + 1

            # 연속 정답 보너스 (3개 이상 연속 정답 시 +5점)
            if new_consecutive >= 3:
                points_earned += 5
        else:
            # 틀리면 연속 카운터 리셋
            new_consecutive = 0

        # 세션 업데이트
        current_score = session.get("score", 0) + points_earned
        current_index = session.get("currentQuestionIndex", 0)

        sessions_collection.update_one(
            {"_id": ObjectId(quiz_session_id)},
            {
                "$push": {
                    "answers": {
                        "questionId": question_id,
                        "userAnswer": user_answer,
                        "isCorrect": is_correct,
                        "pointsEarned": points_earned
                    }
                },
                "$set": {
                    "score": current_score,
                    "currentQuestionIndex": current_index + 1,
                    "consecutiveCorrect": new_consecutive  # 연속 정답 카운터 업데이트
                }
            }
        )

        # 시도 기록 저장
        attempts_collection.insert_one({
            "sessionId": quiz_session_id,
            "userId": user_id,
            "questionId": question_id,
            "userAnswer": user_answer,
            "isCorrect": is_correct,
            "attemptedAt": datetime.utcnow()
        })

        # 문제 통계 업데이트
        questions_collection.update_one(
            {"_id": ObjectId(question_id)},
            {
                "$inc": {
                    "totalAttempts": 1,
                    "correctAttempts": 1 if is_correct else 0
                }
            }
        )

        # 업데이트된 문제 통계 가져오기
        updated_question = questions_collection.find_one({"_id": ObjectId(question_id)})
        total_attempts = updated_question["totalAttempts"]
        correct_attempts = updated_question["correctAttempts"]

        # 사용자 선택 비율 계산 (사용자가 선택한 답변의 비율)
        if user_answer:  # True를 선택한 경우
            user_choice_percentage = (correct_attempts / total_attempts * 100)
        else:  # False를 선택한 경우
            user_choice_percentage = ((total_attempts - correct_attempts) / total_attempts * 100)

        # 다음 문제 가져오기 (nextQuestion 필드)
        question_ids = session["questionIds"]
        next_question = None

        if current_index + 1 < len(question_ids):
            next_q = questions_collection.find_one({"_id": ObjectId(question_ids[current_index + 1])})
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
            "nextQuestion": next_question,  # 다음 문제 (없으면 null)
            "tokens_used": 100,
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
        session = sessions_collection.find_one({"_id": ObjectId(quiz_session_id)})
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
        sessions_collection.update_one(
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

        existing_stats = stats_collection.find_one({"userId": user_id})

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

            stats_collection.update_one({"userId": user_id}, updates)
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

            stats_collection.insert_one(new_stats)

        # 카테고리별 성과 계산
        category_performance = self._calculate_category_performance(session)

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

    def _calculate_category_performance(self, session: Dict) -> List[Dict]:
        """
        카테고리별 성과 계산

        Returns:
            List[Dict]: [{category, correct, total, rate}, ...]
        """
        questions_collection = db["quiz_questions"]

        category_stats = {}
        for i, answer in enumerate(session["answers"]):
            q_id = session["questionIds"][i]
            question = questions_collection.find_one({"_id": ObjectId(q_id)})

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
        stats = stats_collection.find_one({"userId": user_id})

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
        for s in cursor:
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
                "categoryPerformance": self._calculate_category_performance(s)
            })

        total_count = sessions_collection.count_documents(
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
