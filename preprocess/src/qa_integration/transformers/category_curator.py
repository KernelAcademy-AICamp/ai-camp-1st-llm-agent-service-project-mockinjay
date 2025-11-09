#!/usr/bin/env python3
"""
Category Curator
AI-based category curation for QA pairs
"""

import os
import logging
from typing import Dict, List, Optional
import anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class CategoryCurator:
    """
    AI-based category curator for QA pairs
    Uses Anthropic API to generate appropriate categories
    """

    def __init__(self):
        """Initialize the category curator"""
        api_key = os.getenv('ANTHROPIC_API_KEY')
        base_url = os.getenv('ANTHROPIC_BASE_URL')

        self.client = anthropic.Anthropic(
            api_key=api_key,
            base_url=base_url
        )

        # Predefined category examples for better consistency
        self.category_examples = [
            '내과', '외과', '소아청소년과', '산부인과', '정형외과',
            '신경과', '정신건강의학과', '안과', '이비인후과', '피부과',
            '비뇨의학과', '영상의학과', '병리과', '재활의학과', '가정의학과',
            '응급의학과', '마취통증의학과', '흉부외과', '신경외과', '성형외과',
            '검진/진단', '치료', '증상', '예방', '약물', '검사', '수술',
            '식이요법', '질병관리', '합병증', '원인', '생활습관'
        ]

    def curate_category(
        self,
        question: str,
        answer: str,
        existing_category: Optional[str] = None,
        max_retries: int = 3
    ) -> str:
        """
        Curate category for a QA pair using AI

        Args:
            question: Question text
            answer: Answer text
            existing_category: Existing category (if any)
            max_retries: Maximum number of retry attempts

        Returns:
            Curated category string
        """
        # If existing category looks good, keep it
        if existing_category and self._is_valid_category(existing_category):
            logger.debug(f"Keeping existing category: {existing_category}")
            return existing_category

        # Use AI to generate category
        try:
            for attempt in range(max_retries):
                try:
                    category = self._generate_category_with_ai(question, answer, existing_category)

                    if category and self._is_valid_category(category):
                        logger.info(f"Generated category: {category}")
                        return category
                    else:
                        logger.warning(f"Invalid category generated: {category}, attempt {attempt + 1}")
                        if attempt < max_retries - 1:
                            continue
                        else:
                            return existing_category if existing_category else '기타'

                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"Category curation attempt {attempt + 1} failed: {str(e)}, retrying...")
                        continue
                    else:
                        logger.error(f"Failed to curate category after {max_retries} attempts: {str(e)}")
                        return existing_category if existing_category else '기타'

        except Exception as e:
            logger.error(f"Error in category curation: {str(e)}")
            return existing_category if existing_category else '기타'

    def _generate_category_with_ai(
        self,
        question: str,
        answer: str,
        existing_category: Optional[str] = None
    ) -> str:
        """
        Generate category using AI

        Args:
            question: Question text
            answer: Answer text
            existing_category: Existing category (if any)

        Returns:
            Generated category string
        """
        # Prepare system prompt
        system_prompt = f"""당신은 의료 QA 데이터셋 분류 전문가입니다.

주어진 질문과 답변을 분석하여 가장 적절한 카테고리를 제시해주세요.

**카테고리 선택 가이드라인:**
1. 진료과 중심: {', '.join(self.category_examples[:20])}
2. 주제 중심: {', '.join(self.category_examples[20:])}

**응답 형식:**
- 한글로만 응답
- 1-3 단어로 간결하게
- 진료과명 또는 주제 카테고리 중 선택
- 설명 없이 카테고리명만 출력
"""

        # Prepare user prompt
        user_prompt = f"""질문: {question[:300]}

답변: {answer[:300]}"""

        if existing_category:
            user_prompt += f"\n\n기존 카테고리: {existing_category}"

        # Call API
        message = self.client.messages.create(
            model="MiniMax-M2",
            max_tokens=100,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": [{"type": "text", "text": user_prompt}]
                }
            ]
        )

        # Extract category from response
        category = message.content[0].text.strip()

        # Clean up the category
        category = self._clean_category(category)

        return category

    def _clean_category(self, category: str) -> str:
        """
        Clean up the category string

        Args:
            category: Raw category string

        Returns:
            Cleaned category string
        """
        # Remove common prefixes
        prefixes_to_remove = [
            '카테고리:', '카테고리 :', '분류:', '분류 :',
            'Category:', 'Category :', '답변:', '답변 :',
        ]

        for prefix in prefixes_to_remove:
            if category.startswith(prefix):
                category = category[len(prefix):].strip()

        # Remove quotes and punctuation
        category = category.strip('"\'.,。')

        # Remove parentheses and their content
        if '(' in category:
            category = category.split('(')[0].strip()

        return category

    def _is_valid_category(self, category: str) -> bool:
        """
        Check if category is valid

        Args:
            category: Category string

        Returns:
            True if valid, False otherwise
        """
        if not category or not isinstance(category, str):
            return False

        # Check length
        if len(category) > 20 or len(category) < 2:
            return False

        # Check if it's not just numbers or special characters
        if category.replace(' ', '').isdigit():
            return False

        # Should contain at least one Korean or English character
        has_valid_char = any('\uac00' <= c <= '\ud7a3' or c.isalpha() for c in category)

        return has_valid_char

    def curate_batch(
        self,
        qa_pairs: List[Dict],
        category_field: str = 'category',
        force_recurate: bool = False
    ) -> List[Dict]:
        """
        Curate categories for a batch of QA pairs

        Args:
            qa_pairs: List of QA pair dictionaries
            category_field: Field name for category in the dictionary
            force_recurate: Force re-curation even if category exists

        Returns:
            List of QA pairs with curated categories
        """
        curated_pairs = []
        skipped_count = 0

        for idx, qa_pair in enumerate(qa_pairs):
            if idx % 100 == 0 and idx > 0:
                logger.info(f"Curated {idx}/{len(qa_pairs)} QA pairs")

            question = qa_pair.get('question', '')
            answer = qa_pair.get('answer', '')
            existing_category = qa_pair.get(category_field, '')

            # Skip if category exists and we're not forcing re-curation
            if not force_recurate and existing_category and self._is_valid_category(existing_category):
                curated_pairs.append(qa_pair)
                skipped_count += 1
                continue

            # Curate category
            curated_category = self.curate_category(question, answer, existing_category)
            qa_pair[category_field] = curated_category

            curated_pairs.append(qa_pair)

        logger.info(f"Curated {len(curated_pairs)} QA pairs (skipped {skipped_count})")
        return curated_pairs

    def enrich_subcategory(
        self,
        question: str,
        answer: str,
        category: str,
        max_retries: int = 3
    ) -> str:
        """
        Generate a more specific subcategory based on category

        Args:
            question: Question text
            answer: Answer text
            category: Main category
            max_retries: Maximum number of retry attempts

        Returns:
            Subcategory string
        """
        try:
            for attempt in range(max_retries):
                try:
                    system_prompt = f"""당신은 의료 QA 데이터셋 분류 전문가입니다.

주어진 질문, 답변, 그리고 메인 카테고리({category})를 기반으로 더 구체적인 하위 카테고리를 제시해주세요.

**응답 형식:**
- 한글로만 응답
- 1-3 단어로 간결하게
- 메인 카테고리의 하위 주제로 구체화
- 설명 없이 하위 카테고리명만 출력

**예시:**
- 메인: 내과 → 하위: 당뇨병, 고혈압, 신장질환
- 메인: 치료 → 하위: 약물치료, 수술, 물리치료
"""

                    user_prompt = f"""메인 카테고리: {category}

질문: {question[:300]}

답변: {answer[:300]}"""

                    message = self.client.messages.create(
                        model="MiniMax-M2",
                        max_tokens=100,
                        system=system_prompt,
                        messages=[
                            {
                                "role": "user",
                                "content": [{"type": "text", "text": user_prompt}]
                            }
                        ]
                    )

                    subcategory = message.content[0].text.strip()
                    subcategory = self._clean_category(subcategory)

                    if subcategory and self._is_valid_category(subcategory):
                        return subcategory
                    else:
                        if attempt < max_retries - 1:
                            continue
                        else:
                            return category

                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"Subcategory generation attempt {attempt + 1} failed: {str(e)}, retrying...")
                        continue
                    else:
                        logger.error(f"Failed to generate subcategory: {str(e)}")
                        return category

        except Exception as e:
            logger.error(f"Error in subcategory generation: {str(e)}")
            return category


def curate_category_with_ai(question: str, answer: str, existing_category: Optional[str] = None) -> str:
    """
    Convenience function to curate a single category

    Args:
        question: Question text
        answer: Answer text
        existing_category: Existing category (if any)

    Returns:
        Curated category string
    """
    curator = CategoryCurator()
    return curator.curate_category(question, answer, existing_category)


if __name__ == '__main__':
    # Test the curator
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Test single category curation
    test_question = "투석 환자의 식이요법에서 주의해야 할 점은 무엇인가요?"
    test_answer = "투석 환자는 칼륨, 인, 나트륨 섭취를 제한해야 하며, 적절한 단백질 섭취가 중요합니다."

    curator = CategoryCurator()
    category = curator.curate_category(test_question, test_answer)

    print(f"\nTest Question: {test_question}")
    print(f"Generated Category: {category}")

    # Test subcategory generation
    subcategory = curator.enrich_subcategory(test_question, test_answer, category)
    print(f"Generated Subcategory: {subcategory}")
