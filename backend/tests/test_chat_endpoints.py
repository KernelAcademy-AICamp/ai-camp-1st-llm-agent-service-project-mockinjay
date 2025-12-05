#!/usr/bin/env python3
"""
Test script for chat endpoints

Usage:
    python test_chat_endpoints.py

This script tests the newly implemented chat endpoints:
- /api/chat/session/create
- /api/chat/stream
"""

import requests
import json
import sys


BASE_URL = "http://localhost:8000"


def test_session_create_json():
    """Test session creation with JSON body"""
    print("\n" + "="*60)
    print("TEST 1: Create Session (JSON Body)")
    print("="*60)

    url = f"{BASE_URL}/api/chat/session/create"
    payload = {"user_id": "test_user_json"}

    response = requests.post(url, json=payload)

    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    assert response.status_code == 200, "Expected status 200"
    data = response.json()
    assert "session_id" in data, "Expected session_id in response"
    assert "user_id" in data, "Expected user_id in response"
    assert data["user_id"] == "test_user_json", "user_id mismatch"

    print("✅ Test 1 PASSED")
    return data["session_id"]


def test_session_create_query():
    """Test session creation with query parameter"""
    print("\n" + "="*60)
    print("TEST 2: Create Session (Query Parameter)")
    print("="*60)

    url = f"{BASE_URL}/api/chat/session/create"
    params = {"user_id": "test_user_query"}

    response = requests.post(url, params=params)

    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    assert response.status_code == 200, "Expected status 200"
    data = response.json()
    assert "session_id" in data, "Expected session_id in response"
    assert data["user_id"] == "test_user_query", "user_id mismatch"

    print("✅ Test 2 PASSED")
    return data["session_id"]


def test_chat_stream(session_id):
    """Test chat streaming endpoint"""
    print("\n" + "="*60)
    print("TEST 3: Chat Stream (SSE)")
    print("="*60)

    url = f"{BASE_URL}/api/chat/stream"
    payload = {
        "session_id": session_id,
        "query": "What are the stages of kidney disease?",
        "agent_type": "auto",
        "user_profile": "patient"
    }

    response = requests.post(url, json=payload, stream=True)

    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('content-type')}")

    assert response.status_code == 200, "Expected status 200"
    assert "text/event-stream" in response.headers.get("content-type", ""), \
        "Expected SSE content type"

    print("\nStreaming Response:")
    print("-" * 60)

    chunk_count = 0
    for line in response.iter_lines(decode_unicode=True):
        if line.startswith("data: "):
            chunk_count += 1
            data_str = line[6:]  # Remove "data: " prefix

            if data_str == "[DONE]":
                print(f"\n[Chunk {chunk_count}] Stream completed: [DONE]")
                break

            try:
                data = json.loads(data_str)
                content = data.get("content", "")
                status = data.get("status", "")
                print(f"[Chunk {chunk_count}] ({status}): {content[:80]}...")
            except json.JSONDecodeError:
                print(f"[Chunk {chunk_count}] Unable to parse: {data_str[:80]}...")

    assert chunk_count > 0, "Expected at least one chunk"
    print(f"\n✅ Test 3 PASSED (received {chunk_count} chunks)")


def test_chat_stream_with_message_field(session_id):
    """Test chat streaming with 'message' field instead of 'query'"""
    print("\n" + "="*60)
    print("TEST 4: Chat Stream (with 'message' field)")
    print("="*60)

    url = f"{BASE_URL}/api/chat/stream"
    payload = {
        "session_id": session_id,
        "message": "Hello!",  # Using 'message' instead of 'query'
        "agent_type": "auto",
        "user_profile": "patient"
    }

    response = requests.post(url, json=payload, stream=True)

    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, "Expected status 200"

    print("Streaming Response (first 3 chunks):")
    print("-" * 60)

    chunk_count = 0
    for line in response.iter_lines(decode_unicode=True):
        if line.startswith("data: "):
            chunk_count += 1
            data_str = line[6:]

            if data_str == "[DONE]":
                print(f"[Chunk {chunk_count}] [DONE]")
                break

            if chunk_count <= 3:  # Only print first 3 chunks
                try:
                    data = json.loads(data_str)
                    content = data.get("content", "")
                    print(f"[Chunk {chunk_count}]: {content[:60]}...")
                except json.JSONDecodeError:
                    pass

    print(f"\n✅ Test 4 PASSED (received {chunk_count} chunks)")


def test_cors():
    """Test CORS headers"""
    print("\n" + "="*60)
    print("TEST 5: CORS Preflight")
    print("="*60)

    url = f"{BASE_URL}/api/chat/stream"
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type"
    }

    response = requests.options(url, headers=headers)

    print(f"Status Code: {response.status_code}")
    print(f"Access-Control-Allow-Origin: {response.headers.get('access-control-allow-origin')}")
    print(f"Access-Control-Allow-Methods: {response.headers.get('access-control-allow-methods')}")
    print(f"Access-Control-Allow-Credentials: {response.headers.get('access-control-allow-credentials')}")

    assert response.status_code == 200, "Expected status 200"
    assert response.headers.get("access-control-allow-origin"), "CORS origin header missing"

    print("✅ Test 5 PASSED")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("CHAT ENDPOINTS TEST SUITE")
    print("="*60)
    print(f"Testing against: {BASE_URL}")

    try:
        # Test health endpoint first
        health_response = requests.get(f"{BASE_URL}/health")
        if health_response.status_code != 200:
            print("❌ Server is not running or not healthy!")
            print(f"Please start the server with: uvicorn app.main:app --reload")
            sys.exit(1)

        # Run tests
        session_id = test_session_create_json()
        test_session_create_query()
        test_chat_stream(session_id)
        test_chat_stream_with_message_field(session_id)
        test_cors()

        # Summary
        print("\n" + "="*60)
        print("ALL TESTS PASSED ✅")
        print("="*60)
        print("\nEndpoints are working correctly and ready for frontend integration!")

    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to server")
        print(f"Please ensure the FastAPI server is running at {BASE_URL}")
        print("Start it with: uvicorn app.main:app --reload")
        sys.exit(1)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
