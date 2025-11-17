"""
MongoDB Client Wrapper
Wraps existing OptimizedMongoDBManager for Agent use
"""
import sys
from pathlib import Path
from typing import List, Dict, Optional

# Add app path for imports
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.db.mongodb_manager import OptimizedMongoDBManager


class MongoDBClient:
    """MongoDB client wrapper for Agent system"""

    def __init__(self):
        """Initialize MongoDB client"""
        self.manager = OptimizedMongoDBManager()
        self._initialized = False

    async def connect(self):
        """Connect to MongoDB"""
        if not self._initialized:
            await self.manager.connect()
            self._initialized = True

    async def close(self):
        """Close connection"""
        await self.manager.close()

    async def search_qa(self, query: str, limit: int = 10) -> List[Dict]:
        """Search QA collection"""
        await self.connect()
        return await self.manager.search_qa(query, limit)

    async def search_papers(self, query: str, limit: int = 10) -> List[Dict]:
        """Search papers collection"""
        await self.connect()
        return await self.manager.search_papers(query, limit)

    async def search_medical(self, query: str, limit: int = 10) -> List[Dict]:
        """Search medical collection"""
        await self.connect()
        return await self.manager.search_medical(query, limit)

    async def search_guidelines(self, query: str, limit: int = 10) -> List[Dict]:
        """Search guidelines collection"""
        await self.connect()
        return await self.manager.search_guidelines(query, limit)

    async def search_parallel(
        self,
        query: str,
        collections: List[str],
        limit: int = 10
    ) -> List[Dict]:
        """
        Search multiple collections in parallel

        Args:
            query: Search query
            collections: List of collection names (e.g., ['qa_kidney', 'papers_kidney'])
            limit: Results per collection

        Returns:
            Combined results from all collections
        """
        await self.connect()

        # Execute searches in parallel
        import asyncio
        tasks = []

        for coll in collections:
            if 'qa' in coll:
                tasks.append(self.search_qa(query, limit))
            elif 'papers' in coll:
                tasks.append(self.search_papers(query, limit))
            elif 'medical' in coll:
                tasks.append(self.search_medical(query, limit))
            elif 'guidelines' in coll:
                tasks.append(self.search_guidelines(query, limit))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten results
        combined = []
        for result in results:
            if isinstance(result, list):
                combined.extend(result)

        return combined

    async def get_stats(self) -> Dict:
        """Get database statistics"""
        await self.connect()
        return await self.manager.get_stats()
