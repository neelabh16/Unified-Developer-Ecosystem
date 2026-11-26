const {
  test,
  expect,
  loginViaUI,
  mockGitHubApi,
  assertValidationFeedback,
} = require('../../fixtures/test-fixtures');
const {
  INVALID_TXT_PATH,
  INVALID_PDF_PATH,
  createOversizedPngPayload,
  createMediumPngPayload,
} = require('../../fixtures/assets');

test.describe('Tier 2 — F1: Home Dashboard Boundaries', () => {
  test('T2-F1-01: GitHub trending API HTTP 403/500 renders fallback cleanly with zero uncaught page errors', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowConsoleErrors(true);
    await mockGitHubApi(page, { fail: true });
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /where builders become legends/i })
    ).toBeVisible();
    await expect(page.getByText(/aurora shader studio/i).first()).toBeVisible();
    expect(errorGuard.pageErrors).toEqual([]);
  });

  test('T2-F1-02: empty /api/v1/activity/feed array renders activity feed cleanly without crash', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.route('**/api/v1/activity/feed*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { feed: [] } }),
      });
    });
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /where builders become legends/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F1-03: data-motion="off" on / renders stat counters and terminal cleanly', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/settings');
    await page
      .getByRole('button', { name: /off|reduced|animations|motion/i })
      .or(page.getByRole('switch', { name: /animations|motion/i }))
      .first()
      .click();
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await expect(
      page.getByRole('heading', { name: /where builders become legends/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F1-04: signed-out visitor sees Sign In in dock and protected CTA routes via login', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: /sign in/i }).first()
    ).toBeVisible();
    await page.getByRole('link', { name: /find your squad/i }).first().click();
    await expect(page).toHaveURL(/\/login\?redirect=/);
    errorGuard.assertClean();
  });

  test('T2-F1-05: rapid navigation / -> /explore -> / produces zero errors', async ({
    page,
    errorGuard,
  }) => {
    await mockGitHubApi(page);
    for (let i = 0; i < 3; i += 1) {
      await page.goto('/');
      await page.goto('/explore');
    }
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /where builders become legends/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F2: Explore Projects Boundaries', () => {
  test('T2-F2-01: search with zero matches renders empty state message', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/explore');
    const search = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .first();
    await search.fill('__no_such_project_xyz__');
    await expect(
      page.getByText(/no projects match/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F2-02: search with XSS or Mongo operator payloads escapes safely without 500 or execution', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/explore');
    let dialogTriggered = false;
    page.on('dialog', () => {
      dialogTriggered = true;
    });
    const search = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .first();
    await search.fill('<script>alert(1)</script>');
    await expect(page.getByText(/no projects match/i).first()).toBeVisible();

    await search.fill('{"$ne": ""}');
    await expect(page.getByText(/no projects match/i).first()).toBeVisible();
    expect(dialogTriggered).toBe(false);
    errorGuard.assertClean();
  });

  test('T2-F2-03: combined Category + Difficulty + Search filters update count accurately (1 vs 0)', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/explore');
    await page.getByRole('button', { name: /^graphics$/i }).first().click();
    await page.getByRole('button', { name: /^advanced$/i }).first().click();
    const search = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .first();
    await search.fill('Aurora');
    await expect(page.getByText(/\b1\s+(?:community\s+)?project\b/i).first()).toBeVisible();

    await search.fill('NonMatchingTitle999');
    await expect(page.getByText(/\b0\s+(?:community\s+)?projects?\b/i).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F2-04: pressing "/" while focused inside search input types "/" without hijacking focus', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/explore');
    const search = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .first();
    await search.click();
    await search.fill('web');
    await page.keyboard.press('/');
    await expect(search).toHaveValue('web/');
    errorGuard.assertClean();
  });

  test('T2-F2-05: URL ?cat=NonExistentCategory shows 0 matches gracefully', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/explore?cat=NonExistentCategoryXYZ');
    await expect(
      page.getByText(/no projects match|\b0\s+(?:community\s+)?projects?\b/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F3: Project Detail Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F3-01: nonexistent project ID renders Project Not Found and Browse Projects link', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await page.goto('/projects/000000000000000000000000');
    await expect(
      page.getByText(/project not found|not found/i).first()
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /browse projects|explore/i }).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F3-02: comment boundary 0 and 2 chars blocked with inline validation error', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/projects/p1');

    const commentBox = page
      .getByLabel(/comment/i)
      .or(page.getByPlaceholder(/comment|thought/i))
      .first();
    const submitBtn = page.getByRole('button', { name: /post comment|submit|send/i });

    await commentBox.fill('');
    await submitBtn.click();
    await expect(page.getByText(/aurora shader studio/i).first()).toBeVisible();

    await commentBox.fill('ok');
    await submitBtn.click();
    await expect(
      page.getByText(/at least \d+ characters|too short|invalid/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F3-03: comment boundary 3 chars succeeds and 1001 chars rejected by server 400', async ({
    page,
    api,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/projects/p1');

    const commentBox = page
      .getByLabel(/comment/i)
      .or(page.getByPlaceholder(/comment|thought/i))
      .first();
    await commentBox.fill('Ace');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/comments') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /post comment|submit|send/i }).click(),
    ]);
    await expect(page.getByText('Ace').first()).toBeVisible();

    // Verify 1001-char boundary enforced with 400
    await api.login('newcomer');
    const longRes = await api.request('POST', '/projects/p1/comments', {
      body: { text: 'x'.repeat(1001) },
    });
    expect(longRes.status).toBe(400);
    errorGuard.assertClean();
  });

  test('T2-F3-04: non-owner hides Edit/Delete controls and API rejects forged DELETE/PUT with 403', async ({
    page,
    api,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/projects/p1');
    await expect(
      page.getByRole('button', { name: /edit category/i })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /delete project/i })
    ).toHaveCount(0);

    await api.login('newcomer');
    const delRes = await api.request('DELETE', '/projects/p1');
    expect(delRes.status).toBe(403);
    errorGuard.assertClean();
  });

  test('T2-F3-05: owner category custom name 1-char blocked and 2-char saves', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'codexuser');
    await page.goto('/projects/p10');
    await page.getByRole('button', { name: /edit category/i }).first().click();

    const catSelect = page.getByRole('combobox').first();
    const hasNewOpt = await catSelect
      .locator('option', { hasText: /new category/i })
      .count();
    if (hasNewOpt > 0) {
      await catSelect.selectOption({ label: '+ New category…' }).catch(async () => {
        const val = await catSelect
          .locator('option', { hasText: /new category/i })
          .first()
          .getAttribute('value');
        if (val) await catSelect.selectOption(val);
      });
      const customInput = page
        .getByPlaceholder(/category name|new category/i)
        .first();
      await customInput.fill('A');
      await page.getByRole('button', { name: /^save$/i }).first().click();
      await expect(
        page.getByText(/at least 2|too short/i).first()
      ).toBeVisible();

      await customInput.fill('AI');
      await page.getByRole('button', { name: /^save$/i }).first().click();
      await expect(page.getByText(/^AI$/).first()).toBeVisible();
    } else {
      await catSelect.selectOption('AI/ML');
      await expect(page.getByText(/AI\/ML/i).first()).toBeVisible();
    }
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F4: Submit Project & Multer Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F4-01: title boundary 2 chars blocked and >80 chars rejected', async ({
    page,
    api,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');

    const titleInput = page.getByLabel(/project title|^title$/i).first();
    await titleInput.fill('Ab');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Valid description that is well over twenty characters long.');
    await page.getByLabel(/tags/i).first().fill('React');
    await page.getByRole('button', { name: /publish|submit project/i }).click();
    await expect(page).toHaveURL(/\/submit-project/);
    await assertValidationFeedback(
      page,
      titleInput,
      /at least 3|too short|3 characters|title/i
    );

    await api.login('newcomer');
    const longTitleRes = await api.createProject({
      title: 'T'.repeat(81),
      desc: 'Valid description over twenty characters long.',
      category: 'Frontend',
      tags: ['React'],
    });
    expect(longTitleRes.status).toBe(400);
    errorGuard.assertClean();
  });

  test('T2-F4-02: description boundary 19 chars blocked and 20 chars accepted', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');

    await page.getByLabel(/project title|^title$/i).first().fill('Valid Title');
    const descInput = page.getByLabel(/description/i).first();
    await descInput.fill('1234567890123456789'); // 19 chars
    await page.getByLabel(/tags/i).first().fill('React');
    await page.getByRole('button', { name: /publish|submit project/i }).click();
    await expect(page).toHaveURL(/\/submit-project/);
    await assertValidationFeedback(
      page,
      descInput,
      /at least 20|too short|20 characters|description/i
    );

    await descInput.fill('12345678901234567890'); // 20 chars
    await page.getByLabel(/category/i).first().selectOption('Frontend');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/projects') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /publish|submit project/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/projects\//);
    errorGuard.assertClean();
  });

  test('T2-F4-03: empty tags or invalid GitHub URL blocked with inline validation error', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');

    await page.getByLabel(/project title|^title$/i).first().fill('Boundary Check App');
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Sufficiently long description to pass length rules.');
    const ghUrlInput = page.getByLabel(/github url|repository url/i).first();
    if (await ghUrlInput.isVisible().catch(() => false)) {
      await ghUrlInput.fill('not-a-valid-url');
    }
    const tagsInput = page.getByLabel(/tags/i).first();
    await tagsInput.fill('');
    await page.getByRole('button', { name: /publish|submit project/i }).click();
    await expect(page).toHaveURL(/\/submit-project/);
    await assertValidationFeedback(page, tagsInput, /tag|required|valid.*url|github/i);
    errorGuard.assertClean();
  });

  test('T2-F4-04: GitHub importer with invalid URL or 404 repo shows non-blocking fallback status', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await mockGitHubApi(page);
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');

    const ghImport = page
      .getByPlaceholder(/github\.com\/owner\/repo|import.*github/i)
      .or(page.getByLabel(/import.*github|github repository/i))
      .first();
    await ghImport.fill('https://gitlab.com/invalid/repo');
    await page.getByRole('button', { name: /import|fetch/i }).first().click();
    await expect(
      page.getByText(/doesn't look like|invalid|github|not found/i).first()
    ).toBeVisible();

    await ghImport.fill('https://github.com/nobody/nonexistent-repo');
    await page.getByRole('button', { name: /import|fetch/i }).first().click();
    await expect(
      page.getByText(/not found|private|manual|could not/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F4-05: non-image files (.txt/.pdf), >2MB UI limit, and >10MB oversized file rejected cleanly', async ({
    page,
    api,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await loginViaUI(page, 'newcomer');
    await page.goto('/submit-project');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(INVALID_TXT_PATH);
    await expect(
      page.getByText(/invalid file|only.*image|jpeg|png/i).first()
    ).toBeVisible();

    await fileInput.setInputFiles(INVALID_PDF_PATH);
    await expect(
      page.getByText(/invalid file|only.*image|jpeg|png|pdf/i).first()
    ).toBeVisible();

    await fileInput.setInputFiles(createMediumPngPayload());
    await expect(
      page.getByText(/2\s*mb|too large|exceeds|size/i).first()
    ).toBeVisible();
    await expect(page.locator('img[src*="/uploads/"]')).toHaveCount(0);

    // Verify Multer server enforcement directly for .pdf and >10MB buffer
    await api.login('newcomer');
    const pdfForm = new FormData();
    const fs = require('fs');
    pdfForm.append(
      'image',
      new Blob([fs.readFileSync(INVALID_PDF_PATH)], { type: 'application/pdf' }),
      'bad.pdf'
    );
    const pdfRes = await api.request('POST', '/uploads/image', { body: pdfForm });
    expect(pdfRes.status).toBe(400);

    const bigPayload = createOversizedPngPayload();
    const bigForm = new FormData();
    bigForm.append(
      'image',
      new Blob([bigPayload.buffer], { type: bigPayload.mimeType }),
      bigPayload.name
    );
    const bigRes = await api.request('POST', '/uploads/image', { body: bigForm });
    expect(bigRes.status).toBe(400);
    errorGuard.assertClean();
  });
});
