#!/usr/bin/env python3
"""
AI Hub QA Datasets Integration Script
Integrates datasets 8, 9, and 120 into a unified format
"""

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import pandas as pd

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.qa_integration.loaders.dataset_8_loader import Dataset8Loader
from src.qa_integration.loaders.dataset_9_loader import Dataset9Loader
from src.qa_integration.loaders.dataset_120_loader import Dataset120Loader
from src.qa_integration.transformers.schema_transformer import SchemaTransformer
from src.qa_integration.transformers.category_curator import CategoryCurator
from src.qa_integration.validators.qa_validator import QAValidator


class AIHubDatasetIntegrator:
    """
    Main integrator for AI Hub QA datasets
    """

    def __init__(
        self,
        base_data_path: str = "/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/raw/ai-hub",
        output_path: str = "/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/qa_unified_ai_hub",
        use_ai_curation: bool = True,
        validate_output: bool = True,
        limit_dataset_120: Optional[int] = None
    ):
        """
        Initialize the integrator

        Args:
            base_data_path: Base path to AI Hub datasets
            output_path: Path to output directory
            use_ai_curation: Whether to use AI for category curation
            validate_output: Whether to validate output
            limit_dataset_120: Limit for dataset 120 (for testing)
        """
        self.base_data_path = Path(base_data_path)
        self.output_path = Path(output_path)
        self.use_ai_curation = use_ai_curation
        self.validate_output = validate_output
        self.limit_dataset_120 = limit_dataset_120

        # Create output directory
        self.output_path.mkdir(parents=True, exist_ok=True)

        # Initialize components
        self.transformer = SchemaTransformer()
        self.curator = CategoryCurator() if use_ai_curation else None
        self.validator = QAValidator() if validate_output else None

        # Setup logging
        self._setup_logging()

    def _setup_logging(self):
        """Setup logging configuration"""
        log_dir = self.output_path / "logs"
        log_dir.mkdir(exist_ok=True)

        # log_file = log_dir / f"integration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                # logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )

        self.logger = logging.getLogger(__name__)
        # self.logger.info(f"Logging initialized: {log_file}")

    def load_datasets(self) -> Dict[str, List[Dict]]:
        """
        Load all datasets

        Returns:
            Dictionary mapping dataset names to raw data lists
        """
        self.logger.info("=" * 80)
        self.logger.info("LOADING DATASETS")
        self.logger.info("=" * 80)

        raw_datasets = {}

        # Load Dataset 8
        try:
            self.logger.info("\nLoading Dataset 8 (전문 의학지식)...")
            dataset_8_path = self.base_data_path / "08.전문 의학지식 데이터"
            loader_8 = Dataset8Loader(str(dataset_8_path))
            raw_datasets['dataset_8'] = loader_8.load()
            self.logger.info(f"✓ Dataset 8: {len(raw_datasets['dataset_8'])} QA pairs loaded")
        except Exception as e:
            self.logger.error(f"✗ Failed to load Dataset 8: {str(e)}")
            raw_datasets['dataset_8'] = []

        # Load Dataset 9
        try:
            self.logger.info("\nLoading Dataset 9 (필수의료 의학지식)...")
            dataset_9_path = self.base_data_path / "09.필수의료 의학지식 데이터"
            loader_9 = Dataset9Loader(str(dataset_9_path))
            raw_datasets['dataset_9'] = loader_9.load()
            self.logger.info(f"✓ Dataset 9: {len(raw_datasets['dataset_9'])} QA pairs loaded")
        except Exception as e:
            self.logger.error(f"✗ Failed to load Dataset 9: {str(e)}")
            raw_datasets['dataset_9'] = []

        # Load Dataset 120
        try:
            self.logger.info("\nLoading Dataset 120 (헬스케어 질의응답)...")
            dataset_120_path = self.base_data_path / "120.초거대AI 사전학습용 헬스케어 질의응답 데이터"
            # Use template-based question generation (AI generation disabled due to API issues)
            loader_120 = Dataset120Loader(str(dataset_120_path), use_ai_generation=False)
            raw_datasets['dataset_120'] = loader_120.load(limit=self.limit_dataset_120)
            self.logger.info(f"✓ Dataset 120: {len(raw_datasets['dataset_120'])} QA pairs loaded")
        except Exception as e:
            self.logger.error(f"✗ Failed to load Dataset 120: {str(e)}")
            raw_datasets['dataset_120'] = []

        total_loaded = sum(len(data) for data in raw_datasets.values())
        self.logger.info(f"\n{'=' * 80}")
        self.logger.info(f"TOTAL LOADED: {total_loaded} QA pairs")
        self.logger.info(f"{'=' * 80}")

        return raw_datasets

    def transform_datasets(self, raw_datasets: Dict[str, List[Dict]]) -> List[Dict]:
        """
        Transform all datasets to unified format

        Args:
            raw_datasets: Dictionary of raw datasets

        Returns:
            List of unified QA pairs
        """
        self.logger.info("\n" + "=" * 80)
        self.logger.info("TRANSFORMING DATASETS")
        self.logger.info("=" * 80)

        unified_qa_pairs = []

        for dataset_name, raw_data in raw_datasets.items():
            if not raw_data:
                continue

            self.logger.info(f"\nTransforming {dataset_name}...")
            transformed = self.transformer.transform_batch(raw_data, dataset_name)
            unified_qa_pairs.extend(transformed)
            self.logger.info(f"✓ Transformed {len(transformed)} QA pairs from {dataset_name}")

        self.logger.info(f"\n{'=' * 80}")
        self.logger.info(f"TOTAL TRANSFORMED: {len(unified_qa_pairs)} QA pairs")
        self.logger.info(f"{'=' * 80}")

        return unified_qa_pairs

    def curate_categories(self, qa_pairs: List[Dict]) -> List[Dict]:
        """
        Curate categories using AI (optional)

        Args:
            qa_pairs: List of unified QA pairs

        Returns:
            List of QA pairs with curated categories
        """
        if not self.use_ai_curation or not self.curator:
            self.logger.info("\nSkipping AI category curation")
            return qa_pairs

        self.logger.info("\n" + "=" * 80)
        self.logger.info("CURATING CATEGORIES")
        self.logger.info("=" * 80)

        # Curate categories
        curated_pairs = self.curator.curate_batch(qa_pairs, force_recurate=False)

        self.logger.info(f"\n{'=' * 80}")
        self.logger.info(f"CATEGORIES CURATED: {len(curated_pairs)} QA pairs")
        self.logger.info(f"{'=' * 80}")

        return curated_pairs

    def validate_datasets(self, qa_pairs: List[Dict]) -> tuple[List[Dict], Dict]:
        """
        Validate QA pairs

        Args:
            qa_pairs: List of unified QA pairs

        Returns:
            Tuple of (valid QA pairs, validation report)
        """
        if not self.validate_output or not self.validator:
            self.logger.info("\nSkipping validation")
            return qa_pairs, {}

        self.logger.info("\n" + "=" * 80)
        self.logger.info("VALIDATING QA PAIRS")
        self.logger.info("=" * 80)

        valid_pairs, invalid_pairs = self.validator.validate_batch(qa_pairs)
        report = self.validator.generate_validation_report(valid_pairs, invalid_pairs)

        self.logger.info(f"\n{'=' * 80}")
        self.logger.info(f"VALIDATION COMPLETE")
        self.logger.info(f"Valid: {len(valid_pairs)}, Invalid: {len(invalid_pairs)}")
        self.logger.info(f"Validation Rate: {report['validation_rate']:.2%}")
        self.logger.info(f"{'=' * 80}")

        return valid_pairs, report

    def save_outputs(
        self,
        qa_pairs: List[Dict],
        validation_report: Optional[Dict] = None
    ):
        """
        Save outputs to files

        Args:
            qa_pairs: List of unified QA pairs
            validation_report: Optional validation report
        """
        self.logger.info("\n" + "=" * 80)
        self.logger.info("SAVING OUTPUTS")
        self.logger.info("=" * 80)

        # Save main JSONL file
        output_file = self.output_path / "qa_dataset_unified.jsonl"
        self._save_jsonl(qa_pairs, output_file)
        self.logger.info(f"✓ Saved {len(qa_pairs)} QA pairs to {output_file}")

        # Save CSV file
        csv_file = self.output_path / "qa_dataset_unified.csv"
        self._save_csv(qa_pairs, csv_file)
        self.logger.info(f"✓ Saved CSV to {csv_file}")

        # Save by source dataset
        by_source_dir = self.output_path / "by_source"
        by_source_dir.mkdir(exist_ok=True)
        self._save_by_source(qa_pairs, by_source_dir)

        # Save by category
        by_category_dir = self.output_path / "by_category"
        by_category_dir.mkdir(exist_ok=True)
        self._save_by_category(qa_pairs, by_category_dir)

        # Save statistics
        stats = self._generate_statistics(qa_pairs)
        stats_file = self.output_path / "statistics.json"
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
        self.logger.info(f"✓ Saved statistics to {stats_file}")

        # Save validation report
        if validation_report:
            report_file = self.output_path / "validation_report.json"
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(validation_report, f, ensure_ascii=False, indent=2)
            self.logger.info(f"✓ Saved validation report to {report_file}")

        # Save sample
        sample_file = self.output_path / "sample.json"
        sample_data = qa_pairs[:100] if len(qa_pairs) >= 100 else qa_pairs
        with open(sample_file, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, ensure_ascii=False, indent=2)
        self.logger.info(f"✓ Saved sample ({len(sample_data)} items) to {sample_file}")

        self.logger.info(f"\n{'=' * 80}")
        self.logger.info(f"ALL OUTPUTS SAVED TO: {self.output_path}")
        self.logger.info(f"{'=' * 80}")

    def _save_jsonl(self, qa_pairs: List[Dict], output_file: Path):
        """Save QA pairs to JSONL file"""
        with open(output_file, 'w', encoding='utf-8') as f:
            for qa_pair in qa_pairs:
                f.write(json.dumps(qa_pair, ensure_ascii=False) + '\n')

    def _save_csv(self, qa_pairs: List[Dict], output_file: Path):
        """Save QA pairs to CSV file"""
        df = pd.DataFrame(qa_pairs)
        # Convert metadata dict to string for CSV
        if 'metadata' in df.columns:
            df['metadata'] = df['metadata'].apply(lambda x: json.dumps(x, ensure_ascii=False))
        df.to_csv(output_file, index=False, encoding='utf-8')

    def _save_by_source(self, qa_pairs: List[Dict], output_dir: Path):
        """Save QA pairs by source dataset"""
        by_source = {}
        for qa_pair in qa_pairs:
            source = qa_pair.get('source_dataset', 'unknown')
            if source not in by_source:
                by_source[source] = []
            by_source[source].append(qa_pair)

        for source, pairs in by_source.items():
            output_file = output_dir / f"{source}.jsonl"
            self._save_jsonl(pairs, output_file)
            self.logger.info(f"  - Saved {len(pairs)} pairs to {output_file}")

    def _save_by_category(self, qa_pairs: List[Dict], output_dir: Path):
        """Save QA pairs by category"""
        by_category = {}
        for qa_pair in qa_pairs:
            category = qa_pair.get('category', 'unknown')
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(qa_pair)

        for category, pairs in by_category.items():
            # Sanitize category name for filename
            safe_category = category.replace('/', '_').replace(' ', '_')
            output_file = output_dir / f"{safe_category}.jsonl"
            self._save_jsonl(pairs, output_file)
            self.logger.info(f"  - Saved {len(pairs)} pairs to {output_file}")

    def _generate_statistics(self, qa_pairs: List[Dict]) -> Dict:
        """Generate statistics about the dataset"""
        stats = {
            'total_pairs': len(qa_pairs),
            'by_source': {},
            'by_category': {},
            'by_subcategory': {},
            'avg_question_length': 0,
            'avg_answer_length': 0,
            'timestamp': datetime.now().isoformat()
        }

        if not qa_pairs:
            return stats

        # Count by source, category, subcategory
        for qa_pair in qa_pairs:
            source = qa_pair.get('source_dataset', 'unknown')
            category = qa_pair.get('category', 'unknown')
            subcategory = qa_pair.get('subcategory', 'unknown')

            stats['by_source'][source] = stats['by_source'].get(source, 0) + 1
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1
            stats['by_subcategory'][subcategory] = stats['by_subcategory'].get(subcategory, 0) + 1

        # Calculate average lengths
        total_q_len = sum(len(qa.get('question', '')) for qa in qa_pairs)
        total_a_len = sum(len(qa.get('answer', '')) for qa in qa_pairs)

        stats['avg_question_length'] = total_q_len / len(qa_pairs)
        stats['avg_answer_length'] = total_a_len / len(qa_pairs)

        return stats

    def run(self):
        """Run the complete integration pipeline"""
        start_time = datetime.now()

        self.logger.info("\n" + "=" * 80)
        self.logger.info("AI HUB QA DATASETS INTEGRATION")
        self.logger.info(f"Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        self.logger.info("=" * 80)

        # Step 1: Load datasets
        raw_datasets = self.load_datasets()

        # Step 2: Transform to unified format
        unified_qa_pairs = self.transform_datasets(raw_datasets)

        # Step 3: Curate categories (optional)
        curated_qa_pairs = self.curate_categories(unified_qa_pairs)

        # Step 4: Validate (optional)
        valid_qa_pairs, validation_report = self.validate_datasets(curated_qa_pairs)

        # Step 5: Save outputs
        self.save_outputs(valid_qa_pairs, validation_report)

        # Summary
        end_time = datetime.now()
        duration = end_time - start_time

        self.logger.info("\n" + "=" * 80)
        self.logger.info("INTEGRATION SUMMARY")
        self.logger.info("=" * 80)
        self.logger.info(f"Total QA pairs: {len(valid_qa_pairs)}")
        self.logger.info(f"Duration: {duration}")
        self.logger.info(f"Output directory: {self.output_path}")
        self.logger.info("=" * 80)

        return valid_qa_pairs


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Integrate AI Hub QA datasets')
    parser.add_argument(
        '--data-path',
        type=str,
        default='data/ai_hub',
        help='Base path to AI Hub datasets'
    )
    parser.add_argument(
        '--output-path',
        type=str,
        default='outputs/qa_unified',
        help='Path to output directory'
    )
    parser.add_argument(
        '--no-ai-curation',
        action='store_true',
        help='Disable AI category curation'
    )
    parser.add_argument(
        '--no-validation',
        action='store_true',
        help='Disable output validation'
    )
    parser.add_argument(
        '--limit-120',
        type=int,
        default=None,
        help='Limit number of items from dataset 120 (for testing)'
    )

    args = parser.parse_args()

    # Create integrator
    integrator = AIHubDatasetIntegrator(
        base_data_path=args.data_path,
        output_path=args.output_path,
        use_ai_curation=not args.no_ai_curation,
        validate_output=not args.no_validation,
        limit_dataset_120=args.limit_120
    )

    # Run integration
    integrator.run()


if __name__ == '__main__':
    main()
