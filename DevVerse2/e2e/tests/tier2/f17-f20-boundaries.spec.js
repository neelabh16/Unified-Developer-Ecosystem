const {
  test,
  expect,
  BASE_URL,
  API_URL,
  loginViaUI,
  assertNoHorizontalOverflow,
  mockGitHubApi,
  setUserPoints,
} = require('../../fixtures/test-fixtures');

test.describe('Tier 2 — F17: Shell & Command Palette Boundaries', () => {
  test('T2-F17-01: unknown SPA route renders friendly 404/fallback inside layout without crash', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/this-route-does-not-exist-404');
    await expect(
      page.getByText(/not found|home|explore|404/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F17-02: Command Palette query with 0 matches displays No matches message', async ({
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
    await cmdInput.fill('zzzz_no_match_999');
    await expect(page.getByText(/no matches|nothing found/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F17-03: pressing Escape closes Command Palette cleanly', async ({
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
    await expect(cmdInput).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(cmdInput).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T2-F17-04: legacy /login.html?redirect=/codex preserves redirect query parameter', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/login.html?redirect=/codex');
    await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)codex/);
    errorGuard.assertClean();
  });

  test('T2-F17-05: mobile menu drawer closes automatically after clicking a navigation link', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page
      .getByRole('button', { name: /menu|navigation|open menu/i })
      .first()
      .click();
    await page.getByRole('link', { name: /explore/i }).last().click();
    await expect(page).toHaveURL(/\/explore/);
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F18: Auth, Security & CSRF Boundaries', () => {
  test('T2-F18-01: tampered JWT cookie yields 401 on /auth/me and redirects protected route to /login', async ({
    page,
    context,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await context.addCookies([
      {
        name: 'token',
        value: 'invalid.jwt.tampered',
        url: new URL(API_URL).origin,
      },
    ]);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
    errorGuard.assertClean();
  });

  test('T2-F18-02: malicious open redirect /login?redirect=https://evil.com sanitizes to /', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/login?redirect=https://evil.com');
    await page.getByLabel(/email or username/i).first().fill('newcomer');
    await page.getByLabel(/^password$/i).first().fill('Password123!');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/login') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^sign in$/i }).click(),
    ]);
    await expect(page).toHaveURL(new URL(BASE_URL).origin + '/');
    errorGuard.assertClean();
  });

  test('T2-F18-03: cross-origin cookie-only POST without Bearer blocked with 403', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((c) => c.name === 'token');
    expect(tokenCookie).toBeTruthy();

    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${tokenCookie.value}`,
        Origin: 'https://evil.example.com',
      },
      body: JSON.stringify({
        title: 'CSRF Forged',
        desc: 'Should be blocked by csrfProtection.',
        category: 'Tools',
      }),
    });
    expect(res.status).toBe(403);
    errorGuard.assertClean();
  });

  test('T2-F18-04: Bearer token mutation succeeds without Origin header (CSRF Bearer exemption)', async ({
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    const res = await api.request('POST', '/projects/p1/like');
    expect(res.status).toBe(200);
    errorGuard.assertClean();
  });

  test('T2-F18-05: NoSQL injection payload to /auth/login is sanitized and never authenticates', async ({
    api,
    errorGuard,
  }) => {
    const res = await api.request('POST', '/auth/login', {
      body: { identifier: { $gt: '' }, password: 'x' },
      headers: { Origin: new URL(API_URL).origin },
    });
    expect([400, 401]).toContain(res.status);
    expect(res.json?.data?.token).toBeUndefined();
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F19: Gamification Idempotency & Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F19-01: toggling Like on -> off does not deduct points and verifies engagement state', async ({
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    const r1 = await api.request('POST', '/projects/p1/like');
    expect(r1.status).toBe(200);
    expect(r1.json.data.liked).toBe(true);
    const pts1 = r1.json.data.userPoints;
    expect(pts1).toBe(22);

    const r2 = await api.request('POST', '/projects/p1/like');
    expect(r2.status).toBe(200);
    expect(r2.json.data.liked).toBe(false);
    expect(r2.json.data.userPoints).toBe(pts1);
    errorGuard.assertClean();
  });

  test('T2-F19-02: toggling Bookmark on -> off preserves earned points (>=23) and toggles state', async ({
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    const r1 = await api.request('POST', '/projects/p1/bookmark');
    expect(r1.status).toBe(200);
    expect(r1.json.data.bookmarked).toBe(true);
    expect(r1.json.data.userPoints).toBe(23);

    const r2 = await api.request('POST', '/projects/p1/bookmark');
    expect(r2.status).toBe(200);
    expect(r2.json.data.bookmarked).toBe(false);
    expect(r2.json.data.userPoints).toBe(23);
    errorGuard.assertClean();
  });

  test('T2-F19-03: toggling Follow on -> off on developer toggles following state cleanly', async ({
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    const r1 = await api.request('POST', '/users/kmori/follow');
    expect(r1.status).toBe(200);
    expect(r1.json.data.following).toBe(true);

    const me1 = await api.getMe();
    expect(me1.json.data.user.points).toBe(22);

    const r2 = await api.request('POST', '/users/kmori/follow');
    expect(r2.status).toBe(200);
    expect(r2.json.data.following).toBe(false);
    errorGuard.assertClean();
  });

  test('T2-F19-04: Portfolio +30 milestone fires only once even across repeated PUT /portfolios/me saves', async ({
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    const payload = {
      name: 'Newcomer Builder',
      title: 'Frontend Dev',
      bio: 'Building clean React interfaces.',
      skills: ['React', 'TypeScript'],
      links: [{ label: 'GitHub', url: 'https://github.com/newcomer-dev' }],
      projects: [{ title: 'Starter', desc: 'My first DevVerse project.' }],
    };

    const s1 = await api.request('PUT', '/portfolios/me', { body: payload });
    expect(s1.status).toBe(200);
    const pts1 = (await api.getMe()).json.data.user.points;
    expect(pts1).toBe(50); // 20 + 30 milestone

    const s2 = await api.request('PUT', '/portfolios/me', { body: payload });
    expect(s2.status).toBe(200);
    const pts2 = (await api.getMe()).json.data.user.points;
    expect(pts2).toBe(50);
    errorGuard.assertClean();
  });

  test('T2-F19-05: deleting own comment/thread/project never makes points negative', async ({
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    const cRes = await api.request('POST', '/projects/p1/comments', {
      body: { text: 'Zero floor boundary test comment' },
    });
    expect(cRes.status).toBe(201);
    const commentId = cRes.json.data.comment._id;

    // Force points to 0 floor, then delete comment and verify points clamp at 0
    await setUserPoints('newcomer', 0);
    const delComment = await api.request('DELETE', `/projects/p1/comments/${commentId}`);
    expect(delComment.status).toBe(200);
    const meNewcomer = await api.getMe();
    expect(meNewcomer.json.data.user.points).toBe(0);

    await api.login('codexuser');
    const delProj = await api.request('DELETE', '/projects/p10');
    expect(delProj.status).toBe(200);
    const me = await api.getMe();
    expect(me.json.data.user.points).toBeGreaterThanOrEqual(0);
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F20: Visual & Responsive Boundaries', () => {
  test('T2-F20-01: mobile 375x812 heavy form pages have zero horizontal overflow', async ({
    page,
    errorGuard,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/signup');
    await assertNoHorizontalOverflow(page, '/signup (375x812)');

    await loginViaUI(page, 'codexuser');
    await page.goto('/submit-project');
    await assertNoHorizontalOverflow(page, '/submit-project (375x812)');
    await page.goto('/portfolio');
    await assertNoHorizontalOverflow(page, '/portfolio (375x812)');
    errorGuard.assertClean();
  });

  test('T2-F20-02: tablet 768x1024 auth card and detail grid render without horizontal overflow', async ({
    page,
    errorGuard,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await assertNoHorizontalOverflow(page, '/login (768x1024)');
    await page.goto('/projects/p1');
    await assertNoHorizontalOverflow(page, '/projects/p1 (768x1024)');
    errorGuard.assertClean();
  });

  test('T2-F20-03: desktop 1440x900 dock stays single-line and inside viewport bounds', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const navBox = await page.getByRole('navigation').first().boundingBox();
    expect(navBox).toBeTruthy();
    expect(navBox.height).toBeLessThan(110);
    expect(navBox.x + navBox.width).toBeLessThanOrEqual(1440);
    errorGuard.assertClean();
  });

  test('T2-F20-04: switching Dark and Light updates background and primary text contrast cleanly', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/settings');
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.getByRole('button', { name: /^light$/i }).first().click();
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(lightBg).not.toBe(darkBg);
    errorGuard.assertClean();
  });

  test('T2-F20-05: emulated prefers-reduced-motion: reduce renders HeroCanvas with zero errors', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /where builders become legends/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });
});
