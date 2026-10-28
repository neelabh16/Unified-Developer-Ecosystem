/* =========================================================
   SIGN IN (Connected to Backend REST API)
   ========================================================= */

function dvLoginInit() {
  const form = document.getElementById('login-form');
  if (!form) return;
  const redirectTarget = dvSafeRedirect(dvGetQueryParam('redirect'));
  const signupLink = document.getElementById('login-to-signup-link');
  if (signupLink && dvGetQueryParam('redirect')) {
    signupLink.href = 'signup.html?redirect=' + encodeURIComponent(redirectTarget);
  }

  const oauthToken = dvGetQueryParam('token');
  if (oauthToken && window.DVApi) {
    DVApi.setToken(oauthToken);
  }

  const oauthSuccess = dvGetQueryParam('oauth') === 'success';
  if (oauthSuccess) {
    const provider = dvGetQueryParam('provider') || 'social';
    dvToast(`Welcome! Signed in with ${provider === 'github' ? 'GitHub' : 'Google'}.`);
    dvInitAuth().then(() => {
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 350);
    });
    return;
  }

  const oauthError = dvGetQueryParam('oauth_error');
  if (oauthError) {
    if (oauthError === 'github_credentials_missing' || oauthError === 'google_credentials_missing') {
      dvOpenOAuthSetupModal(oauthError === 'github_credentials_missing' ? 'github' : 'google', redirectTarget);
    } else {
      dvShowLoginError(decodeURIComponent(oauthError));
    }
  }

  dvEnsureAuth().then(() => {
    if (dvIsLoggedIn()) {
      dvToast('You\u2019re already signed in');
      window.location.href = redirectTarget;
    }
  });

  dvWirePasswordField('login-password', 'login-password-toggle', 'login-capslock-warning');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('login-error-notice').style.display = 'none';

    if (!dvValidateForm(form)) return;

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = form.querySelector('button[type="submit"]');

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in…';
      }

      const res = await DVApi.auth.login({ email, password });
      const user = res.data.user;

      // Set live user in session
      window.DVCurrentUser = user;
      DVStore.set('auth.session', user.email);
      DVStore.set('auth.accounts', [{
        name: user.name,
        username: user.username,
        email: user.email,
      }]);
      DVStore.set('profile.overrides', {
        name: user.name,
        username: user.username,
        bio: user.bio || '',
        avatarSeed: user.avatarSeed || 'you-builder',
        points: user.points || 0,
      });
      if ((user.points || 0) > 0) {
        DVStore.set('points.log', [{
          amount: user.points,
          reason: 'Account points balance',
          at: Date.now()
        }]);
      }

      dvToast(`Welcome back, ${user.name.split(' ')[0]}!`);
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 300);
    } catch (err) {
      dvShowLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    }
  });

  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', function () {
      if (this.classList.contains('field-error')) dvClearFieldError(this);
    });
  });

  dvSetupOAuthButtons('login', redirectTarget);
}

function dvSetupOAuthButtons(mode, redirectTarget) {
  const ghBtn = document.getElementById('btn-oauth-github');
  const googleBtn = document.getElementById('btn-oauth-google');

  if (ghBtn) {
    ghBtn.onclick = () => dvInitiateOAuth('github', redirectTarget);
  }
  if (googleBtn) {
    googleBtn.onclick = () => dvInitiateOAuth('google', redirectTarget);
  }
}

function dvInitiateOAuth(provider, redirectTarget) {
  const backendBase = (window.DVApi && DVApi.baseURL) || (window.location.port === '5000' ? '/api/v1' : 'http://localhost:5000/api/v1');
  const target = redirectTarget || 'index.html';
  const pathParts = window.location.pathname.split('/');
  pathParts.pop();
  const dirPath = pathParts.join('/');
  const subpath = dirPath ? (dirPath.startsWith('/') ? dirPath : '/' + dirPath) : '';
  const clientBase = window.location.origin + subpath;
  window.location.href = `${backendBase}/auth/${provider}?redirect=${encodeURIComponent(target)}&client_base=${encodeURIComponent(clientBase)}`;
}

function dvOpenOAuthSetupModal(provider, redirectTarget) {
  const existing = document.getElementById('dv-oauth-modal');
  if (existing) existing.remove();

  const isGitHub = provider === 'github';
  const title = isGitHub ? 'GitHub OAuth 2.0 Setup' : 'Google OAuth 2.0 Setup';

  const modal = document.createElement('div');
  modal.id = 'dv-oauth-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';

  modal.innerHTML = `
    <div class="glass card-lift" style="max-width:540px;width:100%;padding:28px;border-radius:20px;position:relative;background:var(--bg-elevated);border:1px solid var(--border-strong);box-shadow:0 24px 64px rgba(0,0,0,0.6);">
      <button type="button" id="oauth-close-btn" style="position:absolute;top:16px;right:16px;background:none;border:none;color:var(--text-tertiary);font-size:24px;cursor:pointer;line-height:1;">&times;</button>
      
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <div style="width:44px;height:44px;border-radius:12px;background:var(--surface);display:flex;align-items:center;justify-content:center;">
          ${isGitHub 
            ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55A10.51 10.51 0 0023.5 12c0-6.27-5.23-11.5-11.5-11.5z"/></svg>`
            : `<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.04 12.27c0-.82-.07-1.42-.22-2.05H12.24v3.72h6.17c-.12 1.02-.8 2.57-2.31 3.6l-.02.14 3.35 2.6.23.02c2.13-1.97 3.38-4.86 3.38-8.03z"/><path fill="#34A853" d="M12.24 23.5c3.05 0 5.6-1 7.47-2.73l-3.56-2.76c-.95.66-2.23 1.13-3.91 1.13-2.99 0-5.53-1.98-6.44-4.7l-.13.01-3.48 2.7-.05.13c1.86 3.7 5.68 6.22 10.1 6.22z"/><path fill="#FBBC05" d="M5.8 14.44a6.9 6.9 0 01-.37-2.2c0-.77.14-1.51.36-2.2L5.78 9.9 2.26 7.15l-.12.06A11.5 11.5 0 000.75 12.24c0 1.85.44 3.6 1.39 5.13l3.66-2.93z"/><path fill="#EA4335" d="M12.24 5.34c2.12 0 3.55.92 4.37 1.68l3.19-3.12C17.83 2.07 15.29 1 12.24 1 7.82 1 3.99 3.52 2.14 7.21l3.65 2.94c.92-2.73 3.46-4.81 6.45-4.81z"/></svg>`
          }
        </div>
        <div>
          <h3 style="margin:0;font-size:18px;">${title}</h3>
          <p class="muted" style="margin:2px 0 0;font-size:12px;">Real OAuth 2.0 Configuration Required</p>
        </div>
      </div>
      
      <p style="font-size:13px;line-height:1.5;color:var(--text-secondary);margin-bottom:14px;">
        DevVerse is configured for real <b>${isGitHub ? 'GitHub' : 'Google'} OAuth 2.0</b>. To enable live redirection and authentication with your app, add your keys to <code style="color:var(--accent);">DevVerse2/server/.env</code>:
      </p>

      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;font-family:var(--font-mono);font-size:11.5px;margin-bottom:16px;line-height:1.6;user-select:all;color:var(--text-primary);">
        ${isGitHub ? `
          <div style="color:var(--text-tertiary);margin-bottom:4px;"># GitHub Developer Settings → OAuth Apps</div>
          <div style="color:var(--text-tertiary);margin-bottom:6px;"># Callback: <b>http://localhost:5000/api/v1/auth/github/callback</b></div>
          <div>GITHUB_CLIENT_ID=your_github_client_id</div>
          <div>GITHUB_CLIENT_SECRET=your_github_client_secret</div>
        ` : `
          <div style="color:var(--text-tertiary);margin-bottom:4px;"># Google Cloud Console → APIs & Services → Credentials</div>
          <div style="color:var(--text-tertiary);margin-bottom:6px;"># Redirect URI: <b>http://localhost:5000/api/v1/auth/google/callback</b></div>
          <div>GOOGLE_CLIENT_ID=your_google_client_id</div>
          <div>GOOGLE_CLIENT_SECRET=your_google_client_secret</div>
        `}
      </div>

      <div style="border-top:1px solid var(--border);padding-top:16px;">
        <div class="muted" style="font-size:12px;margin-bottom:10px;">
          Want to test instantly using any real public GitHub developer profile?
        </div>
        <div style="display:flex;gap:8px;">
          <input id="oauth-test-gh-user" placeholder="Enter GitHub handle (e.g. torvalds, neelabh16)" style="flex:1;font-size:12.5px;padding:8px 12px;border-radius:8px;background:var(--surface);border:1px solid var(--border);color:inherit;">
          <button class="btn btn-sm btn-primary" id="oauth-test-gh-btn" type="button">Test Connect</button>
        </div>
        <div id="oauth-test-error" style="color:var(--coral);font-size:11.5px;margin-top:8px;display:none;"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#oauth-close-btn').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  const testBtn = modal.querySelector('#oauth-test-gh-btn');
  const testInput = modal.querySelector('#oauth-test-gh-user');
  const testErr = modal.querySelector('#oauth-test-error');

  testBtn.onclick = async () => {
    const handle = testInput.value.trim().replace(/^@/, '');
    if (!handle) {
      testErr.textContent = 'Please enter a GitHub handle to test.';
      testErr.style.display = 'block';
      return;
    }

    try {
      testBtn.disabled = true;
      testBtn.textContent = 'Connecting…';
      testErr.style.display = 'none';

      // Query public GitHub API to fetch real profile data
      const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`);
      if (!ghRes.ok) throw new Error(`GitHub user "${handle}" not found.`);
      const ghData = await ghRes.json();

      const payload = {
        provider: 'github',
        username: ghData.login,
        github: ghData.login,
        name: ghData.name || ghData.login,
        email: ghData.email || `${ghData.login}@users.noreply.github.com`,
        providerId: `github_${ghData.id}`,
      };

      const res = await DVApi.auth.oauth(payload);
      const user = res.data.user;

      window.DVCurrentUser = user;
      DVStore.set('auth.session', user.email);
      DVStore.set('auth.accounts', [{ name: user.name, username: user.username, email: user.email }]);
      DVStore.set('profile.overrides', {
        name: user.name,
        username: user.username,
        github: user.github || handle,
        bio: ghData.bio || user.bio || '',
        avatarSeed: ghData.avatar_url || user.avatarSeed || user.username,
        points: user.points || 0,
      });

      dvToast(`Connected as @${handle} (${user.name})!`);
      modal.remove();
      setTimeout(() => { window.location.href = redirectTarget; }, 300);
    } catch (err) {
      testErr.textContent = err.message || 'Could not connect GitHub account.';
      testErr.style.display = 'block';
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test Connect';
    }
  };
}

function dvShowLoginError(message) {
  const notice = document.getElementById('login-error-notice');
  if (notice) {
    const errorText = document.getElementById('login-error-text');
    if (errorText) errorText.textContent = message;
    notice.style.display = 'block';
  } else {
    dvToast(message);
  }
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvLoginInit, 30));
