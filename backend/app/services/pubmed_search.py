from dotenv import load_dotenv
import os
import asyncio
import httpx
import time
from typing import List, Dict, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from threading import Lock
import logging
from xml.etree import ElementTree as ET
from deep_translator import GoogleTranslator
import re

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== Constants ====================
PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
BATCH_SIZE = 5  # Process PMIDs in batches of 5
MAX_CONCURRENT_REQUESTS = 10  # Maximum concurrent HTTP requests
CACHE_SIZE = 1000  # LRU cache size for article data

# MeSH categories and subheadings (keeping original constants)
MESH_CATEGORIES = [
    "Anatomy", "Organisms", "Diseases", "Chemicals and Drugs",
    "Analytical, Diagnostic and Therapeutic Techniques, and Equipment",
    "Psychiatry and Psychology", "Phenomena and Processes",
    "Disciplines and Occupations",
    "Anthropology, Education, Sociology, and Social Phenomena",
    "Technology, Industry, and Agriculture", "Humanities",
    "Information Science", "Named Groups", "Health Care",
    "Publication Characteristics"
]

MESH_SUBHEADINGS = [
    "diagnosis", "therapy", "genetics", "etiology", "complications",
    "pathology", "drug therapy", "epidemiology", "prevention & control",
    "physiology", "metabolism", "surgery", "psychology", "immunology",
    "radiotherapy", "classification", "chemically induced",
    "rehabilitation", "nursing", "history", "economics",
    "legislation & jurisprudence", "education"
]

MAJOR_COUNTRIES = [
    "United States", "China", "United Kingdom", "Germany", "Japan",
    "France", "Italy", "Canada", "Australia", "Spain",
    "India", "Brazil", "Netherlands", "South Korea", "Switzerland"
]

WORLD_REGIONS = {
    "Africa": ["Nigeria", "South Africa", "Egypt", "Kenya", "Ghana"],
    "Asia": ["China", "Japan", "India", "South Korea", "Thailand", "Singapore"],
    "Europe": ["United Kingdom", "Germany", "France", "Italy", "Spain", "Netherlands", "Switzerland"],
    "Americas": ["United States", "Canada", "Brazil", "Mexico", "Argentina"],
    "Oceania": ["Australia", "New Zealand"]
}


class OptimizedPubMedSearch:
    """Optimized PubMed API search with parallel processing and caching"""

    def __init__(self, email: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize optimized PubMed searcher

        Args:
            email: NCBI email (required for API)
            api_key: NCBI API key for higher rate limits
        """
        self.email = email or os.getenv("PUBMED_EMAIL", "")
        self.api_key = api_key or os.getenv("NCBI_API_KEY", "")

        # Translation
        self.translator = GoogleTranslator(source='ko', target='en')

        # Caching
        self._count_cache: Dict[str, int] = {}
        self._count_lock = Lock()

        # Thread pool for CPU-bound operations
        self.executor = ThreadPoolExecutor(max_workers=4)

        # HTTP client configuration
        self.http_timeout = httpx.Timeout(30.0, connect=10.0)

    def _build_api_params(self, **kwargs) -> dict:
        """Build API parameters with authentication"""
        params = {}
        if self.email:
            params["email"] = self.email
        if self.api_key:
            params["api_key"] = self.api_key
        params.update(kwargs)
        return params

    @lru_cache(maxsize=CACHE_SIZE)
    def _translate_cached(self, text: str) -> str:
        """Cached translation to avoid repeated API calls"""
        if not self._contains_korean(text):
            return text
        try:
            return self.translator.translate(text)
        except Exception as e:
            logger.warning(f"Translation failed: {e}")
            return text

    def _contains_korean(self, text: str) -> bool:
        """Check if text contains Korean characters"""
        korean_pattern = re.compile('[가-힣]+')
        return bool(korean_pattern.search(text))

    async def _fetch_pmids(self, query: str, max_results: int = 10, sort: str = "relevance") -> List[str]:
        """Fetch PMIDs using async HTTP"""
        params = self._build_api_params(
            db="pubmed",
            term=query,
            retmax=max_results,
            sort=sort,
            retmode="json"
        )

        async with httpx.AsyncClient(timeout=self.http_timeout) as client:
            response = await client.get(f"{PUBMED_BASE_URL}/esearch.fcgi", params=params)
            response.raise_for_status()
            data = response.json()

            pmids = data.get("esearchresult", {}).get("idlist", [])
            logger.info(f"Found {len(pmids)} PMIDs for query: {query}")
            return pmids

    async def _fetch_article_batch(self, pmids: List[str]) -> List[Dict]:
        """Fetch multiple articles in a single API call"""
        if not pmids:
            return []

        params = self._build_api_params(
            db="pubmed",
            id=",".join(pmids),
            retmode="xml"
        )

        async with httpx.AsyncClient(timeout=self.http_timeout) as client:
            response = await client.get(f"{PUBMED_BASE_URL}/efetch.fcgi", params=params)
            response.raise_for_status()

            # Parse XML response
            root = ET.fromstring(response.text)
            articles = []

            for article_elem in root.findall(".//PubmedArticle"):
                try:
                    article_data = self._parse_article_xml(article_elem)
                    articles.append(article_data)
                except Exception as e:
                    logger.error(f"Error parsing article: {e}")
                    continue

            return articles

    def _parse_article_xml(self, article_elem: ET.Element) -> Dict:
        """Parse article data from XML element"""
        pmid = article_elem.findtext(".//PMID", "")

        # Title
        title = article_elem.findtext(".//ArticleTitle", "")

        # Abstract
        abstract_texts = article_elem.findall(".//AbstractText")
        abstract = " ".join([elem.text or "" for elem in abstract_texts])

        # Authors
        authors = []
        for author in article_elem.findall(".//Author"):
            last_name = author.findtext("LastName", "")
            fore_name = author.findtext("ForeName", "")
            if last_name:
                authors.append(f"{last_name} {fore_name}".strip())

        # Journal
        journal = article_elem.findtext(".//Journal/Title", "")

        # Publication date
        pub_date = ""
        year = article_elem.findtext(".//PubDate/Year", "")
        month = article_elem.findtext(".//PubDate/Month", "")
        day = article_elem.findtext(".//PubDate/Day", "")
        if year:
            pub_date = f"{year}"
            if month:
                pub_date += f"-{month:0>2}"
                if day:
                    pub_date += f"-{day:0>2}"

        # DOI
        doi = ""
        for id_elem in article_elem.findall(".//ArticleId"):
            if id_elem.get("IdType") == "doi":
                doi = id_elem.text or ""
                break

        # Keywords
        keywords = [kw.text for kw in article_elem.findall(".//Keyword") if kw.text]

        # MeSH terms
        mesh_terms = {}
        for mesh_elem in article_elem.findall(".//MeshHeading"):
            descriptor = mesh_elem.findtext("DescriptorName", "")
            if descriptor:
                mesh_terms[descriptor] = True

        return {
            "pmid": pmid,
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "journal": journal,
            "pub_date": pub_date,
            "doi": doi,
            "keywords": keywords,
            "mesh_terms": mesh_terms,
            "source": "PubMed",
            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        }

    async def search_papers(
        self,
        query: Optional[str] = None,
        max_results: int = 10,
        sort: str = "relevance",
        auto_translate: bool = True,
        **query_params
    ) -> List[Dict]:
        """
        Optimized paper search with parallel fetching

        Args:
            query: Search query (Korean auto-translated if needed)
            max_results: Maximum number of results
            sort: Sort order (relevance, pub_date, Author)
            auto_translate: Auto-translate Korean queries
            **query_params: Additional search parameters

        Returns:
            List of paper dictionaries with full metadata
        """
        # Build query
        if query_params:
            # Build query from parameters
            query_parts = []
            for key, value in query_params.items():
                if key == "journal":
                    query_parts.append(f"{value}[journal]")
                elif key == "author":
                    query_parts.append(f"{value}[author]")
                elif key == "year":
                    query_parts.append(f"{value}[pdat]")
                else:
                    query_parts.append(str(value))
            final_query = " AND ".join(query_parts)
        elif query:
            if auto_translate:
                final_query = self._translate_cached(query)
            else:
                final_query = query
        else:
            raise ValueError("Either 'query' or query parameters must be provided")

        logger.info(f"Searching PubMed with query: {final_query}")

        # Step 1: Fetch PMIDs asynchronously
        pmids = await self._fetch_pmids(final_query, max_results, sort)

        if not pmids:
            return []

        # Step 2: Fetch articles in parallel batches
        articles = []
        tasks = []

        # Split PMIDs into batches for parallel processing
        for i in range(0, len(pmids), BATCH_SIZE):
            batch = pmids[i:i + BATCH_SIZE]
            tasks.append(self._fetch_article_batch(batch))

        # Execute all batches in parallel
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect results
        for batch_result in batch_results:
            if isinstance(batch_result, Exception):
                logger.error(f"Batch fetch error: {batch_result}")
            else:
                articles.extend(batch_result)

        logger.info(f"Successfully fetched {len(articles)} articles")
        return articles

    async def get_total_count(self, query: str) -> int:
        """
        Retrieve the total number of PubMed results matching a search query.
        
        This method uses an internal per-query cache to avoid repeated API calls. On HTTP 429 (rate limiting) it retries up to three times with backoff; if rate limiting persists it returns 0 and does not raise. Other HTTP errors are propagated.
        
        Parameters:
            query (str): A PubMed search term (as passed to the ESearch API `term` parameter).
        
        Returns:
            int: The total count of matching PubMed records.
        
        Raises:
            httpx.HTTPStatusError: For HTTP errors other than repeated 429 responses.
        """
        # Check cache first
        with self._count_lock:
            if query in self._count_cache:
                return self._count_cache[query]

        params = self._build_api_params(
            db="pubmed",
            term=query,
            retmax=0,
            retmode="json"
        )

        async with httpx.AsyncClient(timeout=self.http_timeout) as client:
            # Retry logic for rate limiting
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = await client.get(f"{PUBMED_BASE_URL}/esearch.fcgi", params=params)
                    response.raise_for_status()
                    data = response.json()

                    count = int(data.get("esearchresult", {}).get("count", 0))

                    # Cache the result
                    with self._count_lock:
                        self._count_cache[query] = count

                    return count
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 429:  # Too Many Requests
                        if attempt < max_retries - 1:
                            wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                            logger.warning(f"Rate limit hit, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                            await asyncio.sleep(wait_time)
                        else:
                            logger.error(f"Rate limit exceeded after {max_retries} attempts for query: {query}")
                            return 0  # Return 0 instead of crashing
                    else:
                        raise  # Re-raise other HTTP errors

    async def get_related_articles(self, pmid: str, max_results: int = 10) -> List[Dict]:
        """
        Retrieve articles related to a given PubMed ID using the PubMed E-utilities elink endpoint.
        
        Parameters:
            pmid (str): The PubMed ID to find related articles for.
            max_results (int): Maximum number of related articles to return.
        
        Returns:
            List[Dict]: A list of article dictionaries (each containing keys such as `pmid`, `title`, `abstract`, `authors`, `journal`, `pub_date`, `doi`, `keywords`, `mesh_terms`, `source`, and `url`). Returns an empty list if no related articles are found.
        """
        params = self._build_api_params(
            dbfrom="pubmed",
            db="pubmed",
            id=pmid,
            cmd="neighbor_score",
            retmode="json"
        )

        async with httpx.AsyncClient(timeout=self.http_timeout) as client:
            response = await client.get(f"{PUBMED_BASE_URL}/elink.fcgi", params=params)
            response.raise_for_status()
            data = response.json()

            # Extract related PMIDs
            related_pmids = []
            link_sets = data.get("linksets", [])
            if link_sets:
                links = link_sets[0].get("linksetdbs", [])
                for link_db in links:
                    if link_db.get("dbto") == "pubmed":
                        for link in link_db.get("links", [])[:max_results]:
                            related_pmids.append(link)

            if not related_pmids:
                return []

            # Fetch article details in parallel
            return await self._fetch_article_batch(related_pmids[:max_results])

    async def batch_search_papers(self, queries: List[str], max_results_per_query: int = 5) -> Dict[str, List[Dict]]:
        """
        Search multiple queries in parallel

        Args:
            queries: List of search queries
            max_results_per_query: Max results per query

        Returns:
            Dictionary mapping query to results
        """
        tasks = []
        for query in queries:
            tasks.append(self.search_papers(query, max_results=max_results_per_query))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        output = {}
        for query, result in zip(queries, results):
            if isinstance(result, Exception):
                logger.error(f"Error searching for '{query}': {result}")
                output[query] = []
            else:
                output[query] = result

        return output

    async def get_publication_trends_parallel(
        self,
        query: str,
        start_year: int,
        end_year: int,
        normalize: bool = True
    ) -> Dict:
        """Get publication trends with parallel year queries"""
        years = list(range(start_year, end_year + 1))

        # Create tasks for all years
        count_tasks = []
        for year in years:
            year_query = f"{query} AND {year}[pdat]"
            count_tasks.append(self.get_total_count(year_query))

        # If normalizing, also get baseline counts
        baseline_tasks = []
        if normalize:
            for year in years:
                baseline_query = f"{year}[pdat]"
                baseline_tasks.append(self.get_total_count(baseline_query))

        # Execute all queries in parallel
        counts = await asyncio.gather(*count_tasks)
        baseline_counts = await asyncio.gather(*baseline_tasks) if normalize else []

        # Calculate normalized counts if needed
        normalized_counts = []
        if normalize and baseline_counts:
            for count, baseline in zip(counts, baseline_counts):
                normalized = (count / baseline * 100000) if baseline > 0 else 0
                normalized_counts.append(normalized)

        result = {
            'query': query,
            'years': years,
            'counts': counts
        }

        if normalize:
            result['baseline_counts'] = baseline_counts
            result['normalized_counts'] = normalized_counts

        return result

    async def get_geographic_distribution_parallel(
        self,
        query: str,
        countries: Optional[List[str]] = None
    ) -> Dict:
        """Get geographic distribution with parallel country queries"""
        countries = countries or MAJOR_COUNTRIES

        # Get total count first
        total_results = await self.get_total_count(query)
        if total_results == 0:
            return {'total_results': 0, 'countries': {}}

        # Create tasks for all countries
        country_tasks = []
        for country in countries:
            country_query = f"{query} AND ({country}[Affiliation] OR {country}[ad])"
            country_tasks.append(self.get_total_count(country_query))

        # Execute all queries in parallel
        country_counts = await asyncio.gather(*country_tasks)

        # Build results
        country_data = {}
        for country, count in zip(countries, country_counts):
            proportion = count / total_results if total_results > 0 else 0
            country_data[country] = {
                'count': count,
                'proportion': proportion
            }

        return {
            'total_results': total_results,
            'countries': country_data
        }

    async def get_mesh_distribution_parallel(
        self,
        query: str,
        categories: Optional[List[str]] = None,
        subheadings: Optional[List[str]] = None
    ) -> Dict:
        """Get MeSH distribution with parallel queries"""
        base_query = f"{query} AND medline[sb]"
        total_results = await self.get_total_count(base_query)

        if total_results == 0:
            return {'total_results': 0, 'categories': [], 'subheadings': []}

        result = {'total_results': total_results}

        # Process categories if provided
        if categories:
            cat_tasks = []
            for category in categories:
                cat_query = f'{base_query} AND "{category} Category"[Mesh]'
                cat_tasks.append(self.get_total_count(cat_query))

            cat_counts = await asyncio.gather(*cat_tasks)

            category_data = []
            for category, count in zip(categories, cat_counts):
                proportion = count / total_results if total_results > 0 else 0
                category_data.append({
                    'name': category,
                    'count': count,
                    'proportion': proportion
                })

            category_data.sort(key=lambda x: x['proportion'], reverse=True)
            result['categories'] = category_data

        # Process subheadings if provided
        if subheadings:
            sub_tasks = []
            for subheading in subheadings:
                sub_query = f'{base_query} AND "{subheading}"[sh]'
                sub_tasks.append(self.get_total_count(sub_query))

            sub_counts = await asyncio.gather(*sub_tasks)

            subheading_data = []
            for subheading, count in zip(subheadings, sub_counts):
                proportion = count / total_results if total_results > 0 else 0
                subheading_data.append({
                    'name': subheading,
                    'count': count,
                    'proportion': proportion
                })

            subheading_data.sort(key=lambda x: x['proportion'], reverse=True)
            result['subheadings'] = subheading_data

        return result

    def close(self):
        """Clean up resources"""
        self.executor.shutdown(wait=True)


# ==================== Backward Compatibility Wrapper ====================
class PubMedAdvancedSearch:
    """Backward compatible wrapper for the optimized implementation"""

    def __init__(self, email: Optional[str] = None, api_key: Optional[str] = None):
        self.optimized = OptimizedPubMedSearch(email, api_key)
        self.fetcher = self  # For compatibility

    async def search_papers(self, *args, **kwargs):
        """Delegate to optimized implementation"""
        return await self.optimized.search_papers(*args, **kwargs)

    async def get_total_count(self, query: str) -> int:
        """Delegate to optimized implementation"""
        return await self.optimized.get_total_count(query)

    async def get_related_articles(self, *args, **kwargs):
        """Delegate to optimized implementation"""
        return await self.optimized.get_related_articles(*args, **kwargs)

    async def get_publication_trends_by_year(self, *args, **kwargs):
        """Delegate to optimized implementation"""
        return await self.optimized.get_publication_trends_parallel(*args, **kwargs)

    async def get_geographic_distribution(self, *args, **kwargs):
        """Delegate to optimized implementation"""
        return await self.optimized.get_geographic_distribution_parallel(*args, **kwargs)

    async def get_mesh_category_distribution(self, query, categories=None):
        """Delegate to optimized implementation"""
        result = await self.optimized.get_mesh_distribution_parallel(
            query, categories=categories or MESH_CATEGORIES[:5]
        )
        return {
            'total_results': result['total_results'],
            'categories': result.get('categories', [])
        }

    async def get_mesh_subheading_distribution(self, query, subheadings=None):
        """Delegate to optimized implementation"""
        result = await self.optimized.get_mesh_distribution_parallel(
            query, subheadings=subheadings or MESH_SUBHEADINGS[:5]
        )
        return {
            'total_results': result['total_results'],
            'subheadings': result.get('subheadings', [])
        }


# ==================== Test Functions ====================
async def test_optimized_performance():
    """Test the performance improvements"""
    import time

    searcher = OptimizedPubMedSearch()

    print("\n" + "="*80)
    print("PERFORMANCE TEST: Optimized vs Original")
    print("="*80)

    # Test 1: Single query with 30 papers
    print("\n[TEST 1] Fetching 30 papers...")
    start_time = time.time()
    papers = await searcher.search_papers("chronic kidney disease", max_results=30)
    elapsed = time.time() - start_time
    print(f"✅ Fetched {len(papers)} papers in {elapsed:.2f} seconds")
    print(f"   Average: {elapsed/len(papers):.2f} seconds per paper")

    # Test 2: Multiple queries in parallel
    print("\n[TEST 2] Multiple queries in parallel...")
    queries = [
        "diabetes mellitus",
        "hypertension",
        "cardiovascular disease",
        "chronic kidney disease",
        "cancer therapy"
    ]
    start_time = time.time()
    results = await searcher.batch_search_papers(queries, max_results_per_query=10)
    elapsed = time.time() - start_time
    total_papers = sum(len(papers) for papers in results.values())
    print(f"✅ Fetched {total_papers} papers from {len(queries)} queries in {elapsed:.2f} seconds")
    print(f"   Average: {elapsed/len(queries):.2f} seconds per query")

    # Test 3: Geographic distribution (parallel)
    print("\n[TEST 3] Geographic distribution with parallel queries...")
    start_time = time.time()
    geo_dist = await searcher.get_geographic_distribution_parallel(
        "COVID-19",
        countries=MAJOR_COUNTRIES[:10]
    )
    elapsed = time.time() - start_time
    print(f"✅ Analyzed {len(geo_dist['countries'])} countries in {elapsed:.2f} seconds")

    # Test 4: Temporal trends (parallel)
    print("\n[TEST 4] Temporal trends with parallel year queries...")
    start_time = time.time()
    trends = await searcher.get_publication_trends_parallel(
        "artificial intelligence",
        start_year=2015,
        end_year=2024,
        normalize=True
    )
    elapsed = time.time() - start_time
    print(f"✅ Analyzed {len(trends['years'])} years in {elapsed:.2f} seconds")

    print("\n" + "="*80)
    print("EXPECTED IMPROVEMENTS:")
    print("- Original: 90+ seconds for 30 papers")
    print("- Optimized: <15 seconds for 30 papers (6x faster)")
    print("- Parallel queries: Near-linear scaling")
    print("="*80)

    searcher.close()


async def main():
    """Run performance tests"""
    await test_optimized_performance()


if __name__ == "__main__":
    asyncio.run(main())