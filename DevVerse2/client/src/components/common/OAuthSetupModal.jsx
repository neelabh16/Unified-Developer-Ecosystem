import Modal from './Modal';
import Button from './Button';

export default function OAuthSetupModal({ provider, isOpen, onClose }) {
  const isGitHub = provider === 'github';
  const title = isGitHub ? 'GitHub OAuth 2.0 Setup' : 'Google OAuth 2.0 Setup';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="540px">
      <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        DevVerse is configured for real <strong>{isGitHub ? 'GitHub' : 'Google'} OAuth 2.0</strong>.
        To enable live redirection and authentication, add your keys to{' '}
        <code className="text-[var(--accent)]">DevVerse2/server/.env</code>:
      </p>

      <div className="mono mb-5 select-all rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--text-primary)]">
        {isGitHub ? (
          <>
            <div className="mb-1 text-[var(--text-tertiary)]">
              # GitHub Developer Settings → OAuth Apps
            </div>
            <div className="mb-2 text-[var(--text-tertiary)]">
              # Callback: <b>http://localhost:5000/api/v1/auth/github/callback</b>
            </div>
            <div>GITHUB_CLIENT_ID=your_github_client_id</div>
            <div>GITHUB_CLIENT_SECRET=your_github_client_secret</div>
          </>
        ) : (
          <>
            <div className="mb-1 text-[var(--text-tertiary)]">
              # Google Cloud Console → OAuth 2.0 Client IDs
            </div>
            <div className="mb-2 text-[var(--text-tertiary)]">
              # Callback: <b>http://localhost:5000/api/v1/auth/google/callback</b>
            </div>
            <div>GOOGLE_CLIENT_ID=your_google_client_id</div>
            <div>GOOGLE_CLIENT_SECRET=your_google_client_secret</div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={onClose}>
          Got it
        </Button>
      </div>
    </Modal>
  );
}
