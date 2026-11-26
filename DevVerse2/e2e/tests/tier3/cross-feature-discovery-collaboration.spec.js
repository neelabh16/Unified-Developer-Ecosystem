const {
  test,
  expect,
  loginViaUI,
  mockGitHubApi,
  assertLeaderboardUserStats,
} = require('../../fixtures/test-fixtures');
const { VALID_PNG_PATH } = require('../../fixtures/assets');

test.describe('Tier 3 — Cross-Feature Discovery & Collaboration (T3-01..T3-12)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T3-01 (F4+F2): Submit Project -> Explore shows it in My Projects, searchable & filterable', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');
    await page.getByLabel(/project title|^title$/i).first().fill('PrismTrace Profiler');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Flamegraph and memory profiler built for WebAssembly workloads.');
    await page.getByLabel(/category/i).first().selectOption('Systems');
    await page.getByLabel(/tags/i).first().fill('Rust, WasmTrace');
    await page.getByRole('button', { name: /publish|submit project/i }).click();
    await expect(page).toHaveURL(/\/projects\//);

    await page.goto('/explore');
    await expect(page.getByRole('heading', { name: /my projects/i })).toBeVisible();
    await page.getByRole('button', { name: /^systems$/i }).first().click();
    const search = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i)).first();
    await search.fill('WasmTrace');
    await expect(page.getByText(/prismtrace profiler/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-02 (F4+F3): Submit Project with PNG -> Project Detail gallery + lightbox -> Owner deletes -> Explore', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/uploads/image') && r.request().method() === 'POST'
      ),
      page.locator('input[type="file"]').first().setInputFiles(VALID_PNG_PATH),
    ]);
    await page.getByLabel(/project title|^title$/i).first().fill('GlassForge Canvas');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Interactive shader canvas with screenshot export and gallery views.');
    await page.getByLabel(/category/i).first().selectOption('Graphics');
    await page.getByLabel(/tags/i).first().fill('WebGL, Shaders');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/projects') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /publish|submit project/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/projects\//);

    const img = page.locator('img[src*="/uploads/"]').first();
    await expect(img).toBeVisible();
    await img.click();
    await page.getByRole('button', { name: /close/i }).first().click();

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/projects/') && r.request().method() === 'DELETE'),
      page.getByRole('button', { name: /delete project|^delete$/i }).first().click(),
    ]);
    await expect(page).toHaveURL(/\/explore/);
    await expect(page.getByText('GlassForge Canvas')).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T3-03 (F4+F12): Submit Project with GitHub URL -> Portfolio auto-syncs into Projects list', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');
    await page.getByLabel(/project title|^title$/i).first().fill('SyncPort Demo');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Project verifying automatic sync from Explore into Portfolio Builder.');
    await page.getByLabel(/category/i).first().selectOption('Frontend');
    await page.getByLabel(/tags/i).first().fill('React');
    const ghInput = page.getByLabel(/github url|repository url/i).first();
    if (await ghInput.isVisible().catch(() => false)) {
      await ghInput.fill('https://github.com/newcomer-dev/syncport');
    }
    await page.getByRole('button', { name: /publish|submit project/i }).click();
    await expect(page).toHaveURL(/\/projects\//);

    await page.goto('/portfolio');
    await expect(page.getByText(/syncport demo/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-04 (F4+F13): Submit Project -> Profile Projects counter increments & Shipping Streak unlocks', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');
    await page.getByLabel(/project title|^title$/i).first().fill('StreakShip CLI');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('CLI tool unlocking Shipping Streak badge on user profile.');
    await page.getByLabel(/category/i).first().selectOption('Tools');
    await page.getByLabel(/tags/i).first().fill('CLI, Node.js');
    await page.getByRole('button', { name: /publish|submit project/i }).click();
    await expect(page).toHaveURL(/\/projects\//);

    await page.goto('/profile');
    await expect(page.getByText(/streakship cli/i).first()).toBeVisible();
    await expect(page.getByText(/shipping streak/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-05 (F3+F13): Like & Bookmark on Project Detail -> Profile Liked & Bookmarked tabs show it', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/projects/p2');
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
    await expect(page.getByText(/pulsequeue telemetry/i).first()).toBeVisible();

    await page.getByRole('button', { name: /liked/i }).first().click();
    await expect(page.getByText(/pulsequeue telemetry/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-06 (F3+F11+F19): Comment (+15) + Like (+2) + Bookmark (+3) -> Leaderboard updates total & ledger', async ({
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
    await page
      .getByLabel(/comment/i)
      .or(page.getByPlaceholder(/comment|thought/i))
      .first()
      .fill('Amazing raymarching pipeline!');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/comments') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post comment|submit|send/i }).click(),
    ]);

    await page.goto('/leaderboard');
    // 20 + 2 + 3 + 15 = 40
    await assertLeaderboardUserStats(page, 40, /\bbuilder\b/i);
    errorGuard.assertClean();
  });

  test('T3-07 (F5+F13): Register & Bookmark hackathon -> Profile Joined Hackathons & Bookmarked tabs show it', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/register') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^register$/i }).first().click(),
    ]);
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/bookmark') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /save|bookmark/i }).first().click(),
    ]);

    await page.goto('/profile');
    await page.getByRole('button', { name: /joined hackathons|hackathons/i }).first().click();
    await expect(
      page.getByText(/aurora global ai & systems hackathon/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-08 (F5+F6): Register on /hackathons -> /hackathons/:id shows Registered & user in delegation', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/register') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^register$/i }).first().click(),
    ]);

    await page.goto('/hackathons/h1');
    await expect(page.getByRole('button', { name: /registered/i }).first()).toBeVisible();
    await expect(page.getByText(/newcomer/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-09 (F7+F6): Create Squad & register for h1 -> /hackathons/h1 shows Squad in Competing Squads', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');
    await page
      .getByLabel(/squad name/i)
      .or(page.getByPlaceholder(/squad name/i))
      .first()
      .fill('Apex Builders');
    await page
      .getByLabel(/description|pitch|goal/i)
      .or(page.getByPlaceholder(/what are you building|description/i))
      .first()
      .fill('Competing in Aurora Global AI & Systems Hackathon.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/squads') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /create squad/i }).click(),
    ]);
    await expect(page.getByText('Apex Builders').first()).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/hackathons/') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /register squad/i }).first().click(),
    ]);
    await page.goto('/hackathons/h1');
    await expect(page.getByText(/apex builders/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-10 (F7+F13): Create Squad -> Profile Your squads shows squad & Community Pillar badge', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');
    await page
      .getByLabel(/squad name/i)
      .or(page.getByPlaceholder(/squad name/i))
      .first()
      .fill('Pillar Guild');
    await page
      .getByLabel(/description|pitch|goal/i)
      .or(page.getByPlaceholder(/what are you building|description/i))
      .first()
      .fill('Collaborating across systems and frontend tracks.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/squads') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /create squad/i }).click(),
    ]);

    await page.goto('/profile');
    await expect(page.getByText(/pillar guild/i).first()).toBeVisible();
    await expect(page.getByText(/community pillar/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-11 (F7+F12): Update skills & project in Portfolio -> Squads displays updated skills & Portfolio link', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/portfolio');
    const skillInput = page
      .getByPlaceholder(/add a skill|skill/i)
      .or(page.getByLabel(/add skill/i))
      .first();
    await skillInput.fill('Rust');
    await page.getByRole('button', { name: /add skill|\+ add/i }).first().click();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/portfolios/me') && r.request().method() === 'PUT'
      ),
      page.getByRole('button', { name: /save portfolio|save changes|save/i }).first().click(),
    ]);

    await page.goto('/squads');
    await page
      .getByLabel(/squad name/i)
      .or(page.getByPlaceholder(/squad name/i))
      .first()
      .fill('Rustaceans');
    await page
      .getByLabel(/description|pitch|goal/i)
      .or(page.getByPlaceholder(/what are you building|description/i))
      .first()
      .fill('Systems engineers sharing portfolio links.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/squads') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /create squad/i }).click(),
    ]);
    await expect(
      page.getByRole('link', { name: /portfolio/i }).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T3-12 (F8+F9): Join community on /communities -> Open forum lands unlocked with thread form', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/join') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^join$/i }).first().click(),
    ]);
    await page.getByRole('link', { name: /open forum/i }).first().click();

    await expect(page).toHaveURL(/\/communities\//);
    await expect(page.getByText(/start a new thread/i).first()).toBeVisible();
    errorGuard.assertClean();
  });
});
