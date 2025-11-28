"""
Diet Care API Router

This module provides all endpoints for the Diet Care feature:
- Session management for food analysis
- Nutrition analysis using GPT-4 Vision
- Meal logging and history
- Nutrition goals management
- Progress tracking and statistics
"""
import logging
import uuid
from datetime import datetime, timedelta, date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from bson import ObjectId

from app.api.dependencies import get_current_user
from app.db.connection import (
    diet_sessions_collection,
    diet_meals_collection,
    diet_goals_collection
)
from app.models.diet_care import (
    CreateSessionRequest,
    CreateSessionResponse,
    NutriCoachRequest,
    NutriCoachResponse,
    CreateMealRequest,
    MealResponse,
    MealListResponse,
    GoalsResponse,
    UpdateGoalsRequest,
    DailyProgressResponse,
    WeeklyProgressResponse,
    StreakResponse,
    NutritionGoals,
    UserProfile,
    FoodItem,
    MealType,
    AnalysisStatus,
    NutrientProgress,
    DailySummary
)
from app.services.nutrition_analyzer import get_nutrition_analyzer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/diet-care", tags=["diet-care"])


# ============================================
# Helper Functions
# ============================================

def calculate_nutrient_progress(current: float, target: float) -> NutrientProgress:
    """Calculate progress for a single nutrient"""
    if target == 0:
        percentage = 0
        status = "optimal"
    else:
        percentage = (current / target) * 100

        # Determine status
        if percentage < 80:
            status = "under"
        elif percentage <= 120:
            status = "optimal"
        else:
            status = "over"

    return NutrientProgress(
        current=current,
        target=target,
        percentage=round(percentage, 1),
        status=status
    )


def calculate_totals_from_foods(foods: List[FoodItem]) -> dict:
    """Calculate total nutrition from a list of foods"""
    return {
        "total_calories": sum(f.calories for f in foods),
        "total_protein_g": sum(f.protein_g for f in foods),
        "total_sodium_mg": sum(f.sodium_mg for f in foods),
        "total_potassium_mg": sum(f.potassium_mg for f in foods),
        "total_phosphorus_mg": sum(f.phosphorus_mg for f in foods),
    }


def get_default_goals() -> NutritionGoals:
    """Get default nutrition goals for CKD patients"""
    return NutritionGoals(
        calories_kcal=2000,
        protein_g=50,
        sodium_mg=2000,
        potassium_mg=2000,
        phosphorus_mg=1000,
        fluid_ml=2000
    )


async def get_user_goals(user_id: str) -> NutritionGoals:
    """Get user's nutrition goals or return defaults"""
    goals_doc = diet_goals_collection.find_one({"user_id": user_id})

    if goals_doc:
        return NutritionGoals(**goals_doc["goals"])
    else:
        return get_default_goals()


# ============================================
# Session Management Endpoints
# ============================================

@router.post("/session/create", response_model=CreateSessionResponse)
async def create_analysis_session(
    user_id: str = Depends(get_current_user)
) -> CreateSessionResponse:
    """
    Create a new analysis session for the user.

    A session is required before calling the nutrition analysis endpoint.
    Sessions expire after 1 hour.

    Returns:
        CreateSessionResponse: Session ID and expiration info
    """
    session_id = f"session_{uuid.uuid4().hex}"
    created_at = datetime.utcnow()
    expires_at = created_at + timedelta(hours=1)

    session_doc = {
        "session_id": session_id,
        "user_id": user_id,
        "status": AnalysisStatus.PENDING.value,
        "created_at": created_at,
        "expires_at": expires_at,
        "analysis_result": None,
        "image_url": None
    }

    diet_sessions_collection.insert_one(session_doc)

    logger.info(f"Created analysis session {session_id} for user {user_id}")

    return CreateSessionResponse(
        session_id=session_id,
        created_at=created_at.isoformat(),
        expires_at=expires_at.isoformat()
    )


# ============================================
# Nutrition Analysis Endpoint
# ============================================

@router.post("/nutri-coach", response_model=NutriCoachResponse)
async def analyze_nutrition(
    session_id: str = Form(...),
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    age: Optional[int] = Form(None),
    weight_kg: Optional[float] = Form(None),
    height_cm: Optional[float] = Form(None),
    ckd_stage: Optional[int] = Form(None),
    activity_level: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user)
) -> NutriCoachResponse:
    """
    Analyze food nutrition using GPT-4 Vision.

    Accepts multipart/form-data with:
    - session_id: Session ID from create_analysis_session
    - image: Food image file (optional)
    - text: Text description of the meal (optional)
    - User profile fields: age, weight_kg, height_cm, ckd_stage, activity_level (all optional)

    At least one of image or text must be provided.

    Returns:
        NutriCoachResponse: Detailed nutrition analysis
    """
    # Validate session
    session = diet_sessions_collection.find_one({"session_id": session_id})

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    if session["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session does not belong to this user"
        )

    if session["expires_at"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session has expired"
        )

    if not image and not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of 'image' or 'text' is required"
        )

    # Update session status
    diet_sessions_collection.update_one(
        {"session_id": session_id},
        {"$set": {"status": AnalysisStatus.PROCESSING.value}}
    )

    try:
        # Read image data if provided
        image_data = None
        if image:
            image_data = await image.read()
            logger.info(f"Received image: {image.filename}, size: {len(image_data)} bytes")

        # Build user profile
        user_profile = None
        if any([age, weight_kg, height_cm, ckd_stage, activity_level]):
            user_profile = UserProfile(
                age=age,
                weight_kg=weight_kg,
                height_cm=height_cm,
                ckd_stage=ckd_stage,
                activity_level=activity_level
            )

        # Get analyzer and perform analysis
        analyzer = get_nutrition_analyzer()
        analysis_result = await analyzer.analyze_meal(
            image_data=image_data,
            text_description=text,
            user_profile=user_profile
        )

        # Update session with result
        analyzed_at = datetime.utcnow()
        diet_sessions_collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "status": AnalysisStatus.COMPLETED.value,
                    "analysis_result": analysis_result.model_dump(),
                    "analyzed_at": analyzed_at
                }
            }
        )

        logger.info(f"Analysis completed for session {session_id}")

        return NutriCoachResponse(
            session_id=session_id,
            analysis=analysis_result,
            analyzed_at=analyzed_at.isoformat(),
            image_url=None  # TODO: Implement image upload to S3/storage
        )

    except ValueError as e:
        # Update session with failed status
        diet_sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": {"status": AnalysisStatus.FAILED.value}}
        )
        logger.error(f"Validation error in nutrition analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Update session with failed status
        diet_sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": {"status": AnalysisStatus.FAILED.value}}
        )
        logger.error(f"Error in nutrition analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze nutrition: {str(e)}"
        )


# ============================================
# Meal Logging Endpoints
# ============================================

@router.post("/meals", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
async def create_meal(
    meal: CreateMealRequest,
    user_id: str = Depends(get_current_user)
) -> MealResponse:
    """
    Log a new meal entry.

    Request body:
        {
            "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
            "foods": [FoodItem],
            "logged_at": "2024-01-01T12:00:00Z" (optional),
            "notes": "string" (optional),
            "image_url": "string" (optional)
        }

    Returns:
        MealResponse: Created meal entry
    """
    # Calculate totals
    totals = calculate_totals_from_foods(meal.foods)

    # Create meal document
    created_at = datetime.utcnow()
    meal_doc = {
        "user_id": user_id,
        "meal_type": meal.meal_type.value,
        "foods": [food.model_dump() for food in meal.foods],
        **totals,
        "logged_at": meal.logged_at or created_at,
        "notes": meal.notes,
        "image_url": meal.image_url,
        "created_at": created_at,
        "updated_at": created_at
    }

    result = diet_meals_collection.insert_one(meal_doc)

    logger.info(f"Created meal {result.inserted_id} for user {user_id}")

    return MealResponse(
        id=str(result.inserted_id),
        user_id=user_id,
        meal_type=meal.meal_type,
        foods=meal.foods,
        **totals,
        logged_at=meal_doc["logged_at"].isoformat(),
        notes=meal.notes,
        image_url=meal.image_url,
        created_at=created_at.isoformat()
    )


@router.get("/meals", response_model=MealListResponse)
async def get_meals(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user)
) -> MealListResponse:
    """
    Get meal entries for a date range.

    Query params:
        - start_date: ISO date string (default: 7 days ago)
        - end_date: ISO date string (default: today)

    Returns:
        MealListResponse: List of meals in date range
    """
    # Parse dates
    if end_date:
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    else:
        end = datetime.utcnow()

    if start_date:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    else:
        start = end - timedelta(days=7)

    # Query meals
    query = {
        "user_id": user_id,
        "logged_at": {
            "$gte": start,
            "$lte": end
        }
    }

    meals = list(diet_meals_collection.find(query).sort("logged_at", -1))

    # Convert to response models
    meal_responses = []
    for meal_doc in meals:
        foods = [FoodItem(**food) for food in meal_doc["foods"]]

        meal_responses.append(MealResponse(
            id=str(meal_doc["_id"]),
            user_id=meal_doc["user_id"],
            meal_type=MealType(meal_doc["meal_type"]),
            foods=foods,
            total_calories=meal_doc["total_calories"],
            total_protein_g=meal_doc["total_protein_g"],
            total_sodium_mg=meal_doc["total_sodium_mg"],
            total_potassium_mg=meal_doc["total_potassium_mg"],
            total_phosphorus_mg=meal_doc["total_phosphorus_mg"],
            logged_at=meal_doc["logged_at"].isoformat(),
            notes=meal_doc.get("notes"),
            image_url=meal_doc.get("image_url"),
            created_at=meal_doc["created_at"].isoformat()
        ))

    return MealListResponse(
        meals=meal_responses,
        total_count=len(meal_responses),
        date_range={
            "start": start.isoformat(),
            "end": end.isoformat()
        }
    )


@router.delete("/meals/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal(
    meal_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete a meal entry.

    Only the owner of the meal can delete it.

    Returns:
        204 No Content on success
    """
    # Validate meal ID
    try:
        meal_object_id = ObjectId(meal_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid meal ID format"
        )

    # Find meal
    meal = diet_meals_collection.find_one({"_id": meal_object_id})

    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )

    # Check ownership
    if meal["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own meals"
        )

    # Delete meal
    diet_meals_collection.delete_one({"_id": meal_object_id})

    logger.info(f"Deleted meal {meal_id} for user {user_id}")


# ============================================
# Goal Management Endpoints
# ============================================

@router.get("/goals", response_model=GoalsResponse)
async def get_nutrition_goals(
    user_id: str = Depends(get_current_user)
) -> GoalsResponse:
    """
    Get user's nutrition goals.

    Returns default goals if not set.

    Returns:
        GoalsResponse: Nutrition goals
    """
    goals_doc = diet_goals_collection.find_one({"user_id": user_id})

    if goals_doc:
        return GoalsResponse(
            user_id=user_id,
            goals=NutritionGoals(**goals_doc["goals"]),
            last_updated=goals_doc["updated_at"].isoformat()
        )
    else:
        # Return defaults
        default_goals = get_default_goals()
        return GoalsResponse(
            user_id=user_id,
            goals=default_goals,
            last_updated=datetime.utcnow().isoformat()
        )


@router.put("/goals", response_model=GoalsResponse)
async def update_nutrition_goals(
    update: UpdateGoalsRequest,
    user_id: str = Depends(get_current_user)
) -> GoalsResponse:
    """
    Update user's nutrition goals.

    Only provided fields will be updated.

    Request body:
        {
            "calories_kcal": number (optional),
            "protein_g": number (optional),
            "sodium_mg": number (optional),
            "potassium_mg": number (optional),
            "phosphorus_mg": number (optional),
            "fluid_ml": number (optional)
        }

    Returns:
        GoalsResponse: Updated nutrition goals
    """
    # Get current goals or defaults
    current_goals = await get_user_goals(user_id)

    # Update with provided values
    update_dict = update.model_dump(exclude_none=True)
    for key, value in update_dict.items():
        setattr(current_goals, key, value)

    # Save to database
    updated_at = datetime.utcnow()
    diet_goals_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "goals": current_goals.model_dump(),
                "updated_at": updated_at
            },
            "$setOnInsert": {
                "user_id": user_id,
                "created_at": updated_at
            }
        },
        upsert=True
    )

    logger.info(f"Updated nutrition goals for user {user_id}")

    return GoalsResponse(
        user_id=user_id,
        goals=current_goals,
        last_updated=updated_at.isoformat()
    )


# ============================================
# Progress & Statistics Endpoints
# ============================================

@router.get("/progress/daily", response_model=DailyProgressResponse)
async def get_daily_progress(
    date_str: Optional[str] = None,
    user_id: str = Depends(get_current_user)
) -> DailyProgressResponse:
    """
    Get daily nutrition progress.

    Query params:
        - date: ISO date string (default: today)

    Returns:
        DailyProgressResponse: Progress for the specified date
    """
    # Parse date
    if date_str:
        target_date = datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
    else:
        target_date = datetime.utcnow().date()

    # Get goals
    goals = await get_user_goals(user_id)

    # Get meals for the date
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())

    query = {
        "user_id": user_id,
        "logged_at": {
            "$gte": start_of_day,
            "$lte": end_of_day
        }
    }

    meals = list(diet_meals_collection.find(query))

    # Calculate totals
    total_calories = sum(m["total_calories"] for m in meals)
    total_protein = sum(m["total_protein_g"] for m in meals)
    total_sodium = sum(m["total_sodium_mg"] for m in meals)
    total_potassium = sum(m["total_potassium_mg"] for m in meals)
    total_phosphorus = sum(m["total_phosphorus_mg"] for m in meals)

    # Calculate progress for each nutrient
    return DailyProgressResponse(
        date=target_date.isoformat(),
        calories=calculate_nutrient_progress(total_calories, goals.calories_kcal),
        protein=calculate_nutrient_progress(total_protein, goals.protein_g),
        sodium=calculate_nutrient_progress(total_sodium, goals.sodium_mg),
        potassium=calculate_nutrient_progress(total_potassium, goals.potassium_mg),
        phosphorus=calculate_nutrient_progress(total_phosphorus, goals.phosphorus_mg),
        meals_logged=len(meals),
        total_meals=3
    )


@router.get("/progress/weekly", response_model=WeeklyProgressResponse)
async def get_weekly_progress(
    user_id: str = Depends(get_current_user)
) -> WeeklyProgressResponse:
    """
    Get weekly nutrition summary.

    Returns summary for the past 7 days.

    Returns:
        WeeklyProgressResponse: Weekly summary and statistics
    """
    # Get date range
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=6)  # 7 days total

    # Get goals
    goals = await get_user_goals(user_id)

    # Get all meals in range
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    query = {
        "user_id": user_id,
        "logged_at": {
            "$gte": start_datetime,
            "$lte": end_datetime
        }
    }

    meals = list(diet_meals_collection.find(query))

    # Group meals by date
    meals_by_date = {}
    for meal in meals:
        meal_date = meal["logged_at"].date()
        if meal_date not in meals_by_date:
            meals_by_date[meal_date] = []
        meals_by_date[meal_date].append(meal)

    # Calculate daily summaries
    daily_summaries = []
    total_compliance = 0

    for day_offset in range(7):
        current_date = start_date + timedelta(days=day_offset)
        day_meals = meals_by_date.get(current_date, [])

        # Calculate totals
        total_calories = sum(m["total_calories"] for m in day_meals)
        total_protein = sum(m["total_protein_g"] for m in day_meals)
        total_sodium = sum(m["total_sodium_mg"] for m in day_meals)
        total_potassium = sum(m["total_potassium_mg"] for m in day_meals)
        total_phosphorus = sum(m["total_phosphorus_mg"] for m in day_meals)

        # Calculate compliance score (0-100)
        # Based on how well the user stayed within goals
        compliance_scores = []

        if goals.calories_kcal > 0:
            cal_score = max(0, 100 - abs(total_calories - goals.calories_kcal) / goals.calories_kcal * 100)
            compliance_scores.append(cal_score)

        if goals.sodium_mg > 0:
            sodium_score = 100 if total_sodium <= goals.sodium_mg else max(0, 100 - (total_sodium - goals.sodium_mg) / goals.sodium_mg * 100)
            compliance_scores.append(sodium_score)

        if goals.potassium_mg > 0:
            potassium_score = 100 if total_potassium <= goals.potassium_mg else max(0, 100 - (total_potassium - goals.potassium_mg) / goals.potassium_mg * 100)
            compliance_scores.append(potassium_score)

        compliance_score = sum(compliance_scores) / len(compliance_scores) if compliance_scores else 0

        daily_summaries.append(DailySummary(
            date=current_date.isoformat(),
            total_calories=total_calories,
            total_protein_g=total_protein,
            total_sodium_mg=total_sodium,
            total_potassium_mg=total_potassium,
            total_phosphorus_mg=total_phosphorus,
            meals_count=len(day_meals),
            compliance_score=round(compliance_score, 1)
        ))

        total_compliance += compliance_score

    # Calculate average compliance
    average_compliance = total_compliance / 7 if daily_summaries else 0

    # Calculate streak
    streak = 0
    for summary in reversed(daily_summaries):
        if summary.meals_count > 0:
            streak += 1
        else:
            break

    return WeeklyProgressResponse(
        week_start=start_date.isoformat(),
        week_end=end_date.isoformat(),
        daily_summaries=daily_summaries,
        average_compliance=round(average_compliance, 1),
        streak_days=streak,
        total_meals_logged=sum(s.meals_count for s in daily_summaries)
    )


@router.get("/streak", response_model=StreakResponse)
async def get_logging_streak(
    user_id: str = Depends(get_current_user)
) -> StreakResponse:
    """
    Get user's logging streak.

    A streak is the number of consecutive days with at least one meal logged.

    Returns:
        StreakResponse: Current and longest streak information
    """
    # Get all meals for the user
    meals = list(diet_meals_collection.find(
        {"user_id": user_id}
    ).sort("logged_at", -1))

    if not meals:
        return StreakResponse(
            current_streak=0,
            longest_streak=0,
            last_log_date=None
        )

    # Get unique dates with meals
    dates_with_meals = set()
    for meal in meals:
        meal_date = meal["logged_at"].date()
        dates_with_meals.add(meal_date)

    sorted_dates = sorted(dates_with_meals, reverse=True)

    # Calculate current streak
    current_streak = 0
    today = datetime.utcnow().date()
    expected_date = today

    for meal_date in sorted_dates:
        if meal_date == expected_date:
            current_streak += 1
            expected_date -= timedelta(days=1)
        elif meal_date == expected_date + timedelta(days=1):
            # Allow for today not being logged yet
            expected_date = meal_date - timedelta(days=1)
            current_streak += 1
        else:
            break

    # Calculate longest streak
    longest_streak = 0
    temp_streak = 1

    for i in range(1, len(sorted_dates)):
        if sorted_dates[i-1] - sorted_dates[i] == timedelta(days=1):
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 1

    longest_streak = max(longest_streak, temp_streak, current_streak)

    return StreakResponse(
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_log_date=sorted_dates[0].isoformat() if sorted_dates else None
    )
