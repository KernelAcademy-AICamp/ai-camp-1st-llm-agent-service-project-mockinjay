import React, { useState } from 'react';
import { X, Check, XIcon, AlertCircle } from 'lucide-react';
import type { QuizQuestion } from '../services/quizApi';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuizQuestion;
  currentQuestionNumber: number;
  totalQuestions: number;
  score: number;
  onSubmitAnswer: (answer: boolean) => Promise<void>;
}

const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  question,
  currentQuestionNumber,
  totalQuestions,
  score,
  onSubmitAnswer,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!isOpen) return null;

  const handleAnswerSelect = (answer: boolean) => {
    if (showFeedback) return; // Don't allow changing answer after submission
    setSelectedAnswer(answer);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const correct = selectedAnswer === question.answer;
      setIsCorrect(correct);
      setShowFeedback(true);

      // Wait 2 seconds to show feedback, then submit to backend
      setTimeout(async () => {
        await onSubmitAnswer(selectedAnswer);
        // Reset for next question
        setSelectedAnswer(null);
        setShowFeedback(false);
        setIsCorrect(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      easy: '쉬움',
      medium: '보통',
      hard: '어려움',
    };
    return labels[difficulty] || difficulty;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      nutrition: '영양',
      treatment: '치료',
      lifestyle: '생활습관',
    };
    return labels[category] || category;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-careplus-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="badge badge-level">
              {currentQuestionNumber}/{totalQuestions}
            </span>
            <span className="badge bg-primary-100 text-primary-600">
              {getCategoryLabel(question.category)}
            </span>
            <span className="badge bg-amber-100 text-amber-600">
              {getDifficultyLabel(question.difficulty)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-primary-600">점수: {score}P</span>
            <button
              onClick={onClose}
              className="text-careplus-text-muted hover:text-careplus-text-primary"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentQuestionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-careplus-text-primary mb-6">
            {question.question}
          </h2>

          {/* Answer Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleAnswerSelect(true)}
              disabled={showFeedback}
              className={`
                p-6 rounded-xl border-2 transition-all
                ${
                  selectedAnswer === true
                    ? showFeedback
                      ? isCorrect
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-primary-500 bg-primary-50'
                    : 'border-careplus-border hover:border-primary-300'
                }
                ${showFeedback ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <Check size={32} className={selectedAnswer === true ? 'text-primary-600' : 'text-gray-400'} />
                <span className="text-lg font-semibold">O (맞음)</span>
              </div>
            </button>

            <button
              onClick={() => handleAnswerSelect(false)}
              disabled={showFeedback}
              className={`
                p-6 rounded-xl border-2 transition-all
                ${
                  selectedAnswer === false
                    ? showFeedback
                      ? isCorrect
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-primary-500 bg-primary-50'
                    : 'border-careplus-border hover:border-primary-300'
                }
                ${showFeedback ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <XIcon size={32} className={selectedAnswer === false ? 'text-primary-600' : 'text-gray-400'} />
                <span className="text-lg font-semibold">X (틀림)</span>
              </div>
            </button>
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div
              className={`
                p-4 rounded-xl mb-6
                ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}
              `}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={24}
                  className={isCorrect ? 'text-emerald-600' : 'text-red-600'}
                />
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-2 ${
                      isCorrect ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {isCorrect ? '정답입니다!' : '오답입니다'}
                  </h3>
                  <p className="text-sm text-careplus-text-secondary">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!showFeedback && (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? '제출 중...' : '답변 제출'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
