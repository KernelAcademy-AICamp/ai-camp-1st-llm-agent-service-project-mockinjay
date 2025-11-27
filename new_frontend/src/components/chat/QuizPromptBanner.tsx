/**
 * QuizPromptBanner Component - QUI-007
 * Banner that prompts users to take daily quiz after 4 chat messages
 * 4개의 채팅 메시지 후 일일 퀴즈를 권장하는 배너
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../utils/storage';

const QUIZ_PROMPT_DISMISSED_KEY = 'careguide_quiz_prompt_dismissed';
const QUIZ_PROMPT_SHOWN_DATE_KEY = 'careguide_quiz_prompt_shown_date';

interface QuizPromptBannerProps {
  userMessageCount: number;
}

export const QuizPromptBanner: React.FC<QuizPromptBannerProps> = ({ userMessageCount }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if quiz prompt should be shown
    const isDismissed = storage.get<boolean>(QUIZ_PROMPT_DISMISSED_KEY);
    const lastShownDate = storage.get<string>(QUIZ_PROMPT_SHOWN_DATE_KEY);
    const today = new Date().toDateString();

    // Reset dismissal if it's a new day
    if (lastShownDate && lastShownDate !== today) {
      storage.remove(QUIZ_PROMPT_DISMISSED_KEY);
    }

    // Show prompt if:
    // 1. User has sent 4 or more messages
    // 2. Not dismissed today
    // 3. First time showing today (reset daily)
    if (userMessageCount >= 4 && !isDismissed) {
      setIsVisible(true);
      storage.set(QUIZ_PROMPT_SHOWN_DATE_KEY, today);
    }
  }, [userMessageCount]);

  const handleClick = () => {
    navigate('/quiz');
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    storage.set(QUIZ_PROMPT_DISMISSED_KEY, true);
  };

  if (!isVisible) return null;

  return (
    <div className="flex justify-center my-4 px-4 animate-fadeIn">
      <div className="relative bg-gradient-to-r from-[#00C8B4] to-[#00a896] rounded-xl p-5 shadow-lg max-w-md w-full">
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        {/* Main content - clickable area */}
        <div
          onClick={handleClick}
          className="cursor-pointer hover:scale-[1.02] transition-transform duration-200"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white/20 rounded-full p-3 flex-shrink-0">
              <Trophy className="text-white" size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                오늘의 퀴즈에 도전해보세요!
                <Star className="text-yellow-300 animate-pulse" size={18} />
              </h3>
              <p className="text-white/90 text-sm">
                퀴즈를 풀고 포인트를 획득하세요
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-4">
            <span className="inline-block bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-white/30 transition-colors">
              클릭하여 시작하기 →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
