import sys
from pathlib import Path
import hashlib
import pickle
import asyncio
from typing import List, Dict, Optional, Tuple
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import time
import logging

from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
from app.db.mongodb_manager import MongoDBManager as OptimizedMongoDBManager

# Chonkie imports for chunking and refinement
try:
    from chonkie import RecursiveChunker, OverlapRefinery
    CHONKIE_AVAILABLE = True
except ImportError:
    CHONKIE_AVAILABLE = False
    print("⚠️ Chonkie not installed. Install with: pip install chonkie")

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmbeddingCache:
    """High-performance embedding cache with disk persistence"""

    def __init__(self, cache_dir: str = "./embedding_cache", max_memory_items: int = 10000):
        """
        Initialize embedding cache

        Args:
            cache_dir: Directory to store persistent cache
            max_memory_items: Maximum items in memory cache
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.max_memory_items = max_memory_items

        # In-memory LRU cache
        self._memory_cache: Dict[str, np.ndarray] = {}
        self._access_order: List[str] = []

        # Stats
        self.hits = 0
        self.misses = 0

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key from text"""
        return hashlib.md5(text.encode()).hexdigest()

    def _get_disk_path(self, cache_key: str) -> Path:
        """Get disk cache file path"""
        # Use subdirectories to avoid too many files in one directory
        subdir = cache_key[:2]
        (self.cache_dir / subdir).mkdir(exist_ok=True)
        return self.cache_dir / subdir / f"{cache_key}.pkl"

    def get(self, text: str) -> Optional[np.ndarray]:
        """Get embedding from cache"""
        cache_key = self._get_cache_key(text)

        # Check memory cache first
        if cache_key in self._memory_cache:
            self.hits += 1
            # Update access order
            self._access_order.remove(cache_key)
            self._access_order.append(cache_key)
            return self._memory_cache[cache_key]

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

    def _add_to_memory(self, cache_key: str, embedding: np.ndarray):
        """Add to memory cache with LRU eviction"""
        if len(self._memory_cache) >= self.max_memory_items:
            # Evict least recently used
            lru_key = self._access_order.pop(0)
            del self._memory_cache[lru_key]

        self._memory_cache[cache_key] = embedding
        self._access_order.append(cache_key)

    def set(self, text: str, embedding: np.ndarray):
        """Store embedding in cache"""
        cache_key = self._get_cache_key(text)

        # Store in memory
        self._add_to_memory(cache_key, embedding)

        # Store on disk
        disk_path = self._get_disk_path(cache_key)
        try:
            with open(disk_path, 'wb') as f:
                pickle.dump(embedding, f)
        except Exception as e:
            logger.warning(f"Failed to cache embedding to disk: {e}")

    def get_stats(self) -> Dict:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.2f}%",
            "memory_items": len(self._memory_cache),
            "disk_items": sum(1 for _ in self.cache_dir.glob("*/*.pkl"))
        }


class OptimizedVectorDBManager:
    """Optimized Pinecone Vector DB Manager with caching and batch processing"""

    def __init__(
        self,
        index_name: str = "kidney-medical-embeddings",
        use_chunking: bool = True,
        chunk_size: int = 512,
        use_overlap: bool = True,
        overlap_size: float = 0.25,
        overlap_method: str = "suffix",
        embedding_model: str = 'sentence-transformers/all-MiniLM-L6-v2',
        batch_size: int = 32,
        use_cache: bool = True,
        cache_dir: str = "./embedding_cache"
    ):
        """
        Initialize Optimized Vector DB Manager

        Args:
            index_name: Pinecone index name
            use_chunking: Whether to use RecursiveChunker for text splitting
            chunk_size: Maximum tokens per chunk
            use_overlap: Whether to use OverlapRefinery
            overlap_size: Size of overlap context
            overlap_method: Method for adding context
            embedding_model: Sentence transformer model name
            batch_size: Batch size for embedding generation
            use_cache: Whether to use embedding cache
            cache_dir: Directory for cache storage
        """
        self.index_name = index_name
        self.use_chunking = use_chunking and CHONKIE_AVAILABLE
        self.chunk_size = chunk_size
        self.use_overlap = use_overlap and CHONKIE_AVAILABLE
        self.overlap_size = overlap_size
        self.overlap_method = overlap_method
        self.batch_size = batch_size

        # Pinecone initialization
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY not found in .env")

        self.pc = Pinecone(api_key=api_key)
        self.index = None

        # Sentence Transformer model
        logger.info(f"Loading Sentence Transformer model: {embedding_model}...")
        self.model = SentenceTransformer(embedding_model)
        self.dimension = self.model.get_sentence_embedding_dimension()
        logger.info(f"Model loaded (dimension: {self.dimension})")

        # Enable multi-process encoding for better performance
        self.model.max_seq_length = 512  # Optimize for our chunk size

        # Embedding cache
        self.use_cache = use_cache
        if use_cache:
            self.cache = EmbeddingCache(cache_dir=cache_dir)
            logger.info(f"Embedding cache enabled: {cache_dir}")
        else:
            self.cache = None

        # Thread pool for parallel processing
        self.executor = ThreadPoolExecutor(max_workers=4)

        # Initialize chunkers
        if self.use_chunking:
            logger.info(f"Initializing RecursiveChunker (chunk_size: {chunk_size})...")
            self.chunker = RecursiveChunker(
                tokenizer="gpt2",
                chunk_size=chunk_size,
                min_characters_per_chunk=24
            )

            if self.use_overlap:
                logger.info(f"Initializing OverlapRefinery (overlap: {overlap_size*100}%, method: {overlap_method})...")
                self.overlap_refinery = OverlapRefinery(
                    tokenizer="gpt2",
                    context_size=overlap_size,
                    method=overlap_method,
                    merge=True,
                    inplace=False
                )
            else:
                self.overlap_refinery = None
        else:
            self.chunker = None
            self.overlap_refinery = None

    async def create_index(self):
        """Create or connect to Pinecone index"""
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]

        if self.index_name not in existing_indexes:
            logger.info(f"Creating Pinecone index: {self.index_name}")
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
            logger.info("Index created successfully")
        else:
            logger.info(f"Connected to existing index: {self.index_name}")

        self.index = self.pc.Index(self.index_name)

    @lru_cache(maxsize=1000)
    def generate_embedding_single_cached(self, text: str) -> List[float]:
        """Generate embedding for a single text with LRU caching"""
        # Check persistent cache first
        if self.use_cache:
            cached = self.cache.get(text)
            if cached is not None:
                return cached.tolist()

        # Generate embedding
        embedding = self.model.encode(text, convert_to_numpy=True, normalize_embeddings=True)

        # Store in cache
        if self.use_cache:
            self.cache.set(text, embedding)

        return embedding.tolist()

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batch with caching

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding vectors
        """
        embeddings = []
        texts_to_encode = []
        text_indices = []

        # Check cache for each text
        for i, text in enumerate(texts):
            if self.use_cache:
                cached = self.cache.get(text)
                if cached is not None:
                    embeddings.append((i, cached.tolist()))
                    continue

            texts_to_encode.append(text)
            text_indices.append(i)

        # Batch encode uncached texts
        if texts_to_encode:
            logger.info(f"Generating {len(texts_to_encode)} new embeddings (cached: {len(embeddings)})")

            # Process in smaller batches if needed
            batch_embeddings = []
            for i in range(0, len(texts_to_encode), self.batch_size):
                batch = texts_to_encode[i:i + self.batch_size]
                batch_vecs = self.model.encode(
                    batch,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )
                batch_embeddings.extend(batch_vecs)

            # Store in cache and add to results
            for text, vec, idx in zip(texts_to_encode, batch_embeddings, text_indices):
                if self.use_cache:
                    self.cache.set(text, vec)
                embeddings.append((idx, vec.tolist()))

        # Sort by original index and return vectors only
        embeddings.sort(key=lambda x: x[0])
        return [emb[1] for emb in embeddings]

    def chunk_text(self, text: str) -> List[Dict]:
        """Chunk text using RecursiveChunker and OverlapRefinery"""
        if not self.use_chunking or not text.strip():
            return [{
                "text": text,
                "token_count": len(text.split()),
                "start_index": 0,
                "end_index": len(text),
                "chunk_index": 0,
                "has_overlap": False
            }]

        # RecursiveChunker
        chunks = self.chunker.chunk(text)

        # OverlapRefinery
        if self.use_overlap and self.overlap_refinery and len(chunks) > 1:
            chunks = self.overlap_refinery(chunks)

        chunk_dicts = []
        for i, chunk in enumerate(chunks):
            chunk_dicts.append({
                "text": chunk.text,
                "token_count": chunk.token_count,
                "start_index": chunk.start_index,
                "end_index": chunk.end_index,
                "chunk_index": i,
                "has_overlap": self.use_overlap and len(chunks) > 1
            })

        return chunk_dicts

    async def upsert_embeddings(
        self,
        docs: List[Dict],
        namespace: str,
        id_field: str = "_id",
        text_fields: List[str] = None
    ):
        """
        Optimized document embedding with batch processing and caching

        Args:
            docs: MongoDB documents
            namespace: Pinecone namespace
            id_field: Document ID field
            text_fields: Text fields to embed
        """
        if not docs:
            logger.warning("No documents to embed")
            return

        start_time = time.time()
        vectors = []
        all_texts = []
        text_metadata = []  # Store metadata for each text

        # Step 1: Prepare all texts and metadata
        logger.info(f"Preparing {len(docs)} documents for embedding...")

        for doc in docs:
            doc_id = str(doc.get(id_field, ""))
            if not doc_id:
                continue

            # Combine text fields
            if text_fields:
                text_parts = [str(doc.get(field, "")) for field in text_fields]
                combined_text = " ".join(filter(None, text_parts))
            else:
                combined_text = " ".join([
                    str(v) for v in doc.values()
                    if isinstance(v, str) and v
                ])

            if not combined_text.strip():
                continue

            # Chunk text
            chunks = self.chunk_text(combined_text)

            # Prepare metadata
            base_metadata = self.flatten_metadata(doc)

            for chunk in chunks:
                chunk_id = f"{doc_id}_chunk_{chunk['chunk_index']}" if self.use_chunking else doc_id

                metadata = base_metadata.copy()
                if self.use_chunking:
                    metadata.update({
                        "chunk_index": chunk["chunk_index"],
                        "chunk_text": chunk["text"][:1000],
                        "token_count": chunk["token_count"],
                        "chunker_type": "recursive",
                        "has_overlap": chunk.get("has_overlap", False),
                        "overlap_method": self.overlap_method if chunk.get("has_overlap") else "none"
                    })

                all_texts.append(chunk["text"])
                text_metadata.append((chunk_id, metadata))

        # Step 2: Generate embeddings in batch with caching
        logger.info(f"Generating embeddings for {len(all_texts)} text chunks...")
        embeddings = self.generate_embeddings_batch(all_texts)

        # Step 3: Create vectors for Pinecone
        for embedding, (chunk_id, metadata) in zip(embeddings, text_metadata):
            vectors.append({
                "id": chunk_id,
                "values": embedding,
                "metadata": metadata
            })

        # Step 4: Upload to Pinecone in batches
        logger.info(f"Uploading {len(vectors)} vectors to Pinecone...")
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i+batch_size]
            self.index.upsert(vectors=batch, namespace=namespace)

        elapsed = time.time() - start_time

        # Log statistics
        if self.use_cache:
            cache_stats = self.cache.get_stats()
            logger.info(f"Cache stats: {cache_stats}")

        logger.info(
            f"✅ Embedded {len(docs)} docs → {len(vectors)} vectors in {elapsed:.2f}s "
            f"({len(vectors)/elapsed:.1f} vectors/sec)"
        )

    def flatten_metadata(self, doc: Dict) -> Dict:
        """Flatten metadata for Pinecone storage"""
        doc_id = str(doc.get("_id", ""))

        flat = {
            "doc_id": doc_id,
            "title": doc.get("title", "")[:500],
            "abstract": doc.get("abstract", "")[:1000],
            "source": doc.get("source", ""),
            "question": doc.get("question", "")[:500],
            "answer": doc.get("answer", "")[:1000],
            "text": doc.get("text", "")[:1000],
            "keyword": doc.get("keyword", "")[:200],
            "category": doc.get("category", "")[:200],
            "source_dataset": doc.get("source_dataset", "")[:200],
        }

        # Handle metadata field
        if "metadata" in doc and isinstance(doc["metadata"], dict):
            metadata = doc["metadata"]
            flat["doi"] = metadata.get("doi", "")
            flat["pmid"] = str(metadata.get("pmid", ""))
            flat["journal"] = metadata.get("journal", "")[:200]
            flat["publication_date"] = metadata.get("publication_date", "")

            if "keywords" in metadata and isinstance(metadata["keywords"], list):
                flat["keywords"] = ", ".join(metadata["keywords"][:5])

            if "authors" in metadata and isinstance(metadata["authors"], list):
                flat["authors"] = ", ".join(metadata["authors"][:3])

        # Remove None values
        return {k: v for k, v in flat.items() if v}

    async def semantic_search(
        self,
        query: str,
        top_k: int = 10,
        namespace: str = "papers"
    ) -> List[Dict]:
        """
        Optimized semantic search with caching

        Args:
            query: Search query
            top_k: Number of results
            namespace: Pinecone namespace

        Returns:
            List of search results
        """
        # Get query embedding (will use cache if available)
        query_embedding = self.generate_embedding_single_cached(query)

        # Search in Pinecone
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=namespace,
            include_metadata=True
        )

        # Format results
        matches = []
        for match in results.matches:
            result = {
                "id": match.id,
                "score": match.score,
                "metadata": match.metadata
            }

            # Add chunk info if available
            if self.use_chunking and "chunk_text" in match.metadata:
                result["chunk_text"] = match.metadata.get("chunk_text", "")
                result["chunk_index"] = match.metadata.get("chunk_index", 0)
                result["chunker_type"] = match.metadata.get("chunker_type", "unknown")

            matches.append(result)

        return matches

    async def parallel_semantic_search(
        self,
        queries: List[str],
        top_k: int = 10,
        namespace: str = "papers"
    ) -> Dict[str, List[Dict]]:
        """
        Perform multiple semantic searches in parallel

        Args:
            queries: List of search queries
            top_k: Number of results per query
            namespace: Pinecone namespace

        Returns:
            Dictionary mapping query to results
        """
        tasks = []
        for query in queries:
            tasks.append(self.semantic_search(query, top_k, namespace))

        results = await asyncio.gather(*tasks)

        return {query: result for query, result in zip(queries, results)}

    def get_cache_stats(self) -> Dict:
        """Get embedding cache statistics"""
        if self.use_cache:
            return self.cache.get_stats()
        return {"cache_enabled": False}

    def clear_cache(self):
        """Clear embedding cache"""
        if self.use_cache:
            self.cache._memory_cache.clear()
            self.cache._access_order.clear()
            self.cache.hits = 0
            self.cache.misses = 0
            logger.info("Cache cleared")

    def close(self):
        """Clean up resources"""
        self.executor.shutdown(wait=True)
        if hasattr(self, 'model'):
            del self.model


# Backward compatibility wrapper
class VectorDBManager(OptimizedVectorDBManager):
    """Backward compatible wrapper"""
    pass


# ==================== Test Functions ====================
async def test_caching_performance():
    """Test the performance improvement from caching"""
    import time

    print("\n" + "="*80)
    print("CACHING PERFORMANCE TEST")
    print("="*80)

    # Test texts
    test_texts = [
        "Chronic kidney disease treatment options",
        "Diabetes mellitus management",
        "Hypertension and cardiovascular risk",
        "Cancer therapy advances",
        "Neurological disorders diagnosis"
    ] * 20  # Repeat to test cache hits

    # Test without cache
    print("\n[WITHOUT CACHE]")
    manager_no_cache = OptimizedVectorDBManager(use_cache=False)
    await manager_no_cache.create_index()

    start = time.time()
    for text in test_texts:
        _ = manager_no_cache.generate_embedding_single_cached(text)
    time_no_cache = time.time() - start
    print(f"Time: {time_no_cache:.2f}s ({len(test_texts)/time_no_cache:.1f} embeddings/sec)")

    # Test with cache
    print("\n[WITH CACHE]")
    manager_with_cache = OptimizedVectorDBManager(use_cache=True)
    await manager_with_cache.create_index()

    start = time.time()
    for text in test_texts:
        _ = manager_with_cache.generate_embedding_single_cached(text)
    time_with_cache = time.time() - start
    print(f"Time: {time_with_cache:.2f}s ({len(test_texts)/time_with_cache:.1f} embeddings/sec)")

    # Show cache stats
    cache_stats = manager_with_cache.get_cache_stats()
    print(f"\nCache Statistics:")
    for key, value in cache_stats.items():
        print(f"  {key}: {value}")

    speedup = time_no_cache / time_with_cache
    print(f"\n🚀 Speedup: {speedup:.2f}x faster with caching")

    manager_no_cache.close()
    manager_with_cache.close()


async def test_batch_processing():
    """Test batch embedding performance"""
    import time

    print("\n" + "="*80)
    print("BATCH PROCESSING TEST")
    print("="*80)

    # Generate test documents
    test_docs = [
        {
            "_id": f"doc_{i}",
            "title": f"Medical Research Paper {i}",
            "abstract": f"This is an abstract about chronic kidney disease treatment options. "
                       f"The study focuses on patient outcomes and therapeutic interventions. "
                       f"Results show significant improvement in renal function. "
                       f"Variation {i} of the research methodology was applied." * 3
        }
        for i in range(50)
    ]

    manager = OptimizedVectorDBManager(use_cache=True, batch_size=32)
    await manager.create_index()

    print(f"\nEmbedding {len(test_docs)} documents with batch processing...")
    start = time.time()
    await manager.upsert_embeddings(
        docs=test_docs,
        namespace="test",
        text_fields=["title", "abstract"]
    )
    elapsed = time.time() - start

    print(f"\n✅ Completed in {elapsed:.2f}s")
    print(f"   Rate: {len(test_docs)/elapsed:.1f} docs/sec")

    # Show cache effectiveness
    cache_stats = manager.get_cache_stats()
    print(f"\nCache Statistics:")
    for key, value in cache_stats.items():
        print(f"  {key}: {value}")

    manager.close()


async def test_parallel_search():
    """Test parallel semantic search"""
    import time

    print("\n" + "="*80)
    print("PARALLEL SEARCH TEST")
    print("="*80)

    manager = OptimizedVectorDBManager(use_cache=True)
    await manager.create_index()

    queries = [
        "chronic kidney disease",
        "diabetes treatment",
        "hypertension management",
        "cancer therapy",
        "cardiovascular risk"
    ]

    print(f"\nSearching {len(queries)} queries in parallel...")

    # Sequential search (for comparison)
    start = time.time()
    sequential_results = {}
    for query in queries:
        sequential_results[query] = await manager.semantic_search(query, top_k=5, namespace="papers_kidney")
    time_sequential = time.time() - start
    print(f"Sequential: {time_sequential:.2f}s")

    # Parallel search
    start = time.time()
    parallel_results = await manager.parallel_semantic_search(queries, top_k=5, namespace="papers_kidney")
    time_parallel = time.time() - start
    print(f"Parallel: {time_parallel:.2f}s")

    speedup = time_sequential / time_parallel
    print(f"\n🚀 Speedup: {speedup:.2f}x faster with parallel search")

    manager.close()


async def main():
    """Run all optimization tests"""
    await test_caching_performance()
    await test_batch_processing()
    await test_parallel_search()


if __name__ == "__main__":
    asyncio.run(main())