/**
 * useChatRooms Hook
 * 채팅 방 관리 훅
 *
 * Manages chat room state, localStorage persistence, and CRUD operations.
 * 채팅 방 상태, localStorage 지속성, CRUD 작업을 관리합니다.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChatRoom, StoredRoom, CreateRoomOptions, RoomFilterOptions } from '../types/chat';
import type { AgentType } from '../services/intentRouter';

const ROOMS_STORAGE_KEY = 'careguide_chat_rooms' as const;
const CURRENT_ROOM_KEY = 'careguide_current_room' as const;

/**
 * Convert StoredRoom to ChatRoom (deserialize)
 * StoredRoom을 ChatRoom으로 변환 (역직렬화)
 */
function deserializeRoom(stored: StoredRoom): ChatRoom {
  return {
    ...stored,
    lastMessageTime: stored.lastMessageTime ? new Date(stored.lastMessageTime) : undefined,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  };
}

/**
 * Convert ChatRoom to StoredRoom (serialize)
 * ChatRoom을 StoredRoom으로 변환 (직렬화)
 */
function serializeRoom(room: ChatRoom): StoredRoom {
  return {
    ...room,
    lastMessageTime: room.lastMessageTime?.toISOString(),
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}

/**
 * Generate a title based on agent type
 * 에이전트 타입 기반으로 제목 생성
 */
function generateRoomTitle(agentType: AgentType | 'auto'): string {
  const titles: Record<AgentType | 'auto', string> = {
    auto: 'Auto 대화',
    medical_welfare: '의료 복지 상담',
    nutrition: '식이 영양 상담',
    research_paper: '연구 논문 검색',
    router: 'AI 상담',
  };
  return titles[agentType] || 'AI 대화';
}

export function useChatRooms() {
  // Load rooms from localStorage
  // localStorage에서 방 로드
  const [rooms, setRooms] = useState<ChatRoom[]>(() => {
    try {
      const saved = localStorage.getItem(ROOMS_STORAGE_KEY);
      if (saved) {
        try {
          const parsed: StoredRoom[] = JSON.parse(saved);
          return parsed.map(deserializeRoom);
        } catch (e) {
          console.error('Error parsing chat rooms:', e);
        }
      }
    } catch (e) {
      console.warn('Could not access localStorage for chat rooms:', e);
    }
    return [];
  });

  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CURRENT_ROOM_KEY) || null;
    } catch (e) {
      console.warn('Could not access localStorage for current room:', e);
      return null;
    }
  });

  // Save rooms to localStorage whenever they change
  // 방이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      const serialized = rooms.map(serializeRoom);
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(serialized));
    } catch (e) {
      console.warn('Could not save chat rooms to localStorage:', e);
    }
  }, [rooms]);

  // Save current room ID
  // 현재 방 ID 저장
  useEffect(() => {
    try {
      if (currentRoomId) {
        localStorage.setItem(CURRENT_ROOM_KEY, currentRoomId);
      } else {
        localStorage.removeItem(CURRENT_ROOM_KEY);
      }
    } catch (e) {
      console.warn('Could not save current room ID to localStorage:', e);
    }
  }, [currentRoomId]);

  /**
   * Create a new chat room
   * 새 채팅 방 생성
   */
  const createRoom = useCallback((options: CreateRoomOptions = {}): ChatRoom => {
    const now = new Date();
    const newRoom: ChatRoom = {
      id: `room_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      title: options.title || generateRoomTitle(options.agentType || 'auto'),
      agentType: options.agentType || 'auto',
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
      isArchived: false,
    };

    setRooms((prev) => [newRoom, ...prev]);
    setCurrentRoomId(newRoom.id);

    return newRoom;
  }, []);

  /**
   * Delete a chat room
   * 채팅 방 삭제
   */
  const deleteRoom = useCallback((roomId: string) => {
    setRooms((prev) => prev.filter((room) => room.id !== roomId));

    // If deleting current room, switch to another room or null
    // 현재 방을 삭제하는 경우, 다른 방으로 전환하거나 null로 설정
    if (currentRoomId === roomId) {
      const remainingRooms = rooms.filter((room) => room.id !== roomId);
      setCurrentRoomId(remainingRooms.length > 0 ? remainingRooms[0].id : null);
    }
  }, [currentRoomId, rooms]);

  /**
   * Update a chat room
   * 채팅 방 업데이트
   */
  const updateRoom = useCallback((roomId: string, updates: Partial<ChatRoom>) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, ...updates, updatedAt: new Date() }
          : room
      )
    );
  }, []);

  /**
   * Pin/unpin a room
   * 방 고정/고정 해제
   */
  const togglePinRoom = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, isPinned: !room.isPinned, updatedAt: new Date() }
          : room
      )
    );
  }, []);

  /**
   * Archive/unarchive a room
   * 방 보관/보관 해제
   */
  const toggleArchiveRoom = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, isArchived: !room.isArchived, updatedAt: new Date() }
          : room
      )
    );
  }, []);

  /**
   * Update room with last message info
   * 마지막 메시지 정보로 방 업데이트
   */
  const updateRoomLastMessage = useCallback((
    roomId: string,
    message: string,
    timestamp: Date
  ) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              lastMessage: message.substring(0, 100), // Truncate to 100 chars
              lastMessageTime: timestamp,
              updatedAt: timestamp,
            }
          : room
      )
    );
  }, []);

  /**
   * Increment message count for a room
   * 방의 메시지 카운트 증가
   */
  const incrementMessageCount = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, messageCount: room.messageCount + 1 }
          : room
      )
    );
  }, []);

  /**
   * Clear all rooms
   * 모든 방 삭제
   */
  const clearAllRooms = useCallback(() => {
    setRooms([]);
    setCurrentRoomId(null);
  }, []);

  /**
   * Get current room
   * 현재 방 가져오기
   */
  const currentRoom = useMemo(() => {
    return rooms.find((room) => room.id === currentRoomId) || null;
  }, [rooms, currentRoomId]);

  /**
   * Filter rooms based on criteria
   * 기준에 따라 방 필터링
   */
  const filterRooms = useCallback((options: RoomFilterOptions = {}): ChatRoom[] => {
    return rooms.filter((room) => {
      // Filter by agent type
      // 에이전트 타입으로 필터링
      if (options.agentType && options.agentType !== 'all' && room.agentType !== options.agentType) {
        return false;
      }

      // Filter by pinned status
      // 고정 상태로 필터링
      if (options.isPinned !== undefined && room.isPinned !== options.isPinned) {
        return false;
      }

      // Filter by archived status
      // 보관 상태로 필터링
      if (options.isArchived !== undefined && room.isArchived !== options.isArchived) {
        return false;
      }

      // Filter by search query
      // 검색어로 필터링
      if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase();
        const titleMatch = room.title.toLowerCase().includes(query);
        const messageMatch = room.lastMessage?.toLowerCase().includes(query);
        return titleMatch || messageMatch;
      }

      return true;
    });
  }, [rooms]);

  /**
   * Sort rooms (pinned first, then by last activity)
   * 방 정렬 (고정된 방 먼저, 그 다음 최근 활동순)
   */
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      // Pinned rooms come first
      // 고정된 방이 먼저
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then sort by last activity (most recent first)
      // 그 다음 최근 활동순 (최신이 먼저)
      const aTime = a.lastMessageTime || a.updatedAt;
      const bTime = b.lastMessageTime || b.updatedAt;
      return bTime.getTime() - aTime.getTime();
    });
  }, [rooms]);

  /**
   * Get rooms excluding archived ones
   * 보관된 방을 제외한 방 목록
   */
  const activeRooms = useMemo(() => {
    return sortedRooms.filter((room) => !room.isArchived);
  }, [sortedRooms]);

  return {
    // State
    rooms: sortedRooms,
    activeRooms,
    currentRoom,
    currentRoomId,

    // Actions
    createRoom,
    deleteRoom,
    updateRoom,
    togglePinRoom,
    toggleArchiveRoom,
    updateRoomLastMessage,
    incrementMessageCount,
    clearAllRooms,
    setCurrentRoomId,
    filterRooms,
  };
}
