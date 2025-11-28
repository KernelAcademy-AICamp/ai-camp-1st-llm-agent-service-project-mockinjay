import React, { useMemo } from 'react';
import { MobileHeader } from '../components/MobileHeader';

// Notification interface
interface Notification {
  id: string;
  userId?: string; // undefined means it's a global notification
  type: 'user' | 'global';
  title: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'currentUser',
    type: 'user',
    title: '퀴즈 미션 완료!',
    content: '레벨 3 퀴즈를 완료하셨습니다. 200 포인트를 획득하셨습니다.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isRead: true
  },
  {
    id: '2',
    userId: 'currentUser',
    type: 'user',
    title: '커뮤니티에 새 댓글이 달렸습니다',
    content: '회원님의 게시글 "투석 경험 공유합니다"에 새로운 댓글이 달렸습니다.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isRead: true
  },
  {
    id: '3',
    type: 'global',
    title: '새로운 건강 정보가 업데이트되었습니다',
    content: '만성신장병 환자를 위한 최신 식단 가이드가 추가되었습니다. 지금 확인해보세요.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false
  },
  {
    id: '4',
    userId: 'currentUser',
    type: 'user',
    title: '식단 로그 리마인더',
    content: '오늘의 식사를 기록해주세요. 꾸준한 기록이 건강 관리의 첫걸음입니다.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isRead: true
  },
  {
    id: '5',
    type: 'global',
    title: '시스템 점검 안내',
    content: '2025년 1월 15일 02:00~04:00 시스템 점검이 예정되어 있습니다.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isRead: true
  }
];

export function NotificationPage() {
  // Mock current user ID
  const currentUserId = 'currentUser';

  // Filter and sort notifications
  const notifications = useMemo(() => {
    return mockNotifications
      .filter(notif => notif.type === 'global' || notif.userId === currentUserId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [currentUserId]);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return '방금 전';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}주 전`;
    const months = Math.floor(days / 30);
    return `${months}개월 전`;
  };
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader
          title="알림"
          showMenu={true}
          showProfile={true}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] mb-6">알림</h1>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 bg-white border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notification.isRead ? 'bg-[#E5E7EB]' : 'bg-[#00C9B7]'
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[#1F2937] flex-1">
                        {notification.title}
                      </h3>
                      {notification.type === 'global' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0FDFA] text-[#00C9B7] whitespace-nowrap">
                          전체공지
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-[#6B7280] mb-2 break-words">
                      {notification.content}
                    </p>
                    <span className="text-xs text-[#9CA3AF]">
                      {getTimeAgo(notification.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
