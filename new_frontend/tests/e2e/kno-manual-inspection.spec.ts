/**
 * Manual KNO Features Inspection
 * Simple test to capture what's actually on the trends page
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, '../../test-results/kno-manual-screenshots');

test.describe('KNO Manual Inspection', () => {

  test('Capture trends page as it actually renders', async ({ page }) => {
    console.log('\n=== Starting Manual Inspection ===\n');

    // Navigate to trends page
    await page.goto('http://localhost:5175/trends');

    // Wait for React to fully load
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'manual-01-initial-load.png'),
      fullPage: true
    });

    // Get page HTML
    const html = await page.content();
    console.log('\n=== Page HTML Length:', html.length);

    // Get all visible text
    const bodyText = await page.locator('body').textContent();
    console.log('\n=== Body Text Content ===');
    console.log(bodyText?.substring(0, 500));

    // Check for specific elements
    console.log('\n=== Element Check ===');
    console.log('Inputs:', await page.locator('input').count());
    console.log('Buttons:', await page.locator('button').count());
    console.log('Forms:', await page.locator('form').count());
    console.log('H1:', await page.locator('h1').count());
    console.log('H2:', await page.locator('h2').count());
    console.log('H3:', await page.locator('h3').count());

    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4').allTextContents();
    console.log('\n=== All Headings ===');
    headings.forEach((h, i) => console.log(`${i + 1}. "${h.trim()}"`));

    // Check if we're redirected or have auth requirements
    const currentUrl = page.url();
    console.log('\n=== Current URL:', currentUrl);

    // Look for error messages
    const errorText = await page.locator('text=/error|오류|login|로그인/i').count();
    console.log('Error/Login indicators:', errorText);

    // Check for navigation elements
    const navLinks = await page.locator('nav a').count();
    console.log('Navigation links:', navLinks);

    // Take final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'manual-02-final-state.png'),
      fullPage: true
    });

    console.log('\n=== Manual Inspection Complete ===\n');
  });

  test('Navigate from main page to trends', async ({ page }) => {
    console.log('\n=== Testing Navigation Flow ===\n');

    // Start at main page
    await page.goto('http://localhost:5175/');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'nav-01-main-page.png'),
      fullPage: true
    });

    const mainUrl = page.url();
    console.log('Main page URL:', mainUrl);

    // Look for trends link
    const trendsLink = page.locator('a[href*="trends"], button:has-text("트렌드"), button:has-text("Trends")');
    const trendsCount = await trendsLink.count();
    console.log('Trends links found:', trendsCount);

    if (trendsCount > 0) {
      const linkText = await trendsLink.first().textContent();
      console.log('Found trends link:', linkText);

      await trendsLink.first().click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'nav-02-after-trends-click.png'),
        fullPage: true
      });

      console.log('After click URL:', page.url());
    } else {
      console.log('No trends navigation found');
    }

    // Check sidebar
    const sidebarLinks = await page.locator('nav a, aside a, [class*="sidebar"] a').allTextContents();
    console.log('\n=== Sidebar Links ===');
    sidebarLinks.forEach((link, i) => console.log(`${i + 1}. "${link.trim()}"`));
  });

  test('Check if AppContext or Auth is required', async ({ page }) => {
    console.log('\n=== Checking Auth Requirements ===\n');

    // Check for localStorage/sessionStorage usage
    await page.goto('http://localhost:5175/trends');
    await page.waitForTimeout(2000);

    // Check browser console for errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.reload();
    await page.waitForTimeout(2000);

    console.log('\n=== Console Messages ===');
    consoleLogs.slice(0, 20).forEach(log => console.log(log));

    // Check localStorage
    const localStorage = await page.evaluate(() => {
      return JSON.stringify(window.localStorage);
    });
    console.log('\n=== LocalStorage ===');
    console.log(localStorage);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'auth-check.png'),
      fullPage: true
    });
  });
});
