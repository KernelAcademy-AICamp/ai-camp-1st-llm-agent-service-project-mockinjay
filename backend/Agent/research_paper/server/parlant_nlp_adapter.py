"""
Parlant NLP Service Adapter for HealthcareNLPService

This adapter wraps the custom HealthcareNLPService to make it compatible with
Parlant's NLPService interface, allowing you to use your custom, cost-effective
NLP service instead of the built-in providers.
"""

from __future__ import annotations
import os
import json
import logging
from pathlib import Path
from typing import Any, Mapping, Sequence, TypeVar, Generic, cast, get_args
from dataclasses import dataclass
from functools import cached_property

# Parlant imports
from parlant.core.nlp.service import NLPService
from parlant.core.nlp.generation import BaseSchematicGenerator, SchematicGenerationResult
from parlant.core.nlp.generation_info import GenerationInfo as ParlantGenerationInfo
from parlant.core.nlp.generation_info import UsageInfo as ParlantUsageInfo
from parlant.core.nlp.embedding import BaseEmbedder, EmbeddingResult
from parlant.core.nlp.moderation import BaseModerationService, ModerationCheck, NoModeration, CustomerModerationContext
from parlant.core.nlp.tokenization import EstimatingTokenizer
from parlant.core.engines.alpha.prompt_builder import PromptBuilder
from parlant.core.loggers import Logger
from parlant.core.meter import Meter
from parlant.core.nlp.policies import policy, retry
from typing_extensions import override

# Local imports
from nlp_service import HealthcareNLPService

logger = logging.getLogger(__name__)

T = TypeVar("T")


# ==================== Tokenizer ====================

class HealthcareTokenizer(EstimatingTokenizer):
    """Tokenizer adapter for HealthcareNLPService"""

    def __init__(self, healthcare_service: HealthcareNLPService):
        self._service = healthcare_service

    @override
    async def estimate_token_count(self, prompt: str) -> int:
        """Estimate token count using the healthcare service's tokenizer"""
        return self._service.count_tokens(prompt)


# ==================== Schematic Generator ====================

class HealthcareSchematicGenerator(BaseSchematicGenerator[T]):
    """
    Schematic generator that uses HealthcareNLPService's GPT-4o-mini
    to generate structured Pydantic models from prompts.

    Inherits from BaseSchematicGenerator for proper metrics and retry handling.
    """

    def __init__(
        self,
        healthcare_service: HealthcareNLPService,
        logger: Logger,
        meter: Meter,
    ):
        super().__init__(logger=logger, meter=meter, model_name="gpt-4o-mini")
        self._service = healthcare_service
        self._tokenizer = HealthcareTokenizer(healthcare_service)

    @override
    async def do_generate(
        self,
        prompt: str | PromptBuilder,
        hints: Mapping[str, Any] = {},
    ) -> SchematicGenerationResult[T]:
        """Generate structured content using GPT-4o-mini"""

        # Build the final prompt
        if isinstance(prompt, PromptBuilder):
            final_prompt = prompt.build()
        else:
            final_prompt = prompt

        # Get temperature from hints (default 0.7)
        temperature = hints.get("temperature", 0.7)
        max_tokens = hints.get("max_tokens", 2000)

        # Get JSON schema for the Pydantic model (using self.schema from BaseSchematicGenerator)
        schema = self.schema.model_json_schema()
        schema_name = schema.get("title", self.schema.__name__)

        # Add schema instruction to prompt
        schema_prompt = f"""{final_prompt}

You must respond with valid JSON that matches this schema:
{json.dumps(schema, indent=2)}

Respond ONLY with valid JSON, no additional text or explanations."""

        # Generate using healthcare service
        result = await self._service.generate_text(
            prompt=schema_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=False,
        )

        # Parse JSON response
        try:
            # Clean the response (remove markdown code blocks if present)
            content = result.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            # Remove control characters that can break JSON parsing
            # Keep newline (\n), carriage return (\r), and tab (\t)
            # This fixes "Invalid control character" errors
            import re
            content = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', content)

            # Parse JSON with strict=False to handle special characters
            parsed_json = json.loads(content, strict=False)
            pydantic_obj = self.schema.model_validate(parsed_json)

        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Raw response: {result.content}")
            raise ValueError(f"Failed to generate valid {schema_name}: {e}")

        # Build generation info - convert healthcare UsageInfo to Parlant UsageInfo
        healthcare_usage = result.info.usage
        parlant_usage = ParlantUsageInfo(
            input_tokens=healthcare_usage.input_tokens,
            output_tokens=healthcare_usage.output_tokens,
            extra={"cached_input_tokens": healthcare_usage.cached_input_tokens} if healthcare_usage.cached_input_tokens > 0 else None,
        )

        gen_info = ParlantGenerationInfo(
            schema_name=schema_name,
            model=f"openai/{self._service.generator.model_name}",
            duration=result.info.duration,
            usage=parlant_usage,
        )

        return SchematicGenerationResult(
            content=pydantic_obj,
            info=gen_info,
        )

    @property
    @override
    def id(self) -> str:
        """Return the model ID"""
        return f"openai/{self._service.generator.model_name}"

    @property
    @override
    def max_tokens(self) -> int:
        """Return max tokens (128K for GPT-4o-mini)"""
        return self._service.generator.max_tokens

    @property
    @override
    def tokenizer(self) -> EstimatingTokenizer:
        """Return the tokenizer"""
        return self._tokenizer


# ==================== Embedder ====================

class HealthcareEmbedder(BaseEmbedder):
    """
    Embedder adapter that uses HealthcareNLPService's
    text-embedding-3-small model.

    Inherits from BaseEmbedder for proper metrics and retry handling.
    """

    def __init__(
        self,
        healthcare_service: HealthcareNLPService,
        logger: Logger,
        meter: Meter,
    ):
        super().__init__(logger=logger, meter=meter, model_name="text-embedding-3-small")
        self._service = healthcare_service
        self._tokenizer = HealthcareTokenizer(healthcare_service)

    @override
    async def do_embed(
        self,
        texts: list[str],
        hints: Mapping[str, Any] = {},
    ) -> EmbeddingResult:
        """Generate embeddings using text-embedding-3-small"""

        use_local = hints.get("use_local", False)

        # Generate embeddings
        result = await self._service.get_embeddings(texts, use_local=use_local)

        # Convert to Parlant format
        return EmbeddingResult(vectors=result.vectors)

    @property
    @override
    def id(self) -> str:
        """Return the embedder model ID"""
        return f"openai/{self._service.embedder.model_name}"

    @property
    @override
    def max_tokens(self) -> int:
        """Return max tokens for embeddings (8192 for text-embedding-3-small)"""
        return self._service.embedder.max_tokens

    @property
    @override
    def tokenizer(self) -> EstimatingTokenizer:
        """Return the tokenizer"""
        return self._tokenizer

    @property
    @override
    def dimensions(self) -> int:
        """Return embedding dimensions (1536 for text-embedding-3-small)"""
        return self._service.embedder.dimensions


# ==================== Main NLP Service ====================

class ParlantHealthcareNLPService(NLPService):
    """
    Parlant-compatible NLP service using HealthcareNLPService.

    This service uses:
    - GPT-4o-mini for text generation (cost-effective)
    - text-embedding-3-small for embeddings (1536D)
    - Caching for performance optimization
    - Medical-specific capabilities

    IMPORTANT: Uses singleton pattern to prevent multiple initializations.
    """

    # Singleton instance of the core HealthcareNLPService
    _shared_healthcare_service: HealthcareNLPService | None = None

    def __init__(
        self,
        parlant_logger: Logger,
        parlant_meter: Meter,
        use_cache: bool = True,
        cache_dir: str = "./nlp_cache",
    ):
        self._logger = parlant_logger
        self._meter = parlant_meter

        # Use singleton pattern to prevent multiple initializations
        if ParlantHealthcareNLPService._shared_healthcare_service is None:
            self._logger.info("🔧 Initializing shared HealthcareNLPService (first time)...")
            ParlantHealthcareNLPService._shared_healthcare_service = HealthcareNLPService(
                use_cache=use_cache,
                cache_dir=cache_dir,
            )
        else:
            self._logger.info("♻️  Reusing existing HealthcareNLPService instance")

        self._healthcare_service = ParlantHealthcareNLPService._shared_healthcare_service

        self._logger.info("✅ Initialized ParlantHealthcareNLPService")
        self._logger.info(f"   - Generator: {self._healthcare_service.generator.model_name}")
        self._logger.info(f"   - Embedder: {self._healthcare_service.embedder.model_name}")
        self._logger.info(f"   - Cache: {'enabled' if use_cache else 'disabled'}")

    async def get_schematic_generator(self, t: type[T]) -> BaseSchematicGenerator[T]:
        """
        Return a schematic generator for the given Pydantic type.

        Following Parlant's pattern: creates a new generator instance for each schema type.
        """
        # Create generator instance with proper typing
        # Note: Each call creates a new generator - this is expected Parlant behavior
        generator = HealthcareSchematicGenerator(
            healthcare_service=self._healthcare_service,
            logger=self._logger,
            meter=self._meter,
        )
        # Set the __orig_class__ attribute for the schema property to work
        generator.__orig_class__ = HealthcareSchematicGenerator[t]  # type: ignore
        return generator  # type: ignore

    async def get_embedder(self) -> BaseEmbedder:
        """Return the embedder"""
        return HealthcareEmbedder(
            healthcare_service=self._healthcare_service,
            logger=self._logger,
            meter=self._meter,
        )

    async def get_moderation_service(self) -> ModerationService:
        """
        Return moderation service.

        Currently returns NoModeration. For production, you should
        implement proper content moderation.
        """
        return NoModeration()

    @staticmethod
    def verify_environment() -> str | None:
        """Verify that required environment variables are set"""
        return HealthcareNLPService.verify_environment()


# ==================== Factory Function ====================

def create_healthcare_nlp_service(container) -> ParlantHealthcareNLPService:
    """
    Factory function to create the healthcare NLP service.

    This is what you pass to p.Server(nlp_service=...).

    Args:
        container: Parlant's dependency injection container

    Returns:
        ParlantHealthcareNLPService instance
    """
    # Verify environment
    if error := ParlantHealthcareNLPService.verify_environment():
        raise RuntimeError(error)

    # Get logger and meter from container
    logger = container[Logger]
    meter = container[Meter]

    # Determine cache directory from environment variable or use default
    project_root = Path(__file__).parent.parent.parent.parent.parent
    default_cache_dir = project_root / ".cache" / "nlp_cache"
    cache_dir = os.getenv("NLP_CACHE_DIR", str(default_cache_dir))

    # Create and return the service
    return ParlantHealthcareNLPService(
        parlant_logger=logger,
        parlant_meter=meter,
        use_cache=True,  # Enable caching for cost savings
        cache_dir=cache_dir,  # Use centralized cache directory
    )
