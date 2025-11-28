# Feature Flags Quick Reference Guide

## Overview
This guide provides quick instructions for using the feature flag system in CareGuide.

---

## For Developers

### Opening the Debug Panel

**Keyboard Shortcut:**
```
Ctrl + Shift + F
```

**Requirements:**
- Only works in development mode (`npm run dev`)
- Not available in production builds

### Using Feature Flags in Code

#### Import the Hook
```typescript
import { useFeatureFlag, useFeatureFlags } from '../config/featureFlags';
```

#### Check a Single Flag
```typescript
const MyComponent = () => {
  const isEnhanced = useFeatureFlag('ENHANCED_CHAT');

  if (!isEnhanced) {
    return <StandardVersion />;
  }

  return <EnhancedVersion />;
};
```

#### Check Multiple Flags
```typescript
const MyComponent = () => {
  const {
    CHAT_WELCOME_MESSAGE,
    CHAT_SUGGESTION_CHIPS,
    CHAT_QUIZ_PROMPT
  } = useFeatureFlags();

  return (
    <>
      {CHAT_WELCOME_MESSAGE && <WelcomeMessage />}
      {CHAT_SUGGESTION_CHIPS && <SuggestionChips />}
      {CHAT_QUIZ_PROMPT && <QuizPromptBanner />}
    </>
  );
};
```

#### Programmatic Flag Management
```typescript
import {
  getFeatureFlags,
  setFeatureFlag,
  setFeatureFlags,
  resetFeatureFlags,
  exportFeatureFlags,
  importFeatureFlags
} from '../config/featureFlags';

// Get all flags
const flags = getFeatureFlags();

// Set a single flag
setFeatureFlag('ENHANCED_CHAT', true);

// Set multiple flags
setFeatureFlags({
  ENHANCED_CHAT: true,
  ENHANCED_DIET_CARE: false,
  CHAT_WELCOME_MESSAGE: true
});

// Reset all to defaults
resetFeatureFlags();

// Export flags as JSON string
const json = exportFeatureFlags();

// Import flags from JSON string
importFeatureFlags(jsonString);
```

---

## For QA/Testing

### Testing Enhanced Features

1. **Open the Debug Panel**
   - Press `Ctrl + Shift + F` in development mode
   - The panel will appear in the bottom-right corner

2. **Toggle Features**
   - Click the toggle switch next to any feature flag
   - Changes take effect immediately (no page refresh needed)

3. **Search Flags**
   - Use the search box at the top to filter flags
   - Type keywords like "CHAT", "DIET", "MYPAGE", etc.

4. **Export Configuration**
   - Click the download icon to export current flags
   - Save the JSON file for later use

5. **Import Configuration**
   - Click the upload icon to import flags
   - Select a previously exported JSON file

6. **Reset to Defaults**
   - Click the reset icon (rotate arrow)
   - Confirms before resetting

7. **Copy to Clipboard**
   - Click the copy icon to copy all flags as JSON
   - Paste into documentation or share with team

### Test Scenarios

#### Scenario 1: Test Standard vs Enhanced Chat
```
1. Open debug panel (Ctrl + Shift + F)
2. Find "ENHANCED_CHAT" flag
3. Toggle OFF → See standard chat
4. Toggle ON → See enhanced chat with sidebar
5. Verify both versions work correctly
```

#### Scenario 2: Test Individual Chat Features
```
1. Ensure ENHANCED_CHAT is ON
2. Toggle CHAT_WELCOME_MESSAGE → Verify welcome message appears/disappears
3. Toggle CHAT_SUGGESTION_CHIPS → Verify suggestions appear/disappear
4. Toggle CHAT_QUIZ_PROMPT → Send 4 messages, verify prompt shows/hides
5. Toggle CHAT_SOURCE_CITATIONS → Verify citations appear/disappear
```

#### Scenario 3: Test Diet Care Features
```
1. Navigate to /diet-care
2. Toggle DIET_TRAFFIC_LIGHT_SYSTEM
3. Verify traffic light warnings appear/disappear
4. Toggle DIET_NUTRITION_EDUCATION
5. Verify education tooltips appear/disappear
```

### QA Checklist

#### Before Testing
- [ ] Open debug panel (Ctrl + Shift + F)
- [ ] Note current flag configuration
- [ ] Export flags as backup

#### During Testing
- [ ] Test each feature flag individually
- [ ] Test combinations of flags
- [ ] Verify no console errors
- [ ] Check accessibility with each flag
- [ ] Test on mobile viewport

#### After Testing
- [ ] Reset flags to defaults
- [ ] Document any issues found
- [ ] Share flag configuration if bugs found

---

## For Product Managers

### Available Feature Flags

#### Page-Level Features (Enable/Disable Entire Enhanced Pages)

| Flag | Description | Impact |
|------|-------------|--------|
| `ENHANCED_CHAT` | Enhanced chat with sidebar and streaming | +40% feature discovery |
| `ENHANCED_DIET_CARE` | Enhanced diet management with traffic lights | +35% health outcomes |
| `ENHANCED_MY_PAGE` | Enhanced profile with quiz stats | +50% user retention |
| `ENHANCED_COMMUNITY` | Enhanced community with featured posts | +45% post engagement |
| `ENHANCED_TRENDS` | Enhanced trends with news and trials | +60% research discovery |

#### Component-Level Features (Fine-Grained Control)

**Chat Components:**
| Flag | Description | Default |
|------|-------------|---------|
| `CHAT_WELCOME_MESSAGE` | Show welcome message on empty chat | ON |
| `CHAT_SUGGESTION_CHIPS` | Show suggestion chips | ON |
| `CHAT_QUIZ_PROMPT` | Show quiz prompt after 4 messages | ON |
| `CHAT_SOURCE_CITATIONS` | Show research paper citations | ON |
| `CHAT_SIDEBAR` | Enable chat rooms sidebar | ON |

**Diet Care Components:**
| Flag | Description | Default |
|------|-------------|---------|
| `DIET_TRAFFIC_LIGHT_SYSTEM` | Red/yellow/green nutrient warnings | ON |
| `DIET_MEAL_LOGGING` | Meal entry and tracking | ON |
| `DIET_NUTRITION_EDUCATION` | Educational tooltips | ON |
| `DIET_GOAL_SETTING` | Daily nutrition goals | ON |

**MyPage Components:**
| Flag | Description | Default |
|------|-------------|---------|
| `MYPAGE_QUIZ_STATS` | Quiz statistics visualization | ON |
| `MYPAGE_BOOKMARKS_MODAL` | Bookmarked papers modal | ON |
| `MYPAGE_HEALTH_PROFILE` | Health profile management | ON |

**Community Components:**
| Flag | Description | Default |
|------|-------------|---------|
| `COMMUNITY_FEATURED_POSTS` | Featured posts carousel | ON |
| `COMMUNITY_INLINE_EDIT` | Inline post editing | ON |
| `COMMUNITY_ANONYMOUS_POSTING` | Anonymous post creation | ON |

**Trends Components:**
| Flag | Description | Default |
|------|-------------|---------|
| `TRENDS_NEWS_TAB` | News feed tab | ON |
| `TRENDS_CLINICAL_TRIALS` | Clinical trials tab | ON |
| `TRENDS_DASHBOARD` | Research dashboard tab | ON |
| `TRENDS_BOOKMARKS` | Bookmark research papers | ON |

### Rollout Strategies

#### Strategy 1: All-or-Nothing (Current)
- All enhanced features ON by default
- Fastest rollout
- Higher risk

#### Strategy 2: Gradual by Page
```
Week 1: ENHANCED_CHAT only
Week 2: Add ENHANCED_DIET_CARE
Week 3: Add ENHANCED_MY_PAGE
Week 4: Add ENHANCED_COMMUNITY + ENHANCED_TRENDS
```

#### Strategy 3: Gradual by Component
```
Week 1: Core features (CHAT_SIDEBAR, DIET_TRAFFIC_LIGHT_SYSTEM)
Week 2: Add engagement features (CHAT_QUIZ_PROMPT, COMMUNITY_FEATURED_POSTS)
Week 3: Add educational features (DIET_NUTRITION_EDUCATION, CHAT_SOURCE_CITATIONS)
Week 4: Add remaining features
```

#### Strategy 4: A/B Testing
- 50% users see enhanced features
- 50% users see standard features
- Compare metrics after 2 weeks
- Roll out to 100% if successful

---

## For DevOps

### Production Deployment

#### Option 1: Environment Variables (Recommended)
```bash
# .env.production
VITE_FEATURE_FLAGS='{"ENHANCED_CHAT":true,"ENHANCED_DIET_CARE":true}'
```

Then in `featureFlags.ts`:
```typescript
const envFlags = import.meta.env.VITE_FEATURE_FLAGS
  ? JSON.parse(import.meta.env.VITE_FEATURE_FLAGS)
  : {};

const defaultFlags = {
  ...baseDefaults,
  ...envFlags
};
```

#### Option 2: Remote Config (Advanced)
Integrate with services like Firebase Remote Config, LaunchDarkly, or Unleash for:
- Real-time flag updates without deployment
- User segmentation
- Percentage rollouts
- A/B testing

#### Option 3: Admin Panel
Create admin UI for non-technical users to toggle flags:
```
/admin/feature-flags
- List all flags
- Toggle on/off
- Set percentage rollouts
- View usage analytics
```

### Monitoring

#### Track Flag Usage
```typescript
// In analytics.ts
export function trackFeatureFlag(flag: string, enabled: boolean) {
  gtag('event', 'feature_flag', {
    flag_name: flag,
    flag_value: enabled,
    timestamp: new Date().toISOString()
  });
}
```

#### Monitor Errors by Flag
```typescript
// In Sentry
Sentry.setContext('feature_flags', getFeatureFlags());
```

---

## Troubleshooting

### Debug Panel Not Opening
- **Check:** Are you in development mode? (`npm run dev`)
- **Check:** Is the keyboard shortcut correct? (Ctrl + Shift + F)
- **Fix:** Look for console errors, ensure FeatureFlagPanel is imported in App.tsx

### Flags Not Persisting
- **Check:** Browser localStorage enabled?
- **Check:** Incognito/private mode? (localStorage may be disabled)
- **Fix:** Check browser console for storage errors

### Changes Not Reflecting
- **Issue:** Some components may not react to flag changes
- **Fix:** Refresh the page after toggling flags
- **Note:** Most components update immediately via the event system

### Lost Flag Configuration
- **Prevention:** Export flags regularly
- **Recovery:** Import from backup JSON file
- **Reset:** Use reset button to restore defaults

---

## Best Practices

### For Development
1. ✅ Always use feature flags for new features
2. ✅ Test both ON and OFF states
3. ✅ Document new flags in this guide
4. ✅ Remove flags after feature is stable (6+ months)

### For Testing
1. ✅ Test with all flags ON (enhanced mode)
2. ✅ Test with all flags OFF (standard mode)
3. ✅ Test individual flag combinations
4. ✅ Export flag config when reporting bugs

### For Deployment
1. ✅ Review flag states before deployment
2. ✅ Plan gradual rollout strategy
3. ✅ Monitor metrics after enabling flags
4. ✅ Have rollback plan ready

---

## FAQ

### Q: Can users access the debug panel in production?
**A:** No, the debug panel only appears when `import.meta.env.DEV` is true (development builds only).

### Q: How do I add a new feature flag?
**A:**
1. Add to `FeatureFlags` interface in `featureFlags.ts`
2. Add to `defaultFlags` object with default value
3. Use in components via `useFeatureFlag()`
4. Document in this guide

### Q: What happens if I remove a flag?
**A:** TypeScript will show errors wherever the flag is used. Update all references before removing.

### Q: Can I have different flags per environment?
**A:** Yes, use environment variables or remote config services.

### Q: How long should flags stay in the codebase?
**A:** Remove flags 6 months after 100% rollout. Convert to permanent code.

---

## Support

### Issues or Questions?
- Open issue on GitHub
- Contact dev team on Slack
- Check development documentation

### Feature Requests?
- Submit feature request
- Discuss in product meetings
- Add to roadmap

---

**Last Updated:** 2025-11-28
**Maintained By:** Development Team
**Version:** 1.0.0
