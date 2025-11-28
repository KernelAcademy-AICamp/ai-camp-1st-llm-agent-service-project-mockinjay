/**
 * CKD Disease Stage Configuration
 * Provides comprehensive information about Chronic Kidney Disease stages
 *
 * References:
 * - National Kidney Foundation: https://www.kidney.org/atoz/content/about-chronic-kidney-disease
 * - Korean Society of Nephrology
 */

export interface DiseaseStage {
  label: string;
  value: string;
  description: string;
  egfr?: string; // Estimated Glomerular Filtration Rate
  tooltip?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
}

/**
 * CKD Stage Options with Medical Information
 */
export const CKD_STAGES: DiseaseStage[] = [
  {
    label: '만성신장병 1단계',
    value: 'CKD1',
    description: '신장 손상이 있으나 기능은 정상',
    egfr: 'eGFR ≥ 90 mL/min/1.73m²',
    tooltip: '신장 기능이 정상이지만 단백뇨나 혈뇨 등 신장 손상의 증거가 있는 상태입니다. 정기적인 검진과 위험인자 관리가 필요합니다.',
    severity: 'mild',
  },
  {
    label: '만성신장병 2단계',
    value: 'CKD2',
    description: '경미한 신장 기능 감소',
    egfr: 'eGFR 60-89 mL/min/1.73m²',
    tooltip: '경미한 신장 기능 저하가 있는 상태입니다. 혈압과 혈당 조절, 단백질 섭취 제한 등의 생활습관 관리가 중요합니다.',
    severity: 'mild',
  },
  {
    label: '만성신장병 3단계',
    value: 'CKD3',
    description: '중등도 신장 기능 감소',
    egfr: 'eGFR 30-59 mL/min/1.73m²',
    tooltip: '중등도의 신장 기능 저하 상태로, 빈혈, 뼈질환 등의 합병증이 나타날 수 있습니다. 전문의 진료와 적극적인 관리가 필요합니다.',
    severity: 'moderate',
  },
  {
    label: '만성신장병 4단계',
    value: 'CKD4',
    description: '심한 신장 기능 감소',
    egfr: 'eGFR 15-29 mL/min/1.73m²',
    tooltip: '신장 기능이 심하게 저하된 상태로, 투석이나 이식 준비가 필요할 수 있습니다. 엄격한 식이요법과 약물 치료가 필요합니다.',
    severity: 'severe',
  },
  {
    label: '만성신장병 5단계',
    value: 'CKD5',
    description: '말기 신부전',
    egfr: 'eGFR < 15 mL/min/1.73m²',
    tooltip: '말기 신부전 상태로, 생존을 위해 투석이나 신장 이식이 필요합니다. 전문적인 의료 관리가 필수적입니다.',
    severity: 'critical',
  },
  {
    label: '혈액투석환자',
    value: 'ESRD_HD',
    description: '혈액투석 치료 중',
    tooltip: '혈액투석(Hemodialysis)을 받고 있는 말기 신부전 환자입니다. 주 3회 정도 투석 치료를 받으며, 엄격한 식이요법과 수분 관리가 필요합니다.',
    severity: 'critical',
  },
  {
    label: '복막투석환자',
    value: 'ESRD_PD',
    description: '복막투석 치료 중',
    tooltip: '복막투석(Peritoneal Dialysis)을 받고 있는 말기 신부전 환자입니다. 집에서 스스로 투석을 시행하며, 감염 예방과 영양 관리가 중요합니다.',
    severity: 'critical',
  },
  {
    label: '이식환자',
    value: 'CKD_T',
    description: '신장 이식 후 관리 중',
    tooltip: '신장 이식(Kidney Transplant)을 받은 환자입니다. 면역억제제 복용과 거부반응 예방, 정기적인 검진이 필요합니다.',
    severity: 'moderate',
  },
  {
    label: '급성신손상',
    value: 'AKI',
    description: '급성 신장 손상',
    tooltip: '급성신손상(Acute Kidney Injury)은 신장 기능이 갑자기 나빠진 상태입니다. 원인 치료와 함께 적절한 관리가 필요하며, 회복 가능성이 있습니다.',
    severity: 'severe',
  },
  {
    label: '해당없음',
    value: 'None',
    description: '신장질환 없음 또는 확인 안 함',
    tooltip: '만성 신장질환이 없거나, 질환 정보를 입력하지 않는 경우 선택해주세요. 나중에 마이페이지에서 수정 가능합니다.',
    severity: undefined,
  },
];

/**
 * Get stage information by value
 */
export function getStageInfo(value: string): DiseaseStage | undefined {
  return CKD_STAGES.find(stage => stage.value === value);
}

/**
 * Get stages by severity
 */
export function getStagesBySeverity(
  severity: 'mild' | 'moderate' | 'severe' | 'critical'
): DiseaseStage[] {
  return CKD_STAGES.filter(stage => stage.severity === severity);
}

/**
 * Check if stage requires dialysis or transplant
 */
export function requiresRenalReplacement(value: string): boolean {
  return ['CKD5', 'ESRD_HD', 'ESRD_PD', 'CKD_T'].includes(value);
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity?: DiseaseStage['severity']): string {
  switch (severity) {
    case 'mild':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'moderate':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'severe':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get severity badge text
 */
export function getSeverityBadge(severity?: DiseaseStage['severity']): string {
  switch (severity) {
    case 'mild':
      return '경증';
    case 'moderate':
      return '중등도';
    case 'severe':
      return '중증';
    case 'critical':
      return '매우 중증';
    default:
      return '';
  }
}

/**
 * Dietary recommendations by stage
 */
export const DIETARY_RECOMMENDATIONS: Record<string, string[]> = {
  CKD1: [
    '균형 잡힌 식사',
    '충분한 수분 섭취',
    '저염식 권장',
  ],
  CKD2: [
    '단백질 섭취 주의 (0.8g/kg/일)',
    '저염식 필수 (하루 5g 이하)',
    '혈압 관리를 위한 식이 조절',
  ],
  CKD3: [
    '단백질 제한 (0.6-0.8g/kg/일)',
    '칼륨, 인 섭취 제한',
    '엄격한 저염식',
  ],
  CKD4: [
    '엄격한 단백질 제한',
    '칼륨, 인, 나트륨 제한',
    '수분 섭취량 조절',
  ],
  CKD5: [
    '투석 전 저단백 식이',
    '전해질 관리',
    '영양사 상담 필수',
  ],
  ESRD_HD: [
    '투석일과 비투석일 식단 구분',
    '수분 제한 (하루 500-700mL)',
    '칼륨, 인 엄격 제한',
  ],
  ESRD_PD: [
    '혈액투석보다 완화된 식이',
    '단백질 충분 섭취',
    '칼륨 제한 완화 가능',
  ],
  CKD_T: [
    '면역력 강화 식단',
    '감염 예방을 위한 위생 관리',
    '정상에 가까운 식이 가능',
  ],
  AKI: [
    '원인에 따른 식이 조절',
    '전문의 상담 필수',
    '회복 단계별 식단 조정',
  ],
  None: [
    '건강한 식습관 유지',
    '정기 건강검진',
  ],
};
