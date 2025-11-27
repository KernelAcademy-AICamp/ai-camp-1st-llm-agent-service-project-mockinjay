"""
Nutrition PDF Processor - 19개 영양 PDF를 Pinecone에 업로드
한글 레시피 PDF 파싱 및 벡터 DB 구축
"""

import os
import sys
import logging
from pathlib import Path
from typing import List, Dict, Any
import json
import time
import hashlib

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

import fitz  # PyMuPDF for PDF parsing
from openai import OpenAI
from dotenv import load_dotenv
from rag.nutrition_rag import NutritionRAG

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NutritionPDFProcessor:
    """PDF 파싱 및 Pinecone 업로드 프로세서"""

    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.rag = NutritionRAG()
        self.data_dir = Path(__file__).parent.parent.parent / "data" / "raw" / "nutri"

    def extract_text_from_pdf(self, pdf_path: Path, max_pages: int = 50) -> str:
        """PDF에서 텍스트 추출"""
        try:
            doc = fitz.open(str(pdf_path))
            text_chunks = []

            # Limit pages to avoid too much text
            num_pages = min(len(doc), max_pages)

            for page_num in range(num_pages):
                page = doc[page_num]
                text = page.get_text()
                if text.strip():
                    text_chunks.append(text)

            doc.close()
            return "\n\n".join(text_chunks)

        except Exception as e:
            logger.error(f"PDF 텍스트 추출 실패 {pdf_path.name}: {e}")
            return ""

    def parse_recipes_with_openai(self, pdf_text: str, pdf_name: str) -> List[Dict[str, Any]]:
        """OpenAI를 사용하여 PDF에서 레시피 추출"""

        # Truncate text if too long (limit to ~15000 chars = ~4000 tokens)
        if len(pdf_text) > 15000:
            pdf_text = pdf_text[:15000] + "..."

        prompt = f"""다음은 신장병 환자를 위한 영양 가이드 PDF의 내용입니다.

PDF 이름: {pdf_name}

텍스트 내용:
{pdf_text}

위 내용에서 레시피/요리를 찾아서 다음 JSON 형식으로 추출해주세요. 최대 20개의 레시피를 추출하세요.

각 레시피에는 반드시 다음 정보를 포함해야 합니다:
- dish_name: 요리명 (한글)
- ingredients: 재료 리스트 (배열)
- recipe: 조리법 (상세하게)
- nutrition: 영양소 정보
  - sodium: 나트륨 (mg)
  - potassium: 칼륨 (mg)
  - phosphorus: 인 (mg)
  - protein: 단백질 (g)
  - calcium: 칼슘 (mg)

영양소 정보가 명시되지 않은 경우, 일반적인 1인분 기준으로 추정값을 제공하세요.
신장병 환자를 위한 저염, 저칼륨, 저인 레시피를 우선적으로 추출하세요.

응답은 다음 JSON 형식으로만 제공하세요:
```json
{{
  "recipes": [
    {{
      "dish_name": "요리명",
      "ingredients": ["재료1", "재료2", "재료3"],
      "recipe": "1. 단계1\\n2. 단계2\\n3. 단계3",
      "nutrition": {{
        "sodium": 350,
        "potassium": 400,
        "phosphorus": 180,
        "protein": 20,
        "calcium": 50
      }}
    }}
  ]
}}
```

JSON만 반환하고 다른 텍스트는 포함하지 마세요."""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "당신은 신장병 환자를 위한 영양 레시피 추출 전문가입니다. PDF 텍스트에서 레시피를 추출하여 JSON 형식으로 반환합니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=4000
            )

            content = response.choices[0].message.content.strip()

            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            data = json.loads(content)
            return data.get("recipes", [])

        except Exception as e:
            logger.error(f"OpenAI 레시피 파싱 실패: {e}")
            return []

    def process_single_pdf(self, pdf_path: Path) -> int:
        """단일 PDF 처리 및 Pinecone 업로드"""
        logger.info(f"📄 Processing: {pdf_path.name}")

        # Extract text
        pdf_text = self.extract_text_from_pdf(pdf_path, max_pages=50)
        if not pdf_text:
            logger.warning(f"⚠️ No text extracted from {pdf_path.name}")
            return 0

        logger.info(f"📝 Extracted {len(pdf_text)} characters")

        # Parse recipes with OpenAI
        recipes = self.parse_recipes_with_openai(pdf_text, pdf_path.name)
        logger.info(f"🍽️ Found {len(recipes)} recipes")

        # Upload to Pinecone
        uploaded = 0

        # Generate ASCII-only prefix from PDF filename using hash
        pdf_hash = hashlib.md5(pdf_path.name.encode('utf-8')).hexdigest()[:8]

        for idx, recipe in enumerate(recipes):
            try:
                # Use hash-based ID (ASCII only, no Korean)
                food_id = f"recipe_{pdf_hash}_{idx}"

                self.rag.upsert_food(
                    food_id=food_id,
                    dish_name=recipe.get("dish_name", "Unknown"),
                    ingredients=recipe.get("ingredients", []),
                    recipe=recipe.get("recipe", ""),
                    nutrition=recipe.get("nutrition", {}),
                    image=None  # No images from PDF
                )

                uploaded += 1

            except Exception as e:
                logger.error(f"❌ Upload failed for recipe {idx}: {e}")

        logger.info(f"✅ Uploaded {uploaded}/{len(recipes)} recipes from {pdf_path.name}")
        return uploaded

    def process_all_pdfs(self):
        """모든 PDF 처리"""
        pdf_files = list(self.data_dir.glob("*.pdf"))
        logger.info(f"🔍 Found {len(pdf_files)} PDF files in {self.data_dir}")

        if not pdf_files:
            logger.error(f"❌ No PDF files found in {self.data_dir}")
            return

        total_uploaded = 0

        for pdf_path in pdf_files:
            try:
                uploaded = self.process_single_pdf(pdf_path)
                total_uploaded += uploaded

                # Rate limiting - wait between PDFs to avoid API rate limits
                time.sleep(2)

            except Exception as e:
                logger.error(f"❌ Failed to process {pdf_path.name}: {e}")

        logger.info(f"\n{'='*60}")
        logger.info(f"🎉 Processing complete!")
        logger.info(f"📦 Total recipes uploaded: {total_uploaded}")
        logger.info(f"📚 Total PDFs processed: {len(pdf_files)}")
        logger.info(f"{'='*60}\n")

        # Verify Pinecone index stats
        self.verify_upload()

    def verify_upload(self):
        """Pinecone 업로드 검증"""
        try:
            if self.rag.index:
                stats = self.rag.index.describe_index_stats()
                logger.info(f"✅ Pinecone Index Stats:")
                logger.info(f"   - Index name: nutrition-ckd")
                logger.info(f"   - Total vectors: {stats.total_vector_count}")
                logger.info(f"   - Dimension: {stats.dimension}")
            else:
                logger.warning("⚠️ Pinecone index not available for verification")
        except Exception as e:
            logger.error(f"❌ Verification failed: {e}")


def main():
    """메인 실행 함수"""
    logger.info("="*60)
    logger.info("🚀 Nutrition PDF Processor - Starting")
    logger.info("="*60)

    processor = NutritionPDFProcessor()
    processor.process_all_pdfs()


if __name__ == "__main__":
    main()
