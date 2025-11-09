#!/usr/bin/env python3
"""
Create a unified dataset from AI Hub 154 data
"""
import json
import os
from pathlib import Path
from typing import Dict, List, Any
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_and_sample_data(file_path: str, sample_size: int = 5):
    """Load JSON and show sample"""
    logger.info(f"Loading {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    logger.info(f"Total count: {data.get('totalcount', 'N/A')}")
    logger.info(f"Data items: {len(data.get('data', []))}")

    if 'data' in data and len(data['data']) > 0:
        logger.info(f"\n=== Sample Data (first {sample_size} items) ===")
        for i, item in enumerate(data['data'][:sample_size]):
            logger.info(f"\n--- Item {i+1} ---")
            logger.info(json.dumps(item, indent=2, ensure_ascii=False)[:1000])

    return data

def create_unified_dataset():
    """Create unified dataset from 154 data"""
    base_path = Path("/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/raw/ai-hub/154.의료, 법률 전문 서적 말뭉치/01-1.정식개방데이터")

    # File paths
    training_file = base_path / "Training/02.라벨링데이터/Training_medical.json"
    validation_file = base_path / "Validation/02.라벨링데이터/Validation_medical.json"

    logger.info("=== AI Hub Dataset 154 - Medical Professional Books Corpus ===\n")

    # Load and examine data
    logger.info("Step 1: Loading Training Data")
    train_data = load_and_sample_data(str(training_file), sample_size=3)

    logger.info("\n" + "="*80)
    logger.info("Step 2: Loading Validation Data")
    val_data = load_and_sample_data(str(validation_file), sample_size=3)

    # Create unified dataset
    logger.info("\n" + "="*80)
    logger.info("Step 3: Creating Unified Dataset")

    unified_dataset = {
        "metadata": {
            "dataset_name": "AI Hub 154 - Medical Professional Books Corpus",
            "description": "Unified dataset combining training and validation medical text corpus",
            "created_at": datetime.now().isoformat(),
            "source": "AI Hub Dataset 154",
            "training_count": len(train_data.get('data', [])),
            "validation_count": len(val_data.get('data', [])),
            "total_count": len(train_data.get('data', [])) + len(val_data.get('data', []))
        },
        "training_data": train_data.get('data', []),
        "validation_data": val_data.get('data', [])
    }

    # Save unified dataset
    output_dir = Path("/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / "unified_medical_corpus.json"

    logger.info(f"\nSaving unified dataset to {output_file}")
    logger.info(f"Total items: {unified_dataset['metadata']['total_count']}")
    logger.info(f"  - Training: {unified_dataset['metadata']['training_count']}")
    logger.info(f"  - Validation: {unified_dataset['metadata']['validation_count']}")

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unified_dataset, f, ensure_ascii=False, indent=2)

    # Calculate file size
    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    logger.info(f"\n✓ Dataset saved successfully!")
    logger.info(f"  File: {output_file}")
    logger.info(f"  Size: {file_size_mb:.2f} MB")

    # Create a summary file
    summary_file = output_dir / "dataset_summary.txt"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write("AI Hub Dataset 154 - Unified Medical Corpus Summary\n")
        f.write("="*80 + "\n\n")
        f.write(f"Created: {unified_dataset['metadata']['created_at']}\n")
        f.write(f"Total Items: {unified_dataset['metadata']['total_count']:,}\n")
        f.write(f"Training Items: {unified_dataset['metadata']['training_count']:,}\n")
        f.write(f"Validation Items: {unified_dataset['metadata']['validation_count']:,}\n")
        f.write(f"File Size: {file_size_mb:.2f} MB\n")
        f.write(f"\nOutput File: {output_file}\n")

    logger.info(f"Summary saved to {summary_file}")

    return output_file

if __name__ == "__main__":
    try:
        output_file = create_unified_dataset()
        logger.info("\n" + "="*80)
        logger.info("COMPLETED SUCCESSFULLY")
        logger.info("="*80)
    except Exception as e:
        logger.error(f"Error creating unified dataset: {e}")
        raise
