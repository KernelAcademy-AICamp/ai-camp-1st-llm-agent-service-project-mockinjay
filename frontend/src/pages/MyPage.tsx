import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, LogOut, XCircle, User, Star, Coins, CreditCard, ChevronRight, Bell } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';
import { useLayout } from '../components/LayoutContext';

export function MyPage() {
  const navigate = useNavigate();
  const { logout } = useLayout();
  const [activeTab, setActiveTab] = useState<'account' | 'personal' | 'disease'>('personal');
  
  // Form States
  const [accountInfo, setAccountInfo] = useState({
    email: 'gildong@example.com',
    password: 'password123',
    userType: '신장병 환우'
  });

  const [personalInfo, setPersonalInfo] = useState({
    nickname: '홍길동',
    gender: '남성',
    birthDate: '1980. 01. 01.',
    weight: '70',
    height: '175',
    race: '동아시아'
  });

  const [diseaseStage, setDiseaseStage] = useState('CKD3');

  const handleLogout = () => {
    logout();
    navigate('/chat');
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
    { label: '만성신장병 1단계', value: 'CKD1' },
    { label: '만성신장병 2단계', value: 'CKD2' },
    { label: '만성신장병 3단계', value: 'CKD3' },
    { label: '만성신장병 4단계', value: 'CKD4' },
    { label: '만성신장병 5단계', value: 'CKD5' },
    { label: '혈액투석환자', value: 'ESRD_HD' },
    { label: '복막투석환자', value: 'ESRD_PD' },
    { label: '이식환자', value: 'CKD_T' },
    { label: '급성신손상', value: 'AKI' },
    { label: '해당없음', value: 'None' }
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
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-[#1F2937]">프로필</h1>
          </div>

          {/* Profile Card */}
          <div className="bg-gradient-to-r from-[#F2FFFD] to-[#F8F4FE] rounded-xl p-6 mb-8 border border-[#E5E7EB]">
            <div className="flex items-center gap-4 mb-4">
              {/* Profile Icon */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00C9B7] to-[#9F7AEA] flex items-center justify-center flex-shrink-0">
                <User size={24} color="white" strokeWidth={2} />
              </div>

              {/* Nickname and User Type */}
              <div className="flex flex-col flex-1">
                <span className="text-lg font-bold text-[#1F2937]">{personalInfo.nickname}</span>
                <span className="text-sm text-[#6B7280]">{accountInfo.userType}</span>
              </div>

              {/* Notification Icon */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 hover:bg-white/50 rounded-lg transition-colors"
                aria-label="알림"
              >
                <Bell size={24} color="#6B7280" strokeWidth={2} />
                {/* Notification Badge */}
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{ background: '#00C9B7' }}></span>
              </button>
            </div>

            {/* User Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Points */}
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-[#FFB84D]" strokeWidth={2} />
                <span className="text-xs text-[#666666]">포인트</span>
                <span className="text-sm font-bold text-[#1F2937]">200P</span>
              </div>

              {/* Level */}
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-[#9F7AEA] flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">L</span>
                </div>
                <span className="text-xs text-[#666666]">지식레벨</span>
                <span className="text-sm font-bold text-[#1F2937]">Lv3</span>
              </div>

              {/* Tokens */}
              <div className="flex items-center gap-1.5">
                <Coins size={14} className="text-[#00C9B7]" strokeWidth={2} />
                <span className="text-xs text-[#666666]">토큰</span>
                <span className="text-sm font-bold text-[#1F2937]">550</span>
              </div>

              {/* Subscription */}
              <div className="flex items-center gap-1.5">
                <CreditCard size={14} className="text-[#9CA3AF]" strokeWidth={2} />
                <span className="text-xs text-[#666666]">구독</span>
                <span className="text-sm text-[#9CA3AF]">없음</span>
              </div>
            </div>
          </div>

          {/* Tabs - Consistent with DietCarePage */}
          <div className="flex border-b border-[#E5E7EB] mb-8">
            <TabButton id="account" label="계정정보" />
            <TabButton id="personal" label="개인정보" />
            <TabButton id="disease" label="질환정보" />
          </div>

          {/* Content Area */}
          <div className="bg-white mb-10">
            {activeTab === 'account' && (
               <div className="border border-[#E5E7EB] rounded-xl p-6 space-y-6">
                 <div>
                   <label className="block text-sm font-bold text-[#374151] mb-2">이메일</label>
                   <input
                     type="email"
                     value={accountInfo.email}
                     readOnly
                     className="w-full p-4 rounded-xl border border-[#E5E7EB] bg-gray-50 text-[#9CA3AF] outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-[#374151] mb-2">비밀번호</label>
                   <div className="flex gap-2">
                     <input
                       type="password"
                       value={accountInfo.password}
                       onChange={(e) => setAccountInfo({...accountInfo, password: e.target.value})}
                       className="flex-1 p-4 rounded-xl border border-[#E5E7EB] focus:border-[#00C9B7] outline-none transition-colors"
                     />
                     <button className="px-5 rounded-xl bg-[#00C9B7] text-white font-bold text-sm whitespace-nowrap hover:bg-[#00B3A3] transition-colors">
                       비밀번호 변경
                     </button>
                   </div>
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
                    <label className="block text-sm font-bold text-[#374151] mb-2">사용자 유형</label>
                    <div className="flex gap-3">
                       {['일반인', '신장병 환우', '연구자'].map((type) => (
                         <button
                           key={type}
                           onClick={() => setAccountInfo({...accountInfo, userType: type})}
                           className={`flex-1 py-3 rounded-xl transition-colors text-base ${
                             accountInfo.userType === type
                               ? 'bg-[#E0F7FA] text-[#00C9B7] font-bold'
                               : 'bg-[#F8FAFC] text-[#4B5563]'
                           }`}
                         >
                           {type}
                         </button>
                       ))}
                    </div>
                  </div>
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
                           className={`flex-1 py-3 rounded-xl transition-colors text-base ${
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
              <div className="border border-[#E5E7EB] rounded-xl p-6">
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-[#374151] mb-2">병원 진단 명</label>
                    <select
                      value={diseaseStage}
                      onChange={(e) => setDiseaseStage(e.target.value)}
                      className="w-full p-4 rounded-xl border border-[#E5E7EB] focus:border-[#00C9B7] outline-none transition-colors"
                    >
                      {diseaseOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-2" style={{ background: 'linear-gradient(90deg, #00C9B7 0%, #7C3AED 100%)' }}>
                  저장
                </button>
              </div>
            )}
          </div>

          {/* Hospital Test Results Menu */}
          <div className="border-t border-[#F3F4F6] pt-6 mb-8">
            <button
              onClick={() => navigate('/mypage/test-results')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-[#E5E7EB] hover:bg-gray-50 transition-colors mb-3"
            >
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-[#00C9B7]" />
                <span className="text-base font-medium text-[#1F2937]">병원검사결과</span>
              </div>
              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <span className="text-sm">자세히 보기</span>
                <ChevronRight size={16} />
              </div>
            </button>

            <button
              onClick={() => navigate('/mypage/subscription')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-[#E5E7EB] hover:bg-gray-50 transition-colors mb-6"
            >
              <div className="flex items-center gap-3">
                <CreditCard size={24} className="text-[#00C9B7]" />
                <span className="text-base font-medium text-[#1F2937]">구독결제</span>
              </div>
              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <span className="text-sm">자세히 보기</span>
                <ChevronRight size={16} />
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
                    navigate('/chat');
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
