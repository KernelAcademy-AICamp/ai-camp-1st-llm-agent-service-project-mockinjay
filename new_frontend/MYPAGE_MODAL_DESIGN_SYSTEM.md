# MyPage Modal Components - Design System Documentation

## Overview

This document describes the design system and implementation details for the MyPage modal components in CarePlus. All components follow the established CarePlus design language and are fully responsive.

## File Location

`/new_frontend/src/components/mypage/MyPageModals.tsx`

---

## Design Principles

### 1. CarePlus Color Palette

```css
Primary: #00C9B7 (Teal)
Primary Hover: #00B3A3
Primary Pressed: #008C80
Accent Purple: #9F7AEA
Success: #00A8E8
Warning: #F59E0B
Error: #EF4444
```

### 2. Typography

- Font Family: Noto Sans KR, Inter
- Headings: Bold (700) for modal titles
- Body: Medium (500) for labels, Regular (400) for content
- Size Scale: Base 16px, Small 14px, Extra Small 12px

### 3. Spacing System

- Padding: p-4 (16px), p-6 (24px) for modal content
- Gap: gap-2 (8px), gap-3 (12px), gap-4 (16px)
- Border Radius: rounded-xl (12px), rounded-2xl (16px)

### 4. Interactive States

- Default: Border gray-200, background white
- Hover: Shadow-md, border-cyan-200
- Active/Selected: Border primary, background input-bar (#F2FFFD)
- Focus: Ring primary color

---

## Components

### 1. Profile Edit Modal

**Purpose:** Edit user profile information including avatar, name, email, phone, and birthdate.

**Design Features:**
- Circular avatar with gradient background (primary to accent-purple)
- Camera icon overlay for photo upload
- Icon-labeled input fields for better UX
- Clean two-button layout (Cancel/Save)

**Usage:**
```tsx
import { ProfileEditModal } from '@/components/mypage/MyPageModals';

<ProfileEditModal
  isOpen={isProfileModalOpen}
  onClose={() => setIsProfileModalOpen(false)}
  user={{
    fullName: "홍길동",
    email: "hong@example.com",
    phone: "010-1234-5678",
    birthDate: "1990-01-01",
    avatar: "/path/to/avatar.jpg"
  }}
  onSave={(data) => {
    // Handle profile update
    console.log(data);
  }}
/>
```

**Components Used:**
- User, Mail, Phone, Calendar, Camera icons from Lucide React
- input-field class from design system
- btn-primary, btn-ghost from design system

---

### 2. Health Profile Modal

**Purpose:** Comprehensive health information collection with multi-step form (conditions, allergies, basic info).

**Design Features:**
- Tab navigation with icons (Heart, AlertCircle, Activity)
- Checkbox grid for medical conditions
- Tag-based input for allergies and medications
- Blood type selector with colored buttons
- Height/weight numerical inputs

**Usage:**
```tsx
import { HealthProfileModal } from '@/components/mypage/MyPageModals';

<HealthProfileModal
  isOpen={isHealthModalOpen}
  onClose={() => setIsHealthModalOpen(false)}
  onSave={(data) => {
    console.log('Health profile:', data);
    // data includes: conditions, allergies, medications, bloodType, height, weight
  }}
/>
```

**Key Interactions:**
- Tab switching between 3 sections
- Multi-select checkboxes with visual feedback
- Dynamic tag addition/removal
- Enter key support for quick tag addition

**Components Used:**
- tab-selected, tab-unselected classes
- Heart, AlertCircle, Activity, Pill icons
- Custom checkbox styling with primary colors

---

### 3. Settings Modal

**Purpose:** User preferences for notifications, privacy, and app settings.

**Design Features:**
- Grouped sections with icon headers
- Custom toggle switches
- Dropdown selects for language and theme
- Clear visual hierarchy with dividers

**Usage:**
```tsx
import { SettingsModal } from '@/components/mypage/MyPageModals';

<SettingsModal
  isOpen={isSettingsModalOpen}
  onClose={() => setIsSettingsModalOpen(false)}
  onSave={(settings) => {
    console.log('Settings saved:', settings);
    // settings includes: notifications, privacy, preferences
  }}
/>
```

**Sections:**
1. Notifications (Bell icon)
   - Email notifications
   - Push notifications
   - Community notifications

2. Privacy (Lock icon)
   - Profile visibility
   - Activity visibility

3. Preferences (Globe, Moon icons)
   - Language selection (Korean/English)
   - Theme selection (Light/Dark/Auto)

**Components Used:**
- Bell, Lock, Globe, Moon icons
- Custom SettingToggle component
- input-field for selects

---

### 4. Bookmarked Papers Modal

**Purpose:** Display and manage bookmarked research papers.

**Design Features:**
- Card-based list layout
- Paper information hierarchy (title, authors, journal, year)
- Hover-reveal bookmark removal button
- Empty state with centered icon and message

**Usage:**
```tsx
import { BookmarkedPapersModal } from '@/components/mypage/MyPageModals';

<BookmarkedPapersModal
  isOpen={isBookmarksModalOpen}
  onClose={() => setIsBookmarksModalOpen(false)}
  papers={[
    {
      id: '1',
      title: 'Research Paper Title',
      authors: 'Author 1, Author 2',
      journal: 'Nature',
      year: '2024',
      bookmarkedAt: '2024-01-15T10:00:00Z'
    }
  ]}
  onRemoveBookmark={(paperId) => {
    // Handle bookmark removal
  }}
/>
```

**Card Layout:**
- Title: Font-semibold, line-clamp-2 (max 2 lines)
- Authors: Truncated text
- Journal & Year: Small text separated by bullet
- Bookmark date: Clock icon with formatted date

---

### 5. My Posts Modal

**Purpose:** Display and manage user's community posts.

**Design Features:**
- Post cards with type badges (Board, Challenge, Survey)
- Post preview with title and content excerpt
- Stats display (likes, comments)
- Hover-reveal delete button
- Color-coded badges matching post types

**Usage:**
```tsx
import { MyPostsModal } from '@/components/mypage/MyPageModals';

<MyPostsModal
  isOpen={isPostsModalOpen}
  onClose={() => setIsPostsModalOpen(false)}
  posts={[
    {
      id: '1',
      title: 'Post Title',
      content: 'Post content preview...',
      postType: 'BOARD',
      likes: 10,
      commentCount: 5,
      createdAt: '2024-01-15T10:00:00Z'
    }
  ]}
  onDeletePost={(postId) => {
    // Handle post deletion
  }}
/>
```

**Badge Colors:**
- BOARD: badge-free (emerald)
- CHALLENGE: badge-challenge (violet)
- SURVEY: badge-survey (cyan)

**Card Layout:**
- Badge + Date header
- Title (line-clamp-2)
- Content preview (line-clamp-2)
- Stats footer (likes, comments with icons)

---

## Responsive Design

All modals are mobile-responsive with the following features:

### Mobile (< 640px)
- Full-width modals with padding
- Single column layouts
- Touch-friendly button sizes (min 44px height)
- Scrollable content areas

### Desktop (>= 640px)
- Max-width constraints (md: 640px, lg: 768px, 2xl: 896px)
- Multi-column grids where appropriate
- Hover states for interactive elements

---

## Accessibility Features

1. **Keyboard Navigation**
   - Escape key closes modals
   - Enter key submits forms
   - Tab navigation through form fields

2. **Screen Reader Support**
   - Semantic HTML elements
   - aria-hidden for backdrop
   - aria-label for icon buttons

3. **Focus Management**
   - Visible focus indicators
   - Focus trap within modals
   - Return focus on close

4. **Color Contrast**
   - WCAG AA compliant text colors
   - Sufficient contrast for interactive elements

---

## Animation & Transitions

- Backdrop: fade-in/out (transition-opacity)
- Modal: zoom-in/out with fade (if using Radix)
- Buttons: color transitions (duration-200)
- Hover effects: shadow and border transitions

---

## Common Patterns

### Modal Structure
```tsx
{/* Backdrop */}
<div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

{/* Modal */}
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <h2 className="text-xl font-bold">Title</h2>
      <button onClick={onClose}><X /></button>
    </div>

    {/* Content */}
    <div className="p-6">
      {/* Form fields */}
    </div>

    {/* Footer Actions */}
    <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
      <button className="btn-ghost flex-1">취소</button>
      <button className="btn-primary flex-1">저장</button>
    </div>
  </div>
</div>
```

### Form Input Pattern
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
    <Icon size={16} className="text-gray-400" />
    Label Text
  </label>
  <input
    type="text"
    className="input-field"
    placeholder="Placeholder"
  />
</div>
```

### Toggle Switch Pattern
```tsx
<label className="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
  <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[var(--color-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
</label>
```

---

## Integration with MyPage

To integrate these modals into the existing MyPage component:

```tsx
// In MyPage.tsx
import {
  ProfileEditModal,
  HealthProfileModal,
  SettingsModal,
  BookmarkedPapersModal,
  MyPostsModal
} from '../components/mypage/MyPageModals';

const MyPage: React.FC = () => {
  // Modal state management
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [isPostsModalOpen, setIsPostsModalOpen] = useState(false);

  // Update MenuItem onClick handlers
  <MenuItem
    icon={<User />}
    label="Profile Information"
    onClick={() => setIsProfileModalOpen(true)}
  />

  // Add modals at the end of component
  return (
    <>
      {/* Existing MyPage content */}

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onSave={handleProfileSave}
      />

      <HealthProfileModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        onSave={handleHealthProfileSave}
      />

      {/* Add other modals similarly */}
    </>
  );
};
```

---

## Testing Checklist

- [ ] Modal opens and closes correctly
- [ ] Form validation works
- [ ] Data persistence after save
- [ ] Responsive layout on mobile
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader compatibility
- [ ] Loading/submitting states
- [ ] Error handling and display
- [ ] Confirmation dialogs for destructive actions
- [ ] Empty states display correctly

---

## Future Enhancements

1. **Animation Library Integration**
   - Add Framer Motion for smooth transitions
   - Implement staggered animations for lists

2. **Form Validation**
   - Add react-hook-form for better validation
   - Real-time error messages

3. **API Integration**
   - Connect to backend endpoints
   - Add loading states
   - Implement error handling

4. **Advanced Features**
   - Profile photo cropping
   - Drag-and-drop file upload
   - Auto-save functionality
   - Undo/redo for edits

---

## Design Tokens Reference

```typescript
// From index.css
const designTokens = {
  colors: {
    primary: '#00C9B7',
    primaryHover: '#00B3A3',
    primaryPressed: '#008C80',
    accentPurple: '#9F7AEA',
    inputBar: '#F2FFFD',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    lineStrong: '#D1D5DB',
    lineMedium: '#E5E7EB',
  },
  borderRadius: {
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },
  spacing: {
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  }
};
```

---

## Component File Structure

```
new_frontend/
├── src/
│   ├── components/
│   │   └── mypage/
│   │       └── MyPageModals.tsx        (All modal components)
│   ├── pages/
│   │   └── MyPage.tsx                  (Main MyPage component)
│   └── types/
│       └── user.ts                     (User-related types)
```

---

## Contact & Support

For questions or issues with these components, please refer to:
- Design System: `/new_frontend/src/index.css`
- Component Library: `/new_frontend/src/components/ui/`
- CarePlus Design Guidelines: `CAREGUIDE_UI_DESIGN_SYSTEM.md`
