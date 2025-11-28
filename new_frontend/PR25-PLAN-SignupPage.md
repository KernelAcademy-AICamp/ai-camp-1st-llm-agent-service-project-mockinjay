# PR25-PLAN-SignupPage

## SignupPage 이식 상세 계획서

**Source**: `frontend/src/pages/SignupPage.tsx` (671 lines)
**Target**: `new_frontend/src/pages/SignupPage.tsx` (신규 생성 필요)

---

## ⚠️ CRITICAL: 법적 컴플라이언스 위험

| 위험 요소 | 설명 | 심각도 |
|-----------|------|--------|
| **약관 동의 부재** | 의료 데이터 처리에 약관 동의 필수 (GDPR/개인정보보호법) | 🔴 HIGH |
| **CKD 단계 미수집** | 맞춤형 식단 추천의 기반 데이터 누락 | 🔴 HIGH |
| **중복 확인 미구현** | 데이터 무결성 위험 | 🟡 MEDIUM |

---

## 1. 기능 비교 테이블

| 기능 | frontend/ | new_frontend/ | 이식 필요 |
|------|-----------|---------------|-----------|
| Terms Agreement | ✅ 아코디언 + API (170-278) | ❌ 없음 | **P0 필수** |
| CKD Stage Selection | ✅ 10가지 라디오 버튼 (528-589) | ❌ 없음 | **P0 필수** |
| Duplicate Check | ✅ 이메일/닉네임 중복 (293-322) | ❌ 없음 | **P0 필수** |
| 4-Step Flow | ✅ 약관→계정→개인→질환 | ❌ 없음 | **P0 필수** |
| Height/Weight | ✅ 키/체중 입력 (482-509) | ❌ 없음 | **P1 권장** |
| Gender Selection | ✅ 3가지 버튼 (443-465) | ❌ 없음 | **P1 권장** |
| User Type | ✅ 일반인/환우/연구자 (377-405) | ❌ 없음 | **P1 권장** |

---

## 2. 이식할 코드 스니펫

### P0-1: Terms Agreement (약관 동의)

**Source Location**: `frontend/src/pages/SignupPage.tsx:170-278`

```tsx
{/* Step 0: Terms Agreement */}
{currentStep === 0 && (
  <div className="space-y-6">
    <h1 className="text-center" style={{ color: '#1F2937', fontSize: '24px', fontWeight: 'bold' }}>
      약관 동의
    </h1>

    {termsData ? (
      <div className="space-y-4">
        {/* All Agreement Checkbox */}
        <div
          className="p-4 rounded-lg"
          style={{ border: '2px solid #00C9B7', backgroundColor: '#F0FDFA' }}
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={agreements.all}
                onChange={(e) => handleAllAgreement(e.target.checked)}
                className="w-5 h-5 rounded appearance-none border-2 cursor-pointer transition-all duration-200"
                style={{
                  borderColor: agreements.all ? 'rgb(0, 201, 183)' : '#D1D5DB',
                  backgroundColor: agreements.all ? 'rgb(0, 201, 183)' : 'white'
                }}
              />
              {agreements.all && (
                <Check size={14} color="#FFFFFF" strokeWidth={3} className="absolute pointer-events-none" />
              )}
            </div>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>
              서비스 전체 약관에 동의합니다.
            </span>
          </label>
        </div>

        {/* Individual Terms */}
        <div className="space-y-3">
          <TermItem
            title={`(필수) ${termsData.service_terms.title}`}
            content={termsData.service_terms.content}
            checked={agreements.service}
            onChange={(checked) => handleAgreementChange('service', checked)}
            expanded={expandedTerms.service}
            onToggle={() => toggleTermContent('service')}
          />
          <TermItem
            title={`(필수) ${termsData.privacy_required.title}`}
            content={termsData.privacy_required.content}
            checked={agreements.privacyRequired}
            onChange={(checked) => handleAgreementChange('privacyRequired', checked)}
            expanded={expandedTerms.privacyRequired}
            onToggle={() => toggleTermContent('privacyRequired')}
          />
          <TermItem
            title={`(선택) ${termsData.privacy_optional.title}`}
            content={termsData.privacy_optional.content}
            checked={agreements.privacyOptional}
            onChange={(checked) => handleAgreementChange('privacyOptional', checked)}
            expanded={expandedTerms.privacyOptional}
            onToggle={() => toggleTermContent('privacyOptional')}
          />
          <TermItem
            title={`(선택) ${termsData.marketing.title}`}
            content={termsData.marketing.content}
            checked={agreements.marketing}
            onChange={(checked) => handleAgreementChange('marketing', checked)}
            expanded={expandedTerms.marketing}
            onToggle={() => toggleTermContent('marketing')}
          />
        </div>

        {/* Next Button */}
        <button
          onClick={handleNextStep}
          disabled={!canProceedFromTerms}
          className="w-full py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: canProceedFromTerms
              ? 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)'
              : '#E5E7EB',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          다음
        </button>
      </div>
    ) : (
      <div className="text-center py-8">
        <p style={{ color: '#9CA3AF' }}>약관을 불러오는 중...</p>
      </div>
    )}
  </div>
)}
```

---

### P0-2: TermItem 컴포넌트 (확장 가능한 약관 아이템)

**Source Location**: `frontend/src/pages/SignupPage.tsx:596-670`

```tsx
function TermItem({
  title,
  content,
  checked,
  onChange,
  expanded,
  onToggle
}: {
  title: string;
  content: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border rounded-lg" style={{ borderColor: '#E5E7EB' }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-3 cursor-pointer flex-1">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-5 h-5 rounded appearance-none border-2 cursor-pointer transition-all duration-200"
                style={{
                  borderColor: checked ? 'rgb(0, 201, 183)' : '#D1D5DB',
                  backgroundColor: checked ? 'rgb(0, 201, 183)' : 'white'
                }}
              />
              {checked && (
                <Check size={14} color="#FFFFFF" strokeWidth={3} className="absolute pointer-events-none" />
              )}
            </div>
            <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>
              {title}
            </span>
          </label>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            type="button"
          >
            {expanded ? (
              <ChevronUp size={20} color="#6B7280" />
            ) : (
              <ChevronDown size={20} color="#6B7280" />
            )}
          </button>
        </div>

        {expanded && (
          <div
            className="mt-3 p-4 rounded-lg max-h-60 overflow-y-auto"
            style={{
              backgroundColor: '#F9FAFB',
              fontSize: '12px',
              lineHeight: '1.6',
              color: '#4B5563',
              whiteSpace: 'pre-wrap'
            }}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### P0-3: CKD Stage Selection (질환 선택)

**Source Location**: `frontend/src/pages/SignupPage.tsx:528-589`

```tsx
{/* Step 3: Disease Info */}
{currentStep === 3 && (
  <div className="space-y-6">
    <h1 className="text-center" style={{ color: '#1F2937', fontSize: '24px' }}>
      질환 정보 입력
    </h1>

    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-4" style={{ fontSize: '14px', color: '#374151' }}>
          해당하는 질환을 선택해주세요
        </label>
        <div className="space-y-2">
          {diseaseOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200"
              style={{
                borderColor: diseaseInfo === option.value ? '#00C9B7' : '#E5E7EB',
                backgroundColor: diseaseInfo === option.value ? '#F0FDFA' : 'white'
              }}
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="disease"
                  checked={diseaseInfo === option.value}
                  onChange={() => handleDiseaseToggle(option.value)}
                  className="w-5 h-5 appearance-none rounded-full border-2 cursor-pointer transition-all duration-200"
                  style={{
                    borderColor: diseaseInfo === option.value ? '#00C9B7' : '#D1D5DB',
                    backgroundColor: diseaseInfo === option.value ? '#00C9B7' : 'white'
                  }}
                />
                {diseaseInfo === option.value && (
                  <Check size={14} color="#FFFFFF" strokeWidth={3} className="absolute pointer-events-none" />
                )}
              </div>
              <span style={{ fontSize: '14px', color: '#1F2937' }}>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-lg"
        style={{
          background: 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)',
          color: 'white',
          fontSize: '16px'
        }}
      >
        가입 완료
      </button>
    </form>
  </div>
)}
```

**Disease Options Data**:
```typescript
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
```

---

### P0-4: Duplicate Check (이메일/닉네임 중복 확인)

**Source Location**: `frontend/src/pages/SignupPage.tsx:293-322, 411-439`

```tsx
{/* Email with Duplicate Check */}
<div>
  <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
    아이디 (이메일)
  </label>
  <div className="flex gap-2">
    <input
      type="email"
      value={accountInfo.id}
      onChange={(e) => setAccountInfo({ ...accountInfo, id: e.target.value })}
      placeholder="이메일을 입력하세요"
      className="flex-1 px-4 py-3 rounded-lg border"
      style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
      required
    />
    <button
      type="button"
      onClick={() => {
        // TODO: 이메일 중복 체크 API 호출
        setAccountInfo({ ...accountInfo, emailChecked: true });
        alert('사용 가능한 이메일입니다.');
      }}
      className="px-4 py-3 rounded-lg whitespace-nowrap transition-all duration-200"
      style={{
        background: accountInfo.emailChecked ? 'rgb(159, 122, 234)' : '#F3F4F6',
        color: accountInfo.emailChecked ? 'white' : '#374151',
        border: accountInfo.emailChecked ? '1px solid rgb(159, 122, 234)' : '1px solid #E5E7EB',
        fontSize: '13px'
      }}
    >
      {accountInfo.emailChecked ? '확인완료' : '중복체크'}
    </button>
  </div>
</div>

{/* Nickname with Duplicate Check */}
<div>
  <label className="block mb-2" style={{ fontSize: '14px', color: '#374151' }}>
    닉네임 <span style={{ color: '#EF4444' }}>*</span>
  </label>
  <div className="flex gap-2">
    <input
      type="text"
      value={personalInfo.nickname}
      onChange={(e) => setPersonalInfo({ ...personalInfo, nickname: e.target.value })}
      placeholder="닉네임을 입력하세요"
      className="flex-1 px-4 py-3 rounded-lg border"
      style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
      required
    />
    <button
      type="button"
      onClick={() => {
        // TODO: 닉네임 중복 체크 API 호출
        setPersonalInfo({ ...personalInfo, nicknameChecked: true });
        alert('사용 가능한 닉네임입니다.');
      }}
      className="px-4 py-3 rounded-lg whitespace-nowrap transition-all duration-200"
      style={{
        background: personalInfo.nicknameChecked ? 'rgb(159, 122, 234)' : '#F3F4F6',
        color: personalInfo.nicknameChecked ? 'white' : '#374151',
        border: personalInfo.nicknameChecked ? '1px solid rgb(159, 122, 234)' : '1px solid #E5E7EB',
        fontSize: '13px'
      }}
    >
      {personalInfo.nicknameChecked ? '확인완료' : '중복체크'}
    </button>
  </div>
</div>
```

---

### P1-1: 4-Step Progress Indicator

**Source Location**: `frontend/src/pages/SignupPage.tsx:154-168`

```tsx
{/* Progress Steps */}
<div className="flex items-center justify-center gap-2">
  {[0, 1, 2, 3].map((step) => (
    <div
      key={step}
      className={`h-2 rounded-full transition-all duration-300 ${
        step === currentStep ? 'w-12' : 'w-2'
      }`}
      style={{
        background: step <= currentStep
          ? 'linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)'
          : '#E5E7EB'
      }}
    />
  ))}
</div>
```

---

## 3. Terms API 연동

**Source Location**: `frontend/src/pages/SignupPage.tsx:68-77`

```typescript
// Fetch terms data
useEffect(() => {
  fetch('/api/terms/all')
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        setTermsData(data.terms);
      }
    })
    .catch(err => console.error('Failed to fetch terms:', err));
}, []);
```

**Terms Interface**:
```typescript
interface TermsData {
  service_terms: { title: string; required: boolean; content: string };
  privacy_required: { title: string; required: boolean; content: string };
  privacy_optional: { title: string; required: boolean; content: string };
  marketing: { title: string; required: boolean; content: string };
}
```

---

## 4. State 관리

```typescript
// Step State
const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0);

// Step 0: Terms Agreement
const [termsData, setTermsData] = useState<TermsData | null>(null);
const [agreements, setAgreements] = useState({
  all: false,
  service: false,
  privacyRequired: false,
  privacyOptional: false,
  marketing: false
});
const [expandedTerms, setExpandedTerms] = useState<{[key: string]: boolean}>({});

// Step 1: Account Info
const [accountInfo, setAccountInfo] = useState({
  id: '',
  password: '',
  passwordConfirm: '',
  verified: false,
  userType: '신장병 환우',
  emailChecked: false
});

// Step 2: Personal Info
const [personalInfo, setPersonalInfo] = useState({
  nickname: '',
  gender: '',
  userType: '',
  birthDate: '',
  height: '',
  weight: '',
  nicknameChecked: false
});

// Step 3: Disease Info
const [diseaseInfo, setDiseaseInfo] = useState<string>('');
```

---

## 5. 구현 계획

### Phase 1: Terms Agreement (최우선)

1. `/api/terms/all` Backend API 확인
2. `TermItem` 컴포넌트 생성
3. 약관 동의 Step 0 구현
4. 필수 약관 체크 validation

### Phase 2: Account Info

1. Step 1 UI 구현
2. 이메일 중복 체크 API 연동
3. 비밀번호 확인 validation

### Phase 3: Personal Info

1. Step 2 UI 구현
2. 닉네임 중복 체크 API 연동
3. 사용자 유형/성별 선택 버튼

### Phase 4: Disease Info

1. Step 3 UI 구현
2. 10가지 CKD 단계 라디오 버튼
3. 회원가입 완료 처리

---

## 6. 스타일 가이드라인

| 요소 | 값 |
|------|-----|
| 전체 동의 배경 | `border: 2px solid #00C9B7, bg: #F0FDFA` |
| 체크박스 선택 | `bg: rgb(0, 201, 183)` |
| 중복체크 완료 | `bg: rgb(159, 122, 234)` (보라색) |
| 라디오 선택 배경 | `bg: #F0FDFA, border: #00C9B7` |
| 진행 인디케이터 | `linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)` |
| 다음 버튼 | `linear-gradient(90deg, #00C9B7 0%, #9F7AEA 100%)` |
| 비활성 버튼 | `bg: #E5E7EB` |

---

## 7. Backend API 요구사항

| API | Method | 설명 |
|-----|--------|------|
| `/api/terms/all` | GET | 모든 약관 내용 조회 |
| `/api/auth/check-email` | POST | 이메일 중복 확인 |
| `/api/auth/check-nickname` | POST | 닉네임 중복 확인 |
| `/api/auth/signup` | POST | 회원가입 처리 |

---

*Generated: 2025-11-27*
