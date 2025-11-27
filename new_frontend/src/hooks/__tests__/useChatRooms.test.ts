/**
 * useChatRooms Hook Tests
 * useChatRooms 훅 테스트
 *
 * Unit tests for the chat room management hook.
 * 채팅 방 관리 훅을 위한 단위 테스트.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatRooms } from '../useChatRooms';

// Mock localStorage
// localStorage 모킹
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useChatRooms', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    // 각 테스트 전에 localStorage 초기화
    localStorageMock.clear();
  });

  it('should initialize with empty rooms', () => {
    const { result } = renderHook(() => useChatRooms());

    expect(result.current.rooms).toEqual([]);
    expect(result.current.currentRoom).toBeNull();
    expect(result.current.currentRoomId).toBeNull();
  });

  it('should create a new room', () => {
    const { result } = renderHook(() => useChatRooms());

    act(() => {
      result.current.createRoom({ title: 'Test Room', agentType: 'auto' });
    });

    expect(result.current.rooms).toHaveLength(1);
    expect(result.current.rooms[0].title).toBe('Test Room');
    expect(result.current.rooms[0].agentType).toBe('auto');
    expect(result.current.currentRoomId).toBe(result.current.rooms[0].id);
  });

  it('should create room with default title when no title provided', () => {
    const { result } = renderHook(() => useChatRooms());

    act(() => {
      result.current.createRoom({ agentType: 'medical_welfare' });
    });

    expect(result.current.rooms[0].title).toBe('의료 복지 상담');
  });

  it('should delete a room', () => {
    const { result } = renderHook(() => useChatRooms());

    let roomId: string;

    act(() => {
      const room = result.current.createRoom({ title: 'Room to Delete' });
      roomId = room.id;
    });

    expect(result.current.rooms).toHaveLength(1);

    act(() => {
      result.current.deleteRoom(roomId);
    });

    expect(result.current.rooms).toHaveLength(0);
    expect(result.current.currentRoomId).toBeNull();
  });

  it('should update a room', () => {
    const { result } = renderHook(() => useChatRooms());

    let roomId: string;

    act(() => {
      const room = result.current.createRoom({ title: 'Original Title' });
      roomId = room.id;
    });

    act(() => {
      result.current.updateRoom(roomId, { title: 'Updated Title' });
    });

    expect(result.current.rooms[0].title).toBe('Updated Title');
  });

  it('should toggle pin status', () => {
    const { result } = renderHook(() => useChatRooms());

    let roomId: string;

    act(() => {
      const room = result.current.createRoom({ title: 'Test Room' });
      roomId = room.id;
    });

    expect(result.current.rooms[0].isPinned).toBeFalsy();

    act(() => {
      result.current.togglePinRoom(roomId);
    });

    expect(result.current.rooms[0].isPinned).toBe(true);

    act(() => {
      result.current.togglePinRoom(roomId);
    });

    expect(result.current.rooms[0].isPinned).toBe(false);
  });

  it('should toggle archive status', () => {
    const { result } = renderHook(() => useChatRooms());

    let roomId: string;

    act(() => {
      const room = result.current.createRoom({ title: 'Test Room' });
      roomId = room.id;
    });

    expect(result.current.rooms[0].isArchived).toBeFalsy();

    act(() => {
      result.current.toggleArchiveRoom(roomId);
    });

    expect(result.current.rooms[0].isArchived).toBe(true);
  });

  it('should update room last message', () => {
    const { result } = renderHook(() => useChatRooms());

    let roomId: string;
    const testMessage = 'This is a test message';
    const testTime = new Date();

    act(() => {
      const room = result.current.createRoom({ title: 'Test Room' });
      roomId = room.id;
    });

    act(() => {
      result.current.updateRoomLastMessage(roomId, testMessage, testTime);
    });

    expect(result.current.rooms[0].lastMessage).toBe(testMessage);
    expect(result.current.rooms[0].lastMessageTime).toEqual(testTime);
  });

  it('should increment message count', () => {
    const { result } = renderHook(() => useChatRooms());

    let roomId: string;

    act(() => {
      const room = result.current.createRoom({ title: 'Test Room' });
      roomId = room.id;
    });

    expect(result.current.rooms[0].messageCount).toBe(0);

    act(() => {
      result.current.incrementMessageCount(roomId);
    });

    expect(result.current.rooms[0].messageCount).toBe(1);

    act(() => {
      result.current.incrementMessageCount(roomId);
    });

    expect(result.current.rooms[0].messageCount).toBe(2);
  });

  it('should filter active rooms (exclude archived)', () => {
    const { result } = renderHook(() => useChatRooms());

    act(() => {
      result.current.createRoom({ title: 'Active Room 1' });
      result.current.createRoom({ title: 'Active Room 2' });
      const room3 = result.current.createRoom({ title: 'Archived Room' });
      result.current.toggleArchiveRoom(room3.id);
    });

    expect(result.current.rooms).toHaveLength(3);
    expect(result.current.activeRooms).toHaveLength(2);
  });

  it('should sort pinned rooms first', () => {
    const { result } = renderHook(() => useChatRooms());

    let room1Id: string;
    let room2Id: string;

    act(() => {
      const room1 = result.current.createRoom({ title: 'Room 1' });
      const room2 = result.current.createRoom({ title: 'Room 2' });
      room1Id = room1.id;
      room2Id = room2.id;
    });

    act(() => {
      result.current.togglePinRoom(room2Id);
    });

    expect(result.current.rooms[0].id).toBe(room2Id);
    expect(result.current.rooms[1].id).toBe(room1Id);
  });

  it('should clear all rooms', () => {
    const { result } = renderHook(() => useChatRooms());

    act(() => {
      result.current.createRoom({ title: 'Room 1' });
      result.current.createRoom({ title: 'Room 2' });
      result.current.createRoom({ title: 'Room 3' });
    });

    expect(result.current.rooms).toHaveLength(3);

    act(() => {
      result.current.clearAllRooms();
    });

    expect(result.current.rooms).toHaveLength(0);
    expect(result.current.currentRoomId).toBeNull();
  });

  it('should persist rooms to localStorage', () => {
    const { result } = renderHook(() => useChatRooms());

    act(() => {
      result.current.createRoom({ title: 'Persistent Room' });
    });

    const stored = localStorage.getItem('careguide_chat_rooms');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Persistent Room');
  });

  it('should load rooms from localStorage on mount', () => {
    // Pre-populate localStorage
    // localStorage 미리 채우기
    const mockRooms = [
      {
        id: 'room1',
        title: 'Existing Room',
        agentType: 'auto',
        messageCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem('careguide_chat_rooms', JSON.stringify(mockRooms));

    const { result } = renderHook(() => useChatRooms());

    expect(result.current.rooms).toHaveLength(1);
    expect(result.current.rooms[0].title).toBe('Existing Room');
  });

  it('should filter rooms by search query', () => {
    const { result } = renderHook(() => useChatRooms());

    act(() => {
      result.current.createRoom({ title: 'Medical Consultation' });
      result.current.createRoom({ title: 'Nutrition Advice' });
      result.current.createRoom({ title: 'Research Papers' });
    });

    const filtered = result.current.filterRooms({ searchQuery: 'medical' });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Medical Consultation');
  });

  it('should filter rooms by agent type', () => {
    const { result } = renderHook(() => useChatRooms());

    act(() => {
      result.current.createRoom({ agentType: 'medical_welfare' });
      result.current.createRoom({ agentType: 'nutrition' });
      result.current.createRoom({ agentType: 'medical_welfare' });
    });

    const filtered = result.current.filterRooms({ agentType: 'medical_welfare' });

    expect(filtered).toHaveLength(2);
    expect(filtered.every(r => r.agentType === 'medical_welfare')).toBe(true);
  });

  it('should set current room', () => {
    const { result } = renderHook(() => useChatRooms());

    let roomId: string;

    act(() => {
      const room = result.current.createRoom({ title: 'Test Room' });
      roomId = room.id;
    });

    // Room should be set as current on creation
    // 생성 시 현재 방으로 설정되어야 함
    expect(result.current.currentRoomId).toBe(roomId);

    act(() => {
      result.current.setCurrentRoomId(null);
    });

    expect(result.current.currentRoomId).toBeNull();
    expect(result.current.currentRoom).toBeNull();

    act(() => {
      result.current.setCurrentRoomId(roomId);
    });

    expect(result.current.currentRoomId).toBe(roomId);
    expect(result.current.currentRoom).toBeTruthy();
    expect(result.current.currentRoom?.id).toBe(roomId);
  });
});
