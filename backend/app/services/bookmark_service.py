"""
Bookmark service - Research paper bookmark management
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from app.db.connection import bookmarks_collection
import csv
from io import StringIO


def create_bookmark(user_id: str, bookmark_data: Dict[str, Any]) -> str:
    """
    Create a new bookmark

    Args:
        user_id: User ID
        bookmark_data: Bookmark data (pmid, title, authors, etc.)

    Returns:
        str: Created bookmark ID

    Raises:
        ValueError: If bookmark already exists
    """
    # Check if bookmark already exists
    existing = bookmarks_collection.find_one({
        "user_id": user_id,
        "pmid": bookmark_data["pmid"]
    })

    if existing:
        raise ValueError("이미 북마크된 논문입니다")

    # Create bookmark document
    bookmark_doc = {
        "user_id": user_id,
        "pmid": bookmark_data["pmid"],
        "title": bookmark_data["title"],
        "authors": bookmark_data.get("authors"),
        "journal": bookmark_data.get("journal"),
        "publication_date": bookmark_data.get("publication_date"),
        "abstract": bookmark_data.get("abstract"),
        "doi": bookmark_data.get("doi"),
        "url": bookmark_data.get("url"),
        "memo": bookmark_data.get("memo"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = bookmarks_collection.insert_one(bookmark_doc)
    return str(result.inserted_id)


def get_user_bookmarks(
    user_id: str,
    page: int = 1,
    page_size: int = 20
) -> Dict[str, Any]:
    """
    Get user's bookmarks with pagination

    Args:
        user_id: User ID
        page: Page number (1-indexed)
        page_size: Items per page

    Returns:
        Dict containing bookmarks list and pagination info
    """
    skip = (page - 1) * page_size

    # Get bookmarks
    bookmarks_cursor = bookmarks_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).skip(skip).limit(page_size)

    bookmarks = []
    for bm in bookmarks_cursor:
        bookmarks.append({
            "id": str(bm["_id"]),
            "user_id": bm["user_id"],
            "pmid": bm["pmid"],
            "title": bm["title"],
            "authors": bm.get("authors"),
            "journal": bm.get("journal"),
            "publication_date": bm.get("publication_date"),
            "abstract": bm.get("abstract"),
            "doi": bm.get("doi"),
            "url": bm.get("url"),
            "memo": bm.get("memo"),
            "created_at": bm["created_at"],
            "updated_at": bm["updated_at"]
        })

    # Get total count
    total_count = bookmarks_collection.count_documents({"user_id": user_id})

    return {
        "bookmarks": bookmarks,
        "total_count": total_count,
        "page": page,
        "page_size": page_size
    }


def delete_bookmark(user_id: str, pmid: str) -> bool:
    """
    Delete a bookmark

    Args:
        user_id: User ID
        pmid: PubMed ID

    Returns:
        bool: True if deleted, False if not found
    """
    result = bookmarks_collection.delete_one({
        "user_id": user_id,
        "pmid": pmid
    })

    return result.deleted_count > 0


def update_bookmark_memo(user_id: str, pmid: str, memo: str) -> bool:
    """
    Update bookmark memo

    Args:
        user_id: User ID
        pmid: PubMed ID
        memo: New memo text

    Returns:
        bool: True if updated, False if not found
    """
    result = bookmarks_collection.update_one(
        {
            "user_id": user_id,
            "pmid": pmid
        },
        {
            "$set": {
                "memo": memo,
                "updated_at": datetime.utcnow()
            }
        }
    )

    return result.modified_count > 0


def export_bookmarks_csv(user_id: str, pmids: Optional[List[str]] = None) -> str:
    """
    Export bookmarks as CSV

    Args:
        user_id: User ID
        pmids: Optional list of specific PMIDs to export

    Returns:
        str: CSV content
    """
    # Build query
    query = {"user_id": user_id}
    if pmids:
        query["pmid"] = {"$in": pmids}

    # Get bookmarks
    bookmarks = bookmarks_collection.find(query).sort("created_at", -1)

    # Create CSV
    output = StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "PMID", "Title", "Authors", "Journal", "Publication Date",
        "DOI", "URL", "Memo", "Bookmarked At"
    ])

    # Write rows
    for bm in bookmarks:
        writer.writerow([
            bm["pmid"],
            bm["title"],
            bm.get("authors", ""),
            bm.get("journal", ""),
            bm.get("publication_date", ""),
            bm.get("doi", ""),
            bm.get("url", ""),
            bm.get("memo", ""),
            bm["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        ])

    return output.getvalue()


def export_bookmarks_bibtex(user_id: str, pmids: Optional[List[str]] = None) -> str:
    """
    Export bookmarks as BibTeX

    Args:
        user_id: User ID
        pmids: Optional list of specific PMIDs to export

    Returns:
        str: BibTeX content
    """
    # Build query
    query = {"user_id": user_id}
    if pmids:
        query["pmid"] = {"$in": pmids}

    # Get bookmarks
    bookmarks = bookmarks_collection.find(query).sort("created_at", -1)

    # Create BibTeX entries
    entries = []
    for bm in bookmarks:
        # Clean title (remove newlines)
        title = bm["title"].replace("\n", " ").strip()

        # Extract year from publication_date if available
        year = ""
        if bm.get("publication_date"):
            try:
                year = bm["publication_date"][:4]
            except:
                pass

        # Build BibTeX entry
        entry = f"@article{{pmid{bm['pmid']},\n"
        entry += f"  title = {{{title}}},\n"

        if bm.get("authors"):
            entry += f"  author = {{{bm['authors']}}},\n"

        if bm.get("journal"):
            entry += f"  journal = {{{bm['journal']}}},\n"

        if year:
            entry += f"  year = {{{year}}},\n"

        if bm.get("doi"):
            entry += f"  doi = {{{bm['doi']}}},\n"

        if bm.get("url"):
            entry += f"  url = {{{bm['url']}}},\n"

        entry += f"  note = {{PMID: {bm['pmid']}}}\n"
        entry += "}\n"

        entries.append(entry)

    return "\n".join(entries)
