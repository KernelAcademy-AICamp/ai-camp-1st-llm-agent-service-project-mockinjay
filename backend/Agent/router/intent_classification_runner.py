"""
Test script for Intent Classification System
Validates the sophisticated prompt-based classification against expected results
"""

import asyncio
import json
import logging
import os
from typing import Dict, Any, List
from openai import AsyncOpenAI

from prompts import (
    format_classification_prompt,
    INTENT_CLASSIFICATION_TEST_CASES,
    IntentCategory,
    is_emergency_query,
    get_intent_metadata
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Classification Function (mimics RouterAgent logic)
# ============================================================================

async def classify_intent_with_llm(query: str) -> Dict[str, Any]:
    """
    Classify intent using OpenAI GPT with sophisticated prompts

    Args:
        query: User query to classify

    Returns:
        Classification result with intents, confidence, reasoning, etc.
    """
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # Use formatted prompt from prompts.py
    messages = format_classification_prompt(query)

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.0,
            max_tokens=512
        )

        content = response.choices[0].message.content or ""

        # Clean up markdown if present
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        # Parse JSON
        result = json.loads(content)

        # Validate structure
        required_fields = ["intents", "confidence", "reasoning", "is_emergency", "primary_intent"]
        for field in required_fields:
            if field not in result:
                raise ValueError(f"Missing required field: {field}")

        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Raw content: {content}")
        return {
            "intents": ["CHIT_CHAT"],
            "confidence": 0.0,
            "reasoning": f"JSON parsing failed: {str(e)}",
            "is_emergency": False,
            "primary_intent": "CHIT_CHAT",
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"Classification error: {e}")
        return {
            "intents": ["CHIT_CHAT"],
            "confidence": 0.0,
            "reasoning": f"Error: {str(e)}",
            "is_emergency": False,
            "primary_intent": "CHIT_CHAT",
            "error": str(e)
        }

# ============================================================================
# Test Runner
# ============================================================================

async def run_test_case(test_case: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run a single test case

    Args:
        test_case: Test case dictionary with query and expected results

    Returns:
        Test result with pass/fail status
    """
    query = test_case["query"]
    expected_intents = set(test_case["expected_intents"])
    expected_primary = test_case["expected_primary"]
    min_confidence = test_case["min_confidence"]
    is_emergency_expected = test_case.get("is_emergency", False)

    logger.info(f"\n{'='*80}")
    logger.info(f"Testing: {query}")
    logger.info(f"Expected: {test_case['expected_intents']}")

    # Classify
    result = await classify_intent_with_llm(query)

    # Extract results
    actual_intents = set(result.get("intents", []))
    actual_primary = result.get("primary_intent", "")
    actual_confidence = result.get("confidence", 0.0)
    actual_is_emergency = result.get("is_emergency", False)
    reasoning = result.get("reasoning", "")

    logger.info(f"Actual: {list(actual_intents)}")
    logger.info(f"Confidence: {actual_confidence:.2f}")
    logger.info(f"Emergency: {actual_is_emergency}")
    logger.info(f"Reasoning: {reasoning}")

    # Validation
    passed = True
    failures = []

    # Check intents match
    if actual_intents != expected_intents:
        passed = False
        failures.append(f"Intents mismatch: expected {expected_intents}, got {actual_intents}")

    # Check primary intent
    if actual_primary != expected_primary:
        passed = False
        failures.append(f"Primary intent mismatch: expected {expected_primary}, got {actual_primary}")

    # Check confidence threshold
    if actual_confidence < min_confidence:
        passed = False
        failures.append(f"Confidence too low: expected >= {min_confidence}, got {actual_confidence}")

    # Check emergency flag
    if actual_is_emergency != is_emergency_expected:
        passed = False
        failures.append(f"Emergency flag mismatch: expected {is_emergency_expected}, got {actual_is_emergency}")

    # Log result
    if passed:
        logger.info("✓ PASS")
    else:
        logger.error("✗ FAIL")
        for failure in failures:
            logger.error(f"  - {failure}")

    return {
        "query": query,
        "description": test_case["description"],
        "expected_intents": list(expected_intents),
        "actual_intents": list(actual_intents),
        "expected_primary": expected_primary,
        "actual_primary": actual_primary,
        "expected_confidence": min_confidence,
        "actual_confidence": actual_confidence,
        "expected_emergency": is_emergency_expected,
        "actual_emergency": actual_is_emergency,
        "reasoning": reasoning,
        "passed": passed,
        "failures": failures
    }

async def run_all_tests():
    """
    Run all test cases and generate report
    """
    logger.info(f"\n{'='*80}")
    logger.info("Starting Intent Classification Test Suite")
    logger.info(f"Total test cases: {len(INTENT_CLASSIFICATION_TEST_CASES)}")
    logger.info(f"{'='*80}\n")

    results = []

    for test_case in INTENT_CLASSIFICATION_TEST_CASES:
        result = await run_test_case(test_case)
        results.append(result)

        # Small delay to avoid rate limiting
        await asyncio.sleep(0.5)

    # Generate summary
    passed = sum(1 for r in results if r["passed"])
    failed = len(results) - passed
    pass_rate = (passed / len(results)) * 100 if results else 0

    logger.info(f"\n{'='*80}")
    logger.info("TEST SUMMARY")
    logger.info(f"{'='*80}")
    logger.info(f"Total: {len(results)}")
    logger.info(f"Passed: {passed} ({pass_rate:.1f}%)")
    logger.info(f"Failed: {failed}")
    logger.info(f"{'='*80}\n")

    # Detailed failure report
    if failed > 0:
        logger.error("\nFAILED TEST CASES:")
        logger.error("="*80)
        for result in results:
            if not result["passed"]:
                logger.error(f"\nQuery: {result['query']}")
                logger.error(f"Description: {result['description']}")
                logger.error(f"Expected: {result['expected_intents']}")
                logger.error(f"Actual: {result['actual_intents']}")
                logger.error(f"Failures:")
                for failure in result["failures"]:
                    logger.error(f"  - {failure}")
                logger.error(f"Reasoning: {result['reasoning'][:200]}...")

    # Critical test: "어떤 질환에 대해서 알려줘"
    critical_test = next((r for r in results if "어떤 질환" in r["query"]), None)
    if critical_test:
        logger.info(f"\n{'='*80}")
        logger.info("CRITICAL TEST RESULT")
        logger.info(f"{'='*80}")
        logger.info(f"Query: {critical_test['query']}")
        logger.info(f"Expected: MEDICAL_INFO")
        logger.info(f"Actual: {critical_test['actual_intents']}")
        logger.info(f"Status: {'✓ PASS' if critical_test['passed'] else '✗ FAIL'}")
        logger.info(f"Confidence: {critical_test['actual_confidence']:.2f}")
        logger.info(f"{'='*80}\n")

    # Save results to JSON
    output_file = "test_results.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({
            "summary": {
                "total": len(results),
                "passed": passed,
                "failed": failed,
                "pass_rate": pass_rate
            },
            "results": results
        }, f, ensure_ascii=False, indent=2)

    logger.info(f"Results saved to: {output_file}")

    return results, pass_rate

# ============================================================================
# Helper Tests
# ============================================================================

def test_emergency_detection():
    """Test emergency keyword detection"""
    logger.info("\n" + "="*80)
    logger.info("Testing Emergency Keyword Detection")
    logger.info("="*80)

    test_cases = [
        ("흉통이 심해요", True),
        ("가슴이 아파요", True),
        ("호흡곤란", True),
        ("숨쉬기 힘들어요", True),
        ("두통이 있어요", False),
        ("CKD 증상은?", False),
        ("안녕하세요", False),
    ]

    for query, expected in test_cases:
        actual = is_emergency_query(query)
        status = "✓" if actual == expected else "✗"
        logger.info(f"{status} '{query}' -> Emergency: {actual} (expected: {expected})")

def test_intent_metadata():
    """Test intent metadata retrieval"""
    logger.info("\n" + "="*80)
    logger.info("Testing Intent Metadata")
    logger.info("="*80)

    metadata = get_intent_metadata()

    for intent, meta in metadata.items():
        logger.info(f"\n{intent}:")
        logger.info(f"  Name: {meta['name']} ({meta['name_en']})")
        logger.info(f"  Risk: {meta['risk_level']}")
        logger.info(f"  Agent: {meta.get('recommended_agent', 'None')}")
        logger.info(f"  Strict: {meta.get('requires_strict_validation', False)}")

# ============================================================================
# Interactive Test
# ============================================================================

async def interactive_test():
    """
    Interactive testing mode - classify queries on demand
    """
    logger.info("\n" + "="*80)
    logger.info("Interactive Intent Classification Test")
    logger.info("="*80)
    logger.info("Enter queries to classify (or 'quit' to exit)")
    logger.info("="*80 + "\n")

    while True:
        query = input("\nQuery: ").strip()

        if not query or query.lower() == 'quit':
            break

        result = await classify_intent_with_llm(query)

        print("\n" + "-"*80)
        print(f"Intents: {result.get('intents', [])}")
        print(f"Primary: {result.get('primary_intent', '')}")
        print(f"Confidence: {result.get('confidence', 0.0):.2f}")
        print(f"Emergency: {result.get('is_emergency', False)}")
        print(f"\nReasoning:")
        print(result.get('reasoning', ''))
        print("-"*80)

# ============================================================================
# Main
# ============================================================================

async def main():
    """Main test runner"""
    import argparse

    parser = argparse.ArgumentParser(description="Intent Classification Test Suite")
    parser.add_argument(
        "--mode",
        choices=["all", "interactive", "helpers"],
        default="all",
        help="Test mode (default: all)"
    )

    args = parser.parse_args()

    if args.mode == "interactive":
        await interactive_test()
    elif args.mode == "helpers":
        test_emergency_detection()
        test_intent_metadata()
    else:
        # Run helper tests
        test_emergency_detection()
        test_intent_metadata()

        # Run main test suite
        results, pass_rate = await run_all_tests()

        # Exit with appropriate code
        exit(0 if pass_rate == 100.0 else 1)

if __name__ == "__main__":
    asyncio.run(main())
