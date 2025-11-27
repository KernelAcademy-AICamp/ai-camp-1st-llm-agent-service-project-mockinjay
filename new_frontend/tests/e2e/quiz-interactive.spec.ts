import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:5175';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'quiz-interactive-screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

test.describe('QUI Interactive Quiz Testing', () => {
  test('Complete Easy Quiz Flow', async ({ page }) => {
    console.log('Starting interactive quiz test...');

    // Navigate to quiz page
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-quiz-start-screen.png'),
      fullPage: true
    });

    console.log('Looking for difficulty buttons...');

    // Click on Easy difficulty button
    const easyButton = page.locator('button', { hasText: '쉬움' }).or(page.locator('button', { hasText: 'Easy' }));
    const easyButtonVisible = await easyButton.isVisible().catch(() => false);

    if (easyButtonVisible) {
      console.log('Found Easy button, clicking...');
      await easyButton.click();
      await page.waitForTimeout(3000); // Wait for quiz to load

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02-after-easy-click.png'),
        fullPage: true
      });

      // Look for quiz question
      const questionVisible = await page.locator('text=/문제|Question/i').isVisible().catch(() => false);
      console.log('Question visible:', questionVisible);

      if (questionVisible) {
        // Answer 5 questions
        for (let i = 0; i < 5; i++) {
          console.log(`Answering question ${i + 1}/5...`);

          // Take screenshot of current question
          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, `03-question-${i + 1}.png`),
            fullPage: true
          });

          // Click O button (true)
          const oButton = page.locator('button:has-text("O")').first();
          const oButtonExists = await oButton.count() > 0;

          if (oButtonExists) {
            await oButton.click();
            await page.waitForTimeout(500);

            await page.screenshot({
              path: path.join(SCREENSHOTS_DIR, `04-question-${i + 1}-answered.png`),
              fullPage: true
            });

            // Submit answer
            const submitButton = page.locator('button', { hasText: '답안 제출' }).or(page.locator('button', { hasText: 'Submit Answer' }));
            const submitExists = await submitButton.count() > 0;

            if (submitExists) {
              await submitButton.click();
              await page.waitForTimeout(2000);

              await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, `05-question-${i + 1}-result.png`),
                fullPage: true
              });

              // Check for result text
              const correctText = await page.locator('text=/정답|Correct/i').textContent().catch(() => null);
              const incorrectText = await page.locator('text=/틀렸습니다|Incorrect/i').textContent().catch(() => null);
              console.log(`Question ${i + 1} result:`, correctText || incorrectText);

              // Click Next Question or View Results
              const nextButton = page.locator('button', { hasText: '다음 문제' }).or(page.locator('button', { hasText: 'Next Question' }));
              const resultsButton = page.locator('button', { hasText: '결과 보기' }).or(page.locator('button', { hasText: 'View Results' }));

              const nextExists = await nextButton.count() > 0;
              const resultsExists = await resultsButton.count() > 0;

              if (nextExists) {
                console.log('Clicking Next Question...');
                await nextButton.click();
                await page.waitForTimeout(1500);
              } else if (resultsExists) {
                console.log('Quiz complete! Clicking View Results...');
                await resultsButton.click();
                await page.waitForTimeout(2000);

                await page.screenshot({
                  path: path.join(SCREENSHOTS_DIR, '06-completion-page.png'),
                  fullPage: true
                });
                break;
              } else {
                // Auto-redirect to completion page
                console.log('Waiting for auto-redirect to completion page...');
                await page.waitForTimeout(3000);

                await page.screenshot({
                  path: path.join(SCREENSHOTS_DIR, '06-completion-page-auto.png'),
                  fullPage: true
                });
                break;
              }
            }
          }
        }
      }
    } else {
      console.log('Easy button not found');
    }

    // Check final URL
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);

    // Take final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '07-final-state.png'),
      fullPage: true
    });
  });

  test('Check Quiz Completion Page Features', async ({ page }) => {
    // Navigate directly to completion page with mock state
    await page.goto(`${BASE_URL}/quiz/completion`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '08-completion-page-direct.png'),
      fullPage: true
    });

    // Look for completion elements
    const completionElements = {
      score: await page.locator('text=/점수|Score/i').count(),
      points: await page.locator('text=/\\d+P|포인트|Points/i').count(),
      level: await page.locator('text=/레벨|Level/i').count(),
      retry: await page.locator('button', { hasText: '다시 하기' }).or(page.locator('button', { hasText: 'Retry' })).count(),
      home: await page.locator('button', { hasText: '홈으로' }).or(page.locator('button', { hasText: 'Home' })).count(),
    };

    console.log('Completion page elements:', completionElements);
  });

  test('Check Quiz List Page (QUI-007)', async ({ page }) => {
    // Navigate to quiz list page
    const routes = ['/quiz-list', '/quiz/list', '/quizzes'];

    for (const route of routes) {
      console.log(`Checking route: ${route}`);
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `09-route${route.replace(/\//g, '-')}.png`),
        fullPage: true
      });

      // Look for "오늘의 퀴즈" card
      const dailyQuizCard = await page.locator('text=/오늘의 퀴즈|Daily Quiz/i').count();
      console.log(`${route} - Daily Quiz Card found:`, dailyQuizCard > 0);
    }
  });

  test('Extract All Quiz Page Text Content', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Get all visible text
    const allText = await page.locator('body').innerText();
    console.log('=== Quiz Page Text Content ===');
    console.log(allText);
    console.log('=== End of Text Content ===');

    // Save to file
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'quiz-page-text.txt'),
      allText,
      'utf8'
    );

    // Get sidebar text specifically
    const sidebarText = await page.locator('[class*="sidebar"], nav, aside').innerText().catch(() => '');
    console.log('=== Sidebar Text ===');
    console.log(sidebarText);

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'sidebar-text.txt'),
      sidebarText,
      'utf8'
    );
  });
});
