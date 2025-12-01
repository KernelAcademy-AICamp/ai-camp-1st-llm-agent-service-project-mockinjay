"""
Nutrition RAG - CLIP + Pinecone Hybrid Search
음식 이미지-텍스트 동시 검색을 위한 RAG 시스템
"""

import os
import logging
from typing import List, Dict, Any, Optional, Union
from io import BytesIO
import base64

import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from pinecone import Pinecone, ServerlessSpec
from rank_bm25 import BM25Okapi

logger = logging.getLogger(__name__)


class NutritionRAG:
    """CLIP 기반 음식 검색 RAG - 이미지/텍스트 하이브리드 검색"""

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # CLIP 모델 초기화
        logger.info(f"🔧 Loading CLIP model on {self.device}")
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.model.to(self.device)
        self.model.eval()

        # Pinecone 초기화
        self.pc = None
        self.index = None
        self._init_pinecone()

        # BM25 for keyword search (in-memory cache)
        self.bm25 = None
        self.food_corpus = []

    def _init_pinecone(self):
        """Pinecone vector DB 초기화"""
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            logger.warning("⚠️ PINECONE_API_KEY not found - RAG disabled")
            return

        try:
            self.pc = Pinecone(api_key=api_key)
            index_name = "nutrition-ckd"

            # Check if index exists
            existing_indexes = self.pc.list_indexes()
            if index_name not in [idx.name for idx in existing_indexes]:
                logger.info(f"📦 Creating Pinecone index: {index_name}")
                self.pc.create_index(
                    name=index_name,
                    dimension=512,  # CLIP embedding dimension
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )

            self.index = self.pc.Index(index_name)
            logger.info(f"✅ Pinecone index '{index_name}' ready")

        except Exception as e:
            logger.error(f"❌ Pinecone initialization failed: {e}")
            self.pc = None
            self.index = None

    def _unflatten_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Pinecone 메타데이터에서 nutrition 필드를 복원

        Args:
            metadata: Flattened metadata from Pinecone

        Returns:
            Unflattened metadata with nutrition dict
        """
        nutrition = {}
        result = {}

        for key, value in metadata.items():
            if key.startswith("nutrition_"):
                # Extract nutrition field
                field_name = key.replace("nutrition_", "")
                nutrition[field_name] = value
            else:
                result[key] = value

        if nutrition:
            result["nutrition"] = nutrition

        return result

    def encode_image(self, image_input: Union[str, Image.Image]) -> torch.Tensor:
        """
        이미지를 CLIP 임베딩으로 변환

        Args:
            image_input: PIL Image 또는 base64 string

        Returns:
            CLIP image embedding (512-dim)
        """
        try:
            # Base64 string to PIL Image
            if isinstance(image_input, str):
                image_bytes = base64.b64decode(image_input)
                image = Image.open(BytesIO(image_bytes)).convert("RGB")
            else:
                image = image_input

            # CLIP preprocessing
            inputs = self.processor(images=image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                image_features = self.model.get_image_features(**inputs)
                # Normalize
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)

            return image_features.cpu().squeeze()

        except Exception as e:
            logger.error(f"Image encoding failed: {e}")
            raise

    def encode_text(self, text: str) -> torch.Tensor:
        """
        텍스트를 CLIP 임베딩으로 변환

        Args:
            text: 검색 쿼리 텍스트

        Returns:
            CLIP text embedding (512-dim)
        """
        try:
            # Truncate text to fit CLIP's 77 token limit (~200 chars for Korean)
            if len(text) > 200:
                text = text[:200]

            inputs = self.processor(text=[text], return_tensors="pt", padding=True, truncation=True, max_length=77)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                text_features = self.model.get_text_features(**inputs)
                # Normalize
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)

            return text_features.cpu().squeeze()

        except Exception as e:
            logger.error(f"Text encoding failed: {e}")
            raise

    def search_by_image(
        self,
        image_input: Union[str, Image.Image],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        이미지로 유사 음식 검색

        Args:
            image_input: 음식 이미지 (PIL 또는 base64)
            top_k: 반환할 상위 결과 수

        Returns:
            List of {dish_name, ingredients, recipe, nutrition, score}
        """
        if not self.index:
            logger.warning("Pinecone not available - using dummy data")
            return self._get_dummy_food_data(top_k)

        try:
            # Image embedding
            image_emb = self.encode_image(image_input)

            # Pinecone search
            results = self.index.query(
                vector=image_emb.tolist(),
                top_k=top_k,
                include_metadata=True
            )

            foods = []
            for match in results.matches:
                unflattened = self._unflatten_metadata(match.metadata)
                foods.append({
                    "dish_name": unflattened.get("dish_name", "Unknown"),
                    "ingredients": unflattened.get("ingredients", []),
                    "recipe": unflattened.get("recipe", ""),
                    "nutrition": unflattened.get("nutrition", {}),
                    "score": match.score
                })

            return foods

        except Exception as e:
            logger.error(f"Image search failed: {e}")
            return self._get_dummy_food_data(top_k)

    def search_by_text(
        self,
        query: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        텍스트로 음식 검색 (시맨틱 검색)

        Args:
            query: 검색 쿼리 (음식명, 식재료 등)
            top_k: 반환할 상위 결과 수

        Returns:
            List of {dish_name, ingredients, recipe, nutrition, score}
        """
        if not self.index:
            logger.warning("Pinecone not available - using dummy data")
            return self._get_dummy_food_data(top_k)

        try:
            # Text embedding
            text_emb = self.encode_text(query)

            # Pinecone search
            results = self.index.query(
                vector=text_emb.tolist(),
                top_k=top_k,
                include_metadata=True
            )

            foods = []
            for match in results.matches:
                unflattened = self._unflatten_metadata(match.metadata)
                foods.append({
                    "dish_name": unflattened.get("dish_name", "Unknown"),
                    "ingredients": unflattened.get("ingredients", []),
                    "recipe": unflattened.get("recipe", ""),
                    "nutrition": unflattened.get("nutrition", {}),
                    "score": match.score
                })

            return foods

        except Exception as e:
            logger.error(f"Text search failed: {e}")
            return self._get_dummy_food_data(top_k)

    def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        semantic_weight: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        하이브리드 검색 (시맨틱 + BM25 키워드)

        Args:
            query: 검색 쿼리
            top_k: 반환할 상위 결과 수
            semantic_weight: 시맨틱 검색 가중치 (0~1)

        Returns:
            List of {dish_name, ingredients, recipe, nutrition, score}
        """
        # Semantic search
        semantic_results = self.search_by_text(query, top_k=top_k * 2)

        # BM25 keyword search (if corpus loaded)
        if self.bm25 and self.food_corpus:
            tokenized_query = query.split()
            bm25_scores = self.bm25.get_scores(tokenized_query)

            # Combine scores
            combined = {}
            for idx, food in enumerate(self.food_corpus):
                dish_name = food["dish_name"]
                # Normalize BM25 scores
                bm25_score = bm25_scores[idx] / (max(bm25_scores) + 1e-6)

                # Find semantic score
                semantic_score = 0
                for sem_result in semantic_results:
                    if sem_result["dish_name"] == dish_name:
                        semantic_score = sem_result["score"]
                        break

                # Weighted combination
                combined[dish_name] = {
                    **food,
                    "score": semantic_weight * semantic_score + (1 - semantic_weight) * bm25_score
                }

            # Sort by combined score
            ranked = sorted(combined.values(), key=lambda x: x["score"], reverse=True)
            return ranked[:top_k]

        else:
            # Fallback to semantic only
            return semantic_results[:top_k]

    def load_food_corpus(self, foods: List[Dict[str, Any]]):
        """
        BM25를 위한 음식 코퍼스 로드

        Args:
            foods: List of {dish_name, ingredients, recipe, nutrition}
        """
        self.food_corpus = foods

        # Tokenize for BM25
        corpus_texts = [
            f"{food['dish_name']} {' '.join(food.get('ingredients', []))} {food.get('recipe', '')}"
            for food in foods
        ]
        tokenized_corpus = [doc.split() for doc in corpus_texts]

        self.bm25 = BM25Okapi(tokenized_corpus)
        logger.info(f"📚 BM25 corpus loaded: {len(foods)} foods")

    def upsert_food(
        self,
        food_id: str,
        dish_name: str,
        ingredients: List[str],
        recipe: str,
        nutrition: Dict[str, Any],
        image: Optional[Image.Image] = None
    ):
        """
        음식 데이터를 Pinecone에 추가

        Args:
            food_id: Unique ID
            dish_name: 요리명
            ingredients: 식재료 리스트
            recipe: 조리법
            nutrition: 영양 정보 {sodium, potassium, phosphorus, protein, calcium}
            image: 음식 이미지 (선택)
        """
        if not self.index:
            logger.warning("Pinecone not available - skipping upsert")
            return

        try:
            # Generate embedding (image or text)
            if image:
                embedding = self.encode_image(image)
            else:
                # Fallback to text embedding
                text = f"{dish_name} {' '.join(ingredients)} {recipe}"
                embedding = self.encode_text(text)

            # Flatten nutrition metadata (Pinecone doesn't support nested dicts)
            metadata = {
                "dish_name": dish_name,
                "ingredients": ingredients,
                "recipe": recipe[:500] if recipe else "",  # Truncate long recipes
            }

            # Add flattened nutrition fields
            if nutrition:
                for key, value in nutrition.items():
                    metadata[f"nutrition_{key}"] = float(value) if value else 0.0

            # Upsert to Pinecone
            self.index.upsert(
                vectors=[(
                    food_id,
                    embedding.tolist(),
                    metadata
                )]
            )

            logger.info(f"✅ Upserted food: {dish_name} (ID: {food_id})")

        except Exception as e:
            logger.error(f"Upsert failed for {dish_name}: {e}")

    def _get_dummy_food_data(self, top_k: int = 5) -> List[Dict[str, Any]]:
        """더미 음식 데이터 (RAG 비활성화 시)"""
        dummy_foods = [
            {
                "dish_name": "저염 닭가슴살 샐러드",
                "ingredients": ["닭가슴살", "양배추", "오이", "방울토마토", "올리브오일"],
                "recipe": "닭가슴살을 삶아 찢고, 데친 야채와 함께 올리브오일 드레싱으로 버무립니다.",
                "nutrition": {
                    "sodium": 350,
                    "potassium": 450,
                    "phosphorus": 180,
                    "protein": 28,
                    "calcium": 65
                },
                "score": 0.95
            },
            {
                "dish_name": "저인 계란 볶음밥",
                "ingredients": ["현미밥", "계란 흰자", "양파", "당근", "저염 간장"],
                "recipe": "현미밥에 계란 흰자와 야채를 넣고 저염 간장으로 간하여 볶습니다.",
                "nutrition": {
                    "sodium": 420,
                    "potassium": 380,
                    "phosphorus": 220,
                    "protein": 18,
                    "calcium": 45
                },
                "score": 0.88
            },
            {
                "dish_name": "저칼륨 야채 스프",
                "ingredients": ["양배추", "가지", "애호박", "당근", "허브"],
                "recipe": "야채를 데쳐 칼륨을 제거한 후 허브로 간을 하여 끓입니다.",
                "nutrition": {
                    "sodium": 280,
                    "potassium": 320,
                    "phosphorus": 95,
                    "protein": 8,
                    "calcium": 72
                },
                "score": 0.82
            }
        ]

        return dummy_foods[:top_k]
