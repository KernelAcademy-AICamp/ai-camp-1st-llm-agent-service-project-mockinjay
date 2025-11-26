---
description: How to use the Context Engineer feature
---

# Context Engineer Feature

The Context Engineer feature provides personalized context for users across all agents.

## Components

1.  **ContextManager** (`backend/app/db/context_manager.py`):

    - Manages MongoDB collections: `conversation_history` and `user_context`.
    - `conversation_history`: Stores all user-agent interactions.
    - `user_context`: Stores summarized user interests and keywords.

2.  **ContextEngineer** (`backend/Agent/context_engineer.py`):

    - Analyzes conversation history using LLM (`glm-4.6:cloud`).
    - Extracts summary and keywords.
    - Updates `user_context`.

3.  **ContextSystem** (`backend/app/core/context_system.py`):

    - Singleton that holds `SessionManager` and `ContextEngineer` instances.

4.  **Chat API Interceptor** (`backend/app/api/chat.py`):
    - Intercepts requests to `/api/chat`.
    - Injects `user_context` into the request body (field: `context.user_history`).
    - Saves conversation to DB after successful response.
    - Triggers asynchronous context analysis.

## Usage

The feature works automatically for all requests sent to `/api/chat`.

1.  **Injection**: When a user sends a message, their stored context (summary, keywords) is automatically injected into the request body. Agents can use this information to personalize responses.
2.  **Recording**: After the agent responds, the interaction is saved to MongoDB.
3.  **Analysis**: The system periodically (after each chat) analyzes the latest 5 conversations to update the user's context for the next interaction.

## Configuration

- Ensure MongoDB is running and `MONGODB_URI` is set.
- Ensure Ollama is running with `glm-4.6:cloud` model for the Context Engineer.
