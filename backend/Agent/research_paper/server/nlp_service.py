"""
Healthcare NLP Service using GPT-4o-mini and Small Embeddings

This module provides a production-ready NLP service following Parlant's architecture:
- GPT-4o-mini for cost-effective text generation
- text-embedding-3-small for efficient embeddings (1536 dimensions)
- Policy-based retry mechanisms for API resilience
- Comprehensive metrics and monitoring
- Multi-tier caching for performance
- Medical-specific capabilities

Architecture inspired by Parlant's NLPService but adapted for healthcare domain.
"""

from __future__ import annotations
import asyncio
import time
import os
import logging
import hashlib
import pickle
from pathlib import Path
from typing import Any, Mapping, Optional, List, Dict, Tuple, AsyncIterator
from functools import wraps
from collections import defaultdict
from dataclasses import dataclass
import json

# OpenAI
from openai import (
    AsyncOpenAI,
    APIConnectionError,
    APITimeoutError,
    RateLimitError,
    InternalServerError,
    APIResponseValidationError,
)
import tiktoken

# Local models
from sentence_transformers import SentenceTransformer, CrossEncoder
import numpy as np

# Environment
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ==================== Error Messages ====================

RATE_LIMIT_ERROR_MESSAGE = (
    "OpenAI API rate limit exceeded. Possible reasons:\n"
    "1. Your account may have insufficient API credits.\n"
    "2. You may be using a free-tier account with limited request capacity.\n"
    "3. You might have exceeded the requests-per-minute limit for your account.\n\n"
    "Recommended actions:\n"
    "- Check your OpenAI account balance and billing status.\n"
    "- Review your API usage limits in OpenAI's dashboard.\n"
    "- For more details: https://platform.openai.com/docs/guides/rate-limits/usage-tiers\n"
)


# ==================== Data Classes ====================

@dataclass
class UsageInfo:
    """Token usage information"""
    input_tokens: int
    output_tokens: int
    cached_input_tokens: int = 0

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens


@dataclass
class GenerationInfo:
    """Generation metadata"""
    model: str
    duration: float  # seconds
    usage: UsageInfo


@dataclass
class GenerationResult:
    """Result from text generation"""
    content: str
    info: GenerationInfo


@dataclass
class EmbeddingResult:
    """Result from embedding generation"""
    vectors: List[List[float]]
    model: str
    duration: float


# ==================== Retry Policy ====================

def retry_policy(
    max_retries: int = 3,
    wait_times: Tuple[float, ...] = (1.0, 2.0, 5.0),
    exceptions: Tuple[type, ...] = (
        APIConnectionError,
        APITimeoutError,
        RateLimitError,
        APIResponseValidationError,
    )
):
    """
    Retry decorator for API calls

    Args:
        max_retries: Maximum number of retry attempts
        wait_times: Wait times between retries
        exceptions: Exception types to retry on
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)

                except exceptions as e:
                    last_exception = e

                    if attempt < max_retries:
                        wait_time = wait_times[min(attempt, len(wait_times) - 1)]
                        logger.warning(
                            f"Attempt {attempt + 1}/{max_retries + 1} failed: {e}. "
                            f"Retrying in {wait_time}s..."
                        )
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error(f"All {max_retries + 1} attempts failed")
                        raise

                except InternalServerError as e:
                    # Retry internal server errors with longer wait
                    if attempt < 2:
                        wait_time = 5.0 if attempt == 0 else 10.0
                        logger.warning(f"Internal server error: {e}. Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                    else:
                        raise

            if last_exception:
                raise last_exception

        return wrapper
    return decorator


# ==================== Embedding Cache ====================

class EmbeddingCache:
    """High-performance embedding cache with LRU memory and disk persistence"""

    def __init__(
        self,
        cache_dir: str = "./nlp_cache/embeddings",
        max_memory_items: int = 5000
    ):
        """
        Initialize embedding cache

        Args:
            cache_dir: Directory for disk cache
            max_memory_items: Maximum items in memory cache
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.max_memory_items = max_memory_items

        # Memory cache (LRU)
        self._memory: Dict[str, np.ndarray] = {}
        self._access_order: List[str] = []

        # Stats
        self.hits = 0
        self.misses = 0

    def _get_cache_key(self, text: str, model: str) -> str:
        """Generate cache key from text and model"""
        return hashlib.md5(f"{model}:{text}".encode()).hexdigest()

    def _get_disk_path(self, cache_key: str) -> Path:
        """Get disk cache file path"""
        # Use subdirectories to avoid too many files in one directory
        subdir = cache_key[:2]
        (self.cache_dir / subdir).mkdir(parents=True, exist_ok=True)
        return self.cache_dir / subdir / f"{cache_key}.pkl"

    def get(self, text: str, model: str) -> Optional[np.ndarray]:
        """Get embedding from cache"""
        cache_key = self._get_cache_key(text, model)

        # Check memory cache first
        if cache_key in self._memory:
            self.hits += 1
            # Update LRU order
            self._access_order.remove(cache_key)
            self._access_order.append(cache_key)
            return self._memory[cache_key]

        # Check disk cache
        disk_path = self._get_disk_path(cache_key)
        if disk_path.exists():
            try:
                with open(disk_path, 'rb') as f:
                    embedding = pickle.load(f)

                # Add to memory cache
                self._add_to_memory(cache_key, embedding)
                self.hits += 1
                return embedding
            except Exception as e:
                logger.warning(f"Failed to load cached embedding: {e}")

        self.misses += 1
        return None

    def set(self, text: str, model: str, embedding: np.ndarray):
        """Cache embedding in memory and disk"""
        cache_key = self._get_cache_key(text, model)

        # Add to memory
        self._add_to_memory(cache_key, embedding)

        # Save to disk asynchronously
        disk_path = self._get_disk_path(cache_key)
        try:
            with open(disk_path, 'wb') as f:
                pickle.dump(embedding, f)
        except Exception as e:
            logger.warning(f"Failed to save embedding to disk: {e}")

    def _add_to_memory(self, cache_key: str, embedding: np.ndarray):
        """Add embedding to memory cache with LRU eviction"""
        if cache_key in self._memory:
            self._access_order.remove(cache_key)

        self._memory[cache_key] = embedding
        self._access_order.append(cache_key)

        # LRU eviction
        while len(self._memory) > self.max_memory_items:
            oldest = self._access_order.pop(0)
            del self._memory[oldest]

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0

        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1f}%",
            "memory_items": len(self._memory),
            "memory_size_mb": sum(e.nbytes for e in self._memory.values()) / (1024 * 1024)
        }


# ==================== Tokenizer ====================

class GPT4oMiniTokenizer:
    """Tokenizer for GPT-4o-mini"""

    def __init__(self):
        self.encoding = tiktoken.encoding_for_model("gpt-4o-mini")

    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))

    def truncate_to_tokens(self, text: str, max_tokens: int) -> str:
        """Truncate text to fit within token limit"""
        tokens = self.encoding.encode(text)
        if len(tokens) <= max_tokens:
            return text

        truncated_tokens = tokens[:max_tokens]
        return self.encoding.decode(truncated_tokens)


# ==================== Generator ====================

class GPT4oMiniGenerator:
    """
    Text generator using GPT-4o-mini

    Features:
    - Retry policy for resilience
    - Token counting and usage tracking
    - Streaming support
    - Temperature control
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gpt-4o-mini"
    ):
        """
        Initialize generator

        Args:
            api_key: OpenAI API key (from env if not provided)
            model_name: Model to use
        """
        self.model_name = model_name
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")

        if not self.api_key:
            raise ValueError(
                "OpenAI API key not found. Set OPENAI_API_KEY environment variable."
            )

        self.client = AsyncOpenAI(api_key=self.api_key)
        self.tokenizer = GPT4oMiniTokenizer()

        # Stats
        self.total_calls = 0
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cached_tokens = 0

        logger.info(f"✅ GPT-4o-mini generator initialized")

    @property
    def max_tokens(self) -> int:
        """Maximum tokens supported by model"""
        return 128 * 1024  # 128K context window

    @retry_policy(max_retries=3)
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False
    ) -> GenerationResult | AsyncIterator[str]:
        """
        Generate text completion

        Args:
            prompt: User prompt
            system_prompt: System instructions
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            stream: Enable streaming

        Returns:
            GenerationResult or async iterator if streaming
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        self.total_calls += 1

        try:
            if stream:
                return self._stream_generate(messages, temperature, max_tokens)

            t_start = time.time()

            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )

            t_end = time.time()

            # Track usage
            if response.usage:
                self.total_input_tokens += response.usage.prompt_tokens
                self.total_output_tokens += response.usage.completion_tokens

                # Track cached tokens if available
                if hasattr(response.usage, 'prompt_tokens_details'):
                    if response.usage.prompt_tokens_details:
                        cached = getattr(response.usage.prompt_tokens_details, 'cached_tokens', 0)
                        self.total_cached_tokens += cached or 0

            content = response.choices[0].message.content or ""

            usage = UsageInfo(
                input_tokens=response.usage.prompt_tokens if response.usage else 0,
                output_tokens=response.usage.completion_tokens if response.usage else 0,
                cached_input_tokens=self.total_cached_tokens
            )

            info = GenerationInfo(
                model=f"openai/{self.model_name}",
                duration=t_end - t_start,
                usage=usage
            )

            return GenerationResult(content=content, info=info)

        except RateLimitError:
            logger.error(RATE_LIMIT_ERROR_MESSAGE)
            raise

    async def _stream_generate(
        self,
        messages: List[Dict],
        temperature: float,
        max_tokens: int
    ) -> AsyncIterator[str]:
        """Stream response from OpenAI"""
        stream = await self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def get_stats(self) -> Dict[str, Any]:
        """Get generator statistics"""
        return {
            "model": self.model_name,
            "total_calls": self.total_calls,
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_cached_tokens": self.total_cached_tokens,
            "total_tokens": self.total_input_tokens + self.total_output_tokens
        }


# ==================== Embedder ====================

class TextEmbedding3SmallEmbedder:
    """
    Embedder using text-embedding-3-small (1536 dimensions)

    Features:
    - Retry policy for resilience
    - Batch processing
    - Multi-tier caching
    - Fallback to local model
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "text-embedding-3-small",
        dimensions: int = 1536,
        local_fallback_model: str = "sentence-transformers/all-MiniLM-L6-v2",
        use_cache: bool = True,
        cache_dir: str = "./nlp_cache"
    ):
        """
        Initialize embedder

        Args:
            api_key: OpenAI API key
            model_name: OpenAI embedding model
            dimensions: Embedding dimensions
            local_fallback_model: Local model for fallback
            use_cache: Enable caching
            cache_dir: Cache directory
        """
        self.model_name = model_name
        self.dimensions = dimensions
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")

        if not self.api_key:
            logger.warning("No OpenAI API key. Will use local embeddings only.")
            self.client = None
        else:
            self.client = AsyncOpenAI(api_key=self.api_key)

        self.tokenizer = GPT4oMiniTokenizer()

        # Local fallback model (lazy loading)
        self.local_model_name = local_fallback_model
        self._local_model: Optional[SentenceTransformer] = None

        # Cache
        self.use_cache = use_cache
        self.cache = EmbeddingCache(cache_dir=cache_dir) if use_cache else None

        # Stats
        self.total_api_calls = 0
        self.total_local_calls = 0
        self.cache_hits = 0

        logger.info(f"✅ Text-embedding-3-small embedder initialized")
        logger.info(f"   - Dimensions: {dimensions}")
        logger.info(f"   - Cache: {'enabled' if use_cache else 'disabled'}")

    @property
    def max_tokens(self) -> int:
        """Maximum tokens for embedding"""
        return 8192

    @property
    def local_model(self) -> SentenceTransformer:
        """Lazy load local model"""
        if self._local_model is None:
            logger.info(f"Loading local embedding model: {self.local_model_name}")
            self._local_model = SentenceTransformer(self.local_model_name)
            logger.info("✅ Local model loaded")
        return self._local_model

    @retry_policy(max_retries=3)
    async def embed(
        self,
        texts: List[str],
        use_local: bool = False
    ) -> EmbeddingResult:
        """
        Generate embeddings for texts

        Args:
            texts: List of texts to embed
            use_local: Force use of local model

        Returns:
            EmbeddingResult with vectors
        """
        if use_local or not self.client:
            return await self._embed_local(texts)

        # Check cache
        vectors = []
        uncached_texts = []
        uncached_indices = []

        if self.cache:
            for idx, text in enumerate(texts):
                cached = self.cache.get(text, self.model_name)
                if cached is not None:
                    vectors.append((idx, cached.tolist()))
                    self.cache_hits += 1
                else:
                    uncached_texts.append(text)
                    uncached_indices.append(idx)
        else:
            uncached_texts = texts
            uncached_indices = list(range(len(texts)))

        # Generate embeddings for uncached texts
        if uncached_texts:
            try:
                t_start = time.time()

                response = await self.client.embeddings.create(
                    model=self.model_name,
                    input=uncached_texts,
                    dimensions=self.dimensions
                )

                t_end = time.time()

                self.total_api_calls += 1

                # Extract vectors and cache them
                for idx, text, data in zip(uncached_indices, uncached_texts, response.data):
                    vector = data.embedding
                    vectors.append((idx, vector))

                    if self.cache:
                        self.cache.set(text, self.model_name, np.array(vector, dtype=np.float32))

                # Sort by original index
                vectors.sort(key=lambda x: x[0])
                final_vectors = [v for _, v in vectors]

                return EmbeddingResult(
                    vectors=final_vectors,
                    model=f"openai/{self.model_name}",
                    duration=t_end - t_start
                )

            except RateLimitError:
                logger.error(RATE_LIMIT_ERROR_MESSAGE)
                raise
            except Exception as e:
                logger.error(f"OpenAI embedding failed: {e}, falling back to local model")
                return await self._embed_local(texts)

        else:
            # All cached
            vectors.sort(key=lambda x: x[0])
            final_vectors = [v for _, v in vectors]

            return EmbeddingResult(
                vectors=final_vectors,
                model=f"openai/{self.model_name}",
                duration=0.0  # Cached
            )

    async def _embed_local(self, texts: List[str]) -> EmbeddingResult:
        """Generate embeddings using local model"""
        t_start = time.time()

        # Check cache
        vectors = []
        uncached_texts = []
        uncached_indices = []

        if self.cache:
            for idx, text in enumerate(texts):
                cached = self.cache.get(text, "local")
                if cached is not None:
                    vectors.append((idx, cached.tolist()))
                    self.cache_hits += 1
                else:
                    uncached_texts.append(text)
                    uncached_indices.append(idx)
        else:
            uncached_texts = texts
            uncached_indices = list(range(len(texts)))

        # Generate for uncached
        if uncached_texts:
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                None,
                lambda: self.local_model.encode(
                    uncached_texts,
                    convert_to_numpy=True,
                    show_progress_bar=False
                )
            )

            self.total_local_calls += 1

            # Cache them
            for idx, text, emb in zip(uncached_indices, uncached_texts, embeddings):
                vectors.append((idx, emb.tolist()))

                if self.cache:
                    self.cache.set(text, "local", emb)

        # Sort and return
        vectors.sort(key=lambda x: x[0])
        final_vectors = [v for _, v in vectors]

        t_end = time.time()

        return EmbeddingResult(
            vectors=final_vectors,
            model=f"local/{self.local_model_name}",
            duration=t_end - t_start
        )

    def get_stats(self) -> Dict[str, Any]:
        """Get embedder statistics"""
        stats = {
            "model": self.model_name,
            "dimensions": self.dimensions,
            "total_api_calls": self.total_api_calls,
            "total_local_calls": self.total_local_calls,
            "cache_hits": self.cache_hits
        }

        if self.cache:
            stats.update(self.cache.get_stats())

        return stats


# ==================== NLP Service ====================

class HealthcareNLPService:
    """
    Comprehensive NLP service for healthcare applications

    Provides:
    - Text generation with GPT-4o-mini
    - Embeddings with text-embedding-3-small (1536D)
    - Cross-encoder re-ranking
    - Medical-specific capabilities
    - Production-ready with retry policies and caching
    """

    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        use_cache: bool = True,
        cache_dir: str = "./nlp_cache"
    ):
        """
        Initialize NLP service

        Args:
            openai_api_key: OpenAI API key
            use_cache: Enable caching
            cache_dir: Cache directory
        """
        self.api_key = openai_api_key or os.environ.get("OPENAI_API_KEY")

        # Initialize components
        self.generator = GPT4oMiniGenerator(api_key=self.api_key)
        self.embedder = TextEmbedding3SmallEmbedder(
            api_key=self.api_key,
            use_cache=use_cache,
            cache_dir=cache_dir
        )

        # Cross-encoder for re-ranking (lazy loading)
        self._cross_encoder: Optional[CrossEncoder] = None
        self.cross_encoder_model = "cross-encoder/ms-marco-MiniLM-L-6-v2"

        logger.info("="*80)
        logger.info("🏥 Healthcare NLP Service Initialized")
        logger.info("="*80)
        logger.info(f"✅ Generator: GPT-4o-mini")
        logger.info(f"✅ Embedder: text-embedding-3-small (1536D)")
        logger.info(f"✅ Cache: {'enabled' if use_cache else 'disabled'}")
        logger.info("="*80)

    @property
    def cross_encoder(self) -> CrossEncoder:
        """Lazy load cross-encoder"""
        if self._cross_encoder is None:
            logger.info(f"Loading cross-encoder: {self.cross_encoder_model}")
            self._cross_encoder = CrossEncoder(self.cross_encoder_model)
            logger.info("✅ Cross-encoder loaded")
        return self._cross_encoder

    # ==================== Core Methods ====================

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False
    ) -> GenerationResult | AsyncIterator[str]:
        """Generate text using GPT-4o-mini"""
        return await self.generator.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream
        )

    async def get_embeddings(
        self,
        texts: List[str],
        use_local: bool = False
    ) -> EmbeddingResult:
        """Get embeddings for texts"""
        return await self.embedder.embed(texts, use_local=use_local)

    async def rerank(
        self,
        query: str,
        documents: List[str],
        top_k: Optional[int] = None
    ) -> List[Tuple[int, float]]:
        """
        Re-rank documents using cross-encoder

        Args:
            query: Query text
            documents: List of documents
            top_k: Return top k results

        Returns:
            List of (index, score) tuples sorted by relevance
        """
        if not documents:
            return []

        pairs = [[query, doc] for doc in documents]

        # Score with cross-encoder
        loop = asyncio.get_event_loop()
        scores = await loop.run_in_executor(
            None,
            lambda: self.cross_encoder.predict(pairs)
        )

        # Sort by score (descending)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)

        if top_k:
            ranked = ranked[:top_k]

        return ranked

    # ==================== Medical-Specific Methods ====================

    async def classify_medical_query(
        self,
        query: str
    ) -> Tuple[str, float]:
        """
        Classify medical query intent

        Returns:
            (category, confidence) where category is:
            - "medical": Medical information query
            - "general": General health query
            - "clarification": Follow-up or clarification
        """
        categories = [
            "chronic kidney disease treatment",  # medical
            "general health information",  # general
            "please explain more"  # clarification
        ]

        # Get embeddings
        result = await self.embedder.embed([query] + categories, use_local=True)

        query_emb = np.array(result.vectors[0])
        category_embs = [np.array(v) for v in result.vectors[1:]]

        # Calculate similarities
        similarities = [
            float(np.dot(query_emb, cat_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(cat_emb)))
            for cat_emb in category_embs
        ]

        labels = ["medical", "general", "clarification"]
        best_idx = np.argmax(similarities)

        return labels[best_idx], similarities[best_idx]

    async def extract_medical_keywords(
        self,
        text: str,
        top_k: int = 5
    ) -> List[str]:
        """Extract medical keywords using LLM"""
        prompt = f"""Extract {top_k} most important medical keywords from this text.
Return ONLY the keywords separated by commas, no explanations:

{text}"""

        result = await self.generator.generate(
            prompt=prompt,
            temperature=0.3,
            max_tokens=100
        )

        keywords = [k.strip() for k in result.content.split(',')]
        return keywords[:top_k]

    async def summarize_medical_text(
        self,
        text: str,
        max_words: int = 200,
        style: str = "concise"
    ) -> str:
        """
        Summarize medical text

        Args:
            text: Text to summarize
            max_words: Maximum words in summary
            style: "concise", "detailed", or "bullet_points"
        """
        style_instructions = {
            "concise": "Provide a concise summary",
            "detailed": "Provide a detailed summary",
            "bullet_points": "Summarize in bullet points"
        }

        instruction = style_instructions.get(style, "Summarize")

        prompt = f"""{instruction} of the following medical text in Korean (max {max_words} words):

{text}"""

        result = await self.generator.generate(
            prompt=prompt,
            temperature=0.3,
            max_tokens=max_words * 2
        )

        return result.content

    # ==================== Utilities ====================

    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return self.generator.tokenizer.count_tokens(text)

    def truncate_text(self, text: str, max_tokens: int) -> str:
        """Truncate text to token limit"""
        return self.generator.tokenizer.truncate_to_tokens(text, max_tokens)

    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive statistics"""
        return {
            "generator": self.generator.get_stats(),
            "embedder": self.embedder.get_stats()
        }

    @staticmethod
    def verify_environment() -> Optional[str]:
        """Verify environment is set up correctly"""
        if not os.environ.get("OPENAI_API_KEY"):
            return (
                "OPENAI_API_KEY is not set.\n"
                "Please set OPENAI_API_KEY in your environment before using this service."
            )
        return None


# ==================== Global Instance ====================

_nlp_service: Optional[HealthcareNLPService] = None


def get_nlp_service() -> HealthcareNLPService:
    """Get or create global NLP service instance"""
    global _nlp_service

    if _nlp_service is None:
        _nlp_service = HealthcareNLPService()

    return _nlp_service


# ==================== Test ====================

async def test_nlp_service():
    """Test NLP service"""
    print("\n" + "="*80)
    print("HEALTHCARE NLP SERVICE TEST")
    print("="*80)

    # Verify environment
    error = HealthcareNLPService.verify_environment()
    if error:
        print(f"\n⚠️ {error}")
        print("Some tests will be skipped.\n")

    nlp = HealthcareNLPService()

    # Test 1: Embeddings
    print("\n[TEST 1] Embeddings...")
    text = "만성 신장 질환의 치료 방법"

    result = await nlp.get_embeddings([text])
    print(f"✅ Embedding shape: {len(result.vectors[0])} dimensions")
    print(f"   Model: {result.model}")
    print(f"   Duration: {result.duration:.3f}s")

    # Test cached
    result2 = await nlp.get_embeddings([text])
    print(f"✅ Cached embedding: {result2.duration:.3f}s")

    # Test 2: Query classification
    print("\n[TEST 2] Medical query classification...")
    queries = [
        "만성 신장 질환 치료법",
        "안녕하세요",
        "더 자세히 설명해주세요"
    ]

    for query in queries:
        category, confidence = await nlp.classify_medical_query(query)
        print(f"'{query}'")
        print(f"  → {category} (confidence: {confidence:.2f})")

    # Test 3: Re-ranking
    print("\n[TEST 3] Re-ranking...")
    query = "신장 질환 증상"
    docs = [
        "만성 신장 질환의 주요 증상은 피로, 부종, 식욕 감퇴입니다.",
        "고혈압은 심혈관 질환의 위험 요인입니다.",
        "신장 기능이 저하되면 여러 증상이 나타납니다."
    ]

    ranked = await nlp.rerank(query, docs, top_k=3)
    print(f"Query: '{query}'")
    for idx, score in ranked:
        print(f"  {score:.3f}: {docs[idx][:50]}...")

    # Test 4: Text generation (if API available)
    if nlp.api_key:
        print("\n[TEST 4] Text generation...")
        prompt = "만성 신장 질환의 주요 증상 3가지를 간단히 설명해주세요."

        result = await nlp.generate_text(
            prompt=prompt,
            temperature=0.7,
            max_tokens=200
        )

        print(f"Prompt: {prompt}")
        print(f"Response: {result.content[:200]}...")
        print(f"Tokens: {result.info.usage.total_tokens} ({result.info.duration:.2f}s)")

    # Statistics
    print("\n[STATISTICS]")
    stats = nlp.get_stats()
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(test_nlp_service())
