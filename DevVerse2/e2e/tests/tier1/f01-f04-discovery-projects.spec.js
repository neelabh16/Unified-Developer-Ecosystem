const {
  test,
  expect,
  loginViaUI,
  mockGitHubApi,
} = require('../../fixtures/test-fixtures');
const { VALID_PNG_PATH } = require('../../fixtures/assets');

test.describe('Tier 1 — F1: Home Dashboard (/)', () => {
  test('T1-F1-01: renders hero heading, CTA buttons, and 4 stat strip cells', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /where builders become legends/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /explore projects/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /build your portfolio/i })
    ).toBeVisible();

    // Stat strip should surface core platform metrics
    await expect(page.getByText(/builders|developers/i).first()).toBeVisible();
    await expect(page.getByText(/projects/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F1-02: renders trending projects from API and navigates to project detail on click', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    const projectLink = page
      .getByRole('link', { name: /aurora shader studio/i })
      .first();
    await expect(projectLink).toBeVisible();
    await projectLink.click();
    await expect(page).toHaveURL(/\/projects\/|\/project\?id=/);
    await expect(
      page.getByRole('heading', { name: /aurora shader studio/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F1-03: renders category discipline tiles and navigates to /explore?cat=...', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    const categoryLink = page
      .locator('a[href*="/explore?cat="], a[href*="explore?cat="]')
      .first();
    await expect(categoryLink).toBeVisible();
    const href = await categoryLink.getAttribute('href');
    await categoryLink.click();
    await expect(page).toHaveURL(/\/explore/);
    if (href && href.includes('cat=')) {
      await expect(page).toHaveURL(/cat=/);
    }
    errorGuard.assertClean();
  });

  test('T1-F1-04: renders top developers, activity feed, hackathons, and community highlights', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    await expect(page.getByText(/kai mori|kmori/i).first()).toBeVisible();
    await expect(
      page.getByText(/aurora global ai & systems hackathon/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/systems & rust guild/i).first()
    ).toBeVisible();
    await expect(page.getByText(/activity|live feed/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F1-05: bottom CTA links navigate to portfolio/login and squads', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    const squadCta = page.getByRole('link', { name: /find your squad/i }).first();
    await expect(squadCta).toBeVisible();
    await squadCta.click();
    await expect(page).toHaveURL(/\/(squads|login\?redirect=.*squads)/);

    await page.goto('/');
    const startCta = page
      .getByRole('link', { name: /start building|build your portfolio/i })
      .first();
    await expect(startCta).toBeVisible();
    await startCta.click();
    await expect(page).toHaveURL(/\/(portfolio|login\?redirect=.*portfolio)/);
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F2: Explore Projects (/explore)', () => {
  test('T1-F2-01: displays all seeded community projects with project count label', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/explore');
    await expect(page.getByText(/aurora shader studio/i).first()).toBeVisible();
    await expect(page.getByText(/pulsequeue telemetry/i).first()).toBeVisible();
    await expect(
      page.getByText(/\b\d+\s+(?:community\s+)?projects?\b/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F2-02: typing project title or tech tag in search filters displayed cards', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/explore');
    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search projects|search by title|search/i))
      .first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Kestrel');
    await expect(page.getByText(/kestrel wasm runtime/i).first()).toBeVisible();
    await expect(page.getByText(/pulsequeue telemetry/i)).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T1-F2-03: clicking category chip filters cards and "/" shortcut focuses search input', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/explore');
    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search projects|search by title|search/i))
      .first();

    // Blur input then press "/" shortcut
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('/');
    await expect(searchInput).toBeFocused();

    const backendBtn = page
      .getByRole('button', { name: /^backend$/i })
      .first();
    await backendBtn.click();
    await expect(page.getByText(/pulsequeue telemetry/i).first()).toBeVisible();
    await expect(page.getByText(/synthgrid design system/i)).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T1-F2-04: clicking difficulty pill and changing sort select filters and reorders cards', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/explore');
    await page.getByRole('button', { name: /^beginner$/i }).first().click();
    await expect(page.getByText(/synthgrid design system/i).first()).toBeVisible();
    await expect(page.getByText(/aurora shader studio/i)).toHaveCount(0);

    await page.getByRole('button', { name: /^all$/i }).first().click();
    const sortSelect = page.getByRole('combobox').first();
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption('likes');
    await expect(page.getByText(/aurora shader studio/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F2-05: signed-in project author sees My Projects section displaying their submissions', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/explore');
    await expect(
      page.getByRole('heading', { name: /my projects/i })
    ).toBeVisible();
    await expect(
      page.getByText(/chronicle notes engine/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F3: Project Detail (/projects/:id)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F3-01: displays title, category chip, author link, overview, tech stack, stats, and related projects', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/projects/p1');
    await expect(
      page.getByRole('heading', { name: /aurora shader studio/i })
    ).toBeVisible();
    await expect(page.getByText(/graphics/i).first()).toBeVisible();
    await expect(page.getByText(/kmori|kai mori/i).first()).toBeVisible();
    await expect(page.getByText(/webgl/i).first()).toBeVisible();
    await expect(page.getByText(/advanced/i).first()).toBeVisible();
    await expect(page.getByText(/related projects/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F3-02: signed-in user clicks Like button, toggling state and incrementing count', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/projects/p1');
    const likeBtn = page
      .getByRole('button', { name: /like|liked|48/i })
      .first();
    await expect(likeBtn).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/like') && r.request().method() === 'POST'
      ),
      likeBtn.click(),
    ]);
    await expect(page.getByText(/\b49\b/).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F3-03: signed-in user clicks Save/Bookmark and Share buttons', async ({
    page,
    context,
    errorGuard,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await loginViaUI(page, 'newcomer');
    await page.goto('/projects/p1');

    const saveBtn = page
      .getByRole('button', { name: /save|bookmark/i })
      .first();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/bookmark') && r.request().method() === 'POST'
      ),
      saveBtn.click(),
    ]);
    await expect(
      page.getByRole('button', { name: /saved|bookmarked/i }).first()
    ).toBeVisible();

    const shareBtn = page.getByRole('button', { name: /share/i }).first();
    await shareBtn.click();
    await expect(page.getByText(/copied|link/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F3-04: signed-in user posts valid comment and deletes own comment', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/projects/p1');
    const commentBox = page
      .getByLabel(/comment/i)
      .or(page.getByPlaceholder(/comment|thought|feedback/i))
      .first();
    await commentBox.fill('Clean WebGL uniforms and awesome gradient balance!');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/comments') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post comment|submit|send/i }).click(),
    ]);

    await expect(
      page.getByText('Clean WebGL uniforms and awesome gradient balance!')
    ).toBeVisible();

    const deleteCommentBtn = page
      .getByRole('button', { name: /delete/i })
      .last();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/comments/') && r.request().method() === 'DELETE'
      ),
      deleteCommentBtn.click(),
    ]);
    await expect(
      page.getByText('Clean WebGL uniforms and awesome gradient balance!')
    ).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T1-F3-05: project owner edits category inline and uploads/opens gallery image in lightbox', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/projects/p10');

    await expect(
      page.getByRole('button', { name: /delete/i }).first()
    ).toBeVisible();
    const editCatBtn = page
      .getByRole('button', { name: /edit category/i })
      .first();
    await editCatBtn.click();
    const catSelect = page.getByRole('combobox').first();
    await catSelect.selectOption('Tools');
    const saveCatBtn = page.getByRole('button', { name: /^save$/i }).first();
    if (await saveCatBtn.isVisible().catch(() => false)) {
      await saveCatBtn.click();
    }
    await expect(page.getByText(/tools/i).first()).toBeVisible();

    // Upload image to gallery and open in lightbox
    const fileInput = page.locator('input[type="file"]').first();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/images') && r.request().method() === 'POST'
      ),
      fileInput.setInputFiles(VALID_PNG_PATH),
    ]);

    const galleryImg = page.locator('img[src*="/uploads/"]').first();
    await expect(galleryImg).toBeVisible();
    await galleryImg.click();
    const closeLightbox = page
      .getByRole('button', { name: /close/i })
      .first();
    await expect(closeLightbox).toBeVisible();
    await closeLightbox.click();
    errorGuard.assertClean();
  });
});

test.describe('Tier 1 — F4: Submit Project & Multer Upload (/submit-project)', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T1-F4-01: signed-in user opens /submit-project and sees importer, form fields, dropzone, and published list', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/submit-project');
    await expect(
      page.getByRole('heading', { name: /submit/i }).first()
    ).toBeVisible();
    await expect(page.getByLabel(/title/i).first()).toBeVisible();
    await expect(page.getByLabel(/description/i).first()).toBeVisible();
    await expect(page.locator('input[type="file"]').first()).toBeAttached();
    await expect(
      page.getByText(/your published projects|chronicle notes engine/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F4-02: submitting valid project fields creates project and redirects to /projects/:id', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');

    await page.getByLabel(/project title|^title$/i).first().fill('EchoMesh Audio Graph');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Real-time WebAudio modular synthesizer graph built with React and Canvas.');
    const catSelect = page.getByLabel(/category/i).first();
    await catSelect.selectOption('Frontend');
    const diffSelect = page.getByLabel(/difficulty/i).first();
    if (await diffSelect.isVisible().catch(() => false)) {
      await diffSelect.selectOption('Intermediate');
    }
    await page.getByLabel(/tags/i).first().fill('React, WebAudio, Canvas');

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/projects') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /publish|submit project/i }).click(),
    ]);

    await expect(page).toHaveURL(/\/projects\/|\/project\?id=/);
    await expect(
      page.getByRole('heading', { name: /echomesh audio graph/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F4-03: uploading valid PNG screenshot shows preview and persists in created project gallery', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');

    const fileInput = page.locator('input[type="file"]').first();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/uploads/image') && r.request().method() === 'POST'
      ),
      fileInput.setInputFiles(VALID_PNG_PATH),
    ]);
    await expect(page.locator('img[src*="/uploads/"], img[src^="blob:"], img[src^="data:"]').first()).toBeVisible();

    await page.getByLabel(/project title|^title$/i).first().fill('PixelPulse Gallery App');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Visual shader inspector with automated screenshot capture and galleries.');
    await page.getByLabel(/category/i).first().selectOption('Graphics');
    await page.getByLabel(/tags/i).first().fill('WebGL, PNG');

    await page.getByRole('button', { name: /publish|submit project/i }).click();
    await expect(page).toHaveURL(/\/projects\/|\/project\?id=/);
    await expect(page.locator('img[src*="/uploads/"]').first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T1-F4-04: GitHub repo importer auto-populates title, description, tags, and GitHub URL', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');

    const ghImportInput = page
      .getByPlaceholder(/github\.com\/owner\/repo|import.*github/i)
      .or(page.getByLabel(/import.*github|github repository/i))
      .first();
    await ghImportInput.fill('https://github.com/devverse-org/aurora-engine');
    await page.getByRole('button', { name: /import|fetch/i }).first().click();

    await expect(
      page.getByLabel(/project title|^title$/i).first()
    ).toHaveValue(/aurora-engine/i);
    await expect(page.getByLabel(/description/i).first()).toHaveValue(
      /aurora renderer/i
    );
    await expect(page.getByLabel(/tags/i).first()).toHaveValue(/typescript/i);
    errorGuard.assertClean();
  });

  test('T1-F4-05: newly submitted project appears in Your published projects and /explore My Projects', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');

    await page.getByLabel(/project title|^title$/i).first().fill('SignalFlare Monitor');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Distributed uptime and alert router for hobbyist developer deployments.');
    await page.getByLabel(/category/i).first().selectOption('Tools');
    await page.getByLabel(/tags/i).first().fill('Node.js, Monitoring');
    await page.getByRole('button', { name: /publish|submit project/i }).click();
    await expect(page).toHaveURL(/\/projects\/|\/project\?id=/);

    await page.goto('/submit-project');
    await expect(page.getByText(/signalflare monitor/i).first()).toBeVisible();

    await page.goto('/explore');
    await expect(
      page.getByRole('heading', { name: /my projects/i })
    ).toBeVisible();
    await expect(page.getByText(/signalflare monitor/i).first()).toBeVisible();
    errorGuard.assertClean();
  });
});
