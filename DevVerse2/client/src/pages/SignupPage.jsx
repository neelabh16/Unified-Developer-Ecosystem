import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { GitHubIcon } from '../components/common/BrandIcons';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import OAuthSetupModal from '../components/common/OAuthSetupModal';
import { authApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { signupSchema } from '../utils/validation';

function sanitizeRedirect(raw) {
  if (!raw || typeof raw !== 'string') return '/';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  return trimmed;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, register: registerUser } = useAuth();
  const { showToast } = useToast();

  const redirectTarget = sanitizeRedirect(searchParams.get('redirect'));
  const oauthError = searchParams.get('oauth_error');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState(() => {
    if (
      oauthError &&
      oauthError !== 'github_credentials_missing' &&
      oauthError !== 'google_credentials_missing'
    ) {
      return decodeURIComponent(oauthError);
    }
    return '';
  });
  const [oauthSetupProvider, setOauthSetupProvider] = useState(() => {
    if (oauthError === 'github_credentials_missing') return 'github';
    if (oauthError === 'google_credentials_missing') return 'google';
    return null;
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTarget]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await registerUser({
        name: values.name.trim(),
        username: values.username.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      const firstName = user?.name?.split(' ')[0] || user?.username || 'Builder';
      showToast(`Welcome to DevVerse, ${firstName}! (+20 pts)`, 'success');
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      if (msg.toLowerCase().includes('email')) {
        setError('email', { message: msg });
      } else if (msg.toLowerCase().includes('username')) {
        setError('username', { message: msg });
      } else {
        setServerError(msg);
      }
    }
  };

  const handleOAuth = (provider) => {
    window.location.href = authApi.getOAuthUrl(provider, redirectTarget);
  };

  return (
    <div className="wrap flex min-h-[calc(100vh-140px)] items-center justify-center py-12" data-testid="page-signup">
      <GlassCard className="w-full max-w-lg p-8 sm:p-10">
        <div className="mb-7 text-center">
          <span className="eyebrow justify-center">DevVerse OS · Join Ecosystem</span>
          <h1 className="mb-2 text-3xl font-bold">Create your builder ID</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Get +20 XP on signup, showcase projects, and join live hackathons.
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-[var(--coral)]/40 bg-[var(--coral-soft)] px-4 py-3 text-sm text-[var(--coral)]"
          >
            {serverError}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleOAuth('github')}
            className="w-full"
          >
            <GitHubIcon className="h-4 w-4" />
            GitHub
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleOAuth('google')}
            className="w-full"
          >
            <span className="font-bold text-[var(--cyan)]" aria-hidden="true">G</span>
            Google
          </Button>
        </div>

        <div className="relative mb-6 flex items-center justify-center">
          <div className="h-px w-full bg-[var(--border)]" />
          <span className="mono absolute bg-[var(--bg-elevated)] px-3 text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
            or sign up with email
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="signup-name">Full name</label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                  aria-hidden="true"
                />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  className={`pl-10 ${errors.name ? 'field-error' : ''}`}
                  {...register('name')}
                />
              </div>
              {errors.name && <span className="field-error-msg show">{errors.name.message}</span>}
            </div>

            <div className="field">
              <label htmlFor="signup-username">Username</label>
              <div className="relative">
                <AtSign
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                  aria-hidden="true"
                />
                <input
                  id="signup-username"
                  type="text"
                  autoComplete="username"
                  placeholder="ada.codes"
                  className={`pl-10 ${errors.username ? 'field-error' : ''}`}
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <span className="field-error-msg show">{errors.username.message}</span>
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor="signup-email">Email address</label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                aria-hidden="true"
              />
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="ada@devverse.dev"
                className={`pl-10 ${errors.email ? 'field-error' : ''}`}
                {...register('email')}
              />
            </div>
            {errors.email && <span className="field-error-msg show">{errors.email.message}</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="signup-password">Password</label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                  aria-hidden="true"
                />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min 7 chars, 1 upper, 1 num, 1 symbol"
                  className={`pl-10 pr-10 ${errors.password ? 'field-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="field-error-msg show">{errors.password.message}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="signup-confirm">Confirm password</label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                  aria-hidden="true"
                />
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'field-error' : ''}`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="field-error-msg show">{errors.confirmPassword.message}</span>
              )}
            </div>
          </div>

          <label className="mb-4 flex cursor-pointer items-start gap-2.5 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
              {...register('terms')}
            />
            <span>I agree to the DevVerse Terms of Service and Builder Community Guidelines.</span>
          </label>
          {errors.terms && (
            <div className="field-error-msg show mb-4">{errors.terms.message}</div>
          )}

          <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
            Create Account (+20 pts)
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link
            to={`/login${redirectTarget !== '/' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`}
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </GlassCard>

      <OAuthSetupModal
        provider={oauthSetupProvider}
        isOpen={Boolean(oauthSetupProvider)}
        onClose={() => setOauthSetupProvider(null)}
      />
    </div>
  );
}
