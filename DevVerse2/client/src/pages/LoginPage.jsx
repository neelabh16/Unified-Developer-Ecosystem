import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { GitHubIcon } from '../components/common/BrandIcons';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import OAuthSetupModal from '../components/common/OAuthSetupModal';
import { authApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { loginSchema } from '../utils/validation';

function sanitizeRedirect(raw) {
  if (!raw || typeof raw !== 'string') return '/';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  return trimmed;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, login } = useAuth();
  const { showToast } = useToast();

  const redirectTarget = sanitizeRedirect(searchParams.get('redirect'));
  const oauthError = searchParams.get('oauth_error');

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
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
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', remember: true },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTarget]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const id = values.identifier.trim().toLowerCase();
      const user = await login({
        email: id,
        username: id,
        password: values.password,
      });
      const firstName = user?.name?.split(' ')[0] || user?.username || 'Builder';
      showToast(`Welcome back, ${firstName}!`, 'success');
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleOAuth = (provider) => {
    window.location.href = authApi.getOAuthUrl(provider, redirectTarget);
  };

  return (
    <div className="wrap flex min-h-[calc(100vh-140px)] items-center justify-center py-12" data-testid="page-login">
      <GlassCard className="w-full max-w-md p-8 sm:p-10">
        <div className="mb-7 text-center">
          <span className="eyebrow justify-center">DevVerse OS · Sign In</span>
          <h1 className="mb-2 text-3xl font-bold">Welcome back</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Sign in to ship projects, join squads, and climb the leaderboard.
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
            or with credentials
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="login-identifier">Email or username</label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                aria-hidden="true"
              />
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                placeholder="you@domain.com or handle"
                className={`pl-10 ${errors.identifier ? 'field-error' : ''}`}
                {...register('identifier')}
              />
            </div>
            {errors.identifier && (
              <span className="field-error-msg show">{errors.identifier.message}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                aria-hidden="true"
              />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`pl-10 pr-10 ${errors.password ? 'field-error' : ''}`}
                onKeyUp={(e) => setCapsLockOn(e.getModifierState?.('CapsLock') || false)}
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
            {capsLockOn && (
              <span className="mono text-[11px] text-[var(--amber)]">Caps Lock is on</span>
            )}
            {errors.password && (
              <span className="field-error-msg show">{errors.password.message}</span>
            )}
          </div>

          <Button type="submit" variant="primary" loading={isSubmitting} className="mt-2 w-full">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          New to DevVerse?{' '}
          <Link
            to={`/signup${redirectTarget !== '/' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`}
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            Create an account
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
