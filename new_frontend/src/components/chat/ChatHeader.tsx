/**
 * ChatHeader Component
 * 채팅 헤더 컴포넌트
 *
 * Displays chat controls including stop, reset session, and agent tabs.
 * 중지, 세션 리셋, 에이전트 탭을 포함한 채팅 제어를 표시합니다.
 */

import React from 'react';
import {
  Menu,
  StopCircle,
  RotateCcw,
  Trash2,
  Sparkles,
  Heart,
  User as UserIcon,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../types/careguide-ia';

interface ChatHeaderProps {
  currentPath: string;
  isStreaming: boolean;
  onToggleSidebar: () => void;
  onStopStream: () => void;
  onResetSession: () => void;
  onResetAllSessions: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentPath,
  isStreaming,
  onToggleSidebar,
  onStopStream,
  onResetSession,
  onResetAllSessions,
}) => {
  const isMainChat = currentPath === ROUTES.CHAT;
  const isMedicalWelfare = currentPath === ROUTES.CHAT_MEDICAL_WELFARE;
  const isNutrition = currentPath === ROUTES.CHAT_NUTRITION;
  const isResearch = currentPath === ROUTES.CHAT_RESEARCH;

  /**
   * Handle reset session with confirmation
   * 확인 후 세션 리셋 처리
   */
  const handleResetSession = () => {
    if (confirm('현재 대화를 초기화하시겠습니까?')) {
      onResetSession();
    }
  };

  /**
   * Handle reset all sessions with confirmation
   * 확인 후 모든 세션 리셋 처리
   */
  const handleResetAllSessions = () => {
    if (confirm('모든 대화 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      onResetAllSessions();
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Menu and Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
            aria-label="Toggle sidebar"
            title="메뉴 열기"
          >
            <Menu size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
            AI 챗봇
          </h1>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Stop Streaming Button */}
          {isStreaming && (
            <button
              onClick={onStopStream}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
              aria-label="Stop streaming"
              title="응답 중지"
            >
              <StopCircle size={16} />
              <span className="hidden sm:inline">중지</span>
            </button>
          )}

          {/* Reset Session Button */}
          <button
            onClick={handleResetSession}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Reset current session"
            title="현재 대화 초기화"
          >
            <RotateCcw size={18} className="text-gray-600 dark:text-gray-400" />
          </button>

          {/* Reset All Sessions Button */}
          <button
            onClick={handleResetAllSessions}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Reset all sessions"
            title="모든 대화 삭제"
          >
            <Trash2 size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Agent Type Tabs */}
      <div className="flex gap-2 lg:gap-4 px-4 pb-3 overflow-x-auto hide-scrollbar">
        <Link
          to={ROUTES.CHAT}
          className="flex-1 min-w-[110px] h-11 flex items-center justify-center gap-1 lg:gap-2 rounded-xl transition-all duration-200"
          style={
            isMainChat
              ? {
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-primary)',
                  fontWeight: 'bold',
                  border: '2px solid transparent',
                  backgroundImage:
                    'linear-gradient(white, white), var(--gradient-primary)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }
              : {
                  backgroundColor: '#FFFFFF',
                  color: '#666666',
                  border: '2px solid #E5E7EB',
                }
          }
          aria-current={isMainChat ? 'page' : undefined}
        >
          <Sparkles size={16} strokeWidth={1.5} />
          <span className="text-xs lg:text-sm whitespace-nowrap">Auto</span>
        </Link>

        <Link
          to={ROUTES.CHAT_MEDICAL_WELFARE}
          className="flex-1 min-w-[110px] h-11 flex items-center justify-center gap-1 lg:gap-2 rounded-xl transition-all duration-200"
          style={
            isMedicalWelfare
              ? {
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-primary)',
                  fontWeight: 'bold',
                  border: '2px solid transparent',
                  backgroundImage:
                    'linear-gradient(white, white), var(--gradient-primary)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }
              : {
                  backgroundColor: '#FFFFFF',
                  color: '#666666',
                  border: '2px solid #E5E7EB',
                }
          }
          aria-current={isMedicalWelfare ? 'page' : undefined}
        >
          <Heart size={16} strokeWidth={1.5} />
          <span className="text-xs lg:text-sm whitespace-nowrap">의료 복지</span>
        </Link>

        <Link
          to={ROUTES.CHAT_NUTRITION}
          className="flex-1 min-w-[110px] h-11 flex items-center justify-center gap-1 lg:gap-2 rounded-xl transition-all duration-200"
          style={
            isNutrition
              ? {
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-primary)',
                  fontWeight: 'bold',
                  border: '2px solid transparent',
                  backgroundImage:
                    'linear-gradient(white, white), var(--gradient-primary)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }
              : {
                  backgroundColor: '#FFFFFF',
                  color: '#666666',
                  border: '2px solid #E5E7EB',
                }
          }
          aria-current={isNutrition ? 'page' : undefined}
        >
          <UserIcon size={16} strokeWidth={1.5} />
          <span className="text-xs lg:text-sm whitespace-nowrap">식이 영양</span>
        </Link>

        <Link
          to={ROUTES.CHAT_RESEARCH}
          className="flex-1 min-w-[110px] h-11 flex items-center justify-center gap-1 lg:gap-2 rounded-xl transition-all duration-200"
          style={
            isResearch
              ? {
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-primary)',
                  fontWeight: 'bold',
                  border: '2px solid transparent',
                  backgroundImage:
                    'linear-gradient(white, white), var(--gradient-primary)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }
              : {
                  backgroundColor: '#FFFFFF',
                  color: '#666666',
                  border: '2px solid #E5E7EB',
                }
          }
          aria-current={isResearch ? 'page' : undefined}
        >
          <FileText size={16} strokeWidth={1.5} />
          <span className="text-xs lg:text-sm whitespace-nowrap">연구 논문</span>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="mx-4 mb-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 lg:p-3">
        <p className="text-xs text-yellow-900 dark:text-yellow-100">
          ⚠️ <strong>주의사항</strong>: 이 AI는 참고용 정보를 제공하며 전문적인
          의학적 진단이나 치료를 대체할 수 없습니다. 응급 상황 시 즉시 119에
          연락하거나 병원을 방문하세요.
        </p>
      </div>
    </header>
  );
};
