# Usage Examples for MyPage Shared Components

## MenuItem Component

### Basic Usage

```tsx
import { MenuItem } from '@/components/mypage/shared';
import { User } from 'lucide-react';

function MyPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="divide-y divide-gray-100">
        <MenuItem
          icon={<User size={20} />}
          label="Profile Information"
          onClick={() => navigate('/profile')}
        />
      </div>
    </div>
  );
}
```

### With Badge

```tsx
<MenuItem
  icon={<FileText size={20} />}
  label="Bookmarked Papers"
  onClick={() => setIsBookmarksModalOpen(true)}
  badge={bookmarkedPapers.length}
/>
```

### Disabled State

```tsx
<MenuItem
  icon={<CreditCard size={20} />}
  label="Subscription & Billing"
  onClick={() => navigate('/subscribe')}
  disabled={!user?.isPremium}
  ariaLabel="Subscription & Billing (Premium members only)"
/>
```

### Custom Aria Label

```tsx
<MenuItem
  icon={<Bell size={20} />}
  label="Notifications"
  onClick={() => navigate('/notifications')}
  badge={unreadCount}
  ariaLabel={`Notifications (${unreadCount} unread)`}
/>
```

### Complete Menu List

```tsx
import { MenuItem } from '@/components/mypage/shared';
import {
  User,
  Settings,
  CreditCard,
  Bell,
  FileText,
  Heart,
} from 'lucide-react';

function AccountSettings() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
        Account Settings
      </div>
      <div className="divide-y divide-gray-100">
        <MenuItem
          icon={<User size={20} />}
          label="Profile Information"
          onClick={() => setIsProfileModalOpen(true)}
        />
        <MenuItem
          icon={<Heart size={20} />}
          label="Health Profile"
          onClick={() => setIsHealthModalOpen(true)}
        />
        <MenuItem
          icon={<Settings size={20} />}
          label="Preferences"
          onClick={() => setIsSettingsModalOpen(true)}
        />
        <MenuItem
          icon={<CreditCard size={20} />}
          label="Subscription & Billing"
          onClick={() => navigate('/subscribe')}
        />
        <MenuItem
          icon={<Bell size={20} />}
          label="Notifications"
          onClick={() => navigate('/notifications')}
          badge={3}
        />
      </div>
    </div>
  );
}
```

---

## ModalContainer Component

### Basic Modal

```tsx
import { ModalContainer } from '@/components/mypage/shared';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      <ModalContainer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit Profile"
      >
        <form>
          <div className="space-y-4">
            <input type="text" placeholder="Name" className="w-full" />
            <input type="email" placeholder="Email" className="w-full" />
          </div>
        </form>
      </ModalContainer>
    </>
  );
}
```

### Modal with Footer

```tsx
<ModalContainer
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  size="sm"
  footer={
    <div className="flex gap-2 justify-end">
      <button
        onClick={handleClose}
        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        Cancel
      </button>
      <button
        onClick={handleConfirm}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Confirm
      </button>
    </div>
  }
>
  <p>Are you sure you want to proceed?</p>
</ModalContainer>
```

### Large Modal with Form

```tsx
import { ModalContainer } from '@/components/mypage/shared';

function ProfileEditModal({ isOpen, onClose, user, onSave }) {
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      size="lg"
      footer={
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Save Changes
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </form>
    </ModalContainer>
  );
}
```

### Full-Width Modal

```tsx
<ModalContainer
  isOpen={isOpen}
  onClose={onClose}
  title="Bookmarked Papers"
  size="full"
  closeOnBackdropClick={false}
>
  <div className="min-h-[60vh]">
    {/* Full-width content */}
  </div>
</ModalContainer>
```

### Modal Without Close Button

```tsx
<ModalContainer
  isOpen={isOpen}
  onClose={onClose}
  title="Processing..."
  size="sm"
  showCloseButton={false}
  closeOnBackdropClick={false}
  closeOnEscape={false}
>
  <div className="text-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
    <p className="mt-4 text-gray-600">Please wait...</p>
  </div>
</ModalContainer>
```

---

## Migrating Existing Code

### Before (MyPage.tsx)

```tsx
// Duplicated MenuItem component
const MenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full px-6 py-4 flex items-center hover:bg-gray-50 transition-colors text-left group"
  >
    <div className="text-gray-400 mr-4 group-hover:text-primary-500 transition-colors">{icon}</div>
    <span className="text-gray-700 font-medium flex-1">{label}</span>
    <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
  </button>
);

// Usage
<MenuItem icon={<User size={20} />} label="Profile Information" onClick={() => navigate('/mypage/profile')} />
```

### After (Using Shared Component)

```tsx
import { MenuItem } from '@/components/mypage/shared';

// Usage - same interface, more features
<MenuItem
  icon={<User size={20} />}
  label="Profile Information"
  onClick={() => navigate('/mypage/profile')}
  // Now supports additional props:
  // badge={3}
  // disabled={false}
  // ariaLabel="Custom accessible label"
/>
```

### Benefits

1. **Single Source of Truth**: No more duplicated code
2. **Enhanced Features**: Badge support, disabled state, accessibility
3. **Better Testing**: Pre-built comprehensive test suite
4. **Consistent Behavior**: Same component everywhere
5. **Performance**: React.memo optimization
6. **Accessibility**: Built-in ARIA attributes and keyboard navigation

---

## Complete Example: Refactored MyPageEnhanced

```tsx
import React, { useState } from 'react';
import {
  User,
  Settings,
  CreditCard,
  Bell,
  FileText,
  Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MenuItem, ModalContainer } from '@/components/mypage/shared';

const MyPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [bookmarkedPapers, setBookmarkedPapers] = useState([]);
  const [myPosts, setMyPosts] = useState([]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Page</h1>

      {/* Account Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
          Account Settings
        </div>
        <div className="divide-y divide-gray-100">
          <MenuItem
            icon={<User size={20} />}
            label="Profile Information"
            onClick={() => setIsProfileModalOpen(true)}
          />
          <MenuItem
            icon={<Heart size={20} />}
            label="Health Profile"
            onClick={() => setIsHealthModalOpen(true)}
          />
          <MenuItem
            icon={<Settings size={20} />}
            label="Preferences"
            onClick={() => navigate('/settings')}
          />
          <MenuItem
            icon={<CreditCard size={20} />}
            label="Subscription & Billing"
            onClick={() => navigate('/subscribe')}
          />
          <MenuItem
            icon={<Bell size={20} />}
            label="Notifications"
            onClick={() => navigate('/notifications')}
            badge={3}
          />
        </div>
      </div>

      {/* Modals */}
      <ModalContainer
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Edit Profile"
        size="lg"
      >
        {/* Profile form content */}
      </ModalContainer>

      <ModalContainer
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        title="Health Profile"
        size="lg"
      >
        {/* Health profile form content */}
      </ModalContainer>
    </div>
  );
};

export default MyPageEnhanced;
```

---

## Keyboard Navigation

### MenuItem

- **Tab**: Navigate to the menu item
- **Enter/Space**: Activate the menu item
- **Shift+Tab**: Navigate backwards

### ModalContainer

- **Tab**: Move to next focusable element in modal
- **Shift+Tab**: Move to previous focusable element
- **ESC**: Close the modal (if enabled)

Focus is trapped within the modal and returns to the trigger element on close.

---

## Accessibility Testing

### Screen Reader Announcements

**MenuItem:**
- "Profile Information, button"
- "Notifications, 3 items, button" (with badge)
- "Subscription & Billing, button, disabled" (when disabled)

**ModalContainer:**
- "Edit Profile, dialog"
- "Close modal, button"

### Testing Checklist

- [ ] Navigate with keyboard only
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify focus indicators are visible
- [ ] Check color contrast (4.5:1 minimum)
- [ ] Test on mobile devices
- [ ] Verify focus trap in modals
- [ ] Test ESC key closes modal
- [ ] Confirm focus returns after modal close

---

## Troubleshooting

### MenuItem not responding to clicks

**Solution:** Ensure you've passed an `onClick` handler:
```tsx
<MenuItem
  icon={<User size={20} />}
  label="Profile"
  onClick={() => console.log('clicked')}  // Don't forget this!
/>
```

### Modal not closing on ESC

**Solution:** Check if `closeOnEscape` is not set to false:
```tsx
<ModalContainer
  isOpen={isOpen}
  onClose={onClose}
  title="Modal"
  closeOnEscape={true}  // Default is true
>
```

### Focus not trapped in modal

**Solution:** Ensure modal content has focusable elements (buttons, inputs, links):
```tsx
<ModalContainer isOpen={isOpen} onClose={onClose} title="Modal">
  <input type="text" />  {/* Focusable element */}
  <button>Submit</button>  {/* Another focusable element */}
</ModalContainer>
```

### Animations not working

**Solution:** Ensure `tailwindcss-animate` is installed:
```bash
npm install tailwindcss-animate
```

And added to tailwind.config.js:
```js
module.exports = {
  plugins: [require('tailwindcss-animate')],
}
```

---

## Performance Tips

1. **Memoize onClick handlers** to prevent unnecessary re-renders:
```tsx
const handleClick = useCallback(() => {
  navigate('/profile');
}, [navigate]);

<MenuItem icon={<User />} label="Profile" onClick={handleClick} />
```

2. **Lazy load modal content**:
```tsx
<ModalContainer isOpen={isOpen} onClose={onClose} title="Modal">
  {isOpen && <HeavyComponent />}
</ModalContainer>
```

3. **Avoid creating new objects in render**:
```tsx
// Bad
<MenuItem icon={<User size={20} />} label="Profile" badge={items.length} />

// Good
const itemCount = useMemo(() => items.length, [items]);
<MenuItem icon={<User size={20} />} label="Profile" badge={itemCount} />
```
