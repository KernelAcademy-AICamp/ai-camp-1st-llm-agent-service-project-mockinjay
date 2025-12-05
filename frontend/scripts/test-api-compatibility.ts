/**
 * API Compatibility Test Script
 *
 * Tests backend API endpoints against frontend service requirements
 * for the new_frontend migration.
 *
 * Usage:
 *   npx ts-node scripts/test-api-compatibility.ts
 *
 * Requirements:
 *   - Backend running on http://localhost:8000
 *   - MongoDB running and accessible
 */

import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const TEST_TIMEOUT = 5000; // 5 seconds

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'MISSING' | 'ERROR';
  statusCode?: number;
  message: string;
  responseTime?: number;
  details?: any;
}

interface TestSuite {
  name: string;
  results: TestResult[];
}

const testResults: TestSuite[] = [];
let testToken = '';
let testUserId = '';
let testSessionId = '';
let testRoomId = '';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

async function testEndpoint(
  suite: string,
  method: string,
  endpoint: string,
  options: {
    headers?: Record<string, string>;
    data?: any;
    params?: any;
    expectedStatus?: number;
    requireAuth?: boolean;
    description?: string;
  } = {}
): Promise<TestResult> {
  const startTime = Date.now();
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  const testDescription = options.description || `${method} ${endpoint}`;

  try {
    const config = {
      method,
      url: fullUrl,
      headers: options.headers || {},
      data: options.data,
      params: options.params,
      timeout: TEST_TIMEOUT,
      validateStatus: () => true, // Don't throw on any status
    };

    // Add auth token if required
    if (options.requireAuth && testToken) {
      config.headers['Authorization'] = `Bearer ${testToken}`;
    }

    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    const expectedStatus = options.expectedStatus || 200;

    if (response.status === expectedStatus) {
      return {
        endpoint,
        method,
        status: 'PASS',
        statusCode: response.status,
        message: testDescription,
        responseTime,
        details: response.data,
      };
    } else if (response.status === 404) {
      return {
        endpoint,
        method,
        status: 'MISSING',
        statusCode: response.status,
        message: `${testDescription} - Endpoint not found`,
        responseTime,
      };
    } else {
      return {
        endpoint,
        method,
        status: 'FAIL',
        statusCode: response.status,
        message: `${testDescription} - Expected ${expectedStatus}, got ${response.status}`,
        responseTime,
        details: response.data,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const axiosError = error as AxiosError;

    if (axiosError.code === 'ECONNREFUSED') {
      return {
        endpoint,
        method,
        status: 'ERROR',
        message: `${testDescription} - Backend not running`,
        responseTime,
      };
    }

    return {
      endpoint,
      method,
      status: 'ERROR',
      statusCode: axiosError.response?.status,
      message: `${testDescription} - ${axiosError.message}`,
      responseTime,
      details: axiosError.response?.data,
    };
  }
}

async function testHealthEndpoints() {
  logSection('Testing Health & Basic Endpoints');

  const suite: TestSuite = { name: 'Health & Basic', results: [] };

  // Test root endpoint
  suite.results.push(await testEndpoint(suite.name, 'GET', '/', {
    description: 'Root endpoint',
  }));

  // Test health check
  suite.results.push(await testEndpoint(suite.name, 'GET', '/health', {
    description: 'Health check',
  }));

  // Test database connection
  suite.results.push(await testEndpoint(suite.name, 'GET', '/db-check', {
    description: 'Database connection check',
  }));

  testResults.push(suite);
}

async function testAuthEndpoints() {
  logSection('Testing Authentication Endpoints');

  const suite: TestSuite = { name: 'Authentication', results: [] };

  // Test check email availability
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/auth/check-email', {
    params: { email: 'test@example.com' },
    description: 'Check email availability',
  }));

  // Test check username availability
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/auth/check-username', {
    params: { username: 'testuser' },
    description: 'Check username availability',
  }));

  // Test dev login (auto-creates test user)
  const loginResult = await testEndpoint(suite.name, 'POST', '/api/auth/dev-login', {
    description: 'Dev login (auto user creation)',
  });
  suite.results.push(loginResult);

  if (loginResult.status === 'PASS' && loginResult.details) {
    testToken = loginResult.details.access_token;
    testUserId = loginResult.details.user?.id;
    log(`✓ Authenticated as user: ${testUserId}`, colors.green);
  }

  // Test login with form data
  const formData = new URLSearchParams();
  formData.append('username', 'testuser');
  formData.append('password', 'password123');

  suite.results.push(await testEndpoint(suite.name, 'POST', '/api/auth/login', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: formData.toString(),
    description: 'Login with credentials',
  }));

  // Test get current user
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/auth/me', {
    requireAuth: true,
    description: 'Get current user info',
  }));

  // Test register (should fail with duplicate)
  suite.results.push(await testEndpoint(suite.name, 'POST', '/api/auth/register', {
    data: {
      username: 'newuser123',
      email: 'newuser123@example.com',
      password: 'Password123!',
      fullName: 'New User',
      profile: 'general',
    },
    expectedStatus: 200,
    description: 'Register new user',
  }));

  // Test profile update
  suite.results.push(await testEndpoint(suite.name, 'PATCH', '/api/auth/profile', {
    requireAuth: true,
    data: { profile: 'patient' },
    description: 'Update user profile type',
  }));

  testResults.push(suite);
}

async function testTermsEndpoints() {
  logSection('Testing Terms & Conditions Endpoints');

  const suite: TestSuite = { name: 'Terms & Conditions', results: [] };

  // Test get all terms
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/terms/all', {
    description: 'Get all terms and conditions',
  }));

  testResults.push(suite);
}

async function testChatEndpoints() {
  logSection('Testing Chat Endpoints');

  const suite: TestSuite = { name: 'Chat & Messaging', results: [] };

  // Test chat info
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/chat/info', {
    description: 'Get chat service info',
  }));

  // Test get chat rooms (deprecated but still used)
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/chat/rooms', {
    params: { user_id: testUserId },
    description: 'Get user chat rooms (deprecated)',
  }));

  // Test chat history
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/chat/history', {
    params: { user_id: testUserId, limit: 10 },
    description: 'Get chat history',
  }));

  testResults.push(suite);
}

async function testRoomsEndpoints() {
  logSection('Testing Rooms Management Endpoints');

  const suite: TestSuite = { name: 'Rooms Management', results: [] };

  // Test create room
  const createRoomResult = await testEndpoint(suite.name, 'POST', '/api/rooms', {
    requireAuth: true,
    data: {
      user_id: testUserId,
      room_name: 'Test Room',
      metadata: { test: true },
    },
    description: 'Create chat room',
  });
  suite.results.push(createRoomResult);

  if (createRoomResult.status === 'PASS' && createRoomResult.details?.data) {
    testRoomId = createRoomResult.details.data.room_id;
    log(`✓ Created room: ${testRoomId}`, colors.green);
  }

  // Test get rooms list
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/rooms', {
    params: { user_id: testUserId, limit: 50 },
    description: 'Get user rooms list',
  }));

  // Test get single room (if room was created)
  if (testRoomId) {
    suite.results.push(await testEndpoint(suite.name, 'GET', `/api/rooms/${testRoomId}`, {
      description: 'Get room by ID',
    }));

    // Test update room
    suite.results.push(await testEndpoint(suite.name, 'PATCH', `/api/rooms/${testRoomId}`, {
      requireAuth: true,
      params: { user_id: testUserId },
      data: { room_name: 'Updated Test Room' },
      description: 'Update room name',
    }));

    // Test get room history
    suite.results.push(await testEndpoint(suite.name, 'GET', `/api/rooms/${testRoomId}/history`, {
      params: { limit: 50 },
      description: 'Get room conversation history',
    }));
  }

  testResults.push(suite);
}

async function testSessionEndpoints() {
  logSection('Testing Session Endpoints');

  const suite: TestSuite = { name: 'Session Management', results: [] };

  // Test create session
  const sessionResult = await testEndpoint(suite.name, 'POST', '/api/session/create', {
    data: { user_id: testUserId },
    description: 'Create analysis session',
  });
  suite.results.push(sessionResult);

  if (sessionResult.status === 'PASS' && sessionResult.details) {
    testSessionId = sessionResult.details.session_id;
    log(`✓ Created session: ${testSessionId}`, colors.green);
  }

  testResults.push(suite);
}

async function testDietCareEndpoints() {
  logSection('Testing Diet Care Endpoints');

  const suite: TestSuite = { name: 'Diet Care', results: [] };

  // Test create diet care session
  suite.results.push(await testEndpoint(suite.name, 'POST', '/api/diet-care/session/create', {
    requireAuth: true,
    description: 'Create diet care session',
  }));

  // Test get nutrition goals
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/diet-care/goals', {
    requireAuth: true,
    description: 'Get nutrition goals',
  }));

  // Test update nutrition goals
  suite.results.push(await testEndpoint(suite.name, 'PUT', '/api/diet-care/goals', {
    requireAuth: true,
    data: {
      calories_kcal: 2000,
      protein_g: 50,
      sodium_mg: 2000,
    },
    description: 'Update nutrition goals',
  }));

  // Test get meals history
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/diet-care/meals', {
    requireAuth: true,
    description: 'Get meal history',
  }));

  // Test create meal entry
  suite.results.push(await testEndpoint(suite.name, 'POST', '/api/diet-care/meals', {
    requireAuth: true,
    expectedStatus: 201,
    data: {
      meal_type: 'breakfast',
      foods: [
        {
          name: '밥',
          amount: '1공기',
          calories: 300,
          protein_g: 5,
          sodium_mg: 10,
          potassium_mg: 100,
          phosphorus_mg: 80,
        },
      ],
      notes: 'Test meal',
    },
    description: 'Create meal entry',
  }));

  // Test get daily progress
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/diet-care/progress/daily', {
    requireAuth: true,
    description: 'Get daily progress',
  }));

  // Test get weekly progress
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/diet-care/progress/weekly', {
    requireAuth: true,
    description: 'Get weekly progress',
  }));

  // Test get logging streak
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/diet-care/streak', {
    requireAuth: true,
    description: 'Get logging streak',
  }));

  testResults.push(suite);
}

async function testCommunityEndpoints() {
  logSection('Testing Community Endpoints');

  const suite: TestSuite = { name: 'Community', results: [] };

  // Test get posts list
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/community/posts', {
    params: { limit: 20, offset: 0 },
    description: 'Get community posts',
  }));

  // Test create post
  const createPostResult = await testEndpoint(suite.name, 'POST', '/api/community/posts', {
    requireAuth: true,
    expectedStatus: 201,
    data: {
      title: 'Test Post',
      content: 'This is a test post',
      post_type: 'BOARD',
      tags: ['test'],
    },
    description: 'Create community post',
  });
  suite.results.push(createPostResult);

  let testPostId = '';
  if (createPostResult.status === 'PASS' && createPostResult.details?.id) {
    testPostId = createPostResult.details.id;
  }

  // Test get single post (if created)
  if (testPostId) {
    suite.results.push(await testEndpoint(suite.name, 'GET', `/api/community/posts/${testPostId}`, {
      description: 'Get post by ID',
    }));
  }

  // Test search posts
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/community/search', {
    params: { q: 'test', limit: 10 },
    description: 'Search community posts',
  }));

  testResults.push(suite);
}

async function testTrendsEndpoints() {
  logSection('Testing Trends & Research Endpoints');

  const suite: TestSuite = { name: 'Trends & Research', results: [] };

  // Test temporal trends analysis
  suite.results.push(await testEndpoint(suite.name, 'POST', '/api/trends/temporal', {
    data: {
      query: 'chronic kidney disease',
      start_year: 2020,
      end_year: 2024,
      session_id: testSessionId || 'test',
    },
    description: 'Analyze temporal trends',
  }));

  // Test paper search
  suite.results.push(await testEndpoint(suite.name, 'POST', '/api/trends/papers', {
    data: {
      query: 'kidney disease',
      max_results: 10,
      session_id: testSessionId || 'test',
    },
    description: 'Search research papers',
  }));

  // Test geographic distribution
  suite.results.push(await testEndpoint(suite.name, 'POST', '/api/trends/geographic', {
    data: {
      query: 'kidney disease',
      session_id: testSessionId || 'test',
    },
    description: 'Analyze geographic distribution',
  }));

  // Test MeSH category analysis
  suite.results.push(await testEndpoint(suite.name, 'POST', '/api/trends/mesh', {
    data: {
      query: 'kidney disease',
      session_id: testSessionId || 'test',
    },
    description: 'Analyze MeSH categories',
  }));

  testResults.push(suite);
}

async function testMyPageEndpoints() {
  logSection('Testing MyPage Endpoints');

  const suite: TestSuite = { name: 'MyPage', results: [] };

  // Test get user profile
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/mypage/profile', {
    requireAuth: true,
    description: 'Get user profile',
  }));

  // Test update user profile
  suite.results.push(await testEndpoint(suite.name, 'PUT', '/api/mypage/profile', {
    requireAuth: true,
    data: {
      fullName: 'Test User Updated',
      bio: 'This is a test bio',
    },
    description: 'Update user profile',
  }));

  // Test get health profile
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/mypage/health-profile', {
    requireAuth: true,
    description: 'Get health profile',
  }));

  // Test update health profile
  suite.results.push(await testEndpoint(suite.name, 'PUT', '/api/mypage/health-profile', {
    requireAuth: true,
    data: {
      conditions: ['CKD Stage 3'],
      allergies: ['peanuts'],
      dietaryRestrictions: ['low sodium'],
    },
    description: 'Update health profile',
  }));

  // Test get user preferences
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/mypage/preferences', {
    requireAuth: true,
    description: 'Get user preferences',
  }));

  // Test update user preferences
  suite.results.push(await testEndpoint(suite.name, 'PUT', '/api/mypage/preferences', {
    requireAuth: true,
    data: {
      theme: 'light',
      language: 'ko',
      notifications: {
        email: true,
        push: true,
      },
    },
    description: 'Update user preferences',
  }));

  // Test get bookmarks
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/mypage/bookmarks', {
    requireAuth: true,
    params: { limit: 20, offset: 0 },
    description: 'Get bookmarked papers',
  }));

  // Test get user posts
  suite.results.push(await testEndpoint(suite.name, 'GET', '/api/mypage/posts', {
    requireAuth: true,
    params: { limit: 20, offset: 0 },
    description: 'Get user posts',
  }));

  testResults.push(suite);
}

async function testQuizEndpoints() {
  logSection('Testing Quiz Endpoints');

  const suite: TestSuite = { name: 'Quiz', results: [] };

  // Test start quiz session
  suite.results.push(await testEndpoint(suite.name, 'POST', '/api/quiz/session/start', {
    expectedStatus: 201,
    data: {
      userId: testUserId,
      sessionType: 'DAILY',
      category: 'CKD_BASICS',
    },
    description: 'Start quiz session',
  }));

  testResults.push(suite);
}

function printResults() {
  logSection('Test Results Summary');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let missingTests = 0;
  let errorTests = 0;

  testResults.forEach((suite) => {
    log(`\n${suite.name}:`, colors.bright);

    suite.results.forEach((result) => {
      totalTests++;

      let symbol = '';
      let color = colors.reset;

      switch (result.status) {
        case 'PASS':
          symbol = '✓';
          color = colors.green;
          passedTests++;
          break;
        case 'FAIL':
          symbol = '✗';
          color = colors.red;
          failedTests++;
          break;
        case 'MISSING':
          symbol = '?';
          color = colors.yellow;
          missingTests++;
          break;
        case 'ERROR':
          symbol = '!';
          color = colors.red;
          errorTests++;
          break;
      }

      const timeStr = result.responseTime ? `(${result.responseTime}ms)` : '';
      const statusStr = result.statusCode ? `[${result.statusCode}]` : '';

      log(`  ${symbol} ${result.message} ${statusStr} ${timeStr}`, color);

      // Show details for failed or error tests
      if ((result.status === 'FAIL' || result.status === 'ERROR') && result.details) {
        const detailStr = typeof result.details === 'string'
          ? result.details
          : JSON.stringify(result.details, null, 2).substring(0, 200);
        log(`    Details: ${detailStr}`, colors.reset);
      }
    });
  });

  // Summary statistics
  logSection('Summary');

  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';

  log(`Total Tests: ${totalTests}`, colors.bright);
  log(`Passed:      ${passedTests}`, colors.green);
  log(`Failed:      ${failedTests}`, failedTests > 0 ? colors.red : colors.reset);
  log(`Missing:     ${missingTests}`, missingTests > 0 ? colors.yellow : colors.reset);
  log(`Errors:      ${errorTests}`, errorTests > 0 ? colors.red : colors.reset);
  log(`Pass Rate:   ${passRate}%`, passedTests === totalTests ? colors.green : colors.yellow);
}

function generateReport(): string {
  const timestamp = new Date().toISOString();

  let report = `# API Compatibility Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**Backend:** ${API_BASE_URL}\n\n`;

  report += `## Summary\n\n`;

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let missingTests = 0;
  let errorTests = 0;

  testResults.forEach((suite) => {
    suite.results.forEach((result) => {
      totalTests++;
      if (result.status === 'PASS') passedTests++;
      if (result.status === 'FAIL') failedTests++;
      if (result.status === 'MISSING') missingTests++;
      if (result.status === 'ERROR') errorTests++;
    });
  });

  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';

  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Tests | ${totalTests} |\n`;
  report += `| Passed | ${passedTests} |\n`;
  report += `| Failed | ${failedTests} |\n`;
  report += `| Missing | ${missingTests} |\n`;
  report += `| Errors | ${errorTests} |\n`;
  report += `| Pass Rate | ${passRate}% |\n\n`;

  // Detailed results by suite
  testResults.forEach((suite) => {
    report += `## ${suite.name}\n\n`;
    report += `| Endpoint | Method | Status | Code | Time | Message |\n`;
    report += `|----------|--------|--------|------|------|----------|\n`;

    suite.results.forEach((result) => {
      const statusIcon = {
        'PASS': '✓',
        'FAIL': '✗',
        'MISSING': '?',
        'ERROR': '!',
      }[result.status] || '-';

      const code = result.statusCode || '-';
      const time = result.responseTime ? `${result.responseTime}ms` : '-';

      report += `| \`${result.endpoint}\` | ${result.method} | ${statusIcon} ${result.status} | ${code} | ${time} | ${result.message} |\n`;
    });

    report += `\n`;
  });

  // Recommendations
  report += `## Recommendations\n\n`;

  if (missingTests > 0) {
    report += `### Missing Endpoints (${missingTests})\n\n`;
    report += `The following endpoints are required by the frontend but not implemented:\n\n`;

    testResults.forEach((suite) => {
      const missing = suite.results.filter(r => r.status === 'MISSING');
      if (missing.length > 0) {
        report += `**${suite.name}:**\n`;
        missing.forEach((result) => {
          report += `- \`${result.method} ${result.endpoint}\`: ${result.message}\n`;
        });
        report += `\n`;
      }
    });
  }

  if (failedTests > 0) {
    report += `### Failed Tests (${failedTests})\n\n`;
    report += `The following endpoints exist but returned unexpected responses:\n\n`;

    testResults.forEach((suite) => {
      const failed = suite.results.filter(r => r.status === 'FAIL');
      if (failed.length > 0) {
        report += `**${suite.name}:**\n`;
        failed.forEach((result) => {
          report += `- \`${result.method} ${result.endpoint}\` [${result.statusCode}]: ${result.message}\n`;
        });
        report += `\n`;
      }
    });
  }

  if (errorTests > 0) {
    report += `### Connection Errors (${errorTests})\n\n`;
    report += `The following tests encountered connection or runtime errors:\n\n`;

    testResults.forEach((suite) => {
      const errors = suite.results.filter(r => r.status === 'ERROR');
      if (errors.length > 0) {
        report += `**${suite.name}:**\n`;
        errors.forEach((result) => {
          report += `- \`${result.method} ${result.endpoint}\`: ${result.message}\n`;
        });
        report += `\n`;
      }
    });
  }

  report += `## Next Steps\n\n`;
  report += `1. Implement missing endpoints marked with '?' status\n`;
  report += `2. Fix failed endpoints to return expected response formats\n`;
  report += `3. Ensure authentication middleware is properly configured\n`;
  report += `4. Review and update API documentation\n`;
  report += `5. Add backend unit tests for new endpoints\n`;

  return report;
}

async function runAllTests() {
  log('\n' + '='.repeat(80), colors.bright);
  log('  API COMPATIBILITY TEST SUITE', colors.bright + colors.cyan);
  log('  Frontend Migration - Phase 0, Day 1', colors.cyan);
  log('='.repeat(80) + '\n', colors.bright);

  log(`Testing backend at: ${API_BASE_URL}`, colors.blue);
  log(`Test timeout: ${TEST_TIMEOUT}ms\n`, colors.blue);

  try {
    await testHealthEndpoints();
    await testAuthEndpoints();
    await testTermsEndpoints();
    await testChatEndpoints();
    await testRoomsEndpoints();
    await testSessionEndpoints();
    await testDietCareEndpoints();
    await testCommunityEndpoints();
    await testTrendsEndpoints();
    await testMyPageEndpoints();
    await testQuizEndpoints();

    // Print results to console
    printResults();

    // Generate markdown report
    const report = generateReport();
    const fs = await import('fs');
    const reportPath = './api-compatibility-report.md';
    fs.writeFileSync(reportPath, report);

    log(`\n✓ Report saved to: ${reportPath}`, colors.green);

  } catch (error) {
    log(`\n✗ Test suite failed: ${error}`, colors.red);
    process.exit(1);
  }
}

// Run tests
runAllTests();
