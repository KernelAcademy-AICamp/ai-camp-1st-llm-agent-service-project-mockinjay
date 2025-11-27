# Diet Care UX Storyline - Enhanced Sections

**Supplement to DIET_CARE_UX_STORYLINE.md**

This document provides additional detailed sections requested for comprehensive UX planning:
1. Expanded User Personas (3 types)
2. Feature Prioritization Matrix
3. Detailed Micro-interaction Specifications
4. Success Metrics and KPIs
5. Emotional Design Deep Dive

---

## Additional User Personas

### Persona 2: Caregiver - "이민정" (Lee Min-jung)

**Demographics:**
- Age: 35 years old
- Gender: Female
- Occupation: Marketing Manager
- Relationship: Daughter caring for father with CKD Stage 4
- Tech Literacy: High (early adopter, uses multiple apps)

**Context:**
- Father lives independently but needs oversight
- Works full-time, limited caregiving time
- Primary meal prep on weekends
- Monitors father's health remotely during week
- Coordinates with healthcare providers

**Goals & Motivations:**
- Ensure father's dietary safety
- Monitor compliance without being intrusive
- Reduce anxiety about father's health
- Efficient meal planning and prep
- Evidence-based communication with doctors

**Pain Points:**
- Cannot monitor father's daily meals in person
- Uncertainty if father is following diet correctly
- Time constraints balancing work and care
- Difficulty understanding medical terminology
- Guilt about not doing "enough"
- Communication barriers with father

**Technology Usage:**
- Smartphone: iPhone (iOS)
- Heavy app user: Health, productivity, communication apps
- Prefers automation and smart notifications
- Values data visualization and reports
- Uses shared calendar and reminder apps

**Key Needs:**
- Multi-user account (view father's data)
- Weekly summary reports for doctor visits
- Alert system if father exceeds limits
- Shared meal planning features
- Educational content for caregivers

**Key Quote:**
> "아버지가 혼자 계실 때 제대로 드시는지 알 수 없어 불안해요. 주말에 미리 식사를 준비하지만, 평일에 뭘 드시는지 확인할 방법이 필요해요."
>
> "I'm anxious not knowing if my father eats properly when he's alone. I prep meals on weekends, but I need a way to check what he eats during the week."

---

### Persona 3: Healthcare Professional - "박지원" (Park Ji-won)

**Demographics:**
- Age: 42 years old
- Gender: Female
- Occupation: Registered Dietitian (CKD specialist)
- Work Setting: University hospital nephrology department
- Tech Literacy: High (uses EMR, telehealth platforms)

**Context:**
- Manages 50+ CKD patients
- Conducts monthly diet consultations
- Collaborates with nephrologists
- Prescribes diet plans and monitors adherence
- Limited time per patient (30 min/month)

**Goals & Motivations:**
- Improve patient dietary adherence
- Provide personalized diet education
- Monitor patient progress between visits
- Evidence-based diet recommendations
- Efficient patient communication

**Pain Points:**
- Limited consultation time with patients
- Patients forget dietary instructions between visits
- Difficult to track real-world dietary adherence
- Manual nutrition calculation is time-consuming
- Lack of visibility into daily patient behaviors
- Inconsistent patient self-reporting

**Technology Usage:**
- Desktop: Hospital EMR system
- Tablet: For patient education during consultations
- Values integration with existing healthcare systems
- Prefers evidence-based tools with clinical validation
- Needs HIPAA/PIPA compliant solutions

**Key Needs:**
- Healthcare provider portal
- Patient list management dashboard
- Progress reports and analytics
- Ability to review and adjust patient goals
- Communication channel with patients
- Integration with EMR (export capability)

**Key Quote:**
> "환자들이 상담 때는 이해했다고 하지만, 집에 가면 뭘 먹어야 할지 잊어버려요. 실시간으로 환자의 식단을 모니터링하고 피드백을 줄 수 있다면 치료 효과가 훨씬 좋을 거예요."
>
> "Patients say they understand during consultations, but forget what to eat once they're home. If I could monitor their diet in real-time and provide feedback, treatment outcomes would be much better."

---

## Feature Prioritization Matrix

### Methodology: RICE Framework

**RICE Score = (Reach × Impact × Confidence) / Effort**

- **Reach**: Number of users affected per quarter (1-10 scale)
- **Impact**: Effect on user goals (1=minimal, 3=high)
- **Confidence**: Certainty of estimates (0.5=low, 1.0=high)
- **Effort**: Person-weeks required (actual number)

---

### Core Features (MVP - Must Have)

| Feature | Reach | Impact | Confidence | Effort | RICE Score | Priority |
|---------|-------|--------|------------|--------|------------|----------|
| **Basic Meal Logging** | 10 | 3 | 1.0 | 2 | 15.0 | P0 |
| **Daily Progress Dashboard** | 10 | 3 | 1.0 | 3 | 10.0 | P0 |
| **Nutrient Goal Setting** | 10 | 3 | 0.9 | 2 | 13.5 | P0 |
| **CKD Stage Profile** | 10 | 3 | 1.0 | 1 | 30.0 | P0 |
| **Food Database** | 10 | 2 | 0.8 | 4 | 4.0 | P0 |
| **Nutrient Calculations** | 10 | 3 | 0.9 | 3 | 9.0 | P0 |
| **Basic Alerts (Over Limit)** | 9 | 2 | 0.9 | 1 | 16.2 | P0 |
| **Meal History** | 8 | 2 | 1.0 | 2 | 8.0 | P0 |

**MVP Total Effort**: 18 person-weeks (4.5 months with 1 dev)

---

### Enhanced Features (V1.0 - Should Have)

| Feature | Reach | Impact | Confidence | Effort | RICE Score | Priority |
|---------|-------|--------|------------|--------|------------|----------|
| **AI Food Image Analysis** | 10 | 3 | 0.7 | 6 | 3.5 | P1 |
| **Streak Tracking** | 8 | 2 | 0.9 | 1 | 14.4 | P1 |
| **Achievement Badges** | 7 | 2 | 0.8 | 2 | 5.6 | P1 |
| **NutriCoach Education** | 9 | 3 | 0.9 | 4 | 6.1 | P1 |
| **Weekly Summary Reports** | 8 | 2 | 1.0 | 2 | 8.0 | P1 |
| **Recipe Database** | 7 | 2 | 0.8 | 5 | 2.2 | P1 |
| **Favorite Foods** | 9 | 1 | 1.0 | 1 | 9.0 | P1 |
| **Dark Mode** | 5 | 1 | 1.0 | 0.5 | 10.0 | P1 |
| **Notification System** | 9 | 2 | 0.9 | 2 | 8.1 | P1 |

**V1.0 Additional Effort**: 23.5 person-weeks (5.9 months)

---

### Advanced Features (V2.0 - Could Have)

| Feature | Reach | Impact | Confidence | Effort | RICE Score | Priority |
|---------|-------|--------|------------|--------|------------|----------|
| **Meal Planning (7-day)** | 6 | 3 | 0.6 | 6 | 1.8 | P2 |
| **Grocery List Generation** | 6 | 2 | 0.7 | 3 | 2.8 | P2 |
| **Barcode Scanner** | 7 | 2 | 0.6 | 4 | 2.1 | P2 |
| **Voice Input** | 5 | 2 | 0.5 | 5 | 1.0 | P2 |
| **Restaurant Nutrition DB** | 6 | 2 | 0.5 | 8 | 0.8 | P2 |
| **Water Intake Tracking** | 7 | 1 | 0.8 | 2 | 2.8 | P2 |
| **Symptom Journal** | 5 | 2 | 0.7 | 3 | 2.3 | P2 |
| **Lab Result Tracking** | 6 | 3 | 0.6 | 4 | 2.7 | P2 |
| **Medication Reminders** | 6 | 2 | 0.7 | 3 | 2.8 | P2 |

**V2.0 Additional Effort**: 38 person-weeks (9.5 months)

---

### Premium/Enterprise (V3.0+ - Nice to Have)

| Feature | Reach | Impact | Confidence | Effort | RICE Score | Priority |
|---------|-------|--------|------------|--------|------------|----------|
| **Provider Portal** | 3 | 3 | 0.5 | 10 | 0.45 | P3 |
| **Family Sharing** | 4 | 2 | 0.6 | 5 | 0.96 | P3 |
| **Telehealth Integration** | 3 | 3 | 0.4 | 12 | 0.30 | P3 |
| **EMR Export** | 3 | 2 | 0.5 | 8 | 0.38 | P3 |
| **Community Forum** | 5 | 1 | 0.6 | 6 | 0.50 | P3 |
| **Wearable Integration** | 4 | 1 | 0.4 | 6 | 0.27 | P3 |
| **AI Meal Suggestions** | 6 | 3 | 0.3 | 12 | 0.45 | P3 |
| **Personalized Coaching** | 4 | 3 | 0.3 | 20 | 0.18 | P3 |

---

### Decision Framework

**Go/No-Go Criteria:**

1. **RICE Score >= 3.0**: Prioritize for development
2. **RICE Score 1.0-2.9**: Consider based on strategic value
3. **RICE Score < 1.0**: Defer to future versions

**Strategic Overrides:**

Some features may have low RICE scores but high strategic value:
- **Provider Portal**: Low user reach but critical for B2B2C strategy
- **AI Image Analysis**: High effort but major differentiator
- **EMR Export**: Enterprise sales requirement

---

## Detailed Micro-interaction Specifications

### Design Principles

1. **Provide Feedback**: Every action has immediate response
2. **Guide Users**: Subtle cues indicate next steps
3. **Delight Moments**: Celebrate achievements meaningfully
4. **Reduce Anxiety**: Gentle errors, encouraging messages
5. **Respect Motion Preferences**: Honor accessibility settings

---

### Micro-interaction 1: Meal Logging Success

**Trigger**: User completes saving a meal

**Animation Sequence** (1.8 seconds total):

```
Frame 1 (0ms): User taps "Save Meal" button
  - Button scale: 1.0 → 0.95 (100ms, ease-out)
  - Haptic: light impact

Frame 2 (100ms): Loading state
  - Button shows spinner (400ms)
  - Disable form inputs
  - Cursor: progress

Frame 3 (500ms): Success animation
  - Checkmark icon scales 0 → 1.2 → 1.0 (300ms, bounce)
  - Button color: primary → success-green
  - Haptic: success notification

Frame 4 (800ms): Dashboard update
  - Progress rings animate to new values (500ms, ease-out)
  - Number counters increment (500ms)
  - Meal card slides into history (300ms, slide-up)

Frame 5 (1300ms): Toast notification
  - Success toast slides up from bottom (200ms)
  - Message: "식사가 기록되었습니다! 🎉"
  - Auto-dismiss after 3s

Frame 6 (1800ms): Return to steady state
  - Form resets (if applicable)
  - Focus returns to next action
```

**CSS Specification**:
```css
@keyframes saveSuccess {
  0% { transform: scale(1); }
  25% { transform: scale(0.95); }
  50% { transform: scale(1.1); background-color: var(--success-500); }
  100% { transform: scale(1); }
}

.save-button--success {
  animation: saveSuccess 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Fallback** (prefers-reduced-motion):
- Instant state change
- No animations
- Simple text confirmation

---

### Micro-interaction 2: Nutrient Over-Limit Warning

**Trigger**: User adds food that exceeds daily sodium limit

**Animation Sequence** (2 seconds total):

```
Frame 1 (0ms): Threshold crossed
  - Detect: New total > 100% of goal
  - Calculate: Amount over (e.g., +150mg)

Frame 2 (200ms): Visual alert
  - Sodium progress ring color: green → amber (300ms)
  - Ring gently pulses (2s loop, infinite)
  - Warning icon appears next to value (fade-in 200ms)

Frame 3 (500ms): Info card reveals
  - Card slides down from top (300ms, ease-out)
  - Orange gradient background
  - Icon: ⚠️ (but friendly, not alarming)

Frame 4 (800ms): Message display
  - Title: "나트륨 목표를 초과했어요"
  - Body: "오늘은 목표보다 150mg 더 섭취했습니다."
  - Suggestion: "내일은 저염 음식을 선택해보세요."
  - CTA button: "저염 레시피 보기"

Frame 5 (Persistent): Remain visible
  - User can dismiss or take action
  - Icon remains in summary view
  - Tappable for detail view
```

**Copy Variations**:

**80-90% of limit (Yellow Alert)**:
```
📊 나트륨을 80% 사용했어요
잘 조절하고 계시네요!
남은 하루 식사도 화이팅!
```

**100-110% of limit (Amber Alert)**:
```
⚠️ 나트륨 목표를 초과했어요
오늘은 목표보다 150mg 더 섭취했습니다.
내일은 저염 음식을 선택해보세요.

💡 팁: 신선한 채소와 허브로 맛을 내보세요
```

**110%+ of limit (Red Alert)**:
```
⛔ 나트륨을 많이 섭취했어요
오늘은 목표보다 450mg 더 섭취했습니다.

⚕️ CKD 환자에게 과도한 나트륨은 부담이 될 수 있어요.
내일부터 다시 조절해봐요. 함께 노력해요!

📋 저염 식단 가이드 보기
```

---

### Micro-interaction 3: Streak Milestone Celebration

**Trigger**: User logs meal on 7th consecutive day

**Animation Sequence** (5 seconds total):

```
Frame 1 (0ms): Milestone detection
  - System: Check if today's log = 7-day streak
  - Prepare celebration assets

Frame 2 (300ms): Initial celebration
  - Confetti particles explode from streak icon (1s)
  - Streak number: 6 → 7 (count-up animation, 500ms)
  - Flame icon pulses and grows (800ms)
  - Sound: Success chime (if enabled)

Frame 3 (1300ms): Modal reveal
  - Full-screen modal slides up (400ms, spring)
  - Backdrop: Gradient overlay
  - Content fades in (300ms)

Frame 4 (2000ms): Achievement display
  - Large badge icon (scale 0 → 1, bounce, 600ms)
  - Title: "7일 연속 기록!" (fade-in, 300ms)
  - Subtitle: "꾸준함이 건강을 만듭니다" (fade-in, 300ms, delay 200ms)
  - Stats:
    - "7일 연속 기록 ✓"
    - "평균 나트륨 준수율: 82%"
    - "+100 포인트 획득!"
  - Each stat fades in (stagger 150ms)

Frame 5 (3500ms): Call to action
  - Share button (fade-in, 300ms)
  - Continue button (fade-in, 300ms, primary)
  - Generate shareable card (background)

Frame 6 (5000ms): Auto-dismiss or user action
  - If no action: Auto-dismiss (fade-out 400ms)
  - Return to dashboard
  - Badge added to collection
```

**Shareable Card Design**:
```
┌─────────────────────────────────────┐
│                                     │
│          🔥 7일 연속 기록 🔥          │
│                                     │
│       나는 7일 동안 꾸준히            │
│       식단을 관리했습니다!            │
│                                     │
│  📊 평균 나트륨 준수율: 82%          │
│  💪 단백질 목표 달성: 6/7일           │
│  ⭐ 획득 포인트: +100                │
│                                     │
│    #CKD건강관리 #꾸준함이답          │
│    Diet Care App                    │
└─────────────────────────────────────┘
```

---

### Micro-interaction 4: AI Image Analysis Loading

**Trigger**: User uploads food image for analysis

**Animation Sequence** (10-15 seconds):

```
Frame 1 (0ms): Upload initiated
  - Image preview (100ms fade-in)
  - Progress bar appears (slide-down 200ms)

Frame 2 (200ms): Upload progress
  - Progress bar: 0 → 100% (2s)
  - Text: "이미지 업로드 중..."

Frame 3 (2000ms): Analysis phase
  - Text: "AI가 음식을 분석하고 있어요..."
  - Animated food icons float across screen
  - Icons: 🍚 🥗 🍖 🥕 🍊 (random positions, continuous)

Frame 4 (2000-12000ms): Educational tips rotation
  - Every 3 seconds, show new tip:
    - "💡 감자를 물에 담가두면 칼륨을 줄일 수 있어요"
    - "🧂 신선한 허브는 나트륨 없이 풍미를 더해요"
    - "🥒 오이는 저칼륨 채소예요"
    - "🍊 오렌지는 고칼륨이니 주의하세요"
  - Each tip fades in/out (500ms)

Frame 5 (12000ms): Analysis complete
  - Success checkmark (scale 0 → 1.3 → 1, 600ms)
  - Sound: Completion chime
  - Haptic: success notification
  - Text: "분석 완료!"

Frame 6 (13000ms): Results reveal
  - Loading screen fade-out (300ms)
  - Results card slide-up (400ms, ease-out)
  - Food items appear one-by-one (stagger 200ms)
```

**Loading State Component**:
```jsx
<div className="analysis-loading">
  <div className="upload-progress">
    <ProgressBar value={uploadProgress} />
    <p>이미지 업로드 중... {uploadProgress}%</p>
  </div>

  <div className="analysis-phase">
    <FloatingFoodIcons />
    <Spinner size="large" />
    <p>AI가 음식을 분석하고 있어요...</p>
  </div>

  <div className="educational-tips">
    <AnimatedTips
      tips={nutritionTips}
      interval={3000}
      fadeTransition={500}
    />
  </div>
</div>
```

---

### Micro-interaction 5: Goal Setting Live Preview

**Trigger**: User adjusts sodium slider in goal settings

**Interaction Flow** (Real-time):

```
User Action: Drag slider from 2000mg → 1800mg

Frame 1 (0ms): Slider drag
  - Thumb follows touch/mouse (instant)
  - Haptic: light impact at 100mg increments
  - Value updates in real-time

Frame 2 (0ms, simultaneous): Preview update
  - Progress ring adjusts to new target (200ms, smooth)
  - Percentage recalculates (200ms)
  - "Current" vs "New" comparison shown

Frame 3 (0ms, simultaneous): Impact preview
  - Show meals from history
  - Highlight which would be over new limit
  - Count: "3 meals this week would exceed new limit"

Frame 4 (0ms, simultaneous): Recommendation
  - If too restrictive: "이 목표는 매우 엄격해요"
  - If appropriate: "권장 범위 내 목표예요 ✓"
  - If too lenient: "더 낮춰보는 건 어때요?"

Frame 5 (Debounced 300ms): Finalize
  - Value settles
  - Final preview state
  - Save button enabled
```

**Visual Spec**:
```jsx
<div className="goal-setting-preview">
  <div className="slider-container">
    <Slider
      min={1000}
      max={3000}
      step={100}
      value={sodiumGoal}
      onChange={(value) => {
        setSodiumGoal(value);
        updatePreview(value);
      }}
      hapticFeedback
      showMarkers={[1500, 2000, 2500]} // Recommended ranges
    />
    <div className="value-display">
      <span className="current">{sodiumGoal}</span>
      <span className="unit">mg/일</span>
    </div>
  </div>

  <div className="live-preview">
    <ProgressRing
      current={todayIntake}
      goal={sodiumGoal}
      animate
    />
    <ImpactAnalysis
      historicalMeals={recentMeals}
      newGoal={sodiumGoal}
    />
  </div>

  <div className="recommendation">
    <RecommendationBadge goal={sodiumGoal} stage={ckdStage} />
  </div>
</div>
```

---

### Micro-interaction 6: Empty State Illustration

**Trigger**: User opens Diet Log with no entries

**Animation Sequence** (3 seconds total):

```
Frame 1 (0ms): Empty state detection
  - Check: No meal entries for today

Frame 2 (300ms): Illustration appears
  - Illustration fades in (500ms)
  - Character waving (subtle bounce, 600ms)

Frame 3 (800ms): Message reveals
  - Title: "아직 오늘의 식사를 기록하지 않았어요"
  - Subtitle: "첫 식사를 기록하고 건강 관리를 시작하세요!"
  - Each line fades in (stagger 200ms)

Frame 4 (1400ms): CTA appears
  - Primary button: "식사 기록하기" (slide-up 300ms)
  - Secondary link: "가이드 보기" (fade-in 300ms, delay 150ms)

Frame 5 (2000ms): Helpful tips
  - 3 quick tip cards slide in from bottom (stagger 150ms)
  - "📸 사진으로 빠르게"
  - "🔍 음식 검색하기"
  - "⭐ 자주 먹는 음식 저장"
```

**Illustration Style**:
- Friendly, approachable character
- Korean context (chopsticks, rice bowl)
- Warm colors (not cold/sterile)
- Subtle animation (breathing, blinking)

---

### Micro-interaction 7: Onboarding Progress

**Trigger**: User completes onboarding step

**Animation Sequence** (Per Step):

```
Step 1 → Step 2 Transition:

Frame 1 (0ms): Step completion
  - User taps "Next"
  - Current step checkmark appears (scale 0 → 1, 300ms)

Frame 2 (300ms): Progress bar update
  - Progress bar fills: 25% → 50% (600ms, ease-out)
  - Percentage number counts up (600ms)

Frame 3 (600ms): Current step minimizes
  - Current step card scales down and fades (400ms)
  - Moves to "completed" area (slide-up 400ms)

Frame 4 (1000ms): Next step reveals
  - Next step card slides in from right (400ms, spring)
  - Content fades in (300ms, delay 200ms)
  - Focus shifts to first input

Frame 5 (1400ms): Encouragement
  - Micro-copy appears: "잘하고 있어요! 2단계 남았어요"
  - Confetti (minimal) if milestone (e.g., 50%)
```

**Progress Indicator Spec**:
```jsx
<div className="onboarding-progress">
  <div className="step-tracker">
    <Step status="completed" number={1} label="프로필" />
    <Step status="active" number={2} label="목표 설정" />
    <Step status="pending" number={3} label="기능 소개" />
    <Step status="pending" number={4} label="완료" />
  </div>

  <ProgressBar
    current={currentStep}
    total={totalSteps}
    showPercentage
    animate
  />

  <p className="encouragement">
    잘하고 있어요! {totalSteps - currentStep}단계 남았어요
  </p>
</div>
```

---

## Success Metrics & KPIs

### Primary Metrics (North Star)

#### 1. Weekly Active Users (WAU)

**Definition**: Unique users who log at least one meal per week

**Target**:
- Month 1: 40% of registered users
- Month 3: 60% of registered users
- Month 6: 70% of registered users

**Measurement**:
```sql
SELECT
  COUNT(DISTINCT user_id) as weekly_active,
  COUNT(DISTINCT user_id) / (SELECT COUNT(*) FROM users) * 100 as wau_percentage
FROM meal_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
```

**Why It Matters**: Core indicator of product-market fit and habit formation

---

#### 2. Dietary Adherence Rate

**Definition**: % of logged meals within all nutrient goals

**Target**:
- Baseline (Month 1): Establish baseline (~40% expected)
- Month 3: +15% improvement
- Month 6: +30% improvement

**Measurement**:
```sql
SELECT
  SUM(CASE WHEN
    sodium <= user_goal.sodium AND
    potassium <= user_goal.potassium AND
    protein BETWEEN user_goal.protein * 0.9 AND user_goal.protein * 1.1
  THEN 1 ELSE 0 END) / COUNT(*) * 100 as adherence_rate
FROM meal_logs
JOIN user_goals ON meal_logs.user_id = user_goals.user_id
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
```

**Why It Matters**: Direct health outcome indicator

---

#### 3. 7-Day Retention Rate

**Definition**: % of new users who return 7 days after signup

**Target**:
- Month 1: 50%
- Month 3: 60%
- Month 6: 70%

**Measurement**:
```sql
WITH cohort AS (
  SELECT user_id, DATE(created_at) as signup_date
  FROM users
  WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
)
SELECT
  COUNT(DISTINCT CASE WHEN activity_date = signup_date + INTERVAL '7 days'
    THEN c.user_id END) / COUNT(DISTINCT c.user_id) * 100 as d7_retention
FROM cohort c
LEFT JOIN user_activity ua ON c.user_id = ua.user_id
```

**Why It Matters**: Predicts long-term engagement and habit formation

---

### Secondary Metrics (Supporting)

#### 4. Average Session Length

**Definition**: Mean time from app open to close

**Target**: 4-6 minutes per session

**Measurement**: Client-side analytics (Firebase/Mixpanel)

**Interpretation**:
- <2 min: Users not engaging with features
- 4-6 min: Optimal (enough time to log + explore)
- >10 min: Possible friction or confusion

---

#### 5. Meal Logging Frequency

**Definition**: Average meals logged per active user per day

**Target**: 2.5+ meals/day (breakfast, lunch, dinner)

**Measurement**:
```sql
SELECT
  COUNT(*) / COUNT(DISTINCT user_id) / 30 as avg_meals_per_day
FROM meal_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
```

---

#### 6. Feature Adoption Rates

**Targets**:

| Feature | Target Adoption | Measurement |
|---------|-----------------|-------------|
| AI Image Analysis | 40% of meals | `image_meals / total_meals` |
| NutriCoach Articles Read | 50% of users weekly | `users_read_article / wau` |
| Recipe Usage | 30% of users monthly | `users_saved_recipe / mau` |
| Goal Customization | 60% of users | `users_edited_goals / total_users` |
| Streak Feature | 50% maintain 3+ day | `users_with_streak >= 3` |

---

### Tertiary Metrics (Experience Quality)

#### 7. Net Promoter Score (NPS)

**Definition**: "How likely are you to recommend this app?" (0-10)

**Formula**: % Promoters (9-10) - % Detractors (0-6)

**Target**:
- Month 3: NPS > 30 (Good)
- Month 6: NPS > 50 (Excellent)

**Collection**: Monthly in-app survey (non-intrusive)

---

#### 8. Customer Satisfaction (CSAT)

**Definition**: "How satisfied are you with your experience?" (1-5)

**Target**: 4.2+ average (84% satisfied)

**Collection**: Post-key-action micro-surveys
- After first meal log
- After completing onboarding
- After 7-day streak
- Monthly for active users

---

#### 9. App Store Rating

**Target**: 4.5+ stars

**Monitoring**:
- iOS App Store
- Google Play Store
- Weekly review of 1-star feedback

**Action Items**:
- Respond to reviews within 48 hours
- Prioritize bug fixes from negative reviews
- Highlight positive reviews in marketing

---

### Technical Performance Metrics

#### 10. App Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Load Time (Cold Start) | <3s on 4G | RUM (Real User Monitoring) |
| Time to Interactive | <2s | Lighthouse |
| API Response Time (p95) | <500ms | Server monitoring |
| Image Upload Success | >90% | Upload logs |
| AI Analysis Accuracy | >85% | User corrections |
| Crash Rate | <0.5% sessions | Crashlytics |
| ANR Rate (Android) | <0.1% | Play Console |

---

### Business Metrics

#### 11. Growth & Acquisition

| Metric | Target | Measurement |
|--------|--------|-------------|
| New User Signups | +20% MoM | Registration events |
| Organic vs Paid | 60% organic | Attribution tracking |
| Provider Referrals | 10% of signups by M6 | Referral codes |
| Viral Coefficient (K-factor) | 0.3+ | Invites × conversion |

---

#### 12. Monetization (If Applicable)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Free → Premium Conversion | 5-10% | Subscription events |
| ARPU (Avg Revenue Per User) | $3-5/month | Revenue / total users |
| Churn Rate (Premium) | <5% monthly | Cancellations / subscribers |
| LTV:CAC Ratio | >3:1 | Lifetime value / acquisition cost |

---

### Data Collection Methods

#### Event Tracking (Firebase Analytics)

**User Journey Events**:
```javascript
// Onboarding
analytics.logEvent('onboarding_started', { user_id, ckd_stage });
analytics.logEvent('onboarding_step_completed', { step: 'profile' });
analytics.logEvent('onboarding_completed', { duration_seconds });

// Meal Logging
analytics.logEvent('meal_log_started', { method: 'manual' | 'image' });
analytics.logEvent('meal_log_completed', {
  meal_type,
  food_count,
  within_goals: boolean
});

// Feature Usage
analytics.logEvent('image_analysis_used', { confidence_score });
analytics.logEvent('article_read', { article_id, time_spent });
analytics.logEvent('recipe_saved', { recipe_id, category });
analytics.logEvent('streak_milestone', { days: 7 });

// Engagement
analytics.logEvent('daily_goal_achieved', { nutrients: ['sodium', 'protein'] });
analytics.logEvent('badge_unlocked', { badge_name });
analytics.logEvent('share_achievement', { type: 'streak' | 'badge' });
```

**User Properties**:
```javascript
analytics.setUserProperties({
  ckd_stage: '3A',
  age_group: '50-59',
  signup_date: '2025-01-15',
  user_level: 5,
  current_streak: 7,
  total_meals_logged: 124,
  preferred_language: 'ko',
  notification_enabled: true
});
```

---

#### Funnel Tracking

**Critical Funnels**:

1. **Signup → First Meal Log**
   - Signup
   - Profile Created
   - Goals Set
   - Tutorial Completed
   - First Meal Logged
   - **Target**: 60% completion rate

2. **Meal Logging Flow**
   - Start Log
   - Choose Method (manual vs image)
   - Add Food Items
   - Review Nutrition
   - Save Meal
   - **Target**: 85% completion rate

3. **Image Analysis Flow**
   - Open Camera
   - Capture Photo
   - Upload Image
   - Analysis Complete
   - Review & Save
   - **Target**: 70% completion rate

---

#### Cohort Analysis

**Cohorts to Track**:

1. **Signup Cohort** (by week/month)
   - Track retention over time
   - Compare feature adoption
   - Identify successful cohorts

2. **CKD Stage Cohort**
   - Stage 3A vs 3B vs 4
   - Different needs and behaviors
   - Personalization opportunities

3. **Feature Adoption Cohort**
   - Image users vs manual loggers
   - Power users vs casual users
   - Engaged learners (NutriCoach) vs trackers only

---

#### A/B Testing Framework

**What to Test**:

1. **Onboarding Flow**
   - **A**: Detailed (5 steps, personalized)
   - **B**: Quick (3 steps, defaults)
   - **Metric**: D7 retention, first meal log time

2. **Streak Notifications**
   - **A**: Daily reminder
   - **B**: Only milestone celebrations
   - **Metric**: Streak length, notification engagement

3. **Goal Display**
   - **A**: Circular progress rings
   - **B**: Horizontal progress bars
   - **Metric**: Goal adherence, user satisfaction

4. **Gamification Intensity**
   - **A**: Full (badges, levels, XP, streaks)
   - **B**: Minimal (streaks only)
   - **Metric**: Engagement, retention, NPS

---

### Dashboard Visualizations

**Weekly Executive Dashboard**:

```
┌───────────────────────────────────────────────────────────┐
│  Diet Care - Weekly Performance Dashboard                │
│  Week of Nov 20-26, 2025                                  │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  📊 KEY METRICS                                           │
│  ─────────────────────────────────────────────────────    │
│  WAU:            4,234 users  ↑12% vs last week          │
│  DAU/WAU:        62%          ↑3pp vs last week          │
│  Adherence:      68%          ↑5pp vs baseline           │
│  D7 Retention:   58%          ↓2pp vs last week ⚠️       │
│  NPS:            45            ↑3 pts vs last month      │
│                                                           │
│  🎯 ENGAGEMENT                                            │
│  ─────────────────────────────────────────────────────    │
│  Meals/User/Day: 2.3           Target: 2.5 ⚠️            │
│  Session Length: 4:45 min      ✓ Within target           │
│  Streak >=3d:    52%           ↑8pp vs last week         │
│  Image Usage:    38%           ↑5pp vs last week         │
│                                                           │
│  🌟 FEATURE ADOPTION                                      │
│  ─────────────────────────────────────────────────────    │
│  NutriCoach:     48% weekly    ↓4pp vs last week ⚠️      │
│  Recipes:        27% monthly   ↑2pp vs last month        │
│  Goal Custom:    64%           +3pp vs last week         │
│  Dark Mode:      31%           Stable                    │
│                                                           │
│  📈 GROWTH                                                │
│  ─────────────────────────────────────────────────────    │
│  New Signups:    234           ↑18% vs last week         │
│  Provider Ref:   12%           ↑1pp vs last week         │
│  Viral K:        0.28          Target: 0.3              │
│                                                           │
│  🚨 RED FLAGS                                             │
│  ─────────────────────────────────────────────────────    │
│  • D7 retention dropped 2pp (investigate cohort)         │
│  • NutriCoach engagement down 4pp (content refresh?)     │
│  • Meals/user below target (notification test?)          │
│                                                           │
│  ✅ ACTION ITEMS                                          │
│  ─────────────────────────────────────────────────────    │
│  1. Analyze D7 retention drop (cohort analysis)          │
│  2. Refresh NutriCoach content (trending topics)         │
│  3. A/B test notification timing for meal logging        │
│  4. Review onboarding funnel drop-off points             │
└───────────────────────────────────────────────────────────┘
```

---

## Emotional Design Deep Dive

### Emotional Journey Mapping

#### Stage 1: Discovery (Pre-Download)

**Emotional State**: Curious, Skeptical, Hopeful

**Touchpoints**:
- App Store listing
- Healthcare provider recommendation
- Word-of-mouth referral
- Online search

**Design Strategies**:
- **Build Trust**: Medical endorsements, certifications, privacy assurance
- **Clear Value Prop**: "Manage CKD diet without the stress"
- **Social Proof**: Ratings, reviews, testimonials
- **Reduce Barrier**: Free trial, no credit card required

---

#### Stage 2: First Impression (Onboarding)

**Emotional State**: Anxious, Overwhelmed, Uncertain

**Pain Points**:
- "Is this too complicated?"
- "Will I have to do this every day?"
- "What if I make a mistake?"

**Design Strategies**:

1. **Warm Welcome**
   ```
   안녕하세요, [User Name]님! 👋

   만성콩팥병 관리, 혼자가 아니에요.
   우리가 함께 할게요.
   ```
   - Use user's name (personalization)
   - Friendly emoji (approachable)
   - "We" language (partnership)

2. **Set Expectations**
   ```
   ⏱️ 5분이면 시작할 수 있어요
   📝 간단한 4단계
   ✨ 언제든 나중에 수정 가능해요
   ```
   - Time commitment (reduce anxiety)
   - Clear steps (manageable)
   - Flexibility (no pressure)

3. **Progressive Disclosure**
   - Don't show all features at once
   - Introduce gradually as user gains confidence
   - Allow "Skip for now" on optional steps

4. **Immediate Win**
   - First meal log guided
   - Instant positive feedback
   - Small celebration
   - "You did it!" moment

---

#### Stage 3: First Week (Habit Formation)

**Emotional State**: Motivated → Challenged → Discouraged (potential)

**Critical Moments**:

**Day 1**: Excitement
- **Emotion**: Energized, optimistic
- **Design**: Reinforce positive start
  ```
  🎉 첫 식사 기록 완료!
  건강한 습관의 첫 걸음이에요.
  내일도 함께 해요!
  ```

**Day 2-3**: Reality Check
- **Emotion**: Uncertain, slightly overwhelmed
- **Design**: Simplify, encourage
  ```
  어제보다 오늘 더 나아졌어요!
  나트륨 준수율: 75% (어제: 68%)

  💪 작은 진전이 큰 변화를 만들어요
  ```

**Day 4-5**: Potential Drop-off
- **Emotion**: Tired, forgetting, questioning value
- **Design**: Gentle reminder, show progress
  ```
  [Notification]
  오늘 식사 기록하셨나요?

  벌써 4일째 함께하고 있어요! 🔥
  포기하기엔 너무 아까워요 😊
  ```

**Day 7**: Milestone
- **Emotion**: Proud, accomplished
- **Design**: Celebrate meaningfully
  ```
  🎊 일주일 완주! 정말 대단해요!

  김영수님은 상위 20% 사용자입니다.
  대부분의 사람들이 3일 안에 포기해요.

  하지만 김영수님은 해냈어요! 👏

  [Share Achievement] [Continue Streak]
  ```

---

#### Stage 4: Established User (Month 2-3)

**Emotional State**: Confident, Empowered, Occasional Frustration

**Scenarios**:

**Scenario A: Going Well**
- **Emotion**: Satisfied, proud, in control
- **Design**: Validate, offer next challenge
  ```
  📊 이번 달 성과 리포트

  나트륨 준수율: 85% (↑12% vs 지난달)
  완벽한 날: 18일/30일
  연속 기록: 23일 🔥

  김영수님은 CKD 관리의 달인이에요!

  다음 도전: 칼륨 관리도 완벽하게?
  ```

**Scenario B: Struggling**
- **Emotion**: Frustrated, guilty, discouraged
- **Design**: Normalize, support, refocus
  ```
  이번 주는 좀 힘들었죠?
  괜찮아요. 누구나 그런 주가 있어요.

  다시 시작하는 건 실패가 아니에요.
  포기하지 않는 게 성공이에요.

  💡 팁: 주말에 미리 식사 준비해보는 건 어때요?

  [저염 레시피 보기] [다시 시작하기]
  ```

**Scenario C: Plateauing**
- **Emotion**: Bored, routine, losing motivation
- **Design**: Refresh, new challenge, community
  ```
  30일 동안 함께 해주셔서 고마워요!

  새로운 기능이 생겼어요:
  🍽️ AI가 추천하는 맞춤 레시피
  👥 같은 단계의 다른 환자들과 소통
  📈 실험실 결과 추적

  계속 성장해봐요!
  ```

---

### Tone & Voice Framework

#### Core Principles

1. **Human, Not Robot**
   - ❌ "User goal exceeded by 15%"
   - ✅ "오늘은 목표보다 조금 더 드셨네요"

2. **Friend, Not Authority**
   - ❌ "You must reduce sodium intake"
   - ✅ "함께 나트륨을 줄여볼까요?"

3. **Encouraging, Not Judging**
   - ❌ "Failed to meet goal"
   - ✅ "다음엔 더 잘 할 수 있어요"

4. **Simple, Not Medical Jargon**
   - ❌ "Hyperkalemia risk elevated"
   - ✅ "칼륨이 좀 높아요. 바나나는 피해주세요"

---

#### Voice Characteristics

**Warm**: Like a caring friend
- "오늘도 잘하고 계시네요!"
- "함께 할 수 있어서 기뻐요"

**Empowering**: You're in control
- "이제 혼자서도 잘 하실 수 있어요"
- "선택은 김영수님의 몫이에요"

**Patient**: No rush, no pressure
- "천천히 해도 괜찮아요"
- "언제든 다시 시작할 수 있어요"

**Knowledgeable**: Expert guidance
- "CKD 3기에는 단백질을 하루 50g으로 제한하는 게 좋아요"
- "연구에 따르면..."

**Celebratory**: Genuine happiness
- "와! 정말 대단해요! 🎉"
- "이렇게 꾸준한 분은 처음이에요!"

---

### Handling Negative Emotions

#### Scenario: User Significantly Exceeds Sodium Limit

**Emotion**: Guilt, anxiety, fear, frustration

**Bad Approach**:
```
⚠️ 위험: 나트륨 초과
오늘 나트륨 3500mg 섭취 (목표: 2000mg)
신장에 부담이 갑니다.
즉시 조치가 필요합니다.
```

**Why It's Bad**:
- Alarm language ("위험", "즉시")
- Blame framing ("부담이 갑니다")
- No actionable help
- Increases anxiety without support

**Good Approach**:
```
📊 오늘의 나트륨

오늘은 평소보다 나트륨이 많은 음식을 드셨네요.
(3500mg/2000mg)

괜찮아요! 내일부터 다시 조절해봐요.

💡 내일을 위한 팁:
• 국은 건더기만 드세요
• 김치는 물에 헹궈서 드세요
• 신선한 채소를 많이 드세요

한 끼의 실수는 큰 문제가 아니에요.
꾸준함이 더 중요해요 💪

[저염 레시피 보기] [내일 계획하기]
```

**Why It's Good**:
- Acknowledges without blaming
- Normalizes ("괜찮아요")
- Provides specific, actionable tips
- Reframes perspective (one meal doesn't define you)
- Offers resources and next steps

---

#### Scenario: User Breaks Streak

**Emotion**: Disappointment, frustration, temptation to quit

**Bad Approach**:
```
❌ 연속 기록이 끊어졌습니다
7일 연속 기록이 0으로 리셋되었습니다.
다시 시작하세요.
```

**Why It's Bad**:
- Emphasizes loss
- No acknowledgment of effort
- Cold, transactional
- Increases chance of quitting

**Good Approach**:
```
💬 어제 기록을 못 하셨네요

일주일 동안 정말 열심히 하셨어요!
한 번 빠뜨린 건 전혀 문제없어요.

중요한 건 다시 시작하는 거예요.
오늘부터 새로운 연속 기록을 만들어봐요!

📌 잊지 않도록 도와드릴까요?
[알림 설정하기] [오늘 기록 시작]

💪 7일 기록의 노력은 사라지지 않아요.
계속 함께 해요!
```

**Why It's Good**:
- Acknowledges past success
- Normalizes slip-up
- Encourages restart (not "reset")
- Offers solution (notifications)
- Maintains relationship ("함께")

---

### Designing for Hope

#### Principle: Always Leave an Exit Path

Every potentially negative interaction should include:

1. **Acknowledgment**: "I see what happened"
2. **Normalize**: "This is common/okay"
3. **Educate**: "Here's why it matters"
4. **Empower**: "Here's what you can do"
5. **Support**: "I'm here to help"

---

#### Example: First-Time User Makes Poor Food Choice

**User Action**: Logs meal with 2500mg sodium (way over 2000mg limit)

**Emotional State**: Probably doesn't know this is bad yet

**System Response**:
```
🧂 나트륨에 대해 알아볼까요?

방금 기록하신 음식에 나트륨이 많이 들어있어요.
(2500mg - 오늘 목표의 125%)

걱정하지 마세요! 이제 알았으니 다음부터 조절하면 돼요.

📚 나트륨이 뭔가요?
소금의 주성분이에요. 만성콩팥병 환자는
하루 2000mg 이하로 드시는 게 좋아요.

나트륨이 많으면:
• 혈압이 올라가요
• 신장에 부담이 돼요
• 부종이 생길 수 있어요

💡 다음부터 이렇게 해보세요:
✓ 국물보다 건더기를 드세요
✓ 양념은 나중에 추가하세요
✓ 신선한 재료로 요리하세요

[저염 조리법 배우기] [비슷한 음식 찾기]
```

---

## Conclusion

This enhanced UX storyline supplement provides detailed specifications for:

1. **Expanded Personas**: Three distinct user types (patient, caregiver, healthcare professional) with different needs and behaviors
2. **Feature Prioritization**: Data-driven RICE framework with 27 features ranked and phased
3. **Micro-interactions**: 7 detailed interaction specifications with timing, animations, and code
4. **Success Metrics**: 12 key metrics with targets, measurement methods, and dashboards
5. **Emotional Design**: Deep analysis of user emotions throughout journey with specific tone guidelines

These additions complement the existing DIET_CARE_UX_STORYLINE.md to create a complete, implementation-ready UX specification for the Diet Care system.

---

**Document Version**: 1.0 (Enhanced)
**Created**: November 27, 2025
**Related Documents**:
- DIET_CARE_UX_STORYLINE.md (Main storyline)
- DIET_CARE_DESIGN_SYSTEM.md (Visual specifications)
- DIET_CARE_IMPLEMENTATION.md (Technical implementation)

**Next Steps**:
1. Merge with main storyline or use as supplementary reference
2. Share with product team for roadmap alignment
3. Use prioritization matrix for sprint planning
4. Implement micro-interactions in design system
5. Set up analytics tracking for all KPIs
