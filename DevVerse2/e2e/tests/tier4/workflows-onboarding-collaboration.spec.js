const {
  test,
  expect,
  loginViaUI,
  mockGitHubApi,
  assertLeaderboardUserStats,
  setUserPoints,
} = require('../../fixtures/test-fixtures');
const { VALID_PNG_PATH } = require('../../fixtures/assets');

test.describe('Tier 4 — Real-World User Journeys', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T4-01: New Developer Onboarding Journey (Signup -> Profile -> Explore -> Like & Bookmark -> Logout/Login persistence)', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);

    // 1. Signup with strong password
    await page.goto('/signup');
    await page.getByLabel(/full name|^name$/i).first().fill('Journey Builder');
    await page.getByLabel(/username/i).first().fill('journey_dev');
    await page.getByLabel(/email/i).first().fill('journey@devverse.test');
    await page.getByLabel(/^password$/i).first().fill('JourneyPass9!');
    await page.getByLabel(/confirm password/i).first().fill('JourneyPass9!');
    const terms = page.getByRole('checkbox').first();
    if (await terms.isVisible().catch(() => false)) await terms.check();
    await Promise.all([
      page.waitForResponse(
        (r) =>
          (r.url().includes('/auth/register') || r.url().includes('/auth/signup')) &&
          r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/$/);

    // 2. Profile setup
    await page.goto('/profile');
    await page.getByRole('button', { name: /edit profile/i }).click();
    await page.getByLabel(/github/i).first().fill('journey-gh');
    await page.getByLabel(/bio/i).first().fill('Building end-to-end verified web systems.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/users/profile') && r.request().method() === 'PUT'
      ),
      page.getByRole('button', { name: /save/i }).first().click(),
    ]);

    // 3. Explore -> Project Detail -> Like & Bookmark
    await page.goto('/explore');
    await page.getByRole('link', { name: /aurora shader studio/i }).first().click();
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

    // 4. Logout & Login again -> Verify persisted state in MongoDB
    await page.goto('/settings');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /sign out|log out/i }).first().click(),
    ]);
    await loginViaUI(page, 'journey_dev', 'JourneyPass9!');

    await page.goto('/profile');
    await expect(page.getByText(/journey-gh/i).first()).toBeVisible();
    await page.getByRole('button', { name: /bookmarked/i }).first().click();
    await expect(page.getByText(/aurora shader studio/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T4-02: Builder Contribution & Gamification Climb to Codex (175 pts -> Submit +25 -> Comment +15 -> Leaderboard -> Codex)', async ({
    page,
    errorGuard,
  }) => {
    await setUserPoints('nearcodex', 175);
    await loginViaUI(page, 'nearcodex');

    // Sealed at 175 pts
    await page.goto('/codex');
    await expect(page.getByText(/sealed|locked|200/i).first()).toBeVisible();

    // Submit project (+25 => 200)
    await page.goto('/submit-project');
    await page.getByLabel(/project title|^title$/i).first().fill('Climb Engine');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Real-world workload project pushing builder from 175 to 200 points.');
    await page.getByLabel(/category/i).first().selectOption('Systems');
    await page.getByLabel(/tags/i).first().fill('Rust, Telemetry');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/projects') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /publish|submit project/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/projects\//);

    // Comment (+15 => 215)
    await page
      .getByLabel(/comment/i)
      .or(page.getByPlaceholder(/comment|thought/i))
      .first()
      .fill('Documenting architecture benchmarks in comments.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/comments') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post comment|submit|send/i }).click(),
    ]);

    // Verify Leaderboard total & ledger
    await page.goto('/leaderboard');
    await assertLeaderboardUserStats(page, 215);

    // Codex now unlocked -> publish entry (+25 => 240)
    await page.goto('/codex');
    await expect(page.getByText(/add an entry/i).first()).toBeVisible();
    await page.getByLabel(/title/i).first().fill('Climbing Past 200 Points in Production');
    await page.getByLabel(/category/i).first().selectOption('Career');
    await page
      .getByLabel(/problem/i)
      .first()
      .fill('Tracking cumulative contributions cleanly across projects and comments.');
    await page.getByLabel(/tried|what didn/i).first().fill('Manually tracking contributions off-platform.');
    await page.getByLabel(/^fix$/i).first().fill('Used DevVerse activity ledger and tier progress bar.');
    await page.getByLabel(/lesson/i).first().fill('Consistent shipping unlocks community knowledge sharing.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/codex') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /publish|add entry|submit/i }).click(),
    ]);
    await expect(
      page.getByText('Climbing Past 200 Points in Production').first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T4-03: Hackathon & Squad Collaboration Workflow (Match -> DM -> Create Squad -> Register -> Hackathon Detail)', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');

    // DM a matched developer
    await page.getByRole('button', { name: /^message$/i }).first().click();
    const dmInput = page
      .getByPlaceholder(/message|say hello|write a message/i)
      .or(page.getByLabel(/message/i))
      .first();
    await dmInput.fill('Let us collaborate on Aurora Hackathon!');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/messages/') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^send$/i }).first().click(),
    ]);
    await expect(
      page.getByText('Let us collaborate on Aurora Hackathon!')
    ).toBeVisible();

    // Create Squad
    await page
      .getByLabel(/squad name/i)
      .or(page.getByPlaceholder(/squad name/i))
      .first()
      .fill('Vanguard Squad');
    await page
      .getByLabel(/description|pitch|goal/i)
      .or(page.getByPlaceholder(/what are you building|description/i))
      .first()
      .fill('Fullstack and systems team shipping for Aurora.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/squads') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /create squad/i }).click(),
    ]);
    await expect(page.getByText('Vanguard Squad').first()).toBeVisible();

    // Register Squad for hackathon
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/hackathons/') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /register squad/i }).first().click(),
    ]);

    // Verify on /hackathons & /hackathons/h1
    await page.goto('/hackathons');
    await page.getByRole('button', { name: /my registered/i }).click();
    await expect(
      page.getByText(/aurora global ai & systems hackathon/i).first()
    ).toBeVisible();

    await page.goto('/hackathons/h1');
    await expect(page.getByText(/vanguard squad/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T4-04: Community Engagement & Moderation Flow (Join -> Thread -> Reply -> Delete Reply/Thread -> Leave)', async ({
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

    await page
      .getByLabel(/title/i)
      .or(page.getByPlaceholder(/thread title|title/i))
      .first()
      .fill('End-to-End Moderation Thread');
    await page
      .getByLabel(/body|details|content/i)
      .or(page.getByPlaceholder(/share details|write your thread|body/i))
      .first()
      .fill('Testing full community thread creation, reply, deletion, and leave flow.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/discussions') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post thread|create thread|publish/i }).click(),
    ]);
    await expect(page.getByText('End-to-End Moderation Thread')).toBeVisible();

    await page.getByText('End-to-End Moderation Thread').first().click();
    await page
      .getByLabel(/reply/i)
      .or(page.getByPlaceholder(/write a reply|reply/i))
      .first()
      .fill('Moderation verification reply');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/replies') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post reply|reply|send/i }).first().click(),
    ]);
    await expect(page.getByText('Moderation verification reply')).toBeVisible();

    // Delete reply & thread
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/replies/') && r.request().method() === 'DELETE'
      ),
      page.getByRole('button', { name: /delete/i }).last().click(),
    ]);
    await expect(page.getByText('Moderation verification reply')).toHaveCount(0);
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/discussions/') && r.request().method() === 'DELETE'
      ),
      page.getByRole('button', { name: /delete/i }).first().click(),
    ]);
    await expect(page.getByText('End-to-End Moderation Thread')).toHaveCount(0);

    // Leave community
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/join') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^joined/i }).first().click(),
    ]);
    await expect(page.getByRole('button', { name: /^join/i }).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T4-05: Legend Identity & Portfolio Publishing (Legend Accent -> Username Change -> Avatar + Save -> Public View)', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'legenduser');

    // 1. Unlock Legend accent in Settings
    await page.goto('/settings');
    await page.getByRole('button', { name: /legend/i }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'legend');

    // 2. Claim one-time username change in Profile
    await page.goto('/profile');
    await page.getByRole('button', { name: /edit profile/i }).click();
    await page.getByLabel(/username/i).first().fill('sovereign_dev');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/users/username')),
      page.getByRole('button', { name: /save|update username/i }).first().click(),
    ]);

    // 3. Build & Save Portfolio with Avatar upload
    await page.goto('/portfolio');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/uploads/avatar') && r.request().method() === 'POST'
      ),
      page.locator('input[type="file"]').first().setInputFiles(VALID_PNG_PATH),
    ]);
    await page.getByLabel(/^name$|display name/i).first().fill('Sovereign Legend');
    await page.getByLabel(/title|role/i).first().fill('Staff Systems Engineer');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/portfolios/me') && r.request().method() === 'PUT'
      ),
      page.getByRole('button', { name: /save portfolio|save changes|save/i }).first().click(),
    ]);

    // 4. Public Portfolio view
    await page.goto('/portfolio/sovereign_dev');
    await expect(page.getByText('Sovereign Legend').first()).toBeVisible();
    await expect(page.getByText('Staff Systems Engineer').first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T4-12: Password Recovery & Account Security Lifecycle (Signup -> Change Password -> Old fails -> New works -> OAuth modal)', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await page.goto('/signup');
    await page.getByLabel(/full name|^name$/i).first().fill('Security Lifecycle');
    await page.getByLabel(/username/i).first().fill('seclife1');
    await page.getByLabel(/email/i).first().fill('seclife1@devverse.test');
    await page.getByLabel(/^password$/i).first().fill('InitPass9!');
    await page.getByLabel(/confirm password/i).first().fill('InitPass9!');
    const terms = page.getByRole('checkbox').first();
    if (await terms.isVisible().catch(() => false)) await terms.check();
    await Promise.all([
      page.waitForResponse(
        (r) =>
          (r.url().includes('/auth/register') || r.url().includes('/auth/signup')) &&
          r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/settings');
    await page.getByLabel(/current password/i).fill('InitPass9!');
    await page.getByLabel(/new password/i).first().fill('UpdatedPass9!');
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
    await page.getByLabel(/email or username/i).first().fill('seclife1');
    await page.getByLabel(/^password$/i).first().fill('InitPass9!');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/login') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /^sign in$/i }).click(),
    ]);
    await expect(page.getByText(/invalid email or password/i).first()).toBeVisible();

    await loginViaUI(page, 'seclife1', 'UpdatedPass9!');
    await page.goto('/settings');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /sign out|log out/i }).first().click(),
    ]);

    await page.goto('/login?oauth_error=github_credentials_missing&provider=github');
    await expect(page.getByText(/oauth|github|credentials/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T4-13: Project Owner Lifecycle (Submit -> Edit Category -> Gallery Upload + Lightbox -> Delete Project -> Verify Gone)', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/uploads/image') && r.request().method() === 'POST'
      ),
      page.locator('input[type="file"]').first().setInputFiles(VALID_PNG_PATH),
    ]);
    await page.getByLabel(/project title|^title$/i).first().fill('Lifecycle Project');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('End-to-end owner project lifecycle verification project.');
    await page.getByLabel(/category/i).first().selectOption('Frontend');
    await page.getByLabel(/tags/i).first().fill('React, E2E');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/projects') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /publish|submit project/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/projects\//);
    const projectUrl = page.url();

    await page.getByRole('button', { name: /edit category/i }).first().click();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/projects/') && r.request().method() === 'PUT'
      ),
      (async () => {
        await page.getByRole('combobox').first().selectOption('Tools');
        const saveCat = page.getByRole('button', { name: /^save$/i }).first();
        if (await saveCat.isVisible().catch(() => false)) await saveCat.click();
      })(),
    ]);

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/images') && r.request().method() === 'POST'
      ),
      page.locator('input[type="file"]').first().setInputFiles(VALID_PNG_PATH),
    ]);
    const galleryImg = page.locator('img[src*="/uploads/"]').first();
    await expect(galleryImg).toBeVisible();
    await galleryImg.click();
    await page.getByRole('button', { name: /close/i }).first().click();

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/projects/') && r.request().method() === 'DELETE'
      ),
      page.getByRole('button', { name: /delete project|^delete$/i }).first().click(),
    ]);
    await expect(page).toHaveURL(/\/explore/);

    await page.goto(projectUrl);
    await expect(page.getByText(/not found/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T4-15: Multi-User Isolation & Authorization Journey (User A creates -> User B cannot delete)', async ({
    page,
    api,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'codexuser');
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
      .fill('CodexUser Private Thread');
    await page
      .getByLabel(/body|details|content/i)
      .or(page.getByPlaceholder(/share details|write your thread|body/i))
      .first()
      .fill('Thread authored by codexuser to verify newcomer cannot delete.');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/discussions') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post thread|create thread|publish/i }).click(),
    ]);
    await expect(page.getByText('CodexUser Private Thread')).toBeVisible();

    // Sign out & login as newcomer
    await page.goto('/settings');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /sign out|log out/i }).first().click(),
    ]);
    await loginViaUI(page, 'newcomer');

    await page.goto('/projects/p10');
    await expect(page.getByRole('button', { name: /delete project/i })).toHaveCount(0);

    await api.login('newcomer');
    const delProjRes = await api.request('DELETE', '/projects/p10');
    expect(delProjRes.status).toBe(403);
    errorGuard.assertClean();
  });
});
