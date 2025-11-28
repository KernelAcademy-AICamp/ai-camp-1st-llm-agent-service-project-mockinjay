import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

export function KidneyDiseaseStagePage() {
  const navigate = useNavigate();
  
  // This would come from user profile data
  const [diseaseInfo, setDiseaseInfo] = useState<string>('만성신장병 3기');
  
  const diseaseOptions = [
    '만성신장병 1기',
    '만성신장병 2기',
    '만성신장병 3기',
    '만성신장병 4기',
    '만성신장병 5기',
    '혈액투석',
    '복막투석',
    '신장 이식 후 관리',
    '해당 사항 없음'
  ];

  const handleDiseaseToggle = (option: string) => {
    setDiseaseInfo(option);
  };

  const handleSave = () => {
    alert('질환 정보가 수정되었습니다.');
    navigate('/mypage/profile');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-white)' }}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: '#E5E7EB' }}>
        <button
          onClick={() => navigate('/mypage/profile')}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={24} />
        </button>
        
        <h2 style={{ color: 'var(--color-text-primary)' }}>질환 단계</h2>
        
        <div style={{ width: '24px' }} />
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          <div className="space-y-6">
            <div>
              <h2 className="mb-2" style={{ color: 'var(--color-text-primary)' }}>
                병원에서 만성신장병 진단을 받으셨나요?
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                해당하는 항목을 선택해주세요.
              </p>
            </div>

            <div className="space-y-3">
              {diseaseOptions.map((option) => {
                const isSelected = diseaseInfo === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleDiseaseToggle(option)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl transition-all"
                    style={{
                      background: isSelected ? '#E6F9F7' : 'var(--color-bg-input)',
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'transparent'}`
                    }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: isSelected ? 'var(--color-primary)' : '#E5E7EB'
                      }}
                    >
                      {isSelected && <Check size={16} color="white" />}
                    </div>
                    <span 
                      className="flex-1 text-left"
                      style={{ 
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                        fontWeight: isSelected ? '600' : '400'
                      }}
                    >
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full mt-8 py-4 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)'
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
