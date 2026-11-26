const {
  test,
  expect,
  loginViaUI,
  assertValidationFeedback,
} = require('../../fixtures/test-fixtures');

test.describe('Tier 2 — F5: Hackathons List Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F5-01: My Registered toggle with 0 registrations shows empty-state guidance', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons');
    await page.getByRole('button', { name: /my registered/i }).click();
    await expect(
      page.getByText(/haven't registered|no registered hackathons|all hackathons/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F5-02: rapidly toggling Register twice leaves state clean without 409/crash', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons');

    const regBtn = page.getByRole('button', { name: /^register$/i }).first();
    await regBtn.click();
    await expect(
      page.getByRole('button', { name: /registered/i }).first()
    ).toBeVisible();
    await page.getByRole('button', { name: /registered/i }).first().click();
    await expect(
      page.getByRole('button', { name: /^register$/i }).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F5-03: hackathon with past end timestamp displays Live now instead of negative countdown', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/hackathons');
    await expect(page.getByText(/midnight live ship sprint/i).first()).toBeVisible();
    await expect(page.getByText(/live now/i).first()).toBeVisible();
    await expect(page.getByText(/-\d+d|-\d+h/)).toHaveCount(0);
    errorGuard.assertClean();
  });

  test('T2-F5-04: unauthenticated user clicking Register prompts sign-in or redirects without persistence', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await page.goto('/hackathons');
    await page.getByRole('button', { name: /^register$/i }).first().click();
    await expect
      .poll(async () => {
        if (/\/login/.test(page.url())) return 'redirected';
        const promptVisible = await page
          .locator('main, [role="alert"], [role="status"], [aria-live]')
          .getByText(/sign in|log in|not authenticated|please sign in/i)
          .first()
          .isVisible()
          .catch(() => false);
        return promptVisible ? 'prompted' : 'none';
      })
      .not.toBe('none');
    if (!/\/login/.test(page.url())) {
      await expect(page.getByRole('button', { name: /^register$/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /^registered$/i })).toHaveCount(0);
    }
    errorGuard.assertClean();
  });

  test('T2-F5-05: DevVerse participant count never drops below 0 on unregister', async ({
    page,
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    const reg = await api.request('POST', '/hackathons/h2/register');
    expect(reg.status).toBe(200);
    const unreg = await api.request('POST', '/hackathons/h2/register');
    expect(unreg.status).toBe(200);
    expect(unreg.json.data.devverseCount).toBeGreaterThanOrEqual(0);
    expect(unreg.json.data.participantsCount).toBeGreaterThanOrEqual(0);
    await page.goto('/hackathons');
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F6: Hackathon Detail Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F6-01: unknown hackathon ID renders graceful fallback without unhandled exception', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await page.goto('/hackathons/invalid-id-999');
    await expect(
      page.getByText(/not found|browse hackathons|all hackathons/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F6-02: legacy query route /hackathon?id=h1 loads h1 detail accurately', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/hackathon?id=h1');
    await expect(
      page.getByRole('heading', { name: /aurora global ai & systems hackathon/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F6-03: unauthenticated user clicks Register now and gets sign-in prompt or redirect', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await page.goto('/hackathons/h1');
    await page
      .getByRole('button', { name: /register now|^register$/i })
      .first()
      .click();
    await expect
      .poll(async () => {
        if (/\/login/.test(page.url())) return 'redirected';
        const promptVisible = await page
          .locator('main, [role="alert"], [role="status"], [aria-live]')
          .getByText(/sign in|log in|not authenticated|please sign in/i)
          .first()
          .isVisible()
          .catch(() => false);
        return promptVisible ? 'prompted' : 'none';
      })
      .not.toBe('none');
    if (!/\/login/.test(page.url())) {
      await expect(
        page.getByRole('button', { name: /register now|^register$/i }).first()
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /^registered$/i })).toHaveCount(0);
    }
    errorGuard.assertClean();
  });

  test('T2-F6-04: registering increments DevVerse delegation count accurately by 1 without double-counting', async ({
    page,
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    const before = await api.request('GET', '/hackathons/h2');
    const beforeCount = before.json.data.devverseParticipants.length;

    await loginViaUI(page, 'newcomer');
    await page.goto('/hackathons/h2');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/register')),
      page.getByRole('button', { name: /register now|^register$/i }).first().click(),
    ]);

    const after = await api.request('GET', '/hackathons/h2');
    expect(after.json.data.devverseParticipants.length).toBe(beforeCount + 1);
    errorGuard.assertClean();
  });

  test('T2-F6-05: judging criteria weights render cleanly without horizontal overflow', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/hackathons/h1');
    await expect(page.getByText(/35%/).first()).toBeVisible();
    await expect(page.getByText(/30%/).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    );
    expect(overflow).toBe(true);
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F7: Squads & Matching Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F7-01: 0 skills selected shows empty matches guidance state', async ({
    page,
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    await api.request('PUT', '/users/profile', {
      body: { squadFinderProfile: { skills: [], categories: [], style: 'either' } },
    });
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');
    await expect(
      page.getByText(/select.*skills|no skills|add skills/i).first()
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F7-02: squad name <3 or >50 chars and description <10 chars blocked by validation', async ({
    page,
    api,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');

    await page
      .getByLabel(/squad name/i)
      .or(page.getByPlaceholder(/squad name/i))
      .first()
      .fill('AB');
    await page
      .getByLabel(/description|pitch|goal/i)
      .or(page.getByPlaceholder(/what are you building|description/i))
      .first()
      .fill('Short');
    await page.getByRole('button', { name: /create squad/i }).click();
    await expect(
      page.getByText(/at least \d+|too short|3.*50|10/i).first()
    ).toBeVisible();

    await api.login('newcomer');
    const longRes = await api.request('POST', '/squads', {
      body: { name: 'S'.repeat(51), description: 'Valid description over ten chars.' },
    });
    expect(longRes.status).toBe(400);
    errorGuard.assertClean();
  });

  test('T2-F7-03: empty/whitespace DM blocked and 1001-char DM rejected by server 400', async ({
    page,
    api,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads');
    await page.getByRole('button', { name: /^message$/i }).first().click();

    let dmSent = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/messages/') && req.method() === 'POST') {
        dmSent = true;
      }
    });

    const dmInput = page
      .getByPlaceholder(/message|say hello|write a message/i)
      .or(page.getByLabel(/message/i))
      .first();
    await dmInput.fill('   ');
    await page.getByRole('button', { name: /^send$/i }).first().click();
    expect(dmSent).toBe(false);
    await assertValidationFeedback(
      page,
      dmInput,
      /enter a message|cannot be empty|required|write a message/i
    );

    await api.login('newcomer');
    const longDm = await api.request('POST', '/messages/kmori', {
      body: { text: 'a'.repeat(1001) },
    });
    expect(longDm.status).toBe(400);
    errorGuard.assertClean();
  });

  test('T2-F7-04: registering same squad twice for same hackathon does not double-award points', async ({
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    const sqRes = await api.request('POST', '/squads', {
      body: { name: 'Idempotent Squad', description: 'Testing duplicate hackathon registration.' },
    });
    expect(sqRes.status).toBe(201);
    const squadId = sqRes.json.data.squad._id;

    const r1 = await api.request('POST', `/squads/${squadId}/hackathons/h1`);
    expect(r1.status).toBe(200);
    const ptsAfterFirst = (await api.getMe()).json.data.user.points;

    const r2 = await api.request('POST', `/squads/${squadId}/hackathons/h1`);
    expect([200, 400, 409]).toContain(r2.status);
    const ptsAfterSecond = (await api.getMe()).json.data.user.points;
    expect(ptsAfterSecond).toBe(ptsAfterFirst);
    errorGuard.assertClean();
  });

  test('T2-F7-05: navigating to /squads?newSquadWith=kmori pre-selects kmori in Create Squad', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/squads?newSquadWith=kmori');

    await page
      .getByLabel(/squad name/i)
      .or(page.getByPlaceholder(/squad name/i))
      .first()
      .fill('Mori Duo');
    await page
      .getByLabel(/description|pitch|goal/i)
      .or(page.getByPlaceholder(/what are you building|description/i))
      .first()
      .fill('Testing pre-selected kmori member inside newly created squad.');

    const [createRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/squads') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /create squad/i }).click(),
    ]);
    expect(createRes.status()).toBe(201);
    const body = await createRes.json();
    const memberHandles = (body?.data?.squad?.members || []).map((m) => m.username);
    expect(memberHandles).toContain('kmori');

    const squadCard = page
      .locator('section, article, div')
      .filter({ hasText: 'Mori Duo' })
      .last();
    await expect(squadCard).toBeVisible();
    await expect(squadCard.getByText(/kmori|kai mori/i).first()).toBeVisible();
    errorGuard.assertClean();
  });
});

test.describe('Tier 2 — F8: Communities List Boundaries', () => {
  test.beforeEach(async ({ reseed }) => {
    await reseed();
  });

  test('T2-F8-01: unauthenticated user clicking Join gets auth prompt and does not persist membership', async ({
    page,
    errorGuard,
  }) => {
    errorGuard.allowExpected4xx(true);
    await page.goto('/communities');
    await page.getByRole('button', { name: /^join$/i }).first().click();
    await expect
      .poll(async () => {
        if (/\/login/.test(page.url())) return 'redirected';
        const promptVisible = await page
          .locator('main, [role="alert"], [role="status"], [aria-live]')
          .getByText(/sign in|log in|not authenticated|please sign in/i)
          .first()
          .isVisible()
          .catch(() => false);
        return promptVisible ? 'prompted' : 'none';
      })
      .not.toBe('none');
    if (!/\/login/.test(page.url())) {
      await expect(page.getByRole('button', { name: /^join$/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /^joined/i })).toHaveCount(0);
    }
    errorGuard.assertClean();
  });

  test('T2-F8-02: community member count never drops below 0 when leaving', async ({
    api,
    errorGuard,
  }) => {
    await api.login('newcomer');
    const joinRes = await api.request('POST', '/communities/c1/join');
    expect(joinRes.status).toBe(200);
    const leaveRes = await api.request('POST', '/communities/c1/join');
    expect(leaveRes.status).toBe(200);
    expect(leaveRes.json.data.membersCount).toBeGreaterThanOrEqual(0);
    errorGuard.assertClean();
  });

  test('T2-F8-03: clicking Open forum navigates to matching /communities/:id slug/id', async ({
    page,
    errorGuard,
  }) => {
    await page.goto('/communities');
    const openLinks = page.getByRole('link', { name: /open forum/i });
    await openLinks.nth(1).click();
    await expect(page).toHaveURL(/\/communities\/|\/community\?id=/);
    await expect(
      page.getByRole('heading', { name: /frontend craft & motion/i })
    ).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F8-04: rapidly toggling Join then Joined works idempotently without 500 error', async ({
    page,
    errorGuard,
  }) => {
    await loginViaUI(page, 'newcomer');
    await page.goto('/communities');
    await page.getByRole('button', { name: /^join$/i }).first().click();
    await expect(page.getByRole('button', { name: /^joined/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /^joined/i }).first().click();
    await expect(page.getByRole('button', { name: /^join$/i }).first()).toBeVisible();
    errorGuard.assertClean();
  });

  test('T2-F8-05: empty discussions backend response renders No threads yet cleanly', async ({
    page,
    errorGuard,
  }) => {
    await page.route('**/api/v1/discussions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { discussions: [] } }),
      });
    });
    await page.goto('/communities');
    await expect(page.getByText(/no threads yet/i).first()).toBeVisible();
    errorGuard.assertClean();
  });
});
