import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Star, Clock, ChevronRight, CheckCircle } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';

interface QuizItem {
  id: string;
  title: string;
  description: string;
  questions: number;
  points: number;
  completed: boolean;
  level: string;
  type: 'OX';
}

const quizList: QuizItem[] = [
  {
    id: 'ox-1',
    title: '신장병 기본 상식 O/X',
    description: '만성콩팥병의 정의와 주요 원인에 대해 알아봅니다.',
    questions: 10,
    points: 100,
    completed: true,
    level: '1레벨',
    type: 'OX'
  },
  {
    id: 'ox-2',
    title: '칼륨이 많은 과일 O/X',
    description: '어떤 과일에 칼륨이 많은지 퀴즈로 확인해보세요.',
    questions: 10,
    points: 100,
    completed: false,
    level: '2레벨',
    type: 'OX'
  },
  {
    id: 'ox-3',
    title: '투석 환자 식단 O/X',
    description: '투석 환자에게 올바른 식단인지 O/X로 풀어보세요.',
    questions: 10,
    points: 100,
    completed: false,
    level: '3레벨',
    type: 'OX'
  },
  {
    id: 'ox-4',
    title: '나트륨 섭취 줄이기 O/X',
    description: '일상 생활에서 나트륨을 줄이는 올바른 방법은?',
    questions: 10,
    points: 100,
    completed: false,
    level: '4레벨',
    type: 'OX'
  },
  {
    id: 'ox-5',
    title: '고인산혈증 예방 O/X',
    description: '인 섭취를 줄이기 위한 올바른 식습관 O/X',
    questions: 10,
    points: 100,
    completed: false,
    level: '5레벨',
    type: 'OX'
  }
];

export function QuizListPage() {
  const navigate = useNavigate();
  
  const totalPoints = quizList.reduce((sum, quiz) => sum + (quiz.completed ? quiz.points : 0), 0);
  const completedCount = quizList.filter(q => q.completed).length;
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader 
          title="퀴즈미션" 
          showMenu={true} 
          showProfile={true}
        />
      </div>

      {/* Desktop Header Title Removed from Body */}

      <div className="flex-1 overflow-y-auto p-5 lg:p-10 pb-24 lg:pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 rounded-xl border border-[#E0E0E0] bg-white" style={{ boxShadow: 'none' }}>
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={20} className="text-[#00C9B7]" strokeWidth={2} />
                <span className="text-sm text-[#666666] font-medium">완료한 퀴즈</span>
              </div>
              <div className="text-2xl font-bold text-[#1F2937]">
                {completedCount}<span className="text-base font-normal text-[#999999]">/{quizList.length}</span>
              </div>
            </div>
            
            <div className="p-5 rounded-xl border border-[#E0E0E0] bg-white" style={{ boxShadow: 'none' }}>
              <div className="flex items-center gap-2 mb-2">
                <Star size={20} className="text-[#FFB84D]" strokeWidth={2} />
                <span className="text-sm text-[#666666] font-medium">지식 레벨</span>
              </div>
              <div className="text-2xl font-bold text-[#1F2937]">
                레벨 {completedCount > 0 ? completedCount : 1}
              </div>
            </div>
            
            <div className="p-5 rounded-xl border border-[#E0E0E0] bg-white" style={{ boxShadow: 'none' }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={20} className="text-[#9F7AEA]" strokeWidth={2} />
                <span className="text-sm text-[#666666] font-medium">획득 포인트</span>
              </div>
              <div className="text-2xl font-bold text-[#9F7AEA]">
                {totalPoints}P
              </div>
            </div>
          </div>
          
          {/* Quiz List Title - Kept as section title */}
          <h2 className="text-lg font-bold text-[#1F2937] mb-4">O/X 퀴즈</h2>
          
          {/* Quiz List */}
          <div className="grid gap-4">
            {quizList.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => navigate(`/quiz/${quiz.id}`)}
                className="w-full text-left p-5 rounded-xl border border-[#E0E0E0] bg-white hover:bg-gray-50 transition-colors relative group"
                style={{ boxShadow: 'none' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-[16px] font-bold text-[#1F2937]">
                        {quiz.title}
                      </h3>
                      {quiz.completed && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E6F9F7] text-[#00C9B7] text-[11px] font-medium">
                          <CheckCircle size={12} strokeWidth={2} />
                          완료
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#666666] mb-3 leading-relaxed">
                      {quiz.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-1 rounded-md bg-[#F2FFFD] text-[#00C9B7] font-medium">
                        {quiz.level}
                      </span>
                      <span className="text-[#999999]">
                        문제 {quiz.questions}개
                      </span>
                      <span className="flex items-center gap-1 text-[#9F7AEA] font-medium">
                        <Star size={12} strokeWidth={2} />
                        {quiz.points}P
                      </span>
                    </div>
                  </div>
                  <ChevronRight 
                    size={24} 
                    className="text-[#CCCCCC] group-hover:text-[#00C9B7] transition-colors" 
                    strokeWidth={2} 
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
