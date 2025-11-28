# PR25-PLAN-QuizListPage

## QuizListPage 이식 상세 계획서

**Source**: `frontend/src/pages/QuizListPage.tsx` (227 lines)
**Target**: `new_frontend/src/pages/QuizListPage.tsx` (241 lines)

---

## ⚡ 역방향 이식 케이스

**new_frontend가 더 발전된 디자인을 보유**

| 기능 | frontend/ | new_frontend/ | 결론 |
|------|-----------|---------------|------|
| Featured Daily Quiz | ❌ 없음 | ✅ 그라디언트 카드 (109-135) | **new_frontend 유지** |
| Progress Bar | ❌ 없음 | ✅ 완료율 프로그레스 바 (138-152) | **new_frontend 유지** |
| Stats Cards | ✅ 동일 | ✅ 동일 | 동일 |
| Quiz List | ✅ 동일 구조 | ✅ 동일 구조 | 동일 |
| Level Test Section | ✅ 분리됨 (124-170) | ❌ 통합됨 | 스타일 참고 |

---

## 1. new_frontend 우수 기능 (유지)

### Featured Daily Quiz Card

**Source Location**: `new_frontend/src/pages/QuizListPage.tsx:109-135`

```tsx
{/* 오늘의 퀴즈 섹션 */}
<div className="mb-8 p-6 rounded-xl border-2 border-[#00C9B7] bg-gradient-to-r from-[#E6F9F7] to-[#F0FDF4]">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={24} className="text-[#00C9B7]" strokeWidth={2} />
        <h3 className="text-lg font-bold text-[#1F2937]">오늘의 퀴즈</h3>
      </div>
      <p className="text-sm text-[#666666] mb-4 leading-relaxed">
        매일 새로운 문제로 신장병 지식을 쌓아보세요!<br />
        난이도를 선택해서 5문제를 풀어보세요.
      </p>
      <button
        onClick={handleDailyQuizStart}
        className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg active:scale-95"
        style={{ background: 'linear-gradient(135deg, #00C9B7 0%, #9F7AEA 100%)' }}
      >
        <span className="flex items-center gap-2">
          <Target size={18} />
          시작하기
        </span>
      </button>
    </div>
    <div className="hidden md:flex items-center justify-center w-24 h-24 rounded-full bg-white/50">
      <Trophy size={48} className="text-[#00C9B7]" strokeWidth={1.5} />
    </div>
  </div>
</div>
```

---

### Progress Bar

**Source Location**: `new_frontend/src/pages/QuizListPage.tsx:138-152`

```tsx
{/* 학습 진행도 */}
<div className="mb-6">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-[#666666]">학습 진행도</span>
    <span className="text-sm font-bold text-[#00C9B7]">{completedCount}/{quizList.length} 완료 ({progressPercent}%)</span>
  </div>
  <div className="w-full bg-[#E5E7EB] rounded-full h-3">
    <div
      className="h-3 rounded-full transition-all duration-500"
      style={{
        width: `${progressPercent}%`,
        background: 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)'
      }}
    />
  </div>
</div>
```

---

## 2. frontend에서 참고할 기능

### Level Test Section 분리

**Source Location**: `frontend/src/pages/QuizListPage.tsx:124-170`

```tsx
{/* Level Test Section */}
<h2 className="text-lg font-bold text-[#1F2937] mb-4">레벨 테스트</h2>

{/* First Quiz - Level Test */}
<div className="grid gap-4 mb-8">
  <button
    onClick={() => navigate(`/quiz/${quizList[0].id}`)}
    className="w-full text-left p-5 rounded-xl border border-[#E0E0E0] bg-white hover:bg-gray-50 transition-colors relative group"
    style={{ boxShadow: 'none' }}
  >
    {/* ... */}
  </button>
</div>

{/* Daily Quiz Section */}
<h2 className="text-lg font-bold text-[#1F2937] mb-4">오늘의 한입 퀴즈</h2>

{/* Remaining Quizzes */}
<div className="grid gap-4">
  {quizList.slice(1).map((quiz) => (
    <button key={quiz.id} ... >
      {/* ... */}
    </button>
  ))}
</div>
```

**vs new_frontend**: 단일 "O/X 퀴즈" 제목 아래 모든 퀴즈 나열

---

## 3. 비교 테이블

| 요소 | frontend/ | new_frontend/ | 권장 |
|------|-----------|---------------|------|
| **일일 퀴즈 CTA** | 없음 | ✅ 그라디언트 카드 | new_frontend |
| **진행도 바** | 없음 | ✅ 프로그레스 바 | new_frontend |
| **섹션 분리** | ✅ 레벨테스트 / 일일퀴즈 분리 | ❌ 통합 | frontend 참고 |
| **퀴즈 라우팅** | `/quiz/${quizId}` | `/quiz/play` + state | new_frontend |
| **난이도 선택** | 암시적 | 명시적 (state 전달) | new_frontend |

---

## 4. 통합 제안

**new_frontend 구조 유지 + frontend 섹션 분리 적용**:

```
QuizListPage
├── Mobile Header
├── 오늘의 퀴즈 카드 (new_frontend 유지)
├── 학습 진행도 (new_frontend 유지)
├── Stats Cards (동일)
├── [개선] 레벨 테스트 섹션
│   └── 첫 번째 퀴즈 (기본 상식)
└── [개선] 레벨별 퀴즈 섹션
    └── 나머지 퀴즈들 (2~5레벨)
```

---

## 5. 네비게이션 로직 비교

**frontend/**:
```tsx
onClick={() => navigate(`/quiz/${quizList[0].id}`)}
```

**new_frontend/**:
```tsx
const handleLevelQuizStart = (quizId: string, quizTitle: string, quizLevel: string) => {
  navigate(`/quiz/play`, {
    state: {
      mode: 'level',
      quizTitle,
      quizLevel,
      levelId: quizId,
    }
  });
};

const handleDailyQuizStart = () => {
  navigate('/quiz/play', {
    state: { mode: 'daily' }
  });
};
```

**권장**: new_frontend 방식 유지 (더 유연한 퀴즈 모드 지원)

---

## 6. 스타일 비교

| 요소 | frontend/ | new_frontend/ |
|------|-----------|---------------|
| Featured Card 배경 | 없음 | `bg-gradient-to-r from-[#E6F9F7] to-[#F0FDF4]` |
| Featured Card 테두리 | 없음 | `border-2 border-[#00C9B7]` |
| 시작 버튼 | 없음 | `linear-gradient(135deg, #00C9B7 0%, #9F7AEA 100%)` |
| 진행도 바 | 없음 | `linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)` |
| 퀴즈 카드 | `border border-[#E0E0E0]` | `border border-[#E0E0E0]` (동일) |
| 완료 배지 | `bg-[#E6F9F7] text-[#00C9B7]` | `bg-[#E6F9F7] text-[#00C9B7]` (동일) |

---

## 7. 구현 계획

### Phase 1: 섹션 분리 적용

1. "레벨 테스트" 섹션 제목 추가
2. 첫 번째 퀴즈(기본 상식) 분리
3. "레벨별 퀴즈" 섹션 제목 추가

### Phase 2: UI 개선 (선택)

1. 완료한 퀴즈에 시각적 피드백 강화
2. 다음 도전 가능 퀴즈 하이라이트
3. 레벨 잠금 표시 (선행 퀴즈 미완료 시)

---

## 8. 수정 필요 코드

**현재 new_frontend**:
```tsx
{/* Quiz List Title */}
<h2 className="text-lg font-bold text-[#1F2937] mb-4">O/X 퀴즈</h2>

{/* Quiz List */}
<div className="grid gap-4">
  {quizList.map((quiz) => (
    <button key={quiz.id} ... />
  ))}
</div>
```

**개선 후**:
```tsx
{/* 레벨 테스트 섹션 */}
<h2 className="text-lg font-bold text-[#1F2937] mb-4">레벨 테스트</h2>
<div className="grid gap-4 mb-8">
  <button onClick={() => handleLevelQuizStart(quizList[0].id, quizList[0].title, quizList[0].level)}>
    {/* 첫 번째 퀴즈 */}
  </button>
</div>

{/* 레벨별 퀴즈 섹션 */}
<h2 className="text-lg font-bold text-[#1F2937] mb-4">레벨별 퀴즈</h2>
<div className="grid gap-4">
  {quizList.slice(1).map((quiz) => (
    <button key={quiz.id} ... />
  ))}
</div>
```

---

## 9. 결론

| 항목 | 결정 |
|------|------|
| 기본 구조 | **new_frontend 유지** |
| Featured Daily Quiz | **new_frontend 유지** |
| Progress Bar | **new_frontend 유지** |
| 섹션 분리 | **frontend 스타일 적용** |
| 네비게이션 | **new_frontend 유지** |

---

*Generated: 2025-11-27*
