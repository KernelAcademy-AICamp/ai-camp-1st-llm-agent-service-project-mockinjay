# CareGuide Icon System - Implementation Checklist

## 개발자를 위한 빠른 체크리스트

### 새로운 아이콘 추가하기

#### 1. 아이콘이 이미 시스템에 있는지 확인
```tsx
import { ALL_ICONS } from '@/config/iconSystem';
console.log(Object.keys(ALL_ICONS));
```

#### 2. 없다면 iconSystem.ts에 추가
```typescript
// config/iconSystem.ts
import { NewIcon } from 'lucide-react';

export const CUSTOM_ICONS = {
  ...
  newIcon: NewIcon,
} as const;
```

### 컴포넌트에서 아이콘 사용하기

#### ✅ 기본 아이콘
```tsx
import { Icon } from '@/components/ui';
<Icon name="heart" size="md" color="primary" />
```

#### ✅ 아이콘 버튼
```tsx
import { IconButton } from '@/components/ui';
<IconButton icon="close" aria-label="닫기" onClick={handleClose} />
```

#### ✅ 텍스트와 함께
```tsx
import { ButtonWithIcon } from '@/components/ui';
<ButtonWithIcon icon="send" variant="primary">전송</ButtonWithIcon>
```

### 접근성 체크리스트

#### 장식용 아이콘 (텍스트와 함께)
```tsx
<button>
  <Icon name="heart" aria-hidden />
  <span>좋아요</span>
</button>
```
- [ ] `aria-hidden` 속성 추가
- [ ] 텍스트 라벨 포함

#### 의미 있는 아이콘 (독립적)
```tsx
<Icon name="success" aria-label="성공" role="img" />
```
- [ ] `aria-label` 속성 추가
- [ ] `role="img"` 속성 추가

#### 상호작용 아이콘 (버튼)
```tsx
<IconButton icon="close" aria-label="닫기" />
```
- [ ] `aria-label` 속성 추가 (필수!)
- [ ] 키보드 접근 가능
- [ ] Focus 스타일 적용

### 크기 선택 가이드

| 사용 케이스 | 크기 | 예시 |
|-------------|------|------|
| Footer 아이콘 | `xs` (12px) | 저작권, 작은 링크 |
| 인라인 텍스트 | `sm` (16px) | 텍스트 옆 아이콘 |
| 네비게이션 | `md` (20px) | 사이드바, 탭 |
| 헤더 버튼 | `lg` (24px) | 상단바, 큰 버튼 |
| 아이콘 전용 | `xl` (32px) | 큰 아이콘 버튼 |
| 빈 상태 | `2xl` (48px) | Empty state |
| 스플래시 | `3xl` (64px) | 대형 일러스트 |

### 색상 선택 가이드

#### 시맨틱 색상
```tsx
<StatusIcon status="success" />  // 녹색
<StatusIcon status="error" />    // 빨강
<StatusIcon status="warning" />  // 주황
<StatusIcon status="info" />     // 파랑
```

#### 브랜드 색상
```tsx
<Icon name="heart" color="primary" />    // #00C8B4
<Icon name="heart" color="secondary" />  // #3B82F6
```

#### 중립 색상
```tsx
<Icon name="heart" color="default" />  // Gray-600
<Icon name="heart" color="muted" />    // Gray-400
```

### 일반적인 실수 피하기

#### ❌ 잘못된 사용
```tsx
// 임의의 크기 사용
<Icon name="heart" size={23} />

// aria-label 누락
<IconButton icon="close" />

// 다른 아이콘 라이브러리 혼용
import { Heart } from 'react-icons/fa'

// 의미 없는 아이콘
<Icon name="warning" />  // 무엇에 대한 경고?
```

#### ✅ 올바른 사용
```tsx
// 표준 크기 사용
<Icon name="heart" size="md" />

// aria-label 포함
<IconButton icon="close" aria-label="닫기" />

// lucide-react만 사용
import { Heart } from 'lucide-react'

// 컨텍스트 제공
<Icon name="warning" aria-label="파일 크기 초과 경고" />
```

### PR 제출 전 체크리스트

#### 코드 품질
- [ ] 모든 아이콘이 Icon 컴포넌트 사용
- [ ] 표준 크기 사용 (xs, sm, md, lg, xl, 2xl, 3xl)
- [ ] 일관된 strokeWidth 사용
- [ ] 시맨틱 색상 사용

#### 접근성
- [ ] 모든 IconButton에 aria-label 추가
- [ ] 장식용 아이콘에 aria-hidden 추가
- [ ] 의미 있는 독립 아이콘에 aria-label과 role 추가
- [ ] 키보드로 모든 버튼 접근 가능

#### 성능
- [ ] 필요한 아이콘만 import
- [ ] 컴포넌트 레벨에서 적절히 memoization
- [ ] 불필요한 re-render 방지

#### 문서화
- [ ] 복잡한 아이콘 사용에 주석 추가
- [ ] 커스텀 아이콘 추가 시 문서 업데이트

### 테스트 체크리스트

#### 시각적 테스트
- [ ] 모든 크기에서 아이콘 명확하게 표시
- [ ] 색상 대비 충분 (WCAG AA 기준)
- [ ] hover/active 상태 작동
- [ ] 반응형에서 적절한 크기

#### 기능 테스트
- [ ] 클릭 이벤트 정상 작동
- [ ] 로딩 상태 표시
- [ ] 비활성화 상태 표시
- [ ] 키보드 네비게이션 작동

#### 접근성 테스트
- [ ] 스크린 리더로 테스트
- [ ] 키보드만으로 네비게이션
- [ ] Focus visible 확인
- [ ] ARIA 속성 올바르게 설정

### 코드 리뷰 체크리스트

#### 검토자용
- [ ] Icon 시스템 사용 확인
- [ ] 접근성 속성 확인
- [ ] 일관된 스타일 확인
- [ ] 불필요한 아이콘 import 확인
- [ ] 문서화 확인

### 마이그레이션 체크리스트

#### Lucide 직접 import에서 Icon 컴포넌트로

**Before:**
```tsx
import { Heart, Send, X } from 'lucide-react';

<Heart size={20} strokeWidth={1.5} className="text-primary" />
<button><Send size={18} /></button>
<X size={16} />
```

**After:**
```tsx
import { Icon, IconButton } from '@/components/ui';

<Icon name="heart" size="md" color="primary" />
<IconButton icon="send" aria-label="전송" />
<Icon name="close" size="sm" />
```

#### 마이그레이션 단계
- [ ] 1. Icon 컴포넌트 import 추가
- [ ] 2. 기존 아이콘 import 제거
- [ ] 3. 아이콘을 Icon 컴포넌트로 교체
- [ ] 4. size prop 표준화 (숫자 → 토큰)
- [ ] 5. color prop 추가 (className 대신)
- [ ] 6. 접근성 속성 추가
- [ ] 7. 테스트
- [ ] 8. 문서 업데이트

### 디버깅 팁

#### 아이콘이 표시되지 않을 때
```tsx
// 1. 아이콘 이름 확인
import { ALL_ICONS } from '@/config/iconSystem';
console.log(Object.keys(ALL_ICONS));

// 2. Import 경로 확인
import { Icon } from '@/components/ui/Icon'; // ✅
import { Icon } from '@/components/Icon';     // ❌

// 3. 크기 확인
<Icon name="heart" size="md" />  // ✅
<Icon name="heart" size={0} />   // ❌
```

#### 색상이 적용되지 않을 때
```tsx
// color prop 사용
<Icon name="heart" color="primary" />  // ✅

// className으로 대체
<Icon name="heart" className="text-primary" />  // ✅

// 부모의 text color 상속
<div className="text-primary">
  <Icon name="heart" />  // currentColor 사용
</div>
```

### 성능 최적화 팁

#### 1. 조건부 렌더링
```tsx
// ✅ Good
{isLoading && <LoadingSpinner />}

// ❌ Bad
<LoadingSpinner className={isLoading ? 'block' : 'hidden'} />
```

#### 2. Memoization
```tsx
const iconElement = useMemo(
  () => <Icon name="heart" size="lg" />,
  []
);
```

#### 3. Tree Shaking
```tsx
// ✅ Named imports (tree-shakable)
import { Heart } from 'lucide-react';

// ❌ Default import (not tree-shakable)
import LucideIcons from 'lucide-react';
```

## Quick Reference Card

### 자주 사용하는 패턴

```tsx
// 1. 네비게이션 아이콘
<Icon name="chat" size="md" />

// 2. 닫기 버튼
<CloseButton />

// 3. 전송 버튼
<SendButton>전송</SendButton>

// 4. 로딩
<LoadingSpinner />

// 5. 상태
<StatusIcon status="success" />

// 6. 빈 상태
<EmptyStateIcon name="document" />
```

---

**Tip**: 이 체크리스트를 프린트하거나 북마크하여 개발 시 참고하세요!
