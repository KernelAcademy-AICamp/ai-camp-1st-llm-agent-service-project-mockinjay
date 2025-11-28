"""qa_kidney 컬렉션 구조 확인"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_qa_kidney():
    client = AsyncIOMotorClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
    db = client['careguide']

    # Get sample documents
    print('=== qa_kidney 샘플 (5개) ===')
    cursor = db.qa_kidney.find().limit(5)
    async for doc in cursor:
        print(f'\n--- Document ---')
        for k, v in doc.items():
            if k != '_filtering_info' and k != 'embedding':
                val_str = str(v)[:300] if len(str(v)) > 300 else str(v)
                print(f'{k}: {val_str}')

    # Get categories
    print('\n=== 카테고리 분포 ===')
    pipeline = [
        {'$group': {'_id': '$category', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}},
        {'$limit': 15}
    ]
    async for doc in db.qa_kidney.aggregate(pipeline):
        print(f"{doc['_id']}: {doc['count']}개")

    # Check if there's a question field
    print('\n=== 필드 구조 확인 ===')
    sample = await db.qa_kidney.find_one()
    if sample:
        for k in sample.keys():
            print(f'- {k}')

if __name__ == '__main__':
    asyncio.run(check_qa_kidney())
