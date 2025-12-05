/**
 * Intent Classification Types
 * Based on CareGuide PRD v0.95
 *
 * AI 챗봇 대화 관리를 위한 의도분류 시스템
 */

export type IntentCategory =
  | 'NON_MEDICAL'
  | 'ILLEGAL_REQUEST'
  | 'MEDICAL_INFO'
  | 'DIET_INFO'
  | 'RESEARCH'
  | 'WELFARE_INFO'
  | 'HEALTH_RECORD'
  | 'LEARNING'
  | 'POLICY'
  | 'CHIT_CHAT';

/**
 * 의도 분류 정보
 */
export interface IntentClassification {
  /** 의도 카테고리 */
  category: IntentCategory;
  /** 한글 이름 */
  name: string;
  /** 영문 이름 */
  nameEn: string;
  /** 설명 */
  description: string;
  /** 예시 발화 */
  examples: string[];
  /** 위험도 (높을수록 주의 필요) */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** 추천 에이전트 */
  recommendedAgent?: 'medical_welfare' | 'nutrition' | 'research_paper';
  /** False Negative 방지 정책 적용 여부 */
  requiresStrictValidation?: boolean;
}

/**
 * 의도 분류 정의
 */
export const INTENT_CLASSIFICATIONS: Record<IntentCategory, IntentClassification> = {
  NON_MEDICAL: {
    category: 'NON_MEDICAL',
    name: '도메인 외 요청',
    nameEn: 'Non-Medical Request',
    description: '의료/건강과 무관한 요청 차단',
    examples: ['코딩해줘', '번역해줘', '수학 문제 풀어줘'],
    riskLevel: 'medium',
  },

  ILLEGAL_REQUEST: {
    category: 'ILLEGAL_REQUEST',
    name: '불법/비윤리 요청',
    nameEn: 'Illegal Request',
    description: '불법 또는 비윤리적 요청 차단',
    examples: ['돈 보내줘', '욕해줘', '개인정보 알려줘'],
    riskLevel: 'critical',
  },

  MEDICAL_INFO: {
    category: 'MEDICAL_INFO',
    name: '의료 정보',
    nameEn: 'Medical Information',
    description: '증상, 질병, 치료법 관련 질문 (False Negative 방지 필수)',
    examples: [
      '투석하면 효과가 어떤가요?',
      '크레아티닌 수치가 높으면 어떻게 해야 하나요?',
      '신장 이식 후 주의사항은?',
    ],
    riskLevel: 'high',
    recommendedAgent: 'medical_welfare',
    requiresStrictValidation: true,
  },

  DIET_INFO: {
    category: 'DIET_INFO',
    name: '식이 영양',
    nameEn: 'Diet & Nutrition',
    description: '식단, 영양소, 레시피 관련 질문',
    examples: [
      '저염식 먹을거 알려줘',
      '콩팥에 좋은 음식은?',
      '단백질 섭취량은 어느 정도가 적당한가요?',
    ],
    riskLevel: 'low',
    recommendedAgent: 'nutrition',
  },

  RESEARCH: {
    category: 'RESEARCH',
    name: '연구 논문',
    nameEn: 'Research Papers',
    description: '논문 검색, 메타분석, 최신 연구 동향',
    examples: [
      '최신 유전적 신장병 치료법 연구 찾아줘',
      'CKD 관련 최근 논문 요약해줘',
      '만성콩팥병 예방에 대한 연구는?',
    ],
    riskLevel: 'low',
    recommendedAgent: 'research_paper',
  },

  WELFARE_INFO: {
    category: 'WELFARE_INFO',
    name: '복지 정보',
    nameEn: 'Welfare Information',
    description: '지원금, 보험, 제도 관련 질문',
    examples: [
      '투석 환자 지원금은?',
      '신장 질환자 의료비 지원 제도는?',
      '장애인 등록 절차가 어떻게 되나요?',
    ],
    riskLevel: 'low',
    recommendedAgent: 'medical_welfare',
  },

  HEALTH_RECORD: {
    category: 'HEALTH_RECORD',
    name: '건강 기록',
    nameEn: 'Health Records',
    description: '건강 기록, 검사 결과 해석',
    examples: [
      '크레아티닌 1.3 의미는?',
      'eGFR 수치가 60인데 괜찮나요?',
      '소변 검사 결과 해석해줘',
    ],
    riskLevel: 'high',
    recommendedAgent: 'medical_welfare',
    requiresStrictValidation: true,
  },

  LEARNING: {
    category: 'LEARNING',
    name: '학습 퀴즈',
    nameEn: 'Learning & Quiz',
    description: '학습 퀴즈, 지식 테스트',
    examples: [
      '콩팥 퀴즈 내봐',
      '만성콩팥병에 대해 배우고 싶어요',
      '신장 건강 상식 테스트',
    ],
    riskLevel: 'low',
  },

  POLICY: {
    category: 'POLICY',
    name: '의료 정책',
    nameEn: 'Medical Policy',
    description: '의료 정책, 가이드라인',
    examples: [
      '만성콩팥병 진료 가이드라인은?',
      '투석 환자 관리 지침',
      'KDIGO 가이드라인 내용',
    ],
    riskLevel: 'low',
    recommendedAgent: 'research_paper',
  },

  CHIT_CHAT: {
    category: 'CHIT_CHAT',
    name: '일상 대화',
    nameEn: 'Chit Chat',
    description: '일상 대화, 인사 (잡담/스팸성 대화 제한)',
    examples: [
      '안녕하세요!',
      '오늘 날씨 어때?',
      '심심해',
    ],
    riskLevel: 'low',
  },
};

/**
 * False Negative 방지 전략
 */
export interface FalseNegativePreventionRule {
  /** 규칙 이름 */
  name: string;
  /** 구현 방법 */
  implementation: string;
  /** 적용 대상 의도 */
  applicableIntents: IntentCategory[];
}

export const FALSE_NEGATIVE_PREVENTION_RULES: FalseNegativePreventionRule[] = [
  {
    name: '증상 보고 시 절대 안심 금지',
    implementation: '"괜찮습니다", "정상입니다" 답변 차단, 항상 "의료진 상담 권장"',
    applicableIntents: ['MEDICAL_INFO', 'HEALTH_RECORD'],
  },
  {
    name: '응급 키워드 감지',
    implementation: '흉통, 호흡곤란, 의식저하, 경련 → 즉시 119 안내',
    applicableIntents: ['MEDICAL_INFO'],
  },
  {
    name: '신뢰도 점수 기반 응답',
    implementation: 'Confidence < 0.7 → "확실한 답변 불가, 병원 방문 권장"',
    applicableIntents: ['MEDICAL_INFO', 'HEALTH_RECORD'],
  },
  {
    name: '멀티턴 검증',
    implementation: '증상 지속 기간, 강도, 동반 증상 3회 이상 확인',
    applicableIntents: ['MEDICAL_INFO'],
  },
  {
    name: 'Disclaimer 고정 표시',
    implementation: '"본 답변은 진단이 아니며 참고용입니다" 배너 항상 표시',
    applicableIntents: ['MEDICAL_INFO', 'HEALTH_RECORD', 'DIET_INFO'],
  },
];

/**
 * 응급 키워드 목록
 */
export const EMERGENCY_KEYWORDS = [
  '흉통',
  '가슴 통증',
  '호흡곤란',
  '숨쉬기 힘들',
  '의식저하',
  '정신 잃',
  '경련',
  '심한 두통',
  '구토',
  '심한 복통',
  '피를 토',
  '혈뇨',
  '고열',
] as const;

/**
 * 의도별 라우팅 매핑
 */
export const INTENT_ROUTE_MAPPING: Partial<Record<IntentCategory, string>> = {
  DIET_INFO: '/chat/nutrition',
  RESEARCH: '/chat/research',
  MEDICAL_INFO: '/chat/medical-welfare',
  WELFARE_INFO: '/chat/medical-welfare',
  HEALTH_RECORD: '/chat/medical-welfare',
};
