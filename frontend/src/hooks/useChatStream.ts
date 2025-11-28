/**
 * useChatStream Hook
 * 채팅 스트리밍 훅
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

  const abortControllerRef = useRef<AbortController | null>(null);

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
      abortControllerRef.current = new AbortController();

      setStreamState({
        isStreaming: true,
        streamingContent: '',
        error: null,
      });

      try {
        const response = await routeQueryStream(
          query,
          (content, isComplete) => {
            setStreamState((prev) => ({
              ...prev,
              streamingContent: content,
              isStreaming: !isComplete,
            }));

            if (options.onChunk) {
              options.onChunk(content, isComplete);
            }
          },
          (error) => {
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
          options.userProfile
        );

        return response;
      } catch (error) {
        const err = error as Error;

        if (err.name === 'AbortError') {
          setStreamState({
            isStreaming: false,
            streamingContent: '',
            error: null,
          });
          throw err;
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

  const resetStream = useCallback(() => {
    cancelStream();
    setStreamState({
      isStreaming: false,
      streamingContent: '',
      error: null,
    });
  }, [cancelStream]);

  return {
    isStreaming: streamState.isStreaming,
    streamingContent: streamState.streamingContent,
    error: streamState.error,
    streamMessage,
    cancelStream,
    resetStream,
  };
}
