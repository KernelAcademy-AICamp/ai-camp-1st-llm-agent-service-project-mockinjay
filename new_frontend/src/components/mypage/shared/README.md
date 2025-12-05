# MyPage Shared Components

공통으로 사용되는 마이페이지 컴포넌트 라이브러리입니다. 모든 컴포넌트는 WCAG 2.1 AA 접근성 가이드라인을 준수합니다.

## Components

### MenuItem

메뉴 항목을 표시하는 재사용 가능한 컴포넌트입니다. 아이콘, 레이블, 배지, 비활성화 상태를 지원합니다.

#### Features

- Icon with hover effects
- Optional badge display
- Disabled state support
- Full keyboard navigation (Enter, Space)
- ARIA attributes for screen readers
- React.memo optimization

#### Usage

```tsx
import { MenuItem } from '@/components/mypage/shared';
import { User } from 'lucide-react';

<MenuItem
  icon={<User size={20} />}
  label="Profile Information"
  onClick={() => navigate('/profile')}
  badge={3}
  ariaLabel="View profile information (3 notifications)"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `React.ReactNode` | required | Icon to display (Lucide React recommended) |
| `label` | `string` | required | Label text for the menu item |
| `onClick` | `() => void` | `undefined` | Click handler function |
| `badge` | `number` | `undefined` | Optional badge number to display |
| `disabled` | `boolean` | `false` | Whether the item is disabled |
| `ariaLabel` | `string` | `label` | Accessible label for screen readers |
| `className` | `string` | `''` | Additional CSS classes |

#### Accessibility Checklist

- [x] Keyboard navigation (Enter, Space)
- [x] Focus visible indicator
- [x] ARIA labels for screen readers
- [x] Disabled state properly announced
- [x] Badge count announced to screen readers

---

### ModalContainer

접근 가능한 모달 래퍼 컴포넌트입니다. 포커스 트랩, ESC 키 처리, 배경 클릭 처리를 지원합니다.

#### Features

- Focus trap (keeps focus within modal)
- ESC key to close
- Backdrop click to close
- Prevents body scroll when open
- Restores focus to previous element on close
- Multiple size options
- Smooth animations
- Full ARIA support

#### Usage

```tsx
import { ModalContainer } from '@/components/mypage/shared';

<ModalContainer
  isOpen={isOpen}
  onClose={handleClose}
  title="Edit Profile"
  size="lg"
  footer={
    <div className="flex gap-2">
      <button onClick={handleClose}>Cancel</button>
      <button onClick={handleSave}>Save</button>
    </div>
  }
>
  <form>
    {/* Modal content */}
  </form>
</ModalContainer>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Whether the modal is open |
| `onClose` | `() => void` | required | Function to call when modal should close |
| `title` | `string` | required | Modal title for accessibility and header |
| `children` | `React.ReactNode` | required | Modal content |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Size of the modal |
| `showCloseButton` | `boolean` | `true` | Whether to show close button |
| `closeOnBackdropClick` | `boolean` | `true` | Whether to close on backdrop click |
| `closeOnEscape` | `boolean` | `true` | Whether to close on ESC key |
| `className` | `string` | `''` | Additional CSS classes for modal content |
| `footer` | `React.ReactNode` | `undefined` | Footer content |

#### Size Reference

| Size | Max Width | Use Case |
|------|-----------|----------|
| `sm` | `max-w-md` (448px) | Small forms, confirmations |
| `md` | `max-w-lg` (512px) | Standard forms |
| `lg` | `max-w-2xl` (672px) | Large forms, detailed content |
| `xl` | `max-w-4xl` (896px) | Complex interfaces |
| `full` | `max-w-full` | Full-width modals |

#### Accessibility Checklist

- [x] Focus trap implemented
- [x] ESC key closes modal
- [x] Focus returns to trigger element
- [x] `aria-modal="true"` attribute
- [x] `role="dialog"` attribute
- [x] Proper heading structure
- [x] Body scroll prevention
- [x] Keyboard navigation (Tab, Shift+Tab)

---

## Performance Considerations

### MenuItem

- **React.memo**: Component is memoized to prevent unnecessary re-renders
- **Event Handler Optimization**: Click handlers are memoized internally
- **Icon Optimization**: Use Lucide React icons for optimal tree-shaking

### ModalContainer

- **Lazy Rendering**: Modal content is not rendered when `isOpen={false}`
- **Focus Management**: Efficient focus trap using native DOM queries
- **Event Cleanup**: All event listeners are properly cleaned up
- **Scroll Prevention**: Calculates scrollbar width to prevent layout shift

---

## Testing

Both components include comprehensive test suites using Jest and React Testing Library.

### Run Tests

```bash
# Run all tests
npm test

# Run tests for specific component
npm test MenuItem.test.tsx
npm test ModalContainer.test.tsx

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

- Unit tests for all props and variants
- Interaction tests (click, keyboard)
- Accessibility tests (ARIA attributes, focus)
- Edge case tests (disabled state, missing props)

---

## Migration Guide

### From MyPage.tsx and MyPageEnhanced.tsx

#### Before (MyPage.tsx)

```tsx
const MenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full px-6 py-4 flex items-center hover:bg-gray-50 transition-colors text-left group">
    <div className="text-gray-400 mr-4 group-hover:text-primary-500 transition-colors">{icon}</div>
    <span className="text-gray-700 font-medium flex-1">{label}</span>
    <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
  </button>
);
```

#### After (Shared Component)

```tsx
import { MenuItem } from '@/components/mypage/shared';

<MenuItem
  icon={<User size={20} />}
  label="Profile Information"
  onClick={() => navigate('/profile')}
/>
```

### Benefits of Migration

1. **Consistency**: Same component across all pages
2. **Accessibility**: Built-in ARIA attributes and keyboard navigation
3. **Features**: Badge support, disabled state, custom aria-labels
4. **Testing**: Pre-built comprehensive test suite
5. **Performance**: React.memo optimization
6. **Maintenance**: Single source of truth

---

## Deployment Checklist

Before deploying these components to production, ensure:

- [ ] All tests pass (`npm test`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Components render correctly in all supported browsers
- [ ] Accessibility audit passes (WAVE, axe DevTools)
- [ ] Keyboard navigation works without mouse
- [ ] Screen reader testing completed (NVDA, JAWS, VoiceOver)
- [ ] Focus visible indicators are clear
- [ ] Color contrast meets WCAG AA standards (4.5:1 for normal text)
- [ ] Modal focus trap works correctly
- [ ] Modal ESC key closes properly
- [ ] Body scroll prevention works
- [ ] Components work on mobile devices
- [ ] Performance budget met (no significant re-renders)

---

## Browser Support

These components support the following browsers:

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- iOS Safari: Last 2 versions
- Android Chrome: Last 2 versions

---

## Contributing

When modifying these components:

1. Update tests to maintain 90%+ coverage
2. Run accessibility audit before committing
3. Update this README with any new props or features
4. Ensure backward compatibility or provide migration guide
5. Follow existing code style and patterns

---

## Related Components

- `/components/mypage/MyPageModals.tsx` - Modal content components
- `/pages/MyPage.tsx` - Main MyPage implementation
- `/pages/MyPageEnhanced.tsx` - Enhanced MyPage with modals

---

## License

Part of the CarePlus project. Internal use only.
