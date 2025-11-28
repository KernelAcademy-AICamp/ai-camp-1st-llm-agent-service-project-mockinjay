import React, { useState } from 'react';
import { Trophy, Star, CheckCircle, XCircle } from 'lucide-react';

interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

const quizzes: Quiz[] = [
  {
    id: '1',
    question: '신장병 환자가 피해야 할 고칼륨 식품은?',
    options: ['사과', '바나나', '배', '수박'],
    correctAnswer: 1,
    explanation: '바나나는 칼륨 함량이 높아 신장병 환자는 섭취를 제한해야 합니다.',
    points: 10
  },
  {
    id: '2',
    question: '신장 건강을 위해 하루 권장 수분 섭취량은?',
    options: ['500ml', '1000ml', '1500ml', '개인별 상담 필요'],
    correctAnswer: 3,
    explanation: '신장병 환자의 수분 섭취량은 질환 단계와 개인 상태에 따라 다르므로 의료진과 상담이 필요합니다.',
    points: 10
  },
  {
    id: '3',
    question: '다음 중 저인 식품이 아닌 것은?',
    options: ['쌀밥', '사과', '치즈', '양배추'],
    correctAnswer: 2,
    explanation: '치즈는 인 함량이 높은 유제품으로 신장병 환자는 섭취를 제한해야 합니다.',
    points: 10
  }
];

export function QuizPage() {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  
  const currentQuiz = quizzes[currentQuizIndex];
  const isCorrect = selectedAnswer === currentQuiz.correctAnswer;
  
  const handleAnswer = (optionIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    setShowResult(true);
    
    if (optionIndex === currentQuiz.correctAnswer) {
      setScore(prev => prev + 1);
      setTotalPoints(prev => prev + currentQuiz.points);
    }
    
    setCompletedQuizzes(prev => new Set(prev).add(currentQuiz.id));
  };
  
  const handleNext = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };
  
  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Score Header */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 style={{ color: 'var(--color-text-primary)' }}>퀴즈 미션</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              건강 지식을 테스트하고 포인트를 획득하세요
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <Trophy size={20} color="var(--color-primary)" />
              <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {score}/{quizzes.length}
              </span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Star size={16} color="var(--color-accent-purple)" />
              <span className="font-medium" style={{ color: 'var(--color-accent-purple)' }}>
                {totalPoints} 포인트
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            진행 상황
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {currentQuizIndex + 1} / {quizzes.length}
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: 'var(--color-line-3)' }}>
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${((currentQuizIndex + 1) / quizzes.length) * 100}%`,
              background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)'
            }}
          />
        </div>
      </div>
      
      {/* Quiz Card */}
      <div className="card">
        <div className="mb-6">
          <div 
            className="inline-block px-3 py-1 rounded-lg mb-3"
            style={{ background: 'var(--color-bg-input)', color: 'var(--color-primary)' }}
          >
            <span className="text-sm font-medium">{currentQuiz.points} 포인트</span>
          </div>
          <h3 className="mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {currentQuiz.question}
          </h3>
        </div>
        
        <div className="space-y-3 mb-6">
          {currentQuiz.options.map((option, index) => {
            let buttonStyle = 'border-2 transition-all duration-200';
            let iconColor = 'var(--color-text-tertiary)';
            let icon = null;
            
            if (showResult) {
              if (index === currentQuiz.correctAnswer) {
                buttonStyle += ' border-green-500 bg-green-50';
                icon = <CheckCircle size={20} color="#10B981" />;
              } else if (index === selectedAnswer) {
                buttonStyle += ' border-red-500 bg-red-50';
                icon = <XCircle size={20} color="#EF4444" />;
              } else {
                buttonStyle += ' border-gray-200 opacity-50';
              }
            } else {
              buttonStyle += ' border-gray-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-input)]';
            }
            
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl text-left flex items-center justify-between ${buttonStyle}`}
              >
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {option}
                </span>
                {icon}
              </button>
            );
          })}
        </div>
        
        {showResult && (
          <div 
            className="p-4 rounded-xl mb-4"
            style={{ 
              background: isCorrect ? '#F0FDF4' : '#FEF2F2',
              border: `2px solid ${isCorrect ? '#10B981' : '#EF4444'}`
            }}
          >
            <h4 className="mb-2" style={{ color: isCorrect ? '#10B981' : '#EF4444' }}>
              {isCorrect ? '✅ 정답입니다!' : '❌ 틀렸습니다'}
            </h4>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {currentQuiz.explanation}
            </p>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentQuizIndex === 0}
            className="btn-secondary flex-1"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={!showResult || currentQuizIndex === quizzes.length - 1}
            className="btn-primary flex-1"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
