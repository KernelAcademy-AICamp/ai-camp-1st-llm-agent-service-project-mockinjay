"""
Insert sample nutrition data into MongoDB for testing
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Sample CKD-friendly and high-risk foods
SAMPLE_FOODS = [
    # High sodium food (김치찌개)
    {
        "food_name": "김치찌개",
        "sodium": 1200,      # High - exceeds 667mg (1/3 daily)
        "potassium": 650,    # Slightly high
        "phosphorus": 180,   # Safe
        "protein": 25,       # Safe
        "calcium": 80,       # Safe
        "serving_size": "1그릇 (300g)",
        "ckd_risks": ["sodium", "potassium"],
        "data_source": "test"
    },
    # High potassium food (바나나)
    {
        "food_name": "바나나",
        "sodium": 5,         # Very low
        "potassium": 422,    # High for CKD (1개 기준)
        "phosphorus": 26,    # Low
        "protein": 1.3,      # Low
        "calcium": 8,        # Low
        "serving_size": "1개 (120g)",
        "ckd_risks": ["potassium"],
        "data_source": "test"
    },
    # Safe alternative - 양배추 (low K, low Na, low P)
    {
        "food_name": "양배추",
        "sodium": 18,        # Very low
        "potassium": 170,    # Low
        "phosphorus": 26,    # Low
        "protein": 1.3,      # Low
        "calcium": 40,       # Low
        "serving_size": "100g",
        "ckd_risks": [],
        "data_source": "test"
    },
    # Safe alternative - 닭가슴살 (low Na, medium protein)
    {
        "food_name": "닭가슴살",
        "sodium": 74,        # Low
        "potassium": 220,    # Medium
        "phosphorus": 200,   # Medium
        "protein": 23,       # High but acceptable
        "calcium": 11,       # Low
        "serving_size": "100g",
        "ckd_risks": [],
        "data_source": "test"
    },
    # Safe alternative - 오이 (very low everything)
    {
        "food_name": "오이",
        "sodium": 2,         # Very low
        "potassium": 147,    # Low
        "phosphorus": 24,    # Low
        "protein": 0.7,      # Very low
        "calcium": 16,       # Low
        "serving_size": "100g",
        "ckd_risks": [],
        "data_source": "test"
    },
    # Safe alternative - 가지 (low K after blanching)
    {
        "food_name": "가지",
        "sodium": 2,         # Very low
        "potassium": 200,    # Low (after blanching)
        "phosphorus": 24,    # Low
        "protein": 1.0,      # Low
        "calcium": 9,        # Low
        "serving_size": "100g",
        "ckd_risks": [],
        "data_source": "test"
    },
    # High phosphorus food (콜라)
    {
        "food_name": "콜라",
        "sodium": 10,        # Low
        "potassium": 2,      # Very low
        "phosphorus": 41,    # High (for 100ml, 1캔=약 150mg)
        "protein": 0,        # None
        "calcium": 0,        # None
        "serving_size": "100ml",
        "ckd_risks": ["phosphorus"],
        "data_source": "test"
    },
    # Safe beverage alternative - 보리차
    {
        "food_name": "보리차",
        "sodium": 3,         # Very low
        "potassium": 25,     # Very low
        "phosphorus": 5,     # Very low
        "protein": 0,        # None
        "calcium": 2,        # Very low
        "serving_size": "100ml",
        "ckd_risks": [],
        "data_source": "test"
    },
    # High protein food (돼지고기)
    {
        "food_name": "돼지고기",
        "sodium": 55,        # Low
        "potassium": 360,    # Medium
        "phosphorus": 210,   # Medium-High
        "protein": 21,       # High
        "calcium": 5,        # Low
        "serving_size": "100g",
        "ckd_risks": ["protein", "phosphorus"],
        "data_source": "test"
    },
    # Safe protein alternative - 두부
    {
        "food_name": "두부",
        "sodium": 7,         # Very low
        "potassium": 150,    # Low
        "phosphorus": 97,    # Medium
        "protein": 8,        # Medium
        "calcium": 350,      # High (good for bones)
        "serving_size": "100g",
        "ckd_risks": [],
        "data_source": "test"
    },
    # 김치 레시피 식재료들
    {
        "food_name": "배추",
        "sodium": 9,
        "potassium": 224,
        "phosphorus": 30,
        "protein": 1.2,
        "calcium": 36,
        "serving_size": "100g",
        "ckd_risks": [],
        "data_source": "test"
    },
    {
        "food_name": "소금",
        "sodium": 38758,  # Very high!
        "potassium": 2,
        "phosphorus": 0,
        "protein": 0,
        "calcium": 24,
        "serving_size": "100g",
        "ckd_risks": ["sodium"],
        "data_source": "test"
    },
    {
        "food_name": "마늘",
        "sodium": 17,
        "potassium": 401,  # High
        "phosphorus": 153,
        "protein": 6.4,
        "calcium": 181,
        "serving_size": "100g",
        "ckd_risks": ["potassium"],
        "data_source": "test"
    },
    {
        "food_name": "생강",
        "sodium": 13,
        "potassium": 415,  # High
        "phosphorus": 34,
        "protein": 1.8,
        "calcium": 16,
        "serving_size": "100g",
        "ckd_risks": ["potassium"],
        "data_source": "test"
    },
    {
        "food_name": "파",
        "sodium": 16,
        "potassium": 276,
        "phosphorus": 37,
        "protein": 1.8,
        "calcium": 72,
        "serving_size": "100g",
        "ckd_risks": [],
        "data_source": "test"
    },
    {
        "food_name": "멸치액젓",
        "sodium": 12000,  # Very high!
        "potassium": 500,
        "phosphorus": 200,
        "protein": 15,
        "calcium": 200,
        "serving_size": "100ml",
        "ckd_risks": ["sodium"],
        "data_source": "test"
    },
    # 저나트륨/저칼륨 대체 양념
    {
        "food_name": "식초",
        "sodium": 8,      # Very low
        "potassium": 15,  # Very low
        "phosphorus": 8,
        "protein": 0,
        "calcium": 6,
        "serving_size": "100ml",
        "ckd_risks": [],
        "data_source": "test"
    },
    {
        "food_name": "레몬즙",
        "sodium": 1,      # Very low
        "potassium": 138,
        "phosphorus": 10,
        "protein": 0.4,
        "calcium": 7,
        "serving_size": "100ml",
        "ckd_risks": [],
        "data_source": "test"
    }
]


def insert_nutrition_data():
    """Insert sample nutrition data into MongoDB"""
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = MongoClient(mongo_uri)
    db = client['careguide']

    # Clear existing test data
    result = db.food_nutrients.delete_many({"data_source": "test"})
    print(f"🗑️  Deleted {result.deleted_count} existing test documents")

    # Insert new test data
    result = db.food_nutrients.insert_many(SAMPLE_FOODS)
    print(f"✅ Inserted {len(result.inserted_ids)} nutrition documents")

    # Verify
    print("\n📊 Sample nutrition data:")
    for food in SAMPLE_FOODS:
        print(f"  - {food['food_name']}: Na={food['sodium']}mg, K={food['potassium']}mg, P={food['phosphorus']}mg, Protein={food['protein']}g")

    client.close()
    print("\n✅ Test data ready for MongoDB nutrition lookup!")


if __name__ == "__main__":
    insert_nutrition_data()
