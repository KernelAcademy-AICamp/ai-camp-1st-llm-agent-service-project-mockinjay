# PR25-PLAN-MyPage

## MyPage 이식 상세 계획서

**Source**: `frontend/src/pages/MyPage.tsx` (358 lines)
**Target**: `new_frontend/src/pages/MyPage.tsx` (신규 생성 필요)

---

## 1. 기능 비교 테이블

| 기능 | frontend/ | new_frontend/ | 이식 필요 |
|------|-----------|---------------|-----------|
| Profile Card with Stats | ✅ 그라디언트 + 포인트/레벨/토큰 (82-139) | ❌ 없음 | **P0 필수** |
| 3-Tab System | ✅ 계정/개인/질환 (142-146) | ❌ 없음 | **P0 필수** |
| Editable Forms | ✅ 인라인 수정 (150-298) | ❌ 없음 | **P0 필수** |
| Action Cards | ✅ 병원 검사, 구독/결제 (302-329) | ❌ 없음 | **P1 권장** |
| Account Withdrawal | ✅ 회원 탈퇴 버튼 (340-349) | ❌ 없음 | **P1 권장** |
| CKD Stage Selection | ✅ 10가지 옵션 (49-60) | ❌ 없음 | **P0 필수** |
| Notification Bell | ✅ 알림 아이콘 (96-104) | ❌ 없음 | **P2 선택** |

---

## 2. 이식할 코드 스니펫

### P0-1: Profile Card with Stats

**Source Location**: `frontend/src/pages/MyPage.tsx:82-139`

```tsx
{/* Profile Card - 그라디언트 배경 */}
<div className="bg-gradient-to-r from-[#F2FFFD] to-[#F8F4FE] rounded-xl p-6 mb-8 border border-[#E5E7EB]">
  <div className="flex items-center gap-4 mb-4">
    {/* Profile Icon - 그라디언트 원형 */}
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

  {/* User Info Grid - 포인트/레벨/토큰/구독 */}
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
```

---

### P0-2: 3-Tab System (TabButton 컴포넌트)

**Source Location**: `frontend/src/pages/MyPage.tsx:35-47, 142-146`

```tsx
// TabButton 컴포넌트
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

// 탭 사용
<div className="flex border-b border-[#E5E7EB] mb-8">
  <TabButton id="account" label="계정정보" />
  <TabButton id="personal" label="개인정보" />
  <TabButton id="disease" label="질환정보" />
</div>
```

---

### P0-3: Editable Forms (계정정보 탭)

**Source Location**: `frontend/src/pages/MyPage.tsx:150-179`

```tsx
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
```

---

### P0-4: CKD Stage Selection (질환정보 탭)

**Source Location**: `frontend/src/pages/MyPage.tsx:49-60, 275-298`

```tsx
// 질환 옵션 데이터
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

// 질환정보 탭 UI
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
```

---

### P1-1: Action Cards (병원검사결과, 구독결제)

**Source Location**: `frontend/src/pages/MyPage.tsx:302-329`

```tsx
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
```

---

### P1-2: Logout / Account Withdrawal

**Source Location**: `frontend/src/pages/MyPage.tsx:331-350`

```tsx
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
```

---

## 3. State 관리

```typescript
// Form States
const [activeTab, setActiveTab] = useState<'account' | 'personal' | 'disease'>('personal');

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
```

---

## 4. 구현 계획

### Phase 1: 기본 페이지 구조

1. `new_frontend/src/pages/MyPage.tsx` 생성
2. MobileHeader + 타이틀 섹션 구현
3. Profile Card with Stats 구현

### Phase 2: 3-Tab System

1. TabButton 컴포넌트 생성
2. 계정정보/개인정보/질환정보 탭 UI 구현
3. 각 탭별 폼 필드 구현

### Phase 3: Action Cards

1. 병원검사결과 카드 구현
2. 구독결제 카드 구현
3. 로그아웃/회원탈퇴 버튼 구현

### Phase 4: API 연동

1. 사용자 정보 조회 API 연동
2. 정보 수정 API 연동
3. Backend `/api/mypage` 엔드포인트 확인

---

## 5. 스타일 가이드라인

| 요소 | 값 |
|------|-----|
| Profile Card 배경 | `bg-gradient-to-r from-[#F2FFFD] to-[#F8F4FE]` |
| Profile Icon | `bg-gradient-to-br from-[#00C9B7] to-[#9F7AEA]` |
| 활성 탭 색상 | `text-[#00C9B7]` |
| 탭 밑줄 | `bg-[#9F7AEA]` (보라색) |
| 저장 버튼 | `linear-gradient(90deg, #00C9B7 0%, #7C3AED 100%)` |
| 포인트 아이콘 | `text-[#FFB84D]` (노란색) |
| 레벨 배경 | `bg-[#9F7AEA]` (보라색) |
| 토큰 아이콘 | `text-[#00C9B7]` (틸) |

---

## 6. Dependencies

| 아이콘 | import |
|--------|--------|
| Calendar | `lucide-react` |
| Check | `lucide-react` |
| Save | `lucide-react` |
| FileText | `lucide-react` |
| LogOut | `lucide-react` |
| XCircle | `lucide-react` |
| User | `lucide-react` |
| Star | `lucide-react` |
| Coins | `lucide-react` |
| CreditCard | `lucide-react` |
| ChevronRight | `lucide-react` |
| Bell | `lucide-react` |

---

*Generated: 2025-11-27*
