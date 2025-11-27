/**
 * ChatPageEnhanced - Enhanced Chat Page with Sidebar and Controls
 * 사이드바와 컨트롤이 있는 향상된 채팅 페이지
 *
 * Features:
 * - Chat rooms sidebar / 채팅 방 사이드바
 * - Stop streaming button / 스트리밍 중지 버튼
 * - Reset session controls / 세션 초기화 컨트롤
 * - Agent type tabs / 에이전트 타입 탭
 * - Proper stream cancellation with AbortController / AbortController로 스트림 취소
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../types/careguide-ia';
import { env } from '../config/env';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

// Components
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatInput } from '../components/chat/ChatInput';

// Hooks
import { useChatRooms } from '../hooks/useChatRooms';

// Types
import type { ChatMessage, UserProfile } from '../types/chat';
import type { IntentCategory } from '../types/intent';
import { routeQueryStream, type AgentType } from '../services/intentRouter';

/**
 * Location state interface for navigation
 * 네비게이션을 위한 Location state 인터페이스
 */
interface LocationState {
  fromMain?: boolean;
  initialMessage?: string;
  selectedImage?: File | null;
  selectedCategory?: string;
}

/**
 * Stored messages format for localStorage
 * localStorage용 메시지 포맷
 */
interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intents?: IntentCategory[];
  agents?: AgentType[];
  confidence?: number;
  isDirectResponse?: boolean;
  isEmergency?: boolean;
}

const ChatPageEnhanced: React.FC = () => {
  const { t } = useApp();
  const { user } = useAuth();
  const location = useLocation();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Chat rooms hook
  const {
    activeRooms,
    currentRoomId,
    createRoom,
    deleteRoom,
    updateRoom,
    togglePinRoom,
    toggleArchiveRoom,
    updateRoomLastMessage,
    incrementMessageCount,
    clearAllRooms,
    setCurrentRoomId,
    rooms,
  } = useChatRooms();

  // Stream state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Messages state (keyed by room ID)
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('careguide_chat_messages_by_room');
      if (saved) {
        try {
          const parsed: Record<string, StoredMessage[]> = JSON.parse(saved);
          const result: Record<string, ChatMessage[]> = {};
          Object.keys(parsed).forEach((roomId) => {
            result[roomId] = parsed[roomId].map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }));
          });
          return result;
        } catch (e) {
          console.error('Error parsing messages:', e);
        }
      }
    } catch (e) {
      console.warn('Could not access localStorage for chat messages:', e);
    }
    return {};
  });

  // Input state
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Session state
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isRestoringHistory, setIsRestoringHistory] = useState(false);

  // Refs
  const initialMessageProcessed = useRef(false);

  // Page visibility animation
  const [pageVisible, setPageVisible] = useState(false);

  // Current agent type based on route
  const isMedicalWelfare = location.pathname === ROUTES.CHAT_MEDICAL_WELFARE;
  const isNutrition = location.pathname === ROUTES.CHAT_NUTRITION;
  const isResearch = location.pathname === ROUTES.CHAT_RESEARCH;

  /**
   * Get current agent type based on route
   * 경로 기반으로 현재 에이전트 타입 가져오기
   */
  const getCurrentAgentType = useCallback((): AgentType | 'auto' => {
    if (isMedicalWelfare) return 'medical_welfare';
    if (isNutrition) return 'nutrition';
    if (isResearch) return 'research_paper';
    return 'auto';
  }, [isMedicalWelfare, isNutrition, isResearch]);

  /**
   * Get messages for current room
   * 현재 방의 메시지 가져오기
   */
  const currentMessages = currentRoomId ? messagesByRoom[currentRoomId] || [] : [];

  // Page enter animation
  useEffect(() => {
    const timer = setTimeout(() => setPageVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    try {
      const serialized: Record<string, StoredMessage[]> = {};
      Object.keys(messagesByRoom).forEach((roomId) => {
        serialized[roomId] = messagesByRoom[roomId].map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        }));
      });
      localStorage.setItem('careguide_chat_messages_by_room', JSON.stringify(serialized));
    } catch (e) {
      console.warn('Could not save chat messages to localStorage:', e);
    }
  }, [messagesByRoom]);

  // Handle initial message from MainPage
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.initialMessage && !initialMessageProcessed.current) {
      setInput(state.initialMessage);
      initialMessageProcessed.current = true;

      // Auto-send after 500ms
      const timer = setTimeout(() => {
        handleSend();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Create default room if none exists
  useEffect(() => {
    if (rooms.length === 0) {
      createRoom({ agentType: getCurrentAgentType() });
    } else if (!currentRoomId && rooms.length > 0) {
      setCurrentRoomId(rooms[0].id);
    }
  }, [rooms.length, currentRoomId, createRoom, getCurrentAgentType, setCurrentRoomId]);

  // Cleanup on unmount or route change
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [location.pathname]);

  /**
   * Toggle sidebar
   * 사이드바 토글
   */
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  /**
   * Close sidebar
   * 사이드바 닫기
   */
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  /**
   * Handle room selection
   * 방 선택 처리
   */
  const handleSelectRoom = useCallback(
    (roomId: string) => {
      setCurrentRoomId(roomId);
      setIsSessionExpired(false);
    },
    [setCurrentRoomId]
  );

  /**
   * Handle create new room
   * 새 방 생성 처리
   */
  const handleCreateRoom = useCallback(() => {
    createRoom({ agentType: getCurrentAgentType() });
  }, [createRoom, getCurrentAgentType]);

  /**
   * Handle delete room
   * 방 삭제 처리
   */
  const handleDeleteRoom = useCallback(
    (roomId: string) => {
      // Also delete messages for this room
      setMessagesByRoom((prev) => {
        const newMessages = { ...prev };
        delete newMessages[roomId];
        return newMessages;
      });
      deleteRoom(roomId);
    },
    [deleteRoom]
  );

  /**
   * Handle stop streaming
   * 스트리밍 중지 처리
   */
  const handleStopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, []);

  /**
   * Handle reset current session
   * 현재 세션 초기화 처리
   */
  const handleResetSession = useCallback(() => {
    if (currentRoomId) {
      setMessagesByRoom((prev) => ({
        ...prev,
        [currentRoomId]: [],
      }));
      updateRoom(currentRoomId, {
        messageCount: 0,
        lastMessage: undefined,
        lastMessageTime: undefined,
      });
    }
    handleStopStream();
    setIsSessionExpired(false);
  }, [currentRoomId, updateRoom, handleStopStream]);

  /**
   * Handle reset all sessions
   * 모든 세션 초기화 처리
   */
  const handleResetAllSessions = useCallback(() => {
    setMessagesByRoom({});
    clearAllRooms();
    handleStopStream();
    setIsSessionExpired(false);
    // Create a new default room
    createRoom({ agentType: getCurrentAgentType() });
  }, [clearAllRooms, handleStopStream, createRoom, getCurrentAgentType]);

  /**
   * Handle restore history
   * 히스토리 복원 처리
   */
  const handleRestoreHistory = useCallback(async () => {
    if (!user?.id || !currentRoomId) return;

    setIsRestoringHistory(true);
    try {
      // TODO: Implement API call to fetch history from backend
      // API 호출로 백엔드에서 히스토리 가져오기 구현 필요
      setIsSessionExpired(false);
    } catch (error) {
      console.error('Failed to restore history:', error);
    } finally {
      setIsRestoringHistory(false);
    }
  }, [user?.id, currentRoomId]);

  /**
   * Handle start new conversation
   * 새 대화 시작 처리
   */
  const handleStartNewConversation = useCallback(() => {
    setIsSessionExpired(false);
    handleCreateRoom();
  }, [handleCreateRoom]);

  /**
   * Handle image select
   * 이미지 선택 처리
   */
  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * Handle image remove
   * 이미지 제거 처리
   */
  const handleImageRemove = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
  }, []);

  /**
   * Handle send message
   * 메시지 전송 처리
   */
  const handleSend = useCallback(async () => {
    if (!input.trim() && !selectedImage) return;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    const roomId = currentRoomId || (() => {
      const newRoom = createRoom({ agentType: getCurrentAgentType() });
      return newRoom.id;
    })();

    const messageContent = selectedImage
      ? `${input || '음식 이미지 분석'} [이미지 첨부]`
      : input;

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      roomId,
    };

    // Add user message to room
    setMessagesByRoom((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), userMessage],
    }));

    // Update room last message
    updateRoomLastMessage(roomId, messageContent, new Date());
    incrementMessageCount(roomId);

    // Clear input
    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsStreaming(true);
    setStreamingContent('');

    const assistantMessageId = (Date.now() + 1).toString();

    try {
      // Handle nutrition image upload (non-streaming)
      if (isNutrition && currentImage) {
        const formData = new FormData();
        formData.append('session_id', `session_${Date.now()}`);
        formData.append('text', currentInput || '음식 이미지 분석');
        formData.append('user_profile', user?.profile || 'patient');
        formData.append('image', currentImage);

        const response = await fetch(`${env.apiBaseUrl}/diet-care/nutri-coach`, {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        const data = await response.json();
        const assistantContent =
          data.result?.response ||
          data.result?.metadata?.response ||
          '영양 분석 결과를 가져오는 중 오류가 발생했습니다.';

        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
          intents: ['nutrition' as IntentCategory],
          agents: ['nutrition' as AgentType],
          confidence: 0.95,
          roomId,
        };

        setMessagesByRoom((prev) => ({
          ...prev,
          [roomId]: [...(prev[roomId] || []), assistantMessage],
        }));
        updateRoomLastMessage(roomId, assistantContent, new Date());
        incrementMessageCount(roomId);
      } else {
        // Stream text response
        const response = await routeQueryStream(
          currentInput,
          // onChunk callback
          (content, _isComplete) => {
            setStreamingContent(content);
          },
          // onError callback
          (error) => {
            if (error.name !== 'AbortError') {
              console.error('Stream error:', error);
            }
          },
          // User profile
          user?.profile as UserProfile
        );

        // Add final assistant message
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          intents: response.intents,
          agents: response.agents,
          confidence: response.confidence,
          isDirectResponse: response.isDirectResponse,
          isEmergency: response.isEmergency,
          roomId,
        };

        setMessagesByRoom((prev) => ({
          ...prev,
          [roomId]: [...(prev[roomId] || []), assistantMessage],
        }));
        updateRoomLastMessage(roomId, response.content, new Date());
        incrementMessageCount(roomId);
      }
    } catch (error) {
      // Don't show error for user-cancelled requests
      if ((error as Error).name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }

      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
        roomId,
      };

      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), errorMessage],
      }));
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [
    input,
    selectedImage,
    currentRoomId,
    isNutrition,
    user?.profile,
    createRoom,
    getCurrentAgentType,
    updateRoomLastMessage,
    incrementMessageCount,
  ]);

  return (
    <div
      className={`flex h-[calc(100vh-80px)] lg:h-[calc(100vh-120px)] transition-all duration-500 ${
        pageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* Sidebar */}
      <ChatSidebar
        rooms={activeRooms}
        currentRoomId={currentRoomId}
        onSelectRoom={handleSelectRoom}
        onCreateRoom={handleCreateRoom}
        onDeleteRoom={handleDeleteRoom}
        onTogglePin={togglePinRoom}
        onToggleArchive={toggleArchiveRoom}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ChatHeader
          currentPath={location.pathname}
          isStreaming={isStreaming}
          onToggleSidebar={toggleSidebar}
          onStopStream={handleStopStream}
          onResetSession={handleResetSession}
          onResetAllSessions={handleResetAllSessions}
        />

        {/* Messages */}
        <ChatMessages
          messages={currentMessages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          isSessionExpired={isSessionExpired}
          isRestoringHistory={isRestoringHistory}
          onRestoreHistory={handleRestoreHistory}
          onStartNewConversation={handleStartNewConversation}
        />

        {/* Input */}
        <ChatInput
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          isDisabled={isStreaming}
          placeholder={isNutrition ? '메시지 입력...' : t.chat.placeholder}
          showImageUpload={isNutrition}
          selectedImage={selectedImage}
          imagePreview={imagePreview}
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
        />
      </div>
    </div>
  );
};

export default ChatPageEnhanced;
