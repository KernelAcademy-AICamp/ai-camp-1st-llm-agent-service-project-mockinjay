"""
Main Execution Script for Metadata Extraction

Processes all 3 datasets:
1. processed_medical_data.json → medical_data_enhanced.jsonl
2. qa_unified.jsonl → qa_enhanced.jsonl
"""

import argparse
import json
import logging
from pathlib import Path
from datetime import datetime
from src.metadata_extractor import MetadataExtractor

logger = logging.getLogger(__name__)


class DatasetProcessor:
    """
    Main processor for all three datasets
    """

    def __init__(self, base_dir: str = None):
        """
        Initialize dataset processor

        Args:
            base_dir: Base directory (defaults to current directory)
        """
        if base_dir is None:
            base_dir = Path(__file__).parent

        self.base_dir = Path(base_dir)

        self.medical_input = self.base_dir / "processed_medical_data.json"
        self.medical_output = self.base_dir / "medical_data_final.jsonl"

        self.qa_input = self.base_dir / "qa_unified.jsonl"
        self.qa_output = self.base_dir / "qa_data_final.jsonl"

        # Initialize extractors
        self.extractor = None
        self.web_helper = None

    def initialize_extractors(self):
        """Initialize extraction tools"""
        logger.info("Initializing metadata extractor...")
        self.extractor = MetadataExtractor(model_name="upstage", rate_limit=10)

        # logger.info("Initializing web search helper...")
        # self.web_helper = WebSearchHelper(rate_limit=0.5)

    def process_medical_dataset(self, sample_size: int = None):
        """
        Process medical text dataset with Korean keywords

        Args:
            sample_size: Number of records to process (None = all)
        """
        print("\n" + "="*60)
        print("Processing Medical Dataset")
        print("="*60)
        print(f"Input: {self.medical_input}")
        print(f"Output: {self.medical_output}")
        if sample_size:
            print(f"Sample size: {sample_size}")
        print("="*60)

        if not self.medical_input.exists():
            logger.error(f"Input file not found: {self.medical_input}")
            return

        # Reset stats for this dataset
        self.extractor.stats = {
            "total_records": 0,
            "processed": 0,
            "errors": 0,
            "web_search_used": 0,
            "fallback_to_minimax": 0
        }

        self.extractor.process_medical_dataset(
            input_path=str(self.medical_input),
            output_path=str(self.medical_output),
            batch_size=100,
            sample_size=sample_size
        )

        # print("\n" + "="*60)
        # print("Medical Dataset Processing Complete")
        # print("="*60)
        # self.extractor.print_statistics()

    def process_qa_dataset(self, sample_size: int = None):
        """
        Process Q&A dataset with Korean keywords

        Args:
            sample_size: Number of records to process (None = all)
        """
        print("\n" + "="*60)
        print("Processing Q&A Dataset")
        print("="*60)
        print(f"Input: {self.qa_input}")
        print(f"Output: {self.qa_output}")
        if sample_size:
            print(f"Sample size: {sample_size}")
        print("="*60)

        if not self.qa_input.exists():
            logger.error(f"Input file not found: {self.qa_input}")
            return

        # Reset stats for this dataset
        self.extractor.stats = {
            "total_records": 0,
            "processed": 0,
            "errors": 0,
            "web_search_used": 0,
            "fallback_to_minimax": 0
        }

        self.extractor.process_qa_dataset(
            input_path=str(self.qa_input),
            output_path=str(self.qa_output),
            batch_size=100,
            sample_size=sample_size
        )

        # print("\n" + "="*60)
        # print("Q&A Dataset Processing Complete")
        # print("="*60)
        # self.extractor.print_statistics()


def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(
        description="Process medical datasets with metadata extraction"
    )

    parser.add_argument(
        "--dataset",
        choices=["paper", "medical", "qa", "all"],
        default="all",
        help="Which dataset to process (default: all)"
    )

    parser.add_argument(
        "--test",
        action="store_true",
        help="Test mode: process only 10 records from each dataset"
    )

    parser.add_argument(
        "--sample-size",
        type=int,
        default=None,
        help="Number of records to process (default: all)"
    )

    parser.add_argument(
        "--no-web-search",
        action="store_true",
        help="Disable web search for paper metadata (enabled by default for paper dataset)"
    )

    parser.add_argument(
        "--base-dir",
        type=str,
        default='/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/unified_output',
        help="Base directory path (default: auto-detect)"
    )

    args = parser.parse_args()

    # Set sample size for test mode
    sample_size = args.sample_size
    if args.test:
        sample_size = 10
        print("\n" + "="*60)
        print("TEST MODE: Processing 10 records from each dataset")
        print("="*60)

    # Initialize processor
    processor = DatasetProcessor(base_dir=args.base_dir)
    processor.initialize_extractors()

    # Process datasets
    try:
        if args.dataset in ["medical", "all"]:
            processor.process_medical_dataset(sample_size=sample_size)

        if args.dataset in ["qa", "all"]:
            processor.process_qa_dataset(sample_size=sample_size)


    except KeyboardInterrupt:
        print("\n\nProcessing interrupted by user.")
        print("Progress has been saved. You can resume by running the script again.")

    except Exception as e:
        logger.error(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
