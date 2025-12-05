/**
 * useChatStream Hook
 * 채팅 스트리밍 훅
 *
 * Handles streaming chat responses with AbortController for cancellation.
 * AbortController를 사용하여 취소 가능한 스트리밍 채팅 응답을 처리합니다.
 */

import { useState, useCallback, useRef } from 'react';
import { routeQueryStream, type AgentType } from '../services/intentRouter';
import type { ChatStreamOptions } from '../types/chat';
import type { IntentCategory } from '../types/intent';

interface StreamState {
  isStreaming: boolean;
  streamingContent: string;
  error: Error | null;
}

export function useChatStream() {
  const [streamState, setStreamState] = useState<StreamState>({
    isStreaming: false,
    streamingContent: '',
    error: null,
  });

  // AbortController reference for stream cancellation
  // 스트림 취소를 위한 AbortController 참조
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start streaming a chat message
   * 채팅 메시지 스트리밍 시작
   *
   * @param query - User's query
   * @param options - Stream options including callbacks and user profile
   * @returns Promise with the final response metadata
   */
  const streamMessage = useCallback(
    async (
      query: string,
      options: ChatStreamOptions = {}
    ): Promise<{
      content: string;
      intents: IntentCategory[];
      agents: AgentType[];
      confidence: number;
      isDirectResponse: boolean;
      isEmergency: boolean;
    }> => {
      // Create new AbortController for this stream
      // 이 스트림을 위한 새 AbortController 생성
      abortControllerRef.current = new AbortController();

      // Reset state
      // 상태 초기화
      setStreamState({
        isStreaming: true,
        streamingContent: '',
        error: null,
      });

      try {
        // Call the streaming API
        // 스트리밍 API 호출
        const response = await routeQueryStream(
          query,
          // onChunk callback - update streaming content
          // onChunk 콜백 - 스트리밍 콘텐츠 업데이트
          (content, isComplete) => {
            setStreamState((prev) => ({
              ...prev,
              streamingContent: content,
              isStreaming: !isComplete,
            }));

            // Call user's onChunk callback if provided
            // 사용자의 onChunk 콜백 호출 (제공된 경우)
            if (options.onChunk) {
              options.onChunk(content, isComplete);
            }
          },
          // onError callback
          // onError 콜백
          (error) => {
            // Only set error if not aborted by user
            // 사용자가 중단한 것이 아닌 경우에만 에러 설정
            if (error.name !== 'AbortError') {
              setStreamState((prev) => ({
                ...prev,
                isStreaming: false,
                error,
              }));

              if (options.onError) {
                options.onError(error);
              }
            }
          },
          // User profile
          // 사용자 프로필
          options.userProfile
        );

        return response;
      } catch (error) {
        const err = error as Error;

        // Don't treat AbortError as an actual error
        // AbortError는 실제 에러로 취급하지 않음
        if (err.name === 'AbortError') {
          setStreamState({
            isStreaming: false,
            streamingContent: '',
            error: null,
          });
          throw err; // Re-throw to let caller handle if needed
        }

        setStreamState((prev) => ({
          ...prev,
          isStreaming: false,
          error: err,
        }));

        if (options.onError) {
          options.onError(err);
        }

        throw err;
      } finally {
        abortControllerRef.current = null;
      }
    },
    []
  );

  /**
   * Cancel the current streaming request
   * 현재 스트리밍 요청 취소
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      setStreamState({
        isStreaming: false,
        streamingContent: '',
        error: null,
      });
    }
  }, []);

  /**
   * Reset stream state
   * 스트림 상태 초기화
   */
  const resetStream = useCallback(() => {
    cancelStream();
    setStreamState({
      isStreaming: false,
      streamingContent: '',
      error: null,
    });
  }, [cancelStream]);

  return {
    // State
    isStreaming: streamState.isStreaming,
    streamingContent: streamState.streamingContent,
    error: streamState.error,

    // Actions
    streamMessage,
    cancelStream,
    resetStream,
  };
}
