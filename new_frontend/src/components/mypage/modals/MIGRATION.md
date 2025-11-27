# MyPageModals 분리 완료 보고서

## 개요

`MyPageModals.tsx` (1,088줄)를 5개의 독립적인 모달 컴포넌트와 1개의 공유 컴포넌트로 분리했습니다.

## 파일 구조

### Before (1개 파일)
```
MyPageModals.tsx (1,088줄)
```

### After (7개 파일)
```
modals/
├── ProfileEditModal.tsx          304줄  (프로필 편집)
├── HealthProfileModal.tsx        466줄  (건강 프로필)
├── SettingsModal.tsx             326줄  (환경 설정)
├── BookmarkedPapersModal.tsx     192줄  (북마크한 논문)
├── MyPostsModal.tsx              231줄  (내 게시글)
├── index.ts                       10줄  (통합 export)
└── README.md                     (문서)

shared/
└── SettingToggle.tsx              36줄  (설정 토글 컴포넌트)

Total: 1,565줄 (문서 제외)
```

## 주요 개선사항

### 1. 접근성 (Accessibility) 강화

#### Before
```tsx
<div className="fixed inset-0 z-50">
  <div>
    <h2>프로필 수정</h2>
    <button onClick={onClose}><X /></button>
  </div>
</div>
```

#### After
```tsx
<div
  className="fixed inset-0 z-50"
  role="dialog"
  aria-modal="true"
  aria-labelledby="profile-edit-title"
>
  <div ref={modalRef}>
    <h2 id="profile-edit-title">프로필 수정</h2>
    <button onClick={onClose} aria-label="모달 닫기">
      <X size={24} />
    </button>
  </div>
</div>
```

**추가된 접근성 기능:**
- `role="dialog"`, `aria-modal="true"` - 스크린 리더 지원
- `aria-labelledby` - 모달 제목과 연결
- `aria-label` - 모든 버튼에 설명 추가
- `aria-required` - 필수 입력 필드 표시
- `aria-busy` - 제출 중 상태 표시

### 2. ESC 키로 모달 닫기

```tsx
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };

  if (isOpen) {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden'; // 스크롤 방지
  }

  return () => {
    document.removeEventListener('keydown', handleEscape);
    document.body.style.overflow = 'unset';
  };
}, [isOpen, onClose]);
```

### 3. 포커스 트랩 (Focus Trap)

```tsx
useEffect(() => {
  if (!isOpen) return;

  const modal = modalRef.current;
  if (!modal) return;

  const focusableElements = modal.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  modal.addEventListener('keydown', handleTab as EventListener);
  return () => modal.removeEventListener('keydown', handleTab as EventListener);
}, [isOpen]);
```

### 4. 로딩/에러 상태 처리

#### Before
```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSave(formData);
  onClose();
};
```

#### After
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    await onSave(formData);
    onClose();
  } catch (error) {
    console.error('Failed to save profile:', error);
    // 에러 처리 로직
  } finally {
    setIsSubmitting(false);
  }
};

// 버튼에 상태 반영
<button
  type="submit"
  className="btn-primary flex-1"
  disabled={isSubmitting}
  aria-busy={isSubmitting}
>
  {isSubmitting ? '저장 중...' : '저장'}
</button>
```

### 5. 자동 포커스

```tsx
const closeButtonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (isOpen) {
    closeButtonRef.current?.focus(); // 모달 열릴 때 닫기 버튼에 포커스
  }
}, [isOpen]);

<button
  ref={closeButtonRef}
  onClick={onClose}
  aria-label="모달 닫기"
>
  <X size={24} />
</button>
```

## 모듈별 특징

### 1. ProfileEditModal (304줄)
- 프로필 사진 업로드 with 미리보기
- 필수/선택 입력 필드 구분
- 실시간 폼 검증 지원 준비

### 2. HealthProfileModal (466줄)
- 3개 탭: 질환, 알레르기, 기본 정보
- 동적 항목 추가/삭제
- Tab 키보드 네비게이션
- `role="tablist"`, `aria-selected` 지원

### 3. SettingsModal (326줄)
- SettingToggle 컴포넌트 재사용
- 카테고리별 설정 그룹화
- Select 드롭다운 지원

### 4. BookmarkedPapersModal (192줄)
- 북마크 목록 표시
- 빈 상태 처리
- 호버 시 삭제 버튼 표시

### 5. MyPostsModal (231줄)
- 게시글 타입별 배지
- 통계 표시 (좋아요, 댓글)
- 호버 시 삭제 버튼 표시

## 공유 컴포넌트

### SettingToggle (36줄)
- 재사용 가능한 토글 스위치
- 레이블과 설명 지원
- 접근성 속성 포함

```tsx
<SettingToggle
  label="이메일 알림"
  description="중요한 소식을 이메일로 받습니다"
  checked={settings.notifications.email}
  onChange={(checked) => updateSetting('email', checked)}
/>
```

## 사용 예시

### 간단한 사용
```tsx
import { ProfileEditModal } from '@/components/mypage/modals';

function MyPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>프로필 수정</button>

      <ProfileEditModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={userData}
        onSave={handleSave}
      />
    </>
  );
}
```

### 모든 모달 import
```tsx
import {
  ProfileEditModal,
  HealthProfileModal,
  SettingsModal,
  BookmarkedPapersModal,
  MyPostsModal
} from '@/components/mypage/modals';
```

## 테스트 체크리스트

각 모달에 대해 다음을 확인해야 합니다:

- [ ] ESC 키로 닫기
- [ ] Backdrop 클릭으로 닫기
- [ ] Tab 키로 포커스 이동 (모달 내부만)
- [ ] Shift+Tab으로 역방향 포커스 이동
- [ ] 모달 열릴 때 스크롤 방지
- [ ] 모달 닫힐 때 스크롤 복원
- [ ] 스크린 리더 접근성
- [ ] 로딩 상태 표시
- [ ] 에러 처리
- [ ] 빈 상태 표시

## 성능 고려사항

1. **Lazy Loading**: 필요한 모달만 import
   ```tsx
   const ProfileEditModal = lazy(() =>
     import('@/components/mypage/modals').then(m => ({ default: m.ProfileEditModal }))
   );
   ```

2. **Memoization**: 불필요한 리렌더링 방지
   ```tsx
   const MemoizedModal = memo(ProfileEditModal);
   ```

3. **조건부 렌더링**: `isOpen`이 false일 때 early return

## 브라우저 호환성

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 마이그레이션 체크리스트

- [x] 파일 분리 완료
- [x] 접근성 개선
- [x] ESC 키 지원
- [x] 포커스 트랩 구현
- [x] 로딩 상태 처리
- [x] 에러 처리 준비
- [x] 공유 컴포넌트 분리
- [x] Export 통합
- [x] TypeScript 타입 체크
- [x] 문서 작성
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] E2E 테스트 작성
- [ ] 기존 파일 제거 (확인 후)

## 다음 단계

1. **테스트 작성**
   - Jest + React Testing Library
   - 사용자 인터랙션 테스트
   - 접근성 테스트 (jest-axe)

2. **성능 최적화**
   - 모달별 lazy loading
   - 애니메이션 추가 (framer-motion)

3. **문서화**
   - Storybook 스토리 추가
   - 사용 가이드 작성

4. **기존 코드 정리**
   - MyPageModals.tsx 제거
   - Import 경로 업데이트

## 참고 자료

- [WAI-ARIA Authoring Practices - Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [React Accessibility - Focus Management](https://react.dev/learn/accessibility#focus-management)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
