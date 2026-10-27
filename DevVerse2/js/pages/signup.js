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
      });

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
}

document.addEventListener('DOMContentLoaded', () => setTimeout(dvSignupInit, 30));
