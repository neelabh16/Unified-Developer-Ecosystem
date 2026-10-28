/* =========================================================
   SETTINGS
   ========================================================= */

function dvLegendUnlocked() {
  return dvPointsTotal() >= DV_TIERS[DV_TIERS.length - 1].min;
}

function dvRenderLegendSwatchState() {
  const swatch = document.getElementById('legend-swatch');
  const note = document.getElementById('legend-swatch-note');
  const unlocked = dvLegendUnlocked();
  const legendTier = DV_TIERS[DV_TIERS.length - 1];
  swatch.classList.toggle('locked-swatch', !unlocked);
  note.textContent = unlocked
    ? `${legendTier.icon} Legend accent unlocked — you earned it.`
    : `${legendTier.icon} Legend accent locks at ${legendTier.min} pts. You have ${dvPointsTotal()}.`;
}

function dvRenderAccountPanel() {
  const root = document.getElementById('account-panel');
  if (!root) return;
  const account = dvAuthAccount();
  const loggedIn = dvIsLoggedIn();

  if (loggedIn && account) {
    root.innerHTML = `
      <h3 style="margin-bottom:6px;">Account</h3>
      <p style="font-size:13px; margin-bottom:16px;">Signed in as <b>${account.name}</b>${account.username ? ' (@' + account.username + ')' : ''} (${account.email}) — authenticated live via MongoDB Atlas backend.</p>
      <button class="btn btn-outline" id="settings-signout-btn">Sign out</button>
    `;
    document.getElementById('settings-signout-btn').addEventListener('click', dvAuthSignOut);
  } else {
    root.innerHTML = `
      <h3 style="margin-bottom:6px;">Account</h3>
      <p style="font-size:13px; margin-bottom:16px;">You're not signed in. Most of DevVerse works without an account, but viewing any profile — including your own — requires signing in.</p>
      <div style="display:flex; gap:10px;">
        <a href="login.html" class="btn btn-ghost btn-sm">Sign in</a>
        <a href="signup.html" class="btn btn-primary btn-sm">Create account</a>
      </div>
    `;
  }
}

function dvSettingsInit() {
  const root = document.getElementById('settings-root');
  if (!root) return;

  dvEnsureAuth().then(() => {
    dvRenderAccountPanel();
  });

  const accent = (typeof dvGetCookie === 'function' && dvGetCookie('dv_accent')) || DVStore.get('settings.accent', 'violet');
  const motion = (typeof dvGetCookie === 'function' && dvGetCookie('dv_motion')) || DVStore.get('settings.motion', 'on');
  const theme = (typeof dvGetCookie === 'function' && dvGetCookie('dv_theme')) || DVStore.get('settings.theme', 'dark');

  function updatePreviewBar(acc) {
    const previewName = document.getElementById('accent-preview-name');
    if (previewName) {
      const names = { violet: 'Violet (Default)', cyan: 'Cyan Electric', coral: 'Coral Ember', amber: 'Amber Glow', legend: 'Legend Aurora' };
      previewName.textContent = `Active Accent: ${names[acc] || acc}`;
    }
  }
  updatePreviewBar(accent);

  document.querySelectorAll('[data-set-theme]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.setTheme === theme);
    btn.addEventListener('click', () => {
      const newTheme = btn.dataset.setTheme;
      if (typeof dvSetTheme === 'function') {
        dvSetTheme(newTheme);
      } else {
        DVStore.set('settings.theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
      if (window.DVApi && DVApi.users && DVApi.users.updateProfile && dvIsLoggedIn()) {
        DVApi.users.updateProfile({ settings: { theme: newTheme } }).catch(() => {});
      }
      document.querySelectorAll('[data-set-theme]').forEach((b) => b.classList.toggle('active', b === btn));
      dvToast(`Switched to ${newTheme} mode`);
    });
  });

  document.querySelectorAll('[data-set-accent]').forEach((btn) => {
    btn.classList.toggle('active-swatch', btn.dataset.setAccent === accent);
    btn.addEventListener('click', () => {
      if (btn.dataset.setAccent === 'legend' && !dvLegendUnlocked()) {
        const legendMin = DV_TIERS[DV_TIERS.length - 1].min;
        dvToast(`Locked — reach Legend tier (${legendMin} pts) to unlock. You have ${dvPointsTotal()}.`);
        return;
      }
      const newAccent = btn.dataset.setAccent;
      if (typeof dvSetAccent === 'function') {
        dvSetAccent(newAccent);
      } else {
        DVStore.set('settings.accent', newAccent);
        document.documentElement.setAttribute('data-accent', newAccent);
      }
      if (window.DVApi && DVApi.users && DVApi.users.updateProfile && dvIsLoggedIn()) {
        DVApi.users.updateProfile({ settings: { accent: newAccent } }).catch(() => {});
      }
      document.querySelectorAll('[data-set-accent]').forEach((b) => b.classList.remove('active-swatch'));
      btn.classList.add('active-swatch');
      updatePreviewBar(newAccent);
      dvToast(`Accent color updated to ${newAccent}`);
    });
  });
  dvRenderLegendSwatchState();

  const motionToggle = document.getElementById('motion-toggle');
  motionToggle.checked = motion === 'on';
  motionToggle.addEventListener('change', () => {
    const val = motionToggle.checked ? 'on' : 'off';
    if (typeof dvSetMotion === 'function') {
      dvSetMotion(val);
    } else {
      DVStore.set('settings.motion', val);
      document.documentElement.setAttribute('data-motion', val);
    }
    if (window.DVApi && DVApi.users && DVApi.users.updateProfile && dvIsLoggedIn()) {
      DVApi.users.updateProfile({ settings: { motion: val } }).catch(() => {});
    }
    dvToast(`Animations ${val === 'on' ? 'enabled' : 'disabled'}`);
  });

  document.getElementById('reset-app-btn').addEventListener('click', () => {
    if (confirm('This clears all local DevVerse data — likes, bookmarks, profile edits, portfolio, and settings. Continue?')) {
      DVStore.resetAll();
      dvToast('Application reset — reloading…');
      setTimeout(() => window.location.reload(), 900);
    }
  });

  const stats = document.getElementById('storage-stats');
  // BUG FIXED: this used to read the raw global localStorage key directly
  // (bypassing DVStore), which mixed every account's data together and,
  // since the account-scoping fix, would show 0 for everything because the
  // global key now holds only auth info. Go through DVStore so these
  // counts reflect the signed-in account's own bucket, same as the rest
  // of the app.
  stats.innerHTML = `
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Total points earned</span><span class="mono">${dvPointsTotal().toLocaleString()}</span></div>
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Likes saved</span><span class="mono">${DVStore.get('likes', []).length}</span></div>
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Bookmarks saved</span><span class="mono">${DVStore.get('bookmarks', []).length}</span></div>
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Communities joined</span><span class="mono">${DVStore.get('communities', []).length}</span></div>
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span class="muted" style="font-size:13px;">Hackathons registered</span><span class="mono">${(typeof dvRegisteredHackathons === 'function' ? dvRegisteredHackathons() : DVStore.get('hackathons', [])).length}</span></div>
  `;
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvSettingsInit, 30));
