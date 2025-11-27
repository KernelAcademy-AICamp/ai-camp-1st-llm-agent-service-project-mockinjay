/**
 * Chat System Type Definitions
 * 채팅 시스템 타입 정의
 *
 * This file contains all TypeScript interfaces and types for the chat system.
 * 이 파일은 채팅 시스템을 위한 모든 TypeScript 인터페이스와 타입을 포함합니다.
 */

import type { IntentCategory } from './intent';
import type { AgentType } from '../services/intentRouter';

/**
 * Chat Message Interface
 * 채팅 메시지 인터페이스
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intents?: IntentCategory[];
  agents?: AgentType[];
  confidence?: number;
  isDirectResponse?: boolean;
  isEmergency?: boolean;
  roomId?: string;
  sessionId?: string;
  imageUrl?: string;
}

/**
 * Chat Room Interface
 * 채팅 방 인터페이스
 */
export interface ChatRoom {
  id: string;
  title: string;
  agentType: AgentType | 'auto';
  lastMessage?: string;
  lastMessageTime?: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  isArchived?: boolean;
}

/**
 * Chat Session Interface
 * 채팅 세션 인터페이스
 */
export interface ChatSession {
  sessionId: string;
  roomId: string;
  userId?: string;
  createdAt: Date;
  expiresAt: Date;
  isExpired: boolean;
  lastActivityAt: Date;
}

/**
 * Stored Message Format (for localStorage serialization)
 * LocalStorage 저장을 위한 메시지 포맷
 */
export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string format for localStorage
  intents?: IntentCategory[];
  agents?: AgentType[];
  confidence?: number;
  isDirectResponse?: boolean;
  isEmergency?: boolean;
  roomId?: string;
  sessionId?: string;
  imageUrl?: string;
}

/**
 * Stored Room Format (for localStorage serialization)
 * LocalStorage 저장을 위한 방 포맷
 */
export interface StoredRoom {
  id: string;
  title: string;
  agentType: AgentType | 'auto';
  lastMessage?: string;
  lastMessageTime?: string; // ISO string
  messageCount: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isPinned?: boolean;
  isArchived?: boolean;
}

/**
 * Chat Stream Chunk Interface
 * 채팅 스트림 청크 인터페이스
 */
export interface ChatStreamChunk {
  content?: string;
  answer?: string;
  response?: string;
  status?: 'streaming' | 'processing' | 'complete' | 'new_message';
  agent_type?: string;
  metadata?: {
    routed_to?: string[];
    synthesis?: boolean;
    individual_responses?: Record<string, string>;
  };
  error?: string;
}

/**
 * Chat Stream Options
 * 채팅 스트림 옵션
 */
export interface ChatStreamOptions {
  onChunk?: (content: string, isComplete: boolean) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
  userProfile?: 'general' | 'patient' | 'researcher';
}

/**
 * Chat Input State
 * 채팅 입력 상태
 */
export interface ChatInputState {
  text: string;
  image?: File | null;
  imagePreview?: string | null;
}

/**
 * Chat UI State
 * 채팅 UI 상태
 */
export interface ChatUIState {
  isTyping: boolean;
  isSidebarOpen: boolean;
  isSessionExpired: boolean;
  isRestoringHistory: boolean;
  streamingContent: string;
}

/**
 * Chat Room Creation Options
 * 채팅 방 생성 옵션
 */
export interface CreateRoomOptions {
  title?: string;
  agentType?: AgentType | 'auto';
  initialMessage?: string;
}

/**
 * Chat History Response (from API)
 * 채팅 히스토리 응답 (API로부터)
 */
export interface ChatHistoryResponse {
  count: number;
  conversations: {
    timestamp: string;
    user_input: string;
    agent_response: string;
    agent_type: string;
    session_id: string;
  }[];
}

/**
 * Chat Room Filter Options
 * 채팅 방 필터 옵션
 */
export interface RoomFilterOptions {
  agentType?: AgentType | 'auto' | 'all';
  isPinned?: boolean;
  isArchived?: boolean;
  searchQuery?: string;
}

/**
 * User Profile Type
 * 사용자 프로필 타입
 */
export type UserProfile = 'general' | 'patient' | 'researcher';

/**
 * Chat Action Type for useReducer
 * useReducer를 위한 채팅 액션 타입
 */
export type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_STREAMING_CONTENT'; payload: string }
  | { type: 'SET_SESSION_EXPIRED'; payload: boolean };

/**
 * Room Action Type for useReducer
 * useReducer를 위한 방 액션 타입
 */
export type RoomAction =
  | { type: 'ADD_ROOM'; payload: ChatRoom }
  | { type: 'UPDATE_ROOM'; payload: { id: string; updates: Partial<ChatRoom> } }
  | { type: 'DELETE_ROOM'; payload: string }
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'SET_CURRENT_ROOM'; payload: string | null }
  | { type: 'PIN_ROOM'; payload: string }
  | { type: 'ARCHIVE_ROOM'; payload: string };
