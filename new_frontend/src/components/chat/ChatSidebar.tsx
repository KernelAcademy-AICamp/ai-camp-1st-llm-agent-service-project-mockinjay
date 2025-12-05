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
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-80 bg-surface-alt border-r border-gray-100
          flex flex-col h-full
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Chat rooms sidebar"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              대화 목록
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onCreateRoom}
                className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors duration-200"
                aria-label="Create new chat room"
                title="새 대화 시작"
              >
                <MessageSquarePlus size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors lg:hidden text-gray-500"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative group">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors"
            />
            <input
              type="text"
              placeholder="대화 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              aria-label="Search chat rooms"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm font-medium">
                {searchQuery ? '검색 결과가 없습니다' : '새 대화를 시작하세요'}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
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
                      w-full text-left p-3 rounded-xl transition-all duration-200 cursor-pointer group
                      ${
                        currentRoomId === room.id
                          ? 'bg-white shadow-md border border-primary/10'
                          : 'hover:bg-white hover:shadow-sm border border-transparent'
                      }
                    `}
                    aria-label={`Select ${room.title}`}
                    aria-current={currentRoomId === room.id ? 'true' : 'false'}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Title and Icon */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`
                            flex-shrink-0 p-1.5 rounded-lg
                            ${currentRoomId === room.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500 group-hover:bg-primary/5 group-hover:text-primary'}
                            transition-colors
                          `}>
                            {getAgentIcon(room.agentType)}
                          </span>
                          <h3 className={`font-semibold text-sm truncate transition-colors ${currentRoomId === room.id ? 'text-primary' : 'text-gray-700 group-hover:text-gray-900'}`}>
                            {room.title}
                          </h3>
                          {room.isPinned && (
                            <Pin size={12} className="text-primary flex-shrink-0 transform rotate-45" />
                          )}
                        </div>

                        {/* Last Message */}
                        {room.lastMessage && (
                          <p className="text-xs text-gray-500 truncate pl-9">
                            {room.lastMessage}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-2 mt-2 pl-9 text-[10px] text-gray-400">
                          <span>
                            {formatTimestamp(room.lastMessageTime || room.updatedAt)}
                          </span>
                          {room.messageCount > 0 && (
                            <>
                              <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                              <span>{room.messageCount}개 메시지</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Menu Button */}
                      <button
                        onClick={(e) => toggleMenu(room.id, e)}
                        className={`
                          p-1.5 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100
                          ${activeMenu === room.id ? 'opacity-100 bg-gray-100' : 'hover:bg-gray-100'}
                        `}
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
                      <div className="absolute right-2 top-12 z-20 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-scale-in origin-top-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(room.id);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                        >
                          <Pin size={16} className={room.isPinned ? 'text-primary' : 'text-gray-400'} />
                          {room.isPinned ? '고정 해제' : '고정'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleArchive(room.id);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                        >
                          <Archive size={16} className={room.isArchived ? 'text-primary' : 'text-gray-400'} />
                          {room.isArchived ? '보관 취소' : '보관'}
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('이 대화를 삭제하시겠습니까?')) {
                              onDeleteRoom(room.id);
                            }
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-2.5 text-red-500 transition-colors"
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

