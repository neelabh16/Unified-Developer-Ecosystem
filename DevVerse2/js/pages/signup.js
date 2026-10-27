/* =========================================================
   SIGN UP (Connected to Backend REST API)
   ========================================================= */

function dvSignupInit() {
  const form = document.getElementById('signup-form');
  if (!form) return;
  const redirectTarget = dvSafeRedirect(dvGetQueryParam('redirect'));
  const redirectQuery = dvGetQueryParam('redirect') ? '?redirect=' + encodeURIComponent(redirectTarget) : '';

  const loginLink = document.getElementById('signup-to-login-link');
  if (loginLink) loginLink.href = 'login.html' + redirectQuery;
  const existingLoginLink = document.getElementById('signup-existing-login-link');
  if (existingLoginLink) existingLoginLink.href = 'login.html' + redirectQuery;

  dvEnsureAuth().then(() => {
    if (dvIsLoggedIn()) {
      dvToast('You\u2019re already signed in');
      window.location.href = redirectTarget;
    }
  });

  dvWirePasswordField('signup-password', 'signup-password-toggle', 'signup-capslock-warning');
  dvWirePasswordField('signup-confirm', 'signup-confirm-toggle', null);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('signup-name');
    const usernameInput = document.getElementById('signup-username');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const confirmInput = document.getElementById('signup-confirm');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!dvValidateForm(form)) return;

    // Password strength validation
    const pw = passwordInput.value.trim();
    let hasUpper = false;
    let hasNumber = false;
    let hasSpecial = false;
    const specials = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~\\';
    for (let i = 0; i < pw.length; i++) {
      const ch = pw[i];
      if (ch >= 'A' && ch <= 'Z') hasUpper = true;
      if (ch >= '0' && ch <= '9') hasNumber = true;
      if (specials.indexOf(ch) !== -1) hasSpecial = true;
    }
    dvClearFieldError(passwordInput);
    if (pw.length < 7) {
      dvShowFieldError(passwordInput, 'Use at least 7 characters.');
      passwordInput.focus();
      return;
    }
    if (!hasUpper) {
      dvShowFieldError(passwordInput, 'Include at least one uppercase letter (A–Z).');
      passwordInput.focus();
      return;
    }
    if (!hasNumber) {
      dvShowFieldError(passwordInput, 'Include at least one number (0–9).');
      passwordInput.focus();
      return;
    }
    if (!hasSpecial) {
      dvShowFieldError(passwordInput, 'Include at least one special character (!@#$% etc.).');
      passwordInput.focus();
      return;
    }

    // Confirm password match
    dvClearFieldError(confirmInput);
    if (confirmInput.value.trim() !== pw) {
      dvShowFieldError(confirmInput, 'Passwords don\u2019t match.');
      confirmInput.focus();
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const username = usernameInput.value.trim().toLowerCase();
    const name = nameInput.value.trim();

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account…';
      }

      const res = await DVApi.auth.register({
        name,
        username,
        email,
        password: pw,
      });

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
          reason: 'Signup welcome bonus',
          at: Date.now()
        }]);
      }

      dvToast(`Welcome to DevVerse, ${user.name.split(' ')[0]}!`);
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 300);
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      if (msg.toLowerCase().includes('email')) {
        dvShowFieldError(emailInput, msg);
        emailInput.focus();
      } else if (msg.toLowerCase().includes('username')) {
        dvShowFieldError(usernameInput, msg);
        usernameInput.focus();
      } else {
        dvToast(msg);
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    }
  });

  // Clear field errors on input
  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', function () {
      if (this.classList.contains('field-error')) dvClearFieldError(this);
    });
  });

  dvSetupOAuthButtons('signup', redirectTarget);
}

function dvSetupOAuthButtons(mode, redirectTarget) {
  const ghBtn = document.getElementById('btn-oauth-github');
  const googleBtn = document.getElementById('btn-oauth-google');

  if (ghBtn) {
    ghBtn.onclick = () => dvOpenOAuthModal('github', mode, redirectTarget);
  }
  if (googleBtn) {
    googleBtn.onclick = () => dvOpenOAuthModal('google', mode, redirectTarget);
  }
}

function dvOpenOAuthModal(provider, mode, redirectTarget) {
  const existing = document.getElementById('dv-oauth-modal');
  if (existing) existing.remove();

  const isGitHub = provider === 'github';
  const title = isGitHub ? 'Continue with GitHub' : 'Continue with Google';
  const desc = isGitHub
    ? 'Connect your GitHub account to sign in or create an account with your real contributions.'
    : 'Connect your Google account to sign in or create an account on DevVerse.';

  const modal = document.createElement('div');
  modal.id = 'dv-oauth-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';

  modal.innerHTML = `
    <div class="glass card-lift" style="max-width:440px;width:100%;padding:28px;border-radius:18px;position:relative;background:var(--bg-elevated);border:1px solid var(--border-strong);">
      <button type="button" id="oauth-close-btn" style="position:absolute;top:16px;right:16px;background:none;border:none;color:var(--text-tertiary);font-size:22px;cursor:pointer;line-height:1;">&times;</button>
      
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <div style="width:42px;height:42px;border-radius:12px;background:var(--surface);display:flex;align-items:center;justify-content:center;">
          ${isGitHub 
            ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55A10.51 10.51 0 0023.5 12c0-6.27-5.23-11.5-11.5-11.5z"/></svg>`
            : `<svg width="22" height="22" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.04 12.27c0-.82-.07-1.42-.22-2.05H12.24v3.72h6.17c-.12 1.02-.8 2.57-2.31 3.6l-.02.14 3.35 2.6.23.02c2.13-1.97 3.38-4.86 3.38-8.03z"/><path fill="#34A853" d="M12.24 23.5c3.05 0 5.6-1 7.47-2.73l-3.56-2.76c-.95.66-2.23 1.13-3.91 1.13-2.99 0-5.53-1.98-6.44-4.7l-.13.01-3.48 2.7-.05.13c1.86 3.7 5.68 6.22 10.1 6.22z"/><path fill="#FBBC05" d="M5.8 14.44a6.9 6.9 0 01-.37-2.2c0-.77.14-1.51.36-2.2L5.78 9.9 2.26 7.15l-.12.06A11.5 11.5 0 000.75 12.24c0 1.85.44 3.6 1.39 5.13l3.66-2.93z"/><path fill="#EA4335" d="M12.24 5.34c2.12 0 3.55.92 4.37 1.68l3.19-3.12C17.83 2.07 15.29 1 12.24 1 7.82 1 3.99 3.52 2.14 7.21l3.65 2.94c.92-2.73 3.46-4.81 6.45-4.81z"/></svg>`
          }
        </div>
        <div>
          <h3 style="margin:0;font-size:17px;">${title}</h3>
          <p class="muted" style="margin:2px 0 0;font-size:12px;">Verified external authentication</p>
        </div>
      </div>
      
      <p style="font-size:13px;line-height:1.45;color:var(--text-secondary);margin-bottom:18px;">${desc}</p>
      
      <form id="oauth-submit-form" novalidate>
        ${isGitHub ? `
          <div class="field" style="margin-bottom:14px;">
            <label for="oauth-gh-username">GitHub username</label>
            <input id="oauth-gh-username" placeholder="e.g. neelabh16" required autofocus autocomplete="username" style="width:100%;">
          </div>
          <div class="field" style="margin-bottom:18px;">
            <label for="oauth-gh-email">Email address</label>
            <input id="oauth-gh-email" type="email" placeholder="e.g. you@example.com" required autocomplete="email" style="width:100%;">
          </div>
        ` : `
          <div class="field" style="margin-bottom:14px;">
            <label for="oauth-google-name">Full name</label>
            <input id="oauth-google-name" placeholder="e.g. Alex Rivera" required autofocus style="width:100%;">
          </div>
          <div class="field" style="margin-bottom:18px;">
            <label for="oauth-google-email">Google email address</label>
            <input id="oauth-google-email" type="email" placeholder="you@gmail.com" required autocomplete="email" style="width:100%;">
          </div>
        `}
        <div id="oauth-error" class="muted" style="color:var(--coral);font-size:12px;margin-bottom:10px;display:none;"></div>
        <button type="submit" class="btn btn-primary" id="oauth-btn" style="width:100%;">
          Continue with ${isGitHub ? 'GitHub' : 'Google'}
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#oauth-close-btn').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  modal.querySelector('#oauth-submit-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = modal.querySelector('#oauth-btn');
    const errBox = modal.querySelector('#oauth-error');
    errBox.style.display = 'none';

    try {
      btn.disabled = true;
      btn.textContent = 'Verifying…';

      let payload;
      if (isGitHub) {
        const ghUser = modal.querySelector('#oauth-gh-username').value.trim();
        const ghEmail = modal.querySelector('#oauth-gh-email').value.trim().toLowerCase();
        if (!ghUser || !ghEmail) throw new Error('Please fill in both GitHub username and email.');

        payload = {
          provider: 'github',
          username: ghUser,
          github: ghUser,
          email: ghEmail,
          name: ghUser,
          providerId: `gh_${ghUser}`
        };
      } else {
        const gName = modal.querySelector('#oauth-google-name').value.trim();
        const gEmail = modal.querySelector('#oauth-google-email').value.trim().toLowerCase();
        if (!gName || !gEmail) throw new Error('Please fill in your name and Google email.');

        payload = {
          provider: 'google',
          name: gName,
          email: gEmail,
          username: gEmail.split('@')[0],
          providerId: `google_${gEmail}`
        };
      }

      const res = await DVApi.auth.oauth(payload);
      const user = res.data.user;

      window.DVCurrentUser = user;
      DVStore.set('auth.session', user.email);
      DVStore.set('auth.accounts', [{ name: user.name, username: user.username, email: user.email }]);
      DVStore.set('profile.overrides', {
        name: user.name,
        username: user.username,
        github: user.github || (isGitHub ? payload.github : ''),
        bio: user.bio || '',
        avatarSeed: user.avatarSeed || user.username,
        points: user.points || 0
      });

      dvToast(`Welcome to DevVerse, ${user.name.split(' ')[0]}! Signed up with ${isGitHub ? 'GitHub' : 'Google'}.`);
      modal.remove();
      setTimeout(() => { window.location.href = redirectTarget; }, 300);
    } catch (err) {
      errBox.textContent = err.message || 'Authentication failed. Please try again.';
      errBox.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = `Continue with ${isGitHub ? 'GitHub' : 'Google'}`;
    }
  };
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvSignupInit, 30));
