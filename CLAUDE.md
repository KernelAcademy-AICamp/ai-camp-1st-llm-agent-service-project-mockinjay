# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CareGuide is a web platform for Chronic Kidney Disease (CKD) patients providing AI chatbot-based medical information, nutrition management, and community features. It uses a Python FastAPI backend with a React TypeScript frontend.

## Common Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload        # Runs on port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Development server on port 5173
npm run build    # Build for production (runs tsc first)
npm run lint     # ESLint check
npm run preview  # Preview production build
```

### Testing
```bash
python backend/Agent/test_agents.py  # Test agent system
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Architecture

### Agent System (Core Innovation)

The project implements a specialized agent orchestration system in `backend/Agent/`:

```
User Request → FastAPI → Agent Manager → Specialized Agent → Response
                              ↓
         ┌──────────────┬─────────────┬──────────────┐
         ↓              ↓             ↓              ↓
   Research Paper  Nutrition   Medical Welfare  Trend Viz
   (papers/PubMed) (diet)      (benefits)       (analytics)
```

**Key Components:**
- `agent_manager.py` - Central routing and orchestration
- `base_agent.py` - Abstract base class (all agents implement `process()` and `estimate_context_usage()`)
- `session_manager.py` - Session lifecycle with 30-minute timeout
- `context_tracker.py` - Token usage tracking (20k limit per session)

**Agent Types:**
- `research_paper/` - Research paper search using Parlant framework + vector DB
- `nutrition/` - CKD-specific dietary recommendations
- `medical_welfare/` - Healthcare benefits information
- `trend_visualization/` - Analytics and dashboard data

### FastAPI Application

`backend/app/` contains the HTTP layer:
- `main.py` - App entry point with CORS config
- `api/` - Route handlers (auth, chat, nutri, community, trends)
- `services/` - Business logic (hybrid_search, pubmed_search)
- `db/` - Database layer (mongodb_manager, vector_manager)

### Frontend

React SPA in `frontend/src/`:
- `App.tsx` - Route definitions using React Router v6
- `pages/` - Page components (Home, Chat, Nutri, Community, Trends, MyPage, SignUp)
- Uses Tailwind CSS for styling
- Vite proxy forwards `/api/*` to backend on port 8000

## Key Patterns

### Async/Await
All agent methods and database operations are async.

### Standardized Contracts
```python
# Agent/core/contracts.py
AgentRequest  # Pydantic model for input
AgentResponse # Pydantic model for output
```

### Response Format
```python
{
    "success": True,
    "agent_type": "research_paper",
    "result": {
        "response": "...",
        "tokens_used": 1234,
        "sources": [...]
    },
    "context_info": {
        "current_usage": 1234,
        "max_limit": 20000,
        "remaining": 18766
    }
}
```

## Environment Setup

Required in `.env` (see `.env.sample`):
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PINECONE_API_KEY=pcsk_...
MONGODB_URI=mongodb://localhost:27017
PUBMED_EMAIL=user@example.com
PUBMED_API_KEY=...  # Optional, improves speed
```

MongoDB must be running:
```bash
# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Data Sources

1. QA Dataset - Korean kidney association FAQs
2. Research Papers - 4,850+ papers with embeddings in MongoDB Atlas Vector Search
3. Medical Data - Healthcare protocols and guidelines
4. PubMed API - Real-time paper search

Preprocessing scripts in `preprocess/` handle data filtering and embedding generation.

## Adding New Features

### New Agent
1. Create `Agent/new_feature/agent.py` extending `BaseAgent`
2. Implement `async def process()` and `estimate_context_usage()`
3. Create `Agent/new_feature/prompts.py`
4. Register in `agent_manager.py` under `self.agents`

### New API Endpoint
1. Create handler in `backend/app/api/new_feature.py`
2. Add route in `main.py`
3. Add frontend route in `frontend/src/App.tsx`

## Current Status

- Agent system framework: Complete
- Research paper agent: Partially implemented (Parlant integration)
- Other agents: Stub implementations
- Frontend pages: Layouts ready, mostly stubs
- Authentication: Framework ready, needs completion
