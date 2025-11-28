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
    <div className="flex justify-center my-6 px-4 animate-fade-in">
      <div className="relative bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 shadow-medium max-w-md w-full overflow-hidden group">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/20 z-10"
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        {/* Main content - clickable area */}
        <div
          onClick={handleClick}
          className="cursor-pointer relative z-0"
        >
          <div className="flex items-center gap-5 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3.5 flex-shrink-0 shadow-inner">
              <Trophy className="text-white drop-shadow-sm" size={32} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1.5 flex items-center gap-2">
                오늘의 퀴즈에 도전해보세요!
                <Star className="text-yellow-300 animate-pulse-slow fill-yellow-300" size={18} />
              </h3>
              <p className="text-white/90 text-sm font-medium leading-relaxed">
                퀴즈를 풀고 건강 지식도 쌓고<br/>포인트도 획득하세요
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1 bg-white text-primary text-xs font-bold px-4 py-2 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
              퀴즈 풀러 가기
              <span className="text-lg leading-none">→</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
