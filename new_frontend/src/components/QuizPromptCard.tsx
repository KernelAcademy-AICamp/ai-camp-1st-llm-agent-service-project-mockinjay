/**
 * QuizPromptCard Component - QUI-007
 * Daily Quiz Prompt shown after 4 chat messages
 * 4개의 채팅 메시지 후 표시되는 일일 퀴즈 프롬프트
 */

import React from 'react';
import { Trophy, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuizPromptCardProps {
  onDismiss?: () => void;
}

export const QuizPromptCard: React.FC<QuizPromptCardProps> = ({ onDismiss }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/quiz');
  };

  return (
    <div className="flex justify-center my-4 px-4">
      <div className="relative bg-gradient-to-r from-[#00C8B4] to-[#00a896] rounded-xl p-5 shadow-lg max-w-md w-full animate-fadeIn">
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        )}

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
