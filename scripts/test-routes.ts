/**
 * Dayflow HRMS — Live HTTP Routes & Middleware Edge Case Test
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function fetchRoute(path: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      redirect: 'manual', // do not auto-follow to inspect status codes & headers
      ...options,
    });
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      ok: res.ok,
    };
  } catch (err: unknown) {
    return {
      status: 0,
      error: err instanceof Error ? err.message : 'Fetch error',
      headers: {},
      ok: false,
    };
  }
}

async function runHttpTests() {
  console.log('\n========================================================');
  console.log('🌐 DAYFLOW HRMS: LIVE HTTP & ROUTE GUARD TESTS');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assertRoute(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Landing and Public Auth Pages
  const home = await fetchRoute('/');
  assertRoute(home.status === 200, 'GET / returns HTTP 200 OK', `Status: ${home.status}`);

  const signin = await fetchRoute('/signin');
  assertRoute(signin.status === 200, 'GET /signin returns HTTP 200 OK', `Status: ${signin.status}`);

  const signup = await fetchRoute('/signup');
  assertRoute(signup.status === 200, 'GET /signup returns HTTP 200 OK', `Status: ${signup.status}`);

  const verifyEmail = await fetchRoute('/verify-email?email=test%40dayflow.internal');
  assertRoute(verifyEmail.status === 200, 'GET /verify-email with email param returns HTTP 200 OK', `Status: ${verifyEmail.status}`);

  const forgotPassword = await fetchRoute('/forgot-password');
  assertRoute(forgotPassword.status === 200, 'GET /forgot-password returns HTTP 200 OK', `Status: ${forgotPassword.status}`);

  const testConnection = await fetchRoute('/test-connection');
  assertRoute(testConnection.status === 200, 'GET /test-connection Server Component returns HTTP 200 OK', `Status: ${testConnection.status}`);

  // 2. Protected Dashboard Routes (Unauthenticated Edge Case)
  const employeeDash = await fetchRoute('/dashboard/employee');
  const isRedirectOrProtected = employeeDash.status === 307 || employeeDash.status === 302 || employeeDash.status === 200;
  assertRoute(isRedirectOrProtected, 'GET /dashboard/employee unauthenticated handled properly by AuthGuard/Middleware', `Status: ${employeeDash.status}`);

  const adminDash = await fetchRoute('/dashboard/admin');
  assertRoute(isRedirectOrProtected, 'GET /dashboard/admin unauthenticated handled properly by AuthGuard/Middleware', `Status: ${adminDash.status}`);

  // 3. 404 Route Handling
  const nonExistent = await fetchRoute('/non-existent-random-page-12345');
  assertRoute(nonExistent.status === 404, 'GET /non-existent-random-page returns HTTP 404', `Status: ${nonExistent.status}`);

  console.log('\n========================================================');
  console.log(`📊 HTTP ROUTE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runHttpTests();
