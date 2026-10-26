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

  if (dvIsLoggedIn()) {
    dvToast('You\u2019re already signed in');
    window.location.href = redirectTarget;
    return;
  }

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

      // Sync active session and accounts array for client navigation
      const accounts = DVStore.get('auth.accounts', []);
      const idx = accounts.findIndex((a) => a.email === user.email);
      const accObj = {
        name: user.name,
        username: user.username,
        email: user.email,
      };
      if (idx !== -1) {
        accounts[idx] = accObj;
      } else {
        accounts.push(accObj);
      }
      DVStore.set('auth.accounts', accounts);
      DVStore.set('auth.session', user.email);

      // Sync user profile overrides
      DVStore.set('profile.overrides', {
        name: user.name,
        username: user.username,
        bio: user.bio || '',
        avatarSeed: user.avatarSeed || 'you-builder',
      });

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
