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
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../types/careguide-ia';

interface ChatHeaderProps {
  currentPath: string;
  isStreaming: boolean;
  onToggleSidebar: () => void;
  onStopStream: () => void;
  onResetSession: () => void;
  onResetAllSessions: () => void;
  /** Whether messages exist in current chat - used for tab lock */
  hasMessages?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentPath,
  isStreaming,
  onToggleSidebar,
  onStopStream,
  onResetSession,
  onResetAllSessions,
  hasMessages = false,
}) => {
  const navigate = useNavigate();
  const isMainChat = currentPath === ROUTES.CHAT;
  const isMedicalWelfare = currentPath === ROUTES.CHAT_MEDICAL_WELFARE;
  const isNutrition = currentPath === ROUTES.CHAT_NUTRITION;
  const isResearch = currentPath === ROUTES.CHAT_RESEARCH;

  /**
   * Check if a tab should be disabled (Tab Lock feature)
   * 탭이 비활성화되어야 하는지 확인 (Tab Lock 기능)
   */
  const isTabLocked = (tabPath: string): boolean => {
    return hasMessages && currentPath !== tabPath;
  };

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

  const getTabClass = (isActive: boolean, isLocked: boolean) => {
    const baseClass = "flex-1 min-w-[110px] h-11 flex items-center justify-center gap-1 lg:gap-2 rounded-xl transition-all duration-300 border-2";
    
    if (isLocked) {
      return `${baseClass} bg-gray-50 text-gray-400 border-gray-100 opacity-50 cursor-not-allowed`;
    }
    
    if (isActive) {
      return `${baseClass} bg-white text-primary font-bold border-transparent shadow-sm relative bg-clip-padding before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-r before:from-primary before:to-secondary before:-z-10 before:content-[''] z-10`;
    }
    
    return `${baseClass} bg-white text-gray-500 border-gray-100 hover:border-primary/30 hover:text-primary hover:bg-primary/5`;
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-[#E0E0E0] z-30 sticky top-0">
      {/* Top Bar - Matches MobileHeader.tsx standard */}
      <div className="relative flex items-center justify-between px-4 py-3 h-[52px] md:h-auto border-b md:border-none border-[#E0E0E0]">
        {/* Left: Menu */}
        <div className="flex items-center w-10 z-10">
          <button
            onClick={onToggleSidebar}
            className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors text-[#1F2937]"
            aria-label="메뉴 열기"
          >
            <Menu size={24} strokeWidth={2} />
          </button>
        </div>

        {/* Mobile Title - Absolute Center (Matches MobileHeader) */}
        <h1 className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[16px] font-bold text-[#1F2937] md:hidden truncate max-w-[60%]">
          AI 챗봇
        </h1>

        {/* Desktop Title (Hidden to avoid duplication with Global Header) */}
        <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 hidden ml-3">
          AI 챗봇
        </h1>

        {/* Right: User Profile & Controls */}
        <div className="flex items-center justify-end w-10 md:w-auto z-10">
          {/* Mobile: User Profile Icon (Matches MobileHeader) */}
          <button
            onClick={() => navigate('/mypage')}
            className="p-1 -mr-1 relative rounded-full hover:bg-gray-100 transition-colors md:hidden"
            aria-label="마이페이지"
          >
            <UserIcon size={24} color="#999999" strokeWidth={2} />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full" style={{ background: '#00C9B7' }} />
          </button>

          {/* Desktop: Controls (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-1 md:gap-2">
            {/* Stop Streaming Button */}
            {isStreaming && (
              <button
                onClick={onStopStream}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg text-sm font-medium animate-pulse"
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
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-primary"
              aria-label="Reset current session"
              title="현재 대화 초기화"
            >
              <RotateCcw size={18} />
            </button>

            {/* Reset All Sessions Button */}
            <button
              onClick={handleResetAllSessions}
              className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-500 hover:text-red-500"
              aria-label="Reset all sessions"
              title="모든 대화 삭제"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Agent Type Tabs */}
      <div className="flex flex-col px-3 md:px-4 pb-2 md:pb-3">
        <div className="flex gap-2 md:gap-4 overflow-x-auto hide-scrollbar pb-1">
          {/* Auto Tab */}
          {isTabLocked(ROUTES.CHAT) ? (
            <button disabled className={getTabClass(false, true)}>
              <Sparkles size={16} strokeWidth={1.5} />
              <span className="text-xs md:text-sm whitespace-nowrap">Auto</span>
            </button>
          ) : (
            <Link to={ROUTES.CHAT} className={getTabClass(isMainChat, false)}>
              <Sparkles size={16} strokeWidth={1.5} />
              <span className="text-xs md:text-sm whitespace-nowrap">Auto</span>
            </Link>
          )}

          {/* Medical Welfare Tab */}
          {isTabLocked(ROUTES.CHAT_MEDICAL_WELFARE) ? (
            <button disabled className={getTabClass(false, true)}>
              <Heart size={16} strokeWidth={1.5} />
              <span className="text-xs md:text-sm whitespace-nowrap">의료 복지</span>
            </button>
          ) : (
            <Link to={ROUTES.CHAT_MEDICAL_WELFARE} className={getTabClass(isMedicalWelfare, false)}>
              <Heart size={16} strokeWidth={1.5} />
              <span className="text-xs md:text-sm whitespace-nowrap">의료 복지</span>
            </Link>
          )}

          {/* Nutrition Tab */}
          {isTabLocked(ROUTES.CHAT_NUTRITION) ? (
            <button disabled className={getTabClass(false, true)}>
              <UserIcon size={16} strokeWidth={1.5} />
              <span className="text-xs md:text-sm whitespace-nowrap">식이 영양</span>
            </button>
          ) : (
            <Link to={ROUTES.CHAT_NUTRITION} className={getTabClass(isNutrition, false)}>
              <UserIcon size={16} strokeWidth={1.5} />
              <span className="text-xs md:text-sm whitespace-nowrap">식이 영양</span>
            </Link>
          )}

          {/* Research Tab */}
          {isTabLocked(ROUTES.CHAT_RESEARCH) ? (
            <button disabled className={getTabClass(false, true)}>
              <FileText size={16} strokeWidth={1.5} />
              <span className="text-xs md:text-sm whitespace-nowrap">연구 논문</span>
            </button>
          ) : (
            <Link to={ROUTES.CHAT_RESEARCH} className={getTabClass(isResearch, false)}>
              <FileText size={16} strokeWidth={1.5} />
              <span className="text-xs md:text-sm whitespace-nowrap">연구 논문</span>
            </Link>
          )}
        </div>

        {/* Tab Lock Notice */}
        {hasMessages && (
          <div className="text-[10px] text-gray-400 mt-2 text-center animate-fade-in">
            대화 중에는 다른 에이전트로 변경할 수 없습니다
          </div>
        )}
      </div>

      {/* Disclaimer - Compact on mobile */}
      <div className="mx-3 md:mx-4 mb-2 md:mb-3 bg-yellow-50/50 border border-yellow-200 rounded-xl p-2 md:p-3 backdrop-blur-sm">
        <p className="text-[10px] md:text-xs text-yellow-800 flex items-start gap-2">
          <span className="text-base md:text-lg leading-none">⚠️</span>
          <span>
            <strong className="hidden sm:inline">주의사항: </strong>
            이 AI는 참고용 정보를 제공하며 전문적인 의학적 진단이나 치료를 대체할 수 없습니다. 
            <span className="hidden sm:inline"> 응급 상황 시 즉시 119에 연락하거나 병원을 방문하세요.</span>
          </span>
        </p>
      </div>
    </header>
  );
};

