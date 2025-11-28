# Phase 2 Implementation Guide: Terms Agreement & Enhanced Signup

## Overview

This document provides comprehensive guidance for the Phase 2 implementation of the Terms Agreement and Enhanced Signup flow. This phase is legally required for GDPR/HIPAA compliance and includes critical features for improving signup conversion rates.

**Priority:** P0 (Critical)
**Expected Impact:** +30% signup completion rate
**Implementation Period:** Days 8-12

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [Feature Flags](#feature-flags)
4. [Backend Integration](#backend-integration)
5. [Accessibility Compliance](#accessibility-compliance)
6. [Testing Strategy](#testing-strategy)
7. [Usage Examples](#usage-examples)
8. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

### System Flow

```
User Visit → Signup Page → Step 0: Terms Agreement
                         ↓
                    Step 1: Account Info (Email/Password)
                         ↓
                    Step 2: Personal Info (Nickname/Gender/Birth)
                         ↓
                    Step 3: Disease Info (CKD Stage)
                         ↓
                    Complete Registration → Login
```

### Technology Stack

- **Frontend:** React 18+ with TypeScript
- **Form Management:** React Hooks (useState, useCallback, useEffect)
- **Validation:** Custom hooks with debouncing
- **Styling:** TailwindCSS with custom design system
- **Testing:** Vitest + React Testing Library
- **API:** Axios with interceptors

---

## Component Structure

### Directory Layout

```
new_frontend/src/
├── components/
│   └── auth/
│       ├── types.ts                    # TypeScript interfaces
│       ├── TermsCheckbox.tsx           # Checkbox component
│       ├── TermsAgreement.tsx          # Terms accordion UI
│       ├── DiseaseStageSelector.tsx    # CKD stage selector
│       ├── index.ts                    # Export barrel
│       └── __tests__/
│           ├── TermsAgreement.test.tsx
│           └── DiseaseStageSelector.test.tsx
├── config/
│   ├── featureFlags.ts                 # Feature flag management
│   └── diseaseStages.ts                # CKD stage configuration
├── utils/
│   ├── validation.ts                   # Validation utilities
│   └── __tests__/
│       └── validation.test.ts
└── pages/
    └── SignupPage.tsx                  # Main signup page
```

### Key Components

#### 1. TermsAgreement Component

**Location:** `src/components/auth/TermsAgreement.tsx`

**Purpose:** Displays all terms and conditions with accordion UI

**Features:**
- 4 types of terms (service, privacy required/optional, marketing)
- "Select All" functionality
- Expandable/collapsible content
- Required/optional distinction
- Validation before proceeding

**Props:**
```typescript
interface TermsAgreementProps {
  termsData: TermsData;
  agreements: TermsAgreements;
  onAgreementChange: (key: keyof TermsAgreements, checked: boolean) => void;
  onAllAgreementChange: (checked: boolean) => void;
  canProceed: boolean;
  onNext: () => void;
}
```

**Usage:**
```tsx
<TermsAgreement
  termsData={termsData}
  agreements={agreements}
  onAgreementChange={handleAgreementChange}
  onAllAgreementChange={handleAllAgreementChange}
  canProceed={canProceed}
  onNext={handleNext}
/>
```

#### 2. DiseaseStageSelector Component

**Location:** `src/components/auth/DiseaseStageSelector.tsx`

**Purpose:** Enhanced CKD stage selection with medical information

**Features:**
- 10 CKD stage options with descriptions
- eGFR (Estimated Glomerular Filtration Rate) information
- Severity indicators (mild/moderate/severe/critical)
- Medical tooltips
- Dietary recommendations
- Expandable detailed information

**Props:**
```typescript
interface DiseaseStageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showRecommendations?: boolean;
}
```

**Usage:**
```tsx
<DiseaseStageSelector
  value={diseaseInfo}
  onChange={setDiseaseInfo}
  required
  showRecommendations
/>
```

#### 3. Validation Utilities

**Location:** `src/utils/validation.ts`

**Purpose:** Real-time validation with debouncing

**Features:**
- Password strength calculation
- Email format validation
- Birth date validation
- Debounced duplicate checks
- Custom hooks for email/nickname validation

**Key Functions:**
```typescript
// Password strength
const passwordStrength = getPasswordStrength(password);

// Email validation
const isValid = isValidEmail(email);

// Email duplicate check with debouncing
const { isChecking, error, isAvailable, manualCheck } = useEmailValidation(email, 500);

// Nickname duplicate check with debouncing
const { isChecking, error, isAvailable, manualCheck } = useNicknameValidation(nickname, 500);
```

---

## Feature Flags

### Configuration

**Location:** `src/config/featureFlags.ts`

**Available Flags:**
```typescript
{
  TERMS_AGREEMENT: true,        // Enable terms agreement flow
  NEW_SIGNUP_FLOW: true,         // Enable enhanced signup
  ENHANCED_VALIDATION: true,     // Enable debounced validation
  CKD_STAGE_SELECTION: true,     // Enable CKD stage selector
}
```

### Environment Variables

Set in `.env` file:
```bash
VITE_FEATURE_TERMS_AGREEMENT=true
VITE_FEATURE_NEW_SIGNUP_FLOW=true
VITE_FEATURE_ENHANCED_VALIDATION=true
VITE_FEATURE_CKD_STAGE_SELECTION=true
```

### Usage

```typescript
import { isFeatureEnabled } from '@/config/featureFlags';

if (isFeatureEnabled('TERMS_AGREEMENT')) {
  // Show terms agreement step
}
```

---

## Backend Integration

### API Endpoints

#### 1. Get Terms

**Endpoint:** `GET /api/terms/all`
**Authentication:** Public (no auth required)
**Response:**
```json
{
  "status": "success",
  "terms": {
    "service_terms": {
      "title": "서비스 이용약관",
      "required": true,
      "content": "..."
    },
    "privacy_required": {
      "title": "개인정보 수집·이용 동의 (필수)",
      "required": true,
      "content": "..."
    },
    "privacy_optional": {
      "title": "개인정보 수집·이용 동의 (선택)",
      "required": false,
      "content": "..."
    },
    "marketing": {
      "title": "마케팅 정보 수신 동의",
      "required": false,
      "content": "..."
    }
  }
}
```

#### 2. Check Email Duplicate

**Endpoint:** `GET /api/auth/check-email?email={email}`
**Authentication:** Public
**Response:**
```json
{
  "available": true,
  "message": "사용 가능한 이메일입니다."
}
```

#### 3. Check Nickname Duplicate

**Endpoint:** `GET /api/auth/check-username?username={nickname}`
**Authentication:** Public
**Response:**
```json
{
  "available": true,
  "message": "사용 가능한 닉네임입니다."
}
```

#### 4. Register User

**Endpoint:** `POST /api/auth/register`
**Authentication:** Public
**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "SecurePass123!",
  "fullName": "홍길동",
  "profile": "patient",
  "nickname": "홍길동",
  "gender": "남성",
  "birthDate": "1990-01-01",
  "height": 175,
  "weight": 70,
  "diseaseInfo": "CKD3",
  "agreements": {
    "service": true,
    "privacyRequired": true,
    "privacyOptional": false,
    "marketing": false
  }
}
```

### Middleware Configuration

**File:** `backend/app/middleware/auth.py`

**Public Paths Added:**
```python
PUBLIC_PREFIXES = [
    # ...existing paths...
    "/api/terms/",          # Terms endpoints (for signup)
    "/api/auth/check-",     # Duplicate check endpoints (for signup)
]
```

---

## Accessibility Compliance

### WCAG 2.1 Level AA Standards

#### 1. Keyboard Navigation

- All interactive elements are keyboard accessible
- Proper tab order maintained
- Enter/Space key support for checkboxes and radio buttons
- Escape key to close expanded content

#### 2. Screen Reader Support

**ARIA Labels:**
```tsx
<div role="form" aria-label="약관 동의">
  <div role="radiogroup" aria-label="질환 단계 선택">
    <div role="radio" aria-checked={checked}>
      <input className="sr-only" aria-label={label} />
    </div>
  </div>
</div>
```

**Live Regions:**
```tsx
<div role="alert" aria-live="polite">
  필수 약관에 모두 동의해야 다음 단계로 진행할 수 있습니다.
</div>

<div role="status" aria-live="polite">
  {isChecking && '이메일 확인 중...'}
</div>
```

#### 3. Color Contrast

- All text meets WCAG AA contrast ratios
- Error states use both color AND icons
- Success states use both color AND checkmarks

#### 4. Focus Management

```tsx
// Focus trap in modals
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onChange(!checked);
  }
}}

// Visible focus indicators
className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

---

## Testing Strategy

### Unit Tests

**Test Coverage Target:** 80%+

**Key Test Files:**
- `TermsAgreement.test.tsx` - Terms component functionality
- `validation.test.ts` - Validation utilities
- `DiseaseStageSelector.test.tsx` - Stage selector (pending)

**Example Test:**
```typescript
describe('TermsAgreement Component', () => {
  it('renders all terms when termsData is provided', () => {
    render(<TermsAgreement {...props} />);
    expect(screen.getByText('서비스 전체 약관에 동의합니다')).toBeInTheDocument();
  });

  it('disables next button when required terms not checked', () => {
    render(<TermsAgreement {...props} canProceed={false} />);
    expect(screen.getByRole('button', { name: '다음 단계로' })).toBeDisabled();
  });
});
```

### Integration Tests

**Test Scenarios:**
1. Complete signup flow (all steps)
2. Email duplicate detection
3. Nickname duplicate detection
4. Password strength validation
5. Form validation errors
6. Back button navigation

### Accessibility Tests

**Tools:**
- axe-core (automated accessibility testing)
- Manual keyboard navigation testing
- Screen reader testing (NVDA/JAWS)

**Run Tests:**
```bash
# Unit tests
npm run test

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Usage Examples

### Example 1: Basic Integration

```tsx
import { TermsAgreement } from '@/components/auth';
import { getTerms } from '@/services/api';

function SignupPage() {
  const [termsData, setTermsData] = useState<TermsData | null>(null);
  const [agreements, setAgreements] = useState({
    all: false,
    service: false,
    privacyRequired: false,
    privacyOptional: false,
    marketing: false,
  });

  useEffect(() => {
    const fetchTerms = async () => {
      const terms = await getTerms();
      setTermsData(terms);
    };
    fetchTerms();
  }, []);

  const canProceed = agreements.service && agreements.privacyRequired;

  return (
    <TermsAgreement
      termsData={termsData}
      agreements={agreements}
      onAgreementChange={(key, checked) => {
        setAgreements(prev => ({ ...prev, [key]: checked }));
      }}
      onAllAgreementChange={(checked) => {
        setAgreements({
          all: checked,
          service: checked,
          privacyRequired: checked,
          privacyOptional: checked,
          marketing: checked,
        });
      }}
      canProceed={canProceed}
      onNext={() => setCurrentStep(1)}
    />
  );
}
```

### Example 2: Enhanced Validation

```tsx
import { useEmailValidation, useNicknameValidation } from '@/utils/validation';

function AccountInfoStep() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');

  // Automatic validation with debouncing
  const emailValidation = useEmailValidation(email, 500);
  const nicknameValidation = useNicknameValidation(nickname, 500);

  return (
    <div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={emailValidation.error ? 'border-red-500' : ''}
      />
      {emailValidation.isChecking && <Spinner />}
      {emailValidation.error && <Error>{emailValidation.error}</Error>}
      {emailValidation.isAvailable && <Success>사용 가능</Success>}
    </div>
  );
}
```

### Example 3: CKD Stage Selection

```tsx
import { DiseaseStageSelector } from '@/components/auth';

function DiseaseInfoStep() {
  const [diseaseInfo, setDiseaseInfo] = useState('');

  return (
    <DiseaseStageSelector
      value={diseaseInfo}
      onChange={setDiseaseInfo}
      required
      showRecommendations
    />
  );
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing (80%+ coverage)
- [ ] Integration tests completed
- [ ] Accessibility audit completed
- [ ] Code review approved
- [ ] Backend endpoints verified
- [ ] Feature flags configured
- [ ] Environment variables set

### Backend Verification

- [ ] Terms API endpoint accessible (`/api/terms/all`)
- [ ] Email check endpoint working (`/api/auth/check-email`)
- [ ] Nickname check endpoint working (`/api/auth/check-username`)
- [ ] Registration endpoint updated with new fields
- [ ] Middleware configured for public access
- [ ] Database schema supports new fields

### Frontend Verification

- [ ] Terms agreement component renders correctly
- [ ] All validation works with debouncing
- [ ] CKD stage selector displays medical information
- [ ] Password strength indicator functional
- [ ] Error messages display correctly
- [ ] Success indicators work
- [ ] Step navigation functional
- [ ] Form submission successful

### Accessibility Verification

- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all states
- [ ] ARIA labels present and correct
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Error announcements work

### Post-Deployment

- [ ] Monitor signup completion rates
- [ ] Check error logs for validation issues
- [ ] Verify terms acceptance rates
- [ ] Monitor API performance (duplicate checks)
- [ ] Collect user feedback
- [ ] A/B test results analysis

---

## Performance Metrics

### Expected Improvements

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Signup Completion | 60% | 78% | +30% |
| Terms Read Rate | 15% | 45% | +200% |
| Validation Errors | 25% | 10% | -60% |
| Time to Complete | 3min | 2min | -33% |

### Monitoring

**Key Metrics to Track:**
- Signup abandonment rate per step
- Terms agreement selection distribution
- Email/nickname duplicate check frequency
- CKD stage distribution
- Password strength distribution
- API response times

---

## Support & Troubleshooting

### Common Issues

**Issue:** Terms not loading
**Solution:** Check `/api/terms/all` endpoint accessibility, verify CORS settings

**Issue:** Duplicate check not working
**Solution:** Verify middleware public paths include `/api/auth/check-`

**Issue:** Validation too aggressive
**Solution:** Adjust debounce time in `useEmailValidation` and `useNicknameValidation`

**Issue:** Accessibility issues
**Solution:** Run `npm run test:a11y` and fix reported violations

### Contact

For questions or issues, contact:
- Frontend Team: frontend-team@example.com
- Backend Team: backend-team@example.com
- QA Team: qa-team@example.com

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-28 | 1.0.0 | Initial implementation | Development Team |

---

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Testing Library](https://testing-library.com/react)
- [National Kidney Foundation - CKD Stages](https://www.kidney.org/atoz/content/about-chronic-kidney-disease)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)

