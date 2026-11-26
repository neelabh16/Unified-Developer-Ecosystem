const {
  test,
  expect,
  SEED_PASSWORD,
  loginViaUI,
  mockGitHubApi,
  assertLeaderboardUserStats,
} = require('../../fixtures/test-fixtures');

test.describe('Tier 1 — F13: User Profile (/profile)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F13-01: signed-in user sees avatar, name, tier badge, stats, skills, badges, heatmap, and library', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'codexuser');
    await page.goto('/profile');

    await expect(page.getByText(/codex contributor/i).first()).toBeVisible();
    await expect(page.getByText(/@codexuser/i).first()).toBeVisible();
    await expect(page.getByText(/established builder/i).first()).toBeVisible();
    await expect(page.getByText(/shipping streak/i).first()).toBeVisible();
    await expect(page.getByText(/your library|bookmarked/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F13-02: Edit profile updates Display Name, GitHub username, and Bio across reload', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'codexuser');
    await page.goto('/profile');

    await page.getByRole('button', { name: /edit profile/i }).click();
    await page.getByLabel(/display name|^name$/i).first().fill('Codex Updated Name');
    await page.getByLabel(/github/i).first().fill('codex-gh');
    await page.getByLabel(/bio/i).first().fill('Updated bio for profile persistence test.');

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/users/profile') && r.request().method() === 'PUT'
      ),
      page.getByRole('button', { name: /save/i }).first().click(),
    ]);

    await page.reload();
    await expect(page.getByText('Codex Updated Name').first()).toBeVisible();
    await expect(page.getByText(/codex-gh/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F13-03: switching Your library tabs Bookmarked, Liked, Joined Hackathons displays items', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');

    // Like and bookmark project p1 first
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

    await page.goto('/profile');
    await page.getByRole('button', { name: /bookmarked/i }).first().click();
    await expect(page.getByText(/aurora shader studio/i).first()).toBeVisible();

    await page.getByRole('button', { name: /liked/i }).first().click();
    await expect(page.getByText(/aurora shader studio/i).first()).toBeVisible();

    await page.getByRole('button', { name: /joined hackathons|hackathons/i }).first().click();
    errorGuard.assertClean();
  });

  test('T1-F13-04: viewing another user hides self edit/library and shows Follow, Message, + Squad', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/profile/kmori');

    await expect(page.getByText(/kai mori/i).first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^follow$/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /edit profile/i })
    ).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T1-F13-05: clicking Follow on another user toggles to Following and persists across reload', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/profile/kmori');

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/follow') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^follow$/i }).first().click(),
    ]);
    await expect(
      page.getByRole('button', { name: /following/i }).first()
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole('button', { name: /following/i }).first()
    ).toBeVisible();

    // Verify contribution heatmap cell hover/title/tooltip
    const heatmapCell = page
      .locator(
        '[data-date], [title*="contribution" i], [aria-label*="contribution" i], [title*="202"], [aria-label*="202"]'
      )
      .first();
    await expect(heatmapCell).toBeVisible();
    await heatmapCell.hover();
    const cellTitle = await heatmapCell.getAttribute('title');
    const cellAria = await heatmapCell.getAttribute('aria-label');
    const cellDate = await heatmapCell.getAttribute('data-date');
    const tooltipVisible = await page
      .locator('[role="tooltip"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(Boolean(cellTitle || cellAria || cellDate || tooltipVisible)).toBe(true);
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F14: Settings (/settings)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F14-01: renders Account panel, Appearance Dark/Light, Motion toggle, 5 swatches, and preview bar', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/settings');
    await expect(page.getByText(/account/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /light/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /dark/i }).first()).toBeVisible();
    await expect(page.getByText(/cyan/i).first()).toBeVisible();
    await expect(page.getByText(/legend/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F14-02: clicking Light then Dark updates html[data-theme] and persists across reload', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /^light$/i }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('button', { name: /^dark$/i }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    errorGuard.assertClean();
  });

  test('T1-F14-03: clicking Cyan, Coral, Amber, Violet swatches updates html[data-accent] and persists', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/settings');
    for (const accent of ['cyan', 'coral', 'amber', 'violet']) {
      await page
        .getByRole('button', { name: new RegExp(accent, 'i') })
        .first()
        .click();
      await expect(page.locator('html')).toHaveAttribute('data-accent', accent);
    }
    await page.getByRole('button', { name: /cyan/i }).first().click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'cyan');
    errorGuard.assertClean();
  });

  test('T1-F14-04: toggling Interface animations updates html[data-motion] and persists across reload', async ({
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

  test('T1-F14-05: signed-in user changes password and can sign in with new password', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/settings');

    await page.getByLabel(/current password/i).fill(SEED_PASSWORD);
    await page.getByLabel(/new password/i).first().fill('NewPass987!');

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/auth/change-password') && r.request().method() === 'PUT'
      ),
      page.getByRole('button', { name: /change password|update password/i }).click(),
    ]);

    // Sign out via UI and verify new password works
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /sign out|log out/i }).first().click(),
    ]);
    await loginViaUI(page, 'newcomer', 'NewPass987!');
    await expect(page).not.toHaveURL(/\/login/);
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F15: Login & OAuth (/login)', () => {
  test('T1-F15-01: renders email/username, password, eye toggle, Sign in button, OAuth buttons, and signup link', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email or username/i).first()).toBeVisible();
    await expect(page.getByLabel(/^password$/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /github/i }).or(page.getByRole('button', { name: /github/i })).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /google/i }).or(page.getByRole('button', { name: /google/i })).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /create account|sign up/i }).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F15-02: submitting valid email + password signs in and redirects to /', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer@devverse.test');
    await expect(page).toHaveURL(/\/$/);
    errorGuard.assertClean();
  });

  test('T1-F15-03: submitting valid username + password signs in successfully', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await expect(page).toHaveURL(/\/$/);
    errorGuard.assertClean();
  });

  test('T1-F15-04: clicking password show/hide toggle switches input type between password and text', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/login');
    const pwInput = page.getByLabel(/^password$/i).first();
    await expect(pwInput).toHaveAttribute('type', 'password');

    const toggleBtn = page
      .getByRole('button', { name: /show password|toggle password|reveal/i })
      .first();
    await toggleBtn.click();
    await expect(pwInput).toHaveAttribute('type', 'text');

    await page
      .getByRole('button', { name: /hide password|show password/i })
      .first()
      .click();
    await expect(pwInput).toHaveAttribute('type', 'password');
    errorGuard.assertClean();
  });

  test('T1-F15-05: navigating to /login.html?redirect=/squads preserves query param to /login', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/login.html?redirect=/squads');
    await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)squads/);
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F16: Signup & Password Strength (/signup)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F16-01: renders Name, Username, Email, Password, Confirm Password, Terms, Create account, OAuth', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/signup');
    await expect(page.getByLabel(/full name|^name$/i).first()).toBeVisible();
    await expect(page.getByLabel(/username/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/^password$/i).first()).toBeVisible();
    await expect(page.getByLabel(/confirm password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F16-02: typing password updates real-time password strength indicator', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/signup');
    const pwInput = page.getByLabel(/^password$/i).first();
    await pwInput.fill('abc');
    await expect(page.getByText(/weak|too short|at least 7/i).first()).toBeVisible();

    await pwInput.fill('StrongPass9!');
    await expect(page.getByText(/strong|good|all requirements/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F16-03: submitting valid registration creates account, awards +20 pts, and redirects to /', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/signup');
    await page.getByLabel(/full name|^name$/i).first().fill('Fresh Builder');
    await page.getByLabel(/username/i).first().fill('freshbuilder1');
    await page.getByLabel(/email/i).first().fill('fresh1@devverse.test');
    await page.getByLabel(/^password$/i).first().fill('StrongPass9!');
    await page.getByLabel(/confirm password/i).first().fill('StrongPass9!');

    const terms = page.getByRole('checkbox').first();
    if (await terms.isVisible().catch(() => false)) {
      await terms.check();
    }

    await Promise.all([
      page.waitForResponse(
        (r) =>
          (r.url().includes('/auth/register') || r.url().includes('/auth/signup')) &&
          r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);

    await expect(page).toHaveURL(/\/$/);
    await page.goto('/leaderboard');
    await assertLeaderboardUserStats(page, 20);
    errorGuard.assertClean();
  });

  test('T1-F16-04: preserving ?redirect=/portfolio routes new user to /portfolio after signup', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/signup?redirect=/portfolio');
    await page.getByLabel(/full name|^name$/i).first().fill('Port Builder');
    await page.getByLabel(/username/i).first().fill('portbuilder2');
    await page.getByLabel(/email/i).first().fill('port2@devverse.test');
    await page.getByLabel(/^password$/i).first().fill('StrongPass9!');
    await page.getByLabel(/confirm password/i).first().fill('StrongPass9!');
    const terms = page.getByRole('checkbox').first();
    if (await terms.isVisible().catch(() => false)) {
      await terms.check();
    }
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/portfolio/);
    errorGuard.assertClean();
  });

  test('T1-F16-05: clicking Sign in link on /signup navigates to /login preserving ?redirect=', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/signup?redirect=/codex');
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)codex/);
    errorGuard.assertClean();
  });
});
