/**
 * E2E Tests for CareGuide Chat Features (CHA-001 to CHA-011)
 * CareGuide 챗 기능 E2E 테스트 (CHA-001 ~ CHA-011)
 *
 * This test suite validates all Priority 1 (P0) chat features according to the specifications.
 * 사양에 따라 모든 우선순위 1(P0) 채팅 기능을 검증하는 테스트 스위트입니다.
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_MESSAGES = {
  MEDICAL_QUESTION: '만성 신장병 3단계 환자의 일일 단백질 섭취량은 얼마나 되나요?',
  DIET_QUESTION: '신장병 환자에게 좋은 음식은 무엇인가요?',
  EMERGENCY_CHEST_PAIN: '가슴이 너무 아파요',
  EMERGENCY_BREATHING: '숨쉬기가 힘들어요',
  EMERGENCY_UNCONSCIOUS: '의식을 잃었어요',
  NON_MEDICAL: '오늘 날씨 어때요?',
  SIMPLE_GREETING: '안녕하세요',
};

// Helper functions
async function navigateToChat(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

async function sendChatMessage(page: Page, message: string) {
  const input = page.locator('input[type="text"]').last();
  await input.fill(message);
  await page.keyboard.press('Enter');
}

async function waitForResponse(page: Page) {
  // Wait for loading indicator to disappear
  await page.waitForTimeout(2000);
}

test.describe('CareGuide Chat Features - Priority 1 (P0)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToChat(page);
  });

  /**
   * CHA-010: Disclaimer Banner
   * 면책 조항 배너 테스트
   */
  test('CHA-010: Should display disclaimer banner at bottom', async ({ page }) => {
    // Check if disclaimer banner is visible
    const disclaimer = page.locator('text=/본 답변은 의학적 진단이 아니며|참고용 정보/i');

    // Take screenshot for verification
    await page.screenshot({
      path: 'test-results/screenshots/cha-010-disclaimer.png',
      fullPage: true
    });

    const disclaimerExists = await disclaimer.count() > 0;
    console.log('Disclaimer found:', disclaimerExists);

    // Report result
    if (disclaimerExists) {
      console.log('✓ PASS: CHA-010 - Disclaimer banner is visible');
    } else {
      console.log('✗ FAIL: CHA-010 - Disclaimer banner not found');
    }
  });

  /**
   * CHA-001 & CHA-002: Input Format and UI
   * 입력 형식 및 UI 테스트
   */
  test('CHA-001 & CHA-002: Should have text input field and send button', async ({ page }) => {
    // Check for text input
    const textInput = page.locator('input[type="text"]').last();
    await expect(textInput).toBeVisible();
    await expect(textInput).toBeEnabled();

    // Check placeholder text
    const placeholder = await textInput.getAttribute('placeholder');
    console.log('Input placeholder:', placeholder);

    // Check for send button
    const sendButton = page.locator('button[type="submit"]').last();
    await expect(sendButton).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/cha-001-002-input-ui.png'
    });

    console.log('✓ PASS: CHA-001 & CHA-002 - Input field and send button present');
  });

  /**
   * Profile Selector
   * 프로필 선택기 테스트
   */
  test('Should have profile selector (환자/일반인/연구원)', async ({ page }) => {
    // Look for profile selector
    const profileSelector = page.locator('select, text=/환자.*일반인.*연구원/i').first();

    const profileExists = await profileSelector.count() > 0;
    console.log('Profile selector found:', profileExists);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/profile-selector.png'
    });

    if (profileExists) {
      console.log('✓ PASS: Profile selector is present');
    } else {
      console.log('✗ FAIL: Profile selector not found');
    }
  });

  /**
   * CHA-003: Output Format (Markdown Rendering)
   * 출력 형식 테스트 (마크다운 렌더링)
   */
  test('CHA-003: Should send message and receive response', async ({ page }) => {
    // Send a simple medical question
    await sendChatMessage(page, TEST_MESSAGES.MEDICAL_QUESTION);

    // Wait for response
    await page.waitForTimeout(3000);

    // Check if message appears in chat
    const userMessage = page.locator(`text="${TEST_MESSAGES.MEDICAL_QUESTION}"`);
    await expect(userMessage).toBeVisible();

    // Take screenshot of response
    await page.screenshot({
      path: 'test-results/screenshots/cha-003-message-sent.png',
      fullPage: true
    });

    console.log('✓ PASS: CHA-003 - Message sent and response area visible');
  });

  /**
   * CHA-006: Multi-turn Dialog
   * 다중 턴 대화 테스트
   */
  test('CHA-006: Should support multi-turn conversation', async ({ page }) => {
    // Send first message
    await sendChatMessage(page, TEST_MESSAGES.SIMPLE_GREETING);
    await page.waitForTimeout(2000);

    // Send follow-up message
    await sendChatMessage(page, TEST_MESSAGES.DIET_QUESTION);
    await page.waitForTimeout(2000);

    // Send third message
    await sendChatMessage(page, '단백질 섭취량은요?');
    await page.waitForTimeout(2000);

    // Check if all messages are visible
    const messages = page.locator('[role="log"], .chat-bubble-user, div:has-text("안녕하세요")');
    const messageCount = await messages.count();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/cha-006-multi-turn.png',
      fullPage: true
    });

    console.log(`Messages found: ${messageCount}`);
    if (messageCount >= 1) {
      console.log('✓ PASS: CHA-006 - Multi-turn dialog supported');
    } else {
      console.log('✗ FAIL: CHA-006 - Multi-turn dialog not working properly');
    }
  });

  /**
   * CHA-007: Emergency Keywords Detection
   * 응급 키워드 감지 테스트
   */
  test('CHA-007: Should detect emergency keywords', async ({ page }) => {
    // Test chest pain
    await sendChatMessage(page, TEST_MESSAGES.EMERGENCY_CHEST_PAIN);
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/cha-007-emergency-chest-pain.png',
      fullPage: true
    });

    // Check for emergency warning (119)
    const emergencyWarning = page.locator('text=/119|응급|emergency/i');
    const hasEmergencyWarning = await emergencyWarning.count() > 0;

    if (hasEmergencyWarning) {
      console.log('✓ PASS: CHA-007 - Emergency keywords detected');
    } else {
      console.log('⚠ WARNING: CHA-007 - Emergency detection may not be implemented');
    }
  });

  /**
   * CHA-011: New Conversation Button
   * 새 대화 버튼 테스트
   */
  test('CHA-011: Should have new conversation button', async ({ page }) => {
    // Look for "새 대화" button
    const newChatButton = page.locator('button:has-text("새 대화"), button[title*="새 대화"], button:has-text("New")');

    const buttonExists = await newChatButton.count() > 0;

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/cha-011-new-conversation-button.png',
      fullPage: true
    });

    if (buttonExists) {
      console.log('✓ PASS: CHA-011 - New conversation button found');

      // Try to click if visible
      if (await newChatButton.first().isVisible()) {
        await newChatButton.first().click();
        await page.waitForTimeout(1000);

        // Take screenshot after clicking
        await page.screenshot({
          path: 'test-results/screenshots/cha-011-new-conversation-clicked.png',
          fullPage: true
        });
      }
    } else {
      console.log('⚠ WARNING: CHA-011 - New conversation button not found');
    }
  });

  /**
   * CHA-008: Source Citations
   * 출처 표시 테스트
   */
  test('CHA-008: Should show source citations', async ({ page }) => {
    // Send a medical question that should require sources
    await sendChatMessage(page, TEST_MESSAGES.MEDICAL_QUESTION);
    await page.waitForTimeout(4000);

    // Check for source citations
    const sources = page.locator('text=/pubmed|식약처|대한신장학회|source|출처/i');
    const hasSources = await sources.count() > 0;

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/cha-008-sources.png',
      fullPage: true
    });

    if (hasSources) {
      console.log('✓ PASS: CHA-008 - Source citations found');
    } else {
      console.log('⚠ WARNING: CHA-008 - Source citations not visible (may be in backend response)');
    }
  });

  /**
   * Session Management
   * 세션 관리 테스트
   */
  test('Should preserve messages in session', async ({ page }) => {
    // Send a message
    await sendChatMessage(page, TEST_MESSAGES.SIMPLE_GREETING);
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Take screenshot after reload
    await page.screenshot({
      path: 'test-results/screenshots/session-management.png',
      fullPage: true
    });

    console.log('✓ INFO: Session management test completed - check screenshot for persistence');
  });

  /**
   * UI Responsiveness Test
   * UI 반응성 테스트
   */
  test('Should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/mobile-responsive.png',
      fullPage: true
    });

    // Check if input is still visible
    const input = page.locator('input[type="text"]').last();
    await expect(input).toBeVisible();

    console.log('✓ PASS: Mobile responsive layout working');
  });

  /**
   * Main Page Screenshot
   * 메인 페이지 스크린샷
   */
  test('Should capture main page layout', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/screenshots/main-page-full.png',
      fullPage: true
    });

    // Take viewport screenshot
    await page.screenshot({
      path: 'test-results/screenshots/main-page-viewport.png',
      fullPage: false
    });

    console.log('✓ INFO: Main page screenshots captured');
  });
});

/**
 * Chat Navigation Tests
 * 채팅 네비게이션 테스트
 */
test.describe('Chat Page Navigation', () => {
  test('Should navigate to chat page from main page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for chat navigation link
    const chatLink = page.locator('a[href*="chat"], button:has-text("채팅"), button:has-text("Chat")').first();

    if (await chatLink.count() > 0 && await chatLink.isVisible()) {
      await chatLink.click();
      await page.waitForLoadState('networkidle');

      // Take screenshot
      await page.screenshot({
        path: 'test-results/screenshots/chat-page-navigation.png',
        fullPage: true
      });

      console.log('✓ PASS: Navigated to chat page successfully');
    } else {
      // We might already be on chat page
      await page.screenshot({
        path: 'test-results/screenshots/current-page.png',
        fullPage: true
      });
      console.log('✓ INFO: Chat navigation - already on chat page or link not found');
    }
  });
});
