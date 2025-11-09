#!/usr/bin/env python3
"""
QA Validator
Validates QA pairs for quality and completeness
"""

import logging
import re
from typing import Dict, List, Tuple, Optional

logger = logging.getLogger(__name__)


class QAValidator:
    """
    Validates QA pairs for quality and completeness
    """

    def __init__(
        self,
        min_question_length: int = 10,
        max_question_length: int = 1000,
        min_answer_length: int = 10,
        max_answer_length: int = 5000,
    ):
        """
        Initialize the QA validator

        Args:
            min_question_length: Minimum question length in characters
            max_question_length: Maximum question length in characters
            min_answer_length: Minimum answer length in characters
            max_answer_length: Maximum answer length in characters
        """
        self.min_question_length = min_question_length
        self.max_question_length = max_question_length
        self.min_answer_length = min_answer_length
        self.max_answer_length = max_answer_length

    def validate_qa_pair(self, qa_pair: Dict) -> Tuple[bool, List[str]]:
        """
        Validate a single QA pair

        Args:
            qa_pair: Dictionary containing QA data

        Returns:
            Tuple of (is_valid, list of error messages)
        """
        errors = []

        # Check required fields
        required_fields = ['id', 'question', 'answer', 'category', 'source_dataset']
        for field in required_fields:
            if field not in qa_pair:
                errors.append(f"Missing required field: {field}")
            elif not qa_pair[field]:
                errors.append(f"Empty required field: {field}")

        if errors:
            return False, errors

        # Validate question
        question = qa_pair['question']
        question_errors = self._validate_text(
            question,
            'question',
            self.min_question_length,
            self.max_question_length
        )
        errors.extend(question_errors)

        # Validate answer
        answer = qa_pair['answer']
        answer_errors = self._validate_text(
            answer,
            'answer',
            self.min_answer_length,
            self.max_answer_length
        )
        errors.extend(answer_errors)

        # Validate ID format
        if not self._validate_id(qa_pair['id']):
            errors.append(f"Invalid ID format: {qa_pair['id']}")

        # Validate category
        if not self._validate_category(qa_pair['category']):
            errors.append(f"Invalid category: {qa_pair['category']}")

        # Check for quality issues
        quality_issues = self._check_quality_issues(qa_pair)
        errors.extend(quality_issues)

        is_valid = len(errors) == 0
        return is_valid, errors

    def _validate_text(
        self,
        text: str,
        field_name: str,
        min_length: int,
        max_length: int
    ) -> List[str]:
        """
        Validate text field

        Args:
            text: Text to validate
            field_name: Name of the field
            min_length: Minimum length
            max_length: Maximum length

        Returns:
            List of error messages
        """
        errors = []

        if not isinstance(text, str):
            errors.append(f"{field_name} must be a string")
            return errors

        # Check length
        text_length = len(text.strip())
        if text_length < min_length:
            errors.append(f"{field_name} too short: {text_length} < {min_length}")
        if text_length > max_length:
            errors.append(f"{field_name} too long: {text_length} > {max_length}")

        # Check for empty or whitespace-only content
        if not text.strip():
            errors.append(f"{field_name} is empty or whitespace-only")

        return errors

    def _validate_id(self, id_value: str) -> bool:
        """
        Validate ID format

        Args:
            id_value: ID to validate

        Returns:
            True if valid, False otherwise
        """
        if not isinstance(id_value, str):
            return False

        # Should not be empty
        if not id_value.strip():
            return False

        # Should have reasonable length
        if len(id_value) > 100:
            return False

        return True

    def _validate_category(self, category: str) -> bool:
        """
        Validate category

        Args:
            category: Category to validate

        Returns:
            True if valid, False otherwise
        """
        if not isinstance(category, str):
            return False

        # Should not be empty
        if not category.strip():
            return False

        # Should have reasonable length
        if len(category) > 50 or len(category) < 2:
            return False

        return True

    def _check_quality_issues(self, qa_pair: Dict) -> List[str]:
        """
        Check for quality issues in QA pair

        Args:
            qa_pair: QA pair dictionary

        Returns:
            List of quality issue messages
        """
        issues = []

        question = qa_pair.get('question', '')
        answer = qa_pair.get('answer', '')

        # Check for repetitive content
        if self._is_repetitive(question):
            issues.append("Question contains repetitive content")
        if self._is_repetitive(answer):
            issues.append("Answer contains repetitive content")

        # Check for placeholder text
        placeholders = ['TODO', 'TBD', 'XXX', '???', '...', 'test', 'example']
        for placeholder in placeholders:
            if placeholder.lower() in question.lower():
                issues.append(f"Question contains placeholder: {placeholder}")
            if placeholder.lower() in answer.lower():
                issues.append(f"Answer contains placeholder: {placeholder}")

        # Check if question and answer are too similar
        if self._are_too_similar(question, answer):
            issues.append("Question and answer are too similar")

        # Check for proper Korean/English characters
        if not self._has_valid_characters(question):
            issues.append("Question contains invalid characters")
        if not self._has_valid_characters(answer):
            issues.append("Answer contains invalid characters")

        return issues

    def _is_repetitive(self, text: str, threshold: float = 0.5) -> bool:
        """
        Check if text is repetitive

        Args:
            text: Text to check
            threshold: Ratio threshold for repetition

        Returns:
            True if repetitive, False otherwise
        """
        if len(text) < 50:
            return False

        # Check for repeated words
        words = text.split()
        if len(words) < 5:
            return False

        unique_words = set(words)
        repetition_ratio = 1 - (len(unique_words) / len(words))

        return repetition_ratio > threshold

    def _are_too_similar(self, text1: str, text2: str, threshold: float = 0.8) -> bool:
        """
        Check if two texts are too similar

        Args:
            text1: First text
            text2: Second text
            threshold: Similarity threshold

        Returns:
            True if too similar, False otherwise
        """
        # Simple word-based similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())

        if not words1 or not words2:
            return False

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        similarity = len(intersection) / len(union)

        return similarity > threshold

    def _has_valid_characters(self, text: str) -> bool:
        """
        Check if text has valid characters

        Args:
            text: Text to check

        Returns:
            True if valid, False otherwise
        """
        # Should contain at least some Korean or English characters
        korean_pattern = re.compile(r'[\uac00-\ud7a3]')
        english_pattern = re.compile(r'[a-zA-Z]')

        has_korean = bool(korean_pattern.search(text))
        has_english = bool(english_pattern.search(text))

        return has_korean or has_english

    def validate_batch(self, qa_pairs: List[Dict]) -> Tuple[List[Dict], List[Tuple[Dict, List[str]]]]:
        """
        Validate a batch of QA pairs

        Args:
            qa_pairs: List of QA pair dictionaries

        Returns:
            Tuple of (valid QA pairs, list of (invalid QA pair, error messages))
        """
        valid_pairs = []
        invalid_pairs = []

        for idx, qa_pair in enumerate(qa_pairs):
            if idx % 1000 == 0 and idx > 0:
                logger.info(f"Validated {idx}/{len(qa_pairs)} QA pairs")

            is_valid, errors = self.validate_qa_pair(qa_pair)

            if is_valid:
                valid_pairs.append(qa_pair)
            else:
                invalid_pairs.append((qa_pair, errors))

        logger.info(f"Validation complete: {len(valid_pairs)} valid, {len(invalid_pairs)} invalid")

        return valid_pairs, invalid_pairs

    def generate_validation_report(
        self,
        valid_pairs: List[Dict],
        invalid_pairs: List[Tuple[Dict, List[str]]]
    ) -> Dict:
        """
        Generate validation report

        Args:
            valid_pairs: List of valid QA pairs
            invalid_pairs: List of (invalid QA pair, error messages)

        Returns:
            Dictionary containing validation statistics
        """
        total_pairs = len(valid_pairs) + len(invalid_pairs)

        # Count error types
        error_type_counts = {}
        for _, errors in invalid_pairs:
            for error in errors:
                # Extract error type (first part before colon)
                error_type = error.split(':')[0] if ':' in error else error
                error_type_counts[error_type] = error_type_counts.get(error_type, 0) + 1

        report = {
            'total_pairs': total_pairs,
            'valid_pairs': len(valid_pairs),
            'invalid_pairs': len(invalid_pairs),
            'validation_rate': len(valid_pairs) / total_pairs if total_pairs > 0 else 0,
            'error_type_counts': error_type_counts,
            'sample_invalid_pairs': [
                {
                    'id': qa_pair.get('id', 'unknown'),
                    'errors': errors
                }
                for qa_pair, errors in invalid_pairs[:10]
            ]
        }

        return report


def validate_qa_dataset(qa_pairs: List[Dict]) -> Tuple[List[Dict], Dict]:
    """
    Convenience function to validate QA dataset

    Args:
        qa_pairs: List of QA pair dictionaries

    Returns:
        Tuple of (valid QA pairs, validation report)
    """
    validator = QAValidator()
    valid_pairs, invalid_pairs = validator.validate_batch(qa_pairs)
    report = validator.generate_validation_report(valid_pairs, invalid_pairs)

    return valid_pairs, report


if __name__ == '__main__':
    # Test the validator
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Test valid QA pair
    test_qa_valid = {
        'id': 'test_001',
        'question': '투석 환자의 식이요법에서 주의해야 할 점은 무엇인가요?',
        'answer': '투석 환자는 칼륨, 인, 나트륨 섭취를 제한해야 하며, 적절한 단백질 섭취가 중요합니다. 또한 수분 섭취량도 조절해야 합니다.',
        'category': '신장내과',
        'subcategory': '투석',
        'source_dataset': 'test_dataset',
        'metadata': {}
    }

    # Test invalid QA pair
    test_qa_invalid = {
        'id': '',
        'question': 'test',
        'answer': 'TBD',
        'category': '',
        'source_dataset': 'test_dataset',
    }

    validator = QAValidator()

    print("\nValidating valid QA pair:")
    is_valid, errors = validator.validate_qa_pair(test_qa_valid)
    print(f"Valid: {is_valid}, Errors: {errors}")

    print("\nValidating invalid QA pair:")
    is_valid, errors = validator.validate_qa_pair(test_qa_invalid)
    print(f"Valid: {is_valid}, Errors: {errors}")

    # Test batch validation
    test_batch = [test_qa_valid, test_qa_invalid]
    valid_pairs, invalid_pairs = validator.validate_batch(test_batch)

    print(f"\nBatch validation: {len(valid_pairs)} valid, {len(invalid_pairs)} invalid")

    # Generate report
    report = validator.generate_validation_report(valid_pairs, invalid_pairs)
    print("\nValidation report:")
    import json
    print(json.dumps(report, indent=2, ensure_ascii=False))
