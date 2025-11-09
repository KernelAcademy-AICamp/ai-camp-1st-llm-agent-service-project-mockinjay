#!/usr/bin/env python3
"""
Dataset 9 Loader - 필수의료 의학지식 데이터
Loads essential medical knowledge QA pairs from AI Hub dataset 9
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class Dataset9Loader:
    """
    Loader for AI Hub Dataset 9 - 필수의료 의학지식 데이터

    Format: {qa_id, domain, q_type, question, answer}
    """

    def __init__(self, base_path: str):
        """
        Initialize the Dataset 9 loader

        Args:
            base_path: Base path to the dataset 9 directory
        """
        self.base_path = Path(base_path)
        self.dataset_name = "dataset_9_essential_medical"

        # Define paths to search for JSON files
        self.data_paths = [
            self.base_path / "3.개방데이터" / "1.데이터" / "Training" / "02.라벨링데이터",
            self.base_path / "3.개방데이터" / "1.데이터" / "Validation" / "02.라벨링데이터",
        ]

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

        logger.info(f"Found {len(json_files)} JSON files in dataset 9")
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
                # Remove BOM if present
                content = f.read()
                if content.startswith('\ufeff'):
                    content = content[1:]
                data = json.loads(content)
            return data
        except Exception as e:
            logger.error(f"Failed to load {file_path}: {str(e)}")
            return None

    def load(self) -> List[Dict]:
        """
        Load all QA pairs from dataset 9

        Returns:
            List of dictionaries with raw QA data
            Format: {qa_id, domain, q_type, question, answer, source_file}
        """
        json_files = self._find_json_files()
        qa_pairs = []

        for json_file in json_files:
            data = self._load_single_file(json_file)

            if data is None:
                continue

            # Add source file information
            data['source_file'] = str(json_file.relative_to(self.base_path))
            data['dataset'] = self.dataset_name

            # Validate required fields
            if all(key in data for key in ['qa_id', 'question', 'answer']):
                qa_pairs.append(data)
            else:
                logger.warning(f"Missing required fields in {json_file}")

        logger.info(f"Loaded {len(qa_pairs)} QA pairs from dataset 9")
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
            'by_domain': {},
            'by_q_type': {},
            'avg_question_length': 0,
            'avg_answer_length': 0,
        }

        if not qa_pairs:
            return stats

        # Count by domain and q_type
        for qa in qa_pairs:
            domain = qa.get('domain', 'unknown')
            q_type = qa.get('q_type', 'unknown')

            stats['by_domain'][domain] = stats['by_domain'].get(domain, 0) + 1
            stats['by_q_type'][q_type] = stats['by_q_type'].get(q_type, 0) + 1

        # Calculate average lengths
        total_q_len = sum(len(qa.get('question', '')) for qa in qa_pairs)
        total_a_len = sum(len(qa.get('answer', '')) for qa in qa_pairs)

        stats['avg_question_length'] = total_q_len / len(qa_pairs)
        stats['avg_answer_length'] = total_a_len / len(qa_pairs)

        return stats


def load_dataset_9(base_path: str) -> List[Dict]:
    """
    Convenience function to load dataset 9

    Args:
        base_path: Base path to the dataset 9 directory

    Returns:
        List of QA pairs
    """
    loader = Dataset9Loader(base_path)
    return loader.load()


if __name__ == '__main__':
    # Test the loader
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    base_path = "data/ai_hub/09.필수의료 의학지식 데이터"
    loader = Dataset9Loader(base_path)
    qa_pairs = loader.load()

    print(f"\nLoaded {len(qa_pairs)} QA pairs")

    # Print statistics
    stats = loader.get_statistics(qa_pairs)
    print("\nStatistics:")
    print(json.dumps(stats, indent=2, ensure_ascii=False))

    # Print sample
    if qa_pairs:
        print("\nSample QA pair:")
        print(json.dumps(qa_pairs[0], indent=2, ensure_ascii=False))
