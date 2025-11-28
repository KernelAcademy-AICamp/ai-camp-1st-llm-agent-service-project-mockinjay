import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ChevronRight } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'account' | 'personal' | 'medical'>('account');
  
  const [accountInfo, setAccountInfo] = useState({
    email: 'gildong@example.com',
    password: '••••••••',
    userType: '환우'
  });
  
  const [personalInfo, setPersonalInfo] = useState({
    nickname: '홍길동',
    gender: '남성',
    birthdate: '1980-01-01',
    weight: 70,
    height: 175,
    ethnicity: '동아시아'
  });
  
  const tabs = [
    { id: 'account' as const, label: '계정정보' },
    { id: 'personal' as const, label: '개인정보' },
    { id: 'medical' as const, label: '질환 단계' }
  ];
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 style={{ color: 'var(--color-text-primary)' }}>프로필</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          내 정보 관리
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'var(--color-line-2)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === tab.id 
                ? 'border-b-2 text-[var(--color-primary)]' 
                : 'text-[var(--color-text-tertiary)]'
            }`}
            style={{
              borderColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Account Info Tab */}
      {activeTab === 'account' && (
        <div className="card space-y-4">
          <div>
            <label className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
              이메일
            </label>
            <input
              type="email"
              value={accountInfo.email}
              onChange={(e) => setAccountInfo({ ...accountInfo, email: e.target.value })}
              className="input-field w-full"
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
              비밀번호
            </label>
            <input
              type="password"
              value={accountInfo.password}
              onChange={(e) => setAccountInfo({ ...accountInfo, password: e.target.value })}
              className="input-field w-full"
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
              사용자 유형
            </label>
            <select
              value={accountInfo.userType}
              onChange={(e) => setAccountInfo({ ...accountInfo, userType: e.target.value })}
              className="input-field w-full"
            >
              <option>일반인</option>
              <option>환우</option>
              <option>연구자</option>
            </select>
          </div>
          
          <button className="btn-primary w-full flex items-center justify-center gap-2">
            <Save size={20} />
            저장
          </button>
        </div>
      )}
      
      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <div className="card space-y-4">
          <div>
            <label className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
              닉네임
            </label>
            <input
              type="text"
              value={personalInfo.nickname}
              onChange={(e) => setPersonalInfo({ ...personalInfo, nickname: e.target.value })}
              className="input-field w-full"
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                성별
              </label>
              <select
                value={personalInfo.gender}
                onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                className="input-field w-full"
              >
                <option>남성</option>
                <option>여성</option>
                <option>기타</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                생년월일
              </label>
              <input
                type="date"
                value={personalInfo.birthdate}
                onChange={(e) => setPersonalInfo({ ...personalInfo, birthdate: e.target.value })}
                className="input-field w-full"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                체중 (kg)
              </label>
              <input
                type="number"
                value={personalInfo.weight}
                onChange={(e) => setPersonalInfo({ ...personalInfo, weight: Number(e.target.value) })}
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                키 (cm)
              </label>
              <input
                type="number"
                value={personalInfo.height}
                onChange={(e) => setPersonalInfo({ ...personalInfo, height: Number(e.target.value) })}
                className="input-field w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
              인종
            </label>
            <select
              value={personalInfo.ethnicity}
              onChange={(e) => setPersonalInfo({ ...personalInfo, ethnicity: e.target.value })}
              className="input-field w-full"
            >
              <option>동아시아</option>
              <option>남아시아</option>
              <option>서아시아</option>
              <option>유럽</option>
              <option>아프리카</option>
              <option>라틴아메리카</option>
              <option>기타</option>
            </select>
          </div>
          
          <button className="btn-primary w-full flex items-center justify-center gap-2">
            <Save size={20} />
            저장
          </button>
        </div>
      )}
      
      {/* Medical Info Tab */}
      {activeTab === 'medical' && (
        <div className="space-y-4">
          <button
            onClick={() => navigate('/mypage/profile/kidney-disease-stage')}
            className="w-full card text-left hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 style={{ color: 'var(--color-text-primary)' }}>질환 단계</h4>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  만성신장병 단계 정보
                </p>
              </div>
              <ChevronRight size={20} color="var(--color-text-tertiary)" />
            </div>
          </button>
          
          <div className="card">
            <h4 className="mb-4" style={{ color: 'var(--color-text-primary)' }}>
              병원검사결과 (선택사항)
            </h4>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    혈압 (mmHg)
                  </label>
                  <input type="text" placeholder="120/80" className="input-field w-full" />
                </div>
                <div>
                  <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    크레아티닌 (mg/dL)
                  </label>
                  <input type="number" step="0.1" placeholder="1.0" className="input-field w-full" />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    칼륨 (mEq/L)
                  </label>
                  <input type="number" step="0.1" placeholder="4.0" className="input-field w-full" />
                </div>
                <div>
                  <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    인 (mg/dL)
                  </label>
                  <input type="number" step="0.1" placeholder="3.5" className="input-field w-full" />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    단백질 (g/dL)
                  </label>
                  <input type="number" step="0.1" placeholder="7.0" className="input-field w-full" />
                </div>
                <div>
                  <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    콜레스테롤 (mg/dL)
                  </label>
                  <input type="number" placeholder="200" className="input-field w-full" />
                </div>
              </div>
              
              <div>
                <label className="block mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  eGFR (mL/min/1.73m²)
                </label>
                <input type="number" placeholder="60" className="input-field w-full" />
              </div>
              
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <Save size={20} />
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
