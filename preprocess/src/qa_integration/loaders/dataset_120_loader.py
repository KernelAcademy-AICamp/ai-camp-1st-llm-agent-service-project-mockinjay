#!/usr/bin/env python3
"""
Dataset 120 Loader - 초거대AI 사전학습용 헬스케어 질의응답 데이터
Loads healthcare QA pairs from AI Hub dataset 120 and generates questions using AI
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional
import anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class Dataset120Loader:
    """
    Loader for AI Hub Dataset 120 - 초거대AI 사전학습용 헬스케어 질의응답 데이터

    Format: {fileName, disease_category, disease_name, department, intention, answer}
    Note: This dataset does not have questions, so we generate them using AI
    """

    def __init__(self, base_path: str, use_ai_generation: bool = False):
        """
        Initialize the Dataset 120 loader

        Args:
            base_path: Base path to the dataset 120 directory
            use_ai_generation: Whether to use AI to generate questions
                             Default: False (use template-based generation)
        """
        self.base_path = Path(base_path)
        self.dataset_name = "dataset_120_healthcare_qa"
        self.use_ai_generation = use_ai_generation

        # Define paths to search for JSON files
        self.data_paths = [
            self.base_path / "3.개방데이터" / "1.데이터" / "Training" / "02.라벨링데이터" / "TL" / "2.답변",
            self.base_path / "3.개방데이터" / "1.데이터" / "Validation" / "02.라벨링데이터" / "VL" / "2.답변",
        ]

        # Initialize Anthropic client if AI generation is enabled
        if self.use_ai_generation:
            api_key = os.getenv('ANTHROPIC_API_KEY')
            base_url = os.getenv('ANTHROPIC_BASE_URL')
            self.client = anthropic.Anthropic(
                api_key=api_key,
                base_url=base_url
            )

    def _find_json_files(self) -> List[Path]:
        """
        Find all JSON files in the dataset directories

        Returns:
            List of Path objects pointing to JSON files
        """
        json_files = []

        for data_path in self.data_paths:
            if not data_path.exists():
                logger.warning(f"Path does not exist: {data_path}")
                continue

            # Recursively find all JSON files
            for json_file in data_path.rglob("*.json"):
                json_files.append(json_file)

        logger.info(f"Found {len(json_files)} JSON files in dataset 120")
        return json_files

    def _load_single_file(self, file_path: Path) -> Optional[Dict]:
        """
        Load a single JSON file

        Args:
            file_path: Path to the JSON file

        Returns:
            Dictionary containing the QA data, or None if loading fails
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data
        except Exception as e:
            logger.error(f"Failed to load {file_path}: {str(e)}")
            return None

    def _combine_answer(self, answer_dict: Dict) -> str:
        """
        Combine answer intro, body, and conclusion into a single text

        Args:
            answer_dict: Dictionary containing intro, body, conclusion

        Returns:
            Combined answer text
        """
        intro = answer_dict.get('intro', '')
        body = answer_dict.get('body', '')
        conclusion = answer_dict.get('conclusion', '')

        parts = []
        if intro:
            parts.append(intro)
        if body:
            parts.append(body)
        if conclusion:
            parts.append(conclusion)

        return ' '.join(parts)

    def _generate_question_with_ai(self, metadata: Dict, answer: str, max_retries: int = 3) -> str:
        """
        Generate a question based on metadata and answer using AI

        Args:
            metadata: Dictionary containing disease_name, intention, department
            answer: The answer text
            max_retries: Maximum number of retry attempts

        Returns:
            Generated question string
        """
        if not self.use_ai_generation:
            return self._generate_question_from_metadata(metadata)

        try:
            disease_name = metadata.get('disease_name', {})
            disease_name_kor = disease_name.get('kor', '') if isinstance(disease_name, dict) else str(disease_name)
            intention = metadata.get('intention', '')
            department = metadata.get('department', [])
            department_str = ', '.join(department) if isinstance(department, list) else str(department)

            prompt = f"""다음 의료 정보를 바탕으로 환자가 의사에게 물어볼 법한 자연스러운 질문을 생성해주세요.

질병명: {disease_name_kor}
의도: {intention}
진료과: {department_str}

답변 내용: {answer[:500]}...

요구사항:
1. 한국어로 작성
2. 환자 입장에서 자연스러운 질문
3. 답변 내용과 일치하는 질문
4. 50자 이내로 간결하게
5. 질문만 출력 (부가 설명 없이)"""

            for attempt in range(max_retries):
                try:
                    message = self.client.messages.create(
                        model="MiniMax-M2",
                        max_tokens=200,
                        system="당신은 의료 QA 데이터셋 생성 전문가입니다. 주어진 정보를 바탕으로 환자가 물어볼 법한 자연스러운 질문을 생성해주세요.",
                        messages=[
                            {
                                "role": "user",
                                "content": [{"type": "text", "text": prompt}]
                            }
                        ]
                    )

                    # Extract question from response
                    # Handle different content block types (TextBlock, ThinkingBlock, etc.)
                    question = None

                    # Debug: Log the response structure
                    logger.debug(f"API Response type: {type(message.content)}")
                    logger.debug(f"API Response content length: {len(message.content)}")

                    for idx, content_block in enumerate(message.content):
                        logger.debug(f"Content block {idx}: type={type(content_block)}, has_text={hasattr(content_block, 'text')}")

                        # Skip ThinkingBlock - only process TextBlock
                        block_type = type(content_block).__name__
                        if block_type == 'ThinkingBlock':
                            logger.debug(f"Skipping ThinkingBlock at index {idx}")
                            continue

                        # Try to extract text
                        if hasattr(content_block, 'text'):
                            question = content_block.text.strip()
                            logger.debug(f"Found text in block {idx}: {question[:100]}...")
                            break
                        elif isinstance(content_block, dict) and 'text' in content_block:
                            question = content_block['text'].strip()
                            logger.debug(f"Found text in dict block {idx}: {question[:100]}...")
                            break

                    if not question:
                        raise ValueError(f"No text content found in API response. Content blocks: {[type(b).__name__ for b in message.content]}")

                    # Remove common prefixes
                    prefixes_to_remove = ['질문:', '질문 :', 'Q:', 'Q :', '환자:', '환자 :']
                    for prefix in prefixes_to_remove:
                        if question.startswith(prefix):
                            question = question[len(prefix):].strip()

                    if question:
                        return question
                    else:
                        logger.warning(f"Empty question generated, attempt {attempt + 1}")
                        if attempt < max_retries - 1:
                            continue
                        else:
                            return self._generate_question_from_metadata(metadata)

                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"Question generation attempt {attempt + 1} failed: {str(e)}, retrying...")
                        continue
                    else:
                        logger.error(f"Failed to generate question after {max_retries} attempts: {str(e)}")
                        return self._generate_question_from_metadata(metadata)

        except Exception as e:
            logger.error(f"Error in question generation: {str(e)}")
            return self._generate_question_from_metadata(metadata)

    def _generate_question_from_metadata(self, metadata: Dict) -> str:
        """
        Generate a simple question from metadata (template-based method)

        Args:
            metadata: Dictionary containing disease_name, intention

        Returns:
            Generated question string
        """
        disease_name = metadata.get('disease_name', {})
        disease_name_kor = disease_name.get('kor', '질환') if isinstance(disease_name, dict) else str(disease_name)
        intention = metadata.get('intention', '정보')

        # Expanded template-based question generation with multiple variations
        templates = {
            '검진': [
                f"{disease_name_kor} 검진은 어떻게 받나요?",
                f"{disease_name_kor}의 검진 방법에 대해 알려주세요",
                f"{disease_name_kor} 검사는 어떻게 진행되나요?",
            ],
            '진단': [
                f"{disease_name_kor}는 어떻게 진단하나요?",
                f"{disease_name_kor} 진단 방법이 궁금합니다",
                f"{disease_name_kor}를 어떻게 확인할 수 있나요?",
            ],
            '치료': [
                f"{disease_name_kor}의 치료 방법은 무엇인가요?",
                f"{disease_name_kor}는 어떻게 치료하나요?",
                f"{disease_name_kor} 치료에 대해 알려주세요",
            ],
            '증상': [
                f"{disease_name_kor}의 증상은 무엇인가요?",
                f"{disease_name_kor}가 있으면 어떤 증상이 나타나나요?",
                f"{disease_name_kor}는 어떤 증상을 보이나요?",
            ],
            '예방': [
                f"{disease_name_kor}를 예방하려면 어떻게 해야 하나요?",
                f"{disease_name_kor} 예방법을 알려주세요",
                f"{disease_name_kor}를 막으려면 무엇을 해야 하나요?",
            ],
            '원인': [
                f"{disease_name_kor}의 원인은 무엇인가요?",
                f"{disease_name_kor}는 왜 생기나요?",
                f"{disease_name_kor}가 발생하는 이유가 궁금합니다",
            ],
            '합병증': [
                f"{disease_name_kor}의 합병증은 무엇인가요?",
                f"{disease_name_kor}가 있으면 어떤 합병증이 생기나요?",
                f"{disease_name_kor} 합병증에 대해 알려주세요",
            ],
            '관리': [
                f"{disease_name_kor}는 어떻게 관리하나요?",
                f"{disease_name_kor} 관리 방법을 알려주세요",
                f"{disease_name_kor}가 있을 때 주의사항은 무엇인가요?",
            ],
        }

        # Use hash of disease name to consistently select a variation
        if intention in templates:
            variations = templates[intention]
            # Use simple hash to select variation consistently for same disease
            index = hash(disease_name_kor) % len(variations)
            return variations[index]

        # Default fallback
        return f"{disease_name_kor}에 대해 알려주세요."

    def load(self, limit: Optional[int] = None) -> List[Dict]:
        """
        Load all QA pairs from dataset 120

        Args:
            limit: Optional limit on number of files to process (for testing)

        Returns:
            List of dictionaries with raw QA data
            Format: {fileName, disease_category, disease_name, department, intention,
                    answer, question (generated), source_file}
        """
        json_files = self._find_json_files()

        if limit:
            json_files = json_files[:limit]
            logger.info(f"Processing limited to {limit} files")

        qa_pairs = []

        for idx, json_file in enumerate(json_files):
            if idx % 100 == 0:
                logger.info(f"Processing file {idx + 1}/{len(json_files)}")

            data = self._load_single_file(json_file)

            if data is None:
                continue

            # Combine answer parts
            if 'answer' in data and isinstance(data['answer'], dict):
                combined_answer = self._combine_answer(data['answer'])
                data['answer_combined'] = combined_answer

                # Generate question
                metadata = {
                    'disease_name': data.get('disease_name'),
                    'intention': data.get('intention'),
                    'department': data.get('department'),
                }
                data['question'] = self._generate_question_with_ai(metadata, combined_answer)

            # Add source file information
            data['source_file'] = str(json_file.relative_to(self.base_path))
            data['dataset'] = self.dataset_name

            # Validate required fields
            if 'fileName' in data and 'question' in data and 'answer_combined' in data:
                qa_pairs.append(data)
            else:
                logger.warning(f"Missing required fields in {json_file}")

        logger.info(f"Loaded {len(qa_pairs)} QA pairs from dataset 120")
        return qa_pairs

    def get_statistics(self, qa_pairs: List[Dict]) -> Dict:
        """
        Get statistics about the loaded data

        Args:
            qa_pairs: List of QA pairs

        Returns:
            Dictionary containing statistics
        """
        stats = {
            'total_pairs': len(qa_pairs),
            'by_disease_category': {},
            'by_intention': {},
            'by_department': {},
            'avg_question_length': 0,
            'avg_answer_length': 0,
        }

        if not qa_pairs:
            return stats

        # Count by disease_category, intention, department
        for qa in qa_pairs:
            disease_category = qa.get('disease_category', 'unknown')
            intention = qa.get('intention', 'unknown')
            departments = qa.get('department', [])

            stats['by_disease_category'][disease_category] = stats['by_disease_category'].get(disease_category, 0) + 1
            stats['by_intention'][intention] = stats['by_intention'].get(intention, 0) + 1

            if isinstance(departments, list):
                for dept in departments:
                    stats['by_department'][dept] = stats['by_department'].get(dept, 0) + 1

        # Calculate average lengths
        total_q_len = sum(len(qa.get('question', '')) for qa in qa_pairs)
        total_a_len = sum(len(qa.get('answer_combined', '')) for qa in qa_pairs)

        stats['avg_question_length'] = total_q_len / len(qa_pairs)
        stats['avg_answer_length'] = total_a_len / len(qa_pairs)

        return stats


def load_dataset_120(base_path: str, use_ai_generation: bool = True, limit: Optional[int] = None) -> List[Dict]:
    """
    Convenience function to load dataset 120

    Args:
        base_path: Base path to the dataset 120 directory
        use_ai_generation: Whether to use AI to generate questions
        limit: Optional limit on number of files to process

    Returns:
        List of QA pairs
    """
    loader = Dataset120Loader(base_path, use_ai_generation)
    return loader.load(limit)


if __name__ == '__main__':
    # Test the loader
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    base_path = "data/ai_hub/120.초거대AI 사전학습용 헬스케어 질의응답 데이터"
    # Use template-based generation (AI generation disabled by default)
    loader = Dataset120Loader(base_path, use_ai_generation=False)

    # Test with limited files
    qa_pairs = loader.load(limit=10)

    print(f"\nLoaded {len(qa_pairs)} QA pairs")

    # Print statistics
    stats = loader.get_statistics(qa_pairs)
    print("\nStatistics:")
    print(json.dumps(stats, indent=2, ensure_ascii=False))

    # Print sample
    if qa_pairs:
        print("\nSample QA pair:")
        sample = {
            'fileName': qa_pairs[0].get('fileName'),
            'disease_name': qa_pairs[0].get('disease_name'),
            'intention': qa_pairs[0].get('intention'),
            'question': qa_pairs[0].get('question'),
            'answer': qa_pairs[0].get('answer_combined')[:200] + '...'
        }
        print(json.dumps(sample, indent=2, ensure_ascii=False))
