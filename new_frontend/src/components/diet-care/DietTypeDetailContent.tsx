/**
 * DietTypeDetailContent Component
 * Detailed information page for specific diet types (Low Sodium, Low Protein, etc.)
 */

import React, { useMemo } from 'react';
import {
  Apple,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Utensils,
  Scale,
  Info
} from 'lucide-react';

export interface DietTypeDetailContentProps {
  dietType: string;
  language: 'en' | 'ko';
}

interface DietDetailInfo {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  dailyLimit: string;
  dailyLimitEn: string;
  icon: string;
  color: string;
  bgColor: string;
  allowedFoods: { ko: string; en: string }[];
  avoidFoods: { ko: string; en: string }[];
  tips: { ko: string; en: string }[];
  mealSuggestions: { ko: string; en: string }[];
  healthBenefits: { ko: string; en: string }[];
}

const DIET_TYPE_DETAILS: Record<string, DietDetailInfo> = {
  'low-sodium': {
    title: '저염식 (Low Sodium Diet)',
    titleEn: 'Low Sodium Diet',
    description: '나트륨 섭취를 제한하여 혈압 관리와 신장 기능 보호에 도움을 주는 식단입니다.',
    descriptionEn: 'A diet that limits sodium intake to help manage blood pressure and protect kidney function.',
    dailyLimit: '하루 나트륨 섭취량 2,000mg 이하',
    dailyLimitEn: 'Daily sodium intake under 2,000mg',
    icon: '🧂',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    allowedFoods: [
      { ko: '신선한 과일과 채소', en: 'Fresh fruits and vegetables' },
      { ko: '무염 견과류', en: 'Unsalted nuts' },
      { ko: '신선한 육류와 생선', en: 'Fresh meat and fish' },
      { ko: '쌀, 파스타 (무첨가)', en: 'Rice, pasta (unseasoned)' },
      { ko: '저염 유제품', en: 'Low-sodium dairy products' },
    ],
    avoidFoods: [
      { ko: '가공식품 (햄, 소시지, 베이컨)', en: 'Processed foods (ham, sausage, bacon)' },
      { ko: '인스턴트 식품 (라면, 냉동식품)', en: 'Instant foods (ramen, frozen foods)' },
      { ko: '절임 식품 (김치, 장아찌)', en: 'Fermented foods (kimchi, fermented vegetables)' },
      { ko: '소스류 (간장, 된장, 케첩)', en: 'Sauces (soy sauce, miso, ketchup)' },
      { ko: '패스트푸드', en: 'Fast food' },
    ],
    tips: [
      { ko: '요리 시 소금 대신 레몬즙, 식초, 허브를 활용하세요', en: 'Use lemon juice, vinegar, and herbs instead of salt when cooking' },
      { ko: '식품 라벨에서 나트륨 함량을 확인하세요', en: 'Check sodium content on food labels' },
      { ko: '외식 시 저염 메뉴를 요청하세요', en: 'Request low-sodium options when eating out' },
      { ko: '천천히 적응하며 점진적으로 소금 양을 줄이세요', en: 'Gradually reduce salt intake to adapt slowly' },
    ],
    mealSuggestions: [
      { ko: '아침: 오트밀 + 신선한 과일 + 무염 견과류', en: 'Breakfast: Oatmeal + fresh fruits + unsalted nuts' },
      { ko: '점심: 그릴 닭가슴살 + 채소 샐러드 (레몬 드레싱)', en: 'Lunch: Grilled chicken breast + vegetable salad (lemon dressing)' },
      { ko: '저녁: 구운 생선 + 찐 브로콜리 + 현미밥', en: 'Dinner: Baked fish + steamed broccoli + brown rice' },
    ],
    healthBenefits: [
      { ko: '혈압 조절에 도움', en: 'Helps control blood pressure' },
      { ko: '부종 감소', en: 'Reduces swelling' },
      { ko: '심혈관 건강 개선', en: 'Improves cardiovascular health' },
      { ko: '신장 부담 감소', en: 'Reduces kidney strain' },
    ],
  },
  'low-protein': {
    title: '저단백식 (Low Protein Diet)',
    titleEn: 'Low Protein Diet',
    description: '단백질 섭취를 제한하여 신장의 노폐물 처리 부담을 줄이는 식단입니다.',
    descriptionEn: 'A diet that limits protein intake to reduce the kidney waste processing burden.',
    dailyLimit: '체중 1kg당 0.6-0.8g 단백질',
    dailyLimitEn: '0.6-0.8g protein per kg body weight',
    icon: '🥩',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    allowedFoods: [
      { ko: '과일 (사과, 배, 포도)', en: 'Fruits (apples, pears, grapes)' },
      { ko: '채소 (양상추, 오이, 당근)', en: 'Vegetables (lettuce, cucumber, carrots)' },
      { ko: '흰쌀밥, 국수', en: 'White rice, noodles' },
      { ko: '저단백 특수 식품', en: 'Low-protein specialty foods' },
      { ko: '식물성 오일', en: 'Vegetable oils' },
    ],
    avoidFoods: [
      { ko: '붉은 고기 (소고기, 돼지고기)', en: 'Red meat (beef, pork)' },
      { ko: '유제품 (우유, 치즈, 요거트)', en: 'Dairy products (milk, cheese, yogurt)' },
      { ko: '콩류 (두부, 콩나물)', en: 'Legumes (tofu, bean sprouts)' },
      { ko: '견과류', en: 'Nuts' },
      { ko: '계란 (특히 노른자)', en: 'Eggs (especially yolks)' },
    ],
    tips: [
      { ko: '양질의 단백질(달걀 흰자, 생선)을 소량으로 섭취하세요', en: 'Consume high-quality protein (egg whites, fish) in small amounts' },
      { ko: '탄수화물로 칼로리를 보충하세요', en: 'Supplement calories with carbohydrates' },
      { ko: '영양사와 상담하여 개인별 단백질 양을 결정하세요', en: 'Consult a nutritionist to determine your personal protein intake' },
      { ko: '단백질 섭취량을 기록하여 관리하세요', en: 'Track and manage your protein intake' },
    ],
    mealSuggestions: [
      { ko: '아침: 흰쌀죽 + 채소 절임', en: 'Breakfast: White rice porridge + vegetable side' },
      { ko: '점심: 비빔국수 (채소 위주) + 과일', en: 'Lunch: Mixed noodles (vegetable-based) + fruit' },
      { ko: '저녁: 흰쌀밥 + 채소 볶음 + 소량의 생선', en: 'Dinner: White rice + stir-fried vegetables + small portion of fish' },
    ],
    healthBenefits: [
      { ko: '신장 기능 보존', en: 'Preserves kidney function' },
      { ko: '요독증 증상 완화', en: 'Alleviates uremia symptoms' },
      { ko: '신장 질환 진행 속도 감소', en: 'Slows kidney disease progression' },
      { ko: '대사 노폐물 감소', en: 'Reduces metabolic waste' },
    ],
  },
  'low-potassium': {
    title: '저칼륨식 (Low Potassium Diet)',
    titleEn: 'Low Potassium Diet',
    description: '칼륨 섭취를 제한하여 심장 건강을 보호하고 신장 기능을 유지하는 식단입니다.',
    descriptionEn: 'A diet that limits potassium intake to protect heart health and maintain kidney function.',
    dailyLimit: '하루 칼륨 섭취량 2,000mg 이하',
    dailyLimitEn: 'Daily potassium under 2,000mg',
    icon: '🍌',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    allowedFoods: [
      { ko: '사과, 배, 포도, 파인애플', en: 'Apples, pears, grapes, pineapple' },
      { ko: '양배추, 양상추, 오이', en: 'Cabbage, lettuce, cucumber' },
      { ko: '흰쌀밥, 흰빵', en: 'White rice, white bread' },
      { ko: '달걀 흰자', en: 'Egg whites' },
      { ko: '닭가슴살 (소량)', en: 'Chicken breast (small portion)' },
    ],
    avoidFoods: [
      { ko: '바나나, 오렌지, 키위', en: 'Bananas, oranges, kiwi' },
      { ko: '토마토, 감자, 시금치', en: 'Tomatoes, potatoes, spinach' },
      { ko: '아보카도', en: 'Avocado' },
      { ko: '말린 과일', en: 'Dried fruits' },
      { ko: '초콜릿, 견과류', en: 'Chocolate, nuts' },
    ],
    tips: [
      { ko: '채소는 물에 2시간 이상 담근 후 사용하세요', en: 'Soak vegetables in water for 2+ hours before use' },
      { ko: '채소를 데칠 때 물을 2번 이상 교체하세요', en: 'Change water 2+ times when blanching vegetables' },
      { ko: '통조림 과일의 시럽은 버리세요', en: 'Discard syrup from canned fruits' },
      { ko: '저칼륨 대용염을 사용하지 마세요', en: 'Avoid low-potassium salt substitutes' },
    ],
    mealSuggestions: [
      { ko: '아침: 흰빵 + 잼 + 사과', en: 'Breakfast: White bread + jam + apple' },
      { ko: '점심: 흰쌀밥 + 삶은 양배추 + 닭가슴살', en: 'Lunch: White rice + boiled cabbage + chicken breast' },
      { ko: '저녁: 국수 + 오이무침 + 달걀 흰자 프라이', en: 'Dinner: Noodles + cucumber salad + fried egg whites' },
    ],
    healthBenefits: [
      { ko: '심장 부정맥 예방', en: 'Prevents heart arrhythmia' },
      { ko: '근육 기능 유지', en: 'Maintains muscle function' },
      { ko: '신경 기능 보호', en: 'Protects nerve function' },
      { ko: '전해질 균형 유지', en: 'Maintains electrolyte balance' },
    ],
  },
  'low-phosphorus': {
    title: '저인식 (Low Phosphorus Diet)',
    titleEn: 'Low Phosphorus Diet',
    description: '인 섭취를 제한하여 뼈 건강을 보호하고 혈관 석회화를 예방하는 식단입니다.',
    descriptionEn: 'A diet that limits phosphorus intake to protect bone health and prevent vascular calcification.',
    dailyLimit: '하루 인 섭취량 800-1,000mg',
    dailyLimitEn: 'Daily phosphorus 800-1,000mg',
    icon: '🦴',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    allowedFoods: [
      { ko: '흰쌀밥, 흰빵', en: 'White rice, white bread' },
      { ko: '신선한 과일', en: 'Fresh fruits' },
      { ko: '양배추, 양상추', en: 'Cabbage, lettuce' },
      { ko: '달걀 흰자', en: 'Egg whites' },
      { ko: '버터, 올리브 오일', en: 'Butter, olive oil' },
    ],
    avoidFoods: [
      { ko: '유제품 (우유, 치즈, 요거트)', en: 'Dairy products (milk, cheese, yogurt)' },
      { ko: '견과류, 씨앗류', en: 'Nuts, seeds' },
      { ko: '콜라 등 탄산음료', en: 'Cola and carbonated drinks' },
      { ko: '가공육 (소시지, 베이컨)', en: 'Processed meats (sausage, bacon)' },
      { ko: '통곡물, 잡곡', en: 'Whole grains, mixed grains' },
    ],
    tips: [
      { ko: '인 결합제를 처방받아 식사와 함께 복용하세요', en: 'Take prescribed phosphate binders with meals' },
      { ko: '식품 첨가물(인산염)이 포함된 가공식품을 피하세요', en: 'Avoid processed foods with phosphate additives' },
      { ko: '식품 라벨에서 인산 성분을 확인하세요', en: 'Check food labels for phosphate ingredients' },
      { ko: '자연 식품의 인은 가공식품보다 흡수율이 낮습니다', en: 'Natural food phosphorus has lower absorption than processed foods' },
    ],
    mealSuggestions: [
      { ko: '아침: 흰빵 토스트 + 과일잼 + 사과', en: 'Breakfast: White bread toast + fruit jam + apple' },
      { ko: '점심: 흰쌀밥 + 채소 볶음 + 삶은 달걀 흰자', en: 'Lunch: White rice + stir-fried vegetables + boiled egg whites' },
      { ko: '저녁: 파스타 (크림소스 제외) + 샐러드', en: 'Dinner: Pasta (no cream sauce) + salad' },
    ],
    healthBenefits: [
      { ko: '뼈 건강 유지', en: 'Maintains bone health' },
      { ko: '혈관 석회화 예방', en: 'Prevents vascular calcification' },
      { ko: '부갑상선 기능 조절', en: 'Regulates parathyroid function' },
      { ko: '심혈관 질환 위험 감소', en: 'Reduces cardiovascular disease risk' },
    ],
  },
};

export const DietTypeDetailContent: React.FC<DietTypeDetailContentProps> = ({
  dietType,
  language,
}) => {
  const detail = useMemo(() => DIET_TYPE_DETAILS[dietType], [dietType]);

  if (!detail) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {language === 'ko' ? '정보를 찾을 수 없습니다' : 'Information not found'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'ko'
            ? '요청하신 식단 유형 정보가 없습니다.'
            : 'The requested diet type information is not available.'}
        </p>
      </div>
    );
  }

  const isKo = language === 'ko';

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className={`${detail.bgColor} p-6 rounded-xl`}>
        <div className="flex items-start gap-4">
          <span className="text-5xl">{detail.icon}</span>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${detail.color} mb-2`}>
              {isKo ? detail.title : detail.titleEn}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {isKo ? detail.description : detail.descriptionEn}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Scale className={detail.color} size={20} />
              <span className="font-medium text-gray-900 dark:text-white">
                {isKo ? detail.dailyLimit : detail.dailyLimitEn}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Benefits */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Info className="text-blue-500" size={24} />
          {isKo ? '건강 효과' : 'Health Benefits'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detail.healthBenefits.map((benefit, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <CheckCircle2 className="text-blue-600 flex-shrink-0" size={20} />
              <span className="text-gray-700 dark:text-gray-300">
                {isKo ? benefit.ko : benefit.en}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Foods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allowed Foods */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-600">
            <CheckCircle2 size={24} />
            {isKo ? '권장 식품' : 'Recommended Foods'}
          </h3>
          <ul className="space-y-3">
            {detail.allowedFoods.map((food, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <Apple className="text-green-600 flex-shrink-0" size={18} />
                <span className="text-gray-700 dark:text-gray-300">
                  {isKo ? food.ko : food.en}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Avoid Foods */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
            <XCircle size={24} />
            {isKo ? '피해야 할 식품' : 'Foods to Avoid'}
          </h3>
          <ul className="space-y-3">
            {detail.avoidFoods.map((food, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                <XCircle className="text-red-500 flex-shrink-0" size={18} />
                <span className="text-gray-700 dark:text-gray-300">
                  {isKo ? food.ko : food.en}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <BookOpen className="text-orange-500" size={24} />
          {isKo ? '실천 팁' : 'Practical Tips'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {detail.tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20"
            >
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-orange-500 text-white rounded-full text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {isKo ? tip.ko : tip.en}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Suggestions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Utensils className="text-indigo-500" size={24} />
          {isKo ? '추천 식단 예시' : 'Meal Suggestions'}
        </h3>
        <div className="space-y-4">
          {detail.mealSuggestions.map((meal, idx) => (
            <div
              key={idx}
              className="p-4 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-900/20"
            >
              <p className="text-gray-700 dark:text-gray-300">
                {isKo ? meal.ko : meal.en}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl text-white">
        <h3 className="text-xl font-bold mb-2">
          {isKo ? '전문가 상담이 필요하신가요?' : 'Need Professional Consultation?'}
        </h3>
        <p className="mb-4 opacity-90">
          {isKo
            ? '개인별 맞춤 식단 계획을 위해 영양사 또는 담당 의료진과 상담하세요.'
            : 'Consult with a nutritionist or your healthcare provider for a personalized diet plan.'}
        </p>
        <button className="px-6 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
          {isKo ? 'AI 영양 상담 시작하기' : 'Start AI Nutrition Consultation'}
        </button>
      </div>
    </div>
  );
};

export default DietTypeDetailContent;
