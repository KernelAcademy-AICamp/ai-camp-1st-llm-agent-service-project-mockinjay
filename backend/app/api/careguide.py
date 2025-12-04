from fastapi import APIRouter
from app.api import chat, trends, community, auth, user, notification, header, footer, quiz, nutrition, rooms, session, mypage, bookmarks

# Create the master router matching CareGuide IA
router = APIRouter()

# --------------------------------------------------------------------------
# 2. AI Chatbot (IA: /chat -> API: /api/chat, /api/rooms, /api/session)
# --------------------------------------------------------------------------
# chat.router has prefix="/api/chat"
router.include_router(chat.router)

# rooms.router has prefix="/api/rooms"
router.include_router(rooms.router)

# session.router has prefix="/api/session"
router.include_router(session.router)


# --------------------------------------------------------------------------
# 3. Diet Care (IA: /diet-care -> API: /api/diet-care)
# --------------------------------------------------------------------------
# Note: diet_care_router is registered separately in main.py
# The diet.py router has been deprecated in favor of diet_care.py

# Nutrition API (Frontend compatibility endpoint: /api/nutrition/analyze)
router.include_router(nutrition.router)


# --------------------------------------------------------------------------
# 4. Community (IA: /community -> API: /api/community)
# --------------------------------------------------------------------------
# community.router likely has no prefix, so we add "/api/community"
router.include_router(community.router, prefix="/api/community", tags=["community"])


# --------------------------------------------------------------------------
# 5. Trends (IA: /trends -> API: /api/trends)
# --------------------------------------------------------------------------
# trends.router has prefix="/api/trends"
router.include_router(trends.router)


# --------------------------------------------------------------------------
# 6. Utility (IA: /utility -> API: /api/auth, /api/user, /api/mypage, etc)
# --------------------------------------------------------------------------
# auth.router has prefix="/auth", so we add "/api" -> /api/auth
router.include_router(auth.router, prefix="/api")

# user.router has prefix="/api/user"
router.include_router(user.router)

# mypage.router has prefix="/api/mypage"
router.include_router(mypage.router)

# bookmarks.router has prefix="/api/bookmarks" (frontend compatibility)
router.include_router(bookmarks.router)

# notification.router (assuming it has prefix)
router.include_router(notification.router)


# --------------------------------------------------------------------------
# Other Components (Quiz, UI)
# --------------------------------------------------------------------------
router.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
router.include_router(header.router)
router.include_router(footer.router)
