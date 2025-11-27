# UI Components Guide

This guide documents the newly created UI components for the CareGuide healthcare application.

## Table of Contents

1. [Disclaimer Banner](#disclaimer-banner)
2. [Source Citation](#source-citation)
3. [Level Progress](#level-progress)
4. [Points History](#points-history)
5. [Notification Toggle](#notification-toggle)

---

## Disclaimer Banner

**Location**: `/src/components/ui/disclaimer-banner.tsx`

A fixed position banner that displays medical disclaimers, typically shown at the bottom of chat interfaces.

### Features

- Fixed positioning (top or bottom)
- Collapsible on mobile devices
- Dismissible with callback
- Warning icon and amber color scheme
- Dark mode support
- Responsive design

### Usage

```tsx
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";

function ChatPage() {
  const handleDismiss = () => {
    console.log("User dismissed the disclaimer");
  };

  return (
    <div>
      {/* Your chat content */}

      <DisclaimerBanner
        position="bottom"
        dismissible={true}
        onDismiss={handleDismiss}
        message="본 답변은 의학적 진단이 아니며 참고용 정보입니다. 증상이 있는 경우 반드시 의료진과 상담하세요"
      />
    </div>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | Default disclaimer text | The disclaimer message to display |
| `onDismiss` | `() => void` | `undefined` | Callback when banner is dismissed |
| `dismissible` | `boolean` | `true` | Whether the banner can be dismissed |
| `position` | `"top" \| "bottom"` | `"bottom"` | Position of the banner |
| `className` | `string` | `undefined` | Additional CSS classes |

### Design Specs

- Background: `#FEF3C7` (light) / `#92400E80` (dark)
- Text Color: `#92400E` (light) / `#FEF3C7` (dark)
- Border: `2px solid #FBB040`
- Icon: Warning triangle (⚠️)

---

## Source Citation

**Location**: `/src/components/chat/SourceCitation.tsx`

Displays scientific and institutional sources with icons and links below AI chat messages.

### Features

- Multiple source types with custom icons
- Expandable list with "show more" functionality
- Hover effects and transitions
- External link indicators
- Full citation details view
- Compact mode for mobile

### Usage

```tsx
import { SourceCitation, Source } from "@/components/chat/SourceCitation";

const sources: Source[] = [
  {
    id: "1",
    title: "Chronic Kidney Disease Management",
    url: "https://pubmed.ncbi.nlm.nih.gov/12345678",
    type: "pubmed",
    author: "Kim et al.",
    year: "2023",
    journal: "Kidney International",
  },
  {
    id: "2",
    title: "만성콩팥병 진료지침",
    url: "https://ksn.or.kr/guidelines",
    type: "ksn",
    year: "2024",
  },
];

function ChatMessage() {
  return (
    <div>
      <p>AI response content...</p>
      <SourceCitation sources={sources} maxVisible={3} />
    </div>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sources` | `Source[]` | Required | Array of source objects |
| `className` | `string` | `undefined` | Additional CSS classes |
| `compact` | `boolean` | `false` | Compact mode for mobile |
| `maxVisible` | `number` | `3` | Maximum sources shown initially |

### Source Types

- `pubmed`: PubMed articles (📚 blue)
- `kdca`: 질병관리청 (🏛️ green)
- `ksn`: 대한신장학회 (🏥 purple)
- `mfds`: 식품의약품안전처 (🏛️ orange)
- `guideline`: Clinical guidelines (📚 teal)
- `other`: Other sources (🔗 gray)

---

## Level Progress

**Location**: `/src/components/ui/level-progress.tsx`

Displays user level, progress, and points with animated effects.

### Features

- Two variants: circular and linear
- Animated progress indicators
- Points counter animation
- Level-based color gradients
- Level icons and titles
- Three size options

### Usage

```tsx
import { LevelProgress } from "@/components/ui/level-progress";

function ProfileSection() {
  return (
    <div>
      {/* Linear variant */}
      <LevelProgress
        currentLevel={3}
        currentPoints={750}
        pointsToNextLevel={250}
        totalLevelPoints={1000}
        variant="linear"
        size="md"
        showAnimation={true}
      />

      {/* Circular variant */}
      <LevelProgress
        currentLevel={3}
        currentPoints={750}
        pointsToNextLevel={250}
        totalLevelPoints={1000}
        variant="circular"
        size="lg"
      />
    </div>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentLevel` | `number` | Required | Current user level (1-5) |
| `currentPoints` | `number` | Required | Points earned in current level |
| `pointsToNextLevel` | `number` | Required | Points needed for next level |
| `totalLevelPoints` | `number` | `pointsToNextLevel` | Total points for current level |
| `variant` | `"circular" \| "linear"` | `"linear"` | Display variant |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Component size |
| `showAnimation` | `boolean` | `true` | Enable animations |
| `className` | `string` | `undefined` | Additional CSS classes |

### Level Titles

1. 신규 회원 (Star - Gray)
2. 활동 회원 (Target - Blue)
3. 우수 회원 (Zap - Purple)
4. 명예 회원 (Trophy - Amber)
5. 마스터 회원 (Crown - Gold)

---

## Points History

**Location**: `/src/components/mypage/PointsHistory.tsx`

Displays transaction history with categorization and running balance.

### Features

- Transaction cards with activity icons
- Grouping by date
- Scrollable list with max height
- Running balance display
- Color-coded earn/spend amounts
- Empty state

### Usage

```tsx
import { PointsHistory, PointTransaction } from "@/components/mypage/PointsHistory";

const transactions: PointTransaction[] = [
  {
    id: "1",
    type: "earn",
    amount: 100,
    activity: "quiz",
    description: "신장 건강 퀴즈 완료",
    date: new Date(),
    balance: 1250,
  },
  {
    id: "2",
    type: "spend",
    amount: 50,
    activity: "purchase",
    description: "프리미엄 리포트 조회",
    date: new Date(),
    balance: 1150,
  },
];

function MyPage() {
  return (
    <PointsHistory
      transactions={transactions}
      maxHeight="500px"
      showBalance={true}
      groupByDate={true}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `transactions` | `PointTransaction[]` | Required | Array of transactions |
| `className` | `string` | `undefined` | Additional CSS classes |
| `maxHeight` | `string` | `"500px"` | Maximum scroll height |
| `showBalance` | `boolean` | `true` | Show running balance |
| `groupByDate` | `boolean` | `true` | Group by date |

### Activity Types

| Activity | Icon | Label | Color |
|----------|------|-------|-------|
| `quiz` | Award | 퀴즈 완료 | Blue |
| `post` | FileText | 게시글 작성 | Purple |
| `comment` | MessageSquare | 댓글 작성 | Green |
| `attendance` | Calendar | 출석 체크 | Orange |
| `survey` | BookOpen | 설문조사 | Cyan |
| `referral` | Users | 친구 초대 | Pink |
| `reward` | Gift | 보상 | Amber |
| `purchase` | TrendingDown | 포인트 사용 | Red |

---

## Notification Toggle

**Location**: `/src/components/ui/notification-toggle.tsx`

Toggle switches for notification preferences with categorization.

### Features

- Individual toggle with icon and description
- Group component with categories
- Master "all notifications" toggle
- Category headers
- Compact mode
- Icon for each notification type

### Usage

```tsx
import {
  NotificationToggleGroup,
  NotificationSetting,
} from "@/components/ui/notification-toggle";

const [settings, setSettings] = useState<NotificationSetting[]>([
  {
    id: "comment",
    type: "comment",
    label: "댓글 알림",
    description: "내 게시글에 댓글이 달렸을 때 알림을 받습니다",
    enabled: true,
    category: "activity",
  },
  {
    id: "like",
    type: "like",
    label: "좋아요 알림",
    description: "내 게시글이나 댓글에 좋아요를 받았을 때 알림을 받습니다",
    enabled: true,
    category: "activity",
  },
  {
    id: "trending",
    type: "trending",
    label: "인기 게시글",
    description: "커뮤니티에서 인기 있는 게시글을 추천받습니다",
    enabled: false,
    category: "content",
  },
]);

const handleChange = (id: string, enabled: boolean) => {
  setSettings((prev) =>
    prev.map((s) => (s.id === id ? { ...s, enabled } : s))
  );
};

function NotificationSettings() {
  return (
    <NotificationToggleGroup
      settings={settings}
      onChange={handleChange}
      groupByCategory={true}
      showCategoryHeaders={true}
    />
  );
}
```

### Props

#### NotificationToggleGroup

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `settings` | `NotificationSetting[]` | Required | Array of notification settings |
| `onChange` | `(id, enabled) => void` | Required | Change handler |
| `className` | `string` | `undefined` | Additional CSS classes |
| `groupByCategory` | `boolean` | `true` | Group by category |
| `showCategoryHeaders` | `boolean` | `true` | Show category headers |

#### NotificationToggle (Individual)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `setting` | `NotificationSetting` | Required | Setting object |
| `onChange` | `(id, enabled) => void` | Required | Change handler |
| `className` | `string` | `undefined` | Additional CSS classes |
| `compact` | `boolean` | `false` | Compact mode |

### Notification Types

- `all`: All notifications (Bell)
- `comment`: Comments (MessageSquare)
- `like`: Likes (Heart)
- `achievement`: Achievements (Award)
- `message`: Messages (Mail)
- `reminder`: Reminders (Calendar)
- `trending`: Trending content (TrendingUp)
- `community`: Community updates (Users)
- `education`: Educational content (BookOpen)
- `system`: System notifications (AlertCircle)

### Categories

- `activity`: User activity notifications
- `content`: Content recommendations
- `system`: System and administrative alerts

---

## Design System Integration

All components follow the existing design system:

### Colors

- **Primary**: Teal (`#00C9B7`) from tailwind.config.js
- **Success**: Green
- **Warning**: Amber
- **Error**: Red
- **Accent**: Purple, Mint

### Dark Mode

All components support dark mode using Tailwind's `dark:` classes:

```tsx
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

### Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- Semantic HTML

### Responsive Design

- Mobile-first approach
- Breakpoint: `md:` (768px)
- Touch-friendly hit targets (min 44x44px)
- Collapsible/compact modes for mobile

---

## Installation & Dependencies

All components use existing dependencies:

```json
{
  "dependencies": {
    "@radix-ui/react-switch": "^1.0.0",
    "@radix-ui/react-progress": "^1.0.0",
    "lucide-react": "^0.263.1",
    "class-variance-authority": "^0.7.0",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

No additional packages needed!

---

## Example Integration

### Chat Page with Disclaimer and Citations

```tsx
import { ChatInterface } from "@/components/ChatInterface";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { SourceCitation } from "@/components/chat/SourceCitation";

function ChatPage() {
  return (
    <div className="relative min-h-screen pb-20">
      <ChatInterface />
      <DisclaimerBanner position="bottom" />
    </div>
  );
}
```

### MyPage with Level and Points

```tsx
import { LevelProgress } from "@/components/ui/level-progress";
import { PointsHistory } from "@/components/mypage/PointsHistory";

function MyPage() {
  return (
    <div className="space-y-6">
      <LevelProgress
        currentLevel={3}
        currentPoints={750}
        pointsToNextLevel={250}
        variant="linear"
      />
      <PointsHistory transactions={userTransactions} />
    </div>
  );
}
```

### Settings Page with Notifications

```tsx
import { NotificationToggleGroup } from "@/components/ui/notification-toggle";

function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1>알림 설정</h1>
      <NotificationToggleGroup
        settings={notificationSettings}
        onChange={handleNotificationChange}
      />
    </div>
  );
}
```

---

## Testing Recommendations

### Unit Tests

```tsx
// Example test for DisclaimerBanner
import { render, screen, fireEvent } from '@testing-library/react';
import { DisclaimerBanner } from './disclaimer-banner';

test('dismisses banner when close button is clicked', () => {
  const onDismiss = jest.fn();
  render(<DisclaimerBanner onDismiss={onDismiss} />);

  const closeButton = screen.getByLabelText('면책조항 닫기');
  fireEvent.click(closeButton);

  expect(onDismiss).toHaveBeenCalled();
});
```

### Visual Testing

Test all components in:
- Light and dark modes
- Different screen sizes (mobile, tablet, desktop)
- With varying content lengths
- Empty states
- Loading states

---

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance Considerations

- Components use React.memo where appropriate
- Animations use CSS transitions (hardware accelerated)
- Scroll areas use virtual scrolling for large lists
- Icons are tree-shakeable from lucide-react
- No unnecessary re-renders

---

## Future Enhancements

- [ ] Add Storybook stories for all components
- [ ] Implement animation preferences (prefers-reduced-motion)
- [ ] Add i18n support for multiple languages
- [ ] Create Figma component library
- [ ] Add E2E tests with Playwright
