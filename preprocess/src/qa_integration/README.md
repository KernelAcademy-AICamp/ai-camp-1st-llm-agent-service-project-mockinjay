# QA Integration Module

Complete pipeline for integrating AI Hub QA datasets (8, 9, and 120) into a unified format.

## Overview

This module provides a comprehensive solution for loading, transforming, validating, and integrating multiple Korean medical QA datasets from AI Hub.

### Datasets

- **Dataset 8**: 전문 의학지식 데이터 (Professional Medical Knowledge)
- **Dataset 9**: 필수의료 의학지식 데이터 (Essential Medical Knowledge)
- **Dataset 120**: 초거대AI 사전학습용 헬스케어 질의응답 데이터 (Healthcare Q&A)

## Architecture

```
src/qa_integration/
├── loaders/                    # Dataset loaders
│   ├── dataset_8_loader.py     # Load dataset 8
│   ├── dataset_9_loader.py     # Load dataset 9
│   └── dataset_120_loader.py   # Load dataset 120 (with AI question generation)
├── transformers/               # Data transformers
│   ├── schema_transformer.py   # Transform to unified format
│   └── category_curator.py     # AI-based category curation
├── validators/                 # Data validators
│   └── qa_validator.py         # Validate output quality
└── integrate_aihub_datasets.py # Main integration script
```

## Features

### 1. Smart Data Loading
- **Dataset 8 & 9**: Direct loading with UTF-8 encoding support
- **Dataset 120**: AI-powered question generation (questions are not provided in raw data)
- BOM handling for proper Korean text encoding
- Recursive file discovery

### 2. Unified Schema Transformation
All datasets are transformed to a unified format:
```json
{
  "id": "ds8_12345",
  "question": "질문 텍스트",
  "answer": "답변 텍스트",
  "category": "내과",
  "subcategory": "신장질환",
  "source_dataset": "dataset_8_professional_medical",
  "metadata": {}
}
```

### 3. AI-Based Category Curation
- Uses Anthropic API (MiniMax-M2 model) for intelligent categorization
- Fallback to existing categories if available
- Consistent category naming across datasets
- Retry logic for robustness

### 4. Quality Validation
- Required field validation
- Text length validation
- Quality issue detection (repetition, placeholders, similarity)
- Character validation (Korean/English)
- Comprehensive validation reports

### 5. Multiple Output Formats
- JSONL (main format)
- CSV (for spreadsheet analysis)
- By source dataset
- By category
- Statistics and reports

## Usage

### Basic Usage

```python
from src.qa_integration import AIHubDatasetIntegrator

# Create integrator
integrator = AIHubDatasetIntegrator(
    base_data_path="data/ai_hub",
    output_path="outputs/qa_unified",
    use_ai_curation=True,
    validate_output=True
)

# Run integration
qa_pairs = integrator.run()
```

### Command Line Usage

```bash
# Basic usage
python src/qa_integration/integrate_aihub_datasets.py

# Custom paths
python src/qa_integration/integrate_aihub_datasets.py \
    --data-path data/ai_hub \
    --output-path outputs/qa_unified

# Testing with limited dataset 120 (faster)
python src/qa_integration/integrate_aihub_datasets.py --limit-120 100

# Without AI curation (faster, uses existing categories)
python src/qa_integration/integrate_aihub_datasets.py --no-ai-curation

# Without validation
python src/qa_integration/integrate_aihub_datasets.py --no-validation

# All options
python src/qa_integration/integrate_aihub_datasets.py \
    --data-path data/ai_hub \
    --output-path outputs/qa_unified \
    --limit-120 100 \
    --no-ai-curation \
    --no-validation
```

### Individual Loaders

```python
# Load dataset 8
from src.qa_integration.loaders import Dataset8Loader

loader = Dataset8Loader("data/ai_hub/08.전문 의학지식 데이터")
qa_pairs = loader.load()
stats = loader.get_statistics(qa_pairs)

# Load dataset 9
from src.qa_integration.loaders import Dataset9Loader

loader = Dataset9Loader("data/ai_hub/09.필수의료 의학지식 데이터")
qa_pairs = loader.load()

# Load dataset 120 (with AI question generation)
from src.qa_integration.loaders import Dataset120Loader

loader = Dataset120Loader(
    "data/ai_hub/120.초거대AI 사전학습용 헬스케어 질의응답 데이터",
    use_ai_generation=True
)
qa_pairs = loader.load(limit=100)  # Limit for testing
```

### Schema Transformation

```python
from src.qa_integration.transformers import SchemaTransformer

transformer = SchemaTransformer()

# Transform single item
unified_qa = transformer.transform(raw_data, 'dataset_8')

# Transform batch
unified_qa_list = transformer.transform_batch(raw_data_list, 'dataset_8')
```

### Category Curation

```python
from src.qa_integration.transformers import CategoryCurator

curator = CategoryCurator()

# Curate single category
category = curator.curate_category(question, answer)

# Curate batch
curated_pairs = curator.curate_batch(qa_pairs)

# Enrich with subcategory
subcategory = curator.enrich_subcategory(question, answer, category)
```

### Validation

```python
from src.qa_integration.validators import QAValidator

validator = QAValidator()

# Validate single QA pair
is_valid, errors = validator.validate_qa_pair(qa_pair)

# Validate batch
valid_pairs, invalid_pairs = validator.validate_batch(qa_pairs)

# Generate report
report = validator.generate_validation_report(valid_pairs, invalid_pairs)
```

## Output Structure

```
outputs/qa_unified/
├── qa_dataset_unified.jsonl     # Main output (JSONL format)
├── qa_dataset_unified.csv       # CSV format
├── statistics.json              # Dataset statistics
├── validation_report.json       # Validation results
├── sample.json                  # Sample data (first 100 items)
├── by_source/                   # Split by source dataset
│   ├── dataset_8_professional_medical.jsonl
│   ├── dataset_9_essential_medical.jsonl
│   └── dataset_120_healthcare_qa.jsonl
├── by_category/                 # Split by category
│   ├── 내과.jsonl
│   ├── 외과.jsonl
│   └── ...
└── logs/                        # Integration logs
    └── integration_20250101_120000.log
```

## Configuration

### Environment Variables

Required in `.env` file:
```bash
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_BASE_URL=your_base_url  # Optional
```

### Validation Parameters

```python
validator = QAValidator(
    min_question_length=10,      # Minimum question length
    max_question_length=1000,    # Maximum question length
    min_answer_length=10,        # Minimum answer length
    max_answer_length=5000,      # Maximum answer length
)
```

## Performance Considerations

### Dataset 120 Question Generation
- Uses AI to generate questions (not provided in raw data)
- Can be slow for large datasets (API calls for each item)
- Use `--limit-120` flag for testing
- Consider running overnight for full dataset

### AI Category Curation
- Optional feature (use `--no-ai-curation` to skip)
- Only curates if existing category is invalid
- Includes retry logic for robustness
- Caches valid categories

### Validation
- Optional feature (use `--no-validation` to skip)
- Fast for most datasets
- Includes quality checks and statistics

## Statistics Example

```json
{
  "total_pairs": 15000,
  "by_source": {
    "dataset_8_professional_medical": 5000,
    "dataset_9_essential_medical": 5000,
    "dataset_120_healthcare_qa": 5000
  },
  "by_category": {
    "내과": 3000,
    "외과": 2000,
    "소아청소년과": 1500,
    "기타": 8500
  },
  "avg_question_length": 45.2,
  "avg_answer_length": 178.6,
  "timestamp": "2025-01-01T12:00:00"
}
```

## Error Handling

- Comprehensive logging at each step
- Graceful handling of missing files
- Retry logic for API calls
- BOM handling for encoding issues
- Invalid data filtering

## Testing

```bash
# Test with limited data
python src/qa_integration/integrate_aihub_datasets.py --limit-120 10

# Test individual loaders
python src/qa_integration/loaders/dataset_8_loader.py
python src/qa_integration/loaders/dataset_9_loader.py
python src/qa_integration/loaders/dataset_120_loader.py

# Test transformers
python src/qa_integration/transformers/schema_transformer.py
python src/qa_integration/transformers/category_curator.py

# Test validators
python src/qa_integration/validators/qa_validator.py
```

## Troubleshooting

### Issue: Korean text appears garbled
**Solution**: The loaders include BOM handling. If issues persist, check file encoding is UTF-8.

### Issue: Dataset 120 question generation is slow
**Solution**: Use `--limit-120` flag to process fewer items, or disable AI generation in code:
```python
loader = Dataset120Loader(path, use_ai_generation=False)
```

### Issue: API errors during category curation
**Solution**: Check your `.env` file has valid API credentials, or use `--no-ai-curation` flag.

### Issue: Out of memory
**Solution**: Process datasets individually or increase system memory. The pipeline is designed to handle large datasets efficiently.

## Future Enhancements

- [ ] Parallel processing for faster loading
- [ ] Batch API calls for question generation
- [ ] Deduplication across datasets
- [ ] Enhanced category taxonomy
- [ ] Multi-language support
- [ ] Database integration

## License

This module is part of the data_candidates project.

## Authors

Created as part of the AI Hub medical QA dataset integration project.
