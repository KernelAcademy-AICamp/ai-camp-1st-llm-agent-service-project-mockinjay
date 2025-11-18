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
        Initialize the PaperSummarizationService with an optional OpenAI API key.
        
        If `api_key` is not provided, the constructor reads `OPENAI_API_KEY` from the environment.
        If no API key is available, the service logs a warning and leaves `self.client` as `None` (AI features disabled).
        Also sets `self.model` from the `OPENAI_MODEL` environment variable, defaulting to "gpt-4o-mini".
        
        Parameters:
            api_key (Optional[str]): Optional OpenAI API key; when omitted the `OPENAI_API_KEY` env var is used.
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
        Generate a structured summary for a single research paper.
        
        Produces a concise summary, a list of key findings, and a clinical significance note in the requested language. If the service's AI client is not configured, returns the paper's abstract (or a placeholder) and an `error` field; if the paper has no abstract, returns a message indicating the absence of an abstract.
        
        Parameters:
            paper (Dict): Paper metadata; expected keys include `title` and `abstract`.
            language (str): Target language for the summary ("ko" for Korean, "en" for English). Defaults to "ko".
        
        Returns:
            Dict: A dictionary containing:
                - summary (str): The generated summary text (or fallback text).
                - key_findings (List[str]): Extracted key findings as a list of short items.
                - clinical_significance (str): A short description of clinical implications.
                - tokens_used (int, optional): Total tokens consumed by the AI response when available.
                - error (str, optional): Error message when summarization could not be performed.
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
        Produce a consolidated analysis of multiple research papers tailored to the given query and language.
        
        Parameters:
            papers (List[Dict]): List of paper dictionaries; each may include keys like "title", "abstract", and "pub_date".
            query (str): Original search query or topic that provides context for the synthesis.
            language (str): Target language for the output ("ko" for Korean, otherwise English).
            max_papers (int): Maximum number of papers from `papers` to include in the analysis.
        
        Returns:
            Dict: A structured analysis containing:
                overview (str): High-level summary of the collection or the raw AI text if parsing failed.
                key_themes (List[str]): Extracted major research themes or topics.
                research_trends (str): Notable trends observed across the papers.
                clinical_implications (str): Practical or clinical significance derived from the papers.
                recommendations (List[str]): Suggested future directions or action items.
                papers_analyzed (int): Number of papers actually analyzed (capped by `max_papers`).
                total_papers (int): Total number of papers provided in `papers`.
                tokens_used (int): Token usage reported by the AI response (when available).
                error (str, optional): Error message when synthesis could not be produced or AI client is unavailable.
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
        """
        Constructs a language-specific prompt instructing the AI to analyze and summarize a single medical research paper.
        
        Parameters:
            title (str): Paper title to include in the prompt.
            abstract (str): Paper abstract to include in the prompt.
            language (str): Language code; if "ko", returns a Korean prompt, otherwise returns an English prompt.
        
        Returns:
            prompt (str): A formatted instruction prompt containing the title, abstract, and required response sections (summary, key findings, clinical significance).
        """
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
        """
        Construct a language-aware prompt that instructs the AI to analyze multiple papers and produce a structured multi-section summary.
        
        Parameters:
            query (str): The research query or topic to frame the analysis.
            paper_summaries (List[str]): Short text entries for each paper (title, brief abstract, date) to include in the prompt.
            language (str): Language code ("ko" for Korean) that selects the prompt language and section headings.
            total_count (int): Total number of candidate papers (used for context in the prompt header).
        
        Returns:
            str: A single prompt string containing the concatenated paper summaries and explicit instructions for the AI to return sections such as an overview, key research themes, research trends, clinical implications, and future research directions.
        """
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
        """
        Extract structured fields from a single-paper AI response text.
        
        Parameters:
            text (str): Raw text produced by the AI for a single-paper summary.
        
        Returns:
            result (Dict): Dictionary with parsed fields:
                summary (str): The main summary text; if no explicit summary section is found, the original `text` is used.
                key_findings (List[str]): List of individual finding bullet points extracted from the findings section.
                clinical_significance (str): Text describing the clinical significance, if present.
        """
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
        """
        Extracts structured fields from an AI-generated multi-paper analysis text.
        
        Parameters:
            text (str): Raw AI response containing sectioned analysis (Korean or English).
        
        Returns:
            Dict: Parsed fields:
                - overview (str): Overall summary of the provided papers (fallback to full text if parsing fails).
                - key_themes (List[str]): List of identified key research themes.
                - research_trends (str): Described research trends.
                - clinical_implications (str): Extracted clinical implications.
                - recommendations (List[str]): List of suggested future research directions.
        """
        result = {
            "overview": "",
            "key_themes": [],
            "research_trends": "",
            "clinical_implications": "",
            "recommendations": []
        }

        try:
            sections = text.split("**")
            current_section = None

            for section in sections:
                section = section.strip()
                if not section:
                    continue

                if "전체 개요" in section or "Overview" in section:
                    current_section = "overview"
                    content = section.split(":", 1)[-1].strip()
                    result["overview"] = content
                elif "주요 연구 주제" in section or "Key Research" in section:
                    current_section = "themes"
                elif "연구 동향" in section or "Research Trend" in section:
                    current_section = "trends"
                    content = section.split(":", 1)[-1].strip()
                    result["research_trends"] = content
                elif "임상적 시사점" in section or "Clinical Implication" in section:
                    current_section = "clinical"
                    content = section.split(":", 1)[-1].strip()
                    result["clinical_implications"] = content
                elif "향후 연구" in section or "Future Research" in section:
                    current_section = "recommendations"
                elif current_section == "themes" and section.startswith("-"):
                    result["key_themes"].append(section[1:].strip())
                elif current_section == "recommendations" and section.startswith("-"):
                    result["recommendations"].append(section[1:].strip())

            # Fallback
            if not result["overview"]:
                result["overview"] = text

        except Exception as e:
            logger.warning(f"Error parsing multiple summary: {e}")
            result["overview"] = text

        return result