# Quick Start Guide: Chat API Testing

## Prerequisites
- FastAPI backend running on `http://localhost:8000`
- Python 3.8+ with `requests` library

## Start the Backend Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Wait for the server to start. You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Option 1: Run Automated Tests

```bash
cd backend
python3 test_chat_endpoints.py
```

Expected output:
```
============================================================
CHAT ENDPOINTS TEST SUITE
============================================================
Testing against: http://localhost:8000

============================================================
TEST 1: Create Session (JSON Body)
============================================================
Status Code: 200
Response: {
  "session_id": "session_xxx",
  "user_id": "test_user_json",
  "created_at": "2025-11-27T..."
}
✅ Test 1 PASSED

... (more tests)

============================================================
ALL TESTS PASSED ✅
============================================================
```

## Option 2: Manual Testing with cURL

### 1. Create a Session

```bash
# With JSON body
curl -X POST "http://localhost:8000/api/chat/session/create" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "my_user_123"}'

# With query parameter
curl -X POST "http://localhost:8000/api/chat/session/create?user_id=my_user_123"
```

Expected response:
```json
{
  "session_id": "session_xxx",
  "user_id": "my_user_123",
  "created_at": "2025-11-27T12:00:00"
}
```

### 2. Test Chat Streaming

```bash
curl -X POST "http://localhost:8000/api/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_xxx",
    "query": "만성 콩팥병 단계가 궁금해요",
    "agent_type": "auto",
    "user_profile": "patient"
  }' \
  --no-buffer
```

Expected response (SSE stream):
```
data: {"content": "만성 콩팥병(CKD)은 5단계로...", "answer": "...", "status": "streaming", "agent_type": "auto"}

data: {"content": "1단계: GFR ≥90...", "answer": "...", "status": "streaming", "agent_type": "auto"}

data: [DONE]
```

## Option 3: Test with Frontend

1. Ensure backend is running on port 8000
2. Start the frontend:

```bash
cd new_frontend
npm install
npm run dev
```

3. Open browser to `http://localhost:5173`
4. Navigate to the Chat page
5. Try sending messages - they should now work!

## Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat/session/create` | POST | Create/get chat session |
| `/api/chat/stream` | POST | Stream chat responses (SSE) |
| `/api/chat/rooms` | GET/POST | Manage chat rooms |
| `/health` | GET | Check server health |

## Example Session Flow

1. **Create Session**
   ```bash
   curl -X POST "http://localhost:8000/api/chat/session/create" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "user123"}'
   ```

   Response: `{"session_id": "session_abc123", ...}`

2. **Send Chat Message**
   ```bash
   curl -X POST "http://localhost:8000/api/chat/stream" \
     -H "Content-Type: application/json" \
     -d '{
       "session_id": "session_abc123",
       "message": "Hello",
       "user_profile": "patient"
     }' \
     --no-buffer
   ```

3. **Receive Streaming Response**
   - Multiple SSE events with chunks of text
   - Final `[DONE]` signal

## Troubleshooting

### Server won't start
- Check if port 8000 is already in use: `lsof -i :8000`
- Kill existing process: `pkill -f uvicorn`

### Connection refused
- Ensure server is running: `curl http://localhost:8000/health`
- Check firewall settings

### CORS errors
- Verify frontend origin is in `allow_origins` list in `backend/app/main.py`
- Check browser console for specific CORS error

### No streaming response
- Use `--no-buffer` flag with cURL
- Check that `Content-Type: text/event-stream` header is present

### Session not found
- Create session first before streaming
- Verify session_id matches

## Next Steps

✅ Backend endpoints are working
⏭️ Test with actual frontend
⏭️ Monitor backend logs for any errors
⏭️ Consider migrating to real LLM integration
⏭️ Add conversation history persistence

## Support

For issues:
1. Check server logs in terminal
2. Review `CHAT_API_IMPLEMENTATION.md` for details
3. Run `python3 test_chat_endpoints.py` for diagnostics
