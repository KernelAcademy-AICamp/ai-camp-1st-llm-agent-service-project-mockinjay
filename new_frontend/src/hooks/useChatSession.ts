/**
 * useChatSession Hook
 * 채팅 세션 관리 훅
 *
 * Manages chat session lifecycle, expiration, and message persistence.
 * 채팅 세션 라이프사이클, 만료, 메시지 지속성을 관리합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import api, { getChatHistory } from '../services/api';
import type { ChatMessage, StoredMessage } from '../types/chat';
import { STORAGE_KEYS, TIMEOUTS } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

const MESSAGES_STORAGE_KEY = 'careguide_room_messages' as const;

/**
 * Convert StoredMessage to ChatMessage (deserialize)
 * StoredMessage를 ChatMessage로 변환 (역직렬화)
 */
function deserializeMessage(stored: StoredMessage): ChatMessage {
  return {
    ...stored,
    timestamp: new Date(stored.timestamp),
  };
}

/**
 * Convert ChatMessage to StoredMessage (serialize)
 * ChatMessage를 StoredMessage로 변환 (직렬화)
 */
function serializeMessage(message: ChatMessage): StoredMessage {
  return {
    ...message,
    timestamp: message.timestamp.toISOString(),
  };
}

export function useChatSession(roomId: string | null) {
  const { user } = useAuth();

  // Session state
  // 세션 상태
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isRestoringHistory, setIsRestoringHistory] = useState(false);

  // Messages state per room
  // 방별 메시지 상태
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (saved) {
        try {
          const parsed: Record<string, StoredMessage[]> = JSON.parse(saved);
          const result: Record<string, ChatMessage[]> = {};
          Object.keys(parsed).forEach((key) => {
            result[key] = parsed[key].map(deserializeMessage);
          });
          return result;
        } catch (e) {
          console.error('Error loading messages:', e);
        }
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    return {};
  });

  // Save messages to localStorage whenever they change
  // 메시지가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      const serialized: Record<string, StoredMessage[]> = {};
      Object.keys(messages).forEach((key) => {
        serialized[key] = messages[key].map(serializeMessage);
      });
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(serialized));
    } catch (e) {
      console.error('Error saving messages to localStorage:', e);
    }
  }, [messages]);

  /**
   * Initialize or restore session
   * 세션 초기화 또는 복원
   */
  const initializeSession = useCallback(async () => {
    try {
      let storedSession: string | null = null;
      let lastActive: string | null = null;

      try {
        storedSession = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
        lastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }

      // If we have a roomId, include it in the session
      // roomId가 있으면 세션에 포함

      const now = Date.now();

      // Check if session is valid (exists and not expired)
      // 세션이 유효한지 확인 (존재하고 만료되지 않음)
      if (
        storedSession &&
        lastActive &&
        now - parseInt(lastActive) < TIMEOUTS.SESSION_TIMEOUT
      ) {
        setSessionId(storedSession);
      } else {
        // Create new session if expired or doesn't exist
        // 만료되었거나 존재하지 않으면 새 세션 생성
        const response = await api.post('/api/session/create', {
          user_id: user?.id || 'guest_user',
          room_id: roomId || undefined,
        });
        // Backend returns SuccessResponse format: { message, data: { session_id, ... } }
        const newSessionId = response.data.data?.session_id || response.data.session_id;
        setSessionId(newSessionId);

        try {
          localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
        } catch (e) {
          console.error('Error saving session ID to localStorage:', e);
        }
      }

      // Update timestamp
      // 타임스탬프 업데이트
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
      } catch (e) {
        console.error('Error saving last active timestamp to localStorage:', e);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }, [user?.id]);

  // Initialize session on mount
  // 마운트 시 세션 초기화
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  /**
   * Get messages for current room
   * 현재 방의 메시지 가져오기
   */
  const roomMessages = roomId ? messages[roomId] || [] : [];

  /**
   * Add a message to the current room
   * 현재 방에 메시지 추가
   */
  const addMessage = useCallback(
    (message: ChatMessage) => {
      if (!roomId) return;

      setMessages((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), message],
      }));

      // Update last active timestamp
      // 마지막 활동 타임스탬프 업데이트
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
      } catch (e) {
        console.error('Error updating last active timestamp:', e);
      }
    },
    [roomId]
  );

  /**
   * Update a specific message
   * 특정 메시지 업데이트
   */
  const updateMessage = useCallback(
    (messageId: string, content: string) => {
      if (!roomId) return;

      setMessages((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, content } : msg
        ),
      }));
    },
    [roomId]
  );

  /**
   * Clear messages for current room
   * 현재 방의 메시지 삭제
   */
  const clearMessages = useCallback(() => {
    if (!roomId) return;

    setMessages((prev) => ({
      ...prev,
      [roomId]: [],
    }));
  }, [roomId]);

  /**
   * Clear all messages for all rooms
   * 모든 방의 모든 메시지 삭제
   */
  const clearAllMessages = useCallback(() => {
    setMessages({});
    try {
      localStorage.removeItem(MESSAGES_STORAGE_KEY);
    } catch (e) {
      console.error('Error removing messages from localStorage:', e);
    }
  }, []);

  /**
   * Restore chat history from backend
   * 백엔드에서 채팅 히스토리 복원
   */
  const restoreChatHistory = useCallback(
    async (limit: number = 50) => {
      if (!user?.id || !sessionId || !roomId) {
        console.warn('Cannot restore history: missing user ID, session ID, or room ID');
        return;
      }

      setIsRestoringHistory(true);
      try {
        const history = await getChatHistory(user.id, sessionId, limit);

        if (history.conversations && history.conversations.length > 0) {
          // Convert DB format to Message format
          // DB 포맷을 메시지 포맷으로 변환
          const restoredMessages: ChatMessage[] = [];

          history.conversations.forEach((conv, index) => {
            // Add user message
            // 사용자 메시지 추가
            if (conv.user_input) {
              restoredMessages.push({
                id: `restored-user-${index}`,
                role: 'user',
                content: conv.user_input,
                timestamp: new Date(conv.timestamp),
                sessionId: conv.session_id,
                roomId,
              });
            }
            // Add assistant message
            // 어시스턴트 메시지 추가
            if (conv.agent_response) {
              restoredMessages.push({
                id: `restored-assistant-${index}`,
                role: 'assistant',
                content: conv.agent_response,
                timestamp: new Date(conv.timestamp),
                sessionId: conv.session_id,
                roomId,
              });
            }
          });

          setMessages((prev) => ({
            ...prev,
            [roomId]: restoredMessages,
          }));

          setIsSessionExpired(false);
        }
      } catch (error) {
        console.error('Failed to restore chat history:', error);
      } finally {
        setIsRestoringHistory(false);
      }
    },
    [user?.id, sessionId, roomId]
  );

  /**
   * Mark session as expired
   * 세션을 만료된 것으로 표시
   */
  const expireSession = useCallback(() => {
    setIsSessionExpired(true);
  }, []);

  /**
   * Create a new session
   * 새 세션 생성
   */
  const createNewSession = useCallback(async () => {
    try {
      const response = await api.post('/api/session/create', {
        user_id: user?.id || 'guest_user',
        room_id: roomId || undefined,
      });
      // Backend returns SuccessResponse format: { message, data: { session_id, ... } }
      const newSessionId = response.data.data?.session_id || response.data.session_id;
      setSessionId(newSessionId);

      try {
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
      } catch (e) {
        console.error('Error saving session data to localStorage:', e);
      }

      setIsSessionExpired(false);
      return newSessionId;
    } catch (error) {
      console.error('Failed to create new session:', error);
      return null;
    }
  }, [user?.id, roomId]);

  return {
    // State
    sessionId,
    isSessionExpired,
    isRestoringHistory,
    messages: roomMessages,

    // Actions
    addMessage,
    updateMessage,
    clearMessages,
    clearAllMessages,
    restoreChatHistory,
    expireSession,
    createNewSession,
    initializeSession,
  };
}
