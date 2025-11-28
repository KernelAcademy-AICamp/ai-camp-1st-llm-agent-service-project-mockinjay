"""
Advanced Components for Healthcare Chat System

This module contains all Phase 3 advanced components:
- Hybrid Scoring System
- Query Router
- Medical Embeddings
- Query Decomposition
- Cross-Encoder Re-ranking
- Performance Monitor
"""

import asyncio
import time
import logging
from typing import List, Dict, Optional, Tuple, Any
from functools import lru_cache
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
import torch
from transformers import AutoTokenizer, AutoModel
import hashlib
from collections import defaultdict
from datetime import datetime, timedelta

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ==================== Phase 3.1: Hybrid Scoring System ====================

class HybridScoringSystem:
    """Advanced hybrid scoring with adaptive weights"""

    def __init__(self):
        self.default_weights = {
            "semantic": 0.4,
            "keyword": 0.3,
            "relevance": 0.2,
            "recency": 0.1
        }
        self.adaptive_weights = self.default_weights.copy()
        self.score_history = []

    def calculate_hybrid_score(
        self,
        semantic_score: float,
        keyword_score: float,
        metadata: Dict,
        query_type: str = "general"
    ) -> float:
        """
        Calculate hybrid score with adaptive weighting

        Args:
            semantic_score: Cosine similarity from vector search
            keyword_score: BM25/TF-IDF score from text search
            metadata: Document metadata
            query_type: Type of query for weight adjustment

        Returns:
            Final hybrid score
        """
        # Adjust weights based on query type
        weights = self._get_adaptive_weights(query_type)

        # Calculate relevance score from metadata
        relevance_score = self._calculate_relevance(metadata)

        # Calculate recency score
        recency_score = self._calculate_recency(metadata)

        # Combine scores
        final_score = (
            weights["semantic"] * semantic_score +
            weights["keyword"] * keyword_score +
            weights["relevance"] * relevance_score +
            weights["recency"] * recency_score
        )

        # Apply boost for documents found in both searches
        if semantic_score > 0 and keyword_score > 0:
            final_score *= 1.2  # 20% boost for intersection

        # Store for learning
        self.score_history.append({
            "scores": {
                "semantic": semantic_score,
                "keyword": keyword_score,
                "relevance": relevance_score,
                "recency": recency_score
            },
            "final": final_score,
            "query_type": query_type
        })

        return min(final_score, 1.0)  # Cap at 1.0

    def _get_adaptive_weights(self, query_type: str) -> Dict[str, float]:
        """Get adaptive weights based on query type"""
        if query_type == "clinical":
            return {
                "semantic": 0.3,
                "keyword": 0.4,
                "relevance": 0.25,
                "recency": 0.05
            }
        elif query_type == "research":
            return {
                "semantic": 0.45,
                "keyword": 0.25,
                "relevance": 0.15,
                "recency": 0.15
            }
        elif query_type == "guideline":
            return {
                "semantic": 0.35,
                "keyword": 0.35,
                "relevance": 0.25,
                "recency": 0.05
            }
        else:
            return self.adaptive_weights

    def _calculate_relevance(self, metadata: Dict) -> float:
        """Calculate relevance score from metadata"""
        score = 0.5  # Base score

        # Boost for certain sources
        if metadata.get("source") in ["PubMed", "Cochrane", "UpToDate"]:
            score += 0.2

        # Boost for guidelines
        if metadata.get("category") == "guideline":
            score += 0.15

        # Boost for high-impact journals
        journal = metadata.get("journal", "").lower()
        if any(j in journal for j in ["nejm", "lancet", "jama", "nature", "science"]):
            score += 0.15

        return min(score, 1.0)

    def _calculate_recency(self, metadata: Dict) -> float:
        """Calculate recency score"""
        pub_date = metadata.get("publication_date", "")
        if not pub_date:
            return 0.3  # Default for unknown date

        try:
            # Parse date
            if isinstance(pub_date, str):
                year = int(pub_date[:4])
            else:
                year = pub_date.year

            current_year = datetime.now().year
            years_old = current_year - year

            # Calculate score (exponential decay)
            if years_old <= 1:
                return 1.0
            elif years_old <= 3:
                return 0.8
            elif years_old <= 5:
                return 0.6
            elif years_old <= 10:
                return 0.4
            else:
                return 0.2

        except Exception as e:
            # 날짜 파싱 실패, 기본값 반환 (Date parsing failed, return default)
            logger.warning(f"Failed to parse publication date '{pub_date}': {e}")
            return 0.3


# ==================== Phase 3.2: Query Router ====================

class QueryRouter:
    """Intelligent query routing based on intent classification"""

    def __init__(self):
        self.patterns = {
            "clinical": [
                "treatment", "diagnosis", "symptoms", "prognosis",
                "therapy", "medication", "dosage", "side effects"
            ],
            "research": [
                "study", "trial", "research", "evidence", "meta-analysis",
                "systematic review", "randomized", "cohort"
            ],
            "guideline": [
                "guideline", "recommendation", "protocol", "standard",
                "best practice", "consensus", "society", "association"
            ],
            "patient": [
                "patient", "explain", "what is", "how does", "simple",
                "understanding", "lifestyle", "diet"
            ]
        }

    def classify_query(self, query: str) -> Tuple[str, float]:
        """
        Classify query intent

        Returns:
            Tuple of (query_type, confidence)
        """
        query_lower = query.lower()
        scores = {}

        for query_type, keywords in self.patterns.items():
            score = sum(1 for keyword in keywords if keyword in query_lower)
            scores[query_type] = score

        # Get best match
        if max(scores.values()) > 0:
            query_type = max(scores, key=scores.get)
            confidence = scores[query_type] / len(self.patterns[query_type])
        else:
            query_type = "general"
            confidence = 0.5

        return query_type, confidence

    def route_query(self, query: str) -> Dict:
        """
        Route query to appropriate search strategy

        Returns:
            Routing configuration
        """
        query_type, confidence = self.classify_query(query)

        routing = {
            "query_type": query_type,
            "confidence": confidence,
            "search_strategy": self._get_search_strategy(query_type),
            "sources": self._get_recommended_sources(query_type),
            "filters": self._get_recommended_filters(query_type)
        }

        return routing

    def _get_search_strategy(self, query_type: str) -> str:
        """Get recommended search strategy"""
        strategies = {
            "clinical": "keyword_first",  # Precise medical terms important
            "research": "semantic_first",  # Concept understanding important
            "guideline": "hybrid_equal",   # Both important
            "patient": "semantic_first",   # Natural language understanding
            "general": "hybrid_equal"
        }
        return strategies.get(query_type, "hybrid_equal")

    def _get_recommended_sources(self, query_type: str) -> List[str]:
        """Get recommended data sources"""
        sources = {
            "clinical": ["guidelines", "qa", "medical"],
            "research": ["papers", "pubmed"],
            "guideline": ["guidelines", "papers"],
            "patient": ["qa", "medical"],
            "general": ["qa", "papers", "medical", "guidelines"]
        }
        return sources.get(query_type, ["qa", "papers", "medical"])

    def _get_recommended_filters(self, query_type: str) -> Dict:
        """Get recommended search filters"""
        filters = {
            "clinical": {"category": "treatment", "recency": 5},
            "research": {"study_type": ["RCT", "meta-analysis"], "recency": 3},
            "guideline": {"category": "guideline", "recency": 5},
            "patient": {"readability": "simple"},
            "general": {}
        }
        return filters.get(query_type, {})


# ==================== Phase 3.3: Medical Embeddings ====================

class MedicalEmbeddings:
    """Medical-specific embeddings using specialized models"""

    def __init__(self, model_name: str = "dmis-lab/biobert-base-cased-v1.2"):
        """
        Initialize medical embedding model

        Args:
            model_name: BioBERT or other medical model
        """
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self._initialize_model()

    def _initialize_model(self):
        """Load medical embedding model"""
        try:
            logger.info(f"Loading medical embedding model: {self.model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            self.model.eval()
            logger.info("Medical embedding model loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load medical model, falling back to general: {e}")
            # Fallback to general model
            self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

    @lru_cache(maxsize=1000)
    def encode(self, text: str) -> np.ndarray:
        """
        Generate medical embedding

        Args:
            text: Medical text

        Returns:
            Embedding vector
        """
        if isinstance(self.model, SentenceTransformer):
            return self.model.encode(text, normalize_embeddings=True)

        # Use BioBERT or similar
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=512
        )

        with torch.no_grad():
            outputs = self.model(**inputs)
            # Use CLS token embedding
            embedding = outputs.last_hidden_state[:, 0, :].numpy()

        # Normalize
        embedding = embedding / np.linalg.norm(embedding)

        return embedding.squeeze()

    def expand_with_umls(self, text: str) -> str:
        """
        Expand query with UMLS synonyms (simplified version)

        In production, this would connect to UMLS API
        """
        # Simplified medical synonym expansion
        synonyms = {
            "ckd": ["chronic kidney disease", "chronic renal failure"],
            "diabetes": ["diabetes mellitus", "DM", "high blood sugar"],
            "hypertension": ["high blood pressure", "HTN", "elevated BP"],
            "mi": ["myocardial infarction", "heart attack"],
            "chf": ["congestive heart failure", "heart failure"]
        }

        expanded = text
        for abbrev, syns in synonyms.items():
            if abbrev in text.lower():
                expanded += " " + " ".join(syns)

        return expanded


# ==================== Phase 3.4: Query Decomposition ====================

class QueryDecomposer:
    """Decompose complex queries into sub-queries"""

    def __init__(self):
        self.decomposition_patterns = [
            # Condition + treatment
            (r"(.+) treatment for (.+)", ["treatment {1}", "{0}"]),
            # Multiple conditions
            (r"(.+) and (.+) and (.+)", ["{0}", "{1}", "{2}"]),
            (r"(.+) and (.+)", ["{0}", "{1}"]),
            # Comparison
            (r"(.+) vs (.+)", ["{0}", "{1}", "comparison {0} {1}"]),
            # With complication
            (r"(.+) with (.+)", ["{0}", "{1}", "{0} complicated by {1}"])
        ]

    def decompose(self, query: str) -> List[str]:
        """
        Decompose complex query into sub-queries

        Args:
            query: Complex query

        Returns:
            List of sub-queries
        """
        sub_queries = []

        # Check for medical question patterns
        if self._is_complex_query(query):
            # Extract medical entities
            entities = self._extract_medical_entities(query)

            if len(entities) > 1:
                # Create sub-queries for each entity
                for entity in entities:
                    sub_queries.append(entity)

                # Add combination query
                sub_queries.append(" ".join(entities))

            # Add aspect-based queries
            aspects = self._extract_aspects(query)
            for aspect in aspects:
                for entity in entities:
                    sub_queries.append(f"{entity} {aspect}")

        # If no decomposition, return original
        if not sub_queries:
            sub_queries = [query]

        return list(set(sub_queries))  # Remove duplicates

    def _is_complex_query(self, query: str) -> bool:
        """Check if query is complex"""
        indicators = ["and", "with", "vs", "versus", "or", "including", "especially"]
        word_count = len(query.split())

        return (
            word_count > 5 or
            any(indicator in query.lower() for indicator in indicators)
        )

    def _extract_medical_entities(self, query: str) -> List[str]:
        """Extract medical entities from query (simplified)"""
        # In production, use NER model
        entities = []

        # Common medical conditions
        conditions = [
            "kidney disease", "diabetes", "hypertension", "heart failure",
            "ckd", "cancer", "infection", "anemia", "proteinuria"
        ]

        for condition in conditions:
            if condition in query.lower():
                entities.append(condition)

        return entities

    def _extract_aspects(self, query: str) -> List[str]:
        """Extract query aspects (treatment, diagnosis, etc.)"""
        aspects = []

        aspect_keywords = {
            "treatment": ["treatment", "therapy", "medication", "drug"],
            "diagnosis": ["diagnosis", "diagnostic", "test", "screening"],
            "prognosis": ["prognosis", "outcome", "survival"],
            "prevention": ["prevention", "prevent", "prophylaxis"],
            "complications": ["complications", "side effects", "adverse"]
        }

        for aspect, keywords in aspect_keywords.items():
            if any(keyword in query.lower() for keyword in keywords):
                aspects.append(aspect)

        return aspects


# ==================== Phase 3.5: Cross-Encoder Re-ranking ====================

class CrossEncoderReranker:
    """Re-rank search results using cross-encoder"""

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """Initialize cross-encoder for re-ranking"""
        try:
            self.model = CrossEncoder(model_name)
            logger.info(f"Cross-encoder loaded: {model_name}")
        except Exception as e:
            logger.warning(f"Failed to load cross-encoder: {e}")
            self.model = None

    def rerank(
        self,
        query: str,
        documents: List[Dict],
        top_k: int = 10,
        text_field: str = "text"
    ) -> List[Dict]:
        """
        Re-rank documents using cross-encoder

        Args:
            query: Search query
            documents: List of documents to re-rank
            top_k: Number of top results to return
            text_field: Field containing document text

        Returns:
            Re-ranked documents
        """
        if not self.model or not documents:
            return documents[:top_k]

        # Prepare query-document pairs
        pairs = []
        for doc in documents:
            text = doc.get(text_field, "")
            if not text:
                # Try alternative fields
                text = doc.get("abstract", doc.get("answer", doc.get("title", "")))
            pairs.append([query, text[:512]])  # Limit text length

        # Get cross-encoder scores
        try:
            scores = self.model.predict(pairs)

            # Add scores to documents
            for doc, score in zip(documents, scores):
                doc["rerank_score"] = float(score)

            # Sort by rerank score
            reranked = sorted(
                documents,
                key=lambda x: x.get("rerank_score", 0),
                reverse=True
            )

            return reranked[:top_k]

        except Exception as e:
            logger.warning(f"Re-ranking failed: {e}")
            return documents[:top_k]


# ==================== Phase 3.7: Performance Monitor ====================

class PerformanceMonitor:
    """Monitor and track system performance"""

    def __init__(self):
        self.metrics = defaultdict(list)
        self.thresholds = {
            "response_time": 2.0,  # seconds
            "cache_hit_rate": 0.3,  # 30%
            "error_rate": 0.05  # 5%
        }

        # Search-specific tracking
        self.total_searches = 0
        self.search_latencies = []

    def record_metric(self, metric_name: str, value: float, timestamp: datetime = None):
        """Record a performance metric"""
        if timestamp is None:
            timestamp = datetime.now()

        self.metrics[metric_name].append({
            "value": value,
            "timestamp": timestamp
        })

        # Check thresholds
        self._check_threshold(metric_name, value)

    def log_search(self, query: str, latency: float, result_count: int):
        """Log search performance"""
        self.total_searches += 1
        self.search_latencies.append(latency)

        # Keep only last 1000 latencies to avoid memory issues
        if len(self.search_latencies) > 1000:
            self.search_latencies = self.search_latencies[-1000:]

        # Record as metrics
        self.record_metric("search_latency", latency)
        self.record_metric("result_count", result_count)

    def get_stats(self) -> Dict:
        """Get performance statistics for searches"""
        if not self.search_latencies:
            return {
                "total_searches": 0,
                "avg_latency": 0.0,
                "p95_latency": 0.0,
                "p99_latency": 0.0
            }

        return {
            "total_searches": self.total_searches,
            "avg_latency": np.mean(self.search_latencies),
            "median_latency": np.median(self.search_latencies),
            "p95_latency": np.percentile(self.search_latencies, 95),
            "p99_latency": np.percentile(self.search_latencies, 99),
            "min_latency": np.min(self.search_latencies),
            "max_latency": np.max(self.search_latencies)
        }

    def _check_threshold(self, metric_name: str, value: float):
        """Check if metric exceeds threshold"""
        if metric_name == "response_time" and value > self.thresholds["response_time"]:
            logger.warning(f"⚠️ Slow response: {value:.2f}s")
        elif metric_name == "error_rate" and value > self.thresholds["error_rate"]:
            logger.warning(f"⚠️ High error rate: {value:.2%}")

    def get_statistics(self, metric_name: str, window_minutes: int = 60) -> Dict:
        """Get statistics for a metric"""
        if metric_name not in self.metrics:
            return {}

        # Filter by time window
        cutoff = datetime.now() - timedelta(minutes=window_minutes)
        recent = [
            m["value"] for m in self.metrics[metric_name]
            if m["timestamp"] > cutoff
        ]

        if not recent:
            return {}

        return {
            "count": len(recent),
            "mean": np.mean(recent),
            "median": np.median(recent),
            "std": np.std(recent),
            "min": np.min(recent),
            "max": np.max(recent),
            "p95": np.percentile(recent, 95),
            "p99": np.percentile(recent, 99)
        }

    def get_dashboard(self) -> Dict:
        """Get performance dashboard data"""
        dashboard = {
            "timestamp": datetime.now().isoformat(),
            "metrics": {}
        }

        for metric_name in self.metrics:
            dashboard["metrics"][metric_name] = self.get_statistics(metric_name)

        return dashboard

    def export_metrics(self, format: str = "json") -> str:
        """Export metrics in specified format"""
        if format == "json":
            import json
            data = {
                metric: [
                    {"value": m["value"], "timestamp": m["timestamp"].isoformat()}
                    for m in values
                ]
                for metric, values in self.metrics.items()
            }
            return json.dumps(data, indent=2)
        else:
            return str(self.metrics)


# ==================== Integration Test ====================

async def test_advanced_components():
    """Test all advanced components"""
    print("\n" + "="*80)
    print("ADVANCED COMPONENTS TEST")
    print("="*80)

    # Test Hybrid Scoring
    print("\n[1] Hybrid Scoring System")
    scorer = HybridScoringSystem()
    score = scorer.calculate_hybrid_score(
        semantic_score=0.8,
        keyword_score=0.6,
        metadata={"journal": "NEJM", "publication_date": "2024-01-01"},
        query_type="clinical"
    )
    print(f"   Hybrid score: {score:.3f}")

    # Test Query Router
    print("\n[2] Query Router")
    router = QueryRouter()
    routing = router.route_query("diabetes treatment guidelines 2024")
    print(f"   Query type: {routing['query_type']}")
    print(f"   Strategy: {routing['search_strategy']}")
    print(f"   Sources: {routing['sources']}")

    # Test Query Decomposition
    print("\n[3] Query Decomposer")
    decomposer = QueryDecomposer()
    sub_queries = decomposer.decompose("chronic kidney disease with diabetes treatment")
    print(f"   Sub-queries: {sub_queries}")

    # Test Cross-Encoder
    print("\n[4] Cross-Encoder Re-ranking")
    reranker = CrossEncoderReranker()
    docs = [
        {"text": "Diabetes treatment involves lifestyle changes"},
        {"text": "CKD patients require special care"},
        {"text": "Diabetes and kidney disease management"}
    ]
    reranked = reranker.rerank("diabetes kidney disease", docs, top_k=2)
    print(f"   Re-ranked {len(reranked)} documents")

    # Test Performance Monitor
    print("\n[5] Performance Monitor")
    monitor = PerformanceMonitor()
    for i in range(10):
        monitor.record_metric("response_time", 0.5 + i * 0.1)
    stats = monitor.get_statistics("response_time")
    print(f"   Mean response time: {stats['mean']:.3f}s")
    print(f"   P95 response time: {stats['p95']:.3f}s")

    print("\n✅ All advanced components tested successfully")


if __name__ == "__main__":
    asyncio.run(test_advanced_components())