/* =========================================================
   HOME PAGE
   ========================================================= */

function dvTypeTerminal() {
  const el = document.getElementById('terminal-line');
  if (!el) return;
  const commands = ['devverse init --builder', 'devverse deploy legend.exe', 'devverse join hackathon aurora'];
  let cIndex = 0;

  function typeCommand(cmd, cb) {
    let i = 0;
    el.textContent = '';
    const iv = setInterval(() => {
      el.textContent = cmd.slice(0, i);
      i++;
      if (i > cmd.length) {
        clearInterval(iv);
        setTimeout(cb, 1100);
      }
    }, 42);
  }

  function loop() {
    typeCommand(commands[cIndex], () => {
      cIndex = (cIndex + 1) % commands.length;
      loop();
    });
  }
  loop();
}

function dvRenderTrendingProjects() {
  const root = document.getElementById('trending-projects');
  if (!root) return;
  const list = [...dvAllProjects()].sort((a, b) => b.likes - a.likes).slice(0, 6);
  root.innerHTML = list.map(dvProjectCardHTML).join('');

  if (window.DVApi && DVApi.projects && DVApi.projects.list) {
    DVApi.projects.list({ limit: 20 }).then(function (res) {
      const items = (res && res.data && (res.data.projects || (Array.isArray(res.data) ? res.data : []))) || [];
      if (items && items.length) {
        const liveList = items.map(function (p) {
          return {
            id: p.legacyId || p.slug || p.id || p._id,
            _id: p._id ? String(p._id) : (p.id ? String(p.id) : undefined),
            legacyId: p.legacyId,
            title: p.title,
            desc: p.desc || p.tagline,
            tags: p.tags || [],
            difficulty: p.difficulty || 'Intermediate',
            category: p.category || 'General',
            likes: p.likesCount || p.likes || 0,
            views: p.viewsCount || p.views || 0,
            author: (p.author && (p.author.username || p.author.name)) || p.author || 'devverse',
            gradient: typeof p.gradient === 'number' ? p.gradient : 0,
            art: p.art || null
          };
        }).sort((a, b) => b.likes - a.likes).slice(0, 6);
        root.innerHTML = liveList.map(dvProjectCardHTML).join('');
        dvReveal(root);
      }
    }).catch(function () {});
  }
}

function dvRenderTopDevs() {
  const root = document.getElementById('top-devs');
  if (!root) return;

  function getSelfIdentifiers() {
    const selfHandle = typeof dvSelfHandle === 'function' ? dvSelfHandle().toLowerCase() : '';
    const selfId = (window.DVCurrentUser && window.DVCurrentUser._id) ? String(window.DVCurrentUser._id) : '';
    const account = typeof dvAuthAccount === 'function' ? dvAuthAccount() : null;
    const accountHandle = (account && (account.username || account.handle)) ? String(account.username || account.handle).toLowerCase() : '';
    const accountEmail = (account && account.email) ? String(account.email).toLowerCase() : '';
    return { selfHandle, selfId, accountHandle, accountEmail };
  }

  function isSelf(u) {
    if (!u) return false;
    const { selfHandle, selfId, accountHandle, accountEmail } = getSelfIdentifiers();
    const uHandle = (u.username || u.handle || '').toLowerCase();
    const uId = u._id ? String(u._id) : '';
    const uEmail = (u.email || '').toLowerCase();

    if (selfHandle && selfHandle !== 'you' && uHandle === selfHandle) return true;
    if (accountHandle && accountHandle !== 'you' && uHandle === accountHandle) return true;
    if (selfId && uId === selfId) return true;
    if (accountEmail && uEmail && uEmail === accountEmail) return true;
    return false;
  }

  function renderList(list) {
    const filtered = list.filter((d) => !isSelf(d));
    root.innerHTML = filtered.map((d) => {
      const followersLabel = typeof d.followers === 'number'
        ? (d.followers >= 1000 ? (d.followers / 1000).toFixed(1) + 'k' : d.followers)
        : (d.followers || 0);
      const projectsCount = d.projects !== undefined ? d.projects : 0;
      return `
      <a href="profile.html?u=${d.handle}" class="dev-card glass card-lift reveal">
        <div class="dev-avatar-ring"><img src="${dvAvatar(d.avatarSeed)}" alt="${d.name}"></div>
        <div class="dev-name">${d.name}</div>
        <div class="dev-handle">@${d.handle}</div>
        <div class="dev-meta">
          <div><b>${projectsCount}</b>projects</div>
          <div><b>${followersLabel}</b>followers</div>
        </div>
      </a>`;
    }).join('');
    dvReveal(root);
  }

  const initial = [...DV_DEVS].sort((a, b) => b.points - a.points).slice(0, 6).map((d) => ({
    name: d.name,
    handle: d.handle,
    avatarSeed: d.avatarSeed || d.handle,
    points: d.points,
    projects: d.projects,
    followers: d.followers,
  }));
  renderList(initial);

  const authPromise = typeof dvEnsureAuth === 'function' ? dvEnsureAuth() : Promise.resolve();
  authPromise.then(() => {
    if (window.DVApi && DVApi.leaderboard && DVApi.leaderboard.get) {
      DVApi.leaderboard.get({ mode: 'devs', range: 'all' }).then(function (res) {
        const rankings = (res && res.data && res.data.rankings) || [];
        if (rankings.length > 0) {
          const demoHandles = ['kmori', 'ari-devs', 'sena.codes', 'lumen', 'noa.ml', 'priya.dev', 'dax', 'devon.codes', 'elena-v', 'marcus-k'];

          // Real registered users (excluding current logged-in user)
          const realUsers = rankings.filter((u) => {
            const handle = (u.username || u.handle || '').toLowerCase();
            return !demoHandles.includes(handle) && !isSelf(u);
          });
          const topDemoUsers = rankings.filter((u) => {
            const handle = (u.username || u.handle || '').toLowerCase();
            return demoHandles.includes(handle) && !isSelf(u);
          });

          // Display other real users alongside top platform legends (up to 6 total)
          const selectedDevs = [...realUsers, ...topDemoUsers].slice(0, 6);

          const liveDevs = selectedDevs.map(function (u) {
            const handle = u.username || u.handle;
            const demoMatch = typeof DV_DEVS !== 'undefined' ? DV_DEVS.find((d) => d.handle.toLowerCase() === handle.toLowerCase()) : null;

            let projCount = u.projectsCount;
            if (projCount === undefined || projCount === 0) {
              projCount = demoMatch ? demoMatch.projects : (u.projects || 0);
            }

            let folCount = u.followersCount;
            if (folCount === undefined || (folCount === 0 && demoMatch)) {
              folCount = demoMatch ? demoMatch.followers : (u.followers || 0);
            }

            return {
              _id: u._id,
              name: u.name,
              handle: handle,
              avatarSeed: u.avatarSeed || u.avatarUrl || handle,
              points: u.points || 0,
              projects: projCount,
              followers: folCount,
            };
          });
          renderList(liveDevs);
        }
      }).catch(function () {});
    }
  });
}

function dvRenderCategories() {
  const root = document.getElementById('category-tiles');
  if (!root) return;
  const cats = dvUniqueArray(dvAllProjects().map((p) => p.category)).map((c) => ({
    name: c,
    count: dvAllProjects().filter((p) => p.category === c).length,
  }));
  root.innerHTML = cats.map((c, i) => `
    <a href="explore.html?cat=${encodeURIComponent(c.name)}" class="tech-tile glass card-lift reveal">
      <div class="tt-icon">${['⬡', '◆', '●', '◈', '▲'][i % 5]}</div>
      <div class="tt-name">${c.name}</div>
      <div class="tt-count">${c.count} projects</div>
    </a>`).join('');
}

function dvRenderHackathonsPreview() {
  const root = document.getElementById('hackathons-preview');
  if (!root) return;
  root.innerHTML = DV_HACKATHONS.slice(0, 3).map((h) => `
    <a href="hackathons.html" class="glass card-lift reveal" style="padding:22px; display:flex; flex-direction:column; gap:12px;">
      <span class="chip chip-accent">${h.tags[0]}</span>
      <h3>${h.title}</h3>
      <p style="font-size:13.5px;">${h.desc}</p>
      <div style="display:flex; justify-content:space-between; font-size:12.5px; color:var(--text-tertiary); font-family:var(--font-mono); padding-top:10px; border-top:1px solid var(--border);">
        <span>${h.prize} prize pool</span>
        <span>${h.participants.toLocaleString()} joined</span>
      </div>
    </a>`).join('');
}

function dvRenderTechShowcase() {
  const root = document.getElementById('tech-showcase');
  if (!root) return;
  root.innerHTML = DV_TECHS.map((t) => `
    <div class="tech-tile glass card-lift reveal">
      <div class="tt-icon">${t.icon}</div>
      <div class="tt-name">${t.name}</div>
      <div class="tt-count">${t.count.toLocaleString()} builders</div>
    </div>`).join('');
}

function dvRenderCommunityHighlights() {
  const root = document.getElementById('community-highlights');
  if (!root) return;
  const list = [...DV_COMMUNITIES].sort((a, b) => b.online - a.online).slice(0, 3);
  root.innerHTML = list.map((c) => `
    <a href="communities.html" class="glass card-lift reveal" style="padding:20px; display:flex; gap:14px; align-items:center;">
      <div style="width:46px;height:46px;border-radius:13px;background:${DV_TECH_GRADIENTS[c.gradient]};flex-shrink:0;"></div>
      <div>
        <div style="font-weight:600;">${c.name}</div>
        <div class="mono" style="font-size:12px;color:var(--text-tertiary);">${c.online} online now</div>
      </div>
    </a>`).join('');
}

function dvLiveActivity() {
  const root = document.getElementById('activity-feed');
  if (!root) return;

  function renderFeed(items) {
    if (!items || !items.length) return;
    root.innerHTML = items.slice(0, 7).map(function (item) {
      const uName = (item.user && (item.user.name || item.user.username)) || 'Builder';
      const uAvatar = (item.user && (item.user.avatarSeed || item.user.username)) || 'builder';
      const uUrl = (item.user && item.user.username) ? `profile.html?u=${encodeURIComponent(item.user.username)}` : '#';
      const actionDesc = item.description || item.action || 'earned points';
      const eventUrl = item.url || uUrl;
      const ago = typeof dvForumAgo === 'function' ? dvForumAgo(new Date(item.createdAt).getTime()) : dvTimeAgo(Math.max(1, Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000)));

      return `
        <div class="feed-item">
          <a href="${uUrl}" style="flex-shrink:0;">
            <img src="${(item.user && item.user.avatarUrl) || dvAvatar(uAvatar, 40)}" alt="" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
          </a>
          <div>
            <div class="feed-text">
              <a href="${eventUrl}" ${item.url ? 'target="_blank" rel="noopener"' : ''} style="color:inherit; text-decoration:none;">
                <b>${uName}</b> ${actionDesc}
              </a>
            </div>
            <div class="feed-time">${ago}</div>
          </div>
        </div>`;
    }).join('');
    dvReveal(root);
  }

  function fetchLiveFeed() {
    if (window.DVApi && DVApi.activity && DVApi.activity.feed) {
      DVApi.activity.feed().then(function (res) {
        const feedItems = (res && res.data && res.data.feed) || [];
        if (feedItems.length > 0) {
          renderFeed(feedItems);
        }
      }).catch(function () {});
    }
  }

  // Fetch real events immediately and refresh periodically
  fetchLiveFeed();
  setInterval(fetchLiveFeed, 12000);
}

document.addEventListener('DOMContentLoaded', () => {
  dvTypeTerminal();
  dvRenderTrendingProjects();
  dvRenderTopDevs();
  dvRenderCategories();
  dvRenderHackathonsPreview();
  dvRenderTechShowcase();
  dvRenderCommunityHighlights();
  dvLiveActivity();
  setTimeout(() => {
    dvAnimateCounters();
    dvReveal();
  }, 50);
  dvFetchGitHubTrending();
});

/* ---------- GitHub Fetch API demo with graceful fallback ---------- */
function dvFetchGitHubTrending() {
  const root = document.getElementById('gh-trending');
  if (!root) return;
  fetch('https://api.github.com/search/repositories?q=stars:%3E10000&sort=stars&order=desc&per_page=5')
    .then((res) => {
      if (!res.ok) throw new Error('rate limited');
      return res.json();
    })
    .then((data) => {
      root.innerHTML = data.items.map((repo) => `
      <a href="${repo.html_url}" target="_blank" rel="noopener" class="glass card-lift reveal" style="padding:16px; display:flex; gap:12px; align-items:center;">
        <img src="${repo.owner.avatar_url}" alt="" style="width:38px;height:38px;border-radius:10px;">
        <div style="overflow:hidden;">
          <div style="font-weight:600; font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${repo.full_name}</div>
          <div class="mono" style="font-size:11.5px; color:var(--text-tertiary);">★ ${repo.stargazers_count.toLocaleString()}</div>
        </div>
      </a>`).join('');
      dvReveal(root);
    })
    .catch((e) => {
      root.innerHTML = DV_PROJECTS.slice(0, 5).map((p) => `
      <div class="glass reveal" style="padding:16px; display:flex; gap:12px; align-items:center;">
        <div style="width:38px;height:38px;border-radius:10px;background:${DV_TECH_GRADIENTS[p.gradient]};"></div>
        <div>
          <div style="font-weight:600; font-size:13.5px;">${p.title}</div>
          <div class="mono" style="font-size:11.5px; color:var(--text-tertiary);">★ ${p.likes.toLocaleString()} · community favorites</div>
        </div>
      </div>`).join('');
      dvReveal(root);
    });
}
