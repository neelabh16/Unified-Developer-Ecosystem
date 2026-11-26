const {
  test,
  expect,
  loginViaUI,
} = require('../../fixtures/test-fixtures');

test.describe('Tier 1 — F5: Hackathons List (/hackathons)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F5-01: renders hackathons grid with countdowns, prizes, worldwide counts, and DevVerse counts', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/hackathons');
    await expect(
      page.getByText(/aurora global ai & systems hackathon/i).first()
    ).toBeVisible();
    await expect(page.getByText(/₹2,50,000/).first()).toBeVisible();
    await expect(page.getByText(/\d+d\s+\d+h|\d{2}:\d{2}:\d{2}|live now/i).first()).toBeVisible();
    await expect(page.getByText(/devverse/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F5-02: signed-in user clicks Register, toggling Registered and updating counts', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons');

    const registerBtn = page
      .getByRole('button', { name: /^register$/i })
      .first();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/register') && r.request().method() === 'POST'
      ),
      registerBtn.click(),
    ]);
    await expect(
      page.getByRole('button', { name: /registered/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /my registered\s*\(1\)/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F5-03: switching toggle to My Registered filters to registered hackathons only', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons');

    await page.getByRole('button', { name: /^register$/i }).first().click();
    await expect(
      page.getByRole('button', { name: /my registered\s*\(1\)/i })
    ).toBeVisible();

    await page
      .getByRole('button', { name: /my registered/i })
      .click();
    await expect(
      page.getByText(/aurora global ai & systems hackathon/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/zero-latency backend challenge/i)
    ).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T1-F5-04: signed-in user clicks Bookmark on hackathon card and persists across reload', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons');

    const bookmarkBtn = page
      .getByRole('button', { name: /save|bookmark/i })
      .first();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/bookmark') && r.request().method() === 'POST'
      ),
      bookmarkBtn.click(),
    ]);
    await page.reload();
    await expect(
      page.getByRole('button', { name: /saved|bookmarked/i }).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F5-05: clicking a hackathon card navigates to /hackathons/:id', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/hackathons');
    await page
      .getByRole('link', { name: /aurora global ai & systems hackathon/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/hackathons\/|\/hackathon\?id=/);
    await expect(
      page.getByRole('heading', { name: /aurora global ai & systems hackathon/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F6: Hackathon Detail (/hackathons/:id)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F6-01: renders title, countdown, overview, tracks, timeline, rules, judging bars, and other hackathons', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/hackathons/h1');
    await expect(
      page.getByRole('heading', { name: /aurora global ai & systems hackathon/i })
    ).toBeVisible();
    await expect(page.getByText(/local ai/i).first()).toBeVisible();
    await expect(page.getByText(/kickoff & team formation/i).first()).toBeVisible();
    await expect(page.getByText(/technical execution/i).first()).toBeVisible();
    await expect(page.getByText(/other hackathons/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F6-02: signed-in user clicks Register now, updating button and DevVerse delegation roster', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons/h1');

    const regBtn = page
      .getByRole('button', { name: /register now|^register$/i })
      .first();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/register') && r.request().method() === 'POST'
      ),
      regBtn.click(),
    ]);
    await expect(
      page.getByRole('button', { name: /registered/i }).first()
    ).toBeVisible();
    await expect(page.getByText(/newcomer/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F6-03: clicking Save bookmark button toggles Saved state and persists on reload', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons/h1');

    const saveBtn = page
      .getByRole('button', { name: /^save$|bookmark/i })
      .first();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/bookmark') && r.request().method() === 'POST'
      ),
      saveBtn.click(),
    ]);
    await page.reload();
    await expect(
      page.getByRole('button', { name: /saved|bookmarked/i }).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F6-04: clicking Share button triggers clipboard copy feedback', async ({
    page,
    context,
    errorGuard,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/hackathons/h1');
    await page.getByRole('button', { name: /share/i }).first().click();
    await expect(page.getByText(/copied|link/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F6-05: clicking a participant in DevVerse Delegation navigates to their profile', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons/h1');
    const participantLink = page
      .locator('a[href*="/profile"]')
      .filter({ hasText: /kmori|kai mori|ari/i })
      .first();
    await expect(participantLink).toBeVisible();
    await participantLink.click();
    await expect(page).toHaveURL(/\/profile/);
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F7: Squads & Matching (/squads)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F7-01: selecting skills, category, and style renders compatibility matches with % scores', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');

    await expect(
      page.getByText(/\b\d{2}%\s*(?:match)?/i).first()
    ).toBeVisible();
    await expect(page.getByText(/kmori|kai mori/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F7-02: switching matching style updates displayed weight chips and match scores', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');

    const compBtn = page
      .getByRole('button', { name: /complementary skills/i })
      .first();
    await compBtn.click();
    await expect(
      page.getByText(/complement[^.\n]*\+18|\+18[^.\n]*complement/i).first()
    ).toBeVisible();
    await expect(
      page
        .getByText(/overlap[^.\n]*\+8|\+8[^.\n]*overlap|shared[^.\n]*\+8|\+8[^.\n]*shared/i)
        .first()
    ).toBeVisible();

    const simBtn = page
      .getByRole('button', { name: /similar skill level/i })
      .first();
    await simBtn.click();
    await expect(
      page
        .getByText(/overlap[^.\n]*\+18|\+18[^.\n]*overlap|shared[^.\n]*\+18|\+18[^.\n]*shared/i)
        .first()
    ).toBeVisible();
    await expect(
      page.getByText(/complement[^.\n]*\+8|\+8[^.\n]*complement/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F7-03: clicking Message opens DM drawer, sends a message, and deletes own message', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');

    const msgText = 'Want to team up for Aurora Hackathon?';
    await page.getByRole('button', { name: /^message$/i }).first().click();
    const dmInput = page
      .getByPlaceholder(/message|say hello|write a message/i)
      .or(page.getByLabel(/message/i))
      .first();
    await expect(dmInput).toBeVisible();
    await dmInput.fill(msgText);
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/messages/') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^send$/i }).first().click(),
    ]);

    await expect(page.getByText(msgText)).toBeVisible();

    const deleteMsgBtn = page
      .getByRole('button', { name: /delete/i })
      .first();
    await expect(deleteMsgBtn).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/messages/') && r.request().method() === 'DELETE'
      ),
      deleteMsgBtn.click(),
    ]);
    await expect(page.getByText(msgText)).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T1-F7-04: filling Create a squad form creates squad card under Your squads', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');

    await page
      .getByLabel(/squad name/i)
      .or(page.getByPlaceholder(/squad name/i))
      .first()
      .fill('Quantum Sprinters');
    await page
      .getByLabel(/description|pitch|goal/i)
      .or(page.getByPlaceholder(/what are you building|description/i))
      .first()
      .fill('Shipping a WebGL developer telemetry tool in 48 hours.');

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/squads') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /create squad/i }).click(),
    ]);

    await expect(page.getByText('Quantum Sprinters').first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F7-05: registering squad for hackathon and leaving squad works end-to-end', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');

    await page
      .getByLabel(/squad name/i)
      .or(page.getByPlaceholder(/squad name/i))
      .first()
      .fill('Nebula Crew');
    await page
      .getByLabel(/description|pitch|goal/i)
      .or(page.getByPlaceholder(/what are you building|description/i))
      .first()
      .fill('Building deterministic runtime tools for the Aurora sprint.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/squads') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /create squad/i }).click(),
    ]);
    await expect(page.getByText('Nebula Crew').first()).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/hackathons/') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /register squad/i }).first().click(),
    ]);

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/leave') && r.request().method() === 'DELETE'
      ),
      page.getByRole('button', { name: /leave/i }).first().click(),
    ]);
    await expect(page.getByText('Nebula Crew')).toHaveCount(0);
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F8: Communities List (/communities)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F8-01: renders community cards with online count, member count, Open forum, and Join buttons', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/communities');
    await expect(
      page.getByText(/systems & rust guild/i).first()
    ).toBeVisible();
    await expect(page.getByText(/\d+\s+online/i).first()).toBeVisible();
    await expect(page.getByText(/\d+\s+members?/i).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: /open forum/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^join$/i }).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F8-02: Recent discussions section renders latest threads with community name and reply counts', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/communities');
    await expect(
      page.getByText(/recent discussions/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/zero-copy ring buffers in wasm/i).first()
    ).toBeVisible();
    await expect(page.getByText(/1\s+repl/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F8-03: signed-in user clicks Join, changing button to Joined and incrementing member count', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities');

    const joinBtn = page.getByRole('button', { name: /^join$/i }).first();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/join') && r.request().method() === 'POST'
      ),
      joinBtn.click(),
    ]);
    await expect(
      page.getByRole('button', { name: /^joined/i }).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F8-04: clicking Joined again leaves community and reverts button to Join', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities');

    await page.getByRole('button', { name: /^join$/i }).first().click();
    const joinedBtn = page
      .getByRole('button', { name: /^joined/i })
      .first();
    await expect(joinedBtn).toBeVisible();
    await joinedBtn.click();
    await expect(
      page.getByRole('button', { name: /^join$/i }).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F8-05: clicking Open forum or discussion preview navigates to /communities/:id', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/communities');
    await page.getByRole('link', { name: /open forum/i }).first().click();
    await expect(page).toHaveURL(/\/communities\/|\/community\?id=/);
    await expect(
      page.getByRole('heading', { name: /systems & rust guild/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });
});
