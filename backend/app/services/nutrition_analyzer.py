"""
Nutrition Analyzer Service - GPT-4 Vision Integration

This service uses OpenAI's GPT-4 Vision API to analyze food images
and extract detailed nutrition information for CKD (Chronic Kidney Disease) patients.
"""
import os
import json
import logging
import base64
from typing import Optional, List, Dict, Any
from io import BytesIO
from PIL import Image

import openai
from openai import AsyncOpenAI

from app.models.diet_care import (
    FoodItem,
    NutritionAnalysisResult,
    UserProfile,
    MealType
)

logger = logging.getLogger(__name__)


class NutritionAnalyzer:
    """
    Service for analyzing food images and text using GPT-4 Vision.

    This analyzer is specifically designed for CKD patients and provides:
    - Detailed nutrition breakdown (protein, sodium, potassium, phosphorus)
    - Personalized recommendations based on CKD stage
    - Warnings about foods that may be harmful
    """

    def __init__(self):
        """Initialize the OpenAI client"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        self.client = AsyncOpenAI(api_key=api_key)
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o")  # gpt-4-vision-preview deprecated
        self.max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "4096"))

    async def analyze_meal(
        self,
        image_data: Optional[bytes] = None,
        text_description: Optional[str] = None,
        user_profile: Optional[UserProfile] = None
    ) -> NutritionAnalysisResult:
        """
        Analyze a meal from image and/or text description.

        Args:
            image_data: Raw image bytes (JPEG, PNG, etc.)
            text_description: Text description of the meal
            user_profile: User's health profile for personalized analysis

        Returns:
            NutritionAnalysisResult: Structured nutrition analysis

        Raises:
            ValueError: If both image_data and text_description are None
            Exception: If OpenAI API call fails
        """
        if not image_data and not text_description:
            raise ValueError("At least one of image_data or text_description is required")

        # Build the prompt
        prompt = self._build_analysis_prompt(user_profile)

        # Build the message content
        content = self._build_message_content(prompt, image_data, text_description)

        try:
            # Call GPT-4 Vision
            logger.info("Calling GPT-4 Vision for nutrition analysis")
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": content
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=0.2,  # Lower temperature for more consistent results
            )

            # Parse the response
            result_text = response.choices[0].message.content
            logger.info(f"GPT-4 Vision response received: {len(result_text)} characters")

            # Extract JSON from response
            analysis_result = self._parse_gpt_response(result_text)

            return analysis_result

        except openai.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise Exception(f"Failed to analyze meal: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in nutrition analysis: {e}")
            raise

    def _get_system_prompt(self) -> str:
        """Get the system prompt for GPT-4"""
        return """You are a specialized nutrition analyzer for Chronic Kidney Disease (CKD) patients.
Your role is to analyze food images and descriptions, providing detailed nutrition information
with a focus on key nutrients that CKD patients must monitor: protein, sodium, potassium, and phosphorus.

You must respond ONLY with valid JSON following the exact schema provided.
Be accurate, conservative in estimates, and prioritize patient safety."""

    def _build_analysis_prompt(self, user_profile: Optional[UserProfile]) -> str:
        """Build the analysis prompt with user context"""
        prompt = """Analyze this meal and provide a detailed nutrition breakdown.

**IMPORTANT**: Respond with ONLY a valid JSON object matching this exact schema:

{
  "foods": [
    {
      "name": "string",
      "amount": "string (e.g., '100g', '1 cup')",
      "calories": number,
      "protein_g": number,
      "sodium_mg": number,
      "potassium_mg": number,
      "phosphorus_mg": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number
    }
  ],
  "total_calories": number,
  "total_protein_g": number,
  "total_sodium_mg": number,
  "total_potassium_mg": number,
  "total_phosphorus_mg": number,
  "total_carbs_g": number,
  "total_fat_g": number,
  "total_fiber_g": number,
  "meal_type_suggestion": "breakfast" | "lunch" | "dinner" | "snack" | null,
  "confidence_score": number (0-1),
  "recommendations": ["string"],
  "warnings": ["string"],
  "analysis_notes": "string or null"
}

**Key Requirements**:
1. Identify all visible food items
2. Estimate portion sizes carefully
3. Calculate nutrition values for CKD patients (focus on protein, sodium, potassium, phosphorus)
4. Provide specific, actionable recommendations
5. Warn about high-risk foods for CKD patients
"""

        if user_profile:
            prompt += f"\n\n**User Profile**:\n{self._format_user_profile(user_profile)}\n"

        return prompt

    def _format_user_profile(self, profile: UserProfile) -> str:
        """Format user profile for the prompt"""
        parts = []

        if profile.age:
            parts.append(f"- Age: {profile.age} years")
        if profile.weight_kg:
            parts.append(f"- Weight: {profile.weight_kg} kg")
        if profile.height_cm:
            parts.append(f"- Height: {profile.height_cm} cm")
        if profile.ckd_stage:
            parts.append(f"- CKD Stage: {profile.ckd_stage}")
        if profile.activity_level:
            parts.append(f"- Activity Level: {profile.activity_level}")
        if profile.medical_conditions:
            parts.append(f"- Medical Conditions: {', '.join(profile.medical_conditions)}")
        if profile.allergies:
            parts.append(f"- Allergies: {', '.join(profile.allergies)}")

        return "\n".join(parts) if parts else "No profile information provided"

    def _build_message_content(
        self,
        prompt: str,
        image_data: Optional[bytes],
        text_description: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Build the message content array for GPT-4 Vision"""
        content = []

        # Add text prompt
        full_text = prompt
        if text_description:
            full_text += f"\n\n**User Description**: {text_description}"

        content.append({
            "type": "text",
            "text": full_text
        })

        # Add image if provided
        if image_data:
            # Convert image to base64
            base64_image = self._encode_image(image_data)
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}",
                    "detail": "high"  # High detail for better food recognition
                }
            })

        return content

    def _encode_image(self, image_data: bytes) -> str:
        """
        Encode image to base64 and optionally resize for API limits.

        OpenAI has a 20MB limit for images.
        """
        try:
            # Open image with PIL
            image = Image.open(BytesIO(image_data))

            # Resize if too large (max 2048x2048 for high detail)
            max_size = 2048
            if image.width > max_size or image.height > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                logger.info(f"Resized image to {image.size}")

            # Convert to RGB if necessary
            if image.mode not in ('RGB', 'L'):
                image = image.convert('RGB')

            # Save to bytes
            buffered = BytesIO()
            image.save(buffered, format="JPEG", quality=85)
            img_bytes = buffered.getvalue()

            # Encode to base64
            return base64.b64encode(img_bytes).decode('utf-8')

        except Exception as e:
            logger.error(f"Error encoding image: {e}")
            # Fallback: just encode the original data
            return base64.b64encode(image_data).decode('utf-8')

    def _parse_gpt_response(self, response_text: str) -> NutritionAnalysisResult:
        """
        Parse GPT-4 response into NutritionAnalysisResult.

        Args:
            response_text: Raw text response from GPT-4

        Returns:
            NutritionAnalysisResult: Parsed and validated result

        Raises:
            ValueError: If response cannot be parsed
        """
        try:
            # Try to extract JSON from response
            # Sometimes GPT wraps JSON in markdown code blocks
            json_str = response_text.strip()

            # Remove markdown code blocks if present
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            elif json_str.startswith("```"):
                json_str = json_str[3:]

            if json_str.endswith("```"):
                json_str = json_str[:-3]

            json_str = json_str.strip()

            # Parse JSON
            data = json.loads(json_str)

            # Convert foods to FoodItem objects
            foods = [FoodItem(**food) for food in data.get("foods", [])]

            # Create NutritionAnalysisResult
            result = NutritionAnalysisResult(
                foods=foods,
                total_calories=data.get("total_calories", 0),
                total_protein_g=data.get("total_protein_g", 0),
                total_sodium_mg=data.get("total_sodium_mg", 0),
                total_potassium_mg=data.get("total_potassium_mg", 0),
                total_phosphorus_mg=data.get("total_phosphorus_mg", 0),
                total_carbs_g=data.get("total_carbs_g", 0),
                total_fat_g=data.get("total_fat_g", 0),
                total_fiber_g=data.get("total_fiber_g", 0),
                meal_type_suggestion=data.get("meal_type_suggestion"),
                confidence_score=data.get("confidence_score", 0.8),
                recommendations=data.get("recommendations", []),
                warnings=data.get("warnings", []),
                analysis_notes=data.get("analysis_notes")
            )

            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response text: {response_text[:500]}")
            raise ValueError(f"Invalid JSON response from GPT-4: {str(e)}")
        except Exception as e:
            logger.error(f"Error parsing GPT response: {e}")
            raise ValueError(f"Failed to parse analysis result: {str(e)}")


# Singleton instance
_analyzer: Optional[NutritionAnalyzer] = None


def get_nutrition_analyzer() -> NutritionAnalyzer:
    """Get or create the nutrition analyzer singleton"""
    global _analyzer
    if _analyzer is None:
        _analyzer = NutritionAnalyzer()
    return _analyzer
