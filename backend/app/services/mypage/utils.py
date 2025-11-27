"""
MyPage Service Utilities
Helper functions for MyPage services
마이페이지 서비스를 위한 헬퍼 함수
"""
from typing import List
from datetime import datetime


def serialize_object_id(doc: dict) -> dict:
    """
    Convert MongoDB _id to string 'id' field
    MongoDB _id를 문자열 'id' 필드로 변환

    Args:
        doc: MongoDB document

    Returns:
        dict: Document with _id converted to id
    """
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def serialize_datetime(doc: dict, fields: List[str]) -> dict:
    """
    Convert datetime objects to ISO format strings
    datetime 객체를 ISO 형식 문자열로 변환

    Args:
        doc: Document to process
        fields: List of field names to convert

    Returns:
        dict: Document with datetime fields converted to ISO strings
    """
    if doc:
        for field in fields:
            if field in doc and isinstance(doc[field], datetime):
                doc[field] = doc[field].isoformat()
    return doc
