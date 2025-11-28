"""
Test Recipe Generation - 저염식 김치 레시피 생성 테스트
"""
import asyncio
import sys
sys.path.insert(0, '.')

from Agent.nutrition.agent import NutritionAgent


async def test_recipe_generation():
    """레시피 생성 요청 테스트"""

    print("="*80)
    print("Testing Recipe Generation - 저염식 김치 레시피")
    print("="*80)

    # Initialize agent
    agent = NutritionAgent()

    # Test Case: 저염식 김치 레시피 요청
    print("\n" + "="*80)
    print("Test: 저염식 김치 레시피")
    print("="*80)

    user_input = "저염식 김치 레시피"
    session_id = "test_recipe_session"

    response = await agent.process(
        user_input=user_input,
        session_id=session_id,
        context={
            "user_profile": "patient",
            "user_profile_data": {
                "ckd_stage": "CKD_3"  # CKD 3단계 환자
            }
        }
    )

    print(f"\n✅ Agent Response:")
    print(f"   Type: {response.get('type', 'unknown')}")
    print(f"\n📝 Recipe Text:\n")
    print(response.get('response', ''))

    if "recipeData" in response:
        recipe_data = response["recipeData"]
        print(f"\n\n📊 Recipe Data:")
        print(f"   Recipe Name: {recipe_data.get('recipe_name')}")
        print(f"   Modified Ingredients: {', '.join(recipe_data.get('modified_ingredients', []))}")

        if recipe_data.get("substitutions"):
            print(f"\n   🔄 Substitutions ({len(recipe_data['substitutions'])}):")
            for sub in recipe_data["substitutions"]:
                print(f"      - {sub['original']} → {sub['replacement']}")
                print(f"        Reason: {sub['reason']}")
                print(f"        Original: Na={sub['original_nutrients']['sodium']}mg, K={sub['original_nutrients']['potassium']}mg")
                print(f"        Replacement: Na={sub['replacement_nutrients']['sodium']}mg, K={sub['replacement_nutrients']['potassium']}mg")

    # Verify no nutritionData (레시피는 차트 없이 텍스트만)
    if response.get("nutritionData") is None:
        print(f"\n✅ Correct: No nutritionData returned (text-only response)")
    else:
        print(f"\n⚠️  Warning: nutritionData should be None for recipe requests")

    print("\n" + "="*80)
    print("✅ Recipe generation test completed!")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(test_recipe_generation())
