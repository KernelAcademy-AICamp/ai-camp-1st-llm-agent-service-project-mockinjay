"""
Unit tests for MongoDB indexes
Tests index creation and verification

These tests require a running MongoDB instance on localhost:27017
"""
import pytest
import pytest_asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.db.indexes import (
    create_indexes,
    create_health_profiles_indexes,
    create_user_preferences_indexes,
    create_bookmarks_indexes,
    create_posts_indexes,
    create_user_levels_indexes,
    create_user_badges_indexes,
    create_user_points_indexes,
    create_points_history_indexes,
)


@pytest_asyncio.fixture
async def test_db():
    """Create a test database connection"""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_careguide_indexes"]

    yield db

    # Cleanup: drop all test collections
    await db.health_profiles.drop()
    await db.user_preferences.drop()
    await db.bookmarks.drop()
    await db.posts.drop()
    await db.user_levels.drop()
    await db.user_badges.drop()
    await db.user_points.drop()
    await db.points_history.drop()

    client.close()


@pytest.mark.asyncio
async def test_create_health_profiles_indexes(test_db):
    """Test health_profiles collection indexes"""
    await create_health_profiles_indexes(test_db)

    indexes = await test_db.health_profiles.index_information()
    assert "idx_health_profiles_userId" in indexes
    assert indexes["idx_health_profiles_userId"]["unique"] is True


@pytest.mark.asyncio
async def test_create_user_preferences_indexes(test_db):
    """Test user_preferences collection indexes"""
    await create_user_preferences_indexes(test_db)

    indexes = await test_db.user_preferences.index_information()
    assert "idx_user_preferences_userId" in indexes
    assert indexes["idx_user_preferences_userId"]["unique"] is True


@pytest.mark.asyncio
async def test_create_bookmarks_indexes(test_db):
    """Test bookmarks collection indexes"""
    await create_bookmarks_indexes(test_db)

    indexes = await test_db.bookmarks.index_information()
    assert "idx_bookmarks_userId_createdAt" in indexes
    assert "idx_bookmarks_userId_paperId" in indexes
    assert indexes["idx_bookmarks_userId_paperId"]["unique"] is True


@pytest.mark.asyncio
async def test_create_posts_indexes(test_db):
    """Test posts collection indexes"""
    await create_posts_indexes(test_db)

    indexes = await test_db.posts.index_information()
    assert "idx_posts_userId_isDeleted_createdAt" in indexes
    assert "idx_posts_createdAt" in indexes
    assert "idx_posts_category_createdAt" in indexes


@pytest.mark.asyncio
async def test_create_user_levels_indexes(test_db):
    """Test user_levels collection indexes"""
    await create_user_levels_indexes(test_db)

    indexes = await test_db.user_levels.index_information()
    assert "idx_user_levels_userId" in indexes
    assert indexes["idx_user_levels_userId"]["unique"] is True


@pytest.mark.asyncio
async def test_create_user_badges_indexes(test_db):
    """Test user_badges collection indexes"""
    await create_user_badges_indexes(test_db)

    indexes = await test_db.user_badges.index_information()
    assert "idx_user_badges_userId_earnedAt" in indexes


@pytest.mark.asyncio
async def test_create_user_points_indexes(test_db):
    """Test user_points collection indexes"""
    await create_user_points_indexes(test_db)

    indexes = await test_db.user_points.index_information()
    assert "idx_user_points_userId" in indexes
    assert indexes["idx_user_points_userId"]["unique"] is True


@pytest.mark.asyncio
async def test_create_points_history_indexes(test_db):
    """Test points_history collection indexes"""
    await create_points_history_indexes(test_db)

    indexes = await test_db.points_history.index_information()
    assert "idx_points_history_userId_createdAt" in indexes
    assert "idx_points_history_userId_type_createdAt" in indexes
    assert "idx_points_history_userId_source_createdAt" in indexes


@pytest.mark.asyncio
async def test_unique_constraint_health_profiles(test_db):
    """Test that unique constraint prevents duplicate userId in health_profiles"""
    await create_health_profiles_indexes(test_db)

    # Insert first document
    await test_db.health_profiles.insert_one({
        "userId": "user123",
        "height": 170,
        "weight": 70
    })

    # Try to insert duplicate userId - should raise exception
    with pytest.raises(Exception):
        await test_db.health_profiles.insert_one({
            "userId": "user123",
            "height": 180,
            "weight": 80
        })


@pytest.mark.asyncio
async def test_unique_constraint_bookmarks(test_db):
    """Test that unique constraint prevents duplicate bookmarks"""
    await create_bookmarks_indexes(test_db)

    # Insert first bookmark
    await test_db.bookmarks.insert_one({
        "userId": "user123",
        "paperId": "paper456",
        "createdAt": "2025-11-27T00:00:00Z"
    })

    # Try to insert duplicate bookmark - should raise exception
    with pytest.raises(Exception):
        await test_db.bookmarks.insert_one({
            "userId": "user123",
            "paperId": "paper456",
            "createdAt": "2025-11-27T01:00:00Z"
        })


@pytest.mark.asyncio
async def test_all_indexes_creation(test_db):
    """Test that all indexes are created successfully"""
    # This should not raise any exceptions
    await create_indexes(test_db)

    # Verify that indexes exist in each collection
    collections_to_check = [
        ("health_profiles", "idx_health_profiles_userId"),
        ("user_preferences", "idx_user_preferences_userId"),
        ("bookmarks", "idx_bookmarks_userId_createdAt"),
        ("posts", "idx_posts_userId_isDeleted_createdAt"),
        ("user_levels", "idx_user_levels_userId"),
        ("user_badges", "idx_user_badges_userId_earnedAt"),
        ("user_points", "idx_user_points_userId"),
        ("points_history", "idx_points_history_userId_createdAt"),
    ]

    for collection_name, index_name in collections_to_check:
        collection = test_db[collection_name]
        indexes = await collection.index_information()
        assert index_name in indexes, f"Index {index_name} not found in {collection_name}"
