# MyPage Modals

마이페이지의 모달 컴포넌트들을 독립적인 파일로 분리한 컬렉션입니다.

## 파일 구조

```
modals/
├── index.ts                      # 통합 export 파일
├── ProfileEditModal.tsx          # 프로필 편집 모달
├── HealthProfileModal.tsx        # 건강 프로필 모달
├── SettingsModal.tsx             # 환경 설정 모달
├── BookmarkedPapersModal.tsx     # 북마크한 논문 모달
└── MyPostsModal.tsx              # 내 게시글 모달
```

## 주요 개선사항

### 1. 접근성 (Accessibility)
- `role`, `aria-modal`, `aria-labelledby` 등의 ARIA 속성 추가
- 모든 버튼에 `aria-label` 추가
- 포커스 가능한 요소에 적절한 레이블 제공

### 2. 키보드 지원
- **ESC 키**: 모달 닫기
- **Tab 키**: 포커스 트랩 (모달 내부에서만 이동)
- **Enter 키**: 입력 필드에서 항목 추가

### 3. 사용자 경험
- 로딩 상태 표시 (`isSubmitting`)
- 모달 열릴 때 자동 포커스
- 스크롤 방지 (body overflow 제어)
- 비어있는 상태 메시지

## 사용 방법

### 기본 사용

```tsx
import {
  ProfileEditModal,
  HealthProfileModal,
  SettingsModal,
  BookmarkedPapersModal,
  MyPostsModal
} from '@/components/mypage/modals';

function MyPageComponent() {
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  return (
    <ProfileEditModal
      isOpen={isProfileModalOpen}
      onClose={() => setProfileModalOpen(false)}
      user={{
        fullName: '홍길동',
        email: 'hong@example.com',
        phone: '010-1234-5678',
        birthDate: '1990-01-01'
      }}
      onSave={(data) => {
        console.log('Saved:', data);
        // API 호출 등
      }}
    />
  );
}
```

### 1. ProfileEditModal

프로필 정보를 수정하는 모달입니다.

```tsx
<ProfileEditModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  user={{
    fullName: '홍길동',
    email: 'user@example.com',
    phone: '010-1234-5678',
    birthDate: '1990-01-01',
    avatar: '/path/to/avatar.jpg'
  }}
  onSave={(data) => {
    // data: { fullName, email, phone, birthDate }
    updateProfile(data);
  }}
/>
```

**Props:**
- `isOpen`: boolean - 모달 표시 여부
- `onClose`: () => void - 모달 닫기 핸들러
- `user`: 사용자 정보 객체
- `onSave`: (data: ProfileFormData) => void - 저장 핸들러

### 2. HealthProfileModal

건강 프로필을 설정하는 모달입니다.

```tsx
<HealthProfileModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={(data) => {
    // data: { conditions, allergies, medications, bloodType, height, weight }
    saveHealthProfile(data);
  }}
/>
```

**탭 구조:**
- 질환: 기존 질환 체크박스 선택
- 알레르기: 알레르기 및 복용 약물 입력
- 기본 정보: 혈액형, 키, 몸무게 입력

### 3. SettingsModal

환경 설정 모달입니다.

```tsx
<SettingsModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={(settings) => {
    // settings: { notifications, privacy, preferences }
    updateSettings(settings);
  }}
/>
```

**설정 항목:**
- 알림: 이메일, 푸시, 커뮤니티 알림
- 개인정보: 프로필 공개, 활동 공개
- 환경: 언어, 테마

### 4. BookmarkedPapersModal

북마크한 논문 목록을 표시하는 모달입니다.

```tsx
<BookmarkedPapersModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  papers={[
    {
      id: '1',
      title: '논문 제목',
      authors: '저자명',
      journal: '학술지명',
      year: '2024',
      bookmarkedAt: '2024-01-01T00:00:00Z'
    }
  ]}
  onRemoveBookmark={(paperId) => {
    removeBookmark(paperId);
  }}
/>
```

### 5. MyPostsModal

작성한 게시글 목록을 표시하는 모달입니다.

```tsx
<MyPostsModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  posts={[
    {
      id: '1',
      title: '게시글 제목',
      content: '게시글 내용',
      postType: 'BOARD', // 'BOARD' | 'CHALLENGE' | 'SURVEY'
      likes: 10,
      commentCount: 5,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ]}
  onDeletePost={(postId) => {
    deletePost(postId);
  }}
/>
```

## 공통 패턴

### 모달 구조

모든 모달은 다음과 같은 공통 구조를 따릅니다:

```tsx
<>
  {/* Backdrop - 클릭시 모달 닫기 */}
  <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-40" />

  {/* Modal Container */}
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
    <div ref={modalRef} className="bg-white rounded-2xl shadow-xl">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h2 id="modal-title">제목</h2>
        <button onClick={onClose} aria-label="모달 닫기">
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* 모달 내용 */}
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4">
        <button onClick={onClose}>취소</button>
        <button onClick={handleSubmit}>저장</button>
      </div>
    </div>
  </div>
</>
```

### 상태 관리

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    await onSave(data);
    onClose();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setIsSubmitting(false);
  }
};
```

## 스타일링

모든 모달은 프로젝트의 디자인 시스템을 따릅니다:

- CSS 변수 사용: `var(--color-primary)`, `var(--color-accent-purple)` 등
- 공통 클래스: `btn-primary`, `btn-ghost`, `input-field` 등
- 반응형 디자인: `max-w-md`, `max-w-2xl` 등

## 테스트

각 모달은 다음과 같은 사항을 테스트해야 합니다:

```tsx
describe('ProfileEditModal', () => {
  it('should open and close', () => {
    // 모달 열기/닫기 테스트
  });

  it('should close on ESC key', () => {
    // ESC 키 테스트
  });

  it('should trap focus', () => {
    // 포커스 트랩 테스트
  });

  it('should submit form data', () => {
    // 폼 제출 테스트
  });
});
```

## 마이그레이션 가이드

기존 `MyPageModals.tsx`에서 분리된 컴포넌트로 마이그레이션:

### Before
```tsx
import { ProfileEditModal } from '@/components/mypage/MyPageModals';
```

### After
```tsx
import { ProfileEditModal } from '@/components/mypage/modals';
```

모든 Props와 동작은 동일하게 유지됩니다.

## 의존성

각 모달은 다음 라이브러리에 의존합니다:

- `react`: ^18.x
- `lucide-react`: 아이콘
- `@/components/mypage/shared/SettingToggle`: SettingsModal에서 사용

## 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 참고 자료

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Modal Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [React Hooks Documentation](https://react.dev/reference/react)
