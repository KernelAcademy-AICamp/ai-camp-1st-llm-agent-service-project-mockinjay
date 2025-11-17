"""
PubMed Client Wrapper
Wraps existing OptimizedPubMedSearch for Agent use
"""
import sys
from pathlib import Path
from typing import List, Dict, Optional
import os

# Add app path for imports
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.services.pubmed_search import OptimizedPubMedSearch


class PubMedClient:
    """PubMed client wrapper for Agent system"""

    def __init__(
        self,
        email: Optional[str] = None,
        api_key: Optional[str] = None
    ):
        """
        Initialize PubMed client

        Args:
            email: NCBI email
            api_key: NCBI API key
        """
        self.searcher = OptimizedPubMedSearch(
            email=email or os.getenv("PUBMED_EMAIL"),
            api_key=api_key or os.getenv("NCBI_API_KEY")
        )

    async def search(
        self,
        query: str,
        max_results: int = 10,
        sort: str = "relevance"
    ) -> List[Dict]:
        """
        Search PubMed for papers

        Args:
            query: Search query
            max_results: Maximum number of results
            sort: Sort order (relevance, pub_date, Author)

        Returns:
            List of paper dictionaries
        """
        return await self.searcher.search_papers(
            query=query,
            max_results=max_results,
            sort=sort
        )

    async def batch_search(
        self,
        queries: List[str],
        max_results_per_query: int = 5
    ) -> Dict[str, List[Dict]]:
        """
        Search multiple queries in parallel

        Args:
            queries: List of search queries
            max_results_per_query: Max results per query

        Returns:
            Dictionary mapping query to results
        """
        return await self.searcher.batch_search_papers(
            queries=queries,
            max_results_per_query=max_results_per_query
        )

    async def get_related_articles(
        self,
        pmid: str,
        max_results: int = 10
    ) -> List[Dict]:
        """
        Get related articles for a given PMID

        Args:
            pmid: PubMed ID
            max_results: Maximum number of related articles

        Returns:
            List of related papers
        """
        return await self.searcher.get_related_articles(pmid, max_results)

    def close(self):
        """Clean up resources"""
        self.searcher.close()
