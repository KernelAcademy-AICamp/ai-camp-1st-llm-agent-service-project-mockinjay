# Backend API Specification

**CareGuide Backend API - Comprehensive Endpoint Documentation**

**Generated:** 2025-11-27
**Base URL:** `http://localhost:8000`
**API Version:** 1.0.0

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Chat System](#2-chat-system)
3. [Diet Care](#3-diet-care)
4. [Community](#4-community)
5. [Trends & Research Papers](#5-trends--research-papers)
6. [Quiz System](#6-quiz-system)
7. [MyPage & User Management](#7-mypage--user-management)
8. [Rooms Management](#8-rooms-management)
9. [Session Management](#9-session-management)
10. [Notifications](#10-notifications)

---

## 1. Authentication & Authorization

### Base Path: `/api/auth`

#### 1.1 Register User
- **Endpoint:** `POST /api/auth/register`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "fullName": "string (optional)",
    "profile": "general | patient | researcher (default: general)"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "access_token": "string",
    "token_type": "bearer",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "fullName": "string",
      "profile": "string",
      "parlant_customer_id": "string"
    }
  }
  ```
- **Errors:**
  - `400` - Validation error (duplicate username/email, weak password)
  - `500` - Server error

#### 1.2 Login
- **Endpoint:** `POST /api/auth/login`
- **Authentication:** None
- **Request Body:** `application/x-www-form-urlencoded`
  ```
  username: string (username or email)
  password: string
  ```
- **Response:** `200 OK`
  ```json
  {
    "access_token": "string",
    "token_type": "bearer",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "fullName": "string",
      "profile": "string",
      "parlant_customer_id": "string"
    }
  }
  ```
- **Errors:**
  - `401` - Invalid credentials

#### 1.3 Get Current User
- **Endpoint:** `GET /api/auth/me`
- **Authentication:** Required (Bearer token)
- **Response:** `200 OK`
  ```json
  {
    "id": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "profile": "string",
    "role": "string",
    "parlant_customer_id": "string"
  }
  ```

#### 1.4 Update User Profile
- **Endpoint:** `PATCH /api/auth/profile`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "profile": "general | patient | researcher"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "string",
    "profile": "string"
  }
  ```

#### 1.5 Dev Login (Development Only)
- **Endpoint:** `POST /api/auth/dev-login`
- **Authentication:** None
- **Description:** Auto-creates and logs in test user
- **Response:** Same as Login

---

## 2. Chat System

### Base Path: `/api/chat`

#### 2.1 Chat Info
- **Endpoint:** `GET /api/chat/info`
- **Authentication:** None
- **Response:** `200 OK`
  ```json
  {
    "service": "Chat API (Router + Parlant Proxy)",
    "router_agent": "active",
    "servers": {
      "research": "http://127.0.0.1:8800",
      "welfare": "http://127.0.0.1:8801"
    },
    "status": "operational"
  }
  ```

#### 2.2 Send Chat Message (Streaming)
- **Endpoint:** `POST /api/chat/message`
- **Authentication:** Optional
- **Request Body:**
  ```json
  {
    "query": "string (required)",
    "message": "string (alternative to query)",
    "session_id": "string (default: 'default')",
    "user_id": "string (optional)",
    "room_id": "string (optional)",
    "agent_type": "string (optional, default: 'auto')",
    "profile": "string (optional, default: 'general')",
    "context": {
      "target_agent": "string (optional)",
      "user_history": {}
    }
  }
  ```
- **Response:** `text/event-stream` (Server-Sent Events)
  ```
  data: {"status": "streaming", "content": "...", "agent_type": "..."}
  data: {"status": "complete", "content": "...", "agent_type": "..."}
  data: [DONE]
  ```
- **Headers:**
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
  - `X-Accel-Buffering: no`

#### 2.3 Stream Endpoint (Alternative)
- **Endpoint:** `POST /api/chat/stream`
- **Same as `/message` - provides streaming chat**

#### 2.4 Get User Rooms (Deprecated)
- **Endpoint:** `GET /api/chat/rooms?user_id={user_id}`
- **Authentication:** Optional
- **Note:** Use `/api/rooms` instead
- **Response:** `200 OK`
  ```json
  {
    "user_id": "string",
    "rooms": [
      {
        "room_id": "string",
        "room_name": "string",
        "last_activity": "ISO 8601",
        "message_count": 0
      }
    ],
    "count": 0
  }
  ```

#### 2.5 Get Room History
- **Endpoint:** `GET /api/chat/rooms/{room_id}/history?limit=50`
- **Authentication:** Optional
- **Query Params:**
  - `limit`: number (default: 50)
- **Response:** `200 OK`
  ```json
  {
    "room_id": "string",
    "count": 0,
    "conversations": [
      {
        "timestamp": "ISO 8601",
        "user_input": "string",
        "agent_response": "string",
        "agent_type": "string",
        "session_id": "string",
        "room_id": "string"
      }
    ]
  }
  ```

#### 2.6 Get Agent History
- **Endpoint:** `GET /api/chat/history/{agent_type}?user_id={user_id}&session_id={session_id}&limit=50`
- **Authentication:** Optional
- **Path Params:**
  - `agent_type`: `nutrition | medical_welfare | research_paper | quiz | trend_visualization`
- **Query Params:**
  - `user_id`: string (optional, but required if no session_id)
  - `session_id`: string (optional, but required if no user_id)
  - `limit`: number (default: 50)
- **Response:** `200 OK`
  ```json
  {
    "agent_type": "string",
    "count": 0,
    "conversations": [...]
  }
  ```

#### 2.7 Get All History
- **Endpoint:** `GET /api/chat/history?user_id={user_id}&limit=50`
- **Authentication:** Optional
- **Query Params:**
  - `user_id`: string (required)
  - `session_id`: string (optional)
  - `limit`: number (default: 50)
- **Response:** `200 OK`
  ```json
  {
    "count": 0,
    "conversations": [...]
  }
  ```

---

## 3. Diet Care

### Base Path: `/api/diet-care`

#### 3.1 Create Analysis Session
- **Endpoint:** `POST /api/diet-care/session/create`
- **Authentication:** Required
- **Response:** `201 Created`
  ```json
  {
    "session_id": "string",
    "created_at": "ISO 8601",
    "expires_at": "ISO 8601"
  }
  ```

#### 3.2 Nutrition Analysis (Nutri-Coach)
- **Endpoint:** `POST /api/diet-care/nutri-coach`
- **Authentication:** Required
- **Content-Type:** `multipart/form-data`
- **Request Body:**
  ```
  session_id: string (required)
  text: string (optional)
  image: file (optional)
  age: integer (optional)
  weight_kg: float (optional)
  height_cm: float (optional)
  ckd_stage: integer (optional)
  activity_level: string (optional)
  ```
- **Note:** At least one of `text` or `image` is required
- **Response:** `200 OK`
  ```json
  {
    "session_id": "string",
    "analysis": {
      "foods": [
        {
          "food_name": "string",
          "quantity": "string",
          "calories": 0,
          "protein_g": 0,
          "sodium_mg": 0,
          "potassium_mg": 0,
          "phosphorus_mg": 0
        }
      ],
      "total_calories": 0,
      "total_protein_g": 0,
      "total_sodium_mg": 0,
      "total_potassium_mg": 0,
      "total_phosphorus_mg": 0,
      "warnings": ["string"],
      "recommendations": ["string"],
      "summary": "string"
    },
    "analyzed_at": "ISO 8601",
    "image_url": "string"
  }
  ```

#### 3.3 Create Meal Log
- **Endpoint:** `POST /api/diet-care/meals`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "meal_type": "breakfast | lunch | dinner | snack",
    "foods": [
      {
        "food_name": "string",
        "quantity": "string",
        "calories": 0,
        "protein_g": 0,
        "sodium_mg": 0,
        "potassium_mg": 0,
        "phosphorus_mg": 0
      }
    ],
    "logged_at": "ISO 8601 (optional)",
    "notes": "string (optional)",
    "image_url": "string (optional)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "string",
    "user_id": "string",
    "meal_type": "string",
    "foods": [...],
    "total_calories": 0,
    "total_protein_g": 0,
    "total_sodium_mg": 0,
    "total_potassium_mg": 0,
    "total_phosphorus_mg": 0,
    "logged_at": "ISO 8601",
    "notes": "string",
    "image_url": "string",
    "created_at": "ISO 8601"
  }
  ```

#### 3.4 Get Meals
- **Endpoint:** `GET /api/diet-care/meals?start_date={date}&end_date={date}`
- **Authentication:** Required
- **Query Params:**
  - `start_date`: ISO date string (optional, default: 7 days ago)
  - `end_date`: ISO date string (optional, default: today)
- **Response:** `200 OK`
  ```json
  {
    "meals": [...],
    "total_count": 0,
    "date_range": {
      "start": "ISO 8601",
      "end": "ISO 8601"
    }
  }
  ```

#### 3.5 Delete Meal
- **Endpoint:** `DELETE /api/diet-care/meals/{meal_id}`
- **Authentication:** Required
- **Response:** `204 No Content`

#### 3.6 Get Nutrition Goals
- **Endpoint:** `GET /api/diet-care/goals`
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "user_id": "string",
    "goals": {
      "calories_kcal": 2000,
      "protein_g": 50,
      "sodium_mg": 2000,
      "potassium_mg": 2000,
      "phosphorus_mg": 1000,
      "fluid_ml": 2000
    },
    "last_updated": "ISO 8601"
  }
  ```

#### 3.7 Update Nutrition Goals
- **Endpoint:** `PUT /api/diet-care/goals`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "calories_kcal": 2000,
    "protein_g": 50,
    "sodium_mg": 2000,
    "potassium_mg": 2000,
    "phosphorus_mg": 1000,
    "fluid_ml": 2000
  }
  ```
- **Note:** All fields are optional - only provided fields will be updated
- **Response:** `200 OK` (same as Get Goals)

#### 3.8 Get Daily Progress
- **Endpoint:** `GET /api/diet-care/progress/daily?date={date}`
- **Authentication:** Required
- **Query Params:**
  - `date`: ISO date string (optional, default: today)
- **Response:** `200 OK`
  ```json
  {
    "date": "ISO date",
    "calories": {
      "current": 0,
      "target": 0,
      "percentage": 0,
      "status": "under | optimal | over"
    },
    "protein": {...},
    "sodium": {...},
    "potassium": {...},
    "phosphorus": {...},
    "meals_logged": 0,
    "total_meals": 3
  }
  ```

#### 3.9 Get Weekly Progress
- **Endpoint:** `GET /api/diet-care/progress/weekly`
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "week_start": "ISO date",
    "week_end": "ISO date",
    "daily_summaries": [
      {
        "date": "ISO date",
        "total_calories": 0,
        "total_protein_g": 0,
        "total_sodium_mg": 0,
        "total_potassium_mg": 0,
        "total_phosphorus_mg": 0,
        "meals_count": 0,
        "compliance_score": 0
      }
    ],
    "average_compliance": 0,
    "streak_days": 0,
    "total_meals_logged": 0
  }
  ```

#### 3.10 Get Logging Streak
- **Endpoint:** `GET /api/diet-care/streak`
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "current_streak": 0,
    "longest_streak": 0,
    "last_log_date": "ISO date"
  }
  ```

---

## 4. Community

### Base Path: `/api/community`

#### 4.1 Get Posts (Infinite Scroll)
- **Endpoint:** `GET /api/community/posts?limit=20&cursor={cursor}&postType={type}&sortBy={field}`
- **Authentication:** Optional (supports anonymous)
- **Query Params:**
  - `limit`: 1-50 (default: 20)
  - `cursor`: string (last post ID from previous request)
  - `postType`: `BOARD | CHALLENGE | SURVEY` (optional)
  - `sortBy`: `createdAt | likes | lastActivityAt` (default: lastActivityAt)
- **Response:** `200 OK`
  ```json
  {
    "posts": [
      {
        "id": "string",
        "userId": "string",
        "authorName": "string",
        "isAnonymous": true,
        "title": "string",
        "content": "string",
        "postType": "BOARD | CHALLENGE | SURVEY",
        "imageUrls": ["string"],
        "thumbnailUrl": "string",
        "likes": 0,
        "commentCount": 0,
        "viewCount": 0,
        "createdAt": "ISO 8601",
        "updatedAt": "ISO 8601",
        "lastActivityAt": "ISO 8601",
        "isPinned": false
      }
    ],
    "nextCursor": "string",
    "hasMore": true
  }
  ```

#### 4.2 Get Featured Posts
- **Endpoint:** `GET /api/community/posts/featured`
- **Authentication:** Optional
- **Description:** Returns top 3 featured posts (pinned + popular)
- **Response:** `200 OK`
  ```json
  {
    "featuredPosts": [...]
  }
  ```

#### 4.3 Get Post Detail
- **Endpoint:** `GET /api/community/posts/{postId}`
- **Authentication:** Optional
- **Response:** `200 OK`
  ```json
  {
    "post": {
      "id": "string",
      "userId": "string",
      "author": {
        "id": "string",
        "name": "string",
        "profileImage": "string"
      },
      "authorId": "string",
      "likedByMe": false,
      "title": "string",
      "content": "string",
      ...
    },
    "comments": [
      {
        "id": "string",
        "postId": "string",
        "userId": "string",
        "author": {
          "id": "string",
          "name": "string",
          "profileImage": "string"
        },
        "authorId": "string",
        "authorName": "string",
        "isAnonymous": true,
        "content": "string",
        "createdAt": "ISO 8601",
        "updatedAt": "ISO 8601"
      }
    ]
  }
  ```

#### 4.4 Create Post
- **Endpoint:** `POST /api/community/posts`
- **Authentication:** Optional (supports anonymous)
- **Request Body:**
  ```json
  {
    "title": "string",
    "content": "string",
    "postType": "BOARD | CHALLENGE | SURVEY",
    "imageUrls": ["string"],
    "isAnonymous": true,
    "anonymousId": "string (optional, for consistent anonymous ID)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "string",
    "userId": "string",
    "authorName": "익명(글쓴이) | username",
    ...
  }
  ```

#### 4.5 Update Post
- **Endpoint:** `PUT /api/community/posts/{postId}`
- **Authentication:** Required (must be post author)
- **Request Body:**
  ```json
  {
    "title": "string (optional)",
    "content": "string (optional)",
    "imageUrls": ["string"] (optional)
  }
  ```
- **Response:** `200 OK`

#### 4.6 Delete Post
- **Endpoint:** `DELETE /api/community/posts/{postId}?anonymousId={id}`
- **Authentication:** Optional (must be post author)
- **Query Params:**
  - `anonymousId`: string (optional, for anonymous users)
- **Response:** `204 No Content`

#### 4.7 Create Comment
- **Endpoint:** `POST /api/community/comments`
- **Authentication:** Optional
- **Request Body:**
  ```json
  {
    "postId": "string",
    "content": "string",
    "isAnonymous": true,
    "anonymousId": "string (optional)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "string",
    "postId": "string",
    "userId": "string",
    "authorName": "익명1 | 익명2 | 익명(글쓴이) | username",
    ...
  }
  ```
- **Note:** Anonymous numbering is per-post. Post author is always "익명(글쓴이)", commenters get "익명1", "익명2", etc.

#### 4.8 Update Comment
- **Endpoint:** `PUT /api/community/comments/{commentId}`
- **Authentication:** Required (must be comment author)
- **Request Body:**
  ```json
  {
    "content": "string"
  }
  ```
- **Response:** `200 OK`

#### 4.9 Delete Comment
- **Endpoint:** `DELETE /api/community/comments/{commentId}?anonymousId={id}`
- **Authentication:** Optional (must be comment author OR post author)
- **Response:** `204 No Content`

#### 4.10 Like Post
- **Endpoint:** `POST /api/community/posts/{postId}/like`
- **Authentication:** Optional
- **Response:** `200 OK`
  ```json
  {
    "message": "Post liked successfully",
    "liked": true
  }
  ```
- **Errors:**
  - `400` - Already liked

#### 4.11 Unlike Post
- **Endpoint:** `DELETE /api/community/posts/{postId}/like`
- **Authentication:** Optional
- **Response:** `200 OK`
  ```json
  {
    "message": "Post unliked successfully",
    "liked": false
  }
  ```

#### 4.12 Upload Image
- **Endpoint:** `POST /api/community/uploads`
- **Authentication:** Optional
- **Content-Type:** `multipart/form-data`
- **Request Body:**
  ```
  file: image file (.jpg, .jpeg, .png, .gif, .webp)
  ```
- **Response:** `201 Created`
  ```json
  {
    "url": "/uploads/20231215_143022_image.jpg",
    "filename": "20231215_143022_image.jpg"
  }
  ```

#### 4.13 Debug Endpoint
- **Endpoint:** `GET /api/community/debug`
- **Authentication:** None
- **Description:** Returns database statistics for troubleshooting

---

## 5. Trends & Research Papers

### Base Path: `/api/trends`

#### 5.1 Analyze Temporal Trends
- **Endpoint:** `POST /api/trends/temporal`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "query": "string",
    "start_year": 2015,
    "end_year": 2024,
    "normalize": true,
    "session_id": "default",
    "language": "ko | en"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "answer": "string (trend explanation)",
    "status": "success",
    "agent_type": "trend_visualization",
    "metadata": {
      "chart_config": {
        "type": "line",
        "data": {...},
        "options": {...}
      },
      "recent_papers": [...],
      "peak_year": 2023,
      "total_papers": 1234
    }
  }
  ```

#### 5.2 Analyze Geographic Distribution
- **Endpoint:** `POST /api/trends/geographic`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "query": "string",
    "countries": ["USA", "Korea"],
    "session_id": "default",
    "language": "ko | en"
  }
  ```
- **Response:** `200 OK` (similar structure with geographic chart config)

#### 5.3 Analyze MeSH Categories
- **Endpoint:** `POST /api/trends/mesh`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "query": "string",
    "session_id": "default",
    "language": "ko | en"
  }
  ```
- **Response:** `200 OK` (with MeSH category distributions)

#### 5.4 Compare Keywords
- **Endpoint:** `POST /api/trends/compare`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "start_year": 2015,
    "end_year": 2024,
    "session_id": "default",
    "language": "ko | en"
  }
  ```
- **Note:** 2-4 keywords required
- **Response:** `200 OK` (with multi-line comparison chart)

#### 5.5 Search Papers
- **Endpoint:** `POST /api/trends/papers`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "query": "string",
    "max_results": 10,
    "sort": "relevance | pub_date",
    "session_id": "default"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "papers": [
      {
        "pmid": "string",
        "title": "string",
        "abstract": "string",
        "authors": ["string"],
        "pub_date": "ISO 8601",
        "journal": "string",
        "doi": "string",
        "mesh_terms": ["string"]
      }
    ],
    "total": 10,
    "query": "string",
    "status": "success"
  }
  ```

#### 5.6 Summarize Papers
- **Endpoint:** `POST /api/trends/summarize`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "papers": [...],
    "query": "string",
    "language": "ko | en",
    "summary_type": "single | multiple"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "summary": {
      "overview": "string",
      "key_themes": ["string"],
      "trends": ["string"],
      "implications": ["string"],
      "recommendations": ["string"]
    },
    "tokens_used": 1234,
    "papers_analyzed": 10,
    "status": "success"
  }
  ```

#### 5.7 Generate One-Line Summaries
- **Endpoint:** `POST /api/trends/one-line-summaries`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "papers": [...],
    "language": "ko | en"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "papers": [
      {
        "pmid": "string",
        "title": "string",
        "one_line_summary": "string",
        ...
      }
    ],
    "status": "success"
  }
  ```

#### 5.8 Translate Abstracts
- **Endpoint:** `POST /api/trends/translate`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "papers": [...],
    "target_language": "ko | en"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "papers": [
      {
        "pmid": "string",
        "abstract": "string (original)",
        "abstract_translated": "string",
        ...
      }
    ],
    "status": "success"
  }
  ```

#### 5.9 Health Check
- **Endpoint:** `GET /api/trends/health`
- **Authentication:** None
- **Response:** `200 OK`
  ```json
  {
    "status": "healthy",
    "service": "trends_api",
    "components": {
      "trend_agent": "ready",
      "summarization_service": "ready",
      "pubmed_client": "ready"
    }
  }
  ```

---

## 6. Quiz System

### Base Path: `/api/quiz`

#### 6.1 Start Quiz Session
- **Endpoint:** `POST /api/quiz/session/start`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "userId": "string",
    "sessionType": "daily | adaptive | challenge",
    "category": "nutrition | medical_welfare | general (optional)",
    "difficulty": "easy | medium | hard (optional)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "sessionId": "string",
    "userId": "string",
    "sessionType": "string",
    "totalQuestions": 5,
    "currentQuestionNumber": 1,
    "score": 0,
    "status": "active",
    "currentQuestion": {
      "questionId": "string",
      "questionText": "string",
      "options": ["A", "B", "C", "D"],
      "category": "string",
      "difficulty": "string"
    }
  }
  ```

#### 6.2 Submit Answer
- **Endpoint:** `POST /api/quiz/session/submit-answer`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "sessionId": "string",
    "userId": "string",
    "questionId": "string",
    "userAnswer": "A | B | C | D"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "isCorrect": true,
    "correctAnswer": "A",
    "explanation": "string",
    "pointsEarned": 10,
    "currentScore": 10,
    "consecutiveCorrect": 1,
    "questionStats": {
      "timeTaken": 15,
      "attemptsLeft": 2
    },
    "nextQuestion": {
      "questionId": "string",
      ...
    }
  }
  ```

#### 6.3 Complete Session
- **Endpoint:** `POST /api/quiz/session/complete?sessionId={sessionId}`
- **Authentication:** None
- **Query Params:**
  - `sessionId`: string (required)
- **Response:** `200 OK`
  ```json
  {
    "sessionId": "string",
    "userId": "string",
    "sessionType": "string",
    "totalQuestions": 5,
    "correctAnswers": 4,
    "finalScore": 40,
    "accuracyRate": 80.0,
    "completedAt": "ISO 8601",
    "streak": 3,
    "categoryPerformance": [
      {
        "category": "nutrition",
        "correct": 3,
        "total": 4,
        "accuracy": 75.0
      }
    ]
  }
  ```

#### 6.4 Get User Stats
- **Endpoint:** `GET /api/quiz/stats?userId={userId}`
- **Authentication:** None
- **Query Params:**
  - `userId`: string (required)
- **Response:** `200 OK`
  ```json
  {
    "userId": "string",
    "totalSessions": 15,
    "totalQuestions": 75,
    "correctAnswers": 60,
    "totalScore": 600,
    "accuracyRate": 80.0,
    "currentStreak": 3,
    "bestStreak": 7,
    "level": "intermediate",
    "lastSessionDate": "ISO 8601"
  }
  ```

#### 6.5 Get Quiz History
- **Endpoint:** `GET /api/quiz/history?userId={userId}&limit=10&offset=0`
- **Authentication:** None
- **Query Params:**
  - `userId`: string (required)
  - `limit`: number (default: 10, max: 50)
  - `offset`: number (default: 0)
- **Response:** `200 OK`
  ```json
  {
    "sessions": [
      {
        "sessionId": "string",
        "sessionType": "string",
        "totalQuestions": 5,
        "correctAnswers": 4,
        "finalScore": 40,
        "accuracyRate": 80.0,
        "completedAt": "ISO 8601"
      }
    ],
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
  ```

---

## 7. MyPage & User Management

### Base Path: `/api/mypage`

#### 7.1 Get User Profile
- **Endpoint:** `GET /api/mypage/profile`
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "id": "string",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "bio": "string",
    "profileImage": "string",
    "profile": "general | patient | researcher",
    "role": "user | admin",
    "createdAt": "ISO 8601"
  }
  ```

#### 7.2 Update User Profile
- **Endpoint:** `PUT /api/mypage/profile`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "fullName": "string (optional)",
    "bio": "string (optional)",
    "profileImage": "string (optional)"
  }
  ```
- **Response:** `200 OK` (same as Get Profile)

#### 7.3 Get Health Profile
- **Endpoint:** `GET /api/mypage/health-profile`
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "userId": "string",
    "conditions": ["string"],
    "allergies": ["string"],
    "dietaryRestrictions": ["string"],
    "age": 45,
    "gender": "male | female | other",
    "updatedAt": "ISO 8601"
  }
  ```

#### 7.4 Update Health Profile
- **Endpoint:** `PUT /api/mypage/health-profile`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "conditions": ["string"] (optional),
    "allergies": ["string"] (optional),
    "dietaryRestrictions": ["string"] (optional),
    "age": 45 (optional),
    "gender": "male | female | other" (optional)
  }
  ```
- **Response:** `200 OK` (same as Get Health Profile)

#### 7.5 Get User Preferences
- **Endpoint:** `GET /api/mypage/preferences`
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "userId": "string",
    "theme": "light | dark",
    "language": "ko | en",
    "notifications": {
      "email": true,
      "push": true,
      "community": true,
      "trends": true
    },
    "updatedAt": "ISO 8601"
  }
  ```

#### 7.6 Update User Preferences
- **Endpoint:** `PUT /api/mypage/preferences`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "theme": "light | dark" (optional),
    "language": "ko | en" (optional),
    "notifications": {
      "email": true,
      "push": false,
      "community": true,
      "trends": false
    } (optional)
  }
  ```
- **Response:** `200 OK` (same as Get Preferences)

#### 7.7 Get User Bookmarks
- **Endpoint:** `GET /api/mypage/bookmarks?limit=20&offset=0`
- **Authentication:** Required
- **Query Params:**
  - `limit`: number (1-50, default: 20)
  - `offset`: number (default: 0)
- **Response:** `200 OK`
  ```json
  {
    "bookmarks": [
      {
        "id": "string",
        "userId": "string",
        "paperId": "string (PMID)",
        "paperData": {
          "title": "string",
          "authors": ["string"],
          "abstract": "string",
          "pub_date": "ISO 8601",
          "journal": "string"
        },
        "createdAt": "ISO 8601"
      }
    ],
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
  ```

#### 7.8 Create Bookmark
- **Endpoint:** `POST /api/mypage/bookmarks`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "paperId": "string (PMID)",
    "paperData": {
      "title": "string",
      "authors": ["string"],
      "abstract": "string",
      "pub_date": "ISO 8601",
      "journal": "string"
    }
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "string",
    "userId": "string",
    "paperId": "string",
    "paperData": {...},
    "createdAt": "ISO 8601"
  }
  ```
- **Errors:**
  - `400` - Already bookmarked

#### 7.9 Delete Bookmark
- **Endpoint:** `DELETE /api/mypage/bookmarks/{paper_id}`
- **Authentication:** Required
- **Path Params:**
  - `paper_id`: Paper PMID or unique identifier
- **Response:** `204 No Content`
- **Errors:**
  - `404` - Bookmark not found

#### 7.10 Get User Posts
- **Endpoint:** `GET /api/mypage/posts?limit=20&offset=0`
- **Authentication:** Required
- **Query Params:**
  - `limit`: number (1-50, default: 20)
  - `offset`: number (default: 0)
- **Response:** `200 OK`
  ```json
  {
    "posts": [...],
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
  ```

#### 7.11 Health Check
- **Endpoint:** `GET /api/mypage/health`
- **Authentication:** None
- **Response:** `200 OK`
  ```json
  {
    "status": "healthy",
    "service": "mypage_api",
    "endpoints": {
      "profile": "ready",
      "health_profile": "ready",
      "preferences": "ready",
      "bookmarks": "ready",
      "posts": "ready"
    }
  }
  ```

---

## 8. Rooms Management

### Base Path: `/api/rooms`

#### 8.1 Create Room
- **Endpoint:** `POST /api/rooms`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "user_id": "string",
    "room_name": "string (optional)",
    "metadata": {} (optional)
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "message": "Room created successfully",
    "data": {
      "room_id": "string",
      "user_id": "string",
      "room_name": "string",
      "created_at": "ISO 8601",
      "last_activity": "ISO 8601",
      "message_count": 0,
      "metadata": {}
    }
  }
  ```
- **Errors:**
  - `400` - Maximum room limit (50) reached

#### 8.2 List User Rooms
- **Endpoint:** `GET /api/rooms?user_id={user_id}&limit=50&offset=0&sort_by=last_activity`
- **Authentication:** None
- **Query Params:**
  - `user_id`: string (required)
  - `limit`: number (1-100, default: 50)
  - `offset`: number (default: 0)
  - `sort_by`: `last_activity | created_at | room_name` (default: last_activity)
- **Response:** `200 OK`
  ```json
  {
    "message": "Rooms retrieved successfully",
    "data": {
      "rooms": [
        {
          "room_id": "string",
          "user_id": "string",
          "room_name": "string",
          "created_at": "ISO 8601",
          "last_activity": "ISO 8601",
          "message_count": 10,
          "metadata": {},
          "last_message": {
            "user_input": "string",
            "agent_response": "string (truncated to 100 chars)",
            "agent_type": "string",
            "timestamp": "ISO 8601"
          }
        }
      ],
      "total": 10,
      "page": 1,
      "page_size": 50
    }
  }
  ```

#### 8.3 Get Room Details
- **Endpoint:** `GET /api/rooms/{room_id}`
- **Authentication:** None
- **Response:** `200 OK`
  ```json
  {
    "message": "Room retrieved successfully",
    "data": {
      "room_id": "string",
      "user_id": "string",
      "room_name": "string",
      "created_at": "ISO 8601",
      "last_activity": "ISO 8601",
      "message_count": 10,
      "metadata": {}
    }
  }
  ```
- **Errors:**
  - `404` - Room not found

#### 8.4 Update Room
- **Endpoint:** `PATCH /api/rooms/{room_id}?user_id={user_id}`
- **Authentication:** None (but requires ownership verification)
- **Query Params:**
  - `user_id`: string (required, for ownership verification)
- **Request Body:**
  ```json
  {
    "room_name": "string (optional)",
    "metadata": {} (optional)
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "message": "Room updated successfully",
    "data": {
      "room_id": "string",
      "room_name": "string",
      "updated_at": "ISO 8601"
    }
  }
  ```
- **Errors:**
  - `403` - Access denied (not room owner)
  - `404` - Room not found

#### 8.5 Delete Room
- **Endpoint:** `DELETE /api/rooms/{room_id}?user_id={user_id}`
- **Authentication:** None (but requires ownership verification)
- **Query Params:**
  - `user_id`: string (required, for ownership verification)
- **Response:** `200 OK`
  ```json
  {
    "message": "Room and associated conversations deleted successfully",
    "data": {
      "room_id": "string",
      "conversations_deleted": 25
    }
  }
  ```
- **Errors:**
  - `403` - Access denied
  - `404` - Room not found

#### 8.6 Get Room History
- **Endpoint:** `GET /api/rooms/{room_id}/history?limit=50&offset=0`
- **Authentication:** None
- **Query Params:**
  - `limit`: number (1-200, default: 50)
  - `offset`: number (default: 0)
- **Response:** `200 OK`
  ```json
  {
    "message": "Room history retrieved successfully",
    "data": {
      "room_id": "string",
      "conversations": [
        {
          "timestamp": "ISO 8601",
          "user_input": "string",
          "agent_response": "string",
          "agent_type": "string",
          "session_id": "string"
        }
      ],
      "total": 100,
      "page": 1,
      "page_size": 50
    }
  }
  ```

---

## 9. Session Management

### Base Path: `/api/session`

#### 9.1 Create Session
- **Endpoint:** `POST /api/session/create`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "user_id": "string",
    "room_id": "string (optional, auto-created if not provided)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "message": "Session created successfully",
    "data": {
      "session_id": "string",
      "user_id": "string",
      "room_id": "string",
      "created_at": "ISO 8601",
      "expires_at": "ISO 8601"
    }
  }
  ```

#### 9.2 Get Session
- **Endpoint:** `GET /api/session/{session_id}`
- **Authentication:** None
- **Response:** `200 OK`
  ```json
  {
    "message": "Session retrieved successfully",
    "data": {
      "session_id": "string",
      "user_id": "string",
      "room_id": "string",
      "created_at": "ISO 8601",
      "last_activity": "ISO 8601",
      "expires_at": "ISO 8601",
      "active_agent": "string",
      "conversation_count": 10
    }
  }
  ```
- **Errors:**
  - `404` - Session not found or expired

#### 9.3 Reset Session
- **Endpoint:** `POST /api/session/{session_id}/reset`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "agent_type": "string (optional, resets specific agent only)"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "message": "Session reset successfully",
    "data": {
      "session_id": "string",
      "reset_scope": "all | {agent_type}",
      "conversations_cleared": 10
    }
  }
  ```

#### 9.4 Stop Stream
- **Endpoint:** `POST /api/session/{session_id}/stop`
- **Authentication:** None
- **Description:** Requests cancellation of active streaming operation
- **Response:** `200 OK`
  ```json
  {
    "message": "Stream stop requested",
    "data": {
      "session_id": "string",
      "room_id": "string",
      "status": "stop_requested | not_found",
      "partial_response": "string (if available)"
    }
  }
  ```

#### 9.5 Clear Session History
- **Endpoint:** `DELETE /api/session/{session_id}/history?room_id={room_id}`
- **Authentication:** None
- **Query Params:**
  - `room_id`: string (optional, clears specific room history only)
- **Description:** Permanently deletes conversation history from MongoDB
- **Response:** `200 OK`
  ```json
  {
    "message": "Session history cleared successfully",
    "data": {
      "session_id": "string",
      "room_id": "string",
      "conversations_deleted": 25
    }
  }
  ```

#### 9.6 Delete Session
- **Endpoint:** `DELETE /api/session/{session_id}`
- **Authentication:** None
- **Description:** Deletes in-memory session (preserves MongoDB history)
- **Response:** `200 OK`
  ```json
  {
    "message": "Session deleted successfully",
    "data": {
      "session_id": "string",
      "status": "deleted"
    }
  }
  ```

---

## 10. Notifications

### Base Path: `/api/notifications`

#### 10.1 Get Notifications
- **Endpoint:** `GET /api/notifications?page=1&page_size=20`
- **Authentication:** Required
- **Query Params:**
  - `page`: number (≥1, default: 1)
  - `page_size`: number (1-100, default: 20)
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "userId": "string",
        "type": "string",
        "title": "string",
        "message": "string",
        "isRead": false,
        "createdAt": "ISO 8601"
      }
    ],
    "page": 1,
    "page_size": 20
  }
  ```

#### 10.2 Get Unread Count
- **Endpoint:** `GET /api/notifications/unread-count`
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "unread_count": 5
  }
  ```

#### 10.3 Create Notification (Admin Only)
- **Endpoint:** `POST /api/notifications`
- **Authentication:** Required (Admin role)
- **Request Body:**
  ```json
  {
    "userId": "string",
    "type": "string",
    "title": "string",
    "message": "string"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "notification_id": "string",
    "message": "알림이 생성되었습니다"
  }
  ```

#### 10.4 Mark as Read
- **Endpoint:** `PUT /api/notifications/{notification_id}/read`
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "알림이 읽음 처리되었습니다"
  }
  ```
- **Errors:**
  - `404` - Notification not found

#### 10.5 Delete All Notifications
- **Endpoint:** `DELETE /api/notifications`
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "deleted_count": 10,
    "message": "모든 알림이 삭제되었습니다"
  }
  ```

#### 10.6 Get Notification Settings
- **Endpoint:** `GET /api/notifications/settings`
- **Authentication:** Required
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "settings": {
      "email": true,
      "push": true,
      "community": true,
      "trends": false
    }
  }
  ```

#### 10.7 Update Notification Settings
- **Endpoint:** `PUT /api/notifications/settings`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "email": true,
    "push": false,
    "community": true,
    "trends": false
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "알림 설정이 업데이트되었습니다"
  }
  ```

---

## Additional Endpoints

### Nutrition Analysis (Legacy)
- **Endpoint:** `POST /api/nutrition/analyze`
- **Same as:** `/api/diet-care/nutri-coach`
- **Note:** Provided for frontend compatibility

### Root & Health Checks
- **Endpoint:** `GET /`
- **Response:** `{"message": "CareGuide API", "version": "1.0.0"}`

- **Endpoint:** `GET /health`
- **Response:** `{"status": "healthy"}`

- **Endpoint:** `GET /db-check`
- **Response:** MongoDB connection status

---

## Authentication Requirements

### Public Endpoints (No Auth Required)
- All `/api/auth/*` endpoints
- `/api/chat/*` (optional auth for user context)
- `/api/community/*` (supports anonymous posting)
- `/api/trends/*`
- `/api/quiz/*`
- `/api/rooms/*` (ownership verified via query params)
- `/api/session/*`
- `/health`, `/`, `/db-check`

### Protected Endpoints (Auth Required)
- `/api/mypage/*`
- `/api/diet-care/*`
- `/api/notifications/*`

### Authentication Method
- **Type:** Bearer token (JWT)
- **Header:** `Authorization: Bearer <token>`
- **Token Payload:**
  ```json
  {
    "user_id": "string",
    "username": "string",
    "exp": 1234567890
  }
  ```

---

## Error Response Format

All API errors follow this standard format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes
- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation error, invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error
- `503` - Service Unavailable (external service down)
- `504` - Gateway Timeout

---

## Notes

### Anonymous User Support
The Community API supports anonymous posting and interaction:
- Anonymous users get consistent IDs via `anonymousId` parameter
- Post authors in anonymous posts are labeled "익명(글쓴이)"
- Commenters in anonymous posts get sequential numbers: "익명1", "익명2", etc.
- Same anonymous user maintains same number within a post

### Streaming Responses
Chat endpoints use Server-Sent Events (SSE) for streaming:
- Content-Type: `text/event-stream`
- Format: `data: {json}\n\n`
- Termination: `data: [DONE]\n\n`

### Pagination
Most list endpoints support pagination:
- **Cursor-based:** `/api/community/posts` (uses `cursor` and `nextCursor`)
- **Offset-based:** Other endpoints (uses `limit`/`offset` or `page`/`page_size`)

### Rate Limiting
Not currently implemented, but consider adding for:
- Authentication endpoints (login/register)
- Chat message endpoints
- Community post creation

---

## Database Collections

### MongoDB Collections Used
- `users` - User accounts
- `chat_rooms` - Chat room metadata
- `conversation_history` - Chat message history
- `posts` - Community posts
- `comments` - Community comments
- `likes` - Post likes
- `post_anonymous_users` - Anonymous user mappings per post
- `counters` - Auto-increment counters
- `health_profiles` - User health information
- `user_preferences` - User settings
- `bookmarks` - Saved papers
- `diet_sessions` - Diet analysis sessions
- `diet_meals` - Meal logs
- `diet_goals` - Nutrition goals
- `quiz_sessions` - Quiz session data
- `quiz_stats` - User quiz statistics
- `notifications` - User notifications
- `notification_settings` - Notification preferences

---

**End of API Specification**
