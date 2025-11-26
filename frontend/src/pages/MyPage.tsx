import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Check, Save, FileText, LogOut, XCircle } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';
import { useLayout } from '../components/LayoutContext';

export function MyPage() {
  const navigate = useNavigate();
  const { logout } = useLayout();
  const [activeTab, setActiveTab] = useState<'account' | 'personal' | 'disease'>('personal');
  
  // Form States
  const [accountInfo, setAccountInfo] = useState({
    email: 'gildong@example.com',
    password: 'password123'
  });

  const [personalInfo, setPersonalInfo] = useState({
    nickname: '홍길동',
    gender: '남성',
    birthDate: '1980. 01. 01.',
    weight: '70',
    height: '175',
    race: '동아시아'
  });

  const [diseaseStage, setDiseaseStage] = useState('만성신장병 3기');

  const handleLogout = () => {
    logout();
    navigate('/main');
  };

  const TabButton = ({ id, label }: { id: 'account' | 'personal' | 'disease', label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
        activeTab === id ? 'text-[#00C9B7] font-bold' : 'text-[#9CA3AF]'
      }`}
    >
      {label}
      {activeTab === id && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#9F7AEA]" />
      )}
    </button>
  );

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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader 
          title="마이페이지" 
          showProfile={false}
          showMenu={false}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full">
          
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1F2937] mb-1">프로필</h1>
            <p className="text-sm text-[#6B7280]">내 정보 관리</p>
          </div>

          {/* Tabs - Consistent with DietCarePage */}
          <div className="flex border-b border-[#E5E7EB] mb-8">
            <TabButton id="account" label="계정정보" />
            <TabButton id="personal" label="개인정보" />
            <TabButton id="disease" label="질환 단계" />
          </div>

          {/* Content Area */}
          <div className="bg-white mb-10">
            {activeTab === 'account' && (
               <div className="border border-[#E5E7EB] rounded-xl p-6 space-y-6">
                 <div>
                   <label className="block text-sm font-bold text-[#374151] mb-2">이메일</label>
                   <div className="flex gap-2">
                     <input 
                       type="email" 
                       value={accountInfo.email}
                       readOnly
                       className="flex-1 p-4 rounded-xl border border-[#E5E7EB] bg-gray-50 text-[#9CA3AF] outline-none"
                     />
                     <button className="px-4 rounded-xl bg-[#3B82F6] text-white font-bold text-sm whitespace-nowrap">
                       인증완료
                     </button>
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-[#374151] mb-2">비밀번호</label>
                   <input 
                     type="password" 
                     value={accountInfo.password}
                     onChange={(e) => setAccountInfo({...accountInfo, password: e.target.value})}
                     className="w-full p-4 rounded-xl border border-[#E5E7EB] focus:border-[#00C9B7] outline-none transition-colors"
                   />
                 </div>
                 <button className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-2" style={{ background: 'linear-gradient(90deg, #00C9B7 0%, #7C3AED 100%)' }}>
                   저장
                 </button>
               </div>
            )}

            {activeTab === 'personal' && (
              <div className="border border-[#E5E7EB] rounded-xl p-6">
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-[#374151] mb-2">닉네임</label>
                    <input 
                      type="text" 
                      value={personalInfo.nickname}
                      onChange={(e) => setPersonalInfo({...personalInfo, nickname: e.target.value})}
                      placeholder="닉네임을 입력하세요"
                      className="w-full p-4 rounded-xl border border-[#E5E7EB] focus:border-[#00C9B7] outline-none transition-colors"
                    />
                  </div>
                  
                  {/* Gender - Segmented Control Style */}
                  <div>
                    <label className="block text-sm font-bold text-[#374151] mb-2">성별</label>
                    <div className="flex gap-3">
                       {['남성', '여성', '기타'].map((gender) => (
                         <button
                           key={gender}
                           onClick={() => setPersonalInfo({...personalInfo, gender})}
                           className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                             personalInfo.gender === gender 
                               ? 'bg-[#E0F7FA] text-[#00C9B7] font-bold' 
                               : 'bg-[#F8FAFC] text-[#4B5563]'
                           }`}
                         >
                           {gender}
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Race */}
                  <div>
                    <label className="block text-sm font-bold text-[#374151] mb-2">인종</label>
                    <input 
                      type="text" 
                      value={personalInfo.race}
                      onChange={(e) => setPersonalInfo({...personalInfo, race: e.target.value})}
                      className="w-full p-4 rounded-xl border border-[#E5E7EB] focus:border-[#00C9B7] outline-none transition-colors"
                      placeholder="인종을 선택하세요" // Placeholder to act like the select/input hybrid in wireframe
                    />
                  </div>

                  {/* Birthdate */}
                  <div>
                      <label className="block text-sm font-bold text-[#374151] mb-2">생년월일</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={personalInfo.birthDate}
                          onChange={(e) => setPersonalInfo({...personalInfo, birthDate: e.target.value})}
                          className="w-full p-4 rounded-xl border border-[#E5E7EB] focus:border-[#00C9B7] outline-none transition-colors pr-10"
                        />
                        <Calendar size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]" />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#374151] mb-2">키 (cm)</label>
                      <input 
                        type="number" 
                        value={personalInfo.height}
                        onChange={(e) => setPersonalInfo({...personalInfo, height: e.target.value})}
                        className="w-full p-4 rounded-xl border border-[#E5E7EB] focus:border-[#00C9B7] outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#374151] mb-2">체중 (kg)</label>
                      <input 
                        type="number" 
                        value={personalInfo.weight}
                        onChange={(e) => setPersonalInfo({...personalInfo, weight: e.target.value})}
                        className="w-full p-4 rounded-xl border border-[#E5E7EB] focus:border-[#00C9B7] outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-2" style={{ background: 'linear-gradient(90deg, #00C9B7 0%, #7C3AED 100%)' }}>
                  저장
                </button>
              </div>
            )}

            {activeTab === 'disease' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-[#1F2937] mb-2">병원에서 만성신장병 진단을 받으셨나요?</h2>
                  <p className="text-sm text-[#6B7280]">해당하는 항목을 선택해주세요.</p>
                </div>

                <div className="space-y-4">
                  {diseaseOptions.map((option) => (
                    <div 
                      key={option}
                      onClick={() => setDiseaseStage(option)}
                      className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border ${
                        diseaseStage === option ? 'bg-[#E0F7FA] border-[#00C9B7]' : 'bg-white border-transparent hover:bg-gray-50'
                      }`}
                    >
                       <div className={`w-6 h-6 rounded-full mr-4 flex items-center justify-center border ${
                         diseaseStage === option ? 'bg-[#00C9B7] border-[#00C9B7]' : 'bg-[#E5E7EB] border-transparent'
                       }`}>
                         {diseaseStage === option && <Check size={14} color="white" strokeWidth={3} />}
                       </div>
                       <span className={`text-lg ${
                         diseaseStage === option ? 'text-[#00C9B7] font-bold' : 'text-[#374151]'
                       }`}>
                         {option}
                       </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                   <button className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-2" style={{ background: 'linear-gradient(90deg, #00C9B7 0%, #7C3AED 100%)' }}>
                     저장
                   </button>
                </div>
              </div>
            )}
          </div>

          {/* Hospital Test Results Menu */}
          <div className="border-t border-[#F3F4F6] pt-6 mb-8">
            <button 
              onClick={() => navigate('/mypage/test-results')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-[#E5E7EB] hover:bg-gray-50 transition-colors mb-6"
            >
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-[#00C9B7]" />
                <span className="text-base font-medium text-[#1F2937]">병원검사결과</span>
              </div>
              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <span className="text-sm">자세히 보기</span>
                <Check size={16} className="rotate-180" /> 
              </div>
            </button>
            
            {/* Logout / Withdrawal Buttons */}
            <div className="space-y-3">
               <button 
                 onClick={handleLogout}
                 className="w-full py-3 flex items-center justify-center gap-2 text-[#4B5563] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
               >
                 <LogOut size={18} />
                 로그아웃
               </button>
               <button 
                 onClick={() => {
                    logout();
                    navigate('/main');
                 }}
                 className="w-full py-3 flex items-center justify-center gap-2 text-[#EF4444] text-sm hover:underline"
               >
                 <XCircle size={16} />
                 회원탈퇴
               </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
