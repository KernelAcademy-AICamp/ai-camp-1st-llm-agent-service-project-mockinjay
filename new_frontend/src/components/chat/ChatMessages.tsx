/**
 * ChatMessages Component
 * 채팅 메시지 컴포넌트
 *
 * Displays chat messages with streaming support, timestamps, and error handling.
 * 스트리밍 지원, 타임스탬프, 에러 처리가 포함된 채팅 메시지를 표시합니다.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Bot, User as UserIcon, Clock, History, Loader2, AlertTriangle, ChevronDown, Copy, Check } from 'lucide-react';
import type { ChatMessage } from '../../types/chat';
import { useAuth } from '../../contexts/AuthContext';
import { WelcomeMessage } from './WelcomeMessage';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  isSessionExpired: boolean;
  isRestoringHistory: boolean;
  onRestoreHistory: () => void;
  onStartNewConversation: () => void;
  /** Agent type for welcome message */
  agentType?: 'auto' | 'medical_welfare' | 'nutrition' | 'research';
  /** Callback when suggestion chip is clicked */
  onSuggestionClick?: (suggestion: string) => void;
}

/**
 * Format timestamp for message display
 * 메시지 표시를 위한 타임스탬프 포맷
 */
const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date for message grouping
 * 메시지 그룹화를 위한 날짜 포맷
 */
const formatMessageDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return '오늘';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '어제';
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isStreaming,
  streamingContent,
  isSessionExpired,
  isRestoringHistory,
  onRestoreHistory,
  onStartNewConversation,
  agentType = 'auto',
  onSuggestionClick,
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  /**
   * Handle scroll event to show/hide scroll-to-bottom button
   * 스크롤 이벤트 처리로 맨 아래로 이동 버튼 표시/숨김
   */
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 3);
    }
  }, [messages.length]);

  /**
   * Scroll to bottom function
   * 맨 아래로 스크롤하는 함수
   */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  /**
   * Copy message to clipboard
   * 메시지를 클립보드에 복사
   */
  const copyToClipboard = useCallback(async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  /**
   * Scroll to bottom when new messages arrive
   * 새 메시지가 도착하면 하단으로 스크롤
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  /**
   * Add scroll event listener
   * 스크롤 이벤트 리스너 추가
   */
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  /**
   * Group messages by date
   * 날짜별로 메시지 그룹화
   */
  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = formatMessageDate(message.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 lg:p-6 bg-transparent custom-scrollbar scroll-smooth relative"
    >
      {/* Empty State - Welcome Message with Suggestions */}
      {messages.length === 0 && !isSessionExpired && onSuggestionClick && (
        <div className="w-full lg:max-w-[832px] mx-auto animate-fade-in">
          <WelcomeMessage
            agentType={agentType}
            onSuggestionClick={onSuggestionClick}
            isDisabled={isStreaming}
          />
        </div>
      )}

      {/* Fallback Empty State (when no suggestion handler provided) */}
      {messages.length === 0 && !isSessionExpired && !onSuggestionClick && (
        <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Bot size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">
            CareGuide AI와 대화를 시작하세요
          </h2>
          <p className="text-gray-500 max-w-md leading-relaxed">
            건강 관련 질문, 영양 상담, 의료 정보 검색 등 무엇이든 물어보세요.
          </p>
        </div>
      )}

      {/* Session Expired State */}
      {messages.length === 0 && isSessionExpired && (
        <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 mb-2">
              세션이 만료되었습니다
            </p>
            <p className="text-gray-500">
              5분간 활동이 없어 대화가 화면에서 숨겨졌습니다
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={onRestoreHistory}
              disabled={isRestoringHistory || !user?.id}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {isRestoringHistory ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  불러오는 중...
                </>
              ) : (
                <>
                  <History className="h-4 w-4" />
                  이전 대화 보기
                </>
              )}
            </button>
            <button
              onClick={onStartNewConversation}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              새 대화 시작
            </button>
          </div>
          {!user?.id && (
            <p className="text-xs text-amber-600 mt-4 bg-amber-50 px-3 py-1 rounded-full">
              로그인하면 이전 대화를 복원할 수 있습니다
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
        <div key={dateKey} className="mb-8">
          {/* Date Separator */}
          <div className="flex items-center justify-center mb-6">
            <div className="px-4 py-1.5 bg-gray-100/80 backdrop-blur-sm rounded-full text-xs font-medium text-gray-500 shadow-sm">
              {dateKey}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-6">
            {dayMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-slide-up`}
              >
                <div
                  className={`max-w-[85%] lg:max-w-[70%] rounded-2xl p-4 shadow-sm relative group
                    ${message.role === 'user' 
                      ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-tr-sm' 
                      : message.fallbackType
                        ? 'bg-orange-50 text-gray-800 border border-orange-200 rounded-tl-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar - with fallback warning icon */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-1 flex-shrink-0">
                        {message.fallbackType ? (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <AlertTriangle size={16} className="text-orange-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot size={18} className="text-primary" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                      {/* Emergency Badge */}
                      {message.isEmergency && (
                        <div className="mb-3 p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          응급 상황 감지됨
                        </div>
                      )}

                      {/* Fallback Badge */}
                      {message.fallbackType && (
                        <div className="mb-3 p-2.5 bg-orange-50 border border-orange-100 rounded-xl text-orange-700 text-xs font-medium flex items-center gap-2">
                          <AlertTriangle size={14} className="flex-shrink-0" />
                          <span>일시적인 오류로 대체 응답이 제공됩니다</span>
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed break-words overflow-wrap-anywhere">
                        {message.content}
                      </div>

                      {/* Message Metadata and Actions */}
                      <div
                        className={`flex items-center justify-between gap-2 mt-2 text-[11px] ${
                          message.role === 'user'
                            ? 'text-white/80'
                            : 'text-gray-400'
                        }`}
                      >
                        <span>{formatMessageTime(message.timestamp)}</span>

                        {/* Copy button for assistant messages */}
                        {message.role === 'assistant' && !message.fallbackType && (
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                            aria-label="복사"
                          >
                            {copiedMessageId === message.id ? (
                              <Check size={14} className="text-green-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Intent Information */}
                      {message.role === 'assistant' &&
                        message.intents &&
                        message.intents.length > 1 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs font-semibold text-gray-500">
                              복합 의도 감지:
                            </span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {message.intents.map((intent) => (
                                <span
                                  key={intent}
                                  className="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium"
                                >
                                  {intent}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Avatar for user */}
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mt-1 flex-shrink-0 backdrop-blur-sm">
                        <UserIcon size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Streaming Message */}
      {isStreaming && (
        <div className="flex justify-start mb-8 animate-fade-in">
          <div className="max-w-[85%] lg:max-w-[70%] rounded-2xl rounded-tl-sm p-4 shadow-sm bg-white border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1 flex-shrink-0">
                <Bot size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                {streamingContent ? (
                  <>
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed break-words text-gray-800">
                      {streamingContent}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-primary font-medium">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span>응답 생성 중...</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 h-6">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll Anchor */}
      <div ref={messagesEndRef} />

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          className="fixed bottom-32 right-6 lg:right-10 z-30 p-3 bg-white shadow-lg rounded-full border border-gray-200 hover:bg-gray-50 transition-all hover:shadow-xl active:scale-95 animate-fade-in"
          aria-label="맨 아래로 스크롤"
        >
          <ChevronDown size={20} className="text-gray-600" />
        </button>
      )}
    </div>
  );
};

