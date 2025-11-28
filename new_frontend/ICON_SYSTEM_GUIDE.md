# CareGuide Icon System Guide

## Overview

CareGuide의 아이콘 시스템은 일관된 시각적 경험과 접근성을 보장하기 위해 설계되었습니다. Lucide React 아이콘 라이브러리를 기반으로 하며, 중앙화된 설정과 컴포넌트를 통해 관리됩니다.

## Core Principles

### 1. Consistency (일관성)
- 모든 아이콘은 동일한 시각적 스타일을 유지합니다
- 크기와 strokeWidth가 표준화되어 있습니다
- 색상 시스템과 통합되어 있습니다

### 2. Scalability (확장성)
- 다양한 화면 크기에서 명확하게 표시됩니다
- 반응형 디자인을 지원합니다
- 벡터 기반으로 품질 손실 없이 확대/축소 가능합니다

### 3. Accessibility (접근성)
- 적절한 ARIA 속성을 제공합니다
- 스크린 리더와 호환됩니다
- 충분한 색상 대비를 유지합니다

## Architecture

### File Structure

```
src/
├── config/
│   └── iconSystem.ts          # Icon configuration and constants
├── components/
│   └── ui/
│       ├── Icon.tsx            # Base Icon component
│       ├── IconButton.tsx      # Icon-only button component
│       └── ButtonWithIcon.tsx  # Icon + text button component
```

### Configuration (`iconSystem.ts`)

중앙화된 아이콘 설정 파일입니다:

- **Icon Collections**: 카테고리별로 분류된 아이콘들
- **Size Constants**: 표준화된 아이콘 크기
- **Stroke Width Constants**: 일관된 선 두께
- **Color Mappings**: 시맨틱 색상 매핑
- **Presets**: 자주 사용되는 아이콘 설정 조합

## Usage

### 1. Basic Icon Component

```tsx
import { Icon } from '@/components/ui/Icon';

// Using icon name
<Icon name="heart" size="md" color="primary" />

// Using icon component directly
import { Heart } from 'lucide-react';
<Icon icon={Heart} size={24} strokeWidth={2} />

// Using preset
<Icon name="spinner" preset="spinnerLarge" className="animate-spin" />
```

### 2. Icon Sizes

표준화된 크기를 사용하세요:

```tsx
// Size tokens
<Icon name="heart" size="xs" />   // 12px - Extra small
<Icon name="heart" size="sm" />   // 16px - Small
<Icon name="heart" size="md" />   // 20px - Medium (기본)
<Icon name="heart" size="lg" />   // 24px - Large
<Icon name="heart" size="xl" />   // 32px - Extra large
<Icon name="heart" size="2xl" />  // 48px - 2X Large
<Icon name="heart" size="3xl" />  // 64px - 3X Large

// Or use pixel values
<Icon name="heart" size={28} />
```

### 3. Stroke Width

```tsx
<Icon name="heart" strokeWidth="thin" />    // 1
<Icon name="heart" strokeWidth="normal" />  // 1.5 (기본)
<Icon name="heart" strokeWidth="medium" />  // 2
<Icon name="heart" strokeWidth="bold" />    // 2.5
<Icon name="heart" strokeWidth="heavy" />   // 3
```

### 4. Colors

```tsx
// Semantic colors
<Icon name="success" color="success" />
<Icon name="error" color="error" />
<Icon name="warning" color="warning" />
<Icon name="info" color="info" />

// Brand colors
<Icon name="heart" color="primary" />
<Icon name="heart" color="secondary" />

// Neutral colors
<Icon name="heart" color="default" />
<Icon name="heart" color="muted" />

// Custom Tailwind class
<Icon name="heart" className="text-blue-500" />
```

### 5. Icon Button

아이콘 전용 버튼:

```tsx
import { IconButton, CloseButton, MenuButton } from '@/components/ui/IconButton';

// Basic icon button
<IconButton
  icon="heart"
  aria-label="좋아요"
  onClick={handleLike}
/>

// Variants
<IconButton icon="search" variant="primary" />
<IconButton icon="delete" variant="destructive" />
<IconButton icon="edit" variant="ghost" />
<IconButton icon="close" variant="outline" />

// Sizes (WCAG 2.2 compliant - min 44px touch target)
<IconButton icon="heart" size="sm" />  // 36px visual, 44px touch target
<IconButton icon="heart" size="md" />  // 40px visual, 44px touch target (기본)
<IconButton icon="heart" size="lg" />  // 48px

// Specialized buttons
<CloseButton onClick={handleClose} />
<MenuButton isOpen={isMenuOpen} onClick={toggleMenu} />
<BackButton onClick={goBack} />
<SearchButton onClick={handleSearch} />
<MoreButton orientation="vertical" onClick={handleMore} />
```

### 6. Button with Icon

아이콘 + 텍스트 버튼:

```tsx
import { ButtonWithIcon, SendButton, DeleteButton } from '@/components/ui/ButtonWithIcon';

// Basic usage
<ButtonWithIcon icon="send" variant="primary">
  전송
</ButtonWithIcon>

// Icon position
<ButtonWithIcon icon="download" iconPosition="left">
  다운로드
</ButtonWithIcon>
<ButtonWithIcon icon="external" iconPosition="right">
  외부 링크
</ButtonWithIcon>

// Specialized buttons
<SendButton sending={isSending}>전송</SendButton>
<DeleteButton deleting={isDeleting}>삭제</DeleteButton>
<DownloadButton downloading={isDownloading}>다운로드</DownloadButton>
<AddButton>추가하기</AddButton>
```

### 7. Loading Spinner

```tsx
import { LoadingSpinner } from '@/components/ui/Icon';

// Basic spinner
<LoadingSpinner />

// Sizes
<LoadingSpinner preset="spinner" />       // 20px (기본)
<LoadingSpinner preset="spinnerLarge" />  // 32px

// Custom styling
<LoadingSpinner color="primary" className="mr-2" />
```

### 8. Status Icons

```tsx
import { StatusIcon } from '@/components/ui/Icon';

// Automatic icon and color
<StatusIcon status="success" />
<StatusIcon status="error" />
<StatusIcon status="warning" />
<StatusIcon status="info" />

// Without color
<StatusIcon status="success" showColor={false} />
```

### 9. Empty State Icons

```tsx
import { EmptyStateIcon } from '@/components/ui/Icon';

<EmptyStateIcon name="document" />
```

## Icon Categories

### Navigation Icons
```tsx
chat, diet, quiz, community, trends, mypage, menu, close,
back, forward, down, up, arrowLeft, arrowRight, arrowUp, arrowDown
```

### Action Icons
```tsx
send, search, filter, add, remove, edit, delete, download,
upload, share, copy, external, moreVertical, moreHorizontal, check
```

### Communication Icons
```tsx
notification, email, phone, message
```

### Media Icons
```tsx
image, camera, video, document, file, newspaper
```

### Health & Medical Icons
```tsx
heart, heartPulse, activity, pill, stethoscope, syringe,
thermometer, bone, brain, flask
```

### Food & Nutrition Icons
```tsx
utensils, coffee, apple, salad, chefHat
```

### Status Icons
```tsx
success, error, alert, warning, info, help, circle
```

### Loading Icons
```tsx
spinner, refresh
```

### User Icons
```tsx
user, userCircle, users, userAdd, userRemove, userCheck
```

### Settings Icons
```tsx
settings, lock, unlock, visible, hidden, shield, key
```

### Time Icons
```tsx
clock, calendar, calendarDays, history
```

### Interaction Icons
```tsx
like, dislike, star, bookmark, flag, lightbulb
```

### Chart Icons
```tsx
bar, bar3, line, pie
```

### Misc Icons
```tsx
globe, languages, location, home, building, sparkles, zap,
target, award, moon, sun, inbox, bookOpen, compare, tag
```

### Auth Icons
```tsx
login, logout
```

## Accessibility Guidelines

### 1. Decorative Icons (장식용)

텍스트와 함께 사용되는 아이콘:

```tsx
<button>
  <Icon name="heart" aria-hidden />
  <span>좋아요</span>
</button>
```

### 2. Semantic Icons (의미 있는 아이콘)

독립적으로 의미를 전달하는 아이콘:

```tsx
<Icon
  name="success"
  aria-label="성공"
  role="img"
/>
```

### 3. Interactive Icons (상호작용 아이콘)

클릭 가능한 아이콘:

```tsx
<IconButton
  icon="close"
  aria-label="닫기"
  onClick={handleClose}
/>
```

## Best Practices

### ✅ Do

```tsx
// Use semantic icon names
<Icon name="success" />

// Use consistent sizes
<Icon name="heart" size="md" />

// Provide aria-label for interactive icons
<IconButton icon="close" aria-label="닫기" />

// Use presets for common scenarios
<Icon name="spinner" preset="spinner" className="animate-spin" />
```

### ❌ Don't

```tsx
// Don't use arbitrary sizes
<Icon name="heart" size={23} />  // Use 'md' (24) instead

// Don't skip aria-label on buttons
<IconButton icon="close" />  // Missing aria-label

// Don't use icons without context
<Icon name="warning" />  // What does this warn about?

// Don't mix icon systems
import { Heart } from 'react-icons/fa'  // Use lucide-react
```

## Common Patterns

### 1. Navigation Item

```tsx
<button className={active ? 'active' : ''}>
  <Icon name="chat" size="md" strokeWidth="normal" />
  <span>AI챗봇</span>
</button>
```

### 2. Action Button

```tsx
<ButtonWithIcon
  icon="send"
  variant="primary"
  onClick={handleSend}
>
  전송
</ButtonWithIcon>
```

### 3. Status Indicator

```tsx
<div className="flex items-center gap-2">
  <StatusIcon status="success" />
  <span>저장 완료</span>
</div>
```

### 4. Loading State

```tsx
{isLoading ? (
  <LoadingSpinner />
) : (
  <Icon name="check" />
)}
```

### 5. Empty State

```tsx
<div className="empty-state">
  <EmptyStateIcon name="document" />
  <p>문서가 없습니다</p>
</div>
```

## Customization

### Extending Icon System

새로운 아이콘 추가:

```typescript
// config/iconSystem.ts

import { NewIcon } from 'lucide-react';

export const CUSTOM_ICONS = {
  customIcon: NewIcon,
  ...
} as const;
```

### Creating Custom Presets

```typescript
// config/iconSystem.ts

export const ICON_PRESETS = {
  ...
  myCustomPreset: {
    size: ICON_SIZES.lg,
    strokeWidth: ICON_STROKE_WIDTHS.bold,
  },
} as const;
```

## Migration Guide

### From Direct Lucide Imports

Before:
```tsx
import { Heart, Send, X } from 'lucide-react';

<Heart size={20} strokeWidth={1.5} className="text-primary" />
<button><Send size={18} /></button>
<X size={16} />
```

After:
```tsx
import { Icon, IconButton } from '@/components/ui';

<Icon name="heart" size="md" color="primary" />
<IconButton icon="send" aria-label="전송" />
<Icon name="close" size="sm" />
```

## Performance Considerations

### Tree Shaking

Lucide React는 tree shaking을 지원합니다. 사용하지 않는 아이콘은 번들에 포함되지 않습니다.

### Bundle Size

- Icon component: ~2KB (gzipped)
- Each icon: ~100-200 bytes
- Total icon system: ~10KB (gzipped)

## Troubleshooting

### Icon Not Displaying

```tsx
// Check if icon name exists
import { ALL_ICONS } from '@/config/iconSystem';
console.log(Object.keys(ALL_ICONS));

// Verify import
import { Icon } from '@/components/ui/Icon'; // Correct
import { Icon } from '@/components/Icon';     // Wrong path
```

### Size Issues

```tsx
// Use token sizes instead of arbitrary values
<Icon name="heart" size="md" />  // ✅
<Icon name="heart" size={22} />  // ❌ Use 'md' (20) or 'lg' (24)
```

### Color Not Applied

```tsx
// Use color prop for semantic colors
<Icon name="heart" color="primary" />  // ✅

// Or use className for custom colors
<Icon name="heart" className="text-blue-500" />  // ✅
```

## Resources

- [Lucide Icons](https://lucide.dev/) - Icon library documentation
- [Design System Guide](/new_frontend/src/design-system/README.md) - Overall design system
- [Accessibility Guidelines](/new_frontend/src/design-system/ACCESSIBILITY_GUIDELINES.md) - Accessibility best practices

## Support

For questions or issues:
1. Check this documentation
2. Review component examples in `/src/components/ui/`
3. Consult the design system guide
4. Contact the frontend team

## Mobile Touch Targets

All interactive icons follow WCAG 2.2 guidelines for minimum touch target size:

```tsx
// Minimum touch target: 44x44px
<IconButton icon="menu" size="sm" />  // min-w-[44px] min-h-[44px]
<IconButton icon="close" size="md" /> // min-w-[44px] min-h-[44px]

// In custom buttons, always include:
<button className="min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Icon name="heart" size="md" />
</button>
```

### Mobile Navigation Patterns

```tsx
// Bottom navigation items
<button className="min-w-[60px] min-h-[48px]">
  <Icon name="chat" size="md" />
  <span className="text-[10px]">AI챗봇</span>
</button>

// Header buttons
<button className="min-w-[44px] min-h-[44px]">
  <Icon name="back" size="lg" strokeWidth="medium" />
</button>
```

---

**Last Updated**: 2025-11-28
**Version**: 1.1.0
**Maintainer**: CareGuide Frontend Team
