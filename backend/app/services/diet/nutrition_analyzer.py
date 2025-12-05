"""
Nutrition Analyzer Service

This module provides AI-powered food image analysis using GPT-4 Vision API.
It analyzes food images to extract detailed nutritional information and provides
personalized recommendations for CKD (Chronic Kidney Disease) patients.

Key Features:
- Multi-modal AI analysis (image + text prompts)
- CKD stage-specific recommendations
- High-sodium/potassium/phosphorus warnings
- Confidence scoring for analysis accuracy
- Structured JSON output with comprehensive nutrition data

Usage:
    analyzer = NutritionAnalyzerService()
    result = await analyzer.analyze_food_image(
        image_data=image_bytes,
        user_profile=user_profile,
        prompt="What's in this meal?"
    )
"""
import os
import json
import logging
import base64
from typing import Dict, Any, List, Optional
from io import BytesIO

import openai
from openai import OpenAI, AsyncOpenAI

from app.models.diet_care import (
    NutritionAnalysisResult,
    FoodItem,
    UserProfile,
    MealType
)
from app.core.exceptions import (
    OpenAIAPIError,
    ImageProcessingError,
    ValidationError
)

logger = logging.getLogger(__name__)


class NutritionAnalyzerService:
    """
    AI-powered nutrition analysis service using GPT-4 Vision.

    This service analyzes food images and provides detailed nutritional
    information with CKD-specific recommendations and warnings.
    """

    # Maximum image size in bytes (5MB)
    MAX_IMAGE_SIZE = 5 * 1024 * 1024

    # Supported image formats
    SUPPORTED_FORMATS = {'image/jpeg', 'image/png', 'image/webp'}

    # CKD stage-specific nutrient limits (daily)
    CKD_LIMITS = {
        1: {"sodium_mg": 2300, "potassium_mg": 3500, "phosphorus_mg": 1200, "protein_g": 60},
        2: {"sodium_mg": 2300, "potassium_mg": 3000, "phosphorus_mg": 1000, "protein_g": 55},
        3: {"sodium_mg": 2000, "potassium_mg": 2500, "phosphorus_mg": 900, "protein_g": 50},
        4: {"sodium_mg": 1500, "potassium_mg": 2000, "phosphorus_mg": 800, "protein_g": 40},
        5: {"sodium_mg": 1500, "potassium_mg": 2000, "phosphorus_mg": 800, "protein_g": 40},
    }

    # High-risk foods for CKD patients
    HIGH_RISK_FOODS = {
        "sodium": ["김치", "된장", "고추장", "젓갈", "라면", "짜장면", "햄", "소시지", "치즈"],
        "potassium": ["바나나", "오렌지", "감자", "고구마", "토마토", "시금치", "아보카도"],
        "phosphorus": ["우유", "치즈", "콜라", "맥주", "땅콩", "견과류", "초콜릿"]
    }

    def __init__(self):
        """Initialize OpenAI client and configuration."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set - nutrition analysis will fail")
            self.client = None
            self.async_client = None
        else:
            self.client = OpenAI(api_key=api_key)
            self.async_client = AsyncOpenAI(api_key=api_key)

        logger.info("NutritionAnalyzerService initialized")

    async def analyze_food_image(
        self,
        image_data: bytes,
        user_profile: Optional[UserProfile] = None,
        prompt: Optional[str] = None
    ) -> NutritionAnalysisResult:
        """
        Analyze food image and return comprehensive nutrition data.

        Args:
            image_data: Raw image bytes
            user_profile: User's health profile for personalized analysis
            prompt: Optional user question/prompt about the meal

        Returns:
            NutritionAnalysisResult with foods, totals, recommendations, warnings

        Raises:
            OpenAIAPIError: If OpenAI API call fails
            ImageProcessingError: If image cannot be processed
            ValidationError: If inputs are invalid

        Example:
            >>> result = await analyzer.analyze_food_image(
            ...     image_data=image_bytes,
            ...     user_profile=UserProfile(ckd_stage=3, age=65),
            ...     prompt="Is this meal safe for my kidney condition?"
            ... )
            >>> print(f"Total sodium: {result.total_sodium_mg}mg")
        """
        # Validate inputs
        self._validate_inputs(image_data, user_profile)

        # Encode image to base64
        image_base64 = self._encode_image(image_data)

        # Build analysis prompt
        analysis_prompt = self._build_analysis_prompt(user_profile, prompt)

        # Call GPT-4 Vision API
        try:
            response = await self._call_openai_api(image_base64, analysis_prompt)

            # Parse and validate response
            analysis_result = self._parse_api_response(response, user_profile)

            logger.info(
                f"Successfully analyzed image: {len(analysis_result.foods)} foods detected, "
                f"confidence: {analysis_result.confidence_score:.2f}"
            )

            return analysis_result

        except Exception as e:
            logger.error(f"Food image analysis failed: {e}", exc_info=True)
            raise

    def analyze_food_image_sync(
        self,
        image_data: bytes,
        user_profile: Optional[UserProfile] = None,
        prompt: Optional[str] = None
    ) -> NutritionAnalysisResult:
        """
        Synchronous version of analyze_food_image.

        Use this for non-async contexts or testing.

        Args:
            image_data: Raw image bytes
            user_profile: User's health profile
            prompt: Optional user question

        Returns:
            NutritionAnalysisResult
        """
        self._validate_inputs(image_data, user_profile)

        image_base64 = self._encode_image(image_data)
        analysis_prompt = self._build_analysis_prompt(user_profile, prompt)

        try:
            if not self.client:
                raise OpenAIAPIError("OpenAI API key not configured")

            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": analysis_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            return self._parse_api_response(response, user_profile)

        except Exception as e:
            logger.error(f"Sync food image analysis failed: {e}", exc_info=True)
            raise

    def _validate_inputs(
        self,
        image_data: bytes,
        user_profile: Optional[UserProfile]
    ) -> None:
        """
        Validate input parameters.

        Args:
            image_data: Image bytes to validate
            user_profile: User profile to validate

        Raises:
            ValidationError: If inputs are invalid
        """
        if not image_data:
            raise ValidationError("Image data cannot be empty")

        if len(image_data) > self.MAX_IMAGE_SIZE:
            raise ValidationError(
                f"Image size ({len(image_data)} bytes) exceeds maximum "
                f"allowed size ({self.MAX_IMAGE_SIZE} bytes)"
            )

        # Validate user profile if provided
        if user_profile:
            if user_profile.ckd_stage and user_profile.ckd_stage not in range(1, 6):
                raise ValidationError(
                    f"Invalid CKD stage: {user_profile.ckd_stage}. Must be 1-5."
                )

    def _encode_image(self, image_data: bytes) -> str:
        """
        Encode image to base64 string.

        Args:
            image_data: Raw image bytes

        Returns:
            Base64 encoded string

        Raises:
            ImageProcessingError: If encoding fails
        """
        try:
            return base64.b64encode(image_data).decode('utf-8')
        except Exception as e:
            raise ImageProcessingError(f"Failed to encode image: {str(e)}")

    def _get_system_prompt(self) -> str:
        """
        Get system prompt for GPT-4 Vision.

        Returns:
            System prompt string defining AI behavior
        """
        return """You are an expert nutritionist specializing in Korean cuisine and
Chronic Kidney Disease (CKD) dietary management. Your role is to:

1. Accurately identify all foods in images
2. Estimate portion sizes in grams
3. Calculate nutritional content (calories, protein, sodium, potassium, phosphorus)
4. Provide CKD-specific dietary recommendations
5. Flag high-risk foods for kidney health

Be conservative in estimates to avoid underestimating harmful nutrients.
Respond ONLY with valid JSON following the specified format."""

    def _build_analysis_prompt(
        self,
        user_profile: Optional[UserProfile],
        user_prompt: Optional[str]
    ) -> str:
        """
        Build analysis prompt for GPT-4 Vision.

        Args:
            user_profile: User's health profile
            user_prompt: User's question/prompt

        Returns:
            Formatted prompt string
        """
        # Base prompt
        prompt_parts = [
            "이미지의 음식을 분석하고 다음 JSON 형식으로 응답해주세요:",
            "",
            "```json",
            "{",
            '  "foods": [',
            '    {',
            '      "name": "음식 이름 (한국어)",',
            '      "amount": "분량 (예: 100g, 1컵)",',
            '      "calories": 칼로리(kcal),',
            '      "protein_g": 단백질(g),',
            '      "sodium_mg": 나트륨(mg),',
            '      "potassium_mg": 칼륨(mg),',
            '      "phosphorus_mg": 인(mg),',
            '      "carbs_g": 탄수화물(g),',
            '      "fat_g": 지방(g),',
            '      "fiber_g": 식이섬유(g)',
            '    }',
            '  ],',
            '  "meal_type_suggestion": "breakfast|lunch|dinner|snack",',
            '  "confidence_score": 0.0-1.0,',
            '  "analysis_notes": "분석 참고사항"',
            "}",
            "```",
            "",
            "요구사항:",
            "- 모든 음식을 개별적으로 식별하고 분석",
            "- 분량을 정확하게 추정 (그램 단위 선호)",
            "- 불확실한 경우 보수적으로 추정 (과소평가보다 과대평가)",
        ]

        # Add CKD-specific guidance if profile provided
        if user_profile and user_profile.ckd_stage:
            stage = user_profile.ckd_stage
            limits = self.CKD_LIMITS.get(stage, self.CKD_LIMITS[3])

            prompt_parts.extend([
                "",
                f"환자 정보: CKD Stage {stage}",
                "일일 권장 제한:",
                f"- 나트륨: {limits['sodium_mg']}mg 이하",
                f"- 칼륨: {limits['potassium_mg']}mg 이하",
                f"- 인: {limits['phosphorus_mg']}mg 이하",
                f"- 단백질: {limits['protein_g']}g 정도",
                "",
                "고위험 음식 식별 시 analysis_notes에 경고 포함"
            ])

        # Add user's custom prompt if provided
        if user_prompt:
            prompt_parts.extend([
                "",
                f"사용자 질문: {user_prompt}",
                "분석 결과와 함께 질문에 대한 답변을 analysis_notes에 포함"
            ])

        return "\n".join(prompt_parts)

    async def _call_openai_api(
        self,
        image_base64: str,
        prompt: str
    ) -> Any:
        """
        Call OpenAI GPT-4 Vision API asynchronously.

        Args:
            image_base64: Base64 encoded image
            prompt: Analysis prompt

        Returns:
            API response object

        Raises:
            OpenAIAPIError: If API call fails
        """
        if not self.async_client:
            raise OpenAIAPIError("OpenAI API key not configured")

        try:
            response = await self.async_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            return response

        except openai.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise OpenAIAPIError(
                reason=f"OpenAI API error: {str(e)}",
                status_code=getattr(e, 'status_code', None)
            )
        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise OpenAIAPIError(
                reason="API rate limit exceeded. Please try again later.",
                status_code=429
            )
        except Exception as e:
            logger.error(f"Unexpected API error: {e}", exc_info=True)
            raise OpenAIAPIError(reason=f"Unexpected error: {str(e)}")

    def _parse_api_response(
        self,
        response: Any,
        user_profile: Optional[UserProfile]
    ) -> NutritionAnalysisResult:
        """
        Parse OpenAI API response into NutritionAnalysisResult.

        Args:
            response: API response object
            user_profile: User profile for generating recommendations

        Returns:
            NutritionAnalysisResult object

        Raises:
            ImageProcessingError: If response parsing fails
        """
        try:
            # Extract content
            content = response.choices[0].message.content
            logger.debug(f"API response: {content[:500]}...")

            # Parse JSON
            data = json.loads(content)

            # Parse foods
            foods_data = data.get("foods", [])
            if not foods_data:
                raise ImageProcessingError("No foods detected in image")

            foods = [FoodItem(**food) for food in foods_data]

            # Calculate totals
            total_calories = sum(f.calories for f in foods)
            total_protein_g = sum(f.protein_g for f in foods)
            total_sodium_mg = sum(f.sodium_mg for f in foods)
            total_potassium_mg = sum(f.potassium_mg for f in foods)
            total_phosphorus_mg = sum(f.phosphorus_mg for f in foods)
            total_carbs_g = sum(f.carbs_g or 0 for f in foods)
            total_fat_g = sum(f.fat_g or 0 for f in foods)
            total_fiber_g = sum(f.fiber_g or 0 for f in foods)

            # Parse meal type suggestion
            meal_type_str = data.get("meal_type_suggestion")
            meal_type_suggestion = None
            if meal_type_str:
                try:
                    meal_type_suggestion = MealType(meal_type_str)
                except ValueError:
                    logger.warning(f"Invalid meal type: {meal_type_str}")

            # Get confidence score
            confidence_score = float(data.get("confidence_score", 0.8))

            # Get analysis notes
            analysis_notes = data.get("analysis_notes")

            # Generate recommendations and warnings
            recommendations = self._generate_recommendations(
                foods,
                total_sodium_mg,
                total_potassium_mg,
                total_phosphorus_mg,
                total_protein_g,
                user_profile
            )

            warnings = self._generate_warnings(
                foods,
                total_sodium_mg,
                total_potassium_mg,
                total_phosphorus_mg,
                user_profile
            )

            return NutritionAnalysisResult(
                foods=foods,
                total_calories=total_calories,
                total_protein_g=total_protein_g,
                total_sodium_mg=total_sodium_mg,
                total_potassium_mg=total_potassium_mg,
                total_phosphorus_mg=total_phosphorus_mg,
                total_carbs_g=total_carbs_g,
                total_fat_g=total_fat_g,
                total_fiber_g=total_fiber_g,
                meal_type_suggestion=meal_type_suggestion,
                confidence_score=confidence_score,
                recommendations=recommendations,
                warnings=warnings,
                analysis_notes=analysis_notes
            )

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            raise ImageProcessingError(f"Failed to parse analysis results: {str(e)}")
        except KeyError as e:
            logger.error(f"Missing required field in response: {e}")
            raise ImageProcessingError(f"Invalid response format: missing {str(e)}")
        except Exception as e:
            logger.error(f"Failed to parse API response: {e}", exc_info=True)
            raise ImageProcessingError(f"Response parsing failed: {str(e)}")

    def _generate_recommendations(
        self,
        foods: List[FoodItem],
        total_sodium_mg: float,
        total_potassium_mg: float,
        total_phosphorus_mg: float,
        total_protein_g: float,
        user_profile: Optional[UserProfile]
    ) -> List[str]:
        """
        Generate personalized dietary recommendations.

        Args:
            foods: Detected food items
            total_sodium_mg: Total sodium content
            total_potassium_mg: Total potassium content
            total_phosphorus_mg: Total phosphorus content
            total_protein_g: Total protein content
            user_profile: User's health profile

        Returns:
            List of recommendation strings
        """
        recommendations = []

        if not user_profile or not user_profile.ckd_stage:
            # General recommendations
            recommendations.append("식사 후 충분한 수분 섭취를 권장합니다")
            return recommendations

        # Get CKD stage limits
        stage = user_profile.ckd_stage
        limits = self.CKD_LIMITS.get(stage, self.CKD_LIMITS[3])

        # Sodium recommendations
        if total_sodium_mg > limits["sodium_mg"] * 0.4:  # >40% of daily limit in one meal
            recommendations.append(
                f"나트륨 함량이 높습니다 ({total_sodium_mg:.0f}mg). "
                "저염 조리법을 사용하고, 국물은 적게 드세요"
            )

        # Potassium recommendations
        if total_potassium_mg > limits["potassium_mg"] * 0.4:
            recommendations.append(
                f"칼륨 함량이 높습니다 ({total_potassium_mg:.0f}mg). "
                "채소는 데쳐서 드시고, 과일은 소량만 섭취하세요"
            )

        # Phosphorus recommendations
        if total_phosphorus_mg > limits["phosphorus_mg"] * 0.4:
            recommendations.append(
                f"인 함량이 높습니다 ({total_phosphorus_mg:.0f}mg). "
                "유제품과 가공식품 섭취를 줄이세요"
            )

        # Protein recommendations
        if total_protein_g > limits["protein_g"] * 0.5:
            recommendations.append(
                f"단백질 함량이 높습니다 ({total_protein_g:.0f}g). "
                "적정량의 단백질을 여러 끼에 나눠 섭취하세요"
            )
        elif total_protein_g < limits["protein_g"] * 0.2:
            recommendations.append(
                "단백질이 부족할 수 있습니다. 양질의 단백질을 추가하세요"
            )

        # If all within limits
        if not recommendations:
            recommendations.append(
                "영양소 균형이 잘 맞춰진 식사입니다. 계속 유지하세요!"
            )

        return recommendations

    def _generate_warnings(
        self,
        foods: List[FoodItem],
        total_sodium_mg: float,
        total_potassium_mg: float,
        total_phosphorus_mg: float,
        user_profile: Optional[UserProfile]
    ) -> List[str]:
        """
        Generate health warnings for CKD patients.

        Args:
            foods: Detected food items
            total_sodium_mg: Total sodium content
            total_potassium_mg: Total potassium content
            total_phosphorus_mg: Total phosphorus content
            user_profile: User's health profile

        Returns:
            List of warning strings
        """
        warnings = []

        if not user_profile or not user_profile.ckd_stage:
            return warnings

        # Get CKD stage limits
        stage = user_profile.ckd_stage
        limits = self.CKD_LIMITS.get(stage, self.CKD_LIMITS[3])

        # Critical sodium warning
        if total_sodium_mg > limits["sodium_mg"] * 0.6:
            warnings.append(
                "⚠️ 나트륨 과다: 일일 권장량의 60% 이상을 한 끼에 섭취했습니다"
            )

        # Critical potassium warning
        if total_potassium_mg > limits["potassium_mg"] * 0.6:
            warnings.append(
                "⚠️ 칼륨 과다: 고칼륨혈증 위험이 있습니다. 주의가 필요합니다"
            )

        # Critical phosphorus warning
        if total_phosphorus_mg > limits["phosphorus_mg"] * 0.6:
            warnings.append(
                "⚠️ 인 과다: 뼈 건강에 영향을 줄 수 있습니다"
            )

        # Check for high-risk foods
        food_names = [f.name.lower() for f in foods]

        # Sodium risk foods
        sodium_risks = [
            food for food in self.HIGH_RISK_FOODS["sodium"]
            if any(food in name for name in food_names)
        ]
        if sodium_risks and stage >= 3:
            warnings.append(
                f"⚠️ 고염분 식품 감지: {', '.join(sodium_risks)}. 섭취를 제한하세요"
            )

        # Potassium risk foods
        potassium_risks = [
            food for food in self.HIGH_RISK_FOODS["potassium"]
            if any(food in name for name in food_names)
        ]
        if potassium_risks and stage >= 4:
            warnings.append(
                f"⚠️ 고칼륨 식품 감지: {', '.join(potassium_risks)}. 주의가 필요합니다"
            )

        # Phosphorus risk foods
        phosphorus_risks = [
            food for food in self.HIGH_RISK_FOODS["phosphorus"]
            if any(food in name for name in food_names)
        ]
        if phosphorus_risks and stage >= 3:
            warnings.append(
                f"⚠️ 고인 식품 감지: {', '.join(phosphorus_risks)}. 가급적 피하세요"
            )

        return warnings


# Singleton instance
nutrition_analyzer_service = NutritionAnalyzerService()


# Test stub
"""
Unit tests for NutritionAnalyzerService:

1. test_analyze_food_image_success():
   - Mock OpenAI API response
   - Verify NutritionAnalysisResult structure
   - Check food items parsed correctly

2. test_analyze_food_image_with_ckd_profile():
   - Test with different CKD stages
   - Verify recommendations are stage-specific
   - Check warnings for high-risk foods

3. test_invalid_image_data():
   - Test with empty image
   - Test with oversized image
   - Verify ValidationError raised

4. test_openai_api_error():
   - Mock API failure
   - Verify OpenAIAPIError raised
   - Check error message format

5. test_recommendations_generation():
   - Test various nutrient combinations
   - Verify recommendation logic
   - Check threshold calculations

6. test_warnings_generation():
   - Test high-risk food detection
   - Verify warning messages
   - Check CKD stage-specific warnings
"""
