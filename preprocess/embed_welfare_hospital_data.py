"""
Pinecone embedding script for welfare programs and hospital data.

This script loads documents from MongoDB, generates embeddings using
OptimizedVectorDBManager (Pinecone), and upserts them into dedicated namespaces:
    - welfare_programs  → welfare benefits corpus
    - hospitals         → hospital/pharmacy/dialysis corpus

Run:
    python preprocess/embed_welfare_hospital_data.py
    python preprocess/embed_welfare_hospital_data.py --collections welfare
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Callable

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Make backend modules importable
PROJECT_ROOT = Path(__file__).parent.parent
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from backend.app.db.vector_manager import OptimizedVectorDBManager  # noqa: E402

load_dotenv()


def format_welfare_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Flatten welfare document fields for embedding."""
    benefits = doc.get("benefits") or {}
    application = doc.get("application") or {}

    def dict_to_text(data: Dict[str, Any]) -> str:
        parts = []
        for key, value in data.items():
            if isinstance(value, dict):
                inner = ", ".join(f"{k}: {v}" for k, v in value.items() if v)
                parts.append(f"{key}: {inner}")
            elif isinstance(value, list):
                parts.append(f"{key}: {', '.join(str(v) for v in value if v)}")
            elif value not in (None, ""):
                parts.append(f"{key}: {value}")
        return " | ".join(parts)

    benefits_text = dict_to_text(benefits)
    application_text = dict_to_text(application)
    eligibility = doc.get("eligibility") or {}
    eligibility_text = dict_to_text(eligibility)

    keywords = ", ".join(doc.get("keywords", []))
    diseases = ", ".join(doc.get("target_disease", []))

    return {
        "_id": str(doc.get("_id")),
        "programId": doc.get("programId", ""),
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "category": doc.get("category", ""),
        "keywords": keywords,
        "benefits_text": benefits_text,
        "application_text": application_text,
        "eligibility_text": eligibility_text,
        "target_disease_text": diseases,
        "year": doc.get("year"),
        "is_active": doc.get("is_active", True),
    }


def format_hospital_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Flatten hospital document fields for embedding."""
    dialysis_info = []
    if doc.get("has_dialysis_unit"):
        dialysis_info.append("Dialysis available")
    if doc.get("night_dialysis"):
        dialysis_info.append("Night dialysis")
    machines = doc.get("dialysis_machines")
    if isinstance(machines, (int, float)):
        dialysis_info.append(f"Machines: {machines}")
    if doc.get("dialysis_days"):
        days = ", ".join(doc.get("dialysis_days"))
        dialysis_info.append(f"Dialysis days: {days}")

    detail_parts = [
        doc.get("type", ""),
        doc.get("region", ""),
        "; ".join(dialysis_info),
        doc.get("services", ""),
    ]
    detail_text = " | ".join([part for part in detail_parts if part])

    return {
        "_id": str(doc.get("_id")),
        "name": doc.get("name", ""),
        "address": doc.get("address", ""),
        "region": doc.get("region", ""),
        "type": doc.get("type", ""),
        "phone": doc.get("phone", ""),
        "detail_text": detail_text,
        "has_dialysis_unit": doc.get("has_dialysis_unit", False),
        "night_dialysis": doc.get("night_dialysis", False),
        "dialysis_machines": machines,
        "lat": doc.get("lat"),
        "lng": doc.get("lng"),
        "naver_map_url": doc.get("naver_map_url"),
        "kakao_map_url": doc.get("kakao_map_url"),
    }


COLLECTION_CONFIG: Dict[str, Dict[str, Any]] = {
    "welfare": {
        "collection": "welfare_programs",
        "namespace": "welfare_programs",
        "text_fields": [
            "title",
            "description",
            "benefits_text",
            "application_text",
            "eligibility_text",
            "target_disease_text",
        ],
        "formatter": format_welfare_doc,
    },
    "hospitals": {
        "collection": "hospitals",
        "namespace": "hospitals",
        "text_fields": ["name", "address", "detail_text"],
        "formatter": format_hospital_doc,
    },
}


async def embed_collection(
    db,
    vector_manager: OptimizedVectorDBManager,
    config: Dict[str, Any],
    batch_size: int = 200,
):
    """Embed a MongoDB collection into Pinecone."""
    collection_name = config["collection"]
    namespace = config["namespace"]
    formatter: Callable[[Dict[str, Any]], Dict[str, Any]] = config["formatter"]
    text_fields = config["text_fields"]

    total_docs = await db[collection_name].count_documents({})
    if total_docs == 0:
        print(f"⚠️  {collection_name} is empty. Skipping.")
        return

    print(f"\n📚 Collection: {collection_name}")
    print(f"   Namespace: {namespace}")
    print(f"   Documents: {total_docs:,}")

    cursor = db[collection_name].find({})
    processed = 0
    batch: List[Dict[str, Any]] = []
    start = datetime.now()

    async for doc in cursor:
        formatted = formatter(doc)
        batch.append(formatted)

        if len(batch) >= batch_size:
            await vector_manager.upsert_embeddings(
                docs=batch,
                namespace=namespace,
                id_field="_id",
                text_fields=text_fields,
            )
            processed += len(batch)
            batch.clear()
            progress = processed / total_docs * 100
            print(f"   • Embedded {processed:,}/{total_docs:,} ({progress:.1f}%)")

    if batch:
        await vector_manager.upsert_embeddings(
            docs=batch,
            namespace=namespace,
            id_field="_id",
            text_fields=text_fields,
        )
        processed += len(batch)
        print(f"   • Embedded {processed:,}/{total_docs:,} (100.0%)")

    elapsed = (datetime.now() - start).total_seconds()
    print(f"✅ Completed {collection_name} in {elapsed:.1f}s "
          f"({processed / elapsed:.1f} docs/sec)")


async def main(selected_collections: List[str]):
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    pinecone_key = os.getenv("PINECONE_API_KEY")

    if not pinecone_key:
        raise RuntimeError("PINECONE_API_KEY is not set. Check your .env file.")

    client = AsyncIOMotorClient(mongodb_uri)
    db_name = os.getenv("MONGODB_DB", "careguide")
    db = client[db_name]

    vector_manager = OptimizedVectorDBManager()
    await vector_manager.create_index()

    print("=" * 80)
    print("🔮 Embedding welfare/hospital datasets into Pinecone")
    print("=" * 80)
    print(f"Mongo URI: {mongodb_uri}")
    print(f"Target index: {vector_manager.index_name}")
    print(f"Collections: {', '.join(selected_collections)}")

    for key in selected_collections:
        config = COLLECTION_CONFIG[key]
        await embed_collection(db, vector_manager, config)

    print("\n🎉 All selected collections embedded successfully.")
    client.close()
    vector_manager.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Embed welfare/hospital data into Pinecone.")
    parser.add_argument(
        "--collections",
        nargs="+",
        choices=list(COLLECTION_CONFIG.keys()),
        default=list(COLLECTION_CONFIG.keys()),
        help="Collections to embed (default: all).",
    )
    args = parser.parse_args()
    asyncio.run(main(args.collections))
