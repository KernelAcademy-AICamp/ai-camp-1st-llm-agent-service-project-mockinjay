"""
Test Nutrition Agent with MongoDB Integration
"""
import asyncio
import sys
sys.path.insert(0, '.')

from Agent.nutrition.agent import NutritionAgent


async def test_mongodb_integration():
    """Test nutrition agent with MongoDB lookup and alternative recommendations"""

    print("="*80)
    print("Testing Nutrition Agent with MongoDB Integration")
    print("="*80)

    # Test Case 1: User confirms high-sodium dish (김치찌개)
    print("\n" + "="*80)
    print("Test Case 1: User confirms 김치찌개 (high sodium)")
    print("="*80)

    # Initialize agent
    agent = NutritionAgent()

    # Simulate conversation state after user uploaded image and got candidates
    # Structure must match what RAG search returns
    rag_result = {
        "dish_name": "김치찌개",
        "ingredients": ["배추김치", "돼지고기", "두부", "고춧가루", "파"],
        "recipe": "김치와 돼지고기를 볶다가 물을 넣고 끓인다. 두부를 넣고 한소끔 더 끓인다.",
        "nutrition": {
            "sodium": 1200,
            "potassium": 650,
            "phosphorus": 180,
            "protein": 25,
            "calcium": 80
        },
        "score": 0.95
    }

    agent._update_conversation_state("test_session", {
        "state": "awaiting_dish_selection",
        "pending_candidates": [
            {
                "dish_name": "김치찌개",
                "confidence": 95,
                "dish_data": rag_result
            }
        ]
    })

    # User confirms the dish
    user_input = "네, 맞아요! 김치찌개예요"
    session_id = "test_session"

    response = await agent.process(
        user_input=user_input,
        session_id=session_id,
        context={"user_profile": "patient"}
    )

    print(f"\n✅ Agent Response:")
    print(f"   Response: {response.get('response', '')}")

    if "nutritionData" in response and response["nutritionData"]:
        nutrition_data = response["nutritionData"]
        print(f"\n📊 Nutrition Data:")
        print(f"   Dish: {nutrition_data['dishName']}")

        # Show nutrient status
        print(f"\n   Nutrient Status:")
        for nutrient in nutrition_data["nutrients"]:
            print(f"      {nutrient['name']}: {nutrient['value']}{nutrient['unit']} / {nutrient['max']}{nutrient['unit']} → {nutrient['status']}")

        # Show alternatives
        if nutrition_data.get("alternatives"):
            print(f"\n   🔄 Alternative Ingredients ({len(nutrition_data['alternatives'])}):")
            for alt in nutrition_data["alternatives"][:3]:
                print(f"      - {alt.get('original', '?')} → {alt['replacement']}: {alt['reason']}")

        # Show alternative recipes
        if nutrition_data.get("alternative_recipes"):
            print(f"\n   🍽️  Alternative Recipes ({len(nutrition_data['alternative_recipes'])}):")
            for recipe in nutrition_data["alternative_recipes"][:3]:
                nutrients = recipe.get("nutrients", {})
                print(f"      - {recipe['dish_name']}: Na={nutrients.get('sodium', 0)}mg, K={nutrients.get('potassium', 0)}mg")
                print(f"        Reason: {recipe['reason']}")

    # Test Case 2: User asks about a safe food (오이)
    print("\n\n" + "="*80)
    print("Test Case 2: User asks about 오이 (safe food)")
    print("="*80)

    agent2 = NutritionAgent()  # Reset agent

    rag_result2 = {
        "dish_name": "오이",
        "ingredients": ["오이"],
        "recipe": "생으로 먹거나 샐러드로 활용",
        "nutrition": {
            "sodium": 2,
            "potassium": 147,
            "phosphorus": 24,
            "protein": 0.7,
            "calcium": 16
        },
        "score": 0.98
    }

    agent2._update_conversation_state("test_session2", {
        "state": "awaiting_dish_selection",
        "pending_candidates": [
            {
                "dish_name": "오이",
                "confidence": 98,
                "dish_data": rag_result2
            }
        ]
    })

    user_input = "네, 오이예요"
    session_id = "test_session2"

    response = await agent2.process(
        user_input=user_input,
        session_id=session_id,
        context={"user_profile": "patient"}
    )

    print(f"\n✅ Agent Response:")
    print(f"   Response: {response.get('response', '')}")

    if "nutritionData" in response and response["nutritionData"]:
        nutrition_data = response["nutritionData"]
        print(f"\n📊 Nutrition Data:")

        # Show nutrient status
        danger_count = sum(1 for n in nutrition_data["nutrients"] if n["status"] == "danger")
        warning_count = sum(1 for n in nutrition_data["nutrients"] if n["status"] == "warning")
        safe_count = sum(1 for n in nutrition_data["nutrients"] if n["status"] == "safe")

        print(f"   Status: {safe_count} safe, {warning_count} warning, {danger_count} danger")

        if not nutrition_data.get("alternatives") and not nutrition_data.get("alternative_recipes"):
            print(f"   ✅ No alternatives needed - safe to eat!")

    print("\n" + "="*80)
    print("✅ All tests completed!")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(test_mongodb_integration())
