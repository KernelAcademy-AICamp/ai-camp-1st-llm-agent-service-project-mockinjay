import { useState } from 'react';
import { BarChart2, Check, AlertTriangle } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';

type TabType = 'nutri-coach' | 'diet-log';

export function DietCarePage() {
  const [activeTab, setActiveTab] = useState<TabType>('nutri-coach');
  
  const dietLogs = [
    {
      date: '2025-11-23',
      meal: '아침',
      foods: ['현미밥', '된장찌개', '배추김치'],
      calories: 450
    },
    {
      date: '2025-11-23',
      meal: '점심',
      foods: ['닭가슴살', '샐러드', '사과'],
      calories: 520
    }
  ];
  
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#FFFFFF' }}>
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader
          title="식단케어"
          showMenu={true}
          showProfile={true}
        />
      </div>

      <div className="p-6 lg:max-w-[832px] mx-auto pb-24 lg:pb-6">
        
        {/* Tabs - Strictly following image 1 style */}
        <div className="border-b mb-8" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('nutri-coach')}
              className="relative pb-3 transition-all duration-200"
              style={{
                color: activeTab === 'nutri-coach' ? '#00C9B7' : '#9CA3AF',
                fontSize: '16px',
                fontWeight: activeTab === 'nutri-coach' ? '700' : '500'
              }}
            >
              뉴트리코치
              {activeTab === 'nutri-coach' && (
                <div 
                  className="absolute bottom-[-1px] left-0 right-0"
                  style={{ 
                    height: '2px',
                    background: '#9F7AEA'
                  }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('diet-log')}
              className="relative pb-3 transition-all duration-200"
              style={{
                color: activeTab === 'diet-log' ? '#00C9B7' : '#9CA3AF',
                fontSize: '16px',
                fontWeight: activeTab === 'diet-log' ? '700' : '500'
              }}
            >
              식단 로그
              {activeTab === 'diet-log' && (
                <div 
                  className="absolute bottom-[-1px] left-0 right-0"
                  style={{ 
                    height: '2px',
                    background: '#9F7AEA'
                  }}
                />
              )}
            </button>
          </div>
        </div>
        
        {/* Nutri Coach Content */}
        {activeTab === 'nutri-coach' && (
          <div className="space-y-12">
            {/* Potassium Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="text-[#1F2937]" size={24} />
                <h3 className="text-lg font-bold text-[#1F2937]">칼륨 (Potassium)</h3>
              </div>
              <div className="text-sm text-[#4B5563] space-y-2 mb-6 pl-1">
                <p>• 칼륨은 신경과 근육 기능에 중요한 미네랄입니다</p>
                <p>• 신장 기능이 저하되면 칼륨이 체내에 축적됩니다</p>
                <p>• 고칼륨혈증은 심장 박동 이상을 일으킬 수 있습니다</p>
                <p>• 투석 환자는 칼륨 섭취를 제한해야 합니다</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Safe Foods */}
                <div className="border border-[#E5E7EB] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 rounded bg-[#22C55E] flex items-center justify-center">
                      <Check size={16} color="white" strokeWidth={3} />
                    </div>
                    <h4 className="font-bold text-[#1F2937]">저칼륨 음식 (먹어도 되는 음식)</h4>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[40px] text-[#1F2937]">과일:</span>
                      <span className="text-[#6B7280]">사과, 베리류, 체리, 포도, 배, 파인애플, 수박</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[40px] text-[#1F2937]">채소:</span>
                      <span className="text-[#6B7280]">양배추, 오이, 가지, 상추, 양파, 피망, 무</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[40px] text-[#1F2937]">곡물:</span>
                      <span className="text-[#6B7280]">흰 쌀밥, 흰 빵, 파스타, 크래커</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[40px] text-[#1F2937]">기타:</span>
                      <span className="text-[#6B7280]">초콜릿, 커피</span>
                    </div>
                  </div>
                </div>

                {/* Warning Foods */}
                <div className="border border-[#E5E7EB] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <AlertTriangle size={24} className="text-[#EF4444]" />
                    <h4 className="font-bold text-[#1F2937]">고칼륨 음식 (피해야 하는 음식)</h4>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[50px] text-[#1F2937]">과일:</span>
                      <span className="text-[#6B7280]">바나나, 오렌지, 키위, 멜론, 아보카도, 토마토</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[50px] text-[#1F2937]">채소:</span>
                      <span className="text-[#6B7280]">시금치, 감자, 고구마, 호박, 브로콜리, 당근, 버섯</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[50px] text-[#1F2937]">견과류:</span>
                      <span className="text-[#6B7280]">모든 견과류</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Phosphorus Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="text-[#1F2937]" size={24} />
                <h3 className="text-lg font-bold text-[#1F2937]">인 (Phosphorus)</h3>
              </div>
              <div className="text-sm text-[#4B5563] space-y-2 mb-6 pl-1">
                <p>• 인은 뼈와 치아 건강에 필수적인 미네랄입니다</p>
                <p>• 신장 질환 시 인이 혈액에 축적됩니다</p>
                <p>• 고인혈증은 뼈를 약하게 만들고 혈관을 석회화시킵니다</p>
                <p>• 가공식품과 탄산음료에 인이 많이 들어있습니다</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Safe Foods */}
                <div className="border border-[#E5E7EB] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 rounded bg-[#22C55E] flex items-center justify-center">
                      <Check size={16} color="white" strokeWidth={3} />
                    </div>
                    <h4 className="font-bold text-[#1F2937]">저인 음식</h4>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[70px] text-[#1F2937]">단백질:</span>
                      <span className="text-[#6B7280]">신선한 닭고기, 계란, 생선(참치, 연어)</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[70px] text-[#1F2937]">유제품 대체:</span>
                      <span className="text-[#6B7280]">쌀 우유, 아몬드 우유, 두유(무인 제품)</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[70px] text-[#1F2937]">곡물:</span>
                      <span className="text-[#6B7280]">흰 쌀밥, 파스타</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[70px] text-[#1F2937]">스낵:</span>
                      <span className="text-[#6B7280]">무염 팝콘, 쌀과자, 과일 스낵</span>
                    </div>
                  </div>
                </div>

                {/* Warning Foods */}
                <div className="border border-[#E5E7EB] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <AlertTriangle size={24} className="text-[#EF4444]" />
                    <h4 className="font-bold text-[#1F2937]">고인 음식</h4>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[60px] text-[#1F2937]">단백질:</span>
                      <span className="text-[#6B7280]">붉은 육류, 햄/소시지, 치즈, 우유, 요구르트</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[60px] text-[#1F2937]">가공식품:</span>
                      <span className="text-[#6B7280]">냉동식품, 인스턴트 식품</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[60px] text-[#1F2937]">음료:</span>
                      <span className="text-[#6B7280]">콜라/탄산음료, 맥주</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold min-w-[60px] text-[#1F2937]">기타:</span>
                      <span className="text-[#6B7280]">견과류, 초콜릿</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
        
        {/* Diet Log Content */}
        {activeTab === 'diet-log' && (
          <div className="space-y-6">
            {/* Goal Setting Section */}
            <div className="flex justify-between items-center">
              <h3 style={{ color: '#1F2937' }}>목표 설정</h3>
              <button className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: 'rgb(0, 201, 183)' }}>
                목표 저장
              </button>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #F2FFFD 0%, #F8F4FE 100%)' }}>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#4B5563' }}>
                    칼륨 (mg/일)
                  </label>
                  <input
                    type="number"
                    placeholder="2000"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#4B5563' }}>
                    인 (mg/일)
                  </label>
                  <input
                    type="number"
                    placeholder="800"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#4B5563' }}>
                    단백질 (g/일)
                  </label>
                  <input
                    type="number"
                    placeholder="60"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#4B5563' }}>
                    열량 (kcal/일)
                  </label>
                  <input
                    type="number"
                    placeholder="2000"
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <h3 style={{ color: '#1F2937' }}>식사 기록</h3>
              <button className="px-4 py-2 rounded-xl text-white font-medium" style={{ background: 'linear-gradient(135deg, rgb(0, 200, 180) 0%, rgb(159, 122, 234) 100%)' }}>
                식사 추가
              </button>
            </div>
            
            <div className="space-y-4">
              {dietLogs.map((log, index) => (
                <div key={index} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 style={{ color: '#1F2937' }}>{log.meal}</h4>
                      <p className="text-sm" style={{ color: '#9CA3AF' }}>
                        {log.date}
                      </p>
                    </div>
                    <span 
                      className="px-3 py-1 rounded-lg text-sm font-medium"
                      style={{ background: '#F3F4F6', color: '#00C9B7' }}
                    >
                      {log.calories} kcal
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {log.foods.map((food, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 rounded-lg text-sm"
                        style={{ background: '#F9FAFB', color: '#4B5563' }}
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
