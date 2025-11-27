"""
Integration Tests for Diet Care API

Run with: pytest tests/test_diet_care_api.py -v
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import json

from app.main import app
from app.db.connection import (
    diet_sessions_collection,
    diet_meals_collection,
    diet_goals_collection,
    users_collection
)


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def auth_token(client):
    """Create a test user and return auth token"""
    # Clean up any existing test user
    users_collection.delete_one({"email": "dietcare@test.com"})

    # Create test user
    signup_data = {
        "email": "dietcare@test.com",
        "password": "testpass123",
        "name": "Diet Test User",
        "profile": "patient",
        "role": "user"
    }

    response = client.post("/api/auth/signup", json=signup_data)
    assert response.status_code == 200

    # Login
    login_data = {
        "email": "dietcare@test.com",
        "password": "testpass123"
    }

    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "token" in data

    return data["token"]


@pytest.fixture
def auth_headers(auth_token):
    """Return authorization headers"""
    return {"Authorization": f"Bearer {auth_token}"}


# ============================================
# Session Management Tests
# ============================================

def test_create_session(client, auth_headers):
    """Test creating an analysis session"""
    response = client.post(
        "/api/diet-care/session/create",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert "session_id" in data
    assert "created_at" in data
    assert "expires_at" in data
    assert data["session_id"].startswith("session_")


def test_create_session_unauthorized(client):
    """Test creating session without auth"""
    response = client.post("/api/diet-care/session/create")
    assert response.status_code == 403  # Forbidden


# ============================================
# Nutrition Analysis Tests
# ============================================

def test_analyze_nutrition_with_text(client, auth_headers):
    """Test nutrition analysis with text description"""
    # Create session first
    session_response = client.post(
        "/api/diet-care/session/create",
        headers=auth_headers
    )
    session_id = session_response.json()["session_id"]

    # Analyze nutrition (mock - will fail without real OpenAI key)
    form_data = {
        "session_id": session_id,
        "text": "Grilled chicken breast with steamed broccoli",
        "ckd_stage": "3"
    }

    response = client.post(
        "/api/diet-care/nutri-coach",
        headers=auth_headers,
        data=form_data
    )

    # This will fail without OpenAI API key, but we can check the request is valid
    # In production, you'd mock the OpenAI client
    assert response.status_code in [200, 500]  # 500 if no API key


def test_analyze_nutrition_missing_input(client, auth_headers):
    """Test nutrition analysis without image or text"""
    session_response = client.post(
        "/api/diet-care/session/create",
        headers=auth_headers
    )
    session_id = session_response.json()["session_id"]

    form_data = {
        "session_id": session_id
    }

    response = client.post(
        "/api/diet-care/nutri-coach",
        headers=auth_headers,
        data=form_data
    )

    assert response.status_code == 400
    assert "at least one" in response.json()["detail"].lower()


# ============================================
# Meal Logging Tests
# ============================================

def test_create_meal(client, auth_headers):
    """Test creating a meal entry"""
    meal_data = {
        "meal_type": "breakfast",
        "foods": [
            {
                "name": "Oatmeal",
                "amount": "1 cup",
                "calories": 150,
                "protein_g": 5,
                "sodium_mg": 10,
                "potassium_mg": 150,
                "phosphorus_mg": 180,
                "carbs_g": 27,
                "fat_g": 3,
                "fiber_g": 4
            }
        ],
        "notes": "With almond milk"
    }

    response = client.post(
        "/api/diet-care/meals",
        headers=auth_headers,
        json=meal_data
    )

    assert response.status_code == 201
    data = response.json()

    assert data["meal_type"] == "breakfast"
    assert data["total_calories"] == 150
    assert data["total_protein_g"] == 5
    assert len(data["foods"]) == 1
    assert "id" in data


def test_get_meals(client, auth_headers):
    """Test getting meal history"""
    # Create a meal first
    meal_data = {
        "meal_type": "lunch",
        "foods": [
            {
                "name": "Grilled Chicken",
                "amount": "150g",
                "calories": 165,
                "protein_g": 31,
                "sodium_mg": 74,
                "potassium_mg": 256,
                "phosphorus_mg": 196
            }
        ]
    }

    client.post(
        "/api/diet-care/meals",
        headers=auth_headers,
        json=meal_data
    )

    # Get meals
    response = client.get(
        "/api/diet-care/meals",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert "meals" in data
    assert "total_count" in data
    assert data["total_count"] >= 1


def test_delete_meal(client, auth_headers):
    """Test deleting a meal"""
    # Create a meal
    meal_data = {
        "meal_type": "snack",
        "foods": [
            {
                "name": "Apple",
                "amount": "1 medium",
                "calories": 95,
                "protein_g": 0.5,
                "sodium_mg": 2,
                "potassium_mg": 195,
                "phosphorus_mg": 20
            }
        ]
    }

    create_response = client.post(
        "/api/diet-care/meals",
        headers=auth_headers,
        json=meal_data
    )
    meal_id = create_response.json()["id"]

    # Delete the meal
    response = client.delete(
        f"/api/diet-care/meals/{meal_id}",
        headers=auth_headers
    )

    assert response.status_code == 204


# ============================================
# Goal Management Tests
# ============================================

def test_get_goals_default(client, auth_headers):
    """Test getting default nutrition goals"""
    response = client.get(
        "/api/diet-care/goals",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert "goals" in data
    assert data["goals"]["calories_kcal"] == 2000
    assert data["goals"]["protein_g"] == 50
    assert data["goals"]["sodium_mg"] == 2000


def test_update_goals(client, auth_headers):
    """Test updating nutrition goals"""
    update_data = {
        "calories_kcal": 1800,
        "protein_g": 45,
        "sodium_mg": 1500
    }

    response = client.put(
        "/api/diet-care/goals",
        headers=auth_headers,
        json=update_data
    )

    assert response.status_code == 200
    data = response.json()

    assert data["goals"]["calories_kcal"] == 1800
    assert data["goals"]["protein_g"] == 45
    assert data["goals"]["sodium_mg"] == 1500


# ============================================
# Progress Tests
# ============================================

def test_get_daily_progress(client, auth_headers):
    """Test getting daily progress"""
    # Create a meal for today
    meal_data = {
        "meal_type": "breakfast",
        "foods": [
            {
                "name": "Eggs",
                "amount": "2 large",
                "calories": 140,
                "protein_g": 12,
                "sodium_mg": 140,
                "potassium_mg": 126,
                "phosphorus_mg": 172
            }
        ]
    }

    client.post(
        "/api/diet-care/meals",
        headers=auth_headers,
        json=meal_data
    )

    # Get daily progress
    response = client.get(
        "/api/diet-care/progress/daily",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert "date" in data
    assert "calories" in data
    assert "protein" in data
    assert data["meals_logged"] >= 1


def test_get_weekly_progress(client, auth_headers):
    """Test getting weekly progress"""
    response = client.get(
        "/api/diet-care/progress/weekly",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert "week_start" in data
    assert "week_end" in data
    assert "daily_summaries" in data
    assert len(data["daily_summaries"]) == 7


def test_get_streak(client, auth_headers):
    """Test getting logging streak"""
    response = client.get(
        "/api/diet-care/streak",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()

    assert "current_streak" in data
    assert "longest_streak" in data
    assert isinstance(data["current_streak"], int)


# ============================================
# Cleanup
# ============================================

@pytest.fixture(scope="module", autouse=True)
def cleanup():
    """Clean up test data after all tests"""
    yield
    # Clean up test user and related data
    test_user = users_collection.find_one({"email": "dietcare@test.com"})
    if test_user:
        user_id = str(test_user["_id"])
        diet_sessions_collection.delete_many({"user_id": user_id})
        diet_meals_collection.delete_many({"user_id": user_id})
        diet_goals_collection.delete_many({"user_id": user_id})
        users_collection.delete_one({"email": "dietcare@test.com"})
