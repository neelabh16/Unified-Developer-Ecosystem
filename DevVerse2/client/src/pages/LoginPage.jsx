import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Code2, Eye, EyeOff, Lock, Mail, Sparkles, Trophy, Users } from 'lucide-react';
import { GitHubIcon } from '../components/common/BrandIcons';
import AuthShowcase3D from '../components/common/AuthShowcase3D';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import OAuthSetupModal from '../components/common/OAuthSetupModal';
import { authApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { robotCoding } from '../utils/assets';
import { loginSchema, strongPasswordSchema } from '../utils/validation';

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
  const { isAuthenticated, login, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [issuedCodeInfo, setIssuedCodeInfo] = useState(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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
        <div className="flex flex-col justify-center p-8 sm:p-11">
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
              <div
                className={`flex items-center gap-3 overflow-hidden rounded-[11px] border bg-[var(--surface)] px-3.5 transition-colors focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-hover)] ${
                  errors.identifier ? 'border-[var(--coral)]' : 'border-[var(--border)]'
                }`}
              >
                <Mail
                  className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                  aria-hidden="true"
                />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="you@domain.com or handle"
                  className="min-w-0 flex-1"
                  style={{ border: 'none', background: 'transparent', padding: '12px 0', boxShadow: 'none' }}
                  {...register('identifier')}
                />
              </div>
              {errors.identifier && (
                <span className="field-error-msg show">{errors.identifier.message}</span>
              )}
            </div>

            <div className="field">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    setForgotError('');
                    setIssuedCodeInfo(null);
                    setNewResetPassword('');
                    setForgotOpen(true);
                  }}
                  className="text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div
                className={`flex items-center gap-3 overflow-hidden rounded-[11px] border bg-[var(--surface)] px-3.5 transition-colors focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-hover)] ${
                  errors.password ? 'border-[var(--coral)]' : 'border-[var(--border)]'
                }`}
              >
                <Lock
                  className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="min-w-0 flex-1"
                  style={{ border: 'none', background: 'transparent', padding: '12px 0', boxShadow: 'none' }}
                  onKeyUp={(e) => setCapsLockOn(e.getModifierState?.('CapsLock') || false)}
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
        </div>
      </div>

      <OAuthSetupModal
        provider={oauthSetupProvider}
        isOpen={Boolean(oauthSetupProvider)}
        onClose={() => setOauthSetupProvider(null)}
      />

      <Modal
        isOpen={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Reset your password"
        maxWidth="440px"
      >
        {forgotError && (
          <div className="mb-4 rounded-xl border border-[var(--coral)]/40 bg-[var(--coral-soft)] px-3.5 py-2.5 text-xs text-[var(--coral)]">
            {forgotError}
          </div>
        )}

        {forgotStep === 1 ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setForgotError('');
              if (!forgotIdentifier.trim()) {
                setForgotError('Enter your email or username.');
                return;
              }
              setForgotLoading(true);
              try {
                const res = await authApi.forgotPassword(forgotIdentifier.trim());
                const code = res?.data?.resetCode || '';
                setIssuedCodeInfo(res?.data || null);
                setForgotCode(code);
                setForgotStep(2);
                showToast('Reset code generated', 'success');
              } catch (err) {
                setForgotError(err.message || 'Could not generate reset code.');
              } finally {
                setForgotLoading(false);
              }
            }}
          >
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Enter your DevVerse email or username to generate a 15-minute password reset code.
            </p>
            <div className="field">
              <label htmlFor="forgot-id">Email or username</label>
              <input
                id="forgot-id"
                type="text"
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                placeholder="you@domain.com or handle"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" loading={forgotLoading} className="w-full">
              Generate Reset Code
            </Button>
          </form>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setForgotError('');
              const parsed = strongPasswordSchema.safeParse(newResetPassword);
              if (!parsed.success) {
                setForgotError(parsed.error.errors[0]?.message || 'Use a stronger password.');
                return;
              }
              setForgotLoading(true);
              try {
                await authApi.resetPassword({
                  code: forgotCode.trim(),
                  newPassword: newResetPassword,
                });
                await refreshUser();
                setForgotOpen(false);
                showToast('Password updated and signed in!', 'success');
                navigate(redirectTarget, { replace: true });
              } catch (err) {
                setForgotError(err.message || 'Failed to reset password.');
              } finally {
                setForgotLoading(false);
              }
            }}
          >
            {issuedCodeInfo?.resetCode && (
              <div className="mb-4 rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan-soft)] p-3 text-xs">
                <div className="mb-1 font-semibold text-[var(--cyan)]">
                  Reset code for {issuedCodeInfo.maskedEmail || forgotIdentifier}:
                </div>
                <div className="mono text-base font-bold tracking-widest text-[var(--text-primary)]">
                  {issuedCodeInfo.resetCode}
                </div>
              </div>
            )}
            <div className="field">
              <label htmlFor="forgot-code">Reset Code</label>
              <input
                id="forgot-code"
                type="text"
                value={forgotCode}
                onChange={(e) => setForgotCode(e.target.value)}
                placeholder="8-character reset code"
              />
            </div>
            <div className="field">
              <label htmlFor="forgot-new-pw">New Password</label>
              <input
                id="forgot-new-pw"
                type="password"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                placeholder="Min 7 chars, 1 upper, 1 num, 1 symbol"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setForgotStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={forgotLoading}
                className="flex-1"
              >
                Reset Password &amp; Sign In
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
