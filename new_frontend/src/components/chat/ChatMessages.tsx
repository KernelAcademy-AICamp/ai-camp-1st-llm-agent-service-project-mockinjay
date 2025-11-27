/**
 * ChatMessages Component
 * 채팅 메시지 컴포넌트
 *
 * Displays chat messages with streaming support, timestamps, and error handling.
 * 스트리밍 지원, 타임스탬프, 에러 처리가 포함된 채팅 메시지를 표시합니다.
 */

import React, { useEffect, useRef } from 'react';
import { Bot, User as UserIcon, Clock, History, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../../types/chat';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  isSessionExpired: boolean;
  isRestoringHistory: boolean;
  onRestoreHistory: () => void;
  onStartNewConversation: () => void;
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
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll to bottom when new messages arrive
   * 새 메시지가 도착하면 하단으로 스크롤
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

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
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 dark:bg-gray-900">
      {/* Empty State */}
      {messages.length === 0 && !isSessionExpired && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Bot size={64} className="text-primary-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            CareGuide AI와 대화를 시작하세요
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            건강 관련 질문, 영양 상담, 의료 정보 검색 등 무엇이든 물어보세요.
          </p>
        </div>
      )}

      {/* Session Expired State */}
      {messages.length === 0 && isSessionExpired && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Clock className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
          <div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
              세션이 만료되었습니다
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              5분간 활동이 없어 대화가 화면에서 숨겨졌습니다
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={onRestoreHistory}
              disabled={isRestoringHistory || !user?.id}
              className="inline-flex items-center justify-center px-4 py-2 bg-[#00C8B4] text-white rounded-lg hover:bg-[#00b3a1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isRestoringHistory ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  불러오는 중...
                </>
              ) : (
                <>
                  <History className="mr-2 h-4 w-4" />
                  이전 대화 보기
                </>
              )}
            </button>
            <button
              onClick={onStartNewConversation}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
            >
              새 대화 시작
            </button>
          </div>
          {!user?.id && (
            <p className="text-xs text-amber-500 mt-4">
              로그인하면 이전 대화를 복원할 수 있습니다
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
        <div key={dateKey} className="mb-6">
          {/* Date Separator */}
          <div className="flex items-center justify-center mb-4">
            <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
              {dateKey}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-4">
            {dayMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className="max-w-[85%] lg:max-w-[70%] rounded-xl p-3 lg:p-4"
                  style={
                    message.role === 'user'
                      ? {
                          background: 'var(--gradient-primary)',
                          color: 'white',
                          borderRadius: '12px 12px 4px 12px',
                        }
                      : {
                          background: '#F9FAFB',
                          color: 'var(--color-text-primary)',
                          border: '1px solid #E0E0E0',
                          borderRadius: '4px 12px 12px 12px',
                        }
                  }
                >
                  <div className="flex items-start gap-2 lg:gap-3">
                    {/* Avatar */}
                    {message.role === 'assistant' && (
                      <Bot
                        size={18}
                        className="mt-1 flex-shrink-0"
                        style={{ color: 'var(--color-primary)' }}
                      />
                    )}

                    <div className="flex-1 overflow-hidden">
                      {/* Emergency Badge */}
                      {message.isEmergency && (
                        <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-xs font-semibold">
                          🚨 응급 상황 감지됨
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="whitespace-pre-wrap text-xs lg:text-sm break-words overflow-wrap-anywhere word-break-break-word">
                        {message.content}
                      </div>

                      {/* Message Metadata */}
                      <div
                        className={`flex items-center gap-2 mt-2 text-xs ${
                          message.role === 'user'
                            ? 'text-white/70'
                            : 'text-gray-400'
                        }`}
                      >
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {/* {message.agents && message.agents.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="capitalize">
                              {message.agents.join(', ')}
                            </span>
                          </>
                        )} */}
                      </div>

                      {/* Intent Information */}
                      {message.role === 'assistant' &&
                        message.intents &&
                        message.intents.length > 1 && (
                          <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                              복합 의도 감지:
                            </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {message.intents.map((intent) => (
                                <span
                                  key={intent}
                                  className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
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
                      <UserIcon size={20} className="mt-1 flex-shrink-0" />
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
        <div className="flex justify-start mb-4">
          <div
            className="max-w-[85%] lg:max-w-[70%] rounded-xl p-3 lg:p-4"
            style={{
              background: '#F9FAFB',
              color: 'var(--color-text-primary)',
              border: '1px solid #E0E0E0',
              borderRadius: '4px 12px 12px 12px',
            }}
          >
            <div className="flex items-start gap-2 lg:gap-3">
              <Bot
                size={18}
                className="mt-1 flex-shrink-0"
                style={{ color: 'var(--color-primary)' }}
              />
              <div className="flex-1">
                {streamingContent ? (
                  <>
                    <div className="whitespace-pre-wrap text-xs lg:text-sm break-words">
                      {streamingContent}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ background: 'var(--color-primary)' }}
                      />
                      <span>응답 생성 중...</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
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
    </div>
  );
};
