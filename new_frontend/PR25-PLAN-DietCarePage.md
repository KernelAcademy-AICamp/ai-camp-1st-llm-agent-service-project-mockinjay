# PR25-PLAN-DietCarePage

## DietCarePage 이식 상세 계획서

**Source**: `frontend/src/pages/DietCarePage.tsx` (327 lines)
**Target**: `new_frontend/src/pages/DietCarePageEnhanced.tsx` (89 lines)

---

## 1. 기능 비교 테이블

| 기능 | frontend/ | new_frontend/ | 이식 필요 |
|------|-----------|---------------|-----------|
| Inline Tab Navigation | ✅ 인라인 상태 (40-84) | ✅ 라우트 기반 | 스타일 참고 |
| Educational Headers | ✅ 아이콘 + 불릿 설명 (89-100) | ❌ 없음 | **P0 필수** |
| Safe/Warning Cards | ✅ 녹색/빨간색 (102-222) | ❌ 없음 | **P0 필수** |
| Goal Setting Form | ✅ 4개 입력 필드 (230-281) | ❌ 별도 컴포넌트 | **P1 권장** |
| Meal Entry Cards | ✅ 식사 타입/날짜/칼로리 (291-319) | ❌ 별도 컴포넌트 | **P1 권장** |
| Gradient Background | ✅ 카드 배경 (238) | ❌ 없음 | **P2 선택** |
| Diet Type Detail | ❌ 없음 | ✅ 있음 | 유지 |
| NutriCoach Chat | ❌ 없음 | ✅ 있음 | 유지 |

---

## 2. 이식할 코드 스니펫

### P0-1: Educational Headers (칼륨/인 설명)

**Source Location**: `frontend/src/pages/DietCarePage.tsx:89-100`

```tsx
// 교육적 헤더 (아이콘 + 불릿 포인트 설명)
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
  {/* Safe/Warning Cards */}
</section>
```

**동일 패턴**: 인 (Phosphorus) 섹션 (lines 155-166)

---

### P0-2: Safe/Warning Food Cards (녹색/빨간색)

**Source Location**: `frontend/src/pages/DietCarePage.tsx:102-152`

```tsx
<div className="grid md:grid-cols-2 gap-6">
  {/* Safe Foods - 녹색 체크 아이콘 */}
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
      {/* ... */}
    </div>
  </div>

  {/* Warning Foods - 빨간색 경고 아이콘 */}
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
      {/* ... */}
    </div>
  </div>
</div>
```

---

### P1-1: Goal Setting Form

**Source Location**: `frontend/src/pages/DietCarePage.tsx:230-281`

```tsx
{/* Diet Log 탭 - 목표 설정 */}
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
```

---

### P1-2: Meal Entry Cards

**Source Location**: `frontend/src/pages/DietCarePage.tsx:291-319`

```tsx
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
```

---

## 3. 인라인 탭 vs 라우트 기반 비교

| 항목 | frontend/ (인라인) | new_frontend/ (라우트) |
|------|---------------------|------------------------|
| URL 변화 | ❌ 없음 | ✅ /diet-care/nutri-coach, /diet-care/diet-log |
| 새로고침 시 | 첫 탭으로 이동 | 현재 탭 유지 |
| 브라우저 뒤로가기 | 페이지 이탈 | 탭 전환 가능 |
| SEO | ❌ 단일 URL | ✅ 개별 URL |
| 코드 분리 | 단일 파일 | 컴포넌트 분리 |

**권장**: new_frontend의 라우트 기반 유지, 스타일만 참고

---

## 4. 식품 영양 데이터

**칼륨 (Potassium) 데이터**:
```typescript
const potassiumData = {
  safe: {
    과일: ['사과', '베리류', '체리', '포도', '배', '파인애플', '수박'],
    채소: ['양배추', '오이', '가지', '상추', '양파', '피망', '무'],
    곡물: ['흰 쌀밥', '흰 빵', '파스타', '크래커'],
    기타: ['초콜릿', '커피']
  },
  warning: {
    과일: ['바나나', '오렌지', '키위', '멜론', '아보카도', '토마토'],
    채소: ['시금치', '감자', '고구마', '호박', '브로콜리', '당근', '버섯'],
    견과류: ['모든 견과류']
  }
};
```

**인 (Phosphorus) 데이터**:
```typescript
const phosphorusData = {
  safe: {
    단백질: ['신선한 닭고기', '계란', '생선(참치, 연어)'],
    유제품대체: ['쌀 우유', '아몬드 우유', '두유(무인 제품)'],
    곡물: ['흰 쌀밥', '파스타'],
    스낵: ['무염 팝콘', '쌀과자', '과일 스낵']
  },
  warning: {
    단백질: ['붉은 육류', '햄/소시지', '치즈', '우유', '요구르트'],
    가공식품: ['냉동식품', '인스턴트 식품'],
    음료: ['콜라/탄산음료', '맥주'],
    기타: ['견과류', '초콜릿']
  }
};
```

---

## 5. 구현 계획

### Phase 1: Educational Headers + Safe/Warning Cards

1. `NutriCoachContent.tsx`에 교육 섹션 추가
2. `SafeFoodCard`, `WarningFoodCard` 컴포넌트 생성
3. 영양소별 데이터 정의

### Phase 2: Goal Setting Form

1. `DietLogContent.tsx`에 목표 설정 UI 추가
2. localStorage 또는 API로 목표값 저장
3. 그라디언트 배경 카드 스타일 적용

### Phase 3: Meal Entry Cards

1. 식사 기록 카드 UI 구현
2. 칼로리 배지 스타일 적용
3. 음식 태그 나열 UI

---

## 6. 스타일 가이드라인

| 요소 | 값 |
|------|-----|
| Safe 아이콘 배경 | `bg-[#22C55E]` (녹색) |
| Warning 아이콘 | `text-[#EF4444]` (빨간색) |
| 카드 border radius | `rounded-2xl` |
| 목표 카드 배경 | `linear-gradient(135deg, #F2FFFD 0%, #F8F4FE 100%)` |
| 칼로리 배지 | `bg-[#F3F4F6] text-[#00C9B7]` |
| 음식 태그 | `bg-[#F9FAFB] text-[#4B5563]` |

---

## 7. 의료 컨텍스트 UX

| UX 원칙 | 적용 |
|---------|------|
| **Single-Page Experience** | 인라인 탭으로 빠른 전환 (라우트 기반으로 유지하되 전환 애니메이션 추가) |
| **Medical Context** | 각 영양소의 "왜"를 설명하는 교육 콘텐츠 |
| **Visual Safety** | 녹색/빨간색으로 안전/위험 음식 직관적 구분 |
| **Goal Tracking** | 일일 영양 목표 시각화 |

---

*Generated: 2025-11-27*
