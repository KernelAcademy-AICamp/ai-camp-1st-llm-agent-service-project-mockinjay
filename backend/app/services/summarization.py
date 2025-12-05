"""
Paper Summarization Service
Provides AI-based summarization of research papers
"""
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
import logging
import openai
from openai import AsyncOpenAI

load_dotenv()
logger = logging.getLogger(__name__)


class PaperSummarizationService:
    """AI-powered paper summarization service"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize summarization service

        Args:
            api_key: OpenAI API key (defaults to env variable)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("OpenAI API key not found. Summarization will be limited.")

        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    async def summarize_paper(
        self,
        paper: Dict,
        language: str = "ko"
    ) -> Dict:
        """
        Summarize a single paper

        Args:
            paper: Paper dictionary with title, abstract, etc.
            language: Target language for summary (ko/en)

        Returns:
            Dictionary with summary and key insights
        """
        if not self.client:
            return {
                "summary": paper.get("abstract", "초록 없음"),
                "key_findings": [],
                "clinical_significance": "",
                "error": "AI 요약 서비스가 설정되지 않았습니다."
            }

        try:
            title = paper.get("title", "제목 없음")
            abstract = paper.get("abstract", "")

            if not abstract:
                return {
                    "summary": "초록이 제공되지 않았습니다.",
                    "key_findings": [],
                    "clinical_significance": ""
                }

            prompt = self._build_single_paper_prompt(title, abstract, language)

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "당신은 의학 논문 요약 전문가입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800
            )

            summary_text = response.choices[0].message.content
            parsed = self._parse_summary_response(summary_text)

            return {
                "summary": parsed.get("summary", summary_text),
                "key_findings": parsed.get("key_findings", []),
                "clinical_significance": parsed.get("clinical_significance", ""),
                "tokens_used": response.usage.total_tokens
            }

        except Exception as e:
            logger.error(f"Error summarizing paper: {e}", exc_info=True)
            return {
                "summary": paper.get("abstract", "요약 생성 실패"),
                "key_findings": [],
                "clinical_significance": "",
                "error": str(e)
            }

    async def summarize_multiple_papers(
        self,
        papers: List[Dict],
        query: str,
        language: str = "ko",
        max_papers: int = 10
    ) -> Dict:
        """
        Create a comprehensive summary of multiple papers

        Args:
            papers: List of paper dictionaries
            query: Original search query for context
            language: Target language (ko/en)
            max_papers: Maximum number of papers to include

        Returns:
            Comprehensive analysis dictionary
        """
        if not self.client:
            return {
                "overview": f"{len(papers)}개의 논문이 검색되었습니다. AI 요약 기능이 비활성화되어 있습니다.",
                "key_themes": [],
                "research_trends": "",
                "clinical_implications": "",
                "recommendations": [],
                "error": "AI 요약 서비스가 설정되지 않았습니다."
            }

        if not papers:
            return {
                "overview": "검색 결과가 없습니다.",
                "key_themes": [],
                "research_trends": "",
                "clinical_implications": "",
                "recommendations": []
            }

        try:
            # Limit to max_papers
            selected_papers = papers[:max_papers]

            # Build condensed paper summaries
            paper_summaries = []
            for i, paper in enumerate(selected_papers, 1):
                title = paper.get("title", "제목 없음")
                abstract = paper.get("abstract", "")[:500]  # Limit abstract length
                pub_date = paper.get("pub_date", "날짜 미상")

                paper_summaries.append(
                    f"{i}. [{pub_date}] {title}\n   {abstract}..."
                )

            prompt = self._build_multiple_papers_prompt(
                query, paper_summaries, language, len(papers)
            )

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "당신은 의학 연구 동향 분석 전문가입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=1500
            )

            summary_text = response.choices[0].message.content
            parsed = self._parse_multiple_summary_response(summary_text)

            return {
                "overview": parsed.get("overview", summary_text),
                "key_themes": parsed.get("key_themes", []),
                "research_trends": parsed.get("research_trends", ""),
                "clinical_implications": parsed.get("clinical_implications", ""),
                "recommendations": parsed.get("recommendations", []),
                "papers_analyzed": len(selected_papers),
                "total_papers": len(papers),
                "tokens_used": response.usage.total_tokens
            }

        except Exception as e:
            logger.error(f"Error summarizing multiple papers: {e}", exc_info=True)
            return {
                "overview": f"{len(papers)}개의 논문이 검색되었으나 요약 생성에 실패했습니다.",
                "key_themes": [],
                "research_trends": "",
                "clinical_implications": "",
                "recommendations": [],
                "error": str(e)
            }

    def _build_single_paper_prompt(
        self,
        title: str,
        abstract: str,
        language: str
    ) -> str:
        """Build prompt for single paper summarization"""
        if language == "ko":
            return f"""다음 의학 논문을 분석하고 요약해주세요:

제목: {title}

초록:
{abstract}

다음 형식으로 응답해주세요:

**요약:**
[핵심 내용을 2-3문장으로 요약]

**주요 발견사항:**
- [발견사항 1]
- [발견사항 2]
- [발견사항 3]

**임상적 의의:**
[임상적으로 중요한 의미를 1-2문장으로 설명]
"""
        else:
            return f"""Analyze and summarize this medical research paper:

Title: {title}

Abstract:
{abstract}

Please respond in this format:

**Summary:**
[2-3 sentence summary of key points]

**Key Findings:**
- [Finding 1]
- [Finding 2]
- [Finding 3]

**Clinical Significance:**
[1-2 sentence explanation of clinical importance]
"""

    def _build_multiple_papers_prompt(
        self,
        query: str,
        paper_summaries: List[str],
        language: str,
        total_count: int
    ) -> str:
        """Build prompt for multiple papers analysis"""
        papers_text = "\n\n".join(paper_summaries)

        if language == "ko":
            return f"""다음은 "{query}"에 대한 최근 연구 논문들입니다 (총 {total_count}개 중 상위 논문):

{papers_text}

이 논문들을 종합적으로 분석하여 다음 형식으로 응답해주세요:

**전체 개요:**
[연구 주제와 전반적인 방향성을 3-4문장으로 설명]

**주요 연구 주제:**
- [주제 1]
- [주제 2]
- [주제 3]

**연구 동향:**
[최근 연구의 트렌드와 변화를 설명]

**임상적 시사점:**
[이러한 연구들이 임상에 미치는 영향을 설명]

**향후 연구 방향:**
- [추천 1]
- [추천 2]
- [추천 3]
"""
        else:
            return f"""Here are recent research papers on "{query}" (top papers from {total_count} total):

{papers_text}

Please provide a comprehensive analysis in this format:

**Overview:**
[3-4 sentence summary of the research topic and overall direction]

**Key Research Themes:**
- [Theme 1]
- [Theme 2]
- [Theme 3]

**Research Trends:**
[Describe recent trends and changes in the research]

**Clinical Implications:**
[Explain the clinical impact of these studies]

**Future Research Directions:**
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]
"""

    def _parse_summary_response(self, text: str) -> Dict:
        """Parse single paper summary response"""
        result = {
            "summary": "",
            "key_findings": [],
            "clinical_significance": ""
        }

        try:
            # Split by sections
            sections = text.split("**")
            current_section = None

            for section in sections:
                section = section.strip()
                if not section:
                    continue

                if "요약:" in section or "Summary:" in section:
                    current_section = "summary"
                    content = section.split(":", 1)[-1].strip()
                    result["summary"] = content
                elif "주요 발견" in section or "Key Finding" in section:
                    current_section = "findings"
                elif "임상적" in section or "Clinical" in section:
                    current_section = "clinical"
                    content = section.split(":", 1)[-1].strip()
                    result["clinical_significance"] = content
                elif current_section == "findings" and section.startswith("-"):
                    result["key_findings"].append(section[1:].strip())

            # Fallback: use entire text as summary if parsing fails
            if not result["summary"]:
                result["summary"] = text

        except Exception as e:
            logger.warning(f"Error parsing summary: {e}")
            result["summary"] = text

        return result

    def _parse_multiple_summary_response(self, text: str) -> Dict:
        """Parse multiple papers summary response with improved parsing"""
        result = {
            "overview": "",
            "key_themes": [],
            "research_trends": "",
            "clinical_implications": "",
            "recommendations": []
        }

        try:
            # Split by double asterisks to find sections
            lines = text.split('\n')
            current_section = None
            current_content = []

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # Check for section headers
                if "**전체 개요**" in line or "**Overview**" in line:
                    if current_section and current_content:
                        self._add_content_to_result(result, current_section, current_content)
                    current_section = "overview"
                    current_content = []
                    # Check if content is on same line
                    if ":" in line:
                        content = line.split(":", 1)[-1].strip()
                        if content:
                            current_content.append(content)
                elif "**주요 연구 주제**" in line or "**Key Research Themes**" in line:
                    if current_section and current_content:
                        self._add_content_to_result(result, current_section, current_content)
                    current_section = "themes"
                    current_content = []
                elif "**연구 동향**" in line or "**Research Trends**" in line:
                    if current_section and current_content:
                        self._add_content_to_result(result, current_section, current_content)
                    current_section = "trends"
                    current_content = []
                    if ":" in line:
                        content = line.split(":", 1)[-1].strip()
                        if content:
                            current_content.append(content)
                elif "**임상적 시사점**" in line or "**Clinical Implications**" in line:
                    if current_section and current_content:
                        self._add_content_to_result(result, current_section, current_content)
                    current_section = "clinical"
                    current_content = []
                    if ":" in line:
                        content = line.split(":", 1)[-1].strip()
                        if content:
                            current_content.append(content)
                elif "**향후 연구" in line or "**Future Research" in line:
                    if current_section and current_content:
                        self._add_content_to_result(result, current_section, current_content)
                    current_section = "recommendations"
                    current_content = []
                else:
                    # Content line
                    if current_section:
                        # Handle bullet points
                        if line.startswith("-") or line.startswith("•"):
                            clean_line = line[1:].strip()
                            if clean_line:
                                current_content.append(clean_line)
                        else:
                            current_content.append(line)

            # Add last section
            if current_section and current_content:
                self._add_content_to_result(result, current_section, current_content)

            # Fallback
            if not result["overview"]:
                result["overview"] = text

        except Exception as e:
            logger.warning(f"Error parsing multiple summary: {e}")
            result["overview"] = text

        return result

    def _add_content_to_result(self, result: Dict, section: str, content: List[str]):
        """Helper to add parsed content to result"""
        if section == "overview":
            result["overview"] = " ".join(content)
        elif section == "themes":
            result["key_themes"] = content
        elif section == "trends":
            result["research_trends"] = " ".join(content)
        elif section == "clinical":
            result["clinical_implications"] = " ".join(content)
        elif section == "recommendations":
            result["recommendations"] = content

    async def generate_one_line_summaries(
        self,
        papers: List[Dict],
        language: str = "ko"
    ) -> List[Dict]:
        """
        Generate one-line summaries for each paper

        Args:
            papers: List of paper dictionaries
            language: Target language (ko/en)

        Returns:
            List of papers with one_line_summary added
        """
        if not self.client:
            # Return papers with empty summaries
            for paper in papers:
                paper["one_line_summary"] = ""
            return papers

        if not papers:
            return papers

        try:
            # Build batch prompt for efficiency
            paper_texts = []
            for i, paper in enumerate(papers[:20], 1):  # Limit to 20 papers
                title = paper.get("title", "")
                abstract = paper.get("abstract", "")[:300]  # Limit abstract
                paper_texts.append(f"{i}. {title}\n{abstract}")

            papers_combined = "\n\n".join(paper_texts)

            if language == "ko":
                prompt = f"""다음 각 논문에 대해 한 줄 요약(15-25자)을 생성해주세요.
형식: 번호. 한 줄 요약

{papers_combined}

각 논문에 대해 핵심 내용을 한 줄로 요약해주세요:"""
            else:
                prompt = f"""Generate a one-line summary (10-20 words) for each paper.
Format: Number. One-line summary

{papers_combined}

Provide one-line summaries:"""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "당신은 의학 논문 요약 전문가입니다. 핵심만 간결하게 요약합니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )

            summary_text = response.choices[0].message.content

            # Parse summaries
            lines = summary_text.strip().split("\n")
            summaries = {}
            for line in lines:
                line = line.strip()
                if line and line[0].isdigit():
                    parts = line.split(".", 1)
                    if len(parts) == 2:
                        idx = int(parts[0]) - 1
                        summary = parts[1].strip()
                        summaries[idx] = summary

            # Add summaries to papers
            for i, paper in enumerate(papers[:20]):
                paper["one_line_summary"] = summaries.get(i, "")

            return papers

        except Exception as e:
            logger.error(f"Error generating one-line summaries: {e}", exc_info=True)
            for paper in papers:
                paper["one_line_summary"] = ""
            return papers

    async def translate_abstract(
        self,
        abstract: str,
        source_lang: str = "en",
        target_lang: str = "ko"
    ) -> str:
        """
        Translate abstract to target language

        Args:
            abstract: Original abstract text
            source_lang: Source language code
            target_lang: Target language code

        Returns:
            Translated abstract
        """
        if not self.client:
            return abstract

        if not abstract:
            return ""

        # Skip if already in target language (simple heuristic)
        korean_chars = sum(1 for c in abstract if '\uac00' <= c <= '\ud7a3')
        if target_lang == "ko" and korean_chars > len(abstract) * 0.3:
            return abstract  # Already mostly Korean

        try:
            if target_lang == "ko":
                prompt = f"""다음 영문 의학 논문 초록을 한국어로 번역해주세요.
의학 용어는 정확하게 번역하고, 자연스러운 한국어로 작성해주세요.

영문 초록:
{abstract}

한국어 번역:"""
            else:
                prompt = f"""Translate the following abstract to {target_lang}:

{abstract}

Translation:"""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "당신은 의학 문헌 번역 전문가입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=1500
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"Error translating abstract: {e}", exc_info=True)
            return abstract

    async def translate_papers_abstracts(
        self,
        papers: List[Dict],
        target_lang: str = "ko"
    ) -> List[Dict]:
        """
        Translate abstracts for multiple papers

        Args:
            papers: List of paper dictionaries
            target_lang: Target language code

        Returns:
            Papers with translated abstracts added
        """
        if not self.client:
            return papers

        import asyncio

        async def translate_one(paper: Dict) -> Dict:
            abstract = paper.get("abstract", "")
            if abstract:
                translated = await self.translate_abstract(abstract, "en", target_lang)
                paper["abstract_translated"] = translated
            else:
                paper["abstract_translated"] = ""
            return paper

        # Process in batches to avoid rate limits
        batch_size = 5
        for i in range(0, len(papers), batch_size):
            batch = papers[i:i+batch_size]
            tasks = [translate_one(paper) for paper in batch]
            await asyncio.gather(*tasks)

        return papers
