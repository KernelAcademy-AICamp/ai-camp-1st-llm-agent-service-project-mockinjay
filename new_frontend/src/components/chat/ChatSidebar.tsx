/**
 * ChatSidebar Component
 * 채팅 사이드바 컴포넌트
 *
 * Displays list of chat rooms with create, switch, and delete functionality.
 * 생성, 전환, 삭제 기능이 있는 채팅 방 목록을 표시합니다.
 */

import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Search,
  MoreVertical,
  Pin,
  Archive,
  Trash2,
  X,
  MessageSquare,
  Sparkles,
  Heart,
  User,
  FileText,
} from 'lucide-react';
import type { ChatRoom } from '../../types/chat';
import type { AgentType } from '../../services/intentRouter';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  currentRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onDeleteRoom: (roomId: string) => void;
  onTogglePin: (roomId: string) => void;
  onToggleArchive: (roomId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Get icon for agent type
 * 에이전트 타입에 맞는 아이콘 가져오기
 */
const getAgentIcon = (agentType: AgentType | 'auto') => {
  switch (agentType) {
    case 'auto':
      return <Sparkles size={16} />;
    case 'medical_welfare':
      return <Heart size={16} />;
    case 'nutrition':
      return <User size={16} />;
    case 'research_paper':
      return <FileText size={16} />;
    default:
      return <MessageSquare size={16} />;
  }
};

/**
 * Format timestamp for display
 * 표시를 위한 타임스탬프 포맷
 */
const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60 * 1000) {
    return '방금 전';
  }

  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}분 전`;
  }

  // Less than 1 day
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}시간 전`;
  }

  // Less than 1 week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}일 전`;
  }

  // Format as date
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  currentRoomId,
  onSelectRoom,
  onCreateRoom,
  onDeleteRoom,
  onTogglePin,
  onToggleArchive,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Filter rooms based on search query
  // 검색어에 따라 방 필터링
  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      room.title.toLowerCase().includes(query) ||
      room.lastMessage?.toLowerCase().includes(query)
    );
  });

  /**
   * Handle room selection
   * 방 선택 처리
   */
  const handleSelectRoom = (roomId: string) => {
    onSelectRoom(roomId);
    setActiveMenu(null);
    // Close sidebar on mobile after selection
    // 모바일에서 선택 후 사이드바 닫기
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  /**
   * Toggle room menu
   * 방 메뉴 토글
   */
  const toggleMenu = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === roomId ? null : roomId);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          flex flex-col h-full
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Chat rooms sidebar"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              대화 목록
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onCreateRoom}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Create new chat room"
                title="새 대화 시작"
              >
                <MessageSquarePlus size={20} className="text-primary-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="대화 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              aria-label="Search chat rooms"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageSquare size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {searchQuery ? '검색 결과가 없습니다' : '새 대화를 시작하세요'}
              </p>
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {filteredRooms.map((room) => (
                <li key={room.id} className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectRoom(room.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectRoom(room.id);
                      }
                    }}
                    className={`
                      w-full text-left p-3 rounded-lg transition-colors cursor-pointer
                      hover:bg-gray-50 dark:hover:bg-gray-700
                      ${
                        currentRoomId === room.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                          : ''
                      }
                    `}
                    aria-label={`Select ${room.title}`}
                    aria-current={currentRoomId === room.id ? 'true' : 'false'}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Title and Icon */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">
                            {getAgentIcon(room.agentType)}
                          </span>
                          <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {room.title}
                          </h3>
                          {room.isPinned && (
                            <Pin size={12} className="text-primary-600 flex-shrink-0" />
                          )}
                        </div>

                        {/* Last Message */}
                        {room.lastMessage && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {room.lastMessage}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
                          <span>
                            {formatTimestamp(room.lastMessageTime || room.updatedAt)}
                          </span>
                          {room.messageCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{room.messageCount}개 메시지</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Menu Button */}
                      <button
                        onClick={(e) => toggleMenu(room.id, e)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                        aria-label="Room options"
                        aria-expanded={activeMenu === room.id}
                      >
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Context Menu */}
                  {activeMenu === room.id && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActiveMenu(null)}
                      />
                      <div className="absolute right-2 top-12 z-20 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(room.id);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                        >
                          <Pin size={16} />
                          {room.isPinned ? '고정 해제' : '고정'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleArchive(room.id);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                        >
                          <Archive size={16} />
                          {room.isArchived ? '보관 취소' : '보관'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('이 대화를 삭제하시겠습니까?')) {
                              onDeleteRoom(room.id);
                            }
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
                        >
                          <Trash2 size={16} />
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
};
