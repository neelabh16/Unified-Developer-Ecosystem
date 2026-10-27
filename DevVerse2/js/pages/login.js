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
