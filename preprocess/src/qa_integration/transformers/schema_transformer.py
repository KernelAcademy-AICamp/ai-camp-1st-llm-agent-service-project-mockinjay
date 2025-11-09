#!/usr/bin/env python3
"""
Schema Transformer
Transforms different dataset formats to a unified schema
"""

import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class SchemaTransformer:
    """
    Transforms various QA dataset formats into a unified schema

    Unified Format:
    {
        'id': str,
        'question': str,
        'answer': str,
        'category': str,
        'subcategory': str,
        'source_dataset': str,
        'metadata': dict
    }
    """

    def __init__(self):
        """Initialize the schema transformer"""
        self.domain_mapping = self._load_domain_mapping()
        self.q_type_mapping = self._load_q_type_mapping()
        self.intention_mapping = self._load_intention_mapping()

    def _load_domain_mapping(self) -> Dict[int, str]:
        """
        Map domain codes to human-readable names

        Returns:
            Dictionary mapping domain codes to names
        """
        # This is a placeholder - adjust based on actual domain codes
        return {
            1: '내과',
            2: '외과',
            3: '소아청소년과',
            4: '산부인과',
            5: '정형외과',
            6: '신경과',
            7: '정신건강의학과',
            8: '안과',
            9: '이비인후과',
            10: '병리과',
            11: '영상의학과',
            12: '재활의학과',
            13: '마취통증의학과',
            14: '응급의학과',
            15: '가정의학과',
            # Add more as needed
        }

    def _load_q_type_mapping(self) -> Dict[int, str]:
        """
        Map question type codes to human-readable names

        Returns:
            Dictionary mapping q_type codes to names
        """
        return {
            1: '선택형',
            2: '단답형',
            3: '서술형',
            4: '계산형',
            # Add more as needed
        }

    def _load_intention_mapping(self) -> Dict[str, str]:
        """
        Map intention keywords to standardized categories

        Returns:
            Dictionary mapping intention to standardized category
        """
        return {
            '검진': '검진/진단',
            '진단': '검진/진단',
            '치료': '치료',
            '증상': '증상',
            '예방': '예방',
            '원인': '원인/병인',
            '관리': '질병관리',
            '식이': '식이요법',
            '약물': '약물치료',
            '수술': '수술/시술',
            '검사': '검사/검진',
            '합병증': '합병증',
        }

    def transform_dataset_8(self, raw_data: Dict) -> Dict:
        """
        Transform dataset 8 format to unified schema

        Args:
            raw_data: Raw data from dataset 8

        Returns:
            Unified format dictionary
        """
        qa_id = raw_data.get('qa_id', '')
        domain_code = raw_data.get('domain', 0)
        q_type_code = raw_data.get('q_type', 0)

        # Map domain and q_type
        domain = self.domain_mapping.get(domain_code, f'domain_{domain_code}')
        q_type = self.q_type_mapping.get(q_type_code, f'q_type_{q_type_code}')

        return {
            'id': f"ds8_{qa_id}",
            'question': raw_data.get('question', ''),
            'answer': raw_data.get('answer', ''),
            'category': domain,
            'subcategory': q_type,
            'source_dataset': 'dataset_8_professional_medical',
            'metadata': {
                'domain_code': domain_code,
                'q_type_code': q_type_code,
                'source_file': raw_data.get('source_file', ''),
            }
        }

    def transform_dataset_9(self, raw_data: Dict) -> Dict:
        """
        Transform dataset 9 format to unified schema

        Args:
            raw_data: Raw data from dataset 9

        Returns:
            Unified format dictionary
        """
        qa_id = raw_data.get('qa_id', '')
        domain_code = raw_data.get('domain', 0)
        q_type_code = raw_data.get('q_type', 0)

        # Map domain and q_type
        domain = self.domain_mapping.get(domain_code, f'domain_{domain_code}')
        q_type = self.q_type_mapping.get(q_type_code, f'q_type_{q_type_code}')

        return {
            'id': f"ds9_{qa_id}",
            'question': raw_data.get('question', ''),
            'answer': raw_data.get('answer', ''),
            'category': domain,
            'subcategory': q_type,
            'source_dataset': 'dataset_9_essential_medical',
            'metadata': {
                'domain_code': domain_code,
                'q_type_code': q_type_code,
                'source_file': raw_data.get('source_file', ''),
            }
        }

    def transform_dataset_120(self, raw_data: Dict) -> Dict:
        """
        Transform dataset 120 format to unified schema

        Args:
            raw_data: Raw data from dataset 120

        Returns:
            Unified format dictionary
        """
        file_name = raw_data.get('fileName', '')
        disease_name = raw_data.get('disease_name', {})
        disease_category = raw_data.get('disease_category', '')
        intention = raw_data.get('intention', '')
        department = raw_data.get('department', [])

        # Extract Korean disease name
        if isinstance(disease_name, dict):
            disease_name_kor = disease_name.get('kor', '')
        else:
            disease_name_kor = str(disease_name)

        # Map intention to standardized category
        category = self.intention_mapping.get(intention, intention)

        # Use disease_category as subcategory
        subcategory = disease_category if disease_category else disease_name_kor

        return {
            'id': f"ds120_{file_name}",
            'question': raw_data.get('question', ''),
            'answer': raw_data.get('answer_combined', ''),
            'category': category,
            'subcategory': subcategory,
            'source_dataset': 'dataset_120_healthcare_qa',
            'metadata': {
                'disease_name': disease_name,
                'disease_category': disease_category,
                'intention': intention,
                'department': department,
                'source_file': raw_data.get('source_file', ''),
                'num_of_words': raw_data.get('num_of_words', 0),
            }
        }

    def transform(self, raw_data: Dict, dataset_type: str) -> Optional[Dict]:
        """
        Transform raw data based on dataset type

        Args:
            raw_data: Raw data dictionary
            dataset_type: Type of dataset ('dataset_8', 'dataset_9', 'dataset_120')

        Returns:
            Unified format dictionary, or None if transformation fails
        """
        try:
            if dataset_type == 'dataset_8' or raw_data.get('dataset') == 'dataset_8_professional_medical':
                return self.transform_dataset_8(raw_data)
            elif dataset_type == 'dataset_9' or raw_data.get('dataset') == 'dataset_9_essential_medical':
                return self.transform_dataset_9(raw_data)
            elif dataset_type == 'dataset_120' or raw_data.get('dataset') == 'dataset_120_healthcare_qa':
                return self.transform_dataset_120(raw_data)
            else:
                logger.error(f"Unknown dataset type: {dataset_type}")
                return None
        except Exception as e:
            logger.error(f"Failed to transform data: {str(e)}")
            return None

    def transform_batch(self, raw_data_list: List[Dict], dataset_type: str) -> List[Dict]:
        """
        Transform a batch of raw data

        Args:
            raw_data_list: List of raw data dictionaries
            dataset_type: Type of dataset

        Returns:
            List of unified format dictionaries
        """
        transformed = []
        failed_count = 0

        for raw_data in raw_data_list:
            result = self.transform(raw_data, dataset_type)
            if result:
                transformed.append(result)
            else:
                failed_count += 1

        if failed_count > 0:
            logger.warning(f"Failed to transform {failed_count} items")

        logger.info(f"Successfully transformed {len(transformed)} items")
        return transformed


def transform_to_unified_format(raw_data_list: List[Dict], dataset_type: str) -> List[Dict]:
    """
    Convenience function to transform data to unified format

    Args:
        raw_data_list: List of raw data dictionaries
        dataset_type: Type of dataset

    Returns:
        List of unified format dictionaries
    """
    transformer = SchemaTransformer()
    return transformer.transform_batch(raw_data_list, dataset_type)


if __name__ == '__main__':
    # Test the transformer
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Test dataset 8 transformation
    test_data_8 = {
        'qa_id': 12345,
        'domain': 10,
        'q_type': 3,
        'question': '테스트 질문',
        'answer': '테스트 답변',
        'source_file': 'test.json',
        'dataset': 'dataset_8_professional_medical'
    }

    transformer = SchemaTransformer()
    result = transformer.transform(test_data_8, 'dataset_8')

    print("\nDataset 8 transformation test:")
    import json
    print(json.dumps(result, indent=2, ensure_ascii=False))

    # Test dataset 120 transformation
    test_data_120 = {
        'fileName': 'HC-A-12345',
        'disease_name': {'kor': '대사증후군', 'eng': 'Metabolic syndrome'},
        'disease_category': '기타',
        'intention': '검진',
        'department': ['가정의학과'],
        'question': '대사증후군 검진은 어떻게 하나요?',
        'answer_combined': '대사증후군 검진은 혈압, 혈당, 중성지방 등을 측정합니다.',
        'source_file': 'test.json',
        'dataset': 'dataset_120_healthcare_qa'
    }

    result_120 = transformer.transform(test_data_120, 'dataset_120')

    print("\nDataset 120 transformation test:")
    print(json.dumps(result_120, indent=2, ensure_ascii=False))
