"""
News Scraper Service - Improved Version
Scrapes CKD-related news from multiple Korean sources with stock image matching
"""
import feedparser
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Set, Optional
from datetime import datetime, timedelta
import logging
import hashlib
import re
from urllib.parse import urljoin, quote
import asyncio
import os

logger = logging.getLogger(__name__)

try:
    from deep_translator import GoogleTranslator
    from langdetect import detect, LangDetectException
    TRANSLATION_AVAILABLE = True
except ImportError:
    TRANSLATION_AVAILABLE = False
    logger.warning("Translation libraries not available. Install: pip install deep-translator langdetect")


class NewsScraperService:
    """Service for scraping CKD news with intelligent image matching"""

    # CKD Keywords (질환 + 복지 + 의료 통합)
    CKD_KEYWORDS = [
        # 질환 관련 (핵심)
        '콩팥', '신장병', '만성콩팥병', 'CKD', '만성신장', '만성신부전',
        '투석', '혈액투석', '복막투석', '투석환자', '인공신장',
        '신부전', '사구체', '크레아티닌', 'eGFR', 'GFR', '급성신부전',
        '신장이식', '신이식', '요독', '단백뇨', '사구체신염',
        '신장질환', '콩팥병', '콩팥질환', '신질환',

        # 영양 관련
        '저염식', '칼륨제한', '인제한', '저단백', '신장식단', '신장 질환식', '콩팥 식단',

        # 복지/지원 관련
        '장애인복지', '장애등급', '중증장애', '신장장애',
        '의료비지원', '산정특례', '본인부담금',
        '복지혜택', '복지카드', '장애인연금', '장애수당',

        # 지자체/정부 지원
        '긴급복지', '의료급여', '차상위', '기초생활',

        # 병원/의료
        '신장내과', '투석실', '투석병원', '야간투석', '주간투석',

        # 약/치료
        '신장약', '투석약', '면역억제제', 'ACE억제제', 'ARB',
        '에리스로포이에틴', 'ESA', '철분제', '인결합제',

        # 관련 단어 조합
        '콩팥 기능', '신장 기능', '콩팥 건강', '신장 건강'
    ]

    # Core CKD keywords (strict filtering)
    CORE_CKD_KEYWORDS = [
        '콩팥', '투석', '신부전', '신장병', '만성콩팥병', 'ckd',
        '신장이식', '신이식', '사구체', '크레아티닌', 'egfr',
        '혈액투석', '복막투석', '신장질환', '콩팥병', '급성신부전', '만성신부전'
    ]

    # Welfare-specific keywords (for government scraping)
    WELFARE_KEYWORDS = [
        '장애인', '복지', '지원', '혜택', '급여', '수당', '연금',
        '의료비', '산정특례', '본인부담', '건강보험', '의료급여',
        '신장', '투석', '콩팥', '만성질환', '중증질환',
    ]

    # Exclude keywords (핵심만 유지)
    EXCLUDE_KEYWORDS = [
        # 반려동물
        '고양이', '강아지', '반려동물', '애완동물', '펫', 'cat', 'dog', 'pet',
        # 명확히 관련 없는 질환만
        '전립선', '전립선암', '전립샘',
        # 정치/지명 (신장 = 新疆)
        '위구르', '신장위구르', '신장자치구', 'uyghur', 'xinjiang',
        # 에너지/기업 (명확한 것만)
        '태양광', '태양전지', '한화큐셀', '큐셀'
    ]

    # Stock Images (Unsplash free images)
    STOCK_IMAGES = {
        'kidney': [
            'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=250&fit=crop',
        ],
        'dialysis': [
            'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=250&fit=crop',
        ],
        'medical': [
            'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&h=250&fit=crop',
        ],
        'nutrition': [
            'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=400&h=250&fit=crop',
        ],
        'policy': [
            'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
        ],
        'default': [
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop',
            'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&h=250&fit=crop',
        ]
    }

    # Keyword → Image Category Mapping
    KEYWORD_TO_IMAGE_CATEGORY = {
        # Kidney related
        '콩팥': 'kidney', '신장': 'kidney', '신장병': 'kidney', 'CKD': 'kidney',
        '신부전': 'kidney', '사구체': 'kidney', '신장이식': 'kidney',

        # Dialysis related
        '투석': 'dialysis', '혈액투석': 'dialysis', '복막투석': 'dialysis',
        '투석실': 'dialysis', '인공신장': 'dialysis',

        # Nutrition related
        '영양': 'nutrition', '식단': 'nutrition', '저염': 'nutrition',
        '칼륨': 'nutrition', '나트륨': 'nutrition', '인제한': 'nutrition',
        '저단백': 'nutrition',

        # Policy/Welfare related
        '복지': 'policy', '지원': 'policy', '혜택': 'policy', '급여': 'policy',
        '장애인': 'policy', '장애등급': 'policy', '산정특례': 'policy',
        '의료비': 'policy', '건강보험': 'policy', '의료급여': 'policy',
        '지자체': 'policy', '정부': 'policy', '정책': 'policy',

        # Hospital/Medical related
        '병원': 'medical', '대학병원': 'medical', '종합병원': 'medical',
        '신장내과': 'medical', '비뇨기과': 'medical', '의사': 'medical',
        '진료': 'medical', '검사': 'medical', '치료': 'medical',

        # Medicine related
        '약': 'medical', '신장약': 'medical', '면역억제제': 'medical',
        '혈압약': 'medical', '처방': 'medical', '복용': 'medical',
    }

    # RSS Sources
    RSS_SOURCES = {
        'newswire_health': {
            'url': 'https://api.newswire.co.kr/rss/industry/1000',
            'name': '뉴스와이어',
            'category': 'medical'
        },
        'bosa': {
            'url': 'http://www.bosa.co.kr/rss/allArticle.xml',
            'name': '보건의료연합신문',
            'category': 'medical'
        }
    }

    # NewsAPI Configuration
    NEWSAPI_KEY = os.getenv('NEWSAPI_KEY', '86a87fc6634f41759e4399af71178930')

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.seen_hashes: Set[str] = set()
        self.timeout = 10
        self._cache: Optional[List[Dict[str, Any]]] = None
        self._cache_time: Optional[datetime] = None
        self._cache_duration = timedelta(minutes=30)  # 30 minute cache (reduced for testing)

    def _generate_hash(self, title: str, source: str) -> str:
        """Generate unique hash for deduplication"""
        content = f"{title.lower().strip()}_{source.lower().strip()}"
        return hashlib.md5(content.encode()).hexdigest()

    def _contains_keywords(self, text: str, strict: bool = True) -> bool:
        """Check if text contains CKD keywords"""
        text_lower = text.lower()

        # First exclude unwanted content
        if any(kw.lower() in text_lower for kw in self.EXCLUDE_KEYWORDS):
            return False

        # Use strict filtering - must have CORE CKD keyword
        if strict:
            has_core_keyword = any(kw in text_lower for kw in self.CORE_CKD_KEYWORDS)
            return has_core_keyword

        # Lenient mode - accept broader medical keywords
        has_keyword = any(kw.lower() in text_lower for kw in self.CKD_KEYWORDS)
        return has_keyword

    def _calculate_relevance(self, title: str, description: str) -> int:
        """Calculate relevance score (0-100)"""
        text = f"{title} {description}".lower()
        score = 0

        for kw in self.CKD_KEYWORDS:
            if kw.lower() in text:
                score += 10

        return min(score, 100)

    def _get_image_category_from_text(self, text: str) -> str:
        """Get image category based on text keywords"""
        if not text:
            return 'default'

        for keyword, category in self.KEYWORD_TO_IMAGE_CATEGORY.items():
            if keyword in text:
                return category

        # Fallback to medical for general medical terms
        medical_keywords = ['병원', '의사', '치료', '약', '환자', '의료', '건강', '질환', '질병']
        if any(kw in text for kw in medical_keywords):
            return 'medical'

        return 'default'

    def _get_consistent_image(self, text: str, category: str) -> str:
        """Get consistent stock image based on text hash"""
        images = self.STOCK_IMAGES.get(category, self.STOCK_IMAGES['default'])
        text_hash = int(hashlib.md5(text.encode()).hexdigest(), 16)
        index = text_hash % len(images)
        return images[index]

    def _assign_stock_image(self, title: str, summary: str = '', category: str = '') -> str:
        """Assign stock image URL to article"""
        combined_text = f"{title} {summary}"
        image_category = self._get_image_category_from_text(combined_text)

        # Override with category if specified
        if category:
            if 'nutrition' in category:
                image_category = 'nutrition'
            elif 'policy' in category or 'welfare' in category:
                image_category = 'policy'

        return self._get_consistent_image(title, image_category)

    def _clean_html(self, html_text: str) -> str:
        """Remove HTML tags and clean text"""
        if not html_text:
            return ""

        try:
            soup = BeautifulSoup(html_text, 'html.parser')
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            text = soup.get_text()
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            return text
        except:
            return html_text

    def _extract_image_from_html(self, html_text: str) -> Optional[str]:
        """Extract image URL from HTML"""
        if not html_text:
            return None

        try:
            soup = BeautifulSoup(html_text, 'html.parser')
            img = soup.find('img')
            if img and img.get('src'):
                return img.get('src')
        except:
            pass
        return None

    def _extract_matched_keywords(self, text: str) -> List[str]:
        """Extract matched keywords from text"""
        text_lower = text.lower()
        matched = []

        for kw in self.CKD_KEYWORDS:
            if kw.lower() in text_lower:
                matched.append(kw)

        return list(set(matched))[:5]

    def _format_relative_time(self, published_at: Optional[str]) -> str:
        """Format datetime to relative time"""
        if not published_at:
            return '최근'

        try:
            pub_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
            now = datetime.now(pub_date.tzinfo)
            diff = now - pub_date

            if diff.days > 30:
                return f"{diff.days // 30}개월전"
            elif diff.days > 0:
                return f"{diff.days}일전"
            elif diff.seconds >= 3600:
                return f"{diff.seconds // 3600}시간전"
            elif diff.seconds >= 60:
                return f"{diff.seconds // 60}분전"
            else:
                return "방금 전"
        except:
            return '최근'

    def _is_korean(self, text: str) -> bool:
        """Check if text is primarily Korean"""
        if not text:
            return True  # Default to Korean

        # Count Korean characters
        korean_chars = sum(1 for c in text if '\uac00' <= c <= '\ud7a3' or '\u3131' <= c <= '\u318e')
        total_chars = len([c for c in text if not c.isspace()])

        if total_chars == 0:
            return True

        # If more than 30% Korean, consider it Korean
        return (korean_chars / total_chars) > 0.3

    def _translate_to_korean(self, text: str) -> str:
        """Translate text to Korean if it's not already Korean (fast version)"""
        if not text or not TRANSLATION_AVAILABLE:
            return text

        # Quick return for Korean text (no need for heavy processing)
        if self._is_korean(text):
            return text

        try:
            # Only translate short texts to save time
            # For descriptions, we'll just show original if not Korean
            if len(text) > 100:
                return text  # Skip translation for long text to save time

            # Simple translation for short text only
            translator = GoogleTranslator(source='auto', target='ko')
            translated = translator.translate(text)
            return translated if translated else text

        except Exception as e:
            logger.debug(f"Translation skipped for '{text[:30]}...'")
            return text  # Return original on error

    # ==================== Source Scrapers ====================

    async def fetch_newsapi(self) -> List[Dict[str, Any]]:
        """Fetch from NewsAPI.org"""
        news_items = []

        try:
            logger.info("Fetching from NewsAPI...")

            # Simplified query - just main keywords
            query = '신장 OR 콩팥 OR 투석 OR CKD OR 신부전'

            url = "https://newsapi.org/v2/everything"
            params = {
                "q": query,
                "language": "ko",
                "sortBy": "publishedAt",
                "pageSize": 100,  # Maximum allowed by NewsAPI
                "apiKey": self.NEWSAPI_KEY
            }

            response = self.session.get(url, params=params, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"NewsAPI returned {len(data.get('articles', []))} articles")

                for article in data.get('articles', []):
                    title = article.get('title') or ''
                    description = article.get('description') or ''

                    # Filter using our keyword checker (which excludes pets)
                    if not self._contains_keywords(f"{title} {description}"):
                        continue

                    item_hash = self._generate_hash(title, article.get('source', {}).get('name', 'NewsAPI'))
                    if item_hash in self.seen_hashes:
                        continue
                    self.seen_hashes.add(item_hash)

                    # Skip translation for now - too slow
                    # translated_title = self._translate_to_korean(title) if len(title) < 150 else title

                    news_items.append({
                        'id': item_hash,
                        'title': title,
                        'description': description[:200] if description else '',
                        'source': article.get('source', {}).get('name', 'Unknown'),
                        'category': 'medical',
                        'url': article.get('url') or '',
                        'published_at': article.get('publishedAt') or '',
                        'image': article.get('urlToImage'),
                        'relevance_score': self._calculate_relevance(title, description),
                        'keywords': self._extract_matched_keywords(f"{title} {description}")
                    })

            logger.info(f"Fetched {len(news_items)} from NewsAPI (after filtering)")
        except Exception as e:
            logger.error(f"NewsAPI error: {e}", exc_info=True)

        return news_items

    async def fetch_rss_news(self, source_key: str) -> List[Dict[str, Any]]:
        """Fetch news from RSS feed"""
        source = self.RSS_SOURCES.get(source_key)
        if not source:
            return []

        news_items = []
        try:
            logger.info(f"Fetching RSS from {source['name']}...")
            feed = feedparser.parse(source['url'])
            logger.info(f"RSS {source['name']} returned {len(feed.entries)} entries")

            for entry in feed.entries[:100]:  # Process more entries
                title = entry.get('title', '')
                description = entry.get('description', entry.get('summary', ''))

                # Apply strict CKD keyword filtering
                if not self._contains_keywords(f"{title} {description}", strict=True):
                    continue

                item_hash = self._generate_hash(title, source['name'])
                if item_hash in self.seen_hashes:
                    continue
                self.seen_hashes.add(item_hash)

                # Extract image from description for newswire
                image_url = None
                if source_key == 'newswire_health':
                    image_url = self._extract_image_from_html(description)

                clean_summary = self._clean_html(description)
                clean_title = self._clean_html(title)

                # Skip translation for now - too slow
                # translated_title = self._translate_to_korean(clean_title) if len(clean_title) < 150 else clean_title

                news_items.append({
                    'id': item_hash,
                    'title': clean_title,
                    'description': clean_summary[:200] if clean_summary else '',
                    'source': source['name'],
                    'category': source['category'],
                    'url': entry.get('link', ''),
                    'published_at': entry.get('published', entry.get('pubDate', '')),
                    'image': image_url,
                    'relevance_score': self._calculate_relevance(title, description),
                    'keywords': self._extract_matched_keywords(f"{title} {description}")
                })

            logger.info(f"Fetched {len(news_items)} from {source['name']} (after filtering)")
        except Exception as e:
            logger.error(f"RSS error ({source_key}): {e}", exc_info=True)

        return news_items

    async def scrape_mohw(self) -> List[Dict[str, Any]]:
        """Scrape Ministry of Health and Welfare (보건복지부)"""
        news_items = []
        url = "https://www.mohw.go.kr/board.es?mid=a10503010100&bid=0027"

        try:
            logger.info("Scraping MOHW...")
            response = self.session.get(url, timeout=self.timeout)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')
            rows = soup.select('table tbody tr, ul.board_list li')
            logger.info(f"MOHW found {len(rows)} rows")

            for row in rows[:100]:  # Process more rows
                try:
                    title_elem = row.select_one('a')
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)

                    # Apply lenient CKD keyword filtering (includes welfare keywords)
                    if not self._contains_keywords(title, strict=False):
                        continue

                    href = title_elem.get('href', '')
                    if href and not href.startswith('http'):
                        href = 'https://www.mohw.go.kr' + href

                    date_elem = row.select_one('.date, td:nth-child(4)')
                    date_str = date_elem.get_text(strip=True) if date_elem else ''

                    item_hash = self._generate_hash(title, '보건복지부')
                    if item_hash in self.seen_hashes:
                        continue
                    self.seen_hashes.add(item_hash)

                    news_items.append({
                        'id': item_hash,
                        'title': title,
                        'description': '',
                        'source': '보건복지부',
                        'category': 'policy',
                        'url': href,
                        'published_at': date_str,
                        'image': None,
                        'relevance_score': self._calculate_relevance(title, ''),
                        'keywords': self._extract_matched_keywords(title)
                    })
                except:
                    continue

            logger.info(f"Scraped {len(news_items)} from MOHW (after filtering)")
        except Exception as e:
            logger.error(f"MOHW scraping error: {e}", exc_info=True)

        return news_items

    async def scrape_kdca(self) -> List[Dict[str, Any]]:
        """Scrape Korea Disease Control and Prevention Agency (질병관리청)"""
        news_items = []
        url = "https://www.kdca.go.kr/board/board.es?mid=a20501010000&bid=0015"

        try:
            logger.info("Scraping KDCA...")
            response = self.session.get(url, timeout=self.timeout)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')
            rows = soup.select('table tbody tr')

            for row in rows[:20]:
                try:
                    title_elem = row.select_one('a')
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)

                    if not self._contains_keywords(title):
                        continue

                    href = title_elem.get('href', '')
                    if href and not href.startswith('http'):
                        href = 'https://www.kdca.go.kr' + href

                    item_hash = self._generate_hash(title, '질병관리청')
                    if item_hash in self.seen_hashes:
                        continue
                    self.seen_hashes.add(item_hash)

                    news_items.append({
                        'id': item_hash,
                        'title': title,
                        'description': '',
                        'source': '질병관리청',
                        'category': 'policy',
                        'url': href,
                        'published_at': '',
                        'image': None,
                        'relevance_score': self._calculate_relevance(title, ''),
                        'keywords': self._extract_matched_keywords(title)
                    })
                except:
                    continue

            logger.info(f"Scraped {len(news_items)} from KDCA")
        except Exception as e:
            logger.error(f"KDCA scraping error: {e}", exc_info=True)

        return news_items

    async def scrape_mfds(self) -> List[Dict[str, Any]]:
        """Scrape Ministry of Food and Drug Safety (식품의약품안전처)"""
        news_items = []
        url = "https://www.mfds.go.kr/brd/m_99/list.do"

        try:
            logger.info("Scraping MFDS...")
            response = self.session.get(url, timeout=self.timeout)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')
            rows = soup.select('table tbody tr')

            food_keywords = self.CKD_KEYWORDS + ['저염', '나트륨', '칼륨', '인', '영양']

            for row in rows[:20]:
                try:
                    title_elem = row.select_one('a')
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)

                    if not any(kw in title for kw in food_keywords):
                        continue

                    href = title_elem.get('href', '')
                    if href and not href.startswith('http'):
                        href = 'https://www.mfds.go.kr' + href

                    item_hash = self._generate_hash(title, '식품의약품안전처')
                    if item_hash in self.seen_hashes:
                        continue
                    self.seen_hashes.add(item_hash)

                    news_items.append({
                        'id': item_hash,
                        'title': title,
                        'description': '',
                        'source': '식품의약품안전처',
                        'category': 'nutrition',
                        'url': href,
                        'published_at': '',
                        'image': None,
                        'relevance_score': self._calculate_relevance(title, ''),
                        'keywords': self._extract_matched_keywords(title)
                    })
                except:
                    continue

            logger.info(f"Scraped {len(news_items)} from MFDS")
        except Exception as e:
            logger.error(f"MFDS scraping error: {e}", exc_info=True)

        return news_items

    # ==================== Main Entry Point ====================

    async def get_all_news(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get all news from all sources"""

        # Check cache
        if self._cache is not None and self._cache_time is not None:
            if datetime.now() - self._cache_time < self._cache_duration:
                logger.info(f"Returning cached news: {len(self._cache)} items available, returning {min(len(self._cache), limit)}")
                return self._cache[:limit]

        print("=" * 80)
        print("🔄 Cache expired or empty, fetching fresh news...")
        print("=" * 80)
        all_news = []

        # Fetch from NewsAPI
        try:
            newsapi_news = await self.fetch_newsapi()
            all_news.extend(newsapi_news)
            print(f"✅ NewsAPI: {len(newsapi_news)} items collected")
        except Exception as e:
            print(f"❌ NewsAPI failed: {e}")
            logger.error(f"NewsAPI failed: {e}")

        # Fetch from RSS sources
        for source_key in self.RSS_SOURCES.keys():
            try:
                rss_news = await self.fetch_rss_news(source_key)
                all_news.extend(rss_news)
                print(f"✅ RSS {source_key}: {len(rss_news)} items collected")
            except Exception as e:
                print(f"❌ RSS {source_key} failed: {e}")
                logger.error(f"RSS {source_key} failed: {e}")

        # Scrape government sites
        try:
            mohw_news = await self.scrape_mohw()
            all_news.extend(mohw_news)
            print(f"✅ 보건복지부: {len(mohw_news)} items collected")
        except Exception as e:
            print(f"❌ 보건복지부 failed: {e}")
            logger.error(f"MOHW failed: {e}")

        try:
            kdca_news = await self.scrape_kdca()
            all_news.extend(kdca_news)
            print(f"✅ 질병관리청: {len(kdca_news)} items collected")
        except Exception as e:
            print(f"❌ 질병관리청 failed: {e}")
            logger.error(f"KDCA failed: {e}")

        try:
            mfds_news = await self.scrape_mfds()
            all_news.extend(mfds_news)
            print(f"✅ 식약처: {len(mfds_news)} items collected")
        except Exception as e:
            print(f"❌ 식약처 failed: {e}")
            logger.error(f"MFDS failed: {e}")

        # Assign stock images to items without images
        for item in all_news:
            if not item['image']:
                item['image'] = self._assign_stock_image(
                    item['title'],
                    item['description'],
                    item['category']
                )

        # Sort by date and relevance
        all_news.sort(key=lambda x: (
            x['published_at'] or '1970-01-01',
            x['relevance_score']
        ), reverse=True)

        # Format for frontend
        formatted_news = []
        for item in all_news[:limit]:
            formatted_news.append({
                'id': item['id'],
                'title': item['title'],
                'description': item['description'][:200] + '...' if len(item['description']) > 200 else item['description'],
                'source': item['source'],
                'category': item['category'],
                'url': item['url'],
                'time': self._format_relative_time(item['published_at']),
                'published_at': item['published_at'],
                'image': item['image'],
                'relevance_score': item['relevance_score'],
                'keywords': item['keywords']
            })

        # Update cache
        self._cache = formatted_news
        self._cache_time = datetime.now()

        print("=" * 80)
        print(f"📊 SUMMARY: Total collected: {len(all_news)}, Returning: {len(formatted_news)}/{limit}")
        print("=" * 80)
        logger.info(f"Total collected: {len(all_news)}, After limit: {len(formatted_news)}, Requested: {limit}")
        return formatted_news
