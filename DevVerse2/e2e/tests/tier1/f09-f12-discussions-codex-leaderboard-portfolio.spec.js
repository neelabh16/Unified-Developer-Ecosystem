const {
  test,
  expect,
  loginViaUI,
  assertLeaderboardUserStats,
} = require('../../fixtures/test-fixtures');
const { VALID_PNG_PATH } = require('../../fixtures/assets');

test.describe('Tier 1 — F9: Community Detail & Discussions (/communities/:id)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F9-01: renders community header, online/member counts, Join button, and threads list', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/communities/c1');
    await expect(
      page.getByRole('heading', { name: /systems & rust guild/i })
    ).toBeVisible();
    await expect(page.getByText(/online/i).first()).toBeVisible();
    await expect(page.getByText(/members/i).first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /join/i }).first()
    ).toBeVisible();
    await expect(
      page.getByText(/zero-copy ring buffers in wasm/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F9-02: clicking Join community immediately unlocks Start a new thread form', async ({
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
    await expect(
      page.getByText(/start a new thread/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F9-03: joined member submits valid thread and thread appears at top of list', async ({
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
      .fill('Async Lock-Free Channels');
    await page
      .getByLabel(/body|details|content/i)
      .or(page.getByPlaceholder(/share details|write your thread|body/i))
      .first()
      .fill('Comparing bounded MPSC ring buffers under high contention in Rust.');

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/discussions') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post thread|create thread|publish/i }).click(),
    ]);
    await expect(
      page.getByText('Async Lock-Free Channels').first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F9-04: clicking thread expands accordion and member posts valid reply', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities/c1');
    await page.getByRole('button', { name: /^join/i }).first().click();

    await page
      .getByText(/zero-copy ring buffers in wasm/i)
      .first()
      .click();
    const replyInput = page
      .getByLabel(/reply/i)
      .or(page.getByPlaceholder(/write a reply|reply/i))
      .first();
    await expect(replyInput).toBeVisible();
    await replyInput.fill('Great benchmark methodology — thanks for sharing!');

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/replies') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post reply|reply|send/i }).first().click(),
    ]);
    await expect(
      page.getByText('Great benchmark methodology — thanks for sharing!')
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F9-05: author deletes own reply and own thread and deletion persists on reload', async ({
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
      .fill('Temporary Thread To Delete');
    await page
      .getByLabel(/body|details|content/i)
      .or(page.getByPlaceholder(/share details|write your thread|body/i))
      .first()
      .fill('This discussion thread tests author deletion of replies and threads.');
    await page.getByRole('button', { name: /post thread|create thread|publish/i }).click();
    await expect(page.getByText('Temporary Thread To Delete')).toBeVisible();

    await page.getByText('Temporary Thread To Delete').first().click();
    const replyInput = page
      .getByLabel(/reply/i)
      .or(page.getByPlaceholder(/write a reply|reply/i))
      .first();
    await replyInput.fill('Reply to delete first');
    await page.getByRole('button', { name: /post reply|reply|send/i }).first().click();
    await expect(page.getByText('Reply to delete first')).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/replies/') && r.request().method() === 'DELETE'
      ),
      page.getByRole('button', { name: /delete/i }).last().click(),
    ]);
    await expect(page.getByText('Reply to delete first')).toHaveCount(0);

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/discussions/') && r.request().method() === 'DELETE'
      ),
      page.getByRole('button', { name: /delete/i }).first().click(),
    ]);
    await page.reload();
    await expect(page.getByText('Temporary Thread To Delete')).toHaveCount(0);
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F10: Codex Knowledge Base (/codex)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F10-01: user with >=200 pts sees unlocked banner, search bar, category chips, entries, and form', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/codex');

    await expect(page.getByText(/you're in|unlocked/i).first()).toBeVisible();
    await expect(
      page.getByPlaceholder(/search/i).or(page.getByRole('searchbox')).first()
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^debugging$/i }).first()).toBeVisible();
    await expect(page.getByText(/add an entry/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F10-02: clicking a Codex entry card expands Problem, Tried, Fix, and Lesson', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/codex');

    await page
      .getByText(/diagnosing intermittent mongodb unique index/i)
      .first()
      .click();
    await expect(
      page.getByText(/atomic findOneAndDelete/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F10-03: typing in Codex search filters visible entries', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/codex');

    const search = page
      .getByPlaceholder(/search/i)
      .or(page.getByRole('searchbox'))
      .first();
    await search.fill('WebGL');
    await expect(
      page.getByText(/preventing webgl context loss/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/surviving a production rate-limiter/i)
    ).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T1-F10-04: clicking category filter chip filters entries and All restores all', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/codex');

    await page.getByRole('button', { name: /^security$/i }).first().click();
    await expect(
      page.getByText(/hybrid httponly cookie/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/scoping solo weekend builds/i)
    ).toHaveCount(0);

    await page.getByRole('button', { name: /^all$/i }).first().click();
    await expect(
      page.getByText(/scoping solo weekend builds/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F10-05: submitting valid Codex entry adds entry to list and awards +25 pts', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/codex');

    await page.getByLabel(/title/i).first().fill('Eliminating stale React Query cache races');
    await page.getByLabel(/category/i).first().selectOption('Debugging');
    await page
      .getByLabel(/problem/i)
      .first()
      .fill('Optimistic updates reverted intermittently when concurrent mutations settled out of order.');
    await page
      .getByLabel(/tried|what didn/i)
      .first()
      .fill('Attempted manual setTimeout delays after mutation completion.');
    await page
      .getByLabel(/^fix$/i)
      .first()
      .fill('Canceled active queries in onMutate and invalidated keys in onSettled.');
    await page
      .getByLabel(/lesson/i)
      .first()
      .fill('Always cancel outgoing refetches before applying optimistic cache updates.');

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/codex') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /publish|add entry|submit/i }).click(),
    ]);

    await expect(
      page.getByText('Eliminating stale React Query cache races').first()
    ).toBeVisible();
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F11: Leaderboard & Activity Feed (/leaderboard)', () => {
  test('T1-F11-01: renders developers list, tier track, Your total, recent activity, and points reference', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/leaderboard');
    await expect(page.getByText(/legenduser|legend architect/i).first()).toBeVisible();
    await expect(page.getByText(/your tier|newcomer/i).first()).toBeVisible();
    await expect(page.getByText(/how points work/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F11-02: switching board toggle from Developers to Projects renders ranked projects', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/leaderboard');
    await page.getByRole('button', { name: /^projects$/i }).click();
    await expect(
      page.getByText(/aurora shader studio/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F11-03: switching range toggle Weekly / Monthly / All-time updates rankings via API', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/leaderboard');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/leaderboard')),
      page.getByRole('button', { name: /all-time|all time/i }).click(),
    ]);
    await expect(page.getByText(/legend architect|legenduser/i).first()).toBeVisible();

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/leaderboard')),
      page.getByRole('button', { name: /monthly/i }).click(),
    ]);
    await expect(page.getByText(/legend architect|legenduser/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F11-04: logged-in user row has You badge and Your total matches points', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/leaderboard');
    await assertLeaderboardUserStats(page, 220);
    errorGuard.assertClean();
  });

  test('T1-F11-05: Your recent activity displays point-earning actions with +N amounts', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/leaderboard');
    await expect(
      page.getByText(/your recent activity/i).first()
    ).toBeVisible();
    await expect(page.getByText(/\+220|welcome bonus/i).first()).toBeVisible();
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F12: Portfolio Builder (/portfolio)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F12-01: signed-in user sees Editor with Basics, Skills, Social links, Projects, and Live preview', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/portfolio');
    await expect(page.getByText(/basics/i).first()).toBeVisible();
    await expect(page.getByText(/skills/i).first()).toBeVisible();
    await expect(page.getByText(/social links|links/i).first()).toBeVisible();
    await expect(page.getByText(/live preview/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F12-02: editing Name, Title, Bio updates Live preview in real time and persists after reload', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/portfolio');

    const nameInput = page.getByLabel(/^name$|display name/i).first();
    const titleInput = page.getByLabel(/title|role/i).first();
    const bioInput = page.getByLabel(/bio/i).first();

    await nameInput.fill('Codex Principal Engineer');
    await titleInput.fill('Distributed Systems Architect');
    await bioInput.fill('Designing resilient cloud runtimes and interactive graphics.');

    await expect(
      page.getByText('Codex Principal Engineer').first()
    ).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/portfolios/me') && r.request().method() === 'PUT'
      ),
      page.getByRole('button', { name: /save portfolio|save changes|save/i }).first().click(),
    ]);

    await page.reload();
    await expect(
      page.getByLabel(/^name$|display name/i).first()
    ).toHaveValue('Codex Principal Engineer');
    errorGuard.assertClean();
  });

  test('T1-F12-03: adding and removing Skills, Social links, and Projects updates editor and preview', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/portfolio');

    const skillInput = page
      .getByPlaceholder(/add a skill|skill/i)
      .or(page.getByLabel(/add skill/i))
      .first();
    await skillInput.fill('Zig');
    await page.getByRole('button', { name: /add skill|\+ add/i }).first().click();
    await expect(page.getByText('Zig').first()).toBeVisible();

    const linkLabel = page.getByPlaceholder(/label|platform/i).first();
    const linkUrl = page.getByPlaceholder(/https:\/\//i).first();
    await linkLabel.fill('Website');
    await linkUrl.fill('https://codexuser.dev');
    await page.getByRole('button', { name: /add link/i }).first().click();
    await expect(page.getByText('Website').first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F12-04: uploading valid PNG avatar calls /uploads/avatar and updates preview avatar', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/portfolio');

    const fileInput = page.locator('input[type="file"]').first();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/uploads/avatar') && r.request().method() === 'POST'
      ),
      fileInput.setInputFiles(VALID_PNG_PATH),
    ]);
    await expect(page.locator('img[src*="/uploads/"]').first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F12-05: visiting /portfolio/:username renders public portfolio with Copy link & Full profile', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/portfolio/codexuser');
    await expect(
      page.getByText(/codex contributor/i).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /copy link/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /full profile/i }).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });
});
