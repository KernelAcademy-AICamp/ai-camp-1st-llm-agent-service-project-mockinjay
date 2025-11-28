# Accessibility Testing Setup Guide

Automated accessibility testing for CareGuide application

---

## Overview

This guide sets up **automated WCAG 2.2 AA compliance testing** to catch accessibility violations before they reach production.

**Testing Stack**:
- ✅ **axe-core** - WCAG rule engine (4,000+ validations)
- ✅ **jest-axe** - Jest integration for unit tests
- ✅ **Lighthouse CI** - Automated audits on every PR
- ✅ **@testing-library/react** - Accessible testing patterns
- ✅ **playwright** - E2E accessibility testing

---

## Installation

### Step 1: Install Dependencies

```bash
cd new_frontend

# Core testing libraries
npm install --save-dev \
  @axe-core/react \
  jest-axe \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event

# Lighthouse CI
npm install --save-dev @lhci/cli

# Playwright (if not already installed)
npm install --save-dev @playwright/test
npx playwright install
```

---

## Jest + axe-core Setup

### Step 2: Configure Jest

**`setupTests.ts`** (create if doesn't exist):
```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers with accessibility assertions
expect.extend(toHaveNoViolations);

// Mock window.matchMedia (for responsive tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
```

**Update `package.json`**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:a11y": "jest --testPathPattern=.*\\.a11y\\.test\\.tsx?$"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/src/setupTests.ts"],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1"
    }
  }
}
```

---

### Step 3: Create Accessibility Tests

#### **Example 1: SignupPage Accessibility Test**

**`src/pages/__tests__/SignupPage.a11y.test.tsx`**:
```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import SignupPage from '../SignupPage';
import { AuthProvider } from '@/contexts/AuthContext';

expect.extend(toHaveNoViolations);

// Wrapper with required providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SignupPage Accessibility', () => {
  it('should not have WCAG violations on initial load', async () => {
    const { container } = render(<SignupPage />, { wrapper: AllTheProviders });

    const results = await axe(container, {
      rules: {
        // Configure rules if needed
        // 'color-contrast': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible step indicator', async () => {
    render(<SignupPage />, { wrapper: AllTheProviders });

    // Check for progressbar role
    const progressbar = screen.queryByRole('progressbar');
    expect(progressbar).toBeInTheDocument();

    // Check ARIA attributes
    if (progressbar) {
      expect(progressbar).toHaveAttribute('aria-valuenow');
      expect(progressbar).toHaveAttribute('aria-valuemin');
      expect(progressbar).toHaveAttribute('aria-valuemax');
    }
  });

  it('should have proper heading hierarchy', () => {
    render(<SignupPage />, { wrapper: AllTheProviders });

    // Check for H1 (even if visually hidden)
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it('should have skip navigation link', () => {
    const { container } = render(<SignupPage />, { wrapper: AllTheProviders });

    // Check for skip link
    const skipLink = container.querySelector('a[href="#signup-form"]');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveTextContent(/건너뛰기/i);
  });

  it('should label all form inputs', () => {
    render(<SignupPage />, { wrapper: AllTheProviders });

    // All inputs should have accessible names
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toHaveAccessibleName();
    });
  });

  it('should have accessible error messages', async () => {
    const { container } = render(<SignupPage />, { wrapper: AllTheProviders });

    // Trigger email error
    const emailInput = screen.getByLabelText(/이메일/i);
    const checkButton = screen.getByRole('button', { name: /중복확인/i });

    // Click without entering email
    checkButton.click();

    // Wait for error
    await screen.findByRole('alert');

    // Run axe on updated DOM
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

#### **Example 2: Component Accessibility Test**

**`src/components/ui/__tests__/Button.a11y.test.tsx`**:
```typescript
import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from '../button';
import { Trash2 } from 'lucide-react';

describe('Button Accessibility', () => {
  it('should not have violations', async () => {
    const { container } = render(<Button>Click Me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible name with text', () => {
    const { getByRole } = render(<Button>Submit</Button>);
    expect(getByRole('button')).toHaveAccessibleName('Submit');
  });

  it('should have accessible name with icon and aria-label', () => {
    const { getByRole } = render(
      <Button size="icon" aria-label="삭제">
        <Trash2 size={20} />
      </Button>
    );
    expect(getByRole('button')).toHaveAccessibleName('삭제');
  });

  it('should indicate disabled state', () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    const button = getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('should indicate loading state', () => {
    const { getByRole } = render(<Button loading>Loading</Button>);
    const button = getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    // Loading spinner should have sr-only text
    expect(button.querySelector('.sr-only')).toHaveTextContent('Loading...');
  });
});
```

---

#### **Example 3: Dialog Accessibility Test**

**`src/components/ui/__tests__/Dialog.a11y.test.tsx`**:
```typescript
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '../dialog';

const TestDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button>Open Dialog</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>This is a test dialog.</DialogDescription>
        </DialogHeader>
        <button>Action</button>
      </DialogContent>
    </Dialog>
  );
};

describe('Dialog Accessibility', () => {
  it('should not have violations when closed', async () => {
    const { container } = render(<TestDialog />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have violations when open', async () => {
    const user = userEvent.setup();
    const { container } = render(<TestDialog />);

    // Open dialog
    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    await user.click(trigger);

    // Wait for dialog to appear
    await screen.findByRole('dialog');

    // Check accessibility
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible title and description', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Test Dialog');
    expect(dialog).toHaveAccessibleDescription('This is a test dialog.');
  });

  it('should trap focus when open', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    await user.click(trigger);

    await screen.findByRole('dialog');

    // Get focusable elements inside dialog
    const actionButton = screen.getByRole('button', { name: 'Action' });
    const closeButton = screen.getByRole('button', { name: 'Close' });

    // Tab should cycle through dialog elements only
    await user.tab();
    expect(actionButton).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();

    // Shift+Tab should go backwards
    await user.tab({ shift: true });
    expect(actionButton).toHaveFocus();
  });

  it('should close on Escape key', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    const trigger = screen.getByRole('button', { name: 'Open Dialog' });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Press Escape
    await user.keyboard('{Escape}');

    // Dialog should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

---

### Step 4: Run Tests

```bash
# Run all tests
npm test

# Run only accessibility tests
npm run test:a11y

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Lighthouse CI Setup

### Step 5: Configure Lighthouse CI

**`.lighthouserc.js`** (create in root):
```javascript
module.exports = {
  ci: {
    collect: {
      // URLs to test (adjust port as needed)
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/signup',
        'http://localhost:5173/login',
        'http://localhost:5173/chat',
        'http://localhost:5173/mypage',
      ],
      numberOfRuns: 3, // Run 3 times and take median
      startServerCommand: 'npm run preview', // Build and serve
      startServerReadyPattern: 'Local:',
      settings: {
        // Chrome flags for CI environment
        chromeFlags: '--no-sandbox --headless',
      },
    },
    assert: {
      assertions: {
        // Accessibility score must be ≥ 95
        'categories:accessibility': ['error', { minScore: 0.95 }],

        // Performance should be good (warning only)
        'categories:performance': ['warn', { minScore: 0.85 }],

        // Best practices
        'categories:best-practices': ['warn', { minScore: 0.90 }],

        // SEO
        'categories:seo': ['warn', { minScore: 0.90 }],

        // Specific accessibility audits
        'aria-required-attr': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'color-contrast': 'error',
        'duplicate-id-aria': 'error',
        'html-has-lang': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'warn',
        'listitem': 'warn',
        'meta-viewport': 'error',
        'tabindex': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage', // Or use LHCI server
    },
  },
};
```

**`package.json`** - Add scripts:
```json
{
  "scripts": {
    "lhci:collect": "lhci collect",
    "lhci:assert": "lhci assert",
    "lhci:upload": "lhci upload",
    "lhci": "npm run build && npm run lhci:collect && npm run lhci:assert"
  }
}
```

---

### Step 6: GitHub Actions Workflow

**`.github/workflows/accessibility.yml`**:
```yaml
name: Accessibility Audit

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: new_frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./new_frontend
        run: npm ci

      - name: Build application
        working-directory: ./new_frontend
        run: npm run build

      - name: Run Lighthouse CI
        working-directory: ./new_frontend
        run: |
          npm install -g @lhci/cli
          lhci autorun

      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lighthouse-results
          path: new_frontend/.lighthouseci

  jest-a11y:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: new_frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./new_frontend
        run: npm ci

      - name: Run accessibility tests
        working-directory: ./new_frontend
        run: npm run test:a11y

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: jest-a11y-results
          path: new_frontend/coverage
```

---

## Playwright E2E Accessibility Tests

### Step 7: Create Playwright Accessibility Tests

**`tests/accessibility/signup.spec.ts`**:
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Signup Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/signup');
  });

  test('should not have automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Start from body
    await page.keyboard.press('Tab');

    // Skip link should be first focusable element
    const skipLink = page.locator('a[href="#signup-form"]');
    await expect(skipLink).toBeFocused();

    // Continue tabbing through form
    await page.keyboard.press('Tab');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();
  });

  test('should announce form errors', async ({ page }) => {
    // Click email check button without entering email
    const checkButton = page.getByRole('button', { name: /중복확인/ });
    await checkButton.click();

    // Error message should appear with role="alert"
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/이메일/i);
  });

  test('should have proper focus management in modals', async ({ page }) => {
    // Open terms modal (if applicable)
    const termsButton = page.getByRole('button', { name: /약관 보기/ });
    if (await termsButton.isVisible()) {
      await termsButton.click();

      // Focus should move to modal
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();

      // Focus should return to trigger button
      await expect(termsButton).toBeFocused();
    }
  });

  test('should have accessible step indicator', async ({ page }) => {
    // Check for progressbar
    const progressbar = page.locator('[role="progressbar"]');
    await expect(progressbar).toBeVisible();

    // Check ARIA attributes
    await expect(progressbar).toHaveAttribute('aria-valuenow');
    await expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    await expect(progressbar).toHaveAttribute('aria-valuemax');
  });
});
```

**Install @axe-core/playwright**:
```bash
npm install --save-dev @axe-core/playwright
```

---

## VSCode Integration

### Step 8: Install VSCode Extensions

**Recommended extensions**:
1. **axe Accessibility Linter** (Deque)
   - Real-time accessibility checking in editor
   - Install: Search "axe" in VSCode extensions

2. **webhint** (Microsoft)
   - Accessibility, security, performance hints
   - Install: Search "webhint"

3. **ESLint** (with jsx-a11y plugin)
   ```bash
   npm install --save-dev eslint-plugin-jsx-a11y
   ```

**`.eslintrc.cjs`** - Add jsx-a11y rules:
```javascript
module.exports = {
  extends: [
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['jsx-a11y'],
  rules: {
    // Enforce accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
  },
};
```

---

## Pre-commit Hooks

### Step 9: Setup Husky + lint-staged

```bash
npm install --save-dev husky lint-staged
npx husky install
```

**`package.json`**:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "jest --bail --findRelatedTests --passWithNoTests"
    ]
  },
  "scripts": {
    "prepare": "husky install"
  }
}
```

**Create pre-commit hook**:
```bash
npx husky add .husky/pre-commit "cd new_frontend && npx lint-staged"
```

---

## Continuous Monitoring

### Step 10: Setup Accessibility Dashboard

**Option 1: Lighthouse CI Server** (Self-hosted)
```bash
# Install LHCI server
npm install -g @lhci/server

# Initialize database
lhci server --storage.storageMethod=sql --storage.sqlDatabasePath=./lhci.db
```

**Option 2: pa11y-ci** (Command-line monitoring)
```bash
npm install --save-dev pa11y-ci

# Create .pa11yci.json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 10000
  },
  "urls": [
    "http://localhost:5173/signup",
    "http://localhost:5173/login"
  ]
}

# Run
npx pa11y-ci
```

---

## Manual Testing Tools

### Browser Extensions

**Chrome DevTools**:
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Generate report"

**axe DevTools** (Free):
- Install: https://www.deque.com/axe/devtools/
- Scans entire page for WCAG violations
- Provides fix suggestions

**WAVE** (WebAIM):
- Install: https://wave.webaim.org/extension/
- Visual feedback on accessibility issues
- Shows ARIA landmarks and structure

---

## Testing Checklist

### Before Every PR
- [ ] Run `npm run test:a11y` - All tests pass
- [ ] Run `npm run lint` - No jsx-a11y errors
- [ ] Manual keyboard test (Tab through page)
- [ ] Check Lighthouse score ≥ 95

### Before Every Release
- [ ] Run full Lighthouse CI audit
- [ ] Manual screen reader test (NVDA or VoiceOver)
- [ ] Test with 200% zoom
- [ ] Test with Windows High Contrast Mode
- [ ] Verify all new components have accessibility tests

---

## Troubleshooting

### Common axe Violations

**"Elements must have sufficient color contrast"**
```tsx
// Fix: Use design system colors with documented contrast ratios
<p className="text-gray-400"> ❌ Too light (2.9:1)
<p className="text-gray-600"> ✅ Sufficient (8.1:1)
```

**"Buttons must have discernible text"**
```tsx
// Fix: Add aria-label to icon buttons
<button aria-label="삭제">
  <Trash2 aria-hidden="true" />
</button>
```

**"Form elements must have labels"**
```tsx
// Fix: Use label or aria-label
<label htmlFor="email">이메일</label>
<input id="email" type="email" />
```

---

## Summary

**What you get**:
- ✅ Automated WCAG violation detection
- ✅ 95% accessibility score requirement
- ✅ Pre-commit accessibility checks
- ✅ CI/CD pipeline integration
- ✅ Real-time editor feedback

**Estimated setup time**: 2-3 hours
**Ongoing maintenance**: ~10 minutes per PR

---

**Last Updated**: January 28, 2025
**Need Help?** Refer to `/new_frontend/ACCESSIBILITY_AUDIT_REPORT.md` for violations found
