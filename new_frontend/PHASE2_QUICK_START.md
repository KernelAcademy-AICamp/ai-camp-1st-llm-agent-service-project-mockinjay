# Phase 2 Quick Start Guide

## 5-Minute Integration Guide

### Step 1: Import Components

```typescript
import {
  TermsAgreement,
  DiseaseStageSelector,
  TermsData,
  TermsAgreements,
} from '@/components/auth';
import { getTerms } from '@/services/api';
```

### Step 2: Add Terms Agreement Step

```typescript
// Fetch terms data
const [termsData, setTermsData] = useState<TermsData | null>(null);

useEffect(() => {
  const fetchTerms = async () => {
    const terms = await getTerms();
    setTermsData(terms);
  };
  fetchTerms();
}, []);

// Manage agreements state
const [agreements, setAgreements] = useState<TermsAgreements>({
  all: false,
  service: false,
  privacyRequired: false,
  privacyOptional: false,
  marketing: false,
});

// Check if can proceed
const canProceed = agreements.service && agreements.privacyRequired;

// Render component
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
```

### Step 3: Add Enhanced Validation

```typescript
import { useEmailValidation, useNicknameValidation } from '@/utils/validation';

// Email validation with auto-check
const { isChecking, error, isAvailable } = useEmailValidation(email, 500);

// Nickname validation with auto-check
const { isChecking, error, isAvailable } = useNicknameValidation(nickname, 500);

// Use in JSX
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className={error ? 'border-red-500' : ''}
/>
{isChecking && <Spinner />}
{error && <Error>{error}</Error>}
{isAvailable && <Success>사용 가능</Success>}
```

### Step 4: Add CKD Stage Selector

```typescript
import { DiseaseStageSelector } from '@/components/auth';

const [diseaseInfo, setDiseaseInfo] = useState('');

<DiseaseStageSelector
  value={diseaseInfo}
  onChange={setDiseaseInfo}
  required
  showRecommendations
/>
```

### Step 5: Submit with Agreements

```typescript
await signup({
  username: email,
  email: email,
  password: password,
  // ... other fields
  diseaseInfo: diseaseInfo,
  agreements: {
    service: agreements.service,
    privacyRequired: agreements.privacyRequired,
    privacyOptional: agreements.privacyOptional,
    marketing: agreements.marketing,
  },
});
```

## Common Patterns

### Pattern 1: Manual Validation Trigger

```typescript
const { manualCheck } = useEmailValidation(email);

<button onClick={manualCheck}>
  중복 확인
</button>
```

### Pattern 2: Password Strength Indicator

```typescript
import { getPasswordStrength } from '@/utils/validation';

const strength = getPasswordStrength(password);

<div className={`h-2 ${strength.color}`} style={{ width: `${strength.score * 20}%` }} />
<span>{strength.label}</span>
```

### Pattern 3: Feature Flag Check

```typescript
import { isFeatureEnabled } from '@/config/featureFlags';

if (isFeatureEnabled('TERMS_AGREEMENT')) {
  return <TermsAgreement {...props} />;
}
```

## Troubleshooting

### Issue: Terms not loading
**Solution:** Check backend is running and `/api/terms/all` is accessible

### Issue: Validation not triggering
**Solution:** Ensure debounce time is appropriate (default 500ms)

### Issue: Accessibility warnings
**Solution:** Run `npm run test:a11y` and fix violations

## Testing

```bash
# Run all tests
npm run test

# Run specific test
npm run test TermsAgreement

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Documentation

- Full Guide: [PHASE2_IMPLEMENTATION_GUIDE.md](./PHASE2_IMPLEMENTATION_GUIDE.md)
- Delivery Summary: [PHASE2_DELIVERY_SUMMARY.md](./PHASE2_DELIVERY_SUMMARY.md)
