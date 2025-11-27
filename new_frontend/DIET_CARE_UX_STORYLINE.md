# Diet Care Feature: Comprehensive UX Storyline

**Version**: 1.0
**Last Updated**: November 27, 2025
**Target Platform**: Web (Mobile-First), Progressive Web App
**Primary Users**: CKD Patients, Caregivers, Healthcare Professionals

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [User Personas](#user-personas)
3. [User Journey Maps](#user-journey-maps)
4. [Feature Flow Storyline](#feature-flow-storyline)
5. [User Stories](#user-stories)
6. [Interaction Design Principles](#interaction-design-principles)
7. [Gamification Elements](#gamification-elements)
8. [Micro-interactions & Feedback](#micro-interactions--feedback)
9. [Accessibility & Inclusive Design](#accessibility--inclusive-design)
10. [Information Architecture](#information-architecture)
11. [Pain Points & Solutions](#pain-points--solutions)
12. [Success Metrics](#success-metrics)

---

## Executive Summary

The Diet Care feature is a comprehensive nutrition management system designed specifically for Chronic Kidney Disease (CKD) patients. It combines AI-powered food analysis, personalized diet tracking, and educational content to help patients manage their complex dietary restrictions while maintaining quality of life.

**Core Value Proposition**:
- Transform complex CKD dietary restrictions into simple, actionable guidance
- Reduce cognitive burden of tracking multiple nutrients (sodium, protein, potassium, phosphorus)
- Empower patients with real-time feedback and evidence-based recommendations
- Build sustainable dietary habits through gamification and positive reinforcement

---

## User Personas

### Persona 1: Sarah Chen - The Overwhelmed Patient

**Demographics**:
- Age: 58
- CKD Stage: 3b
- Tech Savviness: Moderate
- Location: Urban, Seoul
- Employment: Part-time office worker

**Background**:
Sarah was diagnosed with CKD Stage 3b six months ago. She struggles to understand and implement the complex dietary restrictions her doctor prescribed. She feels overwhelmed by having to track sodium, protein, potassium, and phosphorus simultaneously while grocery shopping and cooking.

**Goals**:
1. Understand which foods are safe to eat without consulting nutrition tables
2. Reduce anxiety around meal preparation
3. Feel confident that she's following her diet plan correctly
4. Maintain social eating occasions without guilt or confusion

**Pain Points**:
- Forgets which nutrients she needs to limit
- Finds nutrition labels confusing and time-consuming
- Feels isolated from family meals due to dietary restrictions
- Worries constantly about making dietary mistakes
- Struggles to visualize portion sizes

**Behavioral Patterns**:
- Checks phone frequently throughout the day
- Prefers visual information over text
- Needs reassurance and positive feedback
- Tends to avoid features she doesn't immediately understand

**User Scenario**:
Sarah is at a family dinner and unsure if the grilled fish with vegetables is appropriate for her diet. She discretely takes a photo with her phone, uploads it to the Diet Care app, and receives instant analysis showing the meal is within her limits but recommends removing half the vegetables to reduce potassium. She feels relieved and enjoys dinner confidently.

**Technology Context**:
- Primary Device: iPhone 13
- Usage Time: Morning (7-9 AM), Lunch (12-1 PM), Dinner (6-8 PM)
- Network: Mostly WiFi, occasional 4G
- Preferred Language: Korean with some English

---

### Persona 2: Michael Rodriguez - The Proactive Caregiver

**Demographics**:
- Age: 42
- Role: Primary caregiver for father with CKD Stage 4
- Tech Savviness: High
- Location: Suburban, Los Angeles
- Employment: Software engineer

**Background**:
Michael takes care of his 72-year-old father who has CKD Stage 4 and limited English proficiency. He wants to ensure his father follows the renal diet strictly but struggles to track everything manually. He's tech-savvy and wants data-driven insights to optimize his father's nutrition.

**Goals**:
1. Monitor father's daily nutrient intake accurately
2. Identify dietary patterns and trends over time
3. Generate reports for doctor appointments
4. Plan meals in advance that meet all restrictions
5. Educate himself on CKD dietary science

**Pain Points**:
- Father forgets to report what he ate
- Difficult to calculate cumulative daily nutrients manually
- Needs to prove to doctors that diet is being followed
- Wants early warning if limits are being approached
- Limited time to prepare specialized meals

**Behavioral Patterns**:
- Checks data analytics and progress reports
- Likes setting goals and tracking achievement
- Appreciates automation and time-saving features
- Researches medical information thoroughly
- Shares progress with family members

**User Scenario**:
Michael logs all of his father's meals for the day by evening. The app shows that sodium intake is at 85% of the daily limit with dinner still remaining. He adjusts the dinner plan by switching from canned soup to homemade low-sodium option. At the end of the week, he reviews the weekly report showing 92% adherence to the diet plan and shares it with the nephrologist during the appointment.

**Technology Context**:
- Primary Device: iPad Pro + iPhone 14
- Usage Time: Evening (6-10 PM), Weekly review (Sunday mornings)
- Network: High-speed WiFi
- Preferred Language: English
- Uses multiple health apps simultaneously

---

### Persona 3: Dr. Jennifer Park - The Clinical Nutritionist

**Demographics**:
- Age: 35
- Role: Renal dietitian at nephrology clinic
- Tech Savviness: High
- Location: Medical center, Chicago
- Specialty: CKD nutrition counseling

**Background**:
Dr. Park counsels 40-50 CKD patients weekly and struggles with patient non-adherence to dietary recommendations. She needs a tool that helps patients self-monitor between appointments and provides her with reliable data on actual dietary intake rather than patient recall.

**Goals**:
1. Improve patient adherence to renal diet guidelines
2. Receive accurate dietary intake data from patients
3. Identify non-compliant patients early for intervention
4. Reduce time spent on basic dietary education
5. Track long-term outcomes of dietary interventions

**Pain Points**:
- Patients forget or misreport their food intake
- Limited time during appointments for detailed dietary review
- Difficult to identify specific problem areas in patient's diet
- Patients don't understand the "why" behind restrictions
- No way to monitor patients between appointments

**Behavioral Patterns**:
- Reviews patient data before appointments
- Provides evidence-based recommendations
- Values clinical accuracy over user engagement
- Needs exportable reports for medical records
- Appreciates integration with EMR systems

**User Scenario**:
Before her afternoon appointments, Dr. Park reviews three patients' Diet Care logs. She notices one patient consistently exceeds potassium limits on weekends. During the appointment, she uses the app's data to have a specific conversation about weekend eating patterns, discovering the patient eats out frequently. Together, they develop strategies for restaurant eating and set up alerts when potassium reaches 75% of daily limit.

**Technology Context**:
- Primary Device: Desktop computer + tablet for patient consultations
- Usage Time: Throughout clinic hours (8 AM - 5 PM)
- Network: Secure hospital WiFi
- Preferred Language: English
- Requires HIPAA compliance

---

## User Journey Maps

### Journey 1: Sarah's First Week with Diet Care

#### Phase 1: Awareness (Day 0)
**Touchpoint**: Doctor recommends Diet Care app after diagnosis
- **Emotion**: Anxious, overwhelmed
- **Thoughts**: "Another thing I have to learn..."
- **Pain Point**: Too many new things to manage post-diagnosis
- **Opportunity**: Doctor's endorsement provides credibility

#### Phase 2: Onboarding (Day 1, Morning)
**Touchpoint**: Downloads app, creates account
- **Emotion**: Cautiously hopeful
- **Thoughts**: "Is this going to be complicated?"
- **Actions**:
  - Downloads app from App Store
  - Creates account with email
  - Sees onboarding screens explaining features
- **Pain Point**: Concerned about learning curve
- **Opportunity**: Clear, simple onboarding builds confidence

#### Phase 3: Profile Setup (Day 1, Morning)
**Touchpoint**: Enters health profile and CKD stage
- **Emotion**: Slightly anxious about accuracy
- **Thoughts**: "I hope I'm entering this correctly..."
- **Actions**:
  - Selects CKD Stage 3b
  - Enters age, weight, height
  - System auto-calculates recommended nutrient limits
- **Pain Point**: Medical terminology feels intimidating
- **Opportunity**: Auto-calculations remove guesswork
- **Design Solution**: Plain language explanations, visual progress indicators

#### Phase 4: First Goal Setting (Day 1, Afternoon)
**Touchpoint**: Reviews and customizes daily nutrient goals
- **Emotion**: Curious but uncertain
- **Thoughts**: "These numbers seem so specific..."
- **Actions**:
  - Reviews pre-filled goals based on CKD stage
  - Adjusts sodium limit per doctor's advice
  - Saves personalized goals
- **Pain Point**: Unsure if goals are appropriate
- **Opportunity**: Pre-filled recommendations reduce decision paralysis
- **Design Solution**: "Recommended for Stage 3b" labels, tooltips explaining each nutrient

#### Phase 5: First Meal Log (Day 1, Dinner)
**Touchpoint**: Takes photo of dinner plate
- **Emotion**: Excited to try AI analysis
- **Thoughts**: "Let's see if this actually works..."
- **Actions**:
  - Opens camera feature
  - Takes photo of grilled chicken and steamed vegetables
  - Waits for AI analysis (15 seconds)
  - Reviews nutrition breakdown
- **Pain Point**: 15-second wait feels long
- **Opportunity**: First "wow" moment with AI accuracy
- **Design Solution**: Engaging loading animation, "Analyzing your meal..." progress messages

#### Phase 6: Receiving First Feedback (Day 1, Dinner)
**Touchpoint**: Sees analysis results and warnings
- **Emotion**: Relief mixed with concern
- **Thoughts**: "Oh no, the vegetables are too high in potassium!"
- **Actions**:
  - Reads AI recommendation to reduce portion by half
  - Sees visual indicator: potassium at 45% of daily limit
  - Receives suggestion for low-potassium alternative vegetables
- **Pain Point**: Feels restricted, slightly disappointed
- **Opportunity**: Constructive feedback, not just warnings
- **Design Solution**: Green checkmarks for safe nutrients, amber warnings with solutions

#### Phase 7: Adjustment & Learning (Days 2-3)
**Touchpoint**: Uses app before meals to prevent mistakes
- **Emotion**: Growing confidence
- **Thoughts**: "I'm starting to remember which foods are safe!"
- **Actions**:
  - Analyzes breakfast options before cooking
  - Checks lunch meal at work cafeteria
  - Logs all three main meals daily
- **Pain Point**: Sometimes forgets to log snacks
- **Opportunity**: Building habit and learning patterns
- **Design Solution**: Smart reminders based on typical meal times

#### Phase 8: First Achievement (Day 7)
**Touchpoint**: Completes 7-day streak, unlocks badge
- **Emotion**: Proud, motivated
- **Thoughts**: "I actually did it! I can do this!"
- **Actions**:
  - Receives "7 Day Streak" notification with celebration animation
  - Sees weekly summary: 92% adherence to goals
  - Shares achievement with family
- **Pain Point**: None - pure positive reinforcement
- **Opportunity**: Intrinsic motivation established
- **Design Solution**: Celebratory animations, shareable achievements, weekly insights

#### Phase 9: Retention (Weeks 2-4)
**Touchpoint**: Daily usage becomes routine
- **Emotion**: Calm, empowered
- **Thoughts**: "This is just part of my day now."
- **Actions**:
  - Checks daily progress dashboard each morning
  - Logs meals efficiently (< 2 minutes per meal)
  - Refers to diet information cards when grocery shopping
  - Adjusts meals proactively based on nutrient budgets
- **Opportunity**: Habit formation, lifestyle integration
- **Design Solution**: Quick-log features, meal templates, grocery list integration

---

### Journey 2: Michael's Care Coordination Experience

#### Phase 1: Discovery (Week 0)
**Touchpoint**: Researching CKD diet management tools
- **Emotion**: Determined, analytical
- **Thoughts**: "I need something evidence-based and data-driven."
- **Actions**:
  - Googles "best CKD diet tracking app"
  - Reads reviews and medical journal citations
  - Compares features across 5 different apps
- **Pain Point**: Most apps lack clinical accuracy
- **Opportunity**: Medical credibility and data transparency win trust

#### Phase 2: Setup for Father (Week 1)
**Touchpoint**: Creates profile for father as primary user
- **Emotion**: Responsible, cautious
- **Thoughts**: "I need to set this up perfectly for Dad."
- **Actions**:
  - Creates account with father's information
  - Enables Korean language (father's preference)
  - Sets up caregiver access permissions
  - Enters father's CKD Stage 4 parameters
  - Inputs all prescribed medications
- **Pain Point**: Father doesn't use smartphones independently
- **Opportunity**: Caregiver mode allows proxy management
- **Design Solution**: Multi-user support, language switching, caregiver dashboard

#### Phase 3: Meal Planning (Weekly)
**Touchpoint**: Plans father's meals for the week
- **Emotion**: Focused, strategic
- **Thoughts**: "If I plan ahead, I can batch cook and save time."
- **Actions**:
  - Reviews father's previous week's nutrient patterns
  - Identifies that weekends have higher sodium (eating out)
  - Plans 5 low-sodium dinner recipes
  - Uses app to pre-calculate each meal's nutrients
  - Creates grocery list from planned meals
- **Pain Point**: Time-consuming to calculate each recipe
- **Opportunity**: Meal planning tools reduce weekly prep time
- **Design Solution**: Recipe builder, nutrient calculator, grocery list export

#### Phase 4: Real-Time Monitoring (Daily)
**Touchpoint**: Tracks father's intake throughout day
- **Emotion**: Vigilant, protective
- **Thoughts**: "How is Dad doing today?"
- **Actions**:
  - Receives morning summary from father's device
  - Sees breakfast was logged: 18% of daily sodium used
  - Gets alert at lunch: potassium at 65% after lunch
  - Adjusts dinner plan from salmon to chicken (lower potassium)
- **Pain Point**: Alert fatigue if too many notifications
- **Opportunity**: Proactive intervention prevents limit violations
- **Design Solution**: Smart alerts only at critical thresholds (70%, 90%, 100%)

#### Phase 5: Medical Appointment Preparation (Quarterly)
**Touchpoint**: Generates report for nephrologist
- **Emotion**: Confident, prepared
- **Thoughts**: "I have hard data to show the doctor."
- **Actions**:
  - Opens "Reports" section
  - Selects "3-Month Summary Report"
  - Reviews analytics: 88% adherence, trends graphs
  - Exports PDF with daily averages and outlier days
  - Emails report to doctor's office before appointment
- **Pain Point**: Doctor may not review emailed report
- **Opportunity**: Professional medical reports add credibility
- **Design Solution**: Printable/PDF reports, charts, medical terminology

#### Phase 6: Problem-Solving (Ongoing)
**Touchpoint**: Identifies patterns and adjusts strategy
- **Emotion**: Analytical, problem-solving
- **Thoughts**: "Why does potassium spike every Tuesday?"
- **Actions**:
  - Filters logs by day of week
  - Discovers father goes to senior center Tuesday lunches
  - Calls center, requests low-potassium meal options
  - Adds Tuesday lunch reminder to pack home lunch
- **Opportunity**: Data reveals hidden behavioral patterns
- **Design Solution**: Advanced filtering, pattern detection, customizable alerts

---

### Journey 3: Dr. Park's Clinical Integration

#### Phase 1: Professional Evaluation (Week 0)
**Touchpoint**: Reviews Diet Care for clinic recommendation
- **Emotion**: Skeptical, evaluative
- **Thoughts**: "Is this clinically accurate? Can I trust patient data?"
- **Actions**:
  - Reviews clinical validation studies
  - Tests AI analysis accuracy with known foods
  - Compares nutrient calculations to USDA database
  - Checks privacy policy and data security
- **Pain Point**: Many consumer apps lack clinical rigor
- **Opportunity**: Clinical validation and medical advisory board build trust
- **Design Solution**: Citations to peer-reviewed research, medical professional endorsements

#### Phase 2: Patient Recommendation (Ongoing)
**Touchpoint**: Recommends app to suitable patients
- **Emotion**: Hopeful, supportive
- **Thoughts**: "This could really help my non-adherent patients."
- **Actions**:
  - Identifies patients who need better self-monitoring
  - Provides handout with download instructions
  - Demonstrates app features during appointment
  - Adds "using Diet Care app" to patient notes
- **Opportunity**: Physician endorsement drives adoption
- **Design Solution**: Professional resources, patient handouts, clinic partnership program

#### Phase 3: Patient Monitoring (Between Appointments)
**Touchpoint**: Reviews patient's diet logs before appointment
- **Emotion**: Informed, efficient
- **Thoughts**: "I can see exactly where she's struggling."
- **Actions**:
  - Opens professional dashboard
  - Reviews 3 patients' 30-day summaries
  - Identifies one patient exceeding phosphorus 4 days/week
  - Prepares targeted education materials
  - Allocates appointment time accordingly
- **Pain Point**: Needs HIPAA-compliant access
- **Opportunity**: Data-driven consultations improve outcomes
- **Design Solution**: Professional portal, patient consent flow, secure access

#### Phase 4: Targeted Intervention (Appointment)
**Touchpoint**: Uses app data during patient consultation
- **Emotion**: Collaborative, educational
- **Thoughts**: "Let's solve this together."
- **Actions**:
  - Shows patient their phosphorus trend graph
  - Identifies high-phosphorus foods (dairy, nuts)
  - Discusses patient's challenges and preferences
  - Sets achievable goal: reduce phosphorus by 15%
  - Schedules 2-week check-in via app dashboard
- **Opportunity**: Visual data facilitates patient education
- **Design Solution**: Shared screen view, annotation tools, goal-setting interface

#### Phase 5: Outcome Tracking (Long-term)
**Touchpoint**: Tracks patient cohort outcomes
- **Emotion**: Professional satisfaction
- **Thoughts**: "My patients using the app have better outcomes."
- **Actions**:
  - Reviews aggregate data for 25 app-using patients
  - Compares adherence rates vs. non-app patients
  - Presents findings at professional conference
  - Publishes case study on app effectiveness
- **Opportunity**: Clinical evidence loop drives improvement
- **Design Solution**: De-identified aggregate analytics, research export tools

---

## Feature Flow Storyline

### Complete User Journey: From Onboarding to Habit Formation

#### Act 1: Discovery & Onboarding (Minutes 0-15)

**Scene 1: Welcome & Value Proposition (0-2 min)**
```
User opens app → Splash screen with brand colors → Welcome carousel:

Screen 1: "Manage Your CKD Diet with Confidence"
- Illustration: Person smiling while eating
- Text: "Track sodium, protein, potassium & phosphorus effortlessly"

Screen 2: "AI-Powered Food Analysis"
- Illustration: Phone camera analyzing food plate
- Text: "Take a photo, get instant nutrition insights"

Screen 3: "Personalized Guidance"
- Illustration: Charts and progress indicators
- Text: "Tailored to your CKD stage and goals"

[Skip] [Next] → [Get Started]
```

**Design Principle**: Don't oversell. 3 screens maximum. Users can skip.

**Scene 2: Account Creation (2-4 min)**
```
Simple sign-up form:
- Email address
- Password (with strength indicator)
- Agree to Terms & Privacy Policy
[OR] Sign in with Google/Apple

Validation feedback:
✓ Email available
✓ Strong password
✗ Please agree to terms

[Create Account] → Email verification sent
```

**Design Principle**: Minimize friction. Social login options. Progressive disclosure.

**Scene 3: Health Profile Setup (4-10 min)**
```
Step 1 of 4: Basic Information
"Help us personalize your experience"
- Age: [slider 18-100]
- Sex: [Male] [Female] [Other]
- Weight: [input] kg
- Height: [input] cm

[Next]

Step 2 of 4: CKD Stage
"What is your Chronic Kidney Disease stage?"
[Visual guide with GFR ranges]
○ Stage 1 (GFR ≥90)
○ Stage 2 (GFR 60-89)
● Stage 3a (GFR 45-59) ← Selected
○ Stage 3b (GFR 30-44)
○ Stage 4 (GFR 15-29)
○ Stage 5 (GFR <15)

[?] Not sure? Ask your doctor or check recent lab results

[Back] [Next]

Step 3 of 4: Activity Level
○ Sedentary (little or no exercise)
○ Lightly active (exercise 1-3 days/week)
● Moderately active (exercise 3-5 days/week) ← Selected
○ Very active (exercise 6-7 days/week)

[Back] [Next]

Step 4 of 4: Dietary Preferences (Optional)
☐ Vegetarian
☐ Vegan
☐ Halal
☐ Kosher

Food Allergies:
[+ Add allergy]

[Back] [Complete Setup]
```

**Design Principle**: Progressive disclosure. Visual aids. Optional fields clearly marked.

**Scene 4: Goal Calculation & Review (10-15 min)**
```
"Your Personalized Daily Goals"
Based on CKD Stage 3a, Age 58, 65kg body weight

[Card Grid:]

┌─ Sodium ──────────┐
│ 🧂 2,000 mg       │
│ Recommended limit │
│ [Why this limit?] │ → Tooltip: "CKD Stage 3a patients should limit sodium to reduce fluid retention and blood pressure."
└───────────────────┘

┌─ Protein ─────────┐
│ 🥩 48 g           │
│ 0.8g per kg       │
│ [Why this limit?] │
└───────────────────┘

┌─ Potassium ───────┐
│ 🍌 2,000 mg       │
│ Recommended limit │
│ [Why this limit?] │
└───────────────────┘

┌─ Phosphorus ──────┐
│ 🥛 900 mg         │
│ Recommended limit │
│ [Why this limit?] │
└───────────────────┘

These goals are based on clinical guidelines for your CKD stage.
Always follow your doctor's specific recommendations.

[Adjust Goals] [Accept & Continue]
```

**Design Principle**: Transparency. Explain the "why." Allow customization.

---

#### Act 2: First Use & Learning (Day 1)

**Scene 1: Dashboard Introduction (First Login)**
```
Empty state with friendly guidance:

"Welcome, Sarah! 👋"

[Card: Today's Summary]
No meals logged yet today.
Let's get started!

[Take Photo of Meal] [Manual Entry]

[Card: Your Goals]
Daily nutrition targets: Tap to view details
→ Links to goals detail page

[Card: Learn About Your Diet]
Discover CKD-friendly eating tips
→ Links to diet information cards

[?] Need help getting started? [Take a Tour]
```

**Design Principle**: Empty states are onboarding opportunities. Clear call-to-action.

**Scene 2: First Food Photo Analysis**
```
User taps [Take Photo of Meal]

Camera interface opens:
┌──────────────────────┐
│                      │
│   📷 Camera View     │
│                      │
│   [Flash] [Flip]     │
│                      │
│                      │
│   [○ Capture]        │
│   [Gallery]          │
└──────────────────────┘

Tip: "Position food in good lighting for best results"

User takes photo → Preview screen:
┌──────────────────────┐
│   [Preview Image]    │
│                      │
│   [Retake]  [Use ✓] │
└──────────────────────┘

User taps [Use ✓]

Loading screen (15-second wait):
┌──────────────────────┐
│                      │
│   🔄 Analyzing...    │
│                      │
│   ▓▓▓▓▓▓░░░░ 60%    │
│                      │
│   "Identifying foods"│
└──────────────────────┘

Progress messages cycle:
- "Identifying foods..."
- "Calculating nutrients..."
- "Analyzing portions..."
- "Checking restrictions..."
```

**Design Principle**: Manage expectations. Engaging wait states. Show progress.

**Scene 3: Analysis Results Display**
```
Results page:

┌─ Your Meal Analysis ─────────────────┐
│                                      │
│  [Food Image Thumbnail]              │
│                                      │
│  Detected Foods:                     │
│  • Grilled chicken breast (150g)     │
│  • Steamed broccoli (100g)           │
│  • White rice (200g)                 │
│                                      │
│  [Edit portions] [Add/Remove items]  │
│                                      │
└──────────────────────────────────────┘

┌─ Nutrition Breakdown ────────────────┐
│                                      │
│  Calories: 385 kcal                  │
│  ✓ Within your daily budget          │
│                                      │
│  Sodium: 145 mg (7% of daily limit)  │
│  ✓ Great choice!                     │
│  [●●○○○○○○○○] 7%                     │
│                                      │
│  Protein: 38g (79% of daily goal)    │
│  ⚠️ Getting close to limit            │
│  [●●●●●●●●○○] 79%                    │
│                                      │
│  Potassium: 680mg (34% of limit)     │
│  ⚠️ Broccoli is high in potassium     │
│  [●●●○○○○○○○] 34%                    │
│  💡 Tip: Reduce portion by half       │
│                                      │
│  Phosphorus: 310mg (34% of limit)    │
│  ✓ Within safe range                 │
│  [●●●○○○○○○○] 34%                    │
│                                      │
└──────────────────────────────────────┘

┌─ Recommendations ────────────────────┐
│                                      │
│  💡 To reduce potassium:             │
│  • Cut broccoli portion to 50g       │
│  • Or substitute with cucumber       │
│                                      │
│  ✅ Good protein source!             │
│  • Chicken is kidney-friendly        │
│  • Watch your protein for rest of day│
│                                      │
└──────────────────────────────────────┘

[Save to Log] [Analyze Another Meal]

Meal saved!
✨ First meal logged! Keep going! ✨
```

**Design Principle**: Visual feedback. Color-coded status. Actionable recommendations.

---

#### Act 3: Daily Usage & Habit Building (Days 2-7)

**Scene 1: Morning Check-In**
```
Push notification (8:00 AM):
"Good morning, Sarah! ☀️ Ready to track today's meals?"

User opens app → Dashboard shows:

┌─ Today's Summary ────────────────────┐
│  Wednesday, Nov 27                   │
│                                      │
│  Meals logged: 0 of 3                │
│  [○○○] Breakfast Lunch Dinner        │
│                                      │
│  Yesterday's performance:            │
│  ✓ Stayed within all limits          │
│  🔥 6-day streak                     │
│                                      │
│  [Log Breakfast]                     │
└──────────────────────────────────────┘

┌─ Nutrient Budget ────────────────────┐
│  Available today:                    │
│                                      │
│  Sodium    2,000 mg  [●○○○○○○○○○] 0% │
│  Protein   48 g      [●○○○○○○○○○] 0% │
│  Potassium 2,000 mg  [●○○○○○○○○] 0% │
│  Phosph.   900 mg    [●○○○○○○○○○] 0% │
│                                      │
│  💪 Full budget available!            │
└──────────────────────────────────────┘
```

**Scene 2: Meal Logging Shortcut**
```
User notices patterns → Quick log feature:

"Common breakfast detected 🥞"
Your usual: Oatmeal + banana + milk
[Log This] [Take Photo Instead]

User taps [Log This] → Instant log without photo
Updated dashboard:

Meals logged: 1 of 3 [●○○]

Nutrient Budget:
Sodium    [●●○○○○○○○○] 15% (300mg used)
Protein   [●●●○○○○○○○] 25% (12g used)
Potassium [●●●●○○○○○○] 42% (840mg used)
Phosph.   [●●○○○○○○○○] 18% (162mg used)

⚠️ Potassium is 42% used - choose low-K foods for lunch
```

**Design Principle**: Reduce friction. Learn user patterns. Proactive guidance.

**Scene 3: Midday Alert**
```
Lunch time (12:30 PM):
No notification yet (user hasn't exceeded limits)

User logs lunch (chicken salad):
System analyzes cumulative intake...

Sodium:    [●●●●○○○○○○] 43% ✓
Protein:   [●●●●●●○○○○] 58% ✓
Potassium: [●●●●●●●○○○] 73% ⚠️
Phosph.:   [●●●●○○○○○○] 45% ✓

Alert appears:
"⚠️ Potassium Alert
You've used 73% of your daily potassium limit.

For dinner, choose low-potassium options:
• Chicken or fish (not salmon)
• White rice instead of brown
• Cucumbers instead of tomatoes

[View Low-K Foods] [Got it]"
```

**Design Principle**: Just-in-time warnings. Constructive guidance. Prevention not punishment.

**Scene 4: End of Day Review**
```
Evening (9:00 PM):
"Daily summary ready! Tap to review your day 📊"

User opens summary:

┌─ Wednesday Summary ──────────────────┐
│  All 3 meals logged! 🎉              │
│                                      │
│  Final Totals:                       │
│  Sodium    [●●●●●●●●○○] 82% ✓ Great! │
│  Protein   [●●●●●●●●●○] 94% ⚠️ Close  │
│  Potassium [●●●●●●●●●○] 89% ⚠️ Close  │
│  Phosph.   [●●●●●●●○○○] 67% ✓ Great! │
│                                      │
│  🎯 Adherence Score: 92%             │
│                                      │
│  Achievements:                       │
│  🔥 7-day logging streak!            │
│  ⭐ Stayed within sodium limit       │
│  ⭐ Logged all meals on time         │
│                                      │
│  Tomorrow's tip:                     │
│  💡 Watch protein & potassium -      │
│  you were close today               │
│                                      │
│  [Share Progress] [View Details]     │
└──────────────────────────────────────┘
```

**Design Principle**: Celebrate wins. Acknowledge effort. Forward-looking guidance.

---

#### Act 4: Long-term Engagement & Mastery (Weeks 2-12)

**Scene 1: Weekly Insights**
```
Sunday morning notification:
"Your weekly report is ready! 📈"

Weekly Report Dashboard:

┌─ Week of Nov 20-26 ──────────────────┐
│                                      │
│  📊 Overall Performance              │
│  Adherence: 88% (6 of 7 days)        │
│  Streak: 14 days 🔥                  │
│                                      │
│  [Line graph showing daily adherence]│
│  Mon Tue Wed Thu Fri Sat Sun         │
│  98% 92% 95% 88% 90% 75% 85%        │
│                     ⬇️                │
│                  Saturday low         │
│                                      │
│  💡 Insight: Saturdays are challenging│
│  Eating out? Try these tips:         │
│  • Request no salt on grilled items  │
│  • Choose steamed vegetables         │
│  • Ask for sauces on the side        │
│                                      │
│  🏆 Achievements This Week:          │
│  ✓ 7-day streak maintained           │
│  ✓ NEW: 14-day milestone! 🎉         │
│  ✓ Sodium under limit 7/7 days       │
│  ✓ Logged 21 meals                   │
│                                      │
│  [Share Report] [View Trends]        │
└──────────────────────────────────────┘
```

**Design Principle**: Pattern recognition. Contextual insights. Positive reinforcement.

**Scene 2: Milestone Celebrations**
```
User reaches 30-day streak:

Full-screen celebration animation:
🎊 🎉 ✨
"30-DAY STREAK!"
You've logged meals for 30 consecutive days!

[Confetti animation]

You've earned:
🏅 30-Day Consistency Badge
⭐ 500 bonus points
📜 Certificate of Achievement

"You're building lasting habits! Studies show 30 days of consistency leads to long-term behavior change."

[Share Achievement] [Continue]
```

**Design Principle**: Celebrate milestones. Social sharing. Evidence-based encouragement.

**Scene 3: Progressive Education**
```
After 2 weeks of use:

New feature unlock notification:
"🎓 New Learning Module Available"

"Understanding Phosphorus in Your Diet"
You've mastered sodium and potassium tracking. Ready to dive deeper into phosphorus management?

Topics:
• Why phosphorus matters for CKD
• Hidden phosphorus in processed foods
• Cooking techniques to reduce phosphorus
• Reading nutrition labels effectively

[Start Learning] [Maybe Later]

Progress tracking:
Diet Education Progress: [●●○○○] 2 of 5 modules complete
```

**Design Principle**: Progressive disclosure. Earned learning. Avoid overwhelm.

**Scene 4: Community & Support**
```
After 4 weeks:

"Join the Diet Care Community 👥"

Connect with others managing CKD diets:
• Share recipes
• Exchange tips
• Support each other
• Celebrate victories

[Join Community] [Not Now]

If joined → Community feed:

┌─ Community Feed ─────────────────────┐
│                                      │
│  💬 Maria S. shared a recipe         │
│  "Low-sodium chicken tacos!"         │
│  ⬆️ 47 👍 12 comments                 │
│                                      │
│  🎉 John K. achieved 60-day streak   │
│  ⬆️ 89 👍 24 comments                 │
│                                      │
│  ❓ Question from Lisa T.            │
│  "Best low-potassium vegetables?"    │
│  💬 15 answers                        │
│                                      │
│  [+ Share Your Story]                │
└──────────────────────────────────────┘
```

**Design Principle**: Social support. Shared experiences. Optional feature.

---

## User Stories

### Epic 1: Nutrition Tracking

#### As a CKD patient:
1. **I want to** take a photo of my meal **so that** I can quickly analyze its nutritional content without manual data entry
   - **Acceptance Criteria**:
     - Camera opens within 1 second
     - Photo uploads in < 5 seconds on 4G
     - AI analysis completes in < 20 seconds
     - Accuracy > 85% for common foods

2. **I want to** see which nutrients are within safe limits **so that** I know if I can eat this meal
   - **Acceptance Criteria**:
     - Visual indicators (green/yellow/red) for each nutrient
     - Percentage of daily limit shown
     - Clear "safe to eat" or "reduce portion" message

3. **I want to** receive warnings before exceeding daily limits **so that** I can adjust my next meal
   - **Acceptance Criteria**:
     - Alert triggers at 75% and 90% of limits
     - Notification includes specific recommendations
     - User can snooze or dismiss alerts

4. **I want to** view my progress over time **so that** I can see if I'm improving
   - **Acceptance Criteria**:
     - Weekly and monthly trend graphs
     - Adherence percentage calculated
     - Visual highlights of improvements

5. **I want to** understand why certain nutrients are restricted **so that** I'm motivated to follow the diet
   - **Acceptance Criteria**:
     - Tooltip explanations for each nutrient
     - Link to detailed educational content
     - Bilingual support (Korean/English)

### Epic 2: Goal Management

#### As a caregiver:
6. **I want to** set daily nutrition goals based on my father's CKD stage **so that** I ensure he's following medical advice
   - **Acceptance Criteria**:
     - Pre-filled recommendations by CKD stage
     - Ability to customize based on doctor's orders
     - Validation prevents unrealistic values
     - Save and update goals anytime

7. **I want to** plan meals in advance **so that** I can batch cook and save time
   - **Acceptance Criteria**:
     - Meal planning calendar view
     - Recipe builder with nutrient calculations
     - Shopping list generation
     - Copy meals to future days

8. **I want to** monitor my father's intake remotely **so that** I can intervene if needed
   - **Acceptance Criteria**:
     - Caregiver dashboard shows real-time intake
     - Push notifications for concerning patterns
     - Ability to add meals on behalf of patient
     - Access control and privacy settings

9. **I want to** generate reports for doctor appointments **so that** we can discuss diet objectively
   - **Acceptance Criteria**:
     - Export to PDF format
     - Include graphs and daily averages
     - Highlight adherence and challenges
     - Professional medical formatting

### Epic 3: Education & Guidance

#### As a healthcare professional:
10. **I want to** access patient diet logs **so that** I can provide targeted counseling
    - **Acceptance Criteria**:
      - HIPAA-compliant secure access
      - Patient consent workflow
      - Aggregate view of multiple patients
      - Annotation and comment features

11. **I want to** see patterns in non-adherence **so that** I can identify barriers
    - **Acceptance Criteria**:
      - Filter by day of week, meal type
      - Identify frequently exceeded nutrients
      - Correlate with external factors (eating out, weekends)
      - Export data for research

12. **I want to** provide personalized diet recommendations **so that** patients get customized guidance
    - **Acceptance Criteria**:
      - Professional notes visible to patient
      - Ability to adjust goals collaboratively
      - Set specific food substitutions
      - Schedule follow-up check-ins

### Epic 4: Motivation & Engagement

#### As all users:
13. **I want to** earn badges and achievements **so that** I feel motivated to continue
    - **Acceptance Criteria**:
      - Streaks tracked automatically (3, 7, 14, 30, 60, 90 days)
      - Badges for milestones and behaviors
      - Visual collection of achievements
      - Shareable on social media

14. **I want to** learn about CKD-friendly foods **so that** I can make better choices
    - **Acceptance Criteria**:
      - Disease-specific diet cards (low-sodium, low-protein, etc.)
      - Food lists (safe foods, foods to limit)
      - Cooking tips and techniques
      - Recipe database with filters

15. **I want to** connect with other CKD patients **so that** I don't feel alone
    - **Acceptance Criteria**:
      - Optional community feature
      - Moderated safe space
      - Share recipes and tips
      - Privacy-protected profiles

---

## Interaction Design Principles

### 1. Clarity Over Complexity

**Principle**: Every interface element must have a clear, singular purpose. Eliminate cognitive overhead.

**Applications**:
- **Button Labels**: Use action verbs ("Analyze Meal" not "Submit")
- **Icons**: Always pair with text labels on primary actions
- **Hierarchy**: One primary action per screen (prominent color/size)
- **Progressive Disclosure**: Show advanced features only when needed

**Example**:
```
❌ Poor: [Submit] [Cancel] [Save Draft] [Preview] [Reset]
✅ Good: [Analyze Meal] with secondary [Cancel] in top corner
```

### 2. Immediate Feedback

**Principle**: Every user action must receive immediate visual, auditory, or haptic feedback within 100ms.

**Applications**:
- **Button Press**: Visual depression, color change, haptic feedback
- **Form Input**: Real-time validation with inline messages
- **Loading States**: Progress indicators, skeleton screens, animations
- **Success/Error**: Toast notifications, inline alerts, celebratory animations

**Feedback Hierarchy**:
1. **Micro-feedback** (< 100ms): Button press, tap, swipe
2. **Short operations** (< 1s): Form validation, local saves
3. **Medium operations** (1-5s): Image upload, calculations
4. **Long operations** (> 5s): AI analysis, report generation

**Example**:
```
User taps [Save Goals]
→ Button animates (pressed state) < 100ms
→ Loading spinner appears < 200ms
→ API call executes (2 seconds)
→ Success toast appears "Goals saved!" < 100ms after API response
→ Button returns to normal state
```

### 3. Error Prevention Over Error Handling

**Principle**: Design systems that make errors impossible or unlikely before they occur.

**Prevention Strategies**:

**Input Validation**:
```jsx
// Sodium input field
<input
  type="number"
  min="500"      // Prevent dangerously low values
  max="5000"     // Prevent unrealistic high values
  step="100"     // Guide to reasonable increments
  placeholder="2000 mg"
  pattern="[0-9]+"
/>
// Real-time warning: "This is higher than recommended for Stage 3b"
```

**Confirmation Dialogs**:
```
User tries to delete 30 days of meal logs:

"Delete All Meal Logs?"
This will permanently delete 30 days of meal history (92 meals).
This action cannot be undone.

[Cancel] [Delete Anyway]
          ↑ Red, secondary position
```

**Graceful Degradation**:
- Offline mode: Save to local storage, sync when online
- Image analysis fails: Offer manual entry
- Poor photo quality: "We couldn't analyze this image. Try better lighting or manual entry."

### 4. Recognition Over Recall

**Principle**: Show users options rather than requiring them to remember information.

**Applications**:

**Visual Cues**:
- Show recent meals: "Log your usual breakfast?" with thumbnail
- Display food categories with icons
- Use color-coding consistently (sodium=blue, protein=green, etc.)

**Autocomplete**:
```
User types "chi..."
Dropdown appears:
• Chicken breast (grilled)     ← Recently used
• Chicken thigh (baked)
• Chicken soup (homemade)
• Chickpeas (canned)
```

**Templates**:
- "Monday breakfast" template
- "Restaurant meal" template with common items
- "Low-sodium dinner" favorites

### 5. Flexibility & Efficiency

**Principle**: Support both novice and expert users with progressive complexity.

**Novice Path**:
```
Home → [Take Photo] → AI Analysis → Save
(4 taps, zero knowledge required)
```

**Expert Path**:
```
Home → [Quick Log] → Select from recents → Done
(2 taps, leverage learned patterns)
```

**Shortcuts**:
- Swipe right on dashboard: Opens camera
- Long-press meal: Quick edit/delete
- Double-tap nutrient: See detailed breakdown
- Voice command: "Log breakfast" (future feature)

### 6. Emotional Design

**Principle**: Design interfaces that acknowledge user's emotional state and respond appropriately.

**Emotional States**:

**Anxious (new users)**:
- Reassuring language: "You're doing great!"
- Gentle guidance: "Let's take this step by step"
- Reduce choices: Show 1-2 options max initially

**Frustrated (errors, limits exceeded)**:
- Empathetic messaging: "We know this is challenging"
- Solution-focused: "Here's what you can do..."
- Avoid blame: "This meal is high in potassium" not "You chose a bad meal"

**Proud (achievements)**:
- Celebrate loudly: Animations, badges, fanfare
- Social sharing: "Share your 30-day streak!"
- Tangible rewards: Unlock new features, content

**Overwhelmed (complex data)**:
- Simplify view: "Show me just sodium today"
- Hide details: Collapsible sections
- Guide: "Focus on one nutrient this week"

### 7. Accessibility & Inclusive Design

**Principle**: Design for the widest possible range of abilities and contexts.

**Visual Accessibility**:
- **Color Contrast**: WCAG AAA standard (7:1 for text)
- **Color Independence**: Never rely solely on color (use icons + text)
- **Font Size**: Minimum 16px body text, scalable to 200%
- **Touch Targets**: Minimum 44x44px (Apple) / 48x48dp (Android)

**Motor Accessibility**:
- **Large tap areas**: Generous padding around buttons
- **Forgiving interactions**: 300ms delay before accidental actions
- **Alternative inputs**: Voice, keyboard navigation
- **Reduce required precision**: Swipe zones, not exact coordinates

**Cognitive Accessibility**:
- **Simple language**: 6th-grade reading level for instructions
- **Consistent patterns**: Same action = same location/icon
- **Undo capability**: All destructive actions reversible
- **Progress saving**: Auto-save, never lose work

**Screen Reader Support**:
```jsx
// Proper ARIA labels
<button
  aria-label="Analyze meal photo for nutrition content"
  aria-describedby="analyze-help-text"
>
  <CameraIcon aria-hidden="true" />
  Analyze
</button>

<div id="analyze-help-text" className="sr-only">
  Take or upload a photo of your meal. AI will identify foods and calculate sodium, protein, potassium, and phosphorus.
</div>
```

### 8. Mobile-First, Context-Aware Design

**Principle**: Design for on-the-go use in real-world contexts.

**Context Scenarios**:

**Restaurant (limited time, social pressure)**:
- Quick camera access: Home screen widget
- Fast analysis: < 15 second result
- Discreet notifications: Vibration only option
- Simple verdict: "Safe" or "Reduce portion"

**Grocery Store (comparison shopping)**:
- Barcode scanner for packaged foods
- "Better alternative" suggestions
- Shopping list integration
- Offline mode (no signal in store)

**Doctor's Office (professional setting)**:
- Professional report view
- Print-friendly format
- Medical terminology toggle
- Easy screen sharing

**Home Cooking (hands-free needed)**:
- Voice commands (future)
- Large, glanceable text
- Step-by-step recipe mode
- Timer integration

---

## Gamification Elements

### 1. Streak System

**Mechanism**: Track consecutive days of complete meal logging

**Tiers**:
- 🔥 **3-Day Streak**: "Getting Started" badge
- 🔥🔥 **7-Day Streak**: "Week Warrior" badge + encouraging notification
- 🔥🔥🔥 **14-Day Streak**: "Two-Week Champion" badge + bonus content unlock
- 💎 **30-Day Streak**: "Monthly Master" badge + shareable certificate
- 👑 **60-Day Streak**: "Consistency King/Queen" badge + special feature access
- 🏆 **90-Day Streak**: "Lifestyle Legend" badge + community recognition

**Visualization**:
```
Calendar heatmap view (GitHub-style):
Mon [●] [●] [●] [ ] [●] [●]
Tue [●] [●] [●] [●] [●] [●]
Wed [●] [●] [ ] [●] [●] [●]
    Week 1  Week 2  Week 3

Streak broken on Wed Week 2 (empty circle)
Current streak: 12 days
Longest streak: 21 days
```

**Streak Recovery**:
- Miss 1 day: "Streak saver" available (1 free pass per month)
- Miss 2+ days: Streak resets but longest streak preserved
- Compassionate messaging: "Life happens! Start a new streak today 💪"

### 2. Achievement Badges

**Categories**:

**Consistency Achievements**:
- ✅ "Early Bird": Log breakfast before 9 AM (3 times)
- ✅ "Night Owl": Log dinner before 8 PM (5 times)
- ✅ "Perfect Day": Log all 3 meals within limits (first time)
- ✅ "Perfect Week": 7 days of adherence > 90%

**Learning Achievements**:
- 📚 "Diet Scholar": Complete all educational modules
- 🎓 "Sodium Expert": Stay under sodium limit for 14 days
- 🎓 "Protein Pro": Stay under protein limit for 14 days
- 🎓 "Balanced Life": All 4 nutrients within limits for 30 days

**Social Achievements**:
- 👥 "Community Member": Join community and introduce yourself
- 💬 "Helpful Human": Answer 5 community questions
- 🍳 "Recipe Creator": Share 3 kidney-friendly recipes
- ❤️ "Supporter": Give 50 encouraging comments

**Milestone Achievements**:
- 📸 "First Photo": Analyze first meal with AI
- 📊 "Data Devotee": View weekly report 4 weeks in a row
- 🎯 "Goal Getter": Update diet goals after doctor appointment
- 📅 "Planner": Use meal planning feature 3 times

### 3. Point System

**Earning Points**:
| Action | Points | Daily Cap |
|--------|--------|-----------|
| Log breakfast | 10 | 10 |
| Log lunch | 10 | 10 |
| Log dinner | 10 | 10 |
| Stay within sodium limit | 20 | 20 |
| Stay within protein limit | 20 | 20 |
| Stay within potassium limit | 20 | 20 |
| Stay within phosphorus limit | 20 | 20 |
| Complete educational module | 50 | No cap |
| Share recipe with community | 30 | 60 |
| Help another user | 15 | 45 |
| 7-day streak milestone | 100 | N/A |

**Point Tiers**:
- **Level 1** (0-500 pts): Beginner
- **Level 2** (501-1,500 pts): Learner - Unlock meal planner
- **Level 3** (1,501-3,000 pts): Practitioner - Unlock recipe builder
- **Level 4** (3,001-5,000 pts): Expert - Unlock advanced analytics
- **Level 5** (5,001-10,000 pts): Master - Unlock all features + community moderator privileges
- **Level 6** (10,001+ pts): Legend - Featured user, exclusive content

### 4. Progress Challenges

**Weekly Challenges**:
Rotates every Monday, user chooses 1 of 3:

**Challenge 1: "Sodium Savvy Week"**
- Stay under sodium limit all 7 days
- Reward: 200 bonus points + "Salt Slayer" badge
- Progress: 4/7 days complete

**Challenge 2: "Vegetable Victory"**
- Include vegetables in 15 meals this week
- Reward: Unlock veggie recipe collection
- Progress: 9/15 meals complete

**Challenge 3: "Early Logger"**
- Log all meals within 1 hour of eating
- Reward: 150 points + "Timely Tracker" badge
- Progress: 12/21 meals complete

### 5. Visual Progress Indicators

**Daily Ring**:
Circular progress ring (like Apple Watch):
```
     Sodium
    /  82%  \
   ●●●●●●●●○○

Color coding:
● Green (0-70%): On track
● Amber (71-90%): Caution
● Red (91-100%+): Limit approached/exceeded
```

**Weekly Trend**:
Line graph showing daily adherence percentage:
```
100% ┤     ●   ●
 90% ┤   ●   ●   ●
 80% ┤ ●           ●
 70% ┤
     └─────────────
     Mon   →   Sun
```

---

## Micro-interactions & Feedback

### 1. Loading States

**Image Upload (5-second operation)**:
```
Animation sequence:
1. User taps [Use Photo]
2. Image shrinks and moves to top of screen (300ms)
3. Progress ring appears around image (fade in 200ms)
4. Progress animates 0% → 100% (5 seconds)
5. Checkmark appears (scale in, 200ms)
6. Transition to results (slide up, 400ms)

Visual:
┌──────────────────┐
│  [○ Image ○]     │ ← Pulsing ring
│                  │
│  Uploading...    │ ← Animated dots: . .. ...
│  ▓▓▓▓▓░░░░░ 54% │ ← Fills left to right
└──────────────────┘
```

**AI Analysis (15-second operation)**:
```
Progressive messages to maintain engagement:
Seconds 0-5:   "Identifying foods..."
Seconds 6-10:  "Calculating nutrients..."
Seconds 11-15: "Checking your goals..."

Animation: 3D food items spinning into focus
Sound: Subtle "ping" when each food identified (opt-out option)
Haptic: Light pulse at 50% and 100% (iOS only)
```

### 2. Success Feedback

**Meal Logged Successfully**:
```
Sequence:
1. [Save] button pressed → Scales down 95% (100ms)
2. Button animates to checkmark (300ms morphing animation)
3. Confetti bursts from button (500ms particle effect)
4. Toast slides up from bottom (200ms ease-out)
5. Success sound plays (optional, 300ms chime)
6. Haptic "success" vibration (iOS/Android)

Toast notification:
┌──────────────────────────┐
│ ✅ Meal logged!          │
│ Breakfast added to log   │
│ [View] [Dismiss]         │
└──────────────────────────┘
Auto-dismisses after 3 seconds
```

**Achievement Unlocked**:
```
Full-screen takeover (can skip):
┌──────────────────────────┐
│                          │
│   [Badge animates in]    │ ← Scales from 50% to 120% to 100%
│       🏅                 │    Rotates 360° while scaling
│                          │
│   Achievement Unlocked!   │ ← Fades in after badge
│   7-Day Streak           │
│                          │
│   [Share] [Continue]     │
└──────────────────────────┘

Background: Subtle radial gradient pulse
Confetti: Falls from top (2-second animation)
Sound: Triumphant "ding!" (opt-out option)
```

### 3. Error States

**Upload Failed**:
```
Toast notification (red theme):
┌──────────────────────────┐
│ ❌ Upload failed          │
│ Check your connection    │
│ [Retry] [Dismiss]        │
└──────────────────────────┘

Button state:
[Upload Photo] → [Upload Failed - Tap to Retry]
                  ↑ Red background, shake animation
```

**Form Validation**:
```
Real-time inline validation:

Sodium Goal: [1500] mg
✓ Within recommended range (1,500-2,300mg)

Protein Goal: [120] mg
⚠️ This seems high for Stage 3b (recommended: 40-55g)
   Are you sure? [Yes] [Use Recommended]

Potassium Goal: [abc] mg
❌ Please enter a valid number

Visual indicators:
✓ Green border + checkmark (valid)
⚠️ Amber border + warning icon (questionable but allowed)
❌ Red border + X icon (invalid, cannot submit)
```

---

## Accessibility & Inclusive Design

### 1. Visual Accessibility

**Color Contrast Standards**:
- WCAG AAA Compliance (7:1 ratio for text)
- Never rely solely on color (use icons + text)
- Minimum 16px body text, scalable to 200%
- Minimum touch targets: 44x44px (Apple) / 48x48dp (Android)

**Screen Reader Support**:
```html
<!-- Proper ARIA labels -->
<button
  aria-label="Analyze meal photo for nutrition content"
  aria-describedby="analyze-help-text"
>
  <CameraIcon aria-hidden="true" />
  Analyze
</button>

<div id="analyze-help-text" className="sr-only">
  Take or upload a photo of your meal. AI will identify foods and calculate sodium, protein, potassium, and phosphorus.
</div>
```

### 2. Motor Accessibility

- Large tap areas with generous padding
- Forgiving interactions (300ms delay before accidental actions)
- Alternative inputs (voice, keyboard navigation)
- Swipe zones, not exact coordinates

### 3. Cognitive Accessibility

- Simple language (6th-grade reading level)
- Consistent patterns (same action = same location/icon)
- Undo capability for all destructive actions
- Auto-save, never lose work

### 4. Internationalization

**Language Support**: Korean (primary), English (secondary), Future: Spanish, Chinese, Japanese

**Locale-Specific Formatting**:
- Dates: en-US (11/27/2025) vs ko-KR (2025년 11월 27일)
- Numbers: en-US (1,234.56) vs ko-KR (1,234.56)
- Units: en-US (2,000 mg) vs ko-KR (2,000mg)

---

## Information Architecture

### Site Map

```
Home (/)
│
├─ Nutri Coach (/nutri-coach)
│  ├─ Diet Information Cards
│  │  ├─ Low Sodium Diet
│  │  ├─ Low Protein Diet
│  │  ├─ Low Potassium Diet
│  │  └─ Low Phosphorus Diet
│  │
│  └─ Food Image Analyzer
│     ├─ Upload Photo
│     ├─ AI Analysis
│     └─ Results & Recommendations
│
├─ Diet Log (/diet-log)
│  ├─ Goal Setting
│  │  ├─ CKD Stage Selection
│  │  ├─ Nutrient Target Inputs
│  │  └─ Save/Update Goals
│  │
│  ├─ Meal Logging
│  │  ├─ Breakfast
│  │  ├─ Lunch
│  │  ├─ Dinner
│  │  └─ Snacks
│  │
│  └─ Daily Summary
│     ├─ Nutrient Progress Rings
│     ├─ Meal Completion Status
│     └─ Alerts & Recommendations
│
├─ My Progress (/progress)
│  ├─ Dashboard
│  │  ├─ Streak Counter
│  │  ├─ Weekly Trends
│  │  └─ Achievements
│  │
│  ├─ History (/progress/history)
│  │  ├─ Calendar View
│  │  ├─ Meal Logs (filterable)
│  │  └─ Nutrient Trends
│  │
│  └─ Reports (/progress/reports)
│     ├─ Weekly Summary
│     ├─ Monthly Summary
│     └─ Export to PDF
│
└─ Profile (/profile)
   ├─ Health Profile
   ├─ Settings
   │  ├─ Notifications
   │  ├─ Language
   │  ├─ Accessibility
   │  └─ Privacy
   │
   └─ Caregiver Access (if enabled)
```

### Navigation Structure

**Mobile** (Bottom Tab Bar):
```
[🏠 Home] [📊 Log] [📈 Progress] [👤 Profile]
```

**Desktop** (Left Sidebar):
```
┌─ Navigation ──────┐
│ 🏠 Home           │
│ 🍎 Nutri Coach    │
│ 📊 Diet Log       │
│ 📈 My Progress    │
│ 👤 Profile        │
└───────────────────┘
```

---

## Pain Points & Solutions

### Pain Point 1: Complex Dietary Restrictions

**User Pain**: "I have to track 4 different nutrients simultaneously. It's overwhelming."

**Solution**:
1. Visual hierarchy - Display only critical nutrients prominently
2. Color coding - Green (safe), Amber (caution), Red (limit)
3. Progressive disclosure - Hide details until ready
4. Smart alerts - Warn only at critical thresholds (75%, 90%)
5. AI prioritization - Recommends which nutrient to focus on

**Success Metric**: 80% of users log all meals for 7+ days

---

### Pain Point 2: Time-Consuming Manual Entry

**User Pain**: "Looking up nutrition info takes 10+ minutes per meal."

**Solution**:
1. AI photo analysis - 15-second scan vs. 10-minute manual entry
2. Quick log templates - Save frequent meals for 1-tap logging
3. Autocomplete - Smart suggestions based on typing
4. Barcode scanner - Instant lookup (future)
5. Meal replication - "Log same as yesterday"

**Success Metric**: Average time to log meal < 30 seconds

---

### Pain Point 3: Lack of Contextual Guidance

**User Pain**: "App tells me potassium is high but not what to do."

**Solution**:
1. Actionable recommendations - Not just warnings, solutions
2. Food substitutions - "Swap broccoli for cucumber"
3. Portion adjustments - "Reduce portion by 50g"
4. Meal planning - "For dinner, choose from..."
5. Educational links - "Learn why potassium matters"

**Success Metric**: 85% of warnings lead to user action

---

### Pain Point 4: Forgetting to Log Meals

**User Pain**: "I forget to log until end of day, can't remember what I ate."

**Solution**:
1. Smart reminders - ML learns typical meal times
2. Streak motivation - Visual streak counter
3. Quick access - Widget, shortcut, Siri integration
4. Gentle nudges - "Lunch time! Log now 🔥"
5. Memory aids - "You ate at ABC Restaurant (from location)"

**Success Metric**: 75% of meals logged within 1 hour of eating

---

### Pain Point 5: No Preparation for Medical Appointments

**User Pain**: "Doctor asks how diet is going and I just say 'fine' with no data."

**Solution**:
1. One-tap reports - Generate professional PDF in seconds
2. Key insights - AI highlights patterns for doctor
3. Visual trends - Graphs easier than numbers
4. Appointment mode - Optimized for sharing
5. Email integration - Send directly to doctor

**Success Metric**: 50% of users generate report before quarterly appointment

---

### Pain Point 6: Social Isolation

**User Pain**: "I feel alone managing this diet. Family doesn't understand."

**Solution**:
1. Optional community - Connect with other CKD patients
2. Recipe sharing - Discover meals from peers
3. Success stories - See others thriving
4. Support groups - Moderated safe space
5. Caregiver involvement - Share progress with family

**Success Metric**: 30% join community, 90% report feeling supported

---

## Success Metrics

### Key Performance Indicators (KPIs)

#### 1. Engagement Metrics

**Daily Active Users (DAU)**: Target 70% of registered users log in daily

**Meal Logging Rate**: Target 2.5 meals per active user per day

**Streak Maintenance**: Target 60% maintain 7+ day streak

**Feature Adoption**:
- AI Photo Analysis: 75% of meals
- Manual Entry: 15% of meals
- Quick Templates: 10% of meals

#### 2. Health Outcome Metrics

**Dietary Adherence**: Target 85% average adherence score

**Nutrient Management**:
- Sodium: 90% of days under limit
- Protein: 85% of days under limit
- Potassium: 80% of days under limit
- Phosphorus: 90% of days under limit

#### 3. User Satisfaction Metrics

**Net Promoter Score (NPS)**: Target > 50

**User Satisfaction (CSAT)**: Target 4.3/5 average

**Task Success Rate**:
- Log meal: > 95% completion
- Set goals: > 90% completion
- Generate report: > 95% completion

#### 4. Retention Metrics

- Day 1 Retention: 80%
- Day 7 Retention: 60%
- Day 30 Retention: 50%
- Day 90 Retention: 40%
- Monthly Churn: < 10%

#### 5. Technical Performance Metrics

- Load time: < 2 seconds
- AI analysis: < 20 seconds
- Crash rate: < 0.1%
- API uptime: 99.9%
- Accessibility score: > 95% (WCAG AAA)

---

## Conclusion

This UX storyline provides a comprehensive blueprint for the Diet Care feature, designed with deep empathy for CKD patients, caregivers, and healthcare professionals. The design prioritizes:

1. **User-Centered Design**: Every decision traced back to user needs
2. **Accessibility**: Inclusive design for all abilities
3. **Simplicity**: Reduce complexity of managing chronic disease
4. **Evidence-Based**: Clinical accuracy and medical validation
5. **Motivation**: Gamification and positive reinforcement
6. **Context-Aware**: Adapts to real-world usage scenarios

### Design Philosophy

> "Managing chronic kidney disease is overwhelming. Technology should reduce that burden, not add to it. Every pixel, every interaction, every word should serve the user's ultimate goal: living well with CKD."

---

**Document Prepared By**: UX Design Team
**Date**: November 27, 2025
**Version**: 1.0
**Status**: Ready for Implementation

**Related Documents**:
- `/new_frontend/DIET_CARE_DESIGN_SYSTEM.md` - Visual design specifications
- `/new_frontend/DIET_CARE_IMPLEMENTATION.md` - Technical implementation guide
- `/new_frontend/src/types/diet-care.ts` - TypeScript type definitions
