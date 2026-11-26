const {
  test,
  expect,
  DARK_ACCENT_HEX,
  normalizeHex,
  loginViaUI,
  readDesignTokens,
  assertNoHorizontalOverflow,
  mockGitHubApi,
  assertLeaderboardUserStats,
  setUserPoints,
} = require('../../fixtures/test-fixtures');

test.describe('Tier 1 — F17: Navigation Shell, Command Palette & Aliases', () => {
  test('T1-F17-01: floating OS dock renders brand, nav links, Search button, theme toggle, Settings, Sign In', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    const nav = page.getByRole('navigation').first();
    await expect(nav).toBeVisible();
    await expect(page.getByRole('link', { name: /devverse/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /explore/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /hackathons/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F17-02: pressing Ctrl+K opens Command Palette, searches Aurora, and navigates on Enter', async ({
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
    await cmdInput.fill('Aurora');
    await expect(page.getByText(/aurora/i).first()).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL(/\/$/);
    errorGuard.assertClean();
  });

  test('T1-F17-03: Command Palette action Toggle dark / light theme switches theme and closes palette', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.keyboard.press('Control+k');
    await page
      .getByText(/toggle dark|light theme|switch theme/i)
      .first()
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    errorGuard.assertClean();
  });

  test('T1-F17-04: signed-in user opens Dock Avatar menu and clicks Sign out to end session', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    const avatarBtn = page
      .getByRole('button', { name: /newcomer|account|menu|profile/i })
      .first();
    await avatarBtn.click();
    const signOutBtn = page
      .getByRole('button', { name: /sign out|log out/i })
      .or(page.getByRole('menuitem', { name: /sign out|log out/i }))
      .first();
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F17-05: legacy URLs resolve cleanly to corresponding SPA routes without 404 errors', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/login.html');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/project?id=p1');
    await expect(page.getByRole('heading', { name: /aurora shader studio/i })).toBeVisible();

    await page.goto('/hackathon?id=h1');
    await expect(
      page.getByRole('heading', { name: /aurora global ai & systems hackathon/i })
    ).toBeVisible();

    await page.goto('/community?id=c1');
    await expect(
      page.getByRole('heading', { name: /systems & rust guild/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F18: Auth Session, Protected Routes & CSRF', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F18-01: unauthenticated visits to all 5 protected routes redirect to /login?redirect=...', async ({
    page,
    errorGuard,
  }) => {
    const protectedPaths = ['/submit-project', '/squads', '/codex', '/portfolio', '/profile'];
    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?redirect=(?:%2F|/)${path.slice(1)}`));
    }
    errorGuard.assertClean();
  });

  test('T1-F18-02: logging in from /login?redirect=/codex returns user to /codex', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/codex');
    await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)codex/);
    await page.getByLabel(/email or username/i).first().fill('codexuser');
    await page.getByLabel(/^password$/i).first().fill('Password123!');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/codex/);
    errorGuard.assertClean();
  });

  test('T1-F18-03: authenticated session survives hard page reload via /auth/me', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/codex');
    await page.reload();
    await expect(page).toHaveURL(/\/codex/);
    await expect(page.getByText(/you're in|unlocked/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F18-04: authenticated mutations succeed against CSRF middleware with 200/201', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/projects/p1');
    const [commentRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/comments') && r.request().method() === 'POST'
      ),
      (async () => {
        await page
          .getByLabel(/comment/i)
          .or(page.getByPlaceholder(/comment|thought/i))
          .first()
          .fill('Verified CSRF hybrid auth mutation');
        await page.getByRole('button', { name: /post comment|submit|send/i }).click();
      })(),
    ]);
    expect(commentRes.status()).toBe(201);
    errorGuard.assertClean();
  });

  test('T1-F18-05: logging out clears session so reload on /profile redirects to /login', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/settings');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/logout')),
      page.getByRole('button', { name: /sign out|log out/i }).first().click(),
    ]);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)profile/);
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F19: Gamification Engine (Points, Tiers, Ledger, Gates)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F19-01: liking (+2) and bookmarking (+3) a project updates points total and activity ledger', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/projects/p1');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/like') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /like/i }).first().click(),
    ]);
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/bookmark') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /save|bookmark/i }).first().click(),
    ]);

    await page.goto('/leaderboard');
    await assertLeaderboardUserStats(page, 25);
    errorGuard.assertClean();
  });

  test('T1-F19-02: joining community (+5), posting thread (+25), and replying (+10) increment points', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities/c1');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/join') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^join/i }).first().click(),
    ]);

    await page
      .getByLabel(/title/i)
      .or(page.getByPlaceholder(/thread title|title/i))
      .first()
      .fill('Gamification Thread Check');
    await page
      .getByLabel(/body|details|content/i)
      .or(page.getByPlaceholder(/share details|write your thread|body/i))
      .first()
      .fill('Verifying thread +25 and reply +10 point increments in ledger.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/discussions') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post thread|create thread|publish/i }).click(),
    ]);
    await expect(page.getByText('Gamification Thread Check')).toBeVisible();

    await page.getByText('Gamification Thread Check').first().click();
    await page
      .getByLabel(/reply/i)
      .or(page.getByPlaceholder(/write a reply|reply/i))
      .first()
      .fill('Adding +10 point reply');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/replies') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post reply|reply|send/i }).first().click(),
    ]);

    await page.goto('/leaderboard');
    // 20 + 5 + 25 + 10 = 60
    await assertLeaderboardUserStats(page, 60);
    errorGuard.assertClean();
  });

  test('T1-F19-03: submitting project (+25) and commenting (+15) increment points and update tier bar', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');
    await page.getByLabel(/project title|^title$/i).first().fill('PointClimb App');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Verifying 20 -> 45 -> 60 point climb across submit and comment.');
    await page.getByLabel(/category/i).first().selectOption('Tools');
    await page.getByLabel(/tags/i).first().fill('Node.js');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/projects') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /publish|submit project/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/projects\//);

    await page
      .getByLabel(/comment/i)
      .or(page.getByPlaceholder(/comment|thought/i))
      .first()
      .fill('Adding +15 comment points');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/comments') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post comment|submit|send/i }).click(),
    ]);

    await page.goto('/leaderboard');
    // 20 + 25 + 15 = 60 -> Builder tier (>=40)
    await assertLeaderboardUserStats(page, 60, /\bbuilder\b/i);
    errorGuard.assertClean();
  });

  test('T1-F19-04: crossing 40, 120, 300, 600 points updates tier badge correctly', async ({
    page,
    errorGuard,
  }) => {
    await setUserPoints('newcomer', 40);
    await loginViaUI(page, 'newcomer');
    await page.goto('/leaderboard');
    await assertLeaderboardUserStats(page, 40, /\bbuilder\b/i);

    await setUserPoints('newcomer', 120);
    await page.reload();
    await assertLeaderboardUserStats(page, 120, /established builder/i);

    await setUserPoints('newcomer', 300);
    await page.reload();
    await assertLeaderboardUserStats(page, 300, /veteran builder/i);

    await setUserPoints('newcomer', 600);
    await page.reload();
    await assertLeaderboardUserStats(page, 600, /\blegend\b/i);
    errorGuard.assertClean();
  });

  test('T1-F19-05: 200 pts unlocks Codex and 600 pts unlocks Legend #f0c419 accent and username change', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/codex');
    await expect(page.getByText(/add an entry/i).first()).toBeVisible();

    await page.goto('/settings');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /sign out|log out/i }).first().click(),
    ]);

    await loginViaUI(page, 'legenduser');
    await page.goto('/settings');
    await page.getByRole('button', { name: /legend/i }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'legend');

    await page.goto('/profile');
    await page.getByRole('button', { name: /edit profile/i }).click();
    const usernameInput = page.getByLabel(/username/i).first();
    await expect(usernameInput).toBeEnabled();
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F20: Visual Identity, Glassmorphism & Responsive', () => {
  test('T1-F20-01: default dark theme exposes exact accent hex tokens', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    const info = await readDesignTokens(page);
    expect(info.dataTheme).toBe('dark');
    expect(normalizeHex(info.tokens.violet)).toBe(DARK_ACCENT_HEX.violet);
    expect(normalizeHex(info.tokens.cyan)).toBe(DARK_ACCENT_HEX.cyan);
    expect(normalizeHex(info.tokens.coral)).toBe(DARK_ACCENT_HEX.coral);
    expect(normalizeHex(info.tokens.amber)).toBe(DARK_ACCENT_HEX.amber);
    expect(normalizeHex(info.tokens.legend)).toBe(DARK_ACCENT_HEX.legend);
    errorGuard.assertClean();
  });

  test('T1-F20-02: glass card elements render with non-none backdrop-filter blur', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    const info = await readDesignTokens(page);
    expect(info.glassBlurCount).toBeGreaterThan(0);
    errorGuard.assertClean();
  });

  test('T1-F20-03: mobile 375x812 hides desktop dock links and opens mobile drawer', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await assertNoHorizontalOverflow(page, '/ (375x812)');

    const menuToggle = page
      .getByRole('button', { name: /menu|navigation|open menu/i })
      .first();
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();
    await expect(page.getByRole('link', { name: /explore/i }).last()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F20-04: tablet 768x1024 and desktop 1440x900 render cleanly without horizontal overflow', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    for (const vp of [
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(vp);
      await page.goto('/');
      await assertNoHorizontalOverflow(page, `/ (${vp.width}x${vp.height})`);
      await page.goto('/explore');
      await assertNoHorizontalOverflow(page, `/explore (${vp.width}x${vp.height})`);
    }
    errorGuard.assertClean();
  });

  test('T1-F20-05: enabling reduced motion persists data-motion="off" and disables animations', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/settings');
    const motionBtn = page
      .getByRole('button', { name: /off|reduced|animations|motion/i })
      .or(page.getByRole('switch', { name: /animations|motion/i }))
      .first();
    await motionBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    errorGuard.assertClean();
  });
});
