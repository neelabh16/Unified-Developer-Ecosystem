/* =========================================================
   DEVELOPER PROFILE
   ========================================================= */

function dvProfileInit() {
  const root = document.getElementById('profile-root');
  if (!root) return;

  dvEnsureAuth().then(() => {
    if (!dvIsLoggedIn()) {
      dvToast('Sign in to view profiles');
      window.location.href = 'login.html?redirect=' + encodeURIComponent(dvCurrentPageWithQuery());
      return;
    }
    dvRenderProfileContent(root);
  });
}

function dvRenderProfileContent(root) {

  const handle = dvGetQueryParam('u');
  const devInList = DV_DEVS.find((d) => d.handle && d.handle.toLowerCase() === (handle || '').toLowerCase());
  const fallbackOtherUser = {
    handle: handle,
    name: handle,
    title: 'Developer',
    bio: '',
    avatarSeed: handle,
    skills: [],
    followers: 12,
    points: 100,
    projects: 0,
    github: handle,
  };
  const base = devInList || fallbackOtherUser;

  const overrides = DVStore.get('profile.overrides', {});
  const account = dvAuthAccount();
  const selfUsername = dvSelfHandle();
  const isSelf = !handle || handle === 'you' || handle === selfUsername;
  const realPoints = dvPointsTotal();
  const portfolioData = DVStore.get('portfolio', null);
  const userSkills = portfolioData && portfolioData.skills && portfolioData.skills.length ? portfolioData.skills : base.skills;

  // BUG FIXED: name was missing the account.name fallback that username
  // (just above) already had — a signed-up account with no manual profile
  // edit yet showed the literal placeholder "You" here instead of the
  // name entered at signup.
  const data = isSelf
    ? {
        ...base,
        handle: selfUsername,
        name: ((portfolioData && portfolioData.name && portfolioData.name !== 'Your Name') ? portfolioData.name : null) || overrides.name || (account && account.name) || 'You',
        github: overrides.github || (account && account.github) || selfUsername,
        bio: overrides.bio || (portfolioData && portfolioData.bio) || base.bio,
        avatarSeed: (portfolioData && (portfolioData.avatarUrl || portfolioData.avatarSeed)) || overrides.avatarSeed || (account && (account.avatarUrl || account.avatarSeed)) || 'you-builder',
        points: realPoints,
        skills: userSkills,
      }
    : {
        ...base,
        handle: handle || base.handle,
        name: base.name || handle,
        avatarSeed: base.avatarSeed || handle,
        bio: base.bio || '',
      };

  const tier = dvCurrentTier(data.points);
  const next = dvNextTier(data.points);

  const myProjects = isSelf ? dvAllProjects().filter(function (p) { return p.author === 'you' || p.author === selfUsername; }) : dvAllProjects().filter(function (p) { return p.author === data.handle; });
  const statProjects = isSelf ? myProjects.length : data.projects;
  const statFollowers = isSelf ? 0 : data.followers;
  const statFollowing = isSelf ? DVStore.get('following', []).length : Math.floor(data.followers / 4);

  // One-time username change: unlocks once the account reaches Legend
  // tier's point threshold (same 600-pt bar dvLegendUnlocked() in
  // settings.js already uses for the Legend accent), and can only be
  // used once per account.
  const usernameChangeThreshold = DV_TIERS[DV_TIERS.length - 1].min;
  const usernameChangeUsed = DVStore.get('profile.usernameChangeUsed', false);
  const usernameChangeEligible = realPoints >= usernameChangeThreshold;
  let usernameFieldHTML;
  if (usernameChangeUsed) {
    usernameFieldHTML = `
      <div class="field">
        <label>Username</label>
        <input value="@${selfUsername}" disabled>
        <p class="muted" style="font-size:11.5px; margin-top:6px;">You've already used your one-time username change.</p>
      </div>`;
  } else if (!usernameChangeEligible) {
    usernameFieldHTML = `
      <div class="field">
        <label>Username</label>
        <input value="@${selfUsername}" disabled>
        <p class="muted" style="font-size:11.5px; margin-top:6px;">Locked — reach ${usernameChangeThreshold} pts to unlock a one-time username change. You have ${realPoints}.</p>
      </div>`;
  } else {
    usernameFieldHTML = `
      <div class="field">
        <label>Username</label>
        <input id="edit-username" value="${selfUsername}" minlength="3" maxlength="20" pattern="[a-zA-Z0-9_\-]+" data-error-required="Enter a username." data-error-minlength="Username must be at least 3 characters." data-error-pattern="Only letters, numbers, hyphens and underscores.">
        <p class="muted" style="font-size:11.5px; margin-top:6px;">You can change your username once — choose carefully, this can't be undone.</p>
      </div>`;
  }

  root.innerHTML = `
    <div class="glass reveal in" style="border-radius:var(--radius-xl); overflow:hidden; margin-bottom:-52px;">
      <div style="height:200px; background:linear-gradient(120deg, var(--violet), var(--cyan) 60%, var(--coral));"></div>
    </div>
    <div style="display:flex; align-items:flex-end; gap:20px; padding:0 12px; position:relative; z-index:1; flex-wrap:wrap;">
      <div class="dev-avatar-ring" style="width:110px; height:110px; margin:0;"><img src="${dvAvatar(data.avatarSeed, 130)}"></div>
      <div style="flex:1; padding-bottom:10px;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <h2 id="profile-name">${data.name}</h2>
          ${dvTierBadgeHTML(data.points)}
        </div>
        <div class="mono muted">@${data.handle}</div>
      </div>
      <div style="padding-bottom:14px; display:flex; gap:10px;">
        <a class="btn btn-outline" href="portfolio.html${isSelf ? '' : '?u=' + data.handle}">${isSelf ? 'View your portfolio' : 'View portfolio'}</a>
        ${isSelf ? `<button class="btn btn-ghost" id="edit-profile-btn">Edit profile</button>` : ''}
      </div>
    </div>

    <div id="edit-panel" class="glass reveal in" style="display:none; padding:22px; margin:24px 0;">
      <div class="grid grid-2">
        <div class="field"><label>Display name</label><input id="edit-name" value="${data.name}"></div>
        <div class="field"><label>GitHub username</label><input id="edit-github" value="${data.github || ''}" placeholder="e.g. ${selfUsername}"></div>
      </div>
      <div class="field"><label>Avatar seed</label><input id="edit-avatar" value="${data.avatarSeed}"></div>
      ${usernameFieldHTML}
      <div class="field"><label>Bio</label><textarea id="edit-bio" rows="3">${data.bio}</textarea></div>
      <button class="btn btn-primary btn-sm" id="save-profile-btn">Save changes</button>
    </div>

    <p style="max-width:960px; line-height:1.72; font-size:15px; color:var(--text-secondary, #b4bcd0); margin:24px 0 0; word-break:break-word;" id="profile-bio">${data.bio}</p>

    <div class="glass reveal in" style="padding:16px 20px; margin-top:20px; display:inline-flex; gap:10px; flex-wrap:wrap; width:fit-content;">
      ${!isSelf ? dvSquadAndMessageActionsHTML(data.handle, data.name) : `<button class="btn btn-primary btn-sm" disabled title="Others can click this to follow you">Follow</button>`}
    </div>

    ${isSelf ? `
    <div class="glass reveal in" style="padding:18px 22px; margin-top:24px;">
      <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;">
        <span>${tier.icon} <b>${tier.name}</b></span>
        <span class="muted">${next ? `${data.points} / ${next.min} pts to ${next.name}` : `${data.points} pts — top tier reached`}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${next ? Math.min(100, (data.points / next.min) * 100) : 100}%"></div></div>
    </div>` : ''}

    <div class="grid grid-4" style="margin-top:30px;">
      <div class="glass" style="padding:18px; text-align:center;"><div class="stat-num" id="profile-stat-projects" data-count="${statProjects}">0</div><div class="stat-label">Projects</div></div>
      <div class="glass" style="padding:18px; text-align:center;"><div class="stat-num" id="profile-stat-followers" data-count="${statFollowers}">0</div><div class="stat-label">Followers</div></div>
      <div class="glass" style="padding:18px; text-align:center;"><div class="stat-num" id="profile-stat-following" data-count="${statFollowing}">0</div><div class="stat-label">Following</div></div>
      <div class="glass" style="padding:18px; text-align:center;"><div class="stat-num" id="profile-stat-points" data-count="${data.points}">0</div><div class="stat-label">Points</div></div>
    </div>

    <div class="section-tight" style="padding-left:0; padding-right:0;">
      <div class="eyebrow">Skills</div>
      <div class="pc-tags">${data.skills.map((s) => `<span class="chip chip-accent">${s}</span>`).join('')}</div>
    </div>

    <div class="section-tight" style="padding-left:0; padding-right:0;">
      <div class="eyebrow">Badges</div>
      <div class="grid grid-4">
        ${DV_BADGES.map(function (b) {
          // Demo devs other than you don't have real trackable
          // activity to check against, so their badges stay shown as
          // earned (they're seeded personas); your own profile shows
          // exactly what you've actually done.
          const earned = isSelf ? dvBadgeEarned(b.name) : true;
          return `<div class="glass card-lift" title="${b.description}" style="padding:18px; text-align:center; ${earned ? '' : 'opacity:0.4; filter:grayscale(1);'}">
            <div style="font-size:26px;">${b.icon}</div>
            <div style="font-size:12.5px; font-weight:600; margin-top:8px;">${b.name}</div>
            ${earned ? '' : '<div style="font-size:11px; margin-top:4px;" class="muted">Locked</div>'}
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="section-tight" style="padding-left:0; padding-right:0;">
      <div class="eyebrow">Contribution activity</div>
      <div class="glass" style="padding:20px;"><div class="heatmap" id="heatmap"></div></div>
    </div>

    <div class="detail-grid detail-grid--profile section-tight">
      <div>
        <div class="eyebrow">Projects</div>
        <div class="grid grid-2" id="profile-projects"></div>
      </div>
      <div>
        <div class="eyebrow">Activity timeline</div>
        <div class="glass feed" id="profile-timeline" style="padding:8px 14px;"></div>
      </div>
    </div>

    ${isSelf ? `
    <div class="section-tight" style="padding-left:0; padding-right:0;">
      <div class="eyebrow">Your squads</div>
      <div id="profile-squads"></div>
    </div>

    <div class="section-tight" style="padding-left:0; padding-right:0;">
      <div class="eyebrow">Your library</div>
      <div class="pill-toggle" id="library-toggle" style="margin-bottom:20px;">
        <button data-lib="bookmarks" class="active">Bookmarked</button>
        <button data-lib="likes">Liked</button>
      </div>
      <div id="library-container"></div>
    </div>` : ''}
  `;

  const projectsEl = document.getElementById('profile-projects');
  if (projectsEl) {
    projectsEl.innerHTML = myProjects.slice(0, 4).map(dvProjectCardHTML).join('') || (isSelf ? `<p class="muted">No published projects yet \u2014 <a href="submit-project.html" style="color:var(--accent);">submit one</a>.</p>` : `<p class="muted">No published projects yet.</p>`);
  }

  // Fetch projects uploaded to the site from backend API
  if (window.DVApi && DVApi.projects && DVApi.projects.list) {
    DVApi.projects.list({ limit: 100 }).then(function (res) {
      const items = (res && res.data && (res.data.projects || (Array.isArray(res.data) ? res.data : []))) || [];
      const targetHandle = isSelf ? (selfUsername || 'neelabh16') : data.handle;
      const uploaded = items.filter(function (p) {
        const u = (p.author && (p.author.username || p.author.name)) || p.author;
        return u === targetHandle || (isSelf && (u === 'you' || (account && u === account.username)));
      });

      const listToShow = uploaded.length > 0 ? uploaded.map(function (p) {
        return {
          id: p.legacyId || p.slug || p.id || p._id,
          title: p.title,
          desc: p.desc || p.tagline,
          tags: p.tags || [],
          difficulty: p.difficulty || 'Intermediate',
          category: p.category || 'General',
          likes: p.likesCount || p.likes || 0,
          views: p.viewsCount || p.views || 0,
          author: targetHandle,
          gradient: typeof p.gradient === 'number' ? p.gradient : 0,
          art: p.art || null,
          images: p.images || [],
        };
      }) : myProjects;

      const statProjectsEl = document.getElementById('profile-stat-projects');
      if (statProjectsEl) {
        statProjectsEl.setAttribute('data-count', listToShow.length);
        statProjectsEl.textContent = listToShow.length;
      }

      if (projectsEl) {
        projectsEl.innerHTML = listToShow.length > 0
          ? listToShow.slice(0, 4).map(dvProjectCardHTML).join('')
          : (isSelf ? `<p class="muted">No published projects yet \u2014 <a href="submit-project.html" style="color:var(--accent);">submit one</a>.</p>` : `<p class="muted">No published projects yet.</p>`);
        dvReveal(projectsEl);
      }
    }).catch(function () {});
  }

  // If viewing another user, asynchronously fetch their portfolio from server to hydrate real name, bio, avatar, skills
  if (!isSelf && data.handle && window.DVApi && DVApi.portfolios && DVApi.portfolios.get) {
    DVApi.portfolios.get(data.handle).then(function (res) {
      if (res && res.data && res.data.portfolio) {
        const pf = res.data.portfolio;
        window.__dvLoadedPortfolios = window.__dvLoadedPortfolios || {};
        window.__dvLoadedPortfolios[data.handle] = pf;

        const nameEl = document.getElementById('profile-name');
        if (nameEl && pf.name && pf.name !== 'Your Name') nameEl.textContent = pf.name;

        const bioEl = document.getElementById('profile-bio');
        if (bioEl && pf.bio) bioEl.textContent = pf.bio;

        const avatarImg = document.querySelector('.dev-avatar-ring img');
        if (avatarImg && (pf.avatarUrl || pf.avatarSeed)) {
          avatarImg.src = dvAvatar(pf.avatarUrl || pf.avatarSeed, 130);
        }

        if (Array.isArray(pf.skills) && pf.skills.length) {
          const skillsSection = document.querySelector('.section-tight .pc-tags');
          if (skillsSection) {
            skillsSection.innerHTML = pf.skills.map(function (s) { return `<span class="chip chip-accent">${s}</span>`; }).join('');
          }
        }
      }
    }).catch(function () {});
  }

  const heat = document.getElementById('heatmap');
  const colors = ['var(--surface)', 'var(--accent-soft, rgba(124,111,255,.25))', 'color-mix(in srgb, var(--accent) 55%, var(--surface))', 'color-mix(in srgb, var(--accent) 80%, var(--surface))', 'var(--accent)'];

  function dvFormatHeatmapDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  }

  function dvHeatmapTooltip(dateStr, level) {
    const formatted = dvFormatHeatmapDate(dateStr);
    if (level > 0) {
      return `${level} contribution${level > 1 ? 's' : ''} on ${formatted}`;
    }
    return `No contributions on ${formatted}`;
  }

  function renderHeatmapDays(daysList) {
    if (!heat) return;
    heat.innerHTML = '';
    daysList.forEach(function (d) {
      const lvl = Math.min(4, Math.max(0, d.level || 0));
      const tipText = dvHeatmapTooltip(d.date, lvl);
      const el = document.createElement('i');
      el.style.background = colors[lvl];
      el.setAttribute('title', tipText);
      el.setAttribute('data-date', d.date);
      el.setAttribute('data-tooltip', tipText);
      heat.appendChild(el);
    });
  }

  // Pre-fill initial 182 days with real calendar dates
  const now = new Date();
  const initialDays = [];
  for (let i = 181; i >= 0; i--) {
    const dt = new Date(now.getTime() - i * 86400000);
    const dateStr = dt.toISOString().slice(0, 10);
    initialDays.push({ date: dateStr, level: 0 });
  }
  renderHeatmapDays(initialDays);

  // Setup interactive instant tooltip
  let tooltipEl = document.getElementById('dv-heatmap-tooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'dv-heatmap-tooltip';
    tooltipEl.className = 'heatmap-tooltip';
    document.body.appendChild(tooltipEl);
  }

  heat.onmouseover = function (e) {
    const target = e.target.closest('i');
    if (target && target.dataset.tooltip) {
      tooltipEl.textContent = target.dataset.tooltip;
      tooltipEl.classList.add('visible');
      const rect = target.getBoundingClientRect();
      tooltipEl.style.left = (rect.left + rect.width / 2) + 'px';
      tooltipEl.style.top = rect.top + 'px';
    }
  };

  heat.onmouseout = function (e) {
    if (e.target.closest('i')) {
      tooltipEl.classList.remove('visible');
    }
  };

  const timeline = document.getElementById('profile-timeline');
  timeline.innerHTML = `<div class="feed-item"><div class="feed-text muted" style="padding:8px 0;">Loading activity timeline...</div></div>`;

  // Fetch real GitHub contributions and live activity feed
  // Real-time backend sync for Followers and Following stats
  const targetUserHandle = isSelf ? (selfUsername || 'neelabh16') : data.handle;
  if (window.DVApi && DVApi.users) {
    if (isSelf && DVApi.users.getFollowing) {
      DVApi.users.getFollowing().then(function (res) {
        if (res && res.data && Array.isArray(res.data.followingHandles)) {
          DVStore.set('following', res.data.followingHandles);
          const statFollowingEl = document.getElementById('profile-stat-following');
          if (statFollowingEl) {
            statFollowingEl.setAttribute('data-count', res.data.followingHandles.length);
            statFollowingEl.textContent = res.data.followingHandles.length;
          }
        }
      }).catch(function () {});
    }

    if (DVApi.users.getProfile && targetUserHandle) {
      DVApi.users.getProfile(targetUserHandle).then(function (res) {
        if (res && res.data) {
          const u = res.data;
          const statFollowersEl = document.getElementById('profile-stat-followers');
          const statFollowingEl = document.getElementById('profile-stat-following');
          if (statFollowersEl && typeof u.followersCount === 'number') {
            statFollowersEl.setAttribute('data-count', u.followersCount);
            statFollowersEl.textContent = u.followersCount;
          }
          if (statFollowingEl && !isSelf && typeof u.followingCount === 'number') {
            statFollowingEl.setAttribute('data-count', u.followingCount);
            statFollowingEl.textContent = u.followingCount;
          }
        }
      }).catch(function () {});
    }
  }

  const ghUsername = isSelf
    ? (data.github || (account && (account.github || account.username)) || selfUsername)
    : (data.github || data.handle);

  if (window.DVApi && DVApi.github && DVApi.github.getUser) {
    DVApi.github.getUser(ghUsername).then(function (res) {
      if (!res || !res.data) return;
      const gh = res.data;

      // 1. Update Followers and Following stats (only for non-self fallback if needed)
      const statFollowersEl = document.getElementById('profile-stat-followers');
      const statFollowingEl = document.getElementById('profile-stat-following');

      if (!isSelf) {
        const totalFollowers = gh.followers !== undefined ? gh.followers : data.followers;
        const totalFollowing = gh.following !== undefined ? gh.following : Math.floor(data.followers / 4);

        if (statFollowersEl && (!statFollowersEl.textContent || statFollowersEl.textContent === '0')) {
          statFollowersEl.setAttribute('data-count', totalFollowers);
          statFollowersEl.textContent = totalFollowers;
        }
        if (statFollowingEl && (!statFollowingEl.textContent || statFollowingEl.textContent === '0')) {
          statFollowingEl.setAttribute('data-count', totalFollowing);
          statFollowingEl.textContent = totalFollowing;
        }
      }

      // 2. Render real contribution heatmap
      if (heat && gh.contributions && gh.contributions.length > 0) {
        const recentDays = gh.contributions.slice(-182);
        renderHeatmapDays(recentDays);
      }

      // 3. Render real activity timeline from GitHub public events and workspace commits
      if (timeline && gh.events && gh.events.length > 0) {
        timeline.innerHTML = gh.events.slice(0, 8).map(function (ev) {
          const diffMin = Math.max(0, Math.floor((Date.now() - new Date(ev.published).getTime()) / 60000));
          const timeAgo = dvTimeAgo(diffMin);
          return `
            <div class="feed-item">
              <img src="${ev.avatarUrl || dvAvatar(data.avatarSeed, 34)}" alt="" style="width:34px; height:34px; border-radius:50%; object-fit:cover;">
              <div>
                <div class="feed-text">
                  <a href="${ev.url}" target="_blank" rel="noopener" style="color:inherit; text-decoration:none;">
                    <b>${ev.username || data.name}</b> ${ev.description}
                  </a>
                </div>
                <div class="feed-time">${timeAgo}</div>
              </div>
            </div>`;
        }).join('');
      } else if (timeline) {
        timeline.innerHTML = `<div class="feed-item"><div class="feed-text muted">No recent public GitHub activity.</div></div>`;
      }

      dvAnimateCounters(root);
    }).catch(function (err) {
      console.warn('Could not fetch real GitHub profile data:', err);
    });
  }

  if (isSelf) {
    dvRenderProfileSquads();
    dvRenderLibrary('bookmarks');
    document.querySelectorAll('[data-lib]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-lib]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        dvRenderLibrary(btn.dataset.lib);
      });
    });

    // Sync live squads from backend so squad hackathon registrations reflect immediately
    if (window.DVApi && DVApi.squads && DVApi.squads.mine) {
      DVApi.squads.mine().then(function (res) {
        const serverSquads = res && res.data && res.data.squads;
        if (Array.isArray(serverSquads)) {
          const normalized = serverSquads.map(dvNormalizeBackendSquad).filter(Boolean);
          const localSquads = dvSquads();
          normalized.forEach((serverSq) => {
            const idx = localSquads.findIndex((ls) => ls.id === serverSq.id || ls._id === serverSq._id || ls.name === serverSq.name);
            if (idx !== -1) {
              const mergedReg = new Set([
                ...(localSquads[idx].registeredHackathons || []),
                ...(serverSq.registeredHackathons || [])
              ]);
              serverSq.registeredHackathons = Array.from(mergedReg);
              localSquads[idx] = serverSq;
            } else {
              localSquads.push(serverSq);
            }
            (serverSq.registeredHackathons || []).forEach((hid) => {
              DVStore.addToSet('hackathons', hid);
              const found = typeof dvFindHackathon === 'function' ? dvFindHackathon(hid) : null;
              if (found) DVStore.addToSet('hackathons', found.id);
            });
          });
          dvSaveSquads(localSquads);
          dvRenderProfileSquads();
          dvRenderLibrary('bookmarks');
        }
      }).catch(function () {});
    }

    // Sync live registered hackathons from backend
    if (window.DVApi && DVApi.hackathons && DVApi.hackathons.list) {
      DVApi.hackathons.list().then(function (res) {
        if (res && res.data && Array.isArray(res.data.registeredIds)) {
          res.data.registeredIds.forEach((rid) => {
            DVStore.addToSet('hackathons', rid);
            const found = typeof dvFindHackathon === 'function' ? dvFindHackathon(rid) : null;
            if (found) DVStore.addToSet('hackathons', found.id);
          });
          dvRenderProfileSquads();
          dvRenderLibrary('bookmarks');
        }
      }).catch(function () {});
    }

    document.getElementById('edit-profile-btn').addEventListener('click', () => {
      document.getElementById('edit-panel').style.display = 'block';
    });
    document.getElementById('save-profile-btn').addEventListener('click', () => {
      // One-time username change: only touched when the field is actually
      // present (i.e. unlocked and not used yet) and the value was changed.
      const usernameInput = document.getElementById('edit-username');
      if (usernameInput) {
        dvClearFieldError(usernameInput);
        const newUsername = usernameInput.value.trim().toLowerCase();
        if (newUsername !== selfUsername) {
          if (!usernameInput.checkValidity()) {
            dvShowFieldError(usernameInput, dvFieldMessage(usernameInput));
            usernameInput.focus();
            return;
          }
          const existing = dvFindAccountByUsername(newUsername);
          if (existing && existing.email !== (account && account.email)) {
            dvShowFieldError(usernameInput, 'That username is already taken. Try another one.');
            usernameInput.focus();
            return;
          }
          // Update the account record itself (so future signups/logins see
          // the new username), not just the display override.
          if (account) {
            const accounts = DVStore.get('auth.accounts', []);
            const idx = accounts.findIndex((a) => a.email === account.email);
            if (idx !== -1) {
              accounts[idx].username = newUsername;
              DVStore.set('auth.accounts', accounts);
            }
          }
          DVStore.set('profile.overrides', { ...DVStore.get('profile.overrides', {}), username: newUsername });
          DVStore.set('profile.usernameChangeUsed', true);
          dvToast('Username changed — that was your one-time change.');
        }
      }

      // BUG FIXED: this used to replace the whole profile.overrides object,
      // silently dropping the "username" field that signup had put there
      // (Object.assign/spread merges it with what's already stored instead
      // of throwing it away).
      const updatedProfile = {
        ...DVStore.get('profile.overrides', {}),
        name: document.getElementById('edit-name').value.trim() || 'You',
        github: document.getElementById('edit-github') ? document.getElementById('edit-github').value.trim().replace(/^@/, '') : (data.github || ''),
        bio: document.getElementById('edit-bio').value.trim(),
        avatarSeed: document.getElementById('edit-avatar').value.trim() || 'you-builder',
      };
      DVStore.set('profile.overrides', updatedProfile);
      if (window.DVApi && DVApi.users && DVApi.users.updateProfile) {
        DVApi.users.updateProfile(updatedProfile).catch(function () {});
      }
      if (dvAwardOnce('milestone', 'profile-edited', DV_POINT_VALUES.milestone.profileEdited, 'Customized your profile')) {
        dvToast(`Profile saved (+${DV_POINT_VALUES.milestone.profileEdited} pts)`);
      } else {
        dvToast('Profile saved');
      }
      dvProfileInit();
    });
  }

  setTimeout(() => { dvAnimateCounters(root); dvReveal(root); }, 30);
}

function dvRenderProfileSquads() {
  const root = document.getElementById('profile-squads');
  if (!root) return;
  const squads = dvMySquads();
  if (!squads.length) {
    root.innerHTML = `<p class="muted">You're not part of a squad yet — head to <a href="squads.html" style="color:var(--accent);">Squads</a> to form one.</p>`;
    return;
  }
  root.innerHTML = squads.map((squad) => {
    const members = squad.members.map(dvSquadMemberInfo).filter(Boolean);
    const regList = Array.isArray(squad.registeredHackathons) ? squad.registeredHackathons : [];
    const registered = regList.map((id) => {
      const found = typeof dvFindHackathon === 'function' ? dvFindHackathon(id) : null;
      if (found) return found;
      return DV_HACKATHONS.find((h) =>
        h.id === id ||
        h.legacyId === id ||
        (h._id && h._id.toString() === id.toString()) ||
        (h.title && typeof id === 'string' && h.title.toLowerCase() === id.toLowerCase())
      );
    }).filter(Boolean);

    return `
    <div class="glass reveal in" style="padding:20px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
        <div>
          <div style="font-weight:600; font-size:15px;">${squad.name}</div>
          <p style="font-size:12.5px; margin-top:4px;">${squad.description}</p>
        </div>
        <a href="squads.html" class="btn btn-sm btn-ghost">Manage</a>
      </div>
      <div style="display:flex; gap:-6px; margin-top:14px;">
        ${members.map((m) => `<a href="profile.html${m.isYou ? '' : '?u=' + m.handle}" title="${m.name}"><img src="${dvAvatar(m.avatarSeed, 36)}" style="width:32px;height:32px;border-radius:50%;border:2px solid var(--bg-elevated); margin-left:-8px;"></a>`).join('')}
      </div>
      ${registered.length ? `<div class="pc-tags" style="margin-top:14px;">${registered.map((h) => `<a href="hackathon.html?id=${h.id}" class="chip chip-link">${h.title}</a>`).join('')}</div>` : ''}
    </div>`;
  }).join('');
  dvReveal(root);
}

function dvRenderLibrary(kind) {
  const container = document.getElementById('library-container');
  if (!container) return;
  const ids = DVStore.get(kind, []);

  // Bookmarks can hold both project ids and hackathon ids (stored with
  // a "hack-" prefix — see hackathons.js / hackathon.js). Likes are
  // project-only for now, since there's no "like a hackathon" action.
  const projectIds = ids.filter((id) => !id.startsWith('hack-'));
  const hackathonIds = ids.filter((id) => id.startsWith('hack-')).map((id) => id.slice(5));

  // Also include hackathons registered directly or through squads
  const registeredHackathonIds = typeof dvRegisteredHackathons === 'function' ? dvRegisteredHackathons() : [];
  registeredHackathonIds.forEach((hid) => {
    if (!hackathonIds.includes(hid)) hackathonIds.push(hid);
  });

  const projects = dvAllProjects().filter((p) => projectIds.includes(p.id) || (p.legacyId && projectIds.includes(p.legacyId)) || (p._id && projectIds.includes(p._id.toString())));
  const hackathons = (kind === 'bookmarks' || kind === 'registered') ? DV_HACKATHONS.filter((h) => {
    return hackathonIds.some((hid) =>
      hid === h.id ||
      hid === h.legacyId ||
      (h._id && hid === h._id.toString()) ||
      (h.title && typeof hid === 'string' && h.title.toLowerCase() === hid.toLowerCase())
    );
  }) : [];

  if (!projects.length && !hackathons.length) {
    container.innerHTML = `<p class="muted">No ${kind === 'bookmarks' ? 'bookmarked or registered' : 'liked'} projects or hackathons yet — head to <a href="explore.html" style="color:var(--accent);">Explore</a> or <a href="hackathons.html" style="color:var(--accent);">Hackathons</a> to discover more.</p>`;
    return;
  }

  let html = '';
  html += `<div style="margin-bottom:${hackathons.length ? '28px' : '0'};">
    <div class="mono muted" style="font-size:11.5px; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">Projects (${projects.length})</div>
    ${projects.length ? `<div class="grid grid-3">${projects.map(dvProjectCardHTML).join('')}</div>` : `<p class="muted" style="font-size:13px;">None yet.</p>`}
  </div>`;
  if (kind === 'bookmarks') {
    html += `<div>
      <div class="mono muted" style="font-size:11.5px; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">Hackathons (${hackathons.length})</div>
      ${hackathons.length ? `<div class="grid grid-3">${hackathons.map(dvHackathonCardHTML).join('')}</div>` : `<p class="muted" style="font-size:13px;">None yet.</p>`}
    </div>`;
  }
  container.innerHTML = html;
  dvReveal(container);
  dvTickCountdowns();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvProfileInit, 30));
