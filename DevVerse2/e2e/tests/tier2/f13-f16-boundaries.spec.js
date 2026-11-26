const {
  test,
  expect,
  SEED_PASSWORD,
  loginViaUI,
  mockGitHubApi,
  assertValidationFeedback,
  setUserPoints,
} = require('../../fixtures/test-fixtures');

test.describe('Tier 2 — F13: Profile & Legend Username Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F13-01: user with 599 pts has username field disabled and API PUT /users/username returns 403', async ({
    page,
    api,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'nearlegend');
    await page.goto('/profile');
    await page.getByRole('button', { name: /edit profile/i }).click();

    const usernameInput = page.getByLabel(/username/i).first();
    await expect(usernameInput).toBeDisabled();
    await expect(page.getByText(/600|legend/i).first()).toBeVisible();

    await api.login('nearlegend');
    const res = await api.request('PUT', '/users/username', {
      body: { newUsername: 'blocked599' },
    });
    expect(res.status).toBe(403);
    errorGuard.assertClean();
  });

  test('T2-F13-02: Legend user (>=600 pts) invalid username (<3 or bad chars) blocked inline', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'legenduser');
    await page.goto('/profile');
    await page.getByRole('button', { name: /edit profile/i }).click();

    let usernamePutCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/users/username') && req.method() === 'PUT') {
        usernamePutCalled = true;
      }
    });

    const usernameInput = page.getByLabel(/username/i).first();
    await usernameInput.fill('ab');
    await page.getByRole('button', { name: /save|update username/i }).first().click();
    await expect(page).toHaveURL(/\/profile/);
    await assertValidationFeedback(
      page,
      usernameInput,
      /at least 3|invalid|letters|numbers|underscores|3.*24/i
    );

    await usernameInput.fill('bad user!');
    await page.getByRole('button', { name: /save|update username/i }).first().click();
    await expect(page).toHaveURL(/\/profile/);
    await assertValidationFeedback(
      page,
      usernameInput,
      /at least 3|invalid|letters|numbers|underscores|3.*24/i
    );
    expect(usernamePutCalled).toBe(false);
    await expect(page.getByText(/@legenduser/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F13-03: Legend user changing username to an already-taken handle returns 409 error', async ({
    page,
    api,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await mockGitHubApi(page);
    await loginViaUI(page, 'legenduser');
    await page.goto('/profile');
    await page.getByRole('button', { name: /edit profile/i }).click();

    const usernameInput = page.getByLabel(/username/i).first();
    await usernameInput.fill('kmori');
    await page.getByRole('button', { name: /save|update username/i }).first().click();
    await expect(
      page.getByText(/already taken|exists/i).first()
    ).toBeVisible();

    await api.login('legenduser');
    const res = await api.request('PUT', '/users/username', {
      body: { newUsername: 'kmori' },
    });
    expect(res.status).toBe(409);
    errorGuard.assertClean();
  });

  test('T2-F13-04: Legend user uses one-time username change; second attempt disabled and API returns 400', async ({
    page,
    api,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'legenduser');
    await page.goto('/profile');
    await page.getByRole('button', { name: /edit profile/i }).click();

    const usernameInput = page.getByLabel(/username/i).first();
    await usernameInput.fill('legend_renamed');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/users/username') && r.request().method() === 'PUT'
      ),
      page.getByRole('button', { name: /save|update username/i }).first().click(),
    ]);

    await page.reload();
    await page.getByRole('button', { name: /edit profile/i }).click();
    await expect(page.getByLabel(/username/i).first()).toBeDisabled();

    await api.login('legend_renamed');
    const secondRes = await api.request('PUT', '/users/username', {
      body: { newUsername: 'legend_second' },
    });
    expect(secondRes.status).toBe(400);
    errorGuard.assertClean();
  });

  test('T2-F13-05: self Follow button disabled or absent and API POST /users/:self/follow returns 400', async ({
    page,
    api,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/profile');
    const followBtn = page.getByRole('button', { name: /^follow$/i });
    if ((await followBtn.count()) > 0) {
      await expect(followBtn.first()).toBeDisabled();
    }

    await api.login('newcomer');
    const res = await api.request('POST', '/users/newcomer/follow');
    expect(res.status).toBe(400);
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F14: Settings Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F14-01: user with 599 pts clicking Legend swatch sees lock warning and accent stays unchanged', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'nearlegend');
    await page.goto('/settings');
    await page.getByRole('button', { name: /legend/i }).first().click();
    await expect(page.locator('html')).not.toHaveAttribute('data-accent', 'legend');
    await expect(page.getByText(/600|legend tier|locked/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F14-02: user at 600 pts unlocks Legend swatch and sets data-accent="legend"', async ({
    page,
    errorGuard,
  }) => {
    await setUserPoints('nearlegend', 600);
    await loginViaUI(page, 'nearlegend');
    await page.goto('/settings');
    await page.getByRole('button', { name: /legend/i }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'legend');
    errorGuard.assertClean();
  });

  test('T2-F14-03: Change Password with wrong current password displays 401 error', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await loginViaUI(page, 'newcomer');
    await page.goto('/settings');
    await page.getByLabel(/current password/i).fill('WrongPass999!');
    await page.getByLabel(/new password/i).first().fill('ValidNewPass9!');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/change-password')),
      page.getByRole('button', { name: /change password|update password/i }).click(),
    ]);
    await expect(
      page.getByText(/does not match|incorrect|invalid/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F14-04: Change Password with new password <7 chars blocked client/server', async ({
    page,
    api,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/settings');
    await page.getByLabel(/current password/i).fill(SEED_PASSWORD);
    await page.getByLabel(/new password/i).first().fill('Ab1!');
    await page.getByRole('button', { name: /change password|update password/i }).click();
    await expect(
      page.getByText(/at least 7|too short|7 characters/i).first()
    ).toBeVisible();

    await api.login('newcomer');
    const res = await api.request('PUT', '/auth/change-password', {
      body: { currentPassword: SEED_PASSWORD, newPassword: 'Ab1!' },
    });
    expect(res.status).toBe(400);
    errorGuard.assertClean();
  });

  test('T2-F14-05: signed-out user changes Dark/Light & Motion and preferences persist across reload', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /^light$/i }).first().click();
    await page
      .getByRole('button', { name: /off|reduced|animations|motion/i })
      .or(page.getByRole('switch', { name: /animations|motion/i }))
      .first()
      .click();

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F15: Login & OAuth Boundaries', () => {
  test('T2-F15-01: submitting empty email/username & password shows inline errors without request', async ({
    page,
    errorGuard,
  }) => {
    let loginApiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/auth/login')) loginApiCalled = true;
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(
      page.getByText(/enter your|required|email or username/i).first()
    ).toBeVisible();
    expect(loginApiCalled).toBe(false);
    errorGuard.assertClean();
  });

  test('T2-F15-02: wrong password shows 401 notice Invalid email or password', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await page.goto('/login');
    await page.getByLabel(/email or username/i).first().fill('newcomer');
    await page.getByLabel(/^password$/i).first().fill('TotallyWrong999!');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login')),
      page.getByRole('button', { name: /^sign in$/i }).click(),
    ]);
    await expect(
      page.getByText(/invalid email or password|invalid credentials/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F15-03: OAuth callback ?oauth_error=github_credentials_missing opens OAuth Setup Modal', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/login?oauth_error=github_credentials_missing&provider=github');
    await expect(
      page.getByText(/oauth|github|credentials|setup/i).first()
    ).toBeVisible();
    const testConnectBtn = page
      .getByRole('button', { name: /test connect|connect/i })
      .first();
    if (await testConnectBtn.isVisible().catch(() => false)) {
      await testConnectBtn.click();
      await expect(
        page.getByText(/enter a github|handle|required/i).first()
      ).toBeVisible();
    }
    errorGuard.assertClean();
  });

  test('T2-F15-04: OAuth callback ?oauth_error=access_denied displays safe error notice', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/login?oauth_error=access_denied');
    await expect(
      page.getByText(/access_denied|cancelled|denied|oauth/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F15-05: already authenticated user navigating to /login auto-redirects away', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/login');
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F16: Signup Validation Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F16-01: password boundaries (<7, no upper, no number, no special) rejected', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/signup');
    await page.getByLabel(/full name|^name$/i).first().fill('Test Builder');
    await page.getByLabel(/username/i).first().fill('pwtest1');
    await page.getByLabel(/email/i).first().fill('pwtest1@devverse.test');

    const pwInput = page.getByLabel(/^password$/i).first();
    const badPasswords = ['Aa1!aa', 'aa1!aaaa', 'Aa!aaaaa', 'Aa1aaaaa'];
    for (const pw of badPasswords) {
      await pwInput.fill(pw);
      await page.getByLabel(/confirm password/i).first().fill(pw);
      await page.getByRole('button', { name: /create account/i }).click();
      await expect(page).toHaveURL(/\/signup/);
      await assertValidationFeedback(
        page,
        pwInput,
        /at least 7|uppercase|number|special|password|strong/i
      );
    }
    errorGuard.assertClean();
  });

  test('T2-F16-02: confirm password mismatch shows error and blocks submission', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/signup');
    await page.getByLabel(/full name|^name$/i).first().fill('Mismatch User');
    await page.getByLabel(/username/i).first().fill('mismatch1');
    await page.getByLabel(/email/i).first().fill('mismatch1@devverse.test');
    await page.getByLabel(/^password$/i).first().fill('StrongPass9!');
    await page.getByLabel(/confirm password/i).first().fill('DifferentPass9!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(
      page.getByText(/don't match|do not match|match/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F16-03: username boundaries (<3, >24, invalid chars) rejected by validation', async ({
    page,
    api,
    errorGuard,
  }) => {
    await page.goto('/signup');
    await page.getByLabel(/full name|^name$/i).first().fill('Bad Handle');
    const usernameInput = page.getByLabel(/username/i).first();
    await usernameInput.fill('ab');
    await page.getByLabel(/email/i).first().fill('badhandle@devverse.test');
    await page.getByLabel(/^password$/i).first().fill('StrongPass9!');
    await page.getByLabel(/confirm password/i).first().fill('StrongPass9!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/signup/);
    await assertValidationFeedback(
      page,
      usernameInput,
      /at least 3|username|characters|invalid/i
    );

    const res = await api.register({
      name: 'Too Long',
      username: 'u'.repeat(25),
      email: 'toolong@devverse.test',
    });
    expect(res.status).toBe(400);
    errorGuard.assertClean();
  });

  test('T2-F16-04: duplicate email or duplicate username returns 409 and displays inline error', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await page.goto('/signup');
    await page.getByLabel(/full name|^name$/i).first().fill('Dup User');
    await page.getByLabel(/username/i).first().fill('newcomer');
    await page.getByLabel(/email/i).first().fill('newcomer@devverse.test');
    await page.getByLabel(/^password$/i).first().fill('StrongPass9!');
    await page.getByLabel(/confirm password/i).first().fill('StrongPass9!');
    const terms = page.getByRole('checkbox').first();
    if (await terms.isVisible().catch(() => false)) {
      await terms.check();
    }
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/')),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);
    await expect(
      page.getByText(/already exists|already taken/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F16-05: name 1 char or invalid email blocked with inline validation error', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/signup');
    const nameInput = page.getByLabel(/full name|^name$/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    await nameInput.fill('A');
    await page.getByLabel(/username/i).first().fill('validhandle1');
    await emailInput.fill('notanemail');
    await page.getByLabel(/^password$/i).first().fill('StrongPass9!');
    await page.getByLabel(/confirm password/i).first().fill('StrongPass9!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/signup/);
    await assertValidationFeedback(
      page,
      nameInput,
      /at least 2|valid email|email|name|required/i
    );
    errorGuard.assertClean();
  });
});
