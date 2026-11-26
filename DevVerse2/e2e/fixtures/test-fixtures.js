const base = require('@playwright/test');
const { expect } = base;
const { BASE_URL, API_URL, E2E_MONGO_URI } = require('./env');
const {
  SEED_PASSWORD,
  seedDatabase,
  setUserPoints,
} = require('./seed');
const { ApiClient } = require('./api-client');

const EXPECTED_4XX_CONSOLE_RE =
  /Failed to load resource: the server responded with a status of 40[01349]\b/;

const DARK_ACCENT_HEX = {
  violet: '#7c6fff',
  cyan: '#4fe3c1',
  coral: '#ff6b5b',
  amber: '#ffb86b',
  legend: '#f0c419',
};

const ALL_16_ROUTES = [
  '/',
  '/explore',
  '/projects/p1',
  '/submit-project',
  '/hackathons',
  '/hackathons/h1',
  '/squads',
  '/communities',
  '/communities/c1',
  '/codex',
  '/leaderboard',
  '/portfolio',
  '/profile',
  '/settings',
  '/login',
  '/signup',
];

function normalizeHex(color) {
  if (!color) return '';
  const trimmed = color.trim().toLowerCase();
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    return trimmed;
  }
  const rgbMatch = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!rgbMatch) return trimmed;
  const toHex = (n) => Number(n).toString(16).padStart(2, '0');
  return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
}

async function loginViaUI(page, identifier, password = SEED_PASSWORD) {
  await page.goto('/login');
  const identifierInput = page
    .getByLabel(/email or username/i)
    .or(page.getByPlaceholder(/email or username|@?username|you@/i))
    .first();
  const passwordInput = page
    .getByLabel(/^password$/i)
    .or(page.locator('input[type="password"]'))
    .first();

  await identifierInput.fill(identifier);
  await passwordInput.fill(password);

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/login') && res.request().method() === 'POST'
    ),
    page.getByRole('button', { name: /^sign in$/i }).click(),
  ]);

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

async function loginViaApi(page, identifier, password = SEED_PASSWORD) {
  const res = await page.request.post(`${API_URL}/auth/login`, {
    data: { identifier, password },
    headers: {
      Origin: new URL(API_URL).origin,
    },
  });
  expect(res.ok(), `API login failed for ${identifier}: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.data;
}

async function assertNoHorizontalOverflow(page, routeLabel = '') {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    metrics.scrollWidth,
    `Horizontal overflow detected${routeLabel ? ` on ${routeLabel}` : ''}: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`
  ).toBeLessThanOrEqual(metrics.clientWidth);
  return metrics;
}

async function readDesignTokens(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const cs = getComputedStyle(html);
    const readVar = (name) => cs.getPropertyValue(name).trim();

    // Inspect visible glass-styled elements via computed backdropFilter
    const allElements = Array.from(document.querySelectorAll('main *, header *, nav *, section *, div'));
    let glassBlurCount = 0;
    for (const el of allElements.slice(0, 250)) {
      const style = getComputedStyle(el);
      const bf = style.backdropFilter || style.webkitBackdropFilter || '';
      if (bf && bf !== 'none' && bf.includes('blur')) {
        glassBlurCount += 1;
      }
    }

    return {
      dataTheme: html.getAttribute('data-theme'),
      dataAccent: html.getAttribute('data-accent'),
      dataMotion: html.getAttribute('data-motion'),
      tokens: {
        violet: readVar('--violet'),
        cyan: readVar('--cyan'),
        coral: readVar('--coral'),
        amber: readVar('--amber'),
        legend: readVar('--legend'),
        accent: readVar('--accent'),
        bg: readVar('--bg'),
        textPrimary: readVar('--text-primary'),
      },
      bodyBg: getComputedStyle(document.body).backgroundColor,
      bodyColor: getComputedStyle(document.body).color,
      glassBlurCount,
    };
  });
}

function buildDeterministicContributions(daysCount = 182) {
  const days = [];
  const now = new Date();
  for (let i = daysCount - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 86400_000);
    days.push({
      date: d.toISOString().split('T')[0],
      level: (i % 4) + 1,
    });
  }
  return days;
}

async function mockGitHubApi(page, { fail = false } = {}) {
  await page.route('https://api.github.com/**', async (route) => {
    const url = route.request().url();
    if (fail) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'API rate limit exceeded' }),
      });
      return;
    }

    if (url.includes('/events')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1001',
            type: 'PushEvent',
            repo: { name: 'devverse-org/aurora-engine' },
            created_at: new Date().toISOString(),
            payload: { commits: [{ message: 'feat: initial shader pipeline' }] },
          },
        ]),
      });
      return;
    }

    if (url.includes('/users/') && !url.includes('/search/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          login: 'codexuser',
          public_repos: 8,
          followers: 24,
          following: 12,
          bio: 'Open source systems developer',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          html_url: 'https://github.com/codexuser',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 101,
            full_name: 'devverse-org/aurora-engine',
            name: 'aurora-engine',
            description: 'High-speed WebGL aurora renderer for modern web apps',
            html_url: 'https://github.com/devverse-org/aurora-engine',
            stargazers_count: 1420,
            language: 'TypeScript',
          },
          {
            id: 102,
            full_name: 'devverse-org/kestrel-runtime',
            name: 'kestrel-runtime',
            description: 'Deterministic WebAssembly sandbox in Rust',
            html_url: 'https://github.com/devverse-org/kestrel-runtime',
            stargazers_count: 980,
            language: 'Rust',
          },
        ],
      }),
    });
  });

  await page.route('**/api/v1/github/user/**', async (route) => {
    const url = route.request().url();
    if (fail) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Failed to fetch GitHub data for user' }),
      });
      return;
    }

    const match = url.match(/\/api\/v1\/github\/user\/([^/?#]+)/);
    const username = match ? decodeURIComponent(match[1]) : 'codexuser';
    const contributions = buildDeterministicContributions(182);
    const events = [
      {
        id: `gh-ev-${username}-1`,
        title: `${username} pushed to aurora-engine`,
        description: 'pushed commit: feat: shader pipeline optimization',
        repo: 'aurora-engine',
        published: new Date().toISOString(),
        url: `https://github.com/${username}/aurora-engine`,
        username,
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      },
    ];
    const repos = [
      {
        name: 'aurora-engine',
        title: 'aurora engine',
        url: `https://github.com/${username}/aurora-engine`,
        desc: 'High-speed WebGL aurora renderer for modern web apps',
        language: 'TypeScript',
        stars: 42,
      },
    ];

    if (url.includes('/contributions')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'GitHub contributions retrieved',
          data: { total: 128, days: contributions },
        }),
      });
      return;
    }

    if (url.includes('/events')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'GitHub events retrieved',
          data: { events },
        }),
      });
      return;
    }

    if (url.includes('/repos')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'GitHub repositories retrieved',
          data: { repos },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'GitHub user data retrieved',
        data: {
          username,
          followers: 24,
          following: 12,
          public_repos: 8,
          bio: 'Open source systems developer',
          avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
          totalContributions: 128,
          contributions,
          events,
          repos,
        },
      }),
    });
  });

  await page.route('**/api/v1/github/repo/**', async (route) => {
    const url = route.request().url();
    if (fail || url.includes('nonexistent') || url.includes('private-repo')) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Repository not found or private.' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          name: 'aurora-engine',
          full_name: 'devverse-org/aurora-engine',
          description: 'High-speed WebGL aurora renderer imported from GitHub.',
          language: 'TypeScript',
          html_url: 'https://github.com/devverse-org/aurora-engine',
          stargazers_count: 1420,
          timeline: [
            { label: 'feat: initial shader pipeline', when: '3 days ago' },
            { label: 'perf: instanced particle batching', when: 'yesterday' },
          ],
        },
      }),
    });
  });
}

async function assertLeaderboardUserStats(page, expectedPoints, expectedTierRegex = null) {
  const pointsStr = String(expectedPoints);
  const tierSource = expectedTierRegex ? expectedTierRegex.source : null;
  const tierFlags = expectedTierRegex ? expectedTierRegex.flags : null;

  await expect
    .poll(async () => {
      return page.evaluate(
        ({ pts, tSource, tFlags }) => {
          const ptsRe = new RegExp(`\\b${pts}\\b`);
          const allElements = Array.from(document.querySelectorAll('main *'));

          const findCardText = (labelRe, maxLen, excludeRe) => {
            const labelEl = allElements.find((el) => {
              const txt = (el.textContent || '').trim();
              return txt.length < 40 && labelRe.test(txt) && el.children.length <= 2;
            });
            if (!labelEl) return null;
            let cur = labelEl;
            for (let depth = 0; depth < 4 && cur && cur.tagName !== 'MAIN'; depth += 1) {
              const txt = (cur.textContent || '').replace(/\s+/g, ' ').trim();
              if (txt.length <= maxLen && (!excludeRe || !excludeRe.test(txt))) {
                if (/\d/.test(txt) || depth >= 1) {
                  return txt;
                }
              }
              cur = cur.parentElement;
            }
            return null;
          };

          const totalText = findCardText(/your total/i, 160, /how points work/i);
          const totalOk = Boolean(totalText && ptsRe.test(totalText));

          // Find the user's own leaderboard row via the "You" badge
          const youBadge = allElements.find((el) => {
            const txt = (el.textContent || '').trim();
            return /^you$/i.test(txt) || (/^\(?you\)?$/i.test(txt) && el.children.length === 0);
          });
          let youRowText = null;
          if (youBadge) {
            let cur = youBadge.parentElement;
            for (let depth = 0; depth < 4 && cur && cur.tagName !== 'MAIN'; depth += 1) {
              const txt = (cur.textContent || '').replace(/\s+/g, ' ').trim();
              if (txt.length < 240 && ptsRe.test(txt)) {
                youRowText = txt;
                break;
              }
              cur = cur.parentElement;
            }
          }
          const youRowOk = Boolean(youRowText);

          let tierOk = true;
          let tierText = null;
          if (tSource) {
            const tierRe = new RegExp(tSource, tFlags || 'i');
            const labelEl = allElements.find((el) => {
              const txt = (el.textContent || '').trim();
              return txt.length < 40 && /your tier/i.test(txt) && el.children.length <= 2;
            });
            if (labelEl) {
              let cur = labelEl;
              for (let depth = 0; depth < 3 && cur && cur.tagName !== 'MAIN'; depth += 1) {
                const raw = (cur.textContent || '').replace(/\s+/g, ' ').trim();
                // Avoid the static 5-step tier track listing 3+ tier names simultaneously
                const tierHits = [
                  /\bnewcomer\b/i,
                  /\bbuilder\b/i,
                  /established builder/i,
                  /veteran builder/i,
                  /\blegend\b/i,
                ].filter((re) => re.test(raw)).length;
                if (raw.length < 220 && !/how points work/i.test(raw) && tierHits <= 2) {
                  // Remove user's seeded display name and "pts to <next tier>" text
                  const activeSegment = raw
                    .replace(/newcomer\s+builder|legend\s+architect/gi, '')
                    .split(/\bpts?\s+to\b/i)[0];
                  if (tierRe.test(activeSegment)) {
                    tierText = activeSegment;
                    break;
                  }
                }
                cur = cur.parentElement;
              }
            }
            tierOk = Boolean(tierText);
          }

          return { totalOk, youRowOk, tierOk, totalText, youRowText, tierText };
        },
        { pts: pointsStr, tSource: tierSource, tFlags: tierFlags }
      );
    })
    .toMatchObject({ totalOk: true, tierOk: true });
}

async function assertValidationFeedback(page, inputLocator, messageRegex = null) {
  await expect
    .poll(async () => {
      if (inputLocator) {
        const invalidAttr = await inputLocator.getAttribute('aria-invalid').catch(() => null);
        if (invalidAttr === 'true') return 'aria-invalid';
        const nativeMsg = await inputLocator
          .evaluate((el) => (typeof el.validationMessage === 'string' ? el.validationMessage : ''))
          .catch(() => '');
        if (nativeMsg && nativeMsg.trim().length > 0) return 'native-validation';
      }
      const alertVisible = await page
        .locator('[role="alert"], [aria-invalid="true"], .text-red-400, .text-coral, [class*="error"]')
        .first()
        .isVisible()
        .catch(() => false);
      if (alertVisible) return 'inline-error-el';
      if (messageRegex) {
        const textVisible = await page
          .locator('main, form')
          .getByText(messageRegex)
          .first()
          .isVisible()
          .catch(() => false);
        if (textVisible) return 'error-text';
      }
      return 'none';
    })
    .not.toBe('none');
}

const test = base.test.extend({
  page: async ({ page }, use) => {
    await mockGitHubApi(page);
    await use(page);
  },

  errorGuard: async ({ page }, use) => {
    const consoleErrors = [];
    const pageErrors = [];
    const server5xx = [];
    let allowConsole = false;
    let allow4xx = false;
    let allow5xx = false;

    const onConsole = (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    };
    const onPageError = (err) => {
      pageErrors.push(err.message || String(err));
    };
    const onResponse = (res) => {
      if (res.status() >= 500 && res.url().includes('/api/v1/')) {
        server5xx.push(`${res.status()} ${res.url()}`);
      }
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    page.on('response', onResponse);

    const guard = {
      consoleErrors,
      pageErrors,
      server5xx,
      allowConsoleErrors(flag = true) {
        allowConsole = flag;
      },
      allowExpected4xx(flag = true) {
        allow4xx = flag;
      },
      allowServer5xx(flag = true) {
        allow5xx = flag;
      },
      assertClean() {
        expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
        if (!allowConsole) {
          const unexpectedConsoleErrors = allow4xx
            ? consoleErrors.filter((msg) => !EXPECTED_4XX_CONSOLE_RE.test(msg))
            : consoleErrors;
          expect(
            unexpectedConsoleErrors,
            `Unexpected console.error calls: ${unexpectedConsoleErrors.join(' | ')}`
          ).toEqual([]);
        }
        if (!allow5xx) {
          expect(server5xx, `Unexpected 5xx API responses: ${server5xx.join(' | ')}`).toEqual(
            []
          );
        }
      },
    };

    await use(guard);

    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('response', onResponse);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    if (!allow5xx) {
      expect(server5xx, `Unexpected 5xx API responses: ${server5xx.join(' | ')}`).toEqual([]);
    }
  },

  api: async ({}, use) => {
    const client = new ApiClient(API_URL);
    await use(client);
  },

  reseed: async ({}, use) => {
    await use(async () => seedDatabase(E2E_MONGO_URI));
  },
});

module.exports = {
  test,
  expect,
  BASE_URL,
  API_URL,
  SEED_PASSWORD,
  DARK_ACCENT_HEX,
  ALL_16_ROUTES,
  normalizeHex,
  loginViaUI,
  loginViaApi,
  assertNoHorizontalOverflow,
  readDesignTokens,
  mockGitHubApi,
  assertLeaderboardUserStats,
  assertValidationFeedback,
  seedDatabase,
  setUserPoints,
};
