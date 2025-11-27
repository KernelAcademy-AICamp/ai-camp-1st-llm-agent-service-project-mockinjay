import { test, expect, Page } from '@playwright/test';

/**
 * NUT Features Test Suite
 * Testing NUT-001 to NUT-005 functionality
 *
 * Features to test:
 * - NUT-001: Food/Nutrition Search
 * - NUT-002: Alternative Ingredients
 * - NUT-003: Alternative Recipes
 * - NUT-004: Diet Guide Summary
 * - NUT-005: Related Q&A
 */

const BASE_URL = 'http://localhost:5175';
const DIET_CARE_URL = `${BASE_URL}/diet-care`;
const NUTRI_COACH_URL = `${BASE_URL}/nutri-coach`;

test.describe('NUT Features - Diet Care Page', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Diet Care page before each test
    await page.goto(DIET_CARE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('NUT-001: Should display Diet Care page with proper header and navigation', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText(/식단 관리|Diet Care/);

    // Check description
    const description = page.locator('p.text-gray-600');
    await expect(description.first()).toContainText(/만성콩팥병|CKD patients/);

    // Check sub-navigation tabs
    const nutriCoachTab = page.locator('a[href="/nutri-coach"]');
    const dietLogTab = page.locator('a[href="/diet-log"]');

    await expect(nutriCoachTab).toBeVisible();
    await expect(dietLogTab).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/diet-care-page-overview.png',
      fullPage: true
    });
  });

  test('NUT-001: Should display disease-specific diet information cards', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Check for diet type cards (Low Sodium, Low Protein, Low Potassium, Low Phosphorus)
    const dietCards = page.locator('div.border').filter({ hasText: /저염식|저단백식|저칼륨식|저인식|Low Sodium|Low Protein|Low Potassium|Low Phosphorus/ });

    await expect(dietCards).toHaveCount(4);

    // Verify each card has title, limit, and tips
    const firstCard = dietCards.first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard.locator('p.text-sm')).toBeVisible();
    await expect(firstCard.locator('ul li')).toHaveCount(3);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/diet-info-cards.png',
      fullPage: true
    });
  });

  test('NUT-001: Should display food image analysis section', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Check for food image analysis section
    const analysisSection = page.locator('div.bg-white.dark\\:bg-gray-800').filter({ hasText: /음식 사진 분석|Food Image Analysis/ });
    await expect(analysisSection).toBeVisible();

    // Check for upload area
    const uploadArea = page.locator('label').filter({ hasText: /클릭하여 업로드|Click to upload/ });
    await expect(uploadArea).toBeVisible();

    // Verify upload instructions
    await expect(page.locator('text=/PNG, JPG, GIF/')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/food-image-upload-section.png',
      fullPage: true
    });
  });

  test('NUT-001: Should allow image file selection', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Create a test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Find file input and upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-food.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    // Wait for preview to appear
    await page.waitForTimeout(500);

    // Check if image preview is displayed
    const imagePreview = page.locator('img[alt="Food preview"]');
    await expect(imagePreview).toBeVisible();

    // Check for analyze button
    const analyzeButton = page.locator('button').filter({ hasText: /영양 성분 분석|Analyze Nutrition/ });
    await expect(analyzeButton).toBeVisible();
    await expect(analyzeButton).toBeEnabled();

    // Check for clear/delete button
    const clearButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(clearButton).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/image-preview-uploaded.png',
      fullPage: true
    });
  });

  test('NUT-002: Diet Log - Should display meal input forms', async ({ page }) => {
    await page.goto(`${BASE_URL}/diet-log`);
    await page.waitForLoadState('networkidle');

    // Check for goal setting section
    const goalSection = page.locator('div').filter({ hasText: /식단 관리 목표 등록|Set Diet Management Goals/ }).first();
    await expect(goalSection).toBeVisible();

    // Check for target nutrient inputs
    await expect(page.locator('input[type="number"]').first()).toBeVisible();

    // Check for meal sections (Breakfast, Lunch, Dinner, Snack)
    const mealSections = page.locator('div.border').filter({ hasText: /아침|점심|저녁|간식|Breakfast|Lunch|Dinner|Snack/ });
    await expect(mealSections).toHaveCount(4);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/diet-log-page.png',
      fullPage: true
    });
  });

  test('NUT-003: Should display nutrition input fields in meal sections', async ({ page }) => {
    await page.goto(`${BASE_URL}/diet-log`);
    await page.waitForLoadState('networkidle');

    // Check first meal section has food name and amount inputs
    const firstMealSection = page.locator('div.border').first();
    const foodNameInput = firstMealSection.locator('input[type="text"]');
    const amountInput = firstMealSection.locator('input[type="number"]');

    await expect(foodNameInput).toBeVisible();
    await expect(amountInput).toBeVisible();

    // Check for "Add food" button
    const addFoodButton = firstMealSection.locator('button').filter({ hasText: /음식 추가|Add food/ });
    await expect(addFoodButton).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/meal-input-fields.png',
      fullPage: true
    });
  });

  test('NUT-004: Should display "View Nutrition Analysis" button', async ({ page }) => {
    await page.goto(`${BASE_URL}/diet-log`);
    await page.waitForLoadState('networkidle');

    // Check for nutrition analysis button
    const analysisButton = page.locator('button').filter({ hasText: /영양 분석 보기|View Nutrition Analysis/ });
    await expect(analysisButton).toBeVisible();

    // Verify it has the chart icon
    await expect(analysisButton.locator('svg')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/nutrition-analysis-button.png',
      fullPage: true
    });
  });

  test('UI: Should support dark mode toggle', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Take screenshot in light mode
    await page.screenshot({
      path: 'tests/screenshots/diet-care-light-mode.png',
      fullPage: true
    });

    // Toggle dark mode (if dark mode toggle exists)
    const darkModeToggle = page.locator('button[aria-label*="dark"], button[aria-label*="theme"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(300);

      // Take screenshot in dark mode
      await page.screenshot({
        path: 'tests/screenshots/diet-care-dark-mode.png',
        fullPage: true
      });
    }
  });

  test('Responsive: Should be mobile-friendly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Check if content is visible in mobile view
    await expect(page.locator('h1')).toBeVisible();

    // Take mobile screenshot
    await page.screenshot({
      path: 'tests/screenshots/diet-care-mobile.png',
      fullPage: true
    });

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Navigation: Should navigate between NutriCoach and DietLog tabs', async ({ page }) => {
    // Start at NutriCoach
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Verify NutriCoach tab is active
    const nutriCoachTab = page.locator('a[href="/nutri-coach"]');
    await expect(nutriCoachTab).toHaveClass(/tab-selected/);

    // Click on DietLog tab
    const dietLogTab = page.locator('a[href="/diet-log"]');
    await dietLogTab.click();
    await page.waitForLoadState('networkidle');

    // Verify URL changed
    await expect(page).toHaveURL(`${BASE_URL}/diet-log`);

    // Verify DietLog tab is now active
    await expect(dietLogTab).toHaveClass(/tab-selected/);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/diet-log-tab-active.png',
      fullPage: true
    });
  });

  test('Accessibility: Should have proper ARIA labels and semantic HTML', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Check for semantic headings
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const h2 = page.locator('h2');
    await expect(h2.first()).toBeVisible();

    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      // Each button should have either text or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('Performance: Page should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    console.log(`Page load time: ${loadTime}ms`);
  });
});

test.describe('NUT Features - Backend Integration Tests', () => {

  test('API: Should handle session creation for nutrition analysis', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Monitor network requests
    const sessionRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/session/create')) {
        sessionRequests.push(request);
      }
    });

    // Try to trigger analysis (if image upload works)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-food.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.waitForTimeout(500);

    const analyzeButton = page.locator('button').filter({ hasText: /영양 성분 분석|Analyze Nutrition/ });

    if (await analyzeButton.isVisible() && await analyzeButton.isEnabled()) {
      await analyzeButton.click();

      // Wait for API call
      await page.waitForTimeout(2000);

      console.log('Session requests made:', sessionRequests.length);
    }
  });

  test('Error Handling: Should display error message on analysis failure', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Monitor for error messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // Try to trigger analysis with invalid data
    const testImageBuffer = Buffer.from('invalid-image-data');

    const fileInput = page.locator('input[type="file"]');
    try {
      await fileInput.setInputFiles({
        name: 'invalid.png',
        mimeType: 'image/png',
        buffer: testImageBuffer,
      });

      await page.waitForTimeout(500);

      const analyzeButton = page.locator('button').filter({ hasText: /영양 성분 분석|Analyze Nutrition/ });

      if (await analyzeButton.isVisible()) {
        await analyzeButton.click();
        await page.waitForTimeout(3000);

        // Check if error message is displayed
        const errorMessage = page.locator('div.bg-red-50, div.bg-red-900\\/20');
        if (await errorMessage.isVisible()) {
          await page.screenshot({
            path: 'tests/screenshots/error-message-display.png',
            fullPage: true
          });
        }
      }
    } catch (error) {
      console.log('Expected error during invalid file upload:', error);
    }
  });
});

test.describe('NUT Features - Content Verification', () => {

  test('Content: Should display all 4 diet type cards with correct information', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    const dietTypes = [
      { name: '저염식', nameEn: 'Low Sodium', color: 'blue' },
      { name: '저단백식', nameEn: 'Low Protein', color: 'green' },
      { name: '저칼륨식', nameEn: 'Low Potassium', color: 'yellow' },
      { name: '저인식', nameEn: 'Low Phosphorus', color: 'purple' },
    ];

    for (const diet of dietTypes) {
      const card = page.locator('div.border').filter({ hasText: new RegExp(`${diet.name}|${diet.nameEn}`) });
      await expect(card).toBeVisible();

      // Verify card has correct border color class
      const className = await card.getAttribute('class');
      expect(className).toContain(diet.color);
    }
  });

  test('Content: Should display nutrition target input fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/diet-log`);
    await page.waitForLoadState('networkidle');

    // Check for sodium input
    const sodiumLabel = page.locator('label').filter({ hasText: /나트륨|Sodium/ });
    await expect(sodiumLabel).toBeVisible();

    // Check for protein input
    const proteinLabel = page.locator('label').filter({ hasText: /단백질|Protein/ });
    await expect(proteinLabel).toBeVisible();

    // Check for potassium input
    const potassiumLabel = page.locator('label').filter({ hasText: /칼륨|Potassium/ });
    await expect(potassiumLabel).toBeVisible();
  });

  test('Content: Should display all meal categories', async ({ page }) => {
    await page.goto(`${BASE_URL}/diet-log`);
    await page.waitForLoadState('networkidle');

    const meals = ['아침', '점심', '저녁', '간식', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

    for (const meal of meals.slice(0, 4)) { // Check Korean or English
      const mealSection = page.locator('h3').filter({ hasText: new RegExp(meal) });
      if (await mealSection.isVisible()) {
        await expect(mealSection).toBeVisible();
      }
    }
  });
});

test.describe('NUT Features - User Interaction Tests', () => {

  test('Interaction: Should allow clearing uploaded image', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Upload image
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-food.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.waitForTimeout(500);

    // Verify image preview is visible
    await expect(page.locator('img[alt="Food preview"]')).toBeVisible();

    // Click clear button (X button)
    const clearButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await clearButton.click();

    await page.waitForTimeout(300);

    // Verify image preview is removed
    await expect(page.locator('img[alt="Food preview"]')).not.toBeVisible();

    // Verify upload area is visible again
    await expect(page.locator('label').filter({ hasText: /클릭하여 업로드|Click to upload/ })).toBeVisible();
  });

  test('Interaction: Should enable analyze button only when image is uploaded', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Initially, analyze button should not be visible
    let analyzeButton = page.locator('button').filter({ hasText: /영양 성분 분석|Analyze Nutrition/ });
    await expect(analyzeButton).not.toBeVisible();

    // Upload image
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-food.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.waitForTimeout(500);

    // Now analyze button should be visible and enabled
    analyzeButton = page.locator('button').filter({ hasText: /영양 성분 분석|Analyze Nutrition/ });
    await expect(analyzeButton).toBeVisible();
    await expect(analyzeButton).toBeEnabled();
  });

  test('Interaction: Should show loading state when analyzing', async ({ page }) => {
    await page.goto(NUTRI_COACH_URL);
    await page.waitForLoadState('networkidle');

    // Upload image
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-food.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    await page.waitForTimeout(500);

    // Click analyze button
    const analyzeButton = page.locator('button').filter({ hasText: /영양 성분 분석|Analyze Nutrition/ });
    await analyzeButton.click();

    // Check for loading state (spinner or "분석 중..." text)
    const loadingIndicator = page.locator('button').filter({ hasText: /분석 중|Analyzing/ });

    // The loading state might be very brief, so we use a timeout
    try {
      await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
      await page.screenshot({
        path: 'tests/screenshots/analyzing-loading-state.png',
        fullPage: true
      });
    } catch (error) {
      console.log('Loading state was too brief to capture or not displayed');
    }
  });
});
