/**
 * useChatRooms Hook
 * 채팅 방 관리 훅
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChatRoom, StoredRoom, CreateRoomOptions, RoomFilterOptions, AgentType } from '../types/chat';

const ROOMS_STORAGE_KEY = 'careguide_chat_rooms' as const;
const CURRENT_ROOM_KEY = 'careguide_current_room' as const;

function deserializeRoom(stored: StoredRoom): ChatRoom {
  return {
    ...stored,
    lastMessageTime: stored.lastMessageTime ? new Date(stored.lastMessageTime) : undefined,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  };
}

function serializeRoom(room: ChatRoom): StoredRoom {
  return {
    ...room,
    lastMessageTime: room.lastMessageTime?.toISOString(),
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}

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

  useEffect(() => {
    try {
      const serialized = rooms.map(serializeRoom);
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(serialized));
    } catch (e) {
      console.warn('Could not save chat rooms to localStorage:', e);
    }
  }, [rooms]);

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

  const deleteRoom = useCallback((roomId: string) => {
    setRooms((prev) => prev.filter((room) => room.id !== roomId));

    if (currentRoomId === roomId) {
      const remainingRooms = rooms.filter((room) => room.id !== roomId);
      setCurrentRoomId(remainingRooms[0]?.id ?? null);
    }
  }, [currentRoomId, rooms]);

  const updateRoom = useCallback((roomId: string, updates: Partial<ChatRoom>) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, ...updates, updatedAt: new Date() }
          : room
      )
    );
  }, []);

  const togglePinRoom = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, isPinned: !room.isPinned, updatedAt: new Date() }
          : room
      )
    );
  }, []);

  const toggleArchiveRoom = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, isArchived: !room.isArchived, updatedAt: new Date() }
          : room
      )
    );
  }, []);

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
              lastMessage: message.substring(0, 100),
              lastMessageTime: timestamp,
              updatedAt: timestamp,
            }
          : room
      )
    );
  }, []);

  const incrementMessageCount = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, messageCount: room.messageCount + 1 }
          : room
      )
    );
  }, []);

  const clearAllRooms = useCallback(() => {
    setRooms([]);
    setCurrentRoomId(null);
  }, []);

  const currentRoom = useMemo(() => {
    return rooms.find((room) => room.id === currentRoomId) || null;
  }, [rooms, currentRoomId]);

  const filterRooms = useCallback((options: RoomFilterOptions = {}): ChatRoom[] => {
    return rooms.filter((room) => {
      if (options.agentType && options.agentType !== 'all' && room.agentType !== options.agentType) {
        return false;
      }
      if (options.isPinned !== undefined && room.isPinned !== options.isPinned) {
        return false;
      }
      if (options.isArchived !== undefined && room.isArchived !== options.isArchived) {
        return false;
      }
      if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase();
        const titleMatch = room.title.toLowerCase().includes(query);
        const messageMatch = room.lastMessage?.toLowerCase().includes(query);
        return titleMatch || messageMatch;
      }
      return true;
    });
  }, [rooms]);

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.lastMessageTime || a.updatedAt;
      const bTime = b.lastMessageTime || b.updatedAt;
      return bTime.getTime() - aTime.getTime();
    });
  }, [rooms]);

  const activeRooms = useMemo(() => {
    return sortedRooms.filter((room) => !room.isArchived);
  }, [sortedRooms]);

  return {
    rooms: sortedRooms,
    activeRooms,
    currentRoom,
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
    filterRooms,
  };
}
