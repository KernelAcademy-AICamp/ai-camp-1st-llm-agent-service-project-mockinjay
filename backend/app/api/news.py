"""
News API Router
Handles kidney/health-related news from multiple sources:
1. GNews API (free tier: 100 requests/day)
2. RSS Feeds (unlimited, no API key required)
3. NewsData.io (fallback, 200 requests/day)
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
import httpx
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import hashlib
import asyncio
import xml.etree.ElementTree as ET

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/news", tags=["news"])

# API Configuration
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY", "")
GNEWS_BASE_URL = "https://gnews.io/api/v4/search"

NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY", "")
NEWSDATA_BASE_URL = "https://newsdata.io/api/1/news"

# RSS Feed URLs - Health/Kidney related
RSS_FEEDS = {
    "en": [
        # Medical News Today
        "https://www.medicalnewstoday.com/rss",
        # ScienceDaily Health
        "https://www.sciencedaily.com/rss/health_medicine.xml",
        # NIH News
        "https://www.nih.gov/rss/news_releases.xml",
        # WebMD Health News
        "https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC",
    ],
    "ko": [
        # Korean Health News RSS feeds
        "https://news.google.com/rss/search?q=%EC%8B%A0%EC%9E%A5+%EA%B1%B4%EA%B0%95&hl=ko&gl=KR&ceid=KR:ko",
        "https://news.google.com/rss/search?q=%EB%A7%8C%EC%84%B1%EC%8B%A0%EC%9E%A5%EC%A7%88%ED%99%98&hl=ko&gl=KR&ceid=KR:ko",
    ]
}

# In-memory cache for news
_news_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 6 * 3600  # Cache for 6 hours


# ==================== Cache Helper Functions ====================

def get_cache_key(source: str, language: str, page: int) -> str:
    """Generate cache key for news query"""
    return f"{source}:{language}:{page}"


def is_cache_valid(timestamp: float) -> bool:
    """Check if cache is still valid"""
    return (datetime.now().timestamp() - timestamp) < CACHE_TTL


def get_cached_news(source: str, language: str, page: int) -> Optional[Dict[str, Any]]:
    """Get cached news if available and valid"""
    cache_key = get_cache_key(source, language, page)
    if cache_key in _news_cache:
        cached_data = _news_cache[cache_key]
        if is_cache_valid(cached_data["timestamp"]):
            logger.info(f"Cache hit for news: {cache_key}")
            return cached_data["data"]
        else:
            del _news_cache[cache_key]
            logger.info(f"Cache expired for news: {cache_key}")
    return None


def set_cached_news(source: str, language: str, page: int, data: Dict[str, Any]):
    """Cache news data"""
    cache_key = get_cache_key(source, language, page)
    _news_cache[cache_key] = {
        "data": data,
        "timestamp": datetime.now().timestamp()
    }
    logger.info(f"Cached news: {cache_key}")


# ==================== Request/Response Models ====================

class NewsRequest(BaseModel):
    """Request model for news search"""
    query: str = Field(default="kidney disease", description="Search query")
    language: str = Field(default="en", description="Language code (ko, en)")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=10, ge=1, le=50, description="Results per page")
    source: str = Field(default="auto", description="News source: auto, gnews, rss, newsdata")


class NewsArticle(BaseModel):
    """Single news article"""
    id: str
    title: str
    titleOriginal: Optional[str] = None  # Original title (for translation feature)
    description: Optional[str] = None
    descriptionOriginal: Optional[str] = None  # Original description
    content: Optional[str] = None
    source: str
    sourceIcon: Optional[str] = None
    pubDate: str
    time: str  # Relative time like "2 hours ago"
    image: Optional[str] = None
    link: str
    category: Optional[List[str]] = None
    language: str = "en"  # Article language


class NewsResponse(BaseModel):
    """Response model for news list"""
    articles: List[NewsArticle]
    totalResults: int
    status: str
    nextPage: Optional[str] = None
    cached: bool = False
    sourceUsed: str = "unknown"  # Which source was used


# ==================== Helper Functions ====================

def format_relative_time(pub_date: str, language: str = "en") -> str:
    """Convert publication date to relative time string"""
    try:
        # Try various date formats
        dt = None
        for fmt in [
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d %H:%M:%S",
            "%a, %d %b %Y %H:%M:%S %z",
            "%a, %d %b %Y %H:%M:%S GMT",
            "%Y-%m-%d",
        ]:
            try:
                dt = datetime.strptime(pub_date.split("+")[0].strip(), fmt.replace(" %z", ""))
                break
            except ValueError:
                continue

        if not dt:
            return pub_date

        now = datetime.now()
        diff = now - dt

        if language == "ko":
            if diff.days == 0:
                hours = diff.seconds // 3600
                if hours == 0:
                    minutes = diff.seconds // 60
                    return f"{minutes}분 전" if minutes > 0 else "방금 전"
                return f"{hours}시간 전"
            elif diff.days == 1:
                return "1일 전"
            elif diff.days < 7:
                return f"{diff.days}일 전"
            elif diff.days < 30:
                weeks = diff.days // 7
                return f"{weeks}주 전"
            else:
                months = diff.days // 30
                return f"{months}개월 전"
        else:
            if diff.days == 0:
                hours = diff.seconds // 3600
                if hours == 0:
                    minutes = diff.seconds // 60
                    return f"{minutes}m ago" if minutes > 0 else "just now"
                return f"{hours}h ago"
            elif diff.days == 1:
                return "1 day ago"
            elif diff.days < 7:
                return f"{diff.days} days ago"
            elif diff.days < 30:
                weeks = diff.days // 7
                return f"{weeks}w ago"
            else:
                months = diff.days // 30
                return f"{months}mo ago"

    except Exception:
        return pub_date


def generate_article_id(article: Dict[str, Any]) -> str:
    """Generate unique ID for article"""
    unique_str = f"{article.get('title', '')}{article.get('pubDate', '')}{article.get('source', '')}"
    return hashlib.md5(unique_str.encode()).hexdigest()[:12]


# ==================== RSS Feed Parser ====================

async def fetch_rss_feed(url: str, timeout: float = 10.0) -> List[Dict[str, Any]]:
    """Fetch and parse an RSS feed"""
    articles = []

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, follow_redirects=True)

        if response.status_code != 200:
            logger.warning(f"RSS feed {url} returned status {response.status_code}")
            return []

        # Parse XML
        root = ET.fromstring(response.text)

        # Handle different RSS formats
        items = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")

        for item in items[:15]:  # Limit to 15 per feed
            # Standard RSS
            title = item.findtext("title") or item.findtext("{http://www.w3.org/2005/Atom}title") or ""
            description = item.findtext("description") or item.findtext("{http://www.w3.org/2005/Atom}summary") or ""
            link = item.findtext("link") or ""

            # Try to get link from Atom format
            if not link:
                link_elem = item.find("{http://www.w3.org/2005/Atom}link")
                if link_elem is not None:
                    link = link_elem.get("href", "")

            pub_date = item.findtext("pubDate") or item.findtext("{http://www.w3.org/2005/Atom}published") or ""

            # Get source
            source = item.findtext("source") or ""
            if not source:
                # Try to extract from URL
                from urllib.parse import urlparse
                parsed = urlparse(url)
                source = parsed.netloc.replace("www.", "").replace("rss.", "")

            # Get image (if available)
            image = None
            media_content = item.find("{http://search.yahoo.com/mrss/}content")
            if media_content is not None:
                image = media_content.get("url")

            enclosure = item.find("enclosure")
            if enclosure is not None and not image:
                if enclosure.get("type", "").startswith("image"):
                    image = enclosure.get("url")

            if title:
                articles.append({
                    "title": title.strip(),
                    "description": description.strip()[:500] if description else None,
                    "link": link.strip(),
                    "pubDate": pub_date,
                    "source": source,
                    "image": image,
                })

    except ET.ParseError as e:
        logger.warning(f"XML parse error for {url}: {e}")
    except Exception as e:
        logger.warning(f"Error fetching RSS {url}: {e}")

    return articles


async def fetch_all_rss_feeds(language: str = "en") -> List[NewsArticle]:
    """Fetch news from all RSS feeds for a language"""
    feeds = RSS_FEEDS.get(language, RSS_FEEDS["en"])

    # Fetch all feeds concurrently
    tasks = [fetch_rss_feed(url) for url in feeds]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_articles = []
    for result in results:
        if isinstance(result, list):
            all_articles.extend(result)

    # Convert to NewsArticle and deduplicate
    seen_titles = set()
    news_articles = []

    for article in all_articles:
        title = article.get("title", "")
        if title and title not in seen_titles:
            seen_titles.add(title)
            news_articles.append(NewsArticle(
                id=generate_article_id(article),
                title=title,
                titleOriginal=title,
                description=article.get("description"),
                descriptionOriginal=article.get("description"),
                source=article.get("source", "RSS"),
                pubDate=article.get("pubDate", ""),
                time=format_relative_time(article.get("pubDate", ""), language),
                image=article.get("image"),
                link=article.get("link", "#"),
                language=language,
            ))

    # Sort by date (newest first)
    news_articles.sort(key=lambda x: x.pubDate, reverse=True)

    return news_articles[:20]  # Return top 20


# ==================== GNews API ====================

async def fetch_gnews(query: str, language: str = "en", max_results: int = 10) -> List[NewsArticle]:
    """Fetch news from GNews API"""
    if not GNEWS_API_KEY:
        logger.warning("GNEWS_API_KEY not set")
        return []

    try:
        # GNews language codes
        lang_map = {"ko": "ko", "en": "en"}
        country_map = {"ko": "kr", "en": "us"}

        params = {
            "apikey": GNEWS_API_KEY,
            "q": query,
            "lang": lang_map.get(language, "en"),
            "country": country_map.get(language, "us"),
            "max": max_results,
            "in": "title,description",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(GNEWS_BASE_URL, params=params)

        if response.status_code != 200:
            logger.error(f"GNews API error: {response.status_code}")
            return []

        data = response.json()
        articles = []

        for item in data.get("articles", []):
            articles.append(NewsArticle(
                id=generate_article_id({"title": item.get("title", ""), "pubDate": item.get("publishedAt", ""), "source": item.get("source", {}).get("name", "")}),
                title=item.get("title", ""),
                titleOriginal=item.get("title"),
                description=item.get("description"),
                descriptionOriginal=item.get("description"),
                content=item.get("content"),
                source=item.get("source", {}).get("name", "Unknown"),
                sourceIcon=None,
                pubDate=item.get("publishedAt", ""),
                time=format_relative_time(item.get("publishedAt", ""), language),
                image=item.get("image"),
                link=item.get("url", "#"),
                language=language,
            ))

        return articles

    except Exception as e:
        logger.error(f"GNews API error: {e}")
        return []


# ==================== NewsData.io API ====================

async def fetch_newsdata(query: str, language: str = "en", page_size: int = 10) -> List[NewsArticle]:
    """Fetch news from NewsData.io API"""
    if not NEWSDATA_API_KEY:
        logger.warning("NEWSDATA_API_KEY not set")
        return []

    try:
        search_queries = {
            "ko": "신장 OR 만성신장질환 OR 투석 OR 신장이식 OR CKD",
            "en": "kidney OR chronic kidney disease OR dialysis OR kidney transplant OR CKD"
        }
        search_query = search_queries.get(language, search_queries["en"])

        params = {
            "apikey": NEWSDATA_API_KEY,
            "q": search_query,
            "language": language,
            "category": "health",
            "size": page_size,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(NEWSDATA_BASE_URL, params=params)

        if response.status_code != 200:
            logger.error(f"NewsData API error: {response.status_code}")
            return []

        data = response.json()

        if data.get("status") != "success":
            return []

        articles = []
        for result in data.get("results", []):
            articles.append(NewsArticle(
                id=generate_article_id(result),
                title=result.get("title", ""),
                titleOriginal=result.get("title"),
                description=result.get("description"),
                descriptionOriginal=result.get("description"),
                content=result.get("content"),
                source=result.get("source_name", result.get("source_id", "Unknown")),
                sourceIcon=result.get("source_icon"),
                pubDate=result.get("pubDate", ""),
                time=format_relative_time(result.get("pubDate", ""), language),
                image=result.get("image_url"),
                link=result.get("link", "#"),
                category=result.get("category", []),
                language=language,
            ))

        return articles

    except Exception as e:
        logger.error(f"NewsData API error: {e}")
        return []


# ==================== Mock Data (Fallback) ====================

def get_mock_news(language: str = "en") -> List[NewsArticle]:
    """Get mock news articles as fallback"""
    if language == "ko":
        mock_data = [
            {
                "id": "mock1",
                "title": "신장 건강 지키는 새로운 식단 가이드라인 발표",
                "description": "대한신장학회가 만성 신장 질환 환자를 위한 최신 식단 가이드라인을 발표했습니다. 저염식과 저단백 식단의 중요성을 강조하며, 단계별 맞춤 영양 관리 방법을 제시했습니다.",
                "source": "메디컬타임즈",
                "time": "2시간 전",
                "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
                "link": "#",
            },
            {
                "id": "mock2",
                "title": "조기 진단이 핵심, 신장병 예방 건강검진 확대",
                "description": "보건복지부가 만성 신장 질환의 조기 발견을 위해 국가건강검진 항목에 신장 기능 검사를 추가하기로 했습니다.",
                "source": "헬스조선",
                "time": "5시간 전",
                "image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
                "link": "#",
            },
            {
                "id": "mock3",
                "title": "투석 환자 삶의 질 개선 위한 신기술 개발",
                "description": "서울대병원 연구팀이 투석 시간을 단축하고 효율을 높이는 새로운 혈액 투석 기술을 개발했습니다.",
                "source": "청년의사",
                "time": "1일 전",
                "image": "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=300&fit=crop",
                "link": "#",
            },
        ]
    else:
        mock_data = [
            {
                "id": "mock1",
                "title": "New Dietary Guidelines for Kidney Health Released",
                "description": "The National Kidney Foundation has released updated dietary guidelines for patients with chronic kidney disease. The guidelines emphasize the importance of low-sodium and protein-managed diets.",
                "source": "Medical News Today",
                "time": "2h ago",
                "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
                "link": "#",
            },
            {
                "id": "mock2",
                "title": "Early Detection Key: Kidney Screening Programs Expand",
                "description": "Health authorities are expanding kidney function screening in routine checkups to catch chronic kidney disease earlier.",
                "source": "Health Daily",
                "time": "5h ago",
                "image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
                "link": "#",
            },
            {
                "id": "mock3",
                "title": "Breakthrough in Dialysis Technology Improves Patient Quality of Life",
                "description": "Researchers have developed a new dialysis technique that reduces treatment time while improving efficiency.",
                "source": "Science Medical",
                "time": "1d ago",
                "image": "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=300&fit=crop",
                "link": "#",
            },
            {
                "id": "mock4",
                "title": "Study Links Mediterranean Diet to Better Kidney Outcomes",
                "description": "A new study shows that following a Mediterranean diet may help slow the progression of chronic kidney disease.",
                "source": "Nephrology Weekly",
                "time": "2d ago",
                "image": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&h=300&fit=crop",
                "link": "#",
            },
            {
                "id": "mock5",
                "title": "Global Initiative Launched to Address Kidney Disease Burden",
                "description": "International health organizations unite to launch a comprehensive program to reduce the global burden of kidney disease.",
                "source": "WHO News",
                "time": "3d ago",
                "image": "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop",
                "link": "#",
            },
        ]

    return [
        NewsArticle(
            id=item["id"],
            title=item["title"],
            titleOriginal=item["title"],
            description=item["description"],
            descriptionOriginal=item["description"],
            source=item["source"],
            pubDate=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            time=item["time"],
            image=item["image"],
            link=item["link"],
            language=language,
        )
        for item in mock_data
    ]


# ==================== API Endpoints ====================

@router.post("/list", response_model=NewsResponse)
async def get_news_list(request: NewsRequest):
    """
    Get kidney/health related news articles from multiple sources

    Sources tried in order (auto mode):
    1. GNews API (if API key available)
    2. RSS Feeds (always available)
    3. NewsData.io (if API key available)
    4. Mock data (fallback)
    """
    try:
        # Check cache first
        cached = get_cached_news(request.source, request.language, request.page)
        if cached:
            cached["cached"] = True
            return NewsResponse(**cached)

        articles: List[NewsArticle] = []
        source_used = "unknown"

        # Determine which source to use
        if request.source == "gnews" or (request.source == "auto" and GNEWS_API_KEY):
            # Try GNews first
            query = "kidney health" if request.language == "en" else "신장 건강"
            articles = await fetch_gnews(query, request.language, request.page_size)
            if articles:
                source_used = "gnews"

        if not articles and (request.source == "rss" or request.source == "auto"):
            # Try RSS feeds
            articles = await fetch_all_rss_feeds(request.language)
            if articles:
                source_used = "rss"

        if not articles and (request.source == "newsdata" or request.source == "auto"):
            # Try NewsData.io
            articles = await fetch_newsdata(request.query, request.language, request.page_size)
            if articles:
                source_used = "newsdata"

        # Fallback to mock data
        if not articles:
            logger.info("Using mock news data as fallback")
            articles = get_mock_news(request.language)
            source_used = "mock"

        response_data = {
            "articles": articles[:request.page_size],
            "totalResults": len(articles),
            "status": "success",
            "nextPage": None,
            "cached": False,
            "sourceUsed": source_used,
        }

        # Cache the response
        set_cached_news(request.source, request.language, request.page, response_data)

        return NewsResponse(**response_data)

    except Exception as e:
        logger.error(f"Error fetching news: {e}", exc_info=True)
        # Return mock data on error
        mock_articles = get_mock_news(request.language)
        return NewsResponse(
            articles=mock_articles,
            totalResults=len(mock_articles),
            status="success",
            cached=False,
            sourceUsed="mock"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for news API"""
    return {
        "status": "healthy",
        "service": "news_api",
        "gnews_configured": bool(GNEWS_API_KEY),
        "newsdata_configured": bool(NEWSDATA_API_KEY),
        "rss_feeds_available": len(RSS_FEEDS.get("en", [])) + len(RSS_FEEDS.get("ko", [])),
        "cache_entries": len(_news_cache)
    }


@router.post("/clear-cache")
async def clear_cache():
    """Clear news cache (admin endpoint)"""
    global _news_cache
    count = len(_news_cache)
    _news_cache = {}
    return {"status": "success", "cleared_entries": count}


@router.get("/sources")
async def get_available_sources():
    """Get list of available news sources"""
    return {
        "sources": [
            {
                "id": "auto",
                "name": "Auto (Best Available)",
                "description": "Automatically selects the best available source",
                "available": True,
            },
            {
                "id": "gnews",
                "name": "GNews API",
                "description": "Global news aggregator",
                "available": bool(GNEWS_API_KEY),
            },
            {
                "id": "rss",
                "name": "RSS Feeds",
                "description": "Direct RSS feeds from medical news sites",
                "available": True,
            },
            {
                "id": "newsdata",
                "name": "NewsData.io",
                "description": "News data API",
                "available": bool(NEWSDATA_API_KEY),
            },
        ],
        "languages": [
            {"code": "en", "name": "English"},
            {"code": "ko", "name": "한국어"},
        ]
    }
