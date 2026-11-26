import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, LogOut, Moon, Palette, Sparkles, Sun } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import { authApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { changePasswordSchema } from '../utils/validation';

const ACCENT_PRESETS = [
  { id: 'violet', label: 'Violet', color: '#7c6fff' },
  { id: 'cyan', label: 'Cyan', color: '#4fe3c1' },
  { id: 'coral', label: 'Coral', color: '#ff6b5b' },
  { id: 'amber', label: 'Amber', color: '#ffb86b' },
];

export default function SettingsPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme, accent, setAccent, motion, setMotion } = useTheme();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onChangePassword = async (values) => {
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      showToast('Password updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update password', 'error');
    }
  };

  return (
    <div className="wrap page-header max-w-4xl" data-testid="page-settings">
      <span className="eyebrow">Preferences &amp; Security</span>
      <h1 className="mb-3">
        OS <span className="grad-text">Settings</span>
      </h1>
      <p className="lede mb-10">
        Customize your DevVerse workspace theme, accent glow, motion settings, and account security.
      </p>

      <div className="space-y-6">
        {/* Appearance */}
        <GlassCard className="p-7">
          <div className="mb-5 flex items-center gap-2">
            <Palette className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-xl font-bold">Appearance</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Theme Mode
              </div>
              <div className="pill-toggle">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={theme === 'dark' ? 'active' : ''}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Moon className="h-3.5 w-3.5" /> Dark
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={theme === 'light' ? 'active' : ''}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5" /> Light
                  </span>
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Accent Glow
              </div>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    aria-label={`Set accent to ${preset.label}`}
                    onClick={() => setAccent(preset.id)}
                    className={`h-9 w-9 rounded-xl border-2 transition-transform ${
                      accent === preset.id
                        ? 'scale-110 border-[var(--text-primary)]'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                    style={{ background: preset.color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Motion &amp; 3D
              </div>
              <div className="pill-toggle">
                <button
                  type="button"
                  onClick={() => setMotion('on')}
                  className={motion === 'on' ? 'active' : ''}
                >
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Full
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMotion('off')}
                  className={motion === 'off' ? 'active' : ''}
                >
                  Reduced
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Security */}
        {isAuthenticated && (
          <GlassCard className="p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[var(--cyan)]" aria-hidden="true" />
                <h2 className="text-xl font-bold">Account &amp; Password</h2>
              </div>
              <Button type="button" variant="danger" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign Out
              </Button>
            </div>

            <div className="mono mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--text-secondary)]">
              Signed in as <strong className="text-[var(--text-primary)]">@{user?.username}</strong>{' '}
              ({user?.email})
            </div>

            <form onSubmit={handleSubmit(onChangePassword)} className="max-w-md" noValidate>
              <div className="field">
                <label htmlFor="set-cur-pw">Current Password</label>
                <input
                  id="set-cur-pw"
                  type="password"
                  className={errors.currentPassword ? 'field-error' : ''}
                  {...register('currentPassword')}
                />
                {errors.currentPassword && (
                  <span className="field-error-msg show">{errors.currentPassword.message}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="set-new-pw">New Password</label>
                <input
                  id="set-new-pw"
                  type="password"
                  className={errors.newPassword ? 'field-error' : ''}
                  {...register('newPassword')}
                />
                {errors.newPassword && (
                  <span className="field-error-msg show">{errors.newPassword.message}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="set-confirm-pw">Confirm New Password</label>
                <input
                  id="set-confirm-pw"
                  type="password"
                  className={errors.confirmPassword ? 'field-error' : ''}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <span className="field-error-msg show">{errors.confirmPassword.message}</span>
                )}
              </div>

              <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                Update Password
              </Button>
            </form>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
