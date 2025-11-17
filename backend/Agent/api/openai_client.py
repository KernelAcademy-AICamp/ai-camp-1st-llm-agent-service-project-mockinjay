"""
OpenAI Client for Agent System
Provides GPT-based text generation and embeddings
"""
import os
import logging
from typing import List, Dict, Optional
from openai import AsyncOpenAI
import tiktoken

logger = logging.getLogger(__name__)


class OpenAIClient:
    """OpenAI API client for text generation and embeddings"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o-mini",
        embedding_model: str = "text-embedding-3-small"
    ):
        """
        Initialize OpenAI client

        Args:
            api_key: OpenAI API key
            model: GPT model to use
            embedding_model: Embedding model to use
        """
        self.client = AsyncOpenAI(
            api_key=api_key or os.getenv('OPENAI_API_KEY')
        )
        self.model = model
        self.embedding_model = embedding_model

        # Tokenizer for token counting
        try:
            self.tokenizer = tiktoken.encoding_for_model(model)
        except:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.tokenizer.encode(text))

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict:
        """
        Generate text using GPT

        Args:
            prompt: User prompt
            system_prompt: System prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate

        Returns:
            Dictionary with 'text' and 'tokens_used'
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )

            return {
                "text": response.choices[0].message.content,
                "tokens_used": response.usage.total_tokens,
                "model": self.model
            }

        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            raise

    async def generate_nutrition_advice(
        self,
        query: str,
        nutrition_data: Dict,
        profile: str
    ) -> str:
        """
        Generate nutrition advice

        Args:
            query: User query
            nutrition_data: Nutrition data context
            profile: User profile

        Returns:
            Generated advice
        """
        system_prompt = """당신은 전문 영양사입니다.
        환자의 건강 상태와 프로필을 고려하여 맞춤형 영양 조언을 제공합니다.
        과학적 근거를 바탕으로 명확하고 실용적인 조언을 제공하세요."""

        prompt = f"""
사용자 질문: {query}
사용자 프로필: {profile}

영양 데이터:
- 영양소: {nutrition_data.get('nutrients', {})}
- 제한사항: {nutrition_data.get('restrictions', [])}
- 권장사항: {nutrition_data.get('recommendations', [])}

위 정보를 바탕으로 맞춤형 영양 조언을 제공해주세요.
구체적인 식품 예시와 섭취량을 포함해주세요.
        """

        result = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.7
        )

        return result['text']

    async def generate_medical_answer(
        self,
        query: str,
        search_results: List[Dict],
        papers: List[Dict],
        context: Dict
    ) -> Dict:
        """
        Generate medical answer based on search results

        Args:
            query: User query
            search_results: Search results from databases
            papers: Research papers
            context: Additional context

        Returns:
            Dictionary with 'text' and 'tokens'
        """
        system_prompt = """당신은 의료 정보 전문가입니다.
        제공된 의료 데이터와 연구 논문을 바탕으로 정확하고 신뢰할 수 있는 답변을 제공합니다.
        항상 출처를 명시하고, 전문의 상담의 필요성을 언급하세요."""

        # Prepare context from search results
        context_text = "검색 결과:\n"
        for i, result in enumerate(search_results[:5], 1):
            if 'question' in result:
                context_text += f"{i}. Q: {result['question']}\n   A: {result.get('answer', '')[:200]}...\n"
            elif 'title' in result:
                context_text += f"{i}. {result['title']}\n   {result.get('abstract', '')[:200]}...\n"
            else:
                context_text += f"{i}. {result.get('text', '')[:200]}...\n"

        # Add papers if available
        if papers:
            context_text += "\n관련 연구 논문:\n"
            for i, paper in enumerate(papers[:3], 1):
                context_text += f"{i}. {paper.get('title', '')}\n   {paper.get('abstract', '')[:200]}...\n"

        prompt = f"""
사용자 질문: {query}

{context_text}

위 정보를 바탕으로 사용자의 질문에 답변해주세요.
답변은 다음 형식을 따라주세요:
1. 핵심 답변
2. 상세 설명
3. 주의사항
4. 추가 참고사항
        """

        result = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.7
        )

        return {
            "text": result['text'],
            "tokens": result['tokens_used']
        }

    async def create_embedding(self, text: str) -> List[float]:
        """
        Create embedding for text

        Args:
            text: Input text

        Returns:
            Embedding vector
        """
        try:
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )

            return response.data[0].embedding

        except Exception as e:
            logger.error(f"OpenAI embedding error: {e}")
            raise

    async def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Create embeddings for multiple texts

        Args:
            texts: List of input texts

        Returns:
            List of embedding vectors
        """
        try:
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=texts
            )

            return [item.embedding for item in response.data]

        except Exception as e:
            logger.error(f"OpenAI batch embedding error: {e}")
            raise
