import httpx
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
import asyncio
from dotenv import load_dotenv
import os
from deep_translator import GoogleTranslator
import re

load_dotenv()



class PubMedAdvancedSearch:
    """PubMed API 고급 검색 클래스 - efetch 활용"""

    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    def __init__(self, email: str = "your_email@example.com", api_key: Optional[str] = None):
        """
        Args:
            email: NCBI 정책상 필수 (API 속도 제한 완화)
            api_key: 선택 사항 (초당 10회 → 초당 100회)
        """
        self.email = email
        self.api_key = api_key
        self.rate_limit_delay = 0.1 if api_key else 0.34  # API key 유무에 따른 딜레이
        self.translator = GoogleTranslator(source='ko', target='en')

    def _contains_korean(self, text: str) -> bool:
        """Check if text contains Korean characters"""
        korean_pattern = re.compile('[가-힣]+')
        return bool(korean_pattern.search(text))

    def _translate_to_english(self, query: str) -> str:
        """Translate Korean query to English for PubMed search

        PubMed works best with English queries, so we automatically translate
        Korean text to English for better search results.

        Args:
            query: Original query (may be Korean or English)

        Returns:
            English query
        """
        if not query or not self._contains_korean(query):
            print(f"✅ Query is already in English: '{query}'")
            return query

        try:
            translated = self.translator.translate(query)
            print(f"🌐 Translated query: '{query}' → '{translated}'")
            return translated
        except Exception as e:
            print(f"⚠️ Translation failed: {e}, using original query")
            return query
    
    async def search_papers(
        self, 
        query: str, 
        max_results: int = 10,
        sort: str = "relevance"  # relevance, pub_date, Author
    ) -> List[Dict]:
        """논문 검색 및 상세 정보 수집
        
        Returns:
            [
                {
                    "pmid": "12345678",
                    "title": "...",
                    "abstract": "...",
                    "authors": ["Smith J", "Doe A"],
                    "journal": "Nature",
                    "pub_date": "2024-01-15",
                    "doi": "10.1038/...",
                    "keywords": ["kidney", "CKD"],
                    "mesh_terms": ["Renal Insufficiency, Chronic"],
                    "citations": 42,
                    "relevance_score": 0.95
                }
            ]
        """
        
        # Step 1: PMIDs 검색
        pmids = await self._search_pmids(query, max_results, sort)
        
        if not pmids:
            return []
        
        # Step 2: 상세 정보 가져오기
        papers = await self._fetch_details(pmids)
        
        return papers
    
    async def _search_pmids(self, query: str, max_results: int, sort: str) -> List[str]:
        """esearch로 PMID 리스트 가져오기"""
        
        params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "retmode": "json",
            "sort": sort,
            "email": self.email
        }
        
        if self.api_key:
            params["api_key"] = self.api_key
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(f"{self.BASE_URL}/esearch.fcgi", params=params)
                response.raise_for_status()
                data = response.json()
                
                pmids = data.get("esearchresult", {}).get("idlist", [])
                print(f"✅ PubMed 검색: '{query}' → {len(pmids)}개 발견")
                
                return pmids
            
            except Exception as e:
                print(f"⚠️ PubMed 검색 오류: {e}")
                return []
    
    async def _fetch_details(self, pmids: List[str]) -> List[Dict]:
        """efetch로 상세 정보 가져오기 (XML 파싱)"""
        
        # 배치 크기 제한 (한 번에 200개까지)
        batch_size = 200
        all_papers = []
        
        for i in range(0, len(pmids), batch_size):
            batch = pmids[i:i+batch_size]
            
            params = {
                "db": "pubmed",
                "id": ",".join(batch),
                "retmode": "xml",
                "rettype": "abstract",
                "email": self.email
            }
            
            if self.api_key:
                params["api_key"] = self.api_key
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                try:
                    response = await client.get(f"{self.BASE_URL}/efetch.fcgi", params=params)
                    response.raise_for_status()
                    
                    # XML 파싱
                    papers = self._parse_xml(response.text)
                    all_papers.extend(papers)
                    
                    # Rate limit 준수
                    await asyncio.sleep(self.rate_limit_delay)
                
                except Exception as e:
                    print(f"⚠️ efetch 오류 (batch {i//batch_size + 1}): {e}")
        
        print(f"✅ 상세 정보 수집 완료: {len(all_papers)}개")
        return all_papers
    
    def _parse_xml(self, xml_text: str) -> List[Dict]:
        """XML 응답 파싱"""
        soup = BeautifulSoup(xml_text, "xml")
        papers = []
        
        for article in soup.find_all("PubmedArticle"):
            try:
                # 기본 정보
                pmid = article.find("PMID").text if article.find("PMID") else ""
                
                # 제목
                title_elem = article.find("ArticleTitle")
                title = title_elem.text if title_elem else ""
                
                # 초록
                abstract_texts = article.find_all("AbstractText")
                abstract = " ".join([a.text for a in abstract_texts]) if abstract_texts else ""
                
                # 저자
                authors = []
                author_list = article.find("AuthorList")
                if author_list:
                    for author in author_list.find_all("Author"):
                        last_name = author.find("LastName")
                        fore_name = author.find("ForeName")
                        if last_name and fore_name:
                            authors.append(f"{last_name.text} {fore_name.text}")
                
                # 저널
                journal_elem = article.find("Journal")
                journal = ""
                if journal_elem:
                    journal_title = journal_elem.find("Title")
                    journal = journal_title.text if journal_title else ""
                
                # 출판일
                pub_date_elem = article.find("PubDate")
                pub_date = ""
                if pub_date_elem:
                    year = pub_date_elem.find("Year")
                    month = pub_date_elem.find("Month")
                    day = pub_date_elem.find("Day")
                    
                    year_str = year.text if year else "0000"
                    month_str = month.text if month else "01"
                    day_str = day.text if day else "01"
                    
                    # 월 이름 → 숫자 변환
                    month_map = {
                        "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
                        "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
                        "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
                    }
                    month_str = month_map.get(month_str, month_str)
                    
                    pub_date = f"{year_str}-{month_str}-{day_str}"
                
                # DOI
                doi = ""
                article_ids = article.find_all("ArticleId")
                for aid in article_ids:
                    if aid.get("IdType") == "doi":
                        doi = aid.text
                        break
                
                # MeSH 용어 (키워드)
                mesh_terms = []
                mesh_list = article.find("MeshHeadingList")
                if mesh_list:
                    for mesh in mesh_list.find_all("DescriptorName"):
                        mesh_terms.append(mesh.text)
                
                # 키워드
                keywords = []
                keyword_list = article.find("KeywordList")
                if keyword_list:
                    for kw in keyword_list.find_all("Keyword"):
                        keywords.append(kw.text)
                
                paper = {
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
                
                papers.append(paper)
            
            except Exception as e:
                print(f"⚠️ 논문 파싱 오류: {e}")
                continue
        
        return papers


# ==================== 사용 예시 ====================
async def test_pubmed_search():
    """테스트 코드"""
    
    searcher = PubMedAdvancedSearch(
        email=os.getenv("PUBMED_EMAIL"),  # 필수: 실제 이메일로 변경
        api_key=None  # 선택: NCBI API Key (https://www.ncbi.nlm.nih.gov/account/)
    )
    
    # 신장질환 검색
    papers = await searcher.search_papers(
        query="Thyroid Eye Disease",
        max_results=30,
        sort="relevance"
    )
    
    # 결과 출력
    for i, paper in enumerate(papers, 1):
        print(f"\n{'='*80}")
        print(f"[{i}] {paper['title']}")
        print(f"저자: {', '.join(paper['authors'][:3])}...")
        print(f"저널: {paper['journal']} ({paper['pub_date']})")
        print(f"DOI: {paper['doi']}")
        print(f"초록: {paper['abstract'][:200]}...")
        print(f"MeSH 용어: {', '.join(paper['mesh_terms'][:5])}")
        print(f"URL: {paper['url']}")


if __name__ == "__main__":
    asyncio.run(test_pubmed_search())
