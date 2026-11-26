import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Code2, Eye, EyeOff, Lock, Mail, Sparkles, Trophy, Users } from 'lucide-react';
import { GitHubIcon } from '../components/common/BrandIcons';
import AuthShowcase3D from '../components/common/AuthShowcase3D';
import { TiltCard } from '../components/common/MotionPrimitives';
import Button from '../components/common/Button';
import OAuthSetupModal from '../components/common/OAuthSetupModal';
import { authApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { robotCoding } from '../utils/assets';
import { loginSchema } from '../utils/validation';

function sanitizeRedirect(raw) {
  if (!raw || typeof raw !== 'string') return '/';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  return trimmed;
}

const BENEFITS = [
  {
    icon: Users,
    title: 'Real-time Squads & Arenas',
    desc: 'Form hackathon teams, match by stack, and chat live.',
  },
  {
    icon: Code2,
    title: 'Ship & Sync with GitHub',
    desc: 'Pull repo stats automatically and showcase your builds.',
  },
  {
    icon: Trophy,
    title: 'XP Tiers & Codex Access',
    desc: 'Climb from Newcomer to Legend and unlock post-mortems at 200 XP.',
  },
];

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
    <div
      className="wrap flex min-h-[calc(100vh-140px)] items-center justify-center py-10"
      data-testid="page-login"
    >
      <div className="glass grid w-full max-w-5xl overflow-hidden rounded-[var(--radius-xl)] border-[var(--border-strong)] shadow-2xl lg:grid-cols-[1.08fr_0.92fr]">
        {/* Left 3D Showcase Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-[var(--border)] bg-[var(--bg-elevated)]/70 p-10 lg:flex">
          <AuthShowcase3D />

          <div className="relative z-10">
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              DevVerse OS · Builder Portal
            </span>
            <h1 className="mb-3 text-4xl font-bold leading-[1.08]">
              Welcome back to <span className="grad-text">DevVerse.</span>
            </h1>
            <p className="mb-8 max-w-md text-sm text-[var(--text-secondary)]">
              Continue shipping open-source projects, competing in 48-hour arenas, and growing your
              verified engineering portfolio.
            </p>

            <div className="space-y-3.5">
              {BENEFITS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
                    className="flex items-start gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3.5 backdrop-blur-md"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.title}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">{item.desc}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Floating Mascot + Testimonial */}
          <div className="relative z-10 mt-8 flex items-end justify-between gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/85 p-4 backdrop-blur-md">
              <p className="mb-2.5 text-xs italic text-[var(--text-secondary)]">
                &ldquo;Found my hackathon squad in 10 minutes and shipped our AI router to the top
                3.&rdquo;
              </p>
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2">
                  {['A', 'K', 'S'].map((ch) => (
                    <span
                      key={ch}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--bg)] bg-gradient-to-br from-[var(--violet)] to-[var(--cyan)] text-[10px] font-bold text-black"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
                <span className="mono text-[11px] text-[var(--text-tertiary)]">
                  2,400+ builders online
                </span>
              </div>
            </div>

            <motion.img
              src={robotCoding}
              alt=""
              aria-hidden="true"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="h-28 w-auto shrink-0 drop-shadow-[0_14px_28px_rgba(79,227,193,0.28)]"
            />
          </div>
        </div>

        {/* Right Form Panel */}
        <TiltCard maxTilt={3} className="flex flex-col justify-center p-8 sm:p-11">
          <div className="mb-7">
            <span className="eyebrow lg:hidden">DevVerse OS · Sign In</span>
            <h2 className="mb-1.5 text-3xl font-bold">Sign in</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Glad to see you again! Enter your credentials or use OAuth.
            </p>
          </div>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mb-5 rounded-xl border border-[var(--coral)]/40 bg-[var(--coral-soft)] px-4 py-3 text-sm text-[var(--coral)]"
            >
              {serverError}
            </motion.div>
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
              <span className="font-bold text-[var(--cyan)]" aria-hidden="true">
                G
              </span>
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
        </TiltCard>
      </div>

      <OAuthSetupModal
        provider={oauthSetupProvider}
        isOpen={Boolean(oauthSetupProvider)}
        onClose={() => setOauthSetupProvider(null)}
      />
    </div>
  );
}
