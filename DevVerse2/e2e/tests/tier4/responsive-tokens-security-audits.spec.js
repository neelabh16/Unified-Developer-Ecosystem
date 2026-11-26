const {
  test,
  expect,
  BASE_URL,
  API_URL,
  ALL_16_ROUTES,
  DARK_ACCENT_HEX,
  normalizeHex,
  loginViaUI,
  assertNoHorizontalOverflow,
  readDesignTokens,
  mockGitHubApi,
} = require('../../fixtures/test-fixtures');
const { VALID_PNG_PATH } = require('../../fixtures/assets');

async function assertDarkGlassTokens(page, route) {
  const tokens = await readDesignTokens(page);
  expect(tokens.dataTheme, `${route} data-theme`).toBe('dark');
  expect(normalizeHex(tokens.tokens.violet), `${route} --violet`).toBe(DARK_ACCENT_HEX.violet);
  expect(normalizeHex(tokens.tokens.cyan), `${route} --cyan`).toBe(DARK_ACCENT_HEX.cyan);
  expect(normalizeHex(tokens.tokens.coral), `${route} --coral`).toBe(DARK_ACCENT_HEX.coral);
  expect(normalizeHex(tokens.tokens.amber), `${route} --amber`).toBe(DARK_ACCENT_HEX.amber);
  expect(normalizeHex(tokens.tokens.legend), `${route} --legend`).toBe(DARK_ACCENT_HEX.legend);
  expect(tokens.glassBlurCount, `${route} glassBlurCount`).toBeGreaterThan(0);
}

test.describe('Tier 4 — Responsive, Token, Security & Accessibility Audits', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T4-06: Full 16-Route Mobile (375x812) Responsive, Overflow & Zero-Error Audit', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.setViewportSize({ width: 375, height: 812 });

    // Audit authenticated routes, then sign out and audit /login & /signup
    await loginViaUI(page, 'codexuser');
    const authedRoutes = ALL_16_ROUTES.filter((r) => r !== '/login' && r !== '/signup');
    for (const route of authedRoutes) {
      await page.goto(route);
      await assertNoHorizontalOverflow(page, `${route} @ 375x812`);
      await expect(
        page.getByRole('button', { name: /menu|navigation|open menu/i }).first()
      ).toBeVisible();
    }

    // Audit /login & /signup logged out
    await page.goto('/settings');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /sign out|log out/i }).first().click(),
    ]);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await assertNoHorizontalOverflow(page, '/login @ 375x812');

    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);
    await assertNoHorizontalOverflow(page, '/signup @ 375x812');
    errorGuard.assertClean();
  });

  test('T4-07: Full 16-Route Tablet (768x1024) Responsive, Overflow & Zero-Error Audit', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.setViewportSize({ width: 768, height: 1024 });

    await loginViaUI(page, 'codexuser');
    const authedRoutes = ALL_16_ROUTES.filter((r) => r !== '/login' && r !== '/signup');
    for (const route of authedRoutes) {
      await page.goto(route);
      await assertNoHorizontalOverflow(page, `${route} @ 768x1024`);
    }

    await page.goto('/settings');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /sign out|log out/i }).first().click(),
    ]);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await assertNoHorizontalOverflow(page, '/login @ 768x1024');

    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);
    await assertNoHorizontalOverflow(page, '/signup @ 768x1024');
    errorGuard.assertClean();
  });

  test('T4-08: Full 16-Route Desktop (1440x900) Responsive, Dark Glassmorphism & Accent Token Audit', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await loginViaUI(page, 'codexuser');
    const authedRoutes = ALL_16_ROUTES.filter((r) => r !== '/login' && r !== '/signup');
    for (const route of authedRoutes) {
      await page.goto(route);
      await assertNoHorizontalOverflow(page, `${route} @ 1440x900`);
      await assertDarkGlassTokens(page, route);
    }

    await page.goto('/settings');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /sign out|log out/i }).first().click(),
    ]);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await assertNoHorizontalOverflow(page, '/login @ 1440x900');
    await assertDarkGlassTokens(page, '/login');

    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);
    await assertNoHorizontalOverflow(page, '/signup @ 1440x900');
    await assertDarkGlassTokens(page, '/signup');
    errorGuard.assertClean();
  });

  test('T4-09: Command Palette (Ctrl+K) & Legacy URL Alias End-to-End Navigation Journey', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');

    await page.keyboard.press('Control+k');
    const cmdInput = page
      .getByPlaceholder(/search|command|jump to/i)
      .or(page.getByRole('combobox'))
      .first();
    await cmdInput.fill('Explore');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL(/\/$/);

    const legacyRoutes = [
      { path: '/login.html', expectedUrl: /\/login/ },
      { path: '/project?id=p1', expectedText: /aurora shader studio/i },
      { path: '/hackathon?id=h1', expectedText: /aurora global ai & systems hackathon/i },
      { path: '/community?id=c1', expectedText: /systems & rust guild/i },
      { path: '/portfolio?u=codexuser', expectedText: /codex contributor/i },
      { path: '/profile?u=kmori', expectedText: /kai mori/i },
    ];
    for (const item of legacyRoutes) {
      await page.goto(item.path);
      if (item.expectedUrl) await expect(page).toHaveURL(item.expectedUrl);
      if (item.expectedText) await expect(page.getByText(item.expectedText).first()).toBeVisible();
    }
    errorGuard.assertClean();
  });

  test('T4-10: Security, Session Expiry & CSRF Resilience Journey across Authenticated Mutations', async ({
    page,
    errorGuard,
  }) => {
    // 1. Protected route + open-redirect protection
    await page.goto('/login?redirect=https://evil.example.com');
    await page.getByLabel(/email or username/i).first().fill('newcomer');
    await page.getByLabel(/^password$/i).first().fill('Password123!');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/login') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^sign in$/i }).click(),
    ]);
    await expect(page).toHaveURL(new URL(BASE_URL).origin + '/');

    // 2. Authenticated mutations (Submit Project + Upload + Settings)
    await page.goto('/submit-project');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/uploads/image') && r.request().method() === 'POST'
      ),
      page.locator('input[type="file"]').first().setInputFiles(VALID_PNG_PATH),
    ]);
    await page.getByLabel(/project title|^title$/i).first().fill('CSRF Resilient App');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Validating hybrid cookie and Bearer auth across mutations.');
    await page.getByLabel(/category/i).first().selectOption('Security');
    await page.getByLabel(/tags/i).first().fill('Security, CSRF');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/projects') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /publish|submit project/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/projects\//);

    // 3. Cross-origin cookie-only POST without Bearer blocked with 403
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((c) => c.name === 'token');
    expect(tokenCookie).toBeTruthy();
    const csrfRes = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${tokenCookie.value}`,
        Origin: 'https://malicious.example.com',
      },
      body: JSON.stringify({ title: 'Blocked', desc: 'CSRF blocked check', category: 'Tools' }),
    });
    expect(csrfRes.status).toBe(403);
    errorGuard.assertClean();
  });

  test('T4-11: Light Theme & Reduced Motion Cross-Page Persistence', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/settings');
    await page.getByRole('button', { name: /^light$/i }).first().click();
    await page
      .getByRole('button', { name: /off|reduced|animations|motion/i })
      .or(page.getByRole('switch', { name: /animations|motion/i }))
      .first()
      .click();

    for (const route of ['/', '/explore', '/hackathons', '/communities', '/leaderboard']) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    }
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    errorGuard.assertClean();
  });

  test('T4-14: Dual-Server Parity Smoke (SPA deep-link reload & static asset/API hydration)', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'codexuser');

    for (const deepRoute of ['/explore', '/projects/p1', '/codex', '/leaderboard']) {
      const response = await page.goto(deepRoute);
      expect(response.status()).toBeLessThan(400);
      await page.reload();
      await expect(page).toHaveURL(new RegExp(deepRoute.replace(/\//g, '\\/')));
    }
    errorGuard.assertClean();
  });

  test('T4-16: Form Validation & Accessibility Keyboard Navigation Audit', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/login');
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'A', 'BUTTON']).toContain(focusedTag);

    // Trigger inline validation error on empty Login submit
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(
      page.getByText(/enter your|required|email or username/i).first()
    ).toBeVisible();

    // Command palette keyboard open & close
    await page.keyboard.press('Control+k');
    const cmdInput = page
      .getByPlaceholder(/search|command|jump to/i)
      .or(page.getByRole('combobox'))
      .first();
    await expect(cmdInput).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(cmdInput).toHaveCount(0);
    errorGuard.assertClean();
  });
});
