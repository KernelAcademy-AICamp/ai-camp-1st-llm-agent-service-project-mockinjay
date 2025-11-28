/**
 * useChatSession Hook
 * 채팅 세션 관리 훅
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { ChatMessage, StoredMessage } from '../types/chat';
import { STORAGE_KEYS, TIMEOUTS } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

const MESSAGES_STORAGE_KEY = 'careguide_room_messages' as const;

function deserializeMessage(stored: StoredMessage): ChatMessage {
  return {
    ...stored,
    timestamp: new Date(stored.timestamp),
  };
}

function serializeMessage(message: ChatMessage): StoredMessage {
  return {
    ...message,
    timestamp: message.timestamp.toISOString(),
  };
}

export function useChatSession(roomId: string | null) {
  const { user } = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isRestoringHistory, setIsRestoringHistory] = useState(false);

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (saved) {
        try {
          const parsed: Record<string, StoredMessage[]> = JSON.parse(saved);
          const result: Record<string, ChatMessage[]> = {};
          Object.keys(parsed).forEach((key) => {
            const messages = parsed[key];
            if (Array.isArray(messages)) {
              result[key] = messages.map(deserializeMessage);
            }
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

  useEffect(() => {
    try {
      const serialized: Record<string, StoredMessage[]> = {};
      Object.keys(messages).forEach((key) => {
        const msgs = messages[key];
        if (Array.isArray(msgs)) {
          serialized[key] = msgs.map(serializeMessage);
        }
      });
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(serialized));
    } catch (e) {
      console.error('Error saving messages to localStorage:', e);
    }
  }, [messages]);

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

      const now = Date.now();

      if (
        storedSession &&
        lastActive &&
        now - parseInt(lastActive) < TIMEOUTS.SESSION_TIMEOUT
      ) {
        setSessionId(storedSession);
      } else {
        const response = await api.post('/api/session/create', {
          user_id: user?.id || 'guest_user',
          room_id: roomId || undefined,
        });
        const newSessionId = response.data.data?.session_id || response.data.session_id;
        setSessionId(newSessionId);

        try {
          localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
        } catch (e) {
          console.error('Error saving session ID to localStorage:', e);
        }
      }

      try {
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
      } catch (e) {
        console.error('Error saving last active timestamp to localStorage:', e);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }, [user?.id, roomId]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const roomMessages = roomId ? messages[roomId] || [] : [];

  const addMessage = useCallback(
    (message: ChatMessage) => {
      if (!roomId) return;

      setMessages((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), message],
      }));

      try {
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
      } catch (e) {
        console.error('Error updating last active timestamp:', e);
      }
    },
    [roomId]
  );

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

  const clearMessages = useCallback(() => {
    if (!roomId) return;

    setMessages((prev) => ({
      ...prev,
      [roomId]: [],
    }));
  }, [roomId]);

  const clearAllMessages = useCallback(() => {
    setMessages({});
    try {
      localStorage.removeItem(MESSAGES_STORAGE_KEY);
    } catch (e) {
      console.error('Error removing messages from localStorage:', e);
    }
  }, []);

  const restoreChatHistory = useCallback(
    async (limit: number = 50) => {
      if (!user?.id || !sessionId || !roomId) {
        console.warn('Cannot restore history: missing user ID, session ID, or room ID');
        return;
      }

      setIsRestoringHistory(true);
      try {
        const response = await api.get('/api/chat/history', {
          params: { user_id: user.id, session_id: sessionId, limit },
        });

        const history = response.data;

        if (history.conversations && history.conversations.length > 0) {
          const restoredMessages: ChatMessage[] = [];

          history.conversations.forEach((conv: { user_input: string; agent_response: string; timestamp: string; session_id: string }, index: number) => {
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

  const expireSession = useCallback(() => {
    setIsSessionExpired(true);
  }, []);

  const createNewSession = useCallback(async () => {
    try {
      const response = await api.post('/api/session/create', {
        user_id: user?.id || 'guest_user',
        room_id: roomId || undefined,
      });
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
    sessionId,
    isSessionExpired,
    isRestoringHistory,
    messages: roomMessages,
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
