"""
Gamification service - Points and Level System business logic
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from app.db.connection import points_collection, points_transactions_collection, users_collection


# Level configuration
LEVEL_THRESHOLDS = {
    1: {"min": 0, "max": 99, "name": "Beginner"},
    2: {"min": 100, "max": 299, "name": "Learner"},
    3: {"min": 300, "max": 599, "name": "Enthusiast"},
    4: {"min": 600, "max": 999, "name": "Expert"},
    5: {"min": 1000, "max": None, "name": "Master"}
}


def calculate_level(points: int) -> Dict[str, Any]:
    """
    Calculate user level based on points

    Args:
        points: Total points

    Returns:
        Dict containing level, level_name, min_points, max_points, progress_percentage
    """
    for level, config in LEVEL_THRESHOLDS.items():
        if config["max"] is None:  # Level 5 (Master)
            if points >= config["min"]:
                return {
                    "level": level,
                    "level_name": config["name"],
                    "min_points": config["min"],
                    "max_points": None,
                    "progress_percentage": 100.0
                }
        elif config["min"] <= points <= config["max"]:
            # Calculate progress to next level
            range_size = config["max"] - config["min"] + 1
            progress = points - config["min"]
            progress_percentage = (progress / range_size) * 100

            return {
                "level": level,
                "level_name": config["name"],
                "min_points": config["min"],
                "max_points": config["max"],
                "progress_percentage": round(progress_percentage, 2)
            }

    # Fallback to level 1
    return {
        "level": 1,
        "level_name": "Beginner",
        "min_points": 0,
        "max_points": 99,
        "progress_percentage": 0.0
    }


def get_user_points(user_id: str) -> Dict[str, Any]:
    """
    Get user's points and level information

    Args:
        user_id: User ID

    Returns:
        Dict containing points, level, and related info
    """
    # Get or create points record
    points_doc = points_collection.find_one({"user_id": user_id})

    if not points_doc:
        # Initialize with 0 points
        points_doc = {
            "user_id": user_id,
            "points": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        points_collection.insert_one(points_doc)

    points = points_doc["points"]
    level_info = calculate_level(points)

    # Calculate next level points
    next_level_points = None
    if level_info["max_points"] is not None:
        next_level_points = level_info["max_points"] + 1

    return {
        "user_id": user_id,
        "points": points,
        "level": level_info["level"],
        "level_name": level_info["level_name"],
        "next_level_points": next_level_points
    }


def add_points(user_id: str, points: int, reason: str, transaction_type: str) -> Dict[str, Any]:
    """
    Add or deduct points for a user

    Args:
        user_id: User ID
        points: Points to add (positive) or deduct (negative)
        reason: Reason for the transaction
        transaction_type: Type of transaction

    Returns:
        Dict containing transaction details
    """
    # Get current points
    points_doc = points_collection.find_one({"user_id": user_id})

    if not points_doc:
        # Initialize with 0 points
        points_doc = {
            "user_id": user_id,
            "points": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        points_collection.insert_one(points_doc)

    points_before = points_doc["points"]
    level_before_info = calculate_level(points_before)
    level_before = level_before_info["level"]

    # Calculate new points (ensure not negative)
    points_after = max(0, points_before + points)
    level_after_info = calculate_level(points_after)
    level_after = level_after_info["level"]

    # Check if level changed
    level_up = level_after > level_before

    # Update points
    points_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "points": points_after,
                "updated_at": datetime.utcnow()
            }
        }
    )

    # Record transaction
    transaction = {
        "user_id": user_id,
        "points_before": points_before,
        "points_after": points_after,
        "points_changed": points,
        "level_before": level_before,
        "level_after": level_after,
        "reason": reason,
        "transaction_type": transaction_type,
        "created_at": datetime.utcnow()
    }
    points_transactions_collection.insert_one(transaction)

    return {
        "user_id": user_id,
        "points_before": points_before,
        "points_after": points_after,
        "points_changed": points,
        "level_before": level_before,
        "level_after": level_after,
        "level_up": level_up,
        "reason": reason,
        "transaction_type": transaction_type,
        "created_at": transaction["created_at"]
    }


def get_user_level(user_id: str) -> Dict[str, Any]:
    """
    Get detailed user level information

    Args:
        user_id: User ID

    Returns:
        Dict containing detailed level information
    """
    points_doc = points_collection.find_one({"user_id": user_id})

    if not points_doc:
        # Initialize with 0 points
        points_doc = {
            "user_id": user_id,
            "points": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        points_collection.insert_one(points_doc)

    points = points_doc["points"]
    level_info = calculate_level(points)

    return {
        "user_id": user_id,
        "level": level_info["level"],
        "level_name": level_info["level_name"],
        "points": points,
        "min_points": level_info["min_points"],
        "max_points": level_info["max_points"],
        "progress_percentage": level_info["progress_percentage"]
    }


def get_points_history(
    user_id: str,
    page: int = 1,
    page_size: int = 20
) -> Dict[str, Any]:
    """
    Get user's points transaction history

    Args:
        user_id: User ID
        page: Page number (1-indexed)
        page_size: Items per page

    Returns:
        Dict containing transactions list and pagination info
    """
    skip = (page - 1) * page_size

    # Get transactions
    transactions_cursor = points_transactions_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).skip(skip).limit(page_size)

    transactions = []
    for txn in transactions_cursor:
        transactions.append({
            "id": str(txn["_id"]),
            "user_id": txn["user_id"],
            "points_before": txn["points_before"],
            "points_after": txn["points_after"],
            "points_changed": txn["points_changed"],
            "level_before": txn["level_before"],
            "level_after": txn["level_after"],
            "reason": txn["reason"],
            "transaction_type": txn["transaction_type"],
            "created_at": txn["created_at"]
        })

    # Get total count
    total_count = points_transactions_collection.count_documents({"user_id": user_id})

    return {
        "transactions": transactions,
        "total_count": total_count,
        "page": page,
        "page_size": page_size
    }
