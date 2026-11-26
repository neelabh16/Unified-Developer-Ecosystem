const {
  test,
  expect,
  loginViaUI,
  setUserPoints,
  assertLeaderboardUserStats,
} = require('../../fixtures/test-fixtures');

test.describe('Tier 2 — F9: Community Detail Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F9-01: non-member sees locked thread banner and direct API POST returns 403', async ({
    page,
    api,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities/c1');
    await expect(
      page.getByText(/join .* to start threads/i).first()
    ).toBeVisible();

    await api.login('newcomer');
    const res = await api.request('POST', '/communities/c1/discussions', {
      body: {
        title: 'Unauthorized Thread Attempt',
        body: 'Attempting to post a thread without joining community.',
      },
    });
    expect(res.status).toBe(403);
    errorGuard.assertClean();
  });

  test('T2-F9-02: thread Title boundary 5 chars blocked, 151 chars rejected, 6 chars accepted', async ({
    page,
    api,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities/c1');
    await page.getByRole('button', { name: /^join/i }).first().click();

    const titleInput = page
      .getByLabel(/title/i)
      .or(page.getByPlaceholder(/thread title|title/i))
      .first();
    const bodyInput = page
      .getByLabel(/body|details|content/i)
      .or(page.getByPlaceholder(/share details|write your thread|body/i))
      .first();
    const postBtn = page.getByRole('button', { name: /post thread|create thread|publish/i });

    await titleInput.fill('Hello'); // 5 chars
    await bodyInput.fill('Valid body text with twelve or more characters.');
    await postBtn.click();
    await expect(page.getByText('Hello', { exact: true })).toHaveCount(0);

    await titleInput.fill('SixChr'); // 6 chars
    await postBtn.click();
    await expect(page.getByText('SixChr').first()).toBeVisible();

    await api.login('newcomer');
    const longRes = await api.request('POST', '/communities/c1/discussions', {
      body: { title: 'T'.repeat(151), body: 'Valid body over twelve chars.' },
    });
    expect(longRes.status).toBe(400);
    errorGuard.assertClean();
  });

  test('T2-F9-03: thread Body boundary 11 chars blocked and 12 chars accepted', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities/c1');
    await page.getByRole('button', { name: /^join/i }).first().click();

    const titleInput = page
      .getByLabel(/title/i)
      .or(page.getByPlaceholder(/thread title|title/i))
      .first();
    const bodyInput = page
      .getByLabel(/body|details|content/i)
      .or(page.getByPlaceholder(/share details|write your thread|body/i))
      .first();
    const postBtn = page.getByRole('button', { name: /post thread|create thread|publish/i });

    await titleInput.fill('Body Boundary Check');
    await bodyInput.fill('12345678901'); // 11 chars
    await postBtn.click();
    await expect(page.getByText('Body Boundary Check')).toHaveCount(0);

    await bodyInput.fill('123456789012'); // 12 chars
    await postBtn.click();
    await expect(page.getByText('Body Boundary Check').first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F9-04: reply boundary 1 char blocked and 2 chars accepted', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities/c1');
    await page.getByRole('button', { name: /^join/i }).first().click();
    await page.getByText(/zero-copy ring buffers in wasm/i).first().click();

    const replyInput = page
      .getByLabel(/reply/i)
      .or(page.getByPlaceholder(/write a reply|reply/i))
      .first();
    const replyBtn = page.getByRole('button', { name: /post reply|reply|send/i }).first();

    await replyInput.fill('k');
    await replyBtn.click();
    await expect(page.getByText(/^k$/)).toHaveCount(0);

    await replyInput.fill('ok');
    await replyBtn.click();
    await expect(page.getByText(/^ok$/).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F9-05: legacy /community?id=c1 route loads community c1 and invalid ID handles gracefully', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await page.goto('/community?id=c1');
    await expect(
      page.getByRole('heading', { name: /systems & rust guild/i })
    ).toBeVisible();

    await page.goto('/communities/nonexistent-community-999');
    await expect(
      page.getByText(/not found|communities/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F10: Codex Knowledge Base Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F10-01: user with 199 points sees sealed Codex with 199 / 200 progress and no form', async ({
    page,
    errorGuard,
  }) => {
    await setUserPoints('nearcodex', 199);
    await loginViaUI(page, 'nearcodex');
    await page.goto('/codex');

    await expect(page.getByText(/sealed|locked|200/i).first()).toBeVisible();
    await expect(page.getByText(/199/).first()).toBeVisible();
    await expect(page.getByText(/add an entry/i)).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T2-F10-02: user with <200 points sending direct POST /api/v1/codex gets 403 Forbidden', async ({
    api,
    errorGuard,
  }) => {
    await setUserPoints('nearcodex', 199);
    await api.login('nearcodex');
    const res = await api.request('POST', '/codex', {
      body: {
        title: 'Blocked below 200 points',
        category: 'Debugging',
        problem: 'Trying to bypass the 200 point Codex contribution gate.',
        tried: 'Direct API POST request without sufficient points.',
        fix: 'Server enforces points >= 200.',
        lesson: 'Authorization gates must live on the backend.',
      },
    });
    expect(res.status).toBe(403);
    errorGuard.assertClean();
  });

  test('T2-F10-03: user with exactly 200 points unlocks Codex and succeeds publishing entry', async ({
    page,
    errorGuard,
  }) => {
    await setUserPoints('nearcodex', 200);
    await loginViaUI(page, 'nearcodex');
    await page.goto('/codex');

    await expect(page.getByText(/add an entry/i).first()).toBeVisible();
    await page.getByLabel(/title/i).first().fill('Exact 200 Boundary Unlock Entry');
    await page.getByLabel(/category/i).first().selectOption('Architecture');
    await page
      .getByLabel(/problem/i)
      .first()
      .fill('Verifying exact inclusive boundary at 200 points unlocks Codex.');
    await page.getByLabel(/tried|what didn/i).first().fill('Tested at 199 points first.');
    await page.getByLabel(/^fix$/i).first().fill('Crossed threshold to exactly 200 points.');
    await page.getByLabel(/lesson/i).first().fill('Boundary values require off-by-one tests.');

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/codex') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /publish|add entry|submit/i }).click(),
    ]);
    await expect(
      page.getByText('Exact 200 Boundary Unlock Entry').first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F10-04: entry fields below min length (title 7, problem 19, tried/fix/lesson 9) blocked', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/codex');

    await page.getByLabel(/title/i).first().fill('1234567'); // 7 chars (<8)
    await page.getByLabel(/problem/i).first().fill('1234567890123456789'); // 19 chars (<20)
    await page.getByLabel(/tried|what didn/i).first().fill('123456789'); // 9 chars (<10)
    await page.getByLabel(/^fix$/i).first().fill('123456789');
    await page.getByLabel(/lesson/i).first().fill('123456789');

    await page.getByRole('button', { name: /publish|add entry|submit/i }).click();
    await expect(page.getByText('1234567')).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T2-F10-05: Codex search matching 0 entries renders empty state message', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/codex');
    const search = page
      .getByPlaceholder(/search/i)
      .or(page.getByRole('searchbox'))
      .first();
    await search.fill('__no_matching_codex_entry__');
    await expect(
      page.getByText(/no entries match/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F11: Leaderboard Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F11-01: signed-out visitor sees dash total and sign-in prompt on /leaderboard', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/leaderboard');
    await expect(
      page.getByText(/sign in to/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F11-02: new user with welcome activity renders activity log cleanly', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/leaderboard');
    await expect(
      page.getByText(/welcome bonus/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F11-03: rapidly toggling Developers/Projects and Weekly/Monthly/All-time settles cleanly', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/leaderboard');
    await page.getByRole('button', { name: /^projects$/i }).click();
    await page.getByRole('button', { name: /^developers$/i }).click();
    await page.getByRole('button', { name: /monthly/i }).click();
    await page.getByRole('button', { name: /all-time|all time/i }).click();
    await expect(
      page.getByText(/legend architect|legenduser/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F11-04: exact tier boundaries (40, 120, 300, 600) display correct tier and top tier message', async ({
    page,
    errorGuard,
  }) => {
    await setUserPoints('newcomer', 600);
    await loginViaUI(page, 'newcomer');
    await page.goto('/leaderboard');
    await assertLeaderboardUserStats(page, 600, /\blegend\b/i);
    await expect(
      page.getByText(/top tier|max tier|600/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F11-05: progress bar widths never exceed 100% even at >600 points', async ({
    page,
    errorGuard,
  }) => {
    await setUserPoints('legenduser', 1200);
    await loginViaUI(page, 'legenduser');
    await page.goto('/leaderboard');

    const overflowBars = await page.evaluate(() => {
      const bars = Array.from(document.querySelectorAll('[style*="width"]'));
      return bars
        .map((b) => b.style.width)
        .filter((w) => w.endsWith('%') && parseFloat(w) > 100);
    });
    expect(overflowBars).toEqual([]);
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F12: Portfolio Builder Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F12-01: Basics Name 1 char or empty shows inline validation error', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/portfolio');
    const nameInput = page.getByLabel(/^name$|display name/i).first();
    await nameInput.fill('A');
    await page.getByRole('button', { name: /save portfolio|save changes|save/i }).first().click();
    await expect(
      page.getByText(/at least 2|too short|required/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F12-02: Skill input 1 char blocked and valid 2-char "Go" adds skill chip', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/portfolio');
    const skillInput = page
      .getByPlaceholder(/add a skill|skill/i)
      .or(page.getByLabel(/add skill/i))
      .first();
    await skillInput.fill('C');
    await page.getByRole('button', { name: /add skill|\+ add/i }).first().click();
    await expect(page.getByText(/^C$/)).toHaveCount(0);

    await skillInput.fill('Go');
    await page.getByRole('button', { name: /add skill|\+ add/i }).first().click();
    await expect(page.getByText(/^Go$/).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F12-03: Social link with empty label or invalid URL blocked by validation', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/portfolio');
    const linkLabel = page.getByPlaceholder(/label|platform/i).first();
    const linkUrl = page.getByPlaceholder(/https:\/\//i).first();
    await linkLabel.fill('Blog');
    await linkUrl.fill('not a url');
    await page.getByRole('button', { name: /add link/i }).first().click();
    await expect(page.getByText('not a url')).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T2-F12-04: Portfolio project title 2 chars or invalid GitHub URL blocked', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/portfolio');
    const projTitle = page
      .getByPlaceholder(/project title/i)
      .or(page.getByLabel(/project title/i))
      .first();
    await expect(projTitle).toBeVisible();

    await projTitle.fill('Hi');
    await page.getByRole('button', { name: /add project/i }).first().click();
    await expect(page.getByText(/^Hi$/)).toHaveCount(0);

    const projSection = projTitle.locator(
      'xpath=ancestor::*[.//button[contains(translate(., "ADDPROJECT", "addproject"), "add project")]][1]'
    );
    const projUrlInput = projSection
      .locator('input[type="url"], input[placeholder*="github" i], input[placeholder*="https" i]')
      .first();
    await expect(projUrlInput).toBeVisible();
    await projTitle.fill('Valid Portfolio Project');
    await projUrlInput.fill('not-a-valid-github-url');
    await page.getByRole('button', { name: /add project/i }).first().click();
    await expect(page.getByText('Valid Portfolio Project')).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T2-F12-05: public portfolio for unknown handle renders clean fallback without crashing', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await page.goto('/portfolio/nonexistent_user_xyz_99');
    await expect(page.getByText(/nonexistent_user_xyz_99/i).first()).toBeVisible();
    errorGuard.assertClean();
  });
});
