"""
Metadata Extractor for Medical Paper Datasets

This module provides LLM-based metadata extraction for:
1. Paper datasets (English metadata: journal, authors, keywords)
2. Medical text datasets (Korean keywords)
3. Q&A datasets (Korean keywords)

Reference patterns from task1_process_books.py and task2_process_qa.py
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI, BadRequestError
import time
from tqdm import tqdm

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # logging.FileHandler('metadata_extraction.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class MetadataExtractor:
    """
    Main extraction engine for metadata from medical datasets
    Follows patterns from upstage/minimax2 codebase
    """

    def __init__(self, model_name: str = "upstage", rate_limit: int = 10):
        """
        Initialize with Upstage API (primary) and MiniMax fallback

        Args:
            model_name: "upstage" or "minimax"
            rate_limit: requests per second limit
        """
        # Upstage API (primary)
        upstage_key = os.getenv("UPSTAGE_API_KEY")
        if not upstage_key:
            raise ValueError("UPSTAGE_API_KEY must be set in .env file")

        self.client = OpenAI(
            api_key=upstage_key,
            base_url="https://api.upstage.ai/v1/solar"
        )
        self.model = os.getenv("UPSTAGE_MODEL", "solar-pro2")

        # MiniMax fallback
        self.minimax_client = OpenAI(
            api_key=os.getenv("MINIMAX_API_KEY"),
            base_url=os.getenv("OPENAI_MINIMAX_BASE_URL")
        )

        self.rate_limit = rate_limit
        self.last_request_time = 0

        self.stats = {
            "total_records": 0,
            "processed": 0,
            "errors": 0,
            "web_search_used": 0,
            "fallback_to_minimax": 0
        }


    def _rate_limit_delay(self):
        """Implement rate limiting"""
        if self.rate_limit > 0:
            min_interval = 1.0 / self.rate_limit
            elapsed = time.time() - self.last_request_time
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)
            self.last_request_time = time.time()

    def _parse_json_response(self, response_text: str) -> Optional[Dict]:
        """
        Parse LLM JSON response, handling code blocks

        Args:
            response_text: Raw LLM response

        Returns:
            Parsed JSON dict or None
        """
        try:
            # Extract JSON from code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            return json.loads(response_text)
        except Exception as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            return None

    def _retry_with_minimax(self, prompt: str, system_prompt: str) -> Optional[Dict]:
        """
        Fallback to MiniMax when Upstage fails

        Args:
            prompt: User prompt
            system_prompt: System prompt

        Returns:
            Parsed response or None
        """
        try:
            self.stats["fallback_to_minimax"] += 1
            logger.info("Falling back to MiniMax API...")

            response = self.minimax_client.chat.completions.create(
                model="MiniMax-M2",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )

            return self._parse_json_response(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"MiniMax fallback also failed: {e}")
            return None

    def extract_paper_metadata(
        self,
        title: str,
        abstract: str,
        use_web_search: bool = True
    ) -> Dict:
        """
        Extract metadata from paper title and abstract

        CRITICAL: Journal names and author names MUST be in ENGLISH

        Args:
            title: Paper title
            abstract: Paper abstract
            use_web_search: Whether to use web search for missing info

        Returns:
            Metadata dict with keywords, journal, authors, DOI
        """
        # LLM-based keyword extraction is DISABLED
        # We only use web search for citation/journal/author/DOI data
        logger.info("LLM-based keyword extraction is disabled - using web search only")

        # Initialize result with empty keywords
        result = {
            "keywords": [],
            "journal": None,
            "authors": [],
            "doi": None,
            "publication_date": None,
            "citation_count": 0,
            "cited_by": [],
            "references": [],
            "references_count": 0
        }


        return result

    def extract_keywords_korean(
        self,
        text: str,
        min_keywords: int = 5
    ) -> Dict:
        """
        Extract Korean medical keywords from text

        Args:
            text: Korean medical text
            min_keywords: Minimum number of keywords to extract

        Returns:
            Dict with keywords list
        """
        # COMMENTED OUT: LLM-based Korean keyword extraction
        self._rate_limit_delay()

        # Truncate very long text
        truncated_text = text[:10000] if len(text) > 10000 else text

        prompt = f"""다음 의료 텍스트에서 최소 {min_keywords}개의 핵심 의료 키워드를 한국어로 추출하세요:

        텍스트: {truncated_text}

        요구사항:
        - 최소 {min_keywords}개의 키워드 추출
        - 의료 전문 용어 우선 (질병명, 증상, 치료법, 약물명 등)
        - 한국어로만 작성

        다음 JSON 형식으로만 반환하세요:
        {{
          "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
        }}
        """

        system_prompt = "당신은 의료 문서 분석 전문가입니다. 텍스트에서 핵심 의료 키워드를 정확하게 추출합니다."

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )

            result = self._parse_json_response(response.choices[0].message.content)

            if not result or len(result.get("keywords", [])) < min_keywords:
                logger.warning(f"Insufficient keywords extracted: {result}")
                return {"keywords": result.get("keywords", []) if result else []}

            return result

        except BadRequestError as e:
            error = e.response.json().get("error", {})
            if error.get("code") == "context_length_exceeded":
                logger.warning("Context length exceeded, trying MiniMax...")
                result = self._retry_with_minimax(prompt, system_prompt)
                return result if result else {"keywords": []}
        except Exception as e:
            logger.error(f"Failed to extract Korean keywords: {e}")

        # Return empty keywords (LLM extraction disabled)
        logger.info("LLM-based Korean keyword extraction is disabled")
        return {"keywords": []}

    def extract_qa_keywords_korean(
        self,
        question: str,
        answer: str,
        min_keywords: int = 5
    ) -> Dict:
        """
        Extract Korean medical keywords from Q&A pair

        Args:
            question: Korean question
            answer: Korean answer
            min_keywords: Minimum number of keywords

        Returns:
            Dict with keywords list
        """
        # COMMENTED OUT: LLM-based Q&A keyword extraction
        self._rate_limit_delay()

        prompt = f"""다음 의료 Q&A 쌍에서 최소 {min_keywords}개의 핵심 의료 키워드를 한국어로 추출하세요:

        질문: {question}

        답변: {answer}

        요구사항:
        - 최소 {min_keywords}개의 키워드 추출
        - 의료 전문 용어 우선 (질병명, 증상, 치료법, 검사명 등)
        - 한국어로만 작성

        다음 JSON 형식으로만 반환하세요:
        {{
          "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
        }}
        """

        system_prompt = "당신은 의료 Q&A 분석 전문가입니다. 질문-답변 쌍에서 핵심 의료 키워드를 정확하게 추출합니다."

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )

            result = self._parse_json_response(response.choices[0].message.content)

            if not result or len(result.get("keywords", [])) < min_keywords:
                logger.warning(f"Insufficient keywords extracted: {result}")
                return {"keywords": result.get("keywords", []) if result else []}

            return result

        except BadRequestError as e:
            error = e.response.json().get("error", {})
            if error.get("code") == "context_length_exceeded":
                logger.warning("Context length exceeded, trying MiniMax...")
                result = self._retry_with_minimax(prompt, system_prompt)
                return result if result else {"keywords": []}
        except Exception as e:
            logger.error(f"Failed to extract Q&A keywords: {e}")

        # Return empty keywords (LLM extraction disabled)
        logger.info("LLM-based Q&A keyword extraction is disabled")
        return {"keywords": []}

    def process_medical_dataset(
        self,
        input_path: str,
        output_path: str,
        batch_size: int = 100,
        sample_size: Optional[int] = None
    ):
        """
        Process medical text dataset with Korean keyword extraction

        Args:
            input_path: Path to input JSON file
            output_path: Path to output JSONL file
            batch_size: Batch size for checkpointing
            sample_size: If set, only process first N records (for testing)
        """
        logger.info(f"Processing medical dataset: {input_path}")
        logger.info(f"Output will be saved to: {output_path}")

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        # Load data
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        records = data.get("data", [])
        total = len(records)

        if sample_size:
            records = records[:sample_size]
            total = len(records)
            logger.info(f"Processing sample of {sample_size} records")

        processed_count = 0

        with open(output_path, 'w', encoding='utf-8') as outfile:
            for i, record in enumerate(tqdm(records, desc="Processing medical data")):
                try:
                    self.stats["total_records"] += 1

                    # Extract keywords from text
                    text = record.get("text", "")
                    if text:
                        keywords_result = self.extract_keywords_korean(text)

                        # Add metadata
                        if "metadata" not in record:
                            record["metadata"] = {}
                        record["metadata"]["keywords"] = keywords_result.get("keywords", [])

                    # Write to output
                    outfile.write(json.dumps(record, ensure_ascii=False) + '\n')

                    self.stats["processed"] += 1
                    processed_count += 1

                    # Checkpoint
                    if processed_count % batch_size == 0:
                        logger.info(f"Checkpoint: {processed_count} records processed")
                        outfile.flush()

                except Exception as e:
                    logger.error(f"Error processing record {i}: {e}")
                    self.stats["errors"] += 1
                    continue

        logger.info(f"Medical dataset processing complete: {processed_count} records")

    def process_qa_dataset(
        self,
        input_path: str,
        output_path: str,
        batch_size: int = 100,
        sample_size: Optional[int] = None
    ):
        """
        Process Q&A dataset with Korean keyword extraction

        Args:
            input_path: Path to input JSONL file
            output_path: Path to output JSONL file
            batch_size: Batch size for checkpointing
            sample_size: If set, only process first N records (for testing)
        """
        logger.info(f"Processing Q&A dataset: {input_path}")
        logger.info(f"Output will be saved to: {output_path}")

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        # Count total records
        with open(input_path, 'r', encoding='utf-8') as f:
            total = sum(1 for _ in f)

        if sample_size:
            total = min(total, sample_size)
            logger.info(f"Processing sample of {sample_size} records")

        processed_count = 0

        with open(input_path, 'r', encoding='utf-8') as infile, \
             open(output_path, 'w', encoding='utf-8') as outfile:

            for i, line in enumerate(tqdm(infile, total=total, desc="Processing Q&A")):
                if sample_size and i >= sample_size:
                    break

                try:
                    qa = json.loads(line)
                    self.stats["total_records"] += 1

                    # Extract keywords from Q&A pair
                    question = qa.get("question", "")
                    answer = qa.get("answer", "")

                    if question and answer:
                        keywords_result = self.extract_qa_keywords_korean(question, answer)

                        # Add metadata
                        if "metadata" not in qa:
                            qa["metadata"] = {}
                        qa["metadata"]["keywords"] = keywords_result.get("keywords", [])

                    # Write to output
                    outfile.write(json.dumps(qa, ensure_ascii=False) + '\n')

                    self.stats["processed"] += 1
                    processed_count += 1

                    # Checkpoint
                    if processed_count % batch_size == 0:
                        logger.info(f"Checkpoint: {processed_count} records processed")
                        outfile.flush()

                except Exception as e:
                    logger.error(f"Error processing record {i}: {e}")
                    self.stats["errors"] += 1
                    continue

        logger.info(f"Q&A dataset processing complete: {processed_count} records")

    def get_statistics(self) -> Dict:
        """Get processing statistics"""
        return self.stats.copy()

    def print_statistics(self):
        """Print processing statistics"""
        print("\n" + "="*60)
        print("Metadata Extraction Statistics")
        print("="*60)
        print(f"Total records: {self.stats['total_records']}")
        print(f"Successfully processed: {self.stats['processed']}")
        print(f"Errors: {self.stats['errors']}")
        print(f"Web search used: {self.stats['web_search_used']}")
        print(f"Fallback to MiniMax: {self.stats['fallback_to_minimax']}")
        print("="*60)
