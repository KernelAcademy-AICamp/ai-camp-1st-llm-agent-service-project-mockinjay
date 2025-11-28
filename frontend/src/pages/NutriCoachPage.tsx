import { useState } from 'react';
import { MobileHeader } from '../components/MobileHeader';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function NutriCoachPage() {
  const [activeTab, setActiveTab] = useState('guide');

  // Image URLs
  const images = {
    lowPotassium: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    highPotassium: "https://images.unsplash.com/photo-1712059614665-47cc21d8765c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    lowPhosphorus: "https://images.unsplash.com/photo-1737098237230-da325805aaea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    highPhosphorus: "https://images.unsplash.com/photo-1700835880370-35e4910864ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  };

  const nutrients = [
    {
      id: 'potassium',
      name: '칼륨 (Potassium)',
      description: '• 칼륨은 신경과 근육 기능에 중요한 미네랄입니다\n• 신장 기능이 저하되면 칼륨이 체내에 축적됩니다\n• 고칼륨혈증은 심장 박동 이상을 일으킬 수 있습니다\n• 투석 환자는 칼륨 섭취를 제한해야 합니다',
      lowFoods: {
        title: '저칼륨 음식 (먹어도 되는 음식)',
        image: images.lowPotassium,
        content: [
          { label: '과일', items: '사과, 베리류, 체리, 포도, 배, 파인애플, 수박' },
          { label: '채소', items: '양배추, 오이, 가지, 상추, 양파, 피망, 무' },
          { label: '곡물', items: '흰 쌀밥, 흰 빵, 파스타, 크래커' },
          { label: '기타', items: '초콜릿, 커피' }
        ]
      },
      highFoods: {
        title: '고칼륨 음식 (피해야 하는 음식)',
        image: images.highPotassium,
        content: [
          { label: '과일', items: '바나나, 오렌지, 키위, 멜론, 아보카도, 토마토' },
          { label: '채소', items: '시금치, 감자, 고구마, 호박, 브로콜리, 당근, 버섯' },
          { label: '견과류', items: '모든 견과류' }
        ]
      }
    },
    {
      id: 'phosphorus',
      name: '인 (Phosphorus)',
      description: '• 인은 뼈와 치아 건강에 필수적인 미네랄입니다\n• 신장 질환 시 인이 혈액에 축적됩니다\n• 고인혈증은 뼈를 약하게 만들고 혈관을 석회화시킵니다\n• 가공식품과 탄산음료에 인이 많이 들어있습니다',
      lowFoods: {
        title: '저인 음식',
        image: images.lowPhosphorus,
        content: [
          { label: '단백질', items: '신선한 닭고기, 계란, 생선(참치, 연어)' },
          { label: '유제품 대체', items: '쌀 우유, 아몬드 우유, 두유(무인 제품)' },
          { label: '곡물', items: '흰 쌀밥, 파스타' },
          { label: '스낵', items: '무염 팝콘, 쌀과자, 과일 스낵' }
        ]
      },
      highFoods: {
        title: '고인 음식',
        image: images.highPhosphorus,
        content: [
          { label: '단백질', items: '붉은 육류, 햄/소시지, 치즈, 우유, 요구르트' },
          { label: '가공식품', items: '냉동식품, 인스턴트 식품' },
          { label: '음료', items: '콜라/탄산음료, 맥주' },
          { label: '기타', items: '견과류, 초콜릿' }
        ]
      }
    },
    {
      id: 'protein',
      name: '단백질 (Protein)',
      description: '• 단백질은 근육과 조직 유지에 필수적입니다\n• 신장 질환 초기에는 단백질 제한이 필요할 수 있습니다\n• 투석 환자는 오히려 단백질 섭취를 늘려야 합니다\n• 양질의 단백질 선택이 중요합니다',
      guidelines: [
        { stage: 'CKD Stage 1-2', amount: '제한 없음' },
        { stage: 'CKD Stage 3-4', amount: '0.6-0.8g/kg' },
        { stage: '투석 환자', amount: '1.0-1.2g/kg' }
      ],
      lowFoods: {
        title: '양질의 단백질',
        image: images.lowPhosphorus,
        content: [
          { label: '', items: '계란 흰자, 닭가슴살, 생선, 두부' }
        ]
      },
      highFoods: {
        title: '제한할 단백질',
        image: images.highPhosphorus,
        content: [
          { label: '', items: '붉은 육류, 가공육, 고지방 유제품' }
        ]
      },
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Mobile Header */}
      <MobileHeader title="식단케어" />

      {/* Desktop Header */}
      <div className="hidden lg:block px-10 py-8 pb-4">
        <h1 className="text-2xl font-bold text-[#1F2937]">식단케어</h1>
      </div>

      {/* Tabs - Sticky */}
      <div className="px-5 lg:px-10 border-b border-[#E0E0E0] bg-white sticky top-0 lg:top-0 z-40 flex-shrink-0">
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 whitespace-nowrap text-base font-medium transition-colors relative ${
              activeTab === 'guide' ? 'text-[#00C9B7]' : 'text-[#999999]'
            }`}
          >
            뉴트리코치
            {activeTab === 'guide' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00C9B7]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`pb-3 whitespace-nowrap text-base font-medium transition-colors relative ${
              activeTab === 'log' ? 'text-[#00C9B7]' : 'text-[#999999]'
            }`}
          >
            식단 로그
            {activeTab === 'log' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00C9B7]" />
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 lg:p-10 pb-24 lg:pb-10">
        {activeTab === 'guide' && (
          <div className="max-w-5xl mx-auto space-y-10">
            {nutrients.map((item) => (
              <div key={item.id} className="flex flex-col gap-4">
                {/* Title */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h2 className="text-[16px] lg:text-[20px] font-bold text-[#1F2937]">{item.name}</h2>
                </div>
                
                {/* Description */}
                <div className="text-sm lg:text-base text-[#1F2937] whitespace-pre-line leading-[1.6] pl-1 mb-2">
                  {item.description}
                </div>

                {/* Protein Guidelines Card */}
                {item.id === 'protein' && item.guidelines && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
                    {item.guidelines.map((guide, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 rounded-xl border border-[#E0E0E0] bg-white text-center"
                        style={{ boxShadow: 'none' }}
                      >
                        <div className="text-sm font-medium text-[#6B7280] mb-1">{guide.stage}</div>
                        <div className="text-base font-bold text-[#00C9B7]">{guide.amount}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2-Column Grid for Foods */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Low/Safe Foods */}
                  <div 
                    className="p-4 rounded-xl border border-[#E0E0E0] bg-white h-full flex flex-col"
                    style={{ boxShadow: 'none' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-green-500">✅</span>
                      <h3 className="font-bold text-[#1F2937] text-base">{item.lowFoods.title}</h3>
                    </div>
                    
                    <div className="w-full h-40 rounded-lg overflow-hidden mb-3 bg-gray-100">
                        <ImageWithFallback 
                            src={item.lowFoods.image}
                            alt={item.lowFoods.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="space-y-2 text-sm lg:text-base text-[#4B5563] leading-[1.6]">
                      {item.lowFoods.content.map((food, idx) => (
                        <p key={idx}>
                          {food.label && <span className="font-medium text-[#1F2937]">{food.label}: </span>}
                          {food.items}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* High/Avoid Foods */}
                  <div 
                    className="p-4 rounded-xl border border-[#E0E0E0] bg-white h-full flex flex-col"
                    style={{ boxShadow: 'none' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-red-500">⚠️</span>
                      <h3 className="font-bold text-[#1F2937] text-base">{item.highFoods.title}</h3>
                    </div>

                    <div className="w-full h-40 rounded-lg overflow-hidden mb-3 bg-gray-100">
                        <ImageWithFallback 
                            src={item.highFoods.image}
                            alt={item.highFoods.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="space-y-2 text-sm lg:text-base text-[#4B5563] leading-[1.6]">
                      {item.highFoods.content.map((food, idx) => (
                        <p key={idx}>
                          {food.label && <span className="font-medium text-[#1F2937]">{food.label}: </span>}
                          {food.items}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Section Divider Spacing */}
                <div className="h-4" />
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'log' && (
           <div className="flex flex-col items-center justify-center h-64 text-[#999999]">
             <p>식단 로그 기능이 준비 중입니다.</p>
           </div>
        )}
      </div>
    </div>
  );
}
