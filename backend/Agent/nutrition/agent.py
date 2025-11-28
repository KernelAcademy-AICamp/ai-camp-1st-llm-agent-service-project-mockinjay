"""
Nutrition Agent Implementation
영양 관리 기능 구현 - CKD 환자를 위한 식단 분석 (5가지 이미지 케이스 완벽 지원)
"""

import os
import logging
import json
from typing import Dict, Any, Optional, List
from openai import AsyncOpenAI
from ..base_agent import BaseAgent
from ..core.types import AgentType
from ..core.agent_registry import AgentRegistry
from .prompts import (
    NUTRITION_SYSTEM_PROMPT,
    IMAGE_CLASSIFICATION_PROMPT,
    INGREDIENT_TO_DISH_PROMPT,
    MULTIPLE_INGREDIENTS_ANALYSIS_PROMPT,
    MULTIPLE_INGREDIENTS_TO_DISH_PROMPT,
    ALTERNATIVE_INGREDIENT_PROMPT,
    get_profile_instructions
)

# Lazy import RAG (only if needed)
try:
    from rag.nutrition_rag import NutritionRAG
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False

# MongoDB nutrition lookup
try:
    from tools.mongodb_nutrition_lookup import get_nutrition_lookup
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False

# Recipe generator
try:
    from tools.recipe_generator import get_recipe_generator
    RECIPE_GENERATOR_AVAILABLE = True
except ImportError:
    RECIPE_GENERATOR_AVAILABLE = False

# Recipe handler
try:
    from Agent.nutrition.recipe_handler import RecipeHandler
    RECIPE_HANDLER_AVAILABLE = True
except ImportError:
    RECIPE_HANDLER_AVAILABLE = False

logger = logging.getLogger(__name__)


@AgentRegistry.register("nutrition")
class NutritionAgent(BaseAgent):
    """영양 관리 Agent - CKD 환자 맞춤형 식단 분석 (5가지 이미지 케이스 완벽 지원)"""

    def __init__(self):
        super().__init__(agent_type="nutrition")
        self.client = None
        self._client_initialized = False

        # RAG 시스템 (lazy initialization)
        self.rag = None
        self._rag_initialized = False

        # Recipe handler
        self.recipe_handler = None

        # 멀티턴 대화 상태 저장 (session_id -> state)
        self.conversation_states = {}

    @property
    def metadata(self) -> Dict[str, Any]:
        """에이전트 메타데이터"""
        return {
            "name": "nutrition",
            "description": "CKD 환자 맞춤형 영양 관리 및 식단 분석 에이전트",
            "version": "2.0.0",
            "capabilities": [
                "image_analysis",
                "nutrition_lookup",
                "recipe_recommendation",
                "alternative_ingredient",
                "multi_turn_conversation"
            ],
            "supported_profiles": ["general", "patient", "researcher"]
        }

    @property
    def execution_type(self) -> AgentType:
        """에이전트 실행 타입"""
        return AgentType.LOCAL

    async def _ensure_client(self):
        """OpenAI 클라이언트 lazy initialization"""
        if not self._client_initialized:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.warning("⚠️ OPENAI_API_KEY not found in environment")
                raise ValueError("OPENAI_API_KEY not configured")
            else:
                self.client = AsyncOpenAI(api_key=api_key)
                self._client_initialized = True
                logger.info("✅ OpenAI client initialized")

    def _ensure_rag(self):
        """RAG 시스템 lazy initialization"""
        if not self._rag_initialized and RAG_AVAILABLE:
            try:
                self.rag = NutritionRAG()
                self._rag_initialized = True
                logger.info("✅ NutritionRAG initialized")
            except Exception as e:
                logger.error(f"RAG initialization failed: {e}")
                self.rag = None
                self._rag_initialized = False

    def _get_conversation_state(self, session_id: str) -> Dict[str, Any]:
        """세션 대화 상태 가져오기"""
        if session_id not in self.conversation_states:
            self.conversation_states[session_id] = {
                "state": "initial",  # initial, awaiting_dish_selection, awaiting_ingredient_dish_selection
                "pending_candidates": None,
                "pending_dish_candidates": None,
                "last_image_data": None,
                "last_analysis_type": None
            }
        return self.conversation_states[session_id]

    def _update_conversation_state(self, session_id: str, updates: Dict[str, Any]):
        """세션 대화 상태 업데이트"""
        state = self._get_conversation_state(session_id)
        state.update(updates)
        self.conversation_states[session_id] = state

    async def process(
        self,
        request: "AgentRequest"
    ) -> "AgentResponse":
        """
        영양 분석 처리 - 5가지 이미지 케이스 완벽 지원

        Args:
            request: AgentRequest containing query, session_id, context

        Returns:
            AgentResponse: 통일된 응답 형식
        """
        from ..core.contracts import AgentRequest, AgentResponse

        # Extract fields from AgentRequest
        user_input = request.query
        session_id = request.session_id
        context = request.context
        # Ensure clients initialized
        try:
            await self._ensure_client()
            self._ensure_rag()
        except ValueError as e:
            return self._error_response(str(e), session_id)

        tokens_used = self.estimate_context_usage(user_input)
        self.context_usage += tokens_used

        try:
            # 대화 상태 및 사용자 프로필 확인
            conv_state = self._get_conversation_state(session_id)
            has_image = context and context.get("has_image", False)
            image_data = context.get("image_data") if context else None
            user_profile = context.get("user_profile", "general") if context else "general"  # Extract user profile

            # 상태별 처리
            if conv_state["state"] == "awaiting_dish_selection":
                # 요리 선택 처리 (케이스 1: 단일 요리)
                result = await self._handle_dish_selection(
                    user_input, session_id, conv_state, user_profile
                )

            elif conv_state["state"] == "awaiting_ingredient_dish_selection":
                # 식재료 기반 요리 선택 처리 (케이스 2: 단일 식재료)
                result = await self._handle_ingredient_dish_selection(
                    user_input, session_id, conv_state, user_profile
                )

            elif has_image and image_data:
                # 새 이미지 업로드 → 5가지 케이스 분류 및 처리
                result = await self._handle_image_upload(
                    image_data, user_input, session_id, user_profile
                )

            else:
                # 텍스트만 있는 경우 → 레시피 요청 확인 후 처리
                result = await self._handle_text_input(
                    user_input, session_id, conv_state, user_profile
                )

            return AgentResponse(
                answer=result["response"],
                sources=[],
                papers=[],
                tokens_used=tokens_used,
                status="success",
                agent_type=self.agent_type,
                metadata={
                    "session_id": session_id,
                    "has_image": has_image,
                    "conversation_state": conv_state["state"],
                    "type": "nutrition_analysis",
                    "nutrition_data": result.get("nutritionData"),
                    "dish_candidates": result.get("dishCandidates"),
                    "ingredient_candidates": result.get("ingredientCandidates"),
                    "recommended_dishes": result.get("recommendedDishes"),
                    "analysis_type": result.get("analysisType")
                }
            )

        except Exception as e:
            logger.error(f"Nutrition analysis error: {e}", exc_info=True)
            return self._error_response_as_agent_response(str(e), session_id)

    async def _handle_image_upload(
        self,
        image_data: str,
        user_input: str,
        session_id: str,
        user_profile: str = "general"
    ) -> Dict[str, Any]:
        """
        이미지 업로드 처리 - 5가지 케이스 분류

        케이스 1: dish - 단일 요리 → Top-5 요리 후보
        케이스 2: ingredient_single - 단일 식재료 → 식재료명 + 추천 요리 Top-5
        케이스 3: ingredient_multiple - 복수 식재료 → 식재료 리스트 + 영양소 표 + 추천 요리 Top-5
        케이스 4: unclear - 판별 불가 → 에러 메시지
        케이스 5: irrelevant - 무관 이미지 → 에러 메시지
        """
        logger.info(f"🖼️ Image upload - classifying into 5 cases")

        # Step 1: 이미지 분류 (5가지 케이스)
        classification = await self._classify_image(image_data)
        analysis_type = classification.get("analysisType")
        logger.info(f"✅ Image classified as: {analysis_type}")

        # Step 2: 케이스별 처리
        if analysis_type == "dish":
            return await self._handle_case_dish(image_data, classification, session_id)

        elif analysis_type == "ingredient_single":
            return await self._handle_case_ingredient_single(classification, session_id)

        elif analysis_type == "ingredient_multiple":
            return await self._handle_case_ingredient_multiple(classification, session_id)

        elif analysis_type == "unclear":
            return {
                "response": "요리나 식재료로 판별하기 어려운 이미지입니다. 1개의 요리나 식재료 이미지를 업로드해주세요.",
                "nutritionData": None,
                "analysisType": "unclear"
            }

        elif analysis_type == "irrelevant":
            return {
                "response": "식이 영양 관리와 관련된 음식이나 식재료 사진을 업로드해 주세요.",
                "nutritionData": None,
                "analysisType": "irrelevant"
            }

        else:
            # 분류 실패 시 unclear로 처리
            return {
                "response": "이미지 분석에 실패했습니다. 다시 시도해주세요.",
                "nutritionData": None,
                "analysisType": "error"
            }

    async def _classify_image(self, image_data: str) -> Dict[str, Any]:
        """
        이미지를 5가지 케이스로 분류

        Returns:
            {
                "analysisType": "dish" | "ingredient_single" | "ingredient_multiple" | "unclear" | "irrelevant",
                "primaryItem": "주요 항목명",
                "confidence": 0.0~1.0,
                "items": ["항목1", "항목2", ...],  # ingredient_multiple일 때만
                "message": "에러 메시지"  # unclear 또는 irrelevant일 때만
            }
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": IMAGE_CLASSIFICATION_PROMPT
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0.3
            )

            content = response.choices[0].message.content
            logger.info(f"🔍 Classification response: {content[:200]}")

            # JSON 파싱
            classification = self._extract_json(content)
            return classification

        except Exception as e:
            logger.error(f"Image classification failed: {e}", exc_info=True)
            return {
                "analysisType": "unclear",
                "message": "이미지 분석 중 오류가 발생했습니다."
            }

    async def _handle_case_dish(
        self,
        image_data: str,
        classification: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        케이스 1: 단일 요리 이미지 처리

        Returns:
            {
                "response": "확인 메시지",
                "dishCandidates": [Top-5 요리 후보],
                "analysisType": "dish"
            }
        """
        # RAG로 유사 음식 검색
        if self.rag:
            search_results = self.rag.search_by_image(image_data, top_k=5)
            if search_results and len(search_results) > 0:
                top_dish = search_results[0]
                dish_name = top_dish["dish_name"]
                confidence = top_dish.get("score", 0)

                logger.info(f"✅ RAG Top-5: {[r['dish_name'] for r in search_results]}")

                # 후보 목록 생성
                candidates = [
                    {
                        "dish_name": r["dish_name"],
                        "confidence": round(r.get("score", 0) * 100, 1),
                        "dish_data": r
                    }
                    for r in search_results
                ]

                # 대화 상태 업데이트
                self._update_conversation_state(session_id, {
                    "state": "awaiting_dish_selection",
                    "pending_candidates": candidates,
                    "last_image_data": image_data,
                    "last_analysis_type": "dish"
                })

                return {
                    "response": (
                        f"업로드하신 것은 **{dish_name}**(으)로 보입니다 (유사도: {round(confidence * 100, 1)}%).\n\n"
                        f"맞다면 '네'라고 해주세요."
                    ),
                    "nutritionData": None,
                    "dishCandidates": candidates,
                    "analysisType": "dish"
                }

        # RAG 실패 시 OpenAI Vision으로 대체 (fallback)
        primary_item = classification.get("primaryItem", "분석된 요리")
        return {
            "response": f"업로드하신 것은 **{primary_item}**(으)로 보입니다. 맞다면 '네'라고 해주세요.",
            "nutritionData": None,
            "dishCandidates": [
                {
                    "dish_name": primary_item,
                    "confidence": round(classification.get("confidence", 0.8) * 100, 1),
                    "dish_data": {}
                }
            ],
            "analysisType": "dish"
        }

    async def _handle_case_ingredient_single(
        self,
        classification: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        케이스 2: 단일 식재료 이미지 처리

        Returns:
            {
                "response": "식재료 확인 메시지 + 추천 요리 안내",
                "recommendedDishes": [추천 요리 4~5개],
                "analysisType": "ingredient_single"
            }
        """
        ingredient_name = classification.get("primaryItem", "식재료")
        logger.info(f"🥬 Single ingredient detected: {ingredient_name}")

        # 식재료로 만들 수 있는 CKD 친화적 요리 추천
        recommended_dishes = await self._recommend_dishes_for_ingredient(ingredient_name)

        # 대화 상태 업데이트
        self._update_conversation_state(session_id, {
            "state": "awaiting_ingredient_dish_selection",
            "pending_dish_candidates": recommended_dishes,
            "last_analysis_type": "ingredient_single"
        })

        return {
            "response": (
                f"첨부하신 이미지는 **{ingredient_name}**(으)로 보입니다.\n\n"
                f"{ingredient_name}를 사용해 신장병 식이 관리를 위한 추천 요리를 알려드릴게요!"
            ),
            "nutritionData": None,
            "recommendedDishes": recommended_dishes,
            "analysisType": "ingredient_single"
        }

    async def _handle_case_ingredient_multiple(
        self,
        classification: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        케이스 3: 복수 식재료 이미지 처리

        Returns:
            {
                "response": "인식된 식재료 리스트",
                "ingredientCandidates": [식재료별 영양소 정보],
                "recommendedDishes": [추천 요리 Top 5],
                "analysisType": "ingredient_multiple"
            }
        """
        ingredients = classification.get("items", [])[:5]  # 최대 5개
        logger.info(f"🥕 Multiple ingredients detected: {ingredients}")

        # 식재료별 영양소 분석
        ingredients_analysis = await self._analyze_multiple_ingredients(ingredients)

        # 복수 식재료로 만들 수 있는 CKD 친화적 요리 추천
        recommended_dishes = await self._recommend_dishes_for_multiple_ingredients(ingredients)

        # 대화 상태 업데이트
        self._update_conversation_state(session_id, {
            "state": "awaiting_ingredient_dish_selection",
            "pending_dish_candidates": recommended_dishes,
            "last_analysis_type": "ingredient_multiple"
        })

        ingredients_str = ", ".join(ingredients)
        return {
            "response": f"인식된 식재료: **{ingredients_str}**\n\n각 식재료의 영양소 정보와 추천 요리를 확인하세요!",
            "nutritionData": None,
            "ingredientCandidates": ingredients_analysis,
            "recommendedDishes": recommended_dishes,
            "analysisType": "ingredient_multiple"
        }

    async def _recommend_dishes_for_ingredient(self, ingredient_name: str) -> List[Dict[str, Any]]:
        """단일 식재료로 만들 수 있는 CKD 친화적 요리 추천"""
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": INGREDIENT_TO_DISH_PROMPT.format(ingredient_name=ingredient_name)
                    }
                ],
                max_tokens=1500,
                temperature=0.7
            )

            content = response.choices[0].message.content
            data = self._extract_json(content)
            return data.get("recommendedDishes", [])[:5]

        except Exception as e:
            logger.error(f"Recommend dishes failed: {e}", exc_info=True)
            return []

    async def _analyze_multiple_ingredients(self, ingredients: List[str]) -> List[Dict[str, Any]]:
        """복수 식재료의 영양소 분석"""
        try:
            ingredients_str = ", ".join(ingredients)
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": MULTIPLE_INGREDIENTS_ANALYSIS_PROMPT.format(ingredients_list=ingredients_str)
                    }
                ],
                max_tokens=1000,
                temperature=0.5
            )

            content = response.choices[0].message.content
            data = self._extract_json(content)
            return data.get("ingredients", [])

        except Exception as e:
            logger.error(f"Analyze multiple ingredients failed: {e}", exc_info=True)
            return []

    async def _recommend_dishes_for_multiple_ingredients(self, ingredients: List[str]) -> List[Dict[str, Any]]:
        """복수 식재료로 만들 수 있는 CKD 친화적 요리 추천"""
        try:
            ingredients_str = ", ".join(ingredients)
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": MULTIPLE_INGREDIENTS_TO_DISH_PROMPT.format(ingredients_list=ingredients_str)
                    }
                ],
                max_tokens=1500,
                temperature=0.7
            )

            content = response.choices[0].message.content
            data = self._extract_json(content)
            return data.get("recommendedDishes", [])[:5]

        except Exception as e:
            logger.error(f"Recommend dishes for multiple ingredients failed: {e}", exc_info=True)
            return []

    async def _handle_dish_selection(
        self,
        user_input: str,
        session_id: str,
        conv_state: Dict[str, Any],
        user_profile: str = "general"
    ) -> Dict[str, Any]:
        """
        요리 선택 처리 (케이스 1: 단일 요리)

        Returns:
            - "네" 또는 요리명 → 영양 분석 결과
        """
        user_input_clean = user_input.strip()
        user_input_lower = user_input_clean.lower()

        candidates = conv_state.get("pending_candidates", [])

        # 1. 긍정 응답 - 첫 번째 후보 선택
        if any(keyword in user_input_lower for keyword in ["네", "맞", "yes", "응", "그래", "맞아"]):
            if candidates:
                logger.info("✅ User confirmed top dish")
                selected = candidates[0]
                dish_name = selected["dish_name"]
                dish_data = selected["dish_data"]

                # 영양 분석 수행
                result = await self._analyze_dish_with_rag_data(dish_name, dish_data)

                # 상태 초기화
                self._update_conversation_state(session_id, {
                    "state": "initial",
                    "pending_candidates": None
                })

                return result

        # 2. 후보 중 선택 - 요리명 직접 입력
        for candidate in candidates:
            if candidate["dish_name"] in user_input_clean or user_input_clean in candidate["dish_name"]:
                logger.info(f"✅ User selected: {candidate['dish_name']}")
                dish_name = candidate["dish_name"]
                dish_data = candidate["dish_data"]

                # 영양 분석 수행
                result = await self._analyze_dish_with_rag_data(dish_name, dish_data)

                # 상태 초기화
                self._update_conversation_state(session_id, {
                    "state": "initial",
                    "pending_candidates": None
                })

                return result

        # 3. 부정 또는 다른 입력 - RAG 텍스트 검색
        logger.info(f"📝 User provided different dish name: {user_input_clean}")
        if self.rag:
            search_results = self.rag.search_by_text(user_input_clean, top_k=1)
            if search_results:
                dish_data = search_results[0]
                dish_name = dish_data["dish_name"]

                logger.info(f"✅ RAG text search match: {dish_name}")

                # 영양 분석
                result = await self._analyze_dish_with_rag_data(dish_name, dish_data)

                # 상태 초기화
                self._update_conversation_state(session_id, {
                    "state": "initial",
                    "pending_candidates": None
                })

                return result

        # 4. RAG 검색 실패 - OpenAI로 분석
        logger.info("Using OpenAI for unknown dish")
        result = await self._analyze_text_query(user_input_clean, user_profile)

        # 상태 초기화
        self._update_conversation_state(session_id, {
            "state": "initial",
            "pending_candidates": None
        })

        return result

    async def _handle_ingredient_dish_selection(
        self,
        user_input: str,
        session_id: str,
        conv_state: Dict[str, Any],
        user_profile: str = "general"
    ) -> Dict[str, Any]:
        """
        식재료 기반 요리 선택 처리 (케이스 2, 3)

        Returns:
            - 요리 선택 → 영양 분석 결과
        """
        user_input_clean = user_input.strip()
        dish_candidates = conv_state.get("pending_dish_candidates", [])

        # 후보 중 선택
        for candidate in dish_candidates:
            dish_name = candidate.get("dishName", "")
            if dish_name in user_input_clean or user_input_clean in dish_name:
                logger.info(f"✅ User selected dish: {dish_name}")

                # 영양 분석 수행 (추정 영양소 사용)
                result = await self._analyze_dish_from_recommendation(candidate)

                # 상태 초기화
                self._update_conversation_state(session_id, {
                    "state": "initial",
                    "pending_dish_candidates": None
                })

                return result

        # 선택 실패 - 직접 텍스트 분석
        logger.info(f"📝 User provided different input: {user_input_clean}")
        result = await self._analyze_text_query(user_input_clean, user_profile)

        # 상태 초기화
        self._update_conversation_state(session_id, {
            "state": "initial",
            "pending_dish_candidates": None
        })

        return result

    async def _handle_text_query(
        self,
        user_input: str,
        session_id: str,
        conv_state: Dict[str, Any],
        user_profile: str = "general"
    ) -> Dict[str, Any]:
        """
        텍스트 쿼리 처리

        Returns:
            영양 분석 결과 또는 RAG 검색 결과
        """
        # RAG로 검색
        if self.rag:
            search_results = self.rag.search_by_text(user_input, top_k=1)
            if search_results:
                dish_data = search_results[0]
                dish_name = dish_data["dish_name"]

                # 영양 분석
                result = await self._analyze_dish_with_rag_data(dish_name, dish_data)
                return result

        # RAG 검색 실패 → OpenAI로 분석
        logger.info("Using OpenAI for text query")
        result = await self._analyze_text_query(user_input, user_profile)
        return result

    async def _analyze_dish_with_rag_data(
        self,
        dish_name: str,
        dish_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        RAG 데이터로 영양 분석 생성 + MongoDB 영양소 조회 + 대체 재료/레시피 추천

        Args:
            dish_name: 요리명
            dish_data: RAG 검색 결과 {ingredients, recipe, nutrition}

        Returns:
            영양 분석 결과
        """
        # Step 1: MongoDB에서 영양소 정보 조회 (우선)
        mongodb_nutrition = None
        if MONGODB_AVAILABLE:
            try:
                mongo_lookup = get_nutrition_lookup()
                mongodb_nutrition = mongo_lookup.lookup_food_nutrients(dish_name)
                if mongodb_nutrition:
                    logger.info(f"✅ Found nutrition data in MongoDB for: {dish_name}")
            except Exception as e:
                logger.warning(f"MongoDB lookup failed: {e}")

        # MongoDB 데이터가 있으면 우선 사용, 없으면 RAG 데이터 사용
        if mongodb_nutrition:
            nutrition = mongodb_nutrition["nutrients"]
            logger.info(f"📊 Using MongoDB nutrition data: {nutrition}")
        else:
            nutrition = dish_data.get("nutrition", {})
            logger.info(f"📊 Using RAG nutrition data: {nutrition}")

        ingredients = dish_data.get("ingredients", [])
        recipe = dish_data.get("recipe", "")

        # Step 2: 1일 1식 제한량 초과 여부 확인
        limit_check = None
        if MONGODB_AVAILABLE and nutrition:
            try:
                mongo_lookup = get_nutrition_lookup()
                limit_check = mongo_lookup.check_daily_limits(nutrition, meal_fraction=1/3)
                logger.info(f"🔍 Limit check: {limit_check['is_safe']}, exceeded: {limit_check['exceeded_nutrients']}")
            except Exception as e:
                logger.warning(f"Limit check failed: {e}")

        # Step 3: 제한량 초과 시 대체 식재료 및 레시피 추천
        alternatives = []
        alternative_recipes = []

        if limit_check and not limit_check["is_safe"]:
            # 초과된 영양소가 있는 경우
            exceeded = limit_check["exceeded_nutrients"]
            logger.info(f"⚠️ Exceeded nutrients: {exceeded}")

            # MongoDB에서 대체 식재료 검색
            if MONGODB_AVAILABLE:
                try:
                    mongo_lookup = get_nutrition_lookup()
                    alt_ingredients = mongo_lookup.search_alternative_ingredients(
                        exceeded_nutrients=exceeded,
                        exclude_foods=[dish_name]
                    )

                    if alt_ingredients:
                        logger.info(f"✅ Found {len(alt_ingredients)} alternative ingredients from MongoDB")

                        # Pinecone RAG에서 대체 식재료를 사용한 레시피 검색
                        if self.rag:
                            for alt_ing in alt_ingredients[:3]:  # 상위 3개만
                                alt_name = alt_ing["food_name"]
                                # RAG에서 해당 식재료를 사용하는 레시피 검색
                                alt_recipes = self.rag.search_by_text(alt_name, top_k=2)

                                for recipe_result in alt_recipes:
                                    alternative_recipes.append({
                                        "dish_name": recipe_result["dish_name"],
                                        "reason": f"{', '.join(exceeded)} 함량이 낮은 {alt_name} 사용",
                                        "nutrients": recipe_result.get("nutrition", {}),
                                        "ingredients": recipe_result.get("ingredients", [])
                                    })

                        # 대체 식재료 목록
                        alternatives = [
                            {
                                "original": dish_name,
                                "replacement": alt_ing["food_name"],
                                "reason": f"{', '.join(exceeded)} 함량이 낮음",
                                "nutrients": alt_ing["nutrients"]
                            }
                            for alt_ing in alt_ingredients[:5]  # 상위 5개
                        ]

                except Exception as e:
                    logger.error(f"Alternative search failed: {e}")

        # Fallback: 기존 방식으로도 대체 재료 추천
        if not alternatives:
            high_risk_ingredients = self._find_high_risk_ingredients(nutrition, ingredients)
            alternatives = await self._recommend_alternative_ingredients(dish_name, high_risk_ingredients)

        # Nutrition data 생성
        nutrition_data = {
            "dishName": dish_name,
            "nutrients": [
                {
                    "name": "나트륨",
                    "value": nutrition.get("sodium", 1500),
                    "max": 2000,
                    "unit": "mg",
                    "status": self._get_nutrient_status(nutrition.get("sodium", 1500), 2000)
                },
                {
                    "name": "칼륨",
                    "value": nutrition.get("potassium", 1200),
                    "max": 2000,
                    "unit": "mg",
                    "status": self._get_nutrient_status(nutrition.get("potassium", 1200), 2000)
                },
                {
                    "name": "인",
                    "value": nutrition.get("phosphorus", 450),
                    "max": 800,
                    "unit": "mg",
                    "status": self._get_nutrient_status(nutrition.get("phosphorus", 450), 800)
                },
                {
                    "name": "단백질",
                    "value": nutrition.get("protein", 28),
                    "max": 50,
                    "unit": "g",
                    "status": self._get_nutrient_status(nutrition.get("protein", 28), 50)
                },
                {
                    "name": "칼슘",
                    "value": nutrition.get("calcium", 70),
                    "max": 1000,
                    "unit": "mg",
                    "status": self._get_nutrient_status(nutrition.get("calcium", 70), 1000)
                }
            ],
            "alternatives": alternatives,
            "alternative_recipes": alternative_recipes,  # 대체 레시피 추가
            "guideline": f"신장병 환자 식사 원칙: 나트륨·칼륨·인 최대한 줄이기, 단백질은 적당히, 수분도 조심!\n\n주재료: {', '.join(ingredients[:5]) if ingredients else '정보 없음'}\n조리 팁: {recipe[:100] if recipe else '데치기나 삶기로 조리하면 칼륨이 줄어들어요'}...\n\n⚠️ 반드시 전문 영양사나 의료진과 상담하세요"
        }

        # 동적 응답 생성 (하드코딩 제거)
        response_parts = []

        # 위험 영양소 확인
        danger_nutrients = [n for n in nutrition_data["nutrients"] if n["status"] == "danger"]
        warning_nutrients = [n for n in nutrition_data["nutrients"] if n["status"] == "warning"]

        if danger_nutrients:
            nutrient_names = ", ".join([n["name"] for n in danger_nutrients])
            response_parts.append(f"⚠️ {dish_name}는 {nutrient_names} 함량이 높아 주의가 필요해요.")
        elif warning_nutrients:
            nutrient_names = ", ".join([n["name"] for n in warning_nutrients])
            response_parts.append(f"💡 {dish_name}는 {nutrient_names} 함량이 조금 높으니 양을 줄이거나 대체 방법을 확인하세요.")
        else:
            response_parts.append(f"✅ {dish_name}는 신장병 환자분이 드셔도 비교적 안전한 메뉴예요!")

        if alternatives:
            response_parts.append("아래 더 안전한 대체 방법도 확인해 보세요.")

        return {
            "response": " ".join(response_parts),
            "nutritionData": nutrition_data
        }

    async def _analyze_dish_from_recommendation(
        self,
        dish_recommendation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        추천 요리 데이터로 영양 분석 생성

        Args:
            dish_recommendation: {dishName, description, estimatedNutrients}

        Returns:
            영양 분석 결과
        """
        dish_name = dish_recommendation.get("dishName", "요리")
        estimated_nutrients = dish_recommendation.get("estimatedNutrients", {})

        # Nutrition data 생성
        nutrition_data = {
            "dishName": dish_name,
            "nutrients": [
                {
                    "name": "나트륨",
                    "value": estimated_nutrients.get("sodium", 500),
                    "max": 2000,
                    "unit": "mg",
                    "status": self._get_nutrient_status(estimated_nutrients.get("sodium", 500), 2000)
                },
                {
                    "name": "칼륨",
                    "value": estimated_nutrients.get("potassium", 500),
                    "max": 2000,
                    "unit": "mg",
                    "status": self._get_nutrient_status(estimated_nutrients.get("potassium", 500), 2000)
                },
                {
                    "name": "인",
                    "value": estimated_nutrients.get("phosphorus", 200),
                    "max": 800,
                    "unit": "mg",
                    "status": self._get_nutrient_status(estimated_nutrients.get("phosphorus", 200), 800)
                },
                {
                    "name": "단백질",
                    "value": estimated_nutrients.get("protein", 15),
                    "max": 50,
                    "unit": "g",
                    "status": self._get_nutrient_status(estimated_nutrients.get("protein", 15), 50)
                }
            ],
            "alternatives": [],
            "guideline": f"{dish_name} - {dish_recommendation.get('description', '')}\n\n⚠️ 영양사 또는 의료진과 상담 권장"
        }

        # 동적 응답 생성
        response_parts = []

        # 위험 영양소 확인
        danger_nutrients = [n for n in nutrition_data["nutrients"] if n["status"] == "danger"]
        warning_nutrients = [n for n in nutrition_data["nutrients"] if n["status"] == "warning"]

        if danger_nutrients:
            nutrient_names = ", ".join([n["name"] for n in danger_nutrients])
            response_parts.append(f"⚠️ {dish_name}는 {nutrient_names} 함량이 높아 주의가 필요해요.")
        elif warning_nutrients:
            nutrient_names = ", ".join([n["name"] for n in warning_nutrients])
            response_parts.append(f"💡 {dish_name}는 {nutrient_names} 함량이 조금 높으니 양을 줄이세요.")
        else:
            response_parts.append(f"✅ {dish_name}는 신장병 환자분이 드셔도 비교적 안전한 메뉴예요!")

        return {
            "response": " ".join(response_parts),
            "nutritionData": nutrition_data
        }

    def _find_high_risk_ingredients(self, nutrition: Dict[str, Any], ingredients: List[str]) -> List[str]:
        """CKD 제한 영양소를 초과하는 재료 찾기"""
        high_risk = []

        # 나트륨 > 667mg (1끼 기준)
        if nutrition.get("sodium", 0) > 667:
            high_risk.append("고염 조미료 (간장, 된장, 고추장)")

        # 칼륨 > 667mg
        if nutrition.get("potassium", 0) > 667:
            high_risk.append("고칼륨 야채 또는 과일")

        # 인 > 267mg
        if nutrition.get("phosphorus", 0) > 267:
            high_risk.append("고인 식품 (유제품, 견과류)")

        return high_risk

    async def _recommend_alternative_ingredients(
        self,
        dish_name: str,
        high_risk_ingredients: List[str]
    ) -> List[Dict[str, Any]]:
        """
        대체 재료 추천 (간장 반복 방지, 웹 검색 활용)

        Returns:
            [
                {
                    "name": "대체 버전명",
                    "description": "설명",
                    "nutrients": {sodium, potassium, phosphorus, protein}
                },
                ...
            ]
        """
        if not high_risk_ingredients:
            return []

        try:
            high_risk_str = ", ".join(high_risk_ingredients)
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": ALTERNATIVE_INGREDIENT_PROMPT.format(
                            dish_name=dish_name,
                            high_risk_ingredients=high_risk_str
                        )
                    }
                ],
                max_tokens=1500,
                temperature=0.7
            )

            content = response.choices[0].message.content
            data = self._extract_json(content)

            # alternatives 배열을 프론트엔드 형식으로 변환
            alternatives = []
            for alt in data.get("alternatives", []):
                for replacement in alt.get("replacements", [])[:2]:  # 최대 2개씩
                    alternatives.append({
                        "name": replacement.get("name", ""),
                        "description": replacement.get("reason", ""),
                        "nutrients": replacement.get("nutrients", {})
                    })

            # 간장 필터링 (절대 포함 금지)
            alternatives = [
                alt for alt in alternatives
                if not any(keyword in alt["name"].lower() for keyword in ["간장", "된장", "고추장", "soy sauce"])
            ]

            logger.info(f"✅ Recommended {len(alternatives)} alternatives (soy sauce filtered)")
            return alternatives[:3]  # 최대 3개

        except Exception as e:
            logger.error(f"Recommend alternative ingredients failed: {e}", exc_info=True)
            return []

    def _get_nutrient_status(self, value: float, max_value: float) -> str:
        """영양소 상태 판정 (safe/warning/danger)"""
        ratio = value / max_value
        if ratio < 0.7:
            return "safe"
        elif ratio < 1.0:
            return "warning"
        else:
            return "danger"

    async def _handle_text_input(
        self,
        user_input: str,
        session_id: str,
        conv_state: Dict[str, Any],
        user_profile: str = "general"
    ) -> Dict[str, Any]:
        """
        텍스트 입력 처리 - 레시피 요청 vs 일반 질문 구분

        Args:
            user_input: 사용자 입력
            session_id: 세션 ID
            conv_state: 대화 상태
            user_profile: 사용자 프로필

        Returns:
            처리 결과
        """
        # 레시피 요청 확인
        recipe_keywords = ["레시피", "만들기", "만드는법", "만드는 법", "요리법", "조리법"]
        is_recipe_request = any(keyword in user_input for keyword in recipe_keywords)

        if is_recipe_request and RECIPE_HANDLER_AVAILABLE:
            logger.info("🍽️  Detected recipe request - routing to recipe handler")

            # RecipeHandler 초기화 (lazy)
            if self.recipe_handler is None:
                self.recipe_handler = RecipeHandler(self.client, self.rag)

            # 레시피 요청 처리
            result = await self.recipe_handler.handle_recipe_request(
                user_input, session_id, conv_state, user_profile
            )

            if result:
                return result

            # RecipeHandler 실패 시 일반 텍스트 쿼리로 fallback
            logger.warning("Recipe handler failed - falling back to text query")

        # 일반 텍스트 쿼리 처리
        return await self._analyze_text_query(user_input, user_profile)

    async def _handle_text_query(
        self,
        user_input: str,
        session_id: str,
        conv_state: Dict[str, Any],
        user_profile: str = "general"
    ) -> Dict[str, Any]:
        """
        텍스트 쿼리 처리 (레거시 메서드 - _handle_text_input으로 대체됨)
        호환성을 위해 _analyze_text_query 호출
        """
        return await self._analyze_text_query(user_input, user_profile)

    async def _analyze_text_query(self, user_query: str, user_profile: str = "general") -> Dict[str, Any]:
        """
        텍스트 기반 영양 질문 분석

        Args:
            user_query: 사용자 질문
            user_profile: 사용자 프로필 (general, patient, researcher)

        Returns:
            분석 결과
        """
        try:
            # Build profile-specific system prompt
            profile_instructions = get_profile_instructions(user_profile)
            system_prompt = NUTRITION_SYSTEM_PROMPT.format(profile_specific_instructions=profile_instructions)

            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": f"""CKD 환자를 위한 영양 상담: {user_query}

한국어로 자세하고 친절하게 답변해주세요."""
                    }
                ],
                max_tokens=1500,
                temperature=0.7
            )

            answer = response.choices[0].message.content
            logger.info(f"✅ Text analysis response received: {len(answer)} chars")

            return {
                "response": answer,
                "nutritionData": None
            }

        except Exception as e:
            logger.error(f"Text analysis failed: {e}", exc_info=True)
            return {
                "response": f"죄송합니다. 분석 중 오류가 발생했습니다: {str(e)}"
            }

    def _extract_json(self, content: str) -> Dict[str, Any]:
        """JSON 추출 (```json ... ``` 제거)"""
        try:
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            else:
                json_str = content.strip()

            return json.loads(json_str)
        except Exception as e:
            logger.error(f"JSON extraction failed: {e}", exc_info=True)
            return {}

    def _error_response(self, error_msg: str, session_id: str) -> Dict[str, Any]:
        """에러 응답 생성 (Dict 형태)"""
        return {
            "response": f"영양 분석 중 오류가 발생했습니다: {error_msg}",
            "type": "error",
            "nutritionData": None,
            "tokens_used": 0,
            "status": "error",
            "agent_type": self.agent_type,
            "metadata": {
                "session_id": session_id,
                "error": error_msg
            }
        }

    def _error_response_as_agent_response(self, error_msg: str, session_id: str) -> "AgentResponse":
        """에러 응답 생성 (AgentResponse 형태)"""
        from ..core.contracts import AgentResponse
        return AgentResponse(
            answer=f"영양 분석 중 오류가 발생했습니다: {error_msg}",
            sources=[],
            papers=[],
            tokens_used=0,
            status="error",
            agent_type=self.agent_type,
            metadata={
                "session_id": session_id,
                "error": error_msg,
                "type": "error",
                "nutrition_data": None
            }
        )

    def estimate_context_usage(self, user_input: str) -> int:
        """
        컨텍스트 사용량 추정

        Args:
            user_input: 사용자 입력

        Returns:
            int: 예상 토큰 수
        """
        estimated_tokens = int(len(user_input) * 1.5)
        estimated_tokens += 500  # 시스템 프롬프트
        estimated_tokens += 1200  # 영양 분석 응답 (상대적으로 긴 응답)
        estimated_tokens += 500  # 이미지 분석 추가 토큰 (Vision API)

        return estimated_tokens
