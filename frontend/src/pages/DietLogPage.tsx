import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface DietGoal {
  potassium?: number;
  phosphorus?: number;
  protein?: number;
  calories?: number;
  goal: string;
}

interface MealLog {
  id: string;
  date: Date;
  mealType: string;
  foods: string;
  nutrients: {
    potassium: number;
    phosphorus: number;
    protein: number;
    calories: number;
  };
}

export function DietLogPage() {
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [_showLogModal, setShowLogModal] = useState(false);
  const [_editingLog, setEditingLog] = useState<MealLog | null>(null);
  
  const [dietGoal, setDietGoal] = useState<DietGoal>({
    goal: '저칼륨 섭취',
    potassium: 2000,
    phosphorus: 1000,
    protein: 60,
    calories: 1800
  });
  
  const [mealLogs, setMealLogs] = useState<MealLog[]>([
    {
      id: '1',
      date: new Date(),
      mealType: '아침',
      foods: '현미밥, 계란찜, 오이무침',
      nutrients: {
        potassium: 450,
        phosphorus: 280,
        protein: 18,
        calories: 420
      }
    },
    {
      id: '2',
      date: new Date(),
      mealType: '점심',
      foods: '쌀국수, 닭가슴살 샐러드',
      nutrients: {
        potassium: 380,
        phosphorus: 310,
        protein: 25,
        calories: 480
      }
    }
  ]);
  
  const totalNutrients = mealLogs.reduce((acc, log) => ({
    potassium: acc.potassium + log.nutrients.potassium,
    phosphorus: acc.phosphorus + log.nutrients.phosphorus,
    protein: acc.protein + log.nutrients.protein,
    calories: acc.calories + log.nutrients.calories
  }), { potassium: 0, phosphorus: 0, protein: 0, calories: 0 });
  
  const handleDeleteLog = (id: string) => {
    if (confirm('이 식단 기록을 삭제하시겠습니까?')) {
      setMealLogs(prev => prev.filter(log => log.id !== id));
    }
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto pb-24 lg:pb-6">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 style={{ color: 'var(--color-text-primary)' }}>식단 로그</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            나의 식사 기록 관리
          </p>
        </div>
        <button
          onClick={() => setShowGoalModal(true)}
          className="btn-secondary"
        >
          목표 설정
        </button>
      </div>
      
      {/* Diet Goal Summary */}
      <div className="card mb-6">
        <h3 className="mb-4" style={{ color: 'var(--color-text-primary)' }}>
          📊 오늘의 영양소 섭취 현황
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: '칼륨', current: totalNutrients.potassium, goal: dietGoal.potassium, unit: 'mg', color: '#FF6B6B' },
            { label: '인', current: totalNutrients.phosphorus, goal: dietGoal.phosphorus, unit: 'mg', color: '#4ECDC4' },
            { label: '단백질', current: totalNutrients.protein, goal: dietGoal.protein, unit: 'g', color: '#9F7AEA' },
            { label: '열량', current: totalNutrients.calories, goal: dietGoal.calories, unit: 'kcal', color: '#FFB84D' }
          ].map((item) => {
            const percentage = item.goal ? (item.current / item.goal) * 100 : 0;
            return (
              <div key={item.label}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {item.label}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.current}/{item.goal} {item.unit}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ background: 'var(--color-line-3)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`,
                      background: item.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Meal Logs */}
      <div className="space-y-4">
        <h3 style={{ color: 'var(--color-text-primary)' }}>식사 기록</h3>
        
        {mealLogs.map((log) => (
          <div key={log.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 style={{ color: 'var(--color-text-primary)' }}>{log.mealType}</h4>
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  {log.date.toLocaleDateString('ko-KR')} {log.date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => {
                    setEditingLog(log);
                    setShowLogModal(true);
                  }}
                >
                  <Edit size={18} color="var(--color-text-secondary)" />
                </button>
                <button 
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  onClick={() => handleDeleteLog(log.id)}
                >
                  <Trash2 size={18} color="#FF6B6B" />
                </button>
              </div>
            </div>
            
            <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              {log.foods}
            </p>
            
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <span style={{ color: 'var(--color-text-tertiary)' }}>칼륨</span>
                <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {log.nutrients.potassium}mg
                </p>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-tertiary)' }}>인</span>
                <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {log.nutrients.phosphorus}mg
                </p>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-tertiary)' }}>단백질</span>
                <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {log.nutrients.protein}g
                </p>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-tertiary)' }}>열량</span>
                <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {log.nutrients.calories}kcal
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Floating Add Button (Mobile) */}
      <button
        onClick={() => {
          setEditingLog(null);
          setShowLogModal(true);
        }}
        className="fixed bottom-20 right-6 lg:bottom-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 hover:scale-110 transition-transform"
        style={{ background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)' }}
      >
        <Plus size={24} color="white" />
      </button>
      
      {/* Goal Modal */}
      {showGoalModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGoalModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4">식단 목표 설정</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  목표 선택
                </label>
                <select 
                  className="input-field w-full"
                  value={dietGoal.goal}
                  onChange={(e) => setDietGoal({ ...dietGoal, goal: e.target.value })}
                >
                  <option>저칼륨 섭취</option>
                  <option>저인 섭취</option>
                  <option>저단백질 섭취</option>
                  <option>저콜레스테롤 섭취</option>
                  <option>체중 증량</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    칼륨 (mg)
                  </label>
                  <input 
                    type="number"
                    className="input-field w-full"
                    value={dietGoal.potassium}
                    onChange={(e) => setDietGoal({ ...dietGoal, potassium: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    인 (mg)
                  </label>
                  <input 
                    type="number"
                    className="input-field w-full"
                    value={dietGoal.phosphorus}
                    onChange={(e) => setDietGoal({ ...dietGoal, phosphorus: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    단백질 (g)
                  </label>
                  <input 
                    type="number"
                    className="input-field w-full"
                    value={dietGoal.protein}
                    onChange={(e) => setDietGoal({ ...dietGoal, protein: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    열량 (kcal)
                  </label>
                  <input 
                    type="number"
                    className="input-field w-full"
                    value={dietGoal.calories}
                    onChange={(e) => setDietGoal({ ...dietGoal, calories: Number(e.target.value) })}
                  />
                </div>
              </div>
              
              <button 
                className="btn-primary w-full"
                onClick={() => setShowGoalModal(false)}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
