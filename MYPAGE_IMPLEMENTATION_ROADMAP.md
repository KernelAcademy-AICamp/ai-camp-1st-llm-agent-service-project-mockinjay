# MyPage Features Implementation Roadmap
**CareGuide Application - Development Plan**

---

## Overview

This document provides a detailed implementation roadmap for completing the MyPage (MYP) features based on the test results and requirements analysis.

**Current Status:** 33% Complete (2/6 features implemented)
**Target Completion:** 100% (All 6 MYP features)
**Estimated Timeline:** 8-12 weeks

---

## Feature Priority Matrix

| Feature | Priority | Complexity | User Impact | Est. Time |
|---------|----------|------------|-------------|-----------|
| MYP-005: Notifications | HIGH | LOW | HIGH | 1 week |
| MYP-001: Level View | HIGH | MEDIUM | HIGH | 2 weeks |
| MYP-002: Points History | MEDIUM | MEDIUM | MEDIUM | 2 weeks |
| MYP-003: Premium Purchase | MEDIUM | HIGH | MEDIUM | 3 weeks |
| MYP-006: Bookmark Export | LOW | LOW | LOW | 1 week |
| MYP-004: Payment Management | LOW | HIGH | LOW | 3 weeks |

---

## Phase 1: Quick Wins (Weeks 1-2)

### MYP-005: Push Notification Settings
**Priority:** HIGH | **Complexity:** LOW | **Time:** 1 week

#### Implementation Steps

**Step 1: Create Notification Settings Modal**
```typescript
// File: /new_frontend/src/components/mypage/NotificationSettingsModal.tsx

interface NotificationSettings {
  quizAlerts: boolean;
  communityReplies: boolean;
  communityLikes: boolean;
  surveys: boolean;
  challenges: boolean;
  levelUp: boolean;
  pointAlerts: boolean;
  updates: boolean;
}

export const NotificationSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    quizAlerts: true,
    communityReplies: true,
    communityLikes: true,
    surveys: true,
    challenges: true,
    levelUp: true,
    pointAlerts: true,
    updates: false,
  });

  const handleSave = async () => {
    await updateNotificationSettings(settings);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Toggle switches for each notification type */}
    </Modal>
  );
};
```

**Step 2: Backend API Integration**
```python
# File: /backend/app/api/notification.py

@router.put("/settings")
async def update_notification_settings(
    settings: NotificationSettings,
    current_user: User = Depends(get_current_user)
):
    """Update user notification preferences"""
    updated_settings = await notification_service.update_settings(
        user_id=current_user.id,
        settings=settings
    )
    return updated_settings

@router.get("/settings")
async def get_notification_settings(
    current_user: User = Depends(get_current_user)
):
    """Get user notification preferences"""
    settings = await notification_service.get_settings(current_user.id)
    return settings
```

**Step 3: Database Schema**
```sql
-- Create notification_settings table
CREATE TABLE notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_alerts BOOLEAN DEFAULT true,
    community_replies BOOLEAN DEFAULT true,
    community_likes BOOLEAN DEFAULT true,
    surveys BOOLEAN DEFAULT true,
    challenges BOOLEAN DEFAULT true,
    level_up BOOLEAN DEFAULT true,
    point_alerts BOOLEAN DEFAULT true,
    updates BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

**Step 4: Integration with MyPage**
```typescript
// Update MyPage.tsx to use modal instead of navigation
<MenuItem
  icon={<Bell size={20} />}
  label="Notifications"
  onClick={() => setIsNotificationModalOpen(true)}
/>

<NotificationSettingsModal
  isOpen={isNotificationModalOpen}
  onClose={() => setIsNotificationModalOpen(false)}
/>
```

**Testing Checklist:**
- [ ] All 8 toggle switches work correctly
- [ ] Settings persist after save
- [ ] Settings load on modal open
- [ ] Modal closes after save
- [ ] Error handling for API failures
- [ ] Loading state while saving

---

## Phase 2: Core Gamification (Weeks 3-4)

### MYP-001: Level View System
**Priority:** HIGH | **Complexity:** MEDIUM | **Time:** 2 weeks

#### Implementation Strategy

**Step 1: Define Level System**
```typescript
// File: /new_frontend/src/types/levels.ts

export interface Level {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  benefits: string[];
}

export const LEVEL_SYSTEM: Level[] = [
  { level: 1, name: '건강 새싹', minPoints: 0, maxPoints: 99, color: '#10B981', icon: '🌱', benefits: ['기본 기능 사용'] },
  { level: 2, name: '건강 탐험가', minPoints: 100, maxPoints: 299, color: '#3B82F6', icon: '🌿', benefits: ['커뮤니티 참여', '포인트 2배'] },
  { level: 3, name: '건강 전문가', minPoints: 300, maxPoints: 599, color: '#8B5CF6', icon: '🌳', benefits: ['프리미엄 콘텐츠', '포인트 3배'] },
  { level: 4, name: '건강 마스터', minPoints: 600, maxPoints: 999, color: '#F59E0B', icon: '🏆', benefits: ['전문가 상담', 'VIP 배지'] },
  { level: 5, name: '건강 챔피언', minPoints: 1000, maxPoints: Infinity, color: '#EF4444', icon: '👑', benefits: ['모든 기능 무제한', '특별 이벤트'] },
];

export function calculateLevel(points: number): Level {
  return LEVEL_SYSTEM.find(level =>
    points >= level.minPoints && points <= level.maxPoints
  ) || LEVEL_SYSTEM[0];
}

export function getProgressToNextLevel(points: number): {
  current: Level;
  next: Level | null;
  progress: number;
  pointsNeeded: number;
} {
  const current = calculateLevel(points);
  const nextLevelIndex = current.level;
  const next = LEVEL_SYSTEM[nextLevelIndex] || null;

  if (!next) {
    return { current, next: null, progress: 100, pointsNeeded: 0 };
  }

  const pointsNeeded = next.minPoints - points;
  const totalRange = next.minPoints - current.minPoints;
  const currentProgress = points - current.minPoints;
  const progress = (currentProgress / totalRange) * 100;

  return { current, next, progress, pointsNeeded };
}
```

**Step 2: Level Display Component**
```typescript
// File: /new_frontend/src/components/mypage/LevelDisplay.tsx

export const LevelDisplay: React.FC<{ points: number }> = ({ points }) => {
  const { current, next, progress, pointsNeeded } = getProgressToNextLevel(points);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-primary-600" size={24} />
        <h3 className="font-bold text-gray-900">내 레벨</h3>
      </div>

      {/* Current Level Badge */}
      <div
        className="rounded-xl p-6 mb-4 text-center"
        style={{ background: `linear-gradient(135deg, ${current.color}15 0%, ${current.color}30 100%)` }}
      >
        <div className="text-6xl mb-2">{current.icon}</div>
        <div className="text-2xl font-bold" style={{ color: current.color }}>
          Lv.{current.level} {current.name}
        </div>
        <div className="text-sm text-gray-600 mt-2">{points} 포인트</div>
      </div>

      {/* Progress to Next Level */}
      {next && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">다음 레벨까지</span>
            <span className="font-semibold text-primary-600">
              {pointsNeeded} 포인트 필요
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${current.color}, ${next.color})`
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>Lv.{current.level}</span>
            <span>Lv.{next.level}</span>
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">현재 혜택</h4>
        <ul className="space-y-1">
          {current.benefits.map((benefit, idx) => (
            <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

**Step 3: Level-Up History**
```typescript
// File: /new_frontend/src/components/mypage/LevelHistory.tsx

interface LevelUpEvent {
  id: string;
  previousLevel: number;
  newLevel: number;
  achievedAt: string;
  pointsEarned: number;
}

export const LevelHistory: React.FC = () => {
  const [history, setHistory] = useState<LevelUpEvent[]>([]);

  useEffect(() => {
    // Fetch level-up history from API
    fetchLevelHistory().then(setHistory);
  }, []);

  return (
    <div className="space-y-3">
      {history.map(event => (
        <div key={event.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl">🎉</div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">
              레벨 {event.previousLevel} → {event.newLevel}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(event.achievedAt).toLocaleDateString('ko-KR')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-primary-600">
              +{event.pointsEarned}P
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

**Step 4: Backend Support**
```python
# File: /backend/app/services/level_service.py

class LevelService:
    LEVELS = [
        {"level": 1, "name": "건강 새싹", "min_points": 0, "max_points": 99},
        {"level": 2, "name": "건강 탐험가", "min_points": 100, "max_points": 299},
        {"level": 3, "name": "건강 전문가", "min_points": 300, "max_points": 599},
        {"level": 4, "name": "건강 마스터", "min_points": 600, "max_points": 999},
        {"level": 5, "name": "건강 챔피언", "min_points": 1000, "max_points": float('inf')},
    ]

    @staticmethod
    def calculate_level(points: int) -> dict:
        for level in LevelService.LEVELS:
            if level["min_points"] <= points <= level["max_points"]:
                return level
        return LevelService.LEVELS[0]

    @staticmethod
    async def check_level_up(user_id: int, new_points: int):
        """Check if user leveled up and record event"""
        user = await get_user(user_id)
        old_level = LevelService.calculate_level(user.total_points)
        new_level = LevelService.calculate_level(new_points)

        if new_level["level"] > old_level["level"]:
            # Record level-up event
            await record_level_up(
                user_id=user_id,
                previous_level=old_level["level"],
                new_level=new_level["level"],
                points_earned=new_points - user.total_points
            )

            # Send notification
            await send_notification(
                user_id=user_id,
                type="level_up",
                data={
                    "new_level": new_level["level"],
                    "level_name": new_level["name"]
                }
            )
```

**Testing Checklist:**
- [ ] Level calculation is accurate
- [ ] Progress bar shows correct percentage
- [ ] Level-up events are recorded
- [ ] Notifications are sent on level-up
- [ ] Benefits display correctly
- [ ] Level history is accessible

---

## Phase 3: Enhanced Features (Weeks 5-6)

### MYP-002: Point History Enhancement
**Priority:** MEDIUM | **Complexity:** MEDIUM | **Time:** 2 weeks

#### Implementation Steps

**Step 1: Point History Component**
```typescript
// File: /new_frontend/src/components/mypage/PointHistory.tsx

interface PointTransaction {
  id: string;
  date: string;
  activity: string;
  points: number;
  type: 'earn' | 'spend';
  category: string;
  description?: string;
}

export const PointHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filter !== 'all' && tx.type !== filter) return false;
      if (dateRange.start && new Date(tx.date) < new Date(dateRange.start)) return false;
      if (dateRange.end && new Date(tx.date) > new Date(dateRange.end)) return false;
      return true;
    });
  }, [transactions, filter, dateRange]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('earn')}
            className={`px-4 py-2 rounded-lg ${filter === 'earn' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
          >
            획득
          </button>
          <button
            onClick={() => setFilter('spend')}
            className={`px-4 py-2 rounded-lg ${filter === 'spend' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
          >
            사용
          </button>
        </div>

        {/* Date Range Picker */}
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="input-field flex-1"
          />
          <span className="self-center">~</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="input-field flex-1"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredTransactions.map(tx => (
          <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{tx.activity}</div>
              <div className="text-sm text-gray-500">
                {new Date(tx.date).toLocaleDateString('ko-KR')} • {tx.category}
              </div>
              {tx.description && (
                <div className="text-xs text-gray-400 mt-1">{tx.description}</div>
              )}
            </div>
            <div className={`text-lg font-bold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
              {tx.type === 'earn' ? '+' : '-'}{tx.points}P
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              +{transactions.filter(tx => tx.type === 'earn').reduce((sum, tx) => sum + tx.points, 0)}P
            </div>
            <div className="text-sm text-gray-500">총 획득</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              -{transactions.filter(tx => tx.type === 'spend').reduce((sum, tx) => sum + tx.points, 0)}P
            </div>
            <div className="text-sm text-gray-500">총 사용</div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Backend API**
```python
# File: /backend/app/api/points.py

@router.get("/history")
async def get_point_history(
    user_id: int,
    filter_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get user point transaction history with filters"""
    transactions = await point_service.get_history(
        user_id=user_id,
        filter_type=filter_type,
        start_date=start_date,
        end_date=end_date
    )
    return transactions

@router.post("/record")
async def record_point_transaction(
    transaction: PointTransaction,
    current_user: User = Depends(get_current_user)
):
    """Record a point transaction (earn or spend)"""
    recorded = await point_service.record_transaction(transaction)
    return recorded
```

---

## Phase 4: Monetization (Weeks 7-9)

### MYP-003: Premium Purchase Flow
**Priority:** MEDIUM | **Complexity:** HIGH | **Time:** 3 weeks

#### Implementation Strategy

**Week 1: UI/UX Implementation**
- Design point package selection modal
- Create payment method selector
- Build order summary component
- Implement loading and success states

**Week 2: Payment Gateway Integration**
- Integrate with PG (e.g., Toss Payments, KakaoPay)
- Implement payment request flow
- Handle payment callbacks
- Error handling and retry logic

**Week 3: Backend & Testing**
- Create order management system
- Implement transaction recording
- Add receipt generation
- Comprehensive testing

**Files to Create:**
```
/new_frontend/src/components/mypage/
  - PremiumPurchaseModal.tsx
  - PointPackageCard.tsx
  - PaymentMethodSelector.tsx
  - OrderSummary.tsx
  - PaymentSuccess.tsx

/backend/app/
  - services/payment_service.py
  - api/purchase.py
  - models/order.py
```

---

## Phase 5: Additional Features (Weeks 10-12)

### MYP-006: Bookmark Export Enhancement
**Time:** 1 week

### MYP-004: Payment Management
**Time:** 3 weeks

---

## Testing Strategy

### Unit Testing
```typescript
// Example: Level calculation tests
describe('Level System', () => {
  it('should calculate correct level for points', () => {
    expect(calculateLevel(50).level).toBe(1);
    expect(calculateLevel(150).level).toBe(2);
    expect(calculateLevel(500).level).toBe(3);
  });

  it('should calculate progress to next level', () => {
    const { progress, pointsNeeded } = getProgressToNextLevel(50);
    expect(progress).toBeGreaterThan(0);
    expect(pointsNeeded).toBe(50);
  });
});
```

### Integration Testing
```typescript
// Example: Notification settings integration test
describe('Notification Settings', () => {
  it('should save and retrieve settings', async () => {
    const settings = { quizAlerts: false, communityReplies: true };
    await updateNotificationSettings(settings);
    const retrieved = await getNotificationSettings();
    expect(retrieved).toEqual(settings);
  });
});
```

### E2E Testing
```typescript
// Example: Point purchase flow
test('User can purchase points', async ({ page }) => {
  await page.goto('/mypage');
  await page.click('text=Subscription & Billing');
  await page.click('text=500P');
  await page.click('text=카드 결제');
  await page.click('text=결제하기');
  await expect(page.locator('text=결제 완료')).toBeVisible();
});
```

---

## Success Metrics

### Phase 1 (Notifications)
- [ ] 90% of users enable at least one notification
- [ ] Settings persistence rate > 95%
- [ ] No critical bugs in production

### Phase 2 (Levels)
- [ ] Level display accuracy: 100%
- [ ] Progress bar updates in real-time
- [ ] Level-up notifications sent within 1 second

### Phase 3 (Point History)
- [ ] Filter performance < 100ms
- [ ] Export functionality works for all formats
- [ ] Data accuracy: 100%

### Phase 4 (Premium Purchase)
- [ ] Payment success rate > 98%
- [ ] Average checkout time < 2 minutes
- [ ] Zero payment security incidents

---

## Risk Mitigation

### Technical Risks
1. **Payment Integration Complexity**
   - Mitigation: Use established PG providers
   - Fallback: Implement manual payment processing

2. **Data Consistency**
   - Mitigation: Implement transaction logging
   - Monitoring: Real-time data validation

3. **Performance Issues**
   - Mitigation: Implement pagination and lazy loading
   - Optimization: Database indexing and caching

### Business Risks
1. **Low Adoption**
   - Mitigation: User education and onboarding
   - Incentive: Early adopter bonuses

2. **Payment Fraud**
   - Mitigation: Implement fraud detection
   - Validation: Multi-factor authentication

---

## Maintenance Plan

### Daily
- Monitor payment transactions
- Check error logs
- Review user feedback

### Weekly
- Analyze usage metrics
- Update documentation
- Review and prioritize bug fixes

### Monthly
- Performance optimization
- Security audits
- Feature usage analysis
- User satisfaction surveys

---

## Resources Required

### Development Team
- 2 Frontend Developers
- 1 Backend Developer
- 1 QA Engineer
- 1 UI/UX Designer

### Tools & Services
- Payment Gateway (Toss/KakaoPay)
- Analytics (Google Analytics, Mixpanel)
- Error Tracking (Sentry)
- Email Service (SendGrid)
- Push Notification (FCM)

### Budget Estimate
- Development: 8-12 weeks @ team rate
- PG Integration: One-time setup + transaction fees
- Third-party Services: Monthly subscriptions
- Testing & QA: 20% of dev time
- Contingency: 15% buffer

---

## Conclusion

This roadmap provides a comprehensive plan for implementing all MyPage features (MYP-001 through MYP-006). By following this phased approach, we can deliver value incrementally while managing risk and ensuring quality.

**Next Actions:**
1. Review and approve roadmap
2. Assign development team
3. Set up project tracking
4. Begin Phase 1 implementation
5. Schedule weekly progress reviews

---

**Document Version:** 1.0
**Last Updated:** November 27, 2025
**Owner:** Development Team
**Stakeholders:** Product, Engineering, Design, QA
