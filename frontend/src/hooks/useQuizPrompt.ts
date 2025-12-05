/**
 * useQuizPrompt Hook - QUI-007
 * Tracks user messages and shows quiz prompt after 4 messages
 * 사용자 메시지를 추적하고 4개 메시지 후 퀴즈 프롬프트 표시
 */

import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const QUIZ_PROMPT_KEY = 'careguide_quiz_prompt_shown';
const MESSAGE_COUNT_KEY = 'careguide_user_message_count';

export const useQuizPrompt = (_currentMessageCount: number) => {
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(() => {
    return storage.get<number>(MESSAGE_COUNT_KEY) || 0;
  });

  useEffect(() => {
    // Update message count in storage
    storage.set(MESSAGE_COUNT_KEY, userMessageCount);

    // Check if we should show quiz prompt
    const promptShown = storage.get<boolean>(QUIZ_PROMPT_KEY);
    if (userMessageCount >= 4 && !promptShown && !showQuizPrompt) {
      setShowQuizPrompt(true);
    }
  }, [userMessageCount, showQuizPrompt]);

  const incrementMessageCount = () => {
    setUserMessageCount((prev) => prev + 1);
  };

  const dismissQuizPrompt = () => {
    setShowQuizPrompt(false);
    storage.set(QUIZ_PROMPT_KEY, true);
  };

  const resetMessageCount = () => {
    setUserMessageCount(0);
    storage.remove(MESSAGE_COUNT_KEY);
    storage.remove(QUIZ_PROMPT_KEY);
  };

  return {
    showQuizPrompt,
    userMessageCount,
    incrementMessageCount,
    dismissQuizPrompt,
    resetMessageCount,
  };
};
