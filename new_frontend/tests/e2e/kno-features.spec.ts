/**
 * KNO Features Testing Suite
 * Tests KNO-001 through KNO-008 features
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5175';
const TRENDS_URL = `${BASE_URL}/trends`;
const SCREENSHOT_DIR = path.join(__dirname, '../../test-results/kno-screenshots');

// Helper function to take screenshots
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true
  });
  console.log(`Screenshot saved: ${name}.png`);
}

// Helper function to wait for network idle
async function waitForNetworkIdle(page: Page) {
  await page.waitForLoadState('networkidle');
}

test.describe('KNO Features - Knowledge/PubMed Research Testing', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to trends page before each test
    await page.goto(TRENDS_URL);
    await waitForNetworkIdle(page);
  });

  test('KNO-001: PubMed Search - Initial Page Load', async ({ page }) => {
    console.log('Testing KNO-001: PubMed Search functionality');

    // Take screenshot of initial page
    await takeScreenshot(page, 'kno-001-initial-page');

    // Check if search input exists
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    // Check for search button
    const searchButton = page.locator('button[type="submit"]');
    await expect(searchButton).toBeVisible();

    console.log('✓ Search input and button found');
  });

  test('KNO-001 & KNO-002: Search and Display Papers', async ({ page }) => {
    console.log('Testing KNO-001 & KNO-002: Search and paper parsing');

    // Enter search query
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('chronic kidney disease nutrition');

    await takeScreenshot(page, 'kno-001-search-input');

    // Submit search
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for next step (analysis selector)
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'kno-001-analysis-selection');

    // Check for analysis options
    const analysisOptions = page.locator('button').filter({ hasText: /시간대별|Temporal/i });
    if (await analysisOptions.count() > 0) {
      await analysisOptions.first().click();
      console.log('✓ Analysis type selected');

      // Wait for results
      await page.waitForTimeout(5000);
      await takeScreenshot(page, 'kno-002-paper-results');

      // KNO-002: Check for paper metadata
      const paperCards = page.locator('[class*="border"]').filter({ hasText: /PMID|DOI|Authors/i });
      const paperCount = await paperCards.count();
      console.log(`✓ Found ${paperCount} paper cards`);

      // Check for required paper fields
      const hasPMID = await page.locator('text=/PMID|pmid/i').count() > 0;
      const hasDOI = await page.locator('text=/DOI|doi/i').count() > 0;
      const hasAuthors = await page.locator('text=/author/i').count() > 0;

      console.log(`Paper metadata check:`);
      console.log(`  - PMID: ${hasPMID ? '✓' : '✗'}`);
      console.log(`  - DOI: ${hasDOI ? '✓' : '✗'}`);
      console.log(`  - Authors: ${hasAuthors ? '✓' : '✗'}`);
    }
  });

  test('KNO-003: RAG Summarization', async ({ page }) => {
    console.log('Testing KNO-003: RAG Summarization');

    // Perform search first
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('diabetes mellitus');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForTimeout(2000);

    // Select temporal analysis
    const temporalButton = page.locator('button').filter({ hasText: /시간대별|Temporal/i }).first();
    if (await temporalButton.isVisible()) {
      await temporalButton.click();
      await page.waitForTimeout(5000);

      // Look for summarization button
      const summaryButton = page.locator('button').filter({ hasText: /요약|Summary|AI/i });
      if (await summaryButton.count() > 0) {
        await takeScreenshot(page, 'kno-003-before-summary');
        await summaryButton.first().click();

        await page.waitForTimeout(3000);
        await takeScreenshot(page, 'kno-003-after-summary');

        console.log('✓ Summary button found and clicked');
      } else {
        console.log('✗ Summary button not found');
      }
    }
  });

  test('KNO-004: Bookmarking Functionality', async ({ page }) => {
    console.log('Testing KNO-004: Bookmark functionality');

    // Check for bookmark icons (⭐ or bookmark-related elements)
    const bookmarkIcons = page.locator('[class*="bookmark"]').or(page.locator('text=⭐'));
    const bookmarkCount = await bookmarkIcons.count();

    console.log(`Bookmark icons found: ${bookmarkCount}`);

    if (bookmarkCount > 0) {
      await takeScreenshot(page, 'kno-004-bookmark-ui');
      console.log('✓ Bookmark UI elements exist');
    } else {
      console.log('✗ Bookmark UI not implemented yet');
    }

    await takeScreenshot(page, 'kno-004-page-state');
  });

  test('KNO-005: Paper Comparison UI', async ({ page }) => {
    console.log('Testing KNO-005: Paper comparison functionality');

    // Look for comparison-related UI elements
    const comparisonElements = page.locator('text=/비교|compare|comparison/i');
    const hasComparison = await comparisonElements.count() > 0;

    console.log(`Comparison UI elements: ${hasComparison ? 'Found' : 'Not found'}`);

    await takeScreenshot(page, 'kno-005-comparison-ui');

    // Check for multi-select or checkbox elements
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    console.log(`Checkboxes for selection: ${checkboxCount}`);
  });

  test('KNO-006: Search Limits UI', async ({ page }) => {
    console.log('Testing KNO-006: Search limits indication');

    // Look for search limit indicators
    const limitIndicators = page.locator('text=/limit|제한|10 searches|100P/i');
    const hasLimits = await limitIndicators.count() > 0;

    console.log(`Search limit indicators: ${hasLimits ? 'Found' : 'Not found'}`);

    await takeScreenshot(page, 'kno-006-search-limits');
  });

  test('KNO-007: Trend Visualization - Chart Display', async ({ page }) => {
    console.log('Testing KNO-007: Trend visualization with charts');

    // Perform search and trigger analysis
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('machine learning');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForTimeout(2000);

    // Select temporal analysis
    const temporalButton = page.locator('button').filter({ hasText: /시간대별|Temporal/i }).first();
    if (await temporalButton.isVisible()) {
      await temporalButton.click();
      await page.waitForTimeout(5000);

      // Look for chart elements (canvas elements from Chart.js)
      const chartCanvas = page.locator('canvas');
      const chartCount = await chartCanvas.count();

      console.log(`Charts found: ${chartCount}`);

      if (chartCount > 0) {
        await takeScreenshot(page, 'kno-007-trend-chart');
        console.log('✓ Trend visualization chart displayed');
      } else {
        console.log('✗ Chart not found');
        await takeScreenshot(page, 'kno-007-no-chart');
      }
    }
  });

  test('KNO-008: Research Dashboard Elements', async ({ page }) => {
    console.log('Testing KNO-008: Research dashboard elements');

    await takeScreenshot(page, 'kno-008-dashboard-initial');

    // Look for dashboard elements like stats, metrics, etc.
    const statsElements = page.locator('text=/월간|yearly|monthly|citations|institutions/i');
    const hasStats = await statsElements.count() > 0;

    console.log(`Dashboard statistics: ${hasStats ? 'Found' : 'Not found'}`);

    // Check for data visualization elements
    const visualElements = page.locator('canvas, svg[class*="chart"]');
    const visualCount = await visualElements.count();
    console.log(`Visualization elements: ${visualCount}`);

    await takeScreenshot(page, 'kno-008-dashboard-final');
  });

  test('Complete User Flow: Search → Analyze → View Papers', async ({ page }) => {
    console.log('Testing complete user flow');

    // Step 1: Initial state
    await takeScreenshot(page, 'flow-01-initial');

    // Step 2: Enter search query
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('chronic kidney disease nutrition');
    await takeScreenshot(page, 'flow-02-query-entered');

    // Step 3: Submit search
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'flow-03-analysis-selection');

    // Step 4: Select analysis type
    const analysisButtons = page.locator('button').filter({ hasText: /시간대별|Temporal|지역별|Geographic|MeSH|키워드/i });
    const analysisCount = await analysisButtons.count();
    console.log(`Analysis options available: ${analysisCount}`);

    if (analysisCount > 0) {
      await analysisButtons.first().click();
      await page.waitForTimeout(5000);
      await takeScreenshot(page, 'flow-04-results-loading');

      await page.waitForTimeout(3000);
      await takeScreenshot(page, 'flow-05-results-displayed');

      // Check for various result components
      const hasChart = await page.locator('canvas').count() > 0;
      const hasPapers = await page.locator('text=/관련 논문|Related Papers/i').count() > 0;
      const hasExplanation = await page.locator('text=/분석 결과|Analysis Results/i').count() > 0;

      console.log('\nResults check:');
      console.log(`  - Chart: ${hasChart ? '✓' : '✗'}`);
      console.log(`  - Papers: ${hasPapers ? '✓' : '✗'}`);
      console.log(`  - Explanation: ${hasExplanation ? '✓' : '✗'}`);
    }
  });

  test('Advanced Features: Multi-keyword Comparison', async ({ page }) => {
    console.log('Testing multi-keyword comparison');

    // Click advanced options
    const advancedToggle = page.locator('button').filter({ hasText: /고급|Advanced/i });
    if (await advancedToggle.count() > 0) {
      await advancedToggle.first().click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'advanced-01-options-expanded');

      // Add multiple keywords
      const keywordInput = page.locator('input[placeholder*="키워드"]').or(
        page.locator('input[placeholder*="keyword"]')
      );

      if (await keywordInput.count() > 0) {
        await keywordInput.first().fill('diabetes');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        await keywordInput.first().fill('hypertension');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        await takeScreenshot(page, 'advanced-02-keywords-added');
        console.log('✓ Multiple keywords added');
      }
    }
  });

  test('UI Components Inventory', async ({ page }) => {
    console.log('Taking inventory of all UI components');

    await takeScreenshot(page, 'inventory-01-initial');

    // Check for all major UI components
    const components = {
      searchInput: await page.locator('input[type="text"]').count(),
      buttons: await page.locator('button').count(),
      forms: await page.locator('form').count(),
      headings: await page.locator('h1, h2, h3').count(),
      links: await page.locator('a').count(),
    };

    console.log('\nUI Components Inventory:');
    console.log(`  - Search inputs: ${components.searchInput}`);
    console.log(`  - Buttons: ${components.buttons}`);
    console.log(`  - Forms: ${components.forms}`);
    console.log(`  - Headings: ${components.headings}`);
    console.log(`  - Links: ${components.links}`);

    // Get all text content for analysis
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('\nPage Headings:');
    headings.forEach((h, i) => console.log(`  ${i + 1}. ${h.trim()}`));
  });
});
