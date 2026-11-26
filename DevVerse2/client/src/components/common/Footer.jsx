import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link to="/" className="dock-brand mb-3 inline-flex">
              <span className="mark">DV</span>
              <span>DevVerse</span>
            </Link>
            <p className="mt-2 max-w-xs text-sm text-[var(--text-secondary)]">
              An operating system for the people who build the internet, one commit at a time.
            </p>
          </div>

          <div>
            <h4>Platform</h4>
            <Link to="/explore">Explore Projects</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/hackathons">Hackathons</Link>
            <Link to="/portfolio">Portfolio Builder</Link>
          </div>

          <div>
            <h4>Community</h4>
            <Link to="/communities">Communities</Link>
            <Link to="/codex">The Codex</Link>
            <Link to="/settings">Settings</Link>
          </div>

          <div>
            <h4>Builder</h4>
            <Link to="/profile">Your Profile</Link>
            <Link to="/submit-project">Submit a Project</Link>
            <Link to="/squads">Squads</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 DevVerse. Built with React, Express &amp; MongoDB.</span>
          <span className="mono">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
