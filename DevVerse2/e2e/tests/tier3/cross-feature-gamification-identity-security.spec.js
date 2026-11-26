const {
  test,
  expect,
  SEED_PASSWORD,
  loginViaUI,
  mockGitHubApi,
  assertLeaderboardUserStats,
} = require('../../fixtures/test-fixtures');

test.describe('Tier 3 — Cross-Feature Gamification, Identity & Security (T3-13..T3-24)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T3-13 (F9+F8): Create thread on /communities/:id -> /communities Recent discussions shows it', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities/c1');
    await page.getByRole('button', { name: /^join/i }).first().click();
    await page
      .getByLabel(/title/i)
      .or(page.getByPlaceholder(/thread title|title/i))
      .first()
      .fill('Cross-Page Thread Propagation');
    await page
      .getByLabel(/body|details|content/i)
      .or(page.getByPlaceholder(/share details|write your thread|body/i))
      .first()
      .fill('Verifying discussion thread appears in Recent discussions on /communities.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/discussions') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post thread|create thread|publish/i }).click(),
    ]);
    await expect(page.getByText('Cross-Page Thread Propagation')).toBeVisible();

    await page.goto('/communities');
    await expect(
      page.getByText('Cross-Page Thread Propagation').first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-14 (F10+F19): User at 180 pts submits project (+25 -> 205 pts) -> Codex unlocks & publishes (+25)', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'nearcodex');
    await page.goto('/codex');
    await expect(page.getByText(/sealed|locked|200/i).first()).toBeVisible();

    await page.goto('/submit-project');
    await page.getByLabel(/project title|^title$/i).first().fill('Unlock Codex Project');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Shipping a new project to cross the 200-point Codex unlock gate.');
    await page.getByLabel(/category/i).first().selectOption('Backend');
    await page.getByLabel(/tags/i).first().fill('Node.js, MongoDB');
    await page.getByRole('button', { name: /publish|submit project/i }).click();
    await expect(page).toHaveURL(/\/projects\//);

    await page.goto('/codex');
    await expect(page.getByText(/add an entry/i).first()).toBeVisible();
    await page.getByLabel(/title/i).first().fill('Unlocked at 205 Points Field Note');
    await page.getByLabel(/category/i).first().selectOption('Architecture');
    await page
      .getByLabel(/problem/i)
      .first()
      .fill('Documenting how crossing 200 points immediately unlocks Codex authoring.');
    await page.getByLabel(/tried|what didn/i).first().fill('Tried accessing Codex at 180 points.');
    await page.getByLabel(/^fix$/i).first().fill('Submitted a project for +25 points.');
    await page.getByLabel(/lesson/i).first().fill('Gamification thresholds stay consistent across routes.');
    await page.getByRole('button', { name: /publish|add entry|submit/i }).click();
    await expect(
      page.getByText('Unlocked at 205 Points Field Note').first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-15 (F11+F10): Sealed Codex link navigates to /leaderboard showing total and points breakdown', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/codex');
    await page
      .getByRole('link', { name: /leaderboard|how points work|earn points/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/leaderboard/);
    await expect(page.getByText(/how points work/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-16 (F14+F20+F19): 600+ Legend sets Light + Legend accent + Motion off -> persists across routes', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'legenduser');
    await page.goto('/settings');
    await page.getByRole('button', { name: /^light$/i }).first().click();
    await page.getByRole('button', { name: /legend/i }).first().click();
    await page
      .getByRole('button', { name: /off|reduced|animations|motion/i })
      .or(page.getByRole('switch', { name: /animations|motion/i }))
      .first()
      .click();

    for (const route of ['/', '/explore', '/leaderboard']) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('html')).toHaveAttribute('data-accent', 'legend');
      await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    }
    errorGuard.assertClean();
  });

  test('T3-17 (F13+F14+F19): Legend claims one-time username change -> /portfolio/:newUsername & /leaderboard reflect it', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'legenduser');
    await page.goto('/profile');
    await page.getByRole('button', { name: /edit profile/i }).click();
    await page.getByLabel(/username/i).first().fill('apex_legend');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/users/username')),
      page.getByRole('button', { name: /save|update username/i }).first().click(),
    ]);

    await page.goto('/portfolio/apex_legend');
    await expect(page.getByText(/legend architect/i).first()).toBeVisible();

    await page.goto('/leaderboard');
    await expect(page.getByText(/apex_legend/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-18 (F16+F18+F13): Signup on /signup?redirect=/profile lands on /profile as Newcomer (20 pts)', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/signup?redirect=/profile');
    await page.getByLabel(/full name|^name$/i).first().fill('Direct Profile User');
    await page.getByLabel(/username/i).first().fill('directprof1');
    await page.getByLabel(/email/i).first().fill('directprof1@devverse.test');
    await page.getByLabel(/^password$/i).first().fill('StrongPass9!');
    await page.getByLabel(/confirm password/i).first().fill('StrongPass9!');
    const terms = page.getByRole('checkbox').first();
    if (await terms.isVisible().catch(() => false)) await terms.check();
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByText(/newcomer/i).first()).toBeVisible();
    await expect(page.getByText(/\b20\b/).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-19 (F15+F14): Change password in Settings -> Sign out -> Login fails with old & succeeds with new', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await loginViaUI(page, 'newcomer');
    await page.goto('/settings');
    await page.getByLabel(/current password/i).fill(SEED_PASSWORD);
    await page.getByLabel(/new password/i).first().fill('RotatedPass9!');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/auth/change-password') && r.request().method() === 'PUT'
      ),
      page.getByRole('button', { name: /change password|update password/i }).click(),
    ]);

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /sign out|log out/i }).first().click(),
    ]);
    await page.goto('/login');
    await page.getByLabel(/email or username/i).first().fill('newcomer');
    await page.getByLabel(/^password$/i).first().fill(SEED_PASSWORD);
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/login') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^sign in$/i }).click(),
    ]);
    await expect(page.getByText(/invalid email or password/i).first()).toBeVisible();

    await loginViaUI(page, 'newcomer', 'RotatedPass9!');
    await expect(page).not.toHaveURL(/\/login/);
    errorGuard.assertClean();
  });

  test('T3-20 (F17+F18): Signed-out Ctrl+K selects Submit a project -> /login?redirect=/submit-project -> login lands on /submit-project', async ({
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
    await cmdInput.fill('Submit');
    await page.getByText(/submit.*project/i).first().click();

    await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)submit-project/);
    await page.getByLabel(/email or username/i).first().fill('newcomer');
    await page.getByLabel(/^password$/i).first().fill(SEED_PASSWORD);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/submit-project/);
    errorGuard.assertClean();
  });

  test('T3-21 (F17+F20): Toggle Dark/Light via Dock button -> Settings reflects updated theme', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    const themeToggle = page
      .getByRole('button', { name: /theme|light mode|dark mode|toggle theme/i })
      .first();
    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.goto('/settings');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    errorGuard.assertClean();
  });

  test('T3-22 (F12+F19): Complete Portfolio milestones -> awards +30 pts and unlocks Early Adopter on Profile', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/portfolio');
    await page.getByLabel(/bio/i).first().fill('Complete portfolio bio exceeding twenty chars.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/portfolios/me') && r.request().method() === 'PUT'
      ),
      page.getByRole('button', { name: /save portfolio|save changes|save/i }).first().click(),
    ]);

    await page.goto('/leaderboard');
    // 20 + 30 milestone = 50
    await assertLeaderboardUserStats(page, 50);

    await page.goto('/profile');
    const earlyAdopterBadge = page
      .locator('section, article, div')
      .filter({ hasText: /early adopter/i })
      .last();
    await expect(earlyAdopterBadge).toBeVisible();
    await expect(earlyAdopterBadge).not.toContainText(/locked/i);
    errorGuard.assertClean();
  });

  test('T3-23 (F13+F7): Follow & Message developer from /profile/:username -> /squads reflects state', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/profile/kmori');
    await page.getByRole('button', { name: /^follow$/i }).first().click();
    await expect(page.getByRole('button', { name: /following/i }).first()).toBeVisible();

    await page.goto('/squads');
    await expect(page.getByText(/kmori|kai mori/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-24 (F3+F19): Owner edits project category on /projects/:id -> /explore filter reflects new category', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/projects/p10');
    await page.getByRole('button', { name: /edit category/i }).first().click();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/projects/') && r.request().method() === 'PUT'
      ),
      (async () => {
        await page.getByRole('combobox').first().selectOption('Backend');
        const saveBtn = page.getByRole('button', { name: /^save$/i }).first();
        if (await saveBtn.isVisible().catch(() => false)) await saveBtn.click();
      })(),
    ]);

    await page.goto('/explore');
    await page.getByRole('button', { name: /^backend$/i }).first().click();
    await expect(page.getByText(/chronicle notes engine/i).first()).toBeVisible();
    errorGuard.assertClean();
  });
});
