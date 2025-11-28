# PR25-PLAN-SupportPage

## SupportPage 이식 상세 계획서

**Source**: `frontend/src/pages/SupportPage.tsx` (307 lines)
**Target**: `new_frontend/src/pages/SupportPage.tsx`

---

## ✅ Migration Status: 불필요

**두 버전이 기능적으로 동일함. 스타일링 차이만 존재.**

---

## 1. 기능 비교 테이블

| 기능 | frontend/ | new_frontend/ | 이식 필요 |
|------|-----------|---------------|-----------|
| FAQ Accordion | ✅ 있음 | ✅ 동일 | ❌ |
| Contact Form | ✅ 있음 | ✅ 동일 | ❌ |
| Usage Guide | ✅ 있음 | ✅ 동일 | ❌ |
| 3-Tab System | ✅ 있음 | ✅ 동일 | ❌ |
| Mobile Header | ✅ 있음 | ✅ 동일 | ❌ |

---

## 2. 스타일 차이점

| 요소 | frontend/ | new_frontend/ (예상) |
|------|-----------|----------------------|
| 탭 활성 색상 | `#00C8B4` | `#00C8B4` |
| 탭 밑줄 색상 | `#9F7AEA` (보라) | `#9F7AEA` (보라) |
| FAQ 확장 border | `#00C8B4` | `#00C8B4` |
| 아이콘 색상 | `#00C8B4` | `#00C8B4` |
| 버튼 스타일 | `btn-primary` | `btn-primary` |

---

## 3. 코드 구조

### Tab Type
```typescript
type TabType = 'faq' | 'contact' | 'guide';
```

### FAQ Data
```typescript
const faqs = [
  {
    question: '신장병 환자가 주의해야 할 음식은 무엇인가요?',
    answer: '신장병 환자는 칼륨, 인, 나트륨이 높은 음식을 제한해야 합니다...'
  },
  {
    question: '투석은 언제부터 시작해야 하나요?',
    answer: '일반적으로 사구체 여과율(GFR)이 15 이하로 떨어지거나...'
  },
  {
    question: 'AI 챗봇은 어떻게 활용하나요?',
    answer: 'AI 챗봇 페이지에서 의료/복지, 식이/영양, 연구/논문 중...'
  },
  {
    question: '퀴즈 레벨은 어떻게 올리나요?',
    answer: '각 레벨 퀴즈에서 10문제 중 8개 이상 맞추면...'
  },
  {
    question: '커뮤니티에서 다른 환우와 소통하려면?',
    answer: '커뮤니티 페이지에서 게시글을 작성하고 댓글을 달 수 있습니다...'
  }
];
```

---

## 4. 탭별 컨텐츠

### FAQ Tab (자주 묻는 질문)
- 아코디언 형태의 질문/답변
- 클릭 시 확장/축소
- 확장 시 border 색상 변경 (`#00C8B4`)

### Contact Tab (문의하기)
- 3개의 연락처 카드 (채팅, 이메일, 전화)
- 문의 폼 (이름, 이메일, 제목, 내용)
- 제출 시 alert 표시

### Guide Tab (사용 가이드)
- AI 챗봇 사용법
- 식단 케어 기능
- 퀴즈 미션 가이드

---

## 5. 컴포넌트 구조

```
SupportPage
├── Mobile Header
├── Desktop Title (lg:block)
├── Tab Navigation
│   ├── 자주 묻는 질문
│   ├── 문의하기
│   └── 사용 가이드
└── Tab Content
    ├── FAQ (Accordion)
    ├── Contact (Form + Cards)
    └── Guide (Ordered Lists)
```

---

## 6. 스타일 상수

```tsx
// Tab 활성 스타일
const activeTabStyle = {
  color: '#00C8B4',
  fontWeight: 'bold',
  borderBottom: '2px solid #9F7AEA'
};

// Tab 비활성 스타일
const inactiveTabStyle = {
  color: '#999999',
  fontWeight: 'normal'
};

// FAQ 확장 border
const expandedFaqStyle = {
  borderColor: '#00C8B4'
};

// 아이콘 색상
const iconColor = '#00C8B4';
```

---

## 7. 결론

| 항목 | 결정 |
|------|------|
| **Migration 필요성** | ❌ 불필요 |
| **이유** | 두 버전이 기능적으로 동일 |
| **권장 조치** | 스타일 일관성 검토 후 minor 조정만 |

---

## 8. 참고: 기존 코드 구조 (frontend/)

```tsx
export function SupportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile Header */}
      {/* Tabs */}
      {/* Content based on activeTab */}
    </div>
  );
}
```

---

## 9. new_frontend에 이미 존재하는지 확인 필요

| 파일 경로 | 상태 |
|-----------|------|
| `new_frontend/src/pages/SupportPage.tsx` | 확인 필요 |
| `new_frontend/src/pages/SupportPageEnhanced.tsx` | 확인 필요 |

**존재하지 않을 경우**: frontend/에서 복사 후 import 경로만 수정

**존재할 경우**: 스타일 비교 후 일관성 확인

---

*Generated: 2025-11-27*
