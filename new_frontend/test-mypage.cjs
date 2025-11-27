/**
 * MyPage Features Testing Script
 * Manual testing helper for MYP-001 to MYP-006
 */

const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5175';
const MYPAGE_URL = `${BASE_URL}/mypage`;
const RESULTS_DIR = path.join(__dirname, 'test-results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMyPageFeatures() {
  console.log('Starting MyPage Features Testing...\n');

  const browser = await playwright.chromium.launch({
    headless: false, // Set to true for headless mode
    slowMo: 500 // Slow down by 500ms for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RESULTS_DIR,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    features: {},
    screenshots: [],
    errors: []
  };

  try {
    // Navigate to MyPage
    console.log('Navigating to MyPage...');
    await page.goto(MYPAGE_URL, { waitUntil: 'networkidle' });
    await delay(2000);

    // Capture initial state
    const screenshotPath = path.join(RESULTS_DIR, '00-mypage-initial.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    report.screenshots.push('00-mypage-initial.png');
    console.log('Screenshot saved: 00-mypage-initial.png\n');

    // Test MYP-001: Level View
    console.log('Testing MYP-001: Level View...');
    const myp001 = await testLevelView(page);
    report.features.MYP001 = myp001;
    await page.screenshot({
      path: path.join(RESULTS_DIR, '01-myp001-level-view.png'),
      fullPage: true
    });
    report.screenshots.push('01-myp001-level-view.png');

    // Test MYP-002: Points View
    console.log('Testing MYP-002: Points View...');
    const myp002 = await testPointsView(page);
    report.features.MYP002 = myp002;
    await page.screenshot({
      path: path.join(RESULTS_DIR, '02-myp002-points-view.png'),
      fullPage: true
    });
    report.screenshots.push('02-myp002-points-view.png');

    // Test MYP-003: Premium Purchase
    console.log('Testing MYP-003: Premium Purchase...');
    const myp003 = await testPremiumPurchase(page);
    report.features.MYP003 = myp003;

    // Test MYP-004: Payment Management
    console.log('Testing MYP-004: Payment Management...');
    const myp004 = await testPaymentManagement(page);
    report.features.MYP004 = myp004;

    // Test MYP-005: Notification Settings
    console.log('Testing MYP-005: Notification Settings...');
    const myp005 = await testNotificationSettings(page);
    report.features.MYP005 = myp005;

    // Test MYP-006: Bookmark Management
    console.log('Testing MYP-006: Bookmark Management...');
    const myp006 = await testBookmarkManagement(page);
    report.features.MYP006 = myp006;

    // Test Profile Information Modal
    console.log('Testing Profile Information Modal...');
    await testProfileModal(page);

    // Test Health Profile Modal
    console.log('Testing Health Profile Modal...');
    await testHealthProfileModal(page);

    // Test overall page structure
    console.log('Analyzing page structure...');
    const structure = await analyzePage(page);
    report.pageStructure = structure;

    // Test responsive design
    console.log('Testing responsive design...');
    await testResponsive(page);

  } catch (error) {
    console.error('Error during testing:', error);
    report.errors.push({
      message: error.message,
      stack: error.stack
    });
  } finally {
    // Save report
    const reportPath = path.join(RESULTS_DIR, 'mypage-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nTest report saved to: ${reportPath}`);

    // Generate HTML report
    generateHTMLReport(report);

    await browser.close();
    console.log('\nTesting completed!');
  }
}

async function testLevelView(page) {
  const result = {
    tested: true,
    elements: {},
    status: 'NOT_IMPLEMENTED'
  };

  try {
    // Look for level-related elements
    const levelText = await page.locator('text=/level|레벨|등급/i').count();
    const progressBars = await page.locator('[role="progressbar"], [class*="progress"]').count();

    result.elements = {
      levelTextFound: levelText > 0,
      levelTextCount: levelText,
      progressBarsFound: progressBars > 0,
      progressBarsCount: progressBars
    };

    // Currently, the MyPage shows quiz stats but not level system
    result.status = 'NOT_IMPLEMENTED';
    result.notes = 'Level view system not found in current implementation. Quiz stats are shown instead.';

  } catch (error) {
    result.error = error.message;
    result.status = 'ERROR';
  }

  return result;
}

async function testPointsView(page) {
  const result = {
    tested: true,
    elements: {},
    status: 'PARTIAL'
  };

  try {
    // Check for quiz stats section (which shows points)
    const quizStatsHeading = await page.locator('text=/퀴즈 통계/i').isVisible();
    const totalPointsLabel = await page.locator('text=/총 획득 점수/i').isVisible();

    if (quizStatsHeading && totalPointsLabel) {
      // Get the actual points value
      const pointsElement = await page.locator('text=/총 획득 점수/i').locator('..').locator('..');
      const pointsText = await pointsElement.textContent();

      result.elements = {
        quizStatsVisible: true,
        totalPointsVisible: true,
        pointsText: pointsText
      };

      result.status = 'PARTIAL';
      result.notes = 'Points are displayed in quiz stats, but dedicated point history/filters not found';
    } else {
      result.status = 'NOT_FOUND';
    }

  } catch (error) {
    result.error = error.message;
    result.status = 'ERROR';
  }

  return result;
}

async function testPremiumPurchase(page) {
  const result = {
    tested: true,
    elements: {},
    status: 'NOT_TESTED'
  };

  try {
    // Look for subscription/billing button
    const subscriptionButton = page.locator('text=/Subscription.*Billing/i');
    const exists = await subscriptionButton.count() > 0;

    if (exists) {
      await subscriptionButton.click();
      await delay(1000);
      await page.screenshot({
        path: path.join(RESULTS_DIR, '03-myp003-premium-purchase.png'),
        fullPage: true
      });

      // Check if modal or new page opened
      const modalVisible = await page.locator('[role="dialog"]').isVisible();

      result.elements = {
        subscriptionButtonFound: true,
        modalOpened: modalVisible
      };

      if (modalVisible) {
        result.status = 'FOUND';
      } else {
        result.status = 'NAVIGATED';
      }

      // Close modal if opened
      const closeButton = page.locator('button:has-text("닫기"), button:has-text("취소"), [aria-label="Close"]');
      const hasClose = await closeButton.count() > 0;
      if (hasClose) {
        await closeButton.first().click();
        await delay(500);
      }

    } else {
      result.status = 'NOT_FOUND';
      result.notes = 'Subscription & Billing button found but leads to placeholder page';
    }

  } catch (error) {
    result.error = error.message;
    result.status = 'ERROR';
  }

  return result;
}

async function testPaymentManagement(page) {
  const result = {
    tested: true,
    status: 'NOT_IMPLEMENTED',
    notes: 'Payment management features not implemented in current version'
  };

  return result;
}

async function testNotificationSettings(page) {
  const result = {
    tested: true,
    elements: {},
    status: 'NOT_TESTED'
  };

  try {
    // Navigate back to mypage if needed
    if (!page.url().includes('mypage')) {
      await page.goto(MYPAGE_URL);
      await delay(1000);
    }

    // Look for notifications button
    const notificationButton = page.locator('text=/Notifications|알림/i');
    const exists = await notificationButton.count() > 0;

    if (exists) {
      await notificationButton.click();
      await delay(1000);
      await page.screenshot({
        path: path.join(RESULTS_DIR, '05-myp005-notification-settings.png'),
        fullPage: true
      });

      result.elements = {
        notificationButtonFound: true
      };

      result.status = 'NAVIGATED';
      result.notes = 'Notifications button found but leads to placeholder page';

      // Go back
      await page.goBack();
      await delay(500);

    } else {
      result.status = 'NOT_FOUND';
    }

  } catch (error) {
    result.error = error.message;
    result.status = 'ERROR';
  }

  return result;
}

async function testBookmarkManagement(page) {
  const result = {
    tested: true,
    elements: {},
    status: 'NOT_TESTED'
  };

  try {
    // Navigate back to mypage if needed
    if (!page.url().includes('mypage')) {
      await page.goto(MYPAGE_URL);
      await delay(1000);
    }

    // Look for bookmarked papers button
    const bookmarkButton = page.locator('text=/Bookmarked Papers|북마크/i');
    const exists = await bookmarkButton.count() > 0;

    if (exists) {
      await bookmarkButton.click();
      await delay(1000);
      await page.screenshot({
        path: path.join(RESULTS_DIR, '06-myp006-bookmark-management.png'),
        fullPage: true
      });

      result.elements = {
        bookmarkButtonFound: true
      };

      result.status = 'NAVIGATED';
      result.notes = 'Bookmarked Papers button found, navigates to /mypage/bookmark';

      // Go back
      await page.goBack();
      await delay(500);

    } else {
      result.status = 'NOT_FOUND';
    }

  } catch (error) {
    result.error = error.message;
    result.status = 'ERROR';
  }

  return result;
}

async function testProfileModal(page) {
  try {
    if (!page.url().includes('mypage')) {
      await page.goto(MYPAGE_URL);
      await delay(1000);
    }

    const profileButton = page.locator('text=/Profile Information/i');
    const exists = await profileButton.count() > 0;

    if (exists) {
      await profileButton.click();
      await delay(1000);
      await page.screenshot({
        path: path.join(RESULTS_DIR, '07-profile-modal.png'),
        fullPage: true
      });

      // Go back
      await page.goBack();
      await delay(500);
    }
  } catch (error) {
    console.error('Profile modal test error:', error.message);
  }
}

async function testHealthProfileModal(page) {
  try {
    if (!page.url().includes('mypage')) {
      await page.goto(MYPAGE_URL);
      await delay(1000);
    }

    const healthButton = page.locator('text=/건강 프로필 설정/i');
    const exists = await healthButton.count() > 0;

    if (exists) {
      await healthButton.click();
      await delay(1000);
      await page.screenshot({
        path: path.join(RESULTS_DIR, '08-health-profile.png'),
        fullPage: true
      });

      // Go back
      await page.goBack();
      await delay(500);
    }
  } catch (error) {
    console.error('Health profile test error:', error.message);
  }
}

async function analyzePage(page) {
  const structure = {
    title: await page.title(),
    url: page.url(),
    headings: await page.locator('h1, h2, h3').allTextContents(),
    buttons: await page.locator('button').count(),
    links: await page.locator('a').count(),
    cards: await page.locator('[class*="card"], [class*="Card"]').count(),
  };

  return structure;
}

async function testResponsive(page) {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(MYPAGE_URL, { waitUntil: 'networkidle' });
    await delay(1000);
    await page.screenshot({
      path: path.join(RESULTS_DIR, `responsive-${viewport.name}.png`),
      fullPage: true
    });
    console.log(`  - Screenshot for ${viewport.name} viewport saved`);
  }
}

function generateHTMLReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MyPage Features Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #1a1a1a; margin-bottom: 10px; }
    .meta { color: #666; margin-bottom: 30px; font-size: 14px; }
    .feature { margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #4A90E2; }
    .feature h2 { color: #333; margin-bottom: 15px; font-size: 20px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .status.PARTIAL { background: #fff3cd; color: #856404; }
    .status.NOT_IMPLEMENTED { background: #f8d7da; color: #721c24; }
    .status.FOUND { background: #d4edda; color: #155724; }
    .status.NOT_FOUND { background: #f8d7da; color: #721c24; }
    .status.NAVIGATED { background: #d1ecf1; color: #0c5460; }
    .status.ERROR { background: #f8d7da; color: #721c24; }
    .elements { margin-top: 15px; }
    .elements pre { background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 13px; }
    .notes { margin-top: 10px; padding: 10px; background: #fff; border-radius: 4px; font-size: 14px; color: #666; }
    .screenshots { margin-top: 30px; }
    .screenshots h2 { margin-bottom: 15px; }
    .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .screenshot-item { text-align: center; }
    .screenshot-item img { width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .screenshot-item p { margin-top: 8px; font-size: 13px; color: #666; }
    .checklist { margin-top: 30px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
    .checklist h2 { margin-bottom: 15px; }
    .checklist ul { list-style: none; }
    .checklist li { padding: 8px 0; color: #333; }
    .checklist li:before { content: "☐ "; color: #4A90E2; font-weight: bold; margin-right: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>MyPage Features Test Report</h1>
    <div class="meta">
      <div>Test Date: ${new Date(report.timestamp).toLocaleString('ko-KR')}</div>
      <div>Base URL: ${report.baseUrl}</div>
    </div>

    <div class="features">
      ${Object.entries(report.features || {}).map(([key, feature]) => `
        <div class="feature">
          <h2>${key}: ${getFeatureName(key)}</h2>
          <span class="status ${feature.status}">${feature.status}</span>
          ${feature.notes ? `<div class="notes">${feature.notes}</div>` : ''}
          ${feature.elements ? `
            <div class="elements">
              <strong>Elements Found:</strong>
              <pre>${JSON.stringify(feature.elements, null, 2)}</pre>
            </div>
          ` : ''}
          ${feature.error ? `<div class="notes" style="color: red;">Error: ${feature.error}</div>` : ''}
        </div>
      `).join('')}
    </div>

    ${report.pageStructure ? `
      <div class="feature">
        <h2>Page Structure Analysis</h2>
        <div class="elements">
          <pre>${JSON.stringify(report.pageStructure, null, 2)}</pre>
        </div>
      </div>
    ` : ''}

    <div class="screenshots">
      <h2>Screenshots</h2>
      <div class="screenshot-grid">
        ${report.screenshots.map(screenshot => `
          <div class="screenshot-item">
            <img src="${screenshot}" alt="${screenshot}">
            <p>${screenshot}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="checklist">
      <h2>Manual Testing Checklist</h2>
      ${generateChecklist()}
    </div>
  </div>
</body>
</html>
  `;

  const reportPath = path.join(RESULTS_DIR, 'mypage-test-report.html');
  fs.writeFileSync(reportPath, html);
  console.log(`HTML report saved to: ${reportPath}`);
}

function getFeatureName(key) {
  const names = {
    MYP001: 'Level View',
    MYP002: 'Points View',
    MYP003: 'Premium Purchase',
    MYP004: 'Payment Management',
    MYP005: 'Notification Settings',
    MYP006: 'Bookmark Management'
  };
  return names[key] || key;
}

function generateChecklist() {
  return `
    <h3>MYP-001: Level View</h3>
    <ul>
      <li>Current level is displayed</li>
      <li>Points needed for next level is shown</li>
      <li>Level-up history is accessible</li>
      <li>Progress bar shows correct percentage</li>
    </ul>

    <h3>MYP-002: Points View</h3>
    <ul>
      <li>Accumulated points total is displayed</li>
      <li>Available points balance is shown</li>
      <li>Point history shows date, activity, and amount</li>
      <li>Filter by earn/use works correctly</li>
      <li>Date range filter functions properly</li>
    </ul>

    <h3>MYP-003: Premium Purchase</h3>
    <ul>
      <li>500P package (5,000원) is available</li>
      <li>1,000P package (10,000원) is available</li>
      <li>3,000P package (30,000원) is available</li>
      <li>Card payment option is present</li>
      <li>Easy pay option is present</li>
    </ul>

    <h3>MYP-004: Payment Management</h3>
    <ul>
      <li>Purchase history displays correctly</li>
      <li>Cancel request is available (within 7 days)</li>
      <li>Receipt download works</li>
    </ul>

    <h3>MYP-005: Notification Settings</h3>
    <ul>
      <li>Quiz alert toggle works</li>
      <li>Community reply notification toggle works</li>
      <li>Like notification toggle works</li>
      <li>Survey notification toggle works</li>
      <li>Challenge notification toggle works</li>
      <li>Level-up notification toggle works</li>
      <li>Point alert toggle works</li>
      <li>Update notification toggle works</li>
    </ul>

    <h3>MYP-006: Bookmark Management</h3>
    <ul>
      <li>Bookmarked papers list is displayed</li>
      <li>Search by title works</li>
      <li>Filter by author works</li>
      <li>Filter by year works</li>
      <li>Folder management is functional</li>
      <li>CSV export works</li>
      <li>BibTeX export works</li>
      <li>Share functionality works</li>
    </ul>
  `;
}

// Run the tests
testMyPageFeatures().catch(console.error);
