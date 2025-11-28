/**
 * Chat System Type Definitions
 * 채팅 시스템 타입 정의
 */

import type { IntentCategory } from './intent';

// AgentType defined locally to avoid circular dependency
export type AgentType = 'medical_welfare' | 'nutrition' | 'research_paper' | 'router';

/**
 * Chat Message Interface
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
  fallbackType?: string;
}

/**
 * Source Interface for citations
 */
export interface Source {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

/**
 * Chat Room Interface
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
 */
export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intents?: IntentCategory[];
  agents?: AgentType[];
  confidence?: number;
  isDirectResponse?: boolean;
  isEmergency?: boolean;
  roomId?: string;
  sessionId?: string;
  imageUrl?: string;
  fallbackType?: string;
}

/**
 * Stored Room Format (for localStorage serialization)
 */
export interface StoredRoom {
  id: string;
  title: string;
  agentType: AgentType | 'auto';
  lastMessage?: string;
  lastMessageTime?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isArchived?: boolean;
}

/**
 * Chat Stream Chunk Interface
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
 */
export interface ChatStreamOptions {
  onChunk?: (content: string, isComplete: boolean) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
  userProfile?: 'general' | 'patient' | 'researcher';
}

/**
 * Chat Input State
 */
export interface ChatInputState {
  text: string;
  image?: File | null;
  imagePreview?: string | null;
}

/**
 * Chat UI State
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
 */
export interface CreateRoomOptions {
  title?: string;
  agentType?: AgentType | 'auto';
  initialMessage?: string;
}

/**
 * Chat History Response (from API)
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
 */
export interface RoomFilterOptions {
  agentType?: AgentType | 'auto' | 'all';
  isPinned?: boolean;
  isArchived?: boolean;
  searchQuery?: string;
}

/**
 * User Role Type (for chat context)
 */
export type UserRole = 'general' | 'patient' | 'researcher';

/**
 * Chat Action Type for useReducer
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
 */
export type RoomAction =
  | { type: 'ADD_ROOM'; payload: ChatRoom }
  | { type: 'UPDATE_ROOM'; payload: { id: string; updates: Partial<ChatRoom> } }
  | { type: 'DELETE_ROOM'; payload: string }
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'SET_CURRENT_ROOM'; payload: string | null }
  | { type: 'PIN_ROOM'; payload: string }
  | { type: 'ARCHIVE_ROOM'; payload: string };
