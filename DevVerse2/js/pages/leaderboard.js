/* =========================================================
   LEADERBOARDS
   ========================================================= */

let dvBoardMode = 'developers';
let dvBoardRange = 'weekly';
let dvLiveDevRankings = null;
let dvLiveProjectRankings = null;

function dvFetchLeaderboardApi() {
  if (window.DVApi && DVApi.leaderboard && DVApi.leaderboard.get) {
    DVApi.leaderboard.get({ mode: dvBoardMode === 'developers' ? 'devs' : 'projects', range: dvBoardRange })
      .then(function (res) {
        if (res && res.data && res.data.rankings && res.data.rankings.length) {
          if (dvBoardMode === 'developers') {
            dvLiveDevRankings = res.data.rankings.map(function (u) {
              return {
                handle: u.username || u.handle,
                name: u.name,
                avatarSeed: u.avatarSeed || u.username,
                points: u.points || 0,
                allTimePoints: u.allTimePoints || u.points || 0,
                skills: u.skills || []
              };
            });
          } else {
            dvLiveProjectRankings = res.data.rankings.map(function (p) {
              return {
                id: p.id || p._id,
                title: p.title,
                likes: p.likesCount || p.likes || 0,
                gradient: typeof p.gradient === 'number' ? p.gradient : 0
              };
            });
          }
          dvRenderLeaderboard();
        }
      })
      .catch(function () {});
  }
}

function dvLeaderboardInit() {
  const root = document.getElementById('leaderboard-list');
  if (!root) return;

  document.querySelectorAll('[data-board]').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-board]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    dvBoardMode = btn.dataset.board;
    dvFetchLeaderboardApi();
    dvRenderLeaderboard();
  }));
  document.querySelectorAll('[data-range]').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-range]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    dvBoardRange = btn.dataset.range;
    dvFetchLeaderboardApi();
    dvRenderLeaderboard();
  }));

  dvRenderLeaderboard();
  dvEnsureAuth().then(() => {
    dvRenderLeaderboard();
    dvFetchLeaderboardApi();
  });
}

function dvRenderLeaderboard() {
  const root = document.getElementById('leaderboard-list');
  if (!root) return;
  const loggedIn = dvIsLoggedIn();

  if (dvBoardMode === 'developers') {
    const overrides = DVStore.get('profile.overrides', {});
    const account = dvAuthAccount();
    const selfHandle = dvSelfHandle();
    const totalPoints = dvPointsTotal();

    let userRangePoints = totalPoints;
    if (dvBoardRange === 'weekly') {
      const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weekly = dvPointsTotal(since);
      userRangePoints = weekly > 0 ? weekly : totalPoints;
    } else if (dvBoardRange === 'monthly') {
      const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const monthly = dvPointsTotal(since);
      userRangePoints = monthly > 0 ? monthly : totalPoints;
    }

    const SEED_WEEKLY_MAP = {
      'sena.codes': 85,
      'ari-devs': 70,
      'lumen': 65,
      'kmori': 55,
      'elena-v': 45,
      'marcus-k': 40,
      'priya.dev': 35,
      'noa.ml': 30,
      'devon.codes': 25,
      'dax': 20,
    };
    const SEED_MONTHLY_MAP = {
      'sena.codes': 340,
      'lumen': 310,
      'marcus-k': 280,
      'kmori': 240,
      'ari-devs': 210,
      'elena-v': 190,
      'noa.ml': 160,
      'priya.dev': 130,
      'devon.codes': 110,
      'dax': 85,
    };

    function getPointsForDev(d, isMe) {
      if (isMe) return userRangePoints;
      if (dvLiveDevRankings && typeof d.points === 'number' && d.points > 0) {
        return d.points;
      }
      if (dvBoardRange === 'weekly') {
        return SEED_WEEKLY_MAP[d.handle] || Math.max(10, Math.round((d.points || 0) * 0.007));
      }
      if (dvBoardRange === 'monthly') {
        return SEED_MONTHLY_MAP[d.handle] || Math.max(30, Math.round((d.points || 0) * 0.028));
      }
      return d.allTimePoints || d.points || 0;
    }

    const sourceDevs = dvLiveDevRankings || DV_DEVS;
    let foundYou = false;

    const mappedDevs = sourceDevs.map((d) => {
      const isMe = loggedIn && (d.handle === selfHandle || d.handle === (account && account.username) || d.handle === 'you');
      if (isMe) foundYou = true;
      const rangePts = getPointsForDev(d, isMe);
      const allTime = isMe ? totalPoints : (d.allTimePoints || d.points || rangePts);
      return {
        ...d,
        name: isMe ? (overrides.name || (account && account.name) || d.name || 'You') : d.name,
        avatarSeed: isMe ? (overrides.avatarSeed || (account && account.avatarSeed) || d.avatarSeed || 'you-builder') : d.avatarSeed,
        points: rangePts,
        allTimePoints: allTime,
        isYou: isMe,
      };
    });

    if (loggedIn && !foundYou) {
      mappedDevs.push({
        handle: selfHandle,
        name: overrides.name || (account && account.name) || 'You',
        avatarSeed: overrides.avatarSeed || (account && account.avatarSeed) || 'you-builder',
        points: userRangePoints,
        allTimePoints: totalPoints,
        isYou: true,
      });
    }

    const list = mappedDevs.sort((a, b) => b.points - a.points);
    const max = Math.max(...list.map((d) => d.points), 1);
    root.innerHTML = list.map((d, i) => `
      <div class="rank-row ${i < 3 ? 'top' + (i + 1) : ''} ${d.isYou ? 'rank-row-you' : ''} reveal in">
        <div class="rank-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="rank-dev">
          <img src="${dvAvatar(d.avatarSeed, 40)}">
          <div>
            <div style="font-weight:600; font-size:14px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">${d.name}${d.isYou ? '<span class="chip chip-accent" style="font-size:10px; padding:2px 8px;">You</span>' : ''} ${dvTierBadgeHTML(d.allTimePoints)}</div>
            <div class="bar-track" style="width:140px; margin-top:6px;"><div class="bar-fill" style="width:${Math.min(100, (d.points / max) * 100)}%"></div></div>
          </div>
        </div>
        <div class="mono" style="font-size:13px; text-align:right;">${d.points.toLocaleString()} pts</div>
        <a href="profile.html${d.isYou ? '' : '?u=' + d.handle}" class="btn btn-sm btn-ghost">View</a>
      </div>`).join('');
  } else {
    const sourceProjects = dvLiveProjectRankings || DV_PROJECTS;
    const factor = dvBoardRange === 'weekly' ? 0.05 : dvBoardRange === 'monthly' ? 0.22 : 1;
    const list = [...sourceProjects].map((p) => {
      const likes = dvBoardRange === 'all' ? p.likes : Math.max(5, Math.round(p.likes * factor));
      return { ...p, displayLikes: likes };
    }).sort((a, b) => b.displayLikes - a.displayLikes);
    const max = Math.max(list[0] ? list[0].displayLikes : 1, 1);
    root.innerHTML = list.map((p, i) => `
      <div class="rank-row ${i < 3 ? 'top' + (i + 1) : ''} reveal in">
        <div class="rank-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="rank-dev">
          <div style="width:40px;height:40px;border-radius:10px;background:${DV_TECH_GRADIENTS[p.gradient]};"></div>
          <div>
            <div style="font-weight:600; font-size:14px;">${p.title}</div>
            <div class="bar-track" style="width:140px; margin-top:6px;"><div class="bar-fill" style="width:${Math.min(100, (p.displayLikes / max) * 100)}%"></div></div>
          </div>
        </div>
        <div class="mono" style="font-size:13px; text-align:right;">${p.displayLikes.toLocaleString()} likes</div>
        <a href="project.html?id=${p.id}" class="btn btn-sm btn-ghost">View</a>
      </div>`).join('');
  }

  dvRenderYourPoints();
}

function dvRenderYourPoints() {
  const totalEl = document.getElementById('your-points-total');
  const logEl = document.getElementById('your-points-log');
  if (!totalEl || !logEl) return;

  if (!dvIsLoggedIn()) {
    totalEl.textContent = '—';
    logEl.innerHTML = `<p class="muted" style="font-size:13px;">Sign in to start earning points and see your rank here.</p>`;
    const tierRoot = document.getElementById('tier-panel');
    if (tierRoot) tierRoot.innerHTML = `<p class="muted" style="font-size:13px;">Sign in to track your tier progress.</p>`;
    return;
  }

  totalEl.textContent = dvPointsTotal().toLocaleString();

  const log = DVStore.get('points.log', []).slice().sort((a, b) => b.at - a.at).slice(0, 8);
  logEl.innerHTML = log.length
    ? log.map((entry) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid var(--border);">
        <span style="font-size:13px;">${entry.reason}</span>
        <span style="display:flex; align-items:center; gap:10px;">
          <span class="mono" style="font-size:12px; color:var(--cyan);">+${entry.amount}</span>
          <span class="mono muted" style="font-size:11px;">${dvTimeAgo(Math.max(0, Math.floor((Date.now() - entry.at) / 60000)))}</span>
        </span>
      </div>`).join('')
    : `<p class="muted" style="font-size:13px;">No points earned yet — like a project, join a community, or post in a forum to start climbing the board.</p>`;

  dvRenderTierPanel();
}

function dvRenderTierPanel() {
  const root = document.getElementById('tier-panel');
  if (!root) return;
  const points = dvPointsTotal();
  const tier = dvCurrentTier(points);
  const next = dvNextTier(points);

  root.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:16px; flex-wrap:wrap;">
      <div style="display:flex; align-items:center; gap:12px;">
        ${dvTierBadgeHTML(points)}
        <span class="mono muted" style="font-size:12.5px;">${points.toLocaleString()} pts</span>
      </div>
      ${next
        ? `<span class="muted mono" style="font-size:12px;">${next.min - points} pts to ${next.icon} ${next.name}</span>`
        : `<span class="muted mono" style="font-size:12px;">Top tier reached</span>`}
    </div>
    ${next ? `<div class="bar-track" style="margin-bottom:22px;"><div class="bar-fill" style="width:${Math.min(100, (points / next.min) * 100)}%"></div></div>` : '<div style="margin-bottom:22px;"></div>'}

    <div class="tier-track">
      ${DV_TIERS.map((t, i) => {
        const reached = points >= t.min;
        const isCurrent = t.id === tier.id;
        return `
        <div class="tier-step ${reached ? 'tier-step-reached' : ''} ${isCurrent ? 'tier-step-current' : ''}">
          <div class="tier-step-icon">${t.icon}</div>
          <div class="tier-step-name">${t.name}</div>
          <div class="tier-step-min mono">${t.min} pts</div>
          ${t.id === 'legend' ? `<div class="tier-step-perk">unlocks the Legend accent</div>` : ''}
        </div>`;
      }).join('')}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvLeaderboardInit, 30));
