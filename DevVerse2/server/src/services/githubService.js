// =============================================================================
// GitHub Service — Real-time GitHub Profile, Contributions, & Activity Feed
// =============================================================================
const https = require('https');
const { execFile } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// Workspace root directory (where local .git is located)
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../');

// In-memory cache with 30-second TTL to ensure fresh activity while avoiding external rate limits
const cache = new Map();
const CACHE_TTL_MS = 30 * 1000;

function hashEventId(prefix, str) {
  return `${prefix}-${crypto.createHash('sha256').update(str || String(Date.now())).digest('hex').slice(0, 16)}`;
}

/**
 * Get current local git HEAD commit hash (used to invalidate cache on new commits).
 */
function getGitHead() {
  return new Promise((resolve) => {
    execFile('git', ['rev-parse', 'HEAD'], { cwd: WORKSPACE_ROOT }, (err, stdout) => {
      if (err || !stdout) return resolve('');
      resolve(stdout.trim());
    });
  });
}

/**
 * Extract recent commits directly from local git repository for real-time activity.
 */
function getLocalGitCommits(maxCount = 20) {
  return new Promise((resolve) => {
    execFile(
      'git',
      ['log', '-n', String(maxCount), '--format=%H|%h|%an|%ae|%aI|%s'],
      { cwd: WORKSPACE_ROOT },
      (err, stdout) => {
        if (err || !stdout) return resolve([]);
        try {
          const lines = stdout.trim().split('\n').filter(Boolean);
          const commits = lines.map((line) => {
            const parts = line.split('|');
            const hash = parts[0] ? parts[0].trim() : '';
            const shortHash = parts[1] ? parts[1].trim() : '';
            const author = parts[2] ? parts[2].trim() : '';
            const email = parts[3] ? parts[3].trim() : '';
            const dateStr = parts[4] ? parts[4].trim() : '';
            const subject = parts.slice(5).join('|').trim();

            return {
              id: `git-${shortHash}`,
              title: `${author} pushed to Unified-Developer-Ecosystem`,
              description: `pushed commit: ${subject}`,
              repo: 'Unified-Developer-Ecosystem',
              published: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
              url: `https://github.com/neelabh16/Unified-Developer-Ecosystem/commit/${hash}`,
              username: author,
              email,
              avatarUrl: `https://avatars.githubusercontent.com/${encodeURIComponent(author)}`,
            };
          });
          resolve(commits);
        } catch {
          resolve([]);
        }
      }
    );
  });
}

/**
 * Perform HTTPS GET request with User-Agent header.
 */
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'DevVerse-Ecosystem/2.0 (compatible; Node.js)',
          Accept: 'text/html,application/xhtml+xml,application/xml,application/atom+xml;q=0.9,*/*;q=0.8',
        },
        timeout: 8000,
      },
      (res) => {
        // Handle HTTP redirects (301/302)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let nextUrl = res.headers.location;
          if (nextUrl.startsWith('/')) {
            try {
              const parsed = new URL(url);
              nextUrl = `${parsed.protocol}//${parsed.host}${nextUrl}`;
            } catch {
              nextUrl = `https://github.com${nextUrl}`;
            }
          }
          return resolve(fetchText(nextUrl));
        }
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

/**
 * Fetch and parse GitHub contribution heatmap data.
 */
async function fetchContributions(username) {
  try {
    const res = await fetchText(`https://github.com/users/${encodeURIComponent(username)}/contributions`);
    if (res.status !== 200) return { total: 0, days: [] };

    // Extract total contributions in the last year
    let total = 0;
    const totalMatch = res.body.match(/([\d,]+)\s+contributions\s+in the last year/i);
    if (totalMatch) {
      total = parseInt(totalMatch[1].replace(/,/g, ''), 10);
    }

    // Extract each date cell with level (0-4)
    const cellRegex = /data-date="([^"]+)"[^>]*data-level="([0-4])"/g;
    const days = [];
    let match;
    while ((match = cellRegex.exec(res.body)) !== null) {
      days.push({
        date: match[1],
        level: parseInt(match[2], 10),
      });
    }

    return { total, days };
  } catch (err) {
    console.warn(`[GitHubService] Could not fetch contributions for ${username}:`, err.message);
    return { total: 0, days: [] };
  }
}

/**
 * Fetch and parse GitHub public atom feed, branch commits, and local workspace commits.
 */
async function fetchActivityFeed(username) {
  try {
    const cleanUser = (username || '').toLowerCase().trim();
    const events = [];
    const seen = new Set();

    // 1. Extract local workspace git commits strictly for the requested logged-in user
    const localCommits = await getLocalGitCommits(25);
    for (const commit of localCommits) {
      const author = (commit.username || '').toLowerCase();
      const email = (commit.email || '').toLowerCase();
      const isMatch =
        author === cleanUser ||
        author.includes(cleanUser) ||
        cleanUser.includes(author) ||
        (cleanUser.length > 2 && email.includes(cleanUser)) ||
        cleanUser.replace(/[-_]/g, '') === author.replace(/[-_]/g, '');

      if (isMatch && !seen.has(commit.id) && !seen.has(commit.url)) {
        seen.add(commit.id);
        if (commit.url) seen.add(commit.url);
        events.push(commit);
      }
    }

    // 2. Fetch remote branch commits Atom feed (only commits authored by this user)
    const branchAtomUrls = [
      `https://github.com/${encodeURIComponent(username)}/Unified-Developer-Ecosystem/commits/feature/devverse-backend-integration.atom`,
    ];

    for (const branchUrl of branchAtomUrls) {
      try {
        const branchRes = await fetchText(branchUrl);
        if (branchRes.status === 200) {
          const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
          let m;
          while ((m = entryRegex.exec(branchRes.body)) !== null) {
            const entry = m[1];
            const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
            const pubMatch = entry.match(/<updated>([\s\S]*?)<\/updated>/) || entry.match(/<published>([\s\S]*?)<\/published>/);
            const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
            const authorMatch = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);
            const thumbMatch = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/);

            const authorName = authorMatch ? authorMatch[1].trim() : '';
            const authorClean = authorName.toLowerCase();
            const isAuthorMatch =
              authorClean === cleanUser ||
              authorClean.includes(cleanUser) ||
              cleanUser.includes(authorClean) ||
              cleanUser.replace(/[-_]/g, '') === authorClean.replace(/[-_]/g, '');

            if (!isAuthorMatch) continue;

            const rawTitle = titleMatch ? titleMatch[1].trim() : '';
            const published = pubMatch ? pubMatch[1].trim() : new Date().toISOString();
            const url = linkMatch ? linkMatch[1] : '';
            const eventId = hashEventId('gh-commit', url || (rawTitle + published));

            if (url && !seen.has(url) && !seen.has(eventId)) {
              seen.add(url);
              seen.add(eventId);
              events.push({
                id: eventId,
                title: `${authorName} pushed to Unified-Developer-Ecosystem`,
                description: `pushed commit: ${rawTitle}`,
                repo: 'Unified-Developer-Ecosystem',
                published,
                url,
                username: authorName,
                avatarUrl: thumbMatch ? thumbMatch[1] : `https://avatars.githubusercontent.com/${authorName}`,
              });
            }
          }
        }
      } catch (err) {
        // Continue if branch atom feed is unavailable
      }
    }

    // 3. Fetch user public Atom feed for general GitHub activity
    const res = await fetchText(`https://github.com/${encodeURIComponent(username)}.atom`);
    if (res.status === 200) {
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match;
      while ((match = entryRegex.exec(res.body)) !== null) {
        const entry = match[1];
        const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const pubMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
        const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
        const authorMatch = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);
        const thumbMatch = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/);

        const rawTitle = titleMatch ? titleMatch[1].trim() : '';
        const published = pubMatch ? pubMatch[1].trim() : new Date().toISOString();
        const url = linkMatch ? linkMatch[1] : `https://github.com/${username}`;
        const eventId = hashEventId('gh', url + published);

        if (!seen.has(url) && !seen.has(eventId)) {
          seen.add(url);
          seen.add(eventId);

          let description = rawTitle;
          let repo = '';
          if (rawTitle.includes(' pushed ')) {
            const parts = rawTitle.split(' pushed ');
            repo = parts[1] || '';
            description = `pushed commits to ${repo}`;
          } else if (rawTitle.includes(' created a branch ')) {
            const parts = rawTitle.split(' created a branch ');
            repo = parts[1] || '';
            description = `created branch on ${repo}`;
          } else if (rawTitle.includes(' created a repository ')) {
            const parts = rawTitle.split(' created a repository ');
            repo = parts[1] || '';
            description = `created repository ${repo}`;
          } else if (rawTitle.includes(' starred ')) {
            const parts = rawTitle.split(' starred ');
            repo = parts[1] || '';
            description = `starred ${repo}`;
          }

          events.push({
            id: eventId,
            title: rawTitle,
            description,
            repo,
            published,
            url,
            username: authorMatch ? authorMatch[1].trim() : username,
            avatarUrl: thumbMatch ? thumbMatch[1] : `https://avatars.githubusercontent.com/${username}`,
          });
        }
      }
    }

    // 4. Fallback: If events are scarce (< 8), fetch commits directly from user's public repositories
    if (events.length < 8) {
      try {
        const repos = await fetchRepositories(username);
        for (const repo of repos.slice(0, 4)) {
          try {
            const repoAtomRes = await fetchText(`https://github.com/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/commits.atom`);
            if (repoAtomRes.status === 200) {
              const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
              let m;
              while ((m = entryRegex.exec(repoAtomRes.body)) !== null) {
                const entry = m[1];
                const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
                const pubMatch = entry.match(/<updated>([\s\S]*?)<\/updated>/) || entry.match(/<published>([\s\S]*?)<\/published>/);
                const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
                const authorMatch = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);
                const thumbMatch = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/);

                const rawTitle = titleMatch ? titleMatch[1].trim() : '';
                const published = pubMatch ? pubMatch[1].trim() : new Date().toISOString();
                const url = linkMatch ? linkMatch[1] : `https://github.com/${username}/${repo.name}`;
                const authorName = authorMatch ? authorMatch[1].trim() : username;
                const eventId = hashEventId('gh-repo-commit', url || (rawTitle + published));

                if (!seen.has(url) && !seen.has(eventId)) {
                  seen.add(url);
                  seen.add(eventId);
                  events.push({
                    id: eventId,
                    title: `${authorName || username} pushed to ${repo.name}`,
                    description: `pushed commit: ${rawTitle}`,
                    repo: repo.name,
                    published,
                    url,
                    username: authorName || username,
                    avatarUrl: thumbMatch ? thumbMatch[1] : `https://avatars.githubusercontent.com/${username}`,
                  });
                }
              }
            }
          } catch {
            // Ignore individual repo fetch errors
          }
        }
      } catch {
        // Ignore repo listing errors
      }
    }

    // 5. Fallback: If still 0 events, surface repository creation/presence events
    if (events.length === 0) {
      try {
        const repos = await fetchRepositories(username);
        for (const repo of repos.slice(0, 5)) {
          const eventId = `gh-repo-${repo.name}`;
          if (!seen.has(eventId)) {
            seen.add(eventId);
            events.push({
              id: eventId,
              title: `${username} created repository ${repo.name}`,
              description: `public repository: ${repo.desc || 'Available on GitHub'}`,
              repo: repo.name,
              published: new Date().toISOString(),
              url: repo.url,
              username,
              avatarUrl: `https://avatars.githubusercontent.com/${username}`,
            });
          }
        }
      } catch {}
    }

    // Sort strictly in descending chronological order (newest first)
    events.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    return events;
  } catch (err) {
    console.warn(`[GitHubService] Could not fetch activity feed for ${username}:`, err.message);
    return [];
  }
}

/**
 * Fetch and parse public repositories for a GitHub user.
 */
async function fetchRepositories(username) {
  try {
    const res = await fetchText(`https://github.com/${encodeURIComponent(username)}?tab=repositories`);
    if (res.status !== 200) return [];

    const blockRegex = /<li[^>]*class="[^"]*col-12[^"]*"[\s\S]*?<\/li>/g;
    const repos = [];
    let match;

    while ((match = blockRegex.exec(res.body)) !== null) {
      const block = match[0];
      const nameMatch = block.match(new RegExp(`href="/${username}/([^"/]+)"`, 'i'));
      const descMatch = block.match(/itemprop="description">([\s\S]*?)<\/p>/);
      const langMatch = block.match(/itemprop="programmingLanguage">([\s\S]*?)<\/span>/);
      const starsMatch = block.match(new RegExp(`href="/${username}/[^"]+/stargazers"[\\s\\S]*?>\\s*([\\d,]+)\\s*</a>`, 'i'));

      if (nameMatch && !repos.find((r) => r.name === nameMatch[1])) {
        const cleanName = nameMatch[1];
        repos.push({
          name: cleanName,
          title: cleanName.replace(/[-_]/g, ' '),
          url: `https://github.com/${username}/${cleanName}`,
          desc: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : 'Public repository on GitHub',
          language: langMatch ? langMatch[1].trim() : 'Code',
          stars: starsMatch ? parseInt(starsMatch[1].replace(/,/g, ''), 10) : 0,
        });
      }
    }

    return repos;
  } catch (err) {
    console.warn(`[GitHubService] Could not fetch repos for ${username}:`, err.message);
    return [];
  }
}

/**
 * Fetch profile stats (followers, following, public_repos, avatar, bio).
 */
async function fetchProfileStats(username) {
  try {
    const res = await fetchText(`https://github.com/${encodeURIComponent(username)}`);
    if (res.status !== 200) {
      return { followers: 0, following: 0, public_repos: 0, bio: '', avatarUrl: '' };
    }

    const folMatch = res.body.match(/tab=followers[\s\S]*?<span[^>]*class="[^"]*text-bold[^"]*"[^>]*>([\d,]+)<\/span>/);
    const fingMatch = res.body.match(/tab=following[\s\S]*?<span[^>]*class="[^"]*text-bold[^"]*"[^>]*>([\d,]+)<\/span>/);
    const repoMatch = res.body.match(/tab=repositories[\s\S]*?<span[^>]*class="[^"]*Counter[^"]*"[^>]*>([\d,]+)<\/span>/);
    const bioMatch = res.body.match(/<div[^>]*class="[^"]*user-profile-bio[^"]*"[^>]*>[\s\S]*?<div>([\s\S]*?)<\/div>/);
    const avatarMatch = res.body.match(/class="[^"]*avatar-user[^"]*"[^>]*src="([^"]+)"/);

    return {
      followers: folMatch ? parseInt(folMatch[1].replace(/,/g, ''), 10) : 0,
      following: fingMatch ? parseInt(fingMatch[1].replace(/,/g, ''), 10) : 0,
      public_repos: repoMatch ? parseInt(repoMatch[1].replace(/,/g, ''), 10) : 0,
      bio: bioMatch ? bioMatch[1].replace(/<[^>]*>/g, '').trim() : '',
      avatarUrl: avatarMatch ? avatarMatch[1] : `https://avatars.githubusercontent.com/${username}`,
    };
  } catch (err) {
    console.warn(`[GitHubService] Could not fetch profile stats for ${username}:`, err.message);
    return { followers: 0, following: 0, public_repos: 0, bio: '', avatarUrl: '' };
  }
}

/**
 * Get comprehensive GitHub profile data with caching and instant git HEAD invalidation.
 */
async function getGitHubUserData(username) {
  if (!username) return null;
  const cleanUsername = username.toLowerCase().trim();

  const currentHead = await getGitHead();
  const cached = cache.get(cleanUsername);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS) && cached.gitHead === currentHead) {
    return cached.data;
  }

  // Fetch all in parallel
  const [stats, contribs, events, repos] = await Promise.all([
    fetchProfileStats(cleanUsername),
    fetchContributions(cleanUsername),
    fetchActivityFeed(cleanUsername),
    fetchRepositories(cleanUsername),
  ]);

  // If there are commits today in events, reflect them in heatmap if missing
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCommits = events.filter((ev) => ev.published && ev.published.startsWith(todayStr));
  if (todayCommits.length > 0 && Array.isArray(contribs.days)) {
    const existingDay = contribs.days.find((d) => d.date === todayStr);
    if (existingDay) {
      existingDay.level = Math.max(existingDay.level, 3);
    } else {
      contribs.days.push({ date: todayStr, level: 3 });
    }
    contribs.total = Math.max(contribs.total, contribs.total + todayCommits.length);
  }

  const data = {
    username: cleanUsername,
    followers: stats.followers,
    following: stats.following,
    public_repos: Math.max(stats.public_repos, repos.length),
    bio: stats.bio,
    avatarUrl: stats.avatarUrl,
    totalContributions: contribs.total,
    contributions: contribs.days,
    events,
    repos,
  };

  cache.set(cleanUsername, { timestamp: Date.now(), gitHead: currentHead, data });
  return data;
}

/**
 * Fetch detailed repository information with rate-limit fallback.
 */
async function getRepoDetails(owner, repo) {
  if (!owner || !repo) return null;
  const cleanRepo = repo.replace(/\.git$/, '');
  const cacheKey = `repo:${owner.toLowerCase()}/${cleanRepo.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let result = null;

  try {
    const pageRes = await fetchText(`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(cleanRepo)}`);
    if (pageRes.status === 200) {
      let description = '';
      const descJson = pageRes.body.match(/"description":"([^"]+)"/);
      if (descJson) {
        description = descJson[1];
      } else {
        const descP = pageRes.body.match(/<p class="[^"]*f4[^"]*">([\s\S]*?)<\/p>/);
        if (descP) description = descP[1].replace(/<[^>]+>/g, '').trim();
      }

      const langMatch = pageRes.body.match(/href="\/[^/]+\/[^/]+\/search\?l=([^"&]+)"/);
      const language = langMatch ? decodeURIComponent(langMatch[1]) : 'JavaScript';

      const starMatch = pageRes.body.match(/id="repo-stars-counter-star"[^>]*title="([\d,]+)"/) ||
                        pageRes.body.match(/id="repo-stars-counter-star"[^>]*>([\d,]+)<\/span>/);
      const stars = starMatch ? parseInt(starMatch[1].replace(/,/g, ''), 10) : 0;

      // Commits timeline via public Atom feed
      const atomRes = await fetchText(`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(cleanRepo)}/commits.atom`);
      const timeline = [];
      if (atomRes.status === 200) {
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let m;
        while ((m = entryRegex.exec(atomRes.body)) !== null && timeline.length < 5) {
          const entry = m[1];
          const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
          const dateMatch = entry.match(/<updated>([\s\S]*?)<\/updated>/);
          if (titleMatch && dateMatch) {
            const msAgo = Date.now() - new Date(dateMatch[1]).getTime();
            const daysAgo = Math.floor(msAgo / 86400000);
            let when = 'just now';
            if (daysAgo > 365) when = Math.floor(daysAgo / 365) + ' year' + (Math.floor(daysAgo / 365) > 1 ? 's' : '') + ' ago';
            else if (daysAgo > 30) when = Math.floor(daysAgo / 30) + ' month' + (Math.floor(daysAgo / 30) > 1 ? 's' : '') + ' ago';
            else if (daysAgo > 7) when = Math.floor(daysAgo / 7) + ' week' + (Math.floor(daysAgo / 7) > 1 ? 's' : '') + ' ago';
            else if (daysAgo > 0) when = daysAgo + ' day' + (daysAgo > 1 ? 's' : '') + ' ago';

            timeline.push({
              label: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
              when,
            });
          }
        }
      }

      result = {
        name: cleanRepo,
        full_name: `${owner}/${cleanRepo}`,
        description: description || 'Public repository on GitHub',
        language: language || 'Code',
        html_url: `https://github.com/${owner}/${cleanRepo}`,
        stargazers_count: stars,
        timeline,
      };
    }
  } catch (err) {
    console.warn(`[GitHubService] Public repo parse failed for ${owner}/${cleanRepo}:`, err.message);
  }

  if (result) {
    cache.set(cacheKey, { timestamp: Date.now(), data: result });
  }

  return result;
}

module.exports = {
  getGitHubUserData,
  getRepoDetails,
  fetchContributions,
  fetchActivityFeed,
  fetchRepositories,
  fetchProfileStats,
};
