import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AtSign, Check, Eye, EyeOff, Lock, Mail, Rocket, ShieldCheck, Sparkles, User } from 'lucide-react';
import { GitHubIcon } from '../components/common/BrandIcons';
import AuthShowcase3D from '../components/common/AuthShowcase3D';
import Button from '../components/common/Button';
import OAuthSetupModal from '../components/common/OAuthSetupModal';
import { authApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { heroRobotDark } from '../utils/assets';
import { signupSchema } from '../utils/validation';

function sanitizeRedirect(raw) {
  if (!raw || typeof raw !== 'string') return '/';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  return trimmed;
}

function evaluatePassword(pw = '') {
  const checks = {
    length: pw.length >= 7,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/`~\\]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
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
    watch,
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

  const passwordVal = watch('password', '');
  const { checks: pwChecks, score: pwScore } = evaluatePassword(passwordVal);

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

  const strengthColors = ['bg-[var(--coral)]', 'bg-[var(--amber)]', 'bg-[var(--accent)]', 'bg-[var(--cyan)]'];

  return (
    <div
      className="wrap flex min-h-[calc(100vh-140px)] items-center justify-center py-10"
      data-testid="page-signup"
    >
      <div className="glass grid w-full max-w-5xl overflow-hidden rounded-[var(--radius-xl)] border-[var(--border-strong)] shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
        {/* Left 3D Showcase Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-[var(--border)] bg-[var(--bg-elevated)]/70 p-10 lg:flex">
          <AuthShowcase3D />

          <div className="relative z-10">
            <span className="eyebrow">
              <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
              DevVerse OS · New Builder
            </span>
            <h1 className="mb-3 text-4xl font-bold leading-[1.08]">
              Build in public. <span className="grad-text">Become a legend.</span>
            </h1>
            <p className="mb-8 text-sm text-[var(--text-secondary)]">
              Claim your developer handle, earn +20 XP right away, and launch your engineering
              portfolio in minutes.
            </p>

            <div className="space-y-3">
              {[
                { icon: Sparkles, text: '+20 XP Welcome Bonus & Newcomer Badge' },
                { icon: ShieldCheck, text: 'Dual-transport JWT & OAuth 2.0 security' },
                { icon: Rocket, text: 'Live GitHub repo sync & Portfolio Studio' },
              ].map((row, idx) => {
                const Icon = row.icon;
                return (
                  <motion.div
                    key={row.text}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 + idx * 0.08 }}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-3 text-xs font-medium backdrop-blur-md"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[var(--cyan)]" aria-hidden="true" />
                    <span>{row.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 flex justify-center pt-6">
            <motion.img
              src={heroRobotDark}
              alt=""
              aria-hidden="true"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="max-h-52 w-auto drop-shadow-[0_20px_40px_rgba(124,111,255,0.35)]"
            />
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 sm:p-10">
          <div className="mb-6">
            <span className="eyebrow lg:hidden">DevVerse OS · Join Ecosystem</span>
            <h2 className="mb-1.5 text-3xl font-bold">Create your builder ID</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Start shipping projects and earning XP in under 30 seconds.
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

          <div className="mb-5 grid grid-cols-2 gap-3">
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

          <div className="relative mb-5 flex items-center justify-center">
            <div className="h-px w-full bg-[var(--border)]" />
            <span className="mono absolute bg-[var(--bg-elevated)] px-3 text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
              or sign up with email
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="signup-name">Full name</label>
                <div
                  className={`flex items-center gap-3 rounded-[11px] border bg-[var(--surface)] px-3.5 transition-colors focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-hover)] ${
                    errors.name ? 'border-[var(--coral)]' : 'border-[var(--border)]'
                  }`}
                >
                  <User
                    className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                    aria-hidden="true"
                  />
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    style={{ border: 'none', background: 'transparent', padding: '12px 0' }}
                    {...register('name')}
                  />
                </div>
                {errors.name && <span className="field-error-msg show">{errors.name.message}</span>}
              </div>

              <div className="field">
                <label htmlFor="signup-username">Username</label>
                <div
                  className={`flex items-center gap-3 rounded-[11px] border bg-[var(--surface)] px-3.5 transition-colors focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-hover)] ${
                    errors.username ? 'border-[var(--coral)]' : 'border-[var(--border)]'
                  }`}
                >
                  <AtSign
                    className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                    aria-hidden="true"
                  />
                  <input
                    id="signup-username"
                    type="text"
                    autoComplete="username"
                    placeholder="ada.codes"
                    style={{ border: 'none', background: 'transparent', padding: '12px 0' }}
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
              <div
                className={`flex items-center gap-3 rounded-[11px] border bg-[var(--surface)] px-3.5 transition-colors focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-hover)] ${
                  errors.email ? 'border-[var(--coral)]' : 'border-[var(--border)]'
                }`}
              >
                <Mail
                  className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                  aria-hidden="true"
                />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="ada@devverse.dev"
                  style={{ border: 'none', background: 'transparent', padding: '12px 0' }}
                  {...register('email')}
                />
              </div>
              {errors.email && <span className="field-error-msg show">{errors.email.message}</span>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="signup-password">Password</label>
                <div
                  className={`flex items-center gap-3 rounded-[11px] border bg-[var(--surface)] px-3.5 transition-colors focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-hover)] ${
                    errors.password ? 'border-[var(--coral)]' : 'border-[var(--border)]'
                  }`}
                >
                  <Lock
                    className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                    aria-hidden="true"
                  />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Min 7 chars, 1 upper, 1 num, 1 symbol"
                    style={{ border: 'none', background: 'transparent', padding: '12px 0' }}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
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
                <div
                  className={`flex items-center gap-3 rounded-[11px] border bg-[var(--surface)] px-3.5 transition-colors focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-hover)] ${
                    errors.confirmPassword ? 'border-[var(--coral)]' : 'border-[var(--border)]'
                  }`}
                >
                  <Lock
                    className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                    aria-hidden="true"
                  />
                  <input
                    id="signup-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    style={{ border: 'none', background: 'transparent', padding: '12px 0' }}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="field-error-msg show">{errors.confirmPassword.message}</span>
                )}
              </div>
            </div>

            {/* Live Password Strength Meter */}
            {passwordVal.length > 0 && (
              <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="mb-2 grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((bar) => (
                    <div
                      key={bar}
                      className={`h-1.5 rounded-full transition-colors ${
                        pwScore > bar ? strengthColors[pwScore - 1] : 'bg-[var(--border-strong)]'
                      }`}
                    />
                  ))}
                </div>
                <div className="mono grid grid-cols-2 gap-1 text-[10.5px]">
                  {[
                    { ok: pwChecks.length, label: '7+ characters' },
                    { ok: pwChecks.upper, label: '1 uppercase' },
                    { ok: pwChecks.number, label: '1 number' },
                    { ok: pwChecks.special, label: '1 symbol' },
                  ].map((req) => (
                    <span
                      key={req.label}
                      className={`inline-flex items-center gap-1 ${
                        req.ok ? 'text-[var(--cyan)]' : 'text-[var(--text-tertiary)]'
                      }`}
                    >
                      <Check className="h-3 w-3" aria-hidden="true" />
                      {req.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

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

          <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link
              to={`/login${redirectTarget !== '/' ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`}
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <OAuthSetupModal
        provider={oauthSetupProvider}
        isOpen={Boolean(oauthSetupProvider)}
        onClose={() => setOauthSetupProvider(null)}
      />
    </div>
  );
}
