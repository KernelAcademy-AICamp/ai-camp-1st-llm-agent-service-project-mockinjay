"""
Token service - AI usage token management
"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from app.db.connection import tokens_collection, token_transactions_collection, points_collection


# Token configuration
POINTS_PER_TOKEN = 10  # 10 points = 1 token
DAILY_TOKEN_LIMIT = 100  # Maximum tokens per day


def get_token_balance(user_id: str) -> Dict[str, Any]:
    """
    Get user's token balance and daily usage

    Args:
        user_id: User ID

    Returns:
        Dict containing token balance and usage info
    """
    # Get or create token record
    token_doc = tokens_collection.find_one({"user_id": user_id})

    if not token_doc:
        # Initialize with 0 tokens
        token_doc = {
            "user_id": user_id,
            "tokens": 0,
            "tokens_used_today": 0,
            "daily_limit": DAILY_TOKEN_LIMIT,
            "last_reset_at": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        tokens_collection.insert_one(token_doc)
    else:
        # Check if we need to reset daily usage
        token_doc = reset_daily_usage_if_needed(user_id, token_doc)

    remaining_today = max(0, token_doc["daily_limit"] - token_doc["tokens_used_today"])

    return {
        "user_id": user_id,
        "tokens": token_doc["tokens"],
        "tokens_used_today": token_doc["tokens_used_today"],
        "daily_limit": token_doc["daily_limit"],
        "remaining_today": remaining_today,
        "last_reset_at": token_doc.get("last_reset_at")
    }


def reset_daily_usage_if_needed(user_id: str, token_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Reset daily usage if a new day has started

    Args:
        user_id: User ID
        token_doc: Token document

    Returns:
        Updated token document
    """
    last_reset = token_doc.get("last_reset_at", datetime.utcnow())
    now = datetime.utcnow()

    # Check if it's a new day (UTC)
    if last_reset.date() < now.date():
        # Reset daily usage
        tokens_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "tokens_used_today": 0,
                    "last_reset_at": now,
                    "updated_at": now
                }
            }
        )
        token_doc["tokens_used_today"] = 0
        token_doc["last_reset_at"] = now

    return token_doc


def convert_points_to_tokens(
    user_id: str,
    points: int
) -> Dict[str, Any]:
    """
    Convert points to tokens

    Args:
        user_id: User ID
        points: Points to convert

    Returns:
        Dict containing conversion details

    Raises:
        ValueError: If insufficient points or invalid amount
    """
    if points <= 0:
        raise ValueError("포인트는 0보다 커야 합니다")

    if points % POINTS_PER_TOKEN != 0:
        raise ValueError(f"포인트는 {POINTS_PER_TOKEN}의 배수여야 합니다")

    # Check user has enough points
    points_doc = points_collection.find_one({"user_id": user_id})
    if not points_doc or points_doc["points"] < points:
        raise ValueError("포인트가 부족합니다")

    points_before = points_doc["points"]
    tokens_to_add = points // POINTS_PER_TOKEN

    # Deduct points
    points_after = points_before - points
    points_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "points": points_after,
                "updated_at": datetime.utcnow()
            }
        }
    )

    # Add tokens
    token_doc = tokens_collection.find_one({"user_id": user_id})

    if not token_doc:
        token_doc = {
            "user_id": user_id,
            "tokens": 0,
            "tokens_used_today": 0,
            "daily_limit": DAILY_TOKEN_LIMIT,
            "last_reset_at": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        tokens_collection.insert_one(token_doc)

    tokens_before = token_doc["tokens"]
    tokens_after = tokens_before + tokens_to_add

    tokens_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "tokens": tokens_after,
                "updated_at": datetime.utcnow()
            }
        }
    )

    # Record transaction
    transaction = {
        "user_id": user_id,
        "points_before": points_before,
        "points_after": points_after,
        "points_used": points,
        "tokens_before": tokens_before,
        "tokens_after": tokens_after,
        "tokens_gained": tokens_to_add,
        "conversion_rate": POINTS_PER_TOKEN,
        "transaction_type": "conversion",
        "created_at": datetime.utcnow()
    }
    token_transactions_collection.insert_one(transaction)

    return {
        "user_id": user_id,
        "points_before": points_before,
        "points_after": points_after,
        "points_used": points,
        "tokens_before": tokens_before,
        "tokens_after": tokens_after,
        "tokens_gained": tokens_to_add,
        "conversion_rate": POINTS_PER_TOKEN,
        "created_at": transaction["created_at"]
    }


def use_tokens(
    user_id: str,
    tokens_used: int,
    usage_type: str,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Record token usage

    Args:
        user_id: User ID
        tokens_used: Number of tokens used
        usage_type: Type of usage
        session_id: Optional session ID

    Returns:
        Dict containing usage details

    Raises:
        ValueError: If insufficient tokens or exceeds daily limit
    """
    if tokens_used <= 0:
        raise ValueError("토큰 사용량은 0보다 커야 합니다")

    # Get token balance
    token_doc = tokens_collection.find_one({"user_id": user_id})

    if not token_doc:
        raise ValueError("토큰 잔액이 없습니다")

    # Reset daily usage if needed
    token_doc = reset_daily_usage_if_needed(user_id, token_doc)

    # Check if sufficient tokens
    if token_doc["tokens"] < tokens_used:
        raise ValueError("토큰이 부족합니다")

    # Check daily limit
    new_daily_usage = token_doc["tokens_used_today"] + tokens_used
    if new_daily_usage > token_doc["daily_limit"]:
        raise ValueError("일일 토큰 사용 한도를 초과했습니다")

    tokens_before = token_doc["tokens"]
    tokens_after = tokens_before - tokens_used

    # Update token balance
    tokens_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "tokens": tokens_after,
                "tokens_used_today": new_daily_usage,
                "updated_at": datetime.utcnow()
            }
        }
    )

    # Record transaction
    transaction = {
        "user_id": user_id,
        "tokens_before": tokens_before,
        "tokens_after": tokens_after,
        "tokens_used": tokens_used,
        "usage_type": usage_type,
        "session_id": session_id,
        "transaction_type": "usage",
        "created_at": datetime.utcnow()
    }
    token_transactions_collection.insert_one(transaction)

    remaining_daily = token_doc["daily_limit"] - new_daily_usage

    return {
        "user_id": user_id,
        "tokens_before": tokens_before,
        "tokens_after": tokens_after,
        "tokens_used": tokens_used,
        "usage_type": usage_type,
        "created_at": transaction["created_at"],
        "remaining_daily": remaining_daily
    }
