"""
Vector DB Client Wrapper
Wraps existing OptimizedVectorDBManager for Agent use
"""
import sys
from pathlib import Path
from typing import List, Dict

# Add app path for imports
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.db.vector_manager import OptimizedVectorDBManager


class VectorClient:
    """Vector DB client wrapper for Agent system"""

    def __init__(
        self,
        use_cache: bool = True,
        batch_size: int = 32
    ):
        """
        Initialize Vector client

        Args:
            use_cache: Enable embedding cache
            batch_size: Batch size for embedding generation
        """
        self.manager = OptimizedVectorDBManager(
            use_cache=use_cache,
            batch_size=batch_size
        )
        self._initialized = False

    async def connect(self):
        """Connect to vector database"""
        if not self._initialized:
            await self.manager.create_index()
            self._initialized = True

    def close(self):
        """Close connection"""
        self.manager.close()

    async def semantic_search(
        self,
        query: str,
        namespace: str = "papers_kidney",
        top_k: int = 10
    ) -> List[Dict]:
        """
        Perform semantic search

        Args:
            query: Search query
            namespace: Vector namespace
            top_k: Number of results

        Returns:
            List of search results
        """
        await self.connect()
        return await self.manager.semantic_search(query, top_k, namespace)

    async def parallel_semantic_search(
        self,
        queries: List[str],
        namespace: str = "papers_kidney",
        top_k: int = 10
    ) -> Dict[str, List[Dict]]:
        """
        Perform multiple semantic searches in parallel

        Args:
            queries: List of search queries
            namespace: Vector namespace
            top_k: Number of results per query

        Returns:
            Dictionary mapping query to results
        """
        await self.connect()
        return await self.manager.parallel_semantic_search(queries, top_k, namespace)

    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        return self.manager.get_cache_stats()

    def clear_cache(self):
        """Clear embedding cache"""
        self.manager.clear_cache()
