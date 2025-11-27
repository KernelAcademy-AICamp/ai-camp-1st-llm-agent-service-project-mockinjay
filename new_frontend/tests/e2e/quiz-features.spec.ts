import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:5175';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'quiz-test-screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

test.describe('QUI Features Testing - Quiz System', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('QUI-001: Navigate to Quiz page and capture initial state', async ({ page }) => {
    console.log('Navigating to Quiz page...');
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });

    // Wait a bit for any animations or data loading
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-quiz-page-initial.png'),
      fullPage: true
    });

    console.log('Screenshot saved: 01-quiz-page-initial.png');

    // Get page title
    const title = await page.title();
    console.log('Page Title:', title);
  });

  test('QUI-002: Check for Quiz Banner and OX Questions', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for quiz banner text
    const bannerText = await page.locator('text=/퀴즈|나의 지식 수준|1분 퀴즈/i').first().textContent().catch(() => null);
    console.log('Quiz Banner Text:', bannerText);

    // Look for OX or True/False questions
    const oxButtons = await page.locator('button:has-text("O"), button:has-text("X"), button:has-text("True"), button:has-text("False")').count();
    console.log('OX/True-False buttons found:', oxButtons);

    // Look for question elements
    const questions = await page.locator('[class*="question"], [data-testid*="question"]').count();
    console.log('Question elements found:', questions);

    // Take screenshot showing quiz questions
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-quiz-questions.png'),
      fullPage: true
    });
  });

  test('QUI-003: Check for Progress Indicators', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for progress indicators
    const progressBars = await page.locator('[role="progressbar"], .progress, [class*="progress"]').count();
    console.log('Progress bars found:', progressBars);

    // Look for question counters (e.g., "1/5", "Question 1 of 5")
    const questionCounter = await page.locator('text=/\\d+\\/\\d+|Question \\d+ of \\d+/i').first().textContent().catch(() => null);
    console.log('Question Counter:', questionCounter);

    // Look for percentage indicators
    const percentages = await page.locator('text=/%/').count();
    console.log('Percentage indicators found:', percentages);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-progress-indicators.png'),
      fullPage: true
    });
  });

  test('QUI-004: Check for Point and Level Display', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for points display
    const pointsText = await page.locator('text=/\\d+P|포인트|Points?/i').first().textContent().catch(() => null);
    console.log('Points Display:', pointsText);

    // Look for level display
    const levelText = await page.locator('text=/레벨|Level|L[0-9]/i').first().textContent().catch(() => null);
    console.log('Level Display:', levelText);

    // Look for token display
    const tokenText = await page.locator('text=/\\d+토큰|Token/i').first().textContent().catch(() => null);
    console.log('Token Display:', tokenText);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-points-level-display.png'),
      fullPage: true
    });
  });

  test('QUI-005: Test Quiz Navigation and Interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take initial state screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-before-interaction.png'),
      fullPage: true
    });

    // Try to find and click an O/X button
    const oButton = page.locator('button:has-text("O"), button:has-text("True")').first();
    const oButtonExists = await oButton.count() > 0;

    if (oButtonExists) {
      console.log('Found O/True button, clicking...');
      await oButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '06-after-o-click.png'),
        fullPage: true
      });
    }

    // Try to find X button
    const xButton = page.locator('button:has-text("X"), button:has-text("False")').first();
    const xButtonExists = await xButton.count() > 0;

    if (xButtonExists) {
      console.log('Found X/False button, clicking...');
      await xButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '07-after-x-click.png'),
        fullPage: true
      });
    }

    // Look for Next/Submit buttons
    const nextButton = page.locator('button:has-text("다음"), button:has-text("Next"), button:has-text("제출"), button:has-text("Submit")').first();
    const nextButtonExists = await nextButton.count() > 0;

    if (nextButtonExists) {
      const buttonText = await nextButton.textContent();
      console.log('Found navigation button:', buttonText);

      await nextButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '08-after-next-click.png'),
        fullPage: true
      });
    }
  });

  test('QUI-006: Check for Initial Quiz Banner (QUI-006)', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for "1분 퀴즈로 나의 지식 수준 확인하기" banner
    const initialQuizBanner = await page.locator('text=/1분 퀴즈|지식 수준 확인/i').count();
    console.log('Initial Quiz Banner found:', initialQuizBanner > 0);

    // Look for "5 questions" indicator
    const fiveQuestions = await page.locator('text=/5문제|5개|5 questions/i').count();
    console.log('5 Questions indicator found:', fiveQuestions > 0);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '09-qui-006-initial-quiz.png'),
      fullPage: true
    });
  });

  test('QUI-007: Check for Daily Quiz Card (QUI-007)', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for "오늘의 퀴즈" card
    const dailyQuizCard = await page.locator('text=/오늘의 퀴즈|Daily Quiz/i').count();
    console.log('Daily Quiz Card found:', dailyQuizCard > 0);

    // Look for +10P reward indicator
    const rewardIndicator = await page.locator('text=/\\+10P|10 포인트/i').count();
    console.log('+10P reward indicator found:', rewardIndicator > 0);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '10-qui-007-daily-quiz.png'),
      fullPage: true
    });
  });

  test('QUI-008: Check for Gamification Elements (QUI-008)', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for point system indicators
    const pointsSystem = {
      quiz: await page.locator('text=/\\+10P.*퀴즈/i').count(),
      post: await page.locator('text=/\\+5P.*글/i').count(),
      comment: await page.locator('text=/\\+2P.*댓글/i').count(),
      survey: await page.locator('text=/\\+20P.*설문/i').count(),
      attendance: await page.locator('text=/\\+3P.*출석/i').count()
    };

    console.log('Gamification Points System:', pointsSystem);

    // Look for level up information
    const levelUpInfo = await page.locator('text=/100P.*L2|300P.*L3|600P.*L4/i').count();
    console.log('Level up information found:', levelUpInfo > 0);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '11-qui-008-gamification.png'),
      fullPage: true
    });
  });

  test('QUI-009: Check for Token Conversion (QUI-009)', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for token conversion information
    const tokenConversion = await page.locator('text=/100P.*100.*토큰|100 points.*100 tokens/i').count();
    console.log('Token conversion info found:', tokenConversion > 0);

    // Look for premium features mention
    const premiumFeatures = await page.locator('text=/프리미엄|Premium/i').count();
    console.log('Premium features mention found:', premiumFeatures > 0);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '12-qui-009-token-conversion.png'),
      fullPage: true
    });
  });

  test('QUI-010: Inspect Page HTML Structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Get page HTML structure
    const bodyHTML = await page.locator('body').innerHTML();

    // Save HTML to file for inspection
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'page-structure.html'),
      bodyHTML,
      'utf8'
    );

    console.log('Page HTML structure saved to page-structure.html');

    // Get all text content
    const allText = await page.locator('body').textContent();
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'page-text-content.txt'),
      allText || '',
      'utf8'
    );

    console.log('Page text content saved to page-text-content.txt');
  });

  test('QUI-011: Test Different Quiz Routes', async ({ page }) => {
    const routes = [
      '/quiz',
      '/quiz-page',
      '/initial-quiz',
      '/daily-quiz'
    ];

    for (const route of routes) {
      console.log(`Testing route: ${route}`);
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 5000 });
        await page.waitForTimeout(1000);

        const routeName = route.replace(/\//g, '-').substring(1) || 'root';
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, `13-route-${routeName}.png`),
          fullPage: true
        });

        const title = await page.title();
        console.log(`Route ${route} - Title: ${title}`);
      } catch (error) {
        console.log(`Route ${route} - Not found or error:`, error.message);
      }
    }
  });

  test('QUI-012: Check Navigation from Main Page', async ({ page }) => {
    // Start from main page
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '14-main-page.png'),
      fullPage: true
    });

    // Look for quiz navigation links
    const quizLinks = await page.locator('a[href*="quiz"], button:has-text("퀴즈"), button:has-text("Quiz")').count();
    console.log('Quiz navigation links found on main page:', quizLinks);

    // Try to click quiz link if found
    const quizLink = page.locator('a[href*="quiz"], button:has-text("퀴즈")').first();
    if (await quizLink.count() > 0) {
      await quizLink.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '15-after-quiz-link-click.png'),
        fullPage: true
      });

      console.log('Navigated to quiz from main page');
    }
  });
});
